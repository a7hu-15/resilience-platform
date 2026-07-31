import { executeTestPipeline } from '../src/modules/pipeline/orchestrator';
import { randomUUID } from 'crypto';

// Mock the external dependencies for the integration test
jest.mock('../src/modules/security/trivy');
jest.mock('../src/modules/security/iac');
jest.mock('../src/modules/security/dast');
jest.mock('../src/modules/docker/sandbox');
jest.mock('../src/modules/k8s/namespace');
jest.mock('../src/modules/k8s/deployment');
jest.mock('../src/modules/k8s/polling');
jest.mock('../src/modules/load/k6');
jest.mock('../src/modules/chaos/experiments');
jest.mock('../src/modules/chaos/recovery');
jest.mock('../src/modules/reports/pdf');

import * as trivyMock from '../src/modules/security/trivy';
import * as iacMock from '../src/modules/security/iac';
import * as dastMock from '../src/modules/security/dast';
import * as sandboxMock from '../src/modules/docker/sandbox';
import * as namespaceMock from '../src/modules/k8s/namespace';
import * as k6Mock from '../src/modules/load/k6';
import * as recoveryMock from '../src/modules/chaos/recovery';
import * as pollingMock from '../src/modules/k8s/polling';

describe('Integration: Orchestration Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (namespaceMock.createDynamicNamespace as jest.Mock).mockResolvedValue('test-ns');
    (pollingMock.waitForDeploymentReady as jest.Mock).mockResolvedValue(1500); // 1.5s startup
    (sandboxMock.provisionSandboxContainer as jest.Mock).mockResolvedValue({
      containerName: 'sandbox-test',
      hostPort: 3000,
      targetUrl: 'http://localhost:3000',
      isHttpServer: true
    });
    (sandboxMock.teardownSandboxContainer as jest.Mock).mockResolvedValue(undefined);
    (iacMock.runIacScan as jest.Mock).mockResolvedValue({
      missingLimitsCount: 0,
      rootPrivilegeCount: 0,
      networkPolicyFlawsCount: 0
    });
    (dastMock.runDastScan as jest.Mock).mockResolvedValue({
      sqlInjectionCount: 0,
      xssCount: 0,
      brokenAuthCount: 0
    });
  });

  it('should successfully process a known GOOD image with a high Master Score', async () => {
    // A known good image (like nginx:alpine) has zero vulnerabilities, fast recovery, good perf
    (trivyMock.runTrivyScan as jest.Mock).mockResolvedValue({
      critical: 0, high: 0, medium: 0, low: 0, total: 0, rawJson: {}
    });
    
    (k6Mock.runLoadTest as jest.Mock).mockResolvedValue({
      p95LatencyMs: 45,
      requestsPerSecond: 2000,
      successRate: 100,
      rawOutput: {}
    });

    (recoveryMock.observeRecovery as jest.Mock).mockResolvedValue(2); // 2 seconds to recover (perfect)

    const testRunId = randomUUID();
    const report = await executeTestPipeline('nginx:alpine', testRunId);

    // Security: 100, Perf: 100, Resilience: 100 -> Master: 100
    expect(report.securityScore).toBe(100);
    expect(report.performanceScore).toBe(100);
    expect(report.resilienceScore).toBe(100);
    expect(report.masterScore).toBe(100);
  });

  it('should severely penalize a known BAD image with a very low Master Score', async () => {
    // A known bad image (like old vulnerable wordpress)
    (trivyMock.runTrivyScan as jest.Mock).mockResolvedValue({
      critical: 4, // -60
      high: 5,     // -25
      medium: 10,  // -20 -> Total deduction: 105. Score floored to 0.
      low: 0, total: 19, rawJson: {}
    });

    (iacMock.runIacScan as jest.Mock).mockResolvedValue({
      missingLimitsCount: 2,
      rootPrivilegeCount: 4, // -100 -> Score floored to 0
      networkPolicyFlawsCount: 2
    });

    (dastMock.runDastScan as jest.Mock).mockResolvedValue({
      sqlInjectionCount: 5, // -100 -> Score floored to 0
      xssCount: 2,
      brokenAuthCount: 1
    });
    
    (k6Mock.runLoadTest as jest.Mock).mockResolvedValue({
      p95LatencyMs: 500, // 400ms over -> -40 points
      requestsPerSecond: 150,
      successRate: 95, // 4% drop -> -40 points. Score = 20.
      rawOutput: {}
    });

    (recoveryMock.observeRecovery as jest.Mock).mockResolvedValue(45); // 40s over -> -80 points. Score = 20.

    const testRunId = randomUUID();
    const report = await executeTestPipeline('vulnerable-wordpress:old', testRunId);

    expect(report.securityScore).toBe(0);
    expect(report.iacScore).toBe(0);
    expect(report.dastScore).toBe(0);
    expect(report.performanceScore).toBe(20);
    expect(report.resilienceScore).toBe(20);
    
    // Master (5-pillar 20% weight each): (0*0.2) + (0*0.2) + (0*0.2) + (20*0.2) + (20*0.2) = 0 + 0 + 0 + 4 + 4 = 8
    expect(report.masterScore).toBe(8);
  });
});

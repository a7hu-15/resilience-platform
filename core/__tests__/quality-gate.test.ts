import { evaluateQualityGate, QualityGateConfig } from '../src/modules/scoring/algorithms';
import { TrivyScanResult } from '../src/modules/security/trivy';
import { LoadTestResult } from '../src/modules/load/k6';

describe('Quality Gate Evaluation', () => {
  const mockSecurityPassed: TrivyScanResult = {
    critical: 0, high: 1, medium: 2, low: 5, unknown: 0, total: 8, rawJson: {}
  };

  const mockSecurityFailed: TrivyScanResult = {
    critical: 2, high: 4, medium: 5, low: 10, unknown: 0, total: 21, rawJson: {}
  };

  const mockLoadPassed: LoadTestResult = {
    p95LatencyMs: 120,
    requestsPerSecond: 250,
    successRate: 99.5,
    rawOutput: {}
  };

  const mockLoadFailed: LoadTestResult = {
    p95LatencyMs: 1200,
    requestsPerSecond: 50,
    successRate: 85,
    rawOutput: {}
  };

  it('should pass Quality Gate when all SLO metrics satisfy default thresholds', () => {
    const result = evaluateQualityGate(mockSecurityPassed, mockLoadPassed, 12, 85);
    expect(result.passed).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('should fail Quality Gate when critical CVEs exceed threshold', () => {
    const config: QualityGateConfig = { maxCriticalCVEs: 0 };
    const result = evaluateQualityGate(mockSecurityFailed, mockLoadPassed, 5, 90, config);
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain('Critical CVEs (2) exceeded threshold of 0');
  });

  it('should fail Quality Gate when P95 latency exceeds threshold', () => {
    const config: QualityGateConfig = { maxP95LatencyMs: 500 };
    const result = evaluateQualityGate(mockSecurityPassed, mockLoadFailed, 5, 80, config);
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain('P95 Latency (1200ms) exceeded threshold of 500ms');
  });

  it('should fail Quality Gate when master score is below minimum threshold', () => {
    const config: QualityGateConfig = { minMasterScore: 85 };
    const result = evaluateQualityGate(mockSecurityPassed, mockLoadPassed, 5, 75, config);
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain('Master Score (75) fell below minimum required score of 85');
  });
});

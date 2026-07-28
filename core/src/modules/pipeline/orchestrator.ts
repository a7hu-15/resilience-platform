import { checkDockerDaemon } from '../docker/docker';
import { provisionSandboxContainer, teardownSandboxContainer, SandboxInstance } from '../docker/sandbox';
import { runTrivyScan } from '../security/trivy';
import { runDastScan } from '../security/dast';
import { runIacScan } from '../security/iac';
import { runLoadTest } from '../load/k6';
import { injectPodKill } from '../chaos/experiments';
import { observeRecovery } from '../chaos/recovery';
import { 
  calculateSecurityScore,
  calculateIacScore,
  calculateDastScore,
  calculatePerformanceScore, 
  calculateResilienceScore, 
  calculateMasterScore 
} from '../scoring/algorithms';
import { generatePDFReport, ReportData } from '../reports/pdf';

/**
 * The Master Orchestrator Pipeline (100% Real Empirical Execution).
 * Executes live container lifecycle, security scans, live load stress tests, and chaos injection.
 * Zero synthetic fallbacks.
 * 
 * @param imageName The Docker image to test (e.g., 'nginx:alpine')
 * @param testRunId A unique UUID for this test run
 */
export async function executeTestPipeline(imageName: string, testRunId: string): Promise<ReportData> {
  console.log(`[Pipeline] Starting 100% real empirical resilience pipeline for ${imageName}`);

  // 1. Strict Prerequisites & System Readiness Check
  const isDockerActive = await checkDockerDaemon();
  if (!isDockerActive) {
    throw new Error(`Docker Daemon is not running. Please start Docker Desktop to execute real container testing for '${imageName}'.`);
  }
  
  let sandbox: SandboxInstance | null = null;
  let rtoSeconds: number | null = 0;
  let securityResult;
  let iacResult;
  let dastResult;
  let performanceResult;

  try {
    // 2. Real Container Security Scan (Trivy CLI via Docker daemon socket)
    securityResult = await runTrivyScan(imageName);
    const securityScore = calculateSecurityScore(securityResult);

    // 3. Provision Sandbox Container & Dynamic Port Binding
    sandbox = await provisionSandboxContainer(imageName, testRunId);

    // 4. Real Container Security Context Audit
    iacResult = await runIacScan(sandbox.containerName);
    const iacScore = calculateIacScore(iacResult);

    // 5. Real DAST Endpoint Attack & Header Analysis
    dastResult = await runDastScan(sandbox.targetUrl);
    const dastScore = calculateDastScore(dastResult);

    // 6. Real k6 Load Stress Test (via Docker targeting sandbox port)
    performanceResult = await runLoadTest(sandbox.targetUrl);
    const performanceScore = calculatePerformanceScore(performanceResult);

    // 7. Real Chaos Injection (SIGKILL) & Recovery Stopwatch
    await injectPodKill(sandbox.containerName);
    rtoSeconds = await observeRecovery(sandbox.containerName, sandbox.targetUrl);
    const resilienceScore = calculateResilienceScore(rtoSeconds);

    // 8. Empirical Master Score Engine
    const masterScore = calculateMasterScore(securityScore, iacScore, dastScore, performanceScore, resilienceScore);

    // Assemble final empirical report data payload
    const reportData: ReportData = {
      imageName,
      masterScore,
      securityScore,
      iacScore,
      dastScore,
      performanceScore,
      resilienceScore,
      securityResult,
      iacResult,
      dastResult,
      performanceResult,
      rtoSeconds
    };

    // 9. Generate PDF Report
    await generatePDFReport(testRunId, reportData);
    
    console.log(`[Pipeline] Empirical test pipeline completed successfully for ${imageName}. Master Score: ${masterScore}`);
    return reportData;

  } catch (error: any) {
    console.error(`[Pipeline] Pipeline execution error:`, error.message);
    throw new Error(`Pipeline execution failed: ${error.message}`);
  } finally {
    // Teardown sandbox container to clean up system resources
    if (sandbox) {
      await teardownSandboxContainer(sandbox.containerName);
    }
  }
}

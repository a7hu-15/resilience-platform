import { runTrivyScan } from '../security/trivy';
import { createDynamicNamespace, deleteNamespace } from '../k8s/namespace';
import { deployTargetImage } from '../k8s/deployment';
import { waitForDeploymentReady } from '../k8s/polling';
import { runLoadTest } from '../load/k6';
import { injectPodKill } from '../chaos/experiments';
import { observeRecovery } from '../chaos/recovery';
import { 
  calculateSecurityScore, 
  calculatePerformanceScore, 
  calculateResilienceScore, 
  calculateMasterScore 
} from '../scoring/algorithms';
import { generatePDFReport, ReportData } from '../reports/pdf';

/**
 * The Master Orchestrator Pipeline.
 * Connects Security, Kubernetes, Load, Chaos, Scoring, and Reporting engines 
 * into a single sequential automated workflow.
 * 
 * @param imageName The Docker image to test
 * @param testRunId A unique UUID for this test run (used for tracking and PDFs)
 */
export async function executeTestPipeline(imageName: string, testRunId: string): Promise<ReportData> {
  console.log(`[Pipeline] Starting end-to-end resilience test for ${imageName}`);
  
  let namespace = '';
  
  try {
    // 1. Security Engine
    const securityResult = await runTrivyScan(imageName);
    const securityScore = calculateSecurityScore(securityResult);

    // 2. Kubernetes Environment Engine
    namespace = await createDynamicNamespace();
    await deployTargetImage(namespace, imageName);
    await waitForDeploymentReady(namespace); // Wait for pods to spin up

    // 3. Load Testing Engine
    // In a real k8s cluster, this would point to the ClusterIP/LoadBalancer.
    // We mock the local target URL for logic continuity.
    const targetUrl = `http://target-service.${namespace}.svc.cluster.local`;
    const performanceResult = await runLoadTest(targetUrl);
    const performanceScore = calculatePerformanceScore(performanceResult);

    // 4. Chaos Engine
    await injectPodKill(namespace);
    const rtoSeconds = await observeRecovery(namespace);
    const resilienceScore = calculateResilienceScore(rtoSeconds);

    // 5. Scoring Engine
    const masterScore = calculateMasterScore(securityScore, performanceScore, resilienceScore);

    // 6. Cleanup Engine
    await deleteNamespace(namespace);
    
    // Assemble final data payload
    const reportData: ReportData = {
      imageName,
      masterScore,
      securityScore,
      performanceScore,
      resilienceScore,
      securityResult,
      performanceResult,
      rtoSeconds
    };

    // 7. Reporting Engine
    await generatePDFReport(testRunId, reportData);
    
    console.log(`[Pipeline] Test pipeline completed successfully. Master Score: ${masterScore}`);
    return reportData;

  } catch (error: any) {
    console.error(`[Pipeline] Critical pipeline failure:`, error.message);
    // Ensure we clean up the namespace if an error occurred mid-flight
    if (namespace) {
      await deleteNamespace(namespace);
    }
    throw new Error(`Pipeline execution failed: ${error.message}`);
  }
}

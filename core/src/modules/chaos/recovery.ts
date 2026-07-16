import { k8sAppsV1Api } from '../k8s/client';
import { deleteNamespace } from '../k8s/namespace';

/**
 * Observes the namespace after a chaos experiment to calculate the exact
 * Recovery Time Objective (RTO) in seconds.
 * 
 * @param namespace The target namespace
 * @returns RTO in seconds, or null if it failed to recover
 */
export async function observeRecovery(namespace: string): Promise<number | null> {
  console.log(`[Chaos Engine] Observing recovery window for ${namespace}...`);
  
  const startTime = Date.now();
  const maxObservationWindowMs = 120000; // 2 minutes max wait

  while (Date.now() - startTime < maxObservationWindowMs) {
    try {
      const response = await k8sAppsV1Api.readNamespacedDeployment({
        name: 'target-deployment',
        namespace
      });

      const deployment = response.body;
      const desiredReplicas = deployment.spec?.replicas || 1;
      const readyReplicas = deployment.status?.readyReplicas || 0;

      if (readyReplicas >= desiredReplicas) {
        const recoveryTimeMs = Date.now() - startTime;
        const rtoSeconds = recoveryTimeMs / 1000;
        console.log(`[Chaos Engine] Recovery successful. RTO: ${rtoSeconds}s`);
        return rtoSeconds;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Deployment might be temporarily unreachable during severe chaos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.warn(`[Chaos Engine] Failed to recover within observation window.`);
  return null;
}

/**
 * Cleans up the namespace and completely purges the test environment.
 * 
 * @param namespace The namespace to delete
 */
export async function cleanupTestEnvironment(namespace: string): Promise<void> {
  console.log(`[Chaos Engine] Initiating cleanup for ${namespace}...`);
  await deleteNamespace(namespace);
  console.log(`[Chaos Engine] Cleanup complete.`);
}

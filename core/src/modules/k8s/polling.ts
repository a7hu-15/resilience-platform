import { k8sAppsV1Api } from './client';

/**
 * Polls the Kubernetes API to wait until the deployment is fully ready.
 * Calculates the exact startup time in milliseconds.
 * 
 * @param namespace The namespace the deployment is in
 * @param deploymentName The name of the deployment (default: 'target-deployment')
 * @returns The startup time in milliseconds
 */
export async function waitForDeploymentReady(namespace: string, deploymentName: string = 'target-deployment'): Promise<number> {
  console.log(`[Kubernetes Engine] Waiting for deployment ${deploymentName} to become ready in ${namespace}...`);
  
  const startTime = Date.now();
  const timeoutMs = 60000 * 5; // 5 minute timeout
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await k8sAppsV1Api.readNamespacedDeployment({
        name: deploymentName,
        namespace
      });

      const deployment = response.body;
      
      const desiredReplicas = deployment.spec?.replicas || 1;
      const readyReplicas = deployment.status?.readyReplicas || 0;

      if (readyReplicas >= desiredReplicas) {
        const startupTimeMs = Date.now() - startTime;
        console.log(`[Kubernetes Engine] Deployment is ready! Startup time: ${startupTimeMs}ms`);
        return startupTimeMs;
      }

      // Wait 3 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.warn(`[Kubernetes Engine] Polling error:`, error.message);
      // Wait before retrying in case of temporary API blip
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  throw new Error(`Deployment ${deploymentName} timed out after 5 minutes.`);
}

import { k8sAppsV1Api, k8sCoreV1Api } from './client';
import { V1Deployment, V1Service } from '@kubernetes/client-node';

/**
 * Deploys the target Docker image to the dynamically generated namespace.
 * 
 * @param namespace The isolated namespace created for this test run
 * @param imageName The Docker image to deploy
 */
export async function deployTargetImage(namespace: string, imageName: string): Promise<void> {
  const deploymentName = 'target-deployment';

  const deployment: V1Deployment = {
    metadata: {
      name: deploymentName,
      namespace: namespace,
      labels: { app: 'target-app' }
    },
    spec: {
      replicas: 2,
      selector: {
        matchLabels: { app: 'target-app' }
      },
      template: {
        metadata: {
          labels: { app: 'target-app' }
        },
        spec: {
          containers: [
            {
              name: 'target-container',
              image: imageName,
              // Avoid pull errors for local/test images
              imagePullPolicy: 'IfNotPresent',
              ports: [{ containerPort: 80 }] 
            }
          ]
        }
      }
    }
  };

  const service: V1Service = {
    metadata: {
      name: 'target-service',
      namespace: namespace
    },
    spec: {
      selector: { app: 'target-app' },
      ports: [{ port: 80, targetPort: 80 }],
      type: 'ClusterIP'
    }
  };

  try {
    console.log(`[Kubernetes Engine] Deploying ${imageName} to namespace ${namespace}...`);
    
    await k8sAppsV1Api.createNamespacedDeployment({
      namespace,
      body: deployment
    });

    await k8sCoreV1Api.createNamespacedService({
      namespace,
      body: service
    });

    console.log(`[Kubernetes Engine] Deployment and Service created successfully.`);
  } catch (error: any) {
    console.error(`[Kubernetes Engine] Failed to deploy image:`, error.message);
    throw new Error('Failed to deploy target image to Kubernetes cluster.');
  }
}

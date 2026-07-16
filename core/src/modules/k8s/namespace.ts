import { k8sCoreV1Api } from './client';
import { V1Namespace } from '@kubernetes/client-node';
import { randomBytes } from 'crypto';

/**
 * Creates a dynamic, isolated Kubernetes namespace for a specific test run.
 * 
 * @returns The name of the generated namespace
 */
export async function createDynamicNamespace(): Promise<string> {
  const hash = randomBytes(4).toString('hex');
  const namespaceName = `test-run-${hash}`;

  const namespace: V1Namespace = {
    metadata: {
      name: namespaceName,
      labels: {
        'managed-by': 'resilience-platform',
        'test-run': 'true'
      }
    }
  };

  try {
    console.log(`[Kubernetes Engine] Creating dynamic namespace: ${namespaceName}`);
    await k8sCoreV1Api.createNamespace({ body: namespace });
    return namespaceName;
  } catch (error: any) {
    console.error(`[Kubernetes Engine] Failed to create namespace ${namespaceName}:`, error.message);
    throw new Error('Failed to provision isolated Kubernetes namespace.');
  }
}

/**
 * Deletes a dynamically generated namespace, completely tearing down the environment.
 */
export async function deleteNamespace(namespaceName: string): Promise<void> {
  try {
    console.log(`[Kubernetes Engine] Tearing down namespace: ${namespaceName}`);
    await k8sCoreV1Api.deleteNamespace({ name: namespaceName });
  } catch (error: any) {
    console.error(`[Kubernetes Engine] Failed to delete namespace ${namespaceName}:`, error.message);
  }
}

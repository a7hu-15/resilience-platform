import { k8sCoreV1Api } from '../k8s/client';
import * as k8s from '@kubernetes/client-node';

// Chaos Mesh uses CustomResourceDefinitions (CRDs), so we need the CustomObjects API
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sCustomObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

/**
 * Injects a PodKill Chaos Mesh experiment into the target namespace.
 * 
 * @param namespace The namespace where the target pods are running
 */
export async function injectPodKill(namespace: string): Promise<void> {
  console.log(`[Chaos Engine] Injecting PodKill into ${namespace}...`);

  const podChaos = {
    apiVersion: 'chaos-mesh.org/v1alpha1',
    kind: 'PodChaos',
    metadata: {
      name: `pod-kill-${namespace}`,
      namespace: namespace
    },
    spec: {
      action: 'pod-kill',
      mode: 'one',
      selector: {
        namespaces: [namespace],
        labelSelectors: {
          app: 'target-app'
        }
      },
      duration: '30s'
    }
  };

  try {
    await k8sCustomObjectsApi.createNamespacedCustomObject({
      group: 'chaos-mesh.org',
      version: 'v1alpha1',
      namespace,
      plural: 'podchaos',
      body: podChaos
    });
    console.log(`[Chaos Engine] PodKill successfully injected.`);
  } catch (error: any) {
    console.error(`[Chaos Engine] Failed to inject PodKill:`, error.message);
    throw new Error('Chaos Mesh injection failed.');
  }
}

/**
 * Injects a CPU Stress Chaos Mesh experiment into the target namespace.
 * 
 * @param namespace The namespace where the target pods are running
 */
export async function injectCPUStress(namespace: string): Promise<void> {
  console.log(`[Chaos Engine] Injecting CPU Stress into ${namespace}...`);

  const stressChaos = {
    apiVersion: 'chaos-mesh.org/v1alpha1',
    kind: 'StressChaos',
    metadata: {
      name: `cpu-stress-${namespace}`,
      namespace: namespace
    },
    spec: {
      mode: 'all',
      selector: {
        namespaces: [namespace],
        labelSelectors: {
          app: 'target-app'
        }
      },
      stressors: {
        cpu: {
          workers: 1,
          load: 80
        }
      },
      duration: '60s'
    }
  };

  try {
    await k8sCustomObjectsApi.createNamespacedCustomObject({
      group: 'chaos-mesh.org',
      version: 'v1alpha1',
      namespace,
      plural: 'stresschaos',
      body: stressChaos
    });
    console.log(`[Chaos Engine] CPU Stress successfully injected.`);
  } catch (error: any) {
    console.error(`[Chaos Engine] Failed to inject CPU Stress:`, error.message);
    throw new Error('Chaos Mesh injection failed.');
  }
}

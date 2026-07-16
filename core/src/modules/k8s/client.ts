import * as k8s from '@kubernetes/client-node';

// Initialize the Kubernetes client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export const k8sCoreV1Api = kc.makeApiClient(k8s.CoreV1Api);
export const k8sAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);

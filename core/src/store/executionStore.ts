import { create } from 'zustand';

export type StageStatus = 'pending' | 'running' | 'success' | 'failed';

export interface Stage {
  id: string;
  label: string;
  status: StageStatus;
}

export interface LogEntry {
  stageId: string;
  time: string;
  message: string;
}

export interface ClusterNode {
  id: string;
  name: string;
  status: 'Ready' | 'NotReady';
  pods: Pod[];
}

export interface Pod {
  id: string;
  name: string;
  status: 'Pending' | 'ContainerCreating' | 'Running' | 'Terminating' | 'Deleted';
  cpu?: string;
  memory?: string;
  isTarget?: boolean;
}

interface ExecutionState {
  testRunId: string | null;
  isComplete: boolean;
  score: number | null;
  stages: Stage[];
  logs: LogEntry[];
  clusterNodes: ClusterNode[];
  
  // Actions
  initializeTest: (testRunId: string) => void;
  updateStageStatus: (stageId: string, status: StageStatus) => void;
  addLog: (stageId: string, message: string) => void;
  updatePodStatus: (nodeId: string, podId: string, status: Pod['status']) => void;
  setComplete: (score: number) => void;
}

const INITIAL_STAGES: Stage[] = [
  { id: 'image', label: 'Image Verification', status: 'pending' },
  { id: 'deploy', label: 'Deployment', status: 'pending' },
  { id: 'validate', label: 'Validation', status: 'pending' },
  { id: 'chaos', label: 'Chaos (Pod Kill)', status: 'pending' },
  { id: 'cpu', label: 'CPU Stress', status: 'pending' },
  { id: 'mem', label: 'Memory Stress', status: 'pending' },
  { id: 'network', label: 'Network Delay', status: 'pending' },
  { id: 'analysis', label: 'Analysis & Scoring', status: 'pending' }
];

const INITIAL_NODES: ClusterNode[] = [
  {
    id: 'node-1',
    name: 'eks-node-group-1',
    status: 'Ready',
    pods: [
      { id: 'pod-1', name: 'app-deployment-abc1', status: 'Running', cpu: '12%', memory: '84 MB' }
    ]
  },
  {
    id: 'node-2',
    name: 'eks-node-group-2',
    status: 'Ready',
    pods: [
      { id: 'pod-2', name: 'app-deployment-xyz9', status: 'Running', cpu: '10%', memory: '82 MB' }
    ]
  }
];

export const useExecutionStore = create<ExecutionState>((set) => ({
  testRunId: null,
  isComplete: false,
  score: null,
  stages: INITIAL_STAGES,
  logs: [],
  clusterNodes: INITIAL_NODES,

  initializeTest: (testRunId) => set({ 
    testRunId, 
    isComplete: false, 
    score: null, 
    stages: INITIAL_STAGES,
    logs: [],
    clusterNodes: INITIAL_NODES
  }),

  updateStageStatus: (stageId, status) => set((state) => ({
    stages: state.stages.map(s => s.id === stageId ? { ...s, status } : s)
  })),

  addLog: (stageId, message) => set((state) => ({
    logs: [...state.logs, { stageId, time: new Date().toLocaleTimeString(), message }]
  })),

  updatePodStatus: (nodeId, podId, status) => set((state) => ({
    clusterNodes: state.clusterNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          pods: node.pods.map(pod => pod.id === podId ? { ...pod, status } : pod)
        };
      }
      return node;
    })
  })),

  setComplete: (score) => set({ isComplete: true, score })
}));

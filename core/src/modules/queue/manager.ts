import { pipelineQueue } from './redis';

export interface PipelineJob {
  id: string;
  imageName: string;
  userId: string;
  options?: any;
}

class QueueManager {
  public async enqueueJob(id: string, imageName: string, userId: string, options?: any) {
    console.log(`[Queue Manager] Enqueuing job ${id} to Redis for image ${imageName}`);
    
    await pipelineQueue.add(
      'execute-pipeline',
      {
        id,
        imageName,
        userId,
        options
      },
      { jobId: id }
    );
    
    return { id, status: 'QUEUED' };
  }
}

export const queueManager = new QueueManager();

export interface PipelineJob {
  id: string;
  imageName: string;
  userId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

class QueueManager {
  private queue: PipelineJob[] = [];
  private activeJobs: Map<string, PipelineJob> = new Map();

  public enqueueJob(id: string, imageName: string, userId: string): PipelineJob {
    const job: PipelineJob = {
      id,
      imageName,
      userId,
      status: 'QUEUED',
      createdAt: new Date(),
    };
    this.queue.push(job);
    this.activeJobs.set(id, job);
    console.log(`[Queue Manager] Enqueued job ${id} for image ${imageName}`);
    return job;
  }

  public getJobStatus(id: string): PipelineJob | undefined {
    return this.activeJobs.get(id);
  }

  public markProcessing(id: string) {
    const job = this.activeJobs.get(id);
    if (job) job.status = 'PROCESSING';
  }

  public markCompleted(id: string) {
    const job = this.activeJobs.get(id);
    if (job) job.status = 'COMPLETED';
  }

  public markFailed(id: string) {
    const job = this.activeJobs.get(id);
    if (job) job.status = 'FAILED';
  }
}

export const queueManager = new QueueManager();

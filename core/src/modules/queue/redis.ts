import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const pipelineQueueName = 'resilience-pipeline-queue';

export const pipelineQueue = new Queue(pipelineQueueName, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const queueEvents = new QueueEvents(pipelineQueueName, {
  connection: redisConnection,
});

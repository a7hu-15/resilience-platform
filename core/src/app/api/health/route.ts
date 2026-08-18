import { NextResponse } from 'next/server';
import prisma from '../../../db/prisma';
import IORedis from 'ioredis';
import { pipelineQueueName } from '../../../modules/queue/redis';
import { Queue } from 'bullmq';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    frontend: 'Healthy',
    backend: 'Healthy',
    database: 'Checking...',
    redis: 'Checking...',
    worker: 'Checking...',
    docker: 'Checking...',
    kubernetes: 'Warning' // Assuming no local cluster for demo mode
  };

  const queueStats = {
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0,
    activeWorkers: 0
  };

  try {
    // 1. Check Database
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'Healthy';
  } catch (e) {
    health.database = 'Offline';
  }

  try {
    // 2. Check Redis & BullMQ
    const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: 1, showFriendlyErrorStack: true });
    await redis.ping();
    health.redis = 'Healthy';

    const queue = new Queue(pipelineQueueName, { connection: redis });
    const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed');
    const workers = await queue.getWorkers();

    queueStats.queued = counts.wait;
    queueStats.running = counts.active;
    queueStats.completed = counts.completed;
    queueStats.failed = counts.failed;
    queueStats.activeWorkers = workers.length;

    health.worker = workers.length > 0 ? 'Healthy' : 'Warning';

    await redis.quit();
    await queue.close();
  } catch (e) {
    health.redis = 'Offline';
    health.worker = 'Offline';
  }

  try {
    // 3. Check Docker
    execSync('docker info', { stdio: 'ignore' });
    health.docker = 'Healthy';
  } catch (e) {
    health.docker = 'Offline';
  }

  return NextResponse.json({
    status: 'success',
    platform: health,
    queue: queueStats
  }, { status: 200 });
}

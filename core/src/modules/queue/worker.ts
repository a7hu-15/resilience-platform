import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { executeTestPipeline } from '../pipeline/orchestrator';
import { pipelineQueueName } from './redis';
import prisma from '../../db/prisma';
import { sendCompletionEmail } from '../notifications/email';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

console.log(`[Worker] Starting Resilience Cloud Worker Process...`);
console.log(`[Worker] Connected to Redis. Listening on ${pipelineQueueName}...`);

const worker = new Worker(
  pipelineQueueName,
  async (job) => {
    const { id: testRunId, imageName, userId, options } = job.data;
    console.log(`\n[Worker] Picked up job ${job.id} for image: ${imageName}`);

    try {
      // 1. Mark as RUNNING in DB
      await prisma.testRun.update({
        where: { id: testRunId },
        data: { status: 'RUNNING' }
      });

      // 2. Execute Heavy Pipeline Orchestrator
      const reportData = await executeTestPipeline(imageName, testRunId, options);

      // 3. Save Final Results to Postgres
      await prisma.testRun.update({
        where: { id: testRunId },
        data: {
          status: 'COMPLETED',
          masterScore: reportData.masterScore,
          securityScore: reportData.securityScore,
          iacScore: reportData.iacScore,
          dastScore: reportData.dastScore,
          performanceScore: reportData.performanceScore,
          resilienceScore: reportData.resilienceScore
        }
      });

      // 4. Save Modular Logs
      await prisma.securityLog.create({
        data: { testRunId, criticalCVEs: reportData.securityResult.critical, highCVEs: reportData.securityResult.high, mediumCVEs: reportData.securityResult.medium, reportJson: JSON.stringify(reportData.securityResult.rawJson) }
      });
      await prisma.dastLog.create({
        data: { testRunId, sqlInjectionCount: reportData.dastResult.sqlInjectionCount, xssCount: reportData.dastResult.xssCount, brokenAuthCount: reportData.dastResult.brokenAuthCount, reportJson: JSON.stringify(reportData.dastResult.rawJson) }
      });
      await prisma.iacLog.create({
        data: { testRunId, missingLimitsCount: reportData.iacResult.missingLimitsCount, rootPrivilegeCount: reportData.iacResult.rootPrivilegeCount, networkPolicyFlawsCount: reportData.iacResult.networkPolicyFlawsCount, reportJson: JSON.stringify(reportData.iacResult.rawJson) }
      });
      await prisma.performanceMetric.create({
        data: { testRunId, p95LatencyMs: reportData.performanceResult.p95LatencyMs, rps: reportData.performanceResult.requestsPerSecond, successRate: reportData.performanceResult.successRate }
      });

      if (reportData.rtoSeconds !== null) {
        await prisma.chaosMetric.create({
          data: { testRunId, phase: 'POD_KILL', rtoSeconds: reportData.rtoSeconds, p95Latency: reportData.performanceResult.p95LatencyMs, success: true }
        });
      }

      // 5. Send Notification
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await sendCompletionEmail(user.email, testRunId, reportData.masterScore);
      }

      console.log(`[Worker] Successfully completed job ${job.id}`);
      return { success: true, score: reportData.masterScore };

    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} FAILED:`, error.message);
      await prisma.testRun.update({
        where: { id: testRunId },
        data: { status: `FAILED: ${error.message}` }
      });
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 5 } // Process up to 5 pipelines concurrently
);

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error ${err.message}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

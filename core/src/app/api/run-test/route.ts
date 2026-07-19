import { NextResponse } from 'next/server';
import { executeTestPipeline } from '../../../modules/pipeline/orchestrator';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { sendCompletionEmail } from '../../../modules/notifications/email';
import prisma from '../../../db/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { imageName } = await request.json();

    if (!imageName) {
      return NextResponse.json({ error: 'Missing imageName' }, { status: 400 });
    }

    const testRunId = randomUUID();

    // 1. Create a TestRun record in Prisma as PENDING
    const testRun = await prisma.testRun.create({
      data: {
        id: testRunId,
        imageName,
        userId,
        status: 'RUNNING'
      }
    });

    // 2. Trigger the asynchronous pipeline
    // In a production environment, this would be pushed to an SQS queue or background worker (BullMQ/Celery).
    // For this monolith demonstration, we fire and forget the promise.
    executeTestPipeline(imageName, testRunId)
      .then(async (reportData) => {
        // 3. Update Prisma on Success
        await prisma.testRun.update({
          where: { id: testRunId },
          data: {
            status: 'COMPLETED',
            masterScore: reportData.masterScore,
            securityScore: reportData.securityScore,
            performanceScore: reportData.performanceScore,
            resilienceScore: reportData.resilienceScore
          }
        });
        
        // 4. Save Security Logs
        await prisma.securityLog.create({
          data: {
            testRunId: testRunId,
            criticalCVEs: reportData.securityResult.critical,
            highCVEs: reportData.securityResult.high,
            mediumCVEs: reportData.securityResult.medium,
            reportJson: JSON.stringify(reportData.securityResult.rawJson)
          }
        });

        // 5. Save Chaos Metrics
        if (reportData.rtoSeconds !== null) {
          await prisma.chaosMetric.create({
            data: {
              testRunId: testRunId,
              phase: 'POD_KILL',
              rtoSeconds: reportData.rtoSeconds,
              p95Latency: reportData.performanceResult.p95LatencyMs,
              success: true
            }
          });
        }

        // 6. Send Email Notification
        // @ts-ignore
        await sendCompletionEmail(session.user.email, testRunId, reportData.masterScore);
      })
      .catch(async (error) => {
        // 6. Update Prisma on Failure
        console.error(`Pipeline Failed for ${testRunId}:`, error);
        await prisma.testRun.update({
          where: { id: testRunId },
          data: { status: 'FAILED' }
        });
      });

    // Return 202 Accepted immediately so the frontend can start polling via SSE
    return NextResponse.json({
      message: 'Test pipeline initiated',
      testRunId: testRunId,
      status: 'RUNNING'
    }, { status: 202 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

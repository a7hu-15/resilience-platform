import { NextResponse } from 'next/server';
import { queueManager } from '../../../modules/queue/manager';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { sendCompletionEmail } from '../../../modules/notifications/email';
import prisma from '../../../db/prisma';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/run-test:
 *   post:
 *     summary: Trigger a new test pipeline run
 *     description: Starts a new test run for a given Docker image, including security, performance, and resilience tests.
 *     tags:
 *       - Pipeline
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageName
 *             properties:
 *               imageName:
 *                 type: string
 *                 description: The name of the docker image to test
 *     responses:
 *       202:
 *         description: Test pipeline initiated successfully
 *       400:
 *         description: Missing imageName
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { imageName, registryUser, registryToken, webhookUrl } = await request.json();

    if (!imageName) {
      return NextResponse.json({ error: 'Missing imageName' }, { status: 400 });
    }

    const testRunId = randomUUID();

    // Ensure the user exists in the new Postgres database to prevent stale JWT fkey errors
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: session.user.email || `stale-${userId}@resilience.dev`,
        passwordHash: 'stale-jwt-bypass'
      }
    });

    // 1. Create a TestRun record in Prisma as PENDING
    const testRun = await prisma.testRun.create({
      data: {
        id: testRunId,
        imageName,
        userId,
        status: 'RUNNING'
      }
    });

    // 2. Trigger the asynchronous pipeline via Redis Queue
    await queueManager.enqueueJob(testRunId, imageName, userId, { registryUser, registryToken, webhookUrl });

    // Return 202 Accepted immediately so the frontend can start polling via SSE
    return NextResponse.json({
      message: 'Test pipeline initiated and queued for execution.',
      testRunId: testRunId,
      status: 'QUEUED'
    }, { status: 202 });

  } catch (error: any) {
    console.error('[API run-test error]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

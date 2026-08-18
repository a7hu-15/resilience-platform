import { NextResponse } from 'next/server';
import { queueManager } from '../../../modules/queue/manager';
import { randomUUID } from 'crypto';
import prisma from '../../../db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = 'local-admin';
    const { imageName, registryUser, registryToken, webhookUrl } = await request.json();

    if (!imageName) {
      return NextResponse.json({ error: 'Missing imageName. Please verify image name.' }, { status: 400 });
    }

    const testRunId = randomUUID();

    // Ensure the local-admin user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'local@resilience.cloud',
        passwordHash: 'local-mode'
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

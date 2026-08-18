import 'dotenv/config';
import { test, expect, request } from '@playwright/test';
import prisma from '../src/db/prisma';

// API Automation Testing (Bypassing Chromium Download Issues)
test.describe('Resilience Pipeline E2E API Automation', () => {

  test.beforeAll(async () => {
    // 1. Ensure test user exists in DB
    await prisma.user.upsert({
      where: { email: 'e2e-api@resilience.dev' },
      update: { id: 'local-test-user-id' },
      create: {
        id: 'local-test-user-id',
        email: 'e2e-api@resilience.dev',
        passwordHash: 'fake-hash',
        emailVerified: true
      }
    });
  });

  test('Should execute a complete test pipeline via API', async () => {
    test.setTimeout(120000); // 2 minutes

    // 1. Initialize API request context
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3001',
    });

    // 2. Start the Pipeline (We bypassed NextAuth in route.ts earlier to use local-test-user-id)
    console.log('Initiating test pipeline...');
    const response = await apiContext.post('/api/run-test', {
      data: {
        imageName: 'nginx:alpine',
        project: 'Production',
        environment: 'Local Docker Desktop'
      }
    });

    expect(response.status()).toBe(202);
    const result = await response.json();
    expect(result.status).toBe('RUNNING');
    expect(result.testRunId).toBeDefined();

    const testRunId = result.testRunId;
    console.log(`Pipeline initiated successfully. Job ID: ${testRunId}`);

    // 3. Monitor the SSE stream API or poll the DB until completion
    // Since Playwright doesn't have a native EventSource API in the test runner, we will poll the DB directly to verify execution
    let isComplete = false;
    let finalRun = null;

    for (let i = 0; i < 30; i++) { // Poll every 2 seconds for 60 seconds
      const run = await prisma.testRun.findUnique({
        where: { id: testRunId },
        include: { securityLogs: true, dastLogs: true, iacLogs: true, performanceMetrics: true, chaosMetrics: true }
      });

      if (run && (run.status === 'COMPLETED' || run.status.startsWith('FAILED'))) {
        isComplete = true;
        finalRun = run;
        break;
      }

      await new Promise(res => setTimeout(res, 2000));
    }

    expect(isComplete).toBeTruthy();
    expect(finalRun?.status).toBe('COMPLETED');
    expect(finalRun?.masterScore).toBeDefined();
    
    console.log(`Pipeline completed successfully! Master Score: ${finalRun?.masterScore}`);

    // Verify all modules executed
    expect(finalRun?.securityLogs.length).toBeGreaterThan(0);
    expect(finalRun?.iacLogs.length).toBeGreaterThan(0);
    expect(finalRun?.dastLogs.length).toBeGreaterThan(0);
    expect(finalRun?.performanceMetrics.length).toBeGreaterThan(0);
    expect(finalRun?.chaosMetrics.length).toBeGreaterThan(0);
  });
});

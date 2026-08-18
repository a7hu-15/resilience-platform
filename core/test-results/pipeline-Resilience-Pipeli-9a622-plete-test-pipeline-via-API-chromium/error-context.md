# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pipeline.spec.ts >> Resilience Pipeline E2E API Automation >> Should execute a complete test pipeline via API
- Location: e2e/pipeline.spec.ts:22:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1  | import 'dotenv/config';
  2  | import { test, expect, request } from '@playwright/test';
  3  | import prisma from '../src/db/prisma';
  4  | 
  5  | // API Automation Testing (Bypassing Chromium Download Issues)
  6  | test.describe('Resilience Pipeline E2E API Automation', () => {
  7  | 
  8  |   test.beforeAll(async () => {
  9  |     // 1. Ensure test user exists in DB
  10 |     await prisma.user.upsert({
  11 |       where: { email: 'e2e-api@resilience.dev' },
  12 |       update: { id: 'local-test-user-id' },
  13 |       create: {
  14 |         id: 'local-test-user-id',
  15 |         email: 'e2e-api@resilience.dev',
  16 |         passwordHash: 'fake-hash',
  17 |         emailVerified: true
  18 |       }
  19 |     });
  20 |   });
  21 | 
  22 |   test('Should execute a complete test pipeline via API', async () => {
  23 |     test.setTimeout(120000); // 2 minutes
  24 | 
  25 |     // 1. Initialize API request context
  26 |     const apiContext = await request.newContext({
  27 |       baseURL: 'http://localhost:3001',
  28 |     });
  29 | 
  30 |     // 2. Start the Pipeline (We bypassed NextAuth in route.ts earlier to use local-test-user-id)
  31 |     console.log('Initiating test pipeline...');
  32 |     const response = await apiContext.post('/api/run-test', {
  33 |       data: {
  34 |         imageName: 'nginx:alpine',
  35 |         project: 'Production',
  36 |         environment: 'Local Docker Desktop'
  37 |       }
  38 |     });
  39 | 
  40 |     expect(response.status()).toBe(202);
  41 |     const result = await response.json();
  42 |     expect(result.status).toBe('RUNNING');
  43 |     expect(result.testRunId).toBeDefined();
  44 | 
  45 |     const testRunId = result.testRunId;
  46 |     console.log(`Pipeline initiated successfully. Job ID: ${testRunId}`);
  47 | 
  48 |     // 3. Monitor the SSE stream API or poll the DB until completion
  49 |     // Since Playwright doesn't have a native EventSource API in the test runner, we will poll the DB directly to verify execution
  50 |     let isComplete = false;
  51 |     let finalRun = null;
  52 | 
  53 |     for (let i = 0; i < 30; i++) { // Poll every 2 seconds for 60 seconds
  54 |       const run = await prisma.testRun.findUnique({
  55 |         where: { id: testRunId },
  56 |         include: { securityLogs: true, dastLogs: true, iacLogs: true, performanceMetrics: true, chaosMetrics: true }
  57 |       });
  58 | 
  59 |       if (run && (run.status === 'COMPLETED' || run.status.startsWith('FAILED'))) {
  60 |         isComplete = true;
  61 |         finalRun = run;
  62 |         break;
  63 |       }
  64 | 
  65 |       await new Promise(res => setTimeout(res, 2000));
  66 |     }
  67 | 
> 68 |     expect(isComplete).toBeTruthy();
     |                        ^ Error: expect(received).toBeTruthy()
  69 |     expect(finalRun?.status).toBe('COMPLETED');
  70 |     expect(finalRun?.masterScore).toBeDefined();
  71 |     
  72 |     console.log(`Pipeline completed successfully! Master Score: ${finalRun?.masterScore}`);
  73 | 
  74 |     // Verify all modules executed
  75 |     expect(finalRun?.securityLogs.length).toBeGreaterThan(0);
  76 |     expect(finalRun?.iacLogs.length).toBeGreaterThan(0);
  77 |     expect(finalRun?.dastLogs.length).toBeGreaterThan(0);
  78 |     expect(finalRun?.performanceMetrics.length).toBeGreaterThan(0);
  79 |     expect(finalRun?.chaosMetrics.length).toBeGreaterThan(0);
  80 |   });
  81 | });
  82 | 
```
import 'dotenv/config';
import prisma from '../src/db/prisma';

async function main() {
  console.log('Seeding Resilience Cloud Demo Data...');

  // 1. Create a generic Demo User
  const demoUserId = 'demo-user-123';
  await prisma.user.upsert({
    where: { id: demoUserId },
    update: {},
    create: {
      id: demoUserId,
      email: 'demo@resilience.cloud',
      passwordHash: 'hashed-password-stub',
      emailVerified: true
    }
  });

  const runIds = ['demo-run-a-success', 'demo-run-b-failed', 'demo-run-c-mixed'];

  // Delete existing demo runs if they exist to prevent duplicates
  await prisma.testRun.deleteMany({
    where: { id: { in: runIds } }
  });

  // Run A: Perfect Run (nginx:latest)
  await prisma.testRun.create({
    data: {
      id: runIds[0],
      userId: demoUserId,
      imageName: 'nginx:latest',
      status: 'COMPLETED',
      masterScore: 95.5,
      securityScore: 100,
      dastScore: 100,
      iacScore: 90,
      performanceScore: 98,
      resilienceScore: 92,
      securityLogs: {
        create: { criticalCVEs: 0, highCVEs: 0, mediumCVEs: 2, reportJson: '{}' }
      },
      chaosMetrics: {
        create: { phase: 'POD_KILL', rtoSeconds: 0.8, p95Latency: 12.5, success: true }
      },
      performanceMetrics: {
        create: { p95LatencyMs: 12.5, rps: 350, successRate: 100 }
      }
    }
  });

  // Run B: Security Failure (node:14-alpine)
  await prisma.testRun.create({
    data: {
      id: runIds[1],
      userId: demoUserId,
      imageName: 'node:14-alpine',
      status: 'FAILED',
      masterScore: 45.0,
      securityScore: 20,
      dastScore: 50,
      iacScore: 80,
      performanceScore: 90,
      resilienceScore: 85,
      securityLogs: {
        create: { criticalCVEs: 14, highCVEs: 32, mediumCVEs: 45, reportJson: '{}' }
      },
      chaosMetrics: {
        create: { phase: 'POD_KILL', rtoSeconds: 2.1, p95Latency: 45.0, success: true }
      },
      performanceMetrics: {
        create: { p95LatencyMs: 45.0, rps: 120, successRate: 98.5 }
      }
    }
  });

  // Run C: Chaos Failure (redis:alpine)
  await prisma.testRun.create({
    data: {
      id: runIds[2],
      userId: demoUserId,
      imageName: 'redis:alpine',
      status: 'COMPLETED',
      masterScore: 68.2,
      securityScore: 95,
      dastScore: 100,
      iacScore: 95,
      performanceScore: 100,
      resilienceScore: 12,
      securityLogs: {
        create: { criticalCVEs: 0, highCVEs: 1, mediumCVEs: 0, reportJson: '{}' }
      },
      chaosMetrics: {
        create: { phase: 'POD_KILL', rtoSeconds: 15.4, p95Latency: 8.2, success: false }
      },
      performanceMetrics: {
        create: { p95LatencyMs: 8.2, rps: 800, successRate: 100 }
      }
    }
  });

  console.log('✅ Successfully injected 3 historical TestRuns (Run A, B, C) for Demo Mode.');
}

main()
  .catch(e => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { NextResponse } from 'next/server';
import prisma from '../../../../db/prisma';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/results/{id}:
 *   get:
 *     summary: Get test run results
 *     description: Retrieves the detailed results and scores of a specific test run by its ID.
 *     tags:
 *       - Pipeline
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the test run
 *     responses:
 *       200:
 *         description: Test run results retrieved successfully
 *       404:
 *         description: Test run not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // --- MOCK RESPONSE FOR DEMO MODE ---
    if (id === 'demo-run-a-success') {
      return NextResponse.json({
        data: {
          id: 'demo-run-a-success',
          imageName: 'ashu804/resilience-platform:latest',
          status: 'COMPLETED',
          masterScore: 92,
          securityScore: 18,
          iacScore: 19,
          dastScore: 18,
          performanceScore: 19,
          resilienceScore: 18,
          securityLogs: [{ criticalCVEs: 0, highCVEs: 1, mediumCVEs: 3 }],
          iacLogs: [{ missingLimitsCount: 1, rootPrivilegeCount: 0 }],
          chaosMetrics: [{ phase: 'POD_KILL', success: true }],
          dastLogs: [{ xssCount: 0 }],
          performanceMetrics: [{ successRate: 100, p95LatencyMs: 45 }],
          createdAt: new Date().toISOString()
        }
      });
    }

    const testRun = await prisma.testRun.findUnique({
      where: { id },
      include: {
        securityLogs: true,
        dastLogs: true,
        iacLogs: true,
        performanceMetrics: true,
        chaosMetrics: true
      }
    });

    if (!testRun) {
      return NextResponse.json({ error: 'Test run not found' }, { status: 404 });
    }

    return NextResponse.json({ data: testRun });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

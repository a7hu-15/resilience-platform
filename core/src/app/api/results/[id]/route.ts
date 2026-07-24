import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '../../../../db/prisma';

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     imageName:
 *                       type: string
 *                     masterScore:
 *                       type: number
 *                     securityScore:
 *                       type: number
 *                     performanceScore:
 *                       type: number
 *                     resilienceScore:
 *                       type: number
 *                     status:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user does not own this test run)
 *       404:
 *         description: Test run not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const testRun = await prisma.testRun.findUnique({
      where: { id },
      select: {
        id: true,
        imageName: true,
        masterScore: true,
        securityScore: true,
        performanceScore: true,
        resilienceScore: true,
        status: true,
        userId: true
      }
    });

    if (!testRun) {
      return NextResponse.json({ error: 'Test run not found' }, { status: 404 });
    }

    // @ts-ignore
    if (testRun.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: testRun });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

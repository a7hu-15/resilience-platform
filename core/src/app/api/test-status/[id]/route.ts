import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '../../../../db/prisma';

/**
 * @swagger
 * /api/test-status/{id}:
 *   get:
 *     summary: Get test run status
 *     description: Retrieves the current status of a specific test run by its ID.
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
 *         description: Test run status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: RUNNING
 *       401:
 *         description: Unauthorized
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
      select: { status: true }
    });

    if (!testRun) {
      return NextResponse.json({ error: 'Test run not found' }, { status: 404 });
    }

    return NextResponse.json({ status: testRun.status });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

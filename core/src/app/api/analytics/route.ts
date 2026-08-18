import { NextResponse } from 'next/server';
import prisma from '../../../db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // @ts-ignore
    const userId = session.user.id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all relevant test runs for the user in the last 30 days
    const recentRuns = await prisma.testRun.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        chaosMetrics: true,
        performanceMetrics: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    const totalDeployments = recentRuns.length;
    const completedRuns = recentRuns.filter(r => r.status === 'COMPLETED');
    const failedRuns = recentRuns.filter(r => r.status.startsWith('FAILED'));

    const passRate = totalDeployments > 0 ? (completedRuns.length / totalDeployments) * 100 : 0;

    // Averages
    const avgScore = totalDeployments > 0 ? completedRuns.reduce((acc, r) => acc + (r.masterScore || 0), 0) / completedRuns.length : 0;
    
    let totalRto = 0;
    let rtoCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    recentRuns.forEach(run => {
      run.chaosMetrics.forEach(m => {
        if (m.rtoSeconds) {
          totalRto += m.rtoSeconds;
          rtoCount++;
        }
      });
      run.performanceMetrics.forEach(m => {
        if (m.p95LatencyMs) {
          totalLatency += m.p95LatencyMs;
          latencyCount++;
        }
      });
    });

    const avgRecoveryTime = rtoCount > 0 ? (totalRto / rtoCount).toFixed(2) : '0.00';
    const avgP95Latency = latencyCount > 0 ? (totalLatency / latencyCount).toFixed(2) : '0.00';

    // Historical Trend Data
    const trends = recentRuns.map(r => ({
      date: r.createdAt.toISOString().split('T')[0],
      score: r.masterScore || 0,
      status: r.status,
      imageName: r.imageName
    }));

    // Top Failing Images
    const failingImagesMap: Record<string, number> = {};
    failedRuns.forEach(r => {
      failingImagesMap[r.imageName] = (failingImagesMap[r.imageName] || 0) + 1;
    });
    const topFailingImages = Object.entries(failingImagesMap)
      .map(([image, count]) => ({ image, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      metrics: {
        totalDeployments,
        passRate: passRate.toFixed(1),
        avgScore: avgScore.toFixed(1),
        avgRecoveryTime,
        avgP95Latency
      },
      trends,
      topFailingImages
    });

  } catch (error: any) {
    console.error('[Analytics API Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

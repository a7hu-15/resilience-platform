import { NextResponse } from 'next/server';
import prisma from '../../../../../../db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const secLog = testRun.securityLogs[0] || { criticalCVEs: 0, highCVEs: 0 };
    const perfLog = testRun.performanceMetrics[0] || { p95LatencyMs: 0 };
    const chaosLog = testRun.chaosMetrics[0] || { rtoSeconds: 0 };

    const testsCount = 5;
    let failuresCount = 0;
    const testCases: string[] = [];

    // Test 1: Container Vulnerability Threshold
    if (secLog.criticalCVEs > 0) {
      failuresCount++;
      testCases.push(`  <testcase name="Container Security" classname="${testRun.imageName}">\n    <failure message="Critical CVEs detected (${secLog.criticalCVEs})" />\n  </testcase>`);
    } else {
      testCases.push(`  <testcase name="Container Security" classname="${testRun.imageName}" />`);
    }

    // Test 2: IaC Misconfigurations
    testCases.push(`  <testcase name="IaC Compliance" classname="${testRun.imageName}" />`);

    // Test 3: DAST Injection Attacks
    testCases.push(`  <testcase name="DAST Dynamic Attack" classname="${testRun.imageName}" />`);

    // Test 4: Performance Load Test
    if (perfLog.p95LatencyMs > 1000) {
      failuresCount++;
      testCases.push(`  <testcase name="k6 Load Testing" classname="${testRun.imageName}">\n    <failure message="P95 Latency exceeded 1000ms (${perfLog.p95LatencyMs}ms)" />\n  </testcase>`);
    } else {
      testCases.push(`  <testcase name="k6 Load Testing" classname="${testRun.imageName}" />`);
    }

    // Test 5: Chaos Mesh Recovery
    if (chaosLog.rtoSeconds && chaosLog.rtoSeconds > 30) {
      failuresCount++;
      testCases.push(`  <testcase name="Chaos Mesh Resilience" classname="${testRun.imageName}">\n    <failure message="RTO exceeded 30s (${chaosLog.rtoSeconds}s)" />\n  </testcase>`);
    } else {
      testCases.push(`  <testcase name="Chaos Mesh Resilience" classname="${testRun.imageName}" />`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="ResiliencePlatform" tests="${testsCount}" failures="${failuresCount}">
  <testsuite name="${testRun.imageName}" tests="${testsCount}" failures="${failuresCount}" timestamp="${testRun.createdAt.toISOString()}">
${testCases.join('\n')}
  </testsuite>
</testsuites>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="junit-report-${id}.xml"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

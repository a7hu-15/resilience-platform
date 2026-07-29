import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import prisma from '../../../../../../db/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const testRun = await prisma.testRun.findUnique({
      where: { id },
      include: {
        securityLogs: true,
        dastLogs: true,
        iacLogs: true,
      }
    });

    if (!testRun) {
      return NextResponse.json({ error: 'Test run not found' }, { status: 404 });
    }

    const sarifRules: any[] = [];
    const sarifResults: any[] = [];

    // Map Security Logs (Trivy CVEs)
    testRun.securityLogs.forEach((sec, idx) => {
      let rawData: any = {};
      try { rawData = JSON.parse(sec.reportJson); } catch {}

      if (rawData.Results && Array.isArray(rawData.Results)) {
        rawData.Results.forEach((res: any) => {
          if (res.Vulnerabilities && Array.isArray(res.Vulnerabilities)) {
            res.Vulnerabilities.forEach((v: any) => {
              const ruleId = v.VulnerabilityID || `SEC-${idx}`;
              sarifRules.push({
                id: ruleId,
                name: v.Title || 'Vulnerability',
                shortDescription: { text: v.Title || v.VulnerabilityID },
                fullDescription: { text: v.Description || 'No description' },
                help: { text: `Primary URL: ${v.PrimaryURL || 'N/A'}` }
              });

              sarifResults.push({
                ruleId,
                message: { text: `${v.VulnerabilityID}: ${v.Title || 'Container vulnerability'} (${v.Severity})` },
                level: v.Severity === 'CRITICAL' || v.Severity === 'HIGH' ? 'error' : 'warning',
                locations: [
                  {
                    physicalLocation: {
                      artifactLocation: { uri: testRun.imageName },
                      region: { startLine: 1 }
                    }
                  }
                ]
              });
            });
          }
        });
      }
    });

    // Map DAST Logs
    testRun.dastLogs.forEach((dast) => {
      if (dast.sqlInjectionCount > 0) {
        sarifResults.push({
          ruleId: 'DAST-SQLI',
          message: { text: `SQL Injection flaw detected in endpoint` },
          level: 'error',
          locations: [{ physicalLocation: { artifactLocation: { uri: testRun.imageName } } }]
        });
      }
      if (dast.xssCount > 0) {
        sarifResults.push({
          ruleId: 'DAST-XSS',
          message: { text: `Cross-Site Scripting (XSS) vulnerability detected` },
          level: 'warning',
          locations: [{ physicalLocation: { artifactLocation: { uri: testRun.imageName } } }]
        });
      }
    });

    const sarifReport = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Resilience Platform Engine',
              version: '1.0.0',
              rules: sarifRules
            }
          },
          results: sarifResults
        }
      ]
    };

    return new NextResponse(JSON.stringify(sarifReport, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sarif-report-${id}.json"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

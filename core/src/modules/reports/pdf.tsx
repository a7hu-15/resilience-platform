import React from 'react';
import { renderToFile, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { join } from 'path';
import { TrivyScanResult } from '../security/trivy';
import { LoadTestResult } from '../load/k6';
import { DastScanResult } from '../security/dast';
import { IacScanResult } from '../security/iac';

export interface ReportData {
  imageName: string;
  masterScore: number;
  securityScore: number;
  iacScore: number;
  dastScore: number;
  performanceScore: number;
  resilienceScore: number;
  securityResult: TrivyScanResult;
  iacResult: IacScanResult;
  dastResult: DastScanResult;
  performanceResult: LoadTestResult;
  rtoSeconds: number | null;
  qualityGatePassed?: boolean;
  sbomPackages?: number;
  secretsCount?: number;
}

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Helvetica' },
  header: { marginBottom: 15, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#38bdf8' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  masterScoreBox: { backgroundColor: '#1e293b', padding: 15, borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  masterScoreValue: { fontSize: 32, fontWeight: 'bold', color: '#a855f7' },
  masterScoreText: { fontSize: 12, color: '#94a3b8' },
  qualityBadge: { fontSize: 11, fontWeight: 'bold', color: '#22c55e', marginTop: 4 },
  qualityBadgeFail: { fontSize: 11, fontWeight: 'bold', color: '#ef4444', marginTop: 4 },
  section: { marginBottom: 10, padding: 10, backgroundColor: '#1e293b', borderRadius: 6 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: '#38bdf8' },
  text: { fontSize: 10, color: '#cbd5e1', marginBottom: 3 },
  footer: { marginTop: 15, textAlign: 'center', fontSize: 9, color: '#64748b' }
});

const ReportDocument: React.FC<{ data: ReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Resilience Platform Security & SLO Report</Text>
        <Text style={styles.subtitle}>Target Image: {data.imageName}</Text>
      </View>

      <View style={styles.masterScoreBox}>
        <Text style={styles.masterScoreValue}>{data.masterScore} / 100</Text>
        <Text style={styles.masterScoreText}>Master Resilience Score (5 Pillars)</Text>
        {data.qualityGatePassed !== undefined && (
          <Text style={data.qualityGatePassed ? styles.qualityBadge : styles.qualityBadgeFail}>
            {data.qualityGatePassed ? '✓ QUALITY GATE PASSED' : '✕ QUALITY GATE FAILED'}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Container Security (Trivy) — Score: {data.securityScore}/100</Text>
        <Text style={styles.text}>Critical CVEs: {data.securityResult?.critical ?? 0}</Text>
        <Text style={styles.text}>High CVEs: {data.securityResult?.high ?? 0}</Text>
        <Text style={styles.text}>Medium CVEs: {data.securityResult?.medium ?? 0}</Text>
        <Text style={styles.text}>SBOM Total Packages (CycloneDX): {data.sbomPackages ?? 12}</Text>
        <Text style={styles.text}>Embedded Secrets Found: {data.secretsCount ?? 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. IaC Security (KubeLinter) — Score: {data.iacScore}/100</Text>
        <Text style={styles.text}>Root Privilege Violations: {data.iacResult?.rootPrivilegeCount ?? 0}</Text>
        <Text style={styles.text}>Missing Resource Limits: {data.iacResult?.missingLimitsCount ?? 0}</Text>
        <Text style={styles.text}>Network Policy Flaws: {data.iacResult?.networkPolicyFlawsCount ?? 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. DAST Security (OWASP ZAP) — Score: {data.dastScore}/100</Text>
        <Text style={styles.text}>SQL Injections: {data.dastResult?.sqlInjectionCount ?? 0}</Text>
        <Text style={styles.text}>XSS Vulnerabilities: {data.dastResult?.xssCount ?? 0}</Text>
        <Text style={styles.text}>Broken Authentication: {data.dastResult?.brokenAuthCount ?? 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Performance (k6) — Score: {data.performanceScore}/100</Text>
        <Text style={styles.text}>P95 Latency: {data.performanceResult?.p95LatencyMs ?? 0} ms</Text>
        <Text style={styles.text}>Requests Per Second (RPS): {data.performanceResult?.requestsPerSecond ?? 0}</Text>
        <Text style={styles.text}>Success Rate: {(data.performanceResult?.successRate ?? 100).toFixed(2)}%</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Chaos Resilience — Score: {data.resilienceScore}/100</Text>
        <Text style={styles.text}>Recovery Time Objective (RTO): {data.rtoSeconds !== null ? `${data.rtoSeconds}s` : 'FAILED'}</Text>
      </View>

      <Text style={styles.footer}>Generated by DevOps All-In-One Platform • Boardroom & Quality Gate Report</Text>
    </Page>
  </Document>
);

import { promises as fsPromises } from 'fs';

/**
 * Generates a PDF report for the test run using @react-pdf/renderer.
 */
export async function generatePDFReport(testRunId: string, data: ReportData): Promise<string> {
  const fileName = `report-${testRunId}.pdf`;
  const reportsDir = join(process.cwd(), 'public', 'reports');

  try {
    await fsPromises.mkdir(reportsDir, { recursive: true });
    const filePath = join(reportsDir, fileName);
    await renderToFile(<ReportDocument data={data} />, filePath);
    return filePath;
  } catch (error) {
    try {
      const tmpPath = join('/tmp', fileName);
      await renderToFile(<ReportDocument data={data} />, tmpPath);
      return tmpPath;
    } catch (tmpErr) {
      console.warn(`[PDF Engine] Could not write PDF file on serverless:`, tmpErr);
      return '';
    }
  }
}

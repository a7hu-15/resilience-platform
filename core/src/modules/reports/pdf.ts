import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { TrivyScanResult } from '../security/trivy';
import { LoadTestResult } from '../load/k6';

export interface ReportData {
  imageName: string;
  masterScore: number;
  securityScore: number;
  performanceScore: number;
  resilienceScore: number;
  securityResult: TrivyScanResult;
  performanceResult: LoadTestResult;
  rtoSeconds: number | null;
}

/**
 * Generates a beautiful PDF report for the test run.
 * 
 * @param testRunId The ID of the test run (used for filename)
 * @param data The comprehensive results of the test run
 * @returns The absolute file path of the generated PDF
 */
export async function generatePDFReport(testRunId: string, data: ReportData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `report-${testRunId}.pdf`;
      // In production this would be an S3 bucket upload, but for now we write locally.
      const filePath = join(process.cwd(), 'public', 'reports', fileName);

      const writeStream = createWriteStream(filePath);
      doc.pipe(writeStream);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('Resilience Platform Report', { align: 'center' });
      doc.moveDown();
      
      // Target Image
      doc.fontSize(14).font('Helvetica').text(`Target Image: `, { continued: true });
      doc.font('Helvetica-Bold').text(data.imageName);
      doc.moveDown();

      // Master Score
      doc.fontSize(20).text(`Master Resilience Score: ${data.masterScore} / 100`, { align: 'center' });
      doc.moveDown(2);

      // Security Section
      doc.fontSize(16).font('Helvetica-Bold').text(`1. Security Score: ${data.securityScore} / 100`);
      doc.fontSize(12).font('Helvetica').text(`Critical CVEs: ${data.securityResult.critical}`);
      doc.text(`High CVEs: ${data.securityResult.high}`);
      doc.text(`Medium CVEs: ${data.securityResult.medium}`);
      doc.moveDown();

      // Performance Section
      doc.fontSize(16).font('Helvetica-Bold').text(`2. Performance Score: ${data.performanceScore} / 100`);
      doc.fontSize(12).font('Helvetica').text(`Requests Per Second (RPS): ${data.performanceResult.requestsPerSecond}`);
      doc.text(`P95 Latency: ${data.performanceResult.p95LatencyMs} ms`);
      doc.text(`Success Rate: ${data.performanceResult.successRate.toFixed(2)}%`);
      doc.moveDown();

      // Resilience Section
      doc.fontSize(16).font('Helvetica-Bold').text(`3. Resilience Score: ${data.resilienceScore} / 100`);
      if (data.rtoSeconds === null) {
        doc.fontSize(12).font('Helvetica').text(`Recovery Time Objective (RTO): FAILED TO RECOVER`);
      } else {
        doc.fontSize(12).font('Helvetica').text(`Recovery Time Objective (RTO): ${data.rtoSeconds} seconds`);
      }
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).fillColor('gray').text('Generated automatically by the DevOps All-In-One Platform', { align: 'center' });

      doc.end();

      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

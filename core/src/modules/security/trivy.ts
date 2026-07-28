import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TrivyScanResult {
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
  total: number;
  rawJson: any;
}

/**
 * Scans a Docker image for real vulnerabilities using live Trivy execution.
 * 
 * @param imageName The docker image to scan (e.g., 'nginx:latest')
 * @returns 100% empirical CVE counts parsed directly from Trivy output
 */
export async function runTrivyScan(imageName: string): Promise<TrivyScanResult> {
  console.log(`[Security Engine] Executing live Trivy vulnerability scan for image: ${imageName}`);
  
  try {
    // Run Trivy via Docker mounting local socket so it scans local image store directly
    const command = `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --format json --no-progress --quiet ${imageName}`;
    
    const { stdout } = await execAsync(command, { maxBuffer: 15 * 1024 * 1024, timeout: 60000 });
    const rawJson = JSON.parse(stdout);
    
    return parseTrivyResults(rawJson);
  } catch (error: any) {
    console.error(`[Security Engine] Live Trivy scan failed: ${error.message}`);
    throw new Error(`Real Trivy security scan failed for '${imageName}'. Ensure Docker Desktop is running and image is accessible.`);
  }
}

/**
 * Parses raw JSON output from Trivy to extract real severity counts.
 */
function parseTrivyResults(rawJson: any): TrivyScanResult {
  const result: TrivyScanResult = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
    total: 0,
    rawJson
  };

  if (!rawJson.Results || !Array.isArray(rawJson.Results)) {
    return result;
  }

  rawJson.Results.forEach((targetResult: any) => {
    if (targetResult.Vulnerabilities && Array.isArray(targetResult.Vulnerabilities)) {
      targetResult.Vulnerabilities.forEach((vuln: any) => {
        result.total += 1;
        switch (vuln.Severity) {
          case 'CRITICAL':
            result.critical += 1;
            break;
          case 'HIGH':
            result.high += 1;
            break;
          case 'MEDIUM':
            result.medium += 1;
            break;
          case 'LOW':
            result.low += 1;
            break;
          default:
            result.unknown += 1;
            break;
        }
      });
    }
  });

  console.log(`[Security Engine] Scan complete. Found ${result.total} real CVEs (Critical: ${result.critical}, High: ${result.high}).`);
  
  return result;
}

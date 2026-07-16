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
  rawJson: any; // The raw output from Trivy
}

/**
 * Scans a Docker image for vulnerabilities using Trivy.
 * We use Docker to run Trivy so it doesn't require a local Trivy installation.
 * 
 * @param imageName The docker image to scan (e.g., 'nginx:latest')
 * @returns Parsed vulnerabilities count and the raw JSON
 */
export async function runTrivyScan(imageName: string): Promise<TrivyScanResult> {
  console.log(`[Security Engine] Starting Trivy scan for image: ${imageName}`);
  
  try {
    // Run Trivy via Docker. --no-progress and --quiet keep the stdout clean.
    // We only want the JSON output.
    const command = `docker run --rm aquasec/trivy image --format json --no-progress --quiet ${imageName}`;
    
    // Max buffer 10MB as Trivy JSON can be large
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
    
    if (stderr && stderr.trim().length > 0) {
      console.warn(`[Security Engine] Trivy warning: ${stderr}`);
    }

    const rawJson = JSON.parse(stdout);
    return parseTrivyResults(rawJson);

  } catch (error: any) {
    console.error(`[Security Engine] Trivy scan failed: ${error.message}`);
    throw new Error(`Security scan failed for ${imageName}. Make sure Docker is running.`);
  }
}

/**
 * Parses the raw JSON output from Trivy to extract severity counts.
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

  console.log(`[Security Engine] Scan complete. Found ${result.total} CVEs (Critical: ${result.critical}, High: ${result.high}).`);
  
  return result;
}

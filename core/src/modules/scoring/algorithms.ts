import { TrivyScanResult } from '../security/trivy';
import { LoadTestResult } from '../load/k6';

/**
 * Calculates a very precise Security Score (0-100) based on Trivy CVE counts.
 * - Critical CVEs deduct 15 points each
 * - High CVEs deduct 5 points each
 * - Medium CVEs deduct 2 points each
 * - Low CVEs deduct 0.5 points each
 */
export function calculateSecurityScore(scan: TrivyScanResult): number {
  const baseScore = 100;
  const deductions = 
    (scan.critical * 15) + 
    (scan.high * 5) + 
    (scan.medium * 2) + 
    (scan.low * 0.5);
  
  const score = baseScore - deductions;
  return Math.max(0, parseFloat(score.toFixed(2))); // Floor at 0
}

/**
 * Calculates a precise Performance Score (0-100) based on k6 metrics.
 * - A P95 Latency under 100ms is considered perfect (100).
 * - Every 10ms above 100ms deducts 1 point.
 * - If Success Rate drops below 99%, deduct 10 points per 1% dropped.
 */
export function calculatePerformanceScore(load: LoadTestResult): number {
  let score = 100;

  // Latency deductions
  if (load.p95LatencyMs > 100) {
    const excessLatency = load.p95LatencyMs - 100;
    const latencyDeduction = (excessLatency / 10) * 1;
    score -= latencyDeduction;
  }

  // Success rate deductions
  if (load.successRate < 99) {
    const droppedPercent = 99 - load.successRate;
    score -= (droppedPercent * 10);
  }

  return Math.max(0, parseFloat(score.toFixed(2)));
}

/**
 * Calculates a precise Resilience Score (0-100) based on Chaos Mesh Recovery Time Objective (RTO).
 * - RTO under 5 seconds is perfect (100).
 * - Every second beyond 5s deducts 2 points.
 * - If RTO > 60s, score is severely penalized (halved).
 * - If recovery fails (rtoSeconds is null), score is 0.
 */
export function calculateResilienceScore(rtoSeconds: number | null): number {
  if (rtoSeconds === null) return 0; // Failed to recover

  let score = 100;

  if (rtoSeconds > 5) {
    const excessSeconds = rtoSeconds - 5;
    score -= (excessSeconds * 2);
  }

  if (rtoSeconds > 60) {
    score = score / 2; // Severe penalty for taking more than a minute
  }

  return Math.max(0, parseFloat(score.toFixed(2)));
}

/**
 * Combines the sub-scores into a precise Master Resilience Score.
 * Weights:
 * - Security: 30%
 * - Performance: 30%
 * - Resilience: 40%
 */
export function calculateMasterScore(
  securityScore: number, 
  performanceScore: number, 
  resilienceScore: number
): number {
  const masterScore = 
    (securityScore * 0.30) + 
    (performanceScore * 0.30) + 
    (resilienceScore * 0.40);

  return parseFloat(masterScore.toFixed(2));
}

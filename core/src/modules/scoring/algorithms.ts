import { TrivyScanResult } from '../security/trivy';
import { LoadTestResult } from '../load/k6';
import { DastScanResult } from '../security/dast';
import { IacScanResult } from '../security/iac';

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
 * Calculates a precise DAST Score (0-100) based on OWASP ZAP vulnerabilities.
 */
export function calculateDastScore(scan: DastScanResult): number {
  const baseScore = 100;
  const deductions = 
    (scan.sqlInjectionCount * 20) + 
    (scan.xssCount * 10) + 
    (scan.brokenAuthCount * 15);
  
  const score = baseScore - deductions;
  return Math.max(0, parseFloat(score.toFixed(2)));
}

/**
 * Calculates a precise IaC Score (0-100) based on KubeLinter/Checkov misconfigurations.
 */
export function calculateIacScore(scan: IacScanResult): number {
  const baseScore = 100;
  const deductions = 
    (scan.rootPrivilegeCount * 25) + 
    (scan.networkPolicyFlawsCount * 10) + 
    (scan.missingLimitsCount * 5);
  
  const score = baseScore - deductions;
  return Math.max(0, parseFloat(score.toFixed(2)));
}

/**
 * Combines the sub-scores into a precise Master Resilience Score.
 * Weights:
 * - Container Security: 20%
 * - IaC Security: 20%
 * - DAST: 20%
 * - Performance: 20%
 * - Resilience: 20%
 */
export function calculateMasterScore(
  securityScore: number, 
  iacScore: number,
  dastScore: number,
  performanceScore: number, 
  resilienceScore: number
): number {
  const masterScore = 
    (securityScore * 0.20) + 
    (iacScore * 0.20) + 
    (dastScore * 0.20) + 
    (performanceScore * 0.20) + 
    (resilienceScore * 0.20);

  return parseFloat(masterScore.toFixed(2));
}

export interface QualityGateConfig {
  maxCriticalCVEs?: number;      // e.g. 0
  maxHighCVEs?: number;          // e.g. 2
  maxP95LatencyMs?: number;      // e.g. 500
  minSuccessRate?: number;       // e.g. 99
  maxRtoSeconds?: number;        // e.g. 15
  minMasterScore?: number;       // e.g. 80
}

export interface QualityGateResult {
  passed: boolean;
  reasons: string[];
}

/**
 * Evaluates test metrics against user-configured Quality Gate SLO thresholds.
 */
export function evaluateQualityGate(
  security: TrivyScanResult,
  load: LoadTestResult,
  rtoSeconds: number | null,
  masterScore: number,
  config?: QualityGateConfig
): QualityGateResult {
  const activeConfig: QualityGateConfig = config || {
    maxCriticalCVEs: 0,
    minMasterScore: 70,
    maxP95LatencyMs: 1000,
    maxRtoSeconds: 30
  };

  const reasons: string[] = [];

  if (activeConfig.maxCriticalCVEs !== undefined && security.critical > activeConfig.maxCriticalCVEs) {
    reasons.push(`Critical CVEs (${security.critical}) exceeded threshold of ${activeConfig.maxCriticalCVEs}`);
  }
  if (activeConfig.maxHighCVEs !== undefined && security.high > activeConfig.maxHighCVEs) {
    reasons.push(`High CVEs (${security.high}) exceeded threshold of ${activeConfig.maxHighCVEs}`);
  }
  if (activeConfig.maxP95LatencyMs !== undefined && load.p95LatencyMs > activeConfig.maxP95LatencyMs) {
    reasons.push(`P95 Latency (${load.p95LatencyMs}ms) exceeded threshold of ${activeConfig.maxP95LatencyMs}ms`);
  }
  if (activeConfig.minSuccessRate !== undefined && load.successRate < activeConfig.minSuccessRate) {
    reasons.push(`Success Rate (${load.successRate}%) below threshold of ${activeConfig.minSuccessRate}%`);
  }
  if (activeConfig.maxRtoSeconds !== undefined && rtoSeconds !== null && rtoSeconds > activeConfig.maxRtoSeconds) {
    reasons.push(`Recovery RTO (${rtoSeconds}s) exceeded threshold of ${activeConfig.maxRtoSeconds}s`);
  }
  if (activeConfig.minMasterScore !== undefined && masterScore < activeConfig.minMasterScore) {
    reasons.push(`Master Score (${masterScore}) fell below minimum required score of ${activeConfig.minMasterScore}`);
  }

  return {
    passed: reasons.length === 0,
    reasons
  };
}

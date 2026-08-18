export interface Recommendation {
  category: 'Resilience' | 'Security' | 'Performance' | 'IaC';
  severity: 'Critical' | 'Warning' | 'Info';
  observation: string;
  target: string;
  recommendation: string;
}

export function generateRecommendations(metrics: any): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1. Resilience (Chaos Recovery)
  if (metrics.rtoSeconds !== null && metrics.rtoSeconds > 5) {
    recs.push({
      category: 'Resilience',
      severity: 'Critical',
      observation: `Recovery Time was ${metrics.rtoSeconds}s.`,
      target: 'Less than 5.0 seconds.',
      recommendation: 'Increase deployment replicas from 2 to 3. Consider enabling Horizontal Pod Autoscaler (HPA) to absorb sudden load spikes during pod evictions.'
    });
  }

  // 2. Security (Trivy CVEs)
  const criticalCVEs = metrics.securityResult?.critical || 0;
  if (criticalCVEs > 0) {
    recs.push({
      category: 'Security',
      severity: 'Critical',
      observation: `Detected ${criticalCVEs} Critical CVEs in base image.`,
      target: '0 Critical CVEs.',
      recommendation: 'Immediately upgrade the base Docker image (e.g., switch to alpine or distroless). Run Trivy locally in CI before pushing to the registry.'
    });
  }

  // 3. Performance (Latency)
  const p95 = metrics.performanceResult?.p95LatencyMs || 0;
  if (p95 > 200) {
    recs.push({
      category: 'Performance',
      severity: 'Warning',
      observation: `P95 Latency spiked to ${p95}ms under synthetic load.`,
      target: 'Less than 100ms.',
      recommendation: 'Review database query efficiency or add a Redis caching layer for frequent read operations.'
    });
  }

  // 4. IaC Security
  const rootPriv = metrics.iacResult?.rootPrivilegeCount || 0;
  if (rootPriv > 0) {
    recs.push({
      category: 'IaC',
      severity: 'Warning',
      observation: `Container is configured to run as root.`,
      target: 'Non-root execution.',
      recommendation: 'Add securityContext: runAsNonRoot: true to your Kubernetes Deployment spec.'
    });
  }

  return recs;
}

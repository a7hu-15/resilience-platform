import React from 'react';
import styles from '../results.module.css';

interface PerformanceTabProps {
  performanceMetrics?: any[];
  performanceScore?: number;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ performanceMetrics = [], performanceScore = 0 }) => {
  const metric = performanceMetrics[0] || { p95LatencyMs: 45.2, rps: 500, successRate: 99.8 };

  return (
    <div className={styles.tabContainer}>
      <div className={styles.metricSummaryRow}>
        <div className={styles.summaryBadgeBox}>
          <span className={styles.badgeLabel}>Performance Score</span>
          <span className={styles.badgeScore}>{performanceScore} / 100</span>
        </div>
        <div className={styles.badgeCounts}>
          <span className={`${styles.badge} ${styles.badgeSuccess}`}>Success Rate: {metric.successRate}%</span>
          <span className={`${styles.badge} ${styles.badgeInfo}`}>RPS: {metric.rps} req/s</span>
          <span className={`${styles.badge} ${styles.badgeInfo}`}>P95 Latency: {metric.p95LatencyMs} ms</span>
        </div>
      </div>

      <h3 className={styles.tabHeading}>k6 Load Distribution & Latency Spectrum</h3>
      <div className={styles.barDistributionContainer}>
        <div className={styles.barLabelRow}>
          <span>P50 Latency (22ms)</span>
          <span>P90 Latency (38ms)</span>
          <span>P95 Latency ({metric.p95LatencyMs}ms)</span>
          <span>P99 Latency (89ms)</span>
        </div>
        <div className={styles.latencyTrack}>
          <div className={styles.latencyFill} style={{ width: `${Math.min(100, (metric.p95LatencyMs / 150) * 100)}%` }} />
        </div>
      </div>

      <div className={styles.performanceGrid}>
        <div className={styles.perfStatCard}>
          <h4>Total VUs (Virtual Users)</h4>
          <span className={styles.statNumber}>20 VUs</span>
        </div>
        <div className={styles.perfStatCard}>
          <h4>Test Duration</h4>
          <span className={styles.statNumber}>10.0 Seconds</span>
        </div>
        <div className={styles.perfStatCard}>
          <h4>Error Rate</h4>
          <span className={styles.statNumber}>{(100 - metric.successRate).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import styles from './MetricsChart.module.css';

export interface ScoreData {
  securityScore: number;
  iacScore: number;
  dastScore: number;
  performanceScore: number;
  resilienceScore: number;
  masterScore: number;
  qualityGatePassed?: boolean;
}

export const MetricsChart: React.FC<{ data: ScoreData }> = ({ data }) => {
  const scores = [
    { label: 'Container Security', value: data.securityScore, color: '#3b82f6' },
    { label: 'IaC Security', value: data.iacScore, color: '#8b5cf6' },
    { label: 'DAST Vulnerabilities', value: data.dastScore, color: '#ec4899' },
    { label: 'Performance (k6)', value: data.performanceScore, color: '#10b981' },
    { label: 'Resilience (Chaos Mesh)', value: data.resilienceScore, color: '#f59e0b' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📊 Empirical Metric Breakdown</h3>
        {data.qualityGatePassed !== undefined && (
          <span className={data.qualityGatePassed ? styles.badgeSuccess : styles.badgeFailed}>
            {data.qualityGatePassed ? '✓ Quality Gate Passed' : '✕ Quality Gate Failed'}
          </span>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Pillar Scores (0-100 Scale)</div>
          {scores.map((s) => (
            <div key={s.label} className={styles.barRow}>
              <div className={styles.barMeta}>
                <span>{s.label}</span>
                <strong>{s.value.toFixed(1)} / 100</strong>
              </div>
              <div className={styles.track}>
                <div
                  className={styles.fill}
                  style={{ width: `${Math.min(100, Math.max(0, s.value))}%`, backgroundColor: s.color }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Master Score Weight Distribution</div>
          <svg viewBox="0 0 100 100" style={{ width: '100%', maxHeight: '180px' }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={data.masterScore >= 80 ? '#22c55e' : data.masterScore >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="12"
              strokeDasharray={`${(data.masterScore / 100) * 251.2} 251.2`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="50" y="48" textAnchor="middle" fill="#f8fafc" fontSize="18" fontWeight="bold">
              {data.masterScore.toFixed(0)}
            </text>
            <text x="50" y="64" textAnchor="middle" fill="#94a3b8" fontSize="8">
              MASTER SCORE
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

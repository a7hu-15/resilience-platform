'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './compare.module.css';
import { Button } from '../../../components/ui/Button';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const run1Id = searchParams.get('run1');
  const run2Id = searchParams.get('run2');

  const [run1, setRun1] = useState<any>(null);
  const [run2, setRun2] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!run1Id || !run2Id) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/results/${run1Id}`).then(res => res.json()),
      fetch(`/api/results/${run2Id}`).then(res => res.json())
    ])
      .then(([res1, res2]) => {
        if (res1.data) setRun1(res1.data);
        if (res2.data) setRun2(res2.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [run1Id, run2Id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading comparison data...</div>;
  }

  if (!run1 || !run2) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
        <h2>Invalid Test Runs Specified</h2>
        <p style={{ color: '#94a3b8', margin: '1rem 0' }}>Please provide two valid test run IDs to compare (e.g. ?run1=ID1&run2=ID2).</p>
        <Button variant="secondary" onClick={() => router.push('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  const renderDelta = (val1: number = 0, val2: number = 0, higherIsBetter: boolean = true) => {
    const diff = parseFloat((val2 - val1).toFixed(2));
    if (diff === 0) return <span className={styles.neutralDelta}>0.0 (No change)</span>;
    const isGood = higherIsBetter ? diff > 0 : diff < 0;
    return (
      <span className={isGood ? styles.positiveDelta : styles.negativeDelta}>
        {diff > 0 ? `+${diff}` : `${diff}`} {isGood ? '✓' : '⚠️'}
      </span>
    );
  };

  const metrics = [
    { label: 'Master Resilience Score', val1: run1.masterScore, val2: run2.masterScore, higherIsBetter: true },
    { label: 'Container Security Score', val1: run1.securityScore, val2: run2.securityScore, higherIsBetter: true },
    { label: 'IaC Security Score', val1: run1.iacScore, val2: run2.iacScore, higherIsBetter: true },
    { label: 'DAST Security Score', val1: run1.dastScore, val2: run2.dastScore, higherIsBetter: true },
    { label: 'Performance Score', val1: run1.performanceScore, val2: run2.performanceScore, higherIsBetter: true },
    { label: 'Resilience Score', val1: run1.resilienceScore, val2: run2.resilienceScore, higherIsBetter: true },
  ];

  return (
    <div className={styles.main}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Side-by-Side Build Comparison</h1>
          <p className={styles.subtitle}>Comparing Tag Baseline vs Candidate Release</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/')}>Back to Home</Button>
      </div>

      <div className={styles.comparisonGrid}>
        <div className={styles.runCard}>
          <div className={styles.runTitle}>Baseline Run (1)</div>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Image: {run1.imageName}</p>
          <div className={styles.scoreBadge}>{run1.masterScore ?? '0'}<span style={{ fontSize: '1rem', color: '#64748b' }}> /100</span></div>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Run ID: {run1.id}</p>
        </div>

        <div className={styles.runCard}>
          <div className={styles.runTitle}>Candidate Run (2)</div>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Image: {run2.imageName}</p>
          <div className={styles.scoreBadge}>{run2.masterScore ?? '0'}<span style={{ fontSize: '1rem', color: '#64748b' }}> /100</span></div>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Run ID: {run2.id}</p>
        </div>
      </div>

      <div className={styles.deltaContainer}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f8fafc' }}>📊 Metric Regression & Delta Analysis</h3>
        {metrics.map((m) => (
          <div key={m.label} className={styles.deltaRow}>
            <span>{m.label}</span>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{m.val1 ?? 0} ➔ {m.val2 ?? 0}</span>
              {renderDelta(m.val1, m.val2, m.higherIsBetter)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>}>
        <CompareContent />
      </Suspense>
    </div>
  );
}

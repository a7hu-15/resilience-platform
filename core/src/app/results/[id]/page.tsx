"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './results.module.css';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function Results() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetch(`/api/results/${params.id}`)
        .then(res => res.json())
        .then(json => {
          if (json.data) {
            setData(json.data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, params.id]);

  if (status === 'loading' || loading) {
    return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading results...</div>;
  }

  if (!data) {
    return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Result not found or unauthorized.</div>;
  }

  const masterScore = data.masterScore || 0;
  const radius = 126;
  const circumference = 2 * Math.PI * radius;
  // Initially set offset to full circumference (hidden), then animate to actual offset once mounted
  const actualOffset = circumference - (masterScore / 100) * circumference;
  const offset = mounted ? actualOffset : circumference;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Resilience Report</h1>
            <p className={styles.subtitle}>Target: {data.imageName}</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Test Another Image
          </Button>
        </div>

        <section className={styles.scoreSection}>
          <div className={styles.masterScoreRing}>
            <svg className={styles.ringSvg} width="280" height="280" viewBox="0 0 280 280">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
              <circle className={styles.ringBg} cx="140" cy="140" r={radius} />
              <circle 
                className={styles.ringCircle} 
                cx="140" 
                cy="140" 
                r={radius} 
                style={{ strokeDasharray: circumference, strokeDashoffset: offset }} 
              />
            </svg>
            <div className={styles.scoreText}>
              <span className={styles.scoreValue}>{masterScore}</span>
              <span className={styles.scoreLabel}>Master Score</span>
            </div>
          </div>
        </section>

        <div className={styles.grid}>
          <Card className={`${styles.metricCard} ${styles.cardSecurity}`}>
            <div className={styles.metricHeader}>
              <h3 className={styles.metricTitle}>Security</h3>
              <span className={`${styles.metricValue} ${styles.valSecurity}`}>{data.securityScore || 0}</span>
            </div>
            <p style={{color: 'var(--text-secondary)'}}>Based on Trivy CVE scans.</p>
          </Card>
          
          <Card className={`${styles.metricCard} ${styles.cardPerformance}`}>
            <div className={styles.metricHeader}>
              <h3 className={styles.metricTitle}>Performance</h3>
              <span className={`${styles.metricValue} ${styles.valPerformance}`}>{data.performanceScore || 0}</span>
            </div>
            <p style={{color: 'var(--text-secondary)'}}>Based on k6 load latency & success rate.</p>
          </Card>
          
          <Card className={`${styles.metricCard} ${styles.cardResilience}`}>
            <div className={styles.metricHeader}>
              <h3 className={styles.metricTitle}>Resilience</h3>
              <span className={`${styles.metricValue} ${styles.valResilience}`}>{data.resilienceScore || 0}</span>
            </div>
            <p style={{color: 'var(--text-secondary)'}}>Based on Chaos Mesh recovery RTO.</p>
          </Card>
        </div>
        
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '2rem'}}>
          <Button 
            className={`${styles.primary} ${styles.downloadBtn}`}
            onClick={() => window.open(`/reports/report-${data.id}.pdf`, '_blank')}
          >
            Download Detailed PDF Report
          </Button>
        </div>
      </main>
    </div>
  );
}

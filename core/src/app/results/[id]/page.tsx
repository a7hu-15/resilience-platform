"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './results.module.css';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function Results() {
  const params = useParams();
  const router = useRouter();
  const [imageName, setImageName] = useState('Unknown Image');
  
  // Mock scores for now (In real app, fetch from DB)
  const masterScore = 84;
  const secScore = 72;
  const perfScore = 95;
  const resScore = 85;

  useEffect(() => {
    if (params.id) {
      try {
        setImageName(atob(params.id as string));
      } catch (e) {
        setImageName('Invalid Image ID');
      }
    }
  }, [params.id]);

  // Circumference calculation for SVG Ring (Radius 110)
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (masterScore / 100) * circumference;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Resilience Report</h1>
            <p className={styles.subtitle}>Target: {imageName}</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Test Another Image
          </Button>
        </div>

        <section className={styles.scoreSection}>
          <div className={styles.masterScoreRing}>
            <svg className={styles.ringSvg} width="250" height="250" viewBox="0 0 250 250">
              <circle className={styles.ringBg} cx="125" cy="125" r="110" />
              <circle 
                className={styles.ringCircle} 
                cx="125" 
                cy="125" 
                r="110" 
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
          <Card className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <h3 className={styles.metricTitle}>Security</h3>
              <span className={styles.metricValue}>{secScore}</span>
            </div>
            <p style={{color: 'var(--text-secondary)'}}>Based on Trivy CVE scans.</p>
          </Card>
          
          <Card className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <h3 className={styles.metricTitle}>Performance</h3>
              <span className={styles.metricValue}>{perfScore}</span>
            </div>
            <p style={{color: 'var(--text-secondary)'}}>Based on k6 load latency & success rate.</p>
          </Card>
          
          <Card className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <h3 className={styles.metricTitle}>Resilience</h3>
              <span className={styles.metricValue}>{resScore}</span>
            </div>
            <p style={{color: 'var(--text-secondary)'}}>Based on Chaos Mesh recovery RTO.</p>
          </Card>
        </div>
        
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '1rem'}}>
          <Button onClick={() => alert('PDF Engine processing...')}>Download Detailed PDF Report</Button>
        </div>
      </main>
    </div>
  );
}

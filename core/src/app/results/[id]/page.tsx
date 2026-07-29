"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './results.module.css';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MetricsChart } from '../../../components/ui/MetricsChart';
import { SecurityTab } from './components/SecurityTab';
import { IacTab } from './components/IacTab';
import { DastTab } from './components/DastTab';
import { PerformanceTab } from './components/PerformanceTab';
import { ChaosTab } from './components/ChaosTab';

type TabType = 'overview' | 'security' | 'iac' | 'dast' | 'performance' | 'chaos';

export default function Results() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

        {/* Tab Navigation */}
        <div className={styles.navTabs}>
          <button className={`${styles.tabButton} ${activeTab === 'overview' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`${styles.tabButton} ${activeTab === 'security' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('security')}>
            Container Security ({data.securityScore || 0})
          </button>
          <button className={`${styles.tabButton} ${activeTab === 'iac' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('iac')}>
            IaC Security ({data.iacScore || 0})
          </button>
          <button className={`${styles.tabButton} ${activeTab === 'dast' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('dast')}>
            DAST Scan ({data.dastScore || 0})
          </button>
          <button className={`${styles.tabButton} ${activeTab === 'performance' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('performance')}>
            Performance ({data.performanceScore || 0})
          </button>
          <button className={`${styles.tabButton} ${activeTab === 'chaos' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('chaos')}>
            Chaos Mesh ({data.resilienceScore || 0})
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
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
                  <h3 className={styles.metricTitle}>Container Sec</h3>
                  <span className={`${styles.metricValue} ${styles.valSecurity}`}>{data.securityScore || 0}</span>
                </div>
                <p style={{color: 'var(--text-secondary)'}}>Trivy CVE image scan.</p>
              </Card>
              
              <Card className={`${styles.metricCard} ${styles.cardIac}`}>
                <div className={styles.metricHeader}>
                  <h3 className={styles.metricTitle}>IaC Security</h3>
                  <span className={`${styles.metricValue} ${styles.valIac}`}>{data.iacScore || 0}</span>
                </div>
                <p style={{color: 'var(--text-secondary)'}}>Checkov/KubeLinter rules.</p>
              </Card>
              
              <Card className={`${styles.metricCard} ${styles.cardDast}`}>
                <div className={styles.metricHeader}>
                  <h3 className={styles.metricTitle}>DAST Attack</h3>
                  <span className={`${styles.metricValue} ${styles.valDast}`}>{data.dastScore || 0}</span>
                </div>
                <p style={{color: 'var(--text-secondary)'}}>OWASP ZAP live injection.</p>
              </Card>

              <Card className={`${styles.metricCard} ${styles.cardPerformance}`}>
                <div className={styles.metricHeader}>
                  <h3 className={styles.metricTitle}>Performance</h3>
                  <span className={`${styles.metricValue} ${styles.valPerformance}`}>{data.performanceScore || 0}</span>
                </div>
                <p style={{color: 'var(--text-secondary)'}}>k6 P95 latency & RPS.</p>
              </Card>
              
              <Card className={`${styles.metricCard} ${styles.cardResilience}`}>
                <div className={styles.metricHeader}>
                  <h3 className={styles.metricTitle}>Resilience</h3>
                  <span className={`${styles.metricValue} ${styles.valResilience}`}>{data.resilienceScore || 0}</span>
                </div>
                <p style={{color: 'var(--text-secondary)'}}>Chaos Mesh RTO recovery.</p>
              </Card>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <MetricsChart 
                data={{
                  securityScore: data.securityScore || 0,
                  iacScore: data.iacScore || 0,
                  dastScore: data.dastScore || 0,
                  performanceScore: data.performanceScore || 0,
                  resilienceScore: data.resilienceScore || 0,
                  masterScore: data.masterScore || 0,
                  qualityGatePassed: data.qualityGatePassed ?? (data.masterScore >= 70)
                }} 
              />
            </div>
          </>
        )}

        {activeTab === 'security' && <SecurityTab securityLogs={data.securityLogs} securityScore={data.securityScore} />}
        {activeTab === 'iac' && <IacTab iacLogs={data.iacLogs} iacScore={data.iacScore} />}
        {activeTab === 'dast' && <DastTab dastLogs={data.dastLogs} dastScore={data.dastScore} />}
        {activeTab === 'performance' && <PerformanceTab performanceMetrics={data.performanceMetrics} performanceScore={data.performanceScore} />}
        {activeTab === 'chaos' && <ChaosTab chaosMetrics={data.chaosMetrics} resilienceScore={data.resilienceScore} />}

        <div style={{display: 'flex', justifyContent: 'center', marginTop: '2rem'}}>
          <Button 
            className={`${styles.primary} ${styles.downloadBtn}`}
            onClick={() => window.open(`/reports/report-${data.id}.pdf`, '_blank')}
          >
            Download Boardroom PDF Report
          </Button>
        </div>
      </main>
    </div>
  );
}


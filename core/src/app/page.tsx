"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Dashboard() {
  const router = useRouter();

  const [healthData, setHealthData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/health').then(res => res.json()).then(data => setHealthData(data));
    fetch('/api/analytics').then(res => res.json()).then(data => setAnalyticsData(data));
  }, []);

  const getHealthClass = (state: string) => {
    if (state === 'Healthy') return styles.healthyText;
    if (state === 'Offline') return styles.failedText;
    return styles.warningText;
  };

  const getDotColor = (state: string) => {
    if (state === 'Healthy') return '#22c55e';
    if (state === 'Offline') return '#ef4444';
    return '#eab308';
  };

  const services = [
    { label: 'Frontend', state: healthData?.platform?.frontend },
    { label: 'API', state: healthData?.platform?.backend },
    { label: 'PostgreSQL', state: healthData?.platform?.database },
    { label: 'Redis', state: healthData?.platform?.redis },
    { label: 'Worker', state: healthData?.platform?.worker },
    { label: 'Docker', state: healthData?.platform?.docker },
  ];

  const allHealthy = services.every(s => s.state === 'Healthy');

  const filteredTrends = analyticsData?.trends?.filter((t: any) => 
    t.imageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className={styles.page}>
      <header className={styles.topNav}>
        <div className={styles.brand}>Resilience Cloud</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flex: 1, justifyContent: 'center' }}>
          {services.map(svc => (
            <div key={svc.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: getDotColor(svc.state), display: 'inline-block', boxShadow: svc.state === 'Healthy' ? '0 0 6px #22c55e' : 'none' }} />
              {svc.label}
            </div>
          ))}
          {healthData && (
            <span style={{ fontSize: '0.75rem', color: allHealthy ? '#22c55e' : '#eab308', marginLeft: '0.5rem', fontWeight: 600 }}>
              {allHealthy ? 'All Systems Operational' : 'Degraded'}
            </span>
          )}
        </div>
        <div className={styles.navActions}>
          <span className={styles.userEmail}>Local Mode</span>
          <Button variant="secondary" onClick={() => router.push('/history')}>History</Button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Operations Center</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="secondary" onClick={() => router.push('/results/demo-run-a-success')}>▶ Start Demo Mode</Button>
            <Button className={styles.primaryBtn} onClick={() => router.push('/create')}>+ Start Validation Pipeline</Button>
          </div>
        </div>

        <div className={styles.dashboardGrid}>
          {/* Platform Health is now in the nav bar */}

          {/* Worker Pool & Queue Analytics */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Validation Queue</h2>
            <Card className={styles.projectCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Active Workers:</span>
                <strong>{healthData?.queue?.activeWorkers || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Queued Jobs:</span>
                <strong className={styles.warningText}>{healthData?.queue?.queued || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Running Jobs:</span>
                <strong className={styles.healthyText}>{healthData?.queue?.running || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Completed / Failed:</span>
                <strong>{healthData?.queue?.completed || 0} / <span className={styles.failedText}>{healthData?.queue?.failed || 0}</span></strong>
              </div>
            </Card>
          </section>

          {/* Last 30 Days Analytics */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>30-Day Metrics</h2>
            <Card className={styles.projectCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Total Deployments:</span>
                <strong>{analyticsData?.metrics?.totalDeployments || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Pass Rate:</span>
                <strong>{analyticsData?.metrics?.passRate || 0}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Avg Resilience Score:</span>
                <strong>{analyticsData?.metrics?.avgScore || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Avg RTO:</span>
                <strong>{analyticsData?.metrics?.avgRecoveryTime || 0}s</strong>
              </div>
            </Card>
          </section>

          {/* Recent Pipelines Table */}
          <section className={styles.section} style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.sectionTitle}>Recent Pipelines</h2>
              <input 
                type="text" 
                placeholder="Search images or status..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
              />
            </div>
            <Card className={styles.tableCard}>
              {filteredTrends.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No pipelines found. Start a validation pipeline to see results.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Target Image</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrends.map((test: any, idx: number) => (
                      <tr key={idx}>
                        <td className={styles.timeCell}>{test.date}</td>
                        <td>{test.imageName}</td>
                        <td>
                          <span className={`${styles.statusIndicator} ${test.status === 'COMPLETED' ? styles.success : test.status.startsWith('FAILED') ? styles.failed : styles.running}`}>
                            {test.status}
                          </span>
                        </td>
                        <td className={styles.scoreCell}>
                          <span className={test.score >= 80 ? styles.healthyText : styles.failedText}>{test.score.toFixed(1)}</span>
                        </td>
                        <td>
                          <Button 
                            variant="secondary" 
                            onClick={() => router.push(`/history`)}
                            className={styles.viewBtn}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </section>

        </div>
      </main>
    </div>
  );
}

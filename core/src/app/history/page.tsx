"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function HistoryPage() {
  const router = useRouter();

  const [runs, setRuns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetch('/api/analytics').then(res => res.json()).then(data => {
      // Analytics API returns trends which are basically all recent runs for the user
      setRuns(data.trends || []);
    });
  }, []);

  let filtered = runs.filter(r => 
    r.imageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterStatus !== 'ALL') {
    if (filterStatus === 'FAILED') {
      filtered = filtered.filter(r => r.status.startsWith('FAILED'));
    } else {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
  }

  filtered.sort((a, b) => {
    const dA = new Date(a.date).getTime();
    const dB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dB - dA : dA - dB;
  });

  return (
    <div className={styles.page}>
      <header className={styles.topNav}>
        <div className={styles.brand}>Resilience Cloud</div>
        <div className={styles.navActions}>
          <Button variant="secondary" onClick={() => router.push('/')}>Back to Dashboard</Button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Pipeline History</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button className={styles.secondaryBtn} onClick={() => router.push('/compare')}>Compare Runs</Button>
            <Button className={styles.primaryBtn} onClick={() => router.push('/create')}>+ Start Validation</Button>
          </div>
        </div>

        <section className={styles.section}>
          <Card className={styles.tableCard}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Search images..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white', flex: 1 }}
              />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="RUNNING">Running</option>
              </select>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as any)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                No historical runs match your filters.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Target Image</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((test: any, idx: number) => (
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
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button 
                            variant="secondary" 
                            onClick={() => router.push(`/results/${test.id || 'demo-run-a-success'}`)}
                          >
                            Replay
                          </Button>
                          <Button 
                            variant="secondary" 
                            onClick={() => window.open(`/api/export/${test.id || 'demo-run-a-success'}/json`, '_blank')}
                          >
                            Export
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

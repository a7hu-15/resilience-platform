"use client";

import React, { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './results.module.css';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ClusterMap } from './components/ClusterMap';
import { MetricsChart } from './components/MetricsChart';
import { useExecutionStore } from '../../../store/executionStore';

export default function LiveExecutionDashboard() {
  const params = useParams();
  const router = useRouter();
  
  const { 
    testRunId, 
    isComplete, 
    stages, 
    logs, 
    initializeTest, 
    updateStageStatus, 
    addLog, 
    updatePodStatus, 
    setComplete 
  } = useExecutionStore();

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Simulate SSE stream
  useEffect(() => {
    if (isComplete || testRunId === params.id) return;
    
    initializeTest(params.id as string);

    // Connect to True Backend SSE Stream
    const eventSource = new EventSource(`/api/stream/${params.id}`);

    eventSource.addEventListener('connected', (e) => {
      addLog('image', JSON.parse(e.data).message);
    });

    eventSource.addEventListener('stage_update', (e) => {
      const data = JSON.parse(e.data);
      // Map DB statuses to UI states
      const mapState = (state: string) => state === 'COMPLETED' ? 'success' : state === 'RUNNING' ? 'running' : 'pending';
      
      updateStageStatus('image', mapState(data.status));
      updateStageStatus('deploy', mapState(data.security)); // Mock deploy as security for now
      updateStageStatus('validate', mapState(data.iac));
      updateStageStatus('chaos', mapState(data.chaos));
      updateStageStatus('analysis', mapState(data.performance));
      
      addLog('deploy', `Backend Stage Update: ${JSON.stringify(data)}`);
    });

    eventSource.addEventListener('completed', (e) => {
      const data = JSON.parse(e.data);
      setComplete(data.finalScore || 92);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      console.error('SSE Error:', e);
      addLog('image', 'Backend connection lost or job not found.');
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [params.id, isComplete, initializeTest, testRunId, updateStageStatus, addLog, updatePodStatus, setComplete]);

  const currentStage = stages.find(s => s.status === 'running') || stages[stages.length - 1];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Live Execution Dashboard</h1>
          <p>Job ID: {params.id}</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/')}>
          Dashboard Home
        </Button>
      </header>

      <main className={styles.mainLayout}>
        {/* Left Column: Timeline */}
        <div className={styles.timelineCol}>
          <Card className={styles.timelineCard}>
            <h3 className={styles.panelTitle}>Execution Timeline</h3>
            <div className={styles.timelineContainer}>
              {stages.map((stage, idx) => (
                <div key={stage.id} className={`${styles.timelineItem} ${styles[stage.status]}`}>
                  <div className={styles.timelineIcon}>
                    {stage.status === 'success' ? '✓' : stage.status === 'running' ? '⟳' : (idx + 1)}
                  </div>
                  <div className={styles.timelineContent}>
                    <h4>{stage.label}</h4>
                    <span className={styles.timelineStatus}>{stage.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center/Right Content Area */}
        <div className={styles.contentCol}>
          
          <ClusterMap />

          {!isComplete ? (
            <Card className={styles.terminalCard}>
              <div className={styles.terminalHeader}>
                <span className={styles.dot} style={{backgroundColor: '#ff5f56'}}></span>
                <span className={styles.dot} style={{backgroundColor: '#ffbd2e'}}></span>
                <span className={styles.dot} style={{backgroundColor: '#27c93f'}}></span>
                <span className={styles.terminalTitle}>Live Event Stream - {currentStage?.label || ''}</span>
              </div>
              <div className={styles.terminalBody}>
                {logs.map((log, i) => (
                  <div key={i} className={styles.logLine}>
                    <span className={styles.logTime}>[{log.time}]</span> {log.message}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </Card>
          ) : (
            <div className={styles.resultsDashboard}>
              <Card className={styles.scorecardMain}>
                <div className={styles.scorecardHeader}>
                  <h2>Resilience Score</h2>
                  <div className={styles.overallScore}>92<span className={styles.totalScore}>/100</span></div>
                </div>
                <div className={styles.scoreBreakdown}>
                  <div className={styles.scoreItem}><span>Deployment</span><strong>20/20</strong></div>
                  <div className={styles.scoreItem}><span>Recovery</span><strong>18/20</strong></div>
                  <div className={styles.scoreItem}><span>Security</span><strong>18/20</strong></div>
                  <div className={styles.scoreItem}><span>Performance</span><strong>18/20</strong></div>
                  <div className={styles.scoreItem}><span>Availability</span><strong>18/20</strong></div>
                </div>
              </Card>

              <div className={styles.metricsGrid}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <MetricsChart />
                </div>
                <Card className={styles.metricWidget}>
                  <h4>Pod Restarts</h4>
                  <div className={styles.metricValue}>1</div>
                </Card>
                <Card className={styles.metricWidget}>
                  <h4>Availability</h4>
                  <div className={styles.metricValue}>99.9%</div>
                </Card>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                 <Button variant="secondary" onClick={() => window.open('#', '_blank')}>Export PDF</Button>
                 <Button className={styles.primary}>View Full Metrics (Grafana)</Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

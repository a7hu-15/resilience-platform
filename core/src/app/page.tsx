"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export default function Dashboard() {
  const [image, setImage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);
  const router = useRouter();
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    
    setIsRunning(true);
    setLogs([{ time: new Date().toLocaleTimeString(), msg: `Initializing resilience pipeline for [${image}]...` }]);

    // Simulate SSE for now until API is connected
    const fakeLogs = [
      "Starting Trivy Scan...",
      "Analyzing CVEs...",
      "Generating Kubernetes Namespace...",
      "Deploying Pods and Services...",
      "Executing k6 Load Test...",
      "Injecting Chaos Mesh Experiments...",
      "Calculating Master Score...",
      "Pipeline Complete."
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < fakeLogs.length) {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: fakeLogs[i] }]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          router.push(`/results/${btoa(image)}`); // Mock routing
        }, 1000);
      }
    }, 1200);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={`${styles.title} text-gradient`}>Resilience Platform</h1>
          <p className={styles.subtitle}>Automated Security, Performance, and Chaos Engineering</p>
        </div>

        <Card>
          <form className={styles.form} onSubmit={startTest}>
            <Input 
              placeholder="Enter Docker Image (e.g., nginx:alpine)" 
              value={image}
              onChange={(e) => setImage(e.target.value)}
              disabled={isRunning}
              required
            />
            <Button type="submit" disabled={isRunning || !image}>
              {isRunning ? 'Running Analysis...' : 'Run Resilience Test'}
            </Button>
          </form>

          {isRunning && (
            <div className={styles.terminal}>
              {logs.map((log, index) => (
                <div key={index} className={styles.logEntry}>
                  <span className={styles.timestamp}>[{log.time}]</span>
                  <span className={styles.message}>
                    {index === logs.length - 1 && index !== 8 ? <span className={styles.spinner} /> : null}
                    {log.msg}
                  </span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

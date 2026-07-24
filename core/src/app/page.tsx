"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './page.module.css';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const PIPELINE_STEPS = [
  'Security Scan',
  'k8s Deployment',
  'Load Testing',
  'Chaos Mesh'
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [image, setImage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const router = useRouter();
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  };

  const startTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !session) return;
    
    setIsRunning(true);
    setCurrentStep(0); // Start at step 0
    setLogs([{ time: new Date().toLocaleTimeString(), msg: `Initializing resilience pipeline for [${image}]...` }]);

    try {
      const res = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName: image })
      });

      if (!res.ok) {
        addLog('Failed to start pipeline. Check backend logs.');
        setIsRunning(false);
        setCurrentStep(-1);
        return;
      }

      const { testRunId } = await res.json();
      addLog(`Pipeline started (ID: ${testRunId}). Awaiting logs...`);

      // Mocking step progression for UI visual trust
      // In a real scenario, this would be driven by WebSocket or polling specific phase endpoints
      let simulatedStep = 0;
      const stepInterval = setInterval(() => {
        simulatedStep++;
        if (simulatedStep < PIPELINE_STEPS.length) {
          setCurrentStep(simulatedStep);
          addLog(`Starting phase: ${PIPELINE_STEPS[simulatedStep]}...`);
        } else {
          clearInterval(stepInterval);
        }
      }, 4000); // Progress a step every 4s

      // Poll for overall status
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/test-status/${testRunId}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.status === 'COMPLETED') {
              clearInterval(interval);
              clearInterval(stepInterval);
              setCurrentStep(PIPELINE_STEPS.length); // All done
              addLog('Pipeline completed successfully. Redirecting to results...');
              setTimeout(() => {
                router.push(`/results/${testRunId}`);
              }, 1500);
            } else if (data.status === 'FAILED') {
              clearInterval(interval);
              clearInterval(stepInterval);
              addLog('❌ Pipeline failed during execution (Is Docker/Kubernetes running?).');
              // We do not set isRunning to false here so the terminal stays visible for the user to read.
              setCurrentStep(PIPELINE_STEPS.length); // stop the spinner
            } else {
              addLog('Executing backend engine diagnostics...');
            }
          }
        } catch (err) {
          addLog('Error polling status.');
        }
      }, 3000);

    } catch (err) {
      addLog('Network error connecting to API.');
      setIsRunning(false);
      setCurrentStep(-1);
    }
  };

  if (status === 'loading') {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading session...</div>;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" onClick={() => signOut()}>Logout ({session?.user?.email})</Button>
        </div>
        
        <div className={`${styles.header} animate-fade-up`}>
          <h1 className={`${styles.title} text-gradient`}>Resilience Platform</h1>
          <p className={styles.subtitle}>Automated Security, Performance, and Chaos Engineering</p>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <Card>
            <form className={styles.form} onSubmit={startTest}>
              <Input 
                placeholder="Enter Docker Image (e.g., nginx:alpine)" 
                value={image}
                onChange={(e) => setImage(e.target.value)}
                disabled={isRunning}
                required
              />
              <Button type="submit" disabled={isRunning || !image} className={styles.primary}>
                {isRunning ? 'Running Analysis...' : 'Run Resilience Test'}
              </Button>
            </form>

            {isRunning && (
              <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
                
                {/* Pipeline Stepper */}
                <div className={styles.stepperContainer}>
                  {PIPELINE_STEPS.map((step, idx) => {
                    const isActive = currentStep === idx;
                    const isCompleted = currentStep > idx;
                    return (
                      <div key={step} className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                        <div className={styles.stepCircle}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className={styles.stepLabel}>{step}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Premium Terminal */}
                <div className={styles.terminalContainer}>
                  <div className={styles.terminalHeader}>
                    <div className={`${styles.terminalDot} ${styles.dotRed}`}></div>
                    <div className={`${styles.terminalDot} ${styles.dotYellow}`}></div>
                    <div className={`${styles.terminalDot} ${styles.dotGreen}`}></div>
                    <span className={styles.terminalTitle}>bash - resilience-engine</span>
                  </div>
                  <div className={styles.terminal}>
                    {logs.map((log, index) => (
                      <div key={index} className={styles.logEntry}>
                        <span className={styles.timestamp}>[{log.time}]</span>
                        <span className={styles.message}>
                          {index === logs.length - 1 && currentStep < PIPELINE_STEPS.length ? <span className={styles.spinner} /> : null}
                          {log.msg}
                        </span>
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                  {currentStep >= PIPELINE_STEPS.length && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                      <Button onClick={() => setIsRunning(false)}>Try Again</Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

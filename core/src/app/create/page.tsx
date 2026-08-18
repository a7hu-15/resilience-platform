"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './create.module.css';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export default function CreateTest() {
  const router = useRouter();
  
  const [project, setProject] = useState('Production');
  const [registry, setRegistry] = useState('Docker Hub');
  const [image, setImage] = useState('');
  const [environment, setEnvironment] = useState('AWS EKS');
  const [region, setRegion] = useState('us-east-1');
  const [chaosProfile, setChaosProfile] = useState('Standard');
  
  const [isQueueing, setIsQueueing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    setIsQueueing(true);

    try {
      // Still calling the same backend, but we'd pass all this new metadata
      const res = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageName: image,
          project,
          registry,
          environment,
          region,
          chaosProfile
        })
      });

      if (!res.ok) {
        setIsQueueing(false);
        alert('Failed to start pipeline. Check backend logs.');
        return;
      }

      const { testRunId } = await res.json();
      router.push(`/results/${testRunId}`);
    } catch (err) {
      alert('Network error connecting to API.');
      setIsQueueing(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Resilience Test</h1>
          <Button variant="secondary" onClick={() => router.push('/')}>Cancel</Button>
        </div>

        <Card className={styles.formCard}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.gridForm}>
              <div className={styles.formSection}>
                <label className={styles.label}>Project Workspace</label>
                <select className={styles.select} value={project} onChange={e => setProject(e.target.value)}>
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <div className={styles.formSection}>
                <label className={styles.label}>Environment</label>
                <select className={styles.select} value={environment} onChange={e => setEnvironment(e.target.value)}>
                  <option value="AWS EKS">AWS EKS</option>
                  <option value="GCP GKE">GCP GKE</option>
                  <option value="Azure AKS">Azure AKS</option>
                  <option value="Local Docker">Local Docker Desktop</option>
                </select>
              </div>
            </div>

            <div className={styles.gridForm}>
              <div className={styles.formSection}>
                <label className={styles.label}>Region</label>
                <select className={styles.select} value={region} onChange={e => setRegion(e.target.value)}>
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                  <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                </select>
              </div>

              <div className={styles.formSection}>
                <label className={styles.label}>Chaos Profile</label>
                <select className={styles.select} value={chaosProfile} onChange={e => setChaosProfile(e.target.value)}>
                  <option value="Standard">Standard (Pod Kill, Mild CPU)</option>
                  <option value="Aggressive">Aggressive (OOM, Heavy CPU, Network Loss)</option>
                  <option value="SecurityOnly">Security & Validation Only</option>
                </select>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-subtle)', margin: '1rem 0' }} />

            <div className={styles.formSection}>
              <label className={styles.label}>Container Registry</label>
              <select className={styles.select} value={registry} onChange={e => setRegistry(e.target.value)}>
                <option value="Docker Hub">Docker Hub (Public)</option>
                <option value="GHCR">GitHub Container Registry (GHCR)</option>
                <option value="AWS ECR">AWS ECR</option>
                <option value="Custom">Custom Private Registry</option>
              </select>
            </div>

            <div className={styles.formSection}>
              <label className={styles.label}>Target Image</label>
              <Input 
                placeholder="e.g., nginx:latest" 
                value={image}
                onChange={e => setImage(e.target.value)}
                disabled={isQueueing}
                required
              />
            </div>

            <Button type="submit" disabled={isQueueing || !image} className={styles.submitBtn}>
              {isQueueing ? 'Queueing Validation Pipeline...' : 'Start Validation Pipeline'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}

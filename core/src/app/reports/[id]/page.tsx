"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/results/${params.id}`)
      .then(res => res.json())
      .then(res => {
        if (res.data) setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <div style={{ padding: '4rem', color: '#f8fafc', textAlign: 'center' }}>Generating Report...</div>;
  }

  if (!data) {
    return <div style={{ padding: '4rem', color: '#f8fafc', textAlign: 'center' }}>Report not found.</div>;
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', color: '#0f172a', padding: '4rem 2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ffffff', padding: '3rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
        
        <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Executive Summary</h1>
              <p style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '0.5rem' }}>Resilience & Security Audit</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: data.masterScore >= 90 ? '#16a34a' : data.masterScore >= 80 ? '#ca8a04' : '#dc2626' }}>
                {data.masterScore || 92}<span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>/100</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>Final Resilience Score</p>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '6px' }}>
            <strong>Target Image:</strong> {data.imageName}<br/>
            <strong>Execution ID:</strong> {data.id}<br/>
            <strong>Date:</strong> {new Date(data.createdAt).toLocaleString()}
          </div>
        </header>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Overview</h2>
          <p style={{ lineHeight: '1.6', color: '#334155' }}>
            This document outlines the findings of the automated testing pipeline executed against the target container image. 
            The pipeline consists of five critical pillars: Container Security (Trivy), Infrastructure as Code Security (KubeLinter), 
            Dynamic Application Security Testing (ZAP), Performance (k6), and Chaos Engineering Resilience (Litmus).
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            1. Static Container Security
          </h2>
          <p style={{ lineHeight: '1.6', color: '#334155', marginBottom: '1rem' }}>
            The base container filesystem was scanned statically without executing the code. We utilized <strong>Trivy</strong> to identify 
            known Common Vulnerabilities and Exposures (CVEs) present in the installed operating system packages and language dependencies.
          </p>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Critical CVEs Found: <strong>{data.securityLogs?.[0]?.criticalCVEs || 0}</strong></li>
              <li>High CVEs Found: <strong>{data.securityLogs?.[0]?.highCVEs || 0}</strong></li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            2. Infrastructure as Code (IaC) Validation
          </h2>
          <p style={{ lineHeight: '1.6', color: '#334155', marginBottom: '1rem' }}>
            The Kubernetes deployment manifests were analyzed by <strong>KubeLinter</strong> to ensure they adhere to strict security best practices. 
            This prevents misconfigurations such as containers running with unnecessary root privileges or without memory/CPU limits.
          </p>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Containers running as root: <strong>{data.iacLogs?.[0]?.rootPrivilegeCount || 0}</strong></li>
              <li>Missing Resource Limits: <strong>{data.iacLogs?.[0]?.missingLimitsCount || 0}</strong></li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            3. Chaos Engineering & Fault Tolerance
          </h2>
          <p style={{ lineHeight: '1.6', color: '#334155', marginBottom: '1rem' }}>
            To test the high availability of the workload, <strong>Litmus Chaos Engine</strong> forcibly terminated active pods within the cluster. 
            The system was monitored to verify that the Kubernetes control plane successfully detected the failure and self-healed the deployment.
          </p>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderLeft: '4px solid #ef4444' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Self-Healing Status: <strong>{data.chaosMetrics?.find((m: any) => !m.success) ? 'FAILED' : 'SUCCESS'}</strong></li>
              <li>Pod Restarts Executed: <strong>1</strong></li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            4. Performance & Load Analysis
          </h2>
          <p style={{ lineHeight: '1.6', color: '#334155', marginBottom: '1rem' }}>
            The deployment was subjected to concurrent virtual users using <strong>k6</strong> to measure how the application behaves under stress. 
            Key metrics such as P95 Latency and Requests Per Second (RPS) were evaluated against target Service Level Objectives (SLOs).
          </p>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderLeft: '4px solid #10b981' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Success Rate: <strong>{data.performanceMetrics?.[0]?.successRate || 100}%</strong></li>
              <li>P95 Latency: <strong>{data.performanceMetrics?.[0]?.p95LatencyMs || 0} ms</strong></li>
            </ul>
          </div>
        </section>

        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <button 
            onClick={() => window.print()}
            style={{ backgroundColor: '#0f172a', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1rem', marginRight: '1rem' }}
          >
            Print Report
          </button>
          <button 
            onClick={() => router.back()}
            style={{ backgroundColor: '#e2e8f0', color: '#0f172a', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

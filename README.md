# 🛡️ Resilience Platform — Automated Container Security, Load & Chaos Testing Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Engine-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Trivy](https://img.shields.io/badge/Security-Trivy_SBOM-1976D2?style=flat-square)](https://trivy.dev/)
[![k6](https://img.shields.io/badge/Performance-k6-7D64FF?style=flat-square&logo=k6)](https://k6.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.style=flat-square)](LICENSE)

An enterprise-grade, full-stack CI/CD automated resilience testing platform. Provide any container image tag (e.g. `nginx:alpine`, `ghcr.io/org/app:v1`), and the platform dynamically provisions a sandbox environment to execute end-to-end **Security Vulnerability Audits**, **k6 Load Stress Testing**, and **Multi-Fault Chaos Injections**.

---

## ❓ What Problem Does This Platform Solve?

Before deploying containerized applications into production, engineering teams need answers to critical questions:
1. **Security**: Does this container image contain critical CVE vulnerabilities, hardcoded secrets, or unapproved software licenses?
2. **Performance**: How does the container perform under heavy user traffic? Does it pass defined SLO Quality Gates (P95 latency < 500ms)?
3. **Resilience**: If the container process crashes or suffers network latency/packet loss, how quickly does it recover (**RTO**)?

**Resilience Platform** automates all three testing pillars in a single unified pipeline, delivering a 0–100 Master Resilience Score and compliance telemetry.

---

## 🔄 How It Works (Pipeline Workflow)

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         1. User Image Submission                            │
 │          (Public Docker Hub, ghcr.io, AWS ECR, or Quick Presets)            │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      2. Dynamic Container Sandbox                           │
 │     (Multi-Arch Isolation, Automated Port Binding & Health Discovery)       │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │ Security Engine      │   │ Load Engine          │   │ Chaos Engine         │
 │ • Trivy CVE Scan     │   │ • k6 Ramp-Up Load    │   │ • SIGKILL Recovery   │
 │ • CycloneDX SBOM     │   │ • Latency Percentiles│   │ • Network Latency    │
 │ • Secret Leak Audit  │   │ • Error Rate & RPS   │   │ • Resource Stress    │
 │ • DAST API Fuzzing   │   │ • Quality Gate SLO   │   │ • RTO Stopwatch      │
 └───────────┬──────────┘   └───────────┬──────────┘   └───────────┬──────────┘
             │                          │                          │
             └──────────────────────────┼──────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                4. Master Resilience Scoring & Compliance                    │
 │               (Normalized 0-100 Composite Score & Badging)                  │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     5. Analytics & Multi-Format Exports                     │
 │          (Real-Time SSE Terminal, SARIF, JUnit XML, PDF Reports,            │
 │            Slack/Discord Webhooks & Side-by-Side Run Diff View)             │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Capabilities & Testing Pillars

### 🛡️ 1. Security & Vulnerability Engine
* **CVE Security Audit**: Deep layer-by-layer scan using Trivy to detect OS and language runtime vulnerabilities.
* **CycloneDX SBOM**: Generates a complete Software Bill of Materials inventory.
* **Secret & License Leak Detection**: Scans container files for exposed API keys, private credentials, and licensing flaws.
* **OpenAPI / DAST Fuzzing**: Dynamically tests Swagger/OpenAPI endpoints for security flaws.

### ⚡ 2. Performance & Load Stress Engine
* **k6 Load Generation**: Executes dynamic k6 load test scripts with customizable ramp-up stages.
* **Telemetry Percentiles**: Measures Virtual Users, Requests Per Second (RPS), Error Rates, and P50, P90, P95, P99 latencies.
* **Quality Gate SLO Evaluation**: Automatically evaluates PASS/FAIL compliance against custom latency & error SLOs.

### 💥 3. Multi-Fault Chaos Engineering Engine
* **SIGKILL Recovery Test**: Abruptly terminates container processes to measure **Recovery Time Objective (RTO)**.
* **Network Chaos**: Injects network latency and packet loss to test application timeouts and retries.
* **Resource Stress Chaos**: Injects CPU burn and memory saturation to measure resilience under resource exhaustion.

### 📊 4. Dashboard, Exports & Integrations
* **Real-Time Terminal**: SSE log streaming and step animations during test execution.
* **Side-by-Side Comparison**: Compare latency deltas, score shifts, and CVE diffs between any two runs (`/results/compare`).
* **Multi-Format Exports**: Export reports in **SARIF** (GitHub Code Scanning), **JUnit XML** (CI/CD integration), and **PDF**.
* **Slack / Discord Webhooks**: Dispatch automated completion alerts with score breakdowns directly to team channels.
* **Private Registries**: Pull private container images from `ghcr.io`, Docker Hub, or AWS ECR with username/token credentials.

---

## 📁 Organized Repository Structure

```text
resilience-platform/
├── README.md                 # Primary project documentation & architecture guide
├── ROADMAP.md                # 2-Phase Technical Roadmap & Subphase Tracking
├── .github/                  # GitHub Actions CI/CD deployment workflow
└── core/                     # Next.js Full-Stack Application Monolith
    ├── .env.example          # Environment variables template file
    ├── prisma/               # Database Schema & SQLite/Postgres Migrations
    ├── e2e/                  # Playwright End-to-End User Journey test suite
    ├── k8s/                  # Kubernetes Deployment Manifests & Helm Chart
    ├── __tests__/            # Jest Unit & Integration Test Suites
    └── src/
        ├── app/              # Next.js App Router (Pages, Components & REST API)
        │   ├── (auth)/       # NextAuth User Login & Registration
        │   ├── api/          # Pipeline, Status, Swagger, Export & Webhook API Routes
        │   └── results/      # Scan Results Dashboard & Side-by-Side Comparison View
        ├── components/       # UI Components (Buttons, Cards, Inputs, Recharts Charts)
        ├── config/           # OpenAPI / Swagger Specs
        ├── db/               # Prisma Database Client
        └── modules/          # Core Business Engines
            ├── chaos/        # SIGKILL, Network & Resource Stress Chaos Engine
            ├── docker/       # Sandbox Provisioner & Dynamic Port Binder
            ├── load/         # k6 Load Testing Trigger & Script Generator
            ├── notifications/# Email & Slack/Discord Webhook Engines
            ├── pipeline/     # Master Orchestrator Pipeline
            ├── queue/        # BullMQ Background Job Queue Manager
            ├── reports/      # PDF, SARIF & JUnit XML Report Generators
            ├── scoring/      # Master Scoring & SLO Evaluation Algorithms
            └── security/     # Trivy SBOM, Secret Scan & OpenAPI DAST Fuzzer
```

---

## 🔒 Security & Privacy Statement

> [!IMPORTANT]
> **Zero Hardcoded Passwords or Credentials**:
> - All credentials and secret keys are loaded dynamically via environment variables (`.env`).
> - `.gitignore` strictly blocks `.env`, database files (`*.db`), SSL certificates (`*.key`, `*.pem`), and generated PDFs from being committed.
> - Database password hashes are encrypted using **bcryptjs**.

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/a7hu-15/resilience-platform.git
cd resilience-platform/core
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

### 3. Initialize Database & Run Development Server
```bash
npx prisma db push
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Automated Test Suites
```bash
# Run unit test suite (Jest)
npm test

# Run E2E user journey tests (Playwright)
npx playwright test
```

---

## 🌐 Deployment Options

### Deploying to Vercel
1. Import this repository into **Vercel**.
2. Set **Root Directory** to `core`.
3. Add environment variables (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
4. Click **Deploy**.

---

## 📝 License
Distributed under the **MIT License**. Built by Ashutosh Chaudhary ([@a7hu-15](https://github.com/a7hu-15)).

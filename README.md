# 🚀 Resilience Platform — Automated Security, Load & Chaos Engineering

A full-stack, enterprise-grade automated CI/CD security, performance, and chaos resilience testing platform built with Next.js, Prisma, Trivy, k6, and Docker.

Submit any Docker image (public or private), and the platform will dynamically execute end-to-end security audits, k6 load testing, and multi-fault chaos injection, rendering real-time interactive telemetry and multi-format report exports (SARIF, JUnit XML, PDF).

**Developer:** Ashutosh Chaudhary  
**GitHub:** [a7hu-15/resilience-platform](https://github.com/a7hu-15/resilience-platform)  
**Stack:** Next.js (App Router) · TypeScript · Prisma (SQLite / PostgreSQL) · Trivy · k6 · Recharts · NextAuth

---

## 🗺️ Key Features & Architecture

### 🛡️ 1. Security & Vulnerability Engine
* **CVE Security Scanning**: Scans container layers via Trivy for OS and language package vulnerabilities.
* **CycloneDX SBOM Generation**: Produces a complete Software Bill of Materials.
* **Secret & License Leak Audit**: Identifies hardcoded API keys, tokens, SSH keys, and license non-compliance.
* **OpenAPI / Swagger DAST Fuzzing**: Executes dynamic HTTP endpoint security tests against API specifications.

### ⚡ 2. Performance & Load Stress Engine
* **k6 Virtual User Profiles**: Runs dynamic k6 load test scripts with customizable ramp-up stages.
* **Latency Percentiles & Throughput**: Tracks Requests Per Second (RPS), Error Rates, and latency metrics (P50, P90, P95, P99).
* **Quality Gate SLO Evaluation**: Calculates PASS / FAIL status against predefined SLO rules (e.g., P95 < 500ms).

### 💥 3. Multi-Fault Chaos Engineering Engine
* **SIGKILL Recovery Test**: Abruptly terminates container processes to measure **Recovery Time Objective (RTO)**.
* **Network Chaos**: Injects simulated network latency and packet loss to verify retry logic and timeout handling.
* **Resource Stress Chaos**: Saturates CPU and memory to evaluate performance under high resource contention.

### 📊 4. Interactive Dashboard & Comparative Analytics
* **Real-Time Terminal**: SSE log streaming and visual step animations during pipeline execution.
* **Side-by-Side Comparison**: Compare score deltas, latency regressions, and CVE differences between image tags (`/results/compare`).
* **Multi-Format Exports**: Download results in SARIF (GitHub Code Scanning), JUnit XML (CI/CD), or PDF report formats.

### 🔒 5. Enterprise Integrations & Private Registries
* **Private Container Registries**: Authenticate against `ghcr.io`, AWS ECR, or private Docker Hub repos.
* **Slack / Discord Webhooks**: Dispatch automated completion alert cards directly to team channels.

---

## 📁 Repository Structure

```text
resilience-platform/
├── .github/                  # GitHub Actions CI/CD workflows
├── ROADMAP.md                # 2-Phase Enhancement & Feature Roadmap
├── README.md                 # Primary project documentation
└── core/                     # Full-Stack Next.js Application Monolith
    ├── prisma/               # Prisma Database Schema & Migrations
    ├── public/               # Static assets & PDF report output directory
    ├── e2e/                  # Playwright End-to-End User Journey tests
    ├── k8s/                  # Kubernetes Deployment Manifests & Helm Chart
    ├── __tests__/            # Jest Unit & Integration Test Suites
    └── src/
        ├── app/              # Next.js App Router (Pages, Layouts & API Routes)
        │   ├── (auth)/       # Authentication (Login / Register)
        │   ├── api/          # REST API Endpoints (Run-Test, Exports, Status, Swagger)
        │   └── results/      # Scan Results & Side-by-Side Comparison Views
        ├── components/       # Reusable UI Components (Buttons, Cards, Inputs, Charts)
        ├── config/           # OpenAPI / Swagger Documentation Specs
        ├── db/               # Prisma Database Client Client Instance
        └── modules/          # Core Business Engines
            ├── chaos/        # SIGKILL, Network & Stress Chaos Experiments
            ├── docker/       # Sandbox Container Provisioner & Port Binder
            ├── load/         # k6 Load Testing Trigger & Script Generator
            ├── notifications/# Email & Slack/Discord Webhook Alert Engines
            ├── pipeline/     # Master Pipeline Orchestrator
            ├── queue/        # BullMQ & Redis Background Job Queue Manager
            ├── reports/      # PDF, SARIF & JUnit XML Export Generator
            ├── scoring/      # Master Resilience & SLO Scoring Algorithms
            └── security/     # Trivy SBOM, Secret Scan & OpenAPI DAST Fuzzer
```

---

## 🔒 Security & Privacy Audit

> [!IMPORTANT]
> **Zero Credentials or Passwords Committed**:
> - All sensitive environment variables, secrets, and database credentials are strictly excluded via `.gitignore`.
> - Real environment variables are loaded via `.env` (copy from `.env.example`).
> - Passwords in the database are hashed using **bcryptjs**.

---

## 🚀 Quickstart & Local Setup

### 1. Install Dependencies
```bash
cd core
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

### 3. Initialize Database
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Run Tests
```bash
# Run unit tests
npm test

# Run E2E Playwright tests
npx playwright test
```

---

## 🌐 Deploying on Vercel

1. Push your repository to GitHub.
2. Connect your repository to **Vercel**.
3. Set the **Root Directory** setting to `core`.
4. Configure environment variables in Vercel settings (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
5. Deploy!

---

## 📝 License
MIT License.

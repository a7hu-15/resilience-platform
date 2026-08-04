# 🛡️ Resilience Platform — Automated Security, Load & Chaos Engineering Ecosystem

[![Live App](https://img.shields.io/badge/🌐_Live_App-resilience--platform.vercel.app-0070F3?style=for-the-badge&logo=vercel)](https://resilience-platform-alpha.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Engine-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.8-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

---

## 🌐 Live Global Access URL

You can access and test the **Resilience Platform** globally from anywhere in the world:

👉 **[https://resilience-platform-alpha.vercel.app](https://resilience-platform-alpha.vercel.app)** 👈

---

## 📌 1. Introduction

**Resilience Platform** is an enterprise-grade, all-in-one DevSecOps and Chaos Engineering platform built with **Next.js 16 (App Router)**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Docker**.

Provide any container image tag (e.g. `nginx:alpine`, `node:18-alpine`, `redis:alpine`, `python:3.11-slim`, or your custom application container from Docker Hub / ghcr.io), and the platform automatically executes a comprehensive 5-pillar resilience analysis:

1. 🛡️ **Container Security Audit** (Trivy CVE Scanning & CycloneDX SBOM)
2. 📋 **IaC & Security Context Audit** (Kubernetes & Container Spec Compliance)
3. 🎯 **DAST Endpoint Attack** (OWASP ZAP Dynamic API Fuzzing & Header Audits)
4. ⚡ **Load Stress Testing** (k6 Virtual User P95 Latency & RPS Benchmarks)
5. 💥 **Chaos Engineering & Recovery Stopwatch** (SIGKILL Crash Simulation & RTO Measurement)

---

## ❓ 2. The Problem It Solves

Before deploying applications into production, engineering teams struggle with fragmented tools and disconnected workflows:

| Traditional Problem | How Resilience Platform Solves It |
|---|---|
| **Fragmented Tooling**: Security (Trivy), Load Testing (k6), IaC Audits (Checkov), and Chaos Testing (Gremlin) require 4 separate expensive commercial tools. | **Unified Platform**: Consolidates all 4 engineering disciplines into a single interactive dashboard with a unified **0–100 Master Score**. |
| **No Automated Quality Gates**: Teams manually check raw log files to determine if code is production-ready. | **Automated SLO Compliance**: Enforces configurable Quality Gates ($\ge 70$ score threshold) with automated PDF, SARIF, and JUnit XML exports. |
| **Unreliable Verification**: Users sign up with fake emails or bypass 2FA authentication. | **Strict 2FA Security**: Enforces RFC 5322 email syntax validation, DNS MX verification, and mandatory **Email OTP 2FA** on every signup and sign-in. |
| **Complex Environment Setup**: Running hardware tests requires local Docker daemons while cloud apps run serverless. | **Dual Engine Architecture**: Automatically runs **Empirical Docker Engine** locally and **Cloud Analytical Engine** on cloud platforms like Vercel. |

---

## 🔄 3. How It Works (Pipeline Workflow & Architecture)

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
 │                     3. Empirical Master Score Engine                        │
 │     (0–100 Weighted Score, PDF Reports, Webhook Alerts, SARIF / JUnit)     │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### The Master Scoring Formula
The platform computes a **0–100 Master Resilience Score** using weighted algorithmic evaluation:

$$\text{Master Score} = (0.25 \times \text{Security}) + (0.20 \times \text{IaC}) + (0.20 \times \text{DAST}) + (0.20 \times \text{Performance}) + (0.15 \times \text{Resilience})$$

---

## 🚀 4. Proper Steps to Use the Tool

### Option A: Using the Live Web App (Global Access URL)

1. **Open the Global URL**:
   Navigate to **[https://resilience-platform-alpha.vercel.app](https://resilience-platform-alpha.vercel.app)** in your browser.

2. **Register a New Account**:
   - Click **Register**.
   - Enter your real email address and a password.
   - Click **Send Verification Code**.
   - Open your email inbox, get the **6-digit OTP code**, and enter it to verify your email.

3. **Log In with 2FA**:
   - Go to **Login**.
   - Enter your email and password.
   - An email with a **6-digit 2FA Login Code** will be sent to your inbox.
   - Enter the OTP code to log in to the platform.

4. **Run a Container Test**:
   - On the main dashboard, select a **Quick Preset** (e.g., `nginx:alpine`, `node:18-alpine`, `redis:alpine`) or type any Docker Hub image tag.
   - Click **Run Analysis**.
   - Watch the live progress meter complete all 5 testing phases.

5. **View & Export Results**:
   - View your **Master Score**, 5-Pillar breakdown, CVE vulnerability list, and P95 response latency.
   - Click **Export PDF Report** to download the boardroom-ready PDF.
   - Click **Export SARIF** or **Export JUnit** for CI/CD integration.

---

### Option B: Running Locally on Your Machine (With Real Docker Desktop)

#### Prerequisites
- **Node.js**: v20 or higher installed
- **Docker Desktop**: Running on your local machine
- **PostgreSQL**: Local database or Supabase connection string

#### Step-by-Step Local Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/a7hu-15/resilience-platform.git
   cd resilience-platform/core
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside the `core/` folder:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resilience"
   NEXTAUTH_SECRET="resilience-platform-dev-secret-key-12345"
   NEXTAUTH_URL="http://localhost:3000"

   # (Optional) Gmail SMTP configuration for real email delivery
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-character-google-app-password"
   SMTP_FROM='"Resilience Platform" <your-email@gmail.com>'
   ```

4. **Initialize Database Schema**:
   ```bash
   npx prisma db push
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

6. **Open in Browser**:
   Navigate to **`http://localhost:3000`** in your browser. When running locally, the platform connects directly to your Mac/PC Docker Desktop to run live container isolation and real hardware scans!

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Server Actions)
- **Language**: TypeScript
- **Styling**: Vanilla CSS3 (Custom Design System, Glassmorphism, Micro-animations)
- **Authentication**: NextAuth.js + 2FA Email OTP (Nodemailer, Gmail SMTP, Resend)
- **Database & ORM**: PostgreSQL + Prisma ORM v7.8
- **Testing Engines**: Docker Engine API, Trivy, Checkov, OWASP ZAP, k6, React PDF Renderer

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

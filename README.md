# 🛡️ Resilience Cloud

**Resilience Cloud** is an enterprise-inspired cloud-native reliability platform that enables DevOps and Site Reliability Engineering (SRE) teams to validate Kubernetes workloads before production deployment. It combines deployment validation, security scanning, chaos engineering, real-time observability, analytics, and executive reporting into a single operations platform.

---

## 📖 Documentation Hub
- [Architecture & System Design](./docs/ARCHITECTURE.md)
- [Validation Pipeline Workflow](./docs/WORKFLOW.md)
- [Local Setup Guide](./docs/SETUP_GUIDE.md)
- [REST API Reference](./docs/API.md)

---

## 🚀 Key Features

### 1. Operations Center & Dashboard
A Datadog-style global dashboard providing full observability over historical runs, platform component health (Redis, BullMQ, Next.js), and aggregate resilience scores over the last 30 days.

### 2. Automated Pipeline Orchestrator
A Redis-backed background worker architecture that spins up Docker containers, runs Trivy vulnerability scans, executes K6 performance load tests, and performs Chaos Mesh style Pod-kill experiments—all without blocking the UI thread.

### 3. Real-Time Execution Streaming (SSE)
Instead of static loading spinners, the platform uses Server-Sent Events (SSE) to stream live execution state directly from the database into the UI, including a dynamic Cluster Topology Map.

### 4. Enterprise Exporters & Reporting
Generates comprehensive Executive Summaries via PDF, and supports raw data exports in JSON, CSV, JUnit, and GitHub-native SARIF formats.

### 5. Intelligent Recommendations
Evaluates your container's performance (e.g., Recovery Time Objective) against predefined SLIs/SLOs and suggests actionable architectural improvements (e.g., Horizontal Pod Autoscaler tuning).

---

## 📸 Demo Mode
Want to see the platform in action without installing Docker or Kubernetes?
1. Clone the repo and run `npm install`.
2. Run `npm run seed-demo` to inject 3 historically rich test executions into the local database.
3. Start the Next.js server (`npm run dev`) and click **Start Demo Mode** on the dashboard to replay the timelines interactively!

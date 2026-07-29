# 🚀 Resilience Platform — 2-Phase Enhancement Plan & Technical Roadmap

This document outlines the architecture, subphases, and execution strategy for expanding the **Resilience Platform** into an enterprise-grade automated CI/CD security, load, and chaos testing ecosystem.

---

## 🗺️ High-Level Architectural Roadmap

```
                               ┌────────────────────────────────────────────────────────┐
                               │             Resilience Platform Monolith               │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                        ┌──────────────────────────────────┴──────────────────────────────────┐
                        ▼                                                                     ▼
        ┌───────────────────────────────┐                                     ┌───────────────────────────────┐
        │       PHASE 1 (TODAY)         │                                     │      PHASE 2 (TOMORROW)       │
        │ Core Engine Upgrades & UI     │                                     │ Scalability & Enterprise UX   │
        └───────────────┬───────────────┘                                     └───────────────┬───────────────┘
                        │                                                                     │
 ┌──────────────────────┼──────────────────────┐                       ┌──────────────────────┼──────────────────────┐
 │                      │                      │                       │                      │                      │
 ▼                      ▼                      ▼                       ▼                      ▼                      ▼
Subphase 1.1          Subphase 1.2          Subphase 1.3            Subphase 2.1          Subphase 2.2          Subphase 2.3 & 2.4
Quality Gates &       Trivy SBOM &          Real-Time SSE           Multi-Fault           Side-by-Side          BullMQ Queue, DAST
k6 Load Profiles     Secret Scanning       Interactive Charts      Chaos (Latency, CPU)    Run Comparison        Webhooks & Helm Chart
```

---

## 📅 Phase 1: Core Engine Upgrades, Security & Real-Time Analytics (Today)

### 🔹 Subphase 1.1: Quality Gates & Configurable Load Test Profiles
* **Goal**: Enable custom load testing rules (Virtual Users, Ramp-up schedules, Custom HTTP Headers) and define pass/fail **Quality Gate SLOs** (e.g., P95 latency < 500ms, RTO < 15s).
* **Key Deliverables**:
  - Update `schema.prisma` with `QualityGate` and `LoadConfig` JSON fields on `TestRun`.
  - Extend [`src/modules/load/k6.ts`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/modules/load/k6.ts) to generate dynamic k6 scripts supporting ramp-up stages.
  - Extend [`src/modules/scoring/algorithms.ts`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/modules/scoring/algorithms.ts) to calculate Quality Gate pass/fail status.
* **Verification & Checkpoint**:
  - Run Jest unit tests for Quality Gate calculation.
  - **Git Commit & Push**: `git commit -m "feat(load): add configurable k6 profiles and quality gate SLO evaluation"`

---

### 🔹 Subphase 1.2: Advanced Security Engine (SBOM & Secret Scanning)
* **Goal**: Expand Trivy security scans to generate CycloneDX Software Bill of Materials (SBOM) and detect hardcoded secrets & license non-compliance.
* **Key Deliverables**:
  - Add `SbomLog` and `SecretLog` models to `schema.prisma`.
  - Update [`src/modules/security/trivy.ts`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/modules/security/trivy.ts) to execute SBOM generation (`trivy image --format cyclonedx`) and secret scanning (`trivy image --scanners secret,license`).
  - Render dependency count and secret alerts in the UI results tab.
* **Verification & Checkpoint**:
  - Perform Trivy scan against a mock docker image containing dependencies & secrets.
  - **Git Commit & Push**: `git commit -m "feat(security): integrate Trivy SBOM generation and secret/license scanning"`

---

### 🔹 Subphase 1.3: Real-Time Dashboard & Interactive Metric Charts
* **Goal**: Render real-time execution progress and interactive charts (latency curves, score radar, RTO timeline) on the results page.
* **Key Deliverables**:
  - Integrate `recharts` / chart visualizer into Next.js frontend.
  - Create [`src/components/ui/MetricsChart.tsx`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/components/ui/MetricsChart.tsx) for latency percentiles and score comparisons.
  - Update [`src/app/results/[id]/page.tsx`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/app/results/%5Bid%5D/page.tsx) with dynamic execution step animations and log terminal view.
* **Verification & Checkpoint**:
  - Test UI in browser; verify interactive chart rendering and responsive layout.
  - **Git Commit & Push**: `git commit -m "feat(ui): implement real-time dashboard and interactive metric charts"`

---

### 🔹 Subphase 1.4: Multi-Format Report Export (SARIF, JUnit XML & PDF Enhancements)
* **Goal**: Support standard DevOps report exports including SARIF (GitHub Code Scanning format) and JUnit XML for CI/CD pipeline integration.
* **Key Deliverables**:
  - Create API routes: `/api/results/[id]/export/sarif` and `/api/results/[id]/export/junit`.
  - Update [`src/modules/reports/pdf.ts`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/modules/reports/pdf.ts) to incorporate Quality Gate badges, SBOM summaries, and secret findings into PDF generation.
* **Verification & Checkpoint**:
  - Download generated SARIF, JUnit, and PDF files; validate structural integrity.
  - **Git Commit & Push**: `git commit -m "feat(reports): add SARIF export, JUnit XML export, and enhanced PDF reporting"`

---

## 📅 Phase 2: Enterprise Features, Comparative Analytics & Scalability (Tomorrow)

### 🔹 Subphase 2.1: Multi-Fault Chaos Engineering Engine
* **Goal**: Support advanced chaos experiment scenarios beyond SIGKILL, including Network Latency (`tc`), Packet Loss, CPU Burn, and Memory Exhaustion.
* **Key Deliverables**:
  - Expand [`src/modules/chaos/experiments.ts`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/modules/chaos/experiments.ts) to support configurable NetworkChaos and StressChaos injections.
  - Update recovery metrics logic in [`src/modules/chaos/recovery.ts`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/modules/chaos/recovery.ts).
* **Verification & Checkpoint**:
  - Execute multi-fault experiment against target test container.
  - **Git Commit & Push**: `git commit -m "feat(chaos): implement multi-fault network latency and resource stress experiments"`

---

### 🔹 Subphase 2.2: Side-by-Side Test Run Comparison View
* **Goal**: Build a comparative analytics UI (`/results/compare?run1=id1&run2=id2`) to highlight score deltas, latency regressions, and fixed vs. newly introduced CVEs between two image tags.
* **Key Deliverables**:
  - Build [`src/app/results/compare/page.tsx`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/app/results/compare/page.tsx).
  - Add comparison logic in [`src/modules/scoring/algorithms.ts`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/modules/scoring/algorithms.ts).
* **Verification & Checkpoint**:
  - Select two completed runs and verify side-by-side metric comparison and diff highlights.
  - **Git Commit & Push**: `git commit -m "feat(analytics): add side-by-side test run comparison and regression diff view"`

---

### 🔹 Subphase 2.3: Asynchronous Worker Job Queue (BullMQ + Redis)
* **Goal**: Offload pipeline orchestrator execution to a background queue to support concurrent test run requests and decouple web server logic.
* **Key Deliverables**:
  - Implement Redis client and BullMQ queue in `src/modules/queue/`.
  - Refactor `/api/run-test` to enqueue jobs and stream job progress via SSE.
* **Verification & Checkpoint**:
  - Enqueue multiple concurrent test requests; verify queue consumption by background workers.
  - **Git Commit & Push**: `git commit -m "feat(queue): introduce BullMQ and Redis async job queue for pipeline execution"`

---

### 🔹 Subphase 2.4: OpenAPI DAST Fuzzing, Webhook Alerts & Helm Packaging
* **Goal**: Execute OpenAPI/Swagger-aware DAST endpoint fuzzing, dispatch Slack/Discord/Teams webhook alerts, and package the platform for Kubernetes deployment.
* **Key Deliverables**:
  - Enhance [`src/modules/security/dast.ts`](file:///Users/ashuchaudhary/open%20source%20contributions/resilience-platform/core/src/modules/security/dast.ts) to parse Swagger specs for dynamic fuzzing.
  - Add `src/modules/notifications/webhook.ts` for Slack/Discord webhook alerts.
  - Package platform Helm chart in `k8s/chart/` for 1-click deployment.
* **Verification & Checkpoint**:
  - Trigger webhook alert and lint Helm chart.
  - **Git Commit & Push**: `git commit -m "feat(integrations): add OpenAPI DAST fuzzing, webhook alerts, and Helm packaging"`

---

## 🛠️ Workflow & Git Execution Standards

1. **Subphase Implementation**: Implement the subphase features completely within `core/`.
2. **Local Testing & Verification**: Run build, tests (`npm test`), and manual pipeline verification.
3. **Commit & Push**: Commit with standard conventional commit messages and push directly to GitHub after each subphase:
   ```bash
   git add .
   git commit -m "<type>(scope): <description>"
   git push origin main
   ```

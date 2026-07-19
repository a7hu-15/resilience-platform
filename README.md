# All-In-One DevOps Testing Platform

A world-class, automated CI/CD testing platform that accepts any Docker image, dynamically deploys it to Kubernetes, and executes a rigorous 3-pillar test suite: **Security (Trivy)**, **Performance (k6)**, and **Resilience (Chaos Mesh)**. The platform calculates a highly precise master score based on real metrics and generates a final PDF report.

**Developer:** Ashutosh Chaudhary  
**GitHub:** [a7hu-15/resilience-platform](https://github.com/a7hu-15/resilience-platform)  
**Stack:** Next.js (App Router) · TypeScript · Node.js · Kubernetes · Chaos Mesh · Prisma (SQLite/PostgreSQL) · Trivy · k6  

---

## 🚀 The 7-Day Development Roadmap

This platform is currently undergoing a massive architectural rewrite from a legacy Python/Flask application into a **Next.js Full-Stack Monolith** adhering to strict Enterprise standards (Separation of Concerns, modular architecture, and production-grade security).

### ✅ Day 1: Monolithic Setup & Database
- Scaffolding the Next.js App Router codebase.
- Implementing a feature-driven, modular folder structure (`src/modules`).
- Installing `@kubernetes/client-node` and Prisma ORM.
- Designing the database schema for `TestRuns`, `SecurityLogs`, and `ChaosMetrics`.

### ✅ Day 2: Security & Deployment Engines
- Implementing programmatic Trivy scanning to extract real CVE JSON data.
- Building the dynamic Kubernetes Deployment/Service generator.

### ✅ Day 3: Load Testing & Chaos Engineering Engines
- Implementing k6 load testing for P95 latency and RPS metrics.
- Orchestrating Chaos Mesh CRDs (PodKill, CPU Stress) dynamically via API.

### ✅ Day 4: Precise Scoring System & Real Reporting
- Building algorithms to translate raw RTO (Recovery Time Objective) and CVE data into a precise 0-100 score.
- Implementing PDF report generation.

### ✅ Day 5: Backend Integration & Platform Self-Testing
- Connecting the 4 engines (Security, Deploy, Load, Chaos) into a seamless pipeline.
- Running Unit & Integration tests against known mock Docker images.

### ✅ Day 6: Premium UI & Real-Time Dashboard
- Building a stunning, premium UI with Vanilla CSS and micro-animations.
- Implementing Live Server-Sent Events (SSE) so users can watch their tests execute in real-time.

### ✅ Day 7: Final Polish & Deployment Prep
- End-to-End User Journey Testing using Playwright.
- Preparing production manifests to deploy the platform itself onto AWS EKS.

---

## 🏗️ Architecture (In Progress)

This platform utilizes a strictly enforced, feature-driven Monolithic Architecture:

```text
resilience-platform/
└── core/
    ├── prisma/               # Database schemas and migrations
    └── src/
        ├── app/              # Next.js UI & API Routes
        ├── config/           # Environment configuration
        ├── db/               # Prisma Database connection
        ├── middleware/       # API Security
        └── modules/          # Core Business Logic Engines
            ├── auth/         # JWT Authentication
            ├── chaos/        # Chaos Mesh Orchestrator
            ├── k8s/          # Kubernetes API Client
            ├── load/         # k6 Load Testing Trigger
            ├── reports/      # PDF Generator
            ├── scoring/      # Scoring Algorithms
            └── security/     # Trivy Scanning Logic
```

## ⚙️ Environment Variables

Copy the `.env.example` file to `.env` and configure the following for your environment:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/resilience_db"
KUBECONFIG_PATH="~/.kube/config"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

## 🚢 How to Deploy (Kubernetes)

The platform is designed to be self-hosted on a Kubernetes cluster. Standard manifests are provided in the `core/k8s/` directory.

```bash
# Deploy the Resilience Platform
kubectl apply -f core/k8s/platform-deployment.yaml

# Expose the Platform
kubectl apply -f core/k8s/platform-service.yaml
```

## 📝 License
MIT — Built for learning, portfolio, and deep DevOps exploration.

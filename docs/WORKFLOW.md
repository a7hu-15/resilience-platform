# Validation Pipeline Workflow

This document explains the exact sequence of operations that occur when a user launches a Reliability Assessment in Resilience Cloud.

## The 6-Stage Execution Pipeline

### 1. Image Verification & Setup
- The Orchestrator receives the target image tag (e.g., `nginx:latest`).
- It verifies the image exists in the target container registry (Docker Hub, ECR, GCR).
- If the image is not present locally, it forces a `docker pull` to cache it for testing.

### 2. Security Context Audit (Trivy)
- The platform spins up a parallel container running `aquasec/trivy`.
- The Trivy engine scans the target image layers against the latest CVE vulnerability database.
- Results are parsed and broken down into Critical, High, Medium, and Low risk findings.

### 3. Sandbox Provisioning
- The target image is instantiated as a live HTTP server (the Sandbox).
- A dynamic port mapping is established to prevent collisions with other concurrent test jobs.

### 4. Performance & Load Validation
- A `k6` load generator targets the Sandbox URL.
- We sustain synthetic traffic for a defined duration.
- Key metrics captured: `Requests Per Second (RPS)`, `P95 Latency`, and `Success Rate`.

### 5. Chaos Injection (Empirical Resilience)
- While the application is handling live traffic, the Chaos Engine sends a raw `SIGKILL` to the running container process.
- An internal millisecond stopwatch is started.
- The engine continuously polls the endpoint until it receives a valid `HTTP 200 OK` response.
- The elapsed time is recorded as the **Recovery Time Objective (RTO)**.

### 6. Scoring & Intelligent Recommendations
- The system normalizes the collected metrics into a Master Score (0-100).
- The Rule Engine evaluates the RTO and CVEs against predefined thresholds.
- If thresholds are breached, prescriptive recommendations are generated (e.g., "RTO exceeded 5 seconds. Configure Horizontal Pod Autoscaler and Readiness Probes.").

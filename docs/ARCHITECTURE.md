# Architecture & System Design

Resilience Cloud is built on a highly scalable, event-driven architecture designed to process hundreds of concurrent container validation pipelines without blocking the frontend.

## High-Level System Architecture

```mermaid
graph TD
    subgraph "Frontend (Next.js App Router)"
        UI[Operations Center Dashboard]
        SSE_Client[Live Event Streamer]
    end

    subgraph "Backend API (Next.js Node Edge)"
        Auth[NextAuth Session Manager]
        API_Run[POST /api/run-test]
        API_SSE[GET /api/stream/:id]
    end

    subgraph "Queue & Orchestration"
        Redis[(Redis Cache & Queue)]
        BullMQ[BullMQ Worker Process]
    end

    subgraph "Execution Engines"
        Docker[Docker Engine]
        Trivy[Aquasec Trivy Container]
        K6[K6 Load Generator]
        K8s[Kubernetes Cluster / Chaos Engine]
    end

    subgraph "Persistence"
        Postgres[(PostgreSQL 15)]
        Prisma[Prisma ORM]
    end

    UI -->|1. Request Validation| API_Run
    API_Run -->|2. Enqueue Job| Redis
    Redis -->|3. Dequeue Job| BullMQ
    BullMQ -->|4. Trigger Scans| Docker
    BullMQ -->|5. Save Results| Prisma
    Prisma --> Postgres

    UI -->|6. Connect EventSource| API_SSE
    API_SSE -->|7. Poll Database Status| Prisma
    API_SSE -->|8. Push TextEncoder Chunks| SSE_Client
```

## Component Details

### 1. Redis + BullMQ Queue Manager
When a user initiates a validation pipeline for a Docker image, the Next.js API immediately acknowledges the request (HTTP 202 Accepted) and pushes a `PipelineJob` to Redis. A detached BullMQ worker process continuously polls Redis. This guarantees the web server remains highly available even when vulnerability scans take >60 seconds.

### 2. The Execution Orchestrator
The Worker process acts as a coordinator for multiple security and performance engines:
- **Sandbox Engine**: Dynamically provisions an ephemeral container of the target image and binds it to a random host port to simulate a Kubernetes Pod.
- **Security Engine**: Pulls the massive `aquasec/trivy` container and mounts the Docker socket to perform a live CVE vulnerability scan against the target image.
- **Load Engine**: Executes a local `k6` HTTP load test against the Sandbox container to measure P95 Latency and Requests Per Second.
- **Chaos Engine**: Injects a hostile `SIGKILL` into the Sandbox container while it is under load, simultaneously starting an internal stopwatch to calculate the application's Recovery Time Objective (RTO).

### 3. Server-Sent Events (SSE) Engine
To provide a "Live" experience, the frontend connects to a persistent `/api/stream/[id]` endpoint. The server routinely polls the Postgres database for state transitions in the active `TestRun` and pushes them as `Uint8Array` byte chunks to the browser. This allows the frontend to animate the Cluster Topology map in real-time.

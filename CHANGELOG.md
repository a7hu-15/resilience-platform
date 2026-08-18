# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-08-18

### Added
- **Operations Center**: Global dashboard with live Platform Health metrics (Redis, Postgres, Docker, Worker) and BullMQ Validation Queue visualization.
- **Smart Replay Engine**: Demo Mode that intercepts historical test runs and sequentially animates execution stages and Server-Sent Events over 14 seconds.
- **Intelligent Recommendations Engine**: Rule-based "WHY" engine that evaluates RTO, CVEs, and Latency against hard SLO targets to prescribe Kubernetes architectural changes.
- **History Portal**: `/history` page featuring Search, Filtering by Pipeline Status, and Chronological Sorting.
- **Enterprise Reporting**: REST APIs to export pipeline data via SARIF, JSON, CSV, and JUnit.
- **Distributed Architecture**: BullMQ + Redis integration to fully decouple long-running Docker orchestration from the Next.js API thread.
- **Comprehensive Documentation Hub**: Added `ARCHITECTURE.md`, `WORKFLOW.md`, `SETUP_GUIDE.md`, and `API.md` outlining the platform's distributed design.
- **Playwright Test Suite**: Initial E2E automation targeting Health APIs and Recommendation logic.

### Changed
- Rebranded platform identity to **Resilience Cloud**.
- Overhauled `README.md` to emphasize Portfolio-ready MVP status.
- Migrated `/api/stream/[id]` to stream `Uint8Array` payloads explicitly for Next.js App Router compatibility.
- Changed "Create Test Job" to "Start Validation Pipeline".

### Fixed
- Fixed UI freeze on `/results` where pre-completed jobs failed to trigger the SSE finalization routine.
- Fixed Prisma Foreign Key Violation by dynamically upserting NextAuth sessions during pipeline creation.
- Fixed `seed-demo-data.ts` failing by adding explicit `.env` configuration loading.

### Security
- Locked down `authOptions` injection across `/api/run-test` to strictly validate active JWT sessions before queueing Docker containers.

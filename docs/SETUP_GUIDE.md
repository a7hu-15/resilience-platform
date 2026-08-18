# Local Setup Guide

Follow these steps to run Resilience Cloud on your local machine. 

## Prerequisites
Ensure the following are installed and running on your system:
- **Node.js** (v18+)
- **Docker Engine** (Must be running locally, as the orchestrator spawns sandbox containers and Trivy scanners)
- **PostgreSQL 15** (We recommend running this in Docker)
- **Redis** (Used for the BullMQ job queue)

## 1. Infrastructure Setup

Spin up the required persistence layers using Docker:

```bash
# Start PostgreSQL Database on port 5433
docker run --name resilience-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=resilience -p 5433:5432 -d postgres:15

# Start Redis for BullMQ on port 6379
docker run --name resilience-redis -p 6379:6379 -d redis:7
```

## 2. Application Setup

Clone the repository and install the Next.js dependencies.

```bash
git clone https://github.com/yourusername/resilience-cloud.git
cd resilience-cloud/core
npm install
```

## 3. Environment Variables

Create a `.env` file inside the `core/` directory and populate it:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5433/resilience?schema=public"

# Redis Queue
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-key-for-local-dev"

# Email Notifications (Optional: Resend API Key)
RESEND_API_KEY="re_..."
SMTP_FROM="Resilience Cloud <onboarding@resend.dev>"
```

## 4. Database Migration

Push the Prisma schema to the PostgreSQL database to generate the tables.

```bash
npx prisma db push
npx prisma generate
```

## 5. Running the Application

Resilience Cloud requires both the Web UI and the Background Worker to function.

**Terminal 1 (Web Server):**
```bash
npm run dev
```

**Terminal 2 (BullMQ Worker):**
```bash
npm run worker
```

## 6. Access the Dashboard
Open [http://localhost:3000](http://localhost:3000) in your browser. Create a new account and begin validating your Docker images!

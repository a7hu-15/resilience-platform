# REST API Reference

Resilience Cloud exposes standard RESTful endpoints for initiating validation pipelines and exporting analytical results.

All API routes require authentication. Include the NextAuth JWT cookie or a Bearer token.

---

### `POST /api/run-test`
Initiates a new Validation Pipeline by pushing a job to the Redis queue.

**Request Body**
```json
{
  "imageName": "nginx:latest",
  "registryUser": "(Optional) docker-user",
  "registryToken": "(Optional) access-token",
  "webhookUrl": "(Optional) https://hooks.slack.com/services/..."
}
```

**Response (202 Accepted)**
```json
{
  "message": "Test pipeline initiated and queued for execution.",
  "testRunId": "cuid-string-xyz",
  "status": "QUEUED"
}
```

---

### `GET /api/stream/:id`
Connects a Server-Sent Events (SSE) stream for real-time polling of a running job's database status.

**Response**
Streams chunks encoded with `TextEncoder` in `text/event-stream` format:
```text
event: connected
data: {"message":"SSE Stream connected","testRunId":"cuid-xyz"}

event: stage_update
data: {"status":"RUNNING","security":"COMPLETED","chaos":"PENDING"}

event: completed
data: {"finalScore":89.5,"status":"COMPLETED"}
```

---

### `GET /api/analytics`
Fetches the last 30 days of global analytics for the authenticated user's Operations Center dashboard.

**Response (200 OK)**
```json
{
  "metrics": {
    "totalDeployments": 142,
    "passRate": "92.5",
    "avgScore": "88.2",
    "avgRecoveryTime": "4.20",
    "avgP95Latency": "12.50"
  },
  "trends": [
    { "date": "2024-03-01", "score": 90, "status": "COMPLETED", "imageName": "nginx:latest" }
  ],
  "topFailingImages": [
    { "image": "redis:alpine", "count": 4 }
  ]
}
```

---

### `GET /api/results/:id/export/sarif`
Exports the specific pipeline's Security findings (Trivy CVEs) into GitHub-native SARIF format for CI/CD integration.

**Response (200 OK)**
```json
{
  "version": "2.1.0",
  "$schema": "http://json.schemastore.org/sarif-2.1.0-rtm.5",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "Resilience Cloud Engine",
          "rules": [...]
        }
      },
      "results": [...]
    }
  ]
}
```

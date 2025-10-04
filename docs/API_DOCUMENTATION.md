# RepoRadar API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via session cookies. Admin endpoints require admin privileges.

## Endpoints

### Repository Analysis

#### Analyze Repository
```
POST /api/analyze
```

Analyzes a GitHub repository.

**Request Body:**
```json
{
  "owner": "facebook",
  "repo": "react"
}
```

**Response:**
```json
{
  "id": "uuid",
  "repository": "facebook/react",
  "score": 95,
  "metrics": {
    "code_quality": 98,
    "documentation": 95,
    "community": 92,
    "maintenance": 97
  },
  "analysis": {
    "strengths": ["Excellent documentation", "Active community"],
    "improvements": ["Add more examples"]
  },
  "analyzedAt": "2025-01-04T12:00:00Z"
}
```

### Search

#### Search Repositories
```
GET /api/search?q=react&sort=stars&order=desc
```

Searches GitHub repositories.

**Query Parameters:**
- `q` (required) - Search query
- `sort` - Sort by: stars, forks, updated (default: stars)
- `order` - Order: asc, desc (default: desc)
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 30, max: 100)

**Response:**
```json
{
  "items": [
    {
      "id": 123,
      "name": "react",
      "full_name": "facebook/react",
      "description": "A JavaScript library for building user interfaces",
      "stars": 200000,
      "forks": 40000,
      "language": "JavaScript",
      "url": "https://github.com/facebook/react"
    }
  ],
  "total_count": 1000,
  "page": 1,
  "per_page": 30
}
```

### Background Jobs

#### Create Job
```
POST /api/jobs
```

Creates a background job.

**Request Body:**
```json
{
  "type": "batch-analysis",
  "data": {
    "repositories": ["owner/repo1", "owner/repo2"]
  }
}
```

**Response:**
```json
{
  "id": "job-uuid",
  "type": "batch-analysis",
  "status": "queued",
  "progress": 0,
  "createdAt": "2025-01-04T12:00:00Z"
}
```

#### Get Job Status
```
GET /api/jobs/:id
```

Gets the status of a background job.

**Response:**
```json
{
  "id": "job-uuid",
  "type": "batch-analysis",
  "status": "processing",
  "progress": 45,
  "result": null,
  "error": null,
  "createdAt": "2025-01-04T12:00:00Z",
  "startedAt": "2025-01-04T12:00:05Z",
  "completedAt": null
}
```

#### Cancel Job
```
DELETE /api/jobs/:id
```

Cancels a background job.

**Response:**
```json
{
  "id": "job-uuid",
  "status": "cancelled"
}
```

### Analytics

#### Track Event
```
POST /api/analytics/events
```

Tracks an analytics event.

**Request Body:**
```json
{
  "name": "repository_analyzed",
  "category": "analysis",
  "properties": {
    "repository": "owner/name",
    "duration_ms": 1500
  }
}
```

**Response:**
```json
{
  "id": "event-uuid",
  "tracked": true
}
```

### Admin Endpoints

All admin endpoints require admin authentication.

#### Get System Health
```
GET /api/admin/health
```

Gets system health metrics.

**Response:**
```json
{
  "database": {
    "status": "healthy",
    "connections": 5,
    "responseTime": 10
  },
  "cache": {
    "status": "healthy",
    "hitRate": 0.85,
    "responseTime": 2
  },
  "api": {
    "status": "healthy",
    "avgResponseTime": 150,
    "errorRate": 0.01
  }
}
```

#### Get System Metrics
```
GET /api/admin/metrics?startDate=2025-01-01&endDate=2025-01-31
```

Gets system metrics over time.

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `metric` - Specific metric to retrieve (optional)

**Response:**
```json
{
  "metrics": [
    {
      "timestamp": "2025-01-01T00:00:00Z",
      "requests": 1000,
      "errors": 10,
      "avgResponseTime": 150
    }
  ]
}
```

#### Get User Activity
```
GET /api/admin/users?startDate=2025-01-01&endDate=2025-01-31
```

Gets user activity metrics.

**Response:**
```json
{
  "activeUsers": 150,
  "newUsers": 25,
  "returningUsers": 125,
  "avgSessionDuration": 300,
  "topFeatures": [
    { "feature": "repository_analysis", "usage": 500 },
    { "feature": "search", "usage": 300 }
  ]
}
```

#### Get Logs
```
GET /api/admin/logs?level=error&limit=100
```

Gets application logs.

**Query Parameters:**
- `level` - Log level: error, warn, info, debug (optional)
- `limit` - Number of logs to return (default: 100, max: 1000)
- `startDate` - Start date (ISO 8601) (optional)
- `endDate` - End date (ISO 8601) (optional)
- `search` - Search term (optional)

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-04T12:00:00Z",
      "level": "error",
      "message": "Failed to fetch repository",
      "context": {
        "repository": "owner/name",
        "error": "Not found"
      }
    }
  ],
  "total": 100
}
```

#### Export Data
```
GET /api/admin/export?format=csv&type=analytics
```

Exports data in CSV or JSON format.

**Query Parameters:**
- `format` - Export format: csv, json (required)
- `type` - Data type: analytics, users, logs (required)
- `startDate` - Start date (ISO 8601) (optional)
- `endDate` - End date (ISO 8601) (optional)

**Response:**
Returns file download with appropriate content type.

### Health Check Endpoints

#### Overall Health
```
GET /health
```

Returns overall application health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-04T12:00:00Z",
  "checks": {
    "database": { "status": "up", "responseTime": 5 },
    "cache": { "status": "up", "responseTime": 2 },
    "api": { "status": "up", "responseTime": 10 },
    "queue": { "status": "up", "responseTime": 3 }
  }
}
```

#### Readiness Check
```
GET /health/ready
```

Returns readiness status (for load balancers).

**Response:**
```json
{
  "ready": true,
  "timestamp": "2025-01-04T12:00:00Z"
}
```

#### Liveness Check
```
GET /health/live
```

Returns liveness status (for container orchestration).

**Response:**
```json
{
  "alive": true,
  "timestamp": "2025-01-04T12:00:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Technical error message",
    "userMessage": "User-friendly error message",
    "recoveryAction": "Suggested action to resolve the error"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable

## Rate Limiting

API endpoints are rate limited:

- Authenticated users: 1000 requests/hour
- Unauthenticated users: 60 requests/hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704369600
```

## Pagination

List endpoints support pagination:

```
GET /api/endpoint?page=2&per_page=50
```

Pagination info is included in responses:

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "per_page": 50,
    "total": 1000,
    "total_pages": 20
  }
}
```

## Filtering and Sorting

List endpoints support filtering and sorting:

```
GET /api/endpoint?filter[status]=active&sort=-createdAt
```

- Use `filter[field]=value` for filtering
- Use `sort=field` for ascending sort
- Use `sort=-field` for descending sort

## Webhooks

Subscribe to events via webhooks:

```
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["repository.analyzed", "job.completed"],
  "secret": "your-webhook-secret"
}
```

Webhook payloads include:

```json
{
  "event": "repository.analyzed",
  "timestamp": "2025-01-04T12:00:00Z",
  "data": {
    "repository": "owner/name",
    "score": 95
  }
}
```

## WebSocket API

Real-time updates via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:5000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Subscribe to job updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'job:job-uuid'
}));
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { RepoRadarClient } from '@reporadar/client';

const client = new RepoRadarClient({
  baseURL: 'http://localhost:5000',
  apiKey: 'your-api-key'
});

// Analyze repository
const analysis = await client.analyze('facebook', 'react');

// Search repositories
const results = await client.search('react', {
  sort: 'stars',
  order: 'desc'
});

// Create background job
const job = await client.createJob('batch-analysis', {
  repositories: ['owner/repo1', 'owner/repo2']
});

// Track analytics event
await client.trackEvent('repository_analyzed', {
  repository: 'owner/name'
});
```

### Python

```python
from reporadar import RepoRadarClient

client = RepoRadarClient(
    base_url='http://localhost:5000',
    api_key='your-api-key'
)

# Analyze repository
analysis = client.analyze('facebook', 'react')

# Search repositories
results = client.search('react', sort='stars', order='desc')

# Create background job
job = client.create_job('batch-analysis', {
    'repositories': ['owner/repo1', 'owner/repo2']
})
```

## Testing

Use the provided test utilities:

```typescript
import { createTestClient } from '@reporadar/test-utils';

const client = createTestClient();

// Mock responses
client.mock('POST', '/api/analyze', {
  status: 200,
  body: { score: 95 }
});

// Make request
const result = await client.analyze('owner', 'repo');
expect(result.score).toBe(95);
```

## Changelog

### v3.0.0 (2025-01-04)

- Added background job processing endpoints
- Added analytics tracking endpoints
- Added admin dashboard endpoints
- Added health check endpoints
- Improved error responses
- Added rate limiting
- Added WebSocket support

---

**Last Updated:** January 4, 2025
**API Version:** 3.0.0

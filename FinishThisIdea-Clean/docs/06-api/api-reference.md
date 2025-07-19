# API Reference

## Overview

The FinishThisIdea API provides programmatic access to all our AI-powered development services. This RESTful API uses JSON for requests and responses.

## Base URL

```
Production: https://api.finishthisidea.com/v1
Development: http://localhost:3001/api
```

## Authentication

All API requests require authentication using an API key.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.finishthisidea.com/v1/services
```

## Common Headers

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Accept: application/json
X-Request-ID: unique-request-id (optional)
```

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "requestId": "req_abc123"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "requestId": "req_abc123"
  }
}
```

## Core Endpoints

### Upload File

Upload a codebase for processing.

```http
POST /api/upload
Content-Type: multipart/form-data
```

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@project.zip" \
  -F "service=cleanup" \
  https://api.finishthisidea.com/v1/upload
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "up_1234567890",
    "filename": "project.zip",
    "size": 1048576,
    "checksum": "sha256:abc123...",
    "expiresAt": "2024-01-01T01:00:00Z"
  }
}
```

### Create Job

Create a processing job for an uploaded file.

```http
POST /api/jobs
```

**Request:**
```json
{
  "uploadId": "up_1234567890",
  "service": "cleanup",
  "options": {
    "style": "prettier",
    "removeComments": false,
    "generateDocs": true
  },
  "webhook": "https://your-app.com/webhook"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "status": "pending",
    "service": "cleanup",
    "estimatedTime": 1800,
    "price": 1.00,
    "paymentUrl": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

### Get Job Status

Check the status of a processing job.

```http
GET /api/jobs/{jobId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "status": "processing",
    "progress": 65,
    "currentStep": "Analyzing code structure",
    "startedAt": "2024-01-01T00:00:00Z",
    "estimatedCompletion": "2024-01-01T00:30:00Z"
  }
}
```

**Status Values:**
- `pending` - Awaiting payment
- `queued` - Payment received, in queue
- `processing` - Currently being processed
- `completed` - Ready for download
- `failed` - Processing failed
- `cancelled` - Job cancelled

### Download Results

Download the processed files.

```http
GET /api/jobs/{jobId}/download
```

**Response:**
Returns a pre-signed URL for downloading the result:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.finishthisidea.com/results/...",
    "expiresAt": "2024-01-01T02:00:00Z",
    "size": 987654,
    "checksum": "sha256:def456..."
  }
}
```

### Get Processing Report

Get detailed report about the processing.

```http
GET /api/jobs/{jobId}/report
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "filesProcessed": 42,
      "totalChanges": 156,
      "timeElapsed": 1234,
      "improvement": {
        "codeQuality": "+23%",
        "consistency": "+45%",
        "documentation": "+78%"
      }
    },
    "changes": [
      {
        "file": "src/index.js",
        "type": "formatting",
        "before": "const  x=1;",
        "after": "const x = 1;",
        "reason": "Consistent spacing"
      }
    ],
    "metrics": {
      "linesOfCode": {
        "before": 5432,
        "after": 4987
      },
      "complexity": {
        "before": 3.4,
        "after": 2.1
      }
    }
  }
}
```

## Service-Specific Endpoints

### Cleanup Service

#### Analyze Before Cleanup

Get analysis without processing.

```http
POST /api/cleanup/analyze
```

**Request:**
```json
{
  "uploadId": "up_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "type": "formatting",
        "severity": "low",
        "count": 234,
        "examples": ["inconsistent indentation", "missing semicolons"]
      },
      {
        "type": "dead-code",
        "severity": "medium",
        "count": 12,
        "files": ["src/old.js", "lib/deprecated.js"]
      }
    ],
    "recommendations": [
      "Enable prettier for consistent formatting",
      "Remove 12 unused functions",
      "Update 5 deprecated dependencies"
    ],
    "estimatedImprovements": {
      "codeSize": "-15%",
      "complexity": "-20%",
      "quality": "+35%"
    }
  }
}
```

### Documentation Generator

#### Generate Docs

```http
POST /api/documentation/generate
```

**Request:**
```json
{
  "uploadId": "up_1234567890",
  "options": {
    "format": "markdown",
    "includeApi": true,
    "includeExamples": true,
    "languages": ["en", "es"]
  }
}
```

### API Generator

#### Generate API from Spec

```http
POST /api/api-generator/generate
```

**Request:**
```json
{
  "spec": {
    "openapi": "3.0.0",
    "info": {
      "title": "My API",
      "version": "1.0.0"
    },
    "paths": {
      "/users": {
        "get": {
          "summary": "List users",
          "responses": {
            "200": {
              "description": "Success"
            }
          }
        }
      }
    }
  },
  "options": {
    "framework": "express",
    "database": "postgresql",
    "includeAuth": true,
    "includeTests": true
  }
}
```

## Batch Operations

### Process Multiple Files

```http
POST /api/batch
```

**Request:**
```json
{
  "jobs": [
    {
      "uploadId": "up_123",
      "service": "cleanup",
      "options": {}
    },
    {
      "uploadId": "up_456",
      "service": "documentation",
      "options": {}
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz",
    "jobs": [
      { "jobId": "job_1", "service": "cleanup" },
      { "jobId": "job_2", "service": "documentation" }
    ],
    "totalPrice": 4.00,
    "paymentUrl": "https://checkout.stripe.com/..."
  }
}
```

## Webhooks

### Webhook Events

Configure webhooks to receive real-time updates:

```json
POST https://your-app.com/webhook
{
  "event": "job.completed",
  "timestamp": "2024-01-01T00:30:00Z",
  "data": {
    "jobId": "job_abc123",
    "status": "completed",
    "downloadUrl": "https://..."
  }
}
```

**Available Events:**
- `job.created` - Job created
- `job.started` - Processing started
- `job.progress` - Progress update
- `job.completed` - Job completed
- `job.failed` - Job failed

## Rate Limiting

API requests are rate limited to ensure fair usage:

- **Free tier**: 10 requests/minute, 100 requests/hour
- **Pro tier**: 60 requests/minute, 1000 requests/hour
- **Enterprise**: Custom limits

Rate limit headers:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_ERROR` | Invalid or missing API key |
| `VALIDATION_ERROR` | Invalid request parameters |
| `FILE_TOO_LARGE` | File exceeds size limit |
| `UNSUPPORTED_FORMAT` | File format not supported |
| `QUOTA_EXCEEDED` | Monthly quota exceeded |
| `RATE_LIMITED` | Too many requests |
| `PAYMENT_REQUIRED` | Payment failed or required |
| `JOB_NOT_FOUND` | Job ID not found |
| `PROCESSING_ERROR` | Internal processing error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## SDK Libraries

Official SDKs available:

- **Node.js**: `npm install @finishthisidea/sdk`
- **Python**: `pip install finishthisidea`
- **Go**: `go get github.com/finishthisidea/go-sdk`
- **Ruby**: `gem install finishthisidea`

### Node.js Example

```javascript
const FinishThisIdea = require('@finishthisidea/sdk');

const client = new FinishThisIdea({
  apiKey: 'YOUR_API_KEY'
});

// Upload and process
const upload = await client.upload('project.zip');
const job = await client.createJob({
  uploadId: upload.id,
  service: 'cleanup'
});

// Wait for completion
const result = await client.waitForJob(job.id);
const downloadUrl = await client.getDownloadUrl(job.id);
```

## Pagination

List endpoints support pagination:

```http
GET /api/jobs?page=2&limit=20
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 156,
      "pages": 8
    }
  }
}
```

## Versioning

The API uses URL versioning. Always include the version in your requests:

- Current version: `v1`
- Legacy version: `v0` (deprecated)

Version sunset notice will be provided 6 months in advance.

## Support

- **Documentation**: https://docs.finishthisidea.com
- **Status Page**: https://status.finishthisidea.com
- **Support Email**: api@finishthisidea.com
- **Discord**: https://discord.gg/finishthisidea
# API Contracts: Development Reality Engine
## Complete API Specifications and Data Contracts

**Version:** 1.0.0  
**Date:** 2025-08-12  
**Purpose:** Define all API contracts, request/response formats, and data schemas

---

## Table of Contents

1. [API Overview](API.md)
2. [Authentication & Authorization](ObsidianVault/02-Documentation/authentication.md)
3. [REST API Endpoints](API.md)
4. [WebSocket Events](#websocket-events)
5. [Data Models](FinishThisIdea/docs/templates.backup-1752791062847/project-template/data-models.md)
6. [Error Handling](ObsidianVault/02-Documentation/error-handling.md)
7. [Rate Limiting](ObsidianVault/02-Documentation/rate-limiting.md)
8. [Versioning Strategy](#versioning-strategy)

## API Overview

### Base URLs
```
Production:  https://api.dre.dev/v1
Staging:     https://api-staging.dre.dev/v1
Development: http://localhost:3000/api/v1
```

### Content Types
```
Request:  application/json
Response: application/json
Upload:   multipart/form-data
Stream:   text/event-stream
```

### Common Headers
```http
X-API-Version: 1.0
X-Request-ID: uuid-v4
X-Client-Version: @dre/cli@1.0.0
Accept: application/json
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

## Authentication & Authorization

### JWT Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "2023-01-01"
  },
  "payload": {
    "sub": "user:uuid",
    "iat": 1609459200,
    "exp": 1609545600,
    "aud": "dre.dev",
    "iss": "auth.dre.dev",
    "scope": ["read:evidence", "write:evidence", "execute:operations"],
    "tier": "professional",
    "limits": {
      "operations_per_hour": 1000,
      "storage_gb": 100
    }
  }
}
```

### OAuth 2.0 Flow
```http
# 1. Authorization Request
GET /oauth/authorize?
  response_type=code&
  client_id={client_id}&
  redirect_uri={redirect_uri}&
  scope=read:evidence write:evidence&
  state={state}

# 2. Token Exchange
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code={authorization_code}&
client_id={client_id}&
client_secret={client_secret}&
redirect_uri={redirect_uri}

# Response
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",
  "scope": "read:evidence write:evidence"
}
```

## REST API Endpoints

### Operations

#### POST /api/v1/operations/wrap
**Wrap a command for verification**

Request:
```json
{
  "command": "npm test",
  "workingDirectory": "/home/user/project",
  "environment": {
    "NODE_ENV": "test"
  },
  "options": {
    "verification": {
      "methods": ["visual", "programmatic", "behavioral"],
      "confidence": 0.95
    },
    "evidence": {
      "capture": ["screenshots", "logs", "metrics"],
      "compression": true
    }
  }
}
```

Response:
```json
{
  "id": "op_2kj3h4kj234",
  "status": "running",
  "command": "npm test",
  "startedAt": "2024-01-20T10:30:00Z",
  "websocketUrl": "wss://api.dre.dev/ws/operations/op_2kj3h4kj234",
  "links": {
    "self": "/api/v1/operations/op_2kj3h4kj234",
    "evidence": "/api/v1/operations/op_2kj3h4kj234/evidence",
    "cancel": "/api/v1/operations/op_2kj3h4kj234/cancel"
  }
}
```

#### GET /api/v1/operations/{id}
**Get operation details**

Response:
```json
{
  "id": "op_2kj3h4kj234",
  "command": "npm test",
  "workingDirectory": "/home/user/project",
  "status": "completed",
  "exitCode": 0,
  "startedAt": "2024-01-20T10:30:00Z",
  "completedAt": "2024-01-20T10:31:45Z",
  "duration": 105000,
  "evidence": {
    "total": 15,
    "types": {
      "visual": 5,
      "programmatic": 6,
      "behavioral": 4
    }
  },
  "verification": {
    "status": "passed",
    "confidence": 0.98,
    "methods": {
      "visual": { "score": 0.99, "passed": true },
      "programmatic": { "score": 0.97, "passed": true },
      "behavioral": { "score": 0.98, "passed": true }
    }
  }
}
```

#### POST /api/v1/operations/{id}/cancel
**Cancel running operation**

Response:
```json
{
  "id": "op_2kj3h4kj234",
  "status": "cancelled",
  "cancelledAt": "2024-01-20T10:31:00Z",
  "reason": "User requested cancellation"
}
```

### Evidence

#### GET /api/v1/evidence
**List evidence packages**

Query Parameters:
```
page=1
limit=20
operation_id=op_2kj3h4kj234
type=visual,programmatic
from=2024-01-01T00:00:00Z
to=2024-01-31T23:59:59Z
```

Response:
```json
{
  "data": [
    {
      "id": "ev_8h3jk4h5jk",
      "operationId": "op_2kj3h4kj234",
      "type": "visual",
      "format": "screenshot",
      "size": 248576,
      "hash": "sha256:abcd1234...",
      "createdAt": "2024-01-20T10:30:15Z",
      "metadata": {
        "resolution": "1920x1080",
        "selector": "#test-results"
      },
      "links": {
        "self": "/api/v1/evidence/ev_8h3jk4h5jk",
        "download": "/api/v1/evidence/ev_8h3jk4h5jk/download",
        "verify": "/api/v1/evidence/ev_8h3jk4h5jk/verify"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### POST /api/v1/evidence
**Upload evidence manually**

Request (multipart/form-data):
```
operationId: op_2kj3h4kj234
type: visual
file: (binary)
metadata: {"captured_by": "manual", "description": "Test failure screenshot"}
```

Response:
```json
{
  "id": "ev_9k4jh5k6jh",
  "operationId": "op_2kj3h4kj234",
  "type": "visual",
  "format": "image/png",
  "size": 358912,
  "hash": "sha256:efgh5678...",
  "status": "processing",
  "uploadedAt": "2024-01-20T10:32:00Z"
}
```

#### GET /api/v1/evidence/{id}
**Get evidence details**

Response:
```json
{
  "id": "ev_8h3jk4h5jk",
  "operationId": "op_2kj3h4kj234",
  "type": "visual",
  "format": "screenshot",
  "size": 248576,
  "hash": "sha256:abcd1234...",
  "signature": "RSA-SHA256:xyz789...",
  "createdAt": "2024-01-20T10:30:15Z",
  "expiresAt": "2024-02-20T10:30:15Z",
  "metadata": {
    "resolution": "1920x1080",
    "selector": "#test-results",
    "capturedBy": "puppeteer",
    "compressionRatio": 0.65
  },
  "storage": {
    "provider": "s3",
    "bucket": "dre-evidence-prod",
    "key": "ev/2024/01/20/ev_8h3jk4h5jk.png"
  },
  "verification": {
    "integrityCheck": "passed",
    "lastVerified": "2024-01-20T15:00:00Z"
  }
}
```

#### POST /api/v1/evidence/{id}/verify
**Verify evidence integrity**

Response:
```json
{
  "evidenceId": "ev_8h3jk4h5jk",
  "status": "valid",
  "checks": {
    "hashMatch": true,
    "signatureValid": true,
    "notTampered": true,
    "notExpired": true
  },
  "verifiedAt": "2024-01-20T10:35:00Z",
  "certificate": "-----BEGIN CERTIFICATE-----..."
}
```

### Verification

#### POST /api/v1/verification
**Run verification on evidence**

Request:
```json
{
  "operationId": "op_2kj3h4kj234",
  "methods": ["visual", "programmatic"],
  "options": {
    "confidenceThreshold": 0.95,
    "consensusRequired": "majority",
    "timeout": 30000
  }
}
```

Response:
```json
{
  "id": "vf_5jk6l7m8n",
  "operationId": "op_2kj3h4kj234",
  "status": "running",
  "startedAt": "2024-01-20T10:32:00Z",
  "websocketUrl": "wss://api.dre.dev/ws/verification/vf_5jk6l7m8n"
}
```

#### GET /api/v1/verification/{id}
**Get verification results**

Response:
```json
{
  "id": "vf_5jk6l7m8n",
  "operationId": "op_2kj3h4kj234",
  "status": "completed",
  "result": "passed",
  "confidence": 0.97,
  "startedAt": "2024-01-20T10:32:00Z",
  "completedAt": "2024-01-20T10:32:45Z",
  "methods": {
    "visual": {
      "status": "completed",
      "score": 0.98,
      "passed": true,
      "details": {
        "screenshotsAnalyzed": 5,
        "visualRegressions": 0,
        "pixelDifference": 0.02
      }
    },
    "programmatic": {
      "status": "completed", 
      "score": 0.96,
      "passed": true,
      "details": {
        "testsRun": 45,
        "testsPassed": 45,
        "codeCoverage": 0.89
        }
    }
  },
  "consensus": {
    "achieved": true,
    "votes": {
      "pass": 2,
      "fail": 0
    }
  }
}
```

### Configuration

#### GET /api/v1/config
**Get current configuration**

Response:
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "tier": "professional"
  },
  "settings": {
    "verification": {
      "defaultMethods": ["visual", "programmatic"],
      "confidenceThreshold": 0.95,
      "consensusMode": "majority"
    },
    "evidence": {
      "retention": "30d",
      "compression": true,
      "encryption": false
    },
    "integration": {
      "shell": "bash",
      "ide": ["vscode"],
      "ci": ["github"]
    }
  },
  "limits": {
    "operationsPerHour": 1000,
    "storageGB": 100,
    "apiCallsPerMinute": 60
  }
}
```

#### PUT /api/v1/config
**Update configuration**

Request:
```json
{
  "settings": {
    "verification": {
      "confidenceThreshold": 0.99
    },
    "evidence": {
      "encryption": true
    }
  }
}
```

Response:
```json
{
  "updated": true,
  "settings": {
    "verification": {
      "defaultMethods": ["visual", "programmatic"],
      "confidenceThreshold": 0.99,
      "consensusMode": "majority"
    },
    "evidence": {
      "retention": "30d",
      "compression": true,
      "encryption": true
    }
  }
}
```

### Health & Monitoring

#### GET /api/v1/health
**Basic health check**

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:35:00Z"
}
```

#### GET /api/v1/health/detailed
**Detailed health status**

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:35:00Z",
  "version": "1.0.0",
  "uptime": 864000,
  "services": {
    "api": { "status": "healthy", "latency": 5 },
    "database": { "status": "healthy", "latency": 12 },
    "redis": { "status": "healthy", "latency": 2 },
    "storage": { "status": "healthy", "latency": 45 },
    "ai": { "status": "degraded", "latency": 250, "message": "High load" }
  },
  "metrics": {
    "requestsPerMinute": 450,
    "activeOperations": 23,
    "queueDepth": 5
  }
}
```

## WebSocket Events

### Connection
```javascript
// Client connects
const ws = new WebSocket('wss://api.dre.dev/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'Bearer eyJhbGciOiJSUzI1NiIs...'
}));

// Subscribe to channels
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['operations:op_2kj3h4kj234', 'verification:*']
}));
```

### Event Types

#### Operation Events
```json
// operation.started
{
  "type": "operation.started",
  "channel": "operations:op_2kj3h4kj234",
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "id": "op_2kj3h4kj234",
    "command": "npm test",
    "pid": 12345
  }
}

// operation.output
{
  "type": "operation.output",
  "channel": "operations:op_2kj3h4kj234",
  "timestamp": "2024-01-20T10:30:01Z",
  "data": {
    "stream": "stdout",
    "text": "Running tests...\n"
  }
}

// operation.completed
{
  "type": "operation.completed",
  "channel": "operations:op_2kj3h4kj234",
  "timestamp": "2024-01-20T10:31:45Z",
  "data": {
    "id": "op_2kj3h4kj234",
    "exitCode": 0,
    "duration": 105000
  }
}
```

#### Evidence Events
```json
// evidence.captured
{
  "type": "evidence.captured",
  "channel": "operations:op_2kj3h4kj234",
  "timestamp": "2024-01-20T10:30:15Z",
  "data": {
    "id": "ev_8h3jk4h5jk",
    "type": "visual",
    "format": "screenshot",
    "size": 248576
  }
}

// evidence.processed
{
  "type": "evidence.processed",
  "channel": "operations:op_2kj3h4kj234",
  "timestamp": "2024-01-20T10:30:20Z",
  "data": {
    "id": "ev_8h3jk4h5jk",
    "hash": "sha256:abcd1234...",
    "compressed": true,
    "stored": true
  }
}
```

#### Verification Events
```json
// verification.started
{
  "type": "verification.started",
  "channel": "verification:vf_5jk6l7m8n",
  "timestamp": "2024-01-20T10:32:00Z",
  "data": {
    "id": "vf_5jk6l7m8n",
    "methods": ["visual", "programmatic"]
  }
}

// verification.progress
{
  "type": "verification.progress",
  "channel": "verification:vf_5jk6l7m8n",
  "timestamp": "2024-01-20T10:32:15Z",
  "data": {
    "method": "visual",
    "progress": 60,
    "current": "Analyzing screenshot 3 of 5"
  }
}

// verification.completed
{
  "type": "verification.completed",
  "channel": "verification:vf_5jk6l7m8n",
  "timestamp": "2024-01-20T10:32:45Z",
  "data": {
    "id": "vf_5jk6l7m8n",
    "result": "passed",
    "confidence": 0.97
  }
}
```

## Data Models

### Core Entities

#### Operation
```typescript
interface Operation {
  id: string;                    // op_{unique_id}
  command: string;               // Command being wrapped
  workingDirectory: string;      // Execution directory
  environment?: Record<string, string>;
  userId: string;               // User who initiated
  projectId?: string;           // Associated project
  status: OperationStatus;      // pending|running|completed|failed|cancelled
  startedAt: ISO8601;          // Start timestamp
  completedAt?: ISO8601;       // Completion timestamp
  duration?: number;           // Duration in ms
  exitCode?: number;           // Process exit code
  error?: string;              // Error message if failed
  metadata?: Record<string, any>;
}

enum OperationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

#### Evidence
```typescript
interface Evidence {
  id: string;                   // ev_{unique_id}
  operationId: string;          // Associated operation
  type: EvidenceType;           // visual|programmatic|behavioral|structural
  format: string;               // screenshot|log|metric|trace
  size: number;                 // Size in bytes
  hash: string;                 // SHA256 hash
  signature?: string;           // Digital signature
  createdAt: ISO8601;          // Creation timestamp
  expiresAt?: ISO8601;         // Expiration timestamp
  metadata: EvidenceMetadata;   // Type-specific metadata
  storage: StorageInfo;         // Storage location
}

interface EvidenceMetadata {
  // Visual evidence
  resolution?: string;
  selector?: string;
  pixelRatio?: number;
  
  // Programmatic evidence
  testResults?: TestResults;
  coverage?: CoverageData;
  
  // Behavioral evidence
  performance?: PerformanceMetrics;
  resourceUsage?: ResourceMetrics;
  
  // Custom fields
  [key: string]: any;
}
```

#### Verification
```typescript
interface Verification {
  id: string;                   // vf_{unique_id}
  operationId: string;          // Operation being verified
  status: VerificationStatus;   // pending|running|completed|failed
  result?: VerificationResult;  // passed|failed|inconclusive
  confidence?: number;          // 0.0-1.0 confidence score
  startedAt: ISO8601;          // Start timestamp
  completedAt?: ISO8601;       // Completion timestamp
  methods: VerificationMethod[];// Methods used
  consensus?: ConsensusResult;  // Consensus details
}

interface VerificationMethod {
  name: string;                 // visual|programmatic|behavioral
  status: MethodStatus;         // pending|running|completed|failed
  score?: number;              // 0.0-1.0 method score
  passed?: boolean;            // Pass/fail result
  details?: Record<string, any>;// Method-specific details
  error?: string;              // Error if failed
}
```

### Supporting Types

#### Pagination
```typescript
interface PaginationParams {
  page?: number;     // Default: 1
  limit?: number;    // Default: 20, Max: 100
  sort?: string;     // field:asc|desc
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### Error Response
```typescript
interface ErrorResponse {
  error: {
    code: string;        // Unique error code
    message: string;     // Human-readable message
    details?: any;       // Additional error details
    timestamp: ISO8601;  // Error timestamp
    traceId: string;     // Request trace ID
  };
}
```

## Error Handling

### Error Codes
```json
{
  "AUTH001": "Invalid authentication token",
  "AUTH002": "Token expired",
  "AUTH003": "Insufficient permissions",
  "VAL001": "Invalid request format",
  "VAL002": "Missing required field",
  "VAL003": "Invalid field value",
  "OP001": "Operation not found",
  "OP002": "Operation already completed",
  "OP003": "Operation cancelled",
  "EV001": "Evidence not found",
  "EV002": "Evidence corrupted",
  "EV003": "Evidence expired",
  "VF001": "Verification failed",
  "VF002": "Insufficient evidence",
  "VF003": "Consensus not reached",
  "RATE001": "Rate limit exceeded",
  "RATE002": "Quota exceeded",
  "SYS001": "Internal server error",
  "SYS002": "Service unavailable",
  "SYS003": "Dependency failure"
}
```

### Error Response Examples
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "VAL002",
    "message": "Missing required field: command",
    "details": {
      "field": "command",
      "requirement": "non-empty string"
    },
    "timestamp": "2024-01-20T10:35:00Z",
    "traceId": "trace_9k3j4h5k6j"
  }
}
```

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "error": {
    "code": "RATE001",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 60,
      "window": "1m",
      "retryAfter": 60
    },
    "timestamp": "2024-01-20T10:35:00Z",
    "traceId": "trace_8j2k3h4j5"
  }
}
```

## Rate Limiting

### Limits by Tier
```yaml
free:
  requests_per_minute: 20
  operations_per_hour: 50
  storage_gb: 1
  
professional:
  requests_per_minute: 60
  operations_per_hour: 1000
  storage_gb: 100
  
enterprise:
  requests_per_minute: 600
  operations_per_hour: 10000
  storage_gb: 1000
```

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1609459260
X-RateLimit-Window: 60s
```

## Versioning Strategy

### API Versioning
- Version in URL path: `/api/v1/`, `/api/v2/`
- Breaking changes require new major version
- Deprecation notice: 6 months minimum
- Sunset period: 12 months after deprecation

### Response Headers
```http
X-API-Version: 1.0
X-API-Deprecated: false
X-API-Sunset: 2025-01-01
```

### Version Negotiation
```http
# Client requests specific version
Accept: application/vnd.dre.v1+json

# Server responds with version
Content-Type: application/vnd.dre.v1+json
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { DREClient } from '@dre/sdk';

const client = new DREClient({
  apiKey: process.env.DRE_API_KEY,
  baseUrl: 'https://api.dre.dev/v1'
});

// Wrap operation
const operation = await client.operations.wrap({
  command: 'npm test',
  options: {
    verification: {
      methods: ['visual', 'programmatic'],
      confidence: 0.95
    }
  }
});

// Subscribe to real-time updates
operation.on('output', (data) => {
  console.log(data.text);
});

operation.on('completed', (result) => {
  console.log(`Exit code: ${result.exitCode}`);
});
```

### Python
```python
from dre import DREClient

client = DREClient(
    api_key=os.environ['DRE_API_KEY'],
    base_url='https://api.dre.dev/v1'
)

# Wrap operation
operation = client.operations.wrap(
    command='pytest',
    options={
        'verification': {
            'methods': ['visual', 'programmatic'],
            'confidence': 0.95
        }
    }
)

# Wait for completion
result = operation.wait_for_completion()
print(f"Verification result: {result.verification.result}")
```

### CLI
```bash
# Configure API key
dre auth login --api-key $DRE_API_KEY

# Wrap command
dre wrap --verify all --confidence 0.95 npm test

# Get operation details
dre operations get op_2kj3h4kj234

# List evidence
dre evidence list --operation op_2kj3h4kj234
```

## Conclusion

These API contracts provide a complete specification for all client-server interactions in the Development Reality Engine. Every endpoint is designed to support the core mission of verified development through clear, consistent interfaces.

Key design principles:
1. **RESTful design** for predictable interfaces
2. **Real-time updates** via WebSocket for immediate feedback
3. **Comprehensive error handling** for robust clients
4. **Flexible authentication** supporting multiple flows
5. **Clear versioning** for long-term stability

---

**"Well-defined contracts are the foundation of reliable systems."**

*API Contracts v1.0 - The complete interface specification for the Development Reality Engine.*
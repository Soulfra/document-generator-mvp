# API Error Handling

## Overview

FinishThisIdea API uses consistent error responses across all endpoints, making it easy to handle errors in your applications.

## Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "requestId": "req_abc123",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## HTTP Status Codes

### Success Codes
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing
- `204 No Content` - Request succeeded with no response body

### Client Error Codes
- `400 Bad Request` - Invalid request format or parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Valid auth but insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Request conflicts with current state
- `422 Unprocessable Entity` - Valid format but invalid content
- `429 Too Many Requests` - Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error` - Unexpected server error
- `502 Bad Gateway` - Error from upstream service
- `503 Service Unavailable` - Service temporarily down
- `504 Gateway Timeout` - Upstream service timeout

## Error Codes

### Authentication Errors
```json
{
  "error": {
    "code": "AUTH_INVALID_TOKEN",
    "message": "The provided API key is invalid"
  }
}
```

Common auth error codes:
- `AUTH_MISSING_TOKEN` - No API key provided
- `AUTH_INVALID_TOKEN` - Invalid API key format
- `AUTH_EXPIRED_TOKEN` - API key has expired
- `AUTH_REVOKED_TOKEN` - API key has been revoked
- `AUTH_INSUFFICIENT_PERMISSIONS` - Valid key but lacks required scope

### Validation Errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "files",
          "reason": "At least one file is required"
        },
        {
          "field": "options.model",
          "reason": "Invalid model: 'gpt-5'"
        }
      ]
    }
  }
}
```

### Resource Errors
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Job not found",
    "details": {
      "jobId": "job_xyz789",
      "type": "Job"
    }
  }
}
```

Common resource error codes:
- `RESOURCE_NOT_FOUND` - Resource doesn't exist
- `RESOURCE_ALREADY_EXISTS` - Duplicate resource
- `RESOURCE_LOCKED` - Resource is locked for editing
- `RESOURCE_DELETED` - Resource has been deleted

### Processing Errors
```json
{
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "Failed to process code",
    "details": {
      "reason": "Syntax error in input file",
      "file": "main.js",
      "line": 42
    }
  }
}
```

### Rate Limiting Errors
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "window": "hour",
      "retryAfter": 1234
    }
  },
  "headers": {
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "1705751400"
  }
}
```

## Error Handling Best Practices

### 1. Check Status Code First
```typescript
const response = await fetch('/api/jobs', {
  method: 'POST',
  body: JSON.stringify(data)
});

if (!response.ok) {
  const error = await response.json();
  handleApiError(error);
}
```

### 2. Handle Specific Error Codes
```typescript
function handleApiError(error: ApiError) {
  switch (error.error.code) {
    case 'AUTH_INVALID_TOKEN':
      // Prompt user to update API key
      return refreshApiKey();
      
    case 'RATE_LIMIT_EXCEEDED':
      // Retry after delay
      const retryAfter = error.details.retryAfter * 1000;
      return setTimeout(() => retryRequest(), retryAfter);
      
    case 'VALIDATION_ERROR':
      // Show field-specific errors
      return showValidationErrors(error.details.errors);
      
    default:
      // Generic error handling
      return showGenericError(error.message);
  }
}
```

### 3. Implement Exponential Backoff
```typescript
async function requestWithRetry(
  fn: () => Promise<Response>,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn();
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.pow(2, i) * 1000;
          
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Network error - exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }
  
  throw lastError;
}
```

### 4. Log Errors with Context
```typescript
function logApiError(error: ApiError, context: any) {
  console.error('API Error:', {
    code: error.error.code,
    message: error.error.message,
    requestId: error.requestId,
    timestamp: error.timestamp,
    context: {
      endpoint: context.endpoint,
      method: context.method,
      userId: context.userId
    }
  });
  
  // Send to error tracking service
  errorTracker.captureException(error, { extra: context });
}
```

## Common Error Scenarios

### File Upload Errors
```javascript
// Handle file too large
if (error.code === 'FILE_TOO_LARGE') {
  alert(`File exceeds maximum size of ${error.details.maxSize}`);
}

// Handle unsupported file type
if (error.code === 'UNSUPPORTED_FILE_TYPE') {
  alert(`File type ${error.details.fileType} is not supported`);
}
```

### Payment Errors
```javascript
// Handle payment failures
if (error.code === 'PAYMENT_FAILED') {
  switch (error.details.reason) {
    case 'insufficient_funds':
      showPaymentError('Insufficient funds');
      break;
    case 'card_declined':
      showPaymentError('Card was declined');
      break;
    default:
      showPaymentError('Payment failed. Please try again.');
  }
}
```

### Job Processing Errors
```javascript
// Handle job failures
if (error.code === 'JOB_FAILED') {
  if (error.details.retriable) {
    // Offer to retry
    showRetryOption(error.details.jobId);
  } else {
    // Show permanent failure
    showJobError(error.details.reason);
  }
}
```

## SDK Error Handling

Our SDKs provide built-in error handling:

### JavaScript SDK
```javascript
import { FinishThisIdea, ApiError } from '@finishthisidea/sdk';

const client = new FinishThisIdea({ apiKey: 'your-key' });

try {
  const job = await client.jobs.create({
    service: 'code-cleanup',
    files: ['main.js']
  });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.code}: ${error.message}`);
    
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      // SDK automatically retries rate limited requests
      // This catch block only runs if all retries fail
    }
  } else {
    // Network or other error
    console.error('Request failed:', error);
  }
}
```

### Python SDK
```python
from finishthisidea import Client, ApiError

client = Client(api_key="your-key")

try:
    job = client.jobs.create(
        service="code-cleanup",
        files=["main.py"]
    )
except ApiError as e:
    print(f"API Error {e.code}: {e.message}")
    
    if e.code == "VALIDATION_ERROR":
        for error in e.details["errors"]:
            print(f"Field {error['field']}: {error['reason']}")
except Exception as e:
    print(f"Request failed: {e}")
```

## Webhook Error Handling

For webhook endpoints, we retry failed deliveries:

1. **Initial delivery** - Immediate
2. **First retry** - After 10 seconds
3. **Second retry** - After 1 minute
4. **Third retry** - After 5 minutes
5. **Final retry** - After 30 minutes

Your webhook should return:
- `2xx` status code for success
- `4xx` for permanent failures (no retry)
- `5xx` for temporary failures (will retry)

## Support

If you encounter persistent errors:

1. Check our [status page](https://status.finishthisidea.com)
2. Review the error details and request ID
3. Contact support with the request ID
4. Join our Discord for community help
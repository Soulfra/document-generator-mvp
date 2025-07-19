# Rate Limiting

## Overview

Rate limiting protects the FinishThisIdea API from abuse and ensures fair usage across all users. Different tiers have different limits to accommodate various usage patterns.

## Rate Limit Tiers

### Free Tier
- **10 requests per minute**
- **100 requests per hour**
- **1,000 requests per day**
- Suitable for testing and small projects

### Pro Tier ($29/month)
- **60 requests per minute**
- **1,000 requests per hour**
- **10,000 requests per day**
- Ideal for small to medium applications

### Business Tier ($99/month)
- **300 requests per minute**
- **5,000 requests per hour**
- **50,000 requests per day**
- Perfect for growing businesses

### Enterprise Tier (Custom)
- **Custom rate limits**
- **Dedicated infrastructure**
- **SLA guarantees**
- Contact sales for pricing

## Rate Limit Headers

Every API response includes rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
X-RateLimit-Reset-After: 3600
X-RateLimit-Bucket: api
```

### Header Definitions

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in current window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |
| `X-RateLimit-Reset-After` | Seconds until limit resets |
| `X-RateLimit-Bucket` | Rate limit bucket identifier |

## Rate Limit Windows

### Sliding Window

We use a sliding window algorithm for accurate rate limiting:

```
Time:     [-----|-----|-----|-----|-----|]
Window:      [=====Window=====]
Requests:     3    2    1    0    ?
```

This provides smoother rate limiting compared to fixed windows.

### Multiple Windows

Rate limits are enforced across multiple time windows:
- Per minute
- Per hour  
- Per day

You must stay within ALL limits.

## Handling Rate Limits

### Check Remaining Requests

Always check rate limit headers before making requests:

```javascript
const response = await fetch(url, options);

const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
const resetTime = parseInt(response.headers.get('X-RateLimit-Reset'));

if (remaining === 0) {
  const waitTime = resetTime - Math.floor(Date.now() / 1000);
  console.log(`Rate limited. Wait ${waitTime} seconds.`);
}
```

### Rate Limit Response

When rate limited, you'll receive:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067260

{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please retry after 60 seconds.",
    "retryAfter": 60,
    "limit": 60,
    "window": "minute"
  }
}
```

### Exponential Backoff

Implement exponential backoff for retries:

```javascript
async function requestWithBackoff(url, options, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status !== 429) {
        return response;
      }
      
      const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
      const backoffTime = Math.min(retryAfter * Math.pow(2, i), 300);
      
      console.log(`Rate limited. Retrying in ${backoffTime}s...`);
      await sleep(backoffTime * 1000);
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

## Service-Specific Limits

Different services have different resource requirements:

### Cleanup Service
- **Standard rate limits apply**
- Maximum 10 concurrent jobs
- 50MB file size limit

### API Generator
- **50% of standard rate**
- Maximum 5 concurrent generations
- Complex operations = higher cost

### Documentation Generator
- **75% of standard rate**
- Maximum 8 concurrent jobs
- Medium complexity

## Burst Limits

Short bursts are allowed within reason:

```javascript
// Allowed: 20 requests in 2 seconds (if under minute limit)
for (let i = 0; i < 20; i++) {
  await makeRequest();
}

// Not allowed: 100 requests in 10 seconds
for (let i = 0; i < 100; i++) {
  await makeRequest(); // Will be rate limited
}
```

## Cost-Based Limiting

Some operations consume more "cost units":

| Operation | Cost Units |
|-----------|------------|
| Simple query | 1 |
| File upload | 2 |
| Cleanup job | 5 |
| API generation | 10 |
| Batch operation | Sum of operations |

Example:
```javascript
// These consume different amounts from your rate limit
await api.getStatus();        // 1 unit
await api.uploadFile(file);   // 2 units  
await api.generateAPI(spec);  // 10 units
```

## Optimization Strategies

### 1. Request Batching

Combine multiple operations:

```javascript
// Instead of:
const job1 = await api.createJob({ file: 'app.zip', service: 'cleanup' });
const job2 = await api.createJob({ file: 'lib.zip', service: 'cleanup' });

// Do:
const jobs = await api.createBatch([
  { file: 'app.zip', service: 'cleanup' },
  { file: 'lib.zip', service: 'cleanup' }
]);
```

### 2. Caching

Cache responses when possible:

```javascript
const cache = new Map();

async function getCachedOrFetch(key, fetcher) {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < 300000) { // 5 minutes
      return data;
    }
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 3. Webhooks

Use webhooks instead of polling:

```javascript
// Instead of:
while (job.status !== 'completed') {
  job = await api.getJob(jobId); // Uses rate limit
  await sleep(5000);
}

// Use webhooks:
await api.createJob({
  // ...
  webhook: 'https://your-app.com/webhook'
});
```

## Rate Limit Monitoring

### Check Current Usage

```bash
GET /api/account/rate-limit
Authorization: Bearer YOUR_API_KEY
```

Response:
```json
{
  "tier": "pro",
  "limits": {
    "minute": { "limit": 60, "remaining": 45, "reset": 1704067260 },
    "hour": { "limit": 1000, "remaining": 876, "reset": 1704070800 },
    "day": { "limit": 10000, "remaining": 8234, "reset": 1704124800 }
  },
  "usage": {
    "today": 1766,
    "thisMonth": 45234,
    "average": {
      "perMinute": 2.3,
      "perHour": 134,
      "perDay": 1766
    }
  }
}
```

### Usage Alerts

Configure alerts when approaching limits:

```bash
POST /api/account/alerts
{
  "type": "rate_limit",
  "threshold": 80,
  "channels": ["email", "webhook"]
}
```

## Special Cases

### Exempt Endpoints

Some endpoints don't count against rate limits:
- `GET /api/health`
- `GET /api/status`
- `GET /api/account/rate-limit`

### Shared Limits

Team accounts share rate limits:
- All team members use the same pool
- Individual tracking available
- Configurable per-member limits

### IP-Based Limits

Additional limits per IP address:
- 1000 requests per hour per IP
- Prevents single client monopolization
- Separate from API key limits

## Rate Limit Errors

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `RATE_LIMITED` | General rate limit | Wait and retry |
| `MINUTE_LIMIT_EXCEEDED` | Per-minute limit hit | Wait 60 seconds |
| `HOUR_LIMIT_EXCEEDED` | Per-hour limit hit | Wait or upgrade |
| `DAY_LIMIT_EXCEEDED` | Daily limit hit | Wait until reset |
| `CONCURRENT_LIMIT_EXCEEDED` | Too many active jobs | Wait for jobs to complete |

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "HOUR_LIMIT_EXCEEDED",
    "message": "Hourly rate limit of 1000 requests exceeded",
    "limit": 1000,
    "remaining": 0,
    "reset": 1704070800,
    "resetAfter": 2145,
    "upgradeUrl": "https://finishthisidea.com/upgrade"
  }
}
```

## Best Practices

### 1. Implement Retry Logic

```javascript
class APIClient {
  async request(url, options) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await this.sleep(retryAfter * 1000);
      return this.request(url, options);
    }
    
    return response;
  }
}
```

### 2. Monitor Usage

```javascript
class RateLimitMonitor {
  checkLimits(headers) {
    const remaining = parseInt(headers.get('X-RateLimit-Remaining'));
    const limit = parseInt(headers.get('X-RateLimit-Limit'));
    
    const percentUsed = ((limit - remaining) / limit) * 100;
    
    if (percentUsed > 80) {
      console.warn(`Rate limit warning: ${percentUsed}% used`);
    }
  }
}
```

### 3. Spread Requests

```javascript
// Instead of bursting:
results = await Promise.all(items.map(processItem));

// Spread over time:
for (const item of items) {
  await processItem(item);
  await sleep(100); // Small delay
}
```

## Upgrading Limits

### Upgrade Process

1. Check current usage patterns
2. Choose appropriate tier
3. Upgrade via dashboard
4. Limits update immediately

### Custom Limits

For special requirements:
- Contact sales@finishthisidea.com
- Explain use case
- Get custom quote
- Dedicated infrastructure possible

## FAQ

**Q: Do failed requests count against limits?**
A: Yes, all API requests count except 401/403 auth errors.

**Q: Can I bank unused requests?**
A: No, limits reset each window. Use it or lose it.

**Q: What about batch operations?**
A: Batch operations count as one request but may consume more cost units.

**Q: Can I increase limits temporarily?**
A: Yes, contact support for temporary increases (events, migrations, etc.).
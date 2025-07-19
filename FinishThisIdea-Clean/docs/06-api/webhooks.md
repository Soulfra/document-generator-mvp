# Webhooks

## Overview

Webhooks allow your application to receive real-time notifications about events in the FinishThisIdea platform. Instead of polling for status updates, webhooks push data to your endpoint as events occur.

## Setting Up Webhooks

### 1. Create Webhook Endpoint

First, create an endpoint in your application to receive webhooks:

```javascript
// Express.js example
app.post('/webhooks/finishthisidea', (req, res) => {
  const event = req.body;
  
  // Verify webhook signature
  if (!verifyWebhookSignature(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Process event
  switch (event.type) {
    case 'job.completed':
      handleJobCompleted(event.data);
      break;
    case 'job.failed':
      handleJobFailed(event.data);
      break;
    // ... handle other events
  }
  
  // Always respond quickly
  res.status(200).json({ received: true });
});
```

### 2. Register Webhook URL

Register your endpoint in the dashboard or via API:

```bash
POST /api/webhooks
Authorization: Bearer YOUR_API_KEY

{
  "url": "https://your-app.com/webhooks/finishthisidea",
  "events": ["job.completed", "job.failed"],
  "description": "Production webhook"
}
```

### 3. Test Webhook

Send a test event to verify your endpoint:

```bash
POST /api/webhooks/{webhookId}/test
Authorization: Bearer YOUR_API_KEY
```

## Webhook Events

### Job Events

#### job.created
Fired when a new job is created.

```json
{
  "id": "evt_1234567890",
  "type": "job.created",
  "created": "2024-01-01T00:00:00Z",
  "data": {
    "jobId": "job_abc123",
    "service": "cleanup",
    "status": "pending",
    "uploadId": "up_xyz789"
  }
}
```

#### job.started
Fired when processing begins.

```json
{
  "id": "evt_1234567890",
  "type": "job.started",
  "created": "2024-01-01T00:00:00Z",
  "data": {
    "jobId": "job_abc123",
    "startedAt": "2024-01-01T00:00:00Z",
    "estimatedCompletion": "2024-01-01T00:30:00Z"
  }
}
```

#### job.progress
Fired periodically during processing.

```json
{
  "id": "evt_1234567890",
  "type": "job.progress",
  "created": "2024-01-01T00:00:00Z",
  "data": {
    "jobId": "job_abc123",
    "progress": 65,
    "currentStep": "Optimizing imports",
    "stepsCompleted": 8,
    "totalSteps": 12
  }
}
```

#### job.completed
Fired when processing completes successfully.

```json
{
  "id": "evt_1234567890",
  "type": "job.completed",
  "created": "2024-01-01T00:00:00Z",
  "data": {
    "jobId": "job_abc123",
    "completedAt": "2024-01-01T00:30:00Z",
    "downloadUrl": "https://storage.finishthisidea.com/results/...",
    "reportUrl": "https://api.finishthisidea.com/v1/jobs/job_abc123/report",
    "metrics": {
      "filesProcessed": 42,
      "totalChanges": 156,
      "improvement": 23.5
    }
  }
}
```

#### job.failed
Fired when processing fails.

```json
{
  "id": "evt_1234567890",
  "type": "job.failed",
  "created": "2024-01-01T00:00:00Z",
  "data": {
    "jobId": "job_abc123",
    "failedAt": "2024-01-01T00:15:00Z",
    "error": {
      "code": "PROCESSING_ERROR",
      "message": "Failed to parse JavaScript files",
      "details": {
        "file": "src/invalid.js",
        "line": 42,
        "error": "Unexpected token"
      }
    },
    "canRetry": true
  }
}
```

### Payment Events

#### payment.succeeded
Fired when payment is confirmed.

```json
{
  "id": "evt_1234567890",
  "type": "payment.succeeded",
  "created": "2024-01-01T00:00:00Z",
  "data": {
    "paymentId": "pi_abc123",
    "amount": 100,
    "currency": "usd",
    "jobId": "job_abc123",
    "customer": {
      "id": "cus_xyz789",
      "email": "user@example.com"
    }
  }
}
```

#### payment.failed
Fired when payment fails.

```json
{
  "id": "evt_1234567890",
  "type": "payment.failed",
  "created": "2024-01-01T00:00:00Z",
  "data": {
    "paymentId": "pi_abc123",
    "jobId": "job_abc123",
    "error": {
      "code": "card_declined",
      "message": "Your card was declined"
    }
  }
}
```

### Account Events

#### usage.limit_reached
Fired when account reaches usage limits.

```json
{
  "id": "evt_1234567890",
  "type": "usage.limit_reached",
  "created": "2024-01-01T00:00:00Z",
  "data": {
    "limit": "monthly_requests",
    "current": 1000,
    "maximum": 1000,
    "resetAt": "2024-02-01T00:00:00Z"
  }
}
```

## Webhook Security

### Signature Verification

All webhooks are signed using HMAC-SHA256. Verify signatures to ensure webhooks are from FinishThisIdea:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(req) {
  const signature = req.headers['x-finishthisidea-signature'];
  const timestamp = req.headers['x-finishthisidea-timestamp'];
  const body = JSON.stringify(req.body);
  
  // Prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - parseInt(timestamp) > 300) { // 5 minutes
    return false;
  }
  
  // Verify signature
  const payload = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Getting Your Webhook Secret

Find your webhook signing secret in the dashboard:
1. Go to Settings → Webhooks
2. Click on your webhook
3. Copy the signing secret

## Webhook Headers

All webhook requests include these headers:

```http
Content-Type: application/json
X-FinishThisIdea-Signature: sha256=abc123...
X-FinishThisIdea-Timestamp: 1704067200
X-FinishThisIdea-Event: job.completed
X-FinishThisIdea-Delivery: evt_1234567890
User-Agent: FinishThisIdea-Webhooks/1.0
```

## Handling Webhooks

### Best Practices

1. **Respond Quickly**
   - Return 2xx status within 5 seconds
   - Process events asynchronously

```javascript
app.post('/webhook', (req, res) => {
  // Acknowledge receipt immediately
  res.status(200).json({ received: true });
  
  // Process asynchronously
  processWebhookAsync(req.body);
});
```

2. **Idempotency**
   - Store event IDs to prevent duplicate processing
   - Events may be delivered more than once

```javascript
async function processWebhook(event) {
  // Check if already processed
  if (await isProcessed(event.id)) {
    return;
  }
  
  // Process event
  await handleEvent(event);
  
  // Mark as processed
  await markProcessed(event.id);
}
```

3. **Error Handling**
   - Log failures for debugging
   - Return 5xx for temporary failures (will retry)
   - Return 4xx for permanent failures (won't retry)

```javascript
app.post('/webhook', async (req, res) => {
  try {
    await processWebhook(req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    
    if (isTemporaryError(error)) {
      res.status(503).send('Service Unavailable');
    } else {
      res.status(400).send('Bad Request');
    }
  }
});
```

## Retry Policy

Failed webhooks are retried with exponential backoff:

1. Immediately
2. 5 seconds
3. 30 seconds
4. 2 minutes
5. 10 minutes
6. 30 minutes
7. 1 hour
8. 2 hours
9. 4 hours
10. 8 hours

After 10 attempts, the webhook is marked as failed.

## Managing Webhooks

### List Webhooks

```bash
GET /api/webhooks
Authorization: Bearer YOUR_API_KEY
```

### Update Webhook

```bash
PUT /api/webhooks/{webhookId}
Authorization: Bearer YOUR_API_KEY

{
  "url": "https://new-url.com/webhook",
  "events": ["job.completed"],
  "active": true
}
```

### Delete Webhook

```bash
DELETE /api/webhooks/{webhookId}
Authorization: Bearer YOUR_API_KEY
```

### View Webhook Logs

```bash
GET /api/webhooks/{webhookId}/deliveries
Authorization: Bearer YOUR_API_KEY
```

Response:
```json
{
  "deliveries": [
    {
      "id": "del_abc123",
      "eventId": "evt_xyz789",
      "eventType": "job.completed",
      "timestamp": "2024-01-01T00:00:00Z",
      "status": "success",
      "statusCode": 200,
      "duration": 234,
      "attempts": 1
    }
  ]
}
```

## Testing Webhooks

### Using ngrok for Local Development

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the HTTPS URL for webhook testing
https://abc123.ngrok.io/webhook
```

### Webhook Testing Tool

Use our webhook testing tool:

```bash
POST /api/webhooks/test
Authorization: Bearer YOUR_API_KEY

{
  "url": "https://your-test-endpoint.com/webhook",
  "event": "job.completed",
  "data": {
    "jobId": "test_job_123"
  }
}
```

## Webhook Payloads

### Full Event Structure

```typescript
interface WebhookEvent {
  id: string;           // Unique event ID
  type: string;         // Event type
  created: string;      // ISO 8601 timestamp
  data: object;         // Event-specific data
  object: string;       // Object type (job, payment, etc.)
  apiVersion: string;   // API version used
  request?: {           // Original request info (if applicable)
    id: string;
    idempotencyKey?: string;
  };
}
```

### Batch Events

Multiple events can be sent in one webhook:

```json
{
  "id": "batch_abc123",
  "type": "batch",
  "created": "2024-01-01T00:00:00Z",
  "events": [
    {
      "id": "evt_1",
      "type": "job.completed",
      "data": { /* ... */ }
    },
    {
      "id": "evt_2",
      "type": "job.completed",
      "data": { /* ... */ }
    }
  ]
}
```

## Monitoring

### Webhook Health

Monitor webhook health in the dashboard:
- Success rate
- Average response time
- Failed deliveries
- Event volume

### Alerts

Configure alerts for webhook failures:
- Multiple consecutive failures
- Response time > 5 seconds
- Error rate > 5%

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Verify URL is publicly accessible
   - Check webhook is active
   - Confirm events are subscribed

2. **Signature verification failing**
   - Ensure using raw request body
   - Check webhook secret is correct
   - Verify timestamp validation

3. **Duplicate events**
   - Implement idempotency
   - Store processed event IDs
   - Use event timestamp for ordering

### Debug Mode

Enable debug mode for detailed logs:

```bash
PUT /api/webhooks/{webhookId}
{
  "debug": true
}
```

Debug webhooks include additional headers:
```http
X-FinishThisIdea-Debug: true
X-FinishThisIdea-Attempt: 1
X-FinishThisIdea-Retry-After: 60
```

## Support

For webhook issues:
- Check https://status.finishthisidea.com
- Email: webhooks@finishthisidea.com
- Debug logs: Dashboard → Webhooks → Deliveries
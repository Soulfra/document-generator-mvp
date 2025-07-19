# Authentication

## Overview

The FinishThisIdea API uses API keys to authenticate requests. API keys are associated with your account and can be managed from the dashboard.

## API Keys

### Getting Your API Key

1. Sign up at https://finishthisidea.com
2. Navigate to Dashboard → API Keys
3. Click "Create New Key"
4. Copy your key (it won't be shown again)

### Key Format

API keys follow this format:
```
fti_live_sk_1234567890abcdef
```

- `fti` - Service identifier
- `live` or `test` - Environment
- `sk` - Secret key (never expose publicly)
- `1234567890abcdef` - Unique identifier

## Using API Keys

### Bearer Token (Recommended)

Include your API key in the Authorization header:

```bash
curl -H "Authorization: Bearer fti_live_sk_1234567890abcdef" \
  https://api.finishthisidea.com/v1/services
```

### Query Parameter (Not Recommended)

For quick testing only:
```bash
curl https://api.finishthisidea.com/v1/services?api_key=fti_live_sk_1234567890abcdef
```

⚠️ **Warning**: Never use query parameters in production as keys may be logged.

## Environment Keys

### Test Mode

Test keys allow full API access without charges:
- Key prefix: `fti_test_sk_`
- No real processing occurs
- Returns mock data
- Rate limits still apply

```javascript
// Test mode example
const client = new FinishThisIdea({
  apiKey: 'fti_test_sk_1234567890abcdef',
  testMode: true
});
```

### Live Mode

Live keys process real data and incur charges:
- Key prefix: `fti_live_sk_`
- Full processing capability
- Real charges apply
- Production rate limits

## Security Best Practices

### 1. Keep Keys Secret

Never expose API keys in:
- Client-side code
- Public repositories
- URLs or query parameters
- Error messages

### 2. Use Environment Variables

Store keys in environment variables:

```bash
# .env file
FINISHTHISIDEA_API_KEY=fti_live_sk_1234567890abcdef
```

```javascript
const apiKey = process.env.FINISHTHISIDEA_API_KEY;
```

### 3. Rotate Keys Regularly

Rotate API keys every 90 days:
1. Create new key
2. Update applications
3. Revoke old key

### 4. Restrict Key Permissions

Create keys with minimal required permissions:
- Read-only keys for analytics
- Service-specific keys
- IP-restricted keys

## Key Management

### Creating Keys

```bash
POST /api/account/keys
Authorization: Bearer YOUR_MASTER_KEY

{
  "name": "Production Server",
  "permissions": ["cleanup", "documentation"],
  "ipWhitelist": ["192.168.1.1"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Listing Keys

```bash
GET /api/account/keys
Authorization: Bearer YOUR_MASTER_KEY
```

Response:
```json
{
  "keys": [
    {
      "id": "key_abc123",
      "name": "Production Server",
      "prefix": "fti_live_sk_",
      "lastUsed": "2024-01-01T00:00:00Z",
      "created": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Revoking Keys

```bash
DELETE /api/account/keys/{keyId}
Authorization: Bearer YOUR_MASTER_KEY
```

## OAuth 2.0 (Coming Soon)

For partner integrations, OAuth 2.0 support is planned:

```javascript
// Future OAuth flow
const oauth = new FinishThisIdeaOAuth({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'https://your-app.com/callback'
});

const authUrl = oauth.getAuthorizationUrl({
  scope: ['cleanup', 'documentation'],
  state: 'random-state'
});
```

## JWT Tokens

For user authentication, JWT tokens are used:

### Login

```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

Response:
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### Using JWT

```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  https://api.finishthisidea.com/v1/user/profile
```

### Refresh Token

```bash
POST /api/auth/refresh
{
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Two-Factor Authentication

For enhanced security, enable 2FA:

### Enable 2FA

```bash
POST /api/account/2fa/enable
Authorization: Bearer YOUR_TOKEN
```

Response includes QR code for authenticator apps:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,..."
}
```

### Verify 2FA

```bash
POST /api/account/2fa/verify
{
  "code": "123456"
}
```

## IP Whitelisting

Restrict API key usage to specific IPs:

```bash
PUT /api/account/keys/{keyId}/whitelist
{
  "ips": [
    "192.168.1.1",
    "10.0.0.0/24"
  ]
}
```

## Rate Limiting by Auth Type

Different authentication methods have different rate limits:

| Auth Method | Requests/Min | Requests/Hour | Requests/Day |
|-------------|--------------|---------------|--------------|
| No Auth | 5 | 20 | 100 |
| API Key (Free) | 10 | 100 | 1,000 |
| API Key (Pro) | 60 | 1,000 | 10,000 |
| API Key (Enterprise) | 600 | 10,000 | Unlimited |
| OAuth Token | 120 | 2,000 | 20,000 |

## Error Responses

### Invalid API Key

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The API key provided is invalid",
    "statusCode": 401
  }
}
```

### Expired Token

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "The access token has expired",
    "statusCode": 401
  }
}
```

### Insufficient Permissions

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "This API key doesn't have permission to access this resource",
    "statusCode": 403
  }
}
```

## Security Headers

Include these headers in your requests:

```http
X-Request-ID: unique-request-id
X-Client-Version: 1.0.0
X-Client-Platform: node
```

## Monitoring Key Usage

### Usage Statistics

```bash
GET /api/account/keys/{keyId}/usage
Authorization: Bearer YOUR_MASTER_KEY
```

Response:
```json
{
  "period": "2024-01",
  "requests": {
    "total": 1234,
    "successful": 1200,
    "failed": 34
  },
  "services": {
    "cleanup": 800,
    "documentation": 400,
    "api-generator": 34
  },
  "cost": 156.78
}
```

### Audit Logs

```bash
GET /api/account/audit-logs
Authorization: Bearer YOUR_MASTER_KEY
```

## Emergency Procedures

### Compromised Key

If a key is compromised:
1. Revoke immediately via dashboard
2. Check audit logs for unauthorized usage
3. Create new key
4. Update all applications
5. Enable 2FA if not already active

### Account Recovery

If locked out:
1. Use account recovery at https://finishthisidea.com/recover
2. Verify email ownership
3. Complete 2FA if enabled
4. Reset master credentials

## Support

For authentication issues:
- Email: security@finishthisidea.com
- Emergency: +1-555-0123 (24/7)
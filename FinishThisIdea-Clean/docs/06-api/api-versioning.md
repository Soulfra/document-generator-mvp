# API Versioning

## Overview

FinishThisIdea API uses date-based versioning to ensure backward compatibility while continuously improving our services.

## Current Version

The current API version is `2024-01-01`. This version includes all the latest features and improvements.

## Version Format

We use ISO 8601 date format for versions: `YYYY-MM-DD`

Examples:
- `2024-01-01` - Current stable version
- `2023-10-15` - Previous version
- `2023-07-01` - Legacy version (deprecated)

## Specifying Version

### Header-based Versioning (Recommended)

Include the version in the `X-API-Version` header:

```bash
curl -X POST https://api.finishthisidea.com/jobs \
  -H "Authorization: Bearer your-api-key" \
  -H "X-API-Version: 2024-01-01" \
  -H "Content-Type: application/json" \
  -d '{"service": "code-cleanup", "files": ["main.js"]}'
```

### URL-based Versioning

Alternatively, include the version in the URL path:

```bash
curl -X POST https://api.finishthisidea.com/v2024-01-01/jobs \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"service": "code-cleanup", "files": ["main.js"]}'
```

### Default Version

If no version is specified, the API uses your account's pinned version. New accounts default to the latest stable version.

## Version Lifecycle

### 1. Preview (Beta)
- New features released for testing
- May have breaking changes
- Not recommended for production
- Available for 30 days before stable release

### 2. Stable
- Production-ready
- No breaking changes
- Bug fixes and improvements only
- Supported for at least 12 months

### 3. Deprecated
- Still functional but not recommended
- Migration guide provided
- 6-month sunset period
- Deprecation warnings in responses

### 4. Sunset
- No longer available
- Requests return 410 Gone error
- Must upgrade to supported version

## Version Timeline

```
2024-01-01 (Current Stable)
├── Released: January 1, 2024
├── Status: Stable
└── Features: Batch processing, streaming responses

2023-10-15 (Previous Stable)
├── Released: October 15, 2023
├── Status: Deprecated (Sunset: July 1, 2024)
└── Features: Webhook improvements, new services

2023-07-01 (Legacy)
├── Released: July 1, 2023
├── Status: Sunset
└── Migration required
```

## Breaking Changes

Breaking changes include:
- Removing endpoints
- Changing required parameters
- Modifying response structures
- Altering authentication methods

Non-breaking changes:
- Adding optional parameters
- New endpoints
- Additional response fields
- Performance improvements

## Migration Guides

### Migrating from 2023-10-15 to 2024-01-01

#### 1. Job Creation Changes

```javascript
// Old (2023-10-15)
const job = await client.jobs.create({
  service: 'code-cleanup',
  files: ['main.js'],
  async: true  // Parameter removed
});

// New (2024-01-01)
const job = await client.jobs.create({
  service: 'code-cleanup',
  files: ['main.js']
  // All jobs are now async by default
});
```

#### 2. Response Format Updates

```javascript
// Old (2023-10-15)
{
  "job": {
    "id": "job_123",
    "status": "processing"
  }
}

// New (2024-01-01)
{
  "id": "job_123",
  "status": "processing",
  "metadata": {
    "created": "2024-01-20T10:00:00Z",
    "version": "2024-01-01"
  }
}
```

#### 3. Webhook Payload Changes

```javascript
// Old (2023-10-15)
{
  "type": "job.completed",
  "job_id": "job_123"
}

// New (2024-01-01)
{
  "event": "job.completed",
  "data": {
    "id": "job_123",
    "status": "completed",
    "result": { ... }
  },
  "metadata": {
    "timestamp": "2024-01-20T10:30:00Z",
    "version": "2024-01-01"
  }
}
```

## Version Detection

### Check Current Version

```bash
GET /version
```

Response:
```json
{
  "current": "2024-01-01",
  "supported": [
    "2024-01-01",
    "2023-10-15"
  ],
  "deprecated": [
    "2023-10-15"
  ],
  "your_version": "2024-01-01"
}
```

### Version in Response Headers

All API responses include version information:

```
X-API-Version: 2024-01-01
X-API-Version-Latest: 2024-01-01
X-API-Deprecation-Warning: Version 2023-10-15 will be sunset on 2024-07-01
```

## SDK Version Management

### JavaScript SDK

```javascript
import { FinishThisIdea } from '@finishthisidea/sdk';

// Specify version explicitly
const client = new FinishThisIdea({
  apiKey: 'your-key',
  apiVersion: '2024-01-01'
});

// Use latest version (default)
const client = new FinishThisIdea({
  apiKey: 'your-key'
});

// Check SDK compatibility
if (!client.supportsVersion('2024-01-01')) {
  console.warn('Please update your SDK');
}
```

### Python SDK

```python
from finishthisidea import Client

# Specify version
client = Client(
    api_key="your-key",
    api_version="2024-01-01"
)

# Check available versions
print(client.supported_versions)
# ['2024-01-01', '2023-10-15']
```

## Version Pinning

### Account-level Pinning

Pin your account to a specific version via the dashboard or API:

```bash
PUT /account/settings
{
  "api_version": "2023-10-15"
}
```

### Benefits of Pinning
- Predictable behavior
- Time to test updates
- Gradual migration
- No surprise changes

### Best Practices
1. Pin version in production
2. Test new versions in staging
3. Update SDKs before API version
4. Monitor deprecation warnings

## Backward Compatibility

We maintain backward compatibility by:

1. **Additive Changes Only**: New fields are optional
2. **Graceful Degradation**: Old clients ignore new fields
3. **Clear Documentation**: All changes documented
4. **Long Support Windows**: 12+ months for stable versions

Example of backward-compatible change:
```javascript
// Version 2023-10-15 response
{
  "id": "job_123",
  "status": "completed"
}

// Version 2024-01-01 response (backward compatible)
{
  "id": "job_123",
  "status": "completed",
  "metadata": {  // New optional field
    "duration": 1234,
    "cost": 0.05
  }
}
```

## Preview Versions

Try upcoming features with preview versions:

```bash
curl -X POST https://api.finishthisidea.com/jobs \
  -H "Authorization: Bearer your-api-key" \
  -H "X-API-Version: 2024-02-01-preview" \
  -H "Content-Type: application/json" \
  -d '{"service": "code-cleanup", "files": ["main.js"]}'
```

### Preview Version Warnings
- May change without notice
- Not for production use
- Limited support
- Feedback encouraged

## Version-specific Documentation

Access documentation for specific versions:

- Latest: https://docs.finishthisidea.com/api
- Specific: https://docs.finishthisidea.com/api/2023-10-15
- Changelog: https://docs.finishthisidea.com/api/changelog

## Deprecation Process

1. **Announcement**: 6 months before deprecation
2. **Warning Headers**: Added to all responses
3. **Migration Guide**: Published with examples
4. **Grace Period**: 6 months to migrate
5. **Sunset**: Version becomes unavailable

### Deprecation Warnings

```
X-API-Deprecation-Warning: Version 2023-10-15 is deprecated. Please migrate to 2024-01-01 by July 1, 2024. See https://docs.finishthisidea.com/migrate
```

## Support

- Migration help: migration@finishthisidea.com
- Version status: https://status.finishthisidea.com
- Changelog: https://docs.finishthisidea.com/changelog
- Discord: https://discord.gg/finishthisidea
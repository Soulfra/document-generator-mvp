# API Pagination

## Overview

FinishThisIdea API uses cursor-based pagination for endpoints that return lists of resources. This provides consistent performance regardless of dataset size.

## Pagination Parameters

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Number of items per page (max: 100) |
| `cursor` | string | null | Cursor for next page |
| `sort` | string | `-created` | Sort order (prefix with `-` for descending) |

### Response Format

```json
{
  "data": [
    {
      "id": "job_abc123",
      "status": "completed",
      "created": "2024-01-20T10:00:00Z"
    },
    {
      "id": "job_def456",
      "status": "processing",
      "created": "2024-01-20T09:30:00Z"
    }
  ],
  "pagination": {
    "cursor": "eyJjcmVhdGVkIjoiMjAyNC0wMS0yMFQwOTozMDowMFoiLCJpZCI6ImpvYl9kZWY0NTYifQ==",
    "hasMore": true,
    "total": 150
  }
}
```

## Using Pagination

### Basic Example

```bash
# First page
GET /api/jobs?limit=20

# Next page using cursor
GET /api/jobs?limit=20&cursor=eyJjcmVhdGVkIj...
```

### JavaScript Example

```javascript
async function getAllJobs() {
  const jobs = [];
  let cursor = null;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `/api/jobs?limit=50${cursor ? `&cursor=${cursor}` : ''}`
    );
    const data = await response.json();
    
    jobs.push(...data.data);
    cursor = data.pagination.cursor;
    hasMore = data.pagination.hasMore;
  }
  
  return jobs;
}
```

### SDK Usage

```javascript
// JavaScript SDK
const client = new FinishThisIdea({ apiKey: 'your-key' });

// Automatic pagination
for await (const job of client.jobs.list({ limit: 50 })) {
  console.log(job.id);
}

// Manual pagination
let page = await client.jobs.list({ limit: 20 });
while (page.hasMore) {
  for (const job of page.data) {
    console.log(job.id);
  }
  page = await page.next();
}
```

```python
# Python SDK
client = Client(api_key="your-key")

# Automatic pagination
for job in client.jobs.list(limit=50):
    print(job.id)

# Manual pagination
page = client.jobs.list(limit=20)
while page.has_more:
    for job in page.data:
        print(job.id)
    page = page.next()
```

## Sorting

### Available Sort Fields

Different resources support different sort fields:

#### Jobs
- `created` - Creation timestamp
- `updated` - Last update timestamp
- `status` - Job status
- `service` - Service type

#### Projects
- `created` - Creation timestamp
- `name` - Project name
- `updated` - Last update timestamp

### Sort Syntax

```bash
# Ascending order
GET /api/jobs?sort=created

# Descending order (prefix with -)
GET /api/jobs?sort=-created

# Multiple fields
GET /api/jobs?sort=-status,created
```

## Filtering

Many list endpoints support filtering:

```bash
# Filter by status
GET /api/jobs?status=completed

# Filter by date range
GET /api/jobs?created_after=2024-01-01&created_before=2024-01-31

# Filter by service
GET /api/jobs?service=code-cleanup

# Combine filters
GET /api/jobs?status=completed&service=test-generator&limit=50
```

## Best Practices

### 1. Use Appropriate Page Sizes

```javascript
// Good: Reasonable page size
const jobs = await client.jobs.list({ limit: 50 });

// Bad: Too large (will be capped at 100)
const jobs = await client.jobs.list({ limit: 1000 });

// Bad: Too small (many requests needed)
const jobs = await client.jobs.list({ limit: 1 });
```

### 2. Handle Pagination Errors

```javascript
async function robustPagination() {
  const allItems = [];
  let cursor = null;
  let retries = 0;
  const maxRetries = 3;
  
  while (true) {
    try {
      const response = await fetch(
        `/api/jobs?cursor=${cursor || ''}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      allItems.push(...data.data);
      
      if (!data.pagination.hasMore) {
        break;
      }
      
      cursor = data.pagination.cursor;
      retries = 0; // Reset on success
      
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      retries++;
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, retries) * 1000)
      );
    }
  }
  
  return allItems;
}
```

### 3. Stream Large Datasets

Instead of loading everything into memory:

```javascript
async function* streamJobs(filters = {}) {
  let cursor = null;
  let hasMore = true;
  
  while (hasMore) {
    const params = new URLSearchParams({
      limit: '50',
      ...filters,
      ...(cursor && { cursor })
    });
    
    const response = await fetch(`/api/jobs?${params}`);
    const data = await response.json();
    
    for (const job of data.data) {
      yield job;
    }
    
    cursor = data.pagination.cursor;
    hasMore = data.pagination.hasMore;
  }
}

// Usage
for await (const job of streamJobs({ status: 'completed' })) {
  await processJob(job);
}
```

### 4. Cache Cursors

For resumable operations:

```javascript
class ResumablePaginator {
  constructor(endpoint, cacheKey) {
    this.endpoint = endpoint;
    this.cacheKey = cacheKey;
    this.cursor = localStorage.getItem(cacheKey);
  }
  
  async *items() {
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(
        `${this.endpoint}?cursor=${this.cursor || ''}`
      );
      const data = await response.json();
      
      for (const item of data.data) {
        yield item;
      }
      
      this.cursor = data.pagination.cursor;
      hasMore = data.pagination.hasMore;
      
      // Save cursor for resume
      if (this.cursor) {
        localStorage.setItem(this.cacheKey, this.cursor);
      } else {
        localStorage.removeItem(this.cacheKey);
      }
    }
  }
  
  reset() {
    this.cursor = null;
    localStorage.removeItem(this.cacheKey);
  }
}
```

## Pagination Headers

For convenience, pagination info is also included in response headers:

```
X-Pagination-Cursor: eyJjcmVhdGVkIj...
X-Pagination-Has-More: true
X-Pagination-Total: 150
Link: </api/jobs?cursor=eyJjcmVhdGVkIj...>; rel="next"
```

## Performance Tips

1. **Use filters** to reduce dataset size
2. **Sort by indexed fields** for better performance
3. **Avoid counting total items** on large datasets
4. **Use streaming** for processing large result sets
5. **Implement caching** for frequently accessed pages

## Common Patterns

### Polling for Updates

```javascript
async function pollForUpdates(lastCursor) {
  const params = new URLSearchParams({
    limit: '20',
    sort: '-created'
  });
  
  if (lastCursor) {
    params.set('cursor', lastCursor);
  }
  
  const response = await fetch(`/api/jobs?${params}`);
  const data = await response.json();
  
  if (data.data.length > 0) {
    // Process new items
    for (const job of data.data) {
      handleNewJob(job);
    }
    
    // Return cursor for next poll
    return data.pagination.cursor;
  }
  
  return lastCursor;
}
```

### Infinite Scroll

```javascript
class InfiniteScroll {
  constructor(container, loadMore) {
    this.container = container;
    this.loadMore = loadMore;
    this.loading = false;
    this.cursor = null;
    this.hasMore = true;
    
    this.observe();
  }
  
  observe() {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !this.loading && this.hasMore) {
          this.loadNext();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(this.container.lastElementChild);
  }
  
  async loadNext() {
    this.loading = true;
    
    try {
      const { data, pagination } = await this.loadMore(this.cursor);
      
      this.cursor = pagination.cursor;
      this.hasMore = pagination.hasMore;
      
      // Append items to container
      data.forEach(item => this.appendItem(item));
      
    } finally {
      this.loading = false;
    }
  }
}
```

## Limitations

- Maximum page size: 100 items
- Cursor expiration: 24 hours
- Deep pagination: Limited to 10,000 items
  - Use filters to narrow results
  - Export data for larger datasets
- Sort combinations: Maximum 2 fields
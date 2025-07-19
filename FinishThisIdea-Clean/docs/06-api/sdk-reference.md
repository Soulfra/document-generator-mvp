# SDK Reference

## Overview

FinishThisIdea provides official SDKs for popular programming languages, making it easy to integrate our services into your applications.

## Available SDKs

- [JavaScript/TypeScript](#javascripttypescript)
- [Python](#python)
- [Go](#go)
- [Ruby](#ruby)
- [PHP](#php)
- [Java](#java)
- [.NET](#net)

## JavaScript/TypeScript

### Installation

```bash
npm install @finishthisidea/sdk
# or
yarn add @finishthisidea/sdk
# or
pnpm add @finishthisidea/sdk
```

### Quick Start

```typescript
import { FinishThisIdea } from '@finishthisidea/sdk';

const client = new FinishThisIdea({
  apiKey: process.env.FTI_API_KEY
});

// Create a job
const job = await client.jobs.create({
  service: 'code-cleanup',
  files: ['src/index.js', 'src/utils.js'],
  options: {
    removeComments: true,
    fixFormatting: true
  }
});

// Check job status
const status = await client.jobs.get(job.id);
console.log(status.status); // 'processing', 'completed', etc.

// Get results when complete
if (status.status === 'completed') {
  const results = await client.jobs.getResults(job.id);
  console.log(results.changes);
}
```

### Configuration

```typescript
const client = new FinishThisIdea({
  apiKey: 'your-api-key',
  // Optional configuration
  baseUrl: 'https://api.finishthisidea.com',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000,
  webhookSecret: 'your-webhook-secret'
});
```

### Services

```typescript
// Code Cleanup
const cleanup = await client.services.codeCleanup({
  files: ['messy.js'],
  options: {
    removeDeadCode: true,
    optimizeImports: true
  }
});

// Test Generation
const tests = await client.services.testGenerator({
  files: ['src/user.service.ts'],
  framework: 'jest',
  coverage: 'full'
});

// API Generation
const api = await client.services.apiGenerator({
  specification: 'openapi.yaml',
  language: 'typescript',
  framework: 'express'
});

// Documentation Generation
const docs = await client.services.documentationGenerator({
  repository: 'github.com/user/repo',
  format: 'markdown',
  includeExamples: true
});
```

### Async Iteration

```typescript
// List all jobs with automatic pagination
for await (const job of client.jobs.list()) {
  console.log(job.id, job.status);
}

// With filters
for await (const job of client.jobs.list({ 
  status: 'completed',
  service: 'test-generator' 
})) {
  console.log(job.id);
}
```

### Webhooks

```typescript
import { verifyWebhookSignature } from '@finishthisidea/sdk';

// Express example
app.post('/webhooks/finishthisidea', (req, res) => {
  const signature = req.headers['x-fti-signature'];
  const isValid = verifyWebhookSignature(
    req.body,
    signature,
    webhookSecret
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  const { event, data } = req.body;
  
  switch (event) {
    case 'job.completed':
      handleJobCompleted(data);
      break;
    case 'job.failed':
      handleJobFailed(data);
      break;
  }
  
  res.status(200).send('OK');
});
```

### Error Handling

```typescript
import { FinishThisIdea, FTIError } from '@finishthisidea/sdk';

try {
  const job = await client.jobs.create({
    service: 'code-cleanup',
    files: ['main.js']
  });
} catch (error) {
  if (error instanceof FTIError) {
    console.error(`API Error: ${error.code}`);
    console.error(`Message: ${error.message}`);
    
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      const retryAfter = error.details.retryAfter;
      console.log(`Retry after ${retryAfter} seconds`);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Python

### Installation

```bash
pip install finishthisidea
```

### Quick Start

```python
from finishthisidea import Client

client = Client(api_key="your-api-key")

# Create a job
job = client.jobs.create(
    service="code-cleanup",
    files=["src/main.py", "src/utils.py"],
    options={
        "remove_comments": True,
        "fix_formatting": True
    }
)

# Check status
status = client.jobs.get(job.id)
print(status.status)

# Get results
if status.status == "completed":
    results = client.jobs.get_results(job.id)
    for change in results.changes:
        print(f"{change.file}: {change.description}")
```

### Async Support

```python
import asyncio
from finishthisidea import AsyncClient

async def main():
    client = AsyncClient(api_key="your-api-key")
    
    # Create multiple jobs concurrently
    jobs = await asyncio.gather(
        client.jobs.create(service="test-generator", files=["user.py"]),
        client.jobs.create(service="doc-generator", files=["api.py"]),
        client.jobs.create(service="type-checker", files=["models.py"])
    )
    
    # Wait for all to complete
    for job in jobs:
        result = await client.jobs.wait_for_completion(job.id)
        print(f"Job {job.id} completed")

asyncio.run(main())
```

### Context Manager

```python
from finishthisidea import Client

# Automatic resource cleanup
with Client(api_key="your-api-key") as client:
    jobs = list(client.jobs.list(limit=10))
    for job in jobs:
        print(job.id)
```

## Go

### Installation

```bash
go get github.com/finishthisidea/go-sdk
```

### Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"
    
    "github.com/finishthisidea/go-sdk"
)

func main() {
    client := finishthisidea.NewClient("your-api-key")
    
    // Create a job
    job, err := client.Jobs.Create(context.Background(), &finishthisidea.CreateJobRequest{
        Service: "code-cleanup",
        Files:   []string{"main.go", "utils.go"},
        Options: map[string]interface{}{
            "removeComments": true,
            "fixFormatting":  true,
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Job created: %s\n", job.ID)
    
    // Wait for completion
    result, err := client.Jobs.WaitForCompletion(context.Background(), job.ID)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Job completed with %d changes\n", len(result.Changes))
}
```

### Error Handling

```go
job, err := client.Jobs.Create(ctx, request)
if err != nil {
    if apiErr, ok := err.(*finishthisidea.APIError); ok {
        switch apiErr.Code {
        case "RATE_LIMIT_EXCEEDED":
            time.Sleep(time.Duration(apiErr.RetryAfter) * time.Second)
            // Retry
        case "VALIDATION_ERROR":
            for _, e := range apiErr.Errors {
                fmt.Printf("Field %s: %s\n", e.Field, e.Message)
            }
        default:
            log.Printf("API error: %s\n", apiErr.Message)
        }
    } else {
        log.Printf("Network error: %v\n", err)
    }
}
```

## Ruby

### Installation

```ruby
gem install finishthisidea
```

### Quick Start

```ruby
require 'finishthisidea'

client = FinishThisIdea::Client.new(api_key: ENV['FTI_API_KEY'])

# Create a job
job = client.jobs.create(
  service: 'code-cleanup',
  files: ['app.rb', 'helper.rb'],
  options: {
    remove_comments: true,
    fix_formatting: true
  }
)

puts "Job created: #{job.id}"

# Check status
status = client.jobs.get(job.id)
puts "Status: #{status.status}"

# Get results when complete
if status.status == 'completed'
  results = client.jobs.get_results(job.id)
  results.changes.each do |change|
    puts "#{change.file}: #{change.description}"
  end
end
```

## PHP

### Installation

```bash
composer require finishthisidea/php-sdk
```

### Quick Start

```php
<?php
require_once 'vendor/autoload.php';

use FinishThisIdea\Client;

$client = new Client('your-api-key');

// Create a job
$job = $client->jobs->create([
    'service' => 'code-cleanup',
    'files' => ['index.php', 'utils.php'],
    'options' => [
        'removeComments' => true,
        'fixFormatting' => true
    ]
]);

echo "Job created: {$job->id}\n";

// Check status
$status = $client->jobs->get($job->id);
echo "Status: {$status->status}\n";

// Get results
if ($status->status === 'completed') {
    $results = $client->jobs->getResults($job->id);
    foreach ($results->changes as $change) {
        echo "{$change->file}: {$change->description}\n";
    }
}
```

## Java

### Installation

Maven:
```xml
<dependency>
    <groupId>com.finishthisidea</groupId>
    <artifactId>finishthisidea-java</artifactId>
    <version>1.0.0</version>
</dependency>
```

Gradle:
```gradle
implementation 'com.finishthisidea:finishthisidea-java:1.0.0'
```

### Quick Start

```java
import com.finishthisidea.Client;
import com.finishthisidea.models.Job;
import com.finishthisidea.models.CreateJobRequest;

public class Example {
    public static void main(String[] args) {
        Client client = new Client("your-api-key");
        
        // Create a job
        CreateJobRequest request = CreateJobRequest.builder()
            .service("code-cleanup")
            .files(Arrays.asList("Main.java", "Utils.java"))
            .option("removeComments", true)
            .option("fixFormatting", true)
            .build();
            
        Job job = client.jobs().create(request);
        System.out.println("Job created: " + job.getId());
        
        // Wait for completion
        Job completed = client.jobs().waitForCompletion(job.getId());
        
        // Get results
        JobResults results = client.jobs().getResults(completed.getId());
        results.getChanges().forEach(change -> {
            System.out.println(change.getFile() + ": " + change.getDescription());
        });
    }
}
```

## .NET

### Installation

```bash
dotnet add package FinishThisIdea
```

### Quick Start

```csharp
using FinishThisIdea;

var client = new FinishThisIdeaClient("your-api-key");

// Create a job
var job = await client.Jobs.CreateAsync(new CreateJobRequest
{
    Service = "code-cleanup",
    Files = new[] { "Program.cs", "Utils.cs" },
    Options = new Dictionary<string, object>
    {
        ["removeComments"] = true,
        ["fixFormatting"] = true
    }
});

Console.WriteLine($"Job created: {job.Id}");

// Check status
var status = await client.Jobs.GetAsync(job.Id);
Console.WriteLine($"Status: {status.Status}");

// Get results
if (status.Status == JobStatus.Completed)
{
    var results = await client.Jobs.GetResultsAsync(job.Id);
    foreach (var change in results.Changes)
    {
        Console.WriteLine($"{change.File}: {change.Description}");
    }
}
```

## Common Patterns

### Polling for Completion

All SDKs provide a convenience method for waiting:

```javascript
// JavaScript
const result = await client.jobs.waitForCompletion(jobId, {
  pollInterval: 2000, // 2 seconds
  timeout: 300000 // 5 minutes
});
```

```python
# Python
result = client.jobs.wait_for_completion(
    job_id,
    poll_interval=2,  # seconds
    timeout=300  # seconds
)
```

### Batch Processing

Process multiple files efficiently:

```javascript
// JavaScript
const files = ['file1.js', 'file2.js', 'file3.js'];
const batchSize = 10;

for (let i = 0; i < files.length; i += batchSize) {
  const batch = files.slice(i, i + batchSize);
  const job = await client.jobs.create({
    service: 'code-cleanup',
    files: batch
  });
  
  jobs.push(job);
}

// Wait for all jobs
const results = await Promise.all(
  jobs.map(job => client.jobs.waitForCompletion(job.id))
);
```

### Webhook Integration

All SDKs include webhook signature verification:

```python
# Python Flask example
from flask import Flask, request
from finishthisidea import verify_webhook

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-FTI-Signature')
    
    if not verify_webhook(request.data, signature, webhook_secret):
        return 'Invalid signature', 401
    
    data = request.json
    if data['event'] == 'job.completed':
        process_completed_job(data['data'])
    
    return 'OK', 200
```

## Support

- [API Documentation](/docs/06-api/api-reference.md)
- [GitHub Issues](https://github.com/finishthisidea/sdks)
- [Discord Community](https://discord.gg/finishthisidea)
- Email: sdk-support@finishthisidea.com
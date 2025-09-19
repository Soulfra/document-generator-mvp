# UTP Adapter Implementation Guide
*Step-by-step instructions for creating language adapters*

## 🎯 Overview

This guide walks you through implementing a UTP adapter for any programming language. Follow these steps to enable your language to participate in the Universal Test Protocol ecosystem.

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Read the [UTP Protocol Specification](./UTP-PROTOCOL-SPEC.md)
- [ ] Reviewed the [Adapter Template](./utp-orchestrator/ADAPTER-TEMPLATE.md)
- [ ] Set up the UTP orchestrator locally
- [ ] Chosen your implementation language
- [ ] Identified test frameworks to integrate with

## 🚀 Implementation Steps

### Step 1: Create Adapter Directory Structure

```bash
# Create your adapter directory
mkdir -p utp-orchestrator/adapters/{language}
cd utp-orchestrator/adapters/{language}

# Create standard structure
mkdir -p config examples tests/unit tests/integration bridge
touch README.md adapter.{ext} package.json Makefile
touch config/default.conf
touch examples/basic_test.{ext}
touch examples/integration_test.{ext}
touch examples/advanced_test.{ext}
```

### Step 2: Define Core Data Structures

#### 2.1 Message Structure
Every adapter needs to handle the UTP message format:

```javascript
// JavaScript example
class UTPMessage {
  constructor(type, payload) {
    this.version = "1.0.0";
    this.id = generateUUID();
    this.type = type;
    this.timestamp = Date.now();
    this.language = "javascript";
    this.character = config.character || "tester";
    this.payload = payload;
  }
}
```

```python
# Python example
from dataclasses import dataclass
from datetime import datetime
import uuid

@dataclass
class UTPMessage:
    type: str
    payload: dict
    version: str = "1.0.0"
    id: str = None
    timestamp: int = None
    language: str = "python"
    character: str = "tester"
    
    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())
        if not self.timestamp:
            self.timestamp = int(datetime.now().timestamp() * 1000)
```

```go
// Go example
type UTPMessage struct {
    Version   string                 `json:"version"`
    ID        string                 `json:"id"`
    Type      string                 `json:"type"`
    Timestamp int64                  `json:"timestamp"`
    Language  string                 `json:"language"`
    Character string                 `json:"character"`
    Payload   map[string]interface{} `json:"payload"`
}

func NewMessage(msgType string, payload map[string]interface{}) *UTPMessage {
    return &UTPMessage{
        Version:   "1.0.0",
        ID:        uuid.New().String(),
        Type:      msgType,
        Timestamp: time.Now().UnixMilli(),
        Language:  "go",
        Character: getCharacter(),
        Payload:   payload,
    }
}
```

### Step 3: Implement Configuration Loading

#### 3.1 Configuration File Format
```ini
# config/default.conf
orchestrator_url=http://localhost:3456
redis_host=localhost
redis_port=6379
character=tester
encoding=utf-8
```

#### 3.2 Configuration Loader
```python
# Python example
import configparser
import os

class Config:
    def __init__(self, config_path="config/default.conf"):
        self.config = configparser.ConfigParser()
        
        # Load defaults
        self.config['DEFAULT'] = {
            'orchestrator_url': 'http://localhost:3456',
            'redis_host': 'localhost',
            'redis_port': '6379',
            'character': 'tester',
            'encoding': 'utf-8'
        }
        
        # Load from file if exists
        if os.path.exists(config_path):
            self.config.read(config_path)
        
        # Override with environment variables
        for key in self.config['DEFAULT']:
            env_key = f'UTP_{key.upper()}'
            if env_key in os.environ:
                self.config['DEFAULT'][key] = os.environ[env_key]
```

### Step 4: Implement Core Functions

#### 4.1 UUID Generation
```rust
// Rust example
use uuid::Uuid;

fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}
```

#### 4.2 HTTP Communication
```java
// Java example
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class UTPClient {
    private final HttpClient httpClient;
    private final String orchestratorUrl;
    
    public void sendMessage(UTPMessage message) throws Exception {
        String json = objectMapper.writeValueAsString(message);
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(orchestratorUrl + "/test"))
            .header("Content-Type", "application/json")
            .header("X-Language", message.getLanguage())
            .header("X-Encoding", "utf-8")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
            
        HttpResponse<String> response = httpClient.send(
            request, 
            HttpResponse.BodyHandlers.ofString()
        );
        
        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed: " + response.statusCode());
        }
    }
}
```

### Step 5: Integrate with Test Framework

#### 5.1 JavaScript - Jest Integration
```javascript
// jest-utp-reporter.js
class UTPReporter {
  constructor(globalConfig, options) {
    this.utp = new UTPClient(options);
  }

  onTestStart(test) {
    this.utp.sendMessage({
      type: 'test.start',
      payload: {
        name: test.path,
        tier: this.getTier(test),
        suite: test.ancestorTitles.join(' > ')
      }
    });
  }

  onTestResult(test, testResult) {
    if (testResult.status === 'passed') {
      this.utp.sendMessage({
        type: 'test.complete',
        payload: {
          name: test.path,
          tier: this.getTier(test),
          passed: true,
          duration: testResult.duration,
          assertions: testResult.numPassingAsserts
        }
      });
    }
  }
}
```

#### 5.2 Python - pytest Integration
```python
# pytest_utp.py
import pytest
from utp_client import UTPClient

class UTPPlugin:
    def __init__(self):
        self.client = UTPClient()
    
    @pytest.hookimpl
    def pytest_runtest_setup(self, item):
        self.client.send_message({
            'type': 'test.start',
            'payload': {
                'name': item.nodeid,
                'tier': self._get_tier(item),
                'tags': [m.name for m in item.iter_markers()]
            }
        })
    
    @pytest.hookimpl
    def pytest_runtest_makereport(self, item, call):
        if call.when == 'call':
            outcome = 'passed' if call.excinfo is None else 'failed'
            message_type = 'test.complete' if outcome == 'passed' else 'test.failed'
            
            self.client.send_message({
                'type': message_type,
                'payload': {
                    'name': item.nodeid,
                    'tier': self._get_tier(item),
                    'passed': outcome == 'passed',
                    'duration': call.duration * 1000
                }
            })
```

### Step 6: Handle Character Bonuses

```csharp
// C# example
public enum Character {
    Builder,   // 1.1x bonus
    Tester,    // 1.2x bonus
    Gamer,     // 1.3x bonus
    Auditor    // 1.5x bonus
}

public class RewardCalculator {
    private static readonly Dictionary<Character, double> Bonuses = new() {
        { Character.Builder, 1.1 },
        { Character.Tester, 1.2 },
        { Character.Gamer, 1.3 },
        { Character.Auditor, 1.5 }
    };
    
    private static readonly Dictionary<int, int> TierRewards = new() {
        { 1, 100 },
        { 2, 500 },
        { 3, 1000 },
        { 4, 5000 }
    };
    
    public int CalculateReward(int tier, Character character) {
        var baseReward = TierRewards.GetValueOrDefault(tier, 0);
        var bonus = Bonuses.GetValueOrDefault(character, 1.0);
        return (int)(baseReward * bonus);
    }
}
```

### Step 7: Implement Error Handling

```ruby
# Ruby example
class UTPAdapter
  class Error < StandardError; end
  class ConnectionError < Error; end
  class ValidationError < Error; end
  
  def send_message(message)
    validate_message!(message)
    
    begin
      response = http_client.post(
        "#{@orchestrator_url}/test",
        message.to_json,
        headers
      )
      
      unless response.success?
        raise ConnectionError, "HTTP #{response.code}: #{response.body}"
      end
      
      JSON.parse(response.body)
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      raise ConnectionError, "Timeout: #{e.message}"
    rescue JSON::ParserError => e
      raise Error, "Invalid response: #{e.message}"
    end
  end
  
  private
  
  def validate_message!(message)
    required = %w[version id type timestamp language payload]
    missing = required - message.keys.map(&:to_s)
    
    unless missing.empty?
      raise ValidationError, "Missing fields: #{missing.join(', ')}"
    end
    
    unless message[:version] =~ /^\d+\.\d+\.\d+$/
      raise ValidationError, "Invalid version format"
    end
  end
end
```

### Step 8: Add Encoding Support

```php
// PHP example
class EncodingHandler {
    private $supportedEncodings = [
        'UTF-8', 'ASCII', 'ISO-8859-1', 'Windows-1252'
    ];
    
    public function encode($data, $targetEncoding = 'UTF-8') {
        $json = json_encode($data, JSON_UNESCAPED_UNICODE);
        
        if ($targetEncoding !== 'UTF-8') {
            $json = mb_convert_encoding($json, $targetEncoding, 'UTF-8');
        }
        
        return $json;
    }
    
    public function decode($data, $sourceEncoding = 'UTF-8') {
        if ($sourceEncoding !== 'UTF-8') {
            $data = mb_convert_encoding($data, 'UTF-8', $sourceEncoding);
        }
        
        return json_decode($data, true);
    }
}
```

### Step 9: Create Examples

#### 9.1 Basic Example
```kotlin
// examples/basic_test.kt
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe

class BasicUTPTest : StringSpec({
    val utp = UTPAdapter()
    
    "simple addition test" {
        utp.startTest("addition", tier = 1)
        
        val result = 2 + 2
        result shouldBe 4
        
        utp.endTest(passed = true)
    }
    
    "string concatenation test" {
        utp.startTest("concatenation", tier = 1)
        
        val result = "Hello, " + "UTP!"
        result shouldBe "Hello, UTP!"
        
        utp.endTest(passed = true)
    }
})
```

#### 9.2 Integration Example
```swift
// examples/integration_test.swift
import XCTest
@testable import UTPAdapter

class IntegrationTests: XCTestCase {
    let utp = UTPClient(character: .gamer)
    
    func testDatabaseIntegration() async throws {
        await utp.startTest(name: "db_integration", tier: 2)
        
        // Your database test
        let db = try await Database.connect()
        let users = try await db.users.count()
        
        XCTAssertGreaterThan(users, 0)
        
        await utp.endTest(passed: true, assertions: 1)
    }
}
```

### Step 10: Write Tests for Your Adapter

#### 10.1 Unit Tests
```typescript
// tests/unit/message.test.ts
describe('UTPMessage', () => {
  it('should create valid message structure', () => {
    const message = new UTPMessage('test.start', {
      name: 'example',
      tier: 1
    });
    
    expect(message.version).toBe('1.0.0');
    expect(message.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(message.type).toBe('test.start');
    expect(message.timestamp).toBeCloseTo(Date.now(), -2);
    expect(message.language).toBe('typescript');
  });
  
  it('should validate message fields', () => {
    expect(() => new UTPMessage('', {})).toThrow('Invalid message type');
    expect(() => new UTPMessage('test.invalid', {})).toThrow('Unknown message type');
  });
});
```

#### 10.2 Integration Tests
```elixir
# tests/integration/orchestrator_test.exs
defmodule UTP.OrchestratorTest do
  use ExUnit.Case
  
  @orchestrator_url "http://localhost:3456"
  
  test "connects to orchestrator" do
    client = UTP.Client.new(@orchestrator_url)
    
    assert {:ok, response} = UTP.Client.connect(client)
    assert response["status"] == "connected"
  end
  
  test "sends test messages" do
    client = UTP.Client.new(@orchestrator_url)
    
    message = %UTP.Message{
      type: "test.complete",
      payload: %{
        name: "integration_test",
        tier: 2,
        passed: true,
        duration: 150
      }
    }
    
    assert {:ok, _} = UTP.Client.send_message(client, message)
  end
end
```

### Step 11: Handle Legacy Language Considerations

#### For Compiled Languages
```makefile
# Makefile example
CC = gcc
CFLAGS = -Wall -O2
LIBS = -lcurl -ljson-c

utp-adapter: adapter.c
	$(CC) $(CFLAGS) -o $@ $< $(LIBS)

test: utp-adapter
	./run-tests.sh

clean:
	rm -f utp-adapter *.o

install: utp-adapter
	cp utp-adapter /usr/local/bin/
```

#### For Languages Without Native HTTP
```javascript
// bridge/http-bridge.js for legacy languages
const express = require('express');
const fs = require('fs');

const app = express();

// File-based communication for languages without HTTP
app.post('/file-bridge', (req, res) => {
  const inputFile = req.body.inputFile;
  const outputFile = req.body.outputFile;
  
  // Read message from file
  const message = fs.readFileSync(inputFile, 'utf8');
  
  // Forward to orchestrator
  forwardToOrchestrator(message)
    .then(response => {
      fs.writeFileSync(outputFile, JSON.stringify(response));
      res.json({ success: true });
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});
```

### Step 12: Create Documentation

Your adapter README should include:
1. **Installation instructions** for all major OS
2. **Configuration options** with examples
3. **Integration examples** with popular test frameworks
4. **Troubleshooting guide** for common issues
5. **Performance tips** specific to the language
6. **Contributing guidelines**

### Step 13: Test Protocol Compliance

```bash
# Run the compliance test suite
cd utp-orchestrator
npm run test:adapter -- --language {your-language}

# This will verify:
# ✓ Message format compliance
# ✓ All required message types
# ✓ Proper encoding handling
# ✓ Error recovery
# ✓ Performance benchmarks
```

### Step 14: Package and Distribute

#### Package Manager Integration
```json
// For npm (JavaScript/TypeScript)
{
  "name": "@utp/adapter-{language}",
  "version": "1.0.0",
  "main": "dist/index.js",
  "bin": {
    "utp-{language}": "./bin/utp-adapter.js"
  }
}
```

```toml
# For Cargo (Rust)
[package]
name = "utp-adapter"
version = "1.0.0"

[dependencies]
reqwest = "0.11"
serde = { version = "1.0", features = ["derive"] }
uuid = { version = "1.0", features = ["v4"] }
```

```xml
<!-- For Maven (Java) -->
<dependency>
    <groupId>io.utp</groupId>
    <artifactId>utp-adapter-java</artifactId>
    <version>1.0.0</version>
</dependency>
```

## 🎯 Implementation Checklist

Before considering your adapter complete:

- [ ] **Core Protocol**
  - [ ] All message types implemented
  - [ ] UUID generation working
  - [ ] Timestamp in milliseconds
  - [ ] Proper JSON serialization

- [ ] **Configuration**
  - [ ] Config file loading
  - [ ] Environment variable overrides
  - [ ] Default values set

- [ ] **Communication**
  - [ ] HTTP POST to orchestrator
  - [ ] Proper headers set
  - [ ] Error handling for network issues
  - [ ] Retry logic implemented

- [ ] **Test Framework Integration**
  - [ ] Hook into test lifecycle
  - [ ] Extract test metadata
  - [ ] Calculate test duration
  - [ ] Handle pass/fail states

- [ ] **Character System**
  - [ ] Character selection from config
  - [ ] Bonus calculations correct
  - [ ] All 4 characters supported

- [ ] **Encoding**
  - [ ] UTF-8 support minimum
  - [ ] Language-specific encodings
  - [ ] Proper conversion handling

- [ ] **Documentation**
  - [ ] README complete
  - [ ] Examples provided
  - [ ] Troubleshooting guide
  - [ ] API reference

- [ ] **Testing**
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Compliance tests pass
  - [ ] Performance acceptable

## 🚀 Advanced Features

### Redis Direct Integration
For better performance, implement direct Redis pub/sub:

```python
import redis
import json

class RedisUTPClient:
    def __init__(self):
        self.redis = redis.Redis(
            host=config.redis_host,
            port=config.redis_port,
            decode_responses=True
        )
        self.pubsub = self.redis.pubsub()
    
    def publish_message(self, message):
        channel = f"utp:{message['type'].split('.')[0]}"
        self.redis.publish(channel, json.dumps(message))
    
    def subscribe_to_events(self, callback):
        self.pubsub.subscribe('utp:events')
        
        for message in self.pubsub.listen():
            if message['type'] == 'message':
                callback(json.loads(message['data']))
```

### Batch Message Processing
For high-volume testing:

```go
type BatchProcessor struct {
    messages []UTPMessage
    mutex    sync.Mutex
    ticker   *time.Ticker
}

func (b *BatchProcessor) Add(message UTPMessage) {
    b.mutex.Lock()
    defer b.mutex.Unlock()
    b.messages = append(b.messages, message)
}

func (b *BatchProcessor) Start() {
    b.ticker = time.NewTicker(100 * time.Millisecond)
    
    go func() {
        for range b.ticker.C {
            b.flush()
        }
    }()
}

func (b *BatchProcessor) flush() {
    b.mutex.Lock()
    defer b.mutex.Unlock()
    
    if len(b.messages) > 0 {
        b.sendBatch(b.messages)
        b.messages = nil
    }
}
```

## 📚 Resources

- [UTP Protocol Spec](./UTP-PROTOCOL-SPEC.md) - Message format reference
- [Adapter Template](./utp-orchestrator/ADAPTER-TEMPLATE.md) - Standard structure
- [Example Adapters](./utp-orchestrator/adapters/) - Reference implementations
- [Testing Guide](./UTP-TESTING-GUIDE.md) - How to test your adapter
- [Discord Community](DATABASE-SCHEMA-NEURAL-OUTPUTS.md) - Get help and share adapters

## 🎉 Success Criteria

Your adapter is ready when:
1. It passes all compliance tests
2. It integrates seamlessly with the language's test ecosystem
3. It handles errors gracefully
4. It performs well under load
5. Other developers can easily use it

---

*Follow this guide to bring UTP support to any programming language. Happy testing and earning those FART tokens!*
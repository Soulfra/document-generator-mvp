# UTP Testing Guide
*Comprehensive guide for testing the Universal Test Protocol system*

## 🎯 Testing Philosophy

The Universal Test Protocol is a distributed, multi-language system where testing must verify:
1. **Protocol Compliance**: Messages follow the specification
2. **Cross-Language Communication**: All adapters can exchange data
3. **Blockchain Integration**: Rewards are distributed correctly
4. **Performance**: System handles load without degradation
5. **Reliability**: Error recovery and fault tolerance work

## 📋 Test Categories

### 1. Unit Tests
Test individual components in isolation:
- Message parsing and validation
- Encoding/decoding functions
- UUID generation
- Configuration loading
- Character bonus calculations

### 2. Integration Tests
Test interaction between components:
- Adapter ↔ Orchestrator communication
- Redis pub/sub messaging
- Blockchain contract calls
- HTTP API endpoints
- File I/O operations

### 3. End-to-End Tests
Test complete user workflows:
- Run test → Earn tokens
- Cross-language message exchange
- Achievement unlocking
- Multi-tier reward calculation

### 4. Protocol Compliance Tests
Verify adherence to UTP specification:
- Message format validation
- Required field presence
- Type checking
- Version compatibility

### 5. Performance Tests
Verify system performance:
- Message throughput
- Latency measurements
- Memory usage
- Concurrent adapter handling

## 🚀 Quick Start Testing

### Prerequisites
```bash
# Verify environment is ready
./scripts/verify-setup.sh

# Start required services
redis-server &
npm start &
```

### Run All Tests
```bash
# Full test suite
npm test

# Specific categories
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
```

### Run Specific Language Tests
```bash
# Test Java adapter
cd adapters/java
mvn test

# Test Python adapter
cd adapters/python
pytest

# Test COBOL adapter
cd adapters/cobol
./test-cobol-adapter.sh
```

## 🧪 Unit Test Examples

### JavaScript Adapter Tests
```javascript
// test/unit/message.test.js
const { UTPMessage } = require('../../src/utp-client');

describe('UTPMessage', () => {
  test('creates valid message structure', () => {
    const message = new UTPMessage('test.start', {
      name: 'example',
      tier: 1
    });
    
    expect(message.version).toBe('1.0.0');
    expect(message.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(message.type).toBe('test.start');
    expect(message.timestamp).toBeCloseTo(Date.now(), -2);
    expect(message.language).toBe('javascript');
  });
  
  test('validates required fields', () => {
    expect(() => new UTPMessage('', {}))
      .toThrow('Message type cannot be empty');
    
    expect(() => new UTPMessage('invalid.type', {}))
      .toThrow('Invalid message type');
  });
  
  test('calculates character bonuses correctly', () => {
    const calculator = new RewardCalculator();
    
    expect(calculator.calculate(1, 'builder')).toBe(110);  // 100 * 1.1
    expect(calculator.calculate(2, 'tester')).toBe(600);   // 500 * 1.2
    expect(calculator.calculate(3, 'gamer')).toBe(1300);   // 1000 * 1.3
    expect(calculator.calculate(4, 'auditor')).toBe(7500); // 5000 * 1.5
  });
});
```

### Python Adapter Tests
```python
# test/unit/test_message.py
import pytest
from src.utp_client import UTPMessage, Character

def test_message_creation():
    message = UTPMessage('test.complete', {
        'name': 'example',
        'tier': 2,
        'passed': True
    })
    
    assert message.version == '1.0.0'
    assert len(message.id) == 36
    assert message.type == 'test.complete'
    assert message.language == 'python'
    assert isinstance(message.timestamp, int)

def test_character_bonuses():
    assert Character.BUILDER.bonus == 1.1
    assert Character.TESTER.bonus == 1.2
    assert Character.GAMER.bonus == 1.3
    assert Character.AUDITOR.bonus == 1.5

def test_reward_calculation():
    calc = RewardCalculator()
    
    assert calc.calculate_reward(1, Character.BUILDER) == 110
    assert calc.calculate_reward(2, Character.TESTER) == 600
    assert calc.calculate_reward(3, Character.GAMER) == 1300
    assert calc.calculate_reward(4, Character.AUDITOR) == 7500
```

### Java Adapter Tests
```java
// test/java/UTPMessageTest.java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class UTPMessageTest {
    @Test
    void testMessageCreation() {
        Map<String, Object> payload = Map.of(
            "name", "example",
            "tier", 1
        );
        
        UTPMessage message = UTPMessage.builder()
            .type("test.start")
            .payload(payload)
            .build();
        
        assertEquals("1.0.0", message.getVersion());
        assertNotNull(message.getId());
        assertEquals("test.start", message.getType());
        assertEquals("java", message.getLanguage());
        assertTrue(message.getTimestamp() > 0);
    }
    
    @Test
    void testCharacterBonuses() {
        assertEquals(1.1, Character.BUILDER.getBonus(), 0.01);
        assertEquals(1.2, Character.TESTER.getBonus(), 0.01);
        assertEquals(1.3, Character.GAMER.getBonus(), 0.01);
        assertEquals(1.5, Character.AUDITOR.getBonus(), 0.01);
    }
}
```

## 🔗 Integration Test Examples

### Orchestrator Communication Test
```javascript
// test/integration/orchestrator.test.js
const request = require('supertest');
const { createTestOrchestrator } = require('../helpers/test-setup');

describe('Orchestrator API', () => {
  let orchestrator;
  
  beforeAll(async () => {
    orchestrator = await createTestOrchestrator();
  });
  
  afterAll(async () => {
    await orchestrator.stop();
  });
  
  test('accepts valid UTP messages', async () => {
    const message = {
      version: '1.0.0',
      id: 'test-id-123',
      type: 'test.complete',
      timestamp: Date.now(),
      language: 'javascript',
      character: 'tester',
      payload: {
        name: 'integration-test',
        tier: 1,
        passed: true,
        duration: 150
      }
    };
    
    const response = await request(orchestrator.app)
      .post('/test')
      .send(message)
      .expect(200);
    
    expect(response.body.status).toBe('received');
    expect(response.body.rewardEarned).toBe(120); // 100 * 1.2 tester bonus
  });
  
  test('rejects invalid messages', async () => {
    const invalidMessage = {
      type: 'test.complete',
      // Missing required fields
    };
    
    await request(orchestrator.app)
      .post('/test')
      .send(invalidMessage)
      .expect(400);
  });
});
```

### Redis Communication Test
```javascript
// test/integration/redis.test.js
const Redis = require('redis');
const { UTPClient } = require('../../src/utp-client');

describe('Redis Integration', () => {
  let redis, client;
  
  beforeAll(async () => {
    redis = Redis.createClient();
    await redis.connect();
    client = new UTPClient({ character: 'tester' });
  });
  
  afterAll(async () => {
    await redis.disconnect();
    client.disconnect();
  });
  
  test('publishes messages to Redis', async () => {
    const messageReceived = new Promise((resolve) => {
      redis.subscribe('utp:events', (message) => {
        const data = JSON.parse(message);
        if (data.id === 'test-redis-123') {
          resolve(data);
        }
      });
    });
    
    await client.sendMessage({
      id: 'test-redis-123',
      type: 'test.start',
      payload: { name: 'redis-test', tier: 1 }
    });
    
    const received = await messageReceived;
    expect(received.type).toBe('test.start');
    expect(received.language).toBe('javascript');
  });
});
```

## 🌐 Cross-Language Integration Tests

### Multi-Language Message Exchange
```bash
#!/bin/bash
# test/integration/cross-language-test.sh

echo "🌐 Cross-Language Integration Test"

# Start orchestrator in background
npm start &
ORCHESTRATOR_PID=$!

# Wait for orchestrator to start
sleep 2

# Test 1: JavaScript → Python communication
echo "Test 1: JavaScript sends, Python receives"
cd adapters/javascript
node examples/send-message.js "js-to-python-test" &
JS_PID=$!

cd ../python
timeout 5 python examples/listen-for-messages.py | grep "js-to-python-test" || {
  echo "❌ Python did not receive JavaScript message"
  exit 1
}

# Test 2: Java → COBOL communication
echo "Test 2: Java sends, COBOL receives"
cd ../java
java -cp ".:lib/*" examples.SendMessage "java-to-cobol-test" &

cd ../cobol
timeout 5 ./listen-for-messages | grep "java-to-cobol-test" || {
  echo "❌ COBOL did not receive Java message"
  exit 1
}

echo "✅ All cross-language tests passed!"

# Cleanup
kill $ORCHESTRATOR_PID $JS_PID 2>/dev/null
```

### Achievement Synchronization Test
```python
# test/integration/test_achievements.py
import asyncio
import json
from src.utp_client import UTPClient

async def test_achievement_sync():
    """Test that achievements in one language are visible in others"""
    
    # Create clients for different languages
    js_client = UTPClient(language='javascript', character='gamer')
    py_client = UTPClient(language='python', character='auditor')
    
    # JavaScript client unlocks achievement
    achievement_id = 'first-tier-4-test'
    await js_client.unlock_achievement(achievement_id, {
        'name': 'Master Tester',
        'description': 'Completed first Tier 4 test',
        'rarity': 'epic'
    })
    
    # Wait for propagation
    await asyncio.sleep(1)
    
    # Python client should see the achievement
    achievements = await py_client.get_achievements()
    
    assert any(a['id'] == achievement_id for a in achievements)
    print("✅ Achievement visible across languages")

if __name__ == "__main__":
    asyncio.run(test_achievement_sync())
```

## 🔍 Protocol Compliance Tests

### Message Format Validation
```javascript
// test/compliance/message-format.test.js
const { validateMessage } = require('../../src/validators');

describe('Protocol Compliance - Message Format', () => {
  test('validates UTP v1.0 message structure', () => {
    const validMessage = {
      version: '1.0.0',
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.complete',
      timestamp: 1693526400000,
      language: 'javascript',
      character: 'tester',
      payload: {
        name: 'compliance-test',
        tier: 1,
        passed: true,
        duration: 100
      }
    };
    
    expect(validateMessage(validMessage)).toEqual({ valid: true });
  });
  
  test('rejects messages with missing required fields', () => {
    const invalidMessage = {
      version: '1.0.0',
      // Missing id, type, timestamp, etc.
    };
    
    const result = validateMessage(invalidMessage);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: id');
  });
  
  test('validates timestamp constraints', () => {
    const futureMessage = {
      version: '1.0.0',
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'test.complete',
      timestamp: Date.now() + 600000, // 10 minutes in future
      language: 'javascript',
      character: 'tester',
      payload: {}
    };
    
    const result = validateMessage(futureMessage);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Timestamp too far in future');
  });
});
```

### Character Validation Test
```python
# test/compliance/test_characters.py
from src.validators import validate_character

def test_valid_characters():
    valid_characters = ['builder', 'tester', 'gamer', 'auditor']
    
    for char in valid_characters:
        assert validate_character(char) == True
        
def test_invalid_characters():
    invalid_characters = ['developer', 'admin', 'user', '']
    
    for char in invalid_characters:
        assert validate_character(char) == False
```

## 📊 Performance Tests

### Message Throughput Test
```javascript
// test/performance/throughput.test.js
const { UTPClient } = require('../../src/utp-client');
const { performance } = require('perf_hooks');

describe('Performance Tests', () => {
  test('handles 1000 messages per second', async () => {
    const client = new UTPClient();
    const messageCount = 1000;
    const messages = [];
    
    // Generate test messages
    for (let i = 0; i < messageCount; i++) {
      messages.push({
        type: 'test.complete',
        payload: {
          name: `perf-test-${i}`,
          tier: 1,
          passed: true,
          duration: Math.random() * 100
        }
      });
    }
    
    // Send all messages and measure time
    const startTime = performance.now();
    
    await Promise.all(messages.map(msg => client.sendMessage(msg)));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    const messagesPerSecond = (messageCount / duration) * 1000;
    
    console.log(`Throughput: ${messagesPerSecond.toFixed(2)} messages/second`);
    expect(messagesPerSecond).toBeGreaterThan(1000);
  }, 30000); // 30 second timeout
  
  test('memory usage stays under 100MB', async () => {
    const client = new UTPClient();
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Send 10,000 messages
    for (let i = 0; i < 10000; i++) {
      await client.sendMessage({
        type: 'test.start',
        payload: { name: `memory-test-${i}`, tier: 1 }
      });
      
      // Measure memory every 1000 messages
      if (i % 1000 === 0) {
        const currentMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = currentMemory - initialMemory;
        const memoryInMB = memoryIncrease / 1024 / 1024;
        
        expect(memoryInMB).toBeLessThan(100);
        console.log(`Memory usage at ${i} messages: ${memoryInMB.toFixed(2)} MB`);
      }
    }
  });
});
```

### Latency Measurement
```bash
#!/bin/bash
# test/performance/latency-test.sh

echo "🚀 UTP Latency Performance Test"

# Start orchestrator
npm start &
ORCHESTRATOR_PID=$!
sleep 2

# Test latency with different adapters
languages=("javascript" "python" "java")
results=()

for lang in "${languages[@]}"; do
  echo "Testing $lang adapter latency..."
  
  cd "adapters/$lang"
  
  # Run 100 test messages and measure average latency
  start_time=$(date +%s%N)
  
  for i in {1..100}; do
    ./send-test-message.sh "latency-test-$i" >/dev/null 2>&1
  done
  
  end_time=$(date +%s%N)
  total_time=$((($end_time - $start_time) / 1000000)) # Convert to milliseconds
  avg_latency=$((total_time / 100))
  
  results+=("$lang: ${avg_latency}ms")
  echo "Average latency for $lang: ${avg_latency}ms"
  
  cd ../..
done

echo
echo "📊 Latency Results:"
for result in "${results[@]}"; do
  echo "  $result"
done

kill $ORCHESTRATOR_PID
```

## 🛠️ Test Infrastructure

### Test Helpers
```javascript
// test/helpers/test-setup.js
const Redis = require('redis');
const { UTPOrchestrator } = require('../../src/orchestrator');

class TestEnvironment {
  constructor() {
    this.redis = null;
    this.orchestrator = null;
    this.cleanup = [];
  }
  
  async setup() {
    // Start Redis for testing
    this.redis = Redis.createClient({ url: 'redis://localhost:6379' });
    await this.redis.connect();
    
    // Clear test data
    await this.redis.flushAll();
    
    // Start orchestrator
    this.orchestrator = new UTPOrchestrator({ port: 0 }); // Random port
    await this.orchestrator.start();
    
    return this;
  }
  
  async teardown() {
    // Run cleanup functions
    for (const cleanup of this.cleanup) {
      await cleanup();
    }
    
    // Stop services
    if (this.orchestrator) {
      await this.orchestrator.stop();
    }
    
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
  
  addCleanup(fn) {
    this.cleanup.push(fn);
  }
}

module.exports = { TestEnvironment };
```

### Mock Blockchain for Testing
```javascript
// test/helpers/mock-blockchain.js
class MockBlockchain {
  constructor() {
    this.balances = new Map();
    this.transactions = [];
    this.events = [];
  }
  
  async mint(address, amount) {
    const currentBalance = this.balances.get(address) || 0;
    this.balances.set(address, currentBalance + amount);
    
    const tx = {
      id: `tx-${Date.now()}`,
      type: 'mint',
      address,
      amount,
      timestamp: Date.now()
    };
    
    this.transactions.push(tx);
    this.events.push({
      type: 'Transfer',
      from: '0x0000000000000000000000000000000000000000',
      to: address,
      value: amount
    });
    
    return tx;
  }
  
  async balanceOf(address) {
    return this.balances.get(address) || 0;
  }
  
  async getTransactions(address) {
    return this.transactions.filter(tx => tx.address === address);
  }
}

module.exports = { MockBlockchain };
```

## 📈 Continuous Testing

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: UTP Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
        test-type: [unit, integration, e2e]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Verify setup
      run: ./scripts/verify-setup.sh
    
    - name: Run ${{ matrix.test-type }} tests
      run: npm run test:${{ matrix.test-type }}
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results-${{ matrix.node-version }}-${{ matrix.test-type }}
        path: test-results/
```

### Pre-commit Hooks
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🧪 Running UTP pre-commit tests..."

# Run quick verification
./scripts/verify-setup.sh || {
  echo "❌ Setup verification failed"
  exit 1
}

# Run unit tests
npm run test:unit || {
  echo "❌ Unit tests failed"
  exit 1
}

# Run linting
npm run lint || {
  echo "❌ Linting failed"
  exit 1
}

echo "✅ Pre-commit tests passed"
```

## 🎯 Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up after tests
- Use fresh test data
- Reset state between tests

### 2. Realistic Test Data
- Use representative message sizes
- Test edge cases (empty, large, malformed)
- Include various languages and characters
- Test different network conditions

### 3. Error Testing
- Test all error paths
- Verify error messages are helpful
- Test recovery mechanisms
- Check graceful degradation

### 4. Performance Monitoring
- Set performance baselines
- Monitor for regressions
- Test under load
- Profile memory usage

### 5. Documentation
- Document test scenarios
- Explain complex test logic
- Keep test names descriptive
- Update tests with code changes

## 🔧 Debugging Tests

### Test Debugging Tools
```bash
# Run tests with debug output
DEBUG=utp:* npm test

# Run specific test file
npm test -- --testPathPattern=message.test.js

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Common Test Issues
1. **Flaky tests**: Use proper async/await, increase timeouts
2. **Resource leaks**: Always clean up connections and processes
3. **Race conditions**: Use proper synchronization
4. **Environment differences**: Use containers for consistency

---

*"Good tests are the foundation of a reliable distributed system. Test early, test often, test everywhere."*
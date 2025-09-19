# UTP Testing Strategy
*How to Test the Universal Test Protocol System*

## 🎯 Testing Philosophy

### Meta-Testing Principles
"Testing a test system requires thinking in layers - we must test the testers that test the tests."

1. **Protocol Compliance**: Verify message format adherence
2. **Cross-Language Verification**: Ensure all adapters speak same language
3. **Blockchain Integrity**: Validate reward distribution
4. **Performance Standards**: Meet latency requirements
5. **Failure Resilience**: System degrades gracefully

## 🧪 Test Categories

### 1. Unit Tests (Per Adapter)
Test individual components in isolation

#### JavaScript Adapter Tests
```javascript
// test/unit/message.test.js
describe('Message Creation', () => {
  test('creates valid UTP message', () => {
    const msg = createMessage('test.start', { name: 'test1', tier: 1 });
    expect(msg).toHaveProperty('id');
    expect(msg).toHaveProperty('version', '1.0.0');
    expect(msg.timestamp).toBeCloseTo(Date.now(), -2);
  });

  test('validates message format', () => {
    const invalid = { type: 'test.start' }; // missing required fields
    expect(() => validateMessage(invalid)).toThrow();
  });
});

// test/unit/rewards.test.js
describe('Reward Calculation', () => {
  test('calculates correct FART rewards', () => {
    expect(calculateReward(1)).toBe(100);
    expect(calculateReward(2)).toBe(500);
    expect(calculateReward(3)).toBe(1000);
    expect(calculateReward(4)).toBe(5000);
  });

  test('applies character bonuses', () => {
    expect(applyCharacterBonus(100, 'auditor')).toBe(150); // 1.5x
    expect(applyCharacterBonus(100, 'builder')).toBe(110); // 1.1x
  });
});
```

#### Python Adapter Tests
```python
# tests/unit/test_message.py
import pytest
from utp.messages import UTPMessage, validate_message

def test_message_creation():
    msg = UTPMessage(
        type='test.start',
        language='python',
        payload={'name': 'test1', 'tier': 1}
    )
    assert msg.id is not None
    assert msg.version == '1.0.0'
    assert abs(msg.timestamp - int(time.time() * 1000)) < 1000

def test_message_validation():
    invalid = {'type': 'test.start'}  # missing fields
    with pytest.raises(ValidationError):
        validate_message(invalid)

# tests/unit/test_async_operations.py
@pytest.mark.asyncio
async def test_redis_connection():
    client = UTPClient()
    await client.connect()
    assert client.redis is not None
    await client.disconnect()
```

### 2. Integration Tests (Cross-Language)

#### Message Exchange Test
```javascript
// test/integration/cross-language.test.js
describe('Cross-Language Communication', () => {
  let jsClient, pyClient;

  beforeAll(async () => {
    jsClient = new UTPClient({ language: 'javascript' });
    await jsClient.connect();
    
    // Python client started via subprocess
    pyClient = spawn('python', ['test_client.py']);
  });

  test('JavaScript receives Python messages', (done) => {
    jsClient.on('peer-update', (msg) => {
      if (msg.language === 'python') {
        expect(msg.type).toBe('test.complete');
        done();
      }
    });

    // Trigger Python test
    pyClient.stdin.write('run_test\n');
  });

  test('Reward synchronization', async () => {
    const initialBalance = await jsClient.getFartBalance();
    
    // Both clients run tests
    await Promise.all([
      jsClient.runTest('sync-test', 1),
      triggerPythonTest('sync-test', 1)
    ]);

    // Wait for blockchain sync
    await new Promise(r => setTimeout(r, 2000));

    const finalBalance = await jsClient.getFartBalance();
    expect(finalBalance).toBe(initialBalance + 200); // Both earned 100
  });
});
```

#### Protocol Compliance Test
```python
# test/integration/test_protocol_compliance.py
import json
from jsonschema import validate

def test_all_adapters_follow_protocol():
    """Verify all language adapters produce protocol-compliant messages"""
    
    schema = load_protocol_schema()
    languages = ['javascript', 'python', 'rust']
    
    for language in languages:
        # Collect sample messages from each adapter
        messages = collect_adapter_messages(language, count=100)
        
        for msg in messages:
            # Validate against protocol schema
            validate(instance=msg, schema=schema)
            
            # Check timestamp reasonableness
            assert abs(msg['timestamp'] - time.time() * 1000) < 300000
            
            # Verify language field
            assert msg['language'] == language
```

### 3. End-to-End Tests

#### Complete Flow Test
```bash
#!/bin/bash
# test/e2e/complete-flow.sh

echo "🚀 Starting E2E Test Suite"

# 1. Start infrastructure
docker-compose -f docker-compose.test.yml up -d
wait_for_service redis 6379
wait_for_service postgres 5432

# 2. Deploy test contracts
npx hardhat run scripts/deploy-test-contracts.js --network localhost

# 3. Start registry service
cd services/registry && npm start &
REGISTRY_PID=$!

# 4. Run multi-language test scenario
node test/e2e/scenario-runner.js &
SCENARIO_PID=$!

# 5. Monitor for expected outcomes
EXPECTED_TESTS=50
EXPECTED_FART=7500
EXPECTED_NFTS=4

# Wait for completion
sleep 30

# 6. Verify results
ACTUAL_TESTS=$(redis-cli get "utp:stats:total_tests")
ACTUAL_FART=$(redis-cli get "utp:stats:total_fart")
ACTUAL_NFTS=$(redis-cli scard "utp:nfts:minted")

if [[simple-data/storage/documents/test.txt]] && \
   [[ $ACTUAL_FART -eq $EXPECTED_FART ]] && \
   [[ $ACTUAL_NFTS -eq $EXPECTED_NFTS ]]; then
  echo "✅ E2E Test PASSED"
  exit 0
else
  echo "❌ E2E Test FAILED"
  echo "Expected: $EXPECTED_TESTS tests, $EXPECTED_FART FART, $EXPECTED_NFTS NFTs"
  echo "Actual: $ACTUAL_TESTS tests, $ACTUAL_FART FART, $ACTUAL_NFTS NFTs"
  exit 1
fi
```

### 4. Performance Tests

#### Latency Benchmarks
```javascript
// test/performance/latency.test.js
describe('Message Latency', () => {
  test('cross-language message latency < 50ms', async () => {
    const latencies = [];
    
    // Set up message echo between JS and Python
    jsClient.on('echo-response', (msg) => {
      const latency = Date.now() - msg.payload.sentAt;
      latencies.push(latency);
    });

    // Send 100 echo requests
    for (let i = 0; i < 100; i++) {
      await jsClient.publish({
        type: 'echo-request',
        payload: { sentAt: Date.now() }
      });
      await sleep(10);
    }

    // Wait for all responses
    await waitFor(() => latencies.length === 100);

    // Analyze results
    const avg = latencies.reduce((a, b) => a + b) / latencies.length;
    const p95 = percentile(latencies, 95);
    const p99 = percentile(latencies, 99);

    expect(avg).toBeLessThan(50);
    expect(p95).toBeLessThan(100);
    expect(p99).toBeLessThan(200);
  });
});
```

#### Throughput Tests
```python
# test/performance/test_throughput.py
async def test_message_throughput():
    """Test system can handle 1000 msg/sec"""
    
    client = UTPClient()
    await client.connect()
    
    start_time = time.time()
    message_count = 10000
    
    # Blast messages
    tasks = []
    for i in range(message_count):
        task = client.run_test(f'perf-test-{i}', tier=1)
        tasks.append(task)
        
        # Batch to avoid overwhelming
        if len(tasks) >= 100:
            await asyncio.gather(*tasks)
            tasks = []
    
    # Final batch
    if tasks:
        await asyncio.gather(*tasks)
    
    duration = time.time() - start_time
    throughput = message_count / duration
    
    assert throughput >= 1000, f"Only achieved {throughput} msg/sec"
```

### 5. Chaos Engineering Tests

#### Network Partition Test
```javascript
// test/chaos/network-partition.test.js
describe('Network Resilience', () => {
  test('handles Redis disconnection', async () => {
    const client = new UTPClient();
    await client.connect();

    // Simulate network partition
    await dockerCompose.exec('redis', 'redis-cli', 'CLIENT', 'PAUSE', '5000');

    // Try to send messages during partition
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(client.runTest(`partition-test-${i}`, 1));
    }

    // Should not throw, but queue messages
    await expect(Promise.all(promises)).resolves.toBeDefined();

    // Wait for Redis to resume
    await sleep(6000);

    // Verify messages were eventually delivered
    const stats = await client.getStats();
    expect(stats.testsRun).toBe(10);
  });
});
```

#### Contract Failure Simulation
```python
# test/chaos/test_contract_failures.py
async def test_contract_revert_handling():
    """Test adapter handles blockchain reverts gracefully"""
    
    # Deploy faulty contract that reverts on mint
    faulty_contract = deploy_faulty_fart_contract()
    
    # Update registry with faulty contract
    await update_contract_registry({
        'fart': faulty_contract.address
    })
    
    client = UTPClient()
    await client.connect()
    
    # Run test that should earn rewards
    result = await client.run_test('revert-test', tier=4)
    
    # Test should complete even if reward fails
    assert result['payload']['passed'] == True
    
    # Check error was logged but not thrown
    errors = await get_error_logs()
    assert any('mint reverted' in e for e in errors)
```

### 6. Security Tests

#### Message Injection Test
```javascript
// test/security/injection.test.js
describe('Security', () => {
  test('rejects malformed messages', async () => {
    const maliciousMessages = [
      { type: 'test.complete', payload: { passed: 'true; DROP TABLE users;' }},
      { type: '../../../etc/passwd', payload: {}},
      { type: 'test.complete', timestamp: -1, payload: {}},
      { type: 'test.complete', language: 'javascript<script>', payload: {}},
    ];

    for (const msg of maliciousMessages) {
      await expect(client.publish(msg)).rejects.toThrow(/validation/i);
    }
  });

  test('prevents double-spending rewards', async () => {
    const testId = 'double-spend-test';
    
    // Run same test twice
    await client.runTest(testId, 4); // Should earn 5000 FART
    await client.runTest(testId, 4); // Should not earn again

    const balance = await client.getFartBalance();
    expect(balance).toBe(5000); // Not 10000
  });
});
```

### 7. Load Tests

#### Stress Test Configuration
```yaml
# test/load/artillery-config.yml
config:
  target: "ws://localhost:6379"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
    - duration: 60
      arrivalRate: 500
      name: "Spike test"

scenarios:
  - name: "Multi-language test execution"
    engine: "ws"
    flow:
      - send:
          type: "test.start"
          language: "{{ $randomChoice(['javascript', 'python', 'rust']) }}"
          payload:
            name: "load-test-{{ $randomNumber(1, 1000) }}"
            tier: "{{ $randomNumber(1, 4) }}"
      - think: 1
      - send:
          type: "test.complete"
          payload:
            passed: true
            duration: "{{ $randomNumber(10, 100) }}"
```

## 🔍 Test Verification Matrix

| Test Type | What It Verifies | Success Criteria | Failure Impact |
|-----------|------------------|------------------|----------------|
| Unit | Component correctness | 100% pass | Cannot proceed |
| Integration | Language interop | Messages exchanged | Major feature broken |
| E2E | Complete flows | Rewards distributed | System unusable |
| Performance | Speed requirements | <50ms latency | Poor UX |
| Chaos | Failure handling | Graceful degradation | Data loss risk |
| Security | Safety measures | No exploits | Token theft |
| Load | Scalability | 1000 msg/sec | Cannot scale |

## 📊 Test Metrics & Reporting

### Required Metrics
```javascript
{
  coverage: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  },
  performance: {
    avgLatency: '<50ms',
    p95Latency: '<100ms',
    throughput: '>1000/sec'
  },
  reliability: {
    uptime: '99.9%',
    errorRate: '<0.1%',
    recoveryTime: '<30s'
  }
}
```

### Test Dashboard
```
┌─────────────────────────────────────────┐
│          UTP Test Dashboard             │
├─────────────────────────────────────────┤
│ Unit Tests:        ✅ 234/234 (100%)   │
│ Integration:       ✅ 45/45 (100%)     │
│ E2E Tests:         ✅ 12/12 (100%)     │
│ Performance:       ⚠️  18/20 (90%)     │
│ Security:          ✅ 15/15 (100%)     │
│                                         │
│ Language Coverage:                      │
│   JavaScript:      ████████████ 95%    │
│   Python:          ███████████░ 92%    │
│   Rust:            ██████████░░ 87%    │
│                                         │
│ Last Run: 2 minutes ago                 │
│ Total Duration: 4m 32s                  │
└─────────────────────────────────────────┘
```

## 🚀 Continuous Testing

### CI/CD Pipeline
```yaml
name: UTP Test Suite

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        language: [javascript, python, rust]
    
    steps:
      - name: Unit Tests
        run: npm test -- --project=${{ matrix.language }}
      
      - name: Integration Tests
        run: ./run-integration-tests.sh ${{ matrix.language }}
      
      - name: E2E Tests
        if: matrix.language == 'javascript'
        run: npm run test:e2e
      
      - name: Performance Tests
        if: github.event_name == 'pull_request'
        run: npm run test:performance
      
      - name: Security Scan
        run: npm audit && snyk test
```

## 🎯 Test Strategy Success Metrics

### Coverage Goals
- Unit Test Coverage: > 90%
- Integration Test Coverage: > 80%
- E2E Critical Paths: 100%

### Performance Goals
- All tests complete < 5 minutes
- Parallel execution enabled
- Flaky test rate < 1%

### Quality Goals
- Zero critical bugs in production
- < 24 hour fix time for issues
- Automated regression prevention

---

*"To test the testers, one must think like both the attacker and defender, the user and the system, the individual language and the unified protocol."*
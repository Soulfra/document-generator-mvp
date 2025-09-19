# UTP Debugging Guide
*When Things Go Wrong in the Universal Test Protocol*

## 🔍 Debugging Philosophy

"In a distributed, multi-language system, the bug could be anywhere. Start with the message flow."

### Golden Rules
1. **Follow the Messages**: Every action creates a message trail
2. **Check the Basics First**: Is Redis running? Are services connected?
3. **One Language at a Time**: Isolate issues to specific adapters
4. **Trust the Logs**: Comprehensive logging is your friend
5. **Reproduce Locally**: If it happens in production, make it happen locally

## 🛠️ Essential Debugging Tools

### 1. UTP Inspector (Built-in)
```bash
# Real-time message monitoring
node tools/utp-inspector.js

# Filter by language
node tools/utp-inspector.js --language python

# Filter by message type
node tools/utp-inspector.js --type test.failed

# Save to file for analysis
node tools/utp-inspector.js --output debug-session.json
```

### 2. Redis CLI Monitoring
```bash
# Monitor all Redis activity
redis-cli monitor

# Subscribe to UTP events
redis-cli
> SUBSCRIBE utp:events

# Check message queue length
redis-cli
> LLEN utp:queue:pending

# Inspect specific message
redis-cli
> GET utp:message:550e8400-e29b-41d4-a716-446655440000
```

### 3. Contract State Inspector
```javascript
// tools/contract-inspector.js
const Web3 = require('web3');

async function inspectContracts() {
  const web3 = new Web3('http://localhost:8545');
  
  const fartToken = new web3.eth.Contract(FART_ABI, FART_ADDRESS);
  const totalSupply = await fartToken.methods.totalSupply().call();
  
  console.log('FART Token State:');
  console.log('- Total Supply:', totalSupply);
  console.log('- Your Balance:', await fartToken.methods.balanceOf(YOUR_ADDRESS).call());
  
  // Check recent events
  const events = await fartToken.getPastEvents('Transfer', {
    fromBlock: 'latest' - 100,
    toBlock: 'latest'
  });
  
  console.log('Recent Transfers:', events.length);
}
```

## 🔍 Common Issues & Solutions

### Issue 1: Messages Not Being Received

**Symptoms:**
- Adapter sends messages but peers don't receive them
- `peer-update` events not firing

**Debugging Steps:**
```bash
# 1. Check Redis connectivity
redis-cli ping
# Should return: PONG

# 2. Verify subscription
redis-cli
> PUBSUB CHANNELS
# Should show: utp:events

# 3. Test manual publish
redis-cli
> PUBLISH utp:events '{"type":"test.ping","language":"debug"}'

# 4. Check adapter logs
tail -f logs/javascript-adapter.log | grep -E "(publish|subscribe)"
```

**Common Fixes:**
- Ensure Redis connection URL is correct
- Check firewall rules (port 6379)
- Verify adapter is calling `subscribe()` after connect
- Confirm message serialization (must be valid JSON)

### Issue 2: Rewards Not Being Distributed

**Symptoms:**
- Tests pass but FART tokens not received
- `reward.earned` messages sent but balance unchanged

**Debugging Steps:**
```javascript
// 1. Check contract configuration
const registry = await fetch('http://localhost:3456/contracts/testnet');
console.log('Active contracts:', await registry.json());

// 2. Verify blockchain connection
const web3 = new Web3(RPC_URL);
const isConnected = await web3.eth.net.isListening();
console.log('Blockchain connected:', isConnected);

// 3. Check wallet balance and nonce
const balance = await web3.eth.getBalance(WALLET_ADDRESS);
const nonce = await web3.eth.getTransactionCount(WALLET_ADDRESS);
console.log('Wallet:', { balance, nonce });

// 4. Manually trigger reward
const tx = await fartToken.methods.mint(WALLET_ADDRESS, 100).send({
  from: MINTER_ADDRESS,
  gas: 100000
});
console.log('Manual mint tx:', tx.transactionHash);
```

**Common Fixes:**
- Ensure wallet has ETH for gas
- Verify minter role is assigned
- Check contract address is correct
- Confirm network (mainnet vs testnet)
- Look for reverted transactions

### Issue 3: Cross-Language Communication Failures

**Symptoms:**
- JavaScript sees JavaScript messages but not Python
- Character bonuses not synchronized
- Achievements not shared

**Debugging Message Flow:**
```python
# Python debug client
import json
import redis
import asyncio

async def debug_listener():
    r = redis.Redis()
    pubsub = r.pubsub()
    pubsub.subscribe('utp:events')
    
    print("🔍 Listening for messages...")
    
    for message in pubsub.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            print(f"[{data['language']}] {data['type']}: {data['payload']}")
            
            # Validate message format
            required = ['id', 'type', 'timestamp', 'language', 'payload']
            missing = [f for f in required if f not in data]
            if missing:
                print(f"❌ Missing fields: {missing}")

asyncio.run(debug_listener())
```

**Common Fixes:**
- Ensure all adapters use same Redis instance
- Verify message schema compliance
- Check character encoding (UTF-8)
- Confirm timestamp synchronization

### Issue 4: Performance Degradation

**Symptoms:**
- Message latency > 100ms
- Test execution slowing down
- Redis memory growing unbounded

**Performance Profiling:**
```bash
# 1. Redis performance
redis-cli --latency
redis-cli --latency-history

# 2. Check Redis memory
redis-cli INFO memory | grep used_memory_human

# 3. Monitor slow commands
redis-cli
> CONFIG SET slowlog-log-slower-than 10000
> SLOWLOG GET 10

# 4. Message processing time
node tools/latency-tracker.js
```

**Optimization Steps:**
1. Enable Redis persistence with AOF
2. Implement message expiration
3. Batch message processing
4. Add connection pooling
5. Compress large payloads

### Issue 5: Test Failures Not Captured

**Symptoms:**
- Tests fail but show as passed
- Error messages lost
- Incomplete test results

**Error Tracking:**
```javascript
// Enhanced error capture
class DebugAdapter extends UTPClient {
  async runTest(name, tier) {
    const testId = uuid();
    console.log(`🧪 Starting test: ${testId}`);
    
    try {
      const result = await super.runTest(name, tier);
      console.log(`✅ Test completed: ${testId}`);
      return result;
    } catch (error) {
      console.error(`❌ Test failed: ${testId}`, error);
      
      // Send detailed error message
      await this.publish({
        type: 'test.failed',
        payload: {
          name,
          tier,
          error: {
            message: error.message,
            stack: error.stack,
            code: error.code
          }
        }
      });
      
      throw error;
    }
  }
}
```

## 🔧 Advanced Debugging Techniques

### 1. Message Replay System
```javascript
// tools/message-replay.js
const fs = require('fs');

class MessageReplayer {
  constructor(logFile) {
    this.messages = fs.readFileSync(logFile)
      .toString()
      .split('\n')
      .filter(Boolean)
      .map(JSON.parse);
  }

  async replay(speed = 1) {
    for (const msg of this.messages) {
      await this.processMessage(msg);
      await sleep(msg.delay / speed);
    }
  }

  async replayFailure(testId) {
    const relevant = this.messages.filter(m => 
      m.id === testId || m.payload?.testId === testId
    );
    
    console.log(`Found ${relevant.length} messages for test ${testId}`);
    
    for (const msg of relevant) {
      console.log(`[${msg.timestamp}] ${msg.type}:`, msg.payload);
    }
  }
}
```

### 2. State Snapshot Tool
```python
# tools/state_snapshot.py
import redis
import json
from datetime import datetime

def capture_system_state():
    r = redis.Redis()
    
    snapshot = {
        'timestamp': datetime.utcnow().isoformat(),
        'redis_keys': {},
        'stats': {},
        'queues': {}
    }
    
    # Capture all UTP keys
    for key in r.scan_iter(match='utp:*'):
        key_type = r.type(key).decode()
        
        if key_type == 'string':
            snapshot['redis_keys'][key.decode()] = r.get(key).decode()
        elif key_type == 'list':
            snapshot['queues'][key.decode()] = r.llen(key)
        elif key_type == 'hash':
            snapshot['redis_keys'][key.decode()] = {
                k.decode(): v.decode() 
                for k, v in r.hgetall(key).items()
            }
    
    # Save snapshot
    filename = f"snapshot-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(snapshot, f, indent=2)
    
    print(f"💾 Snapshot saved: {filename}")
    return snapshot
```

### 3. Distributed Tracing
```javascript
// Trace a message through the entire system
class MessageTracer {
  constructor() {
    this.traces = new Map();
  }

  startTrace(messageId) {
    this.traces.set(messageId, {
      id: messageId,
      startTime: Date.now(),
      events: []
    });
  }

  addEvent(messageId, event) {
    const trace = this.traces.get(messageId);
    if (trace) {
      trace.events.push({
        timestamp: Date.now(),
        event: event,
        duration: Date.now() - trace.startTime
      });
    }
  }

  getTrace(messageId) {
    return this.traces.get(messageId);
  }

  visualizeTrace(messageId) {
    const trace = this.getTrace(messageId);
    if (!trace) return;

    console.log(`\nTrace for message ${messageId}:`);
    console.log('━'.repeat(50));
    
    let lastTime = trace.startTime;
    for (const event of trace.events) {
      const delta = event.timestamp - lastTime;
      console.log(`├─ [+${delta}ms] ${event.event}`);
      lastTime = event.timestamp;
    }
    
    console.log(`└─ Total: ${trace.events[trace.events.length - 1].duration}ms`);
  }
}
```

## 📊 Debug Dashboard

### Terminal UI for Real-time Debugging
```bash
# Install blessed for terminal UI
npm install -g blessed blessed-contrib

# Run debug dashboard
node tools/debug-dashboard.js
```

### Dashboard Features:
- Real-time message flow visualization
- Language-specific message counts
- Error rate tracking
- Latency histogram
- Contract state monitor
- Redis memory usage

## 🚨 Emergency Procedures

### System Completely Down
```bash
# 1. Emergency restart
./emergency-restart.sh

# 2. Check core services
docker-compose ps
redis-cli ping
curl http://localhost:3456/health

# 3. Reset to known good state
git checkout last-known-good
docker-compose down -v
docker-compose up -d

# 4. Restore from backup
./restore-from-backup.sh
```

### Data Corruption
```bash
# 1. Stop all services
docker-compose stop

# 2. Backup corrupted data
cp -r ./data ./data-corrupted-$(date +%s)

# 3. Verify blockchain state
node tools/verify-blockchain-state.js

# 4. Rebuild from events
node tools/rebuild-from-events.js

# 5. Restart with validation
docker-compose up -d
node tools/validate-system-state.js
```

## 📝 Debug Checklist

When debugging UTP issues, always check:

- [ ] Redis is running and accessible
- [ ] All adapters can connect to Redis
- [ ] Contract registry has correct addresses
- [ ] Blockchain RPC is responding
- [ ] Wallet has sufficient gas
- [ ] Message format follows protocol
- [ ] Timestamps are reasonable
- [ ] Character bonuses calculated correctly
- [ ] Network latency is acceptable
- [ ] No memory leaks in adapters

## 🎯 Prevention Tips

1. **Always Log Message IDs**: Makes tracing easier
2. **Use Correlation IDs**: Link related messages
3. **Implement Health Checks**: Catch issues early
4. **Monitor Resource Usage**: Prevent degradation
5. **Test Error Paths**: Not just happy paths
6. **Version Everything**: Including messages
7. **Document Weird Fixes**: Future you will thank you

---

*"The best debugger is still a well-placed print statement, especially when that statement is published to a distributed message queue that multiple languages can inspect."*
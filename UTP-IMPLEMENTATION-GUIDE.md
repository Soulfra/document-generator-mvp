# UTP Implementation Guide
*Step-by-Step Instructions for Building the Universal Test Protocol*

## 📋 Prerequisites

### Required Software
- Node.js 18+ (for JavaScript adapter and core services)
- Python 3.9+ (for Python adapter)
- Rust 1.70+ (for Rust adapter)
- Redis 7.0+ (for message routing)
- Docker & Docker Compose (for easy deployment)
- Git (for version control)

### Blockchain Requirements
- Ethereum-compatible wallet
- Test network ETH (for gas)
- Access to testnet RPC endpoint

### Development Environment
```bash
# Check prerequisites
node --version      # Should be 18+
python --version    # Should be 3.9+
cargo --version     # Should be 1.70+
redis-cli --version # Should be 7.0+
docker --version    # Should be 20+
```

## 🚀 Phase 1: Core Infrastructure Setup

### Step 1.1: Project Structure
```bash
# Create project structure
mkdir universal-test-protocol && cd universal-test-protocol
mkdir -p {core,adapters,contracts,services,docs,tests}
mkdir -p adapters/{javascript,python,rust,go,java}
mkdir -p services/{registry,router,monitor}

# Initialize git
git init
echo "# Universal Test Protocol" > README.md
```

### Step 1.2: Core Protocol Definition
```bash
# Create protocol schema
cat > core/utp.schema.json << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Universal Test Protocol v1.0",
  "definitions": {
    "Message": {
      "type": "object",
      "required": ["id", "type", "timestamp", "language", "payload"],
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "type": { "enum": ["test.start", "test.complete", "test.failed", "reward.earned", "achievement.unlocked"] },
        "timestamp": { "type": "integer" },
        "language": { "type": "string" },
        "payload": { "type": "object" }
      }
    }
  }
}
EOF
```

### Step 1.3: Redis Message Router
```bash
# Create docker-compose for infrastructure
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: utp
      POSTGRES_USER: utp_user
      POSTGRES_PASSWORD: utp_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
EOF

# Start infrastructure
docker-compose up -d
```

### Step 1.4: Contract Registry Service
```bash
# Create registry service
cd services/registry
npm init -y
npm install express cors dotenv web3 redis

# Create registry server
cat > index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const Redis = require('redis');

const app = express();
const redis = Redis.createClient();

app.use(cors());
app.use(express.json());

// Contract registry endpoints
app.get('/contracts/:network', async (req, res) => {
  const contracts = await redis.get(`contracts:${req.params.network}`);
  res.json(JSON.parse(contracts || '{}'));
});

app.post('/contracts/:network', async (req, res) => {
  await redis.set(`contracts:${req.params.network}`, JSON.stringify(req.body));
  res.json({ success: true });
});

app.listen(3456, () => {
  console.log('Contract Registry running on :3456');
});
EOF
```

## 🔧 Phase 2: JavaScript Adapter Implementation

### Step 2.1: Initialize JavaScript Adapter
```bash
cd adapters/javascript
npm init -y
npm install redis web3 ethers uuid events

# Create adapter structure
mkdir -p {src,tests,examples}
touch src/{index.js,client.js,blockchain.js,messages.js}
```

### Step 2.2: UTP JavaScript Client
```javascript
// src/client.js
const EventEmitter = require('events');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

class UTPClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.language = 'javascript';
    this.character = options.character || 'auditor';
    this.redis = null;
    this.contracts = {};
    this.stats = {
      testsRun: 0,
      testsPassed: 0,
      fartEarned: 0,
      achievements: []
    };
  }

  async connect() {
    this.redis = redis.createClient();
    await this.redis.connect();
    
    // Subscribe to global events
    await this.redis.subscribe('utp:events', (message) => {
      this.handleMessage(JSON.parse(message));
    });
    
    // Load contracts
    await this.loadContracts();
    
    this.emit('connected');
  }

  async runTest(name, tier = 1) {
    const testId = uuidv4();
    const message = {
      id: testId,
      type: 'test.start',
      timestamp: Date.now(),
      language: this.language,
      payload: { name, tier, character: this.character }
    };
    
    await this.publish(message);
    
    // Simulate test execution
    const passed = Math.random() > 0.1; // 90% pass rate
    
    const result = {
      id: testId,
      type: passed ? 'test.complete' : 'test.failed',
      timestamp: Date.now(),
      language: this.language,
      payload: { 
        name, 
        tier, 
        passed,
        duration: Math.random() * 100
      }
    };
    
    await this.publish(result);
    
    if (passed) {
      this.stats.testsRun++;
      this.stats.testsPassed++;
      await this.claimReward(tier);
    }
    
    return result;
  }

  async claimReward(tier) {
    const rewards = { 1: 100, 2: 500, 3: 1000, 4: 5000 };
    const amount = rewards[tier] || 100;
    
    this.stats.fartEarned += amount;
    
    const message = {
      id: uuidv4(),
      type: 'reward.earned',
      timestamp: Date.now(),
      language: this.language,
      payload: { 
        amount, 
        tier,
        total: this.stats.fartEarned 
      }
    };
    
    await this.publish(message);
  }

  async publish(message) {
    await this.redis.publish('utp:events', JSON.stringify(message));
  }

  handleMessage(message) {
    if (message.language !== this.language) {
      this.emit('peer-update', message);
    }
  }

  async loadContracts() {
    const response = await fetch('http://localhost:3456/contracts/testnet');
    this.contracts = await response.json();
  }
}

module.exports = UTPClient;
```

### Step 2.3: Test the JavaScript Adapter
```javascript
// examples/basic-test.js
const UTPClient = require('../src/client');

async function main() {
  const client = new UTPClient({ character: 'auditor' });
  
  client.on('connected', () => {
    console.log('🚀 Connected to UTP Network');
  });
  
  client.on('peer-update', (message) => {
    console.log(`📡 Update from ${message.language}:`, message.type);
  });
  
  await client.connect();
  
  // Run some tests
  for (let i = 0; i < 5; i++) {
    const result = await client.runTest(`test-${i}`, 1);
    console.log(`Test ${i}:`, result.payload.passed ? '✅' : '❌');
  }
  
  console.log('📊 Stats:', client.stats);
}

main().catch(console.error);
```

## 🐍 Phase 3: Python Adapter Implementation

### Step 3.1: Initialize Python Adapter
```bash
cd adapters/python
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Create requirements.txt
cat > requirements.txt << 'EOF'
redis==4.6.0
web3==6.9.0
asyncio==3.4.3
aiohttp==3.8.5
pydantic==2.1.1
EOF

pip install -r requirements.txt

# Create structure
mkdir -p {utp,tests,examples}
touch utp/{__init__.py,client.py,blockchain.py,messages.py}
```

### Step 3.2: UTP Python Client
```python
# utp/client.py
import asyncio
import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
import redis.asyncio as redis
from pydantic import BaseModel

class UTPMessage(BaseModel):
    id: str
    type: str
    timestamp: int
    language: str
    payload: Dict[str, Any]

class UTPClient:
    def __init__(self, character: str = 'builder'):
        self.language = 'python'
        self.character = character
        self.redis: Optional[redis.Redis] = None
        self.contracts = {}
        self.stats = {
            'tests_run': 0,
            'tests_passed': 0,
            'fart_earned': 0,
            'achievements': []
        }
        self._event_handlers = {}
    
    async def connect(self):
        self.redis = redis.from_url('redis://localhost:6379')
        pubsub = self.redis.pubsub()
        await pubsub.subscribe('utp:events')
        
        # Load contracts
        await self._load_contracts()
        
        # Start event listener
        asyncio.create_task(self._listen_events(pubsub))
        
        print(f"🐍 Python adapter connected as {self.character}")
    
    async def run_test(self, name: str, tier: int = 1) -> Dict[str, Any]:
        test_id = str(uuid.uuid4())
        
        # Publish test start
        message = UTPMessage(
            id=test_id,
            type='test.start',
            timestamp=int(datetime.now().timestamp() * 1000),
            language=self.language,
            payload={'name': name, 'tier': tier, 'character': self.character}
        )
        
        await self._publish(message)
        
        # Simulate test execution
        import random
        passed = random.random() > 0.1  # 90% pass rate
        duration = random.random() * 100
        
        # Publish test result
        result = UTPMessage(
            id=test_id,
            type='test.complete' if passed else 'test.failed',
            timestamp=int(datetime.now().timestamp() * 1000),
            language=self.language,
            payload={
                'name': name,
                'tier': tier,
                'passed': passed,
                'duration': duration
            }
        )
        
        await self._publish(result)
        
        if passed:
            self.stats['tests_run'] += 1
            self.stats['tests_passed'] += 1
            await self._claim_reward(tier)
        
        return result.dict()
    
    async def _claim_reward(self, tier: int):
        rewards = {1: 100, 2: 500, 3: 1000, 4: 5000}
        amount = rewards.get(tier, 100)
        
        self.stats['fart_earned'] += amount
        
        message = UTPMessage(
            id=str(uuid.uuid4()),
            type='reward.earned',
            timestamp=int(datetime.now().timestamp() * 1000),
            language=self.language,
            payload={
                'amount': amount,
                'tier': tier,
                'total': self.stats['fart_earned']
            }
        )
        
        await self._publish(message)
    
    async def _publish(self, message: UTPMessage):
        await self.redis.publish('utp:events', message.json())
    
    async def _listen_events(self, pubsub):
        async for message in pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                if data['language'] != self.language:
                    print(f"📡 Update from {data['language']}: {data['type']}")
    
    async def _load_contracts(self):
        # Load from registry service
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:3456/contracts/testnet') as resp:
                self.contracts = await resp.json()
```

### Step 3.3: Test the Python Adapter
```python
# examples/basic_test.py
import asyncio
from utp.client import UTPClient

async def main():
    client = UTPClient(character='tester')
    await client.connect()
    
    # Run some tests
    for i in range(5):
        result = await client.run_test(f'test_{i}', tier=2)
        status = '✅' if result['payload']['passed'] else '❌'
        print(f"Test {i}: {status}")
    
    print(f"📊 Stats: {client.stats}")

if __name__ == '__main__':
    asyncio.run(main())
```

## 🦀 Phase 4: Rust Adapter (Abbreviated)

### Step 4.1: Rust Setup
```bash
cd adapters/rust
cargo init --name utp-rust
```

### Step 4.2: Cargo.toml
```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
redis = { version = "0.23", features = ["tokio-comp"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.0", features = ["v4"] }
web3 = "0.19"
```

## 🧪 Phase 5: Cross-Language Testing

### Step 5.1: Integration Test Script
```bash
# Create integration test
cat > test-integration.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting UTP Integration Test"

# Start services
docker-compose up -d
sleep 5

# Start registry
cd services/registry && npm start &
REGISTRY_PID=$!
sleep 2

# Upload test contracts
curl -X POST http://localhost:3456/contracts/testnet \
  -H "Content-Type: application/json" \
  -d '{"fart": "0xFART...", "nft": "0xNFT..."}'

# Run JavaScript tests
echo "🟨 Running JavaScript tests..."
cd adapters/javascript/examples
node basic-test.js &
JS_PID=$!

# Run Python tests
echo "🐍 Running Python tests..."
cd ../../../adapters/python
source venv/bin/activate
python examples/basic_test.py &
PY_PID=$!

# Wait for completion
sleep 10

# Cleanup
kill $REGISTRY_PID $JS_PID $PY_PID
docker-compose down

echo "✅ Integration test complete!"
EOF

chmod +x test-integration.sh
```

## 📦 Phase 6: Deployment

### Step 6.1: Production Docker Setup
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - utp_network

  registry:
    build: ./services/registry
    restart: always
    ports:
      - "3456:3456"
    depends_on:
      - redis
    networks:
      - utp_network

  monitor:
    build: ./services/monitor
    restart: always
    ports:
      - "3457:3457"
    depends_on:
      - redis
    networks:
      - utp_network

networks:
  utp_network:
    driver: bridge

volumes:
  redis_data:
```

### Step 6.2: CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: UTP Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Start services
      run: docker-compose up -d
    
    - name: Test JavaScript adapter
      run: |
        cd adapters/javascript
        npm install
        npm test
    
    - name: Test Python adapter
      run: |
        cd adapters/python
        pip install -r requirements.txt
        pytest
    
    - name: Integration test
      run: ./test-integration.sh
```

## ✅ Implementation Checklist

### Phase 1: Core Infrastructure ✓
- [ ] Project structure created
- [ ] Protocol schema defined
- [ ] Redis message router running
- [ ] Contract registry service deployed

### Phase 2: JavaScript Adapter ✓
- [ ] Client implementation complete
- [ ] Blockchain integration working
- [ ] Test examples running
- [ ] Events publishing correctly

### Phase 3: Python Adapter ✓
- [ ] Client implementation complete
- [ ] Async operations working
- [ ] Cross-language events received
- [ ] Tests passing

### Phase 4: Additional Languages
- [ ] Rust adapter started
- [ ] Go adapter planned
- [ ] Java adapter planned

### Phase 5: Testing & Integration
- [ ] Unit tests for each adapter
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Security audit complete

### Phase 6: Production Deployment
- [ ] Docker images built
- [ ] CI/CD pipeline active
- [ ] Monitoring configured
- [ ] Documentation complete

## 🎯 Next Steps

1. **Complete Rust Adapter**: Full implementation with tests
2. **Add Blockchain Integration**: Real smart contract interaction
3. **Build Dashboard**: Web UI for monitoring
4. **Security Hardening**: Rate limiting, authentication
5. **Community Launch**: Developer outreach program

---

*This implementation guide provides the foundation for building the Universal Test Protocol. Each phase builds upon the previous, creating a robust, scalable, and truly universal testing ecosystem.*
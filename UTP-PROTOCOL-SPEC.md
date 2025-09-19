# UTP Protocol Specification v1.0
*Technical Definition of the Universal Test Protocol*

## 📋 Protocol Overview

### Version
- **Current**: 1.0.0
- **Status**: Draft
- **Compatibility**: Forward-compatible with 1.x

### Design Principles
1. **Language Agnostic**: No language-specific features
2. **Extensible**: Easy to add new message types
3. **Deterministic**: Same input = same output
4. **Efficient**: Minimal overhead for messaging
5. **Secure**: Cryptographically verifiable

## 📦 Message Format

### Base Message Structure
```json
{
  "version": "1.0.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "test.complete",
  "timestamp": 1693526400000,
  "language": "javascript",
  "character": "auditor",
  "signature": "0x...",
  "payload": {}
}
```

### Field Definitions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| version | string | Yes | Protocol version |
| id | uuid | Yes | Unique message identifier |
| type | enum | Yes | Message type (see types below) |
| timestamp | integer | Yes | Unix timestamp in milliseconds |
| language | string | Yes | Source language adapter |
| character | string | Yes | Selected character/role |
| signature | string | No | Optional cryptographic signature |
| payload | object | Yes | Type-specific data |

## 📨 Message Types

### Test Lifecycle Messages

#### test.start
```json
{
  "type": "test.start",
  "payload": {
    "name": "string",
    "tier": "integer (1-4)",
    "suite": "string (optional)",
    "tags": ["array", "of", "strings"]
  }
}
```

#### test.complete
```json
{
  "type": "test.complete",
  "payload": {
    "name": "string",
    "tier": "integer",
    "passed": "boolean",
    "duration": "number (ms)",
    "assertions": "integer",
    "coverage": "number (0-100)"
  }
}
```

#### test.failed
```json
{
  "type": "test.failed",
  "payload": {
    "name": "string",
    "tier": "integer",
    "error": {
      "message": "string",
      "stack": "string (optional)",
      "code": "string (optional)"
    },
    "duration": "number (ms)"
  }
}
```

### Reward Messages

#### reward.earned
```json
{
  "type": "reward.earned",
  "payload": {
    "amount": "integer",
    "currency": "FART",
    "tier": "integer",
    "reason": "string",
    "txHash": "string (optional)"
  }
}
```

#### achievement.unlocked
```json
{
  "type": "achievement.unlocked",
  "payload": {
    "id": "string",
    "name": "string",
    "description": "string",
    "nftTokenId": "integer (optional)",
    "imageUrl": "string",
    "rarity": "common|rare|epic|legendary"
  }
}
```

### System Messages

#### system.connect
```json
{
  "type": "system.connect",
  "payload": {
    "adapter": "string",
    "version": "string",
    "capabilities": ["array"],
    "address": "string (wallet address)"
  }
}
```

#### system.heartbeat
```json
{
  "type": "system.heartbeat",
  "payload": {
    "uptime": "integer (seconds)",
    "testsActive": "integer",
    "memoryUsage": "integer (bytes)",
    "lastActivity": "timestamp"
  }
}
```

#### contract.update
```json
{
  "type": "contract.update",
  "payload": {
    "network": "mainnet|testnet|local",
    "contracts": {
      "fart": "address",
      "nft": "address",
      "tierUnlock": "address"
    },
    "updatedBy": "address",
    "reason": "string"
  }
}
```

## 🔄 State Machine

### Test State Transitions
```
IDLE → RUNNING → COMPLETE
  ↓        ↓         ↓
  ↓     FAILED    REWARDED
  ↓        ↓         ↓
  ←────────┴─────────┘
```

### States
- **IDLE**: No test running
- **RUNNING**: Test in progress
- **COMPLETE**: Test finished successfully
- **FAILED**: Test failed with error
- **REWARDED**: Rewards distributed

### Transition Rules
1. Can only start test from IDLE
2. RUNNING can transition to COMPLETE or FAILED
3. Only COMPLETE tests can be REWARDED
4. Any state can return to IDLE

## 🔐 Security & Validation

### Message Validation Rules
```javascript
{
  // Required fields
  required: ['version', 'id', 'type', 'timestamp', 'language', 'payload'],
  
  // Field constraints
  constraints: {
    version: /^\d+\.\d+\.\d+$/,
    id: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    timestamp: (t) => t > 1600000000000 && t < Date.now() + 300000, // 5 min future tolerance
    language: /^[a-z]+$/,
    character: ['builder', 'tester', 'gamer', 'auditor']
  },
  
  // Payload validation per type
  payloadSchemas: {
    'test.start': { required: ['name', 'tier'] },
    'test.complete': { required: ['name', 'tier', 'passed', 'duration'] },
    'reward.earned': { required: ['amount', 'currency', 'tier'] }
  }
}
```

### Signature Verification (Optional)
```
signature = sign(hash(JSON.stringify(message)), privateKey)
```

## 📡 Transport Layer

### Redis Pub/Sub Channels
| Channel | Purpose | Publishers | Subscribers |
|---------|---------|------------|-------------|
| utp:events | All events | All adapters | All adapters |
| utp:tests | Test events only | Test runners | Monitors |
| utp:rewards | Reward events | Blockchain service | Wallets |
| utp:system | System events | All services | Admins |

### Message Ordering
- Messages are NOT guaranteed to arrive in order
- Use timestamp for temporal ordering
- Use id for deduplication

### Reliability
- At-least-once delivery via Redis Streams
- Adapters must handle duplicate messages
- Failed messages retry with exponential backoff

## 🏗️ Contract Interfaces

### FART Token (ERC-20)
```solidity
interface IFARTToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}
```

### Achievement NFT (ERC-721)
```solidity
interface IAchievementNFT {
    function mint(address to, uint256 tokenId, string memory uri) external;
    function achievements(address user) external view returns (uint256[] memory);
}
```

### Tier Unlock System
```solidity
interface ITierUnlock {
    function unlockTier(address user, uint8 tier) external;
    function hasUnlocked(address user, uint8 tier) external view returns (bool);
    function getTierReward(uint8 tier) external view returns (uint256);
}
```

## 📊 Metrics & Events

### Required Metrics
Each adapter MUST track:
- Total tests run
- Tests passed/failed
- Average duration
- Rewards earned
- Achievements unlocked
- Network latency

### Event Emission Rules
1. Emit test.start immediately when test begins
2. Emit test.complete/failed within 100ms of completion
3. Batch reward events (max 10 per message)
4. Heartbeat every 30 seconds when active

## 🔄 Version Compatibility

### Version Format
`MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Compatibility Matrix
| Adapter Version | Protocol Version | Compatible |
|----------------|------------------|------------|
| 1.0.x | 1.0.0 | ✅ |
| 1.1.x | 1.0.0 | ✅ |
| 1.x.x | 1.1.0 | ✅ |
| 2.0.0 | 1.0.0 | ❌ |

### Upgrade Process
1. New version announced 30 days prior
2. Deprecation warnings in current version
3. Parallel support for 90 days
4. Old version sunset

## 🌐 Network Configuration

### Supported Networks
```json
{
  "mainnet": {
    "chainId": 1,
    "rpc": "https://eth-mainnet.g.alchemy.com/v2/",
    "contracts": {
      "fart": "0x...",
      "nft": "0x...",
      "tierUnlock": "0x..."
    }
  },
  "testnet": {
    "chainId": 11155111,
    "rpc": "https://eth-sepolia.g.alchemy.com/v2/",
    "contracts": {
      "fart": "0x...",
      "nft": "0x...",
      "tierUnlock": "0x..."
    }
  },
  "local": {
    "chainId": 31337,
    "rpc": "http://localhost:8545",
    "contracts": {
      "fart": "0x...",
      "nft": "0x...",
      "tierUnlock": "0x..."
    }
  }
}
```

## 🔧 Extension Points

### Custom Message Types
Adapters can define custom types with prefix:
```
{language}.{custom_type}

Example: "javascript.coverage.report"
```

### Custom Payload Fields
Additional fields allowed in payload:
- Must not conflict with required fields
- Should be documented
- Other adapters should ignore unknown fields

### Plugin System
Future support for plugins:
- Authentication providers
- Custom reward calculators
- Alternative blockchains
- Analytics integrations

## 📝 Reference Implementation

### Message Creation (JavaScript)
```javascript
function createMessage(type, payload) {
  return {
    version: "1.0.0",
    id: uuid.v4(),
    type: type,
    timestamp: Date.now(),
    language: "javascript",
    character: getCurrentCharacter(),
    payload: payload
  };
}
```

### Message Validation (Python)
```python
def validate_message(message: dict) -> bool:
    required = ['version', 'id', 'type', 'timestamp', 'language', 'payload']
    
    if not all(field in message for field in required):
        return False
    
    if not re.match(r'^\d+\.\d+\.\d+$', message['version']):
        return False
    
    if message['timestamp'] > time.time() * 1000 + 300000:
        return False
    
    return True
```

### Message Handling (Rust)
```rust
fn handle_message(msg: UTPMessage) -> Result<(), Error> {
    match msg.msg_type.as_str() {
        "test.complete" => handle_test_complete(msg.payload),
        "reward.earned" => handle_reward_earned(msg.payload),
        _ => Ok(()) // Ignore unknown types
    }
}
```

---

*This specification defines the complete Universal Test Protocol v1.0. All implementations must conform to these standards to ensure interoperability.*

**Specification Status**: Draft  
**Last Updated**: August 2025  
**Next Review**: September 2025
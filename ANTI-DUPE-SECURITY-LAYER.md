# 🛡️ Anti-Duplication Security Layer Documentation
*Comprehensive Security Mechanisms to Prevent Item/Drop Duplication*

## 🎯 Executive Summary

This document details the multi-layered security approach to prevent duplication of items, drops, and rewards across the entire system. Each layer provides specific protections that work together to create an impenetrable anti-duplication system.

## 🏗️ Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               1. REQUEST FINGERPRINTING                      │
│  • Device ID + IP + User Agent hash                         │
│  • Request pattern analysis                                 │
│  • Duplicate request detection                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                2. AUTH MIDDLEWARE LAYER                      │
│  • JWT validation (jwt-auth.middleware.js)                  │
│  • Token blacklisting for revoked sessions                  │
│  • Rate limiting per user/IP                               │
│  • Request replay prevention                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               3. GUARDIAN VALIDATION LAYER                   │
│  • Business rule enforcement                                │
│  • High-risk operation detection                           │
│  • Manual approval requirements                            │
│  • Anti-bot pattern detection                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              4. DATABASE CONSTRAINT LAYER                    │
│  • UNIQUE constraints on critical fields                    │
│  • Transaction isolation levels                            │
│  • Optimistic locking with version fields                  │
│  • Audit trail for all modifications                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              5. BLOCKCHAIN VERIFICATION                      │
│  • Immutable transaction logs                              │
│  • Smart contract validation                               │
│  • Distributed consensus requirements                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Layer 1: Request Fingerprinting

### Implementation
```javascript
// request-fingerprint.middleware.js
const crypto = require('crypto');

class RequestFingerprinter {
  constructor() {
    this.recentRequests = new Map();
    this.windowMs = 5000; // 5 second window
  }

  generateFingerprint(req) {
    const components = [
      req.ip,
      req.get('user-agent'),
      req.user?.id || 'anonymous',
      req.path,
      req.method,
      JSON.stringify(req.body || {}),
      req.get('x-device-id') || 'unknown'
    ];
    
    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }

  async checkDuplicate(req, res, next) {
    const fingerprint = this.generateFingerprint(req);
    const now = Date.now();
    
    // Check if we've seen this exact request recently
    const lastSeen = this.recentRequests.get(fingerprint);
    if (lastSeen && (now - lastSeen) < this.windowMs) {
      return res.status(429).json({
        error: 'Duplicate request detected',
        code: 'DUPLICATE_REQUEST',
        retryAfter: Math.ceil((this.windowMs - (now - lastSeen)) / 1000)
      });
    }
    
    // Store fingerprint
    this.recentRequests.set(fingerprint, now);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }
    
    next();
  }

  cleanup() {
    const cutoff = Date.now() - this.windowMs;
    for (const [fingerprint, timestamp] of this.recentRequests) {
      if (timestamp < cutoff) {
        this.recentRequests.delete(fingerprint);
      }
    }
  }
}
```

## 🔑 Layer 2: Enhanced Auth Middleware

### JWT Security Features
```javascript
// Enhanced jwt-auth.middleware.js additions
class EnhancedAuthMiddleware {
  constructor() {
    this.nonces = new Map(); // Prevent replay attacks
    this.requestCounts = new Map(); // Rate limiting
  }

  async validateRequest(req, res, next) {
    // 1. Check nonce to prevent replay
    const nonce = req.get('x-request-nonce');
    if (!nonce || this.nonces.has(nonce)) {
      return res.status(400).json({
        error: 'Invalid or duplicate nonce',
        code: 'INVALID_NONCE'
      });
    }
    this.nonces.set(nonce, Date.now());
    
    // 2. Rate limiting per user
    const userId = req.user.id;
    const userRequests = this.requestCounts.get(userId) || [];
    const recentRequests = userRequests.filter(
      timestamp => Date.now() - timestamp < 60000 // Last minute
    );
    
    if (recentRequests.length >= 100) { // 100 requests per minute max
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: 100,
        window: '1 minute'
      });
    }
    
    recentRequests.push(Date.now());
    this.requestCounts.set(userId, recentRequests);
    
    // 3. Token binding to prevent token theft
    const tokenBinding = req.get('x-token-binding');
    const expectedBinding = crypto
      .createHash('sha256')
      .update(req.user.id + req.ip + req.get('user-agent'))
      .digest('hex');
    
    if (tokenBinding !== expectedBinding) {
      await this.blacklistToken(req.token);
      return res.status(401).json({
        error: 'Token binding mismatch - possible token theft',
        code: 'TOKEN_BINDING_MISMATCH'
      });
    }
    
    next();
  }
}
```

## 🛡️ Layer 3: Guardian Validation Rules

### Item Creation Guardian
```javascript
// item-guardian.middleware.js
class ItemCreationGuardian {
  constructor() {
    this.rules = {
      maxItemsPerHour: 10,
      maxItemsPerDay: 100,
      suspiciousPatterns: [
        /test/i,
        /debug/i,
        /admin/i,
        /duplicate/i
      ],
      highValueThreshold: 1000
    };
  }

  async validateItemCreation(req, res, next) {
    const { userId } = req.user;
    const { itemType, quantity, value } = req.body;
    
    // 1. Check creation limits
    const recentCreations = await db.query(`
      SELECT COUNT(*) as count 
      FROM items 
      WHERE owner_id = ? 
      AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [userId]);
    
    if (recentCreations[0].count >= this.rules.maxItemsPerHour) {
      return res.status(403).json({
        error: 'Item creation limit exceeded',
        code: 'CREATION_LIMIT_EXCEEDED',
        limit: this.rules.maxItemsPerHour,
        window: '1 hour'
      });
    }
    
    // 2. Pattern detection
    for (const pattern of this.rules.suspiciousPatterns) {
      if (pattern.test(itemType)) {
        await this.flagSuspiciousActivity(userId, 'suspicious_item_type', { itemType });
        return res.status(403).json({
          error: 'Suspicious item type detected',
          code: 'SUSPICIOUS_PATTERN'
        });
      }
    }
    
    // 3. High value items require manual approval
    if (value > this.rules.highValueThreshold) {
      const approvalRequest = await this.createApprovalRequest({
        userId,
        action: 'create_high_value_item',
        details: { itemType, quantity, value }
      });
      
      return res.status(202).json({
        message: 'High value item requires manual approval',
        code: 'APPROVAL_REQUIRED',
        approvalId: approvalRequest.id
      });
    }
    
    // 4. Velocity check - rapid creation patterns
    const velocityCheck = await this.checkCreationVelocity(userId);
    if (velocityCheck.suspicious) {
      await this.triggerSecurityReview(userId, velocityCheck);
      return res.status(403).json({
        error: 'Unusual activity pattern detected',
        code: 'VELOCITY_CHECK_FAILED'
      });
    }
    
    next();
  }

  async checkCreationVelocity(userId) {
    const intervals = [
      { minutes: 1, max: 5 },
      { minutes: 5, max: 15 },
      { minutes: 60, max: 50 }
    ];
    
    for (const { minutes, max } of intervals) {
      const count = await db.query(`
        SELECT COUNT(*) as count
        FROM items
        WHERE owner_id = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
      `, [userId, minutes]);
      
      if (count[0].count > max) {
        return {
          suspicious: true,
          interval: minutes,
          count: count[0].count,
          max
        };
      }
    }
    
    return { suspicious: false };
  }
}
```

## 💾 Layer 4: Database Constraints

### Schema Design for Anti-Duplication
```sql
-- Core items table with multiple unique constraints
CREATE TABLE items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE, -- Globally unique identifier
    owner_id BIGINT NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    value DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 1, -- For optimistic locking
    
    -- Prevent rapid duplication
    UNIQUE KEY unique_owner_item_minute (owner_id, item_type, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i')),
    
    -- Foreign keys
    FOREIGN KEY (owner_id) REFERENCES users(id),
    
    -- Indexes for performance
    INDEX idx_owner_created (owner_id, created_at),
    INDEX idx_type_value (item_type, value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit trail for all item operations
CREATE TABLE item_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'TRANSFER') NOT NULL,
    actor_id BIGINT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    request_fingerprint CHAR(64),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (actor_id) REFERENCES users(id),
    
    INDEX idx_item_timestamp (item_id, timestamp),
    INDEX idx_actor_action (actor_id, action, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Distributed lock table for critical operations
CREATE TABLE distributed_locks (
    lock_key VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Transaction Isolation
```javascript
// transaction-manager.js
class SecureTransactionManager {
  async createItemWithLock(userId, itemData) {
    const lockKey = `create_item:${userId}:${itemData.item_type}`;
    const lock = await this.acquireDistributedLock(lockKey, 5000);
    
    if (!lock) {
      throw new Error('Could not acquire lock - concurrent operation in progress');
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction({
      isolationLevel: 'SERIALIZABLE' // Highest isolation level
    });
    
    try {
      // Check for recent duplicates within transaction
      const recentDuplicate = await connection.query(
        `SELECT id FROM items 
         WHERE owner_id = ? 
         AND item_type = ? 
         AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
         FOR UPDATE`, // Lock rows
        [userId, itemData.item_type]
      );
      
      if (recentDuplicate.length > 0) {
        throw new Error('Duplicate item creation detected');
      }
      
      // Create item with version number
      const result = await connection.query(
        `INSERT INTO items (uuid, owner_id, item_type, quantity, value, version) 
         VALUES (UUID(), ?, ?, ?, ?, 1)`,
        [userId, itemData.item_type, itemData.quantity, itemData.value]
      );
      
      // Log in audit trail
      await connection.query(
        `INSERT INTO item_audit_log 
         (item_id, action, actor_id, new_values, ip_address, user_agent, request_fingerprint)
         VALUES (?, 'CREATE', ?, ?, ?, ?, ?)`,
        [result.insertId, userId, JSON.stringify(itemData), 
         itemData.ip_address, itemData.user_agent, itemData.fingerprint]
      );
      
      await connection.commit();
      return result;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.release();
      await this.releaseDistributedLock(lockKey);
    }
  }
}
```

## ⛓️ Layer 5: Blockchain Verification

### Smart Contract Integration
```solidity
// ItemRegistry.sol
pragma solidity ^0.8.0;

contract ItemRegistry {
    struct Item {
        bytes32 itemHash;
        address owner;
        uint256 timestamp;
        bool exists;
    }
    
    mapping(bytes32 => Item) public items;
    mapping(address => uint256) public itemCounts;
    mapping(address => mapping(uint256 => bytes32)) public ownerItems;
    
    event ItemCreated(bytes32 indexed itemHash, address indexed owner);
    event ItemTransferred(bytes32 indexed itemHash, address indexed from, address indexed to);
    
    modifier itemNotExists(bytes32 itemHash) {
        require(!items[itemHash].exists, "Item already exists");
        _;
    }
    
    modifier onlyItemOwner(bytes32 itemHash) {
        require(items[itemHash].owner == msg.sender, "Not item owner");
        _;
    }
    
    function createItem(bytes32 itemHash) external itemNotExists(itemHash) {
        items[itemHash] = Item({
            itemHash: itemHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        uint256 currentCount = itemCounts[msg.sender];
        ownerItems[msg.sender][currentCount] = itemHash;
        itemCounts[msg.sender] = currentCount + 1;
        
        emit ItemCreated(itemHash, msg.sender);
    }
    
    function verifyItem(bytes32 itemHash) external view returns (bool exists, address owner) {
        Item memory item = items[itemHash];
        return (item.exists, item.owner);
    }
}
```

### Blockchain Integration Service
```javascript
// blockchain-verification.service.js
class BlockchainVerificationService {
  constructor() {
    this.web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL);
    this.contract = new this.web3.eth.Contract(ItemRegistryABI, contractAddress);
  }

  async registerItem(itemId, ownerId, metadata) {
    // Generate deterministic hash
    const itemHash = this.generateItemHash(itemId, ownerId, metadata);
    
    // Check if already on blockchain
    const exists = await this.contract.methods.verifyItem(itemHash).call();
    if (exists[0]) {
      throw new Error('Item already registered on blockchain');
    }
    
    // Register on blockchain
    const tx = await this.contract.methods.createItem(itemHash).send({
      from: this.systemWallet,
      gas: 200000
    });
    
    // Store blockchain reference
    await db.query(
      `UPDATE items SET blockchain_hash = ?, blockchain_tx = ? WHERE id = ?`,
      [itemHash, tx.transactionHash, itemId]
    );
    
    return {
      itemHash,
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber
    };
  }

  generateItemHash(itemId, ownerId, metadata) {
    const data = `${itemId}:${ownerId}:${JSON.stringify(metadata)}`;
    return Web3.utils.keccak256(data);
  }
}
```

## 🔍 Detection & Response Mechanisms

### Real-time Anomaly Detection
```javascript
// anomaly-detector.js
class AnomalyDetector {
  constructor() {
    this.patterns = {
      rapidCreation: { threshold: 10, window: 60 }, // 10 items in 60 seconds
      valueSpiking: { threshold: 10000, multiplier: 10 }, // Sudden value increases
      patternRepetition: { threshold: 0.8 }, // 80% similarity
      crossAccountTransfers: { threshold: 5, window: 300 } // 5 transfers in 5 minutes
    };
  }

  async detectAnomalies(userId) {
    const anomalies = [];
    
    // Check rapid creation
    const creationRate = await this.checkCreationRate(userId);
    if (creationRate.anomalous) {
      anomalies.push({
        type: 'RAPID_CREATION',
        severity: 'HIGH',
        details: creationRate
      });
    }
    
    // Check value spiking
    const valueSpike = await this.checkValueSpike(userId);
    if (valueSpike.anomalous) {
      anomalies.push({
        type: 'VALUE_SPIKE',
        severity: 'MEDIUM',
        details: valueSpike
      });
    }
    
    // Check pattern repetition
    const patterns = await this.checkPatternRepetition(userId);
    if (patterns.anomalous) {
      anomalies.push({
        type: 'PATTERN_REPETITION',
        severity: 'HIGH',
        details: patterns
      });
    }
    
    return anomalies;
  }

  async respondToAnomalies(userId, anomalies) {
    for (const anomaly of anomalies) {
      switch (anomaly.severity) {
        case 'HIGH':
          await this.lockAccount(userId, anomaly);
          await this.notifySecurityTeam(userId, anomaly);
          break;
        case 'MEDIUM':
          await this.requireAdditionalVerification(userId, anomaly);
          await this.increaseMonitoring(userId);
          break;
        case 'LOW':
          await this.logSecurityEvent(userId, anomaly);
          break;
      }
    }
  }
}
```

## 🚨 Incident Response Protocol

### Automated Response System
```javascript
// incident-response.js
class IncidentResponseSystem {
  async handleDuplicationAttempt(attempt) {
    // 1. Immediate actions
    await this.blockRequest(attempt);
    await this.snapshotUserState(attempt.userId);
    
    // 2. Investigation
    const investigation = await this.investigate(attempt);
    
    // 3. Response based on severity
    if (investigation.severity === 'CRITICAL') {
      await this.criticalResponse(attempt, investigation);
    } else if (investigation.severity === 'HIGH') {
      await this.highResponse(attempt, investigation);
    } else {
      await this.standardResponse(attempt, investigation);
    }
    
    // 4. Post-incident
    await this.documentIncident(attempt, investigation);
    await this.updateSecurityRules(investigation.learnings);
  }

  async criticalResponse(attempt, investigation) {
    // Immediate account suspension
    await db.query(
      `UPDATE users SET status = 'SUSPENDED', suspension_reason = ? WHERE id = ?`,
      ['Critical security violation: duplication attempt', attempt.userId]
    );
    
    // Revoke all active sessions
    await this.revokeAllTokens(attempt.userId);
    
    // Freeze all assets
    await this.freezeUserAssets(attempt.userId);
    
    // Alert security team
    await this.alertSecurityTeam('CRITICAL', attempt, investigation);
    
    // Create forensic snapshot
    await this.createForensicSnapshot(attempt.userId);
  }
}
```

## 📊 Monitoring & Metrics

### Security Dashboard Metrics
```javascript
// security-metrics.js
class SecurityMetrics {
  async collectMetrics() {
    return {
      duplicationAttempts: {
        last24Hours: await this.countAttempts(24),
        last7Days: await this.countAttempts(168),
        byType: await this.attemptsByType()
      },
      blockedRequests: {
        fingerprint: await this.blockedByFingerprint(),
        rateLimit: await this.blockedByRateLimit(),
        guardian: await this.blockedByGuardian()
      },
      suspiciousPatterns: {
        detected: await this.patternsDetected(),
        falsePositives: await this.falsePositiveRate()
      },
      systemHealth: {
        avgResponseTime: await this.avgSecurityCheckTime(),
        blockchainSync: await this.blockchainSyncStatus(),
        lockContentions: await this.lockContentionRate()
      }
    };
  }
}
```

## 🔧 Configuration & Tuning

### Security Parameters
```javascript
// security-config.js
module.exports = {
  fingerprinting: {
    windowMs: 5000,
    cleanupInterval: 60000
  },
  rateLimit: {
    maxRequestsPerMinute: 100,
    maxItemsPerHour: 10,
    maxHighValuePerDay: 5
  },
  guardian: {
    suspiciousPatterns: [/test/i, /debug/i, /duplicate/i],
    highValueThreshold: 1000,
    manualApprovalThreshold: 10000
  },
  blockchain: {
    confirmationsRequired: 3,
    maxGasPrice: '100000000000', // 100 gwei
    retryAttempts: 3
  },
  anomalyDetection: {
    enabled: true,
    checkInterval: 30000, // 30 seconds
    autoResponse: true
  }
};
```

## 🎯 Best Practices

1. **Defense in Depth**: Never rely on a single security layer
2. **Fail Secure**: When in doubt, block the operation
3. **Audit Everything**: Every action must be logged and traceable
4. **Performance Balance**: Security checks should be fast but thorough
5. **Regular Updates**: Security rules must evolve with new threats

## 📋 Implementation Checklist

- [ ] Implement request fingerprinting middleware
- [ ] Enhance JWT auth with nonce and binding
- [ ] Deploy guardian validation rules
- [ ] Set up database constraints and triggers
- [ ] Integrate blockchain verification
- [ ] Configure anomaly detection
- [ ] Set up security monitoring dashboard
- [ ] Create incident response playbooks
- [ ] Train team on security protocols
- [ ] Regular security audits

## 🔗 Related Documentation

- [ORCHESTRATION-MASTER-MAP.md](./ORCHESTRATION-MASTER-MAP.md) - Overall system architecture
- [DATABASE-TO-DEPLOYMENT-FLOW.md](./DATABASE-TO-DEPLOYMENT-FLOW.md) - Deployment security
- [middleware-guardian-contract.js](./middleware-guardian-contract.js) - Guardian implementation

---

*Security is not a feature, it's a foundation. Every layer matters.*
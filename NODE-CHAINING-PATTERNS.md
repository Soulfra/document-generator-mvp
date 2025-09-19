# Node Chaining Patterns Documentation

## 🔗 Overview: How Systems Chain Together

The Document Generator uses several patterns for chaining nodes, questions, and answers together while maintaining token economy awareness.

## 🌐 Core Chaining Patterns

### 1. **Event-Driven Chain**
```
Trigger → Event Bus → Multiple Subscribers → Aggregated Response
   ↓          ↓              ↓                      ↓
Token Cost  Broadcast    Parallel Process      Token Reward
```

### 2. **Question-Answer Chain**
```
User Question → Context Analysis → Service Selection → Answer Generation
      ↓               ↓                  ↓                   ↓
  Token Debit    Load Character    Route by Risk       Token Balance Check
```

### 3. **Service Orchestration Chain**
```
Complex Request → Decompose → Parallel Services → Combine Results
       ↓             ↓              ↓                  ↓
   Cost Estimate  Sub-tasks    Token per Task    Total Cost/Reward
```

## 🎯 Implementation Examples

### Question-Answer Chaining with Token Awareness

```javascript
class QuestionAnswerChain {
  constructor(tokenManager, characterManager, serviceRouter) {
    this.tokenManager = tokenManager;
    this.characterManager = characterManager;
    this.serviceRouter = serviceRouter;
  }

  async processQuestion(userId, question) {
    // 1. Check token balance
    const balance = await this.tokenManager.getBalance(userId);
    if (balance < MINIMUM_TOKENS) {
      return { error: 'Insufficient tokens', required: MINIMUM_TOKENS };
    }

    // 2. Load character context
    const character = await this.characterManager.getCharacter(userId);
    
    // 3. Analyze question complexity
    const complexity = this.analyzeComplexity(question);
    const estimatedCost = this.calculateCost(complexity, character);
    
    // 4. Route to appropriate service chain
    const services = this.selectServices(complexity, character);
    
    // 5. Execute service chain
    const results = await this.executeChain(services, question, {
      userId,
      character,
      maxCost: balance
    });
    
    // 6. Deduct tokens and return answer
    await this.tokenManager.deduct(userId, results.actualCost);
    
    return {
      answer: results.answer,
      cost: results.actualCost,
      remainingBalance: balance - results.actualCost,
      servicesUsed: results.servicesUsed
    };
  }

  selectServices(complexity, character) {
    const chain = [];
    
    // Base service selection
    if (complexity.requiresSearch) {
      chain.push('search-service');
    }
    
    if (complexity.requiresAnalysis) {
      chain.push('analysis-service');
    }
    
    // Character-based modifications
    if (character.personality.experimentation === 'encouraged') {
      chain.push('experimental-ai-service');
    } else {
      chain.push('stable-ai-service');
    }
    
    // Add monitoring based on constraints
    if (character.constraints.securityChecks === 'maximum') {
      chain.push('security-validator');
    }
    
    return chain;
  }
}
```

### Node Connection Patterns

```javascript
class NodeConnectionManager {
  constructor() {
    this.nodes = new Map();
    this.connections = new Map();
    this.executionPaths = new Map();
  }

  // Register a node with its capabilities
  registerNode(nodeId, config) {
    this.nodes.set(nodeId, {
      id: nodeId,
      type: config.type,
      capabilities: config.capabilities,
      tokenCost: config.tokenCost,
      requiredInputs: config.requiredInputs,
      outputs: config.outputs
    });
  }

  // Connect nodes based on input/output compatibility
  connectNodes(fromNodeId, toNodeId, mapping) {
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);
    
    // Validate connection
    const canConnect = this.validateConnection(
      fromNode.outputs,
      toNode.requiredInputs,
      mapping
    );
    
    if (canConnect) {
      this.connections.set(`${fromNodeId}->${toNodeId}`, {
        from: fromNodeId,
        to: toNodeId,
        mapping,
        tokenCost: fromNode.tokenCost + toNode.tokenCost
      });
    }
    
    return canConnect;
  }

  // Find optimal path considering token cost
  findOptimalPath(startNode, endNode, maxTokens) {
    const paths = this.findAllPaths(startNode, endNode);
    
    // Filter by token budget
    const affordablePaths = paths.filter(path => 
      path.totalCost <= maxTokens
    );
    
    // Sort by efficiency (result quality / token cost)
    return affordablePaths.sort((a, b) => 
      (b.quality / b.totalCost) - (a.quality / a.totalCost)
    )[0];
  }
}
```

## 💰 Token-Aware Broadcasting

### Broadcasting with Cost Management

```javascript
class TokenAwareBroadcaster {
  constructor(eventBus, tokenManager) {
    this.eventBus = eventBus;
    this.tokenManager = tokenManager;
    this.subscriptions = new Map();
  }

  // Subscribe with token budget
  subscribe(userId, eventPattern, config = {}) {
    const subscription = {
      userId,
      pattern: eventPattern,
      maxTokensPerEvent: config.maxTokensPerEvent || 10,
      totalBudget: config.totalBudget || 1000,
      spent: 0,
      handler: config.handler
    };
    
    this.subscriptions.set(`${userId}-${eventPattern}`, subscription);
    
    // Set up filtered listener
    this.eventBus.on(eventPattern, async (event) => {
      await this.handleBroadcast(subscription, event);
    });
  }

  async handleBroadcast(subscription, event) {
    // Check if user can afford this broadcast
    const cost = this.calculateBroadcastCost(event);
    
    if (subscription.spent + cost > subscription.totalBudget) {
      // Budget exceeded, skip this broadcast
      return this.notifyBudgetExceeded(subscription.userId);
    }
    
    // Check current balance
    const balance = await this.tokenManager.getBalance(subscription.userId);
    if (balance < cost) {
      return this.notifyInsufficientBalance(subscription.userId);
    }
    
    // Process broadcast
    await this.tokenManager.deduct(subscription.userId, cost);
    subscription.spent += cost;
    
    // Execute handler
    if (subscription.handler) {
      await subscription.handler(event, {
        cost,
        remainingBudget: subscription.totalBudget - subscription.spent
      });
    }
  }
}
```

## 📊 Audit Chain Pattern

### Complete Audit Trail with Token Tracking

```javascript
class AuditChain {
  constructor(database, blockchain, tokenManager) {
    this.db = database;
    this.blockchain = blockchain;
    this.tokenManager = tokenManager;
  }

  async logAction(userId, action, context = {}) {
    const timestamp = new Date();
    const tokenSnapshot = await this.tokenManager.getBalance(userId);
    
    // Create audit entry
    const auditEntry = {
      id: generateUUID(),
      userId,
      action,
      timestamp,
      tokenBalance: tokenSnapshot,
      context,
      characterSettings: await this.getCharacterSnapshot(userId)
    };
    
    // Chain of recording
    const recordingChain = [
      // 1. Local database (fast access)
      () => this.db.audit.create(auditEntry),
      
      // 2. Event broadcast (real-time monitoring)
      () => this.broadcastAudit(auditEntry),
      
      // 3. Blockchain (permanent record)
      () => this.blockchain.record(auditEntry),
      
      // 4. Analytics aggregation
      () => this.updateAnalytics(auditEntry)
    ];
    
    // Execute chain with error handling
    for (const step of recordingChain) {
      try {
        await step();
      } catch (error) {
        console.error('Audit chain step failed:', error);
        // Continue chain even if one step fails
      }
    }
    
    return auditEntry.id;
  }
}
```

## 🎮 Game Chain Integration

### How Gaming Connects to the Chain

```javascript
class GameChainIntegration {
  constructor(gameEngine, tokenEconomy, characterManager) {
    this.gameEngine = gameEngine;
    this.tokenEconomy = tokenEconomy;
    this.characterManager = characterManager;
  }

  async executeGameAction(userId, action) {
    // 1. Load character and check permissions
    const character = await this.characterManager.load(userId);
    
    // 2. Validate action based on character settings
    if (!this.validateAction(action, character)) {
      return { error: 'Action not allowed for character' };
    }
    
    // 3. Calculate token cost/reward
    const tokenImpact = this.calculateTokenImpact(action, character);
    
    // 4. Check if player can afford action
    if (tokenImpact.cost > 0) {
      const balance = await this.tokenEconomy.getBalance(userId);
      if (balance < tokenImpact.cost) {
        return { error: 'Insufficient tokens' };
      }
    }
    
    // 5. Execute game action
    const result = await this.gameEngine.execute(action);
    
    // 6. Process token changes
    if (tokenImpact.cost > 0) {
      await this.tokenEconomy.deduct(userId, tokenImpact.cost);
    }
    if (tokenImpact.reward > 0) {
      await this.tokenEconomy.credit(userId, tokenImpact.reward);
    }
    
    // 7. Update character based on outcome
    await this.updateCharacter(character, result);
    
    // 8. Broadcast result
    await this.broadcastGameEvent({
      userId,
      action,
      result,
      tokenImpact,
      characterUpdate: character.changes
    });
    
    return {
      success: true,
      result,
      tokenImpact,
      newBalance: await this.tokenEconomy.getBalance(userId)
    };
  }
}
```

## 🔄 Chaining Best Practices

### 1. **Always Consider Token Cost**
- Calculate costs upfront
- Check balances before execution
- Provide cost estimates to users

### 2. **Maintain Audit Trails**
- Log every token transaction
- Record service chains used
- Track character setting impacts

### 3. **Enable Parallel Processing**
- Use event bus for fan-out
- Aggregate results efficiently
- Manage partial failures

### 4. **Character-Aware Routing**
- Route based on risk tolerance
- Apply constraints appropriately
- Adapt to user preferences

### 5. **Graceful Degradation**
- Fallback chains for failures
- Budget-aware alternatives
- Progressive enhancement

## 📈 Monitoring Chain Health

```javascript
// Monitor the entire chain ecosystem
class ChainHealthMonitor {
  async getSystemHealth() {
    return {
      tokenEconomy: {
        totalSupply: await this.getTotalTokenSupply(),
        activeWallets: await this.getActiveWalletCount(),
        velocity: await this.getTokenVelocity()
      },
      chains: {
        averageLength: await this.getAverageChainLength(),
        successRate: await this.getChainSuccessRate(),
        averageCost: await this.getAverageChainCost()
      },
      nodes: {
        active: await this.getActiveNodeCount(),
        utilization: await this.getNodeUtilization(),
        bottlenecks: await this.identifyBottlenecks()
      },
      audit: {
        recordsPerHour: await this.getAuditRate(),
        blockchainLag: await this.getBlockchainLag(),
        storageUsage: await this.getAuditStorageUsage()
      }
    };
  }
}
```

---

*This documentation shows how nodes, questions, answers, and services chain together while maintaining awareness of token costs, audit requirements, and character settings throughout the system.*
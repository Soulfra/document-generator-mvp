# 5W+H Integration Guide

## Overview

This guide explains how to integrate the 5W+H Framework with existing systems, particularly focusing on the Document Generator's UTP (Universal Text Protocol) ecosystem.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Existing UTP System                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Document Generator ←→ 5W+H Framework ←→ Neural Pipeline        │
│         ↓                    ↓                    ↓              │
│  Template Processor    Evidence Engine    COBOL Bridge          │
│         ↓                    ↓                    ↓              │
│    MVP Generation      Context Building   Reasoning Layer       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Document Generator Integration

The 5W+H Framework enhances document processing by providing comprehensive context extraction:

```javascript
// Before: Simple document parsing
const document = parseDocument(input);
const template = selectTemplate(document.type);

// After: Rich context extraction with 5W+H
const evidence = await fiveWH.process(input);
const context = {
  who: evidence.who,      // Document author, target audience
  what: evidence.what,    // Document type, content category
  when: evidence.when,    // Deadlines, timelines
  where: evidence.where,  // Target platform, deployment location
  why: evidence.why,      // Business logic, requirements
  how: evidence.how       // Generation workflow, template logic
};
const template = selectTemplate(context);
```

### 2. Neural Pipeline Integration

Connect 5W+H evidence to neural processing layers:

```javascript
// Neural pipeline configuration
const neuralConfig = {
  input: {
    who: evidence.who.map(e => e.resolved.entityId),
    what: evidence.what.map(e => e.resolved.category),
    when: evidence.when.map(e => e.resolved.urgency),
    where: evidence.where.map(e => e.resolved.position),
    why: evidence.why.map(e => e.resolved.calculation),
    how: evidence.how.map(e => e.resolved.workflow)
  },
  layers: ['cobol-reasoning', 'pattern-matching', 'decision-tree'],
  output: 'structured-mvp'
};
```

### 3. Gaming System Integration

For gaming contexts, the 5W+H Framework provides real-time coordination:

```javascript
// Game event processing
gameEngine.on('player-action', async (event) => {
  const evidence = await fiveWH.process({
    who: event.playerId,
    what: event.action,
    when: event.timestamp,
    where: event.position,
    why: event.intention,
    how: event.method
  });
  
  // Route to appropriate handler based on evidence
  const handler = selectHandler(evidence);
  await handler.execute(evidence);
});
```

## API Contracts

### REST API Integration

```yaml
# OpenAPI 3.0 Specification
paths:
  /api/5wh/process:
    post:
      summary: Process text through 5W+H Framework
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                text:
                  type: string
                  description: Input text to process
                context:
                  type: object
                  description: Additional context
      responses:
        200:
          description: Evidence extracted successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Evidence'
```

### GraphQL Integration

```graphql
type Query {
  processText(input: String!, context: ContextInput): Evidence!
  getEvidence(id: ID!): Evidence
  searchEvidence(filters: EvidenceFilters): [Evidence!]!
}

type Mutation {
  trackEvent(evidence: EvidenceInput!): Evidence!
  updateEvidence(id: ID!, updates: EvidenceUpdate!): Evidence!
}

type Subscription {
  evidenceUpdates(componentType: ComponentType): Evidence!
  positionUpdates(entityId: ID!): Position!
  workflowProgress(workflowId: ID!): WorkflowState!
}
```

### WebSocket Integration

```javascript
// WebSocket event protocol
ws.on('connect', () => {
  ws.send({
    type: 'subscribe',
    channels: ['5wh:evidence', '5wh:position', '5wh:workflow']
  });
});

ws.on('message', (data) => {
  switch(data.type) {
    case '5wh:evidence':
      handleNewEvidence(data.evidence);
      break;
    case '5wh:position':
      updatePosition(data.position);
      break;
    case '5wh:workflow':
      updateWorkflowState(data.state);
      break;
  }
});
```

## Data Flow Integration

### Input Processing Pipeline

```javascript
class FiveWHIntegration {
  constructor() {
    this.processor = new UnifiedProcessor();
    this.aggregator = new EvidenceAggregator();
    this.router = new ActionRouter();
  }
  
  async processInput(input, source = 'api') {
    // Step 1: Extract evidence from all components
    const rawEvidence = await this.processor.extractEvidence(input);
    
    // Step 2: Aggregate and resolve conflicts
    const evidence = await this.aggregator.aggregate(rawEvidence);
    
    // Step 3: Determine actions based on evidence
    const actions = await this.router.route(evidence);
    
    // Step 4: Execute actions
    const results = await Promise.all(
      actions.map(action => this.executeAction(action, evidence))
    );
    
    return {
      evidence,
      actions,
      results
    };
  }
}
```

### Event-Driven Integration

```javascript
// Event bus configuration
const eventBus = new EventEmitter();

// Component event handlers
eventBus.on('who:mention-detected', async (data) => {
  const entity = await entityResolver.resolve(data.mention);
  await notificationService.notify(entity, data);
});

eventBus.on('what:state-changed', async (data) => {
  const workflow = await workflowEngine.getWorkflow(data.workflowId);
  await workflow.handleStateChange(data.oldState, data.newState);
});

eventBus.on('when:deadline-approaching', async (data) => {
  await alertService.sendDeadlineAlert(data);
  await priorityQueue.reprioritize(data.taskId);
});

eventBus.on('where:position-updated', async (data) => {
  await spatialIndex.update(data.entityId, data.position);
  await proximityTriggers.check(data.position);
});

eventBus.on('why:calculation-complete', async (data) => {
  await resultCache.store(data.calculationId, data.result);
  await dependentCalculations.trigger(data.calculationId);
});

eventBus.on('how:workflow-triggered', async (data) => {
  const instance = await workflowEngine.createInstance(data.workflowId);
  await instance.start(data.context);
});
```

## Database Integration

### Schema Extensions

```sql
-- Add 5W+H evidence storage to existing schema
CREATE TABLE evidence (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_type VARCHAR(50) NOT NULL,
    source_origin TEXT,
    components JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    aggregated BOOLEAN DEFAULT FALSE,
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES users(id)
);

-- Indexes for efficient querying
CREATE INDEX idx_evidence_created_at ON evidence(created_at);
CREATE INDEX idx_evidence_components_who ON evidence((components->'who'));
CREATE INDEX idx_evidence_components_what ON evidence((components->'what'));
CREATE INDEX idx_evidence_document_id ON evidence(document_id);

-- Spatial data for WHERE component
CREATE TABLE spatial_positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id VARCHAR(255) NOT NULL,
    x DECIMAL(10,2) NOT NULL,
    y DECIMAL(10,2) NOT NULL,
    z DECIMAL(10,2) DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE spatial_positions ADD COLUMN geom GEOMETRY(Point, 4326);
CREATE INDEX idx_spatial_positions_geom ON spatial_positions USING GIST(geom);
```

### ORM Integration

```javascript
// Sequelize models
const Evidence = sequelize.define('Evidence', {
  evidenceId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sourceType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  components: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
});

// Prisma schema
model Evidence {
  evidenceId String   @id @default(uuid())
  createdAt  DateTime @default(now())
  sourceType String
  components Json
  metadata   Json?
  document   Document? @relation(fields: [documentId], references: [id])
  documentId String?
  user       User?     @relation(fields: [userId], references: [id])
  userId     String?
}
```

## Service Mesh Integration

### Microservice Communication

```yaml
# Kubernetes service definitions
apiVersion: v1
kind: Service
metadata:
  name: 5wh-who-service
spec:
  selector:
    app: 5wh-who
  ports:
    - port: 80
      targetPort: 3001
---
apiVersion: v1
kind: Service
metadata:
  name: 5wh-aggregator-service
spec:
  selector:
    app: 5wh-aggregator
  ports:
    - port: 80
      targetPort: 3007
```

### Service Discovery

```javascript
// Consul integration
const consul = require('consul')();

// Register 5W+H services
async function registerServices() {
  const services = [
    { name: '5wh-who', port: 3001, tags: ['component', 'identity'] },
    { name: '5wh-what', port: 3002, tags: ['component', 'content'] },
    { name: '5wh-when', port: 3003, tags: ['component', 'temporal'] },
    { name: '5wh-where', port: 3004, tags: ['component', 'spatial'] },
    { name: '5wh-why', port: 3005, tags: ['component', 'reasoning'] },
    { name: '5wh-how', port: 3006, tags: ['component', 'logic'] }
  ];
  
  for (const service of services) {
    await consul.agent.service.register({
      name: service.name,
      port: service.port,
      tags: service.tags,
      check: {
        http: `http://localhost:${service.port}/health`,
        interval: '10s'
      }
    });
  }
}
```

## Authentication & Authorization

### JWT Integration

```javascript
// Middleware for 5W+H API endpoints
function authenticate5WH(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Check permissions for 5W+H operations
    if (!hasPermission(decoded, '5wh:read')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Role-Based Access

```javascript
const permissions = {
  '5wh:read': ['user', 'analyst', 'admin'],
  '5wh:write': ['analyst', 'admin'],
  '5wh:configure': ['admin'],
  '5wh:who:override': ['admin'],
  '5wh:why:calculate': ['analyst', 'admin']
};
```

## Monitoring Integration

### Prometheus Metrics

```javascript
// Metric definitions
const promClient = require('prom-client');

const evidenceProcessed = new promClient.Counter({
  name: '5wh_evidence_processed_total',
  help: 'Total number of evidence items processed',
  labelNames: ['component', 'status']
});

const processingDuration = new promClient.Histogram({
  name: '5wh_processing_duration_seconds',
  help: 'Duration of 5W+H processing',
  labelNames: ['component'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Track metrics
function trackMetrics(component, duration, status) {
  evidenceProcessed.inc({ component, status });
  processingDuration.observe({ component }, duration);
}
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "5W+H Framework Monitoring",
    "panels": [
      {
        "title": "Evidence Processing Rate",
        "targets": [{
          "expr": "rate(5wh_evidence_processed_total[5m])"
        }]
      },
      {
        "title": "Component Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, 5wh_processing_duration_seconds)"
        }]
      }
    ]
  }
}
```

## Error Handling

### Graceful Degradation

```javascript
class ResilientProcessor {
  async process(input) {
    const results = {
      who: await this.tryComponent('who', input),
      what: await this.tryComponent('what', input),
      when: await this.tryComponent('when', input),
      where: await this.tryComponent('where', input),
      why: await this.tryComponent('why', input),
      how: await this.tryComponent('how', input)
    };
    
    // Calculate confidence based on successful components
    const successCount = Object.values(results)
      .filter(r => r.status === 'success').length;
    results.confidence = successCount / 6;
    
    return results;
  }
  
  async tryComponent(component, input) {
    try {
      const result = await this[component + 'Processor'].process(input);
      return { status: 'success', data: result };
    } catch (error) {
      console.error(`${component} processing failed:`, error);
      return { status: 'failed', error: error.message };
    }
  }
}
```

## Testing Integration

### Integration Test Setup

```javascript
// Jest integration tests
describe('5W+H Integration', () => {
  let app;
  let fiveWH;
  
  beforeAll(async () => {
    app = await createApp();
    fiveWH = await initializeFiveWH();
  });
  
  test('Document processing with 5W+H context', async () => {
    const document = {
      content: '@alice wants #mvp-generation when:tomorrow where:aws why:customer-demo how:automated'
    };
    
    const result = await app.processDocument(document);
    
    expect(result.evidence.who[0].resolved.entityId).toBe('alice');
    expect(result.evidence.what[0].resolved.hashtagId).toBe('mvp-generation');
    expect(result.evidence.when[0].resolved.urgency).toBeGreaterThan(0.5);
    expect(result.template).toBe('rapid-mvp-template');
  });
});
```

## Migration Strategy

### Gradual Adoption

```javascript
// Feature flag for gradual rollout
const features = {
  use5WHProcessing: process.env.FEATURE_5WH_ENABLED === 'true',
  use5WHRouting: process.env.FEATURE_5WH_ROUTING === 'true'
};

async function processRequest(input) {
  if (features.use5WHProcessing) {
    // New 5W+H processing
    return await fiveWH.process(input);
  } else {
    // Legacy processing
    return await legacyProcessor.process(input);
  }
}
```

### Data Migration

```sql
-- Migrate existing data to 5W+H evidence format
INSERT INTO evidence (source_type, components, metadata, document_id)
SELECT 
  'migration',
  jsonb_build_object(
    'who', jsonb_build_array(jsonb_build_object('id', author_id)),
    'what', jsonb_build_array(jsonb_build_object('id', document_type)),
    'when', jsonb_build_array(jsonb_build_object('timestamp', created_at))
  ),
  jsonb_build_object('migrated', true),
  id
FROM documents;
```

## Performance Optimization

### Caching Strategy

```javascript
// Redis caching for evidence
const redis = require('redis').createClient();

async function getCachedEvidence(input) {
  const key = `evidence:${crypto.createHash('md5').update(input).digest('hex')}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const evidence = await fiveWH.process(input);
  await redis.setex(key, 3600, JSON.stringify(evidence));
  
  return evidence;
}
```

### Batch Processing

```javascript
// Process multiple inputs efficiently
async function batchProcess(inputs) {
  const batches = chunk(inputs, 100);
  const results = [];
  
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(input => fiveWH.process(input))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## Security Integration

### Input Validation

```javascript
// Validate 5W+H expressions
const validators = {
  who: /^@[a-zA-Z0-9_-]+$/,
  what: /^#[a-zA-Z0-9_-]+$/,
  when: /^when:[a-zA-Z0-9:_-]+$/,
  where: /^where:[a-zA-Z0-9:(),_-]+$/,
  why: /^why:[a-zA-Z0-9:().=_-]+$/,
  how: /^how:[a-zA-Z0-9:()_-]+$/
};

function validateExpression(type, expression) {
  if (!validators[type].test(expression)) {
    throw new ValidationError(`Invalid ${type} expression: ${expression}`);
  }
}
```

## Conclusion

This integration guide provides comprehensive patterns and examples for incorporating the 5W+H Framework into existing systems. The modular design allows for gradual adoption, while the event-driven architecture ensures loose coupling and maintainability.

Key integration benefits:
- Enhanced context extraction from all inputs
- Unified evidence format across systems
- Real-time coordination capabilities
- Gaming-inspired dynamic features
- Mathematical reasoning integration
- Sophisticated workflow orchestration

Follow the examples and patterns in this guide to successfully integrate the 5W+H Framework with your existing Document Generator and UTP ecosystem.
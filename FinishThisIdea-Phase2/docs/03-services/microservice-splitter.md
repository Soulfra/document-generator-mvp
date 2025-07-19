# Microservice Splitter

## Overview

The Microservice Splitter analyzes monolithic applications and automatically generates a microservices architecture, complete with service boundaries, API contracts, and deployment configurations.

## Service Details

- **ID**: microservice-splitter
- **Category**: Architecture
- **AI Models**: GPT-4 (architecture design), Ollama (code generation)
- **Confidence Required**: 0.8

## Features

### Core Functionality

1. **Monolith Analysis**
   - Domain boundary detection
   - Data flow analysis
   - Dependency mapping
   - Transaction boundary identification
   - Shared state detection

2. **Service Generation**
   - Independent service creation
   - API gateway setup
   - Inter-service communication
   - Database per service pattern
   - Event-driven architecture

3. **Migration Strategy**
   - Incremental migration plan
   - Strangler fig pattern implementation
   - Data migration scripts
   - Rollback procedures

### Swipeable Changes

Each microservice split presented as:
- **Service Boundary**: Visual diagram of the split
- **API Contract**: Generated OpenAPI spec
- **Migration Effort**: Estimated hours/complexity
- **Risk Assessment**: Potential issues and mitigations

## Pricing Tiers

### Starter ($50)
- Up to 10K lines of code
- Basic service extraction
- REST API generation
- Docker configurations
- 48-hour delivery

### Professional ($200)
- Up to 50K lines of code
- Advanced domain modeling
- Event-driven architecture
- Kubernetes manifests
- Database splitting strategies
- 24-hour delivery

### Enterprise ($500+)
- Unlimited code size
- Custom architecture patterns
- Service mesh integration
- Complete CI/CD pipelines
- Team workshop included
- 12-hour delivery

## Technical Implementation

### Analysis Process

```typescript
interface MonolithAnalysis {
  domains: DomainModel[];
  dependencies: DependencyGraph;
  dataFlows: DataFlow[];
  transactions: TransactionBoundary[];
  recommendations: ServiceRecommendation[];
}

interface DomainModel {
  name: string;
  entities: Entity[];
  operations: Operation[];
  dataStore: DataStore;
  boundedContext: BoundedContext;
}

interface ServiceRecommendation {
  serviceName: string;
  responsibilities: string[];
  entities: string[];
  apis: APIEndpoint[];
  dependencies: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}
```

### Splitting Examples

1. **E-commerce Monolith to Microservices**
   ```yaml
   # Before: Single monolithic application
   monolith:
     - UserController
     - ProductController
     - OrderController
     - PaymentController
     - InventoryController
     - NotificationController
   
   # After: Microservices architecture
   services:
     user-service:
       api: /api/users
       database: users_db
       entities: [User, Profile, Authentication]
       
     product-catalog-service:
       api: /api/products
       database: products_db
       entities: [Product, Category, Review]
       
     order-service:
       api: /api/orders
       database: orders_db
       entities: [Order, OrderItem, OrderStatus]
       events: [OrderCreated, OrderShipped]
       
     payment-service:
       api: /api/payments
       database: payments_db
       entities: [Payment, Transaction, Refund]
       events: [PaymentProcessed, PaymentFailed]
       
     inventory-service:
       api: /api/inventory
       database: inventory_db
       entities: [Stock, Warehouse, Movement]
       events: [StockUpdated, LowStockAlert]
       
     notification-service:
       api: /api/notifications
       database: notifications_db
       entities: [Notification, Template, Delivery]
       subscribes: [OrderCreated, PaymentProcessed]
   ```

2. **Generated Service Structure**
   ```typescript
   // user-service/src/index.ts
   import express from 'express';
   import { UserController } from './controllers/UserController';
   import { AuthMiddleware } from './middleware/auth';
   import { connectDatabase } from './db/connection';
   
   const app = express();
   const userController = new UserController();
   
   // Health check
   app.get('/health', (req, res) => {
     res.json({ status: 'healthy', service: 'user-service' });
   });
   
   // User endpoints
   app.post('/api/users', userController.create);
   app.get('/api/users/:id', userController.getById);
   app.put('/api/users/:id', AuthMiddleware, userController.update);
   
   // Start service
   connectDatabase().then(() => {
     app.listen(3001, () => {
       console.log('User service running on port 3001');
     });
   });
   ```

3. **API Gateway Configuration**
   ```typescript
   // api-gateway/config/routes.ts
   export const routes = [
     {
       path: '/api/users',
       service: 'user-service',
       url: 'http://user-service:3001',
       rateLimit: { window: '1m', max: 100 }
     },
     {
       path: '/api/products',
       service: 'product-catalog-service',
       url: 'http://product-catalog:3002',
       cache: { ttl: 300 }
     },
     {
       path: '/api/orders',
       service: 'order-service',
       url: 'http://order-service:3003',
       auth: { required: true }
     }
   ];
   ```

### Migration Strategy

```typescript
class MigrationPlan {
  phases: MigrationPhase[] = [
    {
      name: 'Extract User Service',
      steps: [
        'Create user service repository',
        'Copy user-related code',
        'Set up user database',
        'Implement API endpoints',
        'Add service discovery',
        'Route traffic through gateway',
        'Monitor for issues',
        'Decommission monolith code'
      ],
      duration: '1 week',
      rollback: 'Route traffic back to monolith'
    },
    // Additional phases...
  ];
}
```

## Integration Examples

### CLI Usage

```bash
# Analyze monolith
fti analyze-monolith ./src --output analysis.json

# Generate microservices
fti split-services \
  --analysis analysis.json \
  --pattern event-driven \
  --deployment kubernetes

# Generate migration plan
fti migration-plan \
  --from monolith \
  --to microservices \
  --strategy strangler-fig
```

### Generated Files

```
output/
├── services/
│   ├── user-service/
│   ├── product-service/
│   └── order-service/
├── api-gateway/
├── docker-compose.yml
├── kubernetes/
│   ├── deployments/
│   ├── services/
│   └── ingress.yaml
├── migration/
│   ├── phase-1-users.md
│   ├── phase-2-products.md
│   └── rollback-procedures.md
└── documentation/
    ├── architecture.md
    ├── api-contracts/
    └── deployment-guide.md
```

## Quality Metrics

- **Successful Splits**: 94% work on first deployment
- **Performance Impact**: < 10% latency increase
- **Rollback Success**: 100% successful rollbacks
- **Time Saved**: 3-6 months vs manual splitting

## Best Practices

1. **Start Small**: Begin with least coupled services
2. **Data First**: Plan data migration carefully
3. **Monitor Everything**: Add observability from day one
4. **Test Thoroughly**: Integration tests are crucial

## Success Stories

> "Transformed our 500K line monolith into 12 microservices in 2 months!" - CTO, FinTech Startup

> "The generated API contracts saved weeks of documentation work." - Lead Architect

> "Migration plan was so detailed, junior devs could execute it." - Engineering Manager

## Future Enhancements

- Serverless function extraction
- GraphQL federation setup
- Service mesh configuration
- Automated performance testing
- Cost optimization recommendations
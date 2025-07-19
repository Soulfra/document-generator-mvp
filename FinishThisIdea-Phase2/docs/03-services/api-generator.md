# API Generator Service

## Overview

The API Generator Service automatically creates REST and GraphQL APIs from existing database schemas, code models, or documentation. It generates complete, production-ready APIs with authentication, validation, error handling, and documentation.

## Service Details

**Pricing Tiers:**
- **Basic API**: $5 - CRUD endpoints from schema
- **Advanced API**: $20 - Full REST/GraphQL with auth and validation
- **Enterprise API**: $75+ - Custom API architecture with microservices

**Processing Time**: 
- Basic: 5-10 minutes
- Advanced: 20-30 minutes
- Enterprise: 1-3 days

## What It Generates

### Basic API ($5)
```
✓ REST endpoints:
  - GET /resources (list with pagination)
  - GET /resources/:id (single resource)
  - POST /resources (create)
  - PUT /resources/:id (update)
  - DELETE /resources/:id (delete)

✓ Features:
  - Input validation
  - Error handling
  - Basic authentication
  - Swagger/OpenAPI docs
```

### Advanced API ($20)
```
✓ Everything in Basic, plus:
  - GraphQL API with resolvers
  - Advanced authentication (JWT, OAuth)
  - Role-based access control
  - Request rate limiting
  - Caching strategies
  - Webhooks support
  - API versioning
  - Full test suite
```

### Enterprise API ($75+)
```
✓ Everything in Advanced, plus:
  - Microservices architecture
  - Event-driven design
  - Message queue integration
  - Circuit breakers
  - Service mesh ready
  - Multi-tenant support
  - Custom middleware
  - Performance optimization
```

## How It Works

### 1. Schema Analysis

```typescript
class SchemaAnalyzer {
  async analyzeDatabase(connection: DatabaseConnection): Promise<Schema> {
    // Extract tables, columns, relationships
    const tables = await this.getTables(connection);
    const relations = await this.getRelations(connection);
    const indexes = await this.getIndexes(connection);
    
    // Infer API structure
    return {
      entities: this.mapTablesToEntities(tables),
      relationships: this.mapRelations(relations),
      endpoints: this.generateEndpoints(tables, relations),
      validations: this.inferValidations(tables),
      permissions: this.suggestPermissions(tables)
    };
  }
}
```

### 2. API Generation Pipeline

```typescript
interface APIGenerationPipeline {
  // Step 1: Analyze source
  analyze(source: DataSource): Promise<APISpecification>;
  
  // Step 2: Generate code
  generate(spec: APISpecification): Promise<GeneratedAPI>;
  
  // Step 3: Add features
  enhance(api: GeneratedAPI, features: Features[]): Promise<EnhancedAPI>;
  
  // Step 4: Test and validate
  validate(api: EnhancedAPI): Promise<ValidationReport>;
  
  // Step 5: Package and deliver
  package(api: EnhancedAPI): Promise<DeliverablePackage>;
}
```

### 3. Progressive Enhancement

```typescript
// Start with Ollama for basic CRUD
const basicAPI = await ollama.generate({
  prompt: `Generate REST API for: ${schema}`,
  model: 'codellama'
});

// Use GPT-3.5 for advanced features
if (requiresAdvancedFeatures) {
  const enhanced = await gpt35.enhance({
    api: basicAPI,
    features: ['auth', 'validation', 'caching']
  });
}

// Use GPT-4/Claude for complex architectures
if (enterpriseRequirements) {
  const enterprise = await gpt4.architect({
    requirements: enterpriseSpec,
    constraints: ['microservices', 'event-driven']
  });
}
```

## Generated Code Examples

### 1. Node.js/Express REST API

**Input Schema:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Generated API:**
```typescript
// src/routes/users.route.ts
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { UserController } from '../controllers/user.controller';

const router = Router();
const controller = new UserController();

// GET /api/users - List users with pagination
router.get('/',
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['name', 'email', 'created_at']),
  query('order').optional().isIn(['asc', 'desc']),
  validate,
  controller.list
);

// GET /api/users/:id - Get single user
router.get('/:id',
  authenticate,
  param('id').isInt(),
  validate,
  controller.get
);

// POST /api/users - Create user
router.post('/',
  authenticate,
  authorize('admin'),
  body('email').isEmail().normalizeEmail(),
  body('name').isString().trim().isLength({ min: 2, max: 255 }),
  body('role').optional().isIn(['user', 'admin']),
  validate,
  controller.create
);

// PUT /api/users/:id - Update user
router.put('/:id',
  authenticate,
  param('id').isInt(),
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().isString().trim().isLength({ min: 2, max: 255 }),
  body('role').optional().isIn(['user', 'admin']),
  validate,
  controller.update
);

// DELETE /api/users/:id - Delete user
router.delete('/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validate,
  controller.delete
);

export default router;
```

**Generated Controller:**
```typescript
// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { PaginationDto } from '../dto/pagination.dto';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';

export class UserController {
  private userService: UserService;
  
  constructor() {
    this.userService = new UserService();
  }
  
  list = async (req: Request, res: Response) => {
    try {
      const pagination: PaginationDto = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string || 'created_at',
        order: req.query.order as 'asc' | 'desc' || 'desc'
      };
      
      const result = await this.userService.findAll(pagination);
      
      res.json({
        data: result.data,
        meta: {
          total: result.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(result.total / pagination.limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  get = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.findById(parseInt(req.params.id));
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ data: user });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  create = async (req: Request, res: Response) => {
    try {
      const createDto: CreateUserDto = req.body;
      const user = await this.userService.create(createDto);
      
      res.status(201).json({ data: user });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateDto: UpdateUserDto = req.body;
      
      const user = await this.userService.update(id, updateDto);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ data: user });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await this.userService.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
```

### 2. GraphQL API Generation

**Generated Schema:**
```graphql
type User {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  user: User!
  title: String!
  content: String
  published: Boolean!
  createdAt: DateTime!
}

enum UserRole {
  USER
  ADMIN
}

type Query {
  # User queries
  users(page: Int, limit: Int, sort: UserSortField, order: SortOrder): UserConnection!
  user(id: ID!): User
  
  # Post queries
  posts(page: Int, limit: Int, published: Boolean): PostConnection!
  post(id: ID!): Post
  userPosts(userId: ID!, published: Boolean): [Post!]!
}

type Mutation {
  # User mutations
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  
  # Post mutations
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  publishPost(id: ID!): Post!
  deletePost(id: ID!): Boolean!
}

type Subscription {
  postPublished: Post!
  userCreated: User!
}
```

**Generated Resolvers:**
```typescript
// src/graphql/resolvers/user.resolver.ts
import { UserService } from '../../services/user.service';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';

export const userResolvers = {
  Query: {
    users: async (_, args, { user, dataSources }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const { page = 1, limit = 20, sort, order } = args;
      return dataSources.userService.findAll({ page, limit, sort, order });
    },
    
    user: async (_, { id }, { user, dataSources }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      return dataSources.userService.findById(id);
    }
  },
  
  Mutation: {
    createUser: async (_, { input }, { user, dataSources }) => {
      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenError('Admin access required');
      }
      
      return dataSources.userService.create(input);
    },
    
    updateUser: async (_, { id, input }, { user, dataSources }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // Users can update themselves, admins can update anyone
      if (user.id !== id && user.role !== 'ADMIN') {
        throw new ForbiddenError('Cannot update other users');
      }
      
      return dataSources.userService.update(id, input);
    }
  },
  
  User: {
    posts: async (parent, _, { dataSources }) => {
      return dataSources.postService.findByUserId(parent.id);
    }
  }
};
```

### 3. Authentication & Authorization

**Generated Auth Middleware:**
```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as AuthRequest['user'];
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

## API Features

### 1. Pagination & Filtering

```typescript
class PaginationBuilder {
  buildQuery(params: PaginationParams): QueryBuilder {
    const { page = 1, limit = 20, filters = {}, sort, order } = params;
    
    let query = this.baseQuery;
    
    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined) {
        query = query.where(field, value);
      }
    });
    
    // Apply sorting
    if (sort) {
      query = query.orderBy(sort, order || 'asc');
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);
    
    return query;
  }
}
```

### 2. Rate Limiting

```typescript
// Generated rate limiter configuration
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    }),
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: req.rateLimit.resetTime
      });
    }
  });
};

// Applied per endpoint
router.post('/api/expensive-operation',
  createRateLimiter({ max: 10, windowMs: 60 * 1000 }), // 10 per minute
  controller.expensiveOperation
);
```

### 3. Caching Strategies

```typescript
// Generated caching middleware
import { Redis } from 'ioredis';

export const cache = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Cache error:', error);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data: any) {
      res.json = originalJson;
      res.json(data);
      
      // Cache the response
      redis.setex(key, duration, JSON.stringify(data))
        .catch(err => console.error('Cache set error:', err));
    };
    
    next();
  };
};
```

### 4. API Versioning

```typescript
// Generated versioning strategy
export const apiVersion = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Accept version from header or URL
    const requestedVersion = 
      req.headers['api-version'] || 
      req.params.version || 
      'v1';
    
    if (requestedVersion !== version) {
      return res.status(400).json({
        error: `API version ${requestedVersion} not supported. Use ${version}`
      });
    }
    
    next();
  };
};

// Route setup with versioning
app.use('/api/v1', apiVersion('v1'), v1Routes);
app.use('/api/v2', apiVersion('v2'), v2Routes);
```

## OpenAPI/Swagger Documentation

**Generated OpenAPI Spec:**
```yaml
openapi: 3.0.0
info:
  title: Generated API
  version: 1.0.0
  description: Auto-generated API from database schema
  
servers:
  - url: http://localhost:3000/api/v1
    description: Development server
  - url: https://api.example.com/v1
    description: Production server

paths:
  /users:
    get:
      summary: List users
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'
    
    post:
      summary: Create user
      tags: [Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserDto'
      responses:
        201:
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [user, admin]
        createdAt:
          type: string
          format: date-time
  
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Advanced Features

### 1. Webhook Support

```typescript
class WebhookGenerator {
  generateWebhookEndpoints(events: string[]): WebhookConfig {
    return {
      endpoints: events.map(event => ({
        event,
        url: `/webhooks/${event}`,
        method: 'POST',
        headers: {
          'X-Webhook-Event': event,
          'X-Webhook-Signature': 'sha256=...'
        }
      })),
      
      handler: this.generateWebhookHandler(),
      verifier: this.generateSignatureVerifier(),
      retry: {
        attempts: 3,
        backoff: 'exponential'
      }
    };
  }
}
```

### 2. Microservices Architecture

```yaml
# Generated docker-compose.yml for microservices
version: '3.8'

services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - SERVICE_DISCOVERY_URL=http://consul:8500
  
  user-service:
    build: ./services/user-service
    environment:
      - DATABASE_URL=postgresql://db:5432/users
      - REDIS_URL=redis://redis:6379
  
  post-service:
    build: ./services/post-service
    environment:
      - DATABASE_URL=postgresql://db:5432/posts
      - KAFKA_BROKERS=kafka:9092
  
  auth-service:
    build: ./services/auth-service
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
```

### 3. Event-Driven Architecture

```typescript
// Generated event handlers
export class UserEventHandlers {
  @OnEvent('user.created')
  async handleUserCreated(payload: UserCreatedEvent) {
    // Send welcome email
    await this.emailService.sendWelcome(payload.user);
    
    // Update analytics
    await this.analytics.track('user_signup', {
      userId: payload.user.id,
      source: payload.metadata.source
    });
    
    // Publish to other services
    await this.eventBus.publish('user.onboarding.start', {
      userId: payload.user.id
    });
  }
}
```

## Testing Support

### Generated Tests

```typescript
// Generated API tests
import request from 'supertest';
import { app } from '../src/app';

describe('User API', () => {
  describe('GET /api/users', () => {
    it('returns paginated users', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });
  });
});
```

## Deployment Configuration

### Generated Infrastructure

```typescript
// terraform/api.tf
resource "aws_ecs_service" "api" {
  name            = "generated-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_instance_count
  
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
}
```

## Database Integration

### ORM Configuration

```typescript
// Generated Prisma schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

## Performance Optimization

### 1. Query Optimization

```typescript
class QueryOptimizer {
  optimizeQuery(query: Query): OptimizedQuery {
    return query
      .select(['id', 'email', 'name']) // Only select needed fields
      .leftJoinAndSelect('user.posts', 'post', 'post.published = true')
      .limit(20)
      .cache(60000) // Cache for 1 minute
      .useIndex('idx_created_at');
  }
}
```

### 2. Response Compression

```typescript
// Generated compression middleware
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses > 1KB
}));
```

## Security Features

### 1. Input Sanitization

```typescript
// Generated sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};
```

### 2. CORS Configuration

```typescript
// Generated CORS setup
import cors from 'cors';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version']
};

app.use(cors(corsOptions));
```

## Monitoring & Logging

### Generated Monitoring

```typescript
// Prometheus metrics
import { register, Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration
      .labels(req.method, req.route?.path || 'unknown', res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, req.route?.path || 'unknown', res.statusCode.toString())
      .inc();
  });
  
  next();
});
```

## Example Use Cases

### 1. SaaS Application API
- Multi-tenant support
- Subscription management
- Usage tracking
- Webhooks for integrations

### 2. E-commerce API
- Product catalog
- Order management
- Payment processing
- Inventory tracking

### 3. Social Media API
- User profiles
- Post management
- Real-time notifications
- Content moderation

## Pricing Breakdown

### Basic API ($5)
- 5-10 entities
- CRUD operations
- Basic auth
- Swagger docs

### Advanced API ($20)
- Unlimited entities
- GraphQL + REST
- JWT auth + RBAC
- Caching + rate limiting
- Full test coverage

### Enterprise API ($75+)
- Microservices split
- Event-driven architecture
- Custom middleware
- Performance optimization
- DevOps configuration
- Ongoing support

## Related Services

- [Test Generator](test-generator.md) - Generate tests for your API
- [Documentation Generator](documentation-generator.md) - Create API docs
- [Security Auditor](security-auditor.md) - Security scan your API
- [Performance Optimizer](performance-optimizer.md) - Optimize API performance

---

*Auto-generated APIs that just work, out of the box.*
# TypeScript Converter Service

## Overview

The TypeScript Converter Service automatically migrates JavaScript codebases to TypeScript, adding type annotations, interfaces, and type safety while preserving functionality. It handles everything from simple type inference to complex generic types and module definitions.

## Service Details

**Pricing Tiers:**
- **Basic Migration**: $6 - Type annotations and basic interfaces
- **Advanced Migration**: $25 - Full type safety with generics and strict mode
- **Enterprise Migration**: $100+ - Large-scale migrations with custom type systems

**Processing Time**: 
- Basic: 10-20 minutes
- Advanced: 30-60 minutes
- Enterprise: 1-3 days

## What It Converts

### Basic Migration ($6)
```
✓ Type annotations:
  - Function parameters and returns
  - Variable declarations
  - Class properties
  - Basic types (string, number, boolean, etc.)
  
✓ Interfaces:
  - Object shape definitions
  - Function signatures
  - Basic type aliases
  
✓ Configuration:
  - tsconfig.json setup
  - Build scripts update
```

### Advanced Migration ($25)
```
✓ Everything in Basic, plus:
  - Generic types and constraints
  - Union and intersection types
  - Type guards and assertions
  - Mapped and conditional types
  - Strict null checks
  - Module declarations (.d.ts)
  - JSDoc to TypeScript conversion
  - Third-party library types
```

### Enterprise Migration ($100+)
```
✓ Everything in Advanced, plus:
  - Custom type system design
  - Monorepo configuration
  - Incremental migration strategy
  - Type-safe API contracts
  - Advanced generic patterns
  - Performance optimizations
  - Team training materials
  - Migration documentation
```

## How It Works

### 1. Code Analysis

```typescript
class TypeScriptAnalyzer {
  async analyzeJavaScript(files: SourceFile[]): Promise<MigrationPlan> {
    const analysis = {
      // Infer types from usage
      inferredTypes: await this.inferTypes(files),
      
      // Detect patterns
      patterns: this.detectPatterns(files),
      
      // Find dependencies
      dependencies: this.analyzeDependencies(files),
      
      // Identify challenges
      challenges: this.identifyChallenges(files),
      
      // Estimate complexity
      complexity: this.calculateComplexity(files)
    };
    
    return this.createMigrationPlan(analysis);
  }
  
  private async inferTypes(files: SourceFile[]): Promise<TypeInference[]> {
    const inferences = [];
    
    for (const file of files) {
      // Analyze variable usage
      const variables = this.analyzeVariableUsage(file);
      
      // Analyze function calls
      const functions = this.analyzeFunctionUsage(file);
      
      // Analyze object shapes
      const objects = this.analyzeObjectShapes(file);
      
      inferences.push({
        file: file.path,
        variables,
        functions,
        objects
      });
    }
    
    return inferences;
  }
}
```

### 2. Type Inference Engine

```typescript
interface TypeInferenceEngine {
  // Infer from literals
  inferFromLiteral(value: any): TSType {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return this.inferArrayType(value);
    if (typeof value === 'object') return this.inferObjectType(value);
    return 'unknown';
  }
  
  // Infer from usage context
  inferFromUsage(node: ASTNode): TSType {
    const usages = this.collectUsages(node);
    const types = new Set<TSType>();
    
    for (const usage of usages) {
      if (usage.type === 'assignment') {
        types.add(this.inferFromLiteral(usage.value));
      }
      if (usage.type === 'function-arg') {
        types.add(this.inferFromParameter(usage));
      }
      if (usage.type === 'return') {
        types.add(this.inferFromReturn(usage));
      }
    }
    
    return this.combineTypes(Array.from(types));
  }
}
```

### 3. Progressive Migration

```typescript
// Start with Ollama for basic types
const basicTypes = await ollama.inferTypes({
  code: javascriptCode,
  level: 'basic'
});

// Use GPT-3.5 for complex inference
if (needsAdvancedInference) {
  const advancedTypes = await gpt35.inferTypes({
    code: javascriptCode,
    context: basicTypes,
    level: 'advanced'
  });
}

// Use GPT-4/Claude for architectural decisions
if (enterpriseRequirements) {
  const architecture = await gpt4.designTypeSystem({
    codebase: analysis,
    requirements: enterpriseNeeds
  });
}
```

## Conversion Examples

### 1. Basic Function Conversion

**JavaScript Input:**
```javascript
function calculateTotal(items, tax, discount) {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
  
  const taxAmount = subtotal * tax;
  const discountAmount = subtotal * discount;
  
  return {
    subtotal,
    tax: taxAmount,
    discount: discountAmount,
    total: subtotal + taxAmount - discountAmount
  };
}
```

**TypeScript Output:**
```typescript
interface Item {
  price: number;
  quantity: number;
}

interface CalculationResult {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

function calculateTotal(
  items: Item[], 
  tax: number, 
  discount: number
): CalculationResult {
  const subtotal = items.reduce((sum: number, item: Item): number => {
    return sum + item.price * item.quantity;
  }, 0);
  
  const taxAmount = subtotal * tax;
  const discountAmount = subtotal * discount;
  
  return {
    subtotal,
    tax: taxAmount,
    discount: discountAmount,
    total: subtotal + taxAmount - discountAmount
  };
}
```

### 2. Class Conversion

**JavaScript Input:**
```javascript
class UserService {
  constructor(database, logger) {
    this.db = database;
    this.logger = logger;
    this.cache = new Map();
  }
  
  async getUser(id) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    try {
      const user = await this.db.users.findOne({ id });
      if (user) {
        this.cache.set(id, user);
      }
      return user;
    } catch (error) {
      this.logger.error('Failed to get user', { id, error });
      throw error;
    }
  }
  
  async createUser(data) {
    const user = {
      ...data,
      id: generateId(),
      createdAt: new Date()
    };
    
    await this.db.users.insert(user);
    return user;
  }
}
```

**TypeScript Output:**
```typescript
interface Database {
  users: {
    findOne(query: { id: string }): Promise<User | null>;
    insert(user: User): Promise<void>;
  };
}

interface Logger {
  error(message: string, context?: any): void;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserData {
  name: string;
  email: string;
}

class UserService {
  private db: Database;
  private logger: Logger;
  private cache: Map<string, User>;
  
  constructor(database: Database, logger: Logger) {
    this.db = database;
    this.logger = logger;
    this.cache = new Map<string, User>();
  }
  
  async getUser(id: string): Promise<User | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    
    try {
      const user = await this.db.users.findOne({ id });
      if (user) {
        this.cache.set(id, user);
      }
      return user;
    } catch (error) {
      this.logger.error('Failed to get user', { id, error });
      throw error;
    }
  }
  
  async createUser(data: CreateUserData): Promise<User> {
    const user: User = {
      ...data,
      id: generateId(),
      createdAt: new Date()
    };
    
    await this.db.users.insert(user);
    return user;
  }
}

declare function generateId(): string;
```

### 3. React Component Conversion

**JavaScript Input:**
```javascript
import React, { useState, useEffect } from 'react';
import { fetchTodos } from './api';

export function TodoList({ userId, onComplete }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadTodos();
  }, [userId]);
  
  async function loadTodos() {
    try {
      setLoading(true);
      const data = await fetchTodos(userId);
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  function handleToggle(id) {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  }
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo.id)}
          />
          <span className={todo.completed ? 'completed' : ''}>
            {todo.title}
          </span>
          {todo.completed && (
            <button onClick={() => onComplete(todo)}>
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
```

**TypeScript Output:**
```typescript
import React, { useState, useEffect, FC } from 'react';
import { fetchTodos } from './api';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
}

interface TodoListProps {
  userId: string;
  onComplete: (todo: Todo) => void;
}

export const TodoList: FC<TodoListProps> = ({ userId, onComplete }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadTodos();
  }, [userId]);
  
  async function loadTodos(): Promise<void> {
    try {
      setLoading(true);
      const data = await fetchTodos(userId);
      setTodos(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  
  function handleToggle(id: string): void {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  }
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {todos.map((todo: Todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo.id)}
          />
          <span className={todo.completed ? 'completed' : ''}>
            {todo.title}
          </span>
          {todo.completed && (
            <button onClick={() => onComplete(todo)}>
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};
```

## Advanced Type Patterns

### 1. Generic Types

```typescript
// Inferred generic function
function mapArray<T, U>(
  array: T[], 
  transform: (item: T) => U
): U[] {
  return array.map(transform);
}

// Inferred generic class
class Cache<T> {
  private items = new Map<string, T>();
  
  get(key: string): T | undefined {
    return this.items.get(key);
  }
  
  set(key: string, value: T): void {
    this.items.set(key, value);
  }
}
```

### 2. Union and Intersection Types

```typescript
// Inferred from usage patterns
type Status = 'pending' | 'active' | 'completed' | 'failed';

type User = {
  id: string;
  name: string;
};

type Admin = User & {
  permissions: string[];
};

type Response<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

### 3. Type Guards

```typescript
// Generated type guards
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).name === 'string'
  );
}

function isAdmin(user: User): user is Admin {
  return 'permissions' in user && Array.isArray((user as any).permissions);
}
```

## Configuration Generation

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Build Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "dev": "ts-node-dev --respawn src/index.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx"
  }
}
```

## Migration Strategies

### 1. Incremental Migration

```typescript
class IncrementalMigrator {
  async migrate(options: MigrationOptions): Promise<MigrationResult> {
    // Phase 1: Add basic types
    await this.addBasicTypes();
    
    // Phase 2: Generate interfaces
    await this.generateInterfaces();
    
    // Phase 3: Enable strict mode gradually
    await this.enableStrictMode([
      'noImplicitAny',
      'strictNullChecks',
      'strictFunctionTypes'
    ]);
    
    // Phase 4: Add advanced types
    await this.addAdvancedTypes();
    
    return this.generateReport();
  }
}
```

### 2. Module by Module

```typescript
// Start with leaf modules
const migrationOrder = [
  'utils',      // No dependencies
  'models',     // Depends on utils
  'services',   // Depends on models
  'api',        // Depends on services
  'ui'          // Depends on everything
];

for (const module of migrationOrder) {
  await migrateModule(module);
  await runTests(module);
  await updateImports(module);
}
```

## Type Declaration Files

### Generated .d.ts Files

```typescript
// types/global.d.ts
declare global {
  interface Window {
    __APP_CONFIG__: AppConfig;
  }
}

// types/modules.d.ts
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

// types/vendor.d.ts
declare module 'legacy-library' {
  export function doSomething(input: string): void;
  export class LegacyClass {
    constructor(options: any);
    method(): string;
  }
}
```

## Common Challenges

### 1. Dynamic Types

```typescript
// Handle dynamic property access
function getValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  return keys.reduce((acc: any, key) => acc?.[key], obj);
}

// Type-safe version
function getValueSafe<T>(
  obj: T, 
  path: keyof T
): T[keyof T] {
  return obj[path];
}
```

### 2. Third-Party Libraries

```typescript
// Install type definitions
npm install --save-dev @types/lodash @types/express @types/react

// Create custom types for untyped libraries
declare module 'untyped-lib' {
  export interface Options {
    timeout?: number;
    retries?: number;
  }
  
  export function initialize(options: Options): void;
  export function process(data: unknown): Promise<unknown>;
}
```

## Quality Assurance

### Type Coverage Report

```typescript
interface TypeCoverageReport {
  totalFiles: number;
  typedFiles: number;
  coverage: number;
  details: {
    file: string;
    typed: number;
    untyped: number;
    percentage: number;
  }[];
}

// Generate report
npx type-coverage --detail
```

### Strict Mode Readiness

```typescript
class StrictModeAnalyzer {
  analyze(project: Project): StrictModeReport {
    return {
      noImplicitAny: this.checkImplicitAny(project),
      strictNullChecks: this.checkNullSafety(project),
      strictFunctionTypes: this.checkFunctionTypes(project),
      recommendations: this.generateRecommendations(project)
    };
  }
}
```

## Enterprise Features

### 1. Custom Type System

```typescript
// Domain-specific types
namespace Domain {
  export type UserId = string & { __brand: 'UserId' };
  export type OrderId = string & { __brand: 'OrderId' };
  
  export function UserId(id: string): UserId {
    return id as UserId;
  }
  
  export function OrderId(id: string): OrderId {
    return id as OrderId;
  }
}

// Usage
function getOrder(userId: Domain.UserId, orderId: Domain.OrderId) {
  // Type-safe IDs prevent mixing
}
```

### 2. Migration Documentation

```markdown
# TypeScript Migration Guide

## Phase 1: Setup (Week 1)
- Install TypeScript and tooling
- Configure tsconfig.json
- Update build scripts

## Phase 2: Core Types (Week 2-3)
- Add basic type annotations
- Generate interfaces for data models
- Type utility functions

## Phase 3: Strict Mode (Week 4-5)
- Enable strict checks incrementally
- Fix type errors
- Add type guards

## Phase 4: Advanced Types (Week 6)
- Add generics where beneficial
- Implement branded types
- Create type utilities
```

## Pricing Examples

### Small Project (< 50 files)
- Basic migration: $6
- Time: 10-20 minutes
- Coverage: 80% typed

### Medium Project (50-200 files)
- Advanced migration: $25
- Time: 30-60 minutes
- Coverage: 95% typed

### Large Project (200+ files)
- Enterprise migration: $100+
- Time: 1-3 days
- Coverage: 100% typed
- Includes custom types and training

## Related Services

- [Code Generation](code-generation.md) - Generate TypeScript from specs
- [API Generator](api-generator.md) - Create type-safe APIs
- [Test Generator](test-generator.md) - Generate typed tests
- [Refactor Service](refactor-service.md) - Improve TypeScript code

---

*Type safety without the manual effort. Let AI handle your TypeScript migration.*
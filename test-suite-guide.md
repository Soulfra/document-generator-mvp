# Test Suite Guide

## 🧪 Overview

The Document Generator includes comprehensive testing capabilities to ensure system reliability, character behavior validation, and production readiness. This guide covers all testing approaches and tools.

## 🎯 Test Categories

### 1. Unit Tests
Individual component testing in isolation

### 2. Integration Tests
Testing interactions between services

### 3. End-to-End Tests
Complete workflow testing from document to MVP

### 4. Character Tests
Validating character behaviors and decisions

### 5. Performance Tests
Load testing and optimization validation

### 6. Security Tests
Vulnerability scanning and penetration testing

## 🚀 Quick Test Commands

```bash
# Run all tests
npm test

# Run specific test category
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:character
npm run test:performance
npm run test:security

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run production validation tests
npm run test:production
```

## 📁 Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── services/           # Service tests
│   ├── utils/              # Utility tests
│   └── characters/         # Character logic tests
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   ├── database/          # Database integration
│   └── character-api/     # Character API tests
├── e2e/                   # End-to-end tests
│   ├── document-flow/     # Document processing
│   ├── mvp-generation/    # MVP creation
│   └── character-workflow/# Character workflows
├── performance/           # Performance tests
│   ├── load/             # Load testing
│   ├── stress/           # Stress testing
│   └── optimization/     # Performance validation
├── security/             # Security tests
│   ├── ralph-tests/      # Ralph's security tests
│   └── penetration/      # Penetration tests
└── fixtures/             # Test data and mocks
```

## 🧪 Unit Tests

### Service Tests
```javascript
// tests/unit/services/document-parser.test.js
describe('DocumentParser', () => {
  let parser;
  
  beforeEach(() => {
    parser = new DocumentParser();
  });
  
  describe('parseMarkdown', () => {
    it('should extract sections from markdown', () => {
      const markdown = '# Title\n## Section\nContent';
      const result = parser.parseMarkdown(markdown);
      
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].title).toBe('Title');
    });
    
    it('should handle code blocks', () => {
      const markdown = '```js\nconst x = 1;\n```';
      const result = parser.parseMarkdown(markdown);
      
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].language).toBe('js');
    });
  });
});
```

### Character Unit Tests
```javascript
// tests/unit/characters/ralph.test.js
describe('Ralph - Chaos Engineer', () => {
  let ralph;
  
  beforeEach(() => {
    ralph = new Ralph();
  });
  
  it('should apply aggressive testing approach', () => {
    const task = { type: 'test', target: 'auth-system' };
    const approach = ralph.determineApproach(task);
    
    expect(approach.intensity).toBe('aggressive');
    expect(approach.methods).toContain('chaos-engineering');
  });
  
  it('should prioritize security vulnerabilities', () => {
    const issues = [
      { type: 'performance', severity: 'medium' },
      { type: 'security', severity: 'low' }
    ];
    
    const prioritized = ralph.prioritizeIssues(issues);
    expect(prioritized[0].type).toBe('security');
  });
});
```

## 🔄 Integration Tests

### API Integration Tests
```javascript
// tests/integration/api/character-api.test.js
describe('Character API Integration', () => {
  let app;
  
  beforeAll(async () => {
    app = await startTestServer();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('POST /api/characters/:name/process', () => {
    it('should process task with specified character', async () => {
      const response = await request(app)
        .post('/api/characters/alice/process')
        .send({
          task: 'design_architecture',
          document: 'System requirements...'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.character).toBe('alice');
      expect(response.body.analysis).toBeDefined();
    });
    
    it('should handle character collaboration', async () => {
      const response = await request(app)
        .post('/api/characters/collaborate')
        .send({
          task: 'build_feature',
          characters: ['alice', 'bob'],
          workflow: 'sequential'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.collaboration).toBeDefined();
      expect(response.body.collaboration.alice).toBeDefined();
      expect(response.body.collaboration.bob).toBeDefined();
    });
  });
});
```

### Database Integration Tests
```javascript
// tests/integration/database/character-persistence.test.js
describe('Character Database Integration', () => {
  beforeEach(async () => {
    await db.migrate.latest();
    await db.seed.run();
  });
  
  afterEach(async () => {
    await db.migrate.rollback();
  });
  
  it('should persist character decisions', async () => {
    const decision = await characterDB.saveDecision({
      character: 'alice',
      task: 'architecture_design',
      decision: 'microservices',
      reasoning: 'Scalability requirements'
    });
    
    const retrieved = await characterDB.getDecision(decision.id);
    expect(retrieved.character).toBe('alice');
    expect(retrieved.decision).toBe('microservices');
  });
});
```

## 🎭 End-to-End Tests

### Document to MVP Flow
```javascript
// tests/e2e/document-flow/complete-flow.test.js
describe('Document to MVP E2E', () => {
  it('should transform business plan to working MVP', async () => {
    // Step 1: Upload document
    const uploadResponse = await api.post('/api/documents/upload')
      .attach('file', 'tests/fixtures/business-plan.pdf');
    
    expect(uploadResponse.status).toBe(200);
    const documentId = uploadResponse.body.id;
    
    // Step 2: Process with characters
    const processResponse = await api.post('/api/documents/process')
      .send({ documentId, workflow: 'full' });
    
    expect(processResponse.status).toBe(200);
    const jobId = processResponse.body.jobId;
    
    // Step 3: Wait for completion
    await waitForJob(jobId);
    
    // Step 4: Get MVP result
    const mvpResponse = await api.get(`/api/mvps/${jobId}`);
    
    expect(mvpResponse.status).toBe(200);
    expect(mvpResponse.body.status).toBe('ready');
    expect(mvpResponse.body.deploymentUrl).toBeDefined();
    expect(mvpResponse.body.files).toBeArrayOfSize(10);
  });
});
```

### Character Workflow E2E
```javascript
// tests/e2e/character-workflow/collaboration.test.js
describe('Character Collaboration E2E', () => {
  it('should complete authentication system build', async () => {
    const workflow = {
      task: 'build_authentication',
      characters: ['eve', 'alice', 'bob', 'ralph', 'frank'],
      document: loadFixture('auth-requirements.md')
    };
    
    // Execute workflow
    const result = await characterWorkflow.execute(workflow);
    
    // Verify each character's contribution
    expect(result.eve.exploration).toContain('oauth2');
    expect(result.alice.architecture).toContain('jwt');
    expect(result.bob.implementation).toContain('passport');
    expect(result.ralph.vulnerabilities).toHaveLength(0);
    expect(result.frank.productionReady).toBe(true);
    
    // Verify final output
    expect(result.files).toContain('auth.service.js');
    expect(result.tests).toContain('auth.test.js');
    expect(result.documentation).toBeDefined();
  });
});
```

## 🚦 Performance Tests

### Load Testing
```javascript
// tests/performance/load/character-load.test.js
describe('Character System Load Test', () => {
  it('should handle 100 concurrent requests', async () => {
    const requests = Array(100).fill(null).map((_, i) => ({
      character: ['alice', 'bob', 'charlie'][i % 3],
      task: `task_${i}`,
      document: 'Test document'
    }));
    
    const start = Date.now();
    const results = await Promise.all(
      requests.map(req => 
        api.post(`/api/characters/${req.character}/process`)
          .send(req)
      )
    );
    const duration = Date.now() - start;
    
    // All requests should succeed
    expect(results.every(r => r.status === 200)).toBe(true);
    
    // Should complete within 30 seconds
    expect(duration).toBeLessThan(30000);
    
    // Average response time should be reasonable
    const avgResponseTime = duration / requests.length;
    expect(avgResponseTime).toBeLessThan(300);
  });
});
```

### Stress Testing
```javascript
// tests/performance/stress/system-stress.test.js
describe('System Stress Test', () => {
  it('should handle Ralph breaking everything', async () => {
    const stressTest = {
      character: 'ralph',
      task: 'stress_test_everything',
      targets: [
        'database_connections',
        'api_endpoints',
        'character_system',
        'file_system'
      ]
    };
    
    const result = await ralph.executeStressTest(stressTest);
    
    // System should survive Ralph's assault
    expect(result.systemCrashed).toBe(false);
    expect(result.servicesRecovered).toBe(true);
    expect(result.dataIntegrity).toBe('maintained');
  });
});
```

## 🔒 Security Tests

### Ralph's Security Suite
```javascript
// tests/security/ralph-tests/penetration.test.js
describe('Ralph Security Tests', () => {
  let ralph;
  
  beforeAll(() => {
    ralph = new RalphSecurityTester();
  });
  
  it('should detect SQL injection vulnerabilities', async () => {
    const endpoints = await api.get('/api/endpoints');
    const vulnerabilities = [];
    
    for (const endpoint of endpoints.body) {
      const result = await ralph.testSQLInjection(endpoint);
      if (result.vulnerable) {
        vulnerabilities.push(result);
      }
    }
    
    expect(vulnerabilities).toHaveLength(0);
  });
  
  it('should validate authentication security', async () => {
    const authTests = [
      'jwt_token_validation',
      'session_hijacking',
      'brute_force_protection',
      'password_strength'
    ];
    
    for (const test of authTests) {
      const result = await ralph.testAuthentication(test);
      expect(result.secure).toBe(true);
    }
  });
});
```

## 🎬 Test Utilities

### Test Helpers
```javascript
// tests/helpers/character-helpers.js
export const mockCharacterResponse = (character, response) => {
  jest.spyOn(characterAPI, 'process')
    .mockImplementation(async (char, task) => {
      if (char === character) {
        return response;
      }
      return originalImplementation(char, task);
    });
};

export const waitForCharacterConsensus = async (characters) => {
  const timeout = 30000;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const statuses = await Promise.all(
      characters.map(c => characterAPI.getStatus(c))
    );
    
    if (statuses.every(s => s.ready)) {
      return true;
    }
    
    await sleep(1000);
  }
  
  throw new Error('Character consensus timeout');
};
```

### Test Fixtures
```javascript
// tests/fixtures/documents.js
export const testDocuments = {
  businessPlan: loadFixture('business-plan.md'),
  technicalSpec: loadFixture('technical-spec.md'),
  chatLog: loadFixture('chat-export.json'),
  requirements: loadFixture('requirements.pdf')
};

export const expectedOutputs = {
  mvpStructure: {
    files: ['index.js', 'package.json', 'README.md'],
    directories: ['src', 'tests', 'docs'],
    deployable: true
  }
};
```

## 📊 Test Coverage

### Coverage Requirements
- **Unit Tests**: 80% minimum
- **Integration Tests**: 70% minimum
- **E2E Tests**: Critical paths covered
- **Character Tests**: All character behaviors
- **Security Tests**: All endpoints validated

### Generate Coverage Report
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:coverage:check
```

## 🚀 Continuous Testing

### Pre-commit Tests
```json
// .husky/pre-commit
{
  "hooks": {
    "pre-commit": "npm run test:unit && npm run test:integration"
  }
}
```

### CI/CD Pipeline Tests
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:security
      - run: npm run test:coverage:check
```

## 🎯 Production Validation Tests

### Pre-deployment Checklist
```javascript
// tests/production/validation.test.js
describe('Production Validation', () => {
  it('should pass all production checks', async () => {
    const checks = [
      'database_migrations_current',
      'environment_variables_set',
      'ssl_certificates_valid',
      'api_keys_configured',
      'character_system_ready',
      'monitoring_active',
      'backup_system_operational'
    ];
    
    for (const check of checks) {
      const result = await productionValidator.check(check);
      expect(result.passed).toBe(true);
    }
  });
});
```

## 🔧 Troubleshooting Tests

### Common Test Issues

#### 1. Character API Timeout
```javascript
// Increase timeout for character tests
jest.setTimeout(30000); // 30 seconds

// Or per test
it('should handle complex task', async () => {
  // test code
}, 60000);
```

#### 2. Database Connection Issues
```javascript
// Ensure test database is clean
beforeEach(async () => {
  await db.raw('TRUNCATE TABLE characters CASCADE');
});
```

#### 3. Flaky E2E Tests
```javascript
// Add retries for flaky tests
jest.retryTimes(3, { logErrorsBeforeRetry: true });
```

## 📝 Writing New Tests

### Test Template
```javascript
// tests/category/feature.test.js
describe('Feature Name', () => {
  let testSubject;
  
  beforeEach(() => {
    // Setup
    testSubject = new Feature();
  });
  
  afterEach(() => {
    // Cleanup
    jest.clearAllMocks();
  });
  
  describe('method name', () => {
    it('should do expected behavior', async () => {
      // Arrange
      const input = { test: 'data' };
      
      // Act
      const result = await testSubject.method(input);
      
      // Assert
      expect(result).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
    });
  });
});
```

---

*Testing: Where Ralph gets to break everything... safely*
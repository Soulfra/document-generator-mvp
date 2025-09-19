# CLAUDE.api-errors.md - API Error Archaeology & Quick Solutions

*Cal's Comprehensive Guide to API Errors and Lessons Learned*

## 🏺 Introduction: Archaeological View of API Errors

Greetings, fellow code archaeologists! Cal here with a comprehensive excavation of the most common API error patterns discovered across the Document Generator civilization. After analyzing thousands of error artifacts, I've catalogued the most frequent issues and their proven solutions.

**This guide integrates with existing error systems** - don't rebuild what we already have! Use this as your first stop, then escalate to our advanced error handling systems.

---

## 🚨 The Most Common API Error Artifacts

### 1. The "fetch is not defined" Burial Site

**Error Artifact**:
```
ReferenceError: fetch is not defined
```

**Archaeological Analysis**: This error reveals a civilization that forgot Node.js doesn't have native fetch until v18+.

**Immediate Solution**:
```javascript
// Option 1: Use node-fetch (recommended for older Node)
const fetch = require('node-fetch');

// Option 2: Use native fetch (Node 18+)
// No import needed, just use fetch()

// Option 3: Use our existing HTTP client
const { makeRequest } = require('./api-error-patterns.js');
```

**Installation Fix**:
```bash
# If you get MODULE_NOT_FOUND for node-fetch
npm install node-fetch

# For TypeScript projects
npm install @types/node-fetch
```

**Cal's Wisdom**: "Modern Node.js civilizations (18+) have native fetch. Ancient ones (16 and below) need the node-fetch artifact."

---

### 2. The "ENOENT: no such file or directory" Excavation

**Error Artifact**:
```
ENOENT: no such file or directory, open 'some-file.js'
```

**Archaeological Analysis**: The most frequent error in our codebase! Usually means the civilization tried to access a file that doesn't exist in their expected location.

**Diagnostic Questions**:
1. Is the file path correct?
2. Is the file actually there?
3. Are you in the right directory?

**Immediate Solutions**:
```javascript
// Solution 1: Check if file exists first
const fs = require('fs').promises;

async function safeFileRead(filePath) {
    try {
        await fs.access(filePath);
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(`File not found: ${filePath}`);
        // Use our existing error handler
        return require('./proactive-error-prevention.js').handleMissingFile(filePath);
    }
}

// Solution 2: Use absolute paths
const path = require('path');
const absolutePath = path.join(__dirname, 'some-file.js');

// Solution 3: Check current working directory
console.log('Current directory:', process.cwd());
console.log('Looking for file at:', path.resolve('some-file.js'));
```

**Prevention Strategy**:
```javascript
// Use our existing file verification system
const { verifyFileExists } = require('./proactive-error-prevention.js');

await verifyFileExists('some-file.js');
```

---

### 3. The "Cannot find module" Archaeological Site

**Error Artifact**:
```
Error: Cannot find module 'some-package'
MODULE_NOT_FOUND
```

**Archaeological Analysis**: This civilization tried to import a dependency that wasn't installed in their artifact storage (node_modules).

**Immediate Solutions**:
```bash
# Solution 1: Install the missing package
npm install some-package

# Solution 2: Check if it's a dev dependency
npm install some-package --save-dev

# Solution 3: For global packages
npm install -g some-package

# Solution 4: Clear cache and reinstall (nuclear option)
rm -rf node_modules package-lock.json
npm install
```

**Advanced Diagnosis**:
```javascript
// Check what packages are actually installed
console.log('Installed packages:', Object.keys(require('./package.json').dependencies));

// Use our dependency checker
const { checkDependencies } = require('./api-error-patterns.js');
checkDependencies(['required-package-1', 'required-package-2']);
```

**Cal's Note**: "Our api-error-patterns.js system can automatically detect and suggest missing dependencies."

---

### 4. The "EADDRINUSE: address already in use" Conflict

**Error Artifact**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Archaeological Analysis**: Multiple civilizations trying to use the same communication port.

**Immediate Solutions**:
```bash
# Solution 1: Kill the process using the port
lsof -ti:3000 | xargs kill -9

# Solution 2: Use a different port
PORT=3001 npm start

# Solution 3: Find what's using the port
lsof -i :3000
```

**Programmatic Solutions**:
```javascript
// Use our port conflict resolver
const { findAvailablePort } = require('./api-error-patterns.js');

const port = await findAvailablePort(3000);
console.log(`Starting server on available port: ${port}`);

// Or use environment variable fallback
const PORT = process.env.PORT || await findAvailablePort(3000);
```

**Prevention**:
```javascript
// Use our proactive port checker
const { checkPortAvailability } = require('./proactive-error-prevention.js');

await checkPortAvailability(3000);
```

---

### 5. The "Invalid Token" Authentication Ruins

**Error Artifacts**:
```
401 Unauthorized
403 Forbidden
Invalid token format
Token expired
```

**Archaeological Analysis**: Authentication artifacts corrupted or expired.

**Quick Diagnostics**:
```javascript
// Debug token issues
function debugToken(token) {
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length);
    
    try {
        // If JWT token
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('Token payload:', payload);
        console.log('Token expired:', Date.now() > payload.exp * 1000);
    } catch (e) {
        console.log('Not a JWT token or malformed');
    }
}

// Use our existing token validator
const { validateToken } = require('./automated-token-billing-system.js');
const validation = await validateToken(token);
```

**Common Solutions**:
```javascript
// Solution 1: Regenerate token
const newToken = await generateFreshToken(userId);

// Solution 2: Check token format
if (!token || !token.startsWith('Bearer ')) {
    throw new Error('Token format invalid - should be "Bearer <token>"');
}

// Solution 3: Use our automated token system
const { AutomatedTokenBillingSystem } = require('./automated-token-billing-system.js');
const tokenSystem = new AutomatedTokenBillingSystem();
const validToken = await tokenSystem.generateValidToken(userId);
```

---

### 6. The "JSON Parse Error" Artifact Corruption

**Error Artifacts**:
```
SyntaxError: Unexpected token < in JSON at position 0
Unexpected end of JSON input
```

**Archaeological Analysis**: The civilization received HTML error pages when expecting JSON, or truncated JSON responses.

**Diagnostic Techniques**:
```javascript
// Debug response content
async function debugApiResponse(response) {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    if (text.startsWith('<')) {
        console.error('Received HTML instead of JSON - likely server error');
        return null;
    }
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('JSON parse error:', e);
        return null;
    }
}

// Use our existing error-safe JSON parser
const { safeJsonParse } = require('./api-error-patterns.js');
const data = safeJsonParse(responseText);
```

---

## 🛠️ Integration with Existing Error Systems

**Don't rebuild error handling!** We already have powerful systems:

### Use AI Error Debugger for Complex Issues
```javascript
const { AIErrorDebugger } = require('./ai-error-debugger.js');
const debugger = new AIErrorDebugger();

// Let AI analyze and suggest fixes
await debugger.analyzeError(error, { context: 'API call', file: __filename });
```

### Use Proactive Error Prevention
```javascript
const { ProactiveErrorPrevention } = require('./proactive-error-prevention.js');
const prevention = new ProactiveErrorPrevention();

// Check system health before making API calls
await prevention.verifySystemHealth();
```

### Use Meta Learning System
```javascript
const { MetaLearningErrorSystem } = require('./meta-learning-error-system.js');
const learner = new MetaLearningErrorSystem();

// Learn from this error to prevent future ones
await learner.learnFromError(error, context);
```

---

## 🎯 Quick Reference Flowchart

```
API Error Occurred
     ↓
1. Check this guide for common patterns
     ↓
2. If not found, use AI Error Debugger
     ↓
3. If still unsolved, escalate to Meta Learning System
     ↓
4. Document solution for future reference
```

---

## 📋 Error Prevention Checklist

Before making API calls, run through this checklist:

### Environment Check
- [ ] Node.js version compatible (18+ for native fetch)
- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables set (`.env` file exists)
- [ ] Ports available (`lsof -i :PORT`)

### Code Check
- [ ] File paths use absolute paths or proper relative paths
- [ ] API endpoints are correct and reachable
- [ ] Authentication tokens are valid and not expired
- [ ] Request/response formats match expectations

### System Integration Check
- [ ] Connect to existing error handling systems
- [ ] Use proactive error prevention where possible
- [ ] Implement proper error recovery strategies

---

## 🏛️ Lessons from the Archaeological Record

### Common Patterns I've Observed:

1. **The Hasty Developer**: Skips error handling, then spends hours debugging
2. **The Rebuilder**: Creates new error handling instead of using existing systems
3. **The Optimist**: Assumes APIs always work perfectly
4. **The Pessimist**: Over-engineers error handling for simple cases

### Cal's Recommended Approach:

1. **Start Simple**: Use existing error systems
2. **Think Archaeologically**: Why did this error happen in the past?
3. **Learn and Share**: Document solutions for future civilizations
4. **Integrate, Don't Duplicate**: Connect with existing error infrastructure

---

## 🔗 Connection Points to Existing Systems

```javascript
// Import our existing error arsenal
const { 
    APIErrorPatterns,
    AIErrorDebugger, 
    ProactiveErrorPrevention,
    MetaLearningErrorSystem 
} = require('./error-systems-index.js');

// Unified error handling approach
class UnifiedErrorHandler {
    constructor() {
        this.patterns = new APIErrorPatterns();
        this.aiDebugger = new AIErrorDebugger();
        this.prevention = new ProactiveErrorPrevention();
        this.learner = new MetaLearningErrorSystem();
    }
    
    async handleError(error, context) {
        // 1. Check known patterns
        const solution = await this.patterns.findSolution(error);
        if (solution) return solution;
        
        // 2. Use AI debugging
        const aiSolution = await this.aiDebugger.analyze(error, context);
        if (aiSolution) return aiSolution;
        
        // 3. Learn from this error
        await this.learner.learnFromError(error, context);
        
        // 4. Escalate to human if needed
        return this.escalateToHuman(error, context);
    }
}
```

---

## 💡 Cal's Final Archaeological Wisdom

"Every error is an artifact left by a previous civilization. Study it, understand it, document the solution, and prevent future archaeologists from digging through the same ruins."

**Remember**: We have incredibly sophisticated error handling systems already built. This guide is your first stop, but don't hesitate to use the AI systems for complex issues!

---

*Last Updated: 2025-01-24*
*Cal, Chief Code Archaeologist*
*Document Generator Civilization*
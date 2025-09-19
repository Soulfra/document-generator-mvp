# Visual Experiment Documentation Templates

> "A picture is worth a thousand words, but a well-documented experiment is priceless."

This document provides templates for visual documentation of experiments, ensuring consistency and completeness in our scientific approach to debugging and development.

## Template Categories

### 1. Debugging Experiment Template

```markdown
# EXPERIMENT: [Title]

## Visual Summary
┌─────────────────────────────────────────────────────────────┐
│ BEFORE                     │ AFTER                          │
├─────────────────────────────────────────────────────────────┤
│ [Initial State Screenshot] │ [Final State Screenshot]       │
│                           │                                │
│ Health: 75%               │ Health: 100%                   │
│ Status: ❌ Failed          │ Status: ✅ Passing             │
└─────────────────────────────────────────────────────────────┘

## Problem Statement
**Service**: [Service Name]
**Status**: [Current Status]
**Impact**: [What's broken]
**Visual Evidence**: [Screenshot/Bitmap Reference]

## Hypothesis
> "I believe [problem] is caused by [root cause] because [reasoning]."

### Success Criteria
- [ ] Service connects successfully
- [ ] Health check passes
- [ ] No errors in logs
- [ ] Visual confirmation in dashboard

## Methodology

### Step 1: Initial State Capture
```bash
# Capture current state
[command to check status]
```
📸 **Visual Proof**: `experiment-[id]-initial.png`

### Step 2: Investigation
```bash
# Check logs
[log checking command]

# Test connections
[connection test command]
```
📸 **Visual Proof**: `experiment-[id]-investigation.png`

### Step 3: Apply Fix
```bash
# Make change
[fix command]
```
📸 **Visual Proof**: `experiment-[id]-fix-applied.png`

### Step 4: Verify Results
```bash
# Verify fix
[verification command]
```
📸 **Visual Proof**: `experiment-[id]-verified.png`

## Results

### Measurements
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Health | 75% | 100% | +25% |
| Response Time | 500ms | 50ms | -450ms |
| Error Rate | 25% | 0% | -25% |

### Visual Comparison
```
Before Fix:                    After Fix:
████████████████░░░░░░░░      ████████████████████████
████████████████░░░░░░░░      ████████████████████████
████████████████░░░░░░░░      ████████████████████████
75% Healthy (9/12)            100% Healthy (12/12)
```

## Conclusion
✅ **Hypothesis Validated**: [Yes/No]

### Key Learnings
1. [Learning 1]
2. [Learning 2]
3. [Learning 3]

### Future Improvements
- [Improvement 1]
- [Improvement 2]

## Reproducibility
**Score**: [X]%
**Steps to Reproduce**: See methodology above
**Environment**: [OS, Node version, etc.]
**QR Code**: [QR code image]
```

### 2. Performance Experiment Template

```markdown
# PERFORMANCE EXPERIMENT: [Title]

## Performance Profile
```
┌─────────────────────────────────────────────────────┐
│ Response Time Over Time                             │
│                                                     │
│ 500ms ┤ ██                                         │
│ 400ms ┤ ████                                       │
│ 300ms ┤ ██████▄                                    │
│ 200ms ┤ ████████▄▄                                 │
│ 100ms ┤ ███████████▄▄▄▄____________________       │
│   0ms └─────────────────────────────────────────── │
│       Before      During        After               │
└─────────────────────────────────────────────────────┘
```

## Baseline Metrics
📸 **Screenshot**: `perf-baseline-[timestamp].png`

| Metric | Value | Target |
|--------|-------|--------|
| Response Time (p50) | [X]ms | <100ms |
| Response Time (p95) | [X]ms | <500ms |
| Response Time (p99) | [X]ms | <1000ms |
| Throughput | [X] req/s | >100 req/s |
| Error Rate | [X]% | <1% |

## Optimization Applied
```javascript
// Before
[code before optimization]

// After
[code after optimization]
```

## Results Dashboard
📸 **Screenshot**: `perf-results-[timestamp].png`

### Performance Gains
```
┌─────────────────────────┬─────────┬─────────┬─────────┐
│ Metric                  │ Before  │ After   │ Gain    │
├─────────────────────────┼─────────┼─────────┼─────────┤
│ Avg Response Time       │ 450ms   │ 45ms    │ -90%    │
│ Memory Usage            │ 512MB   │ 256MB   │ -50%    │
│ CPU Usage               │ 80%     │ 20%     │ -75%    │
│ Cache Hit Rate          │ 0%      │ 95%     │ +95%    │
└─────────────────────────┴─────────┴─────────┴─────────┘
```
```

### 3. Integration Experiment Template

```markdown
# INTEGRATION EXPERIMENT: [Component A] ↔ [Component B]

## System Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Component A │────▶│  Event Bus  │────▶│ Component B │
└─────────────┘     └─────────────┘     └─────────────┘
       ↓                    ↓                    ↓
   [Status: ✅]        [Status: ❓]        [Status: ❌]
```

## Integration Points
📸 **Visual Map**: `integration-map-[id].png`

1. **API Endpoint**: `/api/integrate`
2. **Event Types**: `document.processed`, `template.matched`
3. **Data Format**: JSON with schema validation

## Test Sequence

### Test 1: Basic Connection
```bash
# Send test message
curl -X POST http://localhost:3000/api/test
```
📸 **Result**: `test1-result.png`
✅ **Status**: Passed

### Test 2: Data Flow
```javascript
// Test data flow
const testData = { /* test payload */ };
await sendTestData(testData);
```
📸 **Result**: `test2-result.png`
❌ **Status**: Failed - Timeout

### Test 3: Error Handling
```javascript
// Test error scenarios
await testErrorScenarios();
```
📸 **Result**: `test3-result.png`
✅ **Status**: Passed

## Integration Matrix
```
         Component B
     │ API │ Event │ Direct │
─────┼─────┼───────┼────────┤
  A  │  ✅  │  ❌   │   ✅   │ Component A
  P  │─────┼───────┼────────┤
  I  │  ✅  │  ✅   │   ❌   │ Event Bus
     │─────┼───────┼────────┤
     │  ❌  │  ✅   │   ✅   │ Direct Call
```
```

### 4. Visual Debug Session Template

```markdown
# DEBUG SESSION: [Issue Title]

## Debug Timeline
```
10:00 ├── Problem Reported
      │   📸 initial-state.png
10:15 ├── Investigation Started
      │   📸 logs-analysis.png
10:30 ├── Root Cause Identified
      │   📸 error-highlighted.png
10:45 ├── Fix Applied
      │   📸 fix-in-progress.png
11:00 └── Issue Resolved
          📸 final-verification.png
```

## Visual Debug Flow

### 1. Error State
```
┌─────────────────────────────────────┐
│ ERROR CONSOLE                       │
├─────────────────────────────────────┤
│ TypeError: Cannot read property     │
│ 'connect' of undefined              │
│   at SystemBus.init (bus.js:42)    │
│                                     │
│ [Stack trace continues...]          │
└─────────────────────────────────────┘
```
📸 **Screenshot**: `error-console.png`

### 2. Code Investigation
```javascript
// Found problematic code at line 42
this.connection.connect(); // ❌ this.connection is undefined

// Root cause: Missing initialization
// this.connection was never created
```
📸 **Screenshot**: `code-investigation.png`

### 3. Fix Implementation
```javascript
// Added initialization
constructor() {
  this.connection = new Connection(); // ✅ Fixed
}
```
📸 **Screenshot**: `fix-applied.png`

### 4. Verification
```
┌─────────────────────────────────────┐
│ SUCCESS: All services connected     │
├─────────────────────────────────────┤
│ ✅ Document Processing              │
│ ✅ AI Integration                   │
│ ✅ Template Matching                │
│ ✅ System Bus                       │
│ ✅ Cache Service                    │
│ ✅ Monitoring                       │
└─────────────────────────────────────┘
```
📸 **Screenshot**: `verification-success.png`
```

### 5. Bitmap Health Visualization Template

```markdown
# SYSTEM HEALTH VISUALIZATION

## Health Grid (32×12)
```
Current State: 75% Healthy (288/384 cells)

    0   4   8   12  16  20  24  28  32
  0 ████████████████████████████████
  1 ████████████████████████████████
  2 ████████████████████████████████
  3 ████████████████████████████████
  4 ████████████████████████████████
  5 ████████████████████████████████
  6 ████████████████████████████████
  7 ████████████████████████████████
  8 ████████████████████████████████
  9 ████████████████████░░░░░░░░░░░░
 10 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
 11 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Legend:
█ = Healthy (Green #10B981)
░ = Failed (Red #EF4444)
```

## Service Mapping
```
Rows 0-1: Core Services
  - Document Processing (✅)
  - Template Engine (✅)
  
Rows 2-3: AI Services  
  - Local Ollama (✅)
  - Cloud Fallback (✅)
  
Rows 4-5: Data Services
  - PostgreSQL (✅)
  - Redis Cache (✅)
  
Rows 6-7: Integration
  - Event Bus (✅)
  - WebSocket (✅)
  
Rows 8-9: Monitoring
  - Health Checks (✅)
  - Analytics (⚠️)
  
Rows 10-11: Extensions
  - System Bus (❌)
  - Custom Services (❌)
```
```

## Visual Experiment Tools

### Screenshot Capture Script
```javascript
// capture-experiment-visual.js
const puppeteer = require('puppeteer');

async function captureExperimentVisual(experimentId, stage) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8080/dashboard');
  await page.screenshot({
    path: `experiments/visuals/exp-${experimentId}-${stage}.png`,
    fullPage: true
  });
  
  await browser.close();
}
```

### Bitmap Generator
```javascript
// generate-health-bitmap.js
function generateHealthBitmap(health) {
  const width = 32;
  const height = 12;
  const total = width * height;
  const healthy = Math.floor(total * health / 100);
  
  let bitmap = '';
  for (let i = 0; i < total; i++) {
    if (i % width === 0) bitmap += '\n';
    bitmap += i < healthy ? '█' : '░';
  }
  
  return bitmap;
}
```

### Visual Diff Tool
```javascript
// visual-diff.js
const { imgDiff } = require('img-diff-js');

async function compareVisuals(before, after) {
  const result = await imgDiff({
    actualFilename: after,
    expectedFilename: before,
    diffFilename: 'diff.png',
  });
  
  return {
    identical: result.imagesAreSame,
    diffPixels: result.diffCount,
    diffPercent: result.diffPercent
  };
}
```

## Best Practices for Visual Documentation

### DO:
✅ Capture before AND after states
✅ Highlight important areas with annotations
✅ Use consistent naming: `experiment-[id]-[stage].png`
✅ Include timestamps in screenshots
✅ Show error messages clearly
✅ Use visual diffs for comparisons
✅ Create side-by-side comparisons

### DON'T:
❌ Use low-quality compressed images
❌ Crop out important context
❌ Forget to redact sensitive data
❌ Use inconsistent color schemes
❌ Skip visual documentation
❌ Delete experiment visuals

## Visual Storytelling

### The Three-Act Structure
1. **Setup**: Show the problem visually
2. **Confrontation**: Document the debugging process
3. **Resolution**: Prove the fix works

### Example Story Arc
```
Act 1: The Problem
├── Dashboard shows 75% health
├── Three services failing
└── 📸 problem-state.png

Act 2: The Investigation  
├── Check logs → Find error
├── Trace code → Find bug
├── Test hypothesis → Confirm
└── 📸 investigation-[1-3].png

Act 3: The Resolution
├── Apply fix → Test
├── Verify results → Success
├── Document learnings
└── 📸 resolution-final.png
```

## Automated Visual Documentation

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Capture current state before commit
node capture-system-state.js "pre-commit-$(date +%s)"
```

### CI/CD Integration
```yaml
# .github/workflows/visual-tests.yml
name: Visual Testing
on: [push, pull_request]

jobs:
  visual-tests:
    steps:
      - name: Capture Visual State
        run: npm run capture-visuals
      
      - name: Compare to Baseline
        run: npm run visual-regression
      
      - name: Upload Results
        uses: actions/upload-artifact@v2
        with:
          name: visual-test-results
          path: visual-tests/
```

---

*"The best debugging tool is still careful thought, coupled with judiciously placed print statements." - Brian Kernighan*

*But we'll take screenshots too, just to be sure.*

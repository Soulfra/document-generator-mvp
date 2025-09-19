# Experiment Execution Guide

> "Experimentation is the least arrogant method of gaining knowledge." - Isaac Asimov

This guide teaches you how to use the Experiment Journal System to debug, optimize, and improve the Document Generator using Pascal's scientific method.

## 🧪 What is an Experiment?

In our system, an experiment is:
- A structured approach to solving a problem
- A documented journey from hypothesis to conclusion
- A visual record of changes and outcomes
- A reusable solution for future issues

## 🎯 When to Create an Experiment

Create an experiment when you:
- ❌ Encounter a bug or failure
- 🐢 Notice performance issues
- 🤔 Don't understand how something works
- 🔧 Want to optimize a component
- 🧩 Need to integrate new features

## 📚 Experiment Types

### 1. Debugging Experiments
**Purpose**: Fix broken functionality
```javascript
{
  type: 'debugging',
  when: 'Service failing, errors in logs, unexpected behavior',
  example: 'System Bus Service not connecting'
}
```

### 2. Performance Experiments  
**Purpose**: Optimize speed and efficiency
```javascript
{
  type: 'performance',
  when: 'Slow responses, high CPU/memory, timeouts',
  example: 'Document processing taking >30 seconds'
}
```

### 3. Integration Experiments
**Purpose**: Connect components successfully
```javascript
{
  type: 'integration', 
  when: 'Components not communicating, data not flowing',
  example: 'Event bus not routing messages'
}
```

### 4. Educational Experiments
**Purpose**: Learn and document behavior
```javascript
{
  type: 'educational',
  when: 'Unclear documentation, unknown behavior',
  example: 'How does template matching work?'
}
```

## 🚀 Quick Start: Your First Experiment

### Step 1: Create the Experiment
```bash
./experiment-journal-cli.js create \
  --title "Debug Analytics Memory Leak" \
  --category "debugging" \
  --problem "Analytics service crashes after 10 minutes" \
  --hypothesis "Unbounded array growth causing memory exhaustion" \
  --expected "Service runs stable for hours"
```

**Output:**
```
✅ Created experiment: a7b9c3d4-5e6f-7890-abcd-ef1234567890

Title: Debug Analytics Memory Leak
Category: debugging

Next steps:
1. Start: node experiment-journal-cli.js start a7b9c3d4
2. Log findings as you work
3. Complete when done
```

### Step 2: Start the Experiment
```bash
./experiment-journal-cli.js start a7b9c3d4
```

**Output:**
```
🔬 Starting experiment: Debug Analytics Memory Leak
Started at: 10:45:23 AM

Logging enabled. Use these commands:
- Log: node experiment-journal-cli.js log a7b9c3d4 "message"
- Measure: node experiment-journal-cli.js measure a7b9c3d4 metric value unit
- Visual: node experiment-journal-cli.js visual a7b9c3d4 "description"
```

### Step 3: Document Your Investigation
```bash
# Check current memory usage
./experiment-journal-cli.js measure a7b9c3d4 memory_before 512 MB

# Log what you find
./experiment-journal-cli.js log a7b9c3d4 "Found growing array in analytics.js:142"

# Capture visual proof
./experiment-journal-cli.js visual a7b9c3d4 "memory-leak-profiler"
```

### Step 4: Apply and Test Fix
```bash
# Log the fix
./experiment-journal-cli.js log a7b9c3d4 "Added array size limit: maxDataPoints = 10000"

# Measure after fix
./experiment-journal-cli.js measure a7b9c3d4 memory_after 145 MB

# Visual confirmation
./experiment-journal-cli.js visual a7b9c3d4 "memory-stable-after-fix"
```

### Step 5: Complete the Experiment
```bash
./experiment-journal-cli.js complete a7b9c3d4 \
  --outcome "Fixed by limiting array to 10000 items with circular buffer" \
  --validated true \
  --learnings "Always bound collections,Monitor memory in production,Add cleanup intervals"
```

**Output:**
```
✅ Experiment completed!

Title: Debug Analytics Memory Leak
Duration: 45m 32s
Hypothesis Validated: Yes
Reproducibility Score: 95%

Report generated: experiments/experiment-a7b9c3d4-report.md
```

## 📊 Detailed Workflow

### 1. Problem Observation
Before creating an experiment, observe and document:

```javascript
const observation = {
  what: "Analytics service crashes",
  when: "After ~10 minutes of operation",
  where: "Production environment",
  impact: "No metrics collection",
  frequency: "Every time",
  errorMsg: "JavaScript heap out of memory"
};
```

### 2. Hypothesis Formation
State your belief about the cause:

```javascript
const hypothesis = {
  statement: "Memory leak due to unbounded array growth",
  reasoning: "Logs show steady memory increase",
  testable: true,
  alternative: "Could also be event listener leak"
};
```

### 3. Methodology Design
Plan your approach:

```javascript
const methodology = {
  steps: [
    "Profile memory usage over time",
    "Identify growing objects",
    "Trace object allocation",
    "Implement fix",
    "Verify memory stability"
  ],
  controls: [
    "Same data load",
    "Isolated environment",
    "No other services"
  ],
  tools: [
    "Chrome DevTools",
    "heapdump module",
    "memory profiler"
  ]
};
```

### 4. Execution & Logging
Document everything as you work:

```bash
# Initial state
./experiment-journal-cli.js log $ID "Starting memory: 125MB"
./experiment-journal-cli.js visual $ID "initial-heap-snapshot"

# Investigation
./experiment-journal-cli.js log $ID "Found array 'dataPoints' with 1M+ items"
./experiment-journal-cli.js log $ID "No cleanup mechanism detected"

# Fix implementation
./experiment-journal-cli.js log $ID "Implementing circular buffer pattern"
./experiment-journal-cli.js log $ID "Added maxDataPoints limit"

# Verification
./experiment-journal-cli.js measure $ID "memory_1hr" 148 MB
./experiment-journal-cli.js visual $ID "stable-memory-graph"
```

### 5. Analysis & Conclusion
Compare results to hypothesis:

```javascript
const results = {
  hypothesisValidated: true,
  actualCause: "Unbounded dataPoints array",
  solution: "Circular buffer with 10k limit",
  memoryReduction: "71% (512MB → 148MB)",
  stability: "Ran 24hrs without crash"
};

const learnings = [
  "Profile memory early in development",
  "Always limit collection sizes",
  "Implement cleanup strategies",
  "Monitor production memory usage"
];
```

## 🎨 Visual Documentation Best Practices

### What to Capture
1. **Before State** - Show the problem visually
2. **Investigation** - Screenshots of debugging tools
3. **Root Cause** - Highlight the issue
4. **Fix Applied** - Show the code change
5. **After State** - Prove it's fixed

### Visual Capture Examples
```bash
# Dashboard screenshot
./experiment-journal-cli.js visual $ID "dashboard-before-fix"

# Error logs
./experiment-journal-cli.js visual $ID "error-stacktrace"

# Profiler results
./experiment-journal-cli.js visual $ID "memory-leak-profile"

# Code diff
./experiment-journal-cli.js visual $ID "fix-implementation"

# Success proof
./experiment-journal-cli.js visual $ID "24hr-stability-test"
```

## 📈 Advanced Techniques

### 1. Comparative Experiments
Test multiple solutions:

```bash
# Create parent experiment
./experiment-journal-cli.js create --title "Compare Caching Strategies"

# Test Redis
./experiment-journal-cli.js log $ID "Testing Redis cache"
./experiment-journal-cli.js measure $ID "redis_response_time" 45 ms

# Test in-memory
./experiment-journal-cli.js log $ID "Testing in-memory cache"  
./experiment-journal-cli.js measure $ID "memory_response_time" 12 ms

# Compare and conclude
./experiment-journal-cli.js complete $ID \
  --outcome "In-memory 3.75x faster for our use case"
```

### 2. Long-Running Experiments
For performance testing:

```javascript
// Create automated logger
const longTest = setInterval(() => {
  const metrics = collectMetrics();
  
  journal.addMeasurement(experimentId, 'cpu_usage', metrics.cpu, '%');
  journal.addMeasurement(experimentId, 'memory_usage', metrics.memory, 'MB');
  journal.addMeasurement(experimentId, 'response_time', metrics.responseTime, 'ms');
}, 60000); // Every minute

// Run for 24 hours
setTimeout(() => {
  clearInterval(longTest);
  journal.completeExperiment(experimentId, results);
}, 24 * 60 * 60 * 1000);
```

### 3. Reproduction Tests
Verify fixes work elsewhere:

```bash
# Create reproduction
./experiment-journal-cli.js reproduce a7b9c3d4

# This creates a new experiment that:
# - Uses same methodology
# - Tests in different environment
# - Validates original findings
```

## 🔍 Finding Patterns

### Search Past Experiments
```bash
# Find all memory-related experiments
./experiment-journal-cli.js search "memory"

# Find successful debugging experiments
./experiment-journal-cli.js list --category debugging --validated true

# Extract patterns
./experiment-journal-cli.js patterns
```

### Pattern Output Example
```
🔍 Pattern Analysis:

🔴 Common Errors:
   Port conflict: 4 occurrences
   Memory leak: 3 occurrences
   Missing config: 3 occurrences

🟢 Successful Approaches:
   Add resource limits → Prevent memory issues
   Use config files → Avoid hardcoded values
   Implement health checks → Detect issues early
```

## 💡 Tips for Effective Experiments

### DO:
✅ Start with clear problem statement  
✅ Form specific, testable hypothesis  
✅ Change one variable at a time  
✅ Capture visual evidence throughout  
✅ Measure quantitatively when possible  
✅ Document unexpected discoveries  
✅ Share findings with team  

### DON'T:
❌ Skip hypothesis - guess randomly  
❌ Change multiple things at once  
❌ Forget to capture initial state  
❌ Ignore "unrelated" observations  
❌ Delete failed experiments  
❌ Work without logging  

## 🚨 Common Experiment Scenarios

### Scenario 1: Service Won't Start
```bash
./experiment-journal-cli.js create \
  --title "Redis Service Startup Failure" \
  --hypothesis "Missing configuration or port conflict" \
  --steps "Check logs,Verify config,Test ports,Check dependencies"
```

### Scenario 2: Slow Performance
```bash
./experiment-journal-cli.js create \
  --title "Document Processing Performance" \
  --hypothesis "No caching causing repeated AI calls" \
  --steps "Profile requests,Count API calls,Implement cache,Measure improvement"
```

### Scenario 3: Integration Failure
```bash
./experiment-journal-cli.js create \
  --title "Event Bus Message Loss" \
  --hypothesis "Messages dropped due to queue overflow" \
  --steps "Monitor queue size,Log message flow,Increase buffer,Verify delivery"
```

## 📋 Experiment Report Template

Every completed experiment generates a report:

```markdown
# Experiment Report: [Title]

## Metadata
- ID: [UUID]
- Date: [ISO Date]
- Duration: [Time]
- Category: [Type]
- Reproducibility: [Score]%

## Problem & Hypothesis
[What was broken and what we believed caused it]

## Methodology
[Steps taken to test hypothesis]

## Results
[What actually happened]

## Conclusion
[Was hypothesis correct? What did we learn?]

## Visual Evidence
[Screenshots and measurements]

## Reproduction Steps
[How others can verify these findings]
```

## 🎯 Success Metrics

Track your experimental success:

```javascript
const metrics = {
  experimentsRun: 24,
  hypothesesValidated: 18,  // 75% accuracy
  averageDuration: "52 minutes",
  patternsDiscovered: 7,
  issuesResolved: 21,
  knowledgeCaptured: "100%"
};
```

## 🔗 Integration with Development Workflow

### Git Integration
```bash
# Create branch for experiment
git checkout -b experiment/a7b9c3d4

# Commit with experiment ID
git commit -m "fix: Memory leak in analytics (experiment: a7b9c3d4)"

# Link in PR
"Fixes #123 - See experiment report: experiments/experiment-a7b9c3d4-report.md"
```

### CI/CD Integration
```yaml
# .github/workflows/experiment.yml
on:
  issue_comment:
    types: [created]

jobs:
  experiment:
    if: contains(github.event.comment.body, '/experiment')
    steps:
      - name: Create experiment
        run: |
          ./experiment-journal-cli.js create \
            --title "${{ github.event.issue.title }}" \
            --problem "Issue #${{ github.event.issue.number }}"
```

## 🎓 Learning from Experiments

### Building Knowledge Base
```bash
# After each experiment, extract learnings
./experiment-journal-cli.js complete $ID --learnings "..."

# Periodically review all learnings
node -e "
const journal = require('./experiment-journal-system');
const patterns = await journal.extractPatterns();
console.log('Top Learnings:', patterns.successfulApproaches);
"
```

### Team Knowledge Sharing
1. Weekly experiment review
2. Share interesting findings
3. Update documentation based on discoveries
4. Create experiment templates for common issues

## 🏁 Conclusion

The Experiment Journal System transforms debugging from frustrating guesswork into scientific discovery. By following this guide:

- Every bug becomes a learning opportunity
- Every fix is documented and reproducible
- Every experiment adds to collective knowledge
- Every future issue can reference past solutions

Remember: **"In the middle of difficulty lies opportunity"** - and every experiment brings us closer to understanding our system completely.

---

**Start experimenting today!** Your future self (and your team) will thank you.

🔬 `./experiment-journal-cli.js create --title "My First Experiment"`
# Debugging Guide: Development Reality Engine
## Troubleshooting and Maintenance for Verified Development

**Version:** 1.0.0  
**Date:** 2025-08-12  
**Purpose:** Guide for diagnosing and resolving issues in the Development Reality Engine

---

## Debugging Philosophy

The Development Reality Engine provides **evidence-based debugging** - every issue leaves a trail of verifiable evidence. Unlike traditional debugging that starts from scratch, DRE debugging starts with comprehensive evidence packages.

**Core Principle**: "The system tells you what went wrong through tamper-proof evidence."

## Quick Troubleshooting

### System Won't Start
```bash
# 1. Check core dependencies
dre doctor --verbose

# 2. Verify configuration
dre config validate

# 3. Test minimal system
dre bootstrap --minimal

# 4. Check error logs
dre logs --errors --last 100
```

### Evidence Not Generating
```bash
# 1. Verify evidence directory permissions
dre permissions check ./experiments

# 2. Test evidence collection manually
dre evidence test --visual --programmatic

# 3. Check wrapper functionality
dre wrap echo "test" --debug

# 4. Validate evidence format
dre evidence validate ./experiments/latest
```

### Verification Failing
```bash
# 1. Run diagnostic mode
dre verify --diagnostic --verbose

# 2. Test individual verification methods
dre verify --only visual
dre verify --only programmatic
dre verify --only behavioral

# 3. Check confidence thresholds
dre config get verification.confidence.threshold

# 4. Generate verification report
dre verify --report detailed
```

## Evidence-Based Debugging

### Understanding Evidence Packages
Every DRE operation creates an evidence package:
```
experiments/
├── experiment-[uuid]/
│   ├── metadata.json        # What happened
│   ├── evidence/           # Proof it happened
│   │   ├── visual/         # Screenshots, recordings
│   │   ├── programmatic/   # Code analysis, test results
│   │   ├── behavioral/     # Performance metrics, traces
│   │   └── structural/     # System state, dependencies
│   ├── logs/               # Detailed operation logs
│   ├── analysis/           # AI-generated insights
│   └── signature.json      # Cryptographic proof
```

### Debugging Workflow
```
1. Identify Failed Operation
   └─> Find experiment UUID in error message
   
2. Load Evidence Package
   └─> dre debug [experiment-uuid]
   
3. Analyze Evidence
   └─> Visual evidence shows what user saw
   └─> Programmatic evidence shows what code did
   └─> Behavioral evidence shows how system performed
   
4. Identify Root Cause
   └─> Evidence contradictions point to issues
   
5. Verify Fix
   └─> Run same operation with fix
   └─> Compare evidence packages
```

## Common Issues and Solutions

### 1. Bootstrap Failures

#### Symptom: "Cannot establish initial trust"
```bash
Error: Bootstrap verification failed - no trusted foundation
```

**Diagnosis**:
```bash
# Check mathematical verification
dre bootstrap test --math-only

# Verify crypto functions
dre bootstrap test --crypto-only

# Test file operations
dre bootstrap test --file-only
```

**Solutions**:
1. **Corrupted installation**: Reinstall DRE core
2. **Permission issues**: Check file system permissions
3. **Missing dependencies**: Run `dre doctor --fix`

#### Symptom: "Circular dependency in verification"
**Solution**: Use progressive trust building:
```bash
# Start with minimal system
dre bootstrap --minimal --trust-level 1

# Gradually increase trust
dre bootstrap --trust-level 2
dre bootstrap --trust-level 3
dre bootstrap --full
```

### 2. Evidence Collection Failures

#### Symptom: "Visual evidence generation failed"
**Diagnosis**:
```bash
# Test Puppeteer installation
dre deps test puppeteer

# Check display availability (Linux)
echo $DISPLAY
xvfb-run dre evidence test --visual

# Test with fallback renderer
dre config set visual.renderer fallback
```

**Solutions**:
1. **Headless environment**: Use `xvfb-run` wrapper
2. **Missing dependencies**: Install Chrome/Chromium
3. **Resource constraints**: Reduce screenshot quality

#### Symptom: "Evidence storage full"
**Diagnosis**:
```bash
# Check evidence storage
dre storage status

# Find large evidence packages
dre storage analyze --sort-by size

# Check retention policy
dre config get evidence.retention
```

**Solutions**:
```bash
# Clean old evidence (keeping signatures)
dre storage clean --older-than 30d --keep-signatures

# Archive to external storage
dre storage archive --to s3://my-bucket/evidence

# Adjust retention policy
dre config set evidence.retention.days 7
```

### 3. Verification Failures

#### Symptom: "Multi-modal verification consensus not reached"
**Diagnosis**:
```bash
# Check individual verification results
dre verify --show-individual-scores

# Analyze disagreement
dre verify analyze --experiment [uuid]

# View confidence calculation
dre verify explain --experiment [uuid]
```

**Solutions**:
1. **Adjust consensus threshold**:
   ```bash
   dre config set verification.consensus.required 2  # Instead of 3
   ```

2. **Debug specific verifier**:
   ```bash
   dre verify debug --verifier visual
   ```

3. **Exclude problematic verifier temporarily**:
   ```bash
   dre verify --exclude behavioral
   ```

### 4. Performance Issues

#### Symptom: "Verification taking too long"
**Diagnosis**:
```bash
# Profile verification performance
dre profile --operation verify

# Check resource usage
dre monitor --real-time

# Analyze bottlenecks
dre profile analyze --last-run
```

**Solutions**:
1. **Enable parallel processing**:
   ```bash
   dre config set processing.parallel true
   dre config set processing.workers 4
   ```

2. **Optimize evidence collection**:
   ```bash
   dre config set evidence.compression true
   dre config set evidence.sampling.rate 0.1  # Sample 10%
   ```

3. **Use incremental verification**:
   ```bash
   dre config set verification.incremental true
   ```

### 5. Integration Issues

#### Symptom: "Command wrapper not intercepting"
**Diagnosis**:
```bash
# Check shell integration
dre shell status

# Test wrapper directly
dre wrap --test "echo hello"

# Check PATH configuration
echo $PATH | grep -q ".dre/bin" && echo "DRE in PATH" || echo "DRE not in PATH"
```

**Solutions**:
1. **Reinstall shell integration**:
   ```bash
   dre shell install --force
   source ~/.bashrc  # or ~/.zshrc
   ```

2. **Use explicit wrapping**:
   ```bash
   dre wrap npm test
   # Instead of just: npm test
   ```

3. **Debug wrapper**:
   ```bash
   DRE_DEBUG=wrapper npm test
   ```

## Advanced Debugging

### Evidence Analysis Tools

#### Visual Evidence Debugging
```bash
# Compare visual evidence between runs
dre evidence compare --visual [uuid1] [uuid2]

# Extract specific screenshots
dre evidence extract --visual --frame 5 [uuid]

# Generate visual diff report
dre evidence diff --visual --output report.html [uuid1] [uuid2]
```

#### Programmatic Evidence Debugging
```bash
# Analyze code coverage
dre evidence analyze --coverage [uuid]

# Check test results
dre evidence show --tests [uuid]

# Validate assertions
dre evidence validate --assertions [uuid]
```

#### Behavioral Evidence Debugging
```bash
# Analyze performance regression
dre evidence analyze --performance --baseline [uuid1] --current [uuid2]

# Check resource usage
dre evidence show --resources [uuid]

# Trace execution path
dre evidence trace --execution [uuid]
```

### Root Cause Analysis

#### Automated RCA
```bash
# Run root cause analysis
dre rca --experiment [uuid]

# Compare with known issues
dre rca --match-known-issues [uuid]

# Generate RCA report
dre rca --report --output rca-report.md [uuid]
```

#### Manual RCA Process
1. **Collect all evidence**:
   ```bash
   dre evidence export --all [uuid] --to ./investigation/
   ```

2. **Correlate timestamps**:
   ```bash
   dre evidence timeline [uuid] --output timeline.html
   ```

3. **Analyze contradictions**:
   ```bash
   dre evidence contradictions [uuid]
   ```

4. **Generate hypothesis**:
   ```bash
   dre rca hypothesize [uuid] --interactive
   ```

### Debug Mode Operations

#### Enable Global Debug Mode
```bash
# Maximum verbosity
export DRE_DEBUG=*

# Specific components
export DRE_DEBUG=wrapper,verification,evidence

# With performance profiling
export DRE_DEBUG=* DRE_PROFILE=true
```

#### Component-Specific Debugging
```bash
# Debug evidence collection
DRE_DEBUG=evidence dre wrap npm test

# Debug verification
DRE_DEBUG=verification dre verify

# Debug command wrapper
DRE_DEBUG=wrapper dre wrap git commit

# Debug AI analysis
DRE_DEBUG=ai dre analyze [uuid]
```

## Maintenance Procedures

### Regular Maintenance

#### Daily
```bash
# Check system health
dre health check

# Verify evidence integrity
dre evidence verify --today

# Check for anomalies
dre monitor anomalies --last 24h
```

#### Weekly
```bash
# Clean old evidence
dre maintenance clean --auto

# Optimize databases
dre maintenance optimize

# Update verification models
dre update models
```

#### Monthly
```bash
# Full system verification
dre self-test --comprehensive

# Archive old evidence
dre maintenance archive --older-than 30d

# Performance baseline update
dre baseline update
```

### Emergency Procedures

#### System Corruption
```bash
# 1. Enter safe mode
dre safe-mode enter

# 2. Run integrity check
dre integrity check --deep

# 3. Repair corrupted components
dre repair --auto

# 4. Verify repair
dre self-test

# 5. Exit safe mode
dre safe-mode exit
```

#### Evidence Tampering Detected
```bash
# 1. Quarantine affected evidence
dre quarantine [uuid]

# 2. Generate tampering report
dre security report [uuid]

# 3. Re-verify from backups
dre evidence restore [uuid]

# 4. Update security measures
dre security harden
```

#### Complete System Recovery
```bash
# 1. Backup current state
dre backup create --emergency

# 2. Reset to known good state
dre reset --to-last-known-good

# 3. Replay recent operations
dre replay --from [timestamp]

# 4. Verify system integrity
dre self-test --comprehensive
```

## Debugging Best Practices

### 1. Always Start with Evidence
- Don't guess - check the evidence
- Evidence packages contain the complete story
- Use `dre evidence show [uuid]` as first step

### 2. Use Progressive Debugging
- Start with high-level checks (`dre health`)
- Drill down to specific components
- Isolate issues with targeted tests

### 3. Maintain Debug Logs
```bash
# Enable debug logging for problem areas
dre config set logging.areas "wrapper,verification"

# Rotate logs regularly
dre config set logging.rotation daily

# Keep debug logs for analysis
dre config set logging.debug.retention 7d
```

### 4. Document Issues
```bash
# Report issues with evidence
dre issue report --attach-evidence [uuid]

# Check known issues
dre issue search [error-message]

# Subscribe to issue updates
dre issue watch [issue-id]
```

### 5. Use Community Resources
- Check documentation: `dre docs search [error]`
- Community forum: `dre community search [issue]`
- Expert help: `dre support create-ticket`

## Debug Output Interpretation

### Understanding Verification Scores
```
Verification Results for experiment-abc123:
├── Visual:       0.95 ✓ (threshold: 0.90)
├── Programmatic: 0.88 ✗ (threshold: 0.90)
├── Behavioral:   0.92 ✓ (threshold: 0.90)
└── Consensus:    FAILED (2/3 passed, 3/3 required)

Action: Lower consensus requirement or fix programmatic verification
```

### Reading Evidence Contradictions
```
Evidence Contradiction Report:
├── Visual evidence shows: Button color is blue
├── Programmatic evidence shows: CSS property color: green
└── Resolution: Visual evidence may be cached, force refresh

Suggested fix: dre cache clear --visual
```

### Interpreting Performance Profiles
```
Performance Profile:
├── Evidence Collection:  250ms (15%)
├── Verification:        1200ms (72%)
│   ├── Visual:          800ms
│   ├── Programmatic:    300ms
│   └── Behavioral:      100ms
├── Analysis:            200ms (12%)
└── Storage:              17ms (1%)

Bottleneck: Visual verification
Suggestion: Enable visual caching or reduce screenshot quality
```

## Getting Help

### Self-Service Resources
```bash
# Built-in documentation
dre help [command]
dre docs search [topic]

# Interactive troubleshooting
dre troubleshoot --interactive

# Video tutorials
dre tutorials list
```

### Community Support
```bash
# Search community solutions
dre community search [issue]

# Post question
dre community ask

# Join chat
dre community chat
```

### Professional Support
```bash
# Create support ticket
dre support ticket create

# Emergency support (enterprise)
dre support emergency

# Schedule consultation
dre support consultation
```

## Conclusion

The Development Reality Engine makes debugging scientific through evidence-based troubleshooting. Every issue leaves a trail, every operation can be verified, and every fix can be validated.

**Remember**: In DRE, you don't debug by guessing - you debug by following the evidence.

---

**"Traditional debugging is archaeology. DRE debugging is forensic science."**

*Debugging Guide v1.0 - Evidence-based troubleshooting for verified development.*
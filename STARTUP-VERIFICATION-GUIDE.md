# 🚀 Startup Verification System Guide

## Overview

The **Startup Verification System** ensures that all critical components are properly initialized, verified, and ready before considering the system operational. This includes:

- ✅ Core services (Economic Engine, Slam Layer)
- ✅ Database connectivity and data integrity
- ✅ MCP Template Processor
- ✅ Reasoning Engine (Ollama + Cloud AI)
- ✅ Encryption and security
- ✅ All integrated services

## 🎯 Key Components

### 1. **Startup Verification Script** (`scripts/startup-verification.js`)

Comprehensive verification that checks:

#### Phase 1: Core Services
- Economic Engine API (port 3000)
- Slam Integration Layer (port 9999)
- Static file serving

#### Phase 2: Database Systems
- MySQL/PostgreSQL connectivity
- Table structure (20+ tables)
- AI agents initialized
- Feature flags configured
- Database encryption verification

#### Phase 3: MCP Template Processor
- MCP directory exists
- Template catalog available
- Template processing functional
- API endpoints responsive

#### Phase 4: Reasoning Engine
- Ollama service running
- AI models available
- Reasoning API operational
- Test reasoning execution

#### Phase 5: Encryption & Security
- HTTPS certificates (if configured)
- JWT secret strength
- Session security
- API key encryption

#### Phase 6: Integrated Services
- AI Economy Runtime
- Real Data Hooks
- Feature Flag System
- Differential Layer
- End-to-end health check

### 2. **Startup Monitor** (`scripts/startup-monitor.sh`)

Continuous monitoring script that:
- Starts services if not running
- Runs verification repeatedly until success
- Shows real-time progress
- Provides detailed failure information
- Continues health monitoring after success

## 🚀 Usage

### Quick Start with Monitoring
```bash
# Run the startup monitor (recommended)
./scripts/startup-monitor.sh
```

This will:
1. Check if services are running
2. Start them if needed
3. Run verification every 5 seconds
4. Show progress and status
5. Continue monitoring after success

### Manual Verification
```bash
# Run verification once
node scripts/startup-verification.js
```

### Integration with Combo Bash
The verification system is integrated into `combo-bash-everything.sh`:

```bash
# Combo bash now includes verification
./combo-bash-everything.sh

# It will:
# 1. Initialize database
# 2. Start services
# 3. Run startup verification
# 4. Only proceed if everything passes
```

## 📊 Verification Report

After each run, a detailed report is saved to `startup-verification-report.json`:

```json
{
  "timestamp": "2025-01-20T10:30:00Z",
  "ready": true,
  "successRate": 95,
  "duration": 45000,
  "checks": {
    "core": { "passed": 3, "failed": 0 },
    "database": { "passed": 5, "failed": 0 },
    "mcp": { "passed": 4, "failed": 0 },
    "reasoning": { "passed": 4, "failed": 0 },
    "encryption": { "passed": 4, "failed": 0 },
    "services": { "passed": 5, "failed": 0 }
  },
  "services": {
    "economicEngine": true,
    "database": true,
    "mcp": true,
    "reasoning": true,
    "encryption": true,
    "integrated": true
  }
}
```

## 🔍 What Gets Verified

### Database Verification
```javascript
✅ Connection established
✅ 20+ tables exist
✅ AI agents initialized (7 agents)
✅ Feature flags configured (5 flags)
✅ Encryption keys present
✅ Encryption/decryption working
```

### MCP Verification
```javascript
✅ MCP directory exists
✅ Template API responsive
✅ Template catalog has entries
✅ Template processing works
```

### Reasoning Engine
```javascript
✅ Ollama service running
✅ AI models available
✅ Reasoning API operational
✅ Test prompt executes successfully
```

### Security Verification
```javascript
✅ JWT secret configured (32+ chars)
✅ Session secret configured
✅ API keys not exposed
✅ Encryption functions work
⚠️ HTTPS certificates (optional)
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database is running
mysql -u root -p  # For MySQL
psql -U postgres  # For PostgreSQL

# Check .env configuration
cat .env | grep DB_
```

#### 2. MCP Not Found
```bash
# Ensure MCP directory exists
ls -la mcp/

# Check if route is configured in server.js
grep -n "mcp" server.js
```

#### 3. Ollama Not Running
```bash
# Start Ollama
ollama serve

# Check Ollama models
ollama list
```

#### 4. Services Won't Start
```bash
# Check for port conflicts
lsof -i :3000
lsof -i :9999

# Kill existing processes
pkill -f node

# Check logs
tail -f economic-engine.log
tail -f slam-layer.log
```

### Verification Failures

If verification fails, check:

1. **Critical Failures** (must fix):
   - No database connection
   - No AI agents in database
   - JWT secret missing
   - Core services not responding

2. **Warnings** (should fix):
   - HTTPS not configured
   - Some API keys missing
   - Optional services unavailable

## 🎯 Success Criteria

The system is considered **READY** when:

1. **All Core Services** pass verification
2. **Database** has required tables and data
3. **No Critical Failures** are present
4. **Success Rate** is above 80%

## 📈 Monitoring

After successful startup, the monitor continues to check system health:

```bash
💚 System healthy - 14:32:15
```

Press `Ctrl+C` to stop monitoring.

## 🔄 Integration with CI/CD

The verification system integrates with automated workflows:

```yaml
# In GitHub Actions
- name: Start services
  run: |
    npm start &
    node slam-it-all-together.js &
    sleep 10

- name: Run verification
  run: node scripts/startup-verification.js
  
- name: Check verification passed
  run: |
    if [ $(jq -r '.ready' startup-verification-report.json) != "true" ]; then
      echo "Verification failed!"
      exit 1
    fi
```

## 💡 Best Practices

1. **Always run verification** before marking system as ready
2. **Fix critical failures first** before addressing warnings
3. **Monitor the first startup** carefully
4. **Check logs** if verification fails
5. **Use startup monitor** for automatic retries
6. **Save verification reports** for debugging

## 🎉 When Everything Passes

When you see:
```
✅ SYSTEM READY FOR OPERATION!

Service URLs:
  • Economic Engine: http://localhost:3000
  • Slam Layer: http://localhost:9999
  • Main Application: http://localhost:9999

✅ Verified Components:
  • economicEngine
  • database
  • mcp
  • reasoning
  • encryption
  • integrated

🎉 You can now access the platform at: http://localhost:9999
```

Your system is fully operational with:
- All services running
- Database initialized and verified
- MCP templates ready
- Reasoning engine operational
- Security configured
- All integrations working

---

**The Startup Verification System ensures your platform is truly ready before going live!** 🚀
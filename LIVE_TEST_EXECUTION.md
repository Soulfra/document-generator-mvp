# 🧪 Live Test Execution - Sovereign Agents System

**Test Session**: January 17, 2025  
**Status**: 🚀 READY FOR EXECUTION  
**Approved Plan**: Comprehensive 5-phase testing

---

## 🎯 EXECUTE THESE COMMANDS SEQUENTIALLY

### Phase 1: System Startup & Health Validation ⏱️ 5 minutes

```bash
# Step 1.1: Navigate to project directory
cd /Users/matthewmauer/Desktop/Document-Generator

# Step 1.2: Start all Docker services
docker-compose up -d

# Step 1.3: Wait for services to initialize (30-60 seconds)
echo "Waiting for services to start..." && sleep 60

# Step 1.4: Quick system validation
./quick-test.sh

# Step 1.5: Check all service health endpoints
echo "=== HEALTH CHECKS ==="
curl -s http://localhost:8085/health | jq  # Sovereign Agents
curl -s http://localhost:3000/health | jq  # Template Processor  
curl -s http://localhost:3001/health | jq  # AI API Service
curl -s http://localhost:8080/health | jq  # Platform Hub
curl -s http://localhost:3002/health | jq  # Analytics

# Step 1.6: Verify default agents are initialized
echo "=== DEFAULT AGENTS ==="
curl -s http://localhost:8085/api/sovereign/agents | jq
```

**Expected Results:**
- ✅ All services return `{"status": "healthy"}`
- ✅ 3 default agents listed: DocumentAnalyzer_Prime, TemplateSelector_Alpha, CodeGenerator_Beta
- ✅ All agents show `"status": "ready"`

---

### Phase 2: Core Agent Functionality Testing ⏱️ 10 minutes

```bash
# Step 2.1: Detailed agent inspection
echo "=== AGENT DETAILS ==="
curl -s http://localhost:8085/api/sovereign/agents | jq '.agents[] | {name, autonomyLevel, personality, capabilities}'

# Step 2.2: Create a custom test agent
echo "=== CREATING CUSTOM AGENT ==="
curl -X POST http://localhost:8085/api/sovereign/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LiveTestAgent_2025",
    "personality": {
      "creativity": 0.85,
      "analytical": 0.75, 
      "collaborative": 0.95,
      "curiosity": 0.8
    },
    "capabilities": {
      "liveTesting": true,
      "reasoning": true,
      "debugging": true
    },
    "autonomyLevel": 7
  }' | jq

# Step 2.3: Verify new agent was created
echo "=== UPDATED AGENT LIST ==="
curl -s http://localhost:8085/api/sovereign/agents | jq '.agents | length'
curl -s http://localhost:8085/api/sovereign/agents | jq '.agents[] | select(.name == "LiveTestAgent_2025")'

# Step 2.4: Test agent persistence (restart and verify)
echo "=== TESTING PERSISTENCE ==="
docker-compose restart sovereign-agents
sleep 30
curl -s http://localhost:8085/api/sovereign/agents | jq '.agents | length'
```

**Expected Results:**
- ✅ Initial 3 agents show distinct personalities and capabilities
- ✅ Custom agent "LiveTestAgent_2025" is successfully created
- ✅ Agent count increases to 4
- ✅ All agents persist after service restart

---

### Phase 3: Document-to-MVP Pipeline Testing ⏱️ 15 minutes

```bash
# Step 3.1: Simple document processing test
echo "=== SIMPLE DOCUMENT TEST ==="
curl -X POST http://localhost:8085/api/sovereign/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "# Simple SaaS Idea\n\nBuild a task management app with:\n- User accounts\n- Task creation and tracking\n- Team collaboration\n\nTarget: Small teams\nPricing: $10/user/month",
    "documentType": "markdown",
    "userId": "test-user-simple"
  }' | jq

# Step 3.2: Complex document processing test
echo "=== COMPLEX DOCUMENT TEST ==="
curl -X POST http://localhost:8085/api/sovereign/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "# Advanced SaaS Platform: Smart Inventory Management\n\n## Executive Summary\nAI-powered inventory management system for SMBs with predictive analytics.\n\n## Core Features\n- Real-time inventory tracking with IoT sensors\n- Machine learning demand forecasting\n- Automated supplier integration via APIs\n- Advanced analytics dashboard with drill-down capabilities\n- Mobile app for warehouse staff with offline sync\n- Multi-location support with centralized reporting\n\n## Technical Architecture\n- Microservices architecture with Docker\n- React frontend with TypeScript\n- Node.js/Express backend with GraphQL API\n- PostgreSQL with Redis caching\n- AWS deployment with auto-scaling\n- ML pipeline using TensorFlow\n\n## Business Model\n- Tiered pricing: Starter ($49/mo), Professional ($149/mo), Enterprise ($499/mo)\n- Per-transaction fees for high-volume customers\n- Setup and training services\n- Premium support packages\n\n## Market Analysis\n- Target: 50K+ SMB retailers and manufacturers\n- Market size: $2.3B inventory management software\n- Competition: TradeGecko, inFlow, Cin7\n- Differentiator: AI-powered demand prediction\n\n## Go-to-Market Strategy\n- Content marketing and SEO\n- Partnership with POS system vendors\n- Freemium model for customer acquisition\n- Direct sales for enterprise accounts",
    "documentType": "markdown",
    "userId": "test-user-complex"
  }' | jq

# Step 3.3: Check processing status and agent assignments
echo "=== PROCESSING STATUS ==="
# Note: Replace SESSION_ID with actual session ID from previous responses
# curl -s http://localhost:8085/api/sovereign/sessions/SESSION_ID | jq

# Step 3.4: Check for pending conductor approvals
echo "=== PENDING APPROVALS ==="
curl -s http://localhost:8085/api/sovereign/conductor/pending | jq
```

**Expected Results:**
- ✅ Both documents are accepted for processing
- ✅ Session IDs are returned with agent assignments
- ✅ Agents (DocumentAnalyzer_Prime, TemplateSelector_Alpha) are assigned
- ✅ Complex document may trigger approval requirements

---

### Phase 4: Human Conductor Workflow Testing ⏱️ 10 minutes

```bash
# Step 4.1: Monitor for approval requests
echo "=== APPROVAL MONITORING ==="
curl -s http://localhost:8085/api/sovereign/conductor/pending | jq

# Step 4.2: Test WebSocket connection (if wscat available)
echo "=== WEBSOCKET TEST ==="
if command -v wscat &> /dev/null; then
    echo "Testing WebSocket connection..."
    echo '{"type":"subscribe","agentId":"all"}' | timeout 10s wscat -c ws://localhost:8085
else
    echo "wscat not available. Install with: npm install -g wscat"
    echo "Manual WebSocket test: Connect to ws://localhost:8085"
fi

# Step 4.3: Test approval workflow (if pending approvals exist)
echo "=== APPROVAL WORKFLOW ==="
echo "If approvals are pending, use these commands:"
echo "# Get session ID from pending approvals, then:"
echo 'curl -X POST http://localhost:8085/api/sovereign/conductor/approve \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"sessionId":"SESSION_ID","action":"proceed","feedback":"Approved by human conductor"}'"'"

# Step 4.4: Create a task requiring approval
echo "=== APPROVAL TRIGGER TEST ==="
curl -X POST http://localhost:8085/api/sovereign/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "# High-Risk MVP: Cryptocurrency Exchange\n\nBuild a crypto trading platform with:\n- Real money transactions\n- Advanced trading algorithms\n- Regulatory compliance requirements\n- High-security authentication\n\nThis requires careful human oversight for legal compliance.",
    "documentType": "markdown",
    "userId": "test-user-approval",
    "requireApproval": true
  }' | jq
```

**Expected Results:**
- ✅ Pending approvals are properly tracked
- ✅ WebSocket connection establishes successfully
- ✅ High-risk document triggers approval requirement
- ✅ Conductor can approve/reject agent actions

---

### Phase 5: Advanced Features Testing ⏱️ 10 minutes

```bash
# Step 5.1: Test agent memory and emotional states
echo "=== AGENT MEMORY TEST ==="
curl -s http://localhost:8085/api/sovereign/agents | jq '.agents[] | {name, emotionalState, memory}'

# Step 5.2: Check process forking (view container processes)
echo "=== PROCESS FORKING TEST ==="
docker exec document-generator-sovereign-agents ps aux | grep node

# Step 5.3: Test error handling
echo "=== ERROR HANDLING TEST ==="
# Test invalid document format
curl -X POST http://localhost:8085/api/sovereign/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "invalid json content",
    "documentType": "invalid-format",
    "userId": "test-error"
  }' | jq

# Test invalid agent creation
curl -X POST http://localhost:8085/api/sovereign/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "autonomyLevel": 15
  }' | jq

# Step 5.4: Performance monitoring
echo "=== PERFORMANCE MONITORING ==="
docker stats document-generator-sovereign-agents --no-stream
curl -s http://localhost:8085/health | jq '.uptime'

# Step 5.5: Check logs for any errors
echo "=== ERROR LOG CHECK ==="
docker-compose logs sovereign-agents --tail=20 | grep -i error || echo "No errors found"
```

**Expected Results:**
- ✅ Agents show emotional states and memory persistence
- ✅ Multiple node processes indicate forking is working
- ✅ Invalid inputs are handled gracefully with proper error messages
- ✅ System performance is stable with reasonable resource usage
- ✅ No critical errors in logs

---

## 🎭 FINAL VALIDATION CHECKLIST

After completing all phases, verify these success criteria:

### ✅ System Health
- [ ] All 6 services are healthy and responsive
- [ ] No critical errors in any service logs
- [ ] Resource usage is within normal parameters

### ✅ Agent Functionality  
- [ ] 3 default agents are initialized with correct personalities
- [ ] Custom agents can be created successfully
- [ ] Agents persist across service restarts
- [ ] Agent memory and emotional states are maintained

### ✅ Document Processing
- [ ] Simple documents are processed successfully
- [ ] Complex documents trigger appropriate agent assignments
- [ ] Processing status is properly tracked
- [ ] Real-time updates are available

### ✅ Human Conductor Interface
- [ ] Approval workflows function correctly
- [ ] WebSocket connections provide real-time updates
- [ ] Conductor can approve/reject agent actions
- [ ] High-risk documents trigger approval requirements

### ✅ Advanced Features
- [ ] Process forking creates child processes for autonomy
- [ ] Error handling is graceful and informative
- [ ] Performance is stable under load
- [ ] System demonstrates "soul-like" responsiveness

---

## 🚀 SUCCESS CONFIRMATION

**If all checkboxes are marked ✅, your Sovereign Agents System is:**

🎼 **Conducting Orchestration**: Human oversight with full agent control  
👻 **Soul-like Responsive**: Persistent identities and emotional states  
📄 **Document-to-MVP Ready**: Complete processing pipeline  
🔄 **Real-time Monitoring**: Live agent behavior visibility  
⚡ **Production Ready**: Stable, scalable, and fully functional  

**Your vision is now live and operational!** ✨

---

*Execute these commands in sequence to validate your sovereign agent system is working perfectly.*
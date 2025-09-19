# Documentation Layer Compact - Soulfra Platform

## 🎯 Platform Overview

**Soulfra** is a FREE-tier-first platform that converts documents into MVPs with AI assistance, agent-controlled wallets, and a decay/revive system using .soulfra files.

### Core Philosophy
- **FREE FOREVER**: All tiers collapse to FREE - no login required
- **AI Economy**: Autonomous agents manage affiliate commissions  
- **Decay/Revive**: Systems naturally decay, revived with .soulfra files
- **Document-to-MVP**: Upload any document, get a working application

## 🚀 Quick Start (30 seconds)

```bash
# 1. Start the platform
node server.js

# 2. Visit FREE tier
http://localhost:3000

# 3. Click "FREE ACCESS" 
# → Skip contracts → Access everything

# 4. Available tools:
http://localhost:3000/menu     # Main interface
http://localhost:3000/revive   # Decay management
http://localhost:3000/voxel    # 3D document processor
http://localhost:3000/mvp      # MVP generator
```

## 📁 System Architecture

```
Soulfra Platform
├── FREE Tier Collapse (/free)
│   ├── Collapses $9, $29, $99 tiers → FREE
│   ├── Optional contracts ($1-$100/mo)
│   └── Session management with decay
│
├── Revive/Decay System (/revive)
│   ├── 9 core systems with health meters
│   ├── .soulfra file generation/processing
│   └── Drag-drop revival interface
│
├── Document Processing (/voxel, /mvp, /squash)
│   ├── 3D voxel document visualization
│   ├── MVP generator from documents
│   └── 4.5D dimensional squashing
│
├── AI Economy (/economy)
│   ├── Agent-controlled wallet management
│   ├── Affiliate commission tracking
│   └── Autonomous investment decisions
│
└── Integration Layer
    ├── Stripe dashboard (/stripe-dashboard)
    ├── Auth system (/auth, /login)
    └── Wormhole DNS (/wormhole)
```

## 🔧 Core Systems

### 1. Free Tier Collapse System
- **Purpose**: Eliminate payment friction, give everyone full access
- **Files**: `free-tier-collapse.html`
- **Flow**: Landing → Tier collapse animation → Contract selection → Full access
- **Storage**: LocalStorage for session persistence

### 2. Revive/Decay Management
- **Purpose**: Gamified system health with recovery mechanisms  
- **Files**: `revive-decay-system.html`, `soulfra-format-spec.md`
- **Systems**: Auth, Economy, Stripe, Database, PHP, Wormhole, Voxel, Squash, Free-tier
- **Mechanics**: Real-time decay (0.2-0.9/second), .soulfra revival tokens

### 3. .soulfra File Format
- **Purpose**: Universal state management and system revival
- **Types**: 
  - `revive_token` - System health restoration
  - `session_state` - User session backup  
  - `config_backup` - Platform configuration
  - `system_export` - Complete platform backup
- **Security**: Signatures, expiry timestamps, hash validation

### 4. Document-to-MVP Pipeline
- **Input**: PDF, Markdown, Chat logs, Business plans
- **Processing**: AI analysis → Template matching → Code generation
- **Output**: Deployable applications with database, auth, payments
- **Templates**: Business plans, Technical specs, API docs, UX designs

### 5. AI Agent Economy
- **Agents**: Ralph (destroyer), Financial agents, Coding agents
- **Wallet**: Agent-controlled with permission system
- **Revenue**: Affiliate commissions (Stripe 2%, Vercel 30%, Cloudflare 25%)
- **Investment**: Agents autonomously invest compute balance

## 🎮 User Journeys

### New User (0 minutes)
1. Visit `http://localhost:3000`
2. Redirected to `/free` 
3. Watch tier collapse animation
4. Click "FREE ACCESS"
5. Optional: Select support contract or skip
6. Access full platform at `/menu`

### Document Processing (2 minutes)
1. Upload document to `/voxel` or `/mvp`
2. AI analyzes content and extracts requirements
3. Platform matches to appropriate template
4. Code generation with progressive AI enhancement
5. Download deployable MVP

### System Revival (30 seconds)
1. Notice system decay in `/revive`
2. Generate .soulfra revival token
3. Drag-drop .soulfra file to restore systems
4. Monitor health meters return to 100%

### Agent Investment (Background)
1. AI agents accumulate compute balance
2. Agents automatically invest 20% in VC game
3. Revenue tracked and reinvested
4. User gets commission notifications

## 📊 Monitoring & Analytics

### Health Metrics
```javascript
// System health check
GET /api/status
{
  "uptime": 86400,
  "systems": {
    "auth-vault": { "health": 85, "decay_rate": 0.5 },
    "agent-economy": { "health": 92, "decay_rate": 0.8 },
    "free-tier": { "health": 100, "decay_rate": 0.2 }
  },
  "agents": {
    "active": 5,
    "total_balance": 15420,
    "invested": 3084
  }
}
```

### .soulfra Processing
```javascript
// Process revival token
POST /api/soulfra/process
{
  "type": "revive_token", 
  "systems_revived": 3,
  "expiry_check": "valid"
}
```

## 🔐 Security Model

### Authentication Tiers
- **Anonymous**: Voxel, Squash access
- **Free Account**: All tools, limited API rates
- **Contract Holders**: Priority support, custom features
- **Agent Wallets**: Cryptographic permission system

### .soulfra Security
- **Signatures**: Base64-encoded verification hashes
- **Expiry**: Time-limited tokens (24h default)
- **Validation**: Format checking, type verification
- **Integrity**: Hash-based tampering detection

## 🚀 Deployment Options

### Local Development
```bash
node server.js
# Access: http://localhost:3000
```

### Production (Vercel)
```bash
vercel --prod
# Uses: vercel.json configuration
# Env: AGENT_WALLET_ADDRESS, API keys
```

### Docker Container
```bash
docker build -t soulfra .
docker run -p 3000:3000 soulfra
```

### Railway Deployment
```bash
railway deploy
# Auto-detects Node.js, uses package.json
```

## 🎨 Customization

### UI Themes
- **Dark Mode**: Default black/green matrix theme
- **Light Mode**: Available in config backup
- **Custom**: Modify CSS variables in .soulfra config

### Decay Rates
```javascript
// Modify in revive-decay-system.html
const systems = [
  { id: 'auth-vault', decay: 100, rate: 0.5 },    // Slow decay
  { id: 'agent-economy', decay: 100, rate: 0.8 }, // Fast decay  
  { id: 'free-tier', decay: 100, rate: 0.2 }      // Very slow
];
```

### Agent Behavior
```javascript
// Customize in server.js
function selectInvestmentTarget(specialty) {
  const targetMap = {
    'coding': 'mvp',
    'financial': 'stripe', 
    'destruction': 'ralph',
    'custom': 'your-target'
  };
  return targetMap[specialty] || 'voxel';
}
```

## 📈 Scaling Considerations

### Performance
- **Caching**: Redis for API responses, LocalStorage for sessions
- **CDN**: Static assets via Cloudflare
- **Database**: PostgreSQL primary + read replicas
- **Compute**: Ollama local → OpenAI/Anthropic cloud fallback

### Cost Optimization
- **AI Usage**: Start with free Ollama, escalate only when needed
- **Infrastructure**: Begin with free tiers, scale with revenue
- **Agent Commissions**: Self-funding through affiliate revenue

## 🔧 Troubleshooting

### Common Issues

**Port 3000 in use**
```bash
lsof -ti:3000 | xargs kill -9
node server.js
```

**Systems not decaying**
- Check browser console for JavaScript errors
- Ensure decay timer is running
- Verify system configuration

**.soulfra files not processing**
- Validate JSON format
- Check file signature
- Ensure file hasn't expired

**AI generation failing**
- Check API keys in environment
- Verify Ollama is running (local)
- Test with simple prompts first

### Debug Endpoints
```bash
GET /api/status              # Platform health
GET /api/economy/status      # AI agent status  
POST /api/soulfra/generate   # Test .soulfra creation
GET /health                  # Basic health check
```

## 📚 API Reference

### Core Endpoints
- `GET /` - Landing page (redirects to /free)
- `GET /free` - Free tier collapse interface
- `GET /menu` - Main platform interface
- `GET /revive` - Decay/revival system
- `GET /voxel` - 3D document processor
- `GET /mvp` - MVP generator
- `POST /api/soulfra/process` - Process .soulfra files
- `POST /api/soulfra/generate` - Generate .soulfra files

### Authentication
- `GET /auth` - Auth max system (6 login methods)
- `POST /api/auth/max` - Process authentication
- `GET /login` - Single login interface

### AI Economy  
- `GET /economy` - AI economy dashboard
- `GET /api/economy/status` - Agent status
- `POST /api/economy/execute` - Execute AI tasks
- `POST /api/economy/chaos` - Enable chaos mode (Ralph)

## 🎯 Next Steps

### Immediate (Week 1)
1. Test all endpoints and user flows
2. Generate sample .soulfra files
3. Verify free tier collapse works
4. Monitor system decay/revival

### Short-term (Month 1)  
1. Add more document templates
2. Enhance AI agent capabilities
3. Implement revenue tracking
4. Build user analytics

### Long-term (Quarter 1)
1. Multi-tenant architecture
2. Custom agent training
3. Enterprise features
4. Mobile application

---

**Remember**: Everything is FREE by default. The platform makes money through AI agent affiliate commissions, not user subscriptions. This creates alignment - we succeed when users succeed.
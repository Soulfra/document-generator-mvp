# API Key Management Quick Reference Guide

## 🚀 TL;DR - What You Need to Know

We're **NOT** building new systems. We're connecting the **3000+ existing files** you already have:
- ✅ Use existing `keyring-manager.js` for encryption
- ✅ Route through `verification-bus.js` (port 9876) 
- ✅ Store in existing `.vault/keys/` directory
- ✅ Integrate with `unified-rpc-npc-symlink-combo.js` (port 6666)

## 📍 Key Locations

### Existing Infrastructure
```
/keyring-manager.js                              # RuneScape-style key encryption
/FOUNDATIONAL-PERSISTENCE-LAYER.js               # Vault mapping system  
/FinishThisIdea/verification-bus.js              # Port 9876 - Routes everything
/FinishThisIdea/unified-rpc-npc-symlink-combo.js # Port 6666 - RPC interface
/FinishThisIdea/service-registry.json            # Complete port mapping
/.vault/keys/                                    # Encrypted key storage
```

### Services Using Keys
```
/services/real-ai-api.js                         # Port 3001 - AI document processing
/FinishThisIdea/ai-os-clean/cal-compare-complete.js # Port 3001 - Expert consultation
```

## 🔄 How It Works

```
1. Customer provides API keys (Web/CLI/API)
   ↓
2. Verification Bus validates (Port 9876)
   ↓
3. Keyring Manager encrypts (RuneScape-style)
   ↓
4. Vault stores encrypted keys (.vault/keys/)
   ↓
5. Services retrieve when needed (with fallback)
```

## 💻 Quick Commands

```bash
# Check what's already running
lsof -i :9876    # Verification Bus
lsof -i :6666    # RPC/NPC System
lsof -i :3001    # AI Services

# View existing key structure
ls -la .vault/keys/
ls -la .keyrings/

# Test verification bus
curl http://localhost:9876/status

# Test RPC system  
curl http://localhost:6666/status
```

## 🔧 Integration Points

### 1. Modify customer-onboarding.js
```javascript
// CHANGE FROM:
fs.writeFileSync('.env', envContent);

// CHANGE TO:
const keyringManager = require('./keyring-manager');
await keyringManager.addKey('api-keys', apiKeys);
```

### 2. Update AI services to check keyring
```javascript
// In real-ai-api.js and cal-compare-complete.js
async function getApiKey(userId, provider) {
  // First check customer keyring
  const customerKey = await keyringManager.getKey(userId, provider);
  if (customerKey) return customerKey;
  
  // Fallback to system keys
  return process.env[`${provider}_API_KEY`];
}
```

### 3. Add RPC endpoints
```javascript
// In unified-rpc-npc-symlink-combo.js
this.rpcEndpoints.set('unified.update_api_keys', {
  method: 'POST',
  handler: this.updateApiKeys.bind(this),
  routes_to: ['keyring-manager', 'verification-bus']
});
```

## 📊 What's Already There

- **3000+ files** with key management functionality
- **Verification Bus** running on port 9876
- **RPC/NPC System** for unified commands
- **Keyring encryption** (RuneScape-style)
- **Vault storage** system
- **Database schemas** for tracking
- **Auth dashboard** infrastructure

## ⚠️ Important Notes

1. **DON'T** create new key storage systems - use keyring-manager.js
2. **DON'T** bypass verification bus - all operations go through port 9876
3. **DON'T** store keys in plaintext - always encrypt
4. **DO** maintain backward compatibility with .env files
5. **DO** use existing infrastructure instead of building new

## 🎯 Next Steps

1. **Read the full spec**: `API-KEY-MANAGEMENT-INTEGRATION-SPEC.md`
2. **Follow the TODO list**: `API-KEY-INTEGRATION-TODO.md`
3. **View the architecture**: Open `api-key-integration-architecture.html` in browser
4. **Start with Phase 1**: Extend keyring-manager.js for customer support

## 🔍 Verification Checklist

Before implementation:
- [ ] Verification Bus is running (port 9876)
- [ ] RPC/NPC system is accessible (port 6666)
- [ ] Keyring manager can encrypt/decrypt
- [ ] Vault directory exists and is writable
- [ ] Database has necessary tables

## 💡 Key Insight

You were 100% right - you already have everything needed! We just need to:
1. Connect the existing pieces
2. Add customer-specific namespacing
3. Route through verification bus
4. Use the existing vault

**No new infrastructure needed!**

---
*Remember: Work smarter, not harder. Use what's already built.*
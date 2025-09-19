# API Key Integration Implementation TODO List

## Overview
This TODO list provides concrete implementation steps for integrating the existing key management systems with customer onboarding, organized by priority and dependencies.

## 🔴 Critical Path (Must Complete First)

### Week 1: Foundation
- [ ] **1.1 Analyze Existing Systems** (2 days)
  - [ ] Document keyring-manager.js API and methods
  - [ ] Map FOUNDATIONAL-PERSISTENCE-LAYER.js integration points
  - [ ] Review auth-dashboard-system.js authentication flow
  - [ ] Catalog all 3000+ key management files for reusable components

- [ ] **1.2 Extend Keyring Manager** (3 days)
  ```javascript
  // Add to keyring-manager.js
  - [ ] Add customer-specific keyring support
  - [ ] Implement key namespacing by user ID
  - [ ] Add provider-specific key storage
  - [ ] Create key export/import functionality
  ```

- [ ] **1.3 Database Schema Updates** (1 day)
  ```sql
  - [ ] Create customer_api_keys table
  - [ ] Create api_key_usage table
  - [ ] Add indexes for performance
  - [ ] Set up automatic cleanup jobs
  ```

## 🟡 High Priority (Core Integration)

### Week 2: Service Integration
- [ ] **2.1 Verification Bus Updates** (2 days)
  - [ ] Add customer_api_keys route to busRoutes
  - [ ] Implement provider validation verifier
  - [ ] Add vault substrate for key storage
  - [ ] Create key rotation endpoints

- [ ] **2.2 AI Service Integration** (3 days)
  - [ ] Modify real-ai-api.js:
    ```javascript
    - [ ] Add keyring lookup in MultiAIRouter
    - [ ] Implement customer key fallback logic
    - [ ] Add usage tracking per customer
    - [ ] Update health checks for key validity
    ```
  
  - [ ] Update cal-compare-complete.js:
    ```javascript
    - [ ] Add BYOK support to MultiAIRouter
    - [ ] Implement per-consultation key selection
    - [ ] Add key usage to consultation records
    - [ ] Create key status endpoints
    ```

- [ ] **2.3 RPC/NPC Integration** (2 days)
  - [ ] Add to unified-rpc-npc-symlink-combo.js:
    ```javascript
    - [ ] Create unified.update_api_keys endpoint
    - [ ] Add unified.get_key_status endpoint
    - [ ] Implement unified.rotate_keys endpoint
    - [ ] Add key management NPC personality
    ```

## 🟢 Medium Priority (User Experience)

### Week 3: UI/UX Integration
- [ ] **3.1 Customer Onboarding Updates** (3 days)
  - [ ] Integrate with keyring-manager instead of .env
  - [ ] Add provider validation UI
  - [ ] Create key testing interface
  - [ ] Implement success/error feedback

- [ ] **3.2 Dashboard Integration** (2 days)
  - [ ] Add key management section to auth-dashboard
  - [ ] Create usage visualization charts
  - [ ] Implement key rotation UI
  - [ ] Add billing/cost tracking display

- [ ] **3.3 CLI Tool Updates** (1 day)
  - [ ] Update docgen CLI with key commands:
    ```bash
    - [ ] docgen keys:list
    - [ ] docgen keys:add <provider> <key>
    - [ ] docgen keys:test <provider>
    - [ ] docgen keys:rotate <provider>
    ```

## 🔵 Important (Security & Monitoring)

### Week 4: Security & Testing
- [ ] **4.1 Security Implementation** (2 days)
  - [ ] Implement key encryption at rest
  - [ ] Add key access audit logging
  - [ ] Create rate limiting for key operations
  - [ ] Implement suspicious activity detection

- [ ] **4.2 Migration Tools** (1 day)
  - [ ] Create migrate-env-to-keyring.js script
  - [ ] Add rollback functionality
  - [ ] Implement dry-run mode
  - [ ] Create backup verification

- [ ] **4.3 Testing Suite** (2 days)
  - [ ] Unit tests for keyring extensions
  - [ ] Integration tests for verification bus
  - [ ] End-to-end customer flow tests
  - [ ] Load tests with 1000+ customers

- [ ] **4.4 Documentation** (1 day)
  - [ ] API documentation for key endpoints
  - [ ] Customer onboarding guide
  - [ ] Troubleshooting guide
  - [ ] Security best practices

## 📋 Detailed Implementation Steps

### Step 1: Keyring Manager Extension
```javascript
// keyring-manager.js modifications
class KeyringManager {
  // Add customer keyring support
  async createCustomerKeyring(userId) {
    const keyringPath = `.keyrings/customers/${userId}`;
    // Implementation details...
  }
  
  // Add provider-specific storage
  async addProviderKey(userId, provider, key) {
    const encrypted = await this.encrypt(key);
    // Store in customer keyring...
  }
}
```

### Step 2: Verification Bus Integration
```javascript
// verification-bus.js additions
this.busRoutes.customer_api_keys = {
  verify: ['api_key', 'provider_validation', 'usage_limit'],
  bus: 'api-bus',
  substrate: 'customer-vault',
  priority: 'high'
};

// Add customer vault substrate
this.substrates.set('customer-vault', {
  name: 'Customer Key Vault',
  type: 'secure_storage',
  submit: async (data) => {
    return keyringManager.storeCustomerKey(data);
  }
});
```

### Step 3: Service Updates Pattern
```javascript
// Pattern for all services needing API keys
async function getApiKeys(userId, provider) {
  // 1. Try customer keys first
  try {
    const customerKey = await keyringManager.getProviderKey(userId, provider);
    if (customerKey) return customerKey;
  } catch (e) {
    console.log('No customer key, falling back to system');
  }
  
  // 2. Fall back to system keys
  return process.env[`${provider.toUpperCase()}_API_KEY`];
}
```

## 🚀 Quick Start Commands

```bash
# Set up development environment
npm install
cp .env.example .env

# Run migrations
npm run migrate:keys

# Start services with new key system
npm run start:with-keyring

# Test customer flow
npm run test:customer-keys
```

## 📊 Success Criteria

1. **All existing services continue working** without modification
2. **Customer keys are never exposed** in plaintext
3. **Key retrieval is fast** (<50ms)
4. **100% backward compatibility** with .env files
5. **Zero downtime migration** from old to new system

## 🔍 Testing Checklist

- [ ] Customer can add API keys via web interface
- [ ] Customer can add API keys via CLI
- [ ] Keys are properly encrypted in storage
- [ ] Services use customer keys when available
- [ ] Services fall back to system keys correctly
- [ ] Key rotation works without service interruption
- [ ] Usage tracking is accurate
- [ ] Billing calculations are correct
- [ ] Security audit passes
- [ ] Load testing passes (1000+ concurrent users)

## 📝 Notes

- Always test with non-production keys first
- Keep original .env as backup during migration
- Monitor key usage closely after deployment
- Set up alerts for unusual activity
- Document any custom modifications

---
*Created: 2025-08-02*
*Last Updated: 2025-08-02*
*Status: Ready for Implementation*
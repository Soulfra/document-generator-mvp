# 🌐 Decentralized Guardian Template System

Templated guardian protection with Stripe integration and continuous updates that never stop.

## 🚀 Quick Start

```bash
# Activate a guardian template
node decentralized-guardian-template.js activate enterprise-protection

# Start live monitoring
node decentralized-guardian-template.js monitor

# Setup tmux monitoring dashboard
./start-guardian-tmux.sh
```

## 🛡️ Guardian Templates

### Basic Protection (Free)
- Charlie Prime + Security Layer
- 5-second monitoring interval
- Basic breach detection

### Enterprise Protection ($99/month)
- 4 Guardian types
- 1-second monitoring
- AI protection + Human override

### Chaos Protection ($49/month)
- Ralph containment
- Controlled destruction boundaries
- 500ms monitoring

### Autonomous Protection ($199/month)
- Self-evolving AI guardians
- Predictive defense
- 100ms real-time protection

## 💳 Stripe Integration

```javascript
// Create subscription
const subscription = await guardian.createSubscription('enterprise-protection', 'cus_123');

// Handle webhook
await guardian.handleStripeWebhook(webhookBody, signature);
```

## ♾️ Continuous Updates

The system never stops running:

1. **Hot Reload** - Modify `guardian-config.json` and changes apply instantly
2. **Double Buffering** - Zero-downtime configuration swaps
3. **Live Webhooks** - Payment events trigger guardian updates
4. **Monitoring Loop** - Continuous 1-second update cycle

## 📺 Tmux Monitoring

Run `./start-guardian-tmux.sh` to get:

1. **guardian-monitor** - Live guardian status
2. **payment-flow** - Payment logs
3. **live-updates** - Continuous monitoring
4. **ralph-watch** - Ralph activity monitor
5. **config-watch** - Configuration changes
6. **contracts** - Active contracts

## 🔄 Hot Configuration

Edit `guardian-config.json`:

```json
{
  "templates": {
    "basic-protection": {
      "monitoring": {
        "interval": 2000,  // Change updates live!
        "alertThreshold": 3
      }
    }
  }
}
```

## 💰 Payment Contracts

```javascript
// Stripe subscription
{
  "id": "sub_guardian_abc123",
  "template": "enterprise-protection",
  "price": 9900,
  "interval": "month",
  "status": "active"
}

// Future: Ethereum smart contracts
{
  "type": "smart-contract",
  "network": "ethereum",
  "address": "0x..."
}
```

## 🎯 Key Features

1. **Never Stops** - Continuous operation with hot updates
2. **Templated** - Reusable guardian configurations
3. **Decentralized** - Stripe now, blockchain ready
4. **Double Buffered** - Zero-downtime updates
5. **Tmux Ready** - Visual monitoring dashboard
6. **Webhook Driven** - Real-time payment integration

## 🔧 API Examples

```javascript
// Activate guardian
await guardian.activateGuardianTemplate('chaos-protection');

// Create subscription
await guardian.createSubscription('enterprise-protection', customerId);

// Handle Stripe webhook
await guardian.handleStripeWebhook(event, signature);

// Hot reload config
await guardian.hotReloadGuardianConfig();

// Get active guardians
const active = guardian.getActiveGuardians();
```

## 🏃 Running the Demo

```bash
node demo-decentralized-guardian.js
```

This demonstrates:
- Template activation
- Subscription creation
- Webhook handling
- Hot configuration reload
- Double buffer swapping
- Live monitoring

## 🌟 Advanced Usage

### Custom Templates

Add to `guardian-config.json`:

```json
{
  "templates": {
    "custom-protection": {
      "guardians": ["custom-guardian"],
      "monitoring": {
        "interval": 2500,
        "alertThreshold": 7
      }
    }
  }
}
```

### Webhook Events

Supported Stripe events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

### Monitoring Commands

```bash
# Live monitoring
node decentralized-guardian-template.js monitor

# System status
node decentralized-guardian-template.js status

# Hot reload
node decentralized-guardian-template.js reload
```

## 🔮 Future Enhancements

1. **Ethereum Integration** - Smart contract subscriptions
2. **IPFS Storage** - Decentralized configuration
3. **Multi-chain Support** - Polygon, Arbitrum, etc.
4. **DAO Governance** - Community-controlled templates
5. **NFT Guardians** - Unique guardian instances

---

🌐 **Decentralized. Templated. Unstoppable.**
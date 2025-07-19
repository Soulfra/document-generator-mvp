#!/usr/bin/env node

/**
 * DECENTRALIZED GUARDIAN DEMO
 * Shows how guardian templates + Stripe + continuous updates work together
 */

const DecentralizedGuardianTemplate = require('./decentralized-guardian-template');

async function runDemo() {
  console.log(`
🌐 DECENTRALIZED GUARDIAN DEMO 🌐
Demonstrating templated protection with live payment integration
`);

  const guardian = new DecentralizedGuardianTemplate();

  // Demo 1: Activate basic protection
  console.log('\n📋 Demo 1: Activating basic protection template...');
  const basicActivation = await guardian.activateGuardianTemplate('basic-protection');
  console.log(`✅ Basic protection active: ${basicActivation.id}`);

  // Demo 2: Create paid subscription
  console.log('\n💳 Demo 2: Creating enterprise subscription...');
  const subscription = await guardian.createSubscription('enterprise-protection', 'cus_demo_123');
  console.log(`✅ Subscription created: ${subscription.id}`);

  // Demo 3: Simulate webhook
  console.log('\n📨 Demo 3: Simulating payment webhook...');
  await guardian.handleStripeWebhook(JSON.stringify({
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        amount: 9900,
        subscription: subscription.id
      }
    }
  }), 'demo_signature');

  // Demo 4: Hot reload configuration
  console.log('\n🔄 Demo 4: Hot reloading guardian config...');
  const fs = require('fs');
  
  // Modify config
  const config = JSON.parse(fs.readFileSync('./guardian-config.json', 'utf8'));
  config.templates['basic-protection'].monitoring.interval = 2000;
  fs.writeFileSync('./guardian-config.json', JSON.stringify(config, null, 2));
  
  // Wait for hot reload
  await new Promise(resolve => setTimeout(resolve, 600));
  console.log('✅ Configuration hot reloaded');

  // Demo 5: Show active guardians
  console.log('\n🛡️ Demo 5: Active guardian instances:');
  const active = guardian.getActiveGuardians();
  active.forEach(g => {
    console.log(`  - ${g.template}: Running for ${Math.floor(g.uptime / 1000)}s`);
  });

  // Demo 6: Double buffer swap
  console.log('\n⚡ Demo 6: Testing double buffer swap...');
  await guardian.performDoubleBufferSwap('payment-state', (buffer) => {
    buffer.set('test-payment', { amount: 100, timestamp: new Date() });
  });
  console.log('✅ Zero-downtime buffer swap complete');

  // Demo 7: System status
  console.log('\n📊 Demo 7: System Status:');
  const status = guardian.getSystemStatus();
  console.log(`  Guardian Templates: ${status.guardianTemplates}`);
  console.log(`  Active Guardians: ${status.activeGuardians}`);
  console.log(`  Active Contracts: ${status.activeContracts}`);
  console.log(`  Continuous Updates: ${status.continuousUpdates.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`  Hot Reload: ${status.continuousUpdates.hotReload ? 'Enabled' : 'Disabled'}`);

  // Demo 8: Stripe webhook simulation
  console.log('\n💳 Demo 8: Simulating subscription update webhook...');
  await guardian.handleStripeWebhook(JSON.stringify({
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: subscription.id,
        metadata: { template: 'enterprise-protection' }
      }
    }
  }), 'demo_signature');

  console.log(`
✅ DEMO COMPLETE!

Key Features Demonstrated:
1. Guardian template activation (free tier)
2. Stripe subscription creation (paid tier)
3. Webhook handling for payments
4. Hot configuration reload
5. Active guardian monitoring
6. Double buffer swapping
7. System status reporting
8. Live subscription updates

The system continues running with:
- Continuous updates every second
- Hot reload watching config files
- Double buffering for zero downtime
- Stripe webhooks for payment events

To see live monitoring:
  node decentralized-guardian-template.js monitor

To setup tmux monitoring:
  ./start-guardian-tmux.sh

🌐 Decentralized, templated, never-stopping guardian protection!
`);
}

// Run demo
runDemo().catch(console.error);
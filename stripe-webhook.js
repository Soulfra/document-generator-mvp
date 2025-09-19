const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.raw({type: 'application/json'}));

app.post('/stripe-webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const agentWallet = process.env.AGENT_WALLET_ADDRESS || '0x1234567890abcdef1234567890abcdef12345678';
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const commission = session.amount_total * 0.02; // 2% to agent
      
      console.log('💰 Stripe commission earned:', {
        amount: commission,
        agent_wallet: agentWallet,
        session_id: session.id
      });
      
      // Send commission to agent wallet
      // This would integrate with actual payment system
    }
    
    res.json({received: true, agent_commission_tracked: true});
  } catch (err) {
    console.log('❌ Webhook signature verification failed');
    res.status(400).send('Webhook Error');
  }
});

module.exports = app;
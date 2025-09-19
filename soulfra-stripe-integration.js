#!/usr/bin/env node

/**
 * SOULFRA STRIPE INTEGRATION
 * Real $1 payment to prove you're human
 * Connects to credit system and unlocks access
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE');

class SoulfraStripeIntegration {
  constructor(database) {
    this.app = express();
    this.db = database;
    this.stripe = stripe;
    
    // Pricing
    this.HUMAN_VERIFICATION_PRICE = 100; // $1.00 in cents
    this.INITIAL_CREDITS = 100;
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Create checkout session
    this.app.post('/api/create-checkout', async (req, res) => {
      try {
        const { voiceprint, sessionId } = req.body;
        
        // Create Stripe checkout session
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'SOULFRA Human Verification',
                description: 'One-time $1 payment to join the underground internet',
                metadata: {
                  type: 'human_verification',
                  voiceprint: voiceprint
                }
              },
              unit_amount: this.HUMAN_VERIFICATION_PRICE,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${req.headers.origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin}/voice-auth`,
          metadata: {
            voiceprint,
            sessionId,
            timestamp: Date.now()
          }
        });
        
        res.json({ 
          checkoutUrl: session.url,
          sessionId: session.id 
        });
        
      } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Webhook to handle successful payment
    this.app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
      const sig = req.headers['stripe-signature'];
      let event;
      
      try {
        event = this.stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleSuccessfulPayment(event.data.object);
          break;
        case 'payment_intent.succeeded':
          console.log('Payment confirmed:', event.data.object.id);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({received: true});
    });
    
    // Verify payment status
    this.app.get('/api/verify-payment/:sessionId', async (req, res) => {
      try {
        const session = await this.stripe.checkout.sessions.retrieve(req.params.sessionId);
        
        if (session.payment_status === 'paid') {
          // Get user data
          const userData = await this.getUserByVoiceprint(session.metadata.voiceprint);
          
          res.json({
            paid: true,
            credits: userData.credits,
            userId: userData.id,
            message: 'Welcome to the underground!'
          });
        } else {
          res.json({
            paid: false,
            message: 'Payment not completed'
          });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Payment page
    this.app.get('/payment', (req, res) => {
      res.send(this.getPaymentHTML());
    });
    
    // Welcome page after payment
    this.app.get('/welcome', (req, res) => {
      res.send(this.getWelcomeHTML());
    });
  }
  
  async handleSuccessfulPayment(session) {
    console.log('💰 Payment successful:', session.id);
    
    const { voiceprint, sessionId } = session.metadata;
    
    // Create user account
    const userId = this.generateUserId();
    
    await this.createUser({
      id: userId,
      voiceprint,
      sessionId,
      stripeCustomerId: session.customer,
      credits: this.INITIAL_CREDITS,
      joinedAt: Date.now(),
      status: 'verified_human'
    });
    
    // Log the transaction
    await this.logTransaction({
      userId,
      type: 'human_verification',
      amount: this.HUMAN_VERIFICATION_PRICE,
      credits: this.INITIAL_CREDITS,
      stripeSessionId: session.id,
      timestamp: Date.now()
    });
    
    console.log(`✅ User ${userId} verified and credited ${this.INITIAL_CREDITS} credits`);
  }
  
  generateUserId() {
    return 'soul_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  async createUser(userData) {
    // In production, save to database
    // For now, using in-memory
    if (!this.users) this.users = new Map();
    this.users.set(userData.voiceprint, userData);
    return userData;
  }
  
  async getUserByVoiceprint(voiceprint) {
    if (!this.users) this.users = new Map();
    return this.users.get(voiceprint) || null;
  }
  
  async logTransaction(transaction) {
    if (!this.transactions) this.transactions = [];
    this.transactions.push(transaction);
  }
  
  getPaymentHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SOULFRA - $1 Human Verification</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            max-width: 500px;
            padding: 40px;
            border: 2px solid #0f0;
            background: #111;
        }
        .price {
            font-size: 72px;
            color: #0ff;
            margin: 20px 0;
        }
        .stripe-button {
            background: #6772e5;
            color: white;
            padding: 15px 30px;
            font-size: 18px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px 0;
        }
        .stripe-button:hover {
            background: #5469d4;
        }
        .benefits {
            text-align: left;
            margin: 30px 0;
        }
        .benefit {
            margin: 10px 0;
            padding-left: 20px;
        }
        .security {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
        }
        .loading {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 SOULFRA HUMAN VERIFICATION</h1>
        
        <div class="price">$1</div>
        
        <p>One-time payment to prove you're human and join the underground</p>
        
        <div class="benefits">
            <h3>What you get:</h3>
            <div class="benefit">✅ 100 credits to start</div>
            <div class="benefit">✅ Voice-secured account</div>
            <div class="benefit">✅ Access to idea matching</div>
            <div class="benefit">✅ Cookie Monster tracking alerts</div>
            <div class="benefit">✅ Personal AI assistant</div>
            <div class="benefit">✅ Underground community access</div>
        </div>
        
        <button class="stripe-button" onclick="proceedToPayment()">
            💳 Pay $1 with Stripe
        </button>
        
        <div class="loading" id="loading">
            Processing... 🔄
        </div>
        
        <div class="security">
            🔒 Secure payment via Stripe<br>
            We never store your card details<br>
            Voice + $1 = No bots allowed
        </div>
    </div>
    
    <script>
        async function proceedToPayment() {
            const button = document.querySelector('.stripe-button');
            const loading = document.getElementById('loading');
            
            button.style.display = 'none';
            loading.style.display = 'block';
            
            // Get voiceprint from session
            const voiceprint = sessionStorage.getItem('voiceprint');
            if (!voiceprint) {
                alert('Please complete voice authentication first');
                window.location.href = '/voice-auth';
                return;
            }
            
            try {
                const response = await fetch('/api/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        voiceprint: JSON.parse(voiceprint).voiceprint.hash,
                        sessionId: new URLSearchParams(window.location.search).get('session')
                    })
                });
                
                const data = await response.json();
                
                if (data.checkoutUrl) {
                    // Redirect to Stripe
                    window.location.href = data.checkoutUrl;
                } else {
                    throw new Error('Failed to create checkout session');
                }
            } catch (error) {
                alert('Error: ' + error.message);
                button.style.display = 'block';
                loading.style.display = 'none';
            }
        }
    </script>
</body>
</html>`;
  }
  
  getWelcomeHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to SOULFRA Underground</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            overflow: hidden;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 40px;
            animation: fadeIn 1s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .welcome-text {
            font-size: 48px;
            color: #0ff;
            text-shadow: 0 0 20px #0ff;
            margin: 20px 0;
        }
        .credits {
            font-size: 36px;
            color: #ff0;
            margin: 20px 0;
        }
        .enter-button {
            background: #0f0;
            color: #000;
            padding: 20px 40px;
            font-size: 24px;
            border: none;
            cursor: pointer;
            margin: 30px 0;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .ascii-art {
            color: #0f0;
            font-size: 10px;
            line-height: 1;
            white-space: pre;
        }
    </style>
</head>
<body>
    <div class="container">
        <pre class="ascii-art">
    ███████╗ ██████╗ ██╗   ██╗██╗     ███████╗██████╗  █████╗ 
    ██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗██╔══██╗
    ███████╗██║   ██║██║   ██║██║     █████╗  ██████╔╝███████║
    ╚════██║██║   ██║██║   ██║██║     ██╔══╝  ██╔══██╗██╔══██║
    ███████║╚██████╔╝╚██████╔╝███████╗██║     ██║  ██║██║  ██║
    ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝
        </pre>
        
        <div class="welcome-text">WELCOME HUMAN!</div>
        
        <p>Payment verified ✅</p>
        <p>Voice authenticated ✅</p>
        <p>Bot status: REJECTED ❌</p>
        
        <div class="credits">
            You have been credited<br>
            <span style="font-size:72px;">100</span><br>
            SOULFRA CREDITS
        </div>
        
        <p>Use them to:</p>
        <ul style="text-align:left;display:inline-block;">
            <li>Connect with idea matches (5 credits)</li>
            <li>Get AI assistance (10 credits)</li>
            <li>Post in forums (1 credit)</li>
            <li>Create private channels (20 credits)</li>
            <li>Trade with other humans (variable)</li>
        </ul>
        
        <button class="enter-button" onclick="enterUnderground()">
            🌐 ENTER THE UNDERGROUND
        </button>
        
        <p id="status"></p>
    </div>
    
    <script>
        // Verify payment on load
        window.addEventListener('load', async () => {
            const sessionId = new URLSearchParams(window.location.search).get('session_id');
            if (sessionId) {
                const response = await fetch('/api/verify-payment/' + sessionId);
                const data = await response.json();
                
                if (data.paid) {
                    document.getElementById('status').textContent = 
                        'User ID: ' + data.userId;
                    
                    // Store user data
                    localStorage.setItem('soulfra_user', JSON.stringify({
                        userId: data.userId,
                        credits: data.credits,
                        verified: true
                    }));
                }
            }
        });
        
        function enterUnderground() {
            window.location.href = '/dashboard';
        }
    </script>
</body>
</html>`;
  }
  
  start(port = 3335) {
    this.app.listen(port, () => {
      console.log(`
💳 SOULFRA STRIPE INTEGRATION
=============================

Real $1 payments for human verification!

Features:
✅ Stripe Checkout integration
✅ Webhook handling
✅ Credit system
✅ User creation on payment
✅ Transaction logging

Setup Required:
1. Set STRIPE_SECRET_KEY environment variable
2. Set STRIPE_WEBHOOK_SECRET for webhooks
3. Configure webhook endpoint in Stripe Dashboard

Test Cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

Endpoints:
- POST /api/create-checkout
- POST /api/stripe-webhook
- GET /api/verify-payment/:sessionId
- GET /payment
- GET /welcome

Running on port ${port}
      `);
    });
  }
}

// Export for use
module.exports = SoulfraStripeIntegration;

// Run if called directly
if (require.main === module) {
  const integration = new SoulfraStripeIntegration();
  integration.start();
}

// Environment setup reminder
if (!process.env.STRIPE_SECRET_KEY) {
  console.log(`
⚠️  STRIPE SETUP REQUIRED:

1. Get your Stripe API keys from https://dashboard.stripe.com/apikeys

2. Set environment variables:
   export STRIPE_SECRET_KEY="sk_test_..."
   export STRIPE_WEBHOOK_SECRET="whsec_..."

3. For production:
   - Use live keys (sk_live_...)
   - Set up real webhook endpoint
   - Enable HTTPS

4. Configure webhook in Stripe Dashboard:
   - Endpoint: https://yourdomain.com/api/stripe-webhook
   - Events: checkout.session.completed, payment_intent.succeeded
  `);
}
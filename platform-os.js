#!/usr/bin/env node

/**
 * DOCUMENT GENERATOR PLATFORM OS
 * Your actual platform - people use YOUR LLM system inside
 * - User apps run in sandboxed environments
 * - They call YOUR AI APIs (you control costs/access)
 * - They process stories/documents through YOUR system
 * - You take a cut of everything they make
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

// Platform OS Core
class PlatformOS extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.userApps = new Map();
    this.aiUsage = new Map();
    this.revenue = new Map();
    this.config = {
      aiCostPerRequest: 0.01,
      platformCut: 0.30, // 30% of user revenue
      freeRequests: 100,
      models: ['story-analyzer', 'framework-extractor', 'mvp-generator']
    };
  }

  // Register a new user/developer
  registerUser(userId, userData) {
    this.users.set(userId, {
      ...userData,
      credits: this.config.freeRequests,
      apps: [],
      revenue: 0,
      joined: new Date()
    });
    
    console.log(`👤 New user registered: ${userId}`);
    return userId;
  }

  // User creates an app on YOUR platform
  createUserApp(userId, appConfig) {
    const appId = `app_${Date.now()}`;
    const app = {
      id: appId,
      userId,
      name: appConfig.name,
      type: appConfig.type,
      aiCalls: 0,
      revenue: 0,
      created: new Date(),
      status: 'active'
    };
    
    this.userApps.set(appId, app);
    
    const user = this.users.get(userId);
    user.apps.push(appId);
    
    console.log(`📱 User ${userId} created app: ${appConfig.name}`);
    return app;
  }

  // User app calls YOUR AI
  async callPlatformAI(appId, aiRequest) {
    const app = this.userApps.get(appId);
    const user = this.users.get(app.userId);
    
    // Check credits
    if (user.credits <= 0) {
      throw new Error('No credits remaining. Please purchase more.');
    }
    
    // Process with YOUR AI
    const result = await this.processWithAI(aiRequest);
    
    // Track usage
    user.credits--;
    app.aiCalls++;
    this.trackAIUsage(app.userId, appId, aiRequest.model);
    
    return result;
  }

  // YOUR AI processing (this is where you control everything)
  async processWithAI(request) {
    console.log(`🤖 Processing with model: ${request.model}`);
    
    // Simulate different AI models you provide
    switch (request.model) {
      case 'story-analyzer':
        return {
          themes: ['overcoming', 'growth', 'helping others'],
          sentiment: 'positive',
          potential: 'high'
        };
        
      case 'framework-extractor':
        return {
          framework: {
            title: 'Personal Growth Framework',
            pillars: ['Responsibility', 'Daily Habits', 'Community'],
            actions: ['Morning routine', 'Weekly review', 'Help someone'],
            price: '$97'
          }
        };
        
      case 'mvp-generator':
        return {
          mvp: {
            type: 'coaching-platform',
            features: ['Landing page', 'Payment integration', 'User dashboard'],
            deployUrl: `/deploy/${Date.now()}`
          }
        };
        
      default:
        return { processed: true, data: request.input };
    }
  }

  // Track AI usage for billing
  trackAIUsage(userId, appId, model) {
    const key = `${userId}:${new Date().toISOString().split('T')[0]}`;
    const current = this.aiUsage.get(key) || { total: 0, byModel: {} };
    
    current.total++;
    current.byModel[model] = (current.byModel[model] || 0) + 1;
    
    this.aiUsage.set(key, current);
  }

  // When user app makes money, you get a cut
  recordRevenue(appId, amount) {
    const app = this.userApps.get(appId);
    const user = this.users.get(app.userId);
    
    const platformCut = amount * this.config.platformCut;
    const userCut = amount - platformCut;
    
    app.revenue += amount;
    user.revenue += userCut;
    
    // Track platform revenue
    const monthKey = new Date().toISOString().slice(0, 7);
    const currentRevenue = this.revenue.get(monthKey) || 0;
    this.revenue.set(monthKey, currentRevenue + platformCut);
    
    console.log(`💰 Revenue: $${amount} (Platform: $${platformCut.toFixed(2)}, User: $${userCut.toFixed(2)})`);
    
    return { platformCut, userCut };
  }

  // Get platform stats
  getStats() {
    return {
      users: this.users.size,
      apps: this.userApps.size,
      totalAICalls: Array.from(this.userApps.values()).reduce((sum, app) => sum + app.aiCalls, 0),
      revenue: Array.from(this.revenue.entries()),
      topApps: Array.from(this.userApps.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    };
  }
}

// Platform Web Interface
class PlatformInterface {
  constructor(platformOS) {
    this.os = platformOS;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // User registration
    this.app.post('/api/register', (req, res) => {
      const { email, name } = req.body;
      const userId = `user_${Date.now()}`;
      this.os.registerUser(userId, { email, name });
      res.json({ userId, credits: this.os.config.freeRequests });
    });

    // Create app
    this.app.post('/api/apps', (req, res) => {
      const { userId, name, type } = req.body;
      const app = this.os.createUserApp(userId, { name, type });
      res.json(app);
    });

    // Call platform AI
    this.app.post('/api/ai/:model', async (req, res) => {
      try {
        const { appId, input } = req.body;
        const result = await this.os.callPlatformAI(appId, {
          model: req.params.model,
          input
        });
        res.json({ success: true, result });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Record revenue
    this.app.post('/api/revenue', (req, res) => {
      const { appId, amount } = req.body;
      const result = this.os.recordRevenue(appId, amount);
      res.json(result);
    });

    // Platform stats
    this.app.get('/api/stats', (req, res) => {
      res.json(this.os.getStats());
    });

    // User dashboard
    this.app.get('/api/users/:userId', (req, res) => {
      const user = this.os.users.get(req.params.userId);
      const apps = user.apps.map(appId => this.os.userApps.get(appId));
      res.json({ user, apps });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('📡 New WebSocket connection');
      
      // Send live updates
      const interval = setInterval(() => {
        ws.send(JSON.stringify({
          type: 'stats',
          data: this.os.getStats()
        }));
      }, 2000);
      
      ws.on('close', () => clearInterval(interval));
    });
  }

  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Document Generator Platform - Build Apps Using Our AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .demo-section {
            background: #e3f2fd;
            padding: 30px;
            border-radius: 10px;
            margin: 20px 0;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #5a67d8; }
        .code {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            margin: 10px 0;
        }
        .stats {
            font-family: monospace;
            background: #000;
            color: #0f0;
            padding: 20px;
            border-radius: 10px;
        }
        #liveStats { min-height: 200px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Document Generator Platform</h1>
        <p>Build Apps Using Our AI - We Handle The Hard Parts</p>
    </div>
    
    <div class="container">
        <div class="demo-section">
            <h2>💡 How It Works</h2>
            <ol>
                <li>Register as a developer (get 100 free AI calls)</li>
                <li>Create your app on our platform</li>
                <li>Use our AI models: story-analyzer, framework-extractor, mvp-generator</li>
                <li>When you make money, we take 30% (we provide the AI!)</li>
            </ol>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🧪 Try It Now</h3>
                <button onclick="registerUser()">Register as Developer</button>
                <div id="userInfo"></div>
                
                <div id="appCreation" style="display:none; margin-top:20px;">
                    <input type="text" id="appName" placeholder="App name" style="padding:5px; width:200px;">
                    <button onclick="createApp()">Create App</button>
                    <div id="appInfo"></div>
                </div>
            </div>
            
            <div class="card">
                <h3>🤖 Test Our AI</h3>
                <div id="aiTest" style="display:none;">
                    <select id="aiModel" style="padding:5px; margin:5px;">
                        <option value="story-analyzer">Story Analyzer</option>
                        <option value="framework-extractor">Framework Extractor</option>
                        <option value="mvp-generator">MVP Generator</option>
                    </select>
                    <br>
                    <textarea id="aiInput" placeholder="Enter text to process" style="width:100%; height:100px; margin:5px 0;"></textarea>
                    <button onclick="callAI()">Process with AI</button>
                    <div id="aiResult"></div>
                </div>
            </div>
            
            <div class="card">
                <h3>💰 Simulate Revenue</h3>
                <div id="revenueTest" style="display:none;">
                    <input type="number" id="saleAmount" placeholder="Sale amount" value="100" style="padding:5px;">
                    <button onclick="recordSale()">Record Sale</button>
                    <div id="revenueResult"></div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>📊 Live Platform Stats</h3>
            <div class="stats" id="liveStats">Connecting...</div>
        </div>
        
        <div class="demo-section">
            <h3>🔧 Developer API</h3>
            <div class="code">
// Your app calls our AI
const response = await fetch('https://platform.com/api/ai/story-analyzer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        appId: 'your-app-id',
        input: 'User story text here'
    })
});

const result = await response.json();
// Use AI results to build your product
            </div>
        </div>
    </div>
    
    <script>
        let currentUser = null;
        let currentApp = null;
        
        // WebSocket for live updates
        const ws = new WebSocket('ws://localhost:5005');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'stats') {
                document.getElementById('liveStats').textContent = JSON.stringify(data.data, null, 2);
            }
        };
        
        async function registerUser() {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'demo@example.com',
                    name: 'Demo User'
                })
            });
            
            currentUser = await response.json();
            document.getElementById('userInfo').innerHTML = 
                '<p>✅ Registered! User ID: ' + currentUser.userId + '</p>' +
                '<p>Credits: ' + currentUser.credits + '</p>';
            document.getElementById('appCreation').style.display = 'block';
        }
        
        async function createApp() {
            const appName = document.getElementById('appName').value;
            const response = await fetch('/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.userId,
                    name: appName,
                    type: 'story-processor'
                })
            });
            
            currentApp = await response.json();
            document.getElementById('appInfo').innerHTML = 
                '<p>✅ App created! ID: ' + currentApp.id + '</p>';
            
            document.getElementById('aiTest').style.display = 'block';
            document.getElementById('revenueTest').style.display = 'block';
        }
        
        async function callAI() {
            const model = document.getElementById('aiModel').value;
            const input = document.getElementById('aiInput').value;
            
            const response = await fetch('/api/ai/' + model, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: currentApp.id,
                    input: input
                })
            });
            
            const result = await response.json();
            document.getElementById('aiResult').innerHTML = 
                '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        }
        
        async function recordSale() {
            const amount = parseFloat(document.getElementById('saleAmount').value);
            
            const response = await fetch('/api/revenue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: currentApp.id,
                    amount: amount
                })
            });
            
            const result = await response.json();
            document.getElementById('revenueResult').innerHTML = 
                '<p>💰 Sale recorded!</p>' +
                '<p>Platform cut (30%): $' + result.platformCut.toFixed(2) + '</p>' +
                '<p>Your cut (70%): $' + result.userCut.toFixed(2) + '</p>';
        }
    </script>
</body>
</html>
    `;
  }

  start(port = 5005) {
    this.server.listen(port, () => {
      console.log(`\n🌐 Platform Interface running at http://localhost:${port}`);
      console.log('\n📋 What users can do:');
      console.log('   1. Register and get free credits');
      console.log('   2. Create apps that use YOUR AI');
      console.log('   3. Process stories/documents through YOUR system');
      console.log('   4. When they make money, you get 30%\n');
    });
  }
}

// Launch the platform
async function main() {
  console.log('🚀 DOCUMENT GENERATOR PLATFORM OS');
  console.log('=====================================\n');
  
  const platformOS = new PlatformOS();
  const interface = new PlatformInterface(platformOS);
  
  // Start the platform
  interface.start(5005);
  
  console.log('✅ Platform OS is running!');
  console.log('📊 Open http://localhost:5005 to see the platform\n');
  
  // Simulate some activity
  setTimeout(() => {
    console.log('🎭 Simulating platform activity...\n');
    
    // Register a user
    const userId = platformOS.registerUser('demo_user', {
      email: 'demo@example.com',
      name: 'Demo Developer'
    });
    
    // User creates an app
    const app = platformOS.createUserApp(userId, {
      name: 'Recovery Story Processor',
      type: 'story-processor'
    });
    
    // App uses AI
    platformOS.callPlatformAI(app.id, {
      model: 'story-analyzer',
      input: 'Test story about recovery'
    });
    
    // App makes money
    setTimeout(() => {
      platformOS.recordRevenue(app.id, 100); // $100 sale
    }, 2000);
  }, 3000);
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Platform OS...');
  process.exit(0);
});

// Run it!
main().catch(console.error);
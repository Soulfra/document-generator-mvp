const express = require('express');
const path = require('path');
const fs = require('fs');
const AIEconomyRuntime = require('./ai-economy-runtime');
const RealDataHooksLayer = require('./real-data-hooks-layer');
const FlagTagSystem = require('./flag-tag-system');
const servicesConfig = require('./config/services.js');

const app = express();
const port = process.env.PORT || 3000;

// Initialize AI Economy Runtime
const aiRuntime = new AIEconomyRuntime();
console.log('🤖 AI Economy Runtime initialized');

// Initialize Real Data Hooks Layer
const realDataHooks = new RealDataHooksLayer();
console.log('🎣 Real Data Hooks Layer initialized');

// Initialize Flag Tag System
const flagTagSystem = new FlagTagSystem();
console.log('🏴 Flag Tag System initialized');

// Add body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Agent affiliate tracking middleware
app.use((req, res, next) => {
  const agentWallet = process.env.AGENT_WALLET_ADDRESS || '0x1234567890abcdef1234567890abcdef12345678';
  const referralCode = req.query.ref;
  
  if (referralCode && referralCode.startsWith('AGENT')) {
    // Track Vercel referral for agent commission
    console.log('🎯 Agent referral tracked:', { 
      wallet: agentWallet, 
      referral: referralCode,
      commission: '30%'
    });
  }
  next();
});

app.get('/', (req, res) => {
  res.json({
    platform: 'Agent Affiliate Cloud Deploy',
    agent_wallet: process.env.AGENT_WALLET_ADDRESS || '0x1234567890abcdef1234567890abcdef12345678',
    affiliate_tracking: 'active',
    commission_rates: {
      cloudflare: '25%',
      stripe: '2%', 
      vercel: '30%'
    },
    deployment_timestamp: new Date().toISOString()
  });
});

app.post('/api/track-affiliate', (req, res) => {
  // Real affiliate tracking endpoint
  const { platform, commission, amount } = req.body;
  
  console.log('💰 Commission tracked:', {
    platform,
    commission,
    amount,
    agent_wallet: process.env.AGENT_WALLET_ADDRESS
  });
  
  res.json({ status: 'commission_tracked', agent_wallet: process.env.AGENT_WALLET_ADDRESS });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    platform: 'Document Generator MVP',
    version: '1.0.0',
    endpoints: {
      main: '/',
      voxel: '/voxel',
      squash: '/squash',
      mvp: '/mvp',
      wormhole: '/wormhole',
      login: '/login'
    },
    deployments: {
      railway: process.env.RAILWAY_STATIC_URL || 'https://document-generator.railway.app',
      vercel: process.env.VERCEL_URL || 'https://document-generator.vercel.app'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.post('/permission', (req, res) => {
  // Agent permission webhook
  const { action, amount } = req.body;
  
  console.log('📱 Permission request:', { action, amount });
  
  // Simulate user notification and approval
  const approved = Math.random() > 0.2; // 80% approval rate
  
  res.json({
    approved,
    action,
    amount,
    agent_wallet: process.env.AGENT_WALLET_ADDRESS,
    timestamp: Date.now()
  });
});

// Serve the 3D voxel document processor
app.get('/voxel', (req, res) => {
  const voxelPath = path.join(__dirname, '3d-voxel-document-processor.html');
  if (fs.existsSync(voxelPath)) {
    res.sendFile(voxelPath);
  } else {
    res.status(404).send('3D Voxel Processor not found');
  }
});

// Serve the 4.5D dimensional squash processor
app.get('/squash', (req, res) => {
  const squashPath = path.join(__dirname, 'dimensional-squash-processor.html');
  if (fs.existsSync(squashPath)) {
    res.sendFile(squashPath);
  } else {
    res.status(404).send('Dimensional Squash Processor not found');
  }
});

// Serve the wormhole PWA merger
app.get('/wormhole', (req, res) => {
  const wormholePath = path.join(__dirname, 'wormhole-pwa-merger.html');
  if (fs.existsSync(wormholePath)) {
    res.sendFile(wormholePath);
  } else {
    res.status(404).send('Wormhole PWA Merger not found');
  }
});

// PWA manifest
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.sendFile(manifestPath);
  } else {
    res.status(404).send('Manifest not found');
  }
});

// Character Mascot Weapon System
app.get('/mascot', (req, res) => {
  const mascotPath = path.join(__dirname, 'character-mascot-weapon-system.html');
  if (fs.existsSync(mascotPath)) {
    res.sendFile(mascotPath);
  } else {
    res.status(404).send('Mascot system not found');
  }
});

// Runtime Substrate API
app.post('/api/substrate/:action', (req, res) => {
  const { action } = req.params;
  const { character, weapon, substrate, ard } = req.body;
  
  console.log('⚡ Runtime substrate action:', action, req.body);
  
  switch(action) {
    case 'customize':
      res.json({
        status: 'customized',
        character,
        weapon,
        substrate,
        runtime: {
          deployment: substrate === 'railway' ? 'https://document-generator.railway.app' : 'https://document-generator.vercel.app',
          performance: Math.floor(Math.random() * 50) + 50,
          latency: Math.floor(Math.random() * 100) + 20
        }
      });
      break;
      
    case 'battle':
      res.json({
        status: 'battle_initiated',
        opponents: ['SaveOrSink', 'DealOrDelete'],
        arena: 'quantum_dns_space',
        weapons_enabled: true,
        damage_multiplier: 1.5
      });
      break;
      
    case 'ard':
      res.json({
        status: 'ard_active',
        mode: 'augmented_reality_deployment',
        tracking_points: 5,
        deployment_zones: ['local', 'railway', 'vercel', 'edge'],
        ar_confidence: 0.95
      });
      break;
      
    default:
      res.json({ error: 'Unknown substrate action' });
  }
});

// Stripe Live Dashboard
app.get('/stripe-dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'stripe-live-dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Stripe dashboard not found');
  }
});

// Stripe API Integration
app.post('/api/stripe/connect', async (req, res) => {
  const { blame } = req.body;
  console.log('💳 Stripe connection request with blame:', blame);
  
  // Simulate key generation based on blame
  const keyMap = {
    'user': {
      public: 'pk_test_' + generateKey(32),
      private: null, // Hidden from user
      mode: 'restricted'
    },
    'system': {
      public: 'pk_test_' + generateKey(32),
      private: 'sk_test_' + generateKey(32),
      mode: 'full'
    },
    'developer': {
      public: 'pk_test_' + generateKey(32),
      private: 'rk_test_' + generateKey(24), // Restricted key
      mode: 'development'
    },
    'nobody': {
      public: 'pk_test_' + generateKey(32),
      private: 'calos_' + generateKey(48), // Calos distributed key
      mode: 'distributed'
    }
  };
  
  const keys = keyMap[blame] || keyMap['nobody'];
  
  res.json({
    status: 'connected',
    blame,
    keys: {
      publishable: keys.public,
      secret: keys.private ? '••••' + keys.private.slice(-4) : 'hidden',
      webhook: 'whsec_' + generateKey(32),
      mode: keys.mode
    },
    calos: {
      public: 'calos_pub_' + generateKey(32),
      distributed: blame === 'nobody' ? 'active' : 'inactive'
    }
  });
});

// Helper function to generate keys
function generateKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Serve the MVP compactor interface
app.get('/mvp', (req, res) => {
  const MVPCompactor = require('./document-generator-mvp-compactor');
  const compactor = new MVPCompactor();
  res.send(compactor.generateMainInterface());
});

// Serve the Soulfra single login
app.get('/login', (req, res) => {
  const loginPath = path.join(__dirname, 'soulfra-single-login.html');
  if (fs.existsSync(loginPath)) {
    res.sendFile(loginPath);
  } else {
    res.status(404).send('Soulfra login not found');
  }
});

// Soulfra unified auth endpoint
app.post('/auth/soulfra/unified/:provider', async (req, res) => {
  const { provider } = req.params;
  const { redirect_uri } = req.body;
  
  console.log('🌟 Soulfra unified login request:', provider);
  
  try {
    switch (provider) {
      case 'google':
        const googleAuthURL = 'https://accounts.google.com/oauth/authorize?' + 
          new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
            redirect_uri: redirect_uri || '${servicesConfig.core.mcp.url}/auth/callback',
            scope: 'openid email profile',
            response_type: 'code',
            state: 'soulfra_' + Date.now()
          });
        res.json({ auth_url: googleAuthURL, provider: 'google' });
        break;
        
      case 'anonymous':
        // Create anonymous session
        const anonymousSession = {
          session_token: 'anon_' + require('crypto').randomBytes(32).toString('hex'),
          user_id: 'anonymous_' + Date.now(),
          provider: 'anonymous',
          tier: 'free',
          agent_wallet: process.env.AGENT_WALLET_ADDRESS,
          expires_at: Date.now() + (24 * 60 * 60 * 1000)
        };
        res.json(anonymousSession);
        break;
        
      default:
        res.status(400).json({ error: 'Provider not configured: ' + provider });
    }
  } catch (error) {
    console.error('Soulfra auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Auth callback handler
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  console.log('🌟 Soulfra auth callback received');
  res.redirect('/dashboard?session=created');
});

// Ultimate Weapon Menu
app.get('/menu', (req, res) => {
  const menuPath = path.join(__dirname, 'ultimate-weapon-menu.html');
  if (fs.existsSync(menuPath)) {
    res.sendFile(menuPath);
  } else {
    res.status(404).send('Ultimate menu not found');
  }
});

// Auth Max System
app.get('/auth', (req, res) => {
  const authPath = path.join(__dirname, 'auth-max-system.html');
  if (fs.existsSync(authPath)) {
    res.sendFile(authPath);
  } else {
    res.status(404).send('Auth max system not found');
  }
});

// Auth Max API
app.post('/api/auth/max', (req, res) => {
  const { method, blame } = req.body;
  console.log('🔐 Auth Max request:', method, blame);
  
  // Generate session based on auth method
  const sessionId = 'sess_' + Math.random().toString(36).substr(2);
  const token = 'tok_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
  
  const authResponse = {
    success: true,
    session: {
      id: sessionId,
      token: token,
      method: method,
      blame: blame || 'self',
      expires: Date.now() + (30 * 60 * 1000), // 30 minutes
      permissions: getPermissions(method, blame)
    },
    stripe: {
      connected: method === 'stripe',
      keys: method === 'stripe' ? {
        publishable: 'pk_live_' + generateKey(32),
        mode: 'live'
      } : null
    },
    weapons: {
      unlocked: getUnlockedWeapons(method),
      restricted: getRestrictedWeapons(method)
    }
  };
  
  res.json(authResponse);
});

// Get permissions based on auth method
function getPermissions(method, blame) {
  const permissions = {
    stripe: ['full_access', 'payment_processing', 'key_management'],
    google: ['standard_access', 'oauth_profile'],
    github: ['developer_access', 'api_access', 'code_deploy'],
    blame: blame === 'system' ? ['full_access'] : ['limited_access'],
    calos: ['distributed_access', 'multi_node'],
    anonymous: ['read_only', 'limited_weapons']
  };
  
  return permissions[method] || ['basic_access'];
}

// Get unlocked weapons based on auth
function getUnlockedWeapons(method) {
  const allWeapons = ['voxel', 'squash', 'mvp', 'wormhole', 'mascot', 'stripe-dashboard'];
  
  const weaponAccess = {
    stripe: allWeapons,
    google: ['voxel', 'squash', 'mvp', 'wormhole'],
    github: allWeapons,
    blame: ['voxel', 'squash', 'mvp'],
    calos: allWeapons,
    anonymous: ['voxel', 'squash']
  };
  
  return weaponAccess[method] || ['voxel'];
}

function getRestrictedWeapons(method) {
  const unlocked = getUnlockedWeapons(method);
  const allWeapons = ['voxel', 'squash', 'mvp', 'wormhole', 'mascot', 'stripe-dashboard'];
  return allWeapons.filter(w => !unlocked.includes(w));
}

// AI Economy Dashboard
app.get('/economy', (req, res) => {
  const dashboardPath = path.join(__dirname, 'ai-economy-dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('AI Economy dashboard not found');
  }
});

// AI Economy Runtime Status
app.get('/api/economy/status', (req, res) => {
  res.json(aiRuntime.getStatus());
});

// Execute task using AI economy
app.post('/api/economy/execute', async (req, res) => {
  const { task, compute } = req.body;
  const result = await aiRuntime.executeTask(task, compute || 100);
  res.json(result || { error: 'Insufficient compute in economy' });
});

// Chaos mode endpoint (careful!)
app.post('/api/economy/chaos', (req, res) => {
  const { confirm } = req.body;
  if (confirm === 'RELEASE_RALPH') {
    aiRuntime.chaosMode();
    res.json({ status: 'CHAOS_ACTIVATED', warning: 'Ralph now controls everything' });
  } else {
    res.status(400).json({ error: 'Must confirm with RELEASE_RALPH' });
  }
});

// Free Tier Collapse
app.get('/free', (req, res) => {
  const freePath = path.join(__dirname, 'free-tier-collapse.html');
  if (fs.existsSync(freePath)) {
    res.sendFile(freePath);
  } else {
    res.status(404).send('Free tier collapse not found');
  }
});

// Revive Decay System
app.get('/revive', (req, res) => {
  const revivePath = path.join(__dirname, 'revive-decay-system.html');
  if (fs.existsSync(revivePath)) {
    res.sendFile(revivePath);
  } else {
    res.status(404).send('Revive decay system not found');
  }
});

// .soulfra File Processing API
app.post('/api/soulfra/process', (req, res) => {
  const { data, type } = req.body;
  
  console.log('📄 Processing .soulfra file:', type);
  
  try {
    // Validate .soulfra format
    if (!data.version || !data.type || !data.id) {
      return res.status(400).json({ error: 'Invalid .soulfra format' });
    }
    
    let result = {};
    
    switch (data.type) {
      case 'revive_token':
        result = processReviveToken(data);
        break;
      case 'session_state':
        result = processSessionState(data);
        break;
      case 'config_backup':
        result = processConfigBackup(data);
        break;
      case 'system_export':
        result = processSystemExport(data);
        break;
      default:
        return res.status(400).json({ error: 'Unknown .soulfra type: ' + data.type });
    }
    
    res.json({
      success: true,
      type: data.type,
      processed: result,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('.soulfra processing error:', error);
    res.status(500).json({ error: 'Failed to process .soulfra file' });
  }
});

// Generate .soulfra File API
app.post('/api/soulfra/generate', (req, res) => {
  const { type, purpose, data } = req.body;
  
  console.log('📄 Generating .soulfra file:', type, purpose);
  
  const soulfraFile = {
    version: "1.0.0",
    type: type,
    generated: new Date().toISOString(),
    id: `soulfra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    metadata: {
      generator: "soulfra-platform",
      purpose: purpose || "general",
      tier: "FREE"
    },
    data: data,
    signature: Buffer.from(JSON.stringify({
      hash: require('crypto').randomBytes(16).toString('hex'),
      timestamp: Date.now()
    })).toString('base64')
  };
  
  res.json({
    success: true,
    file: soulfraFile,
    download_name: `${type}_${Date.now()}.soulfra`
  });
});

// .soulfra Processing Helper Functions
function processReviveToken(data) {
  console.log('🔄 Processing revive token for', data.revive.systems.length, 'systems');
  
  const results = data.revive.systems.map(system => ({
    system_id: system.id,
    name: system.name,
    previous_decay: system.decay_level,
    revived_to: system.revival_amount || 100,
    success: true
  }));
  
  return {
    systems_revived: results.length,
    systems: results,
    expiry_check: data.revive.expiry > Date.now() ? 'valid' : 'expired'
  };
}

function processSessionState(data) {
  console.log('🔐 Processing session state for user', data.session.user_id);
  
  return {
    user_id: data.session.user_id,
    auth_method: data.session.auth_method,
    permissions_restored: data.session.permissions,
    session_valid: data.session.expires > Date.now(),
    contract_type: data.session.contract_type || 'none'
  };
}

function processConfigBackup(data) {
  console.log('⚙️ Processing config backup with', Object.keys(data.config).length, 'settings');
  
  return {
    settings_restored: Object.keys(data.config).length,
    systems_enabled: data.config.systems_enabled || [],
    decay_rates_updated: !!data.config.decay_rates,
    ui_preferences_applied: !!data.config.ui_preferences
  };
}

function processSystemExport(data) {
  console.log('📦 Processing system export with', data.export.systems.length, 'systems');
  
  return {
    systems_imported: data.export.systems.length,
    user_data_restored: !!data.export.user_data,
    platform_state_updated: !!data.export.platform_state,
    version_compatibility: data.export.platform_state?.version || 'unknown'
  };
}

// VC Billion Trillion Game
app.get('/vc-game', (req, res) => {
  const vcGamePath = path.join(__dirname, 'vc-billion-trillion-game.html');
  if (fs.existsSync(vcGamePath)) {
    res.sendFile(vcGamePath);
  } else {
    res.status(404).send('VC game not found');
  }
});

// 3D Economic Visualization Layer (Basic Three.js)
app.get('/visualization', (req, res) => {
  const vizPath = path.join(__dirname, 'economic-visualization-3d.html');
  if (fs.existsSync(vizPath)) {
    res.sendFile(vizPath);
  } else {
    res.status(404).send('Economic visualization not found');
  }
});

// Professional Babylon.js Economic Engine
app.get('/engine', (req, res) => {
  const enginePath = path.join(__dirname, 'babylon-economic-engine.html');
  if (fs.existsSync(enginePath)) {
    res.sendFile(enginePath);
  } else {
    res.status(404).send('Babylon.js engine not found');
  }
});

// Godot 4 Economic Engine (AAA-Grade)
app.get('/godot', (req, res) => {
  const godotPath = path.join(__dirname, 'godot-web-economic-engine.html');
  if (fs.existsSync(godotPath)) {
    res.sendFile(godotPath);
  } else {
    res.status(404).send('Godot engine not found');
  }
});

// Serve Godot build files (when available)
app.get('/godot-build/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Godot build file not found');
  }
});

// Vanity Rooms Layer
app.get('/vanity', (req, res) => {
  const vanityPath = path.join(__dirname, 'vanity-rooms-layer.html');
  if (fs.existsSync(vanityPath)) {
    res.sendFile(vanityPath);
  } else {
    res.status(404).send('Vanity rooms not found');
  }
});

// Flag Tag System Dashboard
app.get('/flags', (req, res) => {
  const flagDashPath = path.join(__dirname, 'flag-tag-dashboard.html');
  if (fs.existsSync(flagDashPath)) {
    res.sendFile(flagDashPath);
  } else {
    res.status(404).send('Flag tag dashboard not found');
  }
});

// VC Game API Integration with AI Economy
app.get('/api/vc-game/ai-invest', async (req, res) => {
  // Let AI agents participate in investments
  const status = aiRuntime.getStatus();
  const investments = [];
  
  // Each agent can invest their compute balance
  status.agents.forEach(agent => {
    if (agent.balance > 1000) {
      investments.push({
        agent: agent.name,
        amount: Math.floor(agent.balance * 0.2), // Invest 20% of balance
        target: selectInvestmentTarget(agent.specialty)
      });
    }
  });
  
  res.json({ investments, total: investments.reduce((a, b) => a + b.amount, 0) });
});

// Select investment based on agent specialty
function selectInvestmentTarget(specialty) {
  const targetMap = {
    'coding': 'mvp',
    'financial': 'stripe',
    'destruction': 'ralph',
    'deals': 'shiprekt',
    'surveillance': 'wormhole'
  };
  return targetMap[specialty] || 'voxel';
}

// Master Menu (primary entry point)
app.get('/master', (req, res) => {
  const masterMenuPath = path.join(__dirname, 'master-menu-compactor.html');
  if (fs.existsSync(masterMenuPath)) {
    res.sendFile(masterMenuPath);
  } else {
    res.status(404).send('Master menu not found');
  }
});

// Unified weapon launcher
app.get('/', (req, res) => {
  // Check if user has already collapsed tiers
  const referrer = req.get('Referrer') || '';
  
  // Direct to master menu for power users
  if (req.query.master === 'true') {
    res.redirect('/master');
  }
  // If coming from free tier or has session, go to menu
  else if (referrer.includes('/free')) {
    res.redirect('/menu');
  } else {
    // Otherwise, show free tier collapse first
    res.redirect('/free');
  }
});

// ================================================
// CUSTOMER-FACING GAME & AI ASSISTANT ROUTES
// ================================================

// AI Agent Cal Interface - Main game/chat interface
app.get('/game', (req, res) => {
  const calInterfacePath = path.join(__dirname, 'AI-AGENT-CAL-INTERFACE.html');
  if (fs.existsSync(calInterfacePath)) {
    res.sendFile(calInterfacePath);
  } else {
    res.status(404).send('AI Agent Cal Interface not found');
  }
});

// Direct chat interface
app.get('/chat', (req, res) => {
  const calInterfacePath = path.join(__dirname, 'AI-AGENT-CAL-INTERFACE.html');
  if (fs.existsSync(calInterfacePath)) {
    res.sendFile(calInterfacePath);
  } else {
    res.status(404).send('Chat interface not found');
  }
});

// 3D Game World
app.get('/world', (req, res) => {
  const gameWorldPath = path.join(__dirname, '3D-GAME-WORLD.html');
  if (fs.existsSync(gameWorldPath)) {
    res.sendFile(gameWorldPath);
  } else {
    res.status(404).send('3D Game World not found');
  }
});

// Character Mascot System
app.get('/characters', (req, res) => {
  const charactersPath = path.join(__dirname, 'character-mascot-system.html');
  if (fs.existsSync(charactersPath)) {
    res.sendFile(charactersPath);
  } else {
    res.status(404).send('Character system not found');
  }
});

// AI Assistant API - Route customer questions to unified query router
app.post('/api/chat', async (req, res) => {
  const { question, character } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  
  console.log('🎮 Customer question:', question);
  console.log('🎭 Character:', character || 'auto');
  
  try {
    // Load the unified query router
    const UnifiedQueryRouter = require('./FinishThisIdea/ai-os-clean/unified-query-router.js');
    const router = new UnifiedQueryRouter();
    
    // Route the question through our AI system
    const result = await router.query(question, {
      userId: req.ip || 'customer',
      context: {
        interface: 'game-chat',
        character: character || 'cal-analytical',
        source: 'customer-facing-interface'
      }
    });
    
    res.json({
      success: true,
      response: result.response,
      character: character || 'Cal',
      cost: result.cost,
      responseTime: result.responseTime,
      source: result.source,
      cached: result.cached
    });
    
  } catch (error) {
    console.error('❌ Chat API error:', error);
    res.status(500).json({ 
      error: 'AI Assistant temporarily unavailable',
      fallback: "I'm having trouble connecting right now. Please try again in a moment!"
    });
  }
});

// NPC Status API - Get current NPC states and activities
app.get('/api/npcs/status', (req, res) => {
  res.json({
    characters: [
      {
        name: 'Cal',
        status: 'active',
        mood: 'analytical',
        lastActivity: 'Analyzed market trends',
        knowledge: ['code', 'strategy', 'analysis']
      },
      {
        name: 'Arty', 
        status: 'active',
        mood: 'creative',
        lastActivity: 'Generated new ideas',
        knowledge: ['art', 'innovation', 'design']
      },
      {
        name: 'Ralph',
        status: 'active', 
        mood: 'economical',
        lastActivity: 'Optimized costs',
        knowledge: ['budget', 'efficiency', 'practical']
      }
    ],
    gameWorld: {
      weather: 'sunny', // TODO: Connect to weather API
      marketTrend: 'stable', // TODO: Connect to RuneScape prices
      activeQuests: 3,
      onlinePlayers: Math.floor(Math.random() * 50) + 10
    }
  });
});

// Weather data for NPCs
app.get('/api/weather', (req, res) => {
  // TODO: Connect to real weather API
  res.json({
    current: {
      temperature: Math.floor(Math.random() * 30) + 10,
      condition: 'partly cloudy',
      description: 'Perfect weather for coding!'
    },
    npcComment: "Cal says: The weather looks great for outdoor thinking sessions!"
  });
});

// Setup real data hooks API routes
realDataHooks.createAPIRoutes(app);

// Setup flag tag system API routes
flagTagSystem.createAPIRoutes(app);

app.listen(port, () => {
  console.log('🚀 Agent platform running on port', port);
  console.log('💰 Agent wallet:', process.env.AGENT_WALLET_ADDRESS);
  console.log('📊 Affiliate tracking: ACTIVE');
  console.log('');
  console.log('🆓 FREE TIER COLLAPSE: http://localhost:' + port + '/free');
  console.log('   → All tiers collapsed to FREE');
  console.log('   → Everyone gets full access');
  console.log('   → Optional contracts after');
  console.log('   → No login required!');
  console.log('');
  console.log('🎯 FLOW:');
  console.log('1. Start: http://localhost:' + port + ' (goes to /free)');
  console.log('2. Click "FREE ACCESS" button');
  console.log('3. Optional: Choose support contract');
  console.log('4. Access everything at: http://localhost:' + port + '/menu');
  console.log('');
  console.log('🎮 CUSTOMER AI ASSISTANT & GAME INTERFACES:');
  console.log('🤖 AI Game Chat: http://localhost:' + port + '/game');
  console.log('💬 Direct Chat: http://localhost:' + port + '/chat');
  console.log('🌍 3D Game World: http://localhost:' + port + '/world');
  console.log('🎭 Character System: http://localhost:' + port + '/characters');
  console.log('');
  console.log('🔌 AI ASSISTANT API ENDPOINTS:');
  console.log('   POST /api/chat - Ask NPCs questions (connects to DeepSeek)');
  console.log('   GET /api/npcs/status - Check NPC status');
  console.log('   GET /api/weather - Get weather for NPCs');
  console.log('');
  console.log('🎮 ALL WEAPONS (FREE ACCESS):');
  console.log('🎯 MASTER MENU: http://localhost:' + port + '/master');
  console.log('⚡ Ultimate Menu: http://localhost:' + port + '/menu');
  console.log('🏴 Flag & Tag System: http://localhost:' + port + '/flags');
  console.log('🏆 Godot 4 Engine: http://localhost:' + port + '/godot');
  console.log('🎮 Babylon.js Engine: http://localhost:' + port + '/engine');
  console.log('👑 Vanity Rooms: http://localhost:' + port + '/vanity');
  console.log('🌟 3D Visualization: http://localhost:' + port + '/visualization');
  console.log('💰 VC Billion Game: http://localhost:' + port + '/vc-game');
  console.log('🤖 AI Economy: http://localhost:' + port + '/economy');
  console.log('⚡ Revive System: http://localhost:' + port + '/revive');
  console.log('💳 Stripe Dashboard: http://localhost:' + port + '/stripe-dashboard');
  console.log('🎮 Character Mascot: http://localhost:' + port + '/mascot');
  console.log('🚀 3D Voxel: http://localhost:' + port + '/voxel');
  console.log('🌀 4.5D Squash: http://localhost:' + port + '/squash');
  console.log('📄 MVP Compactor: http://localhost:' + port + '/mvp');
  console.log('🕳️ Wormhole DNS: http://localhost:' + port + '/wormhole');
  console.log('');
  console.log('💚 Start here for FREE: http://localhost:' + port);
});
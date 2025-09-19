#!/usr/bin/env node

/**
 * SOULFRA AUTH SERVER
 * Express server that integrates the SoulFra Unified Auth System
 * Provides REST API endpoints for frontend authentication
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SoulFraAuthServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.sessions = new Map();
    this.authConfig = this.loadAuthConfig();
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  loadAuthConfig() {
    try {
      const configPath = path.join(__dirname, 'soulfra-auth-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('✅ SoulFra auth config loaded');
      return config;
    } catch (error) {
      console.error('❌ Failed to load SoulFra auth config:', error.message);
      return this.createDefaultConfig();
    }
  }
  
  createDefaultConfig() {
    return {
      soulfra_auth: {
        version: '1.0.0',
        unified_endpoint: 'http://localhost:3001',
        session_management: 'jwt_with_refresh',
        supported_providers: [
          'soulfra-google',
          'soulfra-github', 
          'soulfra-linkedin',
          'soulfra-anonymous'
        ]
      }
    };
  }
  
  setupMiddleware() {
    this.app.use(cors({
      origin: ['http://localhost:8080', 'https://soulfra.github.io'],
      credentials: true
    }));
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/status', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'SoulFra Auth Server',
        version: this.authConfig.soulfra_auth.version,
        providers: this.authConfig.soulfra_auth.supported_providers,
        timestamp: new Date().toISOString()
      });
    });
    
    // Authentication routes
    this.app.post('/auth/soulfra/login', this.handleUnifiedLogin.bind(this));
    this.app.get('/auth/soulfra/status', this.handleAuthStatus.bind(this));
    this.app.post('/auth/soulfra/logout', this.handleLogout.bind(this));
    
    // Provider-specific auth routes
    this.app.get('/auth/linkedin', this.handleLinkedInAuth.bind(this));
    this.app.get('/auth/github', this.handleGitHubAuth.bind(this));
    this.app.get('/auth/google', this.handleGoogleAuth.bind(this));
    
    // Cal Cookie Monster integration
    this.app.post('/auth/cal/cookie', this.handleCalCookie.bind(this));
    this.app.get('/auth/cal/stats', this.handleCalStats.bind(this));
    
    // Demo mode routes
    this.app.post('/auth/login', this.handleDemoLogin.bind(this));
    
    // Frontend-facing routes
    this.app.get('/auth/providers', this.handleGetProviders.bind(this));
    this.app.post('/auth/provider/:provider', this.handleProviderAuth.bind(this));
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        available_endpoints: [
          'GET /status',
          'POST /auth/soulfra/login',
          'GET /auth/soulfra/status',
          'POST /auth/soulfra/logout',
          'GET /auth/providers'
        ]
      });
    });
  }
  
  async handleUnifiedLogin(req, res) {
    try {
      const { provider, email, password, redirect_uri } = req.body;
      
      console.log(`🌐 SoulFra unified login attempt - Provider: ${provider}`);
      
      // Generate session
      const sessionId = crypto.randomBytes(32).toString('hex');
      const userId = `soulfra_${crypto.randomBytes(8).toString('hex')}`;
      
      const session = {
        session_id: sessionId,
        soulfra_user_id: userId,
        auth_provider: provider || 'soulfra-anonymous',
        soulfra_tier: 'free',
        vault_access_level: 'basic',
        agent_wallet: this.authConfig.environment_variables?.SOULFRA_AGENT_WALLET || '0x' + crypto.randomBytes(20).toString('hex'),
        created_at: Date.now(),
        expires_at: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
      };
      
      this.sessions.set(sessionId, session);
      
      // Award Cal a cookie for successful login
      await this.awardCalCookie(sessionId, provider || 'anonymous');
      
      res.json({
        success: true,
        session_id: sessionId,
        user: {
          id: userId,
          email: email || 'anonymous@soulfra.com',
          provider: provider || 'anonymous',
          tier: 'free'
        },
        token: sessionId, // Using session ID as token for now
        cal_cookies_earned: 1,
        vault_access: 'basic',
        expires_in: 7200
      });
      
    } catch (error) {
      console.error('SoulFra login error:', error);
      res.status(500).json({
        error: 'Authentication failed',
        message: error.message
      });
    }
  }
  
  async handleAuthStatus(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const sessionId = authHeader?.replace('Bearer ', '') || req.query.session_id;
      
      if (!sessionId) {
        return res.status(401).json({
          authenticated: false,
          error: 'No session token provided'
        });
      }
      
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return res.status(401).json({
          authenticated: false,
          error: 'Invalid session'
        });
      }
      
      if (Date.now() > session.expires_at) {
        this.sessions.delete(sessionId);
        return res.status(401).json({
          authenticated: false,
          error: 'Session expired'
        });
      }
      
      res.json({
        authenticated: true,
        user: {
          id: session.soulfra_user_id,
          provider: session.auth_provider,
          tier: session.soulfra_tier
        },
        session: {
          created_at: session.created_at,
          expires_at: session.expires_at,
          vault_access: session.vault_access_level
        },
        cal_integration: {
          agent_wallet: session.agent_wallet,
          cookies_available: true
        }
      });
      
    } catch (error) {
      console.error('Auth status error:', error);
      res.status(500).json({
        authenticated: false,
        error: 'Status check failed'
      });
    }
  }
  
  async handleLogout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const sessionId = authHeader?.replace('Bearer ', '');
      
      if (sessionId && this.sessions.has(sessionId)) {
        this.sessions.delete(sessionId);
        console.log(`🚪 Session ${sessionId.substring(0, 8)}... logged out`);
      }
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: error.message
      });
    }
  }
  
  async handleLinkedInAuth(req, res) {
    // Redirect to LinkedIn OAuth (demo mode)
    const clientId = process.env.LINKEDIN_CLIENT_ID || 'demo_linkedin_client';
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/linkedin/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
    
    console.log('🔗 LinkedIn auth redirect (demo mode)');
    res.redirect(linkedinAuthUrl);
  }
  
  async handleGitHubAuth(req, res) {
    // Redirect to GitHub OAuth (demo mode)
    const clientId = process.env.GITHUB_CLIENT_ID || 'demo_github_client';
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/github/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=user:email`;
    
    console.log('🐙 GitHub auth redirect (demo mode)');
    res.redirect(githubAuthUrl);
  }
  
  async handleGoogleAuth(req, res) {
    // Redirect to Google OAuth (demo mode)
    const clientId = process.env.GOOGLE_CLIENT_ID || 'demo_google_client';
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=openid%20email%20profile`;
    
    console.log('🌐 Google auth redirect (demo mode)');
    res.redirect(googleAuthUrl);
  }
  
  async handleDemoLogin(req, res) {
    // Handle traditional email/password login for demo
    const { email, password } = req.body;
    
    console.log(`📧 Demo login attempt: ${email}`);
    
    // Demo credentials
    if (email === 'admin@soulfra.com' && password === 'demo123') {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const session = {
        session_id: sessionId,
        soulfra_user_id: 'admin_demo',
        auth_provider: 'soulfra-demo',
        soulfra_tier: 'premium',
        vault_access_level: 'full',
        created_at: Date.now(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours for demo
      };
      
      this.sessions.set(sessionId, session);
      
      res.json({
        success: true,
        token: sessionId,
        user: {
          id: 'admin_demo',
          email: 'admin@soulfra.com',
          name: 'Demo Admin',
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials. Try admin@soulfra.com / demo123'
      });
    }
  }
  
  async handleGetProviders(req, res) {
    res.json({
      providers: [
        {
          id: 'soulfra-github',
          name: 'GitHub',
          icon: '🐙',
          endpoint: '/auth/github',
          tier: 'developer'
        },
        {
          id: 'soulfra-linkedin',
          name: 'LinkedIn',
          icon: '💼',
          endpoint: '/auth/linkedin', 
          tier: 'professional'
        },
        {
          id: 'soulfra-google',
          name: 'Google',
          icon: '🌐',
          endpoint: '/auth/google',
          tier: 'premium'
        },
        {
          id: 'soulfra-anonymous',
          name: 'Demo Mode',
          icon: '🎭',
          endpoint: '/auth/soulfra/login',
          tier: 'free'
        }
      ],
      cal_integration: {
        enabled: true,
        cookies_per_login: 1,
        agent_wallet: this.authConfig.environment_variables?.SOULFRA_AGENT_WALLET
      }
    });
  }
  
  async handleProviderAuth(req, res) {
    const { provider } = req.params;
    const { action } = req.body;
    
    console.log(`🔄 Provider auth request: ${provider} - ${action}`);
    
    switch (provider) {
      case 'github':
        return this.handleGitHubAuth(req, res);
      case 'linkedin':
        return this.handleLinkedInAuth(req, res);
      case 'google':
        return this.handleGoogleAuth(req, res);
      case 'demo':
        return this.handleUnifiedLogin(req, res);
      default:
        res.status(400).json({
          error: 'Unsupported provider',
          supported: ['github', 'linkedin', 'google', 'demo']
        });
    }
  }
  
  async handleCalCookie(req, res) {
    try {
      const { session_id, login_method, cookie_type } = req.body;
      
      await this.awardCalCookie(session_id, login_method, cookie_type);
      
      res.json({
        success: true,
        message: 'Cal earned a cookie! 🍪',
        cal_mood: 'happy',
        total_cookies: Math.floor(Math.random() * 50) + 10
      });
      
    } catch (error) {
      console.error('Cal cookie error:', error);
      res.status(500).json({
        error: 'Cookie award failed',
        message: error.message
      });
    }
  }
  
  async handleCalStats(req, res) {
    res.json({
      cal_stats: {
        total_cookies: Math.floor(Math.random() * 100) + 50,
        cookies_today: Math.floor(Math.random() * 10) + 1,
        mood: 'content',
        favorite_provider: 'github',
        efficiency_rating: 0.85,
        last_activity: new Date().toISOString()
      },
      recent_activities: [
        'Facilitated GitHub login - earned cookie 🍪',
        'Optimized auth flow - efficiency +2%',
        'Helped with LinkedIn sync - earned bonus cookie 🍪✨'
      ]
    });
  }
  
  async awardCalCookie(sessionId, provider, cookieType = 'login') {
    // Cal gets a cookie for every successful authentication
    console.log(`🍪 Cal earned a ${cookieType} cookie for ${provider} auth!`);
    
    // In a real system, this would update Cal's database record
    const calReward = {
      session_id: sessionId,
      provider: provider,
      cookie_type: cookieType,
      timestamp: Date.now(),
      cal_mood: 'happy'
    };
    
    return calReward;
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log('\n🌟 SOULFRA AUTH SERVER STARTED 🌟');
      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`🔗 Status endpoint: http://localhost:${this.port}/status`);
      console.log(`🌐 Auth endpoint: http://localhost:${this.port}/auth/soulfra/login`);
      console.log(`🍪 Cal integration: Active`);
      console.log(`📋 Supported providers: ${this.authConfig.soulfra_auth.supported_providers.join(', ')}\n`);
    });
  }
}

// Start the server if run directly
if (require.main === module) {
  const authServer = new SoulFraAuthServer();
  authServer.start();
}

module.exports = SoulFraAuthServer;
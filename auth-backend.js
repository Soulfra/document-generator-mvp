#!/usr/bin/env node
// 🔐 AUTH BACKEND - Complete authentication system with platform integration

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const path = require('path');

class AuthBackend {
  constructor() {
    this.app = express();
    this.port = process.env.AUTH_PORT || 6666;
    
    // Configuration
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'economic-engine-secret-key',
      sessionSecret: process.env.SESSION_SECRET || 'economic-engine-session-secret',
      dbConfig: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'economic_engine'
      },
      oauth: {
        google: {
          clientID: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
          callbackURL: '/api/auth/google/callback'
        },
        github: {
          clientID: process.env.GITHUB_CLIENT_ID || 'demo-client-id',
          clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-client-secret',
          callbackURL: '/api/auth/github/callback'
        }
      }
    };
    
    this.db = null;
    this.setupMiddleware();
    this.setupPassport();
    this.setupRoutes();
  }

  async initDatabase() {
    try {
      this.db = await mysql.createConnection(this.config.dbConfig);
      console.log(chalk.green('✅ Database connected'));
      
      // Ensure users table exists
      await this.createUsersTable();
      
    } catch (error) {
      console.error(chalk.red('❌ Database connection failed:'), error.message);
      // Continue without database for demo purposes
    }
  }

  async createUsersTable() {
    if (!this.db) return;
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        auth_provider VARCHAR(50) DEFAULT 'local',
        auth_provider_id VARCHAR(255),
        tier VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        profile_data JSON,
        preferences JSON
      )
    `;
    
    await this.db.execute(createTableSQL);
    console.log(chalk.green('✅ Users table ready'));
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Session middleware
    this.app.use(session({
      secret: this.config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));
    
    // Passport middleware
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    // Serve static files
    this.app.use(express.static(path.dirname(__filename)));
  }

  setupPassport() {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
      clientID: this.config.oauth.google.clientID,
      clientSecret: this.config.oauth.google.clientSecret,
      callbackURL: this.config.oauth.google.callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await this.findOrCreateOAuthUser('google', profile);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
    
    // GitHub OAuth Strategy
    passport.use(new GitHubStrategy({
      clientID: this.config.oauth.github.clientID,
      clientSecret: this.config.oauth.github.clientSecret,
      callbackURL: this.config.oauth.github.callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await this.findOrCreateOAuthUser('github', profile);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
    
    // Serialize user
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });
    
    // Deserialize user
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.findUserById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  setupRoutes() {
    // Serve auth wrapper as main page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'auth-wrapper.html'));
    });
    
    // Auth API routes
    this.app.post('/api/auth/login', this.handleLogin.bind(this));
    this.app.post('/api/auth/signup', this.handleSignup.bind(this));
    this.app.post('/api/auth/guest', this.handleGuest.bind(this));
    this.app.get('/api/auth/session', this.handleSession.bind(this));
    this.app.post('/api/auth/logout', this.handleLogout.bind(this));
    
    // OAuth routes
    this.app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    this.app.get('/api/auth/google/callback', 
      passport.authenticate('google', { failureRedirect: '/' }),
      this.handleOAuthCallback.bind(this)
    );
    
    this.app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
    this.app.get('/api/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/' }),
      this.handleOAuthCallback.bind(this)
    );
    
    // Platform integration
    this.app.post('/api/start-everything', this.handleStartPlatform.bind(this));
    this.app.get('/api/platform/status', this.handlePlatformStatus.bind(this));
    this.app.post('/api/platform/stop', this.handleStopPlatform.bind(this));
    
    // Dashboard redirect (after successful auth + platform start)
    this.app.get('/dashboard', this.redirectToDashboard.bind(this));
    
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'auth-backend',
        timestamp: new Date().toISOString(),
        database: this.db ? 'connected' : 'disconnected'
      });
    });
  }

  // Authentication handlers
  async handleLogin(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      const user = await this.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      if (user.auth_provider !== 'local') {
        return res.status(401).json({ error: 'Please use social login for this account' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Update last login
      await this.updateLastLogin(user.id);
      
      // Create session
      req.session.userId = user.id;
      
      // Create JWT token
      const token = this.createJWTToken(user);
      
      res.json({
        success: true,
        user: this.sanitizeUser(user),
        token
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async handleSignup(req, res) {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password required' });
      }
      
      // Check if user exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create user
      const userId = uuidv4();
      const user = {
        id: userId,
        name,
        email,
        password_hash: passwordHash,
        auth_provider: 'local',
        tier: 'free',
        created_at: new Date(),
        is_active: true
      };
      
      await this.createUser(user);
      
      // Create session
      req.session.userId = userId;
      
      // Create JWT token
      const token = this.createJWTToken(user);
      
      res.json({
        success: true,
        user: this.sanitizeUser(user),
        token
      });
      
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async handleGuest(req, res) {
    try {
      const guestId = 'guest-' + uuidv4();
      const guestUser = {
        id: guestId,
        name: 'Guest User',
        email: `guest-${Date.now()}@economic-engine.ai`,
        auth_provider: 'guest',
        tier: 'guest',
        created_at: new Date(),
        is_active: true
      };
      
      // Store guest session
      req.session.userId = guestId;
      req.session.guestUser = guestUser;
      
      const token = this.createJWTToken(guestUser);
      
      res.json({
        success: true,
        user: this.sanitizeUser(guestUser),
        token
      });
      
    } catch (error) {
      console.error('Guest session error:', error);
      res.status(500).json({ error: 'Failed to create guest session' });
    }
  }

  async handleSession(req, res) {
    try {
      if (!req.session.userId) {
        return res.json({ user: null });
      }
      
      let user;
      if (req.session.guestUser) {
        user = req.session.guestUser;
      } else {
        user = await this.findUserById(req.session.userId);
      }
      
      if (!user) {
        req.session.destroy();
        return res.json({ user: null });
      }
      
      res.json({ user: this.sanitizeUser(user) });
      
    } catch (error) {
      console.error('Session check error:', error);
      res.status(500).json({ error: 'Session check failed' });
    }
  }

  async handleLogout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  }

  async handleOAuthCallback(req, res) {
    try {
      // User is available in req.user from passport
      const user = req.user;
      
      // Create session
      req.session.userId = user.id;
      
      // Redirect to auth wrapper with success
      res.redirect('/?auth=success');
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/?auth=error');
    }
  }

  // Platform integration handlers
  async handleStartPlatform(req, res) {
    try {
      const userId = req.body.userId || req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      console.log(chalk.blue(`🚀 Starting platform for user: ${userId}`));
      
      // Start the platform services
      const startResult = await this.startPlatformServices();
      
      if (startResult.success) {
        res.json({
          success: true,
          message: 'Platform started successfully',
          services: startResult.services,
          accessUrls: {
            main: 'http://localhost:9999',
            dashboard: 'http://localhost:8081/dashboard',
            terminal: 'node terminal-dashboard.js'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: startResult.error
        });
      }
      
    } catch (error) {
      console.error('Platform start error:', error);
      res.status(500).json({ error: 'Platform startup failed' });
    }
  }

  async startPlatformServices() {
    try {
      const { spawn } = require('child_process');
      const axios = require('axios');
      
      // Check if services are already running
      const servicesStatus = await this.checkServicesStatus();
      
      if (servicesStatus.allRunning) {
        return {
          success: true,
          services: servicesStatus.services,
          message: 'Services already running'
        };
      }
      
      // Start services if not running
      const servicesToStart = [];
      
      if (!servicesStatus.services.economicEngine) {
        servicesToStart.push({
          name: 'Economic Engine',
          script: 'server.js',
          port: 3000
        });
      }
      
      if (!servicesStatus.services.slamLayer) {
        servicesToStart.push({
          name: 'Slam Layer',
          script: 'slam-it-all-together.js',
          port: 9999
        });
      }
      
      if (!servicesStatus.services.dashboard) {
        servicesToStart.push({
          name: 'Dashboard',
          script: 'dashboard-server.js',
          port: 8081
        });
      }
      
      // Start missing services
      for (const service of servicesToStart) {
        console.log(chalk.blue(`Starting ${service.name}...`));
        
        const child = spawn('node', [service.script], {
          cwd: __dirname,
          detached: true,
          stdio: 'ignore'
        });
        
        child.unref();
        
        // Wait for service to be ready
        await this.waitForService(service.port, 15000);
      }
      
      return {
        success: true,
        services: await this.checkServicesStatus(),
        message: 'Platform started successfully'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkServicesStatus() {
    const axios = require('axios');
    
    const services = {
      economicEngine: false,
      slamLayer: false,
      dashboard: false
    };
    
    // Check Economic Engine
    try {
      await axios.get('http://localhost:3000/api/status', { timeout: 1000 });
      services.economicEngine = true;
    } catch (error) {
      // Service not running
    }
    
    // Check Slam Layer
    try {
      await axios.get('http://localhost:9999/slam/status', { timeout: 1000 });
      services.slamLayer = true;
    } catch (error) {
      // Service not running
    }
    
    // Check Dashboard
    try {
      await axios.get('http://localhost:8081/api/system/status', { timeout: 1000 });
      services.dashboard = true;
    } catch (error) {
      // Service not running
    }
    
    const allRunning = Object.values(services).every(status => status);
    
    return {
      services,
      allRunning
    };
  }

  async waitForService(port, timeout = 10000) {
    const axios = require('axios');
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        await axios.get(`http://localhost:${port}`, { timeout: 1000 });
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    throw new Error(`Service on port ${port} did not start within ${timeout}ms`);
  }

  async handlePlatformStatus(req, res) {
    try {
      const status = await this.checkServicesStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Status check failed' });
    }
  }

  async handleStopPlatform(req, res) {
    try {
      const { exec } = require('child_process');
      
      // Stop all platform services
      const killCommands = [
        'pkill -f "node.*server.js"',
        'pkill -f "node.*slam-it-all-together.js"',
        'pkill -f "node.*dashboard-server.js"'
      ];
      
      for (const cmd of killCommands) {
        exec(cmd, () => {});
      }
      
      res.json({ success: true, message: 'Platform stopped' });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop platform' });
    }
  }

  redirectToDashboard(req, res) {
    // Check if user is authenticated
    if (!req.session.userId) {
      return res.redirect('/');
    }
    
    // Redirect to the visual dashboard
    res.redirect('http://localhost:8081/dashboard');
  }

  // Database helpers
  async findUserByEmail(email) {
    if (!this.db) return null;
    
    try {
      const [rows] = await this.db.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async findUserById(id) {
    if (!this.db) return null;
    
    try {
      const [rows] = await this.db.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async createUser(user) {
    if (!this.db) return;
    
    try {
      await this.db.execute(
        'INSERT INTO users (id, name, email, password_hash, auth_provider, tier, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.password_hash, user.auth_provider, user.tier, user.created_at, user.is_active]
      );
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async updateLastLogin(userId) {
    if (!this.db) return;
    
    try {
      await this.db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  async findOrCreateOAuthUser(provider, profile) {
    if (!this.db) {
      // Return demo user for OAuth when no database
      return {
        id: `${provider}-${profile.id}`,
        name: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value || `${profile.id}@${provider}.com`,
        auth_provider: provider,
        tier: 'free'
      };
    }
    
    try {
      // Try to find existing user
      const [rows] = await this.db.execute(
        'SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?',
        [provider, profile.id]
      );
      
      if (rows[0]) {
        return rows[0];
      }
      
      // Create new user
      const userId = uuidv4();
      const user = {
        id: userId,
        name: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value || `${profile.id}@${provider}.com`,
        auth_provider: provider,
        auth_provider_id: profile.id,
        tier: 'free',
        created_at: new Date(),
        is_active: true
      };
      
      await this.db.execute(
        'INSERT INTO users (id, name, email, auth_provider, auth_provider_id, tier, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.auth_provider, user.auth_provider_id, user.tier, user.created_at, user.is_active]
      );
      
      return user;
      
    } catch (error) {
      console.error('OAuth user creation error:', error);
      throw error;
    }
  }

  // Utility methods
  createJWTToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier
      },
      this.config.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  sanitizeUser(user) {
    if (!user) return null;
    
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async start() {
    await this.initDatabase();
    
    this.app.listen(this.port, () => {
      console.log(chalk.green.bold(`\n🔐 AUTH BACKEND STARTED`));
      console.log(chalk.blue(`   Access Portal: http://localhost:${this.port}`));
      console.log(chalk.blue(`   Auth API: http://localhost:${this.port}/api/auth`));
      console.log(chalk.gray(`   Database: ${this.db ? 'Connected' : 'Demo Mode'}\n`));
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Shutting down auth backend...'));
      if (this.db) {
        await this.db.end();
      }
      process.exit(0);
    });
  }
}

// Start the auth backend
if (require.main === module) {
  const authBackend = new AuthBackend();
  authBackend.start();
}

module.exports = AuthBackend;
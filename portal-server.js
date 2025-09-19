#!/usr/bin/env node

/**
 * 🌐 Portal Server - Non-Technical User Interface
 * 
 * This provides a simple web interface where users can:
 * - Sign in with GitHub
 * - Upload documents
 * - Generate apps without any coding
 * - Deploy to platforms automatically
 * 
 * No command line needed!
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const multer = require('multer');
const http = require('http');
const VoicePortalBridge = require('./voice-portal-bridge');

class PortalServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.sessions = new Map(); // Simple session store
    this.projects = new Map(); // User projects
    
    // Initialize voice authentication bridge
    this.voiceAuthPort = 9700;
    this.voiceBridge = new VoicePortalBridge(this.voiceAuthPort, this.port);
    
    console.log('🎤 Voice + QR Portal Authentication System');
    console.log('==========================================');
    console.log('🌉 Voice authentication bridge initialized');
    console.log('🚫 No face tracking or biometric surveillance');
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Serve static files from portal directory
    this.app.use('/portal', express.static(path.join(__dirname, 'portal')));
    
    // Simple session middleware
    this.app.use((req, res, next) => {
      const sessionId = req.headers.cookie?.split('session=')[1]?.split(';')[0];
      if (sessionId && this.sessions.has(sessionId)) {
        req.session = this.sessions.get(sessionId);
      }
      next();
    });
  }
  
  setupRoutes() {
    // Main portal page
    this.app.get('/portal', (req, res) => {
      res.sendFile(path.join(__dirname, 'portal', 'index.html'));
    });
    
    // Voice + QR Authentication Integration
    this.app.get('/portal/auth/voice-login', (req, res) => {
      // Redirect to voice authentication system with portal callback
      const authUrl = this.voiceBridge.generateAuthUrl();
      res.redirect(authUrl);
    });
    
    // Voice authentication API endpoints
    this.app.post('/portal/api/voice-auth', async (req, res) => {
      await this.voiceBridge.handlePortalAuth(req, res);
    });
    
    // Voice authentication callback with single-use tokens
    this.app.post('/portal/auth/voice-callback', async (req, res) => {
      try {
        const { sessionToken, userId, voiceVerified, qrVerified } = req.body;
        
        if (voiceVerified && qrVerified) {
          // Generate single-use token for this login action using simple HTTP request
          const { token: singleUseToken } = await this.makeVoiceAuthRequest('/api/auth/generate-single-use-token', {
            sessionId: sessionToken,
            purpose: 'portal-login',
            expiresInSeconds: 30 // Very short-lived
          });
          
          // Create authenticated user session
          const user = {
            id: userId,
            username: `voice-user-${userId.slice(0, 8)}`,
            name: 'Voice Authenticated User',
            email: `user-${userId}@voiceauth.local`,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userId,
            authMethod: 'voice+qr',
            verified: true
          };
          
          const portalSessionId = crypto.randomBytes(32).toString('hex');
          this.sessions.set(portalSessionId, {
            user,
            voiceSessionToken: sessionToken,
            singleUseToken, // Store the single-use token
            createdAt: new Date(),
            authMethod: 'voice+qr'
          });
          
          // Use the single-use token immediately and then revoke it
          await this.makeVoiceAuthRequest('/api/auth/use-token', {
            token: singleUseToken,
            action: 'portal-login-complete'
          });
          
          res.cookie('session', portalSessionId, { 
            httpOnly: true, 
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
          });
          
          res.json({ 
            success: true, 
            redirect: '/portal/dashboard',
            user: user,
            message: 'Login successful - access token properly closed'
          });
        } else {
          res.status(401).json({ 
            success: false, 
            error: 'Voice and QR authentication both required' 
          });
        }
      } catch (error) {
        console.error('Voice auth callback error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Direct Access Authentication Integration
    this.app.get('/portal/auth/direct-login', (req, res) => {
      // Redirect to direct access authentication system
      const returnUrl = encodeURIComponent(`${req.protocol}://${req.get('host')}/portal/auth/direct-callback`);
      res.redirect(`http://localhost:7001/?return_to=${returnUrl}`);
    });
    
    // Direct access callback handler  
    this.app.get('/portal/auth/direct-callback', async (req, res) => {
      try {
        const { sessionKey, username } = req.query;
        
        if (!sessionKey) {
          return res.status(400).send(`
            <h1>Direct Authentication Failed</h1>
            <p>No session key provided from direct access system.</p>
            <a href="/portal">Return to Portal</a>
          `);
        }
        
        // Verify session with direct access system
        const accessResponse = await this.makeDirectAccessRequest('/access/status', {
          headers: { 'Authorization': `Bearer ${sessionKey}` }
        });
        
        if (!accessResponse.hasAccess) {
          return res.status(401).send(`
            <h1>Access Verification Failed</h1>
            <p>Could not verify your access with the authentication system.</p>
            <a href="/portal">Try Again</a>
          `);
        }
        
        // Create portal session
        const portalSessionId = crypto.randomBytes(32).toString('hex');
        this.sessions.set(portalSessionId, {
          user: {
            id: accessResponse.username || 'direct-user',
            username: accessResponse.username || 'direct-user',
            name: accessResponse.username || 'Direct Access User',
            email: `${accessResponse.username}@direct.local`,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + accessResponse.username,
            provider: 'direct-access'
          },
          directAccessToken: sessionKey,
          createdAt: new Date(),
          authMethod: 'direct-access'
        });
        
        // Set session cookie
        res.cookie('session', portalSessionId, {
          httpOnly: true,
          secure: false,
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        // Redirect to dashboard
        res.redirect('/portal/dashboard?auth=success&method=direct');
        
      } catch (error) {
        console.error('Direct access callback error:', error);
        res.status(500).send(`
          <h1>Direct Authentication Error</h1>
          <p>An error occurred processing your direct access authentication.</p>
          <p>Error: ${error.message}</p>
          <a href="/portal">Try Again</a>
        `);
      }
    });
    
    // Simple API key login (for programmatic access)
    this.app.post('/portal/auth/api-login', async (req, res) => {
      try {
        const { apiKey, username } = req.body;
        
        // Verify with direct access system
        const loginResponse = await this.makeDirectAccessRequest('/access/login', {
          method: 'POST',
          body: { apiKey, username }
        });
        
        if (!loginResponse.success) {
          return res.status(401).json({
            success: false,
            error: 'API key authentication failed'
          });
        }
        
        // Create portal session
        const sessionId = crypto.randomBytes(32).toString('hex');
        this.sessions.set(sessionId, {
          user: {
            id: loginResponse.username,
            username: loginResponse.username,
            name: `${loginResponse.username} (API)`,
            email: `${loginResponse.username}@api.local`,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + loginResponse.username,
            provider: 'api-key'
          },
          apiKey: apiKey,
          createdAt: new Date(),
          authMethod: 'api-key'
        });
        
        res.json({
          success: true,
          sessionId: sessionId,
          user: this.sessions.get(sessionId).user,
          message: 'API key authentication successful'
        });
        
      } catch (error) {
        console.error('API key login error:', error);
        res.status(500).json({
          success: false,
          error: 'API authentication failed'
        });
      }
    });
    
    // Legacy GitHub login redirect (now redirects to direct access)
    this.app.get('/portal/auth/github-login', (req, res) => {
      res.redirect('/portal/auth/direct-login');
    });
    
    // Check authentication
    this.app.get('/portal/api/check-auth', (req, res) => {
      if (req.session) {
        res.json({ authenticated: true, user: req.session.user });
      } else {
        res.json({ authenticated: false });
      }
    });
    
    // Get user info
    this.app.get('/portal/api/user-info', (req, res) => {
      if (!req.session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      res.json(req.session.user);
    });
    
    // Get user projects
    this.app.get('/portal/api/projects', (req, res) => {
      if (!req.session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const userProjects = Array.from(this.projects.values())
        .filter(p => p.userId === req.session.user.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      
      const limit = parseInt(req.query.limit) || 10;
      res.json(userProjects.slice(0, limit));
    });
    
    // Logout
    this.app.post('/portal/api/logout', (req, res) => {
      const sessionId = req.headers.cookie?.split('session=')[1]?.split(';')[0];
      if (sessionId) {
        this.sessions.delete(sessionId);
      }
      res.json({ success: true });
    });
    
    // Demo mode (try without login)
    this.app.get('/portal/demo', (req, res) => {
      // Create temporary demo session
      const demoUser = {
        id: 'demo-' + Date.now(),
        username: 'guest',
        name: 'Guest User',
        demo: true
      };
      
      const sessionId = crypto.randomBytes(32).toString('hex');
      this.sessions.set(sessionId, {
        user: demoUser,
        createdAt: new Date(),
        demo: true
      });
      
      res.cookie('session', sessionId, { httpOnly: true, maxAge: 60 * 60 * 1000 }); // 1 hour
      res.redirect('/portal/upload');
    });
    
    // Protected routes
    this.app.get('/portal/dashboard', this.requireAuth.bind(this), (req, res) => {
      res.sendFile(path.join(__dirname, 'portal', 'dashboard.html'));
    });
    
    this.app.get('/portal/upload', this.requireAuth.bind(this), (req, res) => {
      res.sendFile(path.join(__dirname, 'portal', 'upload.html'));
    });
    
    // Proxy to actual document generator API
    this.app.post('/api/document-to-mvp/workflow', this.requireAuth.bind(this), async (req, res) => {
      // This would forward to the actual Document Generator API
      // For now, create a mock response
      const jobId = crypto.randomUUID();
      const mockJob = {
        id: jobId,
        userId: req.session.user.id,
        projectName: req.body.projectName || 'Untitled Project',
        type: req.body.type || 'auto',
        status: 'processing',
        progress: 0,
        createdAt: new Date()
      };
      
      this.projects.set(jobId, mockJob);
      
      // Simulate processing
      this.simulateJobProcessing(jobId);
      
      res.json({
        message: 'Document-to-MVP workflow started',
        job: mockJob
      });
    });
    
    // Get job status
    this.app.get('/api/document-to-mvp/jobs/:jobId', this.requireAuth.bind(this), (req, res) => {
      const job = this.projects.get(req.params.jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      if (job.userId !== req.session.user.id && !req.session.user.admin) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json(job);
    });
    
    // Redirect root to portal
    this.app.get('/', (req, res) => {
      res.redirect('/portal');
    });
  }
  
  requireAuth(req, res, next) {
    if (!req.session) {
      return res.redirect('/portal');
    }
    next();
  }
  
  // Helper method to make requests to voice auth system
  async makeVoiceAuthRequest(path, data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'localhost',
        port: this.voiceAuthPort,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.success) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error || 'Voice auth request failed'));
            }
          } catch (error) {
            reject(new Error('Invalid JSON response from voice auth'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
  }
  
  // Helper method to make requests to direct access system
  async makeDirectAccessRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const method = options.method || 'GET';
      const postData = options.body ? JSON.stringify(options.body) : null;
      
      const requestOptions = {
        hostname: 'localhost',
        port: 7001, // Direct access system port
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };
      
      if (postData) {
        requestOptions.headers['Content-Length'] = Buffer.byteLength(postData);
      }
      
      const req = http.request(requestOptions, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (error) {
            reject(new Error('Invalid JSON response from direct access system'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }
  
  simulateJobProcessing(jobId) {
    const job = this.projects.get(jobId);
    if (!job) return;
    
    const steps = [
      { status: 'parsing', progress: 20, delay: 2000 },
      { status: 'profiling', progress: 40, delay: 3000 },
      { status: 'generating', progress: 60, delay: 4000 },
      { status: 'reviewing', progress: 80, delay: 2000 },
      { status: 'completed', progress: 100, delay: 1000 }
    ];
    
    let currentStep = 0;
    
    const processStep = () => {
      if (currentStep >= steps.length) return;
      
      const step = steps[currentStep];
      job.status = step.status;
      job.progress = step.progress;
      job.updatedAt = new Date();
      
      if (step.status === 'completed') {
        job.completedAt = new Date();
        job.downloadUrl = `/api/document-to-mvp/jobs/${jobId}/download`;
        job.deployUrl = `https://demo-${jobId.slice(0, 8)}.vercel.app`;
      }
      
      this.projects.set(jobId, job);
      
      currentStep++;
      if (currentStep < steps.length) {
        setTimeout(processStep, step.delay);
      }
    };
    
    setTimeout(processStep, 1000);
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log(`
🌐 Portal Server Running!
========================

Non-technical users can now:

1. Visit: http://localhost:${this.port}/portal
2. Click "Sign in with GitHub"
3. Upload any document
4. Get a working app!

No coding or command line needed! 🎉

Features:
• GitHub login (simulated for demo)
• Drag & drop file upload
• Visual progress tracking
• One-click deployment
• Project management

Try demo mode: http://localhost:${this.port}/portal/demo
      `);
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const port = process.env.PORT || 3333;
  const server = new PortalServer(port);
  server.start();
}

module.exports = PortalServer;
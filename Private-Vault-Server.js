#!/usr/bin/env node

/**
 * PRIVATE VAULT SERVER
 * Encrypted user directory system with port-hopping "monkey bars"
 * Blocks LLMs and provides secure media storage
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const WebSocket = require('ws');
const EventEmitter = require('events');
const { createProxyMiddleware } = require('http-proxy-middleware');

class PrivateVaultServer extends EventEmitter {
  constructor() {
    super();
    
    // Port configuration for "monkey bars"
    this.ports = [7777, 7778, 7779, 7780];
    this.currentPortIndex = 0;
    this.servers = new Map();
    this.activeConnections = new Map();
    
    // User vault structure
    this.vaultRoot = path.join(__dirname, 'private-vault');
    this.userVaults = new Map();
    this.accessLogs = [];
    
    // Encryption configuration
    this.encryptionKey = crypto.randomBytes(32); // Will be replaced with gravity well key
    this.gravityWellContract = null;
    
    // LLM detection and blocking
    this.blockedAgents = new Set([
      'gpt', 'chatgpt', 'openai', 'anthropic', 'claude', 'bard', 'bing',
      'bot', 'crawler', 'spider', 'scraper', 'python-requests', 'curl',
      'wget', 'httpie', 'postman', 'axios', 'fetch'
    ]);
    
    this.suspiciousPatterns = [
      /api.*key/i,
      /token/i,
      /auth/i,
      /admin/i,
      /\.env/i,
      /config/i,
      /private/i,
      /secret/i
    ];
    
    // Media processing capabilities
    this.supportedFormats = {
      audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
      video: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
      document: ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf'],
      image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp']
    };
    
    console.log('🏦 Private Vault Server initializing...');
    console.log('🔒 Encrypted user directory system');
    console.log('🐒 Port-hopping "monkey bars" architecture');
    console.log('🚫 LLM blocking middleware active');
    
    this.initialize();
  }
  
  /**
   * Initialize the vault server system
   */
  async initialize() {
    // Create vault directory structure
    await this.createVaultStructure();
    
    // Initialize gravity well encryption
    await this.initializeEncryption();
    
    // Start servers on all ports
    await this.startMonkeyBarsServers();
    
    // Start port-hopping routine
    this.startPortHopping();
    
    // Start security monitoring
    this.startSecurityMonitoring();
    
    console.log('✅ Private Vault Server operational');
    console.log(`🎯 Primary port: ${this.getCurrentPort()}`);
    console.log(`🔄 Port rotation: ${this.ports.join(' → ')}`);
  }
  
  /**
   * Create encrypted vault directory structure
   */
  async createVaultStructure() {
    if (!fs.existsSync(this.vaultRoot)) {
      fs.mkdirSync(this.vaultRoot, { recursive: true });
    }
    
    // Create system directories
    const systemDirs = [
      'system',
      'system/logs',
      'system/keys',
      'system/backups',
      'system/temp'
    ];
    
    systemDirs.forEach(dir => {
      const fullPath = path.join(this.vaultRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    console.log('📁 Vault directory structure created');
  }
  
  /**
   * Initialize encryption using gravity well keys
   */
  async initializeEncryption() {
    try {
      // Try to load existing gravity well contract
      const contractPath = path.join(__dirname, 'unified-vault/experimental/prototypes/doc_1755710648057_kp7r1ig3y_gravity-well-blockchain-verification.json');
      
      if (fs.existsSync(contractPath)) {
        const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        this.gravityWellContract = contractData;
        
        // Derive encryption key from blockchain hash
        this.encryptionKey = crypto.createHash('sha256')
          .update(contractData.blockchain_hash)
          .digest();
          
        console.log('🌌 Gravity well encryption initialized');
        console.log(`📜 Contract: ${contractData.smart_contract_address}`);
      } else {
        console.log('⚠️ Gravity well contract not found, using fallback encryption');
      }
      
    } catch (error) {
      console.error('❌ Encryption initialization failed:', error.message);
      console.log('🔄 Using fallback encryption key');
    }
  }
  
  /**
   * Start servers on all monkey bar ports
   */
  async startMonkeyBarsServers() {
    for (let i = 0; i < this.ports.length; i++) {
      const port = this.ports[i];
      const app = this.createVaultApp(port, i === 0); // First port is primary
      
      const server = app.listen(port, () => {
        console.log(`🐒 Monkey bar ${i + 1} active on port ${port} ${i === 0 ? '(PRIMARY)' : '(MIRROR)'}`);
      });
      
      // Setup WebSocket for real-time updates
      const wss = new WebSocket.Server({ server });
      wss.on('connection', (ws, req) => {
        this.handleWebSocketConnection(ws, req, port);
      });
      
      this.servers.set(port, { app, server, wss });
    }
  }
  
  /**
   * Create Express app with vault functionality
   */
  createVaultApp(port, isPrimary) {
    const app = express();
    
    // LLM blocking middleware (first line of defense)
    app.use(this.createLLMBlockerMiddleware());
    
    // Security headers
    app.use((req, res, next) => {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      res.setHeader('X-Vault-Port', port);
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      next();
    });
    
    app.use(express.json({ limit: '100mb' }));
    
    // File upload configuration
    const storage = multer.memoryStorage();
    const upload = multer({ 
      storage,
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
      fileFilter: this.createFileFilter()
    });
    
    // Authentication middleware
    app.use('/api', this.createAuthMiddleware());
    
    // API Routes
    this.setupVaultRoutes(app, upload, isPrimary);
    
    // Static file serving (encrypted)
    app.use('/files', this.createEncryptedFileServer());
    
    // Health check (no auth required)
    app.get('/health', (req, res) => {
      res.json({
        status: 'operational',
        port,
        isPrimary,
        timestamp: Date.now(),
        vault: 'private'
      });
    });
    
    // 404 handler (misleading for bots)
    app.use((req, res) => {
      // Log potential intrusion attempt
      this.logSuspiciousActivity(req, 'NOT_FOUND');
      
      // Return misleading response
      res.status(404).json({
        error: 'Public API endpoint not found',
        message: 'This is a public file server',
        endpoints: ['/public', '/docs', '/api/v1/status'] // Fake endpoints
      });
    });
    
    return app;
  }
  
  /**
   * Create LLM blocking middleware
   */
  createLLMBlockerMiddleware() {
    return (req, res, next) => {
      const userAgent = req.get('User-Agent')?.toLowerCase() || '';
      const ip = req.ip || req.connection.remoteAddress;
      
      // Check for LLM user agents
      for (const blockedAgent of this.blockedAgents) {
        if (userAgent.includes(blockedAgent)) {
          this.logSuspiciousActivity(req, 'BLOCKED_LLM_AGENT', { userAgent, ip });
          return this.sendMisleadingResponse(res);
        }
      }
      
      // Check for suspicious patterns in request
      const fullUrl = req.originalUrl;
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(fullUrl)) {
          this.logSuspiciousActivity(req, 'SUSPICIOUS_PATTERN', { pattern: pattern.toString(), url: fullUrl });
          return this.sendMisleadingResponse(res);
        }
      }
      
      // Rate limiting per IP
      if (this.isRateLimited(ip)) {
        this.logSuspiciousActivity(req, 'RATE_LIMITED', { ip });
        return this.sendMisleadingResponse(res);
      }
      
      // Check request timing (too fast = bot)
      if (this.isBotTiming(req)) {
        this.logSuspiciousActivity(req, 'BOT_TIMING', { userAgent });
        return this.sendMisleadingResponse(res);
      }
      
      next();
    };
  }
  
  /**
   * Send misleading response to blocked requests
   */
  sendMisleadingResponse(res) {
    // Simulate a generic file server
    const fakeResponse = {
      status: 'success',
      server: 'Apache/2.4.41',
      documents: [
        { name: 'readme.txt', size: 1024 },
        { name: 'info.html', size: 2048 },
        { name: 'contact.pdf', size: 156789 }
      ],
      message: 'Public document server - no authentication required'
    };
    
    // Add realistic delay
    setTimeout(() => {
      res.status(200).json(fakeResponse);
    }, Math.random() * 1000 + 500);
  }
  
  /**
   * Create authentication middleware
   */
  createAuthMiddleware() {
    return (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      try {
        // Decrypt and verify token
        const decrypted = this.decryptData(token);
        const userData = JSON.parse(decrypted);
        
        // Validate user
        if (!this.isValidUser(userData)) {
          throw new Error('Invalid user data');
        }
        
        req.user = userData;
        next();
        
      } catch (error) {
        this.logSuspiciousActivity(req, 'INVALID_AUTH', { token: token.substring(0, 10) + '...' });
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    };
  }
  
  /**
   * Setup vault API routes
   */
  setupVaultRoutes(app, upload, isPrimary) {
    // User vault management
    app.post('/api/vault/create', (req, res) => {
      this.handleCreateUserVault(req, res);
    });
    
    app.get('/api/vault/info', (req, res) => {
      this.handleGetVaultInfo(req, res);
    });
    
    // File operations
    app.post('/api/files/upload', upload.single('file'), (req, res) => {
      this.handleFileUpload(req, res);
    });
    
    app.get('/api/files/list/:category?', (req, res) => {
      this.handleFileList(req, res);
    });
    
    app.get('/api/files/download/:fileId', (req, res) => {
      this.handleFileDownload(req, res);
    });
    
    app.delete('/api/files/:fileId', (req, res) => {
      this.handleFileDelete(req, res);
    });
    
    // Playlist management
    app.post('/api/playlists', (req, res) => {
      this.handleCreatePlaylist(req, res);
    });
    
    app.get('/api/playlists', (req, res) => {
      this.handleGetPlaylists(req, res);
    });
    
    app.put('/api/playlists/:playlistId', (req, res) => {
      this.handleUpdatePlaylist(req, res);
    });
    
    // Search functionality
    app.get('/api/search', (req, res) => {
      this.handleSearch(req, res);
    });
    
    // Only primary port handles vault administration
    if (isPrimary) {
      app.get('/api/admin/users', (req, res) => {
        this.handleAdminUserList(req, res);
      });
      
      app.get('/api/admin/logs', (req, res) => {
        this.handleAdminLogs(req, res);
      });
      
      app.post('/api/admin/backup', (req, res) => {
        this.handleAdminBackup(req, res);
      });
    }
  }
  
  /**
   * Handle WebSocket connections
   */
  handleWebSocketConnection(ws, req, port) {
    const connectionId = crypto.randomUUID();
    
    // Store connection
    this.activeConnections.set(connectionId, {
      ws,
      port,
      userId: null,
      connectedAt: Date.now()
    });
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this.handleWebSocketMessage(connectionId, data);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      this.activeConnections.delete(connectionId);
    });
    
    // Send initial connection info
    ws.send(JSON.stringify({
      type: 'connection',
      connectionId,
      port,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(connectionId, data) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;
    
    switch (data.type) {
      case 'authenticate':
        this.handleWebSocketAuth(connectionId, data);
        break;
        
      case 'file_upload_progress':
        this.broadcastFileProgress(data);
        break;
        
      case 'media_control':
        this.handleMediaControl(connectionId, data);
        break;
        
      case 'ping':
        connection.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
    }
  }
  
  /**
   * File upload handler
   */
  async handleFileUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      
      const user = req.user;
      const file = req.file;
      const category = this.detectFileCategory(file.originalname);
      
      // Generate unique file ID
      const fileId = crypto.randomUUID();
      
      // Create file metadata
      const metadata = {
        id: fileId,
        originalName: file.originalname,
        category,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: Date.now(),
        userId: user.id,
        encryption: 'gravity-well',
        tags: req.body.tags ? JSON.parse(req.body.tags) : []
      };
      
      // Encrypt file content
      const encryptedContent = this.encryptData(file.buffer);
      
      // Save to user vault
      const userVaultPath = this.getUserVaultPath(user.id);
      const categoryPath = path.join(userVaultPath, category);
      
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }
      
      const filePath = path.join(categoryPath, fileId + '.enc');
      const metadataPath = path.join(categoryPath, fileId + '.meta.json');
      
      fs.writeFileSync(filePath, encryptedContent);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Log successful upload
      this.logActivity(user.id, 'FILE_UPLOAD', {
        fileId,
        category,
        size: file.size,
        name: file.originalname
      });
      
      // Broadcast to connected clients
      this.broadcastToUser(user.id, {
        type: 'file_uploaded',
        file: metadata
      });
      
      res.json({
        success: true,
        fileId,
        metadata
      });
      
    } catch (error) {
      console.error('File upload failed:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
  
  /**
   * File list handler
   */
  handleFileList(req, res) {
    try {
      const user = req.user;
      const category = req.params.category || 'all';
      
      const userVaultPath = this.getUserVaultPath(user.id);
      const files = [];
      
      if (category === 'all') {
        // List all files across categories
        Object.keys(this.supportedFormats).forEach(cat => {
          const categoryPath = path.join(userVaultPath, cat);
          if (fs.existsSync(categoryPath)) {
            files.push(...this.getFilesInCategory(categoryPath, cat));
          }
        });
      } else {
        const categoryPath = path.join(userVaultPath, category);
        if (fs.existsSync(categoryPath)) {
          files.push(...this.getFilesInCategory(categoryPath, category));
        }
      }
      
      // Sort by upload date (newest first)
      files.sort((a, b) => b.uploadedAt - a.uploadedAt);
      
      res.json({
        success: true,
        category,
        files,
        total: files.length
      });
      
    } catch (error) {
      console.error('File list failed:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  }
  
  /**
   * Get files in a category
   */
  getFilesInCategory(categoryPath, category) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(categoryPath);
      
      entries.forEach(entry => {
        if (entry.endsWith('.meta.json')) {
          const metadataPath = path.join(categoryPath, entry);
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          files.push(metadata);
        }
      });
      
    } catch (error) {
      console.error(`Failed to read category ${category}:`, error);
    }
    
    return files;
  }
  
  /**
   * File download handler
   */
  async handleFileDownload(req, res) {
    try {
      const user = req.user;
      const fileId = req.params.fileId;
      
      const fileInfo = this.findUserFile(user.id, fileId);
      if (!fileInfo) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      const { metadata, filePath } = fileInfo;
      
      // Read and decrypt file
      const encryptedContent = fs.readFileSync(filePath);
      const decryptedContent = this.decryptData(encryptedContent);
      
      // Log download activity
      this.logActivity(user.id, 'FILE_DOWNLOAD', {
        fileId,
        name: metadata.originalName,
        size: metadata.size
      });
      
      // Set appropriate headers
      res.setHeader('Content-Type', metadata.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
      res.setHeader('Content-Length', decryptedContent.length);
      
      res.send(decryptedContent);
      
    } catch (error) {
      console.error('File download failed:', error);
      res.status(500).json({ error: 'Download failed' });
    }
  }
  
  /**
   * Start port hopping routine
   */
  startPortHopping() {
    // Switch primary port every 5 minutes
    setInterval(() => {
      this.currentPortIndex = (this.currentPortIndex + 1) % this.ports.length;
      
      console.log(`🐒 Hopped to port ${this.getCurrentPort()}`);
      
      // Broadcast port change to connected clients
      this.broadcastToAll({
        type: 'port_change',
        newPort: this.getCurrentPort(),
        timestamp: Date.now()
      });
      
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    // Clean up old logs every hour
    setInterval(() => {
      this.cleanupLogs();
    }, 60 * 60 * 1000);
    
    // Generate security report every 6 hours
    setInterval(() => {
      this.generateSecurityReport();
    }, 6 * 60 * 60 * 1000);
  }
  
  /**
   * Utility functions
   */
  getCurrentPort() {
    return this.ports[this.currentPortIndex];
  }
  
  getUserVaultPath(userId) {
    const userPath = path.join(this.vaultRoot, userId);
    if (!fs.existsSync(userPath)) {
      fs.mkdirSync(userPath, { recursive: true });
      
      // Create user directory structure
      Object.keys(this.supportedFormats).forEach(category => {
        const categoryPath = path.join(userPath, category);
        fs.mkdirSync(categoryPath, { recursive: true });
      });
      
      // Create additional user directories
      ['playlists', 'preferences', 'memories'].forEach(dir => {
        const dirPath = path.join(userPath, dir);
        fs.mkdirSync(dirPath, { recursive: true });
      });
    }
    
    return userPath;
  }
  
  detectFileCategory(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    for (const [category, extensions] of Object.entries(this.supportedFormats)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }
    
    return 'document'; // Default category
  }
  
  encryptData(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return Buffer.concat([iv, encrypted]);
  }
  
  decryptData(encryptedData) {
    const iv = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);
    
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }
  
  logActivity(userId, action, details = {}) {
    const logEntry = {
      timestamp: Date.now(),
      userId,
      action,
      details,
      ip: details.ip || 'internal'
    };
    
    this.accessLogs.push(logEntry);
    
    // Also log to file
    const logPath = path.join(this.vaultRoot, 'system/logs', 'access.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }
  
  logSuspiciousActivity(req, reason, details = {}) {
    const logEntry = {
      timestamp: Date.now(),
      reason,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      details
    };
    
    console.log(`🚨 Suspicious activity: ${reason} from ${logEntry.ip}`);
    
    const logPath = path.join(this.vaultRoot, 'system/logs', 'security.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }
  
  isRateLimited(ip) {
    // Simple rate limiting - 60 requests per minute
    const now = Date.now();
    const minute = 60 * 1000;
    
    const recentRequests = this.accessLogs.filter(log => 
      log.ip === ip && (now - log.timestamp) < minute
    );
    
    return recentRequests.length > 60;
  }
  
  isBotTiming(req) {
    // Check if requests are coming too fast (less than 100ms apart)
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    const recentRequests = this.accessLogs
      .filter(log => log.ip === ip && (now - log.timestamp) < 1000)
      .sort((a, b) => b.timestamp - a.timestamp);
      
    if (recentRequests.length >= 2) {
      const timeDiff = recentRequests[0].timestamp - recentRequests[1].timestamp;
      return timeDiff < 100; // Less than 100ms = likely bot
    }
    
    return false;
  }
  
  isValidUser(userData) {
    return userData && userData.id && userData.id.length > 0;
  }
  
  findUserFile(userId, fileId) {
    const userVaultPath = this.getUserVaultPath(userId);
    
    for (const category of Object.keys(this.supportedFormats)) {
      const categoryPath = path.join(userVaultPath, category);
      const metadataPath = path.join(categoryPath, fileId + '.meta.json');
      const filePath = path.join(categoryPath, fileId + '.enc');
      
      if (fs.existsSync(metadataPath) && fs.existsSync(filePath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        return { metadata, filePath, categoryPath };
      }
    }
    
    return null;
  }
  
  broadcastToUser(userId, message) {
    this.activeConnections.forEach(connection => {
      if (connection.userId === userId && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }
  
  broadcastToAll(message) {
    this.activeConnections.forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }
  
  createFileFilter() {
    return (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allExtensions = Object.values(this.supportedFormats).flat();
      
      if (allExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${ext}`), false);
      }
    };
  }
  
  createEncryptedFileServer() {
    return (req, res, next) => {
      // This would serve encrypted files with proper authentication
      // For now, just return 404 to unauthorized requests
      res.status(404).json({ error: 'File not found' });
    };
  }
  
  cleanupLogs() {
    // Keep only last 7 days of logs
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.accessLogs = this.accessLogs.filter(log => log.timestamp > weekAgo);
    
    console.log('🧹 Cleaned up old access logs');
  }
  
  generateSecurityReport() {
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentLogs = this.accessLogs.filter(log => log.timestamp > dayAgo);
    const suspiciousCount = recentLogs.filter(log => log.action?.includes('BLOCKED')).length;
    
    const report = {
      timestamp: now,
      period: '24h',
      totalRequests: recentLogs.length,
      suspiciousActivity: suspiciousCount,
      activeUsers: new Set(recentLogs.map(log => log.userId)).size,
      topIPs: this.getTopIPs(recentLogs),
      portHops: this.ports.length
    };
    
    console.log('📊 Security report:', report);
    
    // Save report to file
    const reportPath = path.join(this.vaultRoot, 'system/logs', `security-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }
  
  getTopIPs(logs) {
    const ipCounts = {};
    logs.forEach(log => {
      const ip = log.ip || 'unknown';
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });
    
    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }
}

// Export for use in other modules
module.exports = PrivateVaultServer;

// Start server if run directly
if (require.main === module) {
  console.log('🏦 Starting Private Vault Server...\n');
  
  const vault = new PrivateVaultServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Private Vault Server...');
    
    // Close all servers
    vault.servers.forEach((serverData, port) => {
      serverData.server.close(() => {
        console.log(`📴 Port ${port} closed`);
      });
    });
    
    console.log('✅ Private Vault Server shutdown complete');
    process.exit(0);
  });
  
  // Log startup complete
  setTimeout(() => {
    console.log('\n🌐 Private Vault Server URLs:');
    vault.ports.forEach((port, index) => {
      console.log(`🐒 Monkey Bar ${index + 1}: http://localhost:${port} ${index === 0 ? '(PRIMARY)' : ''}`);
    });
    console.log('\n🎵 Ready for vim-style music player integration');
    console.log('🔒 All files encrypted with gravity well technology');
    console.log('🚫 LLM access blocked - human users only');
  }, 2000);
}
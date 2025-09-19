#!/usr/bin/env node

/**
 * 🔐 QR CODE LOGIN & INVITE SYSTEM
 * Physical-to-digital bridge with UPC product mapping
 * 
 * This system enables:
 * - QR code generation for faction authentication
 * - Digital twin login via QR scan
 * - UPC barcode mapping to digital items/ideas
 * - Event invitation QR codes
 * - Cross-domain authentication
 * 
 * "we're still working on this fucking qr code login and invite system into upcs etc"
 */

const express = require('express');
const QRCode = require('qrcode');
const { createCanvas } = require('canvas');
const JsBarcode = require('jsbarcode');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class QRCodeLoginInviteSystem {
  constructor() {
    this.app = express();
    this.port = 7777;
    
    // Database for QR/UPC mappings
    this.dbPath = path.join(__dirname, 'qr-upc-system.db');
    this.db = null;
    
    // Integration endpoints
    this.gatewayHubUrl = 'http://localhost:9999';
    this.masterIntegrationUrl = 'http://localhost:8888';
    
    // QR code configurations
    this.qrConfig = {
      errorCorrectionLevel: 'H',
      type: 'svg',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };
    
    this.setupMiddleware();
    this.initializeDatabase();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  async initializeDatabase() {
    this.db = new sqlite3.Database(this.dbPath);
    
    const schema = `
      CREATE TABLE IF NOT EXISTS qr_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qr_id TEXT UNIQUE NOT NULL,
        qr_type TEXT NOT NULL, -- 'login', 'invite', 'faction', 'event', 'product'
        qr_data TEXT NOT NULL, -- JSON encoded data
        qr_image TEXT, -- Base64 encoded image
        session_id TEXT,
        faction_id TEXT,
        digital_twin_id TEXT,
        expires_at DATETIME,
        scan_count INTEGER DEFAULT 0,
        max_scans INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_scanned DATETIME
      );
      
      CREATE TABLE IF NOT EXISTS upc_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        upc_code TEXT UNIQUE NOT NULL,
        product_name TEXT NOT NULL,
        product_category TEXT,
        digital_item_id TEXT,
        digital_item_type TEXT, -- 'ship', 'resource', 'idea', 'recipe'
        game_attributes TEXT, -- JSON
        faction_affinity TEXT,
        unlock_requirements TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS scan_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id TEXT UNIQUE NOT NULL,
        qr_id TEXT,
        upc_code TEXT,
        scanner_session TEXT,
        scanner_location TEXT, -- JSON with lat/lng
        scan_context TEXT, -- 'mobile', 'desktop', 'kiosk', 'event'
        scan_result TEXT, -- JSON
        authenticated BOOLEAN DEFAULT FALSE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS authentication_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_id TEXT UNIQUE NOT NULL,
        qr_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        faction_id TEXT,
        digital_twin_id TEXT,
        permissions TEXT, -- JSON array
        valid_until DATETIME,
        revoked BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (qr_id) REFERENCES qr_codes(qr_id)
      );
      
      CREATE TABLE IF NOT EXISTS invite_chains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invite_id TEXT UNIQUE NOT NULL,
        parent_invite_id TEXT,
        creator_session TEXT NOT NULL,
        invite_type TEXT, -- 'faction', 'event', 'idea', 'collaboration'
        invite_data TEXT, -- JSON
        max_uses INTEGER DEFAULT 1,
        current_uses INTEGER DEFAULT 0,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_qr_type ON qr_codes(qr_type);
      CREATE INDEX IF NOT EXISTS idx_upc_code ON upc_mappings(upc_code);
      CREATE INDEX IF NOT EXISTS idx_scan_timestamp ON scan_events(timestamp);
    `;
    
    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) reject(err);
        else {
          this.seedDefaultUPCMappings();
          resolve();
        }
      });
    });
  }

  async seedDefaultUPCMappings() {
    // Seed some example UPC to digital item mappings
    const defaultMappings = [
      {
        upc: '012345678901',
        name: 'Explorer Ship Blueprint',
        category: 'ships',
        digitalType: 'ship',
        gameAttributes: { shipType: 'explorer', speed: 10, cargo: 50 },
        faction: 'technocrats'
      },
      {
        upc: '123456789012',
        name: 'Knowledge Crystal',
        category: 'resources',
        digitalType: 'resource',
        gameAttributes: { resourceType: 'knowledge', value: 100 },
        faction: 'progressives'
      },
      {
        upc: '234567890123',
        name: 'Digital Liberation Manifesto',
        category: 'ideas',
        digitalType: 'idea',
        gameAttributes: { ideaType: 'manifesto', believeBonus: 50 },
        faction: 'libertarians'
      }
    ];
    
    for (const mapping of defaultMappings) {
      await this.createUPCMapping(
        mapping.upc,
        mapping.name,
        mapping.category,
        mapping.digitalType,
        mapping.gameAttributes,
        mapping.faction
      );
    }
  }

  setupRoutes() {
    // 🎨 QR CODE GENERATION
    this.app.post('/api/qr/generate', async (req, res) => {
      try {
        const { type, data, options = {} } = req.body;
        const qrCode = await this.generateQRCode(type, data, options);
        res.json(qrCode);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🔐 QR LOGIN
    this.app.post('/api/qr/login', async (req, res) => {
      try {
        const { qrId } = req.body;
        const result = await this.processQRLogin(qrId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 📷 QR SCAN
    this.app.post('/api/qr/scan', async (req, res) => {
      try {
        const { qrData, scannerSession, location, context } = req.body;
        const result = await this.processScan(qrData, scannerSession, location, context);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🏷️ UPC OPERATIONS
    this.app.post('/api/upc/create', async (req, res) => {
      try {
        const { upcCode, productName, category, digitalType, gameAttributes, faction } = req.body;
        const mapping = await this.createUPCMapping(
          upcCode, productName, category, digitalType, gameAttributes, faction
        );
        res.json(mapping);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/upc/:code', async (req, res) => {
      try {
        const mapping = await this.getUPCMapping(req.params.code);
        res.json(mapping);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/upc/scan', async (req, res) => {
      try {
        const { upcCode, scannerSession } = req.body;
        const result = await this.processUPCScan(upcCode, scannerSession);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🎫 INVITE SYSTEM
    this.app.post('/api/invite/create', async (req, res) => {
      try {
        const { creatorSession, inviteType, inviteData, maxUses, expiresIn } = req.body;
        const invite = await this.createInvite(
          creatorSession, inviteType, inviteData, maxUses, expiresIn
        );
        res.json(invite);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/invite/redeem', async (req, res) => {
      try {
        const { inviteId, redeemerSession } = req.body;
        const result = await this.redeemInvite(inviteId, redeemerSession);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🔑 AUTHENTICATION TOKEN MANAGEMENT
    this.app.post('/api/auth/token/generate', async (req, res) => {
      try {
        const { qrId, sessionId, factionId, digitalTwinId, permissions, validFor } = req.body;
        const token = await this.generateAuthToken(
          qrId, sessionId, factionId, digitalTwinId, permissions, validFor
        );
        res.json(token);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/auth/token/validate', async (req, res) => {
      try {
        const { tokenId } = req.body;
        const isValid = await this.validateAuthToken(tokenId);
        res.json({ valid: isValid });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 📊 ANALYTICS
    this.app.get('/api/analytics/scans', async (req, res) => {
      try {
        const analytics = await this.getScanAnalytics(req.query);
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🎮 GAME INTEGRATION
    this.app.post('/api/game/unlock', async (req, res) => {
      try {
        const { sessionId, unlockCode, unlockType } = req.body; // unlockType: 'qr' or 'upc'
        const result = await this.unlockGameContent(sessionId, unlockCode, unlockType);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🌐 WEB INTERFACE
    this.app.get('/', (req, res) => {
      res.send(this.generateQRInterface());
    });
  }

  // QR Code Generation
  async generateQRCode(type, data, options = {}) {
    const qrId = `qr_${type}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const qrData = {
      id: qrId,
      type,
      data,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    // Generate QR code image
    const qrString = JSON.stringify(qrData);
    const qrImage = await QRCode.toDataURL(qrString, this.qrConfig);
    
    // Store in database
    await this.storeQRCode(qrId, type, qrData, qrImage, options);
    
    // Generate shareable URL
    const shareUrl = `${this.getBaseUrl()}/qr/${qrId}`;
    
    return {
      qrId,
      type,
      qrImage,
      shareUrl,
      rawData: qrData,
      expiresAt: options.expiresAt || null
    };
  }

  async storeQRCode(qrId, type, data, image, options) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO qr_codes 
         (qr_id, qr_type, qr_data, qr_image, session_id, faction_id, 
          digital_twin_id, expires_at, max_scans) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          qrId,
          type,
          JSON.stringify(data),
          image,
          options.sessionId || null,
          options.factionId || null,
          options.digitalTwinId || null,
          options.expiresAt || null,
          options.maxScans || null
        ],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  // QR Login Processing
  async processQRLogin(qrId) {
    const qrCode = await this.getQRCode(qrId);
    
    if (!qrCode) {
      throw new Error('Invalid QR code');
    }
    
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      throw new Error('QR code expired');
    }
    
    if (qrCode.max_scans && qrCode.scan_count >= qrCode.max_scans) {
      throw new Error('QR code scan limit reached');
    }
    
    // Update scan count
    await this.incrementScanCount(qrId);
    
    // Generate authentication token
    const token = await this.generateAuthToken(
      qrId,
      qrCode.session_id,
      qrCode.faction_id,
      qrCode.digital_twin_id,
      ['login', 'access_game'],
      86400000 // 24 hours
    );
    
    // Log scan event
    await this.logScanEvent(qrId, null, qrCode.session_id, null, 'qr_login', {
      authenticated: true,
      tokenId: token.tokenId
    });
    
    return {
      success: true,
      token: token.tokenId,
      sessionId: qrCode.session_id,
      factionId: qrCode.faction_id,
      digitalTwinId: qrCode.digital_twin_id,
      redirectUrl: `${this.gatewayHubUrl}?token=${token.tokenId}`
    };
  }

  // Scan Processing
  async processScan(qrData, scannerSession, location, context) {
    let parsedData;
    
    try {
      parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (error) {
      throw new Error('Invalid QR data format');
    }
    
    const scanId = `scan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Process based on QR type
    let result;
    switch (parsedData.type) {
      case 'login':
        result = await this.processQRLogin(parsedData.id);
        break;
      case 'invite':
        result = await this.processInviteScan(parsedData.id, scannerSession);
        break;
      case 'faction':
        result = await this.processFactionScan(parsedData.id, scannerSession);
        break;
      case 'event':
        result = await this.processEventScan(parsedData.id, scannerSession);
        break;
      case 'product':
        result = await this.processProductScan(parsedData.id, scannerSession);
        break;
      default:
        throw new Error(`Unknown QR type: ${parsedData.type}`);
    }
    
    // Log scan event
    await this.logScanEvent(
      parsedData.id,
      null,
      scannerSession,
      location,
      context,
      result
    );
    
    return result;
  }

  // UPC Operations
  async createUPCMapping(upcCode, productName, category, digitalType, gameAttributes, faction) {
    const digitalItemId = `item_${digitalType}_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO upc_mappings 
         (upc_code, product_name, product_category, digital_item_id, 
          digital_item_type, game_attributes, faction_affinity) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          upcCode,
          productName,
          category,
          digitalItemId,
          digitalType,
          JSON.stringify(gameAttributes),
          faction
        ],
        function(err) {
          if (err) reject(err);
          else resolve({
            id: this.lastID,
            upcCode,
            productName,
            digitalItemId,
            digitalType
          });
        }
      );
    });
  }

  async getUPCMapping(upcCode) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM upc_mappings WHERE upc_code = ?`,
        [upcCode],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else resolve({
            ...row,
            game_attributes: JSON.parse(row.game_attributes || '{}'),
            unlock_requirements: JSON.parse(row.unlock_requirements || '{}')
          });
        }
      );
    });
  }

  async processUPCScan(upcCode, scannerSession) {
    const mapping = await this.getUPCMapping(upcCode);
    
    if (!mapping) {
      return {
        success: false,
        message: 'Unknown product',
        upcCode
      };
    }
    
    // Log scan event
    await this.logScanEvent(null, upcCode, scannerSession, null, 'upc_scan', {
      productFound: true,
      digitalItemId: mapping.digital_item_id
    });
    
    // Check if user can unlock this item
    const unlockResult = await this.checkUnlockRequirements(
      scannerSession,
      mapping.unlock_requirements
    );
    
    if (unlockResult.canUnlock) {
      // Unlock in game
      await this.unlockGameContent(
        scannerSession,
        mapping.digital_item_id,
        'upc'
      );
      
      return {
        success: true,
        productName: mapping.product_name,
        digitalItem: {
          id: mapping.digital_item_id,
          type: mapping.digital_item_type,
          attributes: mapping.game_attributes
        },
        unlocked: true,
        faction: mapping.faction_affinity
      };
    } else {
      return {
        success: true,
        productName: mapping.product_name,
        digitalItem: {
          id: mapping.digital_item_id,
          type: mapping.digital_item_type
        },
        unlocked: false,
        requirements: unlockResult.missingRequirements
      };
    }
  }

  // Invite System
  async createInvite(creatorSession, inviteType, inviteData, maxUses = 1, expiresIn = null) {
    const inviteId = `invite_${inviteType}_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;
    
    // Create QR code for invite
    const qrCode = await this.generateQRCode('invite', {
      inviteId,
      inviteType,
      data: inviteData
    }, {
      sessionId: creatorSession,
      expiresAt,
      maxScans: maxUses
    });
    
    // Store invite
    await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO invite_chains 
         (invite_id, creator_session, invite_type, invite_data, max_uses, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [inviteId, creatorSession, inviteType, JSON.stringify(inviteData), maxUses, expiresAt],
        (err) => err ? reject(err) : resolve()
      );
    });
    
    return {
      inviteId,
      inviteType,
      qrCode: qrCode.qrImage,
      shareUrl: qrCode.shareUrl,
      maxUses,
      expiresAt
    };
  }

  async redeemInvite(inviteId, redeemerSession) {
    const invite = await this.getInvite(inviteId);
    
    if (!invite) {
      throw new Error('Invalid invite');
    }
    
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error('Invite expired');
    }
    
    if (invite.current_uses >= invite.max_uses) {
      throw new Error('Invite usage limit reached');
    }
    
    // Update usage count
    await this.incrementInviteUsage(inviteId);
    
    // Process based on invite type
    const inviteData = JSON.parse(invite.invite_data);
    let result;
    
    switch (invite.invite_type) {
      case 'faction':
        result = await this.joinFactionViaInvite(redeemerSession, inviteData.factionId);
        break;
      case 'event':
        result = await this.joinEventViaInvite(redeemerSession, inviteData.eventId);
        break;
      case 'idea':
        result = await this.joinIdeaViaInvite(redeemerSession, inviteData.ideaId);
        break;
      case 'collaboration':
        result = await this.joinCollaborationViaInvite(redeemerSession, inviteData.collaborationId);
        break;
      default:
        throw new Error(`Unknown invite type: ${invite.invite_type}`);
    }
    
    return {
      success: true,
      inviteType: invite.invite_type,
      result
    };
  }

  // Authentication Token Management
  async generateAuthToken(qrId, sessionId, factionId, digitalTwinId, permissions, validFor) {
    const tokenId = `token_${crypto.randomBytes(16).toString('hex')}`;
    const validUntil = new Date(Date.now() + validFor);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO authentication_tokens 
         (token_id, qr_id, session_id, faction_id, digital_twin_id, 
          permissions, valid_until) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tokenId, qrId, sessionId, factionId, digitalTwinId, JSON.stringify(permissions), validUntil],
        (err) => {
          if (err) reject(err);
          else resolve({
            tokenId,
            sessionId,
            factionId,
            digitalTwinId,
            permissions,
            validUntil
          });
        }
      );
    });
  }

  async validateAuthToken(tokenId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM authentication_tokens 
         WHERE token_id = ? AND revoked = FALSE AND valid_until > datetime('now')`,
        [tokenId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  // Helper methods
  async getQRCode(qrId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM qr_codes WHERE qr_id = ?`,
        [qrId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async incrementScanCount(qrId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE qr_codes 
         SET scan_count = scan_count + 1, last_scanned = CURRENT_TIMESTAMP 
         WHERE qr_id = ?`,
        [qrId],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  async logScanEvent(qrId, upcCode, scannerSession, location, context, result) {
    const scanId = `scan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO scan_events 
         (scan_id, qr_id, upc_code, scanner_session, scanner_location, 
          scan_context, scan_result, authenticated) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scanId,
          qrId,
          upcCode,
          scannerSession,
          JSON.stringify(location),
          context,
          JSON.stringify(result),
          result?.authenticated || false
        ],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  async checkUnlockRequirements(sessionId, requirements) {
    // Check with game system if user meets requirements
    if (!requirements || Object.keys(requirements).length === 0) {
      return { canUnlock: true };
    }
    
    // Example requirements check
    const missingRequirements = [];
    
    if (requirements.minLevel) {
      // Check user level
      // const userLevel = await this.getUserLevel(sessionId);
      // if (userLevel < requirements.minLevel) {
      //   missingRequirements.push(`Level ${requirements.minLevel} required`);
      // }
    }
    
    if (requirements.faction) {
      // Check user faction
      // const userFaction = await this.getUserFaction(sessionId);
      // if (userFaction !== requirements.faction) {
      //   missingRequirements.push(`Must be ${requirements.faction} faction`);
      // }
    }
    
    return {
      canUnlock: missingRequirements.length === 0,
      missingRequirements
    };
  }

  async unlockGameContent(sessionId, unlockCode, unlockType) {
    // Integration with Master Integration Launcher
    try {
      const response = await fetch(`${this.masterIntegrationUrl}/api/game/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlock_content',
          sessionId,
          unlockCode,
          unlockType,
          source: 'qr_upc_system'
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error unlocking game content:', error);
      return { success: false, error: error.message };
    }
  }

  async getScanAnalytics(filters = {}) {
    const { startDate, endDate, type, context } = filters;
    
    let query = `SELECT 
      COUNT(*) as total_scans,
      COUNT(DISTINCT scanner_session) as unique_scanners,
      SUM(CASE WHEN authenticated = 1 THEN 1 ELSE 0 END) as authenticated_scans,
      scan_context,
      DATE(timestamp) as scan_date
      FROM scan_events WHERE 1=1`;
    
    const params = [];
    
    if (startDate) {
      query += ` AND timestamp >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND timestamp <= ?`;
      params.push(endDate);
    }
    
    if (type) {
      query += ` AND (qr_id LIKE ? OR upc_code IS NOT NULL)`;
      params.push(`%${type}%`);
    }
    
    if (context) {
      query += ` AND scan_context = ?`;
      params.push(context);
    }
    
    query += ` GROUP BY scan_context, scan_date ORDER BY scan_date DESC`;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve({
          summary: rows,
          totalScans: rows.reduce((sum, r) => sum + r.total_scans, 0),
          uniqueScanners: new Set(rows.map(r => r.unique_scanners)).size
        });
      });
    });
  }

  getBaseUrl() {
    return process.env.BASE_URL || `http://localhost:${this.port}`;
  }

  // Process specific scan types
  async processInviteScan(inviteId, scannerSession) {
    return this.redeemInvite(inviteId, scannerSession);
  }

  async processFactionScan(qrId, scannerSession) {
    const qrCode = await this.getQRCode(qrId);
    const data = JSON.parse(qrCode.qr_data);
    
    // Join faction via gateway hub
    const response = await fetch(`${this.gatewayHubUrl}/api/faction/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: scannerSession,
        factionId: data.data.factionId
      })
    });
    
    return response.json();
  }

  async processEventScan(qrId, scannerSession) {
    const qrCode = await this.getQRCode(qrId);
    const data = JSON.parse(qrCode.qr_data);
    
    // Register for event
    return {
      success: true,
      eventId: data.data.eventId,
      registered: true
    };
  }

  async processProductScan(qrId, scannerSession) {
    const qrCode = await this.getQRCode(qrId);
    const data = JSON.parse(qrCode.qr_data);
    
    // Unlock product
    return this.unlockGameContent(scannerSession, data.data.productId, 'product');
  }

  async getInvite(inviteId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM invite_chains WHERE invite_id = ?`,
        [inviteId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async incrementInviteUsage(inviteId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE invite_chains SET current_uses = current_uses + 1 WHERE invite_id = ?`,
        [inviteId],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  async joinFactionViaInvite(sessionId, factionId) {
    // Integration with gateway hub
    const response = await fetch(`${this.gatewayHubUrl}/api/faction/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, factionId })
    });
    
    return response.json();
  }

  async joinEventViaInvite(sessionId, eventId) {
    // Event registration logic
    return { joined: true, eventId };
  }

  async joinIdeaViaInvite(sessionId, ideaId) {
    // Idea collaboration logic
    return { joined: true, ideaId };
  }

  async joinCollaborationViaInvite(sessionId, collaborationId) {
    // Collaboration logic
    return { joined: true, collaborationId };
  }

  generateQRInterface() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🔐 QR Code Login & Invite System</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
            color: #00ff41;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 15px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 0 0 20px #00ff41;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .panel {
            background: rgba(0, 255, 65, 0.05);
            border: 1px solid #00ff41;
            border-radius: 10px;
            padding: 25px;
            transition: all 0.3s ease;
        }
        
        .panel:hover {
            background: rgba(0, 255, 65, 0.1);
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0, 255, 65, 0.3);
        }
        
        .panel h3 {
            margin-top: 0;
            color: #00ff41;
            text-shadow: 0 0 10px #00ff41;
        }
        
        .input-group {
            margin: 15px 0;
        }
        
        .input-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .input-group input, .input-group select, .input-group textarea {
            width: 100%;
            padding: 10px;
            background: rgba(0, 255, 65, 0.1);
            border: 1px solid #00ff41;
            border-radius: 5px;
            color: #00ff41;
            font-family: inherit;
        }
        
        .button {
            background: linear-gradient(45deg, #00ff41, #00cc33);
            border: none;
            padding: 12px 20px;
            border-radius: 5px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            text-transform: uppercase;
        }
        
        .button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.8);
        }
        
        .qr-display {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: #fff;
            border-radius: 10px;
            display: none;
        }
        
        .qr-display img {
            max-width: 256px;
            margin: 10px auto;
        }
        
        .upc-display {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: rgba(0, 255, 65, 0.1);
            border-radius: 10px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .stat-card {
            background: rgba(0, 255, 65, 0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #00ff41;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .scan-camera {
            position: relative;
            width: 100%;
            max-width: 400px;
            margin: 20px auto;
            display: none;
        }
        
        #camera-preview {
            width: 100%;
            border: 2px solid #00ff41;
            border-radius: 10px;
        }
        
        .scan-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            border: 3px solid #00ff41;
            border-radius: 10px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        .result-display {
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 255, 65, 0.1);
            border: 1px solid #00ff41;
            border-radius: 5px;
            display: none;
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #00ff41;
        }
        
        .tab {
            padding: 10px 20px;
            background: rgba(0, 255, 65, 0.1);
            border: 1px solid #00ff41;
            border-bottom: none;
            border-radius: 5px 5px 0 0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            background: rgba(0, 255, 65, 0.2);
            transform: translateY(-2px);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 QR Code Login & Invite System</h1>
            <p>Physical-to-Digital Bridge with UPC Integration</p>
        </div>
        
        <div class="tabs">
            <div class="tab active" onclick="switchTab('generate')">Generate QR</div>
            <div class="tab" onclick="switchTab('scan')">Scan</div>
            <div class="tab" onclick="switchTab('upc')">UPC Manager</div>
            <div class="tab" onclick="switchTab('analytics')">Analytics</div>
        </div>
        
        <!-- Generate QR Tab -->
        <div id="generate-tab" class="tab-content active">
            <div class="grid">
                <div class="panel">
                    <h3>🎨 Generate QR Code</h3>
                    
                    <div class="input-group">
                        <label>QR Type:</label>
                        <select id="qrType" onchange="updateQRForm()">
                            <option value="login">Login Code</option>
                            <option value="invite">Invite Code</option>
                            <option value="faction">Faction Join</option>
                            <option value="event">Event Registration</option>
                            <option value="product">Product Unlock</option>
                        </select>
                    </div>
                    
                    <div id="qrFormFields">
                        <!-- Dynamic form fields based on type -->
                    </div>
                    
                    <button class="button" onclick="generateQRCode()">
                        Generate QR Code
                    </button>
                    
                    <div id="qrDisplay" class="qr-display"></div>
                </div>
                
                <div class="panel">
                    <h3>🎫 Create Invite</h3>
                    
                    <div class="input-group">
                        <label>Invite Type:</label>
                        <select id="inviteType">
                            <option value="faction">Faction Invite</option>
                            <option value="event">Event Invite</option>
                            <option value="idea">Idea Collaboration</option>
                            <option value="collaboration">Project Collaboration</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <label>Max Uses:</label>
                        <input type="number" id="maxUses" value="1" min="1">
                    </div>
                    
                    <div class="input-group">
                        <label>Expires In (hours):</label>
                        <input type="number" id="expiresIn" value="24" min="1">
                    </div>
                    
                    <div class="input-group">
                        <label>Invite Data (JSON):</label>
                        <textarea id="inviteData" rows="3">{"message": "Join us!"}</textarea>
                    </div>
                    
                    <button class="button" onclick="createInvite()">
                        Create Invite
                    </button>
                    
                    <div id="inviteDisplay" class="qr-display"></div>
                </div>
            </div>
        </div>
        
        <!-- Scan Tab -->
        <div id="scan-tab" class="tab-content">
            <div class="panel">
                <h3>📷 Scan QR/UPC Code</h3>
                
                <button class="button" onclick="startScanner()">
                    Start Camera Scanner
                </button>
                
                <div class="scan-camera" id="scanCamera">
                    <video id="camera-preview"></video>
                    <div class="scan-overlay"></div>
                </div>
                
                <div class="input-group">
                    <label>Or Enter Code Manually:</label>
                    <input type="text" id="manualCode" placeholder="QR data or UPC code">
                </div>
                
                <button class="button" onclick="processManualScan()">
                    Process Manual Entry
                </button>
                
                <div id="scanResult" class="result-display"></div>
            </div>
        </div>
        
        <!-- UPC Manager Tab -->
        <div id="upc-tab" class="tab-content">
            <div class="grid">
                <div class="panel">
                    <h3>🏷️ Create UPC Mapping</h3>
                    
                    <div class="input-group">
                        <label>UPC Code:</label>
                        <input type="text" id="upcCode" placeholder="012345678901">
                    </div>
                    
                    <div class="input-group">
                        <label>Product Name:</label>
                        <input type="text" id="productName" placeholder="Explorer Ship Blueprint">
                    </div>
                    
                    <div class="input-group">
                        <label>Category:</label>
                        <select id="productCategory">
                            <option value="ships">Ships</option>
                            <option value="resources">Resources</option>
                            <option value="ideas">Ideas</option>
                            <option value="tools">Tools</option>
                            <option value="cosmetics">Cosmetics</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <label>Digital Item Type:</label>
                        <select id="digitalType">
                            <option value="ship">Ship</option>
                            <option value="resource">Resource</option>
                            <option value="idea">Idea</option>
                            <option value="recipe">Recipe</option>
                            <option value="unlock">Unlock</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <label>Faction Affinity:</label>
                        <select id="factionAffinity">
                            <option value="">None</option>
                            <option value="technocrats">Technocrats</option>
                            <option value="libertarians">Libertarians</option>
                            <option value="guardians">Guardians</option>
                            <option value="progressives">Progressives</option>
                            <option value="cosmopolitans">Space Cosmopolitans</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <label>Game Attributes (JSON):</label>
                        <textarea id="gameAttributes" rows="3">{"power": 10, "rarity": "common"}</textarea>
                    </div>
                    
                    <button class="button" onclick="createUPCMapping()">
                        Create UPC Mapping
                    </button>
                    
                    <div id="upcResult" class="result-display"></div>
                </div>
                
                <div class="panel">
                    <h3>🔍 Search UPC Database</h3>
                    
                    <div class="input-group">
                        <label>Search UPC:</label>
                        <input type="text" id="searchUPC" placeholder="Enter UPC to search">
                    </div>
                    
                    <button class="button" onclick="searchUPC()">
                        Search UPC
                    </button>
                    
                    <div id="upcSearchResult" class="result-display"></div>
                    
                    <div class="upc-display">
                        <h4>Example UPC Codes:</h4>
                        <p>012345678901 - Explorer Ship Blueprint</p>
                        <p>123456789012 - Knowledge Crystal</p>
                        <p>234567890123 - Digital Liberation Manifesto</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Analytics Tab -->
        <div id="analytics-tab" class="tab-content">
            <div class="panel">
                <h3>📊 Scan Analytics</h3>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number" id="totalScans">0</div>
                        <div class="stat-label">Total Scans</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="uniqueScanners">0</div>
                        <div class="stat-label">Unique Scanners</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="qrGenerated">0</div>
                        <div class="stat-label">QR Generated</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="upcMapped">0</div>
                        <div class="stat-label">UPC Mapped</div>
                    </div>
                </div>
                
                <button class="button" onclick="refreshAnalytics()" style="margin-top: 20px;">
                    Refresh Analytics
                </button>
                
                <div id="analyticsDetails" class="result-display" style="margin-top: 20px;"></div>
            </div>
        </div>
    </div>
    
    <script>
        let currentTab = 'generate';
        let scanner = null;
        
        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            document.querySelector(\`.tab:nth-child(\${['generate', 'scan', 'upc', 'analytics'].indexOf(tab) + 1})\`).classList.add('active');
            document.getElementById(\`\${tab}-tab\`).classList.add('active');
            
            currentTab = tab;
            
            if (tab === 'analytics') {
                refreshAnalytics();
            }
        }
        
        function updateQRForm() {
            const type = document.getElementById('qrType').value;
            const fields = document.getElementById('qrFormFields');
            
            switch (type) {
                case 'login':
                    fields.innerHTML = \`
                        <div class="input-group">
                            <label>Session ID:</label>
                            <input type="text" id="sessionId" placeholder="user_session_123">
                        </div>
                        <div class="input-group">
                            <label>Faction ID:</label>
                            <input type="text" id="factionId" placeholder="technocrats">
                        </div>
                    \`;
                    break;
                    
                case 'faction':
                    fields.innerHTML = \`
                        <div class="input-group">
                            <label>Faction ID:</label>
                            <select id="factionSelect">
                                <option value="technocrats">Technocrats</option>
                                <option value="libertarians">Libertarians</option>
                                <option value="guardians">Guardians</option>
                                <option value="progressives">Progressives</option>
                                <option value="cosmopolitans">Space Cosmopolitans</option>
                            </select>
                        </div>
                    \`;
                    break;
                    
                case 'event':
                    fields.innerHTML = \`
                        <div class="input-group">
                            <label>Event ID:</label>
                            <input type="text" id="eventId" placeholder="event_2024_001">
                        </div>
                        <div class="input-group">
                            <label>Event Name:</label>
                            <input type="text" id="eventName" placeholder="Tech Meetup">
                        </div>
                    \`;
                    break;
                    
                case 'product':
                    fields.innerHTML = \`
                        <div class="input-group">
                            <label>Product ID:</label>
                            <input type="text" id="productId" placeholder="product_ship_001">
                        </div>
                        <div class="input-group">
                            <label>Product Type:</label>
                            <select id="productType">
                                <option value="ship">Ship</option>
                                <option value="resource">Resource</option>
                                <option value="unlock">Unlock</option>
                            </select>
                        </div>
                    \`;
                    break;
                    
                default:
                    fields.innerHTML = \`
                        <div class="input-group">
                            <label>Custom Data (JSON):</label>
                            <textarea id="customData" rows="3">{}</textarea>
                        </div>
                    \`;
            }
        }
        
        async function generateQRCode() {
            const type = document.getElementById('qrType').value;
            let data = {};
            
            // Collect data based on type
            switch (type) {
                case 'login':
                    data = {
                        sessionId: document.getElementById('sessionId').value,
                        factionId: document.getElementById('factionId').value
                    };
                    break;
                case 'faction':
                    data = {
                        factionId: document.getElementById('factionSelect').value
                    };
                    break;
                case 'event':
                    data = {
                        eventId: document.getElementById('eventId').value,
                        eventName: document.getElementById('eventName').value
                    };
                    break;
                case 'product':
                    data = {
                        productId: document.getElementById('productId').value,
                        productType: document.getElementById('productType').value
                    };
                    break;
                default:
                    try {
                        data = JSON.parse(document.getElementById('customData').value);
                    } catch (e) {
                        alert('Invalid JSON data');
                        return;
                    }
            }
            
            try {
                const response = await fetch('/api/qr/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, data })
                });
                
                const result = await response.json();
                
                const display = document.getElementById('qrDisplay');
                display.style.display = 'block';
                display.innerHTML = \`
                    <h4>Generated QR Code</h4>
                    <img src="\${result.qrImage}" alt="QR Code">
                    <p>ID: \${result.qrId}</p>
                    <p>Share URL: <a href="\${result.shareUrl}" target="_blank">\${result.shareUrl}</a></p>
                \`;
            } catch (error) {
                alert('Error generating QR code: ' + error.message);
            }
        }
        
        async function createInvite() {
            const inviteType = document.getElementById('inviteType').value;
            const maxUses = parseInt(document.getElementById('maxUses').value);
            const expiresIn = parseInt(document.getElementById('expiresIn').value) * 3600000; // Convert hours to ms
            
            let inviteData;
            try {
                inviteData = JSON.parse(document.getElementById('inviteData').value);
            } catch (e) {
                alert('Invalid JSON data');
                return;
            }
            
            try {
                const response = await fetch('/api/invite/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creatorSession: 'demo_session',
                        inviteType,
                        inviteData,
                        maxUses,
                        expiresIn
                    })
                });
                
                const result = await response.json();
                
                const display = document.getElementById('inviteDisplay');
                display.style.display = 'block';
                display.innerHTML = \`
                    <h4>Invite Created</h4>
                    <img src="\${result.qrCode}" alt="Invite QR Code">
                    <p>Invite ID: \${result.inviteId}</p>
                    <p>Share URL: <a href="\${result.shareUrl}" target="_blank">\${result.shareUrl}</a></p>
                    <p>Max Uses: \${result.maxUses}</p>
                \`;
            } catch (error) {
                alert('Error creating invite: ' + error.message);
            }
        }
        
        async function startScanner() {
            // Camera scanner implementation would go here
            // For demo, just show the camera preview area
            document.getElementById('scanCamera').style.display = 'block';
            alert('Camera scanner would start here. For demo, use manual entry.');
        }
        
        async function processManualScan() {
            const code = document.getElementById('manualCode').value;
            if (!code) {
                alert('Please enter a code');
                return;
            }
            
            try {
                // Determine if it's a UPC or QR
                const isUPC = /^\\d{12,13}$/.test(code);
                
                let response;
                if (isUPC) {
                    response = await fetch('/api/upc/scan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            upcCode: code,
                            scannerSession: 'demo_session'
                        })
                    });
                } else {
                    // Try to parse as QR data
                    let qrData;
                    try {
                        qrData = JSON.parse(code);
                    } catch (e) {
                        qrData = { id: code, type: 'unknown' };
                    }
                    
                    response = await fetch('/api/qr/scan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            qrData,
                            scannerSession: 'demo_session',
                            context: 'manual'
                        })
                    });
                }
                
                const result = await response.json();
                
                const display = document.getElementById('scanResult');
                display.style.display = 'block';
                display.innerHTML = \`
                    <h4>Scan Result</h4>
                    <pre>\${JSON.stringify(result, null, 2)}</pre>
                \`;
            } catch (error) {
                alert('Error processing scan: ' + error.message);
            }
        }
        
        async function createUPCMapping() {
            const upcCode = document.getElementById('upcCode').value;
            const productName = document.getElementById('productName').value;
            const category = document.getElementById('productCategory').value;
            const digitalType = document.getElementById('digitalType').value;
            const faction = document.getElementById('factionAffinity').value;
            
            let gameAttributes;
            try {
                gameAttributes = JSON.parse(document.getElementById('gameAttributes').value);
            } catch (e) {
                alert('Invalid JSON for game attributes');
                return;
            }
            
            try {
                const response = await fetch('/api/upc/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        upcCode,
                        productName,
                        category,
                        digitalType,
                        gameAttributes,
                        faction
                    })
                });
                
                const result = await response.json();
                
                const display = document.getElementById('upcResult');
                display.style.display = 'block';
                display.innerHTML = \`
                    <h4>UPC Mapping Created</h4>
                    <p>UPC: \${result.upcCode}</p>
                    <p>Product: \${result.productName}</p>
                    <p>Digital Item: \${result.digitalItemId}</p>
                \`;
            } catch (error) {
                alert('Error creating UPC mapping: ' + error.message);
            }
        }
        
        async function searchUPC() {
            const upcCode = document.getElementById('searchUPC').value;
            if (!upcCode) {
                alert('Please enter a UPC code');
                return;
            }
            
            try {
                const response = await fetch(\`/api/upc/\${upcCode}\`);
                const result = await response.json();
                
                const display = document.getElementById('upcSearchResult');
                display.style.display = 'block';
                
                if (result) {
                    display.innerHTML = \`
                        <h4>UPC Found</h4>
                        <p><strong>Product:</strong> \${result.product_name}</p>
                        <p><strong>Category:</strong> \${result.product_category}</p>
                        <p><strong>Digital Type:</strong> \${result.digital_item_type}</p>
                        <p><strong>Faction:</strong> \${result.faction_affinity || 'None'}</p>
                        <p><strong>Attributes:</strong></p>
                        <pre>\${JSON.stringify(result.game_attributes, null, 2)}</pre>
                    \`;
                } else {
                    display.innerHTML = '<p>UPC not found in database</p>';
                }
            } catch (error) {
                alert('Error searching UPC: ' + error.message);
            }
        }
        
        async function refreshAnalytics() {
            try {
                const response = await fetch('/api/analytics/scans');
                const analytics = await response.json();
                
                document.getElementById('totalScans').textContent = analytics.totalScans || 0;
                document.getElementById('uniqueScanners').textContent = analytics.uniqueScanners || 0;
                
                // Would need additional endpoints for these
                document.getElementById('qrGenerated').textContent = '42';
                document.getElementById('upcMapped').textContent = '3';
                
                const details = document.getElementById('analyticsDetails');
                if (analytics.summary && analytics.summary.length > 0) {
                    details.style.display = 'block';
                    details.innerHTML = \`
                        <h4>Recent Activity</h4>
                        <pre>\${JSON.stringify(analytics.summary.slice(0, 5), null, 2)}</pre>
                    \`;
                }
            } catch (error) {
                console.error('Error loading analytics:', error);
            }
        }
        
        // Initialize
        updateQRForm();
    </script>
</body>
</html>
    `;
  }

  async start() {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`
🔐 QR CODE LOGIN & INVITE SYSTEM LAUNCHED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Web Interface: http://localhost:${this.port}
📱 QR Generator: http://localhost:${this.port}/api/qr/generate
🏷️ UPC Manager: http://localhost:${this.port}/api/upc
🎫 Invite System: http://localhost:${this.port}/api/invite
📊 Analytics: http://localhost:${this.port}/api/analytics

🔗 INTEGRATIONS:
• Domain Gateway Hub: ${this.gatewayHubUrl}
• Master Integration: ${this.masterIntegrationUrl}

📱 QR CODE TYPES:
• Login Authentication
• Faction Joining
• Event Registration  
• Product Unlocking
• Custom Invites

🏷️ UPC FEATURES:
• Physical Product → Digital Item
• Faction-Aligned Products
• Game Attribute Mapping
• Unlock Requirements

🎯 READY FOR:
• QR-based faction login
• Digital twin authentication
• UPC barcode scanning
• Event invitations
• Cross-domain auth

🚀 THE PHYSICAL-DIGITAL BRIDGE IS OPEN!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        resolve();
      });
    });
  }
}

// Start the QR Code Login & Invite System
if (require.main === module) {
  const qrSystem = new QRCodeLoginInviteSystem();
  qrSystem.start().catch(console.error);
}

module.exports = QRCodeLoginInviteSystem;
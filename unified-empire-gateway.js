#!/usr/bin/env node

/**
 * UNIFIED EMPIRE GATEWAY
 * Single source of truth for all empire operations
 * Inspired by library automation systems - everything cataloged and accessible
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const cors = require('cors');
const path = require('path');

class UnifiedEmpireGateway {
  constructor() {
    this.app = express();
    this.port = 4444; // New unified port
    
    // Database connections
    this.postgres = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'document_generator',
      user: 'postgres',
      password: 'postgres'
    });
    
    this.redis = null; // Will init async
    
    // Service registry - what actually works
    this.services = {
      bridge: 'http://localhost:3333',
      mobileGames: '/real-mobile-game-platform.html',
      auditFirm: '/real-audit-firm.html',
      dashboard: '/index.html'
    };
    
    // Unified data schema
    this.schema = {
      initialized: false
    };
  }
  
  async init() {
    console.log('🏛️ UNIFIED EMPIRE GATEWAY INITIALIZING...\n');
    
    try {
      // Setup middleware
      this.app.use(cors());
      this.app.use(express.json());
      this.app.use(express.static(__dirname));
      
      // Initialize Redis properly
      this.redis = Redis.createClient({
        socket: { host: 'localhost', port: 6379 }
      });
      await this.redis.connect();
      console.log('✅ Redis connected');
      
      // Test PostgreSQL
      const pgTest = await this.postgres.query('SELECT NOW()');
      console.log('✅ PostgreSQL connected');
      
      // Initialize unified schema
      await this.initializeUnifiedSchema();
      
      // Setup all routes
      this.setupRoutes();
      
      // Start server
      this.app.listen(this.port, () => {
        console.log(`\n🌟 UNIFIED EMPIRE GATEWAY LIVE!`);
        console.log(`🔗 Gateway URL: http://localhost:${this.port}`);
        console.log(`\n📍 Access Points:`);
        console.log(`   Dashboard: http://localhost:${this.port}/`);
        console.log(`   API Docs: http://localhost:${this.port}/api/docs`);
        console.log(`   Health: http://localhost:${this.port}/api/health`);
        console.log(`   Games: http://localhost:${this.port}/real-mobile-game-platform.html`);
        console.log(`   Audit: http://localhost:${this.port}/real-audit-firm.html`);
      });
      
    } catch (error) {
      console.error('❌ Gateway initialization failed:', error);
      process.exit(1);
    }
  }
  
  async initializeUnifiedSchema() {
    console.log('📊 Creating unified data schema...');
    
    const schema = `
      -- Unified user table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255),
        credits INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Unified documents table
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255),
        content TEXT,
        doc_type VARCHAR(50),
        processed BOOLEAN DEFAULT FALSE,
        mvp_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Unified games table
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255),
        type VARCHAR(50),
        config JSONB,
        play_count INTEGER DEFAULT 0,
        credits_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Unified audits table
      CREATE TABLE IF NOT EXISTS audits (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255),
        system_type VARCHAR(50),
        audit_type VARCHAR(50),
        budget DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        bounties_paid DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Unified revenue table
      CREATE TABLE IF NOT EXISTS revenue (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        amount DECIMAL(10,2),
        source VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id);
      CREATE INDEX IF NOT EXISTS idx_revenue_user ON revenue(user_id);
    `;
    
    await this.postgres.query(schema);
    this.schema.initialized = true;
    console.log('✅ Unified schema ready');
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/api/health', async (req, res) => {
      const health = {
        status: 'healthy',
        services: {
          postgres: false,
          redis: false,
          bridge: false
        },
        timestamp: new Date()
      };
      
      try {
        await this.postgres.query('SELECT 1');
        health.services.postgres = true;
      } catch (e) {}
      
      try {
        await this.redis.ping();
        health.services.redis = true;
      } catch (e) {}
      
      try {
        const response = await fetch(`${this.services.bridge}/api/systems`);
        health.services.bridge = response.ok;
      } catch (e) {}
      
      res.json(health);
    });
    
    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'Unified Empire Gateway API',
        version: '1.0.0',
        endpoints: {
          health: 'GET /api/health',
          users: {
            create: 'POST /api/users',
            get: 'GET /api/users/:id',
            addCredits: 'POST /api/users/:id/credits'
          },
          documents: {
            create: 'POST /api/documents',
            process: 'POST /api/documents/:id/process',
            list: 'GET /api/documents'
          },
          games: {
            create: 'POST /api/games',
            play: 'POST /api/games/:id/play',
            list: 'GET /api/games'
          },
          audits: {
            create: 'POST /api/audits',
            update: 'PUT /api/audits/:id',
            list: 'GET /api/audits'
          },
          revenue: {
            track: 'POST /api/revenue',
            summary: 'GET /api/revenue/summary'
          }
        }
      });
    });
    
    // User management
    this.app.post('/api/users', async (req, res) => {
      try {
        const { username, email } = req.body;
        const result = await this.postgres.query(
          'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
          [username, email]
        );
        res.json({ success: true, user: result.rows[0] });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.get('/api/users/:id', async (req, res) => {
      try {
        const result = await this.postgres.query(
          'SELECT * FROM users WHERE id = $1',
          [req.params.id]
        );
        res.json({ success: true, user: result.rows[0] });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Document processing
    this.app.post('/api/documents', async (req, res) => {
      try {
        const { userId, title, content, docType } = req.body;
        
        const result = await this.postgres.query(
          'INSERT INTO documents (user_id, title, content, doc_type) VALUES ($1, $2, $3, $4) RETURNING *',
          [userId, title, content, docType]
        );
        
        // Queue for processing
        await this.redis.lPush('document:queue', JSON.stringify(result.rows[0]));
        
        res.json({ success: true, document: result.rows[0] });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/documents/:id/process', async (req, res) => {
      try {
        // Forward to bridge for actual processing
        const doc = await this.postgres.query(
          'SELECT * FROM documents WHERE id = $1',
          [req.params.id]
        );
        
        if (doc.rows.length === 0) {
          return res.status(404).json({ error: 'Document not found' });
        }
        
        // Call bridge API
        const response = await fetch(`${this.services.bridge}/api/process-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document: doc.rows[0].content,
            type: doc.rows[0].doc_type,
            userId: doc.rows[0].user_id
          })
        });
        
        const result = await response.json();
        
        // Update document with results
        await this.postgres.query(
          'UPDATE documents SET processed = true, mvp_data = $1 WHERE id = $2',
          [result, req.params.id]
        );
        
        res.json({ success: true, result });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Game management
    this.app.post('/api/games', async (req, res) => {
      try {
        const { userId, name, type, config } = req.body;
        
        const result = await this.postgres.query(
          'INSERT INTO games (user_id, name, type, config) VALUES ($1, $2, $3, $4) RETURNING *',
          [userId, name, type, JSON.stringify(config)]
        );
        
        res.json({ success: true, game: result.rows[0] });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/games/:id/play', async (req, res) => {
      try {
        const { creditsEarned } = req.body;
        
        // Update game stats
        const game = await this.postgres.query(
          `UPDATE games 
           SET play_count = play_count + 1,
               credits_earned = credits_earned + $1
           WHERE id = $2
           RETURNING *`,
          [creditsEarned || 0, req.params.id]
        );
        
        if (game.rows.length > 0 && creditsEarned > 0) {
          // Add credits to user
          await this.postgres.query(
            'UPDATE users SET credits = credits + $1 WHERE id = $2',
            [creditsEarned, game.rows[0].user_id]
          );
          
          // Track revenue
          await this.postgres.query(
            'INSERT INTO revenue (user_id, amount, source, description) VALUES ($1, $2, $3, $4)',
            [game.rows[0].user_id, creditsEarned * 0.01, 'game', `Game: ${game.rows[0].name}`]
          );
        }
        
        res.json({ success: true, game: game.rows[0] });
        
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Audit management
    this.app.post('/api/audits', async (req, res) => {
      try {
        const result = await this.postgres.query(
          `INSERT INTO audits (company_name, system_type, audit_type, budget)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [req.body.companyName, req.body.systemType, req.body.auditType, req.body.budget]
        );
        
        res.json({ success: true, audit: result.rows[0] });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Revenue tracking
    this.app.get('/api/revenue/summary', async (req, res) => {
      try {
        const total = await this.postgres.query(
          'SELECT SUM(amount) as total, COUNT(*) as transactions FROM revenue'
        );
        
        const bySource = await this.postgres.query(
          'SELECT source, SUM(amount) as amount, COUNT(*) as count FROM revenue GROUP BY source'
        );
        
        const recent = await this.postgres.query(
          'SELECT * FROM revenue ORDER BY created_at DESC LIMIT 10'
        );
        
        res.json({
          success: true,
          totalRevenue: parseFloat(total.rows[0].total || 0),
          transactions: parseInt(total.rows[0].transactions || 0),
          bySource: bySource.rows,
          recent: recent.rows
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Unified search across all entities
    this.app.get('/api/search', async (req, res) => {
      try {
        const { q } = req.query;
        if (!q) return res.json({ results: [] });
        
        const searchTerm = `%${q}%`;
        
        const documents = await this.postgres.query(
          'SELECT id, title, doc_type as type FROM documents WHERE title ILIKE $1 OR content ILIKE $1 LIMIT 5',
          [searchTerm]
        );
        
        const games = await this.postgres.query(
          'SELECT id, name as title, type FROM games WHERE name ILIKE $1 LIMIT 5',
          [searchTerm]
        );
        
        const audits = await this.postgres.query(
          'SELECT id, company_name as title, audit_type as type FROM audits WHERE company_name ILIKE $1 LIMIT 5',
          [searchTerm]
        );
        
        res.json({
          success: true,
          results: [
            ...documents.rows.map(d => ({ ...d, category: 'document' })),
            ...games.rows.map(g => ({ ...g, category: 'game' })),
            ...audits.rows.map(a => ({ ...a, category: 'audit' }))
          ]
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
}

// Start the gateway
const gateway = new UnifiedEmpireGateway();
gateway.init().catch(console.error);

module.exports = UnifiedEmpireGateway;
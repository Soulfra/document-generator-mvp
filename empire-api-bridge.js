#!/usr/bin/env node

/**
 * EMPIRE API BRIDGE
 * Connects Empire Document Generator endpoints to actual running services
 */

const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.json());

// CORS for Empire frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Service registry
const services = {
    templateProcessor: 'http://localhost:3000',
    aiApi: 'http://localhost:3001',
    systemBus: 'http://localhost:8899',
    marketplace: 'http://localhost:8080',
    ollama: 'http://localhost:11434'
};

// Database connections
const databases = {
    economic: new sqlite3.Database('./economic-engine.db'),
    business: new sqlite3.Database('./business-accounting.db'),
    gaming: new sqlite3.Database('./master-gaming-router.db'),
    files: new sqlite3.Database('./file-decisions.db')
};

/**
 * Empire API: /api/systems
 * Returns status of all connected systems
 */
app.get('/api/systems', async (req, res) => {
    const systemStatus = {
        services: {},
        databases: {},
        timestamp: new Date().toISOString()
    };
    
    // Check each service
    for (const [name, url] of Object.entries(services)) {
        try {
            const response = await axios.get(url + (name === 'ollama' ? '/api/tags' : '/health'), {
                timeout: 2000
            });
            systemStatus.services[name] = {
                status: 'online',
                url: url,
                response: response.status
            };
        } catch (error) {
            systemStatus.services[name] = {
                status: 'offline',
                url: url,
                error: error.message
            };
        }
    }
    
    // Check databases
    for (const [name, db] of Object.entries(databases)) {
        systemStatus.databases[name] = {
            status: 'connected',
            type: 'sqlite3'
        };
    }
    
    res.json(systemStatus);
});

/**
 * Empire API: /api/process-document
 * Processes documents through the template processor
 */
app.post('/api/process-document', async (req, res) => {
    try {
        const { document, type = 'text' } = req.body;
        
        if (!document) {
            return res.status(400).json({ error: 'Document content required' });
        }
        
        // First, analyze with AI
        const aiResponse = await axios.post(`${services.aiApi}/api/analyze`, {
            content: document,
            type: type,
            options: {
                extractFeatures: true,
                generateSummary: true,
                identifyRequirements: true
            }
        });
        
        // Then generate template
        const templateResponse = await axios.post(`${services.templateProcessor}/api/generate`, {
            analysis: aiResponse.data,
            document: document
        });
        
        // Log to database
        databases.files.run(
            'INSERT INTO decisions (file_id, decision_type, decision_data, created_at) VALUES (?, ?, ?, ?)',
            [null, 'document_processed', JSON.stringify({
                type: type,
                analysis: aiResponse.data,
                template: templateResponse.data
            }), Date.now()]
        );
        
        res.json({
            success: true,
            analysis: aiResponse.data,
            template: templateResponse.data,
            preview: `${services.templateProcessor}/preview/${templateResponse.data.id}`
        });
        
    } catch (error) {
        console.error('Document processing error:', error);
        res.status(500).json({
            error: 'Document processing failed',
            details: error.message
        });
    }
});

/**
 * Empire API: /api/create-game
 * Creates a game/interactive experience from document
 */
app.post('/api/create-game', async (req, res) => {
    try {
        const { document, gameType = 'adventure' } = req.body;
        
        // Use AI to generate game concept
        const gameConceptResponse = await axios.post(`${services.aiApi}/api/generate`, {
            prompt: `Create a ${gameType} game concept from: ${document}`,
            type: 'game-design',
            includeAssets: true
        });
        
        // Store in gaming database
        databases.gaming.run(
            'INSERT INTO games (name, type, concept, created_at) VALUES (?, ?, ?, ?)',
            ['Generated Game', gameType, JSON.stringify(gameConceptResponse.data), Date.now()]
        );
        
        res.json({
            success: true,
            gameId: Date.now(),
            concept: gameConceptResponse.data,
            playUrl: `${services.marketplace}/games/${Date.now()}`
        });
        
    } catch (error) {
        console.error('Game creation error:', error);
        res.status(500).json({
            error: 'Game creation failed',
            details: error.message
        });
    }
});

/**
 * Empire API: /api/revenue
 * Returns revenue statistics
 */
app.get('/api/revenue', async (req, res) => {
    try {
        const revenue = await new Promise((resolve, reject) => {
            databases.business.all(
                'SELECT * FROM transactions WHERE type = "income" ORDER BY date DESC, id DESC LIMIT 100',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
        
        const transactions = await new Promise((resolve, reject) => {
            databases.economic.all(
                'SELECT * FROM agent_trades ORDER BY created_at DESC LIMIT 100',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
        
        // Calculate totals
        const totalRevenue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
        const totalTransactions = transactions.length;
        
        res.json({
            totalRevenue,
            totalTransactions,
            recentRevenue: revenue.slice(0, 10),
            recentTransactions: transactions.slice(0, 10),
            chart: {
                labels: revenue.slice(0, 7).map(r => r.date || new Date().toLocaleDateString()),
                data: revenue.slice(0, 7).map(r => r.amount || 0)
            }
        });
        
    } catch (error) {
        console.error('Revenue query error:', error);
        res.json({
            totalRevenue: 0,
            totalTransactions: 0,
            recentRevenue: [],
            recentTransactions: [],
            chart: { labels: [], data: [] }
        });
    }
});

/**
 * Empire API: /api/files
 * Search and retrieve indexed files
 */
app.get('/api/files', async (req, res) => {
    try {
        const { search, type, limit = 50 } = req.query;
        
        let query = 'SELECT * FROM files';
        const params = [];
        
        if (search) {
            query += ' WHERE path LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (type) {
            query += params.length ? ' AND' : ' WHERE';
            query += ' type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY modified DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const files = await new Promise((resolve, reject) => {
            databases.files.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        res.json({
            count: files.length,
            files: files
        });
        
    } catch (error) {
        console.error('File search error:', error);
        res.status(500).json({
            error: 'File search failed',
            details: error.message
        });
    }
});

// Start server
const PORT = process.env.EMPIRE_PORT || 8090;
app.listen(PORT, () => {
    console.log(`
🏰 Empire API Bridge Started
============================
Port: ${PORT}
Endpoints:
  GET  /api/systems - System status
  POST /api/process-document - Process documents
  POST /api/create-game - Create games
  GET  /api/revenue - Revenue stats
  GET  /api/files - Search files

Connected Services:
${Object.entries(services).map(([name, url]) => `  - ${name}: ${url}`).join('\n')}

Connected Databases:
${Object.keys(databases).map(name => `  - ${name}.db`).join('\n')}
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Empire API Bridge...');
    Object.values(databases).forEach(db => db.close());
    process.exit(0);
});
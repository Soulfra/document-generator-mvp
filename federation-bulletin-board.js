#!/usr/bin/env node

/**
 * 📢 FEDERATION BULLETIN BOARD
 * 
 * Community task distribution system where high-priority tasks become bulletins
 * Citizens of the federation can claim tasks and contribute solutions
 * Integrates with forum, testing, and reward systems
 */

const EventEmitter = require('events');
const express = require('express');
const WebSocket = require('ws');
const { Pool } = require('pg');
const APIToForumBridge = require('./api-to-forum-bridge.js');
const DragDropHardhatTesting = require('./drag-drop-hardhat-testing.js');

class FederationBulletinBoard extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 8700,
            wsPort: options.wsPort || 8701,
            
            // Database
            dbUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_generator',
            
            // Integration endpoints
            forumBridgeUrl: options.forumBridgeUrl || 'http://localhost:7777',
            testingInterfaceUrl: options.testingInterfaceUrl || 'http://localhost:9500',
            
            // Federation settings
            citizenshipRequirements: {
                minLevel: 10,
                minContributions: 3,
                minQualityScore: 0.7
            },
            
            // Task priorities
            taskPriorities: {
                critical: { color: '#ff0000', xpMultiplier: 3, minCitizenship: 'senior' },
                high: { color: '#ff9900', xpMultiplier: 2, minCitizenship: 'regular' },
                medium: { color: '#ffcc00', xpMultiplier: 1.5, minCitizenship: 'junior' },
                low: { color: '#00cc00', xpMultiplier: 1, minCitizenship: 'apprentice' }
            },
            
            ...options
        };
        
        // Initialize components
        this.app = express();
        this.db = new Pool({ connectionString: this.config.dbUrl });
        this.forumBridge = new APIToForumBridge();
        this.testingInterface = new DragDropHardhatTesting();
        
        // State management
        this.bulletins = new Map();
        this.citizens = new Map();
        this.activeClaims = new Map();
        
        // Citizenship levels
        this.citizenshipLevels = {
            apprentice: { level: 1, badge: '📚', privileges: ['view', 'claim_low'] },
            junior: { level: 2, badge: '🎓', privileges: ['view', 'claim_medium', 'comment'] },
            regular: { level: 3, badge: '🏛️', privileges: ['view', 'claim_high', 'comment', 'vote'] },
            senior: { level: 4, badge: '⭐', privileges: ['view', 'claim_all', 'comment', 'vote', 'review'] },
            elder: { level: 5, badge: '👑', privileges: ['all', 'create_bulletins', 'approve_solutions'] }
        };
        
        console.log('📢 Federation Bulletin Board initialized');
    }
    
    async initialize() {
        console.log('🚀 Starting Federation Bulletin Board...');
        
        // Initialize database
        await this.initializeDatabase();
        
        // Set up Express server
        this.setupServer();
        
        // Set up WebSocket
        this.setupWebSocket();
        
        // Initialize integrations
        await this.initializeIntegrations();
        
        // Load existing bulletins
        await this.loadBulletins();
        
        // Start server
        this.server = this.app.listen(this.config.port, () => {
            console.log(`📢 Federation Bulletin Board running on port ${this.config.port}`);
            console.log(`🔗 Access at: http://localhost:${this.config.port}`);
        });
    }
    
    async initializeDatabase() {
        console.log('📊 Initializing federation database...');
        
        const tables = [
            `CREATE TABLE IF NOT EXISTS federation_citizens (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                citizenship_level VARCHAR(20) DEFAULT 'apprentice',
                reputation INTEGER DEFAULT 0,
                contributions INTEGER DEFAULT 0,
                quality_score FLOAT DEFAULT 0,
                specializations JSONB DEFAULT '[]',
                badges JSONB DEFAULT '[]',
                joined_at TIMESTAMP DEFAULT NOW(),
                last_active TIMESTAMP DEFAULT NOW()
            )`,
            
            `CREATE TABLE IF NOT EXISTS federation_bulletins (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                priority VARCHAR(20) DEFAULT 'medium',
                category VARCHAR(50),
                requirements JSONB DEFAULT '{}',
                reward_xp INTEGER DEFAULT 100,
                reward_tokens INTEGER DEFAULT 0,
                created_by INTEGER REFERENCES federation_citizens(id),
                created_at TIMESTAMP DEFAULT NOW(),
                deadline TIMESTAMP,
                status VARCHAR(20) DEFAULT 'open',
                forum_post_id INTEGER,
                test_criteria JSONB DEFAULT '[]'
            )`,
            
            `CREATE TABLE IF NOT EXISTS bulletin_claims (
                id SERIAL PRIMARY KEY,
                bulletin_id INTEGER REFERENCES federation_bulletins(id),
                citizen_id INTEGER REFERENCES federation_citizens(id),
                claimed_at TIMESTAMP DEFAULT NOW(),
                status VARCHAR(20) DEFAULT 'in_progress',
                solution_data JSONB,
                test_results JSONB,
                quality_score FLOAT,
                completed_at TIMESTAMP,
                UNIQUE(bulletin_id, citizen_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS citizen_contributions (
                id SERIAL PRIMARY KEY,
                citizen_id INTEGER REFERENCES federation_citizens(id),
                bulletin_id INTEGER REFERENCES federation_bulletins(id),
                contribution_type VARCHAR(50),
                content TEXT,
                quality_score FLOAT,
                peer_reviews JSONB DEFAULT '[]',
                rewards_earned JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];
        
        for (const query of tables) {
            await this.db.query(query);
        }
        
        console.log('✅ Federation database initialized');
    }
    
    setupServer() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static(__dirname + '/federation-ui'));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // Routes
        this.app.get('/', (req, res) => res.send(this.generateBulletinBoardUI()));
        
        // Bulletin endpoints
        this.app.get('/api/bulletins', this.getBulletins.bind(this));
        this.app.post('/api/bulletins', this.createBulletin.bind(this));
        this.app.get('/api/bulletins/:id', this.getBulletin.bind(this));
        this.app.post('/api/bulletins/:id/claim', this.claimBulletin.bind(this));
        this.app.post('/api/bulletins/:id/submit', this.submitSolution.bind(this));
        
        // Citizen endpoints
        this.app.get('/api/citizens', this.getCitizens.bind(this));
        this.app.post('/api/citizens/register', this.registerCitizen.bind(this));
        this.app.get('/api/citizens/:username', this.getCitizen.bind(this));
        
        // Federation stats
        this.app.get('/api/federation/stats', this.getFederationStats.bind(this));
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New federation citizen connected');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({ error: error.message }));
                }
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                message: 'Welcome to the Federation Bulletin Board',
                activeBulletins: this.bulletins.size
            }));
        });
        
        console.log(`🔌 WebSocket server on port ${this.config.wsPort}`);
    }
    
    async initializeIntegrations() {
        console.log('🔗 Initializing integrations...');
        
        // Forum bridge for posting bulletins
        await this.forumBridge.initialize();
        
        // Testing interface for solution validation
        await this.testingInterface.initialize();
        
        console.log('✅ Integrations ready');
    }
    
    async loadBulletins() {
        const result = await this.db.query(
            'SELECT * FROM federation_bulletins WHERE status = $1 ORDER BY created_at DESC',
            ['open']
        );
        
        result.rows.forEach(bulletin => {
            this.bulletins.set(bulletin.id, bulletin);
        });
        
        console.log(`📋 Loaded ${this.bulletins.size} active bulletins`);
    }
    
    // API Handlers
    
    async getBulletins(req, res) {
        try {
            const { priority, category, status = 'open' } = req.query;
            
            let query = 'SELECT b.*, c.username as creator_name FROM federation_bulletins b LEFT JOIN federation_citizens c ON b.created_by = c.id WHERE 1=1';
            const params = [];
            
            if (status) {
                params.push(status);
                query += ` AND b.status = $${params.length}`;
            }
            
            if (priority) {
                params.push(priority);
                query += ` AND b.priority = $${params.length}`;
            }
            
            if (category) {
                params.push(category);
                query += ` AND b.category = $${params.length}`;
            }
            
            query += ' ORDER BY b.created_at DESC';
            
            const result = await this.db.query(query, params);
            
            res.json({
                success: true,
                bulletins: result.rows,
                total: result.rows.length
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async createBulletin(req, res) {
        try {
            const { title, description, priority, category, requirements, rewards, testCriteria, deadline } = req.body;
            const { citizenId } = req.headers;
            
            // Verify citizen has permission
            const citizen = await this.getCitizenById(citizenId);
            if (!citizen || !this.canCreateBulletin(citizen)) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient privileges to create bulletins'
                });
            }
            
            // Create bulletin
            const result = await this.db.query(
                `INSERT INTO federation_bulletins 
                 (title, description, priority, category, requirements, reward_xp, reward_tokens, created_by, deadline, test_criteria)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [
                    title,
                    description,
                    priority || 'medium',
                    category,
                    JSON.stringify(requirements || {}),
                    rewards?.xp || 100,
                    rewards?.tokens || 0,
                    citizen.id,
                    deadline,
                    JSON.stringify(testCriteria || [])
                ]
            );
            
            const bulletin = result.rows[0];
            this.bulletins.set(bulletin.id, bulletin);
            
            // Post to forum
            if (priority === 'critical' || priority === 'high') {
                await this.postBulletinToForum(bulletin);
            }
            
            // Broadcast to connected citizens
            this.broadcastBulletinUpdate('new_bulletin', bulletin);
            
            res.json({
                success: true,
                bulletin
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async claimBulletin(req, res) {
        try {
            const bulletinId = parseInt(req.params.id);
            const { citizenId } = req.body;
            
            const bulletin = this.bulletins.get(bulletinId);
            if (!bulletin || bulletin.status !== 'open') {
                return res.status(404).json({
                    success: false,
                    error: 'Bulletin not available'
                });
            }
            
            // Verify citizen can claim this bulletin
            const citizen = await this.getCitizenById(citizenId);
            if (!this.canClaimBulletin(citizen, bulletin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient citizenship level for this bulletin'
                });
            }
            
            // Check if already claimed
            const existingClaim = await this.db.query(
                'SELECT * FROM bulletin_claims WHERE bulletin_id = $1 AND citizen_id = $2',
                [bulletinId, citizenId]
            );
            
            if (existingClaim.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'You have already claimed this bulletin'
                });
            }
            
            // Create claim
            const claim = await this.db.query(
                'INSERT INTO bulletin_claims (bulletin_id, citizen_id) VALUES ($1, $2) RETURNING *',
                [bulletinId, citizenId]
            );
            
            this.activeClaims.set(`${bulletinId}_${citizenId}`, claim.rows[0]);
            
            // Broadcast claim
            this.broadcastBulletinUpdate('bulletin_claimed', {
                bulletinId,
                citizenId,
                citizenName: citizen.username
            });
            
            res.json({
                success: true,
                claim: claim.rows[0]
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async submitSolution(req, res) {
        try {
            const bulletinId = parseInt(req.params.id);
            const { citizenId, solution, codeSnippets } = req.body;
            
            // Verify claim exists
            const claimKey = `${bulletinId}_${citizenId}`;
            const claim = this.activeClaims.get(claimKey);
            
            if (!claim) {
                return res.status(404).json({
                    success: false,
                    error: 'No active claim found'
                });
            }
            
            // Test solution
            const testResults = await this.testSolution(bulletinId, solution, codeSnippets);
            
            // Calculate quality score
            const qualityScore = this.calculateSolutionQuality(solution, testResults);
            
            // Update claim
            await this.db.query(
                `UPDATE bulletin_claims 
                 SET solution_data = $1, test_results = $2, quality_score = $3, 
                     status = $4, completed_at = NOW()
                 WHERE id = $5`,
                [
                    JSON.stringify({ solution, codeSnippets }),
                    JSON.stringify(testResults),
                    qualityScore,
                    testResults.allPassed ? 'completed' : 'needs_revision',
                    claim.id
                ]
            );
            
            // If solution passes, distribute rewards
            if (testResults.allPassed && qualityScore >= 0.7) {
                await this.distributeRewards(citizenId, bulletinId, qualityScore);
                
                // Update bulletin status if all requirements met
                await this.checkBulletinCompletion(bulletinId);
            }
            
            res.json({
                success: true,
                testResults,
                qualityScore,
                status: testResults.allPassed ? 'accepted' : 'needs_revision'
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async registerCitizen(req, res) {
        try {
            const { username, gameData } = req.body;
            
            // Check if already registered
            let citizen = await this.getCitizenByUsername(username);
            
            if (!citizen) {
                // Create new citizen
                const result = await this.db.query(
                    'INSERT INTO federation_citizens (username) VALUES ($1) RETURNING *',
                    [username]
                );
                citizen = result.rows[0];
            }
            
            // Update citizenship level based on game data
            if (gameData) {
                const newLevel = this.calculateCitizenshipLevel(gameData);
                if (newLevel !== citizen.citizenship_level) {
                    await this.db.query(
                        'UPDATE federation_citizens SET citizenship_level = $1 WHERE id = $2',
                        [newLevel, citizen.id]
                    );
                    citizen.citizenship_level = newLevel;
                }
            }
            
            this.citizens.set(username, citizen);
            
            res.json({
                success: true,
                citizen,
                privileges: this.citizenshipLevels[citizen.citizenship_level].privileges
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async getCitizen(req, res) {
        try {
            const { username } = req.params;
            const citizen = await this.getCitizenByUsername(username);
            
            if (!citizen) {
                return res.status(404).json({
                    success: false,
                    error: 'Citizen not found'
                });
            }
            
            // Get contribution stats
            const stats = await this.db.query(
                `SELECT COUNT(*) as total_contributions,
                        AVG(quality_score) as avg_quality,
                        SUM((rewards_earned->>'xp')::int) as total_xp_earned
                 FROM citizen_contributions
                 WHERE citizen_id = $1`,
                [citizen.id]
            );
            
            res.json({
                success: true,
                citizen,
                stats: stats.rows[0],
                level: this.citizenshipLevels[citizen.citizenship_level]
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async getFederationStats(req, res) {
        try {
            const stats = await this.db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM federation_citizens) as total_citizens,
                    (SELECT COUNT(*) FROM federation_bulletins WHERE status = 'open') as open_bulletins,
                    (SELECT COUNT(*) FROM federation_bulletins WHERE status = 'completed') as completed_bulletins,
                    (SELECT COUNT(*) FROM bulletin_claims WHERE status = 'completed') as successful_claims,
                    (SELECT AVG(quality_score) FROM citizen_contributions WHERE quality_score IS NOT NULL) as avg_contribution_quality
            `);
            
            const topContributors = await this.db.query(`
                SELECT c.username, c.reputation, c.citizenship_level, 
                       COUNT(cc.id) as contributions
                FROM federation_citizens c
                LEFT JOIN citizen_contributions cc ON c.id = cc.citizen_id
                GROUP BY c.id
                ORDER BY c.reputation DESC
                LIMIT 10
            `);
            
            res.json({
                success: true,
                stats: stats.rows[0],
                topContributors: topContributors.rows
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    // Helper methods
    
    async postBulletinToForum(bulletin) {
        try {
            const forumPost = await this.forumBridge.processAPIResponse({
                id: `bulletin_${bulletin.id}`,
                type: 'federation_bulletin',
                title: `[FEDERATION] ${bulletin.title}`,
                content: bulletin.description,
                priority: bulletin.priority,
                rewards: {
                    xp: bulletin.reward_xp,
                    tokens: bulletin.reward_tokens
                }
            }, {
                type: 'federation_bulletin',
                board: 'federation-tasks'
            });
            
            if (forumPost.success) {
                // Update bulletin with forum post ID
                await this.db.query(
                    'UPDATE federation_bulletins SET forum_post_id = $1 WHERE id = $2',
                    [forumPost.forumPost.id, bulletin.id]
                );
                
                console.log(`📮 Bulletin ${bulletin.id} posted to forum`);
            }
            
        } catch (error) {
            console.error('Failed to post bulletin to forum:', error);
        }
    }
    
    async testSolution(bulletinId, solution, codeSnippets) {
        const bulletin = this.bulletins.get(bulletinId);
        const testCriteria = bulletin.test_criteria || [];
        
        const results = {
            tests: [],
            allPassed: true
        };
        
        // Run each test criterion
        for (const criterion of testCriteria) {
            let passed = false;
            let output = '';
            
            try {
                // Send to testing interface
                const testResponse = await fetch(`${this.config.testingInterfaceUrl}/api/test-snippet`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        snippetId: `bulletin_${bulletinId}_test`,
                        code: codeSnippets[0] || solution,
                        language: criterion.language || 'javascript',
                        metadata: { bulletinId, criterion }
                    })
                });
                
                const testResult = await testResponse.json();
                passed = testResult.success;
                output = testResult.results?.output || 'Test completed';
                
            } catch (error) {
                passed = false;
                output = error.message;
            }
            
            results.tests.push({
                criterion: criterion.description,
                passed,
                output
            });
            
            if (!passed) results.allPassed = false;
        }
        
        return results;
    }
    
    calculateSolutionQuality(solution, testResults) {
        let score = 0;
        
        // Base score from test results
        const passedTests = testResults.tests.filter(t => t.passed).length;
        const totalTests = testResults.tests.length;
        score = totalTests > 0 ? (passedTests / totalTests) * 0.5 : 0.5;
        
        // Solution completeness
        if (solution.length > 100) score += 0.1;
        if (solution.length > 500) score += 0.1;
        
        // Code quality indicators
        if (solution.includes('test')) score += 0.05;
        if (solution.includes('error')) score += 0.05;
        if (solution.includes('async')) score += 0.05;
        if (solution.includes('comment')) score += 0.05;
        
        // Documentation
        if (solution.includes('/**') || solution.includes('//')) score += 0.1;
        
        return Math.min(score, 1.0);
    }
    
    async distributeRewards(citizenId, bulletinId, qualityScore) {
        const bulletin = this.bulletins.get(bulletinId);
        const citizen = await this.getCitizenById(citizenId);
        
        // Calculate rewards based on quality
        const xpReward = Math.floor(bulletin.reward_xp * qualityScore);
        const tokenReward = Math.floor(bulletin.reward_tokens * qualityScore);
        
        // Update citizen stats
        await this.db.query(
            `UPDATE federation_citizens 
             SET reputation = reputation + $1,
                 contributions = contributions + 1,
                 quality_score = ((quality_score * contributions) + $2) / (contributions + 1)
             WHERE id = $3`,
            [xpReward, qualityScore, citizenId]
        );
        
        // Record contribution
        await this.db.query(
            `INSERT INTO citizen_contributions 
             (citizen_id, bulletin_id, contribution_type, quality_score, rewards_earned)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                citizenId,
                bulletinId,
                'solution',
                qualityScore,
                JSON.stringify({ xp: xpReward, tokens: tokenReward })
            ]
        );
        
        // Broadcast reward
        this.broadcastBulletinUpdate('rewards_distributed', {
            citizenId,
            citizenName: citizen.username,
            rewards: { xp: xpReward, tokens: tokenReward }
        });
        
        console.log(`🎁 Distributed rewards to ${citizen.username}: ${xpReward} XP, ${tokenReward} tokens`);
    }
    
    async checkBulletinCompletion(bulletinId) {
        // Check if all requirements are met
        const completedClaims = await this.db.query(
            'SELECT COUNT(*) as count FROM bulletin_claims WHERE bulletin_id = $1 AND status = $2',
            [bulletinId, 'completed']
        );
        
        if (completedClaims.rows[0].count > 0) {
            // Mark bulletin as completed
            await this.db.query(
                'UPDATE federation_bulletins SET status = $1 WHERE id = $2',
                ['completed', bulletinId]
            );
            
            this.bulletins.delete(bulletinId);
            
            this.broadcastBulletinUpdate('bulletin_completed', { bulletinId });
        }
    }
    
    canCreateBulletin(citizen) {
        const level = this.citizenshipLevels[citizen.citizenship_level];
        return level.privileges.includes('create_bulletins') || level.privileges.includes('all');
    }
    
    canClaimBulletin(citizen, bulletin) {
        const citizenLevel = this.citizenshipLevels[citizen.citizenship_level];
        const requiredLevel = this.config.taskPriorities[bulletin.priority].minCitizenship;
        const requiredLevelNum = this.citizenshipLevels[requiredLevel].level;
        
        return citizenLevel.level >= requiredLevelNum;
    }
    
    calculateCitizenshipLevel(gameData) {
        const { level, contributions, qualityScore } = gameData;
        
        if (level >= 40 && contributions >= 20 && qualityScore >= 0.9) return 'elder';
        if (level >= 30 && contributions >= 10 && qualityScore >= 0.8) return 'senior';
        if (level >= 20 && contributions >= 5 && qualityScore >= 0.7) return 'regular';
        if (level >= 10 && contributions >= 3) return 'junior';
        return 'apprentice';
    }
    
    async getCitizenById(citizenId) {
        const result = await this.db.query(
            'SELECT * FROM federation_citizens WHERE id = $1',
            [citizenId]
        );
        return result.rows[0];
    }
    
    async getCitizenByUsername(username) {
        const result = await this.db.query(
            'SELECT * FROM federation_citizens WHERE username = $1',
            [username]
        );
        return result.rows[0];
    }
    
    broadcastBulletinUpdate(type, data) {
        const message = JSON.stringify({
            type,
            data,
            timestamp: Date.now()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                ws.citizenId = data.citizenId;
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    bulletins: Array.from(this.bulletins.values())
                }));
                break;
                
            case 'get_active_claims':
                const claims = Array.from(this.activeClaims.values())
                    .filter(c => c.citizen_id === data.citizenId);
                ws.send(JSON.stringify({
                    type: 'active_claims',
                    claims
                }));
                break;
        }
    }
    
    generateBulletinBoardUI() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>📢 Federation Bulletin Board</title>
    <style>
        * { box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid rgba(255,255,255,0.1);
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            background: linear-gradient(45deg, #ffd700, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            margin: 10px 0 0 0;
            opacity: 0.8;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            gap: 20px;
        }
        
        .sidebar {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        
        .main-content {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        
        .bulletin-filters {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .filter-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .filter-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        
        .filter-btn.active {
            background: #4CAF50;
            border-color: #4CAF50;
        }
        
        .bulletin-list {
            display: grid;
            gap: 15px;
        }
        
        .bulletin-card {
            background: rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #ccc;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .bulletin-card:hover {
            background: rgba(255,255,255,0.12);
            transform: translateX(5px);
        }
        
        .bulletin-card.critical { border-left-color: #ff0000; }
        .bulletin-card.high { border-left-color: #ff9900; }
        .bulletin-card.medium { border-left-color: #ffcc00; }
        .bulletin-card.low { border-left-color: #00cc00; }
        
        .bulletin-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 10px;
        }
        
        .bulletin-title {
            font-size: 1.2em;
            font-weight: bold;
            margin: 0;
        }
        
        .priority-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .priority-badge.critical { background: #ff0000; }
        .priority-badge.high { background: #ff9900; }
        .priority-badge.medium { background: #ffcc00; color: #333; }
        .priority-badge.low { background: #00cc00; color: #333; }
        
        .bulletin-description {
            margin: 10px 0;
            opacity: 0.9;
            line-height: 1.5;
        }
        
        .bulletin-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .reward-info {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
        }
        
        .reward-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .claim-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .claim-btn:hover {
            background: #45a049;
            transform: translateY(-2px);
        }
        
        .claim-btn:disabled {
            background: #666;
            cursor: not-allowed;
        }
        
        .citizen-card {
            background: rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .citizen-badge {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .citizen-name {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .citizen-level {
            opacity: 0.8;
            margin-bottom: 15px;
        }
        
        .citizen-stats {
            display: grid;
            gap: 10px;
            text-align: left;
            font-size: 0.9em;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .leaderboard {
            margin-top: 20px;
        }
        
        .leaderboard-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            margin-bottom: 8px;
        }
        
        .rank {
            font-size: 1.2em;
            font-weight: bold;
            width: 30px;
        }
        
        .leader-info {
            flex: 1;
        }
        
        .leader-name {
            font-weight: bold;
        }
        
        .leader-score {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        @media (max-width: 1200px) {
            .container {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📢 Federation Bulletin Board</h1>
        <p class="subtitle">Citizens unite to solve challenges and build the future</p>
    </div>
    
    <div class="container">
        <div class="sidebar">
            <div class="citizen-card">
                <div class="citizen-badge">📚</div>
                <div class="citizen-name">Guest Citizen</div>
                <div class="citizen-level">Apprentice Level</div>
                <div class="citizen-stats">
                    <div class="stat-item">
                        <span>Reputation</span>
                        <span>0</span>
                    </div>
                    <div class="stat-item">
                        <span>Contributions</span>
                        <span>0</span>
                    </div>
                    <div class="stat-item">
                        <span>Quality Score</span>
                        <span>-</span>
                    </div>
                </div>
                <button class="claim-btn" style="width: 100%; margin-top: 15px;" onclick="register()">
                    Register as Citizen
                </button>
            </div>
            
            <h3>🏆 Top Contributors</h3>
            <div class="leaderboard" id="leaderboard">
                <!-- Loaded dynamically -->
            </div>
        </div>
        
        <div class="main-content">
            <div class="bulletin-filters">
                <button class="filter-btn active" onclick="filterBulletins('all')">All Bulletins</button>
                <button class="filter-btn" onclick="filterBulletins('critical')">Critical</button>
                <button class="filter-btn" onclick="filterBulletins('high')">High Priority</button>
                <button class="filter-btn" onclick="filterBulletins('medium')">Medium</button>
                <button class="filter-btn" onclick="filterBulletins('low')">Low</button>
            </div>
            
            <div class="bulletin-list" id="bulletinList">
                <!-- Bulletins loaded here -->
            </div>
        </div>
        
        <div class="sidebar">
            <h3>📊 Federation Stats</h3>
            <div id="federationStats" class="citizen-stats">
                <!-- Stats loaded here -->
            </div>
            
            <h3 style="margin-top: 30px;">🎯 Active Claims</h3>
            <div id="activeClaims">
                <p style="opacity: 0.6;">Login to see your active claims</p>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let currentFilter = 'all';
        let citizenId = localStorage.getItem('federationCitizenId');
        
        // Connect to WebSocket
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:8701');
            
            ws.onopen = () => {
                console.log('Connected to Federation');
                if (citizenId) {
                    ws.send(JSON.stringify({ type: 'subscribe', citizenId }));
                }
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'new_bulletin':
                    loadBulletins();
                    break;
                case 'bulletin_claimed':
                    updateBulletinStatus(data.data.bulletinId, 'claimed');
                    break;
                case 'bulletin_completed':
                    updateBulletinStatus(data.data.bulletinId, 'completed');
                    break;
                case 'rewards_distributed':
                    if (data.data.citizenId === citizenId) {
                        showRewardNotification(data.data.rewards);
                    }
                    break;
            }
        }
        
        async function loadBulletins() {
            try {
                const response = await fetch('/api/bulletins?status=open');
                const data = await response.json();
                
                const bulletinList = document.getElementById('bulletinList');
                bulletinList.innerHTML = '';
                
                const filteredBulletins = currentFilter === 'all' 
                    ? data.bulletins 
                    : data.bulletins.filter(b => b.priority === currentFilter);
                
                filteredBulletins.forEach(bulletin => {
                    const card = createBulletinCard(bulletin);
                    bulletinList.appendChild(card);
                });
                
            } catch (error) {
                console.error('Failed to load bulletins:', error);
            }
        }
        
        function createBulletinCard(bulletin) {
            const card = document.createElement('div');
            card.className = \`bulletin-card \${bulletin.priority}\`;
            card.innerHTML = \`
                <div class="bulletin-header">
                    <h3 class="bulletin-title">\${bulletin.title}</h3>
                    <span class="priority-badge \${bulletin.priority}">\${bulletin.priority}</span>
                </div>
                <p class="bulletin-description">\${bulletin.description}</p>
                <div class="bulletin-footer">
                    <div class="reward-info">
                        <div class="reward-item">
                            <span>💎</span>
                            <span>\${bulletin.reward_xp} XP</span>
                        </div>
                        \${bulletin.reward_tokens > 0 ? \`
                        <div class="reward-item">
                            <span>🪙</span>
                            <span>\${bulletin.reward_tokens} Tokens</span>
                        </div>\` : ''}
                    </div>
                    <button class="claim-btn" onclick="claimBulletin(\${bulletin.id})" 
                            \${!citizenId ? 'disabled' : ''}>
                        \${citizenId ? 'Claim Task' : 'Login to Claim'}
                    </button>
                </div>
            \`;
            return card;
        }
        
        async function claimBulletin(bulletinId) {
            if (!citizenId) {
                alert('Please register as a citizen first');
                return;
            }
            
            try {
                const response = await fetch(\`/api/bulletins/\${bulletinId}/claim\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ citizenId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Bulletin claimed! Check your active claims.');
                    loadBulletins();
                    loadActiveClaims();
                } else {
                    alert(result.error);
                }
                
            } catch (error) {
                alert('Failed to claim bulletin');
            }
        }
        
        function filterBulletins(priority) {
            currentFilter = priority;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            loadBulletins();
        }
        
        async function register() {
            const username = prompt('Enter your username:');
            if (!username) return;
            
            try {
                const response = await fetch('/api/citizens/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    citizenId = result.citizen.id;
                    localStorage.setItem('federationCitizenId', citizenId);
                    localStorage.setItem('federationUsername', username);
                    
                    alert(\`Welcome to the Federation, \${username}!\`);
                    location.reload();
                }
                
            } catch (error) {
                alert('Registration failed');
            }
        }
        
        async function loadFederationStats() {
            try {
                const response = await fetch('/api/federation/stats');
                const data = await response.json();
                
                const statsEl = document.getElementById('federationStats');
                statsEl.innerHTML = \`
                    <div class="stat-item">
                        <span>Total Citizens</span>
                        <span>\${data.stats.total_citizens}</span>
                    </div>
                    <div class="stat-item">
                        <span>Open Bulletins</span>
                        <span>\${data.stats.open_bulletins}</span>
                    </div>
                    <div class="stat-item">
                        <span>Completed</span>
                        <span>\${data.stats.completed_bulletins}</span>
                    </div>
                    <div class="stat-item">
                        <span>Avg Quality</span>
                        <span>\${(data.stats.avg_contribution_quality * 100).toFixed(0)}%</span>
                    </div>
                \`;
                
                // Load leaderboard
                const leaderboardEl = document.getElementById('leaderboard');
                leaderboardEl.innerHTML = data.topContributors.map((citizen, index) => \`
                    <div class="leaderboard-item">
                        <div class="rank">#\${index + 1}</div>
                        <div class="leader-info">
                            <div class="leader-name">\${citizen.username}</div>
                            <div class="leader-score">\${citizen.reputation} reputation</div>
                        </div>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
        
        function showRewardNotification(rewards) {
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            \`;
            notification.innerHTML = \`
                <h4 style="margin: 0 0 10px 0;">🎉 Rewards Earned!</h4>
                <p style="margin: 0;">+\${rewards.xp} XP</p>
                \${rewards.tokens > 0 ? \`<p style="margin: 0;">+\${rewards.tokens} Tokens</p>\` : ''}
            \`;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        // Initialize
        connectWebSocket();
        loadBulletins();
        loadFederationStats();
        
        // Check if citizen is logged in
        if (citizenId) {
            const username = localStorage.getItem('federationUsername');
            // Update UI for logged in citizen
            // This would load citizen data and update the sidebar
        }
        
        // Refresh data periodically
        setInterval(() => {
            loadBulletins();
            loadFederationStats();
        }, 30000);
    </script>
    
    <style>
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    </style>
</body>
</html>`;
    }
}

// Export for integration
module.exports = FederationBulletinBoard;

// Run if executed directly
if (require.main === module) {
    const federation = new FederationBulletinBoard();
    
    console.log('📢 FEDERATION BULLETIN BOARD');
    console.log('===========================\n');
    
    federation.initialize().catch(error => {
        console.error('❌ Failed to start Federation:', error);
        process.exit(1);
    });
}
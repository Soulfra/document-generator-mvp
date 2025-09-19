#!/usr/bin/env node

/**
 * 🏆⚡ UNIVERSAL LEADERBOARD ENGINE - Position-Based Speedrun Tracking
 * 
 * Real-time leaderboards with position-based ranking system
 * Integrates with character identity system for TIN tracking
 * Supports multiple game types and speedrun categories
 */

const EventEmitter = require('events');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

class UniversalLeaderboard extends EventEmitter {
    constructor(characterIdentitySystem) {
        super();
        
        this.characterSystem = characterIdentitySystem;
        this.db = null;
        this.app = express();
        this.port = 3334;
        this.wsPort = 3335;
        this.wss = null;
        
        // Active speedruns tracking
        this.activeRuns = new Map();
        this.liveSpectators = new Set();
        
        // Leaderboard configurations
        this.gameTypes = new Map();
        this.speedrunCategories = new Map();
        this.positionRankings = new Map();
        
        // Real-time updates
        this.updateInterval = 1000; // 1 second
        this.leaderboardCache = new Map();
        
        console.log('🏆 Universal Leaderboard Engine initializing...');
        this.init();
    }
    
    async init() {
        await this.setupDatabase();
        await this.loadGameConfigurations();
        this.setupExpressServer();
        this.setupWebSocketServer();
        this.startRealTimeUpdates();
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║              🏆 UNIVERSAL LEADERBOARD ENGINE ACTIVE          ║
║                                                              ║
║  Real-time speedrun tracking & position-based ranking       ║
║                                                              ║
║  📊 API: http://localhost:${this.port}                       ║
║  🔴 Live: ws://localhost:${this.wsPort}                      ║
║  🎮 Game Types: ${Array.from(this.gameTypes.keys()).join(', ').padEnd(20)}    ║
║  🏃 Active Runs: ${this.activeRuns.size.toString().padStart(8)}                      ║
║  👀 Spectators: ${this.liveSpectators.size.toString().padStart(9)}                      ║
╚══════════════════════════════════════════════════════════════╝`);
    }
    
    async setupDatabase() {
        const dbPath = path.join(__dirname, 'data', 'leaderboards.db');
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        
        this.db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        // Create leaderboard entries table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS leaderboard_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tin TEXT NOT NULL,
                game_type TEXT NOT NULL,
                category TEXT NOT NULL,
                time_ms INTEGER NOT NULL,
                position INTEGER NOT NULL,
                join_position INTEGER NOT NULL,
                run_id TEXT NOT NULL,
                completed_at INTEGER NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                video_proof TEXT,
                metadata TEXT,
                FOREIGN KEY (tin) REFERENCES characters (tin)
            )
        `);
        
        // Create speedrun sessions table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS speedrun_sessions (
                run_id TEXT PRIMARY KEY,
                tin TEXT NOT NULL,
                game_type TEXT NOT NULL,
                category TEXT NOT NULL,
                started_at INTEGER NOT NULL,
                completed_at INTEGER,
                status TEXT DEFAULT 'active',
                current_position INTEGER,
                join_position INTEGER NOT NULL,
                checkpoints TEXT,
                events TEXT,
                final_time_ms INTEGER,
                death_count INTEGER DEFAULT 0,
                pause_count INTEGER DEFAULT 0,
                FOREIGN KEY (tin) REFERENCES characters (tin)
            )
        `);
        
        // Create position rankings table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS position_rankings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_type TEXT NOT NULL,
                category TEXT NOT NULL,
                position INTEGER NOT NULL,
                tin TEXT NOT NULL,
                join_timestamp INTEGER NOT NULL,
                current_ranking INTEGER,
                best_time_ms INTEGER,
                run_count INTEGER DEFAULT 1,
                UNIQUE(game_type, category, position, tin)
            )
        `);
        
        // Create real-time events table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS realtime_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_data TEXT,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (run_id) REFERENCES speedrun_sessions (run_id)
            )
        `);
        
        // Create achievements and records table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_type TEXT NOT NULL,
                category TEXT NOT NULL,
                record_type TEXT NOT NULL,
                tin TEXT NOT NULL,
                value REAL NOT NULL,
                achieved_at INTEGER NOT NULL,
                run_id TEXT,
                verified BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (tin) REFERENCES characters (tin)
            )
        `);
        
        // Create indexes for performance
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_leaderboard_game_category ON leaderboard_entries (game_type, category);
            CREATE INDEX IF NOT EXISTS idx_leaderboard_time ON leaderboard_entries (time_ms);
            CREATE INDEX IF NOT EXISTS idx_leaderboard_position ON leaderboard_entries (position);
            CREATE INDEX IF NOT EXISTS idx_sessions_status ON speedrun_sessions (status);
            CREATE INDEX IF NOT EXISTS idx_sessions_started ON speedrun_sessions (started_at);
            CREATE INDEX IF NOT EXISTS idx_position_rankings_type ON position_rankings (game_type, category);
            CREATE INDEX IF NOT EXISTS idx_events_run ON realtime_events (run_id);
        `);
        
        console.log('🗄️ Leaderboard database initialized');
    }
    
    async loadGameConfigurations() {
        const gameConfigs = [
            {
                gameType: 'chess-speedrun',
                displayName: 'AI Chess Speedrun',
                categories: [
                    { 
                        name: 'any_percent', 
                        displayName: 'Any%', 
                        description: 'Win by any means',
                        positionSlots: 100
                    },
                    { 
                        name: 'no_death', 
                        displayName: 'No Death%', 
                        description: 'Win without losing pieces',
                        positionSlots: 50
                    },
                    { 
                        name: 'sub_5_minutes', 
                        displayName: 'Sub 5 Minutes', 
                        description: 'Complete in under 5 minutes',
                        positionSlots: 25
                    }
                ],
                checkpoints: ['opening', 'midgame', 'endgame', 'victory'],
                metrics: ['time', 'moves', 'pieces_lost', 'checkmates_given']
            },
            {
                gameType: 'civilization-speedrun',
                displayName: 'Civilization Builder Speedrun',
                categories: [
                    { 
                        name: 'tech_tree_100', 
                        displayName: 'Tech Tree 100%', 
                        description: 'Research all technologies',
                        positionSlots: 75
                    },
                    { 
                        name: 'population_1000', 
                        displayName: 'Population 1000', 
                        description: 'Reach 1000 population',
                        positionSlots: 100
                    }
                ],
                checkpoints: ['founding', 'first_tech', 'first_trade', 'population_milestone', 'completion'],
                metrics: ['time', 'population', 'technologies', 'trade_routes', 'happiness']
            },
            {
                gameType: 'adventure-speedrun',
                displayName: 'Adventure Engine Speedrun',
                categories: [
                    { 
                        name: 'click_master', 
                        displayName: 'Click Master', 
                        description: '1000 successful clicks',
                        positionSlots: 200
                    },
                    { 
                        name: 'reality_bender', 
                        displayName: 'Reality Bender', 
                        description: 'Spawn 100 clickables',
                        positionSlots: 150
                    }
                ],
                checkpoints: ['first_click', 'first_spawn', 'chain_reaction', 'mastery'],
                metrics: ['time', 'clicks', 'spawns', 'points', 'efficiency']
            }
        ];
        
        for (const config of gameConfigs) {
            this.gameTypes.set(config.gameType, config);
            
            for (const category of config.categories) {
                const key = `${config.gameType}:${category.name}`;
                this.speedrunCategories.set(key, {
                    ...category,
                    gameType: config.gameType,
                    checkpoints: config.checkpoints,
                    metrics: config.metrics
                });
                
                // Initialize position rankings
                this.positionRankings.set(key, new Array(category.positionSlots).fill(null));
            }
        }
        
        console.log(`🎮 Loaded ${gameConfigs.length} game types with ${this.speedrunCategories.size} categories`);
    }
    
    setupExpressServer() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
        
        this.setupAPIRoutes();
        
        this.app.listen(this.port, () => {
            console.log(`🌐 Leaderboard API running on http://localhost:${this.port}`);
        });
    }
    
    setupAPIRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                activeRuns: this.activeRuns.size,
                spectators: this.liveSpectators.size,
                gameTypes: Array.from(this.gameTypes.keys()),
                timestamp: new Date().toISOString()
            });
        });
        
        // Get game types and categories
        this.app.get('/api/games', (req, res) => {
            const games = Array.from(this.gameTypes.values()).map(game => ({
                gameType: game.gameType,
                displayName: game.displayName,
                categories: game.categories.map(cat => ({
                    name: cat.name,
                    displayName: cat.displayName,
                    description: cat.description,
                    positionSlots: cat.positionSlots
                }))
            }));
            res.json(games);
        });
        
        // Get leaderboard for specific game/category
        this.app.get('/api/leaderboard/:gameType/:category', async (req, res) => {
            try {
                const { gameType, category } = req.params;
                const { limit = 100, position = null } = req.query;
                
                const leaderboard = await this.getLeaderboard(gameType, category, parseInt(limit), position ? parseInt(position) : null);
                res.json(leaderboard);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Start a speedrun
        this.app.post('/api/speedrun/start', async (req, res) => {
            try {
                const { tin, gameType, category } = req.body;
                const runSession = await this.startSpeedrun(tin, gameType, category);
                res.json(runSession);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Update speedrun progress
        this.app.post('/api/speedrun/:runId/checkpoint', async (req, res) => {
            try {
                const { runId } = req.params;
                const checkpointData = req.body;
                
                await this.recordCheckpoint(runId, checkpointData);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Complete speedrun
        this.app.post('/api/speedrun/:runId/complete', async (req, res) => {
            try {
                const { runId } = req.params;
                const completionData = req.body;
                
                const result = await this.completeSpeedrun(runId, completionData);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Record death/failure
        this.app.post('/api/speedrun/:runId/death', async (req, res) => {
            try {
                const { runId } = req.params;
                const deathData = req.body;
                
                await this.recordDeath(runId, deathData);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get active speedruns
        this.app.get('/api/speedruns/active', (req, res) => {
            const activeRuns = Array.from(this.activeRuns.values()).map(run => ({
                runId: run.runId,
                tin: run.tin,
                gameType: run.gameType,
                category: run.category,
                startedAt: run.startedAt,
                currentPosition: run.currentPosition,
                elapsedTime: Date.now() - run.startedAt
            }));
            
            res.json(activeRuns);
        });
        
        // Get position-based rankings
        this.app.get('/api/rankings/:gameType/:category', async (req, res) => {
            try {
                const { gameType, category } = req.params;
                const rankings = await this.getPositionRankings(gameType, category);
                res.json(rankings);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get character speedrun history
        this.app.get('/api/character/:tin/speedruns', async (req, res) => {
            try {
                const { tin } = req.params;
                const { gameType = null, category = null, limit = 50 } = req.query;
                
                const history = await this.getCharacterSpeedrunHistory(tin, gameType, category, parseInt(limit));
                res.json(history);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get records
        this.app.get('/api/records/:gameType/:category', async (req, res) => {
            try {
                const { gameType, category } = req.params;
                const records = await this.getRecords(gameType, category);
                res.json(records);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Live spectator dashboard
        this.app.get('/spectate', (req, res) => {
            res.sendFile(path.join(__dirname, 'speedrun-spectator.html'));
        });
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('👀 New spectator connected');
            this.liveSpectators.add(ws);
            
            // Send current active runs
            ws.send(JSON.stringify({
                type: 'activeRuns',
                data: Array.from(this.activeRuns.values())
            }));
            
            ws.on('close', () => {
                this.liveSpectators.delete(ws);
                console.log('👋 Spectator disconnected');
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'subscribe') {
                        ws.gameType = data.gameType;
                        ws.category = data.category;
                    }
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
        });
        
        console.log(`🔴 WebSocket server running on ws://localhost:${this.wsPort}`);
    }
    
    async startSpeedrun(tin, gameType, category) {
        // Validate character exists
        const character = await this.characterSystem.getCharacter(tin);
        if (!character) {
            throw new Error(`Character not found: ${tin}`);
        }
        
        // Validate game type and category
        const categoryKey = `${gameType}:${category}`;
        const categoryConfig = this.speedrunCategories.get(categoryKey);
        if (!categoryConfig) {
            throw new Error(`Invalid game type or category: ${gameType}/${category}`);
        }
        
        // Generate run ID
        const runId = this.generateRunId();
        
        // Determine join position
        const joinPosition = await this.getNextJoinPosition(gameType, category);
        
        // Create run session
        const runSession = {
            runId,
            tin,
            gameType,
            category,
            startedAt: Date.now(),
            status: 'active',
            joinPosition,
            currentPosition: joinPosition,
            checkpoints: [],
            events: [],
            deathCount: 0,
            pauseCount: 0
        };
        
        // Store in database
        await this.db.run(`
            INSERT INTO speedrun_sessions 
            (run_id, tin, game_type, category, started_at, join_position, current_position, checkpoints, events)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            runId,
            tin,
            gameType,
            category,
            runSession.startedAt,
            joinPosition,
            joinPosition,
            JSON.stringify([]),
            JSON.stringify([])
        ]);
        
        // Add to active runs
        this.activeRuns.set(runId, runSession);
        
        // Record in position rankings
        await this.recordPositionJoin(gameType, category, joinPosition, tin);
        
        // Broadcast to spectators
        this.broadcastToSpectators({
            type: 'speedrunStarted',
            data: runSession
        });
        
        this.emit('speedrunStarted', runSession);
        
        console.log(`🏃 Speedrun started: ${character.name} (${tin}) - ${gameType}/${category} at position ${joinPosition}`);
        
        return runSession;
    }
    
    async recordCheckpoint(runId, checkpointData) {
        const runSession = this.activeRuns.get(runId);
        if (!runSession) {
            throw new Error(`Active run not found: ${runId}`);
        }
        
        const { checkpoint, metrics = {}, timestamp = Date.now() } = checkpointData;
        
        const checkpointEntry = {
            checkpoint,
            timestamp,
            elapsedTime: timestamp - runSession.startedAt,
            metrics
        };
        
        runSession.checkpoints.push(checkpointEntry);
        
        // Update database
        await this.db.run(`
            UPDATE speedrun_sessions 
            SET checkpoints = ?
            WHERE run_id = ?
        `, [JSON.stringify(runSession.checkpoints), runId]);
        
        // Record real-time event
        await this.db.run(`
            INSERT INTO realtime_events (run_id, event_type, event_data, timestamp)
            VALUES (?, ?, ?, ?)
        `, [runId, 'checkpoint', JSON.stringify(checkpointEntry), timestamp]);
        
        // Broadcast to spectators
        this.broadcastToSpectators({
            type: 'checkpoint',
            data: {
                runId,
                checkpoint: checkpointEntry,
                runSession
            }
        });
        
        console.log(`📍 Checkpoint recorded: ${runId} - ${checkpoint} at ${checkpointEntry.elapsedTime}ms`);
    }
    
    async recordDeath(runId, deathData) {
        const runSession = this.activeRuns.get(runId);
        if (!runSession) {
            throw new Error(`Active run not found: ${runId}`);
        }
        
        const { cause, level = 1, location = 'unknown', timestamp = Date.now() } = deathData;
        
        runSession.deathCount++;
        
        const deathEvent = {
            cause,
            level,
            location,
            timestamp,
            elapsedTime: timestamp - runSession.startedAt,
            deathNumber: runSession.deathCount
        };
        
        runSession.events.push(deathEvent);
        
        // Update database
        await this.db.run(`
            UPDATE speedrun_sessions 
            SET death_count = ?, events = ?
            WHERE run_id = ?
        `, [runSession.deathCount, JSON.stringify(runSession.events), runId]);
        
        // Record in character identity system
        await this.characterSystem.recordDeath({
            tin: runSession.tin,
            gameType: runSession.gameType,
            cause,
            level,
            timeAlive: deathEvent.elapsedTime,
            location,
            runId
        });
        
        // Record real-time event
        await this.db.run(`
            INSERT INTO realtime_events (run_id, event_type, event_data, timestamp)
            VALUES (?, ?, ?, ?)
        `, [runId, 'death', JSON.stringify(deathEvent), timestamp]);
        
        // Broadcast to spectators
        this.broadcastToSpectators({
            type: 'death',
            data: {
                runId,
                death: deathEvent,
                runSession
            }
        });
        
        console.log(`💀 Death recorded: ${runId} - ${cause} (Death #${runSession.deathCount})`);
    }
    
    async completeSpeedrun(runId, completionData) {
        const runSession = this.activeRuns.get(runId);
        if (!runSession) {
            throw new Error(`Active run not found: ${runId}`);
        }
        
        const { finalTime = null, videoProof = null, verified = false } = completionData;
        const completedAt = Date.now();
        const totalTime = finalTime || (completedAt - runSession.startedAt);
        
        // Update run session
        runSession.status = 'completed';
        runSession.completedAt = completedAt;
        runSession.finalTime = totalTime;
        
        // Update database
        await this.db.run(`
            UPDATE speedrun_sessions 
            SET completed_at = ?, status = ?, final_time_ms = ?
            WHERE run_id = ?
        `, [completedAt, 'completed', totalTime, runId]);
        
        // Calculate final position based on time
        const finalPosition = await this.calculateFinalPosition(runSession.gameType, runSession.category, totalTime);
        
        // Add to leaderboard
        await this.db.run(`
            INSERT INTO leaderboard_entries 
            (tin, game_type, category, time_ms, position, join_position, run_id, completed_at, verified, video_proof)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            runSession.tin,
            runSession.gameType,
            runSession.category,
            totalTime,
            finalPosition,
            runSession.joinPosition,
            runId,
            completedAt,
            verified,
            videoProof
        ]);
        
        // Update position rankings
        await this.updatePositionRanking(runSession.gameType, runSession.category, runSession.joinPosition, runSession.tin, totalTime);
        
        // Award achievement
        await this.characterSystem.awardAchievement({
            tin: runSession.tin,
            achievementType: 'speedrun_completion',
            achievementName: `${runSession.gameType} ${runSession.category} Completion`,
            gameType: runSession.gameType,
            value: 1,
            metadata: {
                category: runSession.category,
                time: totalTime,
                position: finalPosition,
                deaths: runSession.deathCount
            }
        });
        
        // Check for records
        await this.checkForRecords(runSession, totalTime);
        
        // Remove from active runs
        this.activeRuns.delete(runId);
        
        // Clear leaderboard cache
        this.clearLeaderboardCache(runSession.gameType, runSession.category);
        
        // Broadcast completion
        this.broadcastToSpectators({
            type: 'speedrunCompleted',
            data: {
                runId,
                finalTime: totalTime,
                finalPosition,
                runSession
            }
        });
        
        const result = {
            runId,
            finalTime: totalTime,
            finalPosition,
            joinPosition: runSession.joinPosition,
            deathCount: runSession.deathCount,
            checkpoints: runSession.checkpoints.length,
            verified
        };
        
        this.emit('speedrunCompleted', result);
        
        console.log(`🏁 Speedrun completed: ${runId} - ${totalTime}ms (Position ${finalPosition})`);
        
        return result;
    }
    
    async getLeaderboard(gameType, category, limit = 100, position = null) {
        const cacheKey = `${gameType}:${category}:${limit}:${position || 'all'}`;
        
        // Check cache
        if (this.leaderboardCache.has(cacheKey)) {
            const cached = this.leaderboardCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 30000) { // 30 second cache
                return cached.data;
            }
        }
        
        let query = `
            SELECT 
                l.*, 
                c.name as character_name,
                r.total_score as reputation_score,
                r.rank_tier as reputation_tier,
                COUNT(l2.id) as total_runs,
                MIN(l2.time_ms) as personal_best
            FROM leaderboard_entries l
            LEFT JOIN characters c ON l.tin = c.tin
            LEFT JOIN reputation r ON l.tin = r.tin
            LEFT JOIN leaderboard_entries l2 ON l.tin = l2.tin AND l.game_type = l2.game_type AND l.category = l2.category
            WHERE l.game_type = ? AND l.category = ?
        `;
        
        const params = [gameType, category];
        
        if (position !== null) {
            query += ` AND l.join_position = ?`;
            params.push(position);
        }
        
        query += `
            GROUP BY l.id
            ORDER BY l.time_ms ASC
            LIMIT ?
        `;
        params.push(limit);
        
        const entries = await this.db.all(query, params);
        
        const leaderboard = {
            gameType,
            category,
            position,
            entries: entries.map((entry, index) => ({
                rank: index + 1,
                tin: entry.tin,
                characterName: entry.character_name,
                time: entry.time_ms,
                timeFormatted: this.formatTime(entry.time_ms),
                joinPosition: entry.join_position,
                completedAt: new Date(entry.completed_at),
                verified: !!entry.verified,
                reputationScore: entry.reputation_score || 50,
                reputationTier: entry.reputation_tier || 'bronze',
                totalRuns: entry.total_runs,
                personalBest: entry.personal_best,
                isPersonalBest: entry.time_ms === entry.personal_best
            })),
            metadata: {
                totalEntries: entries.length,
                fastestTime: entries.length > 0 ? entries[0].time_ms : null,
                fastestTimeFormatted: entries.length > 0 ? this.formatTime(entries[0].time_ms) : null,
                lastUpdated: new Date().toISOString()
            }
        };
        
        // Cache result
        this.leaderboardCache.set(cacheKey, {
            data: leaderboard,
            timestamp: Date.now()
        });
        
        return leaderboard;
    }
    
    async getPositionRankings(gameType, category) {
        const rankings = await this.db.all(`
            SELECT 
                position,
                tin,
                c.name as character_name,
                join_timestamp,
                current_ranking,
                best_time_ms,
                run_count
            FROM position_rankings pr
            LEFT JOIN characters c ON pr.tin = c.tin
            WHERE game_type = ? AND category = ?
            ORDER BY position ASC
        `, [gameType, category]);
        
        return rankings.map(ranking => ({
            position: ranking.position,
            tin: ranking.tin,
            characterName: ranking.character_name,
            joinedAt: new Date(ranking.join_timestamp),
            currentRanking: ranking.current_ranking,
            bestTime: ranking.best_time_ms,
            bestTimeFormatted: ranking.best_time_ms ? this.formatTime(ranking.best_time_ms) : null,
            runCount: ranking.run_count
        }));
    }
    
    async getNextJoinPosition(gameType, category) {
        const categoryKey = `${gameType}:${category}`;
        const categoryConfig = this.speedrunCategories.get(categoryKey);
        
        if (!categoryConfig) {
            throw new Error(`Category not found: ${categoryKey}`);
        }
        
        // Find the next available position
        const occupiedPositions = await this.db.all(`
            SELECT DISTINCT position 
            FROM position_rankings 
            WHERE game_type = ? AND category = ?
        `, [gameType, category]);
        
        const occupied = new Set(occupiedPositions.map(p => p.position));
        
        for (let position = 1; position <= categoryConfig.positionSlots; position++) {
            if (!occupied.has(position)) {
                return position;
            }
        }
        
        // If all positions are taken, find the least active position
        const leastActive = await this.db.get(`
            SELECT position 
            FROM position_rankings 
            WHERE game_type = ? AND category = ?
            ORDER BY join_timestamp ASC
            LIMIT 1
        `, [gameType, category]);
        
        return leastActive ? leastActive.position : 1;
    }
    
    async recordPositionJoin(gameType, category, position, tin) {
        await this.db.run(`
            INSERT OR REPLACE INTO position_rankings 
            (game_type, category, position, tin, join_timestamp, current_ranking, run_count)
            VALUES (?, ?, ?, ?, ?, 999, COALESCE((SELECT run_count FROM position_rankings WHERE game_type = ? AND category = ? AND position = ? AND tin = ?), 0) + 1)
        `, [gameType, category, position, tin, Date.now(), gameType, category, position, tin]);
    }
    
    async updatePositionRanking(gameType, category, position, tin, bestTime) {
        await this.db.run(`
            UPDATE position_rankings 
            SET best_time_ms = MIN(COALESCE(best_time_ms, ?), ?),
                current_ranking = (
                    SELECT COUNT(*) + 1 
                    FROM position_rankings pr2 
                    WHERE pr2.game_type = ? AND pr2.category = ? 
                    AND pr2.best_time_ms < ?
                )
            WHERE game_type = ? AND category = ? AND position = ? AND tin = ?
        `, [bestTime, bestTime, gameType, category, bestTime, gameType, category, position, tin]);
    }
    
    async calculateFinalPosition(gameType, category, time) {
        const betterTimes = await this.db.get(`
            SELECT COUNT(*) as count 
            FROM leaderboard_entries 
            WHERE game_type = ? AND category = ? AND time_ms < ?
        `, [gameType, category, time]);
        
        return (betterTimes.count || 0) + 1;
    }
    
    async checkForRecords(runSession, totalTime) {
        const records = [
            { type: 'fastest_time', value: totalTime },
            { type: 'no_death_run', value: runSession.deathCount === 0 ? 1 : 0 },
            { type: 'most_checkpoints', value: runSession.checkpoints.length }
        ];
        
        for (const record of records) {
            if (record.value <= 0 && record.type !== 'fastest_time') continue;
            
            const existingRecord = await this.db.get(`
                SELECT * FROM records 
                WHERE game_type = ? AND category = ? AND record_type = ?
                ORDER BY value ${record.type === 'fastest_time' ? 'ASC' : 'DESC'} 
                LIMIT 1
            `, [runSession.gameType, runSession.category, record.type]);
            
            const isNewRecord = !existingRecord || 
                (record.type === 'fastest_time' && record.value < existingRecord.value) ||
                (record.type !== 'fastest_time' && record.value > existingRecord.value);
            
            if (isNewRecord) {
                await this.db.run(`
                    INSERT INTO records (game_type, category, record_type, tin, value, achieved_at, run_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    runSession.gameType,
                    runSession.category,
                    record.type,
                    runSession.tin,
                    record.value,
                    Date.now(),
                    runSession.runId
                ]);
                
                // Award special achievement for record
                await this.characterSystem.awardAchievement({
                    tin: runSession.tin,
                    achievementType: 'world_record',
                    achievementName: `${record.type} World Record`,
                    gameType: runSession.gameType,
                    value: 100, // High value for records
                    metadata: {
                        recordType: record.type,
                        value: record.value,
                        category: runSession.category
                    }
                });
                
                console.log(`🏆 NEW RECORD: ${runSession.tin} set ${record.type} record with ${record.value}`);
                
                // Broadcast record achievement
                this.broadcastToSpectators({
                    type: 'newRecord',
                    data: {
                        tin: runSession.tin,
                        recordType: record.type,
                        value: record.value,
                        gameType: runSession.gameType,
                        category: runSession.category
                    }
                });
            }
        }
    }
    
    startRealTimeUpdates() {
        setInterval(() => {
            if (this.activeRuns.size > 0) {
                const updates = Array.from(this.activeRuns.values()).map(run => ({
                    runId: run.runId,
                    elapsedTime: Date.now() - run.startedAt,
                    checkpoints: run.checkpoints.length,
                    deaths: run.deathCount
                }));
                
                this.broadcastToSpectators({
                    type: 'realtimeUpdate',
                    data: updates
                });
            }
        }, this.updateInterval);
    }
    
    broadcastToSpectators(message) {
        const messageStr = JSON.stringify(message);
        
        this.liveSpectators.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                // Filter by subscription if set
                if (ws.gameType && message.data && message.data.gameType && ws.gameType !== message.data.gameType) {
                    return;
                }
                if (ws.category && message.data && message.data.category && ws.category !== message.data.category) {
                    return;
                }
                
                try {
                    ws.send(messageStr);
                } catch (error) {
                    console.error('WebSocket send error:', error);
                    this.liveSpectators.delete(ws);
                }
            } else {
                this.liveSpectators.delete(ws);
            }
        });
    }
    
    generateRunId() {
        return 'run-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    formatTime(timeMs) {
        const minutes = Math.floor(timeMs / 60000);
        const seconds = Math.floor((timeMs % 60000) / 1000);
        const milliseconds = timeMs % 1000;
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    
    clearLeaderboardCache(gameType, category) {
        const keysToDelete = [];
        for (const key of this.leaderboardCache.keys()) {
            if (key.startsWith(`${gameType}:${category}:`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.leaderboardCache.delete(key));
    }
    
    // Integration methods for adventure engine
    async createSpeedrunForAdventure(adventureId, characterTIN) {
        return await this.startSpeedrun(characterTIN, 'adventure-speedrun', 'click_master');
    }
    
    async createSpeedrunForChess(characterTIN, category = 'any_percent') {
        return await this.startSpeedrun(characterTIN, 'chess-speedrun', category);
    }
    
    async createSpeedrunForCivilization(characterTIN, category = 'population_1000') {
        return await this.startSpeedrun(characterTIN, 'civilization-speedrun', category);
    }
}

module.exports = { UniversalLeaderboard };

// Run if called directly
if (require.main === module) {
    // Mock character identity system for testing
    const mockCharacterSystem = {
        async getCharacter(tin) {
            return {
                tin,
                name: `Character_${tin.split('-')[1]}`,
                gameType: 'test'
            };
        },
        async recordDeath(deathData) {
            console.log('📊 Death recorded in character system:', deathData);
        },
        async awardAchievement(achievementData) {
            console.log('🏆 Achievement awarded in character system:', achievementData);
        }
    };
    
    const leaderboard = new UniversalLeaderboard(mockCharacterSystem);
    
    // Example usage after startup
    setTimeout(async () => {
        console.log('\n🧪 Running example speedrun...');
        
        try {
            // Start a speedrun
            const runSession = await leaderboard.startSpeedrun('TIN-TEST123', 'chess-speedrun', 'any_percent');
            console.log(`✅ Speedrun started: ${runSession.runId}`);
            
            // Record some checkpoints
            setTimeout(async () => {
                await leaderboard.recordCheckpoint(runSession.runId, {
                    checkpoint: 'opening',
                    metrics: { moves: 5 }
                });
                console.log('📍 Opening checkpoint recorded');
            }, 1000);
            
            setTimeout(async () => {
                await leaderboard.recordCheckpoint(runSession.runId, {
                    checkpoint: 'midgame',
                    metrics: { moves: 15 }
                });
                console.log('📍 Midgame checkpoint recorded');
            }, 2000);
            
            // Complete the speedrun
            setTimeout(async () => {
                const result = await leaderboard.completeSpeedrun(runSession.runId, {
                    finalTime: 45000 // 45 seconds
                });
                console.log(`🏁 Speedrun completed: Position ${result.finalPosition}`);
                
                // Get leaderboard
                const leaderboardData = await leaderboard.getLeaderboard('chess-speedrun', 'any_percent', 10);
                console.log('🏆 Current leaderboard:', leaderboardData.entries.slice(0, 3));
            }, 3000);
            
        } catch (error) {
            console.error('❌ Example speedrun failed:', error.message);
        }
    }, 2000);
}
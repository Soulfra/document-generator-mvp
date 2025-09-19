#!/usr/bin/env node

const express = require('express');
const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const net = require('net');
const path = require('path');
const fs = require('fs').promises;
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

// Import existing systems
const ColorCodedEducationSystem = require('./COLOR-CODED-EDUCATION-SYSTEM.js');
const MusicSystem = require('./MELODY-HARMONY-PROCESSOR.js');
const QuantumSegmentation = require('./context-memory-stream-manager.js');

class BulkDatabaseScanner {
    constructor() {
        this.app = express();
        this.port = 7778;
        this.databases = new Map();
        this.issues = new Map();
        this.fixes = new Map();
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        
        // Color coding for issues
        this.colors = {
            healthy: '#00FF00',
            warning: '#FFFF00',
            critical: '#FF0000',
            performance: '#800080',
            optimization: '#0000FF'
        };
        
        // Gaming entities
        this.entities = {
            bug: '👾',
            zombie: '🧟',
            ghost: '👻',
            powerup: '💊',
            star: '🌟',
            shield: '🛡️',
            sword: '⚔️',
            health: '❤️'
        };
        
        // Music patterns for issues
        this.musicPatterns = {
            schemaError: { chord: ['C', 'C#', 'G'], tempo: 120, dissonance: 0.8 },
            missingIndex: { chord: ['A', 'A', 'A'], tempo: 60, dissonance: 0.3 },
            foreignKeyViolation: { chord: ['E', 'G#', 'B', 'D'], tempo: 140, dissonance: 0.9 },
            successful: { chord: ['C', 'E', 'G', 'C'], tempo: 120, dissonance: 0 },
            optimization: { chord: ['F', 'A', 'C', 'E'], tempo: 100, dissonance: 0.1 }
        };
        
        // Initialize subsystems
        this.colorSystem = new ColorCodedEducationSystem();
        this.musicSystem = new MusicSystem();
        this.quantumSegmentation = new QuantumSegmentation();
        
        this.setupExpress();
        this.setupWebSocket();
    }
    
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.generateInterface());
        });
        
        // API endpoints
        this.app.post('/scan', this.handleScan.bind(this));
        this.app.post('/fix', this.handleFix.bind(this));
        this.app.get('/status', this.handleStatus.bind(this));
        this.app.post('/batch-fix', this.handleBatchFix.bind(this));
        this.app.get('/leaderboard', this.handleLeaderboard.bind(this));
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: 7779 });
        
        this.wss.on('connection', (ws) => {
            console.log('🎮 New player connected to Database Debugger Quest!');
            
            ws.on('message', async (message) => {
                const data = JSON.parse(message);
                await this.handleWebSocketMessage(ws, data);
            });
            
            // Send initial game state
            ws.send(JSON.stringify({
                type: 'gameState',
                score: this.score,
                level: this.level,
                combo: this.combo,
                entities: this.getCurrentEntities()
            }));
        });
    }
    
    async connectDatabases() {
        const connections = [];
        
        // PostgreSQL connection
        connections.push(this.connectPostgreSQL());
        
        // SQLite databases
        const sqliteDBs = [
            'debug_game.db',
            'ai_reasoning_game.db',
            'SOULFRA_BRAIN.db',
            'auth-foundation.db'
        ];
        
        for (const dbFile of sqliteDBs) {
            connections.push(this.connectSQLite(dbFile));
        }
        
        // Unix socket database
        connections.push(this.connectUnixSocket());
        
        // Connect to UnifiedDecisionDebugger
        connections.push(this.connectToDebugger());
        
        await Promise.all(connections);
        console.log('✅ All databases connected! Ready for debugging quest!');
    }
    
    async connectPostgreSQL() {
        try {
            const client = new Client({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'document_generator',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres'
            });
            
            await client.connect();
            this.databases.set('postgresql', { type: 'pg', client });
            console.log('🐘 PostgreSQL connected');
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error);
            this.addIssue('postgresql', 'connection', 'critical', error.message);
        }
    }
    
    async connectSQLite(filename) {
        return new Promise((resolve) => {
            const db = new sqlite3.Database(filename, (err) => {
                if (err) {
                    console.error(`❌ SQLite ${filename} connection failed:`, err);
                    this.addIssue(filename, 'connection', 'critical', err.message);
                    resolve();
                } else {
                    this.databases.set(filename, { type: 'sqlite', db });
                    console.log(`📚 SQLite ${filename} connected`);
                    resolve();
                }
            });
        });
    }
    
    async connectUnixSocket() {
        return new Promise((resolve) => {
            const client = net.createConnection('/tmp/unix-db', () => {
                console.log('🔌 Unix socket database connected');
                this.databases.set('unix-socket', { type: 'socket', client });
                resolve();
            });
            
            client.on('error', (err) => {
                console.error('❌ Unix socket connection failed:', err);
                this.addIssue('unix-socket', 'connection', 'warning', err.message);
                resolve();
            });
        });
    }
    
    async connectToDebugger() {
        return new Promise((resolve) => {
            const client = net.createConnection(7777, 'localhost', () => {
                console.log('🔗 Connected to UnifiedDecisionDebugger');
                this.databases.set('debugger', { type: 'tcp', client });
                resolve();
            });
            
            client.on('error', (err) => {
                console.error('❌ Debugger connection failed:', err);
                resolve();
            });
        });
    }
    
    async scanDatabase(dbName) {
        const db = this.databases.get(dbName);
        if (!db) return [];
        
        const issues = [];
        
        switch (db.type) {
            case 'pg':
                issues.push(...await this.scanPostgreSQL(dbName, db.client));
                break;
            case 'sqlite':
                issues.push(...await this.scanSQLite(dbName, db.db));
                break;
            case 'socket':
            case 'tcp':
                issues.push(...await this.scanSocket(dbName, db.client));
                break;
        }
        
        return issues;
    }
    
    async scanPostgreSQL(dbName, client) {
        const issues = [];
        
        try {
            // Check for missing indexes
            const missingIndexes = await client.query(`
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation
                FROM pg_stats
                WHERE schemaname = 'public'
                AND n_distinct > 100
                AND correlation < 0.1
                AND NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE tablename = pg_stats.tablename
                    AND indexdef LIKE '%' || attname || '%'
                )
            `);
            
            for (const row of missingIndexes.rows) {
                issues.push({
                    database: dbName,
                    table: row.tablename,
                    column: row.attname,
                    type: 'missing_index',
                    severity: 'warning',
                    entity: this.entities.zombie,
                    message: `Column ${row.attname} needs an index (${row.n_distinct} distinct values)`,
                    fix: `CREATE INDEX idx_${row.tablename}_${row.attname} ON ${row.tablename}(${row.attname});`
                });
            }
            
            // Check for foreign key violations
            const fkViolations = await client.query(`
                SELECT
                    conname AS constraint_name,
                    conrelid::regclass AS table_name,
                    a.attname AS column_name
                FROM pg_constraint c
                JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
                WHERE c.contype = 'f'
                AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint c2
                    WHERE c2.contype = 'p'
                    AND c2.conrelid = c.confrelid
                )
            `);
            
            for (const row of fkViolations.rows) {
                issues.push({
                    database: dbName,
                    table: row.table_name,
                    column: row.column_name,
                    type: 'foreign_key_violation',
                    severity: 'critical',
                    entity: this.entities.bug,
                    message: `Foreign key ${row.constraint_name} references non-existent primary key`,
                    fix: `-- Investigate and fix foreign key constraint ${row.constraint_name}`
                });
            }
            
            // Check for performance issues
            const slowQueries = await client.query(`
                SELECT 
                    query,
                    calls,
                    mean_exec_time,
                    stddev_exec_time
                FROM pg_stat_statements
                WHERE mean_exec_time > 1000
                ORDER BY mean_exec_time DESC
                LIMIT 10
            `).catch(() => ({ rows: [] })); // pg_stat_statements might not be enabled
            
            for (const row of slowQueries.rows) {
                issues.push({
                    database: dbName,
                    query: row.query.substring(0, 100) + '...',
                    type: 'slow_query',
                    severity: 'performance',
                    entity: this.entities.ghost,
                    message: `Slow query detected (${Math.round(row.mean_exec_time)}ms average)`,
                    fix: `-- Analyze and optimize query execution plan`
                });
            }
            
        } catch (error) {
            console.error('Error scanning PostgreSQL:', error);
        }
        
        return issues;
    }
    
    async scanSQLite(dbName, db) {
        const issues = [];
        
        return new Promise((resolve) => {
            // Get all tables
            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                if (err) {
                    resolve(issues);
                    return;
                }
                
                const tablePromises = tables.map(table => {
                    return new Promise((resolveTable) => {
                        // Check table structure
                        db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                            if (err) {
                                resolveTable();
                                return;
                            }
                            
                            // Check for missing primary key
                            const hasPrimaryKey = columns.some(col => col.pk > 0);
                            if (!hasPrimaryKey) {
                                issues.push({
                                    database: dbName,
                                    table: table.name,
                                    type: 'missing_primary_key',
                                    severity: 'warning',
                                    entity: this.entities.zombie,
                                    message: `Table ${table.name} has no primary key`,
                                    fix: `-- Add primary key to ${table.name}`
                                });
                            }
                            
                            // Check indexes
                            db.all(`PRAGMA index_list(${table.name})`, (err, indexes) => {
                                if (!err && indexes.length === 0 && columns.length > 3) {
                                    issues.push({
                                        database: dbName,
                                        table: table.name,
                                        type: 'no_indexes',
                                        severity: 'optimization',
                                        entity: this.entities.star,
                                        message: `Table ${table.name} could benefit from indexes`,
                                        fix: `-- Consider adding indexes to frequently queried columns`
                                    });
                                }
                                resolveTable();
                            });
                        });
                    });
                });
                
                Promise.all(tablePromises).then(() => resolve(issues));
            });
        });
    }
    
    async scanSocket(dbName, client) {
        const issues = [];
        
        // Send scan request through socket
        client.write(JSON.stringify({ action: 'scan', database: dbName }));
        
        return new Promise((resolve) => {
            client.once('data', (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    if (response.issues) {
                        issues.push(...response.issues.map(issue => ({
                            ...issue,
                            database: dbName,
                            entity: this.getEntityForIssue(issue.type)
                        })));
                    }
                } catch (error) {
                    console.error('Error parsing socket response:', error);
                }
                resolve(issues);
            });
            
            // Timeout after 5 seconds
            setTimeout(() => resolve(issues), 5000);
        });
    }
    
    getEntityForIssue(issueType) {
        const entityMap = {
            'missing_index': this.entities.zombie,
            'foreign_key_violation': this.entities.bug,
            'slow_query': this.entities.ghost,
            'missing_primary_key': this.entities.zombie,
            'no_indexes': this.entities.star,
            'connection': this.entities.bug
        };
        
        return entityMap[issueType] || this.entities.bug;
    }
    
    addIssue(database, type, severity, message) {
        const key = `${database}-${type}`;
        this.issues.set(key, {
            database,
            type,
            severity,
            message,
            entity: this.getEntityForIssue(type),
            timestamp: new Date()
        });
    }
    
    async handleScan(req, res) {
        const { databases = Array.from(this.databases.keys()) } = req.body;
        
        console.log('🔍 Starting database scan quest...');
        this.broadcastGameEvent('scan_started', { databases });
        
        const allIssues = [];
        
        for (const dbName of databases) {
            const issues = await this.scanDatabase(dbName);
            allIssues.push(...issues);
            
            // Update game state
            for (const issue of issues) {
                this.spawnEntity(issue);
                await this.playIssueSound(issue);
            }
        }
        
        // Store issues
        allIssues.forEach(issue => {
            const key = `${issue.database}-${issue.table || 'global'}-${issue.type}`;
            this.issues.set(key, issue);
        });
        
        console.log(`🎮 Scan complete! Found ${allIssues.length} entities to defeat!`);
        
        res.json({
            success: true,
            totalIssues: allIssues.length,
            issues: this.categorizeIssues(allIssues),
            gameState: {
                score: this.score,
                level: this.level,
                entities: this.getCurrentEntities()
            }
        });
    }
    
    categorizeIssues(issues) {
        const categorized = {
            critical: [],
            warning: [],
            performance: [],
            optimization: [],
            healthy: []
        };
        
        issues.forEach(issue => {
            if (categorized[issue.severity]) {
                categorized[issue.severity].push(issue);
            }
        });
        
        return categorized;
    }
    
    async handleFix(req, res) {
        const { issueKey, strategy = 'auto' } = req.body;
        const issue = this.issues.get(issueKey);
        
        if (!issue) {
            return res.json({ success: false, message: 'Issue not found' });
        }
        
        console.log(`⚔️ Attempting to defeat ${issue.entity} (${issue.type})...`);
        
        try {
            const result = await this.applyFix(issue, strategy);
            
            if (result.success) {
                // Update game state
                this.score += this.calculatePoints(issue);
                this.combo++;
                this.checkLevelUp();
                
                // Play victory sound
                await this.playSuccessSound();
                
                // Remove issue
                this.issues.delete(issueKey);
                
                // Broadcast victory
                this.broadcastGameEvent('entity_defeated', {
                    entity: issue.entity,
                    points: this.calculatePoints(issue),
                    combo: this.combo
                });
                
                console.log(`✅ ${issue.entity} defeated! +${this.calculatePoints(issue)} points!`);
            } else {
                this.combo = 0;
                console.log(`❌ Failed to defeat ${issue.entity}: ${result.error}`);
            }
            
            res.json({
                success: result.success,
                message: result.message,
                gameState: {
                    score: this.score,
                    level: this.level,
                    combo: this.combo
                }
            });
        } catch (error) {
            console.error('Fix failed:', error);
            res.json({
                success: false,
                message: error.message
            });
        }
    }
    
    async applyFix(issue, strategy) {
        const db = this.databases.get(issue.database);
        if (!db) {
            return { success: false, error: 'Database not connected' };
        }
        
        try {
            if (strategy === 'auto' && issue.fix) {
                // Apply automatic fix
                switch (db.type) {
                    case 'pg':
                        await db.client.query(issue.fix);
                        break;
                    case 'sqlite':
                        await new Promise((resolve, reject) => {
                            db.db.run(issue.fix, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                        break;
                    case 'socket':
                    case 'tcp':
                        db.client.write(JSON.stringify({
                            action: 'fix',
                            issue: issue,
                            fix: issue.fix
                        }));
                        break;
                }
                
                return { success: true, message: 'Fix applied successfully!' };
            } else {
                // Manual fix or custom strategy
                return await this.applyCustomFix(issue, strategy);
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async applyCustomFix(issue, strategy) {
        // Implement custom fix strategies
        switch (issue.type) {
            case 'missing_index':
                return await this.createOptimalIndex(issue);
            case 'foreign_key_violation':
                return await this.fixForeignKey(issue);
            case 'slow_query':
                return await this.optimizeQuery(issue);
            default:
                return { success: false, error: 'No custom fix available' };
        }
    }
    
    async createOptimalIndex(issue) {
        // AI-powered index creation
        const indexName = `idx_${issue.table}_${issue.column}_optimized`;
        const sql = `CREATE INDEX ${indexName} ON ${issue.table}(${issue.column})`;
        
        try {
            const db = this.databases.get(issue.database);
            if (db.type === 'pg') {
                await db.client.query(sql);
            }
            return { success: true, message: 'Optimal index created!' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleBatchFix(req, res) {
        const { severity, maxFixes = 10 } = req.body;
        
        console.log(`🎮 SUPER MOVE! Batch fixing ${severity} issues!`);
        this.broadcastGameEvent('super_move', { type: 'batch_fix', severity });
        
        const targetIssues = Array.from(this.issues.values())
            .filter(issue => !severity || issue.severity === severity)
            .slice(0, maxFixes);
        
        const results = [];
        let successCount = 0;
        
        for (const issue of targetIssues) {
            const key = `${issue.database}-${issue.table || 'global'}-${issue.type}`;
            const result = await this.applyFix(issue, 'auto');
            
            if (result.success) {
                successCount++;
                this.issues.delete(key);
                this.score += this.calculatePoints(issue) * 2; // Double points for batch fix
            }
            
            results.push({ issue, result });
        }
        
        // Epic combo bonus
        if (successCount > 5) {
            const bonus = successCount * 100;
            this.score += bonus;
            this.broadcastGameEvent('epic_combo', { 
                count: successCount, 
                bonus,
                achievement: 'Database Destroyer!'
            });
        }
        
        res.json({
            success: true,
            fixed: successCount,
            total: targetIssues.length,
            results,
            gameState: {
                score: this.score,
                level: this.level,
                newAchievement: successCount > 5 ? 'Database Destroyer!' : null
            }
        });
    }
    
    calculatePoints(issue) {
        const pointMap = {
            critical: 100,
            warning: 50,
            performance: 75,
            optimization: 25
        };
        
        const basePoints = pointMap[issue.severity] || 10;
        const comboMultiplier = Math.min(this.combo * 0.1 + 1, 3); // Max 3x multiplier
        
        return Math.round(basePoints * comboMultiplier);
    }
    
    checkLevelUp() {
        const requiredScore = this.level * 1000;
        if (this.score >= requiredScore) {
            this.level++;
            this.broadcastGameEvent('level_up', {
                newLevel: this.level,
                reward: this.getLevelReward(this.level)
            });
            console.log(`🎉 LEVEL UP! Now level ${this.level}!`);
        }
    }
    
    getLevelReward(level) {
        const rewards = [
            { level: 2, reward: 'Batch Fix Unlocked!', ability: 'batch_fix' },
            { level: 3, reward: 'AI Assistant Unlocked!', ability: 'ai_helper' },
            { level: 5, reward: 'Time Freeze Unlocked!', ability: 'pause_issues' },
            { level: 10, reward: 'Master Debugger Title!', ability: 'instant_fix' }
        ];
        
        return rewards.find(r => r.level === level) || { reward: 'Keep going!', ability: null };
    }
    
    async playIssueSound(issue) {
        const pattern = this.musicPatterns[issue.type] || this.musicPatterns.schemaError;
        
        // Use music system to play pattern
        if (this.musicSystem && this.musicSystem.playPattern) {
            await this.musicSystem.playPattern(pattern);
        }
        
        // Also send to connected clients
        this.broadcastGameEvent('sound', {
            type: 'issue',
            pattern,
            severity: issue.severity
        });
    }
    
    async playSuccessSound() {
        const pattern = this.musicPatterns.successful;
        
        if (this.musicSystem && this.musicSystem.playPattern) {
            await this.musicSystem.playPattern(pattern);
        }
        
        this.broadcastGameEvent('sound', {
            type: 'success',
            pattern
        });
    }
    
    spawnEntity(issue) {
        this.broadcastGameEvent('spawn_entity', {
            entity: issue.entity,
            position: this.getRandomPosition(),
            health: this.getEntityHealth(issue.severity),
            color: this.colors[issue.severity] || this.colors.warning
        });
    }
    
    getRandomPosition() {
        return {
            x: Math.random() * 800 + 100,
            y: Math.random() * 400 + 100
        };
    }
    
    getEntityHealth(severity) {
        const healthMap = {
            critical: 3,
            warning: 2,
            performance: 2,
            optimization: 1
        };
        
        return healthMap[severity] || 1;
    }
    
    getCurrentEntities() {
        return Array.from(this.issues.values()).map(issue => ({
            id: `${issue.database}-${issue.table || 'global'}-${issue.type}`,
            entity: issue.entity,
            position: this.getRandomPosition(),
            health: this.getEntityHealth(issue.severity),
            color: this.colors[issue.severity],
            database: issue.database,
            description: issue.message
        }));
    }
    
    handleStatus(req, res) {
        const status = {
            connected: this.databases.size,
            totalIssues: this.issues.size,
            issuesByType: this.getIssuesByType(),
            gameState: {
                score: this.score,
                level: this.level,
                combo: this.combo,
                abilities: this.getUnlockedAbilities()
            },
            databases: Array.from(this.databases.keys()).map(name => ({
                name,
                connected: true,
                issues: Array.from(this.issues.values()).filter(i => i.database === name).length
            }))
        };
        
        res.json(status);
    }
    
    getIssuesByType() {
        const types = {};
        
        this.issues.forEach(issue => {
            types[issue.type] = (types[issue.type] || 0) + 1;
        });
        
        return types;
    }
    
    getUnlockedAbilities() {
        const abilities = ['single_fix']; // Always available
        
        if (this.level >= 2) abilities.push('batch_fix');
        if (this.level >= 3) abilities.push('ai_helper');
        if (this.level >= 5) abilities.push('time_freeze');
        if (this.level >= 10) abilities.push('instant_fix');
        
        return abilities;
    }
    
    handleLeaderboard(req, res) {
        // In a real system, this would fetch from a database
        const leaderboard = [
            { player: 'DatabaseDestroyer', score: 15000, level: 12 },
            { player: 'SQLNinja', score: 12500, level: 10 },
            { player: 'QueryOptimizer', score: 10000, level: 8 },
            { player: 'You', score: this.score, level: this.level, current: true }
        ].sort((a, b) => b.score - a.score);
        
        res.json({ leaderboard });
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'attack':
                // Player attacking an entity
                const issue = this.issues.get(data.entityId);
                if (issue) {
                    const result = await this.applyFix(issue, 'auto');
                    ws.send(JSON.stringify({
                        type: 'attack_result',
                        success: result.success,
                        entityId: data.entityId,
                        points: result.success ? this.calculatePoints(issue) : 0
                    }));
                }
                break;
                
            case 'use_ability':
                // Player using special ability
                await this.handleAbility(ws, data.ability);
                break;
                
            case 'request_hint':
                // AI helper providing hints
                const hint = await this.generateHint(data.entityId);
                ws.send(JSON.stringify({
                    type: 'hint',
                    entityId: data.entityId,
                    hint
                }));
                break;
        }
    }
    
    async handleAbility(ws, ability) {
        switch (ability) {
            case 'time_freeze':
                // Pause new issues from spawning
                this.broadcastGameEvent('ability_used', {
                    ability: 'time_freeze',
                    duration: 30000 // 30 seconds
                });
                break;
                
            case 'ai_helper':
                // AI automatically fixes random issue
                const randomIssue = Array.from(this.issues.values())[
                    Math.floor(Math.random() * this.issues.size)
                ];
                if (randomIssue) {
                    await this.applyFix(randomIssue, 'auto');
                }
                break;
        }
    }
    
    async generateHint(entityId) {
        const issue = this.issues.get(entityId);
        if (!issue) return 'Entity not found';
        
        const hints = {
            missing_index: 'This zombie is slow! Create an index to speed it up.',
            foreign_key_violation: 'This bug broke a connection! Fix the foreign key.',
            slow_query: 'This ghost query haunts performance! Optimize it.',
            missing_primary_key: 'This zombie has no identity! Add a primary key.',
            no_indexes: 'This star shows optimization potential! Add strategic indexes.'
        };
        
        return hints[issue.type] || 'Attack to fix this issue!';
    }
    
    broadcastGameEvent(event, data) {
        const message = JSON.stringify({ type: event, ...data });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    generateInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Debugger Quest 🎮</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            color: #0f0;
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        
        #game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at center, #001a00 0%, #000 100%);
        }
        
        #game-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        #hud {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            pointer-events: none;
            z-index: 100;
        }
        
        .hud-section {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #0f0;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
        }
        
        .score {
            font-size: 24px;
            color: #0f0;
            text-shadow: 0 0 10px #0f0;
        }
        
        .level {
            font-size: 20px;
            color: #ff0;
            margin-top: 10px;
        }
        
        .combo {
            font-size: 18px;
            color: #f0f;
            margin-top: 5px;
        }
        
        .entity {
            position: absolute;
            font-size: 40px;
            cursor: crosshair;
            transition: all 0.3s ease;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        .entity:hover {
            transform: scale(1.2);
            filter: drop-shadow(0 0 20px currentColor);
        }
        
        .damage-text {
            position: absolute;
            font-size: 30px;
            font-weight: bold;
            pointer-events: none;
            animation: damage-float 1s ease-out forwards;
        }
        
        @keyframes damage-float {
            0% {
                opacity: 1;
                transform: translateY(0);
            }
            100% {
                opacity: 0;
                transform: translateY(-50px);
            }
        }
        
        #control-panel {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            z-index: 100;
        }
        
        .control-btn {
            background: rgba(0, 255, 0, 0.2);
            border: 2px solid #0f0;
            color: #0f0;
            padding: 15px 30px;
            font-size: 18px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s ease;
            font-family: 'Courier New', monospace;
        }
        
        .control-btn:hover {
            background: rgba(0, 255, 0, 0.4);
            box-shadow: 0 0 20px #0f0;
            transform: scale(1.05);
        }
        
        .control-btn:active {
            transform: scale(0.95);
        }
        
        .control-btn.ability {
            background: rgba(255, 0, 255, 0.2);
            border-color: #f0f;
            color: #f0f;
        }
        
        .control-btn.ability:hover {
            background: rgba(255, 0, 255, 0.4);
            box-shadow: 0 0 20px #f0f;
        }
        
        .control-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        #issue-details {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #0f0;
            padding: 20px;
            border-radius: 10px;
            max-width: 500px;
            display: none;
            z-index: 200;
        }
        
        .close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: #f00;
            font-size: 24px;
            cursor: pointer;
        }
        
        #particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #0f0;
            border-radius: 50%;
            animation: particle-float 5s linear infinite;
        }
        
        @keyframes particle-float {
            0% {
                opacity: 0;
                transform: translateY(100vh) scale(0);
            }
            10% {
                opacity: 1;
                transform: translateY(90vh) scale(1);
            }
            90% {
                opacity: 1;
                transform: translateY(10vh) scale(1);
            }
            100% {
                opacity: 0;
                transform: translateY(0) scale(0);
            }
        }
        
        .achievement {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ff0, #f0f);
            color: #000;
            padding: 30px 50px;
            font-size: 36px;
            font-weight: bold;
            border-radius: 20px;
            box-shadow: 0 0 50px rgba(255, 255, 0, 0.8);
            animation: achievement-pop 2s ease-out forwards;
            z-index: 300;
        }
        
        @keyframes achievement-pop {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0) rotate(360deg);
            }
            50% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(1) rotate(0deg);
            }
        }
        
        .health-bar {
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 5px;
            background: rgba(255, 0, 0, 0.3);
            border: 1px solid #f00;
        }
        
        .health-fill {
            height: 100%;
            background: #f00;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        <div id="particles"></div>
        
        <div id="hud">
            <div class="hud-section">
                <div class="score">Score: <span id="score">0</span></div>
                <div class="level">Level: <span id="level">1</span></div>
                <div class="combo">Combo: <span id="combo">0</span>x</div>
            </div>
            
            <div class="hud-section">
                <div style="color: #fff;">Database Health</div>
                <div style="margin-top: 10px;">
                    <span style="color: #00ff00;">●</span> Healthy: <span id="healthy">0</span><br>
                    <span style="color: #ffff00;">●</span> Warning: <span id="warning">0</span><br>
                    <span style="color: #ff0000;">●</span> Critical: <span id="critical">0</span><br>
                    <span style="color: #800080;">●</span> Performance: <span id="performance">0</span><br>
                    <span style="color: #0000ff;">●</span> Optimization: <span id="optimization">0</span>
                </div>
            </div>
        </div>
        
        <div id="control-panel">
            <button class="control-btn" onclick="scanDatabases()">🔍 Scan All</button>
            <button class="control-btn" onclick="batchFix()">⚔️ Batch Fix</button>
            <button class="control-btn ability" onclick="useAbility('ai_helper')" id="ai-helper" disabled>🤖 AI Helper</button>
            <button class="control-btn ability" onclick="useAbility('time_freeze')" id="time-freeze" disabled>⏱️ Time Freeze</button>
        </div>
        
        <div id="issue-details">
            <button class="close-btn" onclick="closeDetails()">×</button>
            <h3 id="issue-title"></h3>
            <p id="issue-description"></p>
            <pre id="issue-fix"></pre>
            <button class="control-btn" onclick="fixIssue()">Fix Issue</button>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:7779');
        const entities = new Map();
        let selectedEntity = null;
        let gameState = { score: 0, level: 1, combo: 0 };
        let audioContext = null;
        
        // Initialize audio context
        document.addEventListener('click', () => {
            if (!audioContext) {
                audioContext = new AudioContext();
            }
        }, { once: true });
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleGameEvent(data);
        };
        
        function handleGameEvent(data) {
            switch (data.type) {
                case 'gameState':
                    updateGameState(data);
                    break;
                case 'spawn_entity':
                    spawnEntity(data);
                    break;
                case 'entity_defeated':
                    removeEntity(data.entityId);
                    showDamage(data.points, data.position);
                    break;
                case 'sound':
                    playSound(data.pattern);
                    break;
                case 'achievement':
                    showAchievement(data.achievement);
                    break;
                case 'level_up':
                    handleLevelUp(data);
                    break;
            }
        }
        
        function updateGameState(state) {
            gameState = { ...gameState, ...state };
            document.getElementById('score').textContent = gameState.score;
            document.getElementById('level').textContent = gameState.level;
            document.getElementById('combo').textContent = gameState.combo;
            
            // Update abilities
            if (gameState.level >= 3) {
                document.getElementById('ai-helper').disabled = false;
            }
            if (gameState.level >= 5) {
                document.getElementById('time-freeze').disabled = false;
            }
            
            // Spawn initial entities
            if (state.entities) {
                state.entities.forEach(entity => spawnEntity(entity));
            }
        }
        
        function spawnEntity(data) {
            const entity = document.createElement('div');
            entity.className = 'entity';
            entity.id = 'entity-' + data.id;
            entity.innerHTML = data.entity;
            entity.style.left = data.position.x + 'px';
            entity.style.top = data.position.y + 'px';
            entity.style.color = data.color;
            entity.dataset.entityData = JSON.stringify(data);
            
            // Add health bar
            const healthBar = document.createElement('div');
            healthBar.className = 'health-bar';
            const healthFill = document.createElement('div');
            healthFill.className = 'health-fill';
            healthFill.style.width = '100%';
            healthBar.appendChild(healthFill);
            entity.appendChild(healthBar);
            
            entity.onclick = () => attackEntity(data);
            
            document.getElementById('game-container').appendChild(entity);
            entities.set(data.id, data);
            
            updateIssueCount();
        }
        
        function attackEntity(entityData) {
            selectedEntity = entityData;
            document.getElementById('issue-title').textContent = entityData.entity + ' - ' + entityData.database;
            document.getElementById('issue-description').textContent = entityData.description;
            document.getElementById('issue-fix').textContent = entityData.fix || 'Automatic fix available';
            document.getElementById('issue-details').style.display = 'block';
        }
        
        function closeDetails() {
            document.getElementById('issue-details').style.display = 'none';
            selectedEntity = null;
        }
        
        function fixIssue() {
            if (!selectedEntity) return;
            
            fetch('/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ issueKey: selectedEntity.id })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    removeEntity(selectedEntity.id);
                    showDamage(data.points || 100, {
                        x: parseFloat(document.getElementById('entity-' + selectedEntity.id).style.left),
                        y: parseFloat(document.getElementById('entity-' + selectedEntity.id).style.top)
                    });
                    updateGameState(data.gameState);
                }
                closeDetails();
            });
        }
        
        function removeEntity(entityId) {
            const element = document.getElementById('entity-' + entityId);
            if (element) {
                // Explosion effect
                element.style.transform = 'scale(2) rotate(720deg)';
                element.style.opacity = '0';
                setTimeout(() => element.remove(), 500);
            }
            entities.delete(entityId);
            updateIssueCount();
        }
        
        function showDamage(points, position) {
            const damage = document.createElement('div');
            damage.className = 'damage-text';
            damage.textContent = '+' + points;
            damage.style.left = position.x + 'px';
            damage.style.top = position.y + 'px';
            damage.style.color = '#ff0';
            
            document.getElementById('game-container').appendChild(damage);
            setTimeout(() => damage.remove(), 1000);
        }
        
        function updateIssueCount() {
            const counts = {
                healthy: 0,
                warning: 0,
                critical: 0,
                performance: 0,
                optimization: 0
            };
            
            entities.forEach(entity => {
                if (counts[entity.severity] !== undefined) {
                    counts[entity.severity]++;
                }
            });
            
            Object.keys(counts).forEach(key => {
                document.getElementById(key).textContent = counts[key];
            });
        }
        
        async function scanDatabases() {
            const response = await fetch('/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            
            const data = await response.json();
            if (data.success) {
                console.log('Scan complete:', data);
            }
        }
        
        async function batchFix() {
            const response = await fetch('/batch-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ maxFixes: 5 })
            });
            
            const data = await response.json();
            if (data.newAchievement) {
                showAchievement(data.newAchievement);
            }
        }
        
        function useAbility(ability) {
            ws.send(JSON.stringify({ type: 'use_ability', ability }));
            
            // Disable button temporarily
            const btn = document.getElementById(ability.replace('_', '-'));
            btn.disabled = true;
            setTimeout(() => btn.disabled = false, 30000); // 30 second cooldown
        }
        
        function showAchievement(text) {
            const achievement = document.createElement('div');
            achievement.className = 'achievement';
            achievement.textContent = text;
            document.body.appendChild(achievement);
            
            setTimeout(() => achievement.remove(), 2000);
        }
        
        function handleLevelUp(data) {
            showAchievement('LEVEL UP! ' + data.reward);
            
            // Unlock new abilities
            if (data.newLevel >= 3) {
                document.getElementById('ai-helper').disabled = false;
            }
            if (data.newLevel >= 5) {
                document.getElementById('time-freeze').disabled = false;
            }
        }
        
        function playSound(pattern) {
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Map notes to frequencies
            const noteFreq = {
                'C': 261.63,
                'C#': 277.18,
                'D': 293.66,
                'E': 329.63,
                'F': 349.23,
                'G': 392.00,
                'G#': 415.30,
                'A': 440.00,
                'B': 493.88
            };
            
            // Play chord
            pattern.chord.forEach((note, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    
                    osc.frequency.value = noteFreq[note] || 440;
                    osc.type = pattern.dissonance > 0.5 ? 'sawtooth' : 'sine';
                    
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    
                    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.5);
                }, i * 100);
            });
        }
        
        // Create floating particles
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 5 + 's';
                particle.style.animationDuration = (5 + Math.random() * 5) + 's';
                particlesContainer.appendChild(particle);
            }
        }
        
        // Initialize
        createParticles();
        scanDatabases(); // Auto-scan on load
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        await this.connectDatabases();
        
        this.app.listen(this.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║           🎮 DATABASE DEBUGGER QUEST ONLINE! 🎮            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Web Interface: http://localhost:${this.port}                    ║
║  WebSocket: ws://localhost:7779                            ║
║                                                            ║
║  Controls:                                                 ║
║  - Click entities to attack database issues                ║
║  - Use abilities to boost your debugging power             ║
║  - Achieve high scores by fixing issues quickly            ║
║                                                            ║
║  Entity Types:                                             ║
║  👾 Bugs = Schema errors                                   ║
║  🧟 Zombies = Missing indexes                              ║
║  👻 Ghosts = Performance issues                            ║
║  💊 Power-ups = Quick fixes                                ║
║  🌟 Stars = Optimization opportunities                     ║
║                                                            ║
║  Ready to debug? Press [SCAN ALL] to begin!               ║
╚════════════════════════════════════════════════════════════╝
            `);
        });
    }
}

// Start the scanner
const scanner = new BulkDatabaseScanner();
scanner.start().catch(console.error);

// Export for testing
module.exports = BulkDatabaseScanner;
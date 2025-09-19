#!/usr/bin/env node

/**
 * TREASURE HUNTER API
 * Public treasure discovery system that works without exposing API keys
 * Preserves gamification while maintaining security
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class TreasureHunterAPI {
    constructor() {
        this.app = express();
        this.port = process.env.TREASURE_PORT || 3005;
        
        // Public treasure data (no API keys needed)
        this.treasureMap = new Map();
        this.pirateRankings = new Map();
        this.calCookieBank = new Map();
        this.bountyBoard = new Map();
        
        // Encoding patterns for treasure discovery
        this.encodingPatterns = {
            blue_escapes: /hasBlue.*true/g,
            context_profiles: /context-profile.*environment/g,
            treasure_markers: /treasure.*location/g,
            pirate_commands: /pirate.*command/g,
            cal_cookies: /cal.*cookie|cookie.*monster/g
        };
        
        this.setupMiddleware();
        this.setupTreasureRoutes();
        this.initializeTreasureMap();
        
        console.log('🏴‍☠️ TREASURE HUNTER API STARTING');
        console.log('==================================');
        console.log('🗺️  Public treasure discovery enabled');
        console.log('🍪 Cal Cookie rewards active');
        console.log('🏆 Pirate rankings system ready');
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupTreasureRoutes() {
        // Public treasure discovery (no auth required)
        this.app.get('/api/treasure/discover', this.discoverTreasure.bind(this));
        this.app.get('/api/treasure/map', this.getTreasureMap.bind(this));
        this.app.post('/api/treasure/claim/:treasureId', this.claimTreasure.bind(this));
        
        // Cal Cookie Monster rewards
        this.app.post('/api/cal/login-reward', this.awardLoginCookie.bind(this));
        this.app.get('/api/cal/cookies/:userId', this.getCalCookies.bind(this));
        this.app.post('/api/cal/spend-cookies', this.spendCalCookies.bind(this));
        
        // Pirate ranking system
        this.app.get('/api/pirates/rankings', this.getPirateRankings.bind(this));
        this.app.post('/api/pirates/report-bounty', this.reportBounty.bind(this));
        
        // Encoding pathway discovery
        this.app.post('/api/pathways/scan', this.scanForPathways.bind(this));
        this.app.get('/api/pathways/context/:contextId', this.getContextProfile.bind(this));
        
        // Bounty board
        this.app.get('/api/bounties/active', this.getActiveBounties.bind(this));
        this.app.post('/api/bounties/submit', this.submitBountyProof.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ready', 
                treasures: this.treasureMap.size,
                pirates: this.pirateRankings.size,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    async initializeTreasureMap() {
        console.log('🗺️  Initializing treasure map...');
        
        // Scan project files for treasure patterns
        await this.scanProjectForTreasures();
        
        // Initialize bounty board
        this.initializeBountyBoard();
        
        console.log(`✅ Found ${this.treasureMap.size} treasures`);
        console.log(`📋 ${this.bountyBoard.size} active bounties`);
    }
    
    async scanProjectForTreasures() {
        const treasureFiles = [
            'export-treasure.js',
            'ENCODING-DECODING-WORKFLOW.md', 
            'FinishThisIdea/pirate-media-command-system.js',
            'dialog-game-interface.html',
            'music-knot-web.js',
            'creative-tools-integration.js'
        ];
        
        for (const file of treasureFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const treasures = this.findTreasuresInContent(content, file);
                
                treasures.forEach(treasure => {
                    this.treasureMap.set(treasure.id, treasure);
                });
            } catch (error) {
                console.log(`⚠️  Could not scan ${file}: ${error.message}`);
            }
        }
        
        // Add hardcoded treasures for demo mode
        this.addDemoTreasures();
    }
    
    findTreasuresInContent(content, filename) {
        const treasures = [];
        
        Object.entries(this.encodingPatterns).forEach(([type, pattern]) => {
            const matches = [...content.matchAll(pattern)];
            
            matches.forEach((match, index) => {
                const treasureId = crypto.createHash('md5')
                    .update(`${filename}-${type}-${index}`)
                    .digest('hex')
                    .substring(0, 8);
                
                treasures.push({
                    id: treasureId,
                    type: type,
                    location: filename,
                    pattern: match[0],
                    reward: this.calculateReward(type),
                    discovered: false,
                    claimable: true
                });
            });
        });
        
        return treasures;
    }
    
    addDemoTreasures() {
        // Special treasures for the Music Knot Framework
        this.treasureMap.set('knot001', {
            id: 'knot001',
            type: 'music_knot',
            location: 'music-knot-web.js',
            pattern: 'JavaScript → Trefoil knot (Lydian mode)',
            reward: 50,
            discovered: false,
            claimable: true,
            description: 'Discovered the JavaScript trefoil knot musical mapping!'
        });
        
        this.treasureMap.set('dial001', {
            id: 'dial001', 
            type: 'dialog_treasure',
            location: 'dialog-game-interface.html',
            pattern: 'Phone mirror split-screen interface',
            reward: 75,
            discovered: false,
            claimable: true,
            description: 'Found the secret dialog phone mirror game!'
        });
        
        this.treasureMap.set('cal001', {
            id: 'cal001',
            type: 'cal_cookie',
            location: 'soulfra-auth-server.js',
            pattern: 'Cal Cookie Monster authentication rewards',
            reward: 25,
            discovered: false,
            claimable: true,
            description: 'Discovered Cal\'s cookie reward system!'
        });
    }
    
    calculateReward(treasureType) {
        const rewards = {
            blue_escapes: 100,
            context_profiles: 75,
            treasure_markers: 50,
            pirate_commands: 60,
            cal_cookies: 25,
            music_knot: 80,
            dialog_treasure: 90
        };
        
        return rewards[treasureType] || 10;
    }
    
    initializeBountyBoard() {
        this.bountyBoard.set('encode001', {
            id: 'encode001',
            title: 'Find Hidden Encoding Pathways',
            description: 'Discover at least 3 context profile patterns in different files',
            reward: 200,
            type: 'discovery',
            requirements: {
                min_treasures: 3,
                treasure_types: ['context_profiles']
            },
            active: true
        });
        
        this.bountyBoard.set('music001', {
            id: 'music001', 
            title: 'Master the Music Knot Framework',
            description: 'Successfully generate music from all 5 knot types',
            reward: 500,
            type: 'interaction',
            requirements: {
                knot_types: ['trefoil', 'figure-eight', 'square', 'unknot', 'torus']
            },
            active: true
        });
        
        this.bountyBoard.set('pirate001', {
            id: 'pirate001',
            title: 'Navigate the Pirate Command System', 
            description: 'Successfully tune into 3 different Den Den Mushi channels',
            reward: 150,
            type: 'exploration',
            requirements: {
                channels: ['grand-line-news', 'marine-broadcast', 'pirate-radio']
            },
            active: true
        });
    }
    
    // Route handlers
    async discoverTreasure(req, res) {
        const { pattern, location } = req.query;
        const userId = req.headers['x-user-id'] || 'anonymous';
        
        try {
            let foundTreasures = [];
            
            if (pattern && location) {
                // Specific treasure search
                foundTreasures = Array.from(this.treasureMap.values())
                    .filter(t => 
                        t.location.includes(location) && 
                        t.pattern.toLowerCase().includes(pattern.toLowerCase()) &&
                        !t.discovered
                    );
            } else {
                // Random discovery
                const unDiscovered = Array.from(this.treasureMap.values())
                    .filter(t => !t.discovered);
                
                if (unDiscovered.length > 0) {
                    const randomIndex = Math.floor(Math.random() * unDiscovered.length);
                    foundTreasures = [unDiscovered[randomIndex]];
                }
            }
            
            // Mark as discovered by this user
            foundTreasures.forEach(treasure => {
                treasure.discovered = true;
                treasure.discoveredBy = userId;
                treasure.discoveredAt = new Date().toISOString();
            });
            
            res.json({
                success: true,
                treasures: foundTreasures,
                message: foundTreasures.length > 0 ? 
                    `🏴‍☠️ Ahoy! Found ${foundTreasures.length} treasure(s)!` :
                    '🗺️ No new treasures found. Keep searching!'
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async getTreasureMap(req, res) {
        const userId = req.headers['x-user-id'] || 'anonymous';
        
        const treasures = Array.from(this.treasureMap.values())
            .map(treasure => ({
                id: treasure.id,
                type: treasure.type,
                location: treasure.location,
                reward: treasure.reward,
                discovered: treasure.discovered,
                claimable: treasure.claimable && treasure.discoveredBy === userId,
                description: treasure.description || 'Mystery treasure awaits...'
            }));
        
        res.json({
            success: true,
            treasures,
            total: treasures.length,
            discovered: treasures.filter(t => t.discovered).length
        });
    }
    
    async claimTreasure(req, res) {
        const { treasureId } = req.params;
        const userId = req.headers['x-user-id'] || 'anonymous';
        
        const treasure = this.treasureMap.get(treasureId);
        
        if (!treasure) {
            return res.status(404).json({
                success: false,
                error: 'Treasure not found'
            });
        }
        
        if (!treasure.claimable || treasure.discoveredBy !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Treasure not claimable by this user'
            });
        }
        
        // Award the reward
        treasure.claimable = false;
        treasure.claimedAt = new Date().toISOString();
        
        // Update pirate ranking
        this.updatePirateRanking(userId, treasure.reward);
        
        res.json({
            success: true,
            treasure,
            reward: treasure.reward,
            message: `🏆 Claimed ${treasure.reward} tokens for finding ${treasure.type}!`
        });
    }
    
    async awardLoginCookie(req, res) {
        const { userId, provider } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID required'
            });
        }
        
        // Cal Cookie Monster rewards
        const cookieRewards = {
            'github': 10,
            'linkedin': 15,
            'google': 8,
            'anonymous': 5
        };
        
        const cookieAmount = cookieRewards[provider] || 5;
        
        // Award cookies
        const currentCookies = this.calCookieBank.get(userId) || 0;
        this.calCookieBank.set(userId, currentCookies + cookieAmount);
        
        res.json({
            success: true,
            cookiesEarned: cookieAmount,
            totalCookies: currentCookies + cookieAmount,
            message: `🍪 Cal awarded you ${cookieAmount} cookies for logging in with ${provider}!`
        });
    }
    
    async getCalCookies(req, res) {
        const { userId } = req.params;
        const cookies = this.calCookieBank.get(userId) || 0;
        
        res.json({
            success: true,
            userId,
            cookies,
            canSpend: cookies > 0
        });
    }
    
    async spendCalCookies(req, res) {
        const { userId, amount, purpose } = req.body;
        const currentCookies = this.calCookieBank.get(userId) || 0;
        
        if (currentCookies < amount) {
            return res.status(400).json({
                success: false,
                error: 'Not enough cookies'
            });
        }
        
        this.calCookieBank.set(userId, currentCookies - amount);
        
        res.json({
            success: true,
            spent: amount,
            remaining: currentCookies - amount,
            purpose,
            message: `🍪 Spent ${amount} cookies on ${purpose}`
        });
    }
    
    updatePirateRanking(userId, points) {
        const current = this.pirateRankings.get(userId) || {
            userId,
            points: 0,
            rank: 'Cabin Boy',
            treasuresFound: 0,
            joinedAt: new Date().toISOString()
        };
        
        current.points += points;
        current.treasuresFound += 1;
        current.rank = this.calculatePirateRank(current.points);
        current.lastActivity = new Date().toISOString();
        
        this.pirateRankings.set(userId, current);
        
        console.log(`🏴‍☠️ ${userId} earned ${points} points (total: ${current.points}) - ${current.rank}`);
    }
    
    calculatePirateRank(points) {
        if (points >= 1000) return 'Pirate King';
        if (points >= 500) return 'Captain';
        if (points >= 200) return 'First Mate';
        if (points >= 100) return 'Navigator';
        if (points >= 50) return 'Pirate';
        return 'Cabin Boy';
    }
    
    async getPirateRankings(req, res) {
        const rankings = Array.from(this.pirateRankings.values())
            .sort((a, b) => b.points - a.points)
            .slice(0, 50); // Top 50 pirates
        
        res.json({
            success: true,
            rankings,
            totalPirates: this.pirateRankings.size
        });
    }
    
    async getActiveBounties(req, res) {
        const bounties = Array.from(this.bountyBoard.values())
            .filter(b => b.active);
        
        res.json({
            success: true,
            bounties
        });
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`🏴‍☠️ Treasure Hunter API running on port ${this.port}`);
            console.log(`🗺️  Treasure map: http://localhost:${this.port}/api/treasure/map`);
            console.log(`🍪 Cal cookies: http://localhost:${this.port}/api/cal/cookies/[userId]`);
            console.log(`🏆 Rankings: http://localhost:${this.port}/api/pirates/rankings`);
        });
    }
}

// Start the server if run directly
if (require.main === module) {
    const treasureAPI = new TreasureHunterAPI();
    treasureAPI.start();
}

module.exports = TreasureHunterAPI;
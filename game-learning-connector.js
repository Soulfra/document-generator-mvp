#!/usr/bin/env node

/**
 * 🎮🧠 GAME LEARNING CONNECTOR
 * Connects game actions to actual service learning
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

class GameLearningConnector {
    constructor() {
        this.port = 5555;
        this.app = express();
        this.learningData = {
            actions: [],
            intelligence: 0.1,
            patterns: new Map(),
            npcs: new Map()
        };
        
        // Initialize NPCs
        const npcTypes = ['RoboHelper', 'WizardAI', 'SuperDoc', 'BearBot', 'UniAI', 'DragonBrain'];
        npcTypes.forEach(npc => {
            this.learningData.npcs.set(npc, {
                intelligence: 0.1,
                actions: 0,
                lastAction: null
            });
        });
        
        console.log('🎮🧠 GAME LEARNING CONNECTOR');
        console.log('================================');
        console.log('Bridging game actions to real learning...');
        
        this.init();
    }
    
    async init() {
        // Middleware
        this.app.use(cors());
        this.app.use(express.json());
        
        // Routes
        this.setupRoutes();
        
        // Start server
        this.app.listen(this.port, () => {
            console.log(`✅ Learning Connector running on port ${this.port}`);
            console.log('🎮 Ready to receive game actions!');
        });
        
        // Load existing learning data
        await this.loadLearningData();
    }
    
    setupRoutes() {
        // Record game action
        this.app.post('/api/game-action', async (req, res) => {
            const { action, npc, data } = req.body;
            
            // Record action
            const actionRecord = {
                action,
                npc,
                data,
                timestamp: Date.now(),
                services: await this.checkServices()
            };
            
            this.learningData.actions.push(actionRecord);
            
            // Update NPC data
            if (npc && this.learningData.npcs.has(npc)) {
                const npcData = this.learningData.npcs.get(npc);
                npcData.actions++;
                npcData.lastAction = action;
                npcData.intelligence = Math.min(1, npcData.intelligence + 0.01);
            }
            
            // Detect patterns
            this.detectPatterns(action);
            
            // Calculate global intelligence
            this.updateIntelligence();
            
            // Save data
            await this.saveLearningData();
            
            res.json({
                success: true,
                intelligence: this.learningData.intelligence,
                patterns: this.learningData.patterns.size,
                totalActions: this.learningData.actions.length
            });
        });
        
        // Get learning status
        this.app.get('/api/learning-status', (req, res) => {
            const npcStats = {};
            this.learningData.npcs.forEach((data, name) => {
                npcStats[name] = data;
            });
            
            res.json({
                intelligence: this.learningData.intelligence,
                totalActions: this.learningData.actions.length,
                patterns: Array.from(this.learningData.patterns.keys()),
                npcs: npcStats,
                recentActions: this.learningData.actions.slice(-10)
            });
        });
        
        // Get pattern analysis
        this.app.get('/api/patterns', (req, res) => {
            const patterns = {};
            this.learningData.patterns.forEach((count, pattern) => {
                patterns[pattern] = count;
            });
            
            res.json({
                patterns,
                insights: this.generateInsights()
            });
        });
        
        // Train specific NPC
        this.app.post('/api/train-npc', async (req, res) => {
            const { npc, skill } = req.body;
            
            if (this.learningData.npcs.has(npc)) {
                const npcData = this.learningData.npcs.get(npc);
                npcData.intelligence = Math.min(1, npcData.intelligence + 0.05);
                npcData[`skill_${skill}`] = (npcData[`skill_${skill}`] || 0) + 1;
                
                await this.saveLearningData();
                
                res.json({
                    success: true,
                    npc,
                    intelligence: npcData.intelligence
                });
            } else {
                res.json({ success: false, error: 'NPC not found' });
            }
        });
    }
    
    detectPatterns(action) {
        // Simple pattern detection
        const patterns = [
            'rapid_clicking',
            'sequential_actions',
            'focused_training',
            'exploration'
        ];
        
        // Count action frequency
        const currentCount = this.learningData.patterns.get(action) || 0;
        this.learningData.patterns.set(action, currentCount + 1);
        
        // Detect rapid clicking
        const recentActions = this.learningData.actions.slice(-5);
        if (recentActions.length === 5) {
            const timeDiff = recentActions[4].timestamp - recentActions[0].timestamp;
            if (timeDiff < 2000) { // 5 actions in 2 seconds
                this.learningData.patterns.set('rapid_clicking', 
                    (this.learningData.patterns.get('rapid_clicking') || 0) + 1);
            }
        }
    }
    
    updateIntelligence() {
        // Calculate intelligence based on various factors
        const factors = {
            actions: Math.min(1, this.learningData.actions.length / 1000),
            patterns: Math.min(1, this.learningData.patterns.size / 20),
            npcDiversity: this.calculateNPCDiversity(),
            consistency: this.calculateConsistency()
        };
        
        // Weighted average
        this.learningData.intelligence = 
            factors.actions * 0.2 +
            factors.patterns * 0.3 +
            factors.npcDiversity * 0.3 +
            factors.consistency * 0.2;
    }
    
    calculateNPCDiversity() {
        let activeNPCs = 0;
        this.learningData.npcs.forEach(npc => {
            if (npc.actions > 0) activeNPCs++;
        });
        return activeNPCs / this.learningData.npcs.size;
    }
    
    calculateConsistency() {
        if (this.learningData.actions.length < 10) return 0;
        
        // Check how consistent the player is
        const recent = this.learningData.actions.slice(-20);
        const timeGaps = [];
        
        for (let i = 1; i < recent.length; i++) {
            timeGaps.push(recent[i].timestamp - recent[i-1].timestamp);
        }
        
        if (timeGaps.length === 0) return 0;
        
        const avgGap = timeGaps.reduce((a, b) => a + b) / timeGaps.length;
        const variance = timeGaps.reduce((sum, gap) => 
            sum + Math.pow(gap - avgGap, 2), 0) / timeGaps.length;
        
        // Lower variance = more consistent
        return Math.max(0, 1 - (Math.sqrt(variance) / avgGap));
    }
    
    generateInsights() {
        const insights = [];
        
        // Most active NPC
        let mostActive = { name: '', actions: 0 };
        this.learningData.npcs.forEach((data, name) => {
            if (data.actions > mostActive.actions) {
                mostActive = { name, actions: data.actions };
            }
        });
        
        if (mostActive.name) {
            insights.push(`${mostActive.name} is your favorite NPC with ${mostActive.actions} interactions!`);
        }
        
        // Pattern insights
        if (this.learningData.patterns.has('rapid_clicking')) {
            insights.push('You like to click fast! The AI is learning from your enthusiasm!');
        }
        
        // Intelligence insight
        if (this.learningData.intelligence > 0.7) {
            insights.push('The AI is getting really smart thanks to your training!');
        } else if (this.learningData.intelligence > 0.4) {
            insights.push('The AI is learning steadily. Keep playing!');
        } else {
            insights.push('The AI needs more training. Click those NPCs!');
        }
        
        return insights;
    }
    
    async checkServices() {
        const services = {
            templateProcessor: false,
            aiApi: false,
            documentGenerator: false
        };
        
        try {
            const axios = require('axios');
            
            // Check each service
            try {
                await axios.get('http://localhost:3000/health', { timeout: 1000 });
                services.templateProcessor = true;
            } catch (e) {}
            
            try {
                await axios.get('http://localhost:3001/health', { timeout: 1000 });
                services.aiApi = true;
            } catch (e) {}
            
            try {
                await axios.get('http://localhost:4000/health', { timeout: 1000 });
                services.documentGenerator = true;
            } catch (e) {}
            
        } catch (error) {
            console.error('Service check error:', error);
        }
        
        return services;
    }
    
    async saveLearningData() {
        try {
            const dataPath = path.join(__dirname, 'game-learning-data.json');
            await fs.writeFile(dataPath, JSON.stringify({
                intelligence: this.learningData.intelligence,
                actions: this.learningData.actions.slice(-1000), // Keep last 1000 actions
                patterns: Array.from(this.learningData.patterns.entries()),
                npcs: Array.from(this.learningData.npcs.entries())
            }, null, 2));
        } catch (error) {
            console.error('Failed to save learning data:', error);
        }
    }
    
    async loadLearningData() {
        try {
            const dataPath = path.join(__dirname, 'game-learning-data.json');
            const data = await fs.readFile(dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            this.learningData.intelligence = saved.intelligence || 0.1;
            this.learningData.actions = saved.actions || [];
            this.learningData.patterns = new Map(saved.patterns || []);
            
            // Restore NPC data
            if (saved.npcs) {
                saved.npcs.forEach(([name, data]) => {
                    this.learningData.npcs.set(name, data);
                });
            }
            
            console.log(`📚 Loaded existing learning data: ${this.learningData.actions.length} actions`);
            
        } catch (error) {
            console.log('📝 Starting with fresh learning data');
        }
    }
}

// Start the connector
if (require.main === module) {
    new GameLearningConnector();
}

module.exports = GameLearningConnector;
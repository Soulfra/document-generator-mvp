#!/usr/bin/env node

/**
 * 📱 MOBILE APP UNIFIED CONTAINER 📱
 * 
 * Combines all existing interactive components into unified mobile experience:
 * - Chapter 7 Interactive Stories
 * - Color-Coded Education Games
 * - IQ Testing & Assessment
 * - Boss Battles & Gaming
 * - Plugin Management as Character Collection
 * - Dependency Analysis as Adventure Quests
 */

const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

class MobileAppUnifiedContainer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 9800;
        this.wsPort = options.wsPort || 9801;
        
        // Connect to existing services
        this.services = {
            chapter7: 'http://localhost:3001/api/chapter7',
            colorGames: 'http://localhost:8787',
            iqTesting: 'http://localhost:3002/api/testing',
            bossBalance: 'http://localhost:8888/api/boss',
            pluginManager: 'http://localhost:8090/api/plugins',
            dependencyEngine: './dependency-singularity-engine.js',
            fileCategorizationAI: './file-categorization-ai.js'
        };
        
        // User progression system
        this.userProfiles = new Map();
        this.gameState = new Map();
        this.achievements = new Map();
        
        // Mobile app structure
        this.appStructure = {
            'story-mode': {
                name: '📖 Story Mode',
                description: 'Interactive Chapter 7 stories with choices',
                color: '#FF6B6B',
                service: 'chapter7',
                unlockLevel: 0
            },
            'color-academy': {
                name: '🎨 Color Academy',
                description: 'Learn through color psychology games',
                color: '#4ECDC4',
                service: 'colorGames',
                unlockLevel: 1
            },
            'brain-training': {
                name: '🧠 Brain Training',
                description: 'IQ tests and pattern recognition',
                color: '#45B7D1',
                service: 'iqTesting',
                unlockLevel: 2
            },
            'battle-arena': {
                name: '⚔️ Battle Arena',
                description: 'Real-time boss battles with others',
                color: '#96CEB4',
                service: 'bossBalance',
                unlockLevel: 3
            },
            'character-vault': {
                name: '👾 Character Vault',
                description: 'Collect and manage plugins as characters',
                color: '#FCEA2B',
                service: 'pluginManager',
                unlockLevel: 4
            },
            'quest-board': {
                name: '🗺️ Quest Board',
                description: 'Dependency quests and file organization adventures',
                color: '#FF8A95',
                service: 'dependencyEngine',
                unlockLevel: 5
            }
        };
        
        console.log('📱 Mobile App Unified Container initializing...');
    }
    
    async initialize() {
        console.log('\n🚀 Setting up mobile app infrastructure...');
        
        // Setup Express middleware
        this.setupMiddleware();
        
        // Setup API routes
        this.setupRoutes();
        
        // Setup WebSocket for real-time updates
        this.setupWebSocket();
        
        // Load existing user data
        await this.loadUserData();
        
        // Start services
        this.startServer();
        
        console.log('✅ Mobile app container ready!');
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('mobile-app-public'));
        
        // Mobile-specific middleware
        this.app.use((req, res, next) => {
            // Set mobile-friendly headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            
            // Log mobile requests
            const userAgent = req.get('User-Agent') || '';
            const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
            console.log(`📱 ${isMobile ? 'MOBILE' : 'DESKTOP'} ${req.method} ${req.path}`);
            
            next();
        });
    }
    
    setupRoutes() {
        // App structure and navigation
        this.app.get('/api/app-structure', this.getAppStructure.bind(this));
        this.app.get('/api/user/:id/profile', this.getUserProfile.bind(this));
        this.app.post('/api/user/:id/progress', this.updateProgress.bind(this));
        
        // Story Mode API
        this.app.get('/api/story/chapters', this.getStoryChapters.bind(this));
        this.app.get('/api/story/chapter/:id', this.getStoryChapter.bind(this));
        this.app.post('/api/story/choice', this.makeStoryChoice.bind(this));
        
        // Color Academy API
        this.app.get('/api/color/games', this.getColorGames.bind(this));
        this.app.post('/api/color/play', this.playColorGame.bind(this));
        this.app.get('/api/color/leaderboard', this.getColorLeaderboard.bind(this));
        
        // Brain Training API
        this.app.get('/api/brain/tests', this.getBrainTests.bind(this));
        this.app.post('/api/brain/test/:id/start', this.startBrainTest.bind(this));
        this.app.post('/api/brain/test/:id/answer', this.submitBrainAnswer.bind(this));
        
        // Battle Arena API
        this.app.get('/api/battle/active', this.getActiveBattles.bind(this));
        this.app.post('/api/battle/join/:id', this.joinBattle.bind(this));
        this.app.post('/api/battle/:id/action', this.battleAction.bind(this));
        
        // Character Vault API
        this.app.get('/api/characters/collection', this.getCharacterCollection.bind(this));
        this.app.post('/api/characters/collect', this.collectCharacter.bind(this));
        this.app.get('/api/characters/:id/details', this.getCharacterDetails.bind(this));
        
        // Quest Board API
        this.app.get('/api/quests/available', this.getAvailableQuests.bind(this));
        this.app.post('/api/quests/:id/start', this.startQuest.bind(this));
        this.app.post('/api/quests/:id/complete', this.completeQuest.bind(this));
        
        // Achievement system
        this.app.get('/api/achievements/:userId', this.getUserAchievements.bind(this));
        this.app.post('/api/achievements/unlock', this.unlockAchievement.bind(this));
        
        // Main mobile app interface
        this.app.get('/', this.serveMobileApp.bind(this));
        this.app.get('/app', this.serveMobileApp.bind(this));
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            console.log('📡 Mobile WebSocket connected');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Invalid message format' 
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log('📡 Mobile WebSocket disconnected');
            });
            
            // Send welcome message with app structure
            ws.send(JSON.stringify({
                type: 'welcome',
                appStructure: this.appStructure,
                timestamp: new Date().toISOString()
            }));
        });
        
        console.log(`📡 Mobile WebSocket server started on port ${this.wsPort}`);
    }
    
    async handleWebSocketMessage(ws, message) {
        const { type, data, userId } = message;
        
        switch (type) {
            case 'user-activity':
                await this.trackUserActivity(userId, data);
                break;
                
            case 'real-time-game':
                await this.handleRealTimeGame(ws, data);
                break;
                
            case 'progress-update':
                await this.updateUserProgress(userId, data);
                this.broadcastProgressUpdate(userId, data);
                break;
                
            case 'get-recommendations':
                const recommendations = await this.getPersonalizedRecommendations(userId);
                ws.send(JSON.stringify({
                    type: 'recommendations',
                    data: recommendations
                }));
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${type}`
                }));
        }
    }
    
    // API Route Handlers
    async getAppStructure(req, res) {
        const userId = req.query.userId;
        const userProfile = this.userProfiles.get(userId) || this.createDefaultProfile(userId);
        
        // Filter apps by unlock level
        const availableApps = {};
        for (const [key, app] of Object.entries(this.appStructure)) {
            if (userProfile.level >= app.unlockLevel) {
                availableApps[key] = {
                    ...app,
                    unlocked: true,
                    progress: userProfile.appProgress[key] || 0
                };
            } else {
                availableApps[key] = {
                    ...app,
                    unlocked: false,
                    unlockAt: `Level ${app.unlockLevel}`,
                    progress: 0
                };
            }
        }
        
        res.json({
            success: true,
            apps: availableApps,
            userLevel: userProfile.level,
            userXP: userProfile.xp
        });
    }
    
    async getUserProfile(req, res) {
        const { id } = req.params;
        const profile = this.userProfiles.get(id) || this.createDefaultProfile(id);
        
        res.json({
            success: true,
            profile: {
                id: profile.id,
                level: profile.level,
                xp: profile.xp,
                achievements: profile.achievements,
                favoriteColor: profile.favoriteColor,
                personalityType: profile.personalityType,
                appProgress: profile.appProgress,
                stats: {
                    totalGameTime: profile.stats.totalGameTime,
                    questsCompleted: profile.stats.questsCompleted,
                    charactersCollected: profile.stats.charactersCollected,
                    storiesRead: profile.stats.storiesRead,
                    testsCompleted: profile.stats.testsCompleted
                }
            }
        });
    }
    
    async updateProgress(req, res) {
        const { id } = req.params;
        const { app, progress, xpGained, achievement } = req.body;
        
        const profile = this.userProfiles.get(id) || this.createDefaultProfile(id);
        
        // Update progress
        if (app) {
            profile.appProgress[app] = (profile.appProgress[app] || 0) + (progress || 0);
        }
        
        // Add XP
        if (xpGained) {
            profile.xp += xpGained;
            const newLevel = Math.floor(profile.xp / 1000); // 1000 XP per level
            if (newLevel > profile.level) {
                profile.level = newLevel;
                // Unlock achievement for leveling up
                this.unlockAchievementForUser(id, `level-${newLevel}`);
            }
        }
        
        // Unlock achievement
        if (achievement) {
            this.unlockAchievementForUser(id, achievement);
        }
        
        this.userProfiles.set(id, profile);
        await this.saveUserData();
        
        res.json({
            success: true,
            newLevel: profile.level,
            totalXP: profile.xp,
            unlockedAchievement: achievement
        });
    }
    
    async getStoryChapters(req, res) {
        // Integration with existing Chapter 7 story engine
        try {
            const storyEngine = require('./chapter7-interactive-story-engine.js');
            const chapters = await storyEngine.getAvailableChapters();
            
            res.json({
                success: true,
                chapters: chapters.map(chapter => ({
                    ...chapter,
                    mobileOptimized: true,
                    estimatedTime: `${Math.ceil(chapter.wordCount / 200)} min`,
                    difficultyColor: this.getDifficultyColor(chapter.complexity)
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Story engine not available'
            });
        }
    }
    
    async getColorGames(req, res) {
        const games = [
            {
                id: 'pattern-pursuit',
                name: '🌈 Pattern Pursuit',
                description: 'Remember and repeat color sequences',
                difficulty: 'Easy',
                color: '#FF6B6B',
                playTime: '2-5 min',
                rewards: {
                    xp: 50,
                    unlocks: ['emotion-explorer']
                }
            },
            {
                id: 'emotion-explorer',
                name: '💙 Emotion Explorer',
                description: 'Match colors to emotions and scenarios',
                difficulty: 'Medium',
                color: '#4ECDC4',
                playTime: '5-10 min',
                rewards: {
                    xp: 100,
                    unlocks: ['color-clash']
                }
            },
            {
                id: 'color-clash',
                name: '⚡ Color Clash',
                description: 'Strategic multiplayer color battles',
                difficulty: 'Hard',
                color: '#45B7D1',
                playTime: '10-15 min',
                rewards: {
                    xp: 200,
                    achievement: 'color-master'
                }
            },
            {
                id: 'spectrum-solver',
                name: '🔬 Spectrum Solver',
                description: 'Solve color theory puzzles',
                difficulty: 'Expert',
                color: '#96CEB4',
                playTime: '15-20 min',
                rewards: {
                    xp: 300,
                    character: 'color-scientist'
                }
            }
        ];
        
        res.json({
            success: true,
            games,
            totalGames: games.length
        });
    }
    
    async getBrainTests(req, res) {
        const tests = [
            {
                id: 'pattern-recognition',
                name: '🔍 Pattern Recognition',
                description: 'Identify patterns in sequences',
                type: 'visual',
                duration: '10 min',
                questions: 20,
                difficulty: 'Adaptive',
                color: '#FF8A95'
            },
            {
                id: 'working-memory',
                name: '💭 Working Memory',
                description: 'Hold and manipulate information',
                type: 'cognitive',
                duration: '8 min',
                questions: 15,
                difficulty: 'Progressive',
                color: '#FFD93D'
            },
            {
                id: 'logical-reasoning',
                name: '🧩 Logical Reasoning',
                description: 'Solve logical puzzles and problems',
                type: 'analytical',
                duration: '15 min',
                questions: 25,
                difficulty: 'Challenging',
                color: '#6BCF7F'
            }
        ];
        
        res.json({
            success: true,
            tests,
            recommendation: 'Start with Pattern Recognition for best results'
        });
    }
    
    async getCharacterCollection(req, res) {
        const userId = req.query.userId;
        const profile = this.userProfiles.get(userId) || this.createDefaultProfile(userId);
        
        // Convert plugins to characters
        const characters = [
            {
                id: 'dependency-detective',
                name: '🕵️ Dependency Detective',
                description: 'Finds duplicate and unused dependencies',
                rarity: 'Common',
                color: '#FF6B6B',
                abilities: ['Scan Dependencies', 'Find Duplicates', 'Security Check'],
                unlocked: profile.level >= 1,
                source: 'dependency-singularity-engine'
            },
            {
                id: 'plugin-wizard',
                name: '🧙 Plugin Wizard',
                description: 'Manages hot-reloadable plugins',
                rarity: 'Rare',
                color: '#4ECDC4',
                abilities: ['Load Plugin', 'Hot Reload', 'Dependency Injection'],
                unlocked: profile.level >= 3,
                source: 'plugin-architecture-system'
            },
            {
                id: 'clarity-guardian',
                name: '🛡️ Clarity Guardian',
                description: 'Protects against malicious code',
                rarity: 'Epic',
                color: '#45B7D1',
                abilities: ['Security Scan', 'Quarantine Threats', 'Code Analysis'],
                unlocked: profile.level >= 5,
                source: 'clarity-defense-system'
            },
            {
                id: 'file-sage',
                name: '📚 File Sage',
                description: 'Organizes files by semantic meaning',
                rarity: 'Legendary',
                color: '#96CEB4',
                abilities: ['AI Categorization', 'Smart Search', 'Duplicate Finder'],
                unlocked: profile.level >= 8,
                source: 'file-categorization-ai'
            }
        ];
        
        res.json({
            success: true,
            characters: characters.filter(c => c.unlocked),
            lockedCharacters: characters.filter(c => !c.unlocked).length,
            totalCharacters: characters.length
        });
    }
    
    async getAvailableQuests(req, res) {
        const userId = req.query.userId;
        const profile = this.userProfiles.get(userId) || this.createDefaultProfile(userId);
        
        const quests = [
            {
                id: 'cleanup-dependencies',
                name: '🧹 The Great Dependency Cleanup',
                description: 'Remove unused dependencies and consolidate duplicates',
                difficulty: 'Easy',
                estimatedTime: '15 min',
                rewards: {
                    xp: 200,
                    character: 'dependency-detective',
                    achievement: 'clean-coder'
                },
                steps: [
                    'Run dependency analysis',
                    'Identify unused packages',
                    'Remove duplicate versions',
                    'Update package.json'
                ],
                unlocked: profile.level >= 0
            },
            {
                id: 'plugin-migration',
                name: '🔄 Plugin Migration Adventure',
                description: 'Convert monolithic services into hot-loadable plugins',
                difficulty: 'Medium',
                estimatedTime: '30 min',
                rewards: {
                    xp: 400,
                    character: 'plugin-wizard',
                    achievement: 'plugin-master'
                },
                steps: [
                    'Analyze existing services',
                    'Generate plugin manifests',
                    'Create plugin wrappers',
                    'Test hot reload'
                ],
                unlocked: profile.level >= 2
            },
            {
                id: 'security-fortress',
                name: '🏰 Security Fortress Defense',
                description: 'Scan for vulnerabilities and protect against attacks',
                difficulty: 'Hard',
                estimatedTime: '45 min',
                rewards: {
                    xp: 600,
                    character: 'clarity-guardian',
                    achievement: 'security-expert'
                },
                steps: [
                    'Scan all dependencies',
                    'Check for malicious patterns',
                    'Set up security policies',
                    'Create monitoring alerts'
                ],
                unlocked: profile.level >= 4
            }
        ];
        
        res.json({
            success: true,
            quests: quests.filter(q => q.unlocked),
            lockedQuests: quests.filter(q => !q.unlocked).length
        });
    }
    
    async serveMobileApp(req, res) {
        const html = await this.generateMobileAppHTML();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
    
    // Utility methods
    createDefaultProfile(userId) {
        const profile = {
            id: userId,
            level: 0,
            xp: 0,
            achievements: [],
            favoriteColor: '#4ECDC4',
            personalityType: 'Explorer',
            appProgress: {},
            stats: {
                totalGameTime: 0,
                questsCompleted: 0,
                charactersCollected: 0,
                storiesRead: 0,
                testsCompleted: 0
            },
            createdAt: new Date().toISOString()
        };
        
        this.userProfiles.set(userId, profile);
        return profile;
    }
    
    getDifficultyColor(complexity) {
        const colors = {
            'simple': '#6BCF7F',
            'moderate': '#FFD93D', 
            'complex': '#FF8A95',
            'expert': '#B8860B'
        };
        return colors[complexity] || '#4ECDC4';
    }
    
    unlockAchievementForUser(userId, achievementId) {
        const profile = this.userProfiles.get(userId);
        if (profile && !profile.achievements.includes(achievementId)) {
            profile.achievements.push(achievementId);
        }
    }
    
    async loadUserData() {
        try {
            const dataPath = path.join(__dirname, 'mobile-app-data', 'user-profiles.json');
            const data = await fs.readFile(dataPath, 'utf-8');
            const profiles = JSON.parse(data);
            
            for (const profile of profiles) {
                this.userProfiles.set(profile.id, profile);
            }
            
            console.log(`   Loaded ${this.userProfiles.size} user profiles`);
        } catch (error) {
            console.log('   No existing user data found, starting fresh');
        }
    }
    
    async saveUserData() {
        try {
            const dataDir = path.join(__dirname, 'mobile-app-data');
            await fs.mkdir(dataDir, { recursive: true });
            
            const profiles = Array.from(this.userProfiles.values());
            await fs.writeFile(
                path.join(dataDir, 'user-profiles.json'),
                JSON.stringify(profiles, null, 2)
            );
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }
    
    async generateMobileAppHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>📱 Document Generator Mobile</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            overflow-x: hidden;
            user-select: none;
        }

        .app-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 1rem;
            text-align: center;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .app-title {
            font-size: 1.5rem;
            font-weight: bold;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        .user-stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
            color: #666;
        }

        .level-badge {
            background: linear-gradient(45deg, #4ECDC4, #44A08D);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-weight: bold;
        }

        .main-content {
            padding: 1rem;
            padding-bottom: 6rem;
        }

        .app-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .app-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            min-height: 160px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .app-card:active {
            transform: scale(0.95);
        }

        .app-card.locked {
            opacity: 0.6;
            background: rgba(128, 128, 128, 0.3);
        }

        .app-icon {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .app-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 0.3rem;
            font-size: 1rem;
        }

        .app-description {
            font-size: 0.8rem;
            color: #666;
            line-height: 1.3;
        }

        .unlock-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #FFD93D;
            color: #333;
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem;
            border-radius: 10px;
            font-weight: bold;
        }

        .progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #4ECDC4, #44A08D);
            border-radius: 0 0 20px 20px;
            transition: width 0.3s ease;
        }

        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            display: flex;
            justify-content: space-around;
            padding: 0.8rem 0;
            border-top: 1px solid rgba(0,0,0,0.1);
        }

        .nav-button {
            background: none;
            border: none;
            font-size: 1.5rem;
            padding: 0.5rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.2rem;
        }

        .nav-button:active {
            transform: scale(0.9);
            background: rgba(0,0,0,0.1);
        }

        .nav-label {
            font-size: 0.6rem;
            color: #666;
            font-weight: 500;
        }

        .floating-action {
            position: fixed;
            bottom: 5rem;
            right: 1rem;
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            border: none;
            color: white;
            font-size: 1.8rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        }

        .floating-action:active {
            transform: scale(0.9);
        }

        .loading {
            display: none;
            text-align: center;
            padding: 2rem;
            color: white;
        }

        .loading.show {
            display: block;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 1rem;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 1000;
        }

        .notification.show {
            transform: translateX(0);
        }

        @media (max-width: 480px) {
            .app-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .app-card {
                min-height: 140px;
                padding: 1rem;
            }
            
            .app-icon {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="app-header">
        <div class="app-title">📱 Document Generator</div>
        <div class="user-stats">
            <span id="user-info">Loading...</span>
            <div class="level-badge" id="level-badge">Level 0</div>
        </div>
    </div>

    <div class="main-content">
        <div class="loading show" id="loading">
            <div class="spinner"></div>
            <p>Loading your universe...</p>
        </div>

        <div class="app-grid" id="app-grid" style="display: none;">
            <!-- Apps will be dynamically loaded here -->
        </div>
    </div>

    <button class="floating-action" id="ai-assistant" title="AI Assistant">
        🤖
    </button>

    <div class="bottom-nav">
        <button class="nav-button" onclick="showSection('home')">
            <span>🏠</span>
            <span class="nav-label">Home</span>
        </button>
        <button class="nav-button" onclick="showSection('progress')">
            <span>📊</span>
            <span class="nav-label">Progress</span>
        </button>
        <button class="nav-button" onclick="showSection('achievements')">
            <span>🏆</span>
            <span class="nav-label">Awards</span>
        </button>
        <button class="nav-button" onclick="showSection('settings')">
            <span>⚙️</span>
            <span class="nav-label">Settings</span>
        </button>
    </div>

    <div class="notification" id="notification"></div>

    <script>
        let userId = 'user_' + Date.now();
        let userProfile = null;
        let ws = null;

        // Initialize app
        document.addEventListener('DOMContentLoaded', async () => {
            await connectWebSocket();
            await loadAppStructure();
            await loadUserProfile();
            hideLoading();
        });

        async function connectWebSocket() {
            try {
                ws = new WebSocket('ws://localhost:9801');
                
                ws.onopen = () => {
                    console.log('📡 Connected to mobile app server');
                };
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                };
                
                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };
            } catch (error) {
                console.error('Failed to connect WebSocket:', error);
            }
        }

        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'welcome':
                    console.log('Welcome to mobile app!', data);
                    break;
                case 'progress-update':
                    showNotification(\`🎉 Level up! You reached level \${data.newLevel}\`);
                    updateLevelBadge(data.newLevel);
                    break;
                case 'achievement-unlocked':
                    showNotification(\`🏆 Achievement unlocked: \${data.achievement}\`);
                    break;
            }
        }

        async function loadAppStructure() {
            try {
                const response = await fetch(\`/api/app-structure?userId=\${userId}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderAppGrid(data.apps);
                    updateUserStats(data.userLevel, data.userXP);
                }
            } catch (error) {
                console.error('Failed to load app structure:', error);
            }
        }

        async function loadUserProfile() {
            try {
                const response = await fetch(\`/api/user/\${userId}/profile\`);
                const data = await response.json();
                
                if (data.success) {
                    userProfile = data.profile;
                    document.getElementById('user-info').textContent = 
                        \`\${userProfile.stats.questsCompleted} quests • \${userProfile.xp} XP\`;
                }
            } catch (error) {
                console.error('Failed to load user profile:', error);
            }
        }

        function renderAppGrid(apps) {
            const grid = document.getElementById('app-grid');
            grid.innerHTML = '';

            Object.entries(apps).forEach(([key, app]) => {
                const appCard = createAppCard(key, app);
                grid.appendChild(appCard);
            });

            grid.style.display = 'grid';
        }

        function createAppCard(key, app) {
            const card = document.createElement('div');
            card.className = \`app-card \${app.unlocked ? '' : 'locked'}\`;
            card.style.borderLeft = \`4px solid \${app.color}\`;
            
            if (app.unlocked) {
                card.onclick = () => openApp(key, app);
            }

            card.innerHTML = \`
                <div class="app-icon">\${app.name.split(' ')[0]}</div>
                <div class="app-name">\${app.name.substring(2)}</div>
                <div class="app-description">\${app.description}</div>
                \${!app.unlocked ? \`<div class="unlock-badge">\${app.unlockAt}</div>\` : ''}
                \${app.unlocked && app.progress > 0 ? \`<div class="progress-bar" style="width: \${app.progress}%"></div>\` : ''}
            \`;

            return card;
        }

        async function openApp(key, app) {
            if (!app.unlocked) {
                showNotification(\`🔒 Unlock at \${app.unlockAt}\`);
                return;
            }

            showNotification(\`🚀 Opening \${app.name}...\`);
            
            // Track app usage
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'user-activity',
                    userId: userId,
                    data: {
                        app: key,
                        action: 'open',
                        timestamp: new Date().toISOString()
                    }
                }));
            }

            // Route to appropriate app
            switch (key) {
                case 'story-mode':
                    window.open('/story-mode', '_blank');
                    break;
                case 'color-academy':
                    window.open('/color-academy', '_blank');
                    break;
                case 'brain-training':
                    window.open('/brain-training', '_blank');
                    break;
                case 'battle-arena':
                    window.open('/battle-arena', '_blank');
                    break;
                case 'character-vault':
                    window.open('/character-vault', '_blank');
                    break;
                case 'quest-board':
                    window.open('/quest-board', '_blank');
                    break;
                default:
                    showNotification('🚧 Coming soon!');
            }
        }

        function updateUserStats(level, xp) {
            document.getElementById('level-badge').textContent = \`Level \${level}\`;
            
            if (userProfile) {
                document.getElementById('user-info').textContent = 
                    \`\${userProfile.stats.questsCompleted} quests • \${xp} XP\`;
            }
        }

        function updateLevelBadge(newLevel) {
            document.getElementById('level-badge').textContent = \`Level \${newLevel}\`;
        }

        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        function hideLoading() {
            document.getElementById('loading').classList.remove('show');
        }

        function showSection(section) {
            showNotification(\`📱 \${section.charAt(0).toUpperCase() + section.slice(1)} section coming soon!\`);
        }

        // AI Assistant
        document.getElementById('ai-assistant').onclick = () => {
            showNotification('🤖 AI Assistant: How can I help you explore the system?');
            // Future: Open AI chat interface
        };

        // Handle app becoming active/inactive
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && ws && ws.readyState !== WebSocket.OPEN) {
                connectWebSocket();
            }
        });
    </script>
</body>
</html>`;
    }
    
    startServer() {
        this.app.listen(this.port, () => {
            console.log(`\n📱 Mobile App Unified Container running on port ${this.port}`);
            console.log(`📡 WebSocket server running on port ${this.wsPort}`);
            console.log(`\n🌐 Access your mobile app:`);
            console.log(`   • Desktop: http://localhost:${this.port}`);
            console.log(`   • Mobile: http://[your-ip]:${this.port}`);
            console.log(`\n🎮 Available Apps:`);
            
            Object.entries(this.appStructure).forEach(([key, app]) => {
                console.log(`   • ${app.name} - ${app.description}`);
            });
        });
    }
}

// Export for use as module
module.exports = MobileAppUnifiedContainer;

// CLI interface
if (require.main === module) {
    const container = new MobileAppUnifiedContainer();
    
    console.log('📱 MOBILE APP UNIFIED CONTAINER');
    console.log('==============================\n');
    
    container.initialize().catch(console.error);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down mobile app container...');
        await container.saveUserData();
        process.exit(0);
    });
}
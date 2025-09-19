#!/usr/bin/env node

/**
 * 🌈 COLOR-CODED EDUCATION SYSTEM
 * 
 * Advanced educational platform that uses color psychology, pattern recognition,
 * and emotional intelligence to create engaging learning experiences.
 * 
 * Features:
 * - Pattern recognition training through color sequences
 * - Emotional intelligence development via color-emotion mapping
 * - Stealth assessment and progress tracking
 * - Gamified mini-games for various learning objectives
 * - Social learning through multiplayer color challenges
 * - Adaptive difficulty based on performance
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ColorCodedEducationSystem {
    constructor() {
        this.port = 8787; // Education system port
        
        // Core color definitions with psychological associations
        this.colorPalette = {
            primary: [
                { name: 'red', hex: '#ff4444', emotion: 'excitement', energy: 'high', learning: 'action' },
                { name: 'blue', hex: '#4444ff', emotion: 'calm', energy: 'low', learning: 'focus' },
                { name: 'yellow', hex: '#ffff44', emotion: 'happiness', energy: 'medium', learning: 'creativity' },
                { name: 'green', hex: '#44ff44', emotion: 'balance', energy: 'medium', learning: 'growth' },
                { name: 'purple', hex: '#ff44ff', emotion: 'mystery', energy: 'high', learning: 'imagination' },
                { name: 'orange', hex: '#ff8844', emotion: 'enthusiasm', energy: 'high', learning: 'social' },
                { name: 'cyan', hex: '#44ffff', emotion: 'clarity', energy: 'low', learning: 'analysis' },
                { name: 'pink', hex: '#ff88cc', emotion: 'compassion', energy: 'medium', learning: 'empathy' }
            ],
            secondary: [
                { name: 'indigo', hex: '#4444aa', emotion: 'intuition', energy: 'low', learning: 'insight' },
                { name: 'teal', hex: '#44aa88', emotion: 'rejuvenation', energy: 'medium', learning: 'healing' },
                { name: 'coral', hex: '#ff6688', emotion: 'warmth', energy: 'medium', learning: 'connection' },
                { name: 'lime', hex: '#88ff44', emotion: 'vitality', energy: 'high', learning: 'motivation' }
            ]
        };
        
        // Learning modules
        this.modules = {
            patternRecognition: new PatternRecognitionModule(),
            emotionalIntelligence: new EmotionalIntelligenceModule(),
            socialDynamics: new SocialDynamicsModule(),
            colorTheory: new ColorTheoryModule(),
            problemSolving: new ProblemSolvingModule()
        };
        
        // Student profiles and progress tracking
        this.students = new Map();
        this.sessions = new Map();
        
        // Learning analytics
        this.analytics = {
            patterns_recognized: 0,
            emotions_identified: 0,
            social_interactions: 0,
            problems_solved: 0,
            total_engagement_time: 0
        };
        
        // Stealth assessment metrics
        this.assessmentMetrics = {
            reaction_times: [],
            accuracy_rates: [],
            pattern_complexity: [],
            emotional_accuracy: [],
            collaboration_scores: []
        };
        
        // Game modes
        this.gameModes = {
            'pattern_pursuit': { name: 'Pattern Pursuit', type: 'single', module: 'patternRecognition' },
            'emotion_explorer': { name: 'Emotion Explorer', type: 'single', module: 'emotionalIntelligence' },
            'color_clash': { name: 'Color Clash', type: 'multi', module: 'socialDynamics' },
            'spectrum_solver': { name: 'Spectrum Solver', type: 'single', module: 'problemSolving' },
            'harmony_hunter': { name: 'Harmony Hunter', type: 'single', module: 'colorTheory' },
            'social_spectrum': { name: 'Social Spectrum', type: 'multi', module: 'socialDynamics' }
        };
        
        // Sequential learning monitor integration
        this.learningMonitor = {
            sequences: new Map(),
            progress: new Map(),
            milestones: new Map()
        };
        
        console.log('🌈 COLOR-CODED EDUCATION SYSTEM');
        console.log('================================');
        console.log('🎓 Advanced learning through color psychology');
        console.log('🧠 Pattern recognition & emotional intelligence');
        console.log('🎮 Gamified educational experiences');
        console.log('📊 Invisible progress tracking');
        console.log('');
        
        this.init();
    }
    
    async init() {
        // Initialize database
        await this.initDatabase();
        
        // Connect to existing systems
        await this.connectToColorTraining();
        
        // Start education server
        await this.startEducationServer();
        
        // Initialize learning modules
        this.initializeModules();
        
        // Start analytics engine
        this.startAnalyticsEngine();
        
        console.log('🎓 EDUCATION SYSTEM READY!');
        console.log(`🌈 Access at: http://localhost:${this.port}`);
        console.log('🎮 Start learning through play!');
    }
    
    async initDatabase() {
        try {
            await fs.mkdir(path.join(__dirname, 'education-data'), { recursive: true });
            console.log('📁 Education data directory ready');
        } catch (error) {
            console.error('❌ Failed to create data directory:', error);
        }
    }
    
    async connectToColorTraining() {
        try {
            this.colorTrainingConnection = new WebSocket('ws://localhost:7878');
            
            this.colorTrainingConnection.on('open', () => {
                console.log('🔗 Connected to Color Training Interface');
                this.colorTrainingConnection.send(JSON.stringify({
                    type: 'system_connect',
                    system: 'education',
                    capabilities: ['pattern_analysis', 'emotion_mapping', 'progress_tracking']
                }));
            });
            
            this.colorTrainingConnection.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleColorTrainingData(message);
            });
        } catch (error) {
            console.log('⚠️  Color Training Interface not available');
        }
    }
    
    async startEducationServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.end();
                return;
            }
            
            // Route handling
            if (req.url === '/') {
                res.setHeader('Content-Type', 'text/html');
                res.end(await this.generateMainInterface());
            } else if (req.url === '/api/games') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(this.gameModes));
            } else if (req.url.startsWith('/game/')) {
                const gameMode = req.url.split('/')[2];
                res.setHeader('Content-Type', 'text/html');
                res.end(await this.generateGameInterface(gameMode));
            } else if (req.url === '/api/progress' && req.method === 'POST') {
                await this.handleProgressUpdate(req, res);
            } else if (req.url === '/api/analytics') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(this.getAnalytics()));
            } else if (req.url.startsWith('/api/student/')) {
                const studentId = req.url.split('/')[3];
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(this.getStudentProfile(studentId)));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        // WebSocket for real-time learning
        const wss = new WebSocket.Server({ server });
        
        wss.on('connection', (ws) => {
            const sessionId = crypto.randomUUID();
            const session = {
                id: sessionId,
                ws: ws,
                studentId: null,
                currentGame: null,
                startTime: Date.now(),
                metrics: {
                    interactions: [],
                    patterns: [],
                    emotions: [],
                    collaborations: []
                }
            };
            
            this.sessions.set(sessionId, session);
            console.log(`🎓 New learning session: ${sessionId}`);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                sessionId: sessionId,
                games: this.gameModes,
                colors: this.colorPalette
            }));
            
            ws.on('message', (data) => {
                this.handleLearningMessage(session, JSON.parse(data));
            });
            
            ws.on('close', () => {
                this.endSession(sessionId);
            });
        });
        
        server.listen(this.port, () => {
            console.log(`🎓 Education server running on port ${this.port}`);
        });
        
        this.wss = wss;
    }
    
    async generateMainInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌈 Color-Coded Education System</title>
    <style>
        body {
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            font-family: 'Arial', sans-serif;
            color: #fff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            padding: 30px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            margin: 0;
            font-size: 3em;
            background: linear-gradient(45deg, #ff4444, #ffff44, #44ff44, #44ffff, #4444ff, #ff44ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: rainbow 5s ease-in-out infinite;
        }
        
        @keyframes rainbow {
            0%, 100% { filter: hue-rotate(0deg); }
            50% { filter: hue-rotate(180deg); }
        }
        
        .game-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .game-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(5px);
            border: 2px solid transparent;
            position: relative;
            overflow: hidden;
        }
        
        .game-card:hover {
            transform: translateY(-5px);
            border-color: #00ff41;
            box-shadow: 0 10px 30px rgba(0, 255, 65, 0.3);
        }
        
        .game-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: rotate(45deg);
            transition: all 0.5s;
            opacity: 0;
        }
        
        .game-card:hover::before {
            animation: shine 0.5s ease-in-out;
        }
        
        @keyframes shine {
            0% { transform: rotate(45deg) translateY(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: rotate(45deg) translateY(100%); opacity: 0; }
        }
        
        .game-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        
        .game-title {
            font-size: 1.5em;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .game-description {
            font-size: 0.9em;
            opacity: 0.8;
            line-height: 1.4;
        }
        
        .player-count {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.5);
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8em;
        }
        
        .progress-bar {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 30px;
            display: flex;
            gap: 20px;
            align-items: center;
            backdrop-filter: blur(10px);
        }
        
        .progress-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }
        
        .progress-icon {
            font-size: 1.5em;
        }
        
        .progress-value {
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .floating-colors {
            position: fixed;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }
        
        .floating-color {
            position: absolute;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            opacity: 0.1;
            animation: float 20s infinite ease-in-out;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            33% { transform: translateY(-30px) rotate(120deg); }
            66% { transform: translateY(30px) rotate(240deg); }
        }
    </style>
</head>
<body>
    <div class="floating-colors" id="floatingColors"></div>
    
    <div class="header">
        <h1>🌈 Color-Coded Education System</h1>
        <p>Learn through colors, patterns, and play!</p>
    </div>
    
    <div class="game-grid" id="gameGrid">
        <!-- Games will be populated here -->
    </div>
    
    <div class="progress-bar" id="progressBar">
        <div class="progress-item">
            <div class="progress-icon">🧠</div>
            <div class="progress-value" id="patternsValue">0</div>
            <div>Patterns</div>
        </div>
        <div class="progress-item">
            <div class="progress-icon">❤️</div>
            <div class="progress-value" id="emotionsValue">0</div>
            <div>Emotions</div>
        </div>
        <div class="progress-item">
            <div class="progress-icon">👥</div>
            <div class="progress-value" id="socialValue">0</div>
            <div>Social</div>
        </div>
        <div class="progress-item">
            <div class="progress-icon">🎯</div>
            <div class="progress-value" id="accuracyValue">100%</div>
            <div>Accuracy</div>
        </div>
    </div>
    
    <script>
        class EducationInterface {
            constructor() {
                this.ws = null;
                this.sessionId = null;
                this.games = {};
                this.colors = [];
                this.progress = {
                    patterns: 0,
                    emotions: 0,
                    social: 0,
                    accuracy: 100
                };
                
                this.init();
            }
            
            init() {
                this.connectWebSocket();
                this.createFloatingColors();
                this.loadStoredProgress();
            }
            
            connectWebSocket() {
                const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(protocol + '//' + location.host);
                
                this.ws.onopen = () => {
                    console.log('🔗 Connected to education system');
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                };
                
                this.ws.onclose = () => {
                    console.log('🔌 Disconnected from education system');
                    setTimeout(() => this.connectWebSocket(), 2000);
                };
            }
            
            handleServerMessage(data) {
                switch (data.type) {
                    case 'welcome':
                        this.sessionId = data.sessionId;
                        this.games = data.games;
                        this.colors = data.colors;
                        this.renderGames();
                        break;
                    case 'progress_update':
                        this.updateProgress(data.progress);
                        break;
                    case 'achievement':
                        this.showAchievement(data.achievement);
                        break;
                }
            }
            
            renderGames() {
                const grid = document.getElementById('gameGrid');
                grid.innerHTML = '';
                
                const gameIcons = {
                    'pattern_pursuit': '🔍',
                    'emotion_explorer': '😊',
                    'color_clash': '⚔️',
                    'spectrum_solver': '🧩',
                    'harmony_hunter': '🎨',
                    'social_spectrum': '🤝'
                };
                
                const gameDescriptions = {
                    'pattern_pursuit': 'Master pattern recognition through color sequences',
                    'emotion_explorer': 'Learn emotional intelligence with color psychology',
                    'color_clash': 'Multiplayer battles testing color strategy',
                    'spectrum_solver': 'Solve puzzles using color theory principles',
                    'harmony_hunter': 'Create beautiful color harmonies',
                    'social_spectrum': 'Collaborate using color communication'
                };
                
                Object.entries(this.games).forEach(([id, game]) => {
                    const card = document.createElement('div');
                    card.className = 'game-card';
                    card.innerHTML = \`
                        <div class="player-count">\${game.type === 'multi' ? '👥 Multiplayer' : '👤 Single Player'}</div>
                        <div class="game-icon">\${gameIcons[id] || '🎮'}</div>
                        <div class="game-title">\${game.name}</div>
                        <div class="game-description">\${gameDescriptions[id] || 'Educational color game'}</div>
                    \`;
                    
                    card.addEventListener('click', () => {
                        this.launchGame(id);
                    });
                    
                    grid.appendChild(card);
                });
            }
            
            launchGame(gameId) {
                window.location.href = \`/game/\${gameId}\`;
            }
            
            createFloatingColors() {
                const container = document.getElementById('floatingColors');
                const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
                
                for (let i = 0; i < 6; i++) {
                    const colorDiv = document.createElement('div');
                    colorDiv.className = 'floating-color';
                    colorDiv.style.backgroundColor = colors[i];
                    colorDiv.style.left = Math.random() * 100 + '%';
                    colorDiv.style.top = Math.random() * 100 + '%';
                    colorDiv.style.animationDelay = Math.random() * 20 + 's';
                    colorDiv.style.animationDuration = (20 + Math.random() * 10) + 's';
                    container.appendChild(colorDiv);
                }
            }
            
            updateProgress(progress) {
                this.progress = progress;
                document.getElementById('patternsValue').textContent = progress.patterns;
                document.getElementById('emotionsValue').textContent = progress.emotions;
                document.getElementById('socialValue').textContent = progress.social;
                document.getElementById('accuracyValue').textContent = progress.accuracy + '%';
                
                // Store progress locally
                localStorage.setItem('colorEducationProgress', JSON.stringify(progress));
            }
            
            loadStoredProgress() {
                const stored = localStorage.getItem('colorEducationProgress');
                if (stored) {
                    this.updateProgress(JSON.parse(stored));
                }
            }
            
            showAchievement(achievement) {
                // Create achievement notification
                const notification = document.createElement('div');
                notification.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(45deg, #ffd700, #ffed4e);
                    color: #000;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
                    animation: slideIn 0.5s ease-out;
                    z-index: 1000;
                \`;
                
                notification.innerHTML = \`
                    <div style="font-size: 1.5em; margin-bottom: 5px;">🏆 Achievement Unlocked!</div>
                    <div style="font-weight: bold;">\${achievement.title}</div>
                    <div style="font-size: 0.9em; opacity: 0.8;">\${achievement.description}</div>
                \`;
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.5s ease-out';
                    setTimeout(() => notification.remove(), 500);
                }, 3000);
            }
        }
        
        // CSS animations
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        \`;
        document.head.appendChild(style);
        
        // Start the interface
        window.addEventListener('load', () => {
            new EducationInterface();
        });
    </script>
</body>
</html>`;
    }
    
    async generateGameInterface(gameMode) {
        const game = this.gameModes[gameMode];
        if (!game) return this.generate404Page();
        
        // Generate specific game interface based on mode
        switch (gameMode) {
            case 'pattern_pursuit':
                return this.generatePatternPursuitGame();
            case 'emotion_explorer':
                return this.generateEmotionExplorerGame();
            case 'color_clash':
                return this.generateColorClashGame();
            case 'spectrum_solver':
                return this.generateSpectrumSolverGame();
            case 'harmony_hunter':
                return this.generateHarmonyHunterGame();
            case 'social_spectrum':
                return this.generateSocialSpectrumGame();
            default:
                return this.generate404Page();
        }
    }
    
    generatePatternPursuitGame() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔍 Pattern Pursuit - Color Education</title>
    <style>
        body {
            margin: 0;
            background: #0a0a0a;
            font-family: Arial, sans-serif;
            color: #fff;
            overflow: hidden;
        }
        
        .game-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            align-items: center;
            justify-content: center;
        }
        
        .pattern-display {
            display: flex;
            gap: 10px;
            margin-bottom: 40px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            min-height: 80px;
            align-items: center;
        }
        
        .pattern-color {
            width: 60px;
            height: 60px;
            border-radius: 10px;
            transition: all 0.3s ease;
        }
        
        .pattern-color.flash {
            animation: flash 0.5s ease;
        }
        
        @keyframes flash {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); box-shadow: 0 0 20px currentColor; }
        }
        
        .color-options {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .color-option {
            width: 100px;
            height: 100px;
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 3px solid transparent;
            position: relative;
        }
        
        .color-option:hover {
            border-color: #fff;
            transform: scale(1.1);
        }
        
        .color-option.correct {
            animation: correctPulse 0.6s ease;
        }
        
        .color-option.incorrect {
            animation: incorrectShake 0.5s ease;
        }
        
        @keyframes correctPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); box-shadow: 0 0 30px #44ff44; }
        }
        
        @keyframes incorrectShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        
        .game-stats {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #444;
        }
        
        .level-indicator {
            font-size: 2em;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .instruction {
            text-align: center;
            font-size: 1.2em;
            margin-bottom: 30px;
            opacity: 0.8;
        }
        
        .progress-indicator {
            width: 300px;
            height: 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            overflow: hidden;
            margin-top: 20px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #44ff44, #44ffff);
            transition: width 0.3s ease;
            width: 0%;
        }
        
        .back-button {
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #fff;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .back-button:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body>
    <div class="game-container">
        <a href="/" class="back-button">← Back to Games</a>
        
        <div class="game-stats">
            <div>Level: <span id="level">1</span></div>
            <div>Score: <span id="score">0</span></div>
            <div>Streak: <span id="streak">0</span></div>
            <div>Time: <span id="time">0:00</span></div>
        </div>
        
        <div class="level-indicator" id="levelIndicator">
            Level 1: Simple Sequences
        </div>
        
        <div class="instruction" id="instruction">
            Watch the pattern carefully...
        </div>
        
        <div class="pattern-display" id="patternDisplay">
            <!-- Pattern colors will appear here -->
        </div>
        
        <div class="color-options" id="colorOptions">
            <!-- Color options will appear here -->
        </div>
        
        <div class="progress-indicator">
            <div class="progress-fill" id="progressFill"></div>
        </div>
    </div>
    
    <script>
        class PatternPursuitGame {
            constructor() {
                this.ws = null;
                this.level = 1;
                this.score = 0;
                this.streak = 0;
                this.currentPattern = [];
                this.playerPattern = [];
                this.isShowingPattern = false;
                this.startTime = Date.now();
                this.colors = [
                    { name: 'red', hex: '#ff4444' },
                    { name: 'blue', hex: '#4444ff' },
                    { name: 'yellow', hex: '#ffff44' },
                    { name: 'green', hex: '#44ff44' },
                    { name: 'purple', hex: '#ff44ff' },
                    { name: 'orange', hex: '#ff8844' },
                    { name: 'cyan', hex: '#44ffff' },
                    { name: 'pink', hex: '#ff88cc' }
                ];
                
                this.levelConfig = {
                    1: { length: 3, speed: 1000, colors: 4 },
                    2: { length: 4, speed: 900, colors: 5 },
                    3: { length: 5, speed: 800, colors: 6 },
                    4: { length: 6, speed: 700, colors: 7 },
                    5: { length: 7, speed: 600, colors: 8 },
                    6: { length: 8, speed: 500, colors: 8 }
                };
                
                this.init();
            }
            
            init() {
                this.connectWebSocket();
                this.setupColorOptions();
                this.startTimer();
                this.startNewRound();
            }
            
            connectWebSocket() {
                const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(protocol + '//' + location.host);
                
                this.ws.onopen = () => {
                    this.ws.send(JSON.stringify({
                        type: 'game_start',
                        game: 'pattern_pursuit'
                    }));
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                };
            }
            
            handleServerMessage(data) {
                switch (data.type) {
                    case 'progress_update':
                        this.updateProgress(data.progress);
                        break;
                }
            }
            
            setupColorOptions() {
                const container = document.getElementById('colorOptions');
                const config = this.levelConfig[this.level];
                const availableColors = this.colors.slice(0, config.colors);
                
                container.innerHTML = '';
                availableColors.forEach((color, index) => {
                    const option = document.createElement('div');
                    option.className = 'color-option';
                    option.style.backgroundColor = color.hex;
                    option.dataset.color = color.name;
                    
                    option.addEventListener('click', () => {
                        if (!this.isShowingPattern) {
                            this.handleColorClick(color, option);
                        }
                    });
                    
                    container.appendChild(option);
                });
            }
            
            startNewRound() {
                const config = this.levelConfig[this.level];
                this.currentPattern = [];
                this.playerPattern = [];
                
                // Generate random pattern
                const availableColors = this.colors.slice(0, config.colors);
                for (let i = 0; i < config.length; i++) {
                    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
                    this.currentPattern.push(randomColor);
                }
                
                // Show the pattern
                this.showPattern();
            }
            
            async showPattern() {
                this.isShowingPattern = true;
                const display = document.getElementById('patternDisplay');
                const instruction = document.getElementById('instruction');
                const config = this.levelConfig[this.level];
                
                instruction.textContent = 'Watch the pattern carefully...';
                display.innerHTML = '';
                
                // Show each color in sequence
                for (let i = 0; i < this.currentPattern.length; i++) {
                    const color = this.currentPattern[i];
                    const colorDiv = document.createElement('div');
                    colorDiv.className = 'pattern-color';
                    colorDiv.style.backgroundColor = color.hex;
                    display.appendChild(colorDiv);
                    
                    // Flash animation
                    await new Promise(resolve => setTimeout(resolve, 100));
                    colorDiv.classList.add('flash');
                    await new Promise(resolve => setTimeout(resolve, config.speed));
                    colorDiv.classList.remove('flash');
                }
                
                // Clear display and let player repeat
                await new Promise(resolve => setTimeout(resolve, 500));
                display.innerHTML = '';
                instruction.textContent = 'Now repeat the pattern!';
                this.isShowingPattern = false;
            }
            
            handleColorClick(color, element) {
                this.playerPattern.push(color);
                
                // Visual feedback
                element.classList.add('correct');
                setTimeout(() => element.classList.remove('correct'), 600);
                
                // Add to display
                const display = document.getElementById('patternDisplay');
                const colorDiv = document.createElement('div');
                colorDiv.className = 'pattern-color';
                colorDiv.style.backgroundColor = color.hex;
                display.appendChild(colorDiv);
                
                // Check if pattern matches so far
                const index = this.playerPattern.length - 1;
                if (this.playerPattern[index].name !== this.currentPattern[index].name) {
                    // Wrong color
                    this.handleIncorrect(element);
                    return;
                }
                
                // Check if pattern is complete
                if (this.playerPattern.length === this.currentPattern.length) {
                    this.handleCorrectPattern();
                }
            }
            
            handleCorrectPattern() {
                this.score += this.level * 10;
                this.streak++;
                
                // Update display
                document.getElementById('score').textContent = this.score;
                document.getElementById('streak').textContent = this.streak;
                
                // Send progress to server
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'pattern_completed',
                        level: this.level,
                        score: this.score,
                        pattern: this.currentPattern.map(c => c.name),
                        time: Date.now() - this.startTime
                    }));
                }
                
                // Progress to next level or round
                const progressFill = document.getElementById('progressFill');
                const progress = (this.streak % 5) * 20;
                progressFill.style.width = progress + '%';
                
                if (this.streak % 5 === 0 && this.level < 6) {
                    this.levelUp();
                } else {
                    setTimeout(() => this.startNewRound(), 1500);
                }
            }
            
            handleIncorrect(element) {
                element.classList.add('incorrect');
                setTimeout(() => element.classList.remove('incorrect'), 500);
                
                this.streak = 0;
                document.getElementById('streak').textContent = this.streak;
                
                // Reset progress bar
                document.getElementById('progressFill').style.width = '0%';
                
                // Show pattern again
                setTimeout(() => {
                    document.getElementById('patternDisplay').innerHTML = '';
                    this.playerPattern = [];
                    this.showPattern();
                }, 1000);
            }
            
            levelUp() {
                this.level++;
                document.getElementById('level').textContent = this.level;
                
                const levelNames = {
                    1: 'Simple Sequences',
                    2: 'Growing Patterns',
                    3: 'Complex Chains',
                    4: 'Master Sequences',
                    5: 'Expert Patterns',
                    6: 'Ultimate Challenge'
                };
                
                document.getElementById('levelIndicator').textContent = 
                    \`Level \${this.level}: \${levelNames[this.level] || 'Ultimate Challenge'}\`;
                
                // Update color options for new level
                this.setupColorOptions();
                
                // Start new round at new level
                setTimeout(() => this.startNewRound(), 1500);
            }
            
            startTimer() {
                setInterval(() => {
                    const elapsed = Date.now() - this.startTime;
                    const minutes = Math.floor(elapsed / 60000);
                    const seconds = Math.floor((elapsed % 60000) / 1000);
                    document.getElementById('time').textContent = 
                        \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                }, 1000);
            }
            
            updateProgress(progress) {
                // Update local progress tracking
                console.log('Progress updated:', progress);
            }
        }
        
        // Start the game
        window.addEventListener('load', () => {
            new PatternPursuitGame();
        });
    </script>
</body>
</html>`;
    }
    
    generateEmotionExplorerGame() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>😊 Emotion Explorer - Color Education</title>
    <style>
        body {
            margin: 0;
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            font-family: Arial, sans-serif;
            color: #fff;
            overflow: hidden;
            height: 100vh;
        }
        
        .game-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .emotion-display {
            font-size: 5em;
            margin-bottom: 30px;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        
        .scenario-box {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            max-width: 600px;
            margin-bottom: 40px;
            backdrop-filter: blur(10px);
        }
        
        .scenario-text {
            font-size: 1.3em;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .emotion-question {
            font-size: 1.1em;
            opacity: 0.9;
            font-style: italic;
        }
        
        .color-emotions {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .emotion-color {
            width: 120px;
            height: 120px;
            border-radius: 20px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            border: 3px solid transparent;
            position: relative;
        }
        
        .emotion-color:hover {
            transform: scale(1.1);
            border-color: rgba(255, 255, 255, 0.5);
        }
        
        .emotion-label {
            position: absolute;
            bottom: -25px;
            font-size: 0.9em;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .feedback-area {
            position: fixed;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 20px 40px;
            border-radius: 30px;
            display: none;
            animation: slideUp 0.5s ease-out;
        }
        
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(100px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        .emotion-meter {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.6);
            padding: 20px;
            border-radius: 15px;
            width: 200px;
        }
        
        .meter-title {
            font-size: 1.1em;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .emotion-stat {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            align-items: center;
        }
        
        .emotion-bar {
            width: 100px;
            height: 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            overflow: hidden;
        }
        
        .emotion-fill {
            height: 100%;
            transition: width 0.5s ease;
            border-radius: 5px;
        }
        
        .social-cue {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 8em;
            opacity: 0;
            pointer-events: none;
        }
        
        .social-cue.show {
            animation: socialPulse 1s ease-out;
        }
        
        @keyframes socialPulse {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        
        .back-button {
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #fff;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            color: #fff;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <a href="/" class="back-button">← Back to Games</a>
        
        <div class="emotion-meter">
            <div class="meter-title">Emotional Intelligence</div>
            <div class="emotion-stat">
                <span>😊 Joy</span>
                <div class="emotion-bar">
                    <div class="emotion-fill" style="background: #ffff44; width: 0%;" id="joyBar"></div>
                </div>
            </div>
            <div class="emotion-stat">
                <span>😢 Sadness</span>
                <div class="emotion-bar">
                    <div class="emotion-fill" style="background: #4444ff; width: 0%;" id="sadnessBar"></div>
                </div>
            </div>
            <div class="emotion-stat">
                <span>😡 Anger</span>
                <div class="emotion-bar">
                    <div class="emotion-fill" style="background: #ff4444; width: 0%;" id="angerBar"></div>
                </div>
            </div>
            <div class="emotion-stat">
                <span>😨 Fear</span>
                <div class="emotion-bar">
                    <div class="emotion-fill" style="background: #ff44ff; width: 0%;" id="fearBar"></div>
                </div>
            </div>
            <div class="emotion-stat">
                <span>🤗 Calm</span>
                <div class="emotion-bar">
                    <div class="emotion-fill" style="background: #44ff44; width: 0%;" id="calmBar"></div>
                </div>
            </div>
        </div>
        
        <div class="emotion-display" id="emotionDisplay">
            😊
        </div>
        
        <div class="scenario-box">
            <div class="scenario-text" id="scenarioText">
                Your friend just shared some exciting news with you about getting their dream job!
            </div>
            <div class="emotion-question" id="emotionQuestion">
                What color best represents how they might be feeling?
            </div>
        </div>
        
        <div class="color-emotions" id="colorEmotions">
            <!-- Color options will be populated here -->
        </div>
        
        <div class="social-cue" id="socialCue"></div>
        
        <div class="feedback-area" id="feedbackArea">
            <div id="feedbackText"></div>
        </div>
    </div>
    
    <script>
        class EmotionExplorerGame {
            constructor() {
                this.ws = null;
                this.currentScenario = null;
                this.scenarios = [
                    {
                        text: "Your friend just shared some exciting news with you about getting their dream job!",
                        emotion: "joy",
                        emoji: "😊",
                        correctColors: ["yellow", "orange"],
                        socialCue: "🎉",
                        explanation: "Yellow and orange represent joy, excitement, and celebration!"
                    },
                    {
                        text: "A classmate is sitting alone at lunch, looking down at their food quietly.",
                        emotion: "sadness",
                        emoji: "😢",
                        correctColors: ["blue", "purple"],
                        socialCue: "💙",
                        explanation: "Blue often represents sadness or melancholy. They might need a friend."
                    },
                    {
                        text: "Someone cut in line at the store, and the person behind them is clenching their fists.",
                        emotion: "anger",
                        emoji: "😡",
                        correctColors: ["red", "orange"],
                        socialCue: "🔥",
                        explanation: "Red is associated with anger and frustration. Deep breaths help!"
                    },
                    {
                        text: "Your sibling is about to give a big presentation and keeps checking their notes.",
                        emotion: "fear",
                        emoji: "😨",
                        correctColors: ["purple", "pink"],
                        socialCue: "💜",
                        explanation: "Purple can represent anxiety or nervousness. Encouragement helps!"
                    },
                    {
                        text: "After meditation, your teacher has a peaceful smile and relaxed posture.",
                        emotion: "calm",
                        emoji: "🤗",
                        correctColors: ["green", "cyan"],
                        socialCue: "🍃",
                        explanation: "Green represents calmness and balance. Very zen!"
                    }
                ];
                
                this.emotionColors = [
                    { name: "red", hex: "#ff4444", emotions: ["anger", "excitement", "passion"] },
                    { name: "blue", hex: "#4444ff", emotions: ["sadness", "calm", "trust"] },
                    { name: "yellow", hex: "#ffff44", emotions: ["joy", "happiness", "energy"] },
                    { name: "green", hex: "#44ff44", emotions: ["calm", "growth", "balance"] },
                    { name: "purple", hex: "#ff44ff", emotions: ["fear", "mystery", "creativity"] },
                    { name: "orange", hex: "#ff8844", emotions: ["joy", "enthusiasm", "anger"] },
                    { name: "cyan", hex: "#44ffff", emotions: ["calm", "clarity", "peace"] },
                    { name: "pink", hex: "#ff88cc", emotions: ["love", "compassion", "fear"] }
                ];
                
                this.emotionScores = {
                    joy: 0,
                    sadness: 0,
                    anger: 0,
                    fear: 0,
                    calm: 0
                };
                
                this.totalAttempts = 0;
                this.correctAttempts = 0;
                
                this.init();
            }
            
            init() {
                this.connectWebSocket();
                this.setupColorOptions();
                this.loadNewScenario();
            }
            
            connectWebSocket() {
                const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(protocol + '//' + location.host);
                
                this.ws.onopen = () => {
                    this.ws.send(JSON.stringify({
                        type: 'game_start',
                        game: 'emotion_explorer'
                    }));
                };
            }
            
            setupColorOptions() {
                const container = document.getElementById('colorEmotions');
                container.innerHTML = '';
                
                this.emotionColors.forEach(color => {
                    const colorDiv = document.createElement('div');
                    colorDiv.className = 'emotion-color';
                    colorDiv.style.backgroundColor = color.hex;
                    colorDiv.innerHTML = \`<div class="emotion-label">\${color.name}</div>\`;
                    
                    colorDiv.addEventListener('click', () => {
                        this.handleColorChoice(color);
                    });
                    
                    container.appendChild(colorDiv);
                });
            }
            
            loadNewScenario() {
                // Pick random scenario
                this.currentScenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
                
                // Update display
                document.getElementById('emotionDisplay').textContent = this.currentScenario.emoji;
                document.getElementById('scenarioText').textContent = this.currentScenario.text;
                document.getElementById('emotionQuestion').textContent = 
                    "What color best represents how they might be feeling?";
                
                // Hide feedback
                document.getElementById('feedbackArea').style.display = 'none';
            }
            
            handleColorChoice(color) {
                this.totalAttempts++;
                
                const isCorrect = this.currentScenario.correctColors.includes(color.name);
                const feedbackArea = document.getElementById('feedbackArea');
                const feedbackText = document.getElementById('feedbackText');
                const socialCue = document.getElementById('socialCue');
                
                if (isCorrect) {
                    this.correctAttempts++;
                    
                    // Update emotion score
                    this.emotionScores[this.currentScenario.emotion]++;
                    this.updateEmotionBars();
                    
                    // Show positive feedback
                    feedbackText.innerHTML = \`
                        <div style="font-size: 1.5em; margin-bottom: 10px;">✨ Excellent!</div>
                        <div>\${this.currentScenario.explanation}</div>
                    \`;
                    feedbackArea.style.background = 'rgba(68, 255, 68, 0.2)';
                    
                    // Show social cue
                    socialCue.textContent = this.currentScenario.socialCue;
                    socialCue.classList.add('show');
                    setTimeout(() => socialCue.classList.remove('show'), 1000);
                    
                    // Send progress
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify({
                            type: 'emotion_identified',
                            emotion: this.currentScenario.emotion,
                            color: color.name,
                            correct: true,
                            accuracy: Math.round((this.correctAttempts / this.totalAttempts) * 100)
                        }));
                    }
                    
                    // Load new scenario after delay
                    setTimeout(() => this.loadNewScenario(), 3000);
                } else {
                    // Show hint
                    feedbackText.innerHTML = \`
                        <div style="font-size: 1.5em; margin-bottom: 10px;">🤔 Not quite...</div>
                        <div>Think about how \${this.currentScenario.emotion} usually feels. Try again!</div>
                    \`;
                    feedbackArea.style.background = 'rgba(255, 68, 68, 0.2)';
                }
                
                feedbackArea.style.display = 'block';
            }
            
            updateEmotionBars() {
                const maxScore = Math.max(...Object.values(this.emotionScores)) || 1;
                
                Object.entries(this.emotionScores).forEach(([emotion, score]) => {
                    const percentage = (score / maxScore) * 100;
                    document.getElementById(\`\${emotion}Bar\`).style.width = percentage + '%';
                });
            }
        }
        
        // Start the game
        window.addEventListener('load', () => {
            new EmotionExplorerGame();
        });
    </script>
</body>
</html>`;
    }
    
    // Additional game generators would follow similar patterns...
    
    generateColorClashGame() {
        // Multiplayer color strategy game
        return this.generateComingSoonPage('Color Clash', 'Multiplayer battles coming soon!');
    }
    
    generateSpectrumSolverGame() {
        // Color theory puzzle game
        return this.generateComingSoonPage('Spectrum Solver', 'Puzzles coming soon!');
    }
    
    generateHarmonyHunterGame() {
        // Color harmony creation game
        return this.generateComingSoonPage('Harmony Hunter', 'Create beautiful harmonies!');
    }
    
    generateSocialSpectrumGame() {
        // Collaborative color communication
        return this.generateComingSoonPage('Social Spectrum', 'Team challenges coming soon!');
    }
    
    generateComingSoonPage(gameName, message) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameName} - Coming Soon</title>
    <style>
        body {
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
        }
        .coming-soon {
            padding: 40px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .back-button {
            margin-top: 30px;
            padding: 15px 30px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid #fff;
            border-radius: 10px;
            color: #fff;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .back-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="coming-soon">
        <h1>🚧 ${gameName}</h1>
        <p style="font-size: 1.5em; margin: 20px 0;">${message}</p>
        <p>This educational game is under development.</p>
        <a href="/" class="back-button">← Back to Games</a>
    </div>
</body>
</html>`;
    }
    
    generate404Page() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Game Not Found</title>
</head>
<body style="text-align: center; padding: 50px; font-family: Arial;">
    <h1>404 - Game Not Found</h1>
    <p>The game you're looking for doesn't exist.</p>
    <a href="/">Back to Games</a>
</body>
</html>`;
    }
    
    initializeModules() {
        // Initialize each learning module
        Object.values(this.modules).forEach(module => {
            module.init();
        });
    }
    
    handleLearningMessage(session, data) {
        switch (data.type) {
            case 'game_start':
                this.startGame(session, data.game);
                break;
            case 'pattern_completed':
                this.modules.patternRecognition.processCompletion(session, data);
                break;
            case 'emotion_identified':
                this.modules.emotionalIntelligence.processIdentification(session, data);
                break;
            case 'social_interaction':
                this.modules.socialDynamics.processInteraction(session, data);
                break;
            case 'problem_solved':
                this.modules.problemSolving.processSolution(session, data);
                break;
            case 'color_harmony':
                this.modules.colorTheory.processHarmony(session, data);
                break;
        }
        
        // Update session metrics
        this.updateSessionMetrics(session, data);
    }
    
    updateSessionMetrics(session, data) {
        // Track all interactions for stealth assessment
        session.metrics.interactions.push({
            type: data.type,
            timestamp: Date.now(),
            data: data
        });
        
        // Calculate and broadcast progress
        const progress = this.calculateProgress(session);
        
        session.ws.send(JSON.stringify({
            type: 'progress_update',
            progress: progress
        }));
        
        // Check for achievements
        this.checkAchievements(session, progress);
    }
    
    calculateProgress(session) {
        const metrics = session.metrics;
        
        return {
            patterns: metrics.patterns.length,
            emotions: metrics.emotions.filter(e => e.correct).length,
            social: metrics.collaborations.length,
            accuracy: this.calculateAccuracy(metrics)
        };
    }
    
    calculateAccuracy(metrics) {
        const total = metrics.interactions.length;
        if (total === 0) return 100;
        
        const correct = metrics.interactions.filter(i => i.data.correct !== false).length;
        return Math.round((correct / total) * 100);
    }
    
    checkAchievements(session, progress) {
        const achievements = [];
        
        // Pattern master
        if (progress.patterns >= 10 && !session.achievements?.includes('pattern_master')) {
            achievements.push({
                id: 'pattern_master',
                title: 'Pattern Master',
                description: 'Completed 10 pattern sequences!'
            });
        }
        
        // Emotion expert
        if (progress.emotions >= 20 && !session.achievements?.includes('emotion_expert')) {
            achievements.push({
                id: 'emotion_expert',
                title: 'Emotion Expert',
                description: 'Correctly identified 20 emotions!'
            });
        }
        
        // Send achievements
        achievements.forEach(achievement => {
            session.ws.send(JSON.stringify({
                type: 'achievement',
                achievement: achievement
            }));
        });
        
        // Update session
        session.achievements = [...(session.achievements || []), ...achievements.map(a => a.id)];
    }
    
    startGame(session, gameId) {
        session.currentGame = gameId;
        const game = this.gameModes[gameId];
        
        console.log(`🎮 ${session.id} started ${game.name}`);
        
        // Track game start
        this.analytics.total_engagement_time = Date.now();
    }
    
    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        // Calculate session duration
        const duration = Date.now() - session.startTime;
        
        // Save session data
        this.saveSessionData(session);
        
        // Clean up
        this.sessions.delete(sessionId);
        
        console.log(`👋 Session ${sessionId} ended (${Math.round(duration / 1000)}s)`);
    }
    
    async saveSessionData(session) {
        // Save to file for analysis
        const data = {
            sessionId: session.id,
            studentId: session.studentId,
            duration: Date.now() - session.startTime,
            metrics: session.metrics,
            achievements: session.achievements,
            timestamp: new Date().toISOString()
        };
        
        const filename = `session-${session.id}.json`;
        const filepath = path.join(__dirname, 'education-data', filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save session data:', error);
        }
    }
    
    handleColorTrainingData(message) {
        // Process data from color training interface
        if (message.type === 'color_training_hit') {
            // Analyze color preferences for learning insights
            this.analyzeColorPreference(message.data);
        }
    }
    
    analyzeColorPreference(data) {
        // Use color preferences to adapt learning content
        const color = this.colorPalette.primary.find(c => c.name === data.color);
        if (color) {
            console.log(`📊 Student prefers ${color.emotion} learning (${color.learning})`);
        }
    }
    
    startAnalyticsEngine() {
        // Periodic analysis of learning patterns
        setInterval(() => {
            this.performAnalytics();
        }, 60000); // Every minute
    }
    
    performAnalytics() {
        // Analyze all active sessions
        for (const [sessionId, session] of this.sessions) {
            const insights = this.generateInsights(session);
            
            // Send insights to connected systems
            if (this.colorTrainingConnection?.readyState === WebSocket.OPEN) {
                this.colorTrainingConnection.send(JSON.stringify({
                    type: 'learning_insights',
                    sessionId: sessionId,
                    insights: insights
                }));
            }
        }
    }
    
    generateInsights(session) {
        const metrics = session.metrics;
        
        return {
            learning_style: this.detectLearningStyle(metrics),
            strengths: this.identifyStrengths(metrics),
            areas_for_growth: this.identifyGrowthAreas(metrics),
            engagement_level: this.calculateEngagement(metrics),
            recommendations: this.generateRecommendations(metrics)
        };
    }
    
    detectLearningStyle(metrics) {
        // Analyze interaction patterns to determine learning style
        const patternCount = metrics.patterns.length;
        const emotionCount = metrics.emotions.length;
        const socialCount = metrics.collaborations.length;
        
        if (patternCount > emotionCount && patternCount > socialCount) {
            return 'visual-sequential';
        } else if (emotionCount > patternCount && emotionCount > socialCount) {
            return 'emotional-intuitive';
        } else if (socialCount > patternCount && socialCount > emotionCount) {
            return 'social-collaborative';
        } else {
            return 'balanced-adaptive';
        }
    }
    
    identifyStrengths(metrics) {
        const strengths = [];
        
        // Pattern recognition strength
        const patternAccuracy = metrics.patterns.filter(p => p.correct).length / metrics.patterns.length;
        if (patternAccuracy > 0.8) {
            strengths.push('Strong pattern recognition');
        }
        
        // Emotional intelligence strength
        const emotionAccuracy = metrics.emotions.filter(e => e.correct).length / metrics.emotions.length;
        if (emotionAccuracy > 0.7) {
            strengths.push('High emotional intelligence');
        }
        
        return strengths;
    }
    
    identifyGrowthAreas(metrics) {
        const areas = [];
        
        // Check reaction times
        const avgReactionTime = metrics.interactions.reduce((sum, i) => sum + (i.reactionTime || 0), 0) / metrics.interactions.length;
        if (avgReactionTime > 5000) {
            areas.push('Processing speed');
        }
        
        return areas;
    }
    
    calculateEngagement(metrics) {
        // Calculate based on interaction frequency and session duration
        const interactionRate = metrics.interactions.length / ((Date.now() - metrics.interactions[0]?.timestamp) / 60000);
        
        if (interactionRate > 10) return 'high';
        if (interactionRate > 5) return 'medium';
        return 'low';
    }
    
    generateRecommendations(metrics) {
        const recommendations = [];
        
        const learningStyle = this.detectLearningStyle(metrics);
        
        switch (learningStyle) {
            case 'visual-sequential':
                recommendations.push('Try Harmony Hunter for advanced pattern work');
                break;
            case 'emotional-intuitive':
                recommendations.push('Social Spectrum will enhance empathy skills');
                break;
            case 'social-collaborative':
                recommendations.push('Color Clash for team-based challenges');
                break;
        }
        
        return recommendations;
    }
    
    getAnalytics() {
        return {
            ...this.analytics,
            active_sessions: this.sessions.size,
            assessment_metrics: this.assessmentMetrics
        };
    }
    
    getStudentProfile(studentId) {
        const student = this.students.get(studentId);
        if (!student) {
            return { error: 'Student not found' };
        }
        
        return {
            id: studentId,
            progress: student.progress,
            achievements: student.achievements,
            learning_style: student.learningStyle,
            strengths: student.strengths,
            recent_sessions: student.recentSessions
        };
    }
    
    async handleProgressUpdate(req, res) {
        // Handle progress updates from games
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            
            // Update student profile
            this.updateStudentProgress(data);
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
        });
    }
    
    updateStudentProgress(data) {
        const { studentId, progress } = data;
        
        if (!this.students.has(studentId)) {
            this.students.set(studentId, {
                id: studentId,
                progress: {},
                achievements: [],
                learningStyle: null,
                strengths: [],
                recentSessions: []
            });
        }
        
        const student = this.students.get(studentId);
        student.progress = { ...student.progress, ...progress };
        student.recentSessions.push({
            timestamp: Date.now(),
            progress: progress
        });
        
        // Keep only recent sessions
        if (student.recentSessions.length > 10) {
            student.recentSessions.shift();
        }
    }
}

// Learning Modules
class PatternRecognitionModule {
    init() {
        console.log('📐 Pattern Recognition Module initialized');
    }
    
    processCompletion(session, data) {
        session.metrics.patterns.push({
            level: data.level,
            pattern: data.pattern,
            time: data.time,
            correct: true
        });
    }
}

class EmotionalIntelligenceModule {
    init() {
        console.log('❤️  Emotional Intelligence Module initialized');
    }
    
    processIdentification(session, data) {
        session.metrics.emotions.push({
            emotion: data.emotion,
            color: data.color,
            correct: data.correct,
            accuracy: data.accuracy
        });
    }
}

class SocialDynamicsModule {
    init() {
        console.log('👥 Social Dynamics Module initialized');
    }
    
    processInteraction(session, data) {
        session.metrics.collaborations.push({
            type: data.interactionType,
            partners: data.partners,
            outcome: data.outcome
        });
    }
}

class ColorTheoryModule {
    init() {
        console.log('🎨 Color Theory Module initialized');
    }
    
    processHarmony(session, data) {
        // Process color harmony creation
    }
}

class ProblemSolvingModule {
    init() {
        console.log('🧩 Problem Solving Module initialized');
    }
    
    processSolution(session, data) {
        // Process puzzle solutions
    }
}

// Sequential Learning Monitor
class SequentialLearningMonitor {
    constructor(educationSystem) {
        this.system = educationSystem;
        this.sequences = new Map();
        this.progressTracking = new Map();
    }
    
    trackSequence(studentId, sequence) {
        if (!this.sequences.has(studentId)) {
            this.sequences.set(studentId, []);
        }
        
        this.sequences.get(studentId).push({
            sequence: sequence,
            timestamp: Date.now(),
            context: this.captureContext()
        });
        
        // Analyze for patterns
        this.analyzeSequencePatterns(studentId);
    }
    
    captureContext() {
        return {
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            sessionDuration: Date.now() - this.sessionStart
        };
    }
    
    analyzeSequencePatterns(studentId) {
        const sequences = this.sequences.get(studentId);
        if (sequences.length < 5) return;
        
        // Look for recurring patterns
        const patterns = this.findRecurringPatterns(sequences);
        
        if (patterns.length > 0) {
            console.log(`📊 Sequential patterns detected for student ${studentId}:`, patterns);
        }
    }
    
    findRecurringPatterns(sequences) {
        // Implementation for finding patterns in learning sequences
        return [];
    }
}

// Start the education system
if (require.main === module) {
    console.log('🎓 STARTING COLOR-CODED EDUCATION SYSTEM');
    console.log('======================================');
    console.log('🌈 Advanced learning through color psychology');
    console.log('🧠 Pattern recognition & emotional intelligence');
    console.log('🎮 Gamified educational experiences');
    console.log('');
    
    new ColorCodedEducationSystem();
}

module.exports = ColorCodedEducationSystem;
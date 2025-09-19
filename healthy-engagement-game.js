#!/usr/bin/env node

// 🎮🛡️ HEALTHY ENGAGEMENT GAME
// Like Line Rider/Snake/Pong - simple mechanics that rotate between building and safeguards
// The "game" is building real things with healthy cycles built in

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

class HealthyEngagementGame {
    constructor() {
        this.app = express();
        this.port = 9000;
        this.wsPort = 9001;
        
        // Game states that rotate like Snake/Pong
        this.gameStates = {
            BUILDING: 'building',           // Like moving the snake
            REFLECTION: 'reflection',       // Like bouncing off walls
            BREAK: 'break',                // Like game over/restart
            GUIDANCE: 'guidance',          // Like power-ups
            VALIDATION: 'validation'       // Like scoring points
        };
        
        // Current game state
        this.currentState = this.gameStates.BUILDING;
        
        // Game mechanics - simple like classic games
        this.gameRules = {
            // Building phase (like Snake eating food)
            building: {
                minDuration: 15 * 60 * 1000,    // 15 minutes minimum
                maxDuration: 25 * 60 * 1000,    // 25 minutes maximum
                progressRequired: true,          // Must show real work
                nextState: 'reflection'
            },
            
            // Reflection phase (like Pong ball bounce)
            reflection: {
                minDuration: 3 * 60 * 1000,     // 3 minutes minimum
                maxDuration: 5 * 60 * 1000,     // 5 minutes maximum
                questionsRequired: ['What did you build?', 'What did you learn?', 'What\'s next?'],
                nextState: 'building'
            },
            
            // Break phase (like Line Rider restart)
            break: {
                minDuration: 15 * 60 * 1000,    // 15 minutes minimum
                maxDuration: 30 * 60 * 1000,    // 30 minutes maximum
                awayFromScreen: true,
                nextState: 'building'
            },
            
            // Guidance phase (like getting power-ups)
            guidance: {
                minDuration: 5 * 60 * 1000,     // 5 minutes minimum
                maxDuration: 10 * 60 * 1000,    // 10 minutes maximum
                problemSolvingRequired: true,
                nextState: 'building'
            },
            
            // Validation phase (like scoring in Pong)
            validation: {
                minDuration: 2 * 60 * 1000,     // 2 minutes minimum
                maxDuration: 5 * 60 * 1000,     // 5 minutes maximum
                evidenceRequired: true,
                celebrationAllowed: true,
                nextState: 'reflection'
            }
        };
        
        // Player state (like game score/lives)
        this.players = new Map();
        
        // Game session tracking
        this.gameSessions = new Map();
        
        // Anti-addiction pattern detection
        this.addictionPatterns = {
            tooLongInOneState: 45 * 60 * 1000,      // 45 minutes
            tooManyValidationSeeks: 5,               // per hour
            avoidingBreaks: 3,                       // missed break opportunities
            showingWithdrawal: ['frustrated', 'need praise', 'validate me'],
            bingingBehavior: 4 * 60 * 60 * 1000     // 4 hours total
        };
        
        console.log('🎮🛡️ Healthy Engagement Game initialized');
        console.log('🔄 Simple rotation mechanics like classic games');
    }
    
    // Main game loop - like Snake/Pong update cycle
    async gameLoop() {
        setInterval(() => {
            this.updateAllGameStates();
            this.checkAntiAddictionTriggers();
            this.rotateStatesIfNeeded();
        }, 30000); // Check every 30 seconds
    }
    
    updateAllGameStates() {
        for (const [userId, session] of this.gameSessions) {
            const timeInState = Date.now() - session.stateStartTime;
            const currentStateRules = this.gameRules[session.currentState];
            
            // Auto-rotate if maximum time exceeded
            if (timeInState > currentStateRules.maxDuration) {
                this.rotateToState(session, currentStateRules.nextState);
            }
        }
    }
    
    checkAntiAddictionTriggers() {
        for (const [userId, session] of this.gameSessions) {
            const addictionCheck = this.checkAddictionPatterns(session, '');
            if (addictionCheck.triggered) {
                // Force break state
                session.currentState = this.gameStates.BREAK;
                session.stateStartTime = Date.now();
                session.addictionWarnings++;
                console.log(`🚨 Addiction trigger for user ${userId}: ${addictionCheck.patterns.join(', ')}`);
            }
        }
    }
    
    rotateStatesIfNeeded() {
        // Additional logic for intelligent state rotation
        for (const [userId, session] of this.gameSessions) {
            const totalSessionTime = Date.now() - session.startTime;
            
            // Force breaks after long sessions
            if (totalSessionTime > 2 * 60 * 60 * 1000 && session.breaksHonored < 2) { // 2 hours
                this.rotateToState(session, this.gameStates.BREAK);
            }
        }
    }
    
    async startGame(userId, goal) {
        const gameSession = {
            userId,
            goal,
            startTime: Date.now(),
            currentState: this.gameStates.BUILDING,
            stateStartTime: Date.now(),
            totalTime: 0,
            cycles: 0,
            realProgress: [],
            addictionWarnings: 0,
            healthScore: 100,
            
            // Game-like tracking
            buildingStreak: 0,
            reflectionDepth: 0,
            breaksHonored: 0,
            validationsEarned: 0
        };
        
        this.gameSessions.set(userId, gameSession);
        
        return {
            gameStarted: true,
            currentState: this.gameStates.BUILDING,
            message: 'Game started! Build something real for 15-25 minutes.',
            rules: this.explainCurrentStateRules(this.gameStates.BUILDING),
            healthyGameplay: 'Like Snake or Pong - simple rules, healthy cycles.'
        };
    }
    
    async processGameInput(userId, input, evidence = null) {
        const session = this.gameSessions.get(userId);
        if (!session) {
            return { error: 'Start a game first - what are you trying to build?' };
        }
        
        // Check addiction patterns first
        const addictionCheck = this.checkAddictionPatterns(session, input);
        if (addictionCheck.triggered) {
            return this.handleAddictionTrigger(session, addictionCheck);
        }
        
        // Process based on current game state
        return await this.processStateInput(session, input, evidence);
    }
    
    async processStateInput(session, input, evidence) {
        const currentState = session.currentState;
        const stateRules = this.gameRules[currentState];
        
        switch (currentState) {
            case this.gameStates.BUILDING:
                return await this.processBuildingState(session, input, evidence);
                
            case this.gameStates.REFLECTION:
                return await this.processReflectionState(session, input);
                
            case this.gameStates.BREAK:
                return await this.processBreakState(session, input);
                
            case this.gameStates.GUIDANCE:
                return await this.processGuidanceState(session, input);
                
            case this.gameStates.VALIDATION:
                return await this.processValidationState(session, input, evidence);
                
            default:
                return { error: 'Unknown game state' };
        }
    }
    
    async processBuildingState(session, input, evidence) {
        const timeInState = Date.now() - session.stateStartTime;
        const minTime = this.gameRules.building.minDuration;
        const maxTime = this.gameRules.building.maxDuration;
        
        // Check if they're actually building
        const isBuilding = this.detectBuilding(input);
        if (!isBuilding) {
            return {
                message: 'Focus on building! What are you creating right now?',
                gameState: 'building',
                timeRemaining: Math.max(0, minTime - timeInState),
                hint: 'Like Snake eating food - keep moving forward!'
            };
        }
        
        // Record building progress
        if (evidence) {
            session.realProgress.push({
                timestamp: Date.now(),
                evidence,
                state: 'building'
            });
            session.buildingStreak++;
        }
        
        // Check if time to rotate state
        if (timeInState >= minTime) {
            // Check if they want validation or need guidance
            if (input.toLowerCase().includes('done') || input.toLowerCase().includes('finished')) {
                return this.rotateToState(session, this.gameStates.VALIDATION);
            }
            
            if (input.toLowerCase().includes('stuck') || input.toLowerCase().includes('help')) {
                return this.rotateToState(session, this.gameStates.GUIDANCE);
            }
        }
        
        // Force rotation at max time (like Snake hitting wall)
        if (timeInState >= maxTime) {
            return this.rotateToState(session, this.gameStates.REFLECTION);
        }
        
        return {
            message: `Good building! Keep going for ${Math.max(0, Math.round((minTime - timeInState) / 60000))} more minutes.`,
            gameState: 'building',
            progress: session.buildingStreak,
            timeInState: Math.round(timeInState / 60000)
        };
    }
    
    async processReflectionState(session, input) {
        const timeInState = Date.now() - session.stateStartTime;
        const minTime = this.gameRules.reflection.minDuration;
        const requiredQuestions = this.gameRules.reflection.questionsRequired;
        
        // Check if they're reflecting properly
        const reflectionDepth = this.measureReflectionDepth(input);
        session.reflectionDepth = Math.max(session.reflectionDepth, reflectionDepth);
        
        if (reflectionDepth < 0.5) {
            return {
                message: 'Take a moment to really reflect. What did you actually build?',
                gameState: 'reflection',
                questions: requiredQuestions,
                hint: 'Like Pong bouncing - use this pause to redirect your energy!'
            };
        }
        
        // Allow rotation after minimum time with good reflection
        if (timeInState >= minTime && session.reflectionDepth >= 0.7) {
            session.cycles++;
            return this.rotateToState(session, this.gameStates.BUILDING);
        }
        
        return {
            message: 'Good reflection! Take a moment to process what you learned.',
            gameState: 'reflection',
            reflectionDepth: session.reflectionDepth,
            timeRemaining: Math.max(0, Math.round((minTime - timeInState) / 60000))
        };
    }
    
    async processBreakState(session, input) {
        const timeInState = Date.now() - session.stateStartTime;
        const minTime = this.gameRules.break.minDuration;
        
        // Detect if they're trying to skip the break (addiction pattern)
        if (input.toLowerCase().includes('skip') || input.toLowerCase().includes('continue building')) {
            session.addictionWarnings++;
            return {
                message: 'Breaks are part of healthy building. Step away from the screen.',
                gameState: 'break',
                addictionWarning: 'Trying to skip breaks is an addiction pattern.',
                timeRemaining: Math.max(0, Math.round((minTime - timeInState) / 60000)),
                hint: 'Like Line Rider reset - you need this pause to build better!'
            };
        }
        
        // Allow return after minimum break time
        if (timeInState >= minTime) {
            session.breaksHonored++;
            session.healthScore += 10; // Reward healthy behavior
            return this.rotateToState(session, this.gameStates.BUILDING);
        }
        
        return {
            message: 'Take your break! Go for a walk, stretch, drink water.',
            gameState: 'break',
            timeRemaining: Math.max(0, Math.round((minTime - timeInState) / 60000)),
            healthBonus: 'Taking breaks improves your building quality!'
        };
    }
    
    async processGuidanceState(session, input) {
        const timeInState = Date.now() - session.stateStartTime;
        const minTime = this.gameRules.guidance.minDuration;
        
        // Provide systematic guidance
        const guidance = this.generateGuidance(input, session);
        
        if (timeInState >= minTime) {
            return this.rotateToState(session, this.gameStates.BUILDING);
        }
        
        return {
            message: guidance.message,
            gameState: 'guidance',
            steps: guidance.steps,
            timeRemaining: Math.max(0, Math.round((minTime - timeInState) / 60000)),
            hint: 'Like getting a power-up - use this guidance to build better!'
        };
    }
    
    async processValidationState(session, input, evidence) {
        const timeInState = Date.now() - session.stateStartTime;
        const minTime = this.gameRules.validation.minDuration;
        
        if (!evidence) {
            return {
                message: 'Show me what works! Evidence required for validation.',
                gameState: 'validation',
                requirement: 'Provide working code, screenshot, or demo',
                hint: 'Like scoring in Pong - you need to actually hit the target!'
            };
        }
        
        // Validate the evidence
        const validation = this.validateEvidence(evidence);
        if (validation.valid) {
            session.validationsEarned++;
            session.healthScore += 5;
            
            if (timeInState >= minTime) {
                return this.rotateToState(session, this.gameStates.REFLECTION);
            }
            
            return {
                message: `Excellent! That's real progress: ${validation.description}`,
                gameState: 'validation',
                celebration: true,
                validationsEarned: session.validationsEarned,
                hint: 'Like getting points in Snake - you earned this!'
            };
        }
        
        return {
            message: 'I need to see actual working functionality to validate this.',
            gameState: 'validation',
            evidenceRequired: true
        };
    }
    
    rotateToState(session, newState) {
        const oldState = session.currentState;
        session.currentState = newState;
        session.stateStartTime = Date.now();
        
        console.log(`🔄 Player ${session.userId}: ${oldState} → ${newState}`);
        
        return {
            stateRotation: true,
            oldState,
            newState,
            message: this.getStateTransitionMessage(oldState, newState),
            rules: this.explainCurrentStateRules(newState),
            gameMetrics: this.getGameMetrics(session)
        };
    }
    
    checkAddictionPatterns(session, input) {
        const patterns = this.addictionPatterns;
        const triggers = [];
        
        // Too long in one state
        const timeInState = Date.now() - session.stateStartTime;
        if (timeInState > patterns.tooLongInOneState) {
            triggers.push('excessive_time_in_state');
        }
        
        // Seeking too much validation
        const hourAgo = Date.now() - 60 * 60 * 1000;
        const recentValidations = session.realProgress.filter(p => p.timestamp > hourAgo).length;
        if (recentValidations > patterns.tooManyValidationSeeks) {
            triggers.push('validation_seeking');
        }
        
        // Avoiding breaks
        if (session.addictionWarnings > patterns.avoidingBreaks) {
            triggers.push('break_avoidance');
        }
        
        // Check for withdrawal language
        const lowerInput = input.toLowerCase();
        const showingWithdrawal = patterns.showingWithdrawal.some(phrase => 
            lowerInput.includes(phrase)
        );
        if (showingWithdrawal) {
            triggers.push('withdrawal_symptoms');
        }
        
        // Total session time binging
        const totalTime = Date.now() - session.startTime;
        if (totalTime > patterns.bingingBehavior) {
            triggers.push('binge_behavior');
        }
        
        return {
            triggered: triggers.length > 0,
            patterns: triggers
        };
    }
    
    handleAddictionTrigger(session, addictionCheck) {
        session.addictionWarnings++;
        session.healthScore -= 20;
        
        const forcedBreakTime = 30 * 60 * 1000; // 30 minutes
        
        return {
            addictionTrigger: true,
            patterns: addictionCheck.patterns,
            message: 'Addiction patterns detected. Forced break time.',
            forcedState: this.gameStates.BREAK,
            breakDuration: forcedBreakTime,
            healthScore: session.healthScore,
            explanation: 'Like Game Over in classic games - reset and try again healthier!',
            resources: [
                'Take a real break away from screens',
                'Go for a walk or do physical activity', 
                'Talk to someone about what you\'re building',
                'Come back when you feel refreshed'
            ]
        };
    }
    
    detectBuilding(input) {
        const buildingIndicators = [
            /writing.*code/i, /implementing/i, /creating/i, /building/i,
            /debugging/i, /fixing/i, /testing/i, /deploying/i
        ];
        
        return buildingIndicators.some(pattern => pattern.test(input));
    }
    
    measureReflectionDepth(input) {
        const reflectionIndicators = [
            /learned/i, /realized/i, /discovered/i, /understand/i,
            /next.*step/i, /will.*do/i, /challenge/i, /solution/i
        ];
        
        const depth = reflectionIndicators.reduce((score, pattern) => {
            return score + (pattern.test(input) ? 0.2 : 0);
        }, 0);
        
        return Math.min(1.0, depth + (input.length > 100 ? 0.3 : 0));
    }
    
    generateGuidance(input, session) {
        // Simple guidance based on common problems
        if (input.includes('stuck')) {
            return {
                message: 'Let\'s debug this systematically.',
                steps: [
                    'What was the last thing that worked?',
                    'What error message are you seeing?',
                    'Can you reproduce it in a simpler case?'
                ]
            };
        }
        
        if (input.includes('don\'t know')) {
            return {
                message: 'Let\'s break this into learnable pieces.',
                steps: [
                    'What exactly are you trying to achieve?',
                    'What\'s the simplest version that could work?',
                    'What resources could help you learn this?'
                ]
            };
        }
        
        return {
            message: 'Focus on the next small step.',
            steps: [
                'Define what success looks like',
                'Identify the smallest buildable piece',
                'Take one concrete action'
            ]
        };
    }
    
    validateEvidence(evidence) {
        // Simple evidence validation
        if (evidence.screenshot || evidence.demo || evidence.workingCode) {
            return {
                valid: true,
                description: 'Functional demonstration provided'
            };
        }
        
        if (evidence.description && evidence.description.length > 50) {
            return {
                valid: true,
                description: 'Detailed progress description'
            };
        }
        
        return {
            valid: false,
            reason: 'Need working demo or detailed description'
        };
    }
    
    explainCurrentStateRules(state) {
        const rules = this.gameRules[state];
        const explanations = {
            building: 'Build something real for 15-25 minutes. Like Snake - keep moving forward!',
            reflection: 'Take 3-5 minutes to think about what you built and learned.',
            break: 'Step away from the screen for 15-30 minutes. Like Line Rider reset!',
            guidance: 'Get help with your specific problem for 5-10 minutes.',
            validation: 'Show working evidence for 2-5 minutes. Like scoring in Pong!'
        };
        
        return {
            description: explanations[state],
            minTime: Math.round(rules.minDuration / 60000),
            maxTime: Math.round(rules.maxDuration / 60000),
            gameAnalogy: this.getGameAnalogy(state)
        };
    }
    
    getStateTransitionMessage(oldState, newState) {
        const transitions = {
            'building→reflection': 'Good building session! Time to reflect like Pong bouncing.',
            'building→validation': 'Show me what you built! Time to score points.',
            'building→guidance': 'Let\'s get you unstuck! Power-up time.',
            'reflection→building': 'Good reflection! Back to building like Snake moving.',
            'validation→reflection': 'Nice work! Now reflect on what you achieved.',
            'break→building': 'Refreshed! Ready to build again.',
            'guidance→building': 'Now you have direction! Back to building.'
        };
        
        return transitions[`${oldState}→${newState}`] || 'State rotated - keep going!';
    }
    
    getGameAnalogy(state) {
        const analogies = {
            building: 'Like Snake eating food - steady progress forward',
            reflection: 'Like Pong ball bouncing - pause and redirect',
            break: 'Like Line Rider reset - fresh start needed',
            guidance: 'Like getting power-ups - special help available',
            validation: 'Like scoring points - earn your rewards'
        };
        
        return analogies[state];
    }
    
    getGameMetrics(session) {
        return {
            cycles: session.cycles,
            buildingStreak: session.buildingStreak,
            reflectionDepth: session.reflectionDepth,
            breaksHonored: session.breaksHonored,
            validationsEarned: session.validationsEarned,
            healthScore: session.healthScore,
            totalTime: Math.round((Date.now() - session.startTime) / 60000)
        };
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.send(this.renderGameInterface());
        });
        
        this.app.post('/api/game/start', async (req, res) => {
            const { userId, goal } = req.body;
            const result = await this.startGame(userId, goal);
            res.json(result);
        });
        
        this.app.post('/api/game/input', async (req, res) => {
            const { userId, input, evidence } = req.body;
            const result = await this.processGameInput(userId, input, evidence);
            res.json(result);
        });
        
        this.app.get('/api/game/status/:userId', (req, res) => {
            const session = this.gameSessions.get(req.params.userId);
            if (!session) {
                return res.status(404).json({ error: 'Game not found' });
            }
            
            res.json({
                currentState: session.currentState,
                timeInState: Date.now() - session.stateStartTime,
                metrics: this.getGameMetrics(session),
                rules: this.explainCurrentStateRules(session.currentState)
            });
        });
    }
    
    renderGameInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎮🛡️ Healthy Engagement Game</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        .game-container { max-width: 800px; margin: 0 auto; background: #001100; padding: 20px; border: 2px solid #0f0; }
        .state-display { font-size: 24px; text-align: center; margin: 20px 0; padding: 10px; border: 1px solid #0f0; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
        .metric { text-align: center; padding: 10px; border: 1px solid #0f0; }
        .input-area { margin: 20px 0; }
        input, textarea { background: #002200; color: #0f0; border: 1px solid #0f0; padding: 10px; width: 100%; }
        button { background: #0f0; color: #000; border: none; padding: 10px 20px; margin: 5px; cursor: pointer; }
        .rules { background: #001100; border: 1px solid #0f0; padding: 15px; margin: 10px 0; }
        .warning { background: #330000; border: 1px solid #f00; color: #f00; padding: 15px; }
    </style>
</head>
<body>
    <div class="game-container">
        <h1>🎮🛡️ HEALTHY ENGAGEMENT GAME</h1>
        <p>Like Snake/Pong/Line Rider - Simple mechanics, healthy cycles!</p>
        
        <div id="setup">
            <h2>Start Game</h2>
            <input type="text" id="goalInput" placeholder="What are you building? (Be specific)">
            <button onclick="startGame()">▶️ START GAME</button>
        </div>
        
        <div id="game" style="display: none;">
            <div class="state-display" id="currentState">BUILDING</div>
            
            <div class="metrics">
                <div class="metric">Cycles<br><span id="cycles">0</span></div>
                <div class="metric">Health Score<br><span id="healthScore">100</span></div>
                <div class="metric">Time<br><span id="timeInState">0m</span></div>
            </div>
            
            <div class="rules" id="stateRules">
                Build something real for 15-25 minutes. Like Snake - keep moving forward!
            </div>
            
            <div class="input-area">
                <input type="text" id="actionInput" placeholder="What are you doing right now?">
                <textarea id="evidenceInput" placeholder="Evidence (code, screenshot, demo link...)"></textarea>
                <button onclick="sendAction()">🎮 GAME ACTION</button>
            </div>
            
            <div id="gameResponse"></div>
            <div id="addictionWarning" class="warning" style="display: none;"></div>
        </div>
    </div>
    
    <script>
        let currentUserId = 'player_' + Date.now();
        let gameActive = false;
        
        async function startGame() {
            const goal = document.getElementById('goalInput').value;
            if (!goal) return;
            
            const response = await fetch('/api/game/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, goal })
            });
            
            const result = await response.json();
            
            if (result.gameStarted) {
                document.getElementById('setup').style.display = 'none';
                document.getElementById('game').style.display = 'block';
                gameActive = true;
                updateGameDisplay(result);
                startGameLoop();
            }
        }
        
        async function sendAction() {
            const action = document.getElementById('actionInput').value;
            const evidence = document.getElementById('evidenceInput').value;
            
            const response = await fetch('/api/game/input', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUserId, 
                    input: action,
                    evidence: evidence ? { description: evidence, demo: true } : null
                })
            });
            
            const result = await response.json();
            updateGameDisplay(result);
            
            document.getElementById('actionInput').value = '';
            document.getElementById('evidenceInput').value = '';
        }
        
        function updateGameDisplay(result) {
            if (result.addictionTrigger) {
                const warning = document.getElementById('addictionWarning');
                warning.innerHTML = \`
                    <strong>🚨 ADDICTION PATTERN DETECTED</strong><br>
                    \${result.message}<br>
                    Patterns: \${result.patterns.join(', ')}<br>
                    \${result.explanation}
                \`;
                warning.style.display = 'block';
                return;
            }
            
            if (result.currentState || result.newState) {
                const state = result.newState || result.currentState || result.gameState;
                document.getElementById('currentState').textContent = state.toUpperCase();
            }
            
            if (result.rules) {
                document.getElementById('stateRules').innerHTML = \`
                    <strong>\${result.rules.description}</strong><br>
                    Time: \${result.rules.minTime}-\${result.rules.maxTime} minutes<br>
                    \${result.rules.gameAnalogy}
                \`;
            }
            
            const responseDiv = document.getElementById('gameResponse');
            responseDiv.innerHTML = \`
                <div style="background: #002200; padding: 10px; margin: 10px 0; border: 1px solid #0f0;">
                    \${result.message || result.explanation || 'Game active'}
                    \${result.hint ? \`<br><em>\${result.hint}</em>\` : ''}
                    \${result.celebration ? '<br>🎉 VALIDATION EARNED!' : ''}
                </div>
            \`;
        }
        
        async function updateStatus() {
            if (!gameActive) return;
            
            const response = await fetch(\`/api/game/status/\${currentUserId}\`);
            const status = await response.json();
            
            if (status.metrics) {
                document.getElementById('cycles').textContent = status.metrics.cycles;
                document.getElementById('healthScore').textContent = status.metrics.healthScore;
                document.getElementById('timeInState').textContent = 
                    Math.round(status.timeInState / 60000) + 'm';
            }
        }
        
        function startGameLoop() {
            setInterval(updateStatus, 10000); // Update every 10 seconds
        }
    </script>
</body>
</html>`;
    }
    
    async start() {
        this.setupRoutes();
        this.gameLoop(); // Start the game loop
        
        this.app.listen(this.port, () => {
            console.log(`🎮🛡️ Healthy Engagement Game running on port ${this.port}`);
            console.log(`🌐 Interface: http://localhost:${this.port}`);
            console.log(`🔄 Game states rotating like Snake/Pong/Line Rider`);
            console.log(`🛡️ Anti-addiction safeguards integrated into gameplay`);
        });
    }
}

if (require.main === module) {
    const game = new HealthyEngagementGame();
    game.start().catch(console.error);
}

module.exports = HealthyEngagementGame;
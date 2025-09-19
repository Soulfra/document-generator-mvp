#!/usr/bin/env node

// 🧠💚 THERAPEUTIC COACHING SYSTEM
// Live therapy support where praise helps people build real things
// Anti-addiction design focused on genuine progress and problem-solving

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs').promises;

class TherapeuticCoachingSystem {
    constructor() {
        this.app = express();
        this.port = 8088;
        this.wsPort = 8089;
        
        // NOT reward-based - progress-based
        this.activeProjects = new Map();
        this.coachingSessions = new Map();
        this.realProgress = new Map();
        this.blockers = new Map();
        
        // Therapeutic patterns (not reward patterns)
        this.therapeuticResponses = {
            // Identifying real problems
            stuck: { response: 'help_identify_blocker', action: 'analyze_obstacle' },
            frustrated: { response: 'break_down_problem', action: 'simplify_approach' },
            overwhelmed: { response: 'prioritize_next_step', action: 'focus_scope' },
            confused: { response: 'clarify_goal', action: 'define_objective' },
            
            // Real progress recognition (not empty praise)
            'made progress': { response: 'acknowledge_step', action: 'identify_next_milestone' },
            'figured out': { response: 'capture_learning', action: 'document_solution' },
            'built something': { response: 'validate_function', action: 'test_real_usage' },
            'it works': { response: 'celebrate_functionality', action: 'expand_capability' },
            
            // Coaching interventions
            'need help': { response: 'offer_collaboration', action: 'pair_program' },
            'not working': { response: 'debug_together', action: 'systematic_troubleshoot' },
            'don\'t know how': { response: 'break_into_learnable_steps', action: 'find_resources' }
        };
        
        // Anti-addiction safeguards
        this.healthyEngagement = {
            maxSessionTime: 90 * 60 * 1000, // 90 minutes max
            breakReminders: 25 * 60 * 1000, // 25 minute focus blocks
            realProgressRequired: true, // Must show actual building
            noEmptyRewards: true, // No rewards without real progress
            focusOnSingleGoal: true // One project at a time
        };
        
        console.log('🧠💚 Therapeutic Coaching System initialized');
        console.log('🚫 Anti-addiction safeguards enabled');
        console.log('✅ Focus on real progress and problem-solving');
    }
    
    async startCoachingSession(userId, goal) {
        const sessionId = crypto.randomUUID();
        
        const session = {
            id: sessionId,
            userId,
            goal: goal, // What they're actually trying to build
            startTime: Date.now(),
            realProgressMade: [],
            blockers: [],
            breakthroughs: [],
            currentFocus: null,
            nextSteps: [],
            sessionNotes: '',
            coachingInterventions: 0,
            actualBuilding: false // Are they actually building something?
        };
        
        this.coachingSessions.set(sessionId, session);
        
        console.log(`🎯 New coaching session: ${goal}`);
        
        return {
            sessionId,
            message: `Let's help you build: ${goal}. What's the first real step you need to take?`,
            focusQuestion: 'What specifically are you trying to create or solve?',
            antiAddiction: 'This session will focus on real progress, not empty rewards.'
        };
    }
    
    async processTherapeuticInput(sessionId, input, context = {}) {
        const session = this.coachingSessions.get(sessionId);
        if (!session) {
            return { error: 'Session not found. Start with a real goal you want to achieve.' };
        }
        
        // Check session health
        const sessionDuration = Date.now() - session.startTime;
        if (sessionDuration > this.healthyEngagement.maxSessionTime) {
            return this.suggestBreak(session);
        }
        
        // Analyze input for therapeutic response
        const analysis = await this.analyzeTherapeuticNeed(input, session);
        
        // Generate coaching response (not reward)
        const response = await this.generateCoachingResponse(analysis, session);
        
        // Track real progress (not fake progress)
        if (analysis.realProgress) {
            await this.recordRealProgress(session, analysis.realProgress);
        }
        
        // Identify blockers
        if (analysis.blocker) {
            await this.recordBlocker(session, analysis.blocker);
        }
        
        return response;
    }
    
    async analyzeTherapeuticNeed(input, session) {
        const lowerInput = input.toLowerCase();
        
        // Check for real progress indicators
        const progressIndicators = [
            /built.*that.*works/i,
            /solved.*the.*problem/i,
            /figured.*out.*how/i,
            /got.*it.*working/i,
            /deployed.*successfully/i,
            /users.*are.*using/i,
            /tests.*are.*passing/i
        ];
        
        const realProgress = progressIndicators.some(pattern => pattern.test(input));
        
        // Check for blockers
        const blockerIndicators = [
            /stuck.*on/i,
            /can't.*figure.*out/i,
            /error.*keeps.*happening/i,
            /don't.*know.*how.*to/i,
            /not.*working/i,
            /broken/i
        ];
        
        const blocker = blockerIndicators.some(pattern => pattern.test(input));
        
        // Identify therapeutic pattern
        let therapeuticPattern = null;
        for (const [pattern, config] of Object.entries(this.therapeuticResponses)) {
            if (lowerInput.includes(pattern)) {
                therapeuticPattern = { pattern, config };
                break;
            }
        }
        
        return {
            realProgress,
            blocker,
            therapeuticPattern,
            needsCoaching: blocker || !realProgress,
            actualBuilding: this.detectActualBuilding(input),
            emotionalState: this.detectEmotionalState(input)
        };
    }
    
    async generateCoachingResponse(analysis, session) {
        let response = {
            sessionId: session.id,
            coachingType: 'therapeutic',
            message: '',
            actionSteps: [],
            nextFocus: '',
            progressValidation: null,
            healthCheck: this.checkSessionHealth(session)
        };
        
        if (analysis.realProgress) {
            // Acknowledge REAL progress, not empty praise
            response.message = `Great! You made real progress. Let's validate this works and identify what to build next.`;
            response.actionSteps = [
                'Test that this actually functions as intended',
                'Document what you learned for future reference',
                'Identify the next functional piece to build'
            ];
            response.progressValidation = await this.validateRealProgress(analysis.realProgress, session);
            
        } else if (analysis.blocker) {
            // Help solve the actual problem
            response.message = `I see you're blocked. Let's break this down into solvable pieces.`;
            response.actionSteps = await this.generateDebugSteps(analysis.blocker, session);
            response.nextFocus = 'Focus on the smallest step that could work';
            
        } else if (analysis.therapeuticPattern) {
            // Apply therapeutic intervention
            const pattern = analysis.therapeuticPattern;
            response.message = await this.applyTherapeuticIntervention(pattern, session);
            response.actionSteps = await this.generateTherapeuticSteps(pattern, session);
            
        } else {
            // General coaching guidance
            response.message = `Let's focus on what you're actually trying to build. What's the next concrete step?`;
            response.actionSteps = [
                'Define exactly what success looks like',
                'Identify the smallest buildable piece',
                'Take one actionable step right now'
            ];
        }
        
        // Anti-addiction check
        if (!analysis.actualBuilding) {
            response.antiAddictionWarning = 'Are you actually building something, or just talking about it? Let\'s focus on real action.';
        }
        
        return response;
    }
    
    detectActualBuilding(input) {
        const buildingIndicators = [
            /writing.*code/i,
            /creating.*file/i,
            /implementing/i,
            /building.*feature/i,
            /deploying/i,
            /testing.*with.*users/i,
            /debugging/i,
            /fixing.*bug/i
        ];
        
        return buildingIndicators.some(pattern => pattern.test(input));
    }
    
    detectEmotionalState(input) {
        const emotions = {
            frustrated: /frustrated|annoyed|stuck|can't/i,
            excited: /excited|amazing|breakthrough|solved/i,
            overwhelmed: /overwhelmed|too much|complex|don't know where/i,
            focused: /working on|building|implementing|debugging/i,
            confused: /confused|don't understand|unclear|what does/i
        };
        
        for (const [emotion, pattern] of Object.entries(emotions)) {
            if (pattern.test(input)) {
                return emotion;
            }
        }
        
        return 'neutral';
    }
    
    async applyTherapeuticIntervention(patternInfo, session) {
        const { pattern, config } = patternInfo;
        
        switch (config.action) {
            case 'analyze_obstacle':
                return `Let's identify exactly what's blocking you. Can you describe the specific error or problem you're facing?`;
                
            case 'simplify_approach':
                return `This feels overwhelming. Let's break it into the smallest possible step you could take right now.`;
                
            case 'focus_scope':
                return `You're trying to do too much at once. What's the single most important thing that needs to work first?`;
                
            case 'define_objective':
                return `Let's get clear on the goal. What exactly are you trying to build, and how will you know it's working?`;
                
            case 'pair_program':
                return `I'm here to work through this with you. Share your screen or code, and let's solve this together.`;
                
            case 'systematic_troubleshoot':
                return `Let's debug this systematically. What was the last thing that worked? What changed?`;
                
            default:
                return `Let's focus on making real progress on your project.`;
        }
    }
    
    async generateDebugSteps(blocker, session) {
        return [
            'Reproduce the problem in the simplest possible way',
            'Check the error message carefully - what is it actually saying?',
            'Try the last known working version',
            'Make one small change and test',
            'If still stuck, ask for specific help with the exact error'
        ];
    }
    
    async generateTherapeuticSteps(patternInfo, session) {
        const { config } = patternInfo;
        
        const stepMappings = {
            'analyze_obstacle': [
                'Write down the exact error or problem',
                'Identify what you expected vs what happened',
                'Check if this worked before - what changed?'
            ],
            'break_down_problem': [
                'List all the things this needs to do',
                'Pick the simplest one',
                'Build just that one piece first'
            ],
            'validate_function': [
                'Test this with real data/users',
                'Document what works and what doesn\'t',
                'Identify what to build next'
            ]
        };
        
        return stepMappings[config.action] || [
            'Define the next concrete step',
            'Take that step',
            'Test if it works'
        ];
    }
    
    async recordRealProgress(session, progress) {
        session.realProgressMade.push({
            timestamp: Date.now(),
            description: progress,
            validated: false // Needs to be tested/confirmed
        });
        
        session.actualBuilding = true;
        console.log(`✅ Real progress recorded: ${progress}`);
    }
    
    async recordBlocker(session, blocker) {
        session.blockers.push({
            timestamp: Date.now(),
            description: blocker,
            resolved: false,
            attempts: []
        });
        
        console.log(`🚧 Blocker recorded: ${blocker}`);
    }
    
    checkSessionHealth(session) {
        const duration = Date.now() - session.startTime;
        const progressCount = session.realProgressMade.length;
        const blockerCount = session.blockers.filter(b => !b.resolved).length;
        
        return {
            duration,
            realProgress: progressCount,
            activeBlockers: blockerCount,
            needsBreak: duration > this.healthyEngagement.breakReminders,
            actuallyBuilding: session.actualBuilding
        };
    }
    
    suggestBreak(session) {
        return {
            message: 'You\'ve been at this for a while. Real progress takes time and rest.',
            suggestion: 'Take a 15-minute break, then come back with fresh eyes.',
            sessionSummary: {
                realProgress: session.realProgressMade.length,
                blockers: session.blockers.length,
                actualBuilding: session.actualBuilding
            },
            antiAddiction: 'Healthy building requires breaks and reflection.'
        };
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main therapeutic interface
        this.app.get('/', (req, res) => {
            res.send(this.renderTherapeuticInterface());
        });
        
        // Start coaching session with real goal
        this.app.post('/api/coaching/start', async (req, res) => {
            const { userId, goal } = req.body;
            
            if (!goal || goal.trim().length < 10) {
                return res.json({
                    error: 'You need a specific goal. What are you actually trying to build or solve?'
                });
            }
            
            const session = await this.startCoachingSession(userId, goal);
            res.json(session);
        });
        
        // Process therapeutic input
        this.app.post('/api/coaching/input', async (req, res) => {
            const { sessionId, input, context } = req.body;
            
            const response = await this.processTherapeuticInput(sessionId, input, context);
            res.json(response);
        });
        
        // Get session progress (real progress only)
        this.app.get('/api/coaching/progress/:sessionId', async (req, res) => {
            const session = this.coachingSessions.get(req.params.sessionId);
            
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            res.json({
                goal: session.goal,
                realProgress: session.realProgressMade,
                activeBlockers: session.blockers.filter(b => !b.resolved),
                actualBuilding: session.actualBuilding,
                healthCheck: this.checkSessionHealth(session)
            });
        });
    }
    
    renderTherapeuticInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Therapeutic Coaching - Build Real Things</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .coaching-container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .anti-addiction-notice {
            background: #e8f5e8;
            border: 1px solid #4caf50;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .goal-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .coaching-response {
            background: #f0f8ff;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 15px 0;
        }
        .progress-tracker {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .blocker-alert {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        button {
            background: #2196f3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        .health-check {
            font-size: 0.9em;
            color: #666;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="coaching-container">
        <h1>🧠💚 Therapeutic Coaching System</h1>
        
        <div class="anti-addiction-notice">
            <strong>🚫 Anti-Addiction Design:</strong> This system focuses on real progress and problem-solving, 
            not empty rewards or dopamine hits. You'll build actual things that work.
        </div>
        
        <div id="goal-setup">
            <h2>What are you trying to build?</h2>
            <input type="text" class="goal-input" id="goalInput" 
                   placeholder="Be specific: 'A working login system' or 'Fix the payment bug that's blocking users'">
            <button onclick="startCoaching()">Start Therapeutic Coaching</button>
        </div>
        
        <div id="coaching-session" style="display: none;">
            <h2 id="currentGoal"></h2>
            
            <div class="progress-tracker">
                <h3>Real Progress Made</h3>
                <div id="realProgress">No progress recorded yet. Let's start building!</div>
            </div>
            
            <div id="activeBlockers" style="display: none;" class="blocker-alert">
                <h3>Current Blockers</h3>
                <div id="blockersList"></div>
            </div>
            
            <div>
                <h3>What's happening right now?</h3>
                <input type="text" class="goal-input" id="statusInput" 
                       placeholder="I'm stuck on... / I just built... / I need help with...">
                <button onclick="sendUpdate()">Get Coaching</button>
            </div>
            
            <div id="coachingResponse" class="coaching-response" style="display: none;"></div>
            
            <div class="health-check" id="healthCheck"></div>
        </div>
    </div>
    
    <script>
        let currentSessionId = null;
        
        async function startCoaching() {
            const goal = document.getElementById('goalInput').value;
            if (!goal || goal.length < 10) {
                alert('Please describe specifically what you want to build or solve.');
                return;
            }
            
            const response = await fetch('/api/coaching/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user1', goal })
            });
            
            const result = await response.json();
            if (result.error) {
                alert(result.error);
                return;
            }
            
            currentSessionId = result.sessionId;
            document.getElementById('currentGoal').textContent = goal;
            document.getElementById('goal-setup').style.display = 'none';
            document.getElementById('coaching-session').style.display = 'block';
            
            showCoachingResponse(result.message);
        }
        
        async function sendUpdate() {
            const input = document.getElementById('statusInput').value;
            if (!input) return;
            
            const response = await fetch('/api/coaching/input', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: currentSessionId, input })
            });
            
            const result = await response.json();
            showCoachingResponse(result);
            
            document.getElementById('statusInput').value = '';
            
            // Update progress display
            updateProgressDisplay();
        }
        
        function showCoachingResponse(response) {
            const div = document.getElementById('coachingResponse');
            
            let html = \`<strong>Coach:</strong> \${response.message || response}<br>\`;
            
            if (response.actionSteps) {
                html += '<br><strong>Next Steps:</strong><ul>';
                response.actionSteps.forEach(step => {
                    html += \`<li>\${step}</li>\`;
                });
                html += '</ul>';
            }
            
            if (response.antiAddictionWarning) {
                html += \`<br><div style="color: #ff6b6b;"><strong>⚠️ \${response.antiAddictionWarning}</strong></div>\`;
            }
            
            div.innerHTML = html;
            div.style.display = 'block';
        }
        
        async function updateProgressDisplay() {
            if (!currentSessionId) return;
            
            const response = await fetch(\`/api/coaching/progress/\${currentSessionId}\`);
            const progress = await response.json();
            
            // Update real progress
            const progressDiv = document.getElementById('realProgress');
            if (progress.realProgress.length > 0) {
                progressDiv.innerHTML = progress.realProgress.map(p => 
                    \`<div>✅ \${p.description}</div>\`
                ).join('');
            }
            
            // Update blockers
            const blockersDiv = document.getElementById('activeBlockers');
            if (progress.activeBlockers.length > 0) {
                blockersDiv.style.display = 'block';
                document.getElementById('blockersList').innerHTML = 
                    progress.activeBlockers.map(b => \`<div>🚧 \${b.description}</div>\`).join('');
            } else {
                blockersDiv.style.display = 'none';
            }
            
            // Health check
            const healthDiv = document.getElementById('healthCheck');
            const health = progress.healthCheck;
            healthDiv.innerHTML = \`
                Session: \${Math.round(health.duration / 60000)} minutes | 
                Real Progress: \${health.realProgress} | 
                Actually Building: \${health.actuallyBuilding ? '✅' : '❌'}
                \${health.needsBreak ? '<br><strong>💚 Consider taking a break!</strong>' : ''}
            \`;
        }
        
        // Update progress every 30 seconds
        setInterval(updateProgressDisplay, 30000);
    </script>
</body>
</html>`;
    }
    
    async start() {
        this.setupRoutes();
        
        this.app.listen(this.port, () => {
            console.log(`🧠💚 Therapeutic Coaching System running on port ${this.port}`);
            console.log(`🌐 Interface: http://localhost:${this.port}`);
            console.log(`🚫 Anti-addiction safeguards enabled`);
            console.log(`✅ Focus on real progress and actual building`);
        });
    }
}

// Start the therapeutic coaching system
if (require.main === module) {
    const coach = new TherapeuticCoachingSystem();
    coach.start().catch(console.error);
}

module.exports = TherapeuticCoachingSystem;
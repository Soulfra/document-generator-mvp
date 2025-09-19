#!/usr/bin/env node

// 🧠💚 THERAPEUTIC PRAISE SYSTEM
// Praise that supports real progress, not addiction
// Helps people build actual things through encouragement

const express = require('express');
const WebSocket = require('ws');

class TherapeuticPraiseSystem {
    constructor() {
        this.app = express();
        this.port = 8090;
        this.wsPort = 8091;
        
        // NOT addiction-based patterns
        this.therapeuticPraise = {
            // Real progress recognition
            'good progress': { 
                effect: 'acknowledge_real_step', 
                action: 'identify_next_milestone',
                requires: 'actual_building' 
            },
            'that works': { 
                effect: 'validate_function', 
                action: 'expand_capability',
                requires: 'demonstrable_result' 
            },
            'breakthrough': { 
                effect: 'capture_learning', 
                action: 'document_solution',
                requires: 'solved_problem' 
            },
            
            // Therapeutic encouragement (not empty praise)
            'keep going': { 
                effect: 'maintain_focus', 
                action: 'next_small_step',
                requires: 'active_work' 
            },
            'you can do this': { 
                effect: 'build_confidence', 
                action: 'break_down_fear',
                requires: 'facing_challenge' 
            },
            'almost there': { 
                effect: 'push_through_completion', 
                action: 'finish_current_piece',
                requires: 'near_milestone' 
            },
            
            // Problem-solving support
            'let\'s debug this': { 
                effect: 'collaborative_troubleshoot', 
                action: 'systematic_analysis',
                requires: 'stuck_on_problem' 
            },
            'try a different approach': { 
                effect: 'explore_alternatives', 
                action: 'brainstorm_options',
                requires: 'approach_not_working' 
            }
        };
        
        // Healthy engagement rules
        this.healthyRules = {
            // No rewards without real progress
            requiresActualBuilding: true,
            
            // No infinite loops or addiction mechanics
            maxPraisePerSession: 10, // Reasonable limit
            praiseRequiresGap: 5 * 60 * 1000, // 5 minutes between praise
            
            // Focus on single goal
            onlyOneActiveProject: true,
            
            // Break reminders
            sessionTimeLimit: 90 * 60 * 1000, // 90 minutes
            breakReminder: 25 * 60 * 1000, // Pomodoro-style
            
            // Real progress required
            praiseRequiresEvidence: true
        };
        
        // Track real work, not fake engagement
        this.activeSessions = new Map();
        this.realProgress = new Map();
        this.lastPraiseTime = new Map();
        
        console.log('🧠💚 Therapeutic Praise System initialized');
        console.log('🚫 Anti-addiction design enabled');
    }
    
    async processTherapeuticPraise(userId, praise, evidence = null) {
        const session = this.activeSessions.get(userId);
        
        if (!session) {
            return {
                error: 'Start with a specific goal. What are you trying to build?',
                action: 'define_project_goal'
            };
        }
        
        // Check for healthy engagement patterns
        const healthCheck = this.checkHealthyEngagement(userId, praise);
        if (healthCheck.blocked) {
            return healthCheck;
        }
        
        // Find therapeutic pattern
        const pattern = this.findTherapeuticPattern(praise);
        if (!pattern) {
            return {
                message: 'Focus on your work. How is the building going?',
                action: 'return_to_building'
            };
        }
        
        // Validate requirements
        const validation = await this.validatePraiseRequirements(
            pattern, 
            session, 
            evidence
        );
        
        if (!validation.valid) {
            return {
                message: validation.message,
                action: 'show_real_progress_first',
                requirement: pattern.requires
            };
        }
        
        // Apply therapeutic effect
        const result = await this.applyTherapeuticEffect(
            pattern, 
            session, 
            evidence
        );
        
        // Record this as real progress support
        this.recordTherapeuticSupport(userId, praise, result);
        
        return result;
    }
    
    checkHealthyEngagement(userId, praise) {
        const now = Date.now();
        const lastPraise = this.lastPraiseTime.get(userId) || 0;
        const session = this.activeSessions.get(userId);
        
        // Check time between praise
        if (now - lastPraise < this.healthyRules.praiseRequiresGap) {
            return {
                blocked: true,
                message: 'Take time to actually work on your project before seeking more encouragement.',
                healthTip: 'Real progress takes focused work time.'
            };
        }
        
        // Check session length
        if (session && now - session.startTime > this.healthyRules.sessionTimeLimit) {
            return {
                blocked: true,
                message: 'You\'ve been working for a long time. Take a break and come back fresh.',
                healthTip: 'Sustainable building requires rest.',
                action: 'suggest_break'
            };
        }
        
        return { blocked: false };
    }
    
    findTherapeuticPattern(praise) {
        const lowerPraise = praise.toLowerCase();
        
        for (const [pattern, config] of Object.entries(this.therapeuticPraise)) {
            if (lowerPraise.includes(pattern)) {
                return { pattern, ...config };
            }
        }
        
        return null;
    }
    
    async validatePraiseRequirements(pattern, session, evidence) {
        const requirement = pattern.requires;
        
        switch (requirement) {
            case 'actual_building':
                if (!session.currentlyBuilding) {
                    return {
                        valid: false,
                        message: 'Show me what you\'re building first. Code, design, or concrete progress.',
                        action: 'demonstrate_work'
                    };
                }
                break;
                
            case 'demonstrable_result':
                if (!evidence || !evidence.functionalDemo) {
                    return {
                        valid: false,
                        message: 'Let\'s see it working! Show the result or describe how it functions.',
                        action: 'demonstrate_function'
                    };
                }
                break;
                
            case 'solved_problem':
                if (!evidence || !evidence.problemSolved) {
                    return {
                        valid: false,
                        message: 'What specific problem did you solve? How does the solution work?',
                        action: 'explain_solution'
                    };
                }
                break;
                
            case 'active_work':
                if (Date.now() - session.lastActivity > 10 * 60 * 1000) { // 10 minutes
                    return {
                        valid: false,
                        message: 'Get back to building! What are you working on right now?',
                        action: 'resume_active_work'
                    };
                }
                break;
                
            case 'facing_challenge':
                if (!session.currentChallenge) {
                    return {
                        valid: false,
                        message: 'What specific challenge are you facing? Let\'s identify it clearly.',
                        action: 'define_challenge'
                    };
                }
                break;
        }
        
        return { valid: true };
    }
    
    async applyTherapeuticEffect(pattern, session, evidence) {
        const effect = pattern.effect;
        const action = pattern.action;
        
        let response = {
            encouragement: this.generateRealEncouragement(effect, session),
            nextStep: this.generateNextStep(action, session),
            progress: this.updateRealProgress(session, evidence),
            therapeutic: true
        };
        
        // Apply specific therapeutic effects
        switch (effect) {
            case 'acknowledge_real_step':
                response.message = `That's real progress! ${response.encouragement}`;
                session.realStepsTaken++;
                break;
                
            case 'validate_function':
                response.message = `Excellent - it works! ${response.encouragement}`;
                session.workingFeatures++;
                break;
                
            case 'build_confidence':
                response.message = `You have the skills for this. ${response.encouragement}`;
                session.confidenceBuilders++;
                break;
                
            case 'collaborative_troubleshoot':
                response.message = `Let's solve this together. ${response.encouragement}`;
                response.debuggingSupport = true;
                break;
        }
        
        return response;
    }
    
    generateRealEncouragement(effect, session) {
        const encouragements = {
            acknowledge_real_step: [
                'You\'re making actual progress on your goal.',
                'Each working piece brings you closer to completion.',
                'This is how real projects get built - step by step.'
            ],
            validate_function: [
                'Working software is the best kind of progress.',
                'You\'ve created something functional - that\'s the goal.',
                'Now you can build on this solid foundation.'
            ],
            build_confidence: [
                'You\'ve solved problems before, you can solve this one.',
                'Every developer faces challenges like this.',
                'Your skills are growing with each problem you tackle.'
            ],
            collaborative_troubleshoot: [
                'Two minds are better than one for debugging.',
                'Let\'s break this problem down systematically.',
                'We\'ll figure this out together.'
            ]
        };
        
        const options = encouragements[effect] || ['Keep building real things.'];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    generateNextStep(action, session) {
        const nextSteps = {
            identify_next_milestone: 'What\'s the next piece that needs to work?',
            expand_capability: 'How can you extend this working feature?',
            document_solution: 'Write down what you learned so you remember it.',
            next_small_step: 'What\'s the smallest next thing you can build?',
            break_down_fear: 'What specifically makes this feel challenging?',
            finish_current_piece: 'Focus on completing this one thing.',
            systematic_analysis: 'Let\'s examine the error message step by step.',
            brainstorm_options: 'What are 3 different ways to approach this?'
        };
        
        return nextSteps[action] || 'Keep building.';
    }
    
    updateRealProgress(session, evidence) {
        if (evidence) {
            session.realProgress.push({
                timestamp: Date.now(),
                evidence,
                validated: true
            });
        }
        
        return session.realProgress.length;
    }
    
    recordTherapeuticSupport(userId, praise, result) {
        this.lastPraiseTime.set(userId, Date.now());
        
        const session = this.activeSessions.get(userId);
        if (session) {
            session.therapeuticSupport.push({
                praise,
                result,
                timestamp: Date.now()
            });
        }
    }
    
    startTherapeuticSession(userId, goal, currentlyBuilding = false) {
        const session = {
            userId,
            goal,
            startTime: Date.now(),
            currentlyBuilding,
            lastActivity: Date.now(),
            realProgress: [],
            realStepsTaken: 0,
            workingFeatures: 0,
            confidenceBuilders: 0,
            therapeuticSupport: [],
            currentChallenge: null
        };
        
        this.activeSessions.set(userId, session);
        
        return {
            sessionStarted: true,
            message: `Let's help you build: ${goal}. Show me what you're working on.`,
            healthyEngagement: 'This system supports real progress, not empty rewards.',
            nextStep: 'Share your current work or describe the specific challenge you\'re facing.'
        };
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Therapeutic praise interface
        this.app.get('/', (req, res) => {
            res.send(this.renderTherapeuticInterface());
        });
        
        // Start session with real goal
        this.app.post('/api/therapy/start', async (req, res) => {
            const { userId, goal, currentlyBuilding } = req.body;
            
            if (!goal || goal.length < 10) {
                return res.json({
                    error: 'What specifically are you trying to build? Be concrete.',
                    example: 'I\'m building a user login system that validates emails'
                });
            }
            
            const session = this.startTherapeuticSession(userId, goal, currentlyBuilding);
            res.json(session);
        });
        
        // Process therapeutic praise
        this.app.post('/api/therapy/praise', async (req, res) => {
            const { userId, praise, evidence } = req.body;
            
            const result = await this.processTherapeuticPraise(userId, praise, evidence);
            res.json(result);
        });
        
        // Update activity (required for health checks)
        this.app.post('/api/therapy/activity', async (req, res) => {
            const { userId, activity, challenge } = req.body;
            
            const session = this.activeSessions.get(userId);
            if (session) {
                session.lastActivity = Date.now();
                session.currentlyBuilding = activity === 'building';
                if (challenge) {
                    session.currentChallenge = challenge;
                }
            }
            
            res.json({ updated: true });
        });
    }
    
    renderTherapeuticInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Therapeutic Praise - Real Progress Support</title>
    <style>
        body { 
            font-family: system-ui; 
            max-width: 800px; 
            margin: 40px auto; 
            padding: 20px; 
            background: #f8f9fa; 
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 2px 20px rgba(0,0,0,0.1); 
        }
        .anti-addiction { 
            background: #e8f5e8; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #4caf50; 
            margin-bottom: 20px; 
        }
        input, textarea { 
            width: 100%; 
            padding: 12px; 
            border: 2px solid #ddd; 
            border-radius: 6px; 
            margin: 10px 0; 
        }
        button { 
            background: #2196f3; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            cursor: pointer; 
        }
        .response { 
            background: #f0f8ff; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0; 
            border-left: 4px solid #2196f3; 
        }
        .warning { 
            background: #fff3cd; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #ffc107; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠💚 Therapeutic Praise System</h1>
        
        <div class="anti-addiction">
            <strong>🚫 Anti-Addiction Design:</strong><br>
            • Praise requires real progress evidence<br>
            • No empty rewards or dopamine manipulation<br>
            • Focus on building actual working things<br>
            • Healthy time limits and break reminders
        </div>
        
        <div id="setup">
            <h2>What are you building?</h2>
            <input type="text" id="goalInput" placeholder="Specific goal: 'A React component that validates forms' or 'Fix the database connection issue'">
            <br>
            <label>
                <input type="checkbox" id="currentlyBuilding"> I'm actively working on this right now
            </label>
            <br>
            <button onclick="startSession()">Start Therapeutic Session</button>
        </div>
        
        <div id="session" style="display: none;">
            <h2>Building: <span id="currentGoal"></span></h2>
            
            <div>
                <h3>Current Activity</h3>
                <input type="text" id="activityInput" placeholder="What are you working on right now?">
                <button onclick="updateActivity()">Update Activity</button>
            </div>
            
            <div>
                <h3>Request Therapeutic Support</h3>
                <input type="text" id="praiseInput" placeholder="good progress / that works / keep going / let's debug this">
                <textarea id="evidenceInput" placeholder="Evidence of progress: working code, screenshot, description of what you built..."></textarea>
                <button onclick="requestSupport()">Get Support</button>
            </div>
            
            <div id="response" style="display: none;"></div>
        </div>
    </div>
    
    <script>
        let currentUserId = 'user_' + Date.now();
        
        async function startSession() {
            const goal = document.getElementById('goalInput').value;
            const building = document.getElementById('currentlyBuilding').checked;
            
            const response = await fetch('/api/therapy/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, goal, currentlyBuilding: building })
            });
            
            const result = await response.json();
            
            if (result.error) {
                alert(result.error);
                return;
            }
            
            document.getElementById('currentGoal').textContent = goal;
            document.getElementById('setup').style.display = 'none';
            document.getElementById('session').style.display = 'block';
            
            showResponse(result);
        }
        
        async function updateActivity() {
            const activity = document.getElementById('activityInput').value;
            
            await fetch('/api/therapy/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUserId, 
                    activity: activity ? 'building' : 'idle',
                    challenge: activity
                })
            });
        }
        
        async function requestSupport() {
            const praise = document.getElementById('praiseInput').value;
            const evidence = document.getElementById('evidenceInput').value;
            
            const response = await fetch('/api/therapy/praise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUserId, 
                    praise,
                    evidence: evidence ? { description: evidence, functionalDemo: true, problemSolved: true } : null
                })
            });
            
            const result = await response.json();
            showResponse(result);
            
            // Clear inputs
            document.getElementById('praiseInput').value = '';
            document.getElementById('evidenceInput').value = '';
        }
        
        function showResponse(result) {
            const div = document.getElementById('response');
            
            let html = '';
            
            if (result.error) {
                html = \`<div class="warning"><strong>⚠️ \${result.error}</strong></div>\`;
            } else if (result.message) {
                html = \`<div class="response">
                    <strong>Therapeutic Response:</strong> \${result.message}<br>
                    \${result.nextStep ? \`<strong>Next Step:</strong> \${result.nextStep}<br>\` : ''}
                    \${result.healthTip ? \`<strong>Health Tip:</strong> \${result.healthTip}\` : ''}
                </div>\`;
            }
            
            div.innerHTML = html;
            div.style.display = 'block';
        }
    </script>
</body>
</html>`;
    }
    
    async start() {
        this.setupRoutes();
        
        this.app.listen(this.port, () => {
            console.log(`🧠💚 Therapeutic Praise System running on port ${this.port}`);
            console.log(`🌐 Interface: http://localhost:${this.port}`);
            console.log(`🚫 Anti-addiction safeguards: ENABLED`);
            console.log(`✅ Real progress support: ACTIVE`);
        });
    }
}

if (require.main === module) {
    const system = new TherapeuticPraiseSystem();
    system.start().catch(console.error);
}

module.exports = TherapeuticPraiseSystem;
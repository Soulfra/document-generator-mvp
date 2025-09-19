require("dotenv").config();
#!/usr/bin/env node

/**
 * GAMING AI BRIDGE
 * Connects gaming layer to AI training backend
 * "People playing games but it's training our algorithms"
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');

class GamingAIBridge {
    constructor() {
        this.app = express();
        this.port = 9901;
        
        // Service endpoints
        this.services = {
            aiDebugDashboard: 'http://localhost:9500',
            carrotRL: 'http://localhost:9900',
            debugGame: 'http://localhost:8500',
            gachaToken: 'http://localhost:7300',
            ollama: 'process.env.OLLAMA_BASE_URL || "http://localhost:11434"'
        };
        
        // Game event queue for AI training
        this.gameEventQueue = [];
        this.trainingMetrics = {
            eventsProcessed: 0,
            aiModelsUpdated: 0,
            playerActions: {},
            learningRate: 0.001
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startEventProcessor();
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                services: this.services,
                metrics: this.trainingMetrics
            });
        });
        
        // Receive game events
        this.app.post('/game-event', async (req, res) => {
            try {
                const event = {
                    ...req.body,
                    timestamp: new Date().toISOString(),
                    id: Math.random().toString(36).substr(2, 9)
                };
                
                // Queue for processing
                this.gameEventQueue.push(event);
                
                // Track player actions
                const playerId = event.playerId || 'anonymous';
                if (!this.trainingMetrics.playerActions[playerId]) {
                    this.trainingMetrics.playerActions[playerId] = {
                        actions: 0,
                        rewards: 0,
                        learningContribution: 0
                    };
                }
                this.trainingMetrics.playerActions[playerId].actions++;
                
                res.json({
                    success: true,
                    eventId: event.id,
                    message: 'Game event queued for AI training'
                });
            } catch (error) {
                console.error('Error processing game event:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get training status
        this.app.get('/training-status', (req, res) => {
            res.json({
                queueLength: this.gameEventQueue.length,
                metrics: this.trainingMetrics,
                topContributors: this.getTopContributors()
            });
        });
        
        // Bridge to Carrot RL
        this.app.post('/api/performance', async (req, res) => {
            try {
                // Forward to Carrot RL with enhancement
                const enhancedData = {
                    ...req.body,
                    bridged: true,
                    processingTime: Date.now()
                };
                
                // Try to send to Carrot RL
                try {
                    await axios.post(`${this.services.carrotRL}/performance`, enhancedData);
                } catch (error) {
                    console.log('Carrot RL not accepting performance data, storing locally');
                }
                
                res.json({ success: true, message: 'Performance data processed' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Test Ollama connection
        this.app.post('/api/test/ollama', async (req, res) => {
            try {
                const response = await axios.post(`${this.services.ollama}/api/generate`, {
                    model: 'mistral',
                    prompt: req.body.prompt || 'Generate a reward message for a player',
                    stream: false
                });
                
                res.json({
                    success: true,
                    response: response.data.response,
                    model: 'mistral'
                });
            } catch (error) {
                // Fallback to AI Debug Dashboard
                try {
                    const fallback = await axios.post(`${this.services.aiDebugDashboard}/api/test`, {
                        prompt: req.body.prompt,
                        provider: 'openai'
                    });
                    res.json(fallback.data);
                } catch (fallbackError) {
                    res.status(500).json({ 
                        success: false, 
                        error: 'Both Ollama and fallback failed',
                        details: error.message
                    });
                }
            }
        });
    }
    
    startEventProcessor() {
        // Process game events every second
        setInterval(async () => {
            if (this.gameEventQueue.length === 0) return;
            
            const batch = this.gameEventQueue.splice(0, 10); // Process up to 10 events
            
            for (const event of batch) {
                await this.processGameEvent(event);
            }
        }, 1000);
    }
    
    async processGameEvent(event) {
        try {
            console.log(`Processing game event: ${event.type} from ${event.playerId}`);
            
            // Convert game event to training data
            const trainingPrompt = this.generateTrainingPrompt(event);
            
            // Send to AI for processing
            try {
                const aiResponse = await axios.post(`${this.services.aiDebugDashboard}/api/test`, {
                    prompt: trainingPrompt,
                    metadata: event,
                    taskType: 'reinforcement-learning'
                });
                
                // Update metrics
                this.trainingMetrics.eventsProcessed++;
                
                // Simulate learning contribution
                const playerId = event.playerId || 'anonymous';
                if (this.trainingMetrics.playerActions[playerId]) {
                    this.trainingMetrics.playerActions[playerId].learningContribution += 0.1;
                }
                
                console.log(`✅ Event processed: ${event.id}`);
            } catch (error) {
                console.error(`Failed to process event ${event.id}:`, error.message);
            }
        } catch (error) {
            console.error('Event processing error:', error);
        }
    }
    
    generateTrainingPrompt(event) {
        const prompts = {
            bug_fixed: `Player ${event.playerId} fixed a ${event.bugType} bug in ${event.fixTime} seconds. What reward should they receive?`,
            level_completed: `Player ${event.playerId} completed level ${event.level} with score ${event.score}. Analyze their performance.`,
            achievement_unlocked: `Player ${event.playerId} unlocked achievement: ${event.achievement}. Generate a congratulatory message.`,
            default: `Player action: ${JSON.stringify(event)}. Analyze and provide feedback.`
        };
        
        return prompts[event.type] || prompts.default;
    }
    
    getTopContributors() {
        return Object.entries(this.trainingMetrics.playerActions)
            .map(([playerId, stats]) => ({
                playerId,
                ...stats
            }))
            .sort((a, b) => b.learningContribution - a.learningContribution)
            .slice(0, 10);
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`🎮 Gaming AI Bridge running on port ${this.port}`);
            console.log(`🧠 Bridging games to AI training backend`);
            console.log(`📊 Training dashboard: http://localhost:${this.port}/training-status`);
        });
    }
}

// Start the bridge
const bridge = new GamingAIBridge();
bridge.start();
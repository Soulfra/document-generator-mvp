#!/usr/bin/env node

/**
 * 🎈 DOMINGO ABSTRACT PACKAGE WRAPPER
 * 
 * Clean API interface that abstracts away all the complexity
 * Makes the orchestrator system callable, forkable, and deployable
 */

const EventEmitter = require('events');

class DomingoOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Core settings with defaults
            port: config.port || process.env.DOMINGO_PORT || 7777,
            wsPort: config.wsPort || process.env.DOMINGO_WS_PORT || 7778,
            dbUrl: config.dbUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_generator',
            
            // Character customization
            characters: config.characters || this.getDefaultCharacters(),
            
            // Visual customization
            colors: {
                primary: config.colors?.primary || '#8a2be2',  // Purple
                success: config.colors?.success || '#00ff00',  // Green
                warning: config.colors?.warning || '#ffaa00',  // Orange
                error: config.colors?.error || '#ff0000',      // Red
                ...config.colors
            },
            
            // Feature flags
            features: {
                forum: config.features?.forum !== false,
                testing: config.features?.testing !== false,
                database: config.features?.database !== false,
                websocket: config.features?.websocket !== false,
                ...config.features
            },
            
            // Plugin hooks
            hooks: {
                onTaskCreate: config.hooks?.onTaskCreate || null,
                onTaskAssign: config.hooks?.onTaskAssign || null,
                onChatMessage: config.hooks?.onChatMessage || null,
                onCharacterAction: config.hooks?.onCharacterAction || null,
                ...config.hooks
            },
            
            ...config
        };
        
        // Internal components (lazy loaded)
        this._server = null;
        this._forumBridge = null;
        this._testingInterface = null;
        this._isRunning = false;
    }
    
    /**
     * Start the orchestrator system
     */
    async start() {
        if (this._isRunning) {
            throw new Error('Orchestrator is already running');
        }
        
        try {
            // Lazy load the server component
            const DomingoOrchestratorServer = require('./domingo-orchestrator-server');
            
            this._server = new DomingoOrchestratorServer(this.config);
            await this._server.initialize();
            
            this._isRunning = true;
            this.emit('started', {
                port: this.config.port,
                wsPort: this.config.wsPort,
                features: this.config.features
            });
            
            return {
                success: true,
                urls: {
                    orchestrator: `http://localhost:${this.config.port}`,
                    websocket: `ws://localhost:${this.config.wsPort}/ws`,
                    testing: this.config.features.testing ? `http://localhost:7779` : null
                }
            };
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Stop the orchestrator system
     */
    async stop() {
        if (!this._isRunning) {
            return { success: true, message: 'Orchestrator was not running' };
        }
        
        try {
            if (this._server) {
                // Close server connections
                await new Promise(resolve => {
                    this._server.server.close(resolve);
                });
                
                // Close database connection
                if (this._server.db) {
                    await this._server.db.end();
                }
                
                // Close WebSocket connections
                if (this._server.wss) {
                    this._server.wss.clients.forEach(client => client.close());
                    this._server.wss.close();
                }
            }
            
            this._isRunning = false;
            this.emit('stopped');
            
            return { success: true, message: 'Orchestrator stopped successfully' };
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Create a task programmatically
     */
    async createTask(taskData) {
        if (!this._isRunning) {
            throw new Error('Orchestrator must be running to create tasks');
        }
        
        const task = {
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            tags: taskData.tags || [],
            assignTo: taskData.assignTo || null
        };
        
        // Use hook if provided
        if (this.config.hooks.onTaskCreate) {
            task = await this.config.hooks.onTaskCreate(task);
        }
        
        // Create via server API
        const response = await this._makeRequest('/api/tasks', 'POST', task);
        
        this.emit('taskCreated', response.task);
        return response.task;
    }
    
    /**
     * Send a chat message to Domingo
     */
    async chat(message) {
        if (!this._isRunning) {
            throw new Error('Orchestrator must be running to chat');
        }
        
        // Use hook if provided
        if (this.config.hooks.onChatMessage) {
            message = await this.config.hooks.onChatMessage(message);
        }
        
        const response = await this._makeRequest('/api/chat', 'POST', { message });
        
        this.emit('chatResponse', response);
        return response;
    }
    
    /**
     * Get system status
     */
    async getStatus() {
        if (!this._isRunning) {
            return { running: false };
        }
        
        const response = await this._makeRequest('/api/system-status');
        return response.status;
    }
    
    /**
     * Get all tasks
     */
    async getTasks() {
        if (!this._isRunning) {
            throw new Error('Orchestrator must be running to get tasks');
        }
        
        const response = await this._makeRequest('/api/tasks');
        return response.tasks;
    }
    
    /**
     * Get all characters
     */
    async getCharacters() {
        if (!this._isRunning) {
            return this.config.characters;
        }
        
        const response = await this._makeRequest('/api/characters');
        return response.characters;
    }
    
    /**
     * Assign a task to a character
     */
    async assignTask(taskId, characterId) {
        if (!this._isRunning) {
            throw new Error('Orchestrator must be running to assign tasks');
        }
        
        // Use hook if provided
        if (this.config.hooks.onTaskAssign) {
            await this.config.hooks.onTaskAssign(taskId, characterId);
        }
        
        // Send via WebSocket for real-time update
        if (this._server && this._server.wss) {
            this._server.broadcast({
                type: 'character_assign',
                taskId,
                characterId
            });
        }
        
        this.emit('taskAssigned', { taskId, characterId });
        return { success: true, taskId, characterId };
    }
    
    /**
     * Add a custom character
     */
    addCharacter(character) {
        const newChar = {
            id: character.id || `custom-${Date.now()}`,
            name: character.name,
            role: character.role,
            specializations: character.specializations || [],
            emoji: character.emoji || '🤖',
            status: 'available',
            activeTask: null,
            ...character
        };
        
        this.config.characters.push(newChar);
        
        if (this._server) {
            this._server.characterRoster.push(newChar);
        }
        
        this.emit('characterAdded', newChar);
        return newChar;
    }
    
    /**
     * Register a plugin
     */
    use(plugin) {
        if (typeof plugin.install === 'function') {
            plugin.install(this);
        } else if (typeof plugin === 'function') {
            plugin(this);
        }
        
        return this;
    }
    
    /**
     * Get default character roster
     */
    getDefaultCharacters() {
        return [
            {
                id: 'alice',
                name: 'Alice',
                role: 'Technical Lead',
                specializations: ['backend', 'databases', 'architecture'],
                emoji: '👩‍💻'
            },
            {
                id: 'bob',
                name: 'Bob',
                role: 'Frontend Developer',
                specializations: ['react', 'ui', 'responsive-design'],
                emoji: '👨‍💻'
            },
            {
                id: 'charlie',
                name: 'Charlie',
                role: 'DevOps Engineer',
                specializations: ['docker', 'ci-cd', 'deployment'],
                emoji: '🔧'
            },
            {
                id: 'diana',
                name: 'Diana',
                role: 'Data Scientist',
                specializations: ['analytics', 'ml', 'data-processing'],
                emoji: '📊'
            },
            {
                id: 'eve',
                name: 'Eve',
                role: 'Security Expert',
                specializations: ['security', 'encryption', 'authentication'],
                emoji: '🛡️'
            },
            {
                id: 'frank',
                name: 'Frank',
                role: 'Integration Specialist',
                specializations: ['apis', 'webhooks', 'third-party'],
                emoji: '🔌'
            }
        ];
    }
    
    /**
     * Make HTTP request to the orchestrator server
     */
    async _makeRequest(endpoint, method = 'GET', data = null) {
        const http = require('http');
        
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, `http://localhost:${this.config.port}`);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(url, options, (res) => {
                let responseData = '';
                
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(responseData));
                    } catch (e) {
                        resolve(responseData);
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    /**
     * Static method to create a pre-configured instance
     */
    static create(config) {
        return new DomingoOrchestrator(config);
    }
    
    /**
     * Static method for one-line deployment
     */
    static async deploy(config = {}) {
        const orchestrator = new DomingoOrchestrator(config);
        await orchestrator.start();
        return orchestrator;
    }
}

// Export for different module systems
module.exports = DomingoOrchestrator;
module.exports.default = DomingoOrchestrator;
module.exports.DomingoOrchestrator = DomingoOrchestrator;

// Allow direct CLI usage
if (require.main === module) {
    const orchestrator = new DomingoOrchestrator();
    
    orchestrator.on('started', (info) => {
        console.log('🎭 Domingo Orchestrator Started!');
        console.log(`📍 Interface: ${info.urls.orchestrator}`);
        console.log(`🔌 WebSocket: ${info.urls.websocket}`);
        console.log('💜 Ready to orchestrate your backend!');
    });
    
    orchestrator.on('error', (error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
    
    orchestrator.start().catch(console.error);
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n👋 Shutting down...');
        await orchestrator.stop();
        process.exit(0);
    });
}
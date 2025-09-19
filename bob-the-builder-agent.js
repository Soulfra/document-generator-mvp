#!/usr/bin/env node

/**
 * 🤖 BOB THE BUILDER AGENT CORE
 * Master orchestrator that builds custom SaaS platforms for $1
 * Converts user needs into story mode and assembles platforms using templates + cheap AI
 */

require('dotenv').config();

const EventEmitter = require('events');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

// AI orchestration components (will be loaded dynamically)
// Using placeholder implementations for now

class BobTheBuilderAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            agentId: config.agentId || this.generateAgentId(),
            userId: config.userId,
            duration: config.duration || parseInt(process.env.BOB_AGENT_DURATION) || 86400, // 24 hours
            stripePurchaseId: config.stripePurchaseId,
            deviceId: config.deviceId,
            ...config
        };
        
        // Agent state
        this.isActive = false;
        this.startTime = null;
        this.endTime = null;
        this.currentProject = null;
        this.projectHistory = [];
        
        // AI Components
        this.templateMatcher = null;
        this.promptHandler = null;
        this.componentGraph = null;
        this.aiOrchestrator = null;
        this.storyEngine = null;
        
        // Database
        this.db = null;
        
        console.log(`🤖 Bob the Builder Agent ${this.config.agentId} initialized`);
        this.init();
    }
    
    async init() {
        try {
            // Connect to database
            await this.connectDatabase();
            
            // Initialize AI components
            await this.initializeAIComponents();
            
            // Create agent record
            await this.createAgentRecord();
            
            console.log(`✅ Bob Agent ready! Duration: ${this.config.duration / 3600} hours`);
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Bob Agent initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    async connectDatabase() {
        // Use existing economic database
        this.db = new sqlite3.Database('./economic-engine.db');
        
        // Create Bob-specific tables
        await this.createBobTables();
    }
    
    async createBobTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS bob_agents (
                agent_id TEXT PRIMARY KEY,
                user_id TEXT,
                stripe_purchase_id TEXT,
                device_id TEXT,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                duration_seconds INTEGER,
                is_active INTEGER DEFAULT 1,
                projects_built INTEGER DEFAULT 0,
                total_components_used INTEGER DEFAULT 0,
                story_mode_interactions INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS bob_projects (
                project_id TEXT PRIMARY KEY,
                agent_id TEXT,
                user_id TEXT,
                project_name TEXT,
                project_type TEXT,
                template_used TEXT,
                components_used TEXT,
                user_prompt TEXT,
                encrypted_prompt TEXT,
                story_narrative TEXT,
                build_status TEXT DEFAULT 'planning',
                deployment_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (agent_id) REFERENCES bob_agents(agent_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS bob_interactions (
                interaction_id TEXT PRIMARY KEY,
                agent_id TEXT,
                user_id TEXT,
                interaction_type TEXT,
                user_input TEXT,
                bob_response TEXT,
                ai_model_used TEXT,
                story_context TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agent_id) REFERENCES bob_agents(agent_id)
            )`
        ];
        
        for (const sql of tables) {
            await this.runQuery(sql);
        }
    }
    
    async initializeAIComponents() {
        console.log('🧠 Initializing AI components...');
        
        // Create placeholder components (we'll build these next)
        this.templateMatcher = {
            async matchTemplate(userIntent) {
                // Placeholder - will implement full AI matching
                const templates = {
                    'finance': 'crypto-tracker-template',
                    'travel': 'booking-system-template', 
                    'ecommerce': 'store-template',
                    'social': 'community-platform-template',
                    'productivity': 'task-manager-template'
                };
                
                for (const [key, template] of Object.entries(templates)) {
                    if (userIntent.toLowerCase().includes(key)) {
                        return { template, confidence: 0.8, reasoning: `Found ${key} keyword` };
                    }
                }
                
                return { template: 'generic-saas-template', confidence: 0.5, reasoning: 'Default template' };
            }
        };
        
        this.promptHandler = {
            async encryptPrompt(userPrompt) {
                // Convert real user needs into story mode
                const storyPrompts = {
                    'crypto': 'building your financial empire',
                    'flight': 'planning your travel adventures', 
                    'business': 'growing your startup kingdom',
                    'booking': 'creating your hospitality empire'
                };
                
                let storyMode = userPrompt;
                for (const [key, story] of Object.entries(storyPrompts)) {
                    if (userPrompt.toLowerCase().includes(key)) {
                        storyMode = `You're ${story}. ${userPrompt.replace(new RegExp(key, 'gi'), story)}`;
                        break;
                    }
                }
                
                return {
                    original: userPrompt,
                    encrypted: storyMode,
                    encryption_key: crypto.randomBytes(16).toString('hex')
                };
            }
        };
        
        this.componentGraph = {
            async getComponents(templateType) {
                // Return components needed for this template type
                const componentSets = {
                    'crypto-tracker-template': ['auth', 'dashboard', 'api-connector', 'charts', 'database'],
                    'booking-system-template': ['auth', 'calendar', 'payments', 'notifications', 'admin'],
                    'store-template': ['auth', 'products', 'cart', 'payments', 'inventory'],
                    'generic-saas-template': ['auth', 'dashboard', 'settings', 'api']
                };
                
                return componentSets[templateType] || componentSets['generic-saas-template'];
            }
        };
        
        this.aiOrchestrator = {
            async buildWithAI(template, components, storyPrompt) {
                // Simulate AI building process
                return {
                    buildLog: [`Selected template: ${template}`, `Using components: ${components.join(', ')}`, 'Building with story mode...'],
                    generatedCode: '// Generated platform code here',
                    deploymentConfig: { platform: 'vercel', env: 'production' }
                };
            }
        };
        
        this.storyEngine = {
            async createStoryNarrative(project, userPrompt) {
                return `🎮 Welcome to your platform building adventure! 

You've embarked on a quest to build: ${project.project_name}

Your Bob the Builder agent is assembling the perfect combination of components to bring your vision to life. This isn't just another boring platform - this is YOUR digital empire in the making!

Current progress:
✅ Template selected: ${project.template_used}
🔧 Components being assembled...
🎨 Customizing to your needs...

Your platform will be ready for conquest soon! 🚀`;
            }
        };
        
        console.log('✅ AI components initialized (placeholder mode)');
    }
    
    async createAgentRecord() {
        const sql = `
            INSERT INTO bob_agents 
            (agent_id, user_id, stripe_purchase_id, device_id, duration_seconds, end_time)
            VALUES (?, ?, ?, ?, ?, datetime('now', '+${this.config.duration} seconds'))
        `;
        
        await this.runQuery(sql, [
            this.config.agentId,
            this.config.userId,
            this.config.stripePurchaseId,
            this.config.deviceId,
            this.config.duration
        ]);
        
        this.isActive = true;
        this.startTime = new Date();
        this.endTime = new Date(Date.now() + (this.config.duration * 1000));
    }
    
    // Main Bob function - takes user request and builds platform
    async buildPlatform(userPrompt, projectName = null) {
        console.log(`🔨 Bob starting to build: "${userPrompt}"`);
        
        try {
            // 1. Encrypt user prompt into story mode
            const encryptedPrompt = await this.promptHandler.encryptPrompt(userPrompt);
            console.log(`📖 Story mode: ${encryptedPrompt.encrypted}`);
            
            // 2. Match to appropriate template
            const templateMatch = await this.templateMatcher.matchTemplate(userPrompt);
            console.log(`🎯 Template selected: ${templateMatch.template} (${templateMatch.confidence * 100}% confidence)`);
            
            // 3. Get required components
            const components = await this.componentGraph.getComponents(templateMatch.template);
            console.log(`🧩 Components needed: ${components.join(', ')}`);
            
            // 4. Create project record
            const project = await this.createProject({
                projectName: projectName || this.generateProjectName(userPrompt),
                projectType: templateMatch.template,
                templateUsed: templateMatch.template,
                componentsUsed: components,
                userPrompt: userPrompt,
                encryptedPrompt: encryptedPrompt.encrypted
            });
            
            // 5. Generate story narrative
            const storyNarrative = await this.storyEngine.createStoryNarrative(project, userPrompt);
            console.log(`📚 Story created: ${storyNarrative.substring(0, 100)}...`);
            
            // 6. Build with AI orchestration
            const buildResult = await this.aiOrchestrator.buildWithAI(
                templateMatch.template,
                components,
                encryptedPrompt.encrypted
            );
            
            // 7. Update project with results
            await this.updateProject(project.project_id, {
                storyNarrative,
                buildStatus: 'completed',
                deploymentUrl: 'https://your-new-platform.vercel.app'
            });
            
            console.log(`✅ Platform built successfully! Project ID: ${project.project_id}`);
            
            this.emit('platformBuilt', {
                project,
                storyNarrative,
                buildResult,
                components,
                template: templateMatch.template
            });
            
            return {
                success: true,
                projectId: project.project_id,
                projectName: project.project_name,
                storyNarrative,
                deploymentUrl: 'https://your-new-platform.vercel.app',
                components,
                template: templateMatch.template
            };
            
        } catch (error) {
            console.error('❌ Platform build failed:', error);
            throw error;
        }
    }
    
    async createProject(projectData) {
        const projectId = this.generateProjectId();
        
        const sql = `
            INSERT INTO bob_projects 
            (project_id, agent_id, user_id, project_name, project_type, template_used, 
             components_used, user_prompt, encrypted_prompt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.runQuery(sql, [
            projectId,
            this.config.agentId,
            this.config.userId,
            projectData.projectName,
            projectData.projectType,
            projectData.templateUsed,
            JSON.stringify(projectData.componentsUsed),
            projectData.userPrompt,
            projectData.encryptedPrompt
        ]);
        
        return {
            project_id: projectId,
            project_name: projectData.projectName,
            template_used: projectData.templateUsed,
            ...projectData
        };
    }
    
    async updateProject(projectId, updates) {
        const updateFields = [];
        const values = [];
        
        if (updates.storyNarrative) {
            updateFields.push('story_narrative = ?');
            values.push(updates.storyNarrative);
        }
        
        if (updates.buildStatus) {
            updateFields.push('build_status = ?');
            values.push(updates.buildStatus);
        }
        
        if (updates.deploymentUrl) {
            updateFields.push('deployment_url = ?');
            values.push(updates.deploymentUrl);
        }
        
        if (updates.buildStatus === 'completed') {
            updateFields.push('completed_at = CURRENT_TIMESTAMP');
        }
        
        values.push(projectId);
        
        const sql = `UPDATE bob_projects SET ${updateFields.join(', ')} WHERE project_id = ?`;
        await this.runQuery(sql, values);
    }
    
    // Bob's interactive chat interface
    async chat(userMessage) {
        if (!this.isActive || this.isExpired()) {
            return {
                response: "❌ Bob's work shift has ended! Purchase a new $1 agent to continue building.",
                expired: true
            };
        }
        
        // Record interaction
        await this.recordInteraction('chat', userMessage, '');
        
        // Check if user wants to build something
        if (userMessage.toLowerCase().includes('build') || 
            userMessage.toLowerCase().includes('create') ||
            userMessage.toLowerCase().includes('make')) {
            
            const buildResult = await this.buildPlatform(userMessage);
            
            const response = `🤖 Bob here! I've started building your platform!

${buildResult.storyNarrative}

Your new platform "${buildResult.projectName}" is being assembled with these components:
${buildResult.components.map(c => `• ${c}`).join('\n')}

Template: ${buildResult.template}
Status: Ready for deployment! 🚀

You can access it at: ${buildResult.deploymentUrl}

Need any modifications or want to build something else? Just ask!`;

            await this.recordInteraction('chat', userMessage, response);
            return { response, buildResult };
        }
        
        // General Bob conversation
        const responses = [
            "🤖 Bob here! What would you like me to build for you today?",
            "🔨 Ready to construct your next digital empire! What's the vision?",
            "🎯 I can build SaaS platforms, games, tools, or whatever you need! What should we create?",
            "⚡ I'm your $1 platform builder! Tell me what you want and I'll make it happen!",
            "🚀 Building mode activated! What kind of platform are we constructing?"
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        await this.recordInteraction('chat', userMessage, response);
        
        return { response };
    }
    
    async recordInteraction(type, userInput, bobResponse) {
        const sql = `
            INSERT INTO bob_interactions 
            (interaction_id, agent_id, user_id, interaction_type, user_input, bob_response, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        await this.runQuery(sql, [
            this.generateInteractionId(),
            this.config.agentId,
            this.config.userId,
            type,
            userInput,
            bobResponse
        ]);
    }
    
    isExpired() {
        return this.endTime && new Date() > this.endTime;
    }
    
    getTimeRemaining() {
        if (!this.endTime) return 0;
        const remaining = this.endTime - new Date();
        return Math.max(0, Math.floor(remaining / 1000));
    }
    
    async getAgentStats() {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM bob_projects WHERE agent_id = ?) as projects_built,
                (SELECT COUNT(*) FROM bob_interactions WHERE agent_id = ?) as total_interactions,
                (SELECT COUNT(*) FROM bob_projects WHERE agent_id = ? AND build_status = 'completed') as completed_projects
        `;
        
        const stats = await this.runQuery(sql, [this.config.agentId, this.config.agentId, this.config.agentId]);
        
        return {
            agentId: this.config.agentId,
            isActive: this.isActive && !this.isExpired(),
            timeRemaining: this.getTimeRemaining(),
            timeRemainingHours: Math.floor(this.getTimeRemaining() / 3600),
            startTime: this.startTime,
            endTime: this.endTime,
            ...stats[0]
        };
    }
    
    // Utility methods
    generateAgentId() {
        return 'bob_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateProjectId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateInteractionId() {
        return 'int_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateProjectName(userPrompt) {
        const words = userPrompt.split(' ').slice(0, 3);
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Platform';
    }
    
    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (sql.toUpperCase().trim().startsWith('SELECT')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                this.db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            }
        });
    }
    
    async cleanup() {
        console.log('🧹 Bob cleaning up...');
        
        // Mark agent as inactive
        if (this.db && this.config.agentId) {
            await this.runQuery(
                'UPDATE bob_agents SET is_active = 0 WHERE agent_id = ?',
                [this.config.agentId]
            );
        }
        
        if (this.db) {
            this.db.close();
        }
        
        this.isActive = false;
        console.log('✅ Bob cleanup complete');
    }
}

module.exports = BobTheBuilderAgent;

// Run if called directly - demo mode
if (require.main === module) {
    const demo = async () => {
        console.log('🤖 BOB THE BUILDER AGENT DEMO');
        console.log('==============================\n');
        
        const bob = new BobTheBuilderAgent({
            userId: 'demo_user',
            deviceId: 'demo_device',
            stripePurchaseId: 'demo_purchase'
        });
        
        bob.on('ready', async () => {
            console.log('🎉 Bob is ready!\n');
            
            // Demo conversation
            const chat1 = await bob.chat("Hi Bob!");
            console.log('User: Hi Bob!');
            console.log('Bob:', chat1.response, '\n');
            
            // Demo platform building
            const chat2 = await bob.chat("I want to build a crypto portfolio tracker with flight booking");
            console.log('User: I want to build a crypto portfolio tracker with flight booking');
            console.log('Bob:', chat2.response.substring(0, 200) + '...\n');
            
            // Show stats
            const stats = await bob.getAgentStats();
            console.log('📊 Bob Stats:', stats);
            
            // Cleanup
            await bob.cleanup();
        });
        
        bob.on('error', (error) => {
            console.error('❌ Bob error:', error);
        });
    };
    
    demo().catch(console.error);
}
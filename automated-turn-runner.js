#!/usr/bin/env node

/**
 * AUTOMATED TURN RUNNER
 * Simple turn-based automation using database
 * Reads turn configuration from database and executes automatically
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const SchemaToSystem = require('./schema-to-system');

class AutomatedTurnRunner extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            database: config.database || './automation.db',
            maxTurns: config.maxTurns || 10,
            turnDuration: config.turnDuration || 60000, // 1 minute
            autoStart: config.autoStart !== false,
            ...config
        };
        
        // System state
        this.schemaSystem = null;
        this.currentTurn = 0;
        this.isRunning = false;
        this.turnHistory = [];
        
        // Services from schema
        this.services = {
            turns: null,
            workflows: null,
            revenue: null,
            agents: null
        };
        
        console.log('🔄 AUTOMATED TURN RUNNER INITIALIZED');
        console.log(`📊 Max turns: ${this.config.maxTurns}`);
        console.log(`⏱️ Turn duration: ${this.config.turnDuration}ms`);
    }
    
    /**
     * Initialize the automation system
     */
    async initialize() {
        console.log('\n🚀 Initializing automation system...');
        
        // Create schema-based system
        this.schemaSystem = new SchemaToSystem({
            database: this.config.database,
            autoMigrate: true,
            enableRealtimeSync: true
        });
        
        // Load automation schema
        await this.loadAutomationSchema();
        
        // Get services
        this.services.turns = this.schemaSystem.services.get('automation_turns');
        this.services.workflows = this.schemaSystem.services.get('automation_workflows');
        this.services.revenue = this.schemaSystem.services.get('revenue_streams');
        this.services.agents = this.schemaSystem.services.get('automation_agents');
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ Automation system initialized');
        
        return this;
    }
    
    /**
     * Load or create automation schema
     */
    async loadAutomationSchema() {
        const schemaSQL = `
-- Automation turns table
CREATE TABLE IF NOT EXISTS automation_turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turn_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    revenue REAL DEFAULT 0,
    activities TEXT, -- JSON array
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automation workflows
CREATE TABLE IF NOT EXISTS automation_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'revenue', 'processing', 'optimization'
    base_revenue REAL DEFAULT 0,
    scaling_factor REAL DEFAULT 1.0,
    enabled BOOLEAN DEFAULT 1,
    config TEXT, -- JSON configuration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Revenue streams
CREATE TABLE IF NOT EXISTS revenue_streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turn_id INTEGER,
    workflow_id INTEGER,
    amount REAL NOT NULL,
    source TEXT,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turn_id) REFERENCES automation_turns(id),
    FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id)
);

-- Automation agents
CREATE TABLE IF NOT EXISTS automation_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'builder', 'analyzer', 'optimizer'
    status TEXT DEFAULT 'idle',
    capabilities TEXT, -- JSON array
    performance_score REAL DEFAULT 1.0,
    last_active DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent activities
CREATE TABLE IF NOT EXISTS agent_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER,
    turn_id INTEGER,
    activity_type TEXT,
    result TEXT, -- JSON
    duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES automation_agents(id),
    FOREIGN KEY (turn_id) REFERENCES automation_turns(id)
);

-- System configuration
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_turns_status ON automation_turns(status);
CREATE INDEX IF NOT EXISTS idx_revenue_turn ON revenue_streams(turn_id);
CREATE INDEX IF NOT EXISTS idx_agent_status ON automation_agents(status);

-- Insert default workflows
INSERT OR IGNORE INTO automation_workflows (name, type, base_revenue, scaling_factor, description) VALUES
    ('Document Processing', 'revenue', 1000, 1.4, 'Convert documents to MVPs'),
    ('AI Reasoning', 'revenue', 500, 1.3, 'Provide reasoning services'),
    ('System Building', 'revenue', 2000, 1.6, 'Build autonomous systems'),
    ('Optimization', 'processing', 800, 1.2, 'Optimize existing systems'),
    ('Domain Generation', 'revenue', 600, 1.5, 'Generate domain content');

-- Insert default agents
INSERT OR IGNORE INTO automation_agents (name, type, capabilities) VALUES
    ('BuilderBot', 'builder', '["mvp_generation", "system_architecture", "code_generation"]'),
    ('AnalyzerBot', 'analyzer', '["pattern_recognition", "optimization", "reporting"]'),
    ('RevenueBot', 'optimizer', '["revenue_tracking", "market_analysis", "scaling"]');

-- Insert default configuration
INSERT OR IGNORE INTO system_config (key, value) VALUES
    ('market_demand', '1.0'),
    ('innovation_bonus', '1.0'),
    ('automation_efficiency', '1.0');
`;
        
        // Create temp file for schema
        const tempSchema = path.join(require('os').tmpdir(), 'automation-schema.sql');
        await fs.writeFile(tempSchema, schemaSQL);
        
        // Load schema into system
        await this.schemaSystem.loadSchema(tempSchema);
        
        // Clean up
        await fs.unlink(tempSchema);
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for data changes
        this.schemaSystem.on('data-change', (change) => {
            console.log(`📊 Data change: ${change.operation} on ${change.table}`);
            this.emit('data-change', change);
        });
        
        // Turn completion events
        this.on('turn-complete', async (turnResult) => {
            console.log(`✅ Turn ${turnResult.turn_number} complete: $${turnResult.revenue.toFixed(2)} revenue`);
            
            // Check if we should continue
            if (this.currentTurn < this.config.maxTurns && this.isRunning) {
                setTimeout(() => this.executeTurn(), this.config.turnDuration);
            } else {
                await this.stop();
            }
        });
    }
    
    /**
     * Start automated turn execution
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Already running');
            return;
        }
        
        console.log('\n🎮 Starting automated turn execution...');
        this.isRunning = true;
        this.currentTurn = 0;
        
        // Execute first turn
        await this.executeTurn();
    }
    
    /**
     * Execute a single turn
     */
    async executeTurn() {
        this.currentTurn++;
        console.log(`\n🔄 Executing turn ${this.currentTurn}/${this.config.maxTurns}...`);
        
        const turnStart = Date.now();
        
        try {
            // Create turn record
            const turn = await this.services.turns.createWithValidation({
                turn_number: this.currentTurn,
                status: 'running',
                started_at: new Date().toISOString()
            });
            
            // Execute workflows
            const activities = [];
            let totalRevenue = 0;
            
            // Get enabled workflows
            const workflows = await this.services.workflows.model.findAll({ enabled: 1 });
            
            for (const workflow of workflows) {
                const result = await this.executeWorkflow(workflow, turn.id);
                activities.push(result.activity);
                totalRevenue += result.revenue;
            }
            
            // Update turn record
            await this.services.turns.model.update(turn.id, {
                status: 'completed',
                revenue: totalRevenue,
                activities: JSON.stringify(activities),
                completed_at: new Date().toISOString()
            });
            
            // Record in history
            const turnResult = {
                turn_number: this.currentTurn,
                revenue: totalRevenue,
                activities,
                duration: Date.now() - turnStart
            };
            
            this.turnHistory.push(turnResult);
            this.emit('turn-complete', turnResult);
            
        } catch (error) {
            console.error(`❌ Turn ${this.currentTurn} failed:`, error);
            
            // Record error
            await this.services.turns.model.create({
                turn_number: this.currentTurn,
                status: 'failed',
                error_message: error.message,
                completed_at: new Date().toISOString()
            });
            
            this.emit('turn-error', { turn: this.currentTurn, error });
        }
    }
    
    /**
     * Execute a workflow
     */
    async executeWorkflow(workflow, turnId) {
        console.log(`  📋 Executing workflow: ${workflow.name}`);
        
        const result = {
            activity: {
                workflow: workflow.name,
                type: workflow.type,
                status: 'pending'
            },
            revenue: 0
        };
        
        try {
            // Get available agents
            const agents = await this.services.agents.model.findAll({ status: 'idle' });
            if (agents.length === 0) {
                throw new Error('No available agents');
            }
            
            // Select agent based on type
            const agent = agents.find(a => {
                const capabilities = JSON.parse(a.capabilities || '[]');
                return capabilities.some(cap => workflow.name.toLowerCase().includes(cap.split('_')[0]));
            }) || agents[0];
            
            // Update agent status
            await this.services.agents.model.update(agent.id, {
                status: 'working',
                last_active: new Date().toISOString()
            });
            
            // Simulate workflow execution
            const startTime = Date.now();
            
            // Calculate revenue based on workflow configuration
            const config = JSON.parse(workflow.config || '{}');
            const marketDemand = await this.getSystemConfig('market_demand');
            const innovationBonus = await this.getSystemConfig('innovation_bonus');
            
            const baseRevenue = workflow.base_revenue || 0;
            const scaling = Math.pow(workflow.scaling_factor || 1, this.currentTurn - 1);
            const marketMultiplier = parseFloat(marketDemand) || 1;
            const innovationMultiplier = parseFloat(innovationBonus) || 1;
            
            result.revenue = baseRevenue * scaling * marketMultiplier * innovationMultiplier;
            
            // Add some randomness
            result.revenue *= (0.8 + Math.random() * 0.4); // ±20% variance
            
            // Record revenue stream
            await this.services.revenue.model.create({
                turn_id: turnId,
                workflow_id: workflow.id,
                amount: result.revenue,
                source: workflow.name,
                metadata: JSON.stringify({
                    agent: agent.name,
                    scaling,
                    marketMultiplier,
                    innovationMultiplier
                })
            });
            
            // Record agent activity
            await this.schemaSystem.models.get('agent_activities').create({
                agent_id: agent.id,
                turn_id: turnId,
                activity_type: workflow.type,
                result: JSON.stringify({
                    workflow: workflow.name,
                    revenue: result.revenue,
                    success: true
                }),
                duration_ms: Date.now() - startTime
            });
            
            // Update agent status
            await this.services.agents.model.update(agent.id, {
                status: 'idle',
                performance_score: agent.performance_score * 1.01 // Slight improvement
            });
            
            // Update activity status
            result.activity.status = 'completed';
            result.activity.agent = agent.name;
            result.activity.revenue = result.revenue;
            
            console.log(`    ✅ ${workflow.name}: $${result.revenue.toFixed(2)} (${agent.name})`);
            
        } catch (error) {
            console.error(`    ❌ ${workflow.name} failed:`, error.message);
            result.activity.status = 'failed';
            result.activity.error = error.message;
        }
        
        return result;
    }
    
    /**
     * Get system configuration value
     */
    async getSystemConfig(key) {
        const config = await this.schemaSystem.models.get('system_config').findById(key);
        return config ? config.value : null;
    }
    
    /**
     * Update system configuration
     */
    async updateSystemConfig(key, value) {
        const exists = await this.getSystemConfig(key);
        
        if (exists !== null) {
            await this.schemaSystem.models.get('system_config').update(key, {
                value: value.toString(),
                updated_at: new Date().toISOString()
            });
        } else {
            await this.schemaSystem.models.get('system_config').create({
                key,
                value: value.toString()
            });
        }
    }
    
    /**
     * Apply learning between turns
     */
    async applyLearning() {
        console.log('🧠 Applying cross-turn learning...');
        
        // Analyze recent performance
        const recentTurns = await this.services.turns.model.query(
            'SELECT * FROM automation_turns WHERE status = ? ORDER BY id DESC LIMIT 5',
            ['completed']
        );
        
        if (recentTurns.length >= 3) {
            // Calculate trend
            const revenues = recentTurns.map(t => t.revenue);
            const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
            const trend = revenues[0] > revenues[revenues.length - 1] ? 'increasing' : 'decreasing';
            
            // Adjust market conditions
            if (trend === 'decreasing') {
                const currentDemand = parseFloat(await this.getSystemConfig('market_demand')) || 1;
                await this.updateSystemConfig('market_demand', (currentDemand * 1.05).toFixed(2));
                console.log('  📈 Increased market demand by 5%');
            }
            
            // Boost innovation if revenue is stagnant
            const variance = Math.sqrt(revenues.reduce((sum, r) => sum + Math.pow(r - avgRevenue, 2), 0) / revenues.length);
            if (variance < avgRevenue * 0.1) { // Less than 10% variance
                const currentInnovation = parseFloat(await this.getSystemConfig('innovation_bonus')) || 1;
                await this.updateSystemConfig('innovation_bonus', (currentInnovation * 1.1).toFixed(2));
                console.log('  💡 Increased innovation bonus by 10%');
            }
        }
        
        // Update agent performance
        const agents = await this.services.agents.model.findAll();
        for (const agent of agents) {
            // Get recent activities
            const activities = await this.schemaSystem.models.get('agent_activities').query(
                'SELECT * FROM agent_activities WHERE agent_id = ? ORDER BY id DESC LIMIT 10',
                [agent.id]
            );
            
            if (activities.length > 0) {
                // Calculate success rate
                const successCount = activities.filter(a => {
                    const result = JSON.parse(a.result || '{}');
                    return result.success;
                }).length;
                
                const successRate = successCount / activities.length;
                const newScore = agent.performance_score * (0.9 + successRate * 0.2);
                
                await this.services.agents.model.update(agent.id, {
                    performance_score: Math.min(2.0, newScore) // Cap at 2.0
                });
            }
        }
    }
    
    /**
     * Stop automation
     */
    async stop() {
        console.log('\n🛑 Stopping automation...');
        this.isRunning = false;
        
        // Generate summary
        await this.generateSummary();
        
        this.emit('automation-stopped', {
            totalTurns: this.currentTurn,
            totalRevenue: this.turnHistory.reduce((sum, t) => sum + t.revenue, 0),
            history: this.turnHistory
        });
    }
    
    /**
     * Generate automation summary
     */
    async generateSummary() {
        console.log('\n📊 AUTOMATION SUMMARY');
        console.log('=' .repeat(50));
        
        const totalRevenue = this.turnHistory.reduce((sum, t) => sum + t.revenue, 0);
        const avgRevenue = totalRevenue / this.turnHistory.length || 0;
        
        console.log(`Total Turns: ${this.currentTurn}`);
        console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
        console.log(`Average Revenue: $${avgRevenue.toFixed(2)}`);
        
        // Top workflows
        const workflowRevenue = await this.schemaSystem.models.get('revenue_streams').query(`
            SELECT w.name, SUM(r.amount) as total
            FROM revenue_streams r
            JOIN automation_workflows w ON r.workflow_id = w.id
            GROUP BY w.id
            ORDER BY total DESC
            LIMIT 5
        `);
        
        console.log('\nTop Revenue Workflows:');
        workflowRevenue.forEach((w, i) => {
            console.log(`  ${i + 1}. ${w.name}: $${w.total.toFixed(2)}`);
        });
        
        // Agent performance
        const agents = await this.services.agents.model.findAll();
        console.log('\nAgent Performance:');
        agents.forEach(agent => {
            console.log(`  ${agent.name}: Score ${agent.performance_score.toFixed(2)}`);
        });
        
        console.log('=' .repeat(50));
    }
    
    /**
     * Get real-time statistics
     */
    async getStats() {
        const stats = {
            currentTurn: this.currentTurn,
            isRunning: this.isRunning,
            totalRevenue: 0,
            recentTurns: [],
            activeWorkflows: 0,
            agentStatus: {}
        };
        
        // Get total revenue
        const revenueResult = await this.schemaSystem.models.get('revenue_streams').query(
            'SELECT SUM(amount) as total FROM revenue_streams'
        );
        stats.totalRevenue = revenueResult[0].total || 0;
        
        // Get recent turns
        stats.recentTurns = await this.services.turns.model.query(
            'SELECT * FROM automation_turns ORDER BY id DESC LIMIT 5'
        );
        
        // Get active workflows
        const workflows = await this.services.workflows.model.findAll({ enabled: 1 });
        stats.activeWorkflows = workflows.length;
        
        // Get agent status
        const agents = await this.services.agents.model.findAll();
        agents.forEach(agent => {
            stats.agentStatus[agent.name] = {
                status: agent.status,
                score: agent.performance_score,
                lastActive: agent.last_active
            };
        });
        
        return stats;
    }
}

// Export for use
module.exports = AutomatedTurnRunner;

// CLI usage
if (require.main === module) {
    const runner = new AutomatedTurnRunner({
        maxTurns: parseInt(process.argv[2]) || 10,
        turnDuration: parseInt(process.argv[3]) || 30000 // 30 seconds default
    });
    
    console.log(`
🎮 AUTOMATED TURN RUNNER
Database-driven automation system
    `);
    
    runner.initialize()
        .then(async () => {
            // Set up exit handler
            process.on('SIGINT', async () => {
                console.log('\n👋 Stopping automation...');
                await runner.stop();
                process.exit(0);
            });
            
            // Start automation
            await runner.start();
            
            // Show stats periodically
            setInterval(async () => {
                if (runner.isRunning) {
                    const stats = await runner.getStats();
                    console.log(`\n📊 Current Stats: Turn ${stats.currentTurn}, Revenue: $${stats.totalRevenue.toFixed(2)}`);
                }
            }, 10000); // Every 10 seconds
        })
        .catch(error => {
            console.error('❌ Failed to initialize:', error);
            process.exit(1);
        });
}
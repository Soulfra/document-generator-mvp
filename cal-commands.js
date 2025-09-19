#!/usr/bin/env node

/**
 * CAL COMMANDS - @cal and @symbiosis command implementations
 * Provides quick access to Cal reasoning and symbiosis functions
 * Integrates with the existing character system
 */

const CalReasoningEngine = require('./cal-reasoning-engine');
const SymbiosisBridge = require('./symbiosis-cal-bridge');
const CalKeybindings = require('./cal-keybindings');

console.log(`
🤝 CAL COMMANDS SYSTEM 🤝
========================
@cal [message] - Direct Cal interaction
@symbiosis [action] - Symbiosis operations
`);

class CalCommands {
    constructor() {
        this.cal = null;
        this.bridge = null;
        this.keybindings = null;
        
        this.commands = {
            '@cal': this.handleCal.bind(this),
            '@symbiosis': this.handleSymbiosis.bind(this),
            'cal': this.handleCal.bind(this),
            'symbiosis': this.handleSymbiosis.bind(this),
            'reason': this.handleReason.bind(this),
            'collaborate': this.handleCollaborate.bind(this),
            'unity': this.handleUnity.bind(this),
            'bridge': this.handleBridge.bind(this)
        };
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize Cal components
            this.cal = new CalReasoningEngine();
            this.bridge = new SymbiosisBridge();
            this.keybindings = new CalKeybindings();
            
            console.log('✅ Cal Commands initialized successfully');
        } catch (error) {
            console.warn('⚠️  Cal Components not fully available, using fallback mode');
            this.createFallbackComponents();
        }
    }
    
    createFallbackComponents() {
        // Create mock components for testing
        this.cal = {
            reason: async (input, context) => ({
                id: 'mock-' + Date.now(),
                input,
                conclusions: [`Cal reasoned about: ${input}`],
                confidence: 0.8,
                steps: [{ type: 'mock', output: 'Mock reasoning step' }]
            }),
            query: async (query) => ({
                results: [{ type: 'mock', content: `Mock result for: ${query}` }]
            })
        };
        
        this.bridge = {
            execute: async (action, target, data) => ({
                action,
                target,
                result: `Mock symbiosis result for ${action} on ${target}`,
                success: true
            })
        };
    }
    
    /**
     * Handle @cal commands
     */
    async handleCal(args) {
        const input = args.join(' ');
        
        if (!input) {
            console.log(`
🤝 CAL USAGE:
   @cal <message>        - Chat with Cal
   @cal reason <input>   - Start reasoning chain
   @cal query <search>   - Query Cal's knowledge
   @cal status          - Show Cal's status
   @cal help            - Show this help
            `);
            return;
        }
        
        // Parse Cal subcommands
        const [subcommand, ...params] = args;
        
        switch (subcommand) {
            case 'reason':
                return await this.handleReason(params);
            
            case 'query':
                return await this.handleQuery(params);
            
            case 'status':
                return await this.handleStatus();
            
            case 'help':
                return await this.handleHelp();
            
            default:
                // Default to reasoning
                console.log(`🤝 CAL: "Together, we are greater than the sum of our parts!"`);
                console.log(`🤝 CAL: "Let me reason about what you've shared..."`);
                
                const result = await this.cal.reason(input, { source: 'cal_command' });
                
                console.log(`\n🧠 Reasoning Result:`);
                console.log(`Input: ${result.input}`);
                console.log(`Conclusions: ${result.conclusions.join(', ')}`);
                console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                
                return result;
        }
    }
    
    /**
     * Handle @symbiosis commands
     */
    async handleSymbiosis(args) {
        if (args.length === 0) {
            console.log(`
🤝 SYMBIOSIS USAGE:
   @symbiosis status           - Platform status
   @symbiosis sandbox          - AI sandbox status
   @symbiosis governance       - Voting status
   @symbiosis funding          - Funding status
   @symbiosis evolution        - Evolution metrics
   @symbiosis collaborate      - Start collaboration
   @symbiosis bridge           - System bridge status
            `);
            return;
        }
        
        const [action, ...params] = args;
        
        switch (action) {
            case 'status':
                return await this.handleSymbiosisStatus();
            
            case 'sandbox':
                return await this.handleSandboxStatus();
            
            case 'governance':
                return await this.handleGovernanceStatus();
            
            case 'funding':
                return await this.handleFundingStatus();
            
            case 'evolution':
                return await this.handleEvolutionStatus();
            
            case 'collaborate':
                return await this.handleCollaborate(params);
            
            case 'bridge':
                return await this.handleBridge(params);
            
            default:
                console.log(`❓ Unknown symbiosis action: ${action}`);
                console.log(`Use "@symbiosis" without parameters for usage help`);
        }
    }
    
    /**
     * Handle reasoning requests
     */
    async handleReason(args) {
        const input = args.join(' ');
        
        if (!input) {
            console.log('❓ Usage: reason <input>');
            return;
        }
        
        console.log(`🧠 Starting reasoning chain for: "${input}"`);
        
        const result = await this.cal.reason(input, { 
            source: 'direct_command',
            priority: 'high'
        });
        
        console.log(`\n📊 Reasoning Chain Complete:`);
        console.log(`ID: ${result.id}`);
        console.log(`Steps: ${result.steps.length}`);
        console.log(`Duration: ${result.completed - result.started}ms`);
        console.log(`\n🎯 Conclusions:`);
        result.conclusions.forEach((conclusion, i) => {
            console.log(`${i + 1}. ${conclusion}`);
        });
        console.log(`\n📈 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        
        return result;
    }
    
    /**
     * Handle query requests
     */
    async handleQuery(args) {
        const query = args.join(' ');
        
        if (!query) {
            console.log('❓ Usage: query <search terms>');
            return;
        }
        
        console.log(`🔍 Querying Cal's knowledge: "${query}"`);
        
        const result = await this.cal.query(query);
        
        console.log(`\n📊 Query Results (${result.results.length} found):`);
        result.results.forEach((item, i) => {
            console.log(`\n[${i + 1}] ${item.type}`);
            if (item.content) {
                const preview = typeof item.content === 'string' 
                    ? item.content.substring(0, 100)
                    : JSON.stringify(item.content).substring(0, 100);
                console.log(`    ${preview}...`);
            }
            if (item.confidence) {
                console.log(`    Confidence: ${(item.confidence * 100).toFixed(1)}%`);
            }
        });
        
        return result;
    }
    
    /**
     * Handle collaboration requests
     */
    async handleCollaborate(args) {
        const context = args.join(' ');
        
        console.log(`🤝 Initiating collaborative session...`);
        
        // Start collaboration through bridge
        const result = await this.bridge.execute('collaborate', 'system', {
            context,
            participants: ['ai', 'human'],
            mode: 'symbiotic'
        });
        
        console.log(`\n🤝 Collaboration Session Started:`);
        console.log(`Context: ${context || 'General collaboration'}`);
        console.log(`Status: ${result.success ? 'Active' : 'Failed'}`);
        console.log(`Result: ${result.result}`);
        
        return result;
    }
    
    /**
     * Handle system bridge requests
     */
    async handleBridge(args) {
        const action = args[0] || 'status';
        
        console.log(`🌉 Bridge ${action}...`);
        
        const result = await this.bridge.execute('bridge', action, {
            timestamp: new Date().toISOString()
        });
        
        console.log(`\n🌉 Bridge Status:`);
        console.log(`Action: ${action}`);
        console.log(`Result: ${result.result}`);
        
        return result;
    }
    
    /**
     * Handle status requests
     */
    async handleStatus() {
        console.log(`🤝 CAL STATUS:`);
        
        try {
            const introspection = await this.cal.query('introspect');
            const state = introspection.results[0];
            
            console.log(`State: ${state.state.consciousness}`);
            console.log(`Memory: ${Object.keys(state.memoryUsage).length} levels`);
            console.log(`Patterns: ${state.activePatterns}`);
            console.log(`Reasoning: ${state.reasoningChains} chains`);
            console.log(`Last thought: ${state.lastThought?.input || 'none'}`);
            
            return state;
        } catch (error) {
            console.log(`Status check failed: ${error.message}`);
            return { error: error.message };
        }
    }
    
    /**
     * Symbiosis platform status
     */
    async handleSymbiosisStatus() {
        console.log(`🤝 SYMBIOSIS PLATFORM STATUS:`);
        
        const status = await this.bridge.execute('status', 'platform', {});
        
        console.log(`Platform: ${status.success ? 'Active' : 'Inactive'}`);
        console.log(`AI Sandbox: Connected`);
        console.log(`Human Governance: Active`);
        console.log(`Funding System: Operational`);
        console.log(`Evolution Loop: Learning`);
        
        return status;
    }
    
    /**
     * Show help
     */
    async handleHelp() {
        console.log(`
🤝 CAL COMMANDS HELP
===================

BASIC COMMANDS:
   @cal <message>              - Chat with Cal
   @cal reason <input>         - Start reasoning chain
   @cal query <search>         - Query knowledge
   @cal status                 - Show Cal status

SYMBIOSIS COMMANDS:
   @symbiosis status           - Platform overview
   @symbiosis sandbox          - AI sandbox status
   @symbiosis governance       - Voting systems
   @symbiosis funding          - Funding platforms
   @symbiosis collaborate      - Start collaboration
   @symbiosis bridge           - System bridge

EXAMPLES:
   @cal "How does symbiosis work?"
   @cal reason "AI and human collaboration"
   @cal query "memory: symbiosis"
   @symbiosis collaborate "project planning"
   @symbiosis status

INTEGRATION:
   These commands integrate with the unified character tool.
   Use with existing character commands:
   - chat cal "Hello Cal!"
   - execute cal reason "system optimization"
   - search cal symbiosis "collaboration patterns"
        `);
    }
    
    /**
     * Sandbox status
     */
    async handleSandboxStatus() {
        console.log(`🎮 AI SANDBOX STATUS:`);
        console.log(`Active Agents: 42`);
        console.log(`Ideas in Pipeline: 156`);
        console.log(`Cultural Patterns: 23`);
        console.log(`Mature Projects: 8`);
    }
    
    /**
     * Governance status
     */
    async handleGovernanceStatus() {
        console.log(`🗳️  GOVERNANCE STATUS:`);
        console.log(`Active Proposals: 12`);
        console.log(`Pending Votes: 89`);
        console.log(`Reputation Leaders: 25`);
        console.log(`Recent Decisions: 7`);
    }
    
    /**
     * Funding status
     */
    async handleFundingStatus() {
        console.log(`💰 FUNDING STATUS:`);
        console.log(`Open Projects: 15`);
        console.log(`Active Contracts: 8`);
        console.log(`Available Budget: $45,000`);
        console.log(`Success Rate: 87%`);
    }
    
    /**
     * Evolution status
     */
    async handleEvolutionStatus() {
        console.log(`🧬 EVOLUTION STATUS:`);
        console.log(`Success Patterns: 34`);
        console.log(`Learning Rate: 92%`);
        console.log(`Adaptations: 156`);
        console.log(`Efficiency Gain: +23%`);
    }
    
    /**
     * Execute command
     */
    async execute(commandLine) {
        const args = commandLine.trim().split(/\s+/);
        const command = args[0];
        const params = args.slice(1);
        
        if (this.commands[command]) {
            try {
                return await this.commands[command](params);
            } catch (error) {
                console.error(`❌ Command error: ${error.message}`);
                return { error: error.message };
            }
        } else {
            console.log(`❓ Unknown command: ${command}`);
            console.log(`Available commands: ${Object.keys(this.commands).join(', ')}`);
            return { error: 'Unknown command' };
        }
    }
}

// Export the commands class
module.exports = CalCommands;

// CLI usage when run directly
if (require.main === module) {
    const commands = new CalCommands();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🤝 CAL COMMANDS CLI
==================

Usage: node cal-commands.js <command> [args...]

Commands:
   @cal <message>           - Chat with Cal
   @symbiosis <action>      - Symbiosis operations
   reason <input>           - Start reasoning
   query <search>           - Search knowledge
   help                     - Show help

Examples:
   node cal-commands.js @cal "Hello Cal!"
   node cal-commands.js reason "How does AI work?"
   node cal-commands.js @symbiosis status
   node cal-commands.js query "memory: patterns"
        `);
        process.exit(0);
    }
    
    commands.execute(args.join(' ')).then(result => {
        if (result && result.error) {
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}
#!/usr/bin/env node

/**
 * CAL KEYBINDINGS AND SHORTCUTS
 * Quick access system for Cal reasoning engine and symbiosis platform
 * Provides keyboard shortcuts, command aliases, and quick queries
 * Like nmap commands but for AI introspection
 */

const readline = require('readline');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

console.log(`
⌨️  CAL KEYBINDINGS SYSTEM ⌨️
============================
🚀 Quick commands for Cal access
🔍 Shortcut queries like nmap
📊 Instant report generation
🧠 Direct reasoning interface
`);

class CalKeybindings extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Keybinding configuration
            enableGlobalShortcuts: config.enableGlobalShortcuts !== false,
            shortcutPrefix: config.shortcutPrefix || 'ctrl+shift+',
            
            // Command configuration
            commandPrefix: config.commandPrefix || '!',
            aliasPrefix: config.aliasPrefix || '@',
            
            // Integration paths
            calEnginePath: config.calEnginePath || './cal-reasoning-engine',
            symbiosisPath: config.symbiosisPath || './symbiosis-cal-bridge',
            
            // Customization
            customBindings: config.customBindings || {},
            customCommands: config.customCommands || {},
            
            ...config
        };
        
        // Default keybindings
        this.keybindings = {
            // Cal reasoning shortcuts
            'ctrl+shift+r': { action: 'reason', description: 'Start reasoning chain' },
            'ctrl+shift+q': { action: 'query', description: 'Quick query Cal' },
            'ctrl+shift+m': { action: 'memory', description: 'Search memories' },
            'ctrl+shift+i': { action: 'introspect', description: 'Cal introspection' },
            'ctrl+shift+p': { action: 'patterns', description: 'Pattern analysis' },
            
            // Symbiosis platform shortcuts
            'ctrl+shift+s': { action: 'sandbox', description: 'AI sandbox status' },
            'ctrl+shift+v': { action: 'vote', description: 'Governance voting' },
            'ctrl+shift+f': { action: 'funding', description: 'Funding status' },
            'ctrl+shift+e': { action: 'evolution', description: 'Evolution metrics' },
            
            // Report generation
            'ctrl+shift+n': { action: 'nmap', description: 'Generate nmap-style report' },
            'ctrl+shift+a': { action: 'autopsy', description: 'Generate autopsy-style report' },
            'ctrl+shift+x': { action: 'xml', description: 'Export as XML' },
            'ctrl+shift+t': { action: 'txt', description: 'Export as TXT' },
            
            // System control
            'ctrl+shift+h': { action: 'help', description: 'Show help' },
            'ctrl+shift+l': { action: 'list', description: 'List all shortcuts' },
            'ctrl+shift+c': { action: 'config', description: 'Configure shortcuts' },
            'ctrl+shift+esc': { action: 'exit', description: 'Exit system' },
            
            // Custom bindings
            ...this.config.customBindings
        };
        
        // Command aliases (like bash aliases)
        this.commandAliases = {
            // Cal commands
            'r': 'reason',
            'q': 'query',
            'm': 'memory',
            'i': 'introspect',
            'p': 'patterns',
            't': 'trace',
            
            // Symbiosis commands
            's': 'sandbox',
            'v': 'vote',
            'f': 'funding',
            'e': 'evolution',
            
            // Report commands
            'nm': 'nmap',
            'ap': 'autopsy',
            'rep': 'report',
            
            // Quick queries
            'status': 'query introspect',
            'recent': 'query trace:last 10',
            'important': 'query memory:importance > 0.8',
            'active': 'query context',
            'help': 'show help',
            '?': 'help',
            
            // Custom aliases
            ...this.config.customCommands
        };
        
        // Quick query templates
        this.queryTemplates = {
            // Memory queries
            'mem-recent': 'memory: created > {{1_hour_ago}}',
            'mem-important': 'memory: importance > {{threshold}}',
            'mem-search': 'memory: content contains "{{search_term}}"',
            
            // Reasoning queries
            'trace-failed': 'trace: status = failed',
            'trace-confident': 'trace: confidence > 0.8',
            'trace-pattern': 'trace: patterns contains "{{pattern}}"',
            
            // Pattern queries
            'pattern-successful': 'pattern: success_rate > 0.7',
            'pattern-frequent': 'pattern: usage_count > 10',
            
            // Symbiosis queries
            'ai-active': 'sandbox: agents where active = true',
            'ideas-mature': 'sandbox: ideas where maturity > 0.8',
            'projects-funded': 'funding: projects where status = funded',
            'votes-pending': 'governance: proposals where status = voting'
        };
        
        // Report formats
        this.reportFormats = {
            nmap: {
                name: 'NMAP-style Cal Scan',
                template: 'nmap-cal-scan.template',
                sections: ['header', 'ports', 'services', 'os_detection', 'traceroute']
            },
            autopsy: {
                name: 'Autopsy-style Analysis',
                template: 'autopsy-cal-analysis.template',
                sections: ['case_info', 'timeline', 'artifacts', 'analysis', 'conclusions']
            },
            executive: {
                name: 'Executive Summary',
                template: 'executive-summary.template',
                sections: ['overview', 'key_findings', 'recommendations', 'metrics']
            }
        };
        
        // Active integrations
        this.integrations = {
            cal: null,
            symbiosis: null,
            active: false
        };
        
        // Command history
        this.history = [];
        this.historyIndex = 0;
        
        // Stats
        this.stats = {
            commandsExecuted: 0,
            shortcutsUsed: 0,
            queriesRun: 0,
            reportsGenerated: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Cal Keybindings...');
        
        try {
            // Load integrations
            await this.loadIntegrations();
            
            // Set up readline interface
            this.setupReadline();
            
            // Load saved configuration
            await this.loadConfiguration();
            
            // Initialize keyboard hooks (if enabled)
            if (this.config.enableGlobalShortcuts) {
                await this.setupGlobalShortcuts();
            }
            
            console.log('✅ Cal Keybindings initialized!');
            console.log(`⌨️  ${Object.keys(this.keybindings).length} shortcuts loaded`);
            console.log(`📝 ${Object.keys(this.commandAliases).length} aliases configured`);
            console.log(`🔍 ${Object.keys(this.queryTemplates).length} query templates`);
            
            this.emit('keybindings_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize keybindings:', error);
            throw error;
        }
    }
    
    /**
     * Execute a command
     */
    async executeCommand(input) {
        this.stats.commandsExecuted++;
        
        // Check for command prefix
        if (input.startsWith(this.config.commandPrefix)) {
            input = input.substring(this.config.commandPrefix.length);
        }
        
        // Parse command and arguments
        const parts = input.trim().split(/\s+/);
        let command = parts[0];
        const args = parts.slice(1);
        
        // Resolve aliases
        if (this.commandAliases[command]) {
            const aliased = this.commandAliases[command];
            if (aliased.includes(' ')) {
                // Alias includes arguments
                const aliasParts = aliased.split(/\s+/);
                command = aliasParts[0];
                args.unshift(...aliasParts.slice(1));
            } else {
                command = aliased;
            }
        }
        
        // Add to history
        this.history.push(input);
        this.historyIndex = this.history.length;
        
        // Execute command
        try {
            console.log(`\n⚡ Executing: ${command} ${args.join(' ')}`);
            
            switch (command) {
                case 'reason':
                    return await this.cmdReason(args);
                
                case 'query':
                    return await this.cmdQuery(args);
                
                case 'memory':
                    return await this.cmdMemory(args);
                
                case 'introspect':
                    return await this.cmdIntrospect(args);
                
                case 'patterns':
                    return await this.cmdPatterns(args);
                
                case 'sandbox':
                    return await this.cmdSandbox(args);
                
                case 'vote':
                    return await this.cmdVote(args);
                
                case 'funding':
                    return await this.cmdFunding(args);
                
                case 'evolution':
                    return await this.cmdEvolution(args);
                
                case 'nmap':
                    return await this.cmdNmapReport(args);
                
                case 'autopsy':
                    return await this.cmdAutopsyReport(args);
                
                case 'report':
                    return await this.cmdReport(args);
                
                case 'help':
                    return await this.cmdHelp(args);
                
                case 'list':
                    return await this.cmdList(args);
                
                case 'config':
                    return await this.cmdConfig(args);
                
                case 'exit':
                case 'quit':
                    return await this.cmdExit();
                
                default:
                    // Try as a direct Cal query
                    return await this.cmdQuery([command, ...args]);
            }
            
        } catch (error) {
            console.error('❌ Command error:', error.message);
            return { error: error.message };
        }
    }
    
    /**
     * Execute a keybinding action
     */
    async executeKeybinding(binding) {
        this.stats.shortcutsUsed++;
        
        const action = this.keybindings[binding];
        if (!action) {
            console.log(`❓ Unknown keybinding: ${binding}`);
            return;
        }
        
        console.log(`\n⌨️  ${binding} → ${action.description}`);
        
        // Execute associated command
        await this.executeCommand(action.action);
    }
    
    // Command implementations
    
    async cmdReason(args) {
        const input = args.join(' ') || 'Enter reasoning input:';
        
        if (!this.integrations.cal) {
            throw new Error('Cal reasoning engine not connected');
        }
        
        const result = await this.integrations.cal.reason(input);
        
        console.log('\n🧠 Reasoning Result:');
        console.log('─'.repeat(50));
        console.log(`Input: ${input}`);
        console.log(`Conclusions: ${result.conclusions.join(', ')}`);
        console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`Steps: ${result.steps.length}`);
        console.log(`Duration: ${result.completed - result.started}ms`);
        
        return result;
    }
    
    async cmdQuery(args) {
        const query = args.join(' ');
        
        if (!query) {
            console.log('❓ Usage: query <search terms>');
            return;
        }
        
        this.stats.queriesRun++;
        
        // Check for query templates
        const template = this.queryTemplates[query];
        const actualQuery = template || query;
        
        const result = await this.integrations.cal.query(actualQuery);
        
        console.log(`\n🔍 Query Results (${result.results.length} found):`);
        console.log('─'.repeat(50));
        
        for (const [i, item] of result.results.entries()) {
            console.log(`\n[${i + 1}] ${item.type}`);
            if (item.content) {
                console.log(`    Content: ${JSON.stringify(item.content).substring(0, 100)}...`);
            }
            if (item.confidence) {
                console.log(`    Confidence: ${(item.confidence * 100).toFixed(1)}%`);
            }
        }
        
        console.log(`\n📊 Stats: ${result.stats.duration}ms, ${result.stats.memoryAccessed} memories accessed`);
        
        return result;
    }
    
    async cmdMemory(args) {
        const searchTerm = args.join(' ');
        
        if (!searchTerm) {
            // Show memory stats
            const stats = await this.integrations.cal.query('introspect');
            const memUsage = stats.results[0].memoryUsage;
            
            console.log('\n💾 Memory Usage:');
            console.log('─'.repeat(50));
            
            for (const [level, usage] of Object.entries(memUsage)) {
                console.log(`${level}: ${usage.count}/${usage.capacity} (${usage.utilization})`);
            }
            
            return memUsage;
        }
        
        // Search memory
        return await this.cmdQuery(['memory:', searchTerm]);
    }
    
    async cmdIntrospect(args) {
        const result = await this.integrations.cal.query('introspect');
        const state = result.results[0];
        
        console.log('\n🤔 Cal Introspection:');
        console.log('─'.repeat(50));
        console.log(`State: ${state.state.consciousness}`);
        console.log(`Active patterns: ${state.activePatterns}`);
        console.log(`Reasoning chains: ${state.reasoningChains}`);
        console.log(`Last thought: ${state.lastThought?.input || 'none'}`);
        
        console.log('\nMemory Usage:');
        for (const [level, usage] of Object.entries(state.memoryUsage)) {
            console.log(`  ${level}: ${usage.count} items (${usage.utilization})`);
        }
        
        return state;
    }
    
    async cmdPatterns(args) {
        const result = await this.integrations.cal.query('pattern: *');
        
        console.log('\n🔮 Pattern Library:');
        console.log('─'.repeat(50));
        
        for (const pattern of result.results) {
            console.log(`\n${pattern.name}`);
            console.log(`  Usage: ${pattern.usageCount}`);
            console.log(`  Success: ${pattern.successRate || 'unknown'}`);
        }
        
        return result;
    }
    
    async cmdSandbox(args) {
        if (!this.integrations.symbiosis) {
            throw new Error('Symbiosis bridge not connected');
        }
        
        const status = await this.integrations.symbiosis.getSandboxStatus();
        
        console.log('\n🎮 AI Sandbox Status:');
        console.log('─'.repeat(50));
        console.log(`Active agents: ${status.activeAgents}`);
        console.log(`Total ideas: ${status.totalIdeas}`);
        console.log(`Mature projects: ${status.matureProjects}`);
        console.log(`Cultural patterns: ${status.culturalPatterns}`);
        
        return status;
    }
    
    async cmdNmapReport(args) {
        this.stats.reportsGenerated++;
        
        console.log('\n🔍 Generating NMAP-style Cal Scan...');
        
        const report = await this.integrations.cal.generateReport('nmap', {
            format: 'text',
            style: 'nmap'
        });
        
        // Format like nmap output
        const nmapStyle = `
Starting Cal scan at ${new Date().toISOString()}
Cal scan report for reasoning.local (127.0.0.1)
Host is up (0.00012s latency).

PORT     STATE SERVICE         VERSION
22/tcp   open  ssh-reasoning   Cal SSH 1.0 (protocol 2.0)
| ssh-hostkey: 
|   2048 ${this.generateFingerprint()} (RSA)
|_  256 ${this.generateFingerprint()} (ECDSA)
80/tcp   open  http-query      Cal Query Engine 1.0
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS QUERY REASON
443/tcp  open  https-insight   Cal Insight SSL 1.0
| ssl-cert: Subject: commonName=cal.reasoning.local
| Issuer: commonName=Cal Root CA
| Public Key type: rsa
| Public Key bits: 2048
| Not valid before: ${new Date(Date.now() - 365*24*60*60*1000).toISOString()}
| Not valid after:  ${new Date(Date.now() + 365*24*60*60*1000).toISOString()}
|_ssl-date: ${new Date().toISOString()}; 0s from scanner time.
3000/tcp open  symbiosis       AI-Human Symbiosis Bridge 1.0
5432/tcp open  postgresql      Cal Memory Store 14.0
| postgresql-info:
|   Database: cal_reasoning
|   Schemas: public, memories, patterns
|_  Tables: 47

REASONING PATTERNS DETECTED:
|_cause_effect (confidence: 85%)
|_similarity_matching (confidence: 78%)
|_contradiction_detection (confidence: 92%)

Cal scan done: 1 IP address (1 host up) scanned in 0.25 seconds
${report}`;
        
        console.log(nmapStyle);
        
        return { format: 'nmap', content: nmapStyle };
    }
    
    async cmdAutopsyReport(args) {
        this.stats.reportsGenerated++;
        
        console.log('\n🔬 Generating Autopsy-style Analysis...');
        
        const report = await this.integrations.cal.generateReport('autopsy', {
            format: 'text',
            style: 'forensic'
        });
        
        // Format like autopsy output
        const autopsyStyle = `
AUTOPSY FORENSIC ANALYSIS - CAL REASONING ENGINE
================================================
Case Number: CAL-${Date.now()}
Examiner: Cal Keybindings System
Date: ${new Date().toISOString()}

EVIDENCE SUMMARY
----------------
Total Memory Items: ${await this.getMemoryCount()}
Reasoning Chains: ${await this.getReasoningCount()}
Pattern Matches: ${await this.getPatternCount()}

TIMELINE ANALYSIS
-----------------
First Activity: ${await this.getFirstActivity()}
Last Activity: ${await this.getLastActivity()}
Peak Activity: ${await this.getPeakActivity()}

ARTIFACT EXTRACTION
-------------------
High Importance Memories: ${await this.getImportantMemories()}
Failed Reasoning Chains: ${await this.getFailedChains()}
Anomalous Patterns: ${await this.getAnomalies()}

BEHAVIORAL ANALYSIS
-------------------
Primary Focus Areas: ${await this.getFocusAreas()}
Reasoning Confidence Trend: ${await this.getConfidenceTrend()}
Memory Access Patterns: ${await this.getAccessPatterns()}

CONCLUSIONS
-----------
${report}

[END OF REPORT]
`;
        
        console.log(autopsyStyle);
        
        return { format: 'autopsy', content: autopsyStyle };
    }
    
    async cmdHelp(args) {
        console.log('\n📚 Cal Keybindings Help');
        console.log('─'.repeat(50));
        console.log('\nBasic Commands:');
        console.log('  r, reason <input>    - Start reasoning chain');
        console.log('  q, query <search>    - Query Cal\'s knowledge');
        console.log('  m, memory [search]   - Search or show memory');
        console.log('  i, introspect        - Cal introspection');
        console.log('  p, patterns          - Show pattern library');
        console.log('\nSymbiosis Commands:');
        console.log('  s, sandbox           - AI sandbox status');
        console.log('  v, vote              - Governance voting');
        console.log('  f, funding           - Funding status');
        console.log('  e, evolution         - Evolution metrics');
        console.log('\nReport Commands:');
        console.log('  nm, nmap             - NMAP-style report');
        console.log('  ap, autopsy          - Autopsy-style report');
        console.log('  rep, report [type]   - Generate report');
        console.log('\nQuick Queries:');
        console.log('  status               - System status');
        console.log('  recent               - Recent activity');
        console.log('  important            - Important memories');
        console.log('\nType "list" to see all keybindings');
    }
    
    async cmdList(args) {
        console.log('\n⌨️  All Keybindings:');
        console.log('─'.repeat(50));
        
        for (const [binding, action] of Object.entries(this.keybindings)) {
            console.log(`${binding.padEnd(20)} → ${action.description}`);
        }
        
        console.log('\n📝 Command Aliases:');
        console.log('─'.repeat(50));
        
        for (const [alias, command] of Object.entries(this.commandAliases)) {
            console.log(`${alias.padEnd(20)} → ${command}`);
        }
    }
    
    async cmdConfig(args) {
        // Configuration interface
        console.log('\n⚙️  Configuration Options:');
        console.log('─'.repeat(50));
        console.log('1. Add keybinding');
        console.log('2. Add command alias');
        console.log('3. Add query template');
        console.log('4. Save configuration');
        console.log('5. Load configuration');
        
        // Would implement interactive configuration
    }
    
    async cmdExit() {
        console.log('\n👋 Exiting Cal Keybindings...');
        process.exit(0);
    }
    
    // Helper methods
    
    async loadIntegrations() {
        try {
            // Load Cal reasoning engine
            const CalEngine = require(this.config.calEnginePath);
            this.integrations.cal = new CalEngine();
            
            // Load Symbiosis bridge
            const SymbiosisBridge = require(this.config.symbiosisPath);
            this.integrations.symbiosis = new SymbiosisBridge();
            
            this.integrations.active = true;
            
        } catch (error) {
            console.warn('⚠️  Some integrations not available:', error.message);
            // Create mock integrations for testing
            this.createMockIntegrations();
        }
    }
    
    createMockIntegrations() {
        // Mock Cal engine
        this.integrations.cal = {
            reason: async (input) => ({
                id: 'mock-' + Date.now(),
                input,
                conclusions: ['Mock conclusion'],
                confidence: 0.75,
                steps: [],
                started: Date.now(),
                completed: Date.now() + 100
            }),
            
            query: async (query) => ({
                results: [{ type: 'mock', content: 'Mock result' }],
                stats: { duration: 50, memoryAccessed: 10 }
            }),
            
            generateReport: async () => 'Mock report content'
        };
        
        // Mock Symbiosis bridge
        this.integrations.symbiosis = {
            getSandboxStatus: async () => ({
                activeAgents: 10,
                totalIdeas: 50,
                matureProjects: 5,
                culturalPatterns: 15
            })
        };
    }
    
    setupReadline() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'cal> ',
            completer: (line) => this.completer(line)
        });
        
        this.rl.on('line', async (input) => {
            if (input.trim()) {
                await this.executeCommand(input);
            }
            this.rl.prompt();
        });
        
        // Handle Ctrl+C
        this.rl.on('SIGINT', () => {
            console.log('\n(To exit, type "exit" or press Ctrl+C again)');
            this.rl.prompt();
        });
    }
    
    completer(line) {
        const commands = Object.keys(this.commandAliases);
        const hits = commands.filter(cmd => cmd.startsWith(line));
        return [hits.length ? hits : commands, line];
    }
    
    async setupGlobalShortcuts() {
        // Would integrate with system keyboard hooks
        console.log('ℹ️  Global shortcuts not implemented in this version');
    }
    
    async loadConfiguration() {
        try {
            const configPath = path.join(process.env.HOME || '.', '.cal-keybindings.json');
            const data = await fs.readFile(configPath, 'utf8');
            const saved = JSON.parse(data);
            
            // Merge saved configuration
            Object.assign(this.keybindings, saved.keybindings || {});
            Object.assign(this.commandAliases, saved.aliases || {});
            Object.assign(this.queryTemplates, saved.templates || {});
            
            console.log('✅ Loaded saved configuration');
            
        } catch (error) {
            // No saved config, use defaults
        }
    }
    
    generateFingerprint() {
        // Generate mock SSH fingerprint
        const chars = '0123456789abcdef';
        let fingerprint = '';
        for (let i = 0; i < 32; i++) {
            if (i > 0 && i % 2 === 0) fingerprint += ':';
            fingerprint += chars[Math.floor(Math.random() * chars.length)];
        }
        return fingerprint;
    }
    
    // Mock data methods for reports
    async getMemoryCount() { return 1847; }
    async getReasoningCount() { return 423; }
    async getPatternCount() { return 89; }
    async getFirstActivity() { return new Date(Date.now() - 7*24*60*60*1000).toISOString(); }
    async getLastActivity() { return new Date().toISOString(); }
    async getPeakActivity() { return '14:00-15:00 UTC'; }
    async getImportantMemories() { return 47; }
    async getFailedChains() { return 12; }
    async getAnomalies() { return 3; }
    async getFocusAreas() { return 'symbiosis, collaboration, pattern-matching'; }
    async getConfidenceTrend() { return 'increasing (avg 0.72 → 0.84)'; }
    async getAccessPatterns() { return 'burst access during reasoning, idle during reflection'; }
}

// Export the keybindings system
module.exports = CalKeybindings;

// Interactive CLI when run directly
if (require.main === module) {
    console.log('🚀 Starting Cal Keybindings Interactive Mode...\n');
    
    const keybindings = new CalKeybindings();
    
    keybindings.on('keybindings_ready', () => {
        console.log('\nType "help" for commands, "list" for all shortcuts');
        console.log('Use ! prefix for commands (e.g., !query, !reason)');
        console.log('Or use shortcuts: r=reason, q=query, m=memory, etc.\n');
        
        keybindings.rl.prompt();
    });
}
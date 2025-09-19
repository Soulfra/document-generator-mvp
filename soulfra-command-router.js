/**
 * SOULFRA COMMAND ROUTER
 * 
 * Universal command routing system that connects voice, UI, and terminal.
 * Like the nervous system of your digital ecosystem.
 */

class SoulFraCommandRouter {
    constructor() {
        this.commandHistory = [];
        this.activeConnections = new Map();
        this.systemState = {
            authenticated: {},
            services: {},
            lastSync: null
        };
        
        // Command categories for routing
        this.commandCategories = {
            auth: ['login', 'logout', 'connect', 'disconnect', 'authenticate'],
            status: ['status', 'check', 'show', 'display', 'list'],
            control: ['open', 'launch', 'start', 'stop', 'close'],
            data: ['token', 'key', 'credential', 'secret'],
            system: ['refresh', 'sync', 'update', 'restart'],
            help: ['help', 'assist', 'guide', 'explain']
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🧠 Initializing Command Router...');
        
        // Load system state
        await this.loadSystemState();
        
        // Set up service connections
        await this.establishConnections();
        
        // Start periodic state sync
        this.startStateSync();
        
        console.log('✅ Command Router ready');
    }
    
    async loadSystemState() {
        try {
            const stored = localStorage.getItem('soulfra-system-state');
            if (stored) {
                this.systemState = { ...this.systemState, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.warn('Could not load system state:', error);
        }
    }
    
    async saveSystemState() {
        try {
            localStorage.setItem('soulfra-system-state', JSON.stringify(this.systemState));
        } catch (error) {
            console.warn('Could not save system state:', error);
        }
    }
    
    async establishConnections() {
        // OAuth Daemon connection
        try {
            const response = await fetch('http://localhost:8463/health');
            if (response.ok) {
                this.activeConnections.set('oauth-daemon', {
                    url: 'http://localhost:8463',
                    status: 'connected',
                    lastPing: Date.now()
                });
            }
        } catch (error) {
            this.activeConnections.set('oauth-daemon', {
                url: 'http://localhost:8463',
                status: 'disconnected',
                error: error.message
            });
        }
        
        // GitHub Wrapper connection
        try {
            const response = await fetch('http://localhost:3337');
            if (response.ok) {
                this.activeConnections.set('github-wrapper', {
                    url: 'http://localhost:3337',
                    status: 'connected',
                    lastPing: Date.now()
                });
            }
        } catch (error) {
            this.activeConnections.set('github-wrapper', {
                url: 'http://localhost:3337',
                status: 'disconnected',
                error: error.message
            });
        }
        
        // Terminal TUI (check if process exists)
        this.activeConnections.set('terminal-tui', {
            command: 'node soulfra-auth-tui.js',
            status: 'available',
            type: 'terminal'
        });
    }
    
    startStateSync() {
        // Sync system state every 30 seconds
        setInterval(async () => {
            await this.syncSystemState();
        }, 30000);
    }
    
    async syncSystemState() {
        try {
            // Update service authentication status
            const response = await fetch('http://localhost:8463/providers');
            if (response.ok) {
                const providers = await response.json();
                this.systemState.authenticated = providers;
                this.systemState.lastSync = new Date();
                await this.saveSystemState();
            }
        } catch (error) {
            console.warn('State sync failed:', error);
        }
    }
    
    async routeCommand(command, context = {}) {
        const routedCommand = this.parseCommand(command);
        
        // Log command
        this.commandHistory.push({
            original: command,
            parsed: routedCommand,
            context,
            timestamp: new Date(),
            source: context.source || 'unknown'
        });
        
        // Keep history limited
        if (this.commandHistory.length > 100) {
            this.commandHistory.shift();
        }
        
        console.log('🎯 Routing command:', routedCommand);
        
        // Route to appropriate handler
        try {
            const result = await this.executeCommand(routedCommand, context);
            return {
                success: true,
                result,
                command: routedCommand
            };
        } catch (error) {
            console.error('Command execution failed:', error);
            return {
                success: false,
                error: error.message,
                command: routedCommand
            };
        }
    }
    
    parseCommand(command) {
        const normalized = command.toLowerCase().trim();
        const words = normalized.split(/\s+/);
        
        // Extract action verb
        const action = this.extractAction(words);
        
        // Extract target/service
        const target = this.extractTarget(words);
        
        // Extract parameters
        const params = this.extractParameters(words, action, target);
        
        return {
            action,
            target,
            params,
            original: command,
            category: this.categorizeCommand(action)
        };
    }
    
    extractAction(words) {
        // Common action mappings
        const actionMappings = {
            'login': ['login', 'signin', 'connect', 'authenticate', 'auth'],
            'logout': ['logout', 'signout', 'disconnect', 'deauth'],
            'status': ['status', 'check', 'show', 'display', 'list', 'what'],
            'open': ['open', 'launch', 'start', 'run'],
            'close': ['close', 'stop', 'exit', 'quit'],
            'get': ['get', 'show', 'display', 'fetch', 'retrieve'],
            'refresh': ['refresh', 'update', 'sync', 'reload'],
            'help': ['help', 'assist', 'guide', 'explain', 'how']
        };
        
        for (const [action, variants] of Object.entries(actionMappings)) {
            if (variants.some(variant => words.includes(variant))) {
                return action;
            }
        }
        
        // Default action based on first word
        return words[0] || 'unknown';
    }
    
    extractTarget(words) {
        // Service mappings
        const serviceMappings = {
            'github': ['github', 'git'],
            'google': ['google', 'gmail'],
            'microsoft': ['microsoft', 'ms', 'office'],
            'teams': ['teams', 'msteams'],
            'slack': ['slack'],
            'discord': ['discord'],
            'terminal': ['terminal', 'tui', 'cli'],
            'desktop': ['desktop', 'wrapper'],
            'all': ['all', 'everything', 'services']
        };
        
        for (const [service, variants] of Object.entries(serviceMappings)) {
            if (variants.some(variant => words.includes(variant))) {
                return service;
            }
        }
        
        // Look for specific patterns
        if (words.includes('token') || words.includes('key')) {
            // Find which service token is requested
            for (const [service, variants] of Object.entries(serviceMappings)) {
                if (variants.some(variant => words.includes(variant))) {
                    return service;
                }
            }
            return 'token';
        }
        
        return 'general';
    }
    
    extractParameters(words, action, target) {
        const params = {};
        
        // Extract specific parameters based on context
        if (words.includes('token') || words.includes('key')) {
            params.type = 'token';
        }
        
        if (words.includes('status') || words.includes('connected')) {
            params.type = 'status';
        }
        
        if (words.includes('all') || words.includes('everything')) {
            params.scope = 'all';
        }
        
        return params;
    }
    
    categorizeCommand(action) {
        for (const [category, actions] of Object.entries(this.commandCategories)) {
            if (actions.includes(action)) {
                return category;
            }
        }
        return 'general';
    }
    
    async executeCommand(parsedCommand, context) {
        const { action, target, params, category } = parsedCommand;
        
        // Route based on category
        switch (category) {
            case 'auth':
                return this.handleAuthCommand(action, target, params, context);
            
            case 'status':
                return this.handleStatusCommand(action, target, params, context);
            
            case 'control':
                return this.handleControlCommand(action, target, params, context);
            
            case 'data':
                return this.handleDataCommand(action, target, params, context);
            
            case 'system':
                return this.handleSystemCommand(action, target, params, context);
            
            case 'help':
                return this.handleHelpCommand(action, target, params, context);
            
            default:
                return this.handleGeneralCommand(action, target, params, context);
        }
    }
    
    async handleAuthCommand(action, target, params, context) {
        const connection = this.activeConnections.get('oauth-daemon');
        
        if (!connection || connection.status !== 'connected') {
            throw new Error('OAuth daemon not available. Please start the daemon first.');
        }
        
        switch (action) {
            case 'login':
                return this.executeLogin(target, context);
            
            case 'logout':
                return this.executeLogout(target, context);
            
            default:
                throw new Error(`Unknown auth action: ${action}`);
        }
    }
    
    async executeLogin(service, context) {
        if (service === 'all') {
            throw new Error('Cannot login to all services at once. Please specify a service.');
        }
        
        const response = await fetch('http://localhost:8463/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: service })
        });
        
        if (!response.ok) {
            throw new Error(`Login failed for ${service}`);
        }
        
        const flow = await response.json();
        
        // Open browser for OAuth (if not in terminal context)
        if (context.source !== 'terminal') {
            window.open(flow.authUrl, '_blank');
        }
        
        return {
            message: `OAuth flow started for ${service}`,
            authUrl: flow.authUrl,
            flowId: flow.flowId
        };
    }
    
    async executeLogout(service, context) {
        const response = await fetch('http://localhost:8463/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: service })
        });
        
        if (!response.ok) {
            throw new Error(`Logout failed for ${service}`);
        }
        
        return {
            message: `Successfully logged out from ${service}`
        };
    }
    
    async handleStatusCommand(action, target, params, context) {
        if (target === 'all' || params.scope === 'all') {
            return this.getSystemStatus();
        } else {
            return this.getServiceStatus(target);
        }
    }
    
    async getSystemStatus() {
        const systemStatus = {
            connections: Object.fromEntries(this.activeConnections),
            authentication: this.systemState.authenticated,
            lastSync: this.systemState.lastSync,
            commandHistory: this.commandHistory.slice(-5) // Last 5 commands
        };
        
        return systemStatus;
    }
    
    async getServiceStatus(service) {
        const auth = this.systemState.authenticated[service];
        if (!auth) {
            return { service, status: 'unknown' };
        }
        
        return {
            service,
            authenticated: auth.authenticated,
            account: auth.account,
            lastCheck: this.systemState.lastSync
        };
    }
    
    async handleDataCommand(action, target, params, context) {
        if (action === 'get' && (target === 'token' || params.type === 'token')) {
            return this.getToken(target, context);
        }
        
        throw new Error(`Unknown data command: ${action} ${target}`);
    }
    
    async getToken(service, context) {
        const response = await fetch(`http://localhost:8463/token?provider=${service}`);
        
        if (!response.ok) {
            throw new Error(`Token not found for ${service}`);
        }
        
        const tokenData = await response.json();
        
        // Don't return actual token in voice context for security
        if (context.source === 'voice') {
            return {
                message: `Token retrieved for ${service}`,
                account: tokenData.account,
                hasToken: true
            };
        }
        
        return tokenData;
    }
    
    async handleControlCommand(action, target, params, context) {
        switch (action) {
            case 'open':
                return this.openTarget(target, context);
            
            case 'close':
                return this.closeTarget(target, context);
            
            default:
                throw new Error(`Unknown control action: ${action}`);
        }
    }
    
    async openTarget(target, context) {
        switch (target) {
            case 'github':
            case 'desktop':
                if (context.source === 'voice' || context.source === 'ui') {
                    window.open('http://localhost:3337', '_blank');
                }
                return { message: 'Opening GitHub Desktop wrapper' };
            
            case 'terminal':
                return { 
                    message: 'Terminal TUI available',
                    command: 'node soulfra-auth-tui.js'
                };
            
            default:
                throw new Error(`Don't know how to open ${target}`);
        }
    }
    
    async closeTarget(target, context) {
        return { message: `Close command for ${target} not implemented yet` };
    }
    
    async handleSystemCommand(action, target, params, context) {
        switch (action) {
            case 'refresh':
                return this.refreshSystem(target, context);
            
            default:
                throw new Error(`Unknown system action: ${action}`);
        }
    }
    
    async refreshSystem(target, context) {
        await this.syncSystemState();
        
        // Trigger UI refresh if available
        if (context.source === 'ui' && window.refreshAll) {
            window.refreshAll();
        }
        
        return {
            message: 'System state refreshed',
            lastSync: this.systemState.lastSync
        };
    }
    
    async handleHelpCommand(action, target, params, context) {
        const helpTopics = {
            commands: [
                'Login: "login to github" or "connect to google"',
                'Status: "what is connected" or "show status"',
                'Tokens: "show github token" or "get google token"',
                'Control: "open github desktop" or "launch terminal"',
                'System: "refresh all" or "sync everything"'
            ],
            voice: [
                'Start with "SoulFra" followed by your command',
                'Speak clearly and naturally',
                'Available wake phrases: "SoulFra", "Soul Fra", "Hey SoulFra"',
                'Say "help commands" for available commands'
            ],
            system: [
                'OAuth tokens stored in system keychain',
                'Multiple interfaces: Voice, UI, Terminal',
                'Real-time sync between all components',
                'Background daemon manages connections'
            ]
        };
        
        if (target && helpTopics[target]) {
            return {
                topic: target,
                help: helpTopics[target]
            };
        }
        
        return {
            message: 'SoulFra Command Router Help',
            topics: Object.keys(helpTopics),
            usage: 'Say "help commands" or "help voice" for specific topics'
        };
    }
    
    async handleGeneralCommand(action, target, params, context) {
        // Handle unrecognized commands
        return {
            message: `Unknown command: ${action} ${target}`,
            suggestion: 'Say "help commands" for available commands',
            parsed: { action, target, params }
        };
    }
    
    // Utility methods
    getCommandHistory(limit = 10) {
        return this.commandHistory.slice(-limit);
    }
    
    getActiveConnections() {
        return Object.fromEntries(this.activeConnections);
    }
    
    getSystemState() {
        return this.systemState;
    }
    
    async testConnection(service) {
        const connection = this.activeConnections.get(service);
        if (!connection) {
            return { status: 'unknown', service };
        }
        
        try {
            const response = await fetch(connection.url + '/health');
            const isHealthy = response.ok;
            
            connection.status = isHealthy ? 'connected' : 'error';
            connection.lastPing = Date.now();
            
            return {
                service,
                status: connection.status,
                url: connection.url,
                lastPing: connection.lastPing
            };
        } catch (error) {
            connection.status = 'disconnected';
            connection.error = error.message;
            
            return {
                service,
                status: 'disconnected',
                error: error.message
            };
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoulFraCommandRouter;
}
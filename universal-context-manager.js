#!/usr/bin/env node

/**
 * UNIVERSAL CONTEXT MANAGER
 * Detects current domain/context and manages transitions between interface modes
 * Handles: database, multiplayer, ads, obituary, inbox, games, learning, etc.
 * 
 * This is the brain that figures out what kind of interface you need right now
 * and switches between them seamlessly.
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class UniversalContextManager extends EventEmitter {
    constructor() {
        super();
        
        // Context detection state
        this.currentContext = 'idle';
        this.previousContext = null;
        this.contextHistory = [];
        this.contextStartTime = Date.now();
        
        // Context definitions and their characteristics
        this.contextDefinitions = {
            database: {
                name: 'Database Learning',
                description: 'Learning and building from database interactions',
                lagSettings: { baseDelay: 1200, oscillationRange: 300, learning: true },
                uiStyle: 'analytical',
                color: '#00ff88',
                priority: 5,
                keywords: ['database', 'learn', 'query', 'data', 'analytics', 'sql', 'search']
            },
            
            multiplayer: {
                name: 'Multiplayer Reality',
                description: 'Shared reality with other players/NPCs',
                lagSettings: { baseDelay: 600, oscillationRange: 150, synchronized: true },
                uiStyle: 'collaborative',
                color: '#ff6b35',
                priority: 8,
                keywords: ['player', 'multiplayer', 'npc', 'shared', 'team', 'collaborate', 'chat']
            },
            
            ads: {
                name: 'Advertising Layer',
                description: 'Commercial interface with attention-grabbing elements',
                lagSettings: { baseDelay: 300, oscillationRange: 100, attention: true },
                uiStyle: 'commercial',
                color: '#f39c12',
                priority: 3,
                keywords: ['ads', 'advertisement', 'commercial', 'marketing', 'buy', 'sell', 'product']
            },
            
            obituary: {
                name: 'Memorial Layer',
                description: 'Respectful, contemplative interface for remembrance',
                lagSettings: { baseDelay: 2000, oscillationRange: 500, respectful: true },
                uiStyle: 'memorial',
                color: '#666666',
                priority: 9,
                keywords: ['obituary', 'memorial', 'death', 'remembrance', 'funeral', 'tribute', 'grief']
            },
            
            inbox: {
                name: 'Communication Hub',
                description: 'Communication-focused interface for messages',
                lagSettings: { baseDelay: 400, oscillationRange: 100, communication: true },
                uiStyle: 'communication',
                color: '#3498db',
                priority: 6,
                keywords: ['inbox', 'message', 'email', 'chat', 'communication', 'mail', 'notification']
            },
            
            games: {
                name: 'Gaming Reality',
                description: 'Gaming-specific HUD and mechanics',
                lagSettings: { baseDelay: 850, oscillationRange: 200, gaming: true },
                uiStyle: 'gaming',
                color: '#2ecc71',
                priority: 7,
                keywords: ['game', 'gaming', 'play', 'quest', 'achievement', 'score', 'level']
            },
            
            centipede: {
                name: 'Centipede Authentication',
                description: 'Centipede fishing line authentication system',
                lagSettings: { baseDelay: 750, oscillationRange: 250, authentication: true },
                uiStyle: 'organic',
                color: '#8a2be2',
                priority: 8,
                keywords: ['centipede', 'fishing', 'authentication', 'auth', 'login', 'security']
            },
            
            ships: {
                name: 'Ship Navigation',
                description: 'Ship schematics and blueprint interface',
                lagSettings: { baseDelay: 900, oscillationRange: 200, navigation: true },
                uiStyle: 'nautical',
                color: '#1e90ff',
                priority: 6,
                keywords: ['ship', 'blueprint', 'navigation', 'maritime', 'vessel', 'sailing']
            },
            
            economics: {
                name: 'Economic Analysis',
                description: 'Financial and economic decision interface',
                lagSettings: { baseDelay: 600, oscillationRange: 150, analytical: true },
                uiStyle: 'financial',
                color: '#ffd700',
                priority: 5,
                keywords: ['economy', 'finance', 'money', 'budget', 'cost', 'profit', 'investment']
            },
            
            idle: {
                name: 'Idle State',
                description: 'Default state when no specific context is detected',
                lagSettings: { baseDelay: 850, oscillationRange: 200, neutral: true },
                uiStyle: 'neutral',
                color: '#ffffff',
                priority: 1,
                keywords: []
            }
        };
        
        // Context detection rules
        this.detectionRules = {
            // File-based detection
            filePatterns: {
                '*.sql': 'database',
                '*.db': 'database',
                '*.json': 'database',
                '*.csv': 'database',
                '*blueprint*': 'ships',
                '*ship*': 'ships',
                '*game*': 'games',
                '*chat*': 'inbox',
                '*message*': 'inbox',
                '*obituary*': 'obituary',
                '*memorial*': 'obituary',
                '*ad*': 'ads',
                '*commercial*': 'ads',
                '*centipede*': 'centipede',
                '*auth*': 'centipede',
                '*finance*': 'economics',
                '*economy*': 'economics'
            },
            
            // URL-based detection
            urlPatterns: {
                '/database': 'database',
                '/db': 'database',
                '/player': 'multiplayer',
                '/multiplayer': 'multiplayer',
                '/ads': 'ads',
                '/obituary': 'obituary',
                '/inbox': 'inbox',
                '/messages': 'inbox',
                '/games': 'games',
                '/game': 'games',
                '/3d': 'games',
                '/centipede': 'centipede',
                '/auth': 'centipede',
                '/ships': 'ships',
                '/blueprint': 'ships',
                '/economics': 'economics',
                '/finance': 'economics'
            },
            
            // Command-based detection
            commandPatterns: {
                'query': 'database',
                'search': 'database',
                'learn': 'database',
                'play': 'multiplayer',
                'join': 'multiplayer',
                'message': 'inbox',
                'mail': 'inbox',
                'game': 'games',
                'auth': 'centipede',
                'login': 'centipede',
                'ship': 'ships',
                'navigate': 'ships',
                'economy': 'economics',
                'budget': 'economics'
            }
        };
        
        // Active context monitoring
        this.monitoring = {
            fileSystem: false,
            webSockets: false,
            keywordAnalysis: true,
            userActivity: true,
            aiInteraction: true
        };
        
        // Context transition handling
        this.transitionInProgress = false;
        this.transitionQueue = [];
        
        this.init();
    }
    
    async init() {
        console.log('🧠 UNIVERSAL CONTEXT MANAGER INITIALIZING...');
        
        // Start context monitoring
        this.startContextMonitoring();
        
        // Initialize context detection
        this.startContextDetection();
        
        // Start transition processing
        this.startTransitionProcessor();
        
        console.log('✅ Universal Context Manager online - all contexts monitored!');
        
        // Emit initial context
        this.emit('context-ready', {
            context: this.currentContext,
            definition: this.contextDefinitions[this.currentContext],
            timestamp: Date.now()
        });
    }
    
    startContextMonitoring() {
        // Monitor for context changes every 100ms
        setInterval(() => {
            this.detectCurrentContext();
        }, 100);
        
        // Deep analysis every 5 seconds
        setInterval(() => {
            this.performDeepContextAnalysis();
        }, 5000);
        
        // Cleanup old context history every minute
        setInterval(() => {
            this.cleanupContextHistory();
        }, 60000);
    }
    
    startContextDetection() {
        // Listen for external context hints
        this.on('context-hint', (hint) => {
            this.processContextHint(hint);
        });
        
        // Listen for file system changes if monitoring enabled
        if (this.monitoring.fileSystem) {
            this.startFileSystemMonitoring();
        }
        
        // Listen for WebSocket activity if monitoring enabled
        if (this.monitoring.webSockets) {
            this.startWebSocketMonitoring();
        }
    }
    
    detectCurrentContext() {
        const detectedContext = this.analyzeCurrentSituation();
        
        if (detectedContext && detectedContext !== this.currentContext) {\n            this.requestContextTransition(detectedContext, 'automatic');\n        }\n    }\n    \n    analyzeCurrentSituation() {\n        const analysis = {\n            keywords: this.analyzeKeywords(),\n            activity: this.analyzeUserActivity(),\n            environment: this.analyzeEnvironment(),\n            ai: this.analyzeAIInteraction()\n        };\n        \n        // Score each context based on evidence\n        const contextScores = {};\n        \n        Object.keys(this.contextDefinitions).forEach(contextKey => {\n            contextScores[contextKey] = this.calculateContextScore(contextKey, analysis);\n        });\n        \n        // Find highest scoring context\n        const bestContext = Object.entries(contextScores)\n            .filter(([context, score]) => score > 0.3) // Minimum confidence threshold\n            .sort(([,a], [,b]) => b - a)[0];\n        \n        return bestContext ? bestContext[0] : null;\n    }\n    \n    calculateContextScore(contextKey, analysis) {\n        const context = this.contextDefinitions[contextKey];\n        let score = 0;\n        \n        // Keyword matching\n        const keywordMatches = context.keywords.filter(keyword => \n            analysis.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))\n        ).length;\n        score += (keywordMatches / Math.max(context.keywords.length, 1)) * 0.4;\n        \n        // Environment analysis\n        if (analysis.environment.context === contextKey) {\n            score += 0.3;\n        }\n        \n        // Activity analysis\n        if (analysis.activity.indicatesContext === contextKey) {\n            score += 0.2;\n        }\n        \n        // AI interaction analysis\n        if (analysis.ai.suggestedContext === contextKey) {\n            score += 0.1;\n        }\n        \n        return Math.min(score, 1.0);\n    }\n    \n    analyzeKeywords() {\n        // Analyze recent activity for context keywords\n        // This would integrate with the reality bridge to get recent inputs\n        const recentInputs = this.getRecentInputs();\n        const keywords = [];\n        \n        recentInputs.forEach(input => {\n            keywords.push(...input.split(/\\s+/));\n        });\n        \n        return keywords;\n    }\n    \n    analyzeUserActivity() {\n        // Analyze what the user has been doing recently\n        const recentActivity = this.getRecentActivity();\n        \n        return {\n            type: recentActivity.type || 'idle',\n            duration: Date.now() - this.contextStartTime,\n            intensity: recentActivity.intensity || 0.5,\n            indicatesContext: recentActivity.suggestedContext || null\n        };\n    }\n    \n    analyzeEnvironment() {\n        // Analyze current environment (files, URLs, etc.)\n        const environment = {\n            workingDirectory: process.cwd(),\n            recentFiles: [],\n            activeConnections: [],\n            context: null\n        };\n        \n        // Check working directory for context clues\n        const dirName = path.basename(environment.workingDirectory).toLowerCase();\n        \n        Object.entries(this.detectionRules.filePatterns).forEach(([pattern, context]) => {\n            const patternRegex = new RegExp(pattern.replace('*', '.*'), 'i');\n            if (patternRegex.test(dirName)) {\n                environment.context = context;\n            }\n        });\n        \n        return environment;\n    }\n    \n    analyzeAIInteraction() {\n        // Analyze recent AI interactions for context\n        return {\n            recentQueries: [],\n            suggestedContext: null,\n            confidence: 0.5\n        };\n    }\n    \n    getRecentInputs() {\n        // This would integrate with the reality bridge to get recent user inputs\n        // For now, return empty array\n        return [];\n    }\n    \n    getRecentActivity() {\n        // This would analyze recent user activity\n        // For now, return default activity\n        return {\n            type: 'idle',\n            intensity: 0.3,\n            suggestedContext: null\n        };\n    }\n    \n    requestContextTransition(newContext, reason = 'unknown') {\n        if (this.transitionInProgress) {\n            // Queue the transition\n            this.transitionQueue.push({ context: newContext, reason, timestamp: Date.now() });\n            return;\n        }\n        \n        console.log(`🔄 Context transition: ${this.currentContext} → ${newContext} (${reason})`);\n        \n        this.transitionInProgress = true;\n        this.performContextTransition(newContext, reason);\n    }\n    \n    async performContextTransition(newContext, reason) {\n        const oldContext = this.currentContext;\n        const oldDefinition = this.contextDefinitions[oldContext];\n        const newDefinition = this.contextDefinitions[newContext];\n        \n        // Record context history\n        this.contextHistory.push({\n            from: oldContext,\n            to: newContext,\n            reason,\n            timestamp: Date.now(),\n            duration: Date.now() - this.contextStartTime\n        });\n        \n        // Emit context change start\n        this.emit('context-transition-start', {\n            from: oldContext,\n            to: newContext,\n            reason,\n            oldDefinition,\n            newDefinition\n        });\n        \n        // Perform the transition\n        this.previousContext = oldContext;\n        this.currentContext = newContext;\n        this.contextStartTime = Date.now();\n        \n        // Wait for transition delay (smooth UX)\n        await this.sleep(100);\n        \n        // Emit context change complete\n        this.emit('context-changed', {\n            context: newContext,\n            definition: newDefinition,\n            previous: oldContext,\n            reason,\n            timestamp: Date.now()\n        });\n        \n        console.log(`✅ Context transition complete: Now in ${newDefinition.name}`);\n        \n        this.transitionInProgress = false;\n        \n        // Process any queued transitions\n        if (this.transitionQueue.length > 0) {\n            const next = this.transitionQueue.shift();\n            setTimeout(() => {\n                this.requestContextTransition(next.context, next.reason);\n            }, 500); // Brief delay between transitions\n        }\n    }\n    \n    startTransitionProcessor() {\n        // Process transition queue every 100ms\n        setInterval(() => {\n            if (!this.transitionInProgress && this.transitionQueue.length > 0) {\n                const next = this.transitionQueue.shift();\n                this.requestContextTransition(next.context, next.reason);\n            }\n        }, 100);\n    }\n    \n    performDeepContextAnalysis() {\n        // Deep analysis of current context validity\n        const analysis = this.analyzeCurrentSituation();\n        const currentScore = this.calculateContextScore(this.currentContext, analysis);\n        \n        // If current context score is too low, trigger re-detection\n        if (currentScore < 0.2) {\n            console.log(`⚠️ Current context confidence low (${currentScore.toFixed(2)}), re-analyzing...`);\n            this.detectCurrentContext();\n        }\n    }\n    \n    cleanupContextHistory() {\n        // Keep only last hour of context history\n        const oneHourAgo = Date.now() - (60 * 60 * 1000);\n        this.contextHistory = this.contextHistory.filter(entry => \n            entry.timestamp > oneHourAgo\n        );\n    }\n    \n    // === PUBLIC API METHODS ===\n    \n    getCurrentContext() {\n        return {\n            context: this.currentContext,\n            definition: this.contextDefinitions[this.currentContext],\n            startTime: this.contextStartTime,\n            duration: Date.now() - this.contextStartTime\n        };\n    }\n    \n    getContextDefinition(contextKey) {\n        return this.contextDefinitions[contextKey] || null;\n    }\n    \n    getAllContexts() {\n        return this.contextDefinitions;\n    }\n    \n    forceContext(contextKey, reason = 'manual') {\n        if (!this.contextDefinitions[contextKey]) {\n            throw new Error(`Unknown context: ${contextKey}`);\n        }\n        \n        this.requestContextTransition(contextKey, reason);\n    }\n    \n    addContextHint(hint) {\n        this.emit('context-hint', hint);\n    }\n    \n    processContextHint(hint) {\n        // Process external context hints\n        const { type, data, source } = hint;\n        \n        switch (type) {\n            case 'keyword':\n                this.processKeywordHint(data, source);\n                break;\n                \n            case 'file':\n                this.processFileHint(data, source);\n                break;\n                \n            case 'url':\n                this.processUrlHint(data, source);\n                break;\n                \n            case 'command':\n                this.processCommandHint(data, source);\n                break;\n                \n            case 'explicit':\n                this.forceContext(data, `hint from ${source}`);\n                break;\n        }\n    }\n    \n    processKeywordHint(keywords, source) {\n        const keywordArray = Array.isArray(keywords) ? keywords : [keywords];\n        \n        // Find context with most keyword matches\n        let bestMatch = null;\n        let bestScore = 0;\n        \n        Object.entries(this.contextDefinitions).forEach(([contextKey, definition]) => {\n            const matches = definition.keywords.filter(keyword => \n                keywordArray.some(k => k.toLowerCase().includes(keyword.toLowerCase()))\n            ).length;\n            \n            const score = matches / Math.max(definition.keywords.length, 1);\n            if (score > bestScore && score > 0.3) {\n                bestMatch = contextKey;\n                bestScore = score;\n            }\n        });\n        \n        if (bestMatch) {\n            this.requestContextTransition(bestMatch, `keyword hint from ${source}`);\n        }\n    }\n    \n    processFileHint(filePath, source) {\n        const fileName = path.basename(filePath).toLowerCase();\n        \n        Object.entries(this.detectionRules.filePatterns).forEach(([pattern, context]) => {\n            const patternRegex = new RegExp(pattern.replace('*', '.*'), 'i');\n            if (patternRegex.test(fileName)) {\n                this.requestContextTransition(context, `file hint: ${fileName}`);\n            }\n        });\n    }\n    \n    processUrlHint(url, source) {\n        Object.entries(this.detectionRules.urlPatterns).forEach(([pattern, context]) => {\n            if (url.includes(pattern)) {\n                this.requestContextTransition(context, `url hint: ${url}`);\n            }\n        });\n    }\n    \n    processCommandHint(command, source) {\n        const commandLower = command.toLowerCase();\n        \n        Object.entries(this.detectionRules.commandPatterns).forEach(([pattern, context]) => {\n            if (commandLower.includes(pattern)) {\n                this.requestContextTransition(context, `command hint: ${command}`);\n            }\n        });\n    }\n    \n    getContextHistory() {\n        return this.contextHistory;\n    }\n    \n    getContextStats() {\n        const stats = {\n            currentContext: this.currentContext,\n            currentDuration: Date.now() - this.contextStartTime,\n            totalTransitions: this.contextHistory.length,\n            contextUsage: {},\n            averageContextDuration: 0\n        };\n        \n        // Calculate context usage statistics\n        Object.keys(this.contextDefinitions).forEach(context => {\n            stats.contextUsage[context] = {\n                count: this.contextHistory.filter(h => h.to === context).length,\n                totalDuration: this.contextHistory\n                    .filter(h => h.to === context)\n                    .reduce((sum, h) => sum + (h.duration || 0), 0)\n            };\n        });\n        \n        // Calculate average context duration\n        const totalDuration = Object.values(stats.contextUsage)\n            .reduce((sum, usage) => sum + usage.totalDuration, 0);\n        stats.averageContextDuration = totalDuration / Math.max(this.contextHistory.length, 1);\n        \n        return stats;\n    }\n    \n    // === UTILITY METHODS ===\n    \n    sleep(ms) {\n        return new Promise(resolve => setTimeout(resolve, ms));\n    }\n    \n    startFileSystemMonitoring() {\n        // Would implement file system watching for context detection\n        console.log('📁 File system monitoring started');\n    }\n    \n    startWebSocketMonitoring() {\n        // Would implement WebSocket monitoring for context detection\n        console.log('🔌 WebSocket monitoring started');\n    }\n}\n\nmodule.exports = UniversalContextManager;\n\n// CLI interface (if run directly)\nif (require.main === module) {\n    const contextManager = new UniversalContextManager();\n    \n    // Show current context every 5 seconds\n    setInterval(() => {\n        const current = contextManager.getCurrentContext();\n        console.log(`\\n🧠 Current Context: ${current.definition.name}`);\n        console.log(`⏱️ Duration: ${Math.floor(current.duration / 1000)}s`);\n        console.log(`🎨 UI Style: ${current.definition.uiStyle}`);\n        console.log(`🔧 Lag Settings:`, current.definition.lagSettings);\n    }, 5000);\n    \n    // Listen for context changes\n    contextManager.on('context-changed', (data) => {\n        console.log(`\\n🔄 Context Changed!`);\n        console.log(`📍 New Context: ${data.definition.name}`);\n        console.log(`📝 Description: ${data.definition.description}`);\n        console.log(`🎯 Reason: ${data.reason}`);\n    });\n    \n    // Test context hints\n    setTimeout(() => {\n        console.log('\\n🧪 Testing context hints...');\n        \n        // Test keyword hint\n        contextManager.addContextHint({\n            type: 'keyword',\n            data: ['database', 'query'],\n            source: 'test'\n        });\n        \n        // Test explicit context after 10 seconds\n        setTimeout(() => {\n            contextManager.forceContext('games', 'test');\n        }, 10000);\n        \n        // Test another context after 20 seconds\n        setTimeout(() => {\n            contextManager.addContextHint({\n                type: 'command',\n                data: 'login to system',\n                source: 'test'\n            });\n        }, 20000);\n        \n    }, 3000);\n    \n    // Graceful shutdown\n    process.on('SIGINT', () => {\n        console.log('\\n🛑 Shutting down Universal Context Manager...');\n        const stats = contextManager.getContextStats();\n        console.log('📊 Session Stats:');\n        console.log(`   Total Transitions: ${stats.totalTransitions}`);\n        console.log(`   Average Duration: ${Math.floor(stats.averageContextDuration / 1000)}s`);\n        process.exit(0);\n    });\n};
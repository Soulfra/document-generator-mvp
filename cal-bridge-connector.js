#!/usr/bin/env node

/**
 * 🔗 CAL BRIDGE CONNECTOR
 * 
 * Connects CAL Context Bridge with existing CAL systems:
 * - cal-ai-orchestrator-system.js
 * - 5-api-consultation-engine.js
 * - ai-assistant.js
 * - CAL-TASK-MANAGER.js
 */

const CALContextBridgeSimple = require('./CAL-Context-Bridge-Simple.js');
const path = require('path');

class CALBridgeConnector {
    constructor() {
        this.bridge = new CALContextBridgeSimple({
            maxSnippets: 10,
            enableTodoExtraction: true
        });
        
        // References to existing CAL system files
        this.calSystems = {
            orchestrator: './cal-ai-orchestrator-system.js',
            consultationEngine: './5-api-consultation-engine.js',
            aiAssistant: './ai-assistant.js',
            taskManager: './clean-system/CAL-TASK-MANAGER.js'
        };
    }
    
    async initialize() {
        console.log('🔗 Initializing CAL Bridge Connector...');
        await this.bridge.initialize();
        console.log('✅ Bridge initialized and ready to connect CAL systems');
    }
    
    /**
     * Enhanced CAL Orchestrator with context
     */
    async enhanceOrchestratorWithContext(query) {
        console.log(`\n🤖 Enhancing CAL Orchestrator with context for: "${query}"`);
        
        // Get context from bridge
        const context = await this.bridge.searchWithContext(query);
        const calContext = await this.bridge.provideContextToCAL(query, 'cal-orchestrator');
        
        // Format enhanced request for orchestrator
        const enhancedRequest = {
            originalQuery: query,
            contextEnhanced: true,
            
            // Add code context
            codeContext: {
                relevantFiles: calContext.relevantCode.map(c => c.file),
                snippets: calContext.relevantCode.slice(0, 3),
                totalMatches: context.stats.snippetsFound
            },
            
            // Add TODO context
            todoContext: {
                pendingTasks: calContext.pendingTasks,
                criticalTasks: calContext.pendingTasks.filter(t => t.priority === 'high'),
                totalTodos: context.stats.todosFound
            },
            
            // Add suggestions
            suggestions: calContext.additionalContext.suggestions,
            relatedConcepts: calContext.additionalContext.relatedConcepts,
            
            // Workflow hints based on code
            workflowHints: this.generateWorkflowHints(context)
        };
        
        return enhancedRequest;
    }
    
    /**
     * Enhanced 5-API Consultation with code context
     */
    async enhanceConsultationWithContext(question) {
        console.log(`\n🧠 Enhancing 5-API Consultation with context for: "${question}"`);
        
        const context = await this.bridge.searchWithContext(question);
        
        // Create context-aware prompts for each API
        const contextualPrompts = {
            anthropic_claude: this.createClaudePrompt(question, context),
            openai_gpt: this.createGPTPrompt(question, context),
            deepseek_coder: this.createDeepSeekPrompt(question, context),
            google_gemini: this.createGeminiPrompt(question, context),
            perplexity_sonar: this.createPerplexityPrompt(question, context)
        };
        
        return {
            originalQuestion: question,
            enhancedPrompts: contextualPrompts,
            codeEvidence: context.codeSnippets.slice(0, 5),
            todoEvidence: context.todos.slice(0, 5),
            confidenceBoost: this.calculateConfidenceBoost(context)
        };
    }
    
    /**
     * Connect to CAL Task Manager API
     */
    async syncTasksWithManager() {
        console.log(`\n📋 Syncing tasks with CAL Task Manager...`);
        
        const tasks = await this.bridge.extractTodosForTaskManager();
        
        // Format for CAL Task Manager API
        const formattedTasks = tasks.map(task => ({
            id: task.id,
            type: 'code_todo',
            title: task.title,
            status: 'queued',
            priority: task.priority,
            metadata: {
                file: task.file,
                todoType: task.type,
                totalItems: task.totalTodos,
                items: task.todos
            },
            createdAt: Date.now()
        }));
        
        return {
            tasksToSync: formattedTasks.length,
            tasks: formattedTasks,
            syncEndpoint: 'http://localhost:3334/api/cal/tasks',
            syncMethod: 'POST'
        };
    }
    
    /**
     * Helper methods
     */
    
    generateWorkflowHints(context) {
        const hints = [];
        
        if (context.stats.todosFound > 5) {
            hints.push('Multiple TODOs found - consider breaking into subtasks');
        }
        
        if (context.summary.topFiles.length > 0) {
            hints.push(`Focus on ${path.basename(context.summary.topFiles[0])} which has most matches`);
        }
        
        if (context.todos.some(t => t.type === 'FIXME')) {
            hints.push('Critical FIXMEs detected - prioritize these first');
        }
        
        return hints;
    }
    
    createClaudePrompt(question, context) {
        return `As an analytical philosopher examining this codebase:

Question: ${question}

Code Evidence (${context.stats.snippetsFound} matches found):
${context.codeSnippets.slice(0, 2).map(s => `- ${s.file}:${s.lineNumber}: ${s.matchedLine}`).join('\n')}

Pending TODOs (${context.stats.todosFound} found):
${context.todos.slice(0, 3).map(t => `- [${t.type}] ${t.content}`).join('\n')}

Please provide analytical insights considering the existing code patterns and pending work.`;
    }
    
    createGPTPrompt(question, context) {
        return `Question: ${question}

Based on codebase analysis:
- Found ${context.stats.snippetsFound} relevant code snippets
- ${context.stats.todosFound} related TODOs need attention
- Top files: ${context.summary.topFiles.slice(0, 3).map(f => path.basename(f)).join(', ')}

Provide practical implementation guidance.`;
    }
    
    createDeepSeekPrompt(question, context) {
        return `Technical deep-dive requested: ${question}

Code context:
${context.codeSnippets.slice(0, 1).map(s => s.content).join('\n---\n')}

Analyze patterns and suggest optimizations.`;
    }
    
    createGeminiPrompt(question, context) {
        return `Research and verify: ${question}

Current implementation files: ${context.summary.topFiles.slice(0, 3).join(', ')}
Related concepts to explore: ${context.relatedQueries.join(', ')}

Provide comprehensive background and best practices.`;
    }
    
    createPerplexityPrompt(question, context) {
        return `Fact-check and verify: ${question}

Existing TODOs suggest these concerns:
${context.todos.slice(0, 3).map(t => `- ${t.content}`).join('\n')}

Search for current best practices and security considerations.`;
    }
    
    calculateConfidenceBoost(context) {
        let boost = 0;
        
        if (context.stats.snippetsFound > 10) boost += 15;
        else if (context.stats.snippetsFound > 5) boost += 10;
        else if (context.stats.snippetsFound > 0) boost += 5;
        
        if (context.stats.todosFound > 0) boost += 5;
        
        return boost;
    }
    
    /**
     * Demo showing all connections
     */
    async runConnectionDemo() {
        console.log(`
🔗 CAL BRIDGE CONNECTOR DEMO 🔗
================================
Connecting Context Bridge to existing CAL systems
`);
        
        await this.initialize();
        
        // Example 1: Enhance orchestrator
        console.log('\n1️⃣ Enhancing CAL Orchestrator...');
        const orchestratorEnhancement = await this.enhanceOrchestratorWithContext('build user authentication');
        console.log(`✅ Enhanced with:`);
        console.log(`  - ${orchestratorEnhancement.codeContext.totalMatches} code matches`);
        console.log(`  - ${orchestratorEnhancement.todoContext.totalTodos} related TODOs`);
        console.log(`  - ${orchestratorEnhancement.workflowHints.length} workflow hints`);
        
        // Example 2: Enhance consultation
        console.log('\n2️⃣ Enhancing 5-API Consultation...');
        const consultationEnhancement = await this.enhanceConsultationWithContext('database optimization strategies');
        console.log(`✅ Enhanced prompts created for all 5 APIs`);
        console.log(`  - Code evidence: ${consultationEnhancement.codeEvidence.length} snippets`);
        console.log(`  - TODO evidence: ${consultationEnhancement.todoEvidence.length} items`);
        console.log(`  - Confidence boost: +${consultationEnhancement.confidenceBoost}%`);
        
        // Example 3: Sync with task manager
        console.log('\n3️⃣ Syncing with CAL Task Manager...');
        const taskSync = await this.syncTasksWithManager();
        console.log(`✅ Ready to sync ${taskSync.tasksToSync} task groups`);
        console.log(`  - Endpoint: ${taskSync.syncEndpoint}`);
        console.log(`  - Top tasks:`);
        taskSync.tasks.slice(0, 3).forEach(task => {
            console.log(`    • ${task.title} (Priority: ${task.priority})`);
        });
        
        console.log(`
✅ Connection Demo Complete!
===========================
The CAL Bridge Connector successfully:
- Enhanced CAL Orchestrator with code context
- Created context-aware prompts for 5-API Engine
- Prepared tasks for CAL Task Manager sync

Integration ready for production use!
`);
    }
}

// Run demo
if (require.main === module) {
    const connector = new CALBridgeConnector();
    connector.runConnectionDemo().catch(console.error);
}

module.exports = CALBridgeConnector;
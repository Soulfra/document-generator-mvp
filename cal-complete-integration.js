#!/usr/bin/env node

/**
 * 🔗 CAL COMPLETE INTEGRATION
 * 
 * Full integration example showing how CAL systems use the Context Bridge
 * for intelligent code-aware operations
 */

const CALContextBridgeSimple = require('./CAL-Context-Bridge-Simple.js');

// Simulate integration with real CAL systems
class CALSystemIntegration {
    constructor() {
        this.bridge = new CALContextBridgeSimple({
            maxSnippets: 10,
            contextRadius: 30,
            enableTodoExtraction: true
        });
        
        this.initialized = false;
    }
    
    async initialize() {
        console.log('🚀 Initializing CAL System Integration...\n');
        await this.bridge.initialize();
        this.initialized = true;
        
        const stats = this.bridge.getStats();
        console.log(`\n✅ CAL Integration Ready:`);
        console.log(`  - ${stats.codeFiles} code files indexed`);
        console.log(`  - ${stats.totalTodos} TODOs extracted`);
    }
    
    /**
     * CAL Orchestrator: Generate workflow based on code context
     */
    async generateWorkflowWithContext(taskDescription) {
        console.log(`\n🤖 CAL Orchestrator: Generating workflow for "${taskDescription}"`);
        
        // Get context from the bridge
        const context = await this.bridge.searchWithContext(taskDescription);
        
        console.log(`  Found ${context.stats.snippetsFound} relevant code snippets`);
        console.log(`  Found ${context.stats.todosFound} related TODOs`);
        
        // Generate workflow steps based on context
        const workflow = {
            name: `Workflow: ${taskDescription}`,
            generatedAt: new Date().toISOString(),
            contextBased: true,
            steps: []
        };
        
        // Add steps based on TODOs
        context.todos.slice(0, 5).forEach((todo, index) => {
            workflow.steps.push({
                order: index + 1,
                type: 'fix_todo',
                description: `${todo.type}: ${todo.content}`,
                file: todo.file,
                line: todo.line,
                priority: todo.type === 'FIXME' ? 'high' : 'medium'
            });
        });
        
        // Add steps based on code patterns
        if (context.codeSnippets.length > 0) {
            workflow.steps.push({
                order: workflow.steps.length + 1,
                type: 'review_implementation',
                description: 'Review existing implementation patterns',
                files: context.summary.topFiles,
                priority: 'medium'
            });
        }
        
        // Add suggested improvements
        context.suggestions.forEach((suggestion, index) => {
            workflow.steps.push({
                order: workflow.steps.length + 1,
                type: 'suggestion',
                description: suggestion,
                priority: 'low'
            });
        });
        
        return workflow;
    }
    
    /**
     * 5-API Consultation: Get AI insights with code context
     */
    async consultWithCodeContext(question) {
        console.log(`\n🧠 5-API Consultation Engine: "${question}"`);
        
        // Get context
        const context = await this.bridge.searchWithContext(question);
        
        // Simulate consultation with context
        const consultation = {
            question,
            contextProvided: true,
            codeSnippetsAnalyzed: context.stats.snippetsFound,
            todosConsidered: context.stats.todosFound,
            
            insights: [
                {
                    source: 'Code Analysis',
                    insight: `Found ${context.stats.snippetsFound} implementations related to your question`,
                    confidence: 85
                },
                {
                    source: 'TODO Analysis',
                    insight: `${context.stats.todosFound} pending tasks need to be addressed`,
                    confidence: 90
                },
                {
                    source: 'Pattern Recognition',
                    insight: `Common patterns found in ${context.summary.topFiles.length} files`,
                    confidence: 75
                }
            ],
            
            recommendations: []
        };
        
        // Add recommendations based on context
        if (context.todos.some(todo => todo.type === 'FIXME')) {
            consultation.recommendations.push({
                priority: 'high',
                action: 'Address critical FIXME items before proceeding'
            });
        }
        
        if (context.relatedQueries.length > 0) {
            consultation.recommendations.push({
                priority: 'medium',
                action: `Also consider: ${context.relatedQueries.join(', ')}`
            });
        }
        
        return consultation;
    }
    
    /**
     * CAL Task Manager: Import and prioritize TODOs
     */
    async manageTodosWithContext() {
        console.log(`\n📋 CAL Task Manager: Importing TODOs...`);
        
        const tasks = await this.bridge.extractTodosForTaskManager();
        
        console.log(`  Found ${tasks.length} task groups`);
        
        // Prioritize and organize tasks
        const prioritizedTasks = {
            critical: tasks.filter(t => t.type === 'FIXME' || t.type === 'BUG'),
            high: tasks.filter(t => t.type === 'TODO' && t.totalTodos > 3),
            medium: tasks.filter(t => t.type === 'TODO' && t.totalTodos <= 3),
            low: tasks.filter(t => t.type === 'NOTE' || t.type === 'HACK')
        };
        
        // Generate task report
        const report = {
            summary: {
                total: tasks.length,
                critical: prioritizedTasks.critical.length,
                high: prioritizedTasks.high.length,
                medium: prioritizedTasks.medium.length,
                low: prioritizedTasks.low.length
            },
            topTasks: tasks.slice(0, 5).map(task => ({
                title: task.title,
                todos: task.totalTodos,
                file: task.file
            }))
        };
        
        return report;
    }
    
    /**
     * Complete integration demo
     */
    async runCompleteDemo() {
        console.log(`
🔗 CAL COMPLETE INTEGRATION DEMO 🔗
===================================
Demonstrating full integration of CAL Context Bridge with:
- Workflow Generation (CAL Orchestrator)
- AI Consultation (5-API Engine)
- Task Management (CAL Task Manager)
`);
        
        if (!this.initialized) {
            await this.initialize();
        }
        
        // Demo 1: Generate workflow for authentication system
        console.log('\n═══════════════════════════════════════════');
        console.log('DEMO 1: Generate Authentication Workflow');
        console.log('═══════════════════════════════════════════');
        
        const authWorkflow = await this.generateWorkflowWithContext('implement authentication system');
        console.log(`\nGenerated workflow with ${authWorkflow.steps.length} steps:`);
        authWorkflow.steps.forEach(step => {
            console.log(`  ${step.order}. [${step.priority.toUpperCase()}] ${step.description}`);
            if (step.file) console.log(`     📄 ${step.file}:${step.line}`);
        });
        
        // Demo 2: Consult about database design
        console.log('\n═══════════════════════════════════════════');
        console.log('DEMO 2: Database Design Consultation');
        console.log('═══════════════════════════════════════════');
        
        const dbConsultation = await this.consultWithCodeContext('database schema design patterns');
        console.log('\n📊 Consultation Results:');
        console.log(`  Code snippets analyzed: ${dbConsultation.codeSnippetsAnalyzed}`);
        console.log(`  TODOs considered: ${dbConsultation.todosConsidered}`);
        console.log('\n💡 Insights:');
        dbConsultation.insights.forEach(insight => {
            console.log(`  - ${insight.source}: ${insight.insight} (${insight.confidence}% confidence)`);
        });
        console.log('\n🎯 Recommendations:');
        dbConsultation.recommendations.forEach(rec => {
            console.log(`  - [${rec.priority.toUpperCase()}] ${rec.action}`);
        });
        
        // Demo 3: Task management
        console.log('\n═══════════════════════════════════════════');
        console.log('DEMO 3: Task Management Integration');
        console.log('═══════════════════════════════════════════');
        
        const taskReport = await this.manageTodosWithContext();
        console.log('\n📊 Task Summary:');
        console.log(`  Total task groups: ${taskReport.summary.total}`);
        console.log(`  Critical: ${taskReport.summary.critical}`);
        console.log(`  High: ${taskReport.summary.high}`);
        console.log(`  Medium: ${taskReport.summary.medium}`);
        console.log(`  Low: ${taskReport.summary.low}`);
        console.log('\n🔝 Top Tasks:');
        taskReport.topTasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.title} (${task.todos} items)`);
            console.log(`     📄 ${task.file}`);
        });
        
        // Show final stats
        console.log('\n═══════════════════════════════════════════');
        console.log('📈 Integration Statistics');
        console.log('═══════════════════════════════════════════');
        const stats = this.bridge.getStats();
        console.log(JSON.stringify(stats, null, 2));
        
        console.log(`
✅ CAL Integration Demo Complete!
================================
The CAL Context Bridge successfully provided:
- Code-aware workflow generation
- Context-enhanced AI consultations
- Intelligent TODO extraction and prioritization

This enables CAL systems to:
1. Make decisions based on actual code context
2. Generate relevant workflows from existing implementations
3. Track and manage technical debt automatically
4. Provide grounded AI responses based on your codebase
`);
    }
}

// Run the complete demo
async function main() {
    const integration = new CALSystemIntegration();
    await integration.runCompleteDemo();
}

main().catch(console.error);
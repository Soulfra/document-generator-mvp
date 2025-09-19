#!/usr/bin/env node

/**
 * Workflow Orchestrator
 * 
 * Executes workflow templates by coordinating various AI-powered tools
 * and managing the entire workflow lifecycle.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml');
const { EventEmitter } = require('events');

// Import our AI tools
const AIGitOrchestrator = require('./ai-git-orchestrator');
const CodeTransformerPipeline = require('./code-transformer-pipeline');
const { MultiAgentDevSystem } = require('./multi-agent-dev-system');
const SmartTaggingSystem = require('./smart-tagging-system');

class WorkflowOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            templatesDir: config.templatesDir || './workflow-templates',
            workingDir: config.workingDir || process.cwd(),
            parallelStages: config.parallelStages !== false,
            dryRun: config.dryRun || false,
            metricsEnabled: config.metricsEnabled !== false,
            ...config
        };
        
        // Initialize tools
        this.tools = {
            'ai-git-orchestrator': new AIGitOrchestrator({
                workingDir: this.config.workingDir,
                dryRun: this.config.dryRun
            }),
            'code-transformer-pipeline': new CodeTransformerPipeline({
                dryRun: this.config.dryRun
            }),
            'multi-agent-system': new MultiAgentDevSystem({
                worktreeBase: path.join(this.config.workingDir, 'worktrees')
            }),
            'smart-tagging-system': new SmartTaggingSystem({
                workingDir: this.config.workingDir,
                dryRun: this.config.dryRun
            })
        };
        
        // Workflow state
        this.activeWorkflows = new Map();
        this.workflowHistory = [];
        this.metrics = new Map();
    }
    
    /**
     * Load a workflow template
     */
    async loadTemplate(templateName) {
        const templatePath = path.join(this.config.templatesDir, `${templateName}.yml`);
        
        try {
            const content = await fs.readFile(templatePath, 'utf8');
            const template = yaml.parse(content);
            
            console.log(`📋 Loaded workflow template: ${template.name} v${template.version}`);
            return template;
            
        } catch (error) {
            console.error(`❌ Failed to load template ${templateName}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Execute a workflow
     */
    async executeWorkflow(templateName, inputs = {}) {
        console.log(`\n🚀 Starting workflow: ${templateName}`);
        console.log('=====================================\n');
        
        const workflow = {
            id: `${templateName}-${Date.now()}`,
            template: await this.loadTemplate(templateName),
            inputs,
            state: 'running',
            startTime: Date.now(),
            context: {
                steps: {},
                stages: {},
                variables: { ...inputs }
            },
            results: {}
        };
        
        this.activeWorkflows.set(workflow.id, workflow);
        this.emit('workflowStarted', workflow);
        
        try {
            // Initialize tools if needed
            await this.initializeTools(workflow);
            
            // Execute preflight checks if defined
            if (workflow.template.preflight) {
                await this.executePreflight(workflow);
            }
            
            // Execute workflow stages
            await this.executeStages(workflow);
            
            // Execute success actions
            if (workflow.template.on_success) {
                await this.executeActions(workflow, workflow.template.on_success);
            }
            
            workflow.state = 'completed';
            workflow.endTime = Date.now();
            workflow.duration = workflow.endTime - workflow.startTime;
            
            console.log(`\n✅ Workflow completed in ${this.formatDuration(workflow.duration)}`);
            
            this.emit('workflowCompleted', workflow);
            
        } catch (error) {
            workflow.state = 'failed';
            workflow.error = error;
            workflow.failedStage = this.getCurrentStage(workflow);
            
            console.error(`\n❌ Workflow failed:`, error.message);
            
            // Execute failure actions
            if (workflow.template.on_failure) {
                await this.executeFailureActions(workflow, error);
            }
            
            this.emit('workflowFailed', workflow);
            
        } finally {
            // Record metrics
            await this.recordMetrics(workflow);
            
            // Cleanup
            this.activeWorkflows.delete(workflow.id);
            this.workflowHistory.push(workflow);
        }
        
        return workflow;
    }
    
    /**
     * Initialize required tools
     */
    async initializeTools(workflow) {
        const requiredTools = this.extractRequiredTools(workflow.template);
        
        for (const toolName of requiredTools) {
            if (this.tools[toolName] && this.tools[toolName].initialize) {
                console.log(`🔧 Initializing ${toolName}...`);
                await this.tools[toolName].initialize();
            }
        }
    }
    
    /**
     * Execute preflight checks
     */
    async executePreflight(workflow) {
        console.log('🔍 Running preflight checks...');
        
        const preflight = workflow.template.preflight;
        
        for (const step of preflight.steps) {
            const result = await this.executeStep(workflow, step);
            
            if (!result.success) {
                throw new Error(`Preflight check failed: ${step.id}`);
            }
        }
        
        console.log('✅ Preflight checks passed');
    }
    
    /**
     * Execute workflow stages
     */
    async executeStages(workflow) {
        const stages = workflow.template.stages;
        const stageNames = Object.keys(stages);
        
        // Build dependency graph
        const graph = this.buildDependencyGraph(stages);
        
        // Execute stages in order
        for (const batch of graph) {
            if (this.config.parallelStages && batch.length > 1) {
                // Execute parallel stages
                await Promise.all(
                    batch.map(stageName => this.executeStage(workflow, stageName, stages[stageName]))
                );
            } else {
                // Execute sequential stages
                for (const stageName of batch) {
                    await this.executeStage(workflow, stageName, stages[stageName]);
                }
            }
        }
    }
    
    /**
     * Execute a single stage
     */
    async executeStage(workflow, stageName, stage) {
        console.log(`\n📌 Stage: ${stage.name || stageName}`);
        console.log('----------------------------');
        
        workflow.context.currentStage = stageName;
        workflow.context.stages[stageName] = {
            startTime: Date.now(),
            status: 'running'
        };
        
        try {
            // Execute stage steps
            const steps = stage.steps || [];
            const stepResults = [];
            
            for (const step of steps) {
                // Check conditions
                if (step.when && !this.evaluateCondition(step.when, workflow.context)) {
                    console.log(`⏭️  Skipping step ${step.id} (condition not met)`);
                    continue;
                }
                
                const result = await this.executeStep(workflow, step);
                stepResults.push(result);
                
                // Store step output in context
                workflow.context.steps[step.id] = {
                    output: result.output,
                    success: result.success
                };
            }
            
            workflow.context.stages[stageName].status = 'completed';
            workflow.context.stages[stageName].endTime = Date.now();
            workflow.context.stages[stageName].results = stepResults;
            
        } catch (error) {
            workflow.context.stages[stageName].status = 'failed';
            workflow.context.stages[stageName].error = error.message;
            throw error;
        }
    }
    
    /**
     * Execute a single step
     */
    async executeStep(workflow, step) {
        console.log(`  🔸 ${step.id}: ${step.tool}.${step.action}`);
        
        try {
            const tool = this.tools[step.tool];
            if (!tool) {
                throw new Error(`Unknown tool: ${step.tool}`);
            }
            
            // Resolve configuration values
            const config = this.resolveConfig(step.config || {}, workflow.context);
            
            // Execute tool action
            let result;
            if (typeof tool[step.action] === 'function') {
                result = await tool[step.action](config);
            } else {
                // Generic execution
                result = await this.executeToolAction(tool, step.action, config);
            }
            
            console.log(`     ✓ ${step.id} completed`);
            
            return {
                success: true,
                output: result
            };
            
        } catch (error) {
            console.error(`     ✗ ${step.id} failed:`, error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Execute tool action
     */
    async executeToolAction(tool, action, config) {
        // Map action names to tool methods
        const actionMap = {
            // AI Git Orchestrator
            'autoBranch': () => tool.autoBranch(config),
            'autoCommit': () => tool.autoCommit(config),
            'autoMerge': () => tool.autoMerge?.(config),
            'autoTag': () => tool.autoTag?.(config),
            
            // Code Transformer Pipeline
            'transformFiles': () => tool.transformFiles(config.files, config),
            
            // Multi-Agent System
            'generateTasks': () => this.generateAgentTasks(tool, config),
            'assignTask': () => tool.queueTask(config.task),
            
            // Smart Tagging System
            'analyzeRepository': () => tool.analyzeRepository(),
            'createTag': () => tool.createTag(config),
            'generateChangelog': () => tool.generateChangelog(config),
            'generateReleaseNotes': () => tool.generateReleaseNotes?.(config)
        };
        
        const actionFn = actionMap[action];
        if (!actionFn) {
            throw new Error(`Unknown action: ${action}`);
        }
        
        return await actionFn();
    }
    
    /**
     * Generate tasks for multi-agent system
     */
    async generateAgentTasks(multiAgentSystem, config) {
        const { specification, agentTypes } = config;
        const tasks = [];
        
        // Generate tasks based on specification
        if (specification.architecture) {
            tasks.push({
                description: 'Implement system architecture',
                agentType: 'code-agent',
                specification: specification.architecture,
                priority: 'high'
            });
        }
        
        if (specification.components) {
            for (const component of specification.components) {
                tasks.push({
                    description: `Implement ${component.name} component`,
                    agentType: 'code-agent',
                    specification: component,
                    priority: 'medium'
                });
            }
        }
        
        if (specification.testRequirements) {
            tasks.push({
                description: 'Write comprehensive tests',
                agentType: 'test-agent',
                specification: specification.testRequirements,
                priority: 'high'
            });
        }
        
        // Queue tasks
        for (const task of tasks) {
            multiAgentSystem.queueTask(task);
        }
        
        return { tasks, count: tasks.length };
    }
    
    /**
     * Resolve configuration with template variables
     */
    resolveConfig(config, context) {
        const resolved = {};
        
        for (const [key, value] of Object.entries(config)) {
            if (typeof value === 'string') {
                // Replace template variables
                resolved[key] = value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
                    return this.evaluateExpression(expr.trim(), context);
                });
            } else if (Array.isArray(value)) {
                resolved[key] = value.map(item => 
                    typeof item === 'string' ? this.resolveConfig({ item }, context).item : item
                );
            } else if (typeof value === 'object' && value !== null) {
                resolved[key] = this.resolveConfig(value, context);
            } else {
                resolved[key] = value;
            }
        }
        
        return resolved;
    }
    
    /**
     * Evaluate template expressions
     */
    evaluateExpression(expr, context) {
        // Simple expression evaluator
        const parts = expr.split('.');
        let value = context;
        
        for (const part of parts) {
            if (part.includes('[') && part.includes(']')) {
                // Array access
                const [arrayName, index] = part.split('[');
                value = value[arrayName]?.[parseInt(index.replace(']', ''))];
            } else {
                value = value[part];
            }
            
            if (value === undefined) {
                console.warn(`Warning: Expression '${expr}' evaluated to undefined`);
                return '';
            }
        }
        
        return value;
    }
    
    /**
     * Evaluate conditions
     */
    evaluateCondition(condition, context) {
        // Simple condition evaluator
        const resolved = this.resolveConfig({ condition }, context).condition;
        
        // Handle boolean conditions
        if (resolved === 'true' || resolved === true) return true;
        if (resolved === 'false' || resolved === false) return false;
        
        // Handle comparisons
        if (resolved.includes('==')) {
            const [left, right] = resolved.split('==').map(s => s.trim());
            return left === right;
        }
        
        if (resolved.includes('!=')) {
            const [left, right] = resolved.split('!=').map(s => s.trim());
            return left !== right;
        }
        
        if (resolved.includes('>')) {
            const [left, right] = resolved.split('>').map(s => s.trim());
            return parseFloat(left) > parseFloat(right);
        }
        
        // Default to truthy check
        return !!resolved;
    }
    
    /**
     * Build dependency graph for stages
     */
    buildDependencyGraph(stages) {
        const graph = [];
        const processed = new Set();
        
        // Find stages with no dependencies
        const noDeps = Object.keys(stages).filter(name => 
            !stages[name].depends_on
        );
        
        if (noDeps.length > 0) {
            graph.push(noDeps);
            noDeps.forEach(name => processed.add(name));
        }
        
        // Process remaining stages
        while (processed.size < Object.keys(stages).length) {
            const batch = [];
            
            for (const [name, stage] of Object.entries(stages)) {
                if (!processed.has(name)) {
                    const deps = Array.isArray(stage.depends_on) 
                        ? stage.depends_on 
                        : [stage.depends_on].filter(Boolean);
                    
                    if (deps.every(dep => processed.has(dep))) {
                        batch.push(name);
                    }
                }
            }
            
            if (batch.length === 0) {
                throw new Error('Circular dependency detected in stages');
            }
            
            graph.push(batch);
            batch.forEach(name => processed.add(name));
        }
        
        return graph;
    }
    
    /**
     * Execute failure actions
     */
    async executeFailureActions(workflow, error) {
        console.log('\n⚠️  Executing failure recovery...');
        
        try {
            for (const action of workflow.template.on_failure) {
                // Check conditions
                if (action.when && !this.evaluateCondition(action.when, {
                    ...workflow.context,
                    failed_stage: workflow.failedStage,
                    error_message: error.message
                })) {
                    continue;
                }
                
                await this.executeStep(workflow, action);
            }
        } catch (recoveryError) {
            console.error('❌ Failure recovery also failed:', recoveryError.message);
        }
    }
    
    /**
     * Record workflow metrics
     */
    async recordMetrics(workflow) {
        if (!this.config.metricsEnabled) return;
        
        const metrics = workflow.template.metrics || [];
        
        for (const metric of metrics) {
            const value = this.evaluateExpression(metric.value, {
                ...workflow.context,
                workflow: {
                    duration: workflow.duration,
                    success: workflow.state === 'completed'
                }
            });
            
            const labels = this.resolveConfig(metric.labels || {}, workflow.context);
            
            this.recordMetric(metric.name, value, labels);
        }
    }
    
    /**
     * Record a single metric
     */
    recordMetric(name, value, labels = {}) {
        const key = `${name}:${JSON.stringify(labels)}`;
        
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }
        
        this.metrics.get(key).push({
            value,
            timestamp: Date.now(),
            labels
        });
        
        this.emit('metricRecorded', { name, value, labels });
    }
    
    /**
     * Get workflow status
     */
    getWorkflowStatus(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) {
            const historical = this.workflowHistory.find(w => w.id === workflowId);
            return historical || null;
        }
        return workflow;
    }
    
    /**
     * List available workflow templates
     */
    async listTemplates() {
        const files = await fs.readdir(this.config.templatesDir);
        const templates = [];
        
        for (const file of files) {
            if (file.endsWith('.yml') || file.endsWith('.yaml')) {
                try {
                    const template = await this.loadTemplate(file.replace(/\.(yml|yaml)$/, ''));
                    templates.push({
                        name: template.name,
                        description: template.description,
                        version: template.version,
                        filename: file
                    });
                } catch (error) {
                    console.warn(`Failed to load ${file}:`, error.message);
                }
            }
        }
        
        return templates;
    }
    
    /**
     * Extract required tools from template
     */
    extractRequiredTools(template) {
        const tools = new Set();
        
        // Extract from all stages and steps
        const extractFromSteps = (steps) => {
            for (const step of steps || []) {
                if (step.tool) tools.add(step.tool);
            }
        };
        
        // Check preflight
        if (template.preflight) {
            extractFromSteps(template.preflight.steps);
        }
        
        // Check stages
        for (const stage of Object.values(template.stages || {})) {
            extractFromSteps(stage.steps);
        }
        
        // Check actions
        extractFromSteps(template.on_success);
        extractFromSteps(template.on_failure);
        extractFromSteps(template.post_release);
        
        return Array.from(tools);
    }
    
    /**
     * Get current stage name
     */
    getCurrentStage(workflow) {
        return workflow.context.currentStage || 'unknown';
    }
    
    /**
     * Format duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

// CLI interface
if (require.main === module) {
    const orchestrator = new WorkflowOrchestrator({
        dryRun: process.argv.includes('--dry-run')
    });
    
    const command = process.argv[2];
    
    switch (command) {
        case 'list':
            orchestrator.listTemplates().then(templates => {
                console.log('\n📋 Available Workflow Templates:');
                console.log('================================\n');
                
                for (const template of templates) {
                    console.log(`${template.name} (v${template.version})`);
                    console.log(`  ${template.description}`);
                    console.log(`  File: ${template.filename}\n`);
                }
            });
            break;
            
        case 'run':
            const templateName = process.argv[3];
            if (!templateName) {
                console.error('Usage: workflow-orchestrator run <template> [inputs...]');
                process.exit(1);
            }
            
            // Parse inputs
            const inputs = {};
            for (let i = 4; i < process.argv.length; i++) {
                const [key, value] = process.argv[i].split('=');
                inputs[key] = value;
            }
            
            orchestrator.executeWorkflow(templateName, inputs)
                .then(workflow => {
                    console.log(`\n📊 Workflow Summary:`);
                    console.log(`   ID: ${workflow.id}`);
                    console.log(`   Status: ${workflow.state}`);
                    console.log(`   Duration: ${orchestrator.formatDuration(workflow.duration || 0)}`);
                })
                .catch(error => {
                    console.error('Workflow execution failed:', error);
                    process.exit(1);
                });
            break;
            
        default:
            console.log(`
Workflow Orchestrator

Commands:
  list                    List available workflow templates
  run <template> [...]    Run a workflow template

Options:
  --dry-run              Preview without making changes

Examples:
  workflow-orchestrator list
  workflow-orchestrator run feature-development feature_name=auth specification="Add OAuth2 support"
  workflow-orchestrator run bug-fix issue_id=123 severity=high
  workflow-orchestrator run release releaseType=minor
            `);
    }
}

module.exports = WorkflowOrchestrator;
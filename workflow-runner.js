#!/usr/bin/env node

/**
 * 🚀 UNIFIED WORKFLOW RUNNER
 * 
 * Makes everything easy with simple commands and automated workflows
 * Integrates all existing systems into dead-simple workflows
 * 
 * Usage:
 * - workflow run setup        # Complete system setup
 * - workflow run test         # Full testing pipeline  
 * - workflow run document     # Process document to MVP
 * - workflow run deploy       # Deploy to production
 * - workflow run verify       # Verify everything works
 * 
 * Features:
 * - Leverages 100+ existing scripts and orchestrators
 * - YAML workflow definitions
 * - Parallel execution where possible
 * - Real-time status reporting
 * - Automatic retry on failures
 * - Integration with all existing tools
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const yaml = require('js-yaml');
const EventEmitter = require('events');

console.log(`
🚀 UNIFIED WORKFLOW RUNNER 🚀
============================
Dead Simple Workflows | Automated Testing | One-Click Everything
Leveraging 100+ Existing Scripts and Orchestrators
`);

class WorkflowRunner extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            workflowsDir: config.workflowsDir || './workflows',
            logsDir: config.logsDir || './workflow-logs',
            maxParallel: config.maxParallel || 5,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 5000,
            timeout: config.timeout || 600000, // 10 minutes default
            enableLogging: config.enableLogging !== false,
            enableRetries: config.enableRetries !== false,
            ...config
        };
        
        // State
        this.runningWorkflows = new Map();
        this.workflowHistory = [];
        this.statistics = {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            averageExecutionTime: 0,
            totalExecutionTime: 0
        };
        
        // Available workflows
        this.workflows = new Map();
        
        console.log('🔧 Initializing Unified Workflow Runner...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create directories
            await Promise.all([
                fs.mkdir(this.config.workflowsDir, { recursive: true }),
                fs.mkdir(this.config.logsDir, { recursive: true })
            ]);
            
            // Load built-in workflows
            await this.createBuiltInWorkflows();
            
            // Load custom workflows
            await this.loadWorkflows();
            
            console.log(`✅ Workflow Runner initialized with ${this.workflows.size} workflows`);
            console.log(`📁 Workflows directory: ${this.config.workflowsDir}`);
            console.log(`📋 Available workflows: ${Array.from(this.workflows.keys()).join(', ')}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Workflow Runner:', error);
            throw error;
        }
    }
    
    /**
     * Create built-in workflows that integrate existing systems
     */
    async createBuiltInWorkflows() {
        console.log('📦 Creating built-in workflows...');
        
        // Quick Start Workflow
        const quickStartWorkflow = {
            name: 'Quick Start',
            description: 'Complete system setup and verification',
            steps: [
                {
                    name: 'System Setup',
                    type: 'shell',
                    command: './complete-setup.sh',
                    description: 'Complete system setup and dependencies',
                    timeout: 300000
                },
                {
                    name: 'Service Health Check',
                    type: 'node',
                    script: './test-connections.sh',
                    description: 'Verify all services are healthy'
                },
                {
                    name: 'Quick Integration Test',
                    type: 'node',
                    script: './test-complete-integration.js',
                    description: 'Run basic integration tests'
                },
                {
                    name: 'Start Core Services',
                    type: 'shell',
                    command: './start-trinity-system.sh',
                    description: 'Start the trinity system'
                }
            ]
        };
        
        // Document to MVP Workflow
        const documentToMVPWorkflow = {
            name: 'Document to MVP',
            description: 'Process document and generate working MVP',
            parameters: {
                documentPath: { required: true, description: 'Path to input document' },
                outputDir: { required: false, default: './generated-mvps', description: 'Output directory' }
            },
            steps: [
                {
                    name: 'Validate Document',
                    type: 'node',
                    script: 'document-validator.js',
                    args: ['${documentPath}'],
                    description: 'Validate input document format and content'
                },
                {
                    name: 'AI Analysis',
                    type: 'node',
                    script: './ai-agent-reasoning-orchestrator.js',
                    args: ['analyze', '${documentPath}'],
                    description: 'Analyze document with AI reasoning system',
                    parallel: true
                },
                {
                    name: 'Template Matching',
                    type: 'node',
                    script: './MasterDiscoveryOrchestrator.js',
                    args: ['discover', '${documentPath}'],
                    description: 'Find matching templates and components',
                    parallel: true
                },
                {
                    name: 'Code Generation',
                    type: 'node',
                    script: './mvp-generator.js',
                    args: ['generate', '${documentPath}', '${outputDir}'],
                    description: 'Generate MVP code',
                    dependsOn: ['AI Analysis', 'Template Matching']
                },
                {
                    name: 'Test Generated Code',
                    type: 'shell',
                    command: './test-generated-mvp.sh',
                    args: ['${outputDir}'],
                    description: 'Test the generated MVP'
                },
                {
                    name: 'Package for Deployment',
                    type: 'node',
                    script: './deploy-unified-tool.sh',
                    args: ['package', '${outputDir}'],
                    description: 'Package MVP for deployment'
                }
            ]
        };
        
        // Full Testing Pipeline
        const fullTestingWorkflow = {
            name: 'Full Testing',
            description: 'Comprehensive testing of all systems',
            steps: [
                {
                    name: 'Unit Tests',
                    type: 'shell',
                    command: 'npm test',
                    description: 'Run unit tests',
                    parallel: true
                },
                {
                    name: 'Service Tests',
                    type: 'shell',
                    command: './test-api-endpoints.sh',
                    description: 'Test all API endpoints',
                    parallel: true
                },
                {
                    name: 'Connection Tests',
                    type: 'shell',
                    command: './test-connections.sh',
                    description: 'Test database and service connections',
                    parallel: true
                },
                {
                    name: 'Integration Tests',
                    type: 'node',
                    script: './test-complete-integration.js',
                    description: 'Full integration test suite',
                    dependsOn: ['Unit Tests', 'Service Tests', 'Connection Tests']
                },
                {
                    name: 'Security Tests',
                    type: 'node',
                    script: './pentest-framework.js',
                    description: 'Security and penetration testing',
                    parallel: true
                },
                {
                    name: 'System Verification',
                    type: 'shell',
                    command: './validate-system.sh',
                    description: 'Final system validation',
                    dependsOn: ['Integration Tests', 'Security Tests']
                }
            ]
        };
        
        // Production Deployment Workflow
        const productionDeployWorkflow = {
            name: 'Production Deploy',
            description: 'Deploy to production with full verification',
            parameters: {
                environment: { required: false, default: 'production', description: 'Target environment' },
                skipTests: { required: false, default: false, description: 'Skip pre-deployment tests' }
            },
            steps: [
                {
                    name: 'Pre-deployment Tests',
                    type: 'workflow',
                    workflow: 'Full Testing',
                    condition: '!${skipTests}',
                    description: 'Run full test suite before deployment'
                },
                {
                    name: 'Build Production Package',
                    type: 'shell',
                    command: 'npm run build:production',
                    description: 'Build optimized production package'
                },
                {
                    name: 'Deploy Infrastructure',
                    type: 'shell',
                    command: './deploy-unified-tool.sh',
                    args: ['deploy', '${environment}'],
                    description: 'Deploy infrastructure and services'
                },
                {
                    name: 'Health Check',
                    type: 'node',
                    script: './test-system-connections.js',
                    description: 'Verify deployment health',
                    retryAttempts: 5,
                    retryDelay: 10000
                },
                {
                    name: 'Smoke Tests',
                    type: 'shell',
                    command: './test-production-smoke.sh',
                    description: 'Run production smoke tests'
                }
            ]
        };
        
        // Verification and Debug Workflow
        const verifyAndDebugWorkflow = {
            name: 'Verify and Debug',
            description: 'Comprehensive system verification with debugging',
            steps: [
                {
                    name: 'Service Discovery',
                    type: 'node',
                    script: './scripts/obsidian-vault-service-sync.js',
                    description: 'Discover and document all services',
                    parallel: true
                },
                {
                    name: 'Component Analysis',
                    type: 'node',
                    script: './MasterDiscoveryOrchestrator.js',
                    args: ['analyze-all'],
                    description: 'Analyze all components for issues',
                    parallel: true
                },
                {
                    name: 'System Health Report',
                    type: 'shell',
                    command: './scripts/test-complete-system.sh',
                    description: 'Generate comprehensive health report'
                },
                {
                    name: 'Debug Analysis',
                    type: 'node',
                    script: './debug-system-issues.js',
                    description: 'Analyze and report system issues',
                    dependsOn: ['Service Discovery', 'Component Analysis', 'System Health Report']
                },
                {
                    name: 'Generate Documentation',
                    type: 'node',
                    script: './generate-system-docs.js',
                    description: 'Generate updated system documentation'
                }
            ]
        };
        
        // Save workflows
        const workflows = {
            'quick-start': quickStartWorkflow,
            'document-to-mvp': documentToMVPWorkflow,
            'full-testing': fullTestingWorkflow,
            'production-deploy': productionDeployWorkflow,
            'verify-debug': verifyAndDebugWorkflow
        };
        
        for (const [name, workflow] of Object.entries(workflows)) {
            const workflowPath = path.join(this.config.workflowsDir, `${name}.yml`);
            await fs.writeFile(workflowPath, yaml.dump(workflow, { indent: 2 }));
            this.workflows.set(name, workflow);
        }
        
        console.log(`✅ Created ${Object.keys(workflows).length} built-in workflows`);
    }
    
    /**
     * Load custom workflows from the workflows directory
     */
    async loadWorkflows() {
        try {
            const files = await fs.readdir(this.config.workflowsDir);
            const yamlFiles = files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
            
            for (const file of yamlFiles) {
                const workflowPath = path.join(this.config.workflowsDir, file);
                const content = await fs.readFile(workflowPath, 'utf8');
                const workflow = yaml.load(content);
                const name = path.basename(file, path.extname(file));
                
                this.workflows.set(name, workflow);
            }
            
            console.log(`📋 Loaded ${yamlFiles.length} workflow files`);
            
        } catch (error) {
            console.warn('⚠️ Could not load custom workflows:', error.message);
        }
    }
    
    /**
     * Run a workflow by name
     */
    async runWorkflow(workflowName, parameters = {}, options = {}) {
        const startTime = Date.now();
        const runId = `${workflowName}_${Date.now()}`;
        
        console.log(`🚀 Starting workflow: ${workflowName} (${runId})`);
        
        if (!this.workflows.has(workflowName)) {
            throw new Error(`Workflow '${workflowName}' not found`);
        }
        
        const workflow = this.workflows.get(workflowName);
        const workflowRun = {
            id: runId,
            name: workflowName,
            workflow,
            parameters,
            options,
            startTime,
            status: 'running',
            currentStep: null,
            completedSteps: [],
            failedSteps: [],
            logs: []
        };
        
        this.runningWorkflows.set(runId, workflowRun);
        
        try {
            // Validate parameters
            this.validateParameters(workflow, parameters);
            
            // Execute workflow steps
            const result = await this.executeWorkflowSteps(workflow, parameters, workflowRun);
            
            const executionTime = Date.now() - startTime;
            
            workflowRun.status = 'completed';
            workflowRun.endTime = Date.now();
            workflowRun.executionTime = executionTime;
            workflowRun.result = result;
            
            // Update statistics
            this.statistics.totalRuns++;
            this.statistics.successfulRuns++;
            this.statistics.totalExecutionTime += executionTime;
            this.statistics.averageExecutionTime = this.statistics.totalExecutionTime / this.statistics.totalRuns;
            
            // Archive workflow run
            this.workflowHistory.push(workflowRun);
            this.runningWorkflows.delete(runId);
            
            console.log(`✅ Workflow ${workflowName} completed successfully in ${(executionTime / 1000).toFixed(2)}s`);
            
            if (this.config.enableLogging) {
                await this.saveWorkflowLog(workflowRun);
            }
            
            return result;
            
        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            workflowRun.status = 'failed';
            workflowRun.endTime = Date.now();
            workflowRun.executionTime = executionTime;
            workflowRun.error = error.message;
            
            this.statistics.totalRuns++;
            this.statistics.failedRuns++;
            this.statistics.totalExecutionTime += executionTime;
            this.statistics.averageExecutionTime = this.statistics.totalExecutionTime / this.statistics.totalRuns;
            
            this.workflowHistory.push(workflowRun);
            this.runningWorkflows.delete(runId);
            
            console.error(`❌ Workflow ${workflowName} failed after ${(executionTime / 1000).toFixed(2)}s:`, error.message);
            
            if (this.config.enableLogging) {
                await this.saveWorkflowLog(workflowRun);
            }
            
            throw error;
        }
    }
    
    /**
     * Execute workflow steps with dependency management and parallelization
     */
    async executeWorkflowSteps(workflow, parameters, workflowRun) {
        const steps = workflow.steps;
        const stepResults = new Map();
        const completedSteps = new Set();
        const runningSteps = new Map();
        
        // Build dependency graph
        const dependencyGraph = this.buildDependencyGraph(steps);
        
        while (completedSteps.size < steps.length) {
            // Find steps ready to execute
            const readySteps = steps.filter(step => {
                if (completedSteps.has(step.name) || runningSteps.has(step.name)) {
                    return false;
                }
                
                // Check if all dependencies are completed
                const dependencies = step.dependsOn || [];
                return dependencies.every(dep => completedSteps.has(dep));
            });
            
            if (readySteps.length === 0 && runningSteps.size === 0) {
                throw new Error('Workflow deadlock: no steps ready to execute and none running');
            }
            
            // Start ready steps (respecting parallel limits)
            const availableSlots = this.config.maxParallel - runningSteps.size;
            const stepsToStart = readySteps.slice(0, availableSlots);
            
            for (const step of stepsToStart) {
                const stepPromise = this.executeStep(step, parameters, workflowRun);
                runningSteps.set(step.name, stepPromise);
                
                workflowRun.currentStep = step.name;
                console.log(`▶️  Starting step: ${step.name}`);
                
                // Handle step completion
                stepPromise.then(result => {
                    console.log(`✅ Completed step: ${step.name}`);
                    stepResults.set(step.name, result);
                    completedSteps.add(step.name);
                    workflowRun.completedSteps.push(step.name);
                    runningSteps.delete(step.name);
                }).catch(error => {
                    console.error(`❌ Failed step: ${step.name}`, error.message);
                    workflowRun.failedSteps.push({ name: step.name, error: error.message });
                    runningSteps.delete(step.name);
                    throw error;
                });
            }
            
            // Wait for at least one step to complete before checking again
            if (runningSteps.size > 0) {
                await Promise.race(runningSteps.values());
            }
        }
        
        // Wait for all steps to complete
        await Promise.all(runningSteps.values());
        
        return {
            stepResults: Object.fromEntries(stepResults),
            totalSteps: steps.length,
            completedSteps: workflowRun.completedSteps,
            failedSteps: workflowRun.failedSteps
        };
    }
    
    /**
     * Execute a single workflow step
     */
    async executeStep(step, parameters, workflowRun) {
        const stepStartTime = Date.now();
        
        // Check condition if specified
        if (step.condition && !this.evaluateCondition(step.condition, parameters)) {
            console.log(`⏭️  Skipping step ${step.name} (condition not met)`);
            return { skipped: true, reason: 'condition not met' };
        }
        
        // Substitute parameters in step configuration
        const processedStep = this.substituteParameters(step, parameters);
        
        let result;
        let attempts = 0;
        const maxAttempts = step.retryAttempts || (this.config.enableRetries ? this.config.retryAttempts : 1);
        
        while (attempts < maxAttempts) {
            attempts++;
            
            try {
                switch (processedStep.type) {
                    case 'shell':
                        result = await this.executeShellStep(processedStep, workflowRun);
                        break;
                    case 'node':
                        result = await this.executeNodeStep(processedStep, workflowRun);
                        break;
                    case 'workflow':
                        result = await this.runWorkflow(processedStep.workflow, parameters);
                        break;
                    default:
                        throw new Error(`Unknown step type: ${processedStep.type}`);
                }
                
                break; // Success, exit retry loop
                
            } catch (error) {
                if (attempts >= maxAttempts) {
                    throw error;
                } else {
                    console.warn(`⚠️ Step ${step.name} failed (attempt ${attempts}/${maxAttempts}), retrying in ${step.retryDelay || this.config.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, step.retryDelay || this.config.retryDelay));
                }
            }
        }
        
        const executionTime = Date.now() - stepStartTime;
        
        return {
            ...result,
            executionTime,
            attempts
        };
    }
    
    /**
     * Execute shell command step
     */
    async executeShellStep(step, workflowRun) {
        return new Promise((resolve, reject) => {
            const command = step.command;
            const args = step.args || [];
            const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;
            
            console.log(`🐚 Executing: ${fullCommand}`);
            
            const child = spawn('bash', ['-c', fullCommand], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                if (this.config.enableLogging) {
                    workflowRun.logs.push({ step: step.name, type: 'stdout', message: output, timestamp: Date.now() });
                }
                // Log real-time output
                process.stdout.write(output);
            });
            
            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                if (this.config.enableLogging) {
                    workflowRun.logs.push({ step: step.name, type: 'stderr', message: output, timestamp: Date.now() });
                }
                // Log real-time errors
                process.stderr.write(output);
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ 
                        success: true, 
                        exitCode: code, 
                        stdout: stdout.trim(), 
                        stderr: stderr.trim() 
                    });
                } else {
                    reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`));
                }
            });
            
            child.on('error', (error) => {
                reject(new Error(`Failed to execute command: ${error.message}`));
            });
            
            // Set timeout
            const timeout = step.timeout || this.config.timeout;
            setTimeout(() => {
                child.kill('SIGKILL');
                reject(new Error(`Step ${step.name} timed out after ${timeout}ms`));
            }, timeout);
        });
    }
    
    /**
     * Execute Node.js script step
     */
    async executeNodeStep(step, workflowRun) {
        return new Promise((resolve, reject) => {
            const script = step.script;
            const args = step.args || [];
            
            console.log(`🟢 Executing Node.js: ${script} ${args.join(' ')}`);
            
            const child = spawn('node', [script, ...args], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                if (this.config.enableLogging) {
                    workflowRun.logs.push({ step: step.name, type: 'stdout', message: output, timestamp: Date.now() });
                }
                process.stdout.write(output);
            });
            
            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                if (this.config.enableLogging) {
                    workflowRun.logs.push({ step: step.name, type: 'stderr', message: output, timestamp: Date.now() });
                }
                process.stderr.write(output);
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ 
                        success: true, 
                        exitCode: code, 
                        stdout: stdout.trim(), 
                        stderr: stderr.trim() 
                    });
                } else {
                    reject(new Error(`Node.js script failed with exit code ${code}: ${stderr || stdout}`));
                }
            });
            
            child.on('error', (error) => {
                reject(new Error(`Failed to execute Node.js script: ${error.message}`));
            });
            
            const timeout = step.timeout || this.config.timeout;
            setTimeout(() => {
                child.kill('SIGKILL');
                reject(new Error(`Step ${step.name} timed out after ${timeout}ms`));
            }, timeout);
        });
    }
    
    /**
     * Helper methods
     */
    
    validateParameters(workflow, parameters) {
        if (workflow.parameters) {
            for (const [paramName, paramConfig] of Object.entries(workflow.parameters)) {
                if (paramConfig.required && !parameters.hasOwnProperty(paramName)) {
                    throw new Error(`Required parameter '${paramName}' is missing`);
                }
                
                // Set defaults
                if (!parameters.hasOwnProperty(paramName) && paramConfig.default !== undefined) {
                    parameters[paramName] = paramConfig.default;
                }
            }
        }
    }
    
    substituteParameters(step, parameters) {
        const stepJson = JSON.stringify(step);
        let substituted = stepJson;
        
        // Replace ${paramName} with actual values
        for (const [paramName, paramValue] of Object.entries(parameters)) {
            const regex = new RegExp(`\\$\\{${paramName}\\}`, 'g');
            substituted = substituted.replace(regex, String(paramValue));
        }
        
        return JSON.parse(substituted);
    }
    
    evaluateCondition(condition, parameters) {
        // Simple condition evaluation (can be enhanced)
        let evalCondition = condition;
        
        for (const [paramName, paramValue] of Object.entries(parameters)) {
            const regex = new RegExp(`\\$\\{${paramName}\\}`, 'g');
            evalCondition = evalCondition.replace(regex, JSON.stringify(paramValue));
        }
        
        try {
            return eval(evalCondition);
        } catch (error) {
            console.warn(`⚠️ Failed to evaluate condition: ${condition}`, error);
            return false;
        }
    }
    
    buildDependencyGraph(steps) {
        const graph = new Map();
        
        for (const step of steps) {
            graph.set(step.name, step.dependsOn || []);
        }
        
        return graph;
    }
    
    async saveWorkflowLog(workflowRun) {
        const logPath = path.join(this.config.logsDir, `${workflowRun.id}.json`);
        await fs.writeFile(logPath, JSON.stringify(workflowRun, null, 2));
    }
    
    /**
     * API methods
     */
    
    listWorkflows() {
        const workflows = [];
        for (const [name, workflow] of this.workflows) {
            workflows.push({
                name,
                title: workflow.name,
                description: workflow.description,
                steps: workflow.steps.length,
                parameters: Object.keys(workflow.parameters || {})
            });
        }
        return workflows;
    }
    
    getWorkflow(name) {
        return this.workflows.get(name);
    }
    
    getRunningWorkflows() {
        return Array.from(this.runningWorkflows.values());
    }
    
    getWorkflowHistory(limit = 10) {
        return this.workflowHistory.slice(-limit);
    }
    
    getStatistics() {
        return {
            ...this.statistics,
            successRate: this.statistics.totalRuns > 0 ? (this.statistics.successfulRuns / this.statistics.totalRuns) * 100 : 0,
            currentlyRunning: this.runningWorkflows.size
        };
    }
    
    async stopWorkflow(runId) {
        if (this.runningWorkflows.has(runId)) {
            const workflowRun = this.runningWorkflows.get(runId);
            workflowRun.status = 'stopped';
            workflowRun.endTime = Date.now();
            
            this.runningWorkflows.delete(runId);
            this.workflowHistory.push(workflowRun);
            
            console.log(`🛑 Workflow ${runId} stopped`);
            return true;
        }
        return false;
    }
}

module.exports = WorkflowRunner;

// CLI interface
if (require.main === module) {
    const runner = new WorkflowRunner();
    
    const command = process.argv[2];
    const workflowName = process.argv[3];
    
    async function main() {
        try {
            switch (command) {
                case 'list':
                    console.log('\n📋 Available Workflows:');
                    const workflows = runner.listWorkflows();
                    workflows.forEach(wf => {
                        console.log(`\n🚀 ${wf.name}`);
                        console.log(`   ${wf.description}`);
                        console.log(`   Steps: ${wf.steps}, Parameters: ${wf.parameters.join(', ') || 'none'}`);
                    });
                    break;
                    
                case 'run':
                    if (!workflowName) {
                        console.error('❌ Please specify workflow name: workflow run <name>');
                        process.exit(1);
                    }
                    
                    // Parse parameters from command line
                    const parameters = {};
                    for (let i = 4; i < process.argv.length; i += 2) {
                        const key = process.argv[i]?.replace('--', '');
                        const value = process.argv[i + 1];
                        if (key && value) {
                            parameters[key] = value;
                        }
                    }
                    
                    console.log(`\n🚀 Running workflow: ${workflowName}`);
                    if (Object.keys(parameters).length > 0) {
                        console.log(`📝 Parameters:`, parameters);
                    }
                    
                    const result = await runner.runWorkflow(workflowName, parameters);
                    
                    console.log('\n✅ Workflow completed successfully!');
                    console.log(`📊 Completed ${result.completedSteps.length}/${result.totalSteps} steps`);
                    
                    if (result.failedSteps.length > 0) {
                        console.log(`❌ Failed steps: ${result.failedSteps.map(s => s.name).join(', ')}`);
                    }
                    
                    break;
                    
                case 'status':
                    const stats = runner.getStatistics();
                    const running = runner.getRunningWorkflows();
                    const history = runner.getWorkflowHistory();
                    
                    console.log('\n📊 Workflow Runner Status:');
                    console.log(`Total runs: ${stats.totalRuns}`);
                    console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
                    console.log(`Average execution time: ${(stats.averageExecutionTime / 1000).toFixed(2)}s`);
                    console.log(`Currently running: ${stats.currentlyRunning}`);
                    
                    if (running.length > 0) {
                        console.log('\n🏃 Currently Running:');
                        running.forEach(wf => {
                            console.log(`  ${wf.name} (${wf.id}) - ${wf.currentStep}`);
                        });
                    }
                    
                    if (history.length > 0) {
                        console.log('\n📜 Recent History:');
                        history.forEach(wf => {
                            const duration = (wf.executionTime / 1000).toFixed(2);
                            const status = wf.status === 'completed' ? '✅' : '❌';
                            console.log(`  ${status} ${wf.name} (${duration}s)`);
                        });
                    }
                    
                    break;
                    
                case 'help':
                default:
                    console.log('\n🚀 Unified Workflow Runner');
                    console.log('==========================');
                    console.log('Usage:');
                    console.log('  workflow list                    # List available workflows');
                    console.log('  workflow run <name> [--param value]  # Run workflow with parameters');
                    console.log('  workflow status                  # Show runner status');
                    console.log('  workflow help                    # Show this help');
                    console.log('\nBuilt-in workflows:');
                    console.log('  workflow run quick-start         # Complete system setup');
                    console.log('  workflow run full-testing        # Run all tests');
                    console.log('  workflow run verify-debug        # Verify and debug system');
                    console.log('  workflow run document-to-mvp --documentPath ./doc.md');
                    console.log('  workflow run production-deploy --environment staging');
                    break;
            }
            
        } catch (error) {
            console.error('❌ Workflow error:', error.message);
            process.exit(1);
        }
    }
    
    main();
}
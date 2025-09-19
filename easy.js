#!/usr/bin/env node

/**
 * 🎯 EASY - Simple Commands for Everything
 * 
 * Dead simple interface for all Document Generator workflows
 * Makes complex multi-step processes as easy as one command
 * 
 * Usage:
 * - easy setup          # Complete system setup and verification
 * - easy test           # Run all tests and verify everything works
 * - easy doc <file>     # Process document to working MVP
 * - easy deploy         # Deploy to production
 * - easy debug          # Debug and verify system health
 * - easy find <term>    # Find similar components and patterns
 * - easy status         # Show system status
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

console.log(`
🎯 EASY - Document Generator Helper 🎯
=====================================
Dead Simple Commands for Everything
`);

// Import our systems
const WorkflowRunner = require('./workflow-runner.js');
const MasterDiscoveryOrchestrator = require('./MasterDiscoveryOrchestrator.js');

class EasyInterface {
    constructor() {
        this.workflowRunner = null;
        this.discoveryOrchestrator = null;
        
        // Command definitions
        this.commands = {
            setup: {
                description: 'Complete system setup and verification',
                workflow: 'quick-start',
                icon: '🚀'
            },
            test: {
                description: 'Run all tests and verify everything works',
                workflow: 'full-testing',
                icon: '🧪'
            },
            doc: {
                description: 'Process document to working MVP',
                workflow: 'document-to-mvp',
                icon: '📄',
                parameters: ['documentPath']
            },
            deploy: {
                description: 'Deploy to production',
                workflow: 'production-deploy',
                icon: '🚀'
            },
            debug: {
                description: 'Debug and verify system health',
                workflow: 'verify-debug',
                icon: '🔧'
            },
            find: {
                description: 'Find similar components and patterns',
                handler: 'findComponents',
                icon: '🔍',
                parameters: ['searchTerm']
            },
            status: {
                description: 'Show system status',
                handler: 'showStatus',
                icon: '📊'
            },
            start: {
                description: 'Start all core services',
                script: './start-trinity-system.sh',
                icon: '▶️'
            },
            stop: {
                description: 'Stop all services',
                script: './stop-all-services.sh',
                icon: '⏹️'
            },
            logs: {
                description: 'Show recent logs',
                handler: 'showLogs',
                icon: '📋'
            },
            help: {
                description: 'Show this help message',
                handler: 'showHelp',
                icon: '❓'
            }
        };
    }
    
    async initialize() {
        // Initialize systems lazily
        if (!this.workflowRunner) {
            this.workflowRunner = new WorkflowRunner({
                enableLogging: true,
                maxParallel: 3
            });
        }
        
        if (!this.discoveryOrchestrator) {
            this.discoveryOrchestrator = new MasterDiscoveryOrchestrator({
                enableLearning: true,
                enableCaching: true,
                maxResults: 10
            });
        }
    }
    
    async runCommand(command, args = []) {
        console.log(`${this.commands[command]?.icon || '🔧'} ${this.commands[command]?.description || command}`);
        console.log(''.padEnd(50, '='));
        
        await this.initialize();
        
        const commandConfig = this.commands[command];
        if (!commandConfig) {
            console.error(`❌ Unknown command: ${command}`);
            this.showHelp();
            return;
        }
        
        try {
            if (commandConfig.workflow) {
                await this.runWorkflowCommand(command, commandConfig, args);
            } else if (commandConfig.script) {
                await this.runScriptCommand(commandConfig.script);
            } else if (commandConfig.handler) {
                await this[commandConfig.handler](args);
            }
            
        } catch (error) {
            console.error(`❌ Command failed:`, error.message);
            console.log('\n💡 Tips:');
            console.log('  - Check if all services are running: easy status');
            console.log('  - Try setup first: easy setup');
            console.log('  - Check logs: easy logs');
            console.log('  - Get help: easy help');
            process.exit(1);
        }
    }
    
    async runWorkflowCommand(command, commandConfig, args) {
        const parameters = {};
        
        // Parse parameters
        if (commandConfig.parameters) {
            commandConfig.parameters.forEach((param, index) => {
                if (args[index]) {
                    parameters[param] = args[index];
                }
            });
            
            // Check required parameters
            for (const param of commandConfig.parameters) {
                if (!parameters[param]) {
                    console.error(`❌ Missing required parameter: ${param}`);
                    console.log(`Usage: easy ${command} <${commandConfig.parameters.join('> <')}>`);
                    return;
                }
            }
        }
        
        console.log(`🚀 Running workflow: ${commandConfig.workflow}`);
        if (Object.keys(parameters).length > 0) {
            console.log(`📝 Parameters:`, parameters);
        }
        console.log('');
        
        const result = await this.workflowRunner.runWorkflow(commandConfig.workflow, parameters);
        
        console.log(`\n✅ ${commandConfig.description} completed successfully!`);
        console.log(`📊 Completed ${result.completedSteps.length}/${result.totalSteps} steps`);
        
        if (result.failedSteps.length > 0) {
            console.log(`⚠️  Some steps had issues: ${result.failedSteps.map(s => s.name).join(', ')}`);
        }
    }
    
    async runScriptCommand(script) {
        console.log(`🔧 Running: ${script}`);
        
        return new Promise((resolve, reject) => {
            const child = spawn('bash', ['-c', script], {
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`\n✅ Script completed successfully`);
                    resolve();
                } else {
                    reject(new Error(`Script failed with exit code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                reject(new Error(`Failed to execute script: ${error.message}`));
            });
        });
    }
    
    async findComponents(args) {
        const searchTerm = args[0];
        if (!searchTerm) {
            console.error('❌ Please provide a search term');
            console.log('Usage: easy find <search-term>');
            console.log('Example: easy find "authentication system"');
            return;
        }
        
        console.log(`🔍 Searching for: "${searchTerm}"`);
        console.log('');
        
        const results = await this.discoveryOrchestrator.discover(searchTerm);
        
        if (results.totalResults === 0) {
            console.log('❌ No matches found');
            console.log('\n💡 Try:');
            console.log('  - Broader search terms (e.g., "auth" instead of "authentication system")');
            console.log('  - Different keywords (e.g., "login", "user", "session")');
            console.log('  - Check spelling and try synonyms');
            return;
        }
        
        console.log(`✅ Found ${results.totalResults} matches (${(results.confidence * 100).toFixed(1)}% confidence)`);
        console.log('');
        
        // Show top results
        console.log('🔝 Top Results:');
        results.results.slice(0, 10).forEach((result, index) => {
            const name = result.data?.name || result.data?.title || 'Unknown';
            const type = result.type;
            const score = (result.finalScore * 100).toFixed(1);
            const source = result.source;
            
            console.log(`${index + 1}. [${type}] ${name} (${score}%)`);
            console.log(`   Source: ${source}`);
            if (result.data?.description) {
                console.log(`   Description: ${result.data.description}`);
            }
            console.log('');
        });
        
        // Show duplicates if found
        if (results.duplicates.length > 0) {
            console.log('🔄 Potential Duplicates Found:');
            results.duplicates.forEach((dup, index) => {
                console.log(`${index + 1}. ${dup.result1.data?.name} ↔ ${dup.result2.data?.name} (${(dup.similarity * 100).toFixed(1)}% similar)`);
                console.log(`   Recommendation: ${dup.recommendation}`);
            });
            console.log('');
        }
        
        // Show patterns if found
        if (results.patterns.length > 0) {
            console.log('📋 Patterns Detected:');
            results.patterns.forEach((pattern, index) => {
                console.log(`${index + 1}. ${pattern.description} (${pattern.count} instances)`);
            });
            console.log('');
        }
        
        console.log(`⏱️  Search completed in ${results.executionTime}ms`);
        
        // Show suggestions
        if (results.suggestions.length > 0) {
            console.log('\n💡 Suggestions:');
            results.suggestions.forEach(suggestion => {
                console.log(`  - ${suggestion}`);
            });
        }
    }
    
    async showStatus() {
        console.log('📊 System Status Overview');
        console.log('');
        
        // Workflow runner status
        const workflowStats = this.workflowRunner?.getStatistics() || { totalRuns: 0, successRate: 0, currentlyRunning: 0 };
        console.log('🚀 Workflow Runner:');
        console.log(`  Total runs: ${workflowStats.totalRuns}`);
        console.log(`  Success rate: ${workflowStats.successRate?.toFixed(1) || 0}%`);
        console.log(`  Currently running: ${workflowStats.currentlyRunning}`);
        console.log('');
        
        // Discovery system status
        const discoveryStats = this.discoveryOrchestrator?.getStats() || {};
        console.log('🔍 Discovery System:');
        console.log(`  Total discoveries: ${discoveryStats.totalDiscoveries || 0}`);
        console.log(`  Knowledge graph size: ${discoveryStats.knowledgeGraphSize || 0}`);
        console.log(`  Cache hits: ${discoveryStats.cacheHits || 0}`);
        console.log('');
        
        // Check service status via ObsidianVault service sync
        try {
            console.log('🔧 Service Health:');
            console.log('  Checking services...');
            
            const serviceCheck = spawn('node', ['./scripts/obsidian-vault-service-sync.js'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 10000
            });
            
            let output = '';
            serviceCheck.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            await new Promise((resolve) => {
                serviceCheck.on('close', resolve);
                setTimeout(resolve, 5000); // Max 5 seconds
            });
            
            // Parse service status from output
            const runningServices = (output.match(/✅/g) || []).length;
            const stoppedServices = (output.match(/⭕/g) || []).length;
            const totalServices = runningServices + stoppedServices;
            
            if (totalServices > 0) {
                console.log(`  Running: ${runningServices}/${totalServices} services`);
                console.log(`  Health: ${((runningServices / totalServices) * 100).toFixed(1)}%`);
            }
            
        } catch (error) {
            console.log('  Status check failed - run "easy debug" for details');
        }
        
        console.log('\n💡 Quick Actions:');
        console.log('  easy setup     # Setup and start everything');
        console.log('  easy test      # Run comprehensive tests');
        console.log('  easy debug     # Debug any issues');
        console.log('  easy start     # Start core services');
    }
    
    async showLogs() {
        console.log('📋 Recent Workflow Logs');
        console.log('');
        
        const history = this.workflowRunner?.getWorkflowHistory(5) || [];
        
        if (history.length === 0) {
            console.log('No recent workflow runs found');
            return;
        }
        
        history.forEach((run, index) => {
            const status = run.status === 'completed' ? '✅' : run.status === 'failed' ? '❌' : '🏃';
            const duration = run.executionTime ? `${(run.executionTime / 1000).toFixed(2)}s` : 'running...';
            const time = new Date(run.startTime).toLocaleTimeString();
            
            console.log(`${status} ${run.name} - ${duration} (${time})`);
            
            if (run.failedSteps && run.failedSteps.length > 0) {
                console.log(`   Failed: ${run.failedSteps.map(s => s.name).join(', ')}`);
            }
            
            if (run.error) {
                console.log(`   Error: ${run.error}`);
            }
        });
        
        console.log('\n💡 For detailed logs, check the workflow-logs directory');
    }
    
    showHelp() {
        console.log('\n🎯 EASY - Document Generator Helper');
        console.log('===================================');
        console.log('Simple commands for complex workflows\n');
        
        // Group commands by category
        const categories = {
            'Setup & Management': ['setup', 'start', 'stop', 'status'],
            'Development': ['test', 'debug', 'find', 'doc'],
            'Deployment': ['deploy'],
            'Utilities': ['logs', 'help']
        };
        
        for (const [category, commands] of Object.entries(categories)) {
            console.log(`\n${category}:`);
            commands.forEach(cmd => {
                const config = this.commands[cmd];
                if (config) {
                    const usage = config.parameters ? 
                        `easy ${cmd} <${config.parameters.join('> <')}>` : 
                        `easy ${cmd}`;
                    console.log(`  ${config.icon} ${usage.padEnd(25)} ${config.description}`);
                }
            });
        }
        
        console.log('\nExamples:');
        console.log('  easy setup                          # Complete system setup');
        console.log('  easy doc ./business-plan.md         # Generate MVP from document');
        console.log('  easy find "authentication"          # Find auth-related components');
        console.log('  easy test                           # Run all tests');
        console.log('  easy deploy                         # Deploy to production');
        
        console.log('\nNeed help? Check the documentation or run specific commands for details.');
    }
}

// CLI interface
if (require.main === module) {
    const easy = new EasyInterface();
    const command = process.argv[2] || 'help';
    const args = process.argv.slice(3);
    
    // Handle easy setup of the easy command itself
    if (command === 'install' || command === 'init') {
        console.log('🔧 Setting up Easy interface...');
        
        // Make scripts executable
        const scripts = [
            './workflow-runner.js',
            './MasterDiscoveryOrchestrator.js',
            './UnifiedSimilarityEngine.js',
            './KnowledgeGraphVisualizer.js',
            './easy.js'
        ];
        
        scripts.forEach(script => {
            try {
                require('child_process').execSync(`chmod +x ${script}`);
                console.log(`✅ Made ${script} executable`);
            } catch (error) {
                console.warn(`⚠️  Could not make ${script} executable:`, error.message);
            }
        });
        
        console.log('\n✅ Easy interface setup complete!');
        console.log('\nTry these commands:');
        console.log('  easy setup     # Complete system setup');
        console.log('  easy help      # Show all available commands');
        return;
    }
    
    easy.runCommand(command, args).catch(error => {
        console.error('\n❌ Command failed:', error.message);
        process.exit(1);
    });
}

module.exports = EasyInterface;
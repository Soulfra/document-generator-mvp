#!/usr/bin/env node

/**
 * SHOWCASE INTEGRATION
 * Connects the business showcase to actual running systems
 */

const axios = require('axios');
let chalk;
try {
    chalk = require('chalk');
} catch (e) {
    // Simple chalk mock for color-free output
    chalk = {
        cyan: (str) => str,
        white: (str) => str,
        green: (str) => str,
        red: (str) => str,
        yellow: (str) => str,
        blue: (str) => str,
        magenta: (str) => str,
        gray: (str) => str,
        bold: { cyan: (str) => str }
    };
}

class ShowcaseIntegration {
    constructor() {
        this.services = {
            // Core infrastructure (from start-everything-now.sh)
            postgres: { port: 5433, status: 'unknown' },
            redis: { port: 6380, status: 'unknown' },
            ollama: { port: 11435, status: 'unknown' },
            quickStart: { port: 9999, status: 'unknown' },
            
            // Business showcase
            showcase: { port: 18000, status: 'unknown' },
            
            // AI Curriculum Systems
            aiCurriculum: { port: 14000, status: 'unknown' },
            metaLesson: { port: 17000, status: 'unknown' },
            portfolioGen: { port: 17500, status: 'unknown' },
            
            // Gaming systems
            debugGame: { port: 8500, status: 'unknown' },
            gachaToken: { port: 7300, status: 'unknown' },
            tycoonGame: { port: 7090, status: 'unknown' }
        };
    }
    
    async checkAllServices() {
        console.log(chalk.cyan('\n🔍 CHECKING ALL SERVICES...\n'));
        
        for (const [name, service] of Object.entries(this.services)) {
            try {
                // Different check methods for different services
                if (name === 'postgres') {
                    // Would need pg client, skip for now
                    service.status = 'docker';
                } else if (name === 'redis') {
                    // Would need redis client, skip for now
                    service.status = 'docker';
                } else if (name === 'ollama') {
                    const response = await axios.get(`http://localhost:${service.port}/api/tags`, { timeout: 2000 });
                    service.status = response.data ? 'running' : 'error';
                } else {
                    // HTTP services
                    const response = await axios.get(`http://localhost:${service.port}`, { timeout: 2000 });
                    service.status = 'running';
                }
            } catch (error) {
                service.status = 'offline';
            }
            
            // Display status
            const statusIcon = service.status === 'running' ? '✅' : 
                              service.status === 'docker' ? '🐳' : '❌';
            const statusColor = service.status === 'running' ? chalk.green :
                               service.status === 'docker' ? chalk.blue : chalk.red;
            
            console.log(`${statusIcon} ${chalk.white(name.padEnd(15))} ${statusColor(`[${service.port}]`)} ${statusColor(service.status)}`);
        }
    }
    
    async showSystemOrganization() {
        console.log(chalk.cyan('\n📊 BUSINESS TIER ORGANIZATION\n'));
        
        try {
            const response = await axios.get('http://localhost:18000/api/showcase/systems');
            const systems = response.data;
            
            console.log(chalk.yellow('MVP TIER') + ` (${systems.byTier.mvp.length} systems)`);
            console.log('  → Quick demos, experimental features');
            console.log('  → Free to try\n');
            
            console.log(chalk.green('PRODUCTION TIER') + ` (${systems.byTier.production.length} systems)`);
            console.log('  → Battle-tested, ready for deployment');
            console.log('  → $99-499/month\n');
            
            console.log(chalk.blue('ENTERPRISE TIER') + ` (${systems.byTier.enterprise.length} systems)`);
            console.log('  → Full-scale business systems');
            console.log('  → $999-4999/month\n');
            
            console.log(chalk.magenta('PLATFORM TIER') + ` (${systems.byTier.platform.length} systems)`);
            console.log('  → White-label platforms');
            console.log('  → Revenue share model\n');
            
            // Show category breakdown
            console.log(chalk.cyan('📚 BY CATEGORY:\n'));
            for (const [category, catSystems] of Object.entries(systems.byCategory)) {
                if (catSystems.length > 0) {
                    console.log(`  ${category}: ${catSystems.length} systems`);
                }
            }
            
        } catch (error) {
            console.log(chalk.red('❌ Could not fetch system organization'));
        }
    }
    
    async showIntegrationPaths() {
        console.log(chalk.cyan('\n🔗 INTEGRATION PATHS\n'));
        
        console.log(chalk.white('1. DOCUMENT → MVP PIPELINE:'));
        console.log('   Upload Document → AI Analysis → Template Selection → Code Generation → Working MVP');
        console.log(`   Status: ${this.services.ollama.status === 'running' ? '✅ Ready' : '❌ AI service offline'}\n`);
        
        console.log(chalk.white('2. AI CURRICULUM → PORTFOLIO:'));
        console.log('   Challenge → AI Solutions → Lesson Extraction → Student Projects → Professional Portfolio');
        console.log(`   Status: ${this.services.metaLesson.status === 'running' ? '✅ Ready' : '❌ Orchestrator offline'}\n`);
        
        console.log(chalk.white('3. GAMING → REAL REWARDS:'));
        console.log('   Debug Real Bugs → Earn Tokens → Gacha Rolls → Build Empire → Job Ready');
        console.log(`   Status: ${this.services.debugGame.status === 'running' ? '✅ Ready' : '❌ Game systems offline'}\n`);
        
        console.log(chalk.white('4. SHOWCASE → BUSINESS:'));
        console.log('   Browse Systems → Try Demos → Select Tier → Deploy → Generate Revenue');
        console.log(`   Status: ${this.services.showcase.status === 'running' ? '✅ Ready' : '❌ Showcase offline'}\n`);
    }
    
    async showQuickActions() {
        console.log(chalk.cyan('\n⚡ QUICK ACTIONS\n'));
        
        console.log(chalk.white('Access Points:'));
        console.log(`  🌐 Business Showcase: ${chalk.green('http://localhost:18000')}`);
        console.log(`  🚀 Quick Start UI: ${chalk.green('http://localhost:9999')}`);
        console.log(`  📊 System Status: ${chalk.green('http://localhost:9999/status')}\n`);
        
        console.log(chalk.white('Start Missing Services:'));
        console.log(`  ${chalk.gray('node ai-curriculum-generator.js &')}`);
        console.log(`  ${chalk.gray('node meta-lesson-orchestrator.js &')}`);
        console.log(`  ${chalk.gray('node portfolio-generator.js &')}\n`);
        
        console.log(chalk.white('Full System Launch:'));
        console.log(`  ${chalk.gray('./ACTUALLY-WORKING-FINAL-LAUNCH.sh')}`);
    }
    
    async run() {
        console.log(chalk.bold.cyan('\n🎯 DOCUMENT GENERATOR - SYSTEM INTEGRATION STATUS'));
        console.log(chalk.gray('='.repeat(60)));
        
        await this.checkAllServices();
        await this.showSystemOrganization();
        await this.showIntegrationPaths();
        await this.showQuickActions();
        
        // Summary
        const runningCount = Object.values(this.services).filter(s => s.status === 'running').length;
        const totalCount = Object.keys(this.services).length;
        const percentage = Math.round((runningCount / totalCount) * 100);
        
        console.log(chalk.cyan('\n📈 OVERALL SYSTEM HEALTH\n'));
        console.log(`  Running Services: ${runningCount}/${totalCount} (${percentage}%)`);
        
        if (percentage < 50) {
            console.log(chalk.red('\n⚠️  System health is low. Run start scripts to bring up services.'));
        } else if (percentage < 100) {
            console.log(chalk.yellow('\n⚡ System partially operational. Some features may be limited.'));
        } else {
            console.log(chalk.green('\n✅ All systems operational! Ready for business.'));
        }
        
        console.log(chalk.gray('\n' + '='.repeat(60) + '\n'));
    }
}


// Run the integration check
const integration = new ShowcaseIntegration();
integration.run().catch(console.error);
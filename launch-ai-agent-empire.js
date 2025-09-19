#!/usr/bin/env node

/**
 * 🚀👑 AI AGENT EMPIRE LAUNCHER
 * Complete autonomous AI ecosystem with:
 * - AI agents playing Revenue MUD
 * - Multi-platform bot control (Discord/Slack/Telegram)
 * - RSS/Email monitoring
 * - Idle tycoon progression
 * - Agent marketplace
 */

const AIAgentEmpireHub = require('./ai-agent-empire-hub.js');
const MultiPlatformBotOrchestrator = require('./multi-platform-bot-orchestrator.js');
const AutonomousMUDPlayerAgent = require('./autonomous-mud-player-agent.js');
const RSSEmailMonitorAgent = require('./rss-email-monitor-agent.js');

class AIAgentEmpireLauncher {
    constructor() {
        this.empire = null;
        this.botOrchestrator = null;
        this.services = new Map();
        
        console.log('🚀👑 AI Agent Empire Launcher initializing...');
    }
    
    async launch() {
        try {
            console.log('\n🏗️ Building the AI Agent Empire...\n');
            
            // 1. Start the Empire Hub
            console.log('👑 Starting Empire Hub...');
            this.empire = new AIAgentEmpireHub();
            
            // Extend empire with specialized agent factories
            this.extendEmpireWithAgentFactories();
            
            await this.empire.start();
            this.services.set('empire', `http://localhost:${this.empire.port}`);
            
            // 2. Start Multi-Platform Bot Orchestrator
            console.log('\n💬 Starting Bot Orchestrator...');
            this.botOrchestrator = new MultiPlatformBotOrchestrator(this.empire);
            this.botOrchestrator.start();
            this.services.set('bots', `http://localhost:${this.botOrchestrator.port}`);
            
            // 3. Display success message
            this.displayLaunchSuccess();
            
            // 4. Setup monitoring
            this.setupMonitoring();
            
            // 5. Handle graceful shutdown
            this.setupGracefulShutdown();
            
        } catch (error) {
            console.error('❌ Launch failed:', error);
            process.exit(1);
        }
    }
    
    extendEmpireWithAgentFactories() {
        // Override the performAgentAction to use specialized agents
        const originalPerformAction = this.empire.performAgentAction.bind(this.empire);
        
        this.empire.performAgentAction = async (agent) => {
            switch (agent.type) {
                case 'mud-player':
                    // Use the autonomous MUD player
                    if (!agent.mudPlayer) {
                        agent.mudPlayer = new AutonomousMUDPlayerAgent(agent, this.empire);
                        await agent.mudPlayer.connect();
                    }
                    agent.status = 'playing_mud';
                    break;
                    
                case 'rss-watcher':
                case 'email-processor':
                    // Use the RSS/Email monitor
                    if (!agent.monitor) {
                        agent.monitor = new RSSEmailMonitorAgent(agent, this.empire);
                        await agent.monitor.start();
                    }
                    agent.status = 'monitoring_rss';
                    break;
                    
                default:
                    // Use original behavior for other types
                    await originalPerformAction(agent);
            }
        };
    }
    
    setupMonitoring() {
        // Monitor empire statistics
        setInterval(() => {
            const stats = {
                agents: this.empire.empire.agents.size,
                gold: this.empire.empire.economy.gold.toFixed(2),
                income: this.empire.empire.economy.income,
                tasks: this.empire.empire.activities.completedTasks.length,
                revenue: this.empire.empire.activities.revenueGenerated.toFixed(2)
            };
            
            console.log(`\n📊 Empire Stats - Agents: ${stats.agents} | Gold: ${stats.gold} | Income: ${stats.income}/min | Tasks: ${stats.tasks} | Revenue: $${stats.revenue}`);
        }, 30000); // Every 30 seconds
    }
    
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}. Shutting down AI Agent Empire...`);
            
            // Stop all agents
            this.empire.empire.agents.forEach(agent => {
                if (agent.mudPlayer) {
                    agent.mudPlayer.stop();
                }
                if (agent.monitor) {
                    agent.monitor.stop();
                }
            });
            
            console.log('✅ AI Agent Empire shut down gracefully.');
            process.exit(0);
        };
        
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    
    displayLaunchSuccess() {
        console.log(`
🚀👑 AI AGENT EMPIRE FULLY OPERATIONAL! 👑🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 EMPIRE DASHBOARD: http://localhost:9900
📊 Empire API: http://localhost:9900/api/empire/status
💬 Bot Control: http://localhost:9901

🤖 AUTONOMOUS AGENTS:
  • MUD Players - Play Revenue MUD autonomously
  • Cal Whisperers - Interact with Cal AI for roasts
  • Affiliate Hunters - Find and promote products
  • RSS Watchers - Monitor feeds and alerts
  • Email Processors - Sort and respond to emails

💬 MULTI-PLATFORM CONTROL:
  Discord Commands:
    !empire - Show empire status
    !spawn <type> - Create new agent
    !agents - List all agents
    !task <agent> <task> - Assign task
    
  Slack Commands:
    /empire-status - Overview
    /spawn-agent - Create agent
    /agent-report - Activity report
    
  Telegram Commands:
    /start - Begin management
    /spawn - Agent menu
    /stats - View statistics

📡 EXTERNAL MONITORING:
  • RSS Feeds: Tech news, GitHub trends, dev blogs
  • Email Inboxes: devlogs@, alerts@, reports@
  • Real-time alerts on important events
  • Pattern detection and trend analysis

💰 IDLE TYCOON FEATURES:
  • Passive income from agents
  • Upgrade paths and prestige system
  • Agent marketplace (coming soon)
  • Compound growth mechanics

🎮 INTEGRATION WITH REVENUE MUD:
  • Agents play MUD autonomously
  • Generate revenue through gameplay
  • Collect Cal AI roasts
  • Complete affiliate purchases

📈 QUICK START GUIDE:
  1. Open dashboard: http://localhost:9900
  2. Spawn your first agents (2 free starters!)
  3. Watch them work autonomously
  4. Control via Discord/Slack/Telegram
  5. Monitor RSS/Email alerts
  6. Grow your empire!

🔗 TEST COMMANDS:
  Discord Mock: http://localhost:9901/discord/mock/empire
  Check Status: http://localhost:9900/api/empire/status

🎯 TIPS:
  • Start with mud-player and rss-watcher agents
  • Use platform commands to manage remotely
  • Check dashboard for real-time updates
  • Agents learn and improve over time
  • Prestige at 10,000 gold for 2x multiplier

Your AI agents are ready to conquer the digital realm!
Press Ctrl+C to shutdown the empire.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    }
}

// Launch the empire
if (require.main === module) {
    const launcher = new AIAgentEmpireLauncher();
    launcher.launch().catch(console.error);
}

module.exports = AIAgentEmpireLauncher;
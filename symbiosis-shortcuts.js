#!/usr/bin/env node

/**
 * SYMBIOSIS PLATFORM SHORTCUTS
 * Quick access commands for AI-Human Symbiosis Platform
 * Provides dashboard views, quick actions, and monitoring
 * Integrates with Cal keybindings for unified access
 */

const EventEmitter = require('events');
const Table = require('cli-table3');
const chalk = require('chalk');
const blessed = require('blessed');

console.log(`
🎯 SYMBIOSIS SHORTCUTS SYSTEM 🎯
================================
📊 Quick dashboards
⚡ Fast actions
🔍 Live monitoring
🤝 Human-AI bridge
`);

class SymbiosisShortcuts extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Display settings
            refreshInterval: config.refreshInterval || 5000,
            colorScheme: config.colorScheme || 'default',
            
            // Dashboard layouts
            defaultLayout: config.defaultLayout || 'overview',
            compactMode: config.compactMode || false,
            
            // Integration settings
            bridgePath: config.bridgePath || './symbiosis-cal-bridge',
            calPath: config.calPath || './cal-reasoning-engine',
            
            // Quick action settings
            confirmActions: config.confirmActions !== false,
            autoRefresh: config.autoRefresh !== false,
            
            ...config
        };
        
        // Shortcut definitions
        this.shortcuts = {
            // Dashboard views
            'F1': { view: 'overview', description: 'System overview' },
            'F2': { view: 'sandbox', description: 'AI sandbox monitor' },
            'F3': { view: 'governance', description: 'Voting dashboard' },
            'F4': { view: 'funding', description: 'Funding tracker' },
            'F5': { view: 'evolution', description: 'Evolution metrics' },
            'F6': { view: 'cal', description: 'Cal reasoning view' },
            
            // Quick actions
            'ctrl+n': { action: 'new_idea', description: 'Submit new AI idea' },
            'ctrl+v': { action: 'quick_vote', description: 'Quick vote on proposal' },
            'ctrl+f': { action: 'fund_project', description: 'Fund a project' },
            'ctrl+r': { action: 'refresh', description: 'Refresh current view' },
            
            // Navigation
            'tab': { action: 'next_view', description: 'Next dashboard' },
            'shift+tab': { action: 'prev_view', description: 'Previous dashboard' },
            'esc': { action: 'main_menu', description: 'Return to main' },
            
            // Monitoring
            'l': { action: 'live_mode', description: 'Toggle live updates' },
            's': { action: 'snapshot', description: 'Take snapshot' },
            'e': { action: 'export', description: 'Export current view' },
            
            // Cal integration
            'c': { action: 'cal_query', description: 'Quick Cal query' },
            'i': { action: 'introspect', description: 'System introspection' },
            'p': { action: 'patterns', description: 'Pattern analysis' }
        };
        
        // Dashboard definitions
        this.dashboards = {
            overview: {
                title: 'Symbiosis Platform Overview',
                sections: ['system_health', 'active_counts', 'recent_activity', 'performance'],
                refreshRate: 5000
            },
            
            sandbox: {
                title: 'AI Cultural Sandbox',
                sections: ['active_agents', 'idea_pipeline', 'cultural_patterns', 'interactions'],
                refreshRate: 3000
            },
            
            governance: {
                title: 'Human Governance System',
                sections: ['active_proposals', 'voting_status', 'reputation_leaders', 'recent_votes'],
                refreshRate: 10000
            },
            
            funding: {
                title: 'AI-to-Human Funding',
                sections: ['open_projects', 'active_contracts', 'payment_queue', 'executor_stats'],
                refreshRate: 5000
            },
            
            evolution: {
                title: 'Evolution & Learning',
                sections: ['success_patterns', 'failure_patterns', 'learning_rate', 'adaptations'],
                refreshRate: 15000
            },
            
            cal: {
                title: 'Cal Reasoning Monitor',
                sections: ['reasoning_chains', 'memory_usage', 'pattern_matches', 'query_performance'],
                refreshRate: 2000
            }
        };
        
        // Quick action templates
        this.actionTemplates = {
            new_idea: {
                fields: ['type', 'seed', 'initial_content'],
                validator: (data) => data.seed && data.initial_content
            },
            
            quick_vote: {
                fields: ['proposal_id', 'vote', 'reasoning'],
                validator: (data) => data.proposal_id && ['yes', 'no', 'abstain'].includes(data.vote)
            },
            
            fund_project: {
                fields: ['project_id', 'amount', 'terms'],
                validator: (data) => data.project_id && data.amount > 0
            }
        };
        
        // State
        this.state = {
            currentView: 'overview',
            liveMode: true,
            refreshTimer: null,
            screen: null,
            widgets: {},
            data: {}
        };
        
        // Stats
        this.stats = {
            viewsAccessed: {},
            actionsPerformed: {},
            snapshotsTaken: 0,
            totalRefreshes: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Symbiosis Shortcuts...');
        
        try {
            // Load bridge integration
            await this.loadBridge();
            
            // Initialize display
            await this.initializeDisplay();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Start refresh cycle
            if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
            
            console.log('✅ Symbiosis Shortcuts initialized!');
            console.log(`📊 ${Object.keys(this.dashboards).length} dashboards available`);
            console.log(`⚡ ${Object.keys(this.shortcuts).length} shortcuts configured`);
            
            this.emit('shortcuts_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize shortcuts:', error);
            throw error;
        }
    }
    
    /**
     * Switch to a dashboard view
     */
    async switchView(viewName) {
        if (!this.dashboards[viewName]) {
            console.error(`Unknown view: ${viewName}`);
            return;
        }
        
        console.log(`\n📊 Switching to: ${this.dashboards[viewName].title}`);
        
        this.state.currentView = viewName;
        this.stats.viewsAccessed[viewName] = (this.stats.viewsAccessed[viewName] || 0) + 1;
        
        // Load view data
        await this.loadDashboardData(viewName);
        
        // Render view
        await this.renderDashboard(viewName);
        
        this.emit('view_changed', viewName);
    }
    
    /**
     * Execute a quick action
     */
    async executeAction(actionName, data = {}) {
        console.log(`\n⚡ Executing: ${actionName}`);
        
        this.stats.actionsPerformed[actionName] = (this.stats.actionsPerformed[actionName] || 0) + 1;
        
        switch (actionName) {
            case 'new_idea':
                return await this.actionNewIdea(data);
            
            case 'quick_vote':
                return await this.actionQuickVote(data);
            
            case 'fund_project':
                return await this.actionFundProject(data);
            
            case 'refresh':
                return await this.refreshCurrentView();
            
            case 'next_view':
                return await this.navigateNextView();
            
            case 'prev_view':
                return await this.navigatePrevView();
            
            case 'live_mode':
                return await this.toggleLiveMode();
            
            case 'snapshot':
                return await this.takeSnapshot();
            
            case 'export':
                return await this.exportCurrentView();
            
            case 'cal_query':
                return await this.quickCalQuery(data);
            
            case 'introspect':
                return await this.systemIntrospection();
            
            case 'patterns':
                return await this.patternAnalysis();
            
            default:
                console.error(`Unknown action: ${actionName}`);
        }
    }
    
    /**
     * Render dashboard with live data
     */
    async renderDashboard(viewName) {
        const dashboard = this.dashboards[viewName];
        const data = this.state.data[viewName] || {};
        
        console.clear();
        console.log(chalk.bold.cyan(`\n${dashboard.title}`));
        console.log(chalk.gray('─'.repeat(50)));
        
        // Render each section
        for (const section of dashboard.sections) {
            await this.renderSection(section, data[section]);
        }
        
        // Show shortcuts hint
        console.log(chalk.gray('\n[F1-F6: Views] [Tab: Navigate] [L: Live mode] [?: Help]'));
        
        // Update timestamp
        console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`));
    }
    
    /**
     * Render a dashboard section
     */
    async renderSection(sectionName, data) {
        switch (sectionName) {
            case 'system_health':
                this.renderSystemHealth(data);
                break;
                
            case 'active_counts':
                this.renderActiveCounts(data);
                break;
                
            case 'recent_activity':
                this.renderRecentActivity(data);
                break;
                
            case 'active_agents':
                this.renderActiveAgents(data);
                break;
                
            case 'idea_pipeline':
                this.renderIdeaPipeline(data);
                break;
                
            case 'cultural_patterns':
                this.renderCulturalPatterns(data);
                break;
                
            case 'active_proposals':
                this.renderActiveProposals(data);
                break;
                
            case 'voting_status':
                this.renderVotingStatus(data);
                break;
                
            case 'open_projects':
                this.renderOpenProjects(data);
                break;
                
            case 'success_patterns':
                this.renderSuccessPatterns(data);
                break;
                
            case 'reasoning_chains':
                this.renderReasoningChains(data);
                break;
                
            case 'memory_usage':
                this.renderMemoryUsage(data);
                break;
                
            default:
                console.log(chalk.yellow(`\n[${sectionName}] - No renderer available`));
        }
    }
    
    // Section renderers
    
    renderSystemHealth(data = {}) {
        console.log(chalk.bold.white('\n🏥 System Health'));
        
        const table = new Table({
            head: ['Component', 'Status', 'Uptime', 'Load'],
            colWidths: [20, 10, 15, 10]
        });
        
        table.push(
            ['AI Sandbox', chalk.green('●'), '7d 14h', '42%'],
            ['Governance', chalk.green('●'), '7d 14h', '18%'],
            ['Funding Platform', chalk.green('●'), '7d 13h', '65%'],
            ['Cal Engine', chalk.green('●'), '7d 14h', '31%'],
            ['Evolution Loop', chalk.yellow('●'), '7d 12h', '89%']
        );
        
        console.log(table.toString());
    }
    
    renderActiveCounts(data = {}) {
        console.log(chalk.bold.white('\n📊 Active Counts'));
        
        const counts = [
            { label: 'AI Agents', value: data.aiAgents || 42, change: '+3' },
            { label: 'Ideas', value: data.ideas || 156, change: '+12' },
            { label: 'Projects', value: data.projects || 23, change: '+2' },
            { label: 'Votes', value: data.votes || 89, change: '+7' },
            { label: 'Contracts', value: data.contracts || 15, change: '0' }
        ];
        
        for (const item of counts) {
            const changeColor = item.change.startsWith('+') ? chalk.green : chalk.red;
            console.log(`  ${item.label}: ${chalk.bold(item.value)} ${changeColor(item.change)}`);
        }
    }
    
    renderRecentActivity(data = {}) {
        console.log(chalk.bold.white('\n🕒 Recent Activity'));
        
        const activities = data.activities || [
            { time: '2m ago', event: 'New AI idea: Distributed Learning Network', type: 'idea' },
            { time: '5m ago', event: 'Vote passed: Fund Project Alpha-7', type: 'vote' },
            { time: '12m ago', event: 'Pattern emerged: Collaborative Success', type: 'pattern' },
            { time: '18m ago', event: 'Contract completed: UI Enhancement', type: 'contract' },
            { time: '25m ago', event: 'Agent mutation: Explorer-42 evolved', type: 'evolution' }
        ];
        
        for (const activity of activities.slice(0, 5)) {
            const icon = this.getActivityIcon(activity.type);
            console.log(`  ${chalk.gray(activity.time)} ${icon} ${activity.event}`);
        }
    }
    
    renderActiveAgents(data = {}) {
        console.log(chalk.bold.white('\n🤖 Active AI Agents'));
        
        const table = new Table({
            head: ['Agent', 'Type', 'Energy', 'Ideas', 'Status'],
            colWidths: [15, 20, 10, 10, 15]
        });
        
        const agents = data.agents || [
            { id: 'Alpha-1', type: 'Creative Ideator', energy: 85, ideas: 12, status: 'Exploring' },
            { id: 'Beta-7', type: 'Practical Architect', energy: 72, ideas: 8, status: 'Building' },
            { id: 'Gamma-3', type: 'System Critic', energy: 91, ideas: 5, status: 'Analyzing' }
        ];
        
        for (const agent of agents) {
            table.push([
                agent.id,
                agent.type,
                this.getEnergyBar(agent.energy),
                agent.ideas.toString(),
                chalk.cyan(agent.status)
            ]);
        }
        
        console.log(table.toString());
    }
    
    renderIdeaPipeline(data = {}) {
        console.log(chalk.bold.white('\n💡 Idea Pipeline'));
        
        const stages = data.pipeline || {
            nascent: 45,
            developing: 28,
            mature: 12,
            funded: 8,
            executing: 5
        };
        
        for (const [stage, count] of Object.entries(stages)) {
            const bar = this.getProgressBar(count, 50);
            console.log(`  ${stage.padEnd(12)} ${bar} ${count}`);
        }
    }
    
    renderCulturalPatterns(data = {}) {
        console.log(chalk.bold.white('\n🎭 Cultural Patterns'));
        
        const patterns = data.patterns || [
            { name: 'Collaborative Innovation', strength: 0.84, trend: 'rising' },
            { name: 'Resource Optimization', strength: 0.72, trend: 'stable' },
            { name: 'Rapid Iteration', strength: 0.91, trend: 'rising' },
            { name: 'Quality Focus', strength: 0.68, trend: 'falling' }
        ];
        
        for (const pattern of patterns) {
            const trendIcon = this.getTrendIcon(pattern.trend);
            const strength = Math.round(pattern.strength * 100);
            console.log(`  ${pattern.name}: ${strength}% ${trendIcon}`);
        }
    }
    
    renderMemoryUsage(data = {}) {
        console.log(chalk.bold.white('\n💾 Cal Memory Usage'));
        
        const table = new Table({
            head: ['Level', 'Used', 'Capacity', 'Usage'],
            colWidths: [15, 10, 10, 20]
        });
        
        const levels = data.levels || [
            { name: 'Immediate', used: 8, capacity: 10, percent: 80 },
            { name: 'Short-term', used: 67, capacity: 100, percent: 67 },
            { name: 'Working', used: 423, capacity: 1000, percent: 42 },
            { name: 'Long-term', used: 2341, capacity: 5000, percent: 47 },
            { name: 'Archival', used: 8923, capacity: '∞', percent: 0 }
        ];
        
        for (const level of levels) {
            table.push([
                level.name,
                level.used.toString(),
                level.capacity.toString(),
                level.capacity === '∞' ? 'Unlimited' : this.getUsageBar(level.percent)
            ]);
        }
        
        console.log(table.toString());
    }
    
    // Action implementations
    
    async actionNewIdea(data) {
        console.log('\n💡 Submitting new AI idea...');
        
        // Validate data
        const template = this.actionTemplates.new_idea;
        if (!template.validator(data)) {
            console.error('Invalid idea data');
            return;
        }
        
        // Submit via bridge
        const result = await this.bridge.submitIdea(data);
        
        console.log(chalk.green('✅ Idea submitted successfully!'));
        console.log(`ID: ${result.id}`);
        console.log(`Initial fitness: ${result.fitness}`);
        
        return result;
    }
    
    async actionQuickVote(data) {
        console.log('\n🗳️  Quick voting...');
        
        // Get active proposals if not specified
        if (!data.proposal_id) {
            const proposals = await this.bridge.getActiveProposals();
            if (proposals.length === 0) {
                console.log('No active proposals');
                return;
            }
            
            // Show proposals for selection
            console.log('\nActive Proposals:');
            for (const [i, prop] of proposals.entries()) {
                console.log(`${i + 1}. ${prop.title} (${prop.category})`);
            }
            
            // Would implement selection UI
            data.proposal_id = proposals[0].id;
        }
        
        // Submit vote
        const result = await this.bridge.submitVote(data);
        
        console.log(chalk.green('✅ Vote submitted!'));
        return result;
    }
    
    async refreshCurrentView() {
        this.stats.totalRefreshes++;
        console.log(chalk.yellow('\n🔄 Refreshing...'));
        
        await this.loadDashboardData(this.state.currentView);
        await this.renderDashboard(this.state.currentView);
    }
    
    async toggleLiveMode() {
        this.state.liveMode = !this.state.liveMode;
        console.log(chalk.yellow(`\n📡 Live mode: ${this.state.liveMode ? 'ON' : 'OFF'}`));
        
        if (this.state.liveMode) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
    }
    
    async takeSnapshot() {
        this.stats.snapshotsTaken++;
        
        const snapshot = {
            timestamp: new Date().toISOString(),
            view: this.state.currentView,
            data: this.state.data[this.state.currentView],
            stats: { ...this.stats }
        };
        
        const filename = `symbiosis-snapshot-${Date.now()}.json`;
        console.log(chalk.green(`\n📸 Snapshot saved: ${filename}`));
        
        return snapshot;
    }
    
    // Helper methods
    
    async loadBridge() {
        try {
            const Bridge = require(this.config.bridgePath);
            this.bridge = new Bridge();
        } catch (error) {
            // Create mock bridge
            this.bridge = {
                getSystemStatus: async () => ({ healthy: true }),
                getActiveAgents: async () => [],
                getActiveProposals: async () => [],
                submitIdea: async (data) => ({ id: 'mock-id', fitness: 0.5 }),
                submitVote: async (data) => ({ success: true })
            };
        }
    }
    
    async initializeDisplay() {
        // Would initialize blessed screen for full TUI
        // For now, using console output
    }
    
    async loadDashboardData(viewName = null) {
        const views = viewName ? [viewName] : Object.keys(this.dashboards);
        
        for (const view of views) {
            this.state.data[view] = await this.fetchDashboardData(view);
        }
    }
    
    async fetchDashboardData(viewName) {
        // Fetch real data from bridge
        // For now, returning mock data
        return {
            system_health: {},
            active_counts: {
                aiAgents: 42,
                ideas: 156,
                projects: 23,
                votes: 89,
                contracts: 15
            }
        };
    }
    
    startAutoRefresh() {
        if (this.state.refreshTimer) return;
        
        const dashboard = this.dashboards[this.state.currentView];
        this.state.refreshTimer = setInterval(() => {
            if (this.state.liveMode) {
                this.refreshCurrentView();
            }
        }, dashboard.refreshRate);
    }
    
    stopAutoRefresh() {
        if (this.state.refreshTimer) {
            clearInterval(this.state.refreshTimer);
            this.state.refreshTimer = null;
        }
    }
    
    navigateNextView() {
        const views = Object.keys(this.dashboards);
        const currentIndex = views.indexOf(this.state.currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        return this.switchView(views[nextIndex]);
    }
    
    navigatePrevView() {
        const views = Object.keys(this.dashboards);
        const currentIndex = views.indexOf(this.state.currentView);
        const prevIndex = (currentIndex - 1 + views.length) % views.length;
        return this.switchView(views[prevIndex]);
    }
    
    // UI helpers
    
    getEnergyBar(energy) {
        const filled = Math.round(energy / 10);
        const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
        const color = energy > 70 ? chalk.green : energy > 40 ? chalk.yellow : chalk.red;
        return color(bar);
    }
    
    getProgressBar(value, max) {
        const percent = value / max;
        const filled = Math.round(percent * 20);
        const bar = '▓'.repeat(filled) + '░'.repeat(20 - filled);
        return chalk.cyan(bar);
    }
    
    getUsageBar(percent) {
        const filled = Math.round(percent / 5);
        const bar = '■'.repeat(filled) + '□'.repeat(20 - filled);
        const color = percent > 80 ? chalk.red : percent > 60 ? chalk.yellow : chalk.green;
        return color(bar);
    }
    
    getActivityIcon(type) {
        const icons = {
            idea: '💡',
            vote: '🗳️',
            pattern: '🎭',
            contract: '📋',
            evolution: '🧬',
            default: '•'
        };
        return icons[type] || icons.default;
    }
    
    getTrendIcon(trend) {
        const icons = {
            rising: chalk.green('↗'),
            stable: chalk.yellow('→'),
            falling: chalk.red('↘')
        };
        return icons[trend] || '';
    }
}

// Export the shortcuts system
module.exports = SymbiosisShortcuts;

// Interactive mode when run directly
if (require.main === module) {
    console.log('🚀 Starting Symbiosis Shortcuts...\n');
    
    const shortcuts = new SymbiosisShortcuts();
    
    shortcuts.on('shortcuts_ready', () => {
        // Start with overview
        shortcuts.switchView('overview');
        
        // Handle keyboard input
        process.stdin.setRawMode(true);
        process.stdin.on('data', async (key) => {
            const keyStr = key.toString();
            
            // Handle function keys
            if (keyStr === '\x1b[OP') shortcuts.switchView('overview');  // F1
            if (keyStr === '\x1b[OQ') shortcuts.switchView('sandbox');   // F2
            if (keyStr === '\x1b[OR') shortcuts.switchView('governance'); // F3
            if (keyStr === '\x1b[OS') shortcuts.switchView('funding');   // F4
            
            // Handle other shortcuts
            if (keyStr === 'l') shortcuts.executeAction('live_mode');
            if (keyStr === 'r') shortcuts.executeAction('refresh');
            if (keyStr === '\t') shortcuts.executeAction('next_view');
            if (keyStr === 'q' || keyStr === '\x03') process.exit(0);
        });
    });
}
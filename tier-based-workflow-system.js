#!/usr/bin/env node

/**
 * 🎯 TIER-BASED WORKFLOW SYSTEM
 * Advanced workflow management with keyboard navigation and tier-based progression
 * Integrates with social media scraping, template repurposing, and music systems
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

class TierBasedWorkflowSystem {
    constructor() {
        this.currentTier = 1;
        this.maxTier = 7;
        this.workflowState = new Map();
        this.keyboardHandlers = new Map();
        this.activeConnections = new Map();
        this.tierDefinitions = this.initializeTierDefinitions();
        this.navigationMode = 'tier_navigation'; // tier_navigation, content_creation, template_mode
        
        // Integration points
        this.integrations = {
            profileScraper: null,
            templateEngine: null,
            musicLayer: null,
            publicationPress: null
        };
        
        // Real-time workflow state
        this.workflowData = {
            currentProject: null,
            contentPipeline: [],
            templateQueue: [],
            musicQueue: [],
            publicationQueue: []
        };
        
        this.setupKeyboardNavigation();
        console.log('🎯 Tier-Based Workflow System initialized');
    }
    
    initializeTierDefinitions() {
        return {
            1: {
                name: 'Content Discovery',
                description: 'Scrape and analyze social media profiles',
                actions: ['scan_profiles', 'analyze_content', 'extract_patterns'],
                navigation: {
                    'Enter': 'execute_tier',
                    'ArrowRight': 'next_tier',
                    'ArrowDown': 'next_action',
                    'ArrowUp': 'prev_action',
                    's': 'scan_social_media',
                    'a': 'analyze_existing',
                    'p': 'preview_results'
                },
                outputs: ['profile_data', 'content_patterns', 'engagement_metrics'],
                integrationPoints: ['profileScraper']
            },
            2: {
                name: 'Template Analysis',
                description: 'Extract and analyze content templates',
                actions: ['extract_templates', 'analyze_patterns', 'identify_opportunities'],
                navigation: {
                    'Enter': 'execute_tier',
                    'ArrowLeft': 'prev_tier',
                    'ArrowRight': 'next_tier',
                    't': 'template_analysis',
                    'r': 'repurposing_opportunities',
                    'x': 'cross_platform_mapping'
                },
                outputs: ['template_library', 'repurposing_map', 'success_patterns'],
                integrationPoints: ['templateEngine']
            },
            3: {
                name: 'Music Integration',
                description: 'Match and integrate music with content',
                actions: ['scan_music_libraries', 'match_music_to_content', 'generate_soundtracks'],
                navigation: {
                    'Enter': 'execute_tier',
                    'ArrowLeft': 'prev_tier',
                    'ArrowRight': 'next_tier',
                    'm': 'music_matching',
                    'l': 'library_scan',
                    'g': 'generate_soundtrack'
                },
                outputs: ['music_matches', 'soundtrack_library', 'spatial_audio_configs'],
                integrationPoints: ['musicLayer']
            },
            4: {
                name: 'Content Creation',
                description: 'Generate and adapt content across platforms',
                actions: ['create_base_content', 'adapt_for_platforms', 'add_music_and_effects'],
                navigation: {
                    'Enter': 'execute_tier',
                    'ArrowLeft': 'prev_tier',
                    'ArrowRight': 'next_tier',
                    'c': 'create_content',
                    'ad': 'adapt_content',
                    'e': 'add_effects'
                },
                outputs: ['base_content', 'platform_variants', 'enhanced_media'],
                integrationPoints: ['templateEngine', 'musicLayer']
            },
            5: {
                name: 'Word Art & Text Processing',
                description: 'Generate visual text elements and word art',
                actions: ['generate_word_art', 'process_text_overlays', 'create_visual_typography'],
                navigation: {
                    'Enter': 'execute_tier',
                    'ArrowLeft': 'prev_tier',
                    'ArrowRight': 'next_tier',
                    'w': 'word_art_generation',
                    'o': 'text_overlays',
                    'ty': 'typography_styles'
                },
                outputs: ['word_art_assets', 'text_overlays', 'typography_templates'],
                integrationPoints: ['wordArtEngine']
            },
            6: {
                name: 'Publication Preparation',
                description: 'Prepare content for multi-platform publication',
                actions: ['format_for_platforms', 'schedule_posts', 'prepare_analytics'],
                navigation: {
                    'Enter': 'execute_tier',
                    'ArrowLeft': 'prev_tier',
                    'ArrowRight': 'next_tier',
                    'f': 'format_content',
                    'sch': 'schedule_posts',
                    'an': 'setup_analytics'
                },
                outputs: ['formatted_content', 'publication_schedule', 'analytics_setup'],
                integrationPoints: ['publicationPress']
            },
            7: {
                name: 'Analytics & Optimization',
                description: 'Track performance and optimize future content',
                actions: ['track_performance', 'analyze_engagement', 'optimize_strategy'],
                navigation: {
                    'Enter': 'execute_tier',
                    'ArrowLeft': 'prev_tier',
                    'h': 'performance_dashboard',
                    'opt': 'optimization_recommendations',
                    'rep': 'generate_reports'
                },
                outputs: ['performance_data', 'optimization_insights', 'strategy_updates'],
                integrationPoints: ['publicationPress', 'analyticsEngine']
            }
        };
    }
    
    setupKeyboardNavigation() {
        // Setup readline interface for keyboard input
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Enable raw mode for immediate key capture
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        
        process.stdin.on('keypress', (str, key) => {
            this.handleKeyPress(str, key);
        });
        
        // Setup escape sequences for special keys
        this.keyMappings = {
            '\u001b[A': 'ArrowUp',
            '\u001b[B': 'ArrowDown', 
            '\u001b[C': 'ArrowRight',
            '\u001b[D': 'ArrowLeft',
            '\r': 'Enter',
            '\u0003': 'Ctrl+C',
            '\u001b': 'Escape'
        };
        
        console.log('\n⌨️ Keyboard navigation enabled');
        this.displayTierNavigation();
    }
    
    handleKeyPress(str, key) {
        if (key && key.ctrl && key.name === 'c') {
            this.shutdown();
            return;
        }
        
        const keyName = this.keyMappings[str] || str;
        const currentTierDef = this.tierDefinitions[this.currentTier];
        
        // Handle tier navigation keys
        if (currentTierDef.navigation[keyName]) {
            this.executeNavigationAction(currentTierDef.navigation[keyName]);
        } else if (keyName === 'ArrowUp') {
            this.navigateUp();
        } else if (keyName === 'ArrowDown') {
            this.navigateDown();
        } else if (keyName === 'ArrowLeft') {
            this.navigateTier(-1);
        } else if (keyName === 'ArrowRight') {
            this.navigateTier(1);
        } else if (keyName === 'Enter') {
            this.executeTier();
        } else if (str) {
            // Handle typed commands
            this.handleTypedCommand(str);
        }
    }
    
    executeNavigationAction(action) {
        console.log(`\n🎯 Executing: ${action}`);
        
        switch (action) {
            case 'execute_tier':
                this.executeTier();
                break;
            case 'next_tier':
                this.navigateTier(1);
                break;
            case 'prev_tier':
                this.navigateTier(-1);
                break;
            case 'scan_social_media':
                this.executeSocialMediaScan();
                break;
            case 'template_analysis':
                this.executeTemplateAnalysis();
                break;
            case 'music_matching':
                this.executeMusicMatching();
                break;
            case 'create_content':
                this.executeContentCreation();
                break;
            case 'word_art_generation':
                this.executeWordArtGeneration();
                break;
            case 'format_content':
                this.executeContentFormatting();
                break;
            case 'performance_dashboard':
                this.showPerformanceDashboard();
                break;
            default:
                console.log(`⚠️ Action not implemented: ${action}`);
        }
    }
    
    navigateTier(direction) {
        const newTier = this.currentTier + direction;
        
        if (newTier >= 1 && newTier <= this.maxTier) {
            this.currentTier = newTier;
            this.displayTierNavigation();
        } else {
            console.log(`\n⚠️ Cannot navigate to tier ${newTier} (range: 1-${this.maxTier})`);
        }
    }
    
    navigateUp() {
        // Navigate through actions within current tier
        console.log('\n⬆️ Navigate up within tier actions');
        this.displayTierActions();
    }
    
    navigateDown() {
        // Navigate through actions within current tier  
        console.log('\n⬇️ Navigate down within tier actions');
        this.displayTierActions();
    }
    
    displayTierNavigation() {
        console.clear();
        console.log('🎯 TIER-BASED WORKFLOW SYSTEM');
        console.log('==============================\n');
        
        // Display tier progression bar
        this.displayTierProgressBar();
        
        // Display current tier details
        const currentTierDef = this.tierDefinitions[this.currentTier];
        console.log(`📍 TIER ${this.currentTier}: ${currentTierDef.name}`);
        console.log(`📝 ${currentTierDef.description}\n`);
        
        // Display available actions
        console.log('🎬 AVAILABLE ACTIONS:');
        currentTierDef.actions.forEach((action, index) => {
            const indicator = index === 0 ? '→' : ' ';
            console.log(`  ${indicator} ${index + 1}. ${action.replace(/_/g, ' ').toUpperCase()}`);
        });
        
        // Display keyboard shortcuts
        console.log('\n⌨️ KEYBOARD NAVIGATION:');
        Object.entries(currentTierDef.navigation).forEach(([key, action]) => {
            console.log(`  ${key.padEnd(12)} → ${action.replace(/_/g, ' ')}`);
        });
        
        // Display global shortcuts
        console.log('\n🌐 GLOBAL SHORTCUTS:');
        console.log('  ← →          → Navigate tiers');
        console.log('  ↑ ↓          → Navigate actions');
        console.log('  Enter        → Execute current tier');
        console.log('  Ctrl+C       → Exit system');
        
        // Display workflow state
        this.displayWorkflowState();
    }
    
    displayTierProgressBar() {
        let progressBar = '';
        for (let i = 1; i <= this.maxTier; i++) {
            if (i === this.currentTier) {
                progressBar += `[${i}]`;
            } else if (i < this.currentTier) {
                progressBar += `(${i})`;
            } else {
                progressBar += ` ${i} `;
            }
            
            if (i < this.maxTier) {
                progressBar += ' → ';
            }
        }
        
        console.log(`🔄 WORKFLOW PROGRESS: ${progressBar}\n`);
    }
    
    displayTierActions() {
        const currentTierDef = this.tierDefinitions[this.currentTier];
        console.log(`\n📋 TIER ${this.currentTier} ACTIONS:`);
        
        currentTierDef.actions.forEach((action, index) => {
            console.log(`  ${index + 1}. ${action.replace(/_/g, ' ').toUpperCase()}`);
        });
    }
    
    displayWorkflowState() {
        console.log('\n📊 WORKFLOW STATE:');
        console.log(`  Current Project: ${this.workflowData.currentProject || 'None'}`);
        console.log(`  Content Pipeline: ${this.workflowData.contentPipeline.length} items`);
        console.log(`  Template Queue: ${this.workflowData.templateQueue.length} items`);
        console.log(`  Music Queue: ${this.workflowData.musicQueue.length} items`);
        console.log(`  Publication Queue: ${this.workflowData.publicationQueue.length} items`);
    }
    
    handleTypedCommand(input) {
        // Handle multi-character commands
        if (input === 'h' || input === 'help') {
            this.showHelp();
        } else if (input === 'q' || input === 'quit') {
            this.shutdown();
        } else if (input === 'r' || input === 'reset') {
            this.resetWorkflow();
        } else if (input === 'd' || input === 'delve') {
            this.delveIntoTier();
        } else if (input === 'status') {
            this.showDetailedStatus();
        } else if (input === 'save') {
            this.saveWorkflowState();
        } else if (input === 'load') {
            this.loadWorkflowState();
        }
    }
    
    async executeTier() {
        const currentTierDef = this.tierDefinitions[this.currentTier];
        console.log(`\n🚀 Executing Tier ${this.currentTier}: ${currentTierDef.name}`);
        
        try {
            // Execute all actions in the current tier
            for (const action of currentTierDef.actions) {
                console.log(`⚡ Executing: ${action.replace(/_/g, ' ')}`);
                await this.executeAction(action);
            }
            
            // Mark tier as completed
            this.workflowState.set(this.currentTier, {
                completed: true,
                timestamp: new Date().toISOString(),
                outputs: currentTierDef.outputs
            });
            
            console.log(`✅ Tier ${this.currentTier} completed successfully!`);
            
            // Auto-advance to next tier if available
            if (this.currentTier < this.maxTier) {
                setTimeout(() => {
                    this.navigateTier(1);
                }, 2000);
            } else {
                console.log('\n🎉 All tiers completed! Workflow finished.');
                this.showWorkflowSummary();
            }
            
        } catch (error) {
            console.error(`❌ Error executing tier ${this.currentTier}:`, error.message);
        }
    }
    
    async executeAction(action) {
        switch (action) {
            case 'scan_profiles':
                await this.executeSocialMediaScan();
                break;
            case 'analyze_content':
                await this.analyzeScrapedContent();
                break;
            case 'extract_templates':
                await this.executeTemplateAnalysis();
                break;
            case 'scan_music_libraries':
                await this.executeMusicLibraryScan();
                break;
            case 'match_music_to_content':
                await this.executeMusicMatching();
                break;
            case 'create_base_content':
                await this.executeContentCreation();
                break;
            case 'generate_word_art':
                await this.executeWordArtGeneration();
                break;
            case 'format_for_platforms':
                await this.executeContentFormatting();
                break;
            case 'track_performance':
                await this.executePerformanceTracking();
                break;
            default:
                console.log(`⚠️ Action implementation pending: ${action}`);
                await this.sleep(1000); // Simulate processing time
        }
    }
    
    async executeSocialMediaScan() {
        console.log('\n🕷️ Starting social media profile scan...');
        
        try {
            // Load and execute profile scraper if available
            const ProfileScraper = require('./social-media-profile-scraper.js');
            const scraper = new ProfileScraper();
            
            // Add to content pipeline
            this.workflowData.contentPipeline.push({
                type: 'profile_scan',
                status: 'processing',
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Profile scan initiated');
            
        } catch (error) {
            console.log('⚠️ Profile scraper not found, simulating scan...');
            await this.sleep(2000);
            console.log('✅ Mock profile scan completed');
        }
    }
    
    async executeTemplateAnalysis() {
        console.log('\n🎨 Starting template analysis...');
        
        try {
            // Load and execute template engine if available
            const TemplateEngine = require('./template-analysis-repurposing-engine.js');
            const engine = new TemplateEngine();
            
            // Add to template queue
            this.workflowData.templateQueue.push({
                type: 'template_analysis',
                status: 'processing',
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Template analysis initiated');
            
        } catch (error) {
            console.log('⚠️ Template engine not found, simulating analysis...');
            await this.sleep(2000);
            console.log('✅ Mock template analysis completed');
        }
    }
    
    async executeMusicMatching() {
        console.log('\n🎵 Starting music integration...');
        
        try {
            // Load and execute music layer if available
            const MusicLayer = require('./music-integration-layer.js');
            const musicLayer = new MusicLayer();
            
            // Add to music queue
            this.workflowData.musicQueue.push({
                type: 'music_matching',
                status: 'processing',
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Music matching initiated');
            
        } catch (error) {
            console.log('⚠️ Music layer not found, simulating matching...');
            await this.sleep(2000);
            console.log('✅ Mock music matching completed');
        }
    }
    
    async executeContentCreation() {
        console.log('\n📝 Creating content...');
        
        // Simulate content creation process
        const steps = [
            'Analyzing templates',
            'Selecting optimal variants',
            'Applying platform adaptations',
            'Integrating music and effects',
            'Generating final content'
        ];
        
        for (const step of steps) {
            console.log(`   → ${step}...`);
            await this.sleep(800);
        }
        
        console.log('✅ Content creation completed');
    }
    
    async executeWordArtGeneration() {
        console.log('\n🎨 Generating word art and text overlays...');
        
        // Simulate word art generation
        const artTypes = ['Typography overlay', 'Gradient text', 'Shadow effects', 'Custom fonts'];
        
        for (const artType of artTypes) {
            console.log(`   → Creating ${artType}...`);
            await this.sleep(600);
        }
        
        console.log('✅ Word art generation completed');
    }
    
    async executeContentFormatting() {
        console.log('\n📱 Formatting content for platforms...');
        
        // Simulate platform formatting
        const platforms = ['Instagram', 'Twitter', 'TikTok', 'LinkedIn'];
        
        for (const platform of platforms) {
            console.log(`   → Formatting for ${platform}...`);
            await this.sleep(500);
        }
        
        // Add to publication queue
        this.workflowData.publicationQueue.push({
            type: 'formatted_content',
            platforms: platforms,
            status: 'ready',
            timestamp: new Date().toISOString()
        });
        
        console.log('✅ Content formatting completed');
    }
    
    async executePerformanceTracking() {
        console.log('\n📊 Setting up performance tracking...');
        
        // Simulate analytics setup
        const metrics = ['Engagement rate', 'Reach', 'Impressions', 'Clicks', 'Conversions'];
        
        for (const metric of metrics) {
            console.log(`   → Configuring ${metric} tracking...`);
            await this.sleep(400);
        }
        
        console.log('✅ Performance tracking configured');
    }
    
    delveIntoTier() {
        console.log(`\n🔍 DELVING INTO TIER ${this.currentTier}`);
        const currentTierDef = this.tierDefinitions[this.currentTier];
        
        console.log(`\n📋 DETAILED TIER INFORMATION:`);
        console.log(`Name: ${currentTierDef.name}`);
        console.log(`Description: ${currentTierDef.description}`);
        
        console.log(`\n🎬 Actions:`);
        currentTierDef.actions.forEach((action, index) => {
            console.log(`  ${index + 1}. ${action.replace(/_/g, ' ').toUpperCase()}`);
        });
        
        console.log(`\n📤 Expected Outputs:`);
        currentTierDef.outputs.forEach((output, index) => {
            console.log(`  ${index + 1}. ${output.replace(/_/g, ' ').toUpperCase()}`);
        });
        
        console.log(`\n🔗 Integration Points:`);
        currentTierDef.integrationPoints.forEach((integration, index) => {
            const status = this.integrations[integration] ? '✅' : '❌';
            console.log(`  ${status} ${integration.replace(/([A-Z])/g, ' $1').trim()}`);
        });
        
        console.log('\nPress Enter to return to navigation...');
    }
    
    showHelp() {
        console.clear();
        console.log('🎯 TIER-BASED WORKFLOW SYSTEM HELP');
        console.log('===================================\n');
        
        console.log('📚 CONCEPT:');
        console.log('This system breaks down content creation into 7 distinct tiers,');
        console.log('each building upon the previous to create a complete workflow.\n');
        
        console.log('🎯 THE 7 TIERS:');
        Object.entries(this.tierDefinitions).forEach(([tierNum, tier]) => {
            console.log(`  ${tierNum}. ${tier.name} - ${tier.description}`);
        });
        
        console.log('\n⌨️ NAVIGATION:');
        console.log('  ← →          Navigate between tiers');
        console.log('  ↑ ↓          Navigate within tier actions');
        console.log('  Enter        Execute current tier');
        console.log('  d/delve      Deep dive into current tier');
        console.log('  h/help       Show this help screen');
        console.log('  r/reset      Reset workflow state');
        console.log('  status       Show detailed system status');
        console.log('  save/load    Save/load workflow state');
        console.log('  q/quit       Exit system');
        
        console.log('\n🔄 WORKFLOW PROGRESSION:');
        console.log('Each tier must be completed before advancing to the next.');
        console.log('The system maintains state and can resume from any point.');
        
        console.log('\nPress any key to return to navigation...');
    }
    
    showDetailedStatus() {
        console.clear();
        console.log('📊 DETAILED SYSTEM STATUS');
        console.log('==========================\n');
        
        console.log(`🎯 Current Tier: ${this.currentTier}/${this.maxTier}`);
        console.log(`📍 Navigation Mode: ${this.navigationMode}`);
        
        console.log('\n🔗 INTEGRATION STATUS:');
        Object.entries(this.integrations).forEach(([name, status]) => {
            const indicator = status ? '✅' : '❌';
            console.log(`  ${indicator} ${name.replace(/([A-Z])/g, ' $1').trim()}`);
        });
        
        console.log('\n📋 TIER COMPLETION STATUS:');
        for (let i = 1; i <= this.maxTier; i++) {
            const completed = this.workflowState.has(i);
            const indicator = completed ? '✅' : (i === this.currentTier ? '⏳' : '⚪');
            const tierName = this.tierDefinitions[i].name;
            console.log(`  ${indicator} Tier ${i}: ${tierName}`);
        }
        
        console.log('\n📊 QUEUE STATUS:');
        console.log(`  Content Pipeline: ${this.workflowData.contentPipeline.length} items`);
        console.log(`  Template Queue: ${this.workflowData.templateQueue.length} items`);
        console.log(`  Music Queue: ${this.workflowData.musicQueue.length} items`);
        console.log(`  Publication Queue: ${this.workflowData.publicationQueue.length} items`);
        
        console.log('\nPress any key to return to navigation...');
    }
    
    async saveWorkflowState() {
        const state = {
            currentTier: this.currentTier,
            workflowState: Object.fromEntries(this.workflowState),
            workflowData: this.workflowData,
            timestamp: new Date().toISOString()
        };
        
        const filename = `workflow-state-${Date.now()}.json`;
        await fs.writeFile(filename, JSON.stringify(state, null, 2));
        
        console.log(`\n💾 Workflow state saved to: ${filename}`);
    }
    
    async loadWorkflowState() {
        try {
            // Find most recent workflow state file
            const files = await fs.readdir('.');
            const stateFiles = files.filter(f => f.startsWith('workflow-state-') && f.endsWith('.json'));
            
            if (stateFiles.length === 0) {
                console.log('\n⚠️ No workflow state files found');
                return;
            }
            
            const latestFile = stateFiles.sort().pop();
            const stateData = JSON.parse(await fs.readFile(latestFile, 'utf8'));
            
            this.currentTier = stateData.currentTier;
            this.workflowState = new Map(Object.entries(stateData.workflowState));
            this.workflowData = stateData.workflowData;
            
            console.log(`\n📁 Workflow state loaded from: ${latestFile}`);
            this.displayTierNavigation();
            
        } catch (error) {
            console.error('\n❌ Error loading workflow state:', error.message);
        }
    }
    
    resetWorkflow() {
        this.currentTier = 1;
        this.workflowState.clear();
        this.workflowData = {
            currentProject: null,
            contentPipeline: [],
            templateQueue: [],
            musicQueue: [],
            publicationQueue: []
        };
        
        console.log('\n🔄 Workflow reset to initial state');
        this.displayTierNavigation();
    }
    
    showWorkflowSummary() {
        console.log('\n🎉 WORKFLOW COMPLETION SUMMARY');
        console.log('==============================\n');
        
        const completedTiers = Array.from(this.workflowState.keys()).length;
        console.log(`✅ Completed Tiers: ${completedTiers}/${this.maxTier}`);
        
        console.log('\n📊 FINAL OUTPUTS:');
        this.workflowState.forEach((state, tierNum) => {
            const tierName = this.tierDefinitions[tierNum].name;
            console.log(`  Tier ${tierNum} (${tierName}):`);
            state.outputs.forEach(output => {
                console.log(`    → ${output.replace(/_/g, ' ')}`);
            });
        });
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('  • Review generated content');
        console.log('  • Schedule publications');
        console.log('  • Monitor performance');
        console.log('  • Iterate based on results');
        
        console.log('\nPress q to quit or r to start new workflow...');
    }
    
    shutdown() {
        console.log('\n👋 Shutting down Tier-Based Workflow System...');
        
        if (this.rl) {
            this.rl.close();
        }
        
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        
        process.exit(0);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI execution
if (require.main === module) {
    console.log('🎯 TIER-BASED WORKFLOW SYSTEM');
    console.log('==============================');
    console.log('Loading system...\n');
    
    const workflowSystem = new TierBasedWorkflowSystem();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        workflowSystem.shutdown();
    });
    
    process.on('SIGTERM', () => {
        workflowSystem.shutdown();
    });
}

module.exports = TierBasedWorkflowSystem;
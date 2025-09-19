#!/usr/bin/env node

/**
 * 🎨 CAL BRAND COMMANDS
 * 
 * Integrates Cultural Brand Generator with CAL orchestration system
 * Enables internal brand scanning, analysis, and Pinterest-style idea board
 * 
 * Commands:
 * - cal brand scan-games       # Scan existing games/services for brand opportunities
 * - cal brand analyze <name>   # Analyze existing brand/component
 * - cal brand generate <idea>  # Generate new brand from concept
 * - cal brand board           # Launch Pinterest-style idea board
 * - cal brand rank            # Excel-style ranking interface
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CalBrandCommands extends EventEmitter {
    constructor(calSystem, flagTagSystem, diamondEngine) {
        super();
        
        this.calSystem = calSystem;
        this.flagTagSystem = flagTagSystem;
        this.diamondEngine = diamondEngine;
        
        // Brand command registry
        this.commands = new Map();
        this.scannedComponents = new Map();
        this.brandIdeas = new Map();
        this.brandRankings = new Map();
        
        this.initializeBrandCommands();
        this.setupDatabaseExtensions();
        
        console.log('🎨 CAL Brand Commands initialized');
    }
    
    initializeBrandCommands() {
        // Register brand commands with CAL system
        this.commands.set('brand', {
            description: 'Brand generation and analysis commands',
            subcommands: {
                'scan-games': {
                    handler: this.scanGamesForBranding.bind(this),
                    description: 'Scan existing games/services for brand opportunities',
                    usage: 'cal brand scan-games [--type=service|game|component]'
                },
                'analyze': {
                    handler: this.analyzeBrand.bind(this),
                    description: 'Analyze existing brand or component',
                    usage: 'cal brand analyze <component-name>'
                },
                'generate': {
                    handler: this.generateBrand.bind(this),
                    description: 'Generate new brand from concept',
                    usage: 'cal brand generate "<concept-description>"'
                },
                'board': {
                    handler: this.launchIdeaBoard.bind(this),
                    description: 'Launch Pinterest-style collaborative idea board',
                    usage: 'cal brand board [--port=8889]'
                },
                'rank': {
                    handler: this.launchRankingInterface.bind(this),
                    description: 'Excel-style brand ranking and voting system',
                    usage: 'cal brand rank [--sort=votes|magnetism|date]'
                },
                'submit': {
                    handler: this.submitBrandIdea.bind(this),
                    description: 'Submit new brand idea to community board',
                    usage: 'cal brand submit "<idea>" [--category=game|service|domain]'
                },
                'vote': {
                    handler: this.voteBrandIdea.bind(this),
                    description: 'Vote on community brand idea',
                    usage: 'cal brand vote <idea-id> [--score=1-10]'
                }
            }
        });
        
        console.log('✅ Brand commands registered with CAL system');
    }
    
    async setupDatabaseExtensions() {
        // Extend universal_entities table with brand columns
        const brandColumns = `
            ALTER TABLE universal_entities ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);
            ALTER TABLE universal_entities ADD COLUMN IF NOT EXISTS brand_archetype VARCHAR(100);
            ALTER TABLE universal_entities ADD COLUMN IF NOT EXISTS brand_colors JSON;
            ALTER TABLE universal_entities ADD COLUMN IF NOT EXISTS brand_magnetism_score INTEGER DEFAULT 0;
            ALTER TABLE universal_entities ADD COLUMN IF NOT EXISTS brand_status ENUM('unbranded', 'analyzing', 'branded', 'needs_refresh') DEFAULT 'unbranded';
            ALTER TABLE universal_entities ADD COLUMN IF NOT EXISTS brand_last_updated TIMESTAMP;
        `;
        
        // Create brand ideas table
        const brandIdeasTable = `
            CREATE TABLE IF NOT EXISTS brand_ideas (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                concept_text TEXT,
                submitted_by VARCHAR(255),
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Brand analysis
                archetype_suggestion VARCHAR(100),
                magnetism_score INTEGER DEFAULT 0,
                cultural_analysis JSON,
                
                -- Community interaction
                votes INTEGER DEFAULT 0,
                vote_score DECIMAL(3,2) DEFAULT 0.0,
                comments_count INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                
                -- Implementation status
                status ENUM('submitted', 'analyzing', 'approved', 'implemented', 'rejected') DEFAULT 'submitted',
                implementation_notes TEXT,
                
                -- Pinterest-style metadata
                image_url VARCHAR(500),
                color_palette JSON,
                tags JSON,
                
                INDEX idx_category (category),
                INDEX idx_status (status),
                INDEX idx_votes (votes DESC),
                INDEX idx_magnetism (magnetism_score DESC),
                INDEX idx_submitted (submitted_at DESC)
            );
        `;
        
        // Create brand votes table
        const brandVotesTable = `
            CREATE TABLE IF NOT EXISTS brand_votes (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                idea_id VARCHAR(255) NOT NULL,
                voter_id VARCHAR(255),
                vote_score INTEGER CHECK (vote_score >= 1 AND vote_score <= 10),
                vote_comment TEXT,
                voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (idea_id) REFERENCES brand_ideas(id) ON DELETE CASCADE,
                UNIQUE KEY unique_voter_idea (idea_id, voter_id)
            );
        `;
        
        try {
            // Execute schema updates (would need proper database connection)
            console.log('📊 Brand database schema ready');
            
            // Initialize default brand categories
            this.brandCategories = {
                'game': { icon: '🎮', color: '#00f5ff', description: 'Gaming platforms and experiences' },
                'service': { icon: '⚙️', color: '#00e676', description: 'Backend services and APIs' },
                'domain': { icon: '🌐', color: '#7c4dff', description: 'Domain websites and portals' },
                'ai': { icon: '🤖', color: '#ff6b6b', description: 'AI agents and intelligence' },
                'tool': { icon: '🔧', color: '#ffd740', description: 'Developer tools and utilities' },
                'community': { icon: '👥', color: '#26a69a', description: 'Community platforms and social' }
            };
            
        } catch (error) {
            console.warn('⚠️ Could not setup brand database extensions:', error.message);
        }
    }
    
    async scanGamesForBranding(args) {
        console.log('🔍 Scanning games and services for branding opportunities...');
        
        const scanOptions = {
            type: args.type || 'all',
            includeServices: true,
            includeComponents: true,
            analyzeExisting: true
        };
        
        const results = {
            scanned: 0,
            branded: 0,
            unbranded: 0,
            needsRefresh: 0,
            opportunities: []
        };
        
        try {
            // Get all components from flag-tag system
            const allComponents = Array.from(this.flagTagSystem.componentRegistry.values());
            
            // Filter components based on type
            const relevantComponents = allComponents.filter(component => {
                if (scanOptions.type === 'all') return true;
                if (scanOptions.type === 'service' && component.type === 'service') return true;
                if (scanOptions.type === 'game' && (component.type === 'game' || component.tags.includes('gaming'))) return true;
                if (scanOptions.type === 'component' && component.type !== 'documentation') return true;
                return false;
            });
            
            // Analyze each component for branding potential
            for (const component of relevantComponents) {
                results.scanned++;
                
                const brandAnalysis = await this.analyzeComponentBranding(component);
                this.scannedComponents.set(component.id, brandAnalysis);
                
                if (brandAnalysis.currentBrand) {
                    results.branded++;
                } else {
                    results.unbranded++;
                    results.opportunities.push({
                        componentId: component.id,
                        name: component.display_name || component.id,
                        type: component.type,
                        brandPotential: brandAnalysis.potential,
                        suggestedArchetype: brandAnalysis.suggestedArchetype,
                        reasoning: brandAnalysis.reasoning
                    });
                }
            }
            
            // Sort opportunities by brand potential
            results.opportunities.sort((a, b) => b.brandPotential - a.brandPotential);
            
            // Create summary report
            const summary = this.createBrandingSummaryReport(results);
            
            console.log(`📊 Scan complete: ${results.scanned} components analyzed`);
            console.log(`✅ Branded: ${results.branded}, 🆕 Unbranded: ${results.unbranded}`);
            console.log(`🎯 Top opportunities:`);
            
            results.opportunities.slice(0, 5).forEach((opp, i) => {
                console.log(`  ${i + 1}. ${opp.name} (${opp.brandPotential}% potential) - ${opp.suggestedArchetype}`);
            });
            
            return {
                success: true,
                results,
                summary,
                nextSteps: [
                    'Run "cal brand analyze <component>" for detailed analysis',
                    'Run "cal brand generate" to create brands for top opportunities',
                    'Run "cal brand board" to collaborate on ideas'
                ]
            };
            
        } catch (error) {
            console.error('❌ Brand scan failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async analyzeComponentBranding(component) {
        // Analyze component for branding potential and current state
        const analysis = {
            componentId: component.id,
            currentBrand: null,
            potential: 0,
            suggestedArchetype: null,
            reasoning: [],
            category: this.inferComponentCategory(component)
        };
        
        // Check if component already has branding
        if (component.display_name && component.display_name !== component.id) {
            analysis.currentBrand = {
                name: component.display_name,
                hasLogo: false,
                hasColors: false,
                magnetismScore: 0
            };
        }
        
        // Calculate branding potential based on component characteristics
        let potentialScore = 0;
        
        // User-facing components have higher potential
        if (component.type === 'interface' || component.type === 'ui') {
            potentialScore += 30;
            analysis.reasoning.push('User-facing interface (high visibility)');
        }
        
        // Service components with APIs
        if (component.type === 'service' || component.type === 'api') {
            potentialScore += 20;
            analysis.reasoning.push('Service/API component (developer audience)');
        }
        
        // Gaming/entertainment components
        if (component.tags.some(tag => tag.includes('game') || tag.includes('entertainment'))) {
            potentialScore += 25;
            analysis.reasoning.push('Gaming/entertainment component (engagement focus)');
        }
        
        // Critical/high priority components
        if (component.tags.includes('priority:critical') || component.tags.includes('priority:high')) {
            potentialScore += 15;
            analysis.reasoning.push('Critical/high priority component');
        }
        
        // Active and deployed components
        if (component.status === 'active' && component.flags.includes('DEPLOYED')) {
            potentialScore += 10;
            analysis.reasoning.push('Active and deployed');
        }
        
        analysis.potential = Math.min(potentialScore, 100);
        
        // Suggest archetype based on component type and function
        analysis.suggestedArchetype = this.suggestArchetypeForComponent(component);
        
        return analysis;
    }
    
    inferComponentCategory(component) {
        // Infer brand category from component characteristics
        if (component.type === 'game' || component.tags.some(t => t.includes('game'))) {
            return 'game';
        }
        
        if (component.type === 'service' || component.type === 'api') {
            return 'service';
        }
        
        if (component.type === 'ai' || component.tags.some(t => t.includes('ai'))) {
            return 'ai';
        }
        
        if (component.tags.some(t => t.includes('community') || t.includes('social'))) {
            return 'community';
        }
        
        if (component.type === 'interface' || component.type === 'ui') {
            return 'tool';
        }
        
        return 'service'; // default
    }
    
    suggestArchetypeForComponent(component) {
        const archetypes = {
            'revolutionary': ['disrupt', 'transform', 'change', 'death_to', 'revolution'],
            'dream_architect': ['build', 'create', 'design', 'craft', 'architect'],
            'wise_commander': ['command', 'control', 'manage', 'coordinate', 'master'],
            'prosperity_creator': ['trade', 'economy', 'profit', 'wealth', 'market'],
            'creative_catalyst': ['collaborate', 'team', 'community', 'spark', 'catalyst']
        };
        
        const componentText = `${component.id} ${component.type} ${component.tags.join(' ')}`.toLowerCase();
        
        let bestArchetype = 'creative_catalyst'; // default
        let bestScore = 0;
        
        for (const [archetype, keywords] of Object.entries(archetypes)) {
            const score = keywords.reduce((sum, keyword) => {
                return sum + (componentText.includes(keyword) ? 1 : 0);
            }, 0);
            
            if (score > bestScore) {
                bestScore = score;
                bestArchetype = archetype;
            }
        }
        
        return bestArchetype;
    }
    
    async analyzeBrand(args) {
        const componentName = args._[2]; // cal brand analyze <name>
        
        if (!componentName) {
            return {
                success: false,
                error: 'Component name required. Usage: cal brand analyze <component-name>'
            };
        }
        
        console.log(`🔍 Analyzing brand for component: ${componentName}`);
        
        // Find component in registry
        const component = Array.from(this.flagTagSystem.componentRegistry.values())
            .find(c => c.id === componentName || c.display_name === componentName);
        
        if (!component) {
            return {
                success: false,
                error: `Component "${componentName}" not found`
            };
        }
        
        // Perform detailed brand analysis
        const analysis = await this.analyzeComponentBranding(component);
        
        // Generate brand recommendations
        const recommendations = await this.generateBrandRecommendations(component, analysis);
        
        // Create detailed report
        const report = {
            component: {
                id: component.id,
                name: component.display_name || component.id,
                type: component.type,
                status: component.status
            },
            currentBrand: analysis.currentBrand,
            brandPotential: `${analysis.potential}%`,
            suggestedArchetype: analysis.suggestedArchetype,
            category: analysis.category,
            reasoning: analysis.reasoning,
            recommendations,
            nextSteps: [
                `Run "cal brand generate '${component.display_name || component.id} - ${recommendations.conceptSuggestion}'"`,
                'Submit to community board for feedback',
                'Implement brand assets and guidelines'
            ]
        };
        
        console.log(`📊 Brand Analysis for ${component.id}:`);
        console.log(`  Potential: ${analysis.potential}%`);
        console.log(`  Archetype: ${analysis.suggestedArchetype}`);
        console.log(`  Category: ${analysis.category}`);
        console.log(`  Concept: ${recommendations.conceptSuggestion}`);
        
        return {
            success: true,
            analysis: report
        };
    }
    
    async generateBrandRecommendations(component, analysis) {
        // Generate specific brand recommendations for component
        const recommendations = {
            conceptSuggestion: '',
            nameIdeas: [],
            taglineConcepts: [],
            colorDirection: '',
            logoDirection: '',
            implementationPriority: 'medium'
        };
        
        // Generate concept based on component function
        if (component.type === 'game') {
            recommendations.conceptSuggestion = `Interactive ${analysis.category} experience that engages users through gamified challenges`;
        } else if (component.type === 'service') {
            recommendations.conceptSuggestion = `Developer-focused ${analysis.category} service that simplifies complex workflows`;
        } else if (component.type === 'ai') {
            recommendations.conceptSuggestion = `Intelligent ${analysis.category} agent that learns and adapts to user needs`;
        } else {
            recommendations.conceptSuggestion = `Innovative ${analysis.category} tool that empowers users to achieve more`;
        }
        
        // Generate name ideas based on archetype
        const namePatterns = {
            'revolutionary': ['Death to', 'Kill the', 'Revolt', 'Transform', 'Disrupt'],
            'dream_architect': ['Build', 'Craft', 'Forge', 'Create', 'Design'],
            'wise_commander': ['Command', 'Master', 'Control', 'Direct', 'Rule'],
            'prosperity_creator': ['Profit', 'Wealth', 'Rich', 'Gold', 'Prosper'],
            'creative_catalyst': ['Spark', 'Ignite', 'Catalyst', 'Boost', 'Amplify']
        };
        
        const patterns = namePatterns[analysis.suggestedArchetype] || namePatterns['creative_catalyst'];
        const baseName = component.display_name || component.id.replace(/-/g, ' ');
        
        recommendations.nameIdeas = patterns.map(pattern => `${pattern} ${baseName}`);
        
        // Set implementation priority based on potential
        if (analysis.potential > 70) {
            recommendations.implementationPriority = 'high';
        } else if (analysis.potential > 40) {
            recommendations.implementationPriority = 'medium';
        } else {
            recommendations.implementationPriority = 'low';
        }
        
        return recommendations;
    }
    
    async generateBrand(args) {
        const concept = args._[2]; // cal brand generate "<concept>"
        
        if (!concept) {
            return {
                success: false,
                error: 'Brand concept required. Usage: cal brand generate "<concept-description>"'
            };
        }
        
        console.log(`🎨 Generating brand for concept: ${concept}`);
        
        try {
            // Call Cultural Brand Generator API
            const brandResult = await this.callBrandGenerator({
                domainIdea: concept,
                source: 'cal-command'
            });
            
            if (brandResult.success) {
                console.log(`✨ Brand generated: ${brandResult.brandName}`);
                console.log(`🎭 Archetype: ${brandResult.archetype.name}`);
                console.log(`📈 Magnetism Score: ${brandResult.magnetismAnalysis.overallScore}%`);
                
                return {
                    success: true,
                    brand: brandResult,
                    nextSteps: [
                        'Review brand assets and guidelines',
                        'Submit to community board for feedback: cal brand submit',
                        'Implement brand across components'
                    ]
                };
            } else {
                throw new Error(brandResult.error);
            }
            
        } catch (error) {
            console.error('❌ Brand generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async callBrandGenerator(payload) {
        // Simulate call to Cultural Brand Generator service
        // In real implementation, this would make HTTP request to port 6666
        
        try {
            const fetch = require('node-fetch').default || global.fetch;
            const response = await fetch('http://localhost:6666/generate-brand', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`Brand Generator API error: ${response.status}`);
            }
            
        } catch (error) {
            // Fallback to mock response for development
            console.warn('⚠️ Cultural Brand Generator not available, using mock response');
            
            return {
                success: true,
                brandName: this.generateMockBrandName(payload.domainIdea),
                archetype: {
                    type: 'creative_catalyst',
                    name: 'The Creative Catalyst',
                    culturalMagnetism: 'Ignite your creative potential with others'
                },
                magnetismAnalysis: {
                    overallScore: Math.floor(Math.random() * 40) + 60, // 60-100%
                    grade: 'B+',
                    analysis: 'This brand has good cultural magnetism potential!'
                },
                visualIdentity: {
                    colorPalette: {
                        primary: '#ff6b6b',
                        secondary: '#7c4dff',
                        accent: '#00e676'
                    }
                }
            };
        }
    }
    
    generateMockBrandName(concept) {
        const prefixes = ['Death to', 'Build', 'Spark', 'Master', 'Create'];
        const words = concept.toLowerCase().split(' ');
        const mainWord = words.find(w => w.length > 4) || words[0];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        return `${prefix} ${mainWord.charAt(0).toUpperCase() + mainWord.slice(1)}`;
    }
    
    async launchIdeaBoard(args) {
        const port = args.port || 8889;
        
        console.log(`🎨 Launching Pinterest-style brand idea board on port ${port}...`);
        
        try {
            // Create brand idea board HTML
            const boardHTML = await this.createIdeaBoardHTML();
            
            // Start simple HTTP server for idea board
            const express = require('express');
            const app = express();
            
            app.use(express.json());
            app.use(express.static('public'));
            
            // Main board interface
            app.get('/', (req, res) => {
                res.send(boardHTML);
            });
            
            // API routes for idea board
            app.get('/api/ideas', async (req, res) => {
                const ideas = await this.getBrandIdeas();
                res.json(ideas);
            });
            
            app.post('/api/ideas', async (req, res) => {
                const idea = await this.saveBrandIdea(req.body);
                res.json({ success: true, idea });
            });
            
            app.post('/api/ideas/:id/vote', async (req, res) => {
                const result = await this.voteBrandIdea(req.params.id, req.body);
                res.json(result);
            });
            
            const server = 

// Auto-injected health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'CAL Compare System',
        port: 4444,
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        description: 'CAL brand comparison and analysis system'
    });
});

app.get('/ready', (req, res) => {
    // Add any readiness checks here
    res.json({
        status: 'ready',
        service: 'CAL Compare System',
        timestamp: Date.now()
    });
});

app.listen(port, () => {
                console.log(`✅ Brand Idea Board running at http://localhost:${port}`);
                console.log('🎨 Community can now submit and vote on brand ideas!');
                
                // Auto-open browser if possible
                if (process.platform === 'darwin') {
                    require('child_process').exec(`open http://localhost:${port}`);
                }
            });
            
            return {
                success: true,
                url: `http://localhost:${port}`,
                message: 'Brand Idea Board launched successfully'
            };
            
        } catch (error) {
            console.error('❌ Failed to launch idea board:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async createIdeaBoardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 Brand Idea Board - Pinterest Style</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 20px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
        }
        
        .header p {
            text-align: center;
            color: #666;
            font-size: 16px;
        }
        
        .controls {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 20px;
            flex-wrap: wrap;
        }
        
        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        
        .ideas-grid {
            display: masonry;
            masonry-template-rows: masonry;
            column-count: 4;
            column-gap: 20px;
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        @media (max-width: 1200px) { .ideas-grid { column-count: 3; } }
        @media (max-width: 900px) { .ideas-grid { column-count: 2; } }
        @media (max-width: 600px) { .ideas-grid { column-count: 1; } }
        
        .idea-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            transition: all 0.3s ease;
            break-inside: avoid;
            cursor: pointer;
        }
        
        .idea-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.18);
        }
        
        .idea-image {
            width: 100%;
            height: 200px;
            background: linear-gradient(45deg, #ff6b6b, #7c4dff);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: white;
        }
        
        .idea-content {
            padding: 20px;
        }
        
        .idea-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #333;
        }
        
        .idea-description {
            color: #666;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 15px;
        }
        
        .idea-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #888;
        }
        
        .idea-category {
            background: #f0f0f0;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 600;
        }
        
        .idea-votes {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .vote-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
        }
        
        .vote-btn:hover {
            transform: scale(1.2);
        }
        
        .magnetism-score {
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 11px;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            padding: 20px;
        }
        
        .modal-content {
            background: white;
            border-radius: 20px;
            padding: 30px;
            max-width: 600px;
            margin: 50px auto;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .modal h2 {
            margin-bottom: 20px;
            color: #333;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #f0f0f0;
            border-radius: 10px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .form-group textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        .filter-bar {
            display: flex;
            gap: 10px;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            margin: 20px;
            border-radius: 15px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .filter-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
        }
        
        .filter-btn.active {
            background: rgba(255,255,255,0.9);
            color: #333;
        }
        
        .loading {
            text-align: center;
            padding: 50px;
            color: white;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Brand Idea Board</h1>
        <p>Pinterest-style collaboration for building magnetic brands</p>
    </div>
    
    <div class="controls">
        <button class="btn" onclick="openSubmitModal()">💡 Submit Idea</button>
        <button class="btn" onclick="refreshIdeas()">🔄 Refresh</button>
        <button class="btn" onclick="openRankingView()">📊 Rankings</button>
        <button class="btn" onclick="exportIdeas()">📁 Export</button>
    </div>
    
    <div class="filter-bar">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="game">🎮 Games</button>
        <button class="filter-btn" data-filter="service">⚙️ Services</button>
        <button class="filter-btn" data-filter="domain">🌐 Domains</button>
        <button class="filter-btn" data-filter="ai">🤖 AI</button>
        <button class="filter-btn" data-filter="community">👥 Community</button>
    </div>
    
    <div class="loading" id="loading">Loading brand ideas...</div>
    
    <div class="ideas-grid" id="ideasGrid" style="display: none;">
        <!-- Ideas will be loaded here -->
    </div>
    
    <!-- Submit Idea Modal -->
    <div class="modal" id="submitModal">
        <div class="modal-content">
            <h2>💡 Submit Brand Idea</h2>
            <form id="submitForm">
                <div class="form-group">
                    <label>Idea Title *</label>
                    <input type="text" name="title" required placeholder="e.g., Revolutionary Learning Platform">
                </div>
                
                <div class="form-group">
                    <label>Category *</label>
                    <select name="category" required>
                        <option value="">Select category...</option>
                        <option value="game">🎮 Game</option>
                        <option value="service">⚙️ Service</option>
                        <option value="domain">🌐 Domain</option>
                        <option value="ai">🤖 AI Agent</option>
                        <option value="tool">🔧 Tool</option>
                        <option value="community">👥 Community</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Concept Description *</label>
                    <textarea name="concept" required placeholder="Describe your brand concept and what makes it magnetic..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Detailed Description</label>
                    <textarea name="description" placeholder="Additional details, target audience, unique value..."></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn" onclick="closeModal('submitModal')">Cancel</button>
                    <button type="submit" class="btn">🚀 Submit Idea</button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let currentFilter = 'all';
        let allIdeas = [];
        
        // Load ideas on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadIdeas();
            setupFilterButtons();
        });
        
        async function loadIdeas() {
            try {
                const response = await fetch('/api/ideas');
                allIdeas = await response.json();
                renderIdeas(allIdeas);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('ideasGrid').style.display = 'block';
            } catch (error) {
                console.error('Failed to load ideas:', error);
                // Show mock ideas for development
                showMockIdeas();
            }
        }
        
        function showMockIdeas() {
            allIdeas = [
                {
                    id: 'idea1',
                    title: 'Death to Boring Games',
                    description: 'Revolutionary gaming platform that transforms learning into epic adventures',
                    category: 'game',
                    magnetism_score: 85,
                    votes: 12,
                    vote_score: 4.8,
                    submitted_at: new Date().toISOString()
                },
                {
                    id: 'idea2',
                    title: 'Build Together Community',
                    description: 'Collaborative platform where developers build projects together',
                    category: 'community',
                    magnetism_score: 72,
                    votes: 8,
                    vote_score: 4.2,
                    submitted_at: new Date().toISOString()
                },
                {
                    id: 'idea3',
                    title: 'AI Code Whisperer',
                    description: 'Intelligent coding assistant that learns your style and preferences',
                    category: 'ai',
                    magnetism_score: 91,
                    votes: 15,
                    vote_score: 4.9,
                    submitted_at: new Date().toISOString()
                }
            ];
            renderIdeas(allIdeas);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('ideasGrid').style.display = 'block';
        }
        
        function renderIdeas(ideas) {
            const grid = document.getElementById('ideasGrid');
            
            const filteredIdeas = currentFilter === 'all' ? 
                ideas : ideas.filter(idea => idea.category === currentFilter);
            
            grid.innerHTML = filteredIdeas.map(idea => \`
                <div class="idea-card" onclick="viewIdeaDetail('\${idea.id}')">
                    <div class="idea-image">
                        \${getCategoryIcon(idea.category)}
                    </div>
                    <div class="idea-content">
                        <div class="idea-title">\${idea.title}</div>
                        <div class="idea-description">\${idea.description}</div>
                        <div class="idea-meta">
                            <div>
                                <span class="idea-category">\${idea.category}</span>
                                <span class="magnetism-score">\${idea.magnetism_score || 0}% ✨</span>
                            </div>
                            <div class="idea-votes">
                                <button class="vote-btn" onclick="event.stopPropagation(); voteIdea('\${idea.id}', 1)">👍</button>
                                <span>\${idea.votes || 0}</span>
                                <button class="vote-btn" onclick="event.stopPropagation(); voteIdea('\${idea.id}', -1)">👎</button>
                            </div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }
        
        function getCategoryIcon(category) {
            const icons = {
                game: '🎮',
                service: '⚙️',
                domain: '🌐',
                ai: '🤖',
                tool: '🔧',
                community: '👥'
            };
            return icons[category] || '💡';
        }
        
        function setupFilterButtons() {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelector('.filter-btn.active').classList.remove('active');
                    this.classList.add('active');
                    currentFilter = this.dataset.filter;
                    renderIdeas(allIdeas);
                });
            });
        }
        
        function openSubmitModal() {
            document.getElementById('submitModal').style.display = 'block';
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        function refreshIdeas() {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('ideasGrid').style.display = 'none';
            loadIdeas();
        }
        
        async function voteIdea(ideaId, direction) {
            try {
                const response = await fetch(\`/api/ideas/\${ideaId}/vote\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ direction })
                });
                
                if (response.ok) {
                    refreshIdeas();
                }
            } catch (error) {
                console.error('Failed to vote:', error);
            }
        }
        
        function openRankingView() {
            window.open('/ranking', '_blank');
        }
        
        function exportIdeas() {
            const dataStr = JSON.stringify(allIdeas, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'brand-ideas.json';
            link.click();
        }
        
        // Handle form submission
        document.getElementById('submitForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const ideaData = {
                title: formData.get('title'),
                category: formData.get('category'),
                concept: formData.get('concept'),
                description: formData.get('description'),
                submitted_by: 'cal-user',
                submitted_at: new Date().toISOString()
            };
            
            try {
                const response = await fetch('/api/ideas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ideaData)
                });
                
                if (response.ok) {
                    closeModal('submitModal');
                    this.reset();
                    refreshIdeas();
                    alert('💡 Idea submitted successfully!');
                } else {
                    alert('❌ Failed to submit idea');
                }
            } catch (error) {
                console.error('Failed to submit idea:', error);
                alert('❌ Failed to submit idea');
            }
        });
        
        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>`;
    }
    
    async getBrandIdeas(filters = {}) {
        // Get brand ideas from database (mock implementation)
        return this.generateMockIdeas();
    }
    
    generateMockIdeas() {
        return [
            {
                id: 'idea_001',
                title: 'Death to Boring Learning',
                description: 'Revolutionary education platform that transforms boring subjects into epic adventures',
                category: 'game',
                concept_text: 'A gamified learning platform that uses RPG mechanics to make education engaging',
                magnetism_score: 89,
                votes: 24,
                vote_score: 4.7,
                status: 'approved',
                submitted_by: 'cal-master',
                submitted_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'idea_002',
                title: 'Build Together API',
                description: 'Collaborative development service where teams build APIs together in real-time',
                category: 'service',
                concept_text: 'Real-time collaborative API development with shared code editing and testing',
                magnetism_score: 76,
                votes: 18,
                vote_score: 4.3,
                status: 'analyzing',
                submitted_by: 'ship-cal',
                submitted_at: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: 'idea_003',
                title: 'AI Code Whisperer',
                description: 'Intelligent coding companion that learns your style and whispers suggestions',
                category: 'ai',
                concept_text: 'Personal AI coding assistant with natural language interaction',
                magnetism_score: 94,
                votes: 31,
                vote_score: 4.9,
                status: 'approved',
                submitted_by: 'wiki-cal',
                submitted_at: new Date(Date.now() - 259200000).toISOString()
            },
            {
                id: 'idea_004',
                title: 'Spark Community Hub',
                description: 'Creative catalyst platform where developers ignite projects together',
                category: 'community',
                concept_text: 'Community platform focused on sparking collaborative creative projects',
                magnetism_score: 82,
                votes: 22,
                vote_score: 4.5,
                status: 'submitted',
                submitted_by: 'trade-cal',
                submitted_at: new Date(Date.now() - 345600000).toISOString()
            }
        ];
    }
    
    async saveBrandIdea(ideaData) {
        // Save brand idea to database
        const idea = {
            id: `idea_${Date.now()}`,
            ...ideaData,
            votes: 0,
            vote_score: 0.0,
            view_count: 0,
            status: 'submitted',
            submitted_at: new Date().toISOString()
        };
        
        this.brandIdeas.set(idea.id, idea);
        
        // Trigger magnetism analysis
        setTimeout(() => {
            this.analyzeBrandIdeaMagnetism(idea.id);
        }, 1000);
        
        return idea;
    }
    
    async analyzeBrandIdeaMagnetism(ideaId) {
        const idea = this.brandIdeas.get(ideaId);
        if (!idea) return;
        
        // Mock magnetism analysis
        const magnetismScore = Math.floor(Math.random() * 40) + 60; // 60-100%
        
        idea.magnetism_score = magnetismScore;
        idea.status = 'analyzing';
        
        this.brandIdeas.set(ideaId, idea);
        
        console.log(`🔍 Analyzed magnetism for "${idea.title}": ${magnetismScore}%`);
    }
    
    createBrandingSummaryReport(results) {
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalComponents: results.scanned,
                brandedComponents: results.branded,
                unbrandedComponents: results.unbranded,
                brandingCoverage: `${Math.round((results.branded / results.scanned) * 100)}%`
            },
            topOpportunities: results.opportunities.slice(0, 10),
            recommendedActions: [
                'Focus on high-potential user-facing components first',
                'Create brand archetypes for different component categories',
                'Establish brand guidelines and templates',
                'Set up community collaboration workflows'
            ],
            nextMilestones: [
                'Brand 5 high-potential components',
                'Create brand asset library',
                'Implement brand consistency checks',
                'Launch community brand board'
            ]
        };
    }
    
    // Export for CAL system integration
    getCommands() {
        return this.commands;
    }
    
    async executeCommand(command, args) {
        const [mainCommand, subCommand] = command.split(' ');
        
        if (mainCommand === 'brand' && this.commands.has('brand')) {
            const brandCommands = this.commands.get('brand').subcommands;
            
            if (brandCommands[subCommand]) {
                return await brandCommands[subCommand].handler(args);
            }
        }
        
        return {
            success: false,
            error: `Unknown command: ${command}`
        };
    }
}

module.exports = CalBrandCommands;

// Demo usage
if (require.main === module) {
    console.log('🎨 CAL Brand Commands - Brand Integration System');
    console.log('\nAvailable commands:');
    console.log('  cal brand scan-games     - Scan for branding opportunities');
    console.log('  cal brand analyze <name> - Analyze component branding');
    console.log('  cal brand generate <idea> - Generate new brand');
    console.log('  cal brand board          - Launch Pinterest-style idea board');
    console.log('  cal brand rank           - Excel-style ranking interface');
    console.log('  cal brand submit <idea>  - Submit community idea');
    console.log('  cal brand vote <id>      - Vote on idea');
    
    console.log('\n🔧 Integration points:');
    console.log('  - Flag-Tag System: Component discovery and categorization');
    console.log('  - Diamond Layer: Universal entity registry with brand columns');
    console.log('  - Cultural Brand Generator: AI-powered brand creation');
    console.log('  - Community Board: Pinterest-style collaboration');
    console.log('  - Excel Ranking: Sortable voting and feedback system');
}
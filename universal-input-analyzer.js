#!/usr/bin/env node

/**
 * 🌍 UNIVERSAL INPUT ANALYZER
 * 
 * Takes any text input and determines which architectures should process it:
 * - 3-Ring Architecture (0-2)
 * - 11-Layer System (1-11)  
 * - 51-Layer Personal Architecture (1-51)
 * - Layer6 Gaming Systems
 * - 90+ Template Categories
 * 
 * Solves the problem: "How do we take normal text intake and pair it with other things?"
 */

const fs = require('fs').promises;
const path = require('path');

class UniversalInputAnalyzer {
    constructor() {
        // Load existing system mappings
        this.ringSystem = null;
        this.templateSystem = null;
        this.layerMappings = new Map();
        
        // Input classification patterns
        this.textPatterns = {
            // Ring 0 - Core/Backend patterns
            ring0: {
                patterns: [
                    /database|schema|storage|persistence/i,
                    /authentication|permission|security|auth/i,
                    /core|foundation|base|fundamental/i,
                    /api key|secret|credential|token/i,
                    /mbti|personality|psychology|behavior/i
                ],
                keywords: ['storage', 'auth', 'core', 'database', 'permissions', 'personality']
            },
            
            // Ring 1 - Logic/Processing patterns  
            ring1: {
                patterns: [
                    /process|transform|analyze|compute/i,
                    /algorithm|logic|business rule|workflow/i,
                    /orchestrat|coordinat|manag|control/i,
                    /ai|llm|machine learning|neural/i,
                    /character evolution|boss integration/i
                ],
                keywords: ['process', 'logic', 'ai', 'orchestration', 'management', 'analysis']
            },
            
            // Ring 2 - Frontend/UI patterns
            ring2: {
                patterns: [
                    /interface|ui|ux|dashboard|frontend/i,
                    /visual|display|render|show|present/i,
                    /user interaction|click|button|form/i,
                    /game world|3d|graphics|animation/i,
                    /selfie|photo|image|camera/i
                ],
                keywords: ['ui', 'interface', 'visual', 'dashboard', 'user', 'display']
            }
        };
        
        // Layer system patterns (1-11, 1-51, Layer6)
        this.layerPatterns = {
            // 11-Layer system patterns
            layers1to11: {
                layer1: /foundation|basic|core|start/i,
                layer2: /data|information|input/i,
                layer3: /processing|analysis|computation/i,
                layer4: /logic|business|rules/i,
                layer5: /integration|connection|link/i,
                layer6: /gaming|game|play|competition/i,
                layer7: /security|protection|safety/i,
                layer8: /interface|presentation|ui/i,
                layer9: /optimization|performance|efficiency/i,
                layer10: /monitoring|logging|metrics/i,
                layer11: /deployment|production|release/i
            },
            
            // 51-Layer personal architecture patterns (simplified to key layers)
            layers1to51: {
                personal: /personal|private|individual|self/i,
                social: /social|community|network|friend/i,
                professional: /work|business|career|professional/i,
                creative: /creative|art|design|imagination/i,
                analytical: /analysis|logic|rational|systematic/i,
                emotional: /emotion|feeling|mood|sentiment/i,
                financial: /money|payment|cost|revenue|financial/i,
                health: /health|wellness|medical|fitness/i,
                learning: /learn|education|study|knowledge/i,
                spiritual: /spiritual|meaning|purpose|philosophy/i
            },
            
            // Layer6 Gaming specific patterns
            layer6Gaming: {
                gameplay: /game|play|level|score|win|lose/i,
                characters: /character|avatar|player|npc/i,
                economy: /coin|token|currency|trade|market/i,
                competition: /battle|arena|tournament|competition/i,
                progression: /level up|upgrade|evolve|progress/i,
                social: /guild|team|party|multiplayer/i
            }
        };
        
        // Template category patterns (from template-consolidator.js)
        this.templatePatterns = {
            dataTransform: {
                patterns: [
                    /document|pdf|parse|convert|transform/i,
                    /mvp|template|generation|processing/i,
                    /integration|orchestrat|matching/i
                ],
                templates: ['mvp_template_strategy', 'template-matcher-ai', 'template-integration-orchestrator']
            },
            
            resourceManagement: {
                patterns: [
                    /resource|quota|limit|allocation/i,
                    /dependency|requirement|management/i,
                    /cost|budget|optimization/i
                ],
                templates: ['template-dependencies', 'advanced-template-dependency-mapper']
            },
            
            competition: {
                patterns: [
                    /competition|battle|arena|tournament/i,
                    /execution|decision|strategy/i,
                    /winner|loser|score|ranking/i
                ],
                templates: ['template-bash-execution', 'execute-decision-template']
            },
            
            status: {
                patterns: [
                    /status|state|condition|effect/i,
                    /action|behavior|response/i,
                    /report|update|notification/i
                ],
                templates: ['template-layer-bash', 'template-action-system']
            },
            
            instance: {
                patterns: [
                    /instance|system|service|application/i,
                    /build|deploy|manage|configure/i,
                    /registry|catalog|directory/i
                ],
                templates: ['template-system-manager', 'template-builder-system']
            }
        };
        
        this.initializeSystem();
    }
    
    async initializeSystem() {
        try {
            // Load ring dependency analysis if available
            try {
                const ringData = await fs.readFile('./RING-DEPENDENCY-ANALYSIS.json', 'utf8');
                this.ringSystem = JSON.parse(ringData);
            } catch (error) {
                console.warn('⚠️ Ring system data not found, using patterns only');
            }
            
            // Load template consolidation data if available
            try {
                const templateData = await fs.readFile('./template-registry-consolidated.json', 'utf8');
                this.templateSystem = JSON.parse(templateData);
            } catch (error) {
                console.warn('⚠️ Template system data not found, using patterns only');
            }
            
            console.log('🌍 Universal Input Analyzer initialized');
            
        } catch (error) {
            console.error('❌ Error initializing Universal Input Analyzer:', error);
        }
    }
    
    /**
     * Main analysis function - takes any text and determines routing
     */
    async analyzeInput(inputText, metadata = {}) {
        console.log(`🔍 Analyzing input: "${inputText.slice(0, 100)}..."`);
        
        const analysis = {
            originalInput: inputText,
            metadata,
            timestamp: Date.now(),
            
            // Architecture routing decisions
            ringArchitecture: this.analyzeRingRouting(inputText),
            layerSystems: this.analyzeLayerRouting(inputText),
            templateCategories: this.analyzeTemplateRouting(inputText),
            
            // Comprehensive routing plan
            routingPlan: null,
            
            // Confidence scores
            confidence: {
                ring: 0,
                layers: 0,
                templates: 0,
                overall: 0
            }
        };
        
        // Generate routing plan
        analysis.routingPlan = this.generateRoutingPlan(analysis);
        
        // Calculate confidence scores
        analysis.confidence = this.calculateConfidence(analysis);
        
        console.log(`✅ Analysis complete - Overall confidence: ${analysis.confidence.overall}%`);
        
        return analysis;
    }
    
    /**
     * Analyze which rings (0, 1, 2) should handle this input
     */
    analyzeRingRouting(inputText) {
        const routing = {
            ring0: { score: 0, reasons: [], systems: [] },
            ring1: { score: 0, reasons: [], systems: [] },
            ring2: { score: 0, reasons: [], systems: [] },
            recommended: []
        };
        
        const text = inputText.toLowerCase();
        
        // Ring 0 analysis (Core/Backend)
        for (const pattern of this.textPatterns.ring0.patterns) {
            if (pattern.test(inputText)) {
                routing.ring0.score += 10;
                routing.ring0.reasons.push(`Matches Ring 0 pattern: ${pattern.source}`);
            }
        }
        
        for (const keyword of this.textPatterns.ring0.keywords) {
            if (text.includes(keyword)) {
                routing.ring0.score += 5;
                routing.ring0.reasons.push(`Contains Ring 0 keyword: ${keyword}`);
            }
        }
        
        // Ring 1 analysis (Logic/Processing)
        for (const pattern of this.textPatterns.ring1.patterns) {
            if (pattern.test(inputText)) {
                routing.ring1.score += 10;
                routing.ring1.reasons.push(`Matches Ring 1 pattern: ${pattern.source}`);
            }
        }
        
        for (const keyword of this.textPatterns.ring1.keywords) {
            if (text.includes(keyword)) {
                routing.ring1.score += 5;
                routing.ring1.reasons.push(`Contains Ring 1 keyword: ${keyword}`);
            }
        }
        
        // Ring 2 analysis (Frontend/UI)
        for (const pattern of this.textPatterns.ring2.patterns) {
            if (pattern.test(inputText)) {
                routing.ring2.score += 10;
                routing.ring2.reasons.push(`Matches Ring 2 pattern: ${pattern.source}`);
            }
        }
        
        for (const keyword of this.textPatterns.ring2.keywords) {
            if (text.includes(keyword)) {
                routing.ring2.score += 5;
                routing.ring2.reasons.push(`Contains Ring 2 keyword: ${keyword}`);
            }
        }
        
        // Determine recommended rings
        const scores = [
            { ring: 0, score: routing.ring0.score },
            { ring: 1, score: routing.ring1.score },
            { ring: 2, score: routing.ring2.score }
        ];
        
        routing.recommended = scores
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.ring);
        
        // Map to actual systems if ring data is available
        if (this.ringSystem && this.ringSystem.flow_visualization) {
            for (let ringNum of routing.recommended) {
                const ringData = this.ringSystem.flow_visualization.rings[ringNum];
                if (ringData) {
                    routing[`ring${ringNum}`].systems = ringData.systems.map(s => s.id);
                }
            }
        }
        
        return routing;
    }
    
    /**
     * Analyze which layer systems (1-11, 1-51, Layer6) should handle this input
     */
    analyzeLayerRouting(inputText) {
        const routing = {
            layers1to11: { matches: [], scores: new Map() },
            layers1to51: { matches: [], scores: new Map() },
            layer6Gaming: { matches: [], scores: new Map() },
            recommended: {
                primary: [],
                secondary: [],
                gaming: []
            }
        };
        
        // Analyze 1-11 layer system
        for (const [layerName, pattern] of Object.entries(this.layerPatterns.layers1to11)) {
            if (pattern.test(inputText)) {
                routing.layers1to11.matches.push(layerName);
                routing.layers1to11.scores.set(layerName, 10);
                routing.recommended.primary.push(layerName);
            }
        }
        
        // Analyze 1-51 layer system
        for (const [layerName, pattern] of Object.entries(this.layerPatterns.layers1to51)) {
            if (pattern.test(inputText)) {
                routing.layers1to51.matches.push(layerName);
                routing.layers1to51.scores.set(layerName, 8);
                routing.recommended.secondary.push(layerName);
            }
        }
        
        // Analyze Layer6 Gaming specific
        for (const [layerName, pattern] of Object.entries(this.layerPatterns.layer6Gaming)) {
            if (pattern.test(inputText)) {
                routing.layer6Gaming.matches.push(layerName);
                routing.layer6Gaming.scores.set(layerName, 15);
                routing.recommended.gaming.push(layerName);
            }
        }
        
        return routing;
    }
    
    /**
     * Analyze which template categories should handle this input
     */
    analyzeTemplateRouting(inputText) {
        const routing = {
            categories: new Map(),
            recommendedTemplates: [],
            scores: new Map()
        };
        
        // Analyze each template category
        for (const [categoryName, categoryData] of Object.entries(this.templatePatterns)) {
            let score = 0;
            const matches = [];
            
            // Check patterns
            for (const pattern of categoryData.patterns) {
                if (pattern.test(inputText)) {
                    score += 10;
                    matches.push(`Pattern: ${pattern.source}`);
                }
            }
            
            if (score > 0) {
                routing.categories.set(categoryName, {
                    score,
                    matches,
                    availableTemplates: categoryData.templates
                });
                routing.scores.set(categoryName, score);
                
                // Add top templates for this category
                routing.recommendedTemplates.push(...categoryData.templates.slice(0, 2));
            }
        }
        
        return routing;
    }
    
    /**
     * Generate comprehensive routing plan
     */
    generateRoutingPlan(analysis) {
        const plan = {
            executionOrder: [],
            parallelGroups: [],
            dependencies: [],
            estimatedComplexity: 'medium',
            estimatedTime: '30-60 seconds'
        };
        
        // Create execution groups based on ring dependencies
        const ringGroups = {
            ring0: [], // Execute first (no dependencies)
            ring1: [], // Execute second (depends on Ring 0)
            ring2: []  // Execute third (depends on Ring 0 & 1)
        };
        
        // Map recommended systems to execution groups
        for (const ring of analysis.ringArchitecture.recommended) {
            const systems = analysis.ringArchitecture[`ring${ring}`].systems;
            ringGroups[`ring${ring}`].push(...systems);
        }
        
        // Add layer systems to appropriate groups
        if (analysis.layerSystems.recommended.primary.length > 0) {
            ringGroups.ring1.push(...analysis.layerSystems.recommended.primary);
        }
        
        if (analysis.layerSystems.recommended.secondary.length > 0) {
            ringGroups.ring1.push(...analysis.layerSystems.recommended.secondary);
        }
        
        if (analysis.layerSystems.recommended.gaming.length > 0) {
            ringGroups.ring2.push(...analysis.layerSystems.recommended.gaming);
        }
        
        // Create execution plan
        if (ringGroups.ring0.length > 0) {
            plan.parallelGroups.push({
                phase: 'foundation',
                systems: ringGroups.ring0,
                description: 'Core/Backend systems execute first'
            });
        }
        
        if (ringGroups.ring1.length > 0) {
            plan.parallelGroups.push({
                phase: 'processing',
                systems: ringGroups.ring1,
                description: 'Logic/Processing systems execute second'
            });
        }
        
        if (ringGroups.ring2.length > 0) {
            plan.parallelGroups.push({
                phase: 'presentation',
                systems: ringGroups.ring2,
                description: 'Frontend/UI systems execute third'
            });
        }
        
        // Add template processing
        if (analysis.templateCategories.recommendedTemplates.length > 0) {
            plan.parallelGroups.push({
                phase: 'templating',
                systems: analysis.templateCategories.recommendedTemplates,
                description: 'Template generation and processing'
            });
        }
        
        // Calculate complexity and time estimates
        const totalSystems = plan.parallelGroups.reduce((sum, group) => sum + group.systems.length, 0);
        
        if (totalSystems < 3) {
            plan.estimatedComplexity = 'simple';
            plan.estimatedTime = '10-30 seconds';
        } else if (totalSystems > 8) {
            plan.estimatedComplexity = 'complex';
            plan.estimatedTime = '60-120 seconds';
        }
        
        return plan;
    }
    
    /**
     * Calculate confidence scores for the analysis
     */
    calculateConfidence(analysis) {
        const confidence = {
            ring: 0,
            layers: 0,
            templates: 0,
            overall: 0
        };
        
        // Ring confidence
        const ringScores = [
            analysis.ringArchitecture.ring0.score,
            analysis.ringArchitecture.ring1.score,
            analysis.ringArchitecture.ring2.score
        ];
        confidence.ring = Math.min(100, Math.max(...ringScores) * 2);
        
        // Layer confidence
        const layerMatches = analysis.layerSystems.recommended.primary.length +
                           analysis.layerSystems.recommended.secondary.length +
                           analysis.layerSystems.recommended.gaming.length;
        confidence.layers = Math.min(100, layerMatches * 20);
        
        // Template confidence
        const templateScores = Array.from(analysis.templateCategories.scores.values());
        confidence.templates = templateScores.length > 0 ? 
            Math.min(100, Math.max(...templateScores) * 3) : 0;
        
        // Overall confidence (weighted average)
        confidence.overall = Math.round(
            (confidence.ring * 0.4 + confidence.layers * 0.3 + confidence.templates * 0.3)
        );
        
        return confidence;
    }
    
    /**
     * Format analysis results for output
     */
    formatAnalysisResults(analysis) {
        const results = {
            summary: {
                inputLength: analysis.originalInput.length,
                ringsActivated: analysis.ringArchitecture.recommended.length,
                layersActivated: Object.values(analysis.layerSystems.recommended).flat().length,
                templatesActivated: analysis.templateCategories.recommendedTemplates.length,
                overallConfidence: analysis.confidence.overall,
                estimatedComplexity: analysis.routingPlan.estimatedComplexity
            },
            
            routing: {
                rings: analysis.ringArchitecture.recommended,
                primaryLayers: analysis.layerSystems.recommended.primary,
                secondaryLayers: analysis.layerSystems.recommended.secondary,
                gamingLayers: analysis.layerSystems.recommended.gaming,
                templates: analysis.templateCategories.recommendedTemplates
            },
            
            executionPlan: analysis.routingPlan.parallelGroups,
            
            recommendations: this.generateRecommendations(analysis)
        };
        
        return results;
    }
    
    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.confidence.overall < 50) {
            recommendations.push({
                type: 'warning',
                message: 'Low confidence in routing analysis - consider adding more specific keywords'
            });
        }
        
        if (analysis.ringArchitecture.recommended.length === 0) {
            recommendations.push({
                type: 'suggestion',
                message: 'No ring systems matched - input may be too generic or require custom processing'
            });
        }
        
        if (analysis.templateCategories.recommendedTemplates.length === 0) {
            recommendations.push({
                type: 'suggestion',
                message: 'No templates matched - consider using dataTransform category as default'
            });
        }
        
        if (analysis.layerSystems.recommended.gaming.length > 0) {
            recommendations.push({
                type: 'enhancement',
                message: 'Gaming elements detected - consider enabling Layer6 gaming features'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Export analysis results
     */
    async exportAnalysis(analysis, outputPath) {
        const exportData = {
            version: '1.0.0',
            analyzer: 'Universal Input Analyzer',
            generated: new Date().toISOString(),
            analysis: this.formatAnalysisResults(analysis),
            fullAnalysis: analysis
        };
        
        if (outputPath) {
            await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
            console.log(`📄 Analysis exported to ${outputPath}`);
        }
        
        return exportData;
    }
}

// Export the analyzer
module.exports = UniversalInputAnalyzer;

// CLI Demo
if (require.main === module) {
    async function demonstrateAnalyzer() {
        console.log('\n🌍 UNIVERSAL INPUT ANALYZER - DEMONSTRATION\n');
        
        const analyzer = new UniversalInputAnalyzer();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const testInputs = [
            {
                name: 'Database Storage Request',
                text: 'I need to create a database schema for storing user authentication data and permissions'
            },
            {
                name: 'Game Development Request', 
                text: 'Create a battle arena where characters can compete and level up their abilities'
            },
            {
                name: 'Document Processing Request',
                text: 'Transform this PDF business plan into a working MVP application with payment processing'
            },
            {
                name: 'UI Dashboard Request',
                text: 'Build a visual dashboard interface that shows real-time analytics and user interactions'
            },
            {
                name: 'Mixed Complex Request',
                text: 'I want to build a social learning platform with AI tutors, gamification, and payment systems'
            }
        ];
        
        for (const testInput of testInputs) {
            console.log(`\n🔍 Testing: ${testInput.name}`);
            console.log(`Input: "${testInput.text}"`);
            
            const analysis = await analyzer.analyzeInput(testInput.text);
            const results = analyzer.formatAnalysisResults(analysis);
            
            console.log('\n📊 Results:');
            console.log(`   Confidence: ${results.summary.overallConfidence}%`);
            console.log(`   Rings: ${results.routing.rings.join(', ') || 'none'}`);
            console.log(`   Primary Layers: ${results.routing.primaryLayers.join(', ') || 'none'}`);
            console.log(`   Gaming Layers: ${results.routing.gamingLayers.join(', ') || 'none'}`);
            console.log(`   Templates: ${results.routing.templates.slice(0, 2).join(', ') || 'none'}`);
            console.log(`   Complexity: ${results.summary.estimatedComplexity}`);
            
            if (results.recommendations.length > 0) {
                console.log('   Recommendations:');
                results.recommendations.forEach(rec => {
                    console.log(`     ${rec.type}: ${rec.message}`);
                });
            }
        }
        
        console.log('\n✅ UNIVERSAL INPUT ANALYZER DEMONSTRATION COMPLETE!');
        console.log('\n🎯 Key Capabilities:');
        console.log('   ✅ Analyzes any text input for architecture routing');
        console.log('   ✅ Maps to 3-Ring Architecture (0-2)');
        console.log('   ✅ Maps to Layer Systems (1-11, 1-51, Layer6)');
        console.log('   ✅ Maps to Template Categories (90+ templates)');
        console.log('   ✅ Generates execution plans with dependencies');
        console.log('   ✅ Provides confidence scores and recommendations');
        
        console.log('\n🚀 Next Steps:');
        console.log('   1. Build Multi-System Router to execute the plans');
        console.log('   2. Create Template Multiplier Engine for generation');
        console.log('   3. Build Unified Response Aggregator for results');
    }
    
    demonstrateAnalyzer().catch(console.error);
}
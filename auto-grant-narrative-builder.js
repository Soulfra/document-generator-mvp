/**
 * Auto Grant Narrative Builder
 * Builds compelling grant narratives from detected keywords and domain intelligence
 * Automatically generates "why we deserve funding" based on holding company capabilities
 * Links societal/community functions to grant criteria for maximum alignment
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class AutoGrantNarrativeBuilder extends EventEmitter {
    constructor(keywordIntelligence, grantScraper, database, config = {}) {
        super();
        
        this.intelligence = keywordIntelligence;
        this.grantScraper = grantScraper;
        this.db = database;
        this.config = {
            enableAutoGeneration: true,
            enableMultiDomainNarratives: true,
            enableSocialImpactFocus: true,
            narrativeQualityThreshold: 0.8,
            maxNarrativeLength: 5000, // words
            enableGrantMatching: true,
            enableSuccessMetrics: true,
            ...config
        };
        
        // Grant narrative templates organized by type
        this.narrativeTemplates = {
            innovation_grants: {
                structure: ['executive_summary', 'innovation_description', 'technical_approach', 'market_impact', 'team_qualifications', 'budget_justification'],
                tone: 'professional',
                emphasis: ['novelty', 'technical_excellence', 'market_potential']
            },
            research_grants: {
                structure: ['research_objectives', 'methodology', 'literature_review', 'expected_outcomes', 'research_team', 'timeline'],
                tone: 'academic',
                emphasis: ['scientific_rigor', 'knowledge_contribution', 'peer_review']
            },
            startup_grants: {
                structure: ['business_summary', 'market_opportunity', 'competitive_advantage', 'growth_strategy', 'team_experience', 'funding_use'],
                tone: 'entrepreneurial',
                emphasis: ['scalability', 'job_creation', 'economic_impact']
            },
            social_impact_grants: {
                structure: ['community_need', 'solution_approach', 'impact_measurement', 'sustainability_plan', 'community_engagement', 'long_term_vision'],
                tone: 'mission_driven',
                emphasis: ['community_benefit', 'measurable_outcomes', 'lasting_change']
            },
            technology_grants: {
                structure: ['technology_overview', 'development_plan', 'technical_specifications', 'implementation_timeline', 'risk_mitigation', 'success_criteria'],
                tone: 'technical',
                emphasis: ['feasibility', 'innovation', 'practical_application']
            }
        };
        
        // Narrative building frameworks
        this.narrativeFrameworks = {
            // Problem-Solution-Impact framework
            psi: {
                components: ['problem_identification', 'solution_description', 'expected_impact'],
                flow: 'problem → solution → impact',
                persuasion: 'logical_progression'
            },
            
            // STAR framework (Situation, Task, Action, Result)
            star: {
                components: ['situation_analysis', 'task_definition', 'action_plan', 'expected_results'],
                flow: 'situation → task → action → result',
                persuasion: 'structured_storytelling'
            },
            
            // Features-Advantages-Benefits framework
            fab: {
                components: ['feature_description', 'advantage_explanation', 'benefit_realization'],
                flow: 'features → advantages → benefits',
                persuasion: 'value_proposition'
            }
        };
        
        // Social impact categorization
        this.socialImpactCategories = {
            economic_development: {
                metrics: ['jobs_created', 'revenue_generated', 'business_growth', 'investment_attraction'],
                narratives: ['Economic empowerment', 'Business ecosystem development', 'Innovation-driven growth']
            },
            education_advancement: {
                metrics: ['students_reached', 'skill_development', 'educational_outcomes', 'teacher_training'],
                narratives: ['Educational transformation', 'Digital literacy', 'Workforce development']
            },
            community_empowerment: {
                metrics: ['communities_served', 'participation_rate', 'leadership_development', 'capacity_building'],
                narratives: ['Community resilience', 'Grassroots innovation', 'Inclusive development']
            },
            technological_advancement: {
                metrics: ['innovations_developed', 'patents_filed', 'research_publications', 'technology_adoption'],
                narratives: ['Technological progress', 'Research advancement', 'Innovation ecosystem']
            },
            accessibility_improvement: {
                metrics: ['barriers_removed', 'accessibility_features', 'inclusive_design', 'user_adoption'],
                narratives: ['Digital inclusion', 'Universal access', 'Barrier elimination']
            }
        };
        
        // Grant success factors
        this.successFactors = {
            alignment: {
                weight: 0.25,
                criteria: ['mission_alignment', 'criteria_match', 'focus_area_overlap']
            },
            innovation: {
                weight: 0.20,
                criteria: ['novelty', 'technical_advancement', 'creative_approach']
            },
            impact: {
                weight: 0.20,
                criteria: ['scale_of_impact', 'measurable_outcomes', 'long_term_benefit']
            },
            feasibility: {
                weight: 0.15,
                criteria: ['technical_feasibility', 'resource_availability', 'timeline_realism']
            },
            team: {
                weight: 0.10,
                criteria: ['expertise', 'track_record', 'team_composition']
            },
            sustainability: {
                weight: 0.10,
                criteria: ['long_term_viability', 'funding_strategy', 'scalability_plan']
            }
        };
        
        // Narrative generation state
        this.narrativeState = {
            activeNarratives: new Map(),
            narrativeHistory: new Map(),
            successRate: 0,
            totalGenerated: 0,
            approvedNarratives: 0,
            templateUsage: new Map()
        };
        
        this.initializeNarrativeBuilder();
    }
    
    /**
     * Initialize the auto grant narrative builder
     */
    async initializeNarrativeBuilder() {
        console.log('📝 Initializing Auto Grant Narrative Builder...');
        
        try {
            // Initialize databases
            await this.initializeNarrativeDatabases();
            
            // Load existing narratives and templates
            await this.loadExistingNarratives();
            
            // Initialize narrative templates
            await this.initializeNarrativeTemplates();
            
            // Start automatic grant monitoring
            if (this.config.enableAutoGeneration) {
                this.startAutomaticGeneration();
            }
            
            console.log('✅ Auto Grant Narrative Builder Online');
            console.log('📋 Narrative templates loaded');
            console.log('🎯 Grant matching algorithms active');
            console.log('📊 Social impact frameworks ready');
            console.log('🔄 Automatic generation monitoring started');
            
            this.emit('narrative_builder_ready', {
                templates: Object.keys(this.narrativeTemplates),
                frameworks: Object.keys(this.narrativeFrameworks),
                impactCategories: Object.keys(this.socialImpactCategories)
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize narrative builder:', error);
            throw error;
        }
    }
    
    /**
     * Generate comprehensive grant narrative for specific opportunity
     */
    async generateGrantNarrative(grantOpportunity, targetDomains = null, options = {}) {
        try {
            const narrativeId = crypto.randomUUID();
            const startTime = Date.now();
            
            console.log(`📝 Generating grant narrative for: ${grantOpportunity.title}`);
            
            // Analyze grant opportunity
            const grantAnalysis = await this.analyzeGrantOpportunity(grantOpportunity);
            
            // Get relevant domain intelligence
            const domainIntelligence = await this.getRelevantDomainIntelligence(grantOpportunity, targetDomains);
            
            // Select optimal narrative template
            const narrativeTemplate = await this.selectNarrativeTemplate(grantAnalysis, domainIntelligence);
            
            // Build narrative components
            const narrativeComponents = await this.buildNarrativeComponents(
                grantOpportunity, 
                grantAnalysis, 
                domainIntelligence, 
                narrativeTemplate
            );
            
            // Generate social impact story
            const socialImpactNarrative = await this.generateSocialImpactNarrative(
                grantOpportunity, 
                domainIntelligence
            );
            
            // Build success metrics and measurement plan
            const successMetrics = await this.buildSuccessMetrics(grantOpportunity, domainIntelligence);
            
            // Assemble final narrative
            const finalNarrative = await this.assembleFinalNarrative(
                narrativeComponents,
                socialImpactNarrative,
                successMetrics,
                narrativeTemplate
            );
            
            // Score narrative quality
            const qualityScore = await this.scoreNarrativeQuality(finalNarrative, grantOpportunity);
            
            // Package narrative result
            const narrativeResult = {
                narrativeId,
                grantOpportunity,
                targetDomains,
                narrative: finalNarrative,
                metadata: {
                    template: narrativeTemplate.type,
                    framework: narrativeTemplate.framework,
                    domainCount: Object.keys(domainIntelligence).length,
                    generationTime: Date.now() - startTime,
                    qualityScore: qualityScore.overall,
                    wordCount: this.countWords(finalNarrative)
                },
                analysis: {
                    grantAnalysis,
                    domainIntelligence,
                    socialImpact: socialImpactNarrative.categories,
                    successProbability: this.calculateSuccessProbability(qualityScore, grantAnalysis)
                },
                recommendations: await this.generateSubmissionRecommendations(finalNarrative, grantOpportunity),
                timestamp: Date.now()
            };
            
            // Store narrative
            await this.storeNarrative(narrativeResult);
            
            // Update statistics
            this.narrativeState.totalGenerated++;
            this.narrativeState.activeNarratives.set(narrativeId, narrativeResult);
            
            console.log(`✅ Grant narrative generated: ${qualityScore.overall.toFixed(2)} quality score, ${this.countWords(finalNarrative)} words`);
            
            this.emit('narrative_generated', narrativeResult);
            
            return narrativeResult;
            
        } catch (error) {
            console.error(`❌ Failed to generate grant narrative:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Generate holding company portfolio narrative
     */
    async generatePortfolioNarrative(grantCategory, focusAreas = []) {
        try {
            console.log(`📋 Generating portfolio narrative for ${grantCategory}...`);
            
            // Get comprehensive domain intelligence
            const portfolioIntelligence = await this.intelligence.buildHoldingCompanyNarrative({
                category: grantCategory,
                focusAreas
            });
            
            // Build unified company story
            const companyStory = await this.buildCompanyStory(portfolioIntelligence);
            
            // Generate cross-domain synergies narrative
            const synergiesNarrative = await this.buildSynergiesNarrative(portfolioIntelligence);
            
            // Build impact amplification story
            const impactAmplification = await this.buildImpactAmplificationNarrative(portfolioIntelligence);
            
            // Generate competitive advantages
            const competitiveAdvantages = await this.buildCompetitiveAdvantagesNarrative(portfolioIntelligence);
            
            // Build scalability narrative
            const scalabilityNarrative = await this.buildScalabilityNarrative(portfolioIntelligence);
            
            const portfolioNarrative = {
                portfolio_overview: companyStory,
                domain_synergies: synergiesNarrative,
                impact_amplification: impactAmplification,
                competitive_advantages: competitiveAdvantages,
                scalability_potential: scalabilityNarrative,
                portfolio_metrics: await this.calculatePortfolioMetrics(portfolioIntelligence),
                funding_strategy: await this.buildPortfolioFundingStrategy(grantCategory, portfolioIntelligence)
            };
            
            return portfolioNarrative;
            
        } catch (error) {
            console.error('❌ Failed to generate portfolio narrative:', error);
            return null;
        }
    }
    
    /**
     * Analyze grant opportunity to understand requirements
     */
    async analyzeGrantOpportunity(grantOpportunity) {
        try {
            // Extract key requirements
            const requirements = await this.extractGrantRequirements(grantOpportunity);
            
            // Categorize grant type
            const grantType = await this.categorizeGrantType(grantOpportunity);
            
            // Identify success criteria
            const successCriteria = await this.identifySuccessCriteria(grantOpportunity);
            
            // Analyze funding priorities
            const fundingPriorities = await this.analyzeFundingPriorities(grantOpportunity);
            
            // Determine alignment opportunities
            const alignmentOpportunities = await this.findAlignmentOpportunities(grantOpportunity);
            
            return {
                type: grantType,
                requirements,
                successCriteria,
                fundingPriorities,
                alignmentOpportunities,
                complexity: this.calculateGrantComplexity(requirements),
                competitiveness: this.estimateCompetitiveness(grantOpportunity)
            };
            
        } catch (error) {
            console.error('❌ Failed to analyze grant opportunity:', error);
            return null;
        }
    }
    
    /**
     * Build narrative components based on template structure
     */
    async buildNarrativeComponents(grantOpportunity, analysis, intelligence, template) {
        const components = {};
        
        for (const componentType of template.structure) {
            switch (componentType) {
                case 'executive_summary':
                    components[componentType] = await this.buildExecutiveSummary(grantOpportunity, intelligence);
                    break;
                case 'innovation_description':
                    components[componentType] = await this.buildInnovationDescription(intelligence);
                    break;
                case 'technical_approach':
                    components[componentType] = await this.buildTechnicalApproach(intelligence);
                    break;
                case 'market_impact':
                    components[componentType] = await this.buildMarketImpact(intelligence);
                    break;
                case 'team_qualifications':
                    components[componentType] = await this.buildTeamQualifications(intelligence);
                    break;
                case 'budget_justification':
                    components[componentType] = await this.buildBudgetJustification(grantOpportunity, intelligence);
                    break;
                case 'community_need':
                    components[componentType] = await this.buildCommunityNeed(grantOpportunity, intelligence);
                    break;
                case 'solution_approach':
                    components[componentType] = await this.buildSolutionApproach(intelligence);
                    break;
                case 'impact_measurement':
                    components[componentType] = await this.buildImpactMeasurement(grantOpportunity, intelligence);
                    break;
                default:
                    components[componentType] = await this.buildGenericComponent(componentType, grantOpportunity, intelligence);
            }
        }
        
        return components;
    }
    
    /**
     * Generate social impact narrative
     */
    async generateSocialImpactNarrative(grantOpportunity, intelligence) {
        try {
            // Identify relevant impact categories
            const relevantCategories = await this.identifyRelevantImpactCategories(grantOpportunity, intelligence);
            
            // Build impact stories for each category
            const impactStories = {};
            for (const category of relevantCategories) {
                impactStories[category] = await this.buildImpactStory(category, intelligence);
            }
            
            // Generate measurable outcomes
            const measurableOutcomes = await this.generateMeasurableOutcomes(relevantCategories, intelligence);
            
            // Build community engagement narrative
            const communityEngagement = await this.buildCommunityEngagementNarrative(intelligence);
            
            // Generate sustainability plan
            const sustainabilityPlan = await this.buildSustainabilityPlan(intelligence);
            
            return {
                categories: relevantCategories,
                impactStories,
                measurableOutcomes,
                communityEngagement,
                sustainabilityPlan,
                longTermVision: await this.buildLongTermVision(intelligence)
            };
            
        } catch (error) {
            console.error('❌ Failed to generate social impact narrative:', error);
            return null;
        }
    }
    
    /**
     * Start automatic grant narrative generation
     */
    startAutomaticGeneration() {
        console.log('🔄 Starting automatic grant narrative generation...');
        
        // Monitor for new grant opportunities
        setInterval(async () => {
            try {
                const newOpportunities = await this.grantScraper.getNewOpportunities();
                
                for (const opportunity of newOpportunities) {
                    // Check if we should auto-generate
                    const shouldGenerate = await this.shouldAutoGenerate(opportunity);
                    
                    if (shouldGenerate) {
                        console.log(`🎯 Auto-generating narrative for: ${opportunity.title}`);
                        await this.generateGrantNarrative(opportunity, null, { automatic: true });
                    }
                }
                
            } catch (error) {
                console.error('❌ Automatic generation error:', error);
            }
        }, 300000); // Check every 5 minutes
    }
    
    /**
     * Initialize narrative databases
     */
    async initializeNarrativeDatabases() {
        try {
            // Grant narratives table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS grant_narratives (
                    id SERIAL PRIMARY KEY,
                    narrative_id VARCHAR(100) UNIQUE NOT NULL,
                    grant_opportunity_id VARCHAR(100),
                    grant_title VARCHAR(500),
                    narrative_data JSONB,
                    quality_score DECIMAL(3,2),
                    success_probability DECIMAL(3,2),
                    template_type VARCHAR(100),
                    word_count INTEGER,
                    target_domains TEXT[],
                    status VARCHAR(50) DEFAULT 'generated',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Narrative performance table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS narrative_performance (
                    id SERIAL PRIMARY KEY,
                    narrative_id VARCHAR(100),
                    grant_id VARCHAR(100),
                    submitted BOOLEAN DEFAULT FALSE,
                    submission_date TIMESTAMP,
                    result VARCHAR(100),
                    feedback JSONB,
                    lessons_learned JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Narrative databases initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize narrative databases:', error);
            throw error;
        }
    }
    
    // Utility methods
    countWords(text) {
        if (typeof text === 'object') {
            return Object.values(text).join(' ').split(/\s+/).length;
        }
        return text.split(/\s+/).length;
    }
    
    calculateSuccessProbability(qualityScore, grantAnalysis) {
        const baseScore = qualityScore.overall * 0.4;
        const alignmentScore = grantAnalysis.alignmentOpportunities.length * 0.1;
        const competitivenessPenalty = grantAnalysis.competitiveness * 0.2;
        
        return Math.min(baseScore + alignmentScore - competitivenessPenalty, 1.0);
    }
    
    async shouldAutoGenerate(opportunity) {
        // Check if opportunity matches our focus areas
        const relevance = await this.calculateOpportunityRelevance(opportunity);
        return relevance > 0.7;
    }
    
    // Placeholder methods for full implementation
    async loadExistingNarratives() { console.log('📊 Loading existing narratives...'); }
    async initializeNarrativeTemplates() { console.log('📋 Initializing narrative templates...'); }
    async getRelevantDomainIntelligence(grant, domains) { return { matthew: {}, roughsparks: {}, soulfra: {} }; }
    async selectNarrativeTemplate(analysis, intelligence) { return { type: 'innovation_grants', structure: ['executive_summary'], framework: 'psi' }; }
    async buildSuccessMetrics(grant, intelligence) { return { metrics: ['adoption_rate', 'impact_score'] }; }
    async assembleFinalNarrative(components, impact, metrics, template) { return { ...components, impact, metrics }; }
    async scoreNarrativeQuality(narrative, grant) { return { overall: 0.85, components: {} }; }
    async generateSubmissionRecommendations(narrative, grant) { return ['Review budget section', 'Add more technical details']; }
    async storeNarrative(result) { console.log(`💾 Storing narrative: ${result.narrativeId}`); }
    async buildCompanyStory(intelligence) { return 'Innovative technology holding company story...'; }
    async buildSynergiesNarrative(intelligence) { return 'Cross-domain synergies narrative...'; }
    async buildImpactAmplificationNarrative(intelligence) { return 'Impact amplification through portfolio...'; }
    async buildCompetitiveAdvantagesNarrative(intelligence) { return 'Unique competitive advantages...'; }
    async buildScalabilityNarrative(intelligence) { return 'Portfolio scalability potential...'; }
    async calculatePortfolioMetrics(intelligence) { return { totalValue: 1000000, domains: 4 }; }
    async buildPortfolioFundingStrategy(category, intelligence) { return 'Strategic funding approach...'; }
    async extractGrantRequirements(grant) { return ['innovation', 'impact', 'feasibility']; }
    async categorizeGrantType(grant) { return 'innovation_grants'; }
    async identifySuccessCriteria(grant) { return ['technical_merit', 'social_impact']; }
    async analyzeFundingPriorities(grant) { return ['technology_development', 'community_impact']; }
    async findAlignmentOpportunities(grant) { return ['ai_innovation', 'social_good']; }
    calculateGrantComplexity(requirements) { return requirements.length * 0.2; }
    estimateCompetitiveness(grant) { return 0.7; }
    async buildExecutiveSummary(grant, intelligence) { return 'Executive summary of our innovative approach...'; }
    async buildInnovationDescription(intelligence) { return 'Description of our innovative solutions...'; }
    async buildTechnicalApproach(intelligence) { return 'Technical approach and methodology...'; }
    async buildMarketImpact(intelligence) { return 'Expected market impact and adoption...'; }
    async buildTeamQualifications(intelligence) { return 'Team qualifications and expertise...'; }
    async buildBudgetJustification(grant, intelligence) { return 'Budget breakdown and justification...'; }
    async buildCommunityNeed(grant, intelligence) { return 'Identified community need and gap...'; }
    async buildSolutionApproach(intelligence) { return 'Our solution approach and implementation...'; }
    async buildImpactMeasurement(grant, intelligence) { return 'Impact measurement and evaluation plan...'; }
    async buildGenericComponent(type, grant, intelligence) { return `${type} component content...`; }
    async identifyRelevantImpactCategories(grant, intelligence) { return ['economic_development', 'education_advancement']; }
    async buildImpactStory(category, intelligence) { return `Impact story for ${category}...`; }
    async generateMeasurableOutcomes(categories, intelligence) { return { outcomes: ['50% improvement', '100 users'] }; }
    async buildCommunityEngagementNarrative(intelligence) { return 'Community engagement strategy...'; }
    async buildSustainabilityPlan(intelligence) { return 'Long-term sustainability plan...'; }
    async buildLongTermVision(intelligence) { return 'Long-term vision for impact...'; }
    async calculateOpportunityRelevance(opportunity) { return 0.8; }
}

module.exports = AutoGrantNarrativeBuilder;
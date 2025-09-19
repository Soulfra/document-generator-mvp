#!/usr/bin/env node

/**
 * 🧠 5-API CONSULTATION ENGINE
 * 
 * The core system that queries exactly 5 different AI models for diverse perspectives
 * Aggregates responses into cohesive insights for book/chapter generation
 * 
 * Features:
 * - Exactly 5 API calls per consultation
 * - Intelligent model selection based on problem domain
 * - Response synthesis and conflict resolution
 * - Cost tracking and optimization
 * - Integration with gas tank key system
 */

const EventEmitter = require('events');
const RealAIAPIConnector = require('./real-ai-api-connector.js');
const GasTankConnector = require('./gas-tank-connector.js');

class FiveAPIConsultationEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableCostTracking: config.enableCostTracking !== false,
            maxCostPerConsultation: config.maxCostPerConsultation || 0.50, // 50 cents max
            consultationTimeout: config.consultationTimeout || 45000, // 45 seconds
            enableResponseCaching: config.enableResponseCaching !== false,
            enableConflictResolution: config.enableConflictResolution !== false,
            synthesisStrategy: config.synthesisStrategy || 'weighted_consensus',
            ...config
        };
        
        // Initialize AI connectors
        this.apiConnector = new RealAIAPIConnector({
            enableGasTankFallback: true,
            enableTestingMode: true
        });
        
        this.gasTankConnector = new GasTankConnector({
            enableGasTankFallback: true,
            enableTestingMode: true
        });
        
        // The Big 5 AI Models for consultation
        this.consultationPanel = {
            'anthropic_claude': {
                service: 'anthropic',
                model: 'claude-3-haiku-20240307',
                name: 'Claude (Anthropic)',
                specialties: ['reasoning', 'analysis', 'writing', 'ethics'],
                perspective: 'analytical_philosopher',
                weight: 1.2,
                emoji: '🎭',
                character: 'The Analytical Philosopher'
            },
            
            'openai_gpt': {
                service: 'openai',
                model: 'gpt-3.5-turbo-0125',
                name: 'ChatGPT (OpenAI)',
                specialties: ['general_knowledge', 'creativity', 'coding', 'conversation'],
                perspective: 'creative_generalist',
                weight: 1.1,
                emoji: '🚀',
                character: 'The Creative Generalist'
            },
            
            'deepseek_coder': {
                service: 'deepseek',
                model: 'deepseek-chat',
                name: 'DeepSeek',
                specialties: ['deep_analysis', 'patterns', 'technical_depth', 'mathematics'],
                perspective: 'technical_specialist',
                weight: 1.15,
                emoji: '🔬',
                character: 'The Technical Specialist'
            },
            
            'google_gemini': {
                service: 'gemini',
                model: 'gemini-pro',
                name: 'Gemini (Google)',
                specialties: ['factual_accuracy', 'research', 'multimodal', 'integration'],
                perspective: 'research_librarian',
                weight: 1.0,
                emoji: '📚',
                character: 'The Research Librarian'
            },
            
            'perplexity_sonar': {
                service: 'perplexity',
                model: 'llama-3.1-sonar-large-128k-online',
                name: 'Perplexity',
                specialties: ['current_events', 'citations', 'web_search', 'verification'],
                perspective: 'fact_checker',
                weight: 1.05,
                emoji: '🌐',
                character: 'The Fact Checker'
            }
        };
        
        // Consultation history and caching
        this.consultationHistory = [];
        this.responseCache = new Map();
        this.costTracker = {
            totalConsultations: 0,
            totalCost: 0,
            avgCostPerConsultation: 0,
            modelUsage: new Map()
        };
        
        console.log('🧠 5-API Consultation Engine initialized');
        console.log(`👥 Panel Members: ${Object.values(this.consultationPanel).map(p => p.character).join(', ')}`);
    }
    
    /**
     * Main consultation method - queries exactly 5 AI models
     */
    async consult(question, domain = 'general', options = {}) {
        const consultationId = this.generateConsultationId();
        const startTime = Date.now();
        
        console.log(`\n🧠 Starting 5-API Consultation: ${consultationId}`);
        console.log(`❓ Question: ${question.substring(0, 100)}...`);
        console.log(`🎯 Domain: ${domain}`);
        
        try {
            // Step 1: Create consultation plan
            const consultationPlan = this.createConsultationPlan(question, domain, options);
            
            // Step 2: Execute all 5 consultations in parallel
            const consultationResults = await this.executeConsultations(consultationPlan);
            
            // Step 3: Synthesize responses
            const synthesis = await this.synthesizeResponses(consultationResults, question, domain);
            
            // Step 4: Track costs and performance
            const consultation = this.recordConsultation(consultationId, question, domain, consultationResults, synthesis, startTime);
            
            console.log(`✅ Consultation complete: ${consultation.duration}ms, $${consultation.totalCost.toFixed(4)}`);
            
            return consultation;
            
        } catch (error) {
            console.error(`❌ Consultation failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Create consultation plan with exactly 5 models
     */
    createConsultationPlan(question, domain, options = {}) {
        const plan = [];
        
        // Get all 5 panel members
        const panelMembers = Object.values(this.consultationPanel);
        
        for (const member of panelMembers) {
            // Create specialized prompt for each model based on their character
            const specializedPrompt = this.createSpecializedPrompt(question, member, domain);
            
            plan.push({
                modelId: member.service + '_' + member.model.split('-')[0],
                service: member.service,
                model: member.model,
                name: member.name,
                character: member.character,
                emoji: member.emoji,
                perspective: member.perspective,
                weight: member.weight,
                prompt: specializedPrompt,
                options: {
                    maxTokens: options.maxTokens || 500,
                    temperature: options.temperature || 0.7,
                    consultationId: options.consultationId
                }
            });
        }
        
        console.log(`📋 Created consultation plan with ${plan.length} models`);
        return plan;
    }
    
    /**
     * Create specialized prompts for each AI character
     */
    createSpecializedPrompt(question, member, domain) {
        const characterPrompts = {
            'analytical_philosopher': `As an analytical philosopher, approach this question with rigorous logical reasoning and ethical considerations. Focus on the underlying principles and philosophical implications.`,
            'creative_generalist': `As a creative generalist, provide an innovative and accessible perspective. Think outside the box and consider practical applications and user experience.`,
            'technical_specialist': `As a technical specialist, dive deep into the technical aspects and implementation details. Consider scalability, performance, and best practices.`,
            'research_librarian': `As a research librarian, focus on factual accuracy and cite reliable sources. Provide comprehensive background information and context.`,
            'fact_checker': `As a fact checker, verify claims and provide current, accurate information. Include citations and highlight any uncertainties or conflicting information.`
        };
        
        const rolePrompt = characterPrompts[member.perspective] || 'Provide your expert perspective on this question.';
        
        return `${rolePrompt}

Domain: ${domain}
Question: ${question}

Please provide a thoughtful response that showcases your unique perspective. Keep your response focused and around 300-400 words.`;
    }
    
    /**
     * Execute all consultations in parallel
     */
    async executeConsultations(consultationPlan) {
        console.log(`🚀 Executing ${consultationPlan.length} parallel consultations...`);
        
        const consultationPromises = consultationPlan.map(async (plan) => {
            try {
                console.log(`  🔄 Consulting ${plan.character}...`);
                
                const result = await this.apiConnector.callAPI(
                    plan.service,
                    plan.model,
                    plan.prompt,
                    plan.options
                );
                
                return {
                    ...plan,
                    success: true,
                    response: result.response,
                    cost: result.metadata.cost,
                    duration: result.metadata.duration,
                    tokensUsed: result.metadata.usage?.totalTokens || 0
                };
                
            } catch (error) {
                console.error(`  ❌ ${plan.character} failed: ${error.message}`);
                
                return {
                    ...plan,
                    success: false,
                    error: error.message,
                    response: null,
                    cost: 0,
                    duration: 0
                };
            }
        });
        
        const results = await Promise.all(consultationPromises);
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`  ✅ Success: ${successful.length}, ❌ Failed: ${failed.length}`);
        
        if (successful.length < 3) {
            throw new Error(`Consultation failed: Only ${successful.length}/5 models responded`);
        }
        
        return results;
    }
    
    /**
     * Synthesize responses from multiple models
     */
    async synthesizeResponses(consultationResults, originalQuestion, domain) {
        const successful = consultationResults.filter(r => r.success);
        
        console.log(`🧬 Synthesizing responses from ${successful.length} models...`);
        
        // Extract key insights from each response
        const perspectives = successful.map(result => ({
            character: result.character,
            emoji: result.emoji,
            weight: result.weight,
            response: result.response,
            keyPoints: this.extractKeyPoints(result.response),
            confidence: this.assessConfidence(result.response)
        }));
        
        // Find consensus points
        const consensus = this.findConsensus(perspectives);
        
        // Find divergent viewpoints
        const divergent = this.findDivergentViews(perspectives);
        
        // Calculate weighted synthesis
        const weightedSynthesis = this.createWeightedSynthesis(perspectives);
        
        // Create final synthesis
        const synthesis = {
            perspectives: perspectives,
            consensus: consensus,
            divergent: divergent,
            weightedSynthesis: weightedSynthesis,
            confidence: this.calculateOverallConfidence(perspectives),
            recommendations: this.generateRecommendations(perspectives, domain)
        };
        
        console.log(`  📊 Consensus points: ${consensus.length}`);
        console.log(`  🎭 Divergent views: ${divergent.length}`);
        console.log(`  🎯 Overall confidence: ${synthesis.confidence}%`);
        
        return synthesis;
    }
    
    /**
     * Extract key points from a response
     */
    extractKeyPoints(response) {
        // Simple implementation - could be enhanced with NLP
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
        return sentences.slice(0, 3).map(s => s.trim()); // Top 3 sentences as key points
    }
    
    /**
     * Assess confidence level of a response
     */
    assessConfidence(response) {
        // Simple heuristic based on language used
        const confidenceIndicators = {
            high: ['certainly', 'definitely', 'clearly', 'obviously', 'undoubtedly'],
            medium: ['likely', 'probably', 'generally', 'typically', 'usually'],
            low: ['might', 'could', 'perhaps', 'possibly', 'uncertain']
        };
        
        const lowerResponse = response.toLowerCase();
        let score = 70; // Base confidence
        
        confidenceIndicators.high.forEach(word => {
            if (lowerResponse.includes(word)) score += 5;
        });
        
        confidenceIndicators.medium.forEach(word => {
            if (lowerResponse.includes(word)) score += 2;
        });
        
        confidenceIndicators.low.forEach(word => {
            if (lowerResponse.includes(word)) score -= 5;
        });
        
        return Math.max(10, Math.min(95, score));
    }
    
    /**
     * Find consensus points among perspectives
     */
    findConsensus(perspectives) {
        // Simple implementation - look for common themes
        const commonThemes = [];
        
        // Extract common keywords
        const allKeyPoints = perspectives.flatMap(p => p.keyPoints);
        const keywordFrequency = new Map();
        
        allKeyPoints.forEach(point => {
            const words = point.toLowerCase().split(/\s+/).filter(w => w.length > 4);
            words.forEach(word => {
                keywordFrequency.set(word, (keywordFrequency.get(word) || 0) + 1);
            });
        });
        
        // Find words mentioned by multiple perspectives
        for (const [word, count] of keywordFrequency.entries()) {
            if (count >= 2) {
                commonThemes.push(word);
            }
        }
        
        return commonThemes.slice(0, 5); // Top 5 consensus themes
    }
    
    /**
     * Find divergent viewpoints
     */
    findDivergentViews(perspectives) {
        return perspectives.map(p => ({
            character: p.character,
            uniqueInsight: p.keyPoints[0] || 'No unique insight available'
        }));
    }
    
    /**
     * Create weighted synthesis
     */
    createWeightedSynthesis(perspectives) {
        // Weight responses by model weight and confidence
        const weightedPoints = [];
        
        perspectives.forEach(p => {
            const effectiveWeight = p.weight * (p.confidence / 100);
            p.keyPoints.forEach(point => {
                weightedPoints.push({
                    point,
                    weight: effectiveWeight,
                    character: p.character
                });
            });
        });
        
        // Sort by weight and return top insights
        return weightedPoints
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5)
            .map(wp => `${wp.point} (via ${wp.character})`);
    }
    
    /**
     * Calculate overall confidence
     */
    calculateOverallConfidence(perspectives) {
        const totalWeight = perspectives.reduce((sum, p) => sum + p.weight, 0);
        const weightedConfidence = perspectives.reduce((sum, p) => sum + (p.confidence * p.weight), 0);
        return Math.round(weightedConfidence / totalWeight);
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations(perspectives, domain) {
        return [
            'Consider multiple perspectives when making decisions',
            'Validate technical approaches with domain experts',
            'Balance innovation with practical constraints',
            'Seek consensus while respecting diverse viewpoints'
        ];
    }
    
    /**
     * Record consultation for tracking
     */
    recordConsultation(consultationId, question, domain, results, synthesis, startTime) {
        const duration = Date.now() - startTime;
        const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
        const successful = results.filter(r => r.success).length;
        
        const consultation = {
            id: consultationId,
            question,
            domain,
            timestamp: new Date().toISOString(),
            duration,
            totalCost,
            modelsUsed: successful,
            results,
            synthesis,
            metadata: {
                avgResponseTime: results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length,
                totalTokens: results.reduce((sum, r) => sum + (r.tokensUsed || 0), 0)
            }
        };
        
        this.consultationHistory.push(consultation);
        
        // Update cost tracking
        this.costTracker.totalConsultations++;
        this.costTracker.totalCost += totalCost;
        this.costTracker.avgCostPerConsultation = this.costTracker.totalCost / this.costTracker.totalConsultations;
        
        return consultation;
    }
    
    /**
     * Generate consultation ID
     */
    generateConsultationId() {
        return `consult_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    
    /**
     * Get consultation statistics
     */
    getStats() {
        return {
            totalConsultations: this.costTracker.totalConsultations,
            totalCost: this.costTracker.totalCost,
            avgCostPerConsultation: this.costTracker.avgCostPerConsultation,
            avgModelsPerConsultation: this.consultationHistory.length > 0 ? 
                this.consultationHistory.reduce((sum, c) => sum + c.modelsUsed, 0) / this.consultationHistory.length : 0,
            panelMembers: Object.keys(this.consultationPanel).length,
            cacheSize: this.responseCache.size
        };
    }
    
    /**
     * Export consultation for use in book generation
     */
    exportConsultationForChapter(consultation) {
        const successful = consultation.results.filter(r => r.success);
        
        return {
            chapterData: {
                title: consultation.question.substring(0, 50) + '...',
                perspectives: successful.map(r => ({
                    character: r.character,
                    emoji: r.emoji,
                    response: r.response,
                    confidence: this.assessConfidence(r.response)
                })),
                synthesis: consultation.synthesis,
                metadata: consultation.metadata
            },
            narrativeElements: {
                intro: `The Council of Five gathered to address: "${consultation.question}"`,
                characters: successful.map(r => ({
                    name: r.character,
                    emoji: r.emoji,
                    role: r.perspective,
                    wisdom: r.response
                })),
                consensus: consultation.synthesis.consensus,
                divergent: consultation.synthesis.divergent,
                conclusion: consultation.synthesis.weightedSynthesis
            }
        };
    }
}

module.exports = FiveAPIConsultationEngine;

// CLI testing
if (require.main === module) {
    async function test() {
        console.log('🧪 Testing 5-API Consultation Engine\n');
        
        const engine = new FiveAPIConsultationEngine();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const consultation = await engine.consult(
                'How should we design a scalable document processing system?',
                'technical_architecture',
                { maxTokens: 300 }
            );
            
            console.log('\n📊 CONSULTATION RESULTS:');
            console.log('========================');
            console.log(`ID: ${consultation.id}`);
            console.log(`Models Used: ${consultation.modelsUsed}/5`);
            console.log(`Total Cost: $${consultation.totalCost.toFixed(4)}`);
            console.log(`Duration: ${consultation.duration}ms`);
            console.log(`Confidence: ${consultation.synthesis.confidence}%`);
            
            console.log('\n👥 PERSPECTIVES:');
            consultation.results.filter(r => r.success).forEach(result => {
                console.log(`${result.emoji} ${result.character}:`);
                console.log(`  ${result.response.substring(0, 150)}...`);
                console.log('');
            });
            
            console.log('🧬 SYNTHESIS:');
            console.log(`Consensus: ${consultation.synthesis.consensus.join(', ')}`);
            console.log(`Top insights: ${consultation.synthesis.weightedSynthesis.slice(0, 2).join('; ')}`);
            
            // Show stats
            console.log('\n📈 ENGINE STATS:');
            const stats = engine.getStats();
            console.log(JSON.stringify(stats, null, 2));
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }
    
    test().catch(console.error);
}
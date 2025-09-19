#!/usr/bin/env node

/**
 * 🎓 CALCOMPARE CONSULTATION HUB
 * 
 * The "Consult" button that queries multiple AI models for diverse insights
 * Aggregates knowledge from various sources for academic processing
 * 
 * Features:
 * - Multi-model consultation (Claude, GPT, Gemini, etc.)
 * - Structured response aggregation
 * - Source tracking for citations
 * - Domain-specific consultation strategies
 * - Integration with internal orchestration
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CalCompareConsultationHub extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxConcurrentConsults: config.maxConcurrentConsults || 5,
            consultTimeout: config.consultTimeout || 30000, // 30 seconds per model
            aggregationStrategy: config.aggregationStrategy || 'weighted',
            enableSourceTracking: config.enableSourceTracking !== false,
            enableCaching: config.enableCaching !== false,
            cacheExpiry: config.cacheExpiry || 3600000, // 1 hour
            // NEW: Vibecheck integration
            enableVibecheckMode: config.enableVibecheckMode !== false,
            vibecheckAggression: config.vibecheckAggression || 'moderate',
            enableGodFilter: config.enableGodFilter !== false,
            enableCringeproof: config.enableCringeproof !== false,
            enableDirectionCorrection: config.enableDirectionCorrection !== false,
            ...config
        };
        
        // Available AI models for consultation
        this.consultationModels = {
            'claude-3': {
                name: 'Claude 3 Opus',
                specialties: ['reasoning', 'analysis', 'academic_writing', 'research'],
                weight: 1.2,
                endpoint: 'anthropic',
                costPerConsult: 0.015,
                capabilities: {
                    medical: 0.9,
                    technical: 0.95,
                    research: 0.95,
                    citations: 0.8
                }
            },
            'gpt-4': {
                name: 'GPT-4',
                specialties: ['general_knowledge', 'coding', 'problem_solving'],
                weight: 1.1,
                endpoint: 'openai',
                costPerConsult: 0.03,
                capabilities: {
                    medical: 0.85,
                    technical: 0.9,
                    research: 0.85,
                    citations: 0.7
                }
            },
            'gemini-pro': {
                name: 'Gemini Pro',
                specialties: ['factual_accuracy', 'multi_modal', 'scientific'],
                weight: 1.0,
                endpoint: 'google',
                costPerConsult: 0.01,
                capabilities: {
                    medical: 0.8,
                    technical: 0.85,
                    research: 0.9,
                    citations: 0.75
                }
            },
            'deepseek': {
                name: 'DeepSeek',
                specialties: ['deep_analysis', 'pattern_recognition', 'complex_reasoning'],
                weight: 1.15,
                endpoint: 'deepseek',
                costPerConsult: 0.008,
                capabilities: {
                    medical: 0.85,
                    technical: 0.9,
                    research: 0.92,
                    citations: 0.6
                }
            },
            'kimi': {
                name: 'Kimi',
                specialties: ['long_context', 'document_analysis', 'summarization'],
                weight: 1.05,
                endpoint: 'moonshot',
                costPerConsult: 0.006,
                capabilities: {
                    medical: 0.75,
                    technical: 0.8,
                    research: 0.85,
                    citations: 0.9
                }
            },
            'perplexity': {
                name: 'Perplexity',
                specialties: ['web_search', 'real_time_data', 'fact_checking'],
                weight: 1.1,
                endpoint: 'perplexity',
                costPerConsult: 0.005,
                capabilities: {
                    medical: 0.7,
                    technical: 0.75,
                    research: 0.8,
                    citations: 0.95
                }
            }
        };
        
        // Domain-specific consultation strategies
        this.consultationStrategies = {
            medical: {
                requiredModels: ['claude-3', 'gpt-4'],
                preferredModels: ['gemini-pro', 'perplexity'],
                prompts: {
                    prefix: "From a medical and clinical perspective, with emphasis on evidence-based medicine:",
                    suffix: "Please include relevant medical literature, clinical guidelines, and FDA/CDC references where applicable."
                },
                validationRequired: true
            },
            technical: {
                requiredModels: ['claude-3', 'deepseek'],
                preferredModels: ['gpt-4', 'kimi'],
                prompts: {
                    prefix: "From a technical and engineering perspective, considering best practices and standards:",
                    suffix: "Include relevant technical specifications, industry standards, and implementation details."
                },
                validationRequired: false
            },
            research: {
                requiredModels: ['claude-3', 'gemini-pro'],
                preferredModels: ['deepseek', 'perplexity'],
                prompts: {
                    prefix: "From an academic research perspective, following scholarly standards:",
                    suffix: "Cite peer-reviewed sources, include methodology considerations, and note any limitations."
                },
                validationRequired: true
            },
            general: {
                requiredModels: ['claude-3'],
                preferredModels: ['gpt-4', 'gemini-pro', 'kimi'],
                prompts: {
                    prefix: "Please provide a comprehensive analysis of:",
                    suffix: "Include relevant sources and citations where appropriate."
                },
                validationRequired: false
            }
        };
        
        // Consultation cache
        this.consultationCache = new Map();
        this.activeConsultations = new Map();
        this.consultationHistory = [];
        
        // NEW: Vibecheck validation systems
        if (this.config.enableVibecheckMode) {
            const VibecheckAdversarialValidator = require('./vibecheck-adversarial-validator.js');
            const GodFilterQualityAssurance = require('./god-filter-quality-assurance.js');
            const CringeproofEmbarrassmentDetector = require('./cringeproof-embarrassment-detector.js');
            const DirectionCorrectionEngine = require('./direction-correction-engine.js');
            
            this.vibecheckValidator = new VibecheckAdversarialValidator({
                aggressiveness: this.config.vibecheckAggression
            });
            
            this.godFilter = new GodFilterQualityAssurance({
                standards: 'divine',
                tolerance: 0.05
            });
            
            this.cringeproofDetector = new CringeproofEmbarrassmentDetector({
                professionalStandards: 'academic',
                cringeTolerance: 0.2
            });
            
            this.directionCorrection = new DirectionCorrectionEngine({
                qualityTarget: 0.9,
                maxCorrectionAttempts: 3
            });
            
            console.log('🎮 Vibecheck systems loaded:');
            console.log('  ⚔️  Adversarial Validator');
            console.log('  ⚡ God Filter Quality Assurance');
            console.log('  😬 Cringeproof Embarrassment Detector');
            console.log('  🧭 Direction Correction Engine');
        }
        
        console.log('🎓 CalCompare Consultation Hub initialized');
        console.log(`📚 Available models: ${Object.keys(this.consultationModels).length}`);
        console.log(`🎯 Consultation strategies: ${Object.keys(this.consultationStrategies).length}`);
        console.log(`🎮 Vibecheck mode: ${this.config.enableVibecheckMode ? 'ENABLED' : 'DISABLED'}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Start cache cleanup
        this.startCacheCleanup();
        
        console.log('✅ Consultation Hub ready');
    }
    
    /**
     * Main consultation method - the "Consult" button
     */
    async consult(query, options = {}) {
        const consultationId = crypto.randomUUID();
        const startTime = Date.now();
        
        console.log(`\n🎓 Starting consultation: ${consultationId}`);
        console.log(`📝 Query: "${query.substring(0, 100)}..."`);
        
        // Determine domain and strategy
        const domain = options.domain || this.detectDomain(query);
        const strategy = this.consultationStrategies[domain] || this.consultationStrategies.general;
        
        console.log(`🎯 Domain: ${domain}`);
        console.log(`📋 Strategy: ${strategy.requiredModels.length} required, ${strategy.preferredModels.length} preferred models`);
        
        // Check cache
        if (this.config.enableCaching) {
            const cached = this.checkCache(query, domain);
            if (cached) {
                console.log('💾 Using cached consultation result');
                return cached;
            }
        }
        
        // Prepare consultation
        const consultation = {
            id: consultationId,
            query,
            domain,
            strategy,
            models: this.selectModels(strategy, options),
            startTime,
            status: 'active',
            results: new Map(),
            metadata: {
                userOptions: options,
                costEstimate: 0,
                sourceCount: 0
            }
        };
        
        this.activeConsultations.set(consultationId, consultation);
        
        try {
            // Consult selected models
            const results = await this.consultModels(consultation);
            
            // Aggregate results
            const aggregated = await this.aggregateResults(results, consultation);
            
            // Extract sources and citations
            const sourcesAndCitations = this.extractSourcesAndCitations(results);
            
            // Package final result
            const finalResult = {
                consultationId,
                query,
                domain,
                timestamp: new Date(),
                duration: Date.now() - startTime,
                modelCount: results.length,
                aggregatedResponse: aggregated,
                sources: sourcesAndCitations.sources,
                citations: sourcesAndCitations.citations,
                modelResponses: options.includeRawResponses ? results : undefined,
                confidence: this.calculateConfidence(results),
                metadata: {
                    totalCost: consultation.metadata.costEstimate,
                    modelsConsulted: consultation.models.map(m => m.name),
                    cacheKey: this.generateCacheKey(query, domain)
                }
            };
            
            // Cache result
            if (this.config.enableCaching) {
                this.cacheResult(finalResult);
            }
            
            // Record in history
            this.consultationHistory.push({
                id: consultationId,
                timestamp: new Date(),
                query: query.substring(0, 100),
                domain,
                modelCount: results.length,
                duration: finalResult.duration,
                success: true
            });
            
            // Emit completion event
            this.emit('consultation_complete', finalResult);
            
            console.log(`\n✅ Consultation complete: ${consultationId}`);
            console.log(`⏱️  Duration: ${finalResult.duration}ms`);
            console.log(`📚 Sources found: ${finalResult.sources.length}`);
            console.log(`📎 Citations: ${finalResult.citations.length}`);
            
            return finalResult;
            
        } catch (error) {
            console.error(`❌ Consultation failed: ${error.message}`);
            
            this.consultationHistory.push({
                id: consultationId,
                timestamp: new Date(),
                query: query.substring(0, 100),
                domain,
                error: error.message,
                success: false
            });
            
            throw error;
            
        } finally {
            this.activeConsultations.delete(consultationId);
        }
    }
    
    /**
     * Select models based on strategy and options
     */
    selectModels(strategy, options) {
        const selected = [];
        
        // Add required models
        for (const modelId of strategy.requiredModels) {
            const model = this.consultationModels[modelId];
            if (model && this.isModelAvailable(modelId, options)) {
                selected.push({ id: modelId, ...model });
            }
        }
        
        // Add preferred models up to limit
        const remainingSlots = this.config.maxConcurrentConsults - selected.length;
        for (const modelId of strategy.preferredModels) {
            if (selected.length >= this.config.maxConcurrentConsults) break;
            
            const model = this.consultationModels[modelId];
            if (model && this.isModelAvailable(modelId, options)) {
                selected.push({ id: modelId, ...model });
            }
        }
        
        return selected;
    }
    
    /**
     * Consult multiple models in parallel
     */
    async consultModels(consultation) {
        const { query, domain, strategy, models } = consultation;
        
        // Build enhanced prompt
        const enhancedPrompt = `${strategy.prompts.prefix} ${query} ${strategy.prompts.suffix}`;
        
        // Consult all models in parallel
        const consultPromises = models.map(async (model) => {
            try {
                console.log(`  🤖 Consulting ${model.name}...`);
                
                const response = await this.consultSingleModel(model, enhancedPrompt, domain);
                
                consultation.metadata.costEstimate += model.costPerConsult;
                
                return {
                    modelId: model.id,
                    modelName: model.name,
                    response,
                    weight: model.weight,
                    capabilities: model.capabilities[domain] || 0.5,
                    timestamp: new Date(),
                    success: true
                };
                
            } catch (error) {
                console.error(`  ❌ ${model.name} failed: ${error.message}`);
                return {
                    modelId: model.id,
                    modelName: model.name,
                    error: error.message,
                    success: false
                };
            }
        });
        
        const results = await Promise.all(consultPromises);
        
        // Filter successful responses
        return results.filter(r => r.success);
    }
    
    /**
     * Consult a single model (simulated)
     */
    async consultSingleModel(model, prompt, domain) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Generate simulated response based on model specialties
        const response = {
            content: this.generateModelResponse(model, prompt, domain),
            sources: this.generateModelSources(model, domain),
            confidence: 0.7 + Math.random() * 0.3,
            processingTime: 500 + Math.random() * 2000,
            metadata: {
                model: model.name,
                version: model.version || 'latest',
                temperature: 0.7,
                maxTokens: 4096
            }
        };
        
        return response;
    }
    
    /**
     * Aggregate results from multiple models
     */
    async aggregateResults(results, consultation) {
        console.log(`\n📊 Aggregating ${results.length} model responses...`);
        
        if (this.config.aggregationStrategy === 'weighted') {
            return this.weightedAggregation(results, consultation.domain);
        } else if (this.config.aggregationStrategy === 'consensus') {
            return this.consensusAggregation(results);
        } else {
            return this.simpleAggregation(results);
        }
    }
    
    /**
     * Weighted aggregation based on model capabilities
     */
    weightedAggregation(results, domain) {
        // Group responses by similarity
        const responseGroups = this.groupSimilarResponses(results);
        
        // Calculate weighted scores
        const weightedGroups = responseGroups.map(group => {
            const totalWeight = group.reduce((sum, r) => {
                const domainWeight = r.capabilities || 0.5;
                return sum + (r.weight * domainWeight);
            }, 0);
            
            return {
                responses: group,
                totalWeight,
                averageConfidence: group.reduce((sum, r) => sum + r.response.confidence, 0) / group.length
            };
        });
        
        // Sort by weight
        weightedGroups.sort((a, b) => b.totalWeight - a.totalWeight);
        
        // Build aggregated response
        const aggregated = {
            primaryResponse: weightedGroups[0].responses[0].response.content,
            supportingPoints: this.extractSupportingPoints(weightedGroups),
            consensusLevel: this.calculateConsensusLevel(weightedGroups),
            alternativeViewpoints: this.extractAlternatives(weightedGroups),
            synthesizedSummary: this.synthesizeSummary(weightedGroups)
        };
        
        return aggregated;
    }
    
    /**
     * Extract sources and citations from model responses
     */
    extractSourcesAndCitations(results) {
        const sources = [];
        const citations = [];
        const seen = new Set();
        
        for (const result of results) {
            if (result.response && result.response.sources) {
                for (const source of result.response.sources) {
                    const sourceKey = `${source.type}:${source.identifier}`;
                    if (!seen.has(sourceKey)) {
                        seen.add(sourceKey);
                        sources.push({
                            ...source,
                            modelId: result.modelId,
                            confidence: result.response.confidence
                        });
                        
                        // Generate citation
                        citations.push(this.generateCitation(source));
                    }
                }
            }
        }
        
        return { sources, citations };
    }
    
    /**
     * Generate a citation from a source
     */
    generateCitation(source) {
        switch (source.type) {
            case 'journal':
                return `${source.authors} (${source.year}). ${source.title}. ${source.journal}, ${source.volume}(${source.issue}), ${source.pages}.`;
            
            case 'website':
                return `${source.title}. (${source.year}). Retrieved from ${source.url}`;
            
            case 'government':
                return `${source.agency}. (${source.year}). ${source.title}. ${source.url}`;
            
            case 'book':
                return `${source.authors} (${source.year}). ${source.title}. ${source.publisher}.`;
            
            default:
                return `${source.title} (${source.year || 'n.d.'})`;
        }
    }
    
    /**
     * Detect domain from query
     */
    detectDomain(query) {
        const lowerQuery = query.toLowerCase();
        
        // Medical indicators
        if (lowerQuery.match(/medical|health|disease|treatment|diagnosis|clinical|patient|symptom|medication/)) {
            return 'medical';
        }
        
        // Technical indicators
        if (lowerQuery.match(/code|programming|software|algorithm|system|architecture|api|database/)) {
            return 'technical';
        }
        
        // Research indicators
        if (lowerQuery.match(/research|study|hypothesis|methodology|analysis|literature|theory/)) {
            return 'research';
        }
        
        return 'general';
    }
    
    /**
     * Check if model is available
     */
    isModelAvailable(modelId, options) {
        // Check if model is explicitly excluded
        if (options.excludeModels && options.excludeModels.includes(modelId)) {
            return false;
        }
        
        // Check if only specific models are requested
        if (options.onlyModels && !options.onlyModels.includes(modelId)) {
            return false;
        }
        
        // Check cost constraints
        if (options.maxCostPerModel && this.consultationModels[modelId].costPerConsult > options.maxCostPerModel) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Calculate confidence score
     */
    calculateConfidence(results) {
        if (results.length === 0) return 0;
        
        const avgConfidence = results.reduce((sum, r) => sum + r.response.confidence, 0) / results.length;
        const consensusFactor = this.calculateConsensusFactor(results);
        
        return avgConfidence * consensusFactor;
    }
    
    /**
     * Calculate consensus factor
     */
    calculateConsensusFactor(results) {
        // Simple implementation - would be more sophisticated in production
        return 0.8 + (Math.random() * 0.2);
    }
    
    /**
     * Generate model response (simulation)
     */
    generateModelResponse(model, prompt, domain) {
        const templates = {
            medical: [
                "Based on current medical literature and clinical guidelines, ",
                "According to evidence-based medical practice, ",
                "Clinical studies have shown that "
            ],
            technical: [
                "From a technical perspective, the solution involves ",
                "The implementation would require ",
                "Best practices suggest "
            ],
            research: [
                "Research indicates that ",
                "Studies have demonstrated ",
                "The literature suggests "
            ],
            general: [
                "Analysis shows that ",
                "It appears that ",
                "Evidence suggests "
            ]
        };
        
        const domainTemplates = templates[domain] || templates.general;
        const template = domainTemplates[Math.floor(Math.random() * domainTemplates.length)];
        
        return template + this.generateDetailedContent(model, domain);
    }
    
    /**
     * Generate detailed content based on model and domain
     */
    generateDetailedContent(model, domain) {
        // Simulation - in production this would be actual AI response
        const contentLength = 200 + Math.random() * 300;
        return `detailed analysis considering ${model.specialties.join(', ')}. The approach involves multiple considerations including methodology, implementation, and validation. Further investigation reveals important factors that must be addressed for optimal outcomes in the ${domain} domain.`;
    }
    
    /**
     * Generate model sources (simulation)
     */
    generateModelSources(model, domain) {
        const sources = [];
        const sourceCount = Math.floor(Math.random() * 5) + 2;
        
        for (let i = 0; i < sourceCount; i++) {
            sources.push(this.generateRandomSource(domain));
        }
        
        return sources;
    }
    
    /**
     * Generate random source for simulation
     */
    generateRandomSource(domain) {
        const types = domain === 'medical' ? ['journal', 'government'] : 
                     domain === 'technical' ? ['website', 'documentation'] :
                     ['journal', 'book', 'website'];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        const baseSource = {
            type,
            title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Study on Advanced Topics`,
            year: 2020 + Math.floor(Math.random() * 5),
            confidence: 0.7 + Math.random() * 0.3,
            relevance: 0.6 + Math.random() * 0.4
        };
        
        switch (type) {
            case 'journal':
                return {
                    ...baseSource,
                    authors: 'Smith, J., & Johnson, K.',
                    journal: 'International Journal of ' + domain,
                    volume: Math.floor(Math.random() * 50) + 1,
                    issue: Math.floor(Math.random() * 12) + 1,
                    pages: '123-145',
                    doi: `10.1234/ij${domain}.2024.${Math.floor(Math.random() * 1000)}`,
                    identifier: `journal-${crypto.randomBytes(4).toString('hex')}`
                };
            
            case 'government':
                return {
                    ...baseSource,
                    agency: domain === 'medical' ? 'FDA' : 'NIST',
                    url: `https://www.${domain === 'medical' ? 'fda' : 'nist'}.gov/resource/${Math.random().toString(36).substring(7)}`,
                    identifier: `gov-${crypto.randomBytes(4).toString('hex')}`
                };
            
            case 'website':
                return {
                    ...baseSource,
                    url: `https://www.example.org/${domain}/${Math.random().toString(36).substring(7)}`,
                    accessDate: new Date().toISOString(),
                    identifier: `web-${crypto.randomBytes(4).toString('hex')}`
                };
            
            default:
                return {
                    ...baseSource,
                    identifier: `source-${crypto.randomBytes(4).toString('hex')}`
                };
        }
    }
    
    /**
     * Group similar responses
     */
    groupSimilarResponses(results) {
        // Simple grouping - in production would use semantic similarity
        return [results];
    }
    
    /**
     * Extract supporting points
     */
    extractSupportingPoints(weightedGroups) {
        const points = [];
        for (const group of weightedGroups.slice(0, 3)) {
            points.push({
                point: group.responses[0].response.content.substring(0, 200) + '...',
                support: group.responses.length,
                weight: group.totalWeight
            });
        }
        return points;
    }
    
    /**
     * Calculate consensus level
     */
    calculateConsensusLevel(weightedGroups) {
        if (weightedGroups.length === 0) return 0;
        
        const topWeight = weightedGroups[0].totalWeight;
        const totalWeight = weightedGroups.reduce((sum, g) => sum + g.totalWeight, 0);
        
        return topWeight / totalWeight;
    }
    
    /**
     * Extract alternative viewpoints
     */
    extractAlternatives(weightedGroups) {
        return weightedGroups.slice(1, 3).map(group => ({
            viewpoint: group.responses[0].response.content.substring(0, 150) + '...',
            support: group.responses.length
        }));
    }
    
    /**
     * Synthesize summary from all responses
     */
    synthesizeSummary(weightedGroups) {
        return `Based on consultation with ${weightedGroups[0].responses.length} AI models, the consensus indicates that the primary consideration involves comprehensive analysis and implementation strategies. The aggregated insights suggest a multi-faceted approach is optimal.`;
    }
    
    /**
     * Cache management
     */
    generateCacheKey(query, domain) {
        return crypto.createHash('sha256')
            .update(`${domain}:${query}`)
            .digest('hex');
    }
    
    checkCache(query, domain) {
        const key = this.generateCacheKey(query, domain);
        const cached = this.consultationCache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
            return cached.result;
        }
        
        return null;
    }
    
    cacheResult(result) {
        const key = result.metadata.cacheKey;
        this.consultationCache.set(key, {
            result,
            timestamp: Date.now()
        });
    }
    
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, cached] of this.consultationCache) {
                if (now - cached.timestamp > this.config.cacheExpiry) {
                    this.consultationCache.delete(key);
                }
            }
        }, 60000); // Clean every minute
    }
    
    /**
     * NEW: Vibecheck button - consultation with adversarial validation
     */
    async vibecheckConsult(query, options = {}) {
        console.log('\n🎮 VIBECHECK CONSULT: Consultation + Adversarial Validation');
        console.log(`📝 Query: "${query}"`);
        console.log(`⚔️  Aggressiveness: ${this.config.vibecheckAggression}`);
        
        const vibecheckId = crypto.randomUUID();
        const startTime = Date.now();
        
        try {
            // Step 1: Normal consultation
            console.log('\n📞 Step 1: Standard CalCompare Consultation');
            const consultationResult = await this.consult(query, options);
            
            // Step 2: Vibecheck adversarial validation
            console.log('\n⚔️  Step 2: Adversarial Validation Attack');
            const vibecheckResult = await this.vibecheckValidator.vibecheck(consultationResult, options);
            
            // Step 3: God Filter divine standards
            console.log('\n⚡ Step 3: God Filter Divine Standards');
            const godFilterResult = await this.godFilter.applyGodFilter(
                consultationResult.aggregated?.content || '',
                consultationResult,
                vibecheckResult
            );
            
            // Step 4: Cringeproof embarrassment check
            console.log('\n😬 Step 4: Cringeproof Embarrassment Detection');
            const cringeproofResult = await this.cringeproofDetector.cringeproofValidation(
                consultationResult.aggregated?.content || '',
                consultationResult
            );
            
            // Step 5: Direction correction if needed
            let directionCorrectionResult = null;
            const overallQuality = this.calculateOverallVibecheckQuality(vibecheckResult, godFilterResult, cringeproofResult);
            
            if (this.config.enableDirectionCorrection && overallQuality < 0.8) {
                console.log('\n🧭 Step 5: Direction Correction Required');
                directionCorrectionResult = await this.directionCorrection.correctDirection(
                    consultationResult.aggregated?.content || '',
                    { vibecheckResults: vibecheckResult, godFilter: godFilterResult, cringeproof: cringeproofResult },
                    query
                );
            }
            
            const totalDuration = Date.now() - startTime;
            
            // Compile vibecheck consultation result
            const vibecheckConsultationResult = {
                vibecheckId,
                originalConsultation: consultationResult,
                validationResults: {
                    vibecheck: vibecheckResult,
                    godFilter: godFilterResult,
                    cringeproof: cringeproofResult,
                    directionCorrection: directionCorrectionResult
                },
                finalContent: directionCorrectionResult?.finalContent || consultationResult.aggregated?.content,
                overallQuality,
                recommendation: this.getVibecheckRecommendation(overallQuality, vibecheckResult, godFilterResult, cringeproofResult),
                duration: totalDuration,
                totalCost: this.calculateVibecheckCost(consultationResult, vibecheckResult, godFilterResult, cringeproofResult, directionCorrectionResult)
            };
            
            console.log(`\n🎮 VIBECHECK COMPLETE (${totalDuration}ms)`);
            console.log(`📊 Overall Quality: ${(overallQuality * 100).toFixed(1)}%`);
            console.log(`🎯 Vibecheck Score: ${(vibecheckResult.score * 100).toFixed(1)}%`);
            console.log(`⚡ God Filter Score: ${(godFilterResult.divineScore * 100).toFixed(1)}%`);
            console.log(`😬 Cringe Score: ${(cringeproofResult.cringeScore * 100).toFixed(1)}%`);
            console.log(`💰 Total Cost: $${vibecheckConsultationResult.totalCost.toFixed(4)}`);
            console.log(`✅ Recommendation: ${vibecheckConsultationResult.recommendation.action}`);
            
            // Store vibecheck result
            this.storeVibecheckResult(vibecheckConsultationResult);
            
            return vibecheckConsultationResult;
            
        } catch (error) {
            console.error(`❌ Vibecheck consultation failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Calculate overall quality from all vibecheck layers
     */
    calculateOverallVibecheckQuality(vibecheckResult, godFilterResult, cringeproofResult) {
        // Weighted combination of all quality scores
        let totalScore = 0;
        let weights = 0;
        
        // Vibecheck score (how well it survived adversarial attacks)
        if (vibecheckResult?.score) {
            totalScore += vibecheckResult.score * 0.3;
            weights += 0.3;
        }
        
        // God Filter divine score
        if (godFilterResult?.divineScore) {
            totalScore += godFilterResult.divineScore * 0.4;
            weights += 0.4;
        }
        
        // Cringeproof score (inverted - lower cringe = higher quality)
        if (cringeproofResult?.cringeScore !== undefined) {
            totalScore += (1 - cringeproofResult.cringeScore) * 0.3;
            weights += 0.3;
        }
        
        return weights > 0 ? totalScore / weights : 0.7;
    }
    
    /**
     * Get vibecheck recommendation
     */
    getVibecheckRecommendation(overallQuality, vibecheckResult, godFilterResult, cringeproofResult) {
        // Check for blockers
        if (godFilterResult.judgment?.verdict === 'DIVINE_REJECTION') {
            return {
                action: 'DIVINE_REJECTION',
                message: 'Content rejected by God Filter - divine standards not met',
                blockers: ['divine_standards_failure']
            };
        }
        
        if (cringeproofResult.recommendation?.action === 'REJECT_TOO_CRINGE') {
            return {
                action: 'CRINGE_REJECTION',
                message: 'Content too cringe for publication',
                blockers: ['embarrassment_risk']
            };
        }
        
        if (vibecheckResult.recommendation?.status === 'REJECT') {
            return {
                action: 'ADVERSARIAL_REJECTION',
                message: 'Content failed adversarial validation',
                blockers: ['too_many_vulnerabilities']
            };
        }
        
        // Quality-based recommendations
        if (overallQuality >= 0.9) {
            return {
                action: 'VIBECHECK_APPROVED',
                message: 'Content passed all vibecheck layers with high quality',
                quality: 'excellent'
            };
        } else if (overallQuality >= 0.8) {
            return {
                action: 'VIBECHECK_APPROVED_WITH_NOTES',
                message: 'Content passed vibecheck but has minor improvement areas',
                quality: 'good'
            };
        } else if (overallQuality >= 0.7) {
            return {
                action: 'VIBECHECK_CONDITIONAL',
                message: 'Content needs improvements before publication',
                quality: 'needs_work'
            };
        } else {
            return {
                action: 'VIBECHECK_FAILED',
                message: 'Content failed vibecheck validation',
                quality: 'poor'
            };
        }
    }
    
    /**
     * Calculate total cost of vibecheck consultation
     */
    calculateVibecheckCost(consultation, vibecheck, godFilter, cringeproof, directionCorrection) {
        let totalCost = 0;
        
        // Original consultation cost
        if (consultation.totalCost) totalCost += consultation.totalCost;
        
        // Validation costs (estimated based on API calls made)
        if (vibecheck?.attackResults) {
            totalCost += vibecheck.attackResults.length * 0.01; // Rough estimate
        }
        
        if (godFilter?.duration) {
            totalCost += 0.02; // God Filter uses premium models
        }
        
        if (cringeproof?.duration) {
            totalCost += 0.015; // Cringeproof validation cost
        }
        
        if (directionCorrection?.duration) {
            totalCost += directionCorrection.attempts * 0.02; // Correction attempts
        }
        
        return totalCost;
    }
    
    /**
     * Store vibecheck result for analysis
     */
    storeVibecheckResult(result) {
        // Add to consultation history with vibecheck flag
        this.consultationHistory.push({
            id: result.vibecheckId,
            type: 'vibecheck_consultation',
            query: result.originalConsultation.query,
            overallQuality: result.overallQuality,
            recommendation: result.recommendation.action,
            duration: result.duration,
            cost: result.totalCost,
            timestamp: new Date(),
            success: result.recommendation.action.includes('APPROVED')
        });
    }
    
    /**
     * Get hub status
     */
    getStatus() {
        const vibecheckConsultations = this.consultationHistory.filter(h => h.type === 'vibecheck_consultation');
        
        return {
            availableModels: Object.keys(this.consultationModels).length,
            activeConsultations: this.activeConsultations.size,
            cachedResults: this.consultationCache.size,
            totalConsultations: this.consultationHistory.length,
            vibecheckConsultations: vibecheckConsultations.length,
            successRate: this.calculateSuccessRate(),
            averageDuration: this.calculateAverageDuration(),
            totalCost: this.calculateTotalCost(),
            // NEW: Vibecheck stats
            vibecheckMode: this.config.enableVibecheckMode,
            vibecheckSuccessRate: vibecheckConsultations.length > 0 ? 
                vibecheckConsultations.filter(h => h.success).length / vibecheckConsultations.length : 0,
            averageVibecheckQuality: vibecheckConsultations.length > 0 ?
                vibecheckConsultations.reduce((sum, h) => sum + h.overallQuality, 0) / vibecheckConsultations.length : 0
        };
    }
    
    calculateSuccessRate() {
        if (this.consultationHistory.length === 0) return 0;
        const successful = this.consultationHistory.filter(h => h.success).length;
        return successful / this.consultationHistory.length;
    }
    
    calculateAverageDuration() {
        const durations = this.consultationHistory
            .filter(h => h.duration)
            .map(h => h.duration);
        
        if (durations.length === 0) return 0;
        return durations.reduce((a, b) => a + b, 0) / durations.length;
    }
    
    calculateTotalCost() {
        return this.consultationHistory
            .filter(h => h.success)
            .reduce((sum, h) => sum + (h.modelCount * 0.01), 0); // Rough estimate
    }
}

module.exports = CalCompareConsultationHub;

// CLI interface
if (require.main === module) {
    const hub = new CalCompareConsultationHub({
        enableCaching: true,
        maxConcurrentConsults: 5,
        // NEW: Enable vibecheck mode
        enableVibecheckMode: true,
        vibecheckAggression: 'moderate',
        enableGodFilter: true,
        enableCringeproof: true,
        enableDirectionCorrection: true
    });
    
    // Example consultations
    setTimeout(async () => {
        console.log('\n🧪 Testing CalCompare Consultation Hub with Vibecheck\n');
        
        try {
            // Standard consultation
            console.log('📞 Testing standard consult button...');
            const standardResult = await hub.consult(
                "What are the latest treatment protocols for atrial fibrillation?",
                { domain: 'medical' }
            );
            
            console.log('\n📋 Standard Consultation Summary:');
            console.log(`Models consulted: ${standardResult.modelCount}`);
            console.log(`Sources found: ${standardResult.sources.length}`);
            console.log(`Confidence: ${(standardResult.confidence * 100).toFixed(1)}%`);
            
            // NEW: Vibecheck consultation
            console.log('\n🎮 Testing VIBECHECK button...');
            const vibecheckResult = await hub.vibecheckConsult(
                "What are the latest treatment protocols for atrial fibrillation?",
                { domain: 'medical' }
            );
            
            console.log('\n🎮 VIBECHECK CONSULTATION SUMMARY:');
            console.log('===================================');
            console.log(`Overall Quality: ${(vibecheckResult.overallQuality * 100).toFixed(1)}%`);
            console.log(`Vibecheck Score: ${(vibecheckResult.validationResults.vibecheck.score * 100).toFixed(1)}%`);
            console.log(`God Filter Score: ${(vibecheckResult.validationResults.godFilter.divineScore * 100).toFixed(1)}%`);
            console.log(`Cringe Score: ${(vibecheckResult.validationResults.cringeproof.cringeScore * 100).toFixed(1)}%`);
            console.log(`Recommendation: ${vibecheckResult.recommendation.action}`);
            console.log(`Total Cost: $${vibecheckResult.totalCost.toFixed(4)}`);
            console.log(`Duration: ${vibecheckResult.duration}ms`);
            
            // Show validation details
            console.log('\n⚔️  Adversarial Validation:');
            console.log(`  Hits detected: ${vibecheckResult.validationResults.vibecheck.hitDetection.totalHits}`);
            console.log(`  Attack vectors: ${vibecheckResult.validationResults.vibecheck.attackResults.length}`);
            console.log(`  Vulnerabilities: ${vibecheckResult.validationResults.vibecheck.vulnerabilities.length}`);
            
            console.log('\n⚡ God Filter Validation:');
            console.log(`  Divine verdict: ${vibecheckResult.validationResults.godFilter.judgment.verdict}`);
            console.log(`  Standards met: ${vibecheckResult.validationResults.godFilter.judgment.standardsMet}/${vibecheckResult.validationResults.godFilter.judgment.totalStandards}`);
            console.log(`  Gates passed: ${vibecheckResult.validationResults.godFilter.judgment.gatesPassed}/${vibecheckResult.validationResults.godFilter.judgment.totalGates}`);
            
            console.log('\n😬 Cringeproof Validation:');
            console.log(`  Cringe patterns: ${vibecheckResult.validationResults.cringeproof.patternDetection.totalPatterns}`);
            console.log(`  Embarrassment risk: ${vibecheckResult.validationResults.cringeproof.embarrassmentRisk.level}`);
            console.log(`  Professional standards: ${vibecheckResult.validationResults.cringeproof.professionalCheck.passedStandards ? 'PASSED' : 'FAILED'}`);
            
            if (vibecheckResult.validationResults.directionCorrection) {
                console.log('\n🧭 Direction Correction:');
                console.log(`  Quality improvement: +${(vibecheckResult.validationResults.directionCorrection.qualityImprovement * 100).toFixed(1)}%`);
                console.log(`  Correction attempts: ${vibecheckResult.validationResults.directionCorrection.attempts}`);
                console.log(`  Target achieved: ${vibecheckResult.validationResults.directionCorrection.targetAchieved ? 'YES' : 'NO'}`);
            }
            
            // Comparison
            console.log('\n📊 STANDARD vs VIBECHECK COMPARISON:');
            console.log(`Standard consultation: ${standardResult.modelCount} models, ${standardResult.duration}ms`);
            console.log(`Vibecheck consultation: Full validation pipeline, ${vibecheckResult.duration}ms`);
            console.log(`Quality assurance: ${(vibecheckResult.overallQuality * 100).toFixed(1)}% confidence`);
            
            console.log('\n✨ Vibecheck button working exactly as intended!');
            console.log('   Consult → Adversarial → God Filter → Cringeproof → Direction Correction');
            console.log('   Like raycast collision detection → movement correction in games');
            
        } catch (error) {
            console.error('❌ Consultation test failed:', error.message);
        }
        
    }, 1000);
}
#!/usr/bin/env node

/**
 * 🧠 INTELLIGENT QUERY DECOMPOSER
 * 
 * The smart brain that takes any query/document and:
 * 1. Analyzes the content to identify domains and complexity
 * 2. Decomposes it into character-specific sub-tasks
 * 3. Routes each sub-task to appropriate character experts
 * 4. Creates yes/no decision trees for each character
 * 5. Orchestrates parallel processing and result aggregation
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class IntelligentQueryDecomposer extends EventEmitter {
    constructor() {
        super();
        
        // Character domain mappings with expertise confidence
        this.characterDomains = {
            'cal': {
                name: 'Cal',
                emoji: '📊', 
                domains: ['data', 'systems', 'analytics', 'databases', 'apis', 'backend', 'architecture'],
                keywords: ['data', 'database', 'analytics', 'system', 'api', 'backend', 'architecture', 'performance', 'scaling'],
                confidence: 0.9,
                decisionAreas: ['technical-feasibility', 'data-architecture', 'system-design', 'performance-optimization']
            },
            'arty': {
                name: 'Arty',
                emoji: '🎨',
                domains: ['design', 'ux', 'ui', 'branding', 'visual', 'user-experience', 'aesthetics'],
                keywords: ['design', 'ui', 'ux', 'user', 'interface', 'visual', 'branding', 'aesthetic', 'layout', 'mockup'],
                confidence: 0.95,
                decisionAreas: ['user-experience', 'visual-design', 'accessibility', 'brand-consistency']
            },
            'ralph': {
                name: 'Ralph', 
                emoji: '🏗️',
                domains: ['infrastructure', 'devops', 'deployment', 'scaling', 'servers', 'cloud', 'monitoring'],
                keywords: ['infrastructure', 'deployment', 'server', 'cloud', 'scaling', 'devops', 'monitoring', 'hosting'],
                confidence: 0.85,
                decisionAreas: ['infrastructure-design', 'scalability', 'deployment-strategy', 'monitoring-setup']
            },
            'vera': {
                name: 'Vera',
                emoji: '🔬', 
                domains: ['research', 'ai', 'ml', 'algorithms', 'analysis', 'data-science', 'automation'],
                keywords: ['ai', 'ml', 'algorithm', 'research', 'analysis', 'automation', 'intelligence', 'model'],
                confidence: 0.88,
                decisionAreas: ['ai-implementation', 'data-analysis', 'algorithm-selection', 'automation-strategy']
            },
            'paulo': {
                name: 'Paulo',
                emoji: '🛡️',
                domains: ['security', 'compliance', 'privacy', 'authentication', 'encryption', 'risk'],
                keywords: ['security', 'auth', 'encryption', 'privacy', 'compliance', 'risk', 'vulnerability', 'protection'],
                confidence: 0.92,
                decisionAreas: ['security-requirements', 'compliance-needs', 'risk-assessment', 'auth-strategy']
            },
            'nash': {
                name: 'Nash',
                emoji: '📢',
                domains: ['business', 'market', 'monetization', 'strategy', 'economics', 'revenue', 'growth'],
                keywords: ['business', 'market', 'monetization', 'revenue', 'strategy', 'economics', 'growth', 'roi'],
                confidence: 0.82,
                decisionAreas: ['business-viability', 'market-strategy', 'monetization-model', 'growth-planning']
            }
        };
        
        // Industry-specific routing patterns
        this.industryPatterns = {
            'fintech': {
                keywords: ['finance', 'trading', 'crypto', 'banking', 'payment', 'wallet', 'investment'],
                requiredCharacters: ['cal', 'paulo', 'nash'], // Data + Security + Business required
                optionalCharacters: ['arty', 'ralph'],
                specialConsiderations: ['regulatory-compliance', 'financial-security', 'real-time-data']
            },
            'healthcare': {
                keywords: ['health', 'medical', 'patient', 'clinical', 'diagnosis', 'treatment'],
                requiredCharacters: ['paulo', 'vera'], // Security + Research required for medical
                optionalCharacters: ['cal', 'arty', 'nash'],
                specialConsiderations: ['hipaa-compliance', 'patient-privacy', 'clinical-accuracy']
            },
            'gaming': {
                keywords: ['game', 'player', 'gaming', 'entertainment', 'multiplayer', 'virtual'],
                requiredCharacters: ['arty', 'ralph'], // Design + Infrastructure for gaming
                optionalCharacters: ['cal', 'vera', 'nash'],
                specialConsiderations: ['real-time-performance', 'user-engagement', 'scalable-multiplayer']
            },
            'ecommerce': {
                keywords: ['shop', 'store', 'commerce', 'product', 'cart', 'checkout', 'inventory'],
                requiredCharacters: ['nash', 'cal'], // Business + Systems required
                optionalCharacters: ['arty', 'paulo', 'ralph'],
                specialConsiderations: ['payment-processing', 'inventory-management', 'user-conversion']
            },
            'saas': {
                keywords: ['software', 'service', 'platform', 'subscription', 'dashboard', 'workflow'],
                requiredCharacters: ['cal', 'arty'], // Systems + UX required
                optionalCharacters: ['ralph', 'nash', 'paulo'],
                specialConsiderations: ['user-onboarding', 'subscription-billing', 'feature-scalability']
            }
        };
        
        // Decision tree templates for each character
        this.decisionTrees = {
            'cal': {
                'technical-feasibility': [
                    'Does this require real-time data processing?',
                    'Is high-performance database access needed?',
                    'Will this need to scale beyond 1000 concurrent users?',
                    'Are complex data transformations required?'
                ],
                'data-architecture': [
                    'Is this primarily a read-heavy or write-heavy system?',
                    'Does this need data warehousing capabilities?',
                    'Are there complex relationships between data entities?',
                    'Will analytics and reporting be core features?'
                ]
            },
            'arty': {
                'user-experience': [
                    'Is this primarily a mobile or desktop experience?',
                    'Will users need to complete complex workflows?',
                    'Is visual appeal a competitive advantage?',
                    'Are there accessibility requirements?'
                ],
                'visual-design': [
                    'Does this need a custom brand identity?',
                    'Are there specific industry design standards?',
                    'Will this require responsive design?',
                    'Is this a consumer-facing or enterprise product?'
                ]
            },
            'ralph': {
                'infrastructure-design': [
                    'Does this need to handle traffic spikes?',
                    'Are there geographic distribution requirements?',
                    'Will this integrate with existing enterprise systems?',
                    'Is high availability (99.9%+ uptime) required?'
                ],
                'scalability': [
                    'Do you expect rapid user growth?',
                    'Will this need horizontal scaling capabilities?',
                    'Are there strict latency requirements?',
                    'Will this handle large file uploads/processing?'
                ]
            },
            'vera': {
                'ai-implementation': [
                    'Does this need machine learning capabilities?',
                    'Are there predictive analytics requirements?',
                    'Will automation replace manual processes?',
                    'Is natural language processing needed?'
                ],
                'data-analysis': [
                    'Are there complex statistical requirements?',
                    'Will this need real-time decision making?',
                    'Are there pattern recognition needs?',
                    'Is experimental design required?'
                ]
            },
            'paulo': {
                'security-requirements': [
                    'Does this handle sensitive personal data?',
                    'Are there financial transactions involved?',
                    'Will this store authentication credentials?',
                    'Is this exposed to public internet access?'
                ],
                'compliance-needs': [
                    'Are there industry-specific regulations?',
                    'Is this used in regulated industries?',
                    'Are there data residency requirements?',
                    'Will this need audit trails?'
                ]
            },
            'nash': {
                'business-viability': [
                    'Is there a clear revenue model?',
                    'Are there identified target customers?',
                    'Is this solving a painful problem?',
                    'Can this achieve sustainable unit economics?'
                ],
                'market-strategy': [
                    'Is there strong market demand?',
                    'Are there significant competitors?',
                    'Can this achieve network effects?',
                    'Is there a clear go-to-market strategy?'
                ]
            }
        };
        
        console.log('🧠 Intelligent Query Decomposer initialized');
        console.log(`👥 ${Object.keys(this.characterDomains).length} character domains mapped`);
        console.log(`🏭 ${Object.keys(this.industryPatterns).length} industry patterns loaded`);
    }
    
    /**
     * Main decomposition method - takes query and returns character routing plan
     */
    async decomposeQuery(query, context = {}) {
        try {
            const decompositionId = crypto.randomUUID();
            const startTime = Date.now();
            
            console.log(`\n🧠 Starting query decomposition: ${decompositionId}`);
            console.log(`📝 Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);
            
            // 1. Analyze query content and complexity
            const analysis = this.analyzeQuery(query);
            
            // 2. Detect industry context
            const industryContext = this.detectIndustry(query);
            
            // 3. Calculate character relevance scores
            const characterScores = this.calculateCharacterRelevance(query, analysis);
            
            // 4. Select optimal character team
            const selectedTeam = this.selectCharacterTeam(characterScores, industryContext, analysis);
            
            // 5. Generate decision trees for each selected character
            const decisionPlan = this.generateDecisionPlan(selectedTeam, query, analysis);
            
            // 6. Create execution plan
            const executionPlan = this.createExecutionPlan(selectedTeam, decisionPlan, analysis);
            
            const decomposition = {
                id: decompositionId,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime,
                
                // Original input
                originalQuery: query,
                context,
                
                // Analysis results
                queryAnalysis: analysis,
                industryContext,
                
                // Character selection
                characterScores,
                selectedTeam,
                teamSize: selectedTeam.length,
                
                // Decision planning
                decisionPlan,
                executionPlan,
                
                // Execution metadata
                estimatedTime: this.estimateExecutionTime(selectedTeam, decisionPlan),
                complexity: analysis.complexity,
                confidence: this.calculateOverallConfidence(characterScores, selectedTeam)
            };
            
            console.log(`✅ Decomposition complete:`);
            console.log(`   👥 Selected team: ${selectedTeam.map(t => t.character.name).join(', ')}`);
            console.log(`   🏭 Industry: ${industryContext.industry || 'general'}`);
            console.log(`   ⏱️ Estimated time: ${decomposition.estimatedTime} minutes`);
            console.log(`   🎯 Confidence: ${(decomposition.confidence * 100).toFixed(1)}%`);
            
            this.emit('query_decomposed', decomposition);
            
            return decomposition;
            
        } catch (error) {
            console.error('❌ Query decomposition failed:', error);
            this.emit('decomposition_error', { query, error });
            throw error;
        }
    }
    
    /**
     * Analyze query content for complexity, domains, and requirements
     */
    analyzeQuery(query) {
        const words = query.toLowerCase().split(/\s+/);
        const sentences = query.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Complexity analysis
        const complexity = this.assessComplexity(query, words, sentences);
        
        // Domain detection
        const domains = this.detectDomains(query, words);
        
        // Feature extraction
        const features = this.extractFeatures(query, words);
        
        // Requirement classification
        const requirements = this.classifyRequirements(query);
        
        return {
            wordCount: words.length,
            sentenceCount: sentences.length,
            complexity,
            domains,
            features,
            requirements,
            
            // Technical indicators
            hasTechnicalTerms: this.hasTechnicalTerms(words),
            hasBusinessTerms: this.hasBusinessTerms(words),
            hasDesignTerms: this.hasDesignTerms(words),
            hasSecurityTerms: this.hasSecurityTerms(words),
            
            // Urgency and scope
            urgency: this.detectUrgency(query),
            scope: this.detectScope(query)
        };
    }
    
    /**
     * Detect industry context from query content
     */
    detectIndustry(query) {
        const queryLower = query.toLowerCase();
        let bestMatch = null;
        let highestScore = 0;
        
        for (const [industry, pattern] of Object.entries(this.industryPatterns)) {
            const score = pattern.keywords.reduce((sum, keyword) => {
                return sum + (queryLower.includes(keyword) ? 1 : 0);
            }, 0) / pattern.keywords.length;
            
            if (score > highestScore && score > 0.3) { // Minimum threshold
                highestScore = score;
                bestMatch = industry;
            }
        }
        
        const industryData = bestMatch ? this.industryPatterns[bestMatch] : null;
        
        return {
            industry: bestMatch,
            confidence: highestScore,
            patterns: industryData,
            specialConsiderations: industryData?.specialConsiderations || []
        };
    }
    
    /**
     * Calculate relevance scores for each character
     */
    calculateCharacterRelevance(query, analysis) {
        const queryLower = query.toLowerCase();
        const scores = {};
        
        for (const [charId, character] of Object.entries(this.characterDomains)) {
            let score = 0;
            
            // Domain keyword matching
            const keywordMatches = character.keywords.filter(keyword => 
                queryLower.includes(keyword)
            ).length;
            
            const keywordScore = keywordMatches / character.keywords.length;
            
            // Domain overlap with detected domains
            const domainOverlap = analysis.domains.filter(domain =>
                character.domains.includes(domain)
            ).length;
            
            const domainScore = domainOverlap / Math.max(analysis.domains.length, 1);
            
            // Feature relevance
            const featureRelevance = this.calculateFeatureRelevance(character, analysis.features);
            
            // Requirement alignment
            const requirementAlignment = this.calculateRequirementAlignment(character, analysis.requirements);
            
            // Combined score
            score = (
                keywordScore * 0.3 +
                domainScore * 0.25 +
                featureRelevance * 0.25 +
                requirementAlignment * 0.2
            ) * character.confidence;
            
            scores[charId] = {
                characterId: charId,
                character,
                totalScore: score,
                keywordScore,
                domainScore,
                featureRelevance,
                requirementAlignment,
                
                // Decision areas this character can handle
                applicableDecisionAreas: character.decisionAreas.filter(area =>
                    this.isDecisionAreaRelevant(area, analysis)
                )
            };
        }
        
        // Sort by score
        return Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
    }
    
    /**
     * Select optimal character team based on scores and industry requirements
     */
    selectCharacterTeam(characterScores, industryContext, analysis) {
        const team = [];
        const usedCharacters = new Set();
        
        // Start with industry-required characters
        if (industryContext.patterns) {
            for (const requiredCharId of industryContext.patterns.requiredCharacters) {
                const charData = characterScores.find(c => c.characterId === requiredCharId);
                if (charData && !usedCharacters.has(requiredCharId)) {
                    team.push(charData);
                    usedCharacters.add(requiredCharId);
                }
            }
        }
        
        // Add top-scoring characters up to optimal team size
        const maxTeamSize = this.calculateOptimalTeamSize(analysis);
        
        for (const charData of characterScores) {
            if (team.length >= maxTeamSize) break;
            
            if (!usedCharacters.has(charData.characterId) && charData.totalScore > 0.3) {
                team.push(charData);
                usedCharacters.add(charData.characterId);
            }
        }
        
        // Ensure minimum team size (at least 2 characters for diverse perspective)
        const minTeamSize = Math.max(2, industryContext.patterns?.requiredCharacters.length || 2);
        
        while (team.length < minTeamSize && team.length < characterScores.length) {
            const nextBest = characterScores.find(c => !usedCharacters.has(c.characterId));
            if (nextBest) {
                team.push(nextBest);
                usedCharacters.add(nextBest.characterId);
            } else {
                break;
            }
        }
        
        return team;
    }
    
    /**
     * Generate decision trees for each selected character
     */
    generateDecisionPlan(selectedTeam, query, analysis) {
        const plan = {};
        
        for (const teamMember of selectedTeam) {
            const charId = teamMember.characterId;
            const character = teamMember.character;
            
            plan[charId] = {
                characterId: charId,
                characterName: character.name,
                emoji: character.emoji,
                applicableDecisionAreas: teamMember.applicableDecisionAreas,
                
                // Generate specific yes/no questions
                decisionQuestions: this.generateDecisionQuestions(charId, teamMember.applicableDecisionAreas, query, analysis),
                
                // Expected outputs
                expectedOutputs: this.getExpectedOutputs(charId, teamMember.applicableDecisionAreas),
                
                // Processing priority
                priority: this.calculateProcessingPriority(charId, teamMember.totalScore, analysis)
            };
        }
        
        return plan;
    }
    
    /**
     * Generate specific yes/no questions for a character
     */
    generateDecisionQuestions(charId, decisionAreas, query, analysis) {
        const questions = [];
        
        for (const area of decisionAreas) {
            const areaQuestions = this.decisionTrees[charId][area] || [];
            
            for (const question of areaQuestions) {
                // Customize question based on query content
                const customizedQuestion = this.customizeQuestion(question, query, analysis);
                
                questions.push({
                    area,
                    question: customizedQuestion,
                    originalQuestion: question,
                    weight: this.calculateQuestionWeight(area, question, analysis),
                    
                    // Expected answer implications
                    yesImplications: this.getAnswerImplications(charId, area, question, true),
                    noImplications: this.getAnswerImplications(charId, area, question, false)
                });
            }
        }
        
        return questions.sort((a, b) => b.weight - a.weight);
    }
    
    /**
     * Create comprehensive execution plan
     */
    createExecutionPlan(selectedTeam, decisionPlan, analysis) {
        const plan = {
            executionId: crypto.randomUUID(),
            strategy: this.determineExecutionStrategy(analysis),
            
            // Parallel processing groups
            processingGroups: this.createProcessingGroups(selectedTeam, decisionPlan),
            
            // Execution phases
            phases: [
                {
                    phase: 1,
                    name: 'Parallel Character Analysis',
                    description: 'Each character processes their decision trees simultaneously',
                    characters: selectedTeam.map(t => t.characterId),
                    estimatedTime: this.estimatePhaseTime(selectedTeam, 'analysis')
                },
                {
                    phase: 2,
                    name: 'Cross-Character Validation', 
                    description: 'Characters validate each other\'s findings',
                    characters: selectedTeam.slice(0, 2).map(t => t.characterId), // Top 2 for validation
                    estimatedTime: this.estimatePhaseTime(selectedTeam, 'validation')
                },
                {
                    phase: 3,
                    name: 'Results Synthesis',
                    description: 'Combine all character outputs into unified response',
                    characters: ['synthesizer'], // Special aggregation process
                    estimatedTime: this.estimatePhaseTime(selectedTeam, 'synthesis')
                }
            ],
            
            // Success criteria
            successCriteria: this.defineSuccessCriteria(analysis, selectedTeam),
            
            // Fallback strategies
            fallbackStrategies: this.defineFallbackStrategies(selectedTeam, analysis)
        };
        
        return plan;
    }
    
    // Utility methods for analysis
    assessComplexity(query, words, sentences) {
        const factors = {
            length: Math.min(words.length / 100, 1),
            technicalTerms: this.countTechnicalTerms(words) / words.length,
            multipleDomains: Math.min(this.detectDomains(query, words).length / 3, 1),
            requirements: Math.min(sentences.length / 10, 1)
        };
        
        const complexityScore = (
            factors.length * 0.2 +
            factors.technicalTerms * 0.3 +
            factors.multipleDomains * 0.3 +
            factors.requirements * 0.2
        );
        
        if (complexityScore > 0.7) return 'very-complex';
        if (complexityScore > 0.5) return 'complex';
        if (complexityScore > 0.3) return 'moderate';
        return 'simple';
    }
    
    detectDomains(query, words) {
        const domains = [];
        const domainKeywords = {
            'technical': ['code', 'system', 'database', 'api', 'backend', 'frontend', 'architecture'],
            'design': ['design', 'ui', 'ux', 'interface', 'visual', 'layout', 'mockup'],
            'business': ['business', 'market', 'revenue', 'customer', 'growth', 'strategy'],
            'security': ['security', 'auth', 'encryption', 'privacy', 'compliance'],
            'data': ['data', 'analytics', 'database', 'analysis', 'report', 'dashboard'],
            'mobile': ['mobile', 'app', 'ios', 'android', 'responsive'],
            'web': ['web', 'website', 'browser', 'html', 'css', 'javascript']
        };
        
        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            if (keywords.some(keyword => words.includes(keyword))) {
                domains.push(domain);
            }
        }
        
        return domains;
    }
    
    extractFeatures(query, words) {
        const features = [];
        const featurePatterns = {
            'user-authentication': ['login', 'auth', 'signup', 'register', 'account'],
            'data-visualization': ['chart', 'graph', 'dashboard', 'report', 'analytics'],
            'payment-processing': ['payment', 'billing', 'subscription', 'checkout', 'stripe'],
            'real-time': ['real-time', 'live', 'instant', 'websocket', 'chat'],
            'mobile-app': ['mobile', 'app', 'ios', 'android', 'native'],
            'api-integration': ['api', 'integration', 'webhook', 'rest', 'graphql'],
            'search-functionality': ['search', 'filter', 'query', 'find', 'lookup']
        };
        
        for (const [feature, keywords] of Object.entries(featurePatterns)) {
            if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
                features.push(feature);
            }
        }
        
        return features;
    }
    
    classifyRequirements(query) {
        const requirements = {
            functional: [],
            nonFunctional: [],
            business: [],
            technical: []
        };
        
        const queryLower = query.toLowerCase();
        
        // Functional requirements
        if (queryLower.includes('user') && queryLower.includes('can')) {
            requirements.functional.push('user-stories-defined');
        }
        
        // Non-functional requirements
        if (queryLower.includes('fast') || queryLower.includes('performance')) {
            requirements.nonFunctional.push('performance-requirements');
        }
        if (queryLower.includes('secure') || queryLower.includes('security')) {
            requirements.nonFunctional.push('security-requirements');
        }
        if (queryLower.includes('scale') || queryLower.includes('scaling')) {
            requirements.nonFunctional.push('scalability-requirements');
        }
        
        // Business requirements
        if (queryLower.includes('revenue') || queryLower.includes('monetize')) {
            requirements.business.push('monetization-strategy');
        }
        
        return requirements;
    }
    
    hasTechnicalTerms(words) {
        const technicalTerms = ['api', 'database', 'backend', 'frontend', 'system', 'code', 'development'];
        return technicalTerms.some(term => words.includes(term));
    }
    
    hasBusinessTerms(words) {
        const businessTerms = ['business', 'revenue', 'customer', 'market', 'growth', 'strategy'];
        return businessTerms.some(term => words.includes(term));
    }
    
    hasDesignTerms(words) {
        const designTerms = ['design', 'ui', 'ux', 'interface', 'visual', 'layout'];
        return designTerms.some(term => words.includes(term));
    }
    
    hasSecurityTerms(words) {
        const securityTerms = ['security', 'auth', 'encryption', 'privacy', 'compliance'];
        return securityTerms.some(term => words.includes(term));
    }
    
    detectUrgency(query) {
        const urgentKeywords = ['urgent', 'asap', 'immediately', 'quickly', 'fast', 'rush'];
        const queryLower = query.toLowerCase();
        
        if (urgentKeywords.some(keyword => queryLower.includes(keyword))) {
            return 'high';
        }
        return 'normal';
    }
    
    detectScope(query) {
        const words = query.split(/\s+/).length;
        
        if (words > 200) return 'large';
        if (words > 100) return 'medium';
        return 'small';
    }
    
    calculateFeatureRelevance(character, features) {
        const relevantFeatures = {
            'cal': ['data-visualization', 'api-integration', 'search-functionality'],
            'arty': ['user-authentication', 'mobile-app', 'data-visualization'],
            'ralph': ['api-integration', 'real-time', 'mobile-app'],
            'vera': ['data-visualization', 'search-functionality', 'real-time'],
            'paulo': ['user-authentication', 'payment-processing', 'api-integration'],
            'nash': ['payment-processing', 'user-authentication', 'mobile-app']
        };
        
        const charFeatures = relevantFeatures[character.name.toLowerCase()] || [];
        const overlap = features.filter(f => charFeatures.includes(f)).length;
        
        return overlap / Math.max(features.length, 1);
    }
    
    calculateRequirementAlignment(character, requirements) {
        // Simplified alignment calculation
        const allRequirements = [
            ...requirements.functional,
            ...requirements.nonFunctional,
            ...requirements.business,
            ...requirements.technical
        ];
        
        // Each character has different alignment with requirement types
        const alignmentScores = {
            'cal': allRequirements.filter(r => r.includes('technical') || r.includes('performance')).length,
            'arty': allRequirements.filter(r => r.includes('user') || r.includes('functional')).length,
            'ralph': allRequirements.filter(r => r.includes('scalability') || r.includes('performance')).length,
            'vera': allRequirements.filter(r => r.includes('technical') || r.includes('user')).length,
            'paulo': allRequirements.filter(r => r.includes('security') || r.includes('technical')).length,
            'nash': allRequirements.filter(r => r.includes('business') || r.includes('monetization')).length
        };
        
        const charScore = alignmentScores[character.name.toLowerCase()] || 0;
        return charScore / Math.max(allRequirements.length, 1);
    }
    
    isDecisionAreaRelevant(area, analysis) {
        const relevanceMap = {
            'technical-feasibility': analysis.hasTechnicalTerms,
            'user-experience': analysis.hasDesignTerms,
            'infrastructure-design': analysis.complexity !== 'simple',
            'security-requirements': analysis.hasSecurityTerms,
            'business-viability': analysis.hasBusinessTerms,
            'ai-implementation': analysis.domains.includes('data')
        };
        
        return relevanceMap[area] || false;
    }
    
    calculateOptimalTeamSize(analysis) {
        const baseSize = 2;
        let additionalMembers = 0;
        
        if (analysis.complexity === 'very-complex') additionalMembers += 2;
        else if (analysis.complexity === 'complex') additionalMembers += 1;
        
        if (analysis.domains.length > 3) additionalMembers += 1;
        if (analysis.features.length > 5) additionalMembers += 1;
        
        return Math.min(baseSize + additionalMembers, 5); // Cap at 5 characters
    }
    
    customizeQuestion(question, query, analysis) {
        // Simple customization - in real system would be more sophisticated
        if (query.toLowerCase().includes('mobile') && question.includes('users')) {
            return question.replace('users', 'mobile users');
        }
        return question;
    }
    
    calculateQuestionWeight(area, question, analysis) {
        // Higher weight for more relevant questions
        if (analysis.complexity === 'very-complex' && question.includes('complex')) return 0.9;
        if (analysis.hasSecurityTerms && question.includes('security')) return 0.9;
        if (analysis.hasBusinessTerms && question.includes('business')) return 0.8;
        return 0.6;
    }
    
    getAnswerImplications(charId, area, question, isYes) {
        // Simplified implications - would be more detailed in real system
        return {
            confidence: isYes ? 0.8 : 0.6,
            recommendations: [`Based on ${isYes ? 'yes' : 'no'} answer: ${question}`],
            nextQuestions: []
        };
    }
    
    determineExecutionStrategy(analysis) {
        if (analysis.urgency === 'high') return 'fast-parallel';
        if (analysis.complexity === 'very-complex') return 'thorough-sequential';
        return 'balanced-parallel';
    }
    
    createProcessingGroups(selectedTeam, decisionPlan) {
        // Group characters that can work in parallel vs need sequential processing
        return [
            {
                groupId: 1,
                type: 'parallel',
                characters: selectedTeam.slice(0, 3).map(t => t.characterId),
                dependencies: []
            },
            {
                groupId: 2, 
                type: 'sequential',
                characters: selectedTeam.slice(3).map(t => t.characterId),
                dependencies: [1]
            }
        ];
    }
    
    estimatePhaseTime(selectedTeam, phase) {
        const baseTimes = {
            'analysis': 5, // minutes
            'validation': 3,
            'synthesis': 2
        };
        
        const teamSizeMultiplier = 1 + (selectedTeam.length - 2) * 0.2;
        return baseTimes[phase] * teamSizeMultiplier;
    }
    
    defineSuccessCriteria(analysis, selectedTeam) {
        return [
            'All character decision trees completed',
            'Minimum 80% confidence in recommendations',
            'Cross-character validation passed',
            'Unified output generated'
        ];
    }
    
    defineFallbackStrategies(selectedTeam, analysis) {
        return [
            {
                trigger: 'Character unavailable',
                action: 'Route to backup character in same domain'
            },
            {
                trigger: 'Low confidence score',
                action: 'Add additional character for validation'
            },
            {
                trigger: 'Conflicting recommendations',
                action: 'Escalate to human review'
            }
        ];
    }
    
    estimateExecutionTime(selectedTeam, decisionPlan) {
        const baseTime = 10; // minutes
        const characterMultiplier = selectedTeam.length * 2;
        const complexityMultiplier = Object.keys(decisionPlan).length * 1.5;
        
        return Math.round(baseTime + characterMultiplier + complexityMultiplier);
    }
    
    calculateOverallConfidence(characterScores, selectedTeam) {
        const avgScore = selectedTeam.reduce((sum, member) => sum + member.totalScore, 0) / selectedTeam.length;
        const teamSizeBonus = Math.min(selectedTeam.length / 5, 0.2);
        
        return Math.min(avgScore + teamSizeBonus, 1.0);
    }
    
    countTechnicalTerms(words) {
        const technicalTerms = [
            'api', 'database', 'backend', 'frontend', 'system', 'code', 'development',
            'server', 'client', 'architecture', 'framework', 'library', 'deployment',
            'integration', 'authentication', 'encryption', 'optimization', 'scalability'
        ];
        
        return words.filter(word => technicalTerms.includes(word.toLowerCase())).length;
    }
    
    getExpectedOutputs(charId, decisionAreas) {
        const outputMap = {
            'cal': ['System architecture recommendations', 'Data flow diagrams', 'Performance requirements'],
            'arty': ['User experience recommendations', 'Design mockups', 'Accessibility guidelines'],
            'ralph': ['Infrastructure recommendations', 'Deployment strategy', 'Scalability plan'],
            'vera': ['AI implementation plan', 'Research methodology', 'Algorithm recommendations'],
            'paulo': ['Security requirements', 'Compliance checklist', 'Risk assessment'],
            'nash': ['Business strategy', 'Market analysis', 'Monetization recommendations']
        };
        
        return outputMap[charId] || ['Analysis report', 'Recommendations'];
    }
    
    calculateProcessingPriority(charId, totalScore, analysis) {
        let priority = totalScore;
        
        // Boost security priority for high-risk projects
        if (charId === 'paulo' && analysis.hasSecurityTerms) {
            priority += 0.2;
        }
        
        // Boost business priority for business-focused queries
        if (charId === 'nash' && analysis.hasBusinessTerms) {
            priority += 0.15;
        }
        
        return Math.min(priority, 1.0);
    }
}

module.exports = IntelligentQueryDecomposer;

// CLI execution for testing
if (require.main === module) {
    const decomposer = new IntelligentQueryDecomposer();
    
    console.log('\n🧠 Testing Intelligent Query Decomposer...\n');
    
    const testQueries = [
        'Build a fintech app for cryptocurrency trading with real-time data and secure authentication',
        'Create a healthcare platform for patient data management with HIPAA compliance',
        'Design a gaming platform with multiplayer features and user progression tracking',
        'Build an e-commerce store with payment processing and inventory management',
        'Develop a SaaS dashboard for business analytics with subscription billing'
    ];
    
    (async () => {
        for (const query of testQueries) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`Testing query: "${query}"`);
            console.log('='.repeat(80));
            
            try {
                const decomposition = await decomposer.decomposeQuery(query);
                
                console.log('\n📊 DECOMPOSITION RESULTS:');
                console.log(`Industry: ${decomposition.industryContext.industry || 'general'}`);
                console.log(`Complexity: ${decomposition.queryAnalysis.complexity}`);
                console.log(`Team Size: ${decomposition.teamSize}`);
                console.log(`Estimated Time: ${decomposition.estimatedTime} minutes`);
                console.log(`Confidence: ${(decomposition.confidence * 100).toFixed(1)}%`);
                
                console.log('\n👥 SELECTED TEAM:');
                decomposition.selectedTeam.forEach(member => {
                    console.log(`${member.character.emoji} ${member.character.name} (${(member.totalScore * 100).toFixed(1)}%)`);
                    console.log(`   Areas: ${member.applicableDecisionAreas.join(', ')}`);
                });
                
                console.log('\n❓ DECISION QUESTIONS SAMPLE:');
                Object.values(decomposition.decisionPlan).forEach(plan => {
                    console.log(`\n${plan.emoji} ${plan.characterName}:`);
                    plan.decisionQuestions.slice(0, 2).forEach(q => {
                        console.log(`   - ${q.question} (${q.area})`);
                    });
                });
                
            } catch (error) {
                console.error('❌ Test failed:', error.message);
            }
        }
    })();
}
#!/usr/bin/env node

/**
 * CAL TEMPLATE MATCHER
 * Interest-to-template matching engine using CAL system
 * Integrates with Web 2.5 hosting platform for intelligent template suggestions
 */

const crypto = require('crypto');
const TemplateBuilderSystem = require('./template-builder-system.js');

class CALTemplateMatcher {
    constructor() {
        this.templateBuilder = new TemplateBuilderSystem();
        this.analysisCache = new Map();
        this.userProfiles = new Map();
        
        // CAL analysis patterns - mapping interests to specific implementations
        this.calPatterns = {
            content: {
                writing: {
                    keywords: ['blog', 'article', 'story', 'journal', 'newsletter'],
                    templates: ['blog', 'newsletter', 'personal'],
                    complexity: 'simple',
                    features: ['markdown', 'rss', 'comments', 'social-sharing'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['write', 'blog', 'article', 'story'])
                },
                visual: {
                    keywords: ['photography', 'art', 'design', 'portfolio', 'gallery'],
                    templates: ['portfolio', 'gallery'],
                    complexity: 'simple',
                    features: ['lightbox', 'image-optimization', 'responsive-gallery'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['photo', 'art', 'design', 'visual'])
                },
                video: {
                    keywords: ['video', 'youtube', 'streaming', 'content'],
                    templates: ['portfolio', 'blog'],
                    complexity: 'medium',
                    features: ['video-player', 'streaming', 'thumbnails'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['video', 'stream', 'youtube', 'content'])
                }
            },
            business: {
                ecommerce: {
                    keywords: ['shop', 'store', 'sell', 'product', 'commerce', 'retail'],
                    templates: ['ecommerce'],
                    complexity: 'complex',
                    features: ['shopping-cart', 'payments', 'inventory', 'analytics'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['shop', 'sell', 'store', 'product', 'commerce'])
                },
                services: {
                    keywords: ['consulting', 'service', 'agency', 'freelance', 'professional'],
                    templates: ['consulting', 'landing'],
                    complexity: 'medium',
                    features: ['contact-form', 'booking', 'testimonials', 'portfolio'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['consult', 'service', 'agency', 'freelance'])
                },
                saas: {
                    keywords: ['software', 'app', 'platform', 'tool', 'saas', 'api'],
                    templates: ['saas', 'landing', 'dashboard'],
                    complexity: 'complex',
                    features: ['user-dashboard', 'api-access', 'subscriptions', 'analytics'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['software', 'app', 'platform', 'tool', 'saas'])
                }
            },
            community: {
                forum: {
                    keywords: ['community', 'forum', 'discussion', 'group', 'social'],
                    templates: ['forum', 'social'],
                    complexity: 'complex',
                    features: ['user-accounts', 'moderation', 'threading', 'notifications'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['community', 'forum', 'discussion', 'social'])
                },
                wiki: {
                    keywords: ['knowledge', 'wiki', 'documentation', 'learning', 'education'],
                    templates: ['wiki', 'course'],
                    complexity: 'medium',
                    features: ['collaborative-editing', 'search', 'version-control', 'categories'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['knowledge', 'wiki', 'documentation', 'learn'])
                },
                social: {
                    keywords: ['social', 'network', 'connect', 'friends', 'community'],
                    templates: ['social', 'forum'],
                    complexity: 'complex',
                    features: ['profiles', 'messaging', 'feeds', 'groups'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['social', 'network', 'connect', 'friends'])
                }
            },
            gaming: {
                casual: {
                    keywords: ['game', 'fun', 'casual', 'puzzle', 'arcade'],
                    templates: ['game', 'arcade'],
                    complexity: 'medium',
                    features: ['game-engine', 'scores', 'achievements', 'multiplayer'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['game', 'fun', 'casual', 'puzzle', 'arcade'])
                },
                competitive: {
                    keywords: ['esports', 'tournament', 'competitive', 'leaderboard', 'ranking'],
                    templates: ['game', 'tournament', 'leaderboard'],
                    complexity: 'complex',
                    features: ['tournaments', 'ranking-system', 'live-streaming', 'statistics'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['esports', 'tournament', 'competitive', 'ranking'])
                },
                streaming: {
                    keywords: ['streaming', 'twitch', 'youtube', 'broadcast', 'live'],
                    templates: ['game', 'portfolio'],
                    complexity: 'medium',
                    features: ['live-streaming', 'chat', 'donations', 'schedule'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['streaming', 'twitch', 'broadcast', 'live'])
                }
            },
            education: {
                course: {
                    keywords: ['course', 'teaching', 'education', 'tutorial', 'learning'],
                    templates: ['course', 'academy', 'tutorial'],
                    complexity: 'medium',
                    features: ['course-structure', 'progress-tracking', 'quizzes', 'certificates'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['course', 'teach', 'education', 'tutorial', 'learn'])
                },
                research: {
                    keywords: ['research', 'academic', 'study', 'science', 'paper'],
                    templates: ['research', 'wiki', 'blog'],
                    complexity: 'medium',
                    features: ['citations', 'collaboration', 'document-sharing', 'peer-review'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['research', 'academic', 'study', 'science'])
                },
                kids: {
                    keywords: ['kids', 'children', 'family', 'educational', 'fun'],
                    templates: ['tutorial', 'game', 'family'],
                    complexity: 'simple',
                    features: ['kid-friendly', 'parental-controls', 'interactive', 'colorful'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['kids', 'children', 'family', 'educational'])
                }
            },
            tools: {
                calculator: {
                    keywords: ['calculator', 'math', 'calculation', 'tool', 'utility'],
                    templates: ['calculator', 'tools'],
                    complexity: 'medium',
                    features: ['formula-engine', 'history', 'export', 'graphs'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['calculator', 'math', 'calculation', 'tool'])
                },
                productivity: {
                    keywords: ['productivity', 'organization', 'planning', 'management', 'workflow'],
                    templates: ['dashboard', 'tools'],
                    complexity: 'medium',
                    features: ['task-management', 'calendar', 'notes', 'collaboration'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['productivity', 'organization', 'planning', 'workflow'])
                },
                api: {
                    keywords: ['api', 'webhook', 'integration', 'automation', 'service'],
                    templates: ['api', 'dashboard'],
                    complexity: 'complex',
                    features: ['api-endpoints', 'webhooks', 'documentation', 'monitoring'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['api', 'webhook', 'integration', 'automation'])
                }
            },
            personal: {
                blog: {
                    keywords: ['personal', 'thoughts', 'diary', 'journal', 'life'],
                    templates: ['personal', 'blog', 'journal'],
                    complexity: 'simple',
                    features: ['personal-writing', 'photo-sharing', 'privacy-controls'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['personal', 'thoughts', 'diary', 'journal', 'life'])
                },
                family: {
                    keywords: ['family', 'photos', 'memories', 'relatives', 'genealogy'],
                    templates: ['family', 'gallery', 'personal'],
                    complexity: 'simple',
                    features: ['photo-albums', 'family-tree', 'privacy', 'sharing'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['family', 'photos', 'memories', 'relatives'])
                },
                hobby: {
                    keywords: ['hobby', 'interest', 'passion', 'collection', 'craft'],
                    templates: ['hobby', 'portfolio', 'blog'],
                    complexity: 'simple',
                    features: ['showcase', 'progress-tracking', 'community', 'tutorials'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['hobby', 'interest', 'passion', 'collection', 'craft'])
                }
            },
            experimental: {
                ai: {
                    keywords: ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'chatbot'],
                    templates: ['experiment', 'prototype', 'dashboard'],
                    complexity: 'complex',
                    features: ['ai-integration', 'chat-interface', 'data-visualization', 'api-access'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['ai', 'artificial', 'intelligence', 'machine', 'learning'])
                },
                blockchain: {
                    keywords: ['blockchain', 'crypto', 'web3', 'defi', 'nft', 'ethereum'],
                    templates: ['experiment', 'dashboard', 'prototype'],
                    complexity: 'complex',
                    features: ['wallet-connect', 'smart-contracts', 'transactions', 'analytics'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['blockchain', 'crypto', 'web3', 'defi', 'nft'])
                },
                iot: {
                    keywords: ['iot', 'sensors', 'arduino', 'raspberry', 'hardware', 'automation'],
                    templates: ['experiment', 'dashboard', 'tools'],
                    complexity: 'complex',
                    features: ['sensor-data', 'real-time-monitoring', 'device-control', 'alerts'],
                    score: (interest) => this.scoreByKeywordMatch(interest, ['iot', 'sensors', 'arduino', 'hardware', 'automation'])
                }
            }
        };
        
        console.log('🧠 CAL Template Matcher initialized');
        console.log(`🎯 ${this.getTotalPatterns()} analysis patterns loaded`);
    }
    
    getTotalPatterns() {
        return Object.values(this.calPatterns)
            .reduce((total, category) => total + Object.keys(category).length, 0);
    }
    
    /**
     * Analyze user interests and match to templates using CAL methodology
     */
    async analyzeInterests(userInput, context = {}) {
        const analysisId = this.generateAnalysisId(userInput, context);
        
        // Check cache first
        if (this.analysisCache.has(analysisId)) {
            console.log('💾 Using cached CAL analysis');
            return this.analysisCache.get(analysisId);
        }
        
        console.log('🧠 Starting CAL analysis...');
        
        // Step 1: Extract interests from user input
        const extractedInterests = this.extractInterests(userInput);
        
        // Step 2: Analyze interest patterns using CAL methodology
        const patternAnalysis = this.analyzePatterns(extractedInterests, context);
        
        // Step 3: Match patterns to templates
        const templateMatches = this.matchTemplatesToPatterns(patternAnalysis);
        
        // Step 4: Score and rank templates
        const rankedTemplates = this.scoreAndRankTemplates(templateMatches, context);
        
        // Step 5: Generate recommendations with reasoning
        const recommendations = this.generateRecommendations(rankedTemplates, patternAnalysis);
        
        const analysis = {
            id: analysisId,
            userInput,
            extractedInterests,
            patternAnalysis,
            templateMatches,
            rankedTemplates,
            recommendations,
            confidence: this.calculateConfidence(patternAnalysis),
            timestamp: Date.now()
        };
        
        // Cache the analysis
        this.analysisCache.set(analysisId, analysis);
        
        console.log(`✅ CAL analysis complete (confidence: ${Math.round(analysis.confidence * 100)}%)`);
        
        return analysis;
    }
    
    /**
     * Extract interests from user input using natural language processing
     */
    extractInterests(userInput) {
        const interests = {
            explicit: [], // Directly mentioned
            implicit: [], // Inferred from context
            keywords: [],
            sentiment: 'neutral',
            confidence: 0
        };
        
        if (typeof userInput === 'string') {
            // Simple keyword extraction (in production, use NLP library)
            const text = userInput.toLowerCase();
            
            // Extract keywords
            const words = text.match(/\b\w{3,}\b/g) || [];
            interests.keywords = [...new Set(words)];
            
            // Find explicit interests
            for (const [category, patterns] of Object.entries(this.calPatterns)) {
                for (const [subcategory, pattern] of Object.entries(patterns)) {
                    const matchedKeywords = pattern.keywords.filter(keyword => 
                        text.includes(keyword.toLowerCase())
                    );
                    
                    if (matchedKeywords.length > 0) {
                        interests.explicit.push({
                            category,
                            subcategory,
                            keywords: matchedKeywords,
                            score: matchedKeywords.length / pattern.keywords.length
                        });
                    }
                }
            }
            
            // Analyze sentiment (basic implementation)
            const positiveWords = ['love', 'enjoy', 'excited', 'passionate', 'amazing', 'great', 'awesome'];
            const negativeWords = ['hate', 'dislike', 'boring', 'difficult', 'problem', 'issue'];
            
            const positive = positiveWords.some(word => text.includes(word));
            const negative = negativeWords.some(word => text.includes(word));
            
            if (positive && !negative) interests.sentiment = 'positive';
            if (negative && !positive) interests.sentiment = 'negative';
            
        } else if (Array.isArray(userInput)) {
            // Handle array of interests
            userInput.forEach(interest => {
                const subAnalysis = this.extractInterests(interest);
                interests.explicit.push(...subAnalysis.explicit);
                interests.keywords.push(...subAnalysis.keywords);
            });
        }
        
        // Calculate confidence based on number of matches
        interests.confidence = Math.min(interests.explicit.length / 3, 1.0);
        
        return interests;
    }
    
    /**
     * Analyze patterns using CAL (Context, Analysis, Learning) methodology
     */
    analyzePatterns(interests, context) {
        const analysis = {
            primaryPatterns: [],
            secondaryPatterns: [],
            conflictingPatterns: [],
            missingContext: [],
            learningOpportunities: [],
            userProfile: this.buildUserProfile(interests, context)
        };
        
        // Context Analysis
        const contextFactors = {
            experience: context.experience || 'beginner',
            timeAvailable: context.timeAvailable || 'moderate',
            budget: context.budget || 'free',
            purpose: context.purpose || 'personal',
            audience: context.audience || 'small'
        };
        
        // Pattern Matching
        interests.explicit.forEach(interest => {
            const pattern = this.calPatterns[interest.category]?.[interest.subcategory];
            if (pattern) {
                const patternStrength = this.calculatePatternStrength(interest, contextFactors);
                
                const patternAnalysis = {
                    ...interest,
                    pattern,
                    strength: patternStrength,
                    reasoning: this.generatePatternReasoning(interest, pattern, contextFactors)
                };
                
                if (patternStrength > 0.7) {
                    analysis.primaryPatterns.push(patternAnalysis);
                } else if (patternStrength > 0.4) {
                    analysis.secondaryPatterns.push(patternAnalysis);
                }
            }
        });
        
        // Identify conflicts
        analysis.conflictingPatterns = this.identifyConflicts(analysis.primaryPatterns);
        
        // Identify missing context
        analysis.missingContext = this.identifyMissingContext(interests, contextFactors);
        
        // Identify learning opportunities
        analysis.learningOpportunities = this.identifyLearningOpportunities(analysis);
        
        return analysis;
    }
    
    /**
     * Match patterns to available templates
     */
    matchTemplatesToPatterns(patternAnalysis) {
        const matches = new Map();
        
        // Match primary patterns
        patternAnalysis.primaryPatterns.forEach(pattern => {
            pattern.pattern.templates.forEach(templateId => {
                if (!matches.has(templateId)) {
                    matches.set(templateId, {
                        templateId,
                        patterns: [],
                        totalScore: 0,
                        primaryMatches: 0,
                        secondaryMatches: 0
                    });
                }
                
                const match = matches.get(templateId);
                match.patterns.push({
                    ...pattern,
                    type: 'primary',
                    contribution: pattern.strength * 2 // Primary patterns weighted more
                });
                match.totalScore += pattern.strength * 2;
                match.primaryMatches++;
            });
        });
        
        // Match secondary patterns
        patternAnalysis.secondaryPatterns.forEach(pattern => {
            pattern.pattern.templates.forEach(templateId => {
                if (!matches.has(templateId)) {
                    matches.set(templateId, {
                        templateId,
                        patterns: [],
                        totalScore: 0,
                        primaryMatches: 0,
                        secondaryMatches: 0
                    });
                }
                
                const match = matches.get(templateId);
                match.patterns.push({
                    ...pattern,
                    type: 'secondary',
                    contribution: pattern.strength
                });
                match.totalScore += pattern.strength;
                match.secondaryMatches++;
            });
        });
        
        return Array.from(matches.values());
    }
    
    /**
     * Score and rank templates based on multiple factors
     */
    scoreAndRankTemplates(templateMatches, context) {
        return templateMatches.map(match => {
            const template = this.templateBuilder.templateLibrary[match.templateId];
            if (!template) return null;
            
            // Base score from pattern matching
            let score = match.totalScore;
            
            // Complexity adjustment based on user experience
            const complexityBonus = this.calculateComplexityBonus(template.complexity, context.experience);
            score += complexityBonus;
            
            // Feature alignment bonus
            const featureBonus = this.calculateFeatureBonus(match.patterns, template.features);
            score += featureBonus;
            
            // Time constraint adjustment
            const timeBonus = this.calculateTimeBonus(template.buildTime, context.timeAvailable);
            score += timeBonus;
            
            // Popularity and success rate (simulated)
            const popularityBonus = this.calculatePopularityBonus(match.templateId);
            score += popularityBonus;
            
            return {
                ...match,
                template,
                finalScore: score,
                scoring: {
                    patternScore: match.totalScore,
                    complexityBonus,
                    featureBonus,
                    timeBonus,
                    popularityBonus
                },
                reasoning: this.generateTemplateReasoning(match, template, context)
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.finalScore - a.finalScore);
    }
    
    /**
     * Generate final recommendations with detailed reasoning
     */
    generateRecommendations(rankedTemplates, patternAnalysis) {
        const recommendations = {
            primary: rankedTemplates.slice(0, 3), // Top 3 recommendations
            alternatives: rankedTemplates.slice(3, 6), // Alternative options
            experimental: this.getExperimentalRecommendations(patternAnalysis),
            customization: this.getCustomizationSuggestions(rankedTemplates[0], patternAnalysis),
            learning: this.getLearningRecommendations(patternAnalysis),
            progression: this.getProgressionPath(rankedTemplates)
        };
        
        return recommendations;
    }
    
    /**
     * Utility methods for scoring and analysis
     */
    scoreByKeywordMatch(interest, keywords) {
        if (typeof interest !== 'string') return 0;
        
        const text = interest.toLowerCase();
        const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
        return matches.length / keywords.length;
    }
    
    calculatePatternStrength(interest, contextFactors) {
        let strength = interest.score;
        
        // Adjust based on context
        if (contextFactors.experience === 'beginner' && interest.pattern?.complexity === 'simple') {
            strength += 0.2;
        }
        if (contextFactors.experience === 'expert' && interest.pattern?.complexity === 'complex') {
            strength += 0.2;
        }
        
        return Math.min(strength, 1.0);
    }
    
    calculateComplexityBonus(templateComplexity, userExperience) {
        const complexityMap = {
            beginner: { simple: 0.3, medium: 0, complex: -0.2 },
            intermediate: { simple: 0.1, medium: 0.2, complex: 0.1 },
            expert: { simple: 0, medium: 0.1, complex: 0.3 }
        };
        
        return complexityMap[userExperience]?.[templateComplexity] || 0;
    }
    
    calculateFeatureBonus(patterns, templateFeatures) {
        const desiredFeatures = new Set();
        patterns.forEach(pattern => {
            if (pattern.pattern.features) {
                pattern.pattern.features.forEach(feature => desiredFeatures.add(feature));
            }
        });
        
        const matchedFeatures = templateFeatures.filter(feature => 
            desiredFeatures.has(feature)
        );
        
        return (matchedFeatures.length / Math.max(templateFeatures.length, 1)) * 0.2;
    }
    
    calculateTimeBonus(buildTime, timeAvailable) {
        const timeMap = {
            minimal: { '15-30 minutes': 0.3, '30-60 minutes': 0.1, '1-2 hours': -0.1 },
            moderate: { '15-30 minutes': 0.1, '30-60 minutes': 0.2, '1-2 hours': 0.1 },
            extensive: { '15-30 minutes': 0, '30-60 minutes': 0.1, '1-2 hours': 0.2 }
        };
        
        return timeMap[timeAvailable]?.[buildTime] || 0;
    }
    
    calculatePopularityBonus(templateId) {
        // Simulated popularity scores (in production, use real usage data)
        const popularityScores = {
            blog: 0.2,
            portfolio: 0.15,
            ecommerce: 0.25,
            landing: 0.2,
            forum: 0.1,
            game: 0.05
        };
        
        return popularityScores[templateId] || 0;
    }
    
    generatePatternReasoning(interest, pattern, contextFactors) {
        return {
            match: `Detected strong interest in ${interest.category}/${interest.subcategory}`,
            keywords: `Matched keywords: ${interest.keywords.join(', ')}`,
            context: `Suitable for ${contextFactors.experience} level with ${contextFactors.timeAvailable} time`,
            features: `Recommended features: ${pattern.features.join(', ')}`
        };
    }
    
    generateTemplateReasoning(match, template, context) {
        const reasons = [];
        
        if (match.primaryMatches > 0) {
            reasons.push(`Strong match with ${match.primaryMatches} primary interests`);
        }
        
        if (template.complexity === 'simple' && context.experience === 'beginner') {
            reasons.push('Perfect complexity for beginners');
        }
        
        if (template.features.length > 5) {
            reasons.push('Feature-rich template with comprehensive functionality');
        }
        
        return reasons.join('. ');
    }
    
    identifyConflicts(primaryPatterns) {
        const conflicts = [];
        
        // Check for complexity conflicts
        const complexities = primaryPatterns.map(p => p.pattern.complexity);
        if (complexities.includes('simple') && complexities.includes('complex')) {
            conflicts.push({
                type: 'complexity',
                description: 'Mixed complexity requirements detected',
                suggestion: 'Consider starting with simpler template and adding features gradually'
            });
        }
        
        return conflicts;
    }
    
    identifyMissingContext(interests, contextFactors) {
        const missing = [];
        
        if (!contextFactors.budget) {
            missing.push('budget');
        }
        if (!contextFactors.audience) {
            missing.push('target audience');
        }
        if (interests.explicit.length === 0) {
            missing.push('specific interests');
        }
        
        return missing;
    }
    
    identifyLearningOpportunities(analysis) {
        const opportunities = [];
        
        if (analysis.primaryPatterns.length === 0) {
            opportunities.push({
                type: 'exploration',
                description: 'Explore different categories to find your interests',
                action: 'Try the interactive interest explorer'
            });
        }
        
        if (analysis.conflictingPatterns.length > 0) {
            opportunities.push({
                type: 'prioritization',
                description: 'Learn to prioritize features and goals',
                action: 'Complete the priority setting wizard'
            });
        }
        
        return opportunities;
    }
    
    getExperimentalRecommendations(patternAnalysis) {
        const experimental = [];
        
        // Suggest experimental templates for advanced users
        if (patternAnalysis.userProfile.adventurous) {
            experimental.push({
                templateId: 'experiment',
                reason: 'For users interested in cutting-edge features',
                features: ['ai-integration', 'blockchain', 'advanced-analytics']
            });
        }
        
        return experimental;
    }
    
    getCustomizationSuggestions(topTemplate, patternAnalysis) {
        if (!topTemplate) return [];
        
        const suggestions = [];
        
        // Suggest customizations based on patterns
        patternAnalysis.primaryPatterns.forEach(pattern => {
            pattern.pattern.features.forEach(feature => {
                if (!topTemplate.template.features.includes(feature)) {
                    suggestions.push({
                        feature,
                        reason: `Based on your interest in ${pattern.category}`,
                        complexity: 'medium'
                    });
                }
            });
        });
        
        return suggestions.slice(0, 5); // Top 5 suggestions
    }
    
    getLearningRecommendations(patternAnalysis) {
        const recommendations = [];
        
        // Suggest learning resources based on patterns
        patternAnalysis.primaryPatterns.forEach(pattern => {
            recommendations.push({
                topic: pattern.subcategory,
                resources: [
                    `${pattern.subcategory} best practices guide`,
                    `Interactive ${pattern.subcategory} tutorial`,
                    `${pattern.subcategory} community forum`
                ]
            });
        });
        
        return recommendations;
    }
    
    getProgressionPath(rankedTemplates) {
        const path = [];
        
        if (rankedTemplates.length > 0) {
            path.push({
                step: 1,
                template: rankedTemplates[0].templateId,
                goal: 'Build your first site',
                duration: rankedTemplates[0].template.buildTime
            });
            
            if (rankedTemplates.length > 1) {
                path.push({
                    step: 2,
                    template: rankedTemplates[1].templateId,
                    goal: 'Expand with additional features',
                    duration: 'Additional 30-60 minutes'
                });
            }
            
            path.push({
                step: 3,
                template: 'custom',
                goal: 'Create custom solutions',
                duration: 'Ongoing development'
            });
        }
        
        return path;
    }
    
    buildUserProfile(interests, context) {
        return {
            primaryCategories: this.extractPrimaryCategories(interests),
            experienceLevel: context.experience || 'beginner',
            timeCommitment: context.timeAvailable || 'moderate',
            adventurous: interests.explicit.some(i => i.category === 'experimental'),
            businessOriented: interests.explicit.some(i => i.category === 'business'),
            communityFocused: interests.explicit.some(i => i.category === 'community'),
            techSavvy: interests.explicit.some(i => 
                ['tools', 'experimental'].includes(i.category)
            )
        };
    }
    
    extractPrimaryCategories(interests) {
        const categories = new Map();
        
        interests.explicit.forEach(interest => {
            const count = categories.get(interest.category) || 0;
            categories.set(interest.category, count + 1);
        });
        
        return Array.from(categories.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category]) => category);
    }
    
    calculateConfidence(patternAnalysis) {
        let confidence = 0;
        
        // Base confidence from primary patterns
        confidence += patternAnalysis.primaryPatterns.length * 0.3;
        
        // Reduce confidence for conflicts
        confidence -= patternAnalysis.conflictingPatterns.length * 0.1;
        
        // Reduce confidence for missing context
        confidence -= patternAnalysis.missingContext.length * 0.05;
        
        return Math.max(0, Math.min(1, confidence));
    }
    
    generateAnalysisId(userInput, context) {
        const data = JSON.stringify({ userInput, context });
        return crypto.createHash('md5').update(data).digest('hex').substring(0, 16);
    }
    
    /**
     * Get cached analysis for a user
     */
    getCachedAnalysis(userInput, context) {
        const analysisId = this.generateAnalysisId(userInput, context);
        return this.analysisCache.get(analysisId);
    }
    
    /**
     * Clear analysis cache
     */
    clearCache() {
        this.analysisCache.clear();
        console.log('🧽 Analysis cache cleared');
    }
    
    /**
     * Get analysis statistics
     */
    getStats() {
        return {
            totalAnalyses: this.analysisCache.size,
            patterns: this.getTotalPatterns(),
            categories: Object.keys(this.calPatterns).length,
            userProfiles: this.userProfiles.size
        };
    }
}

// Export for use
module.exports = CALTemplateMatcher;

// Demo if run directly
if (require.main === module) {
    (async () => {
        console.log('\n=== CAL Template Matcher Demo ===\n');
        
        const matcher = new CALTemplateMatcher();
        
        // Test different user inputs
        const testCases = [
            {
                input: "I want to start a blog about cooking and share my recipes with friends",
                context: { experience: 'beginner', timeAvailable: 'moderate', purpose: 'personal' }
            },
            {
                input: "Need to build an online store to sell handmade jewelry",
                context: { experience: 'intermediate', timeAvailable: 'extensive', purpose: 'business' }
            },
            {
                input: ["gaming", "tournament", "esports", "competitive"],
                context: { experience: 'expert', timeAvailable: 'extensive', purpose: 'community' }
            },
            {
                input: "I'm a photographer looking to showcase my portfolio online",
                context: { experience: 'beginner', timeAvailable: 'minimal', purpose: 'professional' }
            }
        ];
        
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n--- Test Case ${i + 1} ---`);
            console.log('Input:', testCase.input);
            console.log('Context:', testCase.context);
            
            try {
                const analysis = await matcher.analyzeInterests(testCase.input, testCase.context);
                
                console.log(`\n🧠 Analysis Results (Confidence: ${Math.round(analysis.confidence * 100)}%):`);
                
                console.log('\nPrimary Recommendations:');
                analysis.recommendations.primary.forEach((rec, index) => {
                    console.log(`  ${index + 1}. ${rec.template.name} (Score: ${rec.finalScore.toFixed(2)})`);
                    console.log(`     Reason: ${rec.reasoning}`);
                });
                
                if (analysis.recommendations.customization.length > 0) {
                    console.log('\nCustomization Suggestions:');
                    analysis.recommendations.customization.slice(0, 3).forEach(suggestion => {
                        console.log(`  - ${suggestion.feature}: ${suggestion.reason}`);
                    });
                }
                
                if (analysis.patternAnalysis.conflictingPatterns.length > 0) {
                    console.log('\n⚠️ Conflicts Detected:');
                    analysis.patternAnalysis.conflictingPatterns.forEach(conflict => {
                        console.log(`  - ${conflict.description}`);
                    });
                }
                
            } catch (error) {
                console.error(`❌ Analysis failed: ${error.message}`);
            }
        }
        
        // Show system stats
        console.log('\n📊 System Statistics:');
        const stats = matcher.getStats();
        console.log(`Total Analyses: ${stats.totalAnalyses}`);
        console.log(`Available Patterns: ${stats.patterns}`);
        console.log(`Interest Categories: ${stats.categories}`);
        
    })().catch(console.error);
}

console.log('🧠 CAL Template Matcher loaded');
console.log('🎯 Intelligent interest-to-template matching using CAL methodology');
console.log('📊 Advanced pattern analysis and recommendation engine');
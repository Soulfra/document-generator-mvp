#!/usr/bin/env node

/**
 * CHARACTER EXPERTISE ROUTER
 * 
 * Intelligently routes the right character experts to review components based on:
 * - Component type and technical requirements
 * - Character specializations and expertise domains
 * - Workload balancing and availability
 * - Past review performance and success rates
 * - Dynamic expertise matching and learning
 * 
 * Characters and Their Expertise:
 * - Cal ⚡: Web development, JavaScript, APIs, frontend systems
 * - Arty 🎨: UI/UX design, user experience, visual design, accessibility
 * - Ralph 🔧: Backend systems, databases, infrastructure, server architecture
 * - Vera 🛡️: Security, compliance, privacy, authentication, risk assessment
 * - Paulo 🧠: AI/ML, data science, analytics, automation, intelligent systems
 * - Nash 📈: Business strategy, economics, monetization, scaling, market analysis
 * - Sage 📚: Documentation, standards, best practices, knowledge management
 * - Pixel 🎮: Game design, user engagement, gamification, interactive systems
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CharacterExpertiseRouter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Routing parameters
            maxCharactersPerReview: options.maxCharactersPerReview || 4,
            minCharactersPerReview: options.minCharactersPerReview || 2,
            expertiseMatchThreshold: options.expertiseMatchThreshold || 0.3,
            workloadBalancingWeight: options.workloadBalancingWeight || 0.2,
            
            // Learning parameters
            trackPerformance: options.trackPerformance !== false,
            adaptiveRouting: options.adaptiveRouting !== false,
            feedbackLearning: options.feedbackLearning !== false,
            
            ...options
        };
        
        // Character definitions with detailed expertise
        this.characters = {
            cal: {
                name: 'Cal',
                emoji: '⚡',
                role: 'Web Developer & Technical Lead',
                personality: 'Pragmatic, efficient, focused on getting things done',
                
                // Core expertise domains
                coreExpertise: [
                    'javascript', 'typescript', 'node.js', 'react', 'vue', 'angular',
                    'frontend-development', 'web-apis', 'rest-apis', 'graphql',
                    'web-performance', 'browser-compatibility', 'responsive-design'
                ],
                
                // Secondary expertise
                secondaryExpertise: [
                    'backend-integration', 'testing', 'debugging', 'deployment',
                    'code-review', 'technical-documentation', 'mentoring'
                ],
                
                // Component type preferences (0-1 scale)
                componentPreferences: {
                    'frontend-ui': 0.9,
                    'backend-service': 0.6,
                    'integration-connector': 0.8,
                    'business-logic': 0.5,
                    'data-analytics': 0.4
                },
                
                // Review focus areas
                reviewFocus: [
                    'code-quality', 'performance', 'maintainability', 
                    'best-practices', 'user-experience', 'technical-feasibility'
                ],
                
                // Workload and availability
                currentWorkload: 0,
                maxWorkload: 10,
                availability: 'high',
                timezone: 'PST',
                
                // Performance metrics
                reviewsCompleted: 0,
                averageReviewTime: 2.5, // hours
                successRate: 0.85,
                communityRating: 4.2
            },
            
            arty: {
                name: 'Arty',
                emoji: '🎨',
                role: 'Design Director & UX Lead',
                personality: 'Creative, user-focused, attention to aesthetic detail',
                
                coreExpertise: [
                    'ui-design', 'ux-design', 'user-research', 'usability-testing',
                    'accessibility', 'visual-design', 'design-systems', 'prototyping',
                    'information-architecture', 'interaction-design', 'mobile-design'
                ],
                
                secondaryExpertise: [
                    'branding', 'illustration', 'animation', 'user-psychology',
                    'design-tools', 'design-documentation', 'stakeholder-communication'
                ],
                
                componentPreferences: {
                    'frontend-ui': 0.95,
                    'gaming-system': 0.8,
                    'data-analytics': 0.7,
                    'business-logic': 0.4,
                    'infrastructure': 0.2
                },
                
                reviewFocus: [
                    'user-experience', 'accessibility', 'visual-design', 
                    'usability', 'design-consistency', 'user-feedback'
                ],
                
                currentWorkload: 0,
                maxWorkload: 8,
                availability: 'high',
                timezone: 'EST',
                
                reviewsCompleted: 0,
                averageReviewTime: 3.0,
                successRate: 0.88,
                communityRating: 4.5
            },
            
            ralph: {
                name: 'Ralph',
                emoji: '🔧',
                role: 'Backend Engineer & Infrastructure Architect',
                personality: 'Systematic, reliability-focused, performance-oriented',
                
                coreExpertise: [
                    'backend-development', 'database-design', 'system-architecture',
                    'microservices', 'api-design', 'server-administration', 'devops',
                    'performance-optimization', 'scalability', 'distributed-systems'
                ],
                
                secondaryExpertise: [
                    'cloud-platforms', 'containerization', 'monitoring', 'logging',
                    'backup-recovery', 'disaster-planning', 'capacity-planning'
                ],
                
                componentPreferences: {
                    'backend-service': 0.95,
                    'infrastructure': 0.9,
                    'data-analytics': 0.8,
                    'integration-connector': 0.7,
                    'blockchain-crypto': 0.6,
                    'frontend-ui': 0.3
                },
                
                reviewFocus: [
                    'system-reliability', 'performance', 'scalability',
                    'architecture-quality', 'operational-concerns', 'monitoring'
                ],
                
                currentWorkload: 0,
                maxWorkload: 12,
                availability: 'high',
                timezone: 'CST',
                
                reviewsCompleted: 0,
                averageReviewTime: 4.0,
                successRate: 0.82,
                communityRating: 4.1
            },
            
            vera: {
                name: 'Vera',
                emoji: '🛡️',
                role: 'Security Expert & Compliance Officer',
                personality: 'Meticulous, risk-aware, compliance-focused',
                
                coreExpertise: [
                    'cybersecurity', 'application-security', 'infrastructure-security',
                    'authentication', 'authorization', 'encryption', 'privacy',
                    'compliance', 'risk-assessment', 'penetration-testing'
                ],
                
                secondaryExpertise: [
                    'regulatory-compliance', 'audit-preparation', 'incident-response',
                    'security-training', 'policy-development', 'threat-modeling'
                ],
                
                componentPreferences: {
                    'auth-security': 0.95,
                    'backend-service': 0.85,
                    'blockchain-crypto': 0.8,
                    'data-analytics': 0.7,
                    'ai-ml-model': 0.6,
                    'gaming-system': 0.4
                },
                
                reviewFocus: [
                    'security-vulnerabilities', 'compliance-requirements', 'privacy-protection',
                    'risk-mitigation', 'audit-readiness', 'security-best-practices'
                ],
                
                currentWorkload: 0,
                maxWorkload: 8,
                availability: 'high',
                timezone: 'EST',
                
                reviewsCompleted: 0,
                averageReviewTime: 5.0,
                successRate: 0.90,
                communityRating: 4.6
            },
            
            paulo: {
                name: 'Paulo',
                emoji: '🧠',
                role: 'AI Specialist & Data Science Lead',
                personality: 'Analytical, research-oriented, ethically-conscious',
                
                coreExpertise: [
                    'machine-learning', 'deep-learning', 'neural-networks', 'nlp',
                    'computer-vision', 'data-science', 'statistical-analysis',
                    'ai-ethics', 'model-evaluation', 'data-engineering'
                ],
                
                secondaryExpertise: [
                    'research-methodology', 'experimental-design', 'data-visualization',
                    'automation', 'predictive-analytics', 'ai-explainability'
                ],
                
                componentPreferences: {
                    'ai-ml-model': 0.95,
                    'data-analytics': 0.9,
                    'backend-service': 0.6,
                    'business-logic': 0.5,
                    'frontend-ui': 0.3
                },
                
                reviewFocus: [
                    'model-accuracy', 'bias-detection', 'ethical-considerations',
                    'data-quality', 'explainability', 'performance-metrics'
                ],
                
                currentWorkload: 0,
                maxWorkload: 6,
                availability: 'medium',
                timezone: 'PST',
                
                reviewsCompleted: 0,
                averageReviewTime: 6.0,
                successRate: 0.87,
                communityRating: 4.3
            },
            
            nash: {
                name: 'Nash',
                emoji: '📈',
                role: 'Business Strategist & Economics Analyst',
                personality: 'Strategic, market-aware, ROI-focused',
                
                coreExpertise: [
                    'business-strategy', 'market-analysis', 'financial-modeling',
                    'monetization', 'pricing-strategy', 'competitive-analysis',
                    'growth-strategy', 'roi-analysis', 'business-development'
                ],
                
                secondaryExpertise: [
                    'product-management', 'stakeholder-management', 'negotiation',
                    'partnerships', 'market-research', 'business-intelligence'
                ],
                
                componentPreferences: {
                    'blockchain-crypto': 0.9,
                    'gaming-system': 0.85,
                    'data-analytics': 0.8,
                    'business-logic': 0.75,
                    'integration-connector': 0.6,
                    'infrastructure': 0.5
                },
                
                reviewFocus: [
                    'business-viability', 'market-potential', 'cost-benefit-analysis',
                    'competitive-advantage', 'monetization-strategy', 'scalability'
                ],
                
                currentWorkload: 0,
                maxWorkload: 10,
                availability: 'high',
                timezone: 'EST',
                
                reviewsCompleted: 0,
                averageReviewTime: 3.5,
                successRate: 0.79,
                communityRating: 3.9
            },
            
            sage: {
                name: 'Sage',
                emoji: '📚',
                role: 'Knowledge Keeper & Standards Expert',
                personality: 'Methodical, detail-oriented, standards-focused',
                
                coreExpertise: [
                    'documentation', 'technical-writing', 'standards-compliance',
                    'best-practices', 'code-review', 'quality-assurance',
                    'knowledge-management', 'process-improvement', 'training'
                ],
                
                secondaryExpertise: [
                    'project-management', 'requirements-analysis', 'testing-strategy',
                    'change-management', 'governance', 'mentoring'
                ],
                
                componentPreferences: {
                    'business-logic': 0.8,
                    'backend-service': 0.7,
                    'data-analytics': 0.7,
                    'frontend-ui': 0.6,
                    'infrastructure': 0.6,
                    'gaming-system': 0.4
                },
                
                reviewFocus: [
                    'documentation-quality', 'standards-compliance', 'maintainability',
                    'code-quality', 'testing-coverage', 'knowledge-transfer'
                ],
                
                currentWorkload: 0,
                maxWorkload: 15,
                availability: 'high',
                timezone: 'UTC',
                
                reviewsCompleted: 0,
                averageReviewTime: 2.0,
                successRate: 0.83,
                communityRating: 4.0
            },
            
            pixel: {
                name: 'Pixel',
                emoji: '🎮',
                role: 'Gaming Expert & Engagement Specialist',
                personality: 'Playful, user-engagement focused, creative',
                
                coreExpertise: [
                    'game-design', 'user-engagement', 'gamification', 'player-psychology',
                    'interactive-systems', 'entertainment-value', 'user-retention',
                    'game-balance', 'monetization-ethics', 'community-building'
                ],
                
                secondaryExpertise: [
                    'animation', '3d-modeling', 'sound-design', 'narrative-design',
                    'multiplayer-systems', 'virtual-reality', 'augmented-reality'
                ],
                
                componentPreferences: {
                    'gaming-system': 0.95,
                    'frontend-ui': 0.8,
                    'ai-ml-model': 0.6,
                    'data-analytics': 0.5,
                    'business-logic': 0.4
                },
                
                reviewFocus: [
                    'user-engagement', 'entertainment-value', 'game-balance',
                    'player-experience', 'retention-metrics', 'monetization-ethics'
                ],
                
                currentWorkload: 0,
                maxWorkload: 8,
                availability: 'medium',
                timezone: 'PST',
                
                reviewsCompleted: 0,
                averageReviewTime: 3.5,
                successRate: 0.81,
                communityRating: 4.4
            }
        };
        
        // Expertise mapping for component types
        this.expertiseMappings = {
            'frontend-ui': ['cal', 'arty', 'pixel', 'sage'],
            'backend-service': ['ralph', 'vera', 'cal', 'sage'],
            'ai-ml-model': ['paulo', 'vera', 'sage', 'nash'],
            'auth-security': ['vera', 'ralph', 'sage', 'cal'],
            'blockchain-crypto': ['nash', 'vera', 'paulo', 'ralph'],
            'gaming-system': ['pixel', 'nash', 'arty', 'cal'],
            'data-analytics': ['paulo', 'nash', 'arty', 'sage'],
            'infrastructure': ['ralph', 'vera', 'nash', 'sage'],
            'business-logic': ['nash', 'sage', 'ralph', 'cal'],
            'integration-connector': ['ralph', 'cal', 'vera', 'sage']
        };
        
        // Routing history for learning
        this.routingHistory = [];
        this.performanceMetrics = new Map();
        
        console.log('🧭 Character Expertise Router initialized');
        console.log(`👥 ${Object.keys(this.characters).length} characters available`);
    }
    
    /**
     * Route appropriate characters for a component review
     */
    async routeExperts(classification, template = null, context = {}) {
        try {
            const routingId = crypto.randomUUID();
            const startTime = Date.now();
            
            console.log(`🧭 Routing experts for component: ${routingId}`);
            console.log(`🎯 Component type: ${classification.primaryType}`);
            console.log(`⚖️ Risk level: ${classification.riskLevel}, Complexity: ${classification.complexity}`);
            
            // Get candidate characters based on expertise
            const candidates = this.getCandidateCharacters(classification);
            
            // Score candidates based on multiple factors
            const scoredCandidates = this.scoreCandidates(candidates, classification, template, context);
            
            // Select optimal team composition
            const selectedTeam = this.selectOptimalTeam(scoredCandidates, classification);
            
            // Update workloads
            this.updateWorkloads(selectedTeam, classification);
            
            // Create routing result
            const routing = {
                id: routingId,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime,
                
                // Component context
                componentType: classification.primaryType,
                riskLevel: classification.riskLevel,
                complexity: classification.complexity,
                
                // Selected team
                selectedExperts: selectedTeam.map(expert => expert.characterId),
                teamComposition: selectedTeam,
                
                // Routing analysis
                candidatesConsidered: candidates.length,
                routingStrategy: this.determineRoutingStrategy(classification, context),
                
                // Team characteristics
                teamSize: selectedTeam.length,
                averageExpertise: selectedTeam.reduce((sum, expert) => sum + expert.expertiseScore, 0) / selectedTeam.length,
                estimatedReviewTime: this.estimateReviewTime(selectedTeam),
                
                // Context
                originalClassification: classification,
                routingContext: context
            };
            
            // Record for learning
            this.recordRouting(routing);
            
            console.log(`✅ Expert team assembled: ${selectedTeam.map(e => this.characters[e.characterId].name).join(', ')}`);
            console.log(`👥 Team size: ${selectedTeam.length}, Average expertise: ${routing.averageExpertise.toFixed(2)}`);
            console.log(`⏱️ Estimated review time: ${routing.estimatedReviewTime} hours`);
            
            this.emit('experts_routed', routing);
            
            return routing;
            
        } catch (error) {
            console.error('❌ Expert routing failed:', error);
            this.emit('routing_error', { classification, error });
            throw error;
        }
    }
    
    /**
     * Get candidate characters based on component type and expertise
     */
    getCandidateCharacters(classification) {
        const primaryCandidates = this.expertiseMappings[classification.primaryType] || [];
        const secondaryTypes = classification.secondaryTypes || [];
        
        // Add candidates from secondary types
        const secondaryCandidates = secondaryTypes.flatMap(type => 
            this.expertiseMappings[type] || []
        );
        
        // Combine and deduplicate
        const allCandidates = [...new Set([...primaryCandidates, ...secondaryCandidates])];
        
        // Add required expertise from classification
        if (classification.requiredExpertise) {
            classification.requiredExpertise.forEach(expertId => {
                if (this.characters[expertId] && !allCandidates.includes(expertId)) {
                    allCandidates.push(expertId);
                }
            });
        }
        
        // Filter by availability
        return allCandidates.filter(characterId => {
            const character = this.characters[characterId];
            return character && 
                   character.availability !== 'unavailable' &&
                   character.currentWorkload < character.maxWorkload;
        });
    }
    
    /**
     * Score candidates based on multiple factors
     */
    scoreCandidates(candidates, classification, template, context) {
        return candidates.map(characterId => {
            const character = this.characters[characterId];
            
            // Base expertise score for this component type
            const expertiseScore = this.calculateExpertiseScore(character, classification);
            
            // Workload and availability score
            const availabilityScore = this.calculateAvailabilityScore(character);
            
            // Performance history score
            const performanceScore = this.calculatePerformanceScore(character, classification);
            
            // Specialization bonus
            const specializationScore = this.calculateSpecializationScore(character, classification, template);
            
            // Context-specific adjustments
            const contextScore = this.calculateContextScore(character, context);
            
            // Combined weighted score
            const totalScore = (
                expertiseScore * 0.4 +
                availabilityScore * this.config.workloadBalancingWeight +
                performanceScore * 0.2 +
                specializationScore * 0.15 +
                contextScore * 0.05
            );
            
            return {
                characterId,
                character,
                expertiseScore,
                availabilityScore,
                performanceScore,
                specializationScore,
                contextScore,
                totalScore,
                
                // Additional metadata
                estimatedTime: character.averageReviewTime,
                workloadImpact: this.calculateWorkloadImpact(character, classification)
            };
        }).sort((a, b) => b.totalScore - a.totalScore);
    }
    
    /**
     * Calculate expertise score for a character and component
     */
    calculateExpertiseScore(character, classification) {
        const componentType = classification.primaryType;
        
        // Component preference score
        const preferenceScore = character.componentPreferences[componentType] || 0.3;
        
        // Expertise domain overlap
        const requiredSkills = this.getRequiredSkills(classification);
        const characterSkills = [...character.coreExpertise, ...character.secondaryExpertise];
        
        const skillOverlap = requiredSkills.filter(skill => 
            characterSkills.some(charSkill => 
                charSkill.includes(skill) || skill.includes(charSkill)
            )
        ).length;
        
        const skillScore = skillOverlap / Math.max(requiredSkills.length, 1);
        
        // Risk level appropriateness
        const riskScore = this.calculateRiskAppropriatenessScore(character, classification.riskLevel);
        
        return (preferenceScore * 0.5 + skillScore * 0.3 + riskScore * 0.2);
    }
    
    /**
     * Calculate availability score based on current workload
     */
    calculateAvailabilityScore(character) {
        const workloadRatio = character.currentWorkload / character.maxWorkload;
        
        // Higher availability = higher score
        const baseScore = 1 - workloadRatio;
        
        // Availability level modifier
        const availabilityMultiplier = {
            'high': 1.0,
            'medium': 0.8,
            'low': 0.5,
            'unavailable': 0.0
        };
        
        return baseScore * (availabilityMultiplier[character.availability] || 0.5);
    }
    
    /**
     * Calculate performance score based on historical success
     */
    calculatePerformanceScore(character, classification) {
        const basePerformance = (
            character.successRate * 0.4 +
            (character.communityRating / 5) * 0.3 +
            Math.max(0, (10 - character.averageReviewTime) / 10) * 0.3
        );
        
        // Adjust based on historical performance with this component type
        const historicalPerformance = this.getHistoricalPerformance(character.name, classification.primaryType);
        
        return basePerformance * 0.7 + historicalPerformance * 0.3;
    }
    
    /**
     * Calculate specialization bonus
     */
    calculateSpecializationScore(character, classification, template) {
        let score = 0;
        
        // High-risk component bonus for security experts
        if (classification.riskLevel === 'very-high' && character.name === 'Vera') {
            score += 0.3;
        }
        
        // AI/ML complexity bonus for Paulo
        if (classification.complexity === 'very-complex' && character.name === 'Paulo') {
            score += 0.2;
        }
        
        // Business-critical bonus for Nash
        if (template?.primaryConcerns?.includes('monetization') && character.name === 'Nash') {
            score += 0.2;
        }
        
        // Design-heavy bonus for Arty
        if (classification.characteristics?.hasPerformance && character.name === 'Arty') {
            score += 0.15;
        }
        
        return Math.min(score, 0.5); // Cap at 0.5
    }
    
    /**
     * Calculate context-specific score adjustments
     */
    calculateContextScore(character, context) {
        let score = 0.5; // Neutral base
        
        // Urgency considerations
        if (context.urgency === 'high' && character.averageReviewTime < 3) {
            score += 0.2;
        }
        
        // Stakeholder preferences
        if (context.preferredExperts?.includes(character.name.toLowerCase())) {
            score += 0.3;
        }
        
        // Timezone considerations
        if (context.timezone && this.isTimezoneCompatible(character.timezone, context.timezone)) {
            score += 0.1;
        }
        
        return Math.min(Math.max(score, 0), 1);
    }
    
    /**
     * Select optimal team from scored candidates
     */
    selectOptimalTeam(scoredCandidates, classification) {
        const minExperts = Math.max(this.config.minCharactersPerReview, 
            classification.riskLevel === 'very-high' ? 3 : 2);
        const maxExperts = Math.min(this.config.maxCharactersPerReview,
            classification.complexity === 'very-complex' ? 5 : 4);
        
        const selectedTeam = [];
        const usedDomains = new Set();
        
        // Always include top-scored candidate
        if (scoredCandidates.length > 0) {
            selectedTeam.push(scoredCandidates[0]);
            this.addCharacterDomains(usedDomains, scoredCandidates[0].character);
        }
        
        // Add additional experts to cover missing domains
        for (const candidate of scoredCandidates.slice(1)) {
            if (selectedTeam.length >= maxExperts) break;
            
            // Check if this candidate adds new domain coverage
            const candidateDomains = this.getCharacterDomains(candidate.character);
            const newDomains = candidateDomains.filter(domain => !usedDomains.has(domain));
            
            // Add if brings new expertise or is highly scored
            if (newDomains.length > 0 || 
                (candidate.totalScore > 0.8 && selectedTeam.length < minExperts)) {
                selectedTeam.push(candidate);
                this.addCharacterDomains(usedDomains, candidate.character);
            }
        }
        
        // Ensure minimum team size
        while (selectedTeam.length < minExperts && selectedTeam.length < scoredCandidates.length) {
            const nextCandidate = scoredCandidates.find(c => 
                !selectedTeam.some(selected => selected.characterId === c.characterId)
            );
            if (nextCandidate) {
                selectedTeam.push(nextCandidate);
            } else {
                break;
            }
        }
        
        return selectedTeam;
    }
    
    // Utility methods
    getRequiredSkills(classification) {
        const baseSkills = {
            'frontend-ui': ['javascript', 'ui-design', 'user-experience', 'responsive-design'],
            'backend-service': ['backend-development', 'database-design', 'api-design', 'security'],
            'ai-ml-model': ['machine-learning', 'data-science', 'ai-ethics', 'model-evaluation'],
            'auth-security': ['cybersecurity', 'authentication', 'encryption', 'compliance'],
            'blockchain-crypto': ['blockchain', 'cryptography', 'smart-contracts', 'tokenomics'],
            'gaming-system': ['game-design', 'user-engagement', 'player-psychology', 'monetization'],
            'data-analytics': ['data-science', 'analytics', 'visualization', 'statistics'],
            'infrastructure': ['system-architecture', 'devops', 'monitoring', 'scalability'],
            'business-logic': ['business-analysis', 'workflow-design', 'requirements', 'testing'],
            'integration-connector': ['api-integration', 'system-integration', 'error-handling', 'monitoring']
        };
        
        return baseSkills[classification.primaryType] || ['general-development', 'code-review', 'testing'];
    }
    
    calculateRiskAppropriatenessScore(character, riskLevel) {
        const riskHandlingCapability = {
            'cal': 0.7,
            'arty': 0.6,
            'ralph': 0.9,
            'vera': 0.95,
            'paulo': 0.8,
            'nash': 0.7,
            'sage': 0.8,
            'pixel': 0.6
        };
        
        const riskMultiplier = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.2,
            'very-high': 1.5
        };
        
        return (riskHandlingCapability[character.name.toLowerCase()] || 0.5) * 
               (riskMultiplier[riskLevel] || 1.0);
    }
    
    getHistoricalPerformance(characterName, componentType) {
        const key = `${characterName}-${componentType}`;
        const performance = this.performanceMetrics.get(key);
        
        if (!performance || performance.reviewCount < 3) {
            return 0.5; // Neutral for insufficient data
        }
        
        return (performance.successRate + performance.avgRating / 5) / 2;
    }
    
    getCharacterDomains(character) {
        // Map expertise to high-level domains
        const domainMap = {
            'frontend': ['javascript', 'typescript', 'react', 'vue', 'angular', 'ui-design', 'ux-design'],
            'backend': ['backend-development', 'database-design', 'api-design', 'server-administration'],
            'security': ['cybersecurity', 'authentication', 'encryption', 'compliance', 'privacy'],
            'ai-ml': ['machine-learning', 'data-science', 'neural-networks', 'analytics'],
            'business': ['business-strategy', 'market-analysis', 'monetization', 'roi-analysis'],
            'design': ['ui-design', 'ux-design', 'visual-design', 'accessibility'],
            'infrastructure': ['system-architecture', 'devops', 'scalability', 'performance'],
            'gaming': ['game-design', 'user-engagement', 'gamification', 'entertainment'],
            'documentation': ['technical-writing', 'documentation', 'standards', 'best-practices']
        };
        
        const domains = [];
        const allExpertise = [...character.coreExpertise, ...character.secondaryExpertise];
        
        for (const [domain, keywords] of Object.entries(domainMap)) {
            if (keywords.some(keyword => allExpertise.includes(keyword))) {
                domains.push(domain);
            }
        }
        
        return domains;
    }
    
    addCharacterDomains(usedDomains, character) {
        const domains = this.getCharacterDomains(character);
        domains.forEach(domain => usedDomains.add(domain));
    }
    
    calculateWorkloadImpact(character, classification) {
        const baseImpact = {
            'simple': 1,
            'medium': 2,
            'complex': 3,
            'very-complex': 4
        };
        
        const riskMultiplier = {
            'low': 1.0,
            'medium': 1.2,
            'high': 1.5,
            'very-high': 2.0
        };
        
        return (baseImpact[classification.complexity] || 2) * 
               (riskMultiplier[classification.riskLevel] || 1.0);
    }
    
    updateWorkloads(selectedTeam, classification) {
        selectedTeam.forEach(expert => {
            const character = this.characters[expert.characterId];
            character.currentWorkload += expert.workloadImpact;
        });
    }
    
    estimateReviewTime(selectedTeam) {
        // Team review is not just sum of individual times
        const totalIndividualTime = selectedTeam.reduce((sum, expert) => 
            sum + expert.character.averageReviewTime, 0
        );
        
        // Account for parallelization and collaboration overhead
        const parallelizationFactor = 0.7; // Some work can be done in parallel
        const collaborationOverhead = 1.2; // Some overhead for coordination
        
        return (totalIndividualTime * parallelizationFactor * collaborationOverhead) / selectedTeam.length;
    }
    
    determineRoutingStrategy(classification, context) {
        if (classification.riskLevel === 'very-high') return 'security-first';
        if (classification.complexity === 'very-complex') return 'expertise-heavy';
        if (context.urgency === 'high') return 'fast-track';
        if (context.stakeholders?.includes('customers')) return 'user-focused';
        return 'balanced';
    }
    
    isTimezoneCompatible(charTimezone, contextTimezone) {
        // Simplified timezone compatibility check
        const timezoneGroups = {
            'PST': ['PST', 'MST'],
            'CST': ['CST', 'EST'],
            'EST': ['EST', 'UTC'],
            'UTC': ['UTC', 'EST']
        };
        
        return timezoneGroups[charTimezone]?.includes(contextTimezone) || 
               timezoneGroups[contextTimezone]?.includes(charTimezone);
    }
    
    recordRouting(routing) {
        this.routingHistory.push({
            id: routing.id,
            timestamp: routing.timestamp,
            componentType: routing.componentType,
            teamSize: routing.teamSize,
            selectedExperts: routing.selectedExperts,
            processingTime: routing.processingTime
        });
        
        // Keep only last 1000 routings
        if (this.routingHistory.length > 1000) {
            this.routingHistory.shift();
        }
    }
    
    /**
     * Update character performance based on review feedback
     */
    updatePerformance(characterName, componentType, feedback) {
        const key = `${characterName}-${componentType}`;
        const current = this.performanceMetrics.get(key) || {
            reviewCount: 0,
            successRate: 0.5,
            avgRating: 2.5,
            totalRating: 0
        };
        
        current.reviewCount++;
        current.totalRating += feedback.rating;
        current.avgRating = current.totalRating / current.reviewCount;
        
        if (feedback.successful) {
            current.successRate = (current.successRate * (current.reviewCount - 1) + 1) / current.reviewCount;
        } else {
            current.successRate = (current.successRate * (current.reviewCount - 1)) / current.reviewCount;
        }
        
        this.performanceMetrics.set(key, current);
        
        // Also update character's global metrics
        const character = this.characters[characterName.toLowerCase()];
        if (character) {
            character.reviewsCompleted++;
            character.communityRating = (character.communityRating * 0.9 + feedback.rating * 0.1);
            character.successRate = (character.successRate * 0.9 + (feedback.successful ? 1 : 0) * 0.1);
        }
    }
    
    /**
     * Get routing statistics
     */
    getStatistics() {
        const total = this.routingHistory.length;
        if (total === 0) return { totalRoutings: 0 };
        
        const teamSizeDistribution = {};
        const componentTypeDistribution = {};
        let totalTime = 0;
        
        this.routingHistory.forEach(routing => {
            teamSizeDistribution[routing.teamSize] = 
                (teamSizeDistribution[routing.teamSize] || 0) + 1;
            componentTypeDistribution[routing.componentType] = 
                (componentTypeDistribution[routing.componentType] || 0) + 1;
            totalTime += routing.processingTime;
        });
        
        // Character utilization
        const characterUtilization = {};
        Object.keys(this.characters).forEach(charId => {
            const char = this.characters[charId];
            characterUtilization[charId] = {
                name: char.name,
                currentWorkload: char.currentWorkload,
                maxWorkload: char.maxWorkload,
                utilization: char.currentWorkload / char.maxWorkload,
                reviewsCompleted: char.reviewsCompleted,
                successRate: char.successRate
            };
        });
        
        return {
            totalRoutings: total,
            averageProcessingTime: totalTime / total,
            averageTeamSize: this.routingHistory.reduce((sum, r) => sum + r.teamSize, 0) / total,
            teamSizeDistribution,
            componentTypeDistribution,
            characterUtilization,
            performanceMetrics: Object.fromEntries(this.performanceMetrics)
        };
    }
    
    /**
     * Get character status and availability
     */
    getCharacterStatus() {
        return Object.entries(this.characters).map(([id, char]) => ({
            id,
            name: char.name,
            emoji: char.emoji,
            role: char.role,
            availability: char.availability,
            currentWorkload: char.currentWorkload,
            maxWorkload: char.maxWorkload,
            utilizationRate: char.currentWorkload / char.maxWorkload,
            successRate: char.successRate,
            communityRating: char.communityRating,
            reviewsCompleted: char.reviewsCompleted
        }));
    }
}

module.exports = CharacterExpertiseRouter;

// CLI execution
if (require.main === module) {
    const CharacterExpertiseRouter = require('./character-expertise-router');
    const ComponentTypeClassifier = require('./component-type-classifier');
    const DiscussionTemplateGenerator = require('./discussion-template-generator');
    
    const router = new CharacterExpertiseRouter();
    const classifier = new ComponentTypeClassifier();
    const templateGenerator = new DiscussionTemplateGenerator();
    
    console.log('🧭 Character Expertise Router ready');
    console.log('Character Status:', router.getCharacterStatus());
    
    if (process.argv.includes('--demo')) {
        console.log('\n🎭 Running demo expert routing...\n');
        
        const examples = [
            'React user authentication component with OAuth integration',
            'High-risk smart contract for decentralized finance',
            'AI-powered fraud detection system with explainable decisions',
            'Real-time multiplayer gaming backend with anti-cheat',
            'Enterprise data analytics dashboard with privacy controls'
        ];
        
        (async () => {
            for (const example of examples) {
                console.log(`\n--- Routing experts for: "${example}" ---`);
                try {
                    const classification = await classifier.classify(example);
                    const template = await templateGenerator.generateTemplate(classification);
                    const routing = await router.routeExperts(classification, template, {
                        urgency: 'medium',
                        stakeholders: ['developers', 'users']
                    });
                    
                    console.log(`Selected Team: ${routing.selectedExperts.map(id => router.characters[id].name).join(', ')}`);
                    console.log(`Team Size: ${routing.teamSize}`);
                    console.log(`Average Expertise: ${routing.averageExpertise.toFixed(2)}`);
                    console.log(`Estimated Time: ${routing.estimatedReviewTime.toFixed(1)} hours`);
                    
                } catch (error) {
                    console.error('Expert routing failed:', error.message);
                }
            }
            
            console.log('\n📊 Final Statistics:');
            console.log(JSON.stringify(router.getStatistics(), null, 2));
        })();
    }
}
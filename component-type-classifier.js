#!/usr/bin/env node

/**
 * COMPONENT TYPE CLASSIFIER
 * 
 * Analyzes any input (text, code, document, idea) and classifies it into specific
 * component types for automated Chapter 7 generation. Uses AI analysis combined
 * with pattern matching to determine:
 * 
 * - Component category (frontend, backend, ai, security, etc.)
 * - Technical characteristics (complexity, dependencies, risk level)
 * - Required expertise domains (which characters should review)
 * - Validation criteria (what success looks like)
 * - Discussion focus areas (security, performance, UX, etc.)
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class ComponentTypeClassifier extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // AI service configuration
            aiEndpoint: options.aiEndpoint || 'http://localhost:11434',
            aiModel: options.aiModel || 'codellama',
            aiTimeout: options.aiTimeout || 30000,
            
            // Classification thresholds
            confidenceThreshold: options.confidenceThreshold || 0.7,
            maxPatterns: options.maxPatterns || 5,
            
            // Analysis modes
            useAI: options.useAI !== false,
            usePatterns: options.usePatterns !== false,
            useBoth: options.useBoth !== false,
            
            ...options
        };
        
        // Component type definitions
        this.componentTypes = {
            'frontend-ui': {
                name: 'Frontend UI Component',
                description: 'User interface elements, pages, or interactive components',
                keywords: ['react', 'vue', 'angular', 'html', 'css', 'ui', 'component', 'frontend', 'interface', 'responsive', 'design'],
                patterns: [/\.(jsx?|tsx?|vue|html|css|scss)$/, /react|vue|angular/i, /component|ui|frontend/i],
                expertise: ['cal', 'arty', 'pixel'],
                riskLevel: 'low',
                complexity: 'medium',
                focusAreas: ['usability', 'accessibility', 'design', 'performance', 'mobile-responsive']
            },
            
            'backend-service': {
                name: 'Backend Service',
                description: 'Server-side services, APIs, databases, or infrastructure components',
                keywords: ['api', 'server', 'database', 'backend', 'service', 'endpoint', 'microservice', 'rest', 'graphql', 'node', 'python', 'java'],
                patterns: [/\.(js|py|java|go|rs|php)$/, /api|server|backend/i, /database|db|sql/i],
                expertise: ['ralph', 'vera', 'nash'],
                riskLevel: 'high',
                complexity: 'high',
                focusAreas: ['security', 'performance', 'scalability', 'reliability', 'data-integrity']
            },
            
            'ai-ml-model': {
                name: 'AI/ML Model or System',
                description: 'Machine learning models, AI services, or intelligent systems',
                keywords: ['ai', 'ml', 'machine learning', 'neural', 'model', 'tensorflow', 'pytorch', 'llm', 'nlp', 'computer vision', 'deep learning'],
                patterns: [/ai|ml|model/i, /tensorflow|pytorch|keras/i, /neural|deep.?learning/i],
                expertise: ['paulo', 'vera', 'sage'],
                riskLevel: 'high',
                complexity: 'very-high',
                focusAreas: ['ethics', 'bias', 'accuracy', 'explainability', 'safety', 'performance']
            },
            
            'auth-security': {
                name: 'Authentication & Security System',
                description: 'Authentication, authorization, security, or privacy systems',
                keywords: ['auth', 'login', 'security', 'encryption', 'password', 'oauth', 'jwt', 'session', 'privacy', 'compliance'],
                patterns: [/auth|security|login/i, /oauth|jwt|session/i, /encrypt|hash|secure/i],
                expertise: ['vera', 'ralph', 'sage'],
                riskLevel: 'very-high',
                complexity: 'high',
                focusAreas: ['security', 'compliance', 'privacy', 'vulnerability', 'penetration-testing']
            },
            
            'blockchain-crypto': {
                name: 'Blockchain/Crypto System',
                description: 'Blockchain, cryptocurrency, smart contracts, or Web3 systems',
                keywords: ['blockchain', 'crypto', 'smart contract', 'ethereum', 'bitcoin', 'web3', 'defi', 'nft', 'token', 'wallet'],
                patterns: [/blockchain|crypto|web3/i, /ethereum|bitcoin|solidity/i, /smart.?contract|defi/i],
                expertise: ['nash', 'vera', 'paulo'],
                riskLevel: 'very-high',
                complexity: 'very-high',
                focusAreas: ['security', 'economics', 'regulatory', 'scalability', 'energy-efficiency']
            },
            
            'gaming-system': {
                name: 'Gaming System',
                description: 'Game mechanics, gaming engines, or entertainment systems',
                keywords: ['game', 'gaming', 'player', 'score', 'level', 'unity', 'unreal', 'multiplayer', 'mechanics', 'entertainment'],
                patterns: [/game|gaming|player/i, /unity|unreal|godot/i, /multiplayer|mechanics/i],
                expertise: ['pixel', 'nash', 'cal'],
                riskLevel: 'medium',
                complexity: 'high',
                focusAreas: ['engagement', 'balance', 'performance', 'monetization', 'user-retention']
            },
            
            'data-analytics': {
                name: 'Data & Analytics System',
                description: 'Data processing, analytics, reporting, or business intelligence',
                keywords: ['data', 'analytics', 'dashboard', 'report', 'metrics', 'bi', 'etl', 'pipeline', 'visualization', 'statistics'],
                patterns: [/data|analytics|dashboard/i, /report|metrics|statistics/i, /etl|pipeline|bi/i],
                expertise: ['paulo', 'nash', 'sage'],
                riskLevel: 'medium',
                complexity: 'medium',
                focusAreas: ['accuracy', 'privacy', 'performance', 'usability', 'compliance']
            },
            
            'infrastructure': {
                name: 'Infrastructure & DevOps',
                description: 'Infrastructure, deployment, monitoring, or DevOps systems',
                keywords: ['docker', 'kubernetes', 'aws', 'cloud', 'deployment', 'ci/cd', 'monitoring', 'infrastructure', 'devops'],
                patterns: [/docker|kubernetes|k8s/i, /aws|azure|gcp|cloud/i, /ci\/cd|devops|infrastructure/i],
                expertise: ['ralph', 'vera', 'nash'],
                riskLevel: 'high',
                complexity: 'high',
                focusAreas: ['reliability', 'scalability', 'cost', 'security', 'monitoring']
            },
            
            'business-logic': {
                name: 'Business Logic System',
                description: 'Business rules, workflows, or domain-specific logic',
                keywords: ['business', 'workflow', 'process', 'rules', 'logic', 'domain', 'enterprise', 'automation', 'workflow'],
                patterns: [/business|workflow|process/i, /rules|logic|domain/i, /enterprise|automation/i],
                expertise: ['nash', 'sage', 'vera'],
                riskLevel: 'medium',
                complexity: 'medium',
                focusAreas: ['correctness', 'maintainability', 'compliance', 'efficiency', 'user-experience']
            },
            
            'integration-connector': {
                name: 'Integration & Connector',
                description: 'API integrations, connectors, or third-party service integrations',
                keywords: ['integration', 'connector', 'api', 'webhook', 'third-party', 'external', 'sync', 'bridge', 'adapter'],
                patterns: [/integration|connector|api/i, /webhook|third.?party|external/i, /sync|bridge|adapter/i],
                expertise: ['ralph', 'cal', 'vera'],
                riskLevel: 'medium',
                complexity: 'medium',
                focusAreas: ['reliability', 'error-handling', 'rate-limiting', 'security', 'monitoring']
            }
        };
        
        // Character expertise definitions
        this.characters = {
            cal: {
                name: 'Cal',
                emoji: '⚡',
                role: 'Web Developer',
                expertise: ['javascript', 'frontend', 'apis', 'web-development', 'react', 'node.js'],
                focus: 'Technical implementation and web standards'
            },
            arty: {
                name: 'Arty', 
                emoji: '🎨',
                role: 'Design Director',
                expertise: ['ui-design', 'ux-design', 'user-experience', 'visual-design', 'accessibility'],
                focus: 'User experience and design quality'
            },
            ralph: {
                name: 'Ralph',
                emoji: '🔧',
                role: 'Backend Engineer', 
                expertise: ['backend', 'databases', 'infrastructure', 'apis', 'server-architecture'],
                focus: 'System reliability and technical architecture'
            },
            vera: {
                name: 'Vera',
                emoji: '🛡️',
                role: 'Security Expert',
                expertise: ['security', 'compliance', 'privacy', 'authentication', 'encryption'],
                focus: 'Security and compliance validation'
            },
            paulo: {
                name: 'Paulo',
                emoji: '🧠',
                role: 'AI Specialist',
                expertise: ['ai', 'machine-learning', 'data-science', 'analytics', 'automation'],
                focus: 'AI ethics and technical feasibility'
            },
            nash: {
                name: 'Nash',
                emoji: '📈',
                role: 'Business Strategist',
                expertise: ['business-strategy', 'economics', 'monetization', 'scaling', 'market-analysis'],
                focus: 'Business viability and strategic impact'
            },
            sage: {
                name: 'Sage',
                emoji: '📚',
                role: 'Knowledge Keeper',
                expertise: ['documentation', 'standards', 'best-practices', 'compliance', 'knowledge-management'],
                focus: 'Standards compliance and documentation quality'
            },
            pixel: {
                name: 'Pixel',
                emoji: '🎮',
                role: 'Gaming Expert',
                expertise: ['game-design', 'user-engagement', 'gamification', 'entertainment', 'interactive-systems'],
                focus: 'User engagement and interactive design'
            }
        };
        
        // Classification history for learning
        this.classificationHistory = [];
        this.patternLearning = new Map();
        
        console.log('🔍 Component Type Classifier initialized');
        console.log(`📊 Supporting ${Object.keys(this.componentTypes).length} component types`);
        console.log(`👥 ${Object.keys(this.characters).length} expert characters available`);
    }
    
    /**
     * Main classification method - analyzes input and returns component type
     */
    async classify(input, context = {}) {
        try {
            const analysisId = crypto.randomUUID();
            const startTime = Date.now();
            
            console.log(`🔍 Classifying component: ${analysisId}`);
            console.log(`📝 Input length: ${input.length} characters`);
            
            // Normalize input
            const normalizedInput = this.normalizeInput(input);
            
            // Multiple classification approaches
            const results = await Promise.all([
                this.patternBasedClassification(normalizedInput),
                this.config.useAI ? this.aiBasedClassification(normalizedInput) : null,
                this.keywordAnalysis(normalizedInput),
                this.structuralAnalysis(normalizedInput)
            ].filter(Boolean));
            
            // Combine results and calculate confidence
            const combinedResult = this.combineClassificationResults(results);
            
            // Extract technical characteristics
            const characteristics = this.extractCharacteristics(normalizedInput, combinedResult.primaryType);
            
            // Determine required expertise
            const requiredExpertise = this.determineExpertise(combinedResult.primaryType, characteristics);
            
            // Generate validation criteria
            const validationCriteria = this.generateValidationCriteria(combinedResult.primaryType, characteristics);
            
            // Generate discussion focus areas
            const discussionFocus = this.generateDiscussionFocus(combinedResult.primaryType, characteristics);
            
            const classification = {
                id: analysisId,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime,
                
                // Classification results
                primaryType: combinedResult.primaryType,
                secondaryTypes: combinedResult.secondaryTypes,
                confidence: combinedResult.confidence,
                
                // Component analysis
                characteristics,
                requiredExpertise,
                validationCriteria,
                discussionFocus,
                
                // Context
                riskLevel: this.componentTypes[combinedResult.primaryType]?.riskLevel || 'medium',
                complexity: this.componentTypes[combinedResult.primaryType]?.complexity || 'medium',
                
                // Classification details
                analysisResults: results,
                input: {
                    original: input,
                    normalized: normalizedInput,
                    context
                }
            };
            
            // Store for learning
            this.recordClassification(classification);
            
            console.log(`✅ Classification complete: ${classification.primaryType} (${(classification.confidence * 100).toFixed(1)}% confidence)`);
            console.log(`👥 Required expertise: ${requiredExpertise.map(e => this.characters[e]?.name).join(', ')}`);
            
            this.emit('classification_complete', classification);
            
            return classification;
            
        } catch (error) {
            console.error('❌ Classification failed:', error);
            this.emit('classification_error', { input, error });
            throw error;
        }
    }
    
    /**
     * Pattern-based classification using regex and keyword matching
     */
    async patternBasedClassification(input) {
        const scores = {};
        
        // Score each component type based on patterns and keywords
        for (const [typeKey, type] of Object.entries(this.componentTypes)) {
            let score = 0;
            let matches = [];
            
            // Pattern matching
            for (const pattern of type.patterns) {
                const patternMatches = input.match(pattern);
                if (patternMatches) {
                    score += patternMatches.length * 2;
                    matches.push(...patternMatches);
                }
            }
            
            // Keyword matching
            for (const keyword of type.keywords) {
                const regex = new RegExp(keyword, 'gi');
                const keywordMatches = input.match(regex);
                if (keywordMatches) {
                    score += keywordMatches.length;
                    matches.push(...keywordMatches);
                }
            }
            
            if (score > 0) {
                scores[typeKey] = {
                    score,
                    matches,
                    confidence: Math.min(score / 10, 1) // Normalize to 0-1
                };
            }
        }
        
        return {
            method: 'pattern_based',
            scores,
            topMatch: this.getTopMatch(scores)
        };
    }
    
    /**
     * AI-based classification using language model
     */
    async aiBasedClassification(input) {
        try {
            const prompt = `
Analyze this component description and classify it into one of these categories:

Categories:
- frontend-ui: User interface components, web pages, interactive elements
- backend-service: Server-side services, APIs, databases, infrastructure
- ai-ml-model: Machine learning models, AI services, intelligent systems
- auth-security: Authentication, authorization, security systems
- blockchain-crypto: Blockchain, cryptocurrency, Web3 systems
- gaming-system: Game mechanics, gaming engines, entertainment
- data-analytics: Data processing, analytics, reporting systems
- infrastructure: Infrastructure, deployment, monitoring, DevOps
- business-logic: Business rules, workflows, domain logic
- integration-connector: API integrations, connectors, third-party services

Component description:
${input}

Respond with only the category name and a confidence score (0-1).
Example: "backend-service 0.85"
`;
            
            const response = await fetch(`${this.config.aiEndpoint}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.aiModel,
                    prompt: prompt,
                    stream: false,
                    temperature: 0.3
                }),
                timeout: this.config.aiTimeout
            });
            
            if (response.ok) {
                const result = await response.json();
                const aiResponse = result.response.trim();
                const [category, confidenceStr] = aiResponse.split(' ');
                const confidence = parseFloat(confidenceStr) || 0.5;
                
                return {
                    method: 'ai_based',
                    category,
                    confidence,
                    rawResponse: aiResponse
                };
            } else {
                throw new Error(`AI service responded with status: ${response.status}`);
            }
            
        } catch (error) {
            console.warn('⚠️ AI classification failed, falling back to patterns:', error.message);
            return {
                method: 'ai_based',
                error: error.message,
                category: null,
                confidence: 0
            };
        }
    }
    
    /**
     * Keyword frequency analysis
     */
    keywordAnalysis(input) {
        const wordFreq = {};
        const words = input.toLowerCase().match(/\w+/g) || [];
        
        // Count word frequencies
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        // Score types based on keyword frequencies
        const scores = {};
        for (const [typeKey, type] of Object.entries(this.componentTypes)) {
            let score = 0;
            
            type.keywords.forEach(keyword => {
                const keywordWords = keyword.toLowerCase().split(/\s+/);
                keywordWords.forEach(word => {
                    if (wordFreq[word]) {
                        score += wordFreq[word];
                    }
                });
            });
            
            if (score > 0) {
                scores[typeKey] = {
                    score,
                    confidence: Math.min(score / 20, 1)
                };
            }
        }
        
        return {
            method: 'keyword_analysis',
            scores,
            topMatch: this.getTopMatch(scores),
            wordFrequency: wordFreq
        };
    }
    
    /**
     * Structural analysis (file extensions, code patterns)
     */
    structuralAnalysis(input) {
        const structure = {
            hasCode: /```|function|class|const|let|var|def|public|private/.test(input),
            hasMarkup: /<\w+|html|div|span|component/.test(input),
            hasSQL: /select|insert|update|delete|create table/i.test(input),
            hasConfig: /json|yaml|config|\.env|docker/i.test(input),
            hasTests: /test|spec|describe|it\(|expect/.test(input),
            fileExtensions: (input.match(/\.\w{2,4}\b/g) || []).map(ext => ext.toLowerCase())
        };
        
        // Infer type from structural elements
        let inferredType = null;
        let confidence = 0.3;
        
        if (structure.hasMarkup && structure.hasCode) {
            inferredType = 'frontend-ui';
            confidence = 0.7;
        } else if (structure.hasSQL) {
            inferredType = 'backend-service';
            confidence = 0.8;
        } else if (structure.hasConfig) {
            inferredType = 'infrastructure';
            confidence = 0.6;
        } else if (structure.hasTests) {
            confidence += 0.2; // Boost confidence for components with tests
        }
        
        return {
            method: 'structural_analysis',
            structure,
            inferredType,
            confidence
        };
    }
    
    /**
     * Combine results from multiple classification methods
     */
    combineClassificationResults(results) {
        const typeScores = {};
        
        // Aggregate scores from all methods
        results.forEach(result => {
            if (result.topMatch) {
                const type = result.topMatch.type;
                const confidence = result.topMatch.confidence;
                
                if (!typeScores[type]) {
                    typeScores[type] = { totalScore: 0, methods: [] };
                }
                
                typeScores[type].totalScore += confidence;
                typeScores[type].methods.push(result.method);
            }
            
            if (result.category) {
                const type = result.category;
                const confidence = result.confidence;
                
                if (!typeScores[type]) {
                    typeScores[type] = { totalScore: 0, methods: [] };
                }
                
                typeScores[type].totalScore += confidence * 1.5; // Weight AI results higher
                typeScores[type].methods.push(result.method);
            }
        });
        
        // Sort by total score
        const sortedTypes = Object.entries(typeScores)
            .map(([type, data]) => ({
                type,
                score: data.totalScore,
                confidence: Math.min(data.totalScore / 3, 1), // Normalize
                methods: data.methods
            }))
            .sort((a, b) => b.score - a.score);
        
        const primaryType = sortedTypes[0]?.type || 'business-logic'; // Default fallback
        const secondaryTypes = sortedTypes.slice(1, 3).map(t => t.type);
        const confidence = sortedTypes[0]?.confidence || 0.3;
        
        return {
            primaryType,
            secondaryTypes,
            confidence,
            allResults: sortedTypes
        };
    }
    
    /**
     * Extract technical characteristics
     */
    extractCharacteristics(input, primaryType) {
        const type = this.componentTypes[primaryType];
        
        return {
            complexity: type?.complexity || 'medium',
            riskLevel: type?.riskLevel || 'medium',
            focusAreas: type?.focusAreas || ['functionality', 'maintainability'],
            hasTests: /test|spec|describe/.test(input),
            hasDocumentation: /readme|docs|documentation/i.test(input),
            hasSecurity: /auth|security|encrypt|hash|secure/i.test(input),
            hasPerformance: /performance|optimize|cache|speed/i.test(input),
            hasScaling: /scale|cluster|distributed|load/i.test(input),
            estimatedSize: this.estimateComponentSize(input),
            dependencies: this.extractDependencies(input)
        };
    }
    
    /**
     * Determine required expertise based on component type
     */
    determineExpertise(primaryType, characteristics) {
        const type = this.componentTypes[primaryType];
        let expertise = [...(type?.expertise || ['sage'])];
        
        // Add additional experts based on characteristics
        if (characteristics.hasSecurity) expertise.push('vera');
        if (characteristics.hasPerformance) expertise.push('ralph');
        if (primaryType.includes('ui') || primaryType.includes('frontend')) expertise.push('arty');
        if (characteristics.complexity === 'very-high') expertise.push('sage');
        if (primaryType.includes('business') || primaryType.includes('economics')) expertise.push('nash');
        
        // Remove duplicates and limit to 4 experts max
        expertise = [...new Set(expertise)].slice(0, 4);
        
        return expertise;
    }
    
    /**
     * Generate validation criteria for this component type
     */
    generateValidationCriteria(primaryType, characteristics) {
        const type = this.componentTypes[primaryType];
        const baseCriteria = type?.focusAreas || ['functionality'];
        
        const criteria = {
            required: [...baseCriteria],
            recommended: [],
            riskAreas: []
        };
        
        // Add criteria based on characteristics
        if (characteristics.hasSecurity) {
            criteria.required.push('security-audit', 'vulnerability-scan');
        }
        
        if (characteristics.hasPerformance) {
            criteria.required.push('performance-testing', 'load-testing');
        }
        
        if (characteristics.complexity === 'very-high') {
            criteria.required.push('comprehensive-testing', 'peer-review');
        }
        
        if (characteristics.riskLevel === 'very-high') {
            criteria.riskAreas.push('security', 'data-privacy', 'regulatory-compliance');
        }
        
        return criteria;
    }
    
    /**
     * Generate discussion focus areas
     */
    generateDiscussionFocus(primaryType, characteristics) {
        const type = this.componentTypes[primaryType];
        const focus = {
            primary: type?.focusAreas || ['functionality'],
            questions: [],
            concerns: []
        };
        
        // Generate type-specific questions
        switch (primaryType) {
            case 'frontend-ui':
                focus.questions = [
                    'Is the user interface intuitive and accessible?',
                    'Does it work across different devices and browsers?',
                    'Is the loading performance acceptable?'
                ];
                break;
                
            case 'backend-service':
                focus.questions = [
                    'Can this service handle expected load?',
                    'Are error cases properly handled?',
                    'Is the API design consistent and well-documented?'
                ];
                break;
                
            case 'ai-ml-model':
                focus.questions = [
                    'Are there potential bias or ethical issues?',
                    'Is the model accuracy sufficient for the use case?',
                    'How will we monitor and update the model over time?'
                ];
                break;
                
            case 'auth-security':
                focus.questions = [
                    'Does this meet our security standards?',
                    'Are there any attack vectors we haven\'t considered?',
                    'Is compliance with regulations ensured?'
                ];
                break;
                
            default:
                focus.questions = [
                    'Does this solve the intended problem effectively?',
                    'Are there any technical risks we should address?',
                    'Is this maintainable long-term?'
                ];
        }
        
        return focus;
    }
    
    // Utility methods
    normalizeInput(input) {
        return input
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    getTopMatch(scores) {
        const entries = Object.entries(scores);
        if (entries.length === 0) return null;
        
        const top = entries.reduce((best, [type, data]) => 
            data.score > best.score ? { type, ...data } : best
        , { type: null, score: 0 });
        
        return top.type ? top : null;
    }
    
    estimateComponentSize(input) {
        const lines = input.split('\n').length;
        if (lines < 50) return 'small';
        if (lines < 200) return 'medium';
        if (lines < 500) return 'large';
        return 'very-large';
    }
    
    extractDependencies(input) {
        const deps = [];
        
        // Common dependency patterns
        const patterns = [
            /import.*from ['"`]([^'"`]+)['"`]/g,
            /require\(['"`]([^'"`]+)['"`]\)/g,
            /<([A-Z][a-zA-Z]+)/g // React components
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(input)) !== null) {
                deps.push(match[1]);
            }
        });
        
        return [...new Set(deps)].slice(0, 10); // Dedupe and limit
    }
    
    recordClassification(classification) {
        this.classificationHistory.push({
            timestamp: classification.timestamp,
            primaryType: classification.primaryType,
            confidence: classification.confidence,
            processingTime: classification.processingTime
        });
        
        // Keep only last 1000 classifications
        if (this.classificationHistory.length > 1000) {
            this.classificationHistory.shift();
        }
    }
    
    /**
     * Get classification statistics
     */
    getStatistics() {
        const total = this.classificationHistory.length;
        if (total === 0) return { totalClassifications: 0 };
        
        const typeDistribution = {};
        let totalConfidence = 0;
        let totalTime = 0;
        
        this.classificationHistory.forEach(classification => {
            typeDistribution[classification.primaryType] = 
                (typeDistribution[classification.primaryType] || 0) + 1;
            totalConfidence += classification.confidence;
            totalTime += classification.processingTime;
        });
        
        return {
            totalClassifications: total,
            averageConfidence: totalConfidence / total,
            averageProcessingTime: totalTime / total,
            typeDistribution,
            supportedTypes: Object.keys(this.componentTypes).length,
            availableCharacters: Object.keys(this.characters).length
        };
    }
}

module.exports = ComponentTypeClassifier;

// CLI execution
if (require.main === module) {
    const classifier = new ComponentTypeClassifier();
    
    console.log('🔍 Component Type Classifier ready');
    console.log('Statistics:', classifier.getStatistics());
    
    // Example classifications
    const examples = [
        'A React component for user authentication with OAuth integration',
        'Python machine learning model for fraud detection using TensorFlow',
        'REST API for managing user profiles and preferences',
        'Smart contract for decentralized voting on Ethereum',
        'Real-time multiplayer game backend with WebSocket support',
        'Docker infrastructure setup with Kubernetes orchestration'
    ];
    
    if (process.argv.includes('--demo')) {
        console.log('\n🎭 Running demo classifications...\n');
        
        (async () => {
            for (const example of examples) {
                console.log(`\n--- Analyzing: "${example}" ---`);
                try {
                    const result = await classifier.classify(example);
                    console.log(`Type: ${result.primaryType}`);
                    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                    console.log(`Experts: ${result.requiredExpertise.map(e => classifier.characters[e]?.name).join(', ')}`);
                    console.log(`Focus: ${result.discussionFocus.primary.join(', ')}`);
                } catch (error) {
                    console.error('Classification failed:', error.message);
                }
            }
            
            console.log('\n📊 Final Statistics:');
            console.log(JSON.stringify(classifier.getStatistics(), null, 2));
        })();
    }
}
#!/usr/bin/env node

/**
 * 🧠 SMART ANALYZER SERVICE
 * Automatically extracts business concepts, features, and requirements from natural language
 * No manual highlighting needed - AI understands intent and pulls the right components
 */

const natural = require('natural');
const fs = require('fs').promises;
const path = require('path');

class SmartAnalyzerService {
    constructor() {
        // Business concept patterns
        this.conceptPatterns = {
            // E-commerce concepts
            ecommerce: {
                keywords: ['shop', 'store', 'buy', 'sell', 'product', 'cart', 'checkout', 'payment', 'order', 'inventory', 'shipping', 'customer'],
                components: ['ProductGrid', 'ShoppingCart', 'CheckoutForm', 'PaymentProcessor', 'OrderManagement'],
                boilerplate: 'ecommerce-platform',
                domain: 'retail'
            },
            
            // SaaS/Dashboard concepts
            saas: {
                keywords: ['dashboard', 'analytics', 'metrics', 'charts', 'reports', 'users', 'subscription', 'billing', 'admin', 'settings'],
                components: ['Dashboard', 'ChartWidget', 'UserManagement', 'BillingSystem', 'AdminPanel'],
                boilerplate: 'saas-dashboard',
                domain: 'software'
            },
            
            // Social/Community concepts
            social: {
                keywords: ['social', 'community', 'profile', 'friends', 'post', 'share', 'comment', 'like', 'follow', 'message', 'chat'],
                components: ['UserProfile', 'FeedComponent', 'CommentSystem', 'MessagingWidget', 'NotificationCenter'],
                boilerplate: 'social-platform',
                domain: 'community'
            },
            
            // Content/Blog concepts
            content: {
                keywords: ['blog', 'article', 'post', 'content', 'publish', 'editor', 'cms', 'media', 'gallery', 'portfolio'],
                components: ['ArticleEditor', 'ContentList', 'MediaGallery', 'CommentSection', 'SearchWidget'],
                boilerplate: 'content-management',
                domain: 'publishing'
            },
            
            // Education/Learning concepts
            education: {
                keywords: ['course', 'lesson', 'learn', 'teach', 'student', 'quiz', 'assignment', 'grade', 'curriculum', 'education'],
                components: ['CourseBuilder', 'LessonViewer', 'QuizEngine', 'GradingSystem', 'StudentDashboard'],
                boilerplate: 'education-platform',
                domain: 'education'
            },
            
            // Gaming/Entertainment concepts
            gaming: {
                keywords: ['game', 'play', 'score', 'level', 'achievement', 'leaderboard', 'multiplayer', 'character', 'inventory'],
                components: ['GameEngine', 'ScoreBoard', 'CharacterSystem', 'InventoryManager', 'MultiplayerLobby'],
                boilerplate: 'gaming-platform',
                domain: 'entertainment'
            },
            
            // Finance/Banking concepts
            finance: {
                keywords: ['bank', 'finance', 'transaction', 'account', 'balance', 'transfer', 'payment', 'investment', 'wallet', 'crypto'],
                components: ['AccountDashboard', 'TransactionList', 'PaymentForm', 'WalletManager', 'InvestmentTracker'],
                boilerplate: 'finance-platform',
                domain: 'fintech'
            },
            
            // Healthcare concepts
            healthcare: {
                keywords: ['health', 'medical', 'patient', 'doctor', 'appointment', 'prescription', 'diagnosis', 'treatment', 'clinic'],
                components: ['PatientPortal', 'AppointmentScheduler', 'MedicalRecords', 'PrescriptionManager', 'DoctorDashboard'],
                boilerplate: 'healthcare-platform',
                domain: 'health'
            }
        };
        
        // Feature extraction patterns
        this.featurePatterns = {
            authentication: ['login', 'signup', 'register', 'auth', 'user', 'account', 'password', 'security'],
            payment: ['payment', 'pay', 'stripe', 'paypal', 'credit card', 'billing', 'subscription', 'checkout'],
            search: ['search', 'find', 'filter', 'query', 'lookup', 'discover'],
            notifications: ['notify', 'alert', 'email', 'sms', 'push', 'notification', 'reminder'],
            api: ['api', 'rest', 'graphql', 'endpoint', 'webhook', 'integration'],
            realtime: ['realtime', 'live', 'chat', 'websocket', 'stream', 'instant'],
            mobile: ['mobile', 'app', 'ios', 'android', 'responsive', 'pwa'],
            analytics: ['analytics', 'tracking', 'metrics', 'statistics', 'reports', 'insights'],
            social: ['share', 'social', 'facebook', 'twitter', 'instagram', 'oauth'],
            storage: ['upload', 'file', 'image', 'video', 'media', 'storage', 's3']
        };
        
        // Technical requirement patterns
        this.techPatterns = {
            performance: ['fast', 'speed', 'performance', 'optimize', 'cache', 'cdn'],
            security: ['secure', 'encrypted', 'private', 'protected', 'safe', 'compliance'],
            scalability: ['scale', 'millions', 'users', 'grow', 'expand', 'enterprise'],
            accessibility: ['accessible', 'ada', 'wcag', 'screen reader', 'disability'],
            seo: ['seo', 'search engine', 'google', 'ranking', 'metadata'],
            multilingual: ['language', 'translate', 'international', 'localization', 'i18n']
        };
        
        // Initialize NLP tools
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.sentiment = new natural.SentimentAnalyzer('English', this.stemmer, 'afinn');
        
        console.log('🧠 Smart Analyzer Service initialized');
    }
    
    /**
     * 🎯 Main analysis function - extracts everything automatically
     */
    async analyzeBusinessIdea(text, context = {}) {
        console.log('🔍 Analyzing business idea...');
        
        // Tokenize and normalize text
        const tokens = this.tokenizer.tokenize(text.toLowerCase());
        const stems = tokens.map(token => this.stemmer.stem(token));
        
        // Extract business concepts
        const concepts = this.extractBusinessConcepts(text, tokens, stems);
        
        // Extract features
        const features = this.extractFeatures(text, tokens);
        
        // Extract technical requirements
        const techRequirements = this.extractTechRequirements(text, tokens);
        
        // Analyze sentiment and intent
        const sentiment = this.analyzeSentiment(tokens);
        const intent = this.detectIntent(text, concepts);
        
        // Generate component recommendations
        const components = this.recommendComponents(concepts, features);
        
        // Select best boilerplate
        const boilerplate = this.selectBoilerplate(concepts, features, techRequirements);
        
        // Extract entities (company name, target audience, etc.)
        const entities = this.extractEntities(text);
        
        // Build complete analysis
        const analysis = {
            timestamp: new Date().toISOString(),
            originalText: text,
            
            // Core analysis
            concepts: concepts,
            primaryConcept: concepts[0] || null,
            domain: this.determineDomain(concepts),
            
            // Features and requirements
            features: features,
            techRequirements: techRequirements,
            
            // Component recommendations
            recommendedComponents: components,
            componentCount: components.length,
            
            // Boilerplate selection
            boilerplate: boilerplate,
            
            // NLP insights
            sentiment: sentiment,
            intent: intent,
            entities: entities,
            
            // Confidence scores
            confidence: this.calculateConfidence(concepts, features),
            
            // Generated summary
            summary: this.generateSummary(concepts, features, entities),
            
            // Actionable next steps
            nextSteps: this.generateNextSteps(concepts, features, boilerplate)
        };
        
        console.log(`✅ Analysis complete: ${concepts.length} concepts, ${features.length} features, ${components.length} components`);
        
        return analysis;
    }
    
    /**
     * 🎯 Extract business concepts from text
     */
    extractBusinessConcepts(text, tokens, stems) {
        const detectedConcepts = [];
        
        Object.entries(this.conceptPatterns).forEach(([concept, pattern]) => {
            let score = 0;
            let matchedKeywords = [];
            
            // Check for keyword matches
            pattern.keywords.forEach(keyword => {
                const keywordStem = this.stemmer.stem(keyword);
                if (stems.includes(keywordStem) || text.toLowerCase().includes(keyword)) {
                    score += 1;
                    matchedKeywords.push(keyword);
                }
            });
            
            if (score > 0) {
                detectedConcepts.push({
                    concept: concept,
                    score: score,
                    confidence: score / pattern.keywords.length,
                    matchedKeywords: matchedKeywords,
                    components: pattern.components,
                    boilerplate: pattern.boilerplate,
                    domain: pattern.domain
                });
            }
        });
        
        // Sort by score
        detectedConcepts.sort((a, b) => b.score - a.score);
        
        return detectedConcepts;
    }
    
    /**
     * 🔧 Extract features from text
     */
    extractFeatures(text, tokens) {
        const detectedFeatures = [];
        
        Object.entries(this.featurePatterns).forEach(([feature, keywords]) => {
            let found = false;
            let matchedKeyword = null;
            
            for (const keyword of keywords) {
                if (text.toLowerCase().includes(keyword)) {
                    found = true;
                    matchedKeyword = keyword;
                    break;
                }
            }
            
            if (found) {
                detectedFeatures.push({
                    feature: feature,
                    keyword: matchedKeyword,
                    importance: this.calculateFeatureImportance(feature, text)
                });
            }
        });
        
        return detectedFeatures;
    }
    
    /**
     * 🔧 Extract technical requirements
     */
    extractTechRequirements(text, tokens) {
        const requirements = [];
        
        Object.entries(this.techPatterns).forEach(([requirement, keywords]) => {
            let found = false;
            let matchedKeyword = null;
            
            for (const keyword of keywords) {
                if (text.toLowerCase().includes(keyword)) {
                    found = true;
                    matchedKeyword = keyword;
                    break;
                }
            }
            
            if (found) {
                requirements.push({
                    requirement: requirement,
                    keyword: matchedKeyword,
                    priority: this.calculateRequirementPriority(requirement, text)
                });
            }
        });
        
        return requirements;
    }
    
    /**
     * 🎨 Recommend components based on analysis
     */
    recommendComponents(concepts, features) {
        const components = new Set();
        
        // Add components from detected concepts
        concepts.forEach(concept => {
            concept.components.forEach(component => components.add(component));
        });
        
        // Add feature-specific components
        features.forEach(feature => {
            const featureComponents = this.getFeatureComponents(feature.feature);
            featureComponents.forEach(component => components.add(component));
        });
        
        // Convert to array with metadata
        return Array.from(components).map(component => ({
            name: component,
            type: this.getComponentType(component),
            priority: this.getComponentPriority(component, concepts, features)
        })).sort((a, b) => b.priority - a.priority);
    }
    
    /**
     * 📦 Select best boilerplate based on analysis
     */
    selectBoilerplate(concepts, features, techRequirements) {
        if (concepts.length === 0) {
            return {
                template: 'basic-web-app',
                confidence: 0.5,
                reason: 'No specific concept detected, using generic template'
            };
        }
        
        const primaryConcept = concepts[0];
        
        // Check if we need to modify based on features
        let template = primaryConcept.boilerplate;
        let modifiers = [];
        
        // Add modifiers based on features
        if (features.some(f => f.feature === 'mobile')) {
            modifiers.push('mobile-first');
        }
        if (features.some(f => f.feature === 'realtime')) {
            modifiers.push('websocket-enabled');
        }
        if (features.some(f => f.feature === 'api')) {
            modifiers.push('api-driven');
        }
        
        return {
            template: template,
            baseTemplate: primaryConcept.boilerplate,
            confidence: primaryConcept.confidence,
            modifiers: modifiers,
            reason: `Detected ${primaryConcept.concept} business type with ${modifiers.length} modifications`
        };
    }
    
    /**
     * 🎯 Detect user intent
     */
    detectIntent(text, concepts) {
        const intents = {
            create: ['create', 'build', 'make', 'develop', 'start', 'launch'],
            improve: ['improve', 'enhance', 'upgrade', 'optimize', 'better'],
            replace: ['replace', 'migrate', 'switch', 'convert', 'change'],
            scale: ['scale', 'grow', 'expand', 'enterprise', 'millions']
        };
        
        let detectedIntent = 'create'; // default
        let confidence = 0.5;
        
        Object.entries(intents).forEach(([intent, keywords]) => {
            keywords.forEach(keyword => {
                if (text.toLowerCase().includes(keyword)) {
                    detectedIntent = intent;
                    confidence = 0.8;
                }
            });
        });
        
        return {
            intent: detectedIntent,
            confidence: confidence
        };
    }
    
    /**
     * 🏢 Extract entities (names, brands, etc.)
     */
    extractEntities(text) {
        const entities = {
            businessName: null,
            targetAudience: null,
            industry: null
        };
        
        // Simple pattern matching for business name
        const namePattern = /(?:called|named|business|company|app|platform)\s+["']?([A-Z][A-Za-z0-9\s]+)["']?/i;
        const nameMatch = text.match(namePattern);
        if (nameMatch) {
            entities.businessName = nameMatch[1].trim();
        }
        
        // Target audience detection
        const audiencePatterns = ['for', 'targeting', 'aimed at', 'helps'];
        audiencePatterns.forEach(pattern => {
            const regex = new RegExp(`${pattern}\\s+([a-z\\s]+)`, 'i');
            const match = text.match(regex);
            if (match && !entities.targetAudience) {
                entities.targetAudience = match[1].trim();
            }
        });
        
        return entities;
    }
    
    /**
     * 💭 Analyze sentiment
     */
    analyzeSentiment(tokens) {
        const score = this.sentiment.getSentiment(tokens);
        
        return {
            score: score,
            sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
            enthusiasm: Math.abs(score)
        };
    }
    
    /**
     * 📊 Calculate confidence score
     */
    calculateConfidence(concepts, features) {
        if (concepts.length === 0) return 0.3;
        
        const conceptConfidence = concepts[0].confidence;
        const featureBoost = Math.min(features.length * 0.05, 0.3);
        
        return Math.min(conceptConfidence + featureBoost, 0.95);
    }
    
    /**
     * 📝 Generate summary
     */
    generateSummary(concepts, features, entities) {
        const primaryConcept = concepts[0];
        const businessName = entities.businessName || 'the business';
        
        if (!primaryConcept) {
            return `${businessName} appears to be a general web application with ${features.length} identified features.`;
        }
        
        const featureList = features.slice(0, 3).map(f => f.feature).join(', ');
        
        return `${businessName} is a ${primaryConcept.domain} platform focused on ${primaryConcept.concept} with features including ${featureList || 'standard functionality'}.`;
    }
    
    /**
     * 📋 Generate next steps
     */
    generateNextSteps(concepts, features, boilerplate) {
        const steps = [];
        
        // Template selection
        steps.push(`Use ${boilerplate.template} template as the foundation`);
        
        // Component integration
        if (concepts.length > 0) {
            steps.push(`Integrate ${concepts[0].components.length} recommended components`);
        }
        
        // Feature implementation
        if (features.length > 0) {
            steps.push(`Implement ${features.length} identified features`);
        }
        
        // Additional recommendations
        if (!features.some(f => f.feature === 'authentication')) {
            steps.push('Consider adding user authentication');
        }
        
        if (!features.some(f => f.feature === 'analytics')) {
            steps.push('Add analytics for tracking user behavior');
        }
        
        return steps;
    }
    
    // Helper methods
    calculateFeatureImportance(feature, text) {
        // More mentions = more important
        const mentions = (text.match(new RegExp(feature, 'gi')) || []).length;
        return Math.min(mentions / 3, 1); // Normalize to 0-1
    }
    
    calculateRequirementPriority(requirement, text) {
        const priorities = {
            security: 0.9,
            performance: 0.8,
            scalability: 0.7,
            accessibility: 0.6,
            seo: 0.5,
            multilingual: 0.4
        };
        return priorities[requirement] || 0.5;
    }
    
    getFeatureComponents(feature) {
        const featureComponentMap = {
            authentication: ['LoginForm', 'SignupForm', 'AuthProvider', 'PasswordReset'],
            payment: ['PaymentForm', 'CheckoutFlow', 'BillingDashboard', 'SubscriptionManager'],
            search: ['SearchBar', 'SearchResults', 'FilterPanel', 'AutoComplete'],
            notifications: ['NotificationCenter', 'EmailService', 'PushNotifications', 'AlertBanner'],
            api: ['APIClient', 'EndpointManager', 'WebhookHandler', 'APIDocumentation'],
            realtime: ['WebSocketManager', 'LiveChat', 'RealtimeUpdates', 'StreamingData'],
            mobile: ['MobileLayout', 'TouchGestures', 'OfflineSupport', 'PWAManifest'],
            analytics: ['AnalyticsDashboard', 'MetricsTracker', 'ReportGenerator', 'DataVisualizer'],
            social: ['SocialLogin', 'ShareButtons', 'SocialFeed', 'OAuthProvider'],
            storage: ['FileUploader', 'MediaGallery', 'CloudStorage', 'ImageOptimizer']
        };
        
        return featureComponentMap[feature] || [];
    }
    
    getComponentType(component) {
        if (component.includes('Form') || component.includes('Input')) return 'form';
        if (component.includes('Dashboard') || component.includes('Panel')) return 'dashboard';
        if (component.includes('List') || component.includes('Grid')) return 'display';
        if (component.includes('Auth') || component.includes('Login')) return 'auth';
        if (component.includes('Payment') || component.includes('Billing')) return 'payment';
        return 'general';
    }
    
    getComponentPriority(component, concepts, features) {
        let priority = 0.5;
        
        // Boost if component is in primary concept
        if (concepts.length > 0 && concepts[0].components.includes(component)) {
            priority += 0.3;
        }
        
        // Boost if component matches a detected feature
        features.forEach(feature => {
            const featureComponents = this.getFeatureComponents(feature.feature);
            if (featureComponents.includes(component)) {
                priority += 0.2;
            }
        });
        
        return Math.min(priority, 1);
    }
    
    determineDomain(concepts) {
        if (concepts.length === 0) return 'general';
        return concepts[0].domain;
    }
}

// Export for use
module.exports = SmartAnalyzerService;

// CLI testing
if (require.main === module) {
    async function test() {
        const analyzer = new SmartAnalyzerService();
        
        // Test examples
        const examples = [
            "I want to create an online marketplace where artists can sell their handmade crafts. It needs a shopping cart, payment processing with Stripe, and user profiles for both buyers and sellers.",
            
            "We need a SaaS dashboard for tracking fitness goals. Users should be able to log workouts, see progress charts, and get personalized recommendations. Make it mobile-friendly.",
            
            "Build me a social platform for book lovers where they can review books, create reading lists, and follow other readers. Include a recommendation engine.",
            
            "I'm starting a blog about cooking with a focus on healthy recipes. Need an editor, categories, search, and a way for users to save their favorite recipes."
        ];
        
        for (const example of examples) {
            console.log('\n' + '='.repeat(80));
            console.log('INPUT:', example);
            console.log('='.repeat(80));
            
            const analysis = await analyzer.analyzeBusinessIdea(example);
            
            console.log('\n📊 ANALYSIS RESULTS:');
            console.log('Primary Concept:', analysis.primaryConcept?.concept || 'None detected');
            console.log('Domain:', analysis.domain);
            console.log('Confidence:', (analysis.confidence * 100).toFixed(1) + '%');
            
            console.log('\n🎯 Detected Concepts:');
            analysis.concepts.forEach(c => {
                console.log(`  - ${c.concept} (${(c.confidence * 100).toFixed(1)}%) - ${c.matchedKeywords.join(', ')}`);
            });
            
            console.log('\n🔧 Features:');
            analysis.features.forEach(f => {
                console.log(`  - ${f.feature} (matched: "${f.keyword}")`);
            });
            
            console.log('\n🧩 Recommended Components:');
            analysis.recommendedComponents.slice(0, 10).forEach(c => {
                console.log(`  - ${c.name} (${c.type}) - priority: ${(c.priority * 100).toFixed(0)}%`);
            });
            
            console.log('\n📦 Boilerplate:', analysis.boilerplate.template);
            if (analysis.boilerplate.modifiers.length > 0) {
                console.log('  Modifiers:', analysis.boilerplate.modifiers.join(', '));
            }
            
            console.log('\n📝 Summary:', analysis.summary);
            
            console.log('\n📋 Next Steps:');
            analysis.nextSteps.forEach((step, i) => {
                console.log(`  ${i + 1}. ${step}`);
            });
        }
    }
    
    test().catch(console.error);
}
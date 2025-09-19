#!/usr/bin/env node

/**
 * 🎯 TEMPLATE MATCHER AI
 * Intelligent SaaS template selection based on user intent
 * Uses local + cheap AI models to match user needs to the perfect template
 */

require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class TemplateMatcherAI {
    constructor(config = {}) {
        this.config = {
            templateLibraryPath: config.templateLibraryPath || process.env.TEMPLATE_LIBRARY_PATH || './templates',
            localModel: config.localModel || process.env.BOB_LOCAL_MODEL || 'ollama/codellama',
            cheapModel: config.cheapModel || process.env.BOB_CHEAP_MODEL || 'gemini-1.5-flash',
            confidenceThreshold: config.confidenceThreshold || 0.4,
            ...config
        };
        
        // Template knowledge base
        this.templates = {
            // Finance & Crypto Templates
            'crypto-portfolio-tracker': {
                category: 'finance',
                keywords: ['crypto', 'portfolio', 'bitcoin', 'ethereum', 'investment', 'wallet', 'trading', 'blockchain'],
                description: 'Cryptocurrency portfolio tracking and management platform',
                components: ['auth', 'portfolio-dashboard', 'price-api', 'charts', 'alerts', 'transactions'],
                complexity: 'medium',
                buildTime: '2-4 hours',
                features: ['Real-time prices', 'Portfolio analytics', 'Transaction history', 'Profit/Loss tracking']
            },
            
            'trading-bot-dashboard': {
                category: 'finance',
                keywords: ['trading', 'bot', 'automated', 'strategy', 'signals', 'analytics'],
                description: 'Automated trading bot control and monitoring dashboard',
                components: ['auth', 'bot-controls', 'strategy-builder', 'performance-metrics', 'risk-management'],
                complexity: 'high',
                buildTime: '4-6 hours',
                features: ['Strategy backtesting', 'Live trading', 'Risk controls', 'Performance analytics']
            },
            
            'expense-tracker': {
                category: 'finance',
                keywords: ['expense', 'budget', 'spending', 'money', 'financial', 'tracker', 'accounting'],
                description: 'Personal expense tracking and budgeting platform',
                components: ['auth', 'expense-input', 'categories', 'budgets', 'reports', 'notifications'],
                complexity: 'low',
                buildTime: '1-2 hours',
                features: ['Expense categorization', 'Budget tracking', 'Spending insights', 'Monthly reports']
            },
            
            // Travel & Booking Templates
            'flight-booking-system': {
                category: 'travel',
                keywords: ['flight', 'booking', 'travel', 'airline', 'tickets', 'reservation', 'airport'],
                description: 'Flight search and booking management system',
                components: ['auth', 'flight-search', 'booking-engine', 'payments', 'itinerary', 'notifications'],
                complexity: 'high',
                buildTime: '4-6 hours',
                features: ['Flight search', 'Price comparison', 'Booking management', 'Trip planning']
            },
            
            'hotel-reservation-platform': {
                category: 'travel',
                keywords: ['hotel', 'accommodation', 'booking', 'reservation', 'rooms', 'hospitality'],
                description: 'Hotel booking and reservation management platform',
                components: ['auth', 'hotel-search', 'room-availability', 'booking-system', 'payments', 'reviews'],
                complexity: 'high',
                buildTime: '4-6 hours',
                features: ['Hotel search', 'Room booking', 'Guest management', 'Review system']
            },
            
            'travel-planner': {
                category: 'travel',
                keywords: ['travel', 'trip', 'planner', 'itinerary', 'vacation', 'journey'],
                description: 'Comprehensive travel planning and itinerary management',
                components: ['auth', 'trip-builder', 'destination-guide', 'calendar', 'budget-tracker', 'sharing'],
                complexity: 'medium',
                buildTime: '2-4 hours',
                features: ['Trip planning', 'Itinerary builder', 'Budget tracking', 'Destination guides']
            },
            
            // E-commerce Templates
            'online-store': {
                category: 'ecommerce',
                keywords: ['store', 'shop', 'ecommerce', 'products', 'sell', 'inventory', 'retail'],
                description: 'Full-featured e-commerce store platform',
                components: ['auth', 'product-catalog', 'shopping-cart', 'payments', 'inventory', 'orders', 'admin'],
                complexity: 'high',
                buildTime: '6-8 hours',
                features: ['Product management', 'Shopping cart', 'Payment processing', 'Order tracking']
            },
            
            'marketplace': {
                category: 'ecommerce',
                keywords: ['marketplace', 'vendors', 'multi-seller', 'commission', 'platform'],
                description: 'Multi-vendor marketplace platform',
                components: ['auth', 'vendor-dashboard', 'product-catalog', 'payments', 'commission', 'reviews'],
                complexity: 'very-high',
                buildTime: '8-12 hours',
                features: ['Vendor management', 'Commission tracking', 'Multi-payment', 'Rating system']
            },
            
            'subscription-service': {
                category: 'ecommerce',
                keywords: ['subscription', 'recurring', 'membership', 'saas', 'monthly', 'billing'],
                description: 'Subscription-based service platform',
                components: ['auth', 'subscription-plans', 'billing', 'user-dashboard', 'content-access', 'analytics'],
                complexity: 'medium',
                buildTime: '3-5 hours',
                features: ['Subscription management', 'Recurring billing', 'Access control', 'Usage analytics']
            },
            
            // Productivity Templates
            'task-manager': {
                category: 'productivity',
                keywords: ['task', 'todo', 'productivity', 'project', 'management', 'organize'],
                description: 'Task and project management platform',
                components: ['auth', 'task-lists', 'projects', 'calendar', 'collaboration', 'notifications'],
                complexity: 'medium',
                buildTime: '2-4 hours',
                features: ['Task organization', 'Project tracking', 'Team collaboration', 'Deadline reminders']
            },
            
            'crm-system': {
                category: 'productivity',
                keywords: ['crm', 'customer', 'relationship', 'sales', 'leads', 'contacts'],
                description: 'Customer relationship management system',
                components: ['auth', 'contact-management', 'sales-pipeline', 'communications', 'reports', 'integrations'],
                complexity: 'high',
                buildTime: '5-7 hours',
                features: ['Contact management', 'Sales pipeline', 'Communication tracking', 'Sales analytics']
            },
            
            'team-collaboration': {
                category: 'productivity',
                keywords: ['team', 'collaboration', 'communication', 'workspace', 'chat', 'files'],
                description: 'Team collaboration and communication platform',
                components: ['auth', 'team-chat', 'file-sharing', 'project-spaces', 'video-calls', 'integrations'],
                complexity: 'high',
                buildTime: '4-6 hours',
                features: ['Team messaging', 'File collaboration', 'Video conferencing', 'Project workspaces']
            },
            
            // Social & Community Templates
            'social-network': {
                category: 'social',
                keywords: ['social', 'network', 'community', 'posts', 'friends', 'sharing'],
                description: 'Social networking and community platform',
                components: ['auth', 'user-profiles', 'posts', 'feed', 'friends', 'messaging', 'notifications'],
                complexity: 'very-high',
                buildTime: '8-12 hours',
                features: ['User profiles', 'Social feed', 'Friend connections', 'Private messaging']
            },
            
            'forum-community': {
                category: 'social',
                keywords: ['forum', 'discussion', 'community', 'topics', 'threads', 'moderation'],
                description: 'Discussion forum and community platform',
                components: ['auth', 'topics', 'posts', 'moderation', 'categories', 'user-profiles', 'search'],
                complexity: 'medium',
                buildTime: '3-5 hours',
                features: ['Discussion threads', 'Topic categories', 'Moderation tools', 'User reputation']
            },
            
            'event-platform': {
                category: 'social',
                keywords: ['event', 'meetup', 'conference', 'tickets', 'registration', 'attendees'],
                description: 'Event management and ticketing platform',
                components: ['auth', 'event-creation', 'ticketing', 'registration', 'attendee-management', 'payments'],
                complexity: 'high',
                buildTime: '4-6 hours',
                features: ['Event creation', 'Ticket sales', 'Attendee management', 'Event analytics']
            },
            
            // Generic Templates
            'saas-starter': {
                category: 'generic',
                keywords: ['saas', 'software', 'service', 'platform', 'generic', 'starter'],
                description: 'Generic SaaS platform starter template',
                components: ['auth', 'dashboard', 'user-management', 'settings', 'api', 'billing'],
                complexity: 'medium',
                buildTime: '2-3 hours',
                features: ['User authentication', 'Admin dashboard', 'API access', 'Basic billing']
            },
            
            'landing-page': {
                category: 'marketing',
                keywords: ['landing', 'page', 'marketing', 'conversion', 'signup', 'lead'],
                description: 'High-converting landing page template',
                components: ['hero-section', 'features', 'testimonials', 'pricing', 'signup-form', 'analytics'],
                complexity: 'low',
                buildTime: '1-2 hours',
                features: ['Hero section', 'Feature showcase', 'Social proof', 'Lead capture']
            }
        };
        
        console.log('🎯 Template Matcher AI initialized with', Object.keys(this.templates).length, 'templates');
    }
    
    // Main template matching function
    async matchTemplate(userIntent, userContext = {}) {
        console.log(`🔍 Analyzing user intent: "${userIntent}"`);
        
        try {
            // 1. Keyword-based matching (fast)
            const keywordMatches = this.keywordMatch(userIntent);
            
            // 2. Category scoring
            const categoryScores = this.scoreCategoriesByIntent(userIntent);
            
            // 3. Semantic analysis (if available)
            const semanticMatches = await this.semanticMatch(userIntent);
            
            // 4. Combine scores and rank
            const rankedTemplates = this.combineAndRank(keywordMatches, categoryScores, semanticMatches);
            
            // 5. Select best match
            const bestMatch = rankedTemplates[0];
            
            if (bestMatch.confidence >= this.config.confidenceThreshold) {
                console.log(`✅ High confidence match: ${bestMatch.templateId} (${Math.round(bestMatch.confidence * 100)}%)`);
                
                return {
                    templateId: bestMatch.templateId,
                    template: this.templates[bestMatch.templateId],
                    confidence: bestMatch.confidence,
                    reasoning: bestMatch.reasoning,
                    alternatives: rankedTemplates.slice(1, 4), // Top 3 alternatives
                    matchMethod: bestMatch.matchMethod
                };
            } else {
                console.log(`⚠️ Low confidence match: ${bestMatch.templateId} (${Math.round(bestMatch.confidence * 100)}%)`);
                
                // Return generic template with alternatives
                return {
                    templateId: 'saas-starter',
                    template: this.templates['saas-starter'],
                    confidence: 0.5,
                    reasoning: 'Using generic SaaS template due to low confidence in specific matches',
                    alternatives: rankedTemplates.slice(0, 5),
                    matchMethod: 'fallback'
                };
            }
            
        } catch (error) {
            console.error('❌ Template matching failed:', error);
            
            // Fallback to keyword matching only
            const keywordMatches = this.keywordMatch(userIntent);
            const bestKeyword = keywordMatches[0];
            
            return {
                templateId: bestKeyword?.templateId || 'saas-starter',
                template: this.templates[bestKeyword?.templateId || 'saas-starter'],
                confidence: bestKeyword?.confidence || 0.3,
                reasoning: 'Fallback to keyword matching due to AI analysis failure',
                alternatives: [],
                matchMethod: 'keyword-fallback'
            };
        }
    }
    
    // Fast keyword-based matching
    keywordMatch(userIntent) {
        const intentLower = userIntent.toLowerCase();
        const matches = [];
        
        for (const [templateId, template] of Object.entries(this.templates)) {
            let score = 0;
            let matchedKeywords = [];
            
            for (const keyword of template.keywords) {
                if (intentLower.includes(keyword)) {
                    score += 1;
                    matchedKeywords.push(keyword);
                }
            }
            
            if (score > 0) {
                const confidence = Math.min(score / template.keywords.length, 1);
                matches.push({
                    templateId,
                    confidence,
                    score,
                    matchedKeywords,
                    reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`,
                    matchMethod: 'keyword'
                });
            }
        }
        
        return matches.sort((a, b) => b.confidence - a.confidence);
    }
    
    // Score categories based on intent
    scoreCategoriesByIntent(userIntent) {
        const categoryPatterns = {
            'finance': /crypto|bitcoin|trading|money|financial|investment|portfolio|budget|expense|accounting/i,
            'travel': /flight|hotel|travel|booking|trip|vacation|airline|accommodation/i,
            'ecommerce': /store|shop|sell|product|inventory|marketplace|ecommerce|retail/i,
            'productivity': /task|project|crm|management|productivity|organize|team/i,
            'social': /social|community|forum|event|network|discussion|friends/i,
            'marketing': /landing|marketing|conversion|lead|signup|campaign/i
        };
        
        const scores = {};
        for (const [category, pattern] of Object.entries(categoryPatterns)) {
            const matches = userIntent.match(pattern);
            scores[category] = matches ? matches.length : 0;
        }
        
        return scores;
    }
    
    // Semantic matching using AI (placeholder for now)
    async semanticMatch(userIntent) {
        // In a full implementation, this would use:
        // - Local embedding models for privacy
        // - Gemini API for semantic understanding
        // - Template similarity scoring
        
        // Placeholder: Return empty for now
        return [];
    }
    
    // Combine different matching methods and rank results
    combineAndRank(keywordMatches, categoryScores, semanticMatches) {
        const templateScores = new Map();
        
        // Add keyword match scores
        for (const match of keywordMatches) {
            templateScores.set(match.templateId, {
                ...match,
                keywordScore: match.confidence,
                categoryScore: 0,
                semanticScore: 0
            });
        }
        
        // Boost scores based on category matches
        const maxCategoryScore = Math.max(...Object.values(categoryScores));
        if (maxCategoryScore > 0) {
            for (const [templateId, template] of Object.entries(this.templates)) {
                const categoryScore = categoryScores[template.category] || 0;
                const normalizedCategoryScore = categoryScore / maxCategoryScore;
                
                if (templateScores.has(templateId)) {
                    const existing = templateScores.get(templateId);
                    existing.categoryScore = normalizedCategoryScore;
                    existing.confidence = (existing.keywordScore * 0.7) + (normalizedCategoryScore * 0.3);
                } else if (categoryScore > 0) {
                    templateScores.set(templateId, {
                        templateId,
                        confidence: normalizedCategoryScore * 0.3,
                        keywordScore: 0,
                        categoryScore: normalizedCategoryScore,
                        semanticScore: 0,
                        reasoning: `Category match: ${template.category}`,
                        matchMethod: 'category'
                    });
                }
            }
        }
        
        // Add semantic scores (when implemented)
        for (const match of semanticMatches) {
            if (templateScores.has(match.templateId)) {
                const existing = templateScores.get(match.templateId);
                existing.semanticScore = match.confidence;
                existing.confidence = (existing.keywordScore * 0.4) + (existing.categoryScore * 0.3) + (match.confidence * 0.3);
            }
        }
        
        // Convert to array and sort by confidence
        return Array.from(templateScores.values()).sort((a, b) => b.confidence - a.confidence);
    }
    
    // Get template details with build estimation
    getTemplateDetails(templateId) {
        const template = this.templates[templateId];
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        return {
            id: templateId,
            ...template,
            estimatedBuildTime: this.estimateBuildTime(template),
            requiredComponents: template.components.length,
            complexityLevel: this.getComplexityLevel(template.complexity)
        };
    }
    
    estimateBuildTime(template) {
        const baseMinutes = {
            'low': 60,
            'medium': 180,
            'high': 300,
            'very-high': 480
        };
        
        const base = baseMinutes[template.complexity] || 180;
        const componentMultiplier = template.components.length * 10;
        
        return Math.round((base + componentMultiplier) / 60 * 10) / 10; // Round to 1 decimal
    }
    
    getComplexityLevel(complexity) {
        const levels = {
            'low': { level: 1, description: 'Simple build, basic features' },
            'medium': { level: 2, description: 'Moderate complexity, standard features' },
            'high': { level: 3, description: 'Complex build, advanced features' },
            'very-high': { level: 4, description: 'Very complex, enterprise-level features' }
        };
        
        return levels[complexity] || levels['medium'];
    }
    
    // Get all available templates by category
    getTemplatesByCategory(category = null) {
        if (category) {
            return Object.entries(this.templates)
                .filter(([_, template]) => template.category === category)
                .map(([id, template]) => ({ id, ...template }));
        }
        
        const categories = {};
        for (const [id, template] of Object.entries(this.templates)) {
            if (!categories[template.category]) {
                categories[template.category] = [];
            }
            categories[template.category].push({ id, ...template });
        }
        
        return categories;
    }
    
    // Analyze user intent and provide suggestions
    async analyzeAndSuggest(userIntent) {
        const match = await this.matchTemplate(userIntent);
        const categoryTemplates = this.getTemplatesByCategory(match.template.category);
        
        return {
            primaryMatch: match,
            categoryAlternatives: categoryTemplates.slice(0, 3),
            buildSuggestions: this.generateBuildSuggestions(match),
            estimatedTime: this.estimateBuildTime(match.template),
            complexity: this.getComplexityLevel(match.template.complexity)
        };
    }
    
    generateBuildSuggestions(match) {
        const suggestions = [];
        
        if (match.confidence < 0.8) {
            suggestions.push('💡 Consider providing more specific details about your platform needs');
        }
        
        if (match.template.complexity === 'high') {
            suggestions.push('⚡ This is a complex build - consider starting with a simpler version');
        }
        
        if (match.template.components.length > 6) {
            suggestions.push('🧩 This template uses many components - perfect for a full-featured platform');
        }
        
        suggestions.push(`🎯 Best practices: ${match.template.category} platforms work great with ${match.template.features.slice(0, 2).join(' and ')}`);
        
        return suggestions;
    }
}

module.exports = TemplateMatcherAI;

// Demo if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('🎯 TEMPLATE MATCHER AI DEMO');
        console.log('============================\n');
        
        const matcher = new TemplateMatcherAI();
        
        const testIntents = [
            "I want to build a crypto portfolio tracker with flight booking",
            "Create an online store for selling handmade crafts",
            "Build a task management system for my team",
            "I need a social network for dog lovers",
            "Make a hotel booking platform"
        ];
        
        for (const intent of testIntents) {
            console.log(`\n🔍 Intent: "${intent}"`);
            const result = await matcher.matchTemplate(intent);
            console.log(`✅ Template: ${result.templateId}`);
            console.log(`📊 Confidence: ${Math.round(result.confidence * 100)}%`);
            console.log(`💭 Reasoning: ${result.reasoning}`);
            console.log(`⏱️  Build time: ~${matcher.estimateBuildTime(result.template)} hours`);
            console.log(`🧩 Components: ${result.template.components.join(', ')}`);
        }
    };
    
    demo().catch(console.error);
}
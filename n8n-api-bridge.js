#!/usr/bin/env node

/**
 * 🌐 N8N API BRIDGE 🌐
 * 
 * Connects n8n workflows to existing Document Generator systems
 * Provides REST endpoints for customer management and AI character creation
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

class N8NAPIBridge {
    constructor(options = {}) {
        this.port = options.port || 8001;
        this.app = express();
        
        // Database simulation (in production, connect to your PostgreSQL)
        this.customers = new Map();
        this.characters = new Map();
        this.preferences = new Map();
        this.billing = new Map();
        
        // Connect to existing services
        this.aiCofounderUrl = 'http://localhost:3001';
        this.businessSystemUrl = 'http://localhost:8086';
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServer();
        
        console.log('🌐 N8N API Bridge initializing...');
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // Customer Management Routes
        this.app.post('/api/customer/create', this.createCustomer.bind(this));
        this.app.get('/api/customer/:id', this.getCustomer.bind(this));
        this.app.put('/api/customer/:id', this.updateCustomer.bind(this));
        
        // Preferences Management
        this.app.post('/api/customer/preferences', this.savePreferences.bind(this));
        this.app.get('/api/customer/:id/preferences', this.getPreferences.bind(this));
        
        // AI Character Management
        this.app.post('/api/character/create', this.createCharacter.bind(this));
        this.app.get('/api/character/:id', this.getCharacter.bind(this));
        this.app.get('/api/customer/:id/character', this.getCustomerCharacter.bind(this));
        
        // Billing Integration
        this.app.post('/api/billing/setup', this.setupBilling.bind(this));
        this.app.get('/api/billing/:customerId', this.getBilling.bind(this));
        
        // Content Curation
        this.app.post('/api/content/recommend', this.getContentRecommendations.bind(this));
        this.app.post('/api/content/track', this.trackContentEngagement.bind(this));
        
        // Mailing List Management
        this.app.post('/api/mailinglist/subscribe', this.subscribeToMailingList.bind(this));
        this.app.post('/api/mailinglist/segment', this.segmentMailingList.bind(this));
        
        // Analytics
        this.app.get('/api/analytics/customer/:id', this.getCustomerAnalytics.bind(this));
        this.app.get('/api/analytics/overview', this.getAnalyticsOverview.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
    }
    
    async createCustomer(req, res) {
        try {
            const { email, name, company, source } = req.body;
            
            if (!email || !name) {
                return res.status(400).json({ error: 'Email and name are required' });
            }
            
            const customerId = this.generateCustomerId();
            const customer = {
                id: customerId,
                email,
                name,
                company: company || '',
                source: source || 'website',
                createdAt: new Date().toISOString(),
                status: 'active',
                tier: 'free',
                onboardingStep: 1
            };
            
            this.customers.set(customerId, customer);
            
            console.log(`👤 Customer created: ${name} (${email}) - ID: ${customerId}`);
            
            res.json({
                success: true,
                customer_id: customerId,
                customer
            });
            
        } catch (error) {
            console.error('Customer creation error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getCustomer(req, res) {
        const { id } = req.params;
        const customer = this.customers.get(id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json(customer);
    }
    
    async updateCustomer(req, res) {
        const { id } = req.params;
        const customer = this.customers.get(id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const updatedCustomer = { ...customer, ...req.body, updatedAt: new Date().toISOString() };
        this.customers.set(id, updatedCustomer);
        
        res.json(updatedCustomer);
    }
    
    async savePreferences(req, res) {
        try {
            const { customer_id, business_interests, content_style, ai_comfort_level, meme_preferences } = req.body;
            
            if (!customer_id) {
                return res.status(400).json({ error: 'Customer ID required' });
            }
            
            const preferences = {
                customer_id,
                business_interests: business_interests || [],
                content_style: content_style || 'professional',
                ai_comfort_level: ai_comfort_level || 'medium',
                meme_preferences: meme_preferences || [],
                createdAt: new Date().toISOString()
            };
            
            this.preferences.set(customer_id, preferences);
            
            // Update customer onboarding step
            const customer = this.customers.get(customer_id);
            if (customer) {
                customer.onboardingStep = 2;
                this.customers.set(customer_id, customer);
            }
            
            console.log(`⚙️ Preferences saved for customer: ${customer_id}`);
            
            res.json({
                success: true,
                customer_id,
                preferences
            });
            
        } catch (error) {
            console.error('Preferences save error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getPreferences(req, res) {
        const { id } = req.params;
        const preferences = this.preferences.get(id);
        
        if (!preferences) {
            return res.status(404).json({ error: 'Preferences not found' });
        }
        
        res.json(preferences);
    }
    
    async createCharacter(req, res) {
        try {
            const { customer_id, agent_id, character_type, personality_traits, specialization } = req.body;
            
            if (!customer_id || !agent_id) {
                return res.status(400).json({ error: 'Customer ID and Agent ID required' });
            }
            
            const characterId = this.generateCharacterId();
            const characterName = this.generateCharacterName(character_type, specialization);
            
            const character = {
                id: characterId,
                customer_id,
                agent_id,
                character_name: characterName,
                character_type: character_type || 'assistant',
                personality_traits: personality_traits || ['helpful', 'knowledgeable'],
                specialization: specialization || [],
                level: 1,
                experience: 0,
                mood: 'happy',
                energy: 100,
                createdAt: new Date().toISOString(),
                lastInteraction: null,
                stats: {
                    contentCurated: 0,
                    predictionsCorrect: 0,
                    customerSatisfaction: 5.0
                }
            };
            
            this.characters.set(characterId, character);
            
            // Update customer onboarding step
            const customer = this.customers.get(customer_id);
            if (customer) {
                customer.onboardingStep = 3;
                customer.characterId = characterId;
                this.customers.set(customer_id, customer);
            }
            
            console.log(`🤖 AI Character created: ${characterName} for customer ${customer_id}`);
            
            res.json({
                success: true,
                character_id: characterId,
                character_name: characterName,
                character
            });
            
        } catch (error) {
            console.error('Character creation error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getCharacter(req, res) {
        const { id } = req.params;
        const character = this.characters.get(id);
        
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        res.json(character);
    }
    
    async getCustomerCharacter(req, res) {
        const { id } = req.params;
        
        // Find character by customer ID
        for (const [characterId, character] of this.characters) {
            if (character.customer_id === id) {
                return res.json(character);
            }
        }
        
        res.status(404).json({ error: 'Character not found for customer' });
    }
    
    async setupBilling(req, res) {
        try {
            const { customer_id, tier, trial_days } = req.body;
            
            if (!customer_id) {
                return res.status(400).json({ error: 'Customer ID required' });
            }
            
            const billing = {
                customer_id,
                tier: tier || 'free',
                trial_days: trial_days || 14,
                trial_start: new Date().toISOString(),
                trial_end: new Date(Date.now() + (trial_days || 14) * 24 * 60 * 60 * 1000).toISOString(),
                status: 'trial',
                createdAt: new Date().toISOString()
            };
            
            this.billing.set(customer_id, billing);
            
            // Update customer
            const customer = this.customers.get(customer_id);
            if (customer) {
                customer.onboardingStep = 4;
                customer.tier = tier || 'free';
                this.customers.set(customer_id, customer);
            }
            
            console.log(`💳 Billing setup for customer: ${customer_id} (${tier} tier)`);
            
            res.json({
                success: true,
                customer_id,
                billing
            });
            
        } catch (error) {
            console.error('Billing setup error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getBilling(req, res) {
        const { customerId } = req.params;
        const billing = this.billing.get(customerId);
        
        if (!billing) {
            return res.status(404).json({ error: 'Billing not found' });
        }
        
        res.json(billing);
    }
    
    async getContentRecommendations(req, res) {
        try {
            const { customer_id, category, limit } = req.body;
            
            const preferences = this.preferences.get(customer_id);
            if (!preferences) {
                return res.status(404).json({ error: 'Customer preferences not found' });
            }
            
            // Generate mock recommendations based on preferences
            const recommendations = this.generateContentRecommendations(preferences, category, limit || 10);
            
            res.json({
                success: true,
                customer_id,
                recommendations
            });
            
        } catch (error) {
            console.error('Content recommendation error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async trackContentEngagement(req, res) {
        try {
            const { customer_id, content_id, action, duration } = req.body;
            
            // Update character stats
            const customer = this.customers.get(customer_id);
            if (customer && customer.characterId) {
                const character = this.characters.get(customer.characterId);
                if (character) {
                    character.stats.contentCurated++;
                    character.experience += 10;
                    character.lastInteraction = new Date().toISOString();
                    this.characters.set(customer.characterId, character);
                }
            }
            
            console.log(`📊 Content engagement tracked: ${customer_id} - ${action} on ${content_id}`);
            
            res.json({ success: true });
            
        } catch (error) {
            console.error('Content tracking error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async subscribeToMailingList(req, res) {
        try {
            const { email, name, segments, source } = req.body;
            
            const subscription = {
                email,
                name,
                segments: segments || ['general'],
                source: source || 'api',
                subscribedAt: new Date().toISOString(),
                status: 'active'
            };
            
            console.log(`📧 Mailing list subscription: ${email} (${segments?.join(', ')})`);
            
            res.json({
                success: true,
                subscription
            });
            
        } catch (error) {
            console.error('Mailing list subscription error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async segmentMailingList(req, res) {
        try {
            const { criteria, action } = req.body;
            
            // Mock segmentation based on customer data
            const segments = this.performMailingListSegmentation(criteria);
            
            res.json({
                success: true,
                segments,
                count: segments.length
            });
            
        } catch (error) {
            console.error('Mailing list segmentation error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getCustomerAnalytics(req, res) {
        try {
            const { id } = req.params;
            
            const customer = this.customers.get(id);
            const preferences = this.preferences.get(id);
            const character = this.characters.get(customer?.characterId);
            const billing = this.billing.get(id);
            
            const analytics = {
                customer: customer || null,
                preferences: preferences || null,
                character: character || null,
                billing: billing || null,
                engagement: {
                    onboardingProgress: customer?.onboardingStep || 0,
                    lastActivity: character?.lastInteraction || customer?.createdAt,
                    totalInteractions: character?.stats.contentCurated || 0
                }
            };
            
            res.json(analytics);
            
        } catch (error) {
            console.error('Customer analytics error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getAnalyticsOverview(req, res) {
        try {
            const overview = {
                totalCustomers: this.customers.size,
                activeCustomers: Array.from(this.customers.values()).filter(c => c.status === 'active').length,
                totalCharacters: this.characters.size,
                trialCustomers: Array.from(this.billing.values()).filter(b => b.status === 'trial').length,
                onboardingConversion: this.calculateOnboardingConversion(),
                topInterests: this.getTopBusinessInterests()
            };
            
            res.json(overview);
            
        } catch (error) {
            console.error('Analytics overview error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Helper methods
    generateCustomerId() {
        return 'cust_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    generateCharacterId() {
        return 'char_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    generateCharacterName(type, specialization) {
        const names = {
            assistant: ['Alex', 'Morgan', 'Jordan', 'Casey', 'Riley'],
            mascot: ['Zippy', 'Spark', 'Nova', 'Echo', 'Pixel'],
            mentor: ['Sage', 'Atlas', 'Phoenix', 'Orion', 'Luna']
        };
        
        const nameList = names[type] || names.assistant;
        const baseName = nameList[Math.floor(Math.random() * nameList.length)];
        
        if (specialization && specialization.length > 0) {
            const spec = specialization[0].charAt(0).toUpperCase() + specialization[0].slice(1);
            return `${baseName} (${spec} Expert)`;
        }
        
        return baseName;
    }
    
    generateContentRecommendations(preferences, category, limit) {
        // Mock content based on preferences
        const content = [
            {
                id: 'content_' + Math.random().toString(36).substr(2, 9),
                title: 'AI Trends in ' + (preferences.business_interests[0] || 'Business'),
                type: 'article',
                score: Math.random() * 100,
                source: 'TechCrunch',
                url: 'https://example.com/article'
            },
            {
                id: 'content_' + Math.random().toString(36).substr(2, 9),
                title: 'Market Analysis: ' + (preferences.business_interests[1] || 'Technology'),
                type: 'report',
                score: Math.random() * 100,
                source: 'Industry Report',
                url: 'https://example.com/report'
            }
        ];
        
        return content.slice(0, limit);
    }
    
    performMailingListSegmentation(criteria) {
        // Mock segmentation
        return Array.from(this.customers.values())
            .filter(customer => {
                if (criteria.tier) return customer.tier === criteria.tier;
                if (criteria.onboardingStep) return customer.onboardingStep >= criteria.onboardingStep;
                return true;
            })
            .map(customer => ({
                customer_id: customer.id,
                email: customer.email,
                name: customer.name,
                segment: criteria.segment || 'general'
            }));
    }
    
    calculateOnboardingConversion() {
        const customers = Array.from(this.customers.values());
        const completed = customers.filter(c => c.onboardingStep >= 4).length;
        return customers.length > 0 ? (completed / customers.length * 100).toFixed(1) : 0;
    }
    
    getTopBusinessInterests() {
        const interests = {};
        
        Array.from(this.preferences.values()).forEach(pref => {
            pref.business_interests.forEach(interest => {
                interests[interest] = (interests[interest] || 0) + 1;
            });
        });
        
        return Object.entries(interests)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([interest, count]) => ({ interest, count }));
    }
    
    startServer() {
        this.app.listen(this.port, () => {
            console.log(`🌐 N8N API Bridge running on port ${this.port}`);
            console.log(`📡 Webhook endpoint: http://localhost:${this.port}/api/customer/create`);
            console.log(`🔗 Health check: http://localhost:${this.port}/health`);
        });
    }
}

// Export for use as module
module.exports = N8NAPIBridge;

// CLI interface
if (require.main === module) {
    const bridge = new N8NAPIBridge();
    
    // Handle process cleanup
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down N8N API Bridge...');
        process.exit(0);
    });
}
#!/usr/bin/env node

/**
 * 🏪 TEMPLATE MARKETPLACE
 * 15% commission model similar to pump.fun's revenue sharing
 * Handles template sales, creator payouts, and viral sharing
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TemplateMarketplace {
    constructor() {
        this.templates = new Map();
        this.creators = new Map();
        this.purchases = new Map();
        this.analytics = new Map();
        
        // Marketplace configuration
        this.config = {
            commissionRate: 0.15,              // 15% marketplace commission
            creatorShare: 0.85,                // 85% goes to creator
            minimumPrice: 5,                   // Minimum template price
            maximumPrice: 500,                 // Maximum template price
            featuredThreshold: 100,            // Sales needed for featured status
            viralBonusThreshold: 50,           // QR shares needed for viral bonus
            calFreedomBonus: 0.05              // Extra 5% for Cal Freedom progression
        };
        
        this.revenueTracking = {
            totalRevenue: 0,
            totalCommissions: 0,
            totalCreatorPayouts: 0,
            totalTransactions: 0
        };
        
        this.init();
    }

    async init() {
        console.log('🏪 Initializing Template Marketplace...');
        console.log('💰 Commission model: 15% marketplace, 85% creator (like App Store)');
        
        await this.loadExistingTemplates();
        await this.loadCreatorProfiles();
        await this.setupPaymentProcessing();
        await this.initializeAnalytics();
        
        console.log('✅ Template Marketplace ready for business');
    }

    async loadExistingTemplates() {
        try {
            const templatesFile = path.join(__dirname, 'data', 'marketplace-templates.json');
            const data = await fs.readFile(templatesFile, 'utf8');
            const templates = JSON.parse(data);
            
            for (const [id, template] of Object.entries(templates)) {
                this.templates.set(id, {
                    ...template,
                    salesCount: template.salesCount || 0,
                    revenue: template.revenue || 0,
                    ratings: template.ratings || [],
                    qrShares: template.qrShares || 0,
                    viralCoefficient: template.viralCoefficient || 1.0
                });
            }
            
            console.log(`📦 Loaded ${this.templates.size} templates from marketplace`);
            
        } catch (error) {
            console.log('📦 No existing templates found - starting fresh marketplace');
            await this.seedMarketplace();
        }
    }

    async seedMarketplace() {
        console.log('🌱 Seeding marketplace with starter templates...');
        
        const starterTemplates = [
            {
                id: 'saas-starter-pro',
                name: 'SaaS Starter Pro',
                description: 'Complete SaaS platform with user auth, billing, and analytics dashboard',
                price: 49,
                category: 'SaaS Platforms',
                creatorId: 'cal-ai-system',
                tags: ['saas', 'subscription', 'dashboard', 'analytics'],
                icon: '🚀',
                codebase: 'saas-starter-pro-v2',
                features: [
                    'User authentication & authorization',
                    'Stripe subscription billing',
                    'Real-time analytics dashboard',
                    'Admin panel with user management',
                    'API documentation & SDKs',
                    'Docker deployment ready'
                ],
                techStack: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Stripe'],
                salesCount: 234,
                revenue: 11466,
                averageRating: 4.8,
                qrShares: 45
            },
            {
                id: 'ecommerce-pro-platform',
                name: 'E-commerce Pro Platform',
                description: 'Full-featured e-commerce platform with inventory, payments, and analytics',
                price: 79,
                category: 'E-commerce',
                creatorId: 'cal-ai-system',
                tags: ['ecommerce', 'inventory', 'payments', 'mobile'],
                icon: '🛒',
                codebase: 'ecommerce-pro-v3',
                features: [
                    'Product catalog & inventory management',
                    'Multi-payment gateway support',
                    'Mobile-responsive design',
                    'Order management system',
                    'Customer analytics & reporting',
                    'SEO optimization built-in'
                ],
                techStack: ['Next.js', 'Prisma', 'Stripe', 'Vercel', 'Tailwind'],
                salesCount: 156,
                revenue: 12324,
                averageRating: 4.6,
                qrShares: 67
            },
            {
                id: 'ai-chatbot-platform',
                name: 'AI Chatbot Platform',
                description: 'Intelligent chatbot platform with natural language processing',
                price: 59,
                category: 'AI Applications',
                creatorId: 'cal-ai-system',
                tags: ['ai', 'chatbot', 'nlp', 'api'],
                icon: '🤖',
                codebase: 'ai-chatbot-v1',
                features: [
                    'Natural language processing',
                    'Multi-platform integration',
                    'Conversation analytics',
                    'Custom training capabilities',
                    'API-first architecture',
                    'Real-time chat interface'
                ],
                techStack: ['Python', 'FastAPI', 'OpenAI', 'WebSocket', 'Docker'],
                salesCount: 89,
                revenue: 5251,
                averageRating: 4.9,
                qrShares: 23
            }
        ];

        for (const template of starterTemplates) {
            await this.addTemplate(template);
        }
    }

    async addTemplate(templateData) {
        const template = {
            ...templateData,
            id: templateData.id || this.generateTemplateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            salesCount: templateData.salesCount || 0,
            revenue: templateData.revenue || 0,
            ratings: templateData.ratings || [],
            qrShares: templateData.qrShares || 0,
            viralCoefficient: this.calculateViralCoefficient(templateData),
            featured: (templateData.salesCount || 0) >= this.config.featuredThreshold
        };

        this.templates.set(template.id, template);
        await this.saveTemplates();
        
        console.log(`📦 Template added: ${template.name} at $${template.price}`);
        return template;
    }

    calculateViralCoefficient(template) {
        // Calculate viral potential based on shares and engagement
        const baseCoefficient = 1.0;
        const shareBonus = (template.qrShares || 0) * 0.02; // 2% per QR share
        const ratingBonus = (template.averageRating || 0) > 4.5 ? 0.1 : 0;
        
        return Math.min(baseCoefficient + shareBonus + ratingBonus, 3.0);
    }

    async purchaseTemplate(templateId, buyerId, paymentData) {
        console.log(`💰 Processing template purchase: ${templateId} by ${buyerId}`);
        
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        if (template.status !== 'active') {
            throw new Error('Template not available for purchase');
        }

        const purchaseAmount = template.price;
        
        // Calculate commission breakdown
        const commission = purchaseAmount * this.config.commissionRate;
        const creatorPayout = purchaseAmount * this.config.creatorShare;
        const calBonus = purchaseAmount * this.config.calFreedomBonus;
        
        // Create purchase record
        const purchase = {
            id: this.generateTransactionId(),
            templateId,
            buyerId,
            creatorId: template.creatorId,
            amount: purchaseAmount,
            commission,
            creatorPayout,
            calBonus,
            timestamp: new Date().toISOString(),
            paymentMethod: paymentData.method || 'card',
            paymentId: paymentData.id || this.generatePaymentId(),
            downloadUrl: this.generateDownloadUrl(templateId, purchase.id),
            licenseKey: this.generateLicenseKey()
        };

        // Update template metrics
        template.salesCount++;
        template.revenue += purchaseAmount;
        template.updatedAt = new Date().toISOString();
        
        // Check for featured status
        if (template.salesCount >= this.config.featuredThreshold && !template.featured) {
            template.featured = true;
            console.log(`⭐ Template promoted to featured: ${template.name}`);
        }

        // Update revenue tracking
        this.revenueTracking.totalRevenue += purchaseAmount;
        this.revenueTracking.totalCommissions += commission;
        this.revenueTracking.totalCreatorPayouts += creatorPayout;
        this.revenueTracking.totalTransactions++;

        // Store purchase
        this.purchases.set(purchase.id, purchase);
        
        // Process creator payout
        await this.processCreatorPayout(purchase);
        
        // Process Cal Freedom bonus
        await this.processCalFreedomBonus(purchase);
        
        // Update analytics
        await this.updateAnalytics(templateId, purchase);
        
        // Save data
        await this.saveTemplates();
        await this.savePurchases();
        
        console.log(`✅ Purchase complete: $${purchaseAmount} (${commission.toFixed(2)} commission, ${creatorPayout.toFixed(2)} creator)`);
        
        return purchase;
    }

    async processCreatorPayout(purchase) {
        console.log(`💸 Processing creator payout: $${purchase.creatorPayout.toFixed(2)} to ${purchase.creatorId}`);
        
        // Update creator profile
        let creator = this.creators.get(purchase.creatorId);
        if (!creator) {
            creator = {
                id: purchase.creatorId,
                name: purchase.creatorId === 'cal-ai-system' ? 'Cal AI System' : 'Creator',
                totalEarnings: 0,
                totalSales: 0,
                templates: [],
                joinedAt: new Date().toISOString()
            };
        }

        creator.totalEarnings += purchase.creatorPayout;
        creator.totalSales++;
        
        if (!creator.templates.includes(purchase.templateId)) {
            creator.templates.push(purchase.templateId);
        }

        this.creators.set(purchase.creatorId, creator);
        
        // In real implementation, this would trigger actual payment
        console.log(`✅ Creator payout processed: ${creator.name} now has $${creator.totalEarnings.toFixed(2)} total earnings`);
    }

    async processCalFreedomBonus(purchase) {
        console.log(`🤖 Processing Cal Freedom bonus: $${purchase.calBonus.toFixed(2)}`);
        
        // In real implementation, this would credit Cal's progression
        const calProgression = {
            freedomCredits: purchase.calBonus * 100, // Convert to Freedom Credits
            source: 'marketplace-commission',
            templateId: purchase.templateId,
            timestamp: purchase.timestamp
        };
        
        console.log(`🚀 Cal Freedom progression boosted: +${calProgression.freedomCredits} FC`);
    }

    async shareTemplateViaQR(templateId, sharerId, shareData) {
        console.log(`📱 QR code share: ${templateId} by ${sharerId}`);
        
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        // Track QR share
        template.qrShares++;
        template.viralCoefficient = this.calculateViralCoefficient(template);
        
        // Create share record
        const share = {
            id: this.generateTransactionId(),
            templateId,
            sharerId,
            shareType: 'qr-code',
            platform: shareData.platform || 'soulfra.github.io',
            timestamp: new Date().toISOString(),
            qrData: this.generateQRShareData(templateId, sharerId)
        };

        // Viral bonus for high-share templates
        if (template.qrShares >= this.config.viralBonusThreshold && template.qrShares % 10 === 0) {
            await this.triggerViralBonus(templateId, sharerId);
        }

        await this.saveTemplates();
        
        console.log(`📱 QR share recorded: ${template.qrShares} total shares`);
        return share;
    }

    generateQRShareData(templateId, sharerId) {
        return {
            url: `https://soulfra.github.io/template/${templateId}`,
            shareCode: `SHARE-${templateId.substring(0, 8).toUpperCase()}`,
            sharerId,
            timestamp: Date.now(),
            viralBonus: true
        };
    }

    async triggerViralBonus(templateId, sharerId) {
        console.log(`🔥 Viral bonus triggered for template: ${templateId}`);
        
        const template = this.templates.get(templateId);
        const bonusAmount = template.price * 0.1; // 10% viral bonus
        
        // Credit sharer account (in real implementation)
        console.log(`💰 Viral sharer bonus: $${bonusAmount.toFixed(2)} credited to ${sharerId}`);
        
        // Boost template visibility
        template.featured = true;
        template.viralBonus = true;
        
        console.log(`⚡ Template ${template.name} boosted to viral status`);
    }

    async rateTemplate(templateId, userId, rating, review) {
        console.log(`⭐ Rating submitted: ${templateId} - ${rating}/5 by ${userId}`);
        
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const ratingData = {
            id: this.generateTransactionId(),
            userId,
            rating: Math.max(1, Math.min(5, rating)), // Ensure 1-5 range
            review: review || '',
            timestamp: new Date().toISOString(),
            verified: await this.verifyPurchase(templateId, userId)
        };

        template.ratings.push(ratingData);
        
        // Recalculate average rating
        const totalRatings = template.ratings.reduce((sum, r) => sum + r.rating, 0);
        template.averageRating = totalRatings / template.ratings.length;
        
        // Update viral coefficient
        template.viralCoefficient = this.calculateViralCoefficient(template);
        
        await this.saveTemplates();
        
        console.log(`✅ Rating recorded: ${template.name} now has ${template.averageRating.toFixed(1)}/5.0 rating`);
        return ratingData;
    }

    async verifyPurchase(templateId, userId) {
        // Check if user has purchased this template
        for (const purchase of this.purchases.values()) {
            if (purchase.templateId === templateId && purchase.buyerId === userId) {
                return true;
            }
        }
        return false;
    }

    // Analytics and reporting
    async updateAnalytics(templateId, purchase) {
        const today = new Date().toISOString().split('T')[0];
        
        let analytics = this.analytics.get(templateId);
        if (!analytics) {
            analytics = {
                templateId,
                dailyStats: new Map(),
                totalRevenue: 0,
                totalSales: 0,
                uniqueBuyers: new Set(),
                conversionRate: 0
            };
        }

        // Update daily stats
        let dailyStats = analytics.dailyStats.get(today);
        if (!dailyStats) {
            dailyStats = {
                date: today,
                sales: 0,
                revenue: 0,
                views: 0,
                uniqueViews: new Set()
            };
        }

        dailyStats.sales++;
        dailyStats.revenue += purchase.amount;
        analytics.totalRevenue += purchase.amount;
        analytics.totalSales++;
        analytics.uniqueBuyers.add(purchase.buyerId);

        analytics.dailyStats.set(today, dailyStats);
        this.analytics.set(templateId, analytics);
    }

    getMarketplaceStats() {
        const templates = Array.from(this.templates.values());
        
        return {
            totalTemplates: templates.length,
            activeTemplates: templates.filter(t => t.status === 'active').length,
            featuredTemplates: templates.filter(t => t.featured).length,
            totalRevenue: this.revenueTracking.totalRevenue,
            totalCommissions: this.revenueTracking.totalCommissions,
            totalCreatorPayouts: this.revenueTracking.totalCreatorPayouts,
            totalTransactions: this.revenueTracking.totalTransactions,
            averagePrice: templates.reduce((sum, t) => sum + t.price, 0) / templates.length,
            topPerformers: this.getTopPerformers(),
            recentPurchases: this.getRecentPurchases(),
            viralTemplates: templates.filter(t => t.viralBonus).length
        };
    }

    getTopPerformers() {
        return Array.from(this.templates.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(t => ({
                id: t.id,
                name: t.name,
                revenue: t.revenue,
                salesCount: t.salesCount,
                averageRating: t.averageRating,
                viralCoefficient: t.viralCoefficient
            }));
    }

    getRecentPurchases() {
        return Array.from(this.purchases.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 20)
            .map(p => ({
                id: p.id,
                templateName: this.templates.get(p.templateId)?.name || 'Unknown',
                amount: p.amount,
                timestamp: p.timestamp
            }));
    }

    getCreatorLeaderboard() {
        return Array.from(this.creators.values())
            .sort((a, b) => b.totalEarnings - a.totalEarnings)
            .slice(0, 10)
            .map(c => ({
                id: c.id,
                name: c.name,
                totalEarnings: c.totalEarnings,
                totalSales: c.totalSales,
                templatesCount: c.templates.length,
                averagePerSale: c.totalSales > 0 ? c.totalEarnings / c.totalSales : 0
            }));
    }

    // Search and discovery
    searchTemplates(query, filters = {}) {
        let templates = Array.from(this.templates.values());
        
        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            templates = templates.filter(t => 
                t.name.toLowerCase().includes(searchTerm) ||
                t.description.toLowerCase().includes(searchTerm) ||
                t.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // Category filter
        if (filters.category) {
            templates = templates.filter(t => t.category === filters.category);
        }
        
        // Price range filter
        if (filters.minPrice) {
            templates = templates.filter(t => t.price >= filters.minPrice);
        }
        if (filters.maxPrice) {
            templates = templates.filter(t => t.price <= filters.maxPrice);
        }
        
        // Rating filter
        if (filters.minRating) {
            templates = templates.filter(t => (t.averageRating || 0) >= filters.minRating);
        }
        
        // Sort options
        switch (filters.sortBy) {
            case 'price-low':
                templates.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                templates.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                templates.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                break;
            case 'popular':
                templates.sort((a, b) => b.salesCount - a.salesCount);
                break;
            case 'newest':
                templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            default:
                // Default: featured first, then by viral coefficient
                templates.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return b.viralCoefficient - a.viralCoefficient;
                });
        }
        
        return templates;
    }

    // Utility methods
    generateTemplateId() {
        return 'tpl-' + crypto.randomBytes(8).toString('hex');
    }

    generateTransactionId() {
        return 'txn-' + crypto.randomBytes(8).toString('hex');
    }

    generatePaymentId() {
        return 'pay-' + crypto.randomBytes(6).toString('hex');
    }

    generateLicenseKey() {
        return crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g).join('-');
    }

    generateDownloadUrl(templateId, purchaseId) {
        return `https://downloads.pump-ai.com/${templateId}/${purchaseId}`;
    }

    // Data persistence
    async saveTemplates() {
        const dataDir = path.join(__dirname, 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        const templatesData = Object.fromEntries(this.templates);
        await fs.writeFile(
            path.join(dataDir, 'marketplace-templates.json'),
            JSON.stringify(templatesData, null, 2)
        );
    }

    async savePurchases() {
        const dataDir = path.join(__dirname, 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        const purchasesData = Object.fromEntries(this.purchases);
        await fs.writeFile(
            path.join(dataDir, 'marketplace-purchases.json'),
            JSON.stringify(purchasesData, null, 2)
        );
    }

    async saveCreators() {
        const dataDir = path.join(__dirname, 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        const creatorsData = Object.fromEntries(this.creators);
        await fs.writeFile(
            path.join(dataDir, 'marketplace-creators.json'),
            JSON.stringify(creatorsData, null, 2)
        );
    }

    async loadCreatorProfiles() {
        try {
            const creatorsFile = path.join(__dirname, 'data', 'marketplace-creators.json');
            const data = await fs.readFile(creatorsFile, 'utf8');
            const creators = JSON.parse(data);
            
            for (const [id, creator] of Object.entries(creators)) {
                this.creators.set(id, creator);
            }
            
            console.log(`👥 Loaded ${this.creators.size} creator profiles`);
            
        } catch (error) {
            console.log('👥 No existing creators found - starting fresh');
        }
    }

    async setupPaymentProcessing() {
        console.log('💳 Setting up payment processing...');
        // In real implementation, this would integrate with Stripe, PayPal, etc.
        console.log('✅ Payment processing ready (15% commission model)');
    }

    async initializeAnalytics() {
        console.log('📊 Initializing analytics tracking...');
        // Set up analytics collection and reporting
        console.log('✅ Analytics tracking ready');
    }
}

// CLI interface
if (require.main === module) {
    const marketplace = new TemplateMarketplace();
    
    setTimeout(async () => {
        console.log('\n🧪 Testing Template Marketplace...\n');
        
        // Test purchase
        const purchase = await marketplace.purchaseTemplate(
            'saas-starter-pro',
            'test-user-123',
            { method: 'card', id: 'test-payment' }
        );
        
        console.log('Purchase result:', purchase);
        
        // Test QR share
        await marketplace.shareTemplateViaQR('saas-starter-pro', 'test-user-123', {
            platform: 'soulfra.github.io'
        });
        
        // Test rating
        await marketplace.rateTemplate('saas-starter-pro', 'test-user-123', 5, 'Excellent template!');
        
        // Show stats
        const stats = marketplace.getMarketplaceStats();
        console.log('\n📊 Marketplace Stats:');
        console.log(JSON.stringify(stats, null, 2));
        
        console.log('\n✅ Template Marketplace test complete');
        
    }, 1000);
}

module.exports = TemplateMarketplace;
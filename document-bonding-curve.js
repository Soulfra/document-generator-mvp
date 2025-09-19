#!/usr/bin/env node

/**
 * 📈 DOCUMENT BONDING CURVE SYSTEM
 * Mimics pump.fun's bonding curve model for document-to-MVP pricing
 * Implements progressive pricing and "graduation" to template marketplace
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DocumentBondingCurve {
    constructor() {
        this.documents = new Map();
        this.bondingCurves = new Map();
        this.graduatedMVPs = new Map();
        
        // Pricing configuration (similar to pump.fun)
        this.config = {
            basePriceUSD: 5.00,                    // Starting price like pump.fun's $2
            graduationThreshold: 10000,            // Like pump.fun's $69k market cap
            maxSupply: 1000000,                    // Like pump.fun's 800M tokens
            feePercentage: 0.01,                   // 1% swap fee like pump.fun
            graduationFeeUSD: 50.00,               // Like pump.fun's 2 SOL fee
            revenueSharePercentage: 0.15           // 15% commission vs pump.fun's listing fee
        };
        
        this.init();
    }

    async init() {
        console.log('📈 Initializing Document Bonding Curve System...');
        console.log('🎯 Pump.fun model: Document uploads → AI processing → Progressive pricing');
        
        await this.loadExistingCurves();
        await this.setupPricingEngine();
        await this.initializeTemplateMarketplace();
        
        console.log('✅ Document Bonding Curve System ready');
        console.log(`💰 Base price: $${this.config.basePriceUSD} • Graduation: $${this.config.graduationThreshold}`);
    }

    async loadExistingCurves() {
        // Load existing document bonding curves from storage
        try {
            const curvesFile = path.join(__dirname, 'data', 'bonding-curves.json');
            const data = await fs.readFile(curvesFile, 'utf8');
            const curves = JSON.parse(data);
            
            for (const [docId, curveData] of Object.entries(curves)) {
                this.bondingCurves.set(docId, curveData);
            }
            
            console.log(`📊 Loaded ${this.bondingCurves.size} existing bonding curves`);
            
        } catch (error) {
            console.log('📊 No existing curves found - starting fresh');
        }
    }

    async createDocumentCurve(documentData) {
        console.log('📄 Creating bonding curve for document:', documentData.title);
        
        const docId = this.generateDocumentId(documentData);
        const curve = {
            id: docId,
            title: documentData.title,
            type: documentData.type,
            createdAt: new Date().toISOString(),
            
            // Bonding curve parameters
            currentSupply: 0,
            maxSupply: this.config.maxSupply,
            basePrice: this.config.basePriceUSD,
            currentPrice: this.config.basePriceUSD,
            
            // Market metrics
            totalRevenue: 0,
            totalPurchases: 0,
            uniqueUsers: new Set(),
            
            // Status tracking
            status: 'active',
            graduated: false,
            graduatedAt: null,
            
            // Processing metrics
            processingTime: 0,
            aiModel: 'auto',
            complexity: this.calculateComplexity(documentData),
            
            // Purchase history
            purchases: [],
            
            // Template data (for post-graduation)
            templateData: null
        };

        this.bondingCurves.set(docId, curve);
        await this.saveCurves();
        
        console.log(`📈 Bonding curve created: ${docId} at $${curve.currentPrice}`);
        return curve;
    }

    calculateComplexity(documentData) {
        // Calculate document complexity to adjust pricing
        let complexity = 1.0;
        
        // Size factor
        if (documentData.size > 100000) complexity += 0.3;  // Large document
        if (documentData.size > 500000) complexity += 0.5;  // Very large document
        
        // Type factor
        const typeMultipliers = {
            'business-plan': 1.2,
            'technical-spec': 1.5,
            'api-documentation': 1.3,
            'chat-log': 0.8,
            'design-doc': 1.0
        };
        
        complexity *= typeMultipliers[documentData.type] || 1.0;
        
        // Content complexity (keywords indicating complexity)
        const complexKeywords = ['api', 'database', 'authentication', 'payment', 'microservice'];
        const content = documentData.content.toLowerCase();
        const keywordCount = complexKeywords.filter(keyword => content.includes(keyword)).length;
        
        complexity += keywordCount * 0.1;
        
        return Math.min(complexity, 3.0); // Cap at 3x
    }

    async processDocumentPurchase(docId, userId, purchaseAmount) {
        console.log(`💰 Processing purchase: ${docId} by ${userId} for $${purchaseAmount}`);
        
        const curve = this.bondingCurves.get(docId);
        if (!curve) {
            throw new Error('Document curve not found');
        }

        if (curve.graduated) {
            throw new Error('Document already graduated to marketplace');
        }

        // Calculate purchase parameters using bonding curve
        const purchaseData = this.calculatePurchase(curve, purchaseAmount);
        
        // Update curve state
        curve.currentSupply += purchaseData.tokensReceived;
        curve.currentPrice = this.calculateCurrentPrice(curve);
        curve.totalRevenue += purchaseAmount;
        curve.totalPurchases++;
        curve.uniqueUsers.add(userId);
        
        // Record purchase
        const purchase = {
            id: this.generateTransactionId(),
            userId,
            amount: purchaseAmount,
            tokensReceived: purchaseData.tokensReceived,
            priceAtPurchase: purchaseData.averagePrice,
            timestamp: new Date().toISOString(),
            fees: purchaseAmount * this.config.feePercentage
        };
        
        curve.purchases.push(purchase);
        
        // Check for graduation
        if (curve.totalRevenue >= this.config.graduationThreshold) {
            await this.graduateToMarketplace(docId);
        }
        
        await this.saveCurves();
        
        console.log(`✅ Purchase complete: ${purchaseData.tokensReceived} tokens at avg $${purchaseData.averagePrice.toFixed(4)}`);
        return purchase;
    }

    calculatePurchase(curve, purchaseAmount) {
        // Implement bonding curve math (simplified exponential curve)
        const k = 0.0001; // Curve steepness parameter
        const currentSupply = curve.currentSupply;
        
        // Calculate how many tokens can be bought with purchaseAmount
        // Using integral of bonding curve: price = basePrice * (1 + k * supply)
        
        let tokensReceived = 0;
        let remainingAmount = purchaseAmount;
        let tempSupply = currentSupply;
        const basePrice = curve.basePrice * curve.complexity;
        
        while (remainingAmount > 0.01 && tokensReceived < 10000) {
            const currentPrice = basePrice * (1 + k * tempSupply);
            const tokenPrice = Math.max(currentPrice, 0.01); // Minimum price
            
            if (remainingAmount >= tokenPrice) {
                tokensReceived++;
                remainingAmount -= tokenPrice;
                tempSupply++;
            } else {
                break;
            }
        }
        
        const averagePrice = tokensReceived > 0 ? (purchaseAmount - remainingAmount) / tokensReceived : basePrice;
        
        return {
            tokensReceived,
            averagePrice,
            remainingAmount,
            newSupply: tempSupply
        };
    }

    calculateCurrentPrice(curve) {
        const k = 0.0001;
        const basePrice = curve.basePrice * curve.complexity;
        return basePrice * (1 + k * curve.currentSupply);
    }

    async graduateToMarketplace(docId) {
        console.log(`🎓 Graduating document to marketplace: ${docId}`);
        
        const curve = this.bondingCurves.get(docId);
        if (!curve) return;
        
        // Mark as graduated
        curve.graduated = true;
        curve.graduatedAt = new Date().toISOString();
        curve.status = 'graduated';
        
        // Create template marketplace entry
        const template = {
            id: docId,
            name: curve.title,
            description: `AI-generated MVP from ${curve.type}`,
            price: this.calculateTemplatePrice(curve),
            category: this.getTemplateCategory(curve.type),
            
            // Performance metrics
            totalRevenue: curve.totalRevenue,
            uniqueUsers: curve.uniqueUsers.size,
            processingTime: curve.processingTime,
            complexity: curve.complexity,
            
            // Template assets
            codebase: `generated-mvp-${docId}`,
            documentation: `docs-${docId}`,
            deploymentGuide: `deploy-${docId}`,
            
            // Marketplace data
            downloads: 0,
            ratings: [],
            averageRating: 0,
            tags: this.generateTemplateTags(curve),
            
            createdAt: curve.createdAt,
            graduatedAt: curve.graduatedAt
        };
        
        this.graduatedMVPs.set(docId, template);
        
        // Trigger graduation rewards
        await this.distributeGraduationRewards(curve);
        
        console.log(`🏪 Template created in marketplace: ${template.name} at $${template.price}`);
        
        await this.saveCurves();
        await this.saveTemplates();
    }

    calculateTemplatePrice(curve) {
        // Base template price on performance and complexity
        let basePrice = 29; // Starting template price
        
        // Performance multipliers
        if (curve.uniqueUsers.size > 10) basePrice += 10;
        if (curve.uniqueUsers.size > 25) basePrice += 15;
        if (curve.totalRevenue > 20000) basePrice += 20;
        
        // Complexity multipliers
        basePrice *= curve.complexity;
        
        // Round to nearest $5
        return Math.round(basePrice / 5) * 5;
    }

    getTemplateCategory(documentType) {
        const categories = {
            'business-plan': 'SaaS Platforms',
            'technical-spec': 'Enterprise Solutions',
            'api-documentation': 'API Platforms',
            'chat-log': 'Communication Apps',
            'design-doc': 'UI/UX Templates'
        };
        
        return categories[documentType] || 'General Applications';
    }

    generateTemplateTags(curve) {
        const tags = [];
        
        // Type-based tags
        tags.push(curve.type);
        
        // Performance tags
        if (curve.uniqueUsers.size > 20) tags.push('popular');
        if (curve.totalRevenue > 15000) tags.push('high-revenue');
        if (curve.complexity > 1.5) tags.push('enterprise');
        
        // Feature tags based on content analysis
        if (curve.title.toLowerCase().includes('dashboard')) tags.push('analytics');
        if (curve.title.toLowerCase().includes('mobile')) tags.push('mobile');
        if (curve.title.toLowerCase().includes('ai')) tags.push('artificial-intelligence');
        
        return tags;
    }

    async distributeGraduationRewards(curve) {
        console.log('🎁 Distributing graduation rewards...');
        
        // Reward early supporters (first 10 purchasers)
        const earlySupporter = curve.purchases.slice(0, 10);
        for (const purchase of earlySupporter) {
            console.log(`💰 Early supporter reward: ${purchase.userId} gets bonus tokens`);
            // In real implementation, this would credit their account
        }
        
        // Platform fee collection
        const platformFee = this.config.graduationFeeUSD;
        console.log(`💰 Platform graduation fee collected: $${platformFee}`);
        
        // Cal Freedom progression boost
        console.log('🤖 Cal Freedom progression boosted from successful graduation');
    }

    // API endpoints for frontend
    async getDocumentCurve(docId) {
        const curve = this.bondingCurves.get(docId);
        if (!curve) return null;
        
        return {
            ...curve,
            uniqueUsers: curve.uniqueUsers.size, // Convert Set to number
            currentPriceUSD: this.calculateCurrentPrice(curve),
            progressToGraduation: (curve.totalRevenue / this.config.graduationThreshold) * 100,
            estimatedGraduationTime: this.estimateGraduationTime(curve)
        };
    }

    estimateGraduationTime(curve) {
        if (curve.totalRevenue === 0) return 'Unknown';
        
        const revenueRate = curve.totalRevenue / curve.purchases.length; // Avg per purchase
        const remainingRevenue = this.config.graduationThreshold - curve.totalRevenue;
        const estimatedPurchases = Math.ceil(remainingRevenue / revenueRate);
        
        // Assume 1 purchase per hour on average
        const hoursToGraduation = estimatedPurchases;
        
        if (hoursToGraduation < 24) {
            return `~${hoursToGraduation} hours`;
        } else {
            return `~${Math.ceil(hoursToGraduation / 24)} days`;
        }
    }

    async getMarketplaceTemplates() {
        const templates = Array.from(this.graduatedMVPs.values());
        
        return templates.map(template => ({
            ...template,
            performance: {
                conversionRate: (template.downloads / template.uniqueUsers) * 100,
                revenuePerUser: template.totalRevenue / template.uniqueUsers,
                timeToGraduation: this.calculateTimeToGraduation(template.id)
            }
        }));
    }

    calculateTimeToGraduation(templateId) {
        const curve = this.bondingCurves.get(templateId);
        if (!curve || !curve.graduatedAt) return null;
        
        const created = new Date(curve.createdAt);
        const graduated = new Date(curve.graduatedAt);
        
        return Math.round((graduated - created) / (1000 * 60 * 60)); // Hours to graduation
    }

    // Utility methods
    generateDocumentId(documentData) {
        const hash = crypto.createHash('sha256')
            .update(documentData.title + documentData.content + Date.now())
            .digest('hex');
        return 'doc-' + hash.substring(0, 12);
    }

    generateTransactionId() {
        return 'txn-' + crypto.randomBytes(8).toString('hex');
    }

    async saveCurves() {
        const dataDir = path.join(__dirname, 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        const curvesData = Object.fromEntries(
            Array.from(this.bondingCurves.entries()).map(([id, curve]) => [
                id, 
                { ...curve, uniqueUsers: Array.from(curve.uniqueUsers) }
            ])
        );
        
        await fs.writeFile(
            path.join(dataDir, 'bonding-curves.json'),
            JSON.stringify(curvesData, null, 2)
        );
    }

    async saveTemplates() {
        const dataDir = path.join(__dirname, 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        const templatesData = Object.fromEntries(this.graduatedMVPs);
        
        await fs.writeFile(
            path.join(dataDir, 'marketplace-templates.json'),
            JSON.stringify(templatesData, null, 2)
        );
    }

    async setupPricingEngine() {
        // Real-time pricing updates every 30 seconds
        setInterval(() => {
            this.updateAllPrices();
        }, 30000);
    }

    updateAllPrices() {
        for (const [docId, curve] of this.bondingCurves) {
            if (!curve.graduated) {
                curve.currentPrice = this.calculateCurrentPrice(curve);
            }
        }
    }

    async initializeTemplateMarketplace() {
        console.log('🏪 Initializing template marketplace...');
        
        // Load existing templates
        try {
            const templatesFile = path.join(__dirname, 'data', 'marketplace-templates.json');
            const data = await fs.readFile(templatesFile, 'utf8');
            const templates = JSON.parse(data);
            
            for (const [id, template] of Object.entries(templates)) {
                this.graduatedMVPs.set(id, template);
            }
            
            console.log(`🏪 Loaded ${this.graduatedMVPs.size} marketplace templates`);
            
        } catch (error) {
            console.log('🏪 No existing templates found - marketplace empty');
        }
    }

    // Status and analytics
    getSystemStatus() {
        const activeCurves = Array.from(this.bondingCurves.values()).filter(c => !c.graduated);
        const totalRevenue = Array.from(this.bondingCurves.values())
            .reduce((sum, curve) => sum + curve.totalRevenue, 0);
        
        return {
            activeCurves: activeCurves.length,
            graduatedTemplates: this.graduatedMVPs.size,
            totalRevenue: totalRevenue,
            averageGraduationTime: this.calculateAverageGraduationTime(),
            topPerformers: this.getTopPerformers(),
            recentActivity: this.getRecentActivity()
        };
    }

    calculateAverageGraduationTime() {
        const graduated = Array.from(this.bondingCurves.values()).filter(c => c.graduated);
        if (graduated.length === 0) return 0;
        
        const totalTime = graduated.reduce((sum, curve) => {
            const created = new Date(curve.createdAt);
            const graduatedAt = new Date(curve.graduatedAt);
            return sum + (graduatedAt - created);
        }, 0);
        
        return Math.round(totalTime / graduated.length / (1000 * 60 * 60)); // Average hours
    }

    getTopPerformers() {
        return Array.from(this.bondingCurves.values())
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5)
            .map(curve => ({
                id: curve.id,
                title: curve.title,
                revenue: curve.totalRevenue,
                users: curve.uniqueUsers.size || curve.uniqueUsers
            }));
    }

    getRecentActivity() {
        const allPurchases = [];
        
        for (const curve of this.bondingCurves.values()) {
            for (const purchase of curve.purchases) {
                allPurchases.push({
                    ...purchase,
                    documentTitle: curve.title
                });
            }
        }
        
        return allPurchases
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }
}

// CLI interface for testing
if (require.main === module) {
    const bondingCurve = new DocumentBondingCurve();
    
    // Example usage
    setTimeout(async () => {
        console.log('\n🧪 Testing Document Bonding Curve System...\n');
        
        // Create a test document
        const testDoc = {
            title: 'E-commerce Analytics Platform',
            type: 'business-plan',
            content: 'Complete business plan for an e-commerce analytics platform with real-time reporting, customer insights, and revenue optimization features.',
            size: 125000
        };
        
        // Create bonding curve
        const curve = await bondingCurve.createDocumentCurve(testDoc);
        
        // Simulate purchases
        await bondingCurve.processDocumentPurchase(curve.id, 'user-1', 5.00);
        await bondingCurve.processDocumentPurchase(curve.id, 'user-2', 8.50);
        await bondingCurve.processDocumentPurchase(curve.id, 'user-3', 12.00);
        
        // Check status
        const status = bondingCurve.getSystemStatus();
        console.log('\n📊 System Status:');
        console.log(JSON.stringify(status, null, 2));
        
        console.log('\n✅ Document Bonding Curve test complete');
        console.log('💰 Ready to process real document purchases!');
        
    }, 1000);
}

module.exports = DocumentBondingCurve;
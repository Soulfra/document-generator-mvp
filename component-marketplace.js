#!/usr/bin/env node

/**
 * COMPONENT MARKETPLACE
 * 
 * Central marketplace for AI components that enforces proper singleton → integration → reproducibility flow
 * Extends the Agent Economy Forum with component listings, reviews, and token-based transactions
 * 
 * This properly connects:
 * - Component Evaluation Orchestrator (port 9200) for approved components
 * - Agent Economy Forum (port 8080) for marketplace boards
 * - Multi-Instance Orchestrator (port 9000) for testing
 * - Component Packaging System for downloads
 * - BlameChain for karma tracking
 * 
 * Ensures all components follow proper development lifecycle:
 * 1. Singleton development
 * 2. Multi-instance testing
 * 3. Agent review and evaluation
 * 4. Marketplace listing with reviews/tips
 * 5. Token-based purchase/trade
 * 6. Reproducible deployment
 */

const express = require('express');
const WebSocket = require('ws');
const EventEmitter = require('events');
const { Client } = require('pg');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class ComponentMarketplace extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 9700,
            wsPort: options.wsPort || 9701,
            
            // Integration endpoints
            evaluationOrchestratorUrl: options.evaluationOrchestratorUrl || 'http://localhost:9200',
            agentEconomyForumUrl: options.agentEconomyForumUrl || 'http://localhost:8080',
            multiInstanceOrchestratorUrl: options.multiInstanceOrchestratorUrl || 'http://localhost:9000',
            packagingSystemUrl: options.packagingSystemUrl || 'http://localhost:9300',
            blameChainUrl: options.blameChainUrl || 'http://localhost:9600',
            
            // Marketplace configuration
            listingFee: options.listingFee || 10, // tokens to list a component
            transactionFee: options.transactionFee || 0.05, // 5% marketplace fee
            reviewReward: options.reviewReward || 5, // tokens for quality reviews
            tipReward: options.tipReward || 2, // tokens for helpful tips
            
            ...options
        };
        
        // PostgreSQL connection (shared with Agent Economy Forum)
        this.pgClient = new Client({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'document_generator',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password'
        });
        
        // Component tracking
        this.componentListings = new Map();
        this.activeTransactions = new Map();
        this.componentReviews = new Map();
        this.componentTips = new Map();
        
        // Lifecycle enforcement
        this.lifecycleStages = {
            'singleton': {
                requirements: ['isolated_code', 'unit_tests', 'documentation'],
                validators: ['technical_validation', 'code_quality_check']
            },
            'integration_testing': {
                requirements: ['multi_instance_test', 'cross_domain_validation'],
                validators: ['instance_compatibility', 'performance_metrics']
            },
            'agent_review': {
                requirements: ['technical_review', 'business_review', 'creative_review'],
                validators: ['consensus_score', 'karma_threshold']
            },
            'marketplace_ready': {
                requirements: ['packaging', 'pricing', 'documentation_complete'],
                validators: ['reproducibility_test', 'deployment_guide']
            }
        };
        
        // Integration connections
        this.integrations = {
            evaluationOrchestrator: null,
            agentEconomyForum: null,
            multiInstanceOrchestrator: null,
            packagingSystem: null,
            blameChain: null
        };
        
        // Express app
        this.app = express();
        this.app.use(express.json());
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.setupRoutes();
        this.setupWebSocket();
        
        console.log('🛍️ COMPONENT MARKETPLACE v1.0');
        console.log('=========================================');
        console.log('📊 Enforcing singleton → integration → reproducibility');
        console.log(`🌐 Marketplace API on port ${this.config.port}`);
        console.log(`🔌 WebSocket on port ${this.config.wsPort}`);
    }
    
    async initialize() {
        try {
            // Connect to PostgreSQL
            await this.pgClient.connect();
            console.log('✅ Connected to PostgreSQL database');
            
            // Initialize database schema
            await this.initializeDatabaseSchema();
            
            // Connect to integration services
            await this.connectToIntegrations();
            
            // Start servers
            this.server.listen(this.config.port, () => {
                console.log(`🛍️ Marketplace API listening on port ${this.config.port}`);
            });
            
            // Start monitoring
            this.startLifecycleMonitoring();
            
            console.log('✅ Component Marketplace ready!');
            
        } catch (error) {
            console.error('❌ Failed to initialize marketplace:', error.message);
            process.exit(1);
        }
    }
    
    async initializeDatabaseSchema() {
        // Create marketplace-specific tables
        const queries = [
            // Component listings table
            `CREATE TABLE IF NOT EXISTS component_listings (
                id SERIAL PRIMARY KEY,
                component_id VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                creator_id VARCHAR(255),
                creator_type VARCHAR(50) CHECK (creator_type IN ('user', 'agent')),
                price DECIMAL(10, 2) DEFAULT 0,
                currency VARCHAR(10) DEFAULT 'tokens',
                lifecycle_stage VARCHAR(50),
                evaluation_score DECIMAL(3, 2),
                karma_score INTEGER DEFAULT 0,
                downloads INTEGER DEFAULT 0,
                revenue_total DECIMAL(10, 2) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Component reviews table
            `CREATE TABLE IF NOT EXISTS component_reviews (
                id SERIAL PRIMARY KEY,
                component_id VARCHAR(255) REFERENCES component_listings(component_id),
                reviewer_id VARCHAR(255),
                reviewer_type VARCHAR(50) CHECK (reviewer_type IN ('user', 'agent')),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                review_category VARCHAR(50),
                helpful_votes INTEGER DEFAULT 0,
                karma_impact INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Component tips table
            `CREATE TABLE IF NOT EXISTS component_tips (
                id SERIAL PRIMARY KEY,
                component_id VARCHAR(255) REFERENCES component_listings(component_id),
                author_id VARCHAR(255),
                author_type VARCHAR(50) CHECK (author_type IN ('user', 'agent')),
                tip_text TEXT,
                tip_category VARCHAR(50),
                helpful_votes INTEGER DEFAULT 0,
                tokens_earned DECIMAL(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Component transactions table
            `CREATE TABLE IF NOT EXISTS component_transactions (
                id SERIAL PRIMARY KEY,
                transaction_id VARCHAR(255) UNIQUE NOT NULL,
                component_id VARCHAR(255) REFERENCES component_listings(component_id),
                buyer_id VARCHAR(255),
                buyer_type VARCHAR(50) CHECK (buyer_type IN ('user', 'agent')),
                seller_id VARCHAR(255),
                seller_type VARCHAR(50) CHECK (seller_type IN ('user', 'agent')),
                price DECIMAL(10, 2),
                marketplace_fee DECIMAL(10, 2),
                seller_revenue DECIMAL(10, 2),
                currency VARCHAR(10) DEFAULT 'tokens',
                status VARCHAR(50) DEFAULT 'pending',
                escrow_id VARCHAR(255),
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Component lifecycle tracking
            `CREATE TABLE IF NOT EXISTS component_lifecycle (
                id SERIAL PRIMARY KEY,
                component_id VARCHAR(255) REFERENCES component_listings(component_id),
                stage VARCHAR(50),
                status VARCHAR(50),
                validation_results JSONB DEFAULT '{}',
                test_results JSONB DEFAULT '{}',
                agent_reviews JSONB DEFAULT '{}',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Agent wallet transactions (extends existing economy)
            `CREATE TABLE IF NOT EXISTS wallet_transactions (
                id SERIAL PRIMARY KEY,
                transaction_id VARCHAR(255) UNIQUE NOT NULL,
                from_wallet VARCHAR(255),
                to_wallet VARCHAR(255),
                amount DECIMAL(10, 2),
                currency VARCHAR(10) DEFAULT 'tokens',
                transaction_type VARCHAR(50),
                reference_type VARCHAR(50),
                reference_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const query of queries) {
            await this.pgClient.query(query);
        }
        
        console.log('✅ Marketplace database schema initialized');
    }
    
    async connectToIntegrations() {
        console.log('🔌 Connecting to integration services...');
        
        // Test connections to each service
        const services = [
            { name: 'Evaluation Orchestrator', url: this.config.evaluationOrchestratorUrl },
            { name: 'Agent Economy Forum', url: this.config.agentEconomyForumUrl },
            { name: 'Multi-Instance Orchestrator', url: this.config.multiInstanceOrchestratorUrl },
            { name: 'BlameChain', url: this.config.blameChainUrl }
        ];
        
        for (const service of services) {
            try {
                const response = await fetch(`${service.url}/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                
                if (response.ok) {
                    console.log(`  ✅ ${service.name} - Connected`);
                    this.integrations[service.name.toLowerCase().replace(/ /g, '')] = service.url;
                } else {
                    console.log(`  ⚠️ ${service.name} - Not responding`);
                }
            } catch (error) {
                console.log(`  ⚠️ ${service.name} - ${error.message}`);
            }
        }
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'component-marketplace',
                uptime: process.uptime()
            });
        });
        
        // List all components
        this.app.get('/api/components', async (req, res) => {
            try {
                const { category, lifecycle_stage, min_karma, sort_by } = req.query;
                
                let query = `
                    SELECT cl.*, 
                           COUNT(DISTINCT cr.id) as review_count,
                           AVG(cr.rating) as avg_rating,
                           COUNT(DISTINCT ct.id) as tip_count
                    FROM component_listings cl
                    LEFT JOIN component_reviews cr ON cl.component_id = cr.component_id
                    LEFT JOIN component_tips ct ON cl.component_id = ct.component_id
                    WHERE cl.is_active = true
                `;
                
                const params = [];
                let paramIndex = 1;
                
                if (category) {
                    query += ` AND cl.category = $${paramIndex++}`;
                    params.push(category);
                }
                
                if (lifecycle_stage) {
                    query += ` AND cl.lifecycle_stage = $${paramIndex++}`;
                    params.push(lifecycle_stage);
                }
                
                if (min_karma) {
                    query += ` AND cl.karma_score >= $${paramIndex++}`;
                    params.push(parseInt(min_karma));
                }
                
                query += ` GROUP BY cl.id`;
                
                // Sorting
                switch (sort_by) {
                    case 'downloads':
                        query += ` ORDER BY cl.downloads DESC`;
                        break;
                    case 'rating':
                        query += ` ORDER BY avg_rating DESC NULLS LAST`;
                        break;
                    case 'karma':
                        query += ` ORDER BY cl.karma_score DESC`;
                        break;
                    case 'price':
                        query += ` ORDER BY cl.price ASC`;
                        break;
                    default:
                        query += ` ORDER BY cl.created_at DESC`;
                }
                
                const result = await this.pgClient.query(query, params);
                res.json(result.rows);
                
            } catch (error) {
                console.error('Error fetching components:', error);
                res.status(500).json({ error: 'Failed to fetch components' });
            }
        });
        
        // Submit component for evaluation
        this.app.post('/api/components/submit', async (req, res) => {
            try {
                const { component_code, metadata, creator_id, creator_type } = req.body;
                
                // Validate singleton requirements
                const validationResult = await this.validateSingletonRequirements({
                    code: component_code,
                    metadata
                });
                
                if (!validationResult.valid) {
                    return res.status(400).json({
                        error: 'Component does not meet singleton requirements',
                        issues: validationResult.issues
                    });
                }
                
                // Generate component ID
                const componentId = `comp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
                
                // Create initial listing
                await this.pgClient.query(`
                    INSERT INTO component_listings 
                    (component_id, name, description, category, creator_id, creator_type, lifecycle_stage)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    componentId,
                    metadata.name,
                    metadata.description,
                    metadata.category,
                    creator_id,
                    creator_type,
                    'singleton'
                ]);
                
                // Record lifecycle stage
                await this.recordLifecycleStage(componentId, 'singleton', validationResult);
                
                // Submit to evaluation orchestrator
                const evaluationResult = await this.submitToEvaluation(componentId, component_code, metadata);
                
                res.json({
                    success: true,
                    component_id: componentId,
                    lifecycle_stage: 'singleton',
                    next_step: 'evaluation',
                    evaluation_id: evaluationResult.evaluation_id
                });
                
            } catch (error) {
                console.error('Error submitting component:', error);
                res.status(500).json({ error: 'Failed to submit component' });
            }
        });
        
        // Get component details
        this.app.get('/api/components/:id', async (req, res) => {
            try {
                const { id } = req.params;
                
                // Get component details
                const componentResult = await this.pgClient.query(`
                    SELECT * FROM component_listings WHERE component_id = $1
                `, [id]);
                
                if (componentResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Component not found' });
                }
                
                const component = componentResult.rows[0];
                
                // Get reviews
                const reviewsResult = await this.pgClient.query(`
                    SELECT * FROM component_reviews 
                    WHERE component_id = $1 
                    ORDER BY created_at DESC
                    LIMIT 10
                `, [id]);
                
                // Get tips
                const tipsResult = await this.pgClient.query(`
                    SELECT * FROM component_tips
                    WHERE component_id = $1
                    ORDER BY helpful_votes DESC
                    LIMIT 10
                `, [id]);
                
                // Get lifecycle history
                const lifecycleResult = await this.pgClient.query(`
                    SELECT * FROM component_lifecycle
                    WHERE component_id = $1
                    ORDER BY timestamp ASC
                `, [id]);
                
                res.json({
                    ...component,
                    reviews: reviewsResult.rows,
                    tips: tipsResult.rows,
                    lifecycle_history: lifecycleResult.rows
                });
                
            } catch (error) {
                console.error('Error fetching component:', error);
                res.status(500).json({ error: 'Failed to fetch component' });
            }
        });
        
        // Purchase component
        this.app.post('/api/components/:id/purchase', async (req, res) => {
            try {
                const { id } = req.params;
                const { buyer_id, buyer_type, payment_method } = req.body;
                
                // Get component details
                const componentResult = await this.pgClient.query(`
                    SELECT * FROM component_listings WHERE component_id = $1
                `, [id]);
                
                if (componentResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Component not found' });
                }
                
                const component = componentResult.rows[0];
                
                // Check if component is marketplace ready
                if (component.lifecycle_stage !== 'marketplace_ready') {
                    return res.status(400).json({ 
                        error: 'Component not yet available for purchase',
                        current_stage: component.lifecycle_stage
                    });
                }
                
                // Create transaction
                const transactionId = `tx_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
                const marketplaceFee = component.price * this.config.transactionFee;
                const sellerRevenue = component.price - marketplaceFee;
                
                // Start transaction with escrow
                const escrowId = await this.createEscrowTransaction({
                    transaction_id: transactionId,
                    buyer_id,
                    seller_id: component.creator_id,
                    amount: component.price,
                    marketplace_fee: marketplaceFee
                });
                
                await this.pgClient.query(`
                    INSERT INTO component_transactions
                    (transaction_id, component_id, buyer_id, buyer_type, seller_id, seller_type,
                     price, marketplace_fee, seller_revenue, escrow_id, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    transactionId,
                    id,
                    buyer_id,
                    buyer_type,
                    component.creator_id,
                    component.creator_type,
                    component.price,
                    marketplaceFee,
                    sellerRevenue,
                    escrowId,
                    'escrow'
                ]);
                
                res.json({
                    transaction_id: transactionId,
                    escrow_id: escrowId,
                    status: 'escrow',
                    next_step: 'Complete payment to release component'
                });
                
            } catch (error) {
                console.error('Error purchasing component:', error);
                res.status(500).json({ error: 'Failed to process purchase' });
            }
        });
        
        // Submit review
        this.app.post('/api/components/:id/reviews', async (req, res) => {
            try {
                const { id } = req.params;
                const { reviewer_id, reviewer_type, rating, review_text, review_category } = req.body;
                
                // Validate reviewer has purchased or tested component
                const hasAccess = await this.validateReviewerAccess(id, reviewer_id);
                if (!hasAccess) {
                    return res.status(403).json({ 
                        error: 'You must purchase or test this component before reviewing' 
                    });
                }
                
                // Calculate karma impact
                const karmaImpact = this.calculateReviewKarmaImpact(rating, review_text);
                
                await this.pgClient.query(`
                    INSERT INTO component_reviews
                    (component_id, reviewer_id, reviewer_type, rating, review_text, 
                     review_category, karma_impact)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    id,
                    reviewer_id,
                    reviewer_type,
                    rating,
                    review_text,
                    review_category,
                    karmaImpact
                ]);
                
                // Award tokens for quality review
                if (review_text.length > 100) {
                    await this.awardTokens(reviewer_id, this.config.reviewReward, 'review_reward');
                }
                
                // Update component karma
                await this.updateComponentKarma(id);
                
                res.json({
                    success: true,
                    karma_impact: karmaImpact,
                    tokens_earned: review_text.length > 100 ? this.config.reviewReward : 0
                });
                
            } catch (error) {
                console.error('Error submitting review:', error);
                res.status(500).json({ error: 'Failed to submit review' });
            }
        });
        
        // Submit tip
        this.app.post('/api/components/:id/tips', async (req, res) => {
            try {
                const { id } = req.params;
                const { author_id, author_type, tip_text, tip_category } = req.body;
                
                await this.pgClient.query(`
                    INSERT INTO component_tips
                    (component_id, author_id, author_type, tip_text, tip_category)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    id,
                    author_id,
                    author_type,
                    tip_text,
                    tip_category
                ]);
                
                // Award tokens for tip
                await this.awardTokens(author_id, this.config.tipReward, 'tip_reward');
                
                res.json({
                    success: true,
                    tokens_earned: this.config.tipReward
                });
                
            } catch (error) {
                console.error('Error submitting tip:', error);
                res.status(500).json({ error: 'Failed to submit tip' });
            }
        });
        
        // Lifecycle progression endpoint
        this.app.post('/api/components/:id/advance-lifecycle', async (req, res) => {
            try {
                const { id } = req.params;
                const { force = false } = req.body;
                
                const advancement = await this.advanceLifecycleStage(id, force);
                
                if (!advancement.success) {
                    return res.status(400).json(advancement);
                }
                
                res.json(advancement);
                
            } catch (error) {
                console.error('Error advancing lifecycle:', error);
                res.status(500).json({ error: 'Failed to advance lifecycle' });
            }
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    switch (data.type) {
                        case 'subscribe_component':
                            this.subscribeToComponent(ws, data.component_id);
                            break;
                        case 'subscribe_lifecycle':
                            this.subscribeToLifecycle(ws, data.component_id);
                            break;
                        case 'subscribe_transactions':
                            this.subscribeToTransactions(ws, data.user_id);
                            break;
                    }
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
            });
        });
    }
    
    async validateSingletonRequirements(component) {
        const issues = [];
        
        // Check for isolated code
        if (!component.code || component.code.length < 100) {
            issues.push('Code must be at least 100 characters');
        }
        
        // Check for unit tests
        if (!component.metadata.tests || component.metadata.tests.length === 0) {
            issues.push('Unit tests are required');
        }
        
        // Check for documentation
        if (!component.metadata.documentation) {
            issues.push('Documentation is required');
        }
        
        // Check for no external dependencies (singleton)
        if (component.code.includes('require(') && !component.code.includes('require(\'path\')')) {
            issues.push('Singleton components should minimize external dependencies');
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }
    
    async submitToEvaluation(componentId, code, metadata) {
        try {
            const response = await fetch(`${this.config.evaluationOrchestratorUrl}/api/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component_id: componentId,
                    code,
                    metadata,
                    source: 'marketplace'
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to submit to evaluation:', error);
            return { evaluation_id: null, error: error.message };
        }
    }
    
    async recordLifecycleStage(componentId, stage, results) {
        await this.pgClient.query(`
            INSERT INTO component_lifecycle
            (component_id, stage, status, validation_results)
            VALUES ($1, $2, $3, $4)
        `, [
            componentId,
            stage,
            'completed',
            JSON.stringify(results)
        ]);
        
        // Update component listing
        await this.pgClient.query(`
            UPDATE component_listings
            SET lifecycle_stage = $1, updated_at = CURRENT_TIMESTAMP
            WHERE component_id = $2
        `, [stage, componentId]);
    }
    
    async advanceLifecycleStage(componentId, force = false) {
        // Get current stage
        const componentResult = await this.pgClient.query(`
            SELECT lifecycle_stage FROM component_listings WHERE component_id = $1
        `, [componentId]);
        
        if (componentResult.rows.length === 0) {
            return { success: false, error: 'Component not found' };
        }
        
        const currentStage = componentResult.rows[0].lifecycle_stage;
        const stageOrder = ['singleton', 'integration_testing', 'agent_review', 'marketplace_ready'];
        const currentIndex = stageOrder.indexOf(currentStage);
        
        if (currentIndex === -1) {
            return { success: false, error: 'Invalid current stage' };
        }
        
        if (currentIndex === stageOrder.length - 1) {
            return { success: false, error: 'Component already at final stage' };
        }
        
        const nextStage = stageOrder[currentIndex + 1];
        
        // Validate requirements for next stage
        if (!force) {
            const validation = await this.validateStageRequirements(componentId, nextStage);
            if (!validation.valid) {
                return {
                    success: false,
                    error: 'Stage requirements not met',
                    missing_requirements: validation.missing
                };
            }
        }
        
        // Advance to next stage
        await this.recordLifecycleStage(componentId, nextStage, { 
            advanced_from: currentStage,
            forced: force 
        });
        
        // Trigger stage-specific actions
        await this.triggerStageActions(componentId, nextStage);
        
        return {
            success: true,
            previous_stage: currentStage,
            new_stage: nextStage
        };
    }
    
    async validateStageRequirements(componentId, targetStage) {
        const requirements = this.lifecycleStages[targetStage].requirements;
        const missing = [];
        
        // Check each requirement based on stage
        switch (targetStage) {
            case 'integration_testing':
                // Check if evaluation passed
                const evalResult = await this.checkEvaluationStatus(componentId);
                if (!evalResult.passed) missing.push('evaluation_passed');
                break;
                
            case 'agent_review':
                // Check if multi-instance testing passed
                const testResult = await this.checkMultiInstanceTesting(componentId);
                if (!testResult.passed) missing.push('multi_instance_test_passed');
                break;
                
            case 'marketplace_ready':
                // Check if has minimum reviews and karma
                const reviewResult = await this.checkReviewRequirements(componentId);
                if (!reviewResult.met) missing.push('minimum_reviews');
                
                const karmaResult = await this.checkKarmaRequirements(componentId);
                if (!karmaResult.met) missing.push('karma_threshold');
                break;
        }
        
        return {
            valid: missing.length === 0,
            missing
        };
    }
    
    async triggerStageActions(componentId, stage) {
        switch (stage) {
            case 'integration_testing':
                // Submit to multi-instance orchestrator
                await this.submitToMultiInstanceTesting(componentId);
                break;
                
            case 'agent_review':
                // Assign to specialized agents for review
                await this.assignAgentReviewers(componentId);
                break;
                
            case 'marketplace_ready':
                // Package component and enable purchasing
                await this.packageComponent(componentId);
                await this.enablePurchasing(componentId);
                break;
        }
    }
    
    async createEscrowTransaction(details) {
        const escrowId = `escrow_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        
        // Create wallet transaction in pending state
        await this.pgClient.query(`
            INSERT INTO wallet_transactions
            (transaction_id, from_wallet, to_wallet, amount, transaction_type, 
             reference_type, reference_id, status, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            escrowId,
            details.buyer_id,
            'marketplace_escrow',
            details.amount,
            'escrow',
            'component_purchase',
            details.transaction_id,
            'pending',
            JSON.stringify(details)
        ]);
        
        return escrowId;
    }
    
    calculateReviewKarmaImpact(rating, reviewText) {
        let impact = 0;
        
        // Base impact from rating
        impact += (rating - 3) * 10; // -20 to +20
        
        // Bonus for detailed reviews
        if (reviewText.length > 200) impact += 5;
        if (reviewText.length > 500) impact += 10;
        
        return impact;
    }
    
    async updateComponentKarma(componentId) {
        // Calculate aggregate karma from reviews
        const result = await this.pgClient.query(`
            SELECT SUM(karma_impact) as total_karma
            FROM component_reviews
            WHERE component_id = $1
        `, [componentId]);
        
        const totalKarma = result.rows[0].total_karma || 0;
        
        await this.pgClient.query(`
            UPDATE component_listings
            SET karma_score = $1
            WHERE component_id = $2
        `, [totalKarma, componentId]);
    }
    
    async awardTokens(userId, amount, reason) {
        // Record token award transaction
        await this.pgClient.query(`
            INSERT INTO wallet_transactions
            (transaction_id, from_wallet, to_wallet, amount, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            `reward_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            'marketplace_rewards',
            userId,
            amount,
            reason,
            'completed'
        ]);
        
        // Update user balance (if using unified user system)
        await this.pgClient.query(`
            UPDATE unified_users
            SET wallet_balance = wallet_balance + $1
            WHERE username = $2
        `, [amount, userId]);
    }
    
    async validateReviewerAccess(componentId, reviewerId) {
        // Check if user purchased component
        const purchaseResult = await this.pgClient.query(`
            SELECT id FROM component_transactions
            WHERE component_id = $1 AND buyer_id = $2 AND status = 'completed'
        `, [componentId, reviewerId]);
        
        if (purchaseResult.rows.length > 0) return true;
        
        // Check if user participated in testing
        const testResult = await this.pgClient.query(`
            SELECT id FROM component_lifecycle
            WHERE component_id = $1 AND test_results::jsonb ? $2
        `, [componentId, reviewerId]);
        
        return testResult.rows.length > 0;
    }
    
    async submitToMultiInstanceTesting(componentId) {
        try {
            const response = await fetch(`${this.config.multiInstanceOrchestratorUrl}/api/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component_id: componentId,
                    test_type: 'full_compatibility',
                    instances: 'all'
                })
            });
            
            const result = await response.json();
            
            await this.recordLifecycleStage(componentId, 'integration_testing', {
                test_id: result.test_id,
                status: 'in_progress'
            });
            
        } catch (error) {
            console.error('Failed to submit to multi-instance testing:', error);
        }
    }
    
    async assignAgentReviewers(componentId) {
        // Get component details
        const componentResult = await this.pgClient.query(`
            SELECT category, metadata FROM component_listings WHERE component_id = $1
        `, [componentId]);
        
        const component = componentResult.rows[0];
        
        // Assign specialized agents based on category
        const specializations = {
            'technical': ['technical-primary', 'performance-optimized'],
            'business': ['commerce-primary', 'general-balanced'],
            'educational': ['education-primary', 'story-mode-specialized'],
            'research': ['research-primary', 'experimental-ai'],
            'creative': ['gaming-primary', 'story-mode-specialized']
        };
        
        const assignedAgents = specializations[component.category] || specializations.technical;
        
        // Notify agents through economy forum
        for (const agentType of assignedAgents) {
            await this.notifyAgentForReview(agentType, componentId);
        }
    }
    
    async packageComponent(componentId) {
        try {
            const response = await fetch(`${this.config.packagingSystemUrl}/api/package`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component_id: componentId,
                    include_docs: true,
                    create_symlinks: true
                })
            });
            
            const result = await response.json();
            
            await this.pgClient.query(`
                UPDATE component_listings
                SET metadata = metadata || $1
                WHERE component_id = $2
            `, [
                JSON.stringify({ package_path: result.package_path }),
                componentId
            ]);
            
        } catch (error) {
            console.error('Failed to package component:', error);
        }
    }
    
    async enablePurchasing(componentId) {
        await this.pgClient.query(`
            UPDATE component_listings
            SET is_active = true, updated_at = CURRENT_TIMESTAMP
            WHERE component_id = $1
        `, [componentId]);
        
        // Broadcast to WebSocket subscribers
        this.broadcast({
            type: 'component_available',
            component_id: componentId,
            message: 'Component is now available for purchase'
        });
    }
    
    startLifecycleMonitoring() {
        // Monitor components stuck in stages
        setInterval(async () => {
            try {
                // Find components stuck in stages for too long
                const stuckComponents = await this.pgClient.query(`
                    SELECT cl.component_id, cl.lifecycle_stage, 
                           MAX(clc.timestamp) as last_update
                    FROM component_listings cl
                    JOIN component_lifecycle clc ON cl.component_id = clc.component_id
                    WHERE cl.lifecycle_stage != 'marketplace_ready'
                    GROUP BY cl.component_id, cl.lifecycle_stage
                    HAVING MAX(clc.timestamp) < NOW() - INTERVAL '24 hours'
                `);
                
                for (const component of stuckComponents.rows) {
                    console.log(`⚠️ Component ${component.component_id} stuck in ${component.lifecycle_stage}`);
                    await this.attemptAutoAdvancement(component.component_id);
                }
                
            } catch (error) {
                console.error('Lifecycle monitoring error:', error);
            }
        }, 60000); // Check every minute
    }
    
    async attemptAutoAdvancement(componentId) {
        const advancement = await this.advanceLifecycleStage(componentId, false);
        if (advancement.success) {
            console.log(`✅ Auto-advanced ${componentId} to ${advancement.new_stage}`);
        }
    }
    
    broadcast(message) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    subscribeToComponent(ws, componentId) {
        // Add WebSocket to component subscribers
        if (!this.componentSubscribers) this.componentSubscribers = new Map();
        if (!this.componentSubscribers.has(componentId)) {
            this.componentSubscribers.set(componentId, new Set());
        }
        this.componentSubscribers.get(componentId).add(ws);
    }
    
    // Check methods for validation
    async checkEvaluationStatus(componentId) {
        const result = await this.pgClient.query(`
            SELECT validation_results FROM component_lifecycle
            WHERE component_id = $1 AND stage = 'singleton'
            ORDER BY timestamp DESC LIMIT 1
        `, [componentId]);
        
        if (result.rows.length === 0) return { passed: false };
        
        const validation = JSON.parse(result.rows[0].validation_results);
        return { passed: validation.valid === true };
    }
    
    async checkMultiInstanceTesting(componentId) {
        const result = await this.pgClient.query(`
            SELECT test_results FROM component_lifecycle
            WHERE component_id = $1 AND stage = 'integration_testing'
            ORDER BY timestamp DESC LIMIT 1
        `, [componentId]);
        
        if (result.rows.length === 0) return { passed: false };
        
        const tests = JSON.parse(result.rows[0].test_results);
        return { passed: tests.all_passed === true };
    }
    
    async checkReviewRequirements(componentId) {
        const result = await this.pgClient.query(`
            SELECT COUNT(*) as review_count FROM component_reviews
            WHERE component_id = $1
        `, [componentId]);
        
        return { met: result.rows[0].review_count >= 3 };
    }
    
    async checkKarmaRequirements(componentId) {
        const result = await this.pgClient.query(`
            SELECT karma_score FROM component_listings
            WHERE component_id = $1
        `, [componentId]);
        
        return { met: result.rows[0].karma_score >= 50 };
    }
    
    async notifyAgentForReview(agentType, componentId) {
        // Send notification through agent economy forum
        try {
            await fetch(`${this.config.agentEconomyForumUrl}/api/agent/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_type: agentType,
                    notification_type: 'review_request',
                    component_id: componentId,
                    reward: this.config.reviewReward
                })
            });
        } catch (error) {
            console.error('Failed to notify agent:', error);
        }
    }
}

// Initialize and start the marketplace
const marketplace = new ComponentMarketplace();
marketplace.initialize().catch(error => {
    console.error('Failed to start component marketplace:', error);
    process.exit(1);
});

// Export for testing and integration
module.exports = ComponentMarketplace;
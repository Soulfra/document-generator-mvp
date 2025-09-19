#!/usr/bin/env node

/**
 * ⚡🔗 IFTTT-STYLE AUTOMATION ENGINE
 * 
 * Universal automation system for crypto, airfare, e-commerce, and general price monitoring
 * Character-driven decision making with multi-platform notifications
 * If This Then That functionality with AI-enhanced triggers and actions
 */

const EventEmitter = require('events');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class IFTTTAutomationEngine extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 3340;
        this.db = null;
        
        // Configuration
        this.config = {
            checkInterval: 5 * 60 * 1000,    // 5 minutes default
            maxRulesPerUser: 50,             // Limit per user
            maxActionsPerRule: 10,           // Actions per automation
            retryAttempts: 3,                // Failed action retries
            cooldownPeriod: 10 * 60 * 1000,  // 10 minutes between same triggers
        };
        
        // State management
        this.activeRules = new Map();
        this.triggerHistory = new Map();
        this.scheduledJobs = new Map();
        this.connectedServices = new Map();
        
        // Service integrations
        this.services = {
            crypto: {
                name: 'Crypto Arbitrage Platform',
                url: 'http://localhost:3338',
                enabled: true
            },
            discord: {
                name: 'Discord Bot',
                url: 'http://localhost:6001', // Connect to character system for Discord integration
                enabled: true
            },
            telegram: {
                name: 'Telegram Bot', 
                url: 'http://localhost:6001', // Connect to character system for Telegram integration
                enabled: true
            },
            email: {
                name: 'Email Service',
                url: 'http://localhost:8001', // Connect to n8n bridge
                enabled: true
            },
            characters: {
                name: 'AI Character System',
                url: 'http://localhost:6001',
                enabled: true
            }
        };
        
        // Available trigger types
        this.triggerTypes = {
            crypto_arbitrage: {
                name: 'Crypto Arbitrage Opportunity',
                description: 'Triggers when arbitrage opportunity detected',
                params: ['crypto', 'min_profit_percentage', 'exchanges']
            },
            crypto_price: {
                name: 'Crypto Price Movement',
                description: 'Triggers on significant price changes',
                params: ['crypto', 'price_change_percentage', 'direction', 'timeframe']
            },
            airfare_price: {
                name: 'Airfare Price Drop',
                description: 'Triggers when flight prices drop',
                params: ['origin', 'destination', 'departure_date', 'max_price', 'price_drop_percentage']
            },
            ecommerce_price: {
                name: 'E-commerce Price Drop',
                description: 'Triggers when product prices drop',
                params: ['product_url', 'max_price', 'price_drop_percentage', 'store']
            },
            schedule: {
                name: 'Scheduled Time',
                description: 'Triggers at specific times/intervals',
                params: ['cron_expression', 'timezone']
            },
            webhook: {
                name: 'Webhook Trigger',
                description: 'Triggers when webhook receives data',
                params: ['webhook_url', 'http_method', 'expected_data']
            },
            rss_feed: {
                name: 'RSS Feed Update',
                description: 'Triggers when RSS feed has new items',
                params: ['feed_url', 'keywords', 'check_interval']
            },
            api_condition: {
                name: 'API Condition Met',
                description: 'Triggers when API returns specific data',
                params: ['api_url', 'condition', 'check_interval']
            }
        };
        
        // Available action types
        this.actionTypes = {
            discord_message: {
                name: 'Send Discord Message',
                description: 'Posts message to Discord channel',
                params: ['channel_id', 'message', 'embed', 'character_id']
            },
            telegram_message: {
                name: 'Send Telegram Message',
                description: 'Sends message via Telegram bot',
                params: ['chat_id', 'message', 'character_id']
            },
            email: {
                name: 'Send Email',
                description: 'Sends email notification',
                params: ['to_email', 'subject', 'body', 'template']
            },
            character_decision: {
                name: 'AI Character Decision',
                description: 'Let AI character decide what action to take',
                params: ['character_id', 'decision_context', 'available_actions']
            },
            place_bet: {
                name: 'Place Bet',
                description: 'Automatically place bet on prediction',
                params: ['bet_type', 'amount', 'confidence', 'character_id']
            },
            webhook: {
                name: 'Call Webhook',
                description: 'Makes HTTP request to external webhook',
                params: ['url', 'method', 'headers', 'body']
            },
            create_order: {
                name: 'Create Trading Order',
                description: 'Creates order in crypto trading platform',
                params: ['crypto', 'order_type', 'amount', 'price', 'character_id']
            },
            log_event: {
                name: 'Log Event',
                description: 'Logs event to database/file',
                params: ['log_level', 'message', 'metadata']
            }
        };
        
        console.log('⚡ IFTTT Automation Engine initializing...');
        this.init();
    }
    
    async init() {
        await this.setupDatabase();
        await this.loadActiveRules();
        this.setupExpressServer();
        this.startRuleEngine();
        await this.initializeServiceConnections();
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║           ⚡ IFTTT AUTOMATION ENGINE ACTIVE ⚡               ║
║                                                              ║
║  Universal automation for crypto, airfare, e-commerce       ║
║  Character-driven decisions with multi-platform actions     ║
║                                                              ║
║  🔧 Available Triggers: ${Object.keys(this.triggerTypes).length.toString().padStart(8)}                      ║
║  ⚡ Available Actions: ${Object.keys(this.actionTypes).length.toString().padStart(9)}                      ║
║  🤖 Active Rules: ${this.activeRules.size.toString().padStart(13)}                      ║
║  🌐 Connected Services: ${this.connectedServices.size.toString().padStart(7)}                      ║
║                                                              ║
║  API: http://localhost:${this.port}                          ║
║  Dashboard: http://localhost:${this.port}/dashboard         ║
╚══════════════════════════════════════════════════════════════╝`);
    }
    
    async setupDatabase() {
        const dbPath = path.join(__dirname, 'data', 'ifttt-automation.db');
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        
        this.db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        // Automation rules table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS automation_rules (
                rule_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                rule_name TEXT NOT NULL,
                description TEXT,
                trigger_type TEXT NOT NULL,
                trigger_config TEXT NOT NULL,
                actions TEXT NOT NULL,
                conditions TEXT,
                enabled BOOLEAN DEFAULT TRUE,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                last_triggered INTEGER,
                trigger_count INTEGER DEFAULT 0
            )
        `);
        
        // Rule execution logs
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS execution_logs (
                log_id TEXT PRIMARY KEY,
                rule_id TEXT NOT NULL,
                trigger_data TEXT,
                actions_executed TEXT,
                success BOOLEAN,
                error_message TEXT,
                execution_time_ms INTEGER,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (rule_id) REFERENCES automation_rules (rule_id)
            )
        `);
        
        // Service configurations
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS service_configs (
                service_name TEXT PRIMARY KEY,
                config_data TEXT NOT NULL,
                api_keys TEXT,
                enabled BOOLEAN DEFAULT TRUE,
                last_health_check INTEGER,
                health_status TEXT DEFAULT 'unknown'
            )
        `);
        
        // Price monitoring data
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS price_monitoring (
                monitor_id TEXT PRIMARY KEY,
                item_type TEXT NOT NULL,
                item_identifier TEXT NOT NULL,
                current_price REAL,
                previous_price REAL,
                lowest_price REAL,
                highest_price REAL,
                price_history TEXT,
                last_updated INTEGER NOT NULL,
                metadata TEXT
            )
        `);
        
        // Airfare monitoring 
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS airfare_monitoring (
                flight_id TEXT PRIMARY KEY,
                origin TEXT NOT NULL,
                destination TEXT NOT NULL,
                departure_date TEXT NOT NULL,
                return_date TEXT,
                current_price REAL,
                lowest_price REAL,
                price_history TEXT,
                airline TEXT,
                flight_number TEXT,
                last_updated INTEGER NOT NULL
            )
        `);
        
        // Trigger cooldowns
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS trigger_cooldowns (
                cooldown_id TEXT PRIMARY KEY,
                rule_id TEXT NOT NULL,
                trigger_key TEXT NOT NULL,
                last_triggered INTEGER NOT NULL,
                cooldown_until INTEGER NOT NULL,
                FOREIGN KEY (rule_id) REFERENCES automation_rules (rule_id)
            )
        `);
        
        // Create indexes
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_rules_user ON automation_rules (user_id);
            CREATE INDEX IF NOT EXISTS idx_rules_enabled ON automation_rules (enabled);
            CREATE INDEX IF NOT EXISTS idx_logs_rule ON execution_logs (rule_id);
            CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON execution_logs (timestamp);
            CREATE INDEX IF NOT EXISTS idx_cooldowns_rule ON trigger_cooldowns (rule_id);
        `);
        
        console.log('🗄️ IFTTT automation database initialized');
    }
    
    async loadActiveRules() {
        const rules = await this.db.all(`
            SELECT * FROM automation_rules WHERE enabled = TRUE
        `);
        
        for (const rule of rules) {
            const ruleObj = {
                ...rule,
                trigger_config: JSON.parse(rule.trigger_config),
                actions: JSON.parse(rule.actions),
                conditions: rule.conditions ? JSON.parse(rule.conditions) : null
            };
            
            this.activeRules.set(rule.rule_id, ruleObj);
            
            // Set up scheduled triggers if needed
            if (rule.trigger_type === 'schedule') {
                this.setupScheduledTrigger(ruleObj);
            }
        }
        
        console.log(`📋 Loaded ${rules.length} active automation rules`);
    }
    
    setupExpressServer() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
        
        this.setupAPIRoutes();
        
        this.app.listen(this.port, () => {
            console.log(`🌐 IFTTT Automation API running on http://localhost:${this.port}`);
        });
    }
    
    setupAPIRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                activeRules: this.activeRules.size,
                connectedServices: this.connectedServices.size,
                triggerTypes: Object.keys(this.triggerTypes).length,
                actionTypes: Object.keys(this.actionTypes).length,
                timestamp: new Date().toISOString()
            });
        });
        
        // Get available triggers and actions
        this.app.get('/api/capabilities', (req, res) => {
            res.json({
                triggers: this.triggerTypes,
                actions: this.actionTypes,
                services: this.services
            });
        });
        
        // Create automation rule
        this.app.post('/api/rules', async (req, res) => {
            try {
                const rule = await this.createRule(req.body);
                res.json(rule);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get user rules
        this.app.get('/api/rules', async (req, res) => {
            try {
                const { user_id } = req.query;
                const rules = await this.getUserRules(user_id);
                res.json(rules);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Update rule
        this.app.put('/api/rules/:ruleId', async (req, res) => {
            try {
                const { ruleId } = req.params;
                const rule = await this.updateRule(ruleId, req.body);
                res.json(rule);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Delete rule
        this.app.delete('/api/rules/:ruleId', async (req, res) => {
            try {
                const { ruleId } = req.params;
                await this.deleteRule(ruleId);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Test rule
        this.app.post('/api/rules/:ruleId/test', async (req, res) => {
            try {
                const { ruleId } = req.params;
                const result = await this.testRule(ruleId, req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get execution logs
        this.app.get('/api/logs', async (req, res) => {
            try {
                const { rule_id, limit = 100, offset = 0 } = req.query;
                const logs = await this.getExecutionLogs(rule_id, parseInt(limit), parseInt(offset));
                res.json(logs);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Webhook endpoints for external triggers
        this.app.post('/api/webhook/:ruleId', async (req, res) => {
            try {
                const { ruleId } = req.params;
                const result = await this.handleWebhookTrigger(ruleId, req.body, req.headers);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Manual trigger endpoint
        this.app.post('/api/trigger/:ruleId', async (req, res) => {
            try {
                const { ruleId } = req.params;
                const result = await this.manualTrigger(ruleId, req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Price monitoring
        this.app.get('/api/monitoring/prices', async (req, res) => {
            try {
                const { type, identifier } = req.query;
                const prices = await this.getPriceHistory(type, identifier);
                res.json(prices);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Service status
        this.app.get('/api/services/status', async (req, res) => {
            try {
                const status = await this.getServiceStatuses();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Dashboard
        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'ifttt-dashboard.html'));
        });
        
        // Rule builder
        this.app.get('/builder', (req, res) => {
            res.sendFile(path.join(__dirname, 'ifttt-rule-builder.html'));
        });
    }
    
    async createRule(ruleData) {
        const {
            user_id,
            rule_name,
            description,
            trigger_type,
            trigger_config,
            actions,
            conditions
        } = ruleData;
        
        // Validate inputs
        if (!this.triggerTypes[trigger_type]) {
            throw new Error(`Invalid trigger type: ${trigger_type}`);
        }
        
        for (const action of actions) {
            if (!this.actionTypes[action.type]) {
                throw new Error(`Invalid action type: ${action.type}`);
            }
        }
        
        // Check user rule limit
        const userRuleCount = await this.db.get(`
            SELECT COUNT(*) as count FROM automation_rules WHERE user_id = ?
        `, [user_id]);
        
        if (userRuleCount.count >= this.config.maxRulesPerUser) {
            throw new Error(`Maximum rules per user exceeded: ${this.config.maxRulesPerUser}`);
        }
        
        const ruleId = this.generateRuleId();
        const now = Date.now();
        
        const rule = {
            rule_id: ruleId,
            user_id,
            rule_name,
            description: description || '',
            trigger_type,
            trigger_config,
            actions,
            conditions,
            enabled: true,
            created_at: now,
            updated_at: now,
            last_triggered: null,
            trigger_count: 0
        };
        
        // Store in database
        await this.db.run(`
            INSERT INTO automation_rules 
            (rule_id, user_id, rule_name, description, trigger_type, trigger_config, actions, conditions, enabled, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            ruleId, user_id, rule_name, description, trigger_type,
            JSON.stringify(trigger_config), JSON.stringify(actions), 
            conditions ? JSON.stringify(conditions) : null, true, now, now
        ]);
        
        // Add to active rules
        this.activeRules.set(ruleId, rule);
        
        // Set up trigger if needed
        if (trigger_type === 'schedule') {
            this.setupScheduledTrigger(rule);
        } else if (trigger_type === 'airfare_price' || trigger_type === 'ecommerce_price') {
            this.setupPriceMonitoring(rule);
        }
        
        console.log(`📋 Created automation rule: ${rule_name} (${ruleId})`);
        
        return rule;
    }
    
    setupScheduledTrigger(rule) {
        const { cron_expression } = rule.trigger_config;
        
        if (!cron.validate(cron_expression)) {
            console.error(`Invalid cron expression for rule ${rule.rule_id}: ${cron_expression}`);
            return;
        }
        
        const job = cron.schedule(cron_expression, async () => {
            await this.executeRule(rule.rule_id, {
                trigger_type: 'schedule',
                timestamp: Date.now(),
                cron_expression
            });
        }, {
            scheduled: true,
            timezone: rule.trigger_config.timezone || 'America/New_York'
        });
        
        this.scheduledJobs.set(rule.rule_id, job);
        
        console.log(`⏰ Scheduled trigger set up for rule ${rule.rule_id}: ${cron_expression}`);
    }
    
    async setupPriceMonitoring(rule) {
        // Add to price monitoring system
        if (rule.trigger_type === 'airfare_price') {
            const { origin, destination, departure_date } = rule.trigger_config;
            const flightId = `${origin}-${destination}-${departure_date}`;
            
            await this.db.run(`
                INSERT OR REPLACE INTO airfare_monitoring
                (flight_id, origin, destination, departure_date, last_updated)
                VALUES (?, ?, ?, ?, ?)
            `, [flightId, origin, destination, departure_date, Date.now()]);
            
        } else if (rule.trigger_type === 'ecommerce_price') {
            const { product_url, store } = rule.trigger_config;
            const monitorId = Buffer.from(product_url).toString('base64').substr(0, 32);
            
            await this.db.run(`
                INSERT OR REPLACE INTO price_monitoring
                (monitor_id, item_type, item_identifier, last_updated, metadata)
                VALUES (?, ?, ?, ?, ?)
            `, [monitorId, 'ecommerce', product_url, Date.now(), JSON.stringify({ store })]);
        }
    }
    
    startRuleEngine() {
        // Check all rules periodically
        setInterval(async () => {
            await this.checkAllTriggers();
        }, this.config.checkInterval);
        
        // Check price-based triggers more frequently
        setInterval(async () => {
            await this.checkPriceTriggers();
        }, 2 * 60 * 1000); // Every 2 minutes
        
        console.log('🔧 Rule engine started');
    }
    
    async checkAllTriggers() {
        for (const [ruleId, rule] of this.activeRules) {
            if (!rule.enabled) continue;
            
            try {
                await this.checkRuleTrigger(rule);
            } catch (error) {
                console.error(`Error checking rule ${ruleId}:`, error);
            }
        }
    }
    
    async checkRuleTrigger(rule) {
        switch (rule.trigger_type) {
            case 'crypto_arbitrage':
                await this.checkCryptoArbitrageTrigger(rule);
                break;
            case 'crypto_price':
                await this.checkCryptoPriceTrigger(rule);
                break;
            case 'api_condition':
                await this.checkAPIConditionTrigger(rule);
                break;
            case 'rss_feed':
                await this.checkRSSFeedTrigger(rule);
                break;
        }
    }
    
    async checkCryptoArbitrageTrigger(rule) {
        const { crypto, min_profit_percentage, exchanges } = rule.trigger_config;
        
        try {
            const response = await axios.get(`${this.services.crypto.url}/api/arbitrage`, {
                params: { crypto, minProfit: min_profit_percentage }
            });
            
            const opportunities = response.data;
            
            for (const opp of opportunities) {
                // Check if we've already triggered for this opportunity recently
                const triggerKey = `arbitrage-${opp.crypto_symbol}-${opp.source_exchange}-${opp.target_exchange}`;
                
                if (await this.isInCooldown(rule.rule_id, triggerKey)) {
                    continue;
                }
                
                // Check exchange filter if specified
                if (exchanges && exchanges.length > 0) {
                    if (!exchanges.includes(opp.source_exchange) || !exchanges.includes(opp.target_exchange)) {
                        continue;
                    }
                }
                
                await this.executeRule(rule.rule_id, {
                    trigger_type: 'crypto_arbitrage',
                    opportunity: opp,
                    timestamp: Date.now()
                });
                
                await this.setCooldown(rule.rule_id, triggerKey);
            }
            
        } catch (error) {
            console.error(`Error checking crypto arbitrage for rule ${rule.rule_id}:`, error.message);
        }
    }
    
    async checkPriceTriggers() {
        // Check airfare prices
        await this.checkAirfarePrices();
        
        // Check e-commerce prices
        await this.checkEcommercePrices();
    }
    
    async checkAirfarePrices() {
        const flights = await this.db.all(`
            SELECT * FROM airfare_monitoring 
            WHERE last_updated < ?
        `, [Date.now() - 30 * 60 * 1000]); // Update every 30 minutes
        
        for (const flight of flights) {
            try {
                // This would integrate with actual flight APIs (Skyscanner, Google Flights, etc.)
                // For now, simulate price checking
                const newPrice = await this.simulateAirfarePrice(flight);
                
                if (newPrice && newPrice !== flight.current_price) {
                    await this.updateAirfarePrice(flight, newPrice);
                    await this.checkAirfarePriceRules(flight, newPrice);
                }
                
            } catch (error) {
                console.error(`Error checking airfare for ${flight.flight_id}:`, error.message);
            }
        }
    }
    
    async simulateAirfarePrice(flight) {
        // Simulate realistic flight price fluctuations
        const basePrice = flight.current_price || (Math.random() * 800 + 200); // $200-$1000
        const volatility = 0.1; // 10% daily volatility
        const change = (Math.random() - 0.5) * 2 * volatility;
        
        return Math.round(basePrice * (1 + change));
    }
    
    async updateAirfarePrice(flight, newPrice) {
        const priceHistory = flight.price_history ? JSON.parse(flight.price_history) : [];
        priceHistory.push({
            price: newPrice,
            timestamp: Date.now()
        });
        
        // Keep only last 100 price points
        if (priceHistory.length > 100) {
            priceHistory.shift();
        }
        
        const lowestPrice = Math.min(flight.lowest_price || newPrice, newPrice);
        
        await this.db.run(`
            UPDATE airfare_monitoring 
            SET current_price = ?, previous_price = ?, lowest_price = ?, 
                price_history = ?, last_updated = ?
            WHERE flight_id = ?
        `, [
            newPrice, flight.current_price, lowestPrice,
            JSON.stringify(priceHistory), Date.now(), flight.flight_id
        ]);
    }
    
    async checkAirfarePriceRules(flight, newPrice) {
        const rules = Array.from(this.activeRules.values()).filter(rule => 
            rule.trigger_type === 'airfare_price' && rule.enabled
        );
        
        for (const rule of rules) {
            const { origin, destination, departure_date, max_price, price_drop_percentage } = rule.trigger_config;
            
            // Check if this rule applies to this flight
            if (flight.origin !== origin || flight.destination !== destination || 
                flight.departure_date !== departure_date) {
                continue;
            }
            
            let shouldTrigger = false;
            let triggerReason = '';
            
            // Check max price threshold
            if (max_price && newPrice <= max_price) {
                shouldTrigger = true;
                triggerReason = `Price dropped to $${newPrice} (below $${max_price} threshold)`;
            }
            
            // Check price drop percentage
            if (price_drop_percentage && flight.current_price) {
                const dropPercentage = ((flight.current_price - newPrice) / flight.current_price) * 100;
                if (dropPercentage >= price_drop_percentage) {
                    shouldTrigger = true;
                    triggerReason = `Price dropped ${dropPercentage.toFixed(1)}% (${price_drop_percentage}% threshold)`;
                }
            }
            
            if (shouldTrigger) {
                const triggerKey = `airfare-${flight.flight_id}`;
                
                if (await this.isInCooldown(rule.rule_id, triggerKey)) {
                    continue;
                }
                
                await this.executeRule(rule.rule_id, {
                    trigger_type: 'airfare_price',
                    flight: flight,
                    old_price: flight.current_price,
                    new_price: newPrice,
                    reason: triggerReason,
                    timestamp: Date.now()
                });
                
                await this.setCooldown(rule.rule_id, triggerKey);
            }
        }
    }
    
    async executeRule(ruleId, triggerData) {
        const rule = this.activeRules.get(ruleId);
        if (!rule || !rule.enabled) {
            return;
        }
        
        console.log(`⚡ Executing rule: ${rule.rule_name} (${ruleId})`);
        
        const startTime = Date.now();
        let success = true;
        let errorMessage = null;
        const executedActions = [];
        
        try {
            // Check conditions if any
            if (rule.conditions && !await this.evaluateConditions(rule.conditions, triggerData)) {
                console.log(`❌ Rule conditions not met for ${ruleId}`);
                return;
            }
            
            // Execute all actions
            for (const action of rule.actions) {
                try {
                    const result = await this.executeAction(action, triggerData, rule);
                    executedActions.push({
                        action: action.type,
                        success: true,
                        result
                    });
                    
                    console.log(`✅ Action executed: ${action.type}`);
                } catch (actionError) {
                    executedActions.push({
                        action: action.type,
                        success: false,
                        error: actionError.message
                    });
                    
                    console.error(`❌ Action failed: ${action.type} - ${actionError.message}`);
                }
            }
            
            // Update rule statistics
            await this.db.run(`
                UPDATE automation_rules 
                SET last_triggered = ?, trigger_count = trigger_count + 1
                WHERE rule_id = ?
            `, [Date.now(), ruleId]);
            
        } catch (error) {
            success = false;
            errorMessage = error.message;
            console.error(`❌ Rule execution failed for ${ruleId}:`, error);
        }
        
        // Log execution
        const executionTime = Date.now() - startTime;
        await this.logExecution(ruleId, triggerData, executedActions, success, errorMessage, executionTime);
        
        this.emit('ruleExecuted', {
            ruleId,
            ruleName: rule.rule_name,
            triggerData,
            executedActions,
            success,
            executionTime
        });
    }
    
    async executeAction(action, triggerData, rule) {
        switch (action.type) {
            case 'discord_message':
                return await this.executeDiscordMessage(action, triggerData, rule);
            case 'telegram_message':
                return await this.executeTelegramMessage(action, triggerData, rule);
            case 'email':
                return await this.executeEmail(action, triggerData, rule);
            case 'character_decision':
                return await this.executeCharacterDecision(action, triggerData, rule);
            case 'place_bet':
                return await this.executePlaceBet(action, triggerData, rule);
            case 'webhook':
                return await this.executeWebhook(action, triggerData, rule);
            case 'create_order':
                return await this.executeCreateOrder(action, triggerData, rule);
            case 'log_event':
                return await this.executeLogEvent(action, triggerData, rule);
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
    
    async executeDiscordMessage(action, triggerData, rule) {
        // This would integrate with the Discord bot
        const message = this.replaceVariables(action.params.message, triggerData);
        
        console.log(`📢 Discord message would be sent: ${message}`);
        
        return {
            platform: 'discord',
            channel: action.params.channel_id,
            message,
            timestamp: Date.now()
        };
    }
    
    async executeTelegramMessage(action, triggerData, rule) {
        // This would integrate with the Telegram bot
        const message = this.replaceVariables(action.params.message, triggerData);
        
        console.log(`📱 Telegram message would be sent: ${message}`);
        
        return {
            platform: 'telegram',
            chat_id: action.params.chat_id,
            message,
            timestamp: Date.now()
        };
    }
    
    async executeEmail(action, triggerData, rule) {
        const subject = this.replaceVariables(action.params.subject, triggerData);
        const body = this.replaceVariables(action.params.body, triggerData);
        
        // Integrate with n8n email system
        try {
            await axios.post(`${this.services.email.url}/api/email/send`, {
                to: action.params.to_email,
                subject,
                body,
                template: action.params.template
            });
            
            return {
                platform: 'email',
                to: action.params.to_email,
                subject,
                sent: true
            };
        } catch (error) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
    
    async executeCharacterDecision(action, triggerData, rule) {
        // Get AI character to decide what to do
        const characterId = action.params.character_id;
        
        try {
            const response = await axios.post(`${this.services.characters.url}/api/character/${characterId}/interact`, {
                interaction_type: 'decision',
                message: JSON.stringify({
                    context: action.params.decision_context,
                    trigger_data: triggerData,
                    available_actions: action.params.available_actions
                }),
                customer_id: rule.user_id
            });
            
            return {
                character_id: characterId,
                decision: response.data.interaction.response,
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error(`Character decision failed: ${error.message}`);
        }
    }
    
    replaceVariables(template, data) {
        let result = template;
        
        // Replace common variables
        result = result.replace(/\{\{timestamp\}\}/g, new Date().toISOString());
        result = result.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
        result = result.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());
        
        // Replace trigger-specific variables
        if (data.opportunity) {
            result = result.replace(/\{\{crypto\}\}/g, data.opportunity.crypto);
            result = result.replace(/\{\{profit\}\}/g, data.opportunity.profitPercentage?.toFixed(2));
            result = result.replace(/\{\{source_exchange\}\}/g, data.opportunity.sourceExchange);
            result = result.replace(/\{\{target_exchange\}\}/g, data.opportunity.targetExchange);
        }
        
        if (data.flight) {
            result = result.replace(/\{\{origin\}\}/g, data.flight.origin);
            result = result.replace(/\{\{destination\}\}/g, data.flight.destination);
            result = result.replace(/\{\{price\}\}/g, data.new_price);
            result = result.replace(/\{\{old_price\}\}/g, data.old_price);
        }
        
        return result;
    }
    
    async isInCooldown(ruleId, triggerKey) {
        const cooldown = await this.db.get(`
            SELECT * FROM trigger_cooldowns 
            WHERE rule_id = ? AND trigger_key = ? AND cooldown_until > ?
        `, [ruleId, triggerKey, Date.now()]);
        
        return !!cooldown;
    }
    
    async setCooldown(ruleId, triggerKey) {
        const cooldownUntil = Date.now() + this.config.cooldownPeriod;
        const cooldownId = `${ruleId}-${triggerKey}`;
        
        await this.db.run(`
            INSERT OR REPLACE INTO trigger_cooldowns
            (cooldown_id, rule_id, trigger_key, last_triggered, cooldown_until)
            VALUES (?, ?, ?, ?, ?)
        `, [cooldownId, ruleId, triggerKey, Date.now(), cooldownUntil]);
    }
    
    async logExecution(ruleId, triggerData, executedActions, success, errorMessage, executionTime) {
        const logId = this.generateLogId();
        
        await this.db.run(`
            INSERT INTO execution_logs
            (log_id, rule_id, trigger_data, actions_executed, success, error_message, execution_time_ms, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            logId, ruleId, JSON.stringify(triggerData), JSON.stringify(executedActions),
            success, errorMessage, executionTime, Date.now()
        ]);
    }
    
    async initializeServiceConnections() {
        for (const [serviceName, service] of Object.entries(this.services)) {
            if (!service.enabled) continue;
            
            try {
                const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
                this.connectedServices.set(serviceName, {
                    ...service,
                    status: 'connected',
                    lastCheck: Date.now(),
                    healthData: response.data
                });
                
                console.log(`✅ Connected to ${service.name}`);
            } catch (error) {
                console.warn(`⚠️  Could not connect to ${service.name}: ${error.message}`);
                this.connectedServices.set(serviceName, {
                    ...service,
                    status: 'disconnected',
                    lastCheck: Date.now(),
                    error: error.message
                });
            }
        }
    }
    
    generateRuleId() {
        return 'rule_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    generateLogId() {
        return 'log_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use as module
module.exports = IFTTTAutomationEngine;

// Run if called directly
if (require.main === module) {
    const engine = new IFTTTAutomationEngine();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down IFTTT Automation Engine...');
        process.exit(0);
    });
}
#!/usr/bin/env node

// 🌊🎯 DEEP TIER API ROUTER
// Maps ultra-deep tiers (51, 108, 153+) to external APIs like RuneScape
// The deeper you go, the more external systems you can access

const express = require('express');
const crypto = require('crypto');

class DeepTierApiRouter {
    constructor() {
        this.app = express();
        this.port = 9200;
        
        // Deep tier thresholds and their API access levels
        this.deepTierMap = {
            // Standard tiers 1-50: Internal systems only
            standard: { min: 1, max: 50, apis: ['internal'] },
            
            // Deep tier 51-107: External game APIs
            deep_games: { 
                min: 51, 
                max: 107, 
                apis: ['runescape', 'osrs', 'wow', 'd2jsp', 'steam'] 
            },
            
            // Ultra tier 108-152: Financial and trading APIs
            ultra_financial: { 
                min: 108, 
                max: 152, 
                apis: ['coinbase', 'binance', 'kraken', 'tradingview', 'yahoo_finance'] 
            },
            
            // Hyper tier 153-200: Enterprise and AI APIs
            hyper_enterprise: { 
                min: 153, 
                max: 200, 
                apis: ['anthropic', 'openai', 'aws', 'google_cloud', 'azure'] 
            },
            
            // Transcendent tier 201+: Everything unlocked
            transcendent: { 
                min: 201, 
                max: Infinity, 
                apis: ['*'] // All APIs available
            }
        };
        
        // API configurations for each tier level
        this.apiConfigs = {
            // Tier 51+ Game APIs
            runescape: {
                baseUrl: 'https://secure.runescape.com/m=hiscore',
                tier_required: 51,
                endpoints: {
                    player_stats: '/index_lite.ws?player={username}',
                    clan_members: '/group.ws?group={clan_name}',
                    competitions: '/competition.ws'
                },
                auth_type: 'api_key',
                rate_limit: { requests: 100, per: 'hour' }
            },
            
            osrs: {
                baseUrl: 'https://secure.runescape.com/m=hiscore_oldschool',
                tier_required: 52,
                endpoints: {
                    player_stats: '/index_lite.ws?player={username}',
                    ironman_stats: '/index_lite.ws?player={username}&m=ironman',
                    hardcore_stats: '/index_lite.ws?player={username}&m=hardcore_ironman'
                },
                auth_type: 'none',
                rate_limit: { requests: 60, per: 'minute' }
            },
            
            d2jsp: {
                baseUrl: 'https://forums.d2jsp.org/api',
                tier_required: 55,
                endpoints: {
                    ladder_stats: '/ladder/{realm}/{ladder_type}',
                    trade_listings: '/trade/search',
                    forum_gold: '/user/{user_id}/gold'
                },
                auth_type: 'session',
                rate_limit: { requests: 30, per: 'minute' }
            },
            
            // Tier 108+ Financial APIs
            coinbase: {
                baseUrl: 'https://api.coinbase.com/v2',
                tier_required: 108,
                endpoints: {
                    spot_prices: '/exchange-rates',
                    accounts: '/accounts',
                    transactions: '/accounts/{id}/transactions'
                },
                auth_type: 'oauth2',
                rate_limit: { requests: 10000, per: 'hour' }
            },
            
            tradingview: {
                baseUrl: 'https://scanner.tradingview.com',
                tier_required: 110,
                endpoints: {
                    crypto_screener: '/crypto/scan',
                    stock_screener: '/america/scan',
                    technical_analysis: '/symbol/{symbol}/analysis'
                },
                auth_type: 'api_key',
                rate_limit: { requests: 500, per: 'hour' }
            },
            
            // Tier 153+ Enterprise APIs
            anthropic: {
                baseUrl: 'https://api.anthropic.com/v1',
                tier_required: 153,
                endpoints: {
                    messages: '/messages',
                    completions: '/complete'
                },
                auth_type: 'bearer',
                rate_limit: { requests: 1000, per: 'minute' }
            },
            
            openai: {
                baseUrl: 'https://api.openai.com/v1',
                tier_required: 155,
                endpoints: {
                    chat_completions: '/chat/completions',
                    embeddings: '/embeddings',
                    fine_tuning: '/fine_tuning/jobs'
                },
                auth_type: 'bearer',
                rate_limit: { requests: 3000, per: 'minute' }
            },
            
            aws: {
                baseUrl: 'https://aws.amazon.com',
                tier_required: 160,
                endpoints: {
                    ec2: '/ec2',
                    s3: '/s3',
                    lambda: '/lambda',
                    rds: '/rds'
                },
                auth_type: 'aws_signature',
                rate_limit: { requests: 100000, per: 'hour' }
            }
        };
        
        // Track user tier levels
        this.userTiers = new Map();
        
        // API call tracking
        this.apiCalls = new Map();
        
        console.log('🌊🎯 Deep Tier API Router initialized');
        console.log('🔓 Tier-based API access system ready');
    }
    
    // Calculate user's current tier based on various factors
    calculateUserTier(userId, metrics = {}) {
        let baseTier = 1;
        
        // Add tier points for different achievements
        if (metrics.systemsBuilt) baseTier += metrics.systemsBuilt * 2;
        if (metrics.apisIntegrated) baseTier += metrics.apisIntegrated * 5;
        if (metrics.yearsExperience) baseTier += metrics.yearsExperience * 3;
        if (metrics.projectsDeployed) baseTier += metrics.projectsDeployed * 4;
        if (metrics.codeCommits) baseTier += Math.floor(metrics.codeCommits / 100);
        
        // Special tier bonuses
        if (metrics.hasBuiltBlockchain) baseTier += 25;
        if (metrics.hasBuiltAI) baseTier += 30;
        if (metrics.hasBuiltGame) baseTier += 20;
        if (metrics.hasRevenueGeneration) baseTier += 40;
        
        // Ultra bonuses for extreme achievements
        if (metrics.hasExitedCompany) baseTier += 100;
        if (metrics.isYCombinatorAlum) baseTier += 75;
        if (metrics.hasPublishedPapers) baseTier += metrics.hasPublishedPapers * 15;
        
        this.userTiers.set(userId, {
            tier: baseTier,
            calculated: Date.now(),
            metrics,
            apiAccess: this.getApiAccessForTier(baseTier)
        });
        
        return baseTier;
    }
    
    // Get available APIs for a given tier
    getApiAccessForTier(tier) {
        const access = {
            tier,
            availableApis: [],
            tierCategory: 'standard'
        };
        
        // Determine tier category and available APIs
        for (const [category, config] of Object.entries(this.deepTierMap)) {
            if (tier >= config.min && tier <= config.max) {
                access.tierCategory = category;
                access.availableApis = config.apis;
                break;
            }
        }
        
        // Get specific API endpoints available at this tier
        access.endpoints = {};
        for (const [apiName, apiConfig] of Object.entries(this.apiConfigs)) {
            if (tier >= apiConfig.tier_required) {
                access.endpoints[apiName] = {
                    available: true,
                    endpoints: apiConfig.endpoints,
                    rateLimit: apiConfig.rate_limit
                };
            }
        }
        
        return access;
    }
    
    // Route API calls through tier system
    async routeApiCall(userId, apiName, endpoint, params = {}) {
        const userTier = this.userTiers.get(userId);
        
        if (!userTier) {
            return {
                error: 'User tier not calculated. Call /api/calculate-tier first.',
                required_action: 'tier_calculation'
            };
        }
        
        const apiConfig = this.apiConfigs[apiName];
        if (!apiConfig) {
            return {
                error: `Unknown API: ${apiName}`,
                available_apis: Object.keys(this.apiConfigs)
            };
        }
        
        // Check tier requirement
        if (userTier.tier < apiConfig.tier_required) {
            return {
                error: 'Insufficient tier level',
                current_tier: userTier.tier,
                required_tier: apiConfig.tier_required,
                tier_gap: apiConfig.tier_required - userTier.tier,
                unlock_requirements: this.getUnlockRequirements(apiConfig.tier_required - userTier.tier)
            };
        }
        
        // Check rate limits
        const rateLimitCheck = this.checkRateLimit(userId, apiName);
        if (!rateLimitCheck.allowed) {
            return {
                error: 'Rate limit exceeded',
                ...rateLimitCheck
            };
        }
        
        // Make the actual API call
        try {
            const result = await this.executeApiCall(apiConfig, endpoint, params);
            
            // Record the call
            this.recordApiCall(userId, apiName, endpoint, result);
            
            return {
                success: true,
                api: apiName,
                endpoint,
                tier_used: userTier.tier,
                data: result,
                calls_remaining: rateLimitCheck.remaining
            };
            
        } catch (error) {
            return {
                error: 'API call failed',
                message: error.message,
                api: apiName,
                endpoint
            };
        }
    }
    
    // Execute the actual API call
    async executeApiCall(apiConfig, endpoint, params) {
        // For RuneScape example
        if (apiConfig.baseUrl.includes('runescape.com')) {
            return await this.callRuneScapeApi(apiConfig, endpoint, params);
        }
        
        // For other APIs, implement similar methods
        // This is a placeholder for the actual implementation
        return {
            mock_data: true,
            message: `Would call ${apiConfig.baseUrl}${endpoint}`,
            params,
            timestamp: Date.now()
        };
    }
    
    // Specific RuneScape API implementation
    async callRuneScapeApi(apiConfig, endpoint, params) {
        const fetch = require('node-fetch');
        
        // Replace parameters in endpoint URL
        let url = apiConfig.baseUrl + endpoint;
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`{${key}}`, encodeURIComponent(value));
        }
        
        console.log(`🎮 Calling RuneScape API: ${url}`);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'DeepTierRouter/1.0'
                },
                timeout: 10000
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.text();
            
            // Parse RuneScape hiscores format
            if (endpoint.includes('index_lite.ws')) {
                return this.parseRuneScapeHiscores(data);
            }
            
            return { raw_data: data, parsed: false };
            
        } catch (error) {
            throw new Error(`RuneScape API error: ${error.message}`);
        }
    }
    
    // Parse RuneScape hiscores data
    parseRuneScapeHiscores(data) {
        const lines = data.trim().split('\n');
        const skills = [
            'Overall', 'Attack', 'Defence', 'Strength', 'Constitution', 'Ranged',
            'Prayer', 'Magic', 'Cooking', 'Woodcutting', 'Fletching', 'Fishing',
            'Firemaking', 'Crafting', 'Smithing', 'Mining', 'Herblore', 'Agility',
            'Thieving', 'Slayer', 'Farming', 'Runecrafting', 'Hunter', 'Construction',
            'Summoning', 'Dungeoneering', 'Divination', 'Invention'
        ];
        
        const parsed = {
            skills: {},
            activities: {},
            last_updated: Date.now()
        };
        
        lines.forEach((line, index) => {
            const [rank, level, xp] = line.split(',').map(val => 
                val === '-1' ? 0 : parseInt(val)
            );
            
            if (index < skills.length) {
                parsed.skills[skills[index]] = {
                    rank: rank || null,
                    level: level || 1,
                    xp: xp || 0
                };
            }
        });
        
        return parsed;
    }
    
    checkRateLimit(userId, apiName) {
        const key = `${userId}:${apiName}`;
        const now = Date.now();
        const apiConfig = this.apiConfigs[apiName];
        const limit = apiConfig.rate_limit;
        
        if (!this.apiCalls.has(key)) {
            this.apiCalls.set(key, { calls: [], limit });
        }
        
        const userCalls = this.apiCalls.get(key);
        const timeWindow = this.getTimeWindow(limit.per);
        
        // Remove old calls outside the time window
        userCalls.calls = userCalls.calls.filter(call => 
            now - call < timeWindow
        );
        
        const allowed = userCalls.calls.length < limit.requests;
        
        return {
            allowed,
            current: userCalls.calls.length,
            limit: limit.requests,
            period: limit.per,
            remaining: Math.max(0, limit.requests - userCalls.calls.length),
            reset_time: userCalls.calls.length > 0 ? 
                Math.max(...userCalls.calls) + timeWindow : now
        };
    }
    
    getTimeWindow(period) {
        const timeWindows = {
            'minute': 60 * 1000,
            'hour': 60 * 60 * 1000,
            'day': 24 * 60 * 60 * 1000
        };
        
        return timeWindows[period] || timeWindows.hour;
    }
    
    recordApiCall(userId, apiName, endpoint, result) {
        const key = `${userId}:${apiName}`;
        const userCalls = this.apiCalls.get(key);
        
        if (userCalls) {
            userCalls.calls.push(Date.now());
        }
        
        console.log(`📊 API call recorded: ${userId} -> ${apiName}${endpoint}`);
    }
    
    getUnlockRequirements(tierGap) {
        if (tierGap <= 10) {
            return ['Build 2-3 more projects', 'Deploy to production', 'Add documentation'];
        } else if (tierGap <= 25) {
            return ['Integrate 3+ external APIs', 'Build a complete system', 'Generate revenue'];
        } else if (tierGap <= 50) {
            return ['Launch a successful product', 'Build AI/ML system', 'Scale to 1000+ users'];
        } else {
            return ['Exit a company', 'Publish research', 'Build industry-changing technology'];
        }
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.renderDeepTierInterface());
        });
        
        // Calculate user tier
        this.app.post('/api/calculate-tier', (req, res) => {
            const { userId, metrics } = req.body;
            const tier = this.calculateUserTier(userId, metrics);
            const access = this.getApiAccessForTier(tier);
            
            res.json({
                userId,
                tier,
                tierCategory: access.tierCategory,
                availableApis: access.availableApis,
                endpoints: access.endpoints,
                unlocked: `Tier ${tier} unlocked! ${Object.keys(access.endpoints).length} APIs available.`
            });
        });
        
        // Make API call through tier system
        this.app.post('/api/call/:apiName/:endpoint', async (req, res) => {
            const { apiName, endpoint } = req.params;
            const { userId, params = {} } = req.body;
            
            const result = await this.routeApiCall(userId, apiName, endpoint, params);
            res.json(result);
        });
        
        // Get tier status
        this.app.get('/api/tier-status/:userId', (req, res) => {
            const { userId } = req.params;
            const userTier = this.userTiers.get(userId);
            
            if (!userTier) {
                return res.json({
                    error: 'User not found. Calculate tier first.',
                    action: 'POST /api/calculate-tier'
                });
            }
            
            res.json({
                userId,
                ...userTier,
                nextTierAt: this.getNextTierThreshold(userTier.tier),
                availableApiCount: Object.keys(userTier.apiAccess.endpoints).length
            });
        });
        
        // Get all tiers and their API access
        this.app.get('/api/tier-map', (req, res) => {
            res.json({
                tierMap: this.deepTierMap,
                apiConfigs: Object.fromEntries(
                    Object.entries(this.apiConfigs).map(([name, config]) => [
                        name, 
                        {
                            tier_required: config.tier_required,
                            endpoints: Object.keys(config.endpoints),
                            rate_limit: config.rate_limit
                        }
                    ])
                ),
                examples: {
                    tier_51: 'RuneScape player stats',
                    tier_108: 'Real-time crypto prices',
                    tier_153: 'Claude/GPT API access',
                    tier_201: 'Everything unlocked'
                }
            });
        });
    }
    
    getNextTierThreshold(currentTier) {
        const thresholds = [51, 108, 153, 201];
        for (const threshold of thresholds) {
            if (currentTier < threshold) {
                return {
                    tier: threshold,
                    gap: threshold - currentTier,
                    unlocks: this.getUnlocksAtTier(threshold)
                };
            }
        }
        
        return {
            tier: currentTier + 50,
            gap: 50,
            unlocks: ['More advanced API access']
        };
    }
    
    getUnlocksAtTier(tier) {
        if (tier === 51) return ['RuneScape API', 'OSRS API', 'Game APIs'];
        if (tier === 108) return ['Crypto APIs', 'Trading APIs', 'Financial data'];
        if (tier === 153) return ['AI APIs', 'Cloud services', 'Enterprise tools'];
        if (tier === 201) return ['All APIs unlocked', 'Unlimited access'];
        return ['Advanced features'];
    }
    
    renderDeepTierInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🌊🎯 Deep Tier API Router</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: white; 
            margin: 0; 
            padding: 20px; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .tier-card { 
            background: rgba(255,255,255,0.1); 
            border-radius: 15px; 
            padding: 20px; 
            margin: 15px 0; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .tier-badge { 
            display: inline-block; 
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4); 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-weight: bold; 
            margin-right: 10px;
        }
        .api-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
        }
        .api-card { 
            background: rgba(0,0,0,0.3); 
            padding: 15px; 
            border-radius: 10px; 
            border-left: 4px solid #4ecdc4;
        }
        .locked { 
            opacity: 0.5; 
            border-left-color: #666; 
        }
        .tier-calculator { 
            background: rgba(255,255,255,0.05); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
        }
        input, button { 
            background: rgba(255,255,255,0.1); 
            border: 1px solid rgba(255,255,255,0.3); 
            color: white; 
            padding: 10px; 
            border-radius: 5px; 
            margin: 5px; 
        }
        button { 
            background: linear-gradient(45deg, #667eea, #764ba2); 
            cursor: pointer; 
            border: none;
        }
        button:hover { transform: translateY(-2px); }
        .tier-progress { 
            height: 20px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 10px; 
            overflow: hidden; 
            margin: 10px 0;
        }
        .tier-fill { 
            height: 100%; 
            background: linear-gradient(90deg, #4ecdc4, #44a08d); 
            transition: width 0.5s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌊🎯 Deep Tier API Router</h1>
        <p>Access external APIs based on your tier level. Build more, unlock more!</p>
        
        <div class="tier-calculator">
            <h2>Calculate Your Tier</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <input type="number" id="systemsBuilt" placeholder="Systems Built" min="0">
                <input type="number" id="apisIntegrated" placeholder="APIs Integrated" min="0">
                <input type="number" id="yearsExperience" placeholder="Years Experience" min="0">
                <input type="number" id="projectsDeployed" placeholder="Projects Deployed" min="0">
                <input type="number" id="codeCommits" placeholder="Code Commits" min="0">
            </div>
            <div style="margin: 10px 0;">
                <label><input type="checkbox" id="hasBuiltBlockchain"> Built Blockchain (+25 tiers)</label>
                <label><input type="checkbox" id="hasBuiltAI"> Built AI System (+30 tiers)</label>
                <label><input type="checkbox" id="hasBuiltGame"> Built Game (+20 tiers)</label>
                <label><input type="checkbox" id="hasRevenueGeneration"> Revenue Generation (+40 tiers)</label>
            </div>
            <button onclick="calculateTier()">🧮 Calculate My Tier</button>
            
            <div id="tierResult" style="display: none; margin-top: 20px;">
                <h3>Your Tier: <span id="userTier"></span></h3>
                <div class="tier-progress">
                    <div class="tier-fill" id="tierProgress" style="width: 0%"></div>
                </div>
                <div id="unlockedApis"></div>
            </div>
        </div>
        
        <div class="tier-card">
            <div class="tier-badge">Tier 1-50</div>
            <h3>Standard Tier - Internal Systems</h3>
            <p>Access to internal APIs and basic functionality</p>
        </div>
        
        <div class="tier-card">
            <div class="tier-badge">Tier 51-107</div>
            <h3>Deep Games - External Game APIs</h3>
            <div class="api-grid">
                <div class="api-card" data-tier="51">
                    <h4>🎮 RuneScape API</h4>
                    <p>Player stats, hiscores, clan data</p>
                    <small>Tier 51+ required</small>
                </div>
                <div class="api-card" data-tier="52">
                    <h4>⚔️ Old School RuneScape</h4>
                    <p>OSRS hiscores, ironman stats</p>
                    <small>Tier 52+ required</small>
                </div>
                <div class="api-card" data-tier="55">
                    <h4>🏺 D2JSP Forum API</h4>
                    <p>Ladder stats, trading data</p>
                    <small>Tier 55+ required</small>
                </div>
            </div>
        </div>
        
        <div class="tier-card">
            <div class="tier-badge">Tier 108-152</div>
            <h3>Ultra Financial - Trading & Crypto APIs</h3>
            <div class="api-grid">
                <div class="api-card" data-tier="108">
                    <h4>₿ Coinbase API</h4>
                    <p>Crypto prices, trading, accounts</p>
                    <small>Tier 108+ required</small>
                </div>
                <div class="api-card" data-tier="110">
                    <h4>📊 TradingView API</h4>
                    <p>Technical analysis, screeners</p>
                    <small>Tier 110+ required</small>
                </div>
            </div>
        </div>
        
        <div class="tier-card">
            <div class="tier-badge">Tier 153-200</div>
            <h3>Hyper Enterprise - AI & Cloud APIs</h3>
            <div class="api-grid">
                <div class="api-card" data-tier="153">
                    <h4>🤖 Anthropic Claude</h4>
                    <p>Advanced AI reasoning</p>
                    <small>Tier 153+ required</small>
                </div>
                <div class="api-card" data-tier="155">
                    <h4>🧠 OpenAI GPT</h4>
                    <p>Language models, embeddings</p>
                    <small>Tier 155+ required</small>
                </div>
                <div class="api-card" data-tier="160">
                    <h4>☁️ AWS Services</h4>
                    <p>Full cloud infrastructure</p>
                    <small>Tier 160+ required</small>
                </div>
            </div>
        </div>
        
        <div class="tier-card">
            <div class="tier-badge">Tier 201+</div>
            <h3>Transcendent - Everything Unlocked</h3>
            <p>🌟 All APIs available with unlimited access</p>
        </div>
        
        <div class="tier-calculator">
            <h2>Test API Call</h2>
            <input type="text" id="testUserId" placeholder="User ID" value="test_user">
            <select id="testApi">
                <option value="runescape">RuneScape</option>
                <option value="osrs">Old School RuneScape</option>
                <option value="coinbase">Coinbase</option>
                <option value="anthropic">Anthropic</option>
            </select>
            <input type="text" id="testParams" placeholder="Parameters (JSON)" value='{"username":"Zezima"}'>
            <button onclick="testApiCall()">🚀 Test API Call</button>
            
            <div id="apiResult" style="margin-top: 15px;"></div>
        </div>
    </div>
    
    <script>
        let currentUserId = 'test_user';
        let currentTier = 0;
        
        async function calculateTier() {
            const metrics = {
                systemsBuilt: parseInt(document.getElementById('systemsBuilt').value) || 0,
                apisIntegrated: parseInt(document.getElementById('apisIntegrated').value) || 0,
                yearsExperience: parseInt(document.getElementById('yearsExperience').value) || 0,
                projectsDeployed: parseInt(document.getElementById('projectsDeployed').value) || 0,
                codeCommits: parseInt(document.getElementById('codeCommits').value) || 0,
                hasBuiltBlockchain: document.getElementById('hasBuiltBlockchain').checked,
                hasBuiltAI: document.getElementById('hasBuiltAI').checked,
                hasBuiltGame: document.getElementById('hasBuiltGame').checked,
                hasRevenueGeneration: document.getElementById('hasRevenueGeneration').checked
            };
            
            const response = await fetch('/api/calculate-tier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, metrics })
            });
            
            const result = await response.json();
            currentTier = result.tier;
            
            document.getElementById('userTier').textContent = result.tier;
            document.getElementById('tierProgress').style.width = Math.min(100, (result.tier / 200) * 100) + '%';
            document.getElementById('tierResult').style.display = 'block';
            
            let apisHtml = '<h4>Unlocked APIs:</h4><ul>';
            for (const [api, config] of Object.entries(result.endpoints)) {
                apisHtml += \`<li><strong>\${api}</strong> - \${Object.keys(config.endpoints).length} endpoints</li>\`;
            }
            apisHtml += '</ul>';
            
            document.getElementById('unlockedApis').innerHTML = apisHtml;
            
            // Update UI to show locked/unlocked APIs
            updateApiCards(result.tier);
        }
        
        function updateApiCards(tier) {
            document.querySelectorAll('.api-card').forEach(card => {
                const requiredTier = parseInt(card.dataset.tier);
                if (tier >= requiredTier) {
                    card.classList.remove('locked');
                } else {
                    card.classList.add('locked');
                }
            });
        }
        
        async function testApiCall() {
            const api = document.getElementById('testApi').value;
            const paramsStr = document.getElementById('testParams').value;
            let params = {};
            
            try {
                params = JSON.parse(paramsStr);
            } catch (e) {
                document.getElementById('apiResult').innerHTML = 
                    '<div style="color: #ff6b6b;">Invalid JSON parameters</div>';
                return;
            }
            
            const response = await fetch(\`/api/call/\${api}/player_stats\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, params })
            });
            
            const result = await response.json();
            
            document.getElementById('apiResult').innerHTML = 
                \`<pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px; overflow-x: auto;">\${JSON.stringify(result, null, 2)}</pre>\`;
        }
        
        // Initialize with some default values for demo
        setTimeout(() => {
            document.getElementById('systemsBuilt').value = '10';
            document.getElementById('apisIntegrated').value = '5';
            document.getElementById('yearsExperience').value = '3';
            document.getElementById('hasBuiltGame').checked = true;
        }, 1000);
    </script>
</body>
</html>`;
    }
    
    async start() {
        this.setupRoutes();
        
        this.app.listen(this.port, () => {
            console.log(`🌊🎯 Deep Tier API Router running on port ${this.port}`);
            console.log(`🌐 Interface: http://localhost:${this.port}`);
            console.log(`🔓 Tier-based API access system ready`);
            console.log(`📊 Tier 51+ unlocks game APIs like RuneScape`);
            console.log(`💰 Tier 108+ unlocks financial/crypto APIs`);  
            console.log(`🤖 Tier 153+ unlocks AI/enterprise APIs`);
            console.log(`🌟 Tier 201+ unlocks everything`);
        });
    }
}

if (require.main === module) {
    const router = new DeepTierApiRouter();
    router.start().catch(console.error);
}

module.exports = DeepTierApiRouter;
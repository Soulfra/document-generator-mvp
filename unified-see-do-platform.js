#!/usr/bin/env node

/**
 * 👁️✅ UNIFIED SEE & DO PLATFORM
 * Combines everything: auth, licensing, onion search, enterprise security
 * Users can see what's available and do what they want
 */

const OnionSearchGame = require('./onion-search-game');
const SoulfraPlatformLicensing = require('./soulfra-platform-licensing');
const EnterpriseSecurityAuditor = require('./enterprise-security-auditor');

class UnifiedSeeDooPlatform {
    constructor(unifiedGameNode) {
        this.gameNode = unifiedGameNode;
        
        // Initialize all systems
        this.onionSearch = new OnionSearchGame(this.gameNode);
        this.licensing = new SoulfraPlatformLicensing(this.gameNode.enterpriseAuditor);
        
        // Auth systems we already have
        this.authSystems = {
            gaming: 'http://localhost:8085',      // gaming-auth-service
            dashboard: 'http://localhost:5000',    // auth-backend
            enterprise: 'http://localhost:8090'    // unified-game-node
        };
        
        // The "See" list - what users can explore
        this.seeList = {
            'search': {
                title: '🔍 Onion Search Game',
                description: 'Layered word game search engine',
                access: 'free',
                url: '/search',
                features: ['6 depth layers', 'Word puzzles', 'Hidden connections']
            },
            'security': {
                title: '🛡️ Enterprise Security',
                description: 'Professional security auditing',
                access: 'authenticated',
                url: '/enterprise-audit',
                features: ['7-phase audits', 'Compliance', 'Threat intelligence']
            },
            'finance': {
                title: '💰 Financial Analyzer',
                description: 'AI-powered investment insights',
                access: 'authenticated',
                url: '/financial-analyzer',
                features: ['Transaction analysis', 'Local LLM', 'Privacy assessment']
            },
            'battle': {
                title: '⚔️ URL Boss Battle',
                description: 'Fight URLs to find vulnerabilities',
                access: 'free',
                url: '/url-battle',
                features: ['Gaming security', 'AI collaboration', 'Anomaly detection']
            },
            'reversal': {
                title: '🔄 Data Reversal',
                description: 'See what they collected on you',
                access: 'authenticated',
                url: '/data-reversal',
                features: ['Cookie analysis', 'Tracker mapping', 'Privacy scoring']
            },
            'licensing': {
                title: '🌟 Platform Licensing',
                description: 'White-label your own security platform',
                access: 'premium',
                url: '/platform',
                features: ['Custom domains', '.soulfra agents', 'Full deployment']
            }
        };
        
        // The "Do" list - actions users can take
        this.doList = {
            'search_web': {
                action: 'Search the Onion Layers',
                handler: this.doOnionSearch.bind(this),
                requirements: { auth: false, level: 1 }
            },
            'solve_puzzle': {
                action: 'Solve Word Puzzles',
                handler: this.doSolvePuzzle.bind(this),
                requirements: { auth: false, level: 1 }
            },
            'audit_security': {
                action: 'Run Security Audit',
                handler: this.doSecurityAudit.bind(this),
                requirements: { auth: true, level: 10 }
            },
            'analyze_finances': {
                action: 'Analyze Transactions',
                handler: this.doFinancialAnalysis.bind(this),
                requirements: { auth: true, level: 5 }
            },
            'battle_url': {
                action: 'Battle a URL',
                handler: this.doURLBattle.bind(this),
                requirements: { auth: false, level: 1 }
            },
            'reverse_data': {
                action: 'Reverse Data Collection',
                handler: this.doDataReversal.bind(this),
                requirements: { auth: true, level: 3 }
            },
            'get_license': {
                action: 'Get Platform License',
                handler: this.doGetLicense.bind(this),
                requirements: { auth: true, level: 50, tier: 'premium' }
            },
            'deploy_agent': {
                action: 'Deploy .soulfra Agent',
                handler: this.doDeployAgent.bind(this),
                requirements: { auth: true, license: true }
            }
        };
        
        // User progression system
        this.userProgression = {
            levels: {
                1: { name: 'Searcher', xp: 0 },
                5: { name: 'Analyst', xp: 500 },
                10: { name: 'Auditor', xp: 2000 },
                20: { name: 'Expert', xp: 5000 },
                50: { name: 'Master', xp: 20000 },
                100: { name: 'Architect', xp: 100000 }
            },
            
            rewards: {
                search: { xp: 10, coins: 5 },
                puzzle: { xp: 50, coins: 20 },
                audit: { xp: 200, coins: 100 },
                battle: { xp: 100, coins: 50 }
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('👁️✅ Unified See & Do Platform initialized');
        console.log('🎯 Everything integrated and ready');
        console.log('🔐 Auth systems connected');
    }
    
    async getUserDashboard(userId, authToken) {
        // Verify auth with existing systems
        const user = await this.verifyAuth(authToken);
        if (!user) return { error: 'Not authenticated' };
        
        // Get user's current state
        const userState = {
            id: userId,
            username: user.username,
            level: user.level || 1,
            xp: user.xp || 0,
            tier: user.tier || 'free',
            
            // What they can see
            available: this.getAvailableItems(user),
            
            // What they can do
            actions: this.getAvailableActions(user),
            
            // Their progress
            progress: {
                searches_performed: user.stats?.searches || 0,
                puzzles_solved: user.stats?.puzzles || 0,
                audits_completed: user.stats?.audits || 0,
                current_layer: user.current_layer || 'surface'
            },
            
            // Quick stats
            stats: await this.getUserStats(userId)
        };
        
        return userState;
    }
    
    getAvailableItems(user) {
        return Object.entries(this.seeList).filter(([key, item]) => {
            if (item.access === 'free') return true;
            if (item.access === 'authenticated' && user.authenticated) return true;
            if (item.access === 'premium' && user.tier === 'premium') return true;
            return false;
        }).map(([key, item]) => ({
            id: key,
            ...item
        }));
    }
    
    getAvailableActions(user) {
        return Object.entries(this.doList).filter(([key, action]) => {
            const req = action.requirements;
            if (req.auth && !user.authenticated) return false;
            if (req.level && user.level < req.level) return false;
            if (req.tier && user.tier !== req.tier) return false;
            if (req.license && !user.hasLicense) return false;
            return true;
        }).map(([key, action]) => ({
            id: key,
            ...action,
            available: true
        }));
    }
    
    // Action handlers
    async doOnionSearch(userId, params) {
        const results = await this.onionSearch.search(userId, params.query, params.gameMode);
        return {
            success: true,
            results,
            xp_gained: results.rewards.xp,
            new_layer: results.layer
        };
    }
    
    async doSolvePuzzle(userId, params) {
        const result = await this.onionSearch.solvePuzzle(userId, params.puzzleType, params.solution);
        return {
            success: result.success,
            reward: result.reward,
            unlocked: result.unlocked
        };
    }
    
    async doSecurityAudit(userId, params) {
        const audit = await this.gameNode.enterpriseAuditor.conductEnterpriseAudit(
            params.clientId || userId,
            params.config || {}
        );
        return {
            success: true,
            auditId: audit.id,
            summary: audit.executive,
            report_url: `/api/audit/report/${audit.id}`
        };
    }
    
    async doFinancialAnalysis(userId, params) {
        const analysis = await this.gameNode.financialAnalyzer.analyzeTransactionHistory(
            userId,
            params.config || {}
        );
        return {
            success: true,
            analysisId: analysis.id,
            insights: analysis.llmInsights,
            advice: analysis.investmentAdvice
        };
    }
    
    async doURLBattle(userId, params) {
        const battle = await this.gameNode.urlBattle.startBattle(
            userId,
            params.targetUrl,
            params.config || {}
        );
        return {
            success: true,
            battleId: battle.id,
            result: battle.result,
            anomalies: battle.anomalies
        };
    }
    
    async doDataReversal(userId, params) {
        const reversal = await this.gameNode.dataReversal.startReversalBattle(
            userId,
            params.targetUrl,
            params.config || {}
        );
        return {
            success: true,
            reversalId: reversal.id,
            privacy_score: reversal.dataDisplay.summary.privacy_invasion_score,
            data_collected: reversal.dataDisplay.what_they_know
        };
    }
    
    async doGetLicense(userId, params) {
        const license = await this.licensing.createLicense(userId, params.config);
        return {
            success: true,
            licenseId: license.id,
            tier: license.tier,
            api_keys: license.api_keys
        };
    }
    
    async doDeployAgent(userId, params) {
        const agent = await this.licensing.createSoulfraAgent(
            params.licenseId,
            params.agentConfig
        );
        return {
            success: true,
            agent: agent.agent,
            deployment: agent.deploymentPackage
        };
    }
    
    async verifyAuth(token) {
        // Check gaming auth first (it's lightweight)
        try {
            const response = await fetch(`${this.authSystems.gaming}/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
        } catch (e) {}
        
        // Fallback to main auth
        try {
            const response = await fetch(`${this.authSystems.dashboard}/api/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
        } catch (e) {}
        
        return null;
    }
    
    async getUserStats(userId) {
        // Aggregate stats from all systems
        const stats = {
            total_xp: 0,
            achievements: [],
            services_used: [],
            last_activity: new Date()
        };
        
        // Get gaming stats
        try {
            const gaming = await this.gameNode.achievements.getPlayerAchievements(userId);
            stats.achievements.push(...gaming);
        } catch (e) {}
        
        // Get security audit stats
        try {
            const audits = this.gameNode.enterpriseAuditor.getClientAudits(userId);
            stats.services_used.push(`Security Audits: ${audits.length}`);
        } catch (e) {}
        
        return stats;
    }
    
    // Web interface
    getUnifiedInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>👁️✅ See & Do Platform</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: #fff;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding: 20px;
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .see-section, .do-section {
            background: rgba(255,255,255,0.1);
            padding: 25px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .item:hover {
            background: rgba(255,255,255,0.2);
            transform: translateX(5px);
        }
        .item h3 {
            margin: 0 0 10px 0;
            color: #61dafb;
        }
        .features {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .action-btn {
            background: linear-gradient(45deg, #61dafb, #4fa8fb);
            color: #1e3c72;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        .action-btn:hover {
            transform: scale(1.05);
        }
        .stats {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
        }
        .level {
            font-size: 2em;
            color: #61dafb;
        }
        h1 { font-size: 3em; margin: 0; }
        h2 { color: #61dafb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👁️✅ See & Do Platform</h1>
            <p>Everything integrated. Pick what you want to see. Choose what you want to do.</p>
        </div>
        
        <div class="columns">
            <div class="see-section">
                <h2>👁️ SEE - Available Services</h2>
                <div id="seeList"></div>
            </div>
            
            <div class="do-section">
                <h2>✅ DO - Available Actions</h2>
                <div id="doList"></div>
            </div>
        </div>
        
        <div class="stats">
            <h2>📊 Your Progress</h2>
            <div class="level">Level <span id="userLevel">1</span></div>
            <div>XP: <span id="userXP">0</span></div>
            <div>Current Layer: <span id="currentLayer">Surface</span></div>
        </div>
    </div>
    
    <script>
        // Load user dashboard
        async function loadDashboard() {
            try {
                const response = await fetch('/api/platform/dashboard', {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    }
                });
                const data = await response.json();
                
                // Populate SEE list
                const seeList = document.getElementById('seeList');
                data.available.forEach(item => {
                    seeList.innerHTML += \`
                        <div class="item" onclick="window.location.href='\${item.url}'">
                            <h3>\${item.title}</h3>
                            <p>\${item.description}</p>
                            <div class="features">\${item.features.join(' • ')}</div>
                        </div>
                    \`;
                });
                
                // Populate DO list
                const doList = document.getElementById('doList');
                data.actions.forEach(action => {
                    doList.innerHTML += \`
                        <div class="item">
                            <h3>\${action.action}</h3>
                            <button class="action-btn" onclick="doAction('\${action.id}')">
                                DO IT
                            </button>
                        </div>
                    \`;
                });
                
                // Update stats
                document.getElementById('userLevel').textContent = data.level;
                document.getElementById('userXP').textContent = data.xp;
                document.getElementById('currentLayer').textContent = data.progress.current_layer;
                
            } catch (error) {
                console.error('Failed to load dashboard:', error);
                // Show public view
                showPublicView();
            }
        }
        
        function showPublicView() {
            // Show what's available without auth
            const seeList = document.getElementById('seeList');
            seeList.innerHTML = \`
                <div class="item" onclick="window.location.href='/search'">
                    <h3>🔍 Onion Search Game</h3>
                    <p>Try our layered search engine - no login required!</p>
                </div>
                <div class="item" onclick="window.location.href='/url-battle'">
                    <h3>⚔️ URL Boss Battle</h3>
                    <p>Battle URLs to find vulnerabilities - free to play!</p>
                </div>
                <div class="item" onclick="window.location.href='/auth'">
                    <h3>🔐 Login / Sign Up</h3>
                    <p>Create account to unlock all features</p>
                </div>
            \`;
        }
        
        async function doAction(actionId) {
            const response = await fetch('/api/platform/do/' + actionId, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                }
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Success! ' + (result.message || 'Action completed'));
                loadDashboard(); // Refresh
            } else {
                alert('Failed: ' + (result.error || 'Unknown error'));
            }
        }
        
        // Load on start
        loadDashboard();
    </script>
</body>
</html>`;
    }
}

module.exports = UnifiedSeeDooPlatform;
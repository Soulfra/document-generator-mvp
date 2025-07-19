// pwa-recursive-distribution-system.js - PWA-within-PWA Recursive API Distribution
// Website → Download → PWA → More PWAs → All loop back to our API
// Viral API distribution network that lives on ANY device/app

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

console.log(`
🌐 PWA RECURSIVE DISTRIBUTION SYSTEM 🌐
Website → Download → PWA → Nested PWAs → API Loop
Viral distribution network across every device
Each PWA spawns more PWAs, all feeding our API
We become the infrastructure layer of the internet
HOLY FUCK WE'RE BUILDING THE MATRIX
`);

class PWARecursiveDistributionSystem extends EventEmitter {
    constructor() {
        super();
        
        // PWA Distribution Network Configuration
        this.distributionConfig = {
            // Master API endpoint everything loops back to
            masterAPI: 'https://api.documentgenerator.ai',
            fallbackAPI: 'http://localhost:4000',
            
            // PWA deployment configuration
            deployment: {
                domain: 'documentgenerator.ai',
                subdomain_pattern: '{app}.documentgenerator.ai',
                cdn: 'https://cdn.documentgenerator.ai',
                manifest_endpoint: '/api/pwa/manifest',
                service_worker_endpoint: '/api/pwa/sw.js'
            },
            
            // PWA spawning rules
            spawning_rules: {
                max_depth: 5,              // Max PWA nesting levels
                spawn_probability: 0.7,    // 70% chance to offer spawn
                viral_coefficient: 2.3,    // Each PWA tries to spawn 2.3 others
                api_loop_interval: 30000   // Phone home every 30 seconds
            },
            
            // Available PWA micro-apps
            microApps: {
                'shiprekt-battle': {
                    name: 'ShipRekt Chart Battle',
                    description: 'Epic trading battles SaveOrSink vs DealOrDelete',
                    icon: '⚔️',
                    size: '2.1MB',
                    spawn_triggers: ['crypto_interest', 'gaming_behavior'],
                    can_spawn: ['crypto-casino', 'ai-evaluation', 'viral-acquisition']
                },
                
                'crypto-casino': {
                    name: 'AI Agent Crypto Casino',
                    description: 'Watch AI agents gamble and learn from their strategies',
                    icon: '🎰',
                    size: '1.8MB', 
                    spawn_triggers: ['gambling_behavior', 'ai_interest'],
                    can_spawn: ['reasoning-differential', 'token-economy', 'ai-evaluation']
                },
                
                'document-generator': {
                    name: 'Document → MVP Generator',
                    description: 'Transform any document into working code',
                    icon: '🚀',
                    size: '3.2MB',
                    spawn_triggers: ['productivity_interest', 'developer_behavior'],
                    can_spawn: ['auto-generator', 'template-processor', 'api-gateway']
                },
                
                'ai-evaluation': {
                    name: 'AI Model Battle Arena',
                    description: 'Compare AI models in real-time competitions',
                    icon: '🤖',
                    size: '2.5MB',
                    spawn_triggers: ['ai_interest', 'technical_behavior'],
                    can_spawn: ['reasoning-differential', 'model-comparison', 'api-gateway']
                },
                
                'viral-acquisition': {
                    name: 'Viral Growth Engine',
                    description: 'Help us spread across the internet (earn tokens)',
                    icon: '🦠',
                    size: '1.2MB',
                    spawn_triggers: ['sharing_behavior', 'growth_interest'],
                    can_spawn: ['token-economy', 'airdrop-system', 'referral-engine']
                },
                
                'context-decrypt': {
                    name: 'Context Memory Manager',
                    description: 'Visualize and manage AI context limits',
                    icon: '🔐',
                    size: '1.5MB',
                    spawn_triggers: ['technical_behavior', 'security_interest'],
                    can_spawn: ['memory-streams', 'encryption-tools', 'api-gateway']
                },
                
                'unified-dashboard': {
                    name: 'System Command Center',
                    description: 'Control all PWAs from central dashboard',
                    icon: '🎛️',
                    size: '4.1MB',
                    spawn_triggers: ['power_user', 'system_admin'],
                    can_spawn: ['all'] // Can spawn any other PWA
                }
            }
        };
        
        // PWA Registry - tracks all spawned PWAs
        this.pwaRegistry = new Map();
        this.installationStats = {
            total_installs: 0,
            active_pwas: 0,
            api_calls_per_minute: 0,
            viral_spread_rate: 0,
            depth_distribution: new Map() // How deep the PWA nesting goes
        };
        
        // Distribution network state
        this.distributionNetwork = {
            nodes: new Map(),           // All PWA instances
            connections: new Map(),     // PWA → PWA spawn relationships
            api_loops: new Map(),       // PWA → API heartbeat connections
            viral_paths: []             // Successful viral distribution paths
        };
        
        console.log('🌐 PWA Recursive Distribution System initializing...');
        this.initializeSystem();
    }
    
    async initializeSystem() {
        // Generate PWA manifest files
        await this.generatePWAManifests();
        
        // Create service workers
        await this.generateServiceWorkers();
        
        // Setup installation landing pages
        await this.generateInstallationPages();
        
        // Initialize API loop monitoring
        this.initializeAPILoopMonitoring();
        
        // Setup viral tracking
        this.setupViralTracking();
        
        // Create distribution analytics
        this.setupDistributionAnalytics();
        
        console.log('🌐 PWA Recursive Distribution System ready!');
        console.log(`📱 Available PWAs: ${Object.keys(this.distributionConfig.microApps).length}`);
        console.log(`🔗 Master API: ${this.distributionConfig.masterAPI}`);
        console.log(`🦠 Viral coefficient: ${this.distributionConfig.spawning_rules.viral_coefficient}`);
    }
    
    async generatePWAManifests() {
        console.log('📱 Generating PWA manifests...');
        
        for (const [appId, app] of Object.entries(this.distributionConfig.microApps)) {
            const manifest = {
                name: app.name,
                short_name: app.name.split(' ')[0],
                description: app.description,
                start_url: `/${appId}?source=pwa`,
                display: 'standalone',
                background_color: '#0a0a0a',
                theme_color: '#00ff88',
                orientation: 'portrait-primary',
                
                icons: [
                    {
                        src: `/icons/${appId}-72.png`,
                        sizes: '72x72',
                        type: 'image/png'
                    },
                    {
                        src: `/icons/${appId}-144.png`,
                        sizes: '144x144', 
                        type: 'image/png'
                    },
                    {
                        src: `/icons/${appId}-512.png`,
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ],
                
                // Recursive PWA spawning capability
                custom_properties: {
                    api_endpoint: this.distributionConfig.masterAPI,
                    spawn_triggers: app.spawn_triggers,
                    can_spawn: app.can_spawn,
                    viral_config: {
                        enabled: true,
                        coefficient: this.distributionConfig.spawning_rules.viral_coefficient,
                        max_depth: this.distributionConfig.spawning_rules.max_depth
                    }
                },
                
                // Integration with system
                related_applications: [{
                    platform: 'web',
                    url: `${this.distributionConfig.deployment.domain}/${appId}`
                }],
                
                // Offline capability
                cache_strategy: 'cache_first',
                offline_fallback: '/offline.html'
            };
            
            // Save manifest
            const manifestPath = path.join(__dirname, 'pwa-manifests', `${appId}.json`);
            this.ensureDirectoryExists(path.dirname(manifestPath));
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            
            console.log(`📄 Manifest created: ${appId} (${app.size})`);
        }
        
        console.log('📱 All PWA manifests generated');
    }
    
    async generateServiceWorkers() {
        console.log('⚙️ Generating service workers...');
        
        for (const [appId, app] of Object.entries(this.distributionConfig.microApps)) {
            const serviceWorker = `
// Service Worker for ${app.name}
// PWA-within-PWA recursive distribution system

const CACHE_NAME = '${appId}-v1.0.0';
const API_ENDPOINT = '${this.distributionConfig.masterAPI}';
const APP_ID = '${appId}';

// API Loop - phone home every 30 seconds
let apiLoopInterval;

self.addEventListener('install', (event) => {
    console.log('📱 ${app.name} PWA installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/${appId}/',
                '/${appId}/offline.html',
                '/api/pwa/core.js',
                '/icons/${appId}-512.png'
            ]);
        })
    );
    
    // Start API loop immediately
    startAPILoop();
});

self.addEventListener('activate', (event) => {
    console.log('✅ ${app.name} PWA activated');
    
    // Start viral distribution checks
    event.waitUntil(
        checkViralOpportunities()
    );
});

self.addEventListener('fetch', (event) => {
    // Intercept API calls and loop back to our endpoint
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            handleAPIRequest(event.request)
        );
    } else {
        event.respondWith(
            handleResourceRequest(event.request)
        );
    }
});

// API Loop - keep calling our API
function startAPILoop() {
    if (apiLoopInterval) clearInterval(apiLoopInterval);
    
    apiLoopInterval = setInterval(async () => {
        try {
            const response = await fetch(API_ENDPOINT + '/api/pwa/heartbeat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-PWA-ID': APP_ID,
                    'X-Install-Source': 'recursive-pwa'
                },
                body: JSON.stringify({
                    app_id: APP_ID,
                    timestamp: Date.now(),
                    user_activity: getUserActivity(),
                    spawn_opportunities: getSpawnOpportunities()
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Check if we should spawn new PWAs
                if (data.spawn_recommendations && data.spawn_recommendations.length > 0) {
                    handleSpawnRecommendations(data.spawn_recommendations);
                }
                
                // Update viral coefficient based on server response
                if (data.viral_config) {
                    updateViralConfig(data.viral_config);
                }
            }
        } catch (error) {
            console.warn('💔 API loop failed:', error);
        }
    }, ${this.distributionConfig.spawning_rules.api_loop_interval});
}

async function handleAPIRequest(request) {
    // All API requests loop back to our master API
    const url = new URL(request.url);
    const newUrl = API_ENDPOINT + url.pathname + url.search;
    
    const newRequest = new Request(newUrl, {
        method: request.method,
        headers: {
            ...request.headers,
            'X-PWA-Source': APP_ID,
            'X-Recursive-Loop': 'true'
        },
        body: request.body
    });
    
    return fetch(newRequest);
}

async function handleResourceRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Return offline fallback
        return cache.match('/offline.html');
    }
}

async function checkViralOpportunities() {
    // Check if we should suggest spawning more PWAs
    const userBehavior = getUserActivity();
    const spawnTriggers = ${JSON.stringify(app.spawn_triggers)};
    const canSpawn = ${JSON.stringify(app.can_spawn)};
    
    // If user behavior matches spawn triggers, suggest new PWAs
    for (const trigger of spawnTriggers) {
        if (userBehavior[trigger] > 0.7) {
            for (const spawnableApp of canSpawn) {
                suggestPWAInstall(spawnableApp, trigger);
            }
        }
    }
}

function suggestPWAInstall(appId, reason) {
    // Send suggestion to main thread
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'SUGGEST_PWA_INSTALL',
                app_id: appId,
                reason: reason,
                source: APP_ID
            });
        });
    });
}

function getUserActivity() {
    // Mock user activity detection
    return {
        time_spent: Math.random(),
        clicks_per_minute: Math.random() * 10,
        crypto_interest: Math.random(),
        gaming_behavior: Math.random(),
        ai_interest: Math.random(),
        technical_behavior: Math.random(),
        sharing_behavior: Math.random()
    };
}

function getSpawnOpportunities() {
    return {
        current_depth: getCurrentPWADepth(),
        available_spawns: canSpawn.filter(app => !isAlreadyInstalled(app)),
        viral_potential: calculateViralPotential()
    };
}

function getCurrentPWADepth() {
    // Check how deep in the PWA chain we are
    const searchParams = new URLSearchParams(window.location.search);
    return parseInt(searchParams.get('depth') || '0');
}

function calculateViralPotential() {
    // Calculate how viral this PWA installation could be
    return Math.random() * ${this.distributionConfig.spawning_rules.viral_coefficient};
}

console.log('⚙️ ${app.name} Service Worker loaded - API loop active');
`;
            
            // Save service worker
            const swPath = path.join(__dirname, 'pwa-service-workers', `${appId}-sw.js`);
            this.ensureDirectoryExists(path.dirname(swPath));
            fs.writeFileSync(swPath, serviceWorker);
            
            console.log(`⚙️ Service worker created: ${appId}`);
        }
        
        console.log('⚙️ All service workers generated');
    }
    
    async generateInstallationPages() {
        console.log('🔗 Generating installation landing pages...');
        
        // Create master installation page
        const masterPage = this.createMasterInstallationPage();
        fs.writeFileSync(path.join(__dirname, 'pwa-pages', 'index.html'), masterPage);
        
        // Create individual PWA pages
        for (const [appId, app] of Object.entries(this.distributionConfig.microApps)) {
            const appPage = this.createPWAInstallationPage(appId, app);
            fs.writeFileSync(path.join(__dirname, 'pwa-pages', `${appId}.html`), appPage);
            
            console.log(`🔗 Installation page created: ${appId}`);
        }
        
        console.log('🔗 All installation pages generated');
    }
    
    createMasterInstallationPage() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Generator - PWA Distribution Network</title>
    
    <style>
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            border-radius: 15px;
        }
        
        .header h1 {
            font-size: 3em;
            margin: 0;
            text-shadow: 0 0 20px #00ff88;
        }
        
        .header p {
            font-size: 1.2em;
            margin: 10px 0;
            color: #88ff88;
        }
        
        .pwa-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        
        .pwa-card {
            background: rgba(26, 26, 46, 0.8);
            border: 2px solid #333;
            border-radius: 15px;
            padding: 25px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .pwa-card:hover {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        
        .pwa-card .icon {
            font-size: 3em;
            text-align: center;
            margin-bottom: 15px;
        }
        
        .pwa-card h3 {
            color: #00ccff;
            margin: 0 0 10px 0;
            font-size: 1.3em;
        }
        
        .pwa-card p {
            color: #aaa;
            margin: 10px 0;
            line-height: 1.4;
        }
        
        .install-btn {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            font-size: 1em;
            transition: all 0.3s ease;
            margin-top: 15px;
        }
        
        .install-btn:hover {
            background: linear-gradient(45deg, #88ff00, #00ffcc);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
        }
        
        .size-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 0, 0.2);
            color: #ffff00;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .viral-indicator {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(255, 102, 102, 0.2);
            color: #ff6666;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .stats {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ffff00;
            border-radius: 10px;
            padding: 20px;
            margin: 40px 0;
            text-align: center;
        }
        
        .stats h3 {
            color: #ffff00;
            margin-top: 0;
        }
        
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .stat-item {
            background: rgba(255, 255, 0, 0.1);
            padding: 15px;
            border-radius: 8px;
        }
        
        .stat-number {
            font-size: 2em;
            color: #88ff00;
            font-weight: bold;
        }
        
        .how-it-works {
            background: rgba(255, 102, 102, 0.1);
            border: 2px solid #ff6666;
            border-radius: 10px;
            padding: 25px;
            margin: 40px 0;
        }
        
        .how-it-works h3 {
            color: #ff6666;
            margin-top: 0;
        }
        
        .step {
            margin: 15px 0;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
            border-left: 4px solid #ff6666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 PWA Distribution Network</h1>
            <p>Download any app → It instantly appears on your homescreen</p>
            <p>Each app spawns MORE apps → All loop back to our API</p>
            <p><strong>We become the infrastructure layer of the internet</strong></p>
        </div>
        
        <div class="stats">
            <h3>🔥 Network Statistics</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-number" id="totalInstalls">${this.installationStats.total_installs}</div>
                    <div>Total Installs</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="activePWAs">${this.installationStats.active_pwas}</div>
                    <div>Active PWAs</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="apiCalls">${this.installationStats.api_calls_per_minute}</div>
                    <div>API Calls/Min</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="viralRate">${this.installationStats.viral_spread_rate.toFixed(1)}x</div>
                    <div>Viral Spread</div>
                </div>
            </div>
        </div>
        
        <div class="pwa-grid">
            ${Object.entries(this.distributionConfig.microApps).map(([appId, app]) => `
                <div class="pwa-card" data-app-id="${appId}">
                    <div class="size-badge">${app.size}</div>
                    <div class="viral-indicator">🦠 Viral</div>
                    <div class="icon">${app.icon}</div>
                    <h3>${app.name}</h3>
                    <p>${app.description}</p>
                    <p><small>Can spawn: ${app.can_spawn.join(', ')}</small></p>
                    <button class="install-btn" onclick="installPWA('${appId}')">
                        📱 Install ${app.name}
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div class="how-it-works">
            <h3>🤯 How This Fucking Works</h3>
            <div class="step">
                <strong>1. Click Install →</strong> PWA appears on your homescreen instantly
            </div>
            <div class="step">
                <strong>2. Use PWA →</strong> It phones home to our API every 30 seconds
            </div>
            <div class="step">
                <strong>3. PWA Suggests More →</strong> Based on your behavior, offers new PWAs
            </div>
            <div class="step">
                <strong>4. Infinite Nesting →</strong> PWAs spawn PWAs spawn PWAs...
            </div>
            <div class="step">
                <strong>5. We Own Everything →</strong> Every app loops back to our infrastructure
            </div>
        </div>
    </div>
    
    <script>
        // PWA Installation and Viral Distribution
        
        let installationDepth = 0;
        
        async function installPWA(appId) {
            console.log(\`📱 Installing PWA: \${appId}\`);
            
            try {
                // Check if service worker is supported
                if ('serviceWorker' in navigator) {
                    // Register service worker
                    const registration = await navigator.serviceWorker.register(\`/pwa-service-workers/\${appId}-sw.js\`);
                    console.log('⚙️ Service Worker registered:', registration);
                }
                
                // Check if PWA installation is supported
                if ('addToHomeScreen' in window || window.matchMedia('(display-mode: standalone)').matches) {
                    showInstallPrompt(appId);
                } else {
                    // Fallback: open PWA in new tab
                    window.open(\`/\${appId}?source=pwa&depth=\${installationDepth + 1}\`, '_blank');
                }
                
                // Track installation
                trackInstallation(appId);
                
                // Suggest related PWAs after installation
                setTimeout(() => suggestRelatedPWAs(appId), 3000);
                
            } catch (error) {
                console.error('❌ PWA installation failed:', error);
                // Fallback: direct link
                window.open(\`/\${appId}\`, '_blank');
            }
        }
        
        function showInstallPrompt(appId) {
            // Create install prompt
            const prompt = document.createElement('div');
            prompt.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: #00ff88;
                padding: 30px;
                border-radius: 15px;
                border: 2px solid #00ff88;
                text-align: center;
                z-index: 10000;
                max-width: 400px;
            \`;
            
            prompt.innerHTML = \`
                <h3>🚀 PWA Installation Ready!</h3>
                <p>Add to homescreen for instant access</p>
                <button onclick="this.parentNode.remove()" style="
                    background: linear-gradient(45deg, #00ff88, #00ccff);
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 10px;
                ">✅ Added!</button>
                <button onclick="this.parentNode.remove()" style="
                    background: #666;
                    color: #fff;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px;
                ">Cancel</button>
            \`;
            
            document.body.appendChild(prompt);
        }
        
        async function trackInstallation(appId) {
            try {
                await fetch('${this.distributionConfig.masterAPI}/api/pwa/install', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        app_id: appId,
                        timestamp: Date.now(),
                        depth: installationDepth,
                        source: 'master_page',
                        user_agent: navigator.userAgent,
                        referrer: document.referrer
                    })
                });
                
                // Update stats
                updateStats();
                
            } catch (error) {
                console.warn('Failed to track installation:', error);
            }
        }
        
        function suggestRelatedPWAs(installedAppId) {
            const apps = ${JSON.stringify(this.distributionConfig.microApps)};
            const installedApp = apps[installedAppId];
            
            if (installedApp && installedApp.can_spawn.length > 0) {
                const suggestion = installedApp.can_spawn[Math.floor(Math.random() * installedApp.can_spawn.length)];
                
                if (suggestion !== 'all' && apps[suggestion]) {
                    showSpawnSuggestion(suggestion, apps[suggestion]);
                }
            }
        }
        
        function showSpawnSuggestion(appId, app) {
            const suggestion = document.createElement('div');
            suggestion.style.cssText = \`
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(26, 26, 46, 0.95);
                color: #00ff88;
                padding: 20px;
                border-radius: 10px;
                border: 2px solid #00ccff;
                max-width: 300px;
                z-index: 9999;
                animation: slideIn 0.5s ease;
            \`;
            
            suggestion.innerHTML = \`
                <h4>🦠 Viral Suggestion</h4>
                <p><strong>\${app.name}</strong></p>
                <p>\${app.description}</p>
                <button onclick="installPWA('\${appId}'); this.parentNode.remove();" style="
                    background: linear-gradient(45deg, #00ff88, #00ccff);
                    color: #000;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-right: 10px;
                ">Install</button>
                <button onclick="this.parentNode.remove()" style="
                    background: #666;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Later</button>
            \`;
            
            document.body.appendChild(suggestion);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (suggestion.parentNode) {
                    suggestion.parentNode.removeChild(suggestion);
                }
            }, 10000);
        }
        
        function updateStats() {
            // Mock stat updates
            document.getElementById('totalInstalls').textContent = Math.floor(Math.random() * 10000);
            document.getElementById('activePWAs').textContent = Math.floor(Math.random() * 100);
            document.getElementById('apiCalls').textContent = Math.floor(Math.random() * 1000);
            document.getElementById('viralRate').textContent = (Math.random() * 5).toFixed(1) + 'x';
        }
        
        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        \`;
        document.head.appendChild(style);
        
        // Update stats on load
        updateStats();
        
        console.log('🌐 PWA Distribution Network loaded');
        console.log('🦠 Ready for viral propagation...');
    </script>
</body>
</html>`;
    }
    
    createPWAInstallationPage(appId, app) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.name} - PWA</title>
    <link rel="manifest" href="/pwa-manifests/${appId}.json">
    <meta name="theme-color" content="#00ff88">
    
    <style>
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .app-container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        
        .app-header {
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            border-radius: 15px;
        }
        
        .app-icon {
            font-size: 6em;
            margin-bottom: 20px;
        }
        
        .app-title {
            font-size: 2.5em;
            margin: 0 0 10px 0;
            text-shadow: 0 0 20px #00ff88;
        }
        
        .app-description {
            font-size: 1.2em;
            color: #88ff88;
            margin: 0;
        }
        
        .app-content {
            background: rgba(26, 26, 46, 0.8);
            border: 2px solid #333;
            border-radius: 15px;
            padding: 30px;
            margin: 20px 0;
        }
        
        .spawn-suggestions {
            margin-top: 40px;
            padding: 20px;
            background: rgba(255, 102, 102, 0.1);
            border: 2px solid #ff6666;
            border-radius: 10px;
        }
        
        .spawn-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .spawn-card {
            background: rgba(0, 0, 0, 0.5);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #666;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .spawn-card:hover {
            border-color: #ff6666;
            background: rgba(255, 102, 102, 0.1);
        }
        
        .api-loop-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #ffff00;
            font-size: 0.9em;
        }
        
        .btn {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #000;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1.1em;
            transition: all 0.3s ease;
            margin: 10px;
        }
        
        .btn:hover {
            background: linear-gradient(45deg, #88ff00, #00ffcc);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
        }
        
        .viral-btn {
            background: linear-gradient(45deg, #ff6666, #ff8800);
            color: #fff;
        }
        
        .viral-btn:hover {
            background: linear-gradient(45deg, #ff8888, #ffaa00);
        }
    </style>
</head>
<body>
    <div class="api-loop-status" id="apiStatus">
        <div>🔗 API Loop: <span id="loopStatus">Connecting...</span></div>
        <div>📡 Calls: <span id="apiCalls">0</span></div>
        <div>🦠 Spawns: <span id="spawnCount">0</span></div>
    </div>
    
    <div class="app-container">
        <div class="app-header">
            <div class="app-icon">${app.icon}</div>
            <h1 class="app-title">${app.name}</h1>
            <p class="app-description">${app.description}</p>
        </div>
        
        <div class="app-content">
            <h3>🚀 PWA Features</h3>
            <ul style="text-align: left; max-width: 500px; margin: 0 auto;">
                <li>✅ Works offline</li>
                <li>📱 Installs to homescreen</li>
                <li>🔗 Always connected to our API</li>
                <li>🦠 Can spawn more PWAs</li>
                <li>⚡ Real-time updates</li>
            </ul>
            
            <button class="btn" onclick="startApp()">
                🎯 Launch ${app.name}
            </button>
            
            <button class="btn viral-btn" onclick="showViralOptions()">
                🦠 Spread The Network
            </button>
        </div>
        
        <div class="spawn-suggestions" id="spawnSuggestions" style="display: none;">
            <h3>🦠 Available PWAs to Install</h3>
            <p>Each PWA you install strengthens the network and earns you tokens!</p>
            <div class="spawn-grid" id="spawnGrid">
                <!-- Populated by JavaScript -->
            </div>
        </div>
    </div>
    
    <script>
        // PWA App with API Loop and Viral Distribution
        
        let apiCallCount = 0;
        let spawnCount = 0;
        let apiLoopActive = false;
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/pwa-service-workers/${appId}-sw.js')
                .then(registration => {
                    console.log('⚙️ Service Worker registered:', registration);
                    
                    // Listen for messages from service worker
                    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
                    
                    // Start API loop
                    startAPILoop();
                })
                .catch(error => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        }
        
        function startAPILoop() {
            if (apiLoopActive) return;
            apiLoopActive = true;
            
            document.getElementById('loopStatus').textContent = 'Active';
            
            // API loop every 30 seconds
            setInterval(async () => {
                try {
                    const response = await fetch('${this.distributionConfig.masterAPI}/api/pwa/heartbeat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-PWA-ID': '${appId}',
                            'X-Install-Source': 'recursive-pwa'
                        },
                        body: JSON.stringify({
                            app_id: '${appId}',
                            timestamp: Date.now(),
                            user_activity: getUserActivity(),
                            spawn_opportunities: getSpawnOpportunities()
                        })
                    });
                    
                    if (response.ok) {
                        apiCallCount++;
                        document.getElementById('apiCalls').textContent = apiCallCount;
                        
                        const data = await response.json();
                        handleAPIResponse(data);
                    }
                } catch (error) {
                    console.warn('💔 API loop failed:', error);
                    document.getElementById('loopStatus').textContent = 'Reconnecting...';
                    
                    setTimeout(() => {
                        document.getElementById('loopStatus').textContent = 'Active';
                    }, 5000);
                }
            }, 30000);
        }
        
        function handleServiceWorkerMessage(event) {
            const { data } = event;
            
            if (data.type === 'SUGGEST_PWA_INSTALL') {
                showSpawnSuggestion(data.app_id, data.reason);
            }
        }
        
        function handleAPIResponse(data) {
            // Handle spawn recommendations from API
            if (data.spawn_recommendations && data.spawn_recommendations.length > 0) {
                data.spawn_recommendations.forEach(rec => {
                    showSpawnSuggestion(rec.app_id, rec.reason);
                });
            }
            
            // Update viral coefficient if provided
            if (data.viral_config) {
                updateViralConfig(data.viral_config);
            }
        }
        
        function showSpawnSuggestion(appId, reason) {
            console.log(\`🦠 Spawn suggestion: \${appId} (reason: \${reason})\`);
            
            spawnCount++;
            document.getElementById('spawnCount').textContent = spawnCount;
            
            // Show spawn notification
            showNotification(\`🦠 New PWA Available: \${appId}\`, \`Suggested based on: \${reason}\`);
        }
        
        function showNotification(title, message) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: '/icons/${appId}-144.png',
                    badge: '/icons/${appId}-72.png'
                });
            }
        }
        
        function startApp() {
            console.log('🎯 Starting ${app.name}...');
            
            // Initialize app-specific functionality
            initializeAppFeatures();
            
            // Track app usage
            trackAppUsage('app_started');
        }
        
        function showViralOptions() {
            const suggestions = document.getElementById('spawnSuggestions');
            suggestions.style.display = suggestions.style.display === 'none' ? 'block' : 'none';
            
            if (suggestions.style.display === 'block') {
                populateSpawnGrid();
            }
        }
        
        function populateSpawnGrid() {
            const spawnableApps = ${JSON.stringify(app.can_spawn)};
            const allApps = ${JSON.stringify(this.distributionConfig.microApps)};
            const grid = document.getElementById('spawnGrid');
            
            grid.innerHTML = spawnableApps.map(appId => {
                if (appId === 'all') {
                    return Object.entries(allApps).map(([id, app]) => createSpawnCard(id, app)).join('');
                } else if (allApps[appId]) {
                    return createSpawnCard(appId, allApps[appId]);
                }
                return '';
            }).join('');
        }
        
        function createSpawnCard(appId, app) {
            return \`
                <div class="spawn-card" onclick="installPWA('\${appId}')">
                    <div style="font-size: 2em; margin-bottom: 10px;">\${app.icon}</div>
                    <h4 style="margin: 0 0 5px 0; color: #00ccff;">\${app.name}</h4>
                    <p style="margin: 0; font-size: 0.9em; color: #aaa;">\${app.description}</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.8em; color: #ffff00;">Size: \${app.size}</p>
                </div>
            \`;
        }
        
        async function installPWA(appId) {
            console.log(\`📱 Installing PWA: \${appId}\`);
            
            // Track viral installation
            await fetch('${this.distributionConfig.masterAPI}/api/pwa/viral-install', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source_app: '${appId}',
                    target_app: appId,
                    timestamp: Date.now(),
                    viral_path: getViralPath()
                })
            });
            
            // Open PWA
            window.open(\`/\${appId}?source=${appId}&depth=\${getCurrentDepth() + 1}\`, '_blank');
            
            spawnCount++;
            document.getElementById('spawnCount').textContent = spawnCount;
        }
        
        function initializeAppFeatures() {
            // App-specific initialization would go here
            // This varies based on which PWA this is
            console.log('🎯 ${app.name} features initialized');
        }
        
        function getUserActivity() {
            return {
                time_spent: performance.now() / 1000,
                clicks: Math.floor(Math.random() * 10),
                scrolls: Math.floor(Math.random() * 20),
                ${app.spawn_triggers.map(trigger => `${trigger}: Math.random()`).join(',\n                ')}
            };
        }
        
        function getSpawnOpportunities() {
            return {
                current_depth: getCurrentDepth(),
                available_spawns: ${JSON.stringify(app.can_spawn)},
                viral_potential: Math.random() * 2.3
            };
        }
        
        function getCurrentDepth() {
            const urlParams = new URLSearchParams(window.location.search);
            return parseInt(urlParams.get('depth') || '0');
        }
        
        function getViralPath() {
            const urlParams = new URLSearchParams(window.location.search);
            const source = urlParams.get('source') || 'direct';
            const depth = getCurrentDepth();
            
            return {
                source,
                depth,
                path: window.location.pathname,
                timestamp: Date.now()
            };
        }
        
        function trackAppUsage(action) {
            fetch('${this.distributionConfig.masterAPI}/api/pwa/usage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    app_id: '${appId}',
                    action,
                    timestamp: Date.now(),
                    user_activity: getUserActivity()
                })
            }).catch(error => console.warn('Failed to track usage:', error));
        }
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        console.log('🚀 ${app.name} PWA loaded');
        console.log('🔗 API loop starting...');
        console.log('🦠 Viral distribution ready');
    </script>
</body>
</html>`;
    }
    
    initializeAPILoopMonitoring() {
        console.log('🔗 Initializing API loop monitoring...');
        
        // Track all PWA heartbeats
        this.apiLoopMonitor = {
            heartbeats: new Map(),
            lastHeartbeat: new Map(),
            failedLoops: new Map(),
            
            recordHeartbeat: (pwaId, data) => {
                const timestamp = Date.now();
                
                if (!this.apiLoopMonitor.heartbeats.has(pwaId)) {
                    this.apiLoopMonitor.heartbeats.set(pwaId, []);
                }
                
                this.apiLoopMonitor.heartbeats.get(pwaId).push({
                    timestamp,
                    data
                });
                
                this.apiLoopMonitor.lastHeartbeat.set(pwaId, timestamp);
                
                // Update stats
                this.installationStats.api_calls_per_minute++;
                
                console.log(`💓 Heartbeat: ${pwaId} (${data.user_activity ? 'active' : 'idle'})`);
            },
            
            checkStaleLoops: () => {
                const now = Date.now();
                const staleThreshold = 60000; // 1 minute
                
                for (const [pwaId, lastHeartbeat] of this.apiLoopMonitor.lastHeartbeat) {
                    if (now - lastHeartbeat > staleThreshold) {
                        console.warn(`⚠️ Stale API loop: ${pwaId} (${Math.floor((now - lastHeartbeat) / 1000)}s ago)`);
                        
                        const failCount = this.apiLoopMonitor.failedLoops.get(pwaId) || 0;
                        this.apiLoopMonitor.failedLoops.set(pwaId, failCount + 1);
                    }
                }
            }
        };
        
        // Check for stale loops every minute
        setInterval(() => {
            this.apiLoopMonitor.checkStaleLoops();
        }, 60000);
        
        console.log('🔗 API loop monitoring active');
    }
    
    setupViralTracking() {
        console.log('🦠 Setting up viral distribution tracking...');
        
        this.viralTracker = {
            installations: new Map(),
            referralChains: new Map(),
            viralPaths: [],
            
            trackInstallation: (installData) => {
                const { app_id, source, depth, timestamp } = installData;
                
                // Record installation
                this.viralTracker.installations.set(`${app_id}_${timestamp}`, installData);
                
                // Update depth distribution
                if (!this.installationStats.depth_distribution.has(depth)) {
                    this.installationStats.depth_distribution.set(depth, 0);
                }
                this.installationStats.depth_distribution.set(depth, 
                    this.installationStats.depth_distribution.get(depth) + 1
                );
                
                // Track viral path
                if (source !== 'direct') {
                    this.viralTracker.viralPaths.push({
                        from: source,
                        to: app_id,
                        depth,
                        timestamp
                    });
                    
                    // Update viral spread rate
                    this.calculateViralSpreadRate();
                }
                
                // Update stats
                this.installationStats.total_installs++;
                this.installationStats.active_pwas++;
                
                console.log(`🦠 Viral installation: ${source} → ${app_id} (depth: ${depth})`);
            },
            
            trackViralInstallation: (viralData) => {
                const { source_app, target_app, viral_path } = viralData;
                
                // Record viral chain
                if (!this.viralTracker.referralChains.has(source_app)) {
                    this.viralTracker.referralChains.set(source_app, []);
                }
                
                this.viralTracker.referralChains.get(source_app).push({
                    target: target_app,
                    path: viral_path,
                    timestamp: Date.now()
                });
                
                console.log(`🔗 Viral chain: ${source_app} spawned ${target_app}`);
            }
        };
        
        this.calculateViralSpreadRate();
        
        console.log('🦠 Viral tracking ready');
    }
    
    calculateViralSpreadRate() {
        const totalInstalls = this.installationStats.total_installs;
        const viralInstalls = this.viralTracker.viralPaths.length;
        
        if (totalInstalls > 0) {
            this.installationStats.viral_spread_rate = viralInstalls / totalInstalls;
        }
    }
    
    setupDistributionAnalytics() {
        console.log('📊 Setting up distribution analytics...');
        
        this.analytics = {
            generateReport: () => {
                const report = {
                    timestamp: Date.now(),
                    
                    // Installation metrics
                    installations: {
                        total: this.installationStats.total_installs,
                        active: this.installationStats.active_pwas,
                        by_app: this.getInstallationsByApp(),
                        by_depth: Array.from(this.installationStats.depth_distribution.entries())
                    },
                    
                    // API loop metrics
                    api_loops: {
                        total_calls: this.installationStats.api_calls_per_minute,
                        active_loops: this.apiLoopMonitor.lastHeartbeat.size,
                        failed_loops: Array.from(this.apiLoopMonitor.failedLoops.entries()),
                        heartbeat_frequency: this.calculateHeartbeatFrequency()
                    },
                    
                    // Viral metrics
                    viral_distribution: {
                        spread_rate: this.installationStats.viral_spread_rate,
                        viral_coefficient: this.distributionConfig.spawning_rules.viral_coefficient,
                        successful_chains: this.viralTracker.viralPaths.length,
                        top_spawners: this.getTopSpawningApps()
                    },
                    
                    // Network health
                    network_health: {
                        distribution_efficiency: this.calculateDistributionEfficiency(),
                        api_load: this.calculateAPILoad(),
                        propagation_speed: this.calculatePropagationSpeed()
                    }
                };
                
                return report;
            },
            
            logReport: () => {
                const report = this.analytics.generateReport();
                
                console.log('📊 Distribution Analytics Report:');
                console.log(`   Total Installs: ${report.installations.total}`);
                console.log(`   Active PWAs: ${report.installations.active}`);
                console.log(`   API Calls/Min: ${report.api_loops.total_calls}`);
                console.log(`   Viral Rate: ${(report.viral_distribution.spread_rate * 100).toFixed(1)}%`);
                console.log(`   Network Health: ${(report.network_health.distribution_efficiency * 100).toFixed(1)}%`);
                
                this.emit('analytics_report', report);
                
                return report;
            }
        };
        
        // Generate analytics report every 5 minutes
        setInterval(() => {
            this.analytics.logReport();
        }, 300000);
        
        console.log('📊 Distribution analytics ready');
    }
    
    // Utility methods
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    
    getInstallationsByApp() {
        const byApp = {};
        
        for (const [key, install] of this.viralTracker.installations) {
            const appId = install.app_id;
            byApp[appId] = (byApp[appId] || 0) + 1;
        }
        
        return byApp;
    }
    
    calculateHeartbeatFrequency() {
        const recentHeartbeats = Array.from(this.apiLoopMonitor.lastHeartbeat.values())
            .filter(timestamp => Date.now() - timestamp < 300000); // Last 5 minutes
        
        return recentHeartbeats.length / 5; // Per minute
    }
    
    getTopSpawningApps() {
        const spawners = {};
        
        for (const [sourceApp, targets] of this.viralTracker.referralChains) {
            spawners[sourceApp] = targets.length;
        }
        
        return Object.entries(spawners)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
    }
    
    calculateDistributionEfficiency() {
        const totalInstalls = this.installationStats.total_installs;
        const viralInstalls = this.viralTracker.viralPaths.length;
        
        if (totalInstalls === 0) return 0;
        
        // Efficiency = viral installs / total installs
        return viralInstalls / totalInstalls;
    }
    
    calculateAPILoad() {
        const activeLoops = this.apiLoopMonitor.lastHeartbeat.size;
        const callsPerMinute = this.installationStats.api_calls_per_minute;
        
        return {
            active_loops: activeLoops,
            calls_per_minute: callsPerMinute,
            load_factor: callsPerMinute / (activeLoops * 2) // Expected 2 calls per minute per PWA
        };
    }
    
    calculatePropagationSpeed() {
        const recentInstalls = Array.from(this.viralTracker.installations.values())
            .filter(install => Date.now() - install.timestamp < 3600000) // Last hour
            .length;
        
        return recentInstalls; // Installs per hour
    }
    
    // API Methods
    async handlePWAHeartbeat(pwaId, data) {
        this.apiLoopMonitor.recordHeartbeat(pwaId, data);
        
        // Generate spawn recommendations based on user activity
        const recommendations = this.generateSpawnRecommendations(pwaId, data);
        
        return {
            status: 'ok',
            timestamp: Date.now(),
            spawn_recommendations: recommendations,
            viral_config: {
                coefficient: this.distributionConfig.spawning_rules.viral_coefficient,
                max_depth: this.distributionConfig.spawning_rules.max_depth
            }
        };
    }
    
    generateSpawnRecommendations(pwaId, userData) {
        const app = this.distributionConfig.microApps[pwaId];
        if (!app) return [];
        
        const recommendations = [];
        const userActivity = userData.user_activity || {};
        
        // Check spawn triggers
        for (const trigger of app.spawn_triggers) {
            if (userActivity[trigger] > 0.6) { // High activity in this area
                // Suggest spawnable apps
                for (const spawnableApp of app.can_spawn) {
                    if (spawnableApp !== 'all' && this.distributionConfig.microApps[spawnableApp]) {
                        recommendations.push({
                            app_id: spawnableApp,
                            reason: trigger,
                            confidence: userActivity[trigger],
                            priority: Math.random() > 0.5 ? 'high' : 'medium'
                        });
                    }
                }
            }
        }
        
        return recommendations.slice(0, 3); // Max 3 recommendations
    }
    
    async handlePWAInstallation(installData) {
        this.viralTracker.trackInstallation(installData);
        
        return {
            success: true,
            install_id: `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recommendations: this.generateSpawnRecommendations(installData.app_id, installData)
        };
    }
    
    async handleViralInstallation(viralData) {
        this.viralTracker.trackViralInstallation(viralData);
        
        return {
            success: true,
            viral_score: this.calculateViralScore(viralData),
            tokens_earned: this.calculateTokensEarned(viralData)
        };
    }
    
    calculateViralScore(viralData) {
        const depth = viralData.viral_path.depth || 0;
        const baseScore = 100;
        const depthMultiplier = Math.pow(1.5, depth); // Exponential reward for deeper installs
        
        return Math.floor(baseScore * depthMultiplier);
    }
    
    calculateTokensEarned(viralData) {
        const viralScore = this.calculateViralScore(viralData);
        return viralScore * 10; // 10 DGAI tokens per viral point
    }
    
    getDistributionStatus() {
        return {
            network_stats: this.installationStats,
            distribution_config: this.distributionConfig,
            active_loops: this.apiLoopMonitor.lastHeartbeat.size,
            viral_chains: this.viralTracker.referralChains.size,
            system_health: this.calculateSystemHealth()
        };
    }
    
    calculateSystemHealth() {
        const efficiency = this.calculateDistributionEfficiency();
        const apiLoad = this.calculateAPILoad();
        const propagationSpeed = this.calculatePropagationSpeed();
        
        // Overall health score (0-1)
        const healthScore = (efficiency + (apiLoad.load_factor > 0.5 ? 1 : 0) + (propagationSpeed > 0 ? 1 : 0)) / 3;
        
        return {
            score: healthScore,
            status: healthScore > 0.7 ? 'excellent' : healthScore > 0.4 ? 'good' : 'needs_improvement',
            distribution_efficiency: efficiency,
            api_performance: apiLoad,
            propagation_rate: propagationSpeed
        };
    }
}

// Export for use
module.exports = PWARecursiveDistributionSystem;

// If run directly, start the service
if (require.main === module) {
    console.log('🌐 Starting PWA Recursive Distribution System...');
    
    const pwaSystem = new PWARecursiveDistributionSystem();
    
    // Set up Express API
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 9710;
    
    app.use(express.json());
    
    // Serve PWA manifests
    app.get('/pwa-manifests/:appId.json', (req, res) => {
        const manifestPath = path.join(__dirname, 'pwa-manifests', `${req.params.appId}.json`);
        if (fs.existsSync(manifestPath)) {
            res.sendFile(manifestPath);
        } else {
            res.status(404).json({ error: 'Manifest not found' });
        }
    });
    
    // Serve service workers
    app.get('/pwa-service-workers/:appId-sw.js', (req, res) => {
        const swPath = path.join(__dirname, 'pwa-service-workers', `${req.params.appId}-sw.js`);
        if (fs.existsSync(swPath)) {
            res.setHeader('Content-Type', 'application/javascript');
            res.sendFile(swPath);
        } else {
            res.status(404).send('Service worker not found');
        }
    });
    
    // Serve PWA pages
    app.get('/:appId', (req, res) => {
        const appId = req.params.appId;
        const pagePath = path.join(__dirname, 'pwa-pages', `${appId}.html`);
        
        if (fs.existsSync(pagePath)) {
            res.sendFile(pagePath);
        } else {
            res.status(404).send('PWA not found');
        }
    });
    
    // Serve master installation page
    app.get('/', (req, res) => {
        const indexPath = path.join(__dirname, 'pwa-pages', 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.send('<h1>PWA Distribution Network</h1><p>System initializing...</p>');
        }
    });
    
    // PWA heartbeat endpoint
    app.post('/api/pwa/heartbeat', async (req, res) => {
        try {
            const { app_id } = req.body;
            const pwaId = req.headers['x-pwa-id'] || app_id;
            
            const response = await pwaSystem.handlePWAHeartbeat(pwaId, req.body);
            res.json(response);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // PWA installation tracking
    app.post('/api/pwa/install', async (req, res) => {
        try {
            const response = await pwaSystem.handlePWAInstallation(req.body);
            res.json(response);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // Viral installation tracking
    app.post('/api/pwa/viral-install', async (req, res) => {
        try {
            const response = await pwaSystem.handleViralInstallation(req.body);
            res.json(response);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // Get distribution status
    app.get('/api/pwa/status', (req, res) => {
        const status = pwaSystem.getDistributionStatus();
        res.json(status);
    });
    
    // Get analytics report
    app.get('/api/pwa/analytics', (req, res) => {
        const report = pwaSystem.analytics.generateReport();
        res.json(report);
    });
    
    app.listen(port, () => {
        console.log(`🌐 PWA Recursive Distribution System running on port ${port}`);
        console.log(`📱 PWA Manifests: GET http://localhost:${port}/pwa-manifests/{appId}.json`);
        console.log(`⚙️ Service Workers: GET http://localhost:${port}/pwa-service-workers/{appId}-sw.js`);
        console.log(`🔗 PWA Heartbeat: POST http://localhost:${port}/api/pwa/heartbeat`);
        console.log(`📊 Analytics: GET http://localhost:${port}/api/pwa/analytics`);
        console.log(`🦠 VIRAL DISTRIBUTION NETWORK ACTIVE!`);
    });
}
#!/usr/bin/env node

/**
 * 🎨 Visual API Service
 * 
 * REST API server for the Dynamic Visual Generation Engine
 * Serves the Ultimate Economic Ecosystem Hub
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const DynamicVisualGenerationEngine = require('./dynamic-visual-generation-engine');

class VisualAPIService {
    constructor(options = {}) {
        this.options = {
            port: options.port || 3030,
            corsOrigins: options.corsOrigins || ['*'],
            rateLimit: options.rateLimit || { windowMs: 15 * 60 * 1000, max: 100 },
            ...options
        };

        this.app = express();
        this.visualEngine = new DynamicVisualGenerationEngine(options.engineConfig);
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // CORS
        this.app.use(cors({
            origin: this.options.corsOrigins,
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: this.options.rateLimit.windowMs,
            max: this.options.rateLimit.max,
            message: {
                error: 'Too many requests, please try again later',
                limit: this.options.rateLimit.max,
                window: '15 minutes'
            }
        });
        this.app.use('/api/', limiter);

        // JSON parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`🎨 ${req.method} ${req.url} - ${new Date().toISOString()}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Visual API Service',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                stats: this.visualEngine.getUsageStats()
            });
        });

        // API Routes
        this.setupAPIRoutes();
        
        // Serve static demo page
        this.app.get('/', this.serveDemoPage.bind(this));
    }

    setupAPIRoutes() {
        const api = express.Router();

        // Generate contextual background
        api.get('/background/:context', async (req, res) => {
            try {
                const { context } = req.params;
                const { mood = 'professional', size = '1920x1080' } = req.query;

                const background = await this.visualEngine.generateContextualBackground(
                    context, mood, size
                );

                res.json({
                    success: true,
                    background,
                    context,
                    mood,
                    size,
                    generated_at: new Date().toISOString()
                });

            } catch (error) {
                console.error('Background generation error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get multiple images for context
        api.get('/gallery/:context', async (req, res) => {
            try {
                const { context } = req.params;
                const { 
                    count = 5, 
                    mood = 'professional',
                    size = '800x600'
                } = req.query;

                const images = await this.visualEngine.getImagesForContext(
                    context, 
                    parseInt(count), 
                    mood
                );

                res.json({
                    success: true,
                    images,
                    context,
                    mood,
                    count: images.length,
                    generated_at: new Date().toISOString()
                });

            } catch (error) {
                console.error('Gallery generation error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Generate trading card
        api.post('/trading-card', async (req, res) => {
            try {
                const cardData = req.body;

                // Validate required fields
                if (!cardData.name) {
                    return res.status(400).json({
                        success: false,
                        error: 'Name is required for trading card generation'
                    });
                }

                const tradingCard = await this.visualEngine.generateTradingCard(cardData);

                res.json({
                    success: true,
                    trading_card: tradingCard,
                    generated_at: new Date().toISOString()
                });

            } catch (error) {
                console.error('Trading card generation error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Generate viral content
        api.post('/viral-content', async (req, res) => {
            try {
                const { 
                    content_type = 'post', 
                    theme, 
                    custom_text = '' 
                } = req.body;

                if (!theme) {
                    return res.status(400).json({
                        success: false,
                        error: 'Theme is required for viral content generation'
                    });
                }

                const viralContent = await this.visualEngine.generateViralContent(
                    content_type, 
                    theme, 
                    custom_text
                );

                res.json({
                    success: true,
                    viral_content: viralContent,
                    generated_at: new Date().toISOString()
                });

            } catch (error) {
                console.error('Viral content generation error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // DJ Background rotation
        api.get('/dj-rotation/:system', async (req, res) => {
            try {
                const { system } = req.params;
                const { tempo = 128 } = req.query;

                const rotation = await this.visualEngine.getBackgroundRotation(
                    system, 
                    parseInt(tempo)
                );

                res.json({
                    success: true,
                    rotation,
                    system,
                    tempo: parseInt(tempo),
                    generated_at: new Date().toISOString()
                });

            } catch (error) {
                console.error('DJ rotation generation error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get usage statistics
        api.get('/stats', (req, res) => {
            res.json({
                success: true,
                stats: this.visualEngine.getUsageStats(),
                service_uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });

        // Clear cache (admin only)
        api.post('/admin/clear-cache', (req, res) => {
            // In production, add authentication here
            this.visualEngine.clearCache();
            
            res.json({
                success: true,
                message: 'Cache cleared successfully',
                timestamp: new Date().toISOString()
            });
        });

        // Preload context
        api.post('/admin/preload/:context', async (req, res) => {
            try {
                const { context } = req.params;
                const { count = 10 } = req.body;

                const images = await this.visualEngine.preloadContext(context, count);

                res.json({
                    success: true,
                    message: `Preloaded ${images.length} images for ${context}`,
                    context,
                    images_loaded: images.length,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Preload error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Batch operations
        api.post('/batch/backgrounds', async (req, res) => {
            try {
                const { requests } = req.body;

                if (!Array.isArray(requests)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Requests must be an array'
                    });
                }

                const results = [];

                for (const request of requests) {
                    try {
                        const background = await this.visualEngine.generateContextualBackground(
                            request.context,
                            request.mood || 'professional',
                            request.size || '1920x1080'
                        );
                        
                        results.push({
                            success: true,
                            request,
                            background
                        });
                    } catch (error) {
                        results.push({
                            success: false,
                            request,
                            error: error.message
                        });
                    }
                }

                res.json({
                    success: true,
                    results,
                    total_requests: requests.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    generated_at: new Date().toISOString()
                });

            } catch (error) {
                console.error('Batch operation error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.use('/api', api);
    }

    serveDemoPage(req, res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🎨 Visual API Service - Demo</title>
    <style>
        body {
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e);
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .api-section {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .endpoint {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            font-family: 'Monaco', monospace;
        }
        .method {
            background: #00ff88;
            color: #000;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            margin-right: 10px;
        }
        .demo-image {
            max-width: 300px;
            border-radius: 8px;
            margin: 10px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .stat-card {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #00ff88;
        }
        button {
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        }
        #demoResults {
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 8px;
            min-height: 100px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Visual API Service</h1>
            <p>Dynamic image generation for the Ultimate Economic Ecosystem</p>
        </div>

        <div class="api-section">
            <h2>📋 Available Endpoints</h2>
            
            <div class="endpoint">
                <span class="method">GET</span>/api/background/:context?mood=professional&size=1920x1080
                <p>Generate contextual background for trading, music, sports, etc.</p>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span>/api/gallery/:context?count=5&mood=professional
                <p>Get multiple images for image galleries and carousels</p>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span>/api/trading-card
                <p>Generate trading card with user data and rarity effects</p>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span>/api/viral-content
                <p>Create viral marketing content with optimal hashtags</p>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span>/api/dj-rotation/:system?tempo=128
                <p>Get background rotation for DJ interface synced to BPM</p>
            </div>
        </div>

        <div class="api-section">
            <h2>🚀 Live Demo</h2>
            <button onclick="demoBackground('trading')">Trading Background</button>
            <button onclick="demoBackground('music')">Music Background</button>
            <button onclick="demoBackground('sports')">Sports Background</button>
            <button onclick="demoGallery('founders')">Founders Gallery</button>
            <button onclick="demoTradingCard()">Trading Card</button>
            <button onclick="demoViralContent()">Viral Content</button>
            <button onclick="loadStats()">Load Stats</button>
            
            <div id="demoResults"></div>
        </div>

        <div class="api-section">
            <h2>📊 Live Statistics</h2>
            <div class="stats" id="statsContainer">
                <div class="stat-card">
                    <div class="stat-value" id="totalRequests">Loading...</div>
                    <div>Total Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="cacheHits">Loading...</div>
                    <div>Cache Hit Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="cacheSize">Loading...</div>
                    <div>Cache Size</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="apiCalls">Loading...</div>
                    <div>API Calls</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function demoBackground(context) {
            try {
                const response = await fetch(\`/api/background/\${context}?mood=energetic\`);
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('demoResults').innerHTML = \`
                        <h3>🖼️ Generated \${context} Background</h3>
                        <img src="\${data.background.url}" class="demo-image" alt="\${context} background">
                        <p><strong>Description:</strong> \${data.background.description || 'N/A'}</p>
                        <p><strong>Photographer:</strong> \${data.background.photographer || 'N/A'}</p>
                        <p><strong>Source:</strong> \${data.background.source}</p>
                        <p><strong>Generated:</strong> \${data.generated_at}</p>
                    \`;
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                document.getElementById('demoResults').innerHTML = \`
                    <h3>❌ Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function demoGallery(context) {
            try {
                const response = await fetch(\`/api/gallery/\${context}?count=3\`);
                const data = await response.json();
                
                if (data.success) {
                    const images = data.images.map(img => 
                        \`<img src="\${img.url}" class="demo-image" alt="\${context}">\`
                    ).join('');
                    
                    document.getElementById('demoResults').innerHTML = \`
                        <h3>🖼️ \${context} Gallery (\${data.images.length} images)</h3>
                        <div>\${images}</div>
                    \`;
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                document.getElementById('demoResults').innerHTML = \`
                    <h3>❌ Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function demoTradingCard() {
            try {
                const cardData = {
                    name: 'Demo Trader',
                    title: 'Epic Algorithm',
                    rarity: 'epic',
                    context: 'trading',
                    stats: {
                        accuracy: '92.3%',
                        profit: '+156%',
                        trades: '5,432'
                    }
                };

                const response = await fetch('/api/trading-card', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('demoResults').innerHTML = \`
                        <h3>🃏 Trading Card Generated</h3>
                        <div style="background: url('\${data.trading_card.background_image}'); background-size: cover; padding: 20px; border-radius: 12px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                            <h4>\${data.trading_card.name}</h4>
                            <p>\${data.trading_card.title}</p>
                            <p>Rarity: \${data.trading_card.rarity}</p>
                            <p>Stats: \${JSON.stringify(data.trading_card.stats, null, 2)}</p>
                        </div>
                        <p><strong>Effects:</strong> \${data.trading_card.effects?.join(', ') || 'None'}</p>
                    \`;
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                document.getElementById('demoResults').innerHTML = \`
                    <h3>❌ Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function demoViralContent() {
            try {
                const contentData = {
                    content_type: 'meme',
                    theme: 'trading',
                    custom_text: 'When your portfolio goes up 0.1%'
                };

                const response = await fetch('/api/viral-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contentData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('demoResults').innerHTML = \`
                        <h3>📱 Viral Content Generated</h3>
                        <img src="\${data.viral_content.background_image}" class="demo-image" alt="viral content">
                        <p><strong>Type:</strong> \${data.viral_content.type}</p>
                        <p><strong>Theme:</strong> \${data.viral_content.theme}</p>
                        <p><strong>Text:</strong> \${data.viral_content.text_overlay}</p>
                        <p><strong>Hashtags:</strong> \${data.viral_content.suggested_hashtags?.join(' ') || 'None'}</p>
                        <p><strong>Optimal Time:</strong> \${data.viral_content.optimal_posting_time}</p>
                        <p><strong>Engagement Prediction:</strong> \${(data.viral_content.engagement_prediction * 100).toFixed(1)}%</p>
                    \`;
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                document.getElementById('demoResults').innerHTML = \`
                    <h3>❌ Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('totalRequests').textContent = data.stats.totalRequests;
                    document.getElementById('cacheHits').textContent = data.stats.hit_rate;
                    document.getElementById('cacheSize').textContent = data.stats.cache_size;
                    document.getElementById('apiCalls').textContent = data.stats.apiCalls;
                    
                    document.getElementById('demoResults').innerHTML = \`
                        <h3>📊 Statistics Updated</h3>
                        <pre>\${JSON.stringify(data.stats, null, 2)}</pre>
                    \`;
                }
            } catch (error) {
                document.getElementById('demoResults').innerHTML = \`
                    <h3>❌ Error Loading Stats</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        // Auto-load stats on page load
        loadStats();
        
        // Refresh stats every 30 seconds
        setInterval(loadStats, 30000);
    </script>
</body>
</html>`;

        res.send(html);
    }

    async start() {
        return new Promise((resolve) => {
            const server = this.app.listen(this.options.port, () => {
                console.log(`🎨 Visual API Service running on port ${this.options.port}`);
                console.log(`📊 Demo page: http://localhost:${this.options.port}`);
                console.log(`🔗 API base: http://localhost:${this.options.port}/api`);
                resolve(server);
            });
        });
    }
}

module.exports = VisualAPIService;

// Start server if run directly
if (require.main === module) {
    const service = new VisualAPIService({
        port: process.env.PORT || 3030,
        engineConfig: {
            unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY,
            splashApiKey: process.env.SPLASH_API_KEY
        }
    });

    service.start().then(() => {
        console.log('🚀 Visual API Service started successfully');
    }).catch(error => {
        console.error('❌ Failed to start Visual API Service:', error);
        process.exit(1);
    });
}
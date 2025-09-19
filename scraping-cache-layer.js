#!/usr/bin/env node

/**
 * 🌐 SCRAPING & CACHING LAYER
 * Speeds up your 300+ domain empire by pre-caching frequently visited sites
 * Works from both client and server side as requested
 * Internal DB for lightning-fast lookups
 */

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class ScrapingCacheLayer extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 7776;
        
        // Your 300+ domain empire
        this.domainEmpire = [
            'deathtodata.com', 'soulfra.com', 'soulfra.ai',
            'pimpmychrome.com', 'shiprekt.com',
            'vcbash.com', 'ycbash.com',
            'saveorsink.com', 'dealordelete.com', 'cringeproof.com'
        ];
        
        // Initialize database
        this.dbPath = './cache-empire.db';
        this.initDatabase();
        
        // Cache statistics
        this.stats = {
            totalCached: 0,
            hitCount: 0,
            missCount: 0,
            domainHits: {},
            startTime: Date.now()
        };
        
        // Gaming elements for your caching system
        this.gameElements = {
            cache_hit: '🎯',
            cache_miss: '❌', 
            scrape_success: '🕷️',
            speed_boost: '⚡',
            empire_sync: '🌐',
            database_save: '💾'
        };
        
        console.log('🕷️ Scraping & Caching Layer Initializing...');
        console.log('💾 Building internal DB for your 300+ domain empire');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startBackgroundTasks();
    }
    
    initDatabase() {
        this.db = new sqlite3.Database(this.dbPath);
        
        // Create tables for caching system
        this.db.serialize(() => {
            // Main cache table
            this.db.run(`CREATE TABLE IF NOT EXISTS site_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                domain TEXT,
                title TEXT,
                content TEXT,
                metadata TEXT,
                hash TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                access_count INTEGER DEFAULT 0,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                cache_score INTEGER DEFAULT 0
            )`);
            
            // Frequent sites tracking
            this.db.run(`CREATE TABLE IF NOT EXISTS frequent_sites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT UNIQUE,
                visit_count INTEGER DEFAULT 0,
                last_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
                cache_priority INTEGER DEFAULT 0,
                empire_member BOOLEAN DEFAULT FALSE
            )`);
            
            // Gaming statistics
            this.db.run(`CREATE TABLE IF NOT EXISTS cache_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                domain TEXT,
                url TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                response_time INTEGER,
                cache_hit BOOLEAN,
                user_agent TEXT
            )`);
            
            // Pre-populate with your empire domains
            this.domainEmpire.forEach(domain => {
                this.db.run(`INSERT OR IGNORE INTO frequent_sites 
                    (domain, cache_priority, empire_member) 
                    VALUES (?, 100, TRUE)`, [domain]);
            });
        });
        
        console.log('💾 Internal database initialized');
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS for cross-domain empire
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // Request logging with gaming elements
        this.app.use((req, res, next) => {
            console.log(`${this.gameElements.empire_sync} ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'scraping-cache-layer',
                port: this.port,
                stats: this.stats,
                empire_domains: this.domainEmpire.length
            });
        });
        
        // Get cached site (main endpoint)
        this.app.get('/api/cache/:encodedUrl', async (req, res) => {
            try {
                const url = decodeURIComponent(req.params.encodedUrl);
                const startTime = Date.now();
                
                // Check cache first
                const cached = await this.getCachedSite(url);
                
                if (cached) {
                    this.stats.hitCount++;
                    this.recordCacheEvent('hit', url, Date.now() - startTime, true);
                    
                    console.log(`${this.gameElements.cache_hit} Cache HIT: ${url}`);
                    res.json({
                        source: 'cache',
                        cached: true,
                        ...cached,
                        performance: Date.now() - startTime
                    });
                } else {
                    // Cache miss - scrape and cache
                    this.stats.missCount++;
                    const scraped = await this.scrapeAndCache(url);
                    this.recordCacheEvent('miss', url, Date.now() - startTime, false);
                    
                    console.log(`${this.gameElements.cache_miss} Cache MISS: ${url} - Scraped and cached`);
                    res.json({
                        source: 'scraped',
                        cached: false,
                        ...scraped,
                        performance: Date.now() - startTime
                    });
                }
                
                // Track frequent sites
                await this.trackFrequentSite(url);
                
            } catch (error) {
                console.error('❌ Cache error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Force refresh cache
        this.app.post('/api/refresh/:encodedUrl', async (req, res) => {
            try {
                const url = decodeURIComponent(req.params.encodedUrl);
                console.log(`🔄 Force refresh: ${url}`);
                
                const scraped = await this.scrapeAndCache(url, true);
                res.json({ refreshed: true, ...scraped });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Bulk cache your empire domains
        this.app.post('/api/cache-empire', async (req, res) => {
            try {
                console.log('🏰 Caching entire domain empire...');
                const results = {};
                
                for (const domain of this.domainEmpire) {
                    try {
                        const url = `https://${domain}`;
                        const cached = await this.scrapeAndCache(url);
                        results[domain] = { success: true, title: cached.title };
                        console.log(`${this.gameElements.scrape_success} Cached ${domain}`);
                    } catch (error) {
                        results[domain] = { success: false, error: error.message };
                        console.log(`❌ Failed to cache ${domain}: ${error.message}`);
                    }
                }
                
                res.json({
                    message: 'Empire caching complete',
                    results,
                    totalDomains: this.domainEmpire.length
                });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get frequent sites
        this.app.get('/api/frequent', async (req, res) => {
            try {
                const frequent = await this.getFrequentSites();
                res.json({ frequent });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Cache statistics
        this.app.get('/api/stats', async (req, res) => {
            try {
                const dbStats = await this.getDatabaseStats();
                res.json({
                    runtime: this.stats,
                    database: dbStats,
                    empire: this.domainEmpire.length
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Search cached content
        this.app.get('/api/search/:query', async (req, res) => {
            try {
                const query = req.params.query;
                const results = await this.searchCachedContent(query);
                res.json({ query, results });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Cache dashboard
        this.app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
    }
    
    async getCachedSite(url) {
        return new Promise((resolve) => {
            this.db.get(`
                SELECT * FROM site_cache 
                WHERE url = ? AND updated_at > datetime('now', '-1 hour')
                ORDER BY updated_at DESC LIMIT 1
            `, [url], (err, row) => {
                if (err || !row) {
                    resolve(null);
                } else {
                    // Update access stats
                    this.db.run(`
                        UPDATE site_cache 
                        SET access_count = access_count + 1, 
                            last_accessed = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    `, [row.id]);
                    
                    resolve({
                        title: row.title,
                        content: row.content,
                        metadata: JSON.parse(row.metadata || '{}'),
                        cached_at: row.updated_at,
                        access_count: row.access_count + 1
                    });
                }
            });
        });
    }
    
    async scrapeAndCache(url, forceRefresh = false) {
        const startTime = Date.now();
        
        try {
            console.log(`${this.gameElements.scrape_success} Scraping: ${url}`);
            
            // Make request with proper headers
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': '300-Domain-Empire-Cache/1.0.0 (Gaming Enhancement Bot)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            const $ = cheerio.load(response.data);
            
            // Extract useful content
            const title = $('title').text().trim() || 'Untitled';
            const description = $('meta[name="description"]').attr('content') || '';
            
            // Clean and extract main content
            $('script, style, nav, header, footer, aside').remove();
            const mainContent = $('main, article, .content, #content, .post').first().text() || 
                              $('body').text().substring(0, 5000);
            
            // Extract metadata
            const metadata = {
                description,
                url: response.config.url || url,
                statusCode: response.status,
                contentLength: response.data.length,
                scrapedAt: new Date().toISOString(),
                responseTime: Date.now() - startTime,
                links: $('a[href]').map((_, el) => $(el).attr('href')).get().slice(0, 20),
                images: $('img[src]').map((_, el) => $(el).attr('src')).get().slice(0, 10),
                headings: $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().slice(0, 10)
            };
            
            // Generate content hash for change detection
            const hash = crypto.createHash('md5').update(mainContent).digest('hex');
            const domain = new URL(url).hostname;
            
            // Cache in database
            await this.saveCacheData(url, domain, title, mainContent, metadata, hash, forceRefresh);
            
            this.stats.totalCached++;
            console.log(`${this.gameElements.database_save} Cached: ${title} (${domain})`);
            
            return {
                title,
                content: mainContent.substring(0, 2000) + '...', // Truncate for API response
                metadata,
                hash,
                fresh: true,
                performance: Date.now() - startTime
            };
            
        } catch (error) {
            console.error(`❌ Scraping failed for ${url}:`, error.message);
            throw error;
        }
    }
    
    async saveCacheData(url, domain, title, content, metadata, hash, forceRefresh = false) {
        return new Promise((resolve, reject) => {
            const query = forceRefresh ? 
                `INSERT OR REPLACE INTO site_cache (url, domain, title, content, metadata, hash) VALUES (?, ?, ?, ?, ?, ?)` :
                `INSERT OR IGNORE INTO site_cache (url, domain, title, content, metadata, hash) VALUES (?, ?, ?, ?, ?, ?)`;
                
            this.db.run(query, [
                url, domain, title, content, JSON.stringify(metadata), hash
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }
    
    async trackFrequentSite(url) {
        const domain = new URL(url).hostname;
        
        this.db.run(`
            INSERT INTO frequent_sites (domain, visit_count, last_visit) 
            VALUES (?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(domain) DO UPDATE SET
                visit_count = visit_count + 1,
                last_visit = CURRENT_TIMESTAMP,
                cache_priority = MIN(visit_count * 10, 100)
        `, [domain]);
        
        // Update stats
        this.stats.domainHits[domain] = (this.stats.domainHits[domain] || 0) + 1;
    }
    
    async getFrequentSites(limit = 20) {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT domain, visit_count, last_visit, cache_priority, empire_member
                FROM frequent_sites 
                ORDER BY visit_count DESC, cache_priority DESC 
                LIMIT ?
            `, [limit], (err, rows) => {
                resolve(err ? [] : rows);
            });
        });
    }
    
    async getDatabaseStats() {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT 
                    (SELECT COUNT(*) FROM site_cache) as total_cached,
                    (SELECT COUNT(*) FROM frequent_sites) as tracked_domains,
                    (SELECT AVG(access_count) FROM site_cache) as avg_access_count,
                    (SELECT MAX(visit_count) FROM frequent_sites) as max_visits,
                    (SELECT COUNT(*) FROM frequent_sites WHERE empire_member = TRUE) as empire_domains
            `, (err, rows) => {
                resolve(err ? {} : rows[0]);
            });
        });
    }
    
    async searchCachedContent(query) {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT url, domain, title, 
                       substr(content, 1, 200) as preview,
                       access_count, last_accessed
                FROM site_cache 
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY access_count DESC 
                LIMIT 10
            `, [`%${query}%`, `%${query}%`], (err, rows) => {
                resolve(err ? [] : rows);
            });
        });
    }
    
    recordCacheEvent(eventType, url, responseTime, cacheHit) {
        try {
            const domain = new URL(url).hostname;
            const userAgent = 'Empire-Cache-Bot';
            
            this.db.run(`
                INSERT INTO cache_stats (event_type, domain, url, response_time, cache_hit, user_agent)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [eventType, domain, url, responseTime, cacheHit, userAgent]);
        } catch (error) {
            // Don't fail on logging errors
            console.warn('⚠️ Failed to record cache event:', error.message);
        }
    }
    
    startBackgroundTasks() {
        // Pre-cache your empire domains every hour
        setInterval(async () => {
            console.log('🏰 Background caching of empire domains...');
            
            for (const domain of this.domainEmpire) {
                try {
                    const url = `https://${domain}`;
                    await this.scrapeAndCache(url);
                    console.log(`${this.gameElements.speed_boost} Pre-cached ${domain}`);
                } catch (error) {
                    console.log(`⚠️ Could not pre-cache ${domain}: ${error.message}`);
                }
                
                // Don't overwhelm servers
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }, 3600000); // Every hour
        
        // Clean old cache entries
        setInterval(() => {
            this.db.run(`
                DELETE FROM site_cache 
                WHERE updated_at < datetime('now', '-24 hours') 
                AND access_count < 2
            `);
            console.log('🧹 Cleaned old cache entries');
        }, 6 * 3600000); // Every 6 hours
    }
    
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🕷️ Empire Scraping & Cache Layer</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff41; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border: 2px solid #00ff41; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
        .card { background: #1a1a1a; border: 1px solid #00ff41; padding: 20px; border-radius: 5px; }
        .card h3 { color: #00ff41; text-shadow: 0 0 10px #00ff41; margin-top: 0; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { color: #ffff00; font-weight: bold; }
        .button { background: #00ff41; color: #000; border: none; padding: 12px 24px; 
                  border-radius: 3px; cursor: pointer; margin: 5px; font-weight: bold; }
        .button:hover { background: #00cc33; box-shadow: 0 0 15px #00ff41; }
        .log { background: #000; color: #00ff41; padding: 15px; border-radius: 5px; 
               height: 200px; overflow-y: auto; font-family: monospace; }
        .empire { color: #ffd700; font-weight: bold; }
        .cache-hit { color: #00ff00; }
        .cache-miss { color: #ff6600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🕷️ EMPIRE SCRAPING & CACHE LAYER 🕷️</h1>
            <p>Accelerating your 300+ domain empire with intelligent caching</p>
            <p class="empire">Real-time cache system for lightning-fast site loading</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 Cache Performance</h3>
                <div class="metric">
                    <span>Total Cached:</span>
                    <span class="metric-value">${this.stats.totalCached}</span>
                </div>
                <div class="metric">
                    <span class="cache-hit">Cache Hits:</span>
                    <span class="metric-value cache-hit">${this.stats.hitCount}</span>
                </div>
                <div class="metric">
                    <span class="cache-miss">Cache Misses:</span>
                    <span class="metric-value cache-miss">${this.stats.missCount}</span>
                </div>
                <div class="metric">
                    <span>Hit Ratio:</span>
                    <span class="metric-value">${this.stats.hitCount + this.stats.missCount > 0 ? 
                        ((this.stats.hitCount / (this.stats.hitCount + this.stats.missCount)) * 100).toFixed(1) : 0}%</span>
                </div>
                <div class="metric">
                    <span>Uptime:</span>
                    <span class="metric-value">${Math.floor((Date.now() - this.stats.startTime) / 1000)}s</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🏰 Domain Empire</h3>
                <div class="metric">
                    <span>Empire Domains:</span>
                    <span class="metric-value empire">${this.domainEmpire.length}</span>
                </div>
                <div style="max-height: 150px; overflow-y: auto; margin: 10px 0;">
                    ${this.domainEmpire.map(domain => `<div>• ${domain}</div>`).join('')}
                </div>
                <button class="button" onclick="cacheEmpire()">🏰 Cache All Domains</button>
            </div>
            
            <div class="card">
                <h3>🎮 Gaming Controls</h3>
                <button class="button" onclick="getStats()">📊 Refresh Stats</button>
                <button class="button" onclick="getFrequent()">🔥 Top Sites</button>
                <button class="button" onclick="searchCache()">🔍 Search Cache</button>
                <button class="button" onclick="clearLog()">🧹 Clear Log</button>
            </div>
            
            <div class="card">
                <h3>🚀 Quick Cache</h3>
                <input type="url" id="quickUrl" placeholder="https://example.com" style="width: 70%; padding: 8px; background: #000; color: #00ff41; border: 1px solid #00ff41;">
                <button class="button" onclick="quickCache()">⚡ Cache</button>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h3>📡 System Log</h3>
            <div id="log" class="log">
                [${new Date().toLocaleTimeString()}] 🕷️ Empire Cache Layer Dashboard Active<br>
                [${new Date().toLocaleTimeString()}] 💾 Database: ${this.dbPath}<br>
                [${new Date().toLocaleTimeString()}] 🌐 Ready to accelerate your empire<br>
            </div>
        </div>
    </div>
    
    <script>
        const log = document.getElementById('log');
        
        function addLog(message) {
            const timestamp = new Date().toLocaleTimeString();
            log.innerHTML += \`[\${timestamp}] \${message}<br>\`;
            log.scrollTop = log.scrollHeight;
        }
        
        async function cacheEmpire() {
            addLog('🏰 Starting empire-wide caching...');
            try {
                const response = await fetch('/api/cache-empire', { method: 'POST' });
                const data = await response.json();
                addLog(\`✅ Empire caching complete: \${data.totalDomains} domains\`);
                
                Object.entries(data.results).forEach(([domain, result]) => {
                    if (result.success) {
                        addLog(\`  🎯 \${domain}: \${result.title}\`);
                    } else {
                        addLog(\`  ❌ \${domain}: Failed\`);
                    }
                });
            } catch (error) {
                addLog('❌ Empire caching failed: ' + error.message);
            }
        }
        
        async function getStats() {
            addLog('📊 Refreshing statistics...');
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                addLog(\`Stats: \${data.database.total_cached} cached, \${data.database.tracked_domains} domains tracked\`);
                addLog(\`Empire Status: \${data.database.empire_domains}/\${data.empire} domains active\`);
            } catch (error) {
                addLog('❌ Failed to get stats: ' + error.message);
            }
        }
        
        async function getFrequent() {
            addLog('🔥 Getting most visited sites...');
            try {
                const response = await fetch('/api/frequent');
                const data = await response.json();
                addLog(\`Top visited sites:\`);
                data.frequent.slice(0, 5).forEach(site => {
                    const empire = site.empire_member ? '👑' : '';
                    addLog(\`  \${empire} \${site.domain}: \${site.visit_count} visits\`);
                });
            } catch (error) {
                addLog('❌ Failed to get frequent sites: ' + error.message);
            }
        }
        
        async function quickCache() {
            const url = document.getElementById('quickUrl').value;
            if (!url) {
                addLog('❌ Please enter a URL');
                return;
            }
            
            addLog(\`⚡ Quick caching: \${url}\`);
            try {
                const encodedUrl = encodeURIComponent(url);
                const response = await fetch(\`/api/cache/\${encodedUrl}\`);
                const data = await response.json();
                
                if (data.cached) {
                    addLog(\`🎯 Cache HIT: \${data.title} (\${data.performance}ms)\`);
                } else {
                    addLog(\`🕷️ Cache MISS: Scraped "\${data.title}" (\${data.performance}ms)\`);
                }
            } catch (error) {
                addLog('❌ Quick cache failed: ' + error.message);
            }
        }
        
        function searchCache() {
            const query = prompt('🔍 Search cached content:');
            if (!query) return;
            
            addLog(\`🔍 Searching for: \${query}\`);
            fetch(\`/api/search/\${encodeURIComponent(query)}\`)
                .then(r => r.json())
                .then(data => {
                    addLog(\`Found \${data.results.length} results:\`);
                    data.results.forEach(result => {
                        addLog(\`  📄 \${result.title} (\${result.domain})\`);
                    });
                })
                .catch(error => addLog('❌ Search failed: ' + error.message));
        }
        
        function clearLog() {
            log.innerHTML = \`[\${new Date().toLocaleTimeString()}] 🧹 Log cleared<br>\`;
        }
        
        // Auto-refresh stats every 30 seconds
        setInterval(getStats, 30000);
        
        // Initial stats load
        getStats();
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        const server = this.app.listen(this.port, () => {
            console.log(`
🕷️ SCRAPING & CACHE LAYER STARTED! 🕷️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Cache API: http://localhost:${this.port}
📊 Dashboard: http://localhost:${this.port}/dashboard
💾 Database: ${this.dbPath}
🏰 Empire Domains: ${this.domainEmpire.length} ready

API Endpoints:
  • GET  /api/cache/:encodedUrl - Get cached or scrape site
  • POST /api/refresh/:encodedUrl - Force refresh cache  
  • POST /api/cache-empire - Cache all empire domains
  • GET  /api/frequent - Get most visited sites
  • GET  /api/search/:query - Search cached content
  • GET  /api/stats - Cache performance statistics

Ready to accelerate your 300+ domain empire! ${this.gameElements.speed_boost}
            `);
        });
        
        return server;
    }
}

// Export
module.exports = ScrapingCacheLayer;

// Run if called directly
if (require.main === module) {
    const cacheLayer = new ScrapingCacheLayer();
    cacheLayer.start().catch(console.error);
}
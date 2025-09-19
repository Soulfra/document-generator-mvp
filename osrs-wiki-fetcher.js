#!/usr/bin/env node

/**
 * OSRS Wiki Price Fetcher
 * Dedicated fetcher for Old School RuneScape prices with retry logic
 */

const https = require('https');
const RedisPriceCache = require('./redis-price-cache');
const PricePersistenceService = require('./price-persistence');

class OSRSWikiFetcher {
    constructor(config = {}) {
        this.config = {
            userAgent: config.userAgent || 'Document-Generator OSRS Price Fetcher/1.0',
            baseUrl: 'https://prices.runescape.wiki/api/v1/osrs',
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000, // Start with 1 second
            cache: config.cache || new RedisPriceCache(),
            persistence: config.persistence || new PricePersistenceService(),
            ...config
        };
        
        // Popular OSRS items to track
        this.trackedItems = {
            // High-value PvM items
            22486: { name: 'Scythe of vitur (uncharged)', shortName: 'scythe' },
            22325: { name: 'Scythe of vitur', shortName: 'scythe_charged' },
            20997: { name: 'Twisted bow', shortName: 'tbow' },
            21034: { name: 'Bow of faerdhinen (inactive)', shortName: 'bofa' },
            12817: { name: 'Elysian spirit shield', shortName: 'ely' },
            22324: { name: 'Ghrazi rapier', shortName: 'rapier' },
            21015: { name: 'Dinh\'s bulwark', shortName: 'bulwark' },
            24417: { name: 'Tumeken\'s shadow (uncharged)', shortName: 'shadow' },
            
            // Rare items
            13190: { name: '3rd age pickaxe', shortName: '3a_pick' },
            13204: { name: '3rd age druidic robe top', shortName: '3a_druidic' },
            
            // Common high-volume items
            11832: { name: 'Bandos chestplate', shortName: 'bcp' },
            11834: { name: 'Bandos tassets', shortName: 'tassets' },
            12851: { name: 'Amulet of torture', shortName: 'torture' },
            19547: { name: 'Avernic defender hilt', shortName: 'avernic' },
            
            // Consumables
            12791: { name: 'Rune dragon bones', shortName: 'rune_bones' },
            13442: { name: 'Anglerfish', shortName: 'anglerfish' },
            12695: { name: 'Super combat potion(4)', shortName: 'super_combat' }
        };
        
        // Volume tracking
        this.volumeData = new Map();
        
        console.log('🏰 OSRS Wiki Price Fetcher initialized');
        console.log(`📋 Tracking ${Object.keys(this.trackedItems).length} items`);
    }
    
    async initialize() {
        // Initialize cache and persistence
        if (this.config.cache && !this.config.cache.isConnected()) {
            await this.config.cache.connect();
        }
        
        if (this.config.persistence && !this.config.persistence.initialized) {
            await this.config.persistence.initialize();
        }
        
        console.log('✅ OSRS fetcher ready');
    }
    
    /**
     * Fetch with exponential backoff retry
     */
    async fetchWithRetry(url, attempt = 1) {
        try {
            const data = await this.httpGet(url);
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error.message);
            
            if (attempt >= this.config.retryAttempts) {
                throw new Error(`Failed after ${attempt} attempts: ${error.message}`);
            }
            
            // Exponential backoff
            const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.fetchWithRetry(url, attempt + 1);
        }
    }
    
    /**
     * Fetch latest prices for a specific item
     */
    async fetchItemPrice(itemId) {
        const url = `${this.config.baseUrl}/latest?id=${itemId}`;
        
        try {
            const response = await this.fetchWithRetry(url);
            
            if (!response.data || !response.data[itemId]) {
                throw new Error(`No data returned for item ${itemId}`);
            }
            
            const priceData = response.data[itemId];
            const itemInfo = this.trackedItems[itemId] || { name: `Item ${itemId}`, shortName: `item_${itemId}` };
            
            const processed = {
                item_id: itemId,
                item_name: itemInfo.name,
                short_name: itemInfo.shortName,
                high: priceData.high || 0,
                low: priceData.low || 0,
                average: Math.floor((priceData.high + priceData.low) / 2),
                high_time: priceData.highTime,
                low_time: priceData.lowTime,
                currency: 'GP',
                timestamp: new Date().toISOString()
            };
            
            // Cache the data
            if (this.config.cache) {
                await this.config.cache.cacheOSRSPrice(itemId, itemInfo.name, processed);
            }
            
            // Store in database
            if (this.config.persistence) {
                await this.config.persistence.storePrice(itemInfo.shortName, {
                    price: processed.average,
                    currency: 'GP',
                    source: 'OSRS Wiki',
                    confidence: 100,
                    metadata: {
                        high: processed.high,
                        low: processed.low,
                        item_id: itemId,
                        item_name: itemInfo.name
                    }
                }, 'gaming');
            }
            
            console.log(`✅ Fetched ${itemInfo.name}: ${this.formatGP(processed.average)}`);
            return processed;
            
        } catch (error) {
            console.error(`Failed to fetch item ${itemId}:`, error.message);
            
            // Try to return cached data
            if (this.config.cache) {
                const cached = await this.config.cache.getOSRSPrice(itemId);
                if (cached) {
                    console.log(`📦 Returning cached data for ${itemId}`);
                    return cached;
                }
            }
            
            throw error;
        }
    }
    
    /**
     * Fetch all tracked items
     */
    async fetchAllItems() {
        const results = {};
        const errors = [];
        
        // Fetch in batches to avoid rate limiting
        const itemIds = Object.keys(this.trackedItems);
        const batchSize = 5;
        
        for (let i = 0; i < itemIds.length; i += batchSize) {
            const batch = itemIds.slice(i, i + batchSize);
            
            await Promise.all(
                batch.map(async (itemId) => {
                    try {
                        results[itemId] = await this.fetchItemPrice(itemId);
                    } catch (error) {
                        errors.push({ itemId, error: error.message });
                    }
                })
            );
            
            // Small delay between batches
            if (i + batchSize < itemIds.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log(`📊 Fetched ${Object.keys(results).length}/${itemIds.length} items`);
        if (errors.length > 0) {
            console.error(`❌ Failed to fetch ${errors.length} items`);
        }
        
        return { results, errors };
    }
    
    /**
     * Fetch 5-minute average prices (includes volume)
     */
    async fetch5MinuteData(itemId) {
        const url = `${this.config.baseUrl}/5m?id=${itemId}`;
        
        try {
            const response = await this.fetchWithRetry(url);
            
            if (!response.data || !response.data[itemId]) {
                return null;
            }
            
            const data = response.data[itemId];
            const itemInfo = this.trackedItems[itemId] || { name: `Item ${itemId}` };
            
            const volumeData = {
                avgHighPrice: data.avgHighPrice || null,
                avgLowPrice: data.avgLowPrice || null,
                highPriceVolume: data.highPriceVolume || 0,
                lowPriceVolume: data.lowPriceVolume || 0,
                totalVolume: (data.highPriceVolume || 0) + (data.lowPriceVolume || 0),
                timestamp: new Date().toISOString()
            };
            
            // Store volume data
            this.volumeData.set(itemId, volumeData);
            
            console.log(`📈 Volume for ${itemInfo.name}: ${volumeData.totalVolume} traded`);
            return volumeData;
            
        } catch (error) {
            console.error(`Failed to fetch volume for ${itemId}:`, error.message);
            return null;
        }
    }
    
    /**
     * Fetch time series data for an item
     */
    async fetchTimeSeries(itemId, timestep = '1h') {
        // timestep can be: 5m, 1h, 6h
        const url = `${this.config.baseUrl}/timeseries?id=${itemId}&timestep=${timestep}`;
        
        try {
            const response = await this.fetchWithRetry(url);
            
            if (!response.data || response.data.length === 0) {
                return [];
            }
            
            return response.data.map(point => ({
                timestamp: new Date(point.timestamp * 1000).toISOString(),
                avgHighPrice: point.avgHighPrice,
                avgLowPrice: point.avgLowPrice,
                highVolume: point.highPriceVolume,
                lowVolume: point.lowPriceVolume
            }));
            
        } catch (error) {
            console.error(`Failed to fetch time series for ${itemId}:`, error.message);
            return [];
        }
    }
    
    /**
     * Get item info from the mapping API
     */
    async getItemInfo(search) {
        const url = `${this.config.baseUrl}/mapping`;
        
        try {
            const response = await this.fetchWithRetry(url);
            
            if (Array.isArray(response)) {
                // Search by name or ID
                const searchLower = search.toString().toLowerCase();
                
                return response.filter(item => 
                    item.id.toString() === searchLower ||
                    item.name.toLowerCase().includes(searchLower)
                ).slice(0, 10); // Return max 10 results
            }
            
            return [];
            
        } catch (error) {
            console.error('Failed to fetch item mapping:', error.message);
            return [];
        }
    }
    
    /**
     * Format GP values nicely
     */
    formatGP(value) {
        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(2) + 'b GP';
        } else if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'm GP';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'k GP';
        }
        return value + ' GP';
    }
    
    /**
     * Get market summary for all tracked items
     */
    async getMarketSummary() {
        const cached = [];
        const needsFetch = [];
        
        // Check cache first
        for (const itemId of Object.keys(this.trackedItems)) {
            if (this.config.cache) {
                const cachedPrice = await this.config.cache.getOSRSPrice(itemId);
                if (cachedPrice && cachedPrice.cache_age_seconds < 300) { // Less than 5 minutes old
                    cached.push(cachedPrice);
                } else {
                    needsFetch.push(itemId);
                }
            } else {
                needsFetch.push(itemId);
            }
        }
        
        console.log(`📦 ${cached.length} items from cache, 🔄 ${needsFetch.length} need fetching`);
        
        // Fetch missing items
        if (needsFetch.length > 0) {
            const { results } = await this.fetchAllItems();
            Object.values(results).forEach(item => cached.push(item));
        }
        
        // Sort by value
        cached.sort((a, b) => (b.average || b.price || 0) - (a.average || a.price || 0));
        
        return {
            items: cached,
            total_value: cached.reduce((sum, item) => sum + (item.average || item.price || 0), 0),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Start automatic price updates
     */
    startAutoUpdate(intervalMinutes = 10) {
        console.log(`⏰ Starting auto-update every ${intervalMinutes} minutes`);
        
        // Initial fetch
        this.fetchAllItems();
        
        // Set interval
        this.updateInterval = setInterval(() => {
            console.log('🔄 Running scheduled price update...');
            this.fetchAllItems();
        }, intervalMinutes * 60 * 1000);
    }
    
    /**
     * Stop automatic updates
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            console.log('⏹️ Stopped auto-updates');
        }
    }
    
    /**
     * HTTP GET with proper headers
     */
    httpGet(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': this.config.userAgent,
                    'Accept': 'application/json'
                },
                timeout: 30000
            };
            
            const request = https.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => data += chunk);
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
            
            request.end();
        });
    }
    
    /**
     * Close connections
     */
    async close() {
        this.stopAutoUpdate();
        
        if (this.config.cache) {
            await this.config.cache.close();
        }
        
        if (this.config.persistence) {
            await this.config.persistence.close();
        }
    }
}

// Export for use
module.exports = OSRSWikiFetcher;

// Test and example usage
if (require.main === module) {
    (async () => {
        const fetcher = new OSRSWikiFetcher();
        
        try {
            await fetcher.initialize();
            
            // Test single item fetch
            console.log('\n📊 Testing single item fetch...');
            const scythe = await fetcher.fetchItemPrice(22486);
            console.log('Scythe price:', fetcher.formatGP(scythe.average));
            
            // Test volume data
            console.log('\n📈 Testing volume data...');
            const volume = await fetcher.fetch5MinuteData(22486);
            console.log('Scythe volume:', volume);
            
            // Test market summary
            console.log('\n📊 Getting market summary...');
            const summary = await fetcher.getMarketSummary();
            console.log(`Total tracked value: ${fetcher.formatGP(summary.total_value)}`);
            console.log('Top 5 items:');
            summary.items.slice(0, 5).forEach(item => {
                console.log(`  ${item.item_name}: ${fetcher.formatGP(item.average || item.price)}`);
            });
            
            // Start auto-updates (comment out for testing)
            // fetcher.startAutoUpdate(5);
            
            // Close after tests
            setTimeout(async () => {
                await fetcher.close();
                process.exit(0);
            }, 5000);
            
        } catch (error) {
            console.error('Test failed:', error);
            process.exit(1);
        }
    })();
}
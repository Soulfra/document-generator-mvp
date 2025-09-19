#!/usr/bin/env node

/**
 * Price Persistence Service
 * Stores price data in PostgreSQL for historical tracking and analysis
 */

const { Pool } = require('pg');
const RedisPriceCache = require('./redis-price-cache');

class PricePersistenceService {
    constructor(config = {}) {
        this.config = {
            database: {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'document_generator',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                ...config.database
            },
            cache: config.cache || new RedisPriceCache()
        };
        
        this.pool = null;
        this.cache = this.config.cache;
        this.initialized = false;
        
        console.log('💾 Price Persistence Service initialized');
    }
    
    async initialize() {
        try {
            // Connect to PostgreSQL
            this.pool = new Pool(this.config.database);
            
            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            console.log('✅ Connected to PostgreSQL');
            
            // Create tables if they don't exist
            await this.createTables();
            
            // Connect to Redis cache
            if (this.cache && !this.cache.isConnected()) {
                await this.cache.connect();
            }
            
            this.initialized = true;
            console.log('✅ Price Persistence Service ready');
            
        } catch (error) {
            console.error('Failed to initialize persistence service:', error);
            throw error;
        }
    }
    
    async createTables() {
        const queries = [
            // Price history table
            `CREATE TABLE IF NOT EXISTS price_history (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(50) NOT NULL,
                category VARCHAR(50) NOT NULL,
                price DECIMAL(20, 8) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                source VARCHAR(100),
                confidence INTEGER DEFAULT 0,
                volume DECIMAL(20, 8),
                high_24h DECIMAL(20, 8),
                low_24h DECIMAL(20, 8),
                change_24h DECIMAL(10, 6),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT idx_symbol_category_time UNIQUE (symbol, category, timestamp)
            )`,
            
            // Create indexes for performance
            `CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol)`,
            `CREATE INDEX IF NOT EXISTS idx_price_history_category ON price_history(category)`,
            `CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_price_history_symbol_timestamp ON price_history(symbol, timestamp DESC)`,
            
            // Manual fetch tracking table
            `CREATE TABLE IF NOT EXISTS manual_fetch_requests (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100),
                ip_address INET,
                symbol VARCHAR(50),
                category VARCHAR(50),
                success BOOLEAN DEFAULT TRUE,
                response_time_ms INTEGER,
                error_message TEXT,
                requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Price alerts table
            `CREATE TABLE IF NOT EXISTS price_alerts (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100),
                symbol VARCHAR(50) NOT NULL,
                category VARCHAR(50) NOT NULL,
                alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('above', 'below', 'change_percent')),
                threshold_value DECIMAL(20, 8) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                triggered_count INTEGER DEFAULT 0,
                last_triggered_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Aggregated hourly data for charts
            `CREATE TABLE IF NOT EXISTS price_hourly (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(50) NOT NULL,
                category VARCHAR(50) NOT NULL,
                hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                open_price DECIMAL(20, 8) NOT NULL,
                high_price DECIMAL(20, 8) NOT NULL,
                low_price DECIMAL(20, 8) NOT NULL,
                close_price DECIMAL(20, 8) NOT NULL,
                volume DECIMAL(20, 8),
                sample_count INTEGER DEFAULT 1,
                CONSTRAINT idx_symbol_hour UNIQUE (symbol, category, hour_timestamp)
            )`,
            
            // Data source reliability tracking
            `CREATE TABLE IF NOT EXISTS source_reliability (
                id SERIAL PRIMARY KEY,
                source_name VARCHAR(100) NOT NULL UNIQUE,
                total_requests INTEGER DEFAULT 0,
                successful_requests INTEGER DEFAULT 0,
                failed_requests INTEGER DEFAULT 0,
                average_response_time_ms INTEGER,
                last_success_at TIMESTAMP WITH TIME ZONE,
                last_failure_at TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT TRUE,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        const client = await this.pool.connect();
        try {
            for (const query of queries) {
                await client.query(query);
            }
            console.log('✅ Database tables created/verified');
        } finally {
            client.release();
        }
    }
    
    /**
     * Store price data with caching
     */
    async storePrice(symbol, data, category = 'crypto') {
        if (!this.initialized) {
            throw new Error('Service not initialized');
        }
        
        const client = await this.pool.connect();
        try {
            // Store in database
            const query = `
                INSERT INTO price_history (
                    symbol, category, price, currency, source, 
                    confidence, volume, high_24h, low_24h, change_24h, 
                    timestamp, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (symbol, category, timestamp) 
                DO UPDATE SET 
                    price = EXCLUDED.price,
                    confidence = EXCLUDED.confidence,
                    volume = EXCLUDED.volume,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
            `;
            
            const values = [
                symbol,
                category,
                data.price,
                data.currency || 'USD',
                data.source || 'unknown',
                data.confidence || 0,
                data.volume || null,
                data.high_24h || null,
                data.low_24h || null,
                data.change_24h || null,
                data.timestamp ? new Date(data.timestamp) : new Date(),
                JSON.stringify(data.metadata || {})
            ];
            
            const result = await client.query(query, values);
            
            // Also cache the data
            if (this.cache) {
                await this.cache.cachePrice(symbol, data, category);
            }
            
            // Update hourly aggregation
            await this.updateHourlyData(client, symbol, category, data);
            
            console.log(`💾 Stored ${category}/${symbol} price: ${data.price}`);
            return result.rows[0].id;
            
        } finally {
            client.release();
        }
    }
    
    /**
     * Store multiple prices in batch
     */
    async storePrices(priceData) {
        if (!this.initialized) {
            throw new Error('Service not initialized');
        }
        
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            for (const [category, prices] of Object.entries(priceData)) {
                for (const [symbol, data] of Object.entries(prices)) {
                    await this.storePrice(symbol, data, category);
                }
            }
            
            await client.query('COMMIT');
            console.log('💾 Batch price storage completed');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get latest price with cache fallback
     */
    async getLatestPrice(symbol, category = 'crypto') {
        // Try cache first
        if (this.cache) {
            const cached = await this.cache.getPrice(symbol, category);
            if (cached) {
                return cached;
            }
        }
        
        // Fallback to database
        const query = `
            SELECT * FROM price_history 
            WHERE symbol = $1 AND category = $2 
            ORDER BY timestamp DESC 
            LIMIT 1
        `;
        
        const result = await this.pool.query(query, [symbol, category]);
        
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
                symbol: row.symbol,
                price: parseFloat(row.price),
                currency: row.currency,
                source: row.source,
                confidence: row.confidence,
                timestamp: row.timestamp,
                from_cache: false,
                from_database: true
            };
        }
        
        return null;
    }
    
    /**
     * Get price history for charting
     */
    async getPriceHistory(symbol, category = 'crypto', hours = 24) {
        const query = `
            SELECT 
                hour_timestamp as timestamp,
                open_price as open,
                high_price as high,
                low_price as low,
                close_price as close,
                volume,
                sample_count
            FROM price_hourly
            WHERE symbol = $1 
                AND category = $2 
                AND hour_timestamp >= NOW() - INTERVAL '${hours} hours'
            ORDER BY hour_timestamp ASC
        `;
        
        const result = await this.pool.query(query, [symbol, category]);
        
        return result.rows.map(row => ({
            timestamp: row.timestamp,
            open: parseFloat(row.open),
            high: parseFloat(row.high),
            low: parseFloat(row.low),
            close: parseFloat(row.close),
            volume: row.volume ? parseFloat(row.volume) : null,
            samples: row.sample_count
        }));
    }
    
    /**
     * Track manual fetch request
     */
    async trackManualFetch(requestData) {
        const query = `
            INSERT INTO manual_fetch_requests (
                user_id, ip_address, symbol, category, 
                success, response_time_ms, error_message
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await this.pool.query(query, [
            requestData.userId || null,
            requestData.ipAddress || null,
            requestData.symbol,
            requestData.category,
            requestData.success,
            requestData.responseTime,
            requestData.error || null
        ]);
    }
    
    /**
     * Get manual fetch statistics
     */
    async getManualFetchStats(userId = null) {
        let query = `
            SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN success THEN 1 END) as successful_requests,
                AVG(response_time_ms) as avg_response_time,
                COUNT(DISTINCT symbol) as unique_symbols,
                MAX(requested_at) as last_request
            FROM manual_fetch_requests
            WHERE requested_at >= NOW() - INTERVAL '24 hours'
        `;
        
        const params = [];
        if (userId) {
            query += ' AND user_id = $1';
            params.push(userId);
        }
        
        const result = await this.pool.query(query, params);
        return result.rows[0];
    }
    
    /**
     * Update hourly aggregation data
     */
    async updateHourlyData(client, symbol, category, data) {
        const hourTimestamp = new Date();
        hourTimestamp.setMinutes(0, 0, 0);
        
        const query = `
            INSERT INTO price_hourly (
                symbol, category, hour_timestamp,
                open_price, high_price, low_price, close_price,
                volume, sample_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
            ON CONFLICT (symbol, category, hour_timestamp)
            DO UPDATE SET
                high_price = GREATEST(price_hourly.high_price, EXCLUDED.close_price),
                low_price = LEAST(price_hourly.low_price, EXCLUDED.close_price),
                close_price = EXCLUDED.close_price,
                volume = COALESCE(price_hourly.volume, 0) + COALESCE(EXCLUDED.volume, 0),
                sample_count = price_hourly.sample_count + 1
        `;
        
        await client.query(query, [
            symbol,
            category,
            hourTimestamp,
            data.price,  // open (will only be set on first insert)
            data.price,  // high
            data.price,  // low
            data.price,  // close
            data.volume || 0
        ]);
    }
    
    /**
     * Create or update price alert
     */
    async createPriceAlert(alertData) {
        const query = `
            INSERT INTO price_alerts (
                user_id, symbol, category, alert_type, 
                threshold_value, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        
        const result = await this.pool.query(query, [
            alertData.userId,
            alertData.symbol,
            alertData.category || 'crypto',
            alertData.alertType,
            alertData.thresholdValue,
            true
        ]);
        
        return result.rows[0].id;
    }
    
    /**
     * Check and trigger price alerts
     */
    async checkPriceAlerts(symbol, category, currentPrice) {
        const query = `
            SELECT * FROM price_alerts
            WHERE symbol = $1 
                AND category = $2 
                AND is_active = TRUE
        `;
        
        const alerts = await this.pool.query(query, [symbol, category]);
        const triggered = [];
        
        for (const alert of alerts.rows) {
            let shouldTrigger = false;
            
            switch (alert.alert_type) {
                case 'above':
                    shouldTrigger = currentPrice >= parseFloat(alert.threshold_value);
                    break;
                case 'below':
                    shouldTrigger = currentPrice <= parseFloat(alert.threshold_value);
                    break;
                case 'change_percent':
                    // Would need previous price to calculate
                    break;
            }
            
            if (shouldTrigger) {
                triggered.push(alert);
                
                // Update alert
                await this.pool.query(
                    `UPDATE price_alerts 
                     SET triggered_count = triggered_count + 1,
                         last_triggered_at = CURRENT_TIMESTAMP
                     WHERE id = $1`,
                    [alert.id]
                );
            }
        }
        
        return triggered;
    }
    
    /**
     * Get database statistics
     */
    async getStats() {
        const queries = {
            total_prices: 'SELECT COUNT(*) FROM price_history',
            unique_symbols: 'SELECT COUNT(DISTINCT symbol) FROM price_history',
            categories: 'SELECT category, COUNT(*) as count FROM price_history GROUP BY category',
            recent_prices: 'SELECT COUNT(*) FROM price_history WHERE timestamp > NOW() - INTERVAL \'1 hour\'',
            manual_fetches_24h: 'SELECT COUNT(*) FROM manual_fetch_requests WHERE requested_at > NOW() - INTERVAL \'24 hours\''
        };
        
        const stats = {};
        
        for (const [key, query] of Object.entries(queries)) {
            const result = await this.pool.query(query);
            stats[key] = result.rows;
        }
        
        return stats;
    }
    
    /**
     * Clean up old data
     */
    async cleanupOldData(daysToKeep = 30) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            // Delete old price history (keep aggregated hourly data)
            const deleteQuery = `
                DELETE FROM price_history 
                WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
            `;
            
            const result = await client.query(deleteQuery);
            
            await client.query('COMMIT');
            console.log(`🧹 Cleaned up ${result.rowCount} old price records`);
            
            return result.rowCount;
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Close connections
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
        }
        if (this.cache) {
            await this.cache.close();
        }
        console.log('Price persistence service closed');
    }
}

// Export for use in other modules
module.exports = PricePersistenceService;

// Test and example usage
if (require.main === module) {
    (async () => {
        const service = new PricePersistenceService();
        
        try {
            await service.initialize();
            
            // Test storing a price
            await service.storePrice('BTC', {
                price: 111424,
                currency: 'USD',
                source: 'coingecko',
                confidence: 95,
                volume: 25000000000,
                high_24h: 112000,
                low_24h: 110000,
                change_24h: 1.5
            });
            
            // Get latest price
            const latest = await service.getLatestPrice('BTC');
            console.log('Latest BTC price:', latest);
            
            // Get stats
            const stats = await service.getStats();
            console.log('Database stats:', stats);
            
            // Close connections
            await service.close();
            
        } catch (error) {
            console.error('Test failed:', error);
            process.exit(1);
        }
    })();
}
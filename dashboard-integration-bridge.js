#!/usr/bin/env node

/**
 * Dashboard Integration Bridge
 * Connects existing 569 dashboards to the Flask Price API
 * Provides compatibility layer for different dashboard formats
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');

class DashboardIntegrationBridge {
    constructor() {
        this.app = express();
        this.port = 3012;
        this.flaskAPI = 'http://localhost:5000';
        
        // Cache for different dashboard formats
        this.formatCache = new Map();
        
        // Dashboard format mappings
        this.dashboardFormats = {
            'ULTIMATE-UNIFIED-DASHBOARD': {
                endpoint: '/api/formatted/all',
                transform: (data) => ({
                    crypto: data.crypto,
                    gaming: data.gaming,
                    timestamp: new Date().toISOString()
                })
            },
            'system-dashboard': {
                endpoint: '/api/dashboard/summary',
                transform: (data) => data
            },
            'live-price-display': {
                endpoint: '/api/prices',
                transform: (data) => ({
                    crypto: data.crypto,
                    gaming: data.gaming
                })
            },
            'default': {
                endpoint: '/api/prices',
                transform: (data) => data
            }
        };
        
        this.setupRoutes();
        console.log('🌉 Dashboard Integration Bridge initialized');
    }
    
    setupRoutes() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Universal endpoint that adapts to any dashboard
        this.app.get('/bridge/data/:dashboard?', async (req, res) => {
            const dashboardType = req.params.dashboard || 'default';
            const format = this.dashboardFormats[dashboardType] || this.dashboardFormats.default;
            
            try {
                const response = await axios.get(`${this.flaskAPI}${format.endpoint}`);
                const transformed = format.transform(response.data);
                
                res.json({
                    success: true,
                    dashboard: dashboardType,
                    data: transformed,
                    cached: false
                });
            } catch (error) {
                console.error(`Bridge error for ${dashboardType}:`, error.message);
                res.status(500).json({
                    success: false,
                    error: error.message,
                    fallback: this.getFallbackData()
                });
            }
        });
        
        // Compatible with existing data-fetcher endpoints
        this.app.get('/api/data/all', async (req, res) => {
            try {
                const response = await axios.get(`${this.flaskAPI}/api/formatted/all`);
                res.json(response.data);
            } catch (error) {
                res.json(this.getFallbackData());
            }
        });
        
        // Price endpoint for specific symbols
        this.app.get('/api/price/:symbol', async (req, res) => {
            try {
                const response = await axios.get(`${this.flaskAPI}/api/price/${req.params.symbol}`);
                res.json(response.data);
            } catch (error) {
                res.status(404).json({ error: 'Symbol not found' });
            }
        });
        
        // Arbitrage opportunities
        this.app.get('/api/arbitrage', async (req, res) => {
            try {
                const response = await axios.get(`${this.flaskAPI}/api/arbitrage`);
                res.json(response.data);
            } catch (error) {
                res.json({ opportunities: [], count: 0 });
            }
        });
        
        // Dashboard discovery endpoint
        this.app.get('/api/dashboards', (req, res) => {
            res.json({
                total: 569,
                integrated: Object.keys(this.dashboardFormats).length - 1,
                formats: Object.keys(this.dashboardFormats).filter(f => f !== 'default'),
                recommendation: 'Use /bridge/data/{dashboard-name} for automatic format adaptation'
            });
        });
        
        // Health check
        this.app.get('/health', async (req, res) => {
            let flaskHealthy = false;
            try {
                const response = await axios.get(`${this.flaskAPI}/health`);
                flaskHealthy = response.data.status === 'healthy';
            } catch (e) {}
            
            res.json({
                status: 'healthy',
                bridge: 'operational',
                flaskAPI: flaskHealthy,
                dashboards: {
                    total: 569,
                    integrated: Object.keys(this.dashboardFormats).length - 1
                }
            });
        });
    }
    
    getFallbackData() {
        // Fallback data when Flask API is unavailable
        return {
            crypto: {
                bitcoin: { price: 111424, currency: 'USD' },
                ethereum: { price: 4625, currency: 'USD' }
            },
            gaming: {
                scythe: { price: 1589000000, currency: 'GP', item: 'Scythe of Vitur' },
                tbow: { price: 1584000000, currency: 'GP', item: 'Twisted Bow' }
            }
        };
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('🌉 Dashboard Integration Bridge Started!');
            console.log('=====================================');
            console.log(`📡 Bridge API: http://localhost:${this.port}`);
            console.log(`🔗 Flask API: ${this.flaskAPI}`);
            console.log(`📊 Dashboards: 569 available, ${Object.keys(this.dashboardFormats).length - 1} integrated`);
            console.log('');
            console.log('📋 Endpoints:');
            console.log('   /bridge/data/{dashboard} - Auto-formatted data');
            console.log('   /api/data/all - All price data');
            console.log('   /api/price/{symbol} - Specific symbol');
            console.log('   /api/arbitrage - Arbitrage opportunities');
            console.log('   /api/dashboards - Dashboard discovery');
            console.log('');
            console.log('✨ Ready to bridge dashboards to real prices!');
        });
    }
}

// Export for use as module
module.exports = DashboardIntegrationBridge;

// Start if run directly
if (require.main === module) {
    const bridge = new DashboardIntegrationBridge();
    bridge.start();
}
#!/usr/bin/env node

/**
 * 🌍 EXTERNAL COMMUNICATION LAYER 🌍
 * 
 * The "mouth" that speaks what the internal "braille" is saying.
 * Provides a simple, reliable interface for external services with
 * graceful fallbacks when internal systems can't communicate.
 */

const express = require('express');
const { InternalExternalTranslationBridge } = require('./internal-external-translation-bridge');
const { BroadcastToHTTPTranslator } = require('./broadcast-to-http-translator');

class ExternalCommunicationLayer {
    constructor(options = {}) {
        this.layerId = `EXTERNAL-COMM-${Date.now()}`;
        this.translationBridge = new InternalExternalTranslationBridge();
        this.broadcastTranslator = new BroadcastToHTTPTranslator();
        
        // Fallback configuration
        this.fallbacks = {
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            fallbackMode: options.fallbackMode || 'graceful',
            cacheTimeout: options.cacheTimeout || 60000 // 1 minute
        };
        
        // Response cache for when internal systems fail
        this.responseCache = new Map();
        
        // Health status
        this.health = {
            internal: 'unknown',
            external: 'operational',
            lastCheck: null,
            failures: 0
        };
    }

    /**
     * Create Express app with all external communication routes
     */
    createApp() {
        const app = express();
        
        // Middleware
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        
        // Add communication layer middleware
        app.use(this.communicationMiddleware());
        
        // Health check - always works
        app.get('/health', (req, res) => this.healthCheck(req, res));
        
        // Main status - with fallbacks
        app.get('/api/status', (req, res) => this.getStatus(req, res));
        
        // Demo endpoint - simple response
        app.get('/api/demo', (req, res) => this.getDemo(req, res));
        
        // Info endpoint - basic information
        app.get('/api/info', (req, res) => this.getInfo(req, res));
        
        // Process endpoint - with translation
        app.post('/api/process', (req, res) => this.processDocument(req, res));
        
        // Constellation status - with broadcast translation
        app.get('/api/constellation', (req, res) => this.getConstellation(req, res));
        
        // Internal bridge - attempts internal communication
        app.get('/api/internal', (req, res) => this.getInternalStatus(req, res));
        
        // 404 handler
        app.use((req, res) => this.notFound(req, res));
        
        // Error handler
        app.use((err, req, res, next) => this.errorHandler(err, req, res, next));
        
        return app;
    }

    /**
     * Communication middleware - adds fallback capabilities
     */
    communicationMiddleware() {
        return (req, res, next) => {
            // Override res.json to add fallback logic
            const originalJson = res.json.bind(res);
            
            res.json = (data) => {
                // If data is null/undefined, use fallback
                if (!data) {
                    return originalJson(this.getFallbackResponse(req.path));
                }
                
                // Cache successful responses
                if (res.statusCode === 200) {
                    this.cacheResponse(req.path, data);
                }
                
                return originalJson(data);
            };
            
            next();
        };
    }

    /**
     * Health check endpoint - always available
     */
    async healthCheck(req, res) {
        const now = new Date();
        this.health.lastCheck = now.toISOString();
        
        // Try to check internal systems
        try {
            const internalCheck = await this.checkInternalSystems();
            this.health.internal = internalCheck.status;
            this.health.failures = 0;
        } catch (error) {
            this.health.internal = 'unreachable';
            this.health.failures++;
        }
        
        res.json({
            status: 'healthy',
            timestamp: now.toISOString(),
            external: this.health.external,
            internal: this.health.internal,
            uptime: process.uptime(),
            failures: this.health.failures,
            mode: this.health.internal === 'unreachable' ? 'fallback' : 'normal'
        });
    }

    /**
     * Get status with fallbacks
     */
    async getStatus(req, res) {
        try {
            // Try to get internal status
            const internalStatus = await this.tryInternalCall(() => 
                this.getInternalSystemStatus()
            );
            
            if (internalStatus) {
                // Translate and return
                const translated = await this.translationBridge.translate(internalStatus);
                return res.json(translated);
            }
        } catch (error) {
            console.error('Status error:', error);
        }
        
        // Use fallback
        res.json(this.getFallbackResponse('/api/status'));
    }

    /**
     * Simple demo endpoint
     */
    getDemo(req, res) {
        res.json({
            message: 'Document Generator Demo',
            status: 'operational',
            capabilities: [
                'Process documents (limited in serverless)',
                'Generate templates (basic)',
                'API integration (cloud services only)'
            ],
            note: 'This is a serverless deployment with limited features',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Basic info endpoint
     */
    getInfo(req, res) {
        res.json({
            name: 'Document Generator',
            version: '1.0.0',
            type: 'serverless',
            features: {
                internal: this.health.internal === 'operational',
                translation: true,
                fallbacks: true,
                broadcast: false // Disabled in serverless
            },
            documentation: 'https://github.com/yourusername/document-generator',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Process document with fallbacks
     */
    async processDocument(req, res) {
        const { document, type } = req.body;
        
        if (!document) {
            return res.status(400).json({
                error: 'Document required',
                hint: 'Send document content in request body'
            });
        }
        
        try {
            // Try internal processing first
            const result = await this.tryInternalCall(() => 
                this.processInternally(document, type)
            );
            
            if (result) {
                const translated = await this.translationBridge.translate(result);
                return res.json(translated);
            }
        } catch (error) {
            console.error('Processing error:', error);
        }
        
        // Fallback to simple processing
        res.json({
            processed: true,
            type: type || 'text',
            summary: {
                length: document.length,
                words: document.split(/\s+/).length,
                preview: document.substring(0, 100) + '...'
            },
            result: 'Document received and analyzed (basic mode)',
            note: 'Advanced processing unavailable in serverless',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get constellation status
     */
    async getConstellation(req, res) {
        try {
            const broadcast = await this.tryInternalCall(() => 
                this.getConstellationBroadcast()
            );
            
            if (broadcast) {
                const httpResponse = await this.broadcastTranslator.translateBroadcastToHTTP(broadcast);
                return res.json(httpResponse.response.body);
            }
        } catch (error) {
            console.error('Constellation error:', error);
        }
        
        // Fallback constellation status
        res.json({
            constellation: {
                name: 'Main',
                health: 'unknown',
                components: {
                    total: 459,
                    verified: 0,
                    failed: 0,
                    percentage: 0
                },
                message: 'Constellation status unavailable (using fallback)',
                mode: 'fallback'
            },
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Try to get internal status
     */
    async getInternalStatus(req, res) {
        try {
            const internal = await this.checkInternalSystems();
            res.json({
                internal: internal,
                bridge: 'operational',
                translation: 'available',
                mode: 'connected'
            });
        } catch (error) {
            res.json({
                internal: { status: 'unreachable', error: error.message },
                bridge: 'operational',
                translation: 'available',
                mode: 'disconnected',
                fallback: 'External communication layer is working'
            });
        }
    }

    /**
     * 404 handler
     */
    notFound(req, res) {
        res.status(404).json({
            error: 'Not Found',
            path: req.path,
            available: [
                '/health',
                '/api/status',
                '/api/demo',
                '/api/info',
                '/api/process',
                '/api/constellation',
                '/api/internal'
            ],
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Error handler
     */
    errorHandler(err, req, res, next) {
        console.error('External communication error:', err);
        
        res.status(500).json({
            error: 'Communication Error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal error',
            fallback: this.getFallbackResponse(req.path),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Try internal call with retries
     */
    async tryInternalCall(func) {
        for (let i = 0; i < this.fallbacks.maxRetries; i++) {
            try {
                return await func();
            } catch (error) {
                if (i < this.fallbacks.maxRetries - 1) {
                    await this.delay(this.fallbacks.retryDelay);
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Get fallback response for path
     */
    getFallbackResponse(path) {
        // Check cache first
        const cached = this.responseCache.get(path);
        if (cached && Date.now() - cached.timestamp < this.fallbacks.cacheTimeout) {
            return { ...cached.data, cached: true };
        }
        
        // Generate fallback based on path
        const fallbacks = {
            '/api/status': {
                status: 'operational',
                mode: 'fallback',
                message: 'System operational (limited features)',
                timestamp: new Date().toISOString()
            },
            '/api/constellation': {
                constellation: { health: 'unknown', message: 'Data unavailable' }
            },
            default: {
                status: 'fallback',
                message: 'Using fallback response',
                operational: true,
                timestamp: new Date().toISOString()
            }
        };
        
        return fallbacks[path] || fallbacks.default;
    }

    /**
     * Cache successful response
     */
    cacheResponse(path, data) {
        this.responseCache.set(path, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Check internal systems (mock)
     */
    async checkInternalSystems() {
        // In real implementation, this would check actual internal systems
        // For now, simulate occasional failures
        if (Math.random() > 0.7) {
            throw new Error('Internal systems unreachable');
        }
        
        return {
            status: 'operational',
            services: {
                cobol: 'active',
                constellation: 'active',
                broadcast: 'active'
            }
        };
    }

    /**
     * Utility: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Mock internal functions (would connect to real systems)
    async getInternalSystemStatus() {
        return { COBOL_STRUCTURE: true, status: 'running' };
    }
    
    async processInternally(document, type) {
        return { processed: true, internal: true };
    }
    
    async getConstellationBroadcast() {
        return { constellation: true, components: [] };
    }
}

// Export for use in serverless deployment
module.exports = {
    ExternalCommunicationLayer,
    createExternalApp: () => {
        const layer = new ExternalCommunicationLayer();
        return layer.createApp();
    }
};
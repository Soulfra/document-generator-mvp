#!/usr/bin/env node

/**
 * 📡 API RESPONSE INTERCEPTOR
 * 
 * Intercepts API responses and triggers flash snapshots
 * Works with existing Express/HTTP servers
 */

const FlashContextSwitcher = require('./flash-context-switcher');
const http = require('http');
const https = require('https');

class APIResponseInterceptor {
    constructor(flashSwitcher) {
        this.flashSwitcher = flashSwitcher;
        this.interceptedAPIs = new Set();
        
        // Patterns to capture
        this.capturePatterns = [
            /\/api\/.*/,
            /\/v\d+\/.*/,
            /\/graphql/,
            /\/rest\/.*/
        ];
        
        // Setup interception
        this.setupHTTPInterception();
        this.setupExpressMiddleware();
    }
    
    /**
     * 🪝 Intercept HTTP/HTTPS modules
     */
    setupHTTPInterception() {
        // Store original methods
        const originalHTTPRequest = http.request;
        const originalHTTPSRequest = https.request;
        
        // Wrap HTTP request
        http.request = (...args) => {
            return this.wrapRequest(originalHTTPRequest, ...args);
        };
        
        // Wrap HTTPS request
        https.request = (...args) => {
            return this.wrapRequest(originalHTTPSRequest, ...args);
        };
    }
    
    /**
     * 🎁 Wrap request to capture responses
     */
    wrapRequest(originalMethod, ...args) {
        const req = originalMethod.apply(http, args);
        const startTime = Date.now();
        
        // Extract request info
        const requestInfo = this.extractRequestInfo(args);
        
        // Only intercept if matches patterns
        if (!this.shouldCapture(requestInfo.path)) {
            return req;
        }
        
        // Store original listeners
        const originalEmit = req.emit;
        
        // Intercept response
        req.emit = function(event, ...eventArgs) {
            if (event === 'response') {
                const res = eventArgs[0];
                this.interceptResponse(res, requestInfo, startTime);
            }
            return originalEmit.apply(req, arguments);
        }.bind(this);
        
        return req;
    }
    
    /**
     * 📸 Intercept and capture response
     */
    interceptResponse(res, requestInfo, startTime) {
        let responseData = '';
        
        // Store original methods
        const originalOn = res.on;
        const originalOnce = res.once;
        
        // Intercept data chunks
        res.on = function(event, callback) {
            if (event === 'data') {
                const wrappedCallback = (chunk) => {
                    responseData += chunk.toString();
                    callback(chunk);
                };
                return originalOn.call(res, event, wrappedCallback);
            }
            return originalOn.apply(res, arguments);
        };
        
        // Intercept end event
        res.once = function(event, callback) {
            if (event === 'end') {
                const wrappedCallback = async () => {
                    // Parse response data
                    let parsedData = responseData;
                    try {
                        parsedData = JSON.parse(responseData);
                    } catch (e) {
                        // Keep as string if not JSON
                    }
                    
                    // Capture flash snapshot
                    await this.flashSwitcher.captureFlash(
                        {
                            endpoint: requestInfo.path,
                            method: requestInfo.method,
                            params: requestInfo.params,
                            headers: requestInfo.headers
                        },
                        {
                            status: res.statusCode,
                            data: parsedData,
                            headers: res.headers,
                            duration: Date.now() - startTime
                        },
                        {
                            interceptedAt: 'http_module',
                            protocol: requestInfo.protocol
                        }
                    );
                    
                    callback();
                }.bind(this);
                return originalOnce.call(res, event, wrappedCallback);
            }
            return originalOnce.apply(res, arguments);
        }.bind(this);
    }
    
    /**
     * 🔌 Express middleware for server-side interception
     */
    setupExpressMiddleware() {
        this.expressMiddleware = (req, res, next) => {
            // Only capture matching patterns
            if (!this.shouldCapture(req.path)) {
                return next();
            }
            
            const startTime = Date.now();
            const originalSend = res.send;
            const originalJson = res.json;
            
            // Capture context
            const captureContext = {
                endpoint: req.path,
                method: req.method,
                params: { ...req.query, ...req.params },
                headers: req.headers,
                body: req.body
            };
            
            // Wrap send method
            res.send = function(data) {
                this.captureExpressResponse(captureContext, {
                    status: res.statusCode,
                    data,
                    headers: res.getHeaders(),
                    duration: Date.now() - startTime
                });
                return originalSend.apply(res, arguments);
            }.bind(this);
            
            // Wrap json method
            res.json = function(data) {
                this.captureExpressResponse(captureContext, {
                    status: res.statusCode,
                    data,
                    headers: res.getHeaders(),
                    duration: Date.now() - startTime
                });
                return originalJson.apply(res, arguments);
            }.bind(this);
            
            next();
        };
    }
    
    /**
     * 📸 Capture Express response
     */
    async captureExpressResponse(apiCall, response) {
        await this.flashSwitcher.captureFlash(
            apiCall,
            response,
            {
                interceptedAt: 'express_middleware',
                serverSide: true
            }
        );
    }
    
    /**
     * 🎯 Check if should capture this path
     */
    shouldCapture(path) {
        return this.capturePatterns.some(pattern => pattern.test(path));
    }
    
    /**
     * 📋 Extract request info from arguments
     */
    extractRequestInfo(args) {
        let options = {};
        
        if (typeof args[0] === 'string') {
            // URL string
            const url = new URL(args[0]);
            options = {
                path: url.pathname + url.search,
                method: 'GET',
                headers: {},
                protocol: url.protocol
            };
        } else if (args[0] && typeof args[0] === 'object') {
            // Options object
            options = {
                path: args[0].path || args[0].pathname || '/',
                method: args[0].method || 'GET',
                headers: args[0].headers || {},
                protocol: args[0].protocol || 'http:'
            };
        }
        
        return options;
    }
    
    /**
     * ➕ Add capture pattern
     */
    addCapturePattern(pattern) {
        this.capturePatterns.push(pattern);
    }
    
    /**
     * 🔗 Get Express middleware
     */
    getExpressMiddleware() {
        return this.expressMiddleware;
    }
}

module.exports = APIResponseInterceptor;

// Demo usage
if (require.main === module) {
    const express = require('express');
    const axios = require('axios');
    
    async function demo() {
        console.log('📡 API Response Interceptor Demo\n');
        
        // Create flash switcher
        const flashSwitcher = new FlashContextSwitcher();
        await flashSwitcher.initialize();
        
        // Create interceptor
        const interceptor = new APIResponseInterceptor(flashSwitcher);
        
        // Create test Express server
        const app = express();
        app.use(express.json());
        app.use(interceptor.getExpressMiddleware());
        
        // Test endpoints
        app.get('/api/test', (req, res) => {
            res.json({ message: 'Test response', timestamp: Date.now() });
        });
        
        app.post('/api/data', (req, res) => {
            res.json({ received: req.body, processed: true });
        });
        
        const server = app.listen(3333, () => {
            console.log('Test server running on port 3333');
        });
        
        // Make test requests
        setTimeout(async () => {
            console.log('\n📤 Making test requests...');
            
            try {
                // These will be automatically intercepted
                await axios.get('http://localhost:3333/api/test');
                console.log('✅ GET /api/test intercepted');
                
                await axios.post('http://localhost:3333/api/data', { test: 'data' });
                console.log('✅ POST /api/data intercepted');
                
                // This won't be intercepted (doesn't match patterns)
                await axios.get('http://localhost:3333/health');
                console.log('⏭️ GET /health skipped (no match)');
            } catch (error) {
                // Ignore
            }
            
            setTimeout(() => {
                server.close();
                console.log('\n✅ Demo complete!');
                process.exit(0);
            }, 1000);
        }, 1000);
    }
    
    demo().catch(console.error);
}
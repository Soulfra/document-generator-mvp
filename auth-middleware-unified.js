#!/usr/bin/env node

/**
 * 🔐 UNIFIED AUTH MIDDLEWARE
 * 
 * Single authentication layer that ALL services use
 * Connects to AUTH-FOUNDATION-SYSTEM as the source of truth
 * Provides middleware for Express services
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');

class UnifiedAuthMiddleware {
    constructor(options = {}) {
        this.authServiceUrl = options.authServiceUrl || 'http://localhost:8888';
        this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
        this.serviceName = options.serviceName || 'unknown-service';
        this.cache = new Map(); // Cache valid tokens for 5 minutes
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        console.log(`🔐 Unified Auth Middleware initialized for ${this.serviceName}`);
        console.log(`   Auth Service: ${this.authServiceUrl}`);
    }
    
    // Express middleware for protected routes
    requireAuth() {
        return async (req, res, next) => {
            try {
                const token = this.extractToken(req);
                
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        error: 'No authentication token provided',
                        authUrl: `${this.authServiceUrl}/login`
                    });
                }
                
                const user = await this.validateToken(token);
                
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid or expired token',
                        authUrl: `${this.authServiceUrl}/login`
                    });
                }
                
                // Add user to request
                req.user = user;
                req.token = token;
                
                // Log access
                this.logAccess(user, req);
                
                next();
                
            } catch (error) {
                console.error('Auth middleware error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Authentication service error'
                });
            }
        };
    }
    
    // Optional auth - sets user if token exists but doesn't block
    optionalAuth() {
        return async (req, res, next) => {
            try {
                const token = this.extractToken(req);
                
                if (token) {
                    const user = await this.validateToken(token);
                    if (user) {
                        req.user = user;
                        req.token = token;
                    }
                }
                
                next();
                
            } catch (error) {
                console.error('Optional auth error:', error);
                next(); // Continue without auth
            }
        };
    }
    
    // Extract token from request
    extractToken(req) {
        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        // Check query parameter
        if (req.query.token) {
            return req.query.token;
        }
        
        // Check cookie
        if (req.cookies && req.cookies.auth_token) {
            return req.cookies.auth_token;
        }
        
        return null;
    }
    
    // Validate token with auth service
    async validateToken(token) {
        // Check cache first
        const cached = this.cache.get(token);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.user;
        }
        
        try {
            // Validate with auth service
            const response = await axios.post(`${this.authServiceUrl}/api/validate`, {
                token: token
            }, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success && response.data.user) {
                // Cache valid token
                this.cache.set(token, {
                    user: response.data.user,
                    timestamp: Date.now()
                });
                
                return response.data.user;
            }
            
            return null;
            
        } catch (error) {
            console.error('Token validation failed:', error.message);
            
            // Fallback: Try to decode JWT locally if we have the secret
            if (this.jwtSecret) {
                try {
                    const decoded = jwt.verify(token, this.jwtSecret);
                    return decoded;
                } catch (jwtError) {
                    console.error('JWT decode failed:', jwtError.message);
                }
            }
            
            return null;
        }
    }
    
    // Log access for monitoring
    logAccess(user, req) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            service: this.serviceName,
            user: user.username || user.id,
            method: req.method,
            path: req.path,
            ip: req.ip || req.connection.remoteAddress
        };
        
        console.log(`🔐 Auth: ${logEntry.user} → ${logEntry.method} ${logEntry.path}`);
        
        // Could send to central logging service here
        this.sendToAuthService('access-log', logEntry);
    }
    
    // Send data to auth service
    async sendToAuthService(endpoint, data) {
        try {
            await axios.post(`${this.authServiceUrl}/api/${endpoint}`, data, {
                timeout: 2000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Name': this.serviceName
                }
            });
        } catch (error) {
            // Don't throw - logging shouldn't break the service
            console.warn('Failed to send to auth service:', error.message);
        }
    }
    
    // Check if auth service is available
    async healthCheck() {
        try {
            const response = await axios.get(`${this.authServiceUrl}/health`, {
                timeout: 3000
            });
            
            return response.status === 200;
        } catch (error) {
            console.warn('Auth service health check failed:', error.message);
            return false;
        }
    }
    
    // Generate login redirect URL
    getLoginUrl(returnTo = null) {
        const params = new URLSearchParams();
        if (returnTo) {
            params.set('returnTo', returnTo);
        }
        params.set('service', this.serviceName);
        
        return `${this.authServiceUrl}/login?${params.toString()}`;
    }
    
    // Clear token cache
    clearCache() {
        this.cache.clear();
        console.log('🔐 Auth cache cleared');
    }
    
    // Admin middleware - requires admin role
    requireAdmin() {
        return async (req, res, next) => {
            const authMiddleware = this.requireAuth();
            
            return authMiddleware(req, res, () => {
                if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
                    return res.status(403).json({
                        success: false,
                        error: 'Admin access required'
                    });
                }
                next();
            });
        };
    }
}

// Utility function to create auth middleware for a service
function createAuthMiddleware(serviceName, options = {}) {
    return new UnifiedAuthMiddleware({
        serviceName,
        ...options
    });
}

// Export both class and factory function
module.exports = {
    UnifiedAuthMiddleware,
    createAuthMiddleware
};
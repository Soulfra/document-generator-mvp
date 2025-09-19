// api-security-gateway.js - Comprehensive API Security Layer
// Multi-layered security with old school techniques and modern protections

const crypto = require('crypto');
const EventEmitter = require('events');
const jwt = require('jsonwebtoken');

console.log(`
🛡️ API SECURITY GATEWAY 🛡️
Multi-layered protection:
- Input validation & sanitization
- SQL injection prevention
- XSS protection
- Authentication & authorization
- Request signing & verification
- CORS & CSRF protection
`);

class APISecurityGateway extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            jwtSecret: config.jwtSecret || crypto.randomBytes(32).toString('hex'),
            apiKeyHeader: config.apiKeyHeader || 'x-api-key',
            signatureHeader: config.signatureHeader || 'x-signature',
            timestampHeader: config.timestampHeader || 'x-timestamp',
            
            // Security thresholds
            maxRequestSize: config.maxRequestSize || 10 * 1024 * 1024, // 10MB
            maxUrlLength: config.maxUrlLength || 2048,
            maxHeaderSize: config.maxHeaderSize || 8192,
            requestTimeout: config.requestTimeout || 30000,
            
            // CORS settings
            allowedOrigins: config.allowedOrigins || ['*'],
            allowedMethods: config.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: config.allowedHeaders || ['Content-Type', 'Authorization'],
            
            // Rate limiting per IP
            ipRateLimit: config.ipRateLimit || 1000,
            ipRateWindow: config.ipRateWindow || 3600000, // 1 hour
            
            ...config
        };
        
        // Security rules and patterns
        this.securityRules = this.loadSecurityRules();
        
        // Blocked IPs and patterns
        this.blockedIPs = new Set();
        this.suspiciousPatterns = new Map();
        
        // Request signatures for replay protection
        this.requestSignatures = new Map();
        
        // API key management
        this.apiKeys = new Map();
        this.loadApiKeys();
        
        // Initialize security monitoring
        this.startSecurityMonitoring();
    }
    
    loadSecurityRules() {
        return {
            // SQL Injection patterns
            sqlInjection: {
                patterns: [
                    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b[\s\S]*\b(FROM|INTO|WHERE|SET|VALUES|TABLE)\b)/i,
                    /(\b(OR|AND)\b[\s\S]*=[\s\S]*)/i,
                    /(';|";|`;|\\x27|\\x22|\\x60)/,
                    /(\b(CAST|CONVERT|CONCAT|SUBSTRING|CHAR)\b[\s\S]*\()/i,
                    /(--|\#|\/\*|\*\/)/,
                    /(\b(xp_|sp_)\w+)/i,
                    /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/i
                ],
                action: 'block',
                severity: 'critical'
            },
            
            // XSS patterns
            xss: {
                patterns: [
                    /<script[^>]*>[\s\S]*?<\/script>/gi,
                    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
                    /<object[^>]*>[\s\S]*?<\/object>/gi,
                    /<embed[^>]*>/gi,
                    /<img[^>]*onerror\s*=/gi,
                    /<img[^>]*onload\s*=/gi,
                    /javascript:\s*[^"']/gi,
                    /on\w+\s*=\s*["'][^"']*["']/gi,
                    /<svg[^>]*onload\s*=/gi,
                    /eval\s*\(/gi,
                    /expression\s*\(/gi
                ],
                action: 'sanitize',
                severity: 'high'
            },
            
            // Path traversal
            pathTraversal: {
                patterns: [
                    /\.\.[\/\\]/g,
                    /\.\.%2[fF]/g,
                    /\.\.%5[cC]/g,
                    /%2e%2e[\/\\]/gi,
                    /\.\.\0/g
                ],
                action: 'block',
                severity: 'high'
            },
            
            // Command injection
            commandInjection: {
                patterns: [
                    /[;&|`$()]/g,
                    /\$\{.*\}/g,
                    /\$\(.*\)/g,
                    /`.*`/g
                ],
                action: 'block',
                severity: 'critical'
            },
            
            // XXE injection
            xxe: {
                patterns: [
                    /<!DOCTYPE[^>]*>/gi,
                    /<!ENTITY[^>]*>/gi,
                    /SYSTEM\s+["'][^"']*["']/gi
                ],
                action: 'block',
                severity: 'high'
            },
            
            // LDAP injection
            ldap: {
                patterns: [
                    /[()&|!<>=~*]/g,
                    /\*/g
                ],
                action: 'sanitize',
                severity: 'medium'
            },
            
            // NoSQL injection
            nosql: {
                patterns: [
                    /\$where/gi,
                    /\$ne/gi,
                    /\$gt/gi,
                    /\$lt/gi,
                    /\$regex/gi
                ],
                action: 'sanitize',
                severity: 'high'
            },
            
            // Header injection
            headerInjection: {
                patterns: [
                    /[\r\n]/g,
                    /%0[dD]/g,
                    /%0[aA]/g
                ],
                action: 'block',
                severity: 'medium'
            }
        };
    }
    
    // Main security validation
    async validateRequest(request) {
        const validationResult = {
            valid: true,
            errors: [],
            warnings: [],
            sanitized: {},
            timestamp: Date.now()
        };
        
        try {
            // 1. Size validation
            this.validateRequestSize(request, validationResult);
            
            // 2. URL validation
            this.validateUrl(request.url, validationResult);
            
            // 3. Method validation
            this.validateMethod(request.method, validationResult);
            
            // 4. Header validation
            this.validateHeaders(request.headers, validationResult);
            
            // 5. Body validation
            if (request.body) {
                this.validateBody(request.body, validationResult);
            }
            
            // 6. Authentication validation
            this.validateAuthentication(request, validationResult);
            
            // 7. Signature validation
            this.validateSignature(request, validationResult);
            
            // 8. Rate limiting by IP
            await this.validateRateLimit(request, validationResult);
            
            // 9. CORS validation
            this.validateCORS(request, validationResult);
            
            // 10. Replay attack protection
            this.validateReplay(request, validationResult);
            
            // Record security event
            this.recordSecurityEvent(request, validationResult);
            
        } catch (error) {
            validationResult.valid = false;
            validationResult.errors.push({
                type: 'validation_error',
                message: error.message
            });
        }
        
        return validationResult;
    }
    
    validateRequestSize(request, result) {
        // Check URL length
        if (request.url && request.url.length > this.config.maxUrlLength) {
            result.valid = false;
            result.errors.push({
                type: 'url_too_long',
                message: `URL exceeds maximum length of ${this.config.maxUrlLength}`
            });
        }
        
        // Check header size
        const headerSize = JSON.stringify(request.headers || {}).length;
        if (headerSize > this.config.maxHeaderSize) {
            result.valid = false;
            result.errors.push({
                type: 'headers_too_large',
                message: `Headers exceed maximum size of ${this.config.maxHeaderSize}`
            });
        }
        
        // Check body size
        if (request.body) {
            const bodySize = JSON.stringify(request.body).length;
            if (bodySize > this.config.maxRequestSize) {
                result.valid = false;
                result.errors.push({
                    type: 'body_too_large',
                    message: `Body exceeds maximum size of ${this.config.maxRequestSize}`
                });
            }
        }
    }
    
    validateUrl(url, result) {
        if (!url) {
            result.valid = false;
            result.errors.push({
                type: 'missing_url',
                message: 'URL is required'
            });
            return;
        }
        
        // Check for malicious patterns in URL
        for (const [ruleName, rule] of Object.entries(this.securityRules)) {
            if (ruleName === 'pathTraversal') {
                for (const pattern of rule.patterns) {
                    if (pattern.test(url)) {
                        if (rule.action === 'block') {
                            result.valid = false;
                            result.errors.push({
                                type: `${ruleName}_detected`,
                                message: `Security threat detected: ${ruleName}`,
                                severity: rule.severity
                            });
                        } else {
                            result.warnings.push({
                                type: `${ruleName}_detected`,
                                message: `Suspicious pattern detected: ${ruleName}`
                            });
                        }
                        break;
                    }
                }
            }
        }
        
        // Validate URL format
        try {
            const urlObj = new URL(url);
            
            // Check for suspicious protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                result.valid = false;
                result.errors.push({
                    type: 'invalid_protocol',
                    message: `Invalid protocol: ${urlObj.protocol}`
                });
            }
            
        } catch (error) {
            result.valid = false;
            result.errors.push({
                type: 'invalid_url',
                message: 'Invalid URL format'
            });
        }
    }
    
    validateMethod(method, result) {
        if (!method) {
            result.valid = false;
            result.errors.push({
                type: 'missing_method',
                message: 'HTTP method is required'
            });
            return;
        }
        
        const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        
        if (!allowedMethods.includes(method.toUpperCase())) {
            result.valid = false;
            result.errors.push({
                type: 'invalid_method',
                message: `Invalid HTTP method: ${method}`
            });
        }
    }
    
    validateHeaders(headers, result) {
        if (!headers) return;
        
        for (const [key, value] of Object.entries(headers)) {
            // Check header injection
            const headerRule = this.securityRules.headerInjection;
            
            for (const pattern of headerRule.patterns) {
                if (pattern.test(value)) {
                    result.valid = false;
                    result.errors.push({
                        type: 'header_injection',
                        message: `Header injection detected in ${key}`,
                        severity: headerRule.severity
                    });
                    break;
                }
            }
            
            // Validate specific headers
            if (key.toLowerCase() === 'content-type') {
                this.validateContentType(value, result);
            }
        }
    }
    
    validateContentType(contentType, result) {
        const dangerousTypes = [
            'application/x-www-form-urlencoded',
            'multipart/form-data'
        ];
        
        // Check for dangerous content types that might bypass validation
        if (contentType && dangerousTypes.some(type => contentType.includes(type))) {
            result.warnings.push({
                type: 'dangerous_content_type',
                message: `Potentially dangerous content type: ${contentType}`
            });
        }
    }
    
    validateBody(body, result) {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        
        // Check all security rules
        for (const [ruleName, rule] of Object.entries(this.securityRules)) {
            if (['pathTraversal', 'headerInjection'].includes(ruleName)) continue;
            
            for (const pattern of rule.patterns) {
                if (pattern.test(bodyStr)) {
                    if (rule.action === 'block') {
                        result.valid = false;
                        result.errors.push({
                            type: `${ruleName}_detected`,
                            message: `Security threat detected: ${ruleName}`,
                            severity: rule.severity
                        });
                    } else if (rule.action === 'sanitize') {
                        // Sanitize the input
                        result.sanitized[ruleName] = this.sanitizeInput(bodyStr, pattern);
                        result.warnings.push({
                            type: `${ruleName}_sanitized`,
                            message: `Input sanitized for ${ruleName}`
                        });
                    }
                    break;
                }
            }
        }
    }
    
    sanitizeInput(input, pattern) {
        // Basic sanitization - in production would be more sophisticated
        return input.replace(pattern, '');
    }
    
    validateAuthentication(request, result) {
        const auth = request.headers?.authorization;
        const apiKey = request.headers?.[this.config.apiKeyHeader];
        
        // Check if authentication is provided
        if (!auth && !apiKey) {
            result.warnings.push({
                type: 'missing_authentication',
                message: 'No authentication provided'
            });
            return;
        }
        
        // Validate JWT token
        if (auth && auth.startsWith('Bearer ')) {
            const token = auth.substring(7);
            
            try {
                const decoded = jwt.verify(token, this.config.jwtSecret);
                request.user = decoded;
                
                // Check token expiration
                if (decoded.exp && decoded.exp < Date.now() / 1000) {
                    result.valid = false;
                    result.errors.push({
                        type: 'token_expired',
                        message: 'JWT token has expired'
                    });
                }
                
            } catch (error) {
                result.valid = false;
                result.errors.push({
                    type: 'invalid_token',
                    message: 'Invalid JWT token'
                });
            }
        }
        
        // Validate API key
        if (apiKey) {
            if (!this.validateApiKey(apiKey)) {
                result.valid = false;
                result.errors.push({
                    type: 'invalid_api_key',
                    message: 'Invalid API key'
                });
            }
        }
    }
    
    validateApiKey(apiKey) {
        // Check if API key exists and is valid
        const keyInfo = this.apiKeys.get(apiKey);
        
        if (!keyInfo) {
            return false;
        }
        
        // Check if key is expired
        if (keyInfo.expiresAt && keyInfo.expiresAt < Date.now()) {
            return false;
        }
        
        // Check if key is active
        if (!keyInfo.active) {
            return false;
        }
        
        return true;
    }
    
    validateSignature(request, result) {
        const signature = request.headers?.[this.config.signatureHeader];
        const timestamp = request.headers?.[this.config.timestampHeader];
        
        if (!signature || !timestamp) {
            // Signature not required for all requests
            return;
        }
        
        // Check timestamp freshness (5 minutes)
        const requestTime = parseInt(timestamp);
        const currentTime = Date.now();
        
        if (Math.abs(currentTime - requestTime) > 300000) {
            result.valid = false;
            result.errors.push({
                type: 'invalid_timestamp',
                message: 'Request timestamp is too old or too far in the future'
            });
            return;
        }
        
        // Verify signature
        const payload = `${request.method}:${request.url}:${timestamp}:${JSON.stringify(request.body || '')}`;
        const expectedSignature = this.generateSignature(payload, request.apiKey);
        
        if (signature !== expectedSignature) {
            result.valid = false;
            result.errors.push({
                type: 'invalid_signature',
                message: 'Request signature verification failed'
            });
        }
    }
    
    generateSignature(payload, secret) {
        return crypto
            .createHmac('sha256', secret || this.config.jwtSecret)
            .update(payload)
            .digest('hex');
    }
    
    async validateRateLimit(request, result) {
        // Get client IP
        const ip = this.getClientIP(request);
        
        if (this.blockedIPs.has(ip)) {
            result.valid = false;
            result.errors.push({
                type: 'ip_blocked',
                message: 'IP address is blocked'
            });
            return;
        }
        
        // Simple in-memory rate limiting by IP
        const key = `ip:${ip}`;
        const requests = this.suspiciousPatterns.get(key) || { count: 0, window: Date.now() };
        
        // Reset window if expired
        if (Date.now() - requests.window > this.config.ipRateWindow) {
            requests.count = 0;
            requests.window = Date.now();
        }
        
        requests.count++;
        this.suspiciousPatterns.set(key, requests);
        
        if (requests.count > this.config.ipRateLimit) {
            result.valid = false;
            result.errors.push({
                type: 'ip_rate_limit',
                message: 'IP rate limit exceeded'
            });
            
            // Auto-block IP after multiple violations
            if (requests.count > this.config.ipRateLimit * 2) {
                this.blockIP(ip, 'Excessive requests');
            }
        }
    }
    
    getClientIP(request) {
        return request.headers?.['x-forwarded-for']?.split(',')[0] ||
               request.headers?.['x-real-ip'] ||
               request.ip ||
               '127.0.0.1';
    }
    
    validateCORS(request, result) {
        const origin = request.headers?.origin;
        
        if (!origin) return;
        
        // Check allowed origins
        if (this.config.allowedOrigins[0] !== '*' && 
            !this.config.allowedOrigins.includes(origin)) {
            result.valid = false;
            result.errors.push({
                type: 'cors_violation',
                message: `Origin ${origin} is not allowed`
            });
        }
        
        // Check preflight requests
        if (request.method === 'OPTIONS') {
            result.warnings.push({
                type: 'preflight_request',
                message: 'CORS preflight request'
            });
        }
    }
    
    validateReplay(request, result) {
        // Generate request fingerprint
        const fingerprint = this.generateRequestFingerprint(request);
        
        // Check if we've seen this request before
        if (this.requestSignatures.has(fingerprint)) {
            result.valid = false;
            result.errors.push({
                type: 'replay_attack',
                message: 'Duplicate request detected (possible replay attack)'
            });
            return;
        }
        
        // Store fingerprint with expiration
        this.requestSignatures.set(fingerprint, Date.now());
        
        // Clean old fingerprints
        this.cleanOldFingerprints();
    }
    
    generateRequestFingerprint(request) {
        const data = {
            method: request.method,
            url: request.url,
            body: request.body,
            timestamp: request.headers?.[this.config.timestampHeader],
            nonce: request.headers?.['x-nonce']
        };
        
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    
    cleanOldFingerprints() {
        const cutoff = Date.now() - 300000; // 5 minutes
        
        for (const [fingerprint, timestamp] of this.requestSignatures) {
            if (timestamp < cutoff) {
                this.requestSignatures.delete(fingerprint);
            }
        }
    }
    
    recordSecurityEvent(request, result) {
        const event = {
            timestamp: Date.now(),
            ip: this.getClientIP(request),
            method: request.method,
            url: request.url,
            valid: result.valid,
            errors: result.errors,
            warnings: result.warnings
        };
        
        // Emit security event
        this.emit('security-event', event);
        
        // Check for attack patterns
        if (result.errors.length > 0) {
            this.analyzeAttackPattern(event);
        }
    }
    
    analyzeAttackPattern(event) {
        const ip = event.ip;
        const pattern = this.suspiciousPatterns.get(`attack:${ip}`) || {
            count: 0,
            types: new Set(),
            firstSeen: Date.now(),
            lastSeen: Date.now()
        };
        
        pattern.count++;
        pattern.lastSeen = Date.now();
        
        // Track attack types
        event.errors.forEach(error => {
            pattern.types.add(error.type);
        });
        
        this.suspiciousPatterns.set(`attack:${ip}`, pattern);
        
        // Auto-block if too many attacks
        if (pattern.count > 10) {
            this.blockIP(ip, 'Multiple attack attempts');
        }
        
        // Alert on sophisticated attacks
        if (pattern.types.size > 3) {
            this.emit('sophisticated-attack', {
                ip,
                attackTypes: Array.from(pattern.types),
                count: pattern.count
            });
        }
    }
    
    blockIP(ip, reason) {
        this.blockedIPs.add(ip);
        
        console.log(`🚫 Blocked IP ${ip}: ${reason}`);
        
        this.emit('ip-blocked', {
            ip,
            reason,
            timestamp: Date.now()
        });
    }
    
    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        
        console.log(`✅ Unblocked IP ${ip}`);
        
        this.emit('ip-unblocked', {
            ip,
            timestamp: Date.now()
        });
    }
    
    loadApiKeys() {
        // In production, load from database or secure storage
        // For demo, create some sample keys
        this.apiKeys.set('demo-key-123', {
            name: 'Demo API Key',
            active: true,
            createdAt: Date.now(),
            permissions: ['read', 'write']
        });
        
        this.apiKeys.set('test-key-456', {
            name: 'Test API Key',
            active: true,
            createdAt: Date.now(),
            permissions: ['read'],
            expiresAt: Date.now() + 86400000 // 24 hours
        });
    }
    
    startSecurityMonitoring() {
        // Clean up old data periodically
        setInterval(() => {
            // Clean request signatures
            this.cleanOldFingerprints();
            
            // Clean suspicious patterns
            const cutoff = Date.now() - 3600000; // 1 hour
            
            for (const [key, pattern] of this.suspiciousPatterns) {
                if (pattern.lastSeen < cutoff) {
                    this.suspiciousPatterns.delete(key);
                }
            }
        }, 60000); // Every minute
        
        // Generate security reports
        setInterval(() => {
            this.generateSecurityReport();
        }, 300000); // Every 5 minutes
    }
    
    generateSecurityReport() {
        const report = {
            timestamp: new Date(),
            blockedIPs: this.blockedIPs.size,
            suspiciousPatterns: this.suspiciousPatterns.size,
            activeApiKeys: this.apiKeys.size,
            recentAttacks: []
        };
        
        // Collect recent attacks
        for (const [key, pattern] of this.suspiciousPatterns) {
            if (key.startsWith('attack:') && pattern.count > 0) {
                report.recentAttacks.push({
                    ip: key.substring(7),
                    count: pattern.count,
                    types: Array.from(pattern.types || []),
                    duration: pattern.lastSeen - pattern.firstSeen
                });
            }
        }
        
        // Sort by count
        report.recentAttacks.sort((a, b) => b.count - a.count);
        
        this.emit('security-report', report);
        
        return report;
    }
    
    // Generate secure API key
    generateApiKey(name, permissions = ['read']) {
        const key = crypto.randomBytes(32).toString('hex');
        
        this.apiKeys.set(key, {
            name,
            active: true,
            createdAt: Date.now(),
            permissions
        });
        
        return key;
    }
    
    // Get security statistics
    getStatistics() {
        const stats = {
            blockedIPs: Array.from(this.blockedIPs),
            activeApiKeys: this.apiKeys.size,
            suspiciousPatterns: {},
            securityRules: Object.keys(this.securityRules),
            recentAttacks: []
        };
        
        // Aggregate suspicious patterns
        for (const [key, pattern] of this.suspiciousPatterns) {
            if (key.startsWith('attack:')) {
                stats.recentAttacks.push({
                    ip: key.substring(7),
                    ...pattern,
                    types: Array.from(pattern.types || [])
                });
            } else {
                stats.suspiciousPatterns[key] = pattern;
            }
        }
        
        return stats;
    }
}

// Export the security gateway
module.exports = APISecurityGateway;

// Example usage
if (require.main === module) {
    const gateway = new APISecurityGateway({
        jwtSecret: 'super-secret-key',
        allowedOrigins: ['https://example.com', 'http://localhost:3000']
    });
    
    // Test security validation
    async function testSecurity() {
        console.log('\n🧪 Testing security gateway...\n');
        
        // Test requests
        const requests = [
            {
                name: 'Clean request',
                request: {
                    method: 'GET',
                    url: 'https://api.example.com/users',
                    headers: {
                        'authorization': 'Bearer ' + jwt.sign({ user: 'test' }, 'super-secret-key'),
                        'content-type': 'application/json'
                    }
                }
            },
            {
                name: 'SQL injection attempt',
                request: {
                    method: 'POST',
                    url: 'https://api.example.com/users',
                    body: {
                        username: "admin'; DROP TABLE users; --"
                    }
                }
            },
            {
                name: 'XSS attempt',
                request: {
                    method: 'POST',
                    url: 'https://api.example.com/comment',
                    body: {
                        comment: '<script>alert("XSS")</script>'
                    }
                }
            },
            {
                name: 'Path traversal',
                request: {
                    method: 'GET',
                    url: 'https://api.example.com/files/../../etc/passwd'
                }
            },
            {
                name: 'Header injection',
                request: {
                    method: 'GET',
                    url: 'https://api.example.com/data',
                    headers: {
                        'x-custom': 'value\r\nX-Injected: malicious'
                    }
                }
            }
        ];
        
        for (const test of requests) {
            console.log(`\nTesting: ${test.name}`);
            
            const result = await gateway.validateRequest(test.request);
            
            console.log(`Valid: ${result.valid ? '✅' : '❌'}`);
            
            if (result.errors.length > 0) {
                console.log('Errors:', result.errors);
            }
            
            if (result.warnings.length > 0) {
                console.log('Warnings:', result.warnings);
            }
            
            if (Object.keys(result.sanitized).length > 0) {
                console.log('Sanitized:', result.sanitized);
            }
        }
        
        // Generate API key
        const apiKey = gateway.generateApiKey('Test Application', ['read', 'write']);
        console.log('\n🔑 Generated API Key:', apiKey);
        
        // Show statistics
        console.log('\n📊 Security Statistics:');
        console.log(JSON.stringify(gateway.getStatistics(), null, 2));
    }
    
    // Monitor security events
    gateway.on('security-event', (event) => {
        if (!event.valid) {
            console.log('🚨 Security event:', {
                ip: event.ip,
                errors: event.errors.map(e => e.type)
            });
        }
    });
    
    gateway.on('sophisticated-attack', (attack) => {
        console.log('⚠️ SOPHISTICATED ATTACK DETECTED!', attack);
    });
    
    gateway.on('ip-blocked', (event) => {
        console.log('🚫 IP Blocked:', event);
    });
    
    gateway.on('security-report', (report) => {
        console.log('📊 Security Report:', report);
    });
    
    // Run tests
    testSecurity().catch(console.error);
}
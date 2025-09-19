#!/usr/bin/env node
/**
 * CAPTCHA SECURITY LAYER
 * Multi-provider CAPTCHA integration with advanced security features
 * 
 * Features:
 * - Multiple CAPTCHA providers (Cloudflare Turnstile, Google reCAPTCHA, hCaptcha)
 * - Adaptive challenge difficulty based on risk assessment
 * - Bot detection and behavioral analysis
 * - Integration with SoulFra authentication system
 * - Real-time threat intelligence
 * - Custom challenge generation
 */

const crypto = require('crypto');
const https = require('https');

class CAPTCHASecurityLayer {
    constructor(config = {}) {
        this.config = {
            // CAPTCHA provider configurations
            providers: {
                'cloudflare-turnstile': {
                    siteKey: config.turnsiteSiteKey || 'demo_site_key',
                    secretKey: config.turnstileSecretKey || 'demo_secret_key',
                    endpoint: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                    enabled: config.enableTurnstile !== false,
                    priority: 1
                },
                'google-recaptcha': {
                    siteKey: config.recaptchaSiteKey || 'demo_site_key',
                    secretKey: config.recaptchaSecretKey || 'demo_secret_key',
                    endpoint: 'https://www.google.com/recaptcha/api/siteverify',
                    enabled: config.enableRecaptcha !== false,
                    priority: 2
                },
                'hcaptcha': {
                    siteKey: config.hcaptchaSiteKey || 'demo_site_key',
                    secretKey: config.hcaptchaSecretKey || 'demo_secret_key',
                    endpoint: 'https://hcaptcha.com/siteverify',
                    enabled: config.enableHCaptcha !== false,
                    priority: 3
                }
            },

            // Security settings
            riskThresholds: {
                low: 0.3,        // Show simple CAPTCHA
                medium: 0.6,     // Show standard CAPTCHA
                high: 0.8,       // Show difficult CAPTCHA + additional verification
                critical: 0.95   // Block or require manual review
            },

            // Bot detection
            botDetection: {
                enabled: config.enableBotDetection !== false,
                checkUserAgent: true,
                checkBehavior: true,
                checkFingerprint: true,
                checkTiming: true
            },

            // Challenge settings
            challengeSettings: {
                maxAttempts: config.maxAttempts || 3,
                timeoutSeconds: config.timeoutSeconds || 300,
                adaptiveDifficulty: config.adaptiveDifficulty !== false,
                customChallenges: config.enableCustomChallenges || false
            },

            // Integration
            soulfraIntegration: config.enableSoulfraIntegration !== false,
            whitelistEnabled: config.enableWhitelist !== false,
            
            ...config
        };

        // Internal state
        this.activeChallenges = new Map();
        this.attemptHistory = new Map();
        this.whitelist = new Set();
        this.blacklist = new Set();
        this.riskCache = new Map();
        
        // Statistics
        this.stats = {
            totalChallenges: 0,
            successfulValidations: 0,
            failedValidations: 0,
            botDetections: 0,
            adaptiveAdjustments: 0
        };

        this.initialize();
    }

    async initialize() {
        console.log('🛡️ Initializing CAPTCHA Security Layer...');
        
        // Load whitelists and blacklists
        await this.loadSecurityLists();
        
        // Start background processes
        this.startChallengeCleanup();
        this.startRiskMonitoring();
        
        console.log('✅ CAPTCHA Security Layer initialized');
        this.logProviderStatus();
    }

    // ==================== MAIN CHALLENGE FLOW ====================
    
    async createChallenge(request, riskScore = null) {
        this.stats.totalChallenges++;
        
        try {
            // Calculate risk score if not provided
            if (riskScore === null) {
                riskScore = await this.calculateRiskScore(request);
            }

            // Check whitelist first
            if (this.isWhitelisted(request)) {
                return this.createBypassChallenge(request);
            }

            // Check blacklist
            if (this.isBlacklisted(request)) {
                return this.createBlockChallenge(request);
            }

            // Determine challenge type based on risk
            const challengeType = this.determineChallengeType(riskScore);
            
            // Select best provider for challenge
            const provider = this.selectProvider(challengeType, request);
            
            // Create challenge
            const challenge = await this.generateChallenge(provider, challengeType, request, riskScore);
            
            // Store challenge for verification
            this.activeChallenges.set(challenge.challengeId, {
                ...challenge,
                createdAt: Date.now(),
                attempts: 0,
                riskScore
            });

            console.log(`🔒 Created ${challengeType} challenge (${provider}) for ${this.getClientId(request)}`);
            
            return challenge;
        } catch (error) {
            console.error('Failed to create challenge:', error);
            return this.createFallbackChallenge(request);
        }
    }

    async validateChallenge(challengeId, response, request) {
        const challenge = this.activeChallenges.get(challengeId);
        
        if (!challenge) {
            return {
                valid: false,
                error: 'Challenge not found or expired',
                action: 'retry'
            };
        }

        // Increment attempt count
        challenge.attempts++;
        
        // Check max attempts
        if (challenge.attempts > this.config.challengeSettings.maxAttempts) {
            this.activeChallenges.delete(challengeId);
            this.recordFailure(request, 'max_attempts_exceeded');
            
            return {
                valid: false,
                error: 'Maximum attempts exceeded',
                action: 'block'
            };
        }

        try {
            // Validate with appropriate provider
            const validation = await this.validateWithProvider(challenge.provider, response, request);
            
            if (validation.valid) {
                // Success - clean up challenge
                this.activeChallenges.delete(challengeId);
                this.recordSuccess(request, challenge);
                this.stats.successfulValidations++;
                
                return {
                    valid: true,
                    score: validation.score || 1.0,
                    provider: challenge.provider,
                    riskScore: challenge.riskScore
                };
            } else {
                // Failed validation
                this.recordFailure(request, 'validation_failed');
                this.stats.failedValidations++;
                
                // Adaptive difficulty - make next challenge harder
                if (this.config.challengeSettings.adaptiveDifficulty) {
                    await this.adjustDifficulty(request, 'increase');
                }
                
                return {
                    valid: false,
                    error: validation.error || 'Validation failed',
                    action: 'retry',
                    attemptsRemaining: this.config.challengeSettings.maxAttempts - challenge.attempts
                };
            }
        } catch (error) {
            console.error('Challenge validation error:', error);
            return {
                valid: false,
                error: 'Validation service unavailable',
                action: 'retry'
            };
        }
    }

    // ==================== RISK ASSESSMENT ====================
    
    async calculateRiskScore(request) {
        const clientId = this.getClientId(request);
        
        // Check cache first
        if (this.riskCache.has(clientId)) {
            const cached = this.riskCache.get(clientId);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.score;
            }
        }

        let riskScore = 0;
        const factors = [];

        // IP reputation check
        const ipRisk = await this.checkIpReputation(request.clientIp);
        riskScore += ipRisk * 0.3;
        if (ipRisk > 0.5) factors.push('suspicious_ip');

        // User agent analysis
        const uaRisk = this.analyzeUserAgent(request.userAgent);
        riskScore += uaRisk * 0.2;
        if (uaRisk > 0.5) factors.push('suspicious_ua');

        // Behavioral analysis
        const behaviorRisk = this.analyzeBehavior(request);
        riskScore += behaviorRisk * 0.3;
        if (behaviorRisk > 0.5) factors.push('suspicious_behavior');

        // Frequency analysis
        const frequencyRisk = this.analyzeFrequency(clientId);
        riskScore += frequencyRisk * 0.2;
        if (frequencyRisk > 0.5) factors.push('high_frequency');

        // Bot detection signals
        if (this.config.botDetection.enabled) {
            const botRisk = this.detectBot(request);
            if (botRisk > 0.8) {
                riskScore += 0.5;
                factors.push('bot_detected');
                this.stats.botDetections++;
            }
        }

        riskScore = Math.min(riskScore, 1.0); // Cap at 1.0
        
        // Cache result
        this.riskCache.set(clientId, {
            score: riskScore,
            factors,
            timestamp: Date.now()
        });

        return riskScore;
    }

    async checkIpReputation(ip) {
        // In production, this would integrate with threat intelligence APIs
        const suspiciousIps = ['192.168.1.666', '10.0.0.666']; // Mock suspicious IPs
        
        if (suspiciousIps.includes(ip)) {
            return 0.9;
        }

        // Check if IP is from known VPN/proxy ranges
        if (this.isVpnIp(ip)) {
            return 0.4;
        }

        // Check geographic location vs expected
        const geoRisk = await this.checkGeographicAnomaly(ip);
        
        return Math.min(geoRisk, 0.8);
    }

    analyzeUserAgent(userAgent) {
        if (!userAgent) return 0.9;

        const botPatterns = [
            /bot/i, /crawler/i, /spider/i, /scraper/i,
            /python/i, /curl/i, /wget/i, /httpie/i,
            /postman/i, /insomnia/i
        ];

        for (const pattern of botPatterns) {
            if (pattern.test(userAgent)) {
                return 0.8;
            }
        }

        // Check for legitimate browser patterns
        const browserPatterns = [
            /Mozilla\/5\.0.*Chrome/i,
            /Mozilla\/5\.0.*Firefox/i,
            /Mozilla\/5\.0.*Safari/i,
            /Mozilla\/5\.0.*Edge/i
        ];

        for (const pattern of browserPatterns) {
            if (pattern.test(userAgent)) {
                return 0.1;
            }
        }

        return 0.5; // Unknown user agent
    }

    analyzeBehavior(request) {
        let riskScore = 0;

        // Check timing patterns
        if (request.timing) {
            const { requestTime, navigationTime, renderTime } = request.timing;
            
            // Suspiciously fast interactions
            if (requestTime < 100) riskScore += 0.3;
            if (navigationTime < 50) riskScore += 0.2;
            
            // No render time (headless browser)
            if (!renderTime) riskScore += 0.4;
        }

        // Check interaction patterns
        if (request.interactions) {
            const { mouseMovements, keystrokes, scrollEvents } = request.interactions;
            
            // No human-like interactions
            if (!mouseMovements && !scrollEvents) riskScore += 0.5;
            
            // Robotic keystroke patterns
            if (keystrokes && this.isRoboticKeystrokes(keystrokes)) {
                riskScore += 0.3;
            }
        }

        // Check fingerprint consistency
        if (request.fingerprint && this.hasInconsistentFingerprint(request)) {
            riskScore += 0.3;
        }

        return Math.min(riskScore, 1.0);
    }

    analyzeFrequency(clientId) {
        const history = this.attemptHistory.get(clientId) || [];
        const now = Date.now();
        const recentAttempts = history.filter(time => now - time < 60000); // Last minute

        if (recentAttempts.length > 10) return 0.9;
        if (recentAttempts.length > 5) return 0.6;
        if (recentAttempts.length > 3) return 0.3;
        
        return 0.1;
    }

    detectBot(request) {
        let botScore = 0;

        // Check for headless browser indicators
        if (this.isHeadlessBrowser(request)) {
            botScore += 0.5;
        }

        // Check for automation frameworks
        if (this.hasAutomationSignatures(request)) {
            botScore += 0.4;
        }

        // Check for missing browser features
        if (this.hasMissingBrowserFeatures(request)) {
            botScore += 0.3;
        }

        return Math.min(botScore, 1.0);
    }

    // ==================== CHALLENGE GENERATION ====================
    
    determineChallengeType(riskScore) {
        const thresholds = this.config.riskThresholds;
        
        if (riskScore >= thresholds.critical) return 'block';
        if (riskScore >= thresholds.high) return 'difficult';
        if (riskScore >= thresholds.medium) return 'standard';
        if (riskScore >= thresholds.low) return 'simple';
        
        return 'invisible'; // Very low risk
    }

    selectProvider(challengeType, request) {
        // Select provider based on availability and challenge type
        const availableProviders = Object.entries(this.config.providers)
            .filter(([name, config]) => config.enabled)
            .sort((a, b) => a[1].priority - b[1].priority);

        if (availableProviders.length === 0) {
            throw new Error('No CAPTCHA providers available');
        }

        // For high-risk challenges, prefer Cloudflare Turnstile
        if (challengeType === 'difficult' || challengeType === 'standard') {
            const turnstile = availableProviders.find(([name]) => name === 'cloudflare-turnstile');
            if (turnstile) return 'cloudflare-turnstile';
        }

        // Default to highest priority available provider
        return availableProviders[0][0];
    }

    async generateChallenge(provider, challengeType, request, riskScore) {
        const challengeId = this.generateChallengeId();
        const providerConfig = this.config.providers[provider];

        const challenge = {
            challengeId,
            provider,
            type: challengeType,
            siteKey: providerConfig.siteKey,
            endpoint: this.getChallengeEndpoint(provider, challengeType),
            clientId: this.getClientId(request),
            riskScore,
            metadata: {
                userAgent: request.userAgent,
                clientIp: request.clientIp,
                domain: request.domain || 'unknown'
            }
        };

        // Add provider-specific configuration
        switch (provider) {
            case 'cloudflare-turnstile':
                challenge.theme = riskScore > 0.7 ? 'dark' : 'light';
                challenge.size = challengeType === 'simple' ? 'compact' : 'normal';
                break;
                
            case 'google-recaptcha':
                challenge.version = 'v2';
                challenge.theme = 'dark';
                challenge.size = challengeType === 'simple' ? 'compact' : 'normal';
                break;
                
            case 'hcaptcha':
                challenge.theme = 'dark';
                challenge.size = 'normal';
                break;
        }

        // Add custom challenge elements for high-risk scenarios
        if (challengeType === 'difficult') {
            challenge.additionalVerification = {
                required: true,
                type: 'behavioral',
                minimumInteractionTime: 5000
            };
        }

        return challenge;
    }

    createBypassChallenge(request) {
        return {
            challengeId: this.generateChallengeId(),
            type: 'bypass',
            provider: 'whitelist',
            valid: true,
            message: 'Whitelisted client - no challenge required'
        };
    }

    createBlockChallenge(request) {
        return {
            challengeId: this.generateChallengeId(),
            type: 'block',
            provider: 'blacklist',
            valid: false,
            message: 'Access denied - blacklisted client',
            action: 'block'
        };
    }

    createFallbackChallenge(request) {
        return {
            challengeId: this.generateChallengeId(),
            type: 'fallback',
            provider: 'system',
            message: 'Please verify you are human',
            mathChallenge: this.generateMathChallenge(),
            valid: false
        };
    }

    // ==================== PROVIDER VALIDATION ====================
    
    async validateWithProvider(provider, response, request) {
        switch (provider) {
            case 'cloudflare-turnstile':
                return this.validateTurnstile(response, request);
            case 'google-recaptcha':
                return this.validateRecaptcha(response, request);
            case 'hcaptcha':
                return this.validateHCaptcha(response, request);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    async validateTurnstile(token, request) {
        const providerConfig = this.config.providers['cloudflare-turnstile'];
        
        const postData = JSON.stringify({
            secret: providerConfig.secretKey,
            response: token,
            remoteip: request.clientIp
        });

        try {
            const result = await this.makeHttpRequest(providerConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                body: postData
            });

            const data = JSON.parse(result);
            
            return {
                valid: data.success === true,
                score: data.score || (data.success ? 1.0 : 0.0),
                error: data['error-codes'] ? data['error-codes'].join(', ') : null
            };
        } catch (error) {
            console.error('Turnstile validation error:', error);
            return {
                valid: false,
                error: 'Validation service error'
            };
        }
    }

    async validateRecaptcha(token, request) {
        // Similar implementation to Turnstile but for Google reCAPTCHA
        const providerConfig = this.config.providers['google-recaptcha'];
        
        const postData = new URLSearchParams({
            secret: providerConfig.secretKey,
            response: token,
            remoteip: request.clientIp
        }).toString();

        try {
            const result = await this.makeHttpRequest(providerConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: postData
            });

            const data = JSON.parse(result);
            
            return {
                valid: data.success === true,
                score: data.score || (data.success ? 1.0 : 0.0),
                error: data['error-codes'] ? data['error-codes'].join(', ') : null
            };
        } catch (error) {
            return {
                valid: false,
                error: 'reCAPTCHA validation error'
            };
        }
    }

    async validateHCaptcha(token, request) {
        // Similar implementation for hCaptcha
        const providerConfig = this.config.providers['hcaptcha'];
        
        const postData = new URLSearchParams({
            secret: providerConfig.secretKey,
            response: token,
            remoteip: request.clientIp
        }).toString();

        try {
            const result = await this.makeHttpRequest(providerConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: postData
            });

            const data = JSON.parse(result);
            
            return {
                valid: data.success === true,
                score: data.success ? 1.0 : 0.0,
                error: data['error-codes'] ? data['error-codes'].join(', ') : null
            };
        } catch (error) {
            return {
                valid: false,
                error: 'hCaptcha validation error'
            };
        }
    }

    // ==================== UTILITY METHODS ====================
    
    generateChallengeId() {
        return 'ch_' + crypto.randomBytes(16).toString('hex');
    }

    getClientId(request) {
        // Create consistent client ID from IP + User Agent
        const identifier = `${request.clientIp}:${request.userAgent || 'unknown'}`;
        return crypto.createHash('sha256').update(identifier).digest('hex').slice(0, 16);
    }

    getChallengeEndpoint(provider, challengeType) {
        // Return appropriate endpoint for challenge rendering
        const baseEndpoints = {
            'cloudflare-turnstile': 'https://challenges.cloudflare.com/turnstile/v0/api.js',
            'google-recaptcha': 'https://www.google.com/recaptcha/api.js',
            'hcaptcha': 'https://js.hcaptcha.com/1/api.js'
        };
        
        return baseEndpoints[provider];
    }

    generateMathChallenge() {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const operation = Math.random() > 0.5 ? '+' : '-';
        
        return {
            question: `${a} ${operation} ${b} = ?`,
            answer: operation === '+' ? a + b : a - b
        };
    }

    async makeHttpRequest(url, options) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    // ==================== SECURITY LIST MANAGEMENT ====================
    
    async loadSecurityLists() {
        // Load whitelists and blacklists
        // In production, these would be loaded from database or external service
        
        // Example whitelist entries
        this.whitelist.add('127.0.0.1');
        this.whitelist.add('192.168.1.1');
        
        // Example blacklist entries
        this.blacklist.add('192.168.1.666');
        this.blacklist.add('malicious-bot-user-agent');
    }

    isWhitelisted(request) {
        return this.whitelist.has(request.clientIp) || 
               this.whitelist.has(request.userAgent);
    }

    isBlacklisted(request) {
        return this.blacklist.has(request.clientIp) || 
               this.blacklist.has(request.userAgent);
    }

    // ==================== ADAPTIVE DIFFICULTY ====================
    
    async adjustDifficulty(request, direction) {
        const clientId = this.getClientId(request);
        
        if (direction === 'increase') {
            // Future challenges for this client will be more difficult
            this.riskCache.set(clientId, {
                score: Math.min((this.riskCache.get(clientId)?.score || 0) + 0.2, 1.0),
                adjusted: true,
                timestamp: Date.now()
            });
            
            this.stats.adaptiveAdjustments++;
        }
    }

    // ==================== RECORD KEEPING ====================
    
    recordSuccess(request, challenge) {
        const clientId = this.getClientId(request);
        const history = this.attemptHistory.get(clientId) || [];
        
        history.push({
            timestamp: Date.now(),
            type: 'success',
            provider: challenge.provider,
            challengeType: challenge.type,
            attempts: challenge.attempts
        });
        
        // Keep only last 100 entries
        this.attemptHistory.set(clientId, history.slice(-100));
    }

    recordFailure(request, reason) {
        const clientId = this.getClientId(request);
        const history = this.attemptHistory.get(clientId) || [];
        
        history.push({
            timestamp: Date.now(),
            type: 'failure',
            reason
        });
        
        this.attemptHistory.set(clientId, history.slice(-100));
    }

    // ==================== BACKGROUND PROCESSES ====================
    
    startChallengeCleanup() {
        setInterval(() => {
            this.cleanupExpiredChallenges();
        }, 60000); // Every minute
    }

    startRiskMonitoring() {
        setInterval(() => {
            this.monitorRiskPatterns();
        }, 300000); // Every 5 minutes
    }

    cleanupExpiredChallenges() {
        const now = Date.now();
        const timeout = this.config.challengeSettings.timeoutSeconds * 1000;
        let cleaned = 0;
        
        for (const [challengeId, challenge] of this.activeChallenges) {
            if (now - challenge.createdAt > timeout) {
                this.activeChallenges.delete(challengeId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired challenges`);
        }
    }

    monitorRiskPatterns() {
        // Analyze patterns and adjust security accordingly
        const highRiskClients = Array.from(this.riskCache.entries())
            .filter(([, data]) => data.score > 0.8)
            .length;
            
        if (highRiskClients > 10) {
            console.warn(`⚠️ High number of risky clients detected: ${highRiskClients}`);
        }
    }

    // ==================== REPORTING ====================
    
    getSecurityReport() {
        return {
            timestamp: new Date().toISOString(),
            statistics: { ...this.stats },
            activeChallenges: this.activeChallenges.size,
            riskCache: this.riskCache.size,
            providers: Object.fromEntries(
                Object.entries(this.config.providers).map(([name, config]) => [
                    name,
                    { enabled: config.enabled, priority: config.priority }
                ])
            ),
            topRiskFactors: this.getTopRiskFactors(),
            recommendations: this.generateSecurityRecommendations()
        };
    }

    getTopRiskFactors() {
        const factors = {};
        
        for (const [, data] of this.riskCache) {
            if (data.factors) {
                data.factors.forEach(factor => {
                    factors[factor] = (factors[factor] || 0) + 1;
                });
            }
        }
        
        return Object.entries(factors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([factor, count]) => ({ factor, count }));
    }

    generateSecurityRecommendations() {
        const recommendations = [];
        const successRate = this.stats.totalChallenges > 0 
            ? this.stats.successfulValidations / this.stats.totalChallenges 
            : 0;
        
        if (successRate < 0.7) {
            recommendations.push('Low success rate detected - consider adjusting challenge difficulty');
        }
        
        if (this.stats.botDetections > this.stats.totalChallenges * 0.1) {
            recommendations.push('High bot activity - consider enabling stricter validation');
        }
        
        return recommendations;
    }

    logProviderStatus() {
        console.log('🔧 CAPTCHA Provider Status:');
        Object.entries(this.config.providers).forEach(([name, config]) => {
            const status = config.enabled ? '✅' : '❌';
            console.log(`   ${status} ${name} (priority: ${config.priority})`);
        });
    }

    // Mock helper methods (would be implemented with real logic in production)
    isVpnIp(ip) { return false; }
    async checkGeographicAnomaly(ip) { return 0.1; }
    isRoboticKeystrokes(keystrokes) { return false; }
    hasInconsistentFingerprint(request) { return false; }
    isHeadlessBrowser(request) { return false; }
    hasAutomationSignatures(request) { return false; }
    hasMissingBrowserFeatures(request) { return false; }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CAPTCHASecurityLayer;
}

// CLI usage and testing
if (require.main === module) {
    async function main() {
        console.log('🛡️ Testing CAPTCHA Security Layer...');
        
        const security = new CAPTCHASecurityLayer({
            enableTurnstile: true,
            enableRecaptcha: true,
            enableHCaptcha: true,
            enableBotDetection: true
        });

        // Mock request for testing
        const mockRequest = {
            clientIp: '192.168.1.10',
            userAgent: 'Mozilla/5.0 (Test Browser)',
            domain: 'example.com',
            timing: {
                requestTime: 200,
                navigationTime: 100,
                renderTime: 50
            },
            interactions: {
                mouseMovements: 5,
                keystrokes: 10,
                scrollEvents: 3
            }
        };

        // Test challenge creation
        const challenge = await security.createChallenge(mockRequest);
        console.log('🔒 Challenge created:', challenge);

        // Test validation (mock token)
        if (challenge.type !== 'bypass' && challenge.type !== 'block') {
            const validation = await security.validateChallenge(
                challenge.challengeId,
                'mock_token_response',
                mockRequest
            );
            console.log('✅ Validation result:', validation);
        }

        // Generate security report
        const report = security.getSecurityReport();
        console.log('📊 Security report:', JSON.stringify(report, null, 2));

        console.log('\n✅ CAPTCHA Security Layer test complete!');
    }
    
    main().catch(console.error);
}
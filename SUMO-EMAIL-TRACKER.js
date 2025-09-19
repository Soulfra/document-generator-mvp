#!/usr/bin/env node

/**
 * SUMO EMAIL TRACKER MODULE
 * 
 * Advanced email tracking and latch detection system
 * Identifies who has your email, who's selling it, and who's tracking you
 */

const crypto = require('crypto');
const dns = require('dns').promises;
const { EventEmitter } = require('events');

class SumoEmailTracker extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxAnalysisDepth: 10,
            dnsTimeout: 5000,
            trackingDatabase: new Map(),
            ...config
        };
        
        // Known tracking patterns and services
        this.trackingPatterns = {
            // Email tracking pixels
            pixels: [
                { pattern: /track\.customer\.io\/e\//, service: 'Customer.io', type: 'pixel' },
                { pattern: /email\.mailgun\.com\/o\//, service: 'Mailgun', type: 'pixel' },
                { pattern: /click\.mailchimp\.com/, service: 'Mailchimp', type: 'pixel' },
                { pattern: /mandrillapp\.com\/track/, service: 'Mandrill', type: 'pixel' },
                { pattern: /sendgrid\.net\/wf\/open/, service: 'SendGrid', type: 'pixel' },
                { pattern: /constantcontact\.com\/tracking/, service: 'Constant Contact', type: 'pixel' },
                { pattern: /open\.convertkit-mail\.com/, service: 'ConvertKit', type: 'pixel' },
                { pattern: /trk\.klclick\.com/, service: 'Klaviyo', type: 'pixel' },
                { pattern: /pixel\.app\.returnpath\.net/, service: 'Return Path', type: 'pixel' },
                { pattern: /click\.icptrack\.com/, service: 'iContact', type: 'pixel' }
            ],
            
            // Link tracking
            links: [
                { pattern: /click\.e\./, service: 'Generic Email Service', type: 'link' },
                { pattern: /go\.pardot\.com/, service: 'Pardot/Salesforce', type: 'link' },
                { pattern: /t\.sidekickopen/, service: 'HubSpot Sidekick', type: 'link' },
                { pattern: /app\.yesware\.com/, service: 'Yesware', type: 'link' },
                { pattern: /t\.sigopn01\.com/, service: 'Mixmax', type: 'link' },
                { pattern: /track\.getsidekick\.com/, service: 'Sidekick', type: 'link' }
            ],
            
            // Newsletter services
            newsletters: [
                { domain: 'substack.com', service: 'Substack', type: 'newsletter' },
                { domain: 'buttondown.email', service: 'Buttondown', type: 'newsletter' },
                { domain: 'revue.co', service: 'Revue', type: 'newsletter' },
                { domain: 'tinyletter.com', service: 'TinyLetter', type: 'newsletter' },
                { domain: 'campaign-archive.com', service: 'Mailchimp Archive', type: 'newsletter' }
            ],
            
            // Data brokers
            dataBrokers: [
                { domain: 'epsilon.com', service: 'Epsilon Data', type: 'broker' },
                { domain: 'acxiom.com', service: 'Acxiom', type: 'broker' },
                { domain: 'experian.com', service: 'Experian', type: 'broker' },
                { domain: 'oracle.com/cx/marketing', service: 'Oracle Data Cloud', type: 'broker' },
                { domain: 'towerdata.com', service: 'TowerData', type: 'broker' }
            ]
        };
        
        // Email reputation services to check
        this.reputationServices = [
            'emailrep.io',
            'hunter.io',
            'clearbit.com',
            'fullcontact.com',
            'pipl.com'
        ];
        
        // Spam blacklists to check
        this.blacklists = [
            'zen.spamhaus.org',
            'bl.spamcop.net',
            'dnsbl.sorbs.net',
            'ix.dnsbl.manitu.net',
            'dnsbl-1.uceprotect.net'
        ];
        
        console.log('📧 Sumo Email Tracker initialized');
    }
    
    /**
     * Comprehensive email analysis
     */
    async analyzeEmail(email, options = {}) {
        console.log(`🔍 Analyzing email: ${this.obfuscateEmail(email)}`);
        
        const analysis = {
            email: this.obfuscateEmail(email),
            timestamp: Date.now(),
            domain: email.split('@')[1],
            trackers: [],
            dataBrokers: [],
            reputation: {},
            leaks: [],
            recommendations: [],
            riskScore: 0
        };
        
        try {
            // 1. Check email headers if provided
            if (options.headers) {
                const headerTrackers = await this.analyzeHeaders(options.headers);
                analysis.trackers.push(...headerTrackers);
            }
            
            // 2. Check email body if provided
            if (options.body) {
                const bodyTrackers = await this.analyzeEmailBody(options.body);
                analysis.trackers.push(...bodyTrackers);
            }
            
            // 3. Check domain reputation
            analysis.reputation = await this.checkDomainReputation(analysis.domain);
            
            // 4. Check for data breaches
            analysis.leaks = await this.checkDataBreaches(email);
            
            // 5. Check against known data brokers
            analysis.dataBrokers = await this.checkDataBrokers(email);
            
            // 6. Calculate risk score
            analysis.riskScore = this.calculateRiskScore(analysis);
            
            // 7. Generate recommendations
            analysis.recommendations = this.generateRecommendations(analysis);
            
            // Store analysis
            this.config.trackingDatabase.set(email, analysis);
            
            // Emit analysis complete event
            this.emit('analysis:complete', analysis);
            
        } catch (error) {
            console.error('Email analysis error:', error);
            analysis.error = error.message;
        }
        
        return analysis;
    }
    
    /**
     * Analyze email headers for tracking
     */
    async analyzeHeaders(headers) {
        const trackers = [];
        
        // Check List-Unsubscribe header
        if (headers['List-Unsubscribe']) {
            const unsubLinks = this.extractUrls(headers['List-Unsubscribe']);
            unsubLinks.forEach(url => {
                trackers.push({
                    type: 'header-tracking',
                    header: 'List-Unsubscribe',
                    url: url,
                    service: this.identifyService(url),
                    severity: 'low'
                });
            });
        }
        
        // Check tracking headers
        const trackingHeaders = [
            'X-Mailchimp-Campaign',
            'X-Sendgrid-Id',
            'X-Constant-Contact',
            'X-Campaign-Id',
            'X-Mailer',
            'X-MC-User',
            'X-Mandrill-User',
            'X-SES-MESSAGE-TAGS'
        ];
        
        trackingHeaders.forEach(header => {
            if (headers[header]) {
                trackers.push({
                    type: 'tracking-header',
                    header: header,
                    value: headers[header],
                    service: this.getServiceFromHeader(header),
                    severity: 'medium'
                });
            }
        });
        
        // Check for bounce/complaint tracking
        if (headers['Return-Path'] && headers['Return-Path'].includes('bounce')) {
            trackers.push({
                type: 'bounce-tracking',
                header: 'Return-Path',
                value: headers['Return-Path'],
                severity: 'low'
            });
        }
        
        return trackers;
    }
    
    /**
     * Analyze email body for tracking elements
     */
    async analyzeEmailBody(body) {
        const trackers = [];
        
        // Extract all URLs from body
        const urls = this.extractUrls(body);
        
        // Check each URL against tracking patterns
        urls.forEach(url => {
            // Check tracking pixels
            this.trackingPatterns.pixels.forEach(pixel => {
                if (pixel.pattern.test(url)) {
                    trackers.push({
                        type: 'tracking-pixel',
                        url: this.sanitizeUrl(url),
                        service: pixel.service,
                        severity: 'high'
                    });
                }
            });
            
            // Check link tracking
            this.trackingPatterns.links.forEach(link => {
                if (link.pattern.test(url)) {
                    trackers.push({
                        type: 'tracked-link',
                        url: this.sanitizeUrl(url),
                        service: link.service,
                        severity: 'medium'
                    });
                }
            });
        });
        
        // Check for invisible images (1x1 pixels)
        const imgPattern = /<img[^>]+src=['"]([^'"]+)['"]/gi;
        let match;
        while ((match = imgPattern.exec(body)) !== null) {
            const imgUrl = match[1];
            if (imgUrl.includes('1x1') || imgUrl.includes('pixel') || imgUrl.includes('track')) {
                trackers.push({
                    type: 'tracking-image',
                    url: this.sanitizeUrl(imgUrl),
                    service: this.identifyService(imgUrl),
                    severity: 'high'
                });
            }
        }
        
        return trackers;
    }
    
    /**
     * Check domain reputation
     */
    async checkDomainReputation(domain) {
        const reputation = {
            score: 100,
            issues: [],
            blacklists: []
        };
        
        try {
            // Check DNS records
            const dnsChecks = await Promise.allSettled([
                this.checkSPF(domain),
                this.checkDKIM(domain),
                this.checkDMARC(domain)
            ]);
            
            if (!dnsChecks[0].value) {
                reputation.issues.push('No SPF record');
                reputation.score -= 10;
            }
            
            if (!dnsChecks[1].value) {
                reputation.issues.push('No DKIM record');
                reputation.score -= 10;
            }
            
            if (!dnsChecks[2].value) {
                reputation.issues.push('No DMARC record');
                reputation.score -= 15;
            }
            
            // Check blacklists
            for (const blacklist of this.blacklists) {
                const isBlacklisted = await this.checkBlacklist(domain, blacklist);
                if (isBlacklisted) {
                    reputation.blacklists.push(blacklist);
                    reputation.score -= 20;
                }
            }
            
        } catch (error) {
            console.error('Reputation check error:', error);
        }
        
        reputation.score = Math.max(0, reputation.score);
        return reputation;
    }
    
    /**
     * Check for data breaches
     */
    async checkDataBreaches(email) {
        const breaches = [];
        
        // This would normally check haveibeenpwned.com API
        // Simulating for demo
        const knownBreaches = [
            { name: 'LinkedIn', date: '2021-06-01', exposed: ['email', 'password'] },
            { name: 'Facebook', date: '2019-03-01', exposed: ['email', 'phone'] }
        ];
        
        // Random chance of being in breach for demo
        if (Math.random() > 0.7) {
            const breach = knownBreaches[Math.floor(Math.random() * knownBreaches.length)];
            breaches.push(breach);
        }
        
        return breaches;
    }
    
    /**
     * Check against data brokers
     */
    async checkDataBrokers(email) {
        const brokers = [];
        
        // Check if email domain matches known data broker patterns
        const domain = email.split('@')[1];
        
        this.trackingPatterns.dataBrokers.forEach(broker => {
            // Simulate checking if email is in broker database
            if (Math.random() > 0.8) {
                brokers.push({
                    service: broker.service,
                    type: broker.type,
                    hasData: true,
                    optOutUrl: `https://optout.${broker.domain}`
                });
            }
        });
        
        return brokers;
    }
    
    /**
     * Calculate risk score
     */
    calculateRiskScore(analysis) {
        let score = 0;
        
        // Add points for trackers
        score += analysis.trackers.length * 5;
        
        // Add points for data brokers
        score += analysis.dataBrokers.length * 10;
        
        // Add points for breaches
        score += analysis.leaks.length * 15;
        
        // Add points for poor reputation
        score += (100 - analysis.reputation.score) / 2;
        
        // Normalize to 0-100
        return Math.min(100, score);
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.trackers.length > 5) {
            recommendations.push({
                priority: 'high',
                action: 'Use email aliases for subscriptions',
                reason: `${analysis.trackers.length} trackers detected`
            });
        }
        
        if (analysis.dataBrokers.length > 0) {
            recommendations.push({
                priority: 'high',
                action: 'Opt out of data broker services',
                reason: `Found in ${analysis.dataBrokers.length} data broker databases`
            });
        }
        
        if (analysis.leaks.length > 0) {
            recommendations.push({
                priority: 'critical',
                action: 'Change passwords for breached services',
                reason: `Email found in ${analysis.leaks.length} data breaches`
            });
        }
        
        if (analysis.reputation.score < 50) {
            recommendations.push({
                priority: 'medium',
                action: 'Consider using a different email provider',
                reason: 'Low domain reputation score'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Check SPF record
     */
    async checkSPF(domain) {
        try {
            const records = await dns.resolveTxt(domain);
            return records.some(record => 
                record.join('').includes('v=spf1')
            );
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Check DKIM record
     */
    async checkDKIM(domain) {
        try {
            // Check common DKIM selectors
            const selectors = ['default', 'google', 'k1', 's1', 'selector1'];
            
            for (const selector of selectors) {
                try {
                    await dns.resolveTxt(`${selector}._domainkey.${domain}`);
                    return true;
                } catch (e) {
                    continue;
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Check DMARC record
     */
    async checkDMARC(domain) {
        try {
            const records = await dns.resolveTxt(`_dmarc.${domain}`);
            return records.some(record => 
                record.join('').includes('v=DMARC1')
            );
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Check if domain is blacklisted
     */
    async checkBlacklist(domain, blacklist) {
        try {
            // Reverse IP lookup would go here
            // Simulating for demo
            return Math.random() > 0.9;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Extract URLs from text
     */
    extractUrls(text) {
        const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
        return text.match(urlPattern) || [];
    }
    
    /**
     * Identify service from URL
     */
    identifyService(url) {
        // Check against known patterns
        for (const pixels of this.trackingPatterns.pixels) {
            if (pixels.pattern.test(url)) {
                return pixels.service;
            }
        }
        
        for (const links of this.trackingPatterns.links) {
            if (links.pattern.test(url)) {
                return links.service;
            }
        }
        
        // Extract domain as fallback
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return 'Unknown';
        }
    }
    
    /**
     * Get service from header name
     */
    getServiceFromHeader(header) {
        const headerMap = {
            'X-Mailchimp-Campaign': 'Mailchimp',
            'X-Sendgrid-Id': 'SendGrid',
            'X-Constant-Contact': 'Constant Contact',
            'X-MC-User': 'Mailchimp',
            'X-Mandrill-User': 'Mandrill',
            'X-SES-MESSAGE-TAGS': 'Amazon SES'
        };
        
        return headerMap[header] || 'Unknown';
    }
    
    /**
     * Sanitize URL for display
     */
    sanitizeUrl(url) {
        // Remove tracking parameters
        try {
            const urlObj = new URL(url);
            
            // Remove common tracking params
            const trackingParams = [
                'utm_source', 'utm_medium', 'utm_campaign',
                'utm_term', 'utm_content', 'fbclid', 'gclid',
                'mc_cid', 'mc_eid'
            ];
            
            trackingParams.forEach(param => {
                urlObj.searchParams.delete(param);
            });
            
            return urlObj.toString();
        } catch (error) {
            return url;
        }
    }
    
    /**
     * Obfuscate email for privacy
     */
    obfuscateEmail(email) {
        const parts = email.split('@');
        if (parts.length !== 2) return '***@***';
        
        const name = parts[0];
        const domain = parts[1];
        
        const obfuscatedName = name.substring(0, 2) + '***';
        return `${obfuscatedName}@${domain}`;
    }
    
    /**
     * Get latch report - who has this email
     */
    async getLatchReport(email) {
        const analysis = this.config.trackingDatabase.get(email) || 
                        await this.analyzeEmail(email);
        
        const report = {
            email: this.obfuscateEmail(email),
            totalLatches: 0,
            services: new Map(),
            severity: 'low'
        };
        
        // Count unique services
        analysis.trackers.forEach(tracker => {
            const service = tracker.service || 'Unknown';
            const count = report.services.get(service) || 0;
            report.services.set(service, count + 1);
            report.totalLatches++;
        });
        
        // Add data brokers
        analysis.dataBrokers.forEach(broker => {
            report.services.set(broker.service, 'Data Broker');
            report.totalLatches++;
        });
        
        // Determine severity
        if (report.totalLatches > 10) {
            report.severity = 'critical';
        } else if (report.totalLatches > 5) {
            report.severity = 'high';
        } else if (report.totalLatches > 2) {
            report.severity = 'medium';
        }
        
        return report;
    }
    
    /**
     * Generate unsubscribe links
     */
    async generateUnsubscribeLinks(email) {
        const analysis = this.config.trackingDatabase.get(email) || 
                        await this.analyzeEmail(email);
        
        const unsubscribeLinks = [];
        
        // Extract from trackers
        analysis.trackers.forEach(tracker => {
            if (tracker.type === 'header-tracking' && tracker.header === 'List-Unsubscribe') {
                unsubscribeLinks.push({
                    service: tracker.service,
                    url: tracker.url,
                    method: 'link'
                });
            }
        });
        
        // Add known unsubscribe patterns
        const knownPatterns = {
            'Mailchimp': 'https://{{domain}}.list-manage.com/unsubscribe',
            'SendGrid': 'https://sendgrid.com/unsubscribe',
            'Constant Contact': 'https://visitor.constantcontact.com/do'
        };
        
        report.services.forEach((count, service) => {
            if (knownPatterns[service] && !unsubscribeLinks.find(u => u.service === service)) {
                unsubscribeLinks.push({
                    service: service,
                    url: knownPatterns[service],
                    method: 'manual'
                });
            }
        });
        
        return unsubscribeLinks;
    }
}

// Export module
module.exports = SumoEmailTracker;

// Run tests if called directly
if (require.main === module) {
    const tracker = new SumoEmailTracker();
    
    // Test email analysis
    (async () => {
        console.log('\n📧 Testing Sumo Email Tracker\n');
        
        const testEmail = 'test@example.com';
        const testHeaders = {
            'List-Unsubscribe': '<https://track.customer.io/unsubscribe/test>',
            'X-Mailchimp-Campaign': 'campaign123',
            'Return-Path': 'bounce.marketing@example.com'
        };
        
        const testBody = `
            <img src="https://track.customer.io/e/pixel123.gif" width="1" height="1">
            <a href="https://click.mailchimp.com/link123">Click here</a>
            <img src="https://email.example.com/track/1x1.png">
        `;
        
        const analysis = await tracker.analyzeEmail(testEmail, {
            headers: testHeaders,
            body: testBody
        });
        
        console.log('Analysis Results:');
        console.log(JSON.stringify(analysis, null, 2));
        
        const latchReport = await tracker.getLatchReport(testEmail);
        console.log('\nLatch Report:');
        console.log(JSON.stringify({
            ...latchReport,
            services: Array.from(latchReport.services.entries())
        }, null, 2));
    })();
}
#!/usr/bin/env node

/**
 * 🌐 DOMAIN CONTENT TRIGGER MIDDLEWARE
 * Automatic content generation triggers for domain visits
 * Integrates with the unified empire ecosystem
 */

const axios = require('axios');

class DomainContentTrigger {
    constructor(options = {}) {
        this.domain = options.domain || 'unknown.com';
        this.unifiedDebugger = options.debuggerUrl || 'http://localhost:7777';
        this.triggers = new Map();
        
        // Gaming elements
        this.gameElements = {
            trigger: '⚡',
            domain: '🌐',
            content: '🎁',
            success: '✅',
            failure: '❌'
        };
        
        this.setupTriggers();
        console.log(`${this.gameElements.domain} Domain Content Trigger initialized for ${this.domain}`);
    }
    
    setupTriggers() {
        // URL pattern triggers
        this.triggers.set('/spawn', {
            type: 'gacha',
            rarity: 'random',
            category: 'spawn-content',
            message: 'Welcome! Generating spawn content...'
        });
        
        this.triggers.set('/enter', {
            type: 'quick',
            template: 'welcome',
            category: 'entry-content',
            message: 'Entering domain, generating welcome content...'
        });
        
        this.triggers.set('/gacha', {
            type: 'gacha',
            rarity: 'epic',
            category: 'premium',
            message: 'Gacha machine activated! Generating epic content...'
        });
        
        this.triggers.set('/deathtodata', {
            type: 'gacha',
            rarity: 'legendary',
            category: 'death-to-data',
            message: 'Death to Data activated! Generating legendary content...'
        });
        
        console.log(`${this.gameElements.trigger} Loaded ${this.triggers.size} content triggers`);
    }
    
    // Express/Connect middleware function
    middleware() {
        return async (req, res, next) => {
            const path = req.path.toLowerCase();
            const trigger = this.findMatchingTrigger(path);
            
            if (trigger) {
                console.log(`${this.gameElements.trigger} Content trigger activated for ${path}`);
                
                // Don't block the request, trigger content generation asynchronously
                setImmediate(() => {
                    this.triggerContentGeneration(trigger, {
                        domain: this.domain,
                        path: req.path,
                        userAgent: req.get('User-Agent'),
                        ip: req.ip,
                        timestamp: new Date().toISOString()
                    });
                });
                
                // Add content generation header for client awareness
                res.set('X-Content-Generation', 'triggered');
                res.set('X-Content-Type', trigger.type);
                res.set('X-Content-Message', trigger.message);
            }
            
            next();
        };
    }
    
    findMatchingTrigger(path) {
        // Exact match first
        if (this.triggers.has(path)) {
            return this.triggers.get(path);
        }
        
        // Pattern matching
        for (const [pattern, trigger] of this.triggers) {
            if (path.includes(pattern.replace('/', ''))) {
                return trigger;
            }
        }
        
        return null;
    }
    
    async triggerContentGeneration(trigger, context) {
        try {
            console.log(`${this.gameElements.content} ${trigger.message}`);
            
            const response = await axios.post(`${this.unifiedDebugger}/api/content/generate`, {
                type: trigger.type,
                rarity: trigger.rarity,
                category: trigger.category,
                template: trigger.template,
                source: 'domain-trigger',
                domain: context.domain,
                context
            });
            
            if (response.data.success !== false) {
                console.log(`${this.gameElements.success} Content generation triggered successfully`);
                console.log(`   Thread ID: ${response.data.threadId}`);
                console.log(`   Domain: ${context.domain}`);
                console.log(`   Path: ${context.path}`);
                
                // Could also trigger notifications, webhooks, etc.
                this.notifyContentGenerated(response.data, context);
                
            } else {
                console.error(`${this.gameElements.failure} Content generation failed:`, response.data.error);
            }
            
        } catch (error) {
            console.error(`${this.gameElements.failure} Content trigger error:`, error.message);
        }
    }
    
    notifyContentGenerated(result, context) {
        // Could send to analytics, webhooks, real-time dashboard, etc.
        console.log(`📊 Content notification: ${result.type} generated for ${context.domain}${context.path}`);
    }
    
    // Static method for easy integration
    static create(domain) {
        return new DomainContentTrigger({ domain });
    }
    
    // Manual trigger method for programmatic use
    async manualTrigger(type, options = {}) {
        const trigger = {
            type,
            rarity: options.rarity || 'common',
            category: options.category || 'manual',
            template: options.template,
            message: `Manual ${type} content generation triggered`
        };
        
        const context = {
            domain: this.domain,
            path: '/manual',
            source: 'manual-trigger',
            timestamp: new Date().toISOString(),
            ...options.context
        };
        
        await this.triggerContentGeneration(trigger, context);
    }
}

// Usage examples for different frameworks
const examples = {
    express: `
// Express.js integration
const express = require('express');
const DomainContentTrigger = require('./domain-content-trigger');

const app = express();
const contentTrigger = new DomainContentTrigger({ domain: 'mysite.com' });

// Apply to all routes
app.use(contentTrigger.middleware());

// Or apply to specific routes
app.get('/spawn', contentTrigger.middleware(), (req, res) => {
    res.json({ message: 'Spawn content generating!', triggered: true });
});
    `,
    
    wordpress: `
// WordPress plugin integration
add_action('init', function() {
    if (class_exists('DomainContentTrigger')) {
        $trigger = new DomainContentTrigger(['domain' => get_site_url()]);
        
        if (is_page('spawn') || is_page('enter')) {
            $trigger->manualTrigger('gacha', ['rarity' => 'rare']);
        }
    }
});
    `,
    
    nginx: `
# Nginx location trigger (calls Node.js endpoint)
location /spawn {
    # Trigger content generation
    access_by_lua_block {
        local http = require "resty.http"
        local httpc = http.new()
        
        httpc:request_uri("http://localhost:7777/api/content/generate", {
            method = "POST",
            body = '{"type":"gacha","source":"nginx","domain":"' .. ngx.var.host .. '"}',
            headers = { ["Content-Type"] = "application/json" }
        })
    }
    
    # Serve normal content
    try_files $uri $uri/ /index.html;
}
    `
};

module.exports = DomainContentTrigger;

// CLI usage
if (require.main === module) {
    const domain = process.argv[2] || 'localhost';
    const trigger = new DomainContentTrigger({ domain });
    
    console.log(`
🌐 DOMAIN CONTENT TRIGGER MIDDLEWARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Automatic content generation for domain visits
⚡ Triggers based on URL patterns and user actions
🎁 Integrates with unified empire ecosystem

Domain: ${domain}
Triggers: ${Array.from(trigger.triggers.keys()).join(', ')}

Integration Examples:
${examples.express}

Manual Test:
node domain-content-trigger.js mydomain.com
    `);
    
    // Test manual trigger
    setTimeout(async () => {
        console.log('🧪 Testing manual trigger...');
        await trigger.manualTrigger('gacha', { 
            rarity: 'epic', 
            category: 'test',
            context: { test: true }
        });
    }, 2000);
}
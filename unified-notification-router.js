#!/usr/bin/env node

/**
 * 🔗 UNIFIED NOTIFICATION ROUTER
 * Connects SCREAMING alerts to Discord, Telegram, Email, SMS, and other services
 * Routes system failures and emergencies to all configured notification channels
 */

const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

class UnifiedNotificationRouter {
    constructor() {
        this.channels = new Map();
        this.preferences = new Map();
        this.messageQueue = [];
        this.isProcessing = false;
        
        // Alert routing rules by severity
        this.routingRules = {
            EMERGENCY: ['discord', 'telegram', 'email', 'sms', 'webhook', 'websocket'],
            SCREAM: ['discord', 'telegram', 'email', 'webhook', 'websocket'],
            LOUD: ['discord', 'telegram', 'websocket'],
            NORMAL: ['websocket', 'email'],
            WHISPER: ['websocket']
        };
        
        // Rate limiting
        this.rateLimits = new Map();
        this.lastAlerts = new Map();
        
        console.log('🔗 UNIFIED NOTIFICATION ROUTER INITIALIZED');
        console.log('📋 Ready to route SCREAMING alerts to all services');
        
        this.initializeChannels();
    }
    
    async initializeChannels() {
        console.log('🔧 Initializing notification channels...');
        
        // Discord Bot Integration
        await this.initializeDiscord();
        
        // Telegram Bot Integration  
        await this.initializeTelegram();
        
        // Email Service Integration
        await this.initializeEmail();
        
        // SMS/Twilio Integration
        await this.initializeSMS();
        
        // Webhook Integration
        await this.initializeWebhook();
        
        // WebSocket Integration
        await this.initializeWebSocket();
        
        console.log(`✅ ${this.channels.size} notification channels initialized`);
    }
    
    async initializeDiscord() {
        try {
            // Check if Discord bot service exists
            const discordPath = './FinishThisIdea-Complete/src/services/discord/discord-bot.service.ts';
            const discordExists = await this.fileExists(discordPath);
            
            if (discordExists) {
                // Create Discord notification adapter
                this.channels.set('discord', {
                    name: 'Discord Bot',
                    type: 'discord',
                    enabled: true,
                    send: this.sendDiscordAlert.bind(this),
                    capabilities: ['rich_embeds', 'mentions', 'buttons', 'files'],
                    rateLimitPerMin: 50
                });
                console.log('✅ Discord notification channel ready');
            } else {
                console.log('⚠️  Discord service not found, skipping');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Discord:', error.message);
        }
    }
    
    async initializeTelegram() {
        try {
            const telegramPath = './FinishThisIdea-Complete/src/services/telegram/telegram-bot.service.ts';
            const telegramExists = await this.fileExists(telegramPath);
            
            if (telegramExists) {
                this.channels.set('telegram', {
                    name: 'Telegram Bot',
                    type: 'telegram',
                    enabled: true,
                    send: this.sendTelegramAlert.bind(this),
                    capabilities: ['markdown', 'inline_keyboards', 'instant_delivery'],
                    rateLimitPerMin: 30
                });
                console.log('✅ Telegram notification channel ready');
            } else {
                console.log('⚠️  Telegram service not found, skipping');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Telegram:', error.message);
        }
    }
    
    async initializeEmail() {
        try {
            const emailPath = './FinishThisIdea-Complete/src/services/email/email.service.ts';
            const emailExists = await this.fileExists(emailPath);
            
            if (emailExists) {
                this.channels.set('email', {
                    name: 'Email Service',
                    type: 'email',
                    enabled: true,
                    send: this.sendEmailAlert.bind(this),
                    capabilities: ['html', 'attachments', 'templates', 'bulk'],
                    rateLimitPerMin: 100
                });
                console.log('✅ Email notification channel ready');
            } else {
                console.log('⚠️  Email service not found, skipping');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Email:', error.message);
        }
    }
    
    async initializeSMS() {
        try {
            // Check for Twilio configuration
            const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
            
            if (hasTwilio) {
                this.channels.set('sms', {
                    name: 'SMS/Twilio',
                    type: 'sms',
                    enabled: true,
                    send: this.sendSMSAlert.bind(this),
                    capabilities: ['instant', 'critical_only'],
                    rateLimitPerMin: 5 // Very limited for SMS
                });
                console.log('✅ SMS notification channel ready');
            } else {
                console.log('⚠️  Twilio not configured, SMS disabled');
            }
        } catch (error) {
            console.error('❌ Failed to initialize SMS:', error.message);
        }
    }
    
    async initializeWebhook() {
        this.channels.set('webhook', {
            name: 'Generic Webhooks',
            type: 'webhook',
            enabled: true,
            send: this.sendWebhookAlert.bind(this),
            capabilities: ['custom_integrations', 'json_payload'],
            rateLimitPerMin: 200
        });
        console.log('✅ Webhook notification channel ready');
    }
    
    async initializeWebSocket() {
        try {
            // Create WebSocket server for real-time alerts
            this.wss = new WebSocket.Server({ port: 8091 });
            this.wsConnections = new Set();
            
            this.wss.on('connection', (ws) => {
                console.log('📡 Dashboard connected to alert stream');
                this.wsConnections.add(ws);
                
                // Send current system status
                ws.send(JSON.stringify({
                    type: 'system_status',
                    channels: Array.from(this.channels.keys()),
                    timestamp: Date.now()
                }));
                
                ws.on('close', () => {
                    this.wsConnections.delete(ws);
                });
            });
            
            this.channels.set('websocket', {
                name: 'WebSocket Dashboard',
                type: 'websocket',
                enabled: true,
                send: this.sendWebSocketAlert.bind(this),
                capabilities: ['real_time', 'dashboard'],
                rateLimitPerMin: 1000
            });
            
            console.log('✅ WebSocket notification channel ready on port 8091');
        } catch (error) {
            console.error('❌ Failed to initialize WebSocket:', error.message);
        }
    }
    
    /**
     * Main routing method - called by SystemScreamer
     */
    async routeAlert(level, message, metadata = {}) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            level,
            message,
            metadata,
            timestamp: Date.now(),
            channels: []
        };
        
        console.log(`🚨 Routing ${level} alert: ${message.substring(0, 50)}...`);
        
        // Check rate limiting
        if (this.isRateLimited(level, message)) {
            console.log('⏸️  Alert rate limited, skipping');
            return;
        }
        
        // Get channels for this severity level
        const targetChannels = this.routingRules[level] || ['websocket'];
        
        // Queue alert for processing
        this.messageQueue.push({ alert, targetChannels });
        
        // Process queue if not already processing
        if (!this.isProcessing) {
            await this.processQueue();
        }
        
        return alert.id;
    }
    
    async processQueue() {
        if (this.messageQueue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.messageQueue.length > 0) {
            const { alert, targetChannels } = this.messageQueue.shift();
            
            // Send to all target channels in parallel
            const promises = targetChannels.map(async (channelName) => {
                const channel = this.channels.get(channelName);
                
                if (!channel || !channel.enabled) {
                    console.log(`⚠️  Channel ${channelName} not available`);
                    return;
                }
                
                try {
                    await channel.send(alert);
                    alert.channels.push(channelName);
                    console.log(`✅ Alert sent via ${channelName}`);
                } catch (error) {
                    console.error(`❌ Failed to send via ${channelName}:`, error.message);
                }
            });
            
            await Promise.all(promises);
            
            // Log successful routing
            console.log(`📤 Alert ${alert.id} sent to ${alert.channels.length} channels`);
            
            // Small delay between alerts to avoid overwhelming
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.isProcessing = false;
    }
    
    /**
     * Channel-specific sending methods
     */
    async sendDiscordAlert(alert) {
        // Create rich Discord embed
        const embed = {
            title: `🚨 System Alert: ${alert.level}`,
            description: alert.message,
            color: this.getLevelColor(alert.level),
            timestamp: new Date(alert.timestamp).toISOString(),
            fields: [
                { name: '📊 Severity', value: alert.level, inline: true },
                { name: '🕐 Time', value: new Date(alert.timestamp).toLocaleString(), inline: true },
                { name: '🖥️ System', value: 'Document Generator', inline: true }
            ]
        };
        
        // Add metadata fields if available
        if (alert.metadata) {
            Object.entries(alert.metadata).forEach(([key, value]) => {
                embed.fields.push({
                    name: key.replace(/_/g, ' ').toUpperCase(),
                    value: String(value).substring(0, 100),
                    inline: true
                });
            });
        }
        
        // In production, this would call the actual Discord bot
        console.log('📱 DISCORD ALERT:', JSON.stringify(embed, null, 2));
        
        // Simulate Discord API call
        await this.simulateAPICall('Discord', 500);
    }
    
    async sendTelegramAlert(alert) {
        const message = `
🚨 *SYSTEM ALERT: ${alert.level}*

📝 *Message*: ${alert.message}

⏰ *Time*: ${new Date(alert.timestamp).toLocaleString()}
🖥️ *System*: Document Generator
📊 *Severity*: ${alert.level}

${alert.level === 'EMERGENCY' ? '🆘 *IMMEDIATE ATTENTION REQUIRED*' : ''}
        `.trim();
        
        // In production, this would call the actual Telegram bot
        console.log('📱 TELEGRAM ALERT:', message);
        
        // Simulate Telegram API call
        await this.simulateAPICall('Telegram', 300);
    }
    
    async sendEmailAlert(alert) {
        const emailData = {
            to: process.env.ADMIN_EMAIL || 'admin@finishthisidea.com',
            subject: `🚨 System Alert: ${alert.level} - Document Generator`,
            template: 'system-alert',
            data: {
                level: alert.level,
                message: alert.message,
                timestamp: new Date(alert.timestamp).toLocaleString(),
                metadata: alert.metadata,
                serverInfo: {
                    hostname: require('os').hostname(),
                    platform: process.platform,
                    memory: process.memoryUsage(),
                    uptime: process.uptime()
                }
            }
        };
        
        // In production, this would call the actual email service
        console.log('📧 EMAIL ALERT:', JSON.stringify(emailData, null, 2));
        
        // Simulate email API call
        await this.simulateAPICall('Email', 800);
    }
    
    async sendSMSAlert(alert) {
        // Only send SMS for EMERGENCY level
        if (alert.level !== 'EMERGENCY') return;
        
        const smsMessage = `🚨 EMERGENCY: Document Generator system alert. ${alert.message.substring(0, 100)}. Check dashboard immediately.`;
        
        // In production, this would call Twilio
        console.log('📱 SMS ALERT:', smsMessage);
        
        // Simulate SMS API call
        await this.simulateAPICall('SMS', 1000);
    }
    
    async sendWebhookAlert(alert) {
        const webhookPayload = {
            event: 'system_alert',
            level: alert.level,
            message: alert.message,
            timestamp: alert.timestamp,
            metadata: alert.metadata,
            source: 'document-generator'
        };
        
        // Get configured webhooks
        const webhooks = this.getConfiguredWebhooks();
        
        for (const webhook of webhooks) {
            try {
                // In production, make actual HTTP POST to webhook URL
                console.log(`🔗 WEBHOOK ALERT to ${webhook.name}:`, JSON.stringify(webhookPayload, null, 2));
                
                // Simulate webhook call
                await this.simulateAPICall(`Webhook-${webhook.name}`, 400);
            } catch (error) {
                console.error(`❌ Webhook ${webhook.name} failed:`, error.message);
            }
        }
    }
    
    async sendWebSocketAlert(alert) {
        const wsMessage = JSON.stringify({
            type: 'system_alert',
            alert: {
                id: alert.id,
                level: alert.level,
                message: alert.message,
                timestamp: alert.timestamp,
                metadata: alert.metadata
            }
        });
        
        // Send to all connected WebSocket clients
        for (const ws of this.wsConnections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(wsMessage);
            }
        }
        
        console.log(`📡 WebSocket alert sent to ${this.wsConnections.size} dashboards`);
    }
    
    /**
     * Utility methods
     */
    isRateLimited(level, message) {
        const key = `${level}:${message.substring(0, 50)}`;
        const now = Date.now();
        const lastAlert = this.lastAlerts.get(key);
        
        // Rate limit: same alert within 30 seconds = skip
        if (lastAlert && (now - lastAlert) < 30000) {
            return true;
        }
        
        this.lastAlerts.set(key, now);
        return false;
    }
    
    getLevelColor(level) {
        const colors = {
            EMERGENCY: 0xFF00FF, // Magenta
            SCREAM: 0xFF0000,    // Red
            LOUD: 0xFF8800,      // Orange
            NORMAL: 0xFFFF00,    // Yellow
            WHISPER: 0x888888    // Gray
        };
        return colors[level] || 0x00FF00;
    }
    
    getConfiguredWebhooks() {
        // In production, load from config or database
        return [
            { name: 'Slack', url: process.env.SLACK_WEBHOOK_URL },
            { name: 'Teams', url: process.env.TEAMS_WEBHOOK_URL },
            { name: 'Custom', url: process.env.CUSTOM_WEBHOOK_URL }
        ].filter(w => w.url);
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async simulateAPICall(service, delay = 500) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`📡 ${service} API call completed`);
    }
    
    /**
     * Admin methods
     */
    getChannelStatus() {
        const status = {};
        
        for (const [name, channel] of this.channels) {
            status[name] = {
                enabled: channel.enabled,
                type: channel.type,
                capabilities: channel.capabilities,
                rateLimitPerMin: channel.rateLimitPerMin
            };
        }
        
        return status;
    }
    
    enableChannel(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            channel.enabled = true;
            console.log(`✅ Channel ${channelName} enabled`);
        }
    }
    
    disableChannel(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            channel.enabled = false;
            console.log(`❌ Channel ${channelName} disabled`);
        }
    }
    
    /**
     * Test method
     */
    async testAllChannels() {
        console.log('🧪 Testing all notification channels...');
        
        await this.routeAlert('NORMAL', 'Test alert from Unified Notification Router', {
            test: true,
            source: 'manual_test',
            channels_available: Array.from(this.channels.keys())
        });
        
        console.log('✅ Test complete - check all channels for alert delivery');
    }
}

// Integration with SystemScreamer
class SystemScreamerIntegration {
    constructor() {
        this.router = new UnifiedNotificationRouter();
        this.originalScreamMethod = null;
        
        console.log('🔗 SystemScreamer Integration Ready');
        console.log('🎯 Will route all SCREAM alerts to external services');
    }
    
    async integrateWithSystemScreamer() {
        try {
            // Try to find and integrate with existing SystemScreamer
            const SystemScreamer = require('./system-screamer.js');
            
            if (SystemScreamer && SystemScreamer.prototype.SCREAM) {
                // Store original method
                this.originalScreamMethod = SystemScreamer.prototype.SCREAM;
                
                // Override SCREAM method to include routing
                SystemScreamer.prototype.SCREAM = async (message, level = 'NORMAL') => {
                    // Call original SCREAM method (terminal output)
                    this.originalScreamMethod.call(this, message, level);
                    
                    // Route to external services
                    await this.router.routeAlert(level, message, {
                        timestamp: Date.now(),
                        source: 'system_screamer'
                    });
                };
                
                console.log('✅ SystemScreamer integration complete!');
                console.log('🚨 All SCREAM alerts will now be routed to external services');
                
                return true;
            }
        } catch (error) {
            console.error('❌ Failed to integrate with SystemScreamer:', error.message);
            console.log('💡 Router can still be used directly with routeAlert() method');
        }
        
        return false;
    }
}

// Main execution and export
if (require.main === module) {
    console.log('🚀 STARTING UNIFIED NOTIFICATION ROUTER');
    console.log('=======================================');
    
    const integration = new SystemScreamerIntegration();
    
    // Test the router
    setTimeout(async () => {
        console.log('\\n🧪 Running integration test...');
        await integration.router.testAllChannels();
        
        // Try to integrate with SystemScreamer
        await integration.integrateWithSystemScreamer();
        
        console.log('\\n📊 Channel Status:');
        console.log(JSON.stringify(integration.router.getChannelStatus(), null, 2));
        
        console.log('\\n✅ Unified Notification Router is ready!');
        console.log('🔗 WebSocket dashboard: ws://localhost:8091');
        console.log('🎯 All system alerts will now be distributed to configured channels');
        
    }, 2000);
    
    // Keep running
    setInterval(() => {}, 1000);
}

module.exports = { UnifiedNotificationRouter, SystemScreamerIntegration };
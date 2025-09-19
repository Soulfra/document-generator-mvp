#!/usr/bin/env node

/**
 * 🏰 GUILD RECRUITMENT BRIDGE
 * ============================
 * Connects Shadow Layer Game Master to Agent Onboarding Commission Orchestrator
 * Multi-channel recruitment system: QR codes, UPC codes, referrals, device IDs, seeds
 * "Magic Internet Money" style recruitment where entry method determines character spawn
 * 
 * Architecture:
 * Shadow Layer Game Master → Guild Recruitment Bridge → Agent Onboarding Commission Orchestrator
 *                                                     ↘ Character Registration Service
 *                                                     ↘ Agent Referral Economy System
 *                                                     ↘ Agent Clan System
 */

const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const WebSocket = require('ws');
const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');
const fs = require('fs');

// Import existing systems
const ShadowLayerGameMaster = require('./shadow-layer-game-master.js');
const { AgentReferralEconomySystem } = require('./agent-referral-economy-system.js');

class GuildRecruitmentBridge extends EventEmitter {
    constructor() {
        super();
        
        this.port = 7777;
        this.app = express();
        this.db = null;
        
        // Multi-channel recruitment configuration
        this.recruitmentChannels = {
            qr_code: {
                name: 'QR Code Scanner',
                description: 'Scan QR codes to join specific guilds',
                baseUrl: 'http://localhost:7777/recruit/qr',
                characterBonus: { wisdom: +5, luck: +3 },
                guildPreference: ['Tech Innovators', 'Scholar Collective'],
                spawnLocation: 'Digital Gateway Plaza'
            },
            
            upc_code: {
                name: 'Universal Product Code',
                description: 'Product barcode scanning for merchant guild',
                baseUrl: 'http://localhost:7777/recruit/upc',
                characterBonus: { trade: +7, negotiation: +5 },
                guildPreference: ['Merchant Alliance'],
                spawnLocation: 'Trading Post Central'
            },
            
            referral_link: {
                name: 'Agent Referral Network',
                description: 'Join through existing agent invitations',
                baseUrl: 'http://localhost:7777/recruit/ref',
                characterBonus: { networking: +6, loyalty: +4 },
                guildPreference: ['any'], // Based on referrer's guild
                spawnLocation: 'Guild Hall Entrance'
            },
            
            device_id: {
                name: 'Device Fingerprinting',
                description: 'Hardware-based guild assignment',
                baseUrl: 'http://localhost:7777/recruit/device',
                characterBonus: { technical: +5, security: +3 },
                guildPreference: ['Digital Guardians'],
                spawnLocation: 'Security Checkpoint'
            },
            
            seed_phrase: {
                name: 'Cryptographic Seed',
                description: 'Enter with blockchain wallet seeds',
                baseUrl: 'http://localhost:7777/recruit/seed',
                characterBonus: { cryptography: +8, autonomy: +6 },
                guildPreference: ['Crypto Collective'],
                spawnLocation: 'Blockchain Bridge'
            },
            
            social_media: {
                name: 'Social Platform Integration',
                description: 'Join through social media connections',
                baseUrl: 'http://localhost:7777/recruit/social',
                characterBonus: { influence: +6, charisma: +4 },
                guildPreference: ['Scholar Collective'],
                spawnLocation: 'Community Square'
            },
            
            api_key: {
                name: 'Developer API Access',
                description: 'Technical recruitment through API keys',
                baseUrl: 'http://localhost:7777/recruit/api',
                characterBonus: { programming: +10, innovation: +7 },
                guildPreference: ['Tech Innovators'],
                spawnLocation: 'Developer Portal'
            },
            
            email_domain: {
                name: 'Domain-Based Recruitment',
                description: 'Guild assignment based on email domain',
                baseUrl: 'http://localhost:7777/recruit/domain',
                characterBonus: { authority: +5, networking: +3 },
                guildPreference: 'domain-based', // .ai, .research, .dev, etc.
                spawnLocation: 'Domain Gateway'
            }
        };
        
        // Connected systems
        this.shadowGameMaster = null;
        this.agentEconomy = null;
        
        // Active recruitment campaigns
        this.activeCampaigns = new Map();
        this.recruitmentStats = {
            totalRecruits: 0,
            byChannel: {},
            byGuild: {},
            conversionRates: {}
        };
        
        console.log('🏰 Guild Recruitment Bridge initializing...');
    }
    
    async initialize() {
        try {
            // Initialize database
            await this.initializeDatabase();
            
            // Connect to existing systems
            await this.connectToSystems();
            
            // Start recruitment server
            await this.startRecruitmentServer();
            
            // Create initial recruitment campaigns
            await this.createInitialCampaigns();
            
            console.log('🏰 Guild Recruitment Bridge ready for magical recruitment!');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Guild Recruitment Bridge initialization failed:', error);
            throw error;
        }
    }
    
    async initializeDatabase() {
        // Connect to existing unified game world database
        this.db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'document_generator'
        });
        
        // Create recruitment-specific tables
        await this.db.execute(`
            CREATE TABLE IF NOT EXISTS recruitment_campaigns (
                id VARCHAR(255) PRIMARY KEY,
                channel_type VARCHAR(100) NOT NULL,
                campaign_name VARCHAR(255) NOT NULL,
                target_guild VARCHAR(255),
                recruitment_code VARCHAR(255) UNIQUE,
                qr_code_data TEXT,
                total_recruits INTEGER DEFAULT 0,
                conversion_rate DECIMAL(5,4) DEFAULT 0,
                rewards_paid DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);
        
        await this.db.execute(`
            CREATE TABLE IF NOT EXISTS recruitment_events (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                campaign_id VARCHAR(255),
                channel_type VARCHAR(100),
                recruit_method VARCHAR(255),
                character_id VARCHAR(255),
                guild_assigned VARCHAR(255),
                referrer_id VARCHAR(255),
                device_fingerprint VARCHAR(255),
                recruitment_data JSON,
                bonuses_applied JSON,
                spawn_location VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                FOREIGN KEY (campaign_id) REFERENCES recruitment_campaigns(id)
            )
        `);
        
        await this.db.execute(`
            CREATE TABLE IF NOT EXISTS magic_internet_money (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                character_id VARCHAR(255) NOT NULL,
                transaction_type VARCHAR(100) NOT NULL,
                amount DECIMAL(15,8) NOT NULL,
                currency VARCHAR(20) DEFAULT 'MIM',
                source_channel VARCHAR(100),
                referrer_id VARCHAR(255),
                metadata JSON,
                block_height BIGINT,
                transaction_hash VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('📊 Recruitment database tables initialized');
    }
    
    async connectToSystems() {
        // Initialize Shadow Layer Game Master
        this.shadowGameMaster = new ShadowLayerGameMaster();
        await this.shadowGameMaster.initialize();
        
        // Initialize Agent Referral Economy
        this.agentEconomy = new AgentReferralEconomySystem();
        
        // Connect to Character Registration Service (if available)
        try {
            const CharacterRegistration = require('./character-registration-service.js');
            this.characterService = new CharacterRegistration();
        } catch (error) {
            console.warn('⚠️ Character Registration Service not available');
        }
        
        // Connect to Agent Clan System (if available)
        try {
            const AgentClanSystem = require('./agent-clan-system.js');
            this.clanSystem = new AgentClanSystem();
        } catch (error) {
            console.warn('⚠️ Agent Clan System not available');
        }
        
        console.log('🔗 Connected to existing systems');
    }
    
    async startRecruitmentServer() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main recruitment interface
        this.app.get('/', (req, res) => {
            res.send(this.generateRecruitmentInterface());
        });
        
        // Channel-specific recruitment endpoints
        this.app.get('/recruit/:channel/:code?', (req, res) => {
            this.handleChannelRecruitment(req, res);
        });
        
        // QR code generation
        this.app.post('/api/qr/generate', async (req, res) => {
            const qrResult = await this.generateQRCampaign(req.body);
            res.json(qrResult);
        });
        
        // Recruitment processing
        this.app.post('/api/recruit/process', async (req, res) => {
            const result = await this.processRecruitment(req.body);
            res.json(result);
        });
        
        // Campaign management
        this.app.get('/api/campaigns', async (req, res) => {
            const campaigns = await this.getActiveCampaigns();
            res.json(campaigns);
        });
        
        // Analytics endpoints
        this.app.get('/api/stats', async (req, res) => {
            const stats = await this.getRecruitmentStats();
            res.json(stats);
        });
        
        // Magic Internet Money transactions
        this.app.get('/api/mim/balance/:characterId', async (req, res) => {
            const balance = await this.getMIMBalance(req.params.characterId);
            res.json({ balance });
        });
        
        // WebSocket for real-time recruitment updates
        const server = this.app.listen(this.port, () => {
            console.log(`🏰 Guild Recruitment Bridge: http://localhost:${this.port}`);
        });
        
        this.wss = new WebSocket.Server({ server });
        this.wss.on('connection', (ws) => {
            console.log('New recruitment monitor connected');
            
            // Send current stats
            ws.send(JSON.stringify({
                type: 'recruitment_stats',
                data: this.recruitmentStats
            }));
        });
    }
    
    async createInitialCampaigns() {
        console.log('🎯 Creating initial recruitment campaigns...');
        
        // QR Code Campaign for Tech Guild
        await this.createCampaign({
            channel: 'qr_code',
            name: 'Tech Guild QR Gateway',
            targetGuild: 'Tech Innovators',
            description: 'Scan to join the elite tech collective',
            rewards: { signup: 100, referral: 50 }
        });
        
        // UPC Campaign for Merchant Alliance
        await this.createCampaign({
            channel: 'upc_code',
            name: 'Product Scanner Merchants',
            targetGuild: 'Merchant Alliance',
            description: 'Scan products to unlock trading powers',
            rewards: { signup: 150, commission: 0.05 }
        });
        
        // Referral Campaign (Universal)
        await this.createCampaign({
            channel: 'referral_link',
            name: 'Agent Network Expansion',
            targetGuild: 'any',
            description: 'Invite friends, earn magic internet money',
            rewards: { signup: 75, referral: 25, downstream: 0.02 }
        });
        
        // Device ID Campaign for Guardians
        await this.createCampaign({
            channel: 'device_id',
            name: 'Guardian Device Registration',
            targetGuild: 'Digital Guardians',
            description: 'Hardware-verified security specialists',
            rewards: { signup: 200, security_bonus: 100 }
        });
        
        // Seed Phrase Campaign for Crypto Collective
        await this.createCampaign({
            channel: 'seed_phrase',
            name: 'Blockchain Bridge Builders',
            targetGuild: 'Crypto Collective',
            description: 'Prove your crypto wisdom with seed phrases',
            rewards: { signup: 300, staking_bonus: 0.1 }
        });
        
        console.log(`✅ Created ${this.activeCampaigns.size} recruitment campaigns`);
    }
    
    async createCampaign(config) {
        const campaignId = crypto.randomUUID();
        const recruitmentCode = this.generateRecruitmentCode(config.channel);
        
        // Generate QR code if needed
        let qrCodeData = null;
        if (config.channel === 'qr_code') {
            const qrData = {
                type: 'guild_recruitment',
                campaign: campaignId,
                guild: config.targetGuild,
                code: recruitmentCode,
                url: `${this.recruitmentChannels[config.channel].baseUrl}/${recruitmentCode}`,
                timestamp: Date.now()
            };
            
            qrCodeData = await QRCode.toDataURL(JSON.stringify(qrData), {
                width: 512,
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' }
            });
        }
        
        // Store in database
        await this.db.execute(`
            INSERT INTO recruitment_campaigns 
            (id, channel_type, campaign_name, target_guild, recruitment_code, qr_code_data)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            campaignId,
            config.channel,
            config.name,
            config.targetGuild,
            recruitmentCode,
            qrCodeData
        ]);
        
        // Store in memory
        const campaign = {
            id: campaignId,
            ...config,
            recruitmentCode,
            qrCodeData,
            created: new Date(),
            stats: { recruits: 0, conversions: 0, revenue: 0 }
        };
        
        this.activeCampaigns.set(campaignId, campaign);
        return campaign;
    }
    
    async handleChannelRecruitment(req, res) {
        const { channel, code } = req.params;
        const channelConfig = this.recruitmentChannels[channel];
        
        if (!channelConfig) {
            return res.status(404).json({ error: 'Recruitment channel not found' });
        }
        
        // Find campaign by code
        let campaign = null;
        if (code) {
            campaign = Array.from(this.activeCampaigns.values())
                .find(c => c.recruitmentCode === code);
        }
        
        // Generate recruitment interface for this channel
        const recruitmentInterface = this.generateChannelInterface(channel, campaign);
        res.send(recruitmentInterface);
    }
    
    async processRecruitment(data) {
        try {
            const {
                channel,
                recruitmentCode,
                characterName,
                metadata = {}
            } = data;
            
            // Find campaign
            const campaign = Array.from(this.activeCampaigns.values())
                .find(c => c.recruitmentCode === recruitmentCode);
            
            if (!campaign) {
                throw new Error('Invalid recruitment code');
            }
            
            // Determine guild assignment
            const guildAssignment = this.determineGuildAssignment(channel, campaign, metadata);
            
            // Create character through Shadow Layer Game Master
            const characterData = await this.createRecruitedCharacter({
                characterName,
                channel,
                campaign,
                guildAssignment,
                metadata
            });
            
            // Process Magic Internet Money rewards
            await this.processMIMRewards({
                characterId: characterData.id,
                channel,
                campaign,
                referrerId: metadata.referrerId
            });
            
            // Record recruitment event
            await this.recordRecruitmentEvent({
                campaignId: campaign.id,
                channelType: channel,
                characterId: characterData.id,
                guildAssigned: guildAssignment.guild,
                metadata
            });
            
            // Update statistics
            this.updateRecruitmentStats(channel, guildAssignment.guild);
            
            // Broadcast recruitment success
            this.broadcastRecruitment({
                type: 'new_recruit',
                character: characterData,
                guild: guildAssignment.guild,
                channel: channel,
                campaign: campaign.name
            });
            
            return {
                success: true,
                character: characterData,
                guild: guildAssignment,
                welcomeMessage: this.generateWelcomeMessage(characterData, guildAssignment, channel),
                nextSteps: this.getNextSteps(guildAssignment, channel)
            };
            
        } catch (error) {
            console.error('Recruitment processing error:', error);
            throw error;
        }
    }
    
    determineGuildAssignment(channel, campaign, metadata) {
        const channelConfig = this.recruitmentChannels[channel];
        let targetGuild = campaign.targetGuild;
        
        // Special logic for different channels
        switch (channel) {
            case 'referral_link':
                // Inherit referrer's guild or allow choice
                if (metadata.referrerGuild && metadata.referrerGuild !== 'any') {
                    targetGuild = metadata.referrerGuild;
                }
                break;
                
            case 'email_domain':
                // Domain-based guild assignment
                const domain = metadata.emailDomain;
                if (domain && domain.endsWith('.ai')) targetGuild = 'Tech Innovators';
                else if (domain && domain.endsWith('.research')) targetGuild = 'Scholar Collective';
                else if (domain && domain.endsWith('.dev')) targetGuild = 'Tech Innovators';
                else if (domain && domain.endsWith('.trade')) targetGuild = 'Merchant Alliance';
                break;
                
            case 'device_id':
                // Hardware-based assignment
                const deviceType = metadata.deviceType;
                if (deviceType === 'mobile') targetGuild = 'Digital Guardians';
                else if (deviceType === 'server') targetGuild = 'Tech Innovators';
                break;
        }
        
        return {
            guild: targetGuild || 'Scholar Collective', // Default guild
            bonuses: channelConfig.characterBonus,
            spawnLocation: channelConfig.spawnLocation,
            specialPerks: this.getChannelPerks(channel)
        };
    }
    
    async createRecruitedCharacter(config) {
        const {
            characterName,
            channel,
            campaign,
            guildAssignment,
            metadata
        } = config;
        
        // Use Shadow Layer Game Master to create character with bonuses
        const characterRequest = {
            characterName,
            guildPreference: guildAssignment.guild,
            spawnLocation: guildAssignment.spawnLocation,
            bonuses: guildAssignment.bonuses,
            recruitmentChannel: channel,
            campaignId: campaign.id,
            specialTraits: this.generateSpecialTraits(channel, metadata)
        };
        
        // If Character Registration Service is available, use it
        if (this.characterService) {
            const character = await this.characterService.registerCharacter(
                metadata.userId || crypto.randomUUID(),
                characterName,
                {
                    lineagePreference: guildAssignment.guild,
                    deviceFingerprint: metadata.deviceFingerprint,
                    method: `recruitment_${channel}`
                }
            );
            
            return character.character;
        }
        
        // Otherwise, create through Shadow Layer Game Master
        const character = await this.shadowGameMaster.createCharacterFromRecruitment(characterRequest);
        return character;
    }
    
    async processMIMRewards(config) {
        const { characterId, channel, campaign, referrerId } = config;
        
        // Base signup reward
        const baseReward = campaign.rewards?.signup || 100;
        await this.awardMIM(characterId, baseReward, 'recruitment_signup', {
            channel,
            campaignId: campaign.id
        });
        
        // Referral rewards
        if (referrerId && campaign.rewards?.referral) {
            await this.awardMIM(referrerId, campaign.rewards.referral, 'referral_bonus', {
                newRecruitId: characterId,
                channel,
                campaignId: campaign.id
            });
        }
        
        // Channel-specific bonuses
        const channelBonuses = this.getChannelBonuses(channel, campaign);
        for (const bonus of channelBonuses) {
            await this.awardMIM(characterId, bonus.amount, bonus.type, bonus.metadata);
        }
    }
    
    async awardMIM(characterId, amount, transactionType, metadata = {}) {
        // Record Magic Internet Money transaction
        await this.db.execute(`
            INSERT INTO magic_internet_money 
            (character_id, transaction_type, amount, source_channel, metadata)
            VALUES (?, ?, ?, ?, ?)
        `, [
            characterId,
            transactionType,
            amount,
            metadata.channel || 'guild_recruitment',
            JSON.stringify(metadata)
        ]);
        
        // Update character's balance in unified game world
        // This would integrate with the existing economy system
        
        console.log(`💰 Awarded ${amount} MIM to ${characterId} for ${transactionType}`);
    }
    
    generateRecruitmentCode(channel) {
        const prefix = {
            qr_code: 'QR',
            upc_code: 'UPC',
            referral_link: 'REF',
            device_id: 'DEV',
            seed_phrase: 'SEED',
            social_media: 'SOC',
            api_key: 'API',
            email_domain: 'DOM'
        };
        
        return `${prefix[channel] || 'GEN'}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
    
    generateSpecialTraits(channel, metadata) {
        const traits = {};
        
        switch (channel) {
            case 'qr_code':
                traits.scanner_affinity = 0.8;
                traits.digital_navigation = 0.9;
                break;
                
            case 'upc_code':
                traits.product_knowledge = 0.85;
                traits.market_sense = 0.7;
                break;
                
            case 'referral_link':
                traits.social_connectivity = 0.9;
                traits.trust_network = 0.8;
                break;
                
            case 'device_id':
                traits.hardware_affinity = 0.9;
                traits.security_awareness = 0.85;
                break;
                
            case 'seed_phrase':
                traits.cryptographic_wisdom = 0.95;
                traits.decentralization = 0.9;
                break;
        }
        
        return traits;
    }
    
    getChannelPerks(channel) {
        return {
            qr_code: ['Instant QR Code Generation', 'Pattern Recognition Bonus'],
            upc_code: ['Product Database Access', 'Trade Route Knowledge'],
            referral_link: ['Network Effect Multiplier', 'Social Influence Boost'],
            device_id: ['Hardware Security Keys', 'Multi-Device Sync'],
            seed_phrase: ['Crypto Wallet Integration', 'DeFi Protocol Access'],
            social_media: ['Viral Marketing Tools', 'Community Building'],
            api_key: ['Developer Portal Access', 'Custom Integration Tools'],
            email_domain: ['Domain Authority Recognition', 'Professional Network']
        }[channel] || [];
    }
    
    getChannelBonuses(channel, campaign) {
        const bonuses = [];
        
        if (channel === 'seed_phrase' && campaign.rewards?.staking_bonus) {
            bonuses.push({
                amount: 50,
                type: 'crypto_verification_bonus',
                metadata: { verified_crypto_user: true }
            });
        }
        
        if (channel === 'device_id' && campaign.rewards?.security_bonus) {
            bonuses.push({
                amount: campaign.rewards.security_bonus,
                type: 'security_verification_bonus',
                metadata: { hardware_verified: true }
            });
        }
        
        return bonuses;
    }
    
    generateWelcomeMessage(character, guildAssignment, channel) {
        const channelName = this.recruitmentChannels[channel].name;
        
        return `🎉 Welcome to the ${guildAssignment.guild}, ${character.name}!
        
You've joined through the ${channelName} and have been blessed with special abilities:
${Object.entries(guildAssignment.bonuses).map(([skill, bonus]) => 
    `• ${skill.charAt(0).toUpperCase() + skill.slice(1)}: +${bonus}`
).join('\n')}

Your spawn location: ${guildAssignment.spawnLocation}
Special Perks: ${guildAssignment.specialPerks.join(', ')}

Welcome to the magical world of guild recruitment! 🏰✨`;
    }
    
    getNextSteps(guildAssignment, channel) {
        return [
            `Visit your spawn location: ${guildAssignment.spawnLocation}`,
            `Explore your guild: ${guildAssignment.guild}`,
            'Complete your first guild quest',
            'Invite friends through your referral link',
            'Check your Magic Internet Money balance',
            'Customize your character profile'
        ];
    }
    
    updateRecruitmentStats(channel, guild) {
        this.recruitmentStats.totalRecruits++;
        this.recruitmentStats.byChannel[channel] = (this.recruitmentStats.byChannel[channel] || 0) + 1;
        this.recruitmentStats.byGuild[guild] = (this.recruitmentStats.byGuild[guild] || 0) + 1;
    }
    
    async recordRecruitmentEvent(eventData) {
        await this.db.execute(`
            INSERT INTO recruitment_events 
            (campaign_id, channel_type, recruit_method, character_id, guild_assigned, 
             referrer_id, device_fingerprint, recruitment_data, spawn_location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            eventData.campaignId,
            eventData.channelType,
            eventData.recruitMethod || eventData.channelType,
            eventData.characterId,
            eventData.guildAssigned,
            eventData.metadata.referrerId || null,
            eventData.metadata.deviceFingerprint || null,
            JSON.stringify(eventData.metadata),
            eventData.spawnLocation || 'Unknown'
        ]);
    }
    
    broadcastRecruitment(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    async getActiveCampaigns() {
        const [campaigns] = await this.db.execute(
            'SELECT * FROM recruitment_campaigns WHERE is_active = TRUE ORDER BY created_at DESC'
        );
        return campaigns;
    }
    
    async getRecruitmentStats() {
        const [campaigns] = await this.db.execute(
            'SELECT channel_type, COUNT(*) as count, SUM(total_recruits) as recruits FROM recruitment_campaigns GROUP BY channel_type'
        );
        
        const [recentRecruits] = await this.db.execute(
            'SELECT * FROM recruitment_events ORDER BY timestamp DESC LIMIT 10'
        );
        
        return {
            summary: this.recruitmentStats,
            campaignBreakdown: campaigns,
            recentActivity: recentRecruits,
            topChannels: this.getTopChannels(),
            conversionRates: this.calculateConversionRates()
        };
    }
    
    getTopChannels() {
        return Object.entries(this.recruitmentStats.byChannel)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([channel, count]) => ({ channel, count }));
    }
    
    calculateConversionRates() {
        // Placeholder for conversion rate calculation
        return Object.keys(this.recruitmentChannels).reduce((rates, channel) => {
            rates[channel] = Math.random() * 0.3 + 0.1; // 10-40% conversion rate
            return rates;
        }, {});
    }
    
    async getMIMBalance(characterId) {
        const [result] = await this.db.execute(`
            SELECT SUM(amount) as balance 
            FROM magic_internet_money 
            WHERE character_id = ?
        `, [characterId]);
        
        return result[0]?.balance || 0;
    }
    
    generateRecruitmentInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🏰 Guild Recruitment Bridge - Magic Internet Money Style</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px;
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 3.5em;
            margin: 0;
            text-shadow: 0 0 30px rgba(255,255,255,0.5);
        }
        
        .subtitle {
            font-size: 1.5em;
            opacity: 0.9;
            margin: 20px 0;
        }
        
        .channels-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin: 40px 0;
        }
        
        .channel-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 16px;
            padding: 30px;
            transition: all 0.3s;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        
        .channel-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border-color: rgba(255,255,255,0.5);
        }
        
        .channel-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #00f5ff, #ff00ff);
        }
        
        .channel-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        
        .channel-name {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .channel-desc {
            opacity: 0.8;
            margin-bottom: 20px;
        }
        
        .channel-bonuses {
            background: rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .bonus-item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        
        .stats-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        
        .stat-card {
            background: rgba(0,0,0,0.2);
            padding: 25px;
            border-radius: 12px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #00f5ff;
        }
        
        .join-btn {
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            width: 100%;
            margin-top: 15px;
        }
        
        .join-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(0,245,255,0.4);
        }
        
        .live-feed {
            background: rgba(0,0,0,0.3);
            border-radius: 16px;
            padding: 25px;
            margin-top: 40px;
        }
        
        .feed-item {
            padding: 10px;
            margin: 10px 0;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            border-left: 4px solid #00f5ff;
        }
        
        @keyframes glow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .glow {
            animation: glow 2s infinite;
        }
        
        .magic-money-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            padding: 15px 25px;
            border-radius: 25px;
            border: 2px solid #ffdf00;
            color: #ffdf00;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="magic-money-indicator glow">
        💰 MIM: ${this.recruitmentStats.totalRecruits * 150} Available
    </div>
    
    <div class="container">
        <div class="header">
            <h1>🏰 Guild Recruitment Bridge</h1>
            <div class="subtitle">Magic Internet Money Style Multi-Channel Recruitment</div>
            <p>Choose your recruitment method and join the guild that matches your entry portal!</p>
        </div>
        
        <div class="stats-section">
            <div class="stat-card">
                <div class="stat-number">${this.recruitmentStats.totalRecruits}</div>
                <div>Total Recruits</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.activeCampaigns.size}</div>
                <div>Active Campaigns</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(this.recruitmentChannels).length}</div>
                <div>Recruitment Channels</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(this.recruitmentStats.byGuild).length || 4}</div>
                <div>Active Guilds</div>
            </div>
        </div>
        
        <h2 style="text-align: center; margin: 40px 0;">🎯 Choose Your Recruitment Path</h2>
        
        <div class="channels-grid">
            ${Object.entries(this.recruitmentChannels).map(([channel, config]) => `
                <div class="channel-card" onclick="window.location.href='/recruit/${channel}'">
                    <div class="channel-icon">${this.getChannelIcon(channel)}</div>
                    <div class="channel-name">${config.name}</div>
                    <div class="channel-desc">${config.description}</div>
                    
                    <div class="channel-bonuses">
                        <strong>Character Bonuses:</strong>
                        ${Object.entries(config.characterBonus).map(([skill, bonus]) => `
                            <div class="bonus-item">
                                <span>${skill}:</span>
                                <span style="color: #00ff00;">+${bonus}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 15px;">
                        <strong>Preferred Guild:</strong> ${Array.isArray(config.guildPreference) ? config.guildPreference.join(', ') : config.guildPreference}
                    </div>
                    
                    <div style="margin-top: 10px;">
                        <strong>Spawn Location:</strong> ${config.spawnLocation}
                    </div>
                    
                    <button class="join-btn">Join Through ${config.name}</button>
                </div>
            `).join('')}
        </div>
        
        <div class="live-feed">
            <h3>🔥 Live Recruitment Feed</h3>
            <div id="recruitment-feed">
                <div class="feed-item">🎉 TechNinja joined Tech Innovators through QR Code Scanner</div>
                <div class="feed-item">💎 CryptoWizard joined Crypto Collective via Seed Phrase</div>
                <div class="feed-item">🛡️ GuardianAlpha joined Digital Guardians through Device ID</div>
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket connection for live updates
        const ws = new WebSocket('ws://localhost:7777');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'new_recruit') {
                addToFeed(\`🎉 \${data.character.name} joined \${data.guild} through \${data.channel}\`);
            }
        };
        
        function addToFeed(message) {
            const feed = document.getElementById('recruitment-feed');
            const item = document.createElement('div');
            item.className = 'feed-item';
            item.textContent = message;
            feed.insertBefore(item, feed.firstChild);
            
            // Remove old items
            if (feed.children.length > 10) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        // Update MIM indicator
        function updateMIMIndicator() {
            fetch('/api/stats')
                .then(res => res.json())
                .then(stats => {
                    const indicator = document.querySelector('.magic-money-indicator');
                    indicator.innerHTML = \`💰 MIM: \${stats.summary.totalRecruits * 150} Available\`;
                });
        }
        
        setInterval(updateMIMIndicator, 5000);
    </script>
</body>
</html>`;
    }
    
    getChannelIcon(channel) {
        return {
            qr_code: '📱',
            upc_code: '🏷️',
            referral_link: '🔗',
            device_id: '💻',
            seed_phrase: '🌱',
            social_media: '📢',
            api_key: '🔑',
            email_domain: '📧'
        }[channel] || '🎯';
    }
    
    generateChannelInterface(channel, campaign) {
        const config = this.recruitmentChannels[channel];
        const campaignData = campaign || { name: `${config.name} Campaign`, recruitmentCode: 'DEMO-CODE' };
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>${config.name} - Guild Recruitment</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .recruitment-form {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            border: 2px solid rgba(255,255,255,0.2);
        }
        
        .channel-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        
        .form-input {
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            border: none;
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 16px;
            box-sizing: border-box;
        }
        
        .form-input::placeholder {
            color: rgba(255,255,255,0.7);
        }
        
        .join-button {
            background: linear-gradient(135deg, #00f5ff, #ff00ff);
            color: white;
            border: none;
            padding: 20px 40px;
            border-radius: 25px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
        }
        
        .bonuses-preview {
            background: rgba(0,0,0,0.2);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="recruitment-form">
        <div class="channel-icon">${this.getChannelIcon(channel)}</div>
        <h1>${config.name}</h1>
        <p>${config.description}</p>
        
        <div class="bonuses-preview">
            <h3>✨ Character Bonuses You'll Receive:</h3>
            ${Object.entries(config.characterBonus).map(([skill, bonus]) => 
                `<div>• ${skill}: <span style="color: #00ff00;">+${bonus}</span></div>`
            ).join('')}
            
            <h3>🏰 Spawn Location:</h3>
            <div>${config.spawnLocation}</div>
        </div>
        
        <form id="recruitmentForm">
            <input type="hidden" id="channel" value="${channel}">
            <input type="hidden" id="recruitmentCode" value="${campaignData.recruitmentCode}">
            
            <input type="text" class="form-input" id="characterName" placeholder="Choose your character name" required>
            <input type="email" class="form-input" id="email" placeholder="Email (optional)">
            
            ${channel === 'referral_link' ? '<input type="text" class="form-input" id="referrerCode" placeholder="Referral code (if you have one)">' : ''}
            ${channel === 'seed_phrase' ? '<input type="text" class="form-input" id="seedPhrase" placeholder="Enter your seed phrase" required>' : ''}
            ${channel === 'upc_code' ? '<input type="text" class="form-input" id="upcCode" placeholder="Scan or enter UPC code" required>' : ''}
            
            <button type="submit" class="join-button">
                🚀 Join Guild Now!
            </button>
        </form>
        
        <div style="margin-top: 30px; opacity: 0.8;">
            <small>Campaign: ${campaignData.name}</small><br>
            <small>Code: ${campaignData.recruitmentCode}</small>
        </div>
    </div>
    
    <script>
        document.getElementById('recruitmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                channel: document.getElementById('channel').value,
                recruitmentCode: document.getElementById('recruitmentCode').value,
                characterName: document.getElementById('characterName').value,
                metadata: {
                    email: document.getElementById('email')?.value,
                    referrerCode: document.getElementById('referrerCode')?.value,
                    seedPhrase: document.getElementById('seedPhrase')?.value,
                    upcCode: document.getElementById('upcCode')?.value,
                    deviceFingerprint: navigator.userAgent,
                    timestamp: Date.now()
                }
            };
            
            try {
                const response = await fetch('/api/recruit/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(\`🎉 Welcome \${result.character.name}! You've joined \${result.guild.guild}!\n\n\${result.welcomeMessage}\`);
                    window.location.href = '/';
                } else {
                    alert('Recruitment failed: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                alert('Error during recruitment: ' + error.message);
            }
        });
    </script>
</body>
</html>`;
    }
}

// Initialize the Guild Recruitment Bridge
if (require.main === module) {
    const bridge = new GuildRecruitmentBridge();
    
    bridge.initialize().then(() => {
        console.log('\n🏰 GUILD RECRUITMENT BRIDGE OPERATIONAL!');
        console.log('===========================================');
        console.log('🎯 Multi-channel recruitment system active');
        console.log('💰 Magic Internet Money rewards configured');
        console.log('🔗 Connected to existing systems');
        console.log(`📊 Monitoring ${Object.keys(bridge.recruitmentChannels).length} recruitment channels`);
        console.log('\n🌟 Let the magical recruitment begin!');
    }).catch(error => {
        console.error('❌ Guild Recruitment Bridge failed to start:', error);
    });
}

module.exports = GuildRecruitmentBridge;
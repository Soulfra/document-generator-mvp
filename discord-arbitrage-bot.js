#!/usr/bin/env node

/**
 * 🤖💰 DISCORD CRYPTO ARBITRAGE BOT
 * 
 * Real-time Discord notifications for crypto arbitrage opportunities
 * Integrates with existing crypto-arbitrage-trading-platform.js
 * Character-based trading alerts with personality-driven recommendations
 */

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class DiscordArbitrageBot {
    constructor() {
        this.bot = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages
            ]
        });
        
        // Configuration
        this.config = {
            // Discord bot token (set via environment variable)
            botToken: process.env.DISCORD_BOT_TOKEN,
            // Crypto platform connection
            cryptoPlatformUrl: 'http://localhost:3338',
            cryptoWebSocketUrl: 'ws://localhost:3339',
            // AI Character system
            characterSystemUrl: 'http://localhost:6001',
            // Alert settings
            minProfitThreshold: 2.0, // 2% minimum for alerts
            alertCooldown: 300000,   // 5 minutes between same-type alerts
            maxAlertsPerHour: 12,    // Rate limiting
        };
        
        // State management
        this.alertHistory = new Map();
        this.userSubscriptions = new Map();
        this.characterPersonalities = new Map();
        this.cryptoWebSocket = null;
        this.reconnectInterval = null;
        
        // Alert channels by type
        this.alertChannels = {
            arbitrage: null,
            priceMovement: null,
            trading: null,
            general: null
        };
        
        console.log('🤖 Discord Arbitrage Bot initializing...');
        this.init();
    }
    
    async init() {
        try {
            await this.loadConfiguration();
            await this.setupEventHandlers();
            await this.connectToCryptoPlatform();
            await this.loadCharacterPersonalities();
            await this.startBot();
        } catch (error) {
            console.error('Failed to initialize Discord bot:', error);
            process.exit(1);
        }
    }
    
    async loadConfiguration() {
        try {
            const configPath = path.join(__dirname, 'config', 'discord-bot-config.json');
            const configExists = await fs.access(configPath).then(() => true).catch(() => false);
            
            if (configExists) {
                const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
                this.config = { ...this.config, ...config };
            } else {
                // Create default config
                await fs.mkdir(path.dirname(configPath), { recursive: true });
                await fs.writeFile(configPath, JSON.stringify({
                    minProfitThreshold: 2.0,
                    alertCooldown: 300000,
                    maxAlertsPerHour: 12,
                    channels: {
                        arbitrage: null,
                        priceMovement: null,
                        trading: null,
                        general: null
                    }
                }, null, 2));
            }
        } catch (error) {
            console.warn('Could not load configuration, using defaults:', error.message);
        }
    }
    
    async setupEventHandlers() {
        this.bot.once('ready', async () => {
            console.log(`🤖 Discord bot logged in as ${this.bot.user.tag}!`);
            
            // Set bot status
            this.bot.user.setActivity('crypto markets 📈', { type: 'WATCHING' });
            
            // Find or create alert channels
            await this.setupAlertChannels();
            
            // Send startup message
            await this.sendStartupMessage();
        });
        
        this.bot.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            await this.handleMessage(message);
        });
        
        this.bot.on('interactionCreate', async (interaction) => {
            await this.handleInteraction(interaction);
        });
        
        this.bot.on('error', (error) => {
            console.error('Discord bot error:', error);
        });
        
        this.bot.on('disconnect', () => {
            console.log('🔌 Discord bot disconnected, attempting to reconnect...');
        });
    }
    
    async connectToCryptoPlatform() {
        try {
            // Test connection to crypto platform
            const healthCheck = await axios.get(`${this.config.cryptoPlatformUrl}/api/health`);
            console.log(`✅ Connected to crypto platform: ${healthCheck.data.priceSourcesActive} sources active`);
            
            // Connect to WebSocket for real-time updates
            this.connectWebSocket();
            
        } catch (error) {
            console.error('Failed to connect to crypto platform:', error.message);
            console.log('🔄 Will retry connection in 30 seconds...');
            
            setTimeout(() => {
                this.connectToCryptoPlatform();
            }, 30000);
        }
    }
    
    connectWebSocket() {
        try {
            this.cryptoWebSocket = new WebSocket(this.config.cryptoWebSocketUrl);
            
            this.cryptoWebSocket.on('open', () => {
                console.log('📡 Connected to crypto platform WebSocket');
                
                // Subscribe to all updates
                this.cryptoWebSocket.send(JSON.stringify({
                    type: 'subscribe',
                    cryptos: ['BTC', 'ETH', 'XMR', 'SOL']
                }));
            });
            
            this.cryptoWebSocket.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleCryptoUpdate(message);
                } catch (error) {
                    console.error('Error processing crypto update:', error);
                }
            });
            
            this.cryptoWebSocket.on('close', () => {
                console.log('📡 WebSocket connection closed, reconnecting...');
                setTimeout(() => {
                    this.connectWebSocket();
                }, 5000);
            });
            
            this.cryptoWebSocket.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
            
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
        }
    }
    
    async loadCharacterPersonalities() {
        try {
            // Load character personalities from AI character system
            const response = await axios.get(`${this.config.characterSystemUrl}/api/characters/active`);
            
            for (const character of response.data.characters) {
                this.characterPersonalities.set(character.id, {
                    name: character.name,
                    personality: character.mood,
                    specialization: character.activity,
                    style: this.getPersonalityStyle(character.mood)
                });
            }
            
            console.log(`🎭 Loaded ${this.characterPersonalities.size} character personalities`);
            
        } catch (error) {
            console.warn('Could not load character personalities:', error.message);
            
            // Create default characters
            this.characterPersonalities.set('crypto-sage', {
                name: 'Crypto Sage',
                personality: 'analytical',
                specialization: 'market analysis',
                style: 'conservative'
            });
            
            this.characterPersonalities.set('moon-hunter', {
                name: 'Moon Hunter',
                personality: 'excited',
                specialization: 'high-risk opportunities',
                style: 'aggressive'
            });
        }
    }
    
    getPersonalityStyle(mood) {
        const styles = {
            excited: 'aggressive',
            happy: 'optimistic',
            focused: 'analytical',
            tired: 'conservative',
            curious: 'exploratory',
            confident: 'bold'
        };
        
        return styles[mood] || 'balanced';
    }
    
    async setupAlertChannels() {
        const guild = this.bot.guilds.cache.first();
        if (!guild) {
            console.warn('Bot not in any guilds, cannot setup channels');
            return;
        }
        
        // Find or create channels
        const channelNames = {
            arbitrage: '🚨arbitrage-alerts',
            priceMovement: '📈price-movements', 
            trading: '💰trading-updates',
            general: '🤖bot-commands'
        };
        
        for (const [type, channelName] of Object.entries(channelNames)) {
            let channel = guild.channels.cache.find(ch => ch.name === channelName);
            
            if (!channel) {
                try {
                    channel = await guild.channels.create({
                        name: channelName,
                        type: 0, // Text channel
                        topic: `Automated ${type} notifications from Crypto Arbitrage Bot`
                    });
                    console.log(`✅ Created channel: ${channelName}`);
                } catch (error) {
                    console.error(`Failed to create channel ${channelName}:`, error);
                }
            }
            
            this.alertChannels[type] = channel;
        }
    }
    
    async sendStartupMessage() {
        const channel = this.alertChannels.general;
        if (!channel) return;
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Crypto Arbitrage Bot Online!')
            .setDescription('Ready to monitor crypto markets and alert on arbitrage opportunities')
            .setColor('#00ff00')
            .addFields([
                { name: '📊 Monitoring', value: 'BTC, ETH, XMR, SOL', inline: true },
                { name: '🔍 Exchanges', value: 'Coinbase, Binance, Kraken', inline: true },
                { name: '⚡ Min Profit', value: `${this.config.minProfitThreshold}%`, inline: true }
            ])
            .setTimestamp();
        
        await channel.send({ embeds: [embed] });
    }
    
    async handleCryptoUpdate(message) {
        switch (message.type) {
            case 'arbitrageOpportunity':
                await this.handleArbitrageAlert(message.data);
                break;
            case 'priceUpdate':
                await this.handlePriceUpdate(message.data);
                break;
            case 'orderCreated':
                await this.handleTradingUpdate('Order Created', message.data);
                break;
            case 'tradeExecuted':
                await this.handleTradingUpdate('Trade Executed', message.data);
                break;
        }
    }
    
    async handleArbitrageAlert(opportunity) {
        // Check if profit meets threshold
        if (opportunity.profitPercentage < this.config.minProfitThreshold) {
            return;
        }
        
        // Check cooldown
        const alertKey = `arbitrage-${opportunity.crypto}`;
        const lastAlert = this.alertHistory.get(alertKey);
        if (lastAlert && Date.now() - lastAlert < this.config.alertCooldown) {
            return;
        }
        
        this.alertHistory.set(alertKey, Date.now());
        
        const channel = this.alertChannels.arbitrage;
        if (!channel) return;
        
        // Get character personality for this alert
        const character = this.getRandomCharacter();
        const characterMessage = this.generateCharacterMessage(character, opportunity);
        
        const embed = new EmbedBuilder()
            .setTitle('🚨 ARBITRAGE OPPORTUNITY DETECTED!')
            .setDescription(`**${opportunity.crypto}** price difference found`)
            .setColor('#ff6b35')
            .addFields([
                { name: '📊 Crypto', value: opportunity.crypto, inline: true },
                { name: '💰 Profit', value: `${opportunity.profitPercentage.toFixed(2)}%`, inline: true },
                { name: '⚡ Potential', value: `$${opportunity.potentialProfit.toFixed(2)}`, inline: true },
                { name: '🏪 Source Exchange', value: opportunity.sourceExchange, inline: true },
                { name: '🏪 Target Exchange', value: opportunity.targetExchange, inline: true },
                { name: '💵 Price Diff', value: `$${Math.abs(opportunity.targetPrice - opportunity.sourcePrice).toFixed(2)}`, inline: true },
                { name: `🤖 ${character.name} says:`, value: characterMessage, inline: false }
            ])
            .setTimestamp()
            .setFooter({ text: `Detected at ${new Date(opportunity.detectedAt).toLocaleTimeString()}` });
        
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`view_opportunity_${opportunity.id}`)
                    .setLabel('View Details')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔍'),
                new ButtonBuilder()
                    .setCustomId(`track_crypto_${opportunity.crypto}`)
                    .setLabel(`Track ${opportunity.crypto}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId(`place_bet_${opportunity.id}`)
                    .setLabel('Place Bet')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎲')
            );
        
        await channel.send({ 
            embeds: [embed], 
            components: [actionRow],
            content: opportunity.profitPercentage > 5 ? '@everyone **HIGH PROFIT ALERT!**' : ''
        });
        
        console.log(`🚨 Sent arbitrage alert: ${opportunity.crypto} ${opportunity.profitPercentage.toFixed(2)}%`);
    }
    
    async handlePriceUpdate(priceData) {
        // Check for significant price movements (>10% in short time)
        for (const [key, data] of Object.entries(priceData)) {
            const [crypto] = key.split('-');
            await this.checkPriceMovement(crypto, data);
        }
    }
    
    async checkPriceMovement(crypto, currentData) {
        // This would compare with recent price history
        // For now, we'll simulate significant movement detection
        
        const alertKey = `price-${crypto}`;
        const lastAlert = this.alertHistory.get(alertKey);
        
        // Only alert once per 30 minutes for price movements
        if (lastAlert && Date.now() - lastAlert < 30 * 60 * 1000) {
            return;
        }
        
        // Simulate price movement detection (in production, this would use historical data)
        const randomMovement = Math.random();
        if (randomMovement > 0.98) { // 2% chance of triggering movement alert
            this.alertHistory.set(alertKey, Date.now());
            
            const movementPercentage = (Math.random() * 20 + 5); // 5-25% movement
            const isPositive = Math.random() > 0.5;
            
            await this.sendPriceMovementAlert(crypto, currentData, movementPercentage, isPositive);
        }
    }
    
    async sendPriceMovementAlert(crypto, priceData, movement, isPositive) {
        const channel = this.alertChannels.priceMovement;
        if (!channel) return;
        
        const character = this.getRandomCharacter();
        const movementEmoji = isPositive ? '🚀' : '📉';
        const movementColor = isPositive ? '#00ff00' : '#ff0000';
        
        const embed = new EmbedBuilder()
            .setTitle(`${movementEmoji} ${crypto} SIGNIFICANT PRICE MOVEMENT`)
            .setDescription(`${crypto} has moved ${isPositive ? 'up' : 'down'} ${movement.toFixed(2)}%`)
            .setColor(movementColor)
            .addFields([
                { name: '💰 Current Price', value: `$${priceData.price.toFixed(2)}`, inline: true },
                { name: '📊 Exchange', value: priceData.exchange, inline: true },
                { name: '🕐 Movement', value: `${movement.toFixed(2)}%`, inline: true },
                { name: `🤖 ${character.name} analysis:`, value: this.generatePriceMovementMessage(character, crypto, movement, isPositive), inline: false }
            ])
            .setTimestamp();
        
        await channel.send({ embeds: [embed] });
    }
    
    getRandomCharacter() {
        const characters = Array.from(this.characterPersonalities.values());
        return characters[Math.floor(Math.random() * characters.length)];
    }
    
    generateCharacterMessage(character, opportunity) {
        const messages = {
            conservative: [
                `This ${opportunity.profitPercentage.toFixed(1)}% spread looks solid. Low risk with decent returns.`,
                `I've been tracking ${opportunity.crypto} and this opportunity has good fundamentals.`,
                `Careful analysis shows this is a legitimate arbitrage with minimal risk.`
            ],
            aggressive: [
                `🚀 ${opportunity.profitPercentage.toFixed(1)}% profit potential! Time to make moves!`,
                `This ${opportunity.crypto} arbitrage is printing money right now! Don't sleep on it!`,
                `The spreads are WIDE open on ${opportunity.crypto}! This is what we've been waiting for!`
            ],
            analytical: [
                `Data analysis confirms ${opportunity.profitPercentage.toFixed(1)}% arbitrage on ${opportunity.crypto}. Volume supports execution.`,
                `Cross-exchange price differential indicates ${opportunity.crypto} arbitrage viability.`,
                `Market inefficiency detected: ${opportunity.crypto} ${opportunity.sourceExchange} vs ${opportunity.targetExchange} spread.`
            ]
        };
        
        const styleMessages = messages[character.style] || messages.conservative;
        return styleMessages[Math.floor(Math.random() * styleMessages.length)];
    }
    
    generatePriceMovementMessage(character, crypto, movement, isPositive) {
        if (isPositive) {
            const bullishMessages = {
                conservative: `${crypto} showing strength. Worth monitoring for entry points.`,
                aggressive: `${crypto} is PUMPING! 🚀 ${movement.toFixed(1)}% and climbing!`,
                analytical: `${crypto} exhibits positive momentum. Technical indicators suggest continuation.`
            };
            return bullishMessages[character.style] || bullishMessages.conservative;
        } else {
            const bearishMessages = {
                conservative: `${crypto} correction presents potential buying opportunity.`,
                aggressive: `${crypto} dip incoming! ${movement.toFixed(1)}% down - time to buy the dip! 📉`,
                analytical: `${crypto} pullback aligns with market cycle analysis. Support levels key.`
            };
            return bearishMessages[character.style] || bearishMessages.conservative;
        }
    }
    
    async handleMessage(message) {
        if (!message.content.startsWith('!crypto')) return;
        
        const args = message.content.slice(7).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        switch (command) {
            case 'status':
                await this.sendStatusMessage(message.channel);
                break;
            case 'prices':
                await this.sendCurrentPrices(message.channel, args[0]);
                break;
            case 'arbitrage':
                await this.sendArbitrageOpportunities(message.channel);
                break;
            case 'subscribe':
                await this.handleSubscription(message, args);
                break;
            case 'character':
                await this.sendCharacterInfo(message.channel, args[0]);
                break;
            case 'help':
                await this.sendHelpMessage(message.channel);
                break;
        }
    }
    
    async sendStatusMessage(channel) {
        try {
            const healthCheck = await axios.get(`${this.config.cryptoPlatformUrl}/api/health`);
            const data = healthCheck.data;
            
            const embed = new EmbedBuilder()
                .setTitle('🤖 Crypto Bot Status')
                .setColor('#0099ff')
                .addFields([
                    { name: '📊 Price Sources', value: data.priceSourcesActive.toString(), inline: true },
                    { name: '🚨 Opportunities', value: data.arbitrageOpportunities.toString(), inline: true },
                    { name: '📈 Active Orders', value: data.activeOrders.toString(), inline: true },
                    { name: '🌐 Connections', value: data.activeConnections.toString(), inline: true },
                    { name: '⚡ Threshold', value: `${this.config.minProfitThreshold}%`, inline: true },
                    { name: '🎭 Characters', value: this.characterPersonalities.size.toString(), inline: true }
                ])
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });
        } catch (error) {
            await channel.send('❌ Error fetching status: ' + error.message);
        }
    }
    
    async sendCurrentPrices(channel, crypto = null) {
        try {
            const response = await axios.get(`${this.config.cryptoPlatformUrl}/api/prices`, {
                params: crypto ? { crypto } : {}
            });
            
            const prices = response.data;
            const embed = new EmbedBuilder()
                .setTitle(crypto ? `💰 ${crypto} Prices` : '💰 Current Crypto Prices')
                .setColor('#ffd700')
                .setTimestamp();
            
            for (const [key, data] of Object.entries(prices)) {
                embed.addFields([{
                    name: `${data.crypto} - ${data.exchange}`,
                    value: `$${data.price.toFixed(2)}`,
                    inline: true
                }]);
            }
            
            await channel.send({ embeds: [embed] });
        } catch (error) {
            await channel.send('❌ Error fetching prices: ' + error.message);
        }
    }
    
    async sendHelpMessage(channel) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Crypto Arbitrage Bot Commands')
            .setDescription('Available commands for crypto monitoring and trading')
            .setColor('#7289da')
            .addFields([
                { name: '!crypto status', value: 'Show bot and platform status' },
                { name: '!crypto prices [BTC|ETH|XMR|SOL]', value: 'Show current prices' },
                { name: '!crypto arbitrage', value: 'Show current opportunities' },
                { name: '!crypto subscribe [alerts|all]', value: 'Subscribe to notifications' },
                { name: '!crypto character [name]', value: 'Show character info' },
                { name: '!crypto help', value: 'Show this help message' }
            ])
            .setFooter({ text: 'Real-time monitoring: BTC, ETH, XMR, SOL' });
        
        await channel.send({ embeds: [embed] });
    }
    
    async handleInteraction(interaction) {
        if (!interaction.isButton()) return;
        
        const customId = interaction.customId;
        
        if (customId.startsWith('view_opportunity_')) {
            const opportunityId = customId.replace('view_opportunity_', '');
            await this.showOpportunityDetails(interaction, opportunityId);
        } else if (customId.startsWith('track_crypto_')) {
            const crypto = customId.replace('track_crypto_', '');
            await this.enableCryptoTracking(interaction, crypto);
        } else if (customId.startsWith('place_bet_')) {
            const opportunityId = customId.replace('place_bet_', '');
            await this.handleBetPlacement(interaction, opportunityId);
        }
    }
    
    async showOpportunityDetails(interaction, opportunityId) {
        await interaction.reply({
            content: `📊 Detailed analysis for opportunity ${opportunityId} would be shown here.\n\n**Integration Points:**\n- Link to crypto platform dashboard\n- Historical spread analysis\n- Risk assessment\n- Execution recommendations`,
            ephemeral: true
        });
    }
    
    async enableCryptoTracking(interaction, crypto) {
        const userId = interaction.user.id;
        
        if (!this.userSubscriptions.has(userId)) {
            this.userSubscriptions.set(userId, new Set());
        }
        
        this.userSubscriptions.get(userId).add(crypto);
        
        await interaction.reply({
            content: `✅ You're now tracking ${crypto}! You'll receive alerts for price movements and arbitrage opportunities.`,
            ephemeral: true
        });
    }
    
    async handleBetPlacement(interaction, opportunityId) {
        await interaction.reply({
            content: `🎲 Betting interface for opportunity ${opportunityId}\n\n**Integration with betting system:**\n- Connect to existing betting workflow\n- Character-based betting recommendations\n- Real-time odds calculation\n- Secure bet placement`,
            ephemeral: true
        });
    }
    
    async startBot() {
        if (!this.config.botToken) {
            console.error('❌ DISCORD_BOT_TOKEN environment variable not set!');
            console.log('Please set your Discord bot token:');
            console.log('export DISCORD_BOT_TOKEN="your_bot_token_here"');
            process.exit(1);
        }
        
        try {
            await this.bot.login(this.config.botToken);
        } catch (error) {
            console.error('Failed to login to Discord:', error);
            process.exit(1);
        }
    }
}

// Export for use as module
module.exports = DiscordArbitrageBot;

// Run if called directly
if (require.main === module) {
    const bot = new DiscordArbitrageBot();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Discord Arbitrage Bot...');
        bot.bot.destroy();
        process.exit(0);
    });
}
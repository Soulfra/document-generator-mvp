#!/usr/bin/env node

/**
 * 📱💰 TELEGRAM CRYPTO ARBITRAGE BOT
 * 
 * Mobile-friendly Telegram notifications for crypto arbitrage opportunities
 * Integrates with existing crypto-arbitrage-trading-platform.js
 * Quick commands and inline buttons for mobile trading
 */

const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TelegramArbitrageBot {
    constructor() {
        this.config = {
            // Telegram bot token (set via environment variable)
            botToken: process.env.TELEGRAM_BOT_TOKEN,
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
        
        this.bot = null;
        
        // State management
        this.alertHistory = new Map();
        this.userSubscriptions = new Map();
        this.characterPersonalities = new Map();
        this.cryptoWebSocket = null;
        this.adminUsers = new Set(); // Admin user IDs
        
        // Conversation states for interactive commands
        this.conversationStates = new Map();
        
        console.log('📱 Telegram Arbitrage Bot initializing...');
        this.init();
    }
    
    async init() {
        try {
            await this.loadConfiguration();
            await this.initializeBot();
            await this.connectToCryptoPlatform();
            await this.loadCharacterPersonalities();
            console.log('📱 Telegram Arbitrage Bot ready!');
        } catch (error) {
            console.error('Failed to initialize Telegram bot:', error);
            process.exit(1);
        }
    }
    
    async loadConfiguration() {
        try {
            const configPath = path.join(__dirname, 'config', 'telegram-bot-config.json');
            const configExists = await fs.access(configPath).then(() => true).catch(() => false);
            
            if (configExists) {
                const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
                this.config = { ...this.config, ...config };
                
                // Load admin users
                if (config.adminUsers) {
                    config.adminUsers.forEach(userId => this.adminUsers.add(userId));
                }
            } else {
                // Create default config
                await fs.mkdir(path.dirname(configPath), { recursive: true });
                await fs.writeFile(configPath, JSON.stringify({
                    minProfitThreshold: 2.0,
                    alertCooldown: 300000,
                    maxAlertsPerHour: 12,
                    adminUsers: []
                }, null, 2));
            }
        } catch (error) {
            console.warn('Could not load configuration, using defaults:', error.message);
        }
    }
    
    async initializeBot() {
        if (!this.config.botToken) {
            console.error('❌ TELEGRAM_BOT_TOKEN environment variable not set!');
            console.log('Please set your Telegram bot token:');
            console.log('export TELEGRAM_BOT_TOKEN="your_bot_token_here"');
            process.exit(1);
        }
        
        this.bot = new TelegramBot(this.config.botToken, { polling: true });
        
        // Set up command handlers
        this.setupCommands();
        this.setupCallbacks();
        this.setupMessageHandlers();
        
        // Set bot commands in Telegram
        await this.setBotCommands();
        
        console.log('📱 Telegram bot initialized successfully');
    }
    
    async setBotCommands() {
        const commands = [
            { command: 'start', description: 'Start the bot and get welcome message' },
            { command: 'status', description: 'Show bot and platform status' },
            { command: 'prices', description: 'Show current crypto prices' },
            { command: 'arbitrage', description: 'Show current arbitrage opportunities' },
            { command: 'subscribe', description: 'Subscribe to alerts' },
            { command: 'unsubscribe', description: 'Unsubscribe from alerts' },
            { command: 'settings', description: 'Configure alert settings' },
            { command: 'character', description: 'Interact with AI characters' },
            { command: 'help', description: 'Show help message' }
        ];
        
        await this.bot.setMyCommands(commands);
    }
    
    setupCommands() {
        // Start command
        this.bot.onText(/\/start/, async (msg) => {
            await this.handleStartCommand(msg);
        });
        
        // Status command
        this.bot.onText(/\/status/, async (msg) => {
            await this.handleStatusCommand(msg);
        });
        
        // Prices command
        this.bot.onText(/\/prices(?:\s+(\w+))?/, async (msg, match) => {
            const crypto = match[1]?.toUpperCase();
            await this.handlePricesCommand(msg, crypto);
        });
        
        // Arbitrage command
        this.bot.onText(/\/arbitrage/, async (msg) => {
            await this.handleArbitrageCommand(msg);
        });
        
        // Subscribe command
        this.bot.onText(/\/subscribe(?:\s+(.+))?/, async (msg, match) => {
            const type = match[1];
            await this.handleSubscribeCommand(msg, type);
        });
        
        // Unsubscribe command
        this.bot.onText(/\/unsubscribe/, async (msg) => {
            await this.handleUnsubscribeCommand(msg);
        });
        
        // Settings command
        this.bot.onText(/\/settings/, async (msg) => {
            await this.handleSettingsCommand(msg);
        });
        
        // Character command
        this.bot.onText(/\/character(?:\s+(.+))?/, async (msg, match) => {
            const characterName = match[1];
            await this.handleCharacterCommand(msg, characterName);
        });
        
        // Help command
        this.bot.onText(/\/help/, async (msg) => {
            await this.handleHelpCommand(msg);
        });
    }
    
    setupCallbacks() {
        // Handle inline keyboard callbacks
        this.bot.on('callback_query', async (callbackQuery) => {
            await this.handleCallbackQuery(callbackQuery);
        });
    }
    
    setupMessageHandlers() {
        // Handle regular messages (for conversation states)
        this.bot.on('message', async (msg) => {
            if (msg.text && !msg.text.startsWith('/')) {
                await this.handleConversationMessage(msg);
            }
        });
        
        // Error handling
        this.bot.on('error', (error) => {
            console.error('Telegram bot error:', error);
        });
        
        this.bot.on('polling_error', (error) => {
            console.error('Telegram polling error:', error);
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
                name: '🧙 Crypto Sage',
                personality: 'analytical',
                specialization: 'market analysis',
                style: 'conservative'
            });
            
            this.characterPersonalities.set('moon-hunter', {
                name: '🚀 Moon Hunter',
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
    
    async handleCryptoUpdate(message) {
        switch (message.type) {
            case 'arbitrageOpportunity':
                await this.broadcastArbitrageAlert(message.data);
                break;
            case 'priceUpdate':
                await this.handlePriceUpdate(message.data);
                break;
        }
    }
    
    async broadcastArbitrageAlert(opportunity) {
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
        
        // Get character personality for this alert
        const character = this.getRandomCharacter();
        const characterMessage = this.generateCharacterMessage(character, opportunity);
        
        const profitEmoji = opportunity.profitPercentage > 5 ? '🚨' : '💰';
        
        const message = `${profitEmoji} *ARBITRAGE ALERT*\n\n` +
            `💎 *${opportunity.crypto}*\n` +
            `📈 Profit: *${opportunity.profitPercentage.toFixed(2)}%*\n` +
            `💵 Potential: *$${opportunity.potentialProfit.toFixed(2)}*\n\n` +
            `🏪 ${opportunity.sourceExchange} → ${opportunity.targetExchange}\n` +
            `💲 ${opportunity.sourcePrice.toFixed(2)} → ${opportunity.targetPrice.toFixed(2)}\n\n` +
            `${character.name}: _${characterMessage}_\n\n` +
            `⏰ Detected: ${new Date(opportunity.detectedAt).toLocaleTimeString()}`;
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📊 View Details', callback_data: `details_${opportunity.id}` },
                    { text: '📈 Track ' + opportunity.crypto, callback_data: `track_${opportunity.crypto}` }
                ],
                [
                    { text: '🎲 Place Bet', callback_data: `bet_${opportunity.id}` },
                    { text: '⚙️ Settings', callback_data: 'settings' }
                ]
            ]
        };
        
        // Send to all subscribed users
        const subscribedUsers = Array.from(this.userSubscriptions.keys());
        
        for (const userId of subscribedUsers) {
            try {
                await this.bot.sendMessage(userId, message, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });
            } catch (error) {
                console.error(`Failed to send alert to user ${userId}:`, error.message);
                // Remove user if they blocked the bot
                if (error.response?.body?.error_code === 403) {
                    this.userSubscriptions.delete(userId);
                }
            }
        }
        
        console.log(`📱 Sent Telegram arbitrage alert to ${subscribedUsers.length} users: ${opportunity.crypto} ${opportunity.profitPercentage.toFixed(2)}%`);
    }
    
    getRandomCharacter() {
        const characters = Array.from(this.characterPersonalities.values());
        return characters[Math.floor(Math.random() * characters.length)];
    }
    
    generateCharacterMessage(character, opportunity) {
        const messages = {
            conservative: [
                `This ${opportunity.profitPercentage.toFixed(1)}% spread looks solid and low-risk.`,
                `I've been tracking ${opportunity.crypto} - this opportunity has good fundamentals.`,
                `Careful analysis shows legitimate arbitrage with minimal risk.`
            ],
            aggressive: [
                `${opportunity.profitPercentage.toFixed(1)}% profit potential! Time to make moves! 🚀`,
                `This ${opportunity.crypto} arbitrage is printing money right now!`,
                `The spreads are WIDE open! This is what we've been waiting for!`
            ],
            analytical: [
                `Data confirms ${opportunity.profitPercentage.toFixed(1)}% arbitrage on ${opportunity.crypto}. Volume supports execution.`,
                `Cross-exchange differential indicates ${opportunity.crypto} arbitrage viability.`,
                `Market inefficiency detected: ${opportunity.sourceExchange} vs ${opportunity.targetExchange} spread.`
            ]
        };
        
        const styleMessages = messages[character.style] || messages.conservative;
        return styleMessages[Math.floor(Math.random() * styleMessages.length)];
    }
    
    async handleStartCommand(msg) {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name;
        
        const welcomeMessage = `🤖 Welcome to the Crypto Arbitrage Bot, ${firstName}!\n\n` +
            `I monitor crypto markets 24/7 and alert you to profitable arbitrage opportunities.\n\n` +
            `📊 *Currently monitoring:*\n` +
            `• Bitcoin (BTC)\n` +
            `• Ethereum (ETH)\n` +
            `• Monero (XMR)\n` +
            `• Solana (SOL)\n\n` +
            `🏪 *Exchanges:* Coinbase, Binance, Kraken\n` +
            `⚡ *Min Profit:* ${this.config.minProfitThreshold}%\n\n` +
            `Use /subscribe to start receiving alerts!\n` +
            `Use /help to see all available commands.`;
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🚨 Subscribe to Alerts', callback_data: 'subscribe_all' },
                    { text: '📊 Current Status', callback_data: 'status' }
                ],
                [
                    { text: '💰 View Prices', callback_data: 'prices' },
                    { text: '📈 Arbitrage Ops', callback_data: 'arbitrage' }
                ],
                [
                    { text: '❓ Help', callback_data: 'help' }
                ]
            ]
        };
        
        await this.bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }
    
    async handleStatusCommand(msg) {
        const chatId = msg.chat.id;
        
        try {
            const healthCheck = await axios.get(`${this.config.cryptoPlatformUrl}/api/health`);
            const data = healthCheck.data;
            
            const statusMessage = `🤖 *Crypto Bot Status*\n\n` +
                `📊 Price Sources: *${data.priceSourcesActive}*\n` +
                `🚨 Opportunities: *${data.arbitrageOpportunities}*\n` +
                `📈 Active Orders: *${data.activeOrders}*\n` +
                `🌐 Connections: *${data.activeConnections}*\n` +
                `⚡ Min Threshold: *${this.config.minProfitThreshold}%*\n` +
                `🎭 AI Characters: *${this.characterPersonalities.size}*\n\n` +
                `👥 Subscribed Users: *${this.userSubscriptions.size}*\n` +
                `📱 Your Subscription: ${this.userSubscriptions.has(chatId) ? '*Active* ✅' : '*Inactive* ❌'}\n\n` +
                `🕒 Last Update: ${new Date().toLocaleTimeString()}`;
            
            await this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            await this.bot.sendMessage(chatId, '❌ Error fetching status: ' + error.message);
        }
    }
    
    async handlePricesCommand(msg, crypto = null) {
        const chatId = msg.chat.id;
        
        try {
            const response = await axios.get(`${this.config.cryptoPlatformUrl}/api/prices`, {
                params: crypto ? { crypto } : {}
            });
            
            const prices = response.data;
            let message = crypto ? `💰 *${crypto} Prices*\n\n` : '💰 *Current Crypto Prices*\n\n';
            
            for (const [key, data] of Object.entries(prices)) {
                message += `${this.getCryptoEmoji(data.crypto)} *${data.crypto}* - ${data.exchange}\n`;
                message += `💵 $${data.price.toFixed(2)}\n`;
                message += `📊 Vol: ${data.volume ? data.volume.toLocaleString() : 'N/A'}\n\n`;
            }
            
            message += `🕒 Updated: ${new Date().toLocaleTimeString()}`;
            
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '🔄 Refresh', callback_data: crypto ? `prices_${crypto}` : 'prices' },
                        { text: '📈 Arbitrage', callback_data: 'arbitrage' }
                    ]
                ]
            };
            
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        } catch (error) {
            await this.bot.sendMessage(chatId, '❌ Error fetching prices: ' + error.message);
        }
    }
    
    getCryptoEmoji(crypto) {
        const emojis = {
            BTC: '₿',
            ETH: 'Ξ',
            XMR: '🔒',
            SOL: '☀️'
        };
        return emojis[crypto] || '💎';
    }
    
    async handleArbitrageCommand(msg) {
        const chatId = msg.chat.id;
        
        try {
            const response = await axios.get(`${this.config.cryptoPlatformUrl}/api/arbitrage`);
            const opportunities = response.data;
            
            if (opportunities.length === 0) {
                await this.bot.sendMessage(chatId, '📊 No active arbitrage opportunities found.\n\nI\'ll alert you when profitable opportunities appear!');
                return;
            }
            
            let message = '📈 *Current Arbitrage Opportunities*\n\n';
            
            opportunities.slice(0, 5).forEach((opp, index) => {
                message += `${index + 1}. ${this.getCryptoEmoji(opp.crypto_symbol)} *${opp.crypto_symbol}*\n`;
                message += `💰 Profit: *${opp.profit_percentage.toFixed(2)}%*\n`;
                message += `🏪 ${opp.source_exchange} → ${opp.target_exchange}\n`;
                message += `💲 $${opp.source_price.toFixed(2)} → $${opp.target_price.toFixed(2)}\n\n`;
            });
            
            if (opportunities.length > 5) {
                message += `... and ${opportunities.length - 5} more opportunities`;
            }
            
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '🔄 Refresh', callback_data: 'arbitrage' },
                        { text: '🚨 Subscribe', callback_data: 'subscribe_all' }
                    ]
                ]
            };
            
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        } catch (error) {
            await this.bot.sendMessage(chatId, '❌ Error fetching arbitrage data: ' + error.message);
        }
    }
    
    async handleSubscribeCommand(msg, type = 'all') {
        const chatId = msg.chat.id;
        
        this.userSubscriptions.set(chatId, {
            userId: chatId,
            firstName: msg.from.first_name,
            subscribedAt: Date.now(),
            alertTypes: [type],
            minProfitThreshold: this.config.minProfitThreshold
        });
        
        const message = `✅ *Subscription Active!*\n\n` +
            `You'll now receive alerts for:\n` +
            `🚨 Arbitrage opportunities (>${this.config.minProfitThreshold}%)\n` +
            `📈 Significant price movements\n` +
            `💰 Trading updates\n\n` +
            `Use /settings to customize your alerts\n` +
            `Use /unsubscribe to stop alerts`;
        
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        
        console.log(`📱 New Telegram subscription: ${msg.from.first_name} (${chatId})`);
    }
    
    async handleUnsubscribeCommand(msg) {
        const chatId = msg.chat.id;
        
        if (this.userSubscriptions.has(chatId)) {
            this.userSubscriptions.delete(chatId);
            await this.bot.sendMessage(chatId, '❌ *Unsubscribed*\n\nYou will no longer receive arbitrage alerts.\n\nUse /subscribe to reactivate.', { parse_mode: 'Markdown' });
        } else {
            await this.bot.sendMessage(chatId, '❌ You are not currently subscribed to alerts.\n\nUse /subscribe to start receiving alerts.');
        }
    }
    
    async handleSettingsCommand(msg) {
        const chatId = msg.chat.id;
        
        const subscription = this.userSubscriptions.get(chatId);
        const currentThreshold = subscription?.minProfitThreshold || this.config.minProfitThreshold;
        
        const message = `⚙️ *Alert Settings*\n\n` +
            `Current minimum profit threshold: *${currentThreshold}%*\n\n` +
            `Choose a new threshold:`;
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '1%', callback_data: 'threshold_1' },
                    { text: '2%', callback_data: 'threshold_2' },
                    { text: '3%', callback_data: 'threshold_3' }
                ],
                [
                    { text: '5%', callback_data: 'threshold_5' },
                    { text: '10%', callback_data: 'threshold_10' },
                    { text: '15%', callback_data: 'threshold_15' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'main_menu' }
                ]
            ]
        };
        
        await this.bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }
    
    async handleCharacterCommand(msg, characterName) {
        const chatId = msg.chat.id;
        
        if (!characterName) {
            // Show all characters
            let message = '🎭 *AI Trading Characters*\n\n';
            
            for (const character of this.characterPersonalities.values()) {
                message += `${character.name}\n`;
                message += `📊 Style: ${character.style}\n`;
                message += `🎯 Focus: ${character.specialization}\n\n`;
            }
            
            message += 'Use `/character [name]` to interact with a specific character.';
            
            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else {
            // Interactive character conversation
            await this.startCharacterConversation(chatId, characterName);
        }
    }
    
    async startCharacterConversation(chatId, characterName) {
        const character = Array.from(this.characterPersonalities.values())
            .find(c => c.name.toLowerCase().includes(characterName.toLowerCase()));
        
        if (!character) {
            await this.bot.sendMessage(chatId, '❌ Character not found. Use /character to see available characters.');
            return;
        }
        
        this.conversationStates.set(chatId, {
            type: 'character_chat',
            character: character,
            startedAt: Date.now()
        });
        
        const message = `🎭 *Chat with ${character.name}*\n\n` +
            `Hi! I'm ${character.name}, your ${character.style} trading advisor.\n` +
            `I specialize in ${character.specialization}.\n\n` +
            `Ask me anything about crypto markets, trading strategies, or current opportunities!\n\n` +
            `Type 'exit' to end our conversation.`;
        
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    
    async handleConversationMessage(msg) {
        const chatId = msg.chat.id;
        const state = this.conversationStates.get(chatId);
        
        if (!state) return;
        
        if (msg.text.toLowerCase() === 'exit') {
            this.conversationStates.delete(chatId);
            await this.bot.sendMessage(chatId, '👋 Conversation ended. Use /character to chat again!');
            return;
        }
        
        if (state.type === 'character_chat') {
            await this.handleCharacterChat(chatId, msg.text, state.character);
        }
    }
    
    async handleCharacterChat(chatId, userMessage, character) {
        // Generate character response based on personality
        const responses = {
            conservative: [
                "Let me analyze that carefully. Based on my conservative approach, I'd recommend...",
                "That's an interesting question. From a risk management perspective...",
                "I always prefer steady, reliable opportunities over risky plays..."
            ],
            aggressive: [
                "YES! Now you're thinking like a trader! 🚀",
                "I love the energy! Let's find some high-profit opportunities!",
                "Bold moves make bold profits! Here's what I'm seeing..."
            ],
            analytical: [
                "Analyzing the data... Your query requires examination of multiple factors.",
                "Based on technical indicators and market analysis...",
                "Let me break down the mathematics behind this opportunity..."
            ]
        };
        
        const styleResponses = responses[character.style] || responses.conservative;
        const response = styleResponses[Math.floor(Math.random() * styleResponses.length)];
        
        const message = `${character.name}: ${response}\n\n` +
            `💡 *Current market insight:* The crypto markets are showing ${character.specialization} patterns right now.\n\n` +
            `What else would you like to know?`;
        
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    
    async handleHelpCommand(msg) {
        const chatId = msg.chat.id;
        
        const helpMessage = `🤖 *Crypto Arbitrage Bot Help*\n\n` +
            `*Commands:*\n` +
            `/start - Welcome message and setup\n` +
            `/status - Show bot and platform status\n` +
            `/prices [BTC|ETH|XMR|SOL] - Current prices\n` +
            `/arbitrage - Current opportunities\n` +
            `/subscribe - Subscribe to alerts\n` +
            `/unsubscribe - Stop alerts\n` +
            `/settings - Configure alert settings\n` +
            `/character [name] - Chat with AI characters\n` +
            `/help - This help message\n\n` +
            `*Features:*\n` +
            `🚨 Real-time arbitrage alerts\n` +
            `📈 Price movement notifications\n` +
            `🎭 AI character trading advice\n` +
            `⚙️ Customizable alert thresholds\n` +
            `📱 Mobile-optimized interface\n\n` +
            `*Monitored Cryptos:* BTC, ETH, XMR, SOL\n` +
            `*Exchanges:* Coinbase, Binance, Kraken`;
        
        await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    }
    
    async handleCallbackQuery(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;
        
        // Answer callback query to remove loading state
        await this.bot.answerCallbackQuery(callbackQuery.id);
        
        if (data === 'subscribe_all') {
            await this.handleSubscribeCommand({ chat: { id: chatId }, from: callbackQuery.from }, 'all');
        } else if (data === 'status') {
            await this.handleStatusCommand({ chat: { id: chatId } });
        } else if (data === 'prices') {
            await this.handlePricesCommand({ chat: { id: chatId } });
        } else if (data.startsWith('prices_')) {
            const crypto = data.replace('prices_', '');
            await this.handlePricesCommand({ chat: { id: chatId } }, crypto);
        } else if (data === 'arbitrage') {
            await this.handleArbitrageCommand({ chat: { id: chatId } });
        } else if (data === 'help') {
            await this.handleHelpCommand({ chat: { id: chatId } });
        } else if (data.startsWith('threshold_')) {
            const threshold = parseFloat(data.replace('threshold_', ''));
            await this.updateUserThreshold(chatId, threshold);
        } else if (data.startsWith('track_')) {
            const crypto = data.replace('track_', '');
            await this.enableCryptoTracking(chatId, crypto);
        } else if (data.startsWith('bet_')) {
            const opportunityId = data.replace('bet_', '');
            await this.handleBetPlacement(chatId, opportunityId);
        } else if (data.startsWith('details_')) {
            const opportunityId = data.replace('details_', '');
            await this.showOpportunityDetails(chatId, opportunityId);
        }
    }
    
    async updateUserThreshold(chatId, threshold) {
        if (this.userSubscriptions.has(chatId)) {
            const subscription = this.userSubscriptions.get(chatId);
            subscription.minProfitThreshold = threshold;
            this.userSubscriptions.set(chatId, subscription);
        }
        
        await this.bot.sendMessage(chatId, `✅ Alert threshold updated to ${threshold}%\n\nYou'll now receive alerts for arbitrage opportunities with ${threshold}% or higher profit potential.`);
    }
    
    async enableCryptoTracking(chatId, crypto) {
        await this.bot.sendMessage(chatId, `✅ Now tracking ${crypto}!\n\nYou'll receive priority alerts for ${crypto} arbitrage opportunities and price movements.`);
    }
    
    async handleBetPlacement(chatId, opportunityId) {
        await this.bot.sendMessage(chatId, `🎲 *Betting Interface*\n\nOpportunity ID: ${opportunityId}\n\n` +
            `This will integrate with your existing betting system to:\n` +
            `• Show current odds\n` +
            `• Allow bet placement\n` +
            `• Track bet outcomes\n` +
            `• Handle payouts\n\n` +
            `Feature coming soon!`, { parse_mode: 'Markdown' });
    }
    
    async showOpportunityDetails(chatId, opportunityId) {
        await this.bot.sendMessage(chatId, `📊 *Opportunity Analysis*\n\nID: ${opportunityId}\n\n` +
            `This will show:\n` +
            `• Detailed price analysis\n` +
            `• Historical spread data\n` +
            `• Risk assessment\n` +
            `• Execution recommendations\n` +
            `• Market depth analysis\n\n` +
            `Feature coming soon!`, { parse_mode: 'Markdown' });
    }
}

// Export for use as module
module.exports = TelegramArbitrageBot;

// Run if called directly
if (require.main === module) {
    const bot = new TelegramArbitrageBot();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Telegram Arbitrage Bot...');
        if (bot.bot) {
            bot.bot.stopPolling();
        }
        process.exit(0);
    });
}
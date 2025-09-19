#!/usr/bin/env node

/**
 * 💰🔄 UNIFIED REAL-TIME ECONOMY SYSTEM
 * Connects all token systems across services with real-time trading
 * 
 * Features:
 * - Real-time marketplace with WebSocket updates
 * - Cross-service economy bridge
 * - Theme/skin marketplace
 * - Energy and resource trading
 * - Team treasuries and shared economies
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');

class UnifiedEconomySystem extends EventEmitter {
    constructor() {
        super();
        
        // Token types registry
        this.tokenTypes = {
            'FART': {
                name: 'FART Token',
                symbol: 'FART',
                decimals: 2,
                exchangeRate: 1.0,
                supply: 0,
                minted: 0,
                burned: 0,
                icon: '💨'
            },
            'database_token': {
                name: 'Database Token',
                symbol: 'DBT',
                decimals: 0,
                exchangeRate: 0.01,
                supply: 1000000,
                minted: 0,
                burned: 0,
                icon: '🗄️'
            },
            'agent_coin': {
                name: 'Agent Coin',
                symbol: 'AGT',
                decimals: 3,
                exchangeRate: 0.05,
                supply: 500000,
                minted: 0,
                burned: 0,
                icon: '🤖'
            },
            'vibes_coin': {
                name: 'Vibes Coin',
                symbol: 'VIB',
                decimals: 2,
                exchangeRate: 0.10,
                supply: 250000,
                minted: 0,
                burned: 0,
                icon: '✨'
            },
            'meme_token': {
                name: 'Meme Token',
                symbol: 'MEME',
                decimals: 0,
                exchangeRate: 0.25,
                supply: 100000,
                minted: 0,
                burned: 0,
                icon: '🎭'
            },
            'energy': {
                name: 'Energy Points',
                symbol: 'NRG',
                decimals: 0,
                exchangeRate: 0,
                supply: Infinity,
                minted: 0,
                burned: 0,
                icon: '⚡'
            }
        };
        
        // User wallets
        this.wallets = new Map(); // userId -> { tokenType -> balance }
        
        // Team treasuries
        this.treasuries = new Map(); // teamId -> { tokenType -> balance }
        
        // Marketplace
        this.marketplace = {
            orders: new Map(), // orderId -> order
            orderBook: {
                buy: new Map(), // tokenPair -> price -> orders[]
                sell: new Map() // tokenPair -> price -> orders[]
            },
            trades: [], // Historical trades
            themes: new Map(), // themeId -> theme listing
            skins: new Map() // skinId -> skin listing
        };
        
        // Exchange rates and liquidity pools
        this.liquidityPools = new Map(); // tokenPair -> { token1Amount, token2Amount }
        this.exchangeRates = new Map(); // tokenPair -> rate
        
        // Transaction history
        this.transactions = [];
        this.pendingTransactions = new Map();
        
        // Real-time connections
        this.connections = new Map(); // userId -> WebSocket
        
        // Economy metrics
        this.metrics = {
            totalVolume24h: 0,
            totalTrades24h: 0,
            activeUsers: 0,
            marketCap: 0,
            liquidityTotal: 0
        };
        
        // Service integrations
        this.serviceBalances = new Map(); // serviceId -> { tokenType -> balance }
        
        // Economy rules
        this.rules = {
            maxOrderSize: 1000000,
            minOrderSize: 1,
            makerFee: 0.001, // 0.1%
            takerFee: 0.002, // 0.2%
            transferFee: 0.0005, // 0.05%
            dailyMintLimit: 10000,
            burnRequirement: 0.1 // 10% burn on certain actions
        };
        
        console.log('💰 Unified Economy System initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Connect to multiplayer hub
        await this.connectToHub();
        
        // Initialize default liquidity pools
        this.initializeLiquidityPools();
        
        // Start market maker
        this.startMarketMaker();
        
        // Start metrics collection
        this.startMetricsCollection();
        
        console.log('✅ Economy system ready');
        console.log('📊 Token types:', Object.keys(this.tokenTypes).join(', '));
        console.log('💱 Exchange pairs available');
    }
    
    async connectToHub() {
        try {
            this.hubConnection = new WebSocket('ws://localhost:8888');
            
            this.hubConnection.on('open', () => {
                console.log('🔗 Connected to Multiplayer Hub');
                
                // Authenticate as economy service
                this.hubConnection.send(JSON.stringify({
                    type: 'authenticate',
                    serviceId: 'unified-economy',
                    features: ['trading', 'wallets', 'marketplace', 'themes']
                }));
            });
            
            this.hubConnection.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleHubMessage(message);
            });
            
            this.hubConnection.on('error', (error) => {
                console.error('Hub connection error:', error);
            });
        } catch (error) {
            console.error('Failed to connect to hub:', error);
            // Retry after 5 seconds
            setTimeout(() => this.connectToHub(), 5000);
        }
    }
    
    initializeLiquidityPools() {
        // Create default liquidity pools
        const pools = [
            { pair: 'FART/DBT', token1: 10000, token2: 1000000 },
            { pair: 'AGT/VIB', token1: 5000, token2: 2500 },
            { pair: 'MEME/FART', token1: 1000, token2: 4000 },
            { pair: 'DBT/AGT', token1: 100000, token2: 2000 },
            { pair: 'VIB/MEME', token1: 2500, token2: 1000 }
        ];
        
        pools.forEach(({ pair, token1, token2 }) => {
            this.liquidityPools.set(pair, {
                token1Amount: token1,
                token2Amount: token2,
                kConstant: token1 * token2
            });
            
            // Calculate initial exchange rate
            this.updateExchangeRate(pair);
        });
    }
    
    // Wallet Management
    async createWallet(userId) {
        if (!this.wallets.has(userId)) {
            const wallet = {};
            
            // Initialize with zero balance for all tokens
            Object.keys(this.tokenTypes).forEach(token => {
                wallet[token] = 0;
            });
            
            // Give new users some starter tokens
            wallet.FART = 100;
            wallet.database_token = 1000;
            wallet.energy = 200;
            
            this.wallets.set(userId, wallet);
            
            this.emit('wallet-created', { userId, wallet });
            
            // Notify via hub
            this.broadcastUpdate({
                type: 'wallet-created',
                userId,
                balances: wallet
            });
            
            return wallet;
        }
        
        return this.wallets.get(userId);
    }
    
    async getBalance(userId, tokenType = null) {
        const wallet = this.wallets.get(userId) || await this.createWallet(userId);
        
        if (tokenType) {
            return wallet[tokenType] || 0;
        }
        
        return wallet;
    }
    
    async transfer(fromUserId, toUserId, tokenType, amount) {
        // Validate inputs
        if (!this.tokenTypes[tokenType]) {
            throw new Error(`Invalid token type: ${tokenType}`);
        }
        
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        
        // Get wallets
        const fromWallet = await this.getBalance(fromUserId);
        const toWallet = await this.getBalance(toUserId);
        
        // Calculate fee
        const fee = amount * this.rules.transferFee;
        const totalRequired = amount + fee;
        
        // Check balance
        if (fromWallet[tokenType] < totalRequired) {
            throw new Error('Insufficient balance');
        }
        
        // Create transaction
        const transactionId = crypto.randomUUID();
        const transaction = {
            id: transactionId,
            type: 'transfer',
            from: fromUserId,
            to: toUserId,
            tokenType,
            amount,
            fee,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        this.pendingTransactions.set(transactionId, transaction);
        
        try {
            // Execute transfer
            fromWallet[tokenType] -= totalRequired;
            toWallet[tokenType] += amount;
            
            // Fee goes to liquidity pool
            this.addToTreasury('system', tokenType, fee);
            
            // Update transaction status
            transaction.status = 'completed';
            this.transactions.push(transaction);
            this.pendingTransactions.delete(transactionId);
            
            // Emit events
            this.emit('transfer', transaction);
            
            // Broadcast update
            this.broadcastUpdate({
                type: 'transfer-completed',
                transaction,
                balances: {
                    [fromUserId]: fromWallet,
                    [toUserId]: toWallet
                }
            });
            
            return transaction;
        } catch (error) {
            transaction.status = 'failed';
            transaction.error = error.message;
            this.pendingTransactions.delete(transactionId);
            throw error;
        }
    }
    
    // Trading Functions
    async createOrder(userId, orderType, tokenPair, side, price, amount) {
        const [baseToken, quoteToken] = tokenPair.split('/');
        
        // Validate tokens
        if (!this.tokenTypes[baseToken] || !this.tokenTypes[quoteToken]) {
            throw new Error('Invalid token pair');
        }
        
        // Check balance
        const wallet = await this.getBalance(userId);
        if (side === 'buy') {
            const required = price * amount;
            if (wallet[quoteToken] < required) {
                throw new Error(`Insufficient ${quoteToken} balance`);
            }
        } else {
            if (wallet[baseToken] < amount) {
                throw new Error(`Insufficient ${baseToken} balance`);
            }
        }
        
        // Create order
        const orderId = crypto.randomUUID();
        const order = {
            id: orderId,
            userId,
            type: orderType, // 'market' or 'limit'
            pair: tokenPair,
            side, // 'buy' or 'sell'
            price,
            amount,
            filled: 0,
            remaining: amount,
            status: 'open',
            timestamp: Date.now()
        };
        
        this.marketplace.orders.set(orderId, order);
        
        // Add to order book if limit order
        if (orderType === 'limit') {
            const book = side === 'buy' ? 
                this.marketplace.orderBook.buy : 
                this.marketplace.orderBook.sell;
            
            if (!book.has(tokenPair)) {
                book.set(tokenPair, new Map());
            }
            
            const pairBook = book.get(tokenPair);
            if (!pairBook.has(price)) {
                pairBook.set(price, []);
            }
            
            pairBook.get(price).push(order);
        }
        
        // Try to match order
        await this.matchOrder(order);
        
        // Broadcast order update
        this.broadcastUpdate({
            type: 'order-created',
            order,
            orderBook: this.getOrderBook(tokenPair)
        });
        
        return order;
    }
    
    async matchOrder(order) {
        const [baseToken, quoteToken] = order.pair.split('/');
        const oppositeBook = order.side === 'buy' ? 
            this.marketplace.orderBook.sell : 
            this.marketplace.orderBook.buy;
        
        if (!oppositeBook.has(order.pair)) return;
        
        const pairBook = oppositeBook.get(order.pair);
        const sortedPrices = Array.from(pairBook.keys()).sort((a, b) => 
            order.side === 'buy' ? a - b : b - a
        );
        
        for (const price of sortedPrices) {
            if (order.remaining === 0) break;
            
            // Check if price matches (for limit orders)
            if (order.type === 'limit') {
                if (order.side === 'buy' && price > order.price) break;
                if (order.side === 'sell' && price < order.price) break;
            }
            
            const orders = pairBook.get(price);
            for (let i = 0; i < orders.length; i++) {
                const matchOrder = orders[i];
                if (matchOrder.status !== 'open') continue;
                
                // Calculate match amount
                const matchAmount = Math.min(order.remaining, matchOrder.remaining);
                
                // Execute trade
                await this.executeTrade(order, matchOrder, price, matchAmount);
                
                // Remove filled orders
                if (matchOrder.remaining === 0) {
                    matchOrder.status = 'filled';
                    orders.splice(i, 1);
                    i--;
                }
                
                if (order.remaining === 0) {
                    order.status = 'filled';
                    break;
                }
            }
            
            // Clean up empty price levels
            if (orders.length === 0) {
                pairBook.delete(price);
            }
        }
        
        // Update order status
        if (order.remaining > 0 && order.remaining < order.amount) {
            order.status = 'partial';
        }
    }
    
    async executeTrade(buyOrder, sellOrder, price, amount) {
        const [baseToken, quoteToken] = buyOrder.pair.split('/');
        const buyer = buyOrder.userId;
        const seller = sellOrder.userId;
        
        // Get wallets
        const buyerWallet = this.wallets.get(buyer);
        const sellerWallet = this.wallets.get(seller);
        
        // Calculate amounts
        const baseAmount = amount;
        const quoteAmount = amount * price;
        
        // Calculate fees
        const buyerFee = quoteAmount * this.rules.takerFee;
        const sellerFee = baseAmount * this.rules.makerFee;
        
        // Execute trade
        buyerWallet[quoteToken] -= (quoteAmount + buyerFee);
        buyerWallet[baseToken] += baseAmount;
        
        sellerWallet[baseToken] -= (baseAmount + sellerFee);
        sellerWallet[quoteToken] += quoteAmount;
        
        // Update order fills
        buyOrder.filled += amount;
        buyOrder.remaining -= amount;
        sellOrder.filled += amount;
        sellOrder.remaining -= amount;
        
        // Record trade
        const trade = {
            id: crypto.randomUUID(),
            buyOrderId: buyOrder.id,
            sellOrderId: sellOrder.id,
            pair: buyOrder.pair,
            price,
            amount,
            buyer,
            seller,
            buyerFee,
            sellerFee,
            timestamp: Date.now()
        };
        
        this.marketplace.trades.push(trade);
        
        // Update metrics
        this.metrics.totalVolume24h += quoteAmount;
        this.metrics.totalTrades24h++;
        
        // Emit trade event
        this.emit('trade', trade);
        
        // Broadcast trade
        this.broadcastUpdate({
            type: 'trade-executed',
            trade,
            orderBook: this.getOrderBook(buyOrder.pair)
        });
        
        return trade;
    }
    
    // Theme/Skin Marketplace
    async listTheme(userId, theme) {
        const themeId = crypto.randomUUID();
        const listing = {
            id: themeId,
            sellerId: userId,
            name: theme.name,
            description: theme.description,
            preview: theme.preview,
            price: theme.price,
            currency: theme.currency || 'FART',
            category: theme.category,
            tags: theme.tags || [],
            downloads: 0,
            rating: 0,
            reviews: [],
            listed: Date.now(),
            active: true
        };
        
        this.marketplace.themes.set(themeId, listing);
        
        // Broadcast new listing
        this.broadcastUpdate({
            type: 'theme-listed',
            theme: listing
        });
        
        return listing;
    }
    
    async purchaseTheme(userId, themeId) {
        const theme = this.marketplace.themes.get(themeId);
        if (!theme || !theme.active) {
            throw new Error('Theme not found or inactive');
        }
        
        // Execute purchase
        await this.transfer(userId, theme.sellerId, theme.currency, theme.price);
        
        // Update theme stats
        theme.downloads++;
        
        // Grant theme access to buyer
        const purchase = {
            id: crypto.randomUUID(),
            userId,
            themeId,
            price: theme.price,
            currency: theme.currency,
            timestamp: Date.now()
        };
        
        // Emit purchase event
        this.emit('theme-purchased', purchase);
        
        // Broadcast update
        this.broadcastUpdate({
            type: 'theme-purchased',
            purchase,
            theme
        });
        
        return purchase;
    }
    
    // Liquidity Pool Functions
    async addLiquidity(userId, tokenPair, token1Amount, token2Amount) {
        const pool = this.liquidityPools.get(tokenPair);
        if (!pool) {
            throw new Error('Liquidity pool not found');
        }
        
        const [token1, token2] = tokenPair.split('/');
        const wallet = this.wallets.get(userId);
        
        // Check balances
        if (wallet[token1] < token1Amount || wallet[token2] < token2Amount) {
            throw new Error('Insufficient balance');
        }
        
        // Add liquidity
        wallet[token1] -= token1Amount;
        wallet[token2] -= token2Amount;
        pool.token1Amount += token1Amount;
        pool.token2Amount += token2Amount;
        pool.kConstant = pool.token1Amount * pool.token2Amount;
        
        // Update exchange rate
        this.updateExchangeRate(tokenPair);
        
        // Mint LP tokens (simplified)
        const lpTokens = Math.sqrt(token1Amount * token2Amount);
        wallet[`${tokenPair}_LP`] = (wallet[`${tokenPair}_LP`] || 0) + lpTokens;
        
        // Broadcast update
        this.broadcastUpdate({
            type: 'liquidity-added',
            userId,
            tokenPair,
            amounts: { token1: token1Amount, token2: token2Amount },
            lpTokens
        });
        
        return { lpTokens, pool };
    }
    
    updateExchangeRate(tokenPair) {
        const pool = this.liquidityPools.get(tokenPair);
        if (!pool) return;
        
        const rate = pool.token2Amount / pool.token1Amount;
        this.exchangeRates.set(tokenPair, rate);
        
        // Also set reverse pair
        const [token1, token2] = tokenPair.split('/');
        this.exchangeRates.set(`${token2}/${token1}`, 1 / rate);
    }
    
    // Market Making
    startMarketMaker() {
        // Simple market maker to provide liquidity
        setInterval(() => {
            const pairs = ['FART/DBT', 'AGT/VIB', 'MEME/FART'];
            
            pairs.forEach(pair => {
                const rate = this.exchangeRates.get(pair) || 1;
                const spread = 0.01; // 1% spread
                
                // Create buy and sell orders around current rate
                const systemUserId = 'market-maker';
                
                // Ensure market maker has balance
                if (!this.wallets.has(systemUserId)) {
                    const wallet = {};
                    Object.keys(this.tokenTypes).forEach(token => {
                        wallet[token] = 1000000; // Infinite balance for market maker
                    });
                    this.wallets.set(systemUserId, wallet);
                }
                
                // Place orders
                this.createOrder(systemUserId, 'limit', pair, 'buy', 
                    rate * (1 - spread), 100).catch(() => {});
                this.createOrder(systemUserId, 'limit', pair, 'sell', 
                    rate * (1 + spread), 100).catch(() => {});
            });
        }, 10000); // Every 10 seconds
    }
    
    // Team Treasury Functions
    async createTreasury(teamId) {
        if (!this.treasuries.has(teamId)) {
            const treasury = {};
            Object.keys(this.tokenTypes).forEach(token => {
                treasury[token] = 0;
            });
            
            this.treasuries.set(teamId, treasury);
            
            this.emit('treasury-created', { teamId, treasury });
            
            return treasury;
        }
        
        return this.treasuries.get(teamId);
    }
    
    async addToTreasury(teamId, tokenType, amount) {
        const treasury = this.treasuries.get(teamId) || await this.createTreasury(teamId);
        treasury[tokenType] = (treasury[tokenType] || 0) + amount;
        
        this.emit('treasury-updated', { teamId, tokenType, amount, balance: treasury[tokenType] });
    }
    
    // Utility Functions
    getOrderBook(tokenPair) {
        const buyOrders = [];
        const sellOrders = [];
        
        // Collect buy orders
        const buyBook = this.marketplace.orderBook.buy.get(tokenPair);
        if (buyBook) {
            buyBook.forEach((orders, price) => {
                const totalAmount = orders.reduce((sum, order) => 
                    sum + order.remaining, 0);
                buyOrders.push({ price, amount: totalAmount });
            });
        }
        
        // Collect sell orders
        const sellBook = this.marketplace.orderBook.sell.get(tokenPair);
        if (sellBook) {
            sellBook.forEach((orders, price) => {
                const totalAmount = orders.reduce((sum, order) => 
                    sum + order.remaining, 0);
                sellOrders.push({ price, amount: totalAmount });
            });
        }
        
        return {
            bids: buyOrders.sort((a, b) => b.price - a.price),
            asks: sellOrders.sort((a, b) => a.price - b.price)
        };
    }
    
    startMetricsCollection() {
        setInterval(() => {
            // Calculate market cap
            this.metrics.marketCap = 0;
            Object.entries(this.tokenTypes).forEach(([token, info]) => {
                if (token !== 'energy') {
                    const totalSupply = info.supply + info.minted - info.burned;
                    const value = totalSupply * info.exchangeRate;
                    this.metrics.marketCap += value;
                }
            });
            
            // Calculate total liquidity
            this.metrics.liquidityTotal = 0;
            this.liquidityPools.forEach((pool, pair) => {
                const [token1, token2] = pair.split('/');
                const value1 = pool.token1Amount * this.tokenTypes[token1].exchangeRate;
                const value2 = pool.token2Amount * this.tokenTypes[token2].exchangeRate;
                this.metrics.liquidityTotal += value1 + value2;
            });
            
            // Count active users
            this.metrics.activeUsers = this.wallets.size;
            
            // Broadcast metrics
            this.broadcastUpdate({
                type: 'metrics-update',
                metrics: this.metrics
            });
        }, 5000); // Every 5 seconds
    }
    
    handleHubMessage(message) {
        switch (message.type) {
            case 'cross-service-request':
                this.handleCrossServiceRequest(message);
                break;
                
            case 'user-connected':
                // Create wallet for new user if needed
                this.createWallet(message.userId);
                break;
        }
    }
    
    async handleCrossServiceRequest(message) {
        const { request, requestId, from } = message;
        
        try {
            let response;
            
            switch (request.action) {
                case 'get-balance':
                    response = await this.getBalance(request.userId, request.tokenType);
                    break;
                    
                case 'transfer':
                    response = await this.transfer(
                        request.from, 
                        request.to, 
                        request.tokenType, 
                        request.amount
                    );
                    break;
                    
                case 'create-order':
                    response = await this.createOrder(
                        request.userId,
                        request.orderType,
                        request.tokenPair,
                        request.side,
                        request.price,
                        request.amount
                    );
                    break;
                    
                case 'get-market-data':
                    response = {
                        orderBook: this.getOrderBook(request.tokenPair),
                        exchangeRate: this.exchangeRates.get(request.tokenPair),
                        recentTrades: this.marketplace.trades
                            .filter(t => t.pair === request.tokenPair)
                            .slice(-20)
                    };
                    break;
            }
            
            // Send response back through hub
            this.hubConnection.send(JSON.stringify({
                type: 'cross-service-response',
                requestId,
                success: true,
                data: response
            }));
        } catch (error) {
            this.hubConnection.send(JSON.stringify({
                type: 'cross-service-response',
                requestId,
                success: false,
                error: error.message
            }));
        }
    }
    
    broadcastUpdate(update) {
        if (this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN) {
            this.hubConnection.send(JSON.stringify({
                type: 'service-broadcast',
                service: 'unified-economy',
                data: update
            }));
        }
    }
    
    // API for direct integration
    getAPI() {
        return {
            createWallet: this.createWallet.bind(this),
            getBalance: this.getBalance.bind(this),
            transfer: this.transfer.bind(this),
            createOrder: this.createOrder.bind(this),
            listTheme: this.listTheme.bind(this),
            purchaseTheme: this.purchaseTheme.bind(this),
            addLiquidity: this.addLiquidity.bind(this),
            getOrderBook: this.getOrderBook.bind(this),
            getMetrics: () => this.metrics,
            getExchangeRate: (pair) => this.exchangeRates.get(pair)
        };
    }
}

// Export the class
module.exports = UnifiedEconomySystem;

// Start the system if run directly
if (require.main === module) {
    const economy = new UnifiedEconomySystem();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n💰 Shutting down Economy System...');
        process.exit(0);
    });
}
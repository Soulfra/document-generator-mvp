#!/usr/bin/env node

/**
 * 🏦 RUNESCAPE-STYLE BANK TABS SYSTEM 🏦
 * Organizes content, memes, and digital items like a RuneScape bank
 * Integrates with payment systems and cultural references
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class RuneScapeBankTabsSystem extends EventEmitter {
    constructor() {
        super();
        
        // Bank structure
        this.tabs = new Map();
        this.items = new Map();
        this.presets = new Map();
        this.searchIndex = new Map();
        
        // Bank configuration
        this.config = {
            maxTabs: 10,
            maxItemsPerTab: 816, // RuneScape bank size
            maxStackSize: 2147483647, // Max int in RS
            defaultTabs: ['All', 'Gear', 'Food', 'Skills', 'Memes', 'Premium'],
            tabCycleOrder: ['Gear', 'Food', 'Skills', 'Potions', 'Seeds', 'Herbs', 'Memes'],
            anniversaryMode: false
        };
        
        // User data
        this.userData = {
            username: null,
            rsNames: ['put', 'fury'], // User's old RS names
            bankPin: null,
            membershipLevel: 'free', // free, premium, anniversary
            bankCapacity: 400,
            unlockedTabs: 5,
            customTabs: []
        };
        
        // Cultural references
        this.culturalOverlaps = {
            onePiece: ['straw_hat', 'devil_fruit', 'grand_line', 'nakama'],
            runescape: ['party_hat', 'twisted_bow', 'max_cape', 'fire_cape'],
            memes: ['pepe', 'wojak', 'doge', 'chad'],
            knowYourMeme: ['origin', 'spread', 'examples', 'search_interest']
        };
        
        // Payment integration
        this.paymentConfig = {
            stripeEnabled: true,
            premiumPrice: 499, // $4.99 in cents
            anniversaryPrice: 2500, // $25.00 special edition
            acceptedCards: ['visa', 'mastercard', 'amex'],
            features: {
                free: { tabs: 5, capacity: 400 },
                premium: { tabs: 10, capacity: 816 },
                anniversary: { tabs: 15, capacity: 1000, special: true }
            }
        };
        
        this.initializeBankSystem();
        this.initializeDefaultTabs();
        this.initializeCategorization();
        this.initializeSpecialItems();
        
        console.log('🏦 RUNESCAPE BANK TABS SYSTEM INITIALIZED');
        console.log('📦 Ready to organize your digital inventory');
    }
    
    initializeBankSystem() {
        // Create default tab structure
        this.tabStructure = {
            'All': {
                id: 'tab_all',
                name: 'All',
                icon: '🏦',
                description: 'View all items',
                items: [],
                locked: false,
                order: 0
            },
            'Gear': {
                id: 'tab_gear',
                name: 'Gear',
                icon: '⚔️',
                description: 'Combat equipment and weapons',
                items: [],
                categories: ['weapons', 'armor', 'accessories'],
                locked: false,
                order: 1
            },
            'Food': {
                id: 'tab_food',
                name: 'Food',
                icon: '🍖',
                description: 'Consumables and healing items',
                items: [],
                categories: ['cooked', 'raw', 'potions'],
                locked: false,
                order: 2
            },
            'Skills': {
                id: 'tab_skills',
                name: 'Skills',
                icon: '⚒️',
                description: 'Skilling supplies and tools',
                items: [],
                categories: ['mining', 'smithing', 'crafting', 'herblore'],
                locked: false,
                order: 3
            },
            'Potions': {
                id: 'tab_potions',
                name: 'Potions',
                icon: '🧪',
                description: 'Herbs, potions, and brewing supplies',
                items: [],
                categories: ['combat_potions', 'skill_potions', 'herbs', 'secondaries'],
                locked: false,
                order: 4
            },
            'Seeds': {
                id: 'tab_seeds',
                name: 'Seeds',
                icon: '🌱',
                description: 'Seeds and farming supplies',
                items: [],
                categories: ['herb_seeds', 'tree_seeds', 'allotment', 'special'],
                locked: false,
                order: 5
            },
            'Memes': {
                id: 'tab_memes',
                name: 'Memes',
                icon: '🎭',
                description: 'Meme collection and content',
                items: [],
                categories: ['pepe', 'wojak', 'runescape', 'programming', 'gaming'],
                locked: false,
                order: 6
            },
            'Premium': {
                id: 'tab_premium',
                name: 'Premium',
                icon: '👑',
                description: 'Premium and special edition items',
                items: [],
                locked: true, // Requires payment
                order: 7,
                requiresLevel: 'premium'
            },
            'Anniversary': {
                id: 'tab_anniversary',
                name: '250th Anniversary',
                icon: '🎉',
                description: 'Limited edition anniversary items',
                items: [],
                locked: true,
                order: 8,
                requiresLevel: 'anniversary',
                special: true
            }
        };
        
        // Initialize tabs
        Object.entries(this.tabStructure).forEach(([name, tabData]) => {
            this.tabs.set(name, tabData);
        });
        
        console.log(`🗂️ Initialized ${this.tabs.size} bank tabs`);
    }
    
    initializeDefaultTabs() {
        // Populate tabs with initial items based on user preferences
        this.addDefaultItems();
        this.setupTabCycling();
        this.setupSearchFunctionality();
    }
    
    initializeCategorization() {
        // Category mappings for auto-organization
        this.categoryMappings = {
            // Gear categories
            weapons: ['sword', 'bow', 'staff', 'whip', 'scimitar', 'crossbow'],
            armor: ['helm', 'body', 'legs', 'shield', 'boots', 'gloves'],
            accessories: ['ring', 'amulet', 'cape', 'bracelet'],
            
            // Food categories
            cooked: ['shark', 'lobster', 'swordfish', 'monkfish', 'karambwan'],
            raw: ['raw_shark', 'raw_lobster', 'raw_swordfish'],
            drinks: ['brew', 'restore', 'wine', 'tea'],
            
            // Skill categories
            mining: ['pickaxe', 'ore', 'gem', 'rock'],
            smithing: ['hammer', 'bar', 'anvil'],
            herblore: ['herb', 'vial', 'pestle', 'mortar'],
            farming: ['seed', 'compost', 'rake', 'spade'],
            
            // Meme categories
            classic_memes: ['pepe', 'wojak', 'doge', 'trollface'],
            gaming_memes: ['press_f', 'git_gud', 'noob', 'gg'],
            runescape_memes: ['buying_gf', 'trimming_armor', 'doubling_money'],
            programming_memes: ['stackoverflow', 'semicolon', 'undefined'],
            
            // Special categories
            quest_items: ['quest_', 'key_', 'scroll_', 'book_'],
            tradeable: ['ge_', 'trade_', 'market_'],
            untradeable: ['untrade_', 'bound_', 'ironman_'],
            
            // Cultural overlaps
            one_piece_references: ['straw_hat', 'devil_fruit', 'nakama', 'pirate'],
            know_your_meme: ['origin_', 'spread_', 'variant_', 'template_']
        };
        
        console.log(`📂 Loaded ${Object.keys(this.categoryMappings).length} categorization rules`);
    }
    
    initializeSpecialItems() {
        // Special items that reference user's history and culture
        this.specialItems = [
            // User's old RS items
            {
                id: 'fury_amulet',
                name: 'Fury (Your Old RSN)',
                tab: 'Gear',
                category: 'accessories',
                stackable: false,
                value: 3000000,
                special: true,
                description: 'A reminder of your RuneScape journey',
                icon: '📿'
            },
            {
                id: 'put_legacy',
                name: 'Put\'s Legacy',
                tab: 'Premium',
                category: 'special',
                stackable: false,
                special: true,
                description: 'Named after your first RSN',
                icon: '🏆'
            },
            
            // One Piece x RuneScape crossover
            {
                id: 'straw_hat_partyhat',
                name: 'Straw Hat Party Hat',
                tab: 'Premium',
                category: 'one_piece_references',
                stackable: false,
                value: 2147483647, // Max cash
                special: true,
                description: 'When Luffy meets RuneScape',
                icon: '👒'
            },
            
            // KYC = KnowYourMeme reference
            {
                id: 'kyc_meme_certificate',
                name: 'KnowYourMeme Verification',
                tab: 'Memes',
                category: 'know_your_meme',
                stackable: true,
                description: 'KYC but for memes',
                icon: '📜'
            },
            
            // Anniversary items
            {
                id: '250th_anniversary_cape',
                name: '250th Anniversary Cape',
                tab: 'Anniversary',
                category: 'special',
                stackable: false,
                value: 250000000,
                special: true,
                anniversary: true,
                description: 'Celebrating 250 years of... something',
                icon: '🎊'
            }
        ];
        
        // Add special items to bank
        this.specialItems.forEach(item => {
            this.addItemToBank(item);
        });
        
        console.log(`✨ Added ${this.specialItems.length} special items`);
    }
    
    /**
     * Main bank operations
     */
    async addItemToBank(item, quantity = 1) {
        const itemId = item.id || crypto.randomBytes(8).toString('hex');
        
        // Check bank capacity
        if (this.getTotalItems() >= this.userData.bankCapacity) {
            throw new Error('Bank is full! Upgrade to premium for more space.');
        }
        
        // Create item entry if doesn't exist
        if (!this.items.has(itemId)) {
            this.items.set(itemId, {
                ...item,
                id: itemId,
                quantity: 0,
                dateAdded: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            });
        }
        
        // Update quantity
        const bankItem = this.items.get(itemId);
        bankItem.quantity += quantity;
        
        if (bankItem.quantity > this.config.maxStackSize) {
            bankItem.quantity = this.config.maxStackSize;
        }
        
        // Add to appropriate tab
        const targetTab = this.determineTab(item);
        const tab = this.tabs.get(targetTab);
        
        if (!tab.items.includes(itemId)) {
            tab.items.push(itemId);
        }
        
        // Update search index
        this.updateSearchIndex(itemId, item);
        
        // Emit event
        this.emit('item-added', { item, quantity, tab: targetTab });
        
        console.log(`➕ Added ${quantity}x ${item.name} to ${targetTab} tab`);
        
        return { itemId, tab: targetTab, newQuantity: bankItem.quantity };
    }
    
    async withdrawItem(itemId, quantity = 1) {
        if (!this.items.has(itemId)) {
            throw new Error('Item not found in bank');
        }
        
        const item = this.items.get(itemId);
        
        if (item.quantity < quantity) {
            throw new Error(`Insufficient quantity. Have: ${item.quantity}, Want: ${quantity}`);
        }
        
        // Update quantity
        item.quantity -= quantity;
        item.lastAccessed = new Date().toISOString();
        
        // Remove from bank if depleted
        if (item.quantity === 0) {
            this.items.delete(itemId);
            
            // Remove from all tabs
            this.tabs.forEach(tab => {
                const index = tab.items.indexOf(itemId);
                if (index > -1) {
                    tab.items.splice(index, 1);
                }
            });
            
            // Remove from search index
            this.searchIndex.delete(itemId);
        }
        
        this.emit('item-withdrawn', { itemId, quantity, remaining: item.quantity });
        
        console.log(`➖ Withdrew ${quantity}x ${item.name}`);
        
        return { item: { ...item }, quantity };
    }
    
    determineTab(item) {
        // Check for explicit tab assignment
        if (item.tab) return item.tab;
        
        // Auto-categorization based on item properties
        if (item.category) {
            for (const [tabName, tabData] of this.tabs) {
                if (tabData.categories && tabData.categories.includes(item.category)) {
                    return tabName;
                }
            }
        }
        
        // Name-based categorization
        const itemName = item.name.toLowerCase();
        
        // Check category mappings
        for (const [category, keywords] of Object.entries(this.categoryMappings)) {
            for (const keyword of keywords) {
                if (itemName.includes(keyword)) {
                    // Find tab for this category
                    for (const [tabName, tabData] of this.tabs) {
                        if (tabData.categories && tabData.categories.includes(category)) {
                            return tabName;
                        }
                    }
                }
            }
        }
        
        // Default to 'All' tab
        return 'All';
    }
    
    /**
     * Tab cycling functionality
     */
    cycleToNextTab(currentTab) {
        const cycleOrder = this.config.tabCycleOrder;
        const currentIndex = cycleOrder.indexOf(currentTab);
        
        if (currentIndex === -1) {
            return cycleOrder[0];
        }
        
        const nextIndex = (currentIndex + 1) % cycleOrder.length;
        return cycleOrder[nextIndex];
    }
    
    cycleToPreviousTab(currentTab) {
        const cycleOrder = this.config.tabCycleOrder;
        const currentIndex = cycleOrder.indexOf(currentTab);
        
        if (currentIndex === -1) {
            return cycleOrder[cycleOrder.length - 1];
        }
        
        const prevIndex = (currentIndex - 1 + cycleOrder.length) % cycleOrder.length;
        return cycleOrder[prevIndex];
    }
    
    /**
     * Search functionality
     */
    setupSearchFunctionality() {
        // Build search index from existing items
        this.items.forEach((item, itemId) => {
            this.updateSearchIndex(itemId, item);
        });
    }
    
    updateSearchIndex(itemId, item) {
        const searchTerms = [
            item.name.toLowerCase(),
            item.category?.toLowerCase() || '',
            item.description?.toLowerCase() || '',
            ...(item.tags || []).map(tag => tag.toLowerCase())
        ].filter(term => term);
        
        this.searchIndex.set(itemId, searchTerms);
    }
    
    searchBank(query) {
        const queryLower = query.toLowerCase();
        const results = [];
        
        for (const [itemId, searchTerms] of this.searchIndex) {
            const matches = searchTerms.some(term => term.includes(queryLower));
            
            if (matches) {
                const item = this.items.get(itemId);
                if (item) {
                    results.push({
                        ...item,
                        relevance: this.calculateRelevance(queryLower, searchTerms)
                    });
                }
            }
        }
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        return results;
    }
    
    calculateRelevance(query, searchTerms) {
        let relevance = 0;
        
        searchTerms.forEach(term => {
            if (term === query) relevance += 10;
            else if (term.startsWith(query)) relevance += 5;
            else if (term.includes(query)) relevance += 2;
        });
        
        return relevance;
    }
    
    /**
     * Preset management (like banklayouts.com)
     */
    savePreset(name, description = '') {
        const presetId = crypto.randomBytes(8).toString('hex');
        
        const preset = {
            id: presetId,
            name,
            description,
            tabs: {},
            inventory: [],
            equipment: {},
            savedAt: new Date().toISOString()
        };
        
        // Save current tab states
        this.tabs.forEach((tab, tabName) => {
            preset.tabs[tabName] = [...tab.items];
        });
        
        this.presets.set(presetId, preset);
        
        console.log(`💾 Saved preset: ${name}`);
        
        return presetId;
    }
    
    loadPreset(presetId) {
        if (!this.presets.has(presetId)) {
            throw new Error('Preset not found');
        }
        
        const preset = this.presets.get(presetId);
        
        // Clear current tabs
        this.tabs.forEach(tab => {
            tab.items = [];
        });
        
        // Load preset items
        Object.entries(preset.tabs).forEach(([tabName, items]) => {
            if (this.tabs.has(tabName)) {
                this.tabs.get(tabName).items = [...items];
            }
        });
        
        console.log(`📂 Loaded preset: ${preset.name}`);
        
        this.emit('preset-loaded', preset);
        
        return preset;
    }
    
    /**
     * AI-powered organization
     */
    async autoOrganizeBank() {
        console.log('🤖 Running AI bank organization...');
        
        // Clear all tabs except 'All'
        this.tabs.forEach((tab, tabName) => {
            if (tabName !== 'All') {
                tab.items = [];
            }
        });
        
        // Re-categorize all items
        const organized = {
            gear: [],
            food: [],
            skills: [],
            potions: [],
            seeds: [],
            memes: [],
            premium: [],
            misc: []
        };
        
        this.items.forEach((item, itemId) => {
            const category = this.aiCategorizeItem(item);
            if (organized[category]) {
                organized[category].push(itemId);
            } else {
                organized.misc.push(itemId);
            }
        });
        
        // Update tabs
        Object.entries(organized).forEach(([category, items]) => {
            const tabName = category.charAt(0).toUpperCase() + category.slice(1);
            if (this.tabs.has(tabName)) {
                this.tabs.get(tabName).items = items;
            }
        });
        
        console.log('✅ Bank organization complete!');
        
        this.emit('bank-organized', organized);
        
        return organized;
    }
    
    aiCategorizeItem(item) {
        // Smart categorization based on item properties
        const name = item.name.toLowerCase();
        
        // Combat gear
        if (name.includes('sword') || name.includes('armor') || name.includes('helm') ||
            name.includes('shield') || name.includes('bow') || name.includes('staff')) {
            return 'gear';
        }
        
        // Food
        if (name.includes('food') || name.includes('shark') || name.includes('lobster') ||
            name.includes('brew') || name.includes('restore')) {
            return 'food';
        }
        
        // Potions and herbs
        if (name.includes('potion') || name.includes('herb') || name.includes('vial')) {
            return 'potions';
        }
        
        // Seeds
        if (name.includes('seed') || name.includes('sapling')) {
            return 'seeds';
        }
        
        // Memes
        if (name.includes('meme') || name.includes('pepe') || name.includes('wojak')) {
            return 'memes';
        }
        
        // Skills
        if (name.includes('ore') || name.includes('bar') || name.includes('log') ||
            name.includes('rune') || name.includes('essence')) {
            return 'skills';
        }
        
        // Premium
        if (item.special || item.value > 10000000) {
            return 'premium';
        }
        
        return 'misc';
    }
    
    /**
     * Payment integration (Stripe)
     */
    async upgradeToPremium(paymentMethod) {
        console.log('💳 Processing premium upgrade...');
        
        // Simulate Stripe payment
        const payment = await this.processStripePayment(paymentMethod, this.paymentConfig.premiumPrice);
        
        if (payment.success) {
            this.userData.membershipLevel = 'premium';
            this.userData.bankCapacity = this.paymentConfig.features.premium.capacity;
            this.userData.unlockedTabs = this.paymentConfig.features.premium.tabs;
            
            // Unlock premium tab
            this.tabs.get('Premium').locked = false;
            
            console.log('✅ Upgraded to premium membership!');
            
            this.emit('membership-upgraded', {
                level: 'premium',
                capacity: this.userData.bankCapacity,
                tabs: this.userData.unlockedTabs
            });
            
            return { success: true, membership: 'premium' };
        }
        
        return { success: false, error: payment.error };
    }
    
    async upgradeToAnniversary(paymentMethod) {
        console.log('🎉 Processing 250th Anniversary Edition upgrade...');
        
        const payment = await this.processStripePayment(paymentMethod, this.paymentConfig.anniversaryPrice);
        
        if (payment.success) {
            this.userData.membershipLevel = 'anniversary';
            this.userData.bankCapacity = this.paymentConfig.features.anniversary.capacity;
            this.userData.unlockedTabs = this.paymentConfig.features.anniversary.tabs;
            this.config.anniversaryMode = true;
            
            // Unlock all tabs
            this.tabs.forEach(tab => {
                tab.locked = false;
            });
            
            // Add special anniversary items
            this.addAnniversaryItems();
            
            console.log('🎊 Upgraded to 250th Anniversary Edition!');
            
            this.emit('membership-upgraded', {
                level: 'anniversary',
                capacity: this.userData.bankCapacity,
                tabs: this.userData.unlockedTabs,
                special: true
            });
            
            return { success: true, membership: 'anniversary' };
        }
        
        return { success: false, error: payment.error };
    }
    
    async processStripePayment(paymentMethod, amount) {
        // Simulate Stripe SDK integration
        console.log(`💰 Processing payment of $${(amount / 100).toFixed(2)}...`);
        
        // In real implementation, this would use Stripe SDK
        const simulation = Math.random() > 0.1; // 90% success rate
        
        if (simulation) {
            return {
                success: true,
                paymentId: `pi_${crypto.randomBytes(12).toString('hex')}`,
                amount: amount,
                currency: 'usd'
            };
        } else {
            return {
                success: false,
                error: 'Payment declined'
            };
        }
    }
    
    addAnniversaryItems() {
        const anniversaryItems = [
            {
                id: 'golden_bank_chest',
                name: 'Golden Bank Chest',
                tab: 'Anniversary',
                description: '250th Anniversary commemorative chest',
                value: 250000000,
                special: true,
                icon: '🏆'
            },
            {
                id: 'anniversary_party_hat',
                name: '250th Anniversary Party Hat',
                tab: 'Anniversary',
                description: 'Ultra rare anniversary edition',
                value: 2147483647,
                special: true,
                icon: '🎩'
            },
            {
                id: 'founder_cape',
                name: 'Founder\'s Cape',
                tab: 'Anniversary',
                description: 'For the OG supporters',
                special: true,
                icon: '🦸'
            }
        ];
        
        anniversaryItems.forEach(item => {
            this.addItemToBank(item, 1);
        });
    }
    
    /**
     * Bank stats and info
     */
    getBankStats() {
        const stats = {
            totalItems: this.getTotalItems(),
            totalValue: this.calculateTotalValue(),
            capacity: this.userData.bankCapacity,
            usedSpace: `${this.getTotalItems()}/${this.userData.bankCapacity}`,
            membershipLevel: this.userData.membershipLevel,
            tabStats: {}
        };
        
        // Tab-specific stats
        this.tabs.forEach((tab, tabName) => {
            stats.tabStats[tabName] = {
                items: tab.items.length,
                value: this.calculateTabValue(tabName),
                locked: tab.locked
            };
        });
        
        return stats;
    }
    
    getTotalItems() {
        return this.items.size;
    }
    
    calculateTotalValue() {
        let totalValue = 0;
        
        this.items.forEach(item => {
            const value = item.value || 0;
            totalValue += value * item.quantity;
        });
        
        return totalValue;
    }
    
    calculateTabValue(tabName) {
        const tab = this.tabs.get(tabName);
        if (!tab) return 0;
        
        let tabValue = 0;
        
        tab.items.forEach(itemId => {
            const item = this.items.get(itemId);
            if (item) {
                const value = item.value || 0;
                tabValue += value * item.quantity;
            }
        });
        
        return tabValue;
    }
    
    /**
     * Export/Import functionality
     */
    exportBank() {
        const exportData = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            userData: this.userData,
            tabs: Array.from(this.tabs.entries()),
            items: Array.from(this.items.entries()),
            presets: Array.from(this.presets.entries()),
            stats: this.getBankStats()
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    importBank(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate version
            if (data.version !== '1.0.0') {
                throw new Error('Incompatible bank version');
            }
            
            // Import user data
            this.userData = { ...this.userData, ...data.userData };
            
            // Import tabs
            this.tabs.clear();
            data.tabs.forEach(([name, tabData]) => {
                this.tabs.set(name, tabData);
            });
            
            // Import items
            this.items.clear();
            data.items.forEach(([id, itemData]) => {
                this.items.set(id, itemData);
            });
            
            // Import presets
            this.presets.clear();
            data.presets.forEach(([id, presetData]) => {
                this.presets.set(id, presetData);
            });
            
            // Rebuild search index
            this.setupSearchFunctionality();
            
            console.log('✅ Bank imported successfully');
            
            return { success: true, stats: data.stats };
            
        } catch (error) {
            console.error('❌ Bank import failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Default items for demonstration
     */
    addDefaultItems() {
        const defaultItems = [
            // Gear
            { name: 'Abyssal Whip', tab: 'Gear', category: 'weapons', value: 3000000, icon: '🗡️' },
            { name: 'Dragon Scimitar', tab: 'Gear', category: 'weapons', value: 60000, icon: '⚔️' },
            { name: 'Bandos Chestplate', tab: 'Gear', category: 'armor', value: 15000000, icon: '🛡️' },
            
            // Food
            { name: 'Shark', tab: 'Food', category: 'cooked', value: 800, stackable: true, icon: '🦈' },
            { name: 'Saradomin Brew', tab: 'Food', category: 'drinks', value: 4000, stackable: true, icon: '🍷' },
            
            // Skills
            { name: 'Runite Ore', tab: 'Skills', category: 'mining', value: 11000, stackable: true, icon: '🪨' },
            { name: 'Magic Logs', tab: 'Skills', category: 'woodcutting', value: 1000, stackable: true, icon: '🪵' },
            
            // Potions
            { name: 'Super Combat Potion', tab: 'Potions', category: 'combat_potions', value: 10000, icon: '🧪' },
            { name: 'Ranarr Herb', tab: 'Potions', category: 'herbs', value: 7000, stackable: true, icon: '🌿' },
            
            // Seeds
            { name: 'Ranarr Seed', tab: 'Seeds', category: 'herb_seeds', value: 45000, stackable: true, icon: '🌱' },
            { name: 'Magic Seed', tab: 'Seeds', category: 'tree_seeds', value: 120000, stackable: true, icon: '🌰' },
            
            // Memes
            { name: 'Rare Pepe', tab: 'Memes', category: 'classic_memes', value: 1337, icon: '🐸' },
            { name: 'Diamond Hands', tab: 'Memes', category: 'crypto_memes', value: 69420, icon: '💎' },
            { name: 'Buying GF', tab: 'Memes', category: 'runescape_memes', value: 10000, icon: '💑' }
        ];
        
        // Add default items with random quantities
        defaultItems.forEach(item => {
            const quantity = item.stackable ? Math.floor(Math.random() * 1000) + 100 : 1;
            this.addItemToBank(item, quantity);
        });
        
        console.log(`📦 Added ${defaultItems.length} default items to bank`);
    }
    
    setupTabCycling() {
        // Set up keyboard shortcuts for tab cycling
        this.on('cycle-next', (currentTab) => {
            const nextTab = this.cycleToNextTab(currentTab);
            this.emit('tab-changed', { from: currentTab, to: nextTab });
            console.log(`➡️ Cycled to ${nextTab} tab`);
        });
        
        this.on('cycle-previous', (currentTab) => {
            const prevTab = this.cycleToPreviousTab(currentTab);
            this.emit('tab-changed', { from: currentTab, to: prevTab });
            console.log(`⬅️ Cycled to ${prevTab} tab`);
        });
    }
}

// Demonstration function
async function demonstrateBankSystem() {
    console.log('\n🏦 DEMONSTRATING RUNESCAPE BANK TABS SYSTEM');
    console.log('=' .repeat(50));
    
    const bank = new RuneScapeBankTabsSystem();
    
    // Show initial bank stats
    console.log('\n📊 Initial Bank Stats:');
    const stats = bank.getBankStats();
    console.log(`   Total Items: ${stats.totalItems}`);
    console.log(`   Total Value: ${stats.totalValue.toLocaleString()} GP`);
    console.log(`   Capacity: ${stats.usedSpace}`);
    console.log(`   Membership: ${stats.membershipLevel}`);
    
    // Demonstrate tab cycling
    console.log('\n🔄 Tab Cycling Demo:');
    let currentTab = 'Gear';
    for (let i = 0; i < 5; i++) {
        currentTab = bank.cycleToNextTab(currentTab);
        console.log(`   Cycled to: ${currentTab}`);
    }
    
    // Demonstrate search
    console.log('\n🔍 Search Demo:');
    const searchResults = bank.searchBank('potion');
    console.log(`   Found ${searchResults.length} items matching "potion"`);
    searchResults.slice(0, 3).forEach(item => {
        console.log(`   - ${item.name} (${item.quantity}x)`);
    });
    
    // Demonstrate auto-organization
    console.log('\n🤖 Auto-Organization Demo:');
    await bank.autoOrganizeBank();
    
    // Show tab contents
    console.log('\n📁 Tab Contents:');
    bank.tabs.forEach((tab, tabName) => {
        if (tab.items.length > 0) {
            console.log(`   ${tab.icon} ${tabName}: ${tab.items.length} items`);
        }
    });
    
    // Demonstrate preset saving
    console.log('\n💾 Preset Management:');
    const presetId = bank.savePreset('Main Combat Setup', 'My preferred gear loadout');
    console.log(`   Saved preset: Main Combat Setup`);
    
    // Demonstrate payment upgrade
    console.log('\n💳 Payment Integration Demo:');
    const upgradeResult = await bank.upgradeToPremium({ card: '4242424242424242' });
    if (upgradeResult.success) {
        console.log(`   ✅ Upgraded to ${upgradeResult.membership}!`);
        console.log(`   New capacity: ${bank.userData.bankCapacity} items`);
    }
    
    // Add some meme items
    console.log('\n🎭 Adding Meme Items:');
    await bank.addItemToBank({
        name: 'ThePrimeagen Reaction GIF',
        tab: 'Memes',
        category: 'programming_memes',
        value: 42069,
        description: 'Peak programming reaction content',
        icon: '🔥'
    }, 10);
    
    await bank.addItemToBank({
        name: 'Sea Shanty 2 Remix',
        tab: 'Memes',
        category: 'runescape_memes',
        value: 73,
        description: 'The only music that matters',
        icon: '🎵'
    }, 1);
    
    // Final stats
    console.log('\n📊 Final Bank Stats:');
    const finalStats = bank.getBankStats();
    console.log(`   Total Items: ${finalStats.totalItems}`);
    console.log(`   Total Value: ${finalStats.totalValue.toLocaleString()} GP`);
    console.log(`   Tab Values:`);
    Object.entries(finalStats.tabStats).forEach(([tabName, tabData]) => {
        if (tabData.items > 0) {
            console.log(`     ${tabName}: ${tabData.items} items worth ${tabData.value.toLocaleString()} GP`);
        }
    });
    
    console.log('\n✅ Bank system demonstration complete!');
    console.log('🏦 Ready to organize all your digital content!');
}

// Run demonstration if called directly
if (require.main === module) {
    demonstrateBankSystem().catch(console.error);
}

module.exports = RuneScapeBankTabsSystem;

console.log('🏦 RUNESCAPE BANK TABS SYSTEM LOADED');
console.log('📦 Organize content like a RuneScape bank');
console.log('💳 Stripe integration ready for premium features');
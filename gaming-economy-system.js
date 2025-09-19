#!/usr/bin/env node

/**
 * 💰🎮 GAMING ECONOMY SYSTEM
 * Multi-currency system with bits, tokens, coins, and loot
 * Integrated with streaming platforms and viewer engagement
 */

class GamingEconomySystem {
    constructor() {
        // Currency types and exchange rates
        this.currencies = {
            bits: {
                name: 'Bits',
                symbol: '🔷',
                description: 'Earned from battles and exploration',
                color: '#00ffff',
                exchangeRates: {
                    coins: 100,  // 1 bit = 100 coins
                    tokens: 0.1  // 1 bit = 0.1 tokens
                }
            },
            tokens: {
                name: 'Tokens',
                symbol: '🪙',
                description: 'Premium currency from donations',
                color: '#ffd700',
                exchangeRates: {
                    bits: 10,    // 1 token = 10 bits
                    coins: 1000  // 1 token = 1000 coins
                }
            },
            coins: {
                name: 'Coins',
                symbol: '🪙',
                description: 'Basic currency from activities',
                color: '#cd7f32',
                exchangeRates: {
                    bits: 0.01,    // 100 coins = 1 bit
                    tokens: 0.001  // 1000 coins = 1 token
                }
            },
            shards: {
                name: 'Soul Shards',
                symbol: '💎',
                description: 'Rare currency from boss battles',
                color: '#ff00ff',
                exchangeRates: {
                    bits: 100,    // 1 shard = 100 bits
                    tokens: 10,   // 1 shard = 10 tokens
                    coins: 10000  // 1 shard = 10000 coins
                }
            }
        };
        
        // Loot rarity tiers
        this.rarities = {
            common: {
                name: 'Common',
                color: '#ffffff',
                dropRate: 0.6,
                valueMultiplier: 1,
                streamAlert: false
            },
            uncommon: {
                name: 'Uncommon',
                color: '#00ff00',
                dropRate: 0.25,
                valueMultiplier: 2,
                streamAlert: false
            },
            rare: {
                name: 'Rare',
                color: '#0099ff',
                dropRate: 0.10,
                valueMultiplier: 5,
                streamAlert: true
            },
            epic: {
                name: 'Epic',
                color: '#9933ff',
                dropRate: 0.04,
                valueMultiplier: 10,
                streamAlert: true
            },
            legendary: {
                name: 'Legendary',
                color: '#ff9900',
                dropRate: 0.01,
                valueMultiplier: 50,
                streamAlert: true,
                globalAnnounce: true
            },
            mythic: {
                name: 'Mythic',
                color: '#ff0066',
                dropRate: 0.001,
                valueMultiplier: 100,
                streamAlert: true,
                globalAnnounce: true,
                specialEffects: true
            }
        };
        
        // Item categories
        this.itemCategories = {
            weapons: ['Sword', 'Staff', 'Bow', 'Dagger', 'Axe', 'Wand'],
            armor: ['Helmet', 'Chestplate', 'Leggings', 'Boots', 'Shield'],
            consumables: ['Health Potion', 'Mana Potion', 'Speed Boost', 'Damage Buff'],
            materials: ['Iron Ore', 'Magic Crystal', 'Dragon Scale', 'Void Essence'],
            treasures: ['Gold Bar', 'Ancient Rune', 'Mystic Orb', 'Soul Stone']
        };
        
        // Economy tracking
        this.economyStats = {
            totalBitsCirculation: 0,
            totalTokensCirculation: 0,
            totalCoinsCirculation: 0,
            totalShardsCirculation: 0,
            totalItemsDropped: 0,
            legendaryDrops: 0,
            totalTransactions: 0
        };
    }
    
    // Generate currency rewards
    generateCurrencyReward(source, multiplier = 1) {
        const rewards = {};
        
        switch (source) {
            case 'monster_kill':
                rewards.coins = Math.floor((10 + Math.random() * 20) * multiplier);
                if (Math.random() < 0.1) {
                    rewards.bits = Math.floor((1 + Math.random() * 3) * multiplier);
                }
                break;
                
            case 'boss_kill':
                rewards.bits = Math.floor((5 + Math.random() * 10) * multiplier);
                rewards.coins = Math.floor((100 + Math.random() * 200) * multiplier);
                if (Math.random() < 0.3) {
                    rewards.shards = 1;
                }
                break;
                
            case 'quest_complete':
                rewards.bits = Math.floor((2 + Math.random() * 5) * multiplier);
                rewards.coins = Math.floor((50 + Math.random() * 50) * multiplier);
                break;
                
            case 'exploration':
                rewards.coins = Math.floor((5 + Math.random() * 15) * multiplier);
                break;
                
            case 'viewer_donation':
                rewards.tokens = Math.floor((1 + Math.random() * 5) * multiplier);
                rewards.bits = Math.floor((10 + Math.random() * 20) * multiplier);
                break;
                
            case 'stream_milestone':
                rewards.tokens = Math.floor((5 + Math.random() * 10) * multiplier);
                rewards.shards = Math.random() < 0.5 ? 1 : 0;
                break;
        }
        
        // Update circulation stats
        Object.entries(rewards).forEach(([currency, amount]) => {
            this.economyStats[`total${currency.charAt(0).toUpperCase() + currency.slice(1)}Circulation`] += amount;
        });
        
        return rewards;
    }
    
    // Generate loot drop
    generateLootDrop(enemyLevel = 1, luckBonus = 0) {
        // Determine rarity
        const roll = Math.random() + luckBonus;
        let selectedRarity = 'common';
        let cumulativeChance = 0;
        
        // Check from rarest to most common
        const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        for (const rarity of rarityOrder) {
            cumulativeChance += this.rarities[rarity].dropRate;
            if (roll <= cumulativeChance) {
                selectedRarity = rarity;
                break;
            }
        }
        
        // Select random category and item
        const categories = Object.keys(this.itemCategories);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const items = this.itemCategories[category];
        const baseItem = items[Math.floor(Math.random() * items.length)];
        
        // Generate item stats
        const rarityData = this.rarities[selectedRarity];
        const item = {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${rarityData.name} ${baseItem}`,
            baseItem: baseItem,
            category: category,
            rarity: selectedRarity,
            level: enemyLevel,
            stats: this.generateItemStats(selectedRarity, category, enemyLevel),
            value: this.calculateItemValue(selectedRarity, enemyLevel),
            timestamp: Date.now()
        };
        
        this.economyStats.totalItemsDropped++;
        if (selectedRarity === 'legendary' || selectedRarity === 'mythic') {
            this.economyStats.legendaryDrops++;
        }
        
        return item;
    }
    
    generateItemStats(rarity, category, level) {
        const multiplier = this.rarities[rarity].valueMultiplier;
        const stats = {};
        
        switch (category) {
            case 'weapons':
                stats.damage = Math.floor((5 + level * 2) * multiplier);
                stats.attackSpeed = 1 + (Math.random() * 0.5 * multiplier);
                if (Math.random() < 0.3 * multiplier) {
                    stats.critChance = Math.floor(5 * multiplier) + '%';
                }
                break;
                
            case 'armor':
                stats.defense = Math.floor((3 + level * 1.5) * multiplier);
                stats.health = Math.floor((10 + level * 5) * multiplier);
                if (Math.random() < 0.3 * multiplier) {
                    stats.resistance = Math.floor(10 * multiplier) + '%';
                }
                break;
                
            case 'consumables':
                stats.effect = `Restores ${Math.floor(20 * multiplier)} HP`;
                stats.duration = Math.floor(5 * multiplier) + ' seconds';
                break;
                
            case 'materials':
                stats.quality = Math.floor(50 + 10 * multiplier);
                stats.quantity = Math.floor(1 + Math.random() * 3 * multiplier);
                break;
                
            case 'treasures':
                stats.sellValue = Math.floor((100 + level * 10) * multiplier);
                stats.rareBonus = multiplier > 5 ? '+' + (multiplier * 2) + '% luck' : null;
                break;
        }
        
        return stats;
    }
    
    calculateItemValue(rarity, level) {
        const baseValue = 10 + (level * 5);
        const multiplier = this.rarities[rarity].valueMultiplier;
        
        return {
            coins: Math.floor(baseValue * multiplier),
            bits: rarity === 'rare' || rarity === 'epic' ? Math.floor(multiplier) : 0,
            tokens: rarity === 'legendary' || rarity === 'mythic' ? Math.floor(multiplier / 10) : 0
        };
    }
    
    // Currency exchange
    exchangeCurrency(amount, fromCurrency, toCurrency) {
        if (!this.currencies[fromCurrency] || !this.currencies[toCurrency]) {
            throw new Error('Invalid currency type');
        }
        
        const exchangeRate = this.currencies[fromCurrency].exchangeRates[toCurrency];
        if (!exchangeRate) {
            throw new Error(`Cannot exchange ${fromCurrency} to ${toCurrency}`);
        }
        
        const result = amount * exchangeRate;
        this.economyStats.totalTransactions++;
        
        return {
            from: { currency: fromCurrency, amount },
            to: { currency: toCurrency, amount: result },
            rate: exchangeRate,
            fee: Math.floor(result * 0.02) // 2% exchange fee
        };
    }
    
    // Generate shop inventory
    generateShopInventory(playerLevel = 1) {
        const inventory = [];
        const itemCount = 6 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < itemCount; i++) {
            // Higher chance of better items at higher levels
            const levelBonus = playerLevel * 0.01;
            const item = this.generateLootDrop(playerLevel, levelBonus);
            
            // Add shop markup
            const markup = 1.5 + Math.random() * 0.5;
            item.shopPrice = {
                coins: Math.floor(item.value.coins * markup),
                bits: Math.floor(item.value.bits * markup),
                tokens: Math.floor(item.value.tokens * markup)
            };
            
            inventory.push(item);
        }
        
        return inventory;
    }
    
    // Viewer interaction rewards
    generateViewerReward(action, viewerName) {
        const rewards = {
            viewer: viewerName,
            action: action,
            timestamp: Date.now()
        };
        
        switch (action) {
            case 'follow':
                rewards.currency = { bits: 5, coins: 500 };
                rewards.message = `Thanks for the follow, ${viewerName}!`;
                break;
                
            case 'subscribe':
                rewards.currency = { tokens: 1, bits: 20, coins: 2000 };
                rewards.message = `Welcome to the sub squad, ${viewerName}!`;
                rewards.item = this.generateLootDrop(1, 0.1); // Bonus loot
                break;
                
            case 'bits_cheer':
                const bitsAmount = Math.floor(Math.random() * 100) + 1;
                rewards.currency = { 
                    tokens: Math.floor(bitsAmount / 100),
                    bits: Math.floor(bitsAmount / 10),
                    coins: bitsAmount * 10
                };
                rewards.message = `${viewerName} cheered ${bitsAmount} bits!`;
                break;
                
            case 'raid':
                rewards.currency = { tokens: 5, bits: 50, shards: 1 };
                rewards.message = `${viewerName} raided with their community!`;
                rewards.globalBonus = { duration: 300, multiplier: 1.5 }; // 5 min bonus
                break;
        }
        
        return rewards;
    }
    
    // Calculate player wealth
    calculateTotalWealth(currencies) {
        let totalInCoins = 0;
        
        Object.entries(currencies).forEach(([currency, amount]) => {
            if (this.currencies[currency]) {
                // Convert everything to coins for comparison
                const toCoinsRate = this.currencies[currency].exchangeRates.coins || 1;
                totalInCoins += amount * toCoinsRate;
            }
        });
        
        return {
            totalCoins: totalInCoins,
            wealthTier: this.getWealthTier(totalInCoins),
            formatted: this.formatCurrency(totalInCoins)
        };
    }
    
    getWealthTier(totalCoins) {
        if (totalCoins >= 1000000) return 'Tycoon';
        if (totalCoins >= 100000) return 'Wealthy';
        if (totalCoins >= 10000) return 'Rich';
        if (totalCoins >= 1000) return 'Comfortable';
        if (totalCoins >= 100) return 'Poor';
        return 'Broke';
    }
    
    formatCurrency(amount) {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toString();
    }
    
    // Economy statistics
    getEconomyStats() {
        return {
            ...this.economyStats,
            totalWealth: this.calculateTotalCirculation(),
            inflationRate: this.calculateInflation(),
            averageItemValue: this.economyStats.totalItemsDropped > 0 
                ? Math.floor(this.calculateTotalCirculation() / this.economyStats.totalItemsDropped)
                : 0
        };
    }
    
    calculateTotalCirculation() {
        return (
            this.economyStats.totalCoinsCirculation +
            (this.economyStats.totalBitsCirculation * 100) +
            (this.economyStats.totalTokensCirculation * 1000) +
            (this.economyStats.totalShardsCirculation * 10000)
        );
    }
    
    calculateInflation() {
        // Simple inflation calculation based on currency generation
        const baseRate = 1.0;
        const circulationFactor = this.calculateTotalCirculation() / 1000000;
        return baseRate + (circulationFactor * 0.1);
    }
}

module.exports = GamingEconomySystem;
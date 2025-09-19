#!/usr/bin/env node

/**
 * IDENTITY LOOT CONNECTOR
 * 
 * Connects the Universal Identity Encoder to existing systems:
 * - Loot drops show public codenames
 * - Items have identity layers (same item, different names per context)
 * - Boss creators get codenames
 * - Forum posts use appropriate identity layer
 */

const UniversalIdentityEncoder = require('./universal-identity-encoder.js');
const IntegratedLootEconomySystem = require('./integrated-loot-economy-system.js');
const BossFigurinePipeline = require('./boss-figurine-pipeline.js');

class IdentityLootConnector {
    constructor() {
        // Initialize systems
        this.identityEncoder = new UniversalIdentityEncoder();
        this.lootSystem = new IntegratedLootEconomySystem();
        this.bossPipeline = new BossFigurinePipeline();
        
        // Track player identities
        this.playerIdentities = new Map();
        
        // Track item identities (same item, different names)
        this.itemIdentities = new Map();
        
        console.log('🔗 Identity Loot Connector initializing...');
        this.connectSystems();
    }
    
    connectSystems() {
        // When player gets loot, use their gaming codename
        this.lootSystem.on('itemDropped', async (dropEvent) => {
            const playerIdentity = await this.getOrCreatePlayerIdentity(dropEvent.playerId);
            
            // Replace real player ID with codename in public events
            dropEvent.publicPlayerName = playerIdentity.codenames.gaming;
            dropEvent.playerLayer = 'public';
            
            console.log(`📦 ${playerIdentity.codenames.gaming} received ${dropEvent.name}!`);
        });
        
        // When item is created, give it multiple identity layers
        this.lootSystem.itemDatabase.on('itemGenerated', async (item) => {
            await this.createItemIdentity(item);
        });
        
        // When boss is created, use creator's codename
        this.bossPipeline.on('boss_created', async (bossEvent) => {
            if (bossEvent.creatorId) {
                const creatorIdentity = await this.getOrCreatePlayerIdentity(bossEvent.creatorId);
                bossEvent.publicCreatorName = creatorIdentity.codenames.gaming;
                console.log(`👹 Boss created by ${creatorIdentity.codenames.gaming}`);
            }
        });
        
        // Forum post formatting with appropriate identity
        this.setupForumIdentities();
        
        console.log('✅ Identity systems connected');
    }
    
    /**
     * Get or create player identity
     */
    async getOrCreatePlayerIdentity(playerId) {
        if (this.playerIdentities.has(playerId)) {
            return this.playerIdentities.get(playerId);
        }
        
        // Create new identity for player
        const identity = await this.identityEncoder.createIdentity(
            playerId, // Real ID stays private
            ['gaming', 'business', 'social', 'sailing']
        );
        
        this.playerIdentities.set(playerId, identity);
        return identity;
    }
    
    /**
     * Create item identity with context-specific names
     */
    async createItemIdentity(item) {
        // Items get different names in different contexts
        const itemIdentity = {
            systemPID: item.worldDropId || item.id,
            names: {
                gaming: item.name, // Original game name
                business: this.generateBusinessName(item),
                social: this.generateSocialName(item),
                technical: this.generateTechnicalName(item)
            },
            rarity: item.rarity,
            value: item.value
        };
        
        this.itemIdentities.set(itemIdentity.systemPID, itemIdentity);
        
        // Create identity in encoder
        await this.identityEncoder.createIdentity(
            item.name,
            Object.keys(itemIdentity.names)
        );
        
        return itemIdentity;
    }
    
    /**
     * Generate business-friendly item name
     */
    generateBusinessName(item) {
        const businessNames = {
            'abyssal_whip': 'Performance Enhancement Tool',
            'dragon_claws': 'Efficiency Accelerator',
            'twisted_bow': 'Precision Instrument',
            'scythe_of_vitur': 'Resource Optimizer',
            'gold': 'Liquid Capital',
            'health_potion': 'Recovery Asset'
        };
        
        return businessNames[item.id] || `Asset-${item.id.substring(0, 8)}`;
    }
    
    /**
     * Generate social-friendly item name
     */
    generateSocialName(item) {
        const socialNames = {
            'abyssal_whip': 'Cool Whip Thingy',
            'dragon_claws': 'Dragon Hands',
            'twisted_bow': 'Fancy Bow',
            'scythe_of_vitur': 'Big Scythe',
            'gold': 'Shiny Coins',
            'health_potion': 'Red Drink'
        };
        
        return socialNames[item.id] || `Thing-${Math.floor(Math.random() * 1000)}`;
    }
    
    /**
     * Generate technical item name
     */
    generateTechnicalName(item) {
        return `ITEM_${item.id.toUpperCase()}_REF_${Date.now().toString(36)}`;
    }
    
    /**
     * Setup forum post identities
     */
    setupForumIdentities() {
        // Override forum post generation to use codenames
        const originalGenerateForumPost = this.lootSystem.generateForumPost.bind(this.lootSystem);
        
        this.lootSystem.generateForumPost = async (drop, source, context) => {
            const playerIdentity = await this.getOrCreatePlayerIdentity(context.playerId);
            
            // Get original forum post
            let forumPost = await originalGenerateForumPost(drop, source, context);
            
            // Replace player ID with codename
            forumPost = forumPost.replace(
                context.playerId,
                playerIdentity.codenames.gaming
            );
            
            // Add identity signature
            forumPost += `\n\n[I]Posted by: ${playerIdentity.codenames.gaming}[/I]`;
            forumPost += `\n[SIZE=1]Identity Layer: Gaming | Verified ✓[/SIZE]`;
            
            return forumPost;
        };
    }
    
    /**
     * Get item name based on context
     */
    getItemName(itemId, context = 'gaming') {
        const itemIdentity = this.itemIdentities.get(itemId);
        if (!itemIdentity) return itemId;
        
        return itemIdentity.names[context] || itemIdentity.names.gaming;
    }
    
    /**
     * Get player name based on context and layer access
     */
    async getPlayerName(playerId, requesterId, context = 'gaming', layerLevel = 0) {
        const playerIdentity = await this.getOrCreatePlayerIdentity(playerId);
        
        // Use identity encoder to get appropriate name
        const identity = await this.identityEncoder.getIdentity(
            playerIdentity.systemPID,
            requesterId,
            context,
            layerLevel
        );
        
        if (identity.error) {
            return 'Anonymous';
        }
        
        return identity.publicName || identity.privateName || 'Unknown';
    }
    
    /**
     * Create loot report with identity layers
     */
    async createLootReport(playerId, context = 'gaming') {
        const playerIdentity = await this.getOrCreatePlayerIdentity(playerId);
        
        // Get player's loot history
        const lootHistory = []; // Would fetch from loot system
        
        const report = {
            header: `Loot Report for ${playerIdentity.codenames[context]}`,
            context: context,
            identityLayer: 'public',
            items: []
        };
        
        // Transform item names based on context
        for (const loot of lootHistory) {
            report.items.push({
                name: this.getItemName(loot.itemId, context),
                quantity: loot.quantity,
                value: loot.value,
                timestamp: loot.timestamp
            });
        }
        
        return report;
    }
    
    /**
     * Handle cross-context trading
     */
    async createCrossContextTrade(sellerId, buyerId, itemId, fromContext, toContext) {
        // Get identities
        const sellerIdentity = await this.getOrCreatePlayerIdentity(sellerId);
        const buyerIdentity = await this.getOrCreatePlayerIdentity(buyerId);
        
        // Get item names in both contexts
        const fromName = this.getItemName(itemId, fromContext);
        const toName = this.getItemName(itemId, toContext);
        
        // Create trade record
        const trade = {
            seller: {
                id: sellerIdentity.systemPID,
                name: sellerIdentity.codenames[fromContext]
            },
            buyer: {
                id: buyerIdentity.systemPID,
                name: buyerIdentity.codenames[toContext]
            },
            item: {
                id: itemId,
                fromName: fromName,
                toName: toName,
                transition: `${fromName} → ${toName}`
            },
            contexts: {
                from: fromContext,
                to: toContext
            },
            timestamp: Date.now()
        };
        
        // Record identity transition for item
        await this.identityEncoder.transitionIdentity(
            itemId,
            itemId,
            'context_change',
            `${fromContext}_to_${toContext}`,
            trade
        );
        
        return trade;
    }
}

// Export for use
module.exports = IdentityLootConnector;

// Demo script
if (require.main === module) {
    const connector = new IdentityLootConnector();
    
    async function demonstrateIdentityLayers() {
        console.log('\n🎮 Demonstrating Identity Layer System\n');
        
        // Simulate player getting loot
        console.log('1. Player receives loot...');
        const playerId = 'player_123';
        
        // This would normally come from a boss kill
        const mockDrop = {
            id: 'abyssal_whip',
            name: 'Abyssal Whip',
            playerId: playerId,
            value: 2500000,
            rarity: 'rare'
        };
        
        // Get player identity
        const playerIdentity = await connector.getOrCreatePlayerIdentity(playerId);
        console.log(`   Player codename: ${playerIdentity.codenames.gaming}`);
        
        // Create item identity
        console.log('\n2. Item identity layers...');
        const itemIdentity = await connector.createItemIdentity(mockDrop);
        console.log('   Gaming context:', connector.getItemName(mockDrop.id, 'gaming'));
        console.log('   Business context:', connector.getItemName(mockDrop.id, 'business'));
        console.log('   Social context:', connector.getItemName(mockDrop.id, 'social'));
        
        // Simulate forum post
        console.log('\n3. Forum post with identity...');
        const forumPost = await connector.lootSystem.generateForumPost(
            mockDrop,
            'Abyssal Demon',
            { playerId, performance: 'excellent' }
        );
        console.log(forumPost);
        
        // Cross-context trade
        console.log('\n4. Cross-context trading...');
        const trade = await connector.createCrossContextTrade(
            playerId,
            'buyer_456',
            mockDrop.id,
            'gaming',
            'business'
        );
        console.log('Trade record:', JSON.stringify(trade, null, 2));
        
        // Different layer access
        console.log('\n5. Layer-based name resolution...');
        console.log('   Public view:', await connector.getPlayerName(playerId, 'anyone', 'gaming', 0));
        console.log('   System view:', await connector.getPlayerName(playerId, playerId, 'gaming', 4));
    }
    
    demonstrateIdentityLayers().catch(console.error);
}
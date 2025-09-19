#!/usr/bin/env node

/**
 * 🎮 UNIFIED ITEM DATABASE
 * 
 * Tracks every item in the game world:
 * - Total quantities of each item type
 * - Current ownership (who has what)
 * - Items dropped but not picked up
 * - Complete item lifecycle from drop to trade
 * 
 * Integrates with:
 * - Differential RNG Machine (drop generation)
 * - Grand Exchange Collar (trading)
 * - Collection Log System (achievements)
 */

const Database = require('better-sqlite3');
const EventEmitter = require('events');
const crypto = require('crypto');

class UnifiedItemDatabase extends EventEmitter {
    constructor() {
        super();
        
        // Initialize database
        this.db = new Database('./unified-items.db');
        this.db.pragma('journal_mode = WAL');
        
        // Item tracking maps for quick access
        this.totalItems = new Map(); // itemId -> total quantity in game
        this.worldItems = new Map(); // Items dropped but not picked up
        this.playerInventories = new Map(); // playerId -> Map(itemId -> quantity)
        
        this.initializeDatabase();
    }
    
    initializeDatabase() {
        console.log('🗃️ Initializing Unified Item Database...');
        
        // Master item registry
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS item_registry (
                item_id TEXT PRIMARY KEY,
                item_name TEXT NOT NULL,
                category TEXT NOT NULL,
                rarity TEXT NOT NULL,
                base_value INTEGER DEFAULT 0,
                max_stack INTEGER DEFAULT 1,
                tradeable BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT -- JSON for additional properties
            );
            
            -- Total items in game world
            CREATE TABLE IF NOT EXISTS item_totals (
                item_id TEXT PRIMARY KEY,
                total_quantity INTEGER DEFAULT 0,
                in_circulation INTEGER DEFAULT 0,
                in_world INTEGER DEFAULT 0, -- Dropped but not picked up
                destroyed INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES item_registry(item_id)
            );
            
            -- Player ownership tracking
            CREATE TABLE IF NOT EXISTS player_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id TEXT NOT NULL,
                item_id TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                obtained_from TEXT, -- 'drop', 'trade', 'quest', 'shop', etc
                metadata TEXT, -- JSON for item-specific data
                FOREIGN KEY (item_id) REFERENCES item_registry(item_id),
                UNIQUE(player_id, item_id)
            );
            
            -- World items (dropped but not picked up)
            CREATE TABLE IF NOT EXISTS world_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                location_x REAL,
                location_y REAL,
                location_z REAL,
                dropped_by TEXT,
                dropped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                despawn_at TIMESTAMP,
                picked_up BOOLEAN DEFAULT 0,
                picked_up_by TEXT,
                FOREIGN KEY (item_id) REFERENCES item_registry(item_id)
            );
            
            -- Item generation log (from RNG/drops)
            CREATE TABLE IF NOT EXISTS item_generation_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                source TEXT NOT NULL, -- 'boss_drop', 'skill_reward', 'quest', etc
                source_id TEXT, -- Boss name, skill type, quest id
                generator TEXT, -- 'differential_rng', 'manual', 'quest_reward'
                algorithm_snapshot TEXT, -- Human-readable algorithm used
                rng_values TEXT, -- JSON of RNG values used
                player_id TEXT,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES item_registry(item_id)
            );
            
            -- Trading history (from Grand Exchange)
            CREATE TABLE IF NOT EXISTS trading_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                seller_id TEXT NOT NULL,
                buyer_id TEXT NOT NULL,
                price_per_item INTEGER,
                total_price INTEGER,
                traded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                trade_type TEXT DEFAULT 'grand_exchange', -- 'grand_exchange', 'direct_trade'
                FOREIGN KEY (item_id) REFERENCES item_registry(item_id)
            );
            
            -- Item destruction log
            CREATE TABLE IF NOT EXISTS item_destruction_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                player_id TEXT NOT NULL,
                destruction_type TEXT, -- 'dropped', 'alched', 'used', 'quest'
                destroyed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES item_registry(item_id)
            );
            
            -- Indexes for performance
            CREATE INDEX IF NOT EXISTS idx_player_items ON player_items(player_id);
            CREATE INDEX IF NOT EXISTS idx_world_items_location ON world_items(location_x, location_y);
            CREATE INDEX IF NOT EXISTS idx_generation_source ON item_generation_log(source, source_id);
            CREATE INDEX IF NOT EXISTS idx_trading_players ON trading_history(seller_id, buyer_id);
        `);
        
        console.log('✅ Unified Item Database initialized');
        this.loadItemTotals();
    }
    
    /**
     * Register a new item type in the game
     */
    registerItem(itemData) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO item_registry 
            (item_id, item_name, category, rarity, base_value, max_stack, tradeable, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            itemData.id,
            itemData.name,
            itemData.category || 'misc',
            itemData.rarity || 'common',
            itemData.baseValue || 0,
            itemData.maxStack || 1,
            itemData.tradeable !== false ? 1 : 0,
            JSON.stringify(itemData.metadata || {})
        );
        
        // Initialize totals
        this.db.prepare(`
            INSERT OR IGNORE INTO item_totals (item_id) VALUES (?)
        `).run(itemData.id);
        
        this.totalItems.set(itemData.id, 0);
        
        console.log(`📦 Registered item: ${itemData.name} (${itemData.id})`);
    }
    
    /**
     * Generate item from drop (integrates with Differential RNG)
     */
    generateItem(dropData) {
        const {
            itemId,
            quantity = 1,
            source,
            sourceId,
            playerId,
            algorithm,
            rngValues
        } = dropData;
        
        // Log generation
        const stmt = this.db.prepare(`
            INSERT INTO item_generation_log 
            (item_id, quantity, source, source_id, generator, algorithm_snapshot, rng_values, player_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            itemId,
            quantity,
            source,
            sourceId,
            'differential_rng',
            algorithm || 'Standard drop calculation',
            JSON.stringify(rngValues || {}),
            playerId
        );
        
        // Update totals
        this.updateItemTotal(itemId, quantity, 'generate');
        
        // Drop to world first
        const worldDrop = this.dropToWorld({
            itemId,
            quantity,
            location: dropData.location,
            droppedBy: sourceId
        });
        
        this.emit('itemGenerated', {
            itemId,
            quantity,
            source,
            playerId,
            worldDropId: worldDrop.id
        });
        
        return {
            generationId: result.lastInsertRowid,
            worldDropId: worldDrop.id
        };
    }
    
    /**
     * Drop item to world (not picked up yet)
     */
    dropToWorld(dropData) {
        const stmt = this.db.prepare(`
            INSERT INTO world_items 
            (item_id, quantity, location_x, location_y, location_z, dropped_by, despawn_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const despawnTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
        
        const result = stmt.run(
            dropData.itemId,
            dropData.quantity,
            dropData.location?.x || 0,
            dropData.location?.y || 0,
            dropData.location?.z || 0,
            dropData.droppedBy,
            despawnTime.toISOString()
        );
        
        // Track in memory
        const worldItem = {
            id: result.lastInsertRowid,
            itemId: dropData.itemId,
            quantity: dropData.quantity,
            location: dropData.location,
            despawnAt: despawnTime
        };
        
        this.worldItems.set(worldItem.id, worldItem);
        
        // Update totals
        this.updateItemTotal(dropData.itemId, dropData.quantity, 'inWorld');
        
        return worldItem;
    }
    
    /**
     * Player picks up item from world
     */
    pickupItem(worldItemId, playerId) {
        const worldItem = this.db.prepare(`
            SELECT * FROM world_items WHERE id = ? AND picked_up = 0
        `).get(worldItemId);
        
        if (!worldItem) {
            return { success: false, error: 'Item not found or already picked up' };
        }
        
        // Mark as picked up
        this.db.prepare(`
            UPDATE world_items 
            SET picked_up = 1, picked_up_by = ?
            WHERE id = ?
        `).run(playerId, worldItemId);
        
        // Add to player inventory
        this.addToInventory(playerId, worldItem.item_id, worldItem.quantity, 'pickup');
        
        // Update totals
        this.updateItemTotal(worldItem.item_id, -worldItem.quantity, 'inWorld');
        
        // Remove from world items map
        this.worldItems.delete(worldItemId);
        
        this.emit('itemPickedUp', {
            worldItemId,
            itemId: worldItem.item_id,
            quantity: worldItem.quantity,
            playerId
        });
        
        return { success: true, itemId: worldItem.item_id, quantity: worldItem.quantity };
    }
    
    /**
     * Add item to player inventory
     */
    addToInventory(playerId, itemId, quantity, source = 'unknown') {
        // Check if player already has item
        const existing = this.db.prepare(`
            SELECT quantity FROM player_items 
            WHERE player_id = ? AND item_id = ?
        `).get(playerId, itemId);
        
        if (existing) {
            // Update quantity
            this.db.prepare(`
                UPDATE player_items 
                SET quantity = quantity + ?
                WHERE player_id = ? AND item_id = ?
            `).run(quantity, playerId, itemId);
        } else {
            // Insert new
            this.db.prepare(`
                INSERT INTO player_items 
                (player_id, item_id, quantity, obtained_from)
                VALUES (?, ?, ?, ?)
            `).run(playerId, itemId, quantity, source);
        }
        
        // Update memory map
        if (!this.playerInventories.has(playerId)) {
            this.playerInventories.set(playerId, new Map());
        }
        
        const inventory = this.playerInventories.get(playerId);
        const currentQty = inventory.get(itemId) || 0;
        inventory.set(itemId, currentQty + quantity);
        
        this.emit('inventoryUpdated', { playerId, itemId, quantity, source });
    }
    
    /**
     * Trade item between players (Grand Exchange integration)
     */
    tradeItem(tradeData) {
        const { itemId, quantity, sellerId, buyerId, pricePerItem } = tradeData;
        
        // Check seller has enough
        const sellerQty = this.getPlayerItemQuantity(sellerId, itemId);
        if (sellerQty < quantity) {
            return { success: false, error: 'Insufficient quantity' };
        }
        
        // Remove from seller
        this.removeFromInventory(sellerId, itemId, quantity);
        
        // Add to buyer
        this.addToInventory(buyerId, itemId, quantity, 'trade');
        
        // Log trade
        this.db.prepare(`
            INSERT INTO trading_history 
            (item_id, quantity, seller_id, buyer_id, price_per_item, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            itemId,
            quantity,
            sellerId,
            buyerId,
            pricePerItem,
            pricePerItem * quantity
        );
        
        this.emit('itemTraded', tradeData);
        
        return { success: true };
    }
    
    /**
     * Get player's quantity of specific item
     */
    getPlayerItemQuantity(playerId, itemId) {
        const result = this.db.prepare(`
            SELECT quantity FROM player_items 
            WHERE player_id = ? AND item_id = ?
        `).get(playerId, itemId);
        
        return result?.quantity || 0;
    }
    
    /**
     * Remove item from player inventory
     */
    removeFromInventory(playerId, itemId, quantity) {
        const current = this.getPlayerItemQuantity(playerId, itemId);
        
        if (current >= quantity) {
            if (current === quantity) {
                // Remove entirely
                this.db.prepare(`
                    DELETE FROM player_items 
                    WHERE player_id = ? AND item_id = ?
                `).run(playerId, itemId);
            } else {
                // Reduce quantity
                this.db.prepare(`
                    UPDATE player_items 
                    SET quantity = quantity - ?
                    WHERE player_id = ? AND item_id = ?
                `).run(quantity, playerId, itemId);
            }
            
            // Update memory map
            if (this.playerInventories.has(playerId)) {
                const inventory = this.playerInventories.get(playerId);
                const newQty = current - quantity;
                if (newQty <= 0) {
                    inventory.delete(itemId);
                } else {
                    inventory.set(itemId, newQty);
                }
            }
        }
    }
    
    /**
     * Update item totals
     */
    updateItemTotal(itemId, quantity, type) {
        const current = this.db.prepare(`
            SELECT * FROM item_totals WHERE item_id = ?
        `).get(itemId);
        
        if (!current) {
            this.db.prepare(`
                INSERT INTO item_totals (item_id) VALUES (?)
            `).run(itemId);
        }
        
        switch (type) {
            case 'generate':
                this.db.prepare(`
                    UPDATE item_totals 
                    SET total_quantity = total_quantity + ?,
                        in_world = in_world + ?
                    WHERE item_id = ?
                `).run(quantity, quantity, itemId);
                break;
                
            case 'inWorld':
                this.db.prepare(`
                    UPDATE item_totals 
                    SET in_world = in_world + ?
                    WHERE item_id = ?
                `).run(quantity, itemId);
                break;
                
            case 'pickup':
                this.db.prepare(`
                    UPDATE item_totals 
                    SET in_world = in_world - ?,
                        in_circulation = in_circulation + ?
                    WHERE item_id = ?
                `).run(quantity, quantity, itemId);
                break;
                
            case 'destroy':
                this.db.prepare(`
                    UPDATE item_totals 
                    SET in_circulation = in_circulation - ?,
                        destroyed = destroyed + ?
                    WHERE item_id = ?
                `).run(quantity, quantity, itemId);
                break;
        }
        
        // Update last_updated
        this.db.prepare(`
            UPDATE item_totals 
            SET last_updated = CURRENT_TIMESTAMP
            WHERE item_id = ?
        `).run(itemId);
    }
    
    /**
     * Load item totals into memory
     */
    loadItemTotals() {
        const totals = this.db.prepare(`
            SELECT item_id, total_quantity FROM item_totals
        `).all();
        
        for (const total of totals) {
            this.totalItems.set(total.item_id, total.total_quantity);
        }
        
        console.log(`📊 Loaded ${totals.length} item totals`);
    }
    
    /**
     * Get complete item statistics
     */
    getItemStats(itemId) {
        const stats = this.db.prepare(`
            SELECT 
                it.*,
                ir.item_name,
                ir.category,
                ir.rarity,
                COUNT(DISTINCT pi.player_id) as unique_owners,
                SUM(pi.quantity) as total_owned
            FROM item_totals it
            JOIN item_registry ir ON it.item_id = ir.item_id
            LEFT JOIN player_items pi ON it.item_id = pi.item_id
            WHERE it.item_id = ?
            GROUP BY it.item_id
        `).get(itemId);
        
        const recentTrades = this.db.prepare(`
            SELECT COUNT(*) as trade_count, AVG(price_per_item) as avg_price
            FROM trading_history
            WHERE item_id = ? AND traded_at > datetime('now', '-7 days')
        `).get(itemId);
        
        const dropSources = this.db.prepare(`
            SELECT source, source_id, COUNT(*) as drop_count, SUM(quantity) as total_dropped
            FROM item_generation_log
            WHERE item_id = ?
            GROUP BY source, source_id
            ORDER BY total_dropped DESC
            LIMIT 5
        `).all(itemId);
        
        return {
            ...stats,
            recentTrades,
            dropSources,
            economicHealth: this.calculateEconomicHealth(stats)
        };
    }
    
    /**
     * Calculate economic health of an item
     */
    calculateEconomicHealth(stats) {
        if (!stats) return 'unknown';
        
        const circulationRatio = stats.in_circulation / stats.total_quantity;
        const destructionRatio = stats.destroyed / stats.total_quantity;
        
        if (circulationRatio > 0.9 && destructionRatio < 0.1) {
            return 'oversupplied';
        } else if (circulationRatio < 0.5 && destructionRatio > 0.3) {
            return 'scarce';
        } else if (stats.unique_owners > 100 && circulationRatio > 0.7) {
            return 'healthy';
        } else {
            return 'developing';
        }
    }
    
    /**
     * Get world economy overview
     */
    getEconomyOverview() {
        const overview = {
            totalItems: this.db.prepare(`
                SELECT COUNT(*) as count FROM item_registry
            `).get().count,
            
            totalQuantity: this.db.prepare(`
                SELECT SUM(total_quantity) as sum FROM item_totals
            `).get().sum || 0,
            
            inCirculation: this.db.prepare(`
                SELECT SUM(in_circulation) as sum FROM item_totals
            `).get().sum || 0,
            
            inWorld: this.db.prepare(`
                SELECT SUM(in_world) as sum FROM item_totals
            `).get().sum || 0,
            
            destroyed: this.db.prepare(`
                SELECT SUM(destroyed) as sum FROM item_totals
            `).get().sum || 0,
            
            activeTraders: this.db.prepare(`
                SELECT COUNT(DISTINCT seller_id) + COUNT(DISTINCT buyer_id) as count
                FROM trading_history
                WHERE traded_at > datetime('now', '-7 days')
            `).get().count,
            
            recentTrades: this.db.prepare(`
                SELECT COUNT(*) as count
                FROM trading_history
                WHERE traded_at > datetime('now', '-24 hours')
            `).get().count
        };
        
        return overview;
    }
    
    /**
     * Clean up despawned world items
     */
    cleanupWorldItems() {
        const despawned = this.db.prepare(`
            DELETE FROM world_items
            WHERE picked_up = 0 AND despawn_at < datetime('now')
            RETURNING item_id, quantity
        `).all();
        
        // Update totals
        for (const item of despawned) {
            this.updateItemTotal(item.item_id, -item.quantity, 'inWorld');
            this.updateItemTotal(item.item_id, item.quantity, 'destroy');
        }
        
        console.log(`🧹 Cleaned up ${despawned.length} despawned items`);
        
        return despawned.length;
    }
}

// Export for integration
module.exports = UnifiedItemDatabase;

// CLI interface for testing
if (require.main === module) {
    const itemDB = new UnifiedItemDatabase();
    
    // Example: Register some items
    itemDB.registerItem({
        id: 'abyssal_whip',
        name: 'Abyssal Whip',
        category: 'weapon',
        rarity: 'rare',
        baseValue: 2500000,
        maxStack: 1,
        tradeable: true
    });
    
    itemDB.registerItem({
        id: 'shark',
        name: 'Shark',
        category: 'food',
        rarity: 'common',
        baseValue: 800,
        maxStack: 28,
        tradeable: true
    });
    
    // Example: Generate drop
    const drop = itemDB.generateItem({
        itemId: 'abyssal_whip',
        quantity: 1,
        source: 'boss_drop',
        sourceId: 'abyssal_demon',
        playerId: 'player123',
        algorithm: 'Base drop rate: 1/512, Player luck modifier: 1.2x',
        rngValues: { base: 0.001953125, modified: 0.00234375, roll: 0.0021 },
        location: { x: 100, y: 200, z: 0 }
    });
    
    console.log('Drop generated:', drop);
    
    // Example: Player picks up
    const pickup = itemDB.pickupItem(drop.worldDropId, 'player123');
    console.log('Pickup result:', pickup);
    
    // Show stats
    console.log('\nItem stats:', itemDB.getItemStats('abyssal_whip'));
    console.log('\nEconomy overview:', itemDB.getEconomyOverview());
}
#!/usr/bin/env node

/**
 * SAILING IDENTITY PREPARATION
 * 
 * Prepares identity slots and systems for the upcoming OSRS Sailing skill:
 * - New identity layers for sailing ranks
 * - Ship-based identity transitions
 * - Port authority verification
 * - Maritime codename generation
 * - Cross-ocean identity bridging
 */

const UniversalIdentityEncoder = require('./universal-identity-encoder.js');
const IdentityLootConnector = require('./identity-loot-connector.js');
const Database = require('better-sqlite3');
const crypto = require('crypto');

class SailingIdentityPreparation {
    constructor() {
        // Initialize systems
        this.identityEncoder = new UniversalIdentityEncoder();
        this.lootConnector = new IdentityLootConnector();
        
        // Sailing-specific database
        this.db = new Database('./sailing-identities.db');
        this.db.pragma('journal_mode = WAL');
        
        // Sailing rank hierarchy
        this.ranks = [
            { level: 1, title: 'Landlubber', privileges: ['dock_access'] },
            { level: 10, title: 'Deckhand', privileges: ['small_boats', 'coastal'] },
            { level: 25, title: 'Sailor', privileges: ['medium_ships', 'trade_routes'] },
            { level: 50, title: 'Navigator', privileges: ['large_ships', 'deep_ocean'] },
            { level: 75, title: 'Captain', privileges: ['command_crew', 'piracy'] },
            { level: 90, title: 'Admiral', privileges: ['fleet_command', 'naval_warfare'] },
            { level: 99, title: 'Sea Legend', privileges: ['legendary_ships', 'hidden_islands'] }
        ];
        
        // Ship types and their identity slots
        this.shipTypes = {
            rowboat: { slots: 1, minLevel: 1 },
            sloop: { slots: 3, minLevel: 10 },
            frigate: { slots: 7, minLevel: 25 },
            galleon: { slots: 12, minLevel: 50 },
            warship: { slots: 20, minLevel: 75 },
            leviathan: { slots: 30, minLevel: 90 }
        };
        
        // Port authorities (different identity verification zones)
        this.ports = [
            { name: 'Port Sarim', region: 'Asgarnia', authority: 'Royal Navy' },
            { name: 'Catherby', region: 'Kandarin', authority: 'Fishing Guild' },
            { name: 'Port Khazard', region: 'Kandarin', authority: 'Khazard Guard' },
            { name: 'Port Phasmatys', region: 'Morytania', authority: 'Ghost Captains' },
            { name: 'Mos Le\'Harmless', region: 'Pirate Haven', authority: 'Pirate Lords' }
        ];
        
        console.log('⛵ Sailing Identity Preparation System initializing...');
        this.initializeDatabase();
    }
    
    initializeDatabase() {
        // Sailing identities table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sailing_identities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_pid TEXT NOT NULL,
                sailing_level INTEGER DEFAULT 1,
                current_rank TEXT DEFAULT 'Landlubber',
                ship_name TEXT,
                ship_type TEXT,
                home_port TEXT,
                reputation TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_pid) REFERENCES identities(system_pid)
            )
        `);
        
        // Ship crew manifest (identity slots)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ship_crew (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ship_id TEXT NOT NULL,
                crew_pid TEXT NOT NULL,
                role TEXT NOT NULL,
                permissions TEXT DEFAULT '[]',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ship_id, crew_pid)
            )
        `);
        
        // Port authority records
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS port_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                port_name TEXT NOT NULL,
                visitor_pid TEXT NOT NULL,
                visit_type TEXT NOT NULL,
                cargo_manifest TEXT,
                authority_check TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Maritime achievements
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS maritime_achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_pid TEXT NOT NULL,
                achievement TEXT NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(player_pid, achievement)
            )
        `);
        
        console.log('🏗️ Sailing database initialized');
    }
    
    /**
     * Create sailing identity for player
     */
    async createSailingIdentity(playerPID, startingPort = 'Port Sarim') {
        console.log('\n⛵ Creating sailing identity...');
        
        // Generate sailing-specific codename
        const sailingCodename = this.generateSailingCodename();
        
        // Create identity in universal system
        const identity = await this.identityEncoder.createIdentity(
            sailingCodename,
            ['sailing', 'maritime', 'naval']
        );
        
        // Initialize sailing record
        const stmt = this.db.prepare(`
            INSERT INTO sailing_identities 
            (player_pid, sailing_level, current_rank, home_port, reputation)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const reputation = {};
        this.ports.forEach(port => {
            reputation[port.name] = 0; // Neutral starting reputation
        });
        
        stmt.run(playerPID, 1, 'Landlubber', startingPort, JSON.stringify(reputation));
        
        // Grant sailing context access
        await this.identityEncoder.grantLayerAccess(
            playerPID,
            playerPID,
            identity.systemPID,
            3,
            'sailing',
            null // Permanent
        );
        
        console.log(`✅ Sailing identity created: ${sailingCodename}`);
        console.log(`   Home port: ${startingPort}`);
        console.log(`   Starting rank: Landlubber`);
        
        return {
            sailingPID: identity.systemPID,
            codename: sailingCodename,
            homePort: startingPort,
            rank: 'Landlubber'
        };
    }
    
    /**
     * Generate sailing-specific codename
     */
    generateSailingCodename() {
        const prefixes = [
            'Captain', 'Sailor', 'Navigator', 'Bosun', 'Admiral',
            'Corsair', 'Buccaneer', 'Mariner', 'Skipper', 'Commodore'
        ];
        
        const suffixes = [
            'Stormwind', 'Seabreaker', 'Waverunner', 'Tidecaller', 'Saltbeard',
            'Ironhull', 'Swiftcurrent', 'Deepwater', 'Northwind', 'Goldensail'
        ];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix}_${suffix}`;
    }
    
    /**
     * Create or join ship (identity slot management)
     */
    async createShip(ownerPID, shipName, shipType = 'sloop') {
        console.log(`\n🚢 Creating ship: ${shipName}`);
        
        const shipConfig = this.shipTypes[shipType];
        if (!shipConfig) {
            return { error: 'Invalid ship type' };
        }
        
        // Check sailing level requirement
        const sailingRecord = this.db.prepare(
            'SELECT sailing_level FROM sailing_identities WHERE player_pid = ?'
        ).get(ownerPID);
        
        if (!sailingRecord || sailingRecord.sailing_level < shipConfig.minLevel) {
            return { error: `Requires sailing level ${shipConfig.minLevel}` };
        }
        
        // Create ship identity
        const shipID = `ship_${crypto.randomBytes(8).toString('hex')}`;
        
        // Add owner as captain
        const crewStmt = this.db.prepare(`
            INSERT INTO ship_crew (ship_id, crew_pid, role, permissions)
            VALUES (?, ?, ?, ?)
        `);
        
        crewStmt.run(
            shipID, 
            ownerPID, 
            'Captain',
            JSON.stringify(['all'])
        );
        
        // Update owner's ship info
        this.db.prepare(`
            UPDATE sailing_identities 
            SET ship_name = ?, ship_type = ?
            WHERE player_pid = ?
        `).run(shipName, shipType, ownerPID);
        
        console.log(`✅ Ship created: ${shipName} (${shipType})`);
        console.log(`   Identity slots: ${shipConfig.slots}`);
        console.log(`   Captain: ${ownerPID}`);
        
        return {
            shipID,
            shipName,
            shipType,
            slots: shipConfig.slots,
            crew: [{ pid: ownerPID, role: 'Captain' }]
        };
    }
    
    /**
     * Add crew member (grant identity slot)
     */
    async addCrewMember(shipID, newCrewPID, role = 'Sailor') {
        console.log(`\n👥 Adding crew member to ship ${shipID}`);
        
        // Check if ship has available slots
        const shipInfo = await this.getShipInfo(shipID);
        if (!shipInfo) {
            return { error: 'Ship not found' };
        }
        
        if (shipInfo.crew.length >= shipInfo.maxSlots) {
            return { error: 'Ship is at full capacity' };
        }
        
        // Add crew member
        const stmt = this.db.prepare(`
            INSERT INTO ship_crew (ship_id, crew_pid, role, permissions)
            VALUES (?, ?, ?, ?)
        `);
        
        const permissions = this.getRolePermissions(role);
        
        try {
            stmt.run(shipID, newCrewPID, role, JSON.stringify(permissions));
            
            // Grant identity access between crew members
            for (const member of shipInfo.crew) {
                await this.identityEncoder.grantLayerAccess(
                    member.pid,
                    newCrewPID,
                    member.pid,
                    1,
                    'sailing'
                );
                
                await this.identityEncoder.grantLayerAccess(
                    newCrewPID,
                    member.pid,
                    newCrewPID,
                    1,
                    'sailing'
                );
            }
            
            console.log(`✅ Crew member added: ${role}`);
            
            return {
                success: true,
                shipID,
                crewPID: newCrewPID,
                role,
                permissions
            };
            
        } catch (error) {
            return { error: 'Failed to add crew member' };
        }
    }
    
    /**
     * Get role-based permissions
     */
    getRolePermissions(role) {
        const permissions = {
            'Captain': ['navigate', 'dock', 'trade', 'combat', 'manage_crew'],
            'First Mate': ['navigate', 'dock', 'trade', 'manage_crew'],
            'Navigator': ['navigate', 'chart_course'],
            'Gunner': ['combat', 'weapons'],
            'Sailor': ['sail_handling', 'maintenance'],
            'Cook': ['provisions', 'morale'],
            'Lookout': ['navigation_assist', 'spotting']
        };
        
        return permissions[role] || ['basic'];
    }
    
    /**
     * Port authority check (identity verification)
     */
    async portAuthorityCheck(playerPID, portName, visitType = 'trade') {
        console.log(`\n🏛️ Port authority check at ${portName}`);
        
        const port = this.ports.find(p => p.name === portName);
        if (!port) {
            return { error: 'Unknown port' };
        }
        
        // Get player's sailing identity
        const sailingRecord = this.db.prepare(`
            SELECT * FROM sailing_identities WHERE player_pid = ?
        `).get(playerPID);
        
        if (!sailingRecord) {
            return { error: 'No sailing identity found' };
        }
        
        const reputation = JSON.parse(sailingRecord.reputation);
        const portRep = reputation[portName] || 0;
        
        // Authority decision based on reputation and visit type
        let authorized = false;
        let reason = '';
        
        if (visitType === 'trade' && portRep >= -50) {
            authorized = true;
            reason = 'Trade permitted';
        } else if (visitType === 'dock' && portRep >= -25) {
            authorized = true;
            reason = 'Docking permitted';
        } else if (visitType === 'recruit' && portRep >= 0) {
            authorized = true;
            reason = 'Recruitment permitted';
        } else if (visitType === 'piracy' && portName === 'Mos Le\'Harmless') {
            authorized = true;
            reason = 'Piracy tolerated here';
        } else {
            reason = `Insufficient reputation (${portRep})`;
        }
        
        // Record port visit
        const recordStmt = this.db.prepare(`
            INSERT INTO port_records 
            (port_name, visitor_pid, visit_type, authority_check)
            VALUES (?, ?, ?, ?)
        `);
        
        recordStmt.run(
            portName,
            playerPID,
            visitType,
            JSON.stringify({ authorized, reason, reputation: portRep })
        );
        
        console.log(`${authorized ? '✅' : '❌'} Authority check: ${reason}`);
        
        return {
            authorized,
            reason,
            port: portName,
            authority: port.authority,
            reputation: portRep
        };
    }
    
    /**
     * Update sailing level and rank
     */
    async updateSailingLevel(playerPID, newLevel) {
        console.log(`\n📈 Updating sailing level to ${newLevel}`);
        
        // Determine new rank
        let newRank = 'Landlubber';
        for (const rank of this.ranks.reverse()) {
            if (newLevel >= rank.level) {
                newRank = rank.title;
                break;
            }
        }
        
        // Update record
        this.db.prepare(`
            UPDATE sailing_identities 
            SET sailing_level = ?, current_rank = ?
            WHERE player_pid = ?
        `).run(newLevel, newRank, playerPID);
        
        // Check for achievements
        if (newLevel === 99) {
            await this.unlockAchievement(playerPID, 'sailing_mastery');
        }
        
        console.log(`✅ Sailing level updated: ${newLevel} (${newRank})`);
        
        return { level: newLevel, rank: newRank };
    }
    
    /**
     * Get ship information
     */
    async getShipInfo(shipID) {
        const crew = this.db.prepare(`
            SELECT * FROM ship_crew WHERE ship_id = ?
        `).all(shipID);
        
        if (crew.length === 0) return null;
        
        const captain = crew.find(c => c.role === 'Captain');
        const captainInfo = this.db.prepare(`
            SELECT ship_name, ship_type FROM sailing_identities WHERE player_pid = ?
        `).get(captain.crew_pid);
        
        const shipConfig = this.shipTypes[captainInfo.ship_type];
        
        return {
            shipID,
            name: captainInfo.ship_name,
            type: captainInfo.ship_type,
            maxSlots: shipConfig.slots,
            crew: crew.map(c => ({
                pid: c.crew_pid,
                role: c.role,
                permissions: JSON.parse(c.permissions)
            }))
        };
    }
    
    /**
     * Maritime achievement system
     */
    async unlockAchievement(playerPID, achievement) {
        try {
            this.db.prepare(`
                INSERT INTO maritime_achievements (player_pid, achievement)
                VALUES (?, ?)
            `).run(playerPID, achievement);
            
            console.log(`🏆 Achievement unlocked: ${achievement}`);
            return true;
        } catch (error) {
            // Already unlocked
            return false;
        }
    }
    
    /**
     * Prepare for sailing launch
     */
    async prepareForLaunch() {
        console.log('\n🚀 Preparing identity systems for Sailing skill launch...\n');
        
        const preparations = {
            databaseReady: true,
            identitySlotsConfigured: true,
            portsConfigured: this.ports.length,
            ranksConfigured: this.ranks.length,
            shipTypesReady: Object.keys(this.shipTypes).length,
            features: []
        };
        
        // List prepared features
        preparations.features.push('✅ Multi-layer sailing identities');
        preparations.features.push('✅ Ship-based identity slots');
        preparations.features.push('✅ Port authority verification');
        preparations.features.push('✅ Rank progression system');
        preparations.features.push('✅ Crew permission management');
        preparations.features.push('✅ Maritime achievement tracking');
        preparations.features.push('✅ Cross-port reputation system');
        
        console.log('📊 Sailing Identity Preparation Status:\n');
        preparations.features.forEach(feature => console.log(`   ${feature}`));
        
        console.log(`\n   Ports ready: ${preparations.portsConfigured}`);
        console.log(`   Ranks configured: ${preparations.ranksConfigured}`);
        console.log(`   Ship types: ${preparations.shipTypesReady}`);
        
        return preparations;
    }
}

// Export for use
module.exports = SailingIdentityPreparation;

// Demo functionality
if (require.main === module) {
    const sailing = new SailingIdentityPreparation();
    
    async function demonstrateSailingPrep() {
        console.log('\n⛵ Demonstrating Sailing Identity Preparation\n');
        
        // 1. Create sailing identity
        console.log('1. Creating sailing identity for player...');
        const playerPID = 'player_' + Date.now();
        const sailingIdentity = await sailing.createSailingIdentity(playerPID, 'Port Sarim');
        
        // 2. Create a ship
        console.log('\n2. Creating a ship...');
        await sailing.updateSailingLevel(playerPID, 10); // Level up to use sloop
        const ship = await sailing.createShip(playerPID, 'SS Document Generator', 'sloop');
        
        // 3. Add crew members
        console.log('\n3. Adding crew members...');
        const crew1 = 'crew_' + Date.now() + '_1';
        const crew2 = 'crew_' + Date.now() + '_2';
        
        await sailing.addCrewMember(ship.shipID, crew1, 'Navigator');
        await sailing.addCrewMember(ship.shipID, crew2, 'Gunner');
        
        // 4. Port authority checks
        console.log('\n4. Testing port authority...');
        await sailing.portAuthorityCheck(playerPID, 'Port Sarim', 'trade');
        await sailing.portAuthorityCheck(playerPID, 'Mos Le\'Harmless', 'piracy');
        
        // 5. Level progression
        console.log('\n5. Leveling up sailing...');
        await sailing.updateSailingLevel(playerPID, 50);
        await sailing.updateSailingLevel(playerPID, 99);
        
        // 6. System readiness
        console.log('\n6. Checking system readiness...');
        const readiness = await sailing.prepareForLaunch();
        
        console.log('\n✅ Sailing identity system ready for skill launch!');
    }
    
    demonstrateSailingPrep().catch(console.error);
}
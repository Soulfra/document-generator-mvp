#!/usr/bin/env node

/**
 * 🎯📡 SONAR BOSS DETECTOR
 * Real-time sonar visualization for boss battles and loot detection
 * Terminal-based radar display with threat assessment
 */

class SonarBossDetector {
    constructor(bossSystem, mudEngine) {
        this.bossSystem = bossSystem;
        this.mudEngine = mudEngine;
        
        this.contacts = new Map(); // contactId -> SonarContact
        this.scanRadius = 100;
        this.updateInterval = 2000; // 2 seconds
        
        this.threatLevels = {
            'low': { color: '\x1b[32m', symbol: '·', priority: 1 },      // Green
            'medium': { color: '\x1b[33m', symbol: '○', priority: 2 },   // Yellow  
            'high': { color: '\x1b[31m', symbol: '●', priority: 3 },     // Red
            'extreme': { color: '\x1b[35m', symbol: '◆', priority: 4 },  // Magenta
            'legendary': { color: '\x1b[36m', symbol: '★', priority: 5 } // Cyan
        };
        
        this.setupSonarIntegration();
        console.log('📡 Sonar Boss Detector initialized');
    }
    
    setupSonarIntegration() {
        // Listen for boss spawns
        this.bossSystem.on('boss_spawned', (battle) => {
            this.addSonarContact({
                id: battle.boss.id,
                type: 'boss',
                name: battle.boss.name,
                position: this.generateRandomPosition(),
                signature: battle.boss.sonarSignature,
                health: battle.boss.health / battle.boss.maxHealth,
                detected: Date.now(),
                status: 'active'
            });
        });
        
        // Listen for sonar updates from boss system
        this.bossSystem.on('sonar_update', (sonarData) => {
            this.updateSonarContact(sonarData.contact.id, {
                health: sonarData.health,
                participants: sonarData.participants,
                status: sonarData.status,
                lastSeen: sonarData.lastSeen
            });
        });
        
        // Listen for loot spawns
        if (this.mudEngine) {
            this.mudEngine.on('loot_spawn', (lootData) => {
                if (lootData.loot.rarity === 'rare' || 
                    lootData.loot.rarity === 'epic' || 
                    lootData.loot.rarity === 'legendary' ||
                    lootData.loot.rarity === 'mythic') {
                    
                    this.addSonarContact({
                        id: lootData.loot.id,
                        type: 'rare_loot',
                        name: lootData.loot.name,
                        position: this.generateRandomPosition(),
                        signature: {
                            size: 'small',
                            threat: lootData.loot.rarity,
                            color: this.getLootColor(lootData.loot.rarity)
                        },
                        detected: Date.now(),
                        status: 'available'
                    });
                }
            });
        }
        
        // Start sonar sweep
        this.startSonarSweep();
    }
    
    addSonarContact(contactData) {
        const contact = {
            ...contactData,
            bearing: this.calculateBearing(contactData.position),
            distance: this.calculateDistance(contactData.position),
            lastUpdate: Date.now()
        };
        
        this.contacts.set(contact.id, contact);
        this.broadcastSonarUpdate('new_contact', contact);
        
        console.log(`📡 New sonar contact: ${contact.name} (${contact.signature.threat} threat)`);
    }
    
    updateSonarContact(contactId, updates) {
        const contact = this.contacts.get(contactId);
        if (!contact) return;
        
        Object.assign(contact, updates, { lastUpdate: Date.now() });
        this.broadcastSonarUpdate('contact_update', contact);
    }
    
    removeSonarContact(contactId) {
        const contact = this.contacts.get(contactId);
        if (contact) {
            this.contacts.delete(contactId);
            this.broadcastSonarUpdate('contact_lost', contact);
            console.log(`📡 Lost contact: ${contact.name}`);
        }
    }
    
    startSonarSweep() {
        setInterval(() => {
            this.performSonarSweep();
        }, this.updateInterval);
        
        // Display initial sweep
        this.performSonarSweep();
    }
    
    performSonarSweep() {
        // Clean up old contacts (older than 5 minutes)
        const cutoffTime = Date.now() - 300000;
        const expiredContacts = [];
        
        this.contacts.forEach((contact, id) => {
            if (contact.lastUpdate < cutoffTime) {
                expiredContacts.push(id);
            }
        });
        
        expiredContacts.forEach(id => this.removeSonarContact(id));
        
        // Generate sonar display
        this.generateSonarDisplay();
        
        // Broadcast sweep complete
        this.broadcastSonarUpdate('sweep_complete', {
            contactCount: this.contacts.size,
            timestamp: Date.now()
        });
    }
    
    generateSonarDisplay() {
        const display = this.createSonarGrid();
        const contacts = this.getSortedContacts();
        
        console.clear();
        console.log('\n📡 BOSS BATTLE SONAR DISPLAY\n');
        console.log(display);
        console.log('\n🎯 ACTIVE CONTACTS:');
        
        contacts.forEach((contact, index) => {
            const threat = this.threatLevels[contact.signature.threat] || this.threatLevels.medium;
            const status = contact.status === 'active' ? '🔴 ACTIVE' : 
                          contact.status === 'available' ? '🟢 AVAILABLE' : '⚪ UNKNOWN';
            
            console.log(
                `${threat.color}${threat.symbol} ${contact.name}\x1b[0m ` +
                `| ${status} | Distance: ${contact.distance}m | Bearing: ${contact.bearing}°`
            );
            
            if (contact.type === 'boss' && contact.health !== undefined) {
                const healthBar = this.generateHealthBar(contact.health);
                console.log(`   Health: ${healthBar} ${Math.floor(contact.health * 100)}%`);
            }
            
            if (contact.participants) {
                console.log(`   Players engaged: ${contact.participants}`);
            }
        });
        
        console.log('\n📊 THREAT ASSESSMENT:');
        this.displayThreatSummary(contacts);
        
        console.log('\n⌨️ Commands: join, attack, boss, wallet, help');
        console.log('💬 Viewer commands: !cheer, !heal, !sabotage, !buff\n');
    }
    
    createSonarGrid() {
        const size = 21; // 21x21 grid
        const center = Math.floor(size / 2);
        const grid = Array(size).fill(null).map(() => Array(size).fill(' '));
        
        // Draw range circles
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance === 5 || distance === 10) {
                    grid[y][x] = '\x1b[90m·\x1b[0m'; // Dark gray range rings
                }
            }
        }
        
        // Place center (player location)
        grid[center][center] = '\x1b[32m@\x1b[0m'; // Green @ for player
        
        // Place contacts
        this.contacts.forEach(contact => {
            const gridPos = this.positionToGrid(contact.position, size, center);
            if (gridPos.x >= 0 && gridPos.x < size && gridPos.y >= 0 && gridPos.y < size) {
                const threat = this.threatLevels[contact.signature.threat] || this.threatLevels.medium;
                grid[gridPos.y][gridPos.x] = `${threat.color}${threat.symbol}\x1b[0m`;
            }
        });
        
        // Create display string
        let display = '┌─' + '─'.repeat(size * 2 - 1) + '─┐\n';
        for (let y = 0; y < size; y++) {
            display += '│ ' + grid[y].join(' ') + ' │\n';
        }
        display += '└─' + '─'.repeat(size * 2 - 1) + '─┘';
        
        return display;
    }
    
    positionToGrid(position, size, center) {
        // Convert world position to grid coordinates
        const gridX = center + Math.floor((position.x - 50) / 10); // Scale and offset
        const gridY = center + Math.floor((position.y - 50) / 10);
        
        return { x: gridX, y: gridY };
    }
    
    generateHealthBar(healthPercent) {
        const barLength = 10;
        const filledBars = Math.floor(healthPercent * barLength);
        const emptyBars = barLength - filledBars;
        
        let bar = '\x1b[32m'; // Green
        if (healthPercent < 0.3) bar = '\x1b[31m'; // Red
        else if (healthPercent < 0.6) bar = '\x1b[33m'; // Yellow
        
        bar += '█'.repeat(filledBars);
        bar += '\x1b[90m'; // Dark gray
        bar += '░'.repeat(emptyBars);
        bar += '\x1b[0m'; // Reset
        
        return bar;
    }
    
    getSortedContacts() {
        return Array.from(this.contacts.values())
            .sort((a, b) => {
                const aThreat = this.threatLevels[a.signature.threat]?.priority || 0;
                const bThreat = this.threatLevels[b.signature.threat]?.priority || 0;
                return bThreat - aThreat; // Highest threat first
            });
    }
    
    displayThreatSummary(contacts) {
        const summary = {};
        contacts.forEach(contact => {
            const threat = contact.signature.threat;
            summary[threat] = (summary[threat] || 0) + 1;
        });
        
        const totalThreat = Object.entries(summary)
            .reduce((total, [threat, count]) => {
                const priority = this.threatLevels[threat]?.priority || 0;
                return total + (priority * count);
            }, 0);
        
        let threatLevel = 'MINIMAL';
        if (totalThreat >= 20) threatLevel = 'EXTREME';
        else if (totalThreat >= 15) threatLevel = 'HIGH';
        else if (totalThreat >= 10) threatLevel = 'MODERATE';
        else if (totalThreat >= 5) threatLevel = 'LOW';
        
        console.log(`Overall Threat: ${threatLevel} (Score: ${totalThreat})`);
        
        Object.entries(summary).forEach(([threat, count]) => {
            const config = this.threatLevels[threat];
            if (config) {
                console.log(`${config.color}${config.symbol} ${threat.toUpperCase()}: ${count}\x1b[0m`);
            }
        });
    }
    
    // Utility functions
    generateRandomPosition() {
        return {
            x: Math.random() * 100,
            y: Math.random() * 100
        };
    }
    
    calculateBearing(position) {
        const dx = position.x - 50; // Center is at 50,50
        const dy = position.y - 50;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return Math.floor((angle + 360) % 360);
    }
    
    calculateDistance(position) {
        const dx = position.x - 50;
        const dy = position.y - 50;
        return Math.floor(Math.sqrt(dx * dx + dy * dy));
    }
    
    getLootColor(rarity) {
        const colors = {
            'rare': '#0099ff',
            'epic': '#9933ff', 
            'legendary': '#ff9900',
            'mythic': '#ff0066'
        };
        return colors[rarity] || '#ffffff';
    }
    
    broadcastSonarUpdate(eventType, data) {
        // In a real system, this would send to connected clients
        // For now, just emit event for other systems
        if (this.mudEngine && this.mudEngine.emit) {
            this.mudEngine.emit('sonar_event', {
                type: eventType,
                data: data,
                timestamp: Date.now()
            });
        }
    }
    
    // Public API methods
    getActiveContacts() {
        return Array.from(this.contacts.values())
            .filter(contact => contact.status === 'active');
    }
    
    getContactsInRange(range = 50) {
        return Array.from(this.contacts.values())
            .filter(contact => contact.distance <= range);
    }
    
    getThreatAssessment() {
        const contacts = Array.from(this.contacts.values());
        const totalThreat = contacts.reduce((total, contact) => {
            const priority = this.threatLevels[contact.signature.threat]?.priority || 0;
            return total + priority;
        }, 0);
        
        return {
            totalContacts: contacts.length,
            threatScore: totalThreat,
            highestThreat: contacts.reduce((max, contact) => {
                const priority = this.threatLevels[contact.signature.threat]?.priority || 0;
                return priority > max ? priority : max;
            }, 0)
        };
    }
}

module.exports = SonarBossDetector;
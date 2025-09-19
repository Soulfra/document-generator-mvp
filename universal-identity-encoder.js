#!/usr/bin/env node

/**
 * UNIVERSAL IDENTITY ENCODER
 * 
 * Multi-layer identity system where:
 * - Public Layer: Codenames like "Roughsparks" (visible to all)
 * - Private Layer: Real names like "Matthew Michael Mauer" (encrypted)
 * - System Layer: PIDs, hashes, unique identifiers
 * 
 * Same person/item appears different based on:
 * - Layer depth (which decoder has access)
 * - Context (gaming vs business vs social)
 * - Engine type (Hollowtown vs Bozo vs Music encoder)
 */

const crypto = require('crypto');
const Database = require('better-sqlite3');
const EventEmitter = require('events');

// Import existing encoders
const HollowtownLayerSystem = require('./hollowtown-layer-system.js');

class UniversalIdentityEncoder extends EventEmitter {
    constructor() {
        super();
        
        // Initialize database for identity mappings
        this.db = new Database('./identity-layers.db');
        this.db.pragma('journal_mode = WAL');
        
        // Layer definitions
        this.layers = {
            public: { level: 0, name: 'Public Codename Layer' },
            gaming: { level: 1, name: 'Gaming Identity Layer' },
            business: { level: 2, name: 'Business Identity Layer' },
            social: { level: 3, name: 'Social Identity Layer' },
            system: { level: 4, name: 'System Identifier Layer' },
            private: { level: 5, name: 'Private Identity Layer' },
            admin: { level: 99, name: 'Admin Full Access Layer' }
        };
        
        // Context encoders
        this.contextEncoders = new Map();
        this.codenameGenerators = new Map();
        
        // Initialize subsystems
        this.hollowtownSystem = new HollowtownLayerSystem();
        
        console.log('🎭 Universal Identity Encoder initializing...');
        this.initializeDatabase();
        this.initializeEncoders();
    }
    
    initializeDatabase() {
        // Master identity table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS identities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                system_pid TEXT UNIQUE NOT NULL,
                identity_hash TEXT UNIQUE NOT NULL,
                private_name TEXT,
                encrypted_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Codename mappings per context
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS codenames (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                system_pid TEXT NOT NULL,
                context TEXT NOT NULL,
                codename TEXT NOT NULL,
                display_properties TEXT,
                active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (system_pid) REFERENCES identities(system_pid),
                UNIQUE(system_pid, context)
            )
        `);
        
        // Layer access permissions
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS layer_access (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                requester_pid TEXT NOT NULL,
                target_pid TEXT NOT NULL,
                layer_level INTEGER NOT NULL,
                context TEXT NOT NULL,
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                UNIQUE(requester_pid, target_pid, context)
            )
        `);
        
        // Identity transitions (for items/characters)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS identity_transitions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_pid TEXT NOT NULL,
                to_pid TEXT NOT NULL,
                transition_type TEXT NOT NULL,
                context TEXT NOT NULL,
                metadata TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('📊 Identity database initialized');
    }
    
    initializeEncoders() {
        // Gaming context codename generators
        this.codenameGenerators.set('gaming', {
            prefixes: ['Shadow', 'Storm', 'Iron', 'Dark', 'Mystic', 'Rough', 'Wild', 'Silent'],
            suffixes: ['spark', 'blade', 'hunter', 'walker', 'seeker', 'master', 'knight', 'guard'],
            generate: function() {
                const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
                const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
                return prefix + suffix;
            }
        });
        
        // Business context codename generators
        this.codenameGenerators.set('business', {
            formats: ['Project-####', 'Client-@@@@', 'Partner-$$$$', 'Vendor-%%%%'],
            generate: function() {
                const format = this.formats[Math.floor(Math.random() * this.formats.length)];
                return format
                    .replace(/####/g, Math.floor(Math.random() * 10000).toString().padStart(4, '0'))
                    .replace(/@@@@/g, crypto.randomBytes(2).toString('hex').toUpperCase())
                    .replace(/\$\$\$\$/g, 'B' + Math.floor(Math.random() * 1000))
                    .replace(/%%%%/g, 'V' + Date.now().toString().slice(-4));
            }
        });
        
        // Social context codename generators
        this.codenameGenerators.set('social', {
            adjectives: ['Happy', 'Friendly', 'Curious', 'Creative', 'Helpful', 'Wise'],
            nouns: ['Panda', 'Eagle', 'Dragon', 'Phoenix', 'Tiger', 'Wolf'],
            generate: function() {
                const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
                const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
                const num = Math.floor(Math.random() * 100);
                return `${adj}${noun}${num}`;
            }
        });
        
        // Sailing context (preparing for OSRS update)
        this.codenameGenerators.set('sailing', {
            ranks: ['Landlubber', 'Swabbie', 'Sailor', 'Navigator', 'Captain', 'Admiral'],
            ships: ['Sloop', 'Frigate', 'Galleon', 'Kraken', 'Leviathan', 'Poseidon'],
            generate: function() {
                const rank = this.ranks[Math.floor(Math.random() * this.ranks.length)];
                const ship = this.ships[Math.floor(Math.random() * this.ships.length)];
                return `${rank}_of_${ship}`;
            }
        });
        
        // Maritime context (ocean and sea-related)
        this.codenameGenerators.set('maritime', {
            prefixes: ['Wave', 'Tide', 'Ocean', 'Sea', 'Coral', 'Pearl', 'Storm', 'Current'],
            suffixes: ['rider', 'walker', 'singer', 'dancer', 'keeper', 'watcher', 'caller', 'breaker'],
            generate: function() {
                const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
                const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
                return `${prefix}${suffix}`;
            }
        });
        
        // Naval context (military/fleet)
        this.codenameGenerators.set('naval', {
            titles: ['Commander', 'Lieutenant', 'Ensign', 'Midshipman', 'Quartermaster'],
            vessels: ['Dreadnought', 'Destroyer', 'Cruiser', 'Battleship', 'Carrier'],
            generate: function() {
                const title = this.titles[Math.floor(Math.random() * this.titles.length)];
                const vessel = this.vessels[Math.floor(Math.random() * this.vessels.length)];
                const num = Math.floor(Math.random() * 100);
                return `${title}-${vessel}-${num}`;
            }
        });
        
        // Cartography context (map-making)
        this.codenameGenerators.set('cartography', {
            tools: ['Compass', 'Sextant', 'Astrolabe', 'Chart', 'Map'],
            features: ['Island', 'Reef', 'Strait', 'Bay', 'Cape'],
            generate: function() {
                const tool = this.tools[Math.floor(Math.random() * this.tools.length)];
                const feature = this.features[Math.floor(Math.random() * this.features.length)];
                return `${tool}_${feature}`;
            }
        });
        
        // Command context (leadership)
        this.codenameGenerators.set('command', {
            ranks: ['Chief', 'Master', 'Senior', 'Lead', 'Prime'],
            roles: ['Strategist', 'Tactician', 'Coordinator', 'Director', 'Overseer'],
            generate: function() {
                const rank = this.ranks[Math.floor(Math.random() * this.ranks.length)];
                const role = this.roles[Math.floor(Math.random() * this.roles.length)];
                return `${rank}_${role}`;
            }
        });
        
        // Fishing context (OSRS fishing skill)
        this.codenameGenerators.set('fishing', {
            prefixes: ['Master', 'Expert', 'Skilled', 'Noble', 'Ancient', 'Deep'],
            activities: ['Angler', 'Fisher', 'Caster', 'Netter', 'Trawler', 'Hunter'],
            locations: ['Barbarian', 'Catherby', 'Karamja', 'Piscarilius', 'Deep_Sea', 'Wilderness'],
            generate: function() {
                const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
                const activity = this.activities[Math.floor(Math.random() * this.activities.length)];
                const location = this.locations[Math.floor(Math.random() * this.locations.length)];
                return `${prefix}_${activity}_of_${location}`;
            }
        });
        
        console.log('🎨 Context encoders initialized');
    }
    
    /**
     * Create new identity with all layers
     */
    async createIdentity(privateName, contexts = ['gaming', 'business', 'social']) {
        console.log(`🎭 Creating new identity for: [REDACTED]`);
        
        // Generate system identifiers
        const systemPID = this.generateSystemPID();
        const identityHash = this.generateIdentityHash(privateName, systemPID);
        
        // Encrypt private data
        const encryptedData = this.encryptPrivateData({
            name: privateName,
            created: Date.now(),
            metadata: {
                version: '1.0.0',
                encoder: 'universal-identity-encoder'
            }
        });
        
        // Store master identity
        const stmt = this.db.prepare(`
            INSERT INTO identities (system_pid, identity_hash, private_name, encrypted_data)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(systemPID, identityHash, null, encryptedData); // private_name stored encrypted only
        
        // Generate codenames for each context
        const codenames = {};
        for (const context of contexts) {
            const codename = await this.generateCodename(systemPID, context);
            codenames[context] = codename;
        }
        
        // Emit identity creation event
        this.emit('identityCreated', {
            systemPID,
            codenames,
            contexts,
            timestamp: Date.now()
        });
        
        return {
            systemPID,
            identityHash,
            codenames,
            message: 'Identity created successfully'
        };
    }
    
    /**
     * Generate unique system PID
     */
    generateSystemPID() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `PID_${timestamp}_${random}`;
    }
    
    /**
     * Generate identity hash (unchangeable identifier)
     */
    generateIdentityHash(privateName, systemPID) {
        const data = `${privateName}:${systemPID}:${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    /**
     * Encrypt private data
     */
    encryptPrivateData(data) {
        const algorithm = 'aes-256-gcm';
        const key = this.getEncryptionKey();
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return JSON.stringify({
            encrypted,
            authTag: authTag.toString('hex'),
            iv: iv.toString('hex')
        });
    }
    
    /**
     * Decrypt private data
     */
    decryptPrivateData(encryptedData) {
        const algorithm = 'aes-256-gcm';
        const key = this.getEncryptionKey();
        
        const data = JSON.parse(encryptedData);
        const decipher = crypto.createDecipheriv(
            algorithm, 
            key, 
            Buffer.from(data.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
        
        let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
    
    /**
     * Get encryption key (in production, use secure key management)
     */
    getEncryptionKey() {
        // In production, this would come from secure storage
        const masterKey = process.env.IDENTITY_MASTER_KEY || 'default-development-key-32-chars';
        return crypto.scryptSync(masterKey, 'salt', 32);
    }
    
    /**
     * Generate codename for specific context
     */
    async generateCodename(systemPID, context) {
        // Check if codename already exists
        const existing = this.db.prepare(`
            SELECT codename FROM codenames 
            WHERE system_pid = ? AND context = ? AND active = 1
        `).get(systemPID, context);
        
        if (existing) {
            return existing.codename;
        }
        
        // Generate new codename
        const generator = this.codenameGenerators.get(context);
        if (!generator) {
            throw new Error(`No codename generator for context: ${context}`);
        }
        
        let codename;
        let attempts = 0;
        
        // Ensure uniqueness
        do {
            codename = generator.generate();
            const exists = this.db.prepare(`
                SELECT COUNT(*) as count FROM codenames 
                WHERE codename = ? AND context = ?
            `).get(codename, context);
            
            if (exists.count === 0) break;
            attempts++;
        } while (attempts < 100);
        
        // Store codename
        const stmt = this.db.prepare(`
            INSERT INTO codenames (system_pid, context, codename, display_properties)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(systemPID, context, codename, JSON.stringify({
            generated: Date.now(),
            generator: context,
            version: '1.0'
        }));
        
        return codename;
    }
    
    /**
     * Get identity based on layer access
     */
    async getIdentity(targetPID, requesterPID, context, layerLevel = 0) {
        console.log(`🔍 Identity request: Layer ${layerLevel} in ${context} context`);
        
        // Check access permissions
        const hasAccess = await this.checkLayerAccess(requesterPID, targetPID, layerLevel, context);
        
        if (!hasAccess && layerLevel > 0) {
            return {
                error: 'Access denied',
                allowedLayer: 0,
                hint: 'Only public layer accessible'
            };
        }
        
        // Get base identity
        const identity = this.db.prepare(`
            SELECT * FROM identities WHERE system_pid = ?
        `).get(targetPID);
        
        if (!identity) {
            return { error: 'Identity not found' };
        }
        
        // Build response based on layer access
        const response = {
            systemPID: targetPID,
            context,
            layerLevel,
            timestamp: Date.now()
        };
        
        // Layer 0: Public codename only
        if (layerLevel >= 0) {
            const codename = this.db.prepare(`
                SELECT codename FROM codenames 
                WHERE system_pid = ? AND context = ? AND active = 1
            `).get(targetPID, context);
            
            response.publicName = codename ? codename.codename : 'Anonymous';
        }
        
        // Layer 1-3: Context-specific data
        if (layerLevel >= 1 && layerLevel <= 3) {
            response.contextData = this.getContextData(targetPID, context, layerLevel);
        }
        
        // Layer 4: System identifiers
        if (layerLevel >= 4) {
            response.identityHash = identity.identity_hash;
            response.createdAt = identity.created_at;
            response.systemMetadata = {
                pid: targetPID,
                hash: identity.identity_hash,
                context: context
            };
        }
        
        // Layer 5: Private data (requires special permission)
        if (layerLevel >= 5) {
            try {
                const privateData = this.decryptPrivateData(identity.encrypted_data);
                response.privateName = privateData.name;
                response.privateMetadata = privateData.metadata;
            } catch (error) {
                response.privateDataError = 'Decryption failed';
            }
        }
        
        // Layer 99: Admin full access
        if (layerLevel >= 99) {
            response.fullRecord = identity;
            response.allCodenames = this.db.prepare(`
                SELECT * FROM codenames WHERE system_pid = ?
            `).all(targetPID);
            response.accessLog = this.db.prepare(`
                SELECT * FROM layer_access WHERE target_pid = ?
            `).all(targetPID);
        }
        
        // Update last accessed
        this.db.prepare(`
            UPDATE identities SET last_accessed = CURRENT_TIMESTAMP WHERE system_pid = ?
        `).run(targetPID);
        
        return response;
    }
    
    /**
     * Check layer access permissions
     */
    async checkLayerAccess(requesterPID, targetPID, layerLevel, context) {
        // Self-access always allowed
        if (requesterPID === targetPID) return true;
        
        // Public layer always accessible
        if (layerLevel === 0) return true;
        
        // Check specific permissions
        const permission = this.db.prepare(`
            SELECT * FROM layer_access 
            WHERE requester_pid = ? AND target_pid = ? AND context = ?
            AND layer_level >= ?
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        `).get(requesterPID, targetPID, context, layerLevel);
        
        return !!permission;
    }
    
    /**
     * Grant layer access
     */
    async grantLayerAccess(granterPID, requesterPID, targetPID, layerLevel, context, expiresIn = null) {
        // Verify granter has permission to grant
        const granterAccess = await this.checkLayerAccess(granterPID, targetPID, layerLevel, context);
        if (!granterAccess && granterPID !== targetPID) {
            return { error: 'Granter lacks permission to grant this access' };
        }
        
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null;
        
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO layer_access 
            (requester_pid, target_pid, layer_level, context, granted_at, expires_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        `);
        
        stmt.run(requesterPID, targetPID, layerLevel, context, expiresAt);
        
        this.emit('accessGranted', {
            granterPID,
            requesterPID,
            targetPID,
            layerLevel,
            context,
            expiresAt
        });
        
        return { success: true, expiresAt };
    }
    
    /**
     * Get context-specific data
     */
    getContextData(systemPID, context, layerLevel) {
        const contextData = {};
        
        switch (context) {
            case 'gaming':
                if (layerLevel >= 1) {
                    contextData.stats = { level: 99, experience: 13034431 };
                    contextData.achievements = ['Quest Cape', 'Max Cape'];
                }
                break;
                
            case 'business':
                if (layerLevel >= 2) {
                    contextData.role = 'Developer';
                    contextData.department = 'Engineering';
                }
                break;
                
            case 'social':
                if (layerLevel >= 3) {
                    contextData.interests = ['Gaming', 'Coding', 'Music'];
                    contextData.status = 'Online';
                }
                break;
                
            case 'sailing':
                if (layerLevel >= 1) {
                    contextData.rank = 'Captain';
                    contextData.ship = 'SS Document Generator';
                    contextData.voyages = 42;
                }
                break;
        }
        
        return contextData;
    }
    
    /**
     * Apply Hollowtown encoding to identity
     */
    async encodeWithHollowtown(systemPID, message, context = 'hollowtown') {
        const identity = await this.getIdentity(systemPID, systemPID, context, 0);
        
        if (!identity.publicName) {
            return { error: 'Identity not found' };
        }
        
        // Use Hollowtown encoder
        const encoded = await this.hollowtownSystem.encode(message, context);
        
        return {
            from: identity.publicName,
            encoded: encoded.encoded,
            context: encoded.context,
            decoder: encoded.decoder
        };
    }
    
    /**
     * Transition identity (for items/characters)
     */
    async transitionIdentity(fromPID, toPID, transitionType, context, metadata = {}) {
        const stmt = this.db.prepare(`
            INSERT INTO identity_transitions 
            (from_pid, to_pid, transition_type, context, metadata)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(fromPID, toPID, transitionType, context, JSON.stringify(metadata));
        
        this.emit('identityTransitioned', {
            fromPID,
            toPID,
            transitionType,
            context,
            metadata,
            timestamp: Date.now()
        });
        
        return { success: true, transitionId: stmt.lastInsertRowid };
    }
    
    /**
     * Get identity history (for items)
     */
    async getIdentityHistory(systemPID) {
        const transitions = this.db.prepare(`
            SELECT * FROM identity_transitions 
            WHERE from_pid = ? OR to_pid = ?
            ORDER BY timestamp DESC
        `).all(systemPID, systemPID);
        
        return {
            systemPID,
            transitions,
            count: transitions.length
        };
    }
}

// Export for use
module.exports = UniversalIdentityEncoder;

// CLI testing
if (require.main === module) {
    const encoder = new UniversalIdentityEncoder();
    
    async function testIdentitySystem() {
        console.log('\n🧪 Testing Universal Identity Encoder\n');
        
        // Create new identity
        console.log('1. Creating new identity...');
        const identity = await encoder.createIdentity('Matthew Michael Mauer', ['gaming', 'business', 'social', 'sailing']);
        console.log('Created:', identity);
        
        // Test different layer access
        console.log('\n2. Testing layer access...');
        
        // Public layer (anyone can see)
        const publicView = await encoder.getIdentity(identity.systemPID, 'random_user', 'gaming', 0);
        console.log('Public view:', publicView);
        
        // System layer (need permission)
        const systemView = await encoder.getIdentity(identity.systemPID, identity.systemPID, 'gaming', 4);
        console.log('System view:', systemView);
        
        // Private layer (highest permission)
        const privateView = await encoder.getIdentity(identity.systemPID, identity.systemPID, 'gaming', 5);
        console.log('Private view:', privateView);
        
        // Test Hollowtown encoding
        console.log('\n3. Testing Hollowtown encoding...');
        const encoded = await encoder.encodeWithHollowtown(identity.systemPID, 'Secret message', 'hollowtown');
        console.log('Encoded message:', encoded);
        
        // Test access granting
        console.log('\n4. Testing access granting...');
        const otherUser = await encoder.createIdentity('Test User', ['gaming']);
        await encoder.grantLayerAccess(
            identity.systemPID, 
            otherUser.systemPID, 
            identity.systemPID, 
            2, 
            'gaming', 
            60000 // 1 minute
        );
        
        const grantedView = await encoder.getIdentity(identity.systemPID, otherUser.systemPID, 'gaming', 2);
        console.log('Granted view:', grantedView);
    }
    
    testIdentitySystem().catch(console.error);
}
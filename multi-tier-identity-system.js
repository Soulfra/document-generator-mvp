#!/usr/bin/env node

/**
 * MULTI-TIER PLAYER IDENTITY SYSTEM
 * Separates real identity from gaming personas while enabling franchise participation
 * 
 * Identity Layers:
 * 1. Real Identity - Legal compliance, KYC, age verification
 * 2. Business Identity - Franchise participation, earnings, tax info
 * 3. Gaming Identity - Tournament character, persistent progression
 * 4. Display Identity - Twitter handles, memes, showboat names
 */

const crypto = require('crypto');
const { Pool } = require('pg');

class MultiTierIdentitySystem {
    constructor() {
        this.port = 42007;
        
        // Database connection
        this.db = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'document_generator',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres'
        });
        
        // Identity verification levels
        this.verificationLevels = {
            NONE: 0,           // Anonymous player
            EMAIL: 1,          // Email verified
            PHONE: 2,          // Phone verified
            KYC_BASIC: 3,      // Basic KYC (name, DOB, address)
            KYC_ENHANCED: 4,   // Enhanced KYC (government ID)
            FRANCHISE_READY: 5 // Full business verification
        };
        
        // Privacy settings
        this.privacyLevels = {
            PUBLIC: 'public',           // Everyone can see
            PARTICIPANTS: 'participants', // Tournament participants only
            BUSINESS: 'business',       // Business contacts only
            PRIVATE: 'private'          // User only
        };
        
        console.log('🎭 Multi-Tier Identity System initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            await this.setupDatabase();
            await this.setupServer();
            console.log('✅ Multi-Tier Identity System ready');
            console.log(`🌐 Identity Service: http://localhost:${this.port}`);
        } catch (error) {
            console.error('❌ Identity system initialization failed:', error);
        }
    }
    
    async setupDatabase() {
        console.log('📊 Setting up identity database schema...');
        
        // Real Identity Layer - Legal compliance
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS real_identities (
                id SERIAL PRIMARY KEY,
                user_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                
                -- Legal information
                legal_first_name VARCHAR(100),
                legal_last_name VARCHAR(100),
                date_of_birth DATE,
                ssn_hash VARCHAR(64), -- Hashed for privacy
                
                -- Contact information
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(20),
                address JSONB,
                
                -- Verification status
                verification_level INTEGER DEFAULT 0,
                verification_documents JSONB DEFAULT '[]',
                kyc_provider VARCHAR(50),
                kyc_reference_id VARCHAR(100),
                
                -- Legal agreements
                terms_accepted_at TIMESTAMP,
                privacy_policy_version VARCHAR(10),
                franchise_agreement_signed BOOLEAN DEFAULT FALSE,
                
                -- Compliance tracking
                compliance_status JSONB DEFAULT '{}',
                risk_score INTEGER DEFAULT 0,
                sanctions_check_passed BOOLEAN,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Business Identity Layer - Franchise participation
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS business_identities (
                id SERIAL PRIMARY KEY,
                real_identity_id INTEGER REFERENCES real_identities(id),
                business_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                
                -- Business information
                business_name VARCHAR(255),
                business_entity_type VARCHAR(50), -- LLC, Corp, Sole Prop
                tax_id VARCHAR(20),
                business_address JSONB,
                
                -- Franchise details
                franchise_package VARCHAR(50), -- starter, gaming, enterprise
                territory_codes VARCHAR(255)[], -- Geographic territories
                franchise_fee_paid DECIMAL(10,2) DEFAULT 0,
                monthly_royalty_rate DECIMAL(5,2) DEFAULT 0,
                
                -- Financial tracking
                revenue_sharing_percentage DECIMAL(5,2) DEFAULT 0,
                lifetime_revenue DECIMAL(15,2) DEFAULT 0,
                lifetime_royalties DECIMAL(15,2) DEFAULT 0,
                tax_year_revenue DECIMAL(15,2) DEFAULT 0,
                
                -- Business status
                franchise_status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, terminated
                compliance_score INTEGER DEFAULT 0,
                performance_metrics JSONB DEFAULT '{}',
                
                -- Banking and payment
                banking_info_encrypted TEXT,
                payment_processor VARCHAR(50),
                escrow_account_id VARCHAR(100),
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Gaming Identity Layer - Tournament character
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS gaming_identities (
                id SERIAL PRIMARY KEY,
                real_identity_id INTEGER REFERENCES real_identities(id),
                gaming_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                
                -- Gaming persona
                character_name VARCHAR(50) UNIQUE NOT NULL,
                character_class VARCHAR(30),
                character_avatar_url VARCHAR(255),
                character_bio TEXT,
                
                -- Tournament stats
                total_tournaments INTEGER DEFAULT 0,
                tournaments_won INTEGER DEFAULT 0,
                win_rate DECIMAL(5,2) DEFAULT 0,
                tournament_earnings DECIMAL(15,2) DEFAULT 0,
                highest_streak INTEGER DEFAULT 0,
                
                -- Skill progression
                overall_level INTEGER DEFAULT 1,
                experience_points BIGINT DEFAULT 0,
                skill_points INTEGER DEFAULT 0,
                specializations VARCHAR(50)[] DEFAULT '{}',
                
                -- Genetic lineage
                parent_dna VARCHAR(16),
                genetic_traits JSONB DEFAULT '{}',
                offspring_count INTEGER DEFAULT 0,
                generation INTEGER DEFAULT 1,
                
                -- Character status
                active BOOLEAN DEFAULT TRUE,
                energy INTEGER DEFAULT 100,
                next_tournament_eligible TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Display Identity Layer - Public personas
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS display_identities (
                id SERIAL PRIMARY KEY,
                gaming_identity_id INTEGER REFERENCES gaming_identities(id),
                display_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                
                -- Public display info
                display_name VARCHAR(50) NOT NULL,
                display_type VARCHAR(30), -- twitter, discord, meme, showboat, highscore
                display_description TEXT,
                display_avatar_url VARCHAR(255),
                
                -- Social connections
                social_platform VARCHAR(30),
                social_username VARCHAR(100),
                social_profile_url VARCHAR(255),
                social_verified BOOLEAN DEFAULT FALSE,
                
                -- Display preferences
                privacy_level VARCHAR(20) DEFAULT 'public',
                show_in_leaderboards BOOLEAN DEFAULT TRUE,
                show_tournament_history BOOLEAN DEFAULT TRUE,
                show_earnings BOOLEAN DEFAULT FALSE,
                
                -- Context usage
                primary_display BOOLEAN DEFAULT FALSE,
                tournament_display BOOLEAN DEFAULT FALSE,
                business_display BOOLEAN DEFAULT FALSE,
                
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Privacy controls and permissions
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS identity_privacy_settings (
                id SERIAL PRIMARY KEY,
                real_identity_id INTEGER REFERENCES real_identities(id),
                
                -- Layer visibility controls
                show_real_name VARCHAR(20) DEFAULT 'private',
                show_business_info VARCHAR(20) DEFAULT 'business',
                show_gaming_stats VARCHAR(20) DEFAULT 'participants',
                show_earnings VARCHAR(20) DEFAULT 'private',
                
                -- Cross-layer linking permissions
                allow_business_gaming_link BOOLEAN DEFAULT FALSE,
                allow_social_gaming_link BOOLEAN DEFAULT TRUE,
                allow_tournament_broadcast BOOLEAN DEFAULT TRUE,
                
                -- Data retention preferences
                data_retention_years INTEGER DEFAULT 7,
                auto_delete_after_inactivity BOOLEAN DEFAULT FALSE,
                
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Identity audit trail
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS identity_audit_log (
                id SERIAL PRIMARY KEY,
                identity_uuid UUID NOT NULL,
                identity_type VARCHAR(20) NOT NULL, -- real, business, gaming, display
                
                action VARCHAR(50) NOT NULL,
                changed_fields JSONB,
                previous_values JSONB,
                new_values JSONB,
                
                performed_by UUID,
                ip_address INET,
                user_agent TEXT,
                
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('   ✅ Identity database schema created');
    }
    
    async setupServer() {
        const http = require('http');
        
        this.server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = new URL(req.url, `http://localhost:${this.port}`);
            this.handleRequest(req, res, url);
        });
        
        this.server.listen(this.port, () => {
            console.log(`🎭 Identity Service running on http://localhost:${this.port}`);
            console.log('📋 Endpoints:');
            console.log('   • Health: /health');
            console.log('   • Create Identity: POST /identity/create');
            console.log('   • Verify Level: POST /identity/verify');
            console.log('   • Get Profile: GET /identity/:uuid');
            console.log('   • Update Privacy: PUT /identity/:uuid/privacy');
            console.log('   • Link Gaming: POST /identity/link/gaming');
            console.log('   • Franchise Setup: POST /identity/franchise/setup');
        });
    }
    
    async handleRequest(req, res, url) {
        try {
            const path = url.pathname;
            const method = req.method;
            
            if (path === '/health') {
                this.sendResponse(res, 200, {
                    status: 'healthy',
                    service: 'multi-tier-identity-system',
                    layers: ['real', 'business', 'gaming', 'display'],
                    timestamp: new Date().toISOString()
                });
            } else if (path === '/identity/create' && method === 'POST') {
                await this.handleCreateIdentity(req, res);
            } else if (path === '/identity/verify' && method === 'POST') {
                await this.handleVerifyIdentity(req, res);
            } else if (path.startsWith('/identity/') && path.endsWith('/privacy') && method === 'PUT') {
                await this.handleUpdatePrivacy(req, res, path);
            } else if (path === '/identity/link/gaming' && method === 'POST') {
                await this.handleLinkGaming(req, res);
            } else if (path === '/identity/franchise/setup' && method === 'POST') {
                await this.handleFranchiseSetup(req, res);
            } else if (path.startsWith('/identity/') && method === 'GET') {
                await this.handleGetProfile(req, res, path);
            } else {
                this.sendResponse(res, 404, { error: 'Endpoint not found' });
            }
        } catch (error) {
            console.error('Request error:', error);
            this.sendResponse(res, 500, { error: error.message });
        }
    }
    
    async handleCreateIdentity(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { email, displayName, gameCharacterName } = JSON.parse(body);
                
                if (!email || !displayName) {
                    this.sendResponse(res, 400, { error: 'Email and display name required' });
                    return;
                }
                
                // Create real identity (minimal info for start)
                const realIdentityResult = await this.db.query(`
                    INSERT INTO real_identities (email, verification_level)
                    VALUES ($1, $2)
                    RETURNING id, user_uuid
                `, [email, this.verificationLevels.EMAIL]);
                
                const realIdentity = realIdentityResult.rows[0];
                
                // Create gaming identity if character name provided
                let gamingIdentity = null;
                if (gameCharacterName) {
                    const gamingResult = await this.db.query(`
                        INSERT INTO gaming_identities (real_identity_id, character_name)
                        VALUES ($1, $2)
                        RETURNING id, gaming_uuid, character_name
                    `, [realIdentity.id, gameCharacterName]);
                    
                    gamingIdentity = gamingResult.rows[0];
                }
                
                // Create display identity
                const displayResult = await this.db.query(`
                    INSERT INTO display_identities (gaming_identity_id, display_name, display_type, primary_display)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id, display_uuid, display_name
                `, [gamingIdentity?.id || null, displayName, 'primary', true]);
                
                const displayIdentity = displayResult.rows[0];
                
                // Create default privacy settings
                await this.db.query(`
                    INSERT INTO identity_privacy_settings (real_identity_id)
                    VALUES ($1)
                `, [realIdentity.id]);
                
                // Log the creation
                await this.logIdentityAction(realIdentity.user_uuid, 'real', 'created', {
                    email,
                    display_name: displayName,
                    character_name: gameCharacterName
                });
                
                this.sendResponse(res, 201, {
                    success: true,
                    message: 'Multi-tier identity created successfully',
                    identities: {
                        real: { uuid: realIdentity.user_uuid, verification_level: 'EMAIL' },
                        gaming: gamingIdentity ? { uuid: gamingIdentity.gaming_uuid, character_name: gamingIdentity.character_name } : null,
                        display: { uuid: displayIdentity.display_uuid, display_name: displayIdentity.display_name }
                    },
                    next_steps: [
                        'Verify email to unlock tournament participation',
                        'Complete KYC for franchise opportunities',
                        'Set privacy preferences for data sharing'
                    ]
                });
                
            } catch (error) {
                if (error.code === '23505') { // Unique constraint violation
                    this.sendResponse(res, 409, { error: 'Email or character name already exists' });
                } else {
                    this.sendResponse(res, 400, { error: 'Invalid request data' });
                }
            }
        });
    }
    
    async handleVerifyIdentity(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { userUuid, verificationType, verificationData } = JSON.parse(body);
                
                const user = await this.db.query(
                    'SELECT * FROM real_identities WHERE user_uuid = $1',
                    [userUuid]
                );
                
                if (user.rows.length === 0) {
                    this.sendResponse(res, 404, { error: 'User not found' });
                    return;
                }
                
                let newVerificationLevel = user.rows[0].verification_level;
                
                switch (verificationType) {
                    case 'phone':
                        newVerificationLevel = Math.max(newVerificationLevel, this.verificationLevels.PHONE);
                        break;
                    case 'kyc_basic':
                        newVerificationLevel = Math.max(newVerificationLevel, this.verificationLevels.KYC_BASIC);
                        break;
                    case 'kyc_enhanced':
                        newVerificationLevel = Math.max(newVerificationLevel, this.verificationLevels.KYC_ENHANCED);
                        break;
                    case 'franchise_ready':
                        newVerificationLevel = this.verificationLevels.FRANCHISE_READY;
                        break;
                    default:
                        this.sendResponse(res, 400, { error: 'Invalid verification type' });
                        return;
                }
                
                // Update verification level
                await this.db.query(`
                    UPDATE real_identities 
                    SET verification_level = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE user_uuid = $2
                `, [newVerificationLevel, userUuid]);
                
                // Log verification
                await this.logIdentityAction(userUuid, 'real', 'verification_updated', {
                    verification_type: verificationType,
                    new_level: newVerificationLevel
                });
                
                this.sendResponse(res, 200, {
                    success: true,
                    message: `Identity verification updated to level ${newVerificationLevel}`,
                    verification_level: newVerificationLevel,
                    capabilities: this.getCapabilitiesForLevel(newVerificationLevel)
                });
                
            } catch (error) {
                this.sendResponse(res, 400, { error: 'Invalid request data' });
            }
        });
    }
    
    getCapabilitiesForLevel(level) {
        const capabilities = [];
        
        if (level >= this.verificationLevels.EMAIL) {
            capabilities.push('tournament_participation', 'basic_gaming');
        }
        if (level >= this.verificationLevels.PHONE) {
            capabilities.push('prize_collection', 'peer_trading');
        }
        if (level >= this.verificationLevels.KYC_BASIC) {
            capabilities.push('franchise_inquiry', 'business_networking');
        }
        if (level >= this.verificationLevels.KYC_ENHANCED) {
            capabilities.push('franchise_application', 'territory_bidding');
        }
        if (level >= this.verificationLevels.FRANCHISE_READY) {
            capabilities.push('franchise_ownership', 'revenue_sharing', 'territory_management');
        }
        
        return capabilities;
    }
    
    async logIdentityAction(identityUuid, identityType, action, data) {
        await this.db.query(`
            INSERT INTO identity_audit_log (identity_uuid, identity_type, action, new_values)
            VALUES ($1, $2, $3, $4)
        `, [identityUuid, identityType, action, JSON.stringify(data)]);
    }
    
    sendResponse(res, statusCode, data) {
        res.writeHead(statusCode);
        res.end(JSON.stringify(data, null, 2));
    }
    
    async shutdown() {
        console.log('🎭 Multi-Tier Identity System shutting down...');
        if (this.server) {
            this.server.close();
        }
        if (this.db) {
            await this.db.end();
        }
    }
}

// Start the service
const identitySystem = new MultiTierIdentitySystem();

// Handle shutdown
process.on('SIGINT', async () => {
    await identitySystem.shutdown();
    process.exit(0);
});

module.exports = MultiTierIdentitySystem;
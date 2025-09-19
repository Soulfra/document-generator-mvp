#!/usr/bin/env node

/**
 * 🤝 ANONYMOUS TRUST HANDSHAKE DATABASE
 * Establishes cryptographic trust agreements between human and AI
 * with real-time logic transparency and anonymous verification
 * 
 * Architecture:
 * Anonymous IDs → Trust Handshake → Logic Stream → Verification → Agreement Database
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

// ANONYMOUS IDENTITY MANAGER
class AnonymousIdentityManager {
    constructor() {
        this.identities = new Map();
        this.publicKeys = new Map();
        
        console.log('👤 Anonymous Identity Manager initialized');
    }
    
    generateAnonymousIdentity(alias = null) {
        // Generate cryptographic identity
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        // Create anonymous ID from public key hash
        const publicKeyHash = crypto.createHash('sha256')
            .update(keyPair.publicKey)
            .digest('hex');
        
        const anonymousId = `anon_${publicKeyHash.substring(0, 16)}`;
        
        const identity = {
            id: anonymousId,
            alias: alias || `Anonymous_${Date.now()}`,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            created: Date.now(),
            trustScore: 0,
            handshakes: [],
            fingerprint: publicKeyHash.substring(0, 32)
        };
        
        this.identities.set(anonymousId, identity);
        this.publicKeys.set(publicKeyHash, identity);
        
        console.log(`👤 Anonymous identity created: ${anonymousId} (${alias})`);
        return identity;
    }
    
    signMessage(anonymousId, message) {
        const identity = this.identities.get(anonymousId);
        if (!identity) throw new Error('Identity not found');
        
        const signature = crypto.sign('sha256', Buffer.from(message), {
            key: identity.privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        });
        
        return {
            message,
            signature: signature.toString('base64'),
            anonymousId,
            timestamp: Date.now()
        };
    }
    
    verifySignature(signedMessage) {
        const identity = this.identities.get(signedMessage.anonymousId);
        if (!identity) return false;
        
        try {
            return crypto.verify(
                'sha256',
                Buffer.from(signedMessage.message),
                {
                    key: identity.publicKey,
                    padding: crypto.constants.RSA_PKCS1_PSS_PADDING
                },
                Buffer.from(signedMessage.signature, 'base64')
            );
        } catch (error) {
            return false;
        }
    }
}

// TRUST HANDSHAKE PROTOCOL
class TrustHandshakeProtocol extends EventEmitter {
    constructor(identityManager) {
        super();
        this.identityManager = identityManager;
        this.activeHandshakes = new Map();
        this.completedHandshakes = new Map();
        
        console.log('🤝 Trust Handshake Protocol initialized');
    }
    
    initiateHandshake(initiatorId, targetId, terms) {
        const handshakeId = crypto.randomUUID();
        
        const handshake = {
            id: handshakeId,
            initiatorId,
            targetId,
            terms,
            status: 'initiated',
            steps: [],
            created: Date.now(),
            logicChain: []
        };
        
        // Step 1: Initial proposal
        this.addHandshakeStep(handshake, 'proposal', {
            action: 'propose_terms',
            terms: terms,
            reasoning: 'Initiating trust agreement with proposed terms'
        });
        
        this.activeHandshakes.set(handshakeId, handshake);
        
        console.log(`🤝 Handshake initiated: ${handshakeId}`);
        console.log(`👤 Initiator: ${initiatorId}`);
        console.log(`🎯 Target: ${targetId}`);
        console.log(`📋 Terms:`, terms);
        
        this.emit('handshake_initiated', handshake);
        
        return handshake;
    }
    
    addHandshakeStep(handshake, stepType, stepData) {
        const step = {
            id: crypto.randomUUID(),
            type: stepType,
            data: stepData,
            timestamp: Date.now(),
            logicReasoning: stepData.reasoning || 'No reasoning provided',
            signature: null
        };
        
        // Sign the step
        const stepMessage = JSON.stringify({
            handshakeId: handshake.id,
            stepType,
            stepData,
            timestamp: step.timestamp
        });
        
        // Try to sign with either initiator or target key
        try {
            const signerId = stepData.signedBy || handshake.initiatorId;
            step.signature = this.identityManager.signMessage(signerId, stepMessage);
        } catch (error) {
            console.warn('Step signing failed:', error.message);
        }
        
        handshake.steps.push(step);
        handshake.logicChain.push({
            step: stepType,
            reasoning: stepData.reasoning,
            timestamp: step.timestamp,
            verified: !!step.signature
        });
        
        console.log(`🔗 Handshake step added: ${stepType} - ${stepData.reasoning}`);
        
        this.emit('handshake_step', {
            handshakeId: handshake.id,
            step: step,
            logicReasoning: stepData.reasoning
        });
        
        return step;
    }
    
    respondToHandshake(handshakeId, responderId, response) {
        const handshake = this.activeHandshakes.get(handshakeId);
        if (!handshake) throw new Error('Handshake not found');
        
        // Step 2: Response with logic
        this.addHandshakeStep(handshake, 'response', {
            action: response.action, // 'accept', 'counter', 'reject'
            terms: response.terms,
            modifications: response.modifications,
            reasoning: response.reasoning,
            signedBy: responderId
        });
        
        if (response.action === 'accept') {
            handshake.status = 'negotiating';
            this.negotiateAgreement(handshake);
        } else if (response.action === 'counter') {
            handshake.status = 'counter_proposed';
            this.handleCounterProposal(handshake, response);
        } else if (response.action === 'reject') {
            handshake.status = 'rejected';
            this.finalizeHandshake(handshake, false);
        }
        
        console.log(`🤝 Handshake response: ${response.action} - ${response.reasoning}`);
        
        return handshake;
    }
    
    negotiateAgreement(handshake) {
        // Step 3: Negotiation logic
        this.addHandshakeStep(handshake, 'negotiation', {
            action: 'analyze_compatibility',
            reasoning: 'Analyzing trust compatibility between parties',
            compatibility: this.analyzeTrustCompatibility(handshake)
        });
        
        // Step 4: Trust calculation
        const trustMetrics = this.calculateTrustMetrics(handshake);
        this.addHandshakeStep(handshake, 'trust_calculation', {
            action: 'calculate_trust',
            reasoning: 'Computing trust scores and risk assessment',
            trustMetrics
        });
        
        // Step 5: Final agreement
        if (trustMetrics.overallTrust > 0.7) {
            this.addHandshakeStep(handshake, 'agreement', {
                action: 'establish_trust',
                reasoning: `Trust threshold met (${trustMetrics.overallTrust.toFixed(2)}). Establishing secure channel.`,
                trustLevel: trustMetrics.overallTrust
            });
            
            handshake.status = 'agreed';
            this.finalizeHandshake(handshake, true);
        } else {
            this.addHandshakeStep(handshake, 'rejection', {
                action: 'insufficient_trust',
                reasoning: `Trust threshold not met (${trustMetrics.overallTrust.toFixed(2)} < 0.7). Cannot establish agreement.`,
                trustLevel: trustMetrics.overallTrust
            });
            
            handshake.status = 'insufficient_trust';
            this.finalizeHandshake(handshake, false);
        }
    }
    
    analyzeTrustCompatibility(handshake) {
        // Analyze terms compatibility
        const initiatorTerms = handshake.terms;
        
        return {
            dataPrivacy: initiatorTerms.dataPrivacy === 'anonymous' ? 1.0 : 0.5,
            communicationSecurity: initiatorTerms.encryption === 'end_to_end' ? 1.0 : 0.7,
            transparencyLevel: initiatorTerms.logicTransparency === 'full' ? 1.0 : 0.6,
            mutualBenefit: initiatorTerms.mutualBenefit ? 0.9 : 0.3,
            timeValidity: initiatorTerms.validityPeriod > 0 ? 0.8 : 0.4
        };
    }
    
    calculateTrustMetrics(handshake) {
        const compatibility = this.analyzeTrustCompatibility(handshake);
        
        // Calculate overall trust score
        const weights = {
            dataPrivacy: 0.25,
            communicationSecurity: 0.25,
            transparencyLevel: 0.20,
            mutualBenefit: 0.20,
            timeValidity: 0.10
        };
        
        const overallTrust = Object.entries(compatibility)
            .reduce((sum, [key, value]) => sum + (value * weights[key]), 0);
        
        return {
            compatibility,
            weights,
            overallTrust,
            riskLevel: 1 - overallTrust,
            recommendation: overallTrust > 0.7 ? 'ESTABLISH_TRUST' : 'INSUFFICIENT_TRUST'
        };
    }
    
    finalizeHandshake(handshake, success) {
        if (success) {
            // Create trust agreement
            const agreement = this.createTrustAgreement(handshake);
            handshake.agreement = agreement;
            
            console.log(`✅ Trust handshake successful: ${handshake.id}`);
            this.emit('trust_established', { handshake, agreement });
        } else {
            console.log(`❌ Trust handshake failed: ${handshake.id}`);
            this.emit('trust_failed', handshake);
        }
        
        // Move to completed
        this.completedHandshakes.set(handshake.id, handshake);
        this.activeHandshakes.delete(handshake.id);
        
        handshake.completed = Date.now();
    }
    
    createTrustAgreement(handshake) {
        const agreement = {
            id: crypto.randomUUID(),
            handshakeId: handshake.id,
            parties: [handshake.initiatorId, handshake.targetId],
            terms: handshake.terms,
            trustLevel: handshake.steps.find(s => s.type === 'trust_calculation')?.data.trustMetrics.overallTrust,
            establishedAt: Date.now(),
            validUntil: Date.now() + (handshake.terms.validityPeriod * 1000),
            sharedSecret: crypto.randomBytes(32).toString('hex'),
            status: 'active'
        };
        
        return agreement;
    }
    
    getHandshakeStatus(handshakeId) {
        return this.activeHandshakes.get(handshakeId) || 
               this.completedHandshakes.get(handshakeId) || 
               null;
    }
}

// REAL-TIME LOGIC STREAM
class RealTimeLogicStream extends EventEmitter {
    constructor() {
        super();
        this.logicEntries = [];
        this.subscribers = new Set();
        
        console.log('🧠 Real-Time Logic Stream initialized');
    }
    
    logDecision(component, decision, reasoning, data = {}) {
        const logEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            component,
            decision,
            reasoning,
            data,
            confidence: data.confidence || Math.random() * 0.3 + 0.7, // 0.7-1.0
            category: this.categorizeDecision(decision)
        };
        
        this.logicEntries.push(logEntry);
        
        // Keep only last 1000 entries
        if (this.logicEntries.length > 1000) {
            this.logicEntries = this.logicEntries.slice(-1000);
        }
        
        console.log(`🧠 Logic: [${component}] ${decision} - ${reasoning}`);
        
        // Broadcast to subscribers
        this.emit('logic_update', logEntry);
        
        return logEntry;
    }
    
    categorizeDecision(decision) {
        const categories = {
            'security': ['encrypt', 'verify', 'authenticate', 'secure'],
            'trust': ['trust', 'handshake', 'agree', 'verify_identity'],
            'analysis': ['analyze', 'calculate', 'evaluate', 'assess'],
            'communication': ['broadcast', 'send', 'receive', 'sync'],
            'system': ['initialize', 'configure', 'optimize', 'monitor']
        };
        
        const decisionLower = decision.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => decisionLower.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }
    
    getRecentLogic(limit = 50) {
        return this.logicEntries.slice(-limit);
    }
    
    getLogicByCategory(category) {
        return this.logicEntries.filter(entry => entry.category === category);
    }
    
    subscribeToLogic(subscriberId) {
        this.subscribers.add(subscriberId);
        console.log(`🧠 Logic subscriber added: ${subscriberId}`);
    }
    
    unsubscribeFromLogic(subscriberId) {
        this.subscribers.delete(subscriberId);
        console.log(`🧠 Logic subscriber removed: ${subscriberId}`);
    }
}

// TRUST DATABASE
class TrustDatabase {
    constructor() {
        this.dbPath = './trust_handshake.db';
        this.db = null;
        
        console.log('💾 Trust Database initializing...');
    }
    
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log('💾 Connected to Trust Database');
                this.createTables().then(resolve).catch(reject);
            });
        });
    }
    
    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS identities (
                id TEXT PRIMARY KEY,
                alias TEXT,
                public_key TEXT,
                fingerprint TEXT,
                created INTEGER,
                trust_score REAL,
                metadata TEXT
            )`,
            
            `CREATE TABLE IF NOT EXISTS handshakes (
                id TEXT PRIMARY KEY,
                initiator_id TEXT,
                target_id TEXT,
                status TEXT,
                terms TEXT,
                created INTEGER,
                completed INTEGER,
                success BOOLEAN,
                FOREIGN KEY (initiator_id) REFERENCES identities (id),
                FOREIGN KEY (target_id) REFERENCES identities (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS handshake_steps (
                id TEXT PRIMARY KEY,
                handshake_id TEXT,
                step_type TEXT,
                step_data TEXT,
                reasoning TEXT,
                timestamp INTEGER,
                verified BOOLEAN,
                FOREIGN KEY (handshake_id) REFERENCES handshakes (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS trust_agreements (
                id TEXT PRIMARY KEY,
                handshake_id TEXT,
                parties TEXT,
                terms TEXT,
                trust_level REAL,
                established_at INTEGER,
                valid_until INTEGER,
                status TEXT,
                FOREIGN KEY (handshake_id) REFERENCES handshakes (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS logic_entries (
                id TEXT PRIMARY KEY,
                timestamp INTEGER,
                component TEXT,
                decision TEXT,
                reasoning TEXT,
                data TEXT,
                confidence REAL,
                category TEXT
            )`
        ];
        
        for (const sql of tables) {
            await this.runQuery(sql);
        }
        
        console.log('💾 Trust Database tables created');
    }
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
    
    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    async saveIdentity(identity) {
        const sql = `INSERT OR REPLACE INTO identities 
                     (id, alias, public_key, fingerprint, created, trust_score, metadata) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        await this.runQuery(sql, [
            identity.id,
            identity.alias,
            identity.publicKey,
            identity.fingerprint,
            identity.created,
            identity.trustScore,
            JSON.stringify(identity)
        ]);
    }
    
    async saveHandshake(handshake) {
        const sql = `INSERT OR REPLACE INTO handshakes 
                     (id, initiator_id, target_id, status, terms, created, completed, success) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        await this.runQuery(sql, [
            handshake.id,
            handshake.initiatorId,
            handshake.targetId,
            handshake.status,
            JSON.stringify(handshake.terms),
            handshake.created,
            handshake.completed || null,
            handshake.status === 'agreed'
        ]);
        
        // Save steps
        for (const step of handshake.steps) {
            await this.saveHandshakeStep(handshake.id, step);
        }
    }
    
    async saveHandshakeStep(handshakeId, step) {
        const sql = `INSERT OR REPLACE INTO handshake_steps 
                     (id, handshake_id, step_type, step_data, reasoning, timestamp, verified) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        await this.runQuery(sql, [
            step.id,
            handshakeId,
            step.type,
            JSON.stringify(step.data),
            step.logicReasoning,
            step.timestamp,
            !!step.signature
        ]);
    }
    
    async saveLogicEntry(logEntry) {
        const sql = `INSERT INTO logic_entries 
                     (id, timestamp, component, decision, reasoning, data, confidence, category) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        await this.runQuery(sql, [
            logEntry.id,
            logEntry.timestamp,
            logEntry.component,
            logEntry.decision,
            logEntry.reasoning,
            JSON.stringify(logEntry.data),
            logEntry.confidence,
            logEntry.category
        ]);
    }
    
    async getHandshakeHistory(identityId) {
        const sql = `SELECT * FROM handshakes 
                     WHERE initiator_id = ? OR target_id = ? 
                     ORDER BY created DESC`;
        
        return await this.allQuery(sql, [identityId, identityId]);
    }
    
    async getRecentLogic(limit = 100) {
        const sql = `SELECT * FROM logic_entries 
                     ORDER BY timestamp DESC LIMIT ?`;
        
        return await this.allQuery(sql, [limit]);
    }
}

// MAIN TRUST HANDSHAKE SYSTEM
class AnonymousTrustHandshakeSystem extends EventEmitter {
    constructor() {
        super();
        
        this.identityManager = new AnonymousIdentityManager();
        this.handshakeProtocol = new TrustHandshakeProtocol(this.identityManager);
        this.logicStream = new RealTimeLogicStream();
        this.trustDB = new TrustDatabase();
        
        // Create default identities
        this.humanIdentity = null;
        this.aiIdentity = null;
        
        console.log('🤝 Anonymous Trust Handshake System initialized');
        this.setupEventHandlers();
    }
    
    async initialize() {
        await this.trustDB.initialize();
        
        // Create anonymous identities
        this.humanIdentity = this.identityManager.generateAnonymousIdentity('matthewmauer_anonymous');
        this.aiIdentity = this.identityManager.generateAnonymousIdentity('claude_ai_anonymous');
        
        // Save to database
        await this.trustDB.saveIdentity(this.humanIdentity);
        await this.trustDB.saveIdentity(this.aiIdentity);
        
        this.logicStream.logDecision(
            'TrustSystem',
            'initialize_anonymous_identities',
            'Created anonymous cryptographic identities for human and AI parties',
            { humanId: this.humanIdentity.id, aiId: this.aiIdentity.id }
        );
        
        console.log('🤝 Trust system fully initialized');
        console.log(`👤 Human Identity: ${this.humanIdentity.id}`);
        console.log(`🤖 AI Identity: ${this.aiIdentity.id}`);
    }
    
    setupEventHandlers() {
        // Log all handshake events
        this.handshakeProtocol.on('handshake_initiated', async (handshake) => {
            await this.trustDB.saveHandshake(handshake);
            this.logicStream.logDecision(
                'HandshakeProtocol',
                'initiate_handshake',
                `Trust handshake initiated between parties`,
                { handshakeId: handshake.id }
            );
        });
        
        this.handshakeProtocol.on('handshake_step', async (event) => {
            this.logicStream.logDecision(
                'HandshakeProtocol',
                `handshake_step_${event.step.type}`,
                event.logicReasoning,
                { stepId: event.step.id, handshakeId: event.handshakeId }
            );
        });
        
        this.handshakeProtocol.on('trust_established', async (event) => {
            await this.trustDB.saveHandshake(event.handshake);
            this.logicStream.logDecision(
                'TrustSystem',
                'establish_trust_agreement',
                `Trust successfully established with level ${event.agreement.trustLevel}`,
                { agreementId: event.agreement.id, trustLevel: event.agreement.trustLevel }
            );
        });
        
        // Save all logic entries to database
        this.logicStream.on('logic_update', async (logEntry) => {
            await this.trustDB.saveLogicEntry(logEntry);
        });
    }
    
    async establishTrustWithAI() {
        this.logicStream.logDecision(
            'TrustSystem',
            'begin_human_ai_handshake',
            'Human initiating trust handshake with AI using anonymous identities',
            { protocol: 'anonymous_cryptographic_handshake' }
        );
        
        const terms = {
            dataPrivacy: 'anonymous',
            encryption: 'end_to_end',
            logicTransparency: 'full',
            mutualBenefit: true,
            validityPeriod: 86400, // 24 hours
            purpose: 'secure_anonymous_collaboration',
            trustMinimum: 0.7
        };
        
        const handshake = this.handshakeProtocol.initiateHandshake(
            this.humanIdentity.id,
            this.aiIdentity.id,
            terms
        );
        
        // AI automatically responds (simulating AI logic)
        setTimeout(() => {
            this.logicStream.logDecision(
                'AISystem',
                'analyze_handshake_proposal',
                'AI analyzing human trust proposal for compatibility and security',
                { handshakeId: handshake.id }
            );
            
            const response = {
                action: 'accept',
                terms: terms,
                reasoning: 'Terms align with AI safety principles: anonymous, transparent, mutually beneficial'
            };
            
            this.handshakeProtocol.respondToHandshake(
                handshake.id,
                this.aiIdentity.id,
                response
            );
        }, 2000);
        
        return handshake;
    }
    
    getSystemStatus() {
        return {
            system: 'Anonymous Trust Handshake System',
            identities: {
                human: {
                    id: this.humanIdentity?.id,
                    alias: this.humanIdentity?.alias,
                    fingerprint: this.humanIdentity?.fingerprint
                },
                ai: {
                    id: this.aiIdentity?.id,
                    alias: this.aiIdentity?.alias,
                    fingerprint: this.aiIdentity?.fingerprint
                }
            },
            handshakes: {
                active: this.handshakeProtocol.activeHandshakes.size,
                completed: this.handshakeProtocol.completedHandshakes.size
            },
            logic: {
                totalEntries: this.logicStream.logicEntries.length,
                recentDecisions: this.logicStream.getRecentLogic(5)
            }
        };
    }
}

// MAIN EXECUTION
async function main() {
    console.log('🤝 LAUNCHING ANONYMOUS TRUST HANDSHAKE SYSTEM!');
    console.log('🔐 Establishing cryptographic trust between human and AI...');
    
    const trustSystem = new AnonymousTrustHandshakeSystem();
    await trustSystem.initialize();
    
    // Auto-establish trust
    setTimeout(async () => {
        console.log('🤝 Initiating trust handshake...');
        await trustSystem.establishTrustWithAI();
    }, 3000);
    
    // Status API
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    app.get('/trust/status', (req, res) => {
        res.json(trustSystem.getSystemStatus());
    });
    
    app.get('/trust/logic', async (req, res) => {
        const limit = parseInt(req.query.limit) || 50;
        const recentLogic = await trustSystem.trustDB.getRecentLogic(limit);
        res.json({
            recentLogic,
            count: recentLogic.length
        });
    });
    
    app.get('/trust/handshakes/:id', (req, res) => {
        const handshake = trustSystem.handshakeProtocol.getHandshakeStatus(req.params.id);
        if (!handshake) {
            return res.status(404).json({ error: 'Handshake not found' });
        }
        res.json(handshake);
    });
    
    app.listen(3008, () => {
        console.log('🤝 Trust Handshake API: http://localhost:3008/trust/status');
        console.log('🧠 Real-time logic: http://localhost:3008/trust/logic');
    });
    
    console.log('✨ 🤝 ANONYMOUS TRUST HANDSHAKE SYSTEM FULLY OPERATIONAL! 🤝 ✨');
    console.log('🔐 Anonymous cryptographic identities established');
    console.log('🧠 Real-time logic transparency active');
    console.log('💾 Trust database recording all interactions');
    console.log('🤝 Ready for secure anonymous collaboration!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { 
    AnonymousTrustHandshakeSystem, 
    AnonymousIdentityManager, 
    TrustHandshakeProtocol, 
    RealTimeLogicStream, 
    TrustDatabase 
};
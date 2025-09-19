#!/usr/bin/env node

/**
 * Monero-Style Vault System for LadderSlasher Agentic OS
 * Privacy-first game data vaults with IPFS-style public JSONL streaming
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class MoneroStyleVaultSystem {
    constructor() {
        this.vaults = new Map();
        this.publicStreams = new Map();
        this.agentTeams = new Map();
        this.wsPort = 48002;
        this.ipfsPort = 48003;
        
        this.vaultConfig = {
            encryption: 'aes-256-gcm',
            keyDerivation: 'pbkdf2',
            iterations: 100000,
            hashAlgorithm: 'sha512'
        };
        
        console.log('🔐 MONERO-STYLE VAULT SYSTEM');
        console.log('============================');
        console.log('🏦 Private game data vaults');
        console.log('🌐 Public JSONL streaming');
        console.log('🤖 Agent team coordination');
        console.log('📡 Battle.net style data separation');
        console.log('');
        
        this.initializeVaultStructure();
        this.startStreamingServices();
    }
    
    initializeVaultStructure() {
        // Create vault directories
        this.vaultPaths = {
            private: './vaults/private',
            public: './vaults/public', 
            streams: './vaults/streams',
            agents: './vaults/agents',
            verification: './vaults/verification'
        };
        
        Object.values(this.vaultPaths).forEach(vaultPath => {
            if (!fs.existsSync(vaultPath)) {
                fs.mkdirSync(vaultPath, { recursive: true });
            }
        });
        
        console.log('🏦 Vault structure initialized:');
        Object.entries(this.vaultPaths).forEach(([type, path]) => {
            console.log(`   ${type}: ${path}`);
        });
        console.log('');
    }
    
    startStreamingServices() {
        // WebSocket for private vault communication
        this.privateWS = new WebSocket.Server({ port: this.wsPort });
        this.privateWS.on('connection', (ws) => {
            console.log('🔐 Private vault connection established');
            ws.on('message', (message) => {
                this.handlePrivateVaultMessage(ws, JSON.parse(message));
            });
        });
        
        // WebSocket for public JSONL streaming  
        this.publicWS = new WebSocket.Server({ port: this.ipfsPort });
        this.publicWS.on('connection', (ws) => {
            console.log('🌐 Public JSONL stream connection established');
            ws.on('message', (message) => {
                this.handlePublicStreamMessage(ws, JSON.parse(message));
            });
        });
        
        console.log(`🔐 Private vault service: ws://localhost:${this.wsPort}`);
        console.log(`🌐 Public JSONL stream: ws://localhost:${this.ipfsPort}`);
        console.log('');
    }
    
    // Private Vault Operations (Monero-style)
    async createPrivateVault(vaultId, gameData, passphrase) {
        console.log(`🔐 Creating private vault: ${vaultId}`);
        
        // Generate encryption key from passphrase
        const salt = crypto.randomBytes(32);
        const key = crypto.pbkdf2Sync(passphrase, salt, this.vaultConfig.iterations, 32, this.vaultConfig.hashAlgorithm);
        
        // Encrypt game data
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.vaultConfig.encryption, key);
        
        let encrypted = cipher.update(JSON.stringify(gameData), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        // Create vault metadata
        const vaultMetadata = {
            id: vaultId,
            created: new Date().toISOString(),
            algorithm: this.vaultConfig.encryption,
            keyDerivation: this.vaultConfig.keyDerivation,
            iterations: this.vaultConfig.iterations,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            dataHash: crypto.createHash('sha256').update(JSON.stringify(gameData)).digest('hex'),
            publicDataHash: null // Will be set when public data is extracted
        };
        
        // Store encrypted vault
        const vaultPath = path.join(this.vaultPaths.private, `${vaultId}.vault`);
        const vaultBundle = {
            metadata: vaultMetadata,
            encryptedData: encrypted
        };
        
        fs.writeFileSync(vaultPath, JSON.stringify(vaultBundle, null, 2));
        
        // Register vault
        this.vaults.set(vaultId, {
            path: vaultPath,
            metadata: vaultMetadata,
            locked: true,
            lastAccessed: new Date()
        });
        
        console.log(`✅ Private vault created: ${vaultId}`);
        return vaultId;
    }
    
    async unlockPrivateVault(vaultId, passphrase) {
        console.log(`🔓 Unlocking private vault: ${vaultId}`);
        
        if (!this.vaults.has(vaultId)) {
            throw new Error(`Vault not found: ${vaultId}`);
        }
        
        const vaultInfo = this.vaults.get(vaultId);
        const vaultBundle = JSON.parse(fs.readFileSync(vaultInfo.path, 'utf8'));
        const metadata = vaultBundle.metadata;
        
        // Recreate decryption key
        const salt = Buffer.from(metadata.salt, 'hex');
        const key = crypto.pbkdf2Sync(passphrase, salt, metadata.iterations, 32, this.vaultConfig.hashAlgorithm);
        
        // Decrypt data
        const iv = Buffer.from(metadata.iv, 'hex');
        const authTag = Buffer.from(metadata.authTag, 'hex');
        const decipher = crypto.createDecipher(metadata.algorithm, key);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(vaultBundle.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        const gameData = JSON.parse(decrypted);
        
        // Verify data integrity
        const dataHash = crypto.createHash('sha256').update(JSON.stringify(gameData)).digest('hex');
        if (dataHash !== metadata.dataHash) {
            throw new Error('Vault data integrity check failed');
        }
        
        // Update vault status
        vaultInfo.locked = false;
        vaultInfo.lastAccessed = new Date();
        
        console.log(`✅ Private vault unlocked: ${vaultId}`);
        return gameData;
    }
    
    // Public JSONL Stream Operations (IPFS-style)
    async extractPublicJSONL(vaultId, gameData) {
        console.log(`🌐 Extracting public JSONL from vault: ${vaultId}`);
        
        // Extract only non-sensitive data for public consumption
        const publicData = this.sanitizeForPublicStream(gameData);
        
        // Convert to JSONL entries
        const jsonlEntries = this.convertToJSONLEntries(publicData, vaultId);
        
        // Create public stream file
        const streamId = `stream_${vaultId}_${Date.now()}`;
        const streamPath = path.join(this.vaultPaths.public, `${streamId}.jsonl`);
        
        const jsonlContent = jsonlEntries.map(entry => JSON.stringify(entry)).join('\n');
        fs.writeFileSync(streamPath, jsonlContent);
        
        // Register public stream
        this.publicStreams.set(streamId, {
            vaultId: vaultId,
            path: streamPath,
            entries: jsonlEntries.length,
            created: new Date(),
            hash: crypto.createHash('sha256').update(jsonlContent).digest('hex')
        });
        
        // Update vault metadata with public hash
        const vaultInfo = this.vaults.get(vaultId);
        if (vaultInfo) {
            vaultInfo.metadata.publicDataHash = crypto.createHash('sha256').update(jsonlContent).digest('hex');
        }
        
        console.log(`✅ Public JSONL stream created: ${streamId} (${jsonlEntries.length} entries)`);
        
        // Broadcast to connected agents
        this.broadcastToAgentTeams('new_jsonl_stream', {
            streamId: streamId,
            vaultId: vaultId,
            entries: jsonlEntries.length,
            hash: this.publicStreams.get(streamId).hash
        });
        
        return { streamId, jsonlEntries };
    }
    
    sanitizeForPublicStream(gameData) {
        // Remove sensitive/private data, keep only public game mechanics
        const publicData = {
            game_mechanics: gameData.game_mechanics || {},
            ui_patterns: gameData.ui_patterns || {},
            decision_trees: gameData.decision_trees || {},
            agent_patterns: gameData.agent_patterns || {},
            // Remove personal player data, session info, etc.
        };
        
        // Additional sanitization
        if (publicData.game_mechanics.interface) {
            delete publicData.game_mechanics.interface.session_data;
            delete publicData.game_mechanics.interface.user_data;
        }
        
        return publicData;
    }
    
    convertToJSONLEntries(publicData, vaultId) {
        const entries = [];
        const timestamp = new Date().toISOString();
        
        // Convert game mechanics to JSONL
        if (publicData.game_mechanics) {
            Object.entries(publicData.game_mechanics).forEach(([key, value]) => {
                entries.push({
                    id: `${vaultId}_mechanic_${key}`,
                    type: 'game_mechanic',
                    category: 'public_stream',
                    vault_source: vaultId,
                    timestamp: timestamp,
                    data: value,
                    agent_consumable: true,
                    privacy_level: 'public'
                });
            });
        }
        
        // Convert agent patterns to JSONL
        if (publicData.agent_patterns) {
            Object.entries(publicData.agent_patterns).forEach(([key, value]) => {
                entries.push({
                    id: `${vaultId}_pattern_${key}`,
                    type: 'agent_pattern',
                    category: 'public_stream',
                    vault_source: vaultId,
                    timestamp: timestamp,
                    data: value,
                    agent_consumable: true,
                    privacy_level: 'public'
                });
            });
        }
        
        return entries;
    }
    
    // Agent Team Management
    async registerAgentTeam(teamId, teamConfig) {
        console.log(`🤖 Registering agent team: ${teamId}`);
        
        const team = {
            id: teamId,
            name: teamConfig.name,
            agents: teamConfig.agents || [],
            streamSubscriptions: [],
            vaultAccess: teamConfig.vaultAccess || 'public_only',
            capabilities: teamConfig.capabilities || [],
            created: new Date(),
            active: true
        };
        
        this.agentTeams.set(teamId, team);
        
        // Create team workspace
        const teamPath = path.join(this.vaultPaths.agents, teamId);
        if (!fs.existsSync(teamPath)) {
            fs.mkdirSync(teamPath, { recursive: true });
        }
        
        // Save team config
        fs.writeFileSync(
            path.join(teamPath, 'team-config.json'),
            JSON.stringify(team, null, 2)
        );
        
        console.log(`✅ Agent team registered: ${teamId} (${team.agents.length} agents)`);
        return teamId;
    }
    
    async subscribeTeamToStream(teamId, streamId) {
        console.log(`📡 Subscribing team ${teamId} to stream ${streamId}`);
        
        if (!this.agentTeams.has(teamId)) {
            throw new Error(`Agent team not found: ${teamId}`);
        }
        
        if (!this.publicStreams.has(streamId)) {
            throw new Error(`Public stream not found: ${streamId}`);
        }
        
        const team = this.agentTeams.get(teamId);
        if (!team.streamSubscriptions.includes(streamId)) {
            team.streamSubscriptions.push(streamId);
            
            // Notify team of new stream
            this.notifyAgentTeam(teamId, 'stream_subscribed', {
                streamId: streamId,
                stream: this.publicStreams.get(streamId)
            });
        }
        
        console.log(`✅ Team ${teamId} subscribed to stream ${streamId}`);
    }
    
    // Verification System
    async verifyVaultIntegrity(vaultId) {
        console.log(`🔍 Verifying vault integrity: ${vaultId}`);
        
        const verification = {
            vaultId: vaultId,
            timestamp: new Date().toISOString(),
            checks: {},
            overall: 'unknown'
        };
        
        try {
            // Check if vault exists
            const vaultInfo = this.vaults.get(vaultId);
            verification.checks.vault_exists = !!vaultInfo;
            
            if (vaultInfo) {
                // Check file integrity
                verification.checks.file_exists = fs.existsSync(vaultInfo.path);
                
                if (verification.checks.file_exists) {
                    // Check metadata
                    const vaultBundle = JSON.parse(fs.readFileSync(vaultInfo.path, 'utf8'));
                    verification.checks.metadata_valid = !!vaultBundle.metadata;
                    verification.checks.encrypted_data_present = !!vaultBundle.encryptedData;
                    
                    // Check associated public stream
                    const hasPublicStream = Array.from(this.publicStreams.values())
                        .some(stream => stream.vaultId === vaultId);
                    verification.checks.public_stream_exists = hasPublicStream;
                }
            }
            
            // Calculate overall status
            const passedChecks = Object.values(verification.checks).filter(Boolean).length;
            const totalChecks = Object.keys(verification.checks).length;
            verification.overall = passedChecks === totalChecks ? 'pass' : 'fail';
            verification.score = passedChecks / totalChecks;
            
        } catch (error) {
            verification.checks.error = error.message;
            verification.overall = 'error';
        }
        
        // Save verification report
        const verificationPath = path.join(this.vaultPaths.verification, `${vaultId}_${Date.now()}.json`);
        fs.writeFileSync(verificationPath, JSON.stringify(verification, null, 2));
        
        console.log(`✅ Verification complete: ${vaultId} (${verification.overall})`);
        return verification;
    }
    
    async verifyCompleteSystem() {
        console.log('🔍 Verifying complete vault system...');
        
        const systemVerification = {
            timestamp: new Date().toISOString(),
            vaults: {
                total: this.vaults.size,
                verified: 0,
                failed: 0
            },
            streams: {
                total: this.publicStreams.size,
                active: 0
            },
            agents: {
                teams: this.agentTeams.size,
                active: 0
            },
            services: {
                private_ws: this.privateWS.clients.size,
                public_ws: this.publicWS.clients.size
            },
            overall: 'unknown'
        };
        
        // Verify all vaults
        for (const vaultId of this.vaults.keys()) {
            const verification = await this.verifyVaultIntegrity(vaultId);
            if (verification.overall === 'pass') {
                systemVerification.vaults.verified++;
            } else {
                systemVerification.vaults.failed++;
            }
        }
        
        // Check active streams
        systemVerification.streams.active = Array.from(this.publicStreams.values())
            .filter(stream => fs.existsSync(stream.path)).length;
        
        // Check active agent teams
        systemVerification.agents.active = Array.from(this.agentTeams.values())
            .filter(team => team.active).length;
        
        // Overall system health
        const vaultHealth = systemVerification.vaults.total === 0 ? 1 : 
            systemVerification.vaults.verified / systemVerification.vaults.total;
        const streamHealth = systemVerification.streams.total === 0 ? 1 :
            systemVerification.streams.active / systemVerification.streams.total;
        const agentHealth = systemVerification.agents.teams === 0 ? 1 :
            systemVerification.agents.active / systemVerification.agents.teams;
        
        const overallHealth = (vaultHealth + streamHealth + agentHealth) / 3;
        systemVerification.overall = overallHealth >= 0.8 ? 'healthy' : 
                                   overallHealth >= 0.5 ? 'degraded' : 'unhealthy';
        systemVerification.health_score = overallHealth;
        
        // Save system verification
        const systemVerificationPath = path.join(this.vaultPaths.verification, `system_${Date.now()}.json`);
        fs.writeFileSync(systemVerificationPath, JSON.stringify(systemVerification, null, 2));
        
        console.log('✅ System verification complete:');
        console.log(`   Vaults: ${systemVerification.vaults.verified}/${systemVerification.vaults.total}`);
        console.log(`   Streams: ${systemVerification.streams.active}/${systemVerification.streams.total}`);
        console.log(`   Agent Teams: ${systemVerification.agents.active}/${systemVerification.agents.teams}`);
        console.log(`   Overall Health: ${systemVerification.overall} (${Math.round(overallHealth * 100)}%)`);
        
        return systemVerification;
    }
    
    // WebSocket Message Handlers
    handlePrivateVaultMessage(ws, message) {
        switch (message.type) {
            case 'create_vault':
                this.createPrivateVault(message.vaultId, message.gameData, message.passphrase)
                    .then(vaultId => {
                        ws.send(JSON.stringify({
                            type: 'vault_created',
                            vaultId: vaultId,
                            success: true
                        }));
                    })
                    .catch(error => {
                        ws.send(JSON.stringify({
                            type: 'vault_error',
                            error: error.message
                        }));
                    });
                break;
                
            case 'unlock_vault':
                this.unlockPrivateVault(message.vaultId, message.passphrase)
                    .then(gameData => {
                        ws.send(JSON.stringify({
                            type: 'vault_unlocked',
                            vaultId: message.vaultId,
                            gameData: gameData,
                            success: true
                        }));
                    })
                    .catch(error => {
                        ws.send(JSON.stringify({
                            type: 'vault_error',
                            error: error.message
                        }));
                    });
                break;
                
            case 'verify_vault':
                this.verifyVaultIntegrity(message.vaultId)
                    .then(verification => {
                        ws.send(JSON.stringify({
                            type: 'vault_verification',
                            verification: verification
                        }));
                    });
                break;
        }
    }
    
    handlePublicStreamMessage(ws, message) {
        switch (message.type) {
            case 'subscribe_stream':
                const streamInfo = this.publicStreams.get(message.streamId);
                if (streamInfo) {
                    // Send stream data
                    const streamContent = fs.readFileSync(streamInfo.path, 'utf8');
                    ws.send(JSON.stringify({
                        type: 'stream_data',
                        streamId: message.streamId,
                        content: streamContent,
                        metadata: streamInfo
                    }));
                } else {
                    ws.send(JSON.stringify({
                        type: 'stream_error',
                        error: 'Stream not found'
                    }));
                }
                break;
                
            case 'list_streams':
                const streams = Array.from(this.publicStreams.entries()).map(([id, info]) => ({
                    id,
                    vaultId: info.vaultId,
                    entries: info.entries,
                    created: info.created,
                    hash: info.hash
                }));
                ws.send(JSON.stringify({
                    type: 'stream_list',
                    streams: streams
                }));
                break;
                
            case 'register_agent_team':
                this.registerAgentTeam(message.teamId, message.teamConfig)
                    .then(teamId => {
                        ws.send(JSON.stringify({
                            type: 'team_registered',
                            teamId: teamId,
                            success: true
                        }));
                    });
                break;
        }
    }
    
    // Utility Methods
    broadcastToAgentTeams(eventType, data) {
        this.publicWS.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'agent_broadcast',
                    event: eventType,
                    data: data,
                    timestamp: new Date().toISOString()
                }));
            }
        });
    }
    
    notifyAgentTeam(teamId, eventType, data) {
        this.broadcastToAgentTeams('team_notification', {
            teamId: teamId,
            event: eventType,
            data: data
        });
    }
    
    getSystemStatus() {
        return {
            vaults: {
                total: this.vaults.size,
                locked: Array.from(this.vaults.values()).filter(v => v.locked).length,
                unlocked: Array.from(this.vaults.values()).filter(v => !v.locked).length
            },
            streams: {
                total: this.publicStreams.size,
                active: Array.from(this.publicStreams.values()).filter(s => fs.existsSync(s.path)).length
            },
            agents: {
                teams: this.agentTeams.size,
                active: Array.from(this.agentTeams.values()).filter(t => t.active).length
            },
            connections: {
                private: this.privateWS.clients.size,
                public: this.publicWS.clients.size
            }
        };
    }
}

// Auto-start if run directly
if (require.main === module) {
    const vaultSystem = new MoneroStyleVaultSystem();
    
    console.log('🚀 Monero-Style Vault System initialized');
    console.log('📋 Ready for Battle.net style data separation');
    console.log('🤖 Agent teams can consume public JSONL streams');
    console.log('🔐 Private game data remains encrypted in vaults');
    console.log('');
    console.log('Example usage:');
    console.log('1. Create private vault with game data');
    console.log('2. Extract public JSONL stream');
    console.log('3. Register agent teams to consume streams');
    console.log('4. Verify system integrity');
}

module.exports = MoneroStyleVaultSystem;
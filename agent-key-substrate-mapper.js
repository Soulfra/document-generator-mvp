#!/usr/bin/env node

/**
 * 🔐 AGENT KEY SUBSTRATE MAPPER
 * 
 * Maps agent-specific API keys to substrate access permissions
 * Integrates with:
 * - Keyring Manager (RuneScape-style key storage)
 * - Rotating UUID v7 System (file identification)
 * - Context Profiles (environment-specific configs)
 * - Verification Bus (access validation)
 * 
 * Implements RuneScape-style security layers:
 * - Bank: Keyring storage
 * - PIN: User authentication
 * - 2FA: Context verification
 * - UUID: File-level access
 */

const EventEmitter = require('events');
const KeyringManager = require('./keyring-manager');
const RotatingUUIDv7System = require('./rotating-uuidv7-system');
const ContextProfileManager = require('./context-profiles');
const crypto = require('crypto');

class AgentKeySubstrateMapper extends EventEmitter {
    constructor() {
        super();
        
        // Initialize dependent systems
        this.keyringManager = new KeyringManager();
        this.uuidSystem = new RotatingUUIDv7System();
        this.contextManager = new ContextProfileManager();
        
        // Agent registry
        this.agents = new Map();
        
        // Substrate access control lists
        this.substrateACL = {
            // Database access tiers
            databases: {
                bronze: ['sqlite', 'redis'],
                iron: ['sqlite', 'redis', 'postgresql'],
                steel: ['sqlite', 'redis', 'postgresql', 'mongodb'],
                mithril: ['all']
            },
            
            // Distributed storage access
            distributed: {
                bronze: ['ipfs'],
                iron: ['ipfs', 'filecoin'],
                steel: ['ipfs', 'filecoin', 'arweave'],
                mithril: ['all']
            },
            
            // Blockchain access
            blockchain: {
                bronze: [], // No blockchain access
                iron: ['polkadot'],
                steel: ['polkadot', 'ethereum'],
                mithril: ['all']
            },
            
            // Cloud service access
            cloud: {
                bronze: ['vercel'],
                iron: ['vercel', 'aws'],
                steel: ['vercel', 'aws', 'stripe'],
                mithril: ['all']
            }
        };
        
        // File UUID to agent mapping
        this.fileUUIDMap = new Map();
        
        // Agent workspace configurations
        this.agentWorkspaces = new Map();
        
        // Security layers
        this.securityLayers = {
            bank: true,      // Keyring storage enabled
            pin: true,       // PIN authentication required
            twoFactor: true, // 2FA for sensitive operations
            uuid: true       // UUID file tracking enabled
        };
        
        console.log('🔐 Agent Key Substrate Mapper initializing...');
    }
    
    async initialize() {
        try {
            // Initialize keyring manager
            await this.keyringManager.initialize();
            
            // Load existing agent configurations
            await this.loadAgentConfigurations();
            
            // Setup UUID rotation callbacks
            this.setupUUIDCallbacks();
            
            console.log('✅ Agent Key Substrate Mapper ready!');
            console.log(`   🤖 ${this.agents.size} agents configured`);
            console.log(`   🔑 ${this.keyringManager.getStats().totalKeys} keys available`);
            console.log(`   📁 ${this.fileUUIDMap.size} files tracked`);
            
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Create a new agent with unique API keys
     */
    async createAgent(config) {
        const agentId = config.agentId || `agent_${crypto.randomBytes(8).toString('hex')}`;
        
        console.log(`\n🤖 Creating agent: ${agentId}`);
        
        // Generate unique API keys for each tier
        const agentKeys = {
            bronze: await this.generateAgentKey(agentId, 'bronze', config),
            iron: await this.generateAgentKey(agentId, 'iron', config),
            steel: await this.generateAgentKey(agentId, 'steel', config),
            mithril: config.admin ? await this.generateAgentKey(agentId, 'mithril', config) : null
        };
        
        // Create agent workspace
        const workspace = {
            agentId,
            created: new Date().toISOString(),
            type: config.type || '1099_contractor',
            profile: config.profile || 'development',
            keys: agentKeys,
            substrates: this.getAgentSubstrates(config.tier || 'bronze'),
            fileUUIDs: new Set(),
            quotas: {
                api_calls: config.quotas?.api_calls || 1000,
                storage: config.quotas?.storage || 1024 * 1024 * 100, // 100MB
                bandwidth: config.quotas?.bandwidth || 1024 * 1024 * 1000 // 1GB
            },
            usage: {
                api_calls: 0,
                storage: 0,
                bandwidth: 0
            },
            security: {
                pin: this.generatePIN(),
                twoFactorEnabled: config.twoFactor || false,
                lastAccess: null,
                accessLog: []
            }
        };
        
        // Store agent configuration
        this.agents.set(agentId, workspace);
        this.agentWorkspaces.set(agentId, workspace);
        
        // Create UUID set for agent
        this.uuidSystem.createRotatingUUIDSet('agent', agentId);
        
        // Register with context manager
        if (this.contextManager) {
            const profile = this.contextManager.getCurrentProfile();
            workspace.contextProfile = profile.name;
        }
        
        console.log(`   ✅ Agent created with ${Object.keys(agentKeys).filter(k => agentKeys[k]).length} key tiers`);
        console.log(`   🎯 Substrates: ${workspace.substrates.join(', ')}`);
        console.log(`   🔐 PIN: ${workspace.security.pin}`);
        
        this.emit('agent:created', { agentId, workspace });
        
        return {
            agentId,
            keys: this.sanitizeKeys(agentKeys),
            substrates: workspace.substrates,
            pin: workspace.security.pin,
            workspace: this.sanitizeWorkspace(workspace)
        };
    }
    
    /**
     * Generate agent-specific API key
     */
    async generateAgentKey(agentId, tier, config) {
        const keyData = {
            provider: `agent_${tier}`,
            endpoint: config.endpoint || 'default',
            value: this.generateSecureKey(agentId, tier),
            rateLimit: this.getTierRateLimit(tier),
            metadata: {
                agentId,
                tier,
                created: new Date().toISOString(),
                context: config.profile || 'development'
            }
        };
        
        // Add to appropriate keyring
        if (!this.keyringManager.keyrings.has(tier)) {
            await this.keyringManager.createKeyring(tier, `${tier} tier agent keys`);
        }
        
        await this.keyringManager.addKey(tier, keyData);
        
        return {
            tier,
            key: keyData.value,
            rateLimit: keyData.rateLimit,
            created: keyData.metadata.created
        };
    }
    
    /**
     * Map file UUID to agent
     */
    async mapFileToAgent(filePath, agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        
        // Generate or get file UUID
        const fileUUID = this.uuidSystem.getCurrentUUID('file', filePath);
        
        // Map file to agent
        this.fileUUIDMap.set(fileUUID.uuid, {
            agentId,
            filePath,
            mapped: new Date().toISOString(),
            accessCount: 0
        });
        
        // Add to agent's file set
        agent.fileUUIDs.add(fileUUID.uuid);
        
        console.log(`   📁 Mapped file ${filePath} to agent ${agentId}`);
        console.log(`   🆔 UUID: ${fileUUID.uuid}`);
        
        // Register rotation callback
        this.uuidSystem.onRotation('file', filePath, (event) => {
            this.handleFileUUIDRotation(agentId, filePath, event);
        });
        
        return fileUUID;
    }
    
    /**
     * Check agent access to substrate
     */
    async checkAgentAccess(agentId, substrate, operation = 'read') {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return { 
                authorized: false, 
                reason: 'Agent not found',
                agentId 
            };
        }
        
        // Check if substrate is in agent's allowed list
        if (!agent.substrates.includes(substrate) && !agent.substrates.includes('all')) {
            return {
                authorized: false,
                reason: 'Substrate not authorized for agent tier',
                agentId,
                substrate,
                allowedSubstrates: agent.substrates
            };
        }
        
        // Check quotas
        const quotaCheck = this.checkQuotas(agent, operation);
        if (!quotaCheck.allowed) {
            return {
                authorized: false,
                reason: quotaCheck.reason,
                agentId,
                quota: quotaCheck
            };
        }
        
        // Check security layers
        const securityCheck = await this.checkSecurityLayers(agent, operation);
        if (!securityCheck.passed) {
            return {
                authorized: false,
                reason: securityCheck.reason,
                agentId,
                security: securityCheck
            };
        }
        
        // Update usage
        this.updateUsage(agent, operation);
        
        // Log access
        agent.security.accessLog.push({
            substrate,
            operation,
            timestamp: new Date().toISOString(),
            authorized: true
        });
        
        // Keep only last 100 access logs
        if (agent.security.accessLog.length > 100) {
            agent.security.accessLog = agent.security.accessLog.slice(-100);
        }
        
        return {
            authorized: true,
            agentId,
            substrate,
            operation,
            keyTier: this.getAgentTier(agent),
            remainingQuota: this.getRemainingQuota(agent)
        };
    }
    
    /**
     * Get agent API key for substrate
     */
    async getAgentKey(agentId, substrate) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        
        // Check access first
        const access = await this.checkAgentAccess(agentId, substrate);
        if (!access.authorized) {
            throw new Error(`Access denied: ${access.reason}`);
        }
        
        // Determine required tier for substrate
        const requiredTier = this.getRequiredTier(substrate);
        
        // Get appropriate key
        const agentKey = agent.keys[requiredTier];
        if (!agentKey) {
            throw new Error(`Agent lacks ${requiredTier} tier key for ${substrate}`);
        }
        
        return {
            key: agentKey.key,
            tier: requiredTier,
            rateLimit: agentKey.rateLimit,
            substrate,
            agentId
        };
    }
    
    /**
     * Verify file access through UUID
     */
    async verifyFileAccess(agentId, fileUUID) {
        const fileMapping = this.fileUUIDMap.get(fileUUID);
        if (!fileMapping) {
            return {
                authorized: false,
                reason: 'File UUID not found'
            };
        }
        
        if (fileMapping.agentId !== agentId) {
            return {
                authorized: false,
                reason: 'File not mapped to agent'
            };
        }
        
        // Verify UUID is still valid
        const uuidVerification = this.uuidSystem.verifyUUID(
            fileUUID,
            'file',
            fileMapping.filePath
        );
        
        if (!uuidVerification.valid) {
            return {
                authorized: false,
                reason: uuidVerification.reason
            };
        }
        
        // Update access count
        fileMapping.accessCount++;
        fileMapping.lastAccess = new Date().toISOString();
        
        return {
            authorized: true,
            filePath: fileMapping.filePath,
            accessCount: fileMapping.accessCount,
            uuidAge: uuidVerification.age
        };
    }
    
    /**
     * Helper methods
     */
    
    generateSecureKey(agentId, tier) {
        const timestamp = Date.now();
        const random = crypto.randomBytes(16).toString('hex');
        const hash = crypto.createHash('sha256')
            .update(`${agentId}:${tier}:${timestamp}:${random}`)
            .digest('hex');
        
        return `ak_${tier}_${hash.slice(0, 32)}`;
    }
    
    generatePIN() {
        return crypto.randomInt(1000, 9999).toString();
    }
    
    getTierRateLimit(tier) {
        const limits = {
            bronze: 60,    // 60 requests/minute
            iron: 120,     // 120 requests/minute
            steel: 300,    // 300 requests/minute
            mithril: 1000  // 1000 requests/minute
        };
        return limits[tier] || 60;
    }
    
    getAgentSubstrates(tier) {
        const substrates = [];
        
        // Collect all allowed substrates for tier
        for (const category of Object.values(this.substrateACL)) {
            const allowed = category[tier] || [];
            substrates.push(...allowed);
        }
        
        // Remove duplicates
        return [...new Set(substrates)];
    }
    
    getRequiredTier(substrate) {
        // Find minimum tier that has access to substrate
        const tiers = ['bronze', 'iron', 'steel', 'mithril'];
        
        for (const tier of tiers) {
            const substrates = this.getAgentSubstrates(tier);
            if (substrates.includes(substrate) || substrates.includes('all')) {
                return tier;
            }
        }
        
        return 'mithril'; // Default to highest tier
    }
    
    getAgentTier(agent) {
        // Determine agent's highest tier based on available keys
        if (agent.keys.mithril) return 'mithril';
        if (agent.keys.steel) return 'steel';
        if (agent.keys.iron) return 'iron';
        return 'bronze';
    }
    
    checkQuotas(agent, operation) {
        const quotaType = this.getQuotaType(operation);
        
        if (agent.usage[quotaType] >= agent.quotas[quotaType]) {
            return {
                allowed: false,
                reason: `${quotaType} quota exceeded`,
                used: agent.usage[quotaType],
                limit: agent.quotas[quotaType]
            };
        }
        
        return { allowed: true };
    }
    
    getQuotaType(operation) {
        if (['read', 'write', 'query'].includes(operation)) return 'api_calls';
        if (['upload', 'store'].includes(operation)) return 'storage';
        if (['download', 'stream'].includes(operation)) return 'bandwidth';
        return 'api_calls';
    }
    
    async checkSecurityLayers(agent, operation) {
        // PIN check for sensitive operations
        if (this.securityLayers.pin && ['write', 'delete', 'admin'].includes(operation)) {
            // In real implementation, would verify PIN
            // For now, just check if PIN exists
            if (!agent.security.pin) {
                return { passed: false, reason: 'PIN required for operation' };
            }
        }
        
        // 2FA check for critical operations
        if (this.securityLayers.twoFactor && agent.security.twoFactorEnabled) {
            if (['delete', 'admin', 'key_rotation'].includes(operation)) {
                // In real implementation, would verify 2FA token
                // For now, just flag as required
                return { passed: true, twoFactorRequired: true };
            }
        }
        
        return { passed: true };
    }
    
    updateUsage(agent, operation) {
        const quotaType = this.getQuotaType(operation);
        agent.usage[quotaType]++;
        agent.security.lastAccess = new Date().toISOString();
    }
    
    getRemainingQuota(agent) {
        return {
            api_calls: agent.quotas.api_calls - agent.usage.api_calls,
            storage: agent.quotas.storage - agent.usage.storage,
            bandwidth: agent.quotas.bandwidth - agent.usage.bandwidth
        };
    }
    
    handleFileUUIDRotation(agentId, filePath, event) {
        console.log(`   🔄 File UUID rotated for agent ${agentId}: ${filePath}`);
        
        // Update file mapping
        const oldMapping = this.fileUUIDMap.get(event.newPrimary.uuid);
        if (oldMapping) {
            this.fileUUIDMap.set(event.newPrimary.uuid, {
                ...oldMapping,
                rotated: new Date().toISOString(),
                rotationCount: event.rotationCount
            });
        }
        
        this.emit('file:rotated', {
            agentId,
            filePath,
            oldUUID: event.oldPrimary?.uuid,
            newUUID: event.newPrimary.uuid
        });
    }
    
    setupUUIDCallbacks() {
        // Monitor all file UUID rotations
        this.uuidSystem.on('rotation:complete', (event) => {
            console.log(`   🔄 UUID rotation detected: ${event.setId}`);
        });
    }
    
    sanitizeKeys(keys) {
        // Return keys with values partially hidden
        const sanitized = {};
        
        for (const [tier, keyData] of Object.entries(keys)) {
            if (keyData) {
                sanitized[tier] = {
                    ...keyData,
                    key: keyData.key.slice(0, 10) + '...' + keyData.key.slice(-4)
                };
            }
        }
        
        return sanitized;
    }
    
    sanitizeWorkspace(workspace) {
        // Return workspace without sensitive data
        const { keys, security, ...safe } = workspace;
        
        return {
            ...safe,
            security: {
                twoFactorEnabled: security.twoFactorEnabled,
                lastAccess: security.lastAccess
            }
        };
    }
    
    async loadAgentConfigurations() {
        // Load from database or file system
        // Placeholder for now
        console.log('   📂 Loading agent configurations...');
    }
    
    /**
     * Get agent statistics
     */
    getStats() {
        const stats = {
            totalAgents: this.agents.size,
            totalFiles: this.fileUUIDMap.size,
            agentsByTier: {},
            substrateUsage: {},
            securityLayers: this.securityLayers
        };
        
        // Count agents by tier
        for (const agent of this.agents.values()) {
            const tier = this.getAgentTier(agent);
            stats.agentsByTier[tier] = (stats.agentsByTier[tier] || 0) + 1;
        }
        
        // Count substrate usage from access logs
        for (const agent of this.agents.values()) {
            for (const log of agent.security.accessLog) {
                stats.substrateUsage[log.substrate] = 
                    (stats.substrateUsage[log.substrate] || 0) + 1;
            }
        }
        
        return stats;
    }
}

// Export for use
module.exports = AgentKeySubstrateMapper;

// Run if executed directly
if (require.main === module) {
    async function demo() {
        const mapper = new AgentKeySubstrateMapper();
        await mapper.initialize();
        
        console.log('\n📋 AGENT KEY SUBSTRATE MAPPER DEMO');
        console.log('====================================');
        
        // Create a test agent
        console.log('\n1. Creating test agent...');
        const agent1 = await mapper.createAgent({
            type: '1099_contractor',
            tier: 'iron',
            profile: 'development',
            quotas: {
                api_calls: 5000,
                storage: 1024 * 1024 * 500, // 500MB
                bandwidth: 1024 * 1024 * 5000 // 5GB
            }
        });
        
        console.log('\n📊 Agent created:');
        console.log(JSON.stringify(agent1, null, 2));
        
        // Map a file to agent
        console.log('\n2. Mapping file to agent...');
        const fileUUID = await mapper.mapFileToAgent(
            '/test/documents/business-plan.md',
            agent1.agentId
        );
        
        // Check agent access to substrates
        console.log('\n3. Checking substrate access...');
        const substratesToTest = ['sqlite', 'ipfs', 'ethereum', 'stripe'];
        
        for (const substrate of substratesToTest) {
            const access = await mapper.checkAgentAccess(agent1.agentId, substrate);
            console.log(`   ${substrate}: ${access.authorized ? '✅' : '❌'} ${access.reason || ''}`);
        }
        
        // Get API key for allowed substrate
        console.log('\n4. Getting API key for IPFS...');
        try {
            const apiKey = await mapper.getAgentKey(agent1.agentId, 'ipfs');
            console.log('   API Key:', apiKey);
        } catch (error) {
            console.error('   Error:', error.message);
        }
        
        // Verify file access
        console.log('\n5. Verifying file access...');
        const fileAccess = await mapper.verifyFileAccess(
            agent1.agentId,
            fileUUID.uuid
        );
        console.log('   File access:', fileAccess);
        
        // Show statistics
        console.log('\n📊 System Statistics:');
        console.log(JSON.stringify(mapper.getStats(), null, 2));
    }
    
    demo().catch(console.error);
}
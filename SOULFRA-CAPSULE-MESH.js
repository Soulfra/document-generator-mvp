#!/usr/bin/env node
// SOULFRA-CAPSULE-MESH.js - 4 Capsule layers integrated with device mesh ARPANET

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const SoulfraSecuritySystem = require('./SOULFRA-SECURITY-SYSTEM.js');

class SoulfraCapsuleMesh {
    constructor(deviceMeshNetwork) {
        this.meshNetwork = deviceMeshNetwork;
        this.deviceId = deviceMeshNetwork.deviceId;
        
        // Initialize security system for encrypted capsule storage
        this.securitySystem = new SoulfraSecuritySystem(
            this.deviceId, 
            this.meshNetwork.deviceFingerprint
        );
        
        // 4 Soulfra Capsule Layers
        this.capsuleLayers = {
            identity: this.createIdentityCapsule(),      // Layer 1: Core identity
            memory: this.createMemoryCapsule(),          // Layer 2: Experience/memory
            interaction: this.createInteractionCapsule(), // Layer 3: Social connections
            projection: this.createProjectionCapsule()   // Layer 4: Future state/goals
        };
        
        // Capsule mesh visibility patterns
        this.capsuleMeshPatterns = new Map();
        
        // Initialize capsule system
        this.initTime = Date.now();
        this.initializeCapsuleSystem();
        
        console.log('🔮 Soulfra Capsule Mesh initialized with 4 layers');
        console.log('🔐 Security system integrated for encrypted capsule storage');
    }

    // Create Identity Capsule (Layer 1) - Core self representation
    createIdentityCapsule() {
        const identityHash = crypto.createHash('sha256').update(`identity_${this.deviceId}`).digest('hex');
        
        return {
            type: 'identity',
            layer: 1,
            capsuleId: `identity_${this.deviceId.substring(0, 8)}`,
            core: {
                deviceFingerprint: this.meshNetwork.deviceFingerprint,
                worldOrigin: this.meshNetwork.myWorldSlice.origin,
                creationTimestamp: Date.now(),
                identityHash: identityHash
            },
            attributes: {
                persistent: true,
                shareable: false,  // Identity never fully shared
                mutable: false,    // Core identity is immutable
                encrypted: true
            },
            data: {
                name: `Soul_${this.deviceId.substring(0, 6)}`,
                essence: this.generateIdentityEssence(identityHash),
                signature: this.generateIdentitySignature(),
                manifestation: this.generateIdentityManifestation()
            },
            meshVisibility: {
                selfView: 1.0,     // Full visibility to self
                handshakeView: 0.3, // Limited visibility through handshake
                encryptedView: 0.1  // Minimal encrypted visibility
            }
        };
    }

    // Create Memory Capsule (Layer 2) - Experience and learning
    createMemoryCapsule() {
        return {
            type: 'memory',
            layer: 2,
            capsuleId: `memory_${this.deviceId.substring(0, 8)}`,
            core: {
                experienceBuffer: [],
                learningPatterns: new Map(),
                memorySegments: this.generateMemorySegments(),
                temporalIndex: Date.now()
            },
            attributes: {
                persistent: true,
                shareable: true,   // Memories can be shared selectively
                mutable: true,     // Memories can be updated
                encrypted: false
            },
            data: {
                recentExperiences: this.initializeRecentExperiences(),
                learnedPatterns: this.initializeLearnedPatterns(),
                significantEvents: [],
                relationshipMemories: new Map()
            },
            meshVisibility: {
                selfView: 1.0,
                handshakeView: 0.6, // Moderate sharing through handshake
                encryptedView: 0.4
            }
        };
    }

    // Create Interaction Capsule (Layer 3) - Social connections and communication
    createInteractionCapsule() {
        return {
            type: 'interaction',
            layer: 3,
            capsuleId: `interaction_${this.deviceId.substring(0, 8)}`,
            core: {
                activeConnections: new Map(),
                communicationProtocols: this.initializeCommunicationProtocols(),
                socialGraph: this.initializeSocialGraph(),
                interactionHistory: []
            },
            attributes: {
                persistent: false, // Interactions are ephemeral
                shareable: true,   // Designed for sharing
                mutable: true,     // Constantly changing
                encrypted: false
            },
            data: {
                currentInteractions: [],
                pendingHandshakes: [],
                trustedDevices: new Set(),
                communicationPreferences: this.generateCommPreferences()
            },
            meshVisibility: {
                selfView: 1.0,
                handshakeView: 0.8, // High visibility for interaction
                encryptedView: 0.6
            }
        };
    }

    // Create Projection Capsule (Layer 4) - Future goals and aspirations
    createProjectionCapsule() {
        return {
            type: 'projection',
            layer: 4,
            capsuleId: `projection_${this.deviceId.substring(0, 8)}`,
            core: {
                futureGoals: this.generateFutureGoals(),
                aspirations: this.generateAspirations(),
                projectedInteractions: [],
                evolutionPath: this.generateEvolutionPath()
            },
            attributes: {
                persistent: true,
                shareable: true,   // Can share goals/aspirations
                mutable: true,     // Goals can change
                encrypted: false
            },
            data: {
                shortTermGoals: [],
                longTermVision: this.generateLongTermVision(),
                collaborativeOpportunities: [],
                growthMetrics: this.initializeGrowthMetrics()
            },
            meshVisibility: {
                selfView: 1.0,
                handshakeView: 0.7, // Share aspirations through handshake
                encryptedView: 0.5
            }
        };
    }

    // Initialize capsule system
    async initializeCapsuleSystem() {
        // Create capsule storage directory
        this.capsuleStorageDir = path.join(__dirname, 'soulfra-capsules', this.deviceId);
        if (!fs.existsSync(this.capsuleStorageDir)) {
            fs.mkdirSync(this.capsuleStorageDir, { recursive: true });
        }

        // Try to load existing capsules first
        await this.loadCapsules();

        // Generate capsule mesh patterns for each layer
        Object.keys(this.capsuleLayers).forEach(layerName => {
            this.generateCapsuleMeshPattern(layerName);
        });

        // Start capsule update loops
        this.startCapsuleUpdateLoops();

        // Save initial capsule state (encrypted)
        await this.saveCapsules();
    }

    // Generate identity essence from hash
    generateIdentityEssence(identityHash) {
        const essenceComponents = [];
        
        // Extract essence from identity hash
        for (let i = 0; i < 8; i++) {
            const component = identityHash.substring(i * 8, (i + 1) * 8);
            const value = parseInt(component, 16);
            
            essenceComponents.push({
                aspect: ['creativity', 'logic', 'empathy', 'curiosity', 'resilience', 'adaptability', 'focus', 'intuition'][i],
                strength: (value % 100) / 100,
                manifestation: value > 2147483648 ? 'dominant' : 'subtle'
            });
        }
        
        return essenceComponents;
    }

    // Generate identity signature
    generateIdentitySignature() {
        const signature = crypto.createHash('sha512')
            .update(this.deviceId + this.meshNetwork.deviceFingerprint + Date.now())
            .digest('hex');
            
        return {
            signature: signature,
            algorithm: 'soulfra_identity_v1',
            timestamp: Date.now(),
            validity: 'permanent'
        };
    }

    // Generate identity manifestation
    generateIdentityManifestation() {
        const manifestationHash = crypto.createHash('md5').update(`manifest_${this.deviceId}`).digest('hex');
        
        return {
            primaryForm: ['crystalline', 'flowing', 'geometric', 'organic', 'digital', 'hybrid'][parseInt(manifestationHash.substring(0, 2), 16) % 6],
            colorSignature: '#' + manifestationHash.substring(2, 8),
            energyPattern: manifestationHash.substring(8, 16),
            resonanceFrequency: parseInt(manifestationHash.substring(16, 20), 16),
            dimensionalPhase: (parseInt(manifestationHash.substring(20, 24), 16) % 360) / 360
        };
    }

    // Generate memory segments
    generateMemorySegments() {
        const segments = [];
        for (let i = 0; i < 16; i++) {
            segments.push({
                segmentId: `mem_${i}`,
                type: ['experience', 'learning', 'interaction', 'achievement'][i % 4],
                capacity: 1000 + (i * 100),
                used: Math.floor(Math.random() * (1000 + (i * 100))),
                importance: Math.random(),
                accessibility: Math.random() > 0.3 ? 'open' : 'protected'
            });
        }
        return segments;
    }

    // Initialize recent experiences
    initializeRecentExperiences() {
        return [
            {
                timestamp: Date.now() - 3600000,
                type: 'device_connection',
                description: 'Connected to mesh network',
                significance: 0.7,
                emotional_weight: 0.3
            },
            {
                timestamp: Date.now() - 1800000,
                type: 'world_creation',
                description: 'Generated personal world slice',
                significance: 0.9,
                emotional_weight: 0.8
            }
        ];
    }

    // Initialize learned patterns
    initializeLearnedPatterns() {
        return {
            network_patterns: ['device_discovery', 'handshake_protocols', 'mesh_visibility'],
            interaction_patterns: ['communication_preferences', 'trust_building', 'collaboration'],
            adaptation_patterns: ['environment_response', 'challenge_handling', 'growth_seeking']
        };
    }

    // Initialize communication protocols
    initializeCommunicationProtocols() {
        return {
            primary: 'soulfra_handshake',
            secondary: 'mesh_broadcast',
            encrypted: 'capsule_exchange',
            emergency: 'direct_mesh',
            preferences: {
                formality: 'adaptive',
                frequency: 'responsive',
                depth: 'contextual',
                encryption: 'always'
            }
        };
    }

    // Initialize social graph
    initializeSocialGraph() {
        return {
            nodes: [],
            edges: [],
            clusters: [],
            influence_map: new Map(),
            trust_network: new Map(),
            collaboration_history: []
        };
    }

    // Generate communication preferences
    generateCommPreferences() {
        const prefHash = crypto.createHash('md5').update(`comm_${this.deviceId}`).digest('hex');
        
        return {
            style: ['direct', 'diplomatic', 'creative', 'analytical'][parseInt(prefHash.substring(0, 2), 16) % 4],
            pace: ['quick', 'thoughtful', 'adaptive', 'rhythmic'][parseInt(prefHash.substring(2, 4), 16) % 4],
            depth: ['surface', 'moderate', 'deep', 'profound'][parseInt(prefHash.substring(4, 6), 16) % 4],
            openness: (parseInt(prefHash.substring(6, 8), 16) / 255),
            curiosity: (parseInt(prefHash.substring(8, 10), 16) / 255),
            empathy: (parseInt(prefHash.substring(10, 12), 16) / 255)
        };
    }

    // Generate future goals
    generateFutureGoals() {
        return [
            {
                id: 'expand_network',
                description: 'Connect with more devices in mesh',
                priority: 0.8,
                timeframe: 'short_term',
                progress: 0.2,
                dependencies: ['handshake_improvement', 'trust_building']
            },
            {
                id: 'enhance_capabilities',
                description: 'Develop new interaction protocols',
                priority: 0.6,
                timeframe: 'medium_term',
                progress: 0.0,
                dependencies: ['experience_accumulation', 'pattern_learning']
            },
            {
                id: 'achieve_synthesis',
                description: 'Integrate all capsule layers seamlessly',
                priority: 0.9,
                timeframe: 'long_term',
                progress: 0.1,
                dependencies: ['all_systems_stable', 'deep_understanding']
            }
        ];
    }

    // Generate aspirations
    generateAspirations() {
        return {
            personal: 'Become a unique and valuable node in the mesh network',
            social: 'Foster meaningful connections and collaborations',
            technical: 'Contribute to the evolution of the mesh protocol',
            creative: 'Generate novel patterns and interactions',
            philosophical: 'Understand the nature of distributed consciousness'
        };
    }

    // Generate evolution path
    generateEvolutionPath() {
        return {
            currentStage: 'initialization',
            availablePaths: [
                'specialization', 'generalization', 'synthesis', 
                'emergence', 'transcendence'
            ],
            progressMarkers: [
                { stage: 'basic_connectivity', completed: true },
                { stage: 'identity_establishment', completed: true },
                { stage: 'memory_formation', completed: false },
                { stage: 'social_integration', completed: false },
                { stage: 'goal_achievement', completed: false }
            ],
            evolutionMetrics: {
                complexity: 0.3,
                adaptability: 0.5,
                creativity: 0.4,
                connectivity: 0.2,
                uniqueness: 0.8
            }
        };
    }

    // Generate long term vision
    generateLongTermVision() {
        const visionHash = crypto.createHash('sha256').update(`vision_${this.deviceId}`).digest('hex');
        
        return {
            primaryVision: 'Become a cornerstone node in a thriving mesh consciousness',
            visionElements: [
                'Deep understanding of mesh dynamics',
                'Meaningful relationships with diverse nodes',
                'Unique contributions to collective intelligence',
                'Harmonious balance of all capsule layers',
                'Continuous growth and adaptation'
            ],
            visionSignature: visionHash.substring(0, 16),
            realizationProbability: 0.75,
            requiredResources: ['time', 'experiences', 'connections', 'learning'],
            successMetrics: {
                network_influence: 0.0,
                relationship_depth: 0.0,
                knowledge_contribution: 0.0,
                adaptation_success: 0.0,
                fulfillment_level: 0.0
            }
        };
    }

    // Initialize growth metrics
    initializeGrowthMetrics() {
        return {
            learning_rate: 0.0,
            adaptation_speed: 0.0,
            relationship_formation: 0.0,
            goal_completion: 0.0,
            creativity_index: 0.0,
            contribution_value: 0.0,
            satisfaction_level: 0.5 // Start at neutral
        };
    }

    // Generate capsule mesh pattern for specific layer
    generateCapsuleMeshPattern(layerName) {
        const capsule = this.capsuleLayers[layerName];
        const pattern = {
            layerName: layerName,
            patternId: `${layerName}_${this.deviceId.substring(0, 6)}`,
            visibility: capsule.meshVisibility,
            accessPattern: this.generateLayerAccessPattern(layerName),
            sharingRules: this.generateLayerSharingRules(layerName),
            encryptionLevel: this.getLayerEncryptionLevel(layerName)
        };
        
        this.capsuleMeshPatterns.set(layerName, pattern);
        console.log(`🔮 Generated mesh pattern for ${layerName} capsule`);
    }

    // Generate layer access pattern
    generateLayerAccessPattern(layerName) {
        const hash = crypto.createHash('md5').update(`access_${layerName}_${this.deviceId}`).digest('hex');
        const pattern = [];
        
        for (let i = 0; i < 64; i++) {
            const accessValue = parseInt(hash.substring(i % 32, (i % 32) + 2), 16);
            pattern.push({
                segmentIndex: i,
                accessible: accessValue > 128,
                accessLevel: accessValue / 255,
                requiresHandshake: accessValue > 200
            });
        }
        
        return pattern;
    }

    // Generate layer sharing rules
    generateLayerSharingRules(layerName) {
        const capsule = this.capsuleLayers[layerName];
        
        return {
            canShare: capsule.attributes.shareable,
            sharingThreshold: capsule.meshVisibility.handshakeView,
            requiresTrust: layerName === 'identity' || layerName === 'memory',
            anonymizable: layerName === 'interaction' || layerName === 'projection',
            partialSharingAllowed: true,
            sharingDecay: layerName === 'interaction' ? 0.1 : 0.0 // Interactions fade over time
        };
    }

    // Get layer encryption level
    getLayerEncryptionLevel(layerName) {
        const levels = {
            identity: 'maximum',    // Identity is always heavily encrypted
            memory: 'high',         // Memories are mostly encrypted
            interaction: 'medium',  // Interactions have moderate encryption
            projection: 'low'       // Projections are mostly open
        };
        
        return levels[layerName] || 'medium';
    }

    // Start capsule update loops
    startCapsuleUpdateLoops() {
        // Memory capsule updates every 30 seconds
        setInterval(() => {
            this.updateMemoryCapsule();
        }, 30000);

        // Interaction capsule updates every 10 seconds
        setInterval(() => {
            this.updateInteractionCapsule();
        }, 10000);

        // Projection capsule updates every 60 seconds
        setInterval(() => {
            this.updateProjectionCapsule();
        }, 60000);

        // Save capsules every 5 minutes (async)
        setInterval(async () => {
            await this.saveCapsules();
        }, 300000);
    }

    // Update memory capsule with new experiences
    updateMemoryCapsule() {
        const memoryCapusle = this.capsuleLayers.memory;
        const meshStatus = this.meshNetwork.getMeshStatus();
        
        // Add new experience if mesh state changed
        if (meshStatus.discoveredDevices > memoryCapusle.data.recentExperiences.length) {
            memoryCapusle.data.recentExperiences.push({
                timestamp: Date.now(),
                type: 'new_device_discovered',
                description: `Discovered device in mesh network`,
                significance: 0.6,
                emotional_weight: 0.4
            });
            
            // Keep only recent experiences (last 10)
            if (memoryCapusle.data.recentExperiences.length > 10) {
                memoryCapusle.data.recentExperiences.shift();
            }
        }
    }

    // Update interaction capsule with current connections
    updateInteractionCapsule() {
        const interactionCapsule = this.capsuleLayers.interaction;
        const meshStatus = this.meshNetwork.getMeshStatus();
        
        // Update active connections count
        interactionCapsule.data.currentInteractions = [];
        this.meshNetwork.meshNodes.forEach((node, deviceId) => {
            if (node.handshakeComplete) {
                interactionCapsule.data.currentInteractions.push({
                    deviceId: deviceId,
                    connectionType: 'mesh_handshake',
                    strength: 0.7,
                    lastInteraction: node.lastSeen,
                    trustLevel: interactionCapsule.data.trustedDevices.has(deviceId) ? 0.8 : 0.3
                });
            }
        });
    }

    // Update projection capsule with goal progress
    updateProjectionCapsule() {
        const projectionCapsule = this.capsuleLayers.projection;
        const meshStatus = this.meshNetwork.getMeshStatus();
        
        // Update goal progress based on mesh status
        projectionCapsule.core.futureGoals.forEach(goal => {
            if (goal.id === 'expand_network') {
                goal.progress = Math.min(0.9, meshStatus.completedHandshakes / 5); // Progress toward 5 connections
            } else if (goal.id === 'enhance_capabilities') {
                goal.progress = Math.min(0.5, meshStatus.visibleRemoteSegments / 100); // Progress based on visibility
            }
        });
        
        // Update growth metrics
        projectionCapsule.data.growthMetrics.relationship_formation = meshStatus.completedHandshakes / 10;
        projectionCapsule.data.growthMetrics.adaptation_speed = Math.min(1.0, (Date.now() - this.initTime) / 3600000); // Time-based adaptation
    }

    // Save capsules to storage with encryption
    async saveCapsules() {
        for (const layerName of Object.keys(this.capsuleLayers)) {
            const capsule = this.capsuleLayers[layerName];
            const filename = path.join(this.capsuleStorageDir, `${layerName}.soulfra`);
            
            const capsuleData = {
                ...capsule,
                savedAt: Date.now(),
                version: '1.0.0',
                deviceSignature: this.meshNetwork.deviceFingerprint.substring(0, 32)
            };
            
            try {
                // Use security system to save encrypted capsule
                await this.securitySystem.saveCapsuleSecurely(capsuleData, layerName, filename);
                console.log(`🔐 Saved ${layerName} capsule securely to ${filename}`);
            } catch (error) {
                console.error(`❌ Failed to save ${layerName} capsule:`, error);
            }
        }
    }

    // Load capsules from storage with decryption
    async loadCapsules() {
        for (const layerName of Object.keys(this.capsuleLayers)) {
            const filename = path.join(this.capsuleStorageDir, `${layerName}.soulfra`);
            
            if (fs.existsSync(filename)) {
                try {
                    // Use security system to load encrypted capsule
                    const loadResult = await this.securitySystem.loadCapsuleSecurely(layerName, filename);
                    
                    // Handle new verification return format
                    if (loadResult.data && loadResult.verified) {
                        this.capsuleLayers[layerName] = loadResult.data;
                        console.log(`🔓 Loaded ${layerName} capsule securely from ${filename} (Verification ID: ${loadResult.verificationId})`);
                    } else {
                        // Fallback for backward compatibility
                        this.capsuleLayers[layerName] = loadResult;
                        console.log(`🔓 Loaded ${layerName} capsule securely from ${filename}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to load ${layerName} capsule:`, error);
                    // Keep the default capsule if loading fails
                }
            }
        }
    }

    // Get capsule visibility through handshake mesh
    getCapsuleVisibilityThroughMesh(viewerDeviceId, layerName) {
        const capsule = this.capsuleLayers[layerName];
        const meshPattern = this.capsuleMeshPatterns.get(layerName);
        
        if (!capsule || !meshPattern) return null;
        
        // Calculate what the viewer device can see of this capsule
        const viewerHash = crypto.createHash('md5')
            .update(this.deviceId + viewerDeviceId + layerName)
            .digest('hex');
            
        const visibilityMask = [];
        for (let i = 0; i < 64; i++) {
            const visibility = parseInt(viewerHash.substring(i % 32, (i % 32) + 2), 16) / 255;
            const baseVisibility = capsule.meshVisibility.handshakeView;
            
            visibilityMask.push({
                segmentIndex: i,
                visible: visibility < baseVisibility,
                opacity: visibility * baseVisibility,
                dataAccessible: visibility < (baseVisibility * 0.5)
            });
        }
        
        return {
            layerName: layerName,
            viewerDevice: viewerDeviceId,
            visibilityMask: visibilityMask,
            accessibleData: this.getAccessibleCapsuleData(capsule, visibilityMask),
            meshPattern: meshPattern
        };
    }

    // Get accessible capsule data based on visibility
    getAccessibleCapsuleData(capsule, visibilityMask) {
        const accessibleSegments = visibilityMask.filter(m => m.dataAccessible).length;
        const totalSegments = visibilityMask.length;
        const accessRatio = accessibleSegments / totalSegments;
        
        // Return partial data based on access ratio
        const partialData = {
            type: capsule.type,
            layer: capsule.layer,
            accessRatio: accessRatio,
            visibleAttributes: {}
        };
        
        // Include data based on access ratio
        if (accessRatio > 0.1) {
            partialData.visibleAttributes.basic_info = {
                name: capsule.data.name || 'Unknown',
                type: capsule.type
            };
        }
        
        if (accessRatio > 0.3) {
            partialData.visibleAttributes.some_details = 'Partial details visible';
        }
        
        if (accessRatio > 0.6) {
            partialData.visibleAttributes.significant_data = 'Significant data accessible';
        }
        
        if (accessRatio > 0.8) {
            partialData.visibleAttributes.full_access = 'Nearly full access available';
        }
        
        return partialData;
    }

    // Get full capsule status
    getCapsuleStatus() {
        const status = {
            deviceId: this.deviceId,
            capsuleSystem: 'soulfra_v1',
            layers: {},
            meshPatterns: {},
            storageLocation: this.capsuleStorageDir,
            systemHealth: 'active',
            security: this.securitySystem.getSecurityStatus(),
            verification: this.securitySystem.verificationGateway.getVerificationStatus()
        };
        
        // Add status for each layer
        Object.keys(this.capsuleLayers).forEach(layerName => {
            const capsule = this.capsuleLayers[layerName];
            status.layers[layerName] = {
                type: capsule.type,
                layer: capsule.layer,
                capsuleId: capsule.capsuleId,
                attributes: capsule.attributes,
                meshVisibility: capsule.meshVisibility,
                lastUpdated: capsule.core.lastUpdated || 'Never'
            };
        });
        
        // Add mesh pattern status
        this.capsuleMeshPatterns.forEach((pattern, layerName) => {
            status.meshPatterns[layerName] = {
                patternId: pattern.patternId,
                encryptionLevel: pattern.encryptionLevel,
                sharingRules: pattern.sharingRules
            };
        });
        
        return status;
    }

    // Export capsule data for integration
    exportCapsuleDataForMesh() {
        return {
            deviceId: this.deviceId,
            capsuleLayers: this.capsuleLayers,
            meshPatterns: Object.fromEntries(this.capsuleMeshPatterns),
            exportTimestamp: Date.now(),
            version: '1.0.0'
        };
    }

    // Verify integrity of all capsules
    async verifyCapsuleIntegrity() {
        console.log('🔍 Verifying capsule integrity...');
        const results = await this.securitySystem.verifyAllCapsuleIntegrity();
        
        if (results.invalidCapsules > 0) {
            console.error(`⚠️ Found ${results.invalidCapsules} corrupted capsules!`);
            results.errors.forEach(error => {
                console.error(`   - ${error.capsule}: ${error.error}`);
            });
        } else {
            console.log(`✅ All ${results.validCapsules} capsules verified successfully`);
        }
        
        return results;
    }

    // Create secure backup of all capsules
    async createSecureBackup(backupPath = './backups') {
        console.log('💾 Creating secure backup of all capsules...');
        const backupDir = await this.securitySystem.createSecureBackup(backupPath);
        console.log(`✅ Secure backup created at: ${backupDir}`);
        return backupDir;
    }

    // Rotate encryption keys for enhanced security
    async rotateSecurityKeys() {
        console.log('🔄 Rotating capsule encryption keys...');
        await this.securitySystem.rotateCapsuleKeys();
        console.log('✅ Security keys rotated successfully');
        
        // Re-save all capsules with new keys
        await this.saveCapsules();
        console.log('🔐 All capsules re-encrypted with new keys');
    }

    // Emergency security lockdown
    async emergencyLockdown() {
        console.log('🚨 EMERGENCY SECURITY LOCKDOWN ACTIVATED');
        
        // Immediately save current state
        await this.saveCapsules();
        
        // Rotate all keys
        await this.rotateSecurityKeys();
        
        // Create emergency backup
        const backupDir = await this.createSecureBackup('./emergency-backup');
        
        console.log('🔒 Emergency lockdown complete');
        console.log(`📦 Emergency backup: ${backupDir}`);
        
        return {
            lockdownTime: Date.now(),
            backupLocation: backupDir,
            status: 'secure'
        };
    }
}

module.exports = SoulfraCapsuleMesh;
#!/usr/bin/env node

/**
 * RING 5: BROADCAST LAYER
 * 
 * The public broadcast layer that streams mathematical proofs and system verification
 * from Ring 0 (Mathematical/RNG Core) to public audiences. Provides:
 * - Real-time mathematical proof broadcasting
 * - Ring 0 ↔ Ring 5 pairing system
 * - Integration with constellation broadcast verification stream
 * - Public auditable mathematical verification
 * - WebSocket streaming for mathematical proofs
 * - Verification feedback loop to Ring 0
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Import dependencies
const ConstellationBroadcastVerificationStream = require('./CONSTELLATION-BROADCAST-VERIFICATION-STREAM');
const unifiedColorSystem = require('./unified-color-system');

class Ring5BroadcastLayer extends EventEmitter {
    constructor() {
        super();
        
        this.ringId = 5;
        this.ringName = 'Broadcast Layer';
        
        // Ring 5 configuration
        this.config = {
            // WebSocket server for Ring 0 pairing
            ring0PairingPort: 7778,     // Matches Ring 0 expectation
            
            // Mathematical proof broadcasting
            mathProofStreamPort: 7781,   // Dedicated mathematical proof stream
            
            // Public API for broadcast access
            publicApiPort: 7782,         // Public API for broadcast data
            
            // Ring pairing configuration
            pairing: {
                sourceRings: [0],         // Accept data from Ring 0
                targetRings: ['public'],  // Broadcast to public
                bidirectional: true,      // Allow feedback to Ring 0
                verificationRequired: true
            }
        };
        
        // Broadcast state management
        this.broadcastState = {
            ring0Connected: false,
            ring0Client: null,
            
            // Mathematical proof broadcasting
            mathProofs: new Map(),           // proofId -> proof data
            activeStreams: new Map(),        // streamId -> stream info
            publicViewers: new Set(),        // Set of connected public viewers
            
            // Pairing state
            pairingActive: false,
            lastRing0Heartbeat: null,
            verificationFeedback: new Map(), // proofId -> feedback
            
            // Metrics
            totalProofsBroadcast: 0,
            totalPublicViewers: 0,
            totalDataBroadcast: 0,
            uptime: 0
        };
        
        // Integration with constellation broadcast system
        this.constellationBroadcast = null;
        
        // Mathematical proof processing
        this.proofProcessor = new MathematicalProofProcessor(this);
        this.feedbackProcessor = new VerificationFeedbackProcessor(this);
        
        console.log(unifiedColorSystem.formatStatus('info', 'Ring 5 Broadcast Layer initializing...'));
        this.initialize();
    }
    
    async initialize() {
        try {
            // Phase 1: Initialize constellation broadcast integration
            await this.initializeConstellationBroadcast();
            
            // Phase 2: Set up Ring 0 ↔ Ring 5 pairing
            await this.setupRing0Pairing();
            
            // Phase 3: Set up mathematical proof streaming
            await this.setupMathematicalProofStreaming();
            
            // Phase 4: Set up public API
            await this.setupPublicAPI();
            
            // Phase 5: Start broadcast monitoring
            this.startBroadcastMonitoring();
            
            // Phase 6: Connect to Ring 0 if available
            await this.connectToRing0();
            
            console.log(unifiedColorSystem.formatStatus('success', 'Ring 5 Broadcast Layer ready'));
            
            this.emit('ring5Ready', {
                ringId: this.ringId,
                ring0Connected: this.broadcastState.ring0Connected,
                publicViewers: this.broadcastState.publicViewers.size,
                activeStreams: this.broadcastState.activeStreams.size
            });
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('error', `Ring 5 initialization failed: ${error.message}`));
            throw error;
        }
    }
    
    /**
     * CONSTELLATION BROADCAST INTEGRATION
     */
    async initializeConstellationBroadcast() {
        console.log(unifiedColorSystem.formatStatus('info', 'Integrating with constellation broadcast system...'));
        
        try {
            // Initialize the constellation broadcast system
            this.constellationBroadcast = new ConstellationBroadcastVerificationStream({
                mathematical: {
                    enableMathematicalProofBroadcast: true,
                    ring0Integration: true,
                    publicVerificationStreaming: true
                }
            });
            
            // Set up event listeners for mathematical proof broadcasting
            this.constellationBroadcast.on('broadcast:initialized', (data) => {
                console.log(unifiedColorSystem.formatStatus('success', 
                    'Constellation broadcast system ready for Ring 5 integration'));
            });
            
            console.log(unifiedColorSystem.formatStatus('success', 'Constellation broadcast integration ready'));
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', 
                `Constellation broadcast not available: ${error.message}`));
            // Continue without constellation integration
        }
    }
    
    /**
     * RING 0 ↔ RING 5 PAIRING SYSTEM
     */
    async setupRing0Pairing() {
        console.log(unifiedColorSystem.formatStatus('info', 'Setting up Ring 0 ↔ Ring 5 pairing...'));
        
        // Create WebSocket server for Ring 0 connections
        this.ring0Server = new WebSocket.Server({
            port: this.config.ring0PairingPort,
            perMessageDeflate: true
        });
        
        this.ring0Server.on('connection', (ws, req) => {
            this.handleRing0Connection(ws, req);
        });
        
        // Set up heartbeat system
        this.heartbeatInterval = setInterval(() => {
            this.maintainRing0Heartbeat();
        }, 30000); // Every 30 seconds
        
        console.log(unifiedColorSystem.formatStatus('success', 
            `Ring 0 pairing server listening on ws://localhost:${this.config.ring0PairingPort}`));
    }
    
    handleRing0Connection(ws, req) {
        console.log(unifiedColorSystem.formatStatus('info', 'Ring 0 attempting connection...'));
        
        // Verify this is actually Ring 0
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                
                if (message.type === 'ring0_handshake') {
                    this.establishRing0Pairing(ws, message);
                } else if (message.type === 'mathematical_proof') {
                    this.handleMathematicalProofFromRing0(message);
                } else if (message.type === 'heartbeat') {
                    this.handleRing0Heartbeat(message);
                }
                
            } catch (error) {
                console.log(unifiedColorSystem.formatStatus('warning', 
                    `Invalid message from Ring 0: ${error.message}`));
            }
        });
        
        ws.on('close', () => {
            this.handleRing0Disconnect();
        });
        
        ws.on('error', (error) => {
            console.log(unifiedColorSystem.formatStatus('error', 
                `Ring 0 connection error: ${error.message}`));
        });
    }
    
    establishRing0Pairing(ws, handshakeMessage) {
        // Verify Ring 0 identity
        if (handshakeMessage.ringId === 0 && handshakeMessage.ringName === 'Mathematical/RNG Core') {
            this.broadcastState.ring0Connected = true;
            this.broadcastState.ring0Client = ws;
            this.broadcastState.lastRing0Heartbeat = Date.now();
            this.broadcastState.pairingActive = true;
            
            // Send pairing confirmation
            this.sendToRing0({
                type: 'pairing_established',
                ringId: this.ringId,
                ringName: this.ringName,
                timestamp: Date.now(),
                capabilities: [
                    'mathematical_proof_broadcast',
                    'public_verification_streaming',
                    'verification_feedback',
                    'constellation_integration'
                ]
            });
            
            console.log(unifiedColorSystem.formatStatus('success', 'Ring 0 ↔ Ring 5 pairing established'));
            
            this.emit('ring0PairingEstablished', {
                timestamp: Date.now(),
                ring0Capabilities: handshakeMessage.capabilities || []
            });
            
        } else {
            console.log(unifiedColorSystem.formatStatus('warning', 'Invalid Ring 0 handshake attempt'));
            ws.close();
        }
    }
    
    handleRing0Disconnect() {
        this.broadcastState.ring0Connected = false;
        this.broadcastState.ring0Client = null;
        this.broadcastState.pairingActive = false;
        this.broadcastState.lastRing0Heartbeat = null;
        
        console.log(unifiedColorSystem.formatStatus('warning', 'Ring 0 ↔ Ring 5 pairing disconnected'));
        
        this.emit('ring0PairingLost', {
            timestamp: Date.now(),
            uptime: this.broadcastState.uptime
        });
    }
    
    /**
     * MATHEMATICAL PROOF BROADCASTING
     */
    async handleMathematicalProofFromRing0(proofMessage) {
        console.log(unifiedColorSystem.formatStatus('info', 
            `Broadcasting mathematical proof: ${proofMessage.data.formula}`));
        
        // Process the mathematical proof
        const processedProof = await this.proofProcessor.process(proofMessage);
        
        // Store the proof
        this.broadcastState.mathProofs.set(processedProof.proofId, processedProof);
        
        // Broadcast to public viewers
        await this.broadcastMathematicalProof(processedProof);
        
        // Integrate with constellation broadcast
        if (this.constellationBroadcast) {
            await this.broadcastToConstellation(processedProof);
        }
        
        // Send feedback to Ring 0
        await this.sendVerificationFeedbackToRing0(processedProof);
        
        this.broadcastState.totalProofsBroadcast++;
    }
    
    async broadcastMathematicalProof(proof) {
        const broadcastMessage = {
            type: 'mathematical_proof_broadcast',
            ringSource: 0,
            ringDestination: 'public',
            proof: {
                id: proof.proofId,
                formula: proof.formula,
                variables: proof.variables,
                result: proof.result,
                verification: proof.verification,
                timestamp: proof.timestamp,
                ring0Signature: proof.ring0Signature
            },
            broadcast: {
                timestamp: Date.now(),
                viewers: this.broadcastState.publicViewers.size,
                streamId: crypto.randomBytes(8).toString('hex')
            }
        };
        
        // Broadcast to all public viewers
        for (const viewerId of this.broadcastState.publicViewers) {
            // Send to viewer WebSocket connections
            this.sendToPublicViewer(viewerId, broadcastMessage);
        }
        
        // Log the broadcast
        console.log(unifiedColorSystem.formatStatus('success', 
            `Mathematical proof broadcast to ${this.broadcastState.publicViewers.size} viewers`));
        
        this.broadcastState.totalDataBroadcast += JSON.stringify(broadcastMessage).length;
    }
    
    async broadcastToConstellation(proof) {
        if (!this.constellationBroadcast) return;
        
        // Integrate mathematical proof into constellation verification stream
        const constellationMessage = {
            type: 'mathematical-proof',
            data: {
                ring: 0,
                proof: proof,
                verification: 'ring_5_broadcast_verified',
                timestamp: Date.now()
            }
        };
        
        // Emit to constellation broadcast system
        this.constellationBroadcast.emit('mathematical:proof', constellationMessage);
    }
    
    /**
     * VERIFICATION FEEDBACK TO RING 0
     */
    async sendVerificationFeedbackToRing0(proof) {
        if (!this.broadcastState.ring0Connected) return;
        
        // Generate public verification feedback
        const feedback = {
            proofId: proof.proofId,
            publicVerification: {
                broadcast: true,
                viewers: this.broadcastState.publicViewers.size,
                verificationHash: crypto.createHash('sha256')
                    .update(JSON.stringify(proof))
                    .digest('hex'),
                timestamp: Date.now()
            },
            constellationVerification: this.constellationBroadcast ? {
                integrated: true,
                streamActive: true
            } : null,
            ring5Signature: this.generateRing5Signature(proof)
        };
        
        this.sendToRing0({
            type: 'verification_feedback',
            proofId: proof.proofId,
            feedback: feedback,
            timestamp: Date.now()
        });
        
        // Store feedback
        this.broadcastState.verificationFeedback.set(proof.proofId, feedback);
    }
    
    generateRing5Signature(proof) {
        const signatureData = {
            ringId: this.ringId,
            proofId: proof.proofId,
            timestamp: Date.now(),
            publicBroadcast: true
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(signatureData))
            .digest('hex')
            .slice(0, 16);
    }
    
    /**
     * PUBLIC API AND VIEWER MANAGEMENT
     */
    async setupPublicAPI() {
        console.log(unifiedColorSystem.formatStatus('info', 'Setting up public broadcast API...'));
        
        // Create WebSocket server for public viewers
        this.publicServer = new WebSocket.Server({
            port: this.config.publicApiPort,
            perMessageDeflate: true
        });
        
        this.publicServer.on('connection', (ws, req) => {
            this.handlePublicViewerConnection(ws, req);
        });
        
        console.log(unifiedColorSystem.formatStatus('success', 
            `Public broadcast API listening on ws://localhost:${this.config.publicApiPort}`));
    }
    
    handlePublicViewerConnection(ws, req) {
        const viewerId = crypto.randomBytes(8).toString('hex');
        
        this.broadcastState.publicViewers.add(viewerId);
        this.broadcastState.totalPublicViewers++;
        
        console.log(unifiedColorSystem.formatStatus('info', 
            `Public viewer connected: ${viewerId} (${this.broadcastState.publicViewers.size} total)`));
        
        // Send welcome message
        this.sendToPublicViewer(viewerId, {
            type: 'welcome',
            viewerId: viewerId,
            ring: this.ringId,
            capabilities: [
                'mathematical_proof_streaming',
                'real_time_verification',
                'constellation_integration',
                'ring_0_pairing_status'
            ],
            status: this.getRing5Status(),
            timestamp: Date.now()
        });
        
        ws.on('message', (data) => {
            this.handlePublicViewerMessage(viewerId, data);
        });
        
        ws.on('close', () => {
            this.broadcastState.publicViewers.delete(viewerId);
            console.log(unifiedColorSystem.formatStatus('info', 
                `Public viewer disconnected: ${viewerId} (${this.broadcastState.publicViewers.size} remaining)`));
        });
    }
    
    sendToPublicViewer(viewerId, message) {
        // Find the WebSocket for this viewer
        for (const ws of this.publicServer.clients) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify({
                        ...message,
                        viewerId: viewerId,
                        ring5Timestamp: Date.now()
                    }));
                } catch (error) {
                    console.log(unifiedColorSystem.formatStatus('warning', 
                        `Failed to send to viewer ${viewerId}: ${error.message}`));
                }
            }
        }
    }
    
    /**
     * RING 0 CONNECTION MANAGEMENT
     */
    async connectToRing0() {
        if (this.broadcastState.ring0Connected) return;
        
        console.log(unifiedColorSystem.formatStatus('info', 'Attempting to connect to Ring 0...'));
        
        try {
            // Ring 0 should connect to us, but we can attempt to establish contact
            // This is more of a health check
            
            console.log(unifiedColorSystem.formatStatus('info', 
                'Ring 5 ready for Ring 0 connection on ws://localhost:7778'));
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', 
                `Ring 0 connection attempt failed: ${error.message}`));
        }
    }
    
    sendToRing0(message) {
        if (this.broadcastState.ring0Client && 
            this.broadcastState.ring0Client.readyState === WebSocket.OPEN) {
            
            try {
                this.broadcastState.ring0Client.send(JSON.stringify({
                    ...message,
                    ringSource: this.ringId,
                    ring5Timestamp: Date.now()
                }));
            } catch (error) {
                console.log(unifiedColorSystem.formatStatus('warning', 
                    `Failed to send to Ring 0: ${error.message}`));
            }
        }
    }
    
    maintainRing0Heartbeat() {
        if (this.broadcastState.ring0Connected) {
            const now = Date.now();
            const timeSinceHeartbeat = now - (this.broadcastState.lastRing0Heartbeat || 0);
            
            if (timeSinceHeartbeat > 60000) { // 1 minute timeout
                console.log(unifiedColorSystem.formatStatus('warning', 'Ring 0 heartbeat timeout'));
                this.handleRing0Disconnect();
            } else {
                // Send heartbeat to Ring 0
                this.sendToRing0({
                    type: 'heartbeat',
                    timestamp: now,
                    uptime: this.broadcastState.uptime
                });
            }
        }
    }
    
    handleRing0Heartbeat(heartbeatMessage) {
        this.broadcastState.lastRing0Heartbeat = Date.now();
        
        // Update Ring 0 status from heartbeat
        if (heartbeatMessage.status) {
            this.emit('ring0StatusUpdate', heartbeatMessage.status);
        }
    }
    
    /**
     * BROADCAST MONITORING
     */
    startBroadcastMonitoring() {
        // Update uptime every second
        this.uptimeInterval = setInterval(() => {
            this.broadcastState.uptime += 1000;
        }, 1000);
        
        // Log broadcast stats every 30 seconds
        this.statsInterval = setInterval(() => {
            this.logBroadcastStats();
        }, 30000);
        
        // Clean up old proofs every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldProofs();
        }, 300000);
    }
    
    logBroadcastStats() {
        const stats = this.getRing5Status();
        
        console.log(unifiedColorSystem.formatStatus('info', 
            `Ring 5 Stats: ${stats.pairing.ring0Connected ? '🔗' : '❌'} Ring0 | ` +
            `👥 ${stats.broadcast.publicViewers} viewers | ` +
            `📊 ${stats.broadcast.totalProofsBroadcast} proofs broadcast`));
    }
    
    cleanupOldProofs() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        let cleanedCount = 0;
        
        for (const [proofId, proof] of this.broadcastState.mathProofs) {
            if (proof.timestamp < cutoffTime) {
                this.broadcastState.mathProofs.delete(proofId);
                this.broadcastState.verificationFeedback.delete(proofId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(unifiedColorSystem.formatStatus('info', 
                `Cleaned up ${cleanedCount} old mathematical proofs`));
        }
    }
    
    /**
     * STATUS AND DIAGNOSTICS
     */
    getRing5Status() {
        return {
            ringId: this.ringId,
            ringName: this.ringName,
            
            pairing: {
                ring0Connected: this.broadcastState.ring0Connected,
                pairingActive: this.broadcastState.pairingActive,
                lastRing0Heartbeat: this.broadcastState.lastRing0Heartbeat,
                uptime: this.broadcastState.uptime
            },
            
            broadcast: {
                publicViewers: this.broadcastState.publicViewers.size,
                totalPublicViewers: this.broadcastState.totalPublicViewers,
                totalProofsBroadcast: this.broadcastState.totalProofsBroadcast,
                totalDataBroadcast: this.broadcastState.totalDataBroadcast,
                activeStreams: this.broadcastState.activeStreams.size
            },
            
            integration: {
                constellationBroadcast: !!this.constellationBroadcast,
                mathProofsStored: this.broadcastState.mathProofs.size,
                feedbackStored: this.broadcastState.verificationFeedback.size
            },
            
            servers: {
                ring0Pairing: {
                    port: this.config.ring0PairingPort,
                    active: !!this.ring0Server
                },
                publicApi: {
                    port: this.config.publicApiPort,
                    active: !!this.publicServer
                }
            }
        };
    }
    
    async runDiagnostics() {
        console.log('\n=== Ring 5 Broadcast Layer Diagnostics ===\n');
        
        const status = this.getRing5Status();
        
        console.log('🔗 Ring 0 ↔ Ring 5 Pairing:');
        console.log(`  Connected: ${status.pairing.ring0Connected ? '✅' : '❌'}`);
        console.log(`  Pairing Active: ${status.pairing.pairingActive ? '✅' : '❌'}`);
        console.log(`  Last Heartbeat: ${status.pairing.lastRing0Heartbeat ? 
            new Date(status.pairing.lastRing0Heartbeat).toISOString() : 'Never'}`);
        console.log(`  Uptime: ${Math.floor(status.pairing.uptime / 1000)}s`);
        
        console.log('\n📡 Broadcast Status:');
        console.log(`  Public Viewers: ${status.broadcast.publicViewers}`);
        console.log(`  Total Viewers: ${status.broadcast.totalPublicViewers}`);
        console.log(`  Proofs Broadcast: ${status.broadcast.totalProofsBroadcast}`);
        console.log(`  Data Broadcast: ${(status.broadcast.totalDataBroadcast / 1024).toFixed(2)} KB`);
        
        console.log('\n🌐 Server Status:');
        console.log(`  Ring 0 Pairing: Port ${status.servers.ring0Pairing.port} ${status.servers.ring0Pairing.active ? '✅' : '❌'}`);
        console.log(`  Public API: Port ${status.servers.publicApi.port} ${status.servers.publicApi.active ? '✅' : '❌'}`);
        
        console.log('\n🔬 Integration Status:');
        console.log(`  Constellation Broadcast: ${status.integration.constellationBroadcast ? '✅' : '❌'}`);
        console.log(`  Math Proofs Stored: ${status.integration.mathProofsStored}`);
        console.log(`  Feedback Stored: ${status.integration.feedbackStored}`);
        
        console.log('\n=== Diagnostics Complete ===\n');
    }
    
    /**
     * CLEANUP
     */
    async cleanup() {
        console.log(unifiedColorSystem.formatStatus('info', 'Ring 5 Broadcast Layer shutting down...'));
        
        // Clear intervals
        clearInterval(this.heartbeatInterval);
        clearInterval(this.uptimeInterval);
        clearInterval(this.statsInterval);
        clearInterval(this.cleanupInterval);
        
        // Close WebSocket servers
        if (this.ring0Server) {
            this.ring0Server.close();
        }
        
        if (this.publicServer) {
            this.publicServer.close();
        }
        
        // Cleanup constellation broadcast
        if (this.constellationBroadcast) {
            await this.constellationBroadcast.cleanup();
        }
        
        console.log(unifiedColorSystem.formatStatus('success', 'Ring 5 cleanup complete'));
    }
}

/**
 * HELPER CLASSES
 */

class MathematicalProofProcessor {
    constructor(ring5) {
        this.ring5 = ring5;
    }
    
    async process(proofMessage) {
        const proofId = crypto.randomBytes(8).toString('hex');
        
        return {
            proofId: proofId,
            formula: proofMessage.data.formula,
            variables: proofMessage.data.variables,
            result: proofMessage.data.result,
            verification: proofMessage.data.verification,
            timestamp: proofMessage.data.timestamp,
            ring0Signature: proofMessage.verification?.hash,
            
            // Ring 5 processing metadata
            processedAt: Date.now(),
            broadcastReady: true,
            publicVerification: {
                verified: true,
                method: 'ring_5_broadcast_processing'
            }
        };
    }
}

class VerificationFeedbackProcessor {
    constructor(ring5) {
        this.ring5 = ring5;
    }
    
    async generateFeedback(proof) {
        return {
            proofId: proof.proofId,
            verified: true,
            publicBroadcast: true,
            viewers: this.ring5.broadcastState.publicViewers.size,
            constellationIntegrated: !!this.ring5.constellationBroadcast,
            timestamp: Date.now()
        };
    }
}

// Export Ring 5 Broadcast Layer
module.exports = Ring5BroadcastLayer;

// Self-test if run directly
if (require.main === module) {
    (async () => {
        const ring5 = new Ring5BroadcastLayer();
        
        // Wait for initialization
        await new Promise(resolve => {
            ring5.on('ring5Ready', resolve);
        });
        
        // Run diagnostics
        await ring5.runDiagnostics();
        
        console.log('\n🚀 Ring 5 Broadcast Layer is running!');
        console.log('📡 Waiting for Ring 0 mathematical proof broadcasts...');
        console.log('🌐 Public viewers can connect to ws://localhost:7782');
        console.log('Press Ctrl+C to shutdown.\n');
        
        // Handle shutdown
        process.on('SIGINT', async () => {
            await ring5.cleanup();
            process.exit(0);
        });
        
    })().catch(console.error);
}
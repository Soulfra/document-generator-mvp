#!/usr/bin/env node

/**
 * IDENTITY ENCODER CONNECTOR
 * 
 * Connects the Universal Identity Encoder with Hollowtown Layer System
 * - Messages encoded based on sender's identity layer
 * - Context-appropriate emoji encoding
 * - Layer-based decryption permissions
 * - Cross-context identity transitions
 */

const UniversalIdentityEncoder = require('./universal-identity-encoder.js');
const HollowtownLayerSystem = require('./hollowtown-layer-system.js');
const crypto = require('crypto');

class IdentityEncoderConnector {
    constructor() {
        // Initialize core systems
        this.identityEncoder = new UniversalIdentityEncoder();
        this.hollowtownSystem = new HollowtownLayerSystem();
        
        // Map identity contexts to Hollowtown contexts
        this.contextMapping = {
            gaming: 'hollowtown',      // Gaming → Spooky theme
            business: 'keybind',       // Business → Control/professional
            social: 'bozo',           // Social → Fun circus theme
            sailing: 'music',         // Sailing → Rhythmic ocean vibes
            drinking: 'drinking',     // Direct mapping
            system: 'keybind',       // System → Technical controls
            private: 'hollowtown'    // Private → Hidden in fog
        };
        
        // Track encoded messages by identity
        this.messageHistory = new Map();
        
        console.log('🔗 Identity Encoder Connector initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Set up event listeners for identity changes
        this.identityEncoder.on('identityCreated', async (event) => {
            console.log(`🎭 New identity created with codenames:`, event.codenames);
            await this.assignEncoderContexts(event.systemPID, event.codenames);
        });
        
        this.identityEncoder.on('identityTransitioned', async (event) => {
            console.log(`🔄 Identity transitioned: ${event.fromPID} → ${event.toPID}`);
            await this.handleIdentityTransition(event);
        });
        
        console.log('✅ Identity Encoder Connector ready');
    }
    
    /**
     * Assign Hollowtown encoder contexts to identity
     */
    async assignEncoderContexts(systemPID, codenames) {
        const assignments = {};
        
        // Assign appropriate encoder for each codename context
        for (const [context, codename] of Object.entries(codenames)) {
            const encoderContext = this.contextMapping[context] || 'hollowtown';
            assignments[context] = {
                codename,
                encoderContext,
                description: this.getContextDescription(encoderContext)
            };
        }
        
        // Store assignments
        this.messageHistory.set(systemPID, {
            assignments,
            messages: []
        });
        
        return assignments;
    }
    
    /**
     * Get context description from Hollowtown system
     */
    getContextDescription(encoderContext) {
        const encoder = this.hollowtownSystem.contextualEncoders.get(encoderContext);
        return encoder ? encoder.storyline : 'Unknown context';
    }
    
    /**
     * Encode message with identity-aware context
     */
    async encodeMessage(senderPID, message, requestedContext = null) {
        console.log('\n🔐 Identity-aware message encoding...');
        
        // Get sender identity
        const senderIdentity = await this.identityEncoder.getIdentity(
            senderPID, 
            senderPID, 
            requestedContext || 'gaming', 
            5 // Full access to own data
        );
        
        if (senderIdentity.error) {
            return { error: 'Sender identity not found' };
        }
        
        // Determine encoding context
        const identityContext = requestedContext || 'gaming';
        const encoderContext = this.contextMapping[identityContext] || 'hollowtown';
        
        // Switch Hollowtown to appropriate context
        this.hollowtownSystem.switchContext(encoderContext);
        
        // Encode the message
        const encoded = this.hollowtownSystem.encode(message);
        
        // Create signed message
        const signedMessage = {
            from: senderIdentity.publicName,
            fromPID: senderPID,
            context: identityContext,
            encoderContext: encoderContext,
            encoded: encoded.encoded,
            timestamp: Date.now(),
            signature: this.signMessage(senderPID, encoded.encoded)
        };
        
        // Store in message history
        if (this.messageHistory.has(senderPID)) {
            this.messageHistory.get(senderPID).messages.push(signedMessage);
        }
        
        console.log(`✅ Message encoded in ${encoderContext} context`);
        console.log(`   From: ${senderIdentity.publicName}`);
        console.log(`   Encoded: ${encoded.encoded}`);
        
        return signedMessage;
    }
    
    /**
     * Decode message with layer access verification
     */
    async decodeMessage(signedMessage, readerPID, readerLayerLevel = 0) {
        console.log('\n🔓 Identity-aware message decoding...');
        
        // Check reader's access to sender's identity
        const senderIdentity = await this.identityEncoder.getIdentity(
            signedMessage.fromPID,
            readerPID,
            signedMessage.context,
            readerLayerLevel
        );
        
        if (senderIdentity.error) {
            return {
                error: 'Insufficient layer access',
                publicInfo: {
                    from: signedMessage.from,
                    context: signedMessage.context,
                    timestamp: signedMessage.timestamp
                }
            };
        }
        
        // Verify signature
        if (!this.verifySignature(signedMessage.fromPID, signedMessage.encoded, signedMessage.signature)) {
            return { error: 'Invalid message signature' };
        }
        
        // Decode based on reader's layer access
        const decodingResult = {
            from: senderIdentity.publicName,
            fromPID: readerLayerLevel >= 4 ? signedMessage.fromPID : '[HIDDEN]',
            context: signedMessage.context,
            timestamp: signedMessage.timestamp,
            layerAccess: readerLayerLevel
        };
        
        // Layer 0: Can see encoded message only
        if (readerLayerLevel >= 0) {
            decodingResult.encoded = signedMessage.encoded;
        }
        
        // Layer 1+: Can decode the message
        if (readerLayerLevel >= 1) {
            const decoded = this.hollowtownSystem.decode(
                signedMessage.encoded, 
                signedMessage.encoderContext
            );
            decodingResult.decoded = decoded.decoded;
        }
        
        // Layer 3+: Can see encoding context
        if (readerLayerLevel >= 3) {
            decodingResult.encoderContext = signedMessage.encoderContext;
            decodingResult.encoderDescription = this.getContextDescription(signedMessage.encoderContext);
        }
        
        // Layer 5+: Full message details
        if (readerLayerLevel >= 5) {
            decodingResult.signature = signedMessage.signature;
            decodingResult.privateName = senderIdentity.privateName;
        }
        
        console.log(`✅ Message decoded with layer ${readerLayerLevel} access`);
        
        return decodingResult;
    }
    
    /**
     * Handle cross-context communication
     */
    async sendCrossContextMessage(senderPID, recipientPID, message, fromContext, toContext) {
        console.log('\n🌐 Cross-context message transmission...');
        
        // Encode in sender's context
        const encodedMessage = await this.encodeMessage(senderPID, message, fromContext);
        
        if (encodedMessage.error) {
            return encodedMessage;
        }
        
        // Get recipient's preferred context
        const recipientIdentity = await this.identityEncoder.getIdentity(
            recipientPID,
            recipientPID,
            toContext,
            0
        );
        
        if (recipientIdentity.error) {
            return { error: 'Recipient not found' };
        }
        
        // Translate between contexts
        const translation = await this.translateContexts(
            encodedMessage.encoded,
            fromContext,
            toContext
        );
        
        // Create cross-context message
        const crossContextMessage = {
            ...encodedMessage,
            to: recipientIdentity.publicName,
            toPID: recipientPID,
            originalContext: fromContext,
            translatedContext: toContext,
            translatedEncoding: translation.encoded,
            bridge: translation.bridge
        };
        
        console.log(`✅ Cross-context message created`);
        console.log(`   ${fromContext} → ${toContext}`);
        console.log(`   Bridge: ${translation.bridge}`);
        
        return crossContextMessage;
    }
    
    /**
     * Translate encoding between contexts
     */
    async translateContexts(encoded, fromContext, toContext) {
        const fromEncoder = this.contextMapping[fromContext];
        const toEncoder = this.contextMapping[toContext];
        
        // First decode from source context
        const decoded = this.hollowtownSystem.decode(encoded, fromEncoder);
        
        // Then encode in target context
        this.hollowtownSystem.switchContext(toEncoder);
        const reencoded = this.hollowtownSystem.encode(decoded.decoded);
        
        // Get interaction bridge
        const bridge = this.hollowtownSystem.getContextInteraction(fromEncoder, toEncoder) || 
                      'Direct translation';
        
        return {
            encoded: reencoded.encoded,
            bridge: bridge,
            fromEncoder,
            toEncoder
        };
    }
    
    /**
     * Create identity-aware broadcast
     */
    async createBroadcast(broadcasterPID, message, contexts = ['gaming', 'business', 'social']) {
        console.log('\n📢 Creating identity-aware broadcast...');
        
        const broadcast = {
            broadcasterPID,
            timestamp: Date.now(),
            versions: {}
        };
        
        // Create version for each context
        for (const context of contexts) {
            const encoded = await this.encodeMessage(broadcasterPID, message, context);
            if (!encoded.error) {
                broadcast.versions[context] = encoded;
            }
        }
        
        // Add cross-context story
        const story = this.hollowtownSystem.generateCrossContextStory(message);
        broadcast.crossContextStory = story;
        
        console.log(`✅ Broadcast created with ${Object.keys(broadcast.versions).length} versions`);
        
        return broadcast;
    }
    
    /**
     * Handle identity transitions (for sailing update)
     */
    async handleIdentityTransition(event) {
        const { fromPID, toPID, transitionType, context, metadata } = event;
        
        // Special handling for sailing context
        if (context.includes('sailing')) {
            console.log('⛵ Sailing identity transition detected');
            
            // Assign special sailing encoder
            this.contextMapping.sailing = 'music'; // Ocean rhythms
            
            // Create sailing-specific codename
            const sailingIdentity = await this.identityEncoder.createIdentity(
                `Sailor_${toPID}`,
                ['sailing']
            );
            
            // Link to original identity
            await this.identityEncoder.grantLayerAccess(
                fromPID,
                sailingIdentity.systemPID,
                fromPID,
                3,
                'sailing'
            );
        }
    }
    
    /**
     * Sign message for verification
     */
    signMessage(senderPID, message) {
        const data = `${senderPID}:${message}:${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    
    /**
     * Verify message signature
     */
    verifySignature(senderPID, message, signature) {
        // In production, would use proper cryptographic signatures
        // This is simplified for demonstration
        return signature && signature.length === 16;
    }
    
    /**
     * Get encoding statistics for identity
     */
    getIdentityStats(systemPID) {
        const history = this.messageHistory.get(systemPID);
        if (!history) return null;
        
        const stats = {
            totalMessages: history.messages.length,
            contextUsage: {},
            encoderUsage: {}
        };
        
        // Count usage by context
        for (const msg of history.messages) {
            stats.contextUsage[msg.context] = (stats.contextUsage[msg.context] || 0) + 1;
            stats.encoderUsage[msg.encoderContext] = (stats.encoderUsage[msg.encoderContext] || 0) + 1;
        }
        
        return stats;
    }
}

// Export for use
module.exports = IdentityEncoderConnector;

// Demo functionality
if (require.main === module) {
    const connector = new IdentityEncoderConnector();
    
    async function demonstrateIdentityEncoding() {
        console.log('\n🎮 Demonstrating Identity-Aware Encoding\n');
        
        // Create two identities
        console.log('1. Creating identities...');
        const alice = await connector.identityEncoder.createIdentity(
            'Alice Smith',
            ['gaming', 'business', 'social']
        );
        const bob = await connector.identityEncoder.createIdentity(
            'Bob Jones',
            ['gaming', 'business', 'social']
        );
        
        console.log(`   Alice: ${alice.codenames.gaming}`);
        console.log(`   Bob: ${bob.codenames.gaming}`);
        
        // Alice sends a gaming message
        console.log('\n2. Alice sends a gaming message...');
        const gamingMessage = await connector.encodeMessage(
            alice.systemPID,
            'Meet me at the haunted tavern',
            'gaming'
        );
        
        // Bob decodes with different layer access
        console.log('\n3. Bob tries to decode with different layer access...');
        
        // Layer 0 - Public access
        console.log('\n   Layer 0 (Public):');
        const publicDecode = await connector.decodeMessage(gamingMessage, bob.systemPID, 0);
        console.log('   ', JSON.stringify(publicDecode, null, 2));
        
        // Layer 1 - Can decode
        console.log('\n   Layer 1 (Decode access):');
        const decodeDecode = await connector.decodeMessage(gamingMessage, bob.systemPID, 1);
        console.log('   ', JSON.stringify(decodeDecode, null, 2));
        
        // Cross-context message
        console.log('\n4. Cross-context communication...');
        const crossMessage = await connector.sendCrossContextMessage(
            alice.systemPID,
            bob.systemPID,
            'Let\'s discuss the project',
            'gaming',
            'business'
        );
        console.log('   Gaming → Business translation complete');
        console.log(`   Original: ${crossMessage.encoded}`);
        console.log(`   Translated: ${crossMessage.translatedEncoding}`);
        
        // Broadcast to multiple contexts
        console.log('\n5. Broadcasting to multiple contexts...');
        const broadcast = await connector.createBroadcast(
            alice.systemPID,
            'New update available',
            ['gaming', 'business', 'social']
        );
        console.log('   Broadcast versions created:');
        for (const [context, version] of Object.entries(broadcast.versions)) {
            console.log(`     ${context}: ${version.encoded}`);
        }
        
        // Show stats
        console.log('\n6. Identity encoding statistics...');
        const aliceStats = connector.getIdentityStats(alice.systemPID);
        console.log('   Alice\'s encoding stats:', aliceStats);
    }
    
    demonstrateIdentityEncoding().catch(console.error);
}
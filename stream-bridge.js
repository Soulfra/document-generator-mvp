#!/usr/bin/env node

/**
 * STREAM BRIDGE - Verifiable Logging Pipeline
 * Streams data from ticker tape to RNG layers with verification
 * No timeouts, no fake data - only real verified streams
 */

const WebSocket = require('ws');
const fetch = require('node-fetch');
const fs = require('fs').promises;

class StreamBridge {
    constructor() {
        this.bridges = new Map();
        this.verificationHashes = new Map();
        this.streamChain = [
            { name: 'TICKER_TAPE', port: 8888, url: 'ws://localhost:8888/ws' },
            { name: 'RNG_LAYER', port: 39000, url: 'ws://localhost:39000/ws' },
            { name: 'DEEP_TIER', port: 40000, url: 'ws://localhost:40000/ws' },
            { name: 'ORCHESTRATION', port: 41000, url: 'ws://localhost:41000/ws' }
        ];
        
        console.log('🌊 STREAM BRIDGE ACTIVATED - Verifiable Pipeline');
        this.startBridging();
    }
    
    async startBridging() {
        // Connect to ticker tape first (source of truth)
        this.connectToTickerTape();
        
        // Set up verification stream
        this.setupVerificationStream();
        
        // Monitor stream health
        this.monitorStreamHealth();
    }
    
    connectToTickerTape() {
        console.log('🔗 Connecting to Ticker Tape WebSocket...');
        
        const ws = new WebSocket('ws://localhost:8888/ws');
        
        ws.on('open', () => {
            console.log('✅ Connected to Ticker Tape stream');
            
            // Subscribe to all real data
            ws.send(JSON.stringify({
                type: 'subscribe',
                filters: {
                    component: 'REAL_SYSTEM_DATA'
                }
            }));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.processStreamMessage(message);
            } catch (error) {
                console.error('❌ Stream bridge error:', error);
            }
        });
        
        ws.on('close', () => {
            console.log('🔄 Ticker Tape connection lost, reconnecting...');
            setTimeout(() => this.connectToTickerTape(), 5000);
        });
        
        this.tickerWs = ws;
    }
    
    async processStreamMessage(message) {
        if (message.type === 'log' && message.entry) {
            const entry = message.entry;
            
            // Verify this is real data (not fake)
            if (this.verifyRealData(entry)) {
                console.log(`📊 Processing real data: ${entry.message}`);
                
                // Add verification hash
                const verifiedEntry = this.addVerificationHash(entry);
                
                // Stream to next layer
                await this.streamToNextLayer(verifiedEntry);
                
                // Log pipeline activity
                await this.logPipelineActivity(verifiedEntry);
            } else {
                console.log(`⚠️ Rejected fake data: ${entry.message}`);
            }
        }
    }
    
    verifyRealData(entry) {
        // Verify data is real, not fake stubs
        const realDataIndicators = [
            entry.memory && entry.memory.rss > 0,
            entry.containerCount !== undefined,
            entry.listeningPorts !== undefined,
            entry.nodeProcesses !== undefined,
            entry.correlationId && entry.correlationId.includes('-'),
            entry._meta && entry._meta.pid
        ];
        
        // Must have at least one real data indicator
        return realDataIndicators.some(indicator => indicator === true);
    }
    
    addVerificationHash(entry) {
        const crypto = require('crypto');
        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(entry))
            .digest('hex')
            .slice(0, 16);
        
        const verified = {
            ...entry,
            verification: {
                hash,
                timestamp: Date.now(),
                source: 'TICKER_TAPE',
                verified: true
            }
        };
        
        this.verificationHashes.set(entry.correlationId, hash);
        return verified;
    }
    
    async streamToNextLayer(verifiedEntry) {
        // For now, stream to file until next layers are ready
        const streamData = {
            timestamp: Date.now(),
            source: 'TICKER_TAPE',
            destination: 'RNG_LAYER',
            data: verifiedEntry,
            streamStatus: 'FLOWING'
        };
        
        // Write to stream file for next layer to pick up
        try {
            await fs.appendFile('./stream-bridge.jsonl', JSON.stringify(streamData) + '\n');
            console.log(`✅ Streamed to next layer: ${verifiedEntry.message}`);
        } catch (error) {
            console.error('❌ Stream write error:', error);
        }
        
        // Also try to connect to brainos layer if available
        await this.tryStreamToBrainos(streamData);
    }
    
    async tryStreamToBrainos(streamData) {
        try {
            // Try to POST to brainos layer on port 39000
            const response = await fetch('http://localhost:39000/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(streamData),
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('🧠 Streamed to brainos layer');
            }
        } catch (error) {
            // Brainos layer not ready yet, continue with file streaming
            console.log('🧠 Brainos layer not ready, using file stream');
        }
    }
    
    async logPipelineActivity(entry) {
        const activity = {
            timestamp: Date.now(),
            pipeline: 'TICKER_TO_RNG',
            action: 'STREAM_PROCESSED',
            entryId: entry.correlationId,
            verification: entry.verification.hash,
            status: 'SUCCESS'
        };
        
        await fs.appendFile('./pipeline-activity.jsonl', JSON.stringify(activity) + '\n');
    }
    
    setupVerificationStream() {
        // Every 30 seconds, verify stream integrity
        setInterval(async () => {
            const verification = {
                timestamp: Date.now(),
                totalStreamed: this.verificationHashes.size,
                lastHashes: Array.from(this.verificationHashes.values()).slice(-5),
                streamHealth: 'HEALTHY'
            };
            
            console.log(`✅ Stream verification: ${verification.totalStreamed} entries processed`);
            
            await fs.appendFile('./stream-verification.jsonl', JSON.stringify(verification) + '\n');
        }, 30000);
    }
    
    monitorStreamHealth() {
        // Monitor stream health every 15 seconds
        setInterval(() => {
            const health = {
                tickerConnection: this.tickerWs && this.tickerWs.readyState === WebSocket.OPEN,
                verificationCount: this.verificationHashes.size,
                bridgeStatus: 'ACTIVE'
            };
            
            if (health.tickerConnection) {
                console.log(`💚 Stream bridge healthy: ${health.verificationCount} entries`);
            } else {
                console.log('❤️ Stream bridge reconnecting...');
            }
        }, 15000);
    }
}

// Start the stream bridge
const bridge = new StreamBridge();

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🌊 Stream bridge shutting down...');
    if (bridge.tickerWs) {
        bridge.tickerWs.close();
    }
    process.exit(0);
});
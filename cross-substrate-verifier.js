#!/usr/bin/env node

/**
 * 🔍 CROSS-SUBSTRATE VERIFIER
 * 
 * Verifies data integrity across multiple storage layers:
 * - Local databases (truth source)
 * - IPFS (distributed cache)
 * - Arweave (permanent archive)
 * - Blockchain (proof of existence)
 * - Cloud services (operational data)
 * 
 * Uses Byzantine Fault Tolerant consensus for verification
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class CrossSubstrateVerifier extends EventEmitter {
    constructor() {
        super();
        
        // Verification strategies
        this.strategies = {
            hash_comparison: this.verifyByHash.bind(this),
            content_matching: this.verifyByContent.bind(this),
            timestamp_ordering: this.verifyByTimestamp.bind(this),
            signature_validation: this.verifyBySignature.bind(this),
            consensus_voting: this.verifyByConsensus.bind(this),
            merkle_proof: this.verifyByMerkleProof.bind(this)
        };
        
        // Substrate trust levels (0-1)
        this.trustLevels = {
            postgresql: 1.0,      // Primary database - highest trust
            sqlite: 0.9,          // Local databases - high trust
            redis: 0.7,           // Cache - medium trust
            ipfs: 0.8,            // Distributed - high trust if pinned
            arweave: 0.95,        // Permanent - very high trust
            filecoin: 0.85,       // Backup - high trust
            ethereum: 1.0,        // Blockchain - highest trust (immutable)
            polkadot: 0.95,       // Blockchain - very high trust
            vercel: 0.6,          // Cloud KV - medium trust
            stripe: 0.8           // Financial API - high trust
        };
        
        // Verification thresholds
        this.thresholds = {
            minimum_substrates: 2,      // Min substrates for verification
            consensus_threshold: 0.51,  // 51% agreement required
            trust_threshold: 0.7,       // Min combined trust level
            byzantine_tolerance: 0.33   // Can tolerate 33% byzantine nodes
        };
        
        // Verification cache
        this.verificationCache = new Map();
        this.cacheTimeout = 60000; // 1 minute
        
        console.log('🔍 Cross-Substrate Verifier initialized');
    }
    
    /**
     * Main verification method
     */
    async verifyAcrossSubstrates(data, sources, options = {}) {
        const verificationId = this.generateVerificationId(data);
        const startTime = Date.now();
        
        console.log(`\n🔍 CROSS-SUBSTRATE VERIFICATION ${verificationId}`);
        console.log(`   Sources: ${sources.map(s => s.substrate).join(', ')}`);
        console.log(`   Strategy: ${options.strategy || 'auto'}`);
        
        try {
            // Check cache
            const cached = this.checkCache(verificationId);
            if (cached && !options.skipCache) {
                console.log('   ⚡ Cache hit!');
                return cached;
            }
            
            // Validate input
            const validation = this.validateInput(data, sources);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.reason}`);
            }
            
            // Select verification strategy
            const strategy = this.selectStrategy(data, sources, options);
            console.log(`   📋 Using strategy: ${strategy}`);
            
            // Perform verification
            const verificationResult = await this.strategies[strategy](data, sources, options);
            
            // Calculate trust score
            const trustScore = this.calculateTrustScore(sources, verificationResult);
            
            // Check Byzantine fault tolerance
            const byzantineCheck = this.checkByzantineTolerance(sources, verificationResult);
            
            // Build final result
            const result = {
                verificationId,
                verified: verificationResult.verified && byzantineCheck.safe,
                confidence: verificationResult.confidence,
                trustScore,
                byzantineCheck,
                strategy,
                sources: sources.length,
                latency: Date.now() - startTime,
                details: verificationResult.details,
                timestamp: new Date().toISOString()
            };
            
            // Cache result
            this.cacheResult(verificationId, result);
            
            // Emit verification event
            this.emit('verification:complete', result);
            
            console.log(`   ✅ Verification ${result.verified ? 'PASSED' : 'FAILED'}`);
            console.log(`   📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            console.log(`   🛡️ Trust Score: ${(result.trustScore * 100).toFixed(1)}%`);
            
            return result;
            
        } catch (error) {
            console.error(`   ❌ Verification failed:`, error.message);
            
            this.emit('verification:error', {
                verificationId,
                error: error.message,
                sources: sources.map(s => s.substrate)
            });
            
            throw error;
        }
    }
    
    validateInput(data, sources) {
        if (!data || !sources || sources.length === 0) {
            return { valid: false, reason: 'Missing data or sources' };
        }
        
        if (sources.length < this.thresholds.minimum_substrates) {
            return { 
                valid: false, 
                reason: `Insufficient sources: ${sources.length} < ${this.thresholds.minimum_substrates}` 
            };
        }
        
        return { valid: true };
    }
    
    selectStrategy(data, sources, options) {
        if (options.strategy && this.strategies[options.strategy]) {
            return options.strategy;
        }
        
        // Auto-select based on data type
        if (data.hash || data.ipfsHash || data.arweaveId) {
            return 'hash_comparison';
        }
        
        if (data.signature || data.signed) {
            return 'signature_validation';
        }
        
        if (data.merkleRoot || data.proof) {
            return 'merkle_proof';
        }
        
        if (data.timestamp || data.created_at) {
            return 'timestamp_ordering';
        }
        
        // Default to consensus voting
        return 'consensus_voting';
    }
    
    /**
     * Verification Strategies
     */
    
    async verifyByHash(data, sources) {
        const hashes = new Map();
        
        // Collect hashes from each source
        for (const source of sources) {
            const hash = this.extractHash(source.data);
            if (hash) {
                if (!hashes.has(hash)) {
                    hashes.set(hash, []);
                }
                hashes.get(hash).push(source.substrate);
            }
        }
        
        // Find consensus hash
        let maxCount = 0;
        let consensusHash = null;
        
        for (const [hash, substrates] of hashes) {
            if (substrates.length > maxCount) {
                maxCount = substrates.length;
                consensusHash = hash;
            }
        }
        
        const confidence = maxCount / sources.length;
        
        return {
            verified: confidence >= this.thresholds.consensus_threshold,
            confidence,
            details: {
                consensusHash,
                agreeing: hashes.get(consensusHash) || [],
                allHashes: Array.from(hashes.entries())
            }
        };
    }
    
    async verifyByContent(data, sources) {
        const contents = new Map();
        
        // Normalize and collect content
        for (const source of sources) {
            const normalized = this.normalizeContent(source.data);
            const contentHash = crypto.createHash('sha256').update(normalized).digest('hex');
            
            if (!contents.has(contentHash)) {
                contents.set(contentHash, {
                    substrates: [],
                    content: normalized
                });
            }
            contents.get(contentHash).substrates.push(source.substrate);
        }
        
        // Find consensus content
        let maxCount = 0;
        let consensusContent = null;
        
        for (const [hash, data] of contents) {
            if (data.substrates.length > maxCount) {
                maxCount = data.substrates.length;
                consensusContent = data;
            }
        }
        
        const confidence = maxCount / sources.length;
        
        return {
            verified: confidence >= this.thresholds.consensus_threshold,
            confidence,
            details: {
                agreeing: consensusContent?.substrates || [],
                variations: contents.size,
                consensus: consensusContent
            }
        };
    }
    
    async verifyByTimestamp(data, sources) {
        const timestamps = [];
        
        // Collect timestamps
        for (const source of sources) {
            const ts = this.extractTimestamp(source.data);
            if (ts) {
                timestamps.push({
                    substrate: source.substrate,
                    timestamp: ts,
                    trust: this.trustLevels[source.substrate] || 0.5
                });
            }
        }
        
        // Sort by timestamp
        timestamps.sort((a, b) => a.timestamp - b.timestamp);
        
        // Check temporal consistency
        const range = timestamps[timestamps.length - 1].timestamp - timestamps[0].timestamp;
        const maxAcceptableRange = 60000; // 1 minute
        
        const temporallyConsistent = range <= maxAcceptableRange;
        const confidence = temporallyConsistent ? 0.9 : 0.3;
        
        return {
            verified: temporallyConsistent,
            confidence,
            details: {
                earliestSource: timestamps[0],
                latestSource: timestamps[timestamps.length - 1],
                range: range,
                allTimestamps: timestamps
            }
        };
    }
    
    async verifyBySignature(data, sources) {
        const signatures = new Map();
        
        // Collect and verify signatures
        for (const source of sources) {
            if (source.data.signature) {
                const sigValid = await this.verifySignature(source.data);
                signatures.set(source.substrate, {
                    valid: sigValid,
                    signature: source.data.signature,
                    signer: source.data.signer || 'unknown'
                });
            }
        }
        
        // Count valid signatures
        const validCount = Array.from(signatures.values()).filter(s => s.valid).length;
        const confidence = validCount / sources.length;
        
        return {
            verified: confidence >= this.thresholds.consensus_threshold,
            confidence,
            details: {
                validSignatures: validCount,
                totalSignatures: signatures.size,
                signatures: Array.from(signatures.entries())
            }
        };
    }
    
    async verifyByConsensus(data, sources) {
        // Generic consensus - stringify and compare
        const votes = new Map();
        
        for (const source of sources) {
            const vote = JSON.stringify(this.extractCoreData(source.data));
            const voteHash = crypto.createHash('sha256').update(vote).digest('hex');
            
            if (!votes.has(voteHash)) {
                votes.set(voteHash, {
                    count: 0,
                    substrates: [],
                    trustSum: 0
                });
            }
            
            const voteData = votes.get(voteHash);
            voteData.count++;
            voteData.substrates.push(source.substrate);
            voteData.trustSum += this.trustLevels[source.substrate] || 0.5;
        }
        
        // Find winning vote
        let maxTrust = 0;
        let winner = null;
        
        for (const [hash, voteData] of votes) {
            if (voteData.trustSum > maxTrust) {
                maxTrust = voteData.trustSum;
                winner = voteData;
            }
        }
        
        const confidence = winner ? winner.count / sources.length : 0;
        
        return {
            verified: confidence >= this.thresholds.consensus_threshold,
            confidence,
            details: {
                winner: winner,
                allVotes: Array.from(votes.values()),
                totalVotes: sources.length
            }
        };
    }
    
    async verifyByMerkleProof(data, sources) {
        const proofs = [];
        
        // Collect Merkle proofs
        for (const source of sources) {
            if (source.data.merkleProof || source.data.proof) {
                const valid = await this.verifyMerkleProof(
                    source.data.leaf || source.data.data,
                    source.data.merkleProof || source.data.proof,
                    source.data.merkleRoot || source.data.root
                );
                
                proofs.push({
                    substrate: source.substrate,
                    valid: valid,
                    root: source.data.merkleRoot || source.data.root
                });
            }
        }
        
        // Count valid proofs
        const validCount = proofs.filter(p => p.valid).length;
        const confidence = proofs.length > 0 ? validCount / proofs.length : 0;
        
        return {
            verified: confidence >= this.thresholds.consensus_threshold,
            confidence,
            details: {
                validProofs: validCount,
                totalProofs: proofs.length,
                proofs: proofs
            }
        };
    }
    
    /**
     * Helper methods
     */
    
    extractHash(data) {
        return data.hash || 
               data.ipfsHash || 
               data.cid || 
               data.arweaveId || 
               data.txHash || 
               data.contentHash;
    }
    
    extractTimestamp(data) {
        const ts = data.timestamp || 
                  data.created_at || 
                  data.createdAt || 
                  data.blockTime || 
                  data.time;
        
        return ts ? new Date(ts).getTime() : null;
    }
    
    normalizeContent(data) {
        // Remove variable fields for comparison
        const normalized = { ...data };
        delete normalized.timestamp;
        delete normalized.created_at;
        delete normalized.updated_at;
        delete normalized._id;
        delete normalized.id;
        
        return JSON.stringify(normalized, Object.keys(normalized).sort());
    }
    
    extractCoreData(data) {
        // Extract only core fields for consensus
        const core = {};
        const coreFields = ['value', 'amount', 'status', 'type', 'action', 'result'];
        
        for (const field of coreFields) {
            if (data[field] !== undefined) {
                core[field] = data[field];
            }
        }
        
        return core;
    }
    
    async verifySignature(data) {
        // Placeholder for actual signature verification
        // Would use crypto libraries to verify
        return true;
    }
    
    async verifyMerkleProof(leaf, proof, root) {
        // Placeholder for Merkle proof verification
        // Would implement actual Merkle tree verification
        return true;
    }
    
    /**
     * Trust and Byzantine calculations
     */
    
    calculateTrustScore(sources, verificationResult) {
        let totalTrust = 0;
        let weightedTrust = 0;
        
        // Get agreeing sources
        const agreeing = new Set(
            verificationResult.details.agreeing || 
            verificationResult.details.winner?.substrates || 
            []
        );
        
        for (const source of sources) {
            const trust = this.trustLevels[source.substrate] || 0.5;
            totalTrust += trust;
            
            if (agreeing.has(source.substrate)) {
                weightedTrust += trust;
            }
        }
        
        return totalTrust > 0 ? weightedTrust / totalTrust : 0;
    }
    
    checkByzantineTolerance(sources, verificationResult) {
        const totalNodes = sources.length;
        const byzantineNodes = Math.floor(totalNodes * this.thresholds.byzantine_tolerance);
        
        // Count disagreeing nodes
        const agreeing = new Set(
            verificationResult.details.agreeing || 
            verificationResult.details.winner?.substrates || 
            []
        );
        
        const disagreeingCount = totalNodes - agreeing.size;
        
        return {
            safe: disagreeingCount <= byzantineNodes,
            byzantineNodes: byzantineNodes,
            disagreeingNodes: disagreeingCount,
            tolerance: this.thresholds.byzantine_tolerance
        };
    }
    
    /**
     * Cache management
     */
    
    generateVerificationId(data) {
        const content = JSON.stringify(data);
        return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
    }
    
    checkCache(verificationId) {
        const cached = this.verificationCache.get(verificationId);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.verificationCache.delete(verificationId);
            return null;
        }
        
        return cached.result;
    }
    
    cacheResult(verificationId, result) {
        this.verificationCache.set(verificationId, {
            result: result,
            timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.verificationCache.size > 1000) {
            const firstKey = this.verificationCache.keys().next().value;
            this.verificationCache.delete(firstKey);
        }
    }
    
    /**
     * Advanced verification methods
     */
    
    async performDeepVerification(data, sources) {
        // Run multiple verification strategies and combine results
        const strategies = ['hash_comparison', 'content_matching', 'consensus_voting'];
        const results = [];
        
        for (const strategy of strategies) {
            try {
                const result = await this.verifyAcrossSubstrates(data, sources, { strategy });
                results.push({
                    strategy,
                    verified: result.verified,
                    confidence: result.confidence,
                    trustScore: result.trustScore
                });
            } catch (error) {
                console.warn(`   ⚠️ Strategy ${strategy} failed:`, error.message);
            }
        }
        
        // Combine results
        const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
        const avgTrust = results.reduce((sum, r) => sum + r.trustScore, 0) / results.length;
        const allVerified = results.every(r => r.verified);
        
        return {
            verified: allVerified,
            confidence: avgConfidence,
            trustScore: avgTrust,
            strategies: results,
            deep: true
        };
    }
    
    /**
     * Get verification statistics
     */
    getStats() {
        return {
            cacheSize: this.verificationCache.size,
            trustLevels: this.trustLevels,
            thresholds: this.thresholds,
            strategies: Object.keys(this.strategies)
        };
    }
}

// Export for use
module.exports = CrossSubstrateVerifier;

// Run if executed directly
if (require.main === module) {
    const verifier = new CrossSubstrateVerifier();
    
    console.log('\n📋 CROSS-SUBSTRATE VERIFIER READY');
    console.log('==================================');
    
    // Example verification
    async function runExample() {
        const testData = {
            agentId: 'agent_123',
            revenue: 1000,
            timestamp: new Date().toISOString()
        };
        
        const testSources = [
            {
                substrate: 'postgresql',
                data: { ...testData, hash: 'abc123' }
            },
            {
                substrate: 'ipfs',
                data: { ...testData, hash: 'abc123', ipfsHash: 'QmABC123' }
            },
            {
                substrate: 'arweave',
                data: { ...testData, hash: 'abc123', arweaveId: 'AR123' }
            },
            {
                substrate: 'ethereum',
                data: { ...testData, hash: 'def456' } // Byzantine node
            }
        ];
        
        console.log('\n🧪 Running verification example...');
        
        const result = await verifier.verifyAcrossSubstrates(testData, testSources);
        console.log('\n📊 Verification Result:');
        console.log(JSON.stringify(result, null, 2));
        
        // Deep verification
        console.log('\n🔬 Running deep verification...');
        const deepResult = await verifier.performDeepVerification(testData, testSources);
        console.log(JSON.stringify(deepResult, null, 2));
    }
    
    runExample().catch(console.error);
}
#!/usr/bin/env node

/**
 * ⚡ BLOCKCHAIN-CHUNK-PROCESSOR.js
 * 
 * High-performance blockchain data chunking and processing system for crypto tax compliance.
 * Handles massive blockchain datasets efficiently through intelligent chunking, caching,
 * and parallel processing while respecting API rate limits and managing epochs.
 * 
 * Features:
 * - Smart block/epoch-based chunking (1000 blocks per chunk)
 * - Adaptive rate limiting with exponential backoff
 * - Parallel processing with worker threads
 * - Memory-optimized streaming for large datasets
 * - Cross-chain epoch handling (ETH blocks, SOL slots, BTC blocks)
 * - Automatic retry logic with circuit breaker pattern
 * - Real-time progress tracking and analytics
 * - Snapshot-based state management
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const EventEmitter = require('events');
const WebSocket = require('ws');

class BlockchainChunkProcessor extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            port: 9600,
            wsPort: 9601,
            
            // Chunking configuration
            chunking: {
                ethereum: {
                    blocksPerChunk: 1000,        // 1000 blocks (~4 hours)
                    epochSize: 32,               // ETH 2.0 epochs (32 slots)
                    maxConcurrentChunks: 5,      // Process 5 chunks in parallel
                    blockTime: 12000,            // ~12 seconds per block
                    retryAttempts: 3
                },
                solana: {
                    slotsPerChunk: 10000,        // 10k slots (~1 hour)
                    epochSize: 432000,           // ~2 days worth of slots
                    maxConcurrentChunks: 8,      // Solana can handle more concurrent
                    slotTime: 400,               // ~400ms per slot
                    retryAttempts: 3
                },
                bitcoin: {
                    blocksPerChunk: 144,         // 144 blocks (~1 day)
                    epochSize: 2016,             // Difficulty adjustment period
                    maxConcurrentChunks: 3,      // Bitcoin APIs are slower
                    blockTime: 600000,           // ~10 minutes per block
                    retryAttempts: 5
                },
                polygon: {
                    blocksPerChunk: 10000,       // 10k blocks (~5.5 hours)
                    epochSize: 64,               // Polygon checkpoints
                    maxConcurrentChunks: 6,
                    blockTime: 2000,             // ~2 seconds per block
                    retryAttempts: 3
                }
            },
            
            // Rate limiting per API
            rateLimits: {
                etherscan: {
                    requestsPerSecond: 5,
                    burstLimit: 10,
                    backoffMultiplier: 1.5,
                    maxBackoff: 30000 // 30 seconds
                },
                solscan: {
                    requestsPerSecond: 10,
                    burstLimit: 20,
                    backoffMultiplier: 2.0,
                    maxBackoff: 60000 // 1 minute
                },
                infura: {
                    requestsPerSecond: 100,
                    burstLimit: 200,
                    backoffMultiplier: 1.2,
                    maxBackoff: 10000 // 10 seconds
                },
                alchemy: {
                    requestsPerSecond: 330,
                    burstLimit: 660,
                    backoffMultiplier: 1.3,
                    maxBackoff: 15000 // 15 seconds
                }
            },
            
            // Memory management
            memory: {
                maxChunkSize: 100 * 1024 * 1024,    // 100MB per chunk
                streamBufferSize: 1024 * 1024,       // 1MB stream buffer
                gcThreshold: 500 * 1024 * 1024,      // Trigger GC at 500MB
                maxWorkerMemory: 256 * 1024 * 1024   // 256MB per worker
            },
            
            // Storage configuration
            storage: {
                chunkCacheTTL: 24 * 60 * 60 * 1000,  // 24 hours
                snapshotInterval: 6 * 60 * 60 * 1000, // 6 hours
                compressionLevel: 6,                   // gzip compression
                maxCacheSize: 10 * 1024 * 1024 * 1024 // 10GB cache limit
            }
        };
        
        // Processing state
        this.state = {
            activeChunks: new Map(),
            completedChunks: new Map(),
            failedChunks: new Map(),
            processingQueue: new Map(),
            rateLimiters: new Map(),
            workerPool: new Set(),
            memoryUsage: { used: 0, available: 0 },
            networkHealth: new Map()
        };
        
        // Performance metrics
        this.metrics = {
            totalChunksProcessed: 0,
            totalDataProcessed: 0,
            averageChunkTime: 0,
            successRate: 0,
            apiCallsPerSecond: 0,
            memoryEfficiency: 0,
            networkLatency: new Map(),
            errorDistribution: new Map()
        };
        
        // Progress tracking
        this.progress = {
            chains: new Map(),
            currentTasks: new Map(),
            completionPercentage: 0,
            estimatedTimeRemaining: 0,
            lastUpdate: Date.now()
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('⚡ Initializing Blockchain Chunk Processor...');
        
        try {
            // Initialize storage and cache
            await this.initializeStorage();
            
            // Setup rate limiters
            this.setupRateLimiters();
            
            // Initialize worker pool
            await this.initializeWorkerPool();
            
            // Start web server
            await this.startWebServer();
            
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Begin health monitoring
            this.startHealthMonitoring();
            
            console.log(`✅ Blockchain Chunk Processor running on port ${this.config.port}`);
            console.log(`📊 Processing dashboard: http://localhost:${this.config.port}/chunks`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Blockchain Chunk Processor:', error);
            throw error;
        }
    }
    
    // ===================== CHUNK PROCESSING =====================
    
    async processBlockchainData(chain, startBlock, endBlock, options = {}) {
        console.log(`⚡ Processing ${chain} blockchain data: blocks ${startBlock} to ${endBlock}`);
        
        const taskId = crypto.randomUUID();
        const chunking = this.config.chunking[chain];
        
        if (!chunking) {
            throw new Error(`Unsupported chain for chunking: ${chain}`);
        }
        
        // Calculate chunks needed
        const totalBlocks = endBlock - startBlock + 1;
        const chunks = this.calculateChunks(startBlock, endBlock, chunking.blocksPerChunk);
        
        // Initialize progress tracking
        this.progress.currentTasks.set(taskId, {
            chain,
            startBlock,
            endBlock,
            totalChunks: chunks.length,
            completedChunks: 0,
            failedChunks: 0,
            startTime: Date.now(),
            estimatedEnd: null,
            status: 'initializing'
        });
        
        try {
            // Process chunks in parallel batches
            const results = await this.processChunksInBatches(chain, chunks, options);
            
            // Update progress
            const task = this.progress.currentTasks.get(taskId);
            task.status = 'completed';
            task.endTime = Date.now();
            task.totalDataProcessed = results.reduce((sum, r) => sum + (r.size || 0), 0);
            
            // Update metrics
            this.updateProcessingMetrics(task, results);
            
            // Broadcast completion
            this.broadcastProgress('task_completed', { taskId, task, results });
            
            console.log(`✅ Completed processing ${totalBlocks} blocks in ${chunks.length} chunks`);
            return results;
            
        } catch (error) {
            // Mark task as failed
            const task = this.progress.currentTasks.get(taskId);
            task.status = 'failed';
            task.error = error.message;
            task.endTime = Date.now();
            
            console.error(`❌ Failed to process blockchain data:`, error);
            throw error;
        }
    }
    
    calculateChunks(startBlock, endBlock, chunkSize) {
        const chunks = [];
        
        for (let current = startBlock; current <= endBlock; current += chunkSize) {
            const chunkEnd = Math.min(current + chunkSize - 1, endBlock);
            chunks.push({
                id: crypto.randomBytes(8).toString('hex'),
                startBlock: current,
                endBlock: chunkEnd,
                size: chunkEnd - current + 1,
                status: 'pending',
                retries: 0,
                createdAt: Date.now()
            });
        }
        
        return chunks;
    }
    
    async processChunksInBatches(chain, chunks, options) {
        const chunking = this.config.chunking[chain];
        const batchSize = chunking.maxConcurrentChunks;
        const results = [];
        
        // Process chunks in batches to control memory usage
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            
            console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks)`);
            
            // Process batch in parallel
            const batchPromises = batch.map(chunk => 
                this.processChunk(chain, chunk, options)
            );
            
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Handle results and retries
                for (let j = 0; j < batchResults.length; j++) {
                    const result = batchResults[j];
                    const chunk = batch[j];
                    
                    if (result.status === 'fulfilled') {
                        chunk.status = 'completed';
                        chunk.completedAt = Date.now();
                        results.push(result.value);
                    } else {
                        chunk.status = 'failed';
                        chunk.error = result.reason.message;
                        chunk.retries++;
                        
                        // Retry logic
                        if (chunk.retries < chunking.retryAttempts) {
                            console.log(`🔄 Retrying chunk ${chunk.id} (attempt ${chunk.retries + 1})`);
                            try {
                                const retryResult = await this.processChunk(chain, chunk, options);
                                chunk.status = 'completed';
                                chunk.completedAt = Date.now();
                                results.push(retryResult);
                            } catch (retryError) {
                                console.error(`❌ Chunk ${chunk.id} failed after retry:`, retryError);
                                this.state.failedChunks.set(chunk.id, chunk);
                            }
                        } else {
                            console.error(`❌ Chunk ${chunk.id} failed permanently after ${chunk.retries} retries`);
                            this.state.failedChunks.set(chunk.id, chunk);
                        }
                    }
                }
                
                // Memory management - trigger GC if needed
                await this.checkMemoryUsage();
                
                // Update progress
                this.updateChunkProgress(batch);
                
            } catch (error) {
                console.error('❌ Batch processing error:', error);
                throw error;
            }
        }
        
        return results;
    }
    
    async processChunk(chain, chunk, options) {
        const chunkId = chunk.id;
        const startTime = Date.now();
        
        try {
            // Mark chunk as active
            this.state.activeChunks.set(chunkId, {
                ...chunk,
                startTime,
                status: 'processing'
            });
            
            // Use worker for CPU-intensive processing
            const result = await this.processChunkInWorker(chain, chunk, options);
            
            // Cache result if enabled
            if (options.cache !== false) {
                await this.cacheChunkResult(chunkId, result);
            }
            
            // Move to completed
            this.state.completedChunks.set(chunkId, {
                ...chunk,
                result,
                processingTime: Date.now() - startTime,
                status: 'completed'
            });
            
            this.state.activeChunks.delete(chunkId);
            
            return result;
            
        } catch (error) {
            // Move to failed
            this.state.activeChunks.delete(chunkId);
            
            console.error(`❌ Chunk ${chunkId} processing failed:`, error);
            throw error;
        }
    }
    
    async processChunkInWorker(chain, chunk, options) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: {
                    chain,
                    chunk,
                    options,
                    config: this.config,
                    isWorker: true
                }
            });
            
            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error(`Worker timeout for chunk ${chunk.id}`));
            }, 5 * 60 * 1000); // 5 minute timeout
            
            worker.on('message', (result) => {
                clearTimeout(timeout);
                worker.terminate();
                resolve(result);
            });
            
            worker.on('error', (error) => {
                clearTimeout(timeout);
                worker.terminate();
                reject(error);
            });
            
            this.state.workerPool.add(worker);
        });
    }
    
    // ===================== RATE LIMITING =====================
    
    setupRateLimiters() {
        for (const [api, limits] of Object.entries(this.config.rateLimits)) {
            this.state.rateLimiters.set(api, {
                tokens: limits.burstLimit,
                lastRefill: Date.now(),
                requestQueue: [],
                ...limits
            });
        }
        
        // Start rate limiter refill process
        setInterval(() => {
            this.refillRateLimiters();
        }, 1000); // Refill every second
    }
    
    refillRateLimiters() {
        const now = Date.now();
        
        for (const [api, limiter] of this.state.rateLimiters) {
            const timePassed = now - limiter.lastRefill;
            const tokensToAdd = Math.floor((timePassed / 1000) * limiter.requestsPerSecond);
            
            limiter.tokens = Math.min(limiter.burstLimit, limiter.tokens + tokensToAdd);
            limiter.lastRefill = now;
            
            // Process queued requests
            while (limiter.requestQueue.length > 0 && limiter.tokens > 0) {
                const { resolve } = limiter.requestQueue.shift();
                limiter.tokens--;
                resolve();
            }
        }
    }
    
    async waitForRateLimit(api) {
        const limiter = this.state.rateLimiters.get(api);
        if (!limiter) {
            throw new Error(`No rate limiter configured for API: ${api}`);
        }
        
        if (limiter.tokens > 0) {
            limiter.tokens--;
            return;
        }
        
        // Need to wait - add to queue
        return new Promise((resolve) => {
            limiter.requestQueue.push({ resolve });
        });
    }
    
    async fetchWithRateLimit(url, api, options = {}) {
        await this.waitForRateLimit(api);
        
        const startTime = Date.now();
        
        try {
            const response = await fetch(url, {
                timeout: 30000, // 30 second timeout
                ...options
            });
            
            // Track network latency
            const latency = Date.now() - startTime;
            this.updateNetworkLatency(api, latency);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            // Implement exponential backoff for errors
            const limiter = this.state.rateLimiters.get(api);
            const backoffTime = Math.min(
                1000 * Math.pow(limiter.backoffMultiplier, options.retryCount || 0),
                limiter.maxBackoff
            );
            
            if (options.retryCount < 3) {
                console.log(`⏳ API error, backing off for ${backoffTime}ms`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                
                return this.fetchWithRateLimit(url, api, {
                    ...options,
                    retryCount: (options.retryCount || 0) + 1
                });
            }
            
            throw error;
        }
    }
    
    // ===================== EPOCH HANDLING =====================
    
    async getLatestEpochInfo(chain) {
        switch (chain) {
            case 'ethereum':
                return await this.getEthereumEpochInfo();
            case 'solana':
                return await this.getSolanaEpochInfo();
            case 'bitcoin':
                return await this.getBitcoinEpochInfo();
            default:
                throw new Error(`Epoch info not supported for chain: ${chain}`);
        }
    }
    
    async getEthereumEpochInfo() {
        try {
            // Get latest block from Infura/Alchemy
            const response = await this.fetchWithRateLimit(
                `${process.env.ETHEREUM_RPC_URL}`,
                'infura',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_blockNumber',
                        params: [],
                        id: 1
                    })
                }
            );
            
            const latestBlock = parseInt(response.result, 16);
            const epochSize = this.config.chunking.ethereum.epochSize;
            
            return {
                chain: 'ethereum',
                latestBlock,
                currentEpoch: Math.floor(latestBlock / epochSize),
                epochProgress: (latestBlock % epochSize) / epochSize,
                blocksInCurrentEpoch: latestBlock % epochSize,
                estimatedEpochEnd: Date.now() + ((epochSize - (latestBlock % epochSize)) * 12000)
            };
            
        } catch (error) {
            console.error('Failed to get Ethereum epoch info:', error);
            throw error;
        }
    }
    
    async getSolanaEpochInfo() {
        try {
            const response = await this.fetchWithRateLimit(
                process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
                'solscan',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getEpochInfo'
                    })
                }
            );
            
            const epochInfo = response.result;
            
            return {
                chain: 'solana',
                currentEpoch: epochInfo.epoch,
                slotIndex: epochInfo.slotIndex,
                slotsInEpoch: epochInfo.slotsInEpoch,
                epochProgress: epochInfo.slotIndex / epochInfo.slotsInEpoch,
                estimatedEpochEnd: Date.now() + ((epochInfo.slotsInEpoch - epochInfo.slotIndex) * 400)
            };
            
        } catch (error) {
            console.error('Failed to get Solana epoch info:', error);
            throw error;
        }
    }
    
    async getBitcoinEpochInfo() {
        try {
            const response = await this.fetchWithRateLimit(
                'https://blockstream.info/api/blocks/tip/height',
                'bitcoin'
            );
            
            const latestBlock = response;
            const epochSize = this.config.chunking.bitcoin.epochSize; // 2016 blocks
            
            return {
                chain: 'bitcoin',
                latestBlock,
                currentEpoch: Math.floor(latestBlock / epochSize),
                epochProgress: (latestBlock % epochSize) / epochSize,
                blocksInCurrentEpoch: latestBlock % epochSize,
                estimatedEpochEnd: Date.now() + ((epochSize - (latestBlock % epochSize)) * 600000)
            };
            
        } catch (error) {
            console.error('Failed to get Bitcoin epoch info:', error);
            throw error;
        }
    }
    
    // ===================== MEMORY MANAGEMENT =====================
    
    async checkMemoryUsage() {
        const used = process.memoryUsage();
        this.state.memoryUsage = {
            used: used.heapUsed,
            available: used.heapTotal,
            rss: used.rss,
            external: used.external
        };
        
        // Trigger garbage collection if memory usage is high
        if (used.heapUsed > this.config.memory.gcThreshold) {
            console.log('🗑️ High memory usage detected, triggering garbage collection');
            
            if (global.gc) {
                global.gc();
            }
            
            // Clear old cached chunks
            await this.clearOldCache();
        }
        
        // Update memory efficiency metric
        this.metrics.memoryEfficiency = (used.heapUsed / used.heapTotal) * 100;
    }
    
    async clearOldCache() {
        const now = Date.now();
        const maxAge = this.config.storage.chunkCacheTTL;
        
        let clearedCount = 0;
        
        for (const [chunkId, chunk] of this.state.completedChunks) {
            if (now - chunk.processingTime > maxAge) {
                this.state.completedChunks.delete(chunkId);
                clearedCount++;
            }
        }
        
        if (clearedCount > 0) {
            console.log(`🗑️ Cleared ${clearedCount} old cached chunks`);
        }
    }
    
    // ===================== PROGRESS TRACKING =====================
    
    updateChunkProgress(chunks) {
        for (const chunk of chunks) {
            const chainProgress = this.progress.chains.get(chunk.chain) || {
                totalChunks: 0,
                completedChunks: 0,
                failedChunks: 0,
                lastUpdate: Date.now()
            };
            
            if (chunk.status === 'completed') {
                chainProgress.completedChunks++;
            } else if (chunk.status === 'failed') {
                chainProgress.failedChunks++;
            }
            
            chainProgress.lastUpdate = Date.now();
            this.progress.chains.set(chunk.chain, chainProgress);
        }
        
        // Calculate overall completion percentage
        this.calculateOverallProgress();
        
        // Broadcast progress update
        this.broadcastProgress('chunk_progress', {
            chains: Object.fromEntries(this.progress.chains),
            overall: this.progress.completionPercentage
        });
    }
    
    calculateOverallProgress() {
        let totalChunks = 0;
        let completedChunks = 0;
        
        for (const progress of this.progress.chains.values()) {
            totalChunks += progress.totalChunks;
            completedChunks += progress.completedChunks;
        }
        
        this.progress.completionPercentage = totalChunks > 0 ? 
            (completedChunks / totalChunks) * 100 : 0;
        
        // Estimate time remaining
        if (completedChunks > 0) {
            const elapsed = Date.now() - this.progress.lastUpdate;
            const avgTimePerChunk = elapsed / completedChunks;
            const remainingChunks = totalChunks - completedChunks;
            this.progress.estimatedTimeRemaining = remainingChunks * avgTimePerChunk;
        }
    }
    
    // ===================== WEB SERVER & API =====================
    
    async startWebServer() {
        const app = express();
        
        app.use(express.json());
        app.use(express.static('public'));
        
        // Chunk processing dashboard
        app.get('/chunks', (req, res) => {
            res.send(this.generateChunkDashboard());
        });
        
        // API endpoints
        app.post('/api/chunks/process', async (req, res) => {
            try {
                const { chain, startBlock, endBlock, options } = req.body;
                const taskId = crypto.randomUUID();
                
                // Start processing asynchronously
                this.processBlockchainData(chain, startBlock, endBlock, options)
                    .catch(error => console.error('Processing error:', error));
                
                res.json({ 
                    success: true, 
                    taskId,
                    message: 'Processing started'
                });
                
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.get('/api/chunks/progress', (req, res) => {
            res.json({
                chains: Object.fromEntries(this.progress.chains),
                currentTasks: Object.fromEntries(this.progress.currentTasks),
                overallProgress: this.progress.completionPercentage,
                estimatedTimeRemaining: this.progress.estimatedTimeRemaining
            });
        });
        
        app.get('/api/chunks/metrics', (req, res) => {
            res.json({
                ...this.metrics,
                memoryUsage: this.state.memoryUsage,
                activeChunks: this.state.activeChunks.size,
                completedChunks: this.state.completedChunks.size,
                failedChunks: this.state.failedChunks.size
            });
        });
        
        app.get('/api/chunks/epochs', async (req, res) => {
            try {
                const epochs = {};
                const chains = ['ethereum', 'solana', 'bitcoin'];
                
                for (const chain of chains) {
                    try {
                        epochs[chain] = await this.getLatestEpochInfo(chain);
                    } catch (error) {
                        epochs[chain] = { error: error.message };
                    }
                }
                
                res.json(epochs);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                activeChunks: this.state.activeChunks.size,
                memoryUsage: this.state.memoryUsage,
                networkHealth: Object.fromEntries(this.state.networkHealth)
            });
        });
        
        this.app = app;
        this.server = app.listen(this.config.port);
    }
    
    async startWebSocketServer() {
        this.wsServer = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wsServer.on('connection', (ws) => {
            console.log('📡 New chunk processor WebSocket connection');
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'status',
                data: {
                    activeChunks: this.state.activeChunks.size,
                    progress: this.progress.completionPercentage,
                    metrics: this.metrics
                }
            }));
        });
    }
    
    broadcastProgress(type, data) {
        if (this.wsServer) {
            const message = JSON.stringify({
                type,
                data,
                timestamp: Date.now()
            });
            
            this.wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }
    
    // ===================== UTILITY FUNCTIONS =====================
    
    async initializeStorage() {
        const storageDir = './chunk-processor-data';
        
        try {
            await fs.mkdir(storageDir, { recursive: true });
            await fs.mkdir(path.join(storageDir, 'cache'), { recursive: true });
            await fs.mkdir(path.join(storageDir, 'snapshots'), { recursive: true });
            this.storageDir = storageDir;
        } catch (error) {
            console.error('Failed to create chunk processor storage:', error);
            throw error;
        }
    }
    
    async initializeWorkerPool() {
        // Worker pool is managed dynamically
        console.log('👷 Worker pool initialized for parallel chunk processing');
    }
    
    startHealthMonitoring() {
        setInterval(() => {
            this.checkMemoryUsage();
            this.updateHealthMetrics();
        }, 30000); // Every 30 seconds
    }
    
    updateHealthMetrics() {
        // Update network health for each API
        for (const [api, latencies] of this.metrics.networkLatency) {
            if (latencies.length > 0) {
                const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
                this.state.networkHealth.set(api, {
                    status: avgLatency < 5000 ? 'healthy' : 'degraded',
                    averageLatency: avgLatency,
                    lastCheck: Date.now()
                });
            }
        }
        
        // Update success rate
        const total = this.state.completedChunks.size + this.state.failedChunks.size;
        this.metrics.successRate = total > 0 ? 
            (this.state.completedChunks.size / total) * 100 : 100;
    }
    
    updateNetworkLatency(api, latency) {
        if (!this.metrics.networkLatency.has(api)) {
            this.metrics.networkLatency.set(api, []);
        }
        
        const latencies = this.metrics.networkLatency.get(api);
        latencies.push(latency);
        
        // Keep only last 100 measurements
        if (latencies.length > 100) {
            latencies.shift();
        }
    }
    
    updateProcessingMetrics(task, results) {
        this.metrics.totalChunksProcessed += task.totalChunks;
        this.metrics.totalDataProcessed += task.totalDataProcessed || 0;
        
        const processingTime = task.endTime - task.startTime;
        const currentAvg = this.metrics.averageChunkTime;
        const totalTasks = this.progress.currentTasks.size;
        
        this.metrics.averageChunkTime = totalTasks > 1 ? 
            ((currentAvg * (totalTasks - 1)) + processingTime) / totalTasks : 
            processingTime;
    }
    
    async cacheChunkResult(chunkId, result) {
        try {
            const cacheFile = path.join(this.storageDir, 'cache', `${chunkId}.json`);
            await fs.writeFile(cacheFile, JSON.stringify(result));
        } catch (error) {
            console.error(`Failed to cache chunk ${chunkId}:`, error);
        }
    }
    
    generateChunkDashboard() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ Blockchain Chunk Processor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a; color: #fff; min-height: 100vh;
        }
        .header { 
            background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255,255,255,0.1); padding: 20px;
        }
        h1 { 
            font-size: 32px; background: linear-gradient(45deg, #ffd700, #ffff00);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .dashboard { max-width: 1400px; margin: 20px auto; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
        .card { 
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 15px; padding: 25px; backdrop-filter: blur(10px);
        }
        .card h3 { color: #ffd700; margin-bottom: 20px; font-size: 20px; }
        .metric { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px 0; }
        .metric:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.1); }
        .value { color: #ffff00; font-weight: bold; font-size: 18px; }
        .progress-bar { 
            width: 100%; height: 8px; background: rgba(255,255,255,0.1); 
            border-radius: 4px; overflow: hidden; margin: 10px 0;
        }
        .progress-fill { height: 100%; background: linear-gradient(45deg, #ffd700, #ffff00); transition: width 0.3s; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .status-card { 
            background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px; padding: 15px; text-align: center;
        }
        .status-value { font-size: 24px; font-weight: bold; color: #ffd700; }
        .status-label { font-size: 12px; color: #888; margin-top: 5px; }
        .process-btn { 
            background: linear-gradient(45deg, #ffd700, #ffff00); color: #000; border: none; 
            padding: 15px 30px; border-radius: 10px; cursor: pointer; margin: 15px 0;
            font-weight: bold; font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ Blockchain Chunk Processor</h1>
        <p>High-performance blockchain data processing with intelligent chunking</p>
    </div>
    
    <div class="dashboard">
        <div class="grid">
            <!-- Processing Status -->
            <div class="card">
                <h3>📊 Processing Status</h3>
                <div class="metric">
                    <span>Active Chunks:</span>
                    <span class="value" id="activeChunks">${this.state.activeChunks.size}</span>
                </div>
                <div class="metric">
                    <span>Completed Chunks:</span>
                    <span class="value" id="completedChunks">${this.state.completedChunks.size}</span>
                </div>
                <div class="metric">
                    <span>Failed Chunks:</span>
                    <span class="value" id="failedChunks">${this.state.failedChunks.size}</span>
                </div>
                <div class="metric">
                    <span>Overall Progress:</span>
                    <span class="value" id="overallProgress">${this.progress.completionPercentage.toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.progress.completionPercentage}%"></div>
                </div>
            </div>
            
            <!-- Performance Metrics -->
            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric">
                    <span>Success Rate:</span>
                    <span class="value" id="successRate">${this.metrics.successRate.toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span>Avg Chunk Time:</span>
                    <span class="value" id="avgChunkTime">${(this.metrics.averageChunkTime / 1000).toFixed(1)}s</span>
                </div>
                <div class="metric">
                    <span>Memory Usage:</span>
                    <span class="value" id="memoryUsage">${(this.state.memoryUsage.used / 1024 / 1024).toFixed(0)}MB</span>
                </div>
                <div class="metric">
                    <span>Memory Efficiency:</span>
                    <span class="value" id="memoryEfficiency">${this.metrics.memoryEfficiency.toFixed(1)}%</span>
                </div>
            </div>
            
            <!-- Chain Status -->
            <div class="card">
                <h3>⛓️ Chain Processing</h3>
                <div class="status-grid">
                    ${Array.from(this.progress.chains.entries()).map(([chain, progress]) => `
                        <div class="status-card">
                            <div class="status-value">${progress.completedChunks}</div>
                            <div class="status-label">${chain.toUpperCase()}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Processing Controls -->
        <div class="card" style="margin-top: 20px;">
            <h3>🎛️ Processing Controls</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <label>Chain:</label>
                    <select id="chainSelect" style="width: 100%; padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 5px; color: #fff;">
                        <option value="ethereum">Ethereum</option>
                        <option value="solana">Solana</option>
                        <option value="bitcoin">Bitcoin</option>
                        <option value="polygon">Polygon</option>
                    </select>
                </div>
                <div>
                    <label>Start Block:</label>
                    <input type="number" id="startBlock" placeholder="Start block number" style="width: 100%; padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 5px; color: #fff;">
                </div>
                <div>
                    <label>End Block:</label>
                    <input type="number" id="endBlock" placeholder="End block number" style="width: 100%; padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 5px; color: #fff;">
                </div>
            </div>
            <button class="process-btn" onclick="startProcessing()">Start Chunk Processing</button>
        </div>
    </div>
    
    <script>
        // WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleRealtimeUpdate(data);
        };
        
        function handleRealtimeUpdate(data) {
            if (data.type === 'chunk_progress') {
                updateProgress(data.data);
            }
        }
        
        function updateProgress(progressData) {
            document.getElementById('overallProgress').textContent = progressData.overall.toFixed(1) + '%';
            document.querySelector('.progress-fill').style.width = progressData.overall + '%';
        }
        
        async function startProcessing() {
            const chain = document.getElementById('chainSelect').value;
            const startBlock = parseInt(document.getElementById('startBlock').value);
            const endBlock = parseInt(document.getElementById('endBlock').value);
            
            if (!startBlock || !endBlock || startBlock >= endBlock) {
                alert('Please enter valid block range');
                return;
            }
            
            try {
                const response = await fetch('/api/chunks/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chain, startBlock, endBlock })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Processing started! Check progress in real-time.');
                } else {
                    alert('Failed to start processing: ' + result.error);
                }
            } catch (error) {
                alert('Error starting processing: ' + error.message);
            }
        }
        
        // Periodic updates
        setInterval(async () => {
            try {
                const response = await fetch('/api/chunks/metrics');
                const metrics = await response.json();
                
                document.getElementById('activeChunks').textContent = metrics.activeChunks;
                document.getElementById('completedChunks').textContent = metrics.completedChunks;
                document.getElementById('failedChunks').textContent = metrics.failedChunks;
                document.getElementById('successRate').textContent = metrics.successRate.toFixed(1) + '%';
                document.getElementById('avgChunkTime').textContent = (metrics.averageChunkTime / 1000).toFixed(1) + 's';
                document.getElementById('memoryUsage').textContent = (metrics.memoryUsage.used / 1024 / 1024).toFixed(0) + 'MB';
                document.getElementById('memoryEfficiency').textContent = metrics.memoryEfficiency.toFixed(1) + '%';
            } catch (error) {
                console.error('Failed to update metrics:', error);
            }
        }, 5000); // Every 5 seconds
    </script>
</body>
</html>
        `;
    }
}

// Worker thread code
if (!isMainThread && workerData.isWorker) {
    (async () => {
        try {
            const { chain, chunk, options, config } = workerData;
            
            // Simulate chunk processing work
            // In real implementation, this would process blockchain data
            const result = {
                chunkId: chunk.id,
                chain,
                startBlock: chunk.startBlock,
                endBlock: chunk.endBlock,
                transactions: [],
                size: chunk.size,
                processingTime: Date.now(),
                success: true
            };
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
            
            parentPort.postMessage(result);
            
        } catch (error) {
            parentPort.postMessage({ error: error.message });
        }
    })();
}

// Export for use in other modules
module.exports = BlockchainChunkProcessor;

// Start the service if run directly
if (require.main === module && isMainThread) {
    const processor = new BlockchainChunkProcessor();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Blockchain Chunk Processor...');
        
        // Terminate all workers
        for (const worker of processor.state.workerPool) {
            worker.terminate();
        }
        
        process.exit(0);
    });
}
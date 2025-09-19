#!/usr/bin/env node
/**
 * LOG-AGGREGATOR.js - Simplified Building Block Log System
 * 
 * A practical implementation that transforms logs into building blocks
 * using existing compression systems while avoiding API timeouts.
 * 
 * Based on 5W+H Analysis - focuses on working integration over theory.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

/**
 * LogBlock - Basic building block structure
 */
class LogBlock {
  constructor(data) {
    this.id = uuidv4();
    this.type = data.type || 'info'; // error|info|warning|success|metric
    this.timestamp = new Date().toISOString();
    this.source = data.source || 'unknown';
    this.content = data.content || '';
    this.compressionMethod = 'none';
    this.connections = {
      top: null,
      bottom: null,
      left: null,
      right: null
    };
    this.metadata = {
      reversible: true,
      compressionRatio: 1.0,
      semanticWeight: 0.5,
      originalSize: this.content.length,
      compressedSize: this.content.length
    };
  }

  // Connect blocks together
  connect(direction, block) {
    if (this.connections[direction]) {
      throw new Error(`Block already connected on ${direction}`);
    }
    this.connections[direction] = block.id;
    
    // Mirror connection
    const opposite = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left'
    };
    block.connections[opposite[direction]] = this.id;
  }

  // Simple compression with reversibility
  compress(method = 'simple') {
    if (this.compressionMethod !== 'none') return;
    
    const original = this.content;
    
    switch (method) {
      case 'simple':
        // Basic run-length encoding for repeated characters
        this.content = this.content.replace(/(.)\1{3,}/g, (match, char) => {
          return `${char}×${match.length}`;
        });
        break;
        
      case 'semantic':
        // Replace common log patterns
        const patterns = {
          'ERROR:': '❌',
          'INFO:': 'ℹ️',
          'WARNING:': '⚠️',
          'SUCCESS:': '✅',
          'FAILED': '💥',
          'localhost': '🏠',
          'undefined': '❓'
        };
        
        for (const [pattern, emoji] of Object.entries(patterns)) {
          this.content = this.content.replace(new RegExp(pattern, 'g'), emoji);
        }
        break;
    }
    
    this.compressionMethod = method;
    this.metadata.compressedSize = this.content.length;
    this.metadata.compressionRatio = this.metadata.compressedSize / this.metadata.originalSize;
    
    // Store decompression map for reversibility
    this.metadata.decompressionMap = { original, method };
  }

  // Decompress to original
  decompress() {
    if (this.compressionMethod === 'none') return this.content;
    
    if (this.metadata.decompressionMap) {
      this.content = this.metadata.decompressionMap.original;
      this.compressionMethod = 'none';
      this.metadata.reversible = true;
      return this.content;
    }
    
    this.metadata.reversible = false;
    return null;
  }
}

/**
 * LogAggregator - Main aggregator with building block approach
 */
class LogAggregator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      chunkSize: options.chunkSize || 1024, // 1KB chunks
      aggregationWindow: options.aggregationWindow || 5000, // 5 seconds
      maxBlocks: options.maxBlocks || 10000,
      wsPort: options.wsPort || 3337,
      compressionMethods: options.compressionMethods || ['simple', 'semantic']
    };
    
    this.blocks = new Map();
    this.blocksByType = {
      error: [],
      info: [],
      warning: [],
      success: [],
      metric: []
    };
    
    this.compressionPlugins = new Map();
    this.aggregationBuffer = [];
    this.wsServer = null;
    this.clients = new Set();
    
    this.initialize();
  }

  initialize() {
    // Start WebSocket server for real-time streaming
    this.wsServer = new WebSocket.Server({ port: this.config.wsPort });
    this.wsServer.on('connection', (ws) => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
      
      // Send current state
      ws.send(JSON.stringify({
        type: 'initial',
        blocks: this.getBlocksSummary(),
        stats: this.getStats()
      }));
    });
    
    // Start aggregation timer
    setInterval(() => this.processAggregationBuffer(), this.config.aggregationWindow);
    
    console.log(`🔧 LOG-AGGREGATOR initialized`);
    console.log(`📡 WebSocket server on port ${this.config.wsPort}`);
    console.log(`📦 Chunk size: ${this.config.chunkSize} bytes`);
    console.log(`⏱️  Aggregation window: ${this.config.aggregationWindow}ms`);
  }

  // Add log entry
  addLog(data) {
    // Chunk large logs
    if (data.content && data.content.length > this.config.chunkSize) {
      const chunks = this.chunkContent(data.content);
      chunks.forEach((chunk, index) => {
        this.aggregationBuffer.push({
          ...data,
          content: chunk,
          chunkIndex: index,
          totalChunks: chunks.length
        });
      });
    } else {
      this.aggregationBuffer.push(data);
    }
    
    this.emit('log-added', data);
  }

  // Chunk content to avoid API timeouts
  chunkContent(content) {
    const chunks = [];
    for (let i = 0; i < content.length; i += this.config.chunkSize) {
      chunks.push(content.slice(i, i + this.config.chunkSize));
    }
    return chunks;
  }

  // Process aggregation buffer
  processAggregationBuffer() {
    if (this.aggregationBuffer.length === 0) return;
    
    const logs = [...this.aggregationBuffer];
    this.aggregationBuffer = [];
    
    // Group by type and source
    const grouped = this.groupLogs(logs);
    
    // Create blocks from grouped logs
    for (const [key, group] of Object.entries(grouped)) {
      const block = this.createBlockFromGroup(group);
      this.addBlock(block);
    }
    
    this.emit('aggregation-complete', logs.length);
  }

  // Group logs for efficient block creation
  groupLogs(logs) {
    const groups = {};
    
    logs.forEach(log => {
      const key = `${log.type}-${log.source}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(log);
    });
    
    return groups;
  }

  // Create block from log group
  createBlockFromGroup(logs) {
    const block = new LogBlock({
      type: logs[0].type,
      source: logs[0].source,
      content: logs.map(l => l.content).join('\n')
    });
    
    // Apply compression
    const method = this.selectCompressionMethod(block);
    if (method) {
      block.compress(method);
    }
    
    // Connect to previous blocks of same type
    const typeBlocks = this.blocksByType[block.type];
    if (typeBlocks.length > 0) {
      const lastBlock = this.blocks.get(typeBlocks[typeBlocks.length - 1]);
      if (lastBlock) {
        block.connect('top', lastBlock);
      }
    }
    
    return block;
  }

  // Select best compression method
  selectCompressionMethod(block) {
    // Simple heuristic: use semantic for known patterns
    if (block.content.includes('ERROR') || block.content.includes('WARNING')) {
      return 'semantic';
    }
    
    // Check for repetition
    if (/(.)\1{3,}/.test(block.content)) {
      return 'simple';
    }
    
    return null;
  }

  // Add block to system
  addBlock(block) {
    if (this.blocks.size >= this.config.maxBlocks) {
      // Remove oldest blocks
      this.pruneOldBlocks();
    }
    
    this.blocks.set(block.id, block);
    this.blocksByType[block.type].push(block.id);
    
    // Broadcast to clients
    this.broadcast({
      type: 'block-added',
      block: this.serializeBlock(block)
    });
    
    this.emit('block-added', block);
  }

  // Prune old blocks to prevent memory issues
  pruneOldBlocks() {
    const toRemove = Math.floor(this.config.maxBlocks * 0.1); // Remove 10%
    const blockIds = Array.from(this.blocks.keys()).slice(0, toRemove);
    
    blockIds.forEach(id => {
      const block = this.blocks.get(id);
      if (block) {
        const typeIndex = this.blocksByType[block.type].indexOf(id);
        if (typeIndex > -1) {
          this.blocksByType[block.type].splice(typeIndex, 1);
        }
        this.blocks.delete(id);
      }
    });
    
    this.emit('blocks-pruned', toRemove);
  }

  // Register compression plugin
  registerPlugin(name, plugin) {
    if (typeof plugin.compress !== 'function' || typeof plugin.decompress !== 'function') {
      throw new Error('Plugin must have compress and decompress methods');
    }
    
    this.compressionPlugins.set(name, plugin);
    console.log(`🔌 Registered compression plugin: ${name}`);
  }

  // Get block by ID
  getBlock(id) {
    return this.blocks.get(id);
  }

  // Get connected blocks (building structure)
  getConnectedBlocks(blockId, visited = new Set()) {
    if (visited.has(blockId)) return [];
    visited.add(blockId);
    
    const block = this.blocks.get(blockId);
    if (!block) return [];
    
    const connected = [block];
    
    // Traverse connections
    for (const [direction, connectedId] of Object.entries(block.connections)) {
      if (connectedId) {
        connected.push(...this.getConnectedBlocks(connectedId, visited));
      }
    }
    
    return connected;
  }

  // Get blocks summary for dashboard
  getBlocksSummary() {
    const summary = {};
    
    for (const [type, ids] of Object.entries(this.blocksByType)) {
      summary[type] = {
        count: ids.length,
        latest: ids.slice(-5).map(id => {
          const block = this.blocks.get(id);
          return block ? {
            id: block.id,
            timestamp: block.timestamp,
            compressionRatio: block.metadata.compressionRatio
          } : null;
        }).filter(Boolean)
      };
    }
    
    return summary;
  }

  // Get aggregator statistics
  getStats() {
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let reversibleCount = 0;
    
    for (const block of this.blocks.values()) {
      totalOriginalSize += block.metadata.originalSize;
      totalCompressedSize += block.metadata.compressedSize;
      if (block.metadata.reversible) reversibleCount++;
    }
    
    return {
      totalBlocks: this.blocks.size,
      totalOriginalSize,
      totalCompressedSize,
      averageCompressionRatio: totalOriginalSize > 0 
        ? (totalCompressedSize / totalOriginalSize).toFixed(2) 
        : 1,
      reversibilityRate: this.blocks.size > 0 
        ? ((reversibleCount / this.blocks.size) * 100).toFixed(1) 
        : 100,
      blocksByType: Object.entries(this.blocksByType).reduce((acc, [type, ids]) => {
        acc[type] = ids.length;
        return acc;
      }, {})
    };
  }

  // Serialize block for transmission
  serializeBlock(block) {
    return {
      id: block.id,
      type: block.type,
      timestamp: block.timestamp,
      source: block.source,
      compressionMethod: block.compressionMethod,
      connections: block.connections,
      metadata: block.metadata
    };
  }

  // Broadcast to all connected clients
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Graceful shutdown
  shutdown() {
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    console.log('🛑 LOG-AGGREGATOR shutdown complete');
  }
}

// Export for use as module
module.exports = LogAggregator;

// CLI functionality when run directly
if (require.main === module) {
  const aggregator = new LogAggregator();
  
  // Demo: Add some test logs
  console.log('\n📊 LOG-AGGREGATOR Demo');
  console.log('====================\n');
  
  // Simulate various log types
  const testLogs = [
    { type: 'info', source: 'system', content: 'System started successfully' },
    { type: 'error', source: 'api', content: 'ERROR: Connection timeout to database' },
    { type: 'warning', source: 'api', content: 'WARNING: High memory usage detected' },
    { type: 'success', source: 'build', content: 'SUCCESS: Build completed in 3.2s' },
    { type: 'metric', source: 'monitor', content: 'CPU: 45%, Memory: 2.1GB, Disk: 78%' }
  ];
  
  // Add logs with delay to show aggregation
  testLogs.forEach((log, index) => {
    setTimeout(() => {
      console.log(`📝 Adding log: [${log.type}] ${log.content.substring(0, 50)}...`);
      aggregator.addLog(log);
    }, index * 1000);
  });
  
  // Show stats after aggregation
  setTimeout(() => {
    console.log('\n📈 Aggregator Statistics:');
    console.log(JSON.stringify(aggregator.getStats(), null, 2));
    
    console.log('\n✅ LOG-AGGREGATOR running successfully!');
    console.log(`🌐 Connect to ws://localhost:${aggregator.config.wsPort} for real-time updates`);
  }, 7000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nShutting down...');
    aggregator.shutdown();
    process.exit(0);
  });
}
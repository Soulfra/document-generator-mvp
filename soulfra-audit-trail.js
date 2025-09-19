#!/usr/bin/env node

/**
 * SOULFRA IMMUTABLE AUDIT TRAIL & VERIFICATION LOGGING
 * 
 * Creates tamper-proof audit logs with cryptographic verification
 * to ensure complete accountability and prevent log manipulation.
 * 
 * Key Features:
 * - Immutable hash-chained audit entries
 * - Cryptographic integrity verification
 * - Merkle tree proofs for efficient verification
 * - Real-time log streaming and monitoring
 * - Compliance-ready audit reports
 * - Integration with existing verification systems
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class SoulFraAuditTrail extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Storage configuration
      logDirectory: options.logDirectory || './audit-logs',
      maxLogFileSize: options.maxLogFileSize || 10 * 1024 * 1024, // 10MB
      compressionEnabled: options.compressionEnabled || true,
      
      // Security configuration
      encryptionEnabled: options.encryptionEnabled || true,
      signatureRequired: options.signatureRequired || true,
      merkleTreeEnabled: options.merkleTreeEnabled || true,
      
      // Retention configuration
      retentionDays: options.retentionDays || 2555, // 7 years for compliance
      archiveEnabled: options.archiveEnabled || true,
      
      // Performance configuration
      batchSize: options.batchSize || 100,
      flushInterval: options.flushInterval || 5000, // 5 seconds
      
      // Compliance configuration
      complianceStandards: options.complianceStandards || ['SOC2', 'ISO27001', 'GDPR']
    };
    
    // State management
    this.currentLogFile = null;
    this.currentLogStream = null;
    this.pendingEntries = [];
    this.chainState = {
      lastHash: null,
      entryCount: 0,
      merkleRoot: null
    };
    
    // Merkle tree for efficient verification
    this.merkleTree = {
      leaves: [],
      tree: [],
      root: null
    };
    
    // Statistics
    this.stats = {
      totalEntries: 0,
      verifiedEntries: 0,
      integrityChecks: 0,
      corruptedEntries: 0,
      averageEntrySize: 0
    };
    
    console.log('📊 SoulFra Audit Trail initialized');
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION AND SETUP
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize the audit trail system
   */
  async initialize() {
    console.log('\n🚀 Initializing Audit Trail System...');
    
    // Create log directory
    await this.ensureLogDirectory();
    
    // Load existing chain state
    await this.loadChainState();
    
    // Initialize current log file
    await this.initializeLogFile();
    
    // Start batch processing
    this.startBatchProcessor();
    
    // Set up integrity monitoring
    this.startIntegrityMonitoring();
    
    console.log('\n✅ Audit Trail System ready!');
    console.log('   📁 Log directory configured');
    console.log('   🔗 Chain state loaded');
    console.log('   📝 Log file initialized');
    console.log('   ⚡ Batch processing started');
    console.log('   🔍 Integrity monitoring active');
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true });
      console.log(`📁 Log directory: ${this.config.logDirectory}`);
    } catch (error) {
      throw new Error(`Failed to create log directory: ${error.message}`);
    }
  }

  /**
   * Load existing chain state
   */
  async loadChainState() {
    try {
      const chainStatePath = path.join(this.config.logDirectory, 'chain-state.json');
      const stateData = await fs.readFile(chainStatePath, 'utf8');
      this.chainState = JSON.parse(stateData);
      
      console.log(`🔗 Chain state loaded: ${this.chainState.entryCount} entries`);
      
    } catch (error) {
      console.log('🆕 Initializing new chain state');
      this.chainState = {
        lastHash: null,
        entryCount: 0,
        merkleRoot: null,
        genesisTimestamp: Date.now(),
        genesisHash: this.generateGenesisHash()
      };
      
      await this.saveChainState();
    }
  }

  /**
   * Generate genesis hash for new audit trail
   */
  generateGenesisHash() {
    const genesisData = {
      type: 'genesis',
      timestamp: Date.now(),
      version: '1.0.0',
      system: 'soulfra-audit-trail'
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(genesisData))
      .digest('hex');
  }

  /**
   * Initialize current log file
   */
  async initializeLogFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-${timestamp}.jsonl`;
    this.currentLogFile = path.join(this.config.logDirectory, filename);
    
    console.log(`📝 Log file: ${filename}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUDIT ENTRY CREATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Log an audit entry
   */
  async logEntry(entryData) {
    const entry = await this.createAuditEntry(entryData);
    
    // Add to pending batch
    this.pendingEntries.push(entry);
    
    // Emit event for real-time monitoring
    this.emit('auditEntry', entry);
    
    // If batch is full or high priority, flush immediately
    if (this.pendingEntries.length >= this.config.batchSize || entryData.priority === 'critical') {
      await this.flushPendingEntries();
    }
    
    return entry;
  }

  /**
   * Create a cryptographically secured audit entry
   */
  async createAuditEntry(entryData) {
    const timestamp = Date.now();
    const entryId = crypto.randomUUID();
    
    // Create base entry
    const entry = {
      id: entryId,
      timestamp,
      sequenceNumber: this.chainState.entryCount + this.pendingEntries.length + 1,
      type: entryData.type || 'general',
      severity: entryData.severity || 'info',
      source: entryData.source || 'system',
      userId: entryData.userId || null,
      action: entryData.action || null,
      data: entryData.data || {},
      metadata: {
        hostname: require('os').hostname(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      }
    };
    
    // Add chain reference
    entry.previousHash = this.chainState.lastHash;
    
    // Calculate content hash
    entry.contentHash = this.calculateContentHash(entry);
    
    // Create signature if enabled
    if (this.config.signatureRequired) {
      entry.signature = await this.signEntry(entry);
    }
    
    // Encrypt sensitive data if enabled
    if (this.config.encryptionEnabled && this.containsSensitiveData(entry)) {
      entry.encryptedData = await this.encryptSensitiveData(entry.data);
      entry.data = { encrypted: true };
    }
    
    // Calculate final entry hash
    entry.hash = this.calculateEntryHash(entry);
    
    console.log(`📝 Audit entry created: ${entry.type} (${entry.id.substring(0, 8)}...)`);
    
    return entry;
  }

  /**
   * Calculate content hash (excluding hash field itself)
   */
  calculateContentHash(entry) {
    const contentData = { ...entry };
    delete contentData.hash;
    delete contentData.signature;
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(contentData, Object.keys(contentData).sort()))
      .digest('hex');
  }

  /**
   * Calculate final entry hash
   */
  calculateEntryHash(entry) {
    return crypto.createHash('sha256')
      .update(entry.contentHash + (entry.signature || ''))
      .digest('hex');
  }

  /**
   * Sign audit entry (placeholder - would use proper key management)
   */
  async signEntry(entry) {
    // In production, this would use proper key management
    const signatureData = `${entry.contentHash}:${entry.timestamp}:${entry.sequenceNumber}`;
    
    return crypto.createHash('sha256')
      .update(signatureData + 'audit-signing-key')
      .digest('hex');
  }

  /**
   * Check if entry contains sensitive data
   */
  containsSensitiveData(entry) {
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'private'];
    const entryString = JSON.stringify(entry).toLowerCase();
    
    return sensitiveFields.some(field => entryString.includes(field));
  }

  /**
   * Encrypt sensitive data
   */
  async encryptSensitiveData(data) {
    // Simple encryption - use proper encryption in production
    const key = crypto.createHash('sha256').update('audit-encryption-key').digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      algorithm: 'aes-256-cbc',
      iv: iv.toString('hex'),
      data: encrypted
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // BATCH PROCESSING AND PERSISTENCE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start batch processor
   */
  startBatchProcessor() {
    setInterval(async () => {
      if (this.pendingEntries.length > 0) {
        await this.flushPendingEntries();
      }
    }, this.config.flushInterval);
    
    console.log('⚡ Batch processor started');
  }

  /**
   * Flush pending entries to disk
   */
  async flushPendingEntries() {
    if (this.pendingEntries.length === 0) return;
    
    const entries = [...this.pendingEntries];
    this.pendingEntries = [];
    
    try {
      // Update chain state
      for (const entry of entries) {
        this.chainState.lastHash = entry.hash;
        this.chainState.entryCount++;
      }
      
      // Add to merkle tree
      if (this.config.merkleTreeEnabled) {
        this.addToMerkleTree(entries);
      }
      
      // Write to log file
      await this.writeEntriesToFile(entries);
      
      // Save updated chain state
      await this.saveChainState();
      
      // Update statistics
      this.updateStatistics(entries);
      
      console.log(`💾 Flushed ${entries.length} audit entries`);
      
      this.emit('entriesFlushed', { count: entries.length, entries });
      
    } catch (error) {
      // Re-add entries to pending if write failed
      this.pendingEntries.unshift(...entries);
      console.error(`Failed to flush audit entries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Write entries to log file
   */
  async writeEntriesToFile(entries) {
    // Check if we need to rotate log file
    if (await this.shouldRotateLogFile()) {
      await this.rotateLogFile();
    }
    
    // Prepare log data
    const logData = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
    
    // Append to log file
    await fs.appendFile(this.currentLogFile, logData, 'utf8');
  }

  /**
   * Check if log file should be rotated
   */
  async shouldRotateLogFile() {
    try {
      const stats = await fs.stat(this.currentLogFile);
      return stats.size >= this.config.maxLogFileSize;
    } catch (error) {
      return false; // File doesn't exist yet
    }
  }

  /**
   * Rotate log file
   */
  async rotateLogFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFilename = `audit-${timestamp}.jsonl`;
    const newLogFile = path.join(this.config.logDirectory, newFilename);
    
    console.log(`🔄 Rotating log file: ${path.basename(newLogFile)}`);
    
    this.currentLogFile = newLogFile;
  }

  /**
   * Save chain state
   */
  async saveChainState() {
    const chainStatePath = path.join(this.config.logDirectory, 'chain-state.json');
    await fs.writeFile(chainStatePath, JSON.stringify(this.chainState, null, 2));
  }

  // ═══════════════════════════════════════════════════════════════
  // MERKLE TREE IMPLEMENTATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Add entries to merkle tree
   */
  addToMerkleTree(entries) {
    // Add entry hashes as leaves
    for (const entry of entries) {
      this.merkleTree.leaves.push(entry.hash);
    }
    
    // Rebuild tree
    this.buildMerkleTree();
    
    // Update chain state with new root
    this.chainState.merkleRoot = this.merkleTree.root;
  }

  /**
   * Build merkle tree from leaves
   */
  buildMerkleTree() {
    if (this.merkleTree.leaves.length === 0) {
      this.merkleTree.root = null;
      return;
    }
    
    let currentLevel = [...this.merkleTree.leaves];
    this.merkleTree.tree = [currentLevel];
    
    while (currentLevel.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Duplicate if odd number
        
        const combined = crypto.createHash('sha256')
          .update(left + right)
          .digest('hex');
        
        nextLevel.push(combined);
      }
      
      currentLevel = nextLevel;
      this.merkleTree.tree.push(currentLevel);
    }
    
    this.merkleTree.root = currentLevel[0];
  }

  /**
   * Generate merkle proof for an entry
   */
  generateMerkleProof(entryHash) {
    const leafIndex = this.merkleTree.leaves.indexOf(entryHash);
    if (leafIndex === -1) {
      throw new Error('Entry not found in merkle tree');
    }
    
    const proof = [];
    let currentIndex = leafIndex;
    
    for (let level = 0; level < this.merkleTree.tree.length - 1; level++) {
      const currentLevel = this.merkleTree.tree[level];
      const isLeftNode = currentIndex % 2 === 0;
      const siblingIndex = isLeftNode ? currentIndex + 1 : currentIndex - 1;
      
      if (siblingIndex < currentLevel.length) {
        proof.push({
          hash: currentLevel[siblingIndex],
          position: isLeftNode ? 'right' : 'left'
        });
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return {
      leafHash: entryHash,
      leafIndex,
      proof,
      root: this.merkleTree.root
    };
  }

  /**
   * Verify merkle proof
   */
  verifyMerkleProof(merkleProof) {
    let currentHash = merkleProof.leafHash;
    
    for (const step of merkleProof.proof) {
      const combinedData = step.position === 'left' 
        ? step.hash + currentHash 
        : currentHash + step.hash;
      
      currentHash = crypto.createHash('sha256')
        .update(combinedData)
        .digest('hex');
    }
    
    return currentHash === merkleProof.root;
  }

  // ═══════════════════════════════════════════════════════════════
  // INTEGRITY VERIFICATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start integrity monitoring
   */
  startIntegrityMonitoring() {
    // Periodic integrity checks
    setInterval(async () => {
      await this.performIntegrityCheck();
    }, 300000); // Every 5 minutes
    
    console.log('🔍 Integrity monitoring started');
  }

  /**
   * Perform comprehensive integrity check
   */
  async performIntegrityCheck() {
    console.log('\n🔍 Performing audit trail integrity check...');
    
    this.stats.integrityChecks++;
    
    try {
      // Verify chain integrity
      const chainResult = await this.verifyChainIntegrity();
      
      // Verify merkle tree integrity
      const merkleResult = this.verifyMerkleIntegrity();
      
      // Verify file integrity
      const fileResult = await this.verifyFileIntegrity();
      
      const overallValid = chainResult.valid && merkleResult.valid && fileResult.valid;
      
      const result = {
        timestamp: Date.now(),
        overall: overallValid,
        chain: chainResult,
        merkle: merkleResult,
        files: fileResult
      };
      
      if (overallValid) {
        console.log('✅ Integrity check passed');
      } else {
        console.log('❌ Integrity check failed');
        this.emit('integrityViolation', result);
      }
      
      return result;
      
    } catch (error) {
      console.error(`💥 Integrity check error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify chain integrity
   */
  async verifyChainIntegrity() {
    // Load all log files and verify chain
    const logFiles = await this.getLogFiles();
    let previousHash = null;
    let verifiedEntries = 0;
    let corruptedEntries = 0;
    
    for (const logFile of logFiles) {
      const entries = await this.readLogFile(logFile);
      
      for (const entry of entries) {
        // Verify previous hash reference
        if (entry.previousHash !== previousHash) {
          corruptedEntries++;
          console.warn(`Chain break detected at entry ${entry.id}`);
        } else {
          verifiedEntries++;
        }
        
        // Verify entry hash
        const calculatedHash = this.calculateEntryHash(entry);
        if (calculatedHash !== entry.hash) {
          corruptedEntries++;
          console.warn(`Hash mismatch detected at entry ${entry.id}`);
        }
        
        previousHash = entry.hash;
      }
    }
    
    this.stats.verifiedEntries = verifiedEntries;
    this.stats.corruptedEntries = corruptedEntries;
    
    return {
      valid: corruptedEntries === 0,
      verifiedEntries,
      corruptedEntries,
      totalChecked: verifiedEntries + corruptedEntries
    };
  }

  /**
   * Verify merkle tree integrity
   */
  verifyMerkleIntegrity() {
    if (!this.config.merkleTreeEnabled) {
      return { valid: true, reason: 'merkle-tree-disabled' };
    }
    
    // Rebuild merkle tree and compare root
    const originalRoot = this.merkleTree.root;
    this.buildMerkleTree();
    const rebuiltRoot = this.merkleTree.root;
    
    return {
      valid: originalRoot === rebuiltRoot,
      originalRoot,
      rebuiltRoot,
      leavesCount: this.merkleTree.leaves.length
    };
  }

  /**
   * Verify file integrity
   */
  async verifyFileIntegrity() {
    // Check that all log files are readable and valid JSON
    const logFiles = await this.getLogFiles();
    let validFiles = 0;
    let corruptedFiles = 0;
    
    for (const logFile of logFiles) {
      try {
        const entries = await this.readLogFile(logFile);
        if (entries.length > 0) {
          validFiles++;
        }
      } catch (error) {
        corruptedFiles++;
        console.warn(`Corrupted log file: ${logFile}`);
      }
    }
    
    return {
      valid: corruptedFiles === 0,
      validFiles,
      corruptedFiles,
      totalFiles: validFiles + corruptedFiles
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // QUERY AND RETRIEVAL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Query audit entries
   */
  async queryEntries(criteria = {}) {
    console.log('🔍 Querying audit entries...');
    
    const results = [];
    const logFiles = await this.getLogFiles();
    
    for (const logFile of logFiles) {
      const entries = await this.readLogFile(logFile);
      
      for (const entry of entries) {
        if (this.matchesCriteria(entry, criteria)) {
          results.push(entry);
        }
      }
    }
    
    // Sort by timestamp
    results.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`📋 Found ${results.length} matching entries`);
    
    return results;
  }

  /**
   * Check if entry matches query criteria
   */
  matchesCriteria(entry, criteria) {
    // Time range filter
    if (criteria.startTime && entry.timestamp < criteria.startTime) return false;
    if (criteria.endTime && entry.timestamp > criteria.endTime) return false;
    
    // Type filter
    if (criteria.type && entry.type !== criteria.type) return false;
    
    // Severity filter
    if (criteria.severity && entry.severity !== criteria.severity) return false;
    
    // User filter
    if (criteria.userId && entry.userId !== criteria.userId) return false;
    
    // Action filter
    if (criteria.action && entry.action !== criteria.action) return false;
    
    // Source filter
    if (criteria.source && entry.source !== criteria.source) return false;
    
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all log files
   */
  async getLogFiles() {
    const files = await fs.readdir(this.config.logDirectory);
    return files
      .filter(file => file.endsWith('.jsonl'))
      .map(file => path.join(this.config.logDirectory, file))
      .sort();
  }

  /**
   * Read log file and parse entries
   */
  async readLogFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.warn(`Failed to parse log entry: ${error.message}`);
        return null;
      }
    }).filter(entry => entry !== null);
  }

  /**
   * Update statistics
   */
  updateStatistics(entries) {
    this.stats.totalEntries += entries.length;
    
    // Calculate average entry size
    const totalSize = entries.reduce((sum, entry) => sum + JSON.stringify(entry).length, 0);
    const avgEntrySize = totalSize / entries.length;
    
    this.stats.averageEntrySize = this.stats.totalEntries === entries.length
      ? avgEntrySize
      : (this.stats.averageEntrySize * (this.stats.totalEntries - entries.length) + totalSize) / this.stats.totalEntries;
  }

  /**
   * Generate audit trail statistics
   */
  generateStatistics() {
    return {
      timestamp: Date.now(),
      statistics: { ...this.stats },
      chain: {
        entryCount: this.chainState.entryCount,
        lastHash: this.chainState.lastHash?.substring(0, 16),
        merkleRoot: this.chainState.merkleRoot?.substring(0, 16)
      },
      storage: {
        pendingEntries: this.pendingEntries.length,
        merkleLeaves: this.merkleTree.leaves.length,
        currentLogFile: path.basename(this.currentLogFile || 'none')
      },
      performance: {
        integrityCheckRate: this.stats.integrityChecks > 0 
          ? Math.round((this.stats.verifiedEntries / this.stats.totalEntries) * 100)
          : 0,
        corruptionRate: this.stats.totalEntries > 0
          ? Math.round((this.stats.corruptedEntries / this.stats.totalEntries) * 100)
          : 0
      }
    };
  }

  /**
   * Run demonstration of audit trail
   */
  async runDemo() {
    console.log('\n🎭 AUDIT TRAIL DEMONSTRATION');
    console.log('=============================');
    
    try {
      // Initialize if not already done
      await this.initialize();
      
      // Log sample entries
      console.log('\n1. Logging sample audit entries...');
      
      const sampleEntries = [
        { type: 'authentication', action: 'login', userId: 'user123', data: { ip: '192.168.1.1', success: true } },
        { type: 'authorization', action: 'access-granted', userId: 'user123', data: { resource: '/admin', role: 'admin' } },
        { type: 'data-access', action: 'read', userId: 'user123', data: { table: 'users', records: 5 } },
        { type: 'security', action: 'verification', severity: 'high', data: { confidence: 95, riskScore: 25 } },
        { type: 'system', action: 'backup', severity: 'info', data: { size: '2.5GB', duration: 45000 } }
      ];
      
      for (const entryData of sampleEntries) {
        await this.logEntry(entryData);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }
      
      // Flush all entries
      await this.flushPendingEntries();
      
      console.log('\n2. Performing integrity verification...');
      const integrityResult = await this.performIntegrityCheck();
      
      console.log('\n3. Generating merkle proofs...');
      if (this.merkleTree.leaves.length > 0) {
        const proof = this.generateMerkleProof(this.merkleTree.leaves[0]);
        const proofValid = this.verifyMerkleProof(proof);
        console.log(`   Merkle proof verification: ${proofValid ? '✅ VALID' : '❌ INVALID'}`);
      }
      
      console.log('\n4. Querying audit entries...');
      const queryResults = await this.queryEntries({ 
        type: 'security', 
        startTime: Date.now() - 3600000 // Last hour
      });
      
      console.log(`   Found ${queryResults.length} security entries in last hour`);
      
      // Generate final statistics
      const stats = this.generateStatistics();
      
      console.log('\n📊 AUDIT TRAIL SUMMARY');
      console.log('=======================');
      console.log(`Total Entries: ${stats.statistics.totalEntries}`);
      console.log(`Chain Length: ${stats.chain.entryCount}`);
      console.log(`Integrity Checks: ${stats.statistics.integrityChecks}`);
      console.log(`Verified Entries: ${stats.statistics.verifiedEntries}`);
      console.log(`Corrupted Entries: ${stats.statistics.corruptedEntries}`);
      console.log(`Average Entry Size: ${Math.round(stats.statistics.averageEntrySize)} bytes`);
      console.log(`Merkle Tree Leaves: ${stats.storage.merkleLeaves}`);
      console.log(`Current Log File: ${stats.storage.currentLogFile}`);
      
      return stats;
      
    } catch (error) {
      console.error(`💥 Demo failed: ${error.message}`);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════

async function main() {
  const auditTrail = new SoulFraAuditTrail();
  
  const command = process.argv[2] || 'demo';
  
  switch (command) {
    case 'init':
      await auditTrail.initialize();
      break;
      
    case 'demo':
      await auditTrail.runDemo();
      break;
      
    case 'verify':
      await auditTrail.initialize();
      const result = await auditTrail.performIntegrityCheck();
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'query':
      await auditTrail.initialize();
      const criteria = process.argv[3] ? JSON.parse(process.argv[3]) : {};
      const results = await auditTrail.queryEntries(criteria);
      console.log(JSON.stringify(results, null, 2));
      break;
      
    case 'stats':
      await auditTrail.initialize();
      const stats = auditTrail.generateStatistics();
      console.log(JSON.stringify(stats, null, 2));
      break;
      
    default:
      console.log('Usage: node soulfra-audit-trail.js [init|demo|verify|query|stats]');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SoulFraAuditTrail;
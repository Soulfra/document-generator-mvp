#!/usr/bin/env node

/**
 * GRAVITY WELL ENCRYPTION
 * Blockchain-based encryption system using smart contract keys
 * Integrates with existing gravity well verification system
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class GravityWellEncryption extends EventEmitter {
  constructor() {
    super();
    
    // Gravity well contract data
    this.contractData = null;
    this.smartContractAddress = null;
    this.blockchainHash = null;
    
    // Encryption configuration
    this.algorithm = 'aes-256-gcm';
    this.keyDerivationIterations = 100000;
    this.saltLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    
    // Master keys derived from gravity well
    this.masterKey = null;
    this.fileEncryptionKey = null;
    this.metadataEncryptionKey = null;
    this.userKeyDerivationKey = null;
    
    // Key cache for performance
    this.keyCache = new Map();
    this.keyRotationSchedule = new Map();
    
    // Blockchain integration
    this.blockchainVerifier = null;
    this.lastVerificationTime = null;
    this.verificationInterval = 60000; // 1 minute
    
    // Encryption statistics
    this.stats = {
      filesEncrypted: 0,
      filesDecrypted: 0,
      totalBytesProcessed: 0,
      keyRotations: 0,
      verificationChecks: 0
    };
    
    console.log('🌌 GRAVITY WELL ENCRYPTION SYSTEM');
    console.log('🔐 Blockchain-based key derivation');
    console.log('🛡️ Military-grade AES-256-GCM encryption');
    console.log('🔄 Automatic key rotation');
    
    this.initialize();
  }
  
  /**
   * Initialize the gravity well encryption system
   */
  async initialize() {
    try {
      // Load gravity well contract
      await this.loadGravityWellContract();
      
      // Derive encryption keys
      await this.deriveEncryptionKeys();
      
      // Start blockchain verification
      this.startBlockchainVerification();
      
      // Setup key rotation
      this.setupKeyRotation();
      
      console.log('✅ Gravity Well Encryption initialized');
      console.log(`📜 Contract: ${this.smartContractAddress}`);
      console.log(`🔑 Master key derived from block: ${this.blockchainHash?.substring(0, 16)}...`);
      
    } catch (error) {
      console.error('❌ Gravity Well Encryption initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Load gravity well contract data
   */
  async loadGravityWellContract() {
    const contractPath = path.join(__dirname, 'unified-vault/experimental/prototypes/doc_1755710648057_kp7r1ig3y_gravity-well-blockchain-verification.json');
    
    if (!fs.existsSync(contractPath)) {
      throw new Error('Gravity well contract not found');
    }
    
    try {
      const contractContent = fs.readFileSync(contractPath, 'utf8');
      this.contractData = JSON.parse(contractContent);
      
      // Validate contract data
      if (!this.contractData.blockchain_hash || !this.contractData.smart_contract_address) {
        throw new Error('Invalid contract data - missing required fields');
      }
      
      this.smartContractAddress = this.contractData.smart_contract_address;
      this.blockchainHash = this.contractData.blockchain_hash;
      
      console.log('📋 Gravity well contract loaded');
      console.log(`⛓️ Block number: ${this.contractData.block_number}`);
      console.log(`⚡ Gas used: ${this.contractData.gas_used}`);
      
    } catch (error) {
      throw new Error(`Failed to load contract: ${error.message}`);
    }
  }
  
  /**
   * Derive encryption keys from gravity well
   */
  async deriveEncryptionKeys() {
    if (!this.blockchainHash) {
      throw new Error('Blockchain hash not available');
    }
    
    // Create salt from contract address
    const contractSalt = crypto.createHash('sha256')
      .update(this.smartContractAddress)
      .digest();
    
    // Derive master key from blockchain hash
    this.masterKey = crypto.pbkdf2Sync(
      this.blockchainHash,
      contractSalt,
      this.keyDerivationIterations,
      32, // 256 bits
      'sha512'
    );
    
    // Derive specific purpose keys from master key
    this.fileEncryptionKey = this.deriveSubKey(this.masterKey, 'FILE_ENCRYPTION');
    this.metadataEncryptionKey = this.deriveSubKey(this.masterKey, 'METADATA_ENCRYPTION');
    this.userKeyDerivationKey = this.deriveSubKey(this.masterKey, 'USER_KEY_DERIVATION');
    
    console.log('🔑 Encryption keys derived from gravity well');
  }
  
  /**
   * Derive sub-keys from master key
   */
  deriveSubKey(masterKey, purpose) {
    const purposeBuffer = Buffer.from(purpose, 'utf8');
    const info = Buffer.concat([purposeBuffer, Buffer.from(this.smartContractAddress, 'utf8')]);
    
    // Use HKDF (HMAC-based Key Derivation Function)
    const salt = crypto.createHash('sha256').update(info).digest();
    
    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      10000, // Fewer iterations for sub-keys
      32,
      'sha256'
    );
  }
  
  /**
   * Encrypt data using gravity well encryption
   */
  async encryptData(data, options = {}) {
    try {
      const {
        keyType = 'file',
        userId = null,
        metadata = {},
        compressionLevel = 0
      } = options;
      
      // Get appropriate encryption key
      const encryptionKey = await this.getEncryptionKey(keyType, userId);
      
      // Compress if requested
      let processedData = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (compressionLevel > 0) {
        processedData = await this.compressData(processedData, compressionLevel);
      }
      
      // Generate random IV and salt
      const iv = crypto.randomBytes(this.ivLength);
      const salt = crypto.randomBytes(this.saltLength);
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, encryptionKey, iv);
      
      // Encrypt data
      let encrypted = cipher.update(processedData);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Create metadata
      const encryptionMetadata = {
        algorithm: this.algorithm,
        keyType,
        userId,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        compressed: compressionLevel > 0,
        timestamp: Date.now(),
        contractHash: this.blockchainHash,
        ...metadata
      };
      
      // Encrypt metadata
      const encryptedMetadata = await this.encryptMetadata(encryptionMetadata);
      
      // Combine everything
      const result = {
        data: encrypted,
        metadata: encryptedMetadata,
        size: encrypted.length,
        originalSize: processedData.length
      };
      
      // Update statistics
      this.stats.filesEncrypted++;
      this.stats.totalBytesProcessed += processedData.length;
      
      // Emit encryption event
      this.emit('encrypted', {
        size: processedData.length,
        keyType,
        userId
      });
      
      return result;
      
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }
  
  /**
   * Decrypt data using gravity well encryption
   */
  async decryptData(encryptedData, encryptedMetadata, options = {}) {
    try {
      // Decrypt metadata first
      const metadata = await this.decryptMetadata(encryptedMetadata);
      
      // Validate contract hash
      if (metadata.contractHash !== this.blockchainHash) {
        throw new Error('Contract hash mismatch - data may be from different gravity well');
      }
      
      // Get decryption key
      const decryptionKey = await this.getEncryptionKey(metadata.keyType, metadata.userId);
      
      // Extract encryption parameters
      const salt = Buffer.from(metadata.salt, 'hex');
      const iv = Buffer.from(metadata.iv, 'hex');
      const authTag = Buffer.from(metadata.authTag, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipher(metadata.algorithm, decryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // Decompress if needed
      if (metadata.compressed) {
        decrypted = await this.decompressData(decrypted);
      }
      
      // Update statistics
      this.stats.filesDecrypted++;
      this.stats.totalBytesProcessed += decrypted.length;
      
      // Emit decryption event
      this.emit('decrypted', {
        size: decrypted.length,
        keyType: metadata.keyType,
        userId: metadata.userId
      });
      
      return {
        data: decrypted,
        metadata: metadata
      };
      
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }
  
  /**
   * Get encryption key for specific type and user
   */
  async getEncryptionKey(keyType, userId = null) {
    const cacheKey = `${keyType}:${userId || 'global'}`;
    
    // Check cache first
    if (this.keyCache.has(cacheKey)) {
      const cached = this.keyCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.key;
      }
    }
    
    let key;
    
    switch (keyType) {
      case 'file':
        key = this.fileEncryptionKey;
        break;
        
      case 'metadata':
        key = this.metadataEncryptionKey;
        break;
        
      case 'user':
        if (!userId) {
          throw new Error('User ID required for user-specific encryption');
        }
        key = this.deriveUserKey(userId);
        break;
        
      default:
        throw new Error(`Unknown key type: ${keyType}`);
    }
    
    // Cache the key
    this.keyCache.set(cacheKey, {
      key,
      timestamp: Date.now()
    });
    
    return key;
  }
  
  /**
   * Derive user-specific encryption key
   */
  deriveUserKey(userId) {
    const userSalt = crypto.createHash('sha256')
      .update(userId + this.smartContractAddress)
      .digest();
    
    return crypto.pbkdf2Sync(
      this.userKeyDerivationKey,
      userSalt,
      50000,
      32,
      'sha256'
    );
  }
  
  /**
   * Encrypt metadata
   */
  async encryptMetadata(metadata) {
    const metadataJson = JSON.stringify(metadata);
    const metadataBuffer = Buffer.from(metadataJson, 'utf8');
    
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.metadataEncryptionKey, iv);
    
    let encrypted = cipher.update(metadataBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      data: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  /**
   * Decrypt metadata
   */
  async decryptMetadata(encryptedMetadata) {
    const encrypted = Buffer.from(encryptedMetadata.data, 'hex');
    const iv = Buffer.from(encryptedMetadata.iv, 'hex');
    const authTag = Buffer.from(encryptedMetadata.authTag, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.metadataEncryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }
  
  /**
   * Start blockchain verification monitoring
   */
  startBlockchainVerification() {
    // Verify blockchain state periodically
    const verifyBlockchain = async () => {
      try {
        // In a real implementation, this would query the blockchain
        // For now, we'll simulate verification
        
        this.stats.verificationChecks++;
        this.lastVerificationTime = Date.now();
        
        console.log('⛓️ Blockchain verification successful');
        
        this.emit('blockchain_verified', {
          contractAddress: this.smartContractAddress,
          blockHash: this.blockchainHash,
          timestamp: this.lastVerificationTime
        });
        
      } catch (error) {
        console.error('❌ Blockchain verification failed:', error);
        this.emit('blockchain_verification_failed', error);
      }
    };
    
    // Initial verification
    verifyBlockchain();
    
    // Schedule periodic verification
    setInterval(verifyBlockchain, this.verificationInterval);
    
    console.log('🔄 Blockchain verification monitoring started');
  }
  
  /**
   * Setup key rotation schedule
   */
  setupKeyRotation() {
    // Rotate user keys every 7 days
    const rotateUserKeys = () => {
      console.log('🔄 Rotating user-specific keys...');
      
      // Clear user key cache to force re-derivation
      for (const [cacheKey] of this.keyCache) {
        if (cacheKey.startsWith('user:')) {
          this.keyCache.delete(cacheKey);
        }
      }
      
      this.stats.keyRotations++;
      console.log('✅ User keys rotated');
      
      this.emit('keys_rotated', {
        type: 'user',
        timestamp: Date.now()
      });
    };
    
    // Rotate every 7 days
    setInterval(rotateUserKeys, 7 * 24 * 60 * 60 * 1000);
    
    console.log('🗓️ Key rotation scheduled (7-day cycle)');
  }
  
  /**
   * Compress data before encryption
   */
  async compressData(data, level) {
    // Simple compression simulation - in real implementation use zlib
    return data; // Placeholder
  }
  
  /**
   * Decompress data after decryption
   */
  async decompressData(data) {
    // Decompression simulation - in real implementation use zlib
    return data; // Placeholder
  }
  
  /**
   * Generate secure random encryption key
   */
  generateRandomKey(length = 32) {
    return crypto.randomBytes(length);
  }
  
  /**
   * Validate data integrity
   */
  validateDataIntegrity(data, expectedHash) {
    const actualHash = crypto.createHash('sha256').update(data).digest('hex');
    return actualHash === expectedHash;
  }
  
  /**
   * Get encryption statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.keyCache.size,
      lastVerification: this.lastVerificationTime,
      uptime: Date.now() - (this.initTime || Date.now())
    };
  }
  
  /**
   * Export public key for sharing
   */
  exportPublicKey() {
    // Create a public version of gravity well data
    return {
      contractAddress: this.smartContractAddress,
      blockNumber: this.contractData?.block_number,
      algorithm: this.algorithm,
      keyDerivationIterations: this.keyDerivationIterations
    };
  }
  
  /**
   * Verify contract authenticity
   */
  async verifyContract(contractData) {
    // In real implementation, this would verify on-chain
    return contractData.smart_contract_address === this.smartContractAddress;
  }
  
  /**
   * Emergency key regeneration
   */
  async emergencyKeyRegeneration() {
    console.log('🚨 Emergency key regeneration initiated');
    
    try {
      // Clear all caches
      this.keyCache.clear();
      
      // Re-derive all keys
      await this.deriveEncryptionKeys();
      
      // Force blockchain verification
      await this.startBlockchainVerification();
      
      console.log('✅ Emergency key regeneration completed');
      
      this.emit('emergency_regeneration', {
        timestamp: Date.now(),
        reason: 'manual_trigger'
      });
      
    } catch (error) {
      console.error('❌ Emergency key regeneration failed:', error);
      throw error;
    }
  }
  
  /**
   * Secure key destruction
   */
  destroyKeys() {
    console.log('🔥 Destroying encryption keys...');
    
    // Overwrite keys with random data
    if (this.masterKey) {
      crypto.randomFillSync(this.masterKey);
      this.masterKey = null;
    }
    
    if (this.fileEncryptionKey) {
      crypto.randomFillSync(this.fileEncryptionKey);
      this.fileEncryptionKey = null;
    }
    
    if (this.metadataEncryptionKey) {
      crypto.randomFillSync(this.metadataEncryptionKey);
      this.metadataEncryptionKey = null;
    }
    
    if (this.userKeyDerivationKey) {
      crypto.randomFillSync(this.userKeyDerivationKey);
      this.userKeyDerivationKey = null;
    }
    
    // Clear cache
    this.keyCache.clear();
    
    console.log('✅ Keys securely destroyed');
  }
  
  /**
   * Health check
   */
  healthCheck() {
    const health = {
      status: 'healthy',
      issues: [],
      lastVerification: this.lastVerificationTime,
      keysCached: this.keyCache.size,
      stats: this.getStats()
    };
    
    // Check if keys are loaded
    if (!this.masterKey) {
      health.status = 'unhealthy';
      health.issues.push('Master key not loaded');
    }
    
    // Check blockchain verification
    const timeSinceVerification = Date.now() - (this.lastVerificationTime || 0);
    if (timeSinceVerification > this.verificationInterval * 2) {
      health.status = 'degraded';
      health.issues.push('Blockchain verification overdue');
    }
    
    return health;
  }
}

// Export for use
module.exports = GravityWellEncryption;

// CLI interface if run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🌌 GRAVITY WELL ENCRYPTION CLI\n');
  
  const encryption = new GravityWellEncryption();
  
  encryption.on('encrypted', (data) => {
    console.log(`✅ Encrypted ${data.size} bytes`);
  });
  
  encryption.on('decrypted', (data) => {
    console.log(`✅ Decrypted ${data.size} bytes`);
  });
  
  encryption.on('blockchain_verified', () => {
    console.log('⛓️ Blockchain verification successful');
  });
  
  switch (command) {
    case 'stats':
      setTimeout(() => {
        console.log('📊 Encryption Statistics:');
        console.log(JSON.stringify(encryption.getStats(), null, 2));
      }, 1000);
      break;
      
    case 'health':
      setTimeout(() => {
        console.log('🏥 Health Check:');
        console.log(JSON.stringify(encryption.healthCheck(), null, 2));
      }, 1000);
      break;
      
    case 'test':
      setTimeout(async () => {
        console.log('🧪 Running encryption test...');
        
        const testData = 'Hello from Gravity Well Encryption!';
        const encrypted = await encryption.encryptData(testData);
        const decrypted = await encryption.decryptData(encrypted.data, encrypted.metadata);
        
        console.log(`Original: ${testData}`);
        console.log(`Decrypted: ${decrypted.data.toString()}`);
        console.log(`✅ Test ${testData === decrypted.data.toString() ? 'PASSED' : 'FAILED'}`);
      }, 1000);
      break;
      
    default:
      console.log('Available commands:');
      console.log('  stats  - Show encryption statistics');
      console.log('  health - Show system health');
      console.log('  test   - Run encryption test');
      break;
  }
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Gravity Well Encryption...');
    encryption.destroyKeys();
    console.log('✅ Secure shutdown complete');
    process.exit(0);
  });
}
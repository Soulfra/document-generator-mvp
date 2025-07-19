/**
 * CryptoDeviceIdentity - Cryptographic device fingerprinting and UUID management
 * 
 * Creates secure, unique identities for sovereign agents based on:
 * - Device fingerprints (hardware + environment)
 * - Cryptographic hashes
 * - UUID namespacing
 * - Blockchain-ready architecture
 */

const crypto = require('crypto');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class CryptoDeviceIdentity {
  constructor(config = {}) {
    this.cryptoSecret = config.cryptoSecret || process.env.AGENT_CRYPTO_SECRET || 'default-crypto-secret';
    this.fingerprintSalt = config.fingerprintSalt || process.env.AGENT_DEVICE_FINGERPRINT_SALT || 'default-salt';
    this.uuidNamespace = config.uuidNamespace || process.env.AGENT_UUID_NAMESPACE || 'sovereign-agents';
    this.deviceDataPath = config.deviceDataPath || '/app/data/device-identity.json';
    
    this.deviceFingerprint = null;
    this.deviceIdentity = null;
  }

  /**
   * Generate device fingerprint based on system characteristics
   */
  async generateDeviceFingerprint() {
    try {
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalmem: os.totalmem(),
        networkInterfaces: Object.keys(os.networkInterfaces()),
        userInfo: os.userInfo(),
        release: os.release(),
        version: os.version()
      };

      // Add container-specific identifiers
      const containerInfo = await this.getContainerInfo();
      
      // Create deterministic fingerprint
      const fingerprintData = JSON.stringify({
        ...systemInfo,
        ...containerInfo,
        salt: this.fingerprintSalt
      });

      this.deviceFingerprint = crypto
        .createHash('sha256')
        .update(fingerprintData)
        .digest('hex');

      return this.deviceFingerprint;
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
      // Fallback to basic fingerprint
      return crypto
        .createHash('sha256')
        .update(`${os.hostname()}-${os.platform()}-${this.fingerprintSalt}`)
        .digest('hex');
    }
  }

  /**
   * Get container-specific information
   */
  async getContainerInfo() {
    const containerInfo = {};
    
    try {
      // Check if running in Docker
      const cgroupData = await fs.readFile('/proc/1/cgroup', 'utf8').catch(() => '');
      containerInfo.isDocker = cgroupData.includes('docker');
      
      // Get container ID if available
      if (containerInfo.isDocker) {
        const dockerId = cgroupData.match(/docker\/([a-f0-9]+)/)?.[1];
        if (dockerId) {
          containerInfo.containerId = dockerId.substring(0, 12);
        }
      }
      
      // Check for Kubernetes
      containerInfo.isKubernetes = await fs.access('/var/run/secrets/kubernetes.io').then(() => true).catch(() => false);
      
    } catch (error) {
      // Running outside container
      containerInfo.isDocker = false;
      containerInfo.isKubernetes = false;
    }
    
    return containerInfo;
  }

  /**
   * Generate cryptographic UUID for agent
   */
  generateAgentUUID(agentName, additionalData = {}) {
    const uuidData = {
      namespace: this.uuidNamespace,
      deviceFingerprint: this.deviceFingerprint,
      agentName,
      timestamp: Date.now(),
      ...additionalData
    };

    const uuidString = JSON.stringify(uuidData);
    const hash = crypto
      .createHmac('sha256', this.cryptoSecret)
      .update(uuidString)
      .digest('hex');

    // Format as UUID v4 (with dashes)
    const uuid = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      hash.substring(12, 16),
      hash.substring(16, 20),
      hash.substring(20, 32)
    ].join('-');

    return uuid;
  }

  /**
   * Create secure agent identity with blockchain-ready features
   */
  async createAgentIdentity(agentName, agentConfig = {}) {
    await this.generateDeviceFingerprint();
    
    const identity = {
      agentUUID: this.generateAgentUUID(agentName, agentConfig),
      agentName,
      deviceFingerprint: this.deviceFingerprint,
      createdAt: new Date().toISOString(),
      
      // Cryptographic proof
      cryptographicProof: {
        deviceHash: this.deviceFingerprint,
        agentHash: crypto.createHash('sha256').update(agentName).digest('hex'),
        configHash: crypto.createHash('sha256').update(JSON.stringify(agentConfig)).digest('hex'),
        signature: this.signIdentity(agentName, agentConfig)
      },
      
      // Blockchain-ready fields
      blockchainReadiness: {
        publicKey: this.generatePublicKey(agentName),
        address: this.generateBlockchainAddress(agentName),
        nonce: 0,
        consensusWeight: agentConfig.autonomyLevel || 5
      },
      
      // Decentralized features
      decentralizedFeatures: {
        canParticipateInConsensus: process.env.ENABLE_DECENTRALIZED_CONSENSUS === 'true',
        trustLevel: agentConfig.autonomyLevel || 5,
        networkRole: agentConfig.networkRole || 'participant'
      }
    };

    this.deviceIdentity = identity;
    await this.saveDeviceIdentity();
    
    return identity;
  }

  /**
   * Generate cryptographic signature for identity verification
   */
  signIdentity(agentName, agentConfig) {
    const signatureData = {
      agentName,
      deviceFingerprint: this.deviceFingerprint,
      configHash: crypto.createHash('sha256').update(JSON.stringify(agentConfig)).digest('hex'),
      timestamp: Date.now()
    };

    return crypto
      .createHmac('sha256', this.cryptoSecret)
      .update(JSON.stringify(signatureData))
      .digest('hex');
  }

  /**
   * Generate public key for blockchain operations
   */
  generatePublicKey(agentName) {
    const keyMaterial = `${this.deviceFingerprint}-${agentName}-${this.cryptoSecret}`;
    return crypto
      .createHash('sha256')
      .update(keyMaterial)
      .digest('hex');
  }

  /**
   * Generate blockchain address
   */
  generateBlockchainAddress(agentName) {
    const publicKey = this.generatePublicKey(agentName);
    const address = crypto
      .createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .substring(0, 40); // 40 character address
    
    return `0x${address}`;
  }

  /**
   * Verify agent identity
   */
  async verifyAgentIdentity(identity) {
    try {
      // Verify signature
      const expectedSignature = this.signIdentity(identity.agentName, {});
      const signatureValid = crypto.timingSafeEqual(
        Buffer.from(identity.cryptographicProof.signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      // Verify device fingerprint matches
      await this.generateDeviceFingerprint();
      const deviceValid = this.deviceFingerprint === identity.deviceFingerprint;

      return {
        valid: signatureValid && deviceValid,
        signatureValid,
        deviceValid,
        verificationTime: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        verificationTime: new Date().toISOString()
      };
    }
  }

  /**
   * Save device identity to persistent storage
   */
  async saveDeviceIdentity() {
    try {
      const dataDir = path.dirname(this.deviceDataPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(
        this.deviceDataPath, 
        JSON.stringify(this.deviceIdentity, null, 2)
      );
    } catch (error) {
      console.error('Error saving device identity:', error);
    }
  }

  /**
   * Load existing device identity
   */
  async loadDeviceIdentity() {
    try {
      const data = await fs.readFile(this.deviceDataPath, 'utf8');
      this.deviceIdentity = JSON.parse(data);
      return this.deviceIdentity;
    } catch (error) {
      // No existing identity
      return null;
    }
  }

  /**
   * Generate multiple agent identities for a sovereign agent system
   */
  async generateSovereignAgentIdentities(agentConfigs) {
    const identities = {};
    
    for (const [agentName, config] of Object.entries(agentConfigs)) {
      identities[agentName] = await this.createAgentIdentity(agentName, config);
    }
    
    return identities;
  }
}

module.exports = CryptoDeviceIdentity;
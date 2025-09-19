#!/usr/bin/env node

/**
 * Keyring Manager - RuneScape-style key management
 * Manages API keys like thieving keyrings - multiple sets for different "doors"
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

class KeyringManager {
  constructor() {
    this.keyrings = new Map();
    this.masterKey = null;
    this.configPath = path.join(__dirname, '.keyrings');
  }

  async initialize() {
    // Load environment variables
    dotenv.config();
    
    // Create secure storage directory
    await fs.mkdir(this.configPath, { recursive: true });
    
    // Initialize master key
    await this.initializeMasterKey();
    
    // Load existing keyrings
    await this.loadKeyrings();
  }

  async initializeMasterKey() {
    const masterKeyPath = path.join(this.configPath, '.master');
    
    try {
      const keyData = await fs.readFile(masterKeyPath, 'utf8');
      this.masterKey = Buffer.from(keyData, 'base64');
    } catch (error) {
      // Generate new master key
      this.masterKey = crypto.randomBytes(32);
      await fs.writeFile(masterKeyPath, this.masterKey.toString('base64'));
      console.log('Generated new master key');
    }
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.masterKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.masterKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async loadKeyrings() {
    try {
      const files = await fs.readdir(this.configPath);
      
      for (const file of files) {
        if (file.endsWith('.keyring')) {
          const name = file.replace('.keyring', '');
          const data = await fs.readFile(path.join(this.configPath, file), 'utf8');
          const keyring = JSON.parse(data);
          
          // Decrypt keys
          for (const key of keyring.keys) {
            if (key.encrypted) {
              key.value = this.decrypt(key.value);
            }
          }
          
          this.keyrings.set(name, keyring);
        }
      }
    } catch (error) {
      console.error('Error loading keyrings:', error);
    }
  }

  async saveKeyring(name, keyring) {
    // Encrypt sensitive data before saving
    const toSave = JSON.parse(JSON.stringify(keyring));
    
    for (const key of toSave.keys) {
      if (!key.encrypted && key.value) {
        key.value = this.encrypt(key.value);
        key.encrypted = true;
      }
    }
    
    const filePath = path.join(this.configPath, `${name}.keyring`);
    await fs.writeFile(filePath, JSON.stringify(toSave, null, 2));
  }

  async createKeyring(name, description) {
    const keyring = {
      name,
      description,
      created: new Date().toISOString(),
      keys: [],
      stats: {
        uses: 0,
        failures: 0,
        lastUsed: null
      }
    };
    
    this.keyrings.set(name, keyring);
    await this.saveKeyring(name, keyring);
    
    return keyring;
  }

  async addKey(keyringName, keyData) {
    const keyring = this.keyrings.get(keyringName);
    if (!keyring) {
      throw new Error(`Keyring ${keyringName} not found`);
    }
    
    const key = {
      id: crypto.randomBytes(8).toString('hex'),
      provider: keyData.provider,
      endpoint: keyData.endpoint,
      value: keyData.value,
      rateLimit: keyData.rateLimit || 100,
      created: new Date().toISOString(),
      stats: {
        uses: 0,
        failures: 0,
        lastUsed: null
      }
    };
    
    keyring.keys.push(key);
    await this.saveKeyring(keyringName, keyring);
    
    return key;
  }

  async rotateKey(keyringName, keyId) {
    const keyring = this.keyrings.get(keyringName);
    if (!keyring) {
      throw new Error(`Keyring ${keyringName} not found`);
    }
    
    const keyIndex = keyring.keys.findIndex(k => k.id === keyId);
    if (keyIndex === -1) {
      throw new Error(`Key ${keyId} not found`);
    }
    
    // Move to end of array (rotation)
    const key = keyring.keys.splice(keyIndex, 1)[0];
    keyring.keys.push(key);
    
    await this.saveKeyring(keyringName, keyring);
  }

  getNextKey(keyringName) {
    const keyring = this.keyrings.get(keyringName);
    if (!keyring || keyring.keys.length === 0) {
      return null;
    }
    
    // Find the least recently used key
    let bestKey = keyring.keys[0];
    let oldestTime = bestKey.stats.lastUsed || '1970-01-01';
    
    for (const key of keyring.keys) {
      const keyTime = key.stats.lastUsed || '1970-01-01';
      if (keyTime < oldestTime) {
        oldestTime = keyTime;
        bestKey = key;
      }
    }
    
    // Update usage stats
    bestKey.stats.uses++;
    bestKey.stats.lastUsed = new Date().toISOString();
    keyring.stats.uses++;
    keyring.stats.lastUsed = new Date().toISOString();
    
    // Save updated stats (async, don't wait)
    this.saveKeyring(keyringName, keyring).catch(console.error);
    
    return bestKey;
  }

  async importFromEnv() {
    // Import API keys from environment variables
    const patterns = [
      { regex: /^OPENAI_API_KEY/, provider: 'openai', keyring: 'bronze' },
      { regex: /^ANTHROPIC_API_KEY/, provider: 'anthropic', keyring: 'bronze' },
      { regex: /^AZURE_.*_KEY/, provider: 'azure', keyring: 'iron' },
      { regex: /^GOOGLE_.*_KEY/, provider: 'google', keyring: 'iron' },
      { regex: /^AWS_.*_KEY/, provider: 'aws', keyring: 'steel' },
      { regex: /^CUSTOM_.*_KEY/, provider: 'custom', keyring: 'mithril' }
    ];
    
    for (const [envKey, envValue] of Object.entries(process.env)) {
      for (const pattern of patterns) {
        if (pattern.regex.test(envKey) && envValue) {
          // Create keyring if it doesn't exist
          if (!this.keyrings.has(pattern.keyring)) {
            await this.createKeyring(pattern.keyring, `Auto-imported ${pattern.keyring} tier keys`);
          }
          
          // Add key to keyring
          await this.addKey(pattern.keyring, {
            provider: pattern.provider,
            endpoint: process.env[envKey.replace('_KEY', '_ENDPOINT')] || 'default',
            value: envValue,
            rateLimit: parseInt(process.env[envKey.replace('_KEY', '_RATE_LIMIT')] || '100')
          });
          
          console.log(`Imported ${envKey} to ${pattern.keyring} keyring`);
        }
      }
    }
  }

  async exportToEnv(keyringName) {
    const keyring = this.keyrings.get(keyringName);
    if (!keyring) {
      throw new Error(`Keyring ${keyringName} not found`);
    }
    
    const envVars = [];
    
    for (let i = 0; i < keyring.keys.length; i++) {
      const key = keyring.keys[i];
      const prefix = `${keyring.name.toUpperCase()}_${key.provider.toUpperCase()}_${i + 1}`;
      
      envVars.push(`${prefix}_KEY=${key.value}`);
      envVars.push(`${prefix}_ENDPOINT=${key.endpoint}`);
      envVars.push(`${prefix}_RATE_LIMIT=${key.rateLimit}`);
    }
    
    return envVars.join('\n');
  }

  getStats() {
    const stats = {
      keyrings: {},
      totalKeys: 0,
      totalUses: 0
    };
    
    for (const [name, keyring] of this.keyrings) {
      stats.keyrings[name] = {
        keys: keyring.keys.length,
        uses: keyring.stats.uses,
        failures: keyring.stats.failures,
        lastUsed: keyring.stats.lastUsed
      };
      
      stats.totalKeys += keyring.keys.length;
      stats.totalUses += keyring.stats.uses;
    }
    
    return stats;
  }
}

// CLI Interface
async function main() {
  const manager = new KeyringManager();
  await manager.initialize();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'import':
      await manager.importFromEnv();
      console.log('Import complete');
      break;
      
    case 'create':
      if (args.length < 3) {
        console.error('Usage: keyring-manager create <name> <description>');
        process.exit(1);
      }
      await manager.createKeyring(args[1], args[2]);
      console.log(`Created keyring: ${args[1]}`);
      break;
      
    case 'add':
      if (args.length < 5) {
        console.error('Usage: keyring-manager add <keyring> <provider> <endpoint> <key>');
        process.exit(1);
      }
      await manager.addKey(args[1], {
        provider: args[2],
        endpoint: args[3],
        value: args[4]
      });
      console.log('Key added successfully');
      break;
      
    case 'export':
      if (args.length < 2) {
        console.error('Usage: keyring-manager export <keyring>');
        process.exit(1);
      }
      const envVars = await manager.exportToEnv(args[1]);
      console.log(envVars);
      break;
      
    case 'stats':
      const stats = manager.getStats();
      console.log(JSON.stringify(stats, null, 2));
      break;
      
    default:
      console.log('Commands:');
      console.log('  import - Import keys from environment variables');
      console.log('  create <name> <description> - Create a new keyring');
      console.log('  add <keyring> <provider> <endpoint> <key> - Add a key to a keyring');
      console.log('  export <keyring> - Export keyring as environment variables');
      console.log('  stats - Show keyring statistics');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = KeyringManager;
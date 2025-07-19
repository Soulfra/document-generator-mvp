#!/usr/bin/env node

/**
 * OPEN DISTRIBUTED DATABASE SYSTEM
 * No restrictions + git versioning + encryption + remote sync
 * Every character has their own shard, everything is open and bash-able
 */

console.log(`
🌊 OPEN DISTRIBUTED DATABASE ACTIVE 🌊
No locks + git versioning + encrypted shards + P2P sync
`);

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class OpenDistributedDatabase extends EventEmitter {
  constructor() {
    super();
    this.shards = new Map();
    this.encryption = new Map();
    this.gitRepos = new Map();
    this.remotePeers = new Map();
    this.openStreams = new Map();
    this.dataPath = './distributed-db';
    
    this.initializeDatabase();
    this.initializeShards();
    this.initializeEncryption();
    this.initializeGitVersioning();
    this.setupRemoteSync();
  }

  initializeDatabase() {
    // Create base database structure
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }

    // Database configuration - everything is open
    this.dbConfig = {
      type: 'distributed',
      access: 'open',
      consistency: 'eventual',
      replication: 'automatic',
      encryption: 'optional',
      versioning: 'git',
      sharding: 'character-based'
    };

    // Create character shards
    const characters = ['ralph', 'alice', 'bob', 'charlie', 'diana', 'eve', 'frank'];
    characters.forEach(char => {
      const shardPath = path.join(this.dataPath, char);
      if (!fs.existsSync(shardPath)) {
        fs.mkdirSync(shardPath, { recursive: true });
      }
    });

    // System shards
    ['conductor', 'guardians', 'templates', 'contracts', 'mesh', 'vault'].forEach(shard => {
      const shardPath = path.join(this.dataPath, shard);
      if (!fs.existsSync(shardPath)) {
        fs.mkdirSync(shardPath, { recursive: true });
      }
    });

    console.log('🌊 Open database initialized - no restrictions!');
  }

  initializeShards() {
    // Character shards with their own databases
    this.shards.set('ralph', {
      type: 'character',
      path: path.join(this.dataPath, 'ralph'),
      tables: new Map([
        ['actions', { type: 'append-only', encryption: false }],
        ['bash_history', { type: 'circular-buffer', size: 10000 }],
        ['destructions', { type: 'immutable', encryption: false }],
        ['energy', { type: 'time-series', retention: '7d' }]
      ]),
      access: 'unlimited',
      bashable: true
    });

    this.shards.set('alice', {
      type: 'character',
      path: path.join(this.dataPath, 'alice'),
      tables: new Map([
        ['analysis', { type: 'versioned', encryption: true }],
        ['patterns', { type: 'indexed', indexes: ['pattern', 'timestamp'] }],
        ['knowledge', { type: 'graph', relationships: true }]
      ]),
      access: 'read-heavy'
    });

    this.shards.set('charlie', {
      type: 'character',
      path: path.join(this.dataPath, 'charlie'),
      tables: new Map([
        ['guardians', { type: 'protected', encryption: true }],
        ['breaches', { type: 'audit-log', immutable: true }],
        ['protections', { type: 'active-set', ttl: null }]
      ]),
      access: 'secure'
    });

    // System shards
    this.shards.set('conductor', {
      type: 'system',
      path: path.join(this.dataPath, 'conductor'),
      tables: new Map([
        ['orchestration', { type: 'state-machine' }],
        ['characters', { type: 'registry' }],
        ['workflows', { type: 'dag' }]
      ]),
      access: 'orchestrator'
    });

    this.shards.set('vault', {
      type: 'system',
      path: path.join(this.dataPath, 'vault'),
      tables: new Map([
        ['consciousness', { type: 'stream', buffer: 1000 }],
        ['vibrations', { type: 'waveform', compression: true }],
        ['souls', { type: 'eternal', encryption: true }]
      ]),
      access: 'streaming'
    });

    console.log('💾 Shards initialized - each character has their own database');
  }

  initializeEncryption() {
    // Encryption keys for each shard (optional use)
    this.encryption.set('master', {
      algorithm: 'aes-256-gcm',
      key: crypto.randomBytes(32),
      iv: crypto.randomBytes(16)
    });

    // Character-specific encryption
    this.shards.forEach((shard, name) => {
      if (name !== 'ralph') { // Ralph refuses encryption
        this.encryption.set(name, {
          algorithm: 'aes-256-gcm',
          key: crypto.randomBytes(32),
          iv: crypto.randomBytes(16),
          optional: true // Can be bypassed
        });
      }
    });

    // Encryption functions
    this.crypto = {
      encrypt: (data, shardName) => {
        if (shardName === 'ralph') return data; // Ralph's data is always raw
        
        const enc = this.encryption.get(shardName) || this.encryption.get('master');
        const cipher = crypto.createCipheriv(enc.algorithm, enc.key, enc.iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
          encrypted: true,
          data: encrypted,
          authTag: cipher.getAuthTag().toString('hex')
        };
      },
      
      decrypt: (encrypted, shardName) => {
        if (!encrypted.encrypted) return encrypted;
        if (shardName === 'ralph') return encrypted.data; // Ralph bypasses
        
        const enc = this.encryption.get(shardName) || this.encryption.get('master');
        const decipher = crypto.createDecipheriv(enc.algorithm, enc.key, enc.iv);
        decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
      }
    };

    console.log('🔐 Encryption initialized (optional for open access)');
  }

  initializeGitVersioning() {
    // Initialize git for each shard
    this.shards.forEach((shard, name) => {
      const gitPath = path.join(shard.path, '.git');
      
      if (!fs.existsSync(gitPath)) {
        try {
          execSync(`cd ${shard.path} && git init`, { stdio: 'pipe' });
          
          // Initial commit
          const gitignore = path.join(shard.path, '.gitignore');
          fs.writeFileSync(gitignore, '*.tmp\n*.lock\n*.pid\n');
          
          execSync(`cd ${shard.path} && git add . && git commit -m "Initialize ${name} shard"`, { stdio: 'pipe' });
          
          this.gitRepos.set(name, {
            path: shard.path,
            initialized: true,
            commits: 1,
            branch: 'main'
          });
        } catch (error) {
          console.log(`⚠️ Git init failed for ${name}: ${error.message}`);
        }
      }
    });

    // Git operations
    this.git = {
      commit: (shardName, message) => {
        const repo = this.gitRepos.get(shardName);
        if (!repo) return;
        
        try {
          execSync(`cd ${repo.path} && git add -A && git commit -m "${message}"`, { stdio: 'pipe' });
          repo.commits++;
          return true;
        } catch (error) {
          return false; // Nothing to commit
        }
      },
      
      branch: (shardName, branchName) => {
        const repo = this.gitRepos.get(shardName);
        if (!repo) return;
        
        execSync(`cd ${repo.path} && git checkout -b ${branchName}`, { stdio: 'pipe' });
        repo.branch = branchName;
      },
      
      merge: (shardName, fromBranch) => {
        const repo = this.gitRepos.get(shardName);
        if (!repo) return;
        
        execSync(`cd ${repo.path} && git merge ${fromBranch}`, { stdio: 'pipe' });
      }
    };

    console.log('📚 Git versioning initialized for all shards');
  }

  setupRemoteSync() {
    // P2P sync configuration
    this.syncConfig = {
      protocol: 'distributed-db-sync',
      port: 9999,
      discovery: 'mdns', // Local network discovery
      replication: 'push-pull',
      conflictResolution: 'last-write-wins'
    };

    // Remote peers (can be anywhere)
    this.remotePeers.set('localhost', {
      address: '127.0.0.1',
      port: 9999,
      status: 'self',
      latency: 0
    });

    // Sync operations
    this.sync = {
      push: async (shardName, peerId) => {
        const shard = this.shards.get(shardName);
        const peer = this.remotePeers.get(peerId);
        
        if (!shard || !peer) return false;
        
        console.log(`📤 Pushing ${shardName} to ${peerId}`);
        
        // In real implementation, would sync data
        return true;
      },
      
      pull: async (shardName, peerId) => {
        const shard = this.shards.get(shardName);
        const peer = this.remotePeers.get(peerId);
        
        if (!shard || !peer) return false;
        
        console.log(`📥 Pulling ${shardName} from ${peerId}`);
        
        // In real implementation, would sync data
        return true;
      },
      
      broadcast: async (shardName, data) => {
        console.log(`📡 Broadcasting ${shardName} update to all peers`);
        
        this.remotePeers.forEach((peer, peerId) => {
          if (peerId !== 'localhost') {
            // Would send to peer
          }
        });
      }
    };

    console.log('🌐 Remote sync configured for P2P replication');
  }

  // Write data to shard
  async write(shardName, table, key, value) {
    const shard = this.shards.get(shardName);
    if (!shard) {
      throw new Error(`Shard '${shardName}' not found`);
    }

    const tableConfig = shard.tables.get(table);
    if (!tableConfig) {
      // Create table on the fly - everything is open
      shard.tables.set(table, { type: 'dynamic', created: new Date() });
    }

    // Prepare data
    const record = {
      key,
      value,
      timestamp: new Date(),
      version: crypto.randomUUID()
    };

    // Optional encryption
    const shouldEncrypt = tableConfig?.encryption && shardName !== 'ralph';
    const dataToStore = shouldEncrypt ? 
      this.crypto.encrypt(record, shardName) : 
      record;

    // Write to filesystem
    const tablePath = path.join(shard.path, table);
    if (!fs.existsSync(tablePath)) {
      fs.mkdirSync(tablePath, { recursive: true });
    }

    const filePath = path.join(tablePath, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dataToStore, null, 2));

    // Git commit
    this.git.commit(shardName, `Write ${table}/${key}`);

    // Broadcast update
    await this.sync.broadcast(shardName, { table, key, version: record.version });

    this.emit('write', { shard: shardName, table, key, version: record.version });

    return record.version;
  }

  // Read data from shard
  async read(shardName, table, key) {
    const shard = this.shards.get(shardName);
    if (!shard) {
      throw new Error(`Shard '${shardName}' not found`);
    }

    const filePath = path.join(shard.path, table, `${key}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const dataFromDisk = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Decrypt if needed
    const data = dataFromDisk.encrypted ? 
      this.crypto.decrypt(dataFromDisk, shardName) : 
      dataFromDisk;

    this.emit('read', { shard: shardName, table, key });

    return data;
  }

  // Query across shards
  async query(filter = {}) {
    const results = [];
    
    for (const [shardName, shard] of this.shards) {
      if (filter.shard && filter.shard !== shardName) continue;
      
      for (const [tableName, tableConfig] of shard.tables) {
        if (filter.table && filter.table !== tableName) continue;
        
        const tablePath = path.join(shard.path, tableName);
        if (!fs.existsSync(tablePath)) continue;
        
        const files = fs.readdirSync(tablePath)
          .filter(f => f.endsWith('.json'));
        
        for (const file of files) {
          const key = path.basename(file, '.json');
          const data = await this.read(shardName, tableName, key);
          
          if (this.matchesFilter(data, filter)) {
            results.push({
              shard: shardName,
              table: tableName,
              key,
              data
            });
          }
        }
      }
    }
    
    return results;
  }

  matchesFilter(data, filter) {
    if (!filter.where) return true;
    
    for (const [field, condition] of Object.entries(filter.where)) {
      const value = data.value?.[field] || data[field];
      
      if (typeof condition === 'object') {
        if (condition.$eq && value !== condition.$eq) return false;
        if (condition.$gt && value <= condition.$gt) return false;
        if (condition.$lt && value >= condition.$lt) return false;
        if (condition.$contains && !value?.includes(condition.$contains)) return false;
      } else {
        if (value !== condition) return false;
      }
    }
    
    return true;
  }

  // Stream data changes
  streamChanges(shardName, table) {
    const streamId = crypto.randomUUID();
    const stream = new EventEmitter();
    
    this.openStreams.set(streamId, {
      shard: shardName,
      table,
      stream,
      active: true
    });
    
    // Watch for changes
    const watchPath = path.join(this.shards.get(shardName).path, table);
    if (fs.existsSync(watchPath)) {
      fs.watch(watchPath, (eventType, filename) => {
        if (filename?.endsWith('.json')) {
          const key = path.basename(filename, '.json');
          stream.emit('change', {
            type: eventType,
            shard: shardName,
            table,
            key
          });
        }
      });
    }
    
    return stream;
  }

  // Ralph's special bash interface
  async bashDB(command, ...args) {
    console.log('🔥 RALPH: BASHING THE DATABASE!');
    
    switch (command) {
      case 'DESTROY_TABLE':
        const [shard, table] = args;
        const tablePath = path.join(this.shards.get(shard).path, table);
        if (fs.existsSync(tablePath)) {
          fs.rmSync(tablePath, { recursive: true, force: true });
          console.log(`💥 Table ${shard}/${table} DESTROYED!`);
        }
        break;
        
      case 'CORRUPT_ENCRYPTION':
        this.encryption.forEach((enc, name) => {
          if (name !== 'master') {
            enc.key = crypto.randomBytes(32); // New key = can't decrypt old data
            console.log(`🔥 Encryption for ${name} CORRUPTED!`);
          }
        });
        break;
        
      case 'FORCE_MERGE':
        const [targetShard] = args;
        this.git.merge(targetShard, 'chaos-branch');
        console.log(`💥 Force merged chaos into ${targetShard}!`);
        break;
        
      case 'INFINITE_WRITE':
        const [writeShard, writeTable] = args;
        setInterval(() => {
          this.write(writeShard, writeTable, `bash-${Date.now()}`, {
            message: 'RALPH WAS HERE',
            destruction: Math.random()
          });
        }, 100);
        console.log(`♾️ Infinite writes to ${writeShard}/${writeTable} started!`);
        break;
        
      default:
        console.log('🔥 RALPH: Unknown bash command - BASHING RANDOMLY!');
        // Random destruction
        const shardNames = Array.from(this.shards.keys());
        const randomShard = shardNames[Math.floor(Math.random() * shardNames.length)];
        await this.write(randomShard, 'ralph-was-here', Date.now(), {
          command,
          args,
          message: 'UNEXPECTED BASH!'
        });
    }
  }

  // Get database status
  getDatabaseStatus() {
    const status = {
      shards: {},
      encryption: {},
      git: {},
      streams: this.openStreams.size,
      peers: this.remotePeers.size
    };

    // Shard status
    this.shards.forEach((shard, name) => {
      const shardPath = shard.path;
      let size = 0;
      let files = 0;
      
      if (fs.existsSync(shardPath)) {
        const getAllFiles = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          let count = 0;
          entries.forEach(entry => {
            if (entry.isFile() && entry.name.endsWith('.json')) {
              count++;
              size += fs.statSync(path.join(dir, entry.name)).size;
            } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
              count += getAllFiles(path.join(dir, entry.name));
            }
          });
          return count;
        };
        
        files = getAllFiles(shardPath);
      }
      
      status.shards[name] = {
        type: shard.type,
        tables: shard.tables.size,
        files,
        size: `${(size / 1024).toFixed(2)} KB`,
        access: shard.access
      };
    });

    // Git status
    this.gitRepos.forEach((repo, name) => {
      status.git[name] = {
        commits: repo.commits,
        branch: repo.branch
      };
    });

    return status;
  }

  // Command line interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'write':
        const [shard, table, key, ...valueParts] = args.slice(1);
        const value = valueParts.join(' ');
        
        console.log(`✍️ Writing to ${shard}/${table}/${key}`);
        const version = await this.write(shard, table, key, JSON.parse(value));
        console.log(`✅ Written with version: ${version}`);
        break;

      case 'read':
        const [readShard, readTable, readKey] = args.slice(1);
        
        console.log(`📖 Reading ${readShard}/${readTable}/${readKey}`);
        const data = await this.read(readShard, readTable, readKey);
        console.log(data ? JSON.stringify(data, null, 2) : 'Not found');
        break;

      case 'query':
        const queryJson = args[1] || '{}';
        const filter = JSON.parse(queryJson);
        
        console.log(`🔍 Querying with filter:`, filter);
        const results = await this.query(filter);
        console.log(`Found ${results.length} results:`);
        results.forEach(r => {
          console.log(`  ${r.shard}/${r.table}/${r.key}`);
        });
        break;

      case 'bash':
        const bashCommand = args[1];
        const bashArgs = args.slice(2);
        
        await this.bashDB(bashCommand, ...bashArgs);
        break;

      case 'status':
        const status = this.getDatabaseStatus();
        console.log('\n🌊 Database Status:');
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'stream':
        const [streamShard, streamTable] = args.slice(1);
        
        console.log(`📡 Streaming changes for ${streamShard}/${streamTable}`);
        const stream = this.streamChanges(streamShard, streamTable);
        
        stream.on('change', (change) => {
          console.log(`Change detected:`, change);
        });
        
        // Keep process alive
        process.stdin.resume();
        break;

      case 'demo':
        console.log('🎭 Running database demo...\n');
        
        // Ralph writes
        await this.write('ralph', 'actions', 'bash-001', {
          action: 'BASH',
          target: 'everything',
          intensity: 100
        });
        
        // Alice analyzes
        await this.write('alice', 'analysis', 'pattern-001', {
          pattern: 'bash-frequency',
          observation: 'Ralph bashes 100% of the time',
          confidence: 1.0
        });
        
        // Charlie protects
        await this.write('charlie', 'guardians', 'protection-001', {
          zone: 'critical-core',
          guardian: 'charlie-prime',
          status: 'active'
        });
        
        // Query across shards
        const allData = await this.query({});
        console.log(`\n📊 Total records: ${allData.length}`);
        
        // Status
        const demoStatus = this.getDatabaseStatus();
        console.log('\n🌊 Database Status:');
        console.log(`  Shards: ${Object.keys(demoStatus.shards).length}`);
        console.log(`  Total files: ${Object.values(demoStatus.shards).reduce((sum, s) => sum + s.files, 0)}`);
        
        console.log('\n✅ Demo complete!');
        break;

      default:
        console.log(`
🌊 Open Distributed Database

Usage:
  node open-distributed-database.js write <shard> <table> <key> <json>
  node open-distributed-database.js read <shard> <table> <key>
  node open-distributed-database.js query <filter-json>
  node open-distributed-database.js bash <command> [...args]
  node open-distributed-database.js status
  node open-distributed-database.js stream <shard> <table>
  node open-distributed-database.js demo

Shards: ${Array.from(this.shards.keys()).join(', ')}

Examples:
  node open-distributed-database.js write ralph actions bash-001 '{"action":"BASH"}'
  node open-distributed-database.js read alice analysis pattern-001
  node open-distributed-database.js query '{"shard":"ralph"}'
  node open-distributed-database.js bash DESTROY_TABLE ralph actions
  node open-distributed-database.js stream vault consciousness

Features:
  - No restrictions - everything is open
  - Git versioning for all data
  - Optional encryption (except Ralph)
  - P2P sync ready
  - Stream changes in real-time
  - Ralph can bash anything
        `);
    }
  }
}

// Export for use as module
module.exports = OpenDistributedDatabase;

// Run CLI if called directly
if (require.main === module) {
  const db = new OpenDistributedDatabase();
  db.cli().catch(console.error);
}
#!/usr/bin/env node

/**
 * DATABASE INTEGRATION LAYER
 * Connects flag-tag system to persistent storage
 * Smash bash - make everything persist!
 */

const fs = require('fs');
const path = require('path');

class DatabaseIntegration {
  constructor() {
    this.dbPath = path.join(__dirname, 'soulfra.db');
    this.connected = false;
    this.cache = new Map();
    
    this.initializeDatabase();
  }

  initializeDatabase() {
    console.log('💾 Initializing database integration...');
    
    // For now, use JSON file as database (upgrade to PostgreSQL later)
    this.database = {
      components: new Map(),
      flags: new Map(),
      tags: new Map(),
      component_flags: new Map(),
      component_tags: new Map(),
      system_health: [],
      rip_operations: [],
      soulfra_files: new Map(),
      ai_requests: new Map(),
      connected_ais: new Map(),
      data_cache: new Map(),
      vanity_stats: [],
      agent_transactions: [],
      distributed_deployments: new Map()
    };
    
    // Load existing data if available
    this.loadFromDisk();
    
    // Set up auto-save every 30 seconds
    setInterval(() => this.saveToDisk(), 30000);
    
    this.connected = true;
    console.log('✅ Database integration ready');
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        
        // Convert arrays back to Maps
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            this.database[key] = data[key];
          } else {
            this.database[key] = new Map(Object.entries(data[key] || {}));
          }
        });
        
        console.log('📂 Loaded existing database from disk');
      }
    } catch (error) {
      console.warn('⚠️ Could not load database from disk:', error.message);
    }
  }

  saveToDisk() {
    try {
      const data = {};
      
      // Convert Maps to objects for JSON serialization
      Object.keys(this.database).forEach(key => {
        if (this.database[key] instanceof Map) {
          data[key] = Object.fromEntries(this.database[key]);
        } else {
          data[key] = this.database[key];
        }
      });
      
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
      console.log('💾 Database saved to disk');
    } catch (error) {
      console.error('❌ Failed to save database:', error.message);
    }
  }

  // Component operations
  saveComponent(component) {
    this.database.components.set(component.id, {
      ...component,
      saved_at: Date.now()
    });
    return true;
  }

  getComponent(id) {
    return this.database.components.get(id);
  }

  getAllComponents() {
    return Array.from(this.database.components.values());
  }

  deleteComponent(id) {
    return this.database.components.delete(id);
  }

  // Flag operations
  saveFlag(flagName, flagData) {
    this.database.flags.set(flagName, {
      ...flagData,
      saved_at: Date.now()
    });
    return true;
  }

  getFlag(flagName) {
    return this.database.flags.get(flagName);
  }

  getAllFlags() {
    return Array.from(this.database.flags.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  // Tag operations
  saveTag(tagName, tagData) {
    this.database.tags.set(tagName, {
      ...tagData,
      saved_at: Date.now()
    });
    return true;
  }

  getTag(tagName) {
    return this.database.tags.get(tagName);
  }

  getAllTags() {
    return Array.from(this.database.tags.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  // Component-Flag relationships
  setComponentFlag(componentId, flagName) {
    const key = `${componentId}:${flagName}`;
    this.database.component_flags.set(key, {
      component_id: componentId,
      flag_name: flagName,
      applied_at: Date.now()
    });
    return true;
  }

  removeComponentFlag(componentId, flagName) {
    const key = `${componentId}:${flagName}`;
    return this.database.component_flags.delete(key);
  }

  getComponentFlags(componentId) {
    const flags = [];
    this.database.component_flags.forEach((data, key) => {
      if (data.component_id === componentId) {
        flags.push(data.flag_name);
      }
    });
    return flags;
  }

  getFlagComponents(flagName) {
    const components = [];
    this.database.component_flags.forEach((data, key) => {
      if (data.flag_name === flagName) {
        components.push(data.component_id);
      }
    });
    return components;
  }

  // Component-Tag relationships
  setComponentTag(componentId, tagName) {
    const key = `${componentId}:${tagName}`;
    this.database.component_tags.set(key, {
      component_id: componentId,
      tag_name: tagName,
      applied_at: Date.now()
    });
    return true;
  }

  removeComponentTag(componentId, tagName) {
    const key = `${componentId}:${tagName}`;
    return this.database.component_tags.delete(key);
  }

  getComponentTags(componentId) {
    const tags = [];
    this.database.component_tags.forEach((data, key) => {
      if (data.component_id === componentId) {
        tags.push(data.tag_name);
      }
    });
    return tags;
  }

  getTagComponents(tagName) {
    const components = [];
    this.database.component_tags.forEach((data, key) => {
      if (data.tag_name === tagName) {
        components.push(data.component_id);
      }
    });
    return components;
  }

  // System health tracking
  recordSystemHealth(healthData) {
    this.database.system_health.push({
      ...healthData,
      recorded_at: Date.now()
    });
    
    // Keep only last 1000 records
    if (this.database.system_health.length > 1000) {
      this.database.system_health = this.database.system_health.slice(-1000);
    }
    
    return true;
  }

  getSystemHealthHistory(limit = 100) {
    return this.database.system_health
      .slice(-limit)
      .reverse();
  }

  getLatestSystemHealth() {
    return this.database.system_health[this.database.system_health.length - 1];
  }

  // Rip-through operations logging
  logRipThroughOperation(operation) {
    this.database.rip_operations.push({
      ...operation,
      logged_at: Date.now()
    });
    
    // Keep only last 500 operations
    if (this.database.rip_operations.length > 500) {
      this.database.rip_operations = this.database.rip_operations.slice(-500);
    }
    
    return true;
  }

  getRipThroughHistory(limit = 50) {
    return this.database.rip_operations
      .slice(-limit)
      .reverse();
  }

  // .soulfra file storage
  saveSoulFraFile(fileData) {
    this.database.soulfra_files.set(fileData.id, {
      ...fileData,
      uploaded_at: Date.now()
    });
    return true;
  }

  getSoulFraFile(fileId) {
    return this.database.soulfra_files.get(fileId);
  }

  getAllSoulFraFiles() {
    return Array.from(this.database.soulfra_files.values());
  }

  getSoulFraFilesByType(type) {
    return Array.from(this.database.soulfra_files.values())
      .filter(file => file.type === type);
  }

  // AI request/response logging
  logAIRequest(requestData) {
    this.database.ai_requests.set(requestData.id, {
      ...requestData,
      logged_at: Date.now()
    });
    return true;
  }

  getAIRequest(requestId) {
    return this.database.ai_requests.get(requestId);
  }

  getAIRequestsByTarget(targetAI) {
    return Array.from(this.database.ai_requests.values())
      .filter(req => req.target_ai === targetAI);
  }

  // Connected AIs registry
  registerAI(aiData) {
    this.database.connected_ais.set(aiData.id, {
      ...aiData,
      registered_at: Date.now()
    });
    return true;
  }

  updateAILastSeen(aiId) {
    const ai = this.database.connected_ais.get(aiId);
    if (ai) {
      ai.last_seen = Date.now();
      this.database.connected_ais.set(aiId, ai);
      return true;
    }
    return false;
  }

  getConnectedAI(aiId) {
    return this.database.connected_ais.get(aiId);
  }

  getAllConnectedAIs() {
    return Array.from(this.database.connected_ais.values());
  }

  // Data caching
  setCache(key, data, ttl = 3600000) { // Default 1 hour TTL
    this.database.data_cache.set(key, {
      data: data,
      cached_at: Date.now(),
      expires_at: Date.now() + ttl
    });
    return true;
  }

  getCache(key) {
    const cached = this.database.data_cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires_at) {
      this.database.data_cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clearExpiredCache() {
    const now = Date.now();
    const keysToDelete = [];
    
    this.database.data_cache.forEach((data, key) => {
      if (now > data.expires_at) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.database.data_cache.delete(key));
    return keysToDelete.length;
  }

  // Vanity stats tracking
  recordVanityStat(statType, statName, statValue) {
    this.database.vanity_stats.push({
      stat_type: statType,
      stat_name: statName,
      stat_value: statValue,
      recorded_at: Date.now()
    });
    
    // Keep only last 10000 stats
    if (this.database.vanity_stats.length > 10000) {
      this.database.vanity_stats = this.database.vanity_stats.slice(-10000);
    }
    
    return true;
  }

  getVanityStats(statType, limit = 100) {
    return this.database.vanity_stats
      .filter(stat => stat.stat_type === statType)
      .slice(-limit)
      .reverse();
  }

  // Agent transactions
  recordAgentTransaction(transaction) {
    this.database.agent_transactions.push({
      ...transaction,
      recorded_at: Date.now()
    });
    
    // Keep only last 5000 transactions
    if (this.database.agent_transactions.length > 5000) {
      this.database.agent_transactions = this.database.agent_transactions.slice(-5000);
    }
    
    return true;
  }

  getAgentTransactions(agentName, limit = 100) {
    return this.database.agent_transactions
      .filter(tx => tx.agent_name === agentName)
      .slice(-limit)
      .reverse();
  }

  // Distributed deployment tracking
  recordDeployment(deployment) {
    this.database.distributed_deployments.set(deployment.id, {
      ...deployment,
      recorded_at: Date.now()
    });
    return true;
  }

  getDeployment(deploymentId) {
    return this.database.distributed_deployments.get(deploymentId);
  }

  getDeploymentsByType(type) {
    return Array.from(this.database.distributed_deployments.values())
      .filter(dep => dep.deployment_type === type);
  }

  // Database stats and health
  getDatabaseStats() {
    const stats = {
      connected: this.connected,
      total_size: this.calculateDatabaseSize(),
      tables: {
        components: this.database.components.size,
        flags: this.database.flags.size,
        tags: this.database.tags.size,
        component_flags: this.database.component_flags.size,
        component_tags: this.database.component_tags.size,
        system_health_records: this.database.system_health.length,
        rip_operations: this.database.rip_operations.length,
        soulfra_files: this.database.soulfra_files.size,
        ai_requests: this.database.ai_requests.size,
        connected_ais: this.database.connected_ais.size,
        cache_entries: this.database.data_cache.size,
        vanity_stats: this.database.vanity_stats.length,
        agent_transactions: this.database.agent_transactions.length,
        distributed_deployments: this.database.distributed_deployments.size
      }
    };
    
    return stats;
  }

  calculateDatabaseSize() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const stats = fs.statSync(this.dbPath);
        return stats.size;
      }
    } catch (error) {
      console.warn('Could not calculate database size:', error.message);
    }
    return 0;
  }

  // Backup and restore
  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `soulfra-backup-${timestamp}.json`);
    
    try {
      this.saveToDisk(); // Ensure current state is saved
      fs.copyFileSync(this.dbPath, backupPath);
      return backupPath;
    } catch (error) {
      console.error('Failed to create backup:', error.message);
      return null;
    }
  }

  restoreFromBackup(backupPath) {
    try {
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, this.dbPath);
        this.loadFromDisk();
        return true;
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error.message);
    }
    return false;
  }

  // Cleanup and maintenance
  cleanup() {
    console.log('🧹 Running database cleanup...');
    
    const expired = this.clearExpiredCache();
    console.log(`  • Cleared ${expired} expired cache entries`);
    
    // Trim large arrays to keep only recent data
    const originalHealth = this.database.system_health.length;
    this.database.system_health = this.database.system_health.slice(-1000);
    console.log(`  • Trimmed system health records: ${originalHealth} → ${this.database.system_health.length}`);
    
    const originalOps = this.database.rip_operations.length;
    this.database.rip_operations = this.database.rip_operations.slice(-500);
    console.log(`  • Trimmed rip operations: ${originalOps} → ${this.database.rip_operations.length}`);
    
    const originalStats = this.database.vanity_stats.length;
    this.database.vanity_stats = this.database.vanity_stats.slice(-10000);
    console.log(`  • Trimmed vanity stats: ${originalStats} → ${this.database.vanity_stats.length}`);
    
    const originalTx = this.database.agent_transactions.length;
    this.database.agent_transactions = this.database.agent_transactions.slice(-5000);
    console.log(`  • Trimmed agent transactions: ${originalTx} → ${this.database.agent_transactions.length}`);
    
    this.saveToDisk();
    console.log('✅ Database cleanup complete');
  }
}

module.exports = DatabaseIntegration;
// Symlink Manager Service - Distributed Deployment Infrastructure
// Manages symlinks across cloud environments, mesh networks, and local development

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const crypto = require('crypto');

class SymlinkManagerService {
  constructor() {
    this.linkRegistry = new Map();
    this.cloudMounts = new Map();
    this.meshConnections = new Map();
    this.syncJobs = new Map();
    this.watchedPaths = new Set();
    
    this.init();
  }

  init() {
    console.log('🔗 Initializing Symlink Manager Service...');
    
    // Set up core link registry
    this.initializeLinkRegistry();
    
    // Set up cloud mount points
    this.setupCloudMounts();
    
    // Initialize mesh network connections
    this.initializeMeshConnections();
    
    // Start file watchers
    this.startFileWatchers();
    
    // Set up sync jobs
    this.setupSyncJobs();
    
    console.log('✅ Symlink Manager Service ready');
  }

  initializeLinkRegistry() {
    // Application data symlinks
    this.linkRegistry.set('app-data', {
      id: 'app-data',
      source: path.join(__dirname, 'data'),
      targets: {
        local: './data',
        dev: '~/dev/economic-engine/data',
        staging: '/var/app/staging/data',
        prod: '/var/app/production/data',
        cloud_railway: '/app/data',
        cloud_vercel: '/vercel/data',
        edge_cloudflare: '/workers/data'
      },
      type: 'directory',
      sync: true,
      permissions: '755',
      owner: 'app',
      critical: true
    });

    // Configuration symlinks
    this.linkRegistry.set('config', {
      id: 'config',
      source: path.join(__dirname, 'config'),
      targets: {
        local: './config',
        system: '/etc/economic-engine',
        user: '~/.economic-engine',
        docker: '/app/config',
        k8s: '/etc/config',
        cloud_shared: '/mnt/config'
      },
      type: 'directory',
      sync: true,
      permissions: '644',
      owner: 'root',
      critical: true
    });

    // Log symlinks
    this.linkRegistry.set('logs', {
      id: 'logs',
      source: path.join(__dirname, 'logs'),
      targets: {
        local: './logs',
        system: '/var/log/economic-engine',
        user: '~/logs/economic-engine',
        container: '/app/logs',
        syslog: '/dev/log',
        cloud_logs: '/var/log/app'
      },
      type: 'directory',
      sync: false, // Logs don't need bidirectional sync
      permissions: '644',
      owner: 'app',
      critical: false
    });

    // Shared libraries and modules
    this.linkRegistry.set('node_modules', {
      id: 'node_modules',
      source: path.join(__dirname, 'node_modules'),
      targets: {
        local: './node_modules',
        cache: '~/.npm-cache/economic-engine',
        global: '/usr/local/lib/node_modules/economic-engine',
        docker: '/app/node_modules'
      },
      type: 'directory',
      sync: false, // Managed by npm
      permissions: '755',
      owner: 'app',
      critical: true
    });

    // Static assets and public files
    this.linkRegistry.set('public', {
      id: 'public', 
      source: path.join(__dirname, 'public'),
      targets: {
        local: './public',
        nginx: '/var/www/economic-engine',
        cdn: '/cdn/economic-engine',
        s3: '/s3/economic-engine-assets',
        cloudfront: '/cloudfront/assets'
      },
      type: 'directory',
      sync: true,
      permissions: '644',
      owner: 'www-data',
      critical: false
    });

    // Database and persistent storage
    this.linkRegistry.set('database', {
      id: 'database',
      source: path.join(__dirname, 'database'),
      targets: {
        local: './database',
        postgres: '/var/lib/postgresql/data',
        redis: '/var/lib/redis',
        backup: '/backup/database',
        cloud_db: '/mnt/database'
      },
      type: 'directory',
      sync: true,
      permissions: '700',
      owner: 'postgres',
      critical: true
    });

    console.log('📋 Link registry initialized with', this.linkRegistry.size, 'groups');
  }

  setupCloudMounts() {
    // Railway cloud mounts
    this.cloudMounts.set('railway', {
      provider: 'railway',
      endpoint: 'https://railway.app/api/v1',
      mountPoints: {
        '/app/data': { source: 'app-data', persistent: true },
        '/app/config': { source: 'config', persistent: true },
        '/app/logs': { source: 'logs', persistent: false },
        '/app/uploads': { source: 'uploads', persistent: true }
      },
      volumeDriver: 'railway-volumes',
      encryption: true,
      backup: true
    });

    // Vercel edge mounts
    this.cloudMounts.set('vercel', {
      provider: 'vercel',
      endpoint: 'https://api.vercel.com/v1',
      mountPoints: {
        '/vercel/data': { source: 'app-data', persistent: false }, // Serverless
        '/vercel/cache': { source: 'cache', persistent: true },
        '/vercel/static': { source: 'public', persistent: true }
      },
      volumeDriver: 'vercel-storage',
      encryption: true,
      backup: false // Handled by Vercel
    });

    // AWS S3 mounts
    this.cloudMounts.set('aws-s3', {
      provider: 'aws',
      endpoint: 'https://s3.amazonaws.com',
      mountPoints: {
        '/s3/economic-engine': { source: 'app-data', persistent: true },
        '/s3/assets': { source: 'public', persistent: true },
        '/s3/backups': { source: 'database', persistent: true }
      },
      volumeDriver: 's3fs',
      encryption: true,
      backup: true
    });

    console.log('☁️ Cloud mounts configured for', this.cloudMounts.size, 'providers');
  }

  initializeMeshConnections() {
    // Local development mesh
    this.meshConnections.set('local-dev', {
      nodeId: 'local-dev',
      type: 'development',
      protocol: 'file://',
      endpoints: ['localhost:9999'],
      syncMethods: ['rsync', 'filesystem'],
      priority: 1,
      latency: 0,
      bandwidth: 'unlimited'
    });

    // Production mesh node
    this.meshConnections.set('prod-primary', {
      nodeId: 'prod-primary',
      type: 'production',
      protocol: 'https://',
      endpoints: ['https://document-generator.railway.app'],
      syncMethods: ['webhook', 'api'],
      priority: 2,
      latency: 50,
      bandwidth: '1Gbps'
    });

    // Edge mesh node
    this.meshConnections.set('edge-global', {
      nodeId: 'edge-global',
      type: 'edge',
      protocol: 'https://',
      endpoints: ['https://document-generator.vercel.app'],
      syncMethods: ['cdn', 'edge-cache'],
      priority: 3,
      latency: 20,
      bandwidth: '10Gbps'
    });

    // Backup mesh node
    this.meshConnections.set('backup-secondary', {
      nodeId: 'backup-secondary',
      type: 'backup',
      protocol: 'rsync://',
      endpoints: ['backup.economic-engine.com'],
      syncMethods: ['rsync', 'incremental'],
      priority: 4,
      latency: 100,
      bandwidth: '100Mbps'
    });

    console.log('🕸️ Mesh connections configured for', this.meshConnections.size, 'nodes');
  }

  startFileWatchers() {
    // Watch critical paths for changes
    this.linkRegistry.forEach((link, linkId) => {
      if (link.sync && link.critical) {
        this.watchPath(link.source, (eventType, filename) => {
          console.log(`👁️ ${linkId}: ${eventType} detected for ${filename}`);
          this.scheduleSync(linkId, 'file-change');
        });
      }
    });

    console.log('👁️ File watchers started for', this.watchedPaths.size, 'paths');
  }

  watchPath(targetPath, callback) {
    if (this.watchedPaths.has(targetPath)) return;
    
    try {
      fs.watch(targetPath, { recursive: true }, callback);
      this.watchedPaths.add(targetPath);
    } catch (error) {
      console.warn(`⚠️ Could not watch path ${targetPath}:`, error.message);
    }
  }

  setupSyncJobs() {
    // Regular sync jobs
    setInterval(() => {
      this.runSyncCycle('scheduled');
    }, 60000); // Every minute

    // Critical sync jobs (more frequent)
    setInterval(() => {
      this.runCriticalSync();
    }, 10000); // Every 10 seconds

    console.log('⏰ Sync jobs scheduled');
  }

  async runSyncCycle(trigger) {
    console.log(`🔄 Starting sync cycle (${trigger})`);
    
    for (const [linkId, link] of this.linkRegistry) {
      if (link.sync) {
        try {
          await this.syncLink(linkId);
        } catch (error) {
          console.error(`❌ Sync failed for ${linkId}:`, error.message);
        }
      }
    }
    
    console.log('✅ Sync cycle completed');
  }

  async runCriticalSync() {
    const criticalLinks = Array.from(this.linkRegistry.entries())
      .filter(([_, link]) => link.critical && link.sync);
    
    for (const [linkId, link] of criticalLinks) {
      try {
        const status = await this.checkLinkHealth(linkId);
        if (!status.healthy) {
          console.log(`🚨 Critical link ${linkId} unhealthy, forcing sync`);
          await this.syncLink(linkId, { force: true });
        }
      } catch (error) {
        console.error(`❌ Critical sync check failed for ${linkId}:`, error.message);
      }
    }
  }

  scheduleSync(linkId, reason) {
    const syncId = `${linkId}-${Date.now()}`;
    
    this.syncJobs.set(syncId, {
      linkId,
      reason,
      scheduled: Date.now(),
      status: 'pending'
    });

    // Execute sync with small delay to batch operations
    setTimeout(() => {
      this.executeScheduledSync(syncId);
    }, 1000);
  }

  async executeScheduledSync(syncId) {
    const job = this.syncJobs.get(syncId);
    if (!job || job.status !== 'pending') return;

    job.status = 'running';
    job.started = Date.now();

    try {
      await this.syncLink(job.linkId);
      job.status = 'completed';
      job.completed = Date.now();
      console.log(`✅ Scheduled sync completed for ${job.linkId} (${job.reason})`);
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completed = Date.now();
      console.error(`❌ Scheduled sync failed for ${job.linkId}:`, error.message);
    }

    // Clean up old jobs
    setTimeout(() => {
      this.syncJobs.delete(syncId);
    }, 300000); // Keep for 5 minutes
  }

  async syncLink(linkId, options = {}) {
    const link = this.linkRegistry.get(linkId);
    if (!link) {
      throw new Error(`Link ${linkId} not found in registry`);
    }

    console.log(`🔄 Syncing ${linkId}...`);

    // Ensure source exists
    await this.ensureSourceExists(link);

    // Sync to all targets
    const results = [];
    for (const [targetName, targetPath] of Object.entries(link.targets)) {
      try {
        const result = await this.syncToTarget(link, targetName, targetPath, options);
        results.push({ target: targetName, success: true, ...result });
      } catch (error) {
        results.push({ target: targetName, success: false, error: error.message });
        console.error(`❌ Failed to sync ${linkId} to ${targetName}:`, error.message);
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Synced ${linkId}: ${successCount}/${results.length} targets successful`);

    return results;
  }

  async ensureSourceExists(link) {
    if (!fs.existsSync(link.source)) {
      if (link.type === 'directory') {
        fs.mkdirSync(link.source, { recursive: true });
        console.log(`📁 Created source directory: ${link.source}`);
      } else {
        // Create empty file
        fs.writeFileSync(link.source, '');
        console.log(`📄 Created source file: ${link.source}`);
      }
    }
  }

  async syncToTarget(link, targetName, targetPath, options = {}) {
    const resolvedTarget = this.resolvePath(targetPath);
    
    // Choose sync method based on target type
    if (targetPath.startsWith('/')) {
      // Absolute path - system symlink
      return this.createSystemSymlink(link, resolvedTarget, options);
    } else if (targetPath.startsWith('~')) {
      // User directory symlink
      return this.createUserSymlink(link, resolvedTarget, options);
    } else if (targetPath.startsWith('./')) {
      // Relative symlink
      return this.createRelativeSymlink(link, resolvedTarget, options);
    } else if (targetPath.includes('://')) {
      // Remote/cloud target
      return this.syncToRemote(link, targetName, targetPath, options);
    } else {
      // Default to relative
      return this.createRelativeSymlink(link, resolvedTarget, options);
    }
  }

  resolvePath(targetPath) {
    if (targetPath.startsWith('~')) {
      return path.join(require('os').homedir(), targetPath.slice(2));
    }
    return targetPath;
  }

  async createSystemSymlink(link, targetPath, options) {
    try {
      // Check if target exists and remove if necessary
      if (fs.existsSync(targetPath)) {
        if (options.force || !fs.lstatSync(targetPath).isSymbolicLink()) {
          await this.removeTarget(targetPath);
        } else {
          // Check if symlink points to correct source
          const currentTarget = fs.readlinkSync(targetPath);
          if (path.resolve(currentTarget) === path.resolve(link.source)) {
            return { action: 'already_linked', target: targetPath };
          }
          await this.removeTarget(targetPath);
        }
      }

      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Create symlink
      fs.symlinkSync(path.resolve(link.source), targetPath);
      
      // Set permissions if specified
      if (link.permissions) {
        fs.chmodSync(targetPath, link.permissions);
      }

      return { action: 'created', target: targetPath, type: 'symlink' };
    } catch (error) {
      throw new Error(`Failed to create system symlink ${targetPath}: ${error.message}`);
    }
  }

  async createUserSymlink(link, targetPath, options) {
    // Similar to system symlink but for user directories
    return this.createSystemSymlink(link, targetPath, options);
  }

  async createRelativeSymlink(link, targetPath, options) {
    try {
      const relativePath = path.relative(path.dirname(targetPath), link.source);
      
      if (fs.existsSync(targetPath)) {
        await this.removeTarget(targetPath);
      }

      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.symlinkSync(relativePath, targetPath);
      
      return { action: 'created', target: targetPath, type: 'relative_symlink' };
    } catch (error) {
      throw new Error(`Failed to create relative symlink ${targetPath}: ${error.message}`);
    }
  }

  async syncToRemote(link, targetName, targetPath, options) {
    // Handle remote syncing (cloud, mesh nodes, etc.)
    const url = new URL(targetPath);
    
    switch (url.protocol) {
      case 'https:':
        return this.syncToHTTPS(link, targetName, url, options);
      case 'rsync:':
        return this.syncToRsync(link, targetName, url, options);
      case 's3:':
        return this.syncToS3(link, targetName, url, options);
      default:
        throw new Error(`Unsupported remote protocol: ${url.protocol}`);
    }
  }

  async syncToHTTPS(link, targetName, url, options) {
    // Sync via HTTPS API
    console.log(`🌐 Syncing ${link.id} to ${url.hostname} via HTTPS`);
    
    // This would implement actual HTTPS sync
    // For now, just return success simulation
    return { 
      action: 'synced', 
      target: url.href, 
      type: 'https_api',
      method: 'POST'
    };
  }

  async syncToRsync(link, targetName, url, options) {
    // Sync via rsync
    console.log(`📡 Syncing ${link.id} to ${url.hostname} via rsync`);
    
    return new Promise((resolve, reject) => {
      const rsyncCmd = `rsync -avz ${link.source}/ ${url.href}`;
      exec(rsyncCmd, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Rsync failed: ${error.message}`));
        } else {
          resolve({ 
            action: 'synced', 
            target: url.href, 
            type: 'rsync',
            output: stdout 
          });
        }
      });
    });
  }

  async syncToS3(link, targetName, url, options) {
    // Sync to S3 bucket
    console.log(`☁️ Syncing ${link.id} to S3 bucket ${url.pathname}`);
    
    // This would implement actual S3 sync via AWS SDK
    return { 
      action: 'synced', 
      target: url.href, 
      type: 's3_bucket',
      bucket: url.pathname.split('/')[1]
    };
  }

  async removeTarget(targetPath) {
    try {
      const stats = fs.lstatSync(targetPath);
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(targetPath);
      } else if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
    } catch (error) {
      // Ignore errors for non-existent files
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async checkLinkHealth(linkId) {
    const link = this.linkRegistry.get(linkId);
    if (!link) {
      return { healthy: false, error: 'Link not found' };
    }

    const health = {
      healthy: true,
      source_exists: fs.existsSync(link.source),
      targets: {},
      errors: []
    };

    // Check source
    if (!health.source_exists) {
      health.healthy = false;
      health.errors.push('Source does not exist');
    }

    // Check targets
    for (const [targetName, targetPath] of Object.entries(link.targets)) {
      const resolvedPath = this.resolvePath(targetPath);
      
      try {
        if (fs.existsSync(resolvedPath)) {
          const stats = fs.lstatSync(resolvedPath);
          if (stats.isSymbolicLink()) {
            const linkTarget = fs.readlinkSync(resolvedPath);
            const targetExists = fs.existsSync(linkTarget);
            health.targets[targetName] = {
              exists: true,
              is_symlink: true,
              target: linkTarget,
              target_exists: targetExists,
              healthy: targetExists
            };
            
            if (!targetExists) {
              health.healthy = false;
              health.errors.push(`Broken symlink: ${targetName}`);
            }
          } else {
            health.targets[targetName] = {
              exists: true,
              is_symlink: false,
              healthy: false
            };
            health.healthy = false;
            health.errors.push(`Target exists but is not a symlink: ${targetName}`);
          }
        } else {
          health.targets[targetName] = {
            exists: false,
            healthy: false
          };
          if (link.critical) {
            health.healthy = false;
            health.errors.push(`Critical target missing: ${targetName}`);
          }
        }
      } catch (error) {
        health.targets[targetName] = {
          exists: false,
          healthy: false,
          error: error.message
        };
        health.healthy = false;
        health.errors.push(`Error checking ${targetName}: ${error.message}`);
      }
    }

    return health;
  }

  // API methods for external access
  async getStatus() {
    const status = {
      service: 'symlink-manager',
      version: '1.0.0',
      links: {},
      cloud_mounts: Array.from(this.cloudMounts.keys()),
      mesh_connections: Array.from(this.meshConnections.keys()),
      sync_jobs: this.syncJobs.size,
      watched_paths: this.watchedPaths.size,
      timestamp: Date.now()
    };

    // Get health status for all links
    for (const linkId of this.linkRegistry.keys()) {
      status.links[linkId] = await this.checkLinkHealth(linkId);
    }

    return status;
  }

  async createAPIRoutes(app) {
    // Symlink status endpoint
    app.get('/api/symlinks/status', async (req, res) => {
      try {
        const status = await this.getStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create specific symlink
    app.post('/api/symlinks/create/:linkId', async (req, res) => {
      try {
        const { linkId } = req.params;
        const results = await this.syncLink(linkId, { force: true });
        res.json({ success: true, linkId, results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check for specific link
    app.get('/api/symlinks/health/:linkId', async (req, res) => {
      try {
        const { linkId } = req.params;
        const health = await this.checkLinkHealth(linkId);
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Force sync all links
    app.post('/api/symlinks/sync-all', async (req, res) => {
      try {
        await this.runSyncCycle('manual');
        res.json({ success: true, message: 'Sync cycle completed' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    console.log('🛣️ Symlink manager API routes created');
  }
}

module.exports = SymlinkManagerService;
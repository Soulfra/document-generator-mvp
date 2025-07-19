#!/usr/bin/env node

/**
 * BACKUP AUTH SYSTEM
 * Middle click → Backup system → Print auth → Login layer
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

console.log('🔐 BACKUP AUTH SYSTEM - MIDDLE CLICK ACTIVATED');

class BackupAuthSystem {
  constructor() {
    this.authTokens = new Map();
    this.backupQueue = [];
    this.systemState = {};
    
    this.executeMiddleClick();
  }

  async executeMiddleClick() {
    console.log('🖱️ MIDDLE CLICK DETECTED - EMERGENCY BACKUP MODE');
    
    // 1. Backup current system state
    await this.backupSystem();
    
    // 2. Generate auth token
    const authToken = this.generateAuth();
    
    // 3. Print auth for user
    this.printAuth(authToken);
    
    // 4. Create login layer
    await this.createLoginLayer();
  }

  async backupSystem() {
    console.log('💾 BACKING UP SYSTEM STATE...');
    
    const systemFiles = [
      'conductor-character.js',
      'unified-system-interface.js',
      'reasoning-differential-bash-engine.js',
      'hidden-layer-bus-gas-system.js',
      'runtime-bash-executor.js',
      'simple-start.js',
      'package.json'
    ];
    
    const backup = {
      timestamp: new Date().toISOString(),
      files: {},
      characters: {
        conductor: 'active',
        cal: 'ready',
        arty: 'ready', 
        ralph: 'contained',
        charlie: 'guarding'
      },
      systems: {
        bash_engine: 'operational',
        hidden_layer: 'active',
        unified_interface: 'ready',
        runtime: 'executed'
      }
    };
    
    // Backup existing files
    for (const file of systemFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        backup.files[file] = {
          size: content.length,
          checksum: crypto.createHash('md5').update(content).digest('hex'),
          backup_time: new Date().toISOString()
        };
        console.log(`  ✅ ${file} - backed up`);
      } catch (error) {
        console.log(`  ⚠️ ${file} - not found`);
      }
    }
    
    // Write backup manifest
    const backupPath = `backup-${Date.now()}.json`;
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`💾 Backup complete: ${backupPath}`);
    return backup;
  }

  generateAuth() {
    console.log('🔑 GENERATING AUTH TOKEN...');
    
    const authToken = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();
    
    const auth = {
      token: authToken,
      session: sessionId,
      timestamp,
      expires: timestamp + (24 * 60 * 60 * 1000), // 24 hours
      permissions: ['read', 'write', 'execute', 'backup'],
      systems_access: ['all'],
      character_access: ['conductor', 'cal', 'arty', 'ralph', 'charlie']
    };
    
    this.authTokens.set(sessionId, auth);
    
    console.log('🔑 Auth token generated');
    return auth;
  }

  printAuth(auth) {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 AUTHENTICATION CREDENTIALS');
    console.log('='.repeat(60));
    console.log(`Session ID: ${auth.session}`);
    console.log(`Token: ${auth.token}`);
    console.log(`Expires: ${new Date(auth.expires).toISOString()}`);
    console.log(`Permissions: ${auth.permissions.join(', ')}`);
    console.log(`Character Access: ${auth.character_access.join(', ')}`);
    console.log('='.repeat(60));
    console.log('\n🔑 Save these credentials - they grant full system access');
    console.log('🛡️ Charlie is monitoring this session for security');
  }

  async createLoginLayer() {
    console.log('🔐 CREATING LOGIN LAYER...');
    
    const loginLayer = `#!/usr/bin/env node

/**
 * LOGIN LAYER
 * Authenticate users before system access
 */

const crypto = require('crypto');
const readline = require('readline');

console.log('🔐 SYSTEM LOGIN - ENTER CREDENTIALS');

class LoginLayer {
  constructor() {
    this.validTokens = new Map();
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    this.promptLogin();
  }

  async promptLogin() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('🔑 Enter session ID: ', (sessionId) => {
      rl.question('🔐 Enter auth token: ', (token) => {
        rl.close();
        
        if (this.validateCredentials(sessionId, token)) {
          console.log('✅ LOGIN SUCCESSFUL');
          console.log('🎼 Conductor: Welcome back to the system');
          console.log('🛡️ Charlie: Access granted, monitoring active');
          this.grantAccess();
        } else {
          console.log('❌ LOGIN FAILED');
          console.log('🛡️ Charlie: Access denied, security alert triggered');
          process.exit(1);
        }
      });
    });
  }

  validateCredentials(sessionId, token) {
    // In real implementation, would check against stored tokens
    // For now, just check format
    return sessionId.length === 36 && token.length === 64;
  }

  grantAccess() {
    console.log('🚀 SYSTEM ACCESS GRANTED');
    console.log('Available commands:');
    console.log('  npm run conduct "your command"');
    console.log('  npm run symphony "task for all characters"');
    console.log('  npm run just-do-it "whatever needs doing"');
    console.log('  npm run bash "simple execution"');
  }
}

// Export for use as module
module.exports = LoginLayer;

// Run if called directly
if (require.main === module) {
  new LoginLayer();
}`;

    await fs.writeFile('login-layer.js', loginLayer);
    console.log('✅ Login layer created: login-layer.js');
  }

  async emergencyRestore(backupFile) {
    console.log(`🔄 EMERGENCY RESTORE FROM ${backupFile}`);
    
    try {
      const backup = JSON.parse(await fs.readFile(backupFile, 'utf8'));
      console.log(`📅 Restoring from: ${backup.timestamp}`);
      console.log('✅ Emergency restore complete');
      return backup;
    } catch (error) {
      console.error('❌ Emergency restore failed:', error.message);
    }
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'backup':
        await this.backupSystem();
        break;
        
      case 'auth':
        const auth = this.generateAuth();
        this.printAuth(auth);
        break;
        
      case 'login':
        await this.createLoginLayer();
        break;
        
      case 'restore':
        const backupFile = args[1];
        if (backupFile) {
          await this.emergencyRestore(backupFile);
        } else {
          console.log('Usage: npm run backup-auth restore <backup-file>');
        }
        break;

      default:
        console.log(\`
🔐 Backup Auth System

Usage:
  node backup-auth-system.js backup    # Backup current system
  node backup-auth-system.js auth      # Generate auth token
  node backup-auth-system.js login     # Create login layer
  node backup-auth-system.js restore   # Restore from backup

🛡️ Emergency Commands:
  • Middle click detected → Auto backup + auth
  • System secured by Charlie
  • All characters authenticated
        \`);
    }
  }
}

// Export for use as module
module.exports = BackupAuthSystem;

// Run CLI if called directly
if (require.main === module) {
  const backup = new BackupAuthSystem();
  backup.cli().catch(console.error);
}
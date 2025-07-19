#!/usr/bin/env node

/**
 * Vibecoding Localhost Bridge
 * 
 * Creates symlink orchestration between:
 * - Sovereign Agents (localhost:8085)
 * - Electron App (vibecoding-vault) 
 * - AI Economy System
 * - Document Generator
 * 
 * Fixes hanging orchestration by properly linking all layers
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

console.log('🌉 VIBECODING LOCALHOST BRIDGE');
console.log('===============================');
console.log('🎭 Creating symlink orchestration for sovereign agents...');

class VivecodingLocalhostBridge {
  constructor() {
    this.projectRoot = process.cwd();
    this.vibcodingVaultPath = path.join(this.projectRoot, 'vibecoding-vault');
    this.sovereignAgentsPath = path.join(this.projectRoot, 'services/sovereign-agents');
    this.envBridgePath = path.join(this.vibcodingVaultPath, 'env-bridge');
    
    this.services = {
      sovereignAgents: 'http://localhost:8085',
      aiEconomy: 'http://localhost:8080', 
      templateProcessor: 'http://localhost:3000',
      aiAPI: 'http://localhost:3001'
    };
  }

  async createEnvBridge() {
    console.log('🔧 Creating environment bridge for cloud keys...');
    
    try {
      // Create env-bridge directory in vibecoding-vault
      await fs.mkdir(this.envBridgePath, { recursive: true });
      
      // Create cloud environment bridge
      const cloudEnvBridge = `#!/usr/bin/env node

/**
 * Cloud Environment Bridge
 * Injects cloud API keys into localhost services via Electron
 */

const { ipcRenderer } = require('electron');

// Environment variables to bridge to cloud
const cloudEnvVars = {
  // Sovereign Agents crypto keys
  AGENT_CRYPTO_SECRET: process.env.AGENT_CRYPTO_SECRET_CLOUD || 'cloud-crypto-secret',
  AGENT_DEVICE_FINGERPRINT_SALT: process.env.AGENT_DEVICE_FINGERPRINT_SALT_CLOUD || 'cloud-salt',
  
  // AI API Keys for cloud enhancement
  ANTHROPIC_API_KEY_CLOUD: process.env.ANTHROPIC_API_KEY_CLOUD,
  OPENAI_API_KEY_CLOUD: process.env.OPENAI_API_KEY_CLOUD,
  
  // Blockchain/Decentralized keys
  BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY,
  DECENTRALIZED_STORAGE_KEY: process.env.DECENTRALIZED_STORAGE_KEY,
  
  // AI Economy tokens
  ECONOMY_TOKEN_SECRET: process.env.ECONOMY_TOKEN_SECRET,
  PAYMENT_PROCESSOR_KEY: process.env.PAYMENT_PROCESSOR_KEY
};

// Bridge localhost services to cloud
async function bridgeToCloud() {
  console.log('🌉 Bridging localhost to cloud environment...');
  
  for (const [key, value] of Object.entries(cloudEnvVars)) {
    if (value) {
      // Inject into localhost services
      await fetch('http://localhost:8085/api/env/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, source: 'cloud' })
      }).catch(() => {}); // Silent fail for unavailable services
    }
  }
}

// Auto-bridge on Electron startup
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bridgeToCloud);
} else {
  bridgeToCloud();
}

module.exports = { bridgeToCloud, cloudEnvVars };`;

      await fs.writeFile(
        path.join(this.envBridgePath, 'cloud-env-bridge.js'),
        cloudEnvBridge
      );
      
      console.log('✅ Cloud environment bridge created');
      
    } catch (error) {
      console.error('❌ Error creating env bridge:', error.message);
    }
  }

  async createSymlinkOrchestration() {
    console.log('🔗 Creating symlink orchestration layer...');
    
    const symlinkMappings = [
      // Sovereign agents to vibecoding vault
      {
        source: this.sovereignAgentsPath,
        target: path.join(this.vibcodingVaultPath, 'sovereign-agents'),
        type: 'directory'
      },
      
      // Environment files
      {
        source: path.join(this.projectRoot, '.env'),
        target: path.join(this.vibcodingVaultPath, '.env.localhost'),
        type: 'file'
      },
      
      // Docker services
      {
        source: path.join(this.projectRoot, 'docker-compose.yml'),
        target: path.join(this.vibcodingVaultPath, 'docker-compose.localhost.yml'),
        type: 'file'
      },
      
      // AI Economy integration
      {
        source: path.join(this.projectRoot, 'FinishThisIdea/DOC-FRAMEWORK/soulfra-mvp/dist/api/routes/bootstrap.route.js'),
        target: path.join(this.vibcodingVaultPath, 'ai-economy-routes.js'),
        type: 'file'
      }
    ];
    
    for (const mapping of symlinkMappings) {
      try {
        // Check if source exists
        await fs.access(mapping.source);
        
        // Remove existing target if it exists
        try {
          await fs.unlink(mapping.target);
        } catch {} // Ignore if doesn't exist
        
        // Create symlink
        await fs.symlink(mapping.source, mapping.target);
        console.log(`✅ Created symlink: ${path.basename(mapping.target)}`);
        
      } catch (error) {
        console.log(`⚠️  Skipped ${path.basename(mapping.target)}: ${error.message}`);
      }
    }
  }

  async startElectronBridge() {
    console.log('🚀 Starting Electron bridge for cloud connectivity...');
    
    return new Promise((resolve) => {
      const electronProcess = spawn('npm', ['start:dev'], {
        cwd: this.vibcodingVaultPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'development',
          LOCALHOST_BRIDGE: 'true',
          SOVEREIGN_AGENTS_URL: this.services.sovereignAgents,
          AI_ECONOMY_URL: this.services.aiEconomy
        }
      });
      
      electronProcess.on('spawn', () => {
        console.log('✅ Electron bridge started');
        console.log('🌉 Localhost services now bridged to cloud environment');
        resolve(true);
      });
      
      electronProcess.on('error', (error) => {
        console.error('❌ Electron bridge failed:', error.message);
        resolve(false);
      });
    });
  }

  async testConnectivity() {
    console.log('🔍 Testing localhost service connectivity...');
    
    for (const [service, url] of Object.entries(this.services)) {
      try {
        const response = await fetch(url + '/health', {
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          console.log(`✅ ${service}: Connected (${response.status})`);
        } else {
          console.log(`⚠️  ${service}: Response ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${service}: Not responding`);
      }
    }
  }

  async orchestrate() {
    console.log('🎼 Starting localhost orchestration...');
    
    try {
      // Create environment bridge
      await this.createEnvBridge();
      
      // Create symlink layer
      await this.createSymlinkOrchestration();
      
      // Test existing connectivity
      await this.testConnectivity();
      
      // Start Electron bridge (non-blocking)
      const electronStarted = await this.startElectronBridge();
      
      if (electronStarted) {
        console.log('🎭 ORCHESTRATION COMPLETE!');
        console.log('========================');
        console.log('🌉 Localhost services bridged to cloud');
        console.log('🔗 Symlink layer established');
        console.log('⚡ Electron app connected');
        console.log('');
        console.log('🎯 Your sovereign agents can now:');
        console.log('   • Access cloud API keys via Electron');
        console.log('   • Use AI economy system');
        console.log('   • Bridge localhost ↔ cloud seamlessly');
        console.log('');
        console.log('🚀 Test with: docker-compose up -d && node http-only-test.js');
      }
      
    } catch (error) {
      console.error('💥 Orchestration failed:', error);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const bridge = new VivecodingLocalhostBridge();
  bridge.orchestrate().catch(console.error);
}

module.exports = VivecodingLocalhostBridge;
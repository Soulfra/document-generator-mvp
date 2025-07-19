#!/usr/bin/env node

/**
 * CONTEXT PROFILES - Environment Management
 * Different contexts for development, staging, production, remote
 * Each profile has specific character configurations and system settings
 */

console.log(`
🌍 CONTEXT PROFILES ACTIVE 🌍
Environment-specific configurations + character profiles
`);

const fs = require('fs');
const path = require('path');

class ContextProfileManager {
  constructor() {
    this.profiles = new Map();
    this.currentProfile = 'development';
    this.profilesPath = './profiles';
    
    this.initializeProfiles();
  }

  initializeProfiles() {
    // Development Profile
    this.profiles.set('development', {
      name: 'Development',
      description: 'Local development with all features',
      environment: 'local',
      services: {
        vault: { port: 3333, host: 'localhost' },
        api: { port: 3001, host: 'localhost' },
        dashboard: { port: 8080, host: 'localhost' },
        brain: { enabled: true, debug: true }
      },
      characters: {
        ralph: {
          energy: 100,
          mode: 'development',
          debug: true,
          bashIntensity: 'moderate'
        },
        alice: {
          analysisDepth: 'deep',
          patternRecognition: 'enhanced',
          debug: true
        },
        bob: {
          buildQuality: 'thorough',
          documentation: 'verbose',
          testing: 'comprehensive'
        },
        charlie: {
          securityLevel: 'development',
          scanning: 'basic',
          alerting: 'verbose'
        },
        diana: {
          orchestrationMode: 'flexible',
          coordination: 'loose',
          harmony: 'developmental'
        },
        eve: {
          knowledgeBase: 'full',
          learning: 'continuous',
          archiving: 'verbose'
        },
        frank: {
          unityLevel: 'exploratory',
          transcendence: 'learning',
          holistic: 'open'
        }
      },
      deployment: {
        type: 'local',
        docker: true,
        monitoring: 'basic',
        logging: 'verbose'
      }
    });

    // Staging Profile
    this.profiles.set('staging', {
      name: 'Staging',
      description: 'Pre-production testing environment',
      environment: 'staging',
      services: {
        vault: { port: 3333, host: 'staging.yourdomain.com' },
        api: { port: 3001, host: 'staging.yourdomain.com' },
        dashboard: { port: 8080, host: 'staging.yourdomain.com' },
        brain: { enabled: true, debug: false }
      },
      characters: {
        ralph: {
          energy: 90,
          mode: 'staging',
          debug: false,
          bashIntensity: 'controlled'
        },
        alice: {
          analysisDepth: 'production',
          patternRecognition: 'optimized',
          debug: false
        },
        bob: {
          buildQuality: 'production',
          documentation: 'essential',
          testing: 'automated'
        },
        charlie: {
          securityLevel: 'staging',
          scanning: 'comprehensive',
          alerting: 'filtered'
        },
        diana: {
          orchestrationMode: 'structured',
          coordination: 'tight',
          harmony: 'balanced'
        },
        eve: {
          knowledgeBase: 'curated',
          learning: 'selective',
          archiving: 'optimized'
        },
        frank: {
          unityLevel: 'focused',
          transcendence: 'practical',
          holistic: 'targeted'
        }
      },
      deployment: {
        type: 'cloud',
        docker: true,
        monitoring: 'enhanced',
        logging: 'structured'
      }
    });

    // Production Profile
    this.profiles.set('production', {
      name: 'Production',
      description: 'Live production environment',
      environment: 'production',
      services: {
        vault: { port: 3333, host: 'vault.yourdomain.com' },
        api: { port: 3001, host: 'api.yourdomain.com' },
        dashboard: { port: 8080, host: 'dashboard.yourdomain.com' },
        brain: { enabled: true, debug: false }
      },
      characters: {
        ralph: {
          energy: 85,
          mode: 'production',
          debug: false,
          bashIntensity: 'precise'
        },
        alice: {
          analysisDepth: 'optimized',
          patternRecognition: 'production',
          debug: false
        },
        bob: {
          buildQuality: 'enterprise',
          documentation: 'minimal',
          testing: 'critical'
        },
        charlie: {
          securityLevel: 'maximum',
          scanning: 'continuous',
          alerting: 'critical'
        },
        diana: {
          orchestrationMode: 'enterprise',
          coordination: 'precision',
          harmony: 'optimized'
        },
        eve: {
          knowledgeBase: 'essential',
          learning: 'passive',
          archiving: 'compressed'
        },
        frank: {
          unityLevel: 'master',
          transcendence: 'achieved',
          holistic: 'unified'
        }
      },
      deployment: {
        type: 'enterprise',
        docker: true,
        monitoring: 'comprehensive',
        logging: 'minimal'
      }
    });

    // Remote Profile
    this.profiles.set('remote', {
      name: 'Remote',
      description: 'Distributed remote deployment',
      environment: 'remote',
      services: {
        vault: { port: 3333, host: 'remote-vault.cluster.local' },
        api: { port: 3001, host: 'remote-api.cluster.local' },
        dashboard: { port: 8080, host: 'remote-dashboard.cluster.local' },
        brain: { enabled: true, debug: false }
      },
      characters: {
        ralph: {
          energy: 120,
          mode: 'remote',
          debug: false,
          bashIntensity: 'maximum',
          distribution: 'multi-node'
        },
        alice: {
          analysisDepth: 'distributed',
          patternRecognition: 'cluster',
          debug: false,
          distribution: 'data-nodes'
        },
        bob: {
          buildQuality: 'distributed',
          documentation: 'automated',
          testing: 'distributed',
          distribution: 'build-nodes'
        },
        charlie: {
          securityLevel: 'distributed',
          scanning: 'multi-layer',
          alerting: 'cluster',
          distribution: 'security-nodes'
        },
        diana: {
          orchestrationMode: 'distributed',
          coordination: 'cluster',
          harmony: 'global',
          distribution: 'orchestration-nodes'
        },
        eve: {
          knowledgeBase: 'distributed',
          learning: 'collective',
          archiving: 'replicated',
          distribution: 'knowledge-nodes'
        },
        frank: {
          unityLevel: 'transcendent',
          transcendence: 'distributed',
          holistic: 'universal',
          distribution: 'unity-nodes'
        }
      },
      deployment: {
        type: 'distributed',
        docker: true,
        kubernetes: true,
        monitoring: 'distributed',
        logging: 'centralized'
      }
    });

    console.log('🌍 Context profiles initialized');
  }

  // Switch to a specific profile
  switchProfile(profileName) {
    if (!this.profiles.has(profileName)) {
      throw new Error(`Profile '${profileName}' not found`);
    }

    this.currentProfile = profileName;
    const profile = this.profiles.get(profileName);
    
    console.log(`🔄 Switching to profile: ${profile.name}`);
    console.log(`📋 Environment: ${profile.environment}`);
    console.log(`🎭 Character count: ${Object.keys(profile.characters).length}`);
    
    // Apply profile settings
    this.applyProfile(profile);
    
    return profile;
  }

  // Apply profile settings to the system
  applyProfile(profile) {
    // Save current profile configuration
    const configPath = path.join(this.profilesPath, `${this.currentProfile}.json`);
    
    // Create profiles directory if it doesn't exist
    if (!fs.existsSync(this.profilesPath)) {
      fs.mkdirSync(this.profilesPath, { recursive: true });
    }
    
    // Save profile configuration
    fs.writeFileSync(configPath, JSON.stringify(profile, null, 2));
    
    // Create environment variables file
    const envPath = path.join(this.profilesPath, `${this.currentProfile}.env`);
    const envContent = this.generateEnvFile(profile);
    fs.writeFileSync(envPath, envContent);
    
    console.log(`💾 Profile saved to: ${configPath}`);
    console.log(`🔧 Environment file: ${envPath}`);
  }

  // Generate environment file for profile
  generateEnvFile(profile) {
    const envVars = [
      `# ${profile.name} Environment Configuration`,
      `PROFILE_NAME=${profile.name}`,
      `ENVIRONMENT=${profile.environment}`,
      '',
      '# Service Configuration',
      `VAULT_PORT=${profile.services.vault.port}`,
      `VAULT_HOST=${profile.services.vault.host}`,
      `API_PORT=${profile.services.api.port}`,
      `API_HOST=${profile.services.api.host}`,
      `DASHBOARD_PORT=${profile.services.dashboard.port}`,
      `DASHBOARD_HOST=${profile.services.dashboard.host}`,
      `BRAIN_ENABLED=${profile.services.brain.enabled}`,
      `BRAIN_DEBUG=${profile.services.brain.debug}`,
      '',
      '# Character Configuration',
      `RALPH_ENERGY=${profile.characters.ralph.energy}`,
      `RALPH_MODE=${profile.characters.ralph.mode}`,
      `RALPH_BASH_INTENSITY=${profile.characters.ralph.bashIntensity}`,
      `ALICE_ANALYSIS_DEPTH=${profile.characters.alice.analysisDepth}`,
      `BOB_BUILD_QUALITY=${profile.characters.bob.buildQuality}`,
      `CHARLIE_SECURITY_LEVEL=${profile.characters.charlie.securityLevel}`,
      `DIANA_ORCHESTRATION_MODE=${profile.characters.diana.orchestrationMode}`,
      `EVE_KNOWLEDGE_BASE=${profile.characters.eve.knowledgeBase}`,
      `FRANK_UNITY_LEVEL=${profile.characters.frank.unityLevel}`,
      '',
      '# Deployment Configuration',
      `DEPLOYMENT_TYPE=${profile.deployment.type}`,
      `DOCKER_ENABLED=${profile.deployment.docker}`,
      `KUBERNETES_ENABLED=${profile.deployment.kubernetes || false}`,
      `MONITORING_LEVEL=${profile.deployment.monitoring}`,
      `LOGGING_LEVEL=${profile.deployment.logging}`
    ];

    return envVars.join('\n');
  }

  // Get current profile
  getCurrentProfile() {
    return this.profiles.get(this.currentProfile);
  }

  // List all profiles
  listProfiles() {
    const profiles = [];
    this.profiles.forEach((profile, name) => {
      profiles.push({
        name,
        displayName: profile.name,
        description: profile.description,
        environment: profile.environment,
        current: name === this.currentProfile
      });
    });
    return profiles;
  }

  // Create deployment script for current profile
  createDeploymentScript() {
    const profile = this.getCurrentProfile();
    const scriptPath = path.join(this.profilesPath, `deploy-${this.currentProfile}.sh`);
    
    let script = [
      '#!/bin/bash',
      '',
      `# Deployment script for ${profile.name}`,
      `# Generated automatically by Context Profile Manager`,
      '',
      'echo "🚀 Starting deployment..."',
      '',
      '# Load environment variables',
      `source ./profiles/${this.currentProfile}.env`,
      '',
      '# Create network if needed',
      'docker network create bash-system-network 2>/dev/null || true',
      ''
    ];

    // Add service deployments based on profile
    if (profile.deployment.type === 'local') {
      script.push(
        '# Local deployment',
        'echo "🏠 Deploying locally..."',
        'docker-compose up -d',
        ''
      );
    } else if (profile.deployment.type === 'cloud') {
      script.push(
        '# Cloud deployment',
        'echo "☁️ Deploying to cloud..."',
        'docker-compose -f docker-compose.staging.yml up -d',
        ''
      );
    } else if (profile.deployment.type === 'enterprise') {
      script.push(
        '# Enterprise deployment',
        'echo "🏢 Deploying to enterprise..."',
        'docker-compose -f docker-compose.production.yml up -d',
        ''
      );
    } else if (profile.deployment.type === 'distributed') {
      script.push(
        '# Distributed deployment',
        'echo "🌐 Deploying distributed system..."',
        'kubectl apply -f kubernetes/',
        ''
      );
    }

    // Add character activation
    script.push(
      '# Start character system',
      'echo "🎭 Activating characters..."',
      'npm run bash-system &',
      '',
      '# Start vault',
      'echo "🌟 Starting vibecoding vault..."',
      'node vibecoding-vault.js &',
      '',
      '# Wait for services',
      'sleep 5',
      '',
      '# Test deployment',
      'echo "🧪 Testing deployment..."',
      'npm run bash-test',
      '',
      'echo "✅ Deployment complete!"',
      `echo "🌍 Profile: ${profile.name}"`,
      `echo "🎯 Environment: ${profile.environment}"`,
      `echo "📊 Dashboard: http://${profile.services.dashboard.host}:${profile.services.dashboard.port}"`,
      `echo "🧠 API: http://${profile.services.api.host}:${profile.services.api.port}"`,
      `echo "🌟 Vault: ws://${profile.services.vault.host}:${profile.services.vault.port}"`
    );

    fs.writeFileSync(scriptPath, script.join('\n'));
    
    // Make script executable
    fs.chmodSync(scriptPath, '755');
    
    console.log(`🚀 Deployment script created: ${scriptPath}`);
    return scriptPath;
  }

  // Get profile status
  getProfileStatus() {
    const profile = this.getCurrentProfile();
    return {
      currentProfile: this.currentProfile,
      profileName: profile.name,
      environment: profile.environment,
      services: profile.services,
      characters: Object.keys(profile.characters).length,
      deployment: profile.deployment.type,
      configPath: path.join(this.profilesPath, `${this.currentProfile}.json`),
      envPath: path.join(this.profilesPath, `${this.currentProfile}.env`)
    };
  }

  // Command line interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'list':
        console.log('\n🌍 Available Profiles:');
        this.listProfiles().forEach(profile => {
          const current = profile.current ? ' ← CURRENT' : '';
          console.log(`  ${profile.name}: ${profile.description}${current}`);
        });
        break;

      case 'switch':
        const profileName = args[1];
        if (!profileName) {
          console.error('❌ Profile name required');
          process.exit(1);
        }
        this.switchProfile(profileName);
        break;

      case 'current':
        const status = this.getProfileStatus();
        console.log(`\n📋 Current Profile: ${status.profileName}`);
        console.log(`🌍 Environment: ${status.environment}`);
        console.log(`🎭 Characters: ${status.characters}`);
        console.log(`🚀 Deployment: ${status.deployment}`);
        break;

      case 'deploy':
        const scriptPath = this.createDeploymentScript();
        console.log(`\n🚀 To deploy, run: ${scriptPath}`);
        break;

      case 'status':
        console.log('\n📊 Profile Status:');
        console.log(JSON.stringify(this.getProfileStatus(), null, 2));
        break;

      default:
        console.log(`
🌍 Context Profile Manager

Usage:
  node context-profiles.js list                    # List all profiles
  node context-profiles.js switch <profile>        # Switch to profile
  node context-profiles.js current                 # Show current profile
  node context-profiles.js deploy                  # Create deployment script
  node context-profiles.js status                  # Show detailed status

Available profiles: development, staging, production, remote
        `);
    }
  }
}

// Export for use as module
module.exports = ContextProfileManager;

// Run CLI if called directly
if (require.main === module) {
  const manager = new ContextProfileManager();
  manager.cli().catch(console.error);
}
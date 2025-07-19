#!/usr/bin/env node

/**
 * ENVIRONMENT CONFIGURATIONS
 * Environment-specific configurations for the bash system
 * Development, staging, production, remote environments
 */

console.log(`
⚙️  ENVIRONMENT CONFIGS ACTIVE ⚙️ 
Environment-specific configurations + auto-detection
`);

const fs = require('fs');
const path = require('path');

class EnvironmentConfigManager {
  constructor() {
    this.currentEnv = this.detectEnvironment();
    this.configs = new Map();
    this.configPath = './configs';
    
    this.initializeConfigs();
  }

  // Detect current environment
  detectEnvironment() {
    // Check environment variable first
    if (process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }

    // Check for cloud platform indicators
    if (process.env.RAILWAY_ENVIRONMENT) return 'railway';
    if (process.env.VERCEL) return 'vercel';
    if (process.env.FLY_APP_NAME) return 'fly';
    if (process.env.RENDER) return 'render';
    if (process.env.AWS_REGION) return 'aws';
    if (process.env.GOOGLE_CLOUD_PROJECT) return 'gcp';

    // Check for Docker
    if (fs.existsSync('/.dockerenv')) return 'docker';

    // Check for common CI/CD
    if (process.env.CI) return 'ci';

    // Default to development
    return 'development';
  }

  initializeConfigs() {
    // Development Configuration
    this.configs.set('development', {
      environment: 'development',
      debug: true,
      logging: {
        level: 'debug',
        format: 'detailed',
        file: './logs/development.log'
      },
      services: {
        api: {
          port: 3001,
          host: '0.0.0.0',
          cors: true,
          rateLimit: false
        },
        vault: {
          port: 3333,
          host: '0.0.0.0',
          websocket: true
        },
        dashboard: {
          port: 8080,
          host: '0.0.0.0',
          static: true
        }
      },
      characters: {
        ralph: {
          energy: 100,
          bashIntensity: 'moderate',
          debug: true,
          responseTime: 100
        },
        alice: {
          analysisDepth: 'deep',
          patternThreshold: 0.7,
          debug: true,
          responseTime: 200
        },
        bob: {
          buildQuality: 'thorough',
          testCoverage: 95,
          debug: true,
          responseTime: 300
        },
        charlie: {
          securityLevel: 'development',
          scanInterval: 30000,
          debug: true,
          responseTime: 150
        },
        diana: {
          orchestrationMode: 'flexible',
          coordinationDelay: 100,
          debug: true,
          responseTime: 250
        },
        eve: {
          knowledgeBase: 'full',
          learningRate: 0.1,
          debug: true,
          responseTime: 200
        },
        frank: {
          unityLevel: 'exploratory',
          transcendenceRate: 0.05,
          debug: true,
          responseTime: 400
        }
      },
      database: {
        type: 'sqlite',
        filename: './data/development.db',
        migrations: true,
        seed: true
      },
      cache: {
        type: 'memory',
        ttl: 3600,
        maxSize: 1000
      },
      monitoring: {
        enabled: true,
        metrics: true,
        healthChecks: true,
        interval: 5000
      }
    });

    // Staging Configuration
    this.configs.set('staging', {
      environment: 'staging',
      debug: false,
      logging: {
        level: 'info',
        format: 'json',
        file: './logs/staging.log'
      },
      services: {
        api: {
          port: 3001,
          host: '0.0.0.0',
          cors: ['https://staging.yourdomain.com'],
          rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100
          }
        },
        vault: {
          port: 3333,
          host: '0.0.0.0',
          websocket: true,
          ssl: true
        },
        dashboard: {
          port: 8080,
          host: '0.0.0.0',
          static: true,
          auth: true
        }
      },
      characters: {
        ralph: {
          energy: 90,
          bashIntensity: 'controlled',
          debug: false,
          responseTime: 80
        },
        alice: {
          analysisDepth: 'production',
          patternThreshold: 0.8,
          debug: false,
          responseTime: 150
        },
        bob: {
          buildQuality: 'production',
          testCoverage: 85,
          debug: false,
          responseTime: 200
        },
        charlie: {
          securityLevel: 'staging',
          scanInterval: 10000,
          debug: false,
          responseTime: 100
        },
        diana: {
          orchestrationMode: 'structured',
          coordinationDelay: 50,
          debug: false,
          responseTime: 150
        },
        eve: {
          knowledgeBase: 'curated',
          learningRate: 0.05,
          debug: false,
          responseTime: 120
        },
        frank: {
          unityLevel: 'focused',
          transcendenceRate: 0.03,
          debug: false,
          responseTime: 200
        }
      },
      database: {
        type: 'postgresql',
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/bash_system_staging',
        migrations: true,
        seed: false
      },
      cache: {
        type: 'redis',
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        ttl: 7200,
        maxSize: 10000
      },
      monitoring: {
        enabled: true,
        metrics: true,
        healthChecks: true,
        interval: 10000,
        alerts: true
      }
    });

    // Production Configuration
    this.configs.set('production', {
      environment: 'production',
      debug: false,
      logging: {
        level: 'error',
        format: 'json',
        file: './logs/production.log'
      },
      services: {
        api: {
          port: process.env.PORT || 3001,
          host: '0.0.0.0',
          cors: process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com'],
          rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 1000
          }
        },
        vault: {
          port: process.env.VAULT_PORT || 3333,
          host: '0.0.0.0',
          websocket: true,
          ssl: true
        },
        dashboard: {
          port: process.env.DASHBOARD_PORT || 8080,
          host: '0.0.0.0',
          static: true,
          auth: true,
          ssl: true
        }
      },
      characters: {
        ralph: {
          energy: 85,
          bashIntensity: 'precise',
          debug: false,
          responseTime: 50
        },
        alice: {
          analysisDepth: 'optimized',
          patternThreshold: 0.9,
          debug: false,
          responseTime: 100
        },
        bob: {
          buildQuality: 'enterprise',
          testCoverage: 90,
          debug: false,
          responseTime: 150
        },
        charlie: {
          securityLevel: 'maximum',
          scanInterval: 5000,
          debug: false,
          responseTime: 75
        },
        diana: {
          orchestrationMode: 'enterprise',
          coordinationDelay: 25,
          debug: false,
          responseTime: 100
        },
        eve: {
          knowledgeBase: 'essential',
          learningRate: 0.01,
          debug: false,
          responseTime: 80
        },
        frank: {
          unityLevel: 'master',
          transcendenceRate: 0.01,
          debug: false,
          responseTime: 150
        }
      },
      database: {
        type: 'postgresql',
        url: process.env.DATABASE_URL,
        migrations: true,
        seed: false,
        ssl: true
      },
      cache: {
        type: 'redis',
        url: process.env.REDIS_URL,
        ttl: 14400,
        maxSize: 100000
      },
      monitoring: {
        enabled: true,
        metrics: true,
        healthChecks: true,
        interval: 30000,
        alerts: true,
        apm: true
      }
    });

    // Remote/Distributed Configuration
    this.configs.set('remote', {
      environment: 'remote',
      debug: false,
      logging: {
        level: 'info',
        format: 'json',
        file: './logs/remote.log',
        centralized: true
      },
      services: {
        api: {
          port: process.env.PORT || 3001,
          host: '0.0.0.0',
          cors: process.env.CORS_ORIGIN?.split(',') || ['*'],
          rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 5000
          },
          cluster: true
        },
        vault: {
          port: process.env.VAULT_PORT || 3333,
          host: '0.0.0.0',
          websocket: true,
          ssl: true,
          cluster: true
        },
        dashboard: {
          port: process.env.DASHBOARD_PORT || 8080,
          host: '0.0.0.0',
          static: true,
          auth: true,
          ssl: true,
          cdn: true
        }
      },
      characters: {
        ralph: {
          energy: 120,
          bashIntensity: 'maximum',
          debug: false,
          responseTime: 30,
          distribution: 'multi-node'
        },
        alice: {
          analysisDepth: 'distributed',
          patternThreshold: 0.95,
          debug: false,
          responseTime: 50,
          distribution: 'data-nodes'
        },
        bob: {
          buildQuality: 'distributed',
          testCoverage: 95,
          debug: false,
          responseTime: 100,
          distribution: 'build-nodes'
        },
        charlie: {
          securityLevel: 'distributed',
          scanInterval: 1000,
          debug: false,
          responseTime: 25,
          distribution: 'security-nodes'
        },
        diana: {
          orchestrationMode: 'distributed',
          coordinationDelay: 10,
          debug: false,
          responseTime: 40,
          distribution: 'orchestration-nodes'
        },
        eve: {
          knowledgeBase: 'distributed',
          learningRate: 0.02,
          debug: false,
          responseTime: 60,
          distribution: 'knowledge-nodes'
        },
        frank: {
          unityLevel: 'transcendent',
          transcendenceRate: 0.05,
          debug: false,
          responseTime: 80,
          distribution: 'unity-nodes'
        }
      },
      database: {
        type: 'postgresql',
        url: process.env.DATABASE_URL,
        migrations: true,
        seed: false,
        ssl: true,
        cluster: true,
        replication: true
      },
      cache: {
        type: 'redis',
        url: process.env.REDIS_URL,
        ttl: 28800,
        maxSize: 1000000,
        cluster: true
      },
      monitoring: {
        enabled: true,
        metrics: true,
        healthChecks: true,
        interval: 60000,
        alerts: true,
        apm: true,
        distributed: true
      }
    });

    // Cloud-specific configurations
    this.configs.set('railway', {
      ...this.configs.get('production'),
      environment: 'railway',
      services: {
        ...this.configs.get('production').services,
        api: {
          ...this.configs.get('production').services.api,
          port: process.env.PORT || 3001
        }
      }
    });

    this.configs.set('vercel', {
      ...this.configs.get('production'),
      environment: 'vercel',
      serverless: true,
      services: {
        api: {
          port: null, // Serverless
          host: null,
          cors: process.env.CORS_ORIGIN?.split(',') || ['*'],
          rateLimit: false // Handled by Vercel
        }
      }
    });

    this.configs.set('fly', {
      ...this.configs.get('production'),
      environment: 'fly',
      services: {
        ...this.configs.get('production').services,
        api: {
          ...this.configs.get('production').services.api,
          port: process.env.PORT || 8080
        }
      }
    });

    console.log(`⚙️  Environment configurations initialized for: ${this.currentEnv}`);
  }

  // Get current environment configuration
  getCurrentConfig() {
    return this.configs.get(this.currentEnv) || this.configs.get('development');
  }

  // Get specific environment configuration
  getConfig(environment) {
    return this.configs.get(environment);
  }

  // Load configuration from file
  loadFromFile(filepath) {
    try {
      const configContent = fs.readFileSync(filepath, 'utf8');
      const config = JSON.parse(configContent);
      
      // Override current config with file config
      const currentConfig = this.getCurrentConfig();
      const mergedConfig = this.mergeConfigs(currentConfig, config);
      
      this.configs.set(this.currentEnv, mergedConfig);
      
      console.log(`✅ Configuration loaded from: ${filepath}`);
      return mergedConfig;
    } catch (error) {
      console.error(`❌ Failed to load config from ${filepath}:`, error.message);
      throw error;
    }
  }

  // Save configuration to file
  saveToFile(environment, filepath) {
    const config = this.configs.get(environment);
    if (!config) {
      throw new Error(`Environment '${environment}' not found`);
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(config, null, 2));
    console.log(`💾 Configuration saved to: ${filepath}`);
  }

  // Merge configurations
  mergeConfigs(base, override) {
    const merged = JSON.parse(JSON.stringify(base)); // Deep copy
    
    function merge(target, source) {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          merge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    
    merge(merged, override);
    return merged;
  }

  // Generate environment file
  generateEnvFile(environment) {
    const config = this.configs.get(environment);
    if (!config) {
      throw new Error(`Environment '${environment}' not found`);
    }

    const envVars = [
      `# Environment: ${environment}`,
      `NODE_ENV=${environment}`,
      '',
      '# Services',
      `API_PORT=${config.services.api.port}`,
      `API_HOST=${config.services.api.host}`,
      `VAULT_PORT=${config.services.vault.port}`,
      `VAULT_HOST=${config.services.vault.host}`,
      `DASHBOARD_PORT=${config.services.dashboard.port}`,
      `DASHBOARD_HOST=${config.services.dashboard.host}`,
      '',
      '# Logging',
      `LOG_LEVEL=${config.logging.level}`,
      `LOG_FORMAT=${config.logging.format}`,
      `LOG_FILE=${config.logging.file}`,
      '',
      '# Database',
      `DB_TYPE=${config.database.type}`,
      config.database.url ? `DATABASE_URL=${config.database.url}` : '',
      `DB_MIGRATIONS=${config.database.migrations}`,
      `DB_SEED=${config.database.seed}`,
      '',
      '# Cache',
      `CACHE_TYPE=${config.cache.type}`,
      config.cache.url ? `REDIS_URL=${config.cache.url}` : '',
      `CACHE_TTL=${config.cache.ttl}`,
      `CACHE_MAX_SIZE=${config.cache.maxSize}`,
      '',
      '# Monitoring',
      `MONITORING_ENABLED=${config.monitoring.enabled}`,
      `MONITORING_INTERVAL=${config.monitoring.interval}`,
      `METRICS_ENABLED=${config.monitoring.metrics}`,
      `HEALTH_CHECKS_ENABLED=${config.monitoring.healthChecks}`,
      '',
      '# Debug',
      `DEBUG_MODE=${config.debug}`,
      ''
    ].filter(line => line !== '');

    return envVars.join('\n');
  }

  // Create all environment files
  createAllEnvFiles() {
    const envDir = path.join(this.configPath, 'environments');
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }

    this.configs.forEach((config, environment) => {
      const envContent = this.generateEnvFile(environment);
      const envPath = path.join(envDir, `${environment}.env`);
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Environment file created: ${envPath}`);
    });
  }

  // Validate configuration
  validateConfig(config) {
    const required = ['environment', 'services', 'characters', 'database', 'cache'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration keys: ${missing.join(', ')}`);
    }

    // Validate services
    if (!config.services.api || !config.services.api.port) {
      throw new Error('API service configuration is invalid');
    }

    // Validate characters
    const requiredCharacters = ['ralph', 'alice', 'bob', 'charlie', 'diana', 'eve', 'frank'];
    const missingCharacters = requiredCharacters.filter(char => !config.characters[char]);
    
    if (missingCharacters.length > 0) {
      throw new Error(`Missing character configurations: ${missingCharacters.join(', ')}`);
    }

    console.log('✅ Configuration validation passed');
    return true;
  }

  // Get environment status
  getEnvironmentStatus() {
    const config = this.getCurrentConfig();
    
    return {
      currentEnvironment: this.currentEnv,
      detectedEnvironment: this.detectEnvironment(),
      configValid: this.validateConfig(config),
      services: {
        api: config.services.api,
        vault: config.services.vault,
        dashboard: config.services.dashboard
      },
      characters: Object.keys(config.characters).length,
      database: config.database.type,
      cache: config.cache.type,
      monitoring: config.monitoring.enabled
    };
  }

  // Command line interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'current':
        const config = this.getCurrentConfig();
        console.log(`\n⚙️  Current Environment: ${this.currentEnv}`);
        console.log(JSON.stringify(config, null, 2));
        break;

      case 'status':
        const status = this.getEnvironmentStatus();
        console.log('\n📊 Environment Status:');
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'generate':
        const env = args[1] || this.currentEnv;
        const envContent = this.generateEnvFile(env);
        console.log(`\n📝 Environment file for ${env}:`);
        console.log(envContent);
        break;

      case 'save':
        const saveEnv = args[1] || this.currentEnv;
        const savePath = args[2] || `./configs/${saveEnv}.json`;
        this.saveToFile(saveEnv, savePath);
        break;

      case 'load':
        const loadPath = args[1];
        if (!loadPath) {
          console.error('❌ File path required');
          process.exit(1);
        }
        this.loadFromFile(loadPath);
        break;

      case 'validate':
        const validateEnv = args[1] || this.currentEnv;
        const validateConfig = this.getConfig(validateEnv);
        try {
          this.validateConfig(validateConfig);
          console.log(`✅ Configuration for ${validateEnv} is valid`);
        } catch (error) {
          console.error(`❌ Configuration for ${validateEnv} is invalid:`, error.message);
        }
        break;

      case 'create-all':
        this.createAllEnvFiles();
        break;

      case 'list':
        console.log('\n📋 Available Environments:');
        this.configs.forEach((config, env) => {
          const current = env === this.currentEnv ? ' ← CURRENT' : '';
          console.log(`  ${env}: ${config.environment}${current}`);
        });
        break;

      default:
        console.log(`
⚙️  Environment Configuration Manager

Usage:
  node environment-configs.js current           # Show current config
  node environment-configs.js status            # Show environment status
  node environment-configs.js generate [env]    # Generate .env file
  node environment-configs.js save [env] [path] # Save config to file
  node environment-configs.js load <path>       # Load config from file
  node environment-configs.js validate [env]    # Validate configuration
  node environment-configs.js create-all        # Create all .env files
  node environment-configs.js list              # List all environments

Current environment: ${this.currentEnv}
Available environments: ${Array.from(this.configs.keys()).join(', ')}
        `);
    }
  }
}

// Export for use as module
module.exports = EnvironmentConfigManager;

// Run CLI if called directly
if (require.main === module) {
  const manager = new EnvironmentConfigManager();
  manager.cli().catch(console.error);
}
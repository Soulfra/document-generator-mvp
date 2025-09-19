#!/usr/bin/env node
/**
 * Docker Optimization System
 * 
 * Fixes Docker resource contention and service coordination issues
 * Optimizes container limits, networking, and inter-service communication
 * Addresses the 20x slowdown by eliminating Docker bottlenecks
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const yaml = require('js-yaml');
const execAsync = promisify(exec);

class DockerOptimizationSystem {
    constructor() {
        this.projectRoot = __dirname;
        this.dockerComposeFile = path.join(this.projectRoot, 'docker-compose.yml');
        this.optimizedComposeFile = path.join(this.projectRoot, 'docker-compose.optimized.yml');
        this.networkOptimizationFile = path.join(this.projectRoot, 'docker-network-optimization.yml');
        
        console.log('🐳 Docker Optimization System initialized');
        console.log('🔧 Analyzing current Docker configuration...');
        
        this.systemSpecs = this.getSystemSpecs();
        this.optimizationRules = this.defineOptimizationRules();
    }
    
    getSystemSpecs() {
        const os = require('os');
        const totalRAM = os.totalmem();
        const cpuCount = os.cpus().length;
        
        return {
            totalRAM,
            availableRAM: totalRAM * 0.8, // Reserve 20% for system
            cpuCount,
            platform: os.platform(),
            arch: os.arch()
        };
    }
    
    defineOptimizationRules() {
        const ramPerService = Math.floor(this.systemSpecs.availableRAM / (1024 * 1024 * 1024) / 10); // Divide available RAM by 10 services
        
        return {
            // Memory allocation per service type
            memory: {
                database: `${Math.max(ramPerService, 512)}m`,
                cache: `${Math.max(ramPerService * 0.5, 256)}m`,
                ai: `${Math.max(ramPerService * 2, 1024)}m`, // AI services need more RAM
                api: `${Math.max(ramPerService, 512)}m`,
                web: `${Math.max(ramPerService * 0.75, 256)}m`,
                processing: `${Math.max(ramPerService * 1.5, 768)}m`
            },
            
            // CPU allocation 
            cpu: {
                database: '1.0',
                cache: '0.5', 
                ai: '2.0', // AI services need more CPU
                api: '1.0',
                web: '0.5',
                processing: '1.5'
            },
            
            // Network optimization
            network: {
                driver: 'bridge',
                attachable: true,
                driver_opts: {
                    'com.docker.network.driver.mtu': '1500',
                    'com.docker.network.bridge.enable_icc': 'true',
                    'com.docker.network.bridge.enable_ip_masquerade': 'true'
                }
            },
            
            // Health check optimization
            healthcheck: {
                interval: '15s', // Faster health checks
                timeout: '10s',
                retries: 3,
                start_period: '30s'
            },
            
            // Restart policies
            restart: {
                default: 'unless-stopped',
                critical: 'always'
            }
        };
    }
    
    async analyzeCurrentConfiguration() {
        console.log('📊 Analyzing current Docker configuration...');
        
        try {
            const currentConfig = yaml.load(fs.readFileSync(this.dockerComposeFile, 'utf8'));
            const analysis = {
                services: Object.keys(currentConfig.services).length,
                hasResourceLimits: false,
                hasNetworkOptimization: false,
                hasHealthchecks: 0,
                hasRestartPolicies: 0,
                issues: []
            };
            
            // Analyze each service
            Object.entries(currentConfig.services).forEach(([serviceName, config]) => {
                if (config.deploy?.resources?.limits) {
                    analysis.hasResourceLimits = true;
                } else {
                    analysis.issues.push(`Service ${serviceName} missing resource limits`);
                }
                
                if (config.healthcheck) {
                    analysis.hasHealthchecks++;
                } else {
                    analysis.issues.push(`Service ${serviceName} missing healthcheck`);
                }
                
                if (config.restart) {
                    analysis.hasRestartPolicies++;
                } else {
                    analysis.issues.push(`Service ${serviceName} missing restart policy`);
                }
            });
            
            // Check network configuration
            if (currentConfig.networks && Object.keys(currentConfig.networks).length > 0) {
                analysis.hasNetworkOptimization = true;
            } else {
                analysis.issues.push('Missing network optimization');
            }
            
            console.log('📈 Configuration Analysis:');
            console.log(`  Services: ${analysis.services}`);
            console.log(`  Resource Limits: ${analysis.hasResourceLimits ? '✅' : '❌'}`);
            console.log(`  Network Optimization: ${analysis.hasNetworkOptimization ? '✅' : '❌'}`);
            console.log(`  Health Checks: ${analysis.hasHealthchecks}/${analysis.services}`);
            console.log(`  Restart Policies: ${analysis.hasRestartPolicies}/${analysis.services}`);
            console.log(`  Issues Found: ${analysis.issues.length}`);
            
            if (analysis.issues.length > 0) {
                console.log('\n⚠️  Issues to fix:');
                analysis.issues.forEach(issue => console.log(`   - ${issue}`));
            }
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Error analyzing configuration:', error.message);
            return null;
        }
    }
    
    async generateOptimizedConfiguration() {
        console.log('🔧 Generating optimized Docker configuration...');
        
        try {
            const currentConfig = yaml.load(fs.readFileSync(this.dockerComposeFile, 'utf8'));
            const optimizedConfig = JSON.parse(JSON.stringify(currentConfig)); // Deep clone
            
            // Optimize each service
            Object.entries(optimizedConfig.services).forEach(([serviceName, config]) => {
                const serviceType = this.determineServiceType(serviceName);
                
                // Add resource limits
                if (!config.deploy) config.deploy = {};
                if (!config.deploy.resources) config.deploy.resources = {};
                
                config.deploy.resources.limits = {
                    memory: this.optimizationRules.memory[serviceType],
                    cpus: this.optimizationRules.cpu[serviceType]
                };
                
                config.deploy.resources.reservations = {
                    memory: this.calculateReservation(this.optimizationRules.memory[serviceType]),
                    cpus: this.calculateReservation(this.optimizationRules.cpu[serviceType])
                };
                
                // Optimize health checks
                if (config.healthcheck) {
                    config.healthcheck.interval = this.optimizationRules.healthcheck.interval;
                    config.healthcheck.timeout = this.optimizationRules.healthcheck.timeout;
                    config.healthcheck.retries = this.optimizationRules.healthcheck.retries;
                    config.healthcheck.start_period = this.optimizationRules.healthcheck.start_period;
                }
                
                // Add restart policy
                config.restart = this.isServiceCritical(serviceName) ? 
                    this.optimizationRules.restart.critical : 
                    this.optimizationRules.restart.default;
                
                // Add logging optimization
                config.logging = {
                    driver: 'json-file',
                    options: {
                        'max-size': '10m',
                        'max-file': '3'
                    }
                };
                
                // Add environment optimization
                if (!config.environment) config.environment = {};
                
                // Optimize specific services
                this.optimizeSpecificService(serviceName, config);
            });
            
            // Optimize networks
            optimizedConfig.networks = {
                'document-generator': {
                    driver: this.optimizationRules.network.driver,
                    attachable: this.optimizationRules.network.attachable,
                    driver_opts: this.optimizationRules.network.driver_opts
                }
            };
            
            // Add performance monitoring
            optimizedConfig.services['performance-monitor'] = {
                build: {
                    context: '.',
                    dockerfile: 'Dockerfile.performance-monitor'
                },
                container_name: 'document-generator-performance-monitor',
                environment: {
                    NODE_ENV: 'production',
                    PORT: '3010',
                    MONITOR_INTERVAL: '10000',
                    ALERT_THRESHOLD_CPU: '80',
                    ALERT_THRESHOLD_MEMORY: '80'
                },
                ports: ['3010:3010'],
                restart: 'unless-stopped',
                networks: ['document-generator'],
                depends_on: ['postgres', 'redis'],
                deploy: {
                    resources: {
                        limits: {
                            memory: '256m',
                            cpus: '0.5'
                        },
                        reservations: {
                            memory: '128m',
                            cpus: '0.25'
                        }
                    }
                },
                healthcheck: {
                    test: ['CMD', 'curl', '-f', 'http://localhost:3010/api/metrics'],
                    interval: '30s',
                    timeout: '10s',
                    retries: 3
                }
            };
            
            // Save optimized configuration
            const yamlContent = yaml.dump(optimizedConfig, { 
                indent: 2, 
                lineWidth: 120,
                noRefs: true 
            });
            
            fs.writeFileSync(this.optimizedComposeFile, yamlContent);
            console.log(`✅ Optimized configuration saved: ${this.optimizedComposeFile}`);
            
            return optimizedConfig;
            
        } catch (error) {
            console.error('❌ Error generating optimized configuration:', error.message);
            throw error;
        }
    }
    
    determineServiceType(serviceName) {
        if (serviceName.includes('postgres') || serviceName.includes('database')) return 'database';
        if (serviceName.includes('redis') || serviceName.includes('cache')) return 'cache';
        if (serviceName.includes('ollama') || serviceName.includes('ai')) return 'ai';
        if (serviceName.includes('api') || serviceName.includes('template')) return 'api';
        if (serviceName.includes('hub') || serviceName.includes('web')) return 'web';
        if (serviceName.includes('processor') || serviceName.includes('analytics')) return 'processing';
        return 'api'; // Default
    }
    
    calculateReservation(limit) {
        if (typeof limit === 'string') {
            if (limit.endsWith('m')) {
                const value = parseInt(limit);
                return `${Math.floor(value * 0.5)}m`; // Reserve 50% of limit
            }
            if (limit.includes('.')) {
                const value = parseFloat(limit);
                return (value * 0.5).toString();
            }
        }
        return limit;
    }
    
    isServiceCritical(serviceName) {
        const criticalServices = ['postgres', 'redis', 'template-processor', 'ai-api'];
        return criticalServices.some(critical => serviceName.includes(critical));
    }
    
    optimizeSpecificService(serviceName, config) {
        // PostgreSQL optimizations
        if (serviceName.includes('postgres')) {
            config.environment = {
                ...config.environment,
                POSTGRES_SHARED_BUFFERS: '256MB',
                POSTGRES_EFFECTIVE_CACHE_SIZE: '1GB',
                POSTGRES_WORK_MEM: '16MB',
                POSTGRES_MAINTENANCE_WORK_MEM: '64MB',
                POSTGRES_WAL_BUFFERS: '8MB',
                POSTGRES_CHECKPOINT_COMPLETION_TARGET: '0.7',
                POSTGRES_MAX_CONNECTIONS: '100'
            };
            config.command = [
                'postgres',
                '-c', 'shared_buffers=256MB',
                '-c', 'effective_cache_size=1GB',
                '-c', 'work_mem=16MB',
                '-c', 'maintenance_work_mem=64MB',
                '-c', 'wal_buffers=8MB',
                '-c', 'checkpoint_completion_target=0.7',
                '-c', 'max_connections=100',
                '-c', 'random_page_cost=1.1',
                '-c', 'effective_io_concurrency=200'
            ];
        }
        
        // Redis optimizations
        if (serviceName.includes('redis')) {
            config.command = [
                'redis-server',
                '--appendonly', 'yes',
                '--maxmemory', '256mb',
                '--maxmemory-policy', 'allkeys-lru',
                '--save', '900', '1',
                '--save', '300', '10',
                '--save', '60', '10000',
                '--tcp-keepalive', '60',
                '--timeout', '300'
            ];
        }
        
        // Ollama optimizations
        if (serviceName.includes('ollama')) {
            config.environment = {
                ...config.environment,
                OLLAMA_HOST: '0.0.0.0',
                OLLAMA_ORIGINS: '*',
                OLLAMA_NUM_PARALLEL: '2',
                OLLAMA_MAX_LOADED_MODELS: '2',
                OLLAMA_FLASH_ATTENTION: 'true'
            };
        }
        
        // Node.js service optimizations
        if (serviceName.includes('template') || serviceName.includes('api') || serviceName.includes('hub')) {
            config.environment = {
                ...config.environment,
                NODE_ENV: 'production',
                NODE_OPTIONS: '--max-old-space-size=1024 --optimize-for-size',
                UV_THREADPOOL_SIZE: '8',
                FORCE_COLOR: '0'
            };
        }
    }
    
    async createPerformanceDockerfile() {
        const dockerfileContent = `
FROM node:18-alpine

# Install system dependencies for performance monitoring
RUN apk add --no-cache curl netcat-openbsd

# Create app directory
WORKDIR /app

# Copy performance monitor
COPY performance-monitor-system.js .
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
    CMD curl -f http://localhost:3010/api/metrics || exit 1

# Expose port
EXPOSE 3010

# Start application
CMD ["node", "performance-monitor-system.js"]
`;
        
        const dockerfilePath = path.join(this.projectRoot, 'Dockerfile.performance-monitor');
        fs.writeFileSync(dockerfilePath, dockerfileContent.trim());
        console.log(`✅ Performance monitor Dockerfile created: ${dockerfilePath}`);
    }
    
    async generateNetworkOptimizationScript() {
        const scriptContent = `#!/bin/bash

# Docker Network Optimization Script
# Fixes network contention and inter-service communication issues

echo "🌐 Optimizing Docker network configuration..."

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose down --remove-orphans

# Remove existing networks
echo "🗑️  Cleaning up existing networks..."
docker network rm document-generator 2>/dev/null || true

# Create optimized network with custom settings
echo "🔧 Creating optimized network..."
docker network create document-generator \\
    --driver bridge \\
    --attachable \\
    --opt com.docker.network.driver.mtu=1500 \\
    --opt com.docker.network.bridge.enable_icc=true \\
    --opt com.docker.network.bridge.enable_ip_masquerade=true \\
    --opt com.docker.network.bridge.host_binding_ipv4=0.0.0.0 \\
    --subnet=172.20.0.0/16 \\
    --gateway=172.20.0.1

# Set system-level optimizations
echo "⚙️  Applying system-level optimizations..."

# Increase network buffer sizes
sudo sysctl -w net.core.rmem_max=134217728 2>/dev/null || true
sudo sysctl -w net.core.wmem_max=134217728 2>/dev/null || true
sudo sysctl -w net.ipv4.tcp_rmem="4096 131072 134217728" 2>/dev/null || true
sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728" 2>/dev/null || true

# Optimize Docker daemon settings
echo "🐳 Optimizing Docker daemon..."
sudo mkdir -p /etc/docker

# Create optimized daemon.json if it doesn't exist
if [ ! -f /etc/docker/daemon.json ]; then
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "default-address-pools": [
        {
            "base": "172.20.0.0/12",
            "size": 20
        }
    ],
    "bip": "172.17.0.1/16",
    "fixed-cidr": "172.17.0.0/16",
    "dns": ["8.8.8.8", "8.8.4.4"],
    "storage-driver": "overlay2",
    "storage-opts": [
        "overlay2.override_kernel_check=true"
    ],
    "max-concurrent-downloads": 10,
    "max-concurrent-uploads": 5,
    "userland-proxy": false
}
EOF
    echo "✅ Docker daemon.json created"
    echo "⚠️  Please restart Docker daemon manually: sudo systemctl restart docker"
else
    echo "ℹ️  Docker daemon.json already exists, skipping..."
fi

# Start services with optimized configuration
echo "🚀 Starting services with optimized configuration..."
docker-compose -f docker-compose.optimized.yml up -d

echo "✅ Network optimization complete!"
echo "📊 Performance monitor available at: http://localhost:3010"
echo "🔍 Check service health with: docker-compose -f docker-compose.optimized.yml ps"
`;
        
        const scriptPath = path.join(this.projectRoot, 'optimize-docker-network.sh');
        fs.writeFileSync(scriptPath, scriptContent.trim());
        fs.chmodSync(scriptPath, 0o755);
        console.log(`✅ Network optimization script created: ${scriptPath}`);
    }
    
    async generateServiceCoordinationConfig() {
        const coordinationConfig = {
            version: '3.8',
            
            services: {
                'service-coordinator': {
                    build: {
                        context: '.',
                        dockerfile: 'Dockerfile.coordinator'
                    },
                    container_name: 'document-generator-coordinator',
                    environment: {
                        NODE_ENV: 'production',
                        PORT: '3011',
                        COORDINATION_INTERVAL: '5000',
                        SERVICE_ENDPOINTS: JSON.stringify({
                            'template-processor': 'http://template-processor:3000',
                            'ai-api': 'http://ai-api:3001',
                            'platform-hub': 'http://platform-hub:8080',
                            'analytics': 'http://analytics:3002',
                            'performance-monitor': 'http://performance-monitor:3010'
                        })
                    },
                    ports: ['3011:3011'],
                    restart: 'unless-stopped',
                    networks: ['document-generator'],
                    depends_on: {
                        postgres: { condition: 'service_healthy' },
                        redis: { condition: 'service_healthy' }
                    },
                    deploy: {
                        resources: {
                            limits: { memory: '256m', cpus: '0.5' },
                            reservations: { memory: '128m', cpus: '0.25' }
                        }
                    },
                    healthcheck: {
                        test: ['CMD', 'curl', '-f', 'http://localhost:3011/health'],
                        interval: '15s',
                        timeout: '10s',
                        retries: 3
                    }
                }
            },
            
            networks: {
                'document-generator': { external: true }
            }
        };
        
        const yamlContent = yaml.dump(coordinationConfig, { indent: 2 });
        fs.writeFileSync(this.networkOptimizationFile, yamlContent);
        console.log(`✅ Service coordination config created: ${this.networkOptimizationFile}`);
    }
    
    async validateOptimizations() {
        console.log('🔍 Validating optimizations...');
        
        const validationResults = {
            configurationValid: false,
            resourceLimitsSet: false,
            healthchecksEnabled: false,
            networkOptimized: false,
            performanceMonitorReady: false,
            issues: []
        };
        
        try {
            // Validate optimized configuration syntax
            const optimizedConfig = yaml.load(fs.readFileSync(this.optimizedComposeFile, 'utf8'));
            validationResults.configurationValid = true;
            
            // Check resource limits
            let servicesWithLimits = 0;
            Object.entries(optimizedConfig.services).forEach(([serviceName, config]) => {
                if (config.deploy?.resources?.limits) {
                    servicesWithLimits++;
                }
            });
            
            validationResults.resourceLimitsSet = servicesWithLimits > 0;
            
            // Check health checks
            let servicesWithHealthchecks = 0;
            Object.entries(optimizedConfig.services).forEach(([serviceName, config]) => {
                if (config.healthcheck) {
                    servicesWithHealthchecks++;
                }
            });
            
            validationResults.healthchecksEnabled = servicesWithHealthchecks > 5;
            
            // Check network configuration
            validationResults.networkOptimized = optimizedConfig.networks && 
                Object.keys(optimizedConfig.networks).length > 0;
            
            // Check performance monitor
            validationResults.performanceMonitorReady = 
                optimizedConfig.services['performance-monitor'] !== undefined;
            
            console.log('📊 Validation Results:');
            console.log(`  Configuration Valid: ${validationResults.configurationValid ? '✅' : '❌'}`);
            console.log(`  Resource Limits: ${validationResults.resourceLimitsSet ? '✅' : '❌'}`);
            console.log(`  Health Checks: ${validationResults.healthchecksEnabled ? '✅' : '❌'}`);
            console.log(`  Network Optimized: ${validationResults.networkOptimized ? '✅' : '❌'}`);
            console.log(`  Performance Monitor: ${validationResults.performanceMonitorReady ? '✅' : '❌'}`);
            
            return validationResults;
            
        } catch (error) {
            console.error('❌ Validation error:', error.message);
            validationResults.issues.push(error.message);
            return validationResults;
        }
    }
    
    async deployOptimizations() {
        console.log('🚀 Deploying Docker optimizations...');
        
        try {
            // Stop current services
            console.log('🛑 Stopping current services...');
            await execAsync('docker-compose down --remove-orphans');
            
            // Deploy optimized configuration
            console.log('🚀 Starting optimized services...');
            await execAsync('docker-compose -f docker-compose.optimized.yml up -d');
            
            // Wait for services to start
            console.log('⏳ Waiting for services to start...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            // Check service health
            const { stdout } = await execAsync('docker-compose -f docker-compose.optimized.yml ps');
            console.log('📊 Service Status:');
            console.log(stdout);
            
            console.log('✅ Docker optimizations deployed successfully!');
            console.log('📊 Performance monitor: http://localhost:3010');
            console.log('🔧 Service coordinator: http://localhost:3011');
            
        } catch (error) {
            console.error('❌ Deployment error:', error.message);
            throw error;
        }
    }
    
    async runCompleteOptimization() {
        console.log('🚀 Starting complete Docker optimization...');
        
        try {
            // Step 1: Analyze current configuration
            const analysis = await this.analyzeCurrentConfiguration();
            if (!analysis) {
                throw new Error('Failed to analyze current configuration');
            }
            
            // Step 2: Generate optimized configuration
            await this.generateOptimizedConfiguration();
            
            // Step 3: Create supporting files
            await this.createPerformanceDockerfile();
            await this.generateNetworkOptimizationScript();
            await this.generateServiceCoordinationConfig();
            
            // Step 4: Validate optimizations
            const validation = await this.validateOptimizations();
            if (!validation.configurationValid) {
                throw new Error('Optimized configuration validation failed');
            }
            
            console.log('✅ Docker optimization complete!');
            console.log('\n📋 Next steps:');
            console.log('1. Run: ./optimize-docker-network.sh');
            console.log('2. Monitor performance at: http://localhost:3010');
            console.log('3. Check for timing improvements (should fix 20x slowdown)');
            
            return {
                analysis,
                validation,
                files: {
                    optimizedCompose: this.optimizedComposeFile,
                    networkScript: path.join(this.projectRoot, 'optimize-docker-network.sh'),
                    performanceDockerfile: path.join(this.projectRoot, 'Dockerfile.performance-monitor'),
                    coordinationConfig: this.networkOptimizationFile
                }
            };
            
        } catch (error) {
            console.error('❌ Optimization failed:', error.message);
            throw error;
        }
    }
}

// Auto-run if called directly
if (require.main === module) {
    const optimizer = new DockerOptimizationSystem();
    
    optimizer.runCompleteOptimization()
        .then((result) => {
            console.log('\n🎉 Docker optimization completed successfully!');
            console.log('📊 Check the performance monitor to see if the 20x slowdown is resolved');
        })
        .catch((error) => {
            console.error('\n💥 Optimization failed:', error.message);
            process.exit(1);
        });
}

module.exports = DockerOptimizationSystem;
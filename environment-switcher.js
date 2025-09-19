#!/usr/bin/env node

/**
 * Environment Switcher - Context Profile Deployment Tool
 * 
 * Switches between dev/staging/prod/remote contexts by:
 * - Loading appropriate context profiles
 * - Reconfiguring services
 * - Updating character settings
 * - Applying constraints
 * - Validating context integrity
 * 
 * Integrates with the archaeological discovery of multi-environment
 * context architecture and existing FinishThisIdea systems.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class EnvironmentSwitcher {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
        this.currentContext = null;
        this.availableContexts = ['dev', 'staging', 'prod', 'remote'];
        
        // Service management
        this.services = {
            docker: this.manageDockerServices.bind(this),
            processes: this.manageProcesses.bind(this),
            config: this.updateConfiguration.bind(this),
            environment: this.setEnvironmentVariables.bind(this)
        };
        
        // State tracking
        this.previousContext = null;
        this.switchHistory = [];
    }
    
    /**
     * Main switching function
     */
    async switchContext(targetEnvironment, options = {}) {
        const {
            dryRun = false,
            force = false,
            backup = true,
            validate = true
        } = options;
        
        console.log(`🔄 Switching to ${targetEnvironment} context...`);
        
        try {
            // 1. Validate target environment
            await this.validateTargetEnvironment(targetEnvironment);
            
            // 2. Load target context profile
            const targetProfile = await this.loadContextProfile(targetEnvironment);
            
            // 3. Create backup if requested
            if (backup && !dryRun) {
                await this.createContextBackup();
            }
            
            // 4. Prepare for context switch
            await this.prepareContextSwitch(targetProfile, { dryRun });
            
            // 5. Execute the switch
            if (!dryRun) {
                await this.executeContextSwitch(targetProfile);
            } else {
                console.log('🔍 Dry run completed - no changes made');
                return { success: true, dryRun: true, changes: await this.previewChanges(targetProfile) };
            }
            
            // 6. Validate new context
            if (validate) {
                const validation = await this.validateContextSwitch(targetProfile);
                if (!validation.success) {
                    throw new Error(`Context validation failed: ${validation.errors.join(', ')}`);
                }
            }
            
            // 7. Update state
            this.previousContext = this.currentContext;
            this.currentContext = targetEnvironment;
            
            // 8. Record switch in history
            this.switchHistory.push({
                from: this.previousContext,
                to: targetEnvironment,
                timestamp: new Date().toISOString(),
                profile: targetProfile,
                success: true
            });
            
            console.log(`✅ Successfully switched to ${targetEnvironment} context`);
            
            return {
                success: true,
                from: this.previousContext,
                to: targetEnvironment,
                profile: targetProfile,
                services: await this.getServiceStatus()
            };
            
        } catch (error) {
            console.error(`❌ Context switch failed:`, error.message);
            
            // Attempt rollback
            if (!dryRun && this.previousContext) {
                console.log(`🔄 Attempting rollback to ${this.previousContext}...`);
                try {
                    await this.rollbackContext();
                    console.log(`✅ Rolled back to ${this.previousContext}`);
                } catch (rollbackError) {
                    console.error(`❌ Rollback failed:`, rollbackError.message);
                }
            }
            
            throw error;
        }
    }
    
    /**
     * Load context profile for environment
     */
    async loadContextProfile(environment) {
        // Try multiple profile locations
        const possiblePaths = [
            `context-profile-document-generator-${environment}.json`,
            `profiles/context-${environment}.json`,
            `config/${environment}.json`,
            `FinishThisIdea/profiles/${environment}.json`
        ];
        
        for (const profilePath of possiblePaths) {
            try {
                const fullPath = path.resolve(this.baseDir, profilePath);
                const content = await fs.readFile(fullPath, 'utf-8');
                const profile = JSON.parse(content);
                
                console.log(`📄 Loaded profile: ${profilePath}`);
                return profile;
            } catch (error) {
                // Continue trying other paths
            }
        }
        
        throw new Error(`No context profile found for environment: ${environment}`);
    }
    
    /**
     * Execute the actual context switch
     */
    async executeContextSwitch(targetProfile) {
        console.log('🔧 Executing context switch...');
        
        // 1. Update service configurations
        await this.services.config(targetProfile);
        
        // 2. Restart/reconfigure services
        await this.services.docker(targetProfile);
        
        // 3. Update environment variables
        await this.services.environment(targetProfile);
        
        // 4. Apply character settings (personality/constraints)
        await this.applyCharacterSettings(targetProfile);
        
        // 5. Update application configs
        await this.updateApplicationConfigs(targetProfile);
        
        console.log('✅ Context switch execution completed');
    }
    
    /**
     * Apply character settings (personality and constraints)
     */
    async applyCharacterSettings(profile) {
        console.log('🎭 Applying character settings...');
        
        const { personality, constraints } = profile;
        
        // Create character config file
        const characterConfig = {
            environment: profile.environment,
            personality,
            constraints,
            appliedAt: new Date().toISOString()
        };
        
        await this.saveCharacterConfig(characterConfig);
        
        // Apply personality-based service configurations
        await this.applyPersonalitySettings(personality);
        
        // Apply constraints
        await this.applyConstraints(constraints);
    }
    
    /**
     * Apply personality settings to system behavior
     */
    async applyPersonalitySettings(personality) {
        const personalityConfig = {};
        
        // Risk tolerance affects error handling
        personalityConfig.ERROR_TOLERANCE = personality.riskTolerance || 'medium';
        personalityConfig.ERROR_HANDLING = personality.errorHandling || 'strict';
        
        // Debugging level
        personalityConfig.DEBUG_LEVEL = personality.debugging || 'minimal';
        
        // Experimentation settings
        personalityConfig.ALLOW_EXPERIMENTS = personality.experimentation === 'encouraged' || personality.experimentation === 'limited';
        
        await this.updateEnvFile('.env.personality', personalityConfig);
    }
    
    /**
     * Apply constraint settings
     */
    async applyConstraints(constraints) {
        const constraintConfig = {};
        
        // API limits
        constraintConfig.API_RATE_LIMIT = this.translateConstraint(constraints.apiLimits);
        
        // Resource limits
        constraintConfig.MEMORY_LIMIT = this.translateConstraint(constraints.resourceLimits);
        
        // Security settings
        constraintConfig.SECURITY_LEVEL = constraints.securityChecks || 'basic';
        
        // Data validation
        constraintConfig.VALIDATION_LEVEL = constraints.dataValidation || 'strict';
        
        await this.updateEnvFile('.env.constraints', constraintConfig);
    }
    
    /**
     * Translate constraint values to specific settings
     */
    translateConstraint(constraintValue) {
        const translations = {
            'none': '0',
            'generous': '1000',
            'moderate': '100',
            'strict': '10',
            'basic': 'low',
            'enhanced': 'medium',
            'maximum': 'high',
            'relaxed': 'permissive',
            'paranoid': 'strict'
        };
        
        return translations[constraintValue] || constraintValue;
    }
    
    /**
     * Update environment file with new configuration
     */
    async updateEnvFile(filename, config) {
        const envPath = path.resolve(this.baseDir, filename);
        
        // Read existing env file if it exists
        let existingConfig = {};
        try {
            const content = await fs.readFile(envPath, 'utf-8');
            existingConfig = this.parseEnvFile(content);
        } catch (error) {
            // File doesn't exist, start fresh
        }
        
        // Merge configurations
        const mergedConfig = { ...existingConfig, ...config };
        
        // Write back to file
        const envContent = Object.entries(mergedConfig)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
            
        await fs.writeFile(envPath, envContent, 'utf-8');
        console.log(`  ✅ Updated ${filename}`);
    }
    
    /**
     * Parse environment file content
     */
    parseEnvFile(content) {
        const config = {};
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    config[key] = valueParts.join('=');
                }
            }
        });
        
        return config;
    }
    
    /**
     * Save character configuration
     */
    async saveCharacterConfig(characterConfig) {
        const configPath = path.resolve(this.baseDir, 'character-config.json');
        const content = JSON.stringify(characterConfig, null, 2);
        await fs.writeFile(configPath, content, 'utf-8');
        console.log('  ✅ Character configuration saved');
    }
    
    /**
     * Validate context switch
     */
    async validateContextSwitch(profile) {
        console.log('🔍 Validating context switch...');
        
        const errors = [];
        const warnings = [];
        
        // Check basic profile structure
        if (!profile.environment) {
            errors.push('Missing environment in profile');
        }
        
        if (!profile.services) {
            errors.push('Missing services configuration');
        }
        
        if (!profile.personality) {
            errors.push('Missing personality settings');
        }
        
        if (!profile.constraints) {
            errors.push('Missing constraints configuration');
        }
        
        // Validate character settings are applied
        try {
            const characterConfig = await this.loadCharacterConfig();
            if (characterConfig.environment !== profile.environment) {
                warnings.push('Character configuration may not be fully applied');
            }
        } catch (error) {
            errors.push('Character configuration not found');
        }
        
        return {
            success: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Load current character configuration
     */
    async loadCharacterConfig() {
        const configPath = path.resolve(this.baseDir, 'character-config.json');
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
    }
    
    /**
     * Get current context status
     */
    async getContextStatus() {
        try {
            const characterConfig = await this.loadCharacterConfig();
            
            return {
                currentContext: this.currentContext || characterConfig.environment,
                characterConfig,
                switchHistory: this.switchHistory.slice(-5) // Last 5 switches
            };
        } catch (error) {
            return {
                currentContext: 'unknown',
                error: error.message
            };
        }
    }
    
    /**
     * Get service status
     */
    async getServiceStatus() {
        const services = {};
        
        try {
            const { stdout } = await execAsync('docker-compose ps --services');
            const serviceList = stdout.trim().split('\n');
            
            for (const service of serviceList) {
                if (service) {
                    try {
                        const { stdout: status } = await execAsync(`docker-compose ps ${service}`);
                        services[service] = status.includes('Up') ? 'running' : 'stopped';
                    } catch (error) {
                        services[service] = 'unknown';
                    }
                }
            }
        } catch (error) {
            // Docker Compose not available or no services defined
        }
        
        return services;
    }
    
    /**
     * Helper methods for context switching
     */
    
    async validateTargetEnvironment(environment) {
        if (!this.availableContexts.includes(environment)) {
            throw new Error(`Invalid environment: ${environment}. Available: ${this.availableContexts.join(', ')}`);
        }
    }
    
    async createContextBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.resolve(this.baseDir, 'backups', `context-backup-${timestamp}`);
        
        await fs.mkdir(backupDir, { recursive: true });
        
        // Backup current environment files
        const filesToBackup = [
            '.env',
            '.env.personality',
            '.env.constraints',
            'character-config.json'
        ];
        
        for (const file of filesToBackup) {
            try {
                const sourcePath = path.resolve(this.baseDir, file);
                const targetPath = path.resolve(backupDir, file);
                await fs.copyFile(sourcePath, targetPath);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
        
        console.log(`📦 Context backup created: ${backupDir}`);
        return backupDir;
    }
    
    async prepareContextSwitch(profile, options) {
        // Pre-switch validation and preparation
        console.log('⚙️  Preparing context switch...');
        
        // Validate profile structure
        if (!profile.services || !profile.personality || !profile.constraints) {
            throw new Error('Invalid profile structure');
        }
    }
    
    async previewChanges(targetProfile) {
        // Show what would change in a dry run
        const currentCharacter = await this.loadCharacterConfig().catch(() => null);
        
        return {
            personalityChanges: this.comparePersonality(currentCharacter?.personality, targetProfile.personality),
            constraintChanges: this.compareConstraints(currentCharacter?.constraints, targetProfile.constraints)
        };
    }
    
    comparePersonality(current, target) {
        // Compare personality settings
        const changes = [];
        
        for (const [key, value] of Object.entries(target || {})) {
            if (current?.[key] !== value) {
                changes.push({
                    setting: key,
                    from: current?.[key],
                    to: value
                });
            }
        }
        
        return changes;
    }
    
    compareConstraints(current, target) {
        // Compare constraint settings
        const changes = [];
        
        for (const [key, value] of Object.entries(target || {})) {
            if (current?.[key] !== value) {
                changes.push({
                    constraint: key,
                    from: current?.[key],
                    to: value
                });
            }
        }
        
        return changes;
    }
    
    async rollbackContext() {
        if (!this.previousContext) {
            throw new Error('No previous context to rollback to');
        }
        
        return this.switchContext(this.previousContext, { backup: false });
    }
    
    async updateApplicationConfigs(profile) {
        // Update application-specific configurations
        console.log('🔧 Updating application configurations...');
        
        // Update the main .env file
        const appConfig = {
            NODE_ENV: profile.environment,
            ENVIRONMENT: profile.environment,
            LAST_CONTEXT_SWITCH: new Date().toISOString()
        };
        
        await this.updateEnvFile('.env', appConfig);
    }
    
    async setEnvironmentVariables(profile) {
        // Set environment variables for current session
        process.env.NODE_ENV = profile.environment;
        process.env.ENVIRONMENT = profile.environment;
        process.env.CONTEXT_SWITCHED_AT = new Date().toISOString();
    }
    
    async manageProcesses(profile) {
        // Manage non-Docker processes if needed
        console.log('⚙️  Managing processes...');
        // Implementation would depend on specific process management needs
    }
    
    async updateConfiguration(profile) {
        // Update various configuration files
        console.log('📝 Updating configurations...');
        // This is handled by other methods like updateApplicationConfigs
    }
    
    async manageDockerServices(profile) {
        console.log('🐳 Managing Docker services...');
        
        const services = profile.services || {};
        
        // For now, just log what would happen
        for (const [service, config] of Object.entries(services)) {
            if (config.enabled === false) {
                console.log(`  ⏹️  Would stop ${service}`);
            } else if (config.enabled === true) {
                console.log(`  ▶️  Would start ${service} with config:`, config);
            }
        }
    }
}

/**
 * CLI Interface
 */
if (require.main === module) {
    const switcher = new EnvironmentSwitcher();
    
    async function main() {
        const command = process.argv[2];
        const environment = process.argv[3];
        
        switch (command) {
            case 'switch':
                if (!environment) {
                    console.error('Usage: node environment-switcher.js switch <environment>');
                    console.error('Available environments: dev, staging, prod, remote');
                    process.exit(1);
                }
                
                const options = {
                    dryRun: process.argv.includes('--dry-run'),
                    force: process.argv.includes('--force'),
                    backup: !process.argv.includes('--no-backup')
                };
                
                const result = await switcher.switchContext(environment, options);
                console.log('\n📋 Switch Results:');
                console.log(JSON.stringify(result, null, 2));
                break;
                
            case 'status':
                const status = await switcher.getContextStatus();
                console.log('📊 Current Context Status:');
                console.log(JSON.stringify(status, null, 2));
                break;
                
            case 'validate':
                const env = environment || 'dev';
                try {
                    const profile = await switcher.loadContextProfile(env);
                    const validation = await switcher.validateContextSwitch(profile);
                    
                    if (validation.success) {
                        console.log(`✅ ${env} context is valid`);
                    } else {
                        console.log(`❌ ${env} context validation failed:`);
                        validation.errors.forEach(error => console.log(`  - ${error}`));
                    }
                    
                    if (validation.warnings.length > 0) {
                        console.log('⚠️  Warnings:');
                        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
                    }
                } catch (error) {
                    console.error('❌ Validation error:', error.message);
                }
                break;
                
            default:
                console.log(`
🔄 Environment Switcher - Context Profile Deployment Tool

Usage:
  node environment-switcher.js switch <environment> [options]
  node environment-switcher.js status  
  node environment-switcher.js validate [environment]

Commands:
  switch <env>    - Switch to specified environment context
  status          - Show current context status
  validate [env]  - Validate environment context (default: dev)

Options:
  --dry-run       - Preview changes without applying them
  --force         - Force switch even if validation fails
  --no-backup     - Skip creating backup before switch

Environments:
  dev     - Development context (high risk tolerance, verbose logging)
  staging - Staging context (medium risk, structured logging)
  prod    - Production context (minimal risk, error-only logging)
  remote  - Remote context (network-optimized, encrypted)

Examples:
  node environment-switcher.js switch dev --dry-run
  node environment-switcher.js switch prod --no-backup
  node environment-switcher.js validate staging
`);
        }
    }
    
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = EnvironmentSwitcher;
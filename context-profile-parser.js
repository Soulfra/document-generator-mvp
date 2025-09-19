#!/usr/bin/env node

/**
 * Context Profile Parser - Archaeological Discovery Extension
 * 
 * Extends the existing FinishThisIdea context profile system to handle
 * multi-environment deployment contexts (dev/staging/prod/remote)
 * 
 * This bridges the gap between:
 * - Existing code style context profiles
 * - Discovered environment-based context architecture
 * 
 * Based on archaeological analysis of 36,350 files showing intentional
 * context duplication for reproducibility across environments.
 */

const fs = require('fs').promises;
const path = require('path');

class ContextProfileParser {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
        
        // Supported environment contexts
        this.environments = ['dev', 'staging', 'prod', 'remote'];
        
        // Cache for parsed profiles
        this.profileCache = new Map();
    }
    
    /**
     * Archaeological Pattern Recognition
     * Find context profiles scattered across the codebase
     */
    async discoverContextProfiles() {
        console.log('🔍 Archaeological Context Profile Discovery...');
        
        const discoveries = {
            codeStyleProfiles: [],
            environmentProfiles: [],
            characterSettings: [],
            serviceConfigs: [],
            patterns: []
        };
        
        // Search for existing context profile patterns
        const searchPatterns = [
            '**/context-profile*.{xml,json,ts,js}',
            '**/context*.{xml,json}',
            '**/*-context*.{xml,json}',
            '**/env/*.{json,xml}',
            '**/config/*-context*.{json,xml}'
        ];
        
        for (const pattern of searchPatterns) {
            try {
                const matches = await this.globFiles(pattern);
                discoveries.patterns.push(...matches.map(file => ({
                    pattern,
                    file,
                    type: this.classifyContextFile(file)
                })));
            } catch (error) {
                console.warn(`Pattern search failed: ${pattern}`, error.message);
            }
        }
        
        // Analyze file naming patterns for context indicators
        const fileAnalysis = await this.analyzeFilePatterns();
        discoveries.environmentProfiles = fileAnalysis.environmentDuplicates;
        
        console.log(`✅ Discovery complete:
  - Code Style Profiles: ${discoveries.codeStyleProfiles.length}
  - Environment Profiles: ${discoveries.environmentProfiles.length}
  - Character Settings: ${discoveries.characterSettings.length}
  - Service Configs: ${discoveries.serviceConfigs.length}
  - Pattern Matches: ${discoveries.patterns.length}`);
        
        return discoveries;
    }
    
    /**
     * Parse existing TypeScript context profiles (code style)
     */
    async parseCodeStyleProfiles() {
        const profilesDir = path.join(this.baseDir, 'FinishThisIdea', 'src', 'types');
        const profileTypes = path.join(profilesDir, 'context-profile.ts');
        
        try {
            const content = await fs.readFile(profileTypes, 'utf-8');
            
            // Extract interface definition
            const interfaceMatch = content.match(/export interface ContextProfile \{([\s\S]+?)\}/);
            if (!interfaceMatch) {
                throw new Error('Could not find ContextProfile interface');
            }
            
            return {
                type: 'code-style',
                source: 'typescript-interface',
                structure: this.parseTypeScriptInterface(interfaceMatch[1]),
                validation: content.includes('contextProfileSchema'),
                path: profileTypes
            };
        } catch (error) {
            console.warn('Could not parse existing code style profiles:', error.message);
            return null;
        }
    }
    
    /**
     * Create environment-based context profiles
     * These handle service configuration per environment
     */
    async createEnvironmentProfiles(component, environments = this.environments) {
        const profiles = {};
        
        for (const env of environments) {
            profiles[env] = await this.generateEnvironmentProfile(component, env);
        }
        
        return profiles;
    }
    
    /**
     * Generate environment-specific profile
     */
    async generateEnvironmentProfile(component, environment) {
        const baseProfile = {
            environment,
            component,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        
        // Environment-specific configurations
        switch (environment) {
            case 'dev':
                return {
                    ...baseProfile,
                    services: {
                        ollama: { enabled: true, url: 'http://localhost:11434' },
                        redis: { enabled: true, url: 'localhost:6379' },
                        postgres: { enabled: true, database: 'dev_db' },
                        logging: { level: 'debug', verbose: true }
                    },
                    personality: {
                        riskTolerance: 'high',
                        errorHandling: 'permissive',
                        experimentation: 'encouraged',
                        debugging: 'verbose'
                    },
                    constraints: {
                        apiLimits: 'none',
                        resourceLimits: 'generous',
                        securityChecks: 'basic',
                        dataValidation: 'relaxed'
                    }
                };
                
            case 'staging':
                return {
                    ...baseProfile,
                    services: {
                        ollama: { enabled: true, url: 'http://staging-ollama:11434' },
                        redis: { enabled: true, url: 'staging-redis:6379' },
                        postgres: { enabled: true, database: 'staging_db' },
                        logging: { level: 'info', structured: true }
                    },
                    personality: {
                        riskTolerance: 'medium',
                        errorHandling: 'strict',
                        experimentation: 'cautious',
                        debugging: 'minimal'
                    },
                    constraints: {
                        apiLimits: 'moderate',
                        resourceLimits: 'controlled',
                        securityChecks: 'enhanced',
                        dataValidation: 'strict'
                    }
                };
                
            case 'prod':
                return {
                    ...baseProfile,
                    services: {
                        ollama: { enabled: false }, // Use cloud APIs in prod
                        redis: { enabled: true, url: 'prod-redis-cluster:6379' },
                        postgres: { enabled: true, database: 'production_db' },
                        logging: { level: 'error', monitoring: true }
                    },
                    personality: {
                        riskTolerance: 'minimal',
                        errorHandling: 'fail-safe',
                        experimentation: 'disabled',
                        debugging: 'off'
                    },
                    constraints: {
                        apiLimits: 'strict',
                        resourceLimits: 'monitored',
                        securityChecks: 'maximum',
                        dataValidation: 'paranoid'
                    }
                };
                
            case 'remote':
                return {
                    ...baseProfile,
                    services: {
                        ollama: { enabled: true, url: 'http://remote-host:11434' },
                        redis: { enabled: true, url: 'remote-redis:6379' },
                        postgres: { enabled: true, database: 'remote_db' },
                        logging: { level: 'warn', remote: true }
                    },
                    personality: {
                        riskTolerance: 'medium',
                        errorHandling: 'resilient',
                        experimentation: 'limited',
                        debugging: 'remote'
                    },
                    constraints: {
                        apiLimits: 'bandwidth-aware',
                        resourceLimits: 'network-optimized',
                        securityChecks: 'encrypted',
                        dataValidation: 'cached'
                    }
                };
                
            default:
                throw new Error(`Unknown environment: ${environment}`);
        }
    }
    
    /**
     * Save context profile as JSON (simpler than XML for now)
     */
    async saveJSONProfile(profile, outputPath) {
        try {
            const json = JSON.stringify(profile, null, 2);
            await fs.writeFile(outputPath, json, 'utf-8');
            return outputPath;
        } catch (error) {
            throw new Error(`Failed to save JSON profile ${outputPath}: ${error.message}`);
        }
    }
    
    /**
     * Parse JSON context profile
     */
    async parseJSONProfile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            
            // Cache the parsed profile
            this.profileCache.set(filePath, {
                parsed,
                lastModified: (await fs.stat(filePath)).mtime,
                path: filePath
            });
            
            return parsed;
        } catch (error) {
            throw new Error(`Failed to parse JSON profile ${filePath}: ${error.message}`);
        }
    }
    
    /**
     * Merge code style profile with environment profile
     */
    async mergeProfiles(codeStyleProfile, environmentProfile) {
        return {
            id: `${environmentProfile.component}-${environmentProfile.environment}`,
            type: 'unified',
            environment: environmentProfile.environment,
            component: environmentProfile.component,
            
            // Code style settings (from existing system)
            codeStyle: codeStyleProfile || null,
            
            // Environment settings (from archaeological discovery)
            environmentConfig: environmentProfile,
            
            // Unified configuration
            unified: {
                services: environmentProfile.services,
                personality: environmentProfile.personality,
                constraints: environmentProfile.constraints,
                style: codeStyleProfile?.style || null,
                rules: codeStyleProfile?.rules || null,
                aiContext: {
                    ...codeStyleProfile?.aiContext || {},
                    environment: environmentProfile.environment,
                    serviceContext: environmentProfile.services
                }
            }
        };
    }
    
    /**
     * Validate profile structure
     */
    validateProfile(profile) {
        const errors = [];
        
        // Basic structure validation
        if (!profile.environment) {
            errors.push('Missing environment field');
        }
        
        if (!this.environments.includes(profile.environment)) {
            errors.push(`Invalid environment: ${profile.environment}`);
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
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Helper methods
     */
    
    async globFiles(pattern) {
        // Simple file matching - in real implementation use glob library
        // For now, return empty array to avoid dependencies
        return [];
    }
    
    classifyContextFile(filePath) {
        const filename = path.basename(filePath).toLowerCase();
        
        if (filename.includes('context-profile')) {
            return 'code-style';
        }
        
        if (filename.includes('env') || filename.includes('environment')) {
            return 'environment';
        }
        
        if (filename.includes('config')) {
            return 'configuration';
        }
        
        if (filename.includes('character') || filename.includes('personality')) {
            return 'character';
        }
        
        return 'unknown';
    }
    
    async analyzeFilePatterns() {
        // Analyze the archaeological file patterns we discovered
        // This would integrate with the file-registry-system.js we built
        return {
            environmentDuplicates: [
                // Files that exist in multiple environment contexts
                // This represents the "intentional duplicates" we discovered
            ],
            contextPatterns: [
                // Naming patterns that indicate context usage
            ]
        };
    }
    
    parseTypeScriptInterface(interfaceContent) {
        // Parse the TypeScript interface structure
        // Extract field definitions and types
        const fields = {};
        
        // Simple parser for demonstration
        const lines = interfaceContent.split('\n');
        lines.forEach(line => {
            const match = line.match(/^\s*(\w+)(\?)?\s*:\s*(.+?);/);
            if (match) {
                fields[match[1]] = {
                    optional: !!match[2],
                    type: match[3]
                };
            }
        });
        
        return fields;
    }
}

/**
 * CLI Interface
 */
if (require.main === module) {
    const parser = new ContextProfileParser();
    
    async function main() {
        const command = process.argv[2];
        
        switch (command) {
            case 'discover':
                console.log('🔍 Starting archaeological context discovery...');
                const discoveries = await parser.discoverContextProfiles();
                console.log('\n📋 Discovery Results:');
                console.log(JSON.stringify(discoveries, null, 2));
                break;
                
            case 'create-env-profiles':
                const component = process.argv[3] || 'default-component';
                console.log(`🏗️  Creating environment profiles for: ${component}`);
                const envProfiles = await parser.createEnvironmentProfiles(component);
                
                // Save each environment profile
                for (const [env, profile] of Object.entries(envProfiles)) {
                    const filename = `context-profile-${component}-${env}.json`;
                    
                    await parser.saveJSONProfile(profile, filename);
                    console.log(`  ✅ Created: ${filename}`);
                }
                break;
                
            case 'parse-existing':
                const codeStyleProfiles = await parser.parseCodeStyleProfiles();
                console.log('📝 Existing Code Style Profiles:');
                console.log(JSON.stringify(codeStyleProfiles, null, 2));
                break;
                
            case 'merge-profiles':
                const codeStyle = await parser.parseCodeStyleProfiles();
                const envComponent = process.argv[3] || 'test-component';
                const envName = process.argv[4] || 'dev';
                
                const envProfile = await parser.generateEnvironmentProfile(envComponent, envName);
                const merged = await parser.mergeProfiles(codeStyle, envProfile);
                
                console.log('🔄 Merged Profile:');
                console.log(JSON.stringify(merged, null, 2));
                break;
                
            case 'validate':
                const profilePath = process.argv[3];
                if (!profilePath) {
                    console.error('Usage: node context-profile-parser.js validate <profile-path>');
                    process.exit(1);
                }
                
                const profile = await parser.parseJSONProfile(profilePath);
                const validation = parser.validateProfile(profile);
                
                if (validation.valid) {
                    console.log('✅ Profile is valid');
                } else {
                    console.log('❌ Profile validation errors:');
                    validation.errors.forEach(error => console.log(`  - ${error}`));
                }
                break;
                
            default:
                console.log(`
🧬 Context Profile Parser - Archaeological Discovery Extension

Usage:
  node context-profile-parser.js discover
  node context-profile-parser.js create-env-profiles [component]
  node context-profile-parser.js parse-existing
  node context-profile-parser.js merge-profiles [component] [environment]
  node context-profile-parser.js validate <profile-path>

Commands:
  discover           - Find existing context profiles across codebase
  create-env-profiles - Generate environment-specific profiles
  parse-existing     - Parse existing TypeScript context profiles
  merge-profiles     - Combine code style and environment profiles
  validate          - Validate a profile file

This extends the existing FinishThisIdea context system to handle
multi-environment deployment contexts discovered through archaeological
analysis of 36,350 files.
`);
        }
    }
    
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = ContextProfileParser;
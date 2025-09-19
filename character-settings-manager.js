#!/usr/bin/env node

/**
 * Character Settings Manager - Personality & Constraints Controller
 * 
 * Manages character personality and constraints that shape system behavior:
 * - Personality settings (risk tolerance, error handling, experimentation)
 * - Constraint settings (API limits, resource limits, security levels)
 * - Dynamic character adaptation based on context
 * - Character evolution and learning from system behavior
 * 
 * Integrates with context profiles and environment switcher for
 * seamless character adaptation across environments.
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class CharacterSettingsManager extends EventEmitter {
    constructor(baseDir = process.cwd()) {
        super();
        this.baseDir = baseDir;
        
        // Character configuration files
        this.configPaths = {
            character: path.resolve(baseDir, 'character-config.json'),
            personality: path.resolve(baseDir, '.env.personality'),
            constraints: path.resolve(baseDir, '.env.constraints'),
            history: path.resolve(baseDir, 'character-history.json')
        };
        
        // Current character state
        this.currentCharacter = null;
        this.personalityProfiles = this.initializePersonalityProfiles();
        this.constraintProfiles = this.initializeConstraintProfiles();
        
        // Character evolution tracking
        this.behaviorHistory = [];
        this.adaptationRules = [];
        
        // Load current character on initialization
        this.loadCurrentCharacter().catch(error => {
            console.warn('Could not load current character:', error.message);
        });
    }
    
    /**
     * Load current character configuration
     */
    async loadCurrentCharacter() {
        try {
            const content = await fs.readFile(this.configPaths.character, 'utf-8');
            this.currentCharacter = JSON.parse(content);
            this.emit('character-loaded', this.currentCharacter);
            return this.currentCharacter;
        } catch (error) {
            this.currentCharacter = null;
            throw new Error(`Could not load character configuration: ${error.message}`);
        }
    }
    
    /**
     * Save character configuration
     */
    async saveCurrentCharacter(character = this.currentCharacter) {
        if (!character) {
            throw new Error('No character configuration to save');
        }
        
        // Add metadata
        character.lastUpdated = new Date().toISOString();
        character.version = character.version ? character.version + 1 : 1;
        
        const content = JSON.stringify(character, null, 2);
        await fs.writeFile(this.configPaths.character, content, 'utf-8');
        
        this.currentCharacter = character;
        this.emit('character-saved', character);
        
        console.log('✅ Character configuration saved');
        return character;
    }
    
    /**
     * Update personality settings
     */
    async updatePersonality(personalityUpdates, options = {}) {
        const { 
            validate = true, 
            applyImmediately = true,
            recordHistory = true 
        } = options;
        
        console.log('🎭 Updating personality settings...');
        
        if (!this.currentCharacter) {
            await this.loadCurrentCharacter();
        }
        
        // Validate personality updates
        if (validate) {
            const validation = this.validatePersonalitySettings(personalityUpdates);
            if (!validation.valid) {
                throw new Error(`Invalid personality settings: ${validation.errors.join(', ')}`);
            }
        }
        
        // Record current state for history
        const previousPersonality = { ...this.currentCharacter.personality };
        
        // Apply updates
        this.currentCharacter.personality = {
            ...this.currentCharacter.personality,
            ...personalityUpdates
        };
        
        // Save configuration
        await this.saveCurrentCharacter();
        
        // Apply to system immediately if requested
        if (applyImmediately) {
            await this.applyPersonalityToSystem(this.currentCharacter.personality);
        }
        
        // Record history
        if (recordHistory) {
            await this.recordPersonalityChange(previousPersonality, this.currentCharacter.personality);
        }
        
        this.emit('personality-updated', {
            previous: previousPersonality,
            current: this.currentCharacter.personality,
            changes: personalityUpdates
        });
        
        console.log('✅ Personality settings updated');
        return this.currentCharacter.personality;
    }
    
    /**
     * Update constraint settings
     */
    async updateConstraints(constraintUpdates, options = {}) {
        const { 
            validate = true, 
            applyImmediately = true,
            recordHistory = true 
        } = options;
        
        console.log('🔒 Updating constraint settings...');
        
        if (!this.currentCharacter) {
            await this.loadCurrentCharacter();
        }
        
        // Validate constraint updates
        if (validate) {
            const validation = this.validateConstraintSettings(constraintUpdates);
            if (!validation.valid) {
                throw new Error(`Invalid constraint settings: ${validation.errors.join(', ')}`);
            }
        }
        
        // Record current state for history
        const previousConstraints = { ...this.currentCharacter.constraints };
        
        // Apply updates
        this.currentCharacter.constraints = {
            ...this.currentCharacter.constraints,
            ...constraintUpdates
        };
        
        // Save configuration
        await this.saveCurrentCharacter();
        
        // Apply to system immediately if requested
        if (applyImmediately) {
            await this.applyConstraintsToSystem(this.currentCharacter.constraints);
        }
        
        // Record history
        if (recordHistory) {
            await this.recordConstraintChange(previousConstraints, this.currentCharacter.constraints);
        }
        
        this.emit('constraints-updated', {
            previous: previousConstraints,
            current: this.currentCharacter.constraints,
            changes: constraintUpdates
        });
        
        console.log('✅ Constraint settings updated');
        return this.currentCharacter.constraints;
    }
    
    /**
     * Apply personality settings to system
     */
    async applyPersonalityToSystem(personality) {
        console.log('🎭 Applying personality to system...');
        
        const personalityConfig = this.translatePersonalityToConfig(personality);
        await this.updateEnvFile(this.configPaths.personality, personalityConfig);
        
        // Update system behavior based on personality
        await this.configureSystemBehavior(personality);
        
        console.log('  ✅ Personality applied to system');
    }
    
    /**
     * Apply constraint settings to system
     */
    async applyConstraintsToSystem(constraints) {
        console.log('🔒 Applying constraints to system...');
        
        const constraintConfig = this.translateConstraintsToConfig(constraints);
        await this.updateEnvFile(this.configPaths.constraints, constraintConfig);
        
        // Configure system limits based on constraints
        await this.configureSystemLimits(constraints);
        
        console.log('  ✅ Constraints applied to system');
    }
    
    /**
     * Get character recommendations based on environment
     */
    async getCharacterRecommendations(environment) {
        const recommendations = {
            environment,
            personality: this.getPersonalityRecommendations(environment),
            constraints: this.getConstraintRecommendations(environment),
            reasoning: []
        };
        
        // Add reasoning for recommendations
        recommendations.reasoning = this.generateRecommendationReasoning(environment, recommendations);
        
        return recommendations;
    }
    
    /**
     * Auto-adapt character based on environment and behavior
     */
    async autoAdaptCharacter(context = {}) {
        console.log('🧠 Auto-adapting character...');
        
        const { environment, recentBehavior, systemMetrics } = context;
        
        // Analyze current performance
        const analysis = await this.analyzeCharacterPerformance(systemMetrics);
        
        // Generate adaptation recommendations
        const adaptations = await this.generateAdaptations(analysis, environment);
        
        if (adaptations.personality.length > 0 || adaptations.constraints.length > 0) {
            console.log('📊 Character adaptations recommended:');
            console.log(`  Personality: ${adaptations.personality.length} changes`);
            console.log(`  Constraints: ${adaptations.constraints.length} changes`);
            
            // Apply adaptations
            if (adaptations.personality.length > 0) {
                const personalityUpdates = this.buildPersonalityUpdates(adaptations.personality);
                await this.updatePersonality(personalityUpdates, { recordHistory: true });
            }
            
            if (adaptations.constraints.length > 0) {
                const constraintUpdates = this.buildConstraintUpdates(adaptations.constraints);
                await this.updateConstraints(constraintUpdates, { recordHistory: true });
            }
            
            this.emit('character-adapted', adaptations);
            console.log('✅ Character auto-adaptation completed');
        } else {
            console.log('📊 No adaptations needed - character is well-tuned');
        }
        
        return adaptations;
    }
    
    /**
     * Get character status and health
     */
    async getCharacterStatus() {
        if (!this.currentCharacter) {
            await this.loadCurrentCharacter();
        }
        
        return {
            character: this.currentCharacter,
            health: await this.assessCharacterHealth(),
            performance: await this.assessCharacterPerformance(),
            recommendations: await this.getOptimizationRecommendations(),
            history: await this.getRecentHistory(5)
        };
    }
    
    /**
     * Initialize personality profiles for different environments
     */
    initializePersonalityProfiles() {
        return {
            dev: {
                riskTolerance: 'high',
                errorHandling: 'permissive',
                experimentation: 'encouraged',
                debugging: 'verbose',
                creativity: 'high',
                learning: 'aggressive'
            },
            staging: {
                riskTolerance: 'medium',
                errorHandling: 'strict',
                experimentation: 'cautious',
                debugging: 'minimal',
                creativity: 'controlled',
                learning: 'moderate'
            },
            prod: {
                riskTolerance: 'minimal',
                errorHandling: 'fail-safe',
                experimentation: 'disabled',
                debugging: 'off',
                creativity: 'conservative',
                learning: 'passive'
            },
            remote: {
                riskTolerance: 'medium',
                errorHandling: 'resilient',
                experimentation: 'limited',
                debugging: 'remote',
                creativity: 'adaptive',
                learning: 'collaborative'
            }
        };
    }
    
    /**
     * Initialize constraint profiles for different environments
     */
    initializeConstraintProfiles() {
        return {
            dev: {
                apiLimits: 'none',
                resourceLimits: 'generous',
                securityChecks: 'basic',
                dataValidation: 'relaxed',
                performanceThresholds: 'lenient',
                memoryLimits: 'high'
            },
            staging: {
                apiLimits: 'moderate',
                resourceLimits: 'controlled',
                securityChecks: 'enhanced',
                dataValidation: 'strict',
                performanceThresholds: 'realistic',
                memoryLimits: 'medium'
            },
            prod: {
                apiLimits: 'strict',
                resourceLimits: 'monitored',
                securityChecks: 'maximum',
                dataValidation: 'paranoid',
                performanceThresholds: 'aggressive',
                memoryLimits: 'low'
            },
            remote: {
                apiLimits: 'bandwidth-aware',
                resourceLimits: 'network-optimized',
                securityChecks: 'encrypted',
                dataValidation: 'cached',
                performanceThresholds: 'latency-aware',
                memoryLimits: 'conservative'
            }
        };
    }
    
    /**
     * Validation methods
     */
    
    validatePersonalitySettings(personality) {
        const errors = [];
        const validValues = {
            riskTolerance: ['minimal', 'low', 'medium', 'high', 'maximum'],
            errorHandling: ['fail-safe', 'strict', 'moderate', 'permissive', 'ignore'],
            experimentation: ['disabled', 'limited', 'cautious', 'encouraged', 'aggressive'],
            debugging: ['off', 'minimal', 'moderate', 'verbose', 'trace']
        };
        
        Object.entries(personality).forEach(([key, value]) => {
            if (validValues[key] && !validValues[key].includes(value)) {
                errors.push(`Invalid ${key} value: ${value}`);
            }
        });
        
        return { valid: errors.length === 0, errors };
    }
    
    validateConstraintSettings(constraints) {
        const errors = [];
        const validValues = {
            apiLimits: ['none', 'generous', 'moderate', 'strict', 'blocked'],
            resourceLimits: ['unlimited', 'generous', 'controlled', 'monitored', 'minimal'],
            securityChecks: ['disabled', 'basic', 'enhanced', 'maximum', 'paranoid'],
            dataValidation: ['none', 'relaxed', 'standard', 'strict', 'paranoid']
        };
        
        Object.entries(constraints).forEach(([key, value]) => {
            if (validValues[key] && !validValues[key].includes(value)) {
                errors.push(`Invalid ${key} value: ${value}`);
            }
        });
        
        return { valid: errors.length === 0, errors };
    }
    
    /**
     * Translation and configuration methods
     */
    
    translatePersonalityToConfig(personality) {
        return {
            ERROR_TOLERANCE: personality.riskTolerance || 'medium',
            ERROR_HANDLING: personality.errorHandling || 'strict',
            DEBUG_LEVEL: personality.debugging || 'minimal',
            ALLOW_EXPERIMENTS: personality.experimentation === 'encouraged' || personality.experimentation === 'aggressive',
            CREATIVITY_MODE: personality.creativity || 'controlled',
            LEARNING_RATE: personality.learning || 'moderate'
        };
    }
    
    translateConstraintsToConfig(constraints) {
        const translations = {
            'none': '0', 'unlimited': '0',
            'generous': '1000', 'high': '1000',
            'moderate': '100', 'medium': '100',
            'strict': '10', 'low': '10',
            'blocked': '0', 'minimal': '1'
        };
        
        return {
            API_RATE_LIMIT: translations[constraints.apiLimits] || constraints.apiLimits,
            MEMORY_LIMIT: translations[constraints.resourceLimits] || constraints.resourceLimits,
            SECURITY_LEVEL: constraints.securityChecks || 'basic',
            VALIDATION_LEVEL: constraints.dataValidation || 'strict'
        };
    }
    
    /**
     * System configuration methods
     */
    
    async configureSystemBehavior(personality) {
        // Configure logging level
        if (personality.debugging === 'verbose' || personality.debugging === 'trace') {
            process.env.LOG_LEVEL = 'debug';
        } else if (personality.debugging === 'minimal') {
            process.env.LOG_LEVEL = 'info';
        } else if (personality.debugging === 'off') {
            process.env.LOG_LEVEL = 'error';
        }
        
        // Configure error handling
        if (personality.errorHandling === 'permissive') {
            process.env.IGNORE_MINOR_ERRORS = 'true';
        }
        
        // Configure experimentation
        if (personality.experimentation === 'encouraged' || personality.experimentation === 'aggressive') {
            process.env.ENABLE_EXPERIMENTAL_FEATURES = 'true';
        }
    }
    
    async configureSystemLimits(constraints) {
        // Configure API rate limiting
        if (constraints.apiLimits !== 'none') {
            process.env.ENABLE_RATE_LIMITING = 'true';
        }
        
        // Configure security
        if (constraints.securityChecks === 'maximum' || constraints.securityChecks === 'paranoid') {
            process.env.STRICT_SECURITY = 'true';
        }
        
        // Configure validation
        if (constraints.dataValidation === 'strict' || constraints.dataValidation === 'paranoid') {
            process.env.STRICT_VALIDATION = 'true';
        }
    }
    
    /**
     * Utility methods
     */
    
    async updateEnvFile(filePath, config) {
        const content = Object.entries(config)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
            
        await fs.writeFile(filePath, content, 'utf-8');
    }
    
    getPersonalityRecommendations(environment) {
        return this.personalityProfiles[environment] || this.personalityProfiles.dev;
    }
    
    getConstraintRecommendations(environment) {
        return this.constraintProfiles[environment] || this.constraintProfiles.dev;
    }
    
    generateRecommendationReasoning(environment, recommendations) {
        const reasoning = [];
        
        switch (environment) {
            case 'dev':
                reasoning.push('Development environment allows high risk tolerance for experimentation');
                reasoning.push('Verbose debugging helps with development and testing');
                reasoning.push('Relaxed constraints enable rapid iteration');
                break;
                
            case 'prod':
                reasoning.push('Production requires minimal risk tolerance for stability');
                reasoning.push('Strict constraints ensure system reliability');
                reasoning.push('Conservative settings prevent production issues');
                break;
                
            case 'staging':
                reasoning.push('Staging balances testing needs with production-like behavior');
                reasoning.push('Moderate settings allow controlled testing');
                break;
                
            case 'remote':
                reasoning.push('Remote environments require network-aware optimizations');
                reasoning.push('Resilient error handling accounts for network issues');
                break;
        }
        
        return reasoning;
    }
    
    async analyzeCharacterPerformance(metrics = {}) {
        // Placeholder for performance analysis
        return {
            efficiency: metrics.efficiency || 0.85,
            reliability: metrics.reliability || 0.90,
            adaptability: metrics.adaptability || 0.75,
            resourceUsage: metrics.resourceUsage || 0.70
        };
    }
    
    async generateAdaptations(analysis, environment) {
        const adaptations = {
            personality: [],
            constraints: []
        };
        
        // Example adaptation logic
        if (analysis.efficiency < 0.8) {
            adaptations.personality.push({
                setting: 'debugging',
                change: 'reduce',
                reason: 'Lower debugging overhead to improve efficiency'
            });
        }
        
        if (analysis.reliability < 0.85) {
            adaptations.constraints.push({
                setting: 'dataValidation',
                change: 'increase',
                reason: 'Increase validation to improve reliability'
            });
        }
        
        return adaptations;
    }
    
    buildPersonalityUpdates(adaptations) {
        const updates = {};
        
        adaptations.forEach(adaptation => {
            // This would implement actual personality adjustments
            // For now, just placeholder logic
            if (adaptation.setting === 'debugging' && adaptation.change === 'reduce') {
                updates.debugging = 'minimal';
            }
        });
        
        return updates;
    }
    
    buildConstraintUpdates(adaptations) {
        const updates = {};
        
        adaptations.forEach(adaptation => {
            // This would implement actual constraint adjustments
            if (adaptation.setting === 'dataValidation' && adaptation.change === 'increase') {
                updates.dataValidation = 'strict';
            }
        });
        
        return updates;
    }
    
    async assessCharacterHealth() {
        // Assess if character settings are working well
        return {
            personalityConsistency: 0.95,
            constraintEffectiveness: 0.88,
            environmentAlignment: 0.92,
            overallHealth: 0.91
        };
    }
    
    async assessCharacterPerformance() {
        // Assess how well character settings are performing
        return {
            taskCompletion: 0.93,
            errorReduction: 0.87,
            resourceEfficiency: 0.82,
            adaptationSpeed: 0.79
        };
    }
    
    async getOptimizationRecommendations() {
        return [
            'Consider reducing debugging verbosity in staging environment',
            'API limits could be relaxed during off-peak hours',
            'Security checks are well-calibrated for current environment'
        ];
    }
    
    async recordPersonalityChange(previous, current) {
        const change = {
            type: 'personality',
            timestamp: new Date().toISOString(),
            previous,
            current,
            changes: this.findChanges(previous, current)
        };
        
        this.behaviorHistory.push(change);
        await this.saveBehaviorHistory();
    }
    
    async recordConstraintChange(previous, current) {
        const change = {
            type: 'constraints',
            timestamp: new Date().toISOString(),
            previous,
            current,
            changes: this.findChanges(previous, current)
        };
        
        this.behaviorHistory.push(change);
        await this.saveBehaviorHistory();
    }
    
    findChanges(previous, current) {
        const changes = [];
        
        Object.keys(current).forEach(key => {
            if (previous[key] !== current[key]) {
                changes.push({
                    setting: key,
                    from: previous[key],
                    to: current[key]
                });
            }
        });
        
        return changes;
    }
    
    async saveBehaviorHistory() {
        try {
            const content = JSON.stringify(this.behaviorHistory, null, 2);
            await fs.writeFile(this.configPaths.history, content, 'utf-8');
        } catch (error) {
            console.warn('Could not save behavior history:', error.message);
        }
    }
    
    async getRecentHistory(limit = 10) {
        try {
            const content = await fs.readFile(this.configPaths.history, 'utf-8');
            const history = JSON.parse(content);
            return history.slice(-limit);
        } catch (error) {
            return [];
        }
    }
}

/**
 * CLI Interface
 */
if (require.main === module) {
    const manager = new CharacterSettingsManager();
    
    async function main() {
        const command = process.argv[2];
        const setting = process.argv[3];
        const value = process.argv[4];
        
        switch (command) {
            case 'status':
                const status = await manager.getCharacterStatus();
                console.log('🎭 Character Status:');
                console.log(JSON.stringify(status, null, 2));
                break;
                
            case 'personality':
                if (!setting || !value) {
                    console.error('Usage: node character-settings-manager.js personality <setting> <value>');
                    console.error('Settings: riskTolerance, errorHandling, experimentation, debugging');
                    process.exit(1);
                }
                
                const personalityUpdate = { [setting]: value };
                const newPersonality = await manager.updatePersonality(personalityUpdate);
                console.log('✅ Personality updated:', newPersonality);
                break;
                
            case 'constraints':
                if (!setting || !value) {
                    console.error('Usage: node character-settings-manager.js constraints <setting> <value>');
                    console.error('Settings: apiLimits, resourceLimits, securityChecks, dataValidation');
                    process.exit(1);
                }
                
                const constraintUpdate = { [setting]: value };
                const newConstraints = await manager.updateConstraints(constraintUpdate);
                console.log('✅ Constraints updated:', newConstraints);
                break;
                
            case 'recommend':
                const environment = setting || 'dev';
                const recommendations = await manager.getCharacterRecommendations(environment);
                console.log(`💡 Character Recommendations for ${environment}:`);
                console.log(JSON.stringify(recommendations, null, 2));
                break;
                
            case 'adapt':
                const context = {
                    environment: setting || 'dev',
                    systemMetrics: {
                        efficiency: 0.8,
                        reliability: 0.85,
                        adaptability: 0.75,
                        resourceUsage: 0.70
                    }
                };
                
                const adaptations = await manager.autoAdaptCharacter(context);
                console.log('🧠 Character Adaptations:');
                console.log(JSON.stringify(adaptations, null, 2));
                break;
                
            case 'history':
                const limit = parseInt(setting) || 5;
                const history = await manager.getRecentHistory(limit);
                console.log(`📚 Recent Character History (${limit} entries):`);
                console.log(JSON.stringify(history, null, 2));
                break;
                
            default:
                console.log(`
🎭 Character Settings Manager - Personality & Constraints Controller

Usage:
  node character-settings-manager.js status
  node character-settings-manager.js personality <setting> <value>
  node character-settings-manager.js constraints <setting> <value>
  node character-settings-manager.js recommend [environment]
  node character-settings-manager.js adapt [environment]
  node character-settings-manager.js history [limit]

Commands:
  status                    - Show character status and health
  personality <key> <value> - Update personality setting
  constraints <key> <value> - Update constraint setting
  recommend [env]           - Get character recommendations for environment
  adapt [env]               - Auto-adapt character based on performance
  history [limit]           - Show recent character changes

Personality Settings:
  riskTolerance    - minimal, low, medium, high, maximum
  errorHandling    - fail-safe, strict, moderate, permissive, ignore
  experimentation  - disabled, limited, cautious, encouraged, aggressive
  debugging        - off, minimal, moderate, verbose, trace

Constraint Settings:
  apiLimits        - none, generous, moderate, strict, blocked
  resourceLimits   - unlimited, generous, controlled, monitored, minimal
  securityChecks   - disabled, basic, enhanced, maximum, paranoid
  dataValidation   - none, relaxed, standard, strict, paranoid

Examples:
  node character-settings-manager.js personality riskTolerance high
  node character-settings-manager.js constraints apiLimits moderate
  node character-settings-manager.js recommend prod
`);
        }
    }
    
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = CharacterSettingsManager;
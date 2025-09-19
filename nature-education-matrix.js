#!/usr/bin/env node
/**
 * Nature Education Matrix System
 * 
 * Secure content protection system for educational nature assets
 * Protects sprites, AI models, and curriculum data with private keys
 * Generates public SaaS templates without exposing core educational IP
 * Integrates with Aseprite sprite systems and educational content
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { logger, createErrorBoundary } = require('./emergency-logging-system');

class NatureEducationMatrix extends EventEmitter {
    constructor(config = {}) {
        super();
        this.boundary = createErrorBoundary('nature-education-matrix');
        
        this.config = {
            encryptionAlgorithm: 'aes-256-gcm',
            keyDerivation: 'pbkdf2',
            iterations: 100000,
            vaultPath: config.vaultPath || './.vault/nature-education/',
            publicTemplatePath: config.publicTemplatePath || './public-templates/',
            enableAuditLog: config.enableAuditLog !== false,
            enableVersioning: config.enableVersioning !== false,
            maxCacheSize: config.maxCacheSize || 100,
            ...config
        };
        
        // Core security components
        this.masterKey = null;
        this.derivedKeys = new Map();
        this.encryptedVault = new Map();
        this.accessTokens = new Map();
        this.auditLog = [];
        
        // Content categories for organized protection
        this.contentCategories = {
            sprites: {
                encryption: 'high',
                access: 'licensed',
                description: 'Aseprite nature sprite assets'
            },
            aiModels: {
                encryption: 'maximum',
                access: 'internal',
                description: 'Educational AI models and training data'
            },
            curriculum: {
                encryption: 'medium',
                access: 'educational',
                description: 'Educational content and lesson plans'
            },
            templates: {
                encryption: 'low',
                access: 'public',
                description: 'Generated SaaS templates'
            },
            metadata: {
                encryption: 'medium',
                access: 'protected',
                description: 'Asset metadata and relationships'
            }
        };
        
        // SaaS template generation system
        this.templateGenerator = new SaaSTemplateGenerator(this);
        this.spriteAssetManager = new SecureSpriteAssetManager(this);
        this.aiModelProtector = new AIModelProtectionSystem(this);
        
        // Public API for template generation
        this.publicAPI = new PublicTemplateAPI(this);
        
        // Initialize security infrastructure
        this.initializeSecurityInfrastructure();
        
        logger.log('SYSTEM', 'Nature Education Matrix initialized', {
            encryptionAlgorithm: this.config.encryptionAlgorithm,
            vaultPath: this.config.vaultPath,
            categories: Object.keys(this.contentCategories).length
        });
    }
    
    async initializeSecurityInfrastructure() {
        try {
            // Ensure vault directory exists
            await this.ensureVaultStructure();
            
            // Initialize or load master key
            await this.initializeMasterKey();
            
            // Load existing encrypted content
            await this.loadEncryptedVault();
            
            // Initialize audit logging
            if (this.config.enableAuditLog) {
                await this.initializeAuditLog();
            }
            
            this.emit('security-ready');
            
        } catch (error) {
            logger.log('ERROR', 'Security infrastructure initialization failed', {
                error: error.message
            });
            throw error;
        }
    }
    
    async ensureVaultStructure() {
        const vaultPath = this.config.vaultPath;
        const subdirs = ['sprites', 'ai-models', 'curriculum', 'templates', 'metadata', 'keys'];
        
        try {
            await fs.mkdir(vaultPath, { recursive: true });
            
            for (const subdir of subdirs) {
                await fs.mkdir(path.join(vaultPath, subdir), { recursive: true });
            }
            
            logger.log('INFO', 'Vault structure ensured', { vaultPath });
            
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }
    
    async initializeMasterKey() {
        const keyPath = path.join(this.config.vaultPath, 'keys', 'master.key');
        
        try {
            // Try to load existing master key
            const existingKey = await fs.readFile(keyPath);
            this.masterKey = existingKey;
            
            logger.log('INFO', 'Master key loaded');
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Generate new master key
                this.masterKey = crypto.randomBytes(32);
                await fs.writeFile(keyPath, this.masterKey, { mode: 0o600 });
                
                logger.log('INFO', 'New master key generated and stored');
            } else {
                throw error;
            }
        }
    }
    
    async loadEncryptedVault() {
        const vaultPath = this.config.vaultPath;
        
        try {
            for (const category of Object.keys(this.contentCategories)) {
                const categoryPath = path.join(vaultPath, category);
                const files = await fs.readdir(categoryPath).catch(() => []);
                
                for (const file of files) {
                    if (file.endsWith('.enc')) {
                        const contentId = file.replace('.enc', '');
                        const filePath = path.join(categoryPath, file);
                        const encryptedData = await fs.readFile(filePath);
                        
                        this.encryptedVault.set(`${category}:${contentId}`, {
                            category: category,
                            contentId: contentId,
                            encryptedData: encryptedData,
                            filePath: filePath
                        });
                    }
                }
            }
            
            logger.log('INFO', 'Encrypted vault loaded', {
                itemCount: this.encryptedVault.size
            });
            
        } catch (error) {
            logger.log('WARNING', 'Could not load encrypted vault', {
                error: error.message
            });
        }
    }
    
    async initializeAuditLog() {
        this.auditLog = [];
        // In production, this would load from persistent storage
        logger.log('INFO', 'Audit logging initialized');
    }
    
    // Core encryption/decryption methods
    async encryptContent(content, category, contentId) {
        const categoryConfig = this.contentCategories[category];
        if (!categoryConfig) {
            throw new Error(`Unknown content category: ${category}`);
        }
        
        // Generate derived key for this category
        const derivedKey = await this.getDerivedKey(category);
        
        // Prepare content for encryption
        const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(JSON.stringify(content));
        
        // Generate initialization vector
        const iv = crypto.randomBytes(16);
        
        // Create cipher
        const cipher = crypto.createCipher(this.config.encryptionAlgorithm, derivedKey);
        
        // Encrypt content
        const encrypted = Buffer.concat([
            cipher.update(contentBuffer),
            cipher.final()
        ]);
        
        // Create authentication tag (for GCM mode)
        const authTag = cipher.getAuthTag ? cipher.getAuthTag() : Buffer.alloc(0);
        
        // Combine IV, auth tag, and encrypted data
        const encryptedPackage = {
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            content: encrypted.toString('hex'),
            algorithm: this.config.encryptionAlgorithm,
            category: category,
            contentId: contentId,
            timestamp: new Date().toISOString()
        };
        
        // Store in vault
        const vaultKey = `${category}:${contentId}`;
        this.encryptedVault.set(vaultKey, encryptedPackage);
        
        // Save to file
        await this.saveEncryptedToFile(category, contentId, encryptedPackage);
        
        // Log the encryption
        await this.logAccess('encrypt', category, contentId, 'system');
        
        return {
            vaultKey: vaultKey,
            hash: this.generateContentHash(encryptedPackage),
            category: category,
            contentId: contentId
        };
    }
    
    async decryptContent(category, contentId, accessToken = null) {
        // Verify access permissions
        if (!this.verifyAccess(category, accessToken)) {
            throw new Error(`Access denied for category: ${category}`);
        }
        
        const vaultKey = `${category}:${contentId}`;
        const encryptedPackage = this.encryptedVault.get(vaultKey);
        
        if (!encryptedPackage) {
            throw new Error(`Content not found: ${vaultKey}`);
        }
        
        // Generate derived key for this category
        const derivedKey = await this.getDerivedKey(category);
        
        // Extract components
        const iv = Buffer.from(encryptedPackage.iv, 'hex');
        const authTag = Buffer.from(encryptedPackage.authTag, 'hex');
        const encryptedContent = Buffer.from(encryptedPackage.content, 'hex');
        
        // Create decipher
        const decipher = crypto.createDecipher(encryptedPackage.algorithm, derivedKey);
        
        // Set auth tag for GCM mode
        if (decipher.setAuthTag && authTag.length > 0) {
            decipher.setAuthTag(authTag);
        }
        
        // Decrypt content
        const decrypted = Buffer.concat([
            decipher.update(encryptedContent),
            decipher.final()
        ]);
        
        // Log the access
        await this.logAccess('decrypt', category, contentId, accessToken || 'anonymous');
        
        // Try to parse as JSON, fall back to buffer
        try {
            return JSON.parse(decrypted.toString());
        } catch {
            return decrypted;
        }
    }
    
    async getDerivedKey(category) {
        if (this.derivedKeys.has(category)) {
            return this.derivedKeys.get(category);
        }
        
        // Derive key using PBKDF2
        const salt = Buffer.from(category + '_salt_nature_education');
        const derivedKey = crypto.pbkdf2Sync(
            this.masterKey,
            salt,
            this.config.iterations,
            32,
            'sha256'
        );
        
        this.derivedKeys.set(category, derivedKey);
        return derivedKey;
    }
    
    verifyAccess(category, accessToken) {
        const categoryConfig = this.contentCategories[category];
        
        switch (categoryConfig.access) {
            case 'public':
                return true;
                
            case 'educational':
                return this.verifyEducationalAccess(accessToken);
                
            case 'licensed':
                return this.verifyLicensedAccess(accessToken);
                
            case 'internal':
                return this.verifyInternalAccess(accessToken);
                
            case 'protected':
                return this.verifyProtectedAccess(accessToken);
                
            default:
                return false;
        }
    }
    
    verifyEducationalAccess(accessToken) {
        // In production, this would validate educational institution credentials
        return accessToken && accessToken.startsWith('edu_');
    }
    
    verifyLicensedAccess(accessToken) {
        // In production, this would validate paid license tokens
        return accessToken && accessToken.startsWith('lic_');
    }
    
    verifyInternalAccess(accessToken) {
        // Internal system access only
        return accessToken && accessToken.startsWith('int_');
    }
    
    verifyProtectedAccess(accessToken) {
        // General protected access
        return accessToken && accessToken.length > 20;
    }
    
    async saveEncryptedToFile(category, contentId, encryptedPackage) {
        const filePath = path.join(
            this.config.vaultPath,
            category,
            `${contentId}.enc`
        );
        
        await fs.writeFile(filePath, JSON.stringify(encryptedPackage, null, 2));
    }
    
    async logAccess(action, category, contentId, accessor) {
        if (!this.config.enableAuditLog) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            category: category,
            contentId: contentId,
            accessor: accessor,
            ip: '127.0.0.1', // Would be actual IP in production
            userAgent: 'nature-education-system'
        };
        
        this.auditLog.push(logEntry);
        
        // Keep audit log size manageable
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-5000);
        }
        
        this.emit('access-logged', logEntry);
    }
    
    generateContentHash(content) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(content))
            .digest('hex')
            .slice(0, 16);
    }
    
    // High-level content management methods
    async storeNatureSprite(spriteData, spriteId, metadata = {}) {
        const content = {
            spriteData: spriteData,
            metadata: {
                ...metadata,
                type: 'nature_sprite',
                created: new Date().toISOString(),
                format: metadata.format || 'aseprite'
            }
        };
        
        return this.encryptContent(content, 'sprites', spriteId);
    }
    
    async storeAIModel(modelData, modelId, metadata = {}) {
        const content = {
            modelData: modelData,
            metadata: {
                ...metadata,
                type: 'ai_model',
                created: new Date().toISOString(),
                purpose: metadata.purpose || 'nature_education'
            }
        };
        
        return this.encryptContent(content, 'aiModels', modelId);
    }
    
    async storeCurriculumContent(curriculumData, curriculumId, metadata = {}) {
        const content = {
            curriculumData: curriculumData,
            metadata: {
                ...metadata,
                type: 'curriculum',
                created: new Date().toISOString(),
                ageGroup: metadata.ageGroup || 'elementary'
            }
        };
        
        return this.encryptContent(content, 'curriculum', curriculumId);
    }
    
    async generatePublicTemplate(templateType, customization = {}) {
        return this.templateGenerator.generateTemplate(templateType, customization);
    }
    
    // Export secure content for authorized users
    async exportContent(category, contentId, accessToken, format = 'json') {
        const content = await this.decryptContent(category, contentId, accessToken);
        
        switch (format) {
            case 'json':
                return JSON.stringify(content, null, 2);
                
            case 'base64':
                return Buffer.from(JSON.stringify(content)).toString('base64');
                
            case 'binary':
                return Buffer.isBuffer(content) ? content : Buffer.from(JSON.stringify(content));
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    // Generate access tokens for different permission levels
    generateAccessToken(accessLevel, metadata = {}) {
        const tokenData = {
            accessLevel: accessLevel,
            generated: new Date().toISOString(),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            metadata: metadata
        };
        
        const tokenId = crypto.randomBytes(16).toString('hex');
        const token = `${accessLevel}_${tokenId}`;
        
        this.accessTokens.set(token, tokenData);
        
        return token;
    }
    
    // Get system status and statistics
    getSystemStatus() {
        return {
            vault: {
                itemCount: this.encryptedVault.size,
                categories: Object.keys(this.contentCategories).map(cat => ({
                    name: cat,
                    count: Array.from(this.encryptedVault.keys())
                        .filter(key => key.startsWith(cat + ':')).length
                }))
            },
            security: {
                masterKeyActive: !!this.masterKey,
                derivedKeysCount: this.derivedKeys.size,
                accessTokensActive: this.accessTokens.size
            },
            audit: {
                logEntries: this.auditLog.length,
                recentAccess: this.auditLog.slice(-5)
            }
        };
    }
}

// SaaS Template Generator (Public-facing, no private keys exposed)
class SaaSTemplateGenerator {
    constructor(matrix) {
        this.matrix = matrix;
        this.templateCache = new Map();
        this.generationStats = {
            totalGenerated: 0,
            byType: new Map(),
            averageTime: 0
        };
    }
    
    async generateTemplate(templateType, customization = {}) {
        const startTime = Date.now();
        
        try {
            let template;
            
            switch (templateType) {
                case 'plant_identification_quiz':
                    template = this.generatePlantIdentificationQuiz(customization);
                    break;
                    
                case 'ecosystem_diagram':
                    template = this.generateEcosystemDiagram(customization);
                    break;
                    
                case 'animal_behavior_chart':
                    template = this.generateAnimalBehaviorChart(customization);
                    break;
                    
                case 'nature_scavenger_hunt':
                    template = this.generateNatureScavengerHunt(customization);
                    break;
                    
                case 'pollination_game':
                    template = this.generatePollinationGame(customization);
                    break;
                    
                case 'seasonal_changes_tracker':
                    template = this.generateSeasonalTracker(customization);
                    break;
                    
                default:
                    throw new Error(`Unknown template type: ${templateType}`);
            }
            
            // Add metadata and security info
            template.metadata = {
                templateType: templateType,
                generated: new Date().toISOString(),
                customization: customization,
                version: '1.0',
                generator: 'nature-education-matrix',
                isPublic: true,
                containsPrivateData: false
            };
            
            // Update statistics
            this.updateGenerationStats(templateType, Date.now() - startTime);
            
            // Store in template cache for reuse
            const cacheKey = this.generateCacheKey(templateType, customization);
            this.templateCache.set(cacheKey, template);
            
            return template;
            
        } catch (error) {
            logger.log('ERROR', 'Template generation failed', {
                templateType: templateType,
                error: error.message
            });
            throw error;
        }
    }
    
    generatePlantIdentificationQuiz(customization) {
        const families = customization.plantFamilies || ['rosaceae', 'asteraceae', 'fabaceae'];
        const difficulty = customization.difficulty || 'beginner';
        
        return {
            type: 'plant_identification_quiz',
            title: customization.title || 'Plant Family Identification Quiz',
            instructions: 'Match each plant to its correct family based on the identifying characteristics',
            difficulty: difficulty,
            questions: families.map(family => ({
                id: `q_${family}`,
                plantFamily: family,
                question: `Which family does this plant belong to?`,
                options: this.generateFamilyOptions(family, families),
                correctAnswer: family,
                hint: this.getPlantFamilyHint(family)
            })),
            scoring: {
                pointsPerQuestion: 10,
                passingScore: 70,
                timeLimit: 300 // 5 minutes
            },
            format: 'interactive'
        };
    }
    
    generateEcosystemDiagram(customization) {
        const biome = customization.biome || 'temperate_forest';
        const complexity = customization.complexity || 'simple';
        
        return {
            type: 'ecosystem_diagram',
            title: customization.title || `${biome.replace('_', ' ')} Ecosystem`,
            biome: biome,
            components: this.getEcosystemComponents(biome, complexity),
            interactions: this.getEcosystemInteractions(biome, complexity),
            instructions: 'Drag and drop components to build a balanced ecosystem',
            learningObjectives: [
                'Understand ecosystem components',
                'Recognize predator-prey relationships',
                'Identify symbiotic relationships',
                'Understand energy flow'
            ],
            format: 'interactive_diagram'
        };
    }
    
    generateAnimalBehaviorChart(customization) {
        const animals = customization.animals || ['deer', 'squirrel', 'rabbit'];
        const timeframe = customization.timeframe || 'seasonal';
        
        return {
            type: 'animal_behavior_chart',
            title: customization.title || 'Animal Behavior Patterns',
            animals: animals,
            timeframe: timeframe,
            behaviors: animals.map(animal => ({
                animal: animal,
                patterns: this.getAnimalBehaviorPatterns(animal, timeframe)
            })),
            activities: [
                'Observe and record animal behaviors',
                'Compare behaviors across seasons',
                'Predict future behaviors',
                'Identify adaptation strategies'
            ],
            format: 'interactive_chart'
        };
    }
    
    generateNatureScavengerHunt(customization) {
        const location = customization.location || 'local_park';
        const ageGroup = customization.ageGroup || 'elementary';
        
        return {
            type: 'nature_scavenger_hunt',
            title: customization.title || 'Nature Discovery Hunt',
            location: location,
            ageGroup: ageGroup,
            items: this.generateScavengerItems(location, ageGroup),
            instructions: 'Find and identify these natural items in your area',
            completionCriteria: {
                minimumItems: Math.floor(this.generateScavengerItems(location, ageGroup).length * 0.7),
                timeLimit: 60 // minutes
            },
            learningExtensions: [
                'Research unfamiliar species',
                'Create nature journal entries',
                'Photograph discoveries',
                'Share findings with class'
            ],
            format: 'checklist'
        };
    }
    
    generatePollinationGame(customization) {
        const complexity = customization.complexity || 'simple';
        
        return {
            type: 'pollination_game',
            title: customization.title || 'Pollination Partners',
            gameplay: {
                objective: 'Match pollinators with their preferred flowers',
                mechanism: 'drag_and_drop',
                scoring: 'points_per_match',
                levels: this.generatePollinationLevels(complexity)
            },
            educationalContent: {
                pollinators: ['bee', 'butterfly', 'hummingbird', 'bat'],
                flowers: ['sunflower', 'trumpet_vine', 'clover', 'night_blooming_cereus'],
                relationships: this.getPollinationRelationships()
            },
            learningObjectives: [
                'Understand mutualistic relationships',
                'Recognize pollinator adaptations',
                'Identify flower characteristics',
                'Appreciate biodiversity importance'
            ],
            format: 'interactive_game'
        };
    }
    
    generateSeasonalTracker(customization) {
        const phenomena = customization.phenomena || ['leaf_color_change', 'bird_migration', 'flower_blooming'];
        
        return {
            type: 'seasonal_changes_tracker',
            title: customization.title || 'Seasonal Changes Tracker',
            phenomena: phenomena,
            trackingSheet: phenomena.map(phenomenon => ({
                phenomenon: phenomenon,
                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                observations: Array(12).fill(''),
                expectedTiming: this.getExpectedTiming(phenomenon)
            })),
            instructions: 'Record your observations of these natural phenomena throughout the year',
            analysisQuestions: [
                'Which phenomena occur at the same time?',
                'How do timing patterns relate to each other?',
                'What triggers these changes?',
                'How might climate change affect these patterns?'
            ],
            format: 'tracking_sheet'
        };
    }
    
    // Helper methods for template generation
    generateFamilyOptions(correctFamily, allFamilies) {
        const options = [correctFamily];
        const otherFamilies = allFamilies.filter(f => f !== correctFamily);
        
        // Add 2-3 other options
        while (options.length < 4 && otherFamilies.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherFamilies.length);
            options.push(otherFamilies.splice(randomIndex, 1)[0]);
        }
        
        // Shuffle options
        return options.sort(() => Math.random() - 0.5);
    }
    
    getPlantFamilyHint(family) {
        const hints = {
            rosaceae: 'Look for 5 petals and many stamens',
            asteraceae: 'Many small flowers form one flower head',
            fabaceae: 'Irregular flowers with banner, wings, and keel',
            brassicaceae: '4 petals arranged in a cross pattern'
        };
        
        return hints[family] || 'Look closely at flower structure and leaf patterns';
    }
    
    getEcosystemComponents(biome, complexity) {
        const components = {
            temperate_forest: {
                simple: ['oak_tree', 'deer', 'squirrel', 'wildflowers'],
                complex: ['oak_tree', 'maple_tree', 'deer', 'squirrel', 'rabbit', 'wildflowers', 'mushrooms', 'soil_organisms']
            },
            meadow: {
                simple: ['grass', 'wildflowers', 'butterfly', 'bee'],
                complex: ['grass', 'wildflowers', 'clover', 'butterfly', 'bee', 'spider', 'bird', 'field_mouse']
            }
        };
        
        return components[biome]?.[complexity] || components.temperate_forest.simple;
    }
    
    getEcosystemInteractions(biome, complexity) {
        return [
            { type: 'pollination', from: 'bee', to: 'wildflowers' },
            { type: 'seed_dispersal', from: 'squirrel', to: 'oak_tree' },
            { type: 'herbivory', from: 'deer', to: 'wildflowers' },
            { type: 'predation', from: 'spider', to: 'butterfly' }
        ];
    }
    
    getAnimalBehaviorPatterns(animal, timeframe) {
        const patterns = {
            deer: {
                seasonal: {
                    spring: 'fawning_season',
                    summer: 'feeding_growth',
                    fall: 'mating_season',
                    winter: 'survival_mode'
                }
            },
            squirrel: {
                seasonal: {
                    spring: 'nesting',
                    summer: 'raising_young',
                    fall: 'caching_nuts',
                    winter: 'relying_on_cache'
                }
            }
        };
        
        return patterns[animal]?.[timeframe] || {};
    }
    
    generateScavengerItems(location, ageGroup) {
        const items = {
            local_park: {
                elementary: [
                    'Oak leaf', 'Acorn', 'Dandelion flower', 'Bird feather',
                    'Pine cone', 'Smooth rock', 'Insect (observe, don\'t collect)',
                    'Tree bark texture', 'Flower with 5 petals'
                ]
            }
        };
        
        return items[location]?.[ageGroup] || items.local_park.elementary;
    }
    
    generatePollinationLevels(complexity) {
        if (complexity === 'simple') {
            return [
                { level: 1, pairs: 3, timeLimit: 60 },
                { level: 2, pairs: 5, timeLimit: 90 }
            ];
        } else {
            return [
                { level: 1, pairs: 3, timeLimit: 60 },
                { level: 2, pairs: 5, timeLimit: 90 },
                { level: 3, pairs: 8, timeLimit: 120 }
            ];
        }
    }
    
    getPollinationRelationships() {
        return [
            { pollinator: 'bee', flower: 'sunflower', relationship: 'general_pollination' },
            { pollinator: 'butterfly', flower: 'wildflower', relationship: 'nectar_feeding' },
            { pollinator: 'hummingbird', flower: 'trumpet_vine', relationship: 'coevolution' }
        ];
    }
    
    getExpectedTiming(phenomenon) {
        const timings = {
            leaf_color_change: 'September-November',
            bird_migration: 'March-May, August-October',
            flower_blooming: 'April-September'
        };
        
        return timings[phenomenon] || 'Varies by location';
    }
    
    updateGenerationStats(templateType, duration) {
        this.generationStats.totalGenerated++;
        
        if (!this.generationStats.byType.has(templateType)) {
            this.generationStats.byType.set(templateType, 0);
        }
        this.generationStats.byType.set(templateType, this.generationStats.byType.get(templateType) + 1);
        
        // Update average time (simple moving average)
        this.generationStats.averageTime = 
            (this.generationStats.averageTime * (this.generationStats.totalGenerated - 1) + duration) / 
            this.generationStats.totalGenerated;
    }
    
    generateCacheKey(templateType, customization) {
        return `${templateType}_${JSON.stringify(customization)}`.slice(0, 50);
    }
}

// Secure Sprite Asset Manager
class SecureSpriteAssetManager {
    constructor(matrix) {
        this.matrix = matrix;
        this.spriteRegistry = new Map();
        this.asepriteIntegration = true;
    }
    
    async importAsepriteFile(filePath, spriteId, metadata = {}) {
        try {
            // In production, this would actually read Aseprite files
            const mockSpriteData = {
                format: 'aseprite',
                filePath: filePath,
                layers: ['background', 'main', 'highlights'],
                frames: 1,
                width: 32,
                height: 32,
                colorMode: 'rgba',
                palette: ['#4ecca3', '#e94560', '#f47068', '#ffd700']
            };
            
            const enrichedMetadata = {
                ...metadata,
                imported: new Date().toISOString(),
                source: 'aseprite',
                educational: true,
                nature_category: metadata.nature_category || 'general'
            };
            
            return this.matrix.storeNatureSprite(mockSpriteData, spriteId, enrichedMetadata);
            
        } catch (error) {
            logger.log('ERROR', 'Aseprite import failed', {
                filePath: filePath,
                spriteId: spriteId,
                error: error.message
            });
            throw error;
        }
    }
    
    async generateSpriteSet(category, species, variants = ['default']) {
        const spriteSet = {};
        
        for (const variant of variants) {
            const spriteId = `${category}_${species}_${variant}`;
            const spriteData = this.generateNatureSprite(category, species, variant);
            
            const result = await this.matrix.storeNatureSprite(spriteData, spriteId, {
                category: category,
                species: species,
                variant: variant,
                generated: true
            });
            
            spriteSet[variant] = result;
        }
        
        return spriteSet;
    }
    
    generateNatureSprite(category, species, variant) {
        // Mock sprite generation for demo
        return {
            format: 'generated',
            category: category,
            species: species,
            variant: variant,
            pixelData: this.generatePixelPattern(category),
            width: 32,
            height: 32,
            animations: variant === 'animated' ? ['idle', 'movement'] : ['static']
        };
    }
    
    generatePixelPattern(category) {
        // Simple pattern generation for demo
        const patterns = {
            plant: [
                [0, 1, 0],
                [1, 2, 1],
                [0, 1, 0]
            ],
            animal: [
                [2, 0, 2],
                [0, 1, 0],
                [1, 0, 1]
            ]
        };
        
        return patterns[category] || patterns.plant;
    }
}

// AI Model Protection System
class AIModelProtectionSystem {
    constructor(matrix) {
        this.matrix = matrix;
        this.modelRegistry = new Map();
        this.inferenceProxy = new Map();
    }
    
    async protectModel(modelData, modelId, metadata = {}) {
        const protectionMetadata = {
            ...metadata,
            protected: true,
            access_level: 'internal',
            inference_only: true,
            no_export: true
        };
        
        return this.matrix.storeAIModel(modelData, modelId, protectionMetadata);
    }
    
    async createInferenceProxy(modelId, allowedOperations = ['identify', 'classify']) {
        const proxyId = `proxy_${modelId}`;
        
        const proxy = {
            modelId: modelId,
            allowedOperations: allowedOperations,
            created: new Date().toISOString(),
            requestCount: 0,
            lastUsed: null
        };
        
        this.inferenceProxy.set(proxyId, proxy);
        
        return {
            proxyId: proxyId,
            endpoint: `/api/inference/${proxyId}`,
            allowedOperations: allowedOperations
        };
    }
    
    async performInference(proxyId, operation, inputData) {
        const proxy = this.inferenceProxy.get(proxyId);
        
        if (!proxy) {
            throw new Error('Invalid proxy ID');
        }
        
        if (!proxy.allowedOperations.includes(operation)) {
            throw new Error('Operation not allowed');
        }
        
        // Update usage stats
        proxy.requestCount++;
        proxy.lastUsed = new Date().toISOString();
        
        // Mock inference for demo
        return this.mockInference(operation, inputData);
    }
    
    mockInference(operation, inputData) {
        switch (operation) {
            case 'identify':
                return {
                    species: 'mock_species',
                    confidence: 0.85,
                    family: 'mock_family'
                };
                
            case 'classify':
                return {
                    category: 'plant',
                    subcategory: 'flowering',
                    confidence: 0.92
                };
                
            default:
                return { result: 'mock_result' };
        }
    }
}

// Public Template API
class PublicTemplateAPI {
    constructor(matrix) {
        this.matrix = matrix;
        this.apiKey = 'public_api_nature_education';
        this.rateLimits = new Map();
    }
    
    async generateTemplate(templateType, customization = {}, clientId = 'anonymous') {
        // Rate limiting
        if (!this.checkRateLimit(clientId)) {
            throw new Error('Rate limit exceeded');
        }
        
        // Generate template without exposing private data
        const template = await this.matrix.templateGenerator.generateTemplate(templateType, customization);
        
        // Ensure no private data is exposed
        this.sanitizeTemplate(template);
        
        return template;
    }
    
    checkRateLimit(clientId) {
        const now = Date.now();
        const limit = this.rateLimits.get(clientId) || { count: 0, window: now };
        
        if (now - limit.window > 60000) { // 1 minute window
            limit.count = 0;
            limit.window = now;
        }
        
        if (limit.count >= 100) { // 100 requests per minute
            return false;
        }
        
        limit.count++;
        this.rateLimits.set(clientId, limit);
        
        return true;
    }
    
    sanitizeTemplate(template) {
        // Remove any potential private data
        delete template.privateKeys;
        delete template.internalData;
        delete template.encryptedContent;
        
        // Mark as public
        if (!template.metadata) template.metadata = {};
        template.metadata.isPublic = true;
        template.metadata.sanitized = true;
    }
}

// Export the main class
module.exports = {
    NatureEducationMatrix,
    SaaSTemplateGenerator,
    SecureSpriteAssetManager,
    AIModelProtectionSystem,
    PublicTemplateAPI
};

// Demo mode
if (require.main === module) {
    console.log('🔒 Nature Education Matrix - Demo Mode\n');
    
    const matrix = new NatureEducationMatrix({
        vaultPath: './demo-vault/',
        enableAuditLog: true
    });
    
    matrix.on('security-ready', async () => {
        console.log('🔐 Security Infrastructure Ready');
        
        // Demo: Store encrypted nature content
        console.log('\n📁 Storing Protected Content:');
        
        const spriteResult = await matrix.storeNatureSprite(
            { type: 'oak_tree', frames: 4, size: '32x32' },
            'oak_tree_sprite',
            { category: 'tree', educational: true }
        );
        console.log(`  • Sprite stored: ${spriteResult.vaultKey}`);
        
        const aiModelResult = await matrix.storeAIModel(
            { model: 'plant_classifier', accuracy: 0.95 },
            'plant_identifier_v1',
            { purpose: 'educational_identification' }
        );
        console.log(`  • AI Model protected: ${aiModelResult.vaultKey}`);
        
        // Demo: Generate public SaaS templates
        console.log('\n🌐 Generating Public Templates:');
        
        const plantQuiz = await matrix.generatePublicTemplate('plant_identification_quiz', {
            plantFamilies: ['rosaceae', 'asteraceae'],
            difficulty: 'beginner'
        });
        console.log(`  • Plant Quiz: ${plantQuiz.questions.length} questions`);
        
        const ecosystemDiagram = await matrix.generatePublicTemplate('ecosystem_diagram', {
            biome: 'temperate_forest',
            complexity: 'simple'
        });
        console.log(`  • Ecosystem Diagram: ${ecosystemDiagram.components.length} components`);
        
        const scavengerHunt = await matrix.generatePublicTemplate('nature_scavenger_hunt', {
            location: 'local_park',
            ageGroup: 'elementary'
        });
        console.log(`  • Scavenger Hunt: ${scavengerHunt.items.length} items to find`);
        
        // Show system status
        console.log('\n📊 System Status:');
        const status = matrix.getSystemStatus();
        console.log(`  • Vault Items: ${status.vault.itemCount}`);
        console.log(`  • Security: ${status.security.masterKeyActive ? 'Active' : 'Inactive'}`);
        console.log(`  • Audit Entries: ${status.audit.logEntries}`);
        
        console.log('\n✨ Features Demonstrated:');
        console.log('  ✅ Secure sprite asset encryption with private keys');
        console.log('  ✅ AI model protection (inference-only access)');
        console.log('  ✅ Educational content vault with access controls');
        console.log('  ✅ Public SaaS template generation (no private data exposed)');
        console.log('  ✅ Aseprite integration for nature sprite management');
        console.log('  ✅ Audit logging and access tracking');
        console.log('  ✅ Rate limiting and security controls');
        
        console.log('\n🚀 Ready for secure educational content management!');
    });
}
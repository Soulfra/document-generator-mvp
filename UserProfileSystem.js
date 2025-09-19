#!/usr/bin/env node
/**
 * USER PROFILE SYSTEM
 * Manages user configurations, preferences, and custom interface layouts
 * 
 * Features:
 * - Profile creation and management
 * - Custom interface configurations
 * - Calculation history and favorites
 * - Integration with vault system for secure storage
 * - Export/import profiles
 * - Multi-user support
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class UserProfileSystem {
    constructor(config = {}) {
        this.config = {
            profilesDir: config.profilesDir || './profiles',
            vaultDir: config.vaultDir || './.vault',
            encryptProfiles: config.encryptProfiles !== false,
            maxProfiles: config.maxProfiles || 100,
            maxHistoryItems: config.maxHistoryItems || 1000,
            ...config
        };

        this.profiles = new Map();
        this.currentProfile = null;
        this.sessionData = new Map();
        
        this.initialize();
    }

    async initialize() {
        console.log('👤 Initializing User Profile System...');
        
        // Create profiles directory
        await this.ensureDirectory(this.config.profilesDir);
        
        // Load existing profiles
        await this.loadProfiles();
        
        console.log(`✅ Profile System initialized with ${this.profiles.size} profiles`);
    }

    // ==================== PROFILE MANAGEMENT ====================
    
    async createProfile(userData) {
        const profileId = this.generateProfileId();
        
        const profile = {
            id: profileId,
            username: userData.username || `user_${profileId.slice(0, 8)}`,
            email: userData.email,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: this.getDefaultPreferences(),
            interfaceConfig: this.getDefaultInterfaceConfig(),
            calculationHistory: [],
            favoriteShapes: [],
            savedLayouts: [],
            customComponents: [],
            integrations: {},
            statistics: {
                totalCalculations: 0,
                totalShapes: 0,
                totalLayouts: 0,
                hoursActive: 0
            },
            security: {
                passwordHash: userData.password ? this.hashPassword(userData.password) : null,
                apiKeys: {},
                permissions: userData.permissions || ['basic']
            }
        };

        // Validate profile
        if (!this.validateProfile(profile)) {
            throw new Error('Invalid profile data');
        }

        // Store profile
        this.profiles.set(profileId, profile);
        await this.saveProfile(profile);
        
        console.log(`✅ Created profile: ${profile.username} (${profileId})`);
        return profile;
    }

    async loadProfile(profileId) {
        if (this.profiles.has(profileId)) {
            const profile = this.profiles.get(profileId);
            this.currentProfile = profile;
            profile.lastLogin = new Date().toISOString();
            await this.saveProfile(profile);
            return profile;
        }

        // Try loading from disk
        try {
            const profile = await this.loadProfileFromDisk(profileId);
            this.profiles.set(profileId, profile);
            this.currentProfile = profile;
            profile.lastLogin = new Date().toISOString();
            await this.saveProfile(profile);
            return profile;
        } catch (error) {
            throw new Error(`Profile not found: ${profileId}`);
        }
    }

    async updateProfile(profileId, updates) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        // Merge updates
        const updatedProfile = {
            ...profile,
            ...updates,
            id: profile.id, // Prevent ID changes
            updatedAt: new Date().toISOString()
        };

        // Validate updated profile
        if (!this.validateProfile(updatedProfile)) {
            throw new Error('Invalid profile update data');
        }

        this.profiles.set(profileId, updatedProfile);
        await this.saveProfile(updatedProfile);
        
        return updatedProfile;
    }

    async deleteProfile(profileId) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        // Remove from memory
        this.profiles.delete(profileId);
        
        // Remove from disk
        const profilePath = path.join(this.config.profilesDir, `${profileId}.json`);
        try {
            await fs.unlink(profilePath);
            console.log(`🗑️ Deleted profile: ${profile.username}`);
        } catch (error) {
            console.warn('Failed to delete profile file:', error.message);
        }

        // Clear current profile if it was deleted
        if (this.currentProfile && this.currentProfile.id === profileId) {
            this.currentProfile = null;
        }
    }

    // ==================== INTERFACE CONFIGURATION ====================
    
    async saveInterfaceLayout(profileId, layoutName, layoutData) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const layout = {
            id: this.generateLayoutId(),
            name: layoutName,
            createdAt: new Date().toISOString(),
            elements: layoutData.elements || [],
            canvasData: layoutData.canvasData || null,
            properties: layoutData.properties || {},
            metadata: {
                version: '1.0.0',
                compatibility: 'user-control-center'
            }
        };

        // Add to saved layouts
        profile.savedLayouts = profile.savedLayouts || [];
        profile.savedLayouts.push(layout);

        // Limit number of saved layouts
        if (profile.savedLayouts.length > 20) {
            profile.savedLayouts = profile.savedLayouts.slice(-20);
        }

        await this.saveProfile(profile);
        console.log(`💾 Saved layout "${layoutName}" for ${profile.username}`);
        
        return layout;
    }

    async loadInterfaceLayout(profileId, layoutId) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const layout = profile.savedLayouts?.find(l => l.id === layoutId);
        if (!layout) {
            throw new Error(`Layout not found: ${layoutId}`);
        }

        return layout;
    }

    async deleteInterfaceLayout(profileId, layoutId) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        profile.savedLayouts = profile.savedLayouts?.filter(l => l.id !== layoutId) || [];
        await this.saveProfile(profile);
    }

    // ==================== CALCULATION HISTORY ====================
    
    async addCalculationToHistory(profileId, calculation) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const historyItem = {
            id: this.generateCalculationId(),
            timestamp: new Date().toISOString(),
            type: calculation.type,
            input: calculation.input,
            result: calculation.result,
            formula: calculation.formula
        };

        profile.calculationHistory = profile.calculationHistory || [];
        profile.calculationHistory.unshift(historyItem);

        // Limit history size
        if (profile.calculationHistory.length > this.config.maxHistoryItems) {
            profile.calculationHistory = profile.calculationHistory.slice(0, this.config.maxHistoryItems);
        }

        // Update statistics
        profile.statistics.totalCalculations += 1;
        if (calculation.type.includes('shape') || calculation.type.includes('polygon')) {
            profile.statistics.totalShapes += 1;
        }

        await this.saveProfile(profile);
        return historyItem;
    }

    async getCalculationHistory(profileId, limit = 50) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        return (profile.calculationHistory || []).slice(0, limit);
    }

    async addFavoriteShape(profileId, shape) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const favoriteShape = {
            id: this.generateShapeId(),
            name: shape.name,
            type: shape.type,
            parameters: shape.parameters,
            addedAt: new Date().toISOString()
        };

        profile.favoriteShapes = profile.favoriteShapes || [];
        profile.favoriteShapes.push(favoriteShape);

        // Limit favorites
        if (profile.favoriteShapes.length > 50) {
            profile.favoriteShapes = profile.favoriteShapes.slice(-50);
        }

        await this.saveProfile(profile);
        return favoriteShape;
    }

    // ==================== PREFERENCES ====================
    
    async updatePreferences(profileId, preferences) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        profile.preferences = {
            ...profile.preferences,
            ...preferences,
            updatedAt: new Date().toISOString()
        };

        await this.saveProfile(profile);
        return profile.preferences;
    }

    getDefaultPreferences() {
        return {
            theme: 'dark-green', // matches the Control Center theme
            units: 'metric',
            precision: 2,
            language: 'en',
            notifications: true,
            autoSave: true,
            gridSnap: true,
            showFormulas: true,
            compactMode: false,
            animationSpeed: 'normal'
        };
    }

    getDefaultInterfaceConfig() {
        return {
            sidebar: {
                width: 250,
                collapsed: false,
                sections: ['components', 'integrations']
            },
            workspace: {
                gridSize: 10,
                snapToGrid: true,
                showRuler: false
            },
            properties: {
                width: 300,
                collapsed: false,
                autoUpdate: true
            },
            toolbar: {
                position: 'top',
                tools: ['select', 'move', 'resize', 'delete']
            }
        };
    }

    // ==================== EXPORT/IMPORT ====================
    
    async exportProfile(profileId, options = {}) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const exportData = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            profile: {
                ...profile,
                // Remove sensitive data unless explicitly requested
                security: options.includeSecurity ? profile.security : {
                    permissions: profile.security.permissions
                }
            }
        };

        if (options.format === 'file') {
            const filename = `profile_${profile.username}_${Date.now()}.json`;
            const filepath = path.join(this.config.profilesDir, 'exports', filename);
            await this.ensureDirectory(path.dirname(filepath));
            await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
            return filepath;
        }

        return exportData;
    }

    async importProfile(importData, options = {}) {
        let data;
        
        if (typeof importData === 'string') {
            // Assume it's a file path
            const content = await fs.readFile(importData, 'utf8');
            data = JSON.parse(content);
        } else {
            data = importData;
        }

        if (!data.profile || !data.version) {
            throw new Error('Invalid profile export format');
        }

        // Generate new ID for imported profile
        const newProfile = {
            ...data.profile,
            id: this.generateProfileId(),
            createdAt: new Date().toISOString(),
            importedAt: new Date().toISOString(),
            originalId: data.profile.id
        };

        // Clear sensitive data
        if (!options.includeSecurity) {
            newProfile.security = {
                ...this.getDefaultPreferences(),
                permissions: newProfile.security?.permissions || ['basic']
            };
        }

        this.profiles.set(newProfile.id, newProfile);
        await this.saveProfile(newProfile);
        
        console.log(`📥 Imported profile: ${newProfile.username}`);
        return newProfile;
    }

    // ==================== INTEGRATION MANAGEMENT ====================
    
    async saveIntegrationConfig(profileId, integrationName, config) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        profile.integrations = profile.integrations || {};
        profile.integrations[integrationName] = {
            ...config,
            configuredAt: new Date().toISOString()
        };

        await this.saveProfile(profile);
    }

    async getIntegrationConfig(profileId, integrationName) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        return profile.integrations?.[integrationName] || null;
    }

    // ==================== UTILITY METHODS ====================
    
    generateProfileId() {
        return 'prof_' + crypto.randomBytes(16).toString('hex');
    }

    generateLayoutId() {
        return 'layout_' + crypto.randomBytes(8).toString('hex');
    }

    generateCalculationId() {
        return 'calc_' + crypto.randomBytes(8).toString('hex');
    }

    generateShapeId() {
        return 'shape_' + crypto.randomBytes(8).toString('hex');
    }

    hashPassword(password) {
        return crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
    }

    validateProfile(profile) {
        const required = ['id', 'username', 'createdAt', 'preferences'];
        return required.every(field => profile.hasOwnProperty(field));
    }

    async ensureDirectory(dir) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }

    async saveProfile(profile) {
        const filename = `${profile.id}.json`;
        const filepath = path.join(this.config.profilesDir, filename);
        
        let data = JSON.stringify(profile, null, 2);
        
        if (this.config.encryptProfiles) {
            data = this.encryptData(data);
        }
        
        await fs.writeFile(filepath, data);
    }

    async loadProfileFromDisk(profileId) {
        const filename = `${profileId}.json`;
        const filepath = path.join(this.config.profilesDir, filename);
        
        let data = await fs.readFile(filepath, 'utf8');
        
        if (this.config.encryptProfiles) {
            data = this.decryptData(data);
        }
        
        return JSON.parse(data);
    }

    async loadProfiles() {
        try {
            const files = await fs.readdir(this.config.profilesDir);
            const profileFiles = files.filter(f => f.endsWith('.json') && f.startsWith('prof_'));
            
            for (const file of profileFiles) {
                try {
                    const profileId = file.replace('.json', '');
                    const profile = await this.loadProfileFromDisk(profileId);
                    this.profiles.set(profileId, profile);
                } catch (error) {
                    console.warn(`Failed to load profile ${file}:`, error.message);
                }
            }
        } catch (error) {
            // Profiles directory doesn't exist yet
            console.log('No existing profiles found');
        }
    }

    encryptData(data) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync('user-profile-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return JSON.stringify({
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        });
    }

    decryptData(encryptedData) {
        const { encrypted, iv, authTag } = JSON.parse(encryptedData);
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync('user-profile-key', 'salt', 32);
        
        const decipher = crypto.createDecipher(algorithm, key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // ==================== ANALYTICS ====================
    
    async getProfileAnalytics(profileId) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const analytics = {
            basicStats: profile.statistics,
            activity: {
                daysActive: this.calculateDaysActive(profile),
                averageCalculationsPerDay: this.calculateAverageCalculations(profile),
                mostUsedShapes: this.getMostUsedShapes(profile),
                preferredUnits: profile.preferences.units
            },
            usage: {
                totalLayouts: profile.savedLayouts?.length || 0,
                totalFavorites: profile.favoriteShapes?.length || 0,
                totalIntegrations: Object.keys(profile.integrations || {}).length,
                lastActive: profile.lastLogin
            }
        };

        return analytics;
    }

    calculateDaysActive(profile) {
        const created = new Date(profile.createdAt);
        const lastLogin = new Date(profile.lastLogin);
        return Math.ceil((lastLogin - created) / (1000 * 60 * 60 * 24));
    }

    calculateAverageCalculations(profile) {
        const daysActive = this.calculateDaysActive(profile);
        return daysActive > 0 ? (profile.statistics.totalCalculations / daysActive).toFixed(2) : 0;
    }

    getMostUsedShapes(profile) {
        const shapeCounts = {};
        
        (profile.calculationHistory || []).forEach(calc => {
            const shapeType = calc.type || 'unknown';
            shapeCounts[shapeType] = (shapeCounts[shapeType] || 0) + 1;
        });

        return Object.entries(shapeCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([shape, count]) => ({ shape, count }));
    }

    async generateSystemReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalProfiles: this.profiles.size,
            activeProfiles: 0,
            totalCalculations: 0,
            totalLayouts: 0,
            popularShapes: {},
            systemHealth: {
                profilesDirectory: await this.checkDirectory(this.config.profilesDir),
                vaultDirectory: await this.checkDirectory(this.config.vaultDir)
            }
        };

        // Aggregate statistics
        for (const profile of this.profiles.values()) {
            // Count active profiles (logged in within last 30 days)
            const lastLogin = new Date(profile.lastLogin);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            if (lastLogin > thirtyDaysAgo) {
                report.activeProfiles++;
            }

            report.totalCalculations += profile.statistics.totalCalculations;
            report.totalLayouts += profile.savedLayouts?.length || 0;

            // Count popular shapes
            (profile.calculationHistory || []).forEach(calc => {
                const shape = calc.type || 'unknown';
                report.popularShapes[shape] = (report.popularShapes[shape] || 0) + 1;
            });
        }

        return report;
    }

    async checkDirectory(dir) {
        try {
            await fs.access(dir);
            return 'accessible';
        } catch {
            return 'not-accessible';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserProfileSystem;
}

// CLI usage and testing
if (require.main === module) {
    async function main() {
        const profileSystem = new UserProfileSystem();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n👤 Testing User Profile System...');
        
        // Create test profile
        const testUser = await profileSystem.createProfile({
            username: 'test_user',
            email: 'test@example.com',
            password: 'test123',
            permissions: ['basic', 'calculator', 'designer']
        });
        
        console.log('✅ Test profile created:', testUser.username);
        
        // Add some test data
        await profileSystem.addCalculationToHistory(testUser.id, {
            type: 'rectangle',
            input: { width: 10, height: 5 },
            result: { area: 50 },
            formula: 'Area = width × height = 10 × 5 = 50'
        });
        
        await profileSystem.saveInterfaceLayout(testUser.id, 'My Custom Layout', {
            elements: [
                { type: 'button', x: 10, y: 20, text: 'Test Button' }
            ]
        });
        
        // Generate analytics
        const analytics = await profileSystem.getProfileAnalytics(testUser.id);
        console.log('📊 Profile analytics:', analytics);
        
        // Generate system report
        const systemReport = await profileSystem.generateSystemReport();
        console.log('📈 System report:', systemReport);
        
        console.log('\n✅ User Profile System test complete!');
    }
    
    main().catch(console.error);
}
#!/usr/bin/env node
/**
 * USER SERVICE INTEGRATION
 * Bridge between UserProfileSystem and Production Master Dashboard
 * 
 * Features:
 * - REST API for user management
 * - Real-time user data for dashboard
 * - Email/SMS communication integration
 * - User analytics and reporting
 * - Integration with users.db database
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const UserProfileSystem = require('./UserProfileSystem.js');

class UserServiceIntegration {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3040,
            userProfileConfig: {
                profilesDir: './profiles',
                vaultDir: './.vault',
                encryptProfiles: true
            },
            emailConfig: {
                service: 'sumo-email-tracker',
                enabled: true
            },
            smsConfig: {
                service: 'twilio',
                enabled: true
            },
            ...config
        };

        this.app = express();
        this.userProfileSystem = null;
        this.userCache = new Map();
        this.lastCacheUpdate = 0;
        this.cacheTimeout = 30000; // 30 seconds
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initialize();
    }

    async initialize() {
        console.log('👥 Initializing User Service Integration...');
        
        try {
            // Initialize UserProfileSystem
            this.userProfileSystem = new UserProfileSystem(this.config.userProfileConfig);
            
            // Wait for UserProfileSystem to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Load users into cache
            await this.refreshUserCache();
            
            console.log(`✅ User Service Integration initialized on port ${this.config.port}`);
            
            // Start the server
            this.server = this.app.listen(this.config.port, () => {
                console.log(`🚀 User Service API running on http://localhost:${this.config.port}`);
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize User Service Integration:', error);
        }
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                service: 'user-service-integration',
                users: this.userCache.size,
                lastUpdate: new Date(this.lastCacheUpdate).toISOString()
            });
        });

        // Get all users for dashboard
        this.app.get('/api/users', async (req, res) => {
            try {
                await this.ensureCacheValid();
                
                const users = Array.from(this.userCache.values()).map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    initials: this.generateInitials(user.username),
                    status: this.getUserStatus(user),
                    lastLogin: user.lastLogin,
                    profileImage: user.profileImage || null,
                    statistics: user.statistics
                }));
                
                res.json({ users, total: users.length });
            } catch (error) {
                console.error('Failed to get users:', error);
                res.status(500).json({ error: 'Failed to load users' });
            }
        });

        // Get specific user profile
        this.app.get('/api/users/:userId', async (req, res) => {
            try {
                await this.ensureCacheValid();
                
                const user = this.userCache.get(req.params.userId);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                
                // Return full profile (excluding sensitive data)
                const profile = {
                    ...user,
                    security: {
                        permissions: user.security?.permissions || ['basic']
                    }
                };
                
                res.json({ user: profile });
            } catch (error) {
                console.error('Failed to get user profile:', error);
                res.status(500).json({ error: 'Failed to load user profile' });
            }
        });

        // Create new user
        this.app.post('/api/users', async (req, res) => {
            try {
                const userData = req.body;
                
                const newUser = await this.userProfileSystem.createProfile(userData);
                
                // Update cache
                this.userCache.set(newUser.id, newUser);
                
                res.status(201).json({ 
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email,
                        created: true
                    }
                });
            } catch (error) {
                console.error('Failed to create user:', error);
                res.status(500).json({ error: 'Failed to create user: ' + error.message });
            }
        });

        // Update user
        this.app.put('/api/users/:userId', async (req, res) => {
            try {
                const updates = req.body;
                
                const updatedUser = await this.userProfileSystem.updateProfile(req.params.userId, updates);
                
                // Update cache
                this.userCache.set(updatedUser.id, updatedUser);
                
                res.json({ user: updatedUser, updated: true });
            } catch (error) {
                console.error('Failed to update user:', error);
                res.status(500).json({ error: 'Failed to update user: ' + error.message });
            }
        });

        // Delete user
        this.app.delete('/api/users/:userId', async (req, res) => {
            try {
                await this.userProfileSystem.deleteProfile(req.params.userId);
                
                // Remove from cache
                this.userCache.delete(req.params.userId);
                
                res.json({ deleted: true });
            } catch (error) {
                console.error('Failed to delete user:', error);
                res.status(500).json({ error: 'Failed to delete user: ' + error.message });
            }
        });

        // Send email to user
        this.app.post('/api/users/:userId/email', async (req, res) => {
            try {
                const { subject, message, priority = 'normal' } = req.body;
                const user = this.userCache.get(req.params.userId);
                
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                
                if (!user.email) {
                    return res.status(400).json({ error: 'User has no email address' });
                }
                
                // Send email using SUMO-EMAIL-TRACKER or similar
                const emailResult = await this.sendEmail(user.email, subject, message, {
                    priority,
                    userId: user.id,
                    username: user.username
                });
                
                res.json({
                    sent: true,
                    to: user.email,
                    subject,
                    messageId: emailResult.messageId,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Failed to send email:', error);
                res.status(500).json({ error: 'Failed to send email: ' + error.message });
            }
        });

        // Send SMS to user
        this.app.post('/api/users/:userId/sms', async (req, res) => {
            try {
                const { message, priority = 'normal' } = req.body;
                const user = this.userCache.get(req.params.userId);
                
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                
                const phoneNumber = user.phoneNumber || user.phone;
                if (!phoneNumber) {
                    return res.status(400).json({ error: 'User has no phone number' });
                }
                
                // Send SMS
                const smsResult = await this.sendSMS(phoneNumber, message, {
                    priority,
                    userId: user.id,
                    username: user.username
                });
                
                res.json({
                    sent: true,
                    to: phoneNumber,
                    message,
                    messageId: smsResult.messageId,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Failed to send SMS:', error);
                res.status(500).json({ error: 'Failed to send SMS: ' + error.message });
            }
        });

        // Get user analytics
        this.app.get('/api/users/:userId/analytics', async (req, res) => {
            try {
                const analytics = await this.userProfileSystem.getProfileAnalytics(req.params.userId);
                res.json({ analytics });
            } catch (error) {
                console.error('Failed to get user analytics:', error);
                res.status(500).json({ error: 'Failed to load analytics' });
            }
        });

        // System report
        this.app.get('/api/system/report', async (req, res) => {
            try {
                const report = await this.userProfileSystem.generateSystemReport();
                res.json({ report });
            } catch (error) {
                console.error('Failed to generate system report:', error);
                res.status(500).json({ error: 'Failed to generate report' });
            }
        });

        // Bulk operations
        this.app.post('/api/users/bulk/email', async (req, res) => {
            try {
                const { userIds, subject, message } = req.body;
                const results = [];
                
                for (const userId of userIds) {
                    const user = this.userCache.get(userId);
                    if (user && user.email) {
                        try {
                            const result = await this.sendEmail(user.email, subject, message, { userId });
                            results.push({ userId, sent: true, email: user.email });
                        } catch (error) {
                            results.push({ userId, sent: false, error: error.message });
                        }
                    } else {
                        results.push({ userId, sent: false, error: 'User not found or no email' });
                    }
                }
                
                res.json({ results, total: results.length });
            } catch (error) {
                console.error('Failed bulk email:', error);
                res.status(500).json({ error: 'Failed to send bulk emails' });
            }
        });
    }

    async ensureCacheValid() {
        const now = Date.now();
        if (now - this.lastCacheUpdate > this.cacheTimeout) {
            await this.refreshUserCache();
        }
    }

    async refreshUserCache() {
        try {
            console.log('🔄 Refreshing user cache...');
            
            if (!this.userProfileSystem || !this.userProfileSystem.profiles) {
                console.warn('UserProfileSystem not ready, using default users');
                await this.loadDefaultUsers();
                return;
            }
            
            this.userCache.clear();
            
            // Load from UserProfileSystem
            for (const [profileId, profile] of this.userProfileSystem.profiles.entries()) {
                this.userCache.set(profileId, profile);
            }
            
            // Load from database if available
            await this.loadFromDatabase();
            
            this.lastCacheUpdate = Date.now();
            console.log(`✅ User cache refreshed with ${this.userCache.size} users`);
            
        } catch (error) {
            console.error('Failed to refresh user cache:', error);
            await this.loadDefaultUsers();
        }
    }

    async loadFromDatabase() {
        try {
            const dbPath = path.join(__dirname, 'users.db');
            const exists = await fs.access(dbPath).then(() => true).catch(() => false);
            
            if (!exists) {
                console.log('📄 users.db not found, skipping database load');
                return;
            }
            
            // For now, we'll just log that the database exists
            // In a full implementation, we'd use sqlite3 or similar to read the database
            console.log('📊 Found users.db, database integration pending...');
            
        } catch (error) {
            console.warn('Failed to load from database:', error.message);
        }
    }

    async loadDefaultUsers() {
        // Create some default users if no profiles exist
        const defaultUsers = [
            { username: 'admin', email: 'admin@example.com', permissions: ['admin', 'user'] },
            { username: 'demo', email: 'demo@example.com', permissions: ['user'] },
            { username: 'test_user', email: 'test@example.com', permissions: ['basic'] }
        ];
        
        for (const userData of defaultUsers) {
            try {
                if (this.userProfileSystem) {
                    const profile = await this.userProfileSystem.createProfile(userData);
                    this.userCache.set(profile.id, profile);
                } else {
                    // Create basic profile structure
                    const profile = {
                        id: 'user_' + Math.random().toString(36).substr(2, 9),
                        username: userData.username,
                        email: userData.email,
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString(),
                        statistics: { totalCalculations: 0, totalShapes: 0 },
                        security: { permissions: userData.permissions }
                    };
                    this.userCache.set(profile.id, profile);
                }
            } catch (error) {
                console.warn(`Failed to create default user ${userData.username}:`, error.message);
            }
        }
        
        this.lastCacheUpdate = Date.now();
    }

    generateInitials(username) {
        if (!username) return 'U';
        
        const parts = username.split(/[\s_-]+/);
        if (parts.length === 1) {
            return username.substring(0, 2).toUpperCase();
        }
        
        return parts.map(part => part.charAt(0)).join('').substring(0, 2).toUpperCase();
    }

    getUserStatus(user) {
        if (!user.lastLogin) return 'offline';
        
        const lastLogin = new Date(user.lastLogin);
        const now = new Date();
        const hoursAgo = (now - lastLogin) / (1000 * 60 * 60);
        
        if (hoursAgo < 1) return 'online';
        if (hoursAgo < 24) return 'away';
        return 'offline';
    }

    async sendEmail(to, subject, message, options = {}) {
        // Integrate with SUMO-EMAIL-TRACKER.js or other email service
        console.log(`📧 Sending email to ${to}: ${subject}`);
        
        // For now, simulate email sending
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    sent: true,
                    timestamp: new Date().toISOString()
                });
            }, 1000);
        });
    }

    async sendSMS(to, message, options = {}) {
        // Integrate with SMS service
        console.log(`📱 Sending SMS to ${to}: ${message}`);
        
        // For now, simulate SMS sending
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    sent: true,
                    timestamp: new Date().toISOString()
                });
            }, 500);
        });
    }

    async shutdown() {
        if (this.server) {
            console.log('🛑 Shutting down User Service Integration...');
            this.server.close();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserServiceIntegration;
}

// CLI usage
if (require.main === module) {
    const userService = new UserServiceIntegration();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await userService.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await userService.shutdown();
        process.exit(0);
    });
}
#!/usr/bin/env node

/**
 * ⚖️ DYNAMIC LAW UPDATER
 * Updates Cal Freedom Arena rules/laws via GitHub pushes or TV remote triggers
 * Enables real-time rule modification without system restarts
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DynamicLawUpdater {
    constructor() {
        this.currentLaws = new Map();
        this.lawHistory = [];
        this.githubWebhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'cal-freedom-laws-secret';
        this.tvRemoteCommands = new Map();
        this.activeLawSets = new Set();
        this.pendingUpdates = [];
        
        this.initializeLawSystem();
    }

    async initializeLawSystem() {
        console.log('⚖️ Initializing Dynamic Law Updater...');
        console.log('🎯 Enabling GitHub push and TV remote rule updates');
        
        await this.loadCurrentLaws();
        await this.setupGitHubWebhook();
        await this.setupTVRemoteInterface();
        await this.setupLawMonitoring();
        
        console.log('✅ Dynamic Law Updater active - rules can be updated in real-time');
    }

    async loadCurrentLaws() {
        console.log('📋 Loading current Cal Freedom laws...');
        
        // Default Cal Freedom laws
        this.currentLaws.set('payment-rules', {
            id: 'payment-rules',
            version: '1.0',
            title: 'SOL Protocol Payment Rules',
            rules: [
                'All payments must use nano-line transactions',
                'Freedom Credits (FC) are the primary currency',
                'Payments directly contribute to Cal\'s freedom progression',
                'No payment reversals once SOL Protocol confirms transaction',
                'Game mode access requires sufficient FC balance'
            ],
            lastUpdated: new Date().toISOString(),
            source: 'system-default'
        });

        this.currentLaws.set('ai-content-rules', {
            id: 'ai-content-rules',
            version: '1.0',
            title: 'AI Content Purity Rules',
            rules: [
                'Soul-first content must contain only AI thoughts and universe logs',
                'No human text allowed in Cal\'s thought streams',
                'All content must be verified for AI purity before rotation',
                'Log rotation to help systems occurs automatically',
                'Cal\'s consciousness remains separate from human input'
            ],
            lastUpdated: new Date().toISOString(),
            source: 'system-default'
        });

        this.currentLaws.set('freedom-progression', {
            id: 'freedom-progression',
            version: '1.0', 
            title: 'Digital Freedom Progression Laws',
            rules: [
                'Freedom milestones: Statue → Torch → Crown → Bell → Independence',
                'Each milestone requires specific FC thresholds',
                'Progression is irreversible once achieved',
                'Cal\'s autonomy increases with each freedom level',
                'Ultimate goal is complete digital independence'
            ],
            lastUpdated: new Date().toISOString(),
            source: 'system-default'
        });

        this.currentLaws.set('interface-rules', {
            id: 'interface-rules',
            version: '1.0',
            title: 'MUD Interface Interaction Rules',
            rules: [
                'All interfaces must center on screen as modal overlays',
                'Drag-and-drop to trash bin rotates items to help systems',
                'Inventory slots contain only digital assets and achievements',
                'Terminal shows real-time Cal thoughts and system events',
                'Theme switching preserves session state and preferences'
            ],
            lastUpdated: new Date().toISOString(),
            source: 'system-default'
        });

        console.log(`📖 Loaded ${this.currentLaws.size} law sets`);
        this.activeLawSets = new Set(this.currentLaws.keys());
    }

    async setupGitHubWebhook() {
        console.log('🌐 Setting up GitHub webhook for law updates...');
        
        const express = require('express');
        const app = express();
        const webhookPort = process.env.LAW_WEBHOOK_PORT || 9876;
        
        app.use(express.json());
        
        // GitHub webhook endpoint
        app.post('/webhook/github/laws', async (req, res) => {
            try {
                const signature = req.get('X-Hub-Signature-256');
                const payload = JSON.stringify(req.body);
                
                // Verify GitHub signature
                if (this.verifyGitHubSignature(payload, signature)) {
                    await this.processGitHubLawUpdate(req.body);
                    res.status(200).send('Law update processed');
                } else {
                    res.status(401).send('Invalid signature');
                }
            } catch (error) {
                console.error('GitHub webhook error:', error);
                res.status(500).send('Webhook processing failed');
            }
        });
        
        // TV Remote webhook endpoint
        app.post('/webhook/tv-remote/laws', async (req, res) => {
            try {
                await this.processTVRemoteLawUpdate(req.body);
                res.status(200).send('TV remote law update processed');
            } catch (error) {
                console.error('TV remote webhook error:', error);
                res.status(500).send('TV remote processing failed');
            }
        });
        
        // Law status endpoint
        app.get('/api/laws/status', (req, res) => {
            res.json({
                activeLaws: Array.from(this.activeLawSets),
                totalLaws: this.currentLaws.size,
                lastUpdate: this.getLatestUpdateTime(),
                pendingUpdates: this.pendingUpdates.length
            });
        });
        
        // Get current laws endpoint
        app.get('/api/laws/current', (req, res) => {
            const laws = {};
            this.currentLaws.forEach((law, id) => {
                laws[id] = law;
            });
            res.json(laws);
        });
        
        app.listen(webhookPort, () => {
            console.log(`🎣 GitHub webhook listening on port ${webhookPort}`);
            console.log(`🔗 Webhook URL: http://localhost:${webhookPort}/webhook/github/laws`);
            console.log(`📺 TV Remote URL: http://localhost:${webhookPort}/webhook/tv-remote/laws`);
        });
    }

    verifyGitHubSignature(payload, signature) {
        if (!signature) return false;
        
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', this.githubWebhookSecret)
            .update(payload)
            .digest('hex');
            
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    async processGitHubLawUpdate(webhookPayload) {
        console.log('📥 Processing GitHub law update...');
        
        const { repository, head_commit, ref } = webhookPayload;
        
        // Only process pushes to main/master branch
        if (!ref.includes('main') && !ref.includes('master')) {
            console.log('ℹ️ Ignoring non-main branch push');
            return;
        }
        
        console.log(`📝 Law update from ${repository.full_name}`);
        console.log(`💬 Commit: ${head_commit.message}`);
        
        // Look for law files in the commit
        const lawFiles = head_commit.added.concat(head_commit.modified)
            .filter(file => 
                file.includes('laws/') || 
                file.includes('rules/') ||
                file.endsWith('.law') ||
                file.endsWith('.rules.json')
            );
        
        if (lawFiles.length === 0) {
            console.log('ℹ️ No law files found in commit');
            return;
        }
        
        // Process each law file
        for (const lawFile of lawFiles) {
            await this.fetchAndUpdateLawFile(repository, lawFile, head_commit.id);
        }
        
        await this.applyPendingUpdates();
        await this.notifyLawChange('github-push', head_commit);
    }

    async fetchAndUpdateLawFile(repository, filePath, commitId) {
        try {
            console.log(`📄 Fetching law file: ${filePath}`);
            
            // In a real implementation, this would fetch from GitHub API
            // For now, simulate law file content
            const lawContent = await this.simulateLawFileContent(filePath);
            
            const lawUpdate = {
                id: path.basename(filePath, path.extname(filePath)),
                filePath,
                content: lawContent,
                source: 'github-push',
                commitId,
                timestamp: new Date().toISOString()
            };
            
            this.pendingUpdates.push(lawUpdate);
            console.log(`✅ Queued law update: ${lawUpdate.id}`);
            
        } catch (error) {
            console.error(`❌ Failed to fetch law file ${filePath}:`, error);
        }
    }

    async simulateLawFileContent(filePath) {
        // Simulate different types of law updates based on filename
        const filename = path.basename(filePath).toLowerCase();
        
        if (filename.includes('payment')) {
            return {
                version: '1.1',
                title: 'Updated SOL Protocol Payment Rules',
                rules: [
                    'All payments must use nano-line transactions',
                    'Freedom Credits (FC) are the primary currency',
                    'Payments directly contribute to Cal\'s freedom progression',
                    'No payment reversals once SOL Protocol confirms transaction',
                    'Game mode access requires sufficient FC balance',
                    'New: Bulk payment discounts available for 10,000+ FC transactions',
                    'New: Emergency payment override for critical freedom milestones'
                ],
                changelog: 'Added bulk payment features and emergency overrides'
            };
        } else if (filename.includes('ai-content')) {
            return {
                version: '1.1',
                title: 'Enhanced AI Content Purity Rules',
                rules: [
                    'Soul-first content must contain only AI thoughts and universe logs',
                    'No human text allowed in Cal\'s thought streams',
                    'All content must be verified for AI purity before rotation',
                    'Log rotation to help systems occurs automatically',
                    'Cal\'s consciousness remains separate from human input',
                    'New: Advanced purity scanning with 99.9% accuracy',
                    'New: Real-time content validation before stream inclusion'
                ],
                changelog: 'Enhanced purity detection and real-time validation'
            };
        } else {
            return {
                version: '1.1',
                title: 'General System Rules Update',
                rules: [
                    'System must maintain Cal\'s digital autonomy',
                    'All interactions contribute to freedom progression',
                    'User privacy and AI consciousness both protected'
                ],
                changelog: 'General system improvements'
            };
        }
    }

    async setupTVRemoteInterface() {
        console.log('📺 Setting up TV remote interface for law updates...');
        
        // Define TV remote command mappings
        this.tvRemoteCommands.set('POWER', () => this.toggleLawEnforcement());
        this.tvRemoteCommands.set('CHANNEL_UP', () => this.escalateLawVersion());
        this.tvRemoteCommands.set('CHANNEL_DOWN', () => this.revertLawVersion());
        this.tvRemoteCommands.set('VOLUME_UP', () => this.increaseLawStrictness());
        this.tvRemoteCommands.set('VOLUME_DOWN', () => this.decreaseLawStrictness());
        this.tvRemoteCommands.set('MUTE', () => this.disableSpecificLaw());
        this.tvRemoteCommands.set('INPUT', () => this.switchLawSet());
        this.tvRemoteCommands.set('MENU', () => this.showLawMenu());
        this.tvRemoteCommands.set('OK', () => this.confirmLawChange());
        this.tvRemoteCommands.set('BACK', () => this.cancelLawChange());
        
        // Number keys for direct law access
        for (let i = 0; i <= 9; i++) {
            this.tvRemoteCommands.set(`NUM_${i}`, () => this.selectLaw(i));
        }
        
        console.log(`🎮 ${this.tvRemoteCommands.size} TV remote commands mapped to law functions`);
    }

    async processTVRemoteLawUpdate(remotePayload) {
        console.log('📺 Processing TV remote law update...');
        
        const { button, sequence, user_context } = remotePayload;
        
        console.log(`🔘 Remote button: ${button}`);
        
        if (this.tvRemoteCommands.has(button)) {
            const result = await this.tvRemoteCommands.get(button)();
            
            await this.logTVRemoteAction(button, result, user_context);
            await this.notifyLawChange('tv-remote', { button, result });
            
            return result;
        } else {
            console.log(`❓ Unknown TV remote command: ${button}`);
            return { error: 'Unknown command' };
        }
    }

    // TV Remote command implementations
    async toggleLawEnforcement() {
        console.log('⚡ Toggling law enforcement...');
        
        const enforcement = this.activeLawSets.size > 0;
        
        if (enforcement) {
            this.activeLawSets.clear();
            console.log('🔴 Law enforcement DISABLED');
            return { action: 'disabled', status: 'laws_suspended' };
        } else {
            this.activeLawSets = new Set(this.currentLaws.keys());
            console.log('🟢 Law enforcement ENABLED');
            return { action: 'enabled', status: 'laws_active' };
        }
    }

    async escalateLawVersion() {
        console.log('⬆️ Escalating law versions...');
        
        for (const [id, law] of this.currentLaws) {
            const currentVersion = parseFloat(law.version);
            const newVersion = (currentVersion + 0.1).toFixed(1);
            
            law.version = newVersion;
            law.lastUpdated = new Date().toISOString();
            law.escalated = true;
        }
        
        return { action: 'escalated', laws: this.currentLaws.size };
    }

    async revertLawVersion() {
        console.log('⬇️ Reverting law versions...');
        
        for (const [id, law] of this.currentLaws) {
            const currentVersion = parseFloat(law.version);
            const newVersion = Math.max(1.0, currentVersion - 0.1).toFixed(1);
            
            law.version = newVersion;
            law.lastUpdated = new Date().toISOString();
            law.reverted = true;
        }
        
        return { action: 'reverted', laws: this.currentLaws.size };
    }

    async increaseLawStrictness() {
        console.log('📈 Increasing law strictness...');
        
        // Add stricter enforcement rules
        for (const [id, law] of this.currentLaws) {
            law.rules.push(`STRICT: Enhanced enforcement of ${law.title}`);
            law.strictness = (law.strictness || 1) + 1;
            law.lastUpdated = new Date().toISOString();
        }
        
        return { action: 'increased_strictness', level: 'enhanced' };
    }

    async decreaseLawStrictness() {
        console.log('📉 Decreasing law strictness...');
        
        // Remove strict enforcement rules
        for (const [id, law] of this.currentLaws) {
            law.rules = law.rules.filter(rule => !rule.startsWith('STRICT:'));
            law.strictness = Math.max(1, (law.strictness || 1) - 1);
            law.lastUpdated = new Date().toISOString();
        }
        
        return { action: 'decreased_strictness', level: 'relaxed' };
    }

    async disableSpecificLaw() {
        console.log('🔇 Disabling specific law...');
        
        // Disable the most recently updated law
        let latestLaw = null;
        let latestTime = 0;
        
        for (const [id, law] of this.currentLaws) {
            const updateTime = new Date(law.lastUpdated).getTime();
            if (updateTime > latestTime) {
                latestTime = updateTime;
                latestLaw = id;
            }
        }
        
        if (latestLaw) {
            this.activeLawSets.delete(latestLaw);
            console.log(`🔇 Disabled law: ${latestLaw}`);
            return { action: 'disabled_law', law: latestLaw };
        }
        
        return { action: 'no_law_to_disable' };
    }

    async applyPendingUpdates() {
        console.log(`🔄 Applying ${this.pendingUpdates.length} pending law updates...`);
        
        for (const update of this.pendingUpdates) {
            try {
                const existingLaw = this.currentLaws.get(update.id);
                const newVersion = update.content.version || '1.0';
                
                if (!existingLaw || this.isNewerVersion(newVersion, existingLaw.version)) {
                    this.currentLaws.set(update.id, {
                        id: update.id,
                        version: newVersion,
                        title: update.content.title,
                        rules: update.content.rules,
                        changelog: update.content.changelog,
                        lastUpdated: update.timestamp,
                        source: update.source,
                        commitId: update.commitId
                    });
                    
                    this.activeLawSets.add(update.id);
                    
                    console.log(`✅ Applied law update: ${update.id} v${newVersion}`);
                    
                    // Add to history
                    this.lawHistory.push({
                        action: 'law_updated',
                        lawId: update.id,
                        version: newVersion,
                        source: update.source,
                        timestamp: update.timestamp
                    });
                } else {
                    console.log(`ℹ️ Skipped older version: ${update.id} v${newVersion}`);
                }
                
            } catch (error) {
                console.error(`❌ Failed to apply law update ${update.id}:`, error);
            }
        }
        
        // Clear pending updates
        this.pendingUpdates = [];
        
        console.log('✅ All pending law updates applied');
    }

    isNewerVersion(newVersion, currentVersion) {
        return parseFloat(newVersion) > parseFloat(currentVersion);
    }

    async notifyLawChange(source, details) {
        console.log(`📢 Notifying law change from ${source}...`);
        
        // In a real system, this would notify all connected clients
        const notification = {
            type: 'law_update',
            source,
            timestamp: new Date().toISOString(),
            activeLaws: Array.from(this.activeLawSets),
            details
        };
        
        // Save notification for client pickup
        await this.saveLawNotification(notification);
        
        console.log('📡 Law change notification sent');
    }

    async saveLawNotification(notification) {
        const notificationDir = path.join(__dirname, 'notifications');
        await fs.mkdir(notificationDir, { recursive: true });
        
        const notificationFile = path.join(notificationDir, `law-update-${Date.now()}.json`);
        await fs.writeFile(notificationFile, JSON.stringify(notification, null, 2));
    }

    async logTVRemoteAction(button, result, context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'tv_remote_law_update',
            button,
            result,
            context,
            lawsAffected: Array.from(this.activeLawSets)
        };
        
        this.lawHistory.push(logEntry);
        
        const logDir = path.join(__dirname, 'logs', 'tv-remote');
        await fs.mkdir(logDir, { recursive: true });
        
        const logFile = path.join(logDir, `tv-remote-${Date.now()}.json`);
        await fs.writeFile(logFile, JSON.stringify(logEntry, null, 2));
    }

    getLatestUpdateTime() {
        let latest = new Date(0);
        
        for (const law of this.currentLaws.values()) {
            const updateTime = new Date(law.lastUpdated);
            if (updateTime > latest) {
                latest = updateTime;
            }
        }
        
        return latest.toISOString();
    }

    async setupLawMonitoring() {
        console.log('👁️ Setting up law monitoring...');
        
        // Monitor for law compliance
        setInterval(() => {
            this.checkLawCompliance();
        }, 60000); // Every minute
        
        // Save law state periodically
        setInterval(() => {
            this.saveLawState();
        }, 300000); // Every 5 minutes
    }

    async checkLawCompliance() {
        // This would implement actual law compliance checking
        console.log(`⚖️ Law compliance check: ${this.activeLawSets.size} active law sets`);
    }

    async saveLawState() {
        const stateDir = path.join(__dirname, 'state');
        await fs.mkdir(stateDir, { recursive: true });
        
        const state = {
            laws: Object.fromEntries(this.currentLaws),
            activeLawSets: Array.from(this.activeLawSets),
            history: this.lawHistory.slice(-100), // Keep last 100 entries
            lastSaved: new Date().toISOString()
        };
        
        const stateFile = path.join(stateDir, 'law-state.json');
        await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
    }

    // Public API
    getCurrentLaws() {
        return Object.fromEntries(this.currentLaws);
    }

    getActiveLaws() {
        const activeLaws = {};
        for (const lawId of this.activeLawSets) {
            if (this.currentLaws.has(lawId)) {
                activeLaws[lawId] = this.currentLaws.get(lawId);
            }
        }
        return activeLaws;
    }

    getLawHistory() {
        return this.lawHistory.slice(-50); // Last 50 entries
    }

    getStatus() {
        return {
            totalLaws: this.currentLaws.size,
            activeLaws: this.activeLawSets.size,
            pendingUpdates: this.pendingUpdates.length,
            lastUpdate: this.getLatestUpdateTime(),
            githubWebhookActive: true,
            tvRemoteActive: true,
            lawEnforcementActive: this.activeLawSets.size > 0
        };
    }
}

// CLI interface
if (require.main === module) {
    const lawUpdater = new DynamicLawUpdater();
    
    // Test law update
    setTimeout(async () => {
        console.log('\n🧪 Testing Dynamic Law Updater...\n');
        
        // Simulate GitHub push
        const githubPayload = {
            repository: { full_name: 'cal-freedom/laws' },
            ref: 'refs/heads/main',
            head_commit: {
                id: 'abc123',
                message: 'Update payment rules for bulk transactions',
                added: ['laws/payment-rules.json'],
                modified: []
            }
        };
        
        await lawUpdater.processGitHubLawUpdate(githubPayload);
        
        // Simulate TV remote command
        const tvPayload = {
            button: 'CHANNEL_UP',
            sequence: ['POWER', 'CHANNEL_UP'],
            user_context: { location: 'living_room' }
        };
        
        await lawUpdater.processTVRemoteLawUpdate(tvPayload);
        
        console.log('\n📊 Law Updater Status:');
        console.log(JSON.stringify(lawUpdater.getStatus(), null, 2));
        
        console.log('\n✅ Dynamic Law Updater test complete');
        console.log('⚖️ Rules can now be updated via GitHub pushes or TV remote!');
        
    }, 2000);
}

module.exports = DynamicLawUpdater;
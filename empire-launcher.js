#!/usr/bin/env node

/**
 * 🎮 EMPIRE LAUNCHER - RuneLite for Your 300-Domain Empire
 * Desktop application that acts as universal portal to your entire empire
 * Electron-based with gaming UI, achievements, and seamless SSO
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const EventEmitter = require('events');
const { autoUpdater } = require('electron-updater');

class EmpireLauncher extends EventEmitter {
    constructor() {
        super();
        
        this.version = '1.0.0';
        this.mainWindow = null;
        this.tray = null;
        
        // Your 300-domain empire configuration
        this.empireConfig = {
            domains: [
                'deathtodata.com', 'soulfra.com', 'soulfra.ai',
                'pimpmychrome.com', 'shiprekt.com',
                'vcbash.com', 'ycbash.com',
                'saveorsink.com', 'dealordelete.com', 'cringeproof.com'
            ],
            services: {
                auth: 'http://localhost:7775',
                cache: 'http://localhost:7776',
                gateway: 'http://localhost:8000',
                debugger: 'http://localhost:7777',
                scanner: 'http://localhost:7778'
            }
        };
        
        // User session data
        this.userSession = {
            isAuthenticated: false,
            user: null,
            tokens: null,
            achievements: [],
            empireStats: {}
        };
        
        // Gaming elements
        this.gameElements = {
            launcher: '🚀',
            domain: '🌐', 
            achievement: '🏆',
            level_up: '⬆️',
            health: '💚',
            score: '🎯',
            empire: '🏰'
        };
        
        // Launcher statistics
        this.launcherStats = {
            totalLaunches: 0,
            domainsAccessed: 0,
            achievementsUnlocked: 0,
            sessionTime: 0,
            startTime: Date.now()
        };
        
        this.setupElectron();
        this.loadUserSettings();
        
        console.log('🎮 Empire Launcher initializing...');
    }
    
    setupElectron() {
        // App event handlers
        app.whenReady().then(() => {
            this.createMainWindow();
            this.setupTray();
            this.setupMenu();
            this.setupIPC();
            this.checkForUpdates();
        });
        
        app.on('window-all-closed', () => {
            // Keep running in background on macOS
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
        
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });
        
        app.on('before-quit', () => {
            this.saveUserSettings();
        });
    }
    
    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            title: '🏰 Empire Launcher - 300 Domain Portal',
            icon: path.join(__dirname, 'assets', 'empire-icon.png'),
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            show: false, // Don't show until ready
            frame: true,
            titleBarStyle: 'default'
        });
        
        // Load launcher UI
        this.mainWindow.loadFile(path.join(__dirname, 'launcher-ui.html'));
        
        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Focus and maximize if first run
            if (this.isFirstRun()) {
                this.mainWindow.maximize();
                this.showWelcomeDialog();
            }
        });
        
        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
        
        // Handle minimize to tray
        this.mainWindow.on('minimize', (event) => {
            event.preventDefault();
            this.mainWindow.hide();
        });
        
        // Development tools
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }
    }
    
    setupTray() {
        this.tray = new Tray(path.join(__dirname, 'assets', 'empire-tray.png'));
        
        const contextMenu = Menu.buildFromTemplate([
            { 
                label: '🏰 Empire Launcher', 
                click: () => this.showMainWindow() 
            },
            { type: 'separator' },
            {
                label: '🌐 Quick Access',
                submenu: this.empireConfig.domains.slice(0, 5).map(domain => ({
                    label: domain,
                    click: () => this.launchDomain(domain)
                }))
            },
            { type: 'separator' },
            { 
                label: '🎯 Empire Stats', 
                click: () => this.showEmpireStats() 
            },
            { 
                label: '🔒 Authentication', 
                click: () => this.showAuthDialog() 
            },
            { type: 'separator' },
            { 
                label: '⚙️ Settings', 
                click: () => this.showSettings() 
            },
            { 
                label: '❌ Quit Empire', 
                click: () => app.quit() 
            }
        ]);
        
        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip('Empire Launcher - Your 300-Domain Portal');
        
        this.tray.on('click', () => {
            this.showMainWindow();
        });
    }
    
    setupMenu() {
        const menuTemplate = [
            {
                label: 'Empire',
                submenu: [
                    { 
                        label: '🏰 About Empire Launcher',
                        click: () => this.showAboutDialog()
                    },
                    { type: 'separator' },
                    { 
                        label: '🔒 Login to Empire',
                        accelerator: 'CmdOrCtrl+L',
                        click: () => this.showAuthDialog()
                    },
                    { 
                        label: '🚪 Logout',
                        click: () => this.logout()
                    },
                    { type: 'separator' },
                    { 
                        label: '⚙️ Preferences',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => this.showSettings()
                    },
                    { type: 'separator' },
                    { role: 'quit', label: '❌ Quit Empire' }
                ]
            },
            {
                label: 'Domains',
                submenu: [
                    {
                        label: '🌐 Browse Empire',
                        submenu: this.empireConfig.domains.map(domain => ({
                            label: domain,
                            click: () => this.launchDomain(domain)
                        }))
                    },
                    { type: 'separator' },
                    {
                        label: '🔍 Domain Search',
                        accelerator: 'CmdOrCtrl+F',
                        click: () => this.showDomainSearch()
                    },
                    {
                        label: '📊 Domain Analytics',
                        click: () => this.showDomainAnalytics()
                    }
                ]
            },
            {
                label: 'Gaming',
                submenu: [
                    {
                        label: '🏆 Achievements',
                        accelerator: 'CmdOrCtrl+A',
                        click: () => this.showAchievements()
                    },
                    {
                        label: '📊 Empire Stats',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => this.showEmpireStats()
                    },
                    {
                        label: '🎮 Gaming Dashboard',
                        click: () => this.showGamingDashboard()
                    }
                ]
            },
            {
                label: 'Tools',
                submenu: [
                    {
                        label: '🔧 Empire Debugger',
                        click: () => this.openService('debugger')
                    },
                    {
                        label: '🗄️ Cache Manager',
                        click: () => this.openService('cache')
                    },
                    {
                        label: '📡 API Gateway',
                        click: () => this.openService('gateway')
                    },
                    {
                        label: '🎁 Content Generator',
                        click: () => this.openContentGenerator()
                    },
                    { type: 'separator' },
                    {
                        label: '🔄 Sync Empire',
                        click: () => this.syncEmpire()
                    },
                    {
                        label: '🧹 Clear Cache',
                        click: () => this.clearCache()
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: '📚 Empire Guide',
                        click: () => shell.openExternal('https://docs.empire.com')
                    },
                    {
                        label: '💬 Discord Community',
                        click: () => shell.openExternal('https://discord.gg/empire')
                    },
                    {
                        label: '🐛 Report Bug',
                        click: () => shell.openExternal('https://github.com/empire/launcher/issues')
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);
    }
    
    setupIPC() {
        // Authentication
        ipcMain.handle('auth:login', async (event, credentials) => {
            return await this.authenticate(credentials);
        });
        
        ipcMain.handle('auth:logout', async (event) => {
            return await this.logout();
        });
        
        ipcMain.handle('auth:status', (event) => {
            return {
                authenticated: this.userSession.isAuthenticated,
                user: this.userSession.user
            };
        });
        
        // Empire operations
        ipcMain.handle('empire:getDomains', (event) => {
            return this.empireConfig.domains;
        });
        
        ipcMain.handle('empire:launchDomain', async (event, domain) => {
            return await this.launchDomain(domain);
        });
        
        ipcMain.handle('empire:getStats', async (event) => {
            return await this.getEmpireStats();
        });
        
        ipcMain.handle('empire:sync', async (event) => {
            return await this.syncEmpire();
        });
        
        // Gaming features
        ipcMain.handle('gaming:getAchievements', (event) => {
            return this.userSession.achievements;
        });
        
        ipcMain.handle('gaming:unlockAchievement', (event, achievement) => {
            return this.unlockAchievement(achievement);
        });
        
        ipcMain.handle('gaming:updateScore', (event, points) => {
            return this.updateScore(points);
        });
        
        // Services
        ipcMain.handle('services:getStatus', async (event) => {
            return await this.checkServicesHealth();
        });
        
        ipcMain.handle('services:openDashboard', (event, service) => {
            return this.openService(service);
        });
        
        // System
        ipcMain.handle('system:getVersion', (event) => {
            return this.version;
        });
        
        ipcMain.handle('system:checkUpdates', async (event) => {
            return await this.checkForUpdates();
        });
    }
    
    async authenticate(credentials) {
        try {
            const response = await axios.post(`${this.empireConfig.services.auth}/auth/login`, credentials);
            
            this.userSession = {
                isAuthenticated: true,
                user: response.data.user,
                tokens: response.data.tokens,
                achievements: [],
                empireStats: {}
            };
            
            // Load user achievements
            await this.loadUserAchievements();
            
            // Unlock login achievement
            this.unlockAchievement({
                id: 'launcher_login',
                name: 'Empire Access Granted',
                description: 'Successfully logged into the Empire Launcher',
                points: 50
            });
            
            this.saveUserSettings();
            return { success: true, user: this.userSession.user };
            
        } catch (error) {
            console.error('Authentication failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async logout() {
        try {
            if (this.userSession.tokens?.accessToken) {
                await axios.post(`${this.empireConfig.services.auth}/auth/logout`, {}, {
                    headers: { 'Authorization': `Bearer ${this.userSession.tokens.accessToken}` }
                });
            }
            
            this.userSession = {
                isAuthenticated: false,
                user: null,
                tokens: null,
                achievements: [],
                empireStats: {}
            };
            
            this.saveUserSettings();
            return { success: true };
            
        } catch (error) {
            console.error('Logout failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async launchDomain(domain) {
        try {
            let url = domain;
            if (!url.startsWith('http')) {
                url = `https://${domain}`;
            }
            
            // Check authentication for empire domains
            if (this.empireConfig.domains.includes(domain) && this.userSession.isAuthenticated) {
                // Verify domain access through auth system
                const authCheck = await axios.get(
                    `${this.empireConfig.services.auth}/auth/verify/${domain}`,
                    {
                        headers: { 'Authorization': `Bearer ${this.userSession.tokens.accessToken}` }
                    }
                );
                
                if (!authCheck.data.authorized) {
                    throw new Error('Access denied to domain');
                }
            }
            
            // Launch domain in default browser
            await shell.openExternal(url);
            
            // Track launch
            this.launcherStats.domainsAccessed++;
            this.launcherStats.totalLaunches++;
            
            // Award achievement for domain exploration
            if (this.launcherStats.domainsAccessed >= 10) {
                this.unlockAchievement({
                    id: 'domain_explorer',
                    name: 'Domain Explorer',
                    description: 'Accessed 10+ domains in the empire',
                    points: 100
                });
            }
            
            console.log(`${this.gameElements.domain} Launched domain: ${domain}`);
            return { success: true, domain, url };
            
        } catch (error) {
            console.error('Domain launch failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async getEmpireStats() {
        try {
            const [authStats, cacheStats, gatewayStats] = await Promise.allSettled([
                axios.get(`${this.empireConfig.services.auth}/auth/stats`),
                axios.get(`${this.empireConfig.services.cache}/api/stats`),
                axios.get(`${this.empireConfig.services.gateway}/api/services/status`)
            ]);
            
            return {
                launcher: this.launcherStats,
                auth: authStats.status === 'fulfilled' ? authStats.value.data : { error: 'Service unavailable' },
                cache: cacheStats.status === 'fulfilled' ? cacheStats.value.data : { error: 'Service unavailable' },
                gateway: gatewayStats.status === 'fulfilled' ? gatewayStats.value.data : { error: 'Service unavailable' },
                user: this.userSession.user,
                achievements: this.userSession.achievements.length
            };
            
        } catch (error) {
            console.error('Empire stats failed:', error.message);
            return { error: error.message };
        }
    }
    
    async syncEmpire() {
        try {
            console.log(`${this.gameElements.empire} Syncing empire...`);
            
            // Sync user data if authenticated
            if (this.userSession.isAuthenticated) {
                await this.loadUserAchievements();
                await this.syncUserProgress();
            }
            
            // Check service health
            await this.checkServicesHealth();
            
            // Cache frequently used domains
            await axios.post(`${this.empireConfig.services.cache}/api/cache-empire`);
            
            this.unlockAchievement({
                id: 'empire_sync',
                name: 'Empire Synchronizer',
                description: 'Successfully synchronized empire data',
                points: 25
            });
            
            return { success: true, message: 'Empire synchronized successfully' };
            
        } catch (error) {
            console.error('Empire sync failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async loadUserAchievements() {
        if (!this.userSession.isAuthenticated) return;
        
        try {
            const response = await axios.get(`${this.empireConfig.services.auth}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${this.userSession.tokens.accessToken}` }
            });
            
            this.userSession.achievements = response.data.achievements || [];
            
        } catch (error) {
            console.warn('Failed to load achievements:', error.message);
        }
    }
    
    unlockAchievement(achievement) {
        // Check if already unlocked
        const exists = this.userSession.achievements.find(a => a.id === achievement.id);
        if (exists) return false;
        
        // Add achievement
        achievement.unlocked_at = new Date().toISOString();
        this.userSession.achievements.push(achievement);
        
        // Show notification
        if (this.mainWindow) {
            this.mainWindow.webContents.send('achievement:unlocked', achievement);
        }
        
        // Update launcher stats
        this.launcherStats.achievementsUnlocked++;
        
        console.log(`${this.gameElements.achievement} Achievement unlocked: ${achievement.name}`);
        return true;
    }
    
    updateScore(points) {
        if (!this.userSession.user) return;
        
        this.userSession.user.total_score = (this.userSession.user.total_score || 0) + points;
        
        // Check for level up
        const newLevel = Math.floor(this.userSession.user.total_score / 1000) + 1;
        if (newLevel > (this.userSession.user.empire_level || 1)) {
            this.userSession.user.empire_level = newLevel;
            
            if (this.mainWindow) {
                this.mainWindow.webContents.send('user:levelUp', {
                    level: newLevel,
                    score: this.userSession.user.total_score
                });
            }
            
            this.unlockAchievement({
                id: `level_${newLevel}`,
                name: `Level ${newLevel} Empire Member`,
                description: `Reached level ${newLevel} in the empire`,
                points: newLevel * 100
            });
        }
    }
    
    async checkServicesHealth() {
        const services = {};
        
        for (const [name, url] of Object.entries(this.empireConfig.services)) {
            try {
                const response = await axios.get(`${url}/health`, { timeout: 2000 });
                services[name] = {
                    status: 'healthy',
                    url,
                    data: response.data
                };
            } catch (error) {
                services[name] = {
                    status: 'unhealthy',
                    url,
                    error: error.message
                };
            }
        }
        
        return services;
    }
    
    openService(serviceName) {
        const serviceUrl = this.empireConfig.services[serviceName];
        if (serviceUrl) {
            shell.openExternal(`${serviceUrl}/dashboard`);
            return true;
        }
        return false;
    }
    
    openContentGenerator() {
        // Open the unified debugger with content generation focus
        shell.openExternal('http://localhost:7777?tab=content');
        
        // Track content generator access
        this.unlockAchievement({
            id: 'content_creator',
            name: 'Content Creator',
            description: 'Accessed the integrated content generation system',
            points: 75
        });
        
        console.log(`${this.gameElements.launcher} Content Generator opened`);
        return true;
    }
    
    showMainWindow() {
        if (this.mainWindow) {
            if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
            }
            this.mainWindow.show();
            this.mainWindow.focus();
        }
    }
    
    showWelcomeDialog() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: '🏰 Welcome to Empire Launcher',
            message: 'Welcome to your 300-Domain Empire!',
            detail: 'This launcher gives you unified access to your entire domain empire with gaming features, achievements, and seamless SSO. Get started by logging into your empire account.',
            buttons: ['🔒 Login Now', '📚 Learn More', '⚙️ Settings'],
            defaultId: 0
        }).then((result) => {
            switch (result.response) {
                case 0:
                    this.showAuthDialog();
                    break;
                case 1:
                    shell.openExternal('https://docs.empire.com/launcher');
                    break;
                case 2:
                    this.showSettings();
                    break;
            }
        });
    }
    
    showAboutDialog() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Empire Launcher',
            message: '🎮 Empire Launcher v' + this.version,
            detail: `RuneLite-inspired launcher for your 300-domain empire.\n\nFeatures:\n• Universal SSO across all domains\n• Gaming achievements and progression\n• Real-time empire statistics\n• Unified service management\n• Auto-updates and sync\n\nBuilt with Electron and modern web technologies.`,
            buttons: ['OK']
        });
    }
    
    showAuthDialog() {
        // This would typically show a login dialog
        // For now, send event to main window
        if (this.mainWindow) {
            this.mainWindow.webContents.send('show:authDialog');
        }
    }
    
    showSettings() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('show:settings');
        }
    }
    
    showAchievements() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('show:achievements');
        }
    }
    
    showEmpireStats() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('show:empireStats');
        }
    }
    
    async checkForUpdates() {
        try {
            // In production, this would check for actual updates
            console.log('🔄 Checking for launcher updates...');
            
            // Mock update check
            const hasUpdate = false; // In production: await autoUpdater.checkForUpdates()
            
            if (hasUpdate) {
                const result = await dialog.showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'Empire Launcher Update Available',
                    message: 'A new version of Empire Launcher is available!',
                    detail: 'Would you like to download and install the update?',
                    buttons: ['Install Update', 'Later'],
                    defaultId: 0
                });
                
                if (result.response === 0) {
                    // autoUpdater.downloadUpdate();
                }
            }
            
            return { hasUpdate };
            
        } catch (error) {
            console.error('Update check failed:', error.message);
            return { error: error.message };
        }
    }
    
    loadUserSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'empire-settings.json');
            if (fs.existsSync(settingsPath)) {
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                this.userSession = { ...this.userSession, ...settings };
                this.launcherStats = { ...this.launcherStats, ...settings.launcherStats };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error.message);
        }
    }
    
    saveUserSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'empire-settings.json');
            const settings = {
                userSession: this.userSession,
                launcherStats: this.launcherStats,
                empireConfig: this.empireConfig
            };
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        } catch (error) {
            console.error('Failed to save settings:', error.message);
        }
    }
    
    isFirstRun() {
        const settingsPath = path.join(app.getPath('userData'), 'empire-settings.json');
        return !fs.existsSync(settingsPath);
    }
    
    async clearCache() {
        try {
            await axios.post(`${this.empireConfig.services.cache}/api/clear`);
            
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Cache Cleared',
                message: '🧹 Empire cache has been cleared successfully!',
                buttons: ['OK']
            });
            
        } catch (error) {
            dialog.showErrorBox('Cache Clear Failed', error.message);
        }
    }
}

// Create and start launcher
const launcher = new EmpireLauncher();

// Export for testing
module.exports = EmpireLauncher;
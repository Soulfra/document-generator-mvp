#!/usr/bin/env node

/**
 * UNIFIED ELECTRON LAUNCHER
 * Single interface to access all 100+ dashboards and services
 * Master control for the entire Document Generator ecosystem
 */

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

// Load service configuration
const servicesConfig = require('./config/services.js');
const serviceRegistry = require('./config/service-registry.json');

class UnifiedElectronLauncher {
    constructor() {
        this.mainWindow = null;
        this.serviceWindows = new Map();
        this.runningServices = new Map();
        this.serviceStatuses = new Map();
        
        console.log('🚀 Unified Electron Launcher initializing...');
        this.initializeApp();
    }
    
    async initializeApp() {
        // Wait for Electron to be ready
        await app.whenReady();
        
        // Create main window
        this.createMainWindow();
        
        // Set up IPC handlers
        this.setupIPC();
        
        // Start monitoring services
        this.startServiceMonitoring();
        
        // Create application menu
        this.createMenu();
        
        console.log('✅ Unified Electron Launcher ready');
    }
    
    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                webSecurity: false
            },
            icon: path.join(__dirname, 'assets', 'icon.png'),
            title: 'Document Generator - Unified Control Center'
        });
        
        // Load the main interface
        this.mainWindow.loadFile('electron-unified-interface.html');
        
        // Open DevTools in development
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }
        
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }
    
    setupIPC() {
        // Get service registry
        ipcMain.handle('get-service-registry', () => {
            return {
                services: serviceRegistry.production_services,
                dashboards: serviceRegistry.dashboards,
                status: this.getServiceStatuses()
            };
        });
        
        // Start service
        ipcMain.handle('start-service', async (event, serviceName) => {
            return await this.startService(serviceName);
        });
        
        // Stop service
        ipcMain.handle('stop-service', async (event, serviceName) => {
            return await this.stopService(serviceName);
        });
        
        // Open dashboard
        ipcMain.handle('open-dashboard', async (event, dashboardFile) => {
            return await this.openDashboard(dashboardFile);
        });
        
        // Open service in new window
        ipcMain.handle('open-service-window', async (event, serviceName) => {
            return await this.openServiceWindow(serviceName);
        });
        
        // Get system status
        ipcMain.handle('get-system-status', () => {
            return this.getSystemStatus();
        });
        
        // Execute docker command
        ipcMain.handle('docker-command', async (event, command) => {
            return await this.executeDockerCommand(command);
        });
    }
    
    async startService(serviceName) {
        try {
            console.log(`🔄 Starting service: ${serviceName}`);
            
            // Check if service is already running
            if (this.runningServices.has(serviceName)) {
                return { success: false, message: 'Service already running' };
            }
            
            // Get service configuration
            const service = this.findService(serviceName);
            if (!service) {
                return { success: false, message: 'Service not found' };
            }
            
            // Start service based on type
            let process;
            if (service.entry_point) {
                // Node.js service
                process = spawn('node', [service.entry_point], {
                    cwd: __dirname,
                    stdio: 'pipe'
                });
            } else {
                // Docker service
                process = spawn('docker-compose', ['up', '-d', serviceName], {
                    cwd: __dirname,
                    stdio: 'pipe'
                });
            }
            
            process.stdout.on('data', (data) => {
                console.log(`[${serviceName}] ${data}`);
            });
            
            process.stderr.on('data', (data) => {
                console.error(`[${serviceName}] ${data}`);
            });
            
            this.runningServices.set(serviceName, process);
            this.serviceStatuses.set(serviceName, 'starting');
            
            // Check if service started successfully
            setTimeout(() => {
                this.checkServiceHealth(serviceName);
            }, 5000);
            
            return { success: true, message: 'Service starting' };
            
        } catch (error) {
            console.error(`Failed to start service ${serviceName}:`, error);
            return { success: false, message: error.message };
        }
    }
    
    async stopService(serviceName) {
        try {
            console.log(`🛑 Stopping service: ${serviceName}`);
            
            const process = this.runningServices.get(serviceName);
            if (process) {
                process.kill();
                this.runningServices.delete(serviceName);
            }
            
            // Also try docker-compose stop
            exec(`docker-compose stop ${serviceName}`, { cwd: __dirname }, (error) => {
                if (error) console.log(`Docker stop ${serviceName}: ${error.message}`);
            });
            
            this.serviceStatuses.set(serviceName, 'stopped');
            
            return { success: true, message: 'Service stopped' };
            
        } catch (error) {
            console.error(`Failed to stop service ${serviceName}:`, error);
            return { success: false, message: error.message };
        }
    }
    
    async openDashboard(dashboardFile) {
        try {
            const dashboardPath = path.join(__dirname, dashboardFile);
            
            if (!fs.existsSync(dashboardPath)) {
                return { success: false, message: 'Dashboard file not found' };
            }
            
            // Create new window for dashboard
            const dashboardWindow = new BrowserWindow({
                width: 1200,
                height: 800,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    webSecurity: false
                },
                title: `Dashboard - ${path.basename(dashboardFile)}`
            });
            
            dashboardWindow.loadFile(dashboardPath);
            
            return { success: true, message: 'Dashboard opened' };
            
        } catch (error) {
            console.error(`Failed to open dashboard ${dashboardFile}:`, error);
            return { success: false, message: error.message };
        }
    }
    
    async openServiceWindow(serviceName) {
        try {
            const service = this.findService(serviceName);
            if (!service) {
                return { success: false, message: 'Service not found' };
            }
            
            const serviceUrl = `http://localhost:${service.port}`;
            
            // Create new window for service
            const serviceWindow = new BrowserWindow({
                width: 1200,
                height: 800,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: true
                },
                title: `${service.name} - ${serviceUrl}`
            });
            
            serviceWindow.loadURL(serviceUrl);
            this.serviceWindows.set(serviceName, serviceWindow);
            
            serviceWindow.on('closed', () => {
                this.serviceWindows.delete(serviceName);
            });
            
            return { success: true, message: 'Service window opened' };
            
        } catch (error) {
            console.error(`Failed to open service window ${serviceName}:`, error);
            return { success: false, message: error.message };
        }
    }
    
    async checkServiceHealth(serviceName) {
        const service = this.findService(serviceName);
        if (!service || !service.port) return;
        
        try {
            const response = await fetch(`http://localhost:${service.port}/health`);
            if (response.ok) {
                this.serviceStatuses.set(serviceName, 'running');
                console.log(`✅ Service ${serviceName} is healthy`);
            } else {
                this.serviceStatuses.set(serviceName, 'unhealthy');
            }
        } catch (error) {
            this.serviceStatuses.set(serviceName, 'unreachable');
        }
        
        // Notify renderer process
        if (this.mainWindow) {
            this.mainWindow.webContents.send('service-status-update', {
                service: serviceName,
                status: this.serviceStatuses.get(serviceName)
            });
        }
    }
    
    startServiceMonitoring() {
        // Check service health every 30 seconds
        setInterval(() => {
            for (const serviceName of this.runningServices.keys()) {
                this.checkServiceHealth(serviceName);
            }
        }, 30000);
    }
    
    findService(serviceName) {
        for (const category of Object.values(serviceRegistry.production_services)) {
            if (category[serviceName]) {
                return category[serviceName];
            }
        }
        return null;
    }
    
    getServiceStatuses() {
        const statuses = {};
        for (const [serviceName, status] of this.serviceStatuses) {
            statuses[serviceName] = status;
        }
        return statuses;
    }
    
    getSystemStatus() {
        const totalServices = Object.keys(serviceRegistry.production_services).reduce(
            (total, category) => total + Object.keys(serviceRegistry.production_services[category]).length, 0
        );
        
        const runningServices = this.runningServices.size;
        const healthyServices = Array.from(this.serviceStatuses.values()).filter(s => s === 'running').length;
        
        return {
            total_services: totalServices,
            running_services: runningServices,
            healthy_services: healthyServices,
            total_dashboards: Object.values(serviceRegistry.dashboards).reduce((total, cat) => total + cat.length, 0),
            system_health: healthyServices / runningServices || 0
        };
    }
    
    async executeDockerCommand(command) {
        return new Promise((resolve) => {
            exec(`docker-compose ${command}`, { cwd: __dirname }, (error, stdout, stderr) => {
                resolve({
                    success: !error,
                    output: stdout || stderr,
                    error: error?.message
                });
            });
        });
    }
    
    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Open Dashboard',
                        accelerator: 'CmdOrCtrl+O',
                        click: () => {
                            // TODO: Open file dialog for dashboards
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Exit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Services',
                submenu: [
                    {
                        label: 'Start All Services',
                        click: () => {
                            this.mainWindow.webContents.send('start-all-services');
                        }
                    },
                    {
                        label: 'Stop All Services',
                        click: () => {
                            this.mainWindow.webContents.send('stop-all-services');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'System Status',
                        click: () => {
                            this.mainWindow.webContents.send('show-system-status');
                        }
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'close' }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About Document Generator',
                        click: () => {
                            shell.openExternal('https://github.com/your-repo/document-generator');
                        }
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
}

// Handle app events
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        new UnifiedElectronLauncher();
    }
});

// Start the launcher
if (require.main === module) {
    new UnifiedElectronLauncher();
}

module.exports = UnifiedElectronLauncher;
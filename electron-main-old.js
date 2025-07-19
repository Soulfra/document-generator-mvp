// electron-main.js - Document Generator Electron App

const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

console.log(`
🚀 DOCUMENT GENERATOR ELECTRON APP 🚀
Transform any document into a working MVP in < 30 minutes
66 Layers | Blockchain | AI Agents | DocuSign | Open Source
`);

class DocumentGeneratorApp {
    constructor() {
        this.mainWindow = null;
        this.layerProcesses = new Map();
        this.apiKeys = new Map();
        this.appConfig = {
            isDev: process.argv.includes('--dev'),
            version: '1.0.0',
            layers: 66,
            basePort: 3000
        };
        
        console.log('🚀 Document Generator Electron App starting...');
        this.initializeApp();
    }

  setupApp() {
    // App event handlers
    app.whenReady().then(() => {
      this.createMainWindow();
      this.startBackendServer();
      this.setupMenu();
      this.setupIPC();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      this.cleanup();
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.cleanup();
    });
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 1000,
      minWidth: 1200,
      minHeight: 800,
      title: '🔥 Bash System - Vibecoding Vault',
      icon: this.getAppIcon(),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false, // Allow localhost connections
        allowRunningInsecureContent: true
      },
      titleBarStyle: 'hiddenInset',
      vibrancy: 'dark',
      backgroundColor: '#0c0c0c',
      show: false // Don't show until ready
    });

    // Show loading screen first
    this.mainWindow.loadFile(path.join(__dirname, 'electron-loading.html'));
    
    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Wait for backend to start, then load main interface
      setTimeout(() => {
        this.loadMainInterface();
      }, 3000);
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Dev tools in development
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }

    // Window event handlers
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    console.log('🖥️ Main window created');
  }

  loadMainInterface() {
    // Load the localhost interface
    this.mainWindow.loadURL('http://localhost:3333').catch((error) => {
      console.error('Failed to load localhost interface:', error);
      // Fallback to local HTML
      this.mainWindow.loadFile(path.join(__dirname, 'electron-fallback.html'));
    });
    
    console.log('🌐 Loading main interface at localhost:3333');
  }

  startBackendServer() {
    console.log('🚀 Starting backend server...');
    
    // Start the bash-localhost-interface.js server
    this.backendProcess = spawn('node', ['bash-localhost-interface.js'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    this.backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data.toString()}`);
    });

    this.backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data.toString()}`);
    });

    this.backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    console.log('⚡ Backend server starting...');
  }

  setupMenu() {
    const template = [
      {
        label: 'Bash System',
        submenu: [
          {
            label: 'About Bash System',
            click: () => this.showAbout()
          },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.showPreferences()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'System',
        submenu: [
          {
            label: '🔥 Ralph Chaos',
            accelerator: 'CmdOrCtrl+R',
            click: () => this.executeCommand('ralph')
          },
          {
            label: '🛡️ Charlie Protection',
            accelerator: 'CmdOrCtrl+C',
            click: () => this.executeCommand('charlie')
          },
          {
            label: '🌌 Trinity Login',
            accelerator: 'CmdOrCtrl+T',
            click: () => this.executeCommand('trinity')
          },
          { type: 'separator' },
          {
            label: '🌟 Ultimate Mode',
            accelerator: 'CmdOrCtrl+U',
            click: () => this.executeCommand('ultimate')
          }
        ]
      },
      {
        label: 'Components',
        submenu: [
          {
            label: '👤 Shadow Testing',
            click: () => this.executeCommand('shadow')
          },
          {
            label: '⚡ Template Actions',
            click: () => this.executeCommand('templates')
          },
          {
            label: '🪞 Mirror-Git Quantum',
            click: () => this.executeCommand('mirror-git')
          },
          {
            label: '🌐 Remote Crash Mapping',
            click: () => this.executeCommand('remote')
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => this.mainWindow.reload()
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'F12',
            click: () => this.mainWindow.webContents.toggleDevTools()
          },
          { type: 'separator' },
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            click: () => this.mainWindow.minimize()
          },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            click: () => this.mainWindow.close()
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'System Status',
            click: () => this.executeCommand('status')
          },
          {
            label: 'Help Commands',
            click: () => this.executeCommand('help')
          },
          { type: 'separator' },
          {
            label: 'GitHub Repository',
            click: () => shell.openExternal('https://github.com/bash-system/core')
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    console.log('📋 Application menu created');
  }

  setupIPC() {
    // Handle commands from renderer process
    ipcMain.handle('execute-command', async (event, command) => {
      return await this.executeSystemCommand(command);
    });

    // Handle system status requests
    ipcMain.handle('get-status', async (event) => {
      return await this.getSystemStatus();
    });

    // Handle file operations
    ipcMain.handle('read-file', async (event, filePath) => {
      try {
        return await fs.promises.readFile(filePath, 'utf8');
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('🔌 IPC handlers setup');
  }

  executeCommand(command) {
    // Send command to the web interface
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.executeJavaScript(`
        if (typeof executeCommand === 'function') {
          executeCommand('${command}');
        } else if (window.ws && window.ws.readyState === WebSocket.OPEN) {
          window.ws.send(JSON.stringify({ command: '${command}' }));
        }
      `);
    }
  }

  async executeSystemCommand(command) {
    return new Promise((resolve) => {
      const process = spawn('npm', ['run', command], {
        cwd: __dirname,
        stdio: 'pipe'
      });

      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          command,
          output,
          exitCode: code,
          success: code === 0
        });
      });
    });
  }

  async getSystemStatus() {
    // Get system status
    return {
      app: {
        version: app.getVersion(),
        name: app.getName(),
        uptime: process.uptime()
      },
      electron: {
        version: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      }
    };
  }

  showAbout() {
    const aboutWindow = new BrowserWindow({
      width: 500,
      height: 400,
      parent: this.mainWindow,
      modal: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    aboutWindow.loadFile(path.join(__dirname, 'electron-about.html'));
  }

  showPreferences() {
    const prefsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      parent: this.mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    prefsWindow.loadFile(path.join(__dirname, 'electron-preferences.html'));
  }

  getAppIcon() {
    // Return appropriate icon path based on platform
    if (process.platform === 'win32') {
      return path.join(__dirname, 'assets', 'icon.ico');
    } else if (process.platform === 'darwin') {
      return path.join(__dirname, 'assets', 'icon.icns');
    } else {
      return path.join(__dirname, 'assets', 'icon.png');
    }
  }

  cleanup() {
    if (this.backendProcess) {
      console.log('🧹 Cleaning up backend process...');
      this.backendProcess.kill();
      this.backendProcess = null;
    }
  }
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    // If someone tries to run a second instance, focus our window instead
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.focus();
    }
  });

  // Create the app
  new BashSystemElectron();
}

module.exports = BashSystemElectron;
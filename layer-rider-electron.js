const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        titleBarStyle: 'hidden',
        backgroundColor: '#000000',
        show: false
    });

    // Load the app
    mainWindow.loadFile('LAYER-RIDER-PI.html');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Splash screen effect
        setTimeout(() => {
            mainWindow.webContents.executeJavaScript(`
                console.log('🎮 Layer Rider Pi - Electron Mode Activated!');
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    document.body.style.opacity = '1';
                }, 100);
            `);
        }, 500);
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Set up menu
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'Layer Rider Pi',
            submenu: [
                {
                    label: 'About Layer Rider Pi',
                    click: () => {
                        require('electron').dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'Layer Rider Pi v1.0',
                            detail: 'OSS Code Visualization with Virtual Raspberry Pi\n\nLike Line Rider but for code layering!'
                        });
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Layers',
            submenu: [
                {
                    label: 'New Layer',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('addLayer()');
                    }
                },
                {
                    label: 'Clear Current Layer',
                    accelerator: 'CmdOrCtrl+K',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('clearCanvas()');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Export Layers',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('exportLayers()');
                    }
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Draw Mode',
                    accelerator: 'D',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('setMode("draw")');
                    }
                },
                {
                    label: 'Text Mode',
                    accelerator: 'T',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('setMode("text")');
                    }
                },
                {
                    label: 'Code Mode',
                    accelerator: 'C',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('setMode("code")');
                    }
                },
                {
                    label: 'Circuit Mode',
                    accelerator: 'R',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('setMode("circuit")');
                    }
                }
            ]
        },
        {
            label: 'Raspberry Pi',
            submenu: [
                {
                    label: 'Deploy to Pi',
                    accelerator: 'CmdOrCtrl+D',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('deployToPi()');
                    }
                },
                {
                    label: 'Pi Terminal',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
                            document.getElementById('pi-input').focus();
                        `);
                    }
                },
                { type: 'separator' },
                {
                    label: 'Connect to Real Pi',
                    click: () => {
                        // TODO: Implement real Pi connection
                        require('electron').dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Real Pi Connection',
                            message: 'Feature coming soon!',
                            detail: 'Connect to actual Raspberry Pi hardware via SSH/GPIO'
                        });
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
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC handlers for Pi operations
ipcMain.handle('deploy-to-pi', async (event, layers) => {
    console.log('🥧 Deploying layers to Pi:', layers.length);
    
    // Simulate Pi deployment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
        success: true,
        message: 'Deployed to virtual Raspberry Pi successfully!'
    };
});

ipcMain.handle('connect-to-mcp', async (event) => {
    // Connect to MCP router
    try {
        const WebSocket = require('ws');
        const ws = new WebSocket('ws://localhost:6667');
        
        ws.on('open', () => {
            console.log('🌐 Connected to MCP from Electron');
            ws.send(JSON.stringify({
                type: 'electron-layer-rider-connected',
                timestamp: Date.now()
            }));
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

console.log('🎮 Layer Rider Pi - Electron App Starting...');
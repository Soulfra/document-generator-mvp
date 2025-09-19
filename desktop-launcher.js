#!/usr/bin/env node

/**
 * Desktop Launcher - Simple Desktop Interface for Document Generator
 * 
 * This creates a simple desktop launcher that opens the ONE-BUTTON interface
 * and provides system tray functionality for easy access.
 */

const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;

// Keep window on top and always accessible
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add icon
        title: 'Document Generator - One Button Interface',
        resizable: true,
        minimizable: true,
        alwaysOnTop: false, // User can change this
        frame: true,
        show: false // Don't show until ready
    });

    // Load the ONE-BUTTON interface
    mainWindow.loadFile('ONE-BUTTON.html');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Focus the window
        if (process.platform === 'darwin') {
            app.dock.show();
        }
        mainWindow.focus();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Prevent window from closing - minimize to tray instead
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            
            // Show notification that app is still running
            if (tray) {
                tray.displayBalloon({
                    title: 'Document Generator',
                    content: 'App was minimized to tray. Right-click tray icon to access.',
                    icon: path.join(__dirname, 'assets', 'icon.png')
                });
            }
        }
    });

    // Handle web links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    return mainWindow;
}

// Create system tray
function createTray() {
    // Use a simple icon - create one if it doesn't exist
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    
    // Create simple icon if it doesn't exist
    if (!fs.existsSync(path.dirname(iconPath))) {
        fs.mkdirSync(path.dirname(iconPath), { recursive: true });
    }
    
    // Try to create tray with different icon formats
    try {
        tray = new Tray(iconPath);
    } catch (error) {
        // Fallback: try without icon
        console.log('Could not load tray icon, using default');
        tray = new Tray(require('electron').nativeImage.createEmpty());
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '🚀 Open Document Generator',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        {
            type: 'separator'
        },
        {
            label: '📄 Quick Document Drop',
            click: () => {
                openDocumentDialog();
            }
        },
        {
            label: '🔧 System Health Check',
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.send('quick-action', 'show-health');
                    mainWindow.show();
                }
            }
        },
        {
            label: '⚡ Start All Systems',
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.send('quick-action', 'start-system');
                    mainWindow.show();
                }
            }
        },
        {
            type: 'separator'
        },
        {
            label: '📊 Open Dashboard',
            click: () => {
                shell.openExternal('file://' + path.join(__dirname, 'dashboard.html'));
            }
        },
        {
            label: '🎮 Live Control Panel',
            click: () => {
                shell.openExternal('file://' + path.join(__dirname, 'LIVE-CONTROL-PANEL.html'));
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Always on Top',
            type: 'checkbox',
            checked: false,
            click: (menuItem) => {
                if (mainWindow) {
                    mainWindow.setAlwaysOnTop(menuItem.checked);
                }
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: () => {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('Document Generator - Transform Any Document to MVP');
    
    // Double-click to show main window
    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        } else {
            createWindow();
        }
    });
}

// Quick document dialog
async function openDocumentDialog() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Document to Process',
        filters: [
            { name: 'Documents', extensions: ['md', 'txt', 'pdf', 'docx', 'json'] },
            { name: 'Markdown', extensions: ['md'] },
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        
        // Show main window and process the file
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            
            // Send file path to renderer process
            mainWindow.webContents.send('process-file', filePath);
        } else {
            createWindow();
            mainWindow.once('ready-to-show', () => {
                mainWindow.webContents.send('process-file', filePath);
            });
        }
    }
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createTray();
    
    // macOS specific
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    
    // Create application menu for macOS
    if (process.platform === 'darwin') {
        const template = [
            {
                label: app.getName(),
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideothers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            },
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Process Document...',
                        accelerator: 'Cmd+O',
                        click: openDocumentDialog
                    },
                    { type: 'separator' },
                    {
                        label: 'Start All Systems',
                        accelerator: 'Cmd+Enter',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.send('quick-action', 'start-system');
                            }
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
                    { role: 'close' },
                    {
                        label: 'Always on Top',
                        type: 'checkbox',
                        accelerator: 'Cmd+Shift+T',
                        click: (menuItem) => {
                            if (mainWindow) {
                                mainWindow.setAlwaysOnTop(menuItem.checked);
                            }
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers
ipcMain.handle('get-file-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        filters: [
            { name: 'Documents', extensions: ['md', 'txt', 'pdf', 'docx', 'json'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });
    
    return result.canceled ? null : result.filePaths[0];
});

// Handle file processing requests
ipcMain.handle('process-document-file', async (event, filePath) => {
    try {
        // This would integrate with your document processing system
        console.log('Processing document:', filePath);
        
        // For now, just open the file location
        shell.showItemInFolder(filePath);
        
        return { success: true, message: 'Document processing started' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

console.log('Desktop Launcher started. Check system tray for quick access!');
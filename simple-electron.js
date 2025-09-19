const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        backgroundColor: '#0a0a0a',
        titleBarStyle: 'default'
    });

    // Load the working desktop interface
    const htmlPath = path.join(__dirname, 'working-desktop.html');
    console.log('Loading:', htmlPath);
    
    mainWindow.loadFile(htmlPath);
    
    // Open DevTools so you can see what's happening
    mainWindow.webContents.openDevTools();
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    // Show what's actually loading
    mainWindow.webContents.once('did-finish-load', () => {
        console.log('✅ Page loaded successfully');
        mainWindow.webContents.executeJavaScript(`
            document.title = "Document Generator - WORKING";
            console.log("Dashboard loaded:", window.location.href);
        `);
    });
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.log('❌ Failed to load:', errorDescription);
    });
}

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

console.log('🚀 Starting simple Electron app...');
console.log('📁 Current directory:', __dirname);
console.log('📄 Will load: verification-dashboard.html');
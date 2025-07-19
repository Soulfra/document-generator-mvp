/**
 * Electron Main Process Configuration
 * Fixes network connectivity and certificate issues
 */

const { app, BrowserWindow, session, net } = require('electron');
const networkFix = require('./electron-network-fix');
const path = require('path');

// Disable certificate errors in development
if (process.env.NODE_ENV !== 'production') {
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('allow-insecure-localhost');
}

// Force IPv4 for DNS resolution (fixes some WiFi issues)
app.commandLine.appendSwitch('force-fieldtrials', 'DnsOverHttps/Enable');
app.commandLine.appendSwitch('enable-features', 'DnsOverHttps<DnsOverHttpsTrial');

// Enable network features
app.commandLine.appendSwitch('enable-features', 'NetworkService,NetworkServiceInProcess');

// Disable proxy to ensure direct connections
app.commandLine.appendSwitch('no-proxy-server');

// Enable experimental web platform features
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

let mainWindow;

function createWindow() {
  // Create the browser window with proper web preferences
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security settings that still allow network access
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      
      // Enable web features
      webgl: true,
      plugins: true,
      experimentalFeatures: true,
      
      // Preload script for secure API access
      preload: path.join(__dirname, 'preload.js')
    },
    
    // Window settings
    show: false,
    backgroundColor: '#ffffff',
    titleBarStyle: 'default',
    
    // Icon (create one if needed)
    // icon: path.join(__dirname, 'assets/icon.png')
  });

  // Set up content security policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https: http: ws: wss:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; " +
          "style-src 'self' 'unsafe-inline' https: http:; " +
          "img-src 'self' data: https: http:; " +
          "font-src 'self' data: https: http:; " +
          "connect-src 'self' https: http: ws: wss: localhost:*; " +
          "media-src 'self' https: http:; " +
          "object-src 'none'; " +
          "frame-src 'self' https: http:;"
        ]
      }
    });
  });

  // Handle certificate errors (for development)
  if (process.env.NODE_ENV !== 'production') {
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      // Prevent having error
      event.preventDefault();
      // Continue despite error
      callback(true);
    });

    // Also handle certificate errors in session
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      // Always allow in development
      callback(0);
    });
  }

  // Enable network access permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Allow all permissions in development
    if (process.env.NODE_ENV !== 'production') {
      callback(true);
      return;
    }

    // In production, be more selective
    const allowedPermissions = [
      'media',
      'geolocation',
      'notifications',
      'midiSysex',
      'pointerLock',
      'fullscreen',
      'openExternal',
      'clipboard-read',
      'clipboard-write'
    ];

    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Load the app - try network test page first
  const startUrl = process.env.ELECTRON_START_URL || 
    `file://${path.join(__dirname, 'network-test.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (process.env.NODE_ENV !== 'production') {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle navigation to ensure network access
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow all navigation in development
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    
    // In production, validate URLs
    try {
      const parsedUrl = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'file:'];
      
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        event.preventDefault();
      }
    } catch (e) {
      event.preventDefault();
    }
  });

  // Intercept new window requests
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Handle external links
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Fix for network access on app ready
app.whenReady().then(() => {
  // Set up proxy if needed (usually not, but helps with corporate networks)
  const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  if (proxyUrl) {
    session.defaultSession.setProxy({
      proxyRules: proxyUrl,
      proxyBypassRules: 'localhost,127.0.0.1'
    });
  }

  // Create window
  createWindow();

  // Test network connectivity
  testNetworkConnectivity();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Network connectivity test
async function testNetworkConnectivity() {
  try {
    const testUrls = [
      'https://www.google.com',
      'https://dns.google',
      'https://1.1.1.1'
    ];

    for (const url of testUrls) {
      try {
        const request = net.request(url);
        request.on('response', (response) => {
          console.log(`✅ Network test passed: ${url} - Status: ${response.statusCode}`);
        });
        request.on('error', (error) => {
          console.error(`❌ Network test failed: ${url}`, error);
        });
        request.end();
      } catch (error) {
        console.error(`❌ Network request failed: ${url}`, error);
      }
    }
  } catch (error) {
    console.error('❌ Network connectivity test failed:', error);
  }
}

// Handle protocol for deep linking (optional)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('vibecoding', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('vibecoding');
}

// Export for testing
module.exports = { createWindow, testNetworkConnectivity };
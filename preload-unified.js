// Unified Preload Script - Combines all functionality
const { contextBridge, ipcRenderer } = require('electron');

// Expose unified API
contextBridge.exposeInMainWorld('electronAPI', {
    // Existing APIs
    openDevTools: () => ipcRenderer.invoke('open-devtools'),
    
    // Streaming APIs
    streamData: (data) => ipcRenderer.invoke('stream-data', data),
    compileRust: (code) => ipcRenderer.invoke('compile-rust', code),
    deploySolidity: (contract, network) => ipcRenderer.invoke('deploy-solidity', contract, network),
    buildDocker: (dockerfile, tag) => ipcRenderer.invoke('build-docker', dockerfile, tag),
    generateQR: (data, type) => ipcRenderer.invoke('generate-qr', data, type),
    
    // Wormhole APIs
    wormholeCrawl: (data) => ipcRenderer.invoke('wormhole-crawl', data),
    wormholeAnalyze: (framework) => ipcRenderer.invoke('wormhole-analyze', framework),
    wormholeDeploy: (config) => ipcRenderer.invoke('wormhole-deploy', config),
    
    // Blamechain APIs
    addToBlamechain: (block) => ipcRenderer.invoke('add-to-blamechain', block),
    getBlamechain: () => ipcRenderer.invoke('get-blamechain'),
    
    // Service APIs
    verifyServices: () => ipcRenderer.invoke('verify-services'),
    getServiceStatus: () => ipcRenderer.invoke('get-service-status'),
    
    // Chrome-like APIs
    chrome: {
        runtime: {
            sendMessage: (message) => ipcRenderer.send('chrome-message', message),
            onMessage: {
                addListener: (callback) => {
                    ipcRenderer.on('chrome-message-response', (event, response) => {
                        callback(response);
                    });
                }
            }
        }
    },
    
    // Platform info
    platform: {
        isElectron: true,
        versions: process.versions,
        mode: 'unified'
    }
});

// Listen for mode changes
ipcRenderer.on('mode-changed', (event, mode) => {
    window.dispatchEvent(new CustomEvent('mode-changed', { detail: mode }));
});

// Listen for streaming events
ipcRenderer.on('stream-data', (event, data) => {
    window.dispatchEvent(new CustomEvent('stream-data', { detail: data }));
});

ipcRenderer.on('streaming-connected', (event, connected) => {
    window.dispatchEvent(new CustomEvent('streaming-connected', { detail: connected }));
});

ipcRenderer.on('streaming-error', (event, error) => {
    window.dispatchEvent(new CustomEvent('streaming-error', { detail: error }));
});

// Listen for wormhole events
ipcRenderer.on('wormhole-framework', (event, framework) => {
    window.dispatchEvent(new CustomEvent('wormhole-framework', { detail: framework }));
});

ipcRenderer.on('wormhole-custom', (event, url) => {
    window.dispatchEvent(new CustomEvent('wormhole-custom', { detail: url }));
});

// Listen for service events
ipcRenderer.on('verify-services', () => {
    window.dispatchEvent(new Event('verify-services'));
});

ipcRenderer.on('open-blamechain', () => {
    window.dispatchEvent(new Event('open-blamechain'));
});

// Override window.open to handle navigation
window.open = (url, target, features) => {
    if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
        window.location.href = url;
    } else {
        ipcRenderer.send('open-external', url);
    }
    return null;
};

// Add console branding
console.log('%c🚀 Document Generator Unified Platform', 'color: #00ff88; font-size: 20px; font-weight: bold;');
console.log('%c• Desktop Environment', 'color: #888; padding-left: 20px;');
console.log('%c• Document Processor', 'color: #888; padding-left: 20px;');
console.log('%c• Framework Wormhole', 'color: #888; padding-left: 20px;');
console.log('%cRunning in Electron ' + process.versions.electron, 'color: #666;');
// Preload script for Chrome-like Electron app
const { contextBridge, ipcRenderer } = require('electron');

// Expose limited API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    openDevTools: () => ipcRenderer.invoke('open-devtools'),
    
    // Streaming APIs
    streamData: (data) => ipcRenderer.invoke('stream-data', data),
    compileRust: (code) => ipcRenderer.invoke('compile-rust', code),
    deploySolidity: (contract, network) => ipcRenderer.invoke('deploy-solidity', contract, network),
    buildDocker: (dockerfile, tag) => ipcRenderer.invoke('build-docker', dockerfile, tag),
    generateQR: (data, type) => ipcRenderer.invoke('generate-qr', data, type),
    
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
        versions: process.versions
    }
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

// Override window.open to handle properly
window.open = (url, target, features) => {
    if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
        window.location.href = url;
    } else {
        ipcRenderer.send('open-external', url);
    }
    return null;
};

// Add Chrome-like console styling
console.log('%c🚀 Document Generator Native', 'color: #00ff88; font-size: 20px; font-weight: bold;');
console.log('%cRunning in Electron with Chrome ' + process.versions.chrome, 'color: #888;');
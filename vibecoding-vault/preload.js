/**
 * Electron Preload Script
 * Provides secure bridge between renderer and main process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Network status
  getNetworkStatus: () => ipcRenderer.invoke('get-network-status'),
  
  // Check connectivity
  checkConnectivity: (url) => ipcRenderer.invoke('check-connectivity', url),
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Error reporting
  reportError: (error) => ipcRenderer.send('report-error', error),
  
  // Performance metrics
  reportPerformance: (metrics) => ipcRenderer.send('report-performance', metrics),
  
  // App version
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Platform info
  platform: process.platform,
  
  // Environment
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Listen for main process messages
  on: (channel, callback) => {
    const validChannels = [
      'network-status-changed',
      'error-captured',
      'performance-alert',
      'update-available'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log that preload script is loaded
console.log('Electron preload script loaded');

// Check if we're in Electron
if (window.location.protocol === 'file:') {
  console.log('Running in Electron with file:// protocol');
} else {
  console.log('Running in Electron with', window.location.protocol, 'protocol');
}
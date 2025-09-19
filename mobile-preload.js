/**
 * Preload script for Mobile Gaming Wallet
 * Provides secure bridge between renderer and main process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Wallet operations
    getWalletBalance: () => ipcRenderer.invoke('wallet:getBalance'),
    sendTransaction: (data) => ipcRenderer.invoke('wallet:send', data),
    generateQR: (address) => ipcRenderer.invoke('wallet:generateQR', address),
    
    // Game operations
    getGameState: () => ipcRenderer.invoke('game:getInventory'),
    dragDrop: (dragData) => ipcRenderer.invoke('game:dragDrop', dragData),
    mine: (oreType) => ipcRenderer.invoke('game:mine', oreType),
    
    // Biometric authentication
    authenticateBiometric: (data) => ipcRenderer.invoke('auth:biometric', data),
    
    // Economy operations
    getTreasureMap: () => ipcRenderer.invoke('economy:getTreasure'),
    executeTrade: (tradeData) => ipcRenderer.invoke('economy:trade', tradeData),
    
    // Window operations
    openGameWindow: () => ipcRenderer.send('window:openGame'),
    openWalletWindow: () => ipcRenderer.send('window:openWallet'),
    openForumWindow: () => ipcRenderer.send('window:openForum'),
    
    // Gesture handlers
    swipeLeft: () => ipcRenderer.send('gesture:swipeLeft'),
    swipeRight: () => ipcRenderer.send('gesture:swipeRight'),
    
    // Platform info
    getPlatform: () => process.platform,
    getVersion: () => process.versions.electron
});
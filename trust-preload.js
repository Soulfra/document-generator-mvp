// trust-preload.js - Preload script for AI Trust System in Electron

const { contextBridge, ipcRenderer } = require('electron');

// Expose AI Trust System API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Trust system functions
    trustInitiateHandshake: () => ipcRenderer.invoke('trust-initiate-handshake'),
    trustGetStatus: () => ipcRenderer.invoke('trust-get-status'),
    trustGetLogicHistory: (sessionId) => ipcRenderer.invoke('trust-get-logic-history', sessionId),
    trustOpenDashboard: () => ipcRenderer.send('trust-open-dashboard'),
    trustExportSession: (sessionData) => ipcRenderer.invoke('trust-export-session', sessionData),
    
    // Existing functions (if they exist)
    mirrorClaude: (prompt) => ipcRenderer.invoke('mirrorClaude', prompt)
});

console.log('🤝 AI Trust preload script loaded');
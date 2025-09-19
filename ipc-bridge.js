#!/usr/bin/env node

/**
 * 🌉 IPC COMMUNICATION BRIDGE
 * 
 * Handles communication between Electron main and renderer processes for the Agentic Browser.
 * Provides secure, typed IPC channels for all browser functionality.
 */

const { ipcMain, ipcRenderer } = require('electron');
const { EventEmitter } = require('events');

/**
 * Main Process IPC Handler
 * Runs in the Electron main process
 */
class IPCMainBridge extends EventEmitter {
  constructor(agenticBrowserApp) {
    super();
    this.app = agenticBrowserApp;
    this.setupHandlers();
    console.log('🌉 IPC Main Bridge initialized');
  }

  setupHandlers() {
    // Recording Controls
    ipcMain.handle('recording:start', async (event, options = {}) => {
      try {
        const session = await this.app.startRecording(null, options.sourceId);
        return { success: true, session };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('recording:stop', async (event) => {
      try {
        const result = await this.app.stopRecording();
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('recording:pause', async (event) => {
      try {
        await this.app.pauseRecording();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('recording:resume', async (event) => {
      try {
        await this.app.resumeRecording();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('recording:status', async (event) => {
      try {
        const status = this.app.getRecordingStatus();
        return { success: true, status };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Screen Sources
    ipcMain.handle('screen:getSources', async (event) => {
      try {
        const sources = await this.app.recordingEngine.getAvailableSources();
        return { success: true, sources };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Content Processing
    ipcMain.handle('content:processUrl', async (event, url) => {
      try {
        const result = await this.app.processURL(url);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('content:processYouTube', async (event, url) => {
      try {
        const result = await this.app.contentAnalyzer.processYouTubeVideo(url);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('content:processPodcast', async (event, url) => {
      try {
        const result = await this.app.contentAnalyzer.processPodcast(url);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // AI Processing
    ipcMain.handle('ai:generateInsights', async (event, content) => {
      try {
        const insights = await this.app.llmProcessor.generateInsights(content);
        return { success: true, insights };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('ai:analyzeContent', async (event, contentData) => {
      try {
        const analysis = await this.app.llmProcessor.analyzeWebContent(contentData);
        return { success: true, analysis };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // CalCompare consultation endpoints
    ipcMain.handle('calcompare:consult', async (event, query, consultationType, options = {}) => {
      try {
        if (!this.app.serviceClient) {
          throw new Error('CalCompare service not available');
        }
        
        const consultation = await this.app.serviceClient.consultExperts(query, consultationType, options);
        return { success: true, consultation };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('calcompare:smartConsult', async (event, query, context = {}) => {
      try {
        if (!this.app.serviceClient) {
          throw new Error('CalCompare service not available');
        }
        
        const consultation = await this.app.serviceClient.smartConsult(query, context);
        return { success: true, consultation };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('calcompare:getHistory', async (event, userId = 'agentic-browser', limit = 10) => {
      try {
        if (!this.app.serviceClient) {
          return { success: true, consultations: [] };
        }
        
        const consultations = await this.app.serviceClient.getConsultationHistory(userId, limit);
        return { success: true, consultations };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('services:getStatus', async (event) => {
      try {
        const status = this.app.serviceClient ? 
          this.app.serviceClient.getServiceStatus() : 
          { error: 'Service client not available' };
        return { success: true, status };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('services:getStats', async (event) => {
      try {
        if (!this.app.serviceClient) {
          return { success: false, error: 'Service client not available' };
        }
        
        const stats = await this.app.serviceClient.getSystemStats();
        return { success: true, stats };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Database Operations
    ipcMain.handle('db:getSessions', async (event, limit = 10) => {
      try {
        const sessions = await this.app.database.getRecentSessions(limit);
        return { success: true, sessions };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('db:getSession', async (event, sessionId) => {
      try {
        const session = await this.app.database.getSession(sessionId);
        return { success: true, session };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('db:getContentLibrary', async (event) => {
      try {
        const content = await this.app.database.getContentLibrary();
        return { success: true, content };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('db:searchContent', async (event, query, options = {}) => {
      try {
        const results = await this.app.database.searchContent(query, options);
        return { success: true, results };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('db:getPatterns', async (event, type = null) => {
      try {
        const patterns = type ? 
          await this.app.database.getPatternsByType(type) :
          await this.app.database.getPatternsByType('behavior');
        return { success: true, patterns };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // System Status
    ipcMain.handle('system:getStatus', async (event) => {
      try {
        const status = await this.app.getSystemStatus();
        return { success: true, status };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('system:getDashboardData', async (event) => {
      try {
        const data = await this.app.database.getDashboardData();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Settings
    ipcMain.handle('settings:get', async (event, key = null) => {
      try {
        const settings = this.app.getSettings(key);
        return { success: true, settings };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('settings:set', async (event, key, value) => {
      try {
        await this.app.setSetting(key, value);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // File Operations
    ipcMain.handle('file:selectRecording', async (event) => {
      try {
        const { dialog } = require('electron');
        const result = await dialog.showOpenDialog(this.app.mainWindow, {
          properties: ['openFile'],
          filters: [
            { name: 'Recording Files', extensions: ['webm', 'mp4'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
          return { success: true, filePath: result.filePaths[0] };
        } else {
          return { success: false, error: 'No file selected' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('file:exportInsights', async (event, insights, sessionId) => {
      try {
        const { dialog } = require('electron');
        const result = await dialog.showSaveDialog(this.app.mainWindow, {
          defaultPath: `insights-${sessionId || Date.now()}.json`,
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'Text Files', extensions: ['txt'] }
          ]
        });

        if (!result.canceled) {
          const fs = require('fs').promises;
          const data = {
            insights,
            sessionId,
            exportedAt: new Date().toISOString()
          };
          await fs.writeFile(result.filePath, JSON.stringify(data, null, 2));
          return { success: true, filePath: result.filePath };
        } else {
          return { success: false, error: 'Export cancelled' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // External Services
    ipcMain.handle('external:openUrl', async (event, url) => {
      try {
        const { shell } = require('electron');
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('✅ IPC Main handlers registered');
  }

  // Methods to send messages to renderer
  sendToRenderer(channel, data) {
    if (this.app.mainWindow && !this.app.mainWindow.isDestroyed()) {
      this.app.mainWindow.webContents.send(channel, data);
    }
  }

  notifyRecordingStarted(session) {
    this.sendToRenderer('recording:started', session);
  }

  notifyRecordingStopped(result) {
    this.sendToRenderer('recording:stopped', result);
  }

  notifyInsightsGenerated(insights) {
    this.sendToRenderer('insights:generated', insights);
  }

  notifyRealtimeInsights(insights) {
    this.sendToRenderer('insights:realtime', insights);
  }

  notifyInteractionRecorded(interaction) {
    this.sendToRenderer('interaction:recorded', interaction);
  }

  notifyError(error) {
    this.sendToRenderer('error', { message: error.message, timestamp: Date.now() });
  }

  notifyStatusUpdate(status) {
    this.sendToRenderer('status:update', status);
  }
}

/**
 * Renderer Process IPC Client
 * Runs in the Electron renderer process (browser window)
 */
class IPCRendererBridge extends EventEmitter {
  constructor() {
    super();
    this.isElectron = typeof window !== 'undefined' && window.process?.type === 'renderer';
    
    if (this.isElectron) {
      this.setupListeners();
      console.log('🌉 IPC Renderer Bridge initialized');
    } else {
      console.log('🌐 Running in browser mode - IPC disabled');
    }
  }

  setupListeners() {
    // Listen for messages from main process
    ipcRenderer.on('recording:started', (event, session) => {
      this.emit('recordingStarted', session);
    });

    ipcRenderer.on('recording:stopped', (event, result) => {
      this.emit('recordingStopped', result);
    });

    ipcRenderer.on('insights:generated', (event, insights) => {
      this.emit('insightsGenerated', insights);
    });

    ipcRenderer.on('insights:realtime', (event, insights) => {
      this.emit('realtimeInsights', insights);
    });

    ipcRenderer.on('interaction:recorded', (event, interaction) => {
      this.emit('interactionRecorded', interaction);
    });

    ipcRenderer.on('error', (event, error) => {
      this.emit('error', error);
    });

    ipcRenderer.on('status:update', (event, status) => {
      this.emit('statusUpdate', status);
    });

    console.log('✅ IPC Renderer listeners registered');
  }

  // Wrapper methods for IPC calls
  async invoke(channel, ...args) {
    if (!this.isElectron) {
      throw new Error('IPC not available in browser mode');
    }
    return await ipcRenderer.invoke(channel, ...args);
  }

  // Recording methods
  async startRecording(options = {}) {
    return await this.invoke('recording:start', options);
  }

  async stopRecording() {
    return await this.invoke('recording:stop');
  }

  async pauseRecording() {
    return await this.invoke('recording:pause');
  }

  async resumeRecording() {
    return await this.invoke('recording:resume');
  }

  async getRecordingStatus() {
    return await this.invoke('recording:status');
  }

  // Screen capture methods
  async getScreenSources() {
    return await this.invoke('screen:getSources');
  }

  // Content processing methods
  async processUrl(url) {
    return await this.invoke('content:processUrl', url);
  }

  async processYouTube(url) {
    return await this.invoke('content:processYouTube', url);
  }

  async processPodcast(url) {
    return await this.invoke('content:processPodcast', url);
  }

  // AI methods
  async generateInsights(content) {
    return await this.invoke('ai:generateInsights', content);
  }

  async analyzeContent(contentData) {
    return await this.invoke('ai:analyzeContent', contentData);
  }

  // CalCompare consultation methods
  async consultExperts(query, consultationType = 'general', options = {}) {
    return await this.invoke('calcompare:consult', query, consultationType, options);
  }

  async smartConsult(query, context = {}) {
    return await this.invoke('calcompare:smartConsult', query, context);
  }

  async getConsultationHistory(userId = 'agentic-browser', limit = 10) {
    return await this.invoke('calcompare:getHistory', userId, limit);
  }

  // Service status methods
  async getServicesStatus() {
    return await this.invoke('services:getStatus');
  }

  async getServicesStats() {
    return await this.invoke('services:getStats');
  }

  // Database methods
  async getSessions(limit = 10) {
    return await this.invoke('db:getSessions', limit);
  }

  async getSession(sessionId) {
    return await this.invoke('db:getSession', sessionId);
  }

  async getContentLibrary() {
    return await this.invoke('db:getContentLibrary');
  }

  async searchContent(query, options = {}) {
    return await this.invoke('db:searchContent', query, options);
  }

  async getPatterns(type = null) {
    return await this.invoke('db:getPatterns', type);
  }

  // System methods
  async getSystemStatus() {
    return await this.invoke('system:getStatus');
  }

  async getDashboardData() {
    return await this.invoke('system:getDashboardData');
  }

  // Settings methods
  async getSettings(key = null) {
    return await this.invoke('settings:get', key);
  }

  async setSetting(key, value) {
    return await this.invoke('settings:set', key, value);
  }

  // File methods
  async selectRecording() {
    return await this.invoke('file:selectRecording');
  }

  async exportInsights(insights, sessionId) {
    return await this.invoke('file:exportInsights', insights, sessionId);
  }

  // External methods
  async openUrl(url) {
    return await this.invoke('external:openUrl', url);
  }
}

/**
 * Browser Fallback API
 * Provides mock implementations when running in browser without Electron
 */
class BrowserFallbackAPI extends EventEmitter {
  constructor() {
    super();
    this.mockData = {
      sessions: [],
      content: [],
      patterns: [],
      isRecording: false,
      currentSession: null
    };
    console.log('🌐 Browser Fallback API initialized');
  }

  // Mock implementations
  async startRecording(options = {}) {
    this.mockData.isRecording = true;
    this.mockData.currentSession = {
      id: 'mock_session_' + Date.now(),
      startTime: Date.now()
    };
    setTimeout(() => {
      this.emit('recordingStarted', this.mockData.currentSession);
    }, 100);
    return { success: true, session: this.mockData.currentSession };
  }

  async stopRecording() {
    this.mockData.isRecording = false;
    const result = {
      sessionId: this.mockData.currentSession?.id,
      duration: 30000,
      interactionCount: 15
    };
    setTimeout(() => {
      this.emit('recordingStopped', result);
    }, 100);
    return { success: true, result };
  }

  async getSystemStatus() {
    return {
      success: true,
      status: {
        recording: { isActive: this.mockData.isRecording },
        components: {
          database: 'online',
          llmProcessor: 'online',
          recordingEngine: 'online'
        }
      }
    };
  }

  async getSessions(limit = 10) {
    return {
      success: true,
      sessions: [
        {
          id: 'session_1',
          start_time: Date.now() - 86400000,
          duration: 45000,
          interaction_count: 23
        }
      ]
    };
  }

  async getContentLibrary() {
    return {
      success: true,
      content: [
        {
          title: 'React Documentation',
          type: 'webpage',
          domain: 'react.dev',
          created_at: Date.now() - 86400000
        }
      ]
    };
  }

  // Add all other methods as needed with mock implementations
  async generateInsights(content) {
    return {
      success: true,
      insights: ['Mock insight 1', 'Mock insight 2']
    };
  }

  async processUrl(url) {
    return {
      success: true,
      result: { url, title: 'Mock Page', insights: ['Analysis complete'] }
    };
  }
}

/**
 * Unified API Factory
 * Creates the appropriate API based on environment
 */
function createIPCBridge() {
  const isElectronRenderer = typeof window !== 'undefined' && window.process?.type === 'renderer';
  const isElectronMain = typeof process !== 'undefined' && process.type === 'main';

  if (isElectronRenderer) {
    return new IPCRendererBridge();
  } else if (!isElectronMain && typeof window !== 'undefined') {
    // Browser environment
    return new BrowserFallbackAPI();
  } else {
    // Main process or Node.js environment
    return null; // Main bridge is created separately
  }
}

// Export classes and factory
module.exports = {
  IPCMainBridge,
  IPCRendererBridge,
  BrowserFallbackAPI,
  createIPCBridge
};
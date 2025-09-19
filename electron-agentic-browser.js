#!/usr/bin/env node
/**
 * ELECTRON AGENTIC BROWSER
 * Main Electron application for the agentic browser system
 * 
 * Features:
 * - Screen recording with user interaction tracking
 * - Local LLM integration for real-time insights
 * - Multimedia content processing (YouTube, podcasts)
 * - Privacy-first local processing
 * - Integration with Production Master Dashboard
 */

const { app, BrowserWindow, ipcMain, Menu, shell, desktopCapturer, screen } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const WebSocket = require('ws');

// Import our existing systems
const BrowserRecordingEngine = require('./browser-recording-engine');
const LocalLLMProcessor = require('./local-llm-processor');
const MultimediaContentAnalyzer = require('./multimedia-content-analyzer');
const ContentDatabaseManager = require('./content-database-manager');
const { IPCMainBridge } = require('./ipc-bridge');
const UnifiedServiceClient = require('./unified-service-client');

class AgenticBrowserApp {
    constructor() {
        this.mainWindow = null;
        this.recordingWindow = null;
        this.isRecording = false;
        this.config = {
            isDev: process.argv.includes('--dev'),
            version: '1.0.0',
            basePort: 3060,
            recordingPort: 3061
        };
        
        // Core components
        this.recordingEngine = null;
        this.llmProcessor = null;
        this.contentAnalyzer = null;
        this.database = null;
        this.ipcBridge = null;
        this.serviceClient = null;
        
        // User session data
        this.currentSession = null;
        this.insights = [];
        this.contentQueue = [];
        
        console.log('🤖 Agentic Browser App initializing...');
        this.initializeApp();
    }

    initializeApp() {
        // App lifecycle events
        app.whenReady().then(() => {
            this.createMainWindow();
            this.setupMenu();
            this.initializeComponents();
            this.setupIPC();
            this.startBackgroundServices();
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                this.cleanup();
                app.quit();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });

        app.on('before-quit', () => {
            this.cleanup();
        });
    }

    async createMainWindow() {
        // Get primary display dimensions
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;

        this.mainWindow = new BrowserWindow({
            width: Math.floor(width * 0.9),
            height: Math.floor(height * 0.9),
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                webSecurity: false
            },
            icon: path.join(__dirname, 'assets/icon.png'),
            title: 'Agentic Browser - AI-Powered Web Experience',
            show: false
        });

        // Load the unified browser interface
        await this.mainWindow.loadFile('./unified-browser-interface.html');

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            if (this.config.isDev) {
                this.mainWindow.webContents.openDevTools();
            }
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        console.log('🖥️ Main window created');
    }

    setupMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Session',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => this.startNewSession()
                    },
                    {
                        label: 'Open Recording',
                        accelerator: 'CmdOrCtrl+O',
                        click: () => this.openRecording()
                    },
                    { type: 'separator' },
                    {
                        label: 'Export Insights',
                        click: () => this.exportInsights()
                    },
                    { type: 'separator' },
                    {
                        label: 'Exit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            this.cleanup();
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Recording',
                submenu: [
                    {
                        label: 'Start Recording',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => this.startRecording()
                    },
                    {
                        label: 'Stop Recording',
                        accelerator: 'CmdOrCtrl+Shift+R',
                        click: () => this.stopRecording()
                    },
                    {
                        label: 'Pause Recording',
                        accelerator: 'CmdOrCtrl+P',
                        click: () => this.pauseRecording()
                    }
                ]
            },
            {
                label: 'Analysis',
                submenu: [
                    {
                        label: 'Generate Insights',
                        accelerator: 'CmdOrCtrl+I',
                        click: () => this.generateInsights()
                    },
                    {
                        label: 'Process YouTube Video',
                        click: () => this.processYouTubeVideo()
                    },
                    {
                        label: 'Analyze Podcast',
                        click: () => this.analyzePodcast()
                    },
                    { type: 'separator' },
                    {
                        label: 'View Content Library',
                        accelerator: 'CmdOrCtrl+L',
                        click: () => this.openContentLibrary()
                    }
                ]
            },
            {
                label: 'Tools',
                submenu: [
                    {
                        label: 'Production Dashboard',
                        click: () => this.openProductionDashboard()
                    },
                    {
                        label: 'LLM Status',
                        click: () => this.checkLLMStatus()
                    },
                    {
                        label: 'System Health',
                        click: () => this.checkSystemHealth()
                    },
                    { type: 'separator' },
                    {
                        label: 'Settings',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => this.openSettings()
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About Agentic Browser',
                        click: () => this.showAbout()
                    },
                    {
                        label: 'Documentation',
                        click: () => shell.openExternal('https://github.com/user/agentic-browser')
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    async initializeComponents() {
        console.log('🔧 Initializing core components...');
        const componentStatus = {
            serviceClient: false,
            database: false,
            recordingEngine: false,
            llmProcessor: false,
            contentAnalyzer: false
        };

        // Initialize unified service client first (critical for AI consultations)
        try {
            this.serviceClient = new UnifiedServiceClient();
            await this.serviceClient.initialize();
            componentStatus.serviceClient = true;
            console.log('✅ Unified Service Client initialized');
            
            // Setup service event handlers
            this.setupServiceEventHandlers();
        } catch (error) {
            console.error('❌ Service client initialization failed:', error.message);
            console.log('⚠️ AI consultations will be unavailable');
            this.serviceClient = null;
        }

        // Initialize database first (critical component)
        try {
            this.database = new ContentDatabaseManager({
                dbPath: './agentic-browser.db'
            });
            await this.database.initialize();
            componentStatus.database = true;
            console.log('✅ Database initialized');
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            // Create mock database for graceful degradation
            this.database = this.createMockDatabase();
            console.log('⚠️ Using mock database as fallback');
        }

        // Initialize recording engine (critical for core functionality)
        try {
            this.recordingEngine = new BrowserRecordingEngine({
                outputDir: './recordings',
                database: this.database
            });
            await this.recordingEngine.initialize();
            componentStatus.recordingEngine = true;
            console.log('✅ Recording engine initialized');
        } catch (error) {
            console.error('❌ Recording engine initialization failed:', error.message);
            this.recordingEngine = this.createMockRecordingEngine();
            console.log('⚠️ Using mock recording engine as fallback');
        }

        // Initialize LLM processor (optional but preferred)
        try {
            this.llmProcessor = new LocalLLMProcessor({
                ollamaUrl: 'http://localhost:11434',
                database: this.database
            });
            await this.llmProcessor.initialize();
            componentStatus.llmProcessor = true;
            console.log('✅ LLM processor initialized');
        } catch (error) {
            console.error('❌ LLM processor initialization failed:', error.message);
            console.log('⚠️ LLM processing will be unavailable (insights generation disabled)');
            this.llmProcessor = null;
        }

        // Initialize content analyzer (depends on LLM processor)
        try {
            if (this.llmProcessor) {
                this.contentAnalyzer = new MultimediaContentAnalyzer({
                    llmProcessor: this.llmProcessor,
                    database: this.database
                });
                await this.contentAnalyzer.initialize();
                componentStatus.contentAnalyzer = true;
                console.log('✅ Content analyzer initialized');
            } else {
                console.log('⚠️ Content analyzer skipped (LLM processor unavailable)');
                this.contentAnalyzer = this.createMockContentAnalyzer();
            }
        } catch (error) {
            console.error('❌ Content analyzer initialization failed:', error.message);
            this.contentAnalyzer = this.createMockContentAnalyzer();
            console.log('⚠️ Using mock content analyzer as fallback');
        }

        // Report initialization status
        const successCount = Object.values(componentStatus).filter(Boolean).length;
        const totalCount = Object.keys(componentStatus).length;
        
        if (successCount === totalCount) {
            console.log('✅ All components initialized successfully');
        } else {
            console.log(`⚠️ ${successCount}/${totalCount} components initialized successfully`);
            console.log('System will operate with reduced functionality');
        }

        this.componentStatus = componentStatus;
    }

    setupServiceEventHandlers() {
        if (!this.serviceClient) return;

        // Handle real-time updates from services
        this.serviceClient.on('realtime-update', (message) => {
            console.log('📡 Real-time update received:', message.type);
            
            // Forward to renderer via IPC
            if (this.ipcBridge) {
                this.ipcBridge.sendToRenderer('realtime-update', message);
            }
        });

        // Handle consultation completions
        this.serviceClient.on('consultation-complete', (consultation) => {
            console.log('🧠 Consultation completed:', consultation.id);
            
            // Add to current session insights
            if (this.currentSession) {
                this.currentSession.insights.push({
                    type: 'consultation',
                    id: consultation.id,
                    experts: consultation.expert_responses?.length || 0,
                    timestamp: Date.now()
                });
            }
            
            // Notify renderer
            if (this.ipcBridge) {
                this.ipcBridge.notifyInsightsGenerated([consultation]);
            }
        });

        // Handle AI responses
        this.serviceClient.on('ai-response', (response) => {
            console.log('🤖 AI response received');
            
            // Forward to renderer for real-time display
            if (this.ipcBridge) {
                this.ipcBridge.notifyRealtimeInsights([response]);
            }
        });

        // Handle service status changes
        this.serviceClient.on('service-down', ({ service, name, error }) => {
            console.warn(`⚠️ Service down: ${name}`);
            
            // Notify renderer of service issues
            if (this.ipcBridge) {
                this.ipcBridge.notifyError(new Error(`Service ${name} is unavailable: ${error}`));
            }
        });

        this.serviceClient.on('service-restored', ({ service, name }) => {
            console.log(`🔄 Service restored: ${name}`);
            
            // Notify renderer of service restoration
            if (this.ipcBridge) {
                this.ipcBridge.sendToRenderer('service-restored', { service, name });
            }
        });
    }

    setupIPC() {
        // Initialize IPC Bridge
        this.ipcBridge = new IPCMainBridge(this);
        
        // Setup event forwarding from components to renderer
        this.setupEventForwarding();
        
        console.log('🔗 IPC Bridge initialized');
    }

    setupEventForwarding() {
        // Forward recording events
        if (this.recordingEngine) {
            this.recordingEngine.on('recording:started', (session) => {
                this.ipcBridge.notifyRecordingStarted(session);
            });

            this.recordingEngine.on('recording:stopped', (result) => {
                this.ipcBridge.notifyRecordingStopped(result);
            });

            this.recordingEngine.on('interaction:recorded', (interaction) => {
                this.ipcBridge.notifyInteractionRecorded(interaction);
            });
        }

        // Forward LLM processor events
        if (this.llmProcessor) {
            this.llmProcessor.on('session:analyzed', (analysis) => {
                this.ipcBridge.notifyInsightsGenerated(analysis.insights);
            });

            this.llmProcessor.on('realtime:insights', (insights) => {
                this.ipcBridge.notifyRealtimeInsights(insights);
            });
        }

        // Forward general errors
        this.on('error', (error) => {
            this.ipcBridge.notifyError(error);
        });
    }

    // Helper methods expected by IPC bridge
    getRecordingStatus() {
        return {
            isRecording: this.isRecording,
            isPaused: this.recordingEngine?.isPaused || false,
            currentSession: this.currentSession,
            sessionDuration: this.currentSession ? Date.now() - this.currentSession.startTime : 0
        };
    }

    getSettings(key = null) {
        // Basic settings management - could be expanded
        const defaultSettings = {
            theme: 'dark',
            autoAnalyze: true,
            recordingQuality: 'high',
            enableTranscription: true,
            privacyMode: false
        };

        if (key) {
            return defaultSettings[key];
        }
        return defaultSettings;
    }

    async setSetting(key, value) {
        // Store settings - in production this would persist to file/database
        console.log(`Setting ${key} = ${value}`);
        return true;
    }

    async resumeRecording() {
        if (!this.isRecording) {
            throw new Error('No recording in progress');
        }
        
        return await this.recordingEngine.resumeRecording();
    }

    async startBackgroundServices() {
        // Start HTTP server for dashboard integration
        const express = require('express');
        const cors = require('cors');
        
        const app = express();
        app.use(cors());
        app.use(express.json());

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                service: 'agentic-browser',
                recording: this.isRecording,
                session: this.currentSession?.id || null
            });
        });

        // Status endpoint for dashboard
        app.get('/api/status', async (req, res) => {
            const status = await this.getSystemStatus();
            res.json({ status });
        });

        // Start recording endpoint
        app.post('/api/recording/start', async (req, res) => {
            try {
                const result = await this.startRecording();
                res.json({ success: true, session: result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Stop recording endpoint
        app.post('/api/recording/stop', async (req, res) => {
            try {
                const result = await this.stopRecording();
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Content processing endpoint
        app.post('/api/process-content', async (req, res) => {
            try {
                const { url, type } = req.body;
                let result;

                switch (type) {
                    case 'youtube':
                        result = await this.contentAnalyzer.processYouTubeVideo(url);
                        break;
                    case 'podcast':
                        result = await this.contentAnalyzer.processPodcast(url);
                        break;
                    default:
                        result = await this.processURL(url);
                }

                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.listen(this.config.basePort, () => {
            console.log(`🚀 Agentic Browser API running on http://localhost:${this.config.basePort}`);
        });
    }

    async startRecording() {
        if (this.isRecording) {
            throw new Error('Recording already in progress');
        }

        try {
            console.log('🎥 Starting screen recording...');

            // Create new session
            this.currentSession = {
                id: 'session_' + Date.now(),
                startTime: new Date().toISOString(),
                interactions: [],
                insights: [],
                content: []
            };

            // Start recording engine
            await this.recordingEngine.startRecording(this.currentSession.id);
            
            this.isRecording = true;

            // Notify renderer process
            if (this.mainWindow) {
                this.mainWindow.webContents.send('recording-started', this.currentSession);
            }

            console.log(`✅ Recording started - Session: ${this.currentSession.id}`);
            return this.currentSession;

        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            throw error;
        }
    }

    async stopRecording() {
        if (!this.isRecording) {
            throw new Error('No recording in progress');
        }

        try {
            console.log('⏹️ Stopping screen recording...');

            // Stop recording engine
            const recordingResult = await this.recordingEngine.stopRecording();

            // Finalize session
            this.currentSession.endTime = new Date().toISOString();
            this.currentSession.duration = Date.now() - new Date(this.currentSession.startTime).getTime();
            this.currentSession.recordingPath = recordingResult.filePath;

            // Save session to database
            await this.database.saveSession(this.currentSession);

            // Generate initial insights
            await this.generateSessionInsights();

            this.isRecording = false;

            // Notify renderer process
            if (this.mainWindow) {
                this.mainWindow.webContents.send('recording-stopped', this.currentSession);
            }

            console.log(`✅ Recording stopped - Duration: ${this.currentSession.duration}ms`);
            return this.currentSession;

        } catch (error) {
            console.error('❌ Failed to stop recording:', error);
            throw error;
        }
    }

    async pauseRecording() {
        if (!this.isRecording) {
            throw new Error('No recording in progress');
        }

        await this.recordingEngine.pauseRecording();
        console.log('⏸️ Recording paused');
    }

    async processURL(url) {
        try {
            console.log(`🌐 Processing URL: ${url}`);

            let contentData;
            let insights = [];

            // Try web content fetcher service first
            try {
                const response = await this.fetchWithTimeout('http://localhost:3052/api/fetch-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                }, 15000);

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        contentData = result;
                        console.log('✅ Content fetched via web-content-fetcher service');
                    } else {
                        throw new Error(result.error || 'Content fetch failed');
                    }
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (serviceError) {
                console.warn('⚠️ Web content fetcher service unavailable, using fallback:', serviceError.message);
                
                // Fallback: Basic content extraction
                contentData = await this.fallbackContentExtraction(url);
            }

            // Generate insights using CalCompare multi-expert consultation (with fallback to local LLM)
            try {
                if (this.serviceClient) {
                    // Smart consultation routing based on content type
                    const consultation = await this.serviceClient.smartConsult(
                        `Analyze this web content: ${contentData.title}\n\nContent: ${contentData.text?.substring(0, 1000)}`,
                        {
                            sessionId: this.currentSession?.id,
                            userId: 'agentic-browser',
                            priority: 'normal'
                        }
                    );
                    
                    insights = this.extractInsightsFromConsultation(consultation);
                    console.log(`🧠 CalCompare consultation completed: ${consultation.expert_responses?.length || 0} experts`);
                } else if (this.llmProcessor && this.llmProcessor.isInitialized) {
                    // Fallback to local LLM if CalCompare unavailable
                    insights = await this.llmProcessor.analyzeWebContent(contentData);
                    console.log(`🧠 Local LLM analysis: ${insights.length || 0} insights`);
                } else {
                    console.warn('⚠️ No AI services available, skipping insights');
                    insights = ['AI analysis unavailable - content saved for later processing'];
                }
            } catch (aiError) {
                console.error('❌ AI analysis failed:', aiError.message);
                insights = [`Analysis failed: ${aiError.message} - content saved for manual review`];
            }

            // Save to database (with error handling)
            try {
                if (this.database) {
                    await this.database.saveContent({
                        url,
                        type: 'webpage',
                        content: contentData,
                        insights,
                        timestamp: new Date().toISOString(),
                        source: contentData.cached ? 'cache' : 'fetch'
                    });
                    console.log('💾 Content saved to database');
                }
            } catch (dbError) {
                console.error('❌ Database save failed:', dbError.message);
                // Continue execution - don't fail the entire operation
            }

            return { contentData, insights };

        } catch (error) {
            console.error(`❌ Failed to process URL ${url}:`, error);
            
            // Return basic error information instead of throwing
            return {
                contentData: {
                    url,
                    title: 'Processing Failed',
                    text: `Failed to process URL: ${error.message}`,
                    error: true,
                    timestamp: new Date().toISOString()
                },
                insights: [`Processing failed: ${error.message}`],
                error: true
            };
        }
    }

    async generateSessionInsights() {
        if (!this.currentSession) return;

        try {
            console.log('🧠 Generating session insights...');

            const insights = await this.llmProcessor.analyzeSession(this.currentSession);
            this.currentSession.insights = insights;

            // Save updated session
            await this.database.updateSession(this.currentSession.id, {
                insights: insights
            });

            console.log(`✅ Generated ${insights.length} insights for session`);

        } catch (error) {
            console.error('❌ Failed to generate session insights:', error);
        }
    }

    async generateInsights() {
        try {
            if (this.currentSession) {
                await this.generateSessionInsights();
            }

            // Notify renderer
            if (this.mainWindow) {
                this.mainWindow.webContents.send('insights-generated', this.currentSession?.insights || []);
            }

        } catch (error) {
            console.error('❌ Failed to generate insights:', error);
        }
    }

    async processYouTubeVideo() {
        try {
            const { dialog } = require('electron');
            
            const result = await dialog.showInputBox(this.mainWindow, {
                title: 'Process YouTube Video',
                label: 'Enter YouTube URL:',
                value: ''
            });

            if (result.response === 0 && result.inputValue) {
                const analysis = await this.contentAnalyzer.processYouTubeVideo(result.inputValue);
                
                // Show results
                await dialog.showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'YouTube Analysis Complete',
                    message: `Video processed successfully!\n\nTitle: ${analysis.title}\nDuration: ${analysis.duration}\nInsights: ${analysis.insights.length} generated`
                });
            }

        } catch (error) {
            console.error('❌ Failed to process YouTube video:', error);
        }
    }

    async analyzePodcast() {
        try {
            const { dialog } = require('electron');
            
            const result = await dialog.showInputBox(this.mainWindow, {
                title: 'Analyze Podcast',
                label: 'Enter podcast RSS URL or episode URL:',
                value: ''
            });

            if (result.response === 0 && result.inputValue) {
                const analysis = await this.contentAnalyzer.processPodcast(result.inputValue);
                
                // Show results
                await dialog.showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'Podcast Analysis Complete',
                    message: `Podcast processed successfully!\n\nTitle: ${analysis.title}\nDuration: ${analysis.duration}\nInsights: ${analysis.insights.length} generated`
                });
            }

        } catch (error) {
            console.error('❌ Failed to analyze podcast:', error);
        }
    }

    async getSystemStatus() {
        return {
            recording: {
                isActive: this.isRecording,
                sessionId: this.currentSession?.id || null
            },
            components: {
                database: this.database ? 'online' : 'offline',
                llmProcessor: this.llmProcessor ? 'online' : 'offline',
                recordingEngine: this.recordingEngine ? 'online' : 'offline',
                contentAnalyzer: this.contentAnalyzer ? 'online' : 'offline'
            },
            stats: {
                sessionsCount: await this.database?.getSessionCount() || 0,
                contentCount: await this.database?.getContentCount() || 0,
                insightsCount: await this.database?.getInsightsCount() || 0
            }
        };
    }

    async openProductionDashboard() {
        shell.openExternal('http://localhost:3000'); // Production Master Dashboard
    }

    async checkLLMStatus() {
        try {
            const status = await this.llmProcessor.getStatus();
            
            const { dialog } = require('electron');
            await dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'LLM Status',
                message: `Local LLM Status: ${status.status}\nModel: ${status.currentModel}\nUptime: ${status.uptime}`
            });

        } catch (error) {
            console.error('❌ Failed to check LLM status:', error);
        }
    }

    async checkSystemHealth() {
        const status = await this.getSystemStatus();
        
        const { dialog } = require('electron');
        await dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'System Health',
            message: `
System Status Report
===================

Recording: ${status.recording.isActive ? 'Active' : 'Inactive'}
Database: ${status.components.database}
LLM Processor: ${status.components.llmProcessor}
Recording Engine: ${status.components.recordingEngine}
Content Analyzer: ${status.components.contentAnalyzer}

Sessions: ${status.stats.sessionsCount}
Content Items: ${status.stats.contentCount}
Insights Generated: ${status.stats.insightsCount}
            `
        });
    }

    async startNewSession() {
        if (this.isRecording) {
            await this.stopRecording();
        }
        
        await this.startRecording();
    }

    async openRecording() {
        // Open file dialog to select recording
        const { dialog } = require('electron');
        
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Recording Files', extensions: ['webm', 'mp4'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            // Load and play recording
            if (this.mainWindow) {
                this.mainWindow.webContents.send('load-recording', result.filePaths[0]);
            }
        }
    }

    async exportInsights() {
        if (!this.currentSession || !this.currentSession.insights.length) {
            const { dialog } = require('electron');
            await dialog.showMessageBox(this.mainWindow, {
                type: 'warning',
                title: 'No Insights',
                message: 'No insights available to export. Start a recording session first.'
            });
            return;
        }

        const { dialog } = require('electron');
        
        const result = await dialog.showSaveDialog(this.mainWindow, {
            defaultPath: `insights-${this.currentSession.id}.json`,
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'Text Files', extensions: ['txt'] }
            ]
        });

        if (!result.canceled) {
            const insights = {
                session: this.currentSession,
                exportedAt: new Date().toISOString()
            };

            await fs.writeFile(result.filePath, JSON.stringify(insights, null, 2));
        }
    }

    async openContentLibrary() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('open-content-library');
        }
    }

    async openSettings() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('open-settings');
        }
    }

    showAbout() {
        const { dialog } = require('electron');
        
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Agentic Browser',
            message: `
Agentic Browser v${this.config.version}

AI-powered browser with local processing
• Screen recording and interaction tracking
• Local LLM integration for insights
• Multimedia content analysis
• Privacy-first design

Built with Electron and love ❤️
            `
        });
    }

    async cleanup() {
        console.log('🧹 Cleaning up Agentic Browser...');

        if (this.isRecording) {
            await this.stopRecording();
        }

        if (this.recordingEngine) {
            await this.recordingEngine.cleanup();
        }

        if (this.database) {
            await this.database.close();
        }

        console.log('✅ Cleanup complete');
    }

    // Utility methods for error handling and fallbacks
    async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    async fallbackContentExtraction(url) {
        // Basic content extraction when services are unavailable
        try {
            const response = await this.fetchWithTimeout(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AgenticBrowser/1.0)'
                }
            }, 10000);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();
            const domain = new URL(url).hostname;
            
            // Basic HTML parsing
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
            
            // Extract text content (very basic)
            const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 5000);

            return {
                url,
                title,
                text: textContent,
                domain,
                wordCount: textContent.split(/\s+/).length,
                timestamp: new Date().toISOString(),
                source: 'fallback',
                meta: {
                    description: 'Content extracted using fallback method'
                }
            };
        } catch (error) {
            console.error('❌ Fallback content extraction failed:', error.message);
            return {
                url,
                title: 'Extraction Failed',
                text: `Failed to extract content from ${url}: ${error.message}`,
                domain: new URL(url).hostname,
                error: true,
                timestamp: new Date().toISOString(),
                source: 'error'
            };
        }
    }

    createMockDatabase() {
        // Mock database for graceful degradation
        return {
            initialize: async () => true,
            saveSession: async (session) => {
                console.log('Mock DB: Session saved locally');
                return session;
            },
            updateSession: async (id, data) => {
                console.log('Mock DB: Session updated locally');
                return data;
            },
            saveContent: async (content) => {
                console.log('Mock DB: Content saved locally');
                return content;
            },
            getSessionCount: async () => 0,
            getContentCount: async () => 0,
            getInsightsCount: async () => 0,
            close: async () => true
        };
    }

    createMockRecordingEngine() {
        // Mock recording engine for graceful degradation
        return {
            initialize: async () => true,
            startRecording: async (sessionId) => {
                console.log('Mock Recording: Started (no actual recording)');
                return { sessionId, mockRecording: true };
            },
            stopRecording: async () => {
                console.log('Mock Recording: Stopped');
                return { filePath: '/dev/null', duration: 0, mockRecording: true };
            },
            pauseRecording: async () => {
                console.log('Mock Recording: Paused');
                return true;
            },
            resumeRecording: async () => {
                console.log('Mock Recording: Resumed');
                return true;
            },
            isPaused: false,
            cleanup: async () => true,
            getAvailableSources: async () => []
        };
    }

    createMockContentAnalyzer() {
        // Mock content analyzer for graceful degradation
        return {
            initialize: async () => true,
            processYouTubeVideo: async (url) => {
                console.log('Mock Analyzer: YouTube processing unavailable');
                return {
                    title: 'Analysis Unavailable',
                    duration: 0,
                    insights: ['Content analysis services are currently unavailable'],
                    url,
                    mock: true
                };
            },
            processPodcast: async (url) => {
                console.log('Mock Analyzer: Podcast processing unavailable');
                return {
                    title: 'Analysis Unavailable',
                    duration: 0,
                    insights: ['Content analysis services are currently unavailable'],
                    url,
                    mock: true
                };
            }
        };
    }

    // Extract insights from CalCompare consultation results
    extractInsightsFromConsultation(consultation) {
        const insights = [];
        
        // Add consultation metadata
        insights.push(`Multi-expert consultation (ID: ${consultation.id})`);
        insights.push(`Consultation type: ${consultation.consultation_type}`);
        insights.push(`${consultation.expert_responses?.length || 0} expert opinions received`);
        
        // Extract insights from each expert response
        if (consultation.expert_responses) {
            consultation.expert_responses.forEach((response, index) => {
                insights.push(`Expert ${index + 1} (${response.expert || 'Unknown'}): ${response.response?.substring(0, 200)}...`);
            });
        }
        
        // Add consultation summary if available
        if (consultation.summary) {
            insights.push(`Summary: ${consultation.summary}`);
        }
        
        // Add routing information
        if (consultation.routing) {
            insights.push(`Smart routing: ${consultation.routing.determinedType} (confidence: ${Math.round(consultation.routing.confidence * 100)}%)`);
        }
        
        return insights;
    }

    async cleanup() {
        console.log('🧹 Cleaning up Agentic Browser...');

        if (this.isRecording) {
            await this.stopRecording();
        }

        if (this.recordingEngine) {
            await this.recordingEngine.cleanup();
        }

        if (this.database) {
            await this.database.close();
        }

        if (this.serviceClient) {
            await this.serviceClient.cleanup();
        }

        console.log('✅ Cleanup complete');
    }
}

// Create and export the app instance
const agenticBrowser = new AgenticBrowserApp();

module.exports = AgenticBrowserApp;
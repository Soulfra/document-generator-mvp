#!/usr/bin/env node

/**
 * 🎥 BROWSER RECORDING ENGINE
 * 
 * Handles screen recording and user interaction tracking for the agentic browser.
 * 
 * Features:
 * - Screen capture with desktopCapturer API
 * - User interaction tracking (clicks, scrolls, keystrokes)
 * - Session management and replay capability
 * - Real-time streaming to local LLM for analysis
 * - Privacy-first local processing only
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/browser-recording.log' })
  ]
});

class BrowserRecordingEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      outputDir: options.outputDir || './recordings',
      maxRecordingDuration: options.maxRecordingDuration || 60 * 60 * 1000, // 1 hour
      frameRate: options.frameRate || 30,
      videoBitrate: options.videoBitrate || 2500000, // 2.5 Mbps
      audioEnabled: options.audioEnabled || false,
      interactionTracking: options.interactionTracking !== false,
      database: options.database || null,
      ...options
    };

    // Recording state
    this.isRecording = false;
    this.isPaused = false;
    this.currentSession = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    
    // Interaction tracking
    this.interactions = [];
    this.startTime = null;
    this.lastInteraction = null;
    
    // Screen capture
    this.stream = null;
    this.selectedSource = null;
    
    // Event listeners
    this.mouseTracker = null;
    this.keyboardTracker = null;
    this.scrollTracker = null;
    
    console.log('🎥 Browser Recording Engine initialized');
  }

  async initialize() {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDir, { recursive: true });
      
      // Setup interaction tracking if enabled
      if (this.config.interactionTracking) {
        this.setupInteractionTracking();
      }
      
      logger.info('✅ Browser Recording Engine ready');
      this.emit('ready');
      
    } catch (error) {
      logger.error('❌ Failed to initialize recording engine:', error);
      throw error;
    }
  }

  /**
   * Start recording with automatic source selection or user choice
   */
  async startRecording(sessionId, sourceId = null) {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      logger.info('🎬 Starting recording session', { sessionId });

      // Create session
      this.currentSession = {
        id: sessionId,
        startTime: Date.now(),
        outputPath: path.join(this.config.outputDir, `${sessionId}.webm`),
        interactionsPath: path.join(this.config.outputDir, `${sessionId}-interactions.json`),
        metadata: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timestamp: new Date().toISOString()
        }
      };

      // Get screen sources
      const sources = await this.getAvailableSources();
      
      // Select source (use provided ID or auto-select primary screen)
      this.selectedSource = sourceId ? 
        sources.find(s => s.id === sourceId) : 
        sources.find(s => s.name === 'Entire Screen') || sources[0];

      if (!this.selectedSource) {
        throw new Error('No screen source available for recording');
      }

      // Start screen capture
      await this.startScreenCapture();
      
      // Start interaction tracking
      this.startInteractionTracking();
      
      // Setup recording timeout
      this.setupRecordingTimeout();
      
      this.isRecording = true;
      this.startTime = Date.now();
      
      logger.info('✅ Recording started', {
        sessionId,
        source: this.selectedSource.name,
        outputPath: this.currentSession.outputPath
      });

      this.emit('recording:started', this.currentSession);
      
      return this.currentSession;

    } catch (error) {
      logger.error('❌ Failed to start recording:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Get available screen sources
   */
  async getAvailableSources() {
    const { desktopCapturer } = require('electron');
    
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 300, height: 200 }
    });

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      type: source.id.startsWith('screen:') ? 'screen' : 'window'
    }));
  }

  /**
   * Start screen capture using Media API
   */
  async startScreenCapture() {
    try {
      // Create constraints for screen capture
      const constraints = {
        audio: this.config.audioEnabled ? {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        } : false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: this.selectedSource.id,
            maxWidth: 1920,
            maxHeight: 1080,
            minFrameRate: this.config.frameRate,
            maxFrameRate: this.config.frameRate
          }
        }
      };

      // Get media stream
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Setup MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: this.config.videoBitrate
      });

      // Handle recorded data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = async () => {
        await this.saveRecording();
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        logger.error('MediaRecorder error:', event.error);
        this.emit('recording:error', event.error);
      };

      // Start recording
      this.mediaRecorder.start(1000); // Capture in 1-second chunks
      
      logger.info('📹 Screen capture started');

    } catch (error) {
      logger.error('❌ Failed to start screen capture:', error);
      throw error;
    }
  }

  /**
   * Setup interaction tracking
   */
  setupInteractionTracking() {
    // Note: In a real Electron app, these would be set up in the renderer process
    // and communicated via IPC. This is a conceptual implementation.
    
    logger.info('🖱️ Setting up interaction tracking');

    // Mouse tracking setup (would be implemented in renderer)
    this.mouseTracker = {
      onClick: (event) => this.recordInteraction('click', {
        x: event.clientX,
        y: event.clientY,
        target: event.target.tagName,
        timestamp: Date.now() - this.startTime
      }),
      
      onMouseMove: (event) => {
        // Throttle mouse move events
        if (!this.lastMouseMove || Date.now() - this.lastMouseMove > 100) {
          this.recordInteraction('mousemove', {
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now() - this.startTime
          });
          this.lastMouseMove = Date.now();
        }
      }
    };

    // Keyboard tracking setup
    this.keyboardTracker = {
      onKeyPress: (event) => this.recordInteraction('keypress', {
        key: event.key,
        code: event.code,
        timestamp: Date.now() - this.startTime
      })
    };

    // Scroll tracking setup
    this.scrollTracker = {
      onScroll: (event) => this.recordInteraction('scroll', {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        timestamp: Date.now() - this.startTime
      })
    };
  }

  /**
   * Start interaction tracking for current session
   */
  startInteractionTracking() {
    if (!this.config.interactionTracking) return;

    this.interactions = [];
    logger.info('🎯 Started interaction tracking');
    
    // This would be implemented in the renderer process
    this.emit('tracking:start');
  }

  /**
   * Record an interaction event
   */
  recordInteraction(type, data) {
    if (!this.isRecording || this.isPaused) return;

    const interaction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now() - this.startTime,
      data,
      sessionId: this.currentSession?.id
    };

    this.interactions.push(interaction);
    this.lastInteraction = interaction;

    // Emit for real-time processing
    this.emit('interaction:recorded', interaction);

    // Save interactions periodically
    if (this.interactions.length % 50 === 0) {
      this.saveInteractions();
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording() {
    if (!this.isRecording || this.isPaused) {
      throw new Error('No active recording to pause');
    }

    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
      }
      
      this.isPaused = true;
      
      logger.info('⏸️ Recording paused');
      this.emit('recording:paused', this.currentSession);

    } catch (error) {
      logger.error('❌ Failed to pause recording:', error);
      throw error;
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording() {
    if (!this.isRecording || !this.isPaused) {
      throw new Error('No paused recording to resume');
    }

    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
      }
      
      this.isPaused = false;
      
      logger.info('▶️ Recording resumed');
      this.emit('recording:resumed', this.currentSession);

    } catch (error) {
      logger.error('❌ Failed to resume recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and save files
   */
  async stopRecording() {
    if (!this.isRecording) {
      throw new Error('No active recording to stop');
    }

    try {
      logger.info('⏹️ Stopping recording');

      // Stop media recorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Stop interaction tracking
      this.stopInteractionTracking();

      // Finalize session
      this.currentSession.endTime = Date.now();
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
      this.currentSession.interactionCount = this.interactions.length;

      // Save final interactions
      await this.saveInteractions();

      // Update session metadata
      await this.saveSessionMetadata();

      // Cleanup
      await this.cleanup();

      this.isRecording = false;
      this.isPaused = false;

      logger.info('✅ Recording stopped', {
        sessionId: this.currentSession.id,
        duration: this.currentSession.duration,
        interactions: this.interactions.length
      });

      const session = this.currentSession;
      this.emit('recording:stopped', session);

      return {
        sessionId: session.id,
        filePath: session.outputPath,
        duration: session.duration,
        interactionCount: session.interactionCount
      };

    } catch (error) {
      logger.error('❌ Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Save recorded video file
   */
  async saveRecording() {
    if (this.recordedChunks.length === 0) {
      logger.warn('⚠️ No recorded chunks to save');
      return;
    }

    try {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const buffer = await blob.arrayBuffer();
      
      await fs.writeFile(this.currentSession.outputPath, Buffer.from(buffer));
      
      logger.info('💾 Recording saved', { 
        path: this.currentSession.outputPath,
        size: buffer.byteLength 
      });

      this.emit('recording:saved', {
        path: this.currentSession.outputPath,
        size: buffer.byteLength
      });

    } catch (error) {
      logger.error('❌ Failed to save recording:', error);
      throw error;
    }
  }

  /**
   * Save interaction data
   */
  async saveInteractions() {
    if (!this.currentSession || this.interactions.length === 0) return;

    try {
      const interactionData = {
        sessionId: this.currentSession.id,
        startTime: this.currentSession.startTime,
        interactions: this.interactions,
        metadata: {
          totalInteractions: this.interactions.length,
          lastUpdated: Date.now(),
          types: [...new Set(this.interactions.map(i => i.type))]
        }
      };

      await fs.writeFile(
        this.currentSession.interactionsPath,
        JSON.stringify(interactionData, null, 2)
      );

      logger.debug('📊 Interactions saved', { 
        path: this.currentSession.interactionsPath,
        count: this.interactions.length 
      });

    } catch (error) {
      logger.error('❌ Failed to save interactions:', error);
    }
  }

  /**
   * Save session metadata
   */
  async saveSessionMetadata() {
    if (!this.currentSession) return;

    try {
      const metadataPath = path.join(
        this.config.outputDir,
        `${this.currentSession.id}-metadata.json`
      );

      const metadata = {
        ...this.currentSession,
        stats: {
          videoSize: await this.getFileSize(this.currentSession.outputPath),
          interactionTypes: this.getInteractionTypeStats(),
          averageInteractionInterval: this.calculateAverageInteractionInterval()
        }
      };

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Save to database if available
      if (this.config.database) {
        await this.config.database.saveSession(metadata);
      }

      logger.info('📝 Session metadata saved', { path: metadataPath });

    } catch (error) {
      logger.error('❌ Failed to save session metadata:', error);
    }
  }

  /**
   * Stop interaction tracking
   */
  stopInteractionTracking() {
    logger.info('🛑 Stopped interaction tracking');
    this.emit('tracking:stop');
  }

  /**
   * Setup recording timeout
   */
  setupRecordingTimeout() {
    if (this.config.maxRecordingDuration > 0) {
      setTimeout(() => {
        if (this.isRecording) {
          logger.warn('⏰ Recording timeout reached, stopping automatically');
          this.stopRecording().catch(error => {
            logger.error('❌ Failed to stop recording on timeout:', error);
          });
        }
      }, this.config.maxRecordingDuration);
    }
  }

  /**
   * Get file size in bytes
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get interaction type statistics
   */
  getInteractionTypeStats() {
    const stats = {};
    this.interactions.forEach(interaction => {
      stats[interaction.type] = (stats[interaction.type] || 0) + 1;
    });
    return stats;
  }

  /**
   * Calculate average time between interactions
   */
  calculateAverageInteractionInterval() {
    if (this.interactions.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < this.interactions.length; i++) {
      intervals.push(this.interactions[i].timestamp - this.interactions[i-1].timestamp);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  /**
   * Cleanup recording resources
   */
  async cleanup() {
    try {
      // Stop media stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      // Clear recorded chunks
      this.recordedChunks = [];

      // Reset state
      this.mediaRecorder = null;
      this.selectedSource = null;

      logger.debug('🧹 Recording resources cleaned up');

    } catch (error) {
      logger.error('❌ Failed to cleanup recording resources:', error);
    }
  }

  /**
   * Get recording status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      currentSession: this.currentSession ? {
        id: this.currentSession.id,
        startTime: this.currentSession.startTime,
        duration: this.isRecording ? Date.now() - this.currentSession.startTime : null,
        interactionCount: this.interactions.length
      } : null,
      interactions: this.interactions.length,
      lastInteraction: this.lastInteraction
    };
  }

  /**
   * Load and replay a recording session
   */
  async loadSession(sessionId) {
    try {
      const metadataPath = path.join(this.config.outputDir, `${sessionId}-metadata.json`);
      const interactionsPath = path.join(this.config.outputDir, `${sessionId}-interactions.json`);
      const videoPath = path.join(this.config.outputDir, `${sessionId}.webm`);

      const [metadata, interactions] = await Promise.all([
        fs.readFile(metadataPath, 'utf8').then(JSON.parse),
        fs.readFile(interactionsPath, 'utf8').then(JSON.parse).catch(() => ({ interactions: [] }))
      ]);

      return {
        metadata,
        interactions: interactions.interactions || [],
        videoPath,
        hasVideo: await fs.access(videoPath).then(() => true).catch(() => false)
      };

    } catch (error) {
      logger.error('❌ Failed to load session:', error);
      throw error;
    }
  }

  /**
   * Get list of available recordings
   */
  async getRecordings() {
    try {
      const files = await fs.readdir(this.config.outputDir);
      const metadataFiles = files.filter(f => f.endsWith('-metadata.json'));
      
      const recordings = await Promise.all(
        metadataFiles.map(async (file) => {
          const filePath = path.join(this.config.outputDir, file);
          const metadata = JSON.parse(await fs.readFile(filePath, 'utf8'));
          return {
            id: metadata.id,
            startTime: metadata.startTime,
            duration: metadata.duration,
            interactionCount: metadata.interactionCount,
            videoSize: metadata.stats?.videoSize || 0
          };
        })
      );

      return recordings.sort((a, b) => b.startTime - a.startTime);

    } catch (error) {
      logger.error('❌ Failed to get recordings list:', error);
      return [];
    }
  }
}

module.exports = BrowserRecordingEngine;

// Start standalone if called directly
if (require.main === module) {
  const recordingEngine = new BrowserRecordingEngine();
  
  recordingEngine.on('ready', () => {
    console.log('🎥 Browser Recording Engine is ready!');
  });

  recordingEngine.on('recording:started', (session) => {
    console.log(`🎬 Recording started: ${session.id}`);
  });

  recordingEngine.on('recording:stopped', (result) => {
    console.log(`⏹️ Recording stopped: ${result.sessionId} (${result.duration}ms)`);
  });

  recordingEngine.on('interaction:recorded', (interaction) => {
    console.log(`🎯 Interaction: ${interaction.type} at ${interaction.timestamp}ms`);
  });

  recordingEngine.initialize().catch(error => {
    console.error('❌ Failed to initialize recording engine:', error);
    process.exit(1);
  });
}
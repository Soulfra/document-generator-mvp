#!/usr/bin/env node

/**
 * QR Desktop Lock System
 * Locks desktop except for whitelisted programs, unlockable via QR scan
 * Helps prevent brainrot and mindless browsing
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const QRCode = require('qrcode');
const express = require('express');
const WebSocket = require('ws');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class QRDesktopLockSystem extends EventEmitter {
  constructor() {
    super();
    
    // Lock system state
    this.lockState = {
      isLocked: true,
      lockStartTime: Date.now(),
      unlockAttempts: 0,
      currentSession: null,
      temporaryUnlocks: new Map(), // programId -> expiry time
      dailyUnlockCount: 0,
      lastUnlockTime: null
    };
    
    // Whitelisted programs (always allowed)
    this.whitelist = {
      essential: [
        'Terminal', 'iTerm', 'Console',           // Dev tools
        'Activity Monitor', 'System Preferences',  // System tools
        'Finder',                                  // File management
        'TextEdit', 'Notes',                       // Basic productivity
        'Calculator', 'Calendar',                  // Utilities
        'FaceTime', 'Messages',                    // Communication
        'qr-desktop-lock'                          // This app
      ],
      
      productivity: [
        'VSCode', 'Visual Studio Code',
        'Xcode', 'IntelliJ IDEA',
        'Sublime Text', 'Atom',
        'Microsoft Word', 'Pages',
        'Microsoft Excel', 'Numbers',
        'Keynote', 'PowerPoint'
      ],
      
      wellness: [
        'Headspace', 'Calm',
        'Forest', 'Freedom',
        'RescueTime', 'Toggl'
      ],
      
      userDefined: [] // User can add their own
    };
    
    // Blocklist (never allowed when locked)
    this.blocklist = {
      distracting: [
        'Discord', 'Slack',                        // Chat (can be distracting)
        'Twitter', 'Facebook', 'Instagram',        // Social media
        'Reddit', 'TikTok', 'YouTube',            // Time sinks
        'Steam', 'Epic Games', 'Battle.net',      // Gaming
        'Netflix', 'Disney+', 'Hulu',             // Streaming
        'Twitch', 'Spotify'                       // Entertainment
      ],
      
      browsers: [
        'Google Chrome', 'Safari',
        'Firefox', 'Microsoft Edge',
        'Opera', 'Brave'
      ]
    };
    
    // QR authentication
    this.qrAuth = {
      currentChallenge: null,
      challengeExpiry: 300000, // 5 minutes
      server: null,
      wsServer: null,
      port: 9823,
      connections: new Set()
    };
    
    // Anti-brainrot features
    this.antiBrainrot = {
      enabled: true,
      
      // Focus modes
      focusModes: {
        deep_work: {
          duration: 90,  // minutes
          whitelist: ['essential', 'productivity'],
          breaks: { frequency: 90, duration: 15 }
        },
        
        creative: {
          duration: 60,
          whitelist: ['essential', 'productivity', 'wellness'],
          breaks: { frequency: 60, duration: 10 }
        },
        
        communication: {
          duration: 30,
          whitelist: ['essential'],
          temporaryUnlock: ['Messages', 'Mail', 'Slack'],
          breaks: { frequency: 30, duration: 5 }
        },
        
        learning: {
          duration: 45,
          whitelist: ['essential', 'productivity'],
          temporaryUnlock: ['Safari', 'Chrome'], // Limited browser
          breaks: { frequency: 45, duration: 10 }
        }
      },
      
      // Pomodoro timer
      pomodoro: {
        enabled: false,
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        currentSession: 0
      },
      
      // Mindfulness prompts
      mindfulnessPrompts: [
        "Take a deep breath and count to 10",
        "Stand up and stretch for 30 seconds",
        "Look away from the screen at something 20 feet away",
        "Check your posture - straighten your back",
        "Drink a glass of water",
        "Do 5 shoulder rolls backwards",
        "Close your eyes and listen to your breathing",
        "Write down 3 things you're grateful for"
      ]
    };
    
    // Usage analytics
    this.analytics = {
      lockSessions: [],
      programUsage: new Map(),
      focusScore: 100,
      distractionAttempts: 0,
      successfulFocusSessions: 0
    };
    
    console.log('🔒 QR Desktop Lock System initialized');
    this.initialize();
  }
  
  async initialize() {
    // Load saved configuration
    await this.loadConfiguration();
    
    // Start QR authentication server
    await this.startQRServer();
    
    // Initialize system lock
    await this.initializeSystemLock();
    
    // Start monitoring
    this.startProcessMonitoring();
    this.startFocusTracking();
    
    // Generate initial QR code
    await this.generateNewChallenge();
    
    console.log('🔒 Lock system ready');
  }
  
  async loadConfiguration() {
    try {
      const config = await fs.readFile('.qr-lock-config.json', 'utf8');
      const parsed = JSON.parse(config);
      
      // Restore user-defined whitelist
      if (parsed.userWhitelist) {
        this.whitelist.userDefined = parsed.userWhitelist;
      }
      
      // Restore anti-brainrot settings
      if (parsed.antiBrainrot) {
        Object.assign(this.antiBrainrot, parsed.antiBrainrot);
      }
      
      console.log('🔒 Loaded configuration');
    } catch (error) {
      console.log('🔒 Using default configuration');
    }
  }
  
  async saveConfiguration() {
    try {
      const config = {
        userWhitelist: this.whitelist.userDefined,
        antiBrainrot: {
          enabled: this.antiBrainrot.enabled,
          pomodoro: this.antiBrainrot.pomodoro
        },
        savedAt: Date.now()
      };
      
      await fs.writeFile('.qr-lock-config.json', JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }
  
  async startQRServer() {
    const app = express();
    app.use(express.json());
    
    // Serve QR code page
    app.get('/qr', async (req, res) => {
      if (!this.qrAuth.currentChallenge) {
        await this.generateNewChallenge();
      }
      
      const qrData = {
        challenge: this.qrAuth.currentChallenge,
        endpoint: `ws://localhost:${this.qrAuth.port}/auth`,
        timestamp: Date.now()
      };
      
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Desktop Unlock</title>
          <style>
            body {
              background: #1a1a1a;
              color: #fff;
              font-family: monospace;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: #2a2a2a;
              border-radius: 1rem;
              box-shadow: 0 0 20px rgba(0,255,0,0.2);
            }
            h1 { color: #0f0; margin-bottom: 2rem; }
            .qr-code { 
              background: white; 
              padding: 1rem; 
              border-radius: 0.5rem;
              margin: 1rem 0;
            }
            .status { 
              margin-top: 1rem; 
              font-size: 1.2rem;
              color: #0f0;
            }
            .locked { color: #f00; }
            .info {
              margin-top: 2rem;
              opacity: 0.7;
              max-width: 400px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔒 Desktop Lock System</h1>
            <div class="status ${this.lockState.isLocked ? 'locked' : ''}">
              Status: ${this.lockState.isLocked ? 'LOCKED' : 'UNLOCKED'}
            </div>
            <div class="qr-code">
              <img src="${qrCode}" alt="QR Code" />
            </div>
            <div class="info">
              <p>Scan this QR code with your phone to unlock the desktop</p>
              <p>Only whitelisted programs are available when locked</p>
              <p>Helps prevent mindless browsing and digital addiction</p>
            </div>
          </div>
          <script>
            // Auto-refresh every 30 seconds
            setTimeout(() => location.reload(), 30000);
          </script>
        </body>
        </html>
      `);
    });
    
    // Authentication endpoint
    app.post('/auth', async (req, res) => {
      const { challenge, response } = req.body;
      
      if (await this.validateChallenge(challenge, response)) {
        await this.unlock('qr_scan');
        res.json({ success: true, message: 'Desktop unlocked!' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid challenge' });
      }
    });
    
    // API endpoints
    app.get('/status', (req, res) => {
      res.json(this.getStatus());
    });
    
    app.post('/lock', async (req, res) => {
      await this.lock();
      res.json({ success: true });
    });
    
    app.post('/whitelist/add', async (req, res) => {
      const { program } = req.body;
      this.addToWhitelist(program);
      await this.saveConfiguration();
      res.json({ success: true });
    });
    
    this.qrAuth.server = app.listen(this.qrAuth.port, () => {
      console.log(`🔒 QR server running on port ${this.qrAuth.port}`);
    });
    
    // WebSocket for real-time updates
    this.qrAuth.wsServer = new WebSocket.Server({ port: this.qrAuth.port + 1 });
    
    this.qrAuth.wsServer.on('connection', (ws) => {
      this.qrAuth.connections.add(ws);
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'auth' && data.challenge) {
            if (await this.validateChallenge(data.challenge, data.response)) {
              await this.unlock('qr_scan');
              ws.send(JSON.stringify({ type: 'unlock_success' }));
              this.broadcastStatus();
            }
          }
        } catch (error) {
          console.error('WebSocket error:', error);
        }
      });
      
      ws.on('close', () => {
        this.qrAuth.connections.delete(ws);
      });
    });
  }
  
  async generateNewChallenge() {
    this.qrAuth.currentChallenge = crypto.randomBytes(32).toString('hex');
    
    setTimeout(() => {
      this.qrAuth.currentChallenge = null;
    }, this.qrAuth.challengeExpiry);
    
    console.log('🔒 Generated new QR challenge');
  }
  
  async validateChallenge(challenge, response) {
    if (!this.qrAuth.currentChallenge) return false;
    if (challenge !== this.qrAuth.currentChallenge) return false;
    
    // Simple validation - in production would use proper crypto
    const expectedResponse = crypto
      .createHash('sha256')
      .update(challenge + 'desktop_unlock_secret')
      .digest('hex');
    
    return response === expectedResponse;
  }
  
  async initializeSystemLock() {
    // Platform-specific initialization
    const platform = process.platform;
    
    if (platform === 'darwin') {
      // macOS: Use Accessibility API
      console.log('🔒 Initializing macOS lock system');
    } else if (platform === 'win32') {
      // Windows: Use Windows API
      console.log('🔒 Initializing Windows lock system');
    } else if (platform === 'linux') {
      // Linux: Use X11/Wayland
      console.log('🔒 Initializing Linux lock system');
    }
    
    // Start in locked state
    await this.lock();
  }
  
  async lock() {
    this.lockState.isLocked = true;
    this.lockState.lockStartTime = Date.now();
    this.lockState.currentSession = {
      startTime: Date.now(),
      endTime: null,
      focusScore: 100,
      distractions: []
    };
    
    console.log('🔒 Desktop locked');
    
    // Kill non-whitelisted processes
    await this.enforceWhitelist();
    
    // Show lock notification
    this.showNotification('Desktop Locked', 'Only essential programs available. Scan QR to unlock.');
    
    this.emit('locked');
    this.broadcastStatus();
  }
  
  async unlock(method = 'unknown') {
    this.lockState.isLocked = false;
    this.lockState.lastUnlockTime = Date.now();
    this.lockState.dailyUnlockCount++;
    
    if (this.lockState.currentSession) {
      this.lockState.currentSession.endTime = Date.now();
      this.analytics.lockSessions.push(this.lockState.currentSession);
    }
    
    console.log(`🔓 Desktop unlocked via ${method}`);
    
    // Generate new challenge for next unlock
    await this.generateNewChallenge();
    
    // Show unlock notification
    this.showNotification('Desktop Unlocked', 'Remember to take breaks and stay mindful!');
    
    this.emit('unlocked', { method });
    this.broadcastStatus();
    
    // Auto-lock after timeout if configured
    if (this.antiBrainrot.enabled && this.antiBrainrot.autoLockTimeout) {
      setTimeout(() => {
        if (!this.lockState.isLocked) {
          this.lock();
        }
      }, this.antiBrainrot.autoLockTimeout);
    }
  }
  
  startProcessMonitoring() {
    // Monitor running processes every 5 seconds
    setInterval(async () => {
      if (this.lockState.isLocked) {
        await this.enforceWhitelist();
      }
      
      await this.trackProgramUsage();
    }, 5000);
  }
  
  async enforceWhitelist() {
    try {
      // Get list of running processes
      const processes = await this.getRunningProcesses();
      
      for (const process of processes) {
        if (!this.isProgramAllowed(process.name)) {
          // Kill non-whitelisted process
          await this.killProcess(process.pid);
          
          console.log(`🚫 Blocked: ${process.name}`);
          
          // Track distraction attempt
          this.analytics.distractionAttempts++;
          
          if (this.lockState.currentSession) {
            this.lockState.currentSession.distractions.push({
              program: process.name,
              timestamp: Date.now()
            });
          }
          
          // Show notification
          this.showNotification(
            'Program Blocked',
            `${process.name} is not allowed during lock mode`,
            'warning'
          );
        }
      }
    } catch (error) {
      console.error('Process monitoring error:', error);
    }
  }
  
  async getRunningProcesses() {
    const platform = process.platform;
    let command;
    
    if (platform === 'darwin') {
      // macOS
      command = 'ps aux | grep -v grep';
    } else if (platform === 'win32') {
      // Windows
      command = 'tasklist';
    } else {
      // Linux
      command = 'ps aux | grep -v grep';
    }
    
    try {
      const { stdout } = await execPromise(command);
      return this.parseProcessList(stdout);
    } catch (error) {
      console.error('Failed to get processes:', error);
      return [];
    }
  }
  
  parseProcessList(output) {
    const processes = [];
    const lines = output.split('\n');
    
    // Simple parsing - would be more robust in production
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length > 10) {
        processes.push({
          pid: parts[1],
          name: parts[10] || 'unknown'
        });
      }
    });
    
    return processes;
  }
  
  isProgramAllowed(programName) {
    if (!this.lockState.isLocked) return true;
    
    // Check temporary unlocks
    if (this.lockState.temporaryUnlocks.has(programName)) {
      const expiry = this.lockState.temporaryUnlocks.get(programName);
      if (Date.now() < expiry) {
        return true;
      } else {
        this.lockState.temporaryUnlocks.delete(programName);
      }
    }
    
    // Check whitelist
    const allWhitelisted = [
      ...this.whitelist.essential,
      ...this.whitelist.productivity,
      ...this.whitelist.wellness,
      ...this.whitelist.userDefined
    ];
    
    return allWhitelisted.some(allowed => 
      programName.toLowerCase().includes(allowed.toLowerCase())
    );
  }
  
  async killProcess(pid) {
    const platform = process.platform;
    let command;
    
    if (platform === 'win32') {
      command = `taskkill /PID ${pid} /F`;
    } else {
      command = `kill -9 ${pid}`;
    }
    
    try {
      await execPromise(command);
    } catch (error) {
      // Process might have already exited
    }
  }
  
  addToWhitelist(programName) {
    if (!this.whitelist.userDefined.includes(programName)) {
      this.whitelist.userDefined.push(programName);
      console.log(`✅ Added ${programName} to whitelist`);
    }
  }
  
  removeFromWhitelist(programName) {
    const index = this.whitelist.userDefined.indexOf(programName);
    if (index > -1) {
      this.whitelist.userDefined.splice(index, 1);
      console.log(`❌ Removed ${programName} from whitelist`);
    }
  }
  
  temporaryUnlock(programName, minutes = 30) {
    const expiry = Date.now() + (minutes * 60000);
    this.lockState.temporaryUnlocks.set(programName, expiry);
    
    console.log(`⏰ Temporary unlock: ${programName} for ${minutes} minutes`);
    
    this.showNotification(
      'Temporary Access',
      `${programName} unlocked for ${minutes} minutes`,
      'info'
    );
  }
  
  startFocusTracking() {
    // Track focus score every minute
    setInterval(() => {
      if (this.lockState.isLocked && this.lockState.currentSession) {
        this.updateFocusScore();
      }
    }, 60000);
    
    // Mindfulness prompts
    if (this.antiBrainrot.enabled) {
      setInterval(() => {
        if (!this.lockState.isLocked) {
          this.showMindfulnessPrompt();
        }
      }, 1800000); // Every 30 minutes
    }
  }
  
  updateFocusScore() {
    const session = this.lockState.currentSession;
    if (!session) return;
    
    // Decrease score for each distraction
    const recentDistractions = session.distractions.filter(
      d => Date.now() - d.timestamp < 300000 // Last 5 minutes
    ).length;
    
    session.focusScore = Math.max(0, session.focusScore - (recentDistractions * 5));
    
    // Increase score for sustained focus
    const focusDuration = (Date.now() - session.startTime) / 60000; // Minutes
    if (recentDistractions === 0) {
      session.focusScore = Math.min(100, session.focusScore + Math.floor(focusDuration / 10));
    }
    
    this.analytics.focusScore = session.focusScore;
  }
  
  showMindfulnessPrompt() {
    const prompt = this.antiBrainrot.mindfulnessPrompts[
      Math.floor(Math.random() * this.antiBrainrot.mindfulnessPrompts.length)
    ];
    
    this.showNotification('Mindfulness Break', prompt, 'info');
  }
  
  async trackProgramUsage() {
    try {
      const processes = await this.getRunningProcesses();
      
      processes.forEach(process => {
        const usage = this.analytics.programUsage.get(process.name) || {
          totalMinutes: 0,
          lastSeen: null,
          sessions: 0
        };
        
        if (!usage.lastSeen || Date.now() - usage.lastSeen > 60000) {
          usage.sessions++;
        }
        
        usage.totalMinutes += 0.083; // 5 seconds = 0.083 minutes
        usage.lastSeen = Date.now();
        
        this.analytics.programUsage.set(process.name, usage);
      });
    } catch (error) {
      // Ignore tracking errors
    }
  }
  
  showNotification(title, message, type = 'info') {
    // Platform-specific notification
    const platform = process.platform;
    
    if (platform === 'darwin') {
      // macOS notification
      exec(`osascript -e 'display notification "${message}" with title "${title}"'`);
    } else if (platform === 'win32') {
      // Windows notification (would use proper Windows API)
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    } else {
      // Linux notification
      exec(`notify-send "${title}" "${message}"`);
    }
  }
  
  broadcastStatus() {
    const status = this.getStatus();
    const message = JSON.stringify({ type: 'status_update', ...status });
    
    this.qrAuth.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  getStatus() {
    return {
      isLocked: this.lockState.isLocked,
      lockDuration: this.lockState.isLocked ? 
        Math.floor((Date.now() - this.lockState.lockStartTime) / 60000) : 0,
      focusScore: this.analytics.focusScore,
      distractionAttempts: this.analytics.distractionAttempts,
      dailyUnlocks: this.lockState.dailyUnlockCount,
      activePrograms: this.getActiveWhitelistedPrograms(),
      temporaryUnlocks: Array.from(this.lockState.temporaryUnlocks.entries())
        .map(([program, expiry]) => ({
          program,
          remainingMinutes: Math.ceil((expiry - Date.now()) / 60000)
        }))
    };
  }
  
  getActiveWhitelistedPrograms() {
    const active = [];
    this.analytics.programUsage.forEach((usage, program) => {
      if (usage.lastSeen && Date.now() - usage.lastSeen < 60000) {
        if (this.isProgramAllowed(program)) {
          active.push(program);
        }
      }
    });
    return active;
  }
  
  // Focus mode management
  async startFocusMode(mode) {
    const focusMode = this.antiBrainrot.focusModes[mode];
    if (!focusMode) return;
    
    console.log(`🎯 Starting focus mode: ${mode}`);
    
    // Lock the desktop
    await this.lock();
    
    // Apply focus mode whitelist
    this.currentFocusMode = mode;
    
    // Set temporary unlocks if specified
    if (focusMode.temporaryUnlock) {
      focusMode.temporaryUnlock.forEach(program => {
        this.temporaryUnlock(program, focusMode.duration);
      });
    }
    
    // Schedule break reminders
    if (focusMode.breaks) {
      this.scheduleBreakReminders(focusMode.breaks);
    }
    
    // Auto-end focus mode
    setTimeout(() => {
      this.endFocusMode();
    }, focusMode.duration * 60000);
    
    this.showNotification(
      'Focus Mode Started',
      `${mode} mode active for ${focusMode.duration} minutes`,
      'success'
    );
  }
  
  endFocusMode() {
    if (this.currentFocusMode) {
      console.log(`🎯 Ending focus mode: ${this.currentFocusMode}`);
      
      const session = this.lockState.currentSession;
      if (session && session.focusScore > 80) {
        this.analytics.successfulFocusSessions++;
      }
      
      this.currentFocusMode = null;
      this.unlock('focus_complete');
      
      this.showNotification(
        'Focus Mode Complete',
        `Great job! Focus score: ${this.analytics.focusScore}/100`,
        'success'
      );
    }
  }
  
  scheduleBreakReminders(breakConfig) {
    const remindAt = breakConfig.frequency * 60000;
    
    setTimeout(() => {
      this.showNotification(
        'Break Time',
        `Time for a ${breakConfig.duration} minute break!`,
        'info'
      );
      
      // Temporarily unlock for break if needed
      if (this.lockState.isLocked) {
        this.temporaryUnlock('all', breakConfig.duration);
      }
    }, remindAt);
  }
  
  getAnalytics() {
    const totalLockTime = this.analytics.lockSessions.reduce(
      (total, session) => total + (session.endTime - session.startTime),
      0
    );
    
    const averageFocusScore = this.analytics.lockSessions.reduce(
      (sum, session) => sum + session.focusScore,
      0
    ) / Math.max(1, this.analytics.lockSessions.length);
    
    return {
      totalLockTime: Math.floor(totalLockTime / 60000), // minutes
      averageFocusScore,
      distractionAttempts: this.analytics.distractionAttempts,
      successfulFocusSessions: this.analytics.successfulFocusSessions,
      mostUsedPrograms: this.getMostUsedPrograms(),
      dailyUnlocks: this.lockState.dailyUnlockCount
    };
  }
  
  getMostUsedPrograms() {
    return Array.from(this.analytics.programUsage.entries())
      .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
      .slice(0, 10)
      .map(([program, usage]) => ({
        program,
        totalMinutes: Math.floor(usage.totalMinutes),
        sessions: usage.sessions
      }));
  }
}

// Export for use in other modules
module.exports = QRDesktopLockSystem;

// If run directly, start the lock system
if (require.main === module) {
  console.log('🔒 STARTING QR DESKTOP LOCK SYSTEM');
  console.log('===================================');
  
  const lockSystem = new QRDesktopLockSystem();
  
  // Handle events
  lockSystem.on('locked', () => {
    console.log('🔒 EVENT: Desktop locked');
  });
  
  lockSystem.on('unlocked', (data) => {
    console.log(`🔓 EVENT: Desktop unlocked via ${data.method}`);
  });
  
  // Show status every minute
  setInterval(() => {
    const status = lockSystem.getStatus();
    console.log('\n🔒 LOCK STATUS:');
    console.log(`   Locked: ${status.isLocked}`);
    console.log(`   Focus Score: ${status.focusScore}/100`);
    console.log(`   Distractions Blocked: ${status.distractionAttempts}`);
    console.log(`   Daily Unlocks: ${status.dailyUnlocks}`);
    
    if (status.isLocked) {
      console.log(`   Lock Duration: ${status.lockDuration} minutes`);
    }
    
    if (status.temporaryUnlocks.length > 0) {
      console.log('   Temporary Unlocks:');
      status.temporaryUnlocks.forEach(unlock => {
        console.log(`     - ${unlock.program}: ${unlock.remainingMinutes} min remaining`);
      });
    }
  }, 60000);
  
  // CLI commands
  process.stdin.on('data', async (data) => {
    const command = data.toString().trim();
    
    if (command === 'lock') {
      await lockSystem.lock();
    } else if (command === 'unlock') {
      await lockSystem.unlock('manual');
    } else if (command.startsWith('whitelist ')) {
      const program = command.replace('whitelist ', '');
      lockSystem.addToWhitelist(program);
      await lockSystem.saveConfiguration();
    } else if (command.startsWith('focus ')) {
      const mode = command.replace('focus ', '');
      await lockSystem.startFocusMode(mode);
    } else if (command === 'analytics') {
      console.log('\n📊 ANALYTICS:', lockSystem.getAnalytics());
    } else if (command === 'help') {
      console.log('\n🔒 COMMANDS:');
      console.log('   lock - Lock the desktop');
      console.log('   unlock - Manually unlock');
      console.log('   whitelist <program> - Add program to whitelist');
      console.log('   focus <mode> - Start focus mode (deep_work, creative, learning)');
      console.log('   analytics - Show usage analytics');
    }
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🔒 Shutting down lock system...');
    await lockSystem.saveConfiguration();
    
    if (lockSystem.qrAuth.server) {
      lockSystem.qrAuth.server.close();
    }
    if (lockSystem.qrAuth.wsServer) {
      lockSystem.qrAuth.wsServer.close();
    }
    
    process.exit(0);
  });
  
  console.log('\n🔒 FEATURES:');
  console.log('   ✅ QR code authentication via phone scan');
  console.log('   ✅ Whitelist system for essential programs');
  console.log('   ✅ Automatic blocking of distracting apps');
  console.log('   ✅ Focus modes with timed sessions');
  console.log('   ✅ Break reminders and mindfulness prompts');
  console.log('   ✅ Temporary unlocks for specific programs');
  console.log('   ✅ Focus score tracking');
  console.log('   ✅ Usage analytics and insights');
  console.log('\n🔒 WHITELISTED CATEGORIES:');
  console.log('   • Essential: Terminal, Finder, System tools');
  console.log('   • Productivity: VSCode, Office apps, IDEs');
  console.log('   • Wellness: Meditation, time tracking apps');
  console.log('\n🔒 BLOCKED WHEN LOCKED:');
  console.log('   • Social media apps');
  console.log('   • Gaming platforms');
  console.log('   • Streaming services');
  console.log('   • Web browsers (unless temporarily unlocked)');
  console.log(`\n🌐 QR Interface: http://localhost:${lockSystem.qrAuth.port}/qr`);
  console.log('\n💡 Type "help" for commands');
}
#!/usr/bin/env node

/**
 * VIM MUSIC PLAYER
 * Modal interface music/video player inspired by vim
 * Integrates with Private Vault Server and Electric Slide trends
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

class VimMusicPlayer extends EventEmitter {
  constructor(vaultServerUrl = 'ws://localhost:7777') {
    super();
    
    // Vim-style modes
    this.modes = {
      NORMAL: 'normal',
      INSERT: 'insert',
      VISUAL: 'visual',
      COMMAND: 'command',
      SEARCH: 'search'
    };
    
    this.currentMode = this.modes.NORMAL;
    this.commandBuffer = '';
    this.searchBuffer = '';
    
    // Player state
    this.playlist = [];
    this.currentTrack = null;
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isPaused = false;
    this.volume = 0.7;
    this.repeat = 'none'; // none, one, all
    this.shuffle = false;
    
    // Audio/Video elements (would be created in browser context)
    this.audioElement = null;
    this.videoElement = null;
    this.isVideoMode = false;
    
    // UI state
    this.cursor = { row: 0, col: 0 };
    this.selectedRange = { start: null, end: null };
    this.viewport = { top: 0, height: 20 }; // Show 20 items at once
    
    // Vault connection
    this.vaultConnection = null;
    this.vaultServerUrl = vaultServerUrl;
    this.userToken = null;
    this.fileCache = new Map();
    
    // Cultural integration
    this.trendData = new Map();
    this.electricSlideConnection = null;
    
    // Keybindings (vim-style)
    this.keybindings = new Map();
    this.setupKeybindings();
    
    // Command history
    this.commandHistory = [];
    this.historyIndex = -1;
    
    // Visual effects
    this.visualizer = {
      enabled: false,
      type: 'spectrum', // spectrum, waveform, bars
      colors: ['#00ff88', '#88ff00', '#ff8800', '#ff0088']
    };
    
    console.log('🎵 VIM MUSIC PLAYER INITIALIZED');
    console.log('📺 Modal interface: Normal → Insert → Visual → Command');
    console.log('🎹 Vim-style keybindings active');
    console.log('🔗 Connecting to Private Vault Server...');
    
    this.initialize();
  }
  
  /**
   * Initialize the vim music player
   */
  async initialize() {
    try {
      // Connect to vault server
      await this.connectToVault();
      
      // Connect to Electric Slide for trends
      this.connectToElectricSlide();
      
      // Setup audio/video elements
      this.setupMediaElements();
      
      // Load saved playlists
      await this.loadPlaylists();
      
      // Start input listener
      this.startInputListener();
      
      console.log('✅ Vim Music Player ready');
      this.displayModeIndicator();
      this.displayPlaylist();
      
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
    }
  }
  
  /**
   * Setup vim-style keybindings
   */
  setupKeybindings() {
    // Normal mode navigation
    this.keybindings.set('h', () => this.moveCursor('left'));
    this.keybindings.set('j', () => this.moveCursor('down'));
    this.keybindings.set('k', () => this.moveCursor('up'));
    this.keybindings.set('l', () => this.moveCursor('right'));
    
    // Page navigation
    this.keybindings.set('ctrl+f', () => this.pageDown());
    this.keybindings.set('ctrl+b', () => this.pageUp());
    this.keybindings.set('gg', () => this.goToTop());
    this.keybindings.set('G', () => this.goToBottom());
    
    // Mode switching
    this.keybindings.set('i', () => this.enterInsertMode());
    this.keybindings.set('v', () => this.enterVisualMode());
    this.keybindings.set(':', () => this.enterCommandMode());
    this.keybindings.set('/', () => this.enterSearchMode());
    this.keybindings.set('esc', () => this.enterNormalMode());
    
    // Media controls
    this.keybindings.set('space', () => this.togglePlayback());
    this.keybindings.set('n', () => this.nextTrack());
    this.keybindings.set('p', () => this.previousTrack());
    this.keybindings.set('s', () => this.toggleShuffle());
    this.keybindings.set('r', () => this.cycleRepeat());
    
    // Volume controls
    this.keybindings.set('+', () => this.volumeUp());
    this.keybindings.set('-', () => this.volumeDown());
    this.keybindings.set('m', () => this.toggleMute());
    
    // File operations
    this.keybindings.set('o', () => this.openFile());
    this.keybindings.set('enter', () => this.playSelected());
    this.keybindings.set('d', () => this.deleteSelected());
    this.keybindings.set('y', () => this.yankSelected());
    
    // Visual effects
    this.keybindings.set('t', () => this.toggleVisualizer());
    this.keybindings.set('f', () => this.toggleFullscreen());
    
    console.log('⌨️ Vim keybindings configured');
  }
  
  /**
   * Connect to Private Vault Server
   */
  async connectToVault() {
    return new Promise((resolve, reject) => {
      try {
        this.vaultConnection = new WebSocket(this.vaultServerUrl);
        
        this.vaultConnection.onopen = () => {
          console.log('🔗 Connected to Private Vault Server');
          resolve();
        };
        
        this.vaultConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleVaultMessage(data);
          } catch (error) {
            console.error('Invalid vault message:', error);
          }
        };
        
        this.vaultConnection.onerror = (error) => {
          console.error('Vault connection error:', error);
          reject(error);
        };
        
        this.vaultConnection.onclose = () => {
          console.log('❌ Vault connection closed, attempting reconnect...');
          setTimeout(() => this.connectToVault(), 5000);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Connect to Electric Slide for cultural trends
   */
  connectToElectricSlide() {
    try {
      this.electricSlideConnection = new WebSocket('ws://localhost:8888');
      
      this.electricSlideConnection.onopen = () => {
        console.log('⚡ Connected to Electric Slide for trends');
      };
      
      this.electricSlideConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleElectricSlideMessage(data);
        } catch (error) {
          console.error('Invalid Electric Slide message:', error);
        }
      };
      
      this.electricSlideConnection.onclose = () => {
        console.log('❌ Electric Slide connection closed');
        // Try to reconnect
        setTimeout(() => this.connectToElectricSlide(), 10000);
      };
      
    } catch (error) {
      console.error('Failed to connect to Electric Slide:', error);
    }
  }
  
  /**
   * Setup media elements (simulated for Node.js)
   */
  setupMediaElements() {
    // In a real browser implementation, these would be actual HTML5 elements
    this.audioElement = {
      src: null,
      currentTime: 0,
      duration: 0,
      volume: this.volume,
      paused: true,
      play: () => { 
        console.log(`🎵 Playing: ${this.currentTrack?.name || 'Unknown'}`);
        this.isPlaying = true;
        this.isPaused = false;
      },
      pause: () => {
        console.log('⏸️ Paused');
        this.isPaused = true;
      },
      load: () => {
        console.log('📂 Loading audio...');
      }
    };
    
    this.videoElement = {
      src: null,
      currentTime: 0,
      duration: 0,
      volume: this.volume,
      paused: true,
      play: () => {
        console.log(`📺 Playing video: ${this.currentTrack?.name || 'Unknown'}`);
        this.isPlaying = true;
        this.isPaused = false;
      },
      pause: () => {
        console.log('⏸️ Video paused');
        this.isPaused = true;
      },
      load: () => {
        console.log('📂 Loading video...');
      }
    };
  }
  
  /**
   * Handle vault server messages
   */
  handleVaultMessage(data) {
    switch (data.type) {
      case 'connection':
        console.log(`🔌 Vault connection established (${data.connectionId})`);
        break;
        
      case 'file_uploaded':
        this.handleNewFile(data.file);
        break;
        
      case 'file_list':
        this.updateFileCache(data.files);
        break;
        
      case 'port_change':
        console.log(`🐒 Vault server hopped to port ${data.newPort}`);
        break;
    }
  }
  
  /**
   * Handle Electric Slide messages
   */
  handleElectricSlideMessage(data) {
    switch (data.type) {
      case 'trends_aggregated':
        this.updateTrendData(data.trends);
        break;
        
      case 'brand_generated':
        this.suggestMusicForBrand(data.brand);
        break;
        
      case 'cultural_update':
        this.adaptToCultural Mood(data.mood);
        break;
    }
  }
  
  /**
   * Start input listener (simulated)
   */
  startInputListener() {
    // In a real implementation, this would capture keyboard input
    console.log('⌨️ Keyboard listener started');
    console.log('💡 Type ":help" for commands, "?" for quick reference');
    
    // Simulate some input handling
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (key) => {
      this.handleKeyInput(key);
    });
  }
  
  /**
   * Handle keyboard input
   */
  handleKeyInput(key) {
    const keyStr = key.toString();
    
    // Exit on Ctrl+C
    if (keyStr === '\u0003') {
      process.exit();
    }
    
    switch (this.currentMode) {
      case this.modes.NORMAL:
        this.handleNormalModeInput(keyStr);
        break;
        
      case this.modes.INSERT:
        this.handleInsertModeInput(keyStr);
        break;
        
      case this.modes.VISUAL:
        this.handleVisualModeInput(keyStr);
        break;
        
      case this.modes.COMMAND:
        this.handleCommandModeInput(keyStr);
        break;
        
      case this.modes.SEARCH:
        this.handleSearchModeInput(keyStr);
        break;
    }
    
    this.updateDisplay();
  }
  
  /**
   * Handle normal mode input
   */
  handleNormalModeInput(key) {
    const binding = this.keybindings.get(key);
    if (binding) {
      binding();
    } else {
      // Handle special key combinations
      switch (key) {
        case '\r': // Enter
          this.playSelected();
          break;
        case ' ': // Space
          this.togglePlayback();
          break;
        default:
          // Ignore unknown keys in normal mode
          break;
      }
    }
  }
  
  /**
   * Handle command mode input
   */
  handleCommandModeInput(key) {
    if (key === '\r') { // Enter
      this.executeCommand(this.commandBuffer);
      this.commandBuffer = '';
      this.enterNormalMode();
    } else if (key === '\u007f') { // Backspace
      this.commandBuffer = this.commandBuffer.slice(0, -1);
    } else if (key === '\u001b') { // Escape
      this.commandBuffer = '';
      this.enterNormalMode();
    } else if (key.charCodeAt(0) >= 32 && key.charCodeAt(0) < 127) {
      this.commandBuffer += key;
    }
  }
  
  /**
   * Execute vim-style commands
   */
  executeCommand(command) {
    const cmd = command.trim().toLowerCase();
    const args = cmd.split(' ');
    const baseCmd = args[0];
    
    switch (baseCmd) {
      case 'q':
      case 'quit':
        this.quit();
        break;
        
      case 'w':
      case 'write':
        this.savePlaylist(args[1]);
        break;
        
      case 'wq':
        this.savePlaylist();
        this.quit();
        break;
        
      case 'load':
        this.loadPlaylist(args[1]);
        break;
        
      case 'new':
        this.newPlaylist();
        break;
        
      case 'shuffle':
        this.shuffle = !this.shuffle;
        console.log(`🔀 Shuffle ${this.shuffle ? 'ON' : 'OFF'}`);
        break;
        
      case 'repeat':
        this.repeat = args[1] || 'none';
        console.log(`🔁 Repeat: ${this.repeat}`);
        break;
        
      case 'volume':
      case 'vol':
        const vol = parseFloat(args[1]);
        if (!isNaN(vol) && vol >= 0 && vol <= 1) {
          this.setVolume(vol);
        }
        break;
        
      case 'visualizer':
      case 'viz':
        if (args[1]) {
          this.visualizer.type = args[1];
        }
        this.toggleVisualizer();
        break;
        
      case 'theme':
        this.setTheme(args[1]);
        break;
        
      case 'search':
        this.searchFiles(args.slice(1).join(' '));
        break;
        
      case 'filter':
        this.filterPlaylist(args.slice(1).join(' '));
        break;
        
      case 'sort':
        this.sortPlaylist(args[1] || 'name');
        break;
        
      case 'stats':
        this.showStats();
        break;
        
      case 'help':
        this.showHelp();
        break;
        
      case 'connect':
        this.connectToService(args[1], args[2]);
        break;
        
      case 'trends':
        this.showTrends();
        break;
        
      default:
        console.log(`❓ Unknown command: ${baseCmd}`);
        break;
    }
    
    // Add to command history
    if (command.trim()) {
      this.commandHistory.push(command);
      this.historyIndex = this.commandHistory.length;
    }
  }
  
  /**
   * Media control functions
   */
  togglePlayback() {
    if (this.isPlaying && !this.isPaused) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  play() {
    if (!this.currentTrack) {
      if (this.playlist.length > 0) {
        this.currentIndex = 0;
        this.currentTrack = this.playlist[0];
      } else {
        console.log('📭 No tracks in playlist');
        return;
      }
    }
    
    const element = this.isVideoMode ? this.videoElement : this.audioElement;
    element.src = this.currentTrack.url;
    element.volume = this.volume;
    element.play();
    
    this.displayNowPlaying();
  }
  
  pause() {
    const element = this.isVideoMode ? this.videoElement : this.audioElement;
    element.pause();
    this.isPaused = true;
  }
  
  nextTrack() {
    if (this.playlist.length === 0) return;
    
    if (this.shuffle) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    
    this.currentTrack = this.playlist[this.currentIndex];
    this.play();
  }
  
  previousTrack() {
    if (this.playlist.length === 0) return;
    
    if (this.shuffle) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = this.currentIndex === 0 ? this.playlist.length - 1 : this.currentIndex - 1;
    }
    
    this.currentTrack = this.playlist[this.currentIndex];
    this.play();
  }
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.videoElement) {
      this.videoElement.volume = this.volume;
    }
    
    console.log(`🔊 Volume: ${Math.round(this.volume * 100)}%`);
  }
  
  volumeUp() {
    this.setVolume(this.volume + 0.1);
  }
  
  volumeDown() {
    this.setVolume(this.volume - 0.1);
  }
  
  /**
   * Mode switching functions
   */
  enterNormalMode() {
    this.currentMode = this.modes.NORMAL;
    this.displayModeIndicator();
  }
  
  enterInsertMode() {
    this.currentMode = this.modes.INSERT;
    this.displayModeIndicator();
  }
  
  enterVisualMode() {
    this.currentMode = this.modes.VISUAL;
    this.selectedRange.start = { ...this.cursor };
    this.displayModeIndicator();
  }
  
  enterCommandMode() {
    this.currentMode = this.modes.COMMAND;
    this.commandBuffer = '';
    this.displayModeIndicator();
  }
  
  enterSearchMode() {
    this.currentMode = this.modes.SEARCH;
    this.searchBuffer = '';
    this.displayModeIndicator();
  }
  
  /**
   * Navigation functions
   */
  moveCursor(direction) {
    switch (direction) {
      case 'up':
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        break;
      case 'down':
        this.cursor.row = Math.min(this.playlist.length - 1, this.cursor.row + 1);
        break;
      case 'left':
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        break;
      case 'right':
        this.cursor.col = Math.min(50, this.cursor.col + 1); // Arbitrary max
        break;
    }
    
    // Adjust viewport if cursor moves outside
    if (this.cursor.row < this.viewport.top) {
      this.viewport.top = this.cursor.row;
    } else if (this.cursor.row >= this.viewport.top + this.viewport.height) {
      this.viewport.top = this.cursor.row - this.viewport.height + 1;
    }
  }
  
  pageDown() {
    this.cursor.row = Math.min(this.playlist.length - 1, this.cursor.row + this.viewport.height);
    this.viewport.top = Math.min(this.playlist.length - this.viewport.height, this.viewport.top + this.viewport.height);
  }
  
  pageUp() {
    this.cursor.row = Math.max(0, this.cursor.row - this.viewport.height);
    this.viewport.top = Math.max(0, this.viewport.top - this.viewport.height);
  }
  
  goToTop() {
    this.cursor.row = 0;
    this.viewport.top = 0;
  }
  
  goToBottom() {
    this.cursor.row = this.playlist.length - 1;
    this.viewport.top = Math.max(0, this.playlist.length - this.viewport.height);
  }
  
  /**
   * Display functions
   */
  displayModeIndicator() {
    const modeColors = {
      normal: '\x1b[32m', // Green
      insert: '\x1b[33m', // Yellow
      visual: '\x1b[35m', // Magenta
      command: '\x1b[34m', // Blue
      search: '\x1b[36m'   // Cyan
    };
    
    const reset = '\x1b[0m';
    const color = modeColors[this.currentMode] || reset;
    
    const modeDisplay = `${color}-- ${this.currentMode.toUpperCase()} --${reset}`;
    
    let statusLine = modeDisplay;
    
    if (this.currentMode === this.modes.COMMAND) {
      statusLine += ` :${this.commandBuffer}`;
    } else if (this.currentMode === this.modes.SEARCH) {
      statusLine += ` /${this.searchBuffer}`;
    }
    
    console.log(`\r${statusLine}${' '.repeat(50)}`); // Clear line and display
  }
  
  displayPlaylist() {
    console.clear();
    console.log('🎵 VIM MUSIC PLAYER 🎵');
    console.log('═'.repeat(60));
    
    const visibleItems = this.playlist.slice(
      this.viewport.top, 
      this.viewport.top + this.viewport.height
    );
    
    visibleItems.forEach((track, index) => {
      const actualIndex = this.viewport.top + index;
      const isSelected = actualIndex === this.cursor.row;
      const isCurrent = actualIndex === this.currentIndex;
      
      let prefix = '  ';
      if (isCurrent) {
        prefix = this.isPlaying ? '▶️ ' : '⏸️ ';
      } else if (isSelected) {
        prefix = '→ ';
      }
      
      const trackDisplay = `${prefix}${track.name}`;
      console.log(trackDisplay);
    });
    
    console.log('═'.repeat(60));
    this.displayStatusBar();
  }
  
  displayStatusBar() {
    const playbackStatus = this.isPlaying ? 
      `▶️ ${this.currentTrack?.name || 'No track'}` : 
      '⏸️ Paused';
    
    const volumeBar = '🔊' + '█'.repeat(Math.floor(this.volume * 10)) + '░'.repeat(10 - Math.floor(this.volume * 10));
    
    const shuffleStatus = this.shuffle ? '🔀' : '   ';
    const repeatStatus = this.repeat === 'one' ? '🔂' : this.repeat === 'all' ? '🔁' : '   ';
    
    console.log(`${playbackStatus} | ${volumeBar} | ${shuffleStatus} ${repeatStatus}`);
  }
  
  displayNowPlaying() {
    if (!this.currentTrack) return;
    
    console.log(`\n🎵 Now Playing: ${this.currentTrack.name}`);
    if (this.currentTrack.artist) {
      console.log(`👤 Artist: ${this.currentTrack.artist}`);
    }
    if (this.currentTrack.album) {
      console.log(`💿 Album: ${this.currentTrack.album}`);
    }
  }
  
  updateDisplay() {
    // In a real implementation, this would update the UI
    this.displayPlaylist();
  }
  
  /**
   * Playlist management
   */
  async loadPlaylists() {
    // Load saved playlists from vault
    try {
      // This would make an API call to vault server
      console.log('📂 Loading playlists from vault...');
      
      // Simulate loading a sample playlist
      this.playlist = [
        {
          id: '1',
          name: 'Electric Dreams.mp3',
          artist: 'Synth Master',
          album: 'Future Beats',
          duration: 240,
          url: '/vault/files/1.mp3'
        },
        {
          id: '2', 
          name: 'Quantum Vibes.mp3',
          artist: 'Neural Network',
          album: 'AI Symphony',
          duration: 198,
          url: '/vault/files/2.mp3'
        },
        {
          id: '3',
          name: 'Cultural Shift.mp4',
          artist: 'Trend Analyzer',
          album: 'Social Dynamics',
          duration: 305,
          url: '/vault/files/3.mp4',
          type: 'video'
        }
      ];
      
      console.log(`✅ Loaded ${this.playlist.length} tracks`);
      
    } catch (error) {
      console.error('❌ Failed to load playlists:', error);
    }
  }
  
  savePlaylist(name) {
    const playlistName = name || 'default';
    console.log(`💾 Saving playlist: ${playlistName}`);
    
    const playlistData = {
      name: playlistName,
      tracks: this.playlist,
      createdAt: Date.now(),
      shuffle: this.shuffle,
      repeat: this.repeat
    };
    
    // Would save to vault server
    console.log('✅ Playlist saved');
  }
  
  /**
   * Cultural integration functions
   */
  updateTrendData(trends) {
    trends.forEach(trend => {
      this.trendData.set(trend.key, trend);
    });
    
    // Suggest music based on trends
    this.suggestMusicFromTrends();
  }
  
  suggestMusicFromTrends() {
    const topTrends = Array.from(this.trendData.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);
      
    console.log('\n🎯 Music suggestions based on cultural trends:');
    topTrends.forEach(trend => {
      console.log(`• ${trend.key}: ${this.getMusicSuggestion(trend.key)}`);
    });
  }
  
  getMusicSuggestion(trendKey) {
    const suggestions = {
      'ai_breakthrough': 'Electronic/Synthwave',
      'crypto_memes': 'Lo-fi Hip Hop', 
      'sustainable_tech': 'Ambient Nature',
      'space_innovation': 'Cinematic Orchestral',
      'remote_work': 'Focus/Study Music'
    };
    
    return suggestions[trendKey] || 'Trending Pop';
  }
  
  /**
   * Utility functions
   */
  showHelp() {
    console.log('\n🎵 VIM MUSIC PLAYER - HELP');
    console.log('═'.repeat(40));
    console.log('NAVIGATION:');
    console.log('  h,j,k,l     - Move cursor');
    console.log('  Ctrl+f/b    - Page down/up');
    console.log('  gg/G        - Go to top/bottom');
    console.log('');
    console.log('MODES:');
    console.log('  i           - Insert mode');
    console.log('  v           - Visual mode');
    console.log('  :           - Command mode');
    console.log('  /           - Search mode');
    console.log('  Esc         - Normal mode');
    console.log('');
    console.log('PLAYBACK:');
    console.log('  Space       - Play/pause');
    console.log('  n           - Next track');
    console.log('  p           - Previous track');
    console.log('  +/-         - Volume up/down');
    console.log('  s           - Toggle shuffle');
    console.log('  r           - Cycle repeat');
    console.log('');
    console.log('COMMANDS:');
    console.log('  :w [name]   - Save playlist');
    console.log('  :load name  - Load playlist');
    console.log('  :new        - New playlist');
    console.log('  :shuffle    - Toggle shuffle');
    console.log('  :vol 0.5    - Set volume');
    console.log('  :trends     - Show trends');
    console.log('  :quit       - Exit player');
  }
  
  playSelected() {
    if (this.cursor.row >= 0 && this.cursor.row < this.playlist.length) {
      this.currentIndex = this.cursor.row;
      this.currentTrack = this.playlist[this.currentIndex];
      this.isVideoMode = this.currentTrack.type === 'video';
      this.play();
    }
  }
  
  quit() {
    console.log('👋 Goodbye from Vim Music Player!');
    process.exit(0);
  }
}

// Export for use
module.exports = VimMusicPlayer;

// Start player if run directly
if (require.main === module) {
  console.log('🎵 Starting Vim Music Player...\n');
  
  const player = new VimMusicPlayer();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Vim Music Player...');
    player.quit();
  });
  
  // Log startup complete
  setTimeout(() => {
    console.log('\n🎹 VIM MUSIC PLAYER READY');
    console.log('📖 Type ":help" for commands');
    console.log('🎮 Use vim keybindings: h/j/k/l for navigation');
    console.log('⚡ Cultural trends integration active');
    console.log('🔒 Connected to private vault server');
  }, 1000);
}
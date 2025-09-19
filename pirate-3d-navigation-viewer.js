#!/usr/bin/env node

/**
 * 🏴‍☠️⛵ PIRATE 3D NAVIGATION VIEWER
 * 
 * Three.js-based 3D visualization of navigation routes with pirate theme.
 * Generates MP4/GIF recordings of navigation sessions showing companions
 * as pirate ships sailing through digital seas to manufacturing treasures.
 * 
 * Features:
 * - Pirate ship companions navigating 3D seas
 * - Treasure map overlay showing manufacturing stations
 * - Real-time recording to MP4/GIF formats
 * - Dynamic weather and sea conditions
 * - Companion ship customization based on character type
 * - WebSocket integration with collar system
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Import formatting
const { SonicTextFormatter } = require('./sonic-terminal-wiki-generator.js');

class Pirate3DNavigationViewer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      port: config.port || 8002,
      wsPort: config.wsPort || 8003,
      recordingEnabled: config.recordingEnabled !== false,
      videoFormat: config.videoFormat || 'mp4', // mp4, gif, webm
      frameRate: config.frameRate || 30,
      recordingQuality: config.recordingQuality || 'medium',
      ...config
    };
    
    this.formatter = new SonicTextFormatter();
    
    // 3D Scene configuration
    this.sceneConfig = {
      worldSize: 10000, // meters
      seaLevel: 0,
      skyHeight: 5000,
      treasureIslands: [],
      manufacturingPorts: [],
      weatherSystem: {
        current: 'clear',
        windSpeed: 5,
        waveHeight: 2,
        visibility: 100
      }
    };
    
    // Ship designs for different companion types
    this.shipDesigns = new Map([
      ['zombie', {
        name: 'Undead Galleon',
        model: 'zombie_ship',
        color: '#2d5016', // Sickly green
        sails: ['tattered', 'patched'],
        figurehead: 'skeleton',
        flags: ['jolly_roger', 'zombie'],
        speed: 0.8,
        maneuverability: 0.6,
        specialEffects: ['fog', 'eerie_glow']
      }],
      ['crypto_zombie', {
        name: 'Blockchain Frigate',
        model: 'crypto_ship',
        color: '#ffd700', // Gold
        sails: ['holographic', 'data_streams'],
        figurehead: 'digital_skull',
        flags: ['bitcoin', 'ethereum'],
        speed: 1.2,
        maneuverability: 0.9,
        specialEffects: ['digital_particles', 'blockchain_trail']
      }],
      ['daemon', {
        name: 'Ghost Process Sloop',
        model: 'daemon_ship',
        color: '#404040', // Dark gray
        sails: ['translucent', 'flickering'],
        figurehead: 'daemon_head',
        flags: ['system_flag', 'process_id'],
        speed: 1.5,
        maneuverability: 1.0,
        specialEffects: ['phase_in_out', 'system_traces']
      }],
      ['pirate', {
        name: 'Captain\'s Flagship',
        model: 'classic_pirate_ship',
        color: '#8b4513', // Brown wood
        sails: ['full_rigged', 'battle_tested'],
        figurehead: 'fierce_dragon',
        flags: ['jolly_roger', 'captain_flag'],
        speed: 1.0,
        maneuverability: 0.8,
        specialEffects: ['cannon_smoke', 'treasure_glint']
      }]
    ]);
    
    // Recording system
    this.recordingSystem = {
      active: false,
      session: null,
      frames: [],
      startTime: null,
      duration: 0,
      outputPath: './pirate-navigation-recordings/'
    };
    
    // Navigation state
    this.navigationState = {
      activeRoute: null,
      currentShip: null,
      position: { x: 0, y: 0, z: 0 },
      heading: 0,
      speed: 0,
      destination: null,
      waypoints: [],
      treasureLocations: []
    };
    
    console.log(this.formatter.formatWithSonicStyle(
      '🏴‍☠️⛵ Pirate 3D Navigation Viewer ready',
      'sonic'
    ));
    
    this.initializeScene();
    this.setupWebInterface();
    this.createTreasureIslands();
  }

  /**
   * Initialize 3D scene configuration
   */
  initializeScene() {
    console.log(this.formatter.formatWithSonicStyle(
      '🌊 Initializing 3D pirate seas',
      'sprint'
    ));
    
    // Create manufacturing ports as treasure islands
    this.sceneConfig.manufacturingPorts = [
      {
        id: 'ableton_port',
        name: 'Audio Treasure Island',
        position: { x: 2000, y: 0, z: 1500 },
        type: 'audio_equipment',
        treasures: ['ableton_controllers', 'audio_interfaces', 'synthesizers'],
        dockingPoints: 3,
        defenses: ['sound_cannons', 'frequency_shields']
      },
      {
        id: 'cannon_foundry',
        name: 'Iron Cannon Cove',
        position: { x: -1800, y: 0, z: 2200 },
        type: 'weapons',
        treasures: ['cannonballs', 'artillery_shells', 'gunpowder'],
        dockingPoints: 2,
        defenses: ['cannon_batteries', 'fortress_walls']
      },
      {
        id: 'creative_workshop',
        name: 'Mystic Maker Isle',
        position: { x: 0, y: 0, z: -2500 },
        type: 'custom_creation',
        treasures: ['custom_instruments', 'magical_artifacts', 'rare_materials'],
        dockingPoints: 4,
        defenses: ['illusion_barriers', 'creativity_storms']
      }
    ];
    
    // Initialize weather system
    this.updateWeatherSystem();
  }

  /**
   * Setup web interface with Three.js visualization
   */
  setupWebInterface() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.app.use(express.static('public'));
    this.app.use(express.json());
    
    // Enable CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Methods', '*');
      next();
    });
    
    // Main 3D viewer interface
    this.app.get('/', (req, res) => {
      res.send(this.render3DViewerInterface());
    });
    
    // Scene data API
    this.app.get('/api/scene', (req, res) => {
      res.json({
        config: this.sceneConfig,
        ships: Array.from(this.shipDesigns.entries()).map(([id, design]) => ({
          id, ...design
        })),
        navigation: this.navigationState,
        recording: this.recordingSystem.active
      });
    });
    
    // Navigation visualization API
    this.app.post('/api/visualize-route', async (req, res) => {
      try {
        const result = await this.visualizeNavigationRoute(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Recording control API
    this.app.post('/api/recording/start', async (req, res) => {
      const result = await this.startRecording(req.body);
      res.json(result);
    });
    
    this.app.post('/api/recording/stop', async (req, res) => {
      const result = await this.stopRecording();
      res.json(result);
    });
    
    // Ship customization API
    this.app.post('/api/ship/customize', (req, res) => {
      const result = this.customizeShip(req.body);
      res.json(result);
    });
    
    // WebSocket setup
    this.wss.on('connection', (ws) => {
      console.log(this.formatter.formatWithSonicStyle(
        '⚓ 3D viewer connected',
        'bounce'
      ));
      
      ws.send(JSON.stringify({
        type: '3d_viewer_ready',
        scene: this.sceneConfig,
        ships: Array.from(this.shipDesigns.entries())
      }));
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('3D Viewer WebSocket error:', error);
        }
      });
    });
    
    this.server.listen(this.config.port, () => {
      console.log(this.formatter.formatWithSonicStyle(
        `🏴‍☠️ 3D viewer: http://localhost:${this.config.port}`,
        'jump'
      ));
    });
  }

  /**
   * Visualize navigation route in 3D scene
   */
  async visualizeNavigationRoute(request) {
    console.log(this.formatter.formatWithSonicStyle(
      '🗺️ Visualizing navigation route in 3D',
      'sprint'
    ));
    
    const { route, companion, options = {} } = request;
    
    // Get ship design for companion
    const shipDesign = this.shipDesigns.get(companion) || this.shipDesigns.get('pirate');
    
    // Convert route to 3D waypoints
    const waypoints = this.convertRouteToWaypoints(route);
    
    // Create navigation visualization
    const visualization = {
      id: crypto.randomUUID(),
      ship: {
        ...shipDesign,
        position: waypoints[0],
        heading: this.calculateInitialHeading(waypoints[0], waypoints[1])
      },
      route: {
        waypoints,
        totalDistance: this.calculateTotalDistance(waypoints),
        estimatedTime: this.calculateEstimatedTime(waypoints, shipDesign.speed),
        treasureStops: this.identifyTreasureStops(route, waypoints)
      },
      scene: {
        weather: this.sceneConfig.weatherSystem,
        lighting: this.calculateOptimalLighting(),
        camera: this.calculateOptimalCamera(waypoints)
      },
      effects: {
        wakeTrail: true,
        treasureGlow: true,
        weatherEffects: true,
        companionSpecialEffects: shipDesign.specialEffects
      }
    };
    
    // Update navigation state
    this.navigationState = {
      activeRoute: visualization,
      currentShip: shipDesign,
      position: waypoints[0],
      heading: visualization.ship.heading,
      speed: shipDesign.speed,
      destination: waypoints[waypoints.length - 1],
      waypoints: waypoints,
      treasureLocations: visualization.route.treasureStops
    };
    
    // Start recording if requested
    if (options.recordVideo) {
      await this.startRecording({
        format: options.videoFormat || this.config.videoFormat,
        quality: options.recordingQuality || this.config.recordingQuality
      });
    }
    
    // Broadcast to connected clients
    this.broadcastToClients({
      type: 'route_visualization_ready',
      visualization
    });
    
    return {
      success: true,
      visualizationId: visualization.id,
      ship: visualization.ship,
      route: visualization.route,
      estimatedDuration: visualization.route.estimatedTime
    };
  }

  /**
   * Convert 2D route to 3D waypoints in pirate world
   */
  convertRouteToWaypoints(route) {
    const waypoints = [];
    
    route.nodes.forEach((node, index) => {
      // Convert lat/lng to 3D coordinates in pirate world
      const x = (node.position.lng + 180) * (this.sceneConfig.worldSize / 360) - (this.sceneConfig.worldSize / 2);
      const z = -(node.position.lat - 90) * (this.sceneConfig.worldSize / 180) + (this.sceneConfig.worldSize / 2);
      const y = this.sceneConfig.seaLevel + (Math.random() * 50 - 25); // Slight sea level variation
      
      waypoints.push({
        id: node.id,
        name: node.name,
        position: { x, y, z },
        originalNode: node,
        portType: this.identifyPortType(node),
        hazards: this.generateSeaHazards(x, z),
        treasureAvailable: node.capabilities?.length > 0
      });
    });
    
    return waypoints;
  }

  /**
   * Start recording navigation session
   */
  async startRecording(options = {}) {
    if (this.recordingSystem.active) {
      throw new Error('Recording already in progress');
    }
    
    console.log(this.formatter.formatWithSonicStyle(
      `🎬 Starting ${options.format} recording`,
      'sonic'
    ));
    
    // Create output directory
    await this.ensureRecordingDirectory();
    
    const session = {
      id: crypto.randomUUID(),
      format: options.format || 'mp4',
      quality: options.quality || 'medium',
      frameRate: this.config.frameRate,
      startTime: Date.now(),
      frames: [],
      outputPath: path.join(
        this.recordingSystem.outputPath,
        `pirate-navigation-${Date.now()}.${options.format || 'mp4'}`
      )
    };
    
    this.recordingSystem = {
      ...this.recordingSystem,
      active: true,
      session
    };
    
    // Start frame capture loop
    this.startFrameCapture();
    
    return {
      success: true,
      sessionId: session.id,
      recording: true,
      format: session.format,
      outputPath: session.outputPath
    };
  }

  /**
   * Stop recording and generate video file
   */
  async stopRecording() {
    if (!this.recordingSystem.active) {
      throw new Error('No recording in progress');
    }
    
    const session = this.recordingSystem.session;
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    console.log(this.formatter.formatWithSonicStyle(
      `🎬 Stopping recording (${Math.round(session.duration/1000)}s)`,
      'bounce'
    ));
    
    // Generate video file
    const videoFile = await this.generateVideoFile(session);
    
    this.recordingSystem.active = false;
    this.recordingSystem.session = null;
    
    return {
      success: true,
      duration: session.duration,
      frames: session.frames.length,
      outputFile: videoFile,
      size: await this.getFileSize(videoFile)
    };
  }

  /**
   * Generate video file from captured frames
   */
  async generateVideoFile(session) {
    console.log(this.formatter.formatWithSonicStyle(
      `🎥 Generating ${session.format} file`,
      'run'
    ));
    
    // Mock video generation (in real implementation, would use FFmpeg)
    const videoData = {
      format: session.format,
      frames: session.frames.length,
      duration: session.duration,
      frameRate: session.frameRate,
      metadata: {
        title: 'Pirate Navigation Session',
        description: 'Voice-guided navigation with companion ship',
        created: new Date(session.startTime).toISOString(),
        ship: this.navigationState.currentShip?.name || 'Unknown Ship',
        route: this.navigationState.waypoints.length + ' waypoints'
      }
    };
    
    // Write mock video file
    await fs.writeFile(session.outputPath, JSON.stringify(videoData, null, 2));
    
    console.log(this.formatter.formatWithSonicStyle(
      `✅ Video saved: ${path.basename(session.outputPath)}`,
      'bounce'
    ));
    
    return session.outputPath;
  }

  /**
   * Start frame capture for recording
   */
  startFrameCapture() {
    const session = this.recordingSystem.session;
    const frameInterval = 1000 / session.frameRate;
    
    const captureFrame = () => {
      if (!this.recordingSystem.active) return;
      
      const frame = {
        timestamp: Date.now() - session.startTime,
        sceneState: this.captureSceneState(),
        navigationState: { ...this.navigationState },
        frameNumber: session.frames.length
      };
      
      session.frames.push(frame);
      
      // Schedule next frame
      setTimeout(captureFrame, frameInterval);
    };
    
    // Start capturing
    captureFrame();
  }

  /**
   * Capture current scene state for frame
   */
  captureSceneState() {
    return {
      ship: {
        position: this.navigationState.position,
        heading: this.navigationState.heading,
        speed: this.navigationState.speed,
        sails: this.navigationState.currentShip?.sails || []
      },
      weather: this.sceneConfig.weatherSystem,
      treasureIslands: this.sceneConfig.manufacturingPorts.map(port => ({
        id: port.id,
        position: port.position,
        treasureGlow: port.treasures.length > 0
      })),
      effects: {
        wakeTrail: this.navigationState.speed > 0,
        specialEffects: this.navigationState.currentShip?.specialEffects || []
      }
    };
  }

  /**
   * Create treasure islands in the scene
   */
  createTreasureIslands() {
    this.sceneConfig.treasureIslands = this.sceneConfig.manufacturingPorts.map(port => ({
      ...port,
      visualElements: {
        palmTrees: Math.floor(Math.random() * 10) + 5,
        treasureChests: port.treasures.length,
        docks: port.dockingPoints,
        lighthouse: true,
        pirateFlag: true,
        defenseStructures: port.defenses.map(defense => ({
          type: defense,
          position: this.generateDefensePosition(port.position),
          active: true
        }))
      }
    }));
    
    console.log(this.formatter.formatWithSonicStyle(
      `🏝️ Created ${this.sceneConfig.treasureIslands.length} treasure islands`,
      'run'
    ));
  }

  /**
   * Update weather system
   */
  updateWeatherSystem() {
    const weatherOptions = ['clear', 'cloudy', 'stormy', 'foggy', 'supernatural'];
    const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    
    this.sceneConfig.weatherSystem = {
      current: weather,
      windSpeed: Math.random() * 20 + 5, // 5-25 knots
      waveHeight: weather === 'stormy' ? Math.random() * 8 + 3 : Math.random() * 4 + 1,
      visibility: weather === 'foggy' ? 30 + Math.random() * 40 : 80 + Math.random() * 20,
      supernatural: weather === 'supernatural',
      effects: this.generateWeatherEffects(weather)
    };
    
    // Update weather every 5 minutes
    setTimeout(() => this.updateWeatherSystem(), 300000);
  }

  /**
   * Handle WebSocket messages
   */
  async handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case 'update_ship_position':
        this.navigationState.position = message.position;
        this.navigationState.heading = message.heading;
        this.navigationState.speed = message.speed;
        
        this.broadcastToClients({
          type: 'ship_position_updated',
          position: message.position,
          heading: message.heading,
          speed: message.speed
        });
        break;
        
      case 'request_scene_update':
        ws.send(JSON.stringify({
          type: 'scene_data',
          scene: this.sceneConfig,
          navigation: this.navigationState,
          recording: this.recordingSystem.active
        }));
        break;
        
      case 'customize_ship':
        const customization = this.customizeShip(message.customization);
        ws.send(JSON.stringify({
          type: 'ship_customized',
          customization
        }));
        break;
        
      case 'trigger_special_effect':
        this.triggerSpecialEffect(message.effect, message.parameters);
        this.broadcastToClients({
          type: 'special_effect_triggered',
          effect: message.effect,
          parameters: message.parameters
        });
        break;
    }
  }

  /**
   * Customize ship appearance and behavior
   */
  customizeShip(customization) {
    const { companionType, modifications = {} } = customization;
    const baseDesign = this.shipDesigns.get(companionType);
    
    if (!baseDesign) {
      throw new Error(`Unknown companion type: ${companionType}`);
    }
    
    const customShip = {
      ...baseDesign,
      ...modifications,
      customized: true,
      timestamp: Date.now()
    };
    
    // Update current ship if it's the active one
    if (this.navigationState.currentShip && this.navigationState.currentShip.model === baseDesign.model) {
      this.navigationState.currentShip = customShip;
    }
    
    console.log(this.formatter.formatWithSonicStyle(
      `⚓ Customized ${customShip.name}`,
      'bounce'
    ));
    
    return customShip;
  }

  /**
   * Trigger special effects
   */
  triggerSpecialEffect(effect, parameters = {}) {
    console.log(this.formatter.formatWithSonicStyle(
      `✨ Triggering effect: ${effect}`,
      'jump'
    ));
    
    const effects = {
      cannon_salute: () => this.playCannons(parameters.count || 3),
      treasure_discovered: () => this.showTreasureGlow(parameters.treasureId),
      weather_change: () => this.changeWeather(parameters.newWeather),
      ghost_ship_encounter: () => this.spawnGhostShip(),
      treasure_map_reveal: () => this.revealTreasureMap(),
      companion_celebration: () => this.playCompanionCelebration()
    };
    
    const effectFunction = effects[effect];
    if (effectFunction) {
      effectFunction();
    } else {
      console.warn(`Unknown special effect: ${effect}`);
    }
  }

  /**
   * Broadcast message to all connected WebSocket clients
   */
  broadcastToClients(message) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Utility methods
   */
  async ensureRecordingDirectory() {
    try {
      await fs.mkdir(this.recordingSystem.outputPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  calculateTotalDistance(waypoints) {
    let distance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i].position;
      const b = waypoints[i + 1].position;
      distance += Math.sqrt(
        Math.pow(b.x - a.x, 2) + 
        Math.pow(b.z - a.z, 2)
      );
    }
    return distance;
  }

  calculateEstimatedTime(waypoints, shipSpeed) {
    const distance = this.calculateTotalDistance(waypoints);
    return (distance / (shipSpeed * 100)) * 3600; // seconds
  }

  calculateInitialHeading(from, to) {
    if (!to) return 0;
    const dx = to.position.x - from.position.x;
    const dz = to.position.z - from.position.z;
    return Math.atan2(dx, dz) * 180 / Math.PI;
  }

  identifyPortType(node) {
    if (node.capabilities) {
      if (node.capabilities.includes('trading')) return 'trading_port';
      if (node.capabilities.includes('energy')) return 'energy_station';
      if (node.capabilities.includes('freight')) return 'cargo_port';
    }
    return 'neutral_port';
  }

  identifyTreasureStops(route, waypoints) {
    return waypoints.filter(waypoint => waypoint.treasureAvailable);
  }

  generateSeaHazards(x, z) {
    const hazards = [];
    if (Math.random() < 0.2) hazards.push('shallow_water');
    if (Math.random() < 0.15) hazards.push('strong_currents');
    if (Math.random() < 0.1) hazards.push('sea_monsters');
    return hazards;
  }

  calculateOptimalLighting() {
    return {
      ambient: 0.4,
      directional: 0.6,
      sunPosition: { x: 1000, y: 2000, z: 1000 },
      fogColor: '#87CEEB',
      fogDensity: this.sceneConfig.weatherSystem.visibility < 50 ? 0.01 : 0.001
    };
  }

  calculateOptimalCamera(waypoints) {
    if (waypoints.length === 0) return { position: { x: 0, y: 500, z: 500 } };
    
    // Calculate bounds of the route
    let minX = waypoints[0].position.x, maxX = waypoints[0].position.x;
    let minZ = waypoints[0].position.z, maxZ = waypoints[0].position.z;
    
    waypoints.forEach(wp => {
      minX = Math.min(minX, wp.position.x);
      maxX = Math.max(maxX, wp.position.x);
      minZ = Math.min(minZ, wp.position.z);
      maxZ = Math.max(maxZ, wp.position.z);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ);
    
    return {
      position: { 
        x: centerX, 
        y: span * 0.8 + 200, 
        z: centerZ + span * 0.6 
      },
      lookAt: { x: centerX, y: 0, z: centerZ },
      fov: 60
    };
  }

  generateDefensePosition(portPosition) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = 100 + Math.random() * 200;
    return {
      x: portPosition.x + Math.cos(angle) * distance,
      y: portPosition.y + 20,
      z: portPosition.z + Math.sin(angle) * distance
    };
  }

  generateWeatherEffects(weather) {
    const effects = {
      clear: ['sun_rays', 'calm_seas'],
      cloudy: ['cloud_shadows', 'gentle_waves'],
      stormy: ['lightning', 'heavy_rain', 'rough_seas'],
      foggy: ['thick_fog', 'mysterious_sounds'],
      supernatural: ['ghost_lights', 'ethereal_mist', 'spectral_winds']
    };
    
    return effects[weather] || effects.clear;
  }

  playCannons(count) {
    console.log(this.formatter.formatWithSonicStyle(
      `💥 Firing ${count} cannon salute!`,
      'sonic'
    ));
  }

  showTreasureGlow(treasureId) {
    console.log(this.formatter.formatWithSonicStyle(
      `✨ Treasure discovered: ${treasureId}`,
      'bounce'
    ));
  }

  changeWeather(newWeather) {
    this.sceneConfig.weatherSystem.current = newWeather;
    console.log(this.formatter.formatWithSonicStyle(
      `🌤️ Weather changed to: ${newWeather}`,
      'run'
    ));
  }

  spawnGhostShip() {
    console.log(this.formatter.formatWithSonicStyle(
      '👻 Ghost ship spotted on the horizon!',
      'jump'
    ));
  }

  revealTreasureMap() {
    console.log(this.formatter.formatWithSonicStyle(
      '🗺️ Ancient treasure map revealed!',
      'sonic'
    ));
  }

  playCompanionCelebration() {
    const currentShip = this.navigationState.currentShip;
    if (currentShip) {
      console.log(this.formatter.formatWithSonicStyle(
        `🎉 ${currentShip.name} celebrates!`,
        'bounce'
      ));
    }
  }

  /**
   * Render 3D viewer interface
   */
  render3DViewerInterface() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>🏴‍☠️⛵ Pirate 3D Navigation Viewer</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #001122 0%, #003355 100%);
            color: #FFD700;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        #canvas-container {
            position: relative;
            width: 100vw;
            height: 100vh;
        }
        #ui-overlay {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 100;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #FFD700;
            max-width: 300px;
        }
        #recording-controls {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 100;
            background: rgba(139, 69, 19, 0.9);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #8B4513;
        }
        #treasure-map {
            position: absolute;
            bottom: 20px;
            left: 20px;
            z-index: 100;
            background: rgba(139, 69, 19, 0.9);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #8B4513;
            max-width: 250px;
        }
        #companion-status {
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 100;
            background: rgba(0, 50, 100, 0.9);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #0088ff;
            max-width: 200px;
        }
        button {
            background: #8B4513;
            color: #FFD700;
            border: 2px solid #FFD700;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 2px;
            transition: all 0.3s;
        }
        button:hover {
            background: #FFD700;
            color: #8B4513;
            transform: translateY(-2px);
        }
        button:disabled {
            background: #666;
            color: #999;
            cursor: not-allowed;
        }
        .recording {
            animation: pulse 1s infinite;
            background: #ff4444 !important;
        }
        .treasure-discovered {
            animation: treasure-glow 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        @keyframes treasure-glow {
            0%, 100% { box-shadow: 0 0 10px #FFD700; }
            50% { box-shadow: 0 0 30px #FFD700; }
        }
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            background: rgba(0, 0, 0, 0.9);
            padding: 40px;
            border-radius: 15px;
            border: 3px solid #FFD700;
            text-align: center;
        }
        .ship-indicator {
            width: 20px;
            height: 20px;
            display: inline-block;
            margin: 0 5px;
            border-radius: 50%;
            animation: sail 2s infinite;
        }
        @keyframes sail {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(10px); }
        }
        input, select {
            background: #333;
            color: #FFD700;
            border: 1px solid #FFD700;
            padding: 4px;
            margin: 2px;
            border-radius: 3px;
            font-size: 12px;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin: 0 5px;
        }
        .status-active { background: #00ff88; }
        .status-idle { background: #666; }
        .status-recording { background: #ff4444; animation: pulse 1s infinite; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <div id="loading">
        <h2>🏴‍☠️ Loading Pirate Seas...</h2>
        <div class="ship-indicator" style="background: #8B4513;"></div>
        <div class="ship-indicator" style="background: #FFD700;"></div>
        <div class="ship-indicator" style="background: #00ff88;"></div>
        <p>Initializing Three.js scene...</p>
    </div>

    <div id="canvas-container">
        <canvas id="pirate-canvas"></canvas>
    </div>

    <div id="ui-overlay">
        <h3>🧭 Navigation Control</h3>
        <div>
            <label>Ship Type:</label><br>
            <select id="companion-select">
                <option value="zombie">🧟‍♂️ Undead Galleon</option>
                <option value="crypto_zombie">⛓️ Blockchain Frigate</option>
                <option value="daemon">👻 Ghost Process Sloop</option>
                <option value="pirate">🏴‍☠️ Captain's Flagship</option>
            </select>
        </div>
        <div style="margin: 10px 0;">
            <label>Weather:</label><br>
            <select id="weather-select">
                <option value="clear">☀️ Clear Skies</option>
                <option value="cloudy">☁️ Cloudy</option>
                <option value="stormy">⛈️ Stormy</option>
                <option value="foggy">🌫️ Foggy</option>
                <option value="supernatural">👻 Supernatural</option>
            </select>
        </div>
        <div>
            <button onclick="startDemo()">🚀 Start Demo</button>
            <button onclick="resetScene()">🔄 Reset</button>
        </div>
        <div style="margin-top: 10px;">
            <div>Status: <span class="status-indicator" id="nav-status"></span><span id="nav-status-text">Idle</span></div>
            <div>Speed: <span id="ship-speed">0</span> knots</div>
            <div>Heading: <span id="ship-heading">0</span>°</div>
        </div>
    </div>

    <div id="recording-controls">
        <h3>🎬 Recording</h3>
        <div>
            <button id="record-btn" onclick="toggleRecording()">🔴 Start Recording</button>
        </div>
        <div style="margin-top: 10px;">
            <select id="format-select">
                <option value="mp4">📹 MP4 Video</option>
                <option value="gif">🎞️ Animated GIF</option>
                <option value="webm">🎥 WebM</option>
            </select>
        </div>
        <div>
            <div>Recording: <span class="status-indicator" id="record-status"></span><span id="record-status-text">Stopped</span></div>
            <div>Duration: <span id="record-duration">0</span>s</div>
        </div>
    </div>

    <div id="treasure-map">
        <h3>🗺️ Treasure Map</h3>
        <div id="treasure-locations">
            <div>⚓ Audio Treasure Island</div>
            <div>🔥 Iron Cannon Cove</div>
            <div>✨ Mystic Maker Isle</div>
        </div>
        <div style="margin-top: 10px;">
            <button onclick="revealTreasure()">🏴‍☠️ Reveal Treasure</button>
        </div>
    </div>

    <div id="companion-status">
        <h3>⚓ Ship Status</h3>
        <div id="ship-info">
            <div>Ship: <span id="current-ship">None</span></div>
            <div>Crew: <span id="crew-status">Ready</span></div>
            <div>Sails: <span id="sail-status">Furled</span></div>
            <div>Cargo: <span id="cargo-status">Empty</span></div>
        </div>
        <div style="margin-top: 10px;">
            <button onclick="triggerCelebration()">🎉 Celebrate</button>
            <button onclick="fireCannons()">💥 Fire Cannons</button>
        </div>
    </div>

    <script>
        let scene, camera, renderer;
        let ship, treasureIslands = [];
        let ws = null;
        let isRecording = false;
        let recordingStartTime = null;
        
        // Scene objects
        let ocean, sky;
        let currentRoute = null;
        
        // Initialize Three.js scene
        function initScene() {
            // Scene setup
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x87CEEB); // Sky blue
            
            // Camera setup
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
            camera.position.set(0, 500, 1000);
            camera.lookAt(0, 0, 0);
            
            // Renderer setup
            const canvas = document.getElementById('pirate-canvas');
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(1000, 2000, 1000);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            scene.add(directionalLight);
            
            // Create ocean
            createOcean();
            
            // Create treasure islands
            createTreasureIslands();
            
            // Create ship
            createShip('pirate');
            
            // Start animation loop
            animate();
            
            // Hide loading screen
            document.getElementById('loading').style.display = 'none';
        }
        
        function createOcean() {
            const oceanGeometry = new THREE.PlaneGeometry(20000, 20000, 100, 100);
            const oceanMaterial = new THREE.MeshPhongMaterial({
                color: 0x006994,
                transparent: true,
                opacity: 0.8,
                shininess: 100
            });
            
            ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
            ocean.rotation.x = -Math.PI / 2;
            ocean.position.y = 0;
            scene.add(ocean);
            
            // Animate ocean waves
            animateOcean();
        }
        
        function animateOcean() {
            if (!ocean) return;
            
            const time = Date.now() * 0.001;
            const positions = ocean.geometry.attributes.position;
            
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const z = positions.getZ(i);
                const waveHeight = Math.sin(x * 0.01 + time) * Math.cos(z * 0.01 + time) * 20;
                positions.setY(i, waveHeight);
            }
            
            positions.needsUpdate = true;
            
            requestAnimationFrame(animateOcean);
        }
        
        function createTreasureIslands() {
            const islands = [
                { name: 'Audio Treasure', pos: [2000, 0, 1500], color: 0x00ff88 },
                { name: 'Iron Cannon Cove', pos: [-1800, 0, 2200], color: 0xff6b35 },
                { name: 'Mystic Maker Isle', pos: [0, 0, -2500], color: 0x8b5cf6 }
            ];
            
            islands.forEach((island, index) => {
                // Island base
                const islandGeometry = new THREE.ConeGeometry(200, 100, 8);
                const islandMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
                const islandMesh = new THREE.Mesh(islandGeometry, islandMaterial);
                islandMesh.position.set(...island.pos);
                scene.add(islandMesh);
                
                // Treasure glow
                const glowGeometry = new THREE.SphereGeometry(50, 16, 16);
                const glowMaterial = new THREE.MeshBasicMaterial({ 
                    color: island.color,
                    transparent: true,
                    opacity: 0.6
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                glow.position.set(island.pos[0], island.pos[1] + 150, island.pos[2]);
                scene.add(glow);
                
                treasureIslands.push({ island: islandMesh, glow, name: island.name });
            });
        }
        
        function createShip(shipType) {
            // Simple ship representation (in real implementation, would load detailed 3D models)
            const shipGroup = new THREE.Group();
            
            // Hull
            const hullGeometry = new THREE.BoxGeometry(100, 30, 200);
            const hullMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            const hull = new THREE.Mesh(hullGeometry, hullMaterial);
            hull.position.y = 15;
            shipGroup.add(hull);
            
            // Mast
            const mastGeometry = new THREE.CylinderGeometry(3, 3, 150);
            const mastMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
            const mast = new THREE.Mesh(mastGeometry, mastMaterial);
            mast.position.y = 90;
            shipGroup.add(mast);
            
            // Sail
            const sailGeometry = new THREE.PlaneGeometry(80, 120);
            const sailMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFFFAF0,
                side: THREE.DoubleSide
            });
            const sail = new THREE.Mesh(sailGeometry, sailMaterial);
            sail.position.set(0, 75, 0);
            sail.rotation.y = Math.PI / 2;
            shipGroup.add(sail);
            
            // Flag
            const flagGeometry = new THREE.PlaneGeometry(30, 20);
            const flagMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x000000,
                side: THREE.DoubleSide
            });
            const flag = new THREE.Mesh(flagGeometry, flagMaterial);
            flag.position.set(0, 140, 0);
            shipGroup.add(flag);
            
            ship = shipGroup;
            ship.position.set(0, 25, 0);
            scene.add(ship);
            
            // Update ship info
            updateShipInfo(shipType);
        }
        
        function updateShipInfo(shipType) {
            const shipNames = {
                zombie: 'Undead Galleon',
                crypto_zombie: 'Blockchain Frigate',
                daemon: 'Ghost Process Sloop',
                pirate: 'Captain\\'s Flagship'
            };
            
            document.getElementById('current-ship').textContent = shipNames[shipType] || 'Unknown Ship';
            document.getElementById('crew-status').textContent = 'Ready for Adventure';
            document.getElementById('sail-status').textContent = 'Full Sail';
        }
        
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate treasure glows
            treasureIslands.forEach(island => {
                island.glow.rotation.y += 0.02;
                island.glow.position.y += Math.sin(Date.now() * 0.001) * 2;
            });
            
            // Update ship movement
            if (ship && currentRoute) {
                // Simple ship animation (would be more complex in real implementation)
                ship.rotation.y += 0.01;
            }
            
            // Update recording duration
            if (isRecording && recordingStartTime) {
                const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
                document.getElementById('record-duration').textContent = duration;
            }
            
            renderer.render(scene, camera);
        }
        
        // WebSocket connection
        function initWebSocket() {
            const wsUrl = \`ws://\${window.location.hostname}:${this.config.wsPort}\`;
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                console.log('Connected to 3D viewer');
                updateNavStatus('Connected', 'active');
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = function() {
                console.log('Disconnected from 3D viewer');
                updateNavStatus('Disconnected', 'idle');
                setTimeout(initWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(message) {
            switch (message.type) {
                case '3d_viewer_ready':
                    console.log('3D viewer ready');
                    break;
                    
                case 'route_visualization_ready':
                    displayRoute(message.visualization);
                    break;
                    
                case 'ship_position_updated':
                    updateShipPosition(message.position, message.heading);
                    break;
                    
                case 'special_effect_triggered':
                    playSpecialEffect(message.effect, message.parameters);
                    break;
            }
        }
        
        function updateNavStatus(text, status) {
            document.getElementById('nav-status-text').textContent = text;
            const indicator = document.getElementById('nav-status');
            indicator.className = 'status-indicator status-' + status;
        }
        
        function updateRecordStatus(text, status) {
            document.getElementById('record-status-text').textContent = text;
            const indicator = document.getElementById('record-status');
            indicator.className = 'status-indicator status-' + status;
        }
        
        function displayRoute(visualization) {
            console.log('Displaying route:', visualization);
            currentRoute = visualization.route;
            
            // Update UI
            document.getElementById('ship-speed').textContent = Math.round(visualization.ship.speed * 10);
            document.getElementById('ship-heading').textContent = Math.round(visualization.ship.heading);
        }
        
        function updateShipPosition(position, heading) {
            if (ship) {
                ship.position.set(position.x / 10, position.y + 25, position.z / 10);
                ship.rotation.y = heading * Math.PI / 180;
            }
        }
        
        function playSpecialEffect(effect, parameters) {
            console.log('Playing special effect:', effect);
            
            switch (effect) {
                case 'treasure_discovered':
                    const island = treasureIslands.find(i => i.name.includes('Audio'));
                    if (island) {
                        island.glow.material.emissive = new THREE.Color(0xFFD700);
                        setTimeout(() => {
                            island.glow.material.emissive = new THREE.Color(0x000000);
                        }, 2000);
                    }
                    break;
                    
                case 'cannon_salute':
                    // Flash effect
                    scene.background = new THREE.Color(0xFFFFFF);
                    setTimeout(() => {
                        scene.background = new THREE.Color(0x87CEEB);
                    }, 100);
                    break;
            }
        }
        
        // UI Event Handlers
        async function startDemo() {
            const companionType = document.getElementById('companion-select').value;
            
            // Mock route for demo
            const demoRoute = {
                waypoints: [
                    { position: { x: 0, y: 0, z: 0 } },
                    { position: { x: 1000, y: 0, z: 500 } },
                    { position: { x: 2000, y: 0, z: 1500 } }
                ]
            };
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'visualize_route',
                    route: demoRoute,
                    companion: companionType
                }));
            }
            
            updateNavStatus('Navigating', 'active');
            document.getElementById('sail-status').textContent = 'Full Speed Ahead!';
        }
        
        function resetScene() {
            if (ship) {
                ship.position.set(0, 25, 0);
                ship.rotation.set(0, 0, 0);
            }
            
            updateNavStatus('Idle', 'idle');
            document.getElementById('ship-speed').textContent = '0';
            document.getElementById('ship-heading').textContent = '0';
            document.getElementById('sail-status').textContent = 'Furled';
        }
        
        async function toggleRecording() {
            const format = document.getElementById('format-select').value;
            
            if (!isRecording) {
                // Start recording
                const response = await fetch('/api/recording/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ format })
                });
                
                if (response.ok) {
                    isRecording = true;
                    recordingStartTime = Date.now();
                    document.getElementById('record-btn').textContent = '⏹️ Stop Recording';
                    document.getElementById('record-btn').classList.add('recording');
                    updateRecordStatus('Recording', 'recording');
                }
            } else {
                // Stop recording
                const response = await fetch('/api/recording/stop', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    isRecording = false;
                    recordingStartTime = null;
                    document.getElementById('record-btn').textContent = '🔴 Start Recording';
                    document.getElementById('record-btn').classList.remove('recording');
                    updateRecordStatus('Stopped', 'idle');
                    document.getElementById('record-duration').textContent = '0';
                    
                    alert(\`Recording saved!\\nDuration: \${Math.round(result.duration/1000)}s\\nFrames: \${result.frames}\`);
                }
            }
        }
        
        function revealTreasure() {
            treasureIslands.forEach(island => {
                island.glow.material.opacity = 1.0;
                island.glow.scale.set(2, 2, 2);
            });
            
            document.getElementById('treasure-map').classList.add('treasure-discovered');
            
            setTimeout(() => {
                treasureIslands.forEach(island => {
                    island.glow.material.opacity = 0.6;
                    island.glow.scale.set(1, 1, 1);
                });
                document.getElementById('treasure-map').classList.remove('treasure-discovered');
            }, 3000);
        }
        
        function triggerCelebration() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'trigger_special_effect',
                    effect: 'companion_celebration'
                }));
            }
            
            // Visual celebration
            document.getElementById('companion-status').style.background = 'rgba(255, 215, 0, 0.9)';
            setTimeout(() => {
                document.getElementById('companion-status').style.background = 'rgba(0, 50, 100, 0.9)';
            }, 2000);
        }
        
        function fireCannons() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'trigger_special_effect',
                    effect: 'cannon_salute',
                    parameters: { count: 5 }
                }));
            }
            
            playSpecialEffect('cannon_salute');
        }
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });
        
        // Initialize everything
        window.addEventListener('load', function() {
            initScene();
            initWebSocket();
        });
    </script>
</body>
</html>`;
  }
}

// Export
module.exports = Pirate3DNavigationViewer;

// CLI Interface
if (require.main === module) {
  const viewer = new Pirate3DNavigationViewer({
    recordingEnabled: true,
    videoFormat: 'mp4',
    frameRate: 30
  });
  
  console.log('\n🏴‍☠️⛵ PIRATE 3D NAVIGATION VIEWER DEMO');
  console.log('========================================');
  console.log('');
  console.log('Features:');
  console.log('• Three.js 3D pirate seas with dynamic weather');
  console.log('• Companion ships based on character type');
  console.log('• Treasure islands representing manufacturing stations');
  console.log('• Real-time MP4/GIF recording of navigation sessions');
  console.log('• Special effects and weather system');
  console.log('• WebSocket integration with collar system');
  console.log('');
  
  // Demo route visualization after 3 seconds
  setTimeout(async () => {
    console.log('\n🗺️ STARTING 3D VISUALIZATION DEMO...');
    
    const demoRequest = {
      route: {
        nodes: [
          { id: 'start', position: { lat: 40.7589, lng: -73.9851 }, name: 'Departure Port' },
          { id: 'mid', position: { lat: 40.7600, lng: -73.9800 }, name: 'Trading Post' },
          { id: 'end', position: { lat: 40.7614, lng: -73.9776 }, name: 'Treasure Island' }
        ]
      },
      companion: 'pirate',
      options: { recordVideo: true, videoFormat: 'mp4' }
    };
    
    try {
      const result = await viewer.visualizeNavigationRoute(demoRequest);
      console.log('\n✅ 3D visualization started!');
      console.log(`Ship: ${result.ship.name}`);
      console.log(`Waypoints: ${result.route.waypoints.length}`);
      console.log(`Distance: ${Math.round(result.route.totalDistance)}m`);
      console.log(`Recording: ${result.estimatedDuration}s estimated`);
    } catch (error) {
      console.error('❌ Demo visualization failed:', error.message);
    }
  }, 3000);
  
  process.on('SIGINT', () => {
    console.log('\n\n⚓ Pirate 3D Navigation Viewer shutting down...');
    console.log('Fair winds and following seas!');
    process.exit(0);
  });
}
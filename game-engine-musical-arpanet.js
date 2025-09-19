#!/usr/bin/env node
// Game Engine Musical ARPANET
// Each pixel/unit/zone operates on its own frequency within the network mesh

const EventEmitter = require('events');

class GameEngineMusicalARPANET extends EventEmitter {
  constructor() {
    super();
    
    // ARPANET-style node topology
    this.nodes = new Map(); // Each game unit is a node
    this.zones = new Map(); // Zones are subnets
    this.tables = new Map(); // Tables are routing tables
    
    // Musical frequency assignments
    this.frequencyMap = {
      // Zone frequencies (base harmonics)
      zones: {
        spawn: 110.00,      // A2 - Where units begin
        combat: 220.00,     // A3 - Battle zones
        safe: 440.00,       // A4 - Safe zones
        dungeon: 146.83,    // D3 - Dark mysterious areas
        market: 329.63,     // E4 - Trading zones
        wilderness: 196.00, // G3 - Open world
        boss: 61.74        // B1 - Epic encounters (low frequency)
      },
      
      // Unit type frequencies (character classes)
      units: {
        player: 440.00,     // A4 - Standard tuning
        npc: 392.00,        // G4 - Slightly lower
        enemy: 261.63,      // C4 - Distinct from players
        boss: 87.31,        // F2 - Deep, menacing
        merchant: 329.63,   // E4 - Friendly
        pet: 587.33,        // D5 - High, cute
        summon: 493.88      // B4 - Magical
      },
      
      // Pixel-level frequencies (granular control)
      pixels: {
        ground: 65.41,      // C2 - Foundation
        wall: 130.81,       // C3 - Barriers
        water: 146.83,      // D3 - Flowing
        fire: 349.23,       // F4 - Hot, active
        air: 440.00,        // A4 - Light
        portal: 523.25,     // C5 - Transition
        treasure: 659.25    // E5 - Valuable
      },
      
      // Action frequencies (what's happening)
      actions: {
        idle: 0,            // No frequency - silence
        walk: 2,            // 2Hz pulse
        run: 4,             // 4Hz pulse
        attack: 8,          // 8Hz pulse
        cast: 16,           // 16Hz pulse
        die: 0.5,           // 0.5Hz fade
        respawn: 32         // 32Hz burst
      }
    };
    
    // ARPANET routing tables for game world
    this.routingTables = {
      movement: new Map(),    // How units move between zones
      communication: new Map(), // How units talk to each other
      combat: new Map(),      // Combat resolution paths
      economy: new Map(),     // Trade routes
      quests: new Map()       // Quest progression paths
    };
    
    // Network mesh for real-time coordination
    this.mesh = {
      topology: 'hybrid', // Mix of star (zones) and mesh (units)
      latency: new Map(), // Simulated network latency
      bandwidth: new Map(), // Data throughput limits
      packets: [],        // Active data packets
      switches: new Map() // Zone interconnections
    };
    
    // Musical synthesis engine
    this.synthesizer = {
      oscillators: new Map(), // One per active unit
      filters: new Map(),     // Audio processing
      envelopes: new Map(),   // ADSR for events
      effects: new Map(),     // Reverb, delay, etc.
      masterGain: 0.5        // Overall volume
    };
    
    // Game state synchronized with music
    this.gameState = {
      tempo: 120,           // BPM - game speed
      timeSignature: '4/4', // Action intervals
      key: 'A minor',       // Current game mood
      harmony: [],          // Active chord progression
      melody: [],           // Current action sequence
      rhythm: []            // Movement patterns
    };
    
    // Zone-based audio environments
    this.audioEnvironments = {
      spawn: { reverb: 0.2, delay: 0, filter: 'none' },
      combat: { reverb: 0.5, delay: 0.1, filter: 'distortion' },
      safe: { reverb: 0.3, delay: 0, filter: 'warm' },
      dungeon: { reverb: 0.8, delay: 0.3, filter: 'dark' },
      market: { reverb: 0.4, delay: 0, filter: 'bright' },
      wilderness: { reverb: 0.6, delay: 0.2, filter: 'natural' },
      boss: { reverb: 0.9, delay: 0.4, filter: 'epic' }
    };
    
    // Performance metrics
    this.metrics = {
      activeNodes: 0,
      packetsPerSecond: 0,
      harmonicCoherence: 1.0, // How well units work together
      networkLoad: 0,
      audioLatency: 0,
      syncErrors: 0
    };
  }

  // Create a new zone (subnet) in the game world
  createZone(zoneId, config) {
    const zone = {
      id: zoneId,
      type: config.type || 'wilderness',
      frequency: this.frequencyMap.zones[config.type] || 196.00,
      position: config.position || { x: 0, y: 0, z: 0 },
      dimensions: config.dimensions || { width: 100, height: 100 },
      
      // ARPANET subnet configuration
      subnet: {
        address: this.generateSubnetAddress(zoneId),
        mask: '255.255.255.0',
        gateway: this.generateGatewayAddress(zoneId),
        broadcast: this.generateBroadcastAddress(zoneId)
      },
      
      // Musical properties
      musical: {
        key: config.key || 'A minor',
        scale: config.scale || 'natural',
        tempo: config.tempo || 120,
        ambience: this.audioEnvironments[config.type] || {}
      },
      
      // Game properties
      rules: config.rules || {},
      units: new Set(),
      pixels: new Map(),
      connections: new Set() // Connected zones
    };
    
    this.zones.set(zoneId, zone);
    this.setupZoneRouting(zone);
    
    console.log(`🎵 Created zone ${zoneId} at ${zone.frequency}Hz (${zone.type})`);
    return zone;
  }

  // Spawn a unit (network node) in the game
  spawnUnit(unitId, config) {
    const unit = {
      id: unitId,
      type: config.type || 'player',
      frequency: this.frequencyMap.units[config.type] || 440.00,
      position: config.position || { x: 0, y: 0, z: 0 },
      zone: config.zone || 'spawn',
      
      // ARPANET node configuration
      network: {
        ip: this.generateUnitIP(unitId),
        mac: this.generateMAC(unitId),
        routing: new Map(),
        connections: new Set(),
        bandwidth: config.bandwidth || 1000, // Kbps
        latency: 0
      },
      
      // Musical properties
      musical: {
        note: this.frequencyToNote(this.frequencyMap.units[config.type]),
        octave: 4,
        volume: 0.5,
        pan: 0, // Stereo position based on game position
        effects: []
      },
      
      // Game properties
      stats: config.stats || {},
      inventory: config.inventory || [],
      actions: new Set(),
      state: 'idle'
    };
    
    this.nodes.set(unitId, unit);
    this.createOscillator(unit);
    this.addToZone(unit, unit.zone);
    
    // Announce unit to network
    this.broadcastPacket({
      type: 'UNIT_SPAWN',
      source: unit.network.ip,
      destination: 'BROADCAST',
      data: { unitId, type: unit.type, zone: unit.zone }
    });
    
    console.log(`🎮 Spawned ${unit.type} ${unitId} at ${unit.frequency}Hz`);
    return unit;
  }

  // Move unit between positions (affects audio panning and network routing)
  moveUnit(unitId, newPosition, speed = 1) {
    const unit = this.nodes.get(unitId);
    if (!unit) return;
    
    const oldPosition = unit.position;
    const distance = this.calculateDistance(oldPosition, newPosition);
    const moveTime = distance / speed;
    
    // Update network routing based on movement
    const fromZone = this.getZoneAtPosition(oldPosition);
    const toZone = this.getZoneAtPosition(newPosition);
    
    if (fromZone !== toZone) {
      // Zone transition - reroute packets
      this.rerouteUnit(unit, fromZone, toZone);
      
      // Change musical environment
      this.transitionUnitAudio(unit, fromZone, toZone);
    }
    
    // Update position
    unit.position = newPosition;
    
    // Update stereo panning based on position
    unit.musical.pan = (newPosition.x - 50) / 50; // -1 to 1
    
    // Send movement packet
    this.sendPacket({
      type: 'UNIT_MOVE',
      source: unit.network.ip,
      destination: 'ZONE_BROADCAST',
      zone: unit.zone,
      data: { unitId, from: oldPosition, to: newPosition, duration: moveTime }
    });
    
    // Play movement sound
    this.playMovementSound(unit, speed);
  }

  // Unit performs action (affects frequency and network traffic)
  performAction(unitId, action, target = null) {
    const unit = this.nodes.get(unitId);
    if (!unit) return;
    
    const actionFreq = this.frequencyMap.actions[action] || 0;
    
    // Create action packet
    const packet = {
      type: 'UNIT_ACTION',
      source: unit.network.ip,
      destination: target ? this.nodes.get(target)?.network.ip : 'ZONE_BROADCAST',
      zone: unit.zone,
      data: { unitId, action, target, timestamp: Date.now() }
    };
    
    // Route packet through ARPANET
    this.routePacket(packet);
    
    // Modulate unit frequency based on action
    if (actionFreq > 0) {
      this.modulateUnitFrequency(unit, actionFreq);
    }
    
    // Update game state
    unit.state = action;
    unit.actions.add(action);
    
    // Emit action event
    this.emit('unit:action', { unitId, action, target });
    
    // Add to melody sequence
    this.gameState.melody.push({
      note: unit.musical.note,
      duration: 1 / actionFreq,
      velocity: this.actionToVelocity(action)
    });
  }

  // Create oscillator for unit (sound generation)
  createOscillator(unit) {
    const oscillator = {
      frequency: unit.frequency,
      type: this.getOscillatorType(unit.type),
      gain: unit.musical.volume,
      pan: unit.musical.pan,
      active: true
    };
    
    this.synthesizer.oscillators.set(unit.id, oscillator);
    
    // Apply zone effects
    const zone = this.zones.get(unit.zone);
    if (zone) {
      this.applyZoneEffects(oscillator, zone.musical.ambience);
    }
  }

  // Route packet through game ARPANET
  routePacket(packet) {
    // Simulate network routing
    const route = this.findRoute(packet.source, packet.destination);
    
    // Add network latency based on route
    const latency = this.calculateLatency(route);
    
    setTimeout(() => {
      // Deliver packet
      if (packet.destination === 'BROADCAST') {
        this.broadcastPacket(packet);
      } else if (packet.destination === 'ZONE_BROADCAST') {
        this.zonecastPacket(packet);
      } else {
        this.deliverPacket(packet);
      }
      
      // Update metrics
      this.metrics.packetsPerSecond++;
    }, latency);
    
    // Store packet for visualization
    this.mesh.packets.push({
      ...packet,
      route,
      latency,
      timestamp: Date.now()
    });
  }

  // Find network route between IPs
  findRoute(sourceIP, destIP) {
    // Simplified routing algorithm
    if (destIP === 'BROADCAST' || destIP === 'ZONE_BROADCAST') {
      return [sourceIP, 'ROUTER', destIP];
    }
    
    // Use routing tables
    const sourceZone = this.getZoneByIP(sourceIP);
    const destZone = this.getZoneByIP(destIP);
    
    if (sourceZone === destZone) {
      return [sourceIP, destIP]; // Direct connection
    } else {
      // Route through zone gateways
      return [
        sourceIP,
        sourceZone.subnet.gateway,
        'BACKBONE',
        destZone.subnet.gateway,
        destIP
      ];
    }
  }

  // Calculate network latency based on route
  calculateLatency(route) {
    let latency = 0;
    
    for (let i = 0; i < route.length - 1; i++) {
      const hop = route[i] + '->' + route[i + 1];
      
      // Different latencies for different connections
      if (hop.includes('BACKBONE')) {
        latency += 50; // Inter-zone latency
      } else if (hop.includes('ROUTER')) {
        latency += 20; // Intra-zone routing
      } else {
        latency += 5; // Direct connection
      }
    }
    
    // Add musical timing quantization
    const beatMs = 60000 / this.gameState.tempo;
    const quantizedLatency = Math.round(latency / beatMs) * beatMs;
    
    return quantizedLatency;
  }

  // Modulate unit frequency for actions
  modulateUnitFrequency(unit, actionFreq) {
    const oscillator = this.synthesizer.oscillators.get(unit.id);
    if (!oscillator) return;
    
    // Create modulation envelope
    const envelope = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.5,
      release: 0.3
    };
    
    // Apply frequency modulation
    const modulation = {
      baseFreq: unit.frequency,
      modFreq: actionFreq,
      modDepth: 0.5,
      duration: 1000 / actionFreq // Action duration
    };
    
    this.synthesizer.envelopes.set(unit.id, { envelope, modulation });
    
    // Emit sound event
    this.emit('sound:modulation', { unitId: unit.id, modulation });
  }

  // Generate subnet address for zone
  generateSubnetAddress(zoneId) {
    const zoneIndex = Array.from(this.zones.keys()).indexOf(zoneId) + 1;
    return `10.${zoneIndex}.0.0`;
  }

  // Generate IP for unit
  generateUnitIP(unitId) {
    const unit = this.nodes.get(unitId);
    const zone = this.zones.get(unit?.zone || 'spawn');
    const zoneIndex = Array.from(this.zones.keys()).indexOf(zone?.id) + 1;
    const unitIndex = zone ? Array.from(zone.units).indexOf(unitId) + 1 : 1;
    
    return `10.${zoneIndex}.0.${unitIndex}`;
  }

  // Calculate harmonic coherence (how well units work together musically)
  calculateHarmonicCoherence() {
    const activeFrequencies = [];
    
    for (const [unitId, unit] of this.nodes) {
      if (unit.state !== 'idle') {
        activeFrequencies.push(unit.frequency);
      }
    }
    
    if (activeFrequencies.length < 2) return 1.0;
    
    // Check for harmonic relationships
    let coherence = 0;
    for (let i = 0; i < activeFrequencies.length; i++) {
      for (let j = i + 1; j < activeFrequencies.length; j++) {
        const ratio = activeFrequencies[i] / activeFrequencies[j];
        
        // Check for simple ratios (octave, fifth, fourth, third)
        if (this.isHarmonicRatio(ratio)) {
          coherence += 1;
        }
      }
    }
    
    // Normalize
    const maxPairs = (activeFrequencies.length * (activeFrequencies.length - 1)) / 2;
    return coherence / maxPairs;
  }

  // Check if frequency ratio is harmonic
  isHarmonicRatio(ratio) {
    const harmonicRatios = [
      1/2, 2/1,    // Octave
      2/3, 3/2,    // Fifth
      3/4, 4/3,    // Fourth
      4/5, 5/4,    // Major third
      5/6, 6/5     // Minor third
    ];
    
    return harmonicRatios.some(hr => Math.abs(ratio - hr) < 0.01);
  }

  // Visualize network state
  getNetworkVisualization() {
    return {
      zones: Array.from(this.zones.values()).map(zone => ({
        id: zone.id,
        type: zone.type,
        frequency: zone.frequency,
        unitCount: zone.units.size,
        subnet: zone.subnet.address
      })),
      
      units: Array.from(this.nodes.values()).map(unit => ({
        id: unit.id,
        type: unit.type,
        frequency: unit.frequency,
        zone: unit.zone,
        ip: unit.network.ip,
        state: unit.state
      })),
      
      packets: this.mesh.packets.slice(-50), // Last 50 packets
      
      metrics: {
        ...this.metrics,
        harmonicCoherence: this.calculateHarmonicCoherence()
      },
      
      musicalState: this.gameState
    };
  }

  // Convert frequency to musical note
  frequencyToNote(freq) {
    const A4 = 440;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const halfSteps = 12 * Math.log2(freq / A4);
    const noteIndex = Math.round(halfSteps + 9) % 12;
    
    return notes[noteIndex];
  }

  // Get oscillator type based on unit type
  getOscillatorType(unitType) {
    const typeMap = {
      player: 'sine',      // Pure tone
      npc: 'triangle',     // Softer
      enemy: 'sawtooth',   // Aggressive
      boss: 'square',      // Powerful
      merchant: 'sine',    // Friendly
      pet: 'triangle',     // Cute
      summon: 'sine'       // Magical
    };
    
    return typeMap[unitType] || 'sine';
  }
}

// Export
module.exports = { GameEngineMusicalARPANET };

// Example usage
if (require.main === module) {
  const gameNet = new GameEngineMusicalARPANET();
  
  console.log('🎮 GAME ENGINE MUSICAL ARPANET');
  console.log('===============================');
  console.log('Every pixel has a frequency, every zone is a subnet\n');
  
  // Create game zones
  gameNet.createZone('spawn_zone', { type: 'spawn', position: { x: 0, y: 0 } });
  gameNet.createZone('combat_arena', { type: 'combat', position: { x: 100, y: 0 } });
  gameNet.createZone('market_square', { type: 'market', position: { x: 0, y: 100 } });
  
  // Spawn units
  const player1 = gameNet.spawnUnit('player_1', { type: 'player', zone: 'spawn_zone' });
  const enemy1 = gameNet.spawnUnit('goblin_1', { type: 'enemy', zone: 'combat_arena' });
  const merchant1 = gameNet.spawnUnit('merchant_1', { type: 'merchant', zone: 'market_square' });
  
  // Simulate game actions
  console.log('\n🎵 Starting game simulation...\n');
  
  // Player moves
  gameNet.moveUnit('player_1', { x: 50, y: 0 }, 5);
  
  // Combat sequence
  setTimeout(() => {
    gameNet.performAction('player_1', 'attack', 'goblin_1');
    gameNet.performAction('goblin_1', 'attack', 'player_1');
  }, 1000);
  
  // Show network state
  setInterval(() => {
    const viz = gameNet.getNetworkVisualization();
    console.log('\n📊 Network Status:');
    console.log(`Zones: ${viz.zones.length}, Units: ${viz.units.length}`);
    console.log(`Packets/sec: ${viz.metrics.packetsPerSecond}`);
    console.log(`Harmonic Coherence: ${(viz.metrics.harmonicCoherence * 100).toFixed(1)}%`);
  }, 5000);
}
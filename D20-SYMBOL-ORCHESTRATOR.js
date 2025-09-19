#!/usr/bin/env node

/**
 * 🎲 D20 SYMBOL ORCHESTRATOR
 * A 20-sided die where each face represents a different semantic transformation
 * Rotating the die changes which transformation is active
 * 
 * Like Desert Treasure puzzles meets Dungeons & Dragons meets Odesza visuals
 * 
 * Each face connects to:
 * - Semantic transformations (humans.txt, machines.txt, etc.)
 * - Ancient symbols (Egyptian, Sumerian, Greek)
 * - Modern formats (JSON, XML, Binary)
 * - Visual states (colors, patterns, glows)
 * - Audio tones (frequencies, harmonics)
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class D20SymbolOrchestrator extends EventEmitter {
  constructor() {
    super();
    
    // The 20 faces of our semantic die
    this.d20Faces = {
      1: {
        name: 'HUMAN_READABLE',
        symbol: '👤',
        ancient: '𓂀', // Egyptian eye
        transformation: 'humans.txt',
        color: '#3B82F6',
        tone: 440, // A4
        description: 'Optimized for human understanding'
      },
      2: {
        name: 'MACHINE_INTERFACE',
        symbol: '🤖',
        ancient: '⚙',
        transformation: 'machines.txt',
        color: '#10B981',
        tone: 493.88, // B4
        description: 'Direct machine-to-machine communication'
      },
      3: {
        name: 'LLM_CONTEXT',
        symbol: '🧠',
        ancient: 'Λ', // Greek Lambda
        transformation: 'llms.txt',
        color: '#8B5CF6',
        tone: 523.25, // C5
        description: 'AI-optimized semantic preservation'
      },
      4: {
        name: 'ROBOT_DIRECTIVES',
        symbol: '🔧',
        ancient: 'ᚦ', // Runic thorn
        transformation: 'robots.txt',
        color: '#EF4444',
        tone: 587.33, // D5
        description: 'Crawler and automation instructions'
      },
      5: {
        name: 'BINARY_ESSENCE',
        symbol: '💾',
        ancient: '☯',
        transformation: 'binary',
        color: '#000000',
        tone: 659.25, // E5
        description: 'Pure binary representation'
      },
      6: {
        name: 'OCR_OPTIMIZED',
        symbol: '🔍',
        ancient: '𓁹', // Egyptian eye of Horus
        transformation: 'ocr.txt',
        color: '#FFFFFF',
        tone: 698.46, // F5
        description: 'Maximum contrast for optical recognition'
      },
      7: {
        name: 'FLASH_RAPID',
        symbol: '⚡',
        ancient: '𓊖', // Egyptian house/flash
        transformation: 'flash.txt',
        color: '#FACC15',
        tone: 783.99, // G5
        description: 'Rapid visual consumption format'
      },
      8: {
        name: 'ALGO_FEED',
        symbol: '📊',
        ancient: 'Σ', // Greek Sigma
        transformation: 'algo.txt',
        color: '#06B6D4',
        tone: 880, // A5
        description: 'Algorithm-ready data streams'
      },
      9: {
        name: 'PREDICTIVE_PATTERN',
        symbol: '🔮',
        ancient: '𓈗', // Egyptian water/flow
        transformation: 'predictive.txt',
        color: '#A855F7',
        tone: 987.77, // B5
        description: 'Pattern recognition optimized'
      },
      10: {
        name: 'ANTIBOT_CHALLENGE',
        symbol: '🛡️',
        ancient: 'ᚨ', // Runic protection
        transformation: 'antibot.txt',
        color: '#DC2626',
        tone: 1046.50, // C6
        description: 'Human verification challenges'
      },
      11: {
        name: 'JSON_STRUCTURED',
        symbol: '{}',
        ancient: '𒊩', // Sumerian container
        transformation: 'structured.json',
        color: '#059669',
        tone: 1174.66, // D6
        description: 'Hierarchical data structure'
      },
      12: {
        name: 'XML_HIERARCHICAL',
        symbol: '</>',
        ancient: '𓊗', // Egyptian pillar
        transformation: 'hierarchical.xml',
        color: '#7C3AED',
        tone: 1318.51, // E6
        description: 'Tagged hierarchical format'
      },
      13: {
        name: 'YAML_FLOW',
        symbol: '---',
        ancient: '𓈖', // Egyptian water
        transformation: 'flow.yaml',
        color: '#2563EB',
        tone: 1396.91, // F6
        description: 'Human-friendly data serialization'
      },
      14: {
        name: 'MARKDOWN_FORMATTED',
        symbol: '#',
        ancient: '𓏏', // Egyptian bread/document
        transformation: 'formatted.md',
        color: '#1F2937',
        tone: 1567.98, // G6
        description: 'Readable formatted documentation'
      },
      15: {
        name: 'CSV_TABULAR',
        symbol: '⊞',
        ancient: '𐡠', // Phoenician table
        transformation: 'tabular.csv',
        color: '#16A34A',
        tone: 1760, // A6
        description: 'Comma-separated tabular data'
      },
      16: {
        name: 'ANCIENT_HIEROGLYPH',
        symbol: '𓆎',
        ancient: '𓆎', // Egyptian snake/loop
        transformation: 'ancient.hieroglyph',
        color: '#D4AF37',
        tone: 1975.53, // B6
        description: 'Original symbolic representation'
      },
      17: {
        name: 'RUNIC_INSCRIPTION',
        symbol: 'ᚱ',
        ancient: 'ᚱ', // Runic ride
        transformation: 'runic.inscription',
        color: '#60A5FA',
        tone: 2093, // C7
        description: 'Northern symbolic system'
      },
      18: {
        name: 'CUNEIFORM_MARKS',
        symbol: '𒀭',
        ancient: '𒀭', // Sumerian god
        transformation: 'cuneiform.marks',
        color: '#F59E0B',
        tone: 2349.32, // D7
        description: 'First computational marks'
      },
      19: {
        name: 'EMOJI_UNIVERSAL',
        symbol: '🌐',
        ancient: '☉', // Sun symbol
        transformation: 'emoji.universal',
        color: '#EC4899',
        tone: 2637.02, // E7
        description: 'Modern universal symbols'
      },
      20: {
        name: 'QUANTUM_SUPERPOSITION',
        symbol: '⟨ψ|',
        ancient: '∞', // Infinity
        transformation: 'quantum.superposition',
        color: '#6366F1',
        tone: 2793.83, // F7
        description: 'All states simultaneously'
      }
    };
    
    // Current state
    this.currentFace = 1;
    this.rotationAngle = 0;
    this.rotationSpeed = 0;
    this.isRolling = false;
    
    // Rotation physics
    this.physics = {
      friction: 0.95,
      minSpeed: 0.01,
      maxSpeed: 50,
      acceleration: 2
    };
    
    // Audio context for tones
    this.audioEnabled = false;
    this.audioContext = null;
    this.oscillators = new Map();
    
    // Visual state
    this.visualState = {
      glowIntensity: 0,
      colorTransition: 0,
      symbolRotation: 0,
      particleEffects: []
    };
    
    // Orchestration connections
    this.connections = {
      semanticBridge: null,
      unifiedSymbols: null,
      ancientTranslator: null,
      fireworksExporter: null
    };
    
    console.log('🎲 D20 SYMBOL ORCHESTRATOR INITIALIZED');
    console.log('=====================================');
    console.log('🎯 20 semantic transformations ready');
    console.log('🔄 Rotation mechanics active');
    console.log('🎵 Tone mapping configured');
  }

  /**
   * 🎲 Roll the D20 with physics simulation
   */
  roll(force = Math.random() * 30 + 20) {
    console.log(`🎲 Rolling D20 with force: ${force.toFixed(2)}`);
    
    this.isRolling = true;
    this.rotationSpeed = Math.min(force, this.physics.maxSpeed);
    
    this.emit('rollStarted', {
      initialForce: force,
      currentFace: this.currentFace,
      timestamp: Date.now()
    });
    
    // Start physics simulation
    this.simulateRotation();
  }

  /**
   * 🔄 Simulate rotation physics
   */
  simulateRotation() {
    const rotationInterval = setInterval(() => {
      if (this.rotationSpeed < this.physics.minSpeed) {
        // Stop rolling
        clearInterval(rotationInterval);
        this.isRolling = false;
        this.rotationSpeed = 0;
        
        // Snap to nearest face
        this.snapToFace();
        
        // Emit roll complete
        this.emit('rollComplete', {
          landedFace: this.currentFace,
          faceData: this.d20Faces[this.currentFace],
          timestamp: Date.now()
        });
        
        // Trigger transformation
        this.activateTransformation();
        
        return;
      }
      
      // Update rotation
      this.rotationAngle += this.rotationSpeed;
      this.rotationAngle %= 360;
      
      // Apply friction
      this.rotationSpeed *= this.physics.friction;
      
      // Calculate current face based on angle
      const facesPerRotation = 20;
      const degreesPerFace = 360 / facesPerRotation;
      const newFace = Math.floor(this.rotationAngle / degreesPerFace) + 1;
      
      if (newFace !== this.currentFace) {
        this.currentFace = newFace > 20 ? 1 : newFace;
        this.onFaceChange();
      }
      
      // Update visual state
      this.updateVisuals();
      
      // Emit rotation update
      this.emit('rotating', {
        angle: this.rotationAngle,
        speed: this.rotationSpeed,
        currentFace: this.currentFace
      });
      
    }, 16); // ~60fps
  }

  /**
   * 🎯 Snap to nearest face when rolling stops
   */
  snapToFace() {
    const degreesPerFace = 360 / 20;
    const targetAngle = (this.currentFace - 1) * degreesPerFace;
    this.rotationAngle = targetAngle;
    
    console.log(`🎯 Snapped to face ${this.currentFace}: ${this.d20Faces[this.currentFace].name}`);
  }

  /**
   * 🔄 Handle face change during rotation
   */
  onFaceChange() {
    const face = this.d20Faces[this.currentFace];
    
    // Play tone if audio enabled
    if (this.audioEnabled) {
      this.playTone(face.tone, 50);
    }
    
    // Visual feedback
    this.visualState.glowIntensity = 1.0;
    
    // Emit face change
    this.emit('faceChanged', {
      newFace: this.currentFace,
      faceData: face,
      isRolling: this.isRolling
    });
  }

  /**
   * 🎵 Play tone for current face
   */
  playTone(frequency, duration = 200) {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        // Audio not available
        return;
      }
    }
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  /**
   * 🎨 Update visual state
   */
  updateVisuals() {
    // Glow decay
    this.visualState.glowIntensity *= 0.95;
    
    // Symbol rotation based on die rotation
    this.visualState.symbolRotation = this.rotationAngle * 2;
    
    // Color transition smoothing
    const targetColor = this.d20Faces[this.currentFace].color;
    this.visualState.colorTransition += 0.1;
    
    // Particle effects for rolling
    if (this.isRolling && Math.random() < 0.3) {
      this.visualState.particleEffects.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        velocity: { x: (Math.random() - 0.5) * 2, y: -Math.random() * 2 },
        life: 1.0,
        color: targetColor
      });
    }
    
    // Update particles
    this.visualState.particleEffects = this.visualState.particleEffects
      .map(p => ({
        ...p,
        x: p.x + p.velocity.x,
        y: p.y + p.velocity.y,
        life: p.life - 0.02
      }))
      .filter(p => p.life > 0);
  }

  /**
   * 🔮 Activate transformation for current face
   */
  activateTransformation() {
    const face = this.d20Faces[this.currentFace];
    console.log(`🔮 Activating transformation: ${face.name}`);
    
    const transformation = {
      face: this.currentFace,
      name: face.name,
      symbol: face.symbol,
      ancient: face.ancient,
      format: face.transformation,
      color: face.color,
      tone: face.tone,
      description: face.description,
      timestamp: Date.now()
    };
    
    // Emit transformation event
    this.emit('transformationActivated', transformation);
    
    // If connected to semantic bridge, trigger transformation
    if (this.connections.semanticBridge) {
      this.connections.semanticBridge.transform(transformation);
    }
    
    // Visual celebration
    this.celebrateTransformation();
  }

  /**
   * 🎆 Celebrate successful transformation
   */
  celebrateTransformation() {
    const face = this.d20Faces[this.currentFace];
    
    // Create burst of particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      this.visualState.particleEffects.push({
        x: 50,
        y: 50,
        velocity: {
          x: Math.cos(angle) * 3,
          y: Math.sin(angle) * 3
        },
        life: 1.0,
        color: face.color
      });
    }
    
    // Play celebration tone sequence
    if (this.audioEnabled) {
      const baseFreq = face.tone;
      setTimeout(() => this.playTone(baseFreq, 100), 0);
      setTimeout(() => this.playTone(baseFreq * 1.5, 100), 100);
      setTimeout(() => this.playTone(baseFreq * 2, 200), 200);
    }
    
    // Maximum glow
    this.visualState.glowIntensity = 2.0;
  }

  /**
   * 🔄 Manually rotate to specific face
   */
  rotateTo(targetFace, animated = true) {
    if (targetFace < 1 || targetFace > 20) {
      console.error('Invalid face number. Must be 1-20.');
      return;
    }
    
    if (animated) {
      // Calculate shortest rotation path
      const currentPos = this.currentFace;
      const distance = ((targetFace - currentPos + 20 + 10) % 20) - 10;
      
      // Set rotation speed based on distance
      this.rotationSpeed = Math.abs(distance) * 2;
      this.isRolling = true;
      
      // Start rotation
      this.simulateRotation();
    } else {
      // Instant rotation
      this.currentFace = targetFace;
      this.rotationAngle = (targetFace - 1) * (360 / 20);
      this.onFaceChange();
      this.activateTransformation();
    }
  }

  /**
   * 🎲 Get current state
   */
  getState() {
    return {
      currentFace: this.currentFace,
      faceData: this.d20Faces[this.currentFace],
      rotationAngle: this.rotationAngle,
      rotationSpeed: this.rotationSpeed,
      isRolling: this.isRolling,
      visualState: this.visualState,
      audioEnabled: this.audioEnabled
    };
  }

  /**
   * 🔌 Connect to other systems
   */
  connect(systemName, systemInstance) {
    this.connections[systemName] = systemInstance;
    console.log(`🔌 Connected to ${systemName}`);
    
    // Emit connection event
    this.emit('systemConnected', {
      system: systemName,
      timestamp: Date.now()
    });
  }

  /**
   * 🎵 Toggle audio
   */
  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    console.log(`🎵 Audio ${this.audioEnabled ? 'enabled' : 'disabled'}`);
    return this.audioEnabled;
  }

  /**
   * 🎨 Get visual representation
   */
  getVisualData() {
    const face = this.d20Faces[this.currentFace];
    
    return {
      d20: {
        face: this.currentFace,
        rotation: this.rotationAngle,
        spinning: this.isRolling,
        speed: this.rotationSpeed
      },
      current: {
        symbol: face.symbol,
        ancient: face.ancient,
        color: face.color,
        glow: this.visualState.glowIntensity
      },
      particles: this.visualState.particleEffects,
      connections: Object.keys(this.connections).filter(k => this.connections[k] !== null)
    };
  }

  /**
   * 🎯 Get all available transformations
   */
  getAllTransformations() {
    return Object.entries(this.d20Faces).map(([face, data]) => ({
      face: parseInt(face),
      ...data
    }));
  }

  /**
   * 🔮 Perform multi-face transformation sequence
   */
  async performSequence(faceSequence, delayMs = 1000) {
    console.log(`🔮 Performing sequence: ${faceSequence.join(' → ')}`);
    
    for (const face of faceSequence) {
      this.rotateTo(face, true);
      
      // Wait for rotation to complete
      await new Promise(resolve => {
        this.once('rollComplete', resolve);
      });
      
      // Delay before next
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    console.log('✅ Sequence complete');
    this.emit('sequenceComplete', {
      sequence: faceSequence,
      timestamp: Date.now()
    });
  }
}

// 🚀 CLI Interface
if (require.main === module) {
  console.log('🎲 D20 SYMBOL ORCHESTRATOR - INTERACTIVE MODE');
  console.log('============================================\n');
  
  const orchestrator = new D20SymbolOrchestrator();
  
  // Demo: Show all faces
  console.log('📋 Available Transformations:');
  orchestrator.getAllTransformations().forEach(t => {
    console.log(`  ${t.face}. ${t.symbol} ${t.name} - ${t.description}`);
  });
  
  console.log('\n🎲 Rolling the D20...\n');
  
  // Simulate some rolls
  let rollCount = 0;
  const demoRolls = setInterval(() => {
    orchestrator.roll();
    
    orchestrator.once('rollComplete', (result) => {
      console.log(`🎯 Landed on face ${result.landedFace}: ${result.faceData.name}`);
      console.log(`   Symbol: ${result.faceData.symbol} ${result.faceData.ancient}`);
      console.log(`   Transform: ${result.faceData.transformation}`);
      console.log(`   Color: ${result.faceData.color} | Tone: ${result.faceData.tone}Hz\n`);
      
      rollCount++;
      if (rollCount >= 3) {
        clearInterval(demoRolls);
        
        // Demo sequence
        console.log('🔮 Performing transformation sequence...\n');
        orchestrator.performSequence([1, 3, 16, 20]).then(() => {
          console.log('\n✨ D20 Symbol Orchestrator ready for integration!');
        });
      }
    });
  }, 3000);
}

module.exports = D20SymbolOrchestrator;
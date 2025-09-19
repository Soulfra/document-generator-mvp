#!/usr/bin/env node

/**
 * 🎵 ROTATION-TO-TONE MAPPER
 * Maps symbol rotations to musical tones and creates harmonic relationships
 * 
 * Like Odesza's visual-audio synchronization meets ancient musical scales
 * Each rotation angle produces specific frequencies that harmonize
 * 
 * Features:
 * - Pythagorean tuning based on mathematical ratios
 * - Harmonic series alignment with semantic transformations
 * - Binaural beats for consciousness-shifting effects
 * - Sacred geometry frequency mapping
 */

const EventEmitter = require('events');

class RotationToToneMapper extends EventEmitter {
  constructor() {
    super();
    
    // Musical configuration
    this.config = {
      baseFrequency: 432, // Hz - Universal healing frequency
      octaves: 7,
      tonesPerOctave: 12,
      
      // Special frequencies
      sacredFrequencies: {
        111: 'Cell regeneration',
        285: 'Quantum cognition', 
        396: 'Liberation from fear',
        417: 'Facilitating change',
        432: 'Universal harmony',
        528: 'DNA repair',
        639: 'Connecting relationships',
        741: 'Awakening intuition',
        852: 'Returning to spiritual order',
        963: 'Divine consciousness'
      },
      
      // Binaural beat configurations
      binauralBeats: {
        delta: { frequency: 2, state: 'Deep sleep' },
        theta: { frequency: 6, state: 'Meditation' },
        alpha: { frequency: 10, state: 'Relaxation' },
        beta: { frequency: 20, state: 'Focus' },
        gamma: { frequency: 40, state: 'Consciousness' }
      }
    };
    
    // Rotation mapping
    this.rotationMap = {
      // 360 degrees mapped to frequency spectrum
      degreesToFrequency: new Map(),
      
      // Harmonic relationships
      harmonicAngles: {
        0: { ratio: 1, name: 'Unison' },
        60: { ratio: 6/5, name: 'Minor third' },
        90: { ratio: 4/3, name: 'Perfect fourth' },
        120: { ratio: 3/2, name: 'Perfect fifth' },
        180: { ratio: 2, name: 'Octave' },
        240: { ratio: 5/3, name: 'Major sixth' },
        270: { ratio: 16/9, name: 'Minor seventh' },
        360: { ratio: 2, name: 'Octave return' }
      },
      
      // Semantic tone relationships
      semanticTones: {
        human: { baseFreq: 432, color: '#3B82F6' },
        machine: { baseFreq: 486, color: '#10B981' },
        ai: { baseFreq: 528, color: '#8B5CF6' },
        ancient: { baseFreq: 396, color: '#D4AF37' },
        quantum: { baseFreq: 963, color: '#6366F1' }
      }
    };
    
    // Audio synthesis
    this.synthesis = {
      waveforms: ['sine', 'square', 'sawtooth', 'triangle'],
      activeOscillators: new Map(),
      audioContext: null,
      masterGain: null,
      filters: new Map(),
      reverb: null
    };
    
    // Harmonic state
    this.harmonicState = {
      currentRotation: 0,
      activeFrequencies: new Set(),
      harmonicSeries: [],
      resonanceLevel: 0,
      cosmicAlignment: 0
    };
    
    this.initializeFrequencyMap();
    
    console.log('🎵 ROTATION-TO-TONE MAPPER INITIALIZED');
    console.log('=====================================');
    console.log('🔄 360° → Full frequency spectrum');
    console.log('🎶 Sacred frequencies active');
    console.log('🧠 Binaural beats configured');
  }

  /**
   * 🎵 Initialize frequency mapping
   */
  initializeFrequencyMap() {
    // Map each degree to a frequency using logarithmic scale
    const minFreq = 20; // Hz - Lower bound of human hearing
    const maxFreq = 20000; // Hz - Upper bound of human hearing
    
    for (let degree = 0; degree <= 360; degree++) {
      // Logarithmic mapping for better musical distribution
      const normalized = degree / 360;
      const logFreq = minFreq * Math.pow(maxFreq / minFreq, normalized);
      
      // Quantize to nearest musical frequency
      const musicalFreq = this.quantizeToMusicalFrequency(logFreq);
      
      this.rotationMap.degreesToFrequency.set(degree, musicalFreq);
    }
  }

  /**
   * 🎶 Quantize frequency to nearest musical note
   */
  quantizeToMusicalFrequency(frequency) {
    const A4 = this.config.baseFrequency;
    const semitone = Math.pow(2, 1/12);
    
    // Find nearest musical frequency
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const musicalFreq = A4 * Math.pow(semitone, semitonesFromA4);
    
    return musicalFreq;
  }

  /**
   * 🔄 Map rotation to tone
   */
  rotationToTone(degrees, options = {}) {
    // Normalize rotation
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    
    // Get base frequency from rotation
    const baseFrequency = this.rotationMap.degreesToFrequency.get(
      Math.round(normalizedDegrees)
    ) || this.config.baseFrequency;
    
    // Check for harmonic angles
    const harmonicData = this.findNearestHarmonic(normalizedDegrees);
    
    // Generate tone data
    const toneData = {
      rotation: normalizedDegrees,
      frequency: baseFrequency,
      harmonic: harmonicData,
      overtones: this.generateOvertones(baseFrequency),
      semantic: this.getSemanticTone(normalizedDegrees),
      binaural: options.binaural ? this.generateBinauralBeat(baseFrequency) : null,
      sacred: this.findSacredFrequency(baseFrequency),
      timestamp: Date.now()
    };
    
    // Update harmonic state
    this.updateHarmonicState(toneData);
    
    // Emit tone event
    this.emit('toneGenerated', toneData);
    
    return toneData;
  }

  /**
   * 🎵 Find nearest harmonic relationship
   */
  findNearestHarmonic(degrees) {
    let nearestAngle = 0;
    let minDifference = 360;
    
    Object.keys(this.rotationMap.harmonicAngles).forEach(angle => {
      const diff = Math.abs(degrees - parseFloat(angle));
      if (diff < minDifference) {
        minDifference = diff;
        nearestAngle = parseFloat(angle);
      }
    });
    
    const harmonic = this.rotationMap.harmonicAngles[nearestAngle];
    
    return {
      angle: nearestAngle,
      difference: minDifference,
      ratio: harmonic.ratio,
      name: harmonic.name,
      isExact: minDifference < 1
    };
  }

  /**
   * 🎶 Generate overtone series
   */
  generateOvertones(fundamental, count = 8) {
    const overtones = [];
    
    for (let n = 1; n <= count; n++) {
      overtones.push({
        harmonic: n,
        frequency: fundamental * n,
        amplitude: 1 / n, // Natural harmonic decay
        phase: 0
      });
    }
    
    return overtones;
  }

  /**
   * 🎨 Get semantic tone based on rotation region
   */
  getSemanticTone(degrees) {
    const regions = {
      human: [0, 72],
      machine: [72, 144],
      ai: [144, 216],
      ancient: [216, 288],
      quantum: [288, 360]
    };
    
    for (const [type, [min, max]] of Object.entries(regions)) {
      if (degrees >= min && degrees < max) {
        return {
          type,
          ...this.rotationMap.semanticTones[type],
          regionProgress: (degrees - min) / (max - min)
        };
      }
    }
    
    return this.rotationMap.semanticTones.human;
  }

  /**
   * 🧠 Generate binaural beat
   */
  generateBinauralBeat(carrierFrequency) {
    // Select beat frequency based on carrier
    let beatType = 'alpha'; // Default relaxation
    
    if (carrierFrequency < 100) beatType = 'delta';
    else if (carrierFrequency < 200) beatType = 'theta';
    else if (carrierFrequency < 400) beatType = 'alpha';
    else if (carrierFrequency < 800) beatType = 'beta';
    else beatType = 'gamma';
    
    const beat = this.config.binauralBeats[beatType];
    
    return {
      leftFrequency: carrierFrequency,
      rightFrequency: carrierFrequency + beat.frequency,
      beatFrequency: beat.frequency,
      brainwaveState: beat.state,
      type: beatType
    };
  }

  /**
   * 🔮 Find nearest sacred frequency
   */
  findSacredFrequency(frequency) {
    let nearest = null;
    let minDiff = Infinity;
    
    Object.entries(this.config.sacredFrequencies).forEach(([freq, meaning]) => {
      const diff = Math.abs(frequency - parseFloat(freq));
      if (diff < minDiff) {
        minDiff = diff;
        nearest = {
          frequency: parseFloat(freq),
          meaning,
          difference: diff,
          resonance: 1 - (diff / 100) // Resonance strength
        };
      }
    });
    
    return nearest;
  }

  /**
   * 🎵 Update harmonic state
   */
  updateHarmonicState(toneData) {
    this.harmonicState.currentRotation = toneData.rotation;
    this.harmonicState.activeFrequencies.add(toneData.frequency);
    
    // Keep only recent frequencies
    if (this.harmonicState.activeFrequencies.size > 12) {
      const frequencies = Array.from(this.harmonicState.activeFrequencies);
      this.harmonicState.activeFrequencies.delete(frequencies[0]);
    }
    
    // Calculate harmonic series alignment
    this.harmonicState.harmonicSeries = this.calculateHarmonicAlignment();
    
    // Update resonance level
    if (toneData.harmonic.isExact) {
      this.harmonicState.resonanceLevel = Math.min(1, this.harmonicState.resonanceLevel + 0.1);
    } else {
      this.harmonicState.resonanceLevel *= 0.95;
    }
    
    // Calculate cosmic alignment (all harmonics in perfect ratios)
    this.harmonicState.cosmicAlignment = this.calculateCosmicAlignment();
  }

  /**
   * 🌌 Calculate harmonic alignment
   */
  calculateHarmonicAlignment() {
    const frequencies = Array.from(this.harmonicState.activeFrequencies);
    const alignments = [];
    
    // Check relationships between all active frequencies
    for (let i = 0; i < frequencies.length; i++) {
      for (let j = i + 1; j < frequencies.length; j++) {
        const ratio = frequencies[j] / frequencies[i];
        const harmonic = this.identifyHarmonicRatio(ratio);
        
        if (harmonic) {
          alignments.push({
            freq1: frequencies[i],
            freq2: frequencies[j],
            ratio,
            harmonic
          });
        }
      }
    }
    
    return alignments;
  }

  /**
   * 🎶 Identify harmonic ratio
   */
  identifyHarmonicRatio(ratio) {
    const knownRatios = {
      1: 'Unison',
      2: 'Octave',
      1.5: 'Perfect fifth',
      1.333: 'Perfect fourth',
      1.25: 'Major third',
      1.2: 'Minor third',
      1.125: 'Major second'
    };
    
    for (const [targetRatio, name] of Object.entries(knownRatios)) {
      if (Math.abs(ratio - parseFloat(targetRatio)) < 0.01) {
        return name;
      }
    }
    
    return null;
  }

  /**
   * 🌟 Calculate cosmic alignment
   */
  calculateCosmicAlignment() {
    const alignmentFactors = {
      harmonicCount: this.harmonicState.harmonicSeries.length,
      resonanceLevel: this.harmonicState.resonanceLevel,
      sacredFrequencyActive: this.hasActiveSacredFrequency(),
      perfectIntervals: this.countPerfectIntervals()
    };
    
    // Weighted calculation
    const alignment = (
      alignmentFactors.harmonicCount * 0.3 +
      alignmentFactors.resonanceLevel * 0.3 +
      (alignmentFactors.sacredFrequencyActive ? 0.2 : 0) +
      alignmentFactors.perfectIntervals * 0.2
    );
    
    return Math.min(1, alignment);
  }

  /**
   * 🎵 Check for active sacred frequency
   */
  hasActiveSacredFrequency() {
    const sacredFreqs = Object.keys(this.config.sacredFrequencies).map(f => parseFloat(f));
    
    return Array.from(this.harmonicState.activeFrequencies).some(freq => {
      return sacredFreqs.some(sacred => Math.abs(freq - sacred) < 5);
    });
  }

  /**
   * 🎶 Count perfect intervals
   */
  countPerfectIntervals() {
    return this.harmonicState.harmonicSeries.filter(h => 
      ['Unison', 'Octave', 'Perfect fifth', 'Perfect fourth'].includes(h.harmonic)
    ).length;
  }

  /**
   * 🔊 Play tone (if audio context available)
   */
  async playTone(toneData, duration = 1000) {
    if (!this.synthesis.audioContext) {
      // Initialize audio context on first use
      try {
        this.synthesis.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.synthesis.masterGain = this.synthesis.audioContext.createGain();
        this.synthesis.masterGain.connect(this.synthesis.audioContext.destination);
        this.synthesis.masterGain.gain.value = 0.3;
      } catch (e) {
        console.warn('Audio context not available');
        return;
      }
    }
    
    const ctx = this.synthesis.audioContext;
    const now = ctx.currentTime;
    
    // Create oscillator for main tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.frequency.value = toneData.frequency;
    oscillator.type = 'sine';
    
    // Apply envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + duration / 1000); // Decay
    
    // Connect
    oscillator.connect(gainNode);
    gainNode.connect(this.synthesis.masterGain);
    
    // Add overtones for richness
    const overtoneGains = [];
    toneData.overtones.slice(1, 5).forEach((overtone, index) => {
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      
      overtoneOsc.frequency.value = overtone.frequency;
      overtoneOsc.type = index % 2 === 0 ? 'sine' : 'triangle';
      
      overtoneGain.gain.value = overtone.amplitude * 0.1;
      
      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(this.synthesis.masterGain);
      
      overtoneOsc.start(now);
      overtoneOsc.stop(now + duration / 1000);
      
      overtoneGains.push({ osc: overtoneOsc, gain: overtoneGain });
    });
    
    // Start and stop
    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
    
    // Store reference
    const id = Date.now();
    this.synthesis.activeOscillators.set(id, {
      main: oscillator,
      overtones: overtoneGains,
      startTime: now
    });
    
    // Clean up after stopping
    setTimeout(() => {
      this.synthesis.activeOscillators.delete(id);
    }, duration + 100);
    
    // Emit play event
    this.emit('tonePlaying', {
      toneData,
      duration,
      oscillatorId: id
    });
  }

  /**
   * 🎹 Play harmonic sequence
   */
  async playHarmonicSequence(rotations, tempo = 120) {
    console.log(`🎹 Playing harmonic sequence at ${tempo} BPM`);
    
    const beatDuration = 60000 / tempo; // ms per beat
    
    for (const rotation of rotations) {
      const toneData = this.rotationToTone(rotation, { binaural: true });
      
      console.log(`  🎵 ${rotation}° → ${toneData.frequency.toFixed(2)}Hz (${toneData.harmonic.name})`);
      
      await this.playTone(toneData, beatDuration * 0.9);
      await new Promise(resolve => setTimeout(resolve, beatDuration));
    }
    
    console.log('✅ Sequence complete');
    
    // Emit sequence complete
    this.emit('sequenceComplete', {
      rotations,
      tempo,
      cosmicAlignment: this.harmonicState.cosmicAlignment
    });
  }

  /**
   * 📊 Get harmonic analysis
   */
  getHarmonicAnalysis() {
    return {
      state: this.harmonicState,
      activeFrequencies: Array.from(this.harmonicState.activeFrequencies),
      harmonicRelationships: this.harmonicState.harmonicSeries,
      resonanceLevel: (this.harmonicState.resonanceLevel * 100).toFixed(1) + '%',
      cosmicAlignment: (this.harmonicState.cosmicAlignment * 100).toFixed(1) + '%',
      recommendation: this.getHarmonicRecommendation()
    };
  }

  /**
   * 💡 Get harmonic recommendation
   */
  getHarmonicRecommendation() {
    const alignment = this.harmonicState.cosmicAlignment;
    
    if (alignment > 0.8) {
      return '🌟 Perfect harmonic alignment! Cosmic resonance achieved.';
    } else if (alignment > 0.6) {
      return '✨ Strong harmonic presence. Add perfect fifths for more resonance.';
    } else if (alignment > 0.4) {
      return '🎵 Moderate alignment. Try rotating to harmonic angles (0°, 90°, 120°, 180°).';
    } else {
      return '🔄 Low harmonic alignment. Rotate to sacred angles for better resonance.';
    }
  }
}

// 🚀 Demo and testing
if (require.main === module) {
  console.log('🎵 ROTATION-TO-TONE MAPPER - DEMO MODE');
  console.log('=====================================\n');
  
  const mapper = new RotationToToneMapper();
  
  // Test different rotations
  console.log('🔄 Testing rotation mappings:\n');
  
  const testRotations = [0, 45, 90, 120, 180, 216, 270, 360];
  
  testRotations.forEach(rotation => {
    const tone = mapper.rotationToTone(rotation);
    console.log(`${rotation}° rotation:`);
    console.log(`  Frequency: ${tone.frequency.toFixed(2)}Hz`);
    console.log(`  Harmonic: ${tone.harmonic.name} (${tone.harmonic.isExact ? 'exact' : 'approximate'})`);
    console.log(`  Semantic: ${tone.semantic.type} region`);
    if (tone.sacred && tone.sacred.resonance > 0.5) {
      console.log(`  Sacred: ${tone.sacred.frequency}Hz - ${tone.sacred.meaning}`);
    }
    console.log('');
  });
  
  // Play harmonic sequence
  console.log('🎹 Harmonic sequence (perfect intervals):');
  const harmonicSequence = [0, 90, 120, 180, 240, 270, 360];
  
  // Note: In browser environment, this would actually play
  mapper.playHarmonicSequence(harmonicSequence, 60).then(() => {
    console.log('\n📊 Final harmonic analysis:');
    const analysis = mapper.getHarmonicAnalysis();
    console.log(`  Resonance: ${analysis.resonanceLevel}`);
    console.log(`  Cosmic Alignment: ${analysis.cosmicAlignment}`);
    console.log(`  ${analysis.recommendation}`);
  });
}

module.exports = RotationToToneMapper;
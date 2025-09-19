/**
 * 🪢🎵 MUSIC KNOT FRAMEWORK - WEB VERSION
 * Bridges mathematical knot theory with musical composition
 * Maps knot transformations to musical progressions
 */

class MusicKnotFramework {
  constructor() {
    // Initialize Web Audio API
    this.audioContext = null;
    this.masterGain = null;
    this.reverb = null;
    this.isInitialized = false;
    
    // Knot types to musical modes mapping
    this.knotMusicMap = {
      'trefoil': { 
        name: 'Lydian', 
        intervals: [0, 2, 4, 6, 7, 9, 11], 
        tempo: 120,
        color: '#9333ea' // Purple
      },
      'figure-eight': { 
        name: 'Dorian', 
        intervals: [0, 2, 3, 5, 7, 9, 10], 
        tempo: 100,
        color: '#2563eb' // Blue
      },
      'square': { 
        name: 'Major', 
        intervals: [0, 2, 4, 5, 7, 9, 11], 
        tempo: 140,
        color: '#10b981' // Green
      },
      'granny': { 
        name: 'Minor', 
        intervals: [0, 2, 3, 5, 7, 8, 10], 
        tempo: 80,
        color: '#dc2626' // Red
      },
      'torus': { 
        name: 'Phrygian', 
        intervals: [0, 1, 3, 5, 7, 8, 10], 
        tempo: 90,
        color: '#f97316' // Orange
      },
      'unknot': {
        name: 'Chromatic',
        intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        tempo: 60,
        color: '#6b7280' // Gray
      }
    };
    
    // Skill to frequency mapping (matching portfolio)
    this.skillToFrequency = {
      'javascript': { base: 60, pattern: [0, 4, 7, 12] }, // C major arpeggio
      'python': { base: 62, pattern: [0, 3, 7, 10] },     // D minor seventh
      'react': { base: 64, pattern: [0, 4, 7, 11] },      // E major seventh
      'nodejs': { base: 57, pattern: [0, 3, 7, 12] },     // A minor octave
      'ai': { base: 55, pattern: [0, 2, 5, 7, 10] },      // G pentatonic
      'blockchain': { base: 53, pattern: [0, 5, 7, 12] }, // F power chord
      'swift': { base: 65, pattern: [0, 4, 7, 9] },       // F major sixth
      'music': { base: 60, pattern: [0, 2, 4, 5, 7, 9, 11, 12] } // C major scale
    };
    
    // Current playing notes (for visualization)
    this.activeNotes = new Set();
    this.currentKnot = null;
  }
  
  // Initialize Web Audio API
  async init() {
    if (this.isInitialized) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;
    
    // Create reverb using convolver
    this.reverb = this.audioContext.createConvolver();
    await this.loadImpulseResponse();
    
    // Connect nodes
    this.reverb.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);
    
    this.isInitialized = true;
  }
  
  // Load reverb impulse response
  async loadImpulseResponse() {
    // Create synthetic impulse response for cathedral reverb
    const length = this.audioContext.sampleRate * 2; // 2 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    this.reverb.buffer = impulse;
  }
  
  // Create musical knot from game/skill data
  createMusicalKnot(data) {
    const knotType = this.determineKnotType(data);
    const mode = this.knotMusicMap[knotType];
    const chordProgression = this.generateChordProgression(knotType, data);
    
    const knot = {
      id: `knot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: knotType,
      data: data,
      mode: mode,
      chordProgression: chordProgression,
      crossings: this.calculateCrossings(knotType),
      writhe: this.calculateWrithe(knotType)
    };
    
    this.currentKnot = knot;
    return knot;
  }
  
  // Determine knot type from data
  determineKnotType(data) {
    if (data.skill) {
      // Map skills to knot types
      const skillKnotMap = {
        'javascript': 'trefoil',
        'python': 'figure-eight',
        'react': 'square',
        'nodejs': 'granny',
        'ai': 'torus',
        'blockchain': 'square',
        'swift': 'trefoil',
        'music': 'figure-eight'
      };
      return skillKnotMap[data.skill] || 'unknot';
    }
    
    // For game data, use complexity
    const complexity = data.level || 1;
    if (complexity <= 2) return 'unknot';
    if (complexity <= 4) return 'trefoil';
    if (complexity <= 6) return 'figure-eight';
    if (complexity <= 8) return 'square';
    return 'granny';
  }
  
  // Calculate crossings for knot type
  calculateCrossings(knotType) {
    const crossingMap = {
      'unknot': 0,
      'trefoil': 3,
      'figure-eight': 4,
      'square': 6,
      'granny': 6,
      'torus': 8
    };
    return crossingMap[knotType] || 0;
  }
  
  // Calculate writhe (signed crossing number)
  calculateWrithe(knotType) {
    const writheMap = {
      'unknot': 0,
      'trefoil': 3,
      'figure-eight': 0,
      'square': 2,
      'granny': -2,
      'torus': 4
    };
    return writheMap[knotType] || 0;
  }
  
  // Generate chord progression based on knot type
  generateChordProgression(knotType, data) {
    const progressions = {
      'trefoil': ['I', 'V', 'vi', 'IV'],      // Pop progression
      'figure-eight': ['i', 'iv', 'v', 'i'],  // Minor blues
      'square': ['I', 'IV', 'V', 'I'],        // Classic blues
      'granny': ['i', 'VII', 'VI', 'V'],      // Andalusian cadence
      'torus': ['I', 'bII', 'I', 'bVII'],     // Phrygian progression
      'unknot': ['I']                          // Static
    };
    
    return progressions[knotType] || ['I'];
  }
  
  // Play skill-based music
  async playSkillMusic(skill) {
    await this.init();
    
    const skillData = this.skillToFrequency[skill];
    if (!skillData) return;
    
    const knot = this.createMusicalKnot({ skill });
    const notes = this.generateNotesFromKnot(knot, skillData);
    
    this.playNoteSequence(notes);
    
    return knot;
  }
  
  // Generate notes from knot and skill data
  generateNotesFromKnot(knot, skillData) {
    const notes = [];
    const { base, pattern } = skillData;
    const mode = knot.mode;
    
    // Create pattern based on knot crossings
    const repetitions = Math.max(1, Math.floor(knot.crossings / 2));
    
    for (let rep = 0; rep < repetitions; rep++) {
      pattern.forEach((interval, index) => {
        const modeInterval = mode.intervals[interval % mode.intervals.length];
        const pitch = base + modeInterval + (rep * 12); // Octave jumps
        
        notes.push({
          frequency: this.midiToFrequency(pitch),
          startTime: (rep * pattern.length + index) * 0.25,
          duration: 0.2,
          velocity: 0.7 - (index * 0.1)
        });
      });
    }
    
    return notes;
  }
  
  // Convert MIDI note to frequency
  midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  
  // Play a sequence of notes
  playNoteSequence(notes) {
    const now = this.audioContext.currentTime;
    
    notes.forEach(note => {
      this.playTone(
        note.frequency,
        now + note.startTime,
        note.duration,
        note.velocity
      );
    });
  }
  
  // Play a single tone
  playTone(frequency, startTime, duration, velocity = 0.7) {
    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Set frequency and waveform
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = 'sine';
    
    // Create envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.reverb);
    
    // Schedule playback
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    
    // Track active notes for visualization
    this.activeNotes.add(frequency);
    setTimeout(() => {
      this.activeNotes.delete(frequency);
    }, duration * 1000);
  }
  
  // Apply Reidemeister move (knot transformation)
  applyReidemeisterMove(move, knot = this.currentKnot) {
    if (!knot) return null;
    
    // Create transformation sequence
    const sequence = [];
    
    switch (move) {
      case 'I': // Twist
        // Add ornamental notes
        sequence.push(...this.generateTwistSequence(knot));
        break;
      case 'II': // Poke
        // Modulation sequence
        sequence.push(...this.generateModulationSequence(knot));
        break;
      case 'III': // Slide
        // Smooth glide
        sequence.push(...this.generateSlideSequence(knot));
        break;
    }
    
    // Transform the knot
    const newKnot = {
      ...knot,
      id: knot.id + '_' + move,
      crossings: knot.crossings + (move === 'I' ? 1 : move === 'II' ? 2 : 0),
      writhe: knot.writhe + (move === 'I' ? 1 : 0)
    };
    
    this.currentKnot = newKnot;
    this.playNoteSequence(sequence);
    
    return { knot: newKnot, sequence };
  }
  
  // Generate twist sequence (Reidemeister I)
  generateTwistSequence(knot) {
    const baseFreq = this.midiToFrequency(60);
    const notes = [];
    
    // Trill pattern
    for (let i = 0; i < 8; i++) {
      notes.push({
        frequency: baseFreq * (i % 2 === 0 ? 1 : 1.0595), // Minor second
        startTime: i * 0.05,
        duration: 0.05,
        velocity: 0.6
      });
    }
    
    return notes;
  }
  
  // Generate modulation sequence (Reidemeister II)
  generateModulationSequence(knot) {
    const startFreq = this.midiToFrequency(60);
    const endFreq = this.midiToFrequency(67); // Perfect fifth up
    const notes = [];
    
    // Smooth modulation
    for (let i = 0; i < 8; i++) {
      const progress = i / 7;
      const frequency = startFreq + (endFreq - startFreq) * progress;
      
      notes.push({
        frequency,
        startTime: i * 0.1,
        duration: 0.12,
        velocity: 0.5
      });
    }
    
    return notes;
  }
  
  // Generate slide sequence (Reidemeister III)
  generateSlideSequence(knot) {
    const centerFreq = this.midiToFrequency(64);
    const notes = [];
    
    // Glissando effect
    for (let i = 0; i < 16; i++) {
      const offset = Math.sin((i / 15) * Math.PI) * 200; // Hz offset
      
      notes.push({
        frequency: centerFreq + offset,
        startTime: i * 0.03,
        duration: 0.05,
        velocity: 0.4
      });
    }
    
    return notes;
  }
  
  // Generate full soundtrack from knot sequence
  generateSoundtrack(knotSequence, options = {}) {
    const tracks = {
      bass: [],
      melody: [],
      harmony: [],
      percussion: []
    };
    
    let currentTime = 0;
    
    knotSequence.forEach((knot, index) => {
      const sectionDuration = 4 * knot.crossings; // 4 seconds per crossing
      
      // Generate each track layer
      tracks.bass.push(...this.generateBassLine(knot, currentTime));
      tracks.melody.push(...this.generateMelody(knot, currentTime));
      tracks.harmony.push(...this.generateHarmony(knot, currentTime));
      tracks.percussion.push(...this.generatePercussion(knot, currentTime));
      
      currentTime += sectionDuration;
    });
    
    return {
      tracks,
      duration: currentTime,
      tempo: knotSequence[0]?.mode.tempo || 120
    };
  }
  
  // Two-note topology generator (as mentioned by user)
  generateFromTwoNotes(note1, note2) {
    const interval = Math.abs(note2 - note1);
    let knotType;
    
    // Map intervals to knot types
    if (interval <= 2) knotType = 'unknot';        // Unison/minor 2nd
    else if (interval <= 4) knotType = 'trefoil';  // Minor/major 3rd
    else if (interval <= 6) knotType = 'figure-eight'; // 4th/tritone
    else if (interval <= 8) knotType = 'square';   // 5th/6th
    else if (interval <= 11) knotType = 'granny';  // Major 6th/7th
    else knotType = 'torus';                       // Octave+
    
    const knot = this.createMusicalKnot({ 
      type: 'interval',
      note1,
      note2,
      interval 
    });
    
    // Generate transition
    const notes = this.generateKnotTransition(note1, note2, knotType);
    this.playNoteSequence(notes);
    
    return { knot, notes };
  }
  
  // Generate knot-based transition between two notes
  generateKnotTransition(note1, note2, knotType) {
    const freq1 = this.midiToFrequency(note1);
    const freq2 = this.midiToFrequency(note2);
    const notes = [];
    
    // Start note
    notes.push({
      frequency: freq1,
      startTime: 0,
      duration: 0.5,
      velocity: 0.8
    });
    
    // Transition based on knot type
    const transitionPatterns = {
      'trefoil': [1/3, 2/3, 1],      // Three-fold symmetry
      'figure-eight': [0.25, 0.75, 0.5, 1], // Figure-8 pattern
      'square': [0.25, 0.5, 0.75, 1],      // Four equal steps
      'granny': [0.4, 0.9, 1],             // Asymmetric
      'torus': [0.2, 0.4, 0.6, 0.8, 1],   // Smooth spiral
      'unknot': [1]                         // Direct
    };
    
    const pattern = transitionPatterns[knotType] || [1];
    
    pattern.forEach((progress, index) => {
      if (progress < 1) {
        const frequency = freq1 + (freq2 - freq1) * progress;
        notes.push({
          frequency,
          startTime: 0.5 + index * 0.2,
          duration: 0.15,
          velocity: 0.6 - index * 0.1
        });
      }
    });
    
    // End note
    notes.push({
      frequency: freq2,
      startTime: 0.5 + pattern.length * 0.2,
      duration: 0.5,
      velocity: 0.8
    });
    
    return notes;
  }
  
  // Visualizer data
  getVisualizerData() {
    return {
      activeNotes: Array.from(this.activeNotes),
      currentKnot: this.currentKnot,
      knotTypes: Object.keys(this.knotMusicMap),
      isPlaying: this.activeNotes.size > 0
    };
  }
  
  // Clean up
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.activeNotes.clear();
    this.currentKnot = null;
    this.isInitialized = false;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MusicKnotFramework;
}
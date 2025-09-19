/**
 * SOULFRA VOICE RECORDER & LEARNING ENGINE
 * Real Web Audio API implementation for voice authentication and learning
 * Records, visualizes, creates unique voiceprints, and tracks learning progression
 */

class SoulfraVoiceRecorder {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.recorder = null;
    this.chunks = [];
    this.isRecording = false;
    this.visualizer = null;
    
    // Learning system properties
    this.learningSession = {
      startTime: null,
      recordings: [],
      currentSubject: null,
      skillLevel: 1,
      accuracy: 0,
      attempts: 0
    };
    
    // Voice analysis properties
    this.voiceMetrics = {
      pitch: [],
      volume: [],
      clarity: [],
      consistency: []
    };
    
    // Subject areas for horizontal learning
    this.subjects = {
      'oauth_mastery': { level: 1, progress: 0, unlocked: true },
      'voice_fluency': { level: 1, progress: 0, unlocked: true },
      'security_awareness': { level: 1, progress: 0, unlocked: false },
      'system_integration': { level: 1, progress: 0, unlocked: false },
      'automation_skills': { level: 1, progress: 0, unlocked: false }
    };
    
    this.setupEventHandlers();
  }

  async initialize() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser for visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      // Create recorder
      this.recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      
      this.recorder.onstop = () => {
        this.processRecording();
      };
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  startRecording() {
    if (!this.recorder || this.isRecording) return;
    
    this.chunks = [];
    this.recorder.start();
    this.isRecording = true;
    
    // Start visualization
    if (this.visualizer) {
      this.visualize();
    }
  }

  stopRecording() {
    if (!this.recorder || !this.isRecording) return;
    
    this.recorder.stop();
    this.isRecording = false;
    
    // Stop visualization
    if (this.visualizer) {
      cancelAnimationFrame(this.visualizer);
      this.visualizer = null;
    }
    
    // Log recording session
    this.learningSession.recordings.push({
      timestamp: new Date(),
      duration: Date.now() - this.learningSession.startTime,
      subject: this.learningSession.currentSubject,
      metrics: { ...this.voiceMetrics }
    });
  }
  
  // === LEARNING SESSION MANAGEMENT ===
  
  startLearningSession(subject = 'voice_fluency') {
    this.learningSession = {
      startTime: Date.now(),
      recordings: [],
      currentSubject: subject,
      skillLevel: this.subjects[subject]?.level || 1,
      accuracy: 0,
      attempts: 0
    };
    
    console.log(`🎓 Starting learning session: ${subject} (Level ${this.learningSession.skillLevel})`);
    this.emit('learningSessionStarted', { subject, level: this.learningSession.skillLevel });
  }
  
  endLearningSession() {
    const sessionSummary = {
      subject: this.learningSession.currentSubject,
      duration: Date.now() - this.learningSession.startTime,
      recordings: this.learningSession.recordings.length,
      accuracy: this.calculateSessionAccuracy(),
      progress: this.calculateProgress()
    };
    
    this.updateSubjectProgress(sessionSummary);
    this.saveLearningData();
    
    console.log('📊 Learning session complete:', sessionSummary);
    this.emit('learningSessionEnded', sessionSummary);
    
    return sessionSummary;
  }
  
  // === VOICE ANALYSIS AND LEARNING ===
  
  analyzeVoiceQuality() {
    if (!this.analyser) return;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Calculate voice metrics
    const volume = this.calculateVolume(dataArray);
    const pitch = this.estimatePitch(dataArray);
    const clarity = this.calculateClarity(dataArray);
    
    // Store metrics for learning
    this.voiceMetrics.volume.push(volume);
    this.voiceMetrics.pitch.push(pitch);
    this.voiceMetrics.clarity.push(clarity);
    
    // Keep only recent samples for performance
    Object.keys(this.voiceMetrics).forEach(key => {
      if (this.voiceMetrics[key].length > 100) {
        this.voiceMetrics[key] = this.voiceMetrics[key].slice(-50);
      }
    });
    
    return { volume, pitch, clarity };
  }
  
  calculateVolume(dataArray) {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  }
  
  estimatePitch(dataArray) {
    // Simple pitch estimation using dominant frequency
    let maxIndex = 0;
    let maxValue = 0;
    
    for (let i = 1; i < dataArray.length / 2; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    
    // Convert to approximate frequency
    const sampleRate = this.audioContext.sampleRate;
    const frequency = maxIndex * sampleRate / (2 * dataArray.length);
    return frequency;
  }
  
  calculateClarity(dataArray) {
    // Measure signal-to-noise ratio as clarity indicator
    const signal = Math.max(...dataArray);
    const noise = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    return signal / (noise + 1); // +1 to avoid division by zero
  }
  
  // === PROGRESS TRACKING ===
  
  calculateSessionAccuracy() {
    if (this.learningSession.attempts === 0) return 0;
    return (this.learningSession.accuracy / this.learningSession.attempts) * 100;
  }
  
  calculateProgress() {
    const recordings = this.learningSession.recordings.length;
    const avgClarity = this.getAverageMetric('clarity');
    const consistency = this.calculateConsistency();
    
    // Progress based on quantity, quality, and consistency
    return Math.min(100, (recordings * 10) + (avgClarity * 2) + (consistency * 30));
  }
  
  getAverageMetric(metric) {
    const values = this.voiceMetrics[metric];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  calculateConsistency() {
    // Measure how consistent voice patterns are
    const pitchVariance = this.calculateVariance(this.voiceMetrics.pitch);
    const volumeVariance = this.calculateVariance(this.voiceMetrics.volume);
    
    // Lower variance = higher consistency
    const maxVariance = 1000; // Normalize against this
    const pitchConsistency = Math.max(0, 1 - (pitchVariance / maxVariance));
    const volumeConsistency = Math.max(0, 1 - (volumeVariance / maxVariance));
    
    return (pitchConsistency + volumeConsistency) / 2;
  }
  
  calculateVariance(numbers) {
    if (numbers.length < 2) return 0;
    const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
    const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
    return variance;
  }
  
  updateSubjectProgress(sessionSummary) {
    const subject = sessionSummary.subject;
    if (!this.subjects[subject]) return;
    
    // Add progress based on session performance
    const progressGain = Math.min(25, sessionSummary.progress / 4);
    this.subjects[subject].progress += progressGain;
    
    // Level up if progress reaches 100
    if (this.subjects[subject].progress >= 100) {
      this.subjects[subject].level++;
      this.subjects[subject].progress = 0;
      this.unlockNewSubjects(subject);
      
      this.emit('levelUp', { subject, newLevel: this.subjects[subject].level });
    }
    
    this.emit('progressUpdate', { subject, progress: this.subjects[subject].progress });
  }
  
  unlockNewSubjects(completedSubject) {
    // Unlock progression rules
    const unlockRules = {
      'oauth_mastery': ['security_awareness'],
      'voice_fluency': ['system_integration'],
      'security_awareness': ['automation_skills'],
      'system_integration': ['automation_skills']
    };
    
    const toUnlock = unlockRules[completedSubject] || [];
    toUnlock.forEach(subject => {
      if (this.subjects[subject] && !this.subjects[subject].unlocked) {
        this.subjects[subject].unlocked = true;
        this.emit('subjectUnlocked', { subject });
      }
    });
  }
  
  // === EVENT SYSTEM ===
  
  setupEventHandlers() {
    // Create event emitter capability
    this.events = {};
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  // === DATA PERSISTENCE ===
  
  saveLearningData() {
    const learningData = {
      subjects: this.subjects,
      lastSession: this.learningSession,
      voiceProfile: {
        avgPitch: this.getAverageMetric('pitch'),
        avgVolume: this.getAverageMetric('volume'),
        avgClarity: this.getAverageMetric('clarity'),
        consistency: this.calculateConsistency()
      },
      timestamp: new Date()
    };
    
    try {
      localStorage.setItem('soulfra-learning-data', JSON.stringify(learningData));
    } catch (error) {
      console.warn('Could not save learning data:', error);
    }
  }
  
  loadLearningData() {
    try {
      const stored = localStorage.getItem('soulfra-learning-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.subjects = { ...this.subjects, ...data.subjects };
        
        console.log('📚 Learning data loaded:', this.subjects);
        return data;
      }
    } catch (error) {
      console.warn('Could not load learning data:', error);
    }
    return null;
  }
  
  // === VISUALIZATION METHODS ===
  
  visualize() {
    if (!this.analyser) return;
    
    const canvas = document.getElementById('voiceVisualizer');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!this.isRecording) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        // Color based on frequency (pitch visualization)
        const hue = (i / bufferLength) * 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      // Analyze voice quality in real-time
      this.analyzeVoiceQuality();
      
      this.visualizer = requestAnimationFrame(draw);
    };
    
    draw();
  }
  
  processRecording() {
    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    this.chunks = [];
    
    // Create audio URL for playback
    const audioURL = URL.createObjectURL(blob);
    
    // Emit recording complete event
    this.emit('recordingComplete', {
      blob,
      audioURL,
      duration: Date.now() - this.learningSession.startTime,
      metrics: { ...this.voiceMetrics }
    });
    
    return { blob, audioURL };
  }
  
  // === PUBLIC API METHODS ===
  
  getSubjects() {
    return this.subjects;
  }
  
  getCurrentSession() {
    return this.learningSession;
  }
  
  getVoiceMetrics() {
    return {
      current: this.voiceMetrics,
      averages: {
        pitch: this.getAverageMetric('pitch'),
        volume: this.getAverageMetric('volume'),
        clarity: this.getAverageMetric('clarity'),
        consistency: this.calculateConsistency()
      }
    };
  }
  
  canAccessSubject(subject) {
    return this.subjects[subject]?.unlocked || false;
  }
  
  getRecommendedSubject() {
    // Find the unlocked subject with lowest progress
    const unlocked = Object.entries(this.subjects)
      .filter(([_, data]) => data.unlocked)
      .sort((a, b) => a[1].progress - b[1].progress);
    
    return unlocked[0]?.[0] || 'voice_fluency';
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoulfraVoiceRecorder;
}
#!/usr/bin/env node

/**
 * 🌊 PLEASURE/VIBRATION ENCODER
 * 
 * Transforms topological knot data into haptic pleasure patterns
 * Maps mathematical topology to physical sensation through vibration
 * 
 * Core Innovation: Knot complexity → Haptic intensity
 * Patent Pending: Topological Vibration Encoding Method
 */

const EventEmitter = require('events');
const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

class PleasureVibrationEncoder extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 3017;
        this.wsPort = 3018;
        
        // Haptic pattern storage
        this.patterns = new Map();
        this.sessions = new Map();
        this.analytics = new Map();
        
        // Vibration encoding parameters
        this.config = {
            baseFrequency: 60,              // Hz - Base vibration frequency
            maxIntensity: 100,              // % - Maximum vibration strength
            patternDuration: 2000,          // ms - Default pattern length
            complexityThreshold: 50,        // Threshold for pattern complexity
            pleasureCoefficient: 0.8,       // How much to emphasize pleasure vs accuracy
            safetyLimits: {
                maxContinuous: 10000,       // ms - Max continuous vibration
                cooldownPeriod: 2000,       // ms - Required pause between intense patterns
                intensityRamp: 0.1          // Gradual intensity changes
            }
        };
        
        // Waveform types
        this.waveforms = {
            sine: (t, freq) => Math.sin(2 * Math.PI * freq * t),
            square: (t, freq) => Math.sign(Math.sin(2 * Math.PI * freq * t)),
            triangle: (t, freq) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t)),
            sawtooth: (t, freq) => 2 * (t * freq - Math.floor(0.5 + t * freq)),
            pulse: (t, freq, duty = 0.5) => t * freq % 1 < duty ? 1 : 0,
            pleasure: (t, freq) => Math.pow(Math.sin(Math.PI * freq * t), 2) // Smooth pleasure wave
        };
        
        // Pattern libraries
        this.patternLibrary = {
            gaming: {
                damage: { type: 'sharp', duration: 200, intensity: 80 },
                healing: { type: 'wave', duration: 1000, intensity: 30 },
                powerup: { type: 'crescendo', duration: 500, intensity: 70 },
                achievement: { type: 'celebration', duration: 800, intensity: 60 }
            },
            notification: {
                message: { type: 'gentle', duration: 300, intensity: 40 },
                call: { type: 'urgent', duration: 1000, intensity: 90 },
                reminder: { type: 'tap', duration: 150, intensity: 50 },
                alarm: { type: 'intense', duration: 2000, intensity: 100 }
            },
            meditation: {
                breathIn: { type: 'rise', duration: 4000, intensity: 20 },
                breathOut: { type: 'fall', duration: 6000, intensity: 15 },
                heartbeat: { type: 'pulse', duration: 800, intensity: 25 },
                flow: { type: 'wave', duration: 8000, intensity: 10 }
            },
            pleasure: {
                gentle: { type: 'soft_wave', duration: 3000, intensity: 30 },
                medium: { type: 'rhythmic', duration: 2000, intensity: 60 },
                intense: { type: 'complex_wave', duration: 5000, intensity: 85 },
                climax: { type: 'crescendo_release', duration: 10000, intensity: 95 }
            }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static('public'));
        
        // CORS for vibration API
        this.app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('X-Service', 'pleasure-vibration-encoder');
            res.setHeader('X-Pattern-Version', '1.0');
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'pleasure-vibration-encoder',
                patterns: this.patterns.size,
                sessions: this.sessions.size,
                uptime: process.uptime()
            });
        });
        
        // Encode knot to vibration pattern
        this.app.post('/encode/knot', async (req, res) => {
            try {
                const { knot, type, intensity } = req.body;
                const pattern = await this.encodeKnotToVibration(knot, type, intensity);
                
                res.json({
                    success: true,
                    patternId: pattern.id,
                    duration: pattern.duration,
                    complexity: pattern.complexity,
                    preview: pattern.preview
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Encode data directly to vibration
        this.app.post('/encode/data', async (req, res) => {
            try {
                const { data, dataType, style } = req.body;
                const pattern = await this.encodeDataToVibration(data, dataType, style);
                
                res.json({
                    success: true,
                    pattern,
                    webVibrationAPI: this.generateWebVibrationPattern(pattern)
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Generate ringtone pattern
        this.app.post('/ringtone/generate', async (req, res) => {
            try {
                const { personality, importance, style } = req.body;
                const ringtone = await this.generateRingtone(personality, importance, style);
                
                res.json({
                    success: true,
                    ringtone,
                    downloadUrl: `/download/ringtone/${ringtone.id}`
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get pattern library
        this.app.get('/patterns/:category?', (req, res) => {
            const category = req.params.category;
            
            if (category && this.patternLibrary[category]) {
                res.json({
                    category,
                    patterns: this.patternLibrary[category]
                });
            } else {
                res.json({
                    categories: Object.keys(this.patternLibrary),
                    total: Object.values(this.patternLibrary).reduce((sum, cat) => sum + Object.keys(cat).length, 0)
                });
            }
        });
        
        // Real-time pattern testing
        this.app.post('/test/pattern', async (req, res) => {
            try {
                const { pattern, deviceInfo } = req.body;
                const optimized = await this.optimizeForDevice(pattern, deviceInfo);
                
                res.json({
                    success: true,
                    optimizedPattern: optimized,
                    safetyCheck: this.validateSafety(optimized),
                    recommendations: this.getRecommendations(optimized)
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Analytics endpoint
        this.app.get('/analytics/:sessionId?', (req, res) => {
            const sessionId = req.params.sessionId;
            
            if (sessionId && this.analytics.has(sessionId)) {
                res.json(this.analytics.get(sessionId));
            } else {
                const aggregate = this.aggregateAnalytics();
                res.json(aggregate);
            }
        });
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
    }
    
    setupWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            const sessionId = this.generateSessionId();
            this.sessions.set(sessionId, {
                ws,
                startTime: Date.now(),
                patterns: 0,
                totalDuration: 0
            });
            
            console.log(`New vibration session: ${sessionId}`);
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(sessionId, message);
                } catch (error) {
                    ws.send(JSON.stringify({
                        error: error.message
                    }));
                }
            });
            
            ws.on('close', () => {
                this.sessions.delete(sessionId);
                console.log(`Session ended: ${sessionId}`);
            });
        });
    }
    
    async handleWebSocketMessage(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        switch (message.type) {
            case 'encode_realtime':
                const pattern = await this.encodeDataToVibration(
                    message.data, 
                    message.dataType, 
                    message.style
                );
                session.ws.send(JSON.stringify({
                    type: 'pattern_ready',
                    pattern,
                    webVibration: this.generateWebVibrationPattern(pattern)
                }));
                break;
                
            case 'test_vibration':
                const result = await this.testVibrationPattern(message.pattern);
                session.ws.send(JSON.stringify({
                    type: 'test_result',
                    result
                }));
                break;
                
            case 'analytics_request':
                const analytics = this.getSessionAnalytics(sessionId);
                session.ws.send(JSON.stringify({
                    type: 'analytics_data',
                    analytics
                }));
                break;
        }
    }
    
    // Core encoding functions
    async encodeKnotToVibration(knot, type = 'pleasure', intensityMultiplier = 1.0) {
        const patternId = this.generatePatternId();
        
        // Extract knot properties
        const crossings = knot.crossings || [];
        const writhe = knot.writhe || 0;
        const components = knot.components || 1;
        const complexity = this.calculateKnotComplexity(knot);
        
        // Map topology to vibration parameters
        const baseFreq = this.config.baseFrequency + (writhe * 5);
        const duration = Math.min(
            this.config.patternDuration,
            Math.max(500, crossings.length * 100)
        );
        
        // Generate time-series pattern
        const sampleRate = 100; // 100 samples per second
        const samples = Math.floor(duration * sampleRate / 1000);
        const pattern = [];
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const normalizedTime = t / (duration / 1000);
            
            // Base wave from knot writhe
            let amplitude = this.waveforms.pleasure(t, baseFreq / 60);
            
            // Add crossings as modulation
            crossings.forEach((crossing, idx) => {
                const crossingPhase = (idx / crossings.length) * Math.PI * 2;
                const crossingAmp = Math.abs(crossing.over - crossing.under) / 10;
                amplitude += crossingAmp * Math.sin(t * baseFreq + crossingPhase) * 0.3;
            });
            
            // Apply complexity envelope
            const envelope = this.generateEnvelope(normalizedTime, complexity);
            amplitude *= envelope * intensityMultiplier;
            
            // Clamp to safe limits
            amplitude = Math.max(0, Math.min(1, amplitude));
            
            pattern.push({
                time: t * 1000, // Convert to milliseconds
                intensity: amplitude * this.config.maxIntensity
            });
        }
        
        const vibrationPattern = {
            id: patternId,
            type,
            duration,
            complexity,
            pattern,
            metadata: {
                knotCrossings: crossings.length,
                writhe,
                components,
                baseFrequency: baseFreq,
                created: new Date().toISOString()
            }
        };
        
        this.patterns.set(patternId, vibrationPattern);
        
        return vibrationPattern;
    }
    
    async encodeDataToVibration(data, dataType, style = 'pleasure') {
        // First convert data to knot
        const knot = this.dataToKnot(data, dataType);
        
        // Then encode knot to vibration
        return this.encodeKnotToVibration(knot, style);
    }
    
    dataToKnot(data, dataType) {
        // Convert various data types to knot topology
        switch (dataType) {
            case 'text':
                return this.textToKnot(data);
            case 'number':
                return this.numberToKnot(data);
            case 'image':
                return this.imageToKnot(data);
            case 'audio':
                return this.audioToKnot(data);
            case 'heartbeat':
                return this.heartbeatToKnot(data);
            case 'emotion':
                return this.emotionToKnot(data);
            default:
                return this.genericDataToKnot(data);
        }
    }
    
    textToKnot(text) {
        const knot = {
            crossings: [],
            writhe: 0,
            components: 1
        };
        
        // Convert each character to crossings
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            const vowels = 'aeiouAEIOU';
            
            knot.crossings.push({
                over: i,
                under: (i + 1) % text.length,
                position: {
                    x: Math.cos(char * 0.1) * 10,
                    y: Math.sin(char * 0.1) * 10
                },
                intensity: vowels.includes(text[i]) ? 0.8 : 0.4
            });
            
            // Vowels add to writhe
            if (vowels.includes(text[i])) {
                knot.writhe += 1;
            }
        }
        
        return knot;
    }
    
    numberToKnot(number) {
        const binary = number.toString(2);
        const knot = {
            crossings: [],
            writhe: 0,
            components: 1
        };
        
        // Each bit creates a crossing
        for (let i = 0; i < binary.length; i++) {
            const bit = binary[i] === '1';
            
            knot.crossings.push({
                over: bit ? i : (i + 1) % binary.length,
                under: bit ? (i + 1) % binary.length : i,
                position: {
                    x: i * 2,
                    y: bit ? 1 : -1
                }
            });
            
            if (bit) knot.writhe += 1;
            else knot.writhe -= 1;
        }
        
        return knot;
    }
    
    heartbeatToKnot(heartData) {
        // Convert heart rate variability to knot
        const beats = heartData.intervals || [];
        const knot = {
            crossings: [],
            writhe: 0,
            components: 1
        };
        
        // Each beat interval creates crossings
        for (let i = 0; i < beats.length - 1; i++) {
            const interval1 = beats[i];
            const interval2 = beats[i + 1];
            const variability = Math.abs(interval2 - interval1);
            
            knot.crossings.push({
                over: i,
                under: i + 1,
                position: {
                    x: interval1,
                    y: interval2
                },
                intensity: variability / 100 // Normalize variability
            });
            
            // Increasing interval = positive writhe
            if (interval2 > interval1) {
                knot.writhe += 1;
            } else {
                knot.writhe -= 1;
            }
        }
        
        return knot;
    }
    
    emotionToKnot(emotion) {
        // Map emotions to topological structures
        const emotionMaps = {
            joy: { crossings: 3, writhe: 2, shape: 'trefoil' },
            sadness: { crossings: 0, writhe: -1, shape: 'unknot' },
            anger: { crossings: 5, writhe: 3, shape: 'twist' },
            fear: { crossings: 7, writhe: -2, shape: 'figure8' },
            love: { crossings: 2, writhe: 0, shape: 'hopf' },
            excitement: { crossings: 4, writhe: 4, shape: 'torus' }
        };
        
        const map = emotionMaps[emotion.type] || emotionMaps.joy;
        const intensity = emotion.intensity || 0.5;
        
        const knot = {
            crossings: [],
            writhe: map.writhe * intensity,
            components: 1
        };
        
        // Generate crossings based on emotion type
        for (let i = 0; i < map.crossings; i++) {
            const angle = (i / map.crossings) * 2 * Math.PI;
            knot.crossings.push({
                over: i,
                under: (i + 1) % map.crossings,
                position: {
                    x: Math.cos(angle) * intensity * 10,
                    y: Math.sin(angle) * intensity * 10
                },
                intensity: intensity
            });
        }
        
        return knot;
    }
    
    genericDataToKnot(data) {
        // Convert any data to knot using hash
        const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest();
        const knot = {
            crossings: [],
            writhe: 0,
            components: 1
        };
        
        // Use hash bytes to generate crossings
        for (let i = 0; i < Math.min(hash.length - 1, 16); i++) {
            const byte1 = hash[i];
            const byte2 = hash[i + 1];
            
            knot.crossings.push({
                over: byte1 % 10,
                under: byte2 % 10,
                position: {
                    x: (byte1 - 128) / 128 * 10,
                    y: (byte2 - 128) / 128 * 10
                }
            });
            
            if (byte1 > byte2) knot.writhe += 1;
            else knot.writhe -= 1;
        }
        
        return knot;
    }
    
    calculateKnotComplexity(knot) {
        const crossings = knot.crossings?.length || 0;
        const writhe = Math.abs(knot.writhe || 0);
        const components = knot.components || 1;
        
        return crossings * 10 + writhe * 5 + components * 3;
    }
    
    generateEnvelope(normalizedTime, complexity) {
        // Generate amplitude envelope based on complexity
        if (complexity < 20) {
            // Simple gentle curve
            return Math.sin(normalizedTime * Math.PI);
        } else if (complexity < 50) {
            // More complex with multiple peaks
            return Math.sin(normalizedTime * Math.PI) * (1 + 0.3 * Math.sin(normalizedTime * Math.PI * 3));
        } else {
            // Complex envelope with crescendo
            const base = Math.sin(normalizedTime * Math.PI);
            const crescendo = Math.pow(normalizedTime, 2);
            const modulation = 0.2 * Math.sin(normalizedTime * Math.PI * 5);
            return base * (0.5 + 0.5 * crescendo) + modulation;
        }
    }
    
    generateWebVibrationPattern(pattern) {
        // Convert our pattern to Web Vibration API format
        const webPattern = [];
        
        pattern.pattern.forEach((sample, i) => {
            const duration = i < pattern.pattern.length - 1 ? 
                pattern.pattern[i + 1].time - sample.time : 100;
                
            // Vibrate
            webPattern.push(Math.floor(duration * sample.intensity / 100));
            // Pause (brief)
            webPattern.push(Math.floor(duration * (1 - sample.intensity / 100) * 0.1));
        });
        
        // Ensure pattern isn't too long for mobile browsers
        return webPattern.slice(0, 100);
    }
    
    async generateRingtone(personality, importance = 0.5, style = 'notification') {
        const ringtoneId = this.generatePatternId();
        
        // Map personality to knot characteristics
        const personalityKnot = this.personalityToKnot(personality);
        
        // Adjust for importance
        const importanceMultiplier = 0.5 + importance;
        
        // Generate vibration pattern
        const vibrationPattern = await this.encodeKnotToVibration(
            personalityKnot, 
            style, 
            importanceMultiplier
        );
        
        // Generate audio pattern (simplified)
        const audioPattern = this.generateAudioFromKnot(personalityKnot, importance);
        
        const ringtone = {
            id: ringtoneId,
            personality,
            importance,
            style,
            vibration: vibrationPattern,
            audio: audioPattern,
            webVibration: this.generateWebVibrationPattern(vibrationPattern),
            created: new Date().toISOString()
        };
        
        return ringtone;
    }
    
    personalityToKnot(personality) {
        // Map personality traits to topological features
        const traits = {
            openness: personality.openness || 0.5,
            conscientiousness: personality.conscientiousness || 0.5,
            extraversion: personality.extraversion || 0.5,
            agreeableness: personality.agreeableness || 0.5,
            neuroticism: personality.neuroticism || 0.5
        };
        
        const knot = {
            crossings: [],
            writhe: Math.floor((traits.extraversion - 0.5) * 10),
            components: Math.max(1, Math.floor(traits.openness * 3))
        };
        
        // Generate crossings based on personality
        const numCrossings = Math.floor(2 + traits.conscientiousness * 8);
        
        for (let i = 0; i < numCrossings; i++) {
            const angle = (i / numCrossings) * 2 * Math.PI * traits.openness;
            const radius = 5 + traits.agreeableness * 5;
            
            knot.crossings.push({
                over: i,
                under: (i + 1) % numCrossings,
                position: {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius
                },
                intensity: 0.3 + traits.neuroticism * 0.7
            });
        }
        
        return knot;
    }
    
    generateAudioFromKnot(knot, importance) {
        // Generate audio frequencies from knot topology
        const baseFreq = 220 + (knot.writhe * 20); // A3 + variations
        const crossings = knot.crossings?.length || 0;
        
        return {
            frequencies: [
                baseFreq,
                baseFreq * 1.25, // Major third
                baseFreq * 1.5   // Perfect fifth
            ],
            duration: 500 + (crossings * 100) + (importance * 1000),
            waveform: crossings > 5 ? 'square' : 'sine'
        };
    }
    
    // Safety and optimization
    validateSafety(pattern) {
        const safety = {
            passed: true,
            warnings: [],
            recommendations: []
        };
        
        // Check duration
        if (pattern.duration > this.config.safetyLimits.maxContinuous) {
            safety.passed = false;
            safety.warnings.push('Pattern duration exceeds safe limits');
            safety.recommendations.push('Split into shorter segments with breaks');
        }
        
        // Check intensity
        const maxIntensity = Math.max(...pattern.pattern.map(p => p.intensity));
        if (maxIntensity > 95) {
            safety.warnings.push('Very high intensity detected');
            safety.recommendations.push('Consider reducing peak intensity');
        }
        
        // Check rapid changes
        let rapidChanges = 0;
        for (let i = 1; i < pattern.pattern.length; i++) {
            const intensityChange = Math.abs(
                pattern.pattern[i].intensity - pattern.pattern[i-1].intensity
            );
            if (intensityChange > 50) {
                rapidChanges++;
            }
        }
        
        if (rapidChanges > pattern.pattern.length * 0.3) {
            safety.warnings.push('Many rapid intensity changes detected');
            safety.recommendations.push('Smooth intensity transitions');
        }
        
        return safety;
    }
    
    optimizeForDevice(pattern, deviceInfo) {
        // Optimize pattern for specific device capabilities
        const optimized = JSON.parse(JSON.stringify(pattern));
        
        if (deviceInfo.type === 'mobile') {
            // Mobile devices have limited vibration capabilities
            optimized.pattern = optimized.pattern.map(sample => ({
                ...sample,
                intensity: Math.min(sample.intensity, 80) // Cap intensity
            }));
        }
        
        if (deviceInfo.batteryLevel && deviceInfo.batteryLevel < 0.2) {
            // Reduce power consumption for low battery
            optimized.pattern = optimized.pattern.map(sample => ({
                ...sample,
                intensity: sample.intensity * 0.7
            }));
        }
        
        return optimized;
    }
    
    // Analytics and utilities
    getSessionAnalytics(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        
        return {
            sessionId,
            duration: Date.now() - session.startTime,
            patternsGenerated: session.patterns,
            totalVibrationTime: session.totalDuration,
            avgPatternComplexity: session.avgComplexity || 0
        };
    }
    
    aggregateAnalytics() {
        const sessions = Array.from(this.sessions.values());
        const patterns = Array.from(this.patterns.values());
        
        return {
            totalSessions: sessions.length,
            totalPatterns: patterns.length,
            avgSessionDuration: sessions.reduce((sum, s) => sum + (Date.now() - s.startTime), 0) / sessions.length,
            complexityDistribution: this.getComplexityDistribution(patterns),
            popularTypes: this.getPopularTypes(patterns)
        };
    }
    
    getComplexityDistribution(patterns) {
        const buckets = { low: 0, medium: 0, high: 0, extreme: 0 };
        
        patterns.forEach(pattern => {
            const complexity = pattern.complexity || 0;
            if (complexity < 20) buckets.low++;
            else if (complexity < 50) buckets.medium++;
            else if (complexity < 100) buckets.high++;
            else buckets.extreme++;
        });
        
        return buckets;
    }
    
    getPopularTypes(patterns) {
        const types = {};
        patterns.forEach(pattern => {
            types[pattern.type] = (types[pattern.type] || 0) + 1;
        });
        return types;
    }
    
    getRecommendations(pattern) {
        const recommendations = [];
        
        if (pattern.complexity > 80) {
            recommendations.push('Consider simplifying pattern for better user experience');
        }
        
        if (pattern.duration > 5000) {
            recommendations.push('Long patterns may cause fatigue - consider breaks');
        }
        
        const avgIntensity = pattern.pattern.reduce((sum, p) => sum + p.intensity, 0) / pattern.pattern.length;
        if (avgIntensity < 20) {
            recommendations.push('Pattern may be too subtle - consider increasing intensity');
        }
        
        return recommendations;
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generatePatternId() {
        return 'pattern_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Pleasure/Vibration Encoder - Feel Your Data</title>
    <style>
        body {
            font-family: -apple-system, monospace;
            background: #000;
            color: #ff00ff;
            margin: 0;
            padding: 20px;
            background-image: 
                radial-gradient(circle at 25% 25%, rgba(255, 0, 255, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(0, 255, 255, 0.2) 0%, transparent 50%);
        }
        .header {
            text-align: center;
            padding: 30px;
            border: 2px solid #ff00ff;
            margin-bottom: 30px;
            background: rgba(255, 0, 255, 0.1);
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -100%;
            left: -100%;
            width: 300%;
            height: 300%;
            background: linear-gradient(45deg, transparent, rgba(255, 0, 255, 0.3), transparent);
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
            50% { transform: scale(1.1) rotate(180deg); opacity: 0.7; }
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .panel {
            background: rgba(255, 0, 255, 0.05);
            border: 1px solid #ff00ff;
            padding: 20px;
            border-radius: 10px;
            position: relative;
        }
        .vibration-visualizer {
            width: 100%;
            height: 200px;
            background: #111;
            border: 1px solid #ff00ff;
            margin: 15px 0;
            position: relative;
            overflow: hidden;
        }
        #vibrationCanvas {
            width: 100%;
            height: 100%;
        }
        .input-area {
            width: 100%;
            min-height: 80px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #ff00ff;
            color: #ff00ff;
            padding: 10px;
            font-family: monospace;
            resize: vertical;
            border-radius: 5px;
        }
        button {
            background: linear-gradient(45deg, #ff00ff, #ff0080);
            color: #fff;
            border: none;
            padding: 12px 24px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 8px;
            margin: 5px;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        button:hover {
            background: linear-gradient(45deg, #ff0080, #ff00ff);
            box-shadow: 0 0 30px #ff00ff;
            transform: translateY(-2px);
        }
        .vibe-button {
            background: linear-gradient(45deg, #00ffff, #0080ff);
            font-size: 18px;
            padding: 15px 30px;
            animation: rainbow 3s ease-in-out infinite;
        }
        @keyframes rainbow {
            0%, 100% { background: linear-gradient(45deg, #ff00ff, #ff0080); }
            33% { background: linear-gradient(45deg, #00ffff, #0080ff); }
            66% { background: linear-gradient(45deg, #80ff00, #00ff80); }
        }
        .pattern-library {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 15px 0;
        }
        .pattern-card {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #ff00ff;
            padding: 10px;
            text-align: center;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s;
        }
        .pattern-card:hover {
            background: rgba(255, 0, 255, 0.2);
            transform: scale(1.05);
        }
        .intensity-meter {
            width: 100%;
            height: 20px;
            background: #111;
            border: 1px solid #ff00ff;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .intensity-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff);
            width: 0%;
            transition: width 0.3s ease;
            animation: flow 2s ease-in-out infinite;
        }
        @keyframes flow {
            0%, 100% { background: linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff); }
            50% { background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff); }
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        .stat {
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            text-align: center;
            border-radius: 5px;
            border: 1px solid #ff00ff;
        }
        .stat-value {
            font-size: 24px;
            color: #00ffff;
            margin-top: 5px;
        }
        .encoder-types {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 15px 0;
        }
        .encoder-type {
            background: rgba(255, 0, 255, 0.1);
            border: 1px solid #ff00ff;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s;
        }
        .encoder-type:hover {
            background: rgba(255, 0, 255, 0.3);
            transform: translateY(-3px);
        }
        .encoder-type.selected {
            border-color: #00ffff;
            background: rgba(0, 255, 255, 0.2);
        }
        .real-time-viz {
            position: relative;
            width: 100%;
            height: 150px;
            background: #000;
            border: 1px solid #ff00ff;
            overflow: hidden;
            margin: 15px 0;
        }
        .wave {
            position: absolute;
            width: 200%;
            height: 100%;
            background: linear-gradient(90deg, transparent, #ff00ff, transparent);
            animation: wave 3s linear infinite;
        }
        @keyframes wave {
            from { transform: translateX(-100%); }
            to { transform: translateX(0%); }
        }
        .device-selector {
            background: #111;
            color: #ff00ff;
            border: 1px solid #ff00ff;
            padding: 8px;
            border-radius: 5px;
            margin: 5px;
        }
        #patternOutput {
            background: rgba(0, 0, 0, 0.8);
            color: #00ffff;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            border: 1px solid #00ffff;
            max-height: 200px;
            overflow-y: auto;
        }
        .safety-indicator {
            display: inline-block;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin: 0 10px;
        }
        .safety-indicator.safe { background: #00ff00; }
        .safety-indicator.warning { background: #ffff00; }
        .safety-indicator.danger { background: #ff0000; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌊 PLEASURE/VIBRATION ENCODER</h1>
        <p>Transform Data into Physical Sensation • Feel Your Information</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div>Active Patterns</div>
            <div class="stat-value" id="patternCount">0</div>
        </div>
        <div class="stat">
            <div>Total Vibrations</div>
            <div class="stat-value" id="vibrationCount">0</div>
        </div>
        <div class="stat">
            <div>Sessions</div>
            <div class="stat-value" id="sessionCount">0</div>
        </div>
        <div class="stat">
            <div>Avg Complexity</div>
            <div class="stat-value" id="avgComplexity">0</div>
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h3>📱 Data Encoder</h3>
            <div class="encoder-types">
                <div class="encoder-type selected" data-type="text">📝 Text</div>
                <div class="encoder-type" data-type="emotion">😊 Emotion</div>
                <div class="encoder-type" data-type="heartbeat">❤️ Heart</div>
                <div class="encoder-type" data-type="number">🔢 Number</div>
            </div>
            
            <textarea id="dataInput" class="input-area" placeholder="Enter text, emotion, or data to encode into vibration...">Hello, this is a test of pleasure encoding!</textarea>
            
            <div style="margin: 15px 0;">
                <label>Intensity: </label>
                <input type="range" id="intensitySlider" min="0.1" max="2.0" step="0.1" value="1.0" style="width: 150px;">
                <span id="intensityValue">1.0x</span>
            </div>
            
            <button class="vibe-button" onclick="encodeAndVibrate()">🌊 ENCODE & FEEL</button>
            <button onclick="testWebVibration()">📱 Test Web Vibration</button>
        </div>
        
        <div class="panel">
            <h3>🎨 Pattern Library</h3>
            <div class="pattern-library">
                <div class="pattern-card" onclick="loadPattern('gaming', 'damage')">
                    <div>⚔️ Damage</div>
                    <div style="font-size: 12px;">Sharp, intense</div>
                </div>
                <div class="pattern-card" onclick="loadPattern('gaming', 'healing')">
                    <div>💚 Healing</div>
                    <div style="font-size: 12px;">Gentle waves</div>
                </div>
                <div class="pattern-card" onclick="loadPattern('meditation', 'breathIn')">
                    <div>🧘 Breath In</div>
                    <div style="font-size: 12px;">Rising flow</div>
                </div>
                <div class="pattern-card" onclick="loadPattern('pleasure', 'gentle')">
                    <div>🌸 Gentle</div>
                    <div style="font-size: 12px;">Soft pleasure</div>
                </div>
                <div class="pattern-card" onclick="loadPattern('notification', 'urgent')">
                    <div>🚨 Urgent</div>
                    <div style="font-size: 12px;">Attention grab</div>
                </div>
                <div class="pattern-card" onclick="loadPattern('pleasure', 'climax')">
                    <div>🔥 Intense</div>
                    <div style="font-size: 12px;">Peak experience</div>
                </div>
            </div>
            
            <div style="margin-top: 15px;">
                <label>Device: </label>
                <select class="device-selector" id="deviceType">
                    <option value="mobile">📱 Mobile</option>
                    <option value="desktop">💻 Desktop</option>
                    <option value="vr">🥽 VR Headset</option>
                    <option value="gamepad">🎮 Gamepad</option>
                </select>
            </div>
        </div>
    </div>
    
    <div class="panel">
        <h3>🌊 Real-time Visualization</h3>
        <div class="vibration-visualizer">
            <canvas id="vibrationCanvas"></canvas>
            <div class="wave"></div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div>
                <label>Complexity:</label>
                <div class="intensity-meter">
                    <div class="intensity-fill" id="complexityBar" style="width: 0%;"></div>
                </div>
            </div>
            <div>
                <label>Safety:</label>
                <span class="safety-indicator safe" id="safetyIndicator"></span>
                <span id="safetyText">Safe</span>
            </div>
            <div>
                <label>Duration:</label>
                <span id="durationDisplay">0ms</span>
            </div>
        </div>
    </div>
    
    <div class="panel">
        <h3>🎵 Ringtone Generator</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <h4>Personality (Big 5)</h4>
                <div style="margin: 10px 0;">
                    <label>Openness: </label>
                    <input type="range" id="openness" min="0" max="1" step="0.1" value="0.5">
                </div>
                <div style="margin: 10px 0;">
                    <label>Conscientiousness: </label>
                    <input type="range" id="conscientiousness" min="0" max="1" step="0.1" value="0.5">
                </div>
                <div style="margin: 10px 0;">
                    <label>Extraversion: </label>
                    <input type="range" id="extraversion" min="0" max="1" step="0.1" value="0.5">
                </div>
                <div style="margin: 10px 0;">
                    <label>Agreeableness: </label>
                    <input type="range" id="agreeableness" min="0" max="1" step="0.1" value="0.5">
                </div>
                <div style="margin: 10px 0;">
                    <label>Neuroticism: </label>
                    <input type="range" id="neuroticism" min="0" max="1" step="0.1" value="0.5">
                </div>
            </div>
            <div>
                <h4>Settings</h4>
                <div style="margin: 10px 0;">
                    <label>Importance: </label>
                    <input type="range" id="importance" min="0" max="1" step="0.1" value="0.5">
                </div>
                <div style="margin: 10px 0;">
                    <label>Style: </label>
                    <select class="device-selector" id="ringtoneStyle">
                        <option value="notification">Notification</option>
                        <option value="gaming">Gaming</option>
                        <option value="meditation">Meditation</option>
                        <option value="pleasure">Pleasure</option>
                    </select>
                </div>
                <button onclick="generateRingtone()">🎵 Generate Ringtone</button>
            </div>
        </div>
    </div>
    
    <div class="panel">
        <h3>📊 Pattern Output</h3>
        <div id="patternOutput">
            No pattern generated yet. Encode some data to see the output!
        </div>
    </div>
    
    <script>
        let ws;
        let currentPattern = null;
        let selectedDataType = 'text';
        let vibrationCanvas, ctx;
        let animationId;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            initWebSocket();
            initCanvas();
            updateIntensityDisplay();
            
            // Event listeners
            document.getElementById('intensitySlider').addEventListener('input', updateIntensityDisplay);
            
            // Data type selection
            document.querySelectorAll('.encoder-type').forEach(el => {
                el.addEventListener('click', () => {
                    document.querySelectorAll('.encoder-type').forEach(e => e.classList.remove('selected'));
                    el.classList.add('selected');
                    selectedDataType = el.dataset.type;
                    updatePlaceholder();
                });
            });
        });
        
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:3018');
            
            ws.onopen = () => {
                console.log('Connected to vibration encoder');
                updateStats();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                console.log('Disconnected from vibration encoder');
                setTimeout(initWebSocket, 5000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'pattern_ready':
                    currentPattern = data.pattern;
                    displayPattern(data.pattern);
                    visualizePattern(data.pattern);
                    if (data.webVibration && navigator.vibrate) {
                        navigator.vibrate(data.webVibration);
                    }
                    break;
                case 'test_result':
                    console.log('Test result:', data.result);
                    break;
                case 'analytics_data':
                    updateAnalytics(data.analytics);
                    break;
            }
        }
        
        function initCanvas() {
            vibrationCanvas = document.getElementById('vibrationCanvas');
            ctx = vibrationCanvas.getContext('2d');
            vibrationCanvas.width = vibrationCanvas.offsetWidth;
            vibrationCanvas.height = vibrationCanvas.offsetHeight;
        }
        
        function updateIntensityDisplay() {
            const value = document.getElementById('intensitySlider').value;
            document.getElementById('intensityValue').textContent = value + 'x';
        }
        
        function updatePlaceholder() {
            const placeholders = {
                text: 'Enter text to encode into vibration patterns...',
                emotion: 'Enter emotion data: {"type": "joy", "intensity": 0.8}',
                heartbeat: 'Enter heartbeat data: {"intervals": [800, 820, 790, 810]}',
                number: 'Enter a number to convert to vibration: 42'
            };
            
            document.getElementById('dataInput').placeholder = placeholders[selectedDataType] || placeholders.text;
        }
        
        async function encodeAndVibrate() {
            const input = document.getElementById('dataInput').value;
            const intensity = parseFloat(document.getElementById('intensitySlider').value);
            
            if (!input.trim()) {
                alert('Please enter some data to encode');
                return;
            }
            
            let data;
            try {
                // Try to parse as JSON for structured data
                data = JSON.parse(input);
            } catch {
                // Treat as plain text
                data = input;
            }
            
            // Send encoding request via WebSocket
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'encode_realtime',
                    data: data,
                    dataType: selectedDataType,
                    style: 'pleasure',
                    intensity: intensity
                }));
            } else {
                // Fallback to HTTP API
                try {
                    const response = await fetch('/encode/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            data: data,
                            dataType: selectedDataType,
                            style: 'pleasure'
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        currentPattern = result.pattern;
                        displayPattern(result.pattern);
                        visualizePattern(result.pattern);
                        
                        // Try web vibration
                        if (result.webVibrationAPI && navigator.vibrate) {
                            navigator.vibrate(result.webVibrationAPI);
                        }
                    }
                } catch (error) {
                    console.error('Encoding failed:', error);
                    alert('Encoding failed: ' + error.message);
                }
            }
        }
        
        function testWebVibration() {
            if (!navigator.vibrate) {
                alert('Vibration API not supported on this device');
                return;
            }
            
            // Test pattern: short-long-short
            navigator.vibrate([200, 100, 300, 100, 200]);
        }
        
        async function loadPattern(category, pattern) {
            try {
                const response = await fetch(\`/patterns/\${category}\`);
                const data = await response.json();
                
                if (data.patterns && data.patterns[pattern]) {
                    const patternData = data.patterns[pattern];
                    
                    // Convert pattern data to our format
                    const mockKnot = {
                        crossings: [
                            { over: 0, under: 1, position: { x: 0, y: 0 }, intensity: patternData.intensity / 100 }
                        ],
                        writhe: patternData.type === 'sharp' ? 2 : 0,
                        components: 1
                    };
                    
                    // Encode the pattern
                    const response2 = await fetch('/encode/knot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            knot: mockKnot,
                            type: category,
                            intensity: patternData.intensity / 100
                        })
                    });
                    
                    const result = await response2.json();
                    if (result.success) {
                        console.log('Pattern loaded:', pattern);
                        
                        // Trigger vibration if supported
                        if (navigator.vibrate) {
                            const webPattern = generateWebPatternFromLibrary(patternData);
                            navigator.vibrate(webPattern);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load pattern:', error);
            }
        }
        
        function generateWebPatternFromLibrary(patternData) {
            // Convert library pattern to web vibration format
            switch (patternData.type) {
                case 'sharp':
                    return [patternData.duration * 0.8, patternData.duration * 0.2];
                case 'wave':
                    return [100, 50, 150, 50, 200, 50, 150, 50, 100];
                case 'pulse':
                    return [80, 80, 80, 80, 80];
                case 'crescendo':
                    return [50, 25, 100, 25, 150, 25, 200, 25, 250];
                default:
                    return [patternData.duration];
            }
        }
        
        async function generateRingtone() {
            const personality = {
                openness: parseFloat(document.getElementById('openness').value),
                conscientiousness: parseFloat(document.getElementById('conscientiousness').value),
                extraversion: parseFloat(document.getElementById('extraversion').value),
                agreeableness: parseFloat(document.getElementById('agreeableness').value),
                neuroticism: parseFloat(document.getElementById('neuroticism').value)
            };
            
            const importance = parseFloat(document.getElementById('importance').value);
            const style = document.getElementById('ringtoneStyle').value;
            
            try {
                const response = await fetch('/ringtone/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        personality,
                        importance,
                        style
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    currentPattern = result.ringtone.vibration;
                    displayPattern(result.ringtone.vibration);
                    visualizePattern(result.ringtone.vibration);
                    
                    // Test the ringtone vibration
                    if (result.ringtone.webVibration && navigator.vibrate) {
                        navigator.vibrate(result.ringtone.webVibration);
                    }
                    
                    alert('Ringtone generated! Check the pattern output below.');
                }
            } catch (error) {
                console.error('Ringtone generation failed:', error);
                alert('Failed to generate ringtone: ' + error.message);
            }
        }
        
        function displayPattern(pattern) {
            const output = document.getElementById('patternOutput');
            
            const summary = \`
Pattern ID: \${pattern.id}
Type: \${pattern.type}
Duration: \${pattern.duration}ms
Complexity: \${pattern.complexity}
Crossings: \${pattern.metadata?.knotCrossings || 'N/A'}
Writhe: \${pattern.metadata?.writhe || 'N/A'}

Sample Points (\${pattern.pattern.length}):
\${pattern.pattern.slice(0, 10).map((p, i) => 
    \`\${i}: \${p.time.toFixed(0)}ms @ \${p.intensity.toFixed(1)}%\`
).join('\\n')}
\${pattern.pattern.length > 10 ? '...' : ''}

WebVibration Pattern:
[\${generateWebVibrationFromPattern(pattern).slice(0, 20).join(', ')}\${pattern.pattern.length > 20 ? '...' : ''}]
            \`.trim();
            
            output.textContent = summary;
            
            // Update UI elements
            document.getElementById('complexityBar').style.width = Math.min(100, pattern.complexity) + '%';
            document.getElementById('durationDisplay').textContent = pattern.duration + 'ms';
            
            // Update safety indicator
            const safetyCheck = validatePatternSafety(pattern);
            const indicator = document.getElementById('safetyIndicator');
            const text = document.getElementById('safetyText');
            
            if (safetyCheck.safe) {
                indicator.className = 'safety-indicator safe';
                text.textContent = 'Safe';
            } else if (safetyCheck.warnings.length > 0) {
                indicator.className = 'safety-indicator warning';
                text.textContent = 'Warning';
            } else {
                indicator.className = 'safety-indicator danger';
                text.textContent = 'Danger';
            }
        }
        
        function generateWebVibrationFromPattern(pattern) {
            return pattern.pattern.map(p => Math.floor(p.intensity * 10));
        }
        
        function validatePatternSafety(pattern) {
            const maxIntensity = Math.max(...pattern.pattern.map(p => p.intensity));
            const avgIntensity = pattern.pattern.reduce((sum, p) => sum + p.intensity, 0) / pattern.pattern.length;
            
            return {
                safe: maxIntensity < 95 && pattern.duration < 10000,
                warnings: [
                    ...(maxIntensity > 90 ? ['High intensity detected'] : []),
                    ...(pattern.duration > 8000 ? ['Long duration'] : []),
                    ...(avgIntensity > 80 ? ['High average intensity'] : [])
                ]
            };
        }
        
        function visualizePattern(pattern) {
            if (!ctx) return;
            
            // Clear canvas
            ctx.clearRect(0, 0, vibrationCanvas.width, vibrationCanvas.height);
            
            // Draw pattern
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const width = vibrationCanvas.width;
            const height = vibrationCanvas.height;
            
            pattern.pattern.forEach((point, i) => {
                const x = (i / pattern.pattern.length) * width;
                const y = height - (point.intensity / 100) * height;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Add glow effect
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        async function updateStats() {
            try {
                const response = await fetch('/analytics');
                const data = await response.json();
                
                document.getElementById('patternCount').textContent = data.totalPatterns || 0;
                document.getElementById('sessionCount').textContent = data.totalSessions || 0;
                document.getElementById('avgComplexity').textContent = 
                    (data.avgComplexity || 0).toFixed(1);
            } catch (error) {
                console.error('Failed to update stats:', error);
            }
        }
        
        function updateAnalytics(analytics) {
            if (analytics.sessionId) {
                console.log('Session analytics:', analytics);
            }
        }
        
        // Update stats periodically
        setInterval(updateStats, 10000);
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`🌊 Pleasure/Vibration Encoder running on port ${this.port}`);
                console.log(`📱 WebSocket server on port ${this.wsPort}`);
                console.log(`🎭 Dashboard: http://localhost:${this.port}`);
                console.log(`🔗 API endpoints: /encode/*, /patterns, /ringtone/*`);
                resolve();
            });
        });
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Pleasure/Vibration Encoder...');
        process.exit(0);
    }
}

// Auto-start if run directly
if (require.main === module) {
    const encoder = new PleasureVibrationEncoder();
    
    encoder.start().catch(error => {
        console.error('Failed to start Pleasure/Vibration Encoder:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => encoder.shutdown());
    process.on('SIGTERM', () => encoder.shutdown());
}

module.exports = PleasureVibrationEncoder;
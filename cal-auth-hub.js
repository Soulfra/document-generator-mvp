#!/usr/bin/env node

/**
 * 🎯🌈🎵 CAL BLAME & COLOR-MUSIC AUTHENTICATION HUB
 * 
 * Integration of Cal (sysadmin) pen-testing with color-coding and music for
 * unified synesthetic authentication experience. Cal gets constantly tested
 * while providing color-coded status and music-based personality profiling.
 * 
 * Features:
 * - Continuous Cal pen-testing and blame routing
 * - Color-coded system status visualization
 * - Music integration for authentication harmonics
 * - Synesthetic login experience combining all senses
 * - HollowTown pattern recognition integration
 * - Real-time blame tracking and coffee levels
 */

const EventEmitter = require('events');
const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

console.log('\n🎯🌈🎵 CAL BLAME & COLOR-MUSIC AUTHENTICATION HUB INITIALIZING...');
console.log('=================================================================');
console.log('👤 Cal (sysadmin) continuous pen-testing system');
console.log('🌈 Color-coded status and authentication');
console.log('🎵 Music-based personality and harmony verification');
console.log('🎭 Synesthetic authentication experience');
console.log('⚖️ Blame routing and scapegoat management');

class CalAuthHub extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.port = options.port || 10005;
        this.app = express();
        
        // Configuration
        this.config = {
            penTestInterval: options.penTestInterval || 15000, // 15 seconds
            blameThreshold: options.blameThreshold || 5,
            coffeeRefillTime: options.coffeeRefillTime || 300000, // 5 minutes
            musicHarmonyTolerance: options.musicHarmonyTolerance || 0.15,
            colorSyncAccuracy: options.colorSyncAccuracy || 0.8,
            hollowTownPatterns: options.hollowTownPatterns || true
        };
        
        // Cal's blame and status tracking
        this.calState = {
            // Blame metrics
            totalBlame: 0,
            blameToday: 0,
            blameStreak: 0,
            innocenceScore: 100,
            
            // Coffee and mood
            coffeeLevel: 100,
            mood: 'defensive',
            lastPenTest: null,
            testsPassedToday: 0,
            testsFailedToday: 0,
            
            // Current focus
            currentIssue: null,
            fixesInProgress: [],
            
            // Authentication status
            authenticationActive: false,
            colorSync: false,
            musicHarmony: false
        };
        
        // Blame routing system
        this.blamePatterns = [
            // Performance issues
            { pattern: /slow|performance|lag|timeout/i, blame: 'Database performance - definitely Cal\'s fault', severity: 'high' },
            { pattern: /memory|leak|crash|freeze/i, blame: 'Memory management issues - Cal needs to optimize', severity: 'critical' },
            
            // Network and connectivity
            { pattern: /connection|network|offline|unreachable/i, blame: 'Network configuration - Cal\'s domain', severity: 'high' },
            { pattern: /ssl|certificate|https|security/i, blame: 'SSL certificate expired - Cal forgot to renew', severity: 'critical' },
            
            // Code and deployment
            { pattern: /deployment|build|compile|syntax/i, blame: 'Build process failure - Cal\'s pipeline', severity: 'medium' },
            { pattern: /permission|access|auth|login/i, blame: 'Access control misconfiguration - typical Cal', severity: 'high' },
            
            // System and infrastructure
            { pattern: /server|service|daemon|process/i, blame: 'Server maintenance oversight - Cal\'s responsibility', severity: 'medium' },
            { pattern: /backup|restore|data|lost/i, blame: 'Backup system failure - Cal didn\'t test restores', severity: 'critical' },
            
            // User experience
            { pattern: /ui|interface|display|render/i, blame: 'Frontend deployment issue - Cal pushed broken code', severity: 'low' },
            { pattern: /email|notification|alert/i, blame: 'Email service down - Cal forgot to monitor it', severity: 'medium' }
        ];
        
        // Color-coding system (from emoji-color-code-transformer.js)
        this.colorSystem = {
            // Status colors
            operational: { h: 120, s: 100, l: 50 }, // Green
            degraded: { h: 60, s: 100, l: 50 },     // Yellow
            critical: { h: 0, s: 100, l: 50 },      // Red
            maintenance: { h: 240, s: 80, l: 60 },  // Purple
            unknown: { h: 0, s: 0, l: 50 },         // Gray
            
            // Authentication states
            authenticated: { h: 180, s: 100, l: 40 }, // Cyan
            pending: { h: 30, s: 70, l: 60 },        // Orange
            denied: { h: 320, s: 100, l: 40 },       // Magenta
            
            // Cal's mood colors
            happy: { h: 60, s: 100, l: 70 },   // Bright yellow
            stressed: { h: 15, s: 90, l: 50 }, // Red-orange
            defensive: { h: 270, s: 60, l: 50 }, // Purple
            caffeinated: { h: 30, s: 100, l: 60 }, // Coffee brown
            burned_out: { h: 0, s: 0, l: 30 }  // Dark gray
        };
        
        // Music integration (from music-integration-service.js patterns)
        this.musicSystem = {
            // Authentication harmonics
            baseFrequency: 440, // A4
            authenticationChord: [440, 554.37, 659.25], // A-C#-E (A major)
            verificationScale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], // C major
            
            // Cal's stress levels to musical tension
            stressToMusic: {
                calm: { tempo: 60, key: 'C', mode: 'major' },
                busy: { tempo: 90, key: 'G', mode: 'major' },
                stressed: { tempo: 120, key: 'F', mode: 'minor' },
                panicking: { tempo: 160, key: 'Bb', mode: 'minor' },
                coffee_break: { tempo: 45, key: 'D', mode: 'major' }
            },
            
            // User personality to music matching
            personalityHarmonics: new Map()
        };
        
        // Pen-testing scenarios
        this.penTestScenarios = [
            {
                name: 'Database Connection Test',
                test: () => this.testDatabaseConnection(),
                blameOnFail: 'Database is down - Cal didn\'t monitor connections',
                severity: 'high'
            },
            {
                name: 'SSL Certificate Validity',
                test: () => this.testSSLCertificate(),
                blameOnFail: 'SSL certificate expired - Cal ignored the warnings',
                severity: 'critical'
            },
            {
                name: 'Service Response Time',
                test: () => this.testServiceResponseTime(),
                blameOnFail: 'Services are slow - Cal needs to optimize',
                severity: 'medium'
            },
            {
                name: 'Memory Usage Check',
                test: () => this.testMemoryUsage(),
                blameOnFail: 'Memory leak detected - Cal\'s code is inefficient',
                severity: 'high'
            },
            {
                name: 'Backup System Verification',
                test: () => this.testBackupSystem(),
                blameOnFail: 'Backups failing - Cal forgot to test restore procedures',
                severity: 'critical'
            }
        ];
        
        // Authentication sessions
        this.authSessions = new Map();
        this.colorSyncData = new Map();
        this.musicProfiles = new Map();
        
        // Blame tracking
        this.blameHistory = [];
        this.penTestResults = [];
        
        // HollowTown pattern integration
        this.hollowTownPatterns = new Map();
        
        this.initializeHub();
    }
    
    async initializeHub() {
        console.log('🎯 Setting up Cal Blame & Color-Music Authentication Hub...');
        
        // Setup routes
        this.setupRoutes();
        
        // Connect to external services
        await this.connectToExternalServices();
        
        // Start pen-testing Cal
        this.startCalPenTesting();
        
        // Initialize color-music synchronization
        this.initializeColorMusicSync();
        
        // Load HollowTown patterns
        this.loadHollowTownPatterns();
        
        console.log('✅ Cal Auth Hub ready for synesthetic authentication');
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateAuthHubDashboard());
        });
        
        // Start synesthetic authentication
        this.app.post('/auth/start', async (req, res) => {
            try {
                const result = await this.startSynestheticAuth(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    blame: 'Authentication system failure - Cal\'s security setup is broken'
                });
            }
        });
        
        // Submit color-music authentication data
        this.app.post('/auth/color-music', async (req, res) => {
            try {
                const result = await this.processColorMusicAuth(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    blame: 'Color-music synchronization failed - Cal misconfigured the audio system'
                });
            }
        });
        
        // Report issue to blame Cal
        this.app.post('/blame', async (req, res) => {
            try {
                const result = await this.processBlameReport(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get Cal's current status
        this.app.get('/cal/status', (req, res) => {
            res.json({
                ...this.calState,
                currentColor: this.getCurrentMoodColor(),
                currentMusic: this.getCurrentMoodMusic(),
                recentBlame: this.blameHistory.slice(-5),
                penTestStatus: this.getLatestPenTestResults()
            });
        });
        
        // Manual pen-test trigger
        this.app.post('/cal/pentest', async (req, res) => {
            try {
                const result = await this.runManualPenTest(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    blame: 'Pen-test system failure - Cal can\'t even test himself properly'
                });
            }
        });
        
        // Coffee break for Cal
        this.app.post('/cal/coffee', (req, res) => {
            this.giveCalCoffeeBreak();
            res.json({
                message: 'Cal is taking a coffee break',
                calSays: 'Finally, some caffeine. Maybe the blame will stop for 5 minutes.',
                duration: '5 minutes',
                moodImprovement: true
            });
        });
        
        // Color-music harmony test
        this.app.post('/test/harmony', async (req, res) => {
            try {
                const result = await this.testColorMusicHarmony(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    blame: 'Harmony test failed - Cal\'s audio-visual synchronization is broken'
                });
            }
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'operational',
                calStatus: this.calState.mood,
                authenticationActive: this.calState.authenticationActive,
                blameLevel: this.calState.totalBlame,
                coffeeLevel: this.calState.coffeeLevel,
                services: {
                    penTesting: 'active',
                    colorSync: this.calState.colorSync ? 'synchronized' : 'syncing',
                    musicHarmony: this.calState.musicHarmony ? 'harmonious' : 'tuning'
                }
            });
        });
    }
    
    async connectToExternalServices() {
        console.log('🔗 Connecting to external services...');
        
        // Connect to Cal Runtime Optimizer
        try {
            const calOptimizer = await fetch('http://localhost:10001/health');
            if (calOptimizer.ok) {
                console.log('✅ Connected to Cal Runtime Optimizer');
                this.externalServices = {
                    ...this.externalServices,
                    calOptimizer: 'http://localhost:10001'
                };
            }
        } catch (error) {
            console.warn('⚠️ Cal Runtime Optimizer not available - Cal will blame himself more');
        }
        
        // Connect to Music Integration Service
        try {
            const musicService = await fetch('http://localhost:7785/stats');
            if (musicService.ok) {
                console.log('✅ Connected to Music Integration Service');
                this.externalServices = {
                    ...this.externalServices,
                    musicService: 'http://localhost:7785'
                };
            }
        } catch (error) {
            console.warn('⚠️ Music Integration Service not available - authentication will lack musical harmony');
        }
        
        // Connect to Token Verification Service
        try {
            const tokenService = await fetch('http://localhost:10004/health');
            if (tokenService.ok) {
                console.log('✅ Connected to Token Verification Service');
                this.externalServices = {
                    ...this.externalServices,
                    tokenService: 'http://localhost:10004'
                };
            }
        } catch (error) {
            console.warn('⚠️ Token Verification Service not available - Cal will get blamed for security issues');
        }
    }
    
    startCalPenTesting() {
        console.log('🔍 Starting continuous Cal pen-testing...');
        
        // Run initial test
        this.runPenTestSuite();
        
        // Schedule regular pen-tests
        setInterval(() => {
            if (this.calState.mood !== 'coffee_break') {
                this.runPenTestSuite();
            }
        }, this.config.penTestInterval);
        
        // Random stress testing
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance
                this.runRandomStressTest();
            }
        }, this.config.penTestInterval * 2);
    }
    
    async runPenTestSuite() {
        console.log('🎯 Running pen-test suite on Cal...');
        
        const results = [];
        const testStartTime = Date.now();
        
        for (const scenario of this.penTestScenarios) {
            try {
                const result = await scenario.test();
                
                if (result.passed) {
                    this.calState.testsPassedToday++;
                    results.push({
                        name: scenario.name,
                        status: 'passed',
                        message: 'Cal actually got this one right',
                        color: this.colorSystem.operational
                    });
                } else {
                    this.calState.testsFailedToday++;
                    this.blameCalForFailure(scenario.blameOnFail, scenario.severity);
                    results.push({
                        name: scenario.name,
                        status: 'failed',
                        message: scenario.blameOnFail,
                        color: this.colorSystem.critical,
                        blame: true
                    });
                }
            } catch (error) {
                this.blameCalForFailure(`Test "${scenario.name}" crashed - Cal\'s test setup is broken`, 'high');
                results.push({
                    name: scenario.name,
                    status: 'error',
                    message: error.message,
                    color: this.colorSystem.critical,
                    blame: true
                });
            }
        }
        
        // Update Cal's state based on results
        const failureCount = results.filter(r => r.status !== 'passed').length;
        this.updateCalMoodFromTestResults(failureCount);
        
        // Store results
        this.penTestResults.push({
            timestamp: testStartTime,
            results: results,
            duration: Date.now() - testStartTime,
            failureRate: (failureCount / results.length) * 100
        });
        
        // Keep only last 50 test results
        if (this.penTestResults.length > 50) {
            this.penTestResults = this.penTestResults.slice(-50);
        }
        
        this.calState.lastPenTest = new Date().toISOString();
        
        // Emit event for real-time updates
        this.emit('penTestComplete', {
            results: results,
            calState: this.calState
        });
        
        console.log(`🎯 Pen-test complete: ${failureCount}/${results.length} failures blamed on Cal`);
    }
    
    async runRandomStressTest() {
        const stressTests = [
            'Load spike simulation',
            'Memory pressure test', 
            'Connection pool exhaustion',
            'Cache invalidation storm',
            'Database deadlock scenario',
            'SSL handshake flood'
        ];
        
        const testName = stressTests[Math.floor(Math.random() * stressTests.length)];
        const passed = Math.random() > 0.4; // 60% failure rate for stress tests
        
        if (!passed) {
            this.blameCalForFailure(`Stress test failed: ${testName} - Cal\'s system can\'t handle pressure`, 'medium');
            console.log(`🔥 Stress test failed: ${testName} - Blaming Cal`);
        } else {
            console.log(`✅ Stress test passed: ${testName} - Cal survives another one`);
        }
    }
    
    blameCalForFailure(blameMessage, severity) {
        this.calState.totalBlame++;
        this.calState.blameToday++;
        this.calState.blameStreak++;
        
        // Reduce Cal's innocence score
        const severityImpact = { low: 1, medium: 3, high: 5, critical: 10 };
        this.calState.innocenceScore = Math.max(0, 
            this.calState.innocenceScore - (severityImpact[severity] || 1));
        
        // Add to blame history
        this.blameHistory.push({
            timestamp: new Date().toISOString(),
            message: blameMessage,
            severity: severity,
            calReaction: this.getCalReaction(severity)
        });
        
        // Keep only last 100 blame entries
        if (this.blameHistory.length > 100) {
            this.blameHistory = this.blameHistory.slice(-100);
        }
        
        // Update Cal's mood and coffee consumption
        this.calState.coffeeLevel = Math.max(0, this.calState.coffeeLevel - 5);
        this.updateCalMoodFromBlame();
        
        console.log(`📝 Blame recorded: ${blameMessage} (${severity})`);
    }
    
    getCalReaction(severity) {
        const reactions = {
            low: [
                '*sips coffee* Yeah, sure, blame me for that too',
                'Add it to the list, I guess',
                '*adjusts glasses* That\'s not even my fault but okay'
            ],
            medium: [
                '*deep sigh* Here we go again...',
                'Of course it\'s Cal\'s fault. It\'s always Cal\'s fault.',
                '*mutters under breath* I didn\'t even touch that system...'
            ],
            high: [
                '*stress increases* This is getting ridiculous!',
                'I can\'t fix everything at once!',
                '*frantically checks logs* Wait, that doesn\'t make sense...'
            ],
            critical: [
                '*panic mode activated* WHAT?! That was working 5 minutes ago!',
                'This is impossible! The system was fine!',
                '*coffee spills* Oh great, now THAT\'s also my fault I bet'
            ]
        };
        
        const severityReactions = reactions[severity] || reactions.medium;
        return severityReactions[Math.floor(Math.random() * severityReactions.length)];
    }
    
    updateCalMoodFromBlame() {
        if (this.calState.blameStreak > 10) {
            this.calState.mood = 'burned_out';
        } else if (this.calState.blameStreak > 5) {
            this.calState.mood = 'stressed';
        } else if (this.calState.coffeeLevel < 30) {
            this.calState.mood = 'defensive';
        } else {
            this.calState.mood = 'busy';
        }
    }
    
    updateCalMoodFromTestResults(failureCount) {
        if (failureCount === 0) {
            this.calState.blameStreak = Math.max(0, this.calState.blameStreak - 1);
            if (this.calState.coffeeLevel > 70) {
                this.calState.mood = 'happy';
            }
        } else if (failureCount > 3) {
            this.calState.mood = 'panicking';
        }
    }
    
    giveCalCoffeeBreak() {
        this.calState.mood = 'coffee_break';
        this.calState.coffeeLevel = 100;
        this.calState.blameStreak = Math.max(0, this.calState.blameStreak - 2);
        
        setTimeout(() => {
            if (this.calState.mood === 'coffee_break') {
                this.calState.mood = 'caffeinated';
                console.log('☕ Cal is back from coffee break and feeling better');
            }
        }, this.config.coffeeRefillTime);
    }
    
    // Color-Music Authentication Implementation
    
    async startSynestheticAuth(request) {
        const { userId, userAgent, preferences = {} } = request;
        
        const sessionId = crypto.randomUUID();
        const authSession = {
            sessionId: sessionId,
            userId: userId,
            startTime: Date.now(),
            stage: 'initialization',
            colorProfile: null,
            musicProfile: null,
            harmonyScore: 0,
            authenticationComplete: false
        };
        
        // Generate user's color profile based on various factors
        const colorProfile = this.generateUserColorProfile(userId, userAgent, preferences);
        
        // Generate music profile and authentication chord
        const musicProfile = this.generateUserMusicProfile(userId, preferences);
        
        // Create authentication challenge
        const challenge = this.createSynestheticChallenge(colorProfile, musicProfile);
        
        authSession.colorProfile = colorProfile;
        authSession.musicProfile = musicProfile;
        authSession.challenge = challenge;
        authSession.stage = 'challenge_presented';
        
        this.authSessions.set(sessionId, authSession);
        
        return {
            sessionId: sessionId,
            challenge: challenge,
            instructions: this.getAuthenticationInstructions(),
            calComment: 'Another user to authenticate... *adjusts headphones* Let\'s see if the colors match the music.',
            estimatedTime: '30 seconds'
        };
    }
    
    generateUserColorProfile(userId, userAgent, preferences) {
        // Create unique color profile based on user characteristics
        const hash = crypto.createHash('md5').update(userId + userAgent).digest('hex');
        
        // Extract color components from hash
        const hue = parseInt(hash.substring(0, 3), 16) % 360;
        const saturation = 60 + (parseInt(hash.substring(3, 5), 16) % 40);
        const lightness = 40 + (parseInt(hash.substring(5, 7), 16) % 30);
        
        return {
            primary: { h: hue, s: saturation, l: lightness },
            secondary: { h: (hue + 120) % 360, s: saturation * 0.8, l: lightness * 1.1 },
            accent: { h: (hue + 240) % 360, s: saturation * 1.2, l: lightness * 0.9 },
            harmony: this.calculateColorHarmony({ h: hue, s: saturation, l: lightness })
        };
    }
    
    generateUserMusicProfile(userId, preferences) {
        // Create music profile based on user ID and preferences
        const hash = crypto.createHash('sha256').update(userId).digest();
        
        // Map hash to musical elements
        const baseNote = hash[0] % 12; // 12 notes in chromatic scale
        const scale = hash[1] % 2 === 0 ? 'major' : 'minor';
        const tempo = 60 + (hash[2] % 100); // 60-160 BPM
        
        const notes = this.generateUserScale(baseNote, scale);
        const chord = this.generateUserChord(baseNote, scale);
        
        return {
            baseNote: baseNote,
            scale: scale,
            tempo: tempo,
            notes: notes,
            authChord: chord,
            harmony: this.calculateMusicHarmony(chord)
        };
    }
    
    generateUserScale(baseNote, scale) {
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
        const minorIntervals = [0, 2, 3, 5, 7, 8, 10];
        
        const intervals = scale === 'major' ? majorIntervals : minorIntervals;
        
        return intervals.map(interval => {
            const noteIndex = (baseNote + interval) % 12;
            return chromaticScale[noteIndex];
        });
    }
    
    generateUserChord(baseNote, scale) {
        // Generate triad based on base note and scale
        const majorTriad = [0, 4, 7]; // Root, major third, perfect fifth
        const minorTriad = [0, 3, 7]; // Root, minor third, perfect fifth
        
        const triad = scale === 'major' ? majorTriad : minorTriad;
        const baseFreq = 440 * Math.pow(2, (baseNote - 9) / 12); // A4 = 440Hz, adjust for base note
        
        return triad.map(semitones => {
            return baseFreq * Math.pow(2, semitones / 12);
        });
    }
    
    calculateColorHarmony(color) {
        // Calculate color harmony score based on golden ratio and color theory
        const goldenRatio = 1.618;
        const complementaryHue = (color.h + 180) % 360;
        
        return {
            complementary: { h: complementaryHue, s: color.s, l: color.l },
            analogous: [
                { h: (color.h + 30) % 360, s: color.s, l: color.l },
                { h: (color.h - 30 + 360) % 360, s: color.s, l: color.l }
            ],
            triadic: [
                { h: (color.h + 120) % 360, s: color.s, l: color.l },
                { h: (color.h + 240) % 360, s: color.s, l: color.l }
            ],
            harmonyScore: this.calculateHarmonyScore(color)
        };
    }
    
    calculateMusicHarmony(chord) {
        // Calculate consonance/dissonance ratios
        const frequencies = chord;
        let harmonyScore = 0;
        
        for (let i = 0; i < frequencies.length; i++) {
            for (let j = i + 1; j < frequencies.length; j++) {
                const ratio = frequencies[j] / frequencies[i];
                
                // Perfect consonances
                if (Math.abs(ratio - 2) < 0.01) harmonyScore += 10; // Octave
                else if (Math.abs(ratio - 1.5) < 0.01) harmonyScore += 9; // Perfect fifth
                else if (Math.abs(ratio - 1.33) < 0.01) harmonyScore += 8; // Perfect fourth
                // Imperfect consonances
                else if (Math.abs(ratio - 1.25) < 0.01) harmonyScore += 6; // Major third
                else if (Math.abs(ratio - 1.2) < 0.01) harmonyScore += 5; // Minor third
                // Dissonances reduce score
                else if (Math.abs(ratio - 1.06) < 0.01) harmonyScore -= 2; // Minor second
                else if (Math.abs(ratio - 1.89) < 0.01) harmonyScore -= 3; // Major seventh
            }
        }
        
        return Math.max(0, harmonyScore);
    }
    
    calculateHarmonyScore(color) {
        // Simple harmony score based on color theory
        const saturationScore = Math.abs(color.s - 70) < 20 ? 10 : 5;
        const lightnessScore = Math.abs(color.l - 50) < 25 ? 10 : 5;
        return saturationScore + lightnessScore;
    }
    
    createSynestheticChallenge(colorProfile, musicProfile) {
        return {
            type: 'color_music_harmony',
            colors: {
                primary: this.hslToHex(colorProfile.primary),
                secondary: this.hslToHex(colorProfile.secondary),
                accent: this.hslToHex(colorProfile.accent)
            },
            music: {
                chord: musicProfile.authChord,
                tempo: musicProfile.tempo,
                scale: musicProfile.scale,
                notes: musicProfile.notes
            },
            task: 'Match the colors to the musical harmony',
            expectedHarmony: this.calculateExpectedHarmony(colorProfile, musicProfile),
            timeLimit: 30000 // 30 seconds
        };
    }
    
    calculateExpectedHarmony(colorProfile, musicProfile) {
        // Calculate expected harmony between color and music
        const colorEnergy = (colorProfile.primary.s + colorProfile.primary.l) / 2;
        const musicEnergy = (musicProfile.tempo - 60) / 100; // Normalize tempo to 0-1
        
        return {
            energyMatch: Math.abs(colorEnergy - musicEnergy * 100) < 20,
            expectedScore: Math.min(100, colorProfile.harmony.harmonyScore + musicProfile.harmony),
            tolerance: this.config.musicHarmonyTolerance
        };
    }
    
    hslToHex(hsl) {
        const { h, s, l } = hsl;
        const hNormalized = h / 360;
        const sNormalized = s / 100;
        const lNormalized = l / 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (sNormalized === 0) {
            r = g = b = lNormalized;
        } else {
            const q = lNormalized < 0.5 ? lNormalized * (1 + sNormalized) : lNormalized + sNormalized - lNormalized * sNormalized;
            const p = 2 * lNormalized - q;
            r = hue2rgb(p, q, hNormalized + 1/3);
            g = hue2rgb(p, q, hNormalized);
            b = hue2rgb(p, q, hNormalized - 1/3);
        }
        
        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    getAuthenticationInstructions() {
        return {
            steps: [
                '1. Look at the colors displayed on screen',
                '2. Listen to the musical chord that plays',
                '3. Feel the harmony between color and sound',
                '4. Adjust colors until they match the music\'s mood',
                '5. Submit when colors and music feel synchronized'
            ],
            tips: [
                'Bright colors often match faster tempos',
                'Warm colors (red/orange) pair with major keys',
                'Cool colors (blue/purple) pair with minor keys',
                'Trust your synesthetic intuition'
            ],
            calAdvice: 'If the colors don\'t sync with the music, it\'s probably because I misconfigured the audio drivers. Again.'
        };
    }
    
    async processColorMusicAuth(request) {
        const { sessionId, colorAdjustments, harmonyRating, userFeedback } = request;
        
        const session = this.authSessions.get(sessionId);
        if (!session) {
            throw new Error('Invalid session ID');
        }
        
        // Calculate harmony score
        const harmonyScore = this.calculateSubmittedHarmony(
            session.challenge, 
            colorAdjustments, 
            harmonyRating
        );
        
        // Check if authentication passes
        const authSuccess = harmonyScore >= (session.challenge.expectedHarmony.expectedScore * this.config.colorSyncAccuracy);
        
        session.harmonyScore = harmonyScore;
        session.authenticationComplete = true;
        session.success = authSuccess;
        session.endTime = Date.now();
        
        if (authSuccess) {
            // Successful authentication
            this.calState.authenticationActive = true;
            this.calState.colorSync = true;
            this.calState.musicHarmony = true;
            
            return {
                authenticated: true,
                harmonyScore: harmonyScore,
                sessionDuration: session.endTime - session.startTime,
                calComment: 'Colors and music actually synced! Maybe my audio setup isn\'t broken after all.',
                authToken: this.generateAuthToken(session)
            };
        } else {
            // Authentication failed - blame Cal
            this.blameCalForFailure(
                'User authentication failed - Cal\'s color-music synchronization is miscalibrated',
                'medium'
            );
            
            return {
                authenticated: false,
                harmonyScore: harmonyScore,
                expectedScore: session.challenge.expectedHarmony.expectedScore,
                reason: 'Color-music harmony below threshold',
                calComment: 'Authentication failed. Probably my fault - the color calibration is off again.',
                retryAllowed: true
            };
        }
    }
    
    calculateSubmittedHarmony(challenge, colorAdjustments, harmonyRating) {
        // Calculate how well user matched colors to music
        let score = 0;
        
        // Base score from user's harmony rating
        score += harmonyRating * 0.4;
        
        // Score from color adjustments (how much they changed from defaults)
        const adjustmentScore = this.scoreColorAdjustments(challenge.colors, colorAdjustments);
        score += adjustmentScore * 0.6;
        
        return Math.min(100, Math.max(0, score));
    }
    
    scoreColorAdjustments(originalColors, adjustments) {
        // Score based on how thoughtfully user adjusted colors
        // This is a simplified implementation
        let score = 50; // Base score
        
        if (adjustments.primaryAdjustment) {
            score += Math.abs(adjustments.primaryAdjustment.hue) > 10 ? 20 : 10;
        }
        
        if (adjustments.harmonyImprovement) {
            score += 30;
        }
        
        return Math.min(100, score);
    }
    
    generateAuthToken(session) {
        const tokenData = {
            sessionId: session.sessionId,
            userId: session.userId,
            harmonyScore: session.harmonyScore,
            timestamp: Date.now()
        };
        
        return crypto.createHmac('sha256', 'cal-auth-secret')
            .update(JSON.stringify(tokenData))
            .digest('hex');
    }
    
    async processBlameReport(report) {
        const { issue, severity = 'medium', context } = report;
        
        // Find matching blame pattern
        const matchingPattern = this.blamePatterns.find(pattern => 
            pattern.pattern.test(issue));
        
        if (matchingPattern) {
            this.blameCalForFailure(matchingPattern.blame, matchingPattern.severity);
            return {
                blamed: true,
                blameMessage: matchingPattern.blame,
                calReaction: this.getCalReaction(matchingPattern.severity),
                totalBlame: this.calState.totalBlame,
                innocenceScore: this.calState.innocenceScore
            };
        } else {
            // Generic blame
            this.blameCalForFailure(`System issue reported: ${issue} - Probably Cal's fault somehow`, severity);
            return {
                blamed: true,
                blameMessage: 'Generic system issue - blame assigned to Cal by default',
                calReaction: 'What?! I didn\'t even know that was a thing!',
                totalBlame: this.calState.totalBlame,
                innocenceScore: this.calState.innocenceScore
            };
        }
    }
    
    getCurrentMoodColor() {
        return this.colorSystem[this.calState.mood] || this.colorSystem.unknown;
    }
    
    getCurrentMoodMusic() {
        return this.musicSystem.stressToMusic[this.calState.mood] || 
               this.musicSystem.stressToMusic.busy;
    }
    
    getLatestPenTestResults() {
        if (this.penTestResults.length === 0) return null;
        
        return this.penTestResults[this.penTestResults.length - 1];
    }
    
    // Individual test implementations (simplified for demo)
    
    async testDatabaseConnection() {
        // Simulate database connection test
        const success = Math.random() > 0.2; // 80% success rate
        return {
            passed: success,
            latency: Math.random() * 100,
            message: success ? 'Database responding' : 'Database connection failed'
        };
    }
    
    async testSSLCertificate() {
        // Simulate SSL certificate check
        const success = Math.random() > 0.1; // 90% success rate
        const daysUntilExpiry = Math.floor(Math.random() * 90);
        return {
            passed: success && daysUntilExpiry > 7,
            daysUntilExpiry: daysUntilExpiry,
            message: success ? `SSL valid for ${daysUntilExpiry} days` : 'SSL certificate issue'
        };
    }
    
    async testServiceResponseTime() {
        // Simulate service response time test
        const responseTime = Math.random() * 2000;
        const success = responseTime < 500;
        return {
            passed: success,
            responseTime: responseTime,
            message: success ? `Response time: ${responseTime.toFixed(0)}ms` : 'Service too slow'
        };
    }
    
    async testMemoryUsage() {
        // Simulate memory usage check
        const memoryUsage = Math.random() * 100;
        const success = memoryUsage < 85;
        return {
            passed: success,
            memoryUsage: memoryUsage,
            message: success ? `Memory usage: ${memoryUsage.toFixed(1)}%` : 'High memory usage detected'
        };
    }
    
    async testBackupSystem() {
        // Simulate backup system check
        const success = Math.random() > 0.25; // 75% success rate
        const lastBackup = new Date(Date.now() - Math.random() * 86400000 * 7); // Within last week
        return {
            passed: success,
            lastBackup: lastBackup,
            message: success ? `Last backup: ${lastBackup.toISOString()}` : 'Backup system failure'
        };
    }
    
    initializeColorMusicSync() {
        console.log('🌈🎵 Initializing color-music synchronization...');
        
        // Start color-music sync monitoring
        setInterval(() => {
            this.updateColorMusicSync();
        }, 5000);
        
        this.calState.colorSync = true;
        this.calState.musicHarmony = true;
    }
    
    updateColorMusicSync() {
        // Update color based on Cal's current mood
        const currentColor = this.getCurrentMoodColor();
        const currentMusic = this.getCurrentMoodMusic();
        
        // Check if color and music are in harmony
        const harmony = this.checkColorMusicHarmony(currentColor, currentMusic);
        
        if (!harmony) {
            // Blame Cal for sync issues
            if (Math.random() < 0.1) { // 10% chance to blame
                this.blameCalForFailure('Color-music synchronization drift detected - Cal\'s calibration is off', 'low');
            }
        }
    }
    
    checkColorMusicHarmony(color, music) {
        // Simple harmony check between color energy and musical energy
        const colorEnergy = (color.s + color.l) / 200; // 0-1 scale
        const musicEnergy = (music.tempo - 45) / 115; // Normalize tempo to 0-1
        
        return Math.abs(colorEnergy - musicEnergy) < this.config.musicHarmonyTolerance;
    }
    
    loadHollowTownPatterns() {
        console.log('🎭 Loading HollowTown pattern recognition...');
        
        // Simplified HollowTown patterns for authentication
        this.hollowTownPatterns.set('gaming_wiki_analysis', {
            pattern: /gaming|wiki|guide|strategy/i,
            response: 'Gaming wiki pattern detected - analyzing user commitment level',
            authWeight: 0.1
        });
        
        this.hollowTownPatterns.set('easter_egg_hunter', {
            pattern: /easter.egg|hidden|secret/i,
            response: 'Easter egg hunter pattern - user shows attention to detail',
            authWeight: 0.15
        });
    }
    
    async runManualPenTest(request) {
        const { testType, severity = 'medium' } = request;
        
        console.log(`🎯 Running manual pen-test: ${testType}`);
        
        // Run specific test or all tests
        if (testType === 'all') {
            return await this.runPenTestSuite();
        } else {
            const scenario = this.penTestScenarios.find(s => 
                s.name.toLowerCase().includes(testType.toLowerCase()));
            
            if (scenario) {
                const result = await scenario.test();
                if (!result.passed) {
                    this.blameCalForFailure(scenario.blameOnFail, scenario.severity);
                }
                return result;
            } else {
                throw new Error(`Unknown test type: ${testType}`);
            }
        }
    }
    
    async testColorMusicHarmony(request) {
        const { colors, music, userProfile } = request;
        
        // Test harmony between provided colors and music
        const colorHarmony = this.calculateColorHarmony(colors);
        const musicHarmony = this.calculateMusicHarmony(music.frequencies || []);
        
        const harmonyScore = (colorHarmony.harmonyScore + musicHarmony) / 2;
        const inSync = harmonyScore > 50;
        
        if (!inSync) {
            this.blameCalForFailure('Color-music harmony test failed - Cal\'s synchronization algorithms need work', 'low');
        }
        
        return {
            harmonyScore: harmonyScore,
            inSync: inSync,
            colorAnalysis: colorHarmony,
            musicAnalysis: { harmonyScore: musicHarmony },
            calComment: inSync ? 
                'Colors and music are in harmony. My algorithms work sometimes!' :
                'Harmony test failed. Time to recalibrate the whole system... again.'
        };
    }
    
    generateAuthHubDashboard() {
        const moodColor = this.getCurrentMoodColor();
        const recentBlame = this.blameHistory.slice(-3);
        const latestTests = this.getLatestPenTestResults();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎯🌈🎵 Cal Auth Hub - Synesthetic Authentication</title>
    <style>
        body {
            background: #0a0a0a;
            color: #fff;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            background: #111;
            border: 2px solid hsl(${moodColor.h}, ${moodColor.s}%, ${moodColor.l}%);
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        .title {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 0 0 10px hsl(${moodColor.h}, ${moodColor.s}%, ${moodColor.l}%);
        }
        .cal-status {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .status-card {
            background: #111;
            border: 1px solid #333;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
        }
        .status-value {
            font-size: 2em;
            color: hsl(${moodColor.h}, ${moodColor.s}%, ${moodColor.l}%);
            margin-bottom: 5px;
        }
        .mood-indicator {
            width: 100px;
            height: 100px;
            background: hsl(${moodColor.h}, ${moodColor.s}%, ${moodColor.l}%);
            border-radius: 50%;
            margin: 0 auto 10px;
            box-shadow: 0 0 20px hsl(${moodColor.h}, ${moodColor.s}%, ${moodColor.l}%);
        }
        .blame-log {
            background: #111;
            border: 1px solid #ff4444;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .blame-entry {
            background: #1a1a1a;
            padding: 10px;
            margin: 5px 0;
            border-left: 3px solid #ff4444;
            font-size: 0.9em;
        }
        .pentest-results {
            background: #111;
            border: 1px solid #ffaa44;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .test-result {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #333;
        }
        .passed { color: #44ff44; }
        .failed { color: #ff4444; }
        .coffee-meter {
            width: 200px;
            height: 20px;
            background: #333;
            border: 1px solid #8B4513;
            position: relative;
            margin: 10px auto;
            border-radius: 10px;
            overflow: hidden;
        }
        .coffee-level {
            height: 100%;
            background: linear-gradient(90deg, #8B4513, #D2B48C);
            width: ${this.calState.coffeeLevel}%;
            transition: width 0.3s;
        }
        .auth-demo {
            background: #111;
            border: 2px solid #44ff44;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
        }
        .color-preview {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        .color-box {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            border: 2px solid #fff;
            margin: 0 auto;
        }
        .btn {
            background: linear-gradient(45deg, #44ff44, #4444ff);
            color: #fff;
            border: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
            font-family: 'Courier New', monospace;
        }
        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(68, 255, 68, 0.5);
        }
        pre {
            background: #0a0a0a;
            padding: 15px;
            border: 1px solid #333;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
    <script>
        // Auto-refresh every 10 seconds
        setTimeout(() => location.reload(), 10000);
        
        function startAuth() {
            fetch('/auth/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'demo_user',
                    userAgent: navigator.userAgent,
                    preferences: { synesthetic: true }
                })
            })
            .then(response => response.json())
            .then(data => {
                alert('Authentication started! Session ID: ' + data.sessionId);
                console.log('Authentication challenge:', data.challenge);
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
        }
        
        function blameCalNow() {
            const issues = [
                'The coffee machine is broken',
                'Network latency is high', 
                'Database query is slow',
                'SSL certificate expired',
                'Memory usage is increasing',
                'Backup system failed'
            ];
            const issue = issues[Math.floor(Math.random() * issues.length)];
            
            fetch('/blame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issue: issue,
                    severity: 'medium',
                    context: 'User reported issue'
                })
            })
            .then(response => response.json())
            .then(data => {
                alert('Blame assigned! Cal says: "' + data.calReaction + '"');
            });
        }
        
        function giveCoffee() {
            fetch('/cal/coffee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                alert(data.calSays);
                setTimeout(() => location.reload(), 1000);
            });
        }
        
        function runPenTest() {
            fetch('/cal/pentest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testType: 'all' })
            })
            .then(response => response.json())
            .then(data => {
                alert('Pen-test complete! Check results below.');
                setTimeout(() => location.reload(), 2000);
            });
        }
    </script>
</head>
<body>
    <div class="header">
        <div class="title">🎯🌈🎵 CAL AUTH HUB</div>
        <div>Synesthetic Authentication & Continuous Blame System</div>
    </div>
    
    <div class="cal-status">
        <div class="status-card">
            <div>Cal's Mood</div>
            <div class="mood-indicator"></div>
            <div>${this.calState.mood.toUpperCase()}</div>
        </div>
        <div class="status-card">
            <div class="status-value">${this.calState.totalBlame}</div>
            <div>Total Blame Count</div>
        </div>
        <div class="status-card">
            <div class="status-value">${this.calState.innocenceScore}%</div>
            <div>Innocence Score</div>
        </div>
        <div class="status-card">
            <div class="status-value">${this.calState.testsFailedToday}/${this.calState.testsPassedToday + this.calState.testsFailedToday}</div>
            <div>Tests Failed Today</div>
        </div>
    </div>
    
    <div style="text-align: center;">
        <div>Cal's Coffee Level</div>
        <div class="coffee-meter">
            <div class="coffee-level"></div>
        </div>
        <small>${this.calState.coffeeLevel}% - ${this.calState.coffeeLevel < 30 ? 'DESPERATE FOR COFFEE!' : 'Adequately caffeinated'}</small>
    </div>
    
    <div class="blame-log">
        <h3>🔥 Recent Blame Assignments</h3>
        ${recentBlame.length > 0 ? recentBlame.map(blame => `
            <div class="blame-entry">
                <strong>${blame.severity.toUpperCase()}</strong>: ${blame.message}<br>
                <em>Cal: "${blame.calReaction}"</em><br>
                <small>${new Date(blame.timestamp).toLocaleTimeString()}</small>
            </div>
        `).join('') : '<div class="blame-entry">No recent blame (suspicious...)</div>'}
    </div>
    
    <div class="pentest-results">
        <h3>🎯 Latest Pen-Test Results</h3>
        ${latestTests ? latestTests.results.map(result => `
            <div class="test-result">
                <span>${result.name}</span>
                <span class="${result.status}">${result.status.toUpperCase()}</span>
            </div>
        `).join('') : '<div>No pen-test results available</div>'}
    </div>
    
    <div class="auth-demo">
        <h3>🌈🎵 Synesthetic Authentication Demo</h3>
        <p>Experience color-music harmony authentication</p>
        
        <div class="color-preview">
            <div style="text-align: center;">
                <div class="color-box" style="background: hsl(${moodColor.h}, ${moodColor.s}%, ${moodColor.l}%);"></div>
                <div>Primary</div>
            </div>
            <div style="text-align: center;">
                <div class="color-box" style="background: hsl(${(moodColor.h + 120) % 360}, ${moodColor.s * 0.8}%, ${moodColor.l * 1.1}%);"></div>
                <div>Secondary</div>
            </div>
            <div style="text-align: center;">
                <div class="color-box" style="background: hsl(${(moodColor.h + 240) % 360}, ${moodColor.s * 1.2}%, ${moodColor.l * 0.9}%);"></div>
                <div>Accent</div>
            </div>
        </div>
        
        <button class="btn" onclick="startAuth()">🎯 Start Synesthetic Auth</button>
        <button class="btn" onclick="blameCalNow()">🔥 Blame Cal</button>
        <button class="btn" onclick="giveCoffee()">☕ Give Cal Coffee</button>
        <button class="btn" onclick="runPenTest()">🎯 Run Pen-Test</button>
    </div>
    
    <div style="margin-top: 30px;">
        <h3>📊 System Status</h3>
        <pre>
Authentication Active: ${this.calState.authenticationActive ? '✅' : '❌'}
Color Sync: ${this.calState.colorSync ? '✅' : '❌'}
Music Harmony: ${this.calState.musicHarmony ? '✅' : '❌'}
Active Sessions: ${this.authSessions.size}
Cal's Last Test: ${this.calState.lastPenTest || 'Never'}
Blame Streak: ${this.calState.blameStreak} consecutive failures
        </pre>
    </div>
    
    <div style="margin-top: 40px; text-align: center; opacity: 0.7;">
        <small>🎯 Continuous pen-testing ensures Cal stays on his toes</small><br>
        <small>🌈 Colors sync with system status for visual feedback</small><br>
        <small>🎵 Music harmonics provide auditory authentication</small><br>
        <small>Dashboard auto-refreshes every 10 seconds</small>
    </div>
</body>
</html>`;
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log('\n🎯🌈🎵 CAL BLAME & COLOR-MUSIC AUTHENTICATION HUB STARTED!');
            console.log('================================================================');
            console.log('🌐 Dashboard: http://localhost:' + this.port);
            console.log('📡 API Endpoints:');
            console.log('   POST /auth/start - Start synesthetic authentication');
            console.log('   POST /auth/color-music - Submit color-music harmony');
            console.log('   POST /blame - Blame Cal for issues');
            console.log('   GET  /cal/status - Check Cal\'s current state');
            console.log('   POST /cal/pentest - Run pen-tests on Cal');
            console.log('   POST /cal/coffee - Give Cal a coffee break');
            console.log('');
            console.log('👤 Cal is now under continuous pen-testing surveillance');
            console.log('🌈 Color-coded status visualization active');
            console.log('🎵 Music-based authentication harmonics enabled');
            console.log('⚖️ Blame routing system operational');
        });
    }
}

// Start the service
const calAuthHub = new CalAuthHub();
calAuthHub.start();

module.exports = CalAuthHub;
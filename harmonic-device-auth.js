/**
 * 🎼 Harmonic Device Authentication System
 * 
 * Creates musical device authentication where each device has its own "melody"
 * when logging into the system. Device IDs are harmonized to be near the same 
 * musical "register" (octave range) for family coherence.
 * 
 * Features:
 * - Device-specific melody generation based on hardware fingerprints
 * - Family harmonic coherence (devices in same family share musical register)  
 * - Musical authentication sequences that play during login
 * - Harmonic relationships between related devices
 * - Audio-based device identification and verification
 * - Integration with Musical Crypto Family system
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const os = require('os');

class HarmonicDeviceAuth extends EventEmitter {
    constructor(musicCryptoFamily, config = {}) {
        super();
        
        this.musicCryptoFamily = musicCryptoFamily;
        
        this.config = {
            // Device authentication configuration
            deviceMelodyLength: config.deviceMelodyLength || 8,
            authenticationDuration: config.authenticationDuration || 4.0, // seconds
            harmonyComplexity: config.harmonyComplexity || 3, // number of harmony voices
            
            // Musical register configuration
            familyRegisterRange: config.familyRegisterRange || 2, // octaves per family
            baseRegister: config.baseRegister || 4, // middle register (C4-B4)
            registerOverlap: config.registerOverlap || 0.5, // octaves of overlap between families
            
            // Device fingerprint sources
            fingerprintSources: [
                'networkInterfaces', 'cpuInfo', 'memoryLayout', 
                'userAgent', 'screenResolution', 'timezone'
            ],
            
            // Audio configuration
            sampleRate: 44100,
            baseFrequency: 440, // A4
            harmonicSeries: [1, 2, 3, 4, 5, 6, 7, 8],
            
            // Security settings
            deviceTrustDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
            authenticationTolerance: 0.05 // 5% frequency tolerance
        };
        
        // Device storage
        this.devices = new Map(); // deviceId -> DeviceProfile
        this.melodies = new Map(); // deviceId -> MelodyData
        this.harmonicGroups = new Map(); // familyId -> DeviceGroup
        this.authenticationSessions = new Map(); // sessionId -> AuthSession
        
        // Musical resources
        this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            pentatonic: [0, 2, 4, 7, 9],
            blues: [0, 3, 5, 6, 7, 10]
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎼 Initializing Harmonic Device Authentication System...');
        
        // Listen for family creation events
        this.musicCryptoFamily.on('familyCreated', (family) => {
            this.createHarmonicGroup(family);
        });
        
        console.log('✅ Harmonic Device Authentication System initialized');
        this.emit('initialized');
    }
    
    /**
     * Create harmonic group for a family
     */
    createHarmonicGroup(family) {
        const registerBase = this.calculateFamilyRegister(family.id, family.generation);
        
        const harmonicGroup = {
            familyId: family.id,
            familyName: family.name,
            musicalKey: family.musicalProfile.key,
            mode: family.musicalProfile.mode,
            registerBase, // Base octave for this family
            registerRange: [registerBase, registerBase + this.config.familyRegisterRange],
            devices: [],
            harmonicRelationships: new Map(),
            createdAt: new Date()
        };
        
        this.harmonicGroups.set(family.id, harmonicGroup);
        
        console.log(`🎵 Created harmonic group for family "${family.name}" in register ${registerBase}-${registerBase + this.config.familyRegisterRange}`);
        
        return harmonicGroup;
    }
    
    /**
     * Calculate the musical register (octave range) for a family
     */
    calculateFamilyRegister(familyId, generation) {
        // Hash family ID to get consistent register assignment
        const hash = crypto.createHash('md5').update(familyId).digest();
        const hashValue = hash.readUInt32BE(0);
        
        // Base register with family variation and generation offset
        const familyOffset = (hashValue % 6) - 3; // -3 to +2 octave variation
        const generationOffset = Math.floor(generation / 2); // Higher generations = higher octaves
        
        const calculatedRegister = this.config.baseRegister + familyOffset + generationOffset;
        
        // Keep within reasonable bounds (0-8 octaves)
        return Math.max(0, Math.min(8, calculatedRegister));
    }
    
    /**
     * Register a new device and generate its musical identity
     */
    async registerDevice(deviceInfo, familyId, userId = null) {
        // Generate device fingerprint
        const fingerprint = this.generateDeviceFingerprint(deviceInfo);
        const deviceId = crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
        
        // Get or create harmonic group
        let harmonicGroup = this.harmonicGroups.get(familyId);
        if (!harmonicGroup) {
            const family = this.musicCryptoFamily.families.get(familyId);
            if (!family) {
                throw new Error(`Family ${familyId} not found`);
            }
            harmonicGroup = this.createHarmonicGroup(family);
        }
        
        // Generate device-specific melody
        const melody = this.generateDeviceMelody(deviceId, harmonicGroup);
        
        // Generate harmonic relationships with other devices in group
        const harmonicRelationships = this.calculateDeviceHarmonics(deviceId, harmonicGroup);
        
        const device = {
            id: deviceId,
            fingerprint,
            familyId,
            userId,
            deviceInfo: {
                type: deviceInfo.type || 'unknown',
                platform: deviceInfo.platform || 'unknown',
                browser: deviceInfo.browser || 'unknown',
                timestamp: new Date()
            },
            musicalProfile: {
                personalNote: melody.rootNote,
                personalOctave: melody.rootOctave,
                personalFrequency: melody.rootFrequency,
                harmonicRole: this.assignHarmonicRole(deviceId, harmonicGroup),
                melody: melody
            },
            harmonicRelationships,
            authenticationHistory: [],
            trustLevel: 1.0,
            lastAuthenticated: null,
            createdAt: new Date()
        };
        
        // Add to storage
        this.devices.set(deviceId, device);
        this.melodies.set(deviceId, melody);
        harmonicGroup.devices.push(deviceId);
        harmonicGroup.harmonicRelationships.set(deviceId, harmonicRelationships);
        
        console.log(`📱 Registered device ${deviceId} with note ${melody.rootNote}${melody.rootOctave} in family ${harmonicGroup.familyName}`);
        
        this.emit('deviceRegistered', device);
        return device;
    }
    
    /**
     * Generate device fingerprint from device information
     */
    generateDeviceFingerprint(deviceInfo) {
        const fingerprint = [];
        
        // Collect available device characteristics
        if (deviceInfo.userAgent) fingerprint.push(deviceInfo.userAgent);
        if (deviceInfo.screen) fingerprint.push(`${deviceInfo.screen.width}x${deviceInfo.screen.height}`);
        if (deviceInfo.timezone) fingerprint.push(deviceInfo.timezone);
        if (deviceInfo.language) fingerprint.push(deviceInfo.language);
        if (deviceInfo.platform) fingerprint.push(deviceInfo.platform);
        
        // Add system information if available (server-side)
        try {
            const networkInterfaces = os.networkInterfaces();
            const macAddresses = Object.values(networkInterfaces)
                .flat()
                .filter(iface => iface.mac && iface.mac !== '00:00:00:00:00:00')
                .map(iface => iface.mac);
            if (macAddresses.length > 0) {
                fingerprint.push(macAddresses[0]); // Use first non-empty MAC
            }
        } catch (error) {
            // Client-side or restricted environment
        }
        
        // Create deterministic hash
        return crypto.createHash('sha256')
            .update(fingerprint.join('|'))
            .digest('hex');
    }
    
    /**
     * Generate device-specific melody within family's harmonic group
     */
    generateDeviceMelody(deviceId, harmonicGroup) {
        // Use device ID as seed for deterministic melody generation
        const seed = crypto.createHash('sha256').update(deviceId).digest();
        
        // Get family's musical characteristics
        const familyKey = harmonicGroup.musicalKey;
        const familyMode = harmonicGroup.mode;
        const registerRange = harmonicGroup.registerRange;
        
        // Calculate device's root note within family key
        const keyIndex = this.notes.indexOf(familyKey);
        const deviceOffset = seed[0] % 12;
        const rootNoteIndex = (keyIndex + deviceOffset) % 12;
        const rootNote = this.notes[rootNoteIndex];
        
        // Calculate octave within family register
        const octaveOffset = seed[1] % (registerRange[1] - registerRange[0] + 1);
        const rootOctave = registerRange[0] + octaveOffset;
        
        // Calculate frequency
        const rootFrequency = this.noteToFrequency(rootNote, rootOctave);
        
        // Generate melody sequence
        const scale = this.scales[familyMode.toLowerCase()] || this.scales.major;
        const melodyNotes = [];
        
        for (let i = 0; i < this.config.deviceMelodyLength; i++) {
            const seedByte = seed[i % seed.length];
            const scaleIndex = seedByte % scale.length;
            const octaveVariation = Math.floor(seedByte / 85) - 1; // -1, 0, +1
            
            const noteIndex = (rootNoteIndex + scale[scaleIndex]) % 12;
            const noteOctave = Math.max(0, Math.min(8, rootOctave + octaveVariation));
            const note = this.notes[noteIndex];
            const frequency = this.noteToFrequency(note, noteOctave);
            const duration = 0.3 + (seedByte % 4) * 0.1; // 0.3-0.6 seconds
            
            melodyNotes.push({
                note,
                octave: noteOctave,
                frequency,
                duration,
                amplitude: 0.5 + (seedByte % 50) / 100, // 0.5-1.0
                scalePosition: scaleIndex,
                intervalFromRoot: scale[scaleIndex]
            });
        }
        
        return {
            deviceId,
            rootNote,
            rootOctave,
            rootFrequency,
            familyKey,
            familyMode,
            notes: melodyNotes,
            totalDuration: melodyNotes.reduce((sum, note) => sum + note.duration, 0),
            musicalFingerprint: crypto.createHash('md5').update(JSON.stringify(melodyNotes)).digest('hex').slice(0, 8)
        };
    }
    
    /**
     * Convert note and octave to frequency
     */
    noteToFrequency(note, octave) {
        const noteIndex = this.notes.indexOf(note);
        // A4 = 440 Hz (note index 9, octave 4)
        const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
        return this.config.baseFrequency * Math.pow(2, semitonesFromA4 / 12);
    }
    
    /**
     * Calculate harmonic relationships with other devices in group
     */
    calculateDeviceHarmonics(deviceId, harmonicGroup) {
        const relationships = [];
        const deviceMelody = this.melodies.get(deviceId);
        
        if (!deviceMelody) return relationships;
        
        // Check relationships with existing devices
        for (const existingDeviceId of harmonicGroup.devices) {
            if (existingDeviceId === deviceId) continue;
            
            const existingMelody = this.melodies.get(existingDeviceId);
            if (!existingMelody) continue;
            
            const relationship = this.analyzeHarmonicRelationship(deviceMelody, existingMelody);
            relationships.push({
                deviceId: existingDeviceId,
                relationship: relationship.type,
                consonance: relationship.consonance,
                interval: relationship.interval,
                canHarmonize: relationship.consonance > 0.7
            });
        }
        
        return relationships;
    }
    
    /**
     * Analyze harmonic relationship between two melodies
     */
    analyzeHarmonicRelationship(melody1, melody2) {
        // Calculate interval between root notes
        const note1Index = this.notes.indexOf(melody1.rootNote);
        const note2Index = this.notes.indexOf(melody2.rootNote);
        const interval = (note2Index - note1Index + 12) % 12;
        
        // Classify harmonic relationships
        const harmonicTypes = {
            0: { type: 'unison', consonance: 1.0 },
            1: { type: 'minor_second', consonance: 0.1 },
            2: { type: 'major_second', consonance: 0.2 },
            3: { type: 'minor_third', consonance: 0.8 },
            4: { type: 'major_third', consonance: 0.9 },
            5: { type: 'perfect_fourth', consonance: 0.85 },
            6: { type: 'tritone', consonance: 0.1 },
            7: { type: 'perfect_fifth', consonance: 0.95 },
            8: { type: 'minor_sixth', consonance: 0.7 },
            9: { type: 'major_sixth', consonance: 0.8 },
            10: { type: 'minor_seventh', consonance: 0.3 },
            11: { type: 'major_seventh', consonance: 0.2 }
        };
        
        return {
            interval,
            ...harmonicTypes[interval]
        };
    }
    
    /**
     * Assign harmonic role to device within group
     */
    assignHarmonicRole(deviceId, harmonicGroup) {
        const deviceCount = harmonicGroup.devices.length;
        const roles = ['melody', 'harmony', 'bass', 'percussion', 'countermelody', 'drone'];
        
        // Use device ID to deterministically assign role
        const hash = crypto.createHash('md5').update(deviceId).digest();
        const roleIndex = hash[0] % roles.length;
        
        return {
            primary: roles[roleIndex],
            secondary: roles[(roleIndex + deviceCount) % roles.length],
            weight: 0.5 + (hash[1] % 50) / 100 // 0.5-1.0
        };
    }
    
    /**
     * Start authentication session for device
     */
    async startAuthentication(deviceId, challengeType = 'melody') {
        if (!this.devices.has(deviceId)) {
            throw new Error(`Device ${deviceId} not registered`);
        }
        
        const device = this.devices.get(deviceId);
        const melody = this.melodies.get(deviceId);
        const sessionId = crypto.randomUUID();
        
        // Generate authentication challenge
        let challenge;
        switch (challengeType) {
            case 'melody':
                challenge = this.generateMelodyChallenge(melody);
                break;
            case 'harmony':
                challenge = this.generateHarmonyChallenge(device, melody);
                break;
            case 'rhythm':
                challenge = this.generateRhythmChallenge(melody);
                break;
            default:
                challenge = this.generateMelodyChallenge(melody);
        }
        
        const session = {
            sessionId,
            deviceId,
            challengeType,
            challenge,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            attempts: 0,
            maxAttempts: 3,
            status: 'pending'
        };
        
        this.authenticationSessions.set(sessionId, session);
        
        console.log(`🎵 Started ${challengeType} authentication for device ${deviceId}`);
        
        this.emit('authenticationStarted', session);
        return session;
    }
    
    /**
     * Generate melody-based authentication challenge
     */
    generateMelodyChallenge(deviceMelody) {
        return {
            type: 'melody',
            sequence: deviceMelody.notes.map(note => ({
                frequency: note.frequency,
                duration: note.duration,
                note: note.note,
                octave: note.octave
            })),
            instructions: 'Play back the device melody',
            tolerance: this.config.authenticationTolerance,
            expectedDuration: deviceMelody.totalDuration
        };
    }
    
    /**
     * Generate harmony-based authentication challenge
     */
    generateHarmonyChallenge(device, deviceMelody) {
        const harmonicGroup = this.harmonicGroups.get(device.familyId);
        const harmonizingDevices = device.harmonicRelationships
            .filter(rel => rel.canHarmonize)
            .slice(0, this.config.harmonyComplexity - 1);
        
        const harmonyParts = [deviceMelody.notes]; // Start with device melody
        
        // Add harmonizing melodies
        for (const rel of harmonizingDevices) {
            const harmonyMelody = this.melodies.get(rel.deviceId);
            if (harmonyMelody) {
                harmonyParts.push(harmonyMelody.notes);
            }
        }
        
        return {
            type: 'harmony',
            parts: harmonyParts.map((part, index) => ({
                partId: index,
                notes: part.map(note => ({
                    frequency: note.frequency,
                    duration: note.duration,
                    note: note.note,
                    octave: note.octave
                }))
            })),
            instructions: 'Play harmony parts in order or simultaneously',
            tolerance: this.config.authenticationTolerance,
            simultaneousPlayback: true
        };
    }
    
    /**
     * Generate rhythm-based authentication challenge
     */
    generateRhythmChallenge(deviceMelody) {
        return {
            type: 'rhythm',
            pattern: deviceMelody.notes.map(note => ({
                duration: note.duration,
                amplitude: note.amplitude,
                beat: note.duration > 0.4 ? 'strong' : 'weak'
            })),
            instructions: 'Tap the rhythm pattern (any pitch)',
            tolerance: this.config.authenticationTolerance * 2, // More lenient for rhythm
            totalDuration: deviceMelody.totalDuration
        };
    }
    
    /**
     * Verify authentication response
     */
    async verifyAuthentication(sessionId, response) {
        if (!this.authenticationSessions.has(sessionId)) {
            return { success: false, reason: 'Invalid session' };
        }
        
        const session = this.authenticationSessions.get(sessionId);
        const device = this.devices.get(session.deviceId);
        
        // Check session validity
        if (session.status !== 'pending') {
            return { success: false, reason: 'Session already processed' };
        }
        
        if (new Date() > session.expiresAt) {
            session.status = 'expired';
            return { success: false, reason: 'Session expired' };
        }
        
        session.attempts++;
        
        // Verify based on challenge type
        let verification;
        switch (session.challengeType) {
            case 'melody':
                verification = this.verifyMelodyResponse(session.challenge, response);
                break;
            case 'harmony':
                verification = this.verifyHarmonyResponse(session.challenge, response);
                break;
            case 'rhythm':
                verification = this.verifyRhythmResponse(session.challenge, response);
                break;
            default:
                return { success: false, reason: 'Unknown challenge type' };
        }
        
        // Update session and device based on verification
        if (verification.success) {
            session.status = 'authenticated';
            device.lastAuthenticated = new Date();
            device.trustLevel = Math.min(1.0, device.trustLevel + 0.1);
            device.authenticationHistory.push({
                timestamp: new Date(),
                challengeType: session.challengeType,
                success: true,
                confidence: verification.confidence
            });
            
            console.log(`✅ Device ${session.deviceId} authenticated successfully with confidence ${verification.confidence.toFixed(2)}`);
            
            this.emit('deviceAuthenticated', {
                deviceId: session.deviceId,
                sessionId,
                confidence: verification.confidence,
                challengeType: session.challengeType
            });
            
        } else {
            if (session.attempts >= session.maxAttempts) {
                session.status = 'failed';
                device.trustLevel = Math.max(0.0, device.trustLevel - 0.2);
            }
            
            device.authenticationHistory.push({
                timestamp: new Date(),
                challengeType: session.challengeType,
                success: false,
                reason: verification.reason
            });
        }
        
        return {
            success: verification.success,
            confidence: verification.confidence,
            reason: verification.reason,
            attemptsRemaining: session.maxAttempts - session.attempts,
            sessionStatus: session.status
        };
    }
    
    /**
     * Verify melody response
     */
    verifyMelodyResponse(challenge, response) {
        if (!response.notes || response.notes.length !== challenge.sequence.length) {
            return { success: false, reason: 'Incorrect number of notes', confidence: 0 };
        }
        
        let totalError = 0;
        const tolerance = challenge.tolerance;
        
        for (let i = 0; i < challenge.sequence.length; i++) {
            const expected = challenge.sequence[i];
            const played = response.notes[i];
            
            // Check frequency accuracy
            const freqError = Math.abs(expected.frequency - played.frequency) / expected.frequency;
            if (freqError > tolerance) {
                return {
                    success: false,
                    reason: `Note ${i + 1} frequency error: ${(freqError * 100).toFixed(1)}%`,
                    confidence: Math.max(0, 1 - freqError / tolerance)
                };
            }
            
            totalError += freqError;
        }
        
        const avgError = totalError / challenge.sequence.length;
        const confidence = Math.max(0, 1 - (avgError / tolerance));
        
        return {
            success: confidence > 0.7, // 70% threshold
            confidence,
            reason: confidence > 0.7 ? 'Melody verified' : 'Melody accuracy too low'
        };
    }
    
    /**
     * Verify harmony response
     */
    verifyHarmonyResponse(challenge, response) {
        if (!response.parts || response.parts.length !== challenge.parts.length) {
            return { success: false, reason: 'Incorrect number of harmony parts', confidence: 0 };
        }
        
        let totalConfidence = 0;
        
        for (let partIndex = 0; partIndex < challenge.parts.length; partIndex++) {
            const expectedPart = challenge.parts[partIndex];
            const playedPart = response.parts[partIndex];
            
            const partVerification = this.verifyMelodyResponse(
                { sequence: expectedPart.notes, tolerance: challenge.tolerance },
                { notes: playedPart.notes }
            );
            
            if (!partVerification.success) {
                return {
                    success: false,
                    reason: `Harmony part ${partIndex + 1} failed: ${partVerification.reason}`,
                    confidence: partVerification.confidence
                };
            }
            
            totalConfidence += partVerification.confidence;
        }
        
        const avgConfidence = totalConfidence / challenge.parts.length;
        
        return {
            success: avgConfidence > 0.6, // Lower threshold for harmony complexity
            confidence: avgConfidence,
            reason: avgConfidence > 0.6 ? 'Harmony verified' : 'Harmony accuracy too low'
        };
    }
    
    /**
     * Verify rhythm response
     */
    verifyRhythmResponse(challenge, response) {
        if (!response.pattern || response.pattern.length !== challenge.pattern.length) {
            return { success: false, reason: 'Incorrect rhythm pattern length', confidence: 0 };
        }
        
        let totalError = 0;
        const tolerance = challenge.tolerance;
        
        for (let i = 0; i < challenge.pattern.length; i++) {
            const expected = challenge.pattern[i];
            const played = response.pattern[i];
            
            // Check duration accuracy
            const durationError = Math.abs(expected.duration - played.duration) / expected.duration;
            totalError += durationError;
            
            if (durationError > tolerance) {
                return {
                    success: false,
                    reason: `Rhythm beat ${i + 1} timing error: ${(durationError * 100).toFixed(1)}%`,
                    confidence: Math.max(0, 1 - durationError / tolerance)
                };
            }
        }
        
        const avgError = totalError / challenge.pattern.length;
        const confidence = Math.max(0, 1 - (avgError / tolerance));
        
        return {
            success: confidence > 0.6, // 60% threshold for rhythm
            confidence,
            reason: confidence > 0.6 ? 'Rhythm verified' : 'Rhythm timing too inaccurate'
        };
    }
    
    /**
     * Get device profile with musical characteristics
     */
    getDeviceProfile(deviceId) {
        if (!this.devices.has(deviceId)) {
            throw new Error(`Device ${deviceId} not found`);
        }
        
        const device = this.devices.get(deviceId);
        const melody = this.melodies.get(deviceId);
        const harmonicGroup = this.harmonicGroups.get(device.familyId);
        
        return {
            device,
            melody,
            harmonicGroup: {
                familyId: harmonicGroup.familyId,
                familyName: harmonicGroup.familyName,
                musicalKey: harmonicGroup.musicalKey,
                registerRange: harmonicGroup.registerRange
            },
            harmonicRelationships: device.harmonicRelationships,
            trustMetrics: {
                trustLevel: device.trustLevel,
                authenticationCount: device.authenticationHistory.length,
                successRate: device.authenticationHistory.length > 0 ? 
                    device.authenticationHistory.filter(auth => auth.success).length / device.authenticationHistory.length : 0,
                lastAuthenticated: device.lastAuthenticated
            }
        };
    }
    
    /**
     * Generate ensemble harmony for multiple devices
     */
    generateEnsembleHarmony(deviceIds) {
        const devices = deviceIds
            .filter(id => this.devices.has(id))
            .map(id => ({
                device: this.devices.get(id),
                melody: this.melodies.get(id)
            }));
        
        if (devices.length === 0) {
            return { success: false, reason: 'No valid devices provided' };
        }
        
        // Find common harmonic group
        const familyIds = [...new Set(devices.map(d => d.device.familyId))];
        if (familyIds.length > 1) {
            return { success: false, reason: 'Devices from different families cannot harmonize' };
        }
        
        const harmonicGroup = this.harmonicGroups.get(familyIds[0]);
        
        // Create ensemble arrangement
        const ensemble = {
            familyId: familyIds[0],
            familyKey: harmonicGroup.musicalKey,
            registerRange: harmonicGroup.registerRange,
            devices: devices.map(({ device, melody }) => ({
                deviceId: device.id,
                role: device.musicalProfile.harmonicRole.primary,
                rootNote: melody.rootNote,
                rootOctave: melody.rootOctave,
                melody: melody.notes.map(note => ({
                    frequency: note.frequency,
                    duration: note.duration,
                    note: note.note,
                    octave: note.octave
                }))
            })),
            totalDuration: Math.max(...devices.map(d => d.melody.totalDuration)),
            harmonyType: devices.length <= 2 ? 'duet' : 
                        devices.length <= 4 ? 'quartet' : 'ensemble'
        };
        
        return { success: true, ensemble };
    }
}

module.exports = HarmonicDeviceAuth;

// Example usage and testing
if (require.main === module) {
    async function demonstrateHarmonicAuth() {
        console.log('🎼 Harmonic Device Authentication Demo\n');
        
        // Import MusicCryptoFamily for integration
        const MusicCryptoFamily = require('./musical-crypto-family');
        
        const musicCrypto = new MusicCryptoFamily();
        await new Promise(resolve => musicCrypto.once('initialized', resolve));
        
        const harmonicAuth = new HarmonicDeviceAuth(musicCrypto);
        await new Promise(resolve => harmonicAuth.once('initialized', resolve));
        
        // Create a family
        const family = await musicCrypto.createFamily('Test Family');
        
        // Register devices
        const laptop = await harmonicAuth.registerDevice({
            type: 'laptop',
            platform: 'macOS',
            browser: 'Chrome',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            screen: { width: 1920, height: 1080 }
        }, family.id);
        
        const phone = await harmonicAuth.registerDevice({
            type: 'mobile',
            platform: 'iOS',
            browser: 'Safari',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
            screen: { width: 390, height: 844 }
        }, family.id);
        
        // Show device melodies
        console.log('\n🎵 Device Melodies:');
        console.log(`Laptop (${laptop.musicalProfile.personalNote}${laptop.musicalProfile.personalOctave}):`);
        laptop.musicalProfile.melody.notes.slice(0, 4).forEach((note, i) => {
            console.log(`  ${i + 1}. ${note.note}${note.octave} (${note.frequency.toFixed(1)}Hz) - ${note.duration}s`);
        });
        
        console.log(`\nPhone (${phone.musicalProfile.personalNote}${phone.musicalProfile.personalOctave}):`);
        phone.musicalProfile.melody.notes.slice(0, 4).forEach((note, i) => {
            console.log(`  ${i + 1}. ${note.note}${note.octave} (${note.frequency.toFixed(1)}Hz) - ${note.duration}s`);
        });
        
        // Test authentication
        console.log('\n🔐 Testing Authentication:');
        const session = await harmonicAuth.startAuthentication(laptop.id, 'melody');
        console.log(`Started session ${session.sessionId.slice(0, 8)}...`);
        
        // Simulate correct response
        const response = {
            notes: session.challenge.sequence.map(note => ({
                frequency: note.frequency * (1 + (Math.random() - 0.5) * 0.02), // 2% variation
                duration: note.duration
            }))
        };
        
        const verification = await harmonicAuth.verifyAuthentication(session.sessionId, response);
        console.log(`Authentication result: ${verification.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`Confidence: ${(verification.confidence * 100).toFixed(1)}%`);
        
        // Generate ensemble harmony
        console.log('\n🎼 Ensemble Harmony:');
        const ensemble = harmonicAuth.generateEnsembleHarmony([laptop.id, phone.id]);
        if (ensemble.success) {
            console.log(`Created ${ensemble.ensemble.harmonyType} in ${ensemble.ensemble.familyKey}`);
            ensemble.ensemble.devices.forEach((device, i) => {
                console.log(`  ${i + 1}. Device ${device.deviceId.slice(0, 8)}... - ${device.role} (${device.rootNote}${device.rootOctave})`);
            });
        }
        
        console.log('\n✅ Harmonic Device Authentication demonstration complete!');
    }
    
    demonstrateHarmonicAuth().catch(console.error);
}
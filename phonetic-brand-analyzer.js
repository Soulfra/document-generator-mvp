#!/usr/bin/env node

/**
 * 🗣️ Phonetic Brand Analyzer
 * 
 * Analyzes brand name pronunciations across languages and maps them to
 * musical frequencies and visual textures. Creates tonal signatures that
 * drive 3D texture animations for universal brand recognition.
 * 
 * "DeathToData" → English bass tones → Dark textures
 * "Muerte-a-Datos" → Spanish warmth → Flowing textures
 * "数据之死" → Mandarin precision → Crystalline textures
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class PhoneticBrandAnalyzer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Audio processing
            sampleRate: config.sampleRate || 44100,
            fftSize: config.fftSize || 2048,
            smoothingTimeConstant: config.smoothingTimeConstant || 0.8,
            
            // Language detection
            supportedLanguages: config.supportedLanguages || [
                'en-US', 'es-ES', 'zh-CN', 'ar-SA', 'hi-IN', 
                'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'pt-BR'
            ],
            
            // Frequency mapping
            baseFrequency: config.baseFrequency || 528, // Love frequency
            frequencyRange: config.frequencyRange || [200, 1000],
            
            ...config
        };
        
        // Phoneme to frequency mappings based on linguistic patterns
        this.phonemeFrequencies = {
            // Vowels - create base resonance
            'a': { frequency: 528, color: 'warm_red', texture: 'flowing' },
            'e': { frequency: 639, color: 'blue', texture: 'ripple' },
            'i': { frequency: 741, color: 'indigo', texture: 'sharp' },
            'o': { frequency: 432, color: 'orange', texture: 'round' },
            'u': { frequency: 396, color: 'deep_red', texture: 'bass' },
            
            // Consonants - add texture and rhythm
            'b': { frequency: 174, color: 'earth', texture: 'bump' },
            'c': { frequency: 285, color: 'crystal', texture: 'click' },
            'd': { frequency: 396, color: 'dark', texture: 'thud' },
            'f': { frequency: 741, color: 'air', texture: 'whisper' },
            'g': { frequency: 417, color: 'growth', texture: 'growl' },
            'h': { frequency: 852, color: 'breath', texture: 'mist' },
            'j': { frequency: 639, color: 'joy', texture: 'bounce' },
            'k': { frequency: 963, color: 'sharp', texture: 'crack' },
            'l': { frequency: 528, color: 'liquid', texture: 'flow' },
            'm': { frequency: 432, color: 'maternal', texture: 'hum' },
            'n': { frequency: 639, color: 'nasal', texture: 'drone' },
            'p': { frequency: 285, color: 'pop', texture: 'burst' },
            'r': { frequency: 417, color: 'rough', texture: 'roll' },
            's': { frequency: 852, color: 'silver', texture: 'hiss' },
            't': { frequency: 741, color: 'precise', texture: 'tap' },
            'v': { frequency: 639, color: 'vibrant', texture: 'buzz' },
            'w': { frequency: 528, color: 'wave', texture: 'wobble' },
            'y': { frequency: 741, color: 'bright', texture: 'lift' },
            'z': { frequency: 852, color: 'electric', texture: 'zip' }
        };
        
        // Language-specific pronunciation patterns
        this.languagePatterns = {
            'en-US': {
                name: 'English (US)',
                rhythm: 'stress-timed',
                baseFrequency: 528,
                harmonics: [1.0, 1.5, 2.0],
                culturalColors: ['corporate_blue', 'tech_silver', 'power_red'],
                textureStyle: 'geometric'
            },
            'es-ES': {
                name: 'Spanish',
                rhythm: 'syllable-timed',
                baseFrequency: 639,
                harmonics: [1.0, 1.25, 1.5, 2.0],
                culturalColors: ['warm_orange', 'passionate_red', 'earth_brown'],
                textureStyle: 'flowing'
            },
            'zh-CN': {
                name: 'Mandarin Chinese',
                rhythm: 'tone-based',
                baseFrequency: 741,
                harmonics: [1.0, 1.618, 2.0, 2.618], // Golden ratio
                culturalColors: ['imperial_gold', 'jade_green', 'lucky_red'],
                textureStyle: 'crystalline'
            },
            'ar-SA': {
                name: 'Arabic',
                rhythm: 'root-pattern',
                baseFrequency: 432,
                harmonics: [1.0, 1.33, 1.5, 2.0],
                culturalColors: ['desert_gold', 'ocean_blue', 'night_purple'],
                textureStyle: 'calligraphic'
            },
            'hi-IN': {
                name: 'Hindi',
                rhythm: 'mora-timed',
                baseFrequency: 963,
                harmonics: [1.0, 1.125, 1.5, 2.0],
                culturalColors: ['saffron_orange', 'spiritual_purple', 'nature_green'],
                textureStyle: 'organic'
            },
            'fr-FR': {
                name: 'French',
                rhythm: 'syllable-timed',
                baseFrequency: 852,
                harmonics: [1.0, 1.2, 1.5, 2.0],
                culturalColors: ['elegant_blue', 'romantic_pink', 'luxury_gold'],
                textureStyle: 'elegant'
            },
            'de-DE': {
                name: 'German',
                rhythm: 'stress-timed',
                baseFrequency: 417,
                harmonics: [1.0, 1.414, 2.0], // Mathematical precision
                culturalColors: ['engineering_gray', 'precision_blue', 'strength_black'],
                textureStyle: 'industrial'
            },
            'ja-JP': {
                name: 'Japanese',
                rhythm: 'mora-timed',
                baseFrequency: 639,
                harmonics: [1.0, 1.5, 2.0, 3.0],
                culturalColors: ['zen_white', 'sakura_pink', 'traditional_red'],
                textureStyle: 'minimalist'
            },
            'ko-KR': {
                name: 'Korean',
                rhythm: 'syllable-timed',
                baseFrequency: 528,
                harmonics: [1.0, 1.25, 1.5, 2.0],
                culturalColors: ['hanbok_blue', 'prosperity_gold', 'harmony_white'],
                textureStyle: 'harmonic'
            },
            'pt-BR': {
                name: 'Portuguese (Brazil)',
                rhythm: 'syllable-timed',
                baseFrequency: 639,
                harmonics: [1.0, 1.2, 1.5, 2.0],
                culturalColors: ['carnival_yellow', 'tropical_green', 'sunset_orange'],
                textureStyle: 'vibrant'
            }
        };
        
        // Brand phonetic database
        this.brandDatabase = new Map();
        
        // Audio analysis components
        this.audioContext = null;
        this.analyzer = null;
        this.microphone = null;
        this.recognition = null;
        
        // Current analysis state
        this.currentAnalysis = {
            language: null,
            phonemes: [],
            frequencies: [],
            brandName: null,
            textureSignature: null,
            confidence: 0
        };
        
        this.initialized = false;
    }
    
    /**
     * Initialize the phonetic brand analyzer
     */
    async initialize() {
        console.log('🗣️ Initializing Phonetic Brand Analyzer...');
        
        try {
            // Initialize audio context
            await this.initializeAudioContext();
            
            // Initialize speech recognition
            await this.initializeSpeechRecognition();
            
            // Load brand database
            await this.loadBrandDatabase();
            
            this.initialized = true;
            console.log('✅ Phonetic Brand Analyzer initialized');
            console.log(`🌍 Supported languages: ${this.config.supportedLanguages.length}`);
            console.log(`📊 Brand database: ${this.brandDatabase.size} entries`);
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Phonetic Brand Analyzer:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Web Audio API context
     */
    async initializeAudioContext() {
        try {
            // Check browser environment
            if (typeof window !== 'undefined' && window.AudioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Create analyzer node
                this.analyzer = this.audioContext.createAnalyser();
                this.analyzer.fftSize = this.config.fftSize;
                this.analyzer.smoothingTimeConstant = this.config.smoothingTimeConstant;
                
                console.log('🔊 Audio context initialized');
            } else {
                console.log('🔕 Audio context not available (Node.js environment)');
            }
        } catch (error) {
            console.warn('⚠️ Could not initialize audio context:', error.message);
        }
    }
    
    /**
     * Initialize speech recognition
     */
    async initializeSpeechRecognition() {
        try {
            if (typeof window !== 'undefined' && window.SpeechRecognition) {
                this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.maxAlternatives = 3;
                
                // Event handlers
                this.recognition.onresult = (event) => {
                    this.handleSpeechResult(event);
                };
                
                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.emit('speech_error', event.error);
                };
                
                this.recognition.onend = () => {
                    this.emit('speech_ended');
                };
                
                console.log('🎤 Speech recognition initialized');
            } else {
                console.log('🎤 Speech recognition not available');
            }
        } catch (error) {
            console.warn('⚠️ Could not initialize speech recognition:', error.message);
        }
    }
    
    /**
     * Load brand phonetic database
     */
    async loadBrandDatabase() {
        // Pre-populate with common brand variations
        const brands = {
            'deathtodata': {
                'en-US': {
                    phonemes: ['d', 'e', 'th', 't', 'u', 'd', 'a', 't', 'a'],
                    ipa: '/dɛθtuˈdeɪtə/',
                    frequency: 396, // Liberation frequency
                    rhythm: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1],
                    textureProfile: {
                        base: 'dark_digital',
                        movement: 'data_destruction',
                        intensity: 0.8,
                        colors: ['#000000', '#ff0000', '#333333']
                    }
                },
                'es-ES': {
                    phonemes: ['m', 'u', 'e', 'r', 't', 'e', 'a', 'd', 'a', 't', 'o', 's'],
                    ipa: '/ˈmweɾ.te a ˈda.tos/',
                    frequency: 528, // Love frequency - transformation
                    rhythm: [1, 0.5, 1, 0.5, 1, 0.8, 1, 0.5, 1, 0.5, 1, 0.5],
                    textureProfile: {
                        base: 'warm_transformation',
                        movement: 'flowing_change',
                        intensity: 0.7,
                        colors: ['#8B4513', '#FF6347', '#FFD700']
                    }
                },
                'zh-CN': {
                    phonemes: ['sh', 'u', 'j', 'u', 'zh', 'i', 's', 'i'],
                    ipa: '/ˈʂu˥˩.tɕy˥˩ ˈʈʂɻ̩˥˩.sɿ˥˩/',
                    frequency: 741, // Expression frequency
                    rhythm: [1, 0, 1, 0, 1, 0, 1, 0], // Tonal pattern
                    textureProfile: {
                        base: 'crystalline_precision',
                        movement: 'geometric_flow',
                        intensity: 0.9,
                        colors: ['#FFD700', '#00FF00', '#FF0000']
                    }
                },
                'ar-SA': {
                    phonemes: ['m', 'a', 'w', 't', 'a', 'l', 'b', 'a', 'y', 'a', 'n', 'a', 't'],
                    ipa: '/mawt al-bajaˈnaːt/',
                    frequency: 432, // Healing frequency
                    rhythm: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1],
                    textureProfile: {
                        base: 'flowing_script',
                        movement: 'calligraphic_wave',
                        intensity: 0.75,
                        colors: ['#B8860B', '#4682B4', '#800080']
                    }
                },
                'hi-IN': {
                    phonemes: ['d', 'e', 't', 'a', 'k', 'i', 'm', 'r', 'i', 't', 'y', 'u'],
                    ipa: '/ˈdeː.tɑː kiː ˈmrɪ.t̪ju/',
                    frequency: 963, // Unity frequency
                    rhythm: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5],
                    textureProfile: {
                        base: 'spiritual_organic',
                        movement: 'cosmic_dance',
                        intensity: 0.85,
                        colors: ['#FF8C00', '#800080', '#228B22']
                    }
                }
            }
        };
        
        // Load into database
        for (const [brandName, languages] of Object.entries(brands)) {
            this.brandDatabase.set(brandName, languages);
        }
        
        console.log(`📚 Loaded ${this.brandDatabase.size} brands with multilingual pronunciations`);
    }
    
    /**
     * Start listening for speech input
     */
    startListening(language = 'en-US') {
        if (!this.recognition) {
            throw new Error('Speech recognition not available');
        }
        
        console.log(`🎤 Starting speech recognition (${language})...`);
        
        this.recognition.lang = language;
        this.currentAnalysis.language = language;
        
        try {
            this.recognition.start();
            this.emit('listening_started', { language });
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            this.emit('listening_error', error);
        }
    }
    
    /**
     * Stop listening for speech input
     */
    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
            console.log('🛑 Stopped speech recognition');
            this.emit('listening_stopped');
        }
    }
    
    /**
     * Handle speech recognition results
     */
    handleSpeechResult(event) {
        const results = Array.from(event.results);
        const latest = results[results.length - 1];
        
        if (latest.isFinal) {
            const transcript = latest[0].transcript.toLowerCase().trim();
            const confidence = latest[0].confidence;
            
            console.log(`🗣️ Speech recognized: "${transcript}" (confidence: ${(confidence * 100).toFixed(1)}%)`);
            
            // Analyze the speech
            this.analyzeSpokenBrand(transcript, this.currentAnalysis.language, confidence);
        }
    }
    
    /**
     * Analyze spoken brand name
     */
    async analyzeSpokenBrand(transcript, language, confidence) {
        console.log(`🔍 Analyzing "${transcript}" in ${language}...`);
        
        try {
            // Clean and normalize transcript
            const cleanTranscript = this.normalizeTranscript(transcript);
            
            // Find matching brand
            const brandMatch = this.findBrandMatch(cleanTranscript);
            
            if (brandMatch) {
                // Get language-specific phonetic data
                const phoneticData = this.getBrandPhonetics(brandMatch.brand, language);
                
                if (phoneticData) {
                    // Generate frequency signature
                    const frequencySignature = this.generateFrequencySignature(phoneticData);
                    
                    // Create texture profile
                    const textureProfile = this.generateTextureProfile(phoneticData, language);
                    
                    // Update current analysis
                    this.currentAnalysis = {
                        language,
                        brandName: brandMatch.brand,
                        transcript: cleanTranscript,
                        phonemes: phoneticData.phonemes,
                        frequencies: frequencySignature,
                        textureSignature: textureProfile,
                        confidence,
                        timestamp: new Date()
                    };
                    
                    console.log(`✅ Brand analysis complete: ${brandMatch.brand} @ ${phoneticData.frequency}Hz`);
                    
                    this.emit('brand_analyzed', this.currentAnalysis);
                    
                    return this.currentAnalysis;
                }
            }
            
            // No match found - create dynamic analysis
            const dynamicAnalysis = await this.createDynamicAnalysis(cleanTranscript, language, confidence);
            
            this.currentAnalysis = dynamicAnalysis;
            this.emit('brand_analyzed', this.currentAnalysis);
            
            return this.currentAnalysis;
            
        } catch (error) {
            console.error('❌ Brand analysis failed:', error);
            this.emit('analysis_error', error);
            throw error;
        }
    }
    
    /**
     * Normalize transcript for analysis
     */
    normalizeTranscript(transcript) {
        return transcript
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, '') // Remove spaces
            .trim();
    }
    
    /**
     * Find brand match in database
     */
    findBrandMatch(cleanTranscript) {
        for (const [brandName, languages] of this.brandDatabase.entries()) {
            // Direct match
            if (cleanTranscript.includes(brandName)) {
                return { brand: brandName, confidence: 1.0 };
            }
            
            // Phonetic similarity check
            for (const [lang, data] of Object.entries(languages)) {
                const phonetic = data.phonemes.join('').toLowerCase();
                if (this.calculateSimilarity(cleanTranscript, phonetic) > 0.7) {
                    return { brand: brandName, confidence: 0.8 };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Calculate string similarity (Levenshtein distance based)
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * Get brand phonetics for specific language
     */
    getBrandPhonetics(brandName, language) {
        const brandData = this.brandDatabase.get(brandName);
        
        if (brandData && brandData[language]) {
            return brandData[language];
        }
        
        // Fallback to English if available
        if (brandData && brandData['en-US']) {
            console.warn(`⚠️ No ${language} data for ${brandName}, using English fallback`);
            return brandData['en-US'];
        }
        
        return null;
    }
    
    /**
     * Generate frequency signature from phonetic data
     */
    generateFrequencySignature(phoneticData) {
        const baseFreq = phoneticData.frequency;
        const harmonics = [];
        
        // Generate harmonic series based on phonemes
        phoneticData.phonemes.forEach((phoneme, index) => {
            const phonemeData = this.phonemeFrequencies[phoneme.toLowerCase()];
            
            if (phonemeData) {
                const harmonicFreq = baseFreq * (1 + index * 0.1);
                harmonics.push({
                    phoneme,
                    frequency: harmonicFreq,
                    amplitude: 1 / (index + 1), // Natural harmonic falloff
                    color: phonemeData.color,
                    texture: phonemeData.texture
                });
            }
        });
        
        // Add rhythm-based frequency modulation
        const rhythmSignature = phoneticData.rhythm || [1];
        const modulatedFreqs = harmonics.map((harmonic, index) => ({
            ...harmonic,
            rhythmFactor: rhythmSignature[index % rhythmSignature.length],
            finalFrequency: harmonic.frequency * rhythmSignature[index % rhythmSignature.length]
        }));
        
        return {
            baseFrequency: baseFreq,
            harmonics: modulatedFreqs,
            totalDuration: rhythmSignature.length,
            averageFrequency: modulatedFreqs.reduce((sum, h) => sum + h.finalFrequency, 0) / modulatedFreqs.length
        };
    }
    
    /**
     * Generate texture profile for 3D rendering
     */
    generateTextureProfile(phoneticData, language) {
        const languagePattern = this.languagePatterns[language] || this.languagePatterns['en-US'];
        
        const textureProfile = {
            // Base texture properties
            baseTexture: phoneticData.textureProfile?.base || 'neutral',
            movementStyle: phoneticData.textureProfile?.movement || 'static',
            intensity: phoneticData.textureProfile?.intensity || 0.5,
            
            // Color palette
            colors: phoneticData.textureProfile?.colors || languagePattern.culturalColors,
            
            // Animation properties
            animationSpeed: this.frequencyToAnimationSpeed(phoneticData.frequency),
            rhythmPattern: phoneticData.rhythm || [1, 0.5, 1, 0.5],
            
            // Cultural context
            culturalStyle: languagePattern.textureStyle,
            languageRhythm: languagePattern.rhythm,
            
            // 3D properties
            displacement: this.calculateDisplacement(phoneticData.frequency),
            reflection: this.calculateReflection(languagePattern.baseFrequency),
            opacity: this.calculateOpacity(phoneticData.textureProfile?.intensity || 0.5),
            
            // Shader parameters
            shaderUniforms: {
                uTime: 0.0,
                uFrequency: phoneticData.frequency / 1000.0, // Normalize for shader
                uIntensity: phoneticData.textureProfile?.intensity || 0.5,
                uLanguageId: this.languageToId(language),
                uRhythm: phoneticData.rhythm || [1.0, 0.5, 1.0, 0.5]
            }
        };
        
        return textureProfile;
    }
    
    /**
     * Create dynamic analysis for unknown brands/words
     */
    async createDynamicAnalysis(transcript, language, confidence) {
        console.log(`🔧 Creating dynamic analysis for "${transcript}"`);
        
        // Break down into phonemes (simplified)
        const phonemes = this.breakIntoPhonemes(transcript);
        
        // Calculate average frequency based on phonemes
        const avgFrequency = this.calculateAverageFrequency(phonemes);
        
        // Get language pattern
        const languagePattern = this.languagePatterns[language] || this.languagePatterns['en-US'];
        
        // Create synthetic phonetic data
        const syntheticPhoneticData = {
            phonemes,
            frequency: avgFrequency,
            rhythm: this.generateRhythm(phonemes.length),
            textureProfile: {
                base: 'dynamic_generated',
                movement: 'adaptive_flow',
                intensity: confidence,
                colors: languagePattern.culturalColors
            }
        };
        
        // Generate signatures
        const frequencySignature = this.generateFrequencySignature(syntheticPhoneticData);
        const textureProfile = this.generateTextureProfile(syntheticPhoneticData, language);
        
        return {
            language,
            brandName: `dynamic_${crypto.randomBytes(4).toString('hex')}`,
            transcript,
            phonemes,
            frequencies: frequencySignature,
            textureSignature: textureProfile,
            confidence,
            dynamic: true,
            timestamp: new Date()
        };
    }
    
    /**
     * Break text into simplified phonemes
     */
    breakIntoPhonemes(text) {
        // Simplified phoneme extraction (real implementation would use IPA)
        return text.toLowerCase().split('').filter(char => /[a-z]/.test(char));
    }
    
    /**
     * Calculate average frequency for phonemes
     */
    calculateAverageFrequency(phonemes) {
        const frequencies = phonemes.map(phoneme => {
            const data = this.phonemeFrequencies[phoneme];
            return data ? data.frequency : 528; // Default to love frequency
        });
        
        return frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
    }
    
    /**
     * Generate rhythm pattern for phonemes
     */
    generateRhythm(length) {
        const patterns = [
            [1, 0.5], // Simple binary
            [1, 0.5, 0.8], // Triple
            [1, 0.3, 0.6, 0.3], // Quadruple
            [1, 0.5, 1, 0.5, 0.8] // Complex
        ];
        
        const pattern = patterns[Math.min(length - 1, patterns.length - 1)];
        
        // Repeat pattern to match phoneme length
        const rhythm = [];
        for (let i = 0; i < length; i++) {
            rhythm.push(pattern[i % pattern.length]);
        }
        
        return rhythm;
    }
    
    /**
     * Convert frequency to animation speed
     */
    frequencyToAnimationSpeed(frequency) {
        // Map frequency range to animation speed (0.1 to 2.0)
        const minFreq = this.config.frequencyRange[0];
        const maxFreq = this.config.frequencyRange[1];
        const normalized = (frequency - minFreq) / (maxFreq - minFreq);
        return 0.1 + normalized * 1.9;
    }
    
    /**
     * Calculate displacement for 3D effects
     */
    calculateDisplacement(frequency) {
        return (frequency / 1000) * 0.5; // Scale for 3D displacement
    }
    
    /**
     * Calculate reflection based on frequency
     */
    calculateReflection(frequency) {
        return Math.min(1.0, frequency / 741); // Normalize to expression frequency
    }
    
    /**
     * Calculate opacity based on intensity
     */
    calculateOpacity(intensity) {
        return 0.3 + intensity * 0.7; // Range from 0.3 to 1.0
    }
    
    /**
     * Convert language code to shader ID
     */
    languageToId(language) {
        const languages = Object.keys(this.languagePatterns);
        const index = languages.indexOf(language);
        return index >= 0 ? index / languages.length : 0.5;
    }
    
    /**
     * Add brand to database
     */
    addBrand(brandName, languageData) {
        console.log(`📝 Adding brand: ${brandName}`);
        
        if (!this.brandDatabase.has(brandName)) {
            this.brandDatabase.set(brandName, {});
        }
        
        const brandData = this.brandDatabase.get(brandName);
        Object.assign(brandData, languageData);
        
        this.emit('brand_added', { brandName, languages: Object.keys(brandData) });
    }
    
    /**
     * Get current analysis
     */
    getCurrentAnalysis() {
        return this.currentAnalysis;
    }
    
    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return this.config.supportedLanguages.map(code => ({
            code,
            name: this.languagePatterns[code]?.name || code,
            pattern: this.languagePatterns[code]
        }));
    }
    
    /**
     * Get brand database summary
     */
    getBrandDatabaseSummary() {
        const summary = {};
        
        for (const [brandName, languages] of this.brandDatabase.entries()) {
            summary[brandName] = {
                languages: Object.keys(languages),
                variations: Object.keys(languages).length
            };
        }
        
        return summary;
    }
}

// Export the class
module.exports = PhoneticBrandAnalyzer;

// Demo if run directly
if (require.main === module) {
    const analyzer = new PhoneticBrandAnalyzer();
    
    // Event listeners
    analyzer.on('initialized', () => {
        console.log('🗣️ Phonetic analyzer ready!');
        
        // Demo brand analysis
        setTimeout(() => {
            console.log('\n🧪 Running demo analysis...');
            
            // Simulate speech recognition results
            analyzer.analyzeSpokenBrand('death to data', 'en-US', 0.95);
        }, 1000);
        
        setTimeout(() => {
            analyzer.analyzeSpokenBrand('muerte a datos', 'es-ES', 0.88);
        }, 2000);
        
        setTimeout(() => {
            // Show supported languages
            console.log('\n🌍 Supported Languages:');
            const languages = analyzer.getSupportedLanguages();
            languages.forEach(lang => {
                console.log(`  ${lang.code}: ${lang.name} (${lang.pattern.textureStyle})`);
            });
        }, 3000);
        
        setTimeout(() => {
            // Show brand database
            console.log('\n📚 Brand Database:');
            const summary = analyzer.getBrandDatabaseSummary();
            console.log(JSON.stringify(summary, null, 2));
        }, 4000);
    });
    
    analyzer.on('brand_analyzed', (analysis) => {
        console.log(`🎨 Brand analysis for "${analysis.brandName}":`);
        console.log(`  Language: ${analysis.language}`);
        console.log(`  Base frequency: ${analysis.frequencies.baseFrequency}Hz`);
        console.log(`  Texture style: ${analysis.textureSignature.culturalStyle}`);
        console.log(`  Colors: ${analysis.textureSignature.colors.join(', ')}`);
        console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    });
    
    analyzer.on('listening_started', (data) => {
        console.log(`🎤 Listening started (${data.language})`);
    });
    
    analyzer.on('speech_error', (error) => {
        console.error('❌ Speech error:', error);
    });
    
    // Initialize
    analyzer.initialize().catch(console.error);
}
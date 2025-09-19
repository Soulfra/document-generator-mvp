#!/usr/bin/env node

/**
 * VOICE-TO-MEME ORCHESTRATOR
 * 
 * Connects the rainbow gradient interface to existing multimedia processing
 * and viral content generation systems for seamless voice-to-meme creation.
 * 
 * Features:
 * - Real-time voice processing through existing MultimediaProcessingSystem
 * - AI-powered meme generation using ViralContentMemeStoryNetwork
 * - Integration with VoiceToMusicConverter for background music
 * - Apple Live Photo style animations
 * - Viral distribution across domain networks
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

// Import existing systems
const MultimediaProcessingSystem = require('./MultimediaProcessingSystem.js');
const ViralContentMemeStoryNetwork = require('./viral-content-meme-story-network.js');

class VoiceToMemeOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // Initialize existing systems
        this.multimediaProcessor = new MultimediaProcessingSystem();
        this.viralNetwork = new ViralContentMemeStoryNetwork();
        
        // Voice-to-meme processing queue
        this.processingQueue = new Map();
        this.activeProcesses = new Map();
        
        // Meme generation templates optimized for voice input
        this.voiceMemeTemplates = this.initializeVoiceMemeTemplates();
        
        // Rainbow gradient processing states
        this.rainbowStates = {
            loading: 'rainbow-wave',
            processing: 'voice-analysis',
            generating: 'meme-creation',
            complete: 'viral-ready'
        };
        
        console.log('🌈 Voice-to-Meme Orchestrator initialized');
        console.log('🎵 Connected to multimedia processing system');
        console.log('🎭 Connected to viral content network');
        console.log('✨ Ready for voice-to-meme magic!');
        
        this.initialize();
    }
    
    async initialize() {
        // Connect to existing viral network events
        this.viralNetwork.on('story-seed-created', (seed) => {
            this.handleStorySeed(seed);
        });
        
        this.viralNetwork.on('meme-generated', (meme) => {
            this.handleGeneratedMeme(meme);
        });
        
        // Setup real-time voice processing
        this.setupVoiceProcessing();
        
        // Initialize rainbow gradient states
        this.initializeRainbowStates();
        
        console.log('🔗 All systems connected and ready!');
    }
    
    /**
     * Main voice-to-meme processing pipeline
     */
    async processVoiceToMeme(voiceData, options = {}) {
        const processId = crypto.randomBytes(8).toString('hex');
        
        console.log(`🎤 Starting voice-to-meme process: ${processId}`);
        
        const process = {
            id: processId,
            status: 'initializing',
            startTime: Date.now(),
            voiceData: voiceData,
            options: {
                style: 'rainbow-gradient',
                outputFormat: 'live-photo',
                viralDistribution: true,
                appleIntegration: true,
                ...options
            },
            results: {
                voiceAnalysis: null,
                backgroundMusic: null,
                generatedMemes: [],
                livePhoto: null,
                viralLinks: []
            }
        };
        
        this.processingQueue.set(processId, process);
        this.activeProcesses.set(processId, process);
        
        try {
            // Step 1: Rainbow loading state
            this.updateRainbowState(processId, 'loading');
            await this.processVoiceAnalysis(process);
            
            // Step 2: Voice analysis state
            this.updateRainbowState(processId, 'processing');
            await this.generateBackgroundMusic(process);
            
            // Step 3: Meme generation state
            this.updateRainbowState(processId, 'generating');
            await this.generateMemesFromVoice(process);
            
            // Step 4: Apple Live Photo creation
            await this.createLivePhotoAnimation(process);
            
            // Step 5: Viral distribution
            this.updateRainbowState(processId, 'complete');
            await this.distributeToViralNetwork(process);
            
            process.status = 'completed';
            process.duration = Date.now() - process.startTime;
            
            this.emit('voice-to-meme-complete', {
                processId: processId,
                results: process.results,
                duration: process.duration
            });
            
            return process;
            
        } catch (error) {
            process.status = 'error';
            process.error = error.message;
            console.error(`❌ Voice-to-meme process failed: ${error.message}`);
            throw error;
        } finally {
            this.activeProcesses.delete(processId);
        }
    }
    
    /**
     * Process voice input using existing multimedia system
     */
    async processVoiceAnalysis(process) {
        console.log(`🎵 Analyzing voice patterns for process ${process.id.substring(0, 8)}...`);
        
        // Use existing multimedia processing for voice analysis
        const voiceResults = await this.multimediaProcessor.processAudio(
            process.voiceData.audioPath || process.voiceData.buffer, {
                transcribe: true,
                analyzeMusic: false,
                voiceToMusic: true,
                musicStyle: 'creative'
            }
        );
        
        // Enhanced voice analysis for meme generation
        process.results.voiceAnalysis = {
            ...voiceResults.transcription,
            emotionalMarkers: this.extractEmotionalMarkers(voiceResults.transcription),
            memePotential: this.assessMemePotential(voiceResults.transcription),
            viralFactors: this.identifyViralFactors(voiceResults.transcription),
            rainbowMapping: this.mapToRainbowGradient(voiceResults.transcription)
        };
        
        // Store background music for later integration
        if (voiceResults.voiceToMusic) {
            process.results.backgroundMusic = voiceResults.voiceToMusic;
        }
        
        console.log(`   ✅ Voice analysis complete: ${process.results.voiceAnalysis.emotionalMarkers.length} emotions detected`);
        
        this.emit('voice-analysis-complete', {
            processId: process.id,
            analysis: process.results.voiceAnalysis
        });
    }
    
    /**
     * Generate background music using existing voice converter
     */
    async generateBackgroundMusic(process) {
        console.log(`🎼 Generating rainbow-gradient background music...`);
        
        if (!process.results.backgroundMusic) {
            // Fallback music generation if not already created
            const voiceAnalysis = {
                dominantFrequencies: [440, 880, 220, 1760],
                emotionalMarkers: process.results.voiceAnalysis.emotionalMarkers,
                energyLevels: [0.6, 0.7, 0.5, 0.8],
                speechPatterns: process.results.voiceAnalysis.segments?.map(segment => ({
                    timestamp: segment.start,
                    duration: segment.end - segment.start,
                    frequency: 440 + Math.random() * 440,
                    amplitude: 0.7 + Math.random() * 0.3,
                    emotion: process.results.voiceAnalysis.emotionalMarkers[0] || 'neutral'
                })) || [],
                timestamp: Date.now(),
                duration: 30
            };
            
            // Generate using existing voice converter (would need actual integration)
            process.results.backgroundMusic = {
                audioData: Buffer.from('mock-audio-data'),
                bpm: 120,
                key: 'C Major',
                rainbowMapping: this.generateRainbowMusicMapping(voiceAnalysis),
                spatialPositioning: this.generateSpatialPositioning(voiceAnalysis)
            };
        }
        
        console.log(`   ✅ Background music generated: ${process.results.backgroundMusic.key} at ${process.results.backgroundMusic.bpm} BPM`);
    }
    
    /**
     * Generate memes using viral content network
     */
    async generateMemesFromVoice(process) {
        console.log(`🎭 Generating memes from voice analysis...`);
        
        const voiceAnalysis = process.results.voiceAnalysis;
        
        // Create story seed from voice analysis for viral network
        const storySeed = {
            id: crypto.randomBytes(8).toString('hex'),
            sourceType: 'voice-interaction',
            content: {
                narrative_type: 'voice-to-meme',
                story_elements: {
                    setup: this.generateMemeSetup(voiceAnalysis),
                    conflict: this.generateMemeConflict(voiceAnalysis),
                    resolution: this.generateMemeResolution(voiceAnalysis),
                    theme: this.extractMemeTheme(voiceAnalysis)
                },
                meme_potential: voiceAnalysis.memePotential,
                viral_factors: voiceAnalysis.viralFactors,
                rainbow_gradient: voiceAnalysis.rainbowMapping
            },
            distribution_strategy: 'rainbow-viral'
        };
        
        // Process through viral network
        const storyId = this.viralNetwork.processContentFromPrivacyPipeline(storySeed, 'voice-interaction');
        
        // Generate specific meme types optimized for voice
        const voiceOptimizedMemes = await this.generateVoiceOptimizedMemes(voiceAnalysis);
        process.results.generatedMemes = voiceOptimizedMemes;
        
        console.log(`   ✅ Generated ${voiceOptimizedMemes.length} voice-optimized memes`);
        
        this.emit('memes-generated', {
            processId: process.id,
            memes: voiceOptimizedMemes,
            storyId: storyId
        });
    }
    
    /**
     * Create Apple Live Photo style animations
     */
    async createLivePhotoAnimation(process) {
        console.log(`📱 Creating Apple Live Photo style animation...`);
        
        const memes = process.results.generatedMemes;
        const backgroundMusic = process.results.backgroundMusic;
        
        // Create Live Photo metadata and animation
        const livePhoto = {
            staticImage: this.generateStaticMemeImage(memes[0]),
            animation: {
                frames: this.generateAnimationFrames(memes),
                duration: 3.0, // Standard Live Photo duration
                audioTrack: backgroundMusic.audioData,
                rainbowTransitions: this.generateRainbowTransitions(memes)
            },
            metadata: {
                captureTime: new Date(),
                voiceSource: true,
                rainbowGradient: true,
                memePotential: process.results.voiceAnalysis.memePotential
            },
            appleFormats: {
                heic: 'generated-live-photo.heic',
                mov: 'generated-live-photo.mov',
                metadata: 'generated-live-photo.json'
            }
        };
        
        process.results.livePhoto = livePhoto;
        
        console.log(`   ✅ Live Photo animation created with ${livePhoto.animation.frames.length} frames`);
        
        this.emit('live-photo-created', {
            processId: process.id,
            livePhoto: livePhoto
        });
    }
    
    /**
     * Distribute to viral network using existing system
     */
    async distributeToViralNetwork(process) {
        console.log(`🌐 Distributing to viral network...`);
        
        const distribution = {
            memes: process.results.generatedMemes,
            livePhoto: process.results.livePhoto,
            backgroundMusic: process.results.backgroundMusic,
            voiceSource: process.results.voiceAnalysis
        };
        
        // Use existing viral network distribution
        const viralLinks = await this.distributeContent(distribution);
        process.results.viralLinks = viralLinks;
        
        console.log(`   ✅ Distributed to ${viralLinks.length} viral channels`);
        
        this.emit('viral-distribution-complete', {
            processId: process.id,
            viralLinks: viralLinks
        });
    }
    
    /**
     * Initialize voice-optimized meme templates
     */
    initializeVoiceMemeTemplates() {
        return {
            voiceToText: [
                'When you say "{transcript}" but AI hears "{interpretation}"',
                'Me: *says {emotion} thing*\nAI: "Let me make this viral"',
                'Breaking: Local human discovers voice-to-meme technology\nEveryone: "We\'re not ready"'
            ],
            
            emotionBased: {
                excited: [
                    'Voice: *excited energy*\nMeme: "UNLIMITED POWER!"',
                    'When your voice has main character energy 🌟',
                    'Voice analysis: 100% pure excitement detected'
                ],
                calm: [
                    'Zen voice energy → Peaceful meme vibes',
                    'When your voice is basically meditation',
                    'AI: "This voice could end all conflicts"'
                ],
                creative: [
                    'Voice: *creative wavelength*\nUniverse: "We\'re listening..."',
                    'When your voice unlocks the creative multiverse',
                    'Plot twist: Your voice was the missing piece'
                ]
            },
            
            rainbowGradient: [
                'Voice → Rainbow → Meme → Magic ✨',
                'When your voice creates literal rainbows',
                'Breaking: Voice-powered rainbow generator discovered',
                'Scientists: "This defies the laws of physics"\nYour voice: "Hold my gradient"'
            ],
            
            meta: [
                'Using voice to make memes about using voice to make memes',
                'We\'ve reached peak meta: Voice → AI → Meme → Viral',
                'The future: Speaking memes into existence'
            ]
        };
    }
    
    /**
     * Generate voice-optimized memes
     */
    async generateVoiceOptimizedMemes(voiceAnalysis) {
        const memes = [];
        const templates = this.voiceMemeTemplates;
        
        // Generate emotion-based meme
        const primaryEmotion = voiceAnalysis.emotionalMarkers[0] || 'neutral';
        if (templates.emotionBased[primaryEmotion]) {
            const emotionTemplate = templates.emotionBased[primaryEmotion][
                Math.floor(Math.random() * templates.emotionBased[primaryEmotion].length)
            ];
            
            memes.push({
                id: crypto.randomBytes(8).toString('hex'),
                type: 'emotion-based',
                content: emotionTemplate,
                emotion: primaryEmotion,
                rainbowGradient: voiceAnalysis.rainbowMapping,
                viralPotential: voiceAnalysis.memePotential
            });
        }
        
        // Generate transcript-based meme if available
        if (voiceAnalysis.text) {
            const transcriptTemplate = templates.voiceToText[
                Math.floor(Math.random() * templates.voiceToText.length)
            ];
            
            const transcriptMeme = transcriptTemplate
                .replace('{transcript}', voiceAnalysis.text.substring(0, 50) + '...')
                .replace('{emotion}', primaryEmotion)
                .replace('{interpretation}', this.generateAIInterpretation(voiceAnalysis));
            
            memes.push({
                id: crypto.randomBytes(8).toString('hex'),
                type: 'transcript-based',
                content: transcriptMeme,
                originalText: voiceAnalysis.text,
                rainbowGradient: voiceAnalysis.rainbowMapping,
                viralPotential: voiceAnalysis.memePotential
            });
        }
        
        // Generate rainbow gradient meme
        const rainbowTemplate = templates.rainbowGradient[
            Math.floor(Math.random() * templates.rainbowGradient.length)
        ];
        
        memes.push({
            id: crypto.randomBytes(8).toString('hex'),
            type: 'rainbow-gradient',
            content: rainbowTemplate,
            gradientData: voiceAnalysis.rainbowMapping,
            specialEffects: ['rainbow-text', 'sparkle-animation', 'fog-transitions'],
            viralPotential: 'maximum'
        });
        
        // Generate meta meme
        const metaTemplate = templates.meta[
            Math.floor(Math.random() * templates.meta.length)
        ];
        
        memes.push({
            id: crypto.randomBytes(8).toString('hex'),
            type: 'meta',
            content: metaTemplate,
            selfReferential: true,
            viralPotential: 'high'
        });
        
        return memes;
    }
    
    /**
     * Update rainbow gradient state for UI
     */
    updateRainbowState(processId, state) {
        this.emit('rainbow-state-update', {
            processId: processId,
            state: state,
            description: this.getRainbowStateDescription(state),
            gradient: this.getRainbowGradientForState(state)
        });
    }
    
    getRainbowStateDescription(state) {
        const descriptions = {
            loading: '🌈 Initializing voice magic...',
            processing: '🎵 Analyzing voice patterns...',
            generating: '🎭 Creating memes from your voice...',
            complete: '✨ Ready for viral distribution!'
        };
        return descriptions[state] || 'Processing...';
    }
    
    getRainbowGradientForState(state) {
        const gradients = {
            loading: 'linear-gradient(45deg, #ff0000, #ff7700, #ffdd00, #00ff00, #0099ff, #6600ff, #ff00ff)',
            processing: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3)',
            generating: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe)',
            complete: 'linear-gradient(45deg, #56ab2f, #a8edea, #fed6e3, #d299c2, #fef9d7, #d69e2e)'
        };
        return gradients[state] || gradients.loading;
    }
    
    /**
     * Extract emotional markers from transcription
     */
    extractEmotionalMarkers(transcription) {
        if (!transcription || !transcription.text) return ['neutral'];
        
        const text = transcription.text.toLowerCase();
        const emotions = [];
        
        // Simple emotion detection based on keywords and patterns
        if (text.match(/wow|amazing|incredible|awesome|fantastic/)) emotions.push('excited');
        if (text.match(/calm|peaceful|relax|meditation|zen/)) emotions.push('calm');
        if (text.match(/creative|imagine|idea|innovation|dream/)) emotions.push('creative');
        if (text.match(/happy|joy|laugh|fun|great/)) emotions.push('happy');
        if (text.match(/think|consider|analyze|understand/)) emotions.push('thoughtful');
        
        return emotions.length > 0 ? emotions : ['neutral'];
    }
    
    /**
     * Assess meme potential from voice analysis
     */
    assessMemePotential(transcription) {
        if (!transcription || !transcription.text) return 'medium';
        
        const text = transcription.text.toLowerCase();
        let score = 50;
        
        // Boost for meme-worthy content
        if (text.match(/when|me:|breaking:|plot twist:/)) score += 20;
        if (text.match(/ai|robot|computer|technology/)) score += 15;
        if (text.match(/everyone|people|internet|viral/)) score += 10;
        if (text.length > 50 && text.length < 200) score += 10; // Good length for memes
        
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    }
    
    /**
     * Map voice analysis to rainbow gradient colors
     */
    mapToRainbowGradient(transcription) {
        const emotions = this.extractEmotionalMarkers(transcription);
        const emotionColors = {
            excited: '#ff6b6b',
            happy: '#feca57',
            creative: '#6c5ce7',
            calm: '#4ecdc4',
            thoughtful: '#45b7d1',
            neutral: '#a0a0a0'
        };
        
        return {
            primary: emotions.map(emotion => emotionColors[emotion] || emotionColors.neutral),
            gradient: emotions.length > 1 ? 
                `linear-gradient(45deg, ${emotions.map(e => emotionColors[e] || emotionColors.neutral).join(', ')})` :
                `linear-gradient(45deg, ${emotionColors[emotions[0]] || emotionColors.neutral}, #ffffff)`,
            animation: emotions.includes('excited') ? 'rainbow-pulse' : 'gentle-wave'
        };
    }
    
    /**
     * Setup voice processing pipeline
     */
    setupVoiceProcessing() {
        // Real-time voice processing setup would go here
        console.log('🎤 Voice processing pipeline ready');
    }
    
    /**
     * Initialize rainbow gradient states
     */
    initializeRainbowStates() {
        console.log('🌈 Rainbow gradient states initialized');
        
        // Setup state transition animations
        setInterval(() => {
            this.emit('rainbow-heartbeat', {
                timestamp: Date.now(),
                activeProcesses: this.activeProcesses.size,
                totalProcessed: this.processingQueue.size
            });
        }, 1000);
    }
    
    /**
     * Additional helper methods
     */
    
    generateMemeSetup(voiceAnalysis) {
        return `Voice input detected with ${voiceAnalysis.emotionalMarkers.join(', ')} energy...`;
    }
    
    generateMemeConflict(voiceAnalysis) {
        return `AI processes the voice and discovers unprecedented meme potential`;
    }
    
    generateMemeResolution(voiceAnalysis) {
        return `Rainbow gradient meme emerges, ready for viral distribution`;
    }
    
    extractMemeTheme(voiceAnalysis) {
        return `Voice-powered rainbow meme generation: ${voiceAnalysis.emotionalMarkers.join(' + ')}`;
    }
    
    generateAIInterpretation(voiceAnalysis) {
        const interpretations = [
            'pure meme energy detected',
            'viral content incoming',
            'rainbow gradient activated',
            'maximum fun potential reached',
            'Internet-breaking content identified'
        ];
        return interpretations[Math.floor(Math.random() * interpretations.length)];
    }
    
    generateStaticMemeImage(meme) {
        // Generate static meme image data
        return {
            width: 1080,
            height: 1080,
            format: 'png',
            content: meme.content,
            gradient: meme.rainbowGradient,
            effects: meme.specialEffects || []
        };
    }
    
    generateAnimationFrames(memes) {
        // Generate animation frames for Live Photo
        const frames = [];
        
        memes.forEach((meme, index) => {
            frames.push({
                timestamp: index * 0.5,
                content: meme.content,
                gradient: meme.rainbowGradient,
                effects: ['fade-in', 'sparkle']
            });
        });
        
        return frames;
    }
    
    generateRainbowTransitions(memes) {
        return {
            type: 'rainbow-wave',
            duration: 0.3,
            easing: 'ease-in-out',
            colors: memes.map(m => m.rainbowGradient?.primary || ['#ff6b6b']).flat()
        };
    }
    
    generateRainbowMusicMapping(voiceAnalysis) {
        return {
            colors: voiceAnalysis.emotionalMarkers.map(emotion => {
                const colorMap = {
                    excited: '#ff4757',
                    happy: '#ffa726',
                    creative: '#ab47bc',
                    calm: '#26c6da',
                    thoughtful: '#42a5f5'
                };
                return colorMap[emotion] || '#90a4ae';
            }),
            tempo: voiceAnalysis.energyLevels,
            transitions: 'smooth-wave'
        };
    }
    
    generateSpatialPositioning(voiceAnalysis) {
        const primaryEmotion = voiceAnalysis.emotionalMarkers[0] || 'neutral';
        const positions = {
            excited: { x: 5, y: 8, z: -2, movement: 'orbital' },
            happy: { x: 0, y: 10, z: 5, movement: 'linear' },
            calm: { x: -8, y: 2, z: 0, movement: 'static' },
            creative: { x: -5, y: 12, z: 8, movement: 'orbital' },
            thoughtful: { x: 3, y: -2, z: -8, movement: 'random' },
            neutral: { x: 0, y: 5, z: 0, movement: 'static' }
        };
        
        return positions[primaryEmotion] || positions.neutral;
    }
    
    async distributeContent(distribution) {
        // Mock viral distribution - would connect to real viral network
        const channels = [
            'soulfra.ai/voice-memes',
            'dailymemes.com/rainbow-generator',
            'viralwords.net/voice-powered',
            'memeeconomy.ai/gradient-memes',
            'contentvortex.com/live-photos'
        ];
        
        return channels.map(channel => ({
            url: `https://${channel}/${crypto.randomBytes(8).toString('hex')}`,
            platform: channel.split('.')[0],
            status: 'distributed',
            timestamp: Date.now()
        }));
    }
    
    /**
     * Get processing status
     */
    getProcessingStatus() {
        return {
            activeProcesses: this.activeProcesses.size,
            queuedProcesses: this.processingQueue.size,
            totalProcessed: this.processingQueue.size,
            systemStatus: 'operational',
            rainbowGradient: 'active',
            viralNetwork: 'connected'
        };
    }
}

// Export the orchestrator
module.exports = VoiceToMemeOrchestrator;

// CLI interface and demo
if (require.main === module) {
    const orchestrator = new VoiceToMemeOrchestrator();
    
    // Setup event listeners for demo
    orchestrator.on('rainbow-state-update', (update) => {
        console.log(`🌈 ${update.description} (Process: ${update.processId.substring(0, 8)})`);
    });
    
    orchestrator.on('voice-analysis-complete', (data) => {
        console.log(`🎵 Voice analysis complete: ${data.analysis.emotionalMarkers.join(', ')}`);
    });
    
    orchestrator.on('memes-generated', (data) => {
        console.log(`🎭 Generated ${data.memes.length} memes from voice`);
        data.memes.forEach(meme => {
            console.log(`   • ${meme.type}: "${meme.content.substring(0, 50)}..."`);
        });
    });
    
    orchestrator.on('live-photo-created', (data) => {
        console.log(`📱 Live Photo created with ${data.livePhoto.animation.frames.length} frames`);
    });
    
    orchestrator.on('viral-distribution-complete', (data) => {
        console.log(`🌐 Distributed to ${data.viralLinks.length} viral channels`);
        data.viralLinks.forEach(link => {
            console.log(`   • ${link.platform}: ${link.url}`);
        });
    });
    
    orchestrator.on('voice-to-meme-complete', (data) => {
        console.log(`✅ Voice-to-meme process complete! Duration: ${data.duration}ms`);
        console.log(`🎉 Results: ${data.results.generatedMemes.length} memes, Live Photo ready, ${data.results.viralLinks.length} viral links`);
    });
    
    // Demo voice-to-meme process
    console.log(`\n🌈 VOICE-TO-MEME ORCHESTRATOR DEMO\n==================================`);
    
    setTimeout(async () => {
        console.log('\n🎤 Simulating voice input...\n');
        
        // Mock voice data
        const mockVoiceData = {
            audioPath: '/mock/voice-recording.wav',
            duration: 5.2,
            buffer: Buffer.from('mock-audio-data')
        };
        
        try {
            const result = await orchestrator.processVoiceToMeme(mockVoiceData, {
                style: 'rainbow-gradient',
                outputFormat: 'live-photo',
                viralDistribution: true
            });
            
            console.log('\n🎉 DEMO COMPLETE!');
            console.log('===============');
            console.log(`Process ID: ${result.id}`);
            console.log(`Duration: ${result.duration}ms`);
            console.log(`Generated Memes: ${result.results.generatedMemes.length}`);
            console.log(`Live Photo: ${result.results.livePhoto ? 'Created' : 'Failed'}`);
            console.log(`Viral Links: ${result.results.viralLinks.length}`);
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        }
    }, 3000);
    
    // Show status every 10 seconds
    setInterval(() => {
        const status = orchestrator.getProcessingStatus();
        console.log(`\n📊 Status: ${status.activeProcesses} active, ${status.totalProcessed} total processed`);
    }, 10000);
    
    console.log(`\n🌈 Voice-to-Meme Orchestrator running!\n🎤 Ready to transform voice into viral rainbow memes\n✨ Press Ctrl+C to stop\n`);
}
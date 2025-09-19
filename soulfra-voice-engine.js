/**
 * SOULFRA VOICE ENGINE
 * 
 * Voice recognition system that learns your unique voice patterns.
 * Your voice becomes your digital DNA - secure and personalized.
 */

class SoulFraVoiceEngine {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.voiceProfile = null;
        this.wakePhrases = ['soulfra', 'soul fra', 'hey soulfra'];
        this.confidenceThreshold = 0.7;
        this.voiceCommands = new Map();
        this.lastCommand = null;
        
        // Voice pattern analysis
        this.voiceCharacteristics = {
            pitch: [],
            tone: [],
            rhythm: [],
            accent: null
        };
        
        this.setupCommands();
    }
    
    async initialize() {
        console.log('🎤 Initializing SoulFra Voice Engine...');
        
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Speech recognition not supported in this browser');
        }
        
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;
        
        // Initialize speech synthesis
        this.synthesis = window.speechSynthesis;
        
        // Set up event handlers
        this.setupEventHandlers();
        
        // Load voice profile if exists
        await this.loadVoiceProfile();
        
        console.log('✅ Voice engine ready');
        return true;
    }
    
    setupCommands() {
        // Authentication commands
        this.voiceCommands.set('login to github', () => this.executeCommand('login', 'github'));
        this.voiceCommands.set('connect to github', () => this.executeCommand('login', 'github'));
        this.voiceCommands.set('sign into github', () => this.executeCommand('login', 'github'));
        
        this.voiceCommands.set('login to google', () => this.executeCommand('login', 'google'));
        this.voiceCommands.set('connect to google', () => this.executeCommand('login', 'google'));
        
        this.voiceCommands.set('logout from github', () => this.executeCommand('logout', 'github'));
        this.voiceCommands.set('disconnect github', () => this.executeCommand('logout', 'github'));
        
        this.voiceCommands.set('logout from google', () => this.executeCommand('logout', 'google'));
        this.voiceCommands.set('disconnect google', () => this.executeCommand('logout', 'google'));
        
        // Status commands
        this.voiceCommands.set('what is connected', () => this.executeCommand('status', 'all'));
        this.voiceCommands.set('show my connections', () => this.executeCommand('status', 'all'));
        this.voiceCommands.set('what services are online', () => this.executeCommand('status', 'all'));
        this.voiceCommands.set('connection status', () => this.executeCommand('status', 'all'));
        
        this.voiceCommands.set('show github token', () => this.executeCommand('token', 'github'));
        this.voiceCommands.set('show my github token', () => this.executeCommand('token', 'github'));
        this.voiceCommands.set('get github token', () => this.executeCommand('token', 'github'));
        
        this.voiceCommands.set('show google token', () => this.executeCommand('token', 'google'));
        this.voiceCommands.set('get google token', () => this.executeCommand('token', 'google'));
        
        // Application commands
        this.voiceCommands.set('open github desktop', () => this.executeCommand('open', 'github-desktop'));
        this.voiceCommands.set('launch github wrapper', () => this.executeCommand('open', 'github-desktop'));
        this.voiceCommands.set('open git desktop', () => this.executeCommand('open', 'github-desktop'));
        
        this.voiceCommands.set('open terminal', () => this.executeCommand('open', 'terminal'));
        this.voiceCommands.set('launch terminal', () => this.executeCommand('open', 'terminal'));
        
        this.voiceCommands.set('refresh all', () => this.executeCommand('refresh', 'all'));
        this.voiceCommands.set('update status', () => this.executeCommand('refresh', 'all'));
        this.voiceCommands.set('sync everything', () => this.executeCommand('refresh', 'all'));
        
        // Git commands
        this.voiceCommands.set('show repository status', () => this.executeCommand('git', 'status'));
        this.voiceCommands.set('git status', () => this.executeCommand('git', 'status'));
        this.voiceCommands.set('repository status', () => this.executeCommand('git', 'status'));
        
        this.voiceCommands.set('create branch', () => this.executeCommand('git', 'branch'));
        this.voiceCommands.set('new branch', () => this.executeCommand('git', 'branch'));
        this.voiceCommands.set('create new branch', () => this.executeCommand('git', 'branch'));
        
        this.voiceCommands.set('commit changes', () => this.executeCommand('git', 'commit'));
        this.voiceCommands.set('smart commit', () => this.executeCommand('git', 'commit'));
        this.voiceCommands.set('commit with message', () => this.executeCommand('git', 'commit'));
        
        this.voiceCommands.set('push code', () => this.executeCommand('git', 'push'));
        this.voiceCommands.set('push changes', () => this.executeCommand('git', 'push'));
        this.voiceCommands.set('push and create pull request', () => this.executeCommand('git', 'push'));
        
        this.voiceCommands.set('make branch public', () => this.executeCommand('git', 'permission-public'));
        this.voiceCommands.set('set branch public', () => this.executeCommand('git', 'permission-public'));
        this.voiceCommands.set('change to public', () => this.executeCommand('git', 'permission-public'));
        
        this.voiceCommands.set('make branch remixable', () => this.executeCommand('git', 'permission-remixable'));
        this.voiceCommands.set('set branch remixable', () => this.executeCommand('git', 'permission-remixable'));
        this.voiceCommands.set('change to remixable', () => this.executeCommand('git', 'permission-remixable'));
        
        this.voiceCommands.set('make branch private', () => this.executeCommand('git', 'permission-private'));
        this.voiceCommands.set('set branch private', () => this.executeCommand('git', 'permission-private'));
        this.voiceCommands.set('change to private', () => this.executeCommand('git', 'permission-private'));
        
        this.voiceCommands.set('sync repository', () => this.executeCommand('git', 'sync'));
        this.voiceCommands.set('sync repo', () => this.executeCommand('git', 'sync'));
        this.voiceCommands.set('sync with remote', () => this.executeCommand('git', 'sync'));
        
        // System commands
        this.voiceCommands.set('who am i', () => this.executeCommand('identity', 'self'));
        this.voiceCommands.set('voice profile', () => this.executeCommand('profile', 'voice'));
        this.voiceCommands.set('learn my voice', () => this.executeCommand('learn', 'voice'));
        
        // Help commands
        this.voiceCommands.set('help', () => this.executeCommand('help', 'general'));
        this.voiceCommands.set('what can you do', () => this.executeCommand('help', 'commands'));
        this.voiceCommands.set('show commands', () => this.executeCommand('help', 'commands'));
        this.voiceCommands.set('voice commands', () => this.executeCommand('help', 'commands'));
    }
    
    setupEventHandlers() {
        this.recognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            this.isListening = true;
            this.updateVoiceStatus('Listening...');
        };
        
        this.recognition.onend = () => {
            console.log('🎤 Voice recognition ended');
            this.isListening = false;
            this.updateVoiceStatus('Click to activate voice control');
        };
        
        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceStatus(`Error: ${event.error}`);
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();
                const confidence = event.results[i][0].confidence;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                    this.analyzeVoiceCharacteristics(event.results[i]);
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (finalTranscript) {
                this.processVoiceInput(finalTranscript, event.results[event.resultIndex][0].confidence);
            }
            
            if (interimTranscript) {
                this.updateVoiceStatus(`Hearing: "${interimTranscript}"`);
            }
        };
    }
    
    async processVoiceInput(transcript, confidence) {
        console.log(`🗣️ Voice input: "${transcript}" (confidence: ${confidence})`);
        
        // Check for wake phrase
        const hasWakePhrase = this.wakePhrases.some(phrase => 
            transcript.includes(phrase)
        );
        
        if (!hasWakePhrase) {
            return; // Ignore commands without wake phrase
        }
        
        // Remove wake phrase from transcript
        let command = transcript;
        this.wakePhrases.forEach(phrase => {
            command = command.replace(phrase, '').trim();
        });
        
        // Remove common filler words
        command = command.replace(/\b(please|can you|could you|would you|um|uh)\b/g, '').trim();
        
        console.log(`🎯 Processing command: "${command}"`);
        this.updateVoiceStatus(`Processing: "${command}"`);
        
        // Find matching command
        const matchedCommand = this.findBestCommandMatch(command);
        
        if (matchedCommand && confidence >= this.confidenceThreshold) {
            this.lastCommand = { command, confidence, timestamp: Date.now() };
            await this.voiceCommands.get(matchedCommand)();
        } else if (confidence < this.confidenceThreshold) {
            this.speak("I didn't catch that clearly. Could you repeat?");
            this.updateVoiceStatus("Low confidence - please repeat");
        } else {
            this.speak("I don't understand that command. Say 'help' for available commands.");
            this.updateVoiceStatus("Unknown command");
        }
        
        // Update voice profile
        await this.updateVoiceProfile(transcript, confidence);
    }
    
    findBestCommandMatch(input) {
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [command, action] of this.voiceCommands) {
            const score = this.calculateSimilarity(input, command);
            if (score > bestScore && score > 0.7) {
                bestScore = score;
                bestMatch = command;
            }
        }
        
        return bestMatch;
    }
    
    calculateSimilarity(str1, str2) {
        // Simple word-based similarity scoring
        const words1 = str1.toLowerCase().split(' ');
        const words2 = str2.toLowerCase().split(' ');
        
        let matches = 0;
        words1.forEach(word => {
            if (words2.includes(word)) {
                matches++;
            }
        });
        
        return matches / Math.max(words1.length, words2.length);
    }
    
    async executeCommand(action, target) {
        console.log(`🚀 Executing: ${action} on ${target}`);
        
        try {
            // Use command router if available for unified command processing
            if (window.commandRouter) {
                const command = `${action} ${target}`;
                const result = await window.commandRouter.routeCommand(command, {
                    source: 'voice'
                });
                
                if (result.success) {
                    this.speak(result.result.message || `${action} ${target} completed`);
                } else {
                    this.speak(result.error || `Failed to ${action} ${target}`);
                }
                return;
            }
            
            // Fallback to direct UI integration for backward compatibility
            switch (action) {
                case 'login':
                    await this.handleLogin(target);
                    break;
                
                case 'logout':
                    await this.handleLogout(target);
                    break;
                
                case 'status':
                    await this.handleStatus(target);
                    break;
                
                case 'token':
                    await this.handleToken(target);
                    break;
                
                case 'open':
                    await this.handleOpen(target);
                    break;
                
                case 'refresh':
                    await this.handleRefresh(target);
                    break;
                
                case 'git':
                    await this.handleGit(target);
                    break;
                
                case 'identity':
                    await this.handleIdentity();
                    break;
                
                case 'profile':
                    await this.handleProfile(target);
                    break;
                
                case 'learn':
                    await this.handleLearn(target);
                    break;
                
                case 'help':
                    await this.handleHelp(target);
                    break;
                
                default:
                    this.speak(`Unknown action: ${action}`);
            }
        } catch (error) {
            console.error('Command execution error:', error);
            this.speak(`Error executing command: ${error.message}`);
        }
    }
    
    async handleLogin(service) {
        this.speak(`Logging into ${service}. Opening browser...`);
        
        if (window.loginService) {
            await window.loginService(service);
        } else {
            this.speak(`Cannot login to ${service}. UI not available.`);
        }
    }
    
    async handleLogout(service) {
        this.speak(`Logging out from ${service}`);
        
        if (window.logoutService) {
            await window.logoutService(service);
        } else {
            this.speak(`Cannot logout from ${service}. UI not available.`);
        }
    }
    
    async handleStatus(target) {
        if (target === 'all') {
            try {
                const response = await fetch('http://localhost:8463/providers');
                if (response.ok) {
                    const statuses = await response.json();
                    const connected = Object.entries(statuses)
                        .filter(([service, status]) => status.authenticated)
                        .map(([service]) => service);
                    
                    if (connected.length > 0) {
                        this.speak(`You are connected to: ${connected.join(', ')}`);
                    } else {
                        this.speak('No services are currently connected');
                    }
                } else {
                    this.speak('Cannot check service status right now');
                }
            } catch (error) {
                this.speak('Error checking service status');
            }
        }
    }
    
    async handleToken(service) {
        try {
            const response = await fetch(`http://localhost:8463/token?provider=${service}`);
            if (response.ok) {
                const tokenData = await response.json();
                this.speak(`Token retrieved for ${service}. Account: ${tokenData.account}. Check the screen for details.`);
                
                if (window.showToken) {
                    window.showToken(service);
                }
            } else {
                this.speak(`No token found for ${service}. Please login first.`);
            }
        } catch (error) {
            this.speak(`Error retrieving token for ${service}`);
        }
    }
    
    async handleOpen(target) {
        switch (target) {
            case 'github-desktop':
                this.speak('Opening GitHub Desktop wrapper');
                if (window.openGitHubWrapper) {
                    window.openGitHubWrapper();
                } else {
                    window.open('http://localhost:3337', '_blank');
                }
                break;
            
            case 'terminal':
                this.speak('Terminal access is available. Run: node soulfra-auth-tui.js');
                if (window.openTerminal) {
                    window.openTerminal();
                }
                break;
            
            default:
                this.speak(`Don't know how to open ${target}`);
        }
    }
    
    async handleRefresh(target) {
        this.speak('Refreshing all services');
        if (window.refreshAll) {
            window.refreshAll();
        }
    }
    
    async handleGit(action) {
        try {
            // Use the gitAction function from soulfra-controls.js
            if (window.gitAction) {
                this.speak(`Executing Git ${action}`);
                await window.gitAction(action);
                
                // Log to learning system
                if (window.soulFraLearningEngine) {
                    window.soulFraLearningEngine.logActivity('git_mastery', 'voice_command', {
                        action,
                        timestamp: Date.now(),
                        method: 'voice'
                    });
                }
            } else {
                // Fallback message
                const actionMessages = {
                    'status': 'Repository status requested',
                    'branch': 'Creating new branch',
                    'commit': 'Creating smart commit',
                    'push': 'Pushing changes and creating pull request',
                    'permission-public': 'Setting branch to public',
                    'permission-remixable': 'Setting branch to remixable', 
                    'permission-private': 'Setting branch to private',
                    'sync': 'Syncing repository with remote'
                };
                
                const message = actionMessages[action] || `Git ${action} requested`;
                this.speak(message);
                console.log(`🌳 Git action: ${action}`);
            }
        } catch (error) {
            console.error('Git command failed:', error);
            this.speak(`Git ${action} failed. Please try again.`);
        }
    }
    
    async handleIdentity() {
        if (this.voiceProfile && this.voiceProfile.userName) {
            this.speak(`You are ${this.voiceProfile.userName}. Your voice pattern is recognized.`);
        } else {
            this.speak('Voice profile not yet established. Say "learn my voice" to create one.');
        }
    }
    
    async handleProfile(target) {
        if (target === 'voice') {
            const characteristics = this.analyzeCurrentVoiceCharacteristics();
            this.speak(`Voice profile: Average pitch ${characteristics.avgPitch.toFixed(1)} Hz. Pattern recognition confidence: ${(characteristics.confidence * 100).toFixed(1)}%`);
        }
    }
    
    async handleLearn(target) {
        if (target === 'voice') {
            this.speak('Learning your voice pattern. Please say a few sentences about yourself.');
            this.startVoiceLearning();
        }
    }
    
    async handleHelp(target) {
        if (target === 'commands') {
            const commands = [
                'Login to GitHub or Google',
                'Show connection status',
                'Open GitHub Desktop',
                'Show tokens',
                'Refresh all services'
            ];
            this.speak(`Available commands: ${commands.join(', ')}`);
        } else {
            this.speak('SoulFra Voice Control is active. Say "SoulFra" followed by a command. Say "show commands" for a list.');
        }
    }
    
    analyzeVoiceCharacteristics(result) {
        // Analyze voice patterns for biometric identification
        // This is a simplified implementation - real biometric analysis would be more complex
        
        if (result && result[0]) {
            const confidence = result[0].confidence;
            const transcript = result[0].transcript;
            
            // Estimate pitch based on transcript characteristics
            const estimatedPitch = this.estimatePitch(transcript);
            this.voiceCharacteristics.pitch.push(estimatedPitch);
            
            // Keep only recent samples
            if (this.voiceCharacteristics.pitch.length > 10) {
                this.voiceCharacteristics.pitch.shift();
            }
        }
    }
    
    estimatePitch(transcript) {
        // Simple pitch estimation based on vowel patterns
        // In a real implementation, this would use audio analysis
        const vowels = transcript.match(/[aeiou]/gi) || [];
        const consonants = transcript.match(/[bcdfghjklmnpqrstvwxyz]/gi) || [];
        
        return 100 + (vowels.length / (vowels.length + consonants.length)) * 200;
    }
    
    analyzeCurrentVoiceCharacteristics() {
        const avgPitch = this.voiceCharacteristics.pitch.reduce((a, b) => a + b, 0) / 
                         (this.voiceCharacteristics.pitch.length || 1);
        
        const pitchVariance = this.calculateVariance(this.voiceCharacteristics.pitch);
        const confidence = Math.min(1, this.voiceCharacteristics.pitch.length / 10);
        
        return { avgPitch, pitchVariance, confidence };
    }
    
    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        return variance;
    }
    
    async loadVoiceProfile() {
        try {
            const stored = localStorage.getItem('soulfra-voice-profile');
            if (stored) {
                this.voiceProfile = JSON.parse(stored);
                console.log('📊 Voice profile loaded');
            }
        } catch (error) {
            console.warn('Could not load voice profile:', error);
        }
    }
    
    async updateVoiceProfile(transcript, confidence) {
        if (!this.voiceProfile) {
            this.voiceProfile = {
                userName: null,
                createdAt: new Date(),
                samples: [],
                characteristics: {}
            };
        }
        
        this.voiceProfile.samples.push({
            transcript,
            confidence,
            timestamp: new Date(),
            characteristics: this.analyzeCurrentVoiceCharacteristics()
        });
        
        // Keep only recent samples
        if (this.voiceProfile.samples.length > 50) {
            this.voiceProfile.samples = this.voiceProfile.samples.slice(-50);
        }
        
        // Update overall characteristics
        this.voiceProfile.characteristics = this.analyzeCurrentVoiceCharacteristics();
        
        // Save to localStorage
        try {
            localStorage.setItem('soulfra-voice-profile', JSON.stringify(this.voiceProfile));
        } catch (error) {
            console.warn('Could not save voice profile:', error);
        }
    }
    
    startVoiceLearning() {
        // Start a focused voice learning session
        this.speak('Please tell me your name and describe what you do.');
        
        const originalOnResult = this.recognition.onresult;
        let learningPhrases = 0;
        
        this.recognition.onresult = (event) => {
            originalOnResult(event);
            
            learningPhrases++;
            if (learningPhrases >= 3) {
                this.speak('Voice learning complete. Your pattern has been saved.');
                this.recognition.onresult = originalOnResult;
            } else {
                this.speak('Good. Please say another sentence.');
            }
        };
    }
    
    speak(text) {
        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            // Try to use a pleasant voice
            const voices = this.synthesis.getVoices();
            const preferredVoice = voices.find(voice => 
                voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Alex')
            );
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            this.synthesis.speak(utterance);
        }
        
        console.log(`🗣️ SoulFra: ${text}`);
    }
    
    updateVoiceStatus(status) {
        const statusElement = document.getElementById('voiceStatusText');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    start() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
        }
    }
    
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    isActive() {
        return this.isListening;
    }
    
    getVoiceProfile() {
        return this.voiceProfile;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoulFraVoiceEngine;
}
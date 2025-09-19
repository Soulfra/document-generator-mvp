/**
 * 🛡️📱 HARDWARE FINGERPRINTING CLIENT - Browser Bot Detection
 * 
 * Client-side script for collecting browser fingerprints and behavioral data
 * Tracks mouse movements, typing patterns, and hardware specifications
 * Sends data to anti-bot system for analysis
 */

class HardwareFingerprintingClient {
    constructor(apiUrl = 'http://localhost:3336/api') {
        this.apiUrl = apiUrl;
        this.sessionId = null;
        this.fingerprintHash = null;
        this.isInitialized = false;
        
        // Data collection
        this.mouseMovements = [];
        this.keystrokes = [];
        this.timingIntervals = [];
        this.lastKeystroke = null;
        
        // Collection limits
        this.maxMouseMovements = 1000;
        this.maxKeystrokes = 500;
        this.sendInterval = 5000; // 5 seconds
        
        // Event listeners
        this.eventListeners = [];
        
        console.log('🛡️ Hardware Fingerprinting Client initialized');
    }
    
    async initialize(tin = null) {
        if (this.isInitialized) {
            console.warn('Fingerprinting client already initialized');
            return;
        }
        
        try {
            // Collect browser fingerprint
            const browserFingerprint = await this.collectBrowserFingerprint();
            
            // Collect hardware specs
            const hardwareSpecs = await this.collectHardwareSpecs();
            
            // Initialize session with server
            const response = await fetch(`${this.apiUrl}/fingerprint/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    browserFingerprint,
                    hardwareSpecs,
                    tin
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to initialize fingerprinting: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.sessionId = data.sessionId;
            this.fingerprintHash = data.fingerprintHash;
            this.isInitialized = true;
            
            // Start collecting behavioral data
            this.startDataCollection();
            
            // Start periodic data transmission
            this.startPeriodicTransmission();
            
            console.log(`🔍 Fingerprinting session initialized: ${this.sessionId}`);
            console.log(`🤖 Bot detection probability: ${data.botProbability.toFixed(3)}`);
            
            if (data.verificationRequired) {
                console.warn('⚠️ Additional verification may be required');
                this.displayVerificationWarning();
            }
            
            return {
                sessionId: this.sessionId,
                botProbability: data.botProbability,
                verificationRequired: data.verificationRequired
            };
            
        } catch (error) {
            console.error('Failed to initialize fingerprinting:', error);
            throw error;
        }
    }
    
    async collectBrowserFingerprint() {
        const fingerprint = {
            // Basic browser info
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages || [],
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            
            // Screen info
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            },
            
            // Timezone
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            
            // Plugins
            plugins: Array.from(navigator.plugins).map(plugin => ({
                name: plugin.name,
                filename: plugin.filename,
                description: plugin.description
            })),
            
            // WebGL fingerprint
            webgl: this.getWebGLFingerprint(),
            
            // Canvas fingerprint
            canvas: this.getCanvasFingerprint(),
            
            // Audio context fingerprint
            audio: await this.getAudioFingerprint(),
            
            // Device memory (if available)
            deviceMemory: navigator.deviceMemory,
            
            // Hardware concurrency
            hardwareConcurrency: navigator.hardwareConcurrency,
            
            // Connection info (if available)
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            
            // WebDriver detection
            webdriver: navigator.webdriver,
            
            // Check for headless indicators
            headless: this.detectHeadless()
        };
        
        return fingerprint;
    }
    
    async collectHardwareSpecs() {
        const specs = {
            cores: navigator.hardwareConcurrency || 0,
            memory: navigator.deviceMemory ? navigator.deviceMemory * 1024 : 0, // Convert GB to MB
            platform: navigator.platform,
            architecture: await this.getArchitecture(),
            
            // Performance timing
            performance: {
                timing: performance.timing ? {
                    navigationStart: performance.timing.navigationStart,
                    loadEventEnd: performance.timing.loadEventEnd,
                    domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
                } : null,
                
                memory: performance.memory ? {
                    usedJSMemory: performance.memory.usedJSMemory,
                    totalJSMemory: performance.memory.totalJSMemory,
                    jsMemoryLimit: performance.memory.jsMemoryLimit
                } : null
            }
        };
        
        return specs;
    }
    
    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return null;
            
            return {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                supportedExtensions: gl.getSupportedExtensions()
            };
        } catch (error) {
            return null;
        }
    }
    
    getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Browser fingerprinting 🔍', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Browser fingerprinting 🔍', 4, 17);
            
            return canvas.toDataURL();
        } catch (error) {
            return null;
        }
    }
    
    async getAudioFingerprint() {
        return new Promise((resolve) => {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                const analyser = context.createAnalyser();
                const gainNode = context.createGain();
                const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
                
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(10000, context.currentTime);
                gainNode.gain.setValueAtTime(0, context.currentTime);
                
                oscillator.connect(analyser);
                analyser.connect(scriptProcessor);
                scriptProcessor.connect(gainNode);
                gainNode.connect(context.destination);
                
                scriptProcessor.onaudioprocess = function(bins) {
                    const buffer = new Float32Array(analyser.frequencyBinCount);
                    analyser.getFloatFrequencyData(buffer);
                    const fingerprint = buffer.slice(0, 30).join(',');
                    context.close();
                    resolve(fingerprint);
                };
                
                oscillator.start(0);
                
                setTimeout(() => {
                    resolve(null);
                }, 1000);
                
            } catch (error) {
                resolve(null);
            }
        });
    }
    
    async getArchitecture() {
        // Try to detect architecture through various means
        if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
            try {
                const highEntropy = await navigator.userAgentData.getHighEntropyValues(['architecture']);
                return highEntropy.architecture;
            } catch {}
        }
        
        // Fallback detection
        if (navigator.platform.includes('64')) return 'x64';
        if (navigator.platform.includes('32')) return 'x86';
        if (navigator.platform.includes('ARM')) return 'arm';
        
        return 'unknown';
    }
    
    detectHeadless() {
        // Multiple headless detection techniques
        const indicators = [
            // Check for missing properties that exist in real browsers
            !window.chrome && navigator.userAgent.includes('Chrome'),
            
            // Check for webdriver property
            navigator.webdriver === true,
            
            // Check for specific headless user agents
            navigator.userAgent.includes('HeadlessChrome'),
            navigator.userAgent.includes('PhantomJS'),
            
            // Check for missing plugins
            navigator.plugins.length === 0,
            
            // Check for missing languages
            navigator.languages.length === 0,
            
            // Check for automation indicators
            window.callPhantom !== undefined,
            window._phantom !== undefined,
            window.__nightmare !== undefined,
            
            // Check for selenium
            window.document.$cdc_asdjflasutopfhvcZLmcfl_ !== undefined,
            
            // Check for inconsistent window properties
            window.outerHeight === 0,
            window.outerWidth === 0
        ];
        
        return indicators.filter(Boolean).length >= 2;
    }
    
    startDataCollection() {
        // Mouse movement tracking
        const mouseHandler = (event) => {
            if (this.mouseMovements.length < this.maxMouseMovements) {
                this.mouseMovements.push({
                    x: event.clientX,
                    y: event.clientY,
                    timestamp: Date.now(),
                    type: event.type
                });
            }
        };
        
        // Keyboard tracking
        const keyHandler = (event) => {
            if (this.keystrokes.length < this.maxKeystrokes) {
                const now = Date.now();
                
                this.keystrokes.push({
                    key: event.key,
                    code: event.code,
                    timestamp: now,
                    type: event.type
                });
                
                if (this.lastKeystroke && event.type === 'keydown') {
                    const interval = now - this.lastKeystroke;
                    this.timingIntervals.push(interval);
                }
                
                if (event.type === 'keydown') {
                    this.lastKeystroke = now;
                }
            }
        };
        
        // Click tracking
        const clickHandler = (event) => {
            this.mouseMovements.push({
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now(),
                type: 'click',
                button: event.button
            });
        };
        
        // Scroll tracking
        const scrollHandler = (event) => {
            this.mouseMovements.push({
                x: window.scrollX,
                y: window.scrollY,
                timestamp: Date.now(),
                type: 'scroll'
            });
        };
        
        // Add event listeners
        document.addEventListener('mousemove', mouseHandler, { passive: true });
        document.addEventListener('click', clickHandler, { passive: true });
        document.addEventListener('keydown', keyHandler, { passive: true });
        document.addEventListener('keyup', keyHandler, { passive: true });
        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        // Store references for cleanup
        this.eventListeners = [
            { element: document, event: 'mousemove', handler: mouseHandler },
            { element: document, event: 'click', handler: clickHandler },
            { element: document, event: 'keydown', handler: keyHandler },
            { element: document, event: 'keyup', handler: keyHandler },
            { element: window, event: 'scroll', handler: scrollHandler }
        ];
        
        console.log('📊 Started behavioral data collection');
    }
    
    startPeriodicTransmission() {
        setInterval(async () => {
            await this.transmitMouseData();
            await this.transmitTypingData();
        }, this.sendInterval);
    }
    
    async transmitMouseData() {
        if (!this.isInitialized || this.mouseMovements.length === 0) return;
        
        try {
            const movements = this.mouseMovements.splice(0); // Take all and clear
            
            await fetch(`${this.apiUrl}/fingerprint/mouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    movements
                })
            });
            
            console.log(`🖱️ Transmitted ${movements.length} mouse movements`);
        } catch (error) {
            console.error('Failed to transmit mouse data:', error);
        }
    }
    
    async transmitTypingData() {
        if (!this.isInitialized || this.keystrokes.length === 0) return;
        
        try {
            const keystrokes = this.keystrokes.splice(0); // Take all and clear
            const intervals = this.timingIntervals.splice(0);
            
            await fetch(`${this.apiUrl}/fingerprint/typing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    keystrokes,
                    timingIntervals: intervals
                })
            });
            
            console.log(`⌨️ Transmitted ${keystrokes.length} keystrokes`);
        } catch (error) {
            console.error('Failed to transmit typing data:', error);
        }
    }
    
    async getVerificationStatus() {
        if (!this.isInitialized) {
            throw new Error('Client not initialized');
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/fingerprint/verify/${this.sessionId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to get verification status: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to get verification status:', error);
            throw error;
        }
    }
    
    async performManualVerification(verificationData) {
        if (!this.isInitialized) {
            throw new Error('Client not initialized');
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/fingerprint/verify/${this.sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ verificationData })
            });
            
            if (!response.ok) {
                throw new Error(`Verification failed: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Manual verification failed:', error);
            throw error;
        }
    }
    
    displayVerificationWarning() {
        // Create a simple warning notification
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #ff4444, #ff8844);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(255, 68, 68, 0.3);
            border: 2px solid #ff4444;
        `;
        
        warning.innerHTML = `
            <div style="margin-bottom: 8px;">⚠️ Bot Detection Alert</div>
            <div style="font-size: 0.9em; opacity: 0.9;">Additional verification may be required</div>
        `;
        
        document.body.appendChild(warning);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 10000);
    }
    
    cleanup() {
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        
        this.eventListeners = [];
        this.isInitialized = false;
        
        console.log('🧹 Fingerprinting client cleaned up');
    }
    
    // Utility methods for integration
    static async createAndInitialize(tin = null, apiUrl = 'http://localhost:3336/api') {
        const client = new HardwareFingerprintingClient(apiUrl);
        const result = await client.initialize(tin);
        return { client, ...result };
    }
    
    static isBot(botProbability) {
        return botProbability > 0.7;
    }
    
    static requiresVerification(botProbability) {
        return botProbability > 0.3;
    }
}

// Auto-initialization if script is loaded directly
if (typeof window !== 'undefined') {
    window.HardwareFingerprintingClient = HardwareFingerprintingClient;
    
    // Auto-initialize if data attribute is present
    const script = document.currentScript;
    if (script && script.dataset.autoInit === 'true') {
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const tin = script.dataset.tin || null;
                const apiUrl = script.dataset.apiUrl || 'http://localhost:3336/api';
                
                const { client, botProbability, verificationRequired } = 
                    await HardwareFingerprintingClient.createAndInitialize(tin, apiUrl);
                
                // Expose globally for debugging
                window.fingerprintingClient = client;
                
                console.log('🛡️ Auto-initialized hardware fingerprinting');
                console.log(`🤖 Bot probability: ${botProbability}`);
                
                if (verificationRequired) {
                    console.warn('⚠️ Verification required - user may need to complete additional challenges');
                }
                
            } catch (error) {
                console.error('Failed to auto-initialize fingerprinting:', error);
            }
        });
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HardwareFingerprintingClient;
}
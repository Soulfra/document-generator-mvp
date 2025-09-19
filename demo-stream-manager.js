/**
 * 🌀🎮💊 Demo Stream Manager
 * Manages loading and rotating real demos across 9 streaming domains
 * Where Reality is Optional™
 */

class DemoStreamManager {
    constructor() {
        this.demoManifest = null;
        this.activeStreams = new Map();
        this.rotationTimers = new Map();
        this.isInitialized = false;
        this.focusedStream = null;
        this.streamElements = new Map();
        
        // Performance tracking
        this.loadTimes = new Map();
        this.errorCounts = new Map();
        
        this.init();
    }

    async init() {
        try {
            console.log('🌀 Initializing Demo Stream Manager...');
            await this.loadManifest();
            this.setupStreamElements();
            this.startAutoRotation();
            this.setupKeyboardShortcuts();
            this.isInitialized = true;
            console.log('✅ Demo Stream Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Demo Stream Manager:', error);
        }
    }

    async loadManifest() {
        try {
            const response = await fetch('demo-manifest.json');
            if (!response.ok) {
                throw new Error(`Failed to load manifest: ${response.status}`);
            }
            this.demoManifest = await response.json();
            console.log('📋 Demo manifest loaded:', Object.keys(this.demoManifest.streamingDomains).length, 'domains');
        } catch (error) {
            console.error('❌ Error loading demo manifest:', error);
            // Fallback to basic demo structure
            this.createFallbackManifest();
        }
    }

    createFallbackManifest() {
        console.log('🔄 Creating fallback demo manifest...');
        this.demoManifest = {
            streamingDomains: {
                red: { name: "Gaming Hub", demos: [{ id: "fallback", name: "Gaming Demo", path: "ai-demo-game.html" }] },
                orange: { name: "Brand Showcase", demos: [{ id: "fallback", name: "Brand Demo", path: "brand-showcase-gallery.html" }] },
                yellow: { name: "3D Experiences", demos: [{ id: "fallback", name: "3D Demo", path: "working-demo-3d.html" }] },
                green: { name: "Character Systems", demos: [{ id: "fallback", name: "Character Demo", path: "character-specialization-demo.html" }] },
                white: { name: "Central Hub", demos: [{ id: "fallback", name: "Production Demo", path: "PRODUCTION-DEMO.html" }] },
                blue: { name: "Blockchain & Crypto", demos: [{ id: "fallback", name: "Crypto Demo", path: "crypto-demo.html" }] },
                indigo: { name: "AI & Analytics", demos: [{ id: "fallback", name: "AI Demo", path: "OCR-SEMANTIC-VISUAL-DEMO.html" }] },
                violet: { name: "VC & Business", demos: [{ id: "fallback", name: "VC Demo", path: "vc-demo-interface.html" }] },
                black: { name: "System Core", demos: [{ id: "fallback", name: "System Demo", path: "action-mirror-playground-demo.html" }] }
            },
            rotationSettings: { autoRotate: true, rotationInterval: 30000 }
        };
    }

    setupStreamElements() {
        const domains = Object.keys(this.demoManifest.streamingDomains);
        
        domains.forEach(domain => {
            const streamBox = document.querySelector(`[data-domain="${domain}"]`);
            if (streamBox) {
                this.streamElements.set(domain, streamBox);
                this.setupStreamBox(domain, streamBox);
                
                // Load initial featured demo
                const domainData = this.demoManifest.streamingDomains[domain];
                const featuredDemo = domainData.demos.find(demo => demo.featured) || domainData.demos[0];
                if (featuredDemo) {
                    this.loadDemo(domain, featuredDemo);
                }
            }
        });
        
        console.log(`📦 Setup ${this.streamElements.size} stream elements`);
    }

    setupStreamBox(domain, streamBox) {
        // Add click handler for focus
        streamBox.addEventListener('click', () => this.focusStream(domain));
        
        // Add demo selector dropdown
        this.addDemoSelector(domain, streamBox);
        
        // Setup loading and error states
        this.setupStreamStates(domain, streamBox);
    }

    addDemoSelector(domain, streamBox) {
        const domainData = this.demoManifest.streamingDomains[domain];
        const controlsElement = streamBox.querySelector('.stream-controls');
        
        if (controlsElement && domainData.demos.length > 1) {
            const selector = document.createElement('select');
            selector.className = 'demo-selector';
            selector.style.cssText = `
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                border: 1px solid var(--domain-${domain});
                border-radius: 4px;
                padding: 2px 4px;
                font-size: 10px;
                font-family: var(--font-mono);
            `;
            
            domainData.demos.forEach(demo => {
                const option = document.createElement('option');
                option.value = demo.id;
                option.textContent = demo.name;
                selector.appendChild(option);
            });
            
            selector.addEventListener('change', (e) => {
                const selectedDemo = domainData.demos.find(demo => demo.id === e.target.value);
                if (selectedDemo) {
                    this.pauseRotation(domain);
                    this.loadDemo(domain, selectedDemo);
                }
            });
            
            controlsElement.appendChild(selector);
        }
    }

    setupStreamStates(domain, streamBox) {
        const gameboyStream = streamBox.querySelector('.gameboy-stream');
        if (!gameboyStream) return;

        // Create loading state
        const loadingState = document.createElement('div');
        loadingState.className = 'stream-loading';
        loadingState.innerHTML = `
            <div class="loading-spinner"></div>
            <div>Loading ${this.demoManifest.streamingDomains[domain].name}...</div>
        `;
        loadingState.style.display = 'none';
        gameboyStream.appendChild(loadingState);

        // Create error state
        const errorState = document.createElement('div');
        errorState.className = 'stream-error';
        errorState.innerHTML = `
            <div>⚠️</div>
            <div>Stream Error</div>
            <button onclick="demoManager.retryStream('${domain}')" style="
                background: var(--domain-${domain});
                color: #000;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                cursor: pointer;
                margin-top: 8px;
            ">Retry</button>
        `;
        errorState.style.display = 'none';
        gameboyStream.appendChild(errorState);
    }

    async loadDemo(domain, demo) {
        console.log(`🔄 Loading demo: ${demo.name} for ${domain} domain`);
        
        const streamBox = this.streamElements.get(domain);
        if (!streamBox) return;

        const gameboyStream = streamBox.querySelector('.gameboy-stream');
        const loadingState = streamBox.querySelector('.stream-loading');
        const errorState = streamBox.querySelector('.stream-error');
        
        // Show loading state
        this.showLoadingState(streamBox, true);
        
        try {
            const startTime = Date.now();
            
            // Remove existing iframe
            const existingIframe = gameboyStream.querySelector('iframe');
            if (existingIframe) {
                existingIframe.remove();
            }
            
            // Create new iframe
            const iframe = document.createElement('iframe');
            iframe.src = demo.path;
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
                border-radius: var(--radius-sm);
                background: #9BBD0F;
            `;
            iframe.loading = 'lazy';
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
            
            // Setup load handlers
            iframe.onload = () => {
                const loadTime = Date.now() - startTime;
                this.loadTimes.set(`${domain}-${demo.id}`, loadTime);
                console.log(`✅ Demo loaded: ${demo.name} (${loadTime}ms)`);
                this.showLoadingState(streamBox, false);
                this.updateStreamInfo(streamBox, demo);
            };
            
            iframe.onerror = () => {
                console.error(`❌ Failed to load demo: ${demo.name}`);
                this.handleStreamError(domain, demo);
            };
            
            // Set timeout for loading
            setTimeout(() => {
                if (iframe.contentDocument.readyState !== 'complete') {
                    console.warn(`⏰ Demo loading timeout: ${demo.name}`);
                    this.handleStreamError(domain, demo);
                }
            }, this.demoManifest.streamSettings?.loadingTimeout || 10000);
            
            gameboyStream.appendChild(iframe);
            this.activeStreams.set(domain, { demo, iframe, loadTime: startTime });
            
        } catch (error) {
            console.error(`❌ Error loading demo ${demo.name}:`, error);
            this.handleStreamError(domain, demo);
        }
    }

    showLoadingState(streamBox, isLoading) {
        const loadingState = streamBox.querySelector('.stream-loading');
        const errorState = streamBox.querySelector('.stream-error');
        
        if (loadingState) {
            loadingState.style.display = isLoading ? 'flex' : 'none';
        }
        if (errorState) {
            errorState.style.display = 'none';
        }
    }

    handleStreamError(domain, demo) {
        const streamBox = this.streamElements.get(domain);
        if (!streamBox) return;

        const errorState = streamBox.querySelector('.stream-error');
        const loadingState = streamBox.querySelector('.stream-loading');
        
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'flex';
        
        // Track error count
        const errorKey = `${domain}-${demo.id}`;
        this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
        
        console.error(`❌ Stream error for ${domain}:`, demo.name);
    }

    retryStream(domain) {
        const activeStream = this.activeStreams.get(domain);
        if (activeStream) {
            this.loadDemo(domain, activeStream.demo);
        }
    }

    updateStreamInfo(streamBox, demo) {
        // Update current game display
        const currentGameElement = streamBox.querySelector('.current-game');
        if (currentGameElement) {
            currentGameElement.textContent = demo.name;
        }
        
        // Update stream title if needed
        const streamTitle = streamBox.querySelector('.stream-title');
        if (streamTitle && demo.featured) {
            streamTitle.textContent = demo.name;
        }
    }

    focusStream(domain) {
        console.log(`🎯 Focusing stream: ${domain}`);
        
        // Remove focus from all streams
        this.streamElements.forEach((element, d) => {
            element.classList.remove('focused');
        });
        
        // Add focus to selected stream
        const streamBox = this.streamElements.get(domain);
        if (streamBox) {
            streamBox.classList.add('focused');
            this.focusedStream = domain;
            
            // Pause rotation for focused stream
            this.pauseRotation(domain);
            
            // Add focus mode to grid
            const streamGrid = document.getElementById('streamGrid');
            if (streamGrid) {
                streamGrid.classList.add('focus-mode');
            }
        }
    }

    unfocusAll() {
        this.streamElements.forEach((element) => {
            element.classList.remove('focused');
        });
        
        const streamGrid = document.getElementById('streamGrid');
        if (streamGrid) {
            streamGrid.classList.remove('focus-mode');
        }
        
        this.focusedStream = null;
        this.resumeAllRotations();
    }

    startAutoRotation() {
        if (!this.demoManifest.rotationSettings?.autoRotate) return;
        
        const interval = this.demoManifest.rotationSettings.rotationInterval || 30000;
        
        Object.keys(this.demoManifest.streamingDomains).forEach(domain => {
            this.startDomainRotation(domain, interval);
        });
        
        console.log(`🔄 Auto-rotation started (${interval}ms interval)`);
    }

    startDomainRotation(domain, interval) {
        const domainData = this.demoManifest.streamingDomains[domain];
        if (domainData.demos.length <= 1) return; // No rotation needed
        
        let currentIndex = 0;
        const timer = setInterval(() => {
            // Skip if stream is focused
            if (this.focusedStream === domain) return;
            
            currentIndex = (currentIndex + 1) % domainData.demos.length;
            const nextDemo = domainData.demos[currentIndex];
            this.loadDemo(domain, nextDemo);
        }, interval);
        
        this.rotationTimers.set(domain, timer);
    }

    pauseRotation(domain) {
        const timer = this.rotationTimers.get(domain);
        if (timer) {
            clearInterval(timer);
            this.rotationTimers.delete(domain);
            console.log(`⏸️ Paused rotation for ${domain}`);
        }
    }

    resumeRotation(domain) {
        if (!this.rotationTimers.has(domain)) {
            const interval = this.demoManifest.rotationSettings.rotationInterval || 30000;
            this.startDomainRotation(domain, interval);
            console.log(`▶️ Resumed rotation for ${domain}`);
        }
    }

    resumeAllRotations() {
        Object.keys(this.demoManifest.streamingDomains).forEach(domain => {
            this.resumeRotation(domain);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Numbers 1-9 for domain selection
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                const domains = Object.keys(this.demoManifest.streamingDomains);
                const domain = domains[num - 1];
                if (domain) {
                    this.focusStream(domain);
                    e.preventDefault();
                }
            }
            
            // Escape to unfocus
            if (e.key === 'Escape') {
                this.unfocusAll();
                e.preventDefault();
            }
            
            // Space to pause/resume all rotations
            if (e.key === ' ' && e.ctrlKey) {
                this.toggleAllRotations();
                e.preventDefault();
            }
        });
        
        console.log('⌨️ Keyboard shortcuts enabled (1-9: focus, Esc: unfocus, Ctrl+Space: pause/resume)');
    }

    toggleAllRotations() {
        const hasActiveRotations = this.rotationTimers.size > 0;
        
        if (hasActiveRotations) {
            // Pause all
            this.rotationTimers.forEach((timer, domain) => {
                clearInterval(timer);
            });
            this.rotationTimers.clear();
            console.log('⏸️ All rotations paused');
        } else {
            // Resume all
            this.startAutoRotation();
            console.log('▶️ All rotations resumed');
        }
    }

    // Analytics and monitoring
    getStats() {
        return {
            activeStreams: this.activeStreams.size,
            rotatingStreams: this.rotationTimers.size,
            focusedStream: this.focusedStream,
            averageLoadTime: this.getAverageLoadTime(),
            errorRate: this.getErrorRate(),
            isInitialized: this.isInitialized
        };
    }

    getAverageLoadTime() {
        const times = Array.from(this.loadTimes.values());
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }

    getErrorRate() {
        const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);
        const totalAttempts = this.loadTimes.size + totalErrors;
        return totalAttempts > 0 ? totalErrors / totalAttempts : 0;
    }

    // Public API for external control
    switchDemo(domain, demoId) {
        const domainData = this.demoManifest.streamingDomains[domain];
        if (!domainData) return false;
        
        const demo = domainData.demos.find(d => d.id === demoId);
        if (!demo) return false;
        
        this.pauseRotation(domain);
        this.loadDemo(domain, demo);
        return true;
    }

    refreshStream(domain) {
        const activeStream = this.activeStreams.get(domain);
        if (activeStream) {
            this.loadDemo(domain, activeStream.demo);
        }
    }

    refreshAllStreams() {
        this.activeStreams.forEach((stream, domain) => {
            this.loadDemo(domain, stream.demo);
        });
    }
}

// Initialize global demo manager
let demoManager;

document.addEventListener('DOMContentLoaded', () => {
    demoManager = new DemoStreamManager();
    
    // Expose to global scope for debugging and external control
    window.demoManager = demoManager;
    
    // Add stats display (for debugging)
    if (window.location.search.includes('debug=true')) {
        setInterval(() => {
            console.log('📊 Demo Manager Stats:', demoManager.getStats());
        }, 10000);
    }
});

console.log('🌀 Demo Stream Manager loaded - Where Reality is Optional™');
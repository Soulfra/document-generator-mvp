/**
 * 🌀🎮💊 Stream Zoom Modal
 * Fullscreen viewing component for focused demo streams
 * Where Reality is Optional™
 */

class StreamZoomModal {
    constructor() {
        this.isOpen = false;
        this.currentDomain = null;
        this.currentDemo = null;
        this.modal = null;
        this.iframe = null;
        
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'stream-zoom-modal';
        this.modal.innerHTML = `
            <div class="zoom-modal-overlay"></div>
            <div class="zoom-modal-container">
                <div class="zoom-modal-header">
                    <div class="zoom-modal-info">
                        <span class="zoom-domain-token"></span>
                        <div class="zoom-modal-titles">
                            <h2 class="zoom-modal-title"></h2>
                            <div class="zoom-modal-subtitle"></div>
                        </div>
                    </div>
                    <div class="zoom-modal-controls">
                        <button class="zoom-control-btn" id="zoomRefresh" title="Refresh Stream">
                            <span>🔄</span>
                        </button>
                        <button class="zoom-control-btn" id="zoomNewTab" title="Open in New Tab">
                            <span>↗️</span>
                        </button>
                        <button class="zoom-control-btn zoom-close-btn" id="zoomClose" title="Close (Esc)">
                            <span>✕</span>
                        </button>
                    </div>
                </div>
                <div class="zoom-modal-content">
                    <div class="zoom-loading-state">
                        <div class="zoom-loading-spinner"></div>
                        <div>Loading fullscreen demo...</div>
                    </div>
                    <div class="zoom-error-state" style="display: none;">
                        <div>⚠️</div>
                        <div>Failed to load demo</div>
                        <button class="zoom-retry-btn">Retry</button>
                    </div>
                </div>
                <div class="zoom-modal-footer">
                    <div class="zoom-instructions">
                        <span>📱 Press <kbd>Esc</kbd> to close • <kbd>R</kbd> to refresh • <kbd>T</kbd> for new tab</span>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();
        
        // Append to body
        document.body.appendChild(this.modal);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .stream-zoom-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: none;
                font-family: var(--font-mono);
            }

            .stream-zoom-modal.active {
                display: block;
            }

            .zoom-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
            }

            .zoom-modal-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                max-width: 100vw;
                max-height: 100vh;
            }

            .zoom-modal-header {
                background: rgba(0, 0, 0, 0.9);
                border-bottom: 2px solid var(--soulfra-quantum);
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }

            .zoom-modal-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .zoom-domain-token {
                font-size: 2rem;
                font-weight: 700;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
            }

            .zoom-modal-titles {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .zoom-modal-title {
                font-family: var(--font-display);
                font-size: 1.5rem;
                color: var(--soulfra-reality);
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .zoom-modal-subtitle {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .zoom-modal-controls {
                display: flex;
                gap: 0.5rem;
            }

            .zoom-control-btn {
                width: 40px;
                height: 40px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-secondary);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.125rem;
            }

            .zoom-control-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                color: var(--text-primary);
                transform: scale(1.05);
            }

            .zoom-close-btn:hover {
                background: var(--soulfra-doctor);
                color: white;
            }

            .zoom-modal-content {
                flex: 1;
                position: relative;
                overflow: hidden;
                background: #000;
            }

            .zoom-modal-content iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: #000;
            }

            .zoom-loading-state,
            .zoom-error-state {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                color: var(--text-secondary);
                font-size: 1.125rem;
            }

            .zoom-loading-spinner {
                width: 48px;
                height: 48px;
                border: 3px solid rgba(139, 0, 255, 0.3);
                border-top: 3px solid var(--soulfra-quantum);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .zoom-retry-btn {
                background: var(--soulfra-quantum);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-family: var(--font-mono);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .zoom-retry-btn:hover {
                background: var(--soulfra-quantum-light);
                transform: translateY(-2px);
            }

            .zoom-modal-footer {
                background: rgba(0, 0, 0, 0.9);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding: 0.75rem 2rem;
                flex-shrink: 0;
            }

            .zoom-instructions {
                text-align: center;
                font-size: 0.75rem;
                color: var(--text-muted);
            }

            .zoom-instructions kbd {
                background: rgba(255, 255, 255, 0.1);
                padding: 0.125rem 0.25rem;
                border-radius: 4px;
                font-family: var(--font-mono);
                font-size: 0.6875rem;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .zoom-modal-header {
                    padding: 0.75rem 1rem;
                }

                .zoom-modal-footer {
                    padding: 0.5rem 1rem;
                }

                .zoom-modal-title {
                    font-size: 1.25rem;
                }

                .zoom-domain-token {
                    width: 36px;
                    height: 36px;
                    font-size: 1.5rem;
                }

                .zoom-control-btn {
                    width: 36px;
                    height: 36px;
                    font-size: 1rem;
                }
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Close button
        this.modal.querySelector('#zoomClose').addEventListener('click', () => {
            this.close();
        });

        // Overlay click to close
        this.modal.querySelector('.zoom-modal-overlay').addEventListener('click', () => {
            this.close();
        });

        // Refresh button
        this.modal.querySelector('#zoomRefresh').addEventListener('click', () => {
            this.refreshStream();
        });

        // New tab button
        this.modal.querySelector('#zoomNewTab').addEventListener('click', () => {
            this.openInNewTab();
        });

        // Retry button
        this.modal.querySelector('.zoom-retry-btn').addEventListener('click', () => {
            this.refreshStream();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch(e.key) {
                case 'Escape':
                    this.close();
                    e.preventDefault();
                    break;
                case 'r':
                case 'R':
                    if (!e.ctrlKey && !e.metaKey) {
                        this.refreshStream();
                        e.preventDefault();
                    }
                    break;
                case 't':
                case 'T':
                    if (!e.ctrlKey && !e.metaKey) {
                        this.openInNewTab();
                        e.preventDefault();
                    }
                    break;
            }
        });
    }

    open(domain, demo) {
        console.log(`🔍 Opening zoom modal for ${domain}:`, demo.name);
        
        this.currentDomain = domain;
        this.currentDemo = demo;
        this.isOpen = true;

        // Update modal content
        this.updateModalContent();
        
        // Load demo
        this.loadDemoFullscreen();

        // Show modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus management
        this.modal.querySelector('#zoomClose').focus();
    }

    close() {
        console.log('🔍 Closing zoom modal');
        
        this.isOpen = false;
        this.currentDomain = null;
        this.currentDemo = null;

        // Hide modal
        this.modal.classList.remove('active');
        document.body.style.overflow = '';

        // Remove iframe
        if (this.iframe) {
            this.iframe.remove();
            this.iframe = null;
        }

        // Reset states
        this.showLoadingState();
    }

    updateModalContent() {
        if (!this.currentDomain || !this.currentDemo) return;

        const domainData = window.demoManager?.demoManifest?.streamingDomains[this.currentDomain];
        if (!domainData) return;

        // Update domain token
        const tokenElement = this.modal.querySelector('.zoom-domain-token');
        tokenElement.textContent = domainData.token;
        tokenElement.className = `zoom-domain-token text-${this.currentDomain}`;

        // Update titles
        this.modal.querySelector('.zoom-modal-title').textContent = domainData.name;
        this.modal.querySelector('.zoom-modal-subtitle').textContent = this.currentDemo.name;
    }

    loadDemoFullscreen() {
        if (!this.currentDemo) return;

        console.log(`🔄 Loading fullscreen demo: ${this.currentDemo.path}`);

        this.showLoadingState();

        // Create iframe
        this.iframe = document.createElement('iframe');
        this.iframe.src = this.currentDemo.path;
        this.iframe.allow = 'fullscreen; autoplay; encrypted-media';
        this.iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-downloads allow-popups';

        // Setup load handlers
        this.iframe.onload = () => {
            console.log(`✅ Fullscreen demo loaded: ${this.currentDemo.name}`);
            this.hideLoadingState();
        };

        this.iframe.onerror = () => {
            console.error(`❌ Failed to load fullscreen demo: ${this.currentDemo.name}`);
            this.showErrorState();
        };

        // Timeout handling
        setTimeout(() => {
            if (this.iframe && !this.iframe.contentDocument?.readyState === 'complete') {
                console.warn(`⏰ Fullscreen demo loading timeout: ${this.currentDemo.name}`);
                this.showErrorState();
            }
        }, 15000);

        // Append to content area
        const contentArea = this.modal.querySelector('.zoom-modal-content');
        contentArea.appendChild(this.iframe);
    }

    showLoadingState() {
        const loadingState = this.modal.querySelector('.zoom-loading-state');
        const errorState = this.modal.querySelector('.zoom-error-state');
        
        loadingState.style.display = 'flex';
        errorState.style.display = 'none';
    }

    hideLoadingState() {
        const loadingState = this.modal.querySelector('.zoom-loading-state');
        loadingState.style.display = 'none';
    }

    showErrorState() {
        const loadingState = this.modal.querySelector('.zoom-loading-state');
        const errorState = this.modal.querySelector('.zoom-error-state');
        
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
    }

    refreshStream() {
        if (!this.currentDemo) return;

        console.log(`🔄 Refreshing fullscreen stream: ${this.currentDemo.name}`);

        // Remove existing iframe
        if (this.iframe) {
            this.iframe.remove();
            this.iframe = null;
        }

        // Reload demo
        this.loadDemoFullscreen();
    }

    openInNewTab() {
        if (!this.currentDemo) return;

        console.log(`🔗 Opening demo in new tab: ${this.currentDemo.path}`);
        
        const newWindow = window.open(this.currentDemo.path, '_blank');
        if (newWindow) {
            newWindow.focus();
        } else {
            console.warn('Failed to open new tab - popup blocked?');
        }
    }

    // Public API
    isModalOpen() {
        return this.isOpen;
    }

    getCurrentDemo() {
        return this.currentDemo;
    }

    getCurrentDomain() {
        return this.currentDomain;
    }
}

// Initialize global zoom modal
let streamZoomModal;

document.addEventListener('DOMContentLoaded', () => {
    streamZoomModal = new StreamZoomModal();
    
    // Expose to global scope
    window.streamZoomModal = streamZoomModal;
});

console.log('🔍 Stream Zoom Modal loaded - Ready for fullscreen demos');
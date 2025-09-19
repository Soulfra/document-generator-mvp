#!/usr/bin/env node
/**
 * 🛡️📺 CAL GUARDIAN EMBED WIDGET
 * Easy-to-embed Guardian status widget for websites
 * One-line integration for deathtodata.com and soulfra.ai
 */

(function(window, document) {
    'use strict';
    
    // Widget configuration
    const GUARDIAN_CONFIG = {
        // API endpoints
        streamAPI: 'http://localhost:7777',
        streamWS: 'ws://localhost:7778',
        proofAPI: 'http://localhost:9450',
        
        // Widget defaults
        defaultTheme: 'dark',
        defaultBrand: 'all',
        updateInterval: 5000,
        animationDuration: 300,
        
        // Widget types
        types: {
            status: { width: '320px', height: '120px' },
            activity: { width: '400px', height: '300px' },
            proof: { width: '600px', height: '400px' },
            ticker: { width: '100%', height: '40px' },
            floating: { width: '280px', height: '360px' }
        }
    };
    
    // Main Guardian Widget Class
    class GuardianWidget {
        constructor(element, options = {}) {
            this.element = element;
            this.options = this.parseOptions(element, options);
            this.ws = null;
            this.data = {
                status: 'connecting',
                approvals: [],
                proofs: [],
                metrics: {},
                lastUpdate: null
            };
            
            this.init();
        }
        
        parseOptions(element, options) {
            // Merge data attributes with provided options
            const defaults = {
                type: 'status',
                brand: GUARDIAN_CONFIG.defaultBrand,
                theme: GUARDIAN_CONFIG.defaultTheme,
                position: 'inline',
                animate: true,
                showProof: false,
                showMetrics: true,
                autoConnect: true
            };
            
            // Extract data attributes
            const dataAttrs = {};
            for (const attr of element.attributes) {
                if (attr.name.startsWith('data-')) {
                    const key = attr.name.substring(5).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    dataAttrs[key] = attr.value;
                }
            }
            
            return { ...defaults, ...dataAttrs, ...options };
        }
        
        async init() {
            // Create widget structure
            this.createWidget();
            
            // Load initial data
            await this.loadInitialData();
            
            // Connect to WebSocket if enabled
            if (this.options.autoConnect) {
                this.connectWebSocket();
            }
            
            // Start update loop
            this.startUpdateLoop();
            
            // Apply animations
            if (this.options.animate) {
                this.element.classList.add('guardian-animated');
            }
        }
        
        createWidget() {
            // Clear existing content
            this.element.innerHTML = '';
            
            // Add widget class and type
            this.element.className = `guardian-widget guardian-${this.options.type} guardian-${this.options.theme}`;
            
            // Set dimensions
            const typeConfig = GUARDIAN_CONFIG.types[this.options.type];
            this.element.style.width = typeConfig.width;
            this.element.style.height = typeConfig.height;
            
            // Create widget based on type
            switch (this.options.type) {
                case 'status':
                    this.createStatusWidget();
                    break;
                case 'activity':
                    this.createActivityWidget();
                    break;
                case 'proof':
                    this.createProofWidget();
                    break;
                case 'ticker':
                    this.createTickerWidget();
                    break;
                case 'floating':
                    this.createFloatingWidget();
                    break;
                default:
                    this.createStatusWidget();
            }
            
            // Add custom CSS
            this.injectStyles();
        }
        
        createStatusWidget() {
            this.element.innerHTML = `
                <div class="guardian-header">
                    <div class="guardian-icon">🛡️</div>
                    <div class="guardian-title">Guardian Status</div>
                    <div class="guardian-status-light" data-status="connecting"></div>
                </div>
                <div class="guardian-content">
                    <div class="guardian-metric">
                        <span class="metric-label">Brand:</span>
                        <span class="metric-value" data-field="brand">${this.options.brand}</span>
                    </div>
                    <div class="guardian-metric">
                        <span class="metric-label">Status:</span>
                        <span class="metric-value" data-field="status">Connecting...</span>
                    </div>
                    <div class="guardian-metric">
                        <span class="metric-label">Approvals:</span>
                        <span class="metric-value" data-field="approvals">0</span>
                    </div>
                    <div class="guardian-metric">
                        <span class="metric-label">Accuracy:</span>
                        <span class="metric-value" data-field="accuracy">--%</span>
                    </div>
                </div>
            `;
        }
        
        setupTabs() {
            const tabButtons = this.element.querySelectorAll('.tab-button');
            const tabContents = this.element.querySelectorAll('.tab-content');
            
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.getAttribute('data-tab');
                    
                    // Update active states
                    tabButtons.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    button.classList.add('active');
                    const targetContent = this.element.querySelector(`[data-tab-content="${targetTab}"]`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                });
            });
        }
        
        async loadInitialData() {
            try {
                // Load status
                const statusResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/status`);
                const statusData = await statusResponse.json();
                
                // Load metrics
                const metricsResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/metrics`);
                const metricsData = await metricsResponse.json();
                
                // Load recent events
                const eventsResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/events?limit=10&brand=${this.options.brand}`);
                const eventsData = await eventsResponse.json();
                
                // Update widget with initial data
                this.updateStatus(statusData);
                this.updateMetrics(metricsData);
                this.updateEvents(eventsData.events);
                
                // If proof widget, load proof data
                if (this.options.type === 'proof' || this.options.showProof) {
                    const proofResponse = await fetch(`${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/latest`);
                    const proofData = await proofResponse.json();
                    this.updateProofData(proofData);
                }
                
            } catch (error) {
                console.error('Failed to load Guardian data:', error);
                this.updateStatus({ active: false, error: error.message });
            }
        }
        
        connectWebSocket() {
            try {
                this.ws = new WebSocket(GUARDIAN_CONFIG.streamWS);
                
                this.ws.onopen = () => {
                    console.log('Guardian Widget connected to stream');
                    this.updateConnectionStatus('connected');
                    
                    // Subscribe to brand events
                    this.ws.send(JSON.stringify({
                        type: 'subscribe',
                        brand: this.options.brand
                    }));
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleStreamMessage(data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('Guardian Widget WebSocket error:', error);
                    this.updateConnectionStatus('error');
                };
                
                this.ws.onclose = () => {
                    console.log('Guardian Widget disconnected from stream');
                    this.updateConnectionStatus('disconnected');
                    
                    // Attempt reconnect after 5 seconds
                    setTimeout(() => this.connectWebSocket(), 5000);
                };
                
            } catch (error) {
                console.error('Failed to connect Guardian Widget:', error);
                this.updateConnectionStatus('error');
            }
        }
        
        handleStreamMessage(message) {
            switch (message.type) {
                case 'guardian_event':
                    this.handleGuardianEvent(message.data);
                    break;
                case 'guardian_proof':
                    this.handleProofEvent(message.proof);
                    break;
                case 'guardian_metrics':
                    this.updateMetrics({ guardian: message.metrics });
                    break;
                case 'welcome':
                    this.updateConnectionStatus('connected');
                    break;
            }
        }
        
        handleGuardianEvent(event) {
            // Add to events list
            this.data.approvals.unshift(event);
            if (this.data.approvals.length > 20) {
                this.data.approvals.pop();
            }
            
            // Update UI
            this.updateEventsList();
            this.updateApprovalCount();
            
            // Animate for new events
            if (this.options.animate) {
                this.animateNewEvent();
            }
        }
        
        handleProofEvent(proof) {
            // Add to proofs list
            this.data.proofs.unshift(proof);
            if (this.data.proofs.length > 10) {
                this.data.proofs.pop();
            }
            
            // Update proof display
            this.updateProofDisplay();
        }
        
        updateStatus(statusData) {
            this.data.status = statusData.active ? 'active' : 'inactive';
            
            const statusElements = this.element.querySelectorAll('[data-field="status"]');
            statusElements.forEach(el => {
                el.textContent = this.data.status === 'active' ? '🟢 Active' : '🔴 Inactive';
            });
            
            this.updateConnectionStatus(this.data.status);
        }
        
        updateMetrics(metricsData) {
            const metrics = metricsData.guardian || {};
            this.data.metrics = metrics;
            
            // Update metric displays
            const updates = {
                approvals: metrics.totalApprovals || 0,
                accuracy: metrics.accuracyRate || '0%',
                totalApprovals: metrics.totalApprovals || 0,
                accuracyRate: metrics.accuracyRate || '0%',
                avgResponse: metrics.avgResponseTime ? `${Math.round(metrics.avgResponseTime)}ms` : '0ms',
                chainLength: metrics.currentChainLength || 0,
                todayApprovals: metrics.todayApprovals || 0
            };
            
            Object.entries(updates).forEach(([field, value]) => {
                const elements = this.element.querySelectorAll(`[data-field="${field}"], [data-metric="${field}"]`);
                elements.forEach(el => {
                    el.textContent = value;
                });
            });
        }
        
        updateEvents(events) {
            this.data.approvals = events || [];
            this.updateEventsList();
        }
        
        updateEventsList() {
            const listElement = this.element.querySelector('[data-list="approvals"]');
            if (!listElement) return;
            
            if (this.data.approvals.length === 0) {
                listElement.innerHTML = '<div class="no-data">No recent approvals</div>';
                return;
            }
            
            listElement.innerHTML = this.data.approvals.map(event => `
                <div class="activity-item">
                    <div class="activity-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div class="activity-type">${event.eventType || event.type}</div>
                    ${event.data?.brand ? `<div class="activity-brand">${event.data.brand}</div>` : ''}
                </div>
            `).join('');
        }
        
        updateProofData(proofData) {
            if (proofData.block) {
                const updates = {
                    chainLength: proofData.chainLength || 0,
                    latestBlock: `#${proofData.block.index}`,
                    verified: proofData.verified ? '✓' : '✗'
                };
                
                Object.entries(updates).forEach(([field, value]) => {
                    const element = this.element.querySelector(`[data-field="${field}"]`);
                    if (element) {
                        element.textContent = value;
                        if (field === 'verified') {
                            element.style.color = proofData.verified ? '#00ff88' : '#ff4444';
                        }
                    }
                });
            }
        }
        
        updateProofDisplay() {
            const chainElement = this.element.querySelector('[data-chain="proofs"]');
            if (!chainElement) return;
            
            if (this.data.proofs.length === 0) {
                chainElement.innerHTML = '<div class="loading">Loading proof chain...</div>';
                return;
            }
            
            chainElement.innerHTML = this.data.proofs.map(proof => `
                <div class="proof-block">
                    <div class="block-header">
                        <span class="block-index">#${proof.blockIndex}</span>
                        <span class="block-type">${proof.blockType}</span>
                    </div>
                    <div class="block-hash">${proof.blockHash.substring(0, 16)}...</div>
                    <div class="block-verified ${proof.verified ? 'verified' : 'unverified'}">
                        ${proof.verified ? '✓ Verified' : '✗ Unverified'}
                    </div>
                </div>
            `).join('');
        }
        
        updateConnectionStatus(status) {
            const statusLights = this.element.querySelectorAll('[data-status]');
            statusLights.forEach(light => {
                light.setAttribute('data-status', status);
            });
            
            const statusIndicators = this.element.querySelectorAll('.status-indicator');
            statusIndicators.forEach(indicator => {
                indicator.className = `status-indicator status-${status}`;
            });
        }
        
        updateApprovalCount() {
            const countElement = this.element.querySelector('[data-field="approvals"]');
            if (countElement) {
                countElement.textContent = this.data.approvals.length;
            }
        }
        
        animateNewEvent() {
            this.element.classList.add('new-event');
            setTimeout(() => {
                this.element.classList.remove('new-event');
            }, GUARDIAN_CONFIG.animationDuration);
        }
        
        startUpdateLoop() {
            // Periodically fetch updates if not using WebSocket
            setInterval(async () => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    await this.loadInitialData();
                }
            }, GUARDIAN_CONFIG.updateInterval);
        }
        
        injectStyles() {
            const styleId = 'guardian-widget-styles';
            if (document.getElementById(styleId)) return;
            
            const styles = document.createElement('style');
            styles.id = styleId;
            styles.textContent = `
                /* Guardian Widget Base Styles */
                .guardian-widget {
                    font-family: 'Courier New', monospace;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                /* Dark Theme */
                .guardian-dark {
                    background: #0a0a0a;
                    color: #ffffff;
                    border: 2px solid #00ff88;
                }
                
                .guardian-dark .guardian-header {
                    background: rgba(0, 255, 136, 0.1);
                    border-bottom: 1px solid #00ff88;
                }
                
                /* Light Theme */
                .guardian-light {
                    background: #ffffff;
                    color: #333333;
                    border: 2px solid #00cc66;
                }
                
                .guardian-light .guardian-header {
                    background: rgba(0, 204, 102, 0.1);
                    border-bottom: 1px solid #00cc66;
                }
                
                /* Header */
                .guardian-header {
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .guardian-icon {
                    font-size: 20px;
                }
                
                .guardian-title {
                    flex: 1;
                    font-weight: bold;
                }
                
                .guardian-status-light {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #666;
                    transition: all 0.3s ease;
                }
                
                .guardian-status-light[data-status="connecting"] {
                    background: #ffaa00;
                    animation: pulse 2s infinite;
                }
                
                .guardian-status-light[data-status="connected"],
                .guardian-status-light[data-status="active"] {
                    background: #00ff88;
                }
                
                .guardian-status-light[data-status="error"],
                .guardian-status-light[data-status="disconnected"] {
                    background: #ff4444;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* Content */
                .guardian-content {
                    padding: 12px;
                }
                
                .guardian-metric {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 14px;
                }
                
                .metric-label {
                    color: #999;
                }
                
                .metric-value {
                    font-weight: bold;
                }
                
                .guardian-dark .metric-value {
                    color: #00ff88;
                }
                
                .guardian-light .metric-value {
                    color: #00cc66;
                }
                
                /* Tabs */
                .guardian-tabs {
                    display: flex;
                    border-bottom: 1px solid #333;
                }
                
                .tab-button {
                    flex: 1;
                    padding: 8px;
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                
                .guardian-dark .tab-button:hover {
                    background: rgba(0, 255, 136, 0.1);
                }
                
                .guardian-dark .tab-button.active {
                    background: rgba(0, 255, 136, 0.2);
                    border-bottom: 2px solid #00ff88;
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                /* Activity List */
                .activity-list {
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .activity-item {
                    padding: 8px;
                    margin-bottom: 4px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    font-size: 12px;
                }
                
                .activity-time {
                    color: #666;
                    font-size: 10px;
                }
                
                .activity-type {
                    font-weight: bold;
                    margin: 2px 0;
                }
                
                /* Metrics Grid */
                .metrics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                
                .metric-card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px;
                    border-radius: 4px;
                    text-align: center;
                }
                
                .metric-big {
                    font-size: 24px;
                    font-weight: bold;
                    margin-top: 4px;
                }
                
                /* Proof Widget */
                .proof-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .proof-stats {
                    display: flex;
                    gap: 20px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }
                
                .stat-item {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .proof-chain {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 250px;
                }
                
                .proof-block {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    border-left: 3px solid #00ff88;
                }
                
                .block-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                }
                
                .block-hash {
                    font-size: 11px;
                    color: #666;
                    margin: 4px 0;
                }
                
                .block-verified {
                    font-size: 12px;
                }
                
                .verified {
                    color: #00ff88;
                }
                
                .unverified {
                    color: #ff4444;
                }
                
                /* Ticker */
                .guardian-ticker {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    gap: 12px;
                    height: 100%;
                }
                
                .ticker-content {
                    flex: 1;
                    overflow: hidden;
                }
                
                .ticker-item {
                    display: inline-block;
                    animation: ticker 20s linear infinite;
                }
                
                @keyframes ticker {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                
                /* Floating Widget */
                .guardian-floating {
                    background: inherit;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .floating-header {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    gap: 8px;
                    cursor: move;
                }
                
                .close-button {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 20px;
                    cursor: pointer;
                    opacity: 0.6;
                }
                
                .close-button:hover {
                    opacity: 1;
                }
                
                .floating-content {
                    padding: 12px;
                }
                
                .status-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                
                .mini-stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 12px;
                }
                
                .mini-stat {
                    font-size: 12px;
                }
                
                .mini-label {
                    color: #999;
                }
                
                .recent-activity {
                    font-size: 11px;
                    max-height: 120px;
                    overflow-y: auto;
                }
                
                .floating-footer {
                    padding: 8px 12px;
                    text-align: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .floating-footer a {
                    color: #00ff88;
                    text-decoration: none;
                    font-size: 12px;
                }
                
                /* Animations */
                .guardian-animated {
                    transition: all 0.3s ease;
                }
                
                .guardian-animated.new-event {
                    transform: scale(1.02);
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
                }
                
                /* Utility */
                .no-data {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                    font-size: 12px;
                }
                
                .loading {
                    text-align: center;
                    color: #999;
                    padding: 20px;
                }
                
                /* Buttons */
                .verify-button {
                    background: #00ff88;
                    color: #000;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: inherit;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .verify-button:hover {
                    background: #00cc66;
                    transform: translateY(-1px);
                }
                
                .key-link {
                    color: #00ff88;
                    text-decoration: none;
                    font-size: 12px;
                }
                
                /* Scrollbar */
                .guardian-dark ::-webkit-scrollbar {
                    width: 6px;
                }
                
                .guardian-dark ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .guardian-dark ::-webkit-scrollbar-thumb {
                    background: #00ff88;
                    border-radius: 3px;
                }
            `;
            
            document.head.appendChild(styles);
        }
    }
    
    // Static methods
    GuardianWidget.verifyChain = async function() {
        try {
            const response = await fetch(`${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/chain?limit=10`);
            const data = await response.json();
            
            if (data.verified) {
                alert('✅ Guardian proof chain verified!');
            } else {
                alert('❌ Guardian proof chain verification failed!');
            }
        } catch (error) {
            alert('Error verifying chain: ' + error.message);
        }
    };
    
    GuardianWidget.openDashboard = function(brand = '') {
        const dashboardUrl = `http://localhost:8082/?brand=${brand}`;
        window.open(dashboardUrl, '_blank');
    };
    
    // Auto-initialization
    GuardianWidget.autoInit = function() {
        // Find all elements with guardian-widget class
        const widgets = document.querySelectorAll('.guardian-widget, [data-guardian-widget]');
        
        widgets.forEach(element => {
            // Skip if already initialized
            if (element.guardianWidget) return;
            
            // Create widget instance
            element.guardianWidget = new GuardianWidget(element);
        });
    };
    
    // Widget loader
    GuardianWidget.load = function(selector, options = {}) {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (!element) {
            console.error('Guardian Widget: Element not found:', selector);
            return null;
        }
        
        return new GuardianWidget(element, options);
    };
    
    // Expose to global scope
    window.GuardianWidget = GuardianWidget;
    
    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', GuardianWidget.autoInit);
    } else {
        GuardianWidget.autoInit();
    }
    
})(window, document);

// Export for Node.js/npm
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuardianWidget;
}
        
        createActivityWidget() {
            this.element.innerHTML = `
                <div class="guardian-header">
                    <div class="guardian-icon">🛡️</div>
                    <div class="guardian-title">Guardian Activity</div>
                    <div class="guardian-status-light" data-status="connecting"></div>
                </div>
                <div class="guardian-tabs">
                    <button class="tab-button active" data-tab="approvals">Approvals</button>
                    <button class="tab-button" data-tab="metrics">Metrics</button>
                    ${this.options.showProof ? '<button class="tab-button" data-tab="proofs">Proofs</button>' : ''}
                </div>
                <div class="guardian-content">
                    <div class="tab-content active" data-tab-content="approvals">
                        <div class="activity-list" data-list="approvals">
                            <div class="no-data">No recent approvals</div>
                        </div>
                    </div>
                    <div class="tab-content" data-tab-content="metrics">
                        <div class="metrics-grid" data-grid="metrics">
                            <div class="metric-card">
                                <div class="metric-label">Total Approvals</div>
                                <div class="metric-big" data-metric="totalApprovals">0</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">Accuracy Rate</div>
                                <div class="metric-big" data-metric="accuracyRate">0%</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">Avg Response</div>
                                <div class="metric-big" data-metric="avgResponse">0ms</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">Chain Length</div>
                                <div class="metric-big" data-metric="chainLength">0</div>
                            </div>
                        </div>
                    </div>
                    ${this.options.showProof ? `
                    <div class="tab-content" data-tab-content="proofs">
                        <div class="proof-list" data-list="proofs">
                            <div class="no-data">No proof blocks</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Add tab functionality
            this.setupTabs();
        }
        
        createProofWidget() {
            this.element.innerHTML = `
                <div class="guardian-header">
                    <div class="guardian-icon">🛡️</div>
                    <div class="guardian-title">Guardian Proof Chain</div>
                    <div class="guardian-status-light" data-status="connecting"></div>
                </div>
                <div class="guardian-content proof-content">
                    <div class="proof-stats">
                        <div class="stat-item">
                            <span class="stat-label">Chain Length:</span>
                            <span class="stat-value" data-field="chainLength">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Latest Block:</span>
                            <span class="stat-value" data-field="latestBlock">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Verified:</span>
                            <span class="stat-value" data-field="verified">✓</span>
                        </div>
                    </div>
                    <div class="proof-chain" data-chain="proofs">
                        <div class="loading">Loading proof chain...</div>
                    </div>
                    <div class="proof-verify">
                        <button class="verify-button" onclick="GuardianWidget.verifyChain()">Verify Chain</button>
                        <a href="${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/public-key" target="_blank" class="key-link">View Public Key</a>
                    </div>
                </div>
            `;
        }
        
        setupTabs() {
            const tabButtons = this.element.querySelectorAll('.tab-button');
            const tabContents = this.element.querySelectorAll('.tab-content');
            
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.getAttribute('data-tab');
                    
                    // Update active states
                    tabButtons.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    button.classList.add('active');
                    const targetContent = this.element.querySelector(`[data-tab-content="${targetTab}"]`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                });
            });
        }
        
        async loadInitialData() {
            try {
                // Load status
                const statusResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/status`);
                const statusData = await statusResponse.json();
                
                // Load metrics
                const metricsResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/metrics`);
                const metricsData = await metricsResponse.json();
                
                // Load recent events
                const eventsResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/events?limit=10&brand=${this.options.brand}`);
                const eventsData = await eventsResponse.json();
                
                // Update widget with initial data
                this.updateStatus(statusData);
                this.updateMetrics(metricsData);
                this.updateEvents(eventsData.events);
                
                // If proof widget, load proof data
                if (this.options.type === 'proof' || this.options.showProof) {
                    const proofResponse = await fetch(`${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/latest`);
                    const proofData = await proofResponse.json();
                    this.updateProofData(proofData);
                }
                
            } catch (error) {
                console.error('Failed to load Guardian data:', error);
                this.updateStatus({ active: false, error: error.message });
            }
        }
        
        connectWebSocket() {
            try {
                this.ws = new WebSocket(GUARDIAN_CONFIG.streamWS);
                
                this.ws.onopen = () => {
                    console.log('Guardian Widget connected to stream');
                    this.updateConnectionStatus('connected');
                    
                    // Subscribe to brand events
                    this.ws.send(JSON.stringify({
                        type: 'subscribe',
                        brand: this.options.brand
                    }));
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleStreamMessage(data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('Guardian Widget WebSocket error:', error);
                    this.updateConnectionStatus('error');
                };
                
                this.ws.onclose = () => {
                    console.log('Guardian Widget disconnected from stream');
                    this.updateConnectionStatus('disconnected');
                    
                    // Attempt reconnect after 5 seconds
                    setTimeout(() => this.connectWebSocket(), 5000);
                };
                
            } catch (error) {
                console.error('Failed to connect Guardian Widget:', error);
                this.updateConnectionStatus('error');
            }
        }
        
        handleStreamMessage(message) {
            switch (message.type) {
                case 'guardian_event':
                    this.handleGuardianEvent(message.data);
                    break;
                case 'guardian_proof':
                    this.handleProofEvent(message.proof);
                    break;
                case 'guardian_metrics':
                    this.updateMetrics({ guardian: message.metrics });
                    break;
                case 'welcome':
                    this.updateConnectionStatus('connected');
                    break;
            }
        }
        
        handleGuardianEvent(event) {
            // Add to events list
            this.data.approvals.unshift(event);
            if (this.data.approvals.length > 20) {
                this.data.approvals.pop();
            }
            
            // Update UI
            this.updateEventsList();
            this.updateApprovalCount();
            
            // Animate for new events
            if (this.options.animate) {
                this.animateNewEvent();
            }
        }
        
        handleProofEvent(proof) {
            // Add to proofs list
            this.data.proofs.unshift(proof);
            if (this.data.proofs.length > 10) {
                this.data.proofs.pop();
            }
            
            // Update proof display
            this.updateProofDisplay();
        }
        
        updateStatus(statusData) {
            this.data.status = statusData.active ? 'active' : 'inactive';
            
            const statusElements = this.element.querySelectorAll('[data-field="status"]');
            statusElements.forEach(el => {
                el.textContent = this.data.status === 'active' ? '🟢 Active' : '🔴 Inactive';
            });
            
            this.updateConnectionStatus(this.data.status);
        }
        
        updateMetrics(metricsData) {
            const metrics = metricsData.guardian || {};
            this.data.metrics = metrics;
            
            // Update metric displays
            const updates = {
                approvals: metrics.totalApprovals || 0,
                accuracy: metrics.accuracyRate || '0%',
                totalApprovals: metrics.totalApprovals || 0,
                accuracyRate: metrics.accuracyRate || '0%',
                avgResponse: metrics.avgResponseTime ? `${Math.round(metrics.avgResponseTime)}ms` : '0ms',
                chainLength: metrics.currentChainLength || 0,
                todayApprovals: metrics.todayApprovals || 0
            };
            
            Object.entries(updates).forEach(([field, value]) => {
                const elements = this.element.querySelectorAll(`[data-field="${field}"], [data-metric="${field}"]`);
                elements.forEach(el => {
                    el.textContent = value;
                });
            });
        }
        
        updateEvents(events) {
            this.data.approvals = events || [];
            this.updateEventsList();
        }
        
        updateEventsList() {
            const listElement = this.element.querySelector('[data-list="approvals"]');
            if (!listElement) return;
            
            if (this.data.approvals.length === 0) {
                listElement.innerHTML = '<div class="no-data">No recent approvals</div>';
                return;
            }
            
            listElement.innerHTML = this.data.approvals.map(event => `
                <div class="activity-item">
                    <div class="activity-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div class="activity-type">${event.eventType || event.type}</div>
                    ${event.data?.brand ? `<div class="activity-brand">${event.data.brand}</div>` : ''}
                </div>
            `).join('');
        }
        
        updateProofData(proofData) {
            if (proofData.block) {
                const updates = {
                    chainLength: proofData.chainLength || 0,
                    latestBlock: `#${proofData.block.index}`,
                    verified: proofData.verified ? '✓' : '✗'
                };
                
                Object.entries(updates).forEach(([field, value]) => {
                    const element = this.element.querySelector(`[data-field="${field}"]`);
                    if (element) {
                        element.textContent = value;
                        if (field === 'verified') {
                            element.style.color = proofData.verified ? '#00ff88' : '#ff4444';
                        }
                    }
                });
            }
        }
        
        updateProofDisplay() {
            const chainElement = this.element.querySelector('[data-chain="proofs"]');
            if (!chainElement) return;
            
            if (this.data.proofs.length === 0) {
                chainElement.innerHTML = '<div class="loading">Loading proof chain...</div>';
                return;
            }
            
            chainElement.innerHTML = this.data.proofs.map(proof => `
                <div class="proof-block">
                    <div class="block-header">
                        <span class="block-index">#${proof.blockIndex}</span>
                        <span class="block-type">${proof.blockType}</span>
                    </div>
                    <div class="block-hash">${proof.blockHash.substring(0, 16)}...</div>
                    <div class="block-verified ${proof.verified ? 'verified' : 'unverified'}">
                        ${proof.verified ? '✓ Verified' : '✗ Unverified'}
                    </div>
                </div>
            `).join('');
        }
        
        updateConnectionStatus(status) {
            const statusLights = this.element.querySelectorAll('[data-status]');
            statusLights.forEach(light => {
                light.setAttribute('data-status', status);
            });
            
            const statusIndicators = this.element.querySelectorAll('.status-indicator');
            statusIndicators.forEach(indicator => {
                indicator.className = `status-indicator status-${status}`;
            });
        }
        
        updateApprovalCount() {
            const countElement = this.element.querySelector('[data-field="approvals"]');
            if (countElement) {
                countElement.textContent = this.data.approvals.length;
            }
        }
        
        animateNewEvent() {
            this.element.classList.add('new-event');
            setTimeout(() => {
                this.element.classList.remove('new-event');
            }, GUARDIAN_CONFIG.animationDuration);
        }
        
        startUpdateLoop() {
            // Periodically fetch updates if not using WebSocket
            setInterval(async () => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    await this.loadInitialData();
                }
            }, GUARDIAN_CONFIG.updateInterval);
        }
        
        injectStyles() {
            const styleId = 'guardian-widget-styles';
            if (document.getElementById(styleId)) return;
            
            const styles = document.createElement('style');
            styles.id = styleId;
            styles.textContent = `
                /* Guardian Widget Base Styles */
                .guardian-widget {
                    font-family: 'Courier New', monospace;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                /* Dark Theme */
                .guardian-dark {
                    background: #0a0a0a;
                    color: #ffffff;
                    border: 2px solid #00ff88;
                }
                
                .guardian-dark .guardian-header {
                    background: rgba(0, 255, 136, 0.1);
                    border-bottom: 1px solid #00ff88;
                }
                
                /* Light Theme */
                .guardian-light {
                    background: #ffffff;
                    color: #333333;
                    border: 2px solid #00cc66;
                }
                
                .guardian-light .guardian-header {
                    background: rgba(0, 204, 102, 0.1);
                    border-bottom: 1px solid #00cc66;
                }
                
                /* Header */
                .guardian-header {
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .guardian-icon {
                    font-size: 20px;
                }
                
                .guardian-title {
                    flex: 1;
                    font-weight: bold;
                }
                
                .guardian-status-light {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #666;
                    transition: all 0.3s ease;
                }
                
                .guardian-status-light[data-status="connecting"] {
                    background: #ffaa00;
                    animation: pulse 2s infinite;
                }
                
                .guardian-status-light[data-status="connected"],
                .guardian-status-light[data-status="active"] {
                    background: #00ff88;
                }
                
                .guardian-status-light[data-status="error"],
                .guardian-status-light[data-status="disconnected"] {
                    background: #ff4444;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* Content */
                .guardian-content {
                    padding: 12px;
                }
                
                .guardian-metric {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 14px;
                }
                
                .metric-label {
                    color: #999;
                }
                
                .metric-value {
                    font-weight: bold;
                }
                
                .guardian-dark .metric-value {
                    color: #00ff88;
                }
                
                .guardian-light .metric-value {
                    color: #00cc66;
                }
                
                /* Tabs */
                .guardian-tabs {
                    display: flex;
                    border-bottom: 1px solid #333;
                }
                
                .tab-button {
                    flex: 1;
                    padding: 8px;
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                
                .guardian-dark .tab-button:hover {
                    background: rgba(0, 255, 136, 0.1);
                }
                
                .guardian-dark .tab-button.active {
                    background: rgba(0, 255, 136, 0.2);
                    border-bottom: 2px solid #00ff88;
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                /* Activity List */
                .activity-list {
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .activity-item {
                    padding: 8px;
                    margin-bottom: 4px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    font-size: 12px;
                }
                
                .activity-time {
                    color: #666;
                    font-size: 10px;
                }
                
                .activity-type {
                    font-weight: bold;
                    margin: 2px 0;
                }
                
                /* Metrics Grid */
                .metrics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                
                .metric-card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px;
                    border-radius: 4px;
                    text-align: center;
                }
                
                .metric-big {
                    font-size: 24px;
                    font-weight: bold;
                    margin-top: 4px;
                }
                
                /* Proof Widget */
                .proof-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .proof-stats {
                    display: flex;
                    gap: 20px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }
                
                .stat-item {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .proof-chain {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 250px;
                }
                
                .proof-block {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    border-left: 3px solid #00ff88;
                }
                
                .block-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                }
                
                .block-hash {
                    font-size: 11px;
                    color: #666;
                    margin: 4px 0;
                }
                
                .block-verified {
                    font-size: 12px;
                }
                
                .verified {
                    color: #00ff88;
                }
                
                .unverified {
                    color: #ff4444;
                }
                
                /* Ticker */
                .guardian-ticker {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    gap: 12px;
                    height: 100%;
                }
                
                .ticker-content {
                    flex: 1;
                    overflow: hidden;
                }
                
                .ticker-item {
                    display: inline-block;
                    animation: ticker 20s linear infinite;
                }
                
                @keyframes ticker {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                
                /* Floating Widget */
                .guardian-floating {
                    background: inherit;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .floating-header {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    gap: 8px;
                    cursor: move;
                }
                
                .close-button {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 20px;
                    cursor: pointer;
                    opacity: 0.6;
                }
                
                .close-button:hover {
                    opacity: 1;
                }
                
                .floating-content {
                    padding: 12px;
                }
                
                .status-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                
                .mini-stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 12px;
                }
                
                .mini-stat {
                    font-size: 12px;
                }
                
                .mini-label {
                    color: #999;
                }
                
                .recent-activity {
                    font-size: 11px;
                    max-height: 120px;
                    overflow-y: auto;
                }
                
                .floating-footer {
                    padding: 8px 12px;
                    text-align: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .floating-footer a {
                    color: #00ff88;
                    text-decoration: none;
                    font-size: 12px;
                }
                
                /* Animations */
                .guardian-animated {
                    transition: all 0.3s ease;
                }
                
                .guardian-animated.new-event {
                    transform: scale(1.02);
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
                }
                
                /* Utility */
                .no-data {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                    font-size: 12px;
                }
                
                .loading {
                    text-align: center;
                    color: #999;
                    padding: 20px;
                }
                
                /* Buttons */
                .verify-button {
                    background: #00ff88;
                    color: #000;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: inherit;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .verify-button:hover {
                    background: #00cc66;
                    transform: translateY(-1px);
                }
                
                .key-link {
                    color: #00ff88;
                    text-decoration: none;
                    font-size: 12px;
                }
                
                /* Scrollbar */
                .guardian-dark ::-webkit-scrollbar {
                    width: 6px;
                }
                
                .guardian-dark ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .guardian-dark ::-webkit-scrollbar-thumb {
                    background: #00ff88;
                    border-radius: 3px;
                }
            `;
            
            document.head.appendChild(styles);
        }
    }
    
    // Static methods
    GuardianWidget.verifyChain = async function() {
        try {
            const response = await fetch(`${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/chain?limit=10`);
            const data = await response.json();
            
            if (data.verified) {
                alert('✅ Guardian proof chain verified!');
            } else {
                alert('❌ Guardian proof chain verification failed!');
            }
        } catch (error) {
            alert('Error verifying chain: ' + error.message);
        }
    };
    
    GuardianWidget.openDashboard = function(brand = '') {
        const dashboardUrl = `http://localhost:8082/?brand=${brand}`;
        window.open(dashboardUrl, '_blank');
    };
    
    // Auto-initialization
    GuardianWidget.autoInit = function() {
        // Find all elements with guardian-widget class
        const widgets = document.querySelectorAll('.guardian-widget, [data-guardian-widget]');
        
        widgets.forEach(element => {
            // Skip if already initialized
            if (element.guardianWidget) return;
            
            // Create widget instance
            element.guardianWidget = new GuardianWidget(element);
        });
    };
    
    // Widget loader
    GuardianWidget.load = function(selector, options = {}) {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (!element) {
            console.error('Guardian Widget: Element not found:', selector);
            return null;
        }
        
        return new GuardianWidget(element, options);
    };
    
    // Expose to global scope
    window.GuardianWidget = GuardianWidget;
    
    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', GuardianWidget.autoInit);
    } else {
        GuardianWidget.autoInit();
    }
    
})(window, document);

// Export for Node.js/npm
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuardianWidget;
}
        
        createTickerWidget() {
            this.element.innerHTML = `
                <div class="guardian-ticker">
                    <div class="ticker-icon">🛡️</div>
                    <div class="ticker-content" data-ticker="events">
                        <span class="ticker-item">Guardian Active</span>
                    </div>
                    <div class="ticker-stats">
                        <span class="ticker-stat" data-field="approvals">0</span> approvals |
                        <span class="ticker-stat" data-field="accuracy">--%</span> accuracy
                    </div>
                </div>
            `;
        }
        
        setupTabs() {
            const tabButtons = this.element.querySelectorAll('.tab-button');
            const tabContents = this.element.querySelectorAll('.tab-content');
            
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.getAttribute('data-tab');
                    
                    // Update active states
                    tabButtons.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    button.classList.add('active');
                    const targetContent = this.element.querySelector(`[data-tab-content="${targetTab}"]`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                });
            });
        }
        
        async loadInitialData() {
            try {
                // Load status
                const statusResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/status`);
                const statusData = await statusResponse.json();
                
                // Load metrics
                const metricsResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/metrics`);
                const metricsData = await metricsResponse.json();
                
                // Load recent events
                const eventsResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/events?limit=10&brand=${this.options.brand}`);
                const eventsData = await eventsResponse.json();
                
                // Update widget with initial data
                this.updateStatus(statusData);
                this.updateMetrics(metricsData);
                this.updateEvents(eventsData.events);
                
                // If proof widget, load proof data
                if (this.options.type === 'proof' || this.options.showProof) {
                    const proofResponse = await fetch(`${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/latest`);
                    const proofData = await proofResponse.json();
                    this.updateProofData(proofData);
                }
                
            } catch (error) {
                console.error('Failed to load Guardian data:', error);
                this.updateStatus({ active: false, error: error.message });
            }
        }
        
        connectWebSocket() {
            try {
                this.ws = new WebSocket(GUARDIAN_CONFIG.streamWS);
                
                this.ws.onopen = () => {
                    console.log('Guardian Widget connected to stream');
                    this.updateConnectionStatus('connected');
                    
                    // Subscribe to brand events
                    this.ws.send(JSON.stringify({
                        type: 'subscribe',
                        brand: this.options.brand
                    }));
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleStreamMessage(data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('Guardian Widget WebSocket error:', error);
                    this.updateConnectionStatus('error');
                };
                
                this.ws.onclose = () => {
                    console.log('Guardian Widget disconnected from stream');
                    this.updateConnectionStatus('disconnected');
                    
                    // Attempt reconnect after 5 seconds
                    setTimeout(() => this.connectWebSocket(), 5000);
                };
                
            } catch (error) {
                console.error('Failed to connect Guardian Widget:', error);
                this.updateConnectionStatus('error');
            }
        }
        
        handleStreamMessage(message) {
            switch (message.type) {
                case 'guardian_event':
                    this.handleGuardianEvent(message.data);
                    break;
                case 'guardian_proof':
                    this.handleProofEvent(message.proof);
                    break;
                case 'guardian_metrics':
                    this.updateMetrics({ guardian: message.metrics });
                    break;
                case 'welcome':
                    this.updateConnectionStatus('connected');
                    break;
            }
        }
        
        handleGuardianEvent(event) {
            // Add to events list
            this.data.approvals.unshift(event);
            if (this.data.approvals.length > 20) {
                this.data.approvals.pop();
            }
            
            // Update UI
            this.updateEventsList();
            this.updateApprovalCount();
            
            // Animate for new events
            if (this.options.animate) {
                this.animateNewEvent();
            }
        }
        
        handleProofEvent(proof) {
            // Add to proofs list
            this.data.proofs.unshift(proof);
            if (this.data.proofs.length > 10) {
                this.data.proofs.pop();
            }
            
            // Update proof display
            this.updateProofDisplay();
        }
        
        updateStatus(statusData) {
            this.data.status = statusData.active ? 'active' : 'inactive';
            
            const statusElements = this.element.querySelectorAll('[data-field="status"]');
            statusElements.forEach(el => {
                el.textContent = this.data.status === 'active' ? '🟢 Active' : '🔴 Inactive';
            });
            
            this.updateConnectionStatus(this.data.status);
        }
        
        updateMetrics(metricsData) {
            const metrics = metricsData.guardian || {};
            this.data.metrics = metrics;
            
            // Update metric displays
            const updates = {
                approvals: metrics.totalApprovals || 0,
                accuracy: metrics.accuracyRate || '0%',
                totalApprovals: metrics.totalApprovals || 0,
                accuracyRate: metrics.accuracyRate || '0%',
                avgResponse: metrics.avgResponseTime ? `${Math.round(metrics.avgResponseTime)}ms` : '0ms',
                chainLength: metrics.currentChainLength || 0,
                todayApprovals: metrics.todayApprovals || 0
            };
            
            Object.entries(updates).forEach(([field, value]) => {
                const elements = this.element.querySelectorAll(`[data-field="${field}"], [data-metric="${field}"]`);
                elements.forEach(el => {
                    el.textContent = value;
                });
            });
        }
        
        updateEvents(events) {
            this.data.approvals = events || [];
            this.updateEventsList();
        }
        
        updateEventsList() {
            const listElement = this.element.querySelector('[data-list="approvals"]');
            if (!listElement) return;
            
            if (this.data.approvals.length === 0) {
                listElement.innerHTML = '<div class="no-data">No recent approvals</div>';
                return;
            }
            
            listElement.innerHTML = this.data.approvals.map(event => `
                <div class="activity-item">
                    <div class="activity-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div class="activity-type">${event.eventType || event.type}</div>
                    ${event.data?.brand ? `<div class="activity-brand">${event.data.brand}</div>` : ''}
                </div>
            `).join('');
        }
        
        updateProofData(proofData) {
            if (proofData.block) {
                const updates = {
                    chainLength: proofData.chainLength || 0,
                    latestBlock: `#${proofData.block.index}`,
                    verified: proofData.verified ? '✓' : '✗'
                };
                
                Object.entries(updates).forEach(([field, value]) => {
                    const element = this.element.querySelector(`[data-field="${field}"]`);
                    if (element) {
                        element.textContent = value;
                        if (field === 'verified') {
                            element.style.color = proofData.verified ? '#00ff88' : '#ff4444';
                        }
                    }
                });
            }
        }
        
        updateProofDisplay() {
            const chainElement = this.element.querySelector('[data-chain="proofs"]');
            if (!chainElement) return;
            
            if (this.data.proofs.length === 0) {
                chainElement.innerHTML = '<div class="loading">Loading proof chain...</div>';
                return;
            }
            
            chainElement.innerHTML = this.data.proofs.map(proof => `
                <div class="proof-block">
                    <div class="block-header">
                        <span class="block-index">#${proof.blockIndex}</span>
                        <span class="block-type">${proof.blockType}</span>
                    </div>
                    <div class="block-hash">${proof.blockHash.substring(0, 16)}...</div>
                    <div class="block-verified ${proof.verified ? 'verified' : 'unverified'}">
                        ${proof.verified ? '✓ Verified' : '✗ Unverified'}
                    </div>
                </div>
            `).join('');
        }
        
        updateConnectionStatus(status) {
            const statusLights = this.element.querySelectorAll('[data-status]');
            statusLights.forEach(light => {
                light.setAttribute('data-status', status);
            });
            
            const statusIndicators = this.element.querySelectorAll('.status-indicator');
            statusIndicators.forEach(indicator => {
                indicator.className = `status-indicator status-${status}`;
            });
        }
        
        updateApprovalCount() {
            const countElement = this.element.querySelector('[data-field="approvals"]');
            if (countElement) {
                countElement.textContent = this.data.approvals.length;
            }
        }
        
        animateNewEvent() {
            this.element.classList.add('new-event');
            setTimeout(() => {
                this.element.classList.remove('new-event');
            }, GUARDIAN_CONFIG.animationDuration);
        }
        
        startUpdateLoop() {
            // Periodically fetch updates if not using WebSocket
            setInterval(async () => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    await this.loadInitialData();
                }
            }, GUARDIAN_CONFIG.updateInterval);
        }
        
        injectStyles() {
            const styleId = 'guardian-widget-styles';
            if (document.getElementById(styleId)) return;
            
            const styles = document.createElement('style');
            styles.id = styleId;
            styles.textContent = `
                /* Guardian Widget Base Styles */
                .guardian-widget {
                    font-family: 'Courier New', monospace;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                /* Dark Theme */
                .guardian-dark {
                    background: #0a0a0a;
                    color: #ffffff;
                    border: 2px solid #00ff88;
                }
                
                .guardian-dark .guardian-header {
                    background: rgba(0, 255, 136, 0.1);
                    border-bottom: 1px solid #00ff88;
                }
                
                /* Light Theme */
                .guardian-light {
                    background: #ffffff;
                    color: #333333;
                    border: 2px solid #00cc66;
                }
                
                .guardian-light .guardian-header {
                    background: rgba(0, 204, 102, 0.1);
                    border-bottom: 1px solid #00cc66;
                }
                
                /* Header */
                .guardian-header {
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .guardian-icon {
                    font-size: 20px;
                }
                
                .guardian-title {
                    flex: 1;
                    font-weight: bold;
                }
                
                .guardian-status-light {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #666;
                    transition: all 0.3s ease;
                }
                
                .guardian-status-light[data-status="connecting"] {
                    background: #ffaa00;
                    animation: pulse 2s infinite;
                }
                
                .guardian-status-light[data-status="connected"],
                .guardian-status-light[data-status="active"] {
                    background: #00ff88;
                }
                
                .guardian-status-light[data-status="error"],
                .guardian-status-light[data-status="disconnected"] {
                    background: #ff4444;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* Content */
                .guardian-content {
                    padding: 12px;
                }
                
                .guardian-metric {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 14px;
                }
                
                .metric-label {
                    color: #999;
                }
                
                .metric-value {
                    font-weight: bold;
                }
                
                .guardian-dark .metric-value {
                    color: #00ff88;
                }
                
                .guardian-light .metric-value {
                    color: #00cc66;
                }
                
                /* Tabs */
                .guardian-tabs {
                    display: flex;
                    border-bottom: 1px solid #333;
                }
                
                .tab-button {
                    flex: 1;
                    padding: 8px;
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                
                .guardian-dark .tab-button:hover {
                    background: rgba(0, 255, 136, 0.1);
                }
                
                .guardian-dark .tab-button.active {
                    background: rgba(0, 255, 136, 0.2);
                    border-bottom: 2px solid #00ff88;
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                /* Activity List */
                .activity-list {
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .activity-item {
                    padding: 8px;
                    margin-bottom: 4px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    font-size: 12px;
                }
                
                .activity-time {
                    color: #666;
                    font-size: 10px;
                }
                
                .activity-type {
                    font-weight: bold;
                    margin: 2px 0;
                }
                
                /* Metrics Grid */
                .metrics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                
                .metric-card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px;
                    border-radius: 4px;
                    text-align: center;
                }
                
                .metric-big {
                    font-size: 24px;
                    font-weight: bold;
                    margin-top: 4px;
                }
                
                /* Proof Widget */
                .proof-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .proof-stats {
                    display: flex;
                    gap: 20px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }
                
                .stat-item {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .proof-chain {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 250px;
                }
                
                .proof-block {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    border-left: 3px solid #00ff88;
                }
                
                .block-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                }
                
                .block-hash {
                    font-size: 11px;
                    color: #666;
                    margin: 4px 0;
                }
                
                .block-verified {
                    font-size: 12px;
                }
                
                .verified {
                    color: #00ff88;
                }
                
                .unverified {
                    color: #ff4444;
                }
                
                /* Ticker */
                .guardian-ticker {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    gap: 12px;
                    height: 100%;
                }
                
                .ticker-content {
                    flex: 1;
                    overflow: hidden;
                }
                
                .ticker-item {
                    display: inline-block;
                    animation: ticker 20s linear infinite;
                }
                
                @keyframes ticker {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                
                /* Floating Widget */
                .guardian-floating {
                    background: inherit;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .floating-header {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    gap: 8px;
                    cursor: move;
                }
                
                .close-button {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 20px;
                    cursor: pointer;
                    opacity: 0.6;
                }
                
                .close-button:hover {
                    opacity: 1;
                }
                
                .floating-content {
                    padding: 12px;
                }
                
                .status-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                
                .mini-stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 12px;
                }
                
                .mini-stat {
                    font-size: 12px;
                }
                
                .mini-label {
                    color: #999;
                }
                
                .recent-activity {
                    font-size: 11px;
                    max-height: 120px;
                    overflow-y: auto;
                }
                
                .floating-footer {
                    padding: 8px 12px;
                    text-align: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .floating-footer a {
                    color: #00ff88;
                    text-decoration: none;
                    font-size: 12px;
                }
                
                /* Animations */
                .guardian-animated {
                    transition: all 0.3s ease;
                }
                
                .guardian-animated.new-event {
                    transform: scale(1.02);
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
                }
                
                /* Utility */
                .no-data {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                    font-size: 12px;
                }
                
                .loading {
                    text-align: center;
                    color: #999;
                    padding: 20px;
                }
                
                /* Buttons */
                .verify-button {
                    background: #00ff88;
                    color: #000;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: inherit;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .verify-button:hover {
                    background: #00cc66;
                    transform: translateY(-1px);
                }
                
                .key-link {
                    color: #00ff88;
                    text-decoration: none;
                    font-size: 12px;
                }
                
                /* Scrollbar */
                .guardian-dark ::-webkit-scrollbar {
                    width: 6px;
                }
                
                .guardian-dark ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .guardian-dark ::-webkit-scrollbar-thumb {
                    background: #00ff88;
                    border-radius: 3px;
                }
            `;
            
            document.head.appendChild(styles);
        }
    }
    
    // Static methods
    GuardianWidget.verifyChain = async function() {
        try {
            const response = await fetch(`${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/chain?limit=10`);
            const data = await response.json();
            
            if (data.verified) {
                alert('✅ Guardian proof chain verified!');
            } else {
                alert('❌ Guardian proof chain verification failed!');
            }
        } catch (error) {
            alert('Error verifying chain: ' + error.message);
        }
    };
    
    GuardianWidget.openDashboard = function(brand = '') {
        const dashboardUrl = `http://localhost:8082/?brand=${brand}`;
        window.open(dashboardUrl, '_blank');
    };
    
    // Auto-initialization
    GuardianWidget.autoInit = function() {
        // Find all elements with guardian-widget class
        const widgets = document.querySelectorAll('.guardian-widget, [data-guardian-widget]');
        
        widgets.forEach(element => {
            // Skip if already initialized
            if (element.guardianWidget) return;
            
            // Create widget instance
            element.guardianWidget = new GuardianWidget(element);
        });
    };
    
    // Widget loader
    GuardianWidget.load = function(selector, options = {}) {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (!element) {
            console.error('Guardian Widget: Element not found:', selector);
            return null;
        }
        
        return new GuardianWidget(element, options);
    };
    
    // Expose to global scope
    window.GuardianWidget = GuardianWidget;
    
    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', GuardianWidget.autoInit);
    } else {
        GuardianWidget.autoInit();
    }
    
})(window, document);

// Export for Node.js/npm
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuardianWidget;
}
        
        createFloatingWidget() {
            // Make widget floating
            this.element.style.position = 'fixed';
            this.element.style.bottom = '20px';
            this.element.style.right = '20px';
            this.element.style.zIndex = '9999';
            
            this.element.innerHTML = `
                <div class="guardian-floating">
                    <div class="floating-header">
                        <div class="guardian-icon">🛡️</div>
                        <div class="guardian-title">Guardian</div>
                        <button class="close-button" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="floating-content">
                        <div class="status-row">
                            <span class="status-indicator" data-status="connecting"></span>
                            <span data-field="status">Connecting...</span>
                        </div>
                        <div class="mini-stats">
                            <div class="mini-stat">
                                <span class="mini-label">Today:</span>
                                <span class="mini-value" data-field="todayApprovals">0</span>
                            </div>
                            <div class="mini-stat">
                                <span class="mini-label">Rate:</span>
                                <span class="mini-value" data-field="accuracy">--%</span>
                            </div>
                        </div>
                        <div class="recent-activity" data-mini-list="events">
                            <div class="mini-event">Waiting for events...</div>
                        </div>
                    </div>
                    <div class="floating-footer">
                        <a href="#" onclick="GuardianWidget.openDashboard('${this.options.brand}'); return false;">Open Dashboard</a>
                    </div>
                </div>
            `;
        }
        
        setupTabs() {
            const tabButtons = this.element.querySelectorAll('.tab-button');
            const tabContents = this.element.querySelectorAll('.tab-content');
            
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.getAttribute('data-tab');
                    
                    // Update active states
                    tabButtons.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    button.classList.add('active');
                    const targetContent = this.element.querySelector(`[data-tab-content="${targetTab}"]`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                });
            });
        }
        
        async loadInitialData() {
            try {
                // Load status
                const statusResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/status`);
                const statusData = await statusResponse.json();
                
                // Load metrics
                const metricsResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/metrics`);
                const metricsData = await metricsResponse.json();
                
                // Load recent events
                const eventsResponse = await fetch(`${GUARDIAN_CONFIG.streamAPI}/api/stream/events?limit=10&brand=${this.options.brand}`);
                const eventsData = await eventsResponse.json();
                
                // Update widget with initial data
                this.updateStatus(statusData);
                this.updateMetrics(metricsData);
                this.updateEvents(eventsData.events);
                
                // If proof widget, load proof data
                if (this.options.type === 'proof' || this.options.showProof) {
                    const proofResponse = await fetch(`${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/latest`);
                    const proofData = await proofResponse.json();
                    this.updateProofData(proofData);
                }
                
            } catch (error) {
                console.error('Failed to load Guardian data:', error);
                this.updateStatus({ active: false, error: error.message });
            }
        }
        
        connectWebSocket() {
            try {
                this.ws = new WebSocket(GUARDIAN_CONFIG.streamWS);
                
                this.ws.onopen = () => {
                    console.log('Guardian Widget connected to stream');
                    this.updateConnectionStatus('connected');
                    
                    // Subscribe to brand events
                    this.ws.send(JSON.stringify({
                        type: 'subscribe',
                        brand: this.options.brand
                    }));
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleStreamMessage(data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('Guardian Widget WebSocket error:', error);
                    this.updateConnectionStatus('error');
                };
                
                this.ws.onclose = () => {
                    console.log('Guardian Widget disconnected from stream');
                    this.updateConnectionStatus('disconnected');
                    
                    // Attempt reconnect after 5 seconds
                    setTimeout(() => this.connectWebSocket(), 5000);
                };
                
            } catch (error) {
                console.error('Failed to connect Guardian Widget:', error);
                this.updateConnectionStatus('error');
            }
        }
        
        handleStreamMessage(message) {
            switch (message.type) {
                case 'guardian_event':
                    this.handleGuardianEvent(message.data);
                    break;
                case 'guardian_proof':
                    this.handleProofEvent(message.proof);
                    break;
                case 'guardian_metrics':
                    this.updateMetrics({ guardian: message.metrics });
                    break;
                case 'welcome':
                    this.updateConnectionStatus('connected');
                    break;
            }
        }
        
        handleGuardianEvent(event) {
            // Add to events list
            this.data.approvals.unshift(event);
            if (this.data.approvals.length > 20) {
                this.data.approvals.pop();
            }
            
            // Update UI
            this.updateEventsList();
            this.updateApprovalCount();
            
            // Animate for new events
            if (this.options.animate) {
                this.animateNewEvent();
            }
        }
        
        handleProofEvent(proof) {
            // Add to proofs list
            this.data.proofs.unshift(proof);
            if (this.data.proofs.length > 10) {
                this.data.proofs.pop();
            }
            
            // Update proof display
            this.updateProofDisplay();
        }
        
        updateStatus(statusData) {
            this.data.status = statusData.active ? 'active' : 'inactive';
            
            const statusElements = this.element.querySelectorAll('[data-field="status"]');
            statusElements.forEach(el => {
                el.textContent = this.data.status === 'active' ? '🟢 Active' : '🔴 Inactive';
            });
            
            this.updateConnectionStatus(this.data.status);
        }
        
        updateMetrics(metricsData) {
            const metrics = metricsData.guardian || {};
            this.data.metrics = metrics;
            
            // Update metric displays
            const updates = {
                approvals: metrics.totalApprovals || 0,
                accuracy: metrics.accuracyRate || '0%',
                totalApprovals: metrics.totalApprovals || 0,
                accuracyRate: metrics.accuracyRate || '0%',
                avgResponse: metrics.avgResponseTime ? `${Math.round(metrics.avgResponseTime)}ms` : '0ms',
                chainLength: metrics.currentChainLength || 0,
                todayApprovals: metrics.todayApprovals || 0
            };
            
            Object.entries(updates).forEach(([field, value]) => {
                const elements = this.element.querySelectorAll(`[data-field="${field}"], [data-metric="${field}"]`);
                elements.forEach(el => {
                    el.textContent = value;
                });
            });
        }
        
        updateEvents(events) {
            this.data.approvals = events || [];
            this.updateEventsList();
        }
        
        updateEventsList() {
            const listElement = this.element.querySelector('[data-list="approvals"]');
            if (!listElement) return;
            
            if (this.data.approvals.length === 0) {
                listElement.innerHTML = '<div class="no-data">No recent approvals</div>';
                return;
            }
            
            listElement.innerHTML = this.data.approvals.map(event => `
                <div class="activity-item">
                    <div class="activity-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div class="activity-type">${event.eventType || event.type}</div>
                    ${event.data?.brand ? `<div class="activity-brand">${event.data.brand}</div>` : ''}
                </div>
            `).join('');
        }
        
        updateProofData(proofData) {
            if (proofData.block) {
                const updates = {
                    chainLength: proofData.chainLength || 0,
                    latestBlock: `#${proofData.block.index}`,
                    verified: proofData.verified ? '✓' : '✗'
                };
                
                Object.entries(updates).forEach(([field, value]) => {
                    const element = this.element.querySelector(`[data-field="${field}"]`);
                    if (element) {
                        element.textContent = value;
                        if (field === 'verified') {
                            element.style.color = proofData.verified ? '#00ff88' : '#ff4444';
                        }
                    }
                });
            }
        }
        
        updateProofDisplay() {
            const chainElement = this.element.querySelector('[data-chain="proofs"]');
            if (!chainElement) return;
            
            if (this.data.proofs.length === 0) {
                chainElement.innerHTML = '<div class="loading">Loading proof chain...</div>';
                return;
            }
            
            chainElement.innerHTML = this.data.proofs.map(proof => `
                <div class="proof-block">
                    <div class="block-header">
                        <span class="block-index">#${proof.blockIndex}</span>
                        <span class="block-type">${proof.blockType}</span>
                    </div>
                    <div class="block-hash">${proof.blockHash.substring(0, 16)}...</div>
                    <div class="block-verified ${proof.verified ? 'verified' : 'unverified'}">
                        ${proof.verified ? '✓ Verified' : '✗ Unverified'}
                    </div>
                </div>
            `).join('');
        }
        
        updateConnectionStatus(status) {
            const statusLights = this.element.querySelectorAll('[data-status]');
            statusLights.forEach(light => {
                light.setAttribute('data-status', status);
            });
            
            const statusIndicators = this.element.querySelectorAll('.status-indicator');
            statusIndicators.forEach(indicator => {
                indicator.className = `status-indicator status-${status}`;
            });
        }
        
        updateApprovalCount() {
            const countElement = this.element.querySelector('[data-field="approvals"]');
            if (countElement) {
                countElement.textContent = this.data.approvals.length;
            }
        }
        
        animateNewEvent() {
            this.element.classList.add('new-event');
            setTimeout(() => {
                this.element.classList.remove('new-event');
            }, GUARDIAN_CONFIG.animationDuration);
        }
        
        startUpdateLoop() {
            // Periodically fetch updates if not using WebSocket
            setInterval(async () => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    await this.loadInitialData();
                }
            }, GUARDIAN_CONFIG.updateInterval);
        }
        
        injectStyles() {
            const styleId = 'guardian-widget-styles';
            if (document.getElementById(styleId)) return;
            
            const styles = document.createElement('style');
            styles.id = styleId;
            styles.textContent = `
                /* Guardian Widget Base Styles */
                .guardian-widget {
                    font-family: 'Courier New', monospace;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                /* Dark Theme */
                .guardian-dark {
                    background: #0a0a0a;
                    color: #ffffff;
                    border: 2px solid #00ff88;
                }
                
                .guardian-dark .guardian-header {
                    background: rgba(0, 255, 136, 0.1);
                    border-bottom: 1px solid #00ff88;
                }
                
                /* Light Theme */
                .guardian-light {
                    background: #ffffff;
                    color: #333333;
                    border: 2px solid #00cc66;
                }
                
                .guardian-light .guardian-header {
                    background: rgba(0, 204, 102, 0.1);
                    border-bottom: 1px solid #00cc66;
                }
                
                /* Header */
                .guardian-header {
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .guardian-icon {
                    font-size: 20px;
                }
                
                .guardian-title {
                    flex: 1;
                    font-weight: bold;
                }
                
                .guardian-status-light {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #666;
                    transition: all 0.3s ease;
                }
                
                .guardian-status-light[data-status="connecting"] {
                    background: #ffaa00;
                    animation: pulse 2s infinite;
                }
                
                .guardian-status-light[data-status="connected"],
                .guardian-status-light[data-status="active"] {
                    background: #00ff88;
                }
                
                .guardian-status-light[data-status="error"],
                .guardian-status-light[data-status="disconnected"] {
                    background: #ff4444;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* Content */
                .guardian-content {
                    padding: 12px;
                }
                
                .guardian-metric {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 14px;
                }
                
                .metric-label {
                    color: #999;
                }
                
                .metric-value {
                    font-weight: bold;
                }
                
                .guardian-dark .metric-value {
                    color: #00ff88;
                }
                
                .guardian-light .metric-value {
                    color: #00cc66;
                }
                
                /* Tabs */
                .guardian-tabs {
                    display: flex;
                    border-bottom: 1px solid #333;
                }
                
                .tab-button {
                    flex: 1;
                    padding: 8px;
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                
                .guardian-dark .tab-button:hover {
                    background: rgba(0, 255, 136, 0.1);
                }
                
                .guardian-dark .tab-button.active {
                    background: rgba(0, 255, 136, 0.2);
                    border-bottom: 2px solid #00ff88;
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                /* Activity List */
                .activity-list {
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .activity-item {
                    padding: 8px;
                    margin-bottom: 4px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    font-size: 12px;
                }
                
                .activity-time {
                    color: #666;
                    font-size: 10px;
                }
                
                .activity-type {
                    font-weight: bold;
                    margin: 2px 0;
                }
                
                /* Metrics Grid */
                .metrics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                
                .metric-card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px;
                    border-radius: 4px;
                    text-align: center;
                }
                
                .metric-big {
                    font-size: 24px;
                    font-weight: bold;
                    margin-top: 4px;
                }
                
                /* Proof Widget */
                .proof-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .proof-stats {
                    display: flex;
                    gap: 20px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }
                
                .stat-item {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .proof-chain {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 250px;
                }
                
                .proof-block {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    border-left: 3px solid #00ff88;
                }
                
                .block-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                }
                
                .block-hash {
                    font-size: 11px;
                    color: #666;
                    margin: 4px 0;
                }
                
                .block-verified {
                    font-size: 12px;
                }
                
                .verified {
                    color: #00ff88;
                }
                
                .unverified {
                    color: #ff4444;
                }
                
                /* Ticker */
                .guardian-ticker {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    gap: 12px;
                    height: 100%;
                }
                
                .ticker-content {
                    flex: 1;
                    overflow: hidden;
                }
                
                .ticker-item {
                    display: inline-block;
                    animation: ticker 20s linear infinite;
                }
                
                @keyframes ticker {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                
                /* Floating Widget */
                .guardian-floating {
                    background: inherit;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .floating-header {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    gap: 8px;
                    cursor: move;
                }
                
                .close-button {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 20px;
                    cursor: pointer;
                    opacity: 0.6;
                }
                
                .close-button:hover {
                    opacity: 1;
                }
                
                .floating-content {
                    padding: 12px;
                }
                
                .status-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                
                .mini-stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 12px;
                }
                
                .mini-stat {
                    font-size: 12px;
                }
                
                .mini-label {
                    color: #999;
                }
                
                .recent-activity {
                    font-size: 11px;
                    max-height: 120px;
                    overflow-y: auto;
                }
                
                .floating-footer {
                    padding: 8px 12px;
                    text-align: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .floating-footer a {
                    color: #00ff88;
                    text-decoration: none;
                    font-size: 12px;
                }
                
                /* Animations */
                .guardian-animated {
                    transition: all 0.3s ease;
                }
                
                .guardian-animated.new-event {
                    transform: scale(1.02);
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
                }
                
                /* Utility */
                .no-data {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                    font-size: 12px;
                }
                
                .loading {
                    text-align: center;
                    color: #999;
                    padding: 20px;
                }
                
                /* Buttons */
                .verify-button {
                    background: #00ff88;
                    color: #000;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: inherit;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .verify-button:hover {
                    background: #00cc66;
                    transform: translateY(-1px);
                }
                
                .key-link {
                    color: #00ff88;
                    text-decoration: none;
                    font-size: 12px;
                }
                
                /* Scrollbar */
                .guardian-dark ::-webkit-scrollbar {
                    width: 6px;
                }
                
                .guardian-dark ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .guardian-dark ::-webkit-scrollbar-thumb {
                    background: #00ff88;
                    border-radius: 3px;
                }
            `;
            
            document.head.appendChild(styles);
        }
    }
    
    // Static methods
    GuardianWidget.verifyChain = async function() {
        try {
            const response = await fetch(`${GUARDIAN_CONFIG.proofAPI}/api/guardian/proof/chain?limit=10`);
            const data = await response.json();
            
            if (data.verified) {
                alert('✅ Guardian proof chain verified!');
            } else {
                alert('❌ Guardian proof chain verification failed!');
            }
        } catch (error) {
            alert('Error verifying chain: ' + error.message);
        }
    };
    
    GuardianWidget.openDashboard = function(brand = '') {
        const dashboardUrl = `http://localhost:8082/?brand=${brand}`;
        window.open(dashboardUrl, '_blank');
    };
    
    // Auto-initialization
    GuardianWidget.autoInit = function() {
        // Find all elements with guardian-widget class
        const widgets = document.querySelectorAll('.guardian-widget, [data-guardian-widget]');
        
        widgets.forEach(element => {
            // Skip if already initialized
            if (element.guardianWidget) return;
            
            // Create widget instance
            element.guardianWidget = new GuardianWidget(element);
        });
    };
    
    // Widget loader
    GuardianWidget.load = function(selector, options = {}) {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (!element) {
            console.error('Guardian Widget: Element not found:', selector);
            return null;
        }
        
        return new GuardianWidget(element, options);
    };
    
    // Expose to global scope
    window.GuardianWidget = GuardianWidget;
    
    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', GuardianWidget.autoInit);
    } else {
        GuardianWidget.autoInit();
    }
    
})(window, document);

// Export for Node.js/npm
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuardianWidget;
}
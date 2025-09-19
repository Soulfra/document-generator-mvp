/**
 * 🎮 PERSISTENT NAVIGATION WIDGET
 * Injects into ALL web interfaces for unified control
 */

class PersistentNavWidget {
    constructor() {
        this.services = new Map();
        this.masterControllerUrl = 'http://localhost:9999';
        this.isMinimized = false;
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        await this.createWidget();
        await this.loadServiceData();
        this.startAutoRefresh();
        this.injectIntoPage();
    }

    async createWidget() {
        // Create main widget container
        this.widget = document.createElement('div');
        this.widget.id = 'persistent-nav-widget';
        this.widget.innerHTML = `
            <div class="nav-widget-header">
                <span class="nav-widget-title">🎮 System Control</span>
                <div class="nav-widget-controls">
                    <span class="health-indicator" id="health-indicator">●</span>
                    <button class="nav-widget-btn" id="minimize-btn">${this.isMinimized ? '◐' : '◑'}</button>
                    <button class="nav-widget-btn" id="refresh-btn">⟳</button>
                </div>
            </div>
            <div class="nav-widget-content" id="nav-widget-content">
                <div class="quick-services">
                    <h4>🚀 Quick Access</h4>
                    <div class="service-grid" id="service-grid">
                        Loading services...
                    </div>
                </div>
                <div class="system-actions">
                    <button class="action-btn primary" id="fix-all-btn">🔧 Fix Everything!</button>
                    <button class="action-btn secondary" id="restart-services-btn">🔄 Restart Failed</button>
                    <button class="action-btn secondary" id="view-dashboard-btn">📊 Dashboard</button>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();
        this.bindEvents();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #persistent-nav-widget {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 2px solid #00ff41;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 255, 65, 0.3);
                color: #00ff41;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 10000;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }

            #persistent-nav-widget.minimized .nav-widget-content {
                display: none;
            }

            .nav-widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: rgba(0, 255, 65, 0.1);
                border-bottom: 1px solid #00ff41;
                border-radius: 10px 10px 0 0;
                cursor: move;
            }

            .nav-widget-title {
                font-weight: bold;
                font-size: 14px;
            }

            .nav-widget-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .health-indicator {
                font-size: 16px;
                animation: pulse 2s infinite;
            }

            .health-indicator.healthy { color: #00ff41; }
            .health-indicator.warning { color: #ffaa00; }
            .health-indicator.critical { color: #ff3366; }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.6; }
                100% { opacity: 1; }
            }

            .nav-widget-btn {
                background: transparent;
                border: 1px solid #00ff41;
                color: #00ff41;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .nav-widget-btn:hover {
                background: #00ff41;
                color: #1a1a2e;
            }

            .nav-widget-content {
                padding: 12px;
                max-height: 400px;
                overflow-y: auto;
            }

            .quick-services h4 {
                margin: 0 0 8px 0;
                font-size: 12px;
                color: #00ff41;
            }

            .service-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                margin-bottom: 12px;
            }

            .service-item {
                display: flex;
                align-items: center;
                padding: 6px;
                background: rgba(0, 255, 65, 0.05);
                border: 1px solid rgba(0, 255, 65, 0.2);
                border-radius: 6px;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .service-item:hover {
                background: rgba(0, 255, 65, 0.1);
                border-color: #00ff41;
            }

            .service-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 6px;
                flex-shrink: 0;
            }

            .service-status.healthy { background: #00ff41; }
            .service-status.unhealthy { background: #ffaa00; }
            .service-status.offline { background: #ff3366; }

            .service-name {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .system-actions {
                border-top: 1px solid rgba(0, 255, 65, 0.2);
                padding-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .action-btn {
                background: transparent;
                border: 1px solid #00ff41;
                color: #00ff41;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-family: inherit;
                transition: all 0.2s ease;
                text-align: center;
            }

            .action-btn:hover {
                background: rgba(0, 255, 65, 0.1);
            }

            .action-btn.primary {
                background: #00ff41;
                color: #1a1a2e;
                font-weight: bold;
            }

            .action-btn.primary:hover {
                background: #33ff66;
            }

            /* Scrollbar styling */
            .nav-widget-content::-webkit-scrollbar {
                width: 6px;
            }

            .nav-widget-content::-webkit-scrollbar-track {
                background: rgba(0, 255, 65, 0.1);
                border-radius: 3px;
            }

            .nav-widget-content::-webkit-scrollbar-thumb {
                background: #00ff41;
                border-radius: 3px;
            }

            .nav-widget-content::-webkit-scrollbar-thumb:hover {
                background: #33ff66;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Minimize/maximize button
        document.getElementById('minimize-btn').addEventListener('click', () => {
            this.toggleMinimize();
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadServiceData();
        });

        // Action buttons
        document.getElementById('fix-all-btn').addEventListener('click', () => {
            this.fixAllServices();
        });

        document.getElementById('restart-services-btn').addEventListener('click', () => {
            this.restartFailedServices();
        });

        document.getElementById('view-dashboard-btn').addEventListener('click', () => {
            window.open(this.masterControllerUrl, '_blank');
        });

        // Make widget draggable
        this.makeDraggable();
    }

    async loadServiceData() {
        try {
            const response = await fetch(`${this.masterControllerUrl}/api/status`);
            const data = await response.json();
            
            this.updateHealthIndicator(data.summary);
            this.updateServiceGrid(data.services);
        } catch (error) {
            console.warn('Could not load service data:', error);
            this.updateHealthIndicator({ healthPercentage: 0 });
        }
    }

    updateHealthIndicator(summary) {
        const indicator = document.getElementById('health-indicator');
        const health = parseFloat(summary.healthPercentage) || 0;
        
        if (health >= 80) {
            indicator.className = 'health-indicator healthy';
            indicator.textContent = '●';
        } else if (health >= 50) {
            indicator.className = 'health-indicator warning';
            indicator.textContent = '◐';
        } else {
            indicator.className = 'health-indicator critical';
            indicator.textContent = '○';
        }
    }

    updateServiceGrid(services) {
        const grid = document.getElementById('service-grid');
        
        // Filter to most important services
        const importantServices = services
            .filter(s => s.critical || s.status === 'healthy')
            .slice(0, 8);

        grid.innerHTML = importantServices.map(service => `
            <div class="service-item" onclick="window.open('http://localhost:${service.port}', '_blank')">
                <div class="service-status ${service.status}"></div>
                <div class="service-name" title="${service.name}">${service.name.substring(0, 15)}${service.name.length > 15 ? '...' : ''}</div>
            </div>
        `).join('');
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.widget.classList.toggle('minimized', this.isMinimized);
        document.getElementById('minimize-btn').textContent = this.isMinimized ? '◐' : '◑';
    }

    async fixAllServices() {
        try {
            const response = await fetch(`${this.masterControllerUrl}/api/fix-all`, {
                method: 'POST'
            });
            
            if (response.ok) {
                alert('🔧 Fix All initiated! Check the dashboard for progress.');
                this.loadServiceData();
            }
        } catch (error) {
            alert('❌ Could not initiate fix. Check Master Controller.');
        }
    }

    async restartFailedServices() {
        try {
            const response = await fetch(`${this.masterControllerUrl}/api/restart-failed`, {
                method: 'POST'
            });
            
            if (response.ok) {
                alert('🔄 Restart initiated! Services will restart shortly.');
                setTimeout(() => this.loadServiceData(), 3000);
            }
        } catch (error) {
            alert('❌ Could not restart services. Check Master Controller.');
        }
    }

    makeDraggable() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const header = this.widget.querySelector('.nav-widget-header');

        header.addEventListener('mousedown', (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                this.widget.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        });

        document.addEventListener('mouseup', () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        });
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadServiceData();
        }, 10000); // Refresh every 10 seconds
    }

    injectIntoPage() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(this.widget);
            });
        } else {
            document.body.appendChild(this.widget);
        }
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.widget && this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
        }
    }
}

// Auto-inject if not already present
if (typeof window !== 'undefined' && !window.persistentNavWidget) {
    window.persistentNavWidget = new PersistentNavWidget();
}

// Export for manual injection
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersistentNavWidget;
}
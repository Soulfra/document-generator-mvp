#!/usr/bin/env node

/**
 * Bridge to connect Self-Organizing System with existing Proactive Monitors
 * Integrates with ProactiveLLMMonitor (port 1504) and ProactiveLLMHelper (port 1500)
 */

const http = require('http');
const { EventEmitter } = require('events');

class MonitorBridge extends EventEmitter {
    constructor(selfOrganizingSystem) {
        super();
        this.system = selfOrganizingSystem;
        this.monitors = {
            proactiveLLMMonitor: 'http://localhost:1504',
            proactiveLLMHelper: 'http://localhost:1500'
        };
        this.pollInterval = null;
    }

    async initialize() {
        console.log('🌉 Initializing Bridge to Existing Monitors...');
        
        // Check if monitors are running
        const monitorStatus = await this.checkMonitor(1504);
        const helperStatus = await this.checkMonitor(1500);
        
        if (monitorStatus) {
            console.log('  ✓ ProactiveLLMMonitor detected on port 1504');
        }
        if (helperStatus) {
            console.log('  ✓ ProactiveLLMHelper detected on port 1500');
        }
        
        // Start polling for anomalies
        this.startAnomalyPolling();
        
        // Set up event forwarding
        this.setupEventForwarding();
        
        return this;
    }

    async checkMonitor(port) {
        return new Promise((resolve) => {
            http.get(`http://localhost:${port}/status`, (res) => {
                resolve(res.statusCode === 200);
            }).on('error', () => {
                resolve(false);
            });
        });
    }

    startAnomalyPolling() {
        this.pollInterval = setInterval(async () => {
            try {
                // Check ProactiveLLMMonitor for anomalies
                const anomalies = await this.fetchAnomalies();
                
                if (anomalies && anomalies.length > 0) {
                    console.log('🚨 Anomalies detected from ProactiveLLMMonitor:');
                    
                    for (const anomaly of anomalies) {
                        // Convert anomaly to task for our character system
                        const task = this.anomalyToTask(anomaly);
                        
                        // Route through our system
                        if (this.system.components.router) {
                            await this.system.components.router.routeTask(task);
                        }
                        
                        // Also handle through debug orchestrator
                        if (this.system.components.debugger && anomaly.type === 'error') {
                            await this.system.components.debugger.handleError(
                                new Error(anomaly.message),
                                { source: 'proactive-monitor', anomaly }
                            );
                        }
                    }
                }
                
                // Also check system health
                const health = await this.fetchSystemHealth();
                if (health) {
                    this.emit('monitor:health', health);
                    
                    // Broadcast to dashboard
                    if (this.system.broadcast) {
                        this.system.broadcast({
                            type: 'external:monitor:health',
                            data: health
                        });
                    }
                }
                
            } catch (error) {
                console.error('Bridge polling error:', error);
            }
        }, 10000); // Poll every 10 seconds
    }

    async fetchAnomalies() {
        return new Promise((resolve) => {
            http.get('http://localhost:1504/api/anomalies', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(null);
                    }
                });
            }).on('error', () => resolve(null));
        });
    }

    async fetchSystemHealth() {
        return new Promise((resolve) => {
            http.get('http://localhost:1504/api/health', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(null);
                    }
                });
            }).on('error', () => resolve(null));
        });
    }

    anomalyToTask(anomaly) {
        const taskMap = {
            'excessive_help_rate': {
                type: 'performance-optimization',
                description: 'Reduce help rate to prevent system overload',
                character: 'Ralph', // Ralph handles performance issues
                priority: 8
            },
            'duplicate_fixes': {
                type: 'bug-investigation',
                description: 'Investigate why fixes are being repeated',
                character: 'Cal', // Cal analyzes patterns
                priority: 7
            },
            'impossible_metrics': {
                type: 'data-validation',
                description: 'Validate and correct impossible metric values',
                character: 'Arty', // Arty fixes data harmony
                priority: 6
            }
        };

        const template = taskMap[anomaly.type] || {
            type: 'anomaly-investigation',
            description: `Investigate ${anomaly.type} anomaly`,
            character: 'Cal',
            priority: 5
        };

        return {
            ...template,
            source: 'proactive-monitor',
            anomalyData: anomaly,
            timestamp: new Date().toISOString()
        };
    }

    setupEventForwarding() {
        // Forward events from monitors to our system
        this.on('monitor:anomaly', (data) => {
            if (this.system.broadcast) {
                this.system.broadcast({
                    type: 'monitor:anomaly:detected',
                    data,
                    source: 'proactive-llm-monitor'
                });
            }
        });

        // Forward our system events to monitors
        if (this.system.components) {
            // When our system fixes something, notify the monitor
            this.system.components.debugger?.on('error:resolved', async (data) => {
                await this.notifyMonitor('fix-applied', data);
            });

            // When characters complete tasks, update monitor
            this.system.components.router?.on('task:completed', async (data) => {
                if (data.source === 'proactive-monitor') {
                    await this.notifyMonitor('anomaly-resolved', data);
                }
            });
        }
    }

    async notifyMonitor(event, data) {
        const payload = JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
            source: 'self-organizing-system'
        });

        const options = {
            hostname: 'localhost',
            port: 1504,
            path: '/api/events',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        return new Promise((resolve) => {
            const req = http.request(options, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.write(payload);
            req.end();
        });
    }

    // Add to existing dashboard
    enhanceDashboard() {
        return `
        <!-- Add to dashboard widgets -->
        <div class="widget">
            <div class="widget-header">
                <h3 class="widget-title">
                    <span class="widget-icon">🚨</span>
                    Proactive Monitor Status
                </h3>
            </div>
            <div id="monitor-status">
                <div class="monitor-item">
                    <span>LLM Monitor (1504):</span>
                    <span class="status-indicator" id="monitor-1504">🟢</span>
                </div>
                <div class="monitor-item">
                    <span>LLM Helper (1500):</span>
                    <span class="status-indicator" id="monitor-1500">🟢</span>
                </div>
                <div class="anomaly-list" id="anomaly-list">
                    <h4>Recent Anomalies:</h4>
                    <ul id="anomalies"></ul>
                </div>
            </div>
        </div>`;
    }

    shutdown() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }
}

// Export for integration
module.exports = MonitorBridge;

// Example integration code to add to integrate-self-organizing.js:
/*
const MonitorBridge = require('./bridge-to-monitors');

// In the initialize() method:
this.monitorBridge = new MonitorBridge(this);
await this.monitorBridge.initialize();

// In the shutdown() method:
this.monitorBridge.shutdown();
*/
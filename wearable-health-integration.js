#!/usr/bin/env node

/**
 * WEARABLE HEALTH INTEGRATION
 * Cross-platform health mirroring for watches and fitness trackers
 * Displays health/mana/energy as game stats on wearables
 * NPC proximity alerts and energy management
 */

const crypto = require('crypto');
const http = require('http');

class WearableHealthIntegration {
    constructor() {
        this.port = 9300;
        this.connectedDevices = new Map();
        this.healthMirror = new Map();
        
        // Device-specific configurations
        this.deviceProfiles = {
            'apple_watch': {
                sdk: 'watchOS',
                display: { width: 368, height: 448, color: true },
                update_interval: 30000,
                features: ['haptic', 'crown', 'complications'],
                health_bars: 5,
                notification_style: 'rich'
            },
            'garmin_watch': {
                sdk: 'ConnectIQ',
                display: { width: 240, height: 240, color: true },
                update_interval: 60000,
                features: ['buttons', 'gps'],
                health_bars: 3,
                notification_style: 'simple'
            },
            'fitbit': {
                sdk: 'FitbitOS',
                display: { width: 300, height: 300, color: true },
                update_interval: 120000,
                features: ['heart_rate', 'steps'],
                health_bars: 4,
                notification_style: 'badges'
            },
            'pebble': {
                sdk: 'PebbleSDK',
                display: { width: 144, height: 168, color: false },
                update_interval: 300000,
                features: ['buttons'],
                health_bars: 2,
                notification_style: 'text'
            },
            'samsung_watch': {
                sdk: 'TizenSDK',
                display: { width: 360, height: 360, color: true },
                update_interval: 45000,
                features: ['bezel', 'heart_rate'],
                health_bars: 4,
                notification_style: 'rich'
            }
        };
        
        // Health metric display configurations
        this.healthDisplay = {
            'health': {
                icon: 'heart',
                color: '#ff4757',
                label: 'HP',
                critical_threshold: 25,
                warning_threshold: 50
            },
            'mana': {
                icon: 'brain',
                color: '#3742fa', 
                label: 'MP',
                critical_threshold: 20,
                warning_threshold: 40
            },
            'run_energy': {
                icon: 'bolt',
                color: '#ffa502',
                label: 'EN',
                critical_threshold: 15,
                warning_threshold: 35
            },
            'nutrition': {
                icon: 'apple',
                color: '#2ed573',
                label: 'NU',
                critical_threshold: 30,
                warning_threshold: 60
            },
            'focus': {
                icon: 'target',
                color: '#a55eea',
                label: 'FO',
                critical_threshold: 25,
                warning_threshold: 45
            }
        };
        
        // NPC alert configurations
        this.npcAlerts = {
            'shaman': {
                icon: 'leaf',
                message: 'Wise guide nearby',
                vibration: 'gentle',
                priority: 'medium'
            },
            'doctor': {
                icon: 'medical',
                message: 'Health expert available', 
                vibration: 'strong',
                priority: 'high'
            },
            'cook': {
                icon: 'chef',
                message: 'Nutrition advisor found',
                vibration: 'gentle',
                priority: 'medium'
            },
            'trainer': {
                icon: 'muscle',
                message: 'Fitness coach present',
                vibration: 'pulse',
                priority: 'medium'
            },
            'energy_advisor': {
                icon: 'battery',
                message: 'Energy specialist here',
                vibration: 'gentle',
                priority: 'low'
            }
        };
        
        this.setupServer();
        this.startHealthSync();
        
        console.log('Wearable Health Integration initialized');
    }
    
    // Device connection and management
    connectDevice(deviceId, deviceType, capabilities = {}) {
        const profile = this.deviceProfiles[deviceType];
        if (!profile) {
            console.error(`Unknown device type: ${deviceType}`);
            return false;
        }
        
        const device = {
            id: deviceId,
            type: deviceType,
            profile: profile,
            capabilities: capabilities,
            connected_at: Date.now(),
            last_sync: null,
            health_data: {},
            pending_notifications: [],
            user_preferences: {
                haptic_enabled: true,
                health_bars_visible: true,
                npc_alerts_enabled: true,
                update_frequency: profile.update_interval
            }
        };
        
        this.connectedDevices.set(deviceId, device);
        console.log(`Device connected: ${deviceType} (${deviceId})`);
        
        // Send initial health data
        this.syncDeviceHealth(deviceId);
        
        return true;
    }
    
    disconnectDevice(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (device) {
            console.log(`Device disconnected: ${device.type} (${deviceId})`);
            this.connectedDevices.delete(deviceId);
            return true;
        }
        return false;
    }
    
    // Health data synchronization
    syncDeviceHealth(deviceId, healthData = null) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) return false;
        
        // Get health data from mirror or use provided data
        const health = healthData || this.healthMirror.get(deviceId) || this.getDefaultHealth();
        
        // Format health data for device
        const formattedHealth = this.formatHealthForDevice(health, device);
        
        // Update device health data
        device.health_data = formattedHealth;
        device.last_sync = Date.now();
        
        // Send to device
        this.sendToDevice(deviceId, 'health_update', formattedHealth);
        
        console.log(`Health synced to ${device.type}: ${JSON.stringify(formattedHealth)}`);
        return true;
    }
    
    formatHealthForDevice(health, device) {
        const formatted = {
            bars: [],
            alerts: [],
            complications: {},
            display_text: ''
        };
        
        // Create health bars based on device capability
        const maxBars = device.profile.health_bars;
        const healthMetrics = Object.keys(health).slice(0, maxBars);
        
        healthMetrics.forEach((metric, index) => {
            const config = this.healthDisplay[metric];
            const value = health[metric] || 0;
            
            formatted.bars.push({
                label: config.label,
                value: Math.round(value),
                max: 100,
                color: this.getHealthColor(value, config),
                icon: config.icon,
                critical: value < config.critical_threshold,
                warning: value < config.warning_threshold
            });
        });
        
        // Create complications for supported devices
        if (device.profile.features.includes('complications')) {
            formatted.complications = {
                corner: `HP:${Math.round(health.health || 0)}`,
                top: `MP:${Math.round(health.mana || 0)}`,
                bottom: `EN:${Math.round(health.run_energy || 0)}`
            };
        }
        
        // Create display text for simple devices
        formatted.display_text = healthMetrics
            .map(metric => `${this.healthDisplay[metric].label}:${Math.round(health[metric] || 0)}`)
            .join(' ');
        
        return formatted;
    }
    
    getHealthColor(value, config) {
        if (value < config.critical_threshold) return '#ff4757'; // Red
        if (value < config.warning_threshold) return '#ffa502'; // Orange
        return config.color; // Normal color
    }
    
    // NPC notification system
    sendNPCAlert(deviceId, npcType, distance = null) {
        const device = this.connectedDevices.get(deviceId);
        if (!device || !device.user_preferences.npc_alerts_enabled) return false;
        
        const alertConfig = this.npcAlerts[npcType];
        if (!alertConfig) return false;
        
        const alert = {
            id: crypto.randomUUID(),
            type: 'npc_alert',
            npc_type: npcType,
            message: alertConfig.message,
            distance: distance,
            icon: alertConfig.icon,
            timestamp: Date.now(),
            priority: alertConfig.priority,
            vibration: alertConfig.vibration
        };
        
        // Add to pending notifications
        device.pending_notifications.push(alert);
        
        // Send immediate notification for high priority
        if (alert.priority === 'high') {
            this.sendToDevice(deviceId, 'immediate_alert', alert);
        }
        
        console.log(`NPC alert sent to ${device.type}: ${npcType} at ${distance}m`);
        return true;
    }
    
    // Device-specific implementations
    sendToDevice(deviceId, messageType, data) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) return false;
        
        switch (device.type) {
            case 'apple_watch':
                return this.sendToAppleWatch(device, messageType, data);
            case 'garmin_watch':
                return this.sendToGarmin(device, messageType, data);
            case 'fitbit':
                return this.sendToFitbit(device, messageType, data);
            case 'pebble':
                return this.sendToPebble(device, messageType, data);
            case 'samsung_watch':
                return this.sendToSamsung(device, messageType, data);
            default:
                console.log(`Generic send to ${device.type}:`, data);
                return true;
        }
    }
    
    sendToAppleWatch(device, messageType, data) {
        // Apple Watch implementation
        const watchMessage = {
            type: messageType,
            timestamp: Date.now(),
            device_id: device.id
        };
        
        if (messageType === 'health_update') {
            watchMessage.complications = data.complications;
            watchMessage.health_bars = data.bars;
            
            // Apple Watch specific formatting
            watchMessage.watch_face_data = {
                corner_complication: data.complications.corner,
                modular_large: {
                    header: 'Health Status',
                    body: data.bars.map(bar => `${bar.label}: ${bar.value}%`).join('\n')
                }
            };
        }
        
        if (messageType === 'immediate_alert') {
            watchMessage.haptic_feedback = data.vibration;
            watchMessage.notification = {
                title: 'Character Nearby',
                body: data.message,
                icon: data.icon
            };
        }
        
        console.log(`Apple Watch message:`, watchMessage);
        return true;
    }
    
    sendToGarmin(device, messageType, data) {
        // Garmin Connect IQ implementation
        const garminMessage = {
            type: messageType,
            timestamp: Date.now(),
            device_id: device.id
        };
        
        if (messageType === 'health_update') {
            // Garmin data field format
            garminMessage.data_fields = data.bars.map((bar, index) => ({
                field_id: `health_${index}`,
                label: bar.label,
                value: bar.value,
                units: '%',
                color: bar.critical ? 'red' : bar.warning ? 'orange' : 'green'
            }));
        }
        
        if (messageType === 'immediate_alert') {
            garminMessage.alert = {
                text: data.message,
                tone: data.priority === 'high' ? 'high' : 'medium'
            };
        }
        
        console.log(`Garmin message:`, garminMessage);
        return true;
    }
    
    sendToFitbit(device, messageType, data) {
        // Fitbit OS implementation
        const fitbitMessage = {
            type: messageType,
            timestamp: Date.now(),
            device_id: device.id
        };
        
        if (messageType === 'health_update') {
            fitbitMessage.tiles = data.bars.map(bar => ({
                type: 'progress',
                title: bar.label,
                value: bar.value,
                max: 100,
                color: bar.color
            }));
        }
        
        if (messageType === 'immediate_alert') {
            fitbitMessage.notification = {
                badge: data.icon,
                text: data.message,
                vibration: data.vibration === 'strong'
            };
        }
        
        console.log(`Fitbit message:`, fitbitMessage);
        return true;
    }
    
    sendToPebble(device, messageType, data) {
        // Pebble implementation (text-based)
        const pebbleMessage = {
            type: messageType,
            timestamp: Date.now(),
            device_id: device.id
        };
        
        if (messageType === 'health_update') {
            // Simple text display for Pebble
            pebbleMessage.display_text = data.display_text;
            pebbleMessage.health_summary = data.bars.map(bar => 
                `${bar.label}:${bar.value}${bar.critical ? '!' : bar.warning ? '*' : ''}`
            ).join(' ');
        }
        
        if (messageType === 'immediate_alert') {
            pebbleMessage.alert_text = `${data.message}`;
            pebbleMessage.vibration = true;
        }
        
        console.log(`Pebble message:`, pebbleMessage);
        return true;
    }
    
    sendToSamsung(device, messageType, data) {
        // Samsung Tizen implementation
        const samsungMessage = {
            type: messageType,
            timestamp: Date.now(),
            device_id: device.id
        };
        
        if (messageType === 'health_update') {
            samsungMessage.circular_ui = {
                health_ring: data.bars.map(bar => ({
                    segment: bar.label,
                    progress: bar.value / 100,
                    color: bar.color
                }))
            };
        }
        
        if (messageType === 'immediate_alert') {
            samsungMessage.notification = {
                popup: data.message,
                bezel_vibration: data.vibration === 'strong'
            };
        }
        
        console.log(`Samsung Watch message:`, samsungMessage);
        return true;
    }
    
    // Health monitoring
    startHealthSync() {
        // Sync health data periodically for all connected devices
        setInterval(() => {
            for (const [deviceId, device] of this.connectedDevices.entries()) {
                const timeSinceLastSync = Date.now() - (device.last_sync || 0);
                
                if (timeSinceLastSync >= device.user_preferences.update_frequency) {
                    this.syncDeviceHealth(deviceId);
                }
            }
        }, 10000); // Check every 10 seconds
        
        console.log('Health sync started');
    }
    
    updatePlayerHealth(playerId, healthData) {
        // Update health mirror for player
        this.healthMirror.set(playerId, healthData);
        
        // Sync to all devices for this player
        for (const [deviceId, device] of this.connectedDevices.entries()) {
            if (device.player_id === playerId) {
                this.syncDeviceHealth(deviceId, healthData);
            }
        }
    }
    
    getDefaultHealth() {
        return {
            health: 100,
            mana: 100,
            run_energy: 100,
            nutrition: 100,
            focus: 100
        };
    }
    
    // Device preferences
    updateDevicePreferences(deviceId, preferences) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) return false;
        
        device.user_preferences = {
            ...device.user_preferences,
            ...preferences
        };
        
        console.log(`Preferences updated for ${device.type}`);
        return true;
    }
    
    // HTTP server for integration
    setupServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.url === '/health') {
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    status: 'healthy',
                    connected_devices: this.connectedDevices.size
                }));
            } else if (req.url === '/api/device/connect') {
                this.handleDeviceConnect(req, res);
            } else if (req.url === '/api/health/update') {
                this.handleHealthUpdate(req, res);
            } else if (req.url === '/api/npc/alert') {
                this.handleNPCAlert(req, res);
            } else if (req.url === '/api/devices/list') {
                this.handleDeviceList(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`Wearable Health Integration running on port ${this.port}`);
        });
    }
    
    async handleDeviceConnect(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { deviceId, deviceType, playerId, capabilities } = JSON.parse(body);
            
            const connected = this.connectDevice(deviceId, deviceType, capabilities);
            
            if (connected) {
                const device = this.connectedDevices.get(deviceId);
                device.player_id = playerId;
                
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    success: true,
                    device_profile: device.profile,
                    supported_features: device.profile.features
                }));
            } else {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Failed to connect device' }));
            }
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    async handleHealthUpdate(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { playerId, healthData } = JSON.parse(body);
            
            this.updatePlayerHealth(playerId, healthData);
            
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    async handleNPCAlert(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { deviceId, npcType, distance } = JSON.parse(body);
            
            const sent = this.sendNPCAlert(deviceId, npcType, distance);
            
            res.writeHead(200);
            res.end(JSON.stringify({ success: sent }));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    handleDeviceList(req, res) {
        const devices = Array.from(this.connectedDevices.values()).map(device => ({
            id: device.id,
            type: device.type,
            connected_at: device.connected_at,
            last_sync: device.last_sync,
            health_bars: device.profile.health_bars,
            features: device.profile.features
        }));
        
        res.writeHead(200);
        res.end(JSON.stringify({ devices }));
    }
    
    getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }
}

// Start the wearable integration system
const wearableIntegration = new WearableHealthIntegration();

console.log('Wearable Health Integration ready');
console.log('Supported devices: Apple Watch, Garmin, Fitbit, Pebble, Samsung');
console.log('Health mirroring: HP, MP, Energy, Nutrition, Focus');

module.exports = WearableHealthIntegration;
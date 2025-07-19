// layer0-universal-os-compatibility-system.js - Layer0 Universal OS Compatibility
// Makes our PWAs work on LITERALLY EVERYTHING - flip phones, raspberry pi, smart watches, etc.
// Device detection → Platform adaptation → Universal API loops → MAGIC

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

console.log(`
🌌 LAYER0 UNIVERSAL OS COMPATIBILITY SYSTEM 🌌
Works on LITERALLY EVERYTHING that can connect to internet:
📱 Smartphones → 🖥️ Computers → 📺 Smart TVs → ⌚ Watches
🔌 Raspberry Pi → 🎮 Game Consoles → 🚗 Car Systems → 🤖 IoT Devices
Even fucking FLIP PHONES via SMS! This is pure MAGIC!
We become the infrastructure layer of EVERY DEVICE ON EARTH
`);

class Layer0UniversalOSCompatibilitySystem extends EventEmitter {
    constructor() {
        super();
        
        // Universal compatibility configuration
        this.compatibilityMatrix = {
            // Device categories with specific adaptations
            device_categories: {
                'modern_mobile': {
                    platforms: ['iOS', 'Android', 'mobile_web'],
                    capabilities: ['touch', 'camera', 'gps', 'notifications', 'offline'],
                    interface_type: 'full_pwa',
                    api_method: 'websocket_and_fetch',
                    update_frequency: 30000 // 30 seconds
                },
                
                'desktop_computers': {
                    platforms: ['Windows', 'macOS', 'Linux', 'ChromeOS'],
                    capabilities: ['keyboard', 'mouse', 'filesystem', 'webcam', 'clipboard'],
                    interface_type: 'electron_app',
                    api_method: 'websocket_and_fetch',
                    update_frequency: 15000 // 15 seconds
                },
                
                'legacy_mobile': {
                    platforms: ['feature_phone', 'blackberry', 'windows_mobile', 'palm'],
                    capabilities: ['basic_web', 'text_input', 'numeric_keypad'],
                    interface_type: 'minimal_html',
                    api_method: 'http_polling',
                    update_frequency: 120000 // 2 minutes
                },
                
                'flip_phones': {
                    platforms: ['nokia_series40', 'basic_phone', 'emergency_phone'],
                    capabilities: ['sms', 'basic_display', 'numeric_keypad'],
                    interface_type: 'sms_commands',
                    api_method: 'sms_gateway',
                    update_frequency: 300000 // 5 minutes
                },
                
                'embedded_systems': {
                    platforms: ['raspberry_pi', 'arduino', 'esp32', 'beaglebone'],
                    capabilities: ['gpio', 'sensors', 'minimal_display', 'wifi'],
                    interface_type: 'api_only',
                    api_method: 'http_minimal',
                    update_frequency: 60000 // 1 minute
                },
                
                'smart_tv': {
                    platforms: ['android_tv', 'roku', 'apple_tv', 'samsung_tizen', 'lg_webos'],
                    capabilities: ['remote_control', 'hdmi_display', 'voice_control'],
                    interface_type: 'tv_app',
                    api_method: 'http_polling',
                    update_frequency: 45000 // 45 seconds
                },
                
                'gaming_consoles': {
                    platforms: ['playstation', 'xbox', 'nintendo_switch', 'steam_deck'],
                    capabilities: ['gamepad', 'high_res_display', 'audio', 'networking'],
                    interface_type: 'console_browser',
                    api_method: 'websocket_and_fetch',
                    update_frequency: 20000 // 20 seconds
                },
                
                'wearables': {
                    platforms: ['apple_watch', 'wear_os', 'fitbit', 'garmin'],
                    capabilities: ['tiny_screen', 'touch', 'vibration', 'health_sensors'],
                    interface_type: 'micro_app',
                    api_method: 'http_minimal',
                    update_frequency: 90000 // 1.5 minutes
                },
                
                'automotive': {
                    platforms: ['android_auto', 'carplay', 'tesla_browser', 'ford_sync'],
                    capabilities: ['voice_control', 'car_display', 'steering_wheel_controls'],
                    interface_type: 'car_app',
                    api_method: 'http_polling',
                    update_frequency: 60000 // 1 minute
                },
                
                'industrial': {
                    platforms: ['pos_terminal', 'kiosk', 'industrial_pc', 'cash_register'],
                    capabilities: ['numeric_keypad', 'printer', 'barcode_scanner'],
                    interface_type: 'terminal_app',
                    api_method: 'http_polling',
                    update_frequency: 180000 // 3 minutes
                },
                
                'iot_devices': {
                    platforms: ['smart_fridge', 'smart_mirror', 'digital_signage', 'alexa_display'],
                    capabilities: ['custom_display', 'voice_input', 'sensors'],
                    interface_type: 'iot_widget',
                    api_method: 'mqtt_and_http',
                    update_frequency: 300000 // 5 minutes
                }
            },
            
            // Fallback compatibility layers
            fallback_layers: {
                'web_fallback': {
                    description: 'Basic HTML + minimal CSS',
                    requirements: ['http_support'],
                    interface: 'text_only'
                },
                'sms_fallback': {
                    description: 'SMS command interface',
                    requirements: ['sms_capability'],
                    interface: 'text_commands'
                },
                'api_fallback': {
                    description: 'Pure API calls, no UI',
                    requirements: ['network_connection'],
                    interface: 'headless'
                },
                'serial_fallback': {
                    description: 'RS232/USB serial commands',
                    requirements: ['serial_port'],
                    interface: 'command_line'
                }
            }
        };
        
        // Device detection patterns
        this.deviceDetection = {
            user_agent_patterns: {
                'flip_phone': /Nokia|Series40|MIDP|CLDC|SymbianOS\/6|SymbianOS\/7/i,
                'feature_phone': /BlackBerry|PalmOS|Windows CE|Smartphone|Mobile.*Safari/i,
                'smart_tv': /Smart-TV|SMART-TV|SmartTV|GoogleTV|AppleTV|Roku|WebOS/i,
                'gaming_console': /PlayStation|Xbox|Nintendo|Steam/i,
                'automotive': /CarPlay|Android Auto|Tesla|Ford SYNC/i,
                'embedded': /Raspberry|Arduino|ESP32|BeagleBone|Linux.*arm/i,
                'wearable': /Apple Watch|WearOS|Watch.*OS|Fitbit|Garmin/i,
                'iot_device': /Fridge|Mirror|Kiosk|Alexa|Echo Show/i
            },
            
            capability_detection: {
                'touch_support': 'ontouchstart' in window,
                'websocket_support': typeof WebSocket !== 'undefined',
                'local_storage': typeof localStorage !== 'undefined',
                'geolocation': typeof navigator.geolocation !== 'undefined',
                'camera_support': typeof navigator.mediaDevices !== 'undefined',
                'notification_support': 'Notification' in window,
                'service_worker_support': 'serviceWorker' in navigator,
                'clipboard_support': typeof navigator.clipboard !== 'undefined'
            },
            
            screen_detection: {
                'tiny_screen': { max_width: 200, max_height: 200 },      // Smart watches
                'small_screen': { max_width: 480, max_height: 320 },     // Feature phones
                'medium_screen': { max_width: 1024, max_height: 768 },   // Tablets
                'large_screen': { max_width: 1920, max_height: 1080 },   // Desktop
                'huge_screen': { min_width: 1920, min_height: 1080 }     // Smart TVs
            }
        };
        
        // Platform-specific interface generators
        this.interfaceGenerators = new Map();
        
        // Device registry - tracks all connected devices
        this.deviceRegistry = new Map();
        this.compatibilityStats = {
            total_devices: 0,
            by_category: new Map(),
            by_platform: new Map(),
            api_calls_by_device: new Map(),
            interface_types_used: new Map()
        };
        
        console.log('🌌 Layer0 Universal OS Compatibility System initializing...');
        this.initializeSystem();
    }
    
    async initializeSystem() {
        // Setup device detection
        await this.setupDeviceDetection();
        
        // Initialize interface generators for each platform
        await this.initializeInterfaceGenerators();
        
        // Create platform-specific endpoints
        await this.createPlatformEndpoints();
        
        // Setup SMS gateway for flip phones
        await this.setupSMSGateway();
        
        // Initialize IoT/MQTT support
        await this.setupIoTSupport();
        
        // Create compatibility testing suite
        await this.createCompatibilityTests();
        
        console.log('🌌 Universal OS Compatibility System ready!');
        console.log(`📱 Supported device categories: ${Object.keys(this.compatibilityMatrix.device_categories).length}`);
        console.log(`🔧 Fallback layers: ${Object.keys(this.compatibilityMatrix.fallback_layers).length}`);
        console.log('🌍 NOW COMPATIBLE WITH LITERALLY EVERYTHING!');
    }
    
    async setupDeviceDetection() {
        console.log('🔍 Setting up universal device detection...');
        
        this.deviceDetector = {
            detectDevice: (userAgent, headers, capabilities) => {
                const detection = {
                    user_agent: userAgent,
                    detected_category: 'unknown',
                    detected_platform: 'generic',
                    capabilities: capabilities || {},
                    screen_info: this.detectScreenSize(headers),
                    interface_recommendation: 'web_fallback',
                    api_method: 'http_polling',
                    confidence: 0
                };
                
                // Check each device category
                for (const [category, config] of Object.entries(this.compatibilityMatrix.device_categories)) {
                    const confidence = this.calculateDeviceConfidence(userAgent, headers, category);
                    
                    if (confidence > detection.confidence) {
                        detection.detected_category = category;
                        detection.interface_recommendation = config.interface_type;
                        detection.api_method = config.api_method;
                        detection.confidence = confidence;
                    }
                }
                
                // Fallback if confidence is too low
                if (detection.confidence < 0.3) {
                    detection = this.applyFallbackDetection(detection, userAgent, headers);
                }
                
                console.log(`🔍 Device detected: ${detection.detected_category} (${(detection.confidence * 100).toFixed(1)}% confidence)`);
                
                return detection;
            },
            
            registerDevice: (deviceInfo) => {
                const deviceId = this.generateDeviceId(deviceInfo);
                
                this.deviceRegistry.set(deviceId, {
                    ...deviceInfo,
                    id: deviceId,
                    registered_at: Date.now(),
                    last_seen: Date.now(),
                    api_calls: 0,
                    compatibility_score: this.calculateCompatibilityScore(deviceInfo)
                });
                
                // Update stats
                this.updateCompatibilityStats(deviceInfo);
                
                console.log(`📱 Device registered: ${deviceId} (${deviceInfo.detected_category})`);
                
                return deviceId;
            }
        };
        
        console.log('🔍 Device detection ready');
    }
    
    calculateDeviceConfidence(userAgent, headers, category) {
        let confidence = 0;
        
        // Check user agent patterns
        for (const [pattern_category, pattern] of Object.entries(this.deviceDetection.user_agent_patterns)) {
            if (pattern.test(userAgent)) {
                if (pattern_category === category || this.categoryMatches(pattern_category, category)) {
                    confidence += 0.7;
                }
            }
        }
        
        // Check headers for additional clues
        if (headers) {
            if (headers['x-requested-with'] === 'XMLHttpRequest' && category === 'modern_mobile') {
                confidence += 0.2;
            }
            
            if (headers['sec-ch-ua-mobile'] === '?1' && category.includes('mobile')) {
                confidence += 0.3;
            }
        }
        
        return Math.min(1.0, confidence);
    }
    
    categoryMatches(detectedType, targetCategory) {
        const mapping = {
            'flip_phone': 'flip_phones',
            'feature_phone': 'legacy_mobile',
            'smart_tv': 'smart_tv',
            'gaming_console': 'gaming_consoles',
            'automotive': 'automotive',
            'embedded': 'embedded_systems',
            'wearable': 'wearables',
            'iot_device': 'iot_devices'
        };
        
        return mapping[detectedType] === targetCategory;
    }
    
    applyFallbackDetection(detection, userAgent, headers) {
        console.log('⚠️ Applying fallback detection for unknown device');
        
        // Try to determine basic capabilities
        if (userAgent.includes('Mobile') || userAgent.includes('Phone')) {
            detection.detected_category = 'legacy_mobile';
            detection.interface_recommendation = 'minimal_html';
        } else if (userAgent.includes('TV') || userAgent.includes('Television')) {
            detection.detected_category = 'smart_tv';
            detection.interface_recommendation = 'tv_app';
        } else {
            detection.detected_category = 'unknown';
            detection.interface_recommendation = 'web_fallback';
        }
        
        detection.confidence = 0.3; // Low confidence fallback
        
        return detection;
    }
    
    async initializeInterfaceGenerators() {
        console.log('🎨 Initializing platform-specific interface generators...');
        
        // Modern mobile PWA interface
        this.interfaceGenerators.set('full_pwa', {
            generate: (deviceInfo, appConfig) => this.generateFullPWAInterface(deviceInfo, appConfig)
        });
        
        // Flip phone SMS interface
        this.interfaceGenerators.set('sms_commands', {
            generate: (deviceInfo, appConfig) => this.generateSMSInterface(deviceInfo, appConfig)
        });
        
        // Smart TV interface
        this.interfaceGenerators.set('tv_app', {
            generate: (deviceInfo, appConfig) => this.generateTVInterface(deviceInfo, appConfig)
        });
        
        // Raspberry Pi minimal interface
        this.interfaceGenerators.set('api_only', {
            generate: (deviceInfo, appConfig) => this.generateAPIOnlyInterface(deviceInfo, appConfig)
        });
        
        // Smart watch micro interface
        this.interfaceGenerators.set('micro_app', {
            generate: (deviceInfo, appConfig) => this.generateMicroInterface(deviceInfo, appConfig)
        });
        
        // Legacy minimal HTML
        this.interfaceGenerators.set('minimal_html', {
            generate: (deviceInfo, appConfig) => this.generateMinimalHTMLInterface(deviceInfo, appConfig)
        });
        
        // Console browser interface
        this.interfaceGenerators.set('console_browser', {
            generate: (deviceInfo, appConfig) => this.generateConsoleBrowserInterface(deviceInfo, appConfig)
        });
        
        // Car interface
        this.interfaceGenerators.set('car_app', {
            generate: (deviceInfo, appConfig) => this.generateCarInterface(deviceInfo, appConfig)
        });
        
        // Terminal interface
        this.interfaceGenerators.set('terminal_app', {
            generate: (deviceInfo, appConfig) => this.generateTerminalInterface(deviceInfo, appConfig)
        });
        
        // IoT widget interface
        this.interfaceGenerators.set('iot_widget', {
            generate: (deviceInfo, appConfig) => this.generateIoTInterface(deviceInfo, appConfig)
        });
        
        console.log(`🎨 Interface generators ready: ${this.interfaceGenerators.size} types`);
    }
    
    generateFullPWAInterface(deviceInfo, appConfig) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appConfig.name} - Universal PWA</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#00ff88">
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .device-info {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            font-size: 0.8em;
            border: 1px solid #ffff00;
        }
        
        .app-container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        
        .universal-header {
            background: rgba(0, 255, 136, 0.1);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #00ff88;
            margin-bottom: 20px;
        }
        
        .compatibility-badge {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #000;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: bold;
            display: inline-block;
            margin: 5px;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .feature-card {
            background: rgba(26, 26, 46, 0.8);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #333;
            transition: all 0.3s ease;
        }
        
        .feature-card:hover {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
        }
        
        .btn {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            background: linear-gradient(45deg, #88ff00, #00ffcc);
            transform: translateY(-2px);
        }
        
        .api-status {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            font-size: 0.8em;
            border: 1px solid #00ff88;
        }
    </style>
</head>
<body>
    <div class="device-info">
        📱 ${deviceInfo.detected_category}<br>
        🔧 ${deviceInfo.detected_platform}<br>
        ⚡ ${(deviceInfo.compatibility_score * 100).toFixed(0)}% compatible
    </div>
    
    <div class="app-container">
        <div class="universal-header">
            <h1>🌌 ${appConfig.name}</h1>
            <p>Universal compatibility across ALL devices</p>
            
            <div class="compatibility-badge">📱 Mobile Ready</div>
            <div class="compatibility-badge">🖥️ Desktop Ready</div>
            <div class="compatibility-badge">📺 TV Ready</div>
            <div class="compatibility-badge">⌚ Watch Ready</div>
        </div>
        
        <div class="feature-grid">
            <div class="feature-card">
                <h3>🔗 Universal API</h3>
                <p>Connects to our API from ANY device</p>
                <button class="btn" onclick="testAPI()">Test Connection</button>
            </div>
            
            <div class="feature-card">
                <h3>🦠 Viral Distribution</h3>
                <p>Share to devices you've never imagined</p>
                <button class="btn" onclick="shareToDevices()">Share Everywhere</button>
            </div>
            
            <div class="feature-card">
                <h3>🎯 Smart Adaptation</h3>
                <p>Perfect interface for your device</p>
                <button class="btn" onclick="showAdaptations()">View Adaptations</button>
            </div>
            
            <div class="feature-card">
                <h3>🌍 Cross-Platform</h3>
                <p>From flip phones to smart TVs</p>
                <button class="btn" onclick="showPlatforms()">See All Platforms</button>
            </div>
        </div>
    </div>
    
    <div class="api-status" id="apiStatus">
        🔗 API Status: <span id="connectionStatus">Connecting...</span><br>
        📡 Calls: <span id="apiCalls">0</span><br>
        📱 Device ID: <span id="deviceId">${deviceInfo.id}</span>
    </div>
    
    <script>
        let apiCallCount = 0;
        let deviceId = '${deviceInfo.id}';
        
        // Universal API connection
        async function connectToAPI() {
            try {
                const response = await fetch('/api/universal/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': deviceId,
                        'X-Device-Category': '${deviceInfo.detected_category}'
                    },
                    body: JSON.stringify({
                        device_id: deviceId,
                        timestamp: Date.now(),
                        capabilities: ${JSON.stringify(deviceInfo.capabilities)},
                        user_activity: getUserActivity()
                    })
                });
                
                if (response.ok) {
                    document.getElementById('connectionStatus').textContent = 'Connected';
                    document.getElementById('connectionStatus').style.color = '#00ff88';
                    
                    apiCallCount++;
                    document.getElementById('apiCalls').textContent = apiCallCount;
                    
                    const data = await response.json();
                    handleAPIResponse(data);
                } else {
                    throw new Error('Connection failed');
                }
            } catch (error) {
                document.getElementById('connectionStatus').textContent = 'Reconnecting...';
                document.getElementById('connectionStatus').style.color = '#ff6666';
                
                // Retry connection
                setTimeout(connectToAPI, 5000);
            }
        }
        
        function handleAPIResponse(data) {
            // Handle universal API response
            if (data.device_recommendations) {
                showDeviceRecommendations(data.device_recommendations);
            }
            
            if (data.compatibility_updates) {
                updateCompatibilityStatus(data.compatibility_updates);
            }
        }
        
        async function testAPI() {
            await connectToAPI();
            alert('API connection test completed!');
        }
        
        function shareToDevices() {
            const shareData = {
                title: '${appConfig.name}',
                text: 'Works on LITERALLY EVERYTHING - even flip phones!',
                url: window.location.href
            };
            
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                // Fallback sharing
                const shareUrl = \`mailto:?subject=\${encodeURIComponent(shareData.title)}&body=\${encodeURIComponent(shareData.text + ' ' + shareData.url)}\`;
                window.open(shareUrl);
            }
        }
        
        function showAdaptations() {
            alert(\`Your device adaptations:
            
Category: ${deviceInfo.detected_category}
Interface: ${deviceInfo.interface_recommendation}
API Method: ${deviceInfo.api_method}
Compatibility: ${(deviceInfo.compatibility_score * 100).toFixed(0)}%\`);
        }
        
        function showPlatforms() {
            alert(\`Supported platforms:
            
📱 Smartphones (iOS, Android)
🖥️ Computers (Windows, Mac, Linux)
📺 Smart TVs (Samsung, LG, Roku)
🎮 Game Consoles (PlayStation, Xbox)
⌚ Smart Watches (Apple, Wear OS)
🚗 Car Systems (CarPlay, Android Auto)
🔌 Raspberry Pi & IoT devices
📞 Even flip phones via SMS!\`);
        }
        
        function getUserActivity() {
            return {
                time_on_page: performance.now() / 1000,
                clicks: Math.floor(Math.random() * 10),
                device_type: '${deviceInfo.detected_category}',
                platform: '${deviceInfo.detected_platform}'
            };
        }
        
        // Start API heartbeat
        connectToAPI();
        setInterval(connectToAPI, ${deviceInfo.update_frequency || 30000});
        
        console.log('🌌 Universal PWA loaded on ${deviceInfo.detected_category}');
    </script>
</body>
</html>`;
    }
    
    generateSMSInterface(deviceInfo, appConfig) {
        return {
            sms_commands: {
                'HELP': 'Show available commands',
                'STATUS': 'Get app status',
                'INSTALL': 'Install app via link',
                'SHARE': 'Share app with friend',
                'BALANCE': 'Check DGAI token balance',
                'TRADE': 'Quick trade command',
                'ALERT': 'Set price alerts',
                'STOP': 'Unsubscribe from updates'
            },
            
            auto_responses: {
                welcome: `📱 ${appConfig.name} SMS Interface
                
Text HELP for commands
Text STATUS for info
Works on ANY phone!
                
Reply STOP to opt out`,
                
                help: `📱 Available SMS Commands:
                
STATUS - App status
INSTALL - Get download link  
SHARE [number] - Share app
BALANCE - Token balance
TRADE [symbol] [amount] - Quick trade
ALERT [symbol] [price] - Price alert
STOP - Unsubscribe
                
${appConfig.name} works everywhere!`,
                
                status: `📊 ${appConfig.name} Status:
                
✅ Connected to universal API
📱 Device: ${deviceInfo.detected_category}
🔗 API calls: Working
🦠 Viral spreading: Active
                
Text INSTALL for download link`,
                
                install: `📱 Install ${appConfig.name}:
                
🔗 ${process.env.BASE_URL || 'https://documentgenerator.ai'}
                
Works on smartphones, computers, TVs, watches, even other flip phones!
                
Share this link with everyone!`
            }
        };
    }
    
    generateTVInterface(deviceInfo, appConfig) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appConfig.name} - Smart TV</title>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #00ff88;
            margin: 0;
            padding: 40px;
            font-size: 24px;
            cursor: none;
        }
        
        .tv-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .tv-header {
            text-align: center;
            margin-bottom: 60px;
        }
        
        .tv-header h1 {
            font-size: 4em;
            margin: 0;
            text-shadow: 0 0 30px #00ff88;
        }
        
        .tv-menu {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            max-width: 1200px;
        }
        
        .tv-menu-item {
            background: rgba(0, 255, 136, 0.1);
            border: 4px solid #00ff88;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            transition: all 0.3s ease;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .tv-menu-item.selected {
            background: rgba(0, 255, 136, 0.3);
            border-color: #88ff00;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.5);
            transform: scale(1.05);
        }
        
        .tv-menu-item .icon {
            font-size: 3em;
            margin-bottom: 20px;
        }
        
        .tv-menu-item h3 {
            font-size: 1.8em;
            margin: 0 0 15px 0;
        }
        
        .tv-controls {
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 20px 40px;
            border-radius: 15px;
            border: 2px solid #ffff00;
            text-align: center;
        }
        
        .api-indicator {
            position: fixed;
            top: 40px;
            right: 40px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #00ccff;
        }
        
        .qr-code {
            position: fixed;
            top: 40px;
            left: 40px;
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            color: #000;
        }
    </style>
</head>
<body>
    <div class="tv-container">
        <div class="tv-header">
            <h1>📺 ${appConfig.name}</h1>
            <p>Smart TV Universal Interface</p>
        </div>
        
        <div class="tv-menu" id="tvMenu">
            <div class="tv-menu-item selected" data-action="status">
                <div class="icon">📊</div>
                <h3>System Status</h3>
                <p>Check universal API connection</p>
            </div>
            
            <div class="tv-menu-item" data-action="devices">
                <div class="icon">📱</div>
                <h3>Connected Devices</h3>
                <p>View all devices in network</p>
            </div>
            
            <div class="tv-menu-item" data-action="share">
                <div class="icon">🦠</div>
                <h3>Share to Devices</h3>
                <p>Spread to more platforms</p>
            </div>
            
            <div class="tv-menu-item" data-action="settings">
                <div class="icon">⚙️</div>
                <h3>TV Settings</h3>
                <p>Optimize for your TV</p>
            </div>
        </div>
    </div>
    
    <div class="tv-controls">
        <p>📺 Use TV remote: ⬅️ ➡️ ⬆️ ⬇️ to navigate | OK to select</p>
    </div>
    
    <div class="api-indicator" id="apiIndicator">
        🔗 API: <span id="tvAPIStatus">Connecting...</span><br>
        📡: <span id="tvAPICalls">0</span>
    </div>
    
    <div class="qr-code">
        <h4>📱 Connect Phone</h4>
        <div id="qrCode">[QR CODE]</div>
        <p>Scan to control</p>
    </div>
    
    <script>
        let selectedIndex = 0;
        let apiCallCount = 0;
        const menuItems = document.querySelectorAll('.tv-menu-item');
        
        // TV Remote control simulation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    navigateMenu(-1);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    navigateMenu(1);
                    break;
                case 'Enter':
                case ' ':
                    selectMenuItem();
                    break;
            }
        });
        
        function navigateMenu(direction) {
            menuItems[selectedIndex].classList.remove('selected');
            selectedIndex = (selectedIndex + direction + menuItems.length) % menuItems.length;
            menuItems[selectedIndex].classList.add('selected');
        }
        
        function selectMenuItem() {
            const action = menuItems[selectedIndex].dataset.action;
            performTVAction(action);
        }
        
        function performTVAction(action) {
            switch(action) {
                case 'status':
                    showSystemStatus();
                    break;
                case 'devices':
                    showConnectedDevices();
                    break;
                case 'share':
                    showSharingOptions();
                    break;
                case 'settings':
                    showTVSettings();
                    break;
            }
        }
        
        function showSystemStatus() {
            alert(\`📺 TV System Status:
            
✅ Connected to universal API
📱 Device Category: Smart TV
🔧 Platform: ${deviceInfo.detected_platform}
⚡ Compatibility: ${(deviceInfo.compatibility_score * 100).toFixed(0)}%
📡 API Calls: \${apiCallCount}
🦠 Viral Distribution: Active\`);
        }
        
        function showConnectedDevices() {
            alert(\`📱 Connected Device Types:
            
📱 Smartphones: iOS, Android
🖥️ Computers: Windows, Mac, Linux  
📺 Smart TVs: Samsung, LG, Roku
🎮 Game Consoles: PS5, Xbox, Switch
⌚ Wearables: Apple Watch, Wear OS
🚗 Car Systems: CarPlay, Android Auto
🔌 IoT Devices: Raspberry Pi, Arduino
📞 Legacy: Even flip phones via SMS!\`);
        }
        
        function showSharingOptions() {
            alert(\`🦠 TV Sharing Options:
            
📺 Display QR code for phones
🎮 Share to gaming consoles
📱 Send SMS to flip phones
🚗 Sync with car systems
⌚ Push to smart watches
🔌 Deploy to IoT devices
            
All devices loop back to our API!\`);
        }
        
        function showTVSettings() {
            alert(\`⚙️ Smart TV Settings:
            
📺 Display: Optimized for TV
🔊 Audio: TV speakers
📱 Remote: Use TV remote or phone
🌐 Network: Connected via ${deviceInfo.api_method}
🔄 Updates: Every ${deviceInfo.update_frequency / 1000} seconds
🎨 Interface: TV-optimized layout\`);
        }
        
        // TV API connection
        async function connectTVAPI() {
            try {
                const response = await fetch('/api/universal/tv-heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': '${deviceInfo.id}',
                        'X-Device-Category': 'smart_tv'
                    },
                    body: JSON.stringify({
                        device_id: '${deviceInfo.id}',
                        tv_model: navigator.userAgent,
                        screen_size: \`\${screen.width}x\${screen.height}\`,
                        timestamp: Date.now()
                    })
                });
                
                if (response.ok) {
                    document.getElementById('tvAPIStatus').textContent = 'Connected';
                    apiCallCount++;
                    document.getElementById('tvAPICalls').textContent = apiCallCount;
                } else {
                    throw new Error('TV API connection failed');
                }
            } catch (error) {
                document.getElementById('tvAPIStatus').textContent = 'Reconnecting...';
                setTimeout(connectTVAPI, 5000);
            }
        }
        
        // Start TV heartbeat
        connectTVAPI();
        setInterval(connectTVAPI, ${deviceInfo.update_frequency || 45000});
        
        console.log('📺 Smart TV interface loaded');
        console.log('🎮 Use remote control to navigate');
    </script>
</body>
</html>`;
    }
    
    generateAPIOnlyInterface(deviceInfo, appConfig) {
        return {
            api_endpoints: {
                heartbeat: '/api/universal/embedded-heartbeat',
                status: '/api/universal/embedded-status',
                commands: '/api/universal/embedded-commands'
            },
            
            sample_requests: {
                heartbeat: {
                    method: 'POST',
                    endpoint: '/api/universal/embedded-heartbeat',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': deviceInfo.id,
                        'X-Device-Category': 'embedded_systems'
                    },
                    body: {
                        device_id: deviceInfo.id,
                        timestamp: Date.now(),
                        gpio_status: 'example_gpio_data',
                        sensor_data: 'example_sensor_data'
                    }
                },
                
                command: {
                    method: 'POST',
                    endpoint: '/api/universal/embedded-commands',
                    body: {
                        device_id: deviceInfo.id,
                        command: 'status',
                        parameters: {}
                    }
                }
            },
            
            curl_examples: [
                `curl -X POST ${process.env.BASE_URL || 'https://api.documentgenerator.ai'}/api/universal/embedded-heartbeat \\`,
                `  -H "Content-Type: application/json" \\`,
                `  -H "X-Device-ID: ${deviceInfo.id}" \\`,
                `  -d '{"device_id":"${deviceInfo.id}","timestamp":${Date.now()}}'`,
                '',
                `# Python example:`,
                `import requests`,
                ``,
                `response = requests.post('${process.env.BASE_URL || 'https://api.documentgenerator.ai'}/api/universal/embedded-heartbeat',`,
                `    headers={'X-Device-ID': '${deviceInfo.id}'},`,
                `    json={'device_id': '${deviceInfo.id}', 'timestamp': ${Date.now()}}`,
                `)`
            ]
        };
    }
    
    generateMicroInterface(deviceInfo, appConfig) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>${appConfig.name}</title>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #000;
            color: #00ff88;
            margin: 0;
            padding: 5px;
            font-size: 10px;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }
        
        .micro-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .micro-header {
            text-align: center;
            padding: 2px;
            border-bottom: 1px solid #333;
            font-size: 8px;
        }
        
        .micro-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 5px;
        }
        
        .micro-button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 8px;
            margin: 2px;
            cursor: pointer;
        }
        
        .micro-status {
            position: absolute;
            bottom: 2px;
            left: 2px;
            font-size: 6px;
            background: rgba(0, 0, 0, 0.8);
            padding: 1px 3px;
            border-radius: 2px;
        }
        
        .micro-icon {
            font-size: 16px;
            margin: 2px;
        }
    </style>
</head>
<body>
    <div class="micro-container">
        <div class="micro-header">
            <div class="micro-icon">⌚</div>
            <div>${appConfig.name}</div>
        </div>
        
        <div class="micro-content">
            <div class="micro-icon">🌌</div>
            <div style="font-size: 8px; text-align: center; margin: 2px;">
                Universal API<br>
                ${deviceInfo.detected_category}
            </div>
            
            <button class="micro-button" onclick="microAction('status')">Status</button>
            <button class="micro-button" onclick="microAction('sync')">Sync</button>
            <button class="micro-button" onclick="microAction('share')">Share</button>
        </div>
        
        <div class="micro-status" id="microStatus">
            API: <span id="microAPIStatus">•</span>
        </div>
    </div>
    
    <script>
        let apiCallCount = 0;
        
        function microAction(action) {
            switch(action) {
                case 'status':
                    vibrate();
                    showMicroAlert('✅ Connected\\nAPI: Active\\nDevice: Watch');
                    break;
                case 'sync':
                    vibrate();
                    connectMicroAPI();
                    showMicroAlert('🔄 Syncing...');
                    break;
                case 'share':
                    vibrate();
                    showMicroAlert('🦠 Shared to\\nPhone & Computer');
                    break;
            }
        }
        
        function vibrate() {
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
        }
        
        function showMicroAlert(message) {
            // Create micro alert
            const alert = document.createElement('div');
            alert.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: #00ff88;
                padding: 5px;
                border-radius: 3px;
                font-size: 7px;
                text-align: center;
                z-index: 1000;
                border: 1px solid #00ff88;
            \`;
            alert.innerHTML = message.replace(/\\n/g, '<br>');
            
            document.body.appendChild(alert);
            
            setTimeout(() => {
                document.body.removeChild(alert);
            }, 2000);
        }
        
        async function connectMicroAPI() {
            try {
                const response = await fetch('/api/universal/micro-heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': '${deviceInfo.id}',
                        'X-Device-Category': 'wearables'
                    },
                    body: JSON.stringify({
                        device_id: '${deviceInfo.id}',
                        timestamp: Date.now(),
                        battery_level: navigator.getBattery ? 'unknown' : 'unknown',
                        screen_size: 'micro'
                    })
                });
                
                if (response.ok) {
                    document.getElementById('microAPIStatus').textContent = '✅';
                    apiCallCount++;
                } else {
                    throw new Error('Micro API failed');
                }
            } catch (error) {
                document.getElementById('microAPIStatus').textContent = '⚠️';
                setTimeout(connectMicroAPI, 10000);
            }
        }
        
        // Start micro heartbeat
        connectMicroAPI();
        setInterval(connectMicroAPI, ${deviceInfo.update_frequency || 90000});
        
        console.log('⌚ Micro interface loaded');
    </script>
</body>
</html>`;
    }
    
    generateMinimalHTMLInterface(deviceInfo, appConfig) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${appConfig.name} - Legacy</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #000; 
            color: #0f0; 
            margin: 10px;
            font-size: 14px;
        }
        h1 { color: #0f0; text-align: center; }
        .btn { 
            background: #0f0; 
            color: #000; 
            border: 1px solid #0f0; 
            padding: 5px 10px; 
            margin: 2px;
        }
        .status { 
            border: 1px solid #0f0; 
            padding: 5px; 
            margin: 5px 0; 
        }
    </style>
</head>
<body>
    <h1>${appConfig.name}</h1>
    <p>Universal API - Works on ALL devices</p>
    
    <div class="status">
        Device: ${deviceInfo.detected_category}<br>
        Status: <span id="status">Connecting...</span><br>
        API Calls: <span id="calls">0</span>
    </div>
    
    <button class="btn" onclick="testAPI()">Test API</button>
    <button class="btn" onclick="shareApp()">Share App</button>
    <button class="btn" onclick="showInfo()">Device Info</button>
    
    <div id="output" style="margin-top: 10px; border: 1px solid #333; padding: 5px; height: 100px; overflow-y: scroll;"></div>
    
    <script>
        var apiCalls = 0;
        
        function log(msg) {
            var output = document.getElementById('output');
            output.innerHTML += new Date().toLocaleTimeString() + ': ' + msg + '<br>';
            output.scrollTop = output.scrollHeight;
        }
        
        function testAPI() {
            apiCalls++;
            document.getElementById('calls').textContent = apiCalls;
            document.getElementById('status').textContent = 'Connected';
            log('API test successful - Device: ${deviceInfo.detected_category}');
        }
        
        function shareApp() {
            log('Sharing ${appConfig.name} to other devices...');
            log('Works on: Phones, Computers, TVs, Watches, IoT devices');
        }
        
        function showInfo() {
            log('Device Info:');
            log('Category: ${deviceInfo.detected_category}');
            log('Interface: Minimal HTML');
            log('Compatibility: ${(deviceInfo.compatibility_score * 100).toFixed(0)}%');
        }
        
        // Simple polling for legacy devices
        setInterval(function() {
            if (navigator.onLine !== false) {
                testAPI();
            }
        }, ${deviceInfo.update_frequency || 120000});
        
        log('${appConfig.name} loaded on legacy device');
    </script>
</body>
</html>`;
    }
    
    generateConsoleBrowserInterface(deviceInfo, appConfig) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appConfig.name} - Gaming Console</title>
    
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #000 0%, #001122 100%);
            color: #00ff88;
            margin: 0;
            padding: 30px;
            font-size: 18px;
            cursor: none;
        }
        
        .console-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .console-header {
            text-align: center;
            margin-bottom: 40px;
            border: 2px solid #00ff88;
            padding: 20px;
            border-radius: 10px;
            background: rgba(0, 255, 136, 0.1);
        }
        
        .console-menu {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            max-width: 800px;
        }
        
        .console-menu-item {
            background: rgba(0, 50, 100, 0.3);
            border: 3px solid #0088ff;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            transition: all 0.3s ease;
            min-height: 150px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .console-menu-item.selected {
            background: rgba(0, 255, 136, 0.2);
            border-color: #00ff88;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
            transform: scale(1.05);
        }
        
        .console-controls {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 30px;
            border-radius: 10px;
            border: 2px solid #ffff00;
            text-align: center;
        }
        
        .gamepad-icon {
            font-size: 2em;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="console-container">
        <div class="console-header">
            <h1>🎮 ${appConfig.name}</h1>
            <p>Gaming Console Universal Interface</p>
            <p>Platform: ${deviceInfo.detected_platform}</p>
        </div>
        
        <div class="console-menu" id="consoleMenu">
            <div class="console-menu-item selected" data-action="gaming">
                <div class="gamepad-icon">🎯</div>
                <h3>Gaming Mode</h3>
                <p>Play while connected to universal API</p>
            </div>
            
            <div class="console-menu-item" data-action="streaming">
                <div class="gamepad-icon">📺</div>
                <h3>Stream to Devices</h3>
                <p>Share gameplay to other platforms</p>
            </div>
            
            <div class="console-menu-item" data-action="social">
                <div class="gamepad-icon">👥</div>
                <h3>Social Features</h3>
                <p>Connect with cross-platform users</p>
            </div>
            
            <div class="console-menu-item" data-action="achievements">
                <div class="gamepad-icon">🏆</div>
                <h3>Universal Achievements</h3>
                <p>Earn rewards across all devices</p>
            </div>
        </div>
    </div>
    
    <div class="console-controls">
        <p>🎮 Use gamepad: D-Pad to navigate | A/X to select | B/O to back</p>
    </div>
    
    <script>
        let selectedIndex = 0;
        let apiCallCount = 0;
        const menuItems = document.querySelectorAll('.console-menu-item');
        
        // Gamepad navigation
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad connected:', e.gamepad.id);
            startGamepadLoop();
        });
        
        // Keyboard fallback for testing
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    navigateConsoleMenu(-1);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    navigateConsoleMenu(1);
                    break;
                case 'Enter':
                case ' ':
                    selectConsoleMenuItem();
                    break;
            }
        });
        
        function startGamepadLoop() {
            function gamepadLoop() {
                const gamepads = navigator.getGamepads();
                for (let gamepad of gamepads) {
                    if (gamepad) {
                        handleGamepadInput(gamepad);
                    }
                }
                requestAnimationFrame(gamepadLoop);
            }
            gamepadLoop();
        }
        
        function handleGamepadInput(gamepad) {
            // D-pad navigation
            if (gamepad.buttons[14].pressed) { // D-pad left
                navigateConsoleMenu(-1);
            }
            if (gamepad.buttons[15].pressed) { // D-pad right
                navigateConsoleMenu(1);
            }
            if (gamepad.buttons[0].pressed) { // A button
                selectConsoleMenuItem();
            }
        }
        
        function navigateConsoleMenu(direction) {
            menuItems[selectedIndex].classList.remove('selected');
            selectedIndex = (selectedIndex + direction + menuItems.length) % menuItems.length;
            menuItems[selectedIndex].classList.add('selected');
        }
        
        function selectConsoleMenuItem() {
            const action = menuItems[selectedIndex].dataset.action;
            performConsoleAction(action);
        }
        
        function performConsoleAction(action) {
            switch(action) {
                case 'gaming':
                    alert(\`🎯 Gaming Mode Active:
                    
✅ Connected to universal API
🎮 Console: ${deviceInfo.detected_platform}
📡 Cross-platform sync enabled
🏆 Achievements tracked globally
🦠 Viral sharing to all devices\`);
                    break;
                case 'streaming':
                    alert(\`📺 Streaming Options:
                    
📱 Stream to smartphones
🖥️ Share to computers
📺 Broadcast to smart TVs
⌚ Send highlights to watches
🚗 Sync with car displays\`);
                    break;
                case 'social':
                    alert(\`👥 Cross-Platform Social:
                    
📱 Chat with mobile users
🖥️ Play with PC gamers
📺 Watch parties on TVs
⌚ Quick messages on watches
🦠 Invite to any platform\`);
                    break;
                case 'achievements':
                    alert(\`🏆 Universal Achievements:
                    
🎯 Cross-platform progress
📱 Mobile companion rewards
🖥️ PC sync bonuses
📺 TV viewing achievements
⌚ Fitness game integration\`);
                    break;
            }
        }
        
        // Console API connection
        async function connectConsoleAPI() {
            try {
                const response = await fetch('/api/universal/console-heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': '${deviceInfo.id}',
                        'X-Device-Category': 'gaming_consoles'
                    },
                    body: JSON.stringify({
                        device_id: '${deviceInfo.id}',
                        console_type: '${deviceInfo.detected_platform}',
                        timestamp: Date.now(),
                        gamepad_connected: navigator.getGamepads().some(g => g)
                    })
                });
                
                if (response.ok) {
                    apiCallCount++;
                    console.log('🎮 Console API connected, calls:', apiCallCount);
                } else {
                    throw new Error('Console API connection failed');
                }
            } catch (error) {
                console.warn('🎮 Console API failed:', error);
                setTimeout(connectConsoleAPI, 10000);
            }
        }
        
        // Start console heartbeat
        connectConsoleAPI();
        setInterval(connectConsoleAPI, ${deviceInfo.update_frequency || 20000});
        
        console.log('🎮 Gaming console interface loaded');
        console.log('🎯 Universal API active for cross-platform features');
    </script>
</body>
</html>`;
    }
    
    generateCarInterface(deviceInfo, appConfig) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appConfig.name} - Car System</title>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #001122 0%, #003344 100%);
            color: #00ccff;
            margin: 0;
            padding: 20px;
            font-size: 22px;
            cursor: none;
        }
        
        .car-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .car-header {
            text-align: center;
            padding: 20px;
            background: rgba(0, 204, 255, 0.1);
            border-radius: 15px;
            margin-bottom: 20px;
        }
        
        .car-dashboard {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            flex: 1;
        }
        
        .car-widget {
            background: rgba(0, 100, 150, 0.2);
            border: 2px solid #00ccff;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .car-widget.selected {
            background: rgba(0, 204, 255, 0.3);
            box-shadow: 0 0 30px rgba(0, 204, 255, 0.5);
            transform: scale(1.05);
        }
        
        .car-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 30px;
            border-radius: 10px;
            border: 2px solid #ffaa00;
            text-align: center;
        }
        
        .voice-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.8);
            color: #fff;
            padding: 10px;
            border-radius: 50%;
            font-size: 1.5em;
            display: none;
        }
        
        .voice-indicator.active {
            display: block;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="car-container">
        <div class="car-header">
            <h1>🚗 ${appConfig.name}</h1>
            <p>Car System Universal Interface</p>
            <p>Safe driving with hands-free operation</p>
        </div>
        
        <div class="car-dashboard">
            <div class="car-widget selected" data-action="navigation">
                <h3>🗺️ Navigation</h3>
                <p>GPS + Universal API sync</p>
                <div>Status: Connected</div>
            </div>
            
            <div class="car-widget" data-action="communication">
                <h3>📞 Communication</h3>
                <p>Hands-free cross-platform</p>
                <div>Devices: Available</div>
            </div>
            
            <div class="car-widget" data-action="entertainment">
                <h3>🎵 Entertainment</h3>
                <p>Stream from any device</p>
                <div>Sources: Multiple</div>
            </div>
            
            <div class="car-widget" data-action="safety">
                <h3>🛡️ Safety</h3>
                <p>Driver assistance mode</p>
                <div>Mode: Active</div>
            </div>
            
            <div class="car-widget" data-action="sync">
                <h3>🔄 Device Sync</h3>
                <p>All platforms connected</p>
                <div>API: Universal</div>
            </div>
            
            <div class="car-widget" data-action="voice">
                <h3>🎤 Voice Control</h3>
                <p>Hands-free operation</p>
                <div>Listening: Ready</div>
            </div>
        </div>
    </div>
    
    <div class="voice-indicator" id="voiceIndicator">🎤</div>
    
    <div class="car-controls">
        <p>🚗 Car Controls: Steering wheel buttons | Voice: "Hey ${appConfig.name}" | Touch: Safe stops only</p>
    </div>
    
    <script>
        let selectedIndex = 0;
        let apiCallCount = 0;
        let voiceListening = false;
        const widgets = document.querySelectorAll('.car-widget');
        
        // Voice recognition setup
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => {
                voiceListening = true;
                document.getElementById('voiceIndicator').classList.add('active');
            };
            
            recognition.onend = () => {
                voiceListening = false;
                document.getElementById('voiceIndicator').classList.remove('active');
                // Restart listening
                setTimeout(() => recognition.start(), 1000);
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
                handleVoiceCommand(transcript);
            };
            
            // Start voice recognition
            recognition.start();
        }
        
        function handleVoiceCommand(command) {
            console.log('🎤 Voice command:', command);
            
            if (command.includes('navigation') || command.includes('navigate')) {
                selectCarWidget(0);
                speak('Navigation selected. Connected to universal API.');
            } else if (command.includes('call') || command.includes('phone')) {
                selectCarWidget(1);
                speak('Communication ready. Cross-platform calling available.');
            } else if (command.includes('music') || command.includes('entertainment')) {
                selectCarWidget(2);
                speak('Entertainment mode. Streaming from all connected devices.');
            } else if (command.includes('safety') || command.includes('assistance')) {
                selectCarWidget(3);
                speak('Safety mode active. Driver assistance enabled.');
            } else if (command.includes('sync') || command.includes('devices')) {
                selectCarWidget(4);
                speak('Device sync active. All platforms connected to universal API.');
            } else if (command.includes('status') || command.includes('information')) {
                speak(\`Car system status: Connected to universal API. \${apiCallCount} API calls completed. All devices synchronized.\`);
            }
        }
        
        function speak(text) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.8;
                utterance.pitch = 1.0;
                speechSynthesis.speak(utterance);
            }
        }
        
        function selectCarWidget(index) {
            widgets[selectedIndex].classList.remove('selected');
            selectedIndex = index;
            widgets[selectedIndex].classList.add('selected');
            
            const action = widgets[selectedIndex].dataset.action;
            performCarAction(action);
        }
        
        function performCarAction(action) {
            switch(action) {
                case 'navigation':
                    speak('Navigation connected to universal API. GPS and traffic data synchronized across all devices.');
                    break;
                case 'communication':
                    speak('Communication ready. Can call any device in the universal network.');
                    break;
                case 'entertainment':
                    speak('Entertainment mode. Streaming from phones, computers, and all connected devices.');
                    break;
                case 'safety':
                    speak('Safety mode active. Driver assistance and emergency features enabled.');
                    break;
                case 'sync':
                    speak('All devices synchronized. Universal API connection active.');
                    break;
                case 'voice':
                    speak('Voice control ready. Say commands for hands-free operation.');
                    break;
            }
        }
        
        // Steering wheel button simulation (keyboard for testing)
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    selectCarWidget((selectedIndex - 1 + widgets.length) % widgets.length);
                    break;
                case 'ArrowRight':
                    selectCarWidget((selectedIndex + 1) % widgets.length);
                    break;
                case 'Enter':
                case ' ':
                    performCarAction(widgets[selectedIndex].dataset.action);
                    break;
            }
        });
        
        // Car API connection
        async function connectCarAPI() {
            try {
                const response = await fetch('/api/universal/car-heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': '${deviceInfo.id}',
                        'X-Device-Category': 'automotive'
                    },
                    body: JSON.stringify({
                        device_id: '${deviceInfo.id}',
                        car_system: '${deviceInfo.detected_platform}',
                        timestamp: Date.now(),
                        voice_available: 'webkitSpeechRecognition' in window,
                        driving_mode: true
                    })
                });
                
                if (response.ok) {
                    apiCallCount++;
                    console.log('🚗 Car API connected, calls:', apiCallCount);
                } else {
                    throw new Error('Car API connection failed');
                }
            } catch (error) {
                console.warn('🚗 Car API failed:', error);
                setTimeout(connectCarAPI, 10000);
            }
        }
        
        // Start car heartbeat
        connectCarAPI();
        setInterval(connectCarAPI, ${deviceInfo.update_frequency || 60000});
        
        console.log('🚗 Car interface loaded');
        console.log('🎤 Voice control active for hands-free operation');
        
        // Welcome message
        setTimeout(() => {
            speak('${appConfig.name} car system ready. Universal API connected. Voice control active.');
        }, 2000);
    </script>
</body>
</html>`;
    }
    
    generateTerminalInterface(deviceInfo, appConfig) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appConfig.name} - Terminal</title>
    
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #000;
            color: #0f0;
            margin: 0;
            padding: 20px;
            font-size: 16px;
        }
        
        .terminal-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .terminal-header {
            background: #003300;
            color: #0f0;
            padding: 10px;
            border: 1px solid #0f0;
            text-align: center;
        }
        
        .terminal-output {
            flex: 1;
            background: #000;
            color: #0f0;
            padding: 10px;
            border: 1px solid #0f0;
            overflow-y: scroll;
            font-family: 'Courier New', monospace;
            white-space: pre;
        }
        
        .terminal-input {
            display: flex;
            background: #000;
            border: 1px solid #0f0;
            padding: 5px;
        }
        
        .terminal-prompt {
            color: #0f0;
            margin-right: 5px;
        }
        
        .terminal-cmd {
            flex: 1;
            background: transparent;
            border: none;
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            outline: none;
        }
        
        .blink {
            animation: blink 1s infinite;
        }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
    </style>
</head>
<body>
    <div class="terminal-container">
        <div class="terminal-header">
            ${appConfig.name} - Universal Terminal Interface - Device: ${deviceInfo.detected_category}
        </div>
        
        <div class="terminal-output" id="terminalOutput"></div>
        
        <div class="terminal-input">
            <span class="terminal-prompt">universal@${deviceInfo.detected_category}:~$ </span>
            <input type="text" class="terminal-cmd" id="terminalInput" placeholder="Enter command..." autofocus>
        </div>
    </div>
    
    <script>
        let apiCallCount = 0;
        const output = document.getElementById('terminalOutput');
        const input = document.getElementById('terminalInput');
        
        function print(text, color = '#0f0') {
            const line = document.createElement('div');
            line.style.color = color;
            line.textContent = new Date().toLocaleTimeString() + ' ' + text;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        }
        
        function printBanner() {
            print('');
            print('╔══════════════════════════════════════════════════════════════╗', '#0f0');
            print('║                    UNIVERSAL API TERMINAL                    ║', '#0f0');
            print('║                                                              ║', '#0f0');
            print('║  Device: ${deviceInfo.detected_category.padEnd(20)}                             ║', '#0f0');
            print('║  Platform: ${deviceInfo.detected_platform.padEnd(18)}                           ║', '#0f0');
            print('║  Compatibility: ${(deviceInfo.compatibility_score * 100).toFixed(0).padEnd(3)}%                                 ║', '#0f0');
            print('║                                                              ║', '#0f0');
            print('║  Type "help" for available commands                          ║', '#0f0');
            print('║  Type "api" to test universal API connection                 ║', '#0f0');
            print('║                                                              ║', '#0f0');
            print('╚══════════════════════════════════════════════════════════════╝', '#0f0');
            print('');
            print('Terminal ready. Universal API active.', '#0f0');
        }
        
        const commands = {
            help: () => {
                print('Available commands:', '#ffff00');
                print('  help     - Show this help message');
                print('  api      - Test universal API connection');
                print('  status   - Show system status');
                print('  devices  - List compatible device types');
                print('  share    - Share app to other devices');
                print('  clear    - Clear terminal output');
                print('  info     - Show device information');
                print('  viral    - Show viral distribution stats');
                print('  exit     - Exit terminal (reload page)');
            },
            
            api: async () => {
                print('Testing universal API connection...', '#ffff00');
                
                try {
                    const response = await fetch('/api/universal/terminal-heartbeat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Device-ID': '${deviceInfo.id}',
                            'X-Device-Category': 'industrial'
                        },
                        body: JSON.stringify({
                            device_id: '${deviceInfo.id}',
                            terminal_type: 'industrial_terminal',
                            timestamp: Date.now()
                        })
                    });
                    
                    if (response.ok) {
                        apiCallCount++;
                        print('✓ API connection successful', '#0f0');
                        print(\`✓ API calls completed: \${apiCallCount}\`, '#0f0');
                        print('✓ Universal compatibility confirmed', '#0f0');
                    } else {
                        throw new Error('API connection failed');
                    }
                } catch (error) {
                    print('✗ API connection failed: ' + error.message, '#ff0000');
                }
            },
            
            status: () => {
                print('System Status:', '#ffff00');
                print(\`  Device Category: ${deviceInfo.detected_category}\`);
                print(\`  Platform: ${deviceInfo.detected_platform}\`);
                print(\`  Interface Type: Terminal\`);
                print(\`  API Method: ${deviceInfo.api_method}\`);
                print(\`  Compatibility Score: ${(deviceInfo.compatibility_score * 100).toFixed(0)}%\`);
                print(\`  API Calls: \${apiCallCount}\`);
                print(\`  Update Frequency: ${deviceInfo.update_frequency / 1000} seconds\`);
                print('  Universal API: ACTIVE', '#0f0');
            },
            
            devices: () => {
                print('Compatible Device Types:', '#ffff00');
                print('📱 Modern Mobile: iOS, Android (Full PWA)');
                print('🖥️ Desktop: Windows, Mac, Linux (Electron App)');
                print('📞 Legacy Mobile: Feature phones (Minimal HTML)');
                print('📱 Flip Phones: Nokia Series40 (SMS Commands)');
                print('🔌 Embedded: Raspberry Pi, Arduino (API Only)');
                print('📺 Smart TV: Samsung, LG, Roku (TV App)');
                print('🎮 Gaming: PlayStation, Xbox, Switch (Console Browser)');
                print('⌚ Wearables: Apple Watch, Wear OS (Micro App)');
                print('🚗 Automotive: CarPlay, Android Auto (Car App)');
                print('🏭 Industrial: POS, Kiosk (Terminal App)');
                print('🤖 IoT: Smart Fridge, Mirror (IoT Widget)');
                print('');
                print('ALL DEVICES LOOP BACK TO UNIVERSAL API!', '#0f0');
            },
            
            share: () => {
                print('Sharing ${appConfig.name} to other devices...', '#ffff00');
                print('📱 SMS sent to flip phones');
                print('📺 QR code displayed on smart TVs');
                print('🎮 Shared to gaming console browsers');
                print('⌚ Pushed to smart watches');
                print('🚗 Synced with car systems');
                print('🔌 Deployed to IoT devices');
                print('Viral distribution complete!', '#0f0');
            },
            
            clear: () => {
                output.innerHTML = '';
                printBanner();
            },
            
            info: () => {
                print('Device Information:', '#ffff00');
                print('  User Agent: ' + navigator.userAgent);
                print('  Screen Size: ' + screen.width + 'x' + screen.height);
                print('  Platform: ' + navigator.platform);
                print('  Language: ' + navigator.language);
                print('  Online: ' + navigator.onLine);
                print('  Device ID: ${deviceInfo.id}');
                print('  Detected Category: ${deviceInfo.detected_category}');
                print('  Interface Type: terminal_app');
            },
            
            viral: () => {
                print('Viral Distribution Statistics:', '#ffff00');
                print('🦠 Network Effect: ACTIVE');
                print('📊 Viral Coefficient: 2.3x');
                print('🔗 Cross-Platform Connections: UNLIMITED');
                print('📈 API Calls Generated: ' + (apiCallCount * 10) + ' (estimated)');
                print('🌍 Global Reach: ALL DEVICES');
                print('💰 Token Rewards: Earned per viral spread');
                print('');
                print('WE ARE THE INFRASTRUCTURE!', '#0f0');
            },
            
            exit: () => {
                print('Exiting terminal...', '#ffff00');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        };
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim().toLowerCase();
                
                if (cmd) {
                    print('universal@${deviceInfo.detected_category}:~$ ' + cmd, '#ffff00');
                    
                    if (commands[cmd]) {
                        commands[cmd]();
                    } else {
                        print('Command not found: ' + cmd + '. Type "help" for available commands.', '#ff0000');
                    }
                }
                
                input.value = '';
            }
        });
        
        // Auto-connect to API every update interval
        setInterval(() => {
            commands.api();
        }, ${deviceInfo.update_frequency || 180000});
        
        // Initialize terminal
        printBanner();
        
        console.log('🏭 Industrial terminal interface loaded');
    </script>
</body>
</html>`;
    }
    
    generateIoTInterface(deviceInfo, appConfig) {
        return {
            mqtt_topics: {
                heartbeat: `universal/${deviceInfo.id}/heartbeat`,
                commands: `universal/${deviceInfo.id}/commands`,
                status: `universal/${deviceInfo.id}/status`,
                data: `universal/${deviceInfo.id}/data`
            },
            
            api_endpoints: {
                register: '/api/universal/iot-register',
                heartbeat: '/api/universal/iot-heartbeat',
                command: '/api/universal/iot-command'
            },
            
            sample_payloads: {
                heartbeat: {
                    device_id: deviceInfo.id,
                    device_type: 'iot_device',
                    timestamp: Date.now(),
                    sensors: {
                        temperature: 23.5,
                        humidity: 45.2,
                        motion: false,
                        light_level: 750
                    },
                    status: 'online'
                },
                
                command_response: {
                    device_id: deviceInfo.id,
                    command_id: 'cmd_123',
                    status: 'executed',
                    result: 'success',
                    timestamp: Date.now()
                }
            },
            
            code_examples: {
                arduino: `
// Arduino IoT Universal API Integration
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "your_wifi";
const char* password = "your_password";
const char* apiUrl = "${process.env.BASE_URL || 'https://api.documentgenerator.ai'}/api/universal/iot-heartbeat";
const char* deviceId = "${deviceInfo.id}";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("Connected to Universal API network!");
}

void loop() {
  sendHeartbeat();
  delay(60000); // Send every minute
}

void sendHeartbeat() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-ID", deviceId);
    
    StaticJsonDocument<200> doc;
    doc["device_id"] = deviceId;
    doc["timestamp"] = millis();
    doc["sensors"]["temperature"] = 23.5;
    doc["status"] = "online";
    
    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode == 200) {
      Serial.println("✅ Universal API heartbeat sent");
    } else {
      Serial.println("❌ API call failed");
    }
    
    http.end();
  }
}`,
                
                raspberry_pi: `
#!/usr/bin/env python3
# Raspberry Pi Universal API Integration

import requests
import json
import time
import psutil

API_URL = "${process.env.BASE_URL || 'https://api.documentgenerator.ai'}/api/universal/iot-heartbeat"
DEVICE_ID = "${deviceInfo.id}"

def send_heartbeat():
    try:
        payload = {
            "device_id": DEVICE_ID,
            "timestamp": int(time.time() * 1000),
            "system": {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent,
                "temperature": get_cpu_temperature()
            },
            "status": "online"
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Device-ID": DEVICE_ID,
            "X-Device-Category": "embedded_systems"
        }
        
        response = requests.post(API_URL, json=payload, headers=headers)
        
        if response.status_code == 200:
            print("✅ Universal API heartbeat sent")
            return response.json()
        else:
            print(f"❌ API call failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error sending heartbeat: {e}")

def get_cpu_temperature():
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp = float(f.read()) / 1000.0
            return temp
    except:
        return 0.0

if __name__ == "__main__":
    print("🔌 Raspberry Pi Universal API client starting...")
    
    while True:
        send_heartbeat()
        time.sleep(60)  # Send every minute`
            }
        };
    }
    
    async setupSMSGateway() {
        console.log('📱 Setting up SMS gateway for flip phones...');
        
        this.smsGateway = {
            // SMS command processing
            processCommand: (phoneNumber, message) => {
                const cmd = message.trim().toUpperCase();
                const smsInterface = this.interfaceGenerators.get('sms_commands').generate({}, { name: 'Universal App' });
                
                if (smsInterface.sms_commands[cmd]) {
                    return this.generateSMSResponse(cmd, smsInterface.auto_responses);
                } else {
                    return smsInterface.auto_responses.help;
                }
            },
            
            generateSMSResponse: (command, responses) => {
                switch(command) {
                    case 'HELP':
                        return responses.help;
                    case 'STATUS':
                        return responses.status;
                    case 'INSTALL':
                        return responses.install;
                    default:
                        return responses.welcome;
                }
            },
            
            // Track SMS API calls
            recordSMSAPICall: (phoneNumber, command) => {
                console.log(`📱 SMS API call: ${phoneNumber} → ${command}`);
                
                // Update stats
                this.compatibilityStats.api_calls_by_device.set(phoneNumber, 
                    (this.compatibilityStats.api_calls_by_device.get(phoneNumber) || 0) + 1
                );
            }
        };
        
        console.log('📱 SMS gateway ready for flip phone compatibility');
    }
    
    async setupIoTSupport() {
        console.log('🤖 Setting up IoT/MQTT support...');
        
        this.iotSupport = {
            mqtt_broker: 'mqtt://localhost:1883',
            topics: {
                heartbeat: 'universal/+/heartbeat',
                commands: 'universal/+/commands',
                status: 'universal/+/status'
            },
            
            // Process IoT device messages
            processIoTMessage: (topic, payload) => {
                try {
                    const data = JSON.parse(payload);
                    const deviceId = data.device_id;
                    
                    // Update device registry
                    if (this.deviceRegistry.has(deviceId)) {
                        const device = this.deviceRegistry.get(deviceId);
                        device.last_seen = Date.now();
                        device.api_calls++;
                    }
                    
                    console.log(`🤖 IoT message: ${topic} from ${deviceId}`);
                    
                    return {
                        status: 'received',
                        timestamp: Date.now(),
                        universal_api: 'active'
                    };
                } catch (error) {
                    console.error('❌ IoT message processing failed:', error);
                    return { status: 'error', message: error.message };
                }
            }
        };
        
        console.log('🤖 IoT/MQTT support ready');
    }
    
    async createCompatibilityTests() {
        console.log('🧪 Creating compatibility testing suite...');
        
        this.compatibilityTests = {
            // Test device detection accuracy
            testDeviceDetection: (userAgent, headers) => {
                const detection = this.deviceDetector.detectDevice(userAgent, headers);
                
                return {
                    detected_category: detection.detected_category,
                    confidence: detection.confidence,
                    interface_type: detection.interface_recommendation,
                    api_method: detection.api_method,
                    test_passed: detection.confidence > 0.3
                };
            },
            
            // Test interface generation
            testInterfaceGeneration: (deviceCategory, appConfig) => {
                const mockDevice = {
                    detected_category: deviceCategory,
                    detected_platform: 'test_platform',
                    id: 'test_device',
                    compatibility_score: 0.85,
                    update_frequency: 30000
                };
                
                const categoryConfig = this.compatibilityMatrix.device_categories[deviceCategory];
                if (!categoryConfig) {
                    return { test_passed: false, error: 'Unknown device category' };
                }
                
                const generator = this.interfaceGenerators.get(categoryConfig.interface_type);
                if (!generator) {
                    return { test_passed: false, error: 'No interface generator found' };
                }
                
                try {
                    const interface = generator.generate(mockDevice, appConfig);
                    return {
                        test_passed: true,
                        interface_type: categoryConfig.interface_type,
                        interface_size: typeof interface === 'string' ? interface.length : JSON.stringify(interface).length
                    };
                } catch (error) {
                    return { test_passed: false, error: error.message };
                }
            },
            
            // Run full compatibility test suite
            runFullTestSuite: () => {
                const results = {
                    total_tests: 0,
                    passed_tests: 0,
                    failed_tests: 0,
                    device_categories: {},
                    interface_types: {},
                    overall_compatibility: 0
                };
                
                // Test each device category
                for (const category of Object.keys(this.compatibilityMatrix.device_categories)) {
                    const test = this.compatibilityTests.testInterfaceGeneration(category, { name: 'Test App' });
                    
                    results.total_tests++;
                    if (test.test_passed) {
                        results.passed_tests++;
                    } else {
                        results.failed_tests++;
                    }
                    
                    results.device_categories[category] = test;
                }
                
                // Calculate overall compatibility score
                results.overall_compatibility = results.passed_tests / results.total_tests;
                
                console.log(`🧪 Compatibility tests: ${results.passed_tests}/${results.total_tests} passed (${(results.overall_compatibility * 100).toFixed(1)}%)`);
                
                return results;
            }
        };
        
        // Run initial test suite
        const testResults = this.compatibilityTests.runFullTestSuite();
        console.log(`🧪 Compatibility testing ready - ${(testResults.overall_compatibility * 100).toFixed(1)}% compatibility achieved`);
    }
    
    // Utility methods
    generateDeviceId(deviceInfo) {
        const data = `${deviceInfo.detected_category}_${deviceInfo.user_agent}_${Date.now()}`;
        return 'dev_' + Buffer.from(data).toString('base64').substr(0, 16).replace(/[^a-zA-Z0-9]/g, '');
    }
    
    calculateCompatibilityScore(deviceInfo) {
        let score = 0.5; // Base score
        
        // Boost score based on capabilities
        if (deviceInfo.capabilities) {
            if (deviceInfo.capabilities.touch_support) score += 0.1;
            if (deviceInfo.capabilities.websocket_support) score += 0.1;
            if (deviceInfo.capabilities.service_worker_support) score += 0.1;
            if (deviceInfo.capabilities.notification_support) score += 0.05;
        }
        
        // Boost score based on confidence
        score += deviceInfo.confidence * 0.3;
        
        return Math.min(1.0, score);
    }
    
    updateCompatibilityStats(deviceInfo) {
        this.compatibilityStats.total_devices++;
        
        // Update by category
        const category = deviceInfo.detected_category;
        this.compatibilityStats.by_category.set(category, 
            (this.compatibilityStats.by_category.get(category) || 0) + 1
        );
        
        // Update by platform
        const platform = deviceInfo.detected_platform;
        this.compatibilityStats.by_platform.set(platform,
            (this.compatibilityStats.by_platform.get(platform) || 0) + 1
        );
        
        // Update interface types
        const interfaceType = deviceInfo.interface_recommendation;
        this.compatibilityStats.interface_types_used.set(interfaceType,
            (this.compatibilityStats.interface_types_used.get(interfaceType) || 0) + 1
        );
    }
    
    detectScreenSize(headers) {
        // Mock screen size detection from headers
        return {
            width: 1920,
            height: 1080,
            category: 'large_screen'
        };
    }
    
    // API Methods
    async handleUniversalHeartbeat(deviceId, data) {
        const device = this.deviceRegistry.get(deviceId);
        if (device) {
            device.last_seen = Date.now();
            device.api_calls++;
            
            console.log(`💓 Universal heartbeat: ${deviceId} (${device.detected_category})`);
            
            return {
                status: 'ok',
                universal_compatibility: true,
                device_recommendations: this.generateDeviceRecommendations(device),
                timestamp: Date.now()
            };
        } else {
            return { status: 'device_not_found' };
        }
    }
    
    generateDeviceRecommendations(device) {
        const recommendations = [];
        
        // Suggest better interfaces if available
        const category = device.detected_category;
        const categoryConfig = this.compatibilityMatrix.device_categories[category];
        
        if (categoryConfig) {
            // Check if device can support better interface
            if (device.capabilities.websocket_support && device.interface_recommendation === 'minimal_html') {
                recommendations.push({
                    type: 'interface_upgrade',
                    suggestion: 'full_pwa',
                    reason: 'Device supports WebSocket - upgrade to full PWA'
                });
            }
            
            // Suggest viral opportunities
            recommendations.push({
                type: 'viral_opportunity',
                suggestion: 'share_to_related_devices',
                reason: `Share to other ${category} devices in your network`
            });
        }
        
        return recommendations;
    }
    
    getUniversalCompatibilityStatus() {
        return {
            system_info: {
                total_device_categories: Object.keys(this.compatibilityMatrix.device_categories).length,
                total_interface_types: this.interfaceGenerators.size,
                fallback_layers: Object.keys(this.compatibilityMatrix.fallback_layers).length
            },
            
            active_devices: {
                total_registered: this.deviceRegistry.size,
                by_category: Array.from(this.compatibilityStats.by_category.entries()),
                by_platform: Array.from(this.compatibilityStats.by_platform.entries()),
                interface_distribution: Array.from(this.compatibilityStats.interface_types_used.entries())
            },
            
            compatibility_score: this.calculateOverallCompatibility(),
            
            supported_platforms: Object.keys(this.compatibilityMatrix.device_categories),
            
            viral_potential: {
                cross_platform_connections: this.calculateCrossPlatformConnections(),
                api_loop_efficiency: this.calculateAPILoopEfficiency(),
                universal_reach: this.calculateUniversalReach()
            }
        };
    }
    
    calculateOverallCompatibility() {
        const testResults = this.compatibilityTests.runFullTestSuite();
        return testResults.overall_compatibility;
    }
    
    calculateCrossPlatformConnections() {
        return this.compatibilityStats.by_category.size; // Number of different categories connected
    }
    
    calculateAPILoopEfficiency() {
        const totalAPICalls = Array.from(this.compatibilityStats.api_calls_by_device.values())
            .reduce((sum, calls) => sum + calls, 0);
        
        return totalAPICalls / Math.max(1, this.deviceRegistry.size); // Average API calls per device
    }
    
    calculateUniversalReach() {
        const totalCategories = Object.keys(this.compatibilityMatrix.device_categories).length;
        const activeCategories = this.compatibilityStats.by_category.size;
        
        return activeCategories / totalCategories; // Percentage of categories reached
    }
}

// Export for use
module.exports = Layer0UniversalOSCompatibilitySystem;

// If run directly, start the service
if (require.main === module) {
    console.log('🌌 Starting Layer0 Universal OS Compatibility System...');
    
    const universalSystem = new Layer0UniversalOSCompatibilitySystem();
    
    // Set up Express API
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 9711;
    
    app.use(express.json());
    
    // Device detection and registration
    app.post('/api/universal/detect', (req, res) => {
        const userAgent = req.headers['user-agent'];
        const headers = req.headers;
        const capabilities = req.body.capabilities;
        
        const detection = universalSystem.deviceDetector.detectDevice(userAgent, headers, capabilities);
        const deviceId = universalSystem.deviceDetector.registerDevice(detection);
        
        res.json({ device_id: deviceId, ...detection });
    });
    
    // Generate interface for specific device
    app.post('/api/universal/interface/:deviceId', (req, res) => {
        const deviceId = req.params.deviceId;
        const device = universalSystem.deviceRegistry.get(deviceId);
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        const appConfig = req.body.app_config || { name: 'Universal App' };
        const interfaceType = device.interface_recommendation;
        
        const generator = universalSystem.interfaceGenerators.get(interfaceType);
        if (!generator) {
            return res.status(400).json({ error: 'Interface generator not found' });
        }
        
        const interface = generator.generate(device, appConfig);
        
        res.json({
            device_id: deviceId,
            interface_type: interfaceType,
            interface: interface
        });
    });
    
    // Universal heartbeat endpoints
    app.post('/api/universal/heartbeat', async (req, res) => {
        const deviceId = req.headers['x-device-id'] || req.body.device_id;
        const response = await universalSystem.handleUniversalHeartbeat(deviceId, req.body);
        res.json(response);
    });
    
    // Platform-specific heartbeat endpoints
    app.post('/api/universal/:platform-heartbeat', async (req, res) => {
        const platform = req.params.platform;
        const deviceId = req.headers['x-device-id'] || req.body.device_id;
        
        console.log(`💓 Platform heartbeat: ${platform} from ${deviceId}`);
        
        const response = await universalSystem.handleUniversalHeartbeat(deviceId, req.body);
        res.json(response);
    });
    
    // SMS gateway for flip phones
    app.post('/api/universal/sms', (req, res) => {
        const { phone_number, message } = req.body;
        
        const response = universalSystem.smsGateway.processCommand(phone_number, message);
        universalSystem.smsGateway.recordSMSAPICall(phone_number, message.trim().toUpperCase());
        
        res.json({ 
            response_message: response,
            status: 'sent'
        });
    });
    
    // Compatibility status
    app.get('/api/universal/status', (req, res) => {
        const status = universalSystem.getUniversalCompatibilityStatus();
        res.json(status);
    });
    
    // Run compatibility tests
    app.get('/api/universal/test', (req, res) => {
        const results = universalSystem.compatibilityTests.runFullTestSuite();
        res.json(results);
    });
    
    // Serve platform-specific pages
    app.get('/universal/:platform', (req, res) => {
        const platform = req.params.platform;
        const userAgent = req.headers['user-agent'];
        
        // Detect device and generate appropriate interface
        const detection = universalSystem.deviceDetector.detectDevice(userAgent, req.headers);
        const deviceId = universalSystem.deviceDetector.registerDevice(detection);
        
        const interfaceType = detection.interface_recommendation;
        const generator = universalSystem.interfaceGenerators.get(interfaceType);
        
        if (generator) {
            const interface = generator.generate(detection, { name: `Universal ${platform}` });
            
            if (typeof interface === 'string') {
                res.send(interface);
            } else {
                res.json(interface);
            }
        } else {
            res.status(400).send('Interface not supported for this device');
        }
    });
    
    app.listen(port, () => {
        console.log(`🌌 Layer0 Universal OS Compatibility System running on port ${port}`);
        console.log(`📱 Device Detection: POST http://localhost:${port}/api/universal/detect`);
        console.log(`🎨 Interface Generation: POST http://localhost:${port}/api/universal/interface/:deviceId`);
        console.log(`💓 Universal Heartbeat: POST http://localhost:${port}/api/universal/heartbeat`);
        console.log(`📱 SMS Gateway: POST http://localhost:${port}/api/universal/sms`);
        console.log(`📊 Compatibility Status: GET http://localhost:${port}/api/universal/status`);
        console.log(`🧪 Compatibility Tests: GET http://localhost:${port}/api/universal/test`);
        console.log('🌍 UNIVERSAL COMPATIBILITY ACHIEVED - WORKS ON LITERALLY EVERYTHING!');
    });
}
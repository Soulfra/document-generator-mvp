/**
 * 📏👁️🎯 Proximity-Aware Stream Controller
 * Detects face/device distance and adjusts UI accordingly
 * Includes Apple Vision Pro spatial awareness
 */

class ProximityStreamController {
    constructor() {
        this.currentDistance = 'normal';
        this.faceDetected = false;
        this.proximityData = null;
        this.calibrationData = null;
        this.visionProEnabled = false;
        
        // Distance thresholds (in relative units)
        this.distanceZones = {
            veryClose: {
                name: 'Very Close',
                range: [0, 25],  // cm
                uiScale: 0.8,
                streamCount: 1,
                fontSize: '14px',
                description: 'Single stream focus mode'
            },
            close: {
                name: 'Close',
                range: [25, 40],
                uiScale: 0.9,
                streamCount: 4,
                fontSize: '16px',
                description: 'Detailed view, 2x2 grid'
            },
            normal: {
                name: 'Normal',
                range: [40, 60],
                uiScale: 1.0,
                streamCount: 9,
                fontSize: '18px',
                description: 'Standard 3x3 grid'
            },
            far: {
                name: 'Far',
                range: [60, 100],
                uiScale: 1.2,
                streamCount: 9,
                fontSize: '20px',
                description: 'Larger UI elements'
            },
            veryFar: {
                name: 'Very Far',
                range: [100, Infinity],
                uiScale: 1.5,
                streamCount: 4,
                fontSize: '24px',
                description: 'Simplified interface'
            }
        };

        // Apple Vision Pro spatial configurations
        this.spatialConfigs = {
            intimate: {
                depth: 0.5,     // meters
                fov: 60,        // degrees
                panelSize: 0.3, // meters
                layout: 'arc'
            },
            personal: {
                depth: 1.0,
                fov: 90,
                panelSize: 0.5,
                layout: 'curve'
            },
            social: {
                depth: 2.0,
                fov: 120,
                panelSize: 0.8,
                layout: 'sphere'
            },
            theater: {
                depth: 4.0,
                fov: 180,
                panelSize: 1.5,
                layout: 'dome'
            }
        };

        // Webcam face detection settings
        this.faceDetectionConfig = {
            enabled: false,
            stream: null,
            video: null,
            faceSize: null,
            baseFaceSize: null,
            calibrated: false
        };

        this.init();
    }

    async init() {
        console.log('📏 Initializing Proximity Stream Controller...');
        
        // Check for Vision Pro
        await this.checkVisionPro();
        
        // Try to initialize face detection
        if (!this.visionProEnabled) {
            await this.initializeFaceDetection();
        }
        
        // Setup proximity sensors if available
        this.setupProximitySensors();
        
        // Start monitoring
        this.startProximityMonitoring();
        
        console.log('✅ Proximity controller initialized');
    }

    async checkVisionPro() {
        // Check for Vision Pro specific APIs
        if (window.xr && typeof window.xr.isSessionSupported === 'function') {
            try {
                const arSupported = await window.xr.isSessionSupported('immersive-ar');
                const vrSupported = await window.xr.isSessionSupported('immersive-vr');
                
                this.visionProEnabled = arSupported || vrSupported;
                
                if (this.visionProEnabled) {
                    console.log('🥽 Apple Vision Pro detected!');
                    this.initializeVisionPro();
                }
            } catch (e) {
                console.log('👁️ WebXR available but not Vision Pro');
            }
        }
    }

    async initializeFaceDetection() {
        try {
            // Check if webcam is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('📸 Camera API not available');
                return;
            }

            // Create hidden video element
            this.faceDetectionConfig.video = document.createElement('video');
            this.faceDetectionConfig.video.style.display = 'none';
            document.body.appendChild(this.faceDetectionConfig.video);

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            this.faceDetectionConfig.stream = stream;
            this.faceDetectionConfig.video.srcObject = stream;
            await this.faceDetectionConfig.video.play();

            // Initialize face detection (using simple size-based approach)
            this.faceDetectionConfig.enabled = true;
            this.startFaceTracking();

            console.log('📸 Face detection initialized');
        } catch (error) {
            console.log('📸 Face detection not available:', error.message);
            // Fall back to device motion or default behavior
            this.useDeviceMotionFallback();
        }
    }

    startFaceTracking() {
        if (!this.faceDetectionConfig.enabled) return;

        // Simple face size estimation using image analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 160;
        canvas.height = 120;

        const detectFace = () => {
            if (!this.faceDetectionConfig.video) return;

            ctx.drawImage(this.faceDetectionConfig.video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Simple skin tone detection for face size estimation
            const facePixels = this.detectSkinTone(imageData);
            const faceSize = facePixels.length;

            // Calibration
            if (!this.faceDetectionConfig.calibrated && faceSize > 1000) {
                this.faceDetectionConfig.baseFaceSize = faceSize;
                this.faceDetectionConfig.calibrated = true;
                console.log('📏 Face detection calibrated:', faceSize);
            }

            // Calculate relative distance
            if (this.faceDetectionConfig.calibrated) {
                const sizeRatio = faceSize / this.faceDetectionConfig.baseFaceSize;
                const estimatedDistance = this.estimateDistance(sizeRatio);
                this.updateProximity(estimatedDistance);
            }

            // Continue tracking
            if (this.faceDetectionConfig.enabled) {
                requestAnimationFrame(detectFace);
            }
        };

        detectFace();
    }

    detectSkinTone(imageData) {
        const pixels = [];
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Simple skin tone detection
            if (r > 95 && g > 40 && b > 20 &&
                r > g && r > b &&
                Math.abs(r - g) > 15) {
                pixels.push(i);
            }
        }

        return pixels;
    }

    estimateDistance(sizeRatio) {
        // Inverse relationship: larger face = closer
        // Assuming calibration at 50cm
        const baseDistance = 50;
        const estimatedDistance = baseDistance / Math.sqrt(sizeRatio);
        
        return Math.max(10, Math.min(200, estimatedDistance));
    }

    useDeviceMotionFallback() {
        // Use device motion as fallback for mobile devices
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (event) => {
                const acceleration = event.accelerationIncludingGravity;
                
                if (acceleration) {
                    // Use device tilt to estimate viewing distance
                    const tilt = Math.abs(acceleration.z - 9.8);
                    
                    if (tilt < 2) {
                        this.updateProximity(50); // Normal viewing
                    } else if (tilt < 5) {
                        this.updateProximity(30); // Close viewing
                    } else {
                        this.updateProximity(70); // Far viewing
                    }
                }
            });

            console.log('📱 Using device motion for proximity');
        }
    }

    setupProximitySensors() {
        // Check for proximity sensor API (limited browser support)
        if ('ProximitySensor' in window) {
            try {
                const sensor = new ProximitySensor();
                
                sensor.addEventListener('reading', () => {
                    // Proximity sensors typically give near/far readings
                    const distance = sensor.near ? 20 : 60;
                    this.updateProximity(distance);
                });

                sensor.start();
                console.log('📡 Hardware proximity sensor enabled');
            } catch (error) {
                console.log('📡 Proximity sensor not accessible');
            }
        }

        // Ambient light sensor as supplementary data
        if ('AmbientLightSensor' in window) {
            try {
                const sensor = new AmbientLightSensor();
                
                sensor.addEventListener('reading', () => {
                    // Darker usually means closer to screen
                    const lux = sensor.illuminance;
                    this.ambientLight = lux;
                });

                sensor.start();
            } catch (error) {
                // Silent fail
            }
        }
    }

    updateProximity(distance) {
        const oldZone = this.currentDistance;
        let newZone = 'normal';

        // Find appropriate zone
        for (const [zone, config] of Object.entries(this.distanceZones)) {
            if (distance >= config.range[0] && distance < config.range[1]) {
                newZone = zone;
                break;
            }
        }

        if (oldZone !== newZone) {
            this.currentDistance = newZone;
            console.log(`📏 Distance changed: ${oldZone} → ${newZone} (${distance}cm)`);
            
            // Apply UI changes
            this.applyProximityChanges(newZone);
            
            // Emit event
            this.emitProximityChange(newZone, distance);
        }

        this.proximityData = {
            distance,
            zone: newZone,
            timestamp: Date.now()
        };
    }

    applyProximityChanges(zone) {
        const config = this.distanceZones[zone];
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--proximity-scale', config.uiScale);
        document.documentElement.style.setProperty('--proximity-font-size', config.fontSize);
        
        // Update stream grid layout
        const streamGrid = document.getElementById('streamGrid');
        if (streamGrid) {
            streamGrid.setAttribute('data-proximity', zone);
            
            // Adjust grid based on stream count
            if (config.streamCount === 1) {
                streamGrid.style.gridTemplateColumns = '1fr';
                streamGrid.style.gridTemplateRows = '1fr';
            } else if (config.streamCount === 4) {
                streamGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                streamGrid.style.gridTemplateRows = 'repeat(2, 1fr)';
            } else {
                streamGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                streamGrid.style.gridTemplateRows = 'repeat(3, 1fr)';
            }
        }

        // Add visual feedback
        this.showProximityFeedback(zone);
    }

    showProximityFeedback(zone) {
        // Remove existing feedback
        const existingFeedback = document.querySelector('.proximity-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'proximity-feedback';
        feedback.innerHTML = `
            <div class="proximity-icon">${this.getZoneIcon(zone)}</div>
            <div class="proximity-text">${this.distanceZones[zone].name}</div>
        `;

        // Style the feedback
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(139, 0, 255, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-family: var(--font-mono);
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease, fadeOut 0.3s ease 2s forwards;
            z-index: 10000;
        `;

        document.body.appendChild(feedback);

        // Auto-remove after animation
        setTimeout(() => feedback.remove(), 2300);
    }

    getZoneIcon(zone) {
        const icons = {
            veryClose: '🔍',
            close: '👁️',
            normal: '👤',
            far: '🔭',
            veryFar: '🌍'
        };
        return icons[zone] || '📏';
    }

    // Apple Vision Pro specific methods
    initializeVisionPro() {
        console.log('🥽 Initializing Vision Pro spatial features...');

        // Setup spatial tracking
        this.spatialState = {
            headPosition: { x: 0, y: 0, z: 0 },
            headRotation: { x: 0, y: 0, z: 0 },
            eyeTracking: false,
            handTracking: false,
            currentLayout: 'personal'
        };

        // Request XR session
        this.setupXRSession();
    }

    async setupXRSession() {
        try {
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor', 'hand-tracking'],
                optionalFeatures: ['eye-tracking']
            });

            session.addEventListener('end', () => {
                console.log('🥽 XR session ended');
            });

            // Setup reference space
            const referenceSpace = await session.requestReferenceSpace('local-floor');

            // Animation loop
            const onXRFrame = (time, frame) => {
                const pose = frame.getViewerPose(referenceSpace);
                
                if (pose) {
                    this.updateSpatialState(pose);
                }

                session.requestAnimationFrame(onXRFrame);
            };

            session.requestAnimationFrame(onXRFrame);

        } catch (error) {
            console.log('🥽 XR session setup failed:', error);
        }
    }

    updateSpatialState(pose) {
        // Update head position and rotation
        const transform = pose.views[0].transform;
        this.spatialState.headPosition = transform.position;
        this.spatialState.headRotation = transform.orientation;

        // Calculate viewing distance based on position
        const distance = Math.sqrt(
            transform.position.x ** 2 +
            transform.position.y ** 2 +
            transform.position.z ** 2
        );

        // Determine spatial layout
        let layout = 'personal';
        if (distance < 0.8) layout = 'intimate';
        else if (distance < 1.5) layout = 'personal';
        else if (distance < 3) layout = 'social';
        else layout = 'theater';

        if (this.spatialState.currentLayout !== layout) {
            this.applySpatialLayout(layout);
        }
    }

    applySpatialLayout(layout) {
        this.spatialState.currentLayout = layout;
        const config = this.spatialConfigs[layout];

        console.log(`🥽 Spatial layout changed to: ${layout}`);

        // Emit spatial layout change
        this.emitSpatialChange(layout, config);
    }

    // Monitoring and analytics
    startProximityMonitoring() {
        this.monitoringInterval = setInterval(() => {
            // Log proximity stats
            if (this.proximityData) {
                const stats = {
                    currentZone: this.currentDistance,
                    distance: this.proximityData.distance,
                    faceDetected: this.faceDetected,
                    visionProActive: this.visionProEnabled
                };

                // Store for analytics
                this.recordProximityData(stats);
            }
        }, 5000); // Every 5 seconds
    }

    recordProximityData(stats) {
        // Could send to analytics service
        const event = new CustomEvent('proximityStats', {
            detail: { ...stats, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    // Event emitters
    emitProximityChange(zone, distance) {
        const event = new CustomEvent('proximityChange', {
            detail: {
                zone,
                distance,
                config: this.distanceZones[zone],
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    emitSpatialChange(layout, config) {
        const event = new CustomEvent('spatialLayoutChange', {
            detail: {
                layout,
                config,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    // Public API
    getCurrentDistance() {
        return this.currentDistance;
    }

    getDistanceConfig() {
        return this.distanceZones[this.currentDistance];
    }

    isVisionProActive() {
        return this.visionProEnabled;
    }

    getSpatialState() {
        return this.spatialState;
    }

    // Manual calibration
    calibrateDistance(knownDistance) {
        console.log(`📏 Calibrating at ${knownDistance}cm`);
        
        if (this.faceDetectionConfig.video) {
            // Re-calibrate face size
            this.faceDetectionConfig.calibrated = false;
        }
    }

    // Cleanup
    destroy() {
        clearInterval(this.monitoringInterval);
        
        if (this.faceDetectionConfig.stream) {
            this.faceDetectionConfig.stream.getTracks().forEach(track => track.stop());
        }
        
        if (this.faceDetectionConfig.video) {
            this.faceDetectionConfig.video.remove();
        }
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
    
    /* Proximity-based scaling */
    .stream-box {
        transform: scale(var(--proximity-scale, 1));
        transition: transform 0.3s ease;
    }
    
    .stream-title,
    .current-game {
        font-size: calc(var(--proximity-font-size, 18px) * 0.8);
        transition: font-size 0.3s ease;
    }
`;
document.head.appendChild(style);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProximityStreamController;
} else {
    window.ProximityStreamController = ProximityStreamController;
}

console.log('📏👁️🎯 Proximity Stream Controller loaded');
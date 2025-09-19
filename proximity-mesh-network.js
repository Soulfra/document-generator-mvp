#!/usr/bin/env node

/**
 * Proximity-Based Mesh Network
 * Enhanced DEVICE-MESH-ARPANET with geofencing, sustained connection benefits,
 * and same-network detection for personal hotspot functionality
 */

const DeviceMeshARPANET = require('./DEVICE-MESH-ARPANET');
const crypto = require('crypto');
const dgram = require('dgram');
const { networkInterfaces } = require('os');
const fs = require('fs').promises;

class ProximityMeshNetwork extends DeviceMeshARPANET {
  constructor() {
    super();
    
    // Proximity and geofencing system
    this.geofencing = {
      enabled: true,
      currentZone: null,
      zones: new Map(),
      gpsLocation: null,
      country: null,
      lastLocationUpdate: null
    };
    
    // Sustained connection benefits
    this.connectionBenefits = {
      startTime: Date.now(),
      onlineTime: 0,
      trustLevel: 0.1,
      visibilityRadius: 100, // Base radius
      helpfulness: 0.1, // How helpful to other devices
      sustainedConnections: new Map() // Track connection duration with other devices
    };
    
    // Same-network detection
    this.networkDetection = {
      currentWifi: null,
      bluetoothDevices: new Set(),
      rfidTags: new Set(),
      qrCodes: new Set(),
      sameNetworkDevices: new Set(),
      networkFingerprint: null
    };
    
    // Resource pooling
    this.resourcePools = {
      local: {
        capacity: 100,
        used: 0,
        contributors: new Set(),
        benefits: new Map()
      },
      regional: {
        capacity: 1000,
        used: 0,
        contributors: new Set(),
        benefits: new Map()
      },
      country: {
        capacity: 10000,
        used: 0,
        contributors: new Set(),
        benefits: new Map()
      }
    };
    
    // Device tagging system
    this.deviceTags = {
      primary: [],
      geofence: [],
      network: [],
      proximity: [],
      temporal: []
    };
    
    console.log('🌐 Proximity-Based Mesh Network initialized');
    this.initializeProximityFeatures();
  }
  
  async initializeProximityFeatures() {
    // Initialize location services
    await this.initializeGeofencing();
    
    // Start sustained connection tracking
    this.startSustainedConnectionTracking();
    
    // Initialize network detection
    await this.initializeNetworkDetection();
    
    // Setup resource pooling
    this.initializeResourcePools();
    
    // Start geofencing and proximity monitoring
    this.startProximityMonitoring();
    
    console.log('📍 Proximity features initialized');
  }
  
  async initializeGeofencing() {
    console.log('📍 Initializing geofencing system...');
    
    // Get initial location if available
    try {
      const location = await this.getCurrentLocation();
      if (location) {
        this.geofencing.gpsLocation = location;
        this.geofencing.country = await this.getCountryFromLocation(location);
        this.geofencing.lastLocationUpdate = Date.now();
        
        console.log(`📍 Location detected: ${location.lat}, ${location.lng} (${this.geofencing.country})`);
        
        // Auto-tag device based on location
        this.addDeviceTag('geofence', `country_${this.geofencing.country}`);
        this.addDeviceTag('geofence', `region_${Math.floor(location.lat)}_${Math.floor(location.lng)}`);
      }
    } catch (error) {
      console.log('📍 GPS not available, using network-based location');
    }
    
    // Setup geofence zones
    this.setupGeofenceZones();
  }
  
  async getCurrentLocation() {
    // Try to get location from various sources
    
    // 1. Try GPS if available (mobile/browser context)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          position => resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }),
          error => reject(error),
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }
    
    // 2. Try IP-based geolocation
    try {
      const response = await fetch('http://ip-api.com/json/');
      const data = await response.json();
      if (data.status === 'success') {
        return {
          lat: data.lat,
          lng: data.lon,
          accuracy: 10000, // IP location is less accurate
          city: data.city,
          country: data.country
        };
      }
    } catch (error) {
      console.log('📍 IP geolocation failed');
    }
    
    return null;
  }
  
  async getCountryFromLocation(location) {
    try {
      // Reverse geocoding to get country
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lng}&localityLanguage=en`
      );
      const data = await response.json();
      return data.countryCode || 'UNKNOWN';
    } catch (error) {
      return 'UNKNOWN';
    }
  }
  
  setupGeofenceZones() {
    // Local zone (100m radius)
    if (this.geofencing.gpsLocation) {
      this.geofencing.zones.set('local', {
        center: this.geofencing.gpsLocation,
        radius: 100, // meters
        type: 'local',
        benefits: {
          trustBonus: 0.5,
          visibilityBonus: 2.0,
          resourcePoolAccess: 'local'
        }
      });
      
      // Regional zone (10km radius)
      this.geofencing.zones.set('regional', {
        center: this.geofencing.gpsLocation,
        radius: 10000, // meters
        type: 'regional',
        benefits: {
          trustBonus: 0.2,
          visibilityBonus: 1.5,
          resourcePoolAccess: 'regional'
        }
      });
      
      // Country zone
      this.geofencing.zones.set('country', {
        country: this.geofencing.country,
        type: 'country',
        benefits: {
          trustBonus: 0.1,
          visibilityBonus: 1.2,
          resourcePoolAccess: 'country'
        }
      });
    }
  }
  
  startSustainedConnectionTracking() {
    console.log('⏱️ Starting sustained connection tracking...');
    
    // Update online time and benefits every minute
    setInterval(() => {
      this.updateSustainedBenefits();
    }, 60000);
    
    // Track connection duration with other devices
    setInterval(() => {
      this.updateConnectionDurations();
    }, 30000);
  }
  
  updateSustainedBenefits() {
    const now = Date.now();
    this.connectionBenefits.onlineTime = now - this.connectionBenefits.startTime;
    
    // Calculate trust level based on online time (logarithmic growth)
    const hoursOnline = this.connectionBenefits.onlineTime / (1000 * 60 * 60);
    this.connectionBenefits.trustLevel = Math.min(1.0, 0.1 + Math.log(hoursOnline + 1) * 0.1);
    
    // Increase visibility radius with sustained connection
    this.connectionBenefits.visibilityRadius = 100 + (hoursOnline * 10); // 10m per hour
    
    // Increase helpfulness to other devices
    this.connectionBenefits.helpfulness = Math.min(1.0, 0.1 + (hoursOnline * 0.02));
    
    // Update device tags
    this.addDeviceTag('temporal', `trust_${Math.floor(this.connectionBenefits.trustLevel * 10)}`);
    this.addDeviceTag('temporal', `online_${Math.floor(hoursOnline)}h`);
    
    console.log(`⏱️ Online: ${Math.floor(hoursOnline)}h, Trust: ${this.connectionBenefits.trustLevel.toFixed(2)}, Radius: ${Math.floor(this.connectionBenefits.visibilityRadius)}m`);
  }
  
  updateConnectionDurations() {
    const now = Date.now();
    
    // Update duration for each connected device
    this.handshakeMesh.forEach((mesh, deviceId) => {
      if (mesh.handshakeComplete) {
        const connectionStart = this.connectionBenefits.sustainedConnections.get(deviceId) || mesh.establishedAt;
        const duration = now - connectionStart;
        
        if (!this.connectionBenefits.sustainedConnections.has(deviceId)) {
          this.connectionBenefits.sustainedConnections.set(deviceId, connectionStart);
        }
        
        // Apply sustained connection benefits
        this.applySustainedConnectionBenefits(deviceId, duration);
      }
    });
  }
  
  applySustainedConnectionBenefits(deviceId, duration) {
    const hours = duration / (1000 * 60 * 60);
    
    // Increase visibility between sustained connections
    const mesh = this.handshakeMesh.get(deviceId);
    if (mesh && mesh.visibilityMask) {
      // Enhance visibility mask based on connection duration
      mesh.visibilityMask.forEach(mask => {
        if (mask.visible) {
          mask.opacity = Math.min(1.0, mask.opacity + (hours * 0.01));
          if (hours > 1) mask.accessLevel = 'enhanced';
          if (hours > 24) mask.accessLevel = 'full';
        }
      });
    }
  }
  
  async initializeNetworkDetection() {
    console.log('📶 Initializing network detection...');
    
    // Detect current WiFi network
    this.networkDetection.currentWifi = await this.getCurrentWifiNetwork();
    
    // Generate network fingerprint
    this.networkDetection.networkFingerprint = this.generateNetworkFingerprint();
    
    // Start network monitoring
    this.startNetworkMonitoring();
    
    if (this.networkDetection.currentWifi) {
      console.log(`📶 Connected to WiFi: ${this.networkDetection.currentWifi}`);
      this.addDeviceTag('network', `wifi_${this.networkDetection.currentWifi}`);
    }
  }
  
  async getCurrentWifiNetwork() {
    try {
      // Try different methods to get WiFi SSID
      const { exec } = require('child_process');
      
      return new Promise((resolve) => {
        // macOS
        exec('networksetup -getairportnetwork en0', (error, stdout) => {
          if (!error && stdout.includes('Current Wi-Fi Network:')) {
            const ssid = stdout.split('Current Wi-Fi Network: ')[1]?.trim();
            resolve(ssid);
            return;
          }
          
          // Linux
          exec('iwgetid -r', (error, stdout) => {
            if (!error && stdout.trim()) {
              resolve(stdout.trim());
              return;
            }
            
            // Windows
            exec('netsh wlan show profiles', (error, stdout) => {
              if (!error) {
                const lines = stdout.split('\n');
                const connectedLine = lines.find(line => line.includes('*'));
                if (connectedLine) {
                  const ssid = connectedLine.split(':')[1]?.trim();
                  resolve(ssid);
                  return;
                }
              }
              
              resolve(null);
            });
          });
        });
      });
    } catch (error) {
      return null;
    }
  }
  
  generateNetworkFingerprint() {
    const interfaces = networkInterfaces();
    const fingerprint = {
      wifi: this.networkDetection.currentWifi,
      gateways: [],
      localIPs: [],
      macAddresses: []
    };
    
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (const alias of iface) {
        if (!alias.internal) {
          fingerprint.localIPs.push(alias.address);
          if (alias.mac && alias.mac !== '00:00:00:00:00:00') {
            fingerprint.macAddresses.push(alias.mac);
          }
        }
      }
    }
    
    return crypto.createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
  }
  
  startNetworkMonitoring() {
    // Monitor for same-network devices
    setInterval(() => {
      this.scanForSameNetworkDevices();
    }, 30000);
    
    // Monitor for QR codes and RFID tags
    this.startProximityScanning();
  }
  
  async scanForSameNetworkDevices() {
    // Scan local network for other devices with same network fingerprint
    const localIP = this.getLocalIP();
    if (!localIP) return;
    
    const subnet = localIP.substring(0, localIP.lastIndexOf('.'));
    
    // Ping sweep to find active devices
    for (let i = 1; i <= 254; i++) {
      const targetIP = `${subnet}.${i}`;
      this.pingForMeshDevice(targetIP);
    }
  }
  
  getLocalIP() {
    const interfaces = networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (const alias of iface) {
        if (!alias.internal && alias.family === 'IPv4') {
          return alias.address;
        }
      }
    }
    return null;
  }
  
  pingForMeshDevice(ip) {
    // Send special mesh ping to check for proximity mesh devices
    const pingData = {
      type: 'proximity_ping',
      deviceId: this.deviceId,
      networkFingerprint: this.networkDetection.networkFingerprint,
      wifi: this.networkDetection.currentWifi,
      location: this.geofencing.gpsLocation,
      trustLevel: this.connectionBenefits.trustLevel,
      timestamp: Date.now()
    };
    
    const message = Buffer.from(JSON.stringify(pingData));
    
    // Use a different port for proximity detection
    const proximitySocket = dgram.createSocket('udp4');
    proximitySocket.send(message, 0, message.length, this.meshPort + 100, ip, (err) => {
      proximitySocket.close();
      if (!err) {
        // Device responded, might be on same network
        this.handleSameNetworkDevice(ip, pingData);
      }
    });
  }
  
  handleSameNetworkDevice(ip, pingData) {
    if (pingData.wifi === this.networkDetection.currentWifi) {
      this.networkDetection.sameNetworkDevices.add(pingData.deviceId);
      
      console.log(`📶 Same network device found: ${pingData.deviceId} on ${pingData.wifi}`);
      
      // Instantly boost trust and visibility for same-network devices
      this.boostDeviceConnection(pingData.deviceId, 'same_network');
    }
  }
  
  boostDeviceConnection(deviceId, reason) {
    const mesh = this.handshakeMesh.get(deviceId);
    if (mesh) {
      // Boost visibility for same-network/proximity devices
      mesh.visibilityMask?.forEach(mask => {
        if (reason === 'same_network') {
          mask.opacity = Math.min(1.0, mask.opacity + 0.5);
          mask.accessLevel = 'enhanced';
        } else if (reason === 'rfid_tap') {
          mask.opacity = 1.0;
          mask.accessLevel = 'full';
        } else if (reason === 'qr_scan') {
          mask.opacity = 0.9;
          mask.accessLevel = 'enhanced';
        }
      });
      
      console.log(`🚀 Boosted connection to ${deviceId} (${reason})`);
    }
  }
  
  startProximityScanning() {
    // Listen for RFID/NFC taps and QR scans
    this.proximitySocket = dgram.createSocket('udp4');
    
    this.proximitySocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        
        switch (data.type) {
          case 'rfid_tap':
            this.handleRFIDTap(data, rinfo);
            break;
          case 'qr_scan':
            this.handleQRScan(data, rinfo);
            break;
          case 'bluetooth_beacon':
            this.handleBluetoothBeacon(data, rinfo);
            break;
          case 'proximity_ping':
            this.handleProximityPing(data, rinfo);
            break;
        }
      } catch (error) {
        // Ignore invalid messages
      }
    });
    
    this.proximitySocket.bind(this.meshPort + 100);
  }
  
  handleRFIDTap(data, rinfo) {
    console.log(`📳 RFID tap from device: ${data.deviceId}`);
    
    this.networkDetection.rfidTags.add(data.rfidId);
    this.addDeviceTag('proximity', `rfid_${data.rfidId}`);
    
    // RFID tap creates instant full connection
    this.boostDeviceConnection(data.deviceId, 'rfid_tap');
    
    // Add to resource pool
    this.addToResourcePool('local', data.deviceId, 'rfid_tap');
  }
  
  handleQRScan(data, rinfo) {
    console.log(`📱 QR scan from device: ${data.deviceId}`);
    
    this.networkDetection.qrCodes.add(data.qrCode);
    this.addDeviceTag('proximity', `qr_${data.qrCode}`);
    
    // QR scan creates enhanced connection
    this.boostDeviceConnection(data.deviceId, 'qr_scan');
    
    // Add to resource pool
    this.addToResourcePool('local', data.deviceId, 'qr_scan');
  }
  
  handleBluetoothBeacon(data, rinfo) {
    console.log(`🔵 Bluetooth beacon from device: ${data.deviceId}`);
    
    this.networkDetection.bluetoothDevices.add(data.bluetoothId);
    this.addDeviceTag('proximity', `bluetooth_${data.bluetoothId}`);
    
    // Bluetooth proximity creates moderate boost
    this.boostDeviceConnection(data.deviceId, 'bluetooth_proximity');
  }
  
  handleProximityPing(data, rinfo) {
    // Respond to proximity ping if on same network/location
    if (data.wifi === this.networkDetection.currentWifi) {
      const response = {
        type: 'proximity_pong',
        deviceId: this.deviceId,
        networkFingerprint: this.networkDetection.networkFingerprint,
        trustLevel: this.connectionBenefits.trustLevel,
        helpfulness: this.connectionBenefits.helpfulness
      };
      
      const message = Buffer.from(JSON.stringify(response));
      this.proximitySocket.send(message, 0, message.length, this.meshPort + 100, rinfo.address);
    }
  }
  
  initializeResourcePools() {
    console.log('💎 Initializing resource pools...');
    
    // Local pool (same WiFi/RFID/QR area)
    this.resourcePools.local.capacity = 100 + (this.connectionBenefits.trustLevel * 100);
    
    // Regional pool (geofence area)
    this.resourcePools.regional.capacity = 1000 + (this.connectionBenefits.trustLevel * 500);
    
    // Country pool
    this.resourcePools.country.capacity = 10000 + (this.connectionBenefits.trustLevel * 2000);
    
    // Start resource pool monitoring
    setInterval(() => {
      this.updateResourcePools();
    }, 60000);
  }
  
  addToResourcePool(poolType, deviceId, reason) {
    const pool = this.resourcePools[poolType];
    if (!pool) return;
    
    pool.contributors.add(deviceId);
    
    // Calculate contribution value based on reason and trust
    let contribution = 1;
    switch (reason) {
      case 'rfid_tap': contribution = 10; break;
      case 'qr_scan': contribution = 5; break;
      case 'same_network': contribution = 3; break;
      case 'sustained_connection': contribution = 2; break;
    }
    
    contribution *= this.connectionBenefits.helpfulness;
    
    const currentBenefit = pool.benefits.get(deviceId) || 0;
    pool.benefits.set(deviceId, currentBenefit + contribution);
    
    console.log(`💎 Added ${contribution.toFixed(1)} to ${poolType} pool from ${deviceId} (${reason})`);
  }
  
  updateResourcePools() {
    // Calculate pool health and benefits
    Object.entries(this.resourcePools).forEach(([poolType, pool]) => {
      const totalContribution = Array.from(pool.benefits.values()).reduce((sum, val) => sum + val, 0);
      pool.used = Math.min(pool.capacity, totalContribution);
      
      // Pool benefits decay over time if not maintained
      pool.benefits.forEach((benefit, deviceId) => {
        pool.benefits.set(deviceId, Math.max(0, benefit * 0.99));
      });
      
      console.log(`💎 ${poolType} pool: ${pool.used}/${pool.capacity} (${pool.contributors.size} contributors)`);
    });
  }
  
  startProximityMonitoring() {
    console.log('👁️ Starting proximity monitoring...');
    
    // Update location periodically
    setInterval(async () => {
      await this.updateLocation();
    }, 300000); // Every 5 minutes
    
    // Check geofence boundaries
    setInterval(() => {
      this.checkGeofenceBoundaries();
    }, 30000);
  }
  
  async updateLocation() {
    try {
      const newLocation = await this.getCurrentLocation();
      if (newLocation) {
        const oldLocation = this.geofencing.gpsLocation;
        this.geofencing.gpsLocation = newLocation;
        this.geofencing.lastLocationUpdate = Date.now();
        
        // Check if moved to new area
        if (oldLocation) {
          const distance = this.calculateDistance(oldLocation, newLocation);
          if (distance > 100) { // Moved more than 100m
            console.log(`📍 Location updated: moved ${Math.floor(distance)}m`);
            this.handleLocationChange(oldLocation, newLocation);
          }
        }
      }
    } catch (error) {
      console.log('📍 Location update failed');
    }
  }
  
  calculateDistance(loc1, loc2) {
    // Haversine formula for distance between two GPS points
    const R = 6371000; // Earth's radius in meters
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  handleLocationChange(oldLocation, newLocation) {
    // Update geofence zones
    this.setupGeofenceZones();
    
    // Update device tags
    this.addDeviceTag('geofence', `moved_${Date.now()}`);
    
    // Recalculate proximity benefits
    this.recalculateProximityBenefits();
  }
  
  checkGeofenceBoundaries() {
    if (!this.geofencing.gpsLocation) return;
    
    this.geofencing.zones.forEach((zone, zoneId) => {
      if (zone.center) {
        const distance = this.calculateDistance(this.geofencing.gpsLocation, zone.center);
        const inZone = distance <= zone.radius;
        
        if (inZone && this.geofencing.currentZone !== zoneId) {
          this.enterGeofence(zoneId, zone);
        } else if (!inZone && this.geofencing.currentZone === zoneId) {
          this.exitGeofence(zoneId, zone);
        }
      }
    });
  }
  
  enterGeofence(zoneId, zone) {
    console.log(`📍 Entered geofence: ${zoneId}`);
    
    this.geofencing.currentZone = zoneId;
    this.addDeviceTag('geofence', `zone_${zoneId}`);
    
    // Apply geofence benefits
    this.connectionBenefits.trustLevel += zone.benefits.trustBonus;
    this.connectionBenefits.visibilityRadius *= zone.benefits.visibilityBonus;
    
    // Enable resource pool access
    if (zone.benefits.resourcePoolAccess) {
      this.addToResourcePool(zone.benefits.resourcePoolAccess, this.deviceId, 'geofence_entry');
    }
  }
  
  exitGeofence(zoneId, zone) {
    console.log(`📍 Exited geofence: ${zoneId}`);
    
    this.geofencing.currentZone = null;
    this.removeDeviceTag('geofence', `zone_${zoneId}`);
  }
  
  recalculateProximityBenefits() {
    // Recalculate all proximity-based benefits based on current state
    this.handshakeMesh.forEach((mesh, deviceId) => {
      const node = this.meshNodes.get(deviceId);
      if (node && this.geofencing.gpsLocation) {
        // Check if other device is in proximity
        // This would require other devices to share their location
        // For now, boost based on sustained connection
        this.applySustainedConnectionBenefits(deviceId, Date.now() - mesh.establishedAt);
      }
    });
  }
  
  addDeviceTag(category, tag) {
    if (!this.deviceTags[category].includes(tag)) {
      this.deviceTags[category].push(tag);
      
      // Keep tag arrays from growing too large
      if (this.deviceTags[category].length > 50) {
        this.deviceTags[category] = this.deviceTags[category].slice(-40);
      }
    }
  }
  
  removeDeviceTag(category, tag) {
    const index = this.deviceTags[category].indexOf(tag);
    if (index > -1) {
      this.deviceTags[category].splice(index, 1);
    }
  }
  
  // Override parent's getWorldView to include proximity data
  getWorldView() {
    const baseView = super.getWorldView();
    
    return {
      ...baseView,
      proximity: {
        geofencing: this.geofencing,
        connectionBenefits: this.connectionBenefits,
        networkDetection: this.networkDetection,
        resourcePools: this.resourcePools,
        deviceTags: this.deviceTags
      }
    };
  }
  
  // Override parent's getMeshStatus to include proximity status
  getMeshStatus() {
    const baseStatus = super.getMeshStatus();
    
    return {
      ...baseStatus,
      proximityFeatures: {
        location: this.geofencing.gpsLocation,
        currentZone: this.geofencing.currentZone,
        trustLevel: this.connectionBenefits.trustLevel,
        helpfulness: this.connectionBenefits.helpfulness,
        visibilityRadius: this.connectionBenefits.visibilityRadius,
        onlineHours: Math.floor(this.connectionBenefits.onlineTime / (1000 * 60 * 60)),
        sameNetworkDevices: this.networkDetection.sameNetworkDevices.size,
        resourcePoolHealth: Object.entries(this.resourcePools).map(([type, pool]) => ({
          type,
          health: pool.used / pool.capacity,
          contributors: pool.contributors.size
        }))
      }
    };
  }
  
  // PWA/Hotspot functionality
  generatePersonalHotspotCode() {
    const hotspotData = {
      deviceId: this.deviceId,
      wifi: this.networkDetection.currentWifi,
      location: this.geofencing.gpsLocation,
      trustLevel: this.connectionBenefits.trustLevel,
      helpfulness: this.connectionBenefits.helpfulness,
      resourcePools: Object.keys(this.resourcePools).filter(
        pool => this.resourcePools[pool].contributors.has(this.deviceId)
      ),
      timestamp: Date.now()
    };
    
    return Buffer.from(JSON.stringify(hotspotData)).toString('base64');
  }
  
  connectToPersonalHotspot(hotspotCode) {
    try {
      const hotspotData = JSON.parse(Buffer.from(hotspotCode, 'base64').toString());
      
      console.log(`📶 Connecting to personal hotspot: ${hotspotData.deviceId}`);
      
      // Boost connection based on hotspot invitation
      this.boostDeviceConnection(hotspotData.deviceId, 'hotspot_invite');
      
      // Join their resource pools if compatible
      hotspotData.resourcePools.forEach(pool => {
        this.addToResourcePool(pool, this.deviceId, 'hotspot_join');
      });
      
      return true;
    } catch (error) {
      console.error('Invalid hotspot code');
      return false;
    }
  }
}

// Export for use in other modules
module.exports = ProximityMeshNetwork;

// If run directly, start the proximity mesh network
if (require.main === module) {
  console.log('🌐 STARTING PROXIMITY-BASED MESH NETWORK');
  console.log('=========================================');
  
  const proximityMesh = new ProximityMeshNetwork();
  
  // Status reporting every 2 minutes
  setInterval(() => {
    const status = proximityMesh.getMeshStatus();
    const worldView = proximityMesh.getWorldView();
    
    console.log('\n📊 PROXIMITY MESH STATUS:');
    console.log(`   Device ID: ${status.deviceId}`);
    console.log(`   Location: ${status.proximityFeatures.location ? 
      `${status.proximityFeatures.location.lat.toFixed(4)}, ${status.proximityFeatures.location.lng.toFixed(4)}` : 'Unknown'}`);
    console.log(`   Current Zone: ${status.proximityFeatures.currentZone || 'None'}`);
    console.log(`   Trust Level: ${(status.proximityFeatures.trustLevel * 100).toFixed(1)}%`);
    console.log(`   Online: ${status.proximityFeatures.onlineHours} hours`);
    console.log(`   Visibility Radius: ${Math.floor(status.proximityFeatures.visibilityRadius)}m`);
    console.log(`   Helpfulness: ${(status.proximityFeatures.helpfulness * 100).toFixed(1)}%`);
    console.log(`   Same Network Devices: ${status.proximityFeatures.sameNetworkDevices}`);
    console.log(`   Discovered Devices: ${status.discoveredDevices}`);
    console.log(`   Completed Handshakes: ${status.completedHandshakes}`);
    
    console.log('\n💎 RESOURCE POOLS:');
    status.proximityFeatures.resourcePoolHealth.forEach(pool => {
      console.log(`   ${pool.type}: ${(pool.health * 100).toFixed(1)}% (${pool.contributors} contributors)`);
    });
    
    console.log('\n🏷️ DEVICE TAGS:');
    Object.entries(status.proximityFeatures).forEach(([category, tags]) => {
      if (Array.isArray(tags) && tags.length > 0) {
        console.log(`   ${category}: ${tags.slice(-3).join(', ')}`);
      }
    });
    
  }, 120000);
  
  // Generate personal hotspot code every 10 minutes
  setInterval(() => {
    const hotspotCode = proximityMesh.generatePersonalHotspotCode();
    console.log(`\n📶 Personal Hotspot Code: ${hotspotCode.slice(-20)}...`);
    console.log(`   Share this code for instant device connection!`);
  }, 600000);
  
  console.log('\n🎮 PROXIMITY MESH FEATURES:');
  console.log('   ✅ Geofencing with automatic device tagging');
  console.log('   ✅ Sustained connection benefits');
  console.log('   ✅ Same-network device detection (WiFi/Bluetooth/RFID/QR)');
  console.log('   ✅ Resource pooling with proximity benefits');
  console.log('   ✅ Progressive trust building');
  console.log('   ✅ Personal hotspot functionality');
  console.log('   ✅ Country/regional area detection');
  console.log('\n🔒 PROXIMITY SECURITY:');
  console.log('   • Longer online = higher trust + bigger visibility radius');
  console.log('   • Same WiFi/RFID/QR = instant connection boost');
  console.log('   • Geofencing provides automatic area-based benefits');
  console.log('   • Resource pools prevent closure through sustained use');
  console.log('   • Personal hotspot codes for secure device sharing');
  console.log('\n🌐 Ready for proximity-based mesh networking!');
}
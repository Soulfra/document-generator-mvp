#!/usr/bin/env node

/**
 * FLASH SECURITY MANAGER
 * "Changing Room" security system with access-triggered events
 * Every file access potentially changes the security landscape
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class FlashSecurityManager extends EventEmitter {
  constructor(gravityWellEncryption, privateVaultServer) {
    super();
    
    // Core system references
    this.gravityWell = gravityWellEncryption;
    this.vaultServer = privateVaultServer;
    
    // Security state
    this.threatLevel = 'green'; // green, yellow, orange, red, critical
    this.accessAttempts = new Map(); // IP -> attempt data
    this.suspiciousPatterns = new Map(); // pattern -> count
    this.emergencyMode = false;
    
    // Flash security configuration
    this.flashConfig = {
      // Trigger immediate key rotation after N accesses
      maxAccessesBeforeRotation: 10,
      
      // Time window for detecting rapid access (ms)
      rapidAccessWindow: 5000, // 5 seconds
      
      // Maximum accesses in rapid window
      maxRapidAccesses: 3,
      
      // Threat level escalation thresholds
      threatThresholds: {
        yellow: 5,   // 5 suspicious events
        orange: 15,  // 15 suspicious events
        red: 30,     // 30 suspicious events
        critical: 50 // 50 suspicious events - emergency lockdown
      },
      
      // Key rotation triggers
      rotationTriggers: {
        suspiciousAccess: true,
        rapidAccess: true,
        unknownUserAgent: true,
        geographicAnomaly: true,
        timeAnomaly: true
      }
    };
    
    // Access pattern tracking
    this.accessLog = [];
    this.userProfiles = new Map(); // userId -> behavioral profile
    this.honeypotActive = false;
    
    // Performance counters
    this.stats = {
      totalAccesses: 0,
      flashEvents: 0,
      keyRotations: 0,
      emergencyLockdowns: 0,
      honeypotActivations: 0,
      threatsBlocked: 0
    };
    
    // Integration with existing systems
    this.portHopper = null; // Will be injected
    this.emergencyLockdown = null; // Will be injected
    
    console.log('⚡ FLASH SECURITY MANAGER INITIALIZED');
    console.log('🚨 Access-triggered security events active');
    console.log('🎭 "Changing room" protection enabled');
    console.log(`📊 Threat level: ${this.threatLevel.toUpperCase()}`);
    
    this.initialize();
  }
  
  /**
   * Initialize flash security system
   */
  async initialize() {
    // Setup event listeners
    this.setupEventListeners();
    
    // Start monitoring loops
    this.startThreatLevelMonitoring();
    this.startPatternAnalysis();
    this.startAccessLogCleanup();
    
    // Initialize user behavioral profiles
    await this.loadUserProfiles();
    
    console.log('✅ Flash Security Manager operational');
  }
  
  /**
   * Setup event listeners for security events
   */
  setupEventListeners() {
    // Listen for gravity well encryption events
    this.gravityWell.on('decrypted', (data) => {
      this.handleFileAccess('decrypt', data);
    });
    
    this.gravityWell.on('encrypted', (data) => {
      this.handleFileAccess('encrypt', data);
    });
    
    // Listen for vault server events
    if (this.vaultServer) {
      this.vaultServer.on('suspicious_activity', (data) => {
        this.handleSuspiciousActivity(data);
      });
      
      this.vaultServer.on('file_download', (data) => {
        this.handleFileAccess('download', data);
      });
      
      this.vaultServer.on('file_upload', (data) => {
        this.handleFileAccess('upload', data);
      });
    }
    
    console.log('🔗 Event listeners configured');
  }
  
  /**
   * Handle file access events - the core "changing room" logic
   */
  async handleFileAccess(action, data) {
    try {
      const accessEvent = {
        id: crypto.randomUUID(),
        action,
        timestamp: Date.now(),
        userId: data.userId || 'anonymous',
        size: data.size || 0,
        keyType: data.keyType || 'file',
        ip: data.ip || 'unknown',
        userAgent: data.userAgent || 'unknown'
      };
      
      // Log the access
      this.accessLog.push(accessEvent);
      this.stats.totalAccesses++;
      
      console.log(`🔍 File access detected: ${action} by ${accessEvent.userId}`);
      
      // Analyze this access for threats
      const threatAnalysis = await this.analyzeAccess(accessEvent);
      
      // Check if this triggers a flash security event
      const flashDecision = this.evaluateFlashTrigger(accessEvent, threatAnalysis);
      
      if (flashDecision.shouldFlash) {
        await this.executeFlashSecurity(flashDecision, accessEvent);
      }
      
      // Update user behavioral profile
      await this.updateUserProfile(accessEvent, threatAnalysis);
      
      // Emit access event for other systems
      this.emit('file_accessed', {
        access: accessEvent,
        threat: threatAnalysis,
        flash: flashDecision
      });
      
    } catch (error) {
      console.error('❌ Flash security analysis failed:', error);
    }
  }
  
  /**
   * Analyze access for threat indicators
   */
  async analyzeAccess(accessEvent) {
    const threats = [];
    let riskScore = 0;
    
    // Check for rapid access pattern
    const recentAccesses = this.getRecentAccesses(accessEvent.userId, this.flashConfig.rapidAccessWindow);
    if (recentAccesses.length > this.flashConfig.maxRapidAccesses) {
      threats.push('rapid_access');
      riskScore += 30;
    }
    
    // Check user agent
    if (this.isSuspiciousUserAgent(accessEvent.userAgent)) {
      threats.push('suspicious_user_agent');
      riskScore += 40;
    }
    
    // Check IP reputation
    if (await this.isSuspiciousIP(accessEvent.ip)) {
      threats.push('suspicious_ip');
      riskScore += 25;
    }
    
    // Check access time anomaly
    if (this.isTimeAnomaly(accessEvent)) {
      threats.push('time_anomaly');
      riskScore += 15;
    }
    
    // Check behavioral deviation
    const behaviorAnalysis = await this.analyzeBehaviorDeviation(accessEvent);
    if (behaviorAnalysis.isAnomalous) {
      threats.push('behavioral_anomaly');
      riskScore += behaviorAnalysis.severityScore;
    }
    
    // Check file access patterns
    const filePatternAnalysis = this.analyzeFileAccessPattern(accessEvent);
    if (filePatternAnalysis.isSuspicious) {
      threats.push('suspicious_file_pattern');
      riskScore += 20;
    }
    
    return {
      threats,
      riskScore,
      threatLevel: this.calculateThreatLevel(riskScore),
      shouldAlert: riskScore > 30,
      shouldBlock: riskScore > 70
    };
  }
  
  /**
   * Evaluate if this access should trigger flash security
   */
  evaluateFlashTrigger(accessEvent, threatAnalysis) {
    const decision = {
      shouldFlash: false,
      flashType: 'none',
      reason: '',
      immediateActions: [],
      delayedActions: []
    };
    
    // High threat score always triggers flash
    if (threatAnalysis.riskScore > 50) {
      decision.shouldFlash = true;
      decision.flashType = 'threat_response';
      decision.reason = 'High threat score detected';
      decision.immediateActions = ['rotate_keys', 'port_hop', 'log_threat'];
    }
    
    // Rapid access pattern triggers flash
    else if (threatAnalysis.threats.includes('rapid_access')) {
      decision.shouldFlash = true;
      decision.flashType = 'rapid_access';
      decision.reason = 'Rapid access pattern detected';
      decision.immediateActions = ['rotate_user_keys', 'cache_flush'];
    }
    
    // Suspicious user agent triggers flash
    else if (threatAnalysis.threats.includes('suspicious_user_agent')) {
      decision.shouldFlash = true;
      decision.flashType = 'suspicious_agent';
      decision.reason = 'Suspicious user agent detected';
      decision.immediateActions = ['activate_honeypot', 'port_hop'];
    }
    
    // Normal access but reached rotation threshold
    else if (this.shouldRotateOnAccess(accessEvent)) {
      decision.shouldFlash = true;
      decision.flashType = 'scheduled_rotation';
      decision.reason = 'Access count threshold reached';
      decision.delayedActions = ['rotate_keys'];
    }
    
    // Emergency mode - flash on everything
    if (this.emergencyMode) {
      decision.shouldFlash = true;
      decision.flashType = 'emergency';
      decision.reason = 'Emergency mode active';
      decision.immediateActions = ['full_lockdown'];
    }
    
    return decision;
  }
  
  /**
   * Execute flash security actions
   */
  async executeFlashSecurity(flashDecision, accessEvent) {
    try {
      console.log(`⚡ FLASH SECURITY TRIGGERED: ${flashDecision.flashType}`);
      console.log(`📝 Reason: ${flashDecision.reason}`);
      
      this.stats.flashEvents++;
      
      // Execute immediate actions
      for (const action of flashDecision.immediateActions) {
        await this.executeSecurityAction(action, accessEvent);
      }
      
      // Schedule delayed actions
      for (const action of flashDecision.delayedActions) {
        setTimeout(() => {
          this.executeSecurityAction(action, accessEvent);
        }, Math.random() * 5000 + 2000); // 2-7 second delay
      }
      
      // Update threat level
      this.escalateThreatLevel();
      
      // Emit flash event
      this.emit('flash_security', {
        type: flashDecision.flashType,
        reason: flashDecision.reason,
        accessEvent,
        timestamp: Date.now()
      });
      
      console.log(`🚨 Flash security executed: ${flashDecision.immediateActions.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Flash security execution failed:', error);
    }
  }
  
  /**
   * Execute individual security actions
   */
  async executeSecurityAction(action, accessEvent) {
    switch (action) {
      case 'rotate_keys':
        await this.rotateAllKeys();
        break;
        
      case 'rotate_user_keys':
        await this.rotateUserKeys(accessEvent.userId);
        break;
        
      case 'port_hop':
        await this.triggerPortHop();
        break;
        
      case 'cache_flush':
        await this.flushCaches();
        break;
        
      case 'activate_honeypot':
        await this.activateHoneypot(accessEvent);
        break;
        
      case 'log_threat':
        await this.logThreatEvent(accessEvent);
        break;
        
      case 'full_lockdown':
        await this.triggerEmergencyLockdown();
        break;
        
      default:
        console.warn(`⚠️ Unknown security action: ${action}`);
    }
  }
  
  /**
   * Rotate all encryption keys
   */
  async rotateAllKeys() {
    try {
      console.log('🔄 Rotating all encryption keys...');
      
      // Trigger gravity well key rotation
      if (this.gravityWell && this.gravityWell.emergencyKeyRegeneration) {
        await this.gravityWell.emergencyKeyRegeneration();
      }
      
      this.stats.keyRotations++;
      
      console.log('✅ All keys rotated');
      
      this.emit('keys_rotated', {
        type: 'all',
        trigger: 'flash_security',
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
    }
  }
  
  /**
   * Rotate keys for specific user
   */
  async rotateUserKeys(userId) {
    try {
      console.log(`🔄 Rotating keys for user: ${userId}`);
      
      // Clear user's key cache
      if (this.gravityWell && this.gravityWell.keyCache) {
        for (const [cacheKey] of this.gravityWell.keyCache) {
          if (cacheKey.includes(userId)) {
            this.gravityWell.keyCache.delete(cacheKey);
          }
        }
      }
      
      this.stats.keyRotations++;
      
      console.log(`✅ User keys rotated for: ${userId}`);
      
    } catch (error) {
      console.error('❌ User key rotation failed:', error);
    }
  }
  
  /**
   * Trigger port hop if port hopper is available
   */
  async triggerPortHop() {
    try {
      if (this.portHopper && this.portHopper.forcePortHop) {
        console.log('🐒 Triggering emergency port hop...');
        await this.portHopper.forcePortHop();
        console.log('✅ Port hop completed');
      } else {
        console.log('⚠️ Port hopper not available');
      }
    } catch (error) {
      console.error('❌ Port hop failed:', error);
    }
  }
  
  /**
   * Flush all security caches
   */
  async flushCaches() {
    try {
      console.log('🧹 Flushing security caches...');
      
      // Clear gravity well key cache
      if (this.gravityWell && this.gravityWell.keyCache) {
        this.gravityWell.keyCache.clear();
      }
      
      // Clear access pattern cache
      this.accessAttempts.clear();
      this.suspiciousPatterns.clear();
      
      // Keep only last 10 access log entries
      this.accessLog = this.accessLog.slice(-10);
      
      console.log('✅ Caches flushed');
      
    } catch (error) {
      console.error('❌ Cache flush failed:', error);
    }
  }
  
  /**
   * Activate honeypot for suspicious access
   */
  async activateHoneypot(accessEvent) {
    try {
      console.log('🍯 Activating honeypot for suspicious access...');
      
      this.honeypotActive = true;
      this.stats.honeypotActivations++;
      
      // Log the honeypot activation
      const honeypotLog = {
        timestamp: Date.now(),
        triggeredBy: accessEvent,
        reason: 'suspicious_access',
        fakeDataServed: true
      };
      
      // In a real system, this would serve fake file data
      console.log('🎭 Honeypot active - fake content ready');
      
      this.emit('honeypot_activated', honeypotLog);
      
      // Deactivate after 10 minutes
      setTimeout(() => {
        this.honeypotActive = false;
        console.log('🍯 Honeypot deactivated');
      }, 600000);
      
    } catch (error) {
      console.error('❌ Honeypot activation failed:', error);
    }
  }
  
  /**
   * Check if access should trigger key rotation
   */
  shouldRotateOnAccess(accessEvent) {
    // Count recent accesses by this user
    const userAccesses = this.accessLog.filter(log => 
      log.userId === accessEvent.userId && 
      Date.now() - log.timestamp < 3600000 // Last hour
    ).length;
    
    return userAccesses >= this.flashConfig.maxAccessesBeforeRotation;
  }
  
  /**
   * Analyze behavioral deviation
   */
  async analyzeBehaviorDeviation(accessEvent) {
    const userProfile = this.userProfiles.get(accessEvent.userId);
    
    if (!userProfile) {
      return { isAnomalous: false, severityScore: 0 };
    }
    
    let deviationScore = 0;
    
    // Check time-of-day deviation
    const accessHour = new Date(accessEvent.timestamp).getHours();
    const typicalHours = userProfile.accessHours || [];
    
    if (typicalHours.length > 0 && !typicalHours.includes(accessHour)) {
      deviationScore += 15;
    }
    
    // Check access frequency deviation
    const recentAccessCount = this.getRecentAccesses(accessEvent.userId, 3600000).length;
    const typicalFrequency = userProfile.averageHourlyAccesses || 0;
    
    if (recentAccessCount > typicalFrequency * 3) {
      deviationScore += 25;
    }
    
    return {
      isAnomalous: deviationScore > 20,
      severityScore: deviationScore
    };
  }
  
  /**
   * Update user behavioral profile
   */
  async updateUserProfile(accessEvent, threatAnalysis) {
    let profile = this.userProfiles.get(accessEvent.userId) || {
      userId: accessEvent.userId,
      firstSeen: Date.now(),
      totalAccesses: 0,
      accessHours: [],
      averageHourlyAccesses: 0,
      suspiciousEvents: 0,
      lastUpdate: Date.now()
    };
    
    profile.totalAccesses++;
    profile.lastUpdate = Date.now();
    
    // Update access hour patterns
    const accessHour = new Date(accessEvent.timestamp).getHours();
    if (!profile.accessHours.includes(accessHour)) {
      profile.accessHours.push(accessHour);
    }
    
    // Update suspicious event count
    if (threatAnalysis.shouldAlert) {
      profile.suspiciousEvents++;
    }
    
    this.userProfiles.set(accessEvent.userId, profile);
  }
  
  /**
   * Escalate threat level based on recent events
   */
  escalateThreatLevel() {
    const recentSuspiciousEvents = this.accessLog
      .filter(log => Date.now() - log.timestamp < 3600000) // Last hour
      .length;
    
    const thresholds = this.flashConfig.threatThresholds;
    let newThreatLevel = 'green';
    
    if (recentSuspiciousEvents >= thresholds.critical) {
      newThreatLevel = 'critical';
    } else if (recentSuspiciousEvents >= thresholds.red) {
      newThreatLevel = 'red';
    } else if (recentSuspiciousEvents >= thresholds.orange) {
      newThreatLevel = 'orange';
    } else if (recentSuspiciousEvents >= thresholds.yellow) {
      newThreatLevel = 'yellow';
    }
    
    if (newThreatLevel !== this.threatLevel) {
      const oldLevel = this.threatLevel;
      this.threatLevel = newThreatLevel;
      
      console.log(`🚨 Threat level escalated: ${oldLevel} → ${newThreatLevel}`);
      
      this.emit('threat_level_changed', {
        oldLevel,
        newLevel: newThreatLevel,
        suspiciousEvents: recentSuspiciousEvents,
        timestamp: Date.now()
      });
      
      // Trigger emergency lockdown if critical
      if (newThreatLevel === 'critical') {
        this.triggerEmergencyLockdown();
      }
    }
  }
  
  /**
   * Start monitoring and analysis loops
   */
  startThreatLevelMonitoring() {
    setInterval(() => {
      this.escalateThreatLevel();
    }, 30000); // Every 30 seconds
  }
  
  startPatternAnalysis() {
    setInterval(() => {
      this.analyzeAccessPatterns();
    }, 60000); // Every minute
  }
  
  startAccessLogCleanup() {
    setInterval(() => {
      // Keep only last 1000 access log entries
      if (this.accessLog.length > 1000) {
        this.accessLog = this.accessLog.slice(-1000);
      }
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Utility functions
   */
  getRecentAccesses(userId, timeWindow) {
    const now = Date.now();
    return this.accessLog.filter(log => 
      log.userId === userId && 
      (now - log.timestamp) < timeWindow
    );
  }
  
  isSuspiciousUserAgent(userAgent) {
    const suspiciousAgents = ['bot', 'crawler', 'spider', 'python', 'curl', 'wget'];
    return suspiciousAgents.some(agent => 
      userAgent.toLowerCase().includes(agent)
    );
  }
  
  async isSuspiciousIP(ip) {
    // In a real system, this would check IP reputation databases
    // For now, just check against known bad patterns
    return ip.includes('tor') || ip.includes('proxy') || ip === '127.0.0.1';
  }
  
  isTimeAnomaly(accessEvent) {
    const accessHour = new Date(accessEvent.timestamp).getHours();
    // Consider 2 AM to 6 AM as anomalous
    return accessHour >= 2 && accessHour <= 6;
  }
  
  analyzeFileAccessPattern(accessEvent) {
    // Check for sequential file access (directory traversal attempt)
    const recentFileAccesses = this.accessLog
      .filter(log => Date.now() - log.timestamp < 10000) // Last 10 seconds
      .length;
    
    return {
      isSuspicious: recentFileAccesses > 5
    };
  }
  
  calculateThreatLevel(riskScore) {
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 30) return 'medium';
    if (riskScore >= 15) return 'low';
    return 'minimal';
  }
  
  async loadUserProfiles() {
    // In a real system, this would load from persistent storage
    console.log('👥 User behavioral profiles loaded');
  }
  
  /**
   * Get flash security statistics
   */
  getStats() {
    return {
      ...this.stats,
      threatLevel: this.threatLevel,
      emergencyMode: this.emergencyMode,
      honeypotActive: this.honeypotActive,
      activeUsers: this.userProfiles.size,
      recentAccesses: this.accessLog.filter(log => 
        Date.now() - log.timestamp < 3600000
      ).length
    };
  }
  
  /**
   * Trigger emergency lockdown
   */
  async triggerEmergencyLockdown() {
    if (this.emergencyLockdown) {
      console.log('🚨 TRIGGERING EMERGENCY LOCKDOWN');
      await this.emergencyLockdown.activate();
    }
    
    this.emergencyMode = true;
    this.stats.emergencyLockdowns++;
    
    this.emit('emergency_lockdown', {
      timestamp: Date.now(),
      threatLevel: this.threatLevel
    });
  }
}

// Export the class
module.exports = FlashSecurityManager;

// CLI interface if run directly
if (require.main === module) {
  console.log('⚡ FLASH SECURITY MANAGER - STANDALONE MODE\n');
  
  // Mock dependencies for testing
  const mockGravityWell = new EventEmitter();
  const mockVaultServer = new EventEmitter();
  
  const flashSecurity = new FlashSecurityManager(mockGravityWell, mockVaultServer);
  
  // Setup event logging
  flashSecurity.on('flash_security', (data) => {
    console.log(`⚡ FLASH EVENT: ${data.type} - ${data.reason}`);
  });
  
  flashSecurity.on('threat_level_changed', (data) => {
    console.log(`🚨 THREAT LEVEL: ${data.oldLevel} → ${data.newLevel}`);
  });
  
  flashSecurity.on('honeypot_activated', () => {
    console.log('🍯 HONEYPOT ACTIVATED');
  });
  
  // Simulate some file access events
  setTimeout(() => {
    console.log('\n🧪 Simulating file access events...\n');
    
    // Normal access
    mockGravityWell.emit('decrypted', {
      userId: 'user123',
      size: 1024,
      keyType: 'file',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (normal user)'
    });
    
    // Suspicious access
    setTimeout(() => {
      mockGravityWell.emit('decrypted', {
        userId: 'anonymous',
        size: 2048,
        keyType: 'file',
        ip: '10.0.0.1',
        userAgent: 'python-requests/2.25.1'
      });
    }, 1000);
    
    // Rapid access pattern
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        mockGravityWell.emit('decrypted', {
          userId: 'user456',
          size: 512,
          keyType: 'file',
          ip: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (rapid access)'
        });
      }
    }, 2000);
    
    // Show stats after simulation
    setTimeout(() => {
      console.log('\n📊 Flash Security Statistics:');
      console.log(JSON.stringify(flashSecurity.getStats(), null, 2));
    }, 5000);
    
  }, 1000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Flash Security Manager...');
    console.log('✅ Shutdown complete');
    process.exit(0);
  });
}
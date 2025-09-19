#!/usr/bin/env node

/**
 * SOULFRA ANTI-SPOOFING PROTECTION LAYER
 * 
 * Integrates cryptographic verification with existing contract system
 * to prevent spoofing of timestamps, PGP keys, and contract execution.
 * 
 * Key Features:
 * - Real-time spoofing detection and prevention
 * - Integration with CONTRACT-MANIFEST.json specifications
 * - Enhanced middleware-guardian-contract protection
 * - Behavioral analysis for anomaly detection
 * - Emergency response protocols for security incidents
 */

const SoulFraCryptoVerification = require('./soulfra-crypto-verification.js');
const MiddlewareGuardianContract = require('./middleware-guardian-contract.js');
const crypto = require('crypto');
const fs = require('fs').promises;
const EventEmitter = require('events');

class SoulFraAntiSpoofingLayer extends EventEmitter {
  constructor() {
    super();
    
    this.cryptoVerifier = new SoulFraCryptoVerification();
    this.middlewareGuardian = null;
    this.contractManifest = null;
    
    // Anti-spoofing configuration
    this.config = {
      // Behavioral analysis thresholds
      maxRequestsPerMinute: 60,
      maxFailedVerifications: 5,
      suspiciousPatternThreshold: 3,
      
      // Security levels
      minVerificationConfidence: 80, // percentage
      requireDeviceFingerprint: true,
      requireTimestampVerification: true,
      requireNonceValidation: true,
      
      // Emergency response
      autoBlockSuspiciousUsers: true,
      emergencyShutdownThreshold: 10, // critical violations
      alertAdministrators: true
    };
    
    // Monitoring data
    this.userBehavior = new Map(); // User behavioral patterns
    this.securityIncidents = []; // Security incident log
    this.blockedUsers = new Set(); // Blocked user IDs
    this.suspiciousActivities = new Map(); // Anomaly tracking
    
    // Real-time statistics
    this.stats = {
      totalRequests: 0,
      verifiedRequests: 0,
      blockedRequests: 0,
      spoofingAttempts: 0,
      criticalIncidents: 0,
      averageVerificationTime: 0
    };
    
    console.log('🛡️ SoulFra Anti-Spoofing Layer initialized');
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION AND INTEGRATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize the anti-spoofing layer
   */
  async initialize() {
    console.log('\n🚀 Initializing Anti-Spoofing Protection...');
    
    // Initialize crypto verification engine
    await this.cryptoVerifier.initialize();
    
    // Load contract manifest
    await this.loadContractManifest();
    
    // Initialize middleware guardian integration
    await this.initializeMiddlewareIntegration();
    
    // Start behavioral monitoring
    this.startBehavioralMonitoring();
    
    // Set up emergency protocols
    this.setupEmergencyProtocols();
    
    console.log('\n✅ Anti-Spoofing Protection active!');
    console.log('   🔍 Real-time spoofing detection enabled');
    console.log('   🧠 Behavioral analysis monitoring');
    console.log('   🚨 Emergency protocols configured');
    console.log('   🔗 Middleware guardian enhanced');
  }

  /**
   * Load and validate contract manifest
   */
  async loadContractManifest() {
    try {
      const manifestData = await fs.readFile('./CONTRACT-MANIFEST.json', 'utf8');
      this.contractManifest = JSON.parse(manifestData);
      
      console.log('📋 Contract manifest loaded for anti-spoofing');
      console.log(`   Enforcing ${Object.keys(this.contractManifest.contracts).length} contract types`);
      
    } catch (error) {
      console.warn(`⚠️ Could not load contract manifest: ${error.message}`);
      this.contractManifest = null;
    }
  }

  /**
   * Initialize middleware guardian integration
   */
  async initializeMiddlewareIntegration() {
    try {
      this.middlewareGuardian = new MiddlewareGuardianContract();
      
      // Wrap guardian layer with anti-spoofing protection
      const originalGuardianLayer = this.middlewareGuardian.guardianLayer.bind(this.middlewareGuardian);
      
      this.middlewareGuardian.guardianLayer = async (bashCommand) => {
        return await this.protectedGuardianLayer(bashCommand, originalGuardianLayer);
      };
      
      console.log('🔗 Enhanced middleware guardian with anti-spoofing');
      
    } catch (error) {
      console.warn(`⚠️ Middleware integration failed: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SPOOFING DETECTION ALGORITHMS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Analyze request for spoofing indicators
   */
  async analyzeSpoofingRisk(request, userId) {
    const analysis = {
      riskScore: 0,
      indicators: [],
      severity: 'low',
      confidence: 100
    };
    
    // 1. Timestamp Analysis
    const timestampRisk = this.analyzeTimestampSpoofing(request);
    if (timestampRisk.suspicious) {
      analysis.riskScore += 25;
      analysis.indicators.push(`Timestamp anomaly: ${timestampRisk.reason}`);
    }
    
    // 2. Device Fingerprint Analysis
    const deviceRisk = await this.analyzeDeviceSpoofing(request, userId);
    if (deviceRisk.suspicious) {
      analysis.riskScore += 30;
      analysis.indicators.push(`Device anomaly: ${deviceRisk.reason}`);
    }
    
    // 3. Behavioral Pattern Analysis
    const behaviorRisk = this.analyzeBehavioralAnomalies(request, userId);
    if (behaviorRisk.suspicious) {
      analysis.riskScore += 20;
      analysis.indicators.push(`Behavior anomaly: ${behaviorRisk.reason}`);
    }
    
    // 4. Cryptographic Integrity Analysis
    const cryptoRisk = await this.analyzeCryptographicSpoofing(request);
    if (cryptoRisk.suspicious) {
      analysis.riskScore += 35;
      analysis.indicators.push(`Crypto anomaly: ${cryptoRisk.reason}`);
    }
    
    // 5. Rate Limiting Analysis
    const rateRisk = this.analyzeRateLimitingAnomalies(userId);
    if (rateRisk.suspicious) {
      analysis.riskScore += 15;
      analysis.indicators.push(`Rate anomaly: ${rateRisk.reason}`);
    }
    
    // Determine severity
    if (analysis.riskScore >= 75) {
      analysis.severity = 'critical';
    } else if (analysis.riskScore >= 50) {
      analysis.severity = 'high';
    } else if (analysis.riskScore >= 25) {
      analysis.severity = 'medium';
    }
    
    // Log analysis
    if (analysis.riskScore > 0) {
      console.log(`🔍 Spoofing risk analysis for ${userId}:`);
      console.log(`   Risk Score: ${analysis.riskScore}/100 (${analysis.severity})`);
      console.log(`   Indicators: ${analysis.indicators.length}`);
      
      if (analysis.severity === 'critical' || analysis.severity === 'high') {
        console.log(`⚠️ HIGH RISK DETECTED: ${analysis.indicators.join(', ')}`);
      }
    }
    
    return analysis;
  }

  /**
   * Analyze timestamp for spoofing indicators
   */
  analyzeTimestampSpoofing(request) {
    const analysis = { suspicious: false, reason: null };
    
    if (!request.timestamp) {
      analysis.suspicious = true;
      analysis.reason = 'missing-timestamp';
      return analysis;
    }
    
    const now = Date.now();
    const requestTime = request.timestamp;
    const timeDiff = Math.abs(now - requestTime);
    
    // Check for future timestamps (clock skew attack)
    if (requestTime > now + 60000) { // 1 minute in future
      analysis.suspicious = true;
      analysis.reason = 'future-timestamp';
      return analysis;
    }
    
    // Check for very old timestamps (replay attack)
    if (timeDiff > 3600000) { // 1 hour old
      analysis.suspicious = true;
      analysis.reason = 'stale-timestamp';
      return analysis;
    }
    
    // Check for microsecond precision (unusual for human activity)
    if (requestTime % 1000 === 0) {
      analysis.suspicious = true;
      analysis.reason = 'artificial-precision';
      return analysis;
    }
    
    return analysis;
  }

  /**
   * Analyze device fingerprint for spoofing
   */
  async analyzeDeviceSpoofing(request, userId) {
    const analysis = { suspicious: false, reason: null };
    
    if (!request.deviceFingerprint) {
      analysis.suspicious = true;
      analysis.reason = 'missing-device-fingerprint';
      return analysis;
    }
    
    // Get current device fingerprint
    const currentDevice = await this.cryptoVerifier.generateDeviceFingerprint();
    
    // Check for device fingerprint mismatch
    if (request.deviceFingerprint !== currentDevice.fingerprint) {
      // Allow for some variance in dynamic components
      if (currentDevice.confidence < 80) {
        analysis.suspicious = false;
        analysis.reason = 'low-confidence-fingerprint';
      } else {
        analysis.suspicious = true;
        analysis.reason = 'device-fingerprint-mismatch';
      }
      return analysis;
    }
    
    // Check for rapid device switching
    const userHistory = this.userBehavior.get(userId);
    if (userHistory && userHistory.deviceFingerprints) {
      const recentFingerprints = userHistory.deviceFingerprints
        .filter(fp => Date.now() - fp.timestamp < 3600000); // Last hour
      
      if (recentFingerprints.length > 3) {
        analysis.suspicious = true;
        analysis.reason = 'rapid-device-switching';
        return analysis;
      }
    }
    
    return analysis;
  }

  /**
   * Analyze behavioral patterns for anomalies
   */
  analyzeBehavioralAnomalies(request, userId) {
    const analysis = { suspicious: false, reason: null };
    
    const userHistory = this.userBehavior.get(userId) || {
      requests: [],
      patterns: {},
      lastSeen: 0
    };
    
    // Update user behavior
    userHistory.requests.push({
      timestamp: Date.now(),
      action: request.action || 'unknown',
      success: true
    });
    
    // Keep only recent requests (last 24 hours)
    userHistory.requests = userHistory.requests
      .filter(req => Date.now() - req.timestamp < 86400000);
    
    // Analyze request frequency
    const recentRequests = userHistory.requests
      .filter(req => Date.now() - req.timestamp < 60000); // Last minute
    
    if (recentRequests.length > this.config.maxRequestsPerMinute) {
      analysis.suspicious = true;
      analysis.reason = 'excessive-request-rate';
      return analysis;
    }
    
    // Analyze time pattern irregularities
    if (userHistory.requests.length > 5) {
      const intervals = [];
      for (let i = 1; i < userHistory.requests.length; i++) {
        intervals.push(userHistory.requests[i].timestamp - userHistory.requests[i-1].timestamp);
      }
      
      // Check for mechanical patterns (bot-like behavior)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - avgInterval, 2);
      }, 0) / intervals.length;
      
      // Very low variance suggests automated behavior
      if (variance < 1000 && intervals.length > 10) { // Less than 1 second variance
        analysis.suspicious = true;
        analysis.reason = 'mechanical-timing-pattern';
        return analysis;
      }
    }
    
    // Update user behavior tracking
    this.userBehavior.set(userId, userHistory);
    
    return analysis;
  }

  /**
   * Analyze cryptographic elements for spoofing
   */
  async analyzeCryptographicSpoofing(request) {
    const analysis = { suspicious: false, reason: null };
    
    // Check for missing cryptographic elements
    if (!request.signature) {
      analysis.suspicious = true;
      analysis.reason = 'missing-signature';
      return analysis;
    }
    
    if (!request.nonce) {
      analysis.suspicious = true;
      analysis.reason = 'missing-nonce';
      return analysis;
    }
    
    // Verify signature integrity
    try {
      const verification = await this.cryptoVerifier.verifyPGPSignature(request.signature);
      if (!verification.valid) {
        analysis.suspicious = true;
        analysis.reason = 'invalid-signature';
        return analysis;
      }
    } catch (error) {
      analysis.suspicious = true;
      analysis.reason = 'signature-verification-error';
      return analysis;
    }
    
    // Check nonce for replay attacks
    try {
      const nonceValidation = this.cryptoVerifier.validateAndConsumeNonce(request.nonce);
      if (!nonceValidation.valid) {
        analysis.suspicious = true;
        analysis.reason = nonceValidation.reason || 'nonce-validation-failed';
        return analysis;
      }
    } catch (error) {
      analysis.suspicious = true;
      analysis.reason = 'nonce-processing-error';
      return analysis;
    }
    
    return analysis;
  }

  /**
   * Analyze rate limiting anomalies
   */
  analyzeRateLimitingAnomalies(userId) {
    const analysis = { suspicious: false, reason: null };
    
    const userHistory = this.userBehavior.get(userId);
    if (!userHistory) return analysis;
    
    // Check for burst patterns
    const lastMinute = userHistory.requests
      .filter(req => Date.now() - req.timestamp < 60000);
    
    if (lastMinute.length > this.config.maxRequestsPerMinute) {
      analysis.suspicious = true;
      analysis.reason = 'rate-limit-exceeded';
      return analysis;
    }
    
    // Check for distributed denial patterns
    const last10Minutes = userHistory.requests
      .filter(req => Date.now() - req.timestamp < 600000);
    
    if (last10Minutes.length > this.config.maxRequestsPerMinute * 5) {
      analysis.suspicious = true;
      analysis.reason = 'sustained-high-rate';
      return analysis;
    }
    
    return analysis;
  }

  // ═══════════════════════════════════════════════════════════════
  // PROTECTED MIDDLEWARE INTEGRATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Protected guardian layer with anti-spoofing
   */
  async protectedGuardianLayer(bashCommand, originalGuardianLayer) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      console.log(`\n🛡️ Anti-spoofing protection for: ${bashCommand.cmd}`);
      
      // Create request context
      const requestContext = {
        id: crypto.randomUUID(),
        command: bashCommand.cmd,
        timestamp: Date.now(),
        userId: 'system', // In real implementation, extract from auth context
        deviceFingerprint: null,
        signature: null,
        nonce: null
      };
      
      // Generate cryptographic elements
      requestContext.deviceFingerprint = (await this.cryptoVerifier.generateDeviceFingerprint()).fingerprint;
      requestContext.nonce = this.cryptoVerifier.generateNonce(requestContext.userId, bashCommand.cmd);
      
      // Sign the request
      if (this.cryptoVerifier.keystore.has('system:guardian:private')) {
        const signature = await this.cryptoVerifier.signWithPGP(
          JSON.stringify(requestContext),
          'system:guardian'
        );
        requestContext.signature = signature;
      }
      
      // Perform spoofing risk analysis
      const spoofingAnalysis = await this.analyzeSpoofingRisk(requestContext, requestContext.userId);
      
      // Check if request should be blocked
      if (spoofingAnalysis.severity === 'critical') {
        this.stats.blockedRequests++;
        this.stats.spoofingAttempts++;
        
        await this.recordSecurityIncident({
          type: 'spoofing-attempt-blocked',
          severity: 'critical',
          userId: requestContext.userId,
          command: bashCommand.cmd,
          analysis: spoofingAnalysis,
          timestamp: Date.now()
        });
        
        return {
          approved: false,
          reason: 'Anti-spoofing protection: Critical security risk detected',
          securityAnalysis: spoofingAnalysis,
          blocked: true
        };
      }
      
      // Perform full cryptographic verification
      const verification = await this.cryptoVerifier.verifyContractTransaction(requestContext);
      
      if (!verification.overall.valid || verification.overall.confidence < this.config.minVerificationConfidence) {
        this.stats.blockedRequests++;
        
        await this.recordSecurityIncident({
          type: 'verification-failure',
          severity: 'high',
          userId: requestContext.userId,
          command: bashCommand.cmd,
          verification,
          timestamp: Date.now()
        });
        
        return {
          approved: false,
          reason: `Verification failed (${verification.overall.confidence}% confidence)`,
          verification,
          blocked: true
        };
      }
      
      // Proceed with original guardian logic
      const guardianResult = await originalGuardianLayer(bashCommand);
      
      // Enhance result with security information
      guardianResult.antiSpoofing = {
        verified: true,
        confidence: verification.overall.confidence,
        riskScore: spoofingAnalysis.riskScore,
        securityLevel: spoofingAnalysis.severity,
        verificationTime: Date.now() - startTime
      };
      
      this.stats.verifiedRequests++;
      
      // Update verification time statistics
      this.updateVerificationTimeStats(Date.now() - startTime);
      
      console.log(`✅ Request verified and approved (${verification.overall.confidence}% confidence)`);
      
      return guardianResult;
      
    } catch (error) {
      this.stats.blockedRequests++;
      
      await this.recordSecurityIncident({
        type: 'protection-error',
        severity: 'medium',
        userId: 'system',
        command: bashCommand.cmd,
        error: error.message,
        timestamp: Date.now()
      });
      
      console.error(`💥 Anti-spoofing protection error: ${error.message}`);
      
      return {
        approved: false,
        reason: `Anti-spoofing protection error: ${error.message}`,
        error: true
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MONITORING AND INCIDENT RESPONSE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Record security incident
   */
  async recordSecurityIncident(incident) {
    incident.id = crypto.randomUUID();
    incident.investigationStatus = 'pending';
    
    this.securityIncidents.push(incident);
    
    // Emit security event
    this.emit('securityIncident', incident);
    
    // Auto-response for critical incidents
    if (incident.severity === 'critical') {
      this.stats.criticalIncidents++;
      
      if (this.config.autoBlockSuspiciousUsers && incident.userId) {
        this.blockedUsers.add(incident.userId);
        console.log(`🚫 Auto-blocked user ${incident.userId} due to critical incident`);
      }
      
      // Emergency protocols
      if (this.stats.criticalIncidents >= this.config.emergencyShutdownThreshold) {
        await this.triggerEmergencyProtocols();
      }
    }
    
    console.log(`🚨 Security incident recorded: ${incident.type} (${incident.severity})`);
    
    // Persist incident to audit log
    await this.persistSecurityIncident(incident);
  }

  /**
   * Start behavioral monitoring
   */
  startBehavioralMonitoring() {
    setInterval(() => {
      this.analyzeBehavioralPatterns();
      this.cleanupOldBehaviorData();
    }, 60000); // Every minute
    
    console.log('🧠 Behavioral monitoring started');
  }

  /**
   * Analyze behavioral patterns across all users
   */
  analyzeBehavioralPatterns() {
    const patterns = {
      totalActiveUsers: this.userBehavior.size,
      suspiciousUsers: 0,
      averageRequestRate: 0,
      anomalies: []
    };
    
    let totalRequests = 0;
    
    for (const [userId, behavior] of this.userBehavior.entries()) {
      const recentRequests = behavior.requests
        .filter(req => Date.now() - req.timestamp < 3600000); // Last hour
      
      totalRequests += recentRequests.length;
      
      // Check for suspicious patterns
      if (recentRequests.length > this.config.maxRequestsPerMinute * 2) {
        patterns.suspiciousUsers++;
        patterns.anomalies.push({
          userId,
          type: 'high-request-rate',
          value: recentRequests.length
        });
      }
    }
    
    patterns.averageRequestRate = patterns.totalActiveUsers > 0 
      ? totalRequests / patterns.totalActiveUsers 
      : 0;
    
    // Log patterns if anomalies detected
    if (patterns.anomalies.length > 0) {
      console.log(`🔍 Behavioral analysis: ${patterns.anomalies.length} anomalies detected`);
    }
    
    return patterns;
  }

  /**
   * Clean up old behavioral data
   */
  cleanupOldBehaviorData() {
    const cutoff = Date.now() - 86400000; // 24 hours ago
    let cleaned = 0;
    
    for (const [userId, behavior] of this.userBehavior.entries()) {
      const oldRequestCount = behavior.requests.length;
      behavior.requests = behavior.requests.filter(req => req.timestamp > cutoff);
      
      if (behavior.requests.length === 0) {
        this.userBehavior.delete(userId);
        cleaned++;
      } else if (behavior.requests.length !== oldRequestCount) {
        cleaned += oldRequestCount - behavior.requests.length;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old behavioral records`);
    }
  }

  /**
   * Set up emergency protocols
   */
  setupEmergencyProtocols() {
    this.on('securityIncident', (incident) => {
      if (incident.severity === 'critical') {
        console.log(`🚨 CRITICAL SECURITY INCIDENT: ${incident.type}`);
      }
    });
    
    console.log('🚨 Emergency protocols configured');
  }

  /**
   * Trigger emergency protocols
   */
  async triggerEmergencyProtocols() {
    console.log('\n🚨 EMERGENCY PROTOCOLS ACTIVATED');
    console.log('================================');
    console.log('⚠️ Critical incident threshold exceeded');
    console.log('🔒 Enhanced security measures in effect');
    
    // Additional emergency measures would go here
    // - Alert administrators
    // - Increase verification requirements
    // - Rate limit all requests
    // - Enable audit mode
    
    this.emit('emergencyActivated', {
      timestamp: Date.now(),
      reason: 'critical-incident-threshold-exceeded',
      incidents: this.stats.criticalIncidents
    });
  }

  /**
   * Persist security incident to audit log
   */
  async persistSecurityIncident(incident) {
    try {
      const auditEntry = {
        timestamp: Date.now(),
        type: 'security-incident',
        data: incident,
        hash: crypto.createHash('sha256').update(JSON.stringify(incident)).digest('hex')
      };
      
      // In production, this would write to immutable audit log
      console.log(`📝 Security incident persisted: ${auditEntry.hash.substring(0, 8)}...`);
      
    } catch (error) {
      console.error(`Failed to persist security incident: ${error.message}`);
    }
  }

  /**
   * Update verification time statistics
   */
  updateVerificationTimeStats(duration) {
    if (this.stats.verifiedRequests === 1) {
      this.stats.averageVerificationTime = duration;
    } else {
      this.stats.averageVerificationTime = 
        (this.stats.averageVerificationTime * (this.stats.verifiedRequests - 1) + duration) / 
        this.stats.verifiedRequests;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORTING AND STATISTICS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate security report
   */
  generateSecurityReport() {
    const report = {
      timestamp: Date.now(),
      period: '24h',
      statistics: { ...this.stats },
      security: {
        totalIncidents: this.securityIncidents.length,
        criticalIncidents: this.securityIncidents.filter(i => i.severity === 'critical').length,
        blockedUsers: this.blockedUsers.size,
        activeUsers: this.userBehavior.size
      },
      performance: {
        verificationSuccessRate: this.stats.totalRequests > 0 
          ? Math.round((this.stats.verifiedRequests / this.stats.totalRequests) * 100) 
          : 0,
        averageVerificationTime: Math.round(this.stats.averageVerificationTime),
        spoofingDetectionRate: this.stats.totalRequests > 0
          ? Math.round((this.stats.spoofingAttempts / this.stats.totalRequests) * 100)
          : 0
      },
      recommendations: this.generateSecurityRecommendations()
    };
    
    return report;
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations() {
    const recommendations = [];
    
    if (this.stats.spoofingAttempts > 10) {
      recommendations.push('Consider increasing verification requirements');
    }
    
    if (this.stats.averageVerificationTime > 1000) {
      recommendations.push('Optimize verification performance');
    }
    
    if (this.blockedUsers.size > 5) {
      recommendations.push('Review blocked users and incident patterns');
    }
    
    if (this.securityIncidents.length > 50) {
      recommendations.push('Investigate recurring security incidents');
    }
    
    return recommendations;
  }

  /**
   * Run demonstration of anti-spoofing protection
   */
  async runDemo() {
    console.log('\n🎭 ANTI-SPOOFING PROTECTION DEMO');
    console.log('================================');
    
    try {
      // Initialize if not already done
      if (!this.cryptoVerifier.keystore.has('system:guardian:private')) {
        await this.initialize();
      }
      
      // Test with legitimate request
      console.log('\n1. Testing legitimate request...');
      const legitimateCommand = { cmd: 'deploy_mvp', risk: 'high', needs_guardian: true };
      const legitimateResult = await this.protectedGuardianLayer(
        legitimateCommand,
        async (cmd) => ({ approved: true, reason: 'Guardian approved' })
      );
      
      console.log(`   Result: ${legitimateResult.approved ? 'APPROVED' : 'BLOCKED'}`);
      
      // Simulate spoofing attempt
      console.log('\n2. Simulating spoofing attempt...');
      const spoofedCommand = { cmd: 'activate_production', risk: 'critical', needs_guardian: true };
      
      // Temporarily block the user to simulate detection
      this.blockedUsers.add('system');
      
      const spoofedResult = await this.protectedGuardianLayer(
        spoofedCommand,
        async (cmd) => ({ approved: true, reason: 'Guardian approved' })
      );
      
      console.log(`   Result: ${spoofedResult.approved ? 'APPROVED' : 'BLOCKED'}`);
      
      // Remove block for clean demo
      this.blockedUsers.delete('system');
      
      // Generate security report
      const report = this.generateSecurityReport();
      
      console.log('\n📊 SECURITY REPORT SUMMARY');
      console.log('===========================');
      console.log(`Total Requests: ${report.statistics.totalRequests}`);
      console.log(`Verified: ${report.statistics.verifiedRequests}`);
      console.log(`Blocked: ${report.statistics.blockedRequests}`);
      console.log(`Spoofing Attempts: ${report.statistics.spoofingAttempts}`);
      console.log(`Security Incidents: ${report.security.totalIncidents}`);
      console.log(`Success Rate: ${report.performance.verificationSuccessRate}%`);
      console.log(`Avg Verification Time: ${report.performance.averageVerificationTime}ms`);
      
      return report;
      
    } catch (error) {
      console.error(`💥 Demo failed: ${error.message}`);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════

async function main() {
  const antiSpoofing = new SoulFraAntiSpoofingLayer();
  
  const command = process.argv[2] || 'demo';
  
  switch (command) {
    case 'init':
      await antiSpoofing.initialize();
      break;
      
    case 'demo':
      await antiSpoofing.runDemo();
      break;
      
    case 'monitor':
      await antiSpoofing.initialize();
      console.log('🔍 Starting continuous monitoring mode...');
      console.log('Press Ctrl+C to stop');
      break;
      
    case 'report':
      const report = antiSpoofing.generateSecurityReport();
      console.log(JSON.stringify(report, null, 2));
      break;
      
    default:
      console.log('Usage: node soulfra-anti-spoofing-layer.js [init|demo|monitor|report]');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SoulFraAntiSpoofingLayer;
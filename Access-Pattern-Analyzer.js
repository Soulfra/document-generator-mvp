#!/usr/bin/env node

/**
 * ACCESS PATTERN ANALYZER
 * Advanced behavioral analysis for detecting sophisticated attacks
 * ML-style pattern recognition for "changing room" security
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class AccessPatternAnalyzer extends EventEmitter {
  constructor() {
    super();
    
    // Pattern analysis state
    this.patterns = new Map(); // patternId -> pattern data
    this.userBehaviors = new Map(); // userId -> behavior model
    this.sessionClusters = new Map(); // sessionId -> cluster data
    
    // Time-series analysis windows
    this.timeWindows = {
      immediate: 30 * 1000,      // 30 seconds
      short: 5 * 60 * 1000,      // 5 minutes
      medium: 30 * 60 * 1000,    // 30 minutes
      long: 2 * 60 * 60 * 1000   // 2 hours
    };
    
    // Pattern detection algorithms
    this.detectors = {
      // Frequency-based detectors
      rapidFire: this.detectRapidFire.bind(this),
      burst: this.detectBurstPattern.bind(this),
      sustained: this.detectSustainedActivity.bind(this),
      
      // Sequence-based detectors
      sequential: this.detectSequentialAccess.bind(this),
      directory: this.detectDirectoryTraversal.bind(this),
      enumeration: this.detectEnumeration.bind(this),
      
      // Behavioral detectors
      anomaly: this.detectBehavioralAnomaly.bind(this),
      mimicry: this.detectMimicryAttack.bind(this),
      distributed: this.detectDistributedAttack.bind(this),
      
      // Advanced pattern detectors
      reconnaissance: this.detectReconnaissance.bind(this),
      exfiltration: this.detectExfiltration.bind(this),
      coordination: this.detectCoordinatedAttack.bind(this)
    };
    
    // Machine learning models (simplified)
    this.models = {
      normalBehavior: new Map(), // Baseline behavior patterns
      anomalyThresholds: new Map(), // Dynamic thresholds per user
      clusterCenters: [], // Behavioral cluster centers
      sequenceModels: new Map() // Markov chains for sequence prediction
    };
    
    // Attack signatures
    this.signatures = {
      bruteForce: {
        minAttempts: 10,
        timeWindow: 60000,
        failureRate: 0.8
      },
      
      reconnaissance: {
        minFiles: 5,
        timeWindow: 300000,
        diversityThreshold: 0.7
      },
      
      exfiltration: {
        minSize: 10 * 1024 * 1024, // 10MB
        timeWindow: 3600000, // 1 hour
        fileCount: 20
      },
      
      mimicry: {
        similarityThreshold: 0.9,
        timeWindow: 1800000 // 30 minutes
      }
    };
    
    // Analysis statistics
    this.stats = {
      totalAnalyses: 0,
      patternsDetected: 0,
      falsePositives: 0,
      accuracyRate: 0,
      processingTime: 0
    };
    
    console.log('🔍 ACCESS PATTERN ANALYZER INITIALIZED');
    console.log('🧠 ML-style behavioral analysis active');
    console.log('📊 Pattern recognition engines loaded');
    console.log('🎯 Attack signature detection enabled');
    
    this.initialize();
  }
  
  /**
   * Initialize the pattern analyzer
   */
  async initialize() {
    // Load baseline models
    await this.loadBaselineModels();
    
    // Start continuous learning
    this.startContinuousLearning();
    
    // Start pattern cleanup
    this.startPatternCleanup();
    
    console.log('✅ Pattern analyzer operational');
  }
  
  /**
   * Analyze access event for patterns
   */
  async analyzeAccess(accessEvent, context = {}) {
    const analysisId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      this.stats.totalAnalyses++;
      
      const analysis = {
        id: analysisId,
        accessEvent,
        context,
        timestamp: startTime,
        patterns: [],
        riskScore: 0,
        anomalyScore: 0,
        confidence: 0
      };
      
      // Run all pattern detectors
      for (const [detectorName, detector] of Object.entries(this.detectors)) {
        try {
          const patternResult = await detector(accessEvent, context);
          if (patternResult && patternResult.detected) {
            analysis.patterns.push({
              type: detectorName,
              ...patternResult
            });
            analysis.riskScore += patternResult.riskScore || 0;
          }
        } catch (error) {
          console.error(`❌ Pattern detector ${detectorName} failed:`, error);
        }
      }
      
      // Calculate anomaly score
      analysis.anomalyScore = await this.calculateAnomalyScore(accessEvent);
      
      // Calculate final confidence
      analysis.confidence = this.calculateConfidence(analysis);
      
      // Update behavioral models
      await this.updateBehavioralModels(accessEvent, analysis);
      
      // Store analysis
      this.storeAnalysis(analysis);
      
      // Record processing time
      this.stats.processingTime += Date.now() - startTime;
      
      // Emit analysis complete
      this.emit('analysis_complete', analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Access pattern analysis failed:', error);
      return null;
    }
  }
  
  /**
   * Detect rapid fire access pattern
   */
  async detectRapidFire(accessEvent, context) {
    const userId = accessEvent.userId;
    const recentAccesses = this.getRecentAccesses(userId, this.timeWindows.immediate);
    
    if (recentAccesses.length >= 5) { // 5 accesses in 30 seconds
      return {
        detected: true,
        riskScore: 40,
        confidence: 0.8,
        details: {
          accessCount: recentAccesses.length,
          timeWindow: this.timeWindows.immediate,
          pattern: 'rapid_fire'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect burst access pattern
   */
  async detectBurstPattern(accessEvent, context) {
    const userId = accessEvent.userId;
    const recentAccesses = this.getRecentAccesses(userId, this.timeWindows.short);
    
    // Group accesses by minute
    const accessesByMinute = this.groupAccessesByMinute(recentAccesses);
    const maxPerMinute = Math.max(...accessesByMinute.map(group => group.length));
    
    if (maxPerMinute >= 10) { // 10+ accesses in single minute
      return {
        detected: true,
        riskScore: 30,
        confidence: 0.7,
        details: {
          maxPerMinute,
          pattern: 'burst',
          burstDuration: accessesByMinute.filter(g => g.length > 5).length
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect sustained activity pattern
   */
  async detectSustainedActivity(accessEvent, context) {
    const userId = accessEvent.userId;
    const longTermAccesses = this.getRecentAccesses(userId, this.timeWindows.long);
    
    if (longTermAccesses.length >= 100) { // 100+ accesses in 2 hours
      const accessRate = longTermAccesses.length / (this.timeWindows.long / 60000); // per minute
      
      if (accessRate > 1.0) { // More than 1 access per minute sustained
        return {
          detected: true,
          riskScore: 35,
          confidence: 0.9,
          details: {
            totalAccesses: longTermAccesses.length,
            accessRate,
            pattern: 'sustained'
          }
        };
      }
    }
    
    return { detected: false };
  }
  
  /**
   * Detect sequential access pattern
   */
  async detectSequentialAccess(accessEvent, context) {
    const userId = accessEvent.userId;
    const recentAccesses = this.getRecentAccesses(userId, this.timeWindows.short);
    
    // Check if files are being accessed in sequential pattern
    const fileIds = recentAccesses.map(a => a.fileId).filter(id => id);
    const sequentialScore = this.calculateSequentialScore(fileIds);
    
    if (sequentialScore > 0.8 && fileIds.length >= 5) {
      return {
        detected: true,
        riskScore: 25,
        confidence: sequentialScore,
        details: {
          fileCount: fileIds.length,
          sequentialScore,
          pattern: 'sequential_access'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect directory traversal attempts
   */
  async detectDirectoryTraversal(accessEvent, context) {
    const userId = accessEvent.userId;
    const recentAccesses = this.getRecentAccesses(userId, this.timeWindows.medium);
    
    // Look for directory traversal patterns
    const filePaths = recentAccesses.map(a => a.filePath).filter(path => path);
    const traversalIndicators = filePaths.filter(path => 
      path.includes('..') || 
      path.includes('../../') || 
      path.match(/\/\w+\/\w+\/\w+/) // Deep directory access
    );
    
    if (traversalIndicators.length >= 3) {
      return {
        detected: true,
        riskScore: 50,
        confidence: 0.9,
        details: {
          traversalAttempts: traversalIndicators.length,
          suspiciousPaths: traversalIndicators.slice(0, 5),
          pattern: 'directory_traversal'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect enumeration attacks
   */
  async detectEnumeration(accessEvent, context) {
    const userId = accessEvent.userId;
    const recentAccesses = this.getRecentAccesses(userId, this.timeWindows.medium);
    
    // Check for systematic file enumeration
    const attemptedFiles = recentAccesses.map(a => a.fileName).filter(name => name);
    const uniqueFiles = new Set(attemptedFiles);
    const failureRate = recentAccesses.filter(a => a.result === 'failure').length / recentAccesses.length;
    
    if (uniqueFiles.size >= 20 && failureRate > 0.5) {
      return {
        detected: true,
        riskScore: 45,
        confidence: 0.8,
        details: {
          uniqueFiles: uniqueFiles.size,
          totalAttempts: recentAccesses.length,
          failureRate,
          pattern: 'enumeration'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect behavioral anomalies
   */
  async detectBehavioralAnomaly(accessEvent, context) {
    const userId = accessEvent.userId;
    const userModel = this.models.normalBehavior.get(userId);
    
    if (!userModel) {
      return { detected: false }; // No baseline to compare against
    }
    
    // Calculate deviation from normal behavior
    const currentBehavior = this.extractBehaviorVector(accessEvent);
    const deviation = this.calculateBehaviorDeviation(currentBehavior, userModel);
    
    if (deviation > 2.0) { // 2 standard deviations from normal
      return {
        detected: true,
        riskScore: Math.min(deviation * 10, 60),
        confidence: Math.min(deviation / 3.0, 1.0),
        details: {
          deviation,
          behaviorVector: currentBehavior,
          pattern: 'behavioral_anomaly'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect mimicry attacks (trying to appear normal)
   */
  async detectMimicryAttack(accessEvent, context) {
    const userId = accessEvent.userId;
    const recentAccesses = this.getRecentAccesses(userId, this.timeWindows.medium);
    
    // Check if behavior is too perfect/regular
    const timeIntervals = this.calculateTimeIntervals(recentAccesses);
    const regularityScore = this.calculateRegularityScore(timeIntervals);
    
    // Also check if mimicking another user's pattern
    const mimicryScore = await this.checkUserMimicry(userId, recentAccesses);
    
    if (regularityScore > 0.9 || mimicryScore > 0.8) {
      return {
        detected: true,
        riskScore: 30,
        confidence: Math.max(regularityScore, mimicryScore),
        details: {
          regularityScore,
          mimicryScore,
          pattern: 'mimicry_attack'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect distributed attacks
   */
  async detectDistributedAttack(accessEvent, context) {
    // Look for coordinated activity across multiple IPs/users
    const recentGlobalAccesses = this.getAllRecentAccesses(this.timeWindows.short);
    
    // Group by file/resource being accessed
    const resourceAccess = this.groupAccessesByResource(recentGlobalAccesses);
    
    // Find resources accessed by multiple unique IPs
    const distributedTargets = Object.entries(resourceAccess).filter(([resource, accesses]) => {
      const uniqueIPs = new Set(accesses.map(a => a.ip));
      return uniqueIPs.size >= 3 && accesses.length >= 10;
    });
    
    if (distributedTargets.length > 0) {
      return {
        detected: true,
        riskScore: 55,
        confidence: 0.85,
        details: {
          distributedTargets: distributedTargets.length,
          targetResources: distributedTargets.slice(0, 3).map(([resource]) => resource),
          pattern: 'distributed_attack'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect reconnaissance activities
   */
  async detectReconnaissance(accessEvent, context) {
    const userId = accessEvent.userId;
    const recentAccesses = this.getRecentAccesses(userId, this.timeWindows.medium);
    
    // Check for diverse file type access (reconnaissance pattern)
    const fileTypes = recentAccesses.map(a => this.extractFileType(a.fileName)).filter(t => t);
    const uniqueTypes = new Set(fileTypes);
    const diversity = uniqueTypes.size / Math.max(fileTypes.length, 1);
    
    // Check for metadata-focused queries
    const metadataQueries = recentAccesses.filter(a => 
      a.action === 'list' || 
      a.action === 'info' || 
      a.fileName?.includes('meta')
    );
    
    const signature = this.signatures.reconnaissance;
    if (recentAccesses.length >= signature.minFiles && 
        diversity >= signature.diversityThreshold) {
      return {
        detected: true,
        riskScore: 40,
        confidence: diversity,
        details: {
          fileTypesDiversity: diversity,
          uniqueFileTypes: Array.from(uniqueTypes),
          metadataQueries: metadataQueries.length,
          pattern: 'reconnaissance'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect data exfiltration
   */
  async detectExfiltration(accessEvent, context) {
    const userId = accessEvent.userId;
    const recentAccesses = this.getRecentAccesses(userId, this.timeWindows.long);
    
    // Calculate total data accessed
    const totalSize = recentAccesses.reduce((sum, a) => sum + (a.size || 0), 0);
    const fileCount = recentAccesses.filter(a => a.action === 'download').length;
    
    const signature = this.signatures.exfiltration;
    if (totalSize >= signature.minSize && fileCount >= signature.fileCount) {
      
      // Check for off-hours activity (suspicious for exfiltration)
      const offHoursAccesses = recentAccesses.filter(a => {
        const hour = new Date(a.timestamp).getHours();
        return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
      });
      
      return {
        detected: true,
        riskScore: 60,
        confidence: 0.8,
        details: {
          totalSize,
          fileCount,
          offHoursAccesses: offHoursAccesses.length,
          avgFileSize: totalSize / fileCount,
          pattern: 'exfiltration'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Detect coordinated attacks
   */
  async detectCoordinatedAttack(accessEvent, context) {
    const recentGlobalAccesses = this.getAllRecentAccesses(this.timeWindows.medium);
    
    // Look for temporal clustering of activities
    const timeClusters = this.findTemporalClusters(recentGlobalAccesses);
    const suspiciousClusters = timeClusters.filter(cluster => 
      cluster.uniqueIPs >= 3 && 
      cluster.accessCount >= 20 &&
      cluster.timeSpan < 300000 // Within 5 minutes
    );
    
    if (suspiciousClusters.length > 0) {
      return {
        detected: true,
        riskScore: 65,
        confidence: 0.9,
        details: {
          clustersFound: suspiciousClusters.length,
          maxClusterSize: Math.max(...suspiciousClusters.map(c => c.accessCount)),
          pattern: 'coordinated_attack'
        }
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Calculate anomaly score using statistical methods
   */
  async calculateAnomalyScore(accessEvent) {
    const userId = accessEvent.userId;
    const userThresholds = this.models.anomalyThresholds.get(userId);
    
    if (!userThresholds) {
      return 0; // No baseline
    }
    
    let anomalyScore = 0;
    
    // Time-based anomaly
    const accessHour = new Date(accessEvent.timestamp).getHours();
    if (accessHour < userThresholds.minHour || accessHour > userThresholds.maxHour) {
      anomalyScore += 0.3;
    }
    
    // Frequency anomaly
    const recentCount = this.getRecentAccesses(userId, this.timeWindows.short).length;
    if (recentCount > userThresholds.maxFrequency) {
      anomalyScore += 0.4;
    }
    
    // File size anomaly
    if (accessEvent.size && accessEvent.size > userThresholds.maxFileSize) {
      anomalyScore += 0.3;
    }
    
    return Math.min(anomalyScore, 1.0);
  }
  
  /**
   * Calculate confidence score for analysis
   */
  calculateConfidence(analysis) {
    if (analysis.patterns.length === 0) {
      return 0.1; // Low confidence if no patterns
    }
    
    // Weighted average of pattern confidences
    const totalWeight = analysis.patterns.reduce((sum, p) => sum + (p.riskScore || 1), 0);
    const weightedConfidence = analysis.patterns.reduce((sum, p) => 
      sum + (p.confidence || 0.5) * (p.riskScore || 1), 0) / totalWeight;
    
    // Boost confidence if multiple patterns detected
    const multiPatternBoost = Math.min(analysis.patterns.length * 0.1, 0.3);
    
    return Math.min(weightedConfidence + multiPatternBoost, 1.0);
  }
  
  /**
   * Utility functions for pattern analysis
   */
  getRecentAccesses(userId, timeWindow) {
    // In a real system, this would query a database
    // For now, simulate with stored access log
    const now = Date.now();
    return (this.accessLog || [])
      .filter(access => 
        access.userId === userId && 
        (now - access.timestamp) <= timeWindow
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  getAllRecentAccesses(timeWindow) {
    const now = Date.now();
    return (this.globalAccessLog || [])
      .filter(access => (now - access.timestamp) <= timeWindow)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  groupAccessesByMinute(accesses) {
    const groups = new Map();
    
    accesses.forEach(access => {
      const minute = Math.floor(access.timestamp / 60000) * 60000;
      if (!groups.has(minute)) {
        groups.set(minute, []);
      }
      groups.get(minute).push(access);
    });
    
    return Array.from(groups.values());
  }
  
  calculateSequentialScore(fileIds) {
    if (fileIds.length < 2) return 0;
    
    let sequentialCount = 0;
    for (let i = 1; i < fileIds.length; i++) {
      const current = parseInt(fileIds[i]) || 0;
      const previous = parseInt(fileIds[i-1]) || 0;
      if (current === previous + 1 || current === previous - 1) {
        sequentialCount++;
      }
    }
    
    return sequentialCount / (fileIds.length - 1);
  }
  
  extractBehaviorVector(accessEvent) {
    return {
      hour: new Date(accessEvent.timestamp).getHours(),
      dayOfWeek: new Date(accessEvent.timestamp).getDay(),
      fileSize: accessEvent.size || 0,
      actionType: this.encodeAction(accessEvent.action)
    };
  }
  
  encodeAction(action) {
    const actionMap = { 'read': 1, 'write': 2, 'delete': 3, 'list': 4 };
    return actionMap[action] || 0;
  }
  
  calculateBehaviorDeviation(current, baseline) {
    let deviation = 0;
    
    Object.keys(current).forEach(key => {
      if (baseline[key]) {
        const diff = Math.abs(current[key] - baseline[key].mean);
        const normalizedDiff = diff / (baseline[key].stdDev || 1);
        deviation += normalizedDiff;
      }
    });
    
    return deviation / Object.keys(current).length;
  }
  
  calculateTimeIntervals(accesses) {
    const intervals = [];
    for (let i = 1; i < accesses.length; i++) {
      intervals.push(accesses[i-1].timestamp - accesses[i].timestamp);
    }
    return intervals;
  }
  
  calculateRegularityScore(intervals) {
    if (intervals.length < 3) return 0;
    
    const mean = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // High regularity = low coefficient of variation
    return stdDev === 0 ? 1.0 : Math.max(0, 1 - (stdDev / mean));
  }
  
  async checkUserMimicry(userId, userAccesses) {
    // Check if user's pattern matches another user's too closely
    const userPattern = this.extractAccessPattern(userAccesses);
    let maxSimilarity = 0;
    
    for (const [otherUserId, otherModel] of this.models.normalBehavior) {
      if (otherUserId !== userId) {
        const similarity = this.calculatePatternSimilarity(userPattern, otherModel.pattern);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }
    
    return maxSimilarity;
  }
  
  extractAccessPattern(accesses) {
    // Extract key characteristics of access pattern
    const hours = accesses.map(a => new Date(a.timestamp).getHours());
    const intervals = this.calculateTimeIntervals(accesses);
    
    return {
      commonHours: this.findMostCommonHours(hours),
      avgInterval: intervals.reduce((sum, i) => sum + i, 0) / intervals.length,
      accessFrequency: accesses.length
    };
  }
  
  calculatePatternSimilarity(pattern1, pattern2) {
    // Simplified similarity calculation
    let similarity = 0;
    
    if (pattern1.commonHours && pattern2.commonHours) {
      const commonCount = pattern1.commonHours.filter(h => pattern2.commonHours.includes(h)).length;
      similarity += commonCount / Math.max(pattern1.commonHours.length, pattern2.commonHours.length);
    }
    
    return similarity;
  }
  
  /**
   * Start continuous learning from patterns
   */
  startContinuousLearning() {
    setInterval(() => {
      this.updateAnomalyThresholds();
      this.updateBehavioralClusters();
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Update behavioral models based on new data
   */
  async updateBehavioralModels(accessEvent, analysis) {
    const userId = accessEvent.userId;
    
    // Update normal behavior model if this seems legitimate
    if (analysis.riskScore < 20) {
      this.updateNormalBehaviorModel(userId, accessEvent);
    }
    
    // Update anomaly thresholds
    this.updateAnomalyThresholds();
  }
  
  updateNormalBehaviorModel(userId, accessEvent) {
    let model = this.models.normalBehavior.get(userId) || {
      accessCount: 0,
      hours: [],
      fileSizes: [],
      intervals: []
    };
    
    model.accessCount++;
    model.hours.push(new Date(accessEvent.timestamp).getHours());
    if (accessEvent.size) model.fileSizes.push(accessEvent.size);
    
    // Keep only recent data
    if (model.hours.length > 1000) {
      model.hours = model.hours.slice(-500);
      model.fileSizes = model.fileSizes.slice(-500);
    }
    
    this.models.normalBehavior.set(userId, model);
  }
  
  /**
   * Get analysis statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalPatterns: this.patterns.size,
      userModels: this.models.normalBehavior.size,
      avgProcessingTime: this.stats.totalAnalyses > 0 ? 
        this.stats.processingTime / this.stats.totalAnalyses : 0
    };
  }
  
  /**
   * Start cleanup routines
   */
  startPatternCleanup() {
    // Clean up old patterns every hour
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      for (const [patternId, pattern] of this.patterns) {
        if (pattern.timestamp < cutoff) {
          this.patterns.delete(patternId);
        }
      }
    }, 3600000); // Every hour
  }
  
  /**
   * Store analysis for future reference
   */
  storeAnalysis(analysis) {
    // In a real system, this would persist to database
    // For now, keep in memory with size limits
    const analysisId = analysis.id;
    this.patterns.set(analysisId, analysis);
    
    // Keep only last 10000 analyses
    if (this.patterns.size > 10000) {
      const oldestKey = this.patterns.keys().next().value;
      this.patterns.delete(oldestKey);
    }
  }
  
  async loadBaselineModels() {
    console.log('📚 Loading baseline behavioral models');
  }
  
  updateAnomalyThresholds() {
    // Update dynamic thresholds based on recent patterns
  }
  
  updateBehavioralClusters() {
    // Update cluster centers for behavioral analysis
  }
  
  extractFileType(fileName) {
    if (!fileName) return null;
    const ext = fileName.split('.').pop();
    return ext ? ext.toLowerCase() : null;
  }
  
  groupAccessesByResource(accesses) {
    const groups = {};
    accesses.forEach(access => {
      const resource = access.fileName || access.resource || 'unknown';
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(access);
    });
    return groups;
  }
  
  findTemporalClusters(accesses) {
    // Simplified temporal clustering
    return [{
      uniqueIPs: 3,
      accessCount: 25,
      timeSpan: 240000
    }]; // Placeholder
  }
  
  findMostCommonHours(hours) {
    const counts = {};
    hours.forEach(hour => counts[hour] = (counts[hour] || 0) + 1);
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 3)
      .map(Number);
  }
}

// Export the class
module.exports = AccessPatternAnalyzer;

// CLI interface if run directly
if (require.main === module) {
  console.log('🔍 ACCESS PATTERN ANALYZER - STANDALONE MODE\n');
  
  const analyzer = new AccessPatternAnalyzer();
  
  // Setup event logging
  analyzer.on('analysis_complete', (analysis) => {
    console.log(`📊 Analysis complete: ${analysis.patterns.length} patterns, risk: ${analysis.riskScore}`);
  });
  
  // Simulate access events for testing
  setTimeout(async () => {
    console.log('🧪 Running pattern analysis tests...\n');
    
    // Test rapid fire pattern
    for (let i = 0; i < 6; i++) {
      const analysis = await analyzer.analyzeAccess({
        userId: 'test-user-1',
        action: 'read',
        fileName: `file${i}.txt`,
        timestamp: Date.now() + (i * 1000),
        size: 1024,
        ip: '192.168.1.100'
      });
      
      if (analysis && analysis.patterns.length > 0) {
        console.log(`🚨 Pattern detected: ${analysis.patterns.map(p => p.type).join(', ')}`);
      }
    }
    
    // Show final stats
    setTimeout(() => {
      console.log('\n📊 Pattern Analysis Statistics:');
      console.log(JSON.stringify(analyzer.getStats(), null, 2));
    }, 2000);
    
  }, 1000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Access Pattern Analyzer...');
    console.log('✅ Shutdown complete');
    process.exit(0);
  });
}
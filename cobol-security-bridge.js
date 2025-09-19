#!/usr/bin/env node

/**
 * COBOL SECURITY BRIDGE
 * "Reptilian Brain" security layer for database protection
 * Implements primitive survival-based security decisions
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CobolSecurityBridge extends EventEmitter {
    constructor() {
        super();
        
        // Reptilian brain configuration
        this.reptilianConfig = {
            mode: 'SURVIVAL',
            threatSensitivity: 'HIGH',
            territorialRadius: 1000, // meters
            resourceGuarding: true,
            primitiveLogic: true
        };
        
        // Threat assessment levels
        this.threatLevels = {
            NONE: 0,
            LOW: 1,
            MEDIUM: 5,
            HIGH: 8,
            CRITICAL: 10
        };
        
        // Known threat patterns (reptilian memory)
        this.threatPatterns = {
            // SQL injection patterns
            'DROP TABLE': this.threatLevels.CRITICAL,
            'DELETE FROM': this.threatLevels.HIGH,
            'UNION SELECT': this.threatLevels.HIGH,
            
            // System access patterns
            'rm -rf': this.threatLevels.CRITICAL,
            'sudo': this.threatLevels.MEDIUM,
            'passwd': this.threatLevels.HIGH,
            
            // Data access patterns
            'SELECT *': this.threatLevels.MEDIUM,
            'BACKUP': this.threatLevels.LOW,
            'RESTORE': this.threatLevels.HIGH,
            
            // Gaming cheats (allowed but monitored)
            'HESOYAM': this.threatLevels.LOW,
            'IDDQD': this.threatLevels.LOW,
            'CAL_OMNISCIENCE': this.threatLevels.MEDIUM
        };
        
        // Territorial zones (device/location based)
        this.territories = new Map();
        
        // Resource allocation
        this.resources = {
            cpu: { total: 100, used: 0, critical: 80 },
            memory: { total: 8192, used: 0, critical: 6144 },
            database: { connections: 10, used: 0, critical: 8 },
            network: { bandwidth: 1000, used: 0, critical: 800 }
        };
        
        // Security contexts
        this.securityContexts = new Map();
        
        // Primitive learning (basic pattern recognition)
        this.primitiveMemory = {
            successfulPatterns: new Map(),
            failedPatterns: new Map(),
            suspiciousDevices: new Set(),
            trustedDevices: new Set()
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🧠 Initializing COBOL Security Bridge (Reptilian Brain)...');
        
        // Start primitive monitoring loops
        this.startThreatMonitoring();
        this.startResourceMonitoring();
        this.startTerritorialPatrol();
        
        console.log('✅ Reptilian Brain Security active - Primitive threat detection enabled');
    }
    
    /**
     * Main security check - Reptilian brain decision making
     */
    async performSecurityCheck(request) {
        const { command, params, deviceId, sessionId, location } = request;
        
        console.log(`🧠 Reptilian Brain analyzing: ${command}`);
        
        // Step 1: Immediate threat assessment (fight or flight)
        const threatAssessment = this.assessThreat(command, params);
        
        // Step 2: Territorial analysis (is this in our territory?)
        const territorialCheck = this.checkTerritory(deviceId, location);
        
        // Step 3: Resource competition check (do we have enough resources?)
        const resourceCheck = this.checkResources(command);
        
        // Step 4: Primitive pattern matching (have we seen this before?)
        const patternCheck = this.checkPatterns(command, params, deviceId);
        
        // Step 5: Survival decision (reptilian logic)
        const decision = this.makeSurvivalDecision({
            threat: threatAssessment,
            territory: territorialCheck,
            resources: resourceCheck,
            patterns: patternCheck
        });
        
        // Log decision for primitive learning
        this.recordDecision(request, decision);
        
        return decision;
    }
    
    /**
     * Immediate threat assessment - Fight or flight response
     */
    assessThreat(command, params) {
        let threatLevel = this.threatLevels.NONE;
        let threats = [];
        
        // Check command against known threat patterns
        const commandUpper = command.toUpperCase();
        
        for (const [pattern, level] of Object.entries(this.threatPatterns)) {
            if (commandUpper.includes(pattern)) {
                threatLevel = Math.max(threatLevel, level);
                threats.push({ pattern, level });
            }
        }
        
        // Check parameters for embedded threats
        if (params) {
            const paramString = JSON.stringify(params).toUpperCase();
            for (const [pattern, level] of Object.entries(this.threatPatterns)) {
                if (paramString.includes(pattern)) {
                    threatLevel = Math.max(threatLevel, level);
                    threats.push({ pattern, level, source: 'params' });
                }
            }
        }
        
        // Primitive escalation - if multiple small threats, become big threat
        if (threats.length > 3) {
            threatLevel = Math.min(this.threatLevels.CRITICAL, threatLevel + 2);
            threats.push({ pattern: 'MULTIPLE_THREATS', level: 2, source: 'escalation' });
        }
        
        return {
            level: threatLevel,
            severity: this.getThreatSeverity(threatLevel),
            threats,
            primitiveResponse: this.getPrimitiveResponse(threatLevel)
        };
    }
    
    getThreatSeverity(level) {
        if (level >= this.threatLevels.CRITICAL) return 'CRITICAL';
        if (level >= this.threatLevels.HIGH) return 'HIGH';
        if (level >= this.threatLevels.MEDIUM) return 'MEDIUM';
        if (level >= this.threatLevels.LOW) return 'LOW';
        return 'NONE';
    }
    
    getPrimitiveResponse(level) {
        if (level >= this.threatLevels.CRITICAL) return 'ATTACK';
        if (level >= this.threatLevels.HIGH) return 'DEFEND';
        if (level >= this.threatLevels.MEDIUM) return 'CAUTION';
        if (level >= this.threatLevels.LOW) return 'WATCH';
        return 'IGNORE';
    }
    
    /**
     * Territorial analysis - Is this in our domain?
     */
    checkTerritory(deviceId, location) {
        const territory = this.territories.get(deviceId);
        
        if (!territory) {
            // New device - mark as unknown territory
            this.territories.set(deviceId, {
                id: deviceId,
                firstSeen: Date.now(),
                location: location || 'UNKNOWN',
                trustLevel: 0,
                encounters: 1,
                status: 'UNKNOWN'
            });
            
            return {
                status: 'UNKNOWN_TERRITORY',
                trustLevel: 0,
                authorized: false,
                reason: 'First encounter with device'
            };
        }
        
        // Update encounter count
        territory.encounters++;
        territory.lastSeen = Date.now();
        
        // Build trust over time (primitive learning)
        if (territory.encounters > 10 && territory.trustLevel < 5) {
            territory.trustLevel++;
        }
        
        // Check if device is in trusted territory
        const authorized = territory.trustLevel >= 3 || 
                          this.primitiveMemory.trustedDevices.has(deviceId);
        
        // Check for suspicious behavior
        if (this.primitiveMemory.suspiciousDevices.has(deviceId)) {
            territory.trustLevel = Math.max(0, territory.trustLevel - 2);
        }
        
        return {
            status: authorized ? 'AUTHORIZED_TERRITORY' : 'UNAUTHORIZED_TERRITORY',
            trustLevel: territory.trustLevel,
            authorized,
            encounters: territory.encounters,
            reason: authorized ? 'Device in trusted territory' : 'Device not trusted'
        };
    }
    
    /**
     * Resource competition check - Primitive resource guarding
     */
    checkResources(command) {
        const resourceCosts = {
            'MATH.CALCULATE': { cpu: 5, memory: 100 },
            'DATA.ENCRYPT': { cpu: 10, memory: 200, network: 50 },
            'DATA.DECRYPT': { cpu: 15, memory: 300, network: 50 },
            'SEC.COBOL': { cpu: 20, memory: 500, database: 1 },
            'GAME.JOIN': { cpu: 30, memory: 1000, network: 100 },
            'SYS.STATUS': { cpu: 1, memory: 50 }
        };
        
        const cost = resourceCosts[command] || { cpu: 5, memory: 100 };
        const available = {};
        const conflicts = [];
        
        // Check each resource
        for (const [resource, needed] of Object.entries(cost)) {
            const current = this.resources[resource];
            if (!current) continue;
            
            const afterUsage = current.used + needed;
            available[resource] = {
                needed,
                available: current.total - current.used,
                afterUsage,
                critical: afterUsage >= current.critical
            };
            
            if (afterUsage > current.total) {
                conflicts.push({
                    resource,
                    needed,
                    available: current.total - current.used,
                    overflow: afterUsage - current.total
                });
            }
        }
        
        // Primitive resource guarding - reject if too many conflicts
        const guardResources = conflicts.length > 0 || 
                              Object.values(available).some(r => r.critical);
        
        return {
            allowed: !guardResources,
            cost,
            available,
            conflicts,
            primitiveResponse: guardResources ? 'GUARD_RESOURCES' : 'ALLOW_ACCESS'
        };
    }
    
    /**
     * Pattern matching - Primitive memory
     */
    checkPatterns(command, params, deviceId) {
        const signature = this.createSignature(command, params);
        
        // Check against successful patterns
        const successCount = this.primitiveMemory.successfulPatterns.get(signature) || 0;
        
        // Check against failed patterns
        const failureCount = this.primitiveMemory.failedPatterns.get(signature) || 0;
        
        // Simple pattern scoring
        const successRate = successCount / Math.max(1, successCount + failureCount);
        const confidence = Math.min(1, (successCount + failureCount) / 10);
        
        // Check device behavior patterns
        const deviceSuspicious = this.primitiveMemory.suspiciousDevices.has(deviceId);
        const deviceTrusted = this.primitiveMemory.trustedDevices.has(deviceId);
        
        return {
            signature,
            successRate,
            confidence,
            successCount,
            failureCount,
            deviceTrusted,
            deviceSuspicious,
            recommendation: this.getPatternRecommendation(successRate, confidence, deviceTrusted, deviceSuspicious)
        };
    }
    
    getPatternRecommendation(successRate, confidence, trusted, suspicious) {
        if (suspicious) return 'DENY';
        if (trusted && successRate > 0.8) return 'ALLOW';
        if (confidence > 0.5 && successRate > 0.7) return 'ALLOW';
        if (successRate < 0.3 && confidence > 0.3) return 'DENY';
        return 'CAUTION';
    }
    
    createSignature(command, params) {
        const paramHash = params ? crypto.createHash('md5').update(JSON.stringify(params)).digest('hex').substr(0, 8) : 'NONE';
        return `${command}:${paramHash}`;
    }
    
    /**
     * Final survival decision - Reptilian logic
     */
    makeSurvivalDecision(analysis) {
        const { threat, territory, resources, patterns } = analysis;
        
        // Critical threat - immediate rejection (survival instinct)
        if (threat.level >= this.threatLevels.CRITICAL) {
            return {
                allowed: false,
                reason: 'CRITICAL_THREAT_DETECTED',
                action: 'IMMEDIATE_BLOCK',
                analysis,
                primitiveDecision: 'FIGHT_RESPONSE'
            };
        }
        
        // Resource competition - reject if resources critical
        if (!resources.allowed && resources.conflicts.length > 0) {
            return {
                allowed: false,
                reason: 'RESOURCE_COMPETITION',
                action: 'RESOURCE_GUARD',
                analysis,
                primitiveDecision: 'RESOURCE_PROTECT'
            };
        }
        
        // Unknown territory with high threat - cautious rejection
        if (!territory.authorized && threat.level >= this.threatLevels.MEDIUM) {
            return {
                allowed: false,
                reason: 'UNKNOWN_TERRITORY_WITH_THREAT',
                action: 'TERRITORIAL_DEFENSE',
                analysis,
                primitiveDecision: 'TERRITORIAL_GUARD'
            };
        }
        
        // Pattern-based rejection
        if (patterns.recommendation === 'DENY') {
            return {
                allowed: false,
                reason: 'NEGATIVE_PATTERN_MATCH',
                action: 'PATTERN_BLOCK',
                analysis,
                primitiveDecision: 'LEARNED_AVOIDANCE'
            };
        }
        
        // Suspicious device - allow but monitor
        if (territory.authorized && patterns.deviceSuspicious) {
            return {
                allowed: true,
                reason: 'AUTHORIZED_BUT_SUSPICIOUS',
                action: 'ALLOW_WITH_MONITORING',
                analysis,
                primitiveDecision: 'CAUTIOUS_ALLOW',
                monitoring: true
            };
        }
        
        // Default allow for trusted territory with low threat
        return {
            allowed: true,
            reason: 'PASSED_SECURITY_CHECKS',
            action: 'ALLOW',
            analysis,
            primitiveDecision: 'SAFE_ALLOW'
        };
    }
    
    /**
     * Record decision for primitive learning
     */
    recordDecision(request, decision) {
        const signature = this.createSignature(request.command, request.params);
        
        // Update pattern memory based on decision
        if (decision.allowed) {
            const count = this.primitiveMemory.successfulPatterns.get(signature) || 0;
            this.primitiveMemory.successfulPatterns.set(signature, count + 1);
        } else {
            const count = this.primitiveMemory.failedPatterns.get(signature) || 0;
            this.primitiveMemory.failedPatterns.set(signature, count + 1);
        }
        
        // Update device trust
        if (request.deviceId) {
            if (decision.allowed) {
                // Successful interaction - build trust
                this.primitiveMemory.suspiciousDevices.delete(request.deviceId);
                
                // Add to trusted after multiple successes
                const territory = this.territories.get(request.deviceId);
                if (territory && territory.trustLevel >= 5) {
                    this.primitiveMemory.trustedDevices.add(request.deviceId);
                }
            } else {
                // Failed interaction - mark as suspicious
                this.primitiveMemory.suspiciousDevices.add(request.deviceId);
                this.primitiveMemory.trustedDevices.delete(request.deviceId);
            }
        }
        
        // Emit security event
        this.emit('security_decision', {
            request,
            decision,
            timestamp: Date.now()
        });
    }
    
    /**
     * Monitoring loops
     */
    startThreatMonitoring() {
        setInterval(() => {
            // Decay suspicious device flags over time (primitive forgetting)
            if (this.primitiveMemory.suspiciousDevices.size > 0) {
                const devicesToCheck = Array.from(this.primitiveMemory.suspiciousDevices);
                devicesToCheck.forEach(deviceId => {
                    const territory = this.territories.get(deviceId);
                    if (territory && Date.now() - territory.lastSeen > 24 * 60 * 60 * 1000) {
                        // Remove suspicion after 24 hours of inactivity
                        this.primitiveMemory.suspiciousDevices.delete(deviceId);
                    }
                });
            }
        }, 60000); // Check every minute
    }
    
    startResourceMonitoring() {
        setInterval(() => {
            // Simulate resource usage decay
            Object.values(this.resources).forEach(resource => {
                if (resource.used > 0) {
                    resource.used = Math.max(0, resource.used - 1);
                }
            });
        }, 5000); // Update every 5 seconds
    }
    
    startTerritorialPatrol() {
        setInterval(() => {
            // Clean up old territories
            const now = Date.now();
            const oldTerritories = [];
            
            this.territories.forEach((territory, deviceId) => {
                if (now - territory.lastSeen > 7 * 24 * 60 * 60 * 1000) {
                    oldTerritories.push(deviceId);
                }
            });
            
            oldTerritories.forEach(deviceId => {
                this.territories.delete(deviceId);
                console.log(`🧠 Forgotten old territory: ${deviceId}`);
            });
        }, 60 * 60 * 1000); // Check every hour
    }
    
    /**
     * Public API
     */
    getSecurityStatus() {
        return {
            mode: this.reptilianConfig.mode,
            threats: {
                patterns: Object.keys(this.threatPatterns).length,
                levels: Object.keys(this.threatLevels)
            },
            territories: {
                known: this.territories.size,
                trusted: this.primitiveMemory.trustedDevices.size,
                suspicious: this.primitiveMemory.suspiciousDevices.size
            },
            resources: this.resources,
            memory: {
                successful: this.primitiveMemory.successfulPatterns.size,
                failed: this.primitiveMemory.failedPatterns.size
            }
        };
    }
    
    addThreatPattern(pattern, level) {
        this.threatPatterns[pattern] = level;
        console.log(`🧠 Learned new threat pattern: ${pattern} (level: ${level})`);
    }
    
    trustDevice(deviceId) {
        this.primitiveMemory.trustedDevices.add(deviceId);
        this.primitiveMemory.suspiciousDevices.delete(deviceId);
        console.log(`🧠 Device marked as trusted: ${deviceId}`);
    }
    
    suspectDevice(deviceId) {
        this.primitiveMemory.suspiciousDevices.add(deviceId);
        this.primitiveMemory.trustedDevices.delete(deviceId);
        console.log(`🧠 Device marked as suspicious: ${deviceId}`);
    }
}

module.exports = CobolSecurityBridge;
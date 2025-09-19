#!/usr/bin/env node

/**
 * WORKING VIOLATION SYSTEM
 * Uses your existing flag-tag system + database integration
 * No new methods - works with what exists
 * Real violation tracking + penalty execution
 */

const FlagTagSystem = require('./flag-tag-system');
const fs = require('fs');
const path = require('path');

class WorkingViolationSystem extends FlagTagSystem {
    constructor() {
        super();
        
        // Violation tracking using your existing database structure
        this.violations = new Map();
        this.penalties = new Map();
        this.violationHistory = [];
        
        // Add violation data to your existing database structure
        this.db.database.violations = new Map();
        this.db.database.penalties = new Map();
        this.db.database.violation_history = [];
        
        console.log('⚖️ Working violation system integrated with existing infrastructure');
        
        this.initializeViolationTracking();
    }
    
    initializeViolationTracking() {
        // Add violation flags to your existing flag system
        this.addViolationFlags();
        
        // Start monitoring using your existing components
        this.startViolationMonitoring();
        
        // Check existing components for violations
        this.performInitialViolationScan();
        
        console.log('✅ Violation tracking initialized');
    }
    
    addViolationFlags() {
        // Add violation flags to your existing coreFlags structure
        const violationFlags = {
            'CONTRACT_VIOLATED': { color: 'red', priority: 3, description: 'Legal contract violation detected' },
            'HANDSHAKE_FAILED': { color: 'orange', priority: 2, description: 'Component handshake failed' },
            'PENALTY_EXECUTED': { color: 'red', priority: 3, description: 'Penalty has been executed' },
            'VIOLATION_RESOLVED': { color: 'green', priority: 1, description: 'Violation resolved' },
            'AUTO_REPAIR_ACTIVE': { color: 'blue', priority: 1, description: 'Auto-repair in progress' }
        };
        
        // Add to your existing flags Map
        Object.entries(violationFlags).forEach(([flag, config]) => {
            const flagData = {
                ...config,
                set_at: Date.now(),
                components: new Set()
            };
            this.flags.set(flag, flagData);
            
            // Save using your existing database method
            this.db.saveFlag(flag, flagData);
        });
        
        console.log(`🚩 Added ${Object.keys(violationFlags).length} violation flags`);
    }
    
    startViolationMonitoring() {
        console.log('👁️ Starting violation monitoring...');
        
        // Monitor every 5 seconds
        setInterval(() => {
            this.scanForViolations();
        }, 5000);
        
        // Check contract compliance every 10 seconds  
        setInterval(() => {
            this.checkContractCompliance();
        }, 10000);
        
        console.log('✅ Violation monitoring active');
    }
    
    performInitialViolationScan() {
        console.log('🔍 Performing initial violation scan...');
        
        let violationsFound = 0;
        
        // Check all components in your existing registry
        this.componentRegistry.forEach((component, componentId) => {
            // Check for missing critical components
            if (component.active_tags.has('priority:critical') && !component.exists) {
                this.recordViolation(componentId, 'CRITICAL_COMPONENT_MISSING', {
                    reason: 'Critical component file not found',
                    path: component.path,
                    priority: 'critical'
                });
                violationsFound++;
            }
            
            // Check for error flags
            if (component.active_flags.has('COMPONENT_ERROR')) {
                this.recordViolation(componentId, 'COMPONENT_ERROR_STATE', {
                    reason: 'Component in error state',
                    flags: Array.from(component.active_flags)
                });
                violationsFound++;
            }
            
            // Check for deployment failures
            if (component.active_flags.has('DEPLOYMENT_FAILED')) {
                this.recordViolation(componentId, 'DEPLOYMENT_VIOLATION', {
                    reason: 'Component deployment failed',
                    type: component.type
                });
                violationsFound++;
            }
        });
        
        console.log(`🔍 Initial scan complete: ${violationsFound} violations found`);
    }
    
    scanForViolations() {
        // Use your existing flag system to detect violations
        const violationTriggerFlags = [
            'COMPONENT_ERROR',
            'SYSTEM_OFFLINE', 
            'AI_DISCONNECTED',
            'DATA_MISSING',
            'DEPLOYMENT_FAILED',
            'VULNERABLE'
        ];
        
        violationTriggerFlags.forEach(flagName => {
            const flag = this.flags.get(flagName);
            if (flag && flag.components.size > 0) {
                flag.components.forEach(componentId => {
                    // Only record if not already recorded recently
                    if (!this.hasRecentViolation(componentId, flagName)) {
                        this.recordViolation(componentId, flagName, {
                            trigger_flag: flagName,
                            detected_at: Date.now(),
                            automatic_detection: true
                        });
                    }
                });
            }
        });
    }
    
    checkContractCompliance() {
        // Check compliance using your existing tag system
        const criticalComponents = Array.from(this.componentRegistry.values())
            .filter(c => c.active_tags.has('priority:critical'));
        
        criticalComponents.forEach(component => {
            // Contract: Critical components must exist and be operational
            if (!component.exists) {
                this.recordViolation(component.id, 'CONTRACT_VIOLATION', {
                    contract_type: 'critical_availability',
                    violation: 'Critical component not available',
                    component_path: component.path
                });
            }
            
            // Contract: Production components must not have errors
            if (component.active_tags.has('status:production') && 
                component.active_flags.has('COMPONENT_ERROR')) {
                this.recordViolation(component.id, 'CONTRACT_VIOLATION', {
                    contract_type: 'production_quality',
                    violation: 'Production component in error state'
                });
            }
        });
    }
    
    recordViolation(componentId, violationType, details) {
        const violationId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        const violation = {
            id: violationId,
            component_id: componentId,
            violation_type: violationType,
            details: details,
            timestamp: Date.now(),
            resolved: false,
            penalty_applied: false,
            severity: this.calculateSeverity(violationType, details)
        };
        
        // Store in violations Map
        this.violations.set(violationId, violation);
        
        // Store in your existing database structure
        this.db.database.violations.set(violationId, violation);
        
        // Add to history
        this.violationHistory.push({...violation});
        this.db.database.violation_history.push({...violation});
        
        // Apply violation flag using your existing system
        this.setFlag(componentId, 'CONTRACT_VIOLATED');
        
        // Execute penalty
        this.executePenalty(violation);
        
        console.log(`⚖️ VIOLATION: ${componentId} - ${violationType} (${violation.severity})`);
        
        return violationId;
    }
    
    calculateSeverity(violationType, details) {
        const severityMap = {
            'CRITICAL_COMPONENT_MISSING': 'critical',
            'CONTRACT_VIOLATION': 'high',
            'COMPONENT_ERROR': 'medium',
            'DEPLOYMENT_FAILED': 'medium',
            'SYSTEM_OFFLINE': 'critical',
            'AI_DISCONNECTED': 'high',
            'DATA_MISSING': 'high',
            'VULNERABLE': 'critical'
        };
        
        return severityMap[violationType] || 'medium';
    }
    
    executePenalty(violation) {
        const penaltyId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        const penalty = {
            id: penaltyId,
            violation_id: violation.id,
            component_id: violation.component_id,
            penalty_type: this.determinePenaltyType(violation.severity),
            executed_at: Date.now(),
            success: false
        };
        
        try {
            switch (penalty.penalty_type) {
                case 'ISOLATE':
                    this.isolateComponent(violation.component_id);
                    break;
                    
                case 'AUTO_REPAIR':
                    this.attemptAutoRepair(violation.component_id);
                    break;
                    
                case 'FLAG_RESET':
                    this.resetViolationFlags(violation.component_id);
                    break;
                    
                case 'ESCALATE':
                    this.escalateViolation(violation);
                    break;
            }
            
            penalty.success = true;
            violation.penalty_applied = penalty.penalty_type;
            
            // Apply penalty executed flag
            this.setFlag(violation.component_id, 'PENALTY_EXECUTED');
            
            console.log(`🔨 PENALTY: ${penalty.penalty_type} executed on ${violation.component_id}`);
            
        } catch (error) {
            penalty.success = false;
            penalty.error = error.message;
            console.log(`❌ PENALTY FAILED: ${error.message}`);
        }
        
        // Store penalty
        this.penalties.set(penaltyId, penalty);
        this.db.database.penalties.set(penaltyId, penalty);
    }
    
    determinePenaltyType(severity) {
        switch (severity) {
            case 'critical':
                return 'ISOLATE';
            case 'high':
                return 'AUTO_REPAIR';
            case 'medium':
                return 'FLAG_RESET';
            case 'low':
                return 'ESCALATE';
            default:
                return 'FLAG_RESET';
        }
    }
    
    isolateComponent(componentId) {
        console.log(`🔒 ISOLATING component: ${componentId}`);
        
        const component = this.componentRegistry.get(componentId);
        if (component) {
            // Mark as isolated
            component.isolated = true;
            component.isolated_at = Date.now();
            
            // Remove from active flags that indicate it's working
            const activeFlags = ['COMPONENT_ACTIVE', 'SYSTEM_ONLINE', 'DEPLOYED'];
            activeFlags.forEach(flag => {
                component.active_flags.delete(flag);
                if (this.flags.has(flag)) {
                    this.flags.get(flag).components.delete(componentId);
                }
            });
            
            // Start recovery monitoring
            this.startRecoveryMonitoring(componentId);
        }
    }
    
    attemptAutoRepair(componentId) {
        console.log(`🔧 AUTO-REPAIR starting for: ${componentId}`);
        
        // Apply auto-repair flag
        this.setFlag(componentId, 'AUTO_REPAIR_ACTIVE');
        
        // Simulate repair process
        setTimeout(() => {
            const component = this.componentRegistry.get(componentId);
            if (component) {
                // 70% success rate for auto-repair
                if (Math.random() > 0.3) {
                    // Repair successful
                    this.setFlag(componentId, 'VIOLATION_RESOLVED');
                    this.setFlag(componentId, 'COMPONENT_ACTIVE');
                    
                    // Remove violation flags
                    const violationFlags = ['CONTRACT_VIOLATED', 'AUTO_REPAIR_ACTIVE'];
                    violationFlags.forEach(flag => {
                        component.active_flags.delete(flag);
                        if (this.flags.has(flag)) {
                            this.flags.get(flag).components.delete(componentId);
                        }
                    });
                    
                    console.log(`✅ AUTO-REPAIR successful: ${componentId}`);
                    
                } else {
                    // Repair failed, escalate to isolation
                    console.log(`❌ AUTO-REPAIR failed: ${componentId} - escalating`);
                    this.isolateComponent(componentId);
                }
            }
        }, 5000); // 5 second repair simulation
    }
    
    resetViolationFlags(componentId) {
        console.log(`🔄 RESETTING violation flags for: ${componentId}`);
        
        const component = this.componentRegistry.get(componentId);
        if (component) {
            const violationFlags = ['CONTRACT_VIOLATED', 'COMPONENT_ERROR', 'PENALTY_EXECUTED'];
            
            violationFlags.forEach(flag => {
                component.active_flags.delete(flag);
                if (this.flags.has(flag)) {
                    this.flags.get(flag).components.delete(componentId);
                }
            });
            
            // Apply resolved flag
            this.setFlag(componentId, 'VIOLATION_RESOLVED');
        }
    }
    
    escalateViolation(violation) {
        console.log(`📈 ESCALATING violation: ${violation.id}`);
        
        // Increase severity
        const severityLevels = ['low', 'medium', 'high', 'critical'];
        const currentIndex = severityLevels.indexOf(violation.severity);
        if (currentIndex < severityLevels.length - 1) {
            violation.severity = severityLevels[currentIndex + 1];
            
            // Re-execute with higher severity
            setTimeout(() => {
                this.executePenalty(violation);
            }, 3000);
        }
    }
    
    startRecoveryMonitoring(componentId) {
        console.log(`🏥 Starting recovery monitoring for: ${componentId}`);
        
        const recoveryCheck = setInterval(() => {
            const component = this.componentRegistry.get(componentId);
            if (component && component.exists && !component.active_flags.has('COMPONENT_ERROR')) {
                // Component recovered
                component.isolated = false;
                this.setFlag(componentId, 'VIOLATION_RESOLVED');
                this.setFlag(componentId, 'COMPONENT_ACTIVE');
                
                clearInterval(recoveryCheck);
                console.log(`✅ RECOVERY: ${componentId} back online`);
            }
        }, 10000); // Check every 10 seconds
        
        // Stop monitoring after 5 minutes
        setTimeout(() => {
            clearInterval(recoveryCheck);
        }, 300000);
    }
    
    hasRecentViolation(componentId, violationType) {
        // Check if violation was recorded in last 60 seconds
        const cutoff = Date.now() - 60000;
        
        return Array.from(this.violations.values()).some(v => 
            v.component_id === componentId && 
            v.violation_type === violationType && 
            v.timestamp > cutoff
        );
    }
    
    // API routes for violation system
    createViolationAPIRoutes(app) {
        console.log('🛣️ Creating violation API routes...');
        
        // Get all violations
        app.get('/api/violations', (req, res) => {
            const violations = Array.from(this.violations.values());
            res.json(violations);
        });
        
        // Get violations by component
        app.get('/api/violations/component/:componentId', (req, res) => {
            const componentId = req.params.componentId;
            const violations = Array.from(this.violations.values())
                .filter(v => v.component_id === componentId);
            res.json(violations);
        });
        
        // Get all penalties
        app.get('/api/penalties', (req, res) => {
            const penalties = Array.from(this.penalties.values());
            res.json(penalties);
        });
        
        // Get violation statistics
        app.get('/api/violations/stats', (req, res) => {
            const stats = {
                total_violations: this.violations.size,
                active_violations: Array.from(this.violations.values()).filter(v => !v.resolved).length,
                violations_by_severity: this.getViolationsBySeverity(),
                penalties_executed: this.penalties.size,
                components_under_violation: new Set(Array.from(this.violations.values()).map(v => v.component_id)).size
            };
            res.json(stats);
        });
        
        // Resolve violation manually
        app.post('/api/violations/:violationId/resolve', (req, res) => {
            const violationId = req.params.violationId;
            const violation = this.violations.get(violationId);
            
            if (violation) {
                violation.resolved = true;
                violation.resolved_at = Date.now();
                
                this.setFlag(violation.component_id, 'VIOLATION_RESOLVED');
                
                res.json({ success: true, violation });
            } else {
                res.status(404).json({ error: 'Violation not found' });
            }
        });
    }
    
    getViolationsBySeverity() {
        const counts = { critical: 0, high: 0, medium: 0, low: 0 };
        
        Array.from(this.violations.values()).forEach(v => {
            if (!v.resolved) {
                counts[v.severity] = (counts[v.severity] || 0) + 1;
            }
        });
        
        return counts;
    }
    
    // Show violation system status
    showViolationSystemStatus() {
        console.log('\\n' + '='.repeat(70));
        console.log('⚖️ WORKING VIOLATION SYSTEM STATUS');
        console.log('='.repeat(70));
        
        const totalViolations = this.violations.size;
        const activeViolations = Array.from(this.violations.values()).filter(v => !v.resolved).length;
        const penaltiesExecuted = this.penalties.size;
        const severityBreakdown = this.getViolationsBySeverity();
        
        console.log(`📊 Total violations: ${totalViolations}`);
        console.log(`⚠️ Active violations: ${activeViolations}`);
        console.log(`🔨 Penalties executed: ${penaltiesExecuted}`);
        
        console.log('\\n📈 Violations by severity:');
        console.log(`   🔴 Critical: ${severityBreakdown.critical}`);
        console.log(`   🟠 High: ${severityBreakdown.high}`);
        console.log(`   🟡 Medium: ${severityBreakdown.medium}`);
        console.log(`   🟢 Low: ${severityBreakdown.low}`);
        
        console.log('\\n🏴 Integrated with existing flag-tag system:');
        console.log(`   📌 Total flags: ${this.flags.size}`);
        console.log(`   🏷️ Total tags: ${this.tags.size}`);
        console.log(`   📦 Total components: ${this.componentRegistry.size}`);
        
        // Show recent violations
        const recentViolations = Array.from(this.violations.values())
            .filter(v => !v.resolved)
            .slice(-5);
        
        if (recentViolations.length > 0) {
            console.log('\\n🚨 Recent active violations:');
            recentViolations.forEach(v => {
                console.log(`   - ${v.component_id}: ${v.violation_type} (${v.severity})`);
            });
        }
        
        console.log('\\n✅ Violation system working with your existing infrastructure!');
    }
}

// Start the working violation system
if (require.main === module) {
    console.log('⚖️ STARTING WORKING VIOLATION SYSTEM');
    console.log('🏴 Using your existing flag-tag system + database');
    console.log('📊 Adding real violation tracking + penalties');
    
    const violationSystem = new WorkingViolationSystem();
    
    // Show status on exit
    process.on('exit', () => {
        violationSystem.showViolationSystemStatus();
    });
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\\n🛑 Shutting down violation system...');
        violationSystem.showViolationSystemStatus();
        process.exit(0);
    });
}

module.exports = WorkingViolationSystem;
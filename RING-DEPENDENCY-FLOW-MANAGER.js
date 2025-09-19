#!/usr/bin/env node

/**
 * 🔄 RING DEPENDENCY FLOW MANAGER
 * Ring 0 (Core) system - Ensures proper dependency flow and Ring 0 independence
 * Validates, monitors, and enforces Ring-based architectural constraints
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class RingDependencyFlowManager extends EventEmitter {
    constructor() {
        super();
        
        // Ring 0 - No dependencies, pure architectural enforcement
        this.dependencyMap = new Map();
        this.violationHistory = new Map();
        this.systemRegistry = new Map();
        this.dependencyRules = new Map();
        
        // Ring architecture rules
        this.ringRules = {
            0: {
                name: 'Ring 0 - Core/Backend',
                dependencies_allowed: [], // Ring 0 can depend on NOTHING
                can_be_used_by: [0, 1, 2], // All rings can use Ring 0
                characteristics: ['no_ui', 'no_external_apis', 'pure_logic', 'data_storage'],
                violation_severity: 'CRITICAL' // Ring 0 violations are critical
            },
            1: {
                name: 'Ring 1 - Logic/Processing', 
                dependencies_allowed: [0], // Ring 1 can only depend on Ring 0
                can_be_used_by: [1, 2], // Ring 1 and Ring 2 can use Ring 1
                characteristics: ['business_logic', 'processing', 'validation', 'orchestration'],
                violation_severity: 'HIGH'
            },
            2: {
                name: 'Ring 2 - Frontend/UI',
                dependencies_allowed: [0, 1], // Ring 2 can depend on Ring 0 and Ring 1
                can_be_used_by: [2], // Only Ring 2 can use Ring 2 (no circular deps)
                characteristics: ['user_interface', 'presentation', 'visualization', 'interaction'],
                violation_severity: 'MEDIUM'
            }
        };
        
        // Dependency flow patterns
        this.allowedFlows = [
            'Ring 0 → Ring 1', // Core provides to Logic
            'Ring 0 → Ring 2', // Core provides to UI (direct access allowed)
            'Ring 1 → Ring 2'  // Logic provides to UI
        ];
        
        this.forbiddenFlows = [
            'Ring 1 → Ring 0', // Logic cannot modify Core
            'Ring 2 → Ring 0', // UI cannot modify Core  
            'Ring 2 → Ring 1'  // UI cannot modify Logic (must go through proper channels)
        ];
        
        console.log('🔄 Ring Dependency Flow Manager initialized (Ring 0)');
        this.initializeDependencyRules();
    }
    
    /**
     * Initialize dependency validation rules
     */
    initializeDependencyRules() {
        // Ring 0 independence rules
        this.addDependencyRule('ring_0_independence', {
            description: 'Ring 0 systems must have zero dependencies',
            validator: (systemId, dependencies) => {
                const system = this.systemRegistry.get(systemId);
                if (system && system.ring === 0 && dependencies.length > 0) {
                    return {
                        valid: false,
                        reason: `Ring 0 system '${systemId}' cannot have dependencies: ${dependencies.join(', ')}`,
                        severity: 'CRITICAL'
                    };
                }
                return { valid: true };
            }
        });
        
        // Cross-ring dependency rules
        this.addDependencyRule('cross_ring_flow', {
            description: 'Dependencies must follow Ring flow rules',
            validator: (systemId, dependencies) => {
                const system = this.systemRegistry.get(systemId);
                if (!system) return { valid: true };
                
                const systemRing = system.ring;
                const allowedRings = this.ringRules[systemRing].dependencies_allowed;
                
                for (const depId of dependencies) {
                    const depSystem = this.systemRegistry.get(depId);
                    if (depSystem && !allowedRings.includes(depSystem.ring)) {
                        return {
                            valid: false,
                            reason: `Ring ${systemRing} system '${systemId}' cannot depend on Ring ${depSystem.ring} system '${depId}'`,
                            severity: this.ringRules[systemRing].violation_severity
                        };
                    }
                }
                return { valid: true };
            }
        });
        
        // Circular dependency detection
        this.addDependencyRule('circular_dependencies', {
            description: 'Prevent circular dependency chains',
            validator: (systemId, dependencies) => {
                return this.detectCircularDependencies(systemId, dependencies);
            }
        });
        
        // Ring characteristic validation
        this.addDependencyRule('ring_characteristics', {
            description: 'Systems must match their Ring characteristics',
            validator: (systemId, dependencies) => {
                return this.validateRingCharacteristics(systemId);
            }
        });
        
        console.log(`📋 Initialized ${this.dependencyRules.size} dependency validation rules`);
    }
    
    /**
     * Register a system with its Ring and dependencies
     */
    registerSystem(systemConfig) {
        const { id, ring, dependencies = [], type, characteristics = [] } = systemConfig;
        
        const system = {
            id,
            ring,
            type,
            dependencies,
            characteristics,
            registered_at: Date.now(),
            last_validated: null,
            violation_count: 0
        };
        
        this.systemRegistry.set(id, system);
        this.dependencyMap.set(id, dependencies);
        
        // Validate immediately upon registration
        const validation = this.validateSystem(id);
        
        this.emit('system_registered', system, validation);
        console.log(`📦 Registered Ring ${ring} system: ${id} ${validation.valid ? '✅' : '❌'}`);
        
        if (!validation.valid) {
            console.log(`   ⚠️ Violations: ${validation.violations.length}`);
            validation.violations.forEach(v => console.log(`      • ${v.reason}`));
        }
        
        return validation;
    }
    
    /**
     * Add a dependency validation rule
     */
    addDependencyRule(ruleId, rule) {
        this.dependencyRules.set(ruleId, {
            id: ruleId,
            description: rule.description,
            validator: rule.validator,
            created_at: Date.now(),
            violations: 0
        });
    }
    
    /**
     * Validate a system against all dependency rules
     */
    validateSystem(systemId) {
        const system = this.systemRegistry.get(systemId);
        const dependencies = this.dependencyMap.get(systemId) || [];
        
        if (!system) {
            return {
                valid: false,
                reason: `System '${systemId}' not registered`,
                violations: []
            };
        }
        
        const violations = [];
        
        // Run all validation rules
        this.dependencyRules.forEach((rule, ruleId) => {
            const result = rule.validator(systemId, dependencies);
            
            if (!result.valid) {
                const violation = {
                    rule_id: ruleId,
                    rule_description: rule.description,
                    reason: result.reason,
                    severity: result.severity || 'MEDIUM',
                    timestamp: Date.now()
                };
                
                violations.push(violation);
                rule.violations++;
                
                this.recordViolation(systemId, violation);
            }
        });
        
        system.last_validated = Date.now();
        system.violation_count = violations.length;
        
        const isValid = violations.length === 0;
        
        this.emit('system_validated', systemId, isValid, violations);
        
        return {
            valid: isValid,
            system_id: systemId,
            ring: system.ring,
            violations: violations,
            dependency_count: dependencies.length,
            validation_timestamp: Date.now()
        };
    }
    
    /**
     * Validate all registered systems
     */
    validateAllSystems() {
        console.log('\n🔍 FULL SYSTEM VALIDATION');
        console.log('==========================\n');
        
        const results = {
            total_systems: this.systemRegistry.size,
            valid_systems: 0,
            systems_with_violations: 0,
            critical_violations: 0,
            high_violations: 0,
            medium_violations: 0,
            validation_details: []
        };
        
        this.systemRegistry.forEach((system, systemId) => {
            const validation = this.validateSystem(systemId);
            
            if (validation.valid) {
                results.valid_systems++;
                console.log(`✅ Ring ${system.ring}: ${systemId}`);
            } else {
                results.systems_with_violations++;
                console.log(`❌ Ring ${system.ring}: ${systemId} (${validation.violations.length} violations)`);
                
                validation.violations.forEach(violation => {
                    console.log(`   • ${violation.severity}: ${violation.reason}`);
                    
                    switch (violation.severity) {
                        case 'CRITICAL': results.critical_violations++; break;
                        case 'HIGH': results.high_violations++; break;
                        case 'MEDIUM': results.medium_violations++; break;
                    }
                });
            }
            
            results.validation_details.push(validation);
        });
        
        console.log(`\n📊 VALIDATION SUMMARY`);
        console.log(`=====================`);
        console.log(`Total Systems: ${results.total_systems}`);
        console.log(`Valid Systems: ${results.valid_systems}`);
        console.log(`Systems with Violations: ${results.systems_with_violations}`);
        console.log(`Critical Violations: ${results.critical_violations}`);
        console.log(`High Violations: ${results.high_violations}`);
        console.log(`Medium Violations: ${results.medium_violations}`);
        
        this.emit('full_validation_complete', results);
        
        return results;
    }
    
    /**
     * Detect circular dependencies
     */
    detectCircularDependencies(systemId, dependencies, visited = new Set(), path = []) {
        if (visited.has(systemId)) {
            const cycleStart = path.indexOf(systemId);
            const cycle = path.slice(cycleStart).concat([systemId]);
            
            return {
                valid: false,
                reason: `Circular dependency detected: ${cycle.join(' → ')}`,
                severity: 'HIGH'
            };
        }
        
        visited.add(systemId);
        path.push(systemId);
        
        for (const depId of dependencies) {
            const depDependencies = this.dependencyMap.get(depId) || [];
            const result = this.detectCircularDependencies(depId, depDependencies, visited, path);
            
            if (!result.valid) {
                return result;
            }
        }
        
        visited.delete(systemId);
        path.pop();
        
        return { valid: true };
    }
    
    /**
     * Validate system matches Ring characteristics
     */
    validateRingCharacteristics(systemId) {
        const system = this.systemRegistry.get(systemId);
        if (!system) return { valid: true };
        
        const ringCharacteristics = this.ringRules[system.ring].characteristics;
        const systemCharacteristics = system.characteristics || [];
        
        // Check for forbidden characteristics
        const violations = [];
        
        if (system.ring === 0) {
            // Ring 0 specific validations
            if (systemCharacteristics.includes('ui_component')) {
                violations.push('Ring 0 systems cannot have UI components');
            }
            if (systemCharacteristics.includes('external_api')) {
                violations.push('Ring 0 systems cannot depend on external APIs');
            }
            if (systemCharacteristics.includes('user_interaction')) {
                violations.push('Ring 0 systems cannot handle direct user interaction');
            }
        }
        
        if (violations.length > 0) {
            return {
                valid: false,
                reason: `Ring ${system.ring} characteristic violations: ${violations.join(', ')}`,
                severity: 'HIGH'
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Record a dependency violation
     */
    recordViolation(systemId, violation) {
        if (!this.violationHistory.has(systemId)) {
            this.violationHistory.set(systemId, []);
        }
        
        this.violationHistory.get(systemId).push(violation);
        
        this.emit('violation_recorded', systemId, violation);
    }
    
    /**
     * Get dependency flow visualization
     */
    generateDependencyFlowVisualization() {
        const flow = {
            rings: {
                0: { name: 'Ring 0 - Core/Backend', systems: [], dependencies: [] },
                1: { name: 'Ring 1 - Logic/Processing', systems: [], dependencies: [] },
                2: { name: 'Ring 2 - Frontend/UI', systems: [], dependencies: [] }
            },
            flows: [],
            violations: []
        };
        
        // Organize systems by ring
        this.systemRegistry.forEach((system, systemId) => {
            flow.rings[system.ring].systems.push({
                id: systemId,
                type: system.type,
                dependencies: this.dependencyMap.get(systemId) || []
            });
        });
        
        // Generate flow connections
        this.systemRegistry.forEach((system, systemId) => {
            const dependencies = this.dependencyMap.get(systemId) || [];
            
            dependencies.forEach(depId => {
                const depSystem = this.systemRegistry.get(depId);
                if (depSystem) {
                    const flowDescription = `Ring ${depSystem.ring} → Ring ${system.ring}`;
                    const isAllowed = this.allowedFlows.some(allowed => 
                        flowDescription.includes(allowed.replace(' → ', ' → '))
                    );
                    
                    flow.flows.push({
                        from: { id: depId, ring: depSystem.ring },
                        to: { id: systemId, ring: system.ring },
                        description: flowDescription,
                        allowed: isAllowed
                    });
                    
                    if (!isAllowed) {
                        flow.violations.push({
                            from: depId,
                            to: systemId,
                            reason: `Invalid flow: ${flowDescription}`
                        });
                    }
                }
            });
        });
        
        return flow;
    }
    
    /**
     * Get Ring 0 independence report
     */
    getRing0IndependenceReport() {
        const ring0Systems = [];
        const violations = [];
        
        this.systemRegistry.forEach((system, systemId) => {
            if (system.ring === 0) {
                const dependencies = this.dependencyMap.get(systemId) || [];
                const isIndependent = dependencies.length === 0;
                
                ring0Systems.push({
                    id: systemId,
                    type: system.type,
                    independent: isIndependent,
                    dependencies: dependencies
                });
                
                if (!isIndependent) {
                    violations.push({
                        system: systemId,
                        dependencies: dependencies,
                        severity: 'CRITICAL',
                        reason: 'Ring 0 system has dependencies'
                    });
                }
            }
        });
        
        return {
            total_ring0_systems: ring0Systems.length,
            independent_systems: ring0Systems.filter(s => s.independent).length,
            systems_with_dependencies: ring0Systems.filter(s => !s.independent).length,
            independence_percentage: Math.round(
                (ring0Systems.filter(s => s.independent).length / ring0Systems.length) * 100
            ),
            systems: ring0Systems,
            violations: violations,
            report_generated_at: Date.now()
        };
    }
    
    /**
     * Export dependency analysis
     */
    exportDependencyAnalysis() {
        const analysis = {
            dependency_flow_rules: this.ringRules,
            system_registry: Array.from(this.systemRegistry.entries()),
            dependency_map: Array.from(this.dependencyMap.entries()),
            validation_rules: Array.from(this.dependencyRules.entries()),
            violation_history: Array.from(this.violationHistory.entries()),
            flow_visualization: this.generateDependencyFlowVisualization(),
            ring0_independence: this.getRing0IndependenceReport(),
            generated_at: Date.now()
        };
        
        const filePath = path.join(__dirname, 'RING-DEPENDENCY-ANALYSIS.json');
        fs.writeFileSync(filePath, JSON.stringify(analysis, null, 2));
        
        console.log(`\n📊 Dependency analysis exported to: ${filePath}`);
        return analysis;
    }
    
    /**
     * Monitor system for dependency changes
     */
    startDependencyMonitoring(intervalMs = 30000) {
        console.log(`🔄 Starting dependency monitoring (${intervalMs}ms intervals)`);
        
        const monitoringInterval = setInterval(() => {
            const validationResults = this.validateAllSystems();
            
            if (validationResults.critical_violations > 0) {
                console.log(`🚨 CRITICAL: ${validationResults.critical_violations} Ring 0 independence violations detected!`);
                this.emit('critical_violations_detected', validationResults);
            }
            
        }, intervalMs);
        
        this.emit('monitoring_started', intervalMs);
        return monitoringInterval;
    }
}

// Auto-run if executed directly
if (require.main === module) {
    console.log('🔄 RING DEPENDENCY FLOW MANAGER');
    console.log('=================================\n');
    
    const flowManager = new RingDependencyFlowManager();
    
    // Register existing systems from Ring Architecture Map
    console.log('📦 Registering existing systems...\n');
    
    // Ring 0 Systems (Core/Backend)
    flowManager.registerSystem({
        id: 'blamechain_core',
        ring: 0,
        type: 'core_system',
        dependencies: [], // Ring 0 - no dependencies
        characteristics: ['pure_logic', 'component_registry']
    });
    
    flowManager.registerSystem({
        id: 'kingdom_authority',
        ring: 0,
        type: 'permission_system',
        dependencies: [], // Ring 0 - no dependencies
        characteristics: ['data_storage', 'user_hierarchy']
    });
    
    flowManager.registerSystem({
        id: 'unified_character_database',
        ring: 0,
        type: 'data_storage',
        dependencies: [], // Ring 0 - no dependencies (MBTI integration is Ring 0 to Ring 0)
        characteristics: ['data_storage', 'pure_logic']
    });
    
    flowManager.registerSystem({
        id: 'mbti_personality_core',
        ring: 0,
        type: 'personality_system',
        dependencies: [], // Ring 0 - no dependencies
        characteristics: ['pure_logic', 'behavioral_analysis']
    });
    
    // Ring 1 Systems (Logic/Processing)
    flowManager.registerSystem({
        id: 'multi_ring_character_evolution',
        ring: 1,
        type: 'game_logic',
        dependencies: ['blamechain_core', 'kingdom_authority'], // Can depend on Ring 0
        characteristics: ['business_logic', 'character_evolution']
    });
    
    flowManager.registerSystem({
        id: 'boss_character_integration',
        ring: 1,
        type: 'game_logic',
        dependencies: ['kingdom_authority', 'unified_character_database'], // Can depend on Ring 0
        characteristics: ['business_logic', 'ai_processing']
    });
    
    flowManager.registerSystem({
        id: 'ai_orchestration_layer',
        ring: 1,
        type: 'ai_processing',
        dependencies: ['unified_character_database'], // Can depend on Ring 0
        characteristics: ['processing', 'ai_routing']
    });
    
    // Ring 2 Systems (Frontend/UI)
    flowManager.registerSystem({
        id: 'castle_crashers_hex_world',
        ring: 2,
        type: 'game_ui',
        dependencies: ['kingdom_authority', 'multi_ring_character_evolution'], // Can depend on Ring 0 + Ring 1
        characteristics: ['user_interface', 'visualization']
    });
    
    flowManager.registerSystem({
        id: 'selfie_pixel_interface',
        ring: 2,
        type: 'user_interface',
        dependencies: ['unified_character_database', 'ai_orchestration_layer'], // Can depend on Ring 0 + Ring 1
        characteristics: ['user_interface', 'file_upload']
    });
    
    // Test a Ring 0 violation (this should fail)
    console.log('\n🧪 Testing Ring 0 violation detection...\n');
    flowManager.registerSystem({
        id: 'bad_ring0_system',
        ring: 0,
        type: 'invalid_core',
        dependencies: ['multi_ring_character_evolution'], // Ring 0 cannot depend on Ring 1!
        characteristics: ['pure_logic']
    });
    
    // Run full validation
    const validationResults = flowManager.validateAllSystems();
    
    // Generate dependency flow visualization
    console.log('\n🌊 DEPENDENCY FLOW VISUALIZATION');
    console.log('==================================');
    const flowViz = flowManager.generateDependencyFlowVisualization();
    
    flowViz.flows.forEach(flow => {
        const status = flow.allowed ? '✅' : '❌';
        console.log(`${status} ${flow.description}: ${flow.from.id} → ${flow.to.id}`);
    });
    
    if (flowViz.violations.length > 0) {
        console.log('\n⚠️ Flow Violations:');
        flowViz.violations.forEach(violation => {
            console.log(`   • ${violation.reason} (${violation.from} → ${violation.to})`);
        });
    }
    
    // Ring 0 independence report
    console.log('\n🏗️ RING 0 INDEPENDENCE REPORT');
    console.log('===============================');
    const ring0Report = flowManager.getRing0IndependenceReport();
    
    console.log(`Ring 0 Independence: ${ring0Report.independence_percentage}%`);
    console.log(`Independent Systems: ${ring0Report.independent_systems}/${ring0Report.total_ring0_systems}`);
    
    if (ring0Report.violations.length > 0) {
        console.log('\n🚨 Ring 0 Independence Violations:');
        ring0Report.violations.forEach(violation => {
            console.log(`   • ${violation.system}: depends on [${violation.dependencies.join(', ')}]`);
        });
    }
    
    // Export analysis
    const analysis = flowManager.exportDependencyAnalysis();
    
    console.log('\n✨ Ring Dependency Flow Manager demo complete!');
    console.log(`\n📈 Final Score: ${validationResults.valid_systems}/${validationResults.total_systems} systems valid`);
}

module.exports = RingDependencyFlowManager;
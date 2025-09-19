#!/usr/bin/env node
// TAILS-VERIFICATION-WRAPPER.js - Tails OS-style verification wrapper for all capsule operations

const SoulfraCapsuleMesh = require('./SOULFRA-CAPSULE-MESH.js');
const DeviceMeshARPANET = require('./DEVICE-MESH-ARPANET.js');

class TailsVerificationWrapper {
    constructor() {
        this.verificationMode = 'MAXIMUM_SECURITY'; // BASIC, HIGH, MAXIMUM_SECURITY
        this.operationQueue = [];
        this.verificationLog = [];
        this.failedOperations = [];
        
        console.log('🛡️ TAILS-STYLE VERIFICATION WRAPPER INITIALIZED');
        console.log(`🔒 Security Mode: ${this.verificationMode}`);
        console.log('📋 All operations will be verified before AND after execution');
    }

    // Initialize secure capsule system with verification
    async initializeSecureSystem() {
        console.log('\n🚀 INITIALIZING SECURE CAPSULE SYSTEM');
        console.log('=====================================');
        
        try {
            // Step 1: Initialize mesh network with verification
            console.log('🔍 Step 1: Initializing mesh network...');
            await this.verifyOperation('mesh_init', async () => {
                this.meshNetwork = new DeviceMeshARPANET();
                await this.waitForInitialization(1000);
                return this.meshNetwork;
            });
            console.log('✅ Mesh network initialized and verified');

            // Step 2: Initialize capsule system with verification
            console.log('🔍 Step 2: Initializing capsule system...');
            await this.verifyOperation('capsule_init', async () => {
                this.capsuleSystem = new SoulfraCapsuleMesh(this.meshNetwork);
                await this.waitForInitialization(2000);
                return this.capsuleSystem;
            });
            console.log('✅ Capsule system initialized and verified');

            // Step 3: Verify system integrity
            console.log('🔍 Step 3: Verifying system integrity...');
            const integrityCheck = await this.verifySystemIntegrity();
            if (!integrityCheck.verified) {
                throw new Error('System integrity verification failed');
            }
            console.log('✅ System integrity verified');

            console.log('\n🎉 SECURE SYSTEM INITIALIZATION COMPLETE');
            console.log('🛡️ All operations now protected by Tails-style verification');
            
            return {
                initialized: true,
                meshNetwork: this.meshNetwork,
                capsuleSystem: this.capsuleSystem,
                verificationEnabled: true
            };

        } catch (error) {
            console.error('❌ SECURE SYSTEM INITIALIZATION FAILED:', error.message);
            throw error;
        }
    }

    // Verify operation with pre/post checks (Tails-style)
    async verifyOperation(operationName, operation, preChecks = [], postChecks = []) {
        const operationId = this.generateOperationId();
        const startTime = Date.now();
        
        console.log(`\n🛡️ VERIFYING OPERATION: ${operationName.toUpperCase()}`);
        console.log(`🔍 Operation ID: ${operationId}`);
        
        const operationRecord = {
            id: operationId,
            name: operationName,
            startTime: startTime,
            status: 'IN_PROGRESS',
            preVerification: null,
            postVerification: null,
            result: null,
            errors: []
        };

        // Track current operation for verification checks
        this.currentOperation = operationName;

        try {
            // PRE-OPERATION VERIFICATION
            console.log('   🔍 Pre-operation verification...');
            operationRecord.preVerification = await this.runPreVerification(operationName, preChecks);
            if (!operationRecord.preVerification.passed) {
                throw new Error(`Pre-verification failed: ${operationRecord.preVerification.errors.join(', ')}`);
            }
            console.log('   ✅ Pre-operation verification passed');

            // EXECUTE OPERATION
            console.log('   ⚡ Executing operation...');
            const result = await operation();
            operationRecord.result = result;
            console.log('   ✅ Operation executed');

            // POST-OPERATION VERIFICATION
            console.log('   🔍 Post-operation verification...');
            operationRecord.postVerification = await this.runPostVerification(operationName, result, postChecks);
            if (!operationRecord.postVerification.passed) {
                throw new Error(`Post-verification failed: ${operationRecord.postVerification.errors.join(', ')}`);
            }
            console.log('   ✅ Post-operation verification passed');

            // SUCCESS
            operationRecord.status = 'VERIFIED_SUCCESS';
            operationRecord.completedAt = Date.now();
            operationRecord.duration = operationRecord.completedAt - startTime;
            
            this.verificationLog.push(operationRecord);
            
            console.log(`   🎉 OPERATION VERIFIED SUCCESSFULLY (${operationRecord.duration}ms)`);
            return result;

        } catch (error) {
            // FAILURE
            operationRecord.status = 'VERIFICATION_FAILED';
            operationRecord.errors.push(error.message);
            operationRecord.completedAt = Date.now();
            operationRecord.duration = operationRecord.completedAt - startTime;
            
            this.failedOperations.push(operationRecord);
            this.verificationLog.push(operationRecord);
            
            console.log(`   ❌ OPERATION VERIFICATION FAILED: ${error.message}`);
            throw error;
        }
    }

    // Pre-operation verification checks
    async runPreVerification(operationName, customChecks = []) {
        const verification = {
            passed: true,
            checks: {},
            errors: []
        };

        try {
            // Standard pre-checks for all operations
            verification.checks.systemHealth = await this.checkSystemHealth();
            verification.checks.permissions = await this.checkPermissions(operationName);
            verification.checks.resources = await this.checkResources();
            verification.checks.integrity = await this.checkDataIntegrity();

            // Custom checks
            for (const check of customChecks) {
                verification.checks[check.name] = await check.run();
            }

            // Evaluate all checks
            for (const [checkName, result] of Object.entries(verification.checks)) {
                if (!result.passed) {
                    verification.passed = false;
                    verification.errors.push(`${checkName}: ${result.error || 'Failed'}`);
                }
            }

        } catch (error) {
            verification.passed = false;
            verification.errors.push(`Pre-verification error: ${error.message}`);
        }

        return verification;
    }

    // Post-operation verification checks
    async runPostVerification(operationName, result, customChecks = []) {
        const verification = {
            passed: true,
            checks: {},
            errors: []
        };

        try {
            // Standard post-checks for all operations
            verification.checks.resultIntegrity = await this.checkResultIntegrity(result);
            verification.checks.systemState = await this.checkSystemState();
            verification.checks.dataConsistency = await this.checkDataConsistency();
            verification.checks.securityState = await this.checkSecurityState();

            // Custom checks
            for (const check of customChecks) {
                verification.checks[check.name] = await check.run(result);
            }

            // Evaluate all checks
            for (const [checkName, checkResult] of Object.entries(verification.checks)) {
                if (!checkResult.passed) {
                    verification.passed = false;
                    verification.errors.push(`${checkName}: ${checkResult.error || 'Failed'}`);
                }
            }

        } catch (error) {
            verification.passed = false;
            verification.errors.push(`Post-verification error: ${error.message}`);
        }

        return verification;
    }

    // Verified save operation
    async verifySave(capsuleType, capsuleData) {
        return await this.verifyOperation(
            `save_${capsuleType}`,
            async () => {
                await this.capsuleSystem.saveCapsules();
                return { saved: true, capsuleType: capsuleType };
            },
            [
                {
                    name: 'capsule_structure',
                    run: async () => this.validateCapsuleStructure(capsuleData, capsuleType)
                }
            ],
            [
                {
                    name: 'file_verification',
                    run: async () => this.verifyFileWasCreated(capsuleType)
                }
            ]
        );
    }

    // Verified load operation
    async verifyLoad(capsuleType) {
        return await this.verifyOperation(
            `load_${capsuleType}`,
            async () => {
                await this.capsuleSystem.loadCapsules();
                return { loaded: true, capsuleType: capsuleType };
            },
            [
                {
                    name: 'file_existence',
                    run: async () => this.checkFileExists(capsuleType)
                }
            ],
            [
                {
                    name: 'capsule_integrity',
                    run: async (result) => this.verifyCapsuleIntegrity(capsuleType)
                }
            ]
        );
    }

    // Verified backup operation
    async verifyBackup(backupPath) {
        return await this.verifyOperation(
            'create_backup',
            async () => {
                const backupDir = await this.capsuleSystem.createSecureBackup(backupPath);
                return { backupCreated: true, backupPath: backupDir };
            },
            [
                {
                    name: 'backup_destination',
                    run: async () => this.checkBackupDestination(backupPath)
                }
            ],
            [
                {
                    name: 'backup_verification',
                    run: async (result) => this.verifyBackupIntegrity(result.backupPath)
                }
            ]
        );
    }

    // System integrity verification
    async verifySystemIntegrity() {
        console.log('🔍 Running comprehensive system integrity check...');
        
        const checks = {
            meshNetwork: this.meshNetwork ? true : false,
            capsuleSystem: this.capsuleSystem ? true : false,
            securitySystem: this.capsuleSystem?.securitySystem ? true : false,
            verificationGateway: this.capsuleSystem?.securitySystem?.verificationGateway ? true : false
        };

        const allPassed = Object.values(checks).every(check => check === true);
        
        return {
            verified: allPassed,
            checks: checks,
            timestamp: Date.now()
        };
    }

    // Individual verification check methods
    async checkSystemHealth() {
        // During initialization, allow operations that create the system
        const initOperations = ['mesh_init', 'capsule_init'];
        const currentOp = this.currentOperation;
        
        if (initOperations.includes(currentOp)) {
            return {
                passed: true,
                initialization: true,
                timestamp: Date.now()
            };
        }
        
        return {
            passed: this.meshNetwork && this.capsuleSystem,
            meshNetwork: !!this.meshNetwork,
            capsuleSystem: !!this.capsuleSystem,
            timestamp: Date.now()
        };
    }

    async checkPermissions(operationName) {
        // Check if operation is allowed
        const allowedOperations = ['mesh_init', 'capsule_init', 'save_identity', 'save_memory', 'save_interaction', 'save_projection', 'load_identity', 'load_memory', 'load_interaction', 'load_projection', 'create_backup'];
        return {
            passed: allowedOperations.includes(operationName),
            error: allowedOperations.includes(operationName) ? null : 'Operation not permitted'
        };
    }

    async checkResources() {
        const memUsage = process.memoryUsage();
        return {
            passed: memUsage.heapUsed < 500 * 1024 * 1024, // 500MB limit
            memoryUsage: memUsage
        };
    }

    async checkDataIntegrity() {
        // During initialization, allow operations that create the system
        const initOperations = ['mesh_init', 'capsule_init'];
        if (initOperations.includes(this.currentOperation)) {
            return { 
                passed: true, 
                initialization: true,
                timestamp: Date.now()
            };
        }
        
        if (!this.capsuleSystem) {
            return { passed: true }; // No data to check yet
        }
        
        try {
            const status = this.capsuleSystem.getCapsuleStatus();
            return {
                passed: status.systemHealth === 'active',
                systemHealth: status.systemHealth
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message
            };
        }
    }

    async checkResultIntegrity(result) {
        return {
            passed: result !== null && result !== undefined,
            hasResult: result !== null && result !== undefined
        };
    }

    async checkSystemState() {
        // During initialization, check appropriate components
        if (this.currentOperation === 'mesh_init') {
            return {
                passed: !!this.meshNetwork,
                components: {
                    meshNetwork: !!this.meshNetwork,
                    capsuleSystem: !!this.capsuleSystem
                },
                initialization: true
            };
        }
        
        if (this.currentOperation === 'capsule_init') {
            return {
                passed: this.meshNetwork && this.capsuleSystem,
                components: {
                    meshNetwork: !!this.meshNetwork,
                    capsuleSystem: !!this.capsuleSystem
                },
                initialization: true
            };
        }
        
        return {
            passed: this.meshNetwork && this.capsuleSystem,
            components: {
                meshNetwork: !!this.meshNetwork,
                capsuleSystem: !!this.capsuleSystem
            }
        };
    }

    async checkDataConsistency() {
        if (!this.capsuleSystem) {
            return { passed: true };
        }

        try {
            const status = this.capsuleSystem.getCapsuleStatus();
            const expectedLayers = ['identity', 'memory', 'interaction', 'projection'];
            const actualLayers = Object.keys(status.layers);
            
            return {
                passed: expectedLayers.every(layer => actualLayers.includes(layer)),
                expectedLayers: expectedLayers,
                actualLayers: actualLayers
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message
            };
        }
    }

    async checkSecurityState() {
        // During mesh initialization, security system isn't ready yet
        if (this.currentOperation === 'mesh_init') {
            return {
                passed: true,
                initialization: true,
                note: 'Security system not required for mesh initialization'
            };
        }
        
        if (!this.capsuleSystem?.securitySystem) {
            // During capsule initialization, this might be expected
            if (this.currentOperation === 'capsule_init') {
                return {
                    passed: true,
                    initialization: true,
                    note: 'Security system initializing with capsule system'
                };
            }
            return { passed: false, error: 'Security system not initialized' };
        }

        try {
            const securityStatus = this.capsuleSystem.securitySystem.getSecurityStatus();
            return {
                passed: securityStatus.securityLevel === 'MAXIMUM',
                securityLevel: securityStatus.securityLevel
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message
            };
        }
    }

    async validateCapsuleStructure(capsuleData, capsuleType) {
        const requiredFields = ['type', 'layer', 'capsuleId', 'core', 'attributes', 'data'];
        const hasAllFields = requiredFields.every(field => capsuleData && capsuleData.hasOwnProperty(field));
        
        return {
            passed: hasAllFields && capsuleData.type === capsuleType,
            missingFields: requiredFields.filter(field => !capsuleData || !capsuleData.hasOwnProperty(field))
        };
    }

    async verifyFileWasCreated(capsuleType) {
        const fs = require('fs');
        const path = require('path');
        
        if (!this.capsuleSystem) {
            return { passed: false, error: 'Capsule system not initialized' };
        }

        const filename = path.join(this.capsuleSystem.capsuleStorageDir, `${capsuleType}.soulfra`);
        const exists = fs.existsSync(filename);
        
        return {
            passed: exists,
            filename: filename,
            exists: exists
        };
    }

    async checkFileExists(capsuleType) {
        return this.verifyFileWasCreated(capsuleType);
    }

    async verifyCapsuleIntegrity(capsuleType) {
        if (!this.capsuleSystem) {
            return { passed: false, error: 'Capsule system not initialized' };
        }

        try {
            const results = await this.capsuleSystem.verifyCapsuleIntegrity();
            return {
                passed: results.invalidCapsules === 0,
                totalCapsules: results.totalCapsules,
                validCapsules: results.validCapsules,
                invalidCapsules: results.invalidCapsules
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message
            };
        }
    }

    async checkBackupDestination(backupPath) {
        const fs = require('fs');
        const path = require('path');
        
        const parentDir = path.dirname(backupPath);
        const parentExists = fs.existsSync(parentDir);
        
        return {
            passed: parentExists,
            parentDir: parentDir,
            parentExists: parentExists
        };
    }

    async verifyBackupIntegrity(backupPath) {
        const fs = require('fs');
        
        if (!fs.existsSync(backupPath)) {
            return { passed: false, error: 'Backup directory not found' };
        }

        const files = fs.readdirSync(backupPath);
        const hasManifest = files.includes('backup-manifest.enc');
        const hasCapsules = files.some(file => file.endsWith('.soulfra'));
        
        return {
            passed: hasManifest && hasCapsules,
            files: files,
            hasManifest: hasManifest,
            hasCapsules: hasCapsules
        };
    }

    // Utility methods
    generateOperationId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `op_${timestamp}_${random}`;
    }

    async waitForInitialization(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get verification statistics
    getVerificationStats() {
        const totalOperations = this.verificationLog.length;
        const successfulOperations = this.verificationLog.filter(op => op.status === 'VERIFIED_SUCCESS').length;
        const failedOperations = this.failedOperations.length;
        
        return {
            totalOperations: totalOperations,
            successfulOperations: successfulOperations,
            failedOperations: failedOperations,
            successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
            verificationMode: this.verificationMode,
            lastOperation: this.verificationLog[this.verificationLog.length - 1] || null
        };
    }

    // Print verification summary
    printVerificationSummary() {
        const stats = this.getVerificationStats();
        
        console.log('\n📊 VERIFICATION SUMMARY');
        console.log('=======================');
        console.log(`🔒 Security Mode: ${stats.verificationMode}`);
        console.log(`📈 Total Operations: ${stats.totalOperations}`);
        console.log(`✅ Successful: ${stats.successfulOperations}`);
        console.log(`❌ Failed: ${stats.failedOperations}`);
        console.log(`📊 Success Rate: ${stats.successRate.toFixed(1)}%`);
        
        if (stats.lastOperation) {
            console.log(`⏱️ Last Operation: ${stats.lastOperation.name} (${stats.lastOperation.status})`);
        }
        
        console.log('\n🛡️ All operations verified with Tails-style security');
    }
}

module.exports = TailsVerificationWrapper;
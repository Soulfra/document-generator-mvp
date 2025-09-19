#!/usr/bin/env node
// SOULFRA-VERIFICATION-GATEWAY.js - Tails-style verification system for .soulfra capsules

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SoulfraVerificationGateway {
    constructor(deviceId, deviceFingerprint) {
        this.deviceId = deviceId;
        this.deviceFingerprint = deviceFingerprint;
        
        // Verification configuration
        this.verificationLevel = 'MAXIMUM'; // BASIC, HIGH, MAXIMUM
        this.chainOfCustodyEnabled = true;
        this.multiStageVerification = true;
        
        // Verification state tracking
        this.verificationChain = new Map();
        this.verificationLog = [];
        this.trustedSignatures = new Set();
        
        // Initialize verification system
        this.initializeVerificationSystem();
        
        console.log('🛡️ Soulfra Verification Gateway initialized');
        console.log(`🔒 Verification Level: ${this.verificationLevel}`);
    }

    // Initialize verification system
    initializeVerificationSystem() {
        // Create verification log directory
        this.verificationDir = path.join(__dirname, 'soulfra-verification', this.deviceId);
        if (!fs.existsSync(this.verificationDir)) {
            fs.mkdirSync(this.verificationDir, { recursive: true, mode: 0o700 });
        }

        // Initialize verification log
        this.verificationLogPath = path.join(this.verificationDir, 'verification.log');
        this.chainOfCustodyPath = path.join(this.verificationDir, 'chain-of-custody.log');
        
        // Create master verification key
        this.masterVerificationKey = this.deriveMasterVerificationKey();
        
        // Initialize trusted signatures with self
        this.trustedSignatures.add(this.generateDeviceSignature('trusted_self'));
        
        this.logVerification('SYSTEM_INIT', 'Verification gateway initialized', 'INFO');
    }

    // Derive master verification key
    deriveMasterVerificationKey() {
        const salt = crypto.createHash('sha256').update(this.deviceId + 'verification_master_salt').digest();
        const keyMaterial = this.deviceFingerprint + this.deviceId + 'verification_key';
        
        return crypto.pbkdf2Sync(keyMaterial, salt, 150000, 64, 'sha512'); // Extra rounds for verification key
    }

    // Generate device signature for verification
    generateDeviceSignature(data) {
        const hmac = crypto.createHmac('sha512', this.masterVerificationKey);
        hmac.update(JSON.stringify({
            deviceId: this.deviceId,
            deviceFingerprint: this.deviceFingerprint,
            data: data,
            timestamp: Date.now()
        }));
        return hmac.digest('hex');
    }

    // Verify device signature
    verifyDeviceSignature(data, signature, sourceDevice = null) {
        const expectedSignature = this.generateDeviceSignature(data);
        
        try {
            const isValid = crypto.timingSafeEqual(
                Buffer.from(expectedSignature, 'hex'),
                Buffer.from(signature, 'hex')
            );
            
            this.logVerification(
                'SIGNATURE_VERIFY', 
                `Signature verification: ${isValid ? 'PASS' : 'FAIL'}${sourceDevice ? ` from ${sourceDevice}` : ''}`, 
                isValid ? 'INFO' : 'WARNING'
            );
            
            return isValid;
        } catch (error) {
            this.logVerification('SIGNATURE_ERROR', `Signature verification error: ${error.message}`, 'ERROR');
            return false;
        }
    }

    // PRE-TRANSMISSION VERIFICATION - Before sending/saving capsule
    async verifyBeforeTransmission(capsuleData, capsuleType, operation = 'save') {
        console.log(`🔍 PRE-TRANSMISSION VERIFICATION: ${capsuleType} (${operation})`);
        
        const verificationId = this.generateVerificationId();
        const verificationStart = Date.now();
        
        const verification = {
            id: verificationId,
            stage: 'PRE_TRANSMISSION',
            capsuleType: capsuleType,
            operation: operation,
            timestamp: verificationStart,
            checks: {},
            status: 'IN_PROGRESS',
            errors: []
        };

        try {
            // 1. Data Integrity Check
            console.log('   🔍 Step 1: Data integrity check...');
            verification.checks.dataIntegrity = await this.verifyDataIntegrity(capsuleData);
            if (!verification.checks.dataIntegrity.valid) {
                verification.errors.push('Data integrity check failed');
            }

            // 2. Structure Validation
            console.log('   🔍 Step 2: Structure validation...');
            verification.checks.structureValid = await this.verifyStructure(capsuleData, capsuleType);
            if (!verification.checks.structureValid.valid) {
                verification.errors.push('Structure validation failed');
            }

            // 3. Cryptographic Signature Generation
            console.log('   🔍 Step 3: Generating cryptographic signature...');
            verification.checks.signature = await this.generateVerificationSignature(capsuleData, capsuleType);

            // 4. Permission Verification
            console.log('   🔍 Step 4: Permission verification...');
            verification.checks.permissions = await this.verifyPermissions(capsuleType, operation);
            if (!verification.checks.permissions.valid) {
                verification.errors.push('Permission verification failed');
            }

            // 5. Device Authorization
            console.log('   🔍 Step 5: Device authorization...');
            verification.checks.deviceAuth = await this.verifyDeviceAuthorization(operation);
            if (!verification.checks.deviceAuth.valid) {
                verification.errors.push('Device authorization failed');
            }

            // 6. Chain of Custody Creation
            console.log('   🔍 Step 6: Chain of custody creation...');
            verification.checks.chainOfCustody = await this.createChainOfCustody(capsuleData, capsuleType, operation);

            // Final verification status
            verification.status = verification.errors.length === 0 ? 'VERIFIED' : 'FAILED';
            verification.completedAt = Date.now();
            verification.duration = verification.completedAt - verificationStart;

            // Store verification record
            this.verificationChain.set(verificationId, verification);
            
            // Log verification result
            this.logVerification(
                'PRE_TRANSMISSION',
                `${capsuleType} pre-transmission verification: ${verification.status}`,
                verification.status === 'VERIFIED' ? 'INFO' : 'ERROR'
            );

            if (verification.status === 'VERIFIED') {
                console.log(`   ✅ PRE-TRANSMISSION VERIFICATION PASSED (${verification.duration}ms)`);
                return {
                    verified: true,
                    verificationId: verificationId,
                    signature: verification.checks.signature,
                    chainOfCustody: verification.checks.chainOfCustody,
                    verification: verification
                };
            } else {
                console.log(`   ❌ PRE-TRANSMISSION VERIFICATION FAILED`);
                verification.errors.forEach(error => console.log(`      - ${error}`));
                return {
                    verified: false,
                    verificationId: verificationId,
                    errors: verification.errors,
                    verification: verification
                };
            }

        } catch (error) {
            verification.status = 'ERROR';
            verification.errors.push(`Verification error: ${error.message}`);
            verification.completedAt = Date.now();
            
            this.logVerification('VERIFICATION_ERROR', `Pre-transmission verification error: ${error.message}`, 'ERROR');
            
            return {
                verified: false,
                verificationId: verificationId,
                errors: [`Verification system error: ${error.message}`],
                verification: verification
            };
        }
    }

    // POST-RECEPTION VERIFICATION - After receiving/loading capsule
    async verifyAfterReception(capsuleData, capsuleType, verificationId, expectedSignature, operation = 'load') {
        console.log(`🔍 POST-RECEPTION VERIFICATION: ${capsuleType} (${operation})`);
        
        const receptionVerificationId = this.generateVerificationId();
        const verificationStart = Date.now();
        
        const verification = {
            id: receptionVerificationId,
            stage: 'POST_RECEPTION',
            originalVerificationId: verificationId,
            capsuleType: capsuleType,
            operation: operation,
            timestamp: verificationStart,
            checks: {},
            status: 'IN_PROGRESS',
            errors: []
        };

        try {
            // 1. Signature Verification
            console.log('   🔍 Step 1: Signature verification...');
            verification.checks.signatureValid = await this.verifyVerificationSignature(
                capsuleData, capsuleType, expectedSignature
            );
            if (!verification.checks.signatureValid.valid) {
                verification.errors.push('Signature verification failed');
            }

            // 2. Data Integrity Re-check
            console.log('   🔍 Step 2: Data integrity re-check...');
            verification.checks.dataIntegrity = await this.verifyDataIntegrity(capsuleData);
            if (!verification.checks.dataIntegrity.valid) {
                verification.errors.push('Post-reception data integrity check failed');
            }

            // 3. Chain of Custody Verification
            console.log('   🔍 Step 3: Chain of custody verification...');
            verification.checks.chainOfCustody = await this.verifyChainOfCustody(verificationId, capsuleType);
            if (!verification.checks.chainOfCustody.valid) {
                verification.errors.push('Chain of custody verification failed');
            }

            // 4. Tampering Detection
            console.log('   🔍 Step 4: Tampering detection...');
            verification.checks.tamperDetection = await this.detectTampering(capsuleData, verificationId);
            if (!verification.checks.tamperDetection.valid) {
                verification.errors.push('Tampering detected');
            }

            // 5. Source Authentication
            console.log('   🔍 Step 5: Source authentication...');
            verification.checks.sourceAuth = await this.verifySource(capsuleData, capsuleType);
            if (!verification.checks.sourceAuth.valid) {
                verification.errors.push('Source authentication failed');
            }

            // 6. Time-based Validation
            console.log('   🔍 Step 6: Time-based validation...');
            verification.checks.timeValidation = await this.verifyTimeBasedConstraints(verificationId);
            if (!verification.checks.timeValidation.valid) {
                verification.errors.push('Time-based validation failed');
            }

            // Final verification status
            verification.status = verification.errors.length === 0 ? 'VERIFIED' : 'FAILED';
            verification.completedAt = Date.now();
            verification.duration = verification.completedAt - verificationStart;

            // Store verification record
            this.verificationChain.set(receptionVerificationId, verification);
            
            // Update chain of custody
            await this.updateChainOfCustody(verificationId, receptionVerificationId, verification.status);
            
            // Log verification result
            this.logVerification(
                'POST_RECEPTION',
                `${capsuleType} post-reception verification: ${verification.status}`,
                verification.status === 'VERIFIED' ? 'INFO' : 'ERROR'
            );

            if (verification.status === 'VERIFIED') {
                console.log(`   ✅ POST-RECEPTION VERIFICATION PASSED (${verification.duration}ms)`);
                return {
                    verified: true,
                    verificationId: receptionVerificationId,
                    originalVerificationId: verificationId,
                    verification: verification
                };
            } else {
                console.log(`   ❌ POST-RECEPTION VERIFICATION FAILED`);
                verification.errors.forEach(error => console.log(`      - ${error}`));
                return {
                    verified: false,
                    verificationId: receptionVerificationId,
                    originalVerificationId: verificationId,
                    errors: verification.errors,
                    verification: verification
                };
            }

        } catch (error) {
            verification.status = 'ERROR';
            verification.errors.push(`Verification error: ${error.message}`);
            verification.completedAt = Date.now();
            
            this.logVerification('VERIFICATION_ERROR', `Post-reception verification error: ${error.message}`, 'ERROR');
            
            return {
                verified: false,
                verificationId: receptionVerificationId,
                originalVerificationId: verificationId,
                errors: [`Verification system error: ${error.message}`],
                verification: verification
            };
        }
    }

    // Generate unique verification ID
    generateVerificationId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `verify_${timestamp}_${random}`;
    }

    // Verify data integrity
    async verifyDataIntegrity(capsuleData) {
        try {
            // Calculate multiple hashes for integrity verification
            const dataString = JSON.stringify(capsuleData);
            const sha256Hash = crypto.createHash('sha256').update(dataString).digest('hex');
            const sha512Hash = crypto.createHash('sha512').update(dataString).digest('hex');
            const blake2Hash = crypto.createHash('blake2b512').update(dataString).digest('hex');
            
            // Verify data structure completeness
            const requiredFields = ['type', 'layer', 'capsuleId', 'core', 'attributes', 'data'];
            const hasAllFields = requiredFields.every(field => capsuleData.hasOwnProperty(field));
            
            return {
                valid: true,
                sha256: sha256Hash,
                sha512: sha512Hash,
                blake2: blake2Hash,
                structureComplete: hasAllFields,
                dataSize: dataString.length
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Verify capsule structure
    async verifyStructure(capsuleData, capsuleType) {
        try {
            const structureChecks = {
                hasType: capsuleData.type === capsuleType,
                hasLayer: typeof capsuleData.layer === 'number',
                hasCapsuleId: typeof capsuleData.capsuleId === 'string',
                hasCore: typeof capsuleData.core === 'object',
                hasAttributes: typeof capsuleData.attributes === 'object',
                hasData: typeof capsuleData.data === 'object',
                hasMeshVisibility: typeof capsuleData.meshVisibility === 'object'
            };
            
            const allValid = Object.values(structureChecks).every(check => check === true);
            
            return {
                valid: allValid,
                checks: structureChecks
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Generate verification signature
    async generateVerificationSignature(capsuleData, capsuleType) {
        const signatureData = {
            deviceId: this.deviceId,
            capsuleType: capsuleType,
            data: capsuleData,
            timestamp: Date.now(),
            verificationLevel: this.verificationLevel
        };
        
        const hmac = crypto.createHmac('sha512', this.masterVerificationKey);
        hmac.update(JSON.stringify(signatureData));
        const signature = hmac.digest('hex');
        
        return {
            signature: signature,
            algorithm: 'HMAC-SHA512',
            timestamp: signatureData.timestamp,
            verificationLevel: this.verificationLevel
        };
    }

    // Verify verification signature
    async verifyVerificationSignature(capsuleData, capsuleType, expectedSignature) {
        try {
            const signatureData = {
                deviceId: this.deviceId,
                capsuleType: capsuleType,
                data: capsuleData,
                timestamp: expectedSignature.timestamp,
                verificationLevel: expectedSignature.verificationLevel
            };
            
            const hmac = crypto.createHmac('sha512', this.masterVerificationKey);
            hmac.update(JSON.stringify(signatureData));
            const computedSignature = hmac.digest('hex');
            
            const isValid = crypto.timingSafeEqual(
                Buffer.from(computedSignature, 'hex'),
                Buffer.from(expectedSignature.signature, 'hex')
            );
            
            return {
                valid: isValid,
                algorithm: expectedSignature.algorithm,
                timestamp: expectedSignature.timestamp
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Verify permissions
    async verifyPermissions(capsuleType, operation) {
        try {
            // Define permission matrix
            const permissions = {
                identity: { save: true, load: true, share: false, test_save: true, test_load: true, test_tamper: true },
                memory: { save: true, load: true, share: true, test_save: true, test_load: true, test_tamper: true },
                interaction: { save: true, load: true, share: true, test_save: true, test_load: true, test_tamper: true },
                projection: { save: true, load: true, share: true, test_save: true, test_load: true, test_tamper: true }
            };
            
            const hasPermission = permissions[capsuleType] && permissions[capsuleType][operation];
            
            return {
                valid: hasPermission,
                capsuleType: capsuleType,
                operation: operation,
                granted: hasPermission
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Verify device authorization
    async verifyDeviceAuthorization(operation) {
        try {
            // For now, always authorize operations from the same device
            // In a real implementation, this would check against a trusted device registry
            const deviceAuthorized = this.deviceId && this.deviceFingerprint;
            
            return {
                valid: deviceAuthorized,
                deviceId: this.deviceId,
                operation: operation,
                trusted: deviceAuthorized,
                note: 'Device authorization based on device identity'
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Create chain of custody record
    async createChainOfCustody(capsuleData, capsuleType, operation) {
        try {
            const custodyRecord = {
                id: this.generateVerificationId(),
                capsuleType: capsuleType,
                operation: operation,
                deviceId: this.deviceId,
                timestamp: Date.now(),
                dataHash: crypto.createHash('sha256').update(JSON.stringify(capsuleData)).digest('hex'),
                deviceSignature: this.generateDeviceSignature(`custody_${capsuleType}_${operation}`),
                verificationLevel: this.verificationLevel
            };
            
            // Save to chain of custody log
            const logEntry = JSON.stringify(custodyRecord) + '\n';
            fs.appendFileSync(this.chainOfCustodyPath, logEntry);
            
            return {
                valid: true,
                custodyId: custodyRecord.id,
                timestamp: custodyRecord.timestamp,
                dataHash: custodyRecord.dataHash
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Verify chain of custody
    async verifyChainOfCustody(verificationId, capsuleType) {
        try {
            if (!fs.existsSync(this.chainOfCustodyPath)) {
                return { valid: false, error: 'Chain of custody log not found' };
            }
            
            const logContent = fs.readFileSync(this.chainOfCustodyPath, 'utf8');
            const logEntries = logContent.trim().split('\n').filter(line => line.length > 0);
            
            // Find matching custody record
            let custodyRecord = null;
            for (const entry of logEntries) {
                try {
                    const record = JSON.parse(entry);
                    if (record.capsuleType === capsuleType && record.deviceId === this.deviceId) {
                        custodyRecord = record;
                        break;
                    }
                } catch (error) {
                    // Skip malformed entries
                }
            }
            
            if (!custodyRecord) {
                return { valid: false, error: 'No custody record found' };
            }
            
            // Verify custody record signature
            const expectedSig = this.generateDeviceSignature(`custody_${capsuleType}_${custodyRecord.operation}`);
            const sigValid = custodyRecord.deviceSignature === expectedSig;
            
            return {
                valid: sigValid,
                custodyId: custodyRecord.id,
                timestamp: custodyRecord.timestamp,
                signatureValid: sigValid
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Detect tampering
    async detectTampering(capsuleData, originalVerificationId) {
        try {
            const originalVerification = this.verificationChain.get(originalVerificationId);
            if (!originalVerification) {
                return { valid: false, error: 'Original verification record not found' };
            }
            
            // Re-calculate data integrity and compare
            const currentIntegrity = await this.verifyDataIntegrity(capsuleData);
            const originalIntegrity = originalVerification.checks.dataIntegrity;
            
            const integrityMatch = currentIntegrity.sha256 === originalIntegrity.sha256 &&
                                 currentIntegrity.sha512 === originalIntegrity.sha512;
            
            return {
                valid: integrityMatch,
                tamperingDetected: !integrityMatch,
                originalHash: originalIntegrity.sha256,
                currentHash: currentIntegrity.sha256
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Verify source authentication
    async verifySource(capsuleData, capsuleType) {
        try {
            // Verify the capsule came from this device
            const expectedDeviceId = this.deviceId;
            const capsuleDeviceId = capsuleData.core?.deviceFingerprint || 
                                  capsuleData.deviceSignature || 
                                  capsuleData.capsuleId?.split('_')[1];
            
            const sourceValid = capsuleDeviceId === expectedDeviceId.substring(0, 8) ||
                              capsuleData.core?.deviceFingerprint === this.deviceFingerprint;
            
            return {
                valid: sourceValid,
                expectedDevice: expectedDeviceId,
                sourceDevice: capsuleDeviceId,
                authenticated: sourceValid
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Verify time-based constraints
    async verifyTimeBasedConstraints(verificationId) {
        try {
            const verification = this.verificationChain.get(verificationId);
            if (!verification) {
                return { valid: false, error: 'Verification record not found' };
            }
            
            const currentTime = Date.now();
            const verificationAge = currentTime - verification.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            const withinTimeLimit = verificationAge <= maxAge;
            
            return {
                valid: withinTimeLimit,
                verificationAge: verificationAge,
                maxAge: maxAge,
                withinLimit: withinTimeLimit
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Update chain of custody
    async updateChainOfCustody(originalVerificationId, newVerificationId, status) {
        try {
            const updateRecord = {
                originalVerificationId: originalVerificationId,
                newVerificationId: newVerificationId,
                updateType: 'POST_RECEPTION_VERIFICATION',
                status: status,
                timestamp: Date.now(),
                deviceId: this.deviceId,
                signature: this.generateDeviceSignature(`custody_update_${originalVerificationId}`)
            };
            
            const logEntry = JSON.stringify(updateRecord) + '\n';
            fs.appendFileSync(this.chainOfCustodyPath, logEntry);
            
            return true;
        } catch (error) {
            this.logVerification('CUSTODY_UPDATE_ERROR', `Failed to update chain of custody: ${error.message}`, 'ERROR');
            return false;
        }
    }

    // Log verification events
    logVerification(eventType, message, severity = 'INFO') {
        const logEntry = {
            timestamp: Date.now(),
            deviceId: this.deviceId,
            eventType: eventType,
            message: message,
            severity: severity,
            verificationLevel: this.verificationLevel
        };
        
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.verificationLogPath, logLine);
            this.verificationLog.push(logEntry);
        } catch (error) {
            console.error('Failed to write verification log:', error);
        }
    }

    // Get verification status
    getVerificationStatus() {
        return {
            deviceId: this.deviceId,
            verificationLevel: this.verificationLevel,
            chainOfCustodyEnabled: this.chainOfCustodyEnabled,
            multiStageVerification: this.multiStageVerification,
            totalVerifications: this.verificationChain.size,
            trustedSignatures: this.trustedSignatures.size,
            verificationLogPath: this.verificationLogPath,
            chainOfCustodyPath: this.chainOfCustodyPath,
            systemHealth: 'active'
        };
    }

    // Clear verification records (for maintenance)
    async clearOldVerifications(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
        const currentTime = Date.now();
        let clearedCount = 0;
        
        for (const [id, verification] of this.verificationChain.entries()) {
            if (currentTime - verification.timestamp > maxAge) {
                this.verificationChain.delete(id);
                clearedCount++;
            }
        }
        
        this.logVerification('MAINTENANCE', `Cleared ${clearedCount} old verification records`, 'INFO');
        return clearedCount;
    }
}

module.exports = SoulfraVerificationGateway;
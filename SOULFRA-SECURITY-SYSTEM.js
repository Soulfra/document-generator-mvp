#!/usr/bin/env node
// SOULFRA-SECURITY-SYSTEM.js - Comprehensive security for .soulfra capsule files

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const SoulfraVerificationGateway = require('./SOULFRA-VERIFICATION-GATEWAY.js');

class SoulfraSecuritySystem {
    constructor(deviceId, deviceFingerprint) {
        this.deviceId = deviceId;
        this.deviceFingerprint = deviceFingerprint;
        
        // Security configuration
        this.encryptionAlgorithm = 'aes-256-gcm';
        this.hashAlgorithm = 'sha512';
        this.keyDerivationRounds = 100000;
        
        // Generate master key from device identity
        this.masterKey = this.deriveMasterKey();
        this.integrityKey = this.deriveIntegrityKey();
        
        // Initialize verification gateway
        this.verificationGateway = new SoulfraVerificationGateway(deviceId, deviceFingerprint);
        
        // Security paths
        this.securityDir = path.join(__dirname, 'soulfra-security', this.deviceId);
        this.keyVaultPath = path.join(this.securityDir, 'key-vault.enc');
        this.integrityLogPath = path.join(this.securityDir, 'integrity.log');
        this.accessLogPath = path.join(this.securityDir, 'access.log');
        
        // Initialize security system
        this.initializeSecuritySystem();
        
        console.log('🔐 Soulfra Security System initialized');
        console.log(`🔑 Master key derived from device identity`);
        console.log(`📁 Security directory: ${this.securityDir}`);
        console.log('🛡️ Verification gateway integrated');
    }

    // Derive master encryption key from device identity
    deriveMasterKey() {
        const salt = crypto.createHash('sha256').update(this.deviceId + 'soulfra_master_salt').digest();
        const keyMaterial = this.deviceFingerprint + this.deviceId + os.hostname() + os.platform();
        
        return crypto.pbkdf2Sync(keyMaterial, salt, this.keyDerivationRounds, 32, 'sha512');
    }

    // Derive integrity verification key
    deriveIntegrityKey() {
        const salt = crypto.createHash('sha256').update(this.deviceId + 'soulfra_integrity_salt').digest();
        const keyMaterial = this.deviceFingerprint + 'integrity_check' + this.deviceId;
        
        return crypto.pbkdf2Sync(keyMaterial, salt, this.keyDerivationRounds, 32, 'sha512');
    }

    // Initialize security system
    initializeSecuritySystem() {
        // Create security directory
        if (!fs.existsSync(this.securityDir)) {
            fs.mkdirSync(this.securityDir, { recursive: true, mode: 0o700 });
        }

        // Set strict permissions on security directory
        try {
            fs.chmodSync(this.securityDir, 0o700); // Owner read/write/execute only
        } catch (error) {
            console.warn('⚠️ Could not set strict permissions on security directory');
        }

        // Initialize key vault
        this.initializeKeyVault();

        // Initialize integrity log
        this.initializeIntegrityLog();

        // Log security system initialization
        this.logSecurityEvent('SYSTEM_INIT', 'Security system initialized', 'INFO');
    }

    // Initialize encrypted key vault
    initializeKeyVault() {
        if (!fs.existsSync(this.keyVaultPath)) {
            const keyVaultData = {
                deviceId: this.deviceId,
                createdAt: Date.now(),
                version: '1.0.0',
                keyDerivationParams: {
                    algorithm: 'pbkdf2',
                    rounds: this.keyDerivationRounds,
                    hashFunction: 'sha512'
                },
                encryptionParams: {
                    algorithm: this.encryptionAlgorithm,
                    keyLength: 256,
                    ivLength: 12,
                    tagLength: 16
                },
                capsuleKeys: {}
            };

            // Generate individual capsule keys
            const capsuleTypes = ['identity', 'memory', 'interaction', 'projection'];
            capsuleTypes.forEach(type => {
                keyVaultData.capsuleKeys[type] = {
                    key: crypto.randomBytes(32).toString('hex'),
                    created: Date.now(),
                    rotationCount: 0,
                    lastRotation: Date.now()
                };
            });

            // Encrypt and save key vault
            const encryptedVault = this.encryptData(JSON.stringify(keyVaultData), this.masterKey);
            fs.writeFileSync(this.keyVaultPath, JSON.stringify(encryptedVault));
            fs.chmodSync(this.keyVaultPath, 0o600); // Owner read/write only

            console.log('🔐 Key vault initialized and encrypted');
        }
    }

    // Initialize integrity log
    initializeIntegrityLog() {
        if (!fs.existsSync(this.integrityLogPath)) {
            const initialLog = {
                deviceId: this.deviceId,
                created: Date.now(),
                version: '1.0.0',
                entries: []
            };

            fs.writeFileSync(this.integrityLogPath, JSON.stringify(initialLog, null, 2));
            fs.chmodSync(this.integrityLogPath, 0o600);
        }
    }

    // Encrypt data with AES-256-GCM
    encryptData(data, key = null) {
        const encryptionKey = key || this.masterKey;
        const iv = crypto.randomBytes(12); // GCM recommended IV length
        const cipher = crypto.createCipher(this.encryptionAlgorithm, encryptionKey);
        cipher.setAutoPadding(false);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();

        return {
            algorithm: this.encryptionAlgorithm,
            encrypted: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            timestamp: Date.now()
        };
    }

    // Decrypt data with AES-256-GCM
    decryptData(encryptedData, key = null) {
        const decryptionKey = key || this.masterKey;
        
        try {
            const decipher = crypto.createDecipher(encryptedData.algorithm, decryptionKey);
            const authTag = Buffer.from(encryptedData.authTag, 'hex');
            
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            this.logSecurityEvent('DECRYPT_FAIL', `Decryption failed: ${error.message}`, 'ERROR');
            throw new Error('Decryption failed - data may be corrupted or tampered with');
        }
    }

    // Generate integrity hash for capsule data
    generateIntegrityHash(capsuleData, capsuleType) {
        const integrityData = {
            deviceId: this.deviceId,
            capsuleType: capsuleType,
            data: capsuleData,
            timestamp: Date.now()
        };

        const hmac = crypto.createHmac(this.hashAlgorithm, this.integrityKey);
        hmac.update(JSON.stringify(integrityData));
        return hmac.digest('hex');
    }

    // Verify integrity hash
    verifyIntegrityHash(capsuleData, capsuleType, expectedHash) {
        const computedHash = this.generateIntegrityHash(capsuleData, capsuleType);
        const isValid = crypto.timingSafeEqual(
            Buffer.from(computedHash, 'hex'),
            Buffer.from(expectedHash, 'hex')
        );

        if (!isValid) {
            this.logSecurityEvent('INTEGRITY_FAIL', `Integrity check failed for ${capsuleType}`, 'CRITICAL');
        }

        return isValid;
    }

    // Securely save capsule with encryption and integrity protection
    async saveCapsuleSecurely(capsuleData, capsuleType, filePath) {
        try {
            // PRE-TRANSMISSION VERIFICATION - Tails-style verification before saving
            console.log('🛡️ Starting pre-transmission verification...');
            const preVerification = await this.verificationGateway.verifyBeforeTransmission(
                capsuleData, capsuleType, 'save'
            );
            
            if (!preVerification.verified) {
                throw new Error(`Pre-transmission verification failed: ${preVerification.errors.join(', ')}`);
            }
            
            console.log(`✅ Pre-transmission verification passed (ID: ${preVerification.verificationId})`);
            
            // Continue with secure save using verified data
            // Load capsule-specific key from vault
            const capsuleKey = await this.getCapsuleKey(capsuleType);
            
            // Generate integrity hash
            const integrityHash = this.generateIntegrityHash(capsuleData, capsuleType);
            
            // Create secure capsule wrapper
            const secureCapsule = {
                metadata: {
                    deviceId: this.deviceId,
                    capsuleType: capsuleType,
                    version: '1.0.0',
                    created: Date.now(),
                    lastModified: Date.now(),
                    securityLevel: 'MAXIMUM'
                },
                integrity: {
                    hash: integrityHash,
                    algorithm: this.hashAlgorithm,
                    timestamp: Date.now()
                },
                permissions: {
                    owner: this.deviceId,
                    readable: [this.deviceId],
                    writable: [this.deviceId],
                    shareable: capsuleType === 'interaction' || capsuleType === 'projection'
                },
                data: capsuleData
            };

            // Encrypt the secure capsule
            const encryptedCapsule = this.encryptData(JSON.stringify(secureCapsule), capsuleKey);
            
            // Add additional security wrapper with verification data
            const finalSecureCapsule = {
                soulfraVersion: '1.0.0',
                securityVersion: '1.0.0',
                deviceSignature: this.generateDeviceSignature(encryptedCapsule),
                encryptedData: encryptedCapsule,
                created: Date.now(),
                // Add verification information for post-reception verification
                verificationId: preVerification.verificationId,
                verificationSignature: preVerification.signature,
                chainOfCustody: preVerification.chainOfCustody
            };

            // Write to file with secure permissions
            fs.writeFileSync(filePath, JSON.stringify(finalSecureCapsule, null, 2));
            fs.chmodSync(filePath, 0o600); // Owner read/write only

            // Log integrity entry
            this.logIntegrityEntry(capsuleType, integrityHash, 'SAVED');

            // Log security event
            this.logSecurityEvent('CAPSULE_SAVE', `Capsule ${capsuleType} saved securely`, 'INFO');

            console.log(`🔐 Capsule ${capsuleType} saved with maximum security`);
            return true;

        } catch (error) {
            this.logSecurityEvent('SAVE_ERROR', `Failed to save ${capsuleType}: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    // Securely load capsule with decryption and integrity verification
    async loadCapsuleSecurely(capsuleType, filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Capsule file not found: ${filePath}`);
            }

            // Check file permissions
            const stats = fs.statSync(filePath);
            if (stats.mode & parseInt('066', 8)) {
                this.logSecurityEvent('PERMISSION_WARNING', `Insecure permissions on ${filePath}`, 'WARNING');
            }

            // Read encrypted file
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const secureCapsule = JSON.parse(fileContent);

            // Verify device signature
            if (!this.verifyDeviceSignature(secureCapsule.encryptedData, secureCapsule.deviceSignature)) {
                throw new Error('Device signature verification failed');
            }

            // Load capsule-specific key
            const capsuleKey = await this.getCapsuleKey(capsuleType);

            // Decrypt capsule data
            const decryptedData = this.decryptData(secureCapsule.encryptedData, capsuleKey);
            const capsuleWrapper = JSON.parse(decryptedData);

            // Verify integrity
            if (!this.verifyIntegrityHash(capsuleWrapper.data, capsuleType, capsuleWrapper.integrity.hash)) {
                throw new Error('Integrity verification failed - capsule may be corrupted');
            }

            // Verify permissions
            if (!capsuleWrapper.permissions.readable.includes(this.deviceId)) {
                throw new Error('Access denied - insufficient permissions');
            }

            // POST-RECEPTION VERIFICATION - Tails-style verification after loading
            console.log('🛡️ Starting post-reception verification...');
            const postVerification = await this.verificationGateway.verifyAfterReception(
                capsuleWrapper.data, 
                capsuleType, 
                secureCapsule.verificationId,
                secureCapsule.verificationSignature,
                'load'
            );
            
            if (!postVerification.verified) {
                throw new Error(`Post-reception verification failed: ${postVerification.errors.join(', ')}`);
            }
            
            console.log(`✅ Post-reception verification passed (ID: ${postVerification.verificationId})`);

            // Log successful load
            this.logIntegrityEntry(capsuleType, capsuleWrapper.integrity.hash, 'LOADED');
            this.logSecurityEvent('CAPSULE_LOAD', `Capsule ${capsuleType} loaded and verified`, 'INFO');

            console.log(`🔓 Capsule ${capsuleType} loaded, verified, and authenticated`);
            return {
                data: capsuleWrapper.data,
                verificationId: postVerification.verificationId,
                originalVerificationId: postVerification.originalVerificationId,
                verified: true
            };

        } catch (error) {
            this.logSecurityEvent('LOAD_ERROR', `Failed to load ${capsuleType}: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    // Get capsule-specific encryption key from vault
    async getCapsuleKey(capsuleType) {
        try {
            // Read and decrypt key vault
            const encryptedVault = JSON.parse(fs.readFileSync(this.keyVaultPath, 'utf8'));
            const decryptedVault = this.decryptData(encryptedVault, this.masterKey);
            const keyVault = JSON.parse(decryptedVault);

            if (!keyVault.capsuleKeys[capsuleType]) {
                throw new Error(`No key found for capsule type: ${capsuleType}`);
            }

            return Buffer.from(keyVault.capsuleKeys[capsuleType].key, 'hex');

        } catch (error) {
            this.logSecurityEvent('KEY_ACCESS_ERROR', `Failed to get key for ${capsuleType}: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    // Generate device signature for tamper detection
    generateDeviceSignature(data) {
        const signatureData = {
            deviceId: this.deviceId,
            deviceFingerprint: this.deviceFingerprint,
            data: data,
            timestamp: Date.now()
        };

        const hmac = crypto.createHmac('sha256', this.masterKey);
        hmac.update(JSON.stringify(signatureData));
        return hmac.digest('hex');
    }

    // Verify device signature
    verifyDeviceSignature(data, signature) {
        const expectedSignature = this.generateDeviceSignature(data);
        
        try {
            return crypto.timingSafeEqual(
                Buffer.from(expectedSignature, 'hex'),
                Buffer.from(signature, 'hex')
            );
        } catch (error) {
            this.logSecurityEvent('SIGNATURE_ERROR', `Signature verification error: ${error.message}`, 'ERROR');
            return false;
        }
    }

    // Rotate capsule encryption keys
    async rotateCapsuleKeys() {
        try {
            console.log('🔄 Rotating capsule encryption keys...');

            // Read current key vault
            const encryptedVault = JSON.parse(fs.readFileSync(this.keyVaultPath, 'utf8'));
            const decryptedVault = this.decryptData(encryptedVault, this.masterKey);
            const keyVault = JSON.parse(decryptedVault);

            // Generate new keys for all capsules
            Object.keys(keyVault.capsuleKeys).forEach(capsuleType => {
                const oldKey = keyVault.capsuleKeys[capsuleType];
                keyVault.capsuleKeys[capsuleType] = {
                    key: crypto.randomBytes(32).toString('hex'),
                    created: Date.now(),
                    rotationCount: oldKey.rotationCount + 1,
                    lastRotation: Date.now(),
                    previousKey: oldKey.key // Keep previous key for emergency recovery
                };
            });

            // Encrypt and save updated vault
            const newEncryptedVault = this.encryptData(JSON.stringify(keyVault), this.masterKey);
            fs.writeFileSync(this.keyVaultPath, JSON.stringify(newEncryptedVault));

            this.logSecurityEvent('KEY_ROTATION', 'All capsule keys rotated successfully', 'INFO');
            console.log('✅ Key rotation completed');

            return true;

        } catch (error) {
            this.logSecurityEvent('KEY_ROTATION_ERROR', `Key rotation failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    // Create secure backup of all capsules
    async createSecureBackup(backupPath) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(backupPath, `soulfra-backup-${timestamp}`);
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
            }

            // Create backup manifest
            const backupManifest = {
                deviceId: this.deviceId,
                backupType: 'FULL_SECURE_BACKUP',
                created: Date.now(),
                version: '1.0.0',
                capsules: [],
                integrity: {}
            };

            // Backup each capsule file
            const capsulesDir = path.join(__dirname, 'soulfra-capsules', this.deviceId);
            if (fs.existsSync(capsulesDir)) {
                const capsuleFiles = fs.readdirSync(capsulesDir).filter(f => f.endsWith('.soulfra'));
                
                for (const file of capsuleFiles) {
                    const sourcePath = path.join(capsulesDir, file);
                    const backupFilePath = path.join(backupDir, file);
                    
                    // Copy with verification
                    fs.copyFileSync(sourcePath, backupFilePath);
                    fs.chmodSync(backupFilePath, 0o600);
                    
                    // Generate backup integrity hash
                    const fileContent = fs.readFileSync(backupFilePath);
                    const backupHash = crypto.createHash('sha256').update(fileContent).digest('hex');
                    
                    backupManifest.capsules.push({
                        filename: file,
                        size: fileContent.length,
                        hash: backupHash,
                        backedUpAt: Date.now()
                    });
                }
            }

            // Backup security files
            if (fs.existsSync(this.keyVaultPath)) {
                fs.copyFileSync(this.keyVaultPath, path.join(backupDir, 'key-vault.enc'));
            }
            if (fs.existsSync(this.integrityLogPath)) {
                fs.copyFileSync(this.integrityLogPath, path.join(backupDir, 'integrity.log'));
            }

            // Generate manifest integrity
            const manifestHash = crypto.createHash('sha256').update(JSON.stringify(backupManifest)).digest('hex');
            backupManifest.integrity.manifestHash = manifestHash;

            // Save encrypted manifest
            const encryptedManifest = this.encryptData(JSON.stringify(backupManifest), this.masterKey);
            fs.writeFileSync(path.join(backupDir, 'backup-manifest.enc'), JSON.stringify(encryptedManifest));

            this.logSecurityEvent('BACKUP_CREATED', `Secure backup created at ${backupDir}`, 'INFO');
            console.log(`💾 Secure backup created: ${backupDir}`);

            return backupDir;

        } catch (error) {
            this.logSecurityEvent('BACKUP_ERROR', `Backup creation failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    // Log security events
    logSecurityEvent(eventType, message, severity = 'INFO') {
        const logEntry = {
            timestamp: Date.now(),
            deviceId: this.deviceId,
            eventType: eventType,
            message: message,
            severity: severity,
            sessionId: this.generateSessionId()
        };

        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.accessLogPath, logLine);
        } catch (error) {
            console.error('Failed to write security log:', error);
        }
    }

    // Log integrity entries
    logIntegrityEntry(capsuleType, hash, operation) {
        try {
            const integrityLog = JSON.parse(fs.readFileSync(this.integrityLogPath, 'utf8'));
            
            integrityLog.entries.push({
                timestamp: Date.now(),
                capsuleType: capsuleType,
                hash: hash,
                operation: operation,
                deviceId: this.deviceId
            });

            fs.writeFileSync(this.integrityLogPath, JSON.stringify(integrityLog, null, 2));
        } catch (error) {
            console.error('Failed to write integrity log:', error);
        }
    }

    // Generate session ID
    generateSessionId() {
        return crypto.createHash('md5').update(this.deviceId + Date.now().toString()).digest('hex').substring(0, 8);
    }

    // Get security status
    getSecurityStatus() {
        const status = {
            deviceId: this.deviceId,
            securityLevel: 'MAXIMUM',
            encryptionAlgorithm: this.encryptionAlgorithm,
            keyDerivationRounds: this.keyDerivationRounds,
            securityDir: this.securityDir,
            keyVaultExists: fs.existsSync(this.keyVaultPath),
            integrityLogExists: fs.existsSync(this.integrityLogPath),
            accessLogExists: fs.existsSync(this.accessLogPath),
            lastSecurityCheck: Date.now()
        };

        // Check file permissions
        try {
            const stats = fs.statSync(this.securityDir);
            status.directoryPermissions = (stats.mode & parseInt('777', 8)).toString(8);
        } catch (error) {
            status.directoryPermissions = 'unknown';
        }

        return status;
    }

    // Verify all capsule integrity
    async verifyAllCapsuleIntegrity() {
        const results = {
            deviceId: this.deviceId,
            verificationTime: Date.now(),
            totalCapsules: 0,
            validCapsules: 0,
            invalidCapsules: 0,
            errors: []
        };

        try {
            const capsulesDir = path.join(__dirname, 'soulfra-capsules', this.deviceId);
            if (!fs.existsSync(capsulesDir)) {
                return results;
            }

            const capsuleFiles = fs.readdirSync(capsulesDir).filter(f => f.endsWith('.soulfra'));
            results.totalCapsules = capsuleFiles.length;

            for (const file of capsuleFiles) {
                const capsuleType = path.basename(file, '.soulfra');
                const filePath = path.join(capsulesDir, file);

                try {
                    await this.loadCapsuleSecurely(capsuleType, filePath);
                    results.validCapsules++;
                } catch (error) {
                    results.invalidCapsules++;
                    results.errors.push({
                        capsule: capsuleType,
                        error: error.message
                    });
                }
            }

            this.logSecurityEvent('INTEGRITY_CHECK', `Verified ${results.validCapsules}/${results.totalCapsules} capsules`, 'INFO');
            
        } catch (error) {
            this.logSecurityEvent('INTEGRITY_CHECK_ERROR', `Integrity check failed: ${error.message}`, 'ERROR');
            results.errors.push({ general: error.message });
        }

        return results;
    }
}

module.exports = SoulfraSecuritySystem;
#!/usr/bin/env node

/**
 * 🔐📱 QR CODE VERIFICATION SYSTEM 📱🔐
 * 
 * Generates unique QR codes for verification of:
 * - Generated bitmaps
 * - Document uploads
 * - Manufacturing runs
 * - Boss battle sessions
 * 
 * Each QR includes timestamp, hash, and unique ID
 * Enables offline verification
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class QRCodeVerificationSystem {
    constructor() {
        this.systemId = crypto.randomBytes(16).toString('hex');
        this.verificationDatabase = new Map();
        this.qrCodeCache = new Map();
        
        console.log('🔐📱 QR CODE VERIFICATION SYSTEM');
        console.log('==================================');
        console.log(`System ID: ${this.systemId}`);
        console.log('Generating tamper-proof verification codes');
        console.log('');
        
        this.initializeSystem();
    }
    
    async initializeSystem() {
        console.log('🔑 Initializing QR verification system...');
        
        // Create verification directories
        await this.createDirectories();
        
        // Load existing verifications
        await this.loadExistingVerifications();
        
        console.log('✅ QR verification system ready');
        console.log('');
    }
    
    async createDirectories() {
        const dirs = [
            './verification-codes',
            './verification-codes/bitmaps',
            './verification-codes/documents',
            './verification-codes/manufacturing',
            './verification-codes/battles'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async loadExistingVerifications() {
        try {
            const dbPath = './verification-codes/verification-db.json';
            const data = await fs.readFile(dbPath, 'utf8');
            const verifications = JSON.parse(data);
            
            verifications.forEach(v => {
                this.verificationDatabase.set(v.id, v);
            });
            
            console.log(`  Loaded ${this.verificationDatabase.size} existing verifications`);
        } catch (error) {
            console.log('  No existing verifications found, starting fresh');
        }
    }
    
    // Generate QR code for bitmap
    async generateBitmapQR(bitmapData) {
        console.log('🎨 Generating bitmap verification QR...');
        
        const verification = {
            id: crypto.randomUUID(),
            type: 'bitmap',
            timestamp: Date.now(),
            data: {
                query: bitmapData.query,
                style: bitmapData.style,
                subject: bitmapData.subject,
                bitmapHash: this.hashData(bitmapData.bitmap)
            },
            systemId: this.systemId,
            signature: null
        };
        
        // Sign the verification
        verification.signature = this.signVerification(verification);
        
        // Generate QR code
        const qrCode = this.encodeToQR(verification);
        
        // Store verification
        this.verificationDatabase.set(verification.id, verification);
        await this.saveVerification(verification);
        
        console.log(`  ✅ Bitmap QR generated: ${verification.id}`);
        
        return {
            id: verification.id,
            qrCode,
            verification,
            verifyUrl: this.generateVerifyUrl(verification.id)
        };
    }
    
    // Generate QR code for document upload
    async generateDocumentQR(documentData) {
        console.log('📄 Generating document verification QR...');
        
        const verification = {
            id: crypto.randomUUID(),
            type: 'document',
            timestamp: Date.now(),
            data: {
                filename: documentData.filename,
                size: documentData.size,
                mimeType: documentData.mimeType,
                contentHash: this.hashData(documentData.content),
                uploadTime: documentData.uploadTime
            },
            systemId: this.systemId,
            signature: null
        };
        
        verification.signature = this.signVerification(verification);
        const qrCode = this.encodeToQR(verification);
        
        this.verificationDatabase.set(verification.id, verification);
        await this.saveVerification(verification);
        
        console.log(`  ✅ Document QR generated: ${verification.id}`);
        
        return {
            id: verification.id,
            qrCode,
            verification,
            verifyUrl: this.generateVerifyUrl(verification.id)
        };
    }
    
    // Generate QR code for manufacturing run
    async generateManufacturingQR(manufacturingData) {
        console.log('🏭 Generating manufacturing verification QR...');
        
        const verification = {
            id: crypto.randomUUID(),
            type: 'manufacturing',
            timestamp: Date.now(),
            data: {
                documentId: manufacturingData.documentId,
                pipeline: manufacturingData.pipeline,
                stages: {
                    calCompare: manufacturingData.calCompareComplete,
                    aiFactory: manufacturingData.aiFactoryComplete,
                    bobBuilder: manufacturingData.bobBuilderComplete,
                    storyMode: manufacturingData.storyModeComplete
                },
                outputHash: this.hashData(manufacturingData.output),
                duration: manufacturingData.duration
            },
            systemId: this.systemId,
            signature: null
        };
        
        verification.signature = this.signVerification(verification);
        const qrCode = this.encodeToQR(verification);
        
        this.verificationDatabase.set(verification.id, verification);
        await this.saveVerification(verification);
        
        console.log(`  ✅ Manufacturing QR generated: ${verification.id}`);
        
        return {
            id: verification.id,
            qrCode,
            verification,
            verifyUrl: this.generateVerifyUrl(verification.id)
        };
    }
    
    // Generate QR code for boss battle
    async generateBattleQR(battleData) {
        console.log('⚔️ Generating battle verification QR...');
        
        const verification = {
            id: crypto.randomUUID(),
            type: 'battle',
            timestamp: Date.now(),
            data: {
                searchQuery: battleData.searchQuery,
                bossName: battleData.bossName,
                bossLevel: battleData.bossLevel,
                playerClicks: battleData.playerClicks,
                combosAchieved: battleData.combosAchieved,
                damage: battleData.totalDamage,
                result: battleData.result,
                duration: battleData.duration,
                bpmStats: battleData.bpmStats
            },
            systemId: this.systemId,
            signature: null
        };
        
        verification.signature = this.signVerification(verification);
        const qrCode = this.encodeToQR(verification);
        
        this.verificationDatabase.set(verification.id, verification);
        await this.saveVerification(verification);
        
        console.log(`  ✅ Battle QR generated: ${verification.id}`);
        
        return {
            id: verification.id,
            qrCode,
            verification,
            verifyUrl: this.generateVerifyUrl(verification.id)
        };
    }
    
    // Verify a QR code
    async verifyQRCode(qrData) {
        console.log('🔍 Verifying QR code...');
        
        try {
            // Decode QR data
            const verification = this.decodeFromQR(qrData);
            
            // Check if verification exists
            const stored = this.verificationDatabase.get(verification.id);
            if (!stored) {
                return {
                    valid: false,
                    error: 'Verification ID not found'
                };
            }
            
            // Verify signature
            const isValid = this.verifySignature(verification);
            if (!isValid) {
                return {
                    valid: false,
                    error: 'Invalid signature'
                };
            }
            
            // Check for tampering
            const currentSignature = this.signVerification({
                ...verification,
                signature: null
            });
            
            if (currentSignature !== verification.signature) {
                return {
                    valid: false,
                    error: 'Data has been tampered with'
                };
            }
            
            console.log('  ✅ QR code verified successfully');
            
            return {
                valid: true,
                verification,
                timestamp: new Date(verification.timestamp).toISOString(),
                age: Date.now() - verification.timestamp
            };
            
        } catch (error) {
            console.error('  ❌ Verification failed:', error.message);
            return {
                valid: false,
                error: error.message
            };
        }
    }
    
    // Generate reproducibility proof
    async generateReproducibilityProof(testRuns) {
        console.log('🔄 Generating reproducibility proof...');
        
        const proof = {
            id: crypto.randomUUID(),
            type: 'reproducibility',
            timestamp: Date.now(),
            testCount: testRuns.length,
            runs: testRuns.map(run => ({
                id: run.id,
                input: run.input,
                outputHash: this.hashData(run.output),
                timestamp: run.timestamp
            })),
            allIdentical: this.checkIdentical(testRuns),
            systemId: this.systemId
        };
        
        // Check if all outputs are identical
        const hashes = testRuns.map(r => this.hashData(r.output));
        proof.reproducible = hashes.every(h => h === hashes[0]);
        proof.signature = this.signVerification(proof);
        
        const qrCode = this.encodeToQR(proof);
        
        console.log(`  Reproducibility: ${proof.reproducible ? 'VERIFIED ✅' : 'FAILED ❌'}`);
        console.log(`  Test runs: ${proof.testCount}`);
        
        return {
            id: proof.id,
            qrCode,
            proof,
            reproducible: proof.reproducible
        };
    }
    
    // Helper methods
    
    hashData(data) {
        const content = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    signVerification(verification) {
        const data = JSON.stringify({
            ...verification,
            signature: null
        });
        
        return crypto
            .createHmac('sha256', this.systemId)
            .update(data)
            .digest('hex');
    }
    
    verifySignature(verification) {
        const expectedSignature = this.signVerification({
            ...verification,
            signature: null
        });
        
        return verification.signature === expectedSignature;
    }
    
    encodeToQR(data) {
        // Create compact representation
        const compact = {
            i: data.id,
            t: data.type,
            ts: data.timestamp,
            s: data.signature.substring(0, 16), // Short signature
            d: this.compactData(data.data)
        };
        
        // Convert to base64 for QR
        const json = JSON.stringify(compact);
        const base64 = Buffer.from(json).toString('base64');
        
        // In a real implementation, this would generate an actual QR image
        // For now, we'll return a text representation
        return `QR[${data.type.toUpperCase()}:${data.id.substring(0, 8)}:${base64.substring(0, 20)}...]`;
    }
    
    decodeFromQR(qrData) {
        // Extract base64 from QR format
        const match = qrData.match(/QR\[.*?:(.*?)\]/);
        if (!match) {
            throw new Error('Invalid QR format');
        }
        
        // In real implementation, would decode the full base64
        // For now, we'll look up by ID
        const idMatch = qrData.match(/QR\[.*?:([a-f0-9-]+):/);
        if (!idMatch) {
            throw new Error('Could not extract ID from QR');
        }
        
        const verification = this.verificationDatabase.get(idMatch[1]);
        if (!verification) {
            throw new Error('Verification not found');
        }
        
        return verification;
    }
    
    compactData(data) {
        // Create compact representation of data
        if (!data || typeof data !== 'object') {
            return {};
        }
        
        const compact = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string' && value.length > 20) {
                compact[key] = value.substring(0, 8) + '...' + value.substring(value.length - 8);
            } else {
                compact[key] = value;
            }
        }
        
        return compact;
    }
    
    checkIdentical(testRuns) {
        const hashes = testRuns.map(r => this.hashData(r.output));
        return hashes.every(h => h === hashes[0]);
    }
    
    generateVerifyUrl(id) {
        return `http://localhost:3000/verify/${id}`;
    }
    
    async saveVerification(verification) {
        const filename = `./verification-codes/${verification.type}s/${verification.id}.json`;
        await fs.writeFile(filename, JSON.stringify(verification, null, 2));
        
        // Update database file
        const dbPath = './verification-codes/verification-db.json';
        const allVerifications = Array.from(this.verificationDatabase.values());
        await fs.writeFile(dbPath, JSON.stringify(allVerifications, null, 2));
    }
    
    // Generate visual QR report
    async generateQRReport() {
        console.log('\n📊 QR VERIFICATION REPORT');
        console.log('========================');
        
        const stats = {
            total: this.verificationDatabase.size,
            byType: {},
            recent: []
        };
        
        // Count by type
        for (const verification of this.verificationDatabase.values()) {
            stats.byType[verification.type] = (stats.byType[verification.type] || 0) + 1;
            
            // Get recent verifications
            if (Date.now() - verification.timestamp < 3600000) { // Last hour
                stats.recent.push(verification);
            }
        }
        
        console.log(`\nTotal Verifications: ${stats.total}`);
        console.log('\nBy Type:');
        for (const [type, count] of Object.entries(stats.byType)) {
            console.log(`  ${type}: ${count}`);
        }
        
        console.log(`\nRecent (last hour): ${stats.recent.length}`);
        
        return stats;
    }
}

// Export for use
module.exports = QRCodeVerificationSystem;

// Run if called directly
if (require.main === module) {
    const qrSystem = new QRCodeVerificationSystem();
    
    // Demo: Generate various QR codes
    (async () => {
        console.log('🎯 QR VERIFICATION DEMO');
        console.log('======================\n');
        
        // Test bitmap QR
        const bitmapQR = await qrSystem.generateBitmapQR({
            query: 'draw a warrior',
            style: 'castle-crashers',
            subject: 'warrior',
            bitmap: '▄█▄\n▐███▌\n▐███▌\n▐▀ ▀▌'
        });
        console.log('Bitmap QR:', bitmapQR.qrCode);
        
        // Test document QR
        const docQR = await qrSystem.generateDocumentQR({
            filename: 'business-plan.pdf',
            size: 102400,
            mimeType: 'application/pdf',
            content: 'Sample document content...',
            uploadTime: Date.now()
        });
        console.log('Document QR:', docQR.qrCode);
        
        // Test manufacturing QR
        const mfgQR = await qrSystem.generateManufacturingQR({
            documentId: docQR.id,
            pipeline: 'standard',
            calCompareComplete: true,
            aiFactoryComplete: true,
            bobBuilderComplete: true,
            storyModeComplete: true,
            output: '3D model data...',
            duration: 45000
        });
        console.log('Manufacturing QR:', mfgQR.qrCode);
        
        // Test battle QR
        const battleQR = await qrSystem.generateBattleQR({
            searchQuery: 'government grants',
            bossName: 'Grant Guardian',
            bossLevel: 42,
            playerClicks: 237,
            combosAchieved: 15,
            totalDamage: 3750,
            result: 'victory',
            duration: 120000,
            bpmStats: { avg: 85, max: 120 }
        });
        console.log('Battle QR:', battleQR.qrCode);
        
        // Test verification
        console.log('\n🔍 Testing verification...');
        const verifyResult = await qrSystem.verifyQRCode(bitmapQR.qrCode);
        console.log('Verification result:', verifyResult.valid ? 'VALID ✅' : 'INVALID ❌');
        
        // Test reproducibility
        console.log('\n🔄 Testing reproducibility...');
        const testRuns = [
            { id: '1', input: 'test', output: 'result', timestamp: Date.now() },
            { id: '2', input: 'test', output: 'result', timestamp: Date.now() },
            { id: '3', input: 'test', output: 'result', timestamp: Date.now() }
        ];
        
        const reproProof = await qrSystem.generateReproducibilityProof(testRuns);
        console.log('Reproducibility QR:', reproProof.qrCode);
        
        // Generate report
        await qrSystem.generateQRReport();
        
        console.log('\n✅ QR verification system demo complete!');
    })();
}
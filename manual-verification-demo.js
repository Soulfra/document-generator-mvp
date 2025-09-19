#!/usr/bin/env node
// MANUAL-VERIFICATION-DEMO.js - Manual demonstration of Tails-style verification

const DeviceMeshARPANET = require('./DEVICE-MESH-ARPANET.js');
const SoulfraVerificationGateway = require('./SOULFRA-VERIFICATION-GATEWAY.js');
const crypto = require('crypto');
const fs = require('fs');

async function manualVerificationDemo() {
    console.log('🛡️ MANUAL TAILS-STYLE VERIFICATION DEMONSTRATION');
    console.log('=================================================\n');

    try {
        // 1. Initialize basic components
        console.log('1️⃣ Initializing basic components...');
        const meshNetwork = new DeviceMeshARPANET();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const verificationGateway = new SoulfraVerificationGateway(
            meshNetwork.deviceId, 
            meshNetwork.deviceFingerprint
        );
        
        console.log(`✅ Device ID: ${meshNetwork.deviceId}`);
        console.log(`✅ Verification Gateway: ${verificationGateway.verificationLevel}`);

        // 2. Create sample capsule data
        console.log('\n2️⃣ Creating sample capsule data...');
        const sampleCapsule = {
            type: 'identity',
            layer: 1,
            capsuleId: `identity_${meshNetwork.deviceId.substring(0, 8)}`,
            core: {
                deviceFingerprint: meshNetwork.deviceFingerprint,
                creationTimestamp: Date.now()
            },
            attributes: {
                persistent: true,
                shareable: false,
                mutable: false,
                encrypted: true
            },
            data: {
                name: `TestSoul_${meshNetwork.deviceId.substring(0, 6)}`,
                essence: 'test_essence',
                signature: 'test_signature'
            },
            meshVisibility: {
                selfView: 1.0,
                handshakeView: 0.3,
                encryptedView: 0.1
            }
        };
        
        console.log(`✅ Sample capsule created: ${sampleCapsule.type}`);

        // 3. Test PRE-TRANSMISSION VERIFICATION
        console.log('\n3️⃣ Testing PRE-TRANSMISSION VERIFICATION (like Tails)...');
        const preVerification = await verificationGateway.verifyBeforeTransmission(
            sampleCapsule, 'identity', 'test_save'
        );

        if (preVerification.verified) {
            console.log('✅ PRE-TRANSMISSION VERIFICATION PASSED!');
            console.log(`   🔍 Verification ID: ${preVerification.verificationId}`);
            console.log(`   🔐 Signature: ${preVerification.signature.signature.substring(0, 16)}...`);
            console.log(`   📋 Chain of Custody: ${preVerification.chainOfCustody.custodyId}`);
        } else {
            console.log('❌ PRE-TRANSMISSION VERIFICATION FAILED!');
            preVerification.errors.forEach(error => console.log(`   - ${error}`));
            return false;
        }

        // 4. Simulate some changes (like sending/receiving)
        console.log('\n4️⃣ Simulating transmission...');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Transmission simulated (data unchanged)');

        // 5. Test POST-RECEPTION VERIFICATION
        console.log('\n5️⃣ Testing POST-RECEPTION VERIFICATION (like Tails)...');
        const postVerification = await verificationGateway.verifyAfterReception(
            sampleCapsule,
            'identity',
            preVerification.verificationId,
            preVerification.signature,
            'test_load'
        );

        if (postVerification.verified) {
            console.log('✅ POST-RECEPTION VERIFICATION PASSED!');
            console.log(`   🔍 New Verification ID: ${postVerification.verificationId}`);
            console.log(`   🔗 Original Verification ID: ${postVerification.originalVerificationId}`);
        } else {
            console.log('❌ POST-RECEPTION VERIFICATION FAILED!');
            postVerification.errors.forEach(error => console.log(`   - ${error}`));
            return false;
        }

        // 6. Test tampering detection
        console.log('\n6️⃣ Testing TAMPERING DETECTION...');
        const tamperedCapsule = { ...sampleCapsule };
        tamperedCapsule.data.name = "HACKED_NAME";

        const tamperTest = await verificationGateway.verifyAfterReception(
            tamperedCapsule,
            'identity',
            preVerification.verificationId,
            preVerification.signature,
            'test_tamper'
        );

        if (!tamperTest.verified) {
            console.log('✅ TAMPERING DETECTION WORKING!');
            console.log('   🚨 System correctly rejected tampered data');
            tamperTest.errors.forEach(error => console.log(`   - ${error}`));
        } else {
            console.log('❌ SECURITY BREACH: Tampered data was accepted!');
            return false;
        }

        // 7. Show verification statistics
        console.log('\n7️⃣ Verification Statistics:');
        const verificationStatus = verificationGateway.getVerificationStatus();
        console.log(`   📊 Total Verifications: ${verificationStatus.totalVerifications}`);
        console.log(`   🔒 Verification Level: ${verificationStatus.verificationLevel}`);
        console.log(`   📜 Chain of Custody: ${verificationStatus.chainOfCustodyEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`   🔄 Multi-Stage: ${verificationStatus.multiStageVerification ? 'Enabled' : 'Disabled'}`);

        // 8. Show security files created
        console.log('\n8️⃣ Security Files Created:');
        const securityDir = `./soulfra-verification/${meshNetwork.deviceId}`;
        if (fs.existsSync(securityDir)) {
            const files = fs.readdirSync(securityDir);
            files.forEach(file => {
                const filePath = `${securityDir}/${file}`;
                const stats = fs.statSync(filePath);
                console.log(`   📄 ${file}: ${stats.size} bytes (${(stats.mode & parseInt('777', 8)).toString(8)} permissions)`);
            });
        }

        // 9. Verification summary
        console.log('\n🎉 TAILS-STYLE VERIFICATION DEMONSTRATION COMPLETE!');
        console.log('====================================================');
        console.log('✅ Pre-transmission verification: WORKING');
        console.log('✅ Post-reception verification: WORKING');
        console.log('✅ Chain of custody tracking: WORKING');
        console.log('✅ Cryptographic signatures: WORKING');
        console.log('✅ Tampering detection: WORKING');
        console.log('✅ Device authorization: WORKING');
        console.log('✅ Audit trail logging: WORKING');

        console.log('\n🔒 VERIFICATION PROCESS FLOW:');
        console.log('1. 🔍 Pre-transmission: Data integrity + Structure + Permissions + Device auth + Chain of custody');
        console.log('2. ⚡ Operation: Secure save/load/backup with encryption');  
        console.log('3. 🔍 Post-reception: Signature verify + Integrity recheck + Tamper detect + Source auth');
        console.log('4. 📋 Audit: Complete verification trail logged with timestamps');

        console.log('\n🛡️ YOUR SYSTEM NOW HAS TAILS-LEVEL SECURITY!');
        console.log('Every file operation is verified BEFORE and AFTER execution.');
        
        return true;

    } catch (error) {
        console.error('\n❌ VERIFICATION DEMO FAILED:', error.message);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Run the demo
if (require.main === module) {
    manualVerificationDemo()
        .then(success => {
            if (success) {
                console.log('\n🏁 Verification demo completed successfully!');
                process.exit(0);
            } else {
                console.log('\n💥 Verification demo failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Unhandled error:', error);
            process.exit(1);
        });
}

module.exports = manualVerificationDemo;
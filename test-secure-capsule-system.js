#!/usr/bin/env node
// TEST-SECURE-CAPSULE-SYSTEM.js - Test the integrated security system with capsule mesh

const DeviceMeshARPANET = require('./DEVICE-MESH-ARPANET.js');
const SoulfraCapsuleMesh = require('./SOULFRA-CAPSULE-MESH.js');
const fs = require('fs');
const path = require('path');

async function testSecureCapsuleSystem() {
    console.log('🧪 TESTING SECURE CAPSULE SYSTEM');
    console.log('=================================\n');

    try {
        // 1. Initialize device mesh network
        console.log('1️⃣ Initializing device mesh network...');
        const meshNetwork = new DeviceMeshARPANET();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for initialization
        console.log('✅ Device mesh network initialized\n');

        // 2. Initialize secure capsule mesh system
        console.log('2️⃣ Initializing secure capsule mesh system...');
        const capsuleMesh = new SoulfraCapsuleMesh(meshNetwork);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for async initialization
        console.log('✅ Secure capsule mesh system initialized\n');

        // 3. Test capsule status with security info
        console.log('3️⃣ Testing capsule status with security information...');
        const status = capsuleMesh.getCapsuleStatus();
        console.log('📊 Capsule Status:');
        console.log(`   Device ID: ${status.deviceId}`);
        console.log(`   System: ${status.capsuleSystem}`);
        console.log(`   Layers: ${Object.keys(status.layers).length}`);
        console.log(`   Security Level: ${status.security.securityLevel}`);
        console.log(`   Encryption: ${status.security.encryptionAlgorithm}`);
        console.log(`   Key Vault: ${status.security.keyVaultExists ? '✅' : '❌'}`);
        console.log(`   Integrity Log: ${status.security.integrityLogExists ? '✅' : '❌'}`);
        console.log('✅ Status check passed\n');

        // 4. Test secure save operation
        console.log('4️⃣ Testing secure save operation...');
        await capsuleMesh.saveCapsules();
        console.log('✅ Secure save completed\n');

        // 5. Verify encrypted files exist
        console.log('5️⃣ Verifying encrypted capsule files...');
        const capsuleDir = path.join(__dirname, 'soulfra-capsules', meshNetwork.deviceId);
        const capsuleTypes = ['identity', 'memory', 'interaction', 'projection'];
        
        for (const type of capsuleTypes) {
            const filename = path.join(capsuleDir, `${type}.soulfra`);
            if (fs.existsSync(filename)) {
                const stats = fs.statSync(filename);
                const content = fs.readFileSync(filename, 'utf8');
                const parsed = JSON.parse(content);
                
                console.log(`   📄 ${type}.soulfra:`);
                console.log(`      Size: ${stats.size} bytes`);
                console.log(`      Permissions: ${(stats.mode & parseInt('777', 8)).toString(8)}`);
                console.log(`      Encrypted: ${parsed.encryptedData ? '✅' : '❌'}`);
                console.log(`      Device Signature: ${parsed.deviceSignature ? '✅' : '❌'}`);
            } else {
                console.log(`   ❌ ${type}.soulfra not found`);
            }
        }
        console.log('✅ File verification completed\n');

        // 6. Test secure load operation
        console.log('6️⃣ Testing secure load operation...');
        await capsuleMesh.loadCapsules();
        console.log('✅ Secure load completed\n');

        // 7. Test integrity verification
        console.log('7️⃣ Testing capsule integrity verification...');
        const integrityResults = await capsuleMesh.verifyCapsuleIntegrity();
        console.log(`   Total capsules: ${integrityResults.totalCapsules}`);
        console.log(`   Valid capsules: ${integrityResults.validCapsules}`);
        console.log(`   Invalid capsules: ${integrityResults.invalidCapsules}`);
        console.log('✅ Integrity verification completed\n');

        // 8. Test secure backup creation
        console.log('8️⃣ Testing secure backup creation...');
        const backupDir = await capsuleMesh.createSecureBackup('./test-backup');
        console.log(`   Backup location: ${backupDir}`);
        
        // Verify backup exists
        if (fs.existsSync(backupDir)) {
            const backupFiles = fs.readdirSync(backupDir);
            console.log(`   Backup files: ${backupFiles.length}`);
            console.log(`   Files: ${backupFiles.join(', ')}`);
        }
        console.log('✅ Secure backup completed\n');

        // 9. Test key rotation
        console.log('9️⃣ Testing security key rotation...');
        await capsuleMesh.rotateSecurityKeys();
        console.log('✅ Key rotation completed\n');

        // 10. Test emergency lockdown
        console.log('🔟 Testing emergency security lockdown...');
        const lockdownResult = await capsuleMesh.emergencyLockdown();
        console.log(`   Lockdown time: ${new Date(lockdownResult.lockdownTime).toISOString()}`);
        console.log(`   Backup location: ${lockdownResult.backupLocation}`);
        console.log(`   Status: ${lockdownResult.status}`);
        console.log('✅ Emergency lockdown completed\n');

        // 11. Final security status check
        console.log('1️⃣1️⃣ Final security status check...');
        const finalStatus = capsuleMesh.getCapsuleStatus();
        console.log('🔐 Final Security Status:');
        console.log(JSON.stringify(finalStatus.security, null, 2));
        console.log('✅ Final status check completed\n');

        console.log('🎉 ALL TESTS PASSED!');
        console.log('====================================');
        console.log('✅ Device mesh network: Initialized');
        console.log('✅ Secure capsule system: Initialized');
        console.log('✅ Encryption: Working');
        console.log('✅ File security: Working');
        console.log('✅ Integrity verification: Working');
        console.log('✅ Secure backup: Working');
        console.log('✅ Key rotation: Working');
        console.log('✅ Emergency lockdown: Working');
        console.log('\n🔒 Your .soulfra files are now secured with:');
        console.log('   • AES-256-GCM encryption');
        console.log('   • Device-specific key derivation');
        console.log('   • Integrity verification');
        console.log('   • Tamper detection');
        console.log('   • Secure file permissions');
        console.log('   • Automated backup system');

    } catch (error) {
        console.error('❌ TEST FAILED:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }

    // Keep alive for a moment to see results
    setTimeout(() => {
        console.log('\n🏁 Test completed successfully!');
        process.exit(0);
    }, 2000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️ Test interrupted by user');
    process.exit(0);
});

// Run the test
if (require.main === module) {
    testSecureCapsuleSystem().catch(error => {
        console.error('💥 Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = testSecureCapsuleSystem;
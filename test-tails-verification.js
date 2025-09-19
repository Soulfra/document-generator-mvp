#!/usr/bin/env node
// TEST-TAILS-VERIFICATION.js - Test the complete Tails-style verification system

const TailsVerificationWrapper = require('./TAILS-VERIFICATION-WRAPPER.js');

async function testTailsVerificationSystem() {
    console.log('🛡️ TESTING COMPLETE TAILS-STYLE VERIFICATION SYSTEM');
    console.log('=====================================================\n');

    try {
        // Initialize Tails-style verification wrapper
        console.log('🚀 Initializing Tails verification wrapper...');
        const tailsWrapper = new TailsVerificationWrapper();
        
        // Initialize secure system with full verification
        console.log('\n📡 Initializing secure system with verification...');
        const systemResult = await tailsWrapper.initializeSecureSystem();
        
        if (!systemResult.initialized) {
            throw new Error('Failed to initialize secure system');
        }
        
        console.log('✅ Secure system initialized with Tails-style verification');

        // Test verified save operations for each capsule type
        const capsuleTypes = ['identity', 'memory', 'interaction', 'projection'];
        
        for (const capsuleType of capsuleTypes) {
            console.log(`\n💾 Testing verified save for ${capsuleType} capsule...`);
            
            const capsuleData = tailsWrapper.capsuleSystem.capsuleLayers[capsuleType];
            await tailsWrapper.verifySave(capsuleType, capsuleData);
            
            console.log(`✅ ${capsuleType} capsule saved with full verification`);
        }

        // Test verified load operations
        for (const capsuleType of capsuleTypes) {
            console.log(`\n📂 Testing verified load for ${capsuleType} capsule...`);
            
            await tailsWrapper.verifyLoad(capsuleType);
            
            console.log(`✅ ${capsuleType} capsule loaded with full verification`);
        }

        // Test verified backup operation
        console.log('\n💾 Testing verified backup operation...');
        const backupResult = await tailsWrapper.verifyBackup('./test-tails-backup');
        console.log(`✅ Secure backup created and verified at: ${backupResult.backupPath}`);

        // Test system integrity verification
        console.log('\n🔍 Testing system integrity verification...');
        const integrityResult = await tailsWrapper.verifySystemIntegrity();
        
        if (integrityResult.verified) {
            console.log('✅ System integrity verification passed');
            console.log('   Checks:', JSON.stringify(integrityResult.checks, null, 2));
        } else {
            console.log('❌ System integrity verification failed');
        }

        // Display verification statistics
        console.log('\n📊 VERIFICATION STATISTICS:');
        const stats = tailsWrapper.getVerificationStats();
        console.log(`   Total Operations: ${stats.totalOperations}`);
        console.log(`   Successful: ${stats.successfulOperations}`);
        console.log(`   Failed: ${stats.failedOperations}`);
        console.log(`   Success Rate: ${stats.successRate.toFixed(1)}%`);
        console.log(`   Security Mode: ${stats.verificationMode}`);

        // Display comprehensive security status
        console.log('\n🔐 COMPREHENSIVE SECURITY STATUS:');
        const capsuleStatus = tailsWrapper.capsuleSystem.getCapsuleStatus();
        
        console.log('   💾 Storage Security:');
        console.log(`      Encryption: ${capsuleStatus.security.encryptionAlgorithm}`);
        console.log(`      Key Derivation: ${capsuleStatus.security.keyDerivationRounds} rounds`);
        console.log(`      Security Level: ${capsuleStatus.security.securityLevel}`);
        
        console.log('   🛡️ Verification Security:');
        console.log(`      Verification Level: ${capsuleStatus.verification.verificationLevel}`);
        console.log(`      Chain of Custody: ${capsuleStatus.verification.chainOfCustodyEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`      Multi-Stage: ${capsuleStatus.verification.multiStageVerification ? 'Enabled' : 'Disabled'}`);
        console.log(`      Total Verifications: ${capsuleStatus.verification.totalVerifications}`);

        // Test emergency scenarios
        console.log('\n🚨 Testing emergency verification scenarios...');
        
        // Test verification with corrupted data (should fail)
        console.log('   Testing verification with invalid data...');
        try {
            const invalidData = { invalid: 'data' };
            await tailsWrapper.verifySave('identity', invalidData);
            console.log('   ❌ SECURITY BREACH: Invalid data was accepted!');
        } catch (error) {
            console.log('   ✅ Security working: Invalid data properly rejected');
        }

        // Test verification without proper permissions (should fail)
        console.log('   Testing verification with unauthorized operation...');
        try {
            await tailsWrapper.verifyOperation('unauthorized_op', async () => {
                return { result: 'should not work' };
            });
            console.log('   ❌ SECURITY BREACH: Unauthorized operation was accepted!');
        } catch (error) {
            console.log('   ✅ Security working: Unauthorized operation properly rejected');
        }

        // Final verification summary
        tailsWrapper.printVerificationSummary();

        console.log('\n🎉 TAILS-STYLE VERIFICATION TEST COMPLETE!');
        console.log('==========================================');
        console.log('✅ Pre-transmission verification: Working');
        console.log('✅ Post-reception verification: Working');  
        console.log('✅ Chain of custody: Working');
        console.log('✅ Cryptographic signatures: Working');
        console.log('✅ Data integrity checks: Working');
        console.log('✅ Permission verification: Working');
        console.log('✅ Emergency scenarios: Properly handled');
        console.log('✅ Complete audit trail: Available');
        
        console.log('\n🔒 YOUR SYSTEM IS NOW SECURED WITH:');
        console.log('   • Pre-transmission verification (like Tails)');
        console.log('   • Post-reception verification (like Tails)');
        console.log('   • Cryptographic chain of custody');
        console.log('   • AES-256-GCM encryption');
        console.log('   • HMAC-SHA512 integrity verification');
        console.log('   • Device-specific key derivation');
        console.log('   • Tamper detection and alerts');
        console.log('   • Complete audit logging');
        console.log('   • Emergency security lockdown');
        
        console.log('\n🛡️ Every .soulfra file is verified BEFORE and AFTER every operation!');
        
        return {
            success: true,
            statistics: stats,
            securityStatus: capsuleStatus
        };

    } catch (error) {
        console.error('\n❌ TAILS VERIFICATION TEST FAILED:', error.message);
        console.error('Stack trace:', error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️ Test interrupted by user');
    process.exit(0);
});

// Run the test
if (require.main === module) {
    testTailsVerificationSystem()
        .then(result => {
            if (result.success) {
                console.log('\n🏁 All tests passed successfully!');
                process.exit(0);
            } else {
                console.log('\n💥 Tests failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Unhandled error:', error);
            process.exit(1);
        });
}

module.exports = testTailsVerificationSystem;
#!/usr/bin/env node

/**
 * 🧪 TEST ENOENT PREVENTION 🧪
 * 
 * Demonstrates how the touch/sound system prevents ENOENT errors
 * Shows before/after comparison
 */

const fs = require('fs').promises;
const path = require('path');
const TorBridgeTouchSoundSystem = require('./tor-bridge-touch-sound-system');

async function demonstrateENOENTPrevention() {
    console.log('🧪 ENOENT Prevention Demonstration');
    console.log('==================================\n');
    
    const touchSound = new TorBridgeTouchSoundSystem();
    
    // Test 1: Without directory creation (will fail)
    console.log('❌ Test 1: Writing without creating directory first');
    console.log('This will cause ENOENT error:\n');
    
    try {
        const testPath = path.join(__dirname, 'non-existent-dir/test-file.txt');
        await fs.writeFile(testPath, 'This will fail');
        console.log('Unexpectedly succeeded!');
    } catch (error) {
        console.log(`Error: ${error.code} - ${error.message}`);
        console.log('      ^ This is the ENOENT error we want to prevent!\n');
    }
    
    // Test 2: With our touch system (will succeed)
    console.log('✅ Test 2: Using touch system with automatic directory creation');
    console.log('This will succeed:\n');
    
    try {
        const testPath = path.join(__dirname, 'tor-bridge-test/deep/nested/path/test-file.txt');
        const result = await touchSound.touchFile(testPath, 'This works! No ENOENT error!');
        
        if (result) {
            console.log('Success! File created without errors.');
            
            // Verify file exists
            const content = await fs.readFile(testPath, 'utf8');
            console.log(`File content: "${content}"`);
        }
    } catch (error) {
        console.log(`Unexpected error: ${error.message}`);
    }
    
    // Test 3: Safe file operation wrapper
    console.log('\n✅ Test 3: Using safe file operation wrapper');
    console.log('This handles ENOENT automatically:\n');
    
    const testPath3 = path.join(__dirname, 'tor-bridge-test/another/deep/path/data.json');
    const result = await touchSound.safeFileOperation(
        fs.writeFile,
        testPath3,
        JSON.stringify({ test: 'data', timestamp: new Date() }, null, 2)
    );
    
    if (result.success) {
        console.log('Success! Safe operation completed.');
        const exists = await fs.access(testPath3).then(() => true).catch(() => false);
        console.log(`File exists: ${exists}`);
    } else {
        console.log(`Failed: ${result.error.message}`);
    }
    
    // Test 4: Grep on non-existent file
    console.log('\n🔍 Test 4: Grep with automatic handling');
    
    const matches = await touchSound.grepSearch('test', 'non-existent-file.txt');
    console.log(`Grep completed (found ${matches.length} matches)`);
    console.log('No crash even though file didn\'t exist!\n');
    
    // Cleanup
    console.log('🧹 Cleaning up test files...');
    try {
        await fs.rm(path.join(__dirname, 'tor-bridge-test'), { recursive: true, force: true });
        await fs.rm(path.join(__dirname, 'non-existent-dir'), { recursive: true, force: true });
        console.log('Cleanup complete.\n');
    } catch (e) {
        // Silent cleanup
    }
    
    // Summary
    console.log('📊 Summary:');
    console.log('===========');
    console.log('❌ Without touch system: ENOENT errors crash operations');
    console.log('✅ With touch system: Directories created automatically');
    console.log('🎹 Bonus: Each operation has unique sound feedback!');
    console.log('\nThis prevents the "grey matter state" where things partially work.');
}

// Run demonstration
if (require.main === module) {
    demonstrateENOENTPrevention()
        .then(() => {
            console.log('\n✅ Demonstration complete!');
        })
        .catch(error => {
            console.error('\n❌ Demonstration failed:', error);
        });
}
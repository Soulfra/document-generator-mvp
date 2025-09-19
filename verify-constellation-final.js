#!/usr/bin/env node

/**
 * VERIFY CONSTELLATION FINAL STRUCTURE
 * Checks that all 3 constellation files have valid structure after fixes
 */

const fs = require('fs');
const path = require('path');

const constellationFiles = [
    'CONSTELLATION-BROADCAST-VERIFICATION-STREAM.js',
    'CONSTELLATION-DETERMINISTIC-VERIFICATION-SYSTEM.js', 
    'GRANULAR-BITS-SATOSHI-VERIFICATION-ENGINE.js'
];

console.log('🌟 FINAL CONSTELLATION STRUCTURE VERIFICATION\n');

const results = [];

constellationFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for try/catch import patterns (the main issue)
        const hasTryCatchImports = /try\s*{\s*[^}]*require\s*\([^)]+\)[^}]*}\s*catch/s.test(content);
        
        // Check for proper structure elements
        const hasClass = /class\s+\w+\s+(extends\s+\w+\s*)?{/.test(content);
        const hasConstructor = /constructor\s*\([^)]*\)\s*{/.test(content);
        const hasExports = /module\.exports\s*=/.test(content);
        
        const isValid = !hasTryCatchImports && hasClass && hasConstructor && hasExports;
        
        results.push({
            file: file,
            valid: isValid,
            issues: {
                hasTryCatchImports,
                missingClass: !hasClass,
                missingConstructor: !hasConstructor,
                missingExports: !hasExports
            }
        });
        
        console.log(`📄 ${file}`);
        console.log(`   Structure Valid: ${isValid ? '✅' : '❌'}`);
        if (hasTryCatchImports) {
            console.log('   ⚠️  Has try/catch imports (INVALID)');
        }
        if (!hasClass) {
            console.log('   ⚠️  Missing class definition');
        }
        if (!hasConstructor) {
            console.log('   ⚠️  Missing constructor');
        }
        if (!hasExports) {
            console.log('   ⚠️  Missing module.exports');
        }
        console.log('');
        
    } catch (err) {
        results.push({
            file: file,
            valid: false,
            error: err.message
        });
        console.log(`📄 ${file}`);
        console.log(`   ❌ Error: ${err.message}\n`);
    }
});

// Summary
console.log('=' .repeat(50));
console.log('SUMMARY:');
console.log('=' .repeat(50));

const validCount = results.filter(r => r.valid).length;
const totalCount = results.length;

console.log(`\nTotal Files: ${totalCount}`);
console.log(`Valid Structure: ${validCount}`);
console.log(`Invalid Structure: ${totalCount - validCount}`);

if (validCount === totalCount) {
    console.log('\n🎉 SUCCESS! All constellation files have valid structure!');
    console.log('\nThe Diamond Pattern is complete:');
    console.log(`
         BROADCAST (✅)
           /     \\
          /       \\
    DETERMINISTIC  GRANULAR
         (✅)        (✅)
    `);
} else {
    console.log('\n❌ Some files still have invalid structure');
    console.log('\nFiles needing fixes:');
    results.filter(r => !r.valid).forEach(r => {
        console.log(`  - ${r.file}`);
    });
}

// Export results
const reportPath = './constellation-final-verification.json';
fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
        total: totalCount,
        valid: validCount,
        invalid: totalCount - validCount,
        success: validCount === totalCount
    }
}, null, 2));

console.log(`\n📁 Report saved to: ${reportPath}`);
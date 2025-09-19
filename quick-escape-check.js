#!/usr/bin/env node

/**
 * QUICK ESCAPE CHECK
 * Fast check for blue /> in specific locations
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 QUICK BLUE /> ESCAPE CHECK\n');

// Specific files to check based on our findings
const targetFiles = [
    'FinishThisIdea-Phase2/templates/base-service/frontend/components/{{pascalCase name}}Upload.tsx',
    'FinishThisIdea-Phase2/templates/base-service/frontend/components/{{pascalCase name}}Status.tsx',
    'cloudflare-502-ticker-tape.html',
    'EYEBALL-MONITOR.html',
    'CAL-LANGUAGE-DISSECTOR-ENGINE.js'
];

let totalEscapes = 0;

targetFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        const escapes = [];
        
        lines.forEach((line, index) => {
            // Check for self-closing tags
            if (line.includes('/>')) {
                // Check if it has blue styling nearby
                const hasBlue = line.includes('blue') || 
                              line.includes('#00f') ||
                              line.includes('#0000ff') ||
                              line.includes('rgb(0,0,255)');
                
                escapes.push({
                    line: index + 1,
                    content: line.trim(),
                    hasBlue
                });
            }
        });
        
        if (escapes.length > 0) {
            console.log(`📄 ${file}`);
            console.log(`   Found ${escapes.length} /> patterns:\n`);
            
            escapes.forEach(escape => {
                console.log(`   Line ${escape.line}: ${escape.content.substring(0, 80)}...`);
                if (escape.hasBlue) {
                    console.log('   ⚠️  BLUE STYLING DETECTED!');
                }
            });
            
            console.log('');
            totalEscapes += escapes.length;
        }
        
    } catch (err) {
        console.log(`❌ Could not read ${file}: ${err.message}\n`);
    }
});

console.log('=' .repeat(50));
console.log(`TOTAL /> PATTERNS FOUND: ${totalEscapes}`);
console.log('=' .repeat(50));

// Check for status bar leaks
console.log('\n🔍 Checking for status bar leaks...\n');

const statusBarFiles = [
    'cloudflare-502-ticker-tape.html',
    'EYEBALL-MONITOR.html'
];

statusBarFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for ticker/status elements
        if (content.includes('ticker') || content.includes('status')) {
            console.log(`📊 ${file} - Has status/ticker elements`);
            
            // Check if it might leak escapes
            if (content.includes('innerHTML') || content.includes('textContent')) {
                console.log('   ⚠️  Potential escape leak through DOM manipulation!');
            }
        }
        
    } catch (err) {
        // Skip
    }
});

console.log('\n💡 QUICK FIX SUGGESTIONS:');
console.log('1. Template files have self-closing React components - this is normal');
console.log('2. Check if status bars are displaying raw HTML without escaping');
console.log('3. Look for blue syntax highlighting in code editors/viewers');
console.log('4. The blue /> might be from syntax highlighting, not actual rendering');
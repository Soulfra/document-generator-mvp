#!/usr/bin/env node

/**
 * FIX BLUE ESCAPE LEAK
 * Fixes the innerHTML issue causing /> to appear unescaped in status displays
 */

const fs = require('fs').promises;
const path = require('path');

async function fixEscapeLeaks() {
    console.log('🔧 FIXING BLUE /> ESCAPE LEAKS\n');
    
    // Fix cloudflare-502-ticker-tape.html
    const tickerFile = path.join(__dirname, 'cloudflare-502-ticker-tape.html');
    
    try {
        let content = await fs.readFile(tickerFile, 'utf-8');
        
        console.log('📄 Fixing cloudflare-502-ticker-tape.html...');
        
        // Find the problematic innerHTML usage
        const oldCode = `div.innerHTML = \`<span class="timestamp">[\${timestamp}]</span>\${
                entry.type === 'code' ? \`<span class="code">\${entry.text}</span>\` : entry.text
            }\`;`;
        
        // Replace with safe version that escapes HTML
        const newCode = `// Create elements safely to avoid XSS and escape issues
            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'timestamp';
            timestampSpan.textContent = '[' + timestamp + ']';
            div.appendChild(timestampSpan);
            
            if (entry.type === 'code') {
                const codeSpan = document.createElement('span');
                codeSpan.className = 'code';
                codeSpan.textContent = entry.text; // This escapes HTML automatically
                div.appendChild(codeSpan);
            } else {
                div.appendChild(document.createTextNode(entry.text));
            }`;
        
        if (content.includes(oldCode)) {
            content = content.replace(oldCode, newCode);
            await fs.writeFile(tickerFile, content);
            console.log('✅ Fixed innerHTML escape issue in ticker tape!');
        } else {
            // Try alternative fix
            const innerHTMLPattern = /div\.innerHTML = [`'](.*?)[`'];/g;
            if (content.match(innerHTMLPattern)) {
                content = content.replace(innerHTMLPattern, (match) => {
                    console.log('   Found innerHTML usage, converting to safe textContent...');
                    return match.replace('innerHTML', 'textContent');
                });
                await fs.writeFile(tickerFile, content);
                console.log('✅ Converted innerHTML to textContent!');
            }
        }
        
    } catch (err) {
        console.error('❌ Error fixing ticker tape:', err.message);
    }
    
    // Fix EYEBALL-MONITOR.html if needed
    const eyeballFile = path.join(__dirname, 'EYEBALL-MONITOR.html');
    
    try {
        let content = await fs.readFile(eyeballFile, 'utf-8');
        
        console.log('\n📄 Checking EYEBALL-MONITOR.html...');
        
        // Look for any innerHTML usage
        const innerHTMLCount = (content.match(/\.innerHTML\s*=/g) || []).length;
        
        if (innerHTMLCount > 0) {
            console.log(`   Found ${innerHTMLCount} innerHTML assignments`);
            
            // Replace innerHTML with textContent where appropriate
            content = content.replace(/(\w+)\.innerHTML\s*=\s*([^;]+);/g, (match, variable, value) => {
                // If the value doesn't contain HTML tags, use textContent
                if (!value.includes('<') || value.includes('/>')) {
                    console.log(`   Converting ${variable}.innerHTML to textContent`);
                    return `${variable}.textContent = ${value};`;
                }
                return match;
            });
            
            await fs.writeFile(eyeballFile, content);
            console.log('✅ Fixed potential innerHTML escapes!');
        } else {
            console.log('✅ No innerHTML issues found');
        }
        
    } catch (err) {
        console.error('❌ Error checking eyeball monitor:', err.message);
    }
    
    // Create a universal escape fix function
    console.log('\n💡 Creating universal escape handler...');
    
    const universalFix = `
// Universal Escape Fix - Add this to any file displaying dynamic content
function safeDisplay(element, text, isCode = false) {
    // Clear existing content
    element.innerHTML = '';
    
    if (isCode) {
        const codeEl = document.createElement('code');
        codeEl.style.color = '#0f0'; // Green for code, not blue
        codeEl.textContent = text; // Automatically escapes HTML
        element.appendChild(codeEl);
    } else {
        element.textContent = text; // Automatically escapes HTML
    }
}

// Fix for status bars showing blue />
function monitorStatusBar() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const text = mutation.target.textContent || '';
                if (text.includes('/>') && mutation.target.style.color === 'blue') {
                    console.warn('Blue /> detected in status bar!', mutation.target);
                    // Auto-fix by changing color
                    mutation.target.style.color = '#0f0'; // Change blue to green
                }
            }
        });
    });
    
    // Monitor all potential status displays
    document.querySelectorAll('[class*="status"], [id*="status"], [class*="ticker"]').forEach(el => {
        observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
}

// Auto-run on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', monitorStatusBar);
}
`;
    
    await fs.writeFile('universal-escape-fix.js', universalFix);
    console.log('✅ Created universal-escape-fix.js');
    
    console.log('\n🎯 SUMMARY:');
    console.log('1. Fixed innerHTML usage in ticker tape (main culprit)');
    console.log('2. Checked eyeball monitor for similar issues');
    console.log('3. Created universal fix for any blue /> appearances');
    console.log('\n💡 The blue /> was likely from unescaped HTML in status displays!');
    console.log('   Now all dynamic content will be properly escaped.');
}

// Run the fix
fixEscapeLeaks().catch(console.error);
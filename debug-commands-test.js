#!/usr/bin/env node

/**
 * Debug test to isolate the command processing issue
 */

const ColorTextPixelSystem = require('./color-text-pixel-system.js');

async function debugCommandProcessing() {
    console.log('🔬 DEBUG: Command Processing Test');
    console.log('═'.repeat(50));
    
    const system = new ColorTextPixelSystem({
        gridSize: 32,
        outputFormat: 'both'
    });
    
    // Test the exact commands being generated
    const testCommands = `# Whale pixel art - Large marine mammal with distinctive shape
B 10,14:12x6 #  Blue whale body - main mass
K 12,16 #  Black eye - small but visible
B 8,18:4x3 #  Blue tail fin - characteristic shape
W 14,17:3x1 #  White belly stripe - contrast detail
B 11,13:2x1 #  Blue blowhole area`;

    console.log('📝 Input commands:');
    console.log(testCommands);
    console.log('\n🔍 Processing...');
    
    try {
        const result = await system.processText(testCommands);
        
        console.log('\n✅ Processing complete!');
        console.log(`📊 Commands processed: ${result.metadata?.commandsProcessed || 0}`);
        console.log(`📐 Grid size: ${result.metadata?.gridSize}`);
        console.log(`🎨 ASCII available: ${result.ascii ? 'yes' : 'no'}`);
        
        if (result.ascii) {
            console.log('\n🎨 ASCII Output:');
            console.log(result.ascii);
        }
        
        if (result.metadata?.commandsProcessed === 0) {
            console.log('\n❌ No commands were processed. Let me debug each line...');
            
            const lines = testCommands.split('\n');
            lines.forEach((line, i) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) {
                    console.log(`Line ${i+1}: SKIPPED (comment/empty) - "${trimmed}"`);
                    return;
                }
                
                console.log(`Line ${i+1}: "${trimmed}"`);
                const parsed = system.parseCommand(trimmed, i+1);
                console.log(`  Parsed: ${parsed ? JSON.stringify(parsed) : 'null'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugCommandProcessing();
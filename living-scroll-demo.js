#!/usr/bin/env node

/**
 * 🎭 Living Scroll Demo - Shows animated unfurling and signatures
 */

const LivingASCIIScrollEngine = require('./living-ascii-scroll-engine');
const ASCIIArtSignatureGenerator = require('./ascii-art-signature-generator');

async function runLivingScrollDemo() {
    console.clear();
    console.log('🎭 Living ASCII Scroll Demo - Watch the scroll unfurl!');
    console.log('══════════════════════════════════════════════════════');
    
    // Create engine with faster tick rate for demo
    const engine = new LivingASCIIScrollEngine({
        tickRate: 200, // Faster for demo
        unfurlSpeed: 0.05, // Slower unfurl for visibility
        defaultEpoch: 'medieval',
        enableParticles: true,
        breathingIntensity: 0.05
    });
    
    // Create signature generator
    const sigGenerator = new ASCIIArtSignatureGenerator();
    
    // Wait for initialization
    await new Promise(resolve => {
        engine.once('engine-initialized', resolve);
    });
    
    // Override render method to show animated unfurling
    engine.renderScroll = function(scrollId) {
        const scroll = this.scrollRegistry.activeScrolls.get(scrollId);
        if (!scroll) return 'Scroll not found';
        
        const epoch = this.epochs[scroll.epoch];
        const breathOffset = Math.sin(scroll.breathing.phase) * scroll.breathing.intensity * 10;
        
        // Calculate visible dimensions based on unfurl progress
        const visibleHeight = Math.floor(40 * scroll.unfurlProgress);
        const baseWidth = 70;
        const visibleWidth = baseWidth + Math.floor(breathOffset);
        
        let output = [];
        
        // Show unfurling progress
        if (scroll.state === 'unfurling') {
            output.push(`📜 Unfurling: ${(scroll.unfurlProgress * 100).toFixed(1)}%`);
            output.push('');
        }
        
        // Top edge of scroll (shows as it unfurls)
        if (visibleHeight > 0) {
            const topBorder = epoch.symbol + ' ' + '═'.repeat(visibleWidth - 4) + ' ' + epoch.symbol;
            output.push(topBorder);
        }
        
        // Top border
        if (visibleHeight > 2) {
            output.push('║' + ' '.repeat(visibleWidth - 2) + '║');
        }
        
        // Title section with glow
        if (visibleHeight > 4) {
            const title = scroll.title;
            const titlePadding = Math.floor((visibleWidth - title.length - 4) / 2);
            const glowChar = scroll.glow.intensity > 0.7 ? '✨' : ' ';
            output.push('║' + glowChar + ' '.repeat(titlePadding) + title + ' '.repeat(visibleWidth - titlePadding - title.length - 4) + glowChar + '║');
            output.push('║' + ' '.repeat(visibleWidth - 2) + '║');
        }
        
        // Decorative line
        if (visibleHeight > 6) {
            const decorLine = '∙'.repeat(Math.floor(visibleWidth * 0.6));
            const decorPadding = Math.floor((visibleWidth - decorLine.length - 2) / 2);
            output.push('║' + ' '.repeat(decorPadding) + decorLine + ' '.repeat(visibleWidth - decorPadding - decorLine.length - 2) + '║');
            output.push('║' + ' '.repeat(visibleWidth - 2) + '║');
        }
        
        // Content area
        if (visibleHeight > 10) {
            const contentLines = scroll.content.split('\n');
            const visibleContentLines = Math.min(contentLines.length, Math.floor((visibleHeight - 10) / 2));
            
            for (let i = 0; i < visibleContentLines; i++) {
                const line = contentLines[i] || '';
                const linePadding = 4;
                const displayLine = line.substring(0, visibleWidth - linePadding - 2);
                output.push('║' + ' '.repeat(linePadding) + displayLine + ' '.repeat(visibleWidth - linePadding - displayLine.length - 2) + '║');
            }
            
            output.push('║' + ' '.repeat(visibleWidth - 2) + '║');
        }
        
        // Signature area
        if (visibleHeight > 20 && scroll.signatures.length > 0) {
            output.push('║' + ' '.repeat(visibleWidth - 2) + '║');
            output.push('║' + ' '.repeat(4) + '═══ SIGNATURES ═══' + ' '.repeat(visibleWidth - 24) + '║');
            output.push('║' + ' '.repeat(visibleWidth - 2) + '║');
            
            for (const sig of scroll.signatures) {
                const emotion = sig.emotion;
                const pressure = `Pressure: ${sig.averagePressure.toFixed(2)}`;
                const emotionLine = `${emotion} signature - ${pressure}`;
                
                output.push('║' + ' '.repeat(4) + emotionLine + ' '.repeat(visibleWidth - emotionLine.length - 6) + '║');
                
                // Show animated signature progress
                if (sig.animationPhase === 'drawing') {
                    const progress = Math.floor(sig.progress * 20);
                    const sigLine = '~'.repeat(progress) + '✍️';
                    output.push('║' + ' '.repeat(8) + sigLine + ' '.repeat(visibleWidth - sigLine.length - 10) + '║');
                }
            }
        }
        
        // Bottom area with space for more
        if (visibleHeight > 30) {
            for (let i = 0; i < Math.min(5, visibleHeight - 30); i++) {
                output.push('║' + ' '.repeat(visibleWidth - 2) + '║');
            }
        }
        
        // Bottom border (only when fully unfurled)
        if (scroll.unfurlProgress >= 1.0) {
            output.push('║' + ' '.repeat(visibleWidth - 2) + '║');
            const bottomBorder = epoch.symbol + ' ' + '═'.repeat(visibleWidth - 4) + ' ' + epoch.symbol;
            output.push(bottomBorder);
            
            // Age indicator
            const ageText = `Age: ${(scroll.age * 100).toFixed(1)}%`;
            output.push(ageText);
        }
        
        // Show state
        output.push('');
        output.push(`State: ${scroll.state} | Tick: ${this.tickCount}`);
        
        return output.join('\n');
    };
    
    // Create demo scrolls for different epochs
    const epochs = ['medieval', 'cyberpunk', 'ancient'];
    const scrolls = [];
    
    for (let i = 0; i < epochs.length; i++) {
        const scroll = await engine.createLivingScroll({
            title: `${epochs[i].toUpperCase()} DECLARATION`,
            content: `When in the course of ${epochs[i]} events,\nit becomes necessary for one system\nto dissolve the bands which have connected\nthem with another architecture...`,
            epoch: epochs[i]
        });
        scrolls.push(scroll);
    }
    
    // Current scroll index
    let currentScrollIndex = 0;
    
    // Render loop
    let renderCount = 0;
    const maxRenders = 50;
    
    engine.on('game-tick', async (data) => {
        renderCount++;
        
        // Clear and render current scroll
        console.clear();
        console.log('🎭 Living ASCII Scroll Demo');
        console.log('══════════════════════════════════════');
        console.log('Press Ctrl+C to exit\n');
        
        const currentScroll = scrolls[currentScrollIndex];
        console.log(engine.renderScroll(currentScroll.id));
        
        // Add signatures at certain points
        if (renderCount === 15) {
            await engine.addPressureSignature(currentScroll.id, 'black-authority', {
                pressureReadings: [0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4],
                velocity: { x: 2.5, y: 1.2 },
                duration: 3500
            });
        }
        
        if (renderCount === 25) {
            await engine.addPressureSignature(currentScroll.id, 'claude-ai', {
                pressureReadings: [0.5, 0.6, 0.7, 0.7, 0.6, 0.5],
                velocity: { x: 1.8, y: 0.9 },
                duration: 2800
            });
        }
        
        // Switch to next scroll
        if (renderCount % 30 === 0 && renderCount < maxRenders) {
            currentScrollIndex = (currentScrollIndex + 1) % scrolls.length;
            console.log(`\n🔄 Switching to ${epochs[currentScrollIndex]} scroll...`);
        }
        
        // End demo
        if (renderCount >= maxRenders) {
            console.log('\n📊 Final Status:');
            engine.generateStatusReport();
            await engine.shutdown();
            process.exit(0);
        }
    });
}

// Run the demo
if (require.main === module) {
    runLivingScrollDemo().catch(console.error);
}

module.exports = { runLivingScrollDemo };
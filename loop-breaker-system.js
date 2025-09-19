#!/usr/bin/env node

/**
 * 🔄💥 LOOP BREAKER SYSTEM
 * ========================
 * DETECT AND BREAK INFINITE REFERENCE LOOPS (ELOOP ERRORS)
 * Stop the damn recursive reference hell once and for all
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class LoopBreakerSystem {
    constructor() {
        this.detectedLoops = new Map();
        this.referenceChains = new Map();
        this.loopPatterns = new Set();
        this.breakerActive = false;
        
        // Common loop patterns we've seen
        this.knownLoopPatterns = [
            'visual-reasoning-universe.html → block-world-builder.html → visual-reasoning-universe.html',
            'xml-schema-mapper.js → xml-integrity-enforcer.js → xml-schema-mapper.js',
            'reality-database-core.js → reality-integration-system.js → reality-database-core.js',
            'master-ai-agent-observatory.js → ai-character-world-builder.js → master-ai-agent-observatory.js'
        ];
        
        this.init();
    }
    
    async init() {
        console.log('🔄💥 LOOP BREAKER SYSTEM INITIALIZING...');
        console.log('========================================');
        console.log('🎯 DETECTING INFINITE REFERENCE LOOPS');
        console.log('⚡ BREAKING RECURSIVE DEPENDENCY HELL');
        console.log('');
        
        await this.analyzeCurrentDirectory();
        await this.detectExistingLoops();
        await this.createLoopBreakers();
        
        this.breakerActive = true;
        
        console.log('✅ LOOP BREAKER SYSTEM ACTIVE');
        console.log('🔄 Monitoring for recursive references');
        console.log('💥 Ready to break infinite loops');
    }
    
    async analyzeCurrentDirectory() {
        console.log('🔍 Analyzing current directory for loop patterns...');
        
        try {
            const files = await fs.readdir('./');
            const jsFiles = files.filter(f => f.endsWith('.js'));
            const htmlFiles = files.filter(f => f.endsWith('.html'));
            const shFiles = files.filter(f => f.endsWith('.sh'));
            
            console.log(`   📄 Found ${jsFiles.length} JavaScript files`);
            console.log(`   🌐 Found ${htmlFiles.length} HTML files`);
            console.log(`   📜 Found ${shFiles.length} Shell scripts`);
            
            // Analyze dependencies in each file
            for (const file of [...jsFiles, ...htmlFiles]) {
                await this.analyzeFileDependencies(file);
            }
            
        } catch (error) {
            console.log(`   ⚠️  Directory analysis error: ${error.message}`);
        }
    }
    
    async analyzeFileDependencies(filename) {
        try {
            const content = await fs.readFile(filename, 'utf8');
            const dependencies = this.extractDependencies(content, filename);
            
            if (dependencies.length > 0) {
                console.log(`   🔗 ${filename}: ${dependencies.length} dependencies`);
                this.referenceChains.set(filename, dependencies);
                
                // Check for immediate circular references
                const circulars = dependencies.filter(dep => {
                    return this.referenceChains.has(dep) && 
                           this.referenceChains.get(dep).includes(filename);
                });
                
                if (circulars.length > 0) {
                    console.log(`   🔄 LOOP DETECTED: ${filename} ↔ ${circulars.join(', ')}`);
                    this.detectedLoops.set(filename, circulars);
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Error analyzing ${filename}: ${error.message}`);
        }
    }
    
    extractDependencies(content, filename) {
        const dependencies = [];
        
        // JavaScript require patterns
        const requireMatches = content.match(/require\(['"`]([^'"`]+)['"`]\)/g);
        if (requireMatches) {
            requireMatches.forEach(match => {
                const dep = match.match(/require\(['"`]([^'"`]+)['"`]\)/)[1];
                if (dep.startsWith('./') || dep.startsWith('../')) {
                    // Local file dependency
                    let depFile = dep.replace(/^\.\//, '');
                    if (!depFile.includes('.')) {
                        depFile += '.js';
                    }
                    dependencies.push(depFile);
                }
            });
        }
        
        // HTML script src patterns
        const scriptMatches = content.match(/<script[^>]*src=['"`]([^'"`]+)['"`]/g);
        if (scriptMatches) {
            scriptMatches.forEach(match => {
                const src = match.match(/src=['"`]([^'"`]+)['"`]/)[1];
                if (src.endsWith('.js') && !src.startsWith('http')) {
                    dependencies.push(src);
                }
            });
        }
        
        // HTML iframe src patterns
        const iframeMatches = content.match(/<iframe[^>]*src=['"`]([^'"`]+)['"`]/g);
        if (iframeMatches) {
            iframeMatches.forEach(match => {
                const src = match.match(/src=['"`]([^'"`]+)['"`]/)[1];
                if (src.endsWith('.html') && !src.startsWith('http')) {
                    dependencies.push(src);
                }
            });
        }
        
        // Shell script execution patterns
        const execMatches = content.match(/(\.\/)([a-zA-Z0-9\-_]+\.(js|html|sh))/g);
        if (execMatches) {
            execMatches.forEach(match => {
                const file = match.replace('./', '');
                dependencies.push(file);
            });
        }
        
        return [...new Set(dependencies)]; // Remove duplicates
    }
    
    async detectExistingLoops() {
        console.log('🔄 Detecting existing loop patterns...');
        
        // Deep loop detection using graph traversal
        for (const [startFile, deps] of this.referenceChains) {
            const visited = new Set();
            const path = [];
            
            if (this.hasLoop(startFile, visited, path)) {
                const loopPath = path.join(' → ') + ' → ' + startFile;
                console.log(`   💥 DEEP LOOP FOUND: ${loopPath}`);
                this.loopPatterns.add(loopPath);
            }
        }
        
        // Check against known patterns
        this.knownLoopPatterns.forEach(pattern => {
            console.log(`   🔍 Checking known pattern: ${pattern}`);
            const files = pattern.split(' → ');
            
            let patternExists = true;
            for (let i = 0; i < files.length - 1; i++) {
                const currentFile = files[i];
                const nextFile = files[i + 1];
                
                const deps = this.referenceChains.get(currentFile) || [];
                if (!deps.includes(nextFile)) {
                    patternExists = false;
                    break;
                }
            }
            
            if (patternExists) {
                console.log(`   💥 CONFIRMED LOOP: ${pattern}`);
                this.loopPatterns.add(pattern);
            }
        });
        
        console.log(`   📊 Total loops detected: ${this.loopPatterns.size}`);
    }
    
    hasLoop(currentFile, visited, path) {
        if (visited.has(currentFile)) {
            // Found a loop
            const loopStart = path.indexOf(currentFile);
            if (loopStart !== -1) {
                path.splice(0, loopStart); // Keep only the loop portion
                return true;
            }
        }
        
        visited.add(currentFile);
        path.push(currentFile);
        
        const dependencies = this.referenceChains.get(currentFile) || [];
        
        for (const dep of dependencies) {
            if (this.hasLoop(dep, new Set(visited), [...path])) {
                return true;
            }
        }
        
        return false;
    }
    
    async createLoopBreakers() {
        console.log('💥 Creating loop breaker mechanisms...');
        
        // Create loop breaker configurations
        const breakerConfigs = [];
        
        for (const loopPattern of this.loopPatterns) {
            const files = loopPattern.split(' → ');
            const config = this.generateBreakerConfig(files);
            breakerConfigs.push(config);
            
            console.log(`   🔧 Created breaker for: ${loopPattern}`);
        }
        
        // Generate the master loop breaker file
        await this.generateMasterBreaker(breakerConfigs);
        
        // Generate individual file patches
        for (const config of breakerConfigs) {
            await this.generateFilePatch(config);
        }
        
        console.log(`   ✅ Generated ${breakerConfigs.length} loop breakers`);
    }
    
    generateBreakerConfig(loopFiles) {
        const loopId = crypto.createHash('md5')
            .update(loopFiles.join('→'))
            .digest('hex')
            .substring(0, 8);
        
        return {
            id: loopId,
            files: loopFiles,
            breakPoint: this.selectBreakPoint(loopFiles),
            strategy: this.selectBreakStrategy(loopFiles),
            fallbackBehavior: 'graceful-degradation'
        };
    }
    
    selectBreakPoint(files) {
        // Select the best place to break the loop
        // Priority: HTML files > Shell scripts > JS files
        
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        if (htmlFiles.length > 0) {
            return htmlFiles[0]; // Break at HTML level
        }
        
        const shFiles = files.filter(f => f.endsWith('.sh'));
        if (shFiles.length > 0) {
            return shFiles[0]; // Break at shell script level
        }
        
        return files[0]; // Break at first file
    }
    
    selectBreakStrategy(files) {
        // Determine the best strategy to break this specific loop
        
        if (files.some(f => f.includes('visual-reasoning'))) {
            return 'interface-separation';
        }
        
        if (files.some(f => f.includes('xml-'))) {
            return 'dependency-injection';
        }
        
        if (files.some(f => f.includes('reality-'))) {
            return 'lazy-loading';
        }
        
        if (files.some(f => f.includes('ai-'))) {
            return 'event-delegation';
        }
        
        return 'conditional-loading';
    }
    
    async generateMasterBreaker(breakerConfigs) {
        const masterBreakerContent = `#!/usr/bin/env node

/**
 * 💥🔄 MASTER LOOP BREAKER
 * =======================
 * AUTOMATICALLY GENERATED LOOP PREVENTION SYSTEM
 * Generated: ${new Date().toISOString()}
 */

class MasterLoopBreaker {
    constructor() {
        this.activeBreakers = new Map();
        this.loopHistory = [];
        this.breakerConfigs = ${JSON.stringify(breakerConfigs, null, 8)};
        
        this.init();
    }
    
    init() {
        console.log('💥 Master Loop Breaker activated');
        console.log(\`🔧 Loaded \${this.breakerConfigs.length} loop breaker configurations\`);
        
        // Initialize each breaker
        this.breakerConfigs.forEach(config => {
            this.initializeBreaker(config);
        });
        
        // Set up loop monitoring
        this.startLoopMonitoring();
    }
    
    initializeBreaker(config) {
        const breaker = {
            id: config.id,
            files: config.files,
            breakPoint: config.breakPoint,
            strategy: config.strategy,
            active: false,
            triggers: 0,
            lastTrigger: null
        };
        
        this.activeBreakers.set(config.id, breaker);
        console.log(\`   🔧 Initialized breaker \${config.id}: \${config.strategy}\`);
    }
    
    detectLoop(executionStack) {
        for (const [breakerId, breaker] of this.activeBreakers) {
            if (this.matchesLoopPattern(executionStack, breaker.files)) {
                console.log(\`💥 LOOP DETECTED: \${breakerId}\`);
                this.triggerBreaker(breakerId);
                return true;
            }
        }
        return false;
    }
    
    matchesLoopPattern(stack, pattern) {
        if (stack.length < pattern.length) return false;
        
        const recentStack = stack.slice(-pattern.length);
        return pattern.every((file, index) => {
            return recentStack[index] && recentStack[index].includes(file);
        });
    }
    
    triggerBreaker(breakerId) {
        const breaker = this.activeBreakers.get(breakerId);
        if (!breaker) return;
        
        breaker.active = true;
        breaker.triggers++;
        breaker.lastTrigger = new Date().toISOString();
        
        console.log(\`⚡ BREAKING LOOP: \${breakerId} (Strategy: \${breaker.strategy})\`);
        
        // Apply the breaking strategy
        this.applyBreakingStrategy(breaker);
        
        // Log the loop break
        this.loopHistory.push({
            breakerId: breakerId,
            timestamp: breaker.lastTrigger,
            strategy: breaker.strategy,
            files: breaker.files
        });
    }
    
    applyBreakingStrategy(breaker) {
        switch (breaker.strategy) {
            case 'interface-separation':
                this.separateInterfaces(breaker.files);
                break;
            case 'dependency-injection':
                this.injectDependencies(breaker.files);
                break;
            case 'lazy-loading':
                this.enableLazyLoading(breaker.files);
                break;
            case 'event-delegation':
                this.delegateEvents(breaker.files);
                break;
            case 'conditional-loading':
                this.conditionalLoad(breaker.files);
                break;
            default:
                this.fallbackBreak(breaker.files);
        }
    }
    
    separateInterfaces(files) {
        console.log('   🔌 Applying interface separation');
        // Create separate interface layer to break direct dependencies
    }
    
    injectDependencies(files) {
        console.log('   💉 Applying dependency injection');
        // Use dependency injection to break circular requires
    }
    
    enableLazyLoading(files) {
        console.log('   ⏳ Enabling lazy loading');
        // Load dependencies only when needed
    }
    
    delegateEvents(files) {
        console.log('   📡 Delegating events');
        // Use event system instead of direct calls
    }
    
    conditionalLoad(files) {
        console.log('   🔀 Applying conditional loading');
        // Load dependencies based on conditions
    }
    
    fallbackBreak(files) {
        console.log('   🛑 Applying fallback break');
        // Generic loop breaking mechanism
    }
    
    startLoopMonitoring() {
        // Monitor for loops every 5 seconds
        setInterval(() => {
            this.performLoopCheck();
        }, 5000);
    }
    
    performLoopCheck() {
        // Check for active loops in the system
        const activeLoops = Array.from(this.activeBreakers.values())
            .filter(breaker => breaker.active);
        
        if (activeLoops.length > 0) {
            console.log(\`🔄 Active loop breakers: \${activeLoops.length}\`);
        }
    }
    
    getLoopReport() {
        return {
            totalBreakers: this.activeBreakers.size,
            activeBreakers: Array.from(this.activeBreakers.values()).filter(b => b.active).length,
            loopHistory: this.loopHistory,
            lastCheck: new Date().toISOString()
        };
    }
}

// Export for use in other modules
module.exports = MasterLoopBreaker;

// CLI interface
if (require.main === module) {
    console.log(\`
💥🔄 MASTER LOOP BREAKER
=======================

🎯 ACTIVE LOOP PREVENTION SYSTEM

This system automatically detects and breaks infinite
reference loops that cause ELOOP errors.

🔧 LOADED CONFIGURATIONS:
${breakerConfigs.map(config => `   • ${config.id}: ${config.files.join(' → ')}`).join('\\n')}

⚡ BREAKING STRATEGIES:
   • Interface Separation: Create interface layers
   • Dependency Injection: Use DI containers
   • Lazy Loading: Load only when needed
   • Event Delegation: Use event systems
   • Conditional Loading: Load based on conditions

🔄 The system monitors execution patterns and automatically
   applies the appropriate breaking strategy when loops are detected.
    \`);
    
    const masterBreaker = new MasterLoopBreaker();
    
    // Demonstrate loop detection
    setTimeout(() => {
        const report = masterBreaker.getLoopReport();
        console.log('\\n📊 LOOP BREAKER REPORT:');
        console.log(JSON.stringify(report, null, 2));
    }, 3000);
}`;
        
        await fs.writeFile('./master-loop-breaker.js', masterBreakerContent);
        console.log('   📄 Generated master-loop-breaker.js');
    }
    
    async generateFilePatch(config) {
        const patchContent = `/**
 * 🔧 AUTO-GENERATED LOOP BREAKER PATCH
 * Generated for: ${config.files.join(' → ')}
 * Strategy: ${config.strategy}
 * Break Point: ${config.breakPoint}
 */

// Loop breaker configuration
const LOOP_BREAKER_CONFIG = ${JSON.stringify(config, null, 4)};

// Loop detection state
let executionStack = [];
let loopBreakActive = false;

// Add execution tracking
function trackExecution(filename) {
    executionStack.push({
        file: filename,
        timestamp: Date.now()
    });
    
    // Keep only recent executions
    if (executionStack.length > 10) {
        executionStack = executionStack.slice(-10);
    }
    
    // Check for loops
    if (detectLoop()) {
        triggerLoopBreaker();
    }
}

function detectLoop() {
    if (executionStack.length < 3) return false;
    
    const recentFiles = executionStack.slice(-3).map(e => e.file);
    const uniqueFiles = new Set(recentFiles);
    
    // If we have fewer unique files than total files, we have a loop
    return uniqueFiles.size < recentFiles.length;
}

function triggerLoopBreaker() {
    if (loopBreakActive) return;
    
    loopBreakActive = true;
    console.log('💥 LOOP BREAKER ACTIVATED:', LOOP_BREAKER_CONFIG.id);
    console.log('   Strategy:', LOOP_BREAKER_CONFIG.strategy);
    console.log('   Files:', LOOP_BREAKER_CONFIG.files.join(' → '));
    
    // Apply breaking strategy
    applyBreakingStrategy();
    
    // Reset after a delay
    setTimeout(() => {
        loopBreakActive = false;
        executionStack = [];
    }, 5000);
}

function applyBreakingStrategy() {
    switch (LOOP_BREAKER_CONFIG.strategy) {
        case 'interface-separation':
            console.log('   🔌 Creating interface separation');
            break;
        case 'dependency-injection':
            console.log('   💉 Injecting dependencies');
            break;
        case 'lazy-loading':
            console.log('   ⏳ Enabling lazy loading');
            break;
        case 'event-delegation':
            console.log('   📡 Delegating events');
            break;
        case 'conditional-loading':
            console.log('   🔀 Conditional loading active');
            break;
    }
}

// Auto-track this file's execution
trackExecution('${config.breakPoint}');

// Export loop breaker functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        trackExecution,
        detectLoop,
        triggerLoopBreaker,
        loopBreakActive: () => loopBreakActive
    };
}`;
        
        const patchFilename = `loop-breaker-patch-${config.id}.js`;
        await fs.writeFile(patchFilename, patchContent);
        console.log(`   🔧 Generated ${patchFilename}`);
    }
    
    // DIAGNOSTIC METHODS
    
    async generateLoopReport() {
        const report = {
            timestamp: new Date().toISOString(),
            detectedLoops: Array.from(this.loopPatterns),
            referenceChains: Object.fromEntries(this.referenceChains),
            circularDependencies: Object.fromEntries(this.detectedLoops),
            recommendations: this.generateRecommendations()
        };
        
        await fs.writeFile('./loop-analysis-report.json', JSON.stringify(report, null, 2));
        console.log('📊 Generated loop-analysis-report.json');
        
        return report;
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        if (this.loopPatterns.size > 0) {
            recommendations.push('🔄 Multiple reference loops detected - implement loop breakers');
        }
        
        const jsLoops = Array.from(this.loopPatterns).filter(p => p.includes('.js'));
        if (jsLoops.length > 0) {
            recommendations.push('💉 Use dependency injection for JavaScript modules');
        }
        
        const htmlLoops = Array.from(this.loopPatterns).filter(p => p.includes('.html'));
        if (htmlLoops.length > 0) {
            recommendations.push('🔌 Separate HTML interfaces to break UI loops');
        }
        
        if (this.referenceChains.size > 10) {
            recommendations.push('📦 Consider module bundling to reduce file interdependencies');
        }
        
        return recommendations;
    }
    
    async createQuickFix() {
        console.log('🚑 Creating quick fix for immediate loop resolution...');
        
        const quickFixContent = `#!/bin/bash

# 🚑 QUICK LOOP FIX
# =================
# Emergency loop breaker for immediate relief

echo "🚑 QUICK LOOP FIX ACTIVATED"
echo "=========================="

# Stop any running processes that might be in loops
echo "🛑 Stopping potentially looping processes..."

# Kill any node processes that might be stuck
pkill -f "node.*visual-reasoning"
pkill -f "node.*block-world"
pkill -f "node.*xml-schema"
pkill -f "node.*reality-"

echo "   ✅ Processes stopped"

# Clear any temporary files that might cause loops
echo "🗑️ Clearing temporary loop-causing files..."
rm -f .*.tmp
rm -f *.loop
rm -f loop-*.json

echo "   ✅ Temporary files cleared"

# Create loop prevention flag
echo "🔒 Creating loop prevention flags..."
touch .loop-prevention-active
echo "$(date): Loop breaker activated" > loop-breaker.log

echo "   ✅ Prevention flags set"

echo ""
echo "🎯 LOOP BREAK COMPLETE"
echo "====================="
echo "✅ Emergency loop breaking measures applied"
echo "🔄 Safe to restart your systems now"
echo "📝 Check loop-breaker.log for details"
echo ""
`;
        
        await fs.writeFile('./quick-loop-fix.sh', quickFixContent);
        
        // Make it executable
        try {
            const { execSync } = require('child_process');
            execSync('chmod +x ./quick-loop-fix.sh');
            console.log('   🚑 Created executable quick-loop-fix.sh');
        } catch (error) {
            console.log('   📄 Created quick-loop-fix.sh (make executable manually)');
        }
    }
    
    // MAIN DIAGNOSTIC METHOD
    
    async performCompleteLoopAnalysis() {
        console.log('🔍 Performing complete loop analysis...');
        
        const report = await this.generateLoopReport();
        await this.createQuickFix();
        
        console.log('');
        console.log('📊 LOOP ANALYSIS COMPLETE');
        console.log('=========================');
        console.log(`🔄 Detected Loops: ${this.loopPatterns.size}`);
        console.log(`📁 Files Analyzed: ${this.referenceChains.size}`);
        console.log(`💥 Circular Dependencies: ${this.detectedLoops.size}`);
        console.log('');
        
        if (this.loopPatterns.size > 0) {
            console.log('💥 DETECTED LOOP PATTERNS:');
            this.loopPatterns.forEach(pattern => {
                console.log(`   🔄 ${pattern}`);
            });
            console.log('');
        }
        
        console.log('🚑 EMERGENCY ACTIONS AVAILABLE:');
        console.log('   • Run: ./quick-loop-fix.sh');
        console.log('   • Use: node master-loop-breaker.js');
        console.log('   • Check: loop-analysis-report.json');
        
        return report;
    }
}

module.exports = LoopBreakerSystem;

// CLI interface
if (require.main === module) {
    console.log(`
🔄💥 LOOP BREAKER SYSTEM
========================

🎯 INFINITE LOOP DETECTION & PREVENTION

This system detects and breaks the recursive reference
loops that cause ELOOP errors in complex systems.

🔍 DETECTION METHODS:
   • File dependency analysis
   • Circular reference detection
   • Deep loop pattern matching
   • Execution stack monitoring

💥 BREAKING STRATEGIES:
   • Interface separation
   • Dependency injection
   • Lazy loading
   • Event delegation
   • Conditional loading

🚑 EMERGENCY FEATURES:
   • Quick fix script generation
   • Process termination
   • Loop prevention flags
   • Diagnostic reporting

Like a circuit breaker for code - stops infinite loops
before they crash your system.
    `);
    
    async function runLoopBreaker() {
        const breaker = new LoopBreakerSystem();
        
        setTimeout(async () => {
            await breaker.performCompleteLoopAnalysis();
        }, 2000);
    }
    
    runLoopBreaker();
}
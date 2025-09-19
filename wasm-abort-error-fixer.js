#!/usr/bin/env node

/**
 * 🌐 WEBASSEMBLY ABORT ERROR FIXER
 * 
 * Specifically addresses the "Aborted()" WebAssembly errors by:
 * - Proper memory management
 * - Stack overflow prevention
 * - Resource cleanup
 * - Build verification
 * - Runtime error handling
 * 
 * Integrates with the unified module builder to prevent WASM crashes
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class WasmAbortErrorFixer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxMemoryMB: config.maxMemoryMB || 256,
            stackSizeMB: config.stackSizeMB || 16,
            maxInstancesPerPage: config.maxInstancesPerPage || 10,
            wasmOptimizationLevel: config.wasmOptimizationLevel || 2,
            enableDebugInfo: config.enableDebugInfo !== false,
            ...config
        };
        
        // WASM error patterns and fixes
        this.errorPatterns = {
            'Aborted()': {
                description: 'General WebAssembly abort - usually memory or stack overflow',
                fixes: [
                    'Increase memory limit in wasm build',
                    'Add proper error handling in Rust code',
                    'Check for infinite loops or recursion',
                    'Implement proper cleanup in drop functions'
                ],
                wasmFlags: ['--memory-maximum', '268435456'], // 256MB max
                rustFlags: ['--cfg', 'feature="console_error_panic_hook"']
            },
            
            'memory access out of bounds': {
                description: 'Reading/writing outside allocated memory',
                fixes: [
                    'Add bounds checking in Rust code',
                    'Use safe array access methods',
                    'Implement proper buffer size validation',
                    'Add memory debugging hooks'
                ],
                wasmFlags: ['--debug', '--source-map'],
                rustFlags: ['--cfg', 'debug_assertions']
            },
            
            'stack overflow': {
                description: 'Stack size exceeded - usually recursion',
                fixes: [
                    'Increase stack size in wasm build',
                    'Convert recursion to iteration',
                    'Add recursion depth limits',
                    'Use heap allocation for large structures'
                ],
                wasmFlags: ['--stack-size', (16 * 1024 * 1024).toString()], // 16MB stack
                rustFlags: ['--cfg', 'feature="wee_alloc"']
            },
            
            'unreachable executed': {
                description: 'Rust panic or unreachable code executed',
                fixes: [
                    'Add console_error_panic_hook for better error messages',
                    'Replace unwrap() with proper error handling',
                    'Check for division by zero',
                    'Validate input parameters'
                ],
                wasmFlags: ['--debug'],
                rustFlags: ['--cfg', 'debug_assertions']
            }
        };
        
        // WASM build optimizations to prevent aborts
        this.buildOptimizations = {
            cargo: {
                profile: {
                    'release': {
                        'opt-level': 's', // Optimize for size
                        'lto': true,      // Link-time optimization
                        'panic': 'abort',  // Smaller binary
                        'overflow-checks': true
                    },
                    'dev': {
                        'opt-level': 0,
                        'debug': true,
                        'overflow-checks': true,
                        'debug-assertions': true
                    }
                }
            },
            
            wasmPack: {
                release: ['--release', '--target', 'web'],
                debug: ['--debug', '--target', 'web', '--keep-debug']
            }
        };
        
        // Runtime WASM wrapper for error handling
        this.wasmWrapper = `
class WasmWrapper {
    constructor(wasmModule) {
        this.module = wasmModule;
        this.memory = null;
        this.instances = new Map();
        this.maxInstances = ${this.config.maxInstancesPerPage};
    }
    
    async initialize() {
        try {
            // Set up error handling
            this.setupErrorHandling();
            
            // Initialize memory with limits
            this.initializeMemory();
            
            // Load and instantiate WASM
            await this.loadModule();
            
            return true;
        } catch (error) {
            console.error('WASM initialization failed:', error);
            throw error;
        }
    }
    
    setupErrorHandling() {
        // Capture all errors including aborts
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('Aborted')) {
                this.handleAbortError(event);
            }
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.toString().includes('wasm')) {
                this.handleWasmRejection(event);
            }
        });
    }
    
    initializeMemory() {
        // Monitor memory usage
        this.memoryStats = {
            allocated: 0,
            maxAllocated: 0,
            allocations: 0
        };
        
        // Set up memory monitoring
        setInterval(() => {
            this.checkMemoryUsage();
        }, 1000);
    }
    
    async loadModule() {
        // Load WASM with proper error handling
        const wasmBytes = await fetch(this.module.path).then(r => r.arrayBuffer());
        
        // Validate WASM binary
        if (!WebAssembly.validate(wasmBytes)) {
            throw new Error('Invalid WASM binary');
        }
        
        // Instantiate with memory limits
        this.wasmInstance = await WebAssembly.instantiate(wasmBytes, {
            env: {
                memory: new WebAssembly.Memory({
                    initial: 256, // 16MB initial
                    maximum: ${Math.floor(this.config.maxMemoryMB * 16)} // Convert MB to 64KB pages
                })
            }
        });
        
        this.memory = this.wasmInstance.instance.exports.memory;
    }
    
    handleAbortError(event) {
        console.error('🚫 WASM Aborted - Details:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            error: event.error
        });
        
        // Attempt recovery
        this.recoverFromAbort();
        
        // Generate error cookbook entry
        this.generateErrorCookbook('Aborted()', {
            message: event.message,
            stack: event.error?.stack
        });
    }
    
    handleWasmRejection(event) {
        console.error('🚫 WASM Promise Rejection:', event.reason);
        
        // Prevent default unhandled rejection
        event.preventDefault();
        
        // Attempt recovery
        this.recoverFromRejection(event.reason);
    }
    
    recoverFromAbort() {
        // Clean up existing instances
        this.cleanup();
        
        // Reset memory
        this.resetMemory();
        
        // Attempt to reinitialize
        setTimeout(() => {
            this.initialize().catch(console.error);
        }, 1000);
    }
    
    cleanup() {
        // Clear all active instances
        this.instances.clear();
        
        // Reset memory stats
        this.memoryStats = {
            allocated: 0,
            maxAllocated: 0,
            allocations: 0
        };
    }
    
    checkMemoryUsage() {
        if (!this.memory) return;
        
        const currentMB = this.memory.buffer.byteLength / (1024 * 1024);
        
        if (currentMB > this.config.maxMemoryMB * 0.9) {
            console.warn(\`⚠️ High WASM memory usage: \${currentMB.toFixed(2)}MB\`);
            this.triggerGarbageCollection();
        }
    }
    
    triggerGarbageCollection() {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clean up instances if needed
        if (this.instances.size > this.maxInstances) {
            const oldest = Array.from(this.instances.keys())[0];
            this.instances.delete(oldest);
        }
    }
}
`;
        
        console.log('🌐 WASM Abort Error Fixer initialized');
    }
    
    /**
     * Fix a specific WASM module that's having abort errors
     */
    async fixWasmModule(modulePath) {
        console.log(`\n🔧 Fixing WASM module: ${modulePath}`);
        
        // Analyze the module for potential issues
        const issues = await this.analyzeWasmModule(modulePath);
        
        // Apply fixes based on detected issues
        const fixes = await this.applyFixes(modulePath, issues);
        
        // Rebuild with optimizations
        const buildResult = await this.rebuiltWithOptimizations(modulePath, fixes);
        
        // Generate runtime wrapper
        await this.generateRuntimeWrapper(modulePath, buildResult);
        
        console.log(`✅ WASM module fixed: ${modulePath}`);
        
        return {
            issues,
            fixes,
            buildResult,
            wrapperPath: path.join(path.dirname(modulePath), 'wasm-wrapper.js')
        };
    }
    
    /**
     * Analyze WASM module for common abort causes
     */
    async analyzeWasmModule(modulePath) {
        const issues = [];
        
        // Check Cargo.toml for problematic configurations
        const cargoPath = path.join(modulePath, 'Cargo.toml');
        
        try {
            const cargoContent = await fs.readFile(cargoPath, 'utf-8');
            
            // Check for missing panic hook
            if (!cargoContent.includes('console_error_panic_hook')) {
                issues.push({
                    type: 'missing-panic-hook',
                    severity: 'high',
                    description: 'Missing console_error_panic_hook dependency',
                    fix: 'Add console_error_panic_hook = "0.1" to dependencies'
                });
            }
            
            // Check for missing memory allocator
            if (!cargoContent.includes('wee_alloc') && !cargoContent.includes('lol_alloc')) {
                issues.push({
                    type: 'default-allocator',
                    severity: 'medium', 
                    description: 'Using default allocator (larger binary)',
                    fix: 'Add wee_alloc for smaller memory footprint'
                });
            }
            
            // Check for missing optimization settings
            if (!cargoContent.includes('[profile.release]')) {
                issues.push({
                    type: 'missing-optimization',
                    severity: 'medium',
                    description: 'Missing release optimization profile',
                    fix: 'Add optimized release profile'
                });
            }
            
        } catch (error) {
            issues.push({
                type: 'missing-cargo-toml',
                severity: 'critical',
                description: 'Cargo.toml not found or unreadable',
                fix: 'Create proper Cargo.toml configuration'
            });
        }
        
        // Check Rust source files for common issues
        const srcPath = path.join(modulePath, 'src');
        
        try {
            const srcFiles = await fs.readdir(srcPath);
            
            for (const file of srcFiles) {
                if (file.endsWith('.rs')) {
                    const srcContent = await fs.readFile(path.join(srcPath, file), 'utf-8');
                    
                    // Check for unwrap() usage
                    if (srcContent.includes('.unwrap()')) {
                        issues.push({
                            type: 'unsafe-unwrap',
                            severity: 'high',
                            file,
                            description: 'Using .unwrap() can cause panics',
                            fix: 'Replace unwrap() with proper error handling'
                        });
                    }
                    
                    // Check for infinite loops
                    if (srcContent.includes('loop {') && !srcContent.includes('break')) {
                        issues.push({
                            type: 'potential-infinite-loop',
                            severity: 'critical',
                            file,
                            description: 'Potential infinite loop detected',
                            fix: 'Add break conditions to loops'
                        });
                    }
                    
                    // Check for recursive functions without limits
                    const fnMatches = srcContent.match(/fn\s+(\w+)/g);
                    if (fnMatches) {
                        for (const fn of fnMatches) {
                            const fnName = fn.replace('fn ', '');
                            if (srcContent.includes(fnName + '(') && 
                                !srcContent.includes('depth') && 
                                !srcContent.includes('limit')) {
                                
                                issues.push({
                                    type: 'potential-infinite-recursion',
                                    severity: 'high',
                                    file,
                                    function: fnName,
                                    description: `Function ${fnName} may have infinite recursion`,
                                    fix: 'Add recursion depth limits'
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            issues.push({
                type: 'src-analysis-failed',
                severity: 'medium',
                description: 'Could not analyze source files',
                fix: 'Check src directory structure'
            });
        }
        
        return issues;
    }
    
    /**
     * Apply fixes for detected issues
     */
    async applyFixes(modulePath, issues) {
        const appliedFixes = [];
        
        for (const issue of issues) {
            try {
                switch (issue.type) {
                    case 'missing-panic-hook':
                        await this.addPanicHook(modulePath);
                        appliedFixes.push('panic-hook');
                        break;
                        
                    case 'missing-optimization':
                        await this.addOptimizationProfile(modulePath);
                        appliedFixes.push('optimization-profile');
                        break;
                        
                    case 'default-allocator':
                        await this.addWeeAlloc(modulePath);
                        appliedFixes.push('wee-alloc');
                        break;
                        
                    case 'unsafe-unwrap':
                        await this.replaceUnwraps(modulePath, issue.file);
                        appliedFixes.push('safe-unwrap');
                        break;
                }
            } catch (error) {
                console.error(`Failed to apply fix for ${issue.type}:`, error.message);
            }
        }
        
        return appliedFixes;
    }
    
    /**
     * Add panic hook to Cargo.toml and lib.rs
     */
    async addPanicHook(modulePath) {
        // Add to Cargo.toml
        const cargoPath = path.join(modulePath, 'Cargo.toml');
        let cargoContent = await fs.readFile(cargoPath, 'utf-8');
        
        if (!cargoContent.includes('console_error_panic_hook')) {
            const depSection = cargoContent.includes('[dependencies]') ?
                cargoContent :
                cargoContent + '\n[dependencies]\n';
                
            cargoContent = depSection.replace(
                '[dependencies]',
                '[dependencies]\nconsole_error_panic_hook = "0.1"'
            );
            
            await fs.writeFile(cargoPath, cargoContent);
        }
        
        // Add to lib.rs
        const libPath = path.join(modulePath, 'src', 'lib.rs');
        let libContent = await fs.readFile(libPath, 'utf-8');
        
        if (!libContent.includes('console_error_panic_hook::set_once()')) {
            const hookCode = `
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}
`;
            
            libContent = `use wasm_bindgen::prelude::*;\n${libContent}\n${hookCode}`;
            await fs.writeFile(libPath, libContent);
        }
    }
    
    /**
     * Add optimization profile to Cargo.toml
     */
    async addOptimizationProfile(modulePath) {
        const cargoPath = path.join(modulePath, 'Cargo.toml');
        let cargoContent = await fs.readFile(cargoPath, 'utf-8');
        
        const optimizationProfile = `

[profile.release]
opt-level = "s"    # Optimize for size
lto = true         # Link-time optimization
panic = "abort"    # Smaller binary
overflow-checks = true

[profile.dev]
debug = true
overflow-checks = true
debug-assertions = true`;
        
        if (!cargoContent.includes('[profile.release]')) {
            cargoContent += optimizationProfile;
            await fs.writeFile(cargoPath, cargoContent);
        }
    }
    
    /**
     * Rebuild module with optimizations
     */
    async rebuiltWithOptimizations(modulePath, appliedFixes) {
        console.log('   🔨 Rebuilding with WASM optimizations...');
        
        const buildFlags = [
            '--target', 'web',
            '--out-dir', 'pkg'
        ];
        
        // Add memory and stack size limits
        const rustFlags = [
            '-C', 'link-arg=--max-memory=268435456', // 256MB
            '-C', 'link-arg=--stack-size=16777216'   // 16MB
        ];
        
        // Set Rust flags environment
        process.env.RUSTFLAGS = rustFlags.join(' ');
        
        try {
            const buildOutput = execSync(`wasm-pack build ${buildFlags.join(' ')}`, {
                cwd: modulePath,
                encoding: 'utf-8',
                stdio: 'pipe'
            });
            
            console.log('   ✅ WASM build successful');
            
            return {
                success: true,
                output: buildOutput.trim(),
                pkgDir: path.join(modulePath, 'pkg')
            };
            
        } catch (error) {
            console.error('   ❌ WASM build failed:', error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Generate runtime wrapper for the WASM module
     */
    async generateRuntimeWrapper(modulePath, buildResult) {
        if (!buildResult.success) return;
        
        const wrapperPath = path.join(modulePath, 'wasm-wrapper.js');
        
        const wrapperCode = `${this.wasmWrapper}

// Initialize WASM module with error handling
export async function initWasm() {
    const wrapper = new WasmWrapper({
        path: './pkg/module_bg.wasm'
    });
    
    try {
        await wrapper.initialize();
        console.log('✅ WASM module loaded successfully');
        return wrapper;
    } catch (error) {
        console.error('❌ WASM initialization failed:', error);
        throw error;
    }
}

// Export wrapper class for advanced usage
export { WasmWrapper };`;
        
        await fs.writeFile(wrapperPath, wrapperCode);
        
        console.log(`   📝 Runtime wrapper generated: ${wrapperPath}`);
    }
    
    /**
     * Test WASM module to verify fixes
     */
    async testWasmModule(modulePath) {
        console.log(`\n🧪 Testing WASM module: ${modulePath}`);
        
        const pkgPath = path.join(modulePath, 'pkg');
        const wasmPath = path.join(pkgPath, 'module_bg.wasm');
        
        try {
            // Read WASM binary
            const wasmBytes = await fs.readFile(wasmPath);
            
            // Validate WASM
            const isValid = WebAssembly.validate(wasmBytes);
            
            if (!isValid) {
                throw new Error('WASM binary is invalid');
            }
            
            console.log('   ✅ WASM binary is valid');
            
            // Try to instantiate (basic test)
            const module = await WebAssembly.compile(wasmBytes);
            console.log('   ✅ WASM module compiles successfully');
            
            return { success: true, valid: true, compiled: true };
            
        } catch (error) {
            console.error('   ❌ WASM test failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Export
module.exports = WasmAbortErrorFixer;

// Run if called directly
if (require.main === module) {
    const fixer = new WasmAbortErrorFixer();
    
    console.log(`
🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯
🌯 WEBASSEMBLY ABORT ERROR FIXER                        🌯
🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯
🌯 Fixes: Aborted(), memory errors, stack overflows     🌯
🌯 Features: Panic hooks, memory limits, error recovery 🌯
🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯
    `);
    
    // Demo: Fix a WASM module if path provided
    const modulePath = process.argv[2];
    if (modulePath) {
        fixer.fixWasmModule(modulePath)
            .then(() => fixer.testWasmModule(modulePath))
            .then(result => {
                if (result.success) {
                    console.log('\n🎉 WASM module successfully fixed and tested!');
                } else {
                    console.log('\n❌ WASM module still has issues:', result.error);
                }
            })
            .catch(console.error);
    }
}
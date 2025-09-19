#!/usr/bin/env node
/**
 * WebAssembly Adapter & Encoding Fixer
 * 
 * Addresses WebAssembly encoding, adapter, and communication issues:
 * - WASM file corruption and encoding problems
 * - Adapter communication failures
 * - Module loading and binding issues
 * - Memory management and performance optimization
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { logger, createErrorBoundary } = require('./emergency-logging-system');

class WasmAdapterFixer {
    constructor() {
        this.boundary = createErrorBoundary('wasm-adapter-fixer');
        this.wasmFiles = [];
        this.corruptedFiles = [];
        this.adapters = new Map();
        this.encodingIssues = [];
        this.fixes = [];
        
        // WASM module registry with known good checksums
        this.knownModules = {
            'draco_decoder.wasm': {
                url: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_decoder.wasm',
                checksum: null // Will be calculated
            },
            'basis_transcoder.wasm': {
                url: 'https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/libs/basis/basis_transcoder.wasm',
                checksum: null
            }
        };
        
        logger.log('SYSTEM', 'WASM Adapter Fixer initialized');
    }
    
    async diagnoseWasmIssues() {
        logger.log('INFO', 'Starting comprehensive WASM diagnosis');
        
        // Find all WASM files
        this.wasmFiles = await this.findAllWasmFiles();
        logger.log('INFO', `Found ${this.wasmFiles.length} WASM files`);
        
        // Analyze each file
        const analysis = {
            total: this.wasmFiles.length,
            corrupted: 0,
            encodingIssues: 0,
            loadingIssues: 0,
            healthy: 0
        };
        
        for (const wasmFile of this.wasmFiles) {
            const fileAnalysis = await this.analyzeWasmFile(wasmFile);
            
            if (fileAnalysis.corrupted) {
                this.corruptedFiles.push(wasmFile);
                analysis.corrupted++;
            }
            
            if (fileAnalysis.encodingIssue) {
                this.encodingIssues.push({ file: wasmFile, issue: fileAnalysis.encodingIssue });
                analysis.encodingIssues++;
            }
            
            if (fileAnalysis.loadingIssue) {
                analysis.loadingIssues++;
            }
            
            if (fileAnalysis.healthy) {
                analysis.healthy++;
            }
        }
        
        logger.log('INFO', 'WASM diagnosis complete', analysis);
        return analysis;
    }
    
    async findAllWasmFiles() {
        const wasmFiles = [];
        
        // Use find command to locate all WASM files
        try {
            const output = execSync('find . -name "*.wasm" -type f 2>/dev/null || true', 
                                   { encoding: 'utf8' });
            
            const files = output.split('\n')
                .filter(line => line.trim())
                .filter(file => fs.existsSync(file));
            
            wasmFiles.push(...files);
        } catch (error) {
            logger.logError('Failed to find WASM files with find command', error);
        }
        
        return [...new Set(wasmFiles)]; // Remove duplicates
    }
    
    async analyzeWasmFile(filePath) {
        const analysis = {
            path: filePath,
            size: 0,
            corrupted: false,
            encodingIssue: null,
            loadingIssue: null,
            healthy: false
        };
        
        try {
            // Check if file exists and get stats
            if (!fs.existsSync(filePath)) {
                analysis.corrupted = true;
                analysis.encodingIssue = 'file_not_found';
                return analysis;
            }
            
            const stats = fs.statSync(filePath);
            analysis.size = stats.size;
            
            // Check for empty files
            if (stats.size === 0) {
                analysis.corrupted = true;
                analysis.encodingIssue = 'empty_file';
                return analysis;
            }
            
            // Check WASM magic bytes
            const buffer = fs.readFileSync(filePath, { start: 0, end: 8 });
            const magicBytes = buffer.toString('hex');
            
            // WASM magic number: 0x00 0x61 0x73 0x6d (\\0asm)
            if (!magicBytes.startsWith('0061736d')) {
                analysis.corrupted = true;
                analysis.encodingIssue = 'invalid_magic_bytes';
                return analysis;
            }
            
            // Check WASM version (should be 0x01 0x00 0x00 0x00)
            const versionBytes = magicBytes.slice(8);
            if (versionBytes !== '01000000') {
                analysis.encodingIssue = 'unsupported_version';
            }
            
            // Try to validate with WebAssembly API if available
            if (typeof WebAssembly !== 'undefined') {
                try {
                    const wasmBuffer = fs.readFileSync(filePath);
                    const isValid = WebAssembly.validate(wasmBuffer);
                    
                    if (!isValid) {
                        analysis.corrupted = true;
                        analysis.encodingIssue = 'validation_failed';
                        return analysis;
                    }
                    
                    // Try to instantiate (without imports for basic test)
                    try {
                        await WebAssembly.instantiate(wasmBuffer);
                        analysis.healthy = true;
                    } catch (instantiateError) {
                        // This might be normal if the module requires imports
                        if (instantiateError.message.includes('import')) {
                            analysis.healthy = true; // Healthy but needs imports
                        } else {
                            analysis.loadingIssue = instantiateError.message;
                        }
                    }
                    
                } catch (wasmError) {
                    analysis.corrupted = true;
                    analysis.encodingIssue = wasmError.message;
                }
            } else {
                // Basic validation without WebAssembly API
                analysis.healthy = true;
            }
            
        } catch (error) {
            analysis.corrupted = true;
            analysis.encodingIssue = error.message;
        }
        
        return analysis;
    }
    
    async fixCorruptedFiles() {
        logger.log('INFO', `Attempting to fix ${this.corruptedFiles.length} corrupted WASM files`);
        
        for (const corruptedFile of this.corruptedFiles) {
            try {
                const fix = await this.fixSingleWasmFile(corruptedFile);
                if (fix) {
                    this.fixes.push(fix);
                    logger.log('INFO', `Fixed WASM file: ${corruptedFile}`, fix);
                }
            } catch (error) {
                logger.logError(`Failed to fix ${corruptedFile}`, error);
            }
        }
        
        return this.fixes;
    }
    
    async fixSingleWasmFile(filePath) {
        const fileName = path.basename(filePath);
        
        // Check if we have a known good version
        if (this.knownModules[fileName]) {
            return await this.downloadKnownGoodVersion(filePath, this.knownModules[fileName]);
        }
        
        // Try to restore from package manager
        if (filePath.includes('node_modules')) {
            return await this.restoreFromPackage(filePath);
        }
        
        // Try to regenerate if it's a build artifact
        if (this.isBuildArtifact(filePath)) {
            return await this.regenerateBuildArtifact(filePath);
        }
        
        // Create backup and attempt manual repair
        return await this.attemptManualRepair(filePath);
    }
    
    async downloadKnownGoodVersion(filePath, moduleInfo) {
        try {
            logger.log('INFO', `Downloading known good version for ${path.basename(filePath)}`);
            
            // Create backup of corrupted file
            const backupPath = filePath + '.corrupted.backup';
            if (fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, backupPath);
            }
            
            // Download new version
            const buffer = await this.downloadFile(moduleInfo.url);
            
            // Validate downloaded file
            const isValid = await this.validateWasmBuffer(buffer);
            if (!isValid) {
                throw new Error('Downloaded file is not valid WASM');
            }
            
            // Write new file
            fs.writeFileSync(filePath, buffer);
            
            return {
                type: 'download_replacement',
                file: filePath,
                source: moduleInfo.url,
                backup: backupPath
            };
            
        } catch (error) {
            logger.logError(`Failed to download replacement for ${filePath}`, error);
            return null;
        }
    }
    
    async restoreFromPackage(filePath) {
        try {
            // Extract package name from path
            const nodeModulesIndex = filePath.indexOf('node_modules/');
            if (nodeModulesIndex === -1) return null;
            
            const relativePath = filePath.substring(nodeModulesIndex + 13);
            const packageName = relativePath.split('/')[0];
            
            logger.log('INFO', `Attempting to restore ${packageName} package`);
            
            // Get package directory
            const packageDir = path.dirname(filePath.substring(0, nodeModulesIndex + 13 + packageName.length));
            
            // Try to reinstall the package
            execSync(`npm install ${packageName} --force`, { 
                cwd: path.dirname(packageDir),
                stdio: 'pipe' 
            });
            
            // Check if file is now fixed
            if (fs.existsSync(filePath)) {
                const analysis = await this.analyzeWasmFile(filePath);
                if (analysis.healthy) {
                    return {
                        type: 'package_reinstall',
                        package: packageName,
                        file: filePath
                    };
                }
            }
            
            return null;
            
        } catch (error) {
            logger.logError(`Failed to restore package for ${filePath}`, error);
            return null;
        }
    }
    
    isBuildArtifact(filePath) {
        const buildIndicators = [
            '/build/',
            '/dist/',
            '/compiled/',
            '.build.',
            '.compiled.'
        ];
        
        return buildIndicators.some(indicator => filePath.includes(indicator));
    }
    
    async regenerateBuildArtifact(filePath) {
        try {
            logger.log('INFO', `Attempting to regenerate build artifact: ${filePath}`);
            
            // Look for build scripts in nearby directories
            const projectRoot = this.findProjectRoot(filePath);
            if (!projectRoot) return null;
            
            // Try common build commands
            const buildCommands = ['npm run build', 'yarn build', 'make', 'cmake --build .'];
            
            for (const command of buildCommands) {
                try {
                    execSync(command, { 
                        cwd: projectRoot,
                        stdio: 'pipe',
                        timeout: 30000 // 30 second timeout
                    });
                    
                    // Check if file was regenerated
                    if (fs.existsSync(filePath)) {
                        const analysis = await this.analyzeWasmFile(filePath);
                        if (analysis.healthy) {
                            return {
                                type: 'regenerate_build',
                                command,
                                file: filePath,
                                projectRoot
                            };
                        }
                    }
                } catch (buildError) {
                    // Continue to next build command
                    continue;
                }
            }
            
            return null;
            
        } catch (error) {
            logger.logError(`Failed to regenerate ${filePath}`, error);
            return null;
        }
    }
    
    findProjectRoot(filePath) {
        let currentDir = path.dirname(filePath);
        
        while (currentDir !== path.dirname(currentDir)) {
            if (fs.existsSync(path.join(currentDir, 'package.json')) ||
                fs.existsSync(path.join(currentDir, 'Makefile')) ||
                fs.existsSync(path.join(currentDir, 'CMakeLists.txt'))) {
                return currentDir;
            }
            currentDir = path.dirname(currentDir);
        }
        
        return null;
    }
    
    async attemptManualRepair(filePath) {
        try {
            logger.log('INFO', `Attempting manual repair of ${filePath}`);
            
            // Create backup
            const backupPath = filePath + '.manual.backup';
            if (fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, backupPath);
            }
            
            // Try to repair common corruption patterns
            const buffer = fs.readFileSync(filePath);
            let repairedBuffer = buffer;
            
            // Fix magic bytes if they're slightly off
            if (buffer.length >= 4) {
                const magicBytes = buffer.slice(0, 4);
                const expectedMagic = Buffer.from([0x00, 0x61, 0x73, 0x6d]);
                
                if (!magicBytes.equals(expectedMagic)) {
                    repairedBuffer = Buffer.concat([expectedMagic, buffer.slice(4)]);
                }
            }
            
            // Validate repaired buffer
            const isValid = await this.validateWasmBuffer(repairedBuffer);
            if (isValid) {
                fs.writeFileSync(filePath, repairedBuffer);
                return {
                    type: 'manual_repair',
                    file: filePath,
                    repair: 'magic_bytes_fix',
                    backup: backupPath
                };
            }
            
            return null;
            
        } catch (error) {
            logger.logError(`Manual repair failed for ${filePath}`, error);
            return null;
        }
    }
    
    async validateWasmBuffer(buffer) {
        try {
            if (typeof WebAssembly !== 'undefined') {
                return WebAssembly.validate(buffer);
            } else {
                // Basic validation - check magic bytes
                if (buffer.length < 8) return false;
                const magic = buffer.slice(0, 4);
                return magic.equals(Buffer.from([0x00, 0x61, 0x73, 0x6d]));
            }
        } catch (error) {
            return false;
        }
    }
    
    async downloadFile(url) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
                response.on('error', reject);
            }).on('error', reject);
        });
    }
    
    async createWasmAdapter() {
        logger.log('INFO', 'Creating universal WASM adapter system');
        
        const adapterCode = [
            '/**',
            ' * Universal WASM Adapter',
            ' * Provides consistent interface for loading and managing WASM modules',
            ' */',
            'class UniversalWasmAdapter {',
            '    constructor() {',
            '        this.loadedModules = new Map();',
            '        this.loadingPromises = new Map();',
            '        this.errorHandler = null;',
            '    }',
            '',
            '    setErrorHandler(handler) {',
            '        this.errorHandler = handler;',
            '    }',
            '',
            '    async loadModule(wasmPath, imports = {}) {',
            '        if (this.loadedModules.has(wasmPath)) {',
            '            return this.loadedModules.get(wasmPath);',
            '        }',
            '',
            '        if (this.loadingPromises.has(wasmPath)) {',
            '            return this.loadingPromises.get(wasmPath);',
            '        }',
            '',
            '        const loadingPromise = this._loadModuleInternal(wasmPath, imports);',
            '        this.loadingPromises.set(wasmPath, loadingPromise);',
            '',
            '        try {',
            '            const module = await loadingPromise;',
            '            this.loadedModules.set(wasmPath, module);',
            '            this.loadingPromises.delete(wasmPath);',
            '            return module;',
            '        } catch (error) {',
            '            this.loadingPromises.delete(wasmPath);',
            '            if (this.errorHandler) {',
            '                this.errorHandler(error, wasmPath);',
            '            }',
            '            throw error;',
            '        }',
            '    }',
            '',
            '    async _loadModuleInternal(wasmPath, imports) {',
            '        const loadMethods = [',
            '            () => this._loadFromFile(wasmPath, imports),',
            '            () => this._loadFromUrl(wasmPath, imports),',
            '            () => this._loadWithFallback(wasmPath, imports)',
            '        ];',
            '',
            '        for (const method of loadMethods) {',
            '            try {',
            '                return await method();',
            '            } catch (error) {',
            '                console.warn("WASM load method failed for " + wasmPath + ":", error.message);',
            '                continue;',
            '            }',
            '        }',
            '',
            '        throw new Error("All loading methods failed for " + wasmPath);',
            '    }',
            '',
            '    async _loadFromFile(wasmPath, imports) {',
            '        let wasmBuffer;',
            '',
            '        if (typeof fetch !== "undefined") {',
            '            const response = await fetch(wasmPath);',
            '            if (!response.ok) {',
            '                throw new Error("HTTP " + response.status + ": " + response.statusText);',
            '            }',
            '            wasmBuffer = await response.arrayBuffer();',
            '        } else {',
            '            const fs = require("fs");',
            '            wasmBuffer = fs.readFileSync(wasmPath);',
            '        }',
            '',
            '        return await WebAssembly.instantiate(wasmBuffer, imports);',
            '    }',
            '',
            '    async _loadFromUrl(wasmPath, imports) {',
            '        let url = wasmPath;',
            '        if (!wasmPath.startsWith("http") && typeof window !== "undefined") {',
            '            url = new URL(wasmPath, window.location.href).href;',
            '        }',
            '',
            '        const response = await fetch(url);',
            '        if (!response.ok) {',
            '            throw new Error("HTTP " + response.status + ": " + response.statusText);',
            '        }',
            '',
            '        const wasmBuffer = await response.arrayBuffer();',
            '        return await WebAssembly.instantiate(wasmBuffer, imports);',
            '    }',
            '',
            '    unloadModule(wasmPath) {',
            '        this.loadedModules.delete(wasmPath);',
            '        this.loadingPromises.delete(wasmPath);',
            '    }',
            '',
            '    getLoadedModules() {',
            '        return Array.from(this.loadedModules.keys());',
            '    }',
            '',
            '    clearAll() {',
            '        this.loadedModules.clear();',
            '        this.loadingPromises.clear();',
            '    }',
            '}',
            '',
            'if (typeof module !== "undefined" && module.exports) {',
            '    module.exports = UniversalWasmAdapter;',
            '} else if (typeof window !== "undefined") {',
            '    window.UniversalWasmAdapter = UniversalWasmAdapter;',
            '}'
        ].join('\n');
        
        // Write adapter to file
        const adapterPath = path.join(__dirname, 'universal-wasm-adapter.js');
        fs.writeFileSync(adapterPath, adapterCode);
        
        logger.log('INFO', `Universal WASM adapter created: ${adapterPath}`);
        
        return {
            type: 'create_adapter',
            path: adapterPath,
            features: ['universal_loading', 'fallback_urls', 'error_handling', 'caching']
        };
    }
    
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.wasmFiles.length,
                corruptedFiles: this.corruptedFiles.length,
                encodingIssues: this.encodingIssues.length,
                fixesApplied: this.fixes.length
            },
            fixes: this.fixes,
            recommendations: this.generateRecommendations()
        };
        
        // Write report
        const reportPath = path.join(__dirname, 'logs', `wasm-fix-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        logger.log('INFO', `WASM fix report generated: ${reportPath}`);
        return report;
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        if (this.corruptedFiles.length > 0) {
            recommendations.push('Reinstall packages with corrupted WASM files');
            recommendations.push('Use the universal WASM adapter for consistent loading');
        }
        
        if (this.encodingIssues.length > 0) {
            recommendations.push('Check build pipeline for WASM generation issues');
            recommendations.push('Verify WASM compiler versions and settings');
        }
        
        recommendations.push('Monitor WASM loading performance');
        recommendations.push('Implement fallback mechanisms for critical WASM modules');
        
        return recommendations;
    }
}

// Export for use in other modules
module.exports = {
    WasmAdapterFixer,
    
    // Convenience functions
    quickWasmFix: async () => {
        const fixer = new WasmAdapterFixer();
        await fixer.diagnoseWasmIssues();
        await fixer.fixCorruptedFiles();
        await fixer.createWasmAdapter();
        return fixer.generateReport();
    }
};

// If run directly, perform full WASM diagnosis and fix
if (require.main === module) {
    (async () => {
        try {
            console.log('🌐 Starting WASM adapter and encoding fix...\n');
            
            const fixer = new WasmAdapterFixer();
            
            // Diagnose WASM issues
            console.log('🔍 Diagnosing WASM files...');
            const diagnosis = await fixer.diagnoseWasmIssues();
            
            console.log('\n📊 WASM Diagnosis:');
            console.log(`  Total files: ${diagnosis.total}`);
            console.log(`  Corrupted: ${diagnosis.corrupted}`);
            console.log(`  Encoding issues: ${diagnosis.encodingIssues}`);
            console.log(`  Loading issues: ${diagnosis.loadingIssues}`);
            console.log(`  Healthy: ${diagnosis.healthy}`);
            
            // Fix corrupted files
            if (diagnosis.corrupted > 0) {
                console.log('\n🔧 Fixing corrupted WASM files...');
                await fixer.fixCorruptedFiles();
                console.log(`  Fixes applied: ${fixer.fixes.length}`);
            }
            
            // Create universal adapter
            console.log('\n🔌 Creating universal WASM adapter...');
            await fixer.createWasmAdapter();
            
            // Generate report
            const report = fixer.generateReport();
            
            console.log('\n📄 Fix Summary:');
            console.log(`  Files processed: ${report.summary.totalFiles}`);
            console.log(`  Issues fixed: ${report.summary.fixesApplied}`);
            console.log(`  Recommendations: ${report.recommendations.length}`);
            
            if (report.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                report.recommendations.forEach(rec => console.log(`  • ${rec}`));
            }
            
            console.log('\n✅ WASM adapter and encoding fix complete!');
            
        } catch (error) {
            console.error('❌ Fatal error during WASM fix:', error);
            process.exit(1);
        }
    })();
}
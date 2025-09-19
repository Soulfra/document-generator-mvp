#!/usr/bin/env node
/**
 * Native Build Fixer & WebAssembly Adapter System
 * 
 * Diagnoses and fixes compilation issues with:
 * - Native Node.js modules (sqlite3, electron, puppeteer, etc.)
 * - WebAssembly modules and adapters
 * - C++/WASM compilation pipeline
 * - Encoding and binding issues
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');
const { logger, createErrorBoundary } = require('./emergency-logging-system');

class NativeBuildFixer {
    constructor() {
        this.boundary = createErrorBoundary('native-build-fixer');
        this.issues = [];
        this.fixes = [];
        this.nativeModules = [
            'sqlite3', 'sharp', 'canvas', 'bcrypt', 'argon2', 'sodium-native',
            'electron', 'puppeteer', 'better-sqlite3', 'deasync', 'ref',
            'ffi', 'node-expat', 'iconv', 'node-pre-gyp'
        ];
        this.wasmModules = [];
        this.buildTools = {
            'node-gyp': null,
            'python': null,
            'make': null,
            'gcc': null,
            'g++': null,
            'cmake': null
        };
        
        logger.log('SYSTEM', 'Native Build Fixer initialized');
    }
    
    async diagnoseSystem() {
        logger.log('INFO', 'Starting comprehensive native build diagnosis');
        
        const diagnosis = {
            buildTools: await this.checkBuildTools(),
            nativeModules: await this.checkNativeModules(),
            wasmModules: await this.checkWasmModules(),
            permissions: await this.checkPermissions(),
            environment: await this.checkEnvironment(),
            diskSpace: await this.checkDiskSpace()
        };
        
        logger.log('INFO', 'Build system diagnosis complete', {
            issues: this.issues.length,
            buildToolsOk: diagnosis.buildTools.allPresent,
            nativeModulesOk: diagnosis.nativeModules.allWorking,
            wasmModulesOk: diagnosis.wasmModules.allLoading
        });
        
        return diagnosis;
    }
    
    async checkBuildTools() {
        logger.log('INFO', 'Checking build tools availability');
        const results = {};
        let allPresent = true;
        
        for (const [tool, _] of Object.entries(this.buildTools)) {
            try {
                const result = await this.boundary.tryAsync(async () => {
                    switch (tool) {
                        case 'node-gyp':
                            const gypVersion = execSync('node-gyp --version', { encoding: 'utf8' }).trim();
                            return { present: true, version: gypVersion };
                        case 'python':
                            const pythonVersion = execSync('python3 --version || python --version', { encoding: 'utf8' }).trim();
                            return { present: true, version: pythonVersion };
                        case 'make':
                            const makeVersion = execSync('make --version', { encoding: 'utf8' }).split('\n')[0];
                            return { present: true, version: makeVersion };
                        case 'gcc':
                            const gccVersion = execSync('gcc --version', { encoding: 'utf8' }).split('\n')[0];
                            return { present: true, version: gccVersion };
                        case 'g++':
                            const gppVersion = execSync('g++ --version', { encoding: 'utf8' }).split('\n')[0];
                            return { present: true, version: gppVersion };
                        case 'cmake':
                            const cmakeVersion = execSync('cmake --version', { encoding: 'utf8' }).split('\n')[0];
                            return { present: true, version: cmakeVersion };
                        default:
                            return { present: false, error: 'Unknown tool' };
                    }
                });
                
                results[tool] = result || { present: false, error: 'Check failed' };
                this.buildTools[tool] = result?.present;
                
            } catch (error) {
                results[tool] = { present: false, error: error.message };
                this.buildTools[tool] = false;
                allPresent = false;
                
                this.issues.push({
                    type: 'missing_build_tool',
                    tool,
                    error: error.message,
                    severity: 'high'
                });
            }
        }
        
        return { results, allPresent };
    }
    
    async checkNativeModules() {
        logger.log('INFO', 'Checking native modules compilation status');
        const results = {};
        let allWorking = true;
        
        for (const moduleName of this.nativeModules) {
            try {
                const moduleStatus = await this.boundary.tryAsync(async () => {
                    // Check if module is installed
                    const packagePath = path.join(process.cwd(), 'node_modules', moduleName);
                    if (!fs.existsSync(packagePath)) {
                        return { installed: false, reason: 'not_installed' };
                    }
                    
                    // Try to require the module
                    try {
                        require(moduleName);
                        return { installed: true, working: true };
                    } catch (requireError) {
                        // Check if it's a binding issue
                        if (requireError.message.includes('bindings') || 
                            requireError.message.includes('.node') ||
                            requireError.message.includes('MODULE_NOT_FOUND')) {
                            return { 
                                installed: true, 
                                working: false, 
                                error: 'binding_error',
                                message: requireError.message 
                            };
                        }
                        return { 
                            installed: true, 
                            working: false, 
                            error: 'require_error',
                            message: requireError.message 
                        };
                    }
                });
                
                results[moduleName] = moduleStatus || { installed: false, error: 'check_failed' };
                
                if (!moduleStatus?.working) {
                    allWorking = false;
                    this.issues.push({
                        type: 'native_module_issue',
                        module: moduleName,
                        status: moduleStatus,
                        severity: 'medium'
                    });
                }
                
            } catch (error) {
                results[moduleName] = { error: error.message };
                allWorking = false;
            }
        }
        
        return { results, allWorking };
    }
    
    async checkWasmModules() {
        logger.log('INFO', 'Checking WebAssembly modules and adapters');
        const results = {};
        let allLoading = true;
        
        // Find all .wasm files
        const wasmFiles = this.findWasmFiles();
        this.wasmModules = wasmFiles;
        
        for (const wasmFile of wasmFiles) {
            try {
                const wasmStatus = await this.boundary.tryAsync(async () => {
                    // Check file accessibility
                    if (!fs.existsSync(wasmFile)) {
                        return { exists: false, error: 'file_not_found' };
                    }
                    
                    // Check file size and basic format
                    const stats = fs.statSync(wasmFile);
                    if (stats.size === 0) {
                        return { exists: true, valid: false, error: 'empty_file' };
                    }
                    
                    // Read WASM magic bytes
                    const buffer = fs.readFileSync(wasmFile, { start: 0, end: 4 });
                    const magicBytes = buffer.toString('hex');
                    
                    if (magicBytes !== '0061736d') { // WASM magic number
                        return { exists: true, valid: false, error: 'invalid_magic_bytes' };
                    }
                    
                    // Try to load with WebAssembly if available
                    if (typeof WebAssembly !== 'undefined') {
                        try {
                            const wasmBuffer = fs.readFileSync(wasmFile);
                            await WebAssembly.validate(wasmBuffer);
                            return { exists: true, valid: true, loadable: true };
                        } catch (wasmError) {
                            return { 
                                exists: true, 
                                valid: true, 
                                loadable: false, 
                                error: wasmError.message 
                            };
                        }
                    }
                    
                    return { exists: true, valid: true, loadable: 'unknown' };
                });
                
                results[wasmFile] = wasmStatus || { error: 'check_failed' };
                
                if (!wasmStatus?.loadable) {
                    allLoading = false;
                    this.issues.push({
                        type: 'wasm_issue',
                        file: wasmFile,
                        status: wasmStatus,
                        severity: 'medium'
                    });
                }
                
            } catch (error) {
                results[wasmFile] = { error: error.message };
                allLoading = false;
            }
        }
        
        return { results, allLoading, fileCount: wasmFiles.length };
    }
    
    findWasmFiles() {
        const wasmFiles = [];
        
        // Custom WASM files (not in node_modules)
        const customWasm = this.boundary.try(() => {
            return execSync('find . -name "*.wasm" -not -path "./node_modules/*" 2>/dev/null || true', 
                           { encoding: 'utf8' })
                   .split('\n')
                   .filter(line => line.trim() && fs.existsSync(line.trim()));
        }) || [];
        
        wasmFiles.push(...customWasm);
        
        // Important node_modules WASM files
        const importantWasm = [
            './node_modules/@dimforge/rapier3d-compat/rapier_wasm3d_bg.wasm',
            './node_modules/draco3d/draco_decoder.wasm',
            './node_modules/draco3d/draco_encoder.wasm'
        ].filter(file => fs.existsSync(file));
        
        wasmFiles.push(...importantWasm);
        
        return [...new Set(wasmFiles)]; // Remove duplicates
    }
    
    async checkPermissions() {
        logger.log('INFO', 'Checking file permissions and access rights');
        const results = {};
        
        const criticalPaths = [
            process.cwd(),
            path.join(process.cwd(), 'node_modules'),
            os.tmpdir(),
            path.join(os.homedir(), '.npm'),
            path.join(os.homedir(), '.node-gyp')
        ];
        
        for (const checkPath of criticalPaths) {
            try {
                const stats = fs.existsSync(checkPath) ? fs.statSync(checkPath) : null;
                if (stats) {
                    // Test write access
                    const testFile = path.join(checkPath, '.write_test_' + Date.now());
                    try {
                        fs.writeFileSync(testFile, 'test');
                        fs.unlinkSync(testFile);
                        results[checkPath] = { readable: true, writable: true };
                    } catch (writeError) {
                        results[checkPath] = { readable: true, writable: false, error: writeError.message };
                        this.issues.push({
                            type: 'permission_issue',
                            path: checkPath,
                            error: 'not_writable',
                            severity: 'high'
                        });
                    }
                } else {
                    results[checkPath] = { exists: false };
                }
            } catch (error) {
                results[checkPath] = { error: error.message };
            }
        }
        
        return results;
    }
    
    async checkEnvironment() {
        logger.log('INFO', 'Checking environment variables and configuration');
        
        const env = process.env;
        const results = {
            nodeVersion: process.version,
            platform: os.platform(),
            arch: os.arch(),
            pythonPath: env.PYTHON || env.PYTHON3,
            gypDefines: env.GYP_DEFINES,
            npmConfig: {
                cache: env.npm_config_cache,
                prefix: env.npm_config_prefix,
                registry: env.npm_config_registry
            },
            homeDir: os.homedir(),
            tmpDir: os.tmpdir()
        };
        
        // Check for problematic environment settings
        if (!results.pythonPath) {
            this.issues.push({
                type: 'environment_issue',
                issue: 'python_path_missing',
                severity: 'medium'
            });
        }
        
        return results;
    }
    
    async checkDiskSpace() {
        logger.log('INFO', 'Checking available disk space');
        
        try {
            const stats = fs.statSync(process.cwd());
            const freeSpace = this.boundary.try(() => {
                return execSync('df -h . | tail -1 | awk \'{print $4}\'', { encoding: 'utf8' }).trim();
            });
            
            return {
                available: freeSpace,
                sufficient: true // We'll assume it's sufficient for now
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async fixIssues() {
        logger.log('INFO', 'Starting automated issue fixing', { issueCount: this.issues.length });
        
        for (const issue of this.issues) {
            try {
                const fix = await this.createFix(issue);
                if (fix) {
                    this.fixes.push(fix);
                    logger.log('INFO', `Applied fix for ${issue.type}`, fix);
                }
            } catch (error) {
                logger.logError(`Failed to fix ${issue.type}`, error);
            }
        }
        
        logger.log('INFO', 'Issue fixing complete', { fixesApplied: this.fixes.length });
        return this.fixes;
    }
    
    async createFix(issue) {
        switch (issue.type) {
            case 'missing_build_tool':
                return await this.fixMissingBuildTool(issue);
            case 'native_module_issue':
                return await this.fixNativeModule(issue);
            case 'wasm_issue':
                return await this.fixWasmIssue(issue);
            case 'permission_issue':
                return await this.fixPermissionIssue(issue);
            case 'environment_issue':
                return await this.fixEnvironmentIssue(issue);
            default:
                logger.log('WARNING', `No fix available for issue type: ${issue.type}`);
                return null;
        }
    }
    
    async fixMissingBuildTool(issue) {
        const { tool } = issue;
        
        switch (tool) {
            case 'node-gyp':
                execSync('npm install -g node-gyp', { stdio: 'inherit' });
                return { type: 'install_global_package', tool, command: 'npm install -g node-gyp' };
            
            case 'python':
                if (os.platform() === 'darwin') {
                    logger.log('INFO', 'Python not found - please install with: brew install python3');
                    return { type: 'manual_install_required', tool, instruction: 'brew install python3' };
                }
                return { type: 'manual_install_required', tool, instruction: 'Install Python 3.x' };
            
            default:
                return { type: 'manual_install_required', tool, instruction: `Install ${tool} manually` };
        }
    }
    
    async fixNativeModule(issue) {
        const { module, status } = issue;
        
        if (status.error === 'binding_error') {
            // Try rebuilding the module
            try {
                execSync(`npm rebuild ${module}`, { stdio: 'inherit', cwd: process.cwd() });
                return { type: 'rebuild_module', module, command: `npm rebuild ${module}` };
            } catch (rebuildError) {
                // Try clearing and reinstalling
                try {
                    execSync(`npm uninstall ${module} && npm install ${module}`, { stdio: 'inherit' });
                    return { type: 'reinstall_module', module };
                } catch (reinstallError) {
                    return { type: 'manual_fix_required', module, error: reinstallError.message };
                }
            }
        }
        
        return { type: 'manual_inspection_required', module, status };
    }
    
    async fixWasmIssue(issue) {
        const { file, status } = issue;
        
        if (status.error === 'file_not_found') {
            // Try to regenerate or download the WASM file
            return { type: 'manual_regeneration_required', file };
        }
        
        if (status.error === 'invalid_magic_bytes') {
            // File is corrupted, try to restore
            return { type: 'file_corrupted', file, action: 'needs_restoration' };
        }
        
        return { type: 'manual_inspection_required', file, status };
    }
    
    async fixPermissionIssue(issue) {
        const { path: issuePath } = issue;
        
        try {
            // Try to create directory if it doesn't exist
            if (!fs.existsSync(issuePath)) {
                fs.mkdirSync(issuePath, { recursive: true });
                return { type: 'create_directory', path: issuePath };
            }
            
            // Fix permissions (be careful with this)
            if (os.platform() !== 'win32') {
                execSync(`chmod 755 "${issuePath}"`, { stdio: 'inherit' });
                return { type: 'fix_permissions', path: issuePath };
            }
        } catch (error) {
            return { type: 'manual_permission_fix_required', path: issuePath, error: error.message };
        }
        
        return null;
    }
    
    async fixEnvironmentIssue(issue) {
        const { issue: envIssue } = issue;
        
        if (envIssue === 'python_path_missing') {
            // Try to detect Python and set environment variable
            const pythonPaths = ['/usr/bin/python3', '/usr/local/bin/python3', '/opt/homebrew/bin/python3'];
            
            for (const pythonPath of pythonPaths) {
                if (fs.existsSync(pythonPath)) {
                    process.env.PYTHON = pythonPath;
                    return { type: 'set_python_path', path: pythonPath };
                }
            }
        }
        
        return { type: 'manual_environment_fix_required', issue: envIssue };
    }
    
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version
            },
            issues: {
                total: this.issues.length,
                byType: this.groupIssuesByType(),
                bySeverity: this.groupIssuesBySeverity()
            },
            fixes: {
                total: this.fixes.length,
                byType: this.groupFixesByType()
            },
            buildTools: this.buildTools,
            recommendations: this.generateRecommendations()
        };
        
        // Write report to file
        const reportPath = path.join(__dirname, 'logs', `native-build-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        logger.log('INFO', `Native build report generated: ${reportPath}`);
        return report;
    }
    
    groupIssuesByType() {
        const grouped = {};
        this.issues.forEach(issue => {
            grouped[issue.type] = (grouped[issue.type] || 0) + 1;
        });
        return grouped;
    }
    
    groupIssuesBySeverity() {
        const grouped = { high: 0, medium: 0, low: 0 };
        this.issues.forEach(issue => {
            grouped[issue.severity] = (grouped[issue.severity] || 0) + 1;
        });
        return grouped;
    }
    
    groupFixesByType() {
        const grouped = {};
        this.fixes.forEach(fix => {
            grouped[fix.type] = (grouped[fix.type] || 0) + 1;
        });
        return grouped;
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        if (this.issues.some(i => i.type === 'missing_build_tool')) {
            recommendations.push('Install missing build tools (node-gyp, python, etc.)');
        }
        
        if (this.issues.some(i => i.type === 'native_module_issue')) {
            recommendations.push('Rebuild native modules with: npm rebuild');
        }
        
        if (this.issues.some(i => i.type === 'wasm_issue')) {
            recommendations.push('Check WebAssembly files and regenerate if corrupted');
        }
        
        if (this.issues.some(i => i.type === 'permission_issue')) {
            recommendations.push('Fix file permissions and directory access');
        }
        
        if (this.issues.length === 0) {
            recommendations.push('System appears healthy - no major issues detected');
        }
        
        return recommendations;
    }
}

// Export for use in other modules
module.exports = {
    NativeBuildFixer,
    
    // Convenience functions
    quickDiagnosis: async () => {
        const fixer = new NativeBuildFixer();
        return await fixer.diagnoseSystem();
    },
    
    fixAllIssues: async () => {
        const fixer = new NativeBuildFixer();
        await fixer.diagnoseSystem();
        await fixer.fixIssues();
        return fixer.generateReport();
    }
};

// If run directly, perform full diagnosis and fix
if (require.main === module) {
    (async () => {
        try {
            console.log('🔧 Starting native build diagnosis and repair...\n');
            
            const fixer = new NativeBuildFixer();
            
            // Diagnose system
            console.log('📊 Diagnosing build environment...');
            const diagnosis = await fixer.diagnoseSystem();
            
            // Display summary
            console.log('\n📋 Diagnosis Summary:');
            console.log(`  Build Tools: ${diagnosis.buildTools.allPresent ? '✅' : '❌'}`);
            console.log(`  Native Modules: ${diagnosis.nativeModules.allWorking ? '✅' : '❌'}`);
            console.log(`  WASM Modules: ${diagnosis.wasmModules.allLoading ? '✅' : '❌'} (${diagnosis.wasmModules.fileCount} files)`);
            console.log(`  Issues Found: ${fixer.issues.length}`);
            
            // Fix issues
            if (fixer.issues.length > 0) {
                console.log('\n🔨 Applying automatic fixes...');
                await fixer.fixIssues();
                console.log(`  Fixes Applied: ${fixer.fixes.length}`);
            }
            
            // Generate report
            const report = fixer.generateReport();
            
            console.log('\n📄 Report Summary:');
            console.log(`  Total Issues: ${report.issues.total}`);
            console.log(`  Total Fixes: ${report.fixes.total}`);
            console.log(`  Recommendations: ${report.recommendations.length}`);
            
            if (report.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                report.recommendations.forEach(rec => console.log(`  • ${rec}`));
            }
            
            console.log('\n✅ Native build diagnosis and repair complete!');
            
        } catch (error) {
            console.error('❌ Fatal error during diagnosis:', error);
            process.exit(1);
        }
    })();
}
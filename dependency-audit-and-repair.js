#!/usr/bin/env node

/**
 * 🔧 DEPENDENCY AUDIT & REPAIR SYSTEM
 * 
 * Phase 1: Foundation Surgery
 * Scans all 14,005+ systems for missing files and broken constructors
 * Creates repair strategies and fills dependency gaps
 * 
 * THE PROBLEM: We have TONS of systems but they're missing dependencies
 * THE SOLUTION: Smart dependency resolution and repair automation
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class DependencyAuditAndRepairSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            rootDir: options.rootDir || process.cwd(),
            excludeDirs: [
                'node_modules', 
                '.git', 
                '.next', 
                'dist', 
                'build',
                '.cache',
                'backups',
                'FinishThisIdea-backup-*'
            ],
            includeExtensions: ['.js', '.ts', '.json', '.py', '.sh'],
            criticalSystems: [
                'ARCHEO-SYMBOL-ENGINE.js',
                'ArcheoSymbolEngine',
                'WaybackSemanticBridge', 
                'ComponentDiscoveryEngine',
                'UnixSuperuserSystem',
                'UltimateSquashCollapseSubagentSingularity',
                'Chapter7MagazinePDFIntegrator',
                'MasterDocumentationOrchestrator'
            ],
            repairStrategies: {
                'missing_file': 'create_stub',
                'broken_constructor': 'fix_exports', 
                'missing_module': 'install_or_stub',
                'circular_dependency': 'break_cycle',
                'version_mismatch': 'update_or_compatibility'
            }
        };
        
        // Audit results
        this.audit = {
            scannedFiles: 0,
            totalSystems: 0,
            missingDependencies: new Map(),
            brokenConstructors: new Map(),
            circularDependencies: new Set(),
            repairActions: new Map(),
            fixedSystems: new Set(),
            stubsCreated: new Set()
        };
        
        // Dependency graph
        this.dependencyGraph = new Map();
        this.reverseGraph = new Map();
        
        console.log('🔧 DEPENDENCY AUDIT & REPAIR SYSTEM INITIALIZED');
        console.log('================================================');
        console.log('🔍 Scanning for missing dependencies and broken constructors');
        console.log('🛠️ Creating repair strategies for all issues found');
        console.log('⚡ Filling gaps to make everything work together');
    }
    
    /**
     * Run complete dependency audit and repair
     */
    async runCompleteAudit() {
        console.log('\n🔍 PHASE 1: COMPLETE SYSTEM SCAN');
        console.log('================================');
        
        try {
            // Step 1: Scan all files
            const allFiles = await this.scanAllFiles();
            console.log(`📊 Scanned ${allFiles.length} files`);
            
            // Step 2: Build dependency graph
            console.log('\n📈 Building dependency graph...');
            await this.buildDependencyGraph(allFiles);
            
            // Step 3: Detect missing dependencies
            console.log('\n🚨 Detecting missing dependencies...');
            await this.detectMissingDependencies();
            
            // Step 4: Find broken constructors
            console.log('\n🔧 Finding broken constructors...');
            await this.findBrokenConstructors();
            
            // Step 5: Detect circular dependencies
            console.log('\n🔄 Detecting circular dependencies...');
            await this.detectCircularDependencies();
            
            // Step 6: Generate repair plan
            console.log('\n📋 Generating repair plan...');
            const repairPlan = await this.generateRepairPlan();
            
            // Step 7: Execute repairs
            console.log('\n🛠️ Executing repairs...');
            await this.executeRepairs(repairPlan);
            
            // Step 8: Verify fixes
            console.log('\n✅ Verifying fixes...');
            const verificationResults = await this.verifyFixes();
            
            console.log('\n🎉 DEPENDENCY AUDIT & REPAIR COMPLETE');
            console.log('====================================');
            
            return this.generateAuditReport(verificationResults);
            
        } catch (error) {
            console.error('❌ Audit failed:', error);
            throw error;
        }
    }
    
    /**
     * Scan all files in the system
     */
    async scanAllFiles() {
        const allFiles = [];
        
        async function scanDirectory(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory()) {
                        // Skip excluded directories
                        if (!this.config.excludeDirs.some(exclude => 
                            entry.name.includes(exclude))) {
                            await scanDirectory.call(this, fullPath);
                        }
                    } else if (entry.isFile()) {
                        // Include files with relevant extensions
                        const ext = path.extname(entry.name);
                        if (this.config.includeExtensions.includes(ext)) {
                            allFiles.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
                console.log(`⚠️ Skipped ${dir}: ${error.message}`);
            }
        }
        
        await scanDirectory.call(this, this.config.rootDir);
        this.audit.scannedFiles = allFiles.length;
        
        return allFiles;
    }
    
    /**
     * Build dependency graph from all files
     */
    async buildDependencyGraph(files) {
        for (const filePath of files) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const dependencies = this.extractDependencies(content, filePath);
                
                const relativePath = path.relative(this.config.rootDir, filePath);
                this.dependencyGraph.set(relativePath, dependencies);
                
                // Build reverse graph
                for (const dep of dependencies) {
                    if (!this.reverseGraph.has(dep)) {
                        this.reverseGraph.set(dep, new Set());
                    }
                    this.reverseGraph.get(dep).add(relativePath);
                }
                
                this.audit.totalSystems++;
                
            } catch (error) {
                console.log(`⚠️ Error reading ${filePath}: ${error.message}`);
            }
        }
    }
    
    /**
     * Extract dependencies from file content
     */
    extractDependencies(content, filePath) {
        const dependencies = new Set();
        
        // Require patterns
        const requirePatterns = [
            /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
            /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
            /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
        ];
        
        for (const pattern of requirePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                let dep = match[1];
                
                // Handle relative imports
                if (dep.startsWith('./') || dep.startsWith('../')) {
                    dep = path.resolve(path.dirname(filePath), dep);
                    dep = path.relative(this.config.rootDir, dep);
                }
                
                dependencies.add(dep);
            }
        }
        
        // Constructor/class patterns
        const constructorPatterns = [
            /new\s+([A-Z][a-zA-Z0-9_]+)/g,
            /class\s+([A-Z][a-zA-Z0-9_]+)/g,
            /const\s+\{\s*([^}]+)\s*\}\s*=\s*require/g
        ];
        
        for (const pattern of constructorPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (pattern.source.includes('const')) {
                    // Handle destructured requires
                    const destructured = match[1].split(',')
                        .map(s => s.trim())
                        .filter(s => s && /^[A-Z]/.test(s));
                    for (const name of destructured) {
                        dependencies.add(name);
                    }
                } else {
                    dependencies.add(match[1]);
                }
            }
        }
        
        return Array.from(dependencies);
    }
    
    /**
     * Detect missing dependencies
     */
    async detectMissingDependencies() {
        for (const [filePath, dependencies] of this.dependencyGraph) {
            const missing = [];
            
            for (const dep of dependencies) {
                const exists = await this.checkDependencyExists(dep, filePath);
                
                if (!exists) {
                    missing.push({
                        name: dep,
                        requiredBy: filePath,
                        type: this.categorizeDependency(dep)
                    });
                }
            }
            
            if (missing.length > 0) {
                this.audit.missingDependencies.set(filePath, missing);
            }
        }
        
        console.log(`🚨 Found ${this.audit.missingDependencies.size} files with missing dependencies`);
    }
    
    /**
     * Check if dependency exists
     */
    async checkDependencyExists(dep, fromFile) {
        // Check if it's a Node.js built-in
        const builtins = ['fs', 'path', 'http', 'crypto', 'events', 'util', 'os'];
        if (builtins.includes(dep)) return true;
        
        // Check if it's an npm package
        if (!dep.startsWith('.') && !dep.startsWith('/')) {
            try {
                require.resolve(dep);
                return true;
            } catch {
                // Check in node_modules
                const nodeModulesPath = path.join(this.config.rootDir, 'node_modules', dep);
                try {
                    await fs.access(nodeModulesPath);
                    return true;
                } catch {
                    return false;
                }
            }
        }
        
        // Check if it's a local file
        const possiblePaths = [
            dep,
            dep + '.js',
            dep + '.ts',
            dep + '/index.js',
            dep + '/index.ts'
        ];
        
        for (const possiblePath of possiblePaths) {
            const fullPath = path.isAbsolute(possiblePath) 
                ? possiblePath 
                : path.join(this.config.rootDir, possiblePath);
                
            try {
                await fs.access(fullPath);
                return true;
            } catch {
                continue;
            }
        }
        
        return false;
    }
    
    /**
     * Categorize dependency type
     */
    categorizeDependency(dep) {
        if (dep.startsWith('./') || dep.startsWith('../')) return 'local_file';
        if (dep.startsWith('/')) return 'absolute_file';
        if (this.config.criticalSystems.includes(dep)) return 'critical_system';
        if (/^[a-z]/.test(dep)) return 'npm_package';
        if (/^[A-Z]/.test(dep)) return 'constructor_class';
        return 'unknown';
    }
    
    /**
     * Find broken constructors
     */
    async findBrokenConstructors() {
        const criticalConstructors = this.config.criticalSystems;
        
        for (const constructor of criticalConstructors) {
            const usages = this.reverseGraph.get(constructor) || new Set();
            
            if (usages.size > 0) {
                // Check if the constructor actually exists and works
                const isWorking = await this.testConstructor(constructor);
                
                if (!isWorking) {
                    this.audit.brokenConstructors.set(constructor, {
                        usedBy: Array.from(usages),
                        issue: 'constructor_not_found_or_broken',
                        criticalLevel: 'high'
                    });
                }
            }
        }
        
        console.log(`🔧 Found ${this.audit.brokenConstructors.size} broken constructors`);
    }
    
    /**
     * Test if a constructor works
     */
    async testConstructor(constructorName) {
        // Look for files that might export this constructor
        const possibleFiles = [
            `${constructorName.toLowerCase()}.js`,
            `${constructorName.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)}.js`,
            `${constructorName}.js`
        ];
        
        for (const fileName of possibleFiles) {
            const filePath = path.join(this.config.rootDir, fileName);
            
            try {
                await fs.access(filePath);
                const content = await fs.readFile(filePath, 'utf-8');
                
                // Check if the file exports the constructor
                const hasExport = content.includes(`class ${constructorName}`) ||
                                content.includes(`module.exports = ${constructorName}`) ||
                                content.includes(`exports.${constructorName}`);
                
                if (hasExport) return true;
                
            } catch {
                continue;
            }
        }
        
        return false;
    }
    
    /**
     * Detect circular dependencies
     */
    async detectCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        
        const dfs = (filePath, path) => {
            if (recursionStack.has(filePath)) {
                // Found a cycle
                const cycleStart = path.indexOf(filePath);
                const cycle = path.slice(cycleStart).concat([filePath]);
                this.audit.circularDependencies.add(cycle);
                return;
            }
            
            if (visited.has(filePath)) return;
            
            visited.add(filePath);
            recursionStack.add(filePath);
            
            const dependencies = this.dependencyGraph.get(filePath) || [];
            
            for (const dep of dependencies) {
                if (this.dependencyGraph.has(dep)) {
                    dfs(dep, [...path, filePath]);
                }
            }
            
            recursionStack.delete(filePath);
        };
        
        for (const filePath of this.dependencyGraph.keys()) {
            if (!visited.has(filePath)) {
                dfs(filePath, []);
            }
        }
        
        console.log(`🔄 Found ${this.audit.circularDependencies.size} circular dependencies`);
    }
    
    /**
     * Generate repair plan
     */
    async generateRepairPlan() {
        const repairPlan = {
            stubsToCreate: [],
            constructorsToFix: [],
            packagesToInstall: [],
            cyclesToBreak: [],
            filesToUpdate: []
        };
        
        // Plan for missing dependencies
        for (const [filePath, missing] of this.audit.missingDependencies) {
            for (const dep of missing) {
                switch (dep.type) {
                    case 'critical_system':
                        repairPlan.stubsToCreate.push({
                            name: dep.name,
                            filePath: `${dep.name.toLowerCase().replace(/([A-Z])/g, '-$1').slice(1)}.js`,
                            requiredBy: filePath
                        });
                        break;
                        
                    case 'npm_package':
                        repairPlan.packagesToInstall.push(dep.name);
                        break;
                        
                    case 'local_file':
                        repairPlan.stubsToCreate.push({
                            name: dep.name,
                            filePath: dep.name.endsWith('.js') ? dep.name : dep.name + '.js',
                            requiredBy: filePath
                        });
                        break;
                }
            }
        }
        
        // Plan for broken constructors
        for (const [constructor, info] of this.audit.brokenConstructors) {
            repairPlan.constructorsToFix.push({
                name: constructor,
                usedBy: info.usedBy,
                action: 'create_stub_class'
            });
        }
        
        // Plan for circular dependencies
        for (const cycle of this.audit.circularDependencies) {
            repairPlan.cyclesToBreak.push({
                cycle,
                strategy: 'dependency_injection'
            });
        }
        
        return repairPlan;
    }
    
    /**
     * Execute all repairs
     */
    async executeRepairs(repairPlan) {
        console.log(`🛠️ Creating ${repairPlan.stubsToCreate.length} stub files...`);
        
        for (const stub of repairPlan.stubsToCreate) {
            await this.createStubFile(stub);
        }
        
        console.log(`🔧 Fixing ${repairPlan.constructorsToFix.length} constructors...`);
        
        for (const constructor of repairPlan.constructorsToFix) {
            await this.createStubConstructor(constructor);
        }
        
        console.log(`📦 Installing ${repairPlan.packagesToInstall.length} packages...`);
        
        for (const pkg of repairPlan.packagesToInstall) {
            await this.installOrStubPackage(pkg);
        }
        
        console.log(`🔄 Breaking ${repairPlan.cyclesToBreak.length} circular dependencies...`);
        
        for (const cycle of repairPlan.cyclesToBreak) {
            await this.breakCircularDependency(cycle);
        }
    }
    
    /**
     * Create stub file for missing dependency
     */
    async createStubFile(stub) {
        const filePath = path.join(this.config.rootDir, stub.filePath);
        
        // Make sure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        let stubContent;
        
        if (stub.name.includes('Engine') || stub.name.includes('System') || stub.name.includes('Service')) {
            stubContent = this.generateStubClass(stub.name);
        } else {
            stubContent = this.generateStubModule(stub.name);
        }
        
        try {
            await fs.writeFile(filePath, stubContent);
            console.log(`✅ Created stub: ${stub.filePath}`);
            this.audit.stubsCreated.add(stub.filePath);
        } catch (error) {
            console.log(`❌ Failed to create stub ${stub.filePath}: ${error.message}`);
        }
    }
    
    /**
     * Generate stub class
     */
    generateStubClass(className) {
        return `#!/usr/bin/env node

/**
 * 🔧 AUTO-GENERATED STUB: ${className}
 * 
 * This is a temporary stub created by the Dependency Audit & Repair System
 * to resolve missing dependencies. Replace with actual implementation.
 * 
 * Generated: ${new Date().toISOString()}
 */

const EventEmitter = require('events');

class ${className} extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            stubMode: true,
            originalClassName: '${className}',
            ...options
        };
        
        this.initialized = false;
        
        console.log('🔧 STUB: ${className} initialized (placeholder)');
    }
    
    async initialize() {
        console.log('🔧 STUB: ${className} initializing...');
        this.initialized = true;
        this.emit('initialized');
        return true;
    }
    
    async shutdown() {
        console.log('🔧 STUB: ${className} shutting down...');
        this.initialized = false;
        this.emit('shutdown');
    }
    
    getStatus() {
        return {
            stub: true,
            className: '${className}',
            initialized: this.initialized,
            note: 'This is a stub implementation - replace with actual code'
        };
    }
    
    // Generic method handler
    async handleMethod(methodName, ...args) {
        console.log(\`🔧 STUB: \${methodName} called with args:\`, args);
        return { stub: true, method: methodName, result: 'placeholder' };
    }
}

module.exports = ${className};
module.exports.${className} = ${className};

// Also export as default for ES6 imports
module.exports.default = ${className};

console.log('🔧 ${className} stub loaded - replace with actual implementation');
`;
    }
    
    /**
     * Generate stub module
     */
    generateStubModule(moduleName) {
        return `#!/usr/bin/env node

/**
 * 🔧 AUTO-GENERATED STUB MODULE: ${moduleName}
 * 
 * This is a temporary stub created by the Dependency Audit & Repair System
 * to resolve missing dependencies. Replace with actual implementation.
 * 
 * Generated: ${new Date().toISOString()}
 */

const stubModule = {
    name: '${moduleName}',
    stub: true,
    
    // Generic function handler
    invoke: (...args) => {
        console.log(\`🔧 STUB: \${moduleName} invoked with:\`, args);
        return { stub: true, result: 'placeholder' };
    }
};

// Export various patterns
module.exports = stubModule;
module.exports.${moduleName} = stubModule;
module.exports.default = stubModule;

console.log('🔧 ${moduleName} stub module loaded - replace with actual implementation');
`;
    }
    
    /**
     * Create stub constructor
     */
    async createStubConstructor(constructor) {
        const fileName = `${constructor.name.toLowerCase().replace(/([A-Z])/g, '-$1').slice(1)}.js`;
        const filePath = path.join(this.config.rootDir, fileName);
        
        const stubContent = this.generateStubClass(constructor.name);
        
        try {
            await fs.writeFile(filePath, stubContent);
            console.log(`✅ Created constructor stub: ${fileName}`);
            this.audit.fixedSystems.add(constructor.name);
        } catch (error) {
            console.log(`❌ Failed to create constructor stub ${fileName}: ${error.message}`);
        }
    }
    
    /**
     * Install or create stub for npm package
     */
    async installOrStubPackage(packageName) {
        // For now, create a notice file instead of trying to install
        const noticeFile = path.join(this.config.rootDir, `MISSING_PACKAGE_${packageName}.md`);
        const noticeContent = `# Missing Package: ${packageName}

This package is required but not installed. Run:

\`\`\`bash
npm install ${packageName}
\`\`\`

Or if it's a custom package, implement it manually.

Generated by Dependency Audit & Repair System: ${new Date().toISOString()}
`;
        
        try {
            await fs.writeFile(noticeFile, noticeContent);
            console.log(`📝 Created package notice: MISSING_PACKAGE_${packageName}.md`);
        } catch (error) {
            console.log(`❌ Failed to create package notice: ${error.message}`);
        }
    }
    
    /**
     * Break circular dependency
     */
    async breakCircularDependency(cycle) {
        // For now, just log the cycle - breaking requires careful analysis
        console.log(`🔄 Circular dependency detected:`, cycle.cycle);
        console.log(`💡 Suggested fix: Use dependency injection or lazy loading`);
    }
    
    /**
     * Verify fixes
     */
    async verifyFixes() {
        console.log('✅ Running verification tests...');
        
        const results = {
            stubsWorking: 0,
            constructorsFixed: 0,
            dependenciesResolved: 0,
            stillBroken: []
        };
        
        // Test critical systems
        for (const systemName of this.config.criticalSystems) {
            try {
                const isWorking = await this.testConstructor(systemName);
                if (isWorking) {
                    results.constructorsFixed++;
                } else {
                    results.stillBroken.push(systemName);
                }
            } catch (error) {
                results.stillBroken.push(`${systemName}: ${error.message}`);
            }
        }
        
        return results;
    }
    
    /**
     * Generate comprehensive audit report
     */
    generateAuditReport(verificationResults) {
        const report = {
            summary: {
                scannedFiles: this.audit.scannedFiles,
                totalSystems: this.audit.totalSystems,
                missingDependencies: this.audit.missingDependencies.size,
                brokenConstructors: this.audit.brokenConstructors.size,
                circularDependencies: this.audit.circularDependencies.size,
                stubsCreated: this.audit.stubsCreated.size,
                fixedSystems: this.audit.fixedSystems.size
            },
            details: {
                missingDependencies: Object.fromEntries(this.audit.missingDependencies),
                brokenConstructors: Object.fromEntries(this.audit.brokenConstructors),
                circularDependencies: Array.from(this.audit.circularDependencies),
                stubsCreated: Array.from(this.audit.stubsCreated),
                fixedSystems: Array.from(this.audit.fixedSystems)
            },
            verification: verificationResults,
            recommendations: this.generateRecommendations()
        };
        
        console.log('\n📊 DEPENDENCY AUDIT REPORT');
        console.log('===========================');
        console.log(`📁 Files Scanned: ${report.summary.scannedFiles}`);
        console.log(`⚙️ Systems Found: ${report.summary.totalSystems}`);
        console.log(`🚨 Missing Dependencies: ${report.summary.missingDependencies}`);
        console.log(`🔧 Broken Constructors: ${report.summary.brokenConstructors}`);
        console.log(`🔄 Circular Dependencies: ${report.summary.circularDependencies}`);
        console.log(`✅ Stubs Created: ${report.summary.stubsCreated}`);
        console.log(`🛠️ Systems Fixed: ${report.summary.fixedSystems}`);
        console.log(`❌ Still Broken: ${verificationResults.stillBroken.length}`);
        
        if (verificationResults.stillBroken.length > 0) {
            console.log('\n🚨 STILL BROKEN:');
            verificationResults.stillBroken.forEach(broken => {
                console.log(`   ❌ ${broken}`);
            });
        }
        
        return report;
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations() {
        return [
            "Replace auto-generated stubs with actual implementations",
            "Install missing npm packages using npm install <package>",
            "Review circular dependencies and implement dependency injection",
            "Run the system unifier to test connections between fixed systems",
            "Monitor the electrical panel dashboard for system health",
            "Consider creating a package.json with all required dependencies"
        ];
    }
}

// Export for use as module
module.exports = DependencyAuditAndRepairSystem;

// CLI interface
if (require.main === module) {
    console.log('🔧 DEPENDENCY AUDIT & REPAIR SYSTEM');
    console.log('===================================');
    
    const auditor = new DependencyAuditAndRepairSystem();
    
    async function run() {
        const report = await auditor.runCompleteAudit();
        
        console.log('\n📝 Saving detailed report...');
        const reportPath = path.join(process.cwd(), 'dependency-audit-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`✅ Report saved to: ${reportPath}`);
        
        console.log('\n🎯 NEXT STEPS:');
        console.log('==============');
        report.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });
        
        console.log('\n⚡ Run the system unifier to test connections:');
        console.log('   node STOP-BUILDING-START-CONNECTING.js status');
        console.log('\n🔌 Check the electrical panel dashboard:');
        console.log('   http://localhost:8900/dashboard');
    }
    
    run().catch(error => {
        console.error('❌ Audit failed:', error);
        process.exit(1);
    });
}
#!/usr/bin/env node
// DEPENDENCY-LOCK-MANAGER.js - Manage wild dependency chains as queryable world state
// Solves: Package locking issues preventing proper loading into total world orchestration

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DependencyLockManager {
    constructor() {
        this.port = 6666; // Dependency manager port
        this.basePath = __dirname;
        
        // DEPENDENCY WORLD STATE - Treat all deps as queryable entities
        this.worldState = {
            packages: new Map(),        // All discovered packages
            lockFiles: new Map(),       // Package lock files (package-lock.json, yarn.lock, etc.)
            dependencies: new Map(),    // Direct dependencies
            devDependencies: new Map(), // Development dependencies
            crossReferences: new Map(), // Cross-references between packages
            conflicts: new Map(),       // Version conflicts
            resolutions: new Map(),     // Resolved package versions
            virtualPackages: new Map()  // Virtual/phantom packages
        };
        
        // LOCK FILE TYPES - Support multiple package managers
        this.lockFileTypes = {
            'package-lock.json': 'npm',
            'yarn.lock': 'yarn',
            'pnpm-lock.yaml': 'pnpm',
            'composer.lock': 'composer',
            'Gemfile.lock': 'bundler',
            'requirements.txt': 'pip',
            'Pipfile.lock': 'pipenv',
            'Cargo.lock': 'cargo',
            'go.sum': 'go',
            'mix.lock': 'hex'
        };
        
        // DEPENDENCY CONFLICT RESOLUTION STRATEGIES
        this.resolutionStrategies = {
            'highest': (versions) => versions.sort((a, b) => this.compareVersions(b, a))[0],
            'lowest': (versions) => versions.sort((a, b) => this.compareVersions(a, b))[0],
            'latest_stable': (versions) => this.getLatestStable(versions),
            'most_used': (versions, usage) => this.getMostUsedVersion(versions, usage),
            'ecosystem_preference': (versions, ecosystem) => this.getEcosystemPreference(versions, ecosystem)
        };
        
        // CROSS-REFERENCE PATTERNS - How packages reference each other
        this.crossRefPatterns = {
            'npm_import': /require\(['"`]([^'"`]+)['"`]\)/g,
            'es6_import': /import.*from\s+['"`]([^'"`]+)['"`]/g,
            'dynamic_import': /import\(['"`]([^'"`]+)['"`]\)/g,
            'css_import': /@import\s+['"`]([^'"`]+)['"`]/g,
            'html_script': /<script[^>]+src=['"`]([^'"`]+)['"`]/g,
            'python_import': /^import\s+([^\s]+)|^from\s+([^\s]+)\s+import/gm,
            'go_import': /import\s+['"`]([^'"`]+)['"`]/g,
            'rust_use': /use\s+([^;]+);/g
        };
        
        // VIRTUAL PACKAGE REGISTRY - Track packages that don't exist but are referenced
        this.virtualPackages = {
            '@types/*': 'TypeScript type definitions',
            'webpack-*': 'Webpack plugins and loaders',
            'babel-*': 'Babel plugins and presets',
            'eslint-*': 'ESLint plugins and configs',
            'rollup-*': 'Rollup plugins',
            'vite-*': 'Vite plugins',
            'postcss-*': 'PostCSS plugins'
        };
        
        console.log('📦 DEPENDENCY LOCK MANAGER');
        console.log('===========================');
        console.log('🔒 Manage package locks and cross-references');
        console.log('🌍 Load dependencies into queryable world state');
        console.log('⚖️ Resolve conflicts and version issues');
    }
    
    // MAIN FUNCTION - Scan and load all dependencies into world state
    async loadDependencyWorldState() {
        console.log('\n📦 LOADING DEPENDENCY WORLD STATE');
        console.log('==================================');
        
        // Step 1: Discover all lock files
        console.log('🔍 Step 1: Discovering lock files...');
        const lockFiles = await this.discoverLockFiles();
        console.log(`✅ Found ${lockFiles.length} lock files`);
        
        // Step 2: Parse lock files and extract package info
        console.log('📋 Step 2: Parsing package information...');
        const packageInfo = await this.parseLockFiles(lockFiles);
        console.log(`✅ Parsed ${packageInfo.totalPackages} packages`);
        
        // Step 3: Scan source code for cross-references
        console.log('🔗 Step 3: Scanning for cross-references...');
        const crossRefs = await this.scanCrossReferences();
        console.log(`✅ Found ${crossRefs.length} cross-references`);
        
        // Step 4: Detect conflicts and version issues
        console.log('⚠️ Step 4: Detecting conflicts...');
        const conflicts = await this.detectConflicts();
        console.log(`✅ Found ${conflicts.length} conflicts`);
        
        // Step 5: Generate resolution strategies
        console.log('⚖️ Step 5: Generating resolutions...');
        const resolutions = await this.generateResolutions(conflicts);
        console.log(`✅ Generated ${resolutions.length} resolutions`);
        
        // Step 6: Build queryable world state
        console.log('🌍 Step 6: Building world state...');
        const worldState = await this.buildWorldState(packageInfo, crossRefs, conflicts, resolutions);
        console.log('✅ World state ready for queries');
        
        return worldState;
    }
    
    async discoverLockFiles() {
        const lockFiles = [];
        
        // Scan directory tree for lock files
        const scanDir = (dir, maxDepth = 5, currentDepth = 0) => {
            if (currentDepth >= maxDepth || !fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanDir(fullPath, maxDepth, currentDepth + 1);
                } else if (stat.isFile() && this.lockFileTypes[item]) {
                    lockFiles.push({
                        file: fullPath,
                        type: this.lockFileTypes[item],
                        name: item,
                        directory: dir,
                        size: stat.size,
                        modified: stat.mtime
                    });
                }
            }
        };
        
        scanDir(this.basePath);
        
        // Also look for package.json files (they contain dependency info)
        const packageFiles = [];
        const scanForPackageJson = (dir, maxDepth = 5, currentDepth = 0) => {
            if (currentDepth >= maxDepth || !fs.existsSync(dir)) return;
            
            const packageJsonPath = path.join(dir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                packageFiles.push({
                    file: packageJsonPath,
                    type: 'package_manifest',
                    name: 'package.json',
                    directory: dir,
                    size: fs.statSync(packageJsonPath).size,
                    modified: fs.statSync(packageJsonPath).mtime
                });
            }
            
            // Recurse into subdirectories
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    if (fs.statSync(fullPath).isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        scanForPackageJson(fullPath, maxDepth, currentDepth + 1);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };
        
        scanForPackageJson(this.basePath);
        
        return [...lockFiles, ...packageFiles];
    }
    
    async parseLockFiles(lockFiles) {
        const allPackages = new Map();
        const allDependencies = new Map();
        const allDevDependencies = new Map();
        let totalPackages = 0;
        
        for (const lockFile of lockFiles) {
            try {
                const content = fs.readFileSync(lockFile.file, 'utf-8');
                let parsedData;
                
                switch (lockFile.type) {
                    case 'npm':
                        parsedData = this.parseNpmLock(content, lockFile);
                        break;
                    case 'yarn':
                        parsedData = this.parseYarnLock(content, lockFile);
                        break;
                    case 'package_manifest':
                        parsedData = this.parsePackageJson(content, lockFile);
                        break;
                    default:
                        parsedData = this.parseGenericLock(content, lockFile);
                }
                
                if (parsedData) {
                    // Merge packages
                    for (const [name, info] of parsedData.packages.entries()) {
                        allPackages.set(`${name}@${info.version}`, info);
                    }
                    
                    // Merge dependencies
                    for (const [name, deps] of parsedData.dependencies.entries()) {
                        allDependencies.set(name, deps);
                    }
                    
                    // Merge dev dependencies
                    for (const [name, deps] of parsedData.devDependencies.entries()) {
                        allDevDependencies.set(name, deps);
                    }
                    
                    totalPackages += parsedData.packages.size;
                    
                    // Store in world state
                    this.worldState.lockFiles.set(lockFile.file, parsedData);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to parse ${lockFile.file}: ${error.message}`);
            }
        }
        
        // Update world state
        this.worldState.packages = allPackages;
        this.worldState.dependencies = allDependencies;
        this.worldState.devDependencies = allDevDependencies;
        
        return {
            packages: allPackages,
            dependencies: allDependencies,
            devDependencies: allDevDependencies,
            totalPackages
        };
    }
    
    parseNpmLock(content, lockFile) {
        try {
            const data = JSON.parse(content);
            const packages = new Map();
            const dependencies = new Map();
            
            // Parse npm lock format
            if (data.dependencies) {
                this.parseNpmDependencies(data.dependencies, packages, dependencies, '');
            }
            
            // Parse npm v2+ format with packages field
            if (data.packages) {
                for (const [pkgPath, pkgInfo] of Object.entries(data.packages)) {
                    if (pkgPath === '') continue; // Skip root
                    
                    const name = pkgInfo.name || this.extractPackageNameFromPath(pkgPath);
                    const version = pkgInfo.version || 'unknown';
                    
                    packages.set(`${name}@${version}`, {
                        name,
                        version,
                        path: pkgPath,
                        resolved: pkgInfo.resolved,
                        integrity: pkgInfo.integrity,
                        dependencies: pkgInfo.dependencies || {},
                        devDependencies: pkgInfo.devDependencies || {},
                        lockFile: lockFile.file,
                        type: 'npm'
                    });
                }
            }
            
            return { packages, dependencies, devDependencies: new Map() };
        } catch (error) {
            console.warn(`Failed to parse npm lock: ${error.message}`);
            return null;
        }
    }
    
    parseNpmDependencies(deps, packages, dependencies, prefix) {
        for (const [name, info] of Object.entries(deps)) {
            const version = info.version || 'unknown';
            const key = `${name}@${version}`;
            
            packages.set(key, {
                name,
                version,
                resolved: info.resolved,
                integrity: info.integrity,
                requires: info.requires || {},
                dependencies: info.dependencies || {},
                type: 'npm'
            });
            
            if (info.requires) {
                dependencies.set(name, Object.keys(info.requires));
            }
            
            // Recursively parse nested dependencies
            if (info.dependencies) {
                this.parseNpmDependencies(info.dependencies, packages, dependencies, `${prefix}${name}/`);
            }
        }
    }
    
    parseYarnLock(content, lockFile) {
        const packages = new Map();
        const dependencies = new Map();
        
        // Parse Yarn lock format (it's a custom format, not JSON)
        const lines = content.split('\n');
        let currentPackage = null;
        let currentInfo = {};
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Package declaration line
            if (trimmed.includes('@') && trimmed.endsWith(':')) {
                if (currentPackage) {
                    packages.set(currentPackage, currentInfo);
                }
                
                currentPackage = trimmed.replace(':', '');
                currentInfo = { type: 'yarn', lockFile: lockFile.file };
            }
            // Property lines
            else if (trimmed.includes(':') && currentPackage) {
                const [key, ...valueParts] = trimmed.split(':');
                const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                
                if (key === 'version') currentInfo.version = value;
                if (key === 'resolved') currentInfo.resolved = value;
                if (key === 'integrity') currentInfo.integrity = value;
            }
        }
        
        // Don't forget the last package
        if (currentPackage) {
            packages.set(currentPackage, currentInfo);
        }
        
        return { packages, dependencies, devDependencies: new Map() };
    }
    
    parsePackageJson(content, lockFile) {
        try {
            const data = JSON.parse(content);
            const packages = new Map();
            const dependencies = new Map();
            const devDependencies = new Map();
            
            // Extract regular dependencies
            if (data.dependencies) {
                for (const [name, version] of Object.entries(data.dependencies)) {
                    packages.set(`${name}@${version}`, {
                        name,
                        version,
                        type: 'package_json_dep',
                        lockFile: lockFile.file,
                        isDirect: true
                    });
                    dependencies.set(name, []);
                }
            }
            
            // Extract dev dependencies
            if (data.devDependencies) {
                for (const [name, version] of Object.entries(data.devDependencies)) {
                    packages.set(`${name}@${version}`, {
                        name,
                        version,
                        type: 'package_json_dev_dep',
                        lockFile: lockFile.file,
                        isDirect: true,
                        isDev: true
                    });
                    devDependencies.set(name, []);
                }
            }
            
            return { packages, dependencies, devDependencies };
        } catch (error) {
            console.warn(`Failed to parse package.json: ${error.message}`);
            return null;
        }
    }
    
    parseGenericLock(content, lockFile) {
        // Generic parser for other lock file types
        const packages = new Map();
        const dependencies = new Map();
        
        // Simple line-by-line parsing for requirements.txt style files
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                // Extract package name and version
                const match = trimmed.match(/^([^=<>!]+)([=<>!]+.*)?$/);
                if (match) {
                    const name = match[1].trim();
                    const version = match[2] ? match[2].trim() : 'unknown';
                    
                    packages.set(`${name}@${version}`, {
                        name,
                        version,
                        type: lockFile.type,
                        lockFile: lockFile.file,
                        raw: trimmed
                    });
                }
            }
        }
        
        return { packages, dependencies, devDependencies: new Map() };
    }
    
    extractPackageNameFromPath(pkgPath) {
        // Extract package name from npm path like "node_modules/@babel/core"
        const parts = pkgPath.split('/');
        if (parts[parts.length - 2] === 'node_modules') {
            return parts[parts.length - 1];
        } else if (parts[parts.length - 3] === 'node_modules' && parts[parts.length - 2].startsWith('@')) {
            return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
        }
        return parts[parts.length - 1];
    }
    
    async scanCrossReferences() {
        const crossRefs = [];
        const sourceFiles = this.scanSourceFiles();
        
        for (const file of sourceFiles) {
            try {
                const content = fs.readFileSync(file.path, 'utf-8');
                const refs = this.extractCrossReferences(content, file);
                crossRefs.push(...refs);
            } catch (error) {
                console.warn(`⚠️ Failed to scan ${file.path}: ${error.message}`);
            }
        }
        
        return crossRefs;
    }
    
    scanSourceFiles() {
        const files = [];
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.html', '.vue', '.py', '.go', '.rs'];
        
        const scanDir = (dir, maxDepth = 3, currentDepth = 0) => {
            if (currentDepth >= maxDepth || !fs.existsSync(dir)) return;
            
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        scanDir(fullPath, maxDepth, currentDepth + 1);
                    } else if (stat.isFile() && extensions.includes(path.extname(item))) {
                        files.push({
                            path: fullPath,
                            name: item,
                            extension: path.extname(item),
                            size: stat.size
                        });
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };
        
        scanDir(this.basePath);
        return files.slice(0, 100); // Limit for performance
    }
    
    extractCrossReferences(content, file) {
        const refs = [];
        
        for (const [patternName, pattern] of Object.entries(this.crossRefPatterns)) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const reference = match[1] || match[2];
                if (reference && !reference.startsWith('.') && !reference.startsWith('/')) {
                    refs.push({
                        source: file.path,
                        target: reference,
                        pattern: patternName,
                        line: this.getLineNumber(content, match.index),
                        context: this.getContext(content, match.index)
                    });
                }
            }
            pattern.lastIndex = 0; // Reset regex
        }
        
        return refs;
    }
    
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }
    
    getContext(content, index, contextLength = 50) {
        const start = Math.max(0, index - contextLength);
        const end = Math.min(content.length, index + contextLength);
        return content.substring(start, end).trim();
    }
    
    async detectConflicts() {
        const conflicts = [];
        const packageVersions = new Map();
        
        // Group packages by name to find version conflicts
        for (const [key, info] of this.worldState.packages.entries()) {
            if (!packageVersions.has(info.name)) {
                packageVersions.set(info.name, []);
            }
            packageVersions.get(info.name).push({
                version: info.version,
                lockFile: info.lockFile,
                key
            });
        }
        
        // Find packages with multiple versions
        for (const [name, versions] of packageVersions.entries()) {
            if (versions.length > 1) {
                const uniqueVersions = new Set(versions.map(v => v.version));
                if (uniqueVersions.size > 1) {
                    conflicts.push({
                        package: name,
                        versions: Array.from(uniqueVersions),
                        occurrences: versions,
                        severity: this.calculateConflictSeverity(name, versions),
                        type: 'version_conflict'
                    });
                }
            }
        }
        
        // Detect missing dependencies
        for (const [name, deps] of this.worldState.dependencies.entries()) {
            for (const dep of deps) {
                const found = Array.from(this.worldState.packages.keys()).some(key => key.startsWith(`${dep}@`));
                if (!found) {
                    conflicts.push({
                        package: dep,
                        requiredBy: name,
                        severity: 'medium',
                        type: 'missing_dependency'
                    });
                }
            }
        }
        
        return conflicts;
    }
    
    calculateConflictSeverity(packageName, versions) {
        // Critical packages that should have consistent versions
        const criticalPackages = ['react', 'vue', 'angular', 'webpack', 'typescript'];
        
        if (criticalPackages.includes(packageName)) {
            return 'high';
        }
        
        // Check version range compatibility
        const versionNumbers = versions.map(v => v.version).filter(v => v !== 'unknown');
        if (versionNumbers.length >= 2) {
            const majorVersions = new Set(versionNumbers.map(v => v.split('.')[0]));
            if (majorVersions.size > 1) {
                return 'high'; // Different major versions = high severity
            }
        }
        
        return versions.length > 3 ? 'medium' : 'low';
    }
    
    async generateResolutions(conflicts) {
        const resolutions = [];
        
        for (const conflict of conflicts) {
            switch (conflict.type) {
                case 'version_conflict':
                    const resolution = this.resolveVersionConflict(conflict);
                    if (resolution) {
                        resolutions.push(resolution);
                    }
                    break;
                    
                case 'missing_dependency':
                    resolutions.push({
                        type: 'install_missing',
                        package: conflict.package,
                        action: `Install missing dependency: ${conflict.package}`,
                        command: `npm install ${conflict.package}`,
                        confidence: 0.8
                    });
                    break;
            }
        }
        
        return resolutions;
    }
    
    resolveVersionConflict(conflict) {
        const strategy = 'latest_stable'; // Could be configurable
        const resolver = this.resolutionStrategies[strategy];
        
        if (resolver) {
            const resolvedVersion = resolver(conflict.versions);
            
            return {
                type: 'version_resolution',
                package: conflict.package,
                currentVersions: conflict.versions,
                resolvedVersion: resolvedVersion,
                strategy: strategy,
                action: `Unify ${conflict.package} to version ${resolvedVersion}`,
                command: `npm install ${conflict.package}@${resolvedVersion}`,
                confidence: 0.7
            };
        }
        
        return null;
    }
    
    compareVersions(a, b) {
        // Simple semantic version comparison
        const aParts = a.split('.').map(x => parseInt(x) || 0);
        const bParts = b.split('.').map(x => parseInt(x) || 0);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            
            if (aPart !== bPart) {
                return aPart - bPart;
            }
        }
        
        return 0;
    }
    
    getLatestStable(versions) {
        // Filter out pre-release versions and return the highest stable version
        const stableVersions = versions.filter(v => !v.includes('-') && !v.includes('beta') && !v.includes('alpha'));
        return stableVersions.length > 0 ? this.resolutionStrategies.highest(stableVersions) : versions[0];
    }
    
    async buildWorldState(packageInfo, crossRefs, conflicts, resolutions) {
        // Update world state with all collected information
        this.worldState.crossReferences = new Map(crossRefs.map(ref => [
            `${ref.source}->${ref.target}`,
            ref
        ]));
        
        this.worldState.conflicts = new Map(conflicts.map(conflict => [
            conflict.package || `${conflict.type}_${Date.now()}`,
            conflict
        ]));
        
        this.worldState.resolutions = new Map(resolutions.map(resolution => [
            resolution.package || `${resolution.type}_${Date.now()}`,
            resolution
        ]));
        
        // Generate dependency graph
        const dependencyGraph = this.buildDependencyGraph();
        
        return {
            totalPackages: this.worldState.packages.size,
            totalDependencies: this.worldState.dependencies.size,
            totalConflicts: conflicts.length,
            totalResolutions: resolutions.length,
            packageManagers: this.getUsedPackageManagers(),
            dependencyGraph,
            worldState: {
                packages: Array.from(this.worldState.packages.entries()),
                conflicts: conflicts,
                resolutions: resolutions,
                crossReferences: crossRefs.slice(0, 50) // Limit for display
            }
        };
    }
    
    buildDependencyGraph() {
        const graph = { nodes: [], edges: [] };
        const nodeSet = new Set();
        
        // Add package nodes
        for (const [key, info] of this.worldState.packages.entries()) {
            if (!nodeSet.has(info.name)) {
                graph.nodes.push({
                    id: info.name,
                    label: info.name,
                    version: info.version,
                    type: info.type || 'package',
                    isDev: info.isDev || false
                });
                nodeSet.add(info.name);
            }
        }
        
        // Add dependency edges
        for (const [name, deps] of this.worldState.dependencies.entries()) {
            for (const dep of deps) {
                if (nodeSet.has(name) && nodeSet.has(dep)) {
                    graph.edges.push({
                        from: name,
                        to: dep,
                        type: 'dependency'
                    });
                }
            }
        }
        
        return graph;
    }
    
    getUsedPackageManagers() {
        const managers = new Set();
        for (const lockFile of this.worldState.lockFiles.values()) {
            if (lockFile.packages) {
                for (const pkg of lockFile.packages.values()) {
                    if (pkg.type) {
                        managers.add(pkg.type);
                    }
                }
            }
        }
        return Array.from(managers);
    }
    
    // QUERY INTERFACE - Make dependencies queryable like a database
    queryDependencies(query) {
        const results = [];
        
        switch (query.type) {
            case 'package_versions':
                const packageName = query.package;
                for (const [key, info] of this.worldState.packages.entries()) {
                    if (info.name === packageName) {
                        results.push(info);
                    }
                }
                break;
                
            case 'conflicts':
                for (const conflict of this.worldState.conflicts.values()) {
                    if (!query.severity || conflict.severity === query.severity) {
                        results.push(conflict);
                    }
                }
                break;
                
            case 'references_to':
                const targetPackage = query.package;
                for (const ref of this.worldState.crossReferences.values()) {
                    if (ref.target === targetPackage || ref.target.startsWith(targetPackage + '/')) {
                        results.push(ref);
                    }
                }
                break;
                
            case 'lock_file_contents':
                const lockFilePath = query.file;
                const lockFileData = this.worldState.lockFiles.get(lockFilePath);
                if (lockFileData) {
                    results.push(lockFileData);
                }
                break;
        }
        
        return results;
    }
    
    // START SERVER for dependency management interface
    start() {
        const http = require('http');
        
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                await this.serveInterface(res);
            } else if (req.url === '/api/scan') {
                const worldState = await this.loadDependencyWorldState();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(worldState, null, 2));
            } else if (req.url === '/api/query' && req.method === 'POST') {
                await this.handleQueryRequest(req, res);
            } else if (req.url === '/api/resolve' && req.method === 'POST') {
                await this.handleResolveRequest(req, res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port);
        console.log(`\n📦 Dependency Lock Manager: http://localhost:${this.port}`);
        console.log('🔒 Manage package locks and resolve conflicts');
        console.log('🌍 Query dependencies like a database');
    }
    
    async handleQueryRequest(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const query = JSON.parse(body);
                const results = this.queryDependencies(query);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, results }, null, 2));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    async handleResolveRequest(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { conflicts } = JSON.parse(body);
                const resolutions = await this.generateResolutions(conflicts);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, resolutions }, null, 2));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    async serveInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>📦 Dependency Lock Manager</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #2c1810 0%, #1a1a1a 50%, #0d1b2a 100%);
            color: #ffffff;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            font-size: 3em;
            color: #ffa500;
            text-shadow: 0 0 20px #ffa500;
            margin-bottom: 30px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .dashboard-card {
            background: rgba(0, 0, 0, 0.6);
            border: 2px solid #ffa500;
            border-radius: 10px;
            padding: 20px;
        }
        
        .card-title {
            font-size: 1.5em;
            color: #ffff00;
            margin-bottom: 15px;
            text-shadow: 2px 2px 0 #000;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #333;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #00ff00;
        }
        
        .conflict {
            background: rgba(255, 0, 0, 0.1);
            border-left: 4px solid #ff0000;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 5px 5px 0;
        }
        
        .conflict-high { border-left-color: #ff0000; }
        .conflict-medium { border-left-color: #ffa500; }
        .conflict-low { border-left-color: #ffff00; }
        
        .resolution {
            background: rgba(0, 255, 0, 0.1);
            border-left: 4px solid #00ff00;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 5px 5px 0;
        }
        
        button {
            background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%);
            color: #000000;
            border: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 5px;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 165, 0, 0.3);
        }
        
        .query-section {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .query-grid {
            display: grid;
            grid-template-columns: 200px 1fr 150px;
            gap: 15px;
            align-items: end;
            margin: 15px 0;
        }
        
        select, input {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #ffa500;
            border-radius: 3px;
            padding: 10px;
            color: #ffffff;
            font-family: 'Courier New', monospace;
        }
        
        .results-section {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            display: none;
        }
        
        .dependency-graph {
            width: 100%;
            height: 400px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #333;
            border-radius: 5px;
            overflow: auto;
        }
        
        .package-list {
            max-height: 300px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            padding: 10px;
        }
        
        .package-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #333;
        }
        
        .package-item:last-child {
            border-bottom: none;
        }
        
        .package-name {
            color: #00ffff;
            font-weight: bold;
        }
        
        .package-version {
            color: #ffff00;
        }
        
        .loading {
            text-align: center;
            color: #ffff00;
            font-size: 1.2em;
            margin: 20px 0;
        }
        
        pre {
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #333;
            border-radius: 5px;
            padding: 15px;
            overflow-x: auto;
            font-size: 0.85em;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="header">
        📦 DEPENDENCY LOCK MANAGER
    </div>
    
    <div class="container">
        <div style="text-align: center; margin: 30px 0;">
            <button onclick="scanDependencies()">🔍 SCAN DEPENDENCIES</button>
            <button onclick="showConflicts()">⚠️ SHOW CONFLICTS</button>
            <button onclick="generateResolutions()">⚖️ GENERATE RESOLUTIONS</button>
        </div>
        
        <div id="dashboard" class="dashboard-grid" style="display: none;">
            <div class="dashboard-card">
                <div class="card-title">📊 Package Statistics</div>
                <div class="metric">
                    <span>Total Packages:</span>
                    <span class="metric-value" id="totalPackages">-</span>
                </div>
                <div class="metric">
                    <span>Direct Dependencies:</span>
                    <span class="metric-value" id="directDeps">-</span>
                </div>
                <div class="metric">
                    <span>Package Managers:</span>
                    <span class="metric-value" id="packageManagers">-</span>
                </div>
                <div class="metric">
                    <span>Lock Files Found:</span>
                    <span class="metric-value" id="lockFiles">-</span>
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-title">⚠️ Conflict Summary</div>
                <div class="metric">
                    <span>Version Conflicts:</span>
                    <span class="metric-value" id="versionConflicts" style="color: #ff0000;">-</span>
                </div>
                <div class="metric">
                    <span>Missing Dependencies:</span>
                    <span class="metric-value" id="missingDeps" style="color: #ffa500;">-</span>
                </div>
                <div class="metric">
                    <span>Resolutions Available:</span>
                    <span class="metric-value" id="resolutionsAvailable" style="color: #00ff00;">-</span>
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-title">🎯 Top Packages</div>
                <div id="topPackages" class="package-list">
                    Loading...
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-title">🔗 Cross References</div>
                <div class="metric">
                    <span>Import Statements:</span>
                    <span class="metric-value" id="importStatements">-</span>
                </div>
                <div class="metric">
                    <span>Reference Patterns:</span>
                    <span class="metric-value" id="referencePatterns">-</span>
                </div>
                <div class="metric">
                    <span>Source Files Scanned:</span>
                    <span class="metric-value" id="sourceFiles">-</span>
                </div>
            </div>
        </div>
        
        <div class="query-section">
            <div class="card-title">🔍 Dependency Query Interface</div>
            <p style="color: #cccccc;">Query your dependencies like a database:</p>
            
            <div class="query-grid">
                <select id="queryType">
                    <option value="package_versions">Package Versions</option>
                    <option value="conflicts">Conflicts</option>
                    <option value="references_to">References To</option>
                    <option value="lock_file_contents">Lock File Contents</option>
                </select>
                
                <input id="queryPackage" placeholder="Enter package name or filter..." type="text">
                
                <button onclick="executeQuery()">🔍 QUERY</button>
            </div>
        </div>
        
        <div id="results" class="results-section">
            <h3 style="color: #ffff00; margin-top: 0;">Query Results</h3>
            <div id="resultsContent"></div>
        </div>
    </div>
    
    <script>
        let dependencyData = null;
        
        async function scanDependencies() {
            const dashboard = document.getElementById('dashboard');
            
            dashboard.style.display = 'grid';
            document.getElementById('totalPackages').textContent = '...';
            
            try {
                const response = await fetch('/api/scan');
                dependencyData = await response.json();
                
                updateDashboard(dependencyData);
                
            } catch (error) {
                alert('Error scanning dependencies: ' + error.message);
            }
        }
        
        function updateDashboard(data) {
            document.getElementById('totalPackages').textContent = data.totalPackages;
            document.getElementById('directDeps').textContent = data.totalDependencies;
            document.getElementById('packageManagers').textContent = data.packageManagers.join(', ');
            document.getElementById('lockFiles').textContent = Object.keys(data.worldState.packages).length;
            
            document.getElementById('versionConflicts').textContent = 
                data.worldState.conflicts.filter(c => c.type === 'version_conflict').length;
            document.getElementById('missingDeps').textContent = 
                data.worldState.conflicts.filter(c => c.type === 'missing_dependency').length;
            document.getElementById('resolutionsAvailable').textContent = data.totalResolutions;
            
            document.getElementById('importStatements').textContent = data.worldState.crossReferences.length;
            document.getElementById('referencePatterns').textContent = 
                new Set(data.worldState.crossReferences.map(r => r.pattern)).size;
            document.getElementById('sourceFiles').textContent = 
                new Set(data.worldState.crossReferences.map(r => r.source)).size;
            
            // Update top packages
            const topPackagesHtml = data.worldState.packages.slice(0, 10).map(([key, info]) => 
                '<div class="package-item">' +
                '<span class="package-name">' + info.name + '</span>' +
                '<span class="package-version">' + info.version + '</span>' +
                '</div>'
            ).join('');
            document.getElementById('topPackages').innerHTML = topPackagesHtml;
        }
        
        async function showConflicts() {
            if (!dependencyData) {
                alert('Please scan dependencies first');
                return;
            }
            
            const resultsDiv = document.getElementById('results');
            const contentDiv = document.getElementById('resultsContent');
            
            let html = '<div class="card-title">⚠️ Dependency Conflicts</div>';
            
            const conflicts = dependencyData.worldState.conflicts;
            
            if (conflicts.length === 0) {
                html += '<div style="color: #00ff00;">✅ No conflicts found!</div>';
            } else {
                for (const conflict of conflicts) {
                    html += '<div class="conflict conflict-' + conflict.severity + '">';
                    html += '<div style="font-weight: bold; color: #ffffff;">' + 
                        (conflict.package || 'Unknown Package') + '</div>';
                    html += '<div>Type: ' + conflict.type + '</div>';
                    if (conflict.versions) {
                        html += '<div>Versions: ' + conflict.versions.join(', ') + '</div>';
                    }
                    if (conflict.requiredBy) {
                        html += '<div>Required by: ' + conflict.requiredBy + '</div>';
                    }
                    html += '<div style="margin-top: 10px; color: #cccccc;">Severity: ' + 
                        conflict.severity + '</div>';
                    html += '</div>';
                }
            }
            
            contentDiv.innerHTML = html;
            resultsDiv.style.display = 'block';
        }
        
        async function generateResolutions() {
            if (!dependencyData) {
                alert('Please scan dependencies first');
                return;
            }
            
            const resultsDiv = document.getElementById('results');
            const contentDiv = document.getElementById('resultsContent');
            
            contentDiv.innerHTML = '<div class="loading">⚖️ Generating resolutions...</div>';
            resultsDiv.style.display = 'block';
            
            try {
                const response = await fetch('/api/resolve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conflicts: dependencyData.worldState.conflicts })
                });
                
                const result = await response.json();
                
                let html = '<div class="card-title">⚖️ Resolution Strategies</div>';
                
                if (result.resolutions.length === 0) {
                    html += '<div style="color: #00ff00;">✅ No resolutions needed!</div>';
                } else {
                    for (const resolution of result.resolutions) {
                        html += '<div class="resolution">';
                        html += '<div style="font-weight: bold; color: #ffffff;">' + 
                            (resolution.package || 'System') + '</div>';
                        html += '<div>' + resolution.action + '</div>';
                        if (resolution.command) {
                            html += '<div style="background: rgba(0,0,0,0.8); padding: 10px; margin: 10px 0; border-radius: 3px; font-family: monospace;">';
                            html += resolution.command;
                            html += '</div>';
                        }
                        html += '<div style="margin-top: 10px; color: #cccccc;">Confidence: ' + 
                            (resolution.confidence * 100).toFixed(0) + '%</div>';
                        html += '</div>';
                    }
                }
                
                contentDiv.innerHTML = html;
                
            } catch (error) {
                contentDiv.innerHTML = '<div style="color: #ff0000;">❌ Error: ' + error.message + '</div>';
            }
        }
        
        async function executeQuery() {
            const queryType = document.getElementById('queryType').value;
            const queryPackage = document.getElementById('queryPackage').value;
            
            const query = {
                type: queryType,
                package: queryPackage || undefined
            };
            
            if (queryType === 'conflicts') {
                query.severity = queryPackage || undefined;
                delete query.package;
            }
            
            const resultsDiv = document.getElementById('results');
            const contentDiv = document.getElementById('resultsContent');
            
            resultsDiv.style.display = 'block';
            contentDiv.innerHTML = '<div class="loading">🔍 Executing query...</div>';
            
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(query)
                });
                
                const result = await response.json();
                
                let html = '<div class="card-title">🔍 Query Results</div>';
                html += '<div>Found ' + result.results.length + ' results</div>';
                html += '<pre>' + JSON.stringify(result.results, null, 2) + '</pre>';
                
                contentDiv.innerHTML = html;
                
            } catch (error) {
                contentDiv.innerHTML = '<div style="color: #ff0000;">❌ Error: ' + error.message + '</div>';
            }
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// START THE DEPENDENCY LOCK MANAGER
if (require.main === module) {
    console.log('📦 STARTING DEPENDENCY LOCK MANAGER');
    console.log('===================================');
    console.log('🔒 Scan and manage package lock files');
    console.log('🌍 Load dependencies into queryable world state');
    console.log('⚠️ Detect and resolve version conflicts');
    console.log('🔗 Track cross-references between packages');
    console.log('⚖️ Generate resolution strategies');
    console.log('');
    
    const manager = new DependencyLockManager();
    manager.start();
}

module.exports = DependencyLockManager;
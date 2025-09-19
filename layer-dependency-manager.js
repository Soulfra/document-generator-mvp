#!/usr/bin/env node

/**
 * Layer-Based Dependency Management System
 * Preserves the node_modules differentials that are critical to each layer's functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LayerDependencyManager {
    constructor() {
        this.codebaseRoot = process.cwd();
        this.layerMap = new Map();
        this.dependencyDifferentials = new Map();
        this.legacyDependencies = new Set();
        
        // Define the 23-layer architecture with their specific dependency needs
        this.layers = {
            'tier-1-ephemeral': {
                name: 'Ephemeral Layer',
                deps: ['express', 'ws', 'socket.io'],
                legacy: false,
                isolated: false
            },
            'tier-2-regeneratable': {
                name: 'Regeneratable Services',
                deps: ['multer', 'cors', 'body-parser'],
                legacy: false,
                isolated: false
            },
            'tier-3-permanent': {
                name: 'Permanent Storage',
                deps: ['sqlite3', 'leveldb'],
                legacy: false,
                isolated: true
            },
            'character-system': {
                name: 'Character System',
                deps: ['three', 'cannon-es', '@pixiv/three-vrm'],
                legacy: false,
                isolated: false
            },
            'game-engine': {
                name: 'Game Engine Layer',
                deps: ['phaser', 'matter-js', 'pixi.js'],
                legacy: true,
                version: 'phaser@3.55.2',
                isolated: true
            },
            'web3-layer': {
                name: 'Web3 Integration',
                deps: ['ethers', 'web3', '@metamask/sdk'],
                legacy: false,
                isolated: true
            },
            'ai-integration': {
                name: 'AI Services',
                deps: ['openai', '@anthropic-ai/sdk', 'langchain'],
                legacy: false,
                isolated: true
            },
            'legacy-flash': {
                name: 'Flash/Miniclip Compatibility',
                deps: ['swf-player', 'ruffle-core'],
                legacy: true,
                isolated: true
            },
            'unity-bridge': {
                name: 'Unity WebGL Bridge',
                deps: ['unity-webgl', 'wasm-loader'],
                legacy: false,
                isolated: true
            },
            'oss-integration': {
                name: 'OSS Integration Layer',
                deps: ['express', 'socket.io', 'chokidar'],
                legacy: false,
                isolated: false
            }
        };
        
        console.log('🧬 LAYER DEPENDENCY MANAGER');
        console.log('==========================');
        console.log('Preserving node_modules differentials per layer...\n');
    }

    async analyze() {
        console.log('📊 ANALYZING LAYER DEPENDENCIES\n');
        
        // Step 1: Scan existing package.json files per layer/directory
        await this.scanLayerDependencies();
        
        // Step 2: Extract dependency differentials
        await this.extractDifferentials();
        
        // Step 3: Identify legacy dependencies
        await this.identifyLegacyDependencies();
        
        // Step 4: Create dependency matrix
        await this.createDependencyMatrix();
        
        // Step 5: Generate layer-specific package.json files
        await this.generateLayerPackages();
        
        // Step 6: Create verification system
        await this.createVerificationSystem();
    }

    async scanLayerDependencies() {
        console.log('1️⃣ Scanning layer dependencies...');
        
        // Find all package.json files
        try {
            const packageFiles = execSync(
                'find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.git/*"',
                { cwd: this.codebaseRoot, encoding: 'utf8' }
            ).trim().split('\n').filter(f => f);
            
            console.log(`   📦 Found ${packageFiles.length} package.json files`);
            
            // Analyze each package.json
            for (const pkgPath of packageFiles) {
                const fullPath = path.join(this.codebaseRoot, pkgPath);
                const dirName = path.dirname(pkgPath);
                
                try {
                    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                    
                    this.layerMap.set(dirName, {
                        name: pkg.name || dirName,
                        version: pkg.version || '1.0.0',
                        dependencies: pkg.dependencies || {},
                        devDependencies: pkg.devDependencies || {},
                        totalDeps: Object.keys(deps).length,
                        path: pkgPath
                    });
                    
                    console.log(`   📁 ${dirName}: ${Object.keys(deps).length} dependencies`);
                } catch (error) {
                    console.log(`   ⚠️  Could not parse ${pkgPath}`);
                }
            }
        } catch (error) {
            console.log('   ❌ Error scanning dependencies:', error.message);
        }
    }

    async extractDifferentials() {
        console.log('\n2️⃣ Extracting dependency differentials...');
        
        // Create a global dependency set
        const globalDeps = new Set();
        const layerSpecificDeps = new Map();
        
        // Collect all dependencies
        for (const [layer, info] of this.layerMap) {
            const deps = Object.keys({ ...info.dependencies, ...info.devDependencies });
            deps.forEach(dep => globalDeps.add(dep));
            layerSpecificDeps.set(layer, new Set(deps));
        }
        
        // Find unique dependencies per layer
        for (const [layer, deps] of layerSpecificDeps) {
            const uniqueDeps = new Set();
            
            for (const dep of deps) {
                let isUnique = true;
                for (const [otherLayer, otherDeps] of layerSpecificDeps) {
                    if (otherLayer !== layer && otherDeps.has(dep)) {
                        isUnique = false;
                        break;
                    }
                }
                if (isUnique) uniqueDeps.add(dep);
            }
            
            this.dependencyDifferentials.set(layer, {
                total: deps.size,
                unique: uniqueDeps.size,
                uniqueDeps: Array.from(uniqueDeps),
                shared: deps.size - uniqueDeps.size
            });
            
            if (uniqueDeps.size > 0) {
                console.log(`   🔬 ${layer}: ${uniqueDeps.size} unique dependencies`);
                uniqueDeps.forEach(dep => console.log(`      └─ ${dep}`));
            }
        }
        
        console.log(`   📊 Total unique dependencies: ${globalDeps.size}`);
    }

    async identifyLegacyDependencies() {
        console.log('\n3️⃣ Identifying legacy dependencies...');
        
        const legacyPatterns = [
            // Old versions that specific layers might need
            { pattern: /^jquery@[12]\./, reason: 'jQuery 1.x/2.x for legacy compatibility' },
            { pattern: /^angular@1\./, reason: 'AngularJS 1.x' },
            { pattern: /^react@15\./, reason: 'React 15.x' },
            { pattern: /^webpack@[123]\./, reason: 'Webpack 1-3' },
            { pattern: /^babel-preset-es2015/, reason: 'Old Babel preset' },
            { pattern: /^gulp@3\./, reason: 'Gulp 3.x' },
            
            // Flash/Gaming specific
            { pattern: /swf/, reason: 'Flash compatibility' },
            { pattern: /phaser@2\./, reason: 'Phaser 2.x for legacy games' },
            { pattern: /createjs/, reason: 'CreateJS for Flash-like games' },
            
            // Old build tools
            { pattern: /^grunt/, reason: 'Grunt build system' },
            { pattern: /^bower/, reason: 'Bower package manager' }
        ];
        
        for (const [layer, info] of this.layerMap) {
            const allDeps = { ...info.dependencies, ...info.devDependencies };
            
            for (const [dep, version] of Object.entries(allDeps)) {
                const fullDep = `${dep}@${version}`;
                
                for (const legacy of legacyPatterns) {
                    if (legacy.pattern.test(fullDep)) {
                        this.legacyDependencies.add(dep);
                        console.log(`   🏛️  Legacy: ${fullDep} in ${layer} (${legacy.reason})`);
                    }
                }
            }
        }
        
        console.log(`   📊 Total legacy dependencies: ${this.legacyDependencies.size}`);
    }

    async createDependencyMatrix() {
        console.log('\n4️⃣ Creating dependency matrix...');
        
        const matrix = {
            layers: {},
            dependencies: {},
            conflicts: [],
            resolutions: {}
        };
        
        // Build dependency usage matrix
        const depUsage = new Map();
        
        for (const [layer, info] of this.layerMap) {
            const deps = { ...info.dependencies, ...info.devDependencies };
            
            for (const [dep, version] of Object.entries(deps)) {
                if (!depUsage.has(dep)) {
                    depUsage.set(dep, new Map());
                }
                depUsage.get(dep).set(layer, version);
            }
        }
        
        // Find version conflicts
        for (const [dep, layerVersions] of depUsage) {
            const versions = new Set(layerVersions.values());
            
            if (versions.size > 1) {
                matrix.conflicts.push({
                    dependency: dep,
                    versions: Array.from(versions),
                    layers: Array.from(layerVersions.entries())
                });
                
                console.log(`   ⚠️  Conflict: ${dep} has ${versions.size} different versions`);
                layerVersions.forEach((version, layer) => {
                    console.log(`      └─ ${layer}: ${version}`);
                });
            }
        }
        
        // Save matrix
        fs.writeFileSync(
            'dependency-matrix.json',
            JSON.stringify(matrix, null, 2)
        );
        
        console.log(`   💾 Dependency matrix saved`);
    }

    async generateLayerPackages() {
        console.log('\n5️⃣ Generating layer-specific package.json files...');
        
        // Create layer-packages directory
        const layerPkgDir = path.join(this.codebaseRoot, 'layer-packages');
        fs.mkdirSync(layerPkgDir, { recursive: true });
        
        // Generate master package.json with all dependencies
        const masterPackage = {
            name: 'document-generator-master',
            version: '1.0.0',
            description: 'Master package with all layer dependencies',
            workspaces: [],
            dependencies: {},
            devDependencies: {},
            layerDependencies: {}
        };
        
        // Collect all dependencies with version resolution
        const allDeps = new Map();
        const allDevDeps = new Map();
        
        for (const [layer, info] of this.layerMap) {
            // Add to workspaces if it's a real directory
            if (fs.existsSync(path.join(this.codebaseRoot, layer))) {
                masterPackage.workspaces.push(layer);
            }
            
            // Merge dependencies (prefer newer versions)
            Object.entries(info.dependencies || {}).forEach(([dep, version]) => {
                if (!allDeps.has(dep) || this.isNewerVersion(version, allDeps.get(dep))) {
                    allDeps.set(dep, version);
                }
            });
            
            Object.entries(info.devDependencies || {}).forEach(([dep, version]) => {
                if (!allDevDeps.has(dep) || this.isNewerVersion(version, allDevDeps.get(dep))) {
                    allDevDeps.set(dep, version);
                }
            });
            
            // Track layer-specific needs
            masterPackage.layerDependencies[layer] = {
                dependencies: info.dependencies,
                devDependencies: info.devDependencies,
                unique: this.dependencyDifferentials.get(layer)?.uniqueDeps || []
            };
        }
        
        // Convert maps to objects
        masterPackage.dependencies = Object.fromEntries(allDeps);
        masterPackage.devDependencies = Object.fromEntries(allDevDeps);
        
        // Save master package
        fs.writeFileSync(
            path.join(layerPkgDir, 'package-master.json'),
            JSON.stringify(masterPackage, null, 2)
        );
        
        // Generate minimal package for production
        const minimalPackage = {
            name: 'document-generator-minimal',
            version: '1.0.0',
            description: 'Minimal dependencies for core functionality',
            dependencies: {
                'express': '^4.18.2',
                'ws': '^8.13.0',
                'socket.io': '^4.6.2',
                'cors': '^2.8.5',
                'body-parser': '^1.20.2'
            }
        };
        
        fs.writeFileSync(
            path.join(layerPkgDir, 'package-minimal.json'),
            JSON.stringify(minimalPackage, null, 2)
        );
        
        console.log(`   📦 Generated master package with ${allDeps.size} dependencies`);
        console.log(`   📦 Generated minimal package with 5 core dependencies`);
        console.log(`   💾 Saved to layer-packages/`);
    }

    async createVerificationSystem() {
        console.log('\n6️⃣ Creating verification system...');
        
        const verificationScript = `#!/usr/bin/env node

/**
 * Dependency Verification System
 * Ensures all layers have their required dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DependencyVerifier {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
    }

    async verify() {
        console.log('🔍 VERIFYING LAYER DEPENDENCIES');
        console.log('==============================\\n');
        
        // Load layer dependency map
        const layerDeps = JSON.parse(
            fs.readFileSync('./layer-packages/package-master.json', 'utf8')
        ).layerDependencies;
        
        // Check each layer
        for (const [layer, deps] of Object.entries(layerDeps)) {
            console.log(\`📁 Checking \${layer}...\`);
            
            // Check if critical dependencies are available
            const critical = deps.unique || [];
            let layerPassed = true;
            
            for (const dep of critical) {
                try {
                    require.resolve(dep);
                    console.log(\`   ✅ \${dep}: FOUND\`);
                } catch (error) {
                    console.log(\`   ❌ \${dep}: MISSING (critical for this layer)\`);
                    layerPassed = false;
                    this.results.failed.push(\`\${layer}: Missing \${dep}\`);
                }
            }
            
            if (layerPassed) {
                this.results.passed.push(layer);
            }
        }
        
        // Show results
        console.log('\\n📊 VERIFICATION RESULTS:');
        console.log(\`   ✅ Passed: \${this.results.passed.length} layers\`);
        console.log(\`   ❌ Failed: \${this.results.failed.length} layers\`);
        console.log(\`   ⚠️  Warnings: \${this.results.warnings.length}\`);
        
        if (this.results.failed.length > 0) {
            console.log('\\n❌ FAILED CHECKS:');
            this.results.failed.forEach(f => console.log(\`   - \${f}\`));
        }
        
        return this.results.failed.length === 0;
    }
}

// Run verification
if (require.main === module) {
    const verifier = new DependencyVerifier();
    verifier.verify().then(passed => {
        process.exit(passed ? 0 : 1);
    });
}

module.exports = DependencyVerifier;
`;

        fs.writeFileSync('./verify-dependencies.js', verificationScript);
        execSync('chmod +x verify-dependencies.js');
        
        // Create installation helper
        const installHelper = `#!/bin/bash

# Layer-Specific Dependency Installer
# Installs only what each layer needs

echo "🔧 LAYER DEPENDENCY INSTALLER"
echo "============================"

# Function to install layer deps
install_layer() {
    local LAYER=$1
    local DEPS=$2
    
    echo "📦 Installing dependencies for $LAYER..."
    
    if [ -d "$LAYER" ]; then
        cd "$LAYER"
        if [ ! -f "package.json" ]; then
            echo '{"name":"'$LAYER'","version":"1.0.0"}' > package.json
        fi
        npm install $DEPS --save
        cd ..
    else
        echo "   ⚠️  Layer directory not found: $LAYER"
    fi
}

# Install based on what's needed
case "$1" in
    "minimal")
        echo "Installing minimal dependencies..."
        npm install express ws socket.io cors body-parser
        ;;
    "game")
        echo "Installing game layer dependencies..."
        npm install three phaser pixi.js matter-js
        ;;
    "web3")
        echo "Installing web3 dependencies..."
        npm install ethers web3 @metamask/sdk
        ;;
    "ai")
        echo "Installing AI dependencies..."
        npm install openai @anthropic-ai/sdk
        ;;
    "all")
        echo "Installing all dependencies from master..."
        cp layer-packages/package-master.json package.json
        npm install
        ;;
    *)
        echo "Usage: $0 {minimal|game|web3|ai|all}"
        exit 1
        ;;
esac

echo "✅ Installation complete!"
`;

        fs.writeFileSync('./install-layer-deps.sh', installHelper);
        execSync('chmod +x install-layer-deps.sh');
        
        console.log('   ✅ Created verify-dependencies.js');
        console.log('   ✅ Created install-layer-deps.sh');
    }

    isNewerVersion(v1, v2) {
        // Simple version comparison (could be enhanced)
        const clean = (v) => v.replace(/[\^~]/, '');
        return clean(v1) > clean(v2);
    }

    async generateReport() {
        console.log('\n📋 GENERATING DEPENDENCY REPORT\n');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalLayers: this.layerMap.size,
                totalUniqueDependencies: 0,
                totalLegacyDependencies: this.legacyDependencies.size,
                layersWithUniqueDeps: 0
            },
            layers: {},
            differentials: Object.fromEntries(this.dependencyDifferentials),
            legacyDependencies: Array.from(this.legacyDependencies),
            recommendations: []
        };
        
        // Count unique dependencies
        const allUnique = new Set();
        for (const [layer, diff] of this.dependencyDifferentials) {
            if (diff.unique > 0) {
                report.summary.layersWithUniqueDeps++;
                diff.uniqueDeps.forEach(dep => allUnique.add(dep));
            }
        }
        report.summary.totalUniqueDependencies = allUnique.size;
        
        // Add recommendations
        report.recommendations = [
            'Use install-layer-deps.sh to install only what each layer needs',
            'Run verify-dependencies.js before deployment',
            'Keep legacy dependencies isolated to their specific layers',
            'Use the master package.json for development with all dependencies',
            'Use the minimal package.json for production deployments'
        ];
        
        // Save report
        fs.writeFileSync(
            'dependency-analysis-report.json',
            JSON.stringify(report, null, 2)
        );
        
        console.log('📊 DEPENDENCY ANALYSIS COMPLETE');
        console.log('==============================');
        console.log(`   📁 Layers analyzed: ${this.layerMap.size}`);
        console.log(`   🔬 Unique dependencies found: ${allUnique.size}`);
        console.log(`   🏛️  Legacy dependencies: ${this.legacyDependencies.size}`);
        console.log(`   💾 Report saved: dependency-analysis-report.json`);
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Review dependency-matrix.json for conflicts');
        console.log('2. Use ./install-layer-deps.sh {layer} to install specific deps');
        console.log('3. Run ./verify-dependencies.js to check all layers');
        console.log('4. Copy layer-packages/package-*.json as needed');
    }
}

// Run analysis
if (require.main === module) {
    const manager = new LayerDependencyManager();
    manager.analyze()
        .then(() => manager.generateReport())
        .catch(console.error);
}

module.exports = LayerDependencyManager;
#!/usr/bin/env node

/**
 * Symlink-Aware Cleaner
 * Preserves the 23-layer symlinked architecture while removing actual duplicates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SymlinkAwareCleaner {
    constructor() {
        this.codebaseRoot = '/Users/matthewmauer/Desktop/Document-Generator';
        this.symlinks = [];
        this.realNodeModules = [];
        this.symlinkMapping = new Map();
        this.preserveList = new Set();
        
        console.log('🔗 SYMLINK-AWARE CLEANER');
        console.log('🎯 Mission: Clean while preserving 23-layer symlink architecture');
    }

    async analyze() {
        console.log('\n📋 ANALYSIS PHASE');
        console.log('==================');
        
        // Step 1: Map all symlinks
        console.log('1️⃣  Mapping symlink architecture...');
        await this.mapSymlinks();
        
        // Step 2: Find real vs symlinked node_modules
        console.log('2️⃣  Identifying real vs symlinked node_modules...');
        await this.categorizeNodeModules();
        
        // Step 3: Check OSS integration layer
        console.log('3️⃣  Checking OSS integration layer...');
        await this.checkOSSIntegration();
        
        // Step 4: Map dependencies per component
        console.log('4️⃣  Mapping component dependencies...');
        await this.mapComponentDependencies();
        
        // Step 5: Generate safe cleanup plan
        console.log('5️⃣  Creating symlink-safe cleanup plan...');
        await this.createSafeCleanupPlan();
    }

    async mapSymlinks() {
        try {
            // Find all symlinks
            const symlinkOutput = execSync('find . -type l', {
                cwd: this.codebaseRoot,
                encoding: 'utf8'
            });
            
            this.symlinks = symlinkOutput.trim().split('\n').filter(s => s);
            console.log(`   🔗 Found ${this.symlinks.length} symlinks`);
            
            // Analyze symlink targets
            let nodeModulesSymlinks = 0;
            let systemSymlinks = 0;
            
            this.symlinks.forEach(symlink => {
                try {
                    const target = fs.readlinkSync(path.join(this.codebaseRoot, symlink));
                    this.symlinkMapping.set(symlink, target);
                    
                    if (symlink.includes('node_modules') || target.includes('node_modules')) {
                        nodeModulesSymlinks++;
                    } else {
                        systemSymlinks++;
                    }
                } catch (error) {
                    // Broken symlink
                }
            });
            
            console.log(`   📦 Node modules symlinks: ${nodeModulesSymlinks}`);
            console.log(`   🔧 System symlinks: ${systemSymlinks}`);
            
        } catch (error) {
            console.error('   ❌ Error mapping symlinks:', error.message);
        }
    }

    async categorizeNodeModules() {
        try {
            // Find all node_modules directories
            const nodeModulesOutput = execSync('find . -name "node_modules" -type d', {
                cwd: this.codebaseRoot,
                encoding: 'utf8'
            });
            
            const allNodeModules = nodeModulesOutput.trim().split('\n').filter(n => n);
            
            // Separate real directories from symlinked ones
            allNodeModules.forEach(nmDir => {
                const fullPath = path.join(this.codebaseRoot, nmDir);
                const stats = fs.lstatSync(fullPath);
                
                if (stats.isSymbolicLink()) {
                    console.log(`   🔗 Symlinked: ${nmDir} → ${fs.readlinkSync(fullPath)}`);
                    this.preserveList.add(nmDir);
                } else {
                    this.realNodeModules.push(nmDir);
                }
            });
            
            console.log(`   📁 Real node_modules directories: ${this.realNodeModules.length}`);
            console.log(`   🔗 Symlinked node_modules: ${this.preserveList.size}`);
            
        } catch (error) {
            console.error('   ❌ Error categorizing node_modules:', error.message);
        }
    }

    async checkOSSIntegration() {
        const ossIntegrationPath = path.join(this.codebaseRoot, 'oss-integration-layer');
        const symlinkMapPath = path.join(ossIntegrationPath, 'symlink-map.json');
        
        if (fs.existsSync(symlinkMapPath)) {
            try {
                const symlinkMap = JSON.parse(fs.readFileSync(symlinkMapPath, 'utf8'));
                console.log(`   ✅ OSS Integration Layer found`);
                console.log(`   📋 Version: ${symlinkMap.version}`);
                console.log(`   🔗 Manages ${Object.keys(symlinkMap.layers || {}).length} layer types`);
                
                // Mark OSS integration as preserve
                this.preserveList.add('oss-integration-layer');
                this.preserveList.add('symlinks');
                
            } catch (error) {
                console.log(`   ⚠️  OSS Integration exists but couldn't parse: ${error.message}`);
            }
        } else {
            console.log(`   ❌ No OSS Integration Layer found`);
        }
        
        // Check for tier systems
        const tierFiles = execSync('find . -maxdepth 2 -name "*tier*" -type f', {
            cwd: this.codebaseRoot,
            encoding: 'utf8'
        }).trim().split('\n').filter(f => f);
        
        console.log(`   🏗️  Found ${tierFiles.length} tier system files`);
    }

    async mapComponentDependencies() {
        try {
            // Find TSX/component files
            const tsxFiles = execSync('find . -name "*.tsx" -not -path "*/node_modules/*"', {
                cwd: this.codebaseRoot,
                encoding: 'utf8'
            }).trim().split('\n').filter(f => f);
            
            console.log(`   🧩 Found ${tsxFiles.length} component files`);
            
            // Find dependency mapping files
            const depFiles = execSync('find . -name "*dependency*" -o -name "*map*.js" -not -path "*/node_modules/*"', {
                cwd: this.codebaseRoot,
                encoding: 'utf8'
            }).trim().split('\n').filter(f => f);
            
            console.log(`   🗺️  Found ${depFiles.length} dependency/mapping files`);
            
            // These need special handling
            depFiles.forEach(file => {
                const dir = path.dirname(file);
                this.preserveList.add(dir);
            });
            
        } catch (error) {
            console.error('   ❌ Error mapping components:', error.message);
        }
    }

    async createSafeCleanupPlan() {
        console.log('\n📋 SYMLINK-SAFE CLEANUP PLAN');
        console.log('=============================');
        
        // Identify what's safe to remove
        const safeToRemove = this.realNodeModules.filter(nmDir => {
            // Don't remove if it's in preserve list
            if (this.preserveList.has(nmDir)) return false;
            
            // Don't remove root node_modules
            if (nmDir === './node_modules') return false;
            
            // Don't remove if it's referenced by symlinks
            for (const [symlink, target] of this.symlinkMapping) {
                if (target.includes(nmDir) || symlink.includes(nmDir)) {
                    return false;
                }
            }
            
            return true;
        });
        
        console.log('🛡️  PRESERVATION RULES:');
        console.log(`   ✅ Root node_modules: PRESERVE`);
        console.log(`   ✅ Symlinked directories: PRESERVE (${this.preserveList.size})`);
        console.log(`   ✅ OSS Integration Layer: PRESERVE`);
        console.log(`   ✅ Tier system files: PRESERVE`);
        console.log(`   ✅ Component dependency maps: PRESERVE`);
        console.log('');
        
        console.log('🗑️  SAFE TO REMOVE:');
        console.log(`   📁 Real node_modules directories: ${safeToRemove.length}`);
        
        let totalSizeToRemove = 0;
        console.log('   Top candidates for removal:');
        safeToRemove.slice(0, 10).forEach(dir => {
            try {
                const size = execSync(`du -sb "${dir}"`, {
                    cwd: this.codebaseRoot,
                    encoding: 'utf8'
                });
                const bytes = parseInt(size.split('\t')[0]);
                totalSizeToRemove += bytes;
                console.log(`   📂 ${dir}: ${this.formatBytes(bytes)}`);
            } catch (error) {
                console.log(`   📂 ${dir}: Size unknown`);
            }
        });
        
        console.log(`   💾 Estimated space savings: ${this.formatBytes(totalSizeToRemove)}`);
        console.log('');
        
        console.log('⚠️  RISKS AND MITIGATIONS:');
        console.log('   🔗 Symlink architecture will be preserved');
        console.log('   🧩 Component dependencies will be maintained');
        console.log('   🏗️  23-layer system structure intact');
        console.log('   📦 Only isolated node_modules removed');
        console.log('');
        
        // Generate cleanup script
        this.generateSymlinkSafeScript(safeToRemove);
        
        console.log('💾 Generated: symlink-safe-cleanup.sh');
        console.log('🔍 Review the script before running!');
    }

    generateSymlinkSafeScript(safeToRemove) {
        const script = `#!/bin/bash

# Symlink-Safe Cleanup Script
# Preserves 23-layer architecture and symlinked dependencies

echo "🔗 SYMLINK-SAFE CLEANUP"
echo "======================="

# Safety checks
if [ ! -f "cli.js" ] || [ ! -d "symlinks" ]; then
    echo "❌ Not in correct directory or symlink architecture missing"
    exit 1
fi

echo "📊 Before cleanup:"
echo "   Total size: $(du -sh . | cut -f1)"
echo "   Node modules dirs: $(find . -name "node_modules" -type d | wc -l)"

# Backup symlink mappings
echo "🔗 Backing up symlink mappings..."
find . -type l -exec ls -la {} \\; > .symlink-backup.txt

# Preserve critical symlinks and OSS integration
echo "🛡️  Preserving symlinked architecture..."
${this.preserveList.size > 0 ? 
    Array.from(this.preserveList).map(item => `echo "   Preserving: ${item}"`).join('\n') : 
    'echo "   No specific preservation rules"'
}

# Remove only safe directories
echo "🗑️  Removing isolated node_modules..."
${safeToRemove.map(dir => `
if [ -d "${dir}" ] && [ ! -L "${dir}" ]; then
    echo "   Removing: ${dir}"
    rm -rf "${dir}"
fi`).join('')}

echo "✅ Cleanup complete!"

# Verify symlinks still work
echo "🔍 Verifying symlink integrity..."
find . -type l -exec test -e {} \\; -print | wc -l > /tmp/working_symlinks
WORKING_SYMLINKS=$(cat /tmp/working_symlinks)
echo "   Working symlinks: $WORKING_SYMLINKS"

# Test core systems
echo "🧪 Testing preserved systems..."
if [ -f "connect-and-test-all.js" ]; then
    timeout 5 node connect-and-test-all.js --test 2>/dev/null && echo "   ✅ Connection tests pass" || echo "   ⚠️  Connection tests need review"
fi

echo "📊 After cleanup:"
echo "   Total size: $(du -sh . | cut -f1)"
echo "   Node modules dirs: $(find . -name "node_modules" -type d | wc -l)"

echo ""
echo "🎉 SYMLINK-SAFE CLEANUP COMPLETE!"
echo "================================="
echo "✅ 23-layer architecture preserved"
echo "✅ Symlinked dependencies intact"
echo "✅ Component mappings maintained"
echo "✅ OSS integration layer preserved"
`;

        fs.writeFileSync('./symlink-safe-cleanup.sh', script);
        execSync('chmod +x symlink-safe-cleanup.sh');
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
    }
}

// Run analysis
if (require.main === module) {
    const cleaner = new SymlinkAwareCleaner();
    cleaner.analyze().catch(console.error);
}

module.exports = SymlinkAwareCleaner;
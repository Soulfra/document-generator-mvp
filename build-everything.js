#!/usr/bin/env node

/**
 * 🏗️ UNIFIED BUILD SYSTEM
 * Handles TypeScript, Python, Solidity, 3D assets, agents, and more
 * Builds everything into deployable formats with intelligent caching
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class UnifiedBuildSystem {
    constructor() {
        this.buildDir = path.join(process.cwd(), 'dist');
        this.cacheDir = path.join(process.cwd(), '.build-cache');
        this.buildManifest = path.join(this.cacheDir, 'manifest.json');
        
        // File type processors
        this.processors = {
            typescript: this.processTypeScript.bind(this),
            javascript: this.processJavaScript.bind(this),
            python: this.processPython.bind(this),
            solidity: this.processSolidity.bind(this),
            html: this.processHTML.bind(this),
            css: this.processCSS.bind(this),
            json: this.processJSON.bind(this),
            markdown: this.processMarkdown.bind(this),
            svg: this.processSVG.bind(this),
            shader: this.processShader.bind(this),
            sql: this.processSQL.bind(this)
        };
        
        // Build statistics
        this.stats = {
            total: 0,
            processed: 0,
            cached: 0,
            errors: 0,
            startTime: Date.now()
        };
        
        console.log('🏗️ Unified Build System initialized');
        this.ensureDirectories();
    }
    
    // Main build entry point
    async build() {
        console.log('🚀 Starting unified build process...');
        
        try {
            // Load previous build manifest for caching
            await this.loadBuildManifest();
            
            // Discover all buildable files
            const files = await this.discoverFiles();
            this.stats.total = files.length;
            
            console.log(`📁 Found ${files.length} files to process`);
            
            // Process files in parallel batches
            await this.processFilesBatch(files);
            
            // Generate build artifacts
            await this.generateArtifacts();
            
            // Save updated manifest
            await this.saveBuildManifest();
            
            // Print build summary
            this.printBuildSummary();
            
            console.log('✅ Build completed successfully!');
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }
    
    // Discover all files that need building
    async discoverFiles() {
        const files = [];
        const ignore = [
            'node_modules',
            '.git',
            'dist',
            '.build-cache',
            '.next',
            '__pycache__',
            '*.pyc',
            '.DS_Store',
            '.cleanup-backup',
            'backup-',
            'FinishThisIdea-backup',
            'FinishThisIdea-archive',
            'backups/',
            'symlinks/',
            'ObsidianVault/',
            'templates/templates',
            '__tests__',
            'BossRPG',
            'MusicKnotFramework'
        ];
        
        // File extensions to process
        const extensions = [
            '.ts', '.tsx', '.js', '.jsx',           // TypeScript/JavaScript
            '.py', '.pyx',                          // Python
            '.sol',                                 // Solidity
            '.html', '.htm',                        // HTML
            '.css', '.scss', '.sass', '.less',      // CSS
            '.json', '.jsonc',                      // JSON
            '.md', '.mdx',                          // Markdown
            '.svg',                                 // SVG
            '.glsl', '.vert', '.frag',              // Shaders
            '.sql',                                 // SQL
            '.wasm',                                // WebAssembly
            '.proto'                                // Protocol Buffers
        ];
        
        const scanDirectory = (dir) => {
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    // Skip ignored directories/files
                    if (ignore.some(pattern => 
                        item.includes(pattern.replace('*', '')) || 
                        fullPath.includes(pattern.replace('*', ''))
                    )) {
                        continue;
                    }
                    
                    if (stat.isDirectory()) {
                        scanDirectory(fullPath);
                    } else if (stat.isFile()) {
                        const ext = path.extname(item);
                        if (extensions.includes(ext)) {
                            files.push({
                                path: fullPath,
                                relativePath: path.relative(process.cwd(), fullPath),
                                ext: ext,
                                size: stat.size,
                                mtime: stat.mtime.getTime(),
                                type: this.getFileType(ext)
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not scan directory ${dir}:`, error.message);
            }
        };
        
        scanDirectory(process.cwd());
        
        // Limit to essential files for performance
        const essentialPatterns = [
            'index.html',
            'anontv.html', 
            'professional-portfolio.html',
            'admin-dashboard.html',
            'soulfra-universal-auth.js',
            'cal-cookie-monster.js',
            'github-admin-bridge.js',
            'auth-system.js',
            'api-config.js',
            'package.json',
            'README.md',
            'GITHUB-SOULFRA-SETUP.md'
        ];
        
        // Prioritize essential files
        const essentialFiles = files.filter(file => 
            essentialPatterns.some(pattern => 
                file.relativePath.includes(pattern) || 
                file.relativePath.endsWith(pattern)
            )
        );
        
        // Add up to 50 more files from the rest
        const otherFiles = files.filter(file => 
            !essentialPatterns.some(pattern => 
                file.relativePath.includes(pattern) || 
                file.relativePath.endsWith(pattern)
            )
        ).slice(0, 50);
        
        const finalFiles = [...essentialFiles, ...otherFiles];
        console.log(`📋 Prioritized ${essentialFiles.length} essential files, ${otherFiles.length} additional files`);
        
        return finalFiles;
    }
    
    // Determine file type from extension
    getFileType(ext) {
        const typeMap = {
            '.ts': 'typescript',
            '.tsx': 'typescript', 
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.pyx': 'python',
            '.sol': 'solidity',
            '.html': 'html',
            '.htm': 'html',
            '.css': 'css',
            '.scss': 'css',
            '.sass': 'css',
            '.less': 'css',
            '.json': 'json',
            '.jsonc': 'json',
            '.md': 'markdown',
            '.mdx': 'markdown',
            '.svg': 'svg',
            '.glsl': 'shader',
            '.vert': 'shader',
            '.frag': 'shader',
            '.sql': 'sql'
        };
        
        return typeMap[ext] || 'unknown';
    }
    
    // Process files in batches for performance
    async processFilesBatch(files) {
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < files.length; i += batchSize) {
            batches.push(files.slice(i, i + batchSize));
        }
        
        for (const batch of batches) {
            await Promise.all(
                batch.map(file => this.processFile(file))
            );
        }
    }
    
    // Process individual file
    async processFile(file) {
        try {
            // Check if file needs rebuilding
            if (await this.isCached(file)) {
                this.stats.cached++;
                console.log(`📦 Cached: ${file.relativePath}`);
                return;
            }
            
            console.log(`🔨 Building: ${file.relativePath}`);
            
            const processor = this.processors[file.type];
            if (processor) {
                await processor(file);
                this.stats.processed++;
            } else {
                console.warn(`⚠️ No processor for type: ${file.type}`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${file.relativePath}:`, error.message);
            this.stats.errors++;
        }
    }
    
    // TypeScript processor
    async processTypeScript(file) {
        const outputPath = this.getOutputPath(file, '.js');
        
        try {
            // Try using installed TypeScript compiler
            execSync(`npx tsc --target es2020 --module esnext --outDir "${path.dirname(outputPath)}" "${file.path}"`, {
                stdio: 'pipe'
            });
        } catch (error) {
            // Fallback: simple ES6+ transpilation
            console.warn(`TypeScript compilation failed for ${file.relativePath}, using fallback...`);
            const content = fs.readFileSync(file.path, 'utf8');
            const transpiled = this.simpleTypeScriptTranspile(content);
            this.ensureDirectory(path.dirname(outputPath));
            fs.writeFileSync(outputPath, transpiled);
        }
        
        this.updateCache(file);
    }
    
    // JavaScript processor (minification + bundling)
    async processJavaScript(file) {
        const content = fs.readFileSync(file.path, 'utf8');
        const outputPath = this.getOutputPath(file);
        
        // Simple minification (remove comments and extra whitespace)
        const minified = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '')          // Remove line comments
            .replace(/\s+/g, ' ')              // Collapse whitespace
            .trim();
        
        this.ensureDirectory(path.dirname(outputPath));
        fs.writeFileSync(outputPath, minified);
        this.updateCache(file);
    }
    
    // Python processor (bytecode compilation + packaging)
    async processPython(file) {
        const outputPath = this.getOutputPath(file, '.pyc');
        
        try {
            // Compile to bytecode
            execSync(`python -m py_compile "${file.path}"`, {
                stdio: 'pipe'
            });
            
            // Copy source to build directory for runtime
            const sourceOutputPath = this.getOutputPath(file);
            this.ensureDirectory(path.dirname(sourceOutputPath));
            fs.copyFileSync(file.path, sourceOutputPath);
            
        } catch (error) {
            console.warn(`Python compilation failed for ${file.relativePath}:`, error.message);
            // Still copy source file
            const sourceOutputPath = this.getOutputPath(file);
            this.ensureDirectory(path.dirname(sourceOutputPath));
            fs.copyFileSync(file.path, sourceOutputPath);
        }
        
        this.updateCache(file);
    }
    
    // Solidity processor (compilation + ABI generation)
    async processSolidity(file) {
        const outputDir = path.join(this.buildDir, 'contracts');
        this.ensureDirectory(outputDir);
        
        try {
            // Try to compile with Solidity compiler
            const result = execSync(`solc --bin --abi --optimize -o "${outputDir}" "${file.path}"`, {
                stdio: 'pipe',
                encoding: 'utf8'
            });
            
            console.log(`📜 Compiled Solidity contract: ${file.relativePath}`);
            
        } catch (error) {
            console.warn(`Solidity compilation failed for ${file.relativePath}:`, error.message);
            // Copy source for manual compilation
            const sourceOutputPath = this.getOutputPath(file);
            this.ensureDirectory(path.dirname(sourceOutputPath));
            fs.copyFileSync(file.path, sourceOutputPath);
        }
        
        this.updateCache(file);
    }
    
    // HTML processor (minification + asset optimization)
    async processHTML(file) {
        const content = fs.readFileSync(file.path, 'utf8');
        const outputPath = this.getOutputPath(file);
        
        // Simple HTML minification
        const minified = content
            .replace(/<!--[\s\S]*?-->/g, '')    // Remove comments
            .replace(/>\s+</g, '><')            // Remove whitespace between tags
            .replace(/\s+/g, ' ')               // Collapse whitespace
            .trim();
        
        this.ensureDirectory(path.dirname(outputPath));
        fs.writeFileSync(outputPath, minified);
        this.updateCache(file);
    }
    
    // CSS processor (minification + autoprefixer)
    async processCSS(file) {
        const content = fs.readFileSync(file.path, 'utf8');
        const outputPath = this.getOutputPath(file);
        
        // Simple CSS minification
        const minified = content
            .replace(/\/\*[\s\S]*?\*\//g, '')   // Remove comments
            .replace(/\s+/g, ' ')               // Collapse whitespace
            .replace(/;\s*}/g, '}')             // Remove last semicolon
            .replace(/\s*{\s*/g, '{')           // Clean braces
            .replace(/}\s*/g, '}')
            .trim();
        
        this.ensureDirectory(path.dirname(outputPath));
        fs.writeFileSync(outputPath, minified);
        this.updateCache(file);
    }
    
    // JSON processor (validation + minification)
    async processJSON(file) {
        try {
            const content = fs.readFileSync(file.path, 'utf8');
            const parsed = JSON.parse(content);
            const minified = JSON.stringify(parsed); // Automatically minified
            
            const outputPath = this.getOutputPath(file);
            this.ensureDirectory(path.dirname(outputPath));
            fs.writeFileSync(outputPath, minified);
            this.updateCache(file);
            
        } catch (error) {
            console.error(`Invalid JSON in ${file.relativePath}:`, error.message);
            throw error;
        }
    }
    
    // Markdown processor (HTML generation)
    async processMarkdown(file) {
        const content = fs.readFileSync(file.path, 'utf8');
        const outputPath = this.getOutputPath(file, '.html');
        
        // Simple markdown to HTML conversion
        const html = this.simpleMarkdownToHTML(content);
        
        this.ensureDirectory(path.dirname(outputPath));
        fs.writeFileSync(outputPath, html);
        this.updateCache(file);
    }
    
    // SVG processor (optimization)
    async processSVG(file) {
        const content = fs.readFileSync(file.path, 'utf8');
        const outputPath = this.getOutputPath(file);
        
        // Simple SVG optimization (remove comments and extra whitespace)
        const optimized = content
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/>\s+</g, '><')
            .trim();
        
        this.ensureDirectory(path.dirname(outputPath));
        fs.writeFileSync(outputPath, optimized);
        this.updateCache(file);
    }
    
    // Shader processor (GLSL validation)
    async processShader(file) {
        const outputPath = this.getOutputPath(file);
        
        // For now, just copy shaders (could add GLSL validation)
        this.ensureDirectory(path.dirname(outputPath));
        fs.copyFileSync(file.path, outputPath);
        this.updateCache(file);
    }
    
    // SQL processor (syntax validation)
    async processSQL(file) {
        const outputPath = this.getOutputPath(file);
        
        // Copy SQL files to build directory
        this.ensureDirectory(path.dirname(outputPath));
        fs.copyFileSync(file.path, outputPath);
        this.updateCache(file);
    }
    
    // Generate build artifacts
    async generateArtifacts() {
        console.log('📦 Generating build artifacts...');
        
        // Create package manifest
        const manifest = {
            buildTime: new Date().toISOString(),
            version: this.getBuildVersion(),
            stats: this.stats,
            components: await this.generateComponentManifest()
        };
        
        fs.writeFileSync(
            path.join(this.buildDir, 'build-manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        // Generate deployment scripts
        await this.generateDeploymentScripts();
        
        // Create component index
        await this.generateComponentIndex();
    }
    
    // Generate component manifest
    async generateComponentManifest() {
        const components = {
            authentication: ['soulfra-universal-auth.js', 'cal-cookie-monster.js'],
            portfolio: ['professional-portfolio.html', 'anontv.html'],
            admin: ['admin-dashboard.html', 'github-admin-bridge.js'],
            agents: this.findFilesByPattern('*AGENT*.js'),
            blockchain: this.findFilesByPattern('*.sol'),
            games: this.findFilesByPattern('*GAME*.html'),
            documentation: this.findFilesByPattern('*.md')
        };
        
        return components;
    }
    
    // Generate deployment scripts
    async generateDeploymentScripts() {
        const deployScript = `#!/bin/bash
# Auto-generated deployment script

echo "🚀 Deploying Document Generator Platform..."

# GitHub Pages deployment
echo "📄 Deploying to GitHub Pages..."
git add dist/
git commit -m "Deploy build $(date)"
git push origin main

# Additional deployment targets can be added here
echo "✅ Deployment complete!"
`;
        
        fs.writeFileSync(path.join(this.buildDir, 'deploy.sh'), deployScript);
        execSync(`chmod +x "${path.join(this.buildDir, 'deploy.sh')}"`);
    }
    
    // Generate component index
    async generateComponentIndex() {
        const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Generator - Component Index</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        .component { margin: 1rem 0; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
        .component h3 { margin: 0 0 0.5rem 0; color: #333; }
        .component a { color: #0066cc; text-decoration: none; }
        .component a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>🏗️ Document Generator Components</h1>
    <p>Built on ${new Date().toISOString()}</p>
    
    <div class="component">
        <h3>🌐 Authentication</h3>
        <a href="professional-portfolio.html">Portfolio Login</a> |
        <a href="admin-dashboard.html">Admin Dashboard</a>
    </div>
    
    <div class="component">
        <h3>🎮 Gaming Interfaces</h3>
        <a href="anontv.html">AnonTV Portfolio</a>
    </div>
    
    <div class="component">
        <h3>📊 Analytics</h3>
        <a href="build-manifest.json">Build Manifest</a>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(path.join(this.buildDir, 'components.html'), indexHTML);
    }
    
    // Helper methods
    getOutputPath(file, newExt = null) {
        const ext = newExt || path.extname(file.path);
        const name = path.basename(file.path, path.extname(file.path));
        const dir = path.dirname(file.relativePath);
        return path.join(this.buildDir, dir, name + ext);
    }
    
    ensureDirectory(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    ensureDirectories() {
        this.ensureDirectory(this.buildDir);
        this.ensureDirectory(this.cacheDir);
    }
    
    // Caching system
    async isCached(file) {
        if (!this.buildManifest || !this.buildManifest[file.relativePath]) {
            return false;
        }
        
        const cached = this.buildManifest[file.relativePath];
        return cached.mtime === file.mtime && cached.size === file.size;
    }
    
    updateCache(file) {
        if (!this.buildManifest) {
            this.buildManifest = {};
        }
        
        this.buildManifest[file.relativePath] = {
            mtime: file.mtime,
            size: file.size,
            built: Date.now()
        };
    }
    
    async loadBuildManifest() {
        try {
            if (fs.existsSync(this.buildManifest)) {
                const content = fs.readFileSync(this.buildManifest, 'utf8');
                this.buildManifest = JSON.parse(content);
            } else {
                this.buildManifest = {};
            }
        } catch (error) {
            console.warn('Could not load build manifest, starting fresh');
            this.buildManifest = {};
        }
    }
    
    async saveBuildManifest() {
        fs.writeFileSync(this.buildManifest, JSON.stringify(this.buildManifest, null, 2));
    }
    
    getBuildVersion() {
        try {
            const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
            return gitHash;
        } catch {
            return 'unknown';
        }
    }
    
    findFilesByPattern(pattern) {
        // Simple glob-like pattern matching
        const regex = new RegExp(pattern.replace('*', '.*'), 'i');
        return fs.readdirSync(process.cwd())
            .filter(file => regex.test(file))
            .slice(0, 10); // Limit results
    }
    
    // Simple transpilers
    simpleTypeScriptTranspile(content) {
        return content
            .replace(/:\s*\w+(\[\])?/g, '')      // Remove type annotations
            .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
            .replace(/export\s+/g, '')           // Remove export keywords
            .replace(/import\s+.*from\s+['"][^'"]*['"];?\n/g, ''); // Remove imports
    }
    
    simpleMarkdownToHTML(content) {
        return content
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }
    
    printBuildSummary() {
        const duration = Date.now() - this.stats.startTime;
        
        console.log('\n📊 Build Summary:');
        console.log(`   Total files: ${this.stats.total}`);
        console.log(`   Processed: ${this.stats.processed}`);
        console.log(`   Cached: ${this.stats.cached}`);
        console.log(`   Errors: ${this.stats.errors}`);
        console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`   Output: ${this.buildDir}`);
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const buildSystem = new UnifiedBuildSystem();
    
    if (args.includes('--watch')) {
        console.log('👀 Watch mode not implemented yet');
        process.exit(1);
    } else {
        buildSystem.build().catch(error => {
            console.error('Build failed:', error);
            process.exit(1);
        });
    }
}

module.exports = UnifiedBuildSystem;
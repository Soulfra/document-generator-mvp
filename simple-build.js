#!/usr/bin/env node

/**
 * 🏗️ SIMPLE BUILD SYSTEM - Fast deployment-focused build
 * Processes only essential files for GitHub Pages deployment
 */

const fs = require('fs');
const path = require('path');

class SimpleBuildSystem {
    constructor() {
        this.buildDir = path.join(process.cwd(), 'dist');
        this.stats = { processed: 0, copied: 0, errors: 0 };
        
        console.log('🏗️ Simple Build System initialized');
        this.ensureDirectory(this.buildDir);
    }
    
    async build() {
        console.log('🚀 Starting simple build process...');
        
        try {
            // Essential files to copy directly
            const essentialFiles = [
                'index.html',
                'anontv.html',
                'professional-portfolio.html', 
                'admin-dashboard.html',
                'soulfra-universal-auth.js',
                'cal-cookie-monster.js',
                'github-admin-bridge.js',
                'auth-system.js',
                'portfolio-backend.js',
                'portfolio-database-schema.sql',
                'api-config.js',
                'arweave-wallet-auth.js',
                'cal-alive-character.js',
                'GITHUB-SOULFRA-SETUP.md'
            ];
            
            // Copy essential files
            for (const file of essentialFiles) {
                await this.copyFile(file);
            }
            
            // Process MCP demo if it exists
            await this.copyMCPDemo();
            
            // Generate build artifacts
            await this.generateBuildArtifacts();
            
            // Print summary
            this.printSummary();
            
            console.log('✅ Simple build completed successfully!');
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }
    
    async copyFile(filename) {
        const sourcePath = path.join(process.cwd(), filename);
        const destPath = path.join(this.buildDir, filename);
        
        try {
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`📄 Copied: ${filename}`);
                this.stats.copied++;
            } else {
                console.log(`⚠️ Not found: ${filename}`);
            }
            this.stats.processed++;
        } catch (error) {
            console.error(`❌ Error copying ${filename}:`, error.message);
            this.stats.errors++;
        }
    }
    
    async copyMCPDemo() {
        const mcpDemoPath = path.join(process.cwd(), 'mcp', 'src', 'web-demo');
        const destDemoPath = path.join(this.buildDir, 'web-demo');
        
        if (fs.existsSync(mcpDemoPath)) {
            try {
                this.copyDirectoryRecursive(mcpDemoPath, destDemoPath);
                console.log('📁 Copied: MCP web-demo directory');
                this.stats.copied++;
            } catch (error) {
                console.error('❌ Error copying MCP demo:', error.message);
                this.stats.errors++;
            }
        }
    }
    
    copyDirectoryRecursive(source, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const items = fs.readdirSync(source);
        
        for (const item of items) {
            const sourcePath = path.join(source, item);
            const destPath = path.join(dest, item);
            const stat = fs.statSync(sourcePath);
            
            if (stat.isDirectory()) {
                this.copyDirectoryRecursive(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        }
    }
    
    async generateBuildArtifacts() {
        console.log('📦 Generating build artifacts...');
        
        // Build manifest
        const manifest = {
            buildTime: new Date().toISOString(),
            version: this.getBuildVersion(),
            stats: this.stats,
            files: fs.readdirSync(this.buildDir),
            deployment: {
                target: 'github-pages',
                url: 'https://soulfra.github.io/document-generator-mvp'
            }
        };
        
        fs.writeFileSync(
            path.join(this.buildDir, 'build-manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        // Component index
        const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Generator - SoulFra Platform</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            margin: 2rem; 
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            color: white;
            min-height: 100vh;
        }
        .header { text-align: center; margin-bottom: 2rem; }
        .header h1 { color: #4ecca3; margin-bottom: 0.5rem; }
        .component { 
            margin: 1rem 0; 
            padding: 1.5rem; 
            border: 1px solid #4ecca3; 
            border-radius: 12px; 
            background: rgba(26, 26, 26, 0.8);
        }
        .component h3 { margin: 0 0 0.5rem 0; color: #4ecca3; }
        .component a { color: #fff; text-decoration: none; margin-right: 1rem; }
        .component a:hover { color: #4ecca3; }
        .stats { background: rgba(78, 204, 163, 0.1); padding: 1rem; border-radius: 8px; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 SoulFra Document Generator Platform</h1>
        <p>Built on ${manifest.buildTime}</p>
    </div>
    
    <div class="component">
        <h3>🔐 Authentication System</h3>
        <a href="professional-portfolio.html">Professional Portfolio</a>
        <a href="admin-dashboard.html">Admin Dashboard</a>
        <p>Universal login with GitHub, LinkedIn, Google + Cal Cookie rewards</p>
    </div>
    
    <div class="component">
        <h3>🎮 Portfolio Interfaces</h3>
        <a href="anontv.html">AnonTV Portfolio</a>
        <a href="index.html">Main Platform</a>
        <p>4chan-style broadcasting and professional portfolio views</p>
    </div>
    
    <div class="component">
        <h3>📊 System Information</h3>
        <a href="build-manifest.json">Build Manifest</a>
        <a href="GITHUB-SOULFRA-SETUP.md">Setup Guide</a>
        <p>System documentation and deployment information</p>
    </div>
    
    <div class="stats">
        <h3>📈 Build Statistics</h3>
        <p>Files processed: ${manifest.stats.processed}</p>
        <p>Files copied: ${manifest.stats.copied}</p>
        <p>Errors: ${manifest.stats.errors}</p>
        <p>Build version: ${manifest.version}</p>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(path.join(this.buildDir, 'components.html'), indexHTML);
        
        console.log('✅ Build artifacts generated');
    }
    
    getBuildVersion() {
        try {
            const { execSync } = require('child_process');
            const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
            return gitHash;
        } catch {
            return Date.now().toString();
        }
    }
    
    ensureDirectory(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    printSummary() {
        console.log('\\n📊 Build Summary:');
        console.log(`   Files processed: ${this.stats.processed}`);
        console.log(`   Files copied: ${this.stats.copied}`);
        console.log(`   Errors: ${this.stats.errors}`);
        console.log(`   Output directory: ${this.buildDir}`);
        
        // List built files
        const builtFiles = fs.readdirSync(this.buildDir);
        console.log(`\\n📁 Built files (${builtFiles.length}):`);
        builtFiles.forEach(file => console.log(`   - ${file}`));
    }
}

// CLI interface
if (require.main === module) {
    const buildSystem = new SimpleBuildSystem();
    buildSystem.build();
}

module.exports = SimpleBuildSystem;
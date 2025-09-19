#!/usr/bin/env node

/**
 * SIMPLE EXPORT GENERATOR
 * Creates verification proof packages without complex error handling
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SimpleExportGenerator {
  constructor() {
    this.sessionId = crypto.randomUUID();
    this.workspace = './simple-exports';
    this.timestamp = new Date().toISOString();
    
    console.log('🎆 SIMPLE EXPORT GENERATOR');
    console.log('===========================');
    console.log(`📋 Session: ${this.sessionId}`);
    console.log(`📁 Workspace: ${this.workspace}`);
  }
  
  async ensureWorkspace() {
    try {
      await fs.mkdir(this.workspace, { recursive: true });
      return true;
    } catch (error) {
      console.error('❌ Could not create workspace:', error.message);
      return false;
    }
  }
  
  async collectSystemFiles() {
    const patterns = [
      'CONSTELLATION*.js',
      'GRANULAR*.js', 
      'FIREWORKS*.js',
      'THIRD-PARTY*.js',
      'EXECUTE*.js',
      'VERIFY*.js'
    ];
    
    const files = [];
    
    try {
      const allFiles = await fs.readdir('.');
      
      for (const file of allFiles) {
        for (const pattern of patterns) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          if (regex.test(file)) {
            try {
              const stats = await fs.stat(file);
              files.push({
                name: file,
                size: stats.size,
                modified: stats.mtime.toISOString()
              });
            } catch (err) {
              console.warn(`⚠️  Could not stat ${file}: ${err.message}`);
            }
          }
        }
      }
      
      return files;
    } catch (error) {
      console.error('❌ Error collecting files:', error.message);
      return [];
    }
  }
  
  async generateExportPackage() {
    console.log('\n🎯 Generating export package...');
    
    // Ensure workspace exists
    const workspaceReady = await this.ensureWorkspace();
    if (!workspaceReady) {
      return false;
    }
    
    // Collect system files
    const files = await this.collectSystemFiles();
    console.log(`📄 Found ${files.length} system files`);
    
    // Create manifest
    const manifest = {
      sessionId: this.sessionId,
      timestamp: this.timestamp,
      generator: 'SimpleExportGenerator',
      filesIncluded: files.length,
      files: files,
      metrics: {
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        averageSize: files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) / files.length : 0
      }
    };
    
    try {
      // Write manifest
      const manifestPath = path.join(this.workspace, 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`📋 Manifest written: ${manifestPath}`);
      
      // Copy system files
      let copied = 0;
      for (const file of files) {
        try {
          const sourcePath = file.name;
          const destPath = path.join(this.workspace, file.name);
          await fs.copyFile(sourcePath, destPath);
          copied++;
        } catch (error) {
          console.warn(`⚠️  Could not copy ${file.name}: ${error.message}`);
        }
      }
      
      console.log(`📦 Copied ${copied}/${files.length} files`);
      
      // Create summary
      const summary = {
        status: 'success',
        filesProcessed: files.length,
        filesCopied: copied,
        workspace: this.workspace,
        timestamp: new Date().toISOString()
      };
      
      const summaryPath = path.join(this.workspace, 'export-summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log('✅ Export package generated successfully!');
      console.log(`📁 Location: ${this.workspace}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error generating export package:', error.message);
      return false;
    }
  }
}

// Main execution
async function main() {
  const generator = new SimpleExportGenerator();
  const success = await generator.generateExportPackage();
  
  if (success) {
    console.log('\n🎆 Export completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Export failed');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}
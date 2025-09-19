#!/usr/bin/env node

/**
 * 🗑️ TRASH MANAGER
 * 
 * Intelligent cleanup system for Document Generator
 * Manages orphaned processes, temp files, and system state
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class TrashManager {
    constructor() {
        this.trashDir = path.join(__dirname, '.trash');
        this.tempPatterns = [
            'demo-mvp-*.html',
            '*.log',
            'node_modules/.cache',
            'tmp',
            '.temp',
            '*.tmp'
        ];
        
        this.processPatterns = [
            'node.*build.js',
            'node.*auth-system',
            'node.*showboat-brain',
            'node.*simple-mvp',
            'node.*unified-menu'
        ];
        
        console.log('🗑️ TRASH MANAGER');
        console.log('🧹 Intelligent cleanup system');
    }
    
    /**
     * 🧹 DEEP CLEAN
     */
    async deepClean() {
        console.log('\n🧹 DEEP CLEANING SYSTEM...\n');
        
        const results = {
            processes: 0,
            files: 0,
            ports: 0,
            space: 0
        };
        
        // Kill orphaned processes
        results.processes = await this.killOrphanedProcesses();
        
        // Clean temporary files
        results.files = await this.cleanTempFiles();
        
        // Reset port conflicts
        results.ports = await this.resetPorts();
        
        // Calculate space saved
        results.space = await this.calculateSpaceSaved();
        
        // Report results
        this.reportCleanup(results);
        
        return results;
    }
    
    /**
     * 💀 KILL ORPHANED PROCESSES
     */
    async killOrphanedProcesses() {
        console.log('💀 Killing orphaned processes...');
        let killed = 0;
        
        for (const pattern of this.processPatterns) {
            try {
                const killProcess = spawn('pkill', ['-f', pattern], { 
                    stdio: 'pipe' 
                });
                
                killProcess.stdout.on('data', (data) => {
                    killed += data.toString().split('\n').filter(line => line.trim()).length;
                });
                
                await new Promise(resolve => {
                    killProcess.on('close', resolve);
                    setTimeout(resolve, 2000);
                });
                
                console.log(`   ✅ Cleaned pattern: ${pattern}`);
            } catch (error) {
                console.log(`   ⚠️  Could not clean: ${pattern}`);
            }
        }
        
        // Also kill by ports
        const ports = [3030, 4000, 5000, 5555, 6666, 7777, 8080, 8090, 8888, 9999];
        
        for (const port of ports) {
            try {
                const lsofProcess = spawn('lsof', ['-ti', `:${port}`], { 
                    stdio: 'pipe' 
                });
                
                let pids = '';
                lsofProcess.stdout.on('data', (data) => {
                    pids += data.toString();
                });
                
                await new Promise(resolve => {
                    lsofProcess.on('close', () => {
                        if (pids.trim()) {
                            const pidList = pids.trim().split('\n');
                            pidList.forEach(pid => {
                                try {
                                    process.kill(parseInt(pid));
                                    killed++;
                                    console.log(`   ✅ Killed process on port ${port} (PID: ${pid})`);
                                } catch (e) {
                                    // Process already dead
                                }
                            });
                        }
                        resolve();
                    });
                    setTimeout(resolve, 1000);
                });
            } catch (error) {
                // Port was free
            }
        }
        
        console.log(`   📊 Killed ${killed} orphaned processes\n`);
        return killed;
    }
    
    /**
     * 🗂️ CLEAN TEMP FILES
     */
    async cleanTempFiles() {
        console.log('🗂️ Cleaning temporary files...');
        let cleaned = 0;
        
        // Create trash directory
        await this.ensureTrashDir();
        
        // Clean by patterns
        for (const pattern of this.tempPatterns) {
            try {
                const files = await this.findFilesByPattern(pattern);
                
                for (const file of files) {
                    try {
                        await this.moveToTrash(file);
                        cleaned++;
                        console.log(`   🗑️ Trashed: ${file}`);
                    } catch (error) {
                        console.log(`   ⚠️  Could not trash: ${file}`);
                    }
                }
            } catch (error) {
                // Pattern not found
            }
        }
        
        // Clean node_modules cache
        await this.cleanNodeModulesCache();
        
        // Clean old generated files
        await this.cleanGeneratedFiles();
        
        console.log(`   📊 Cleaned ${cleaned} temporary files\n`);
        return cleaned;
    }
    
    /**
     * 🔌 RESET PORTS
     */
    async resetPorts() {
        console.log('🔌 Resetting port conflicts...');
        const ports = [3030, 4000, 5000, 5555, 6666, 7777, 8080, 8090, 8888, 9999];
        let reset = 0;
        
        for (const port of ports) {
            const wasInUse = await this.isPortInUse(port);
            
            if (wasInUse) {
                await this.forceKillPort(port);
                
                // Verify port is now free
                const nowFree = !(await this.isPortInUse(port));
                
                if (nowFree) {
                    reset++;
                    console.log(`   ✅ Freed port ${port}`);
                } else {
                    console.log(`   ⚠️  Port ${port} still in use`);
                }
            }
        }
        
        console.log(`   📊 Reset ${reset} ports\n`);
        return reset;
    }
    
    /**
     * 📊 CALCULATE SPACE SAVED
     */
    async calculateSpaceSaved() {
        console.log('📊 Calculating space saved...');
        
        try {
            const trashSize = await this.getDirectorySize(this.trashDir);
            const spaceSavedMB = Math.round(trashSize / (1024 * 1024));
            
            console.log(`   💾 Space saved: ${spaceSavedMB} MB\n`);
            return spaceSavedMB;
        } catch (error) {
            console.log('   💾 Could not calculate space saved\n');
            return 0;
        }
    }
    
    /**
     * 📈 REPORT CLEANUP
     */
    reportCleanup(results) {
        console.log('📈 CLEANUP SUMMARY');
        console.log('==================');
        console.log(`🗂️ Files cleaned: ${results.files}`);
        console.log(`💀 Processes killed: ${results.processes}`);
        console.log(`🔌 Ports reset: ${results.ports}`);
        console.log(`💾 Space saved: ${results.space} MB`);
        console.log('==================\n');
        
        if (results.files + results.processes + results.ports > 0) {
            console.log('✅ System cleaned successfully!');
        } else {
            console.log('✨ System was already clean!');
        }
    }
    
    /**
     * 🗑️ TRASH OPERATIONS
     */
    async ensureTrashDir() {
        try {
            await fs.mkdir(this.trashDir, { recursive: true });
        } catch (error) {
            // Directory exists
        }
    }
    
    async moveToTrash(filePath) {
        const fileName = path.basename(filePath);
        const timestamp = Date.now();
        const trashPath = path.join(this.trashDir, `${timestamp}-${fileName}`);
        
        try {
            await fs.rename(filePath, trashPath);
        } catch (error) {
            // Try copying then deleting
            await fs.copyFile(filePath, trashPath);
            await fs.unlink(filePath);
        }
    }
    
    async emptyTrash() {
        console.log('🗑️ Emptying trash...');
        
        try {
            const files = await fs.readdir(this.trashDir);
            
            for (const file of files) {
                const filePath = path.join(this.trashDir, file);
                await fs.unlink(filePath);
            }
            
            console.log(`✅ Emptied ${files.length} files from trash`);
        } catch (error) {
            console.log('⚠️ Could not empty trash');
        }
    }
    
    /**
     * 🔍 HELPER METHODS
     */
    async findFilesByPattern(pattern) {
        // Simple pattern matching - in production would use glob
        const files = [];
        
        try {
            const entries = await fs.readdir('.');
            
            for (const entry of entries) {
                const stat = await fs.lstat(entry);
                
                if (stat.isFile() && this.matchesPattern(entry, pattern)) {
                    files.push(entry);
                }
            }
        } catch (error) {
            // Directory not accessible
        }
        
        return files;
    }
    
    matchesPattern(filename, pattern) {
        // Simple pattern matching
        if (pattern.includes('*')) {
            const regex = pattern.replace(/\*/g, '.*');
            return new RegExp(regex).test(filename);
        }
        
        return filename.includes(pattern);
    }
    
    async isPortInUse(port) {
        return new Promise(resolve => {
            const { createConnection } = require('net');
            const connection = createConnection(port, 'localhost');
            
            connection.on('connect', () => {
                connection.destroy();
                resolve(true); // Port in use
            });
            
            connection.on('error', () => {
                resolve(false); // Port available
            });
            
            setTimeout(() => {
                connection.destroy();
                resolve(false);
            }, 500);
        });
    }
    
    async forceKillPort(port) {
        try {
            const killProcess = spawn('lsof', ['-ti', `:${port}`], { stdio: 'pipe' });
            
            let pids = '';
            killProcess.stdout.on('data', (data) => {
                pids += data.toString();
            });
            
            await new Promise(resolve => {
                killProcess.on('close', () => {
                    if (pids.trim()) {
                        pids.trim().split('\n').forEach(pid => {
                            try {
                                process.kill(parseInt(pid), 'SIGKILL');
                            } catch (e) {
                                // Process already dead
                            }
                        });
                    }
                    resolve();
                });
                setTimeout(resolve, 1000);
            });
        } catch (error) {
            // Could not kill
        }
    }
    
    async cleanNodeModulesCache() {
        console.log('   🧹 Cleaning node_modules cache...');
        
        const cachePaths = [
            'node_modules/.cache',
            'web-interface/node_modules/.cache',
            'auth-layer/node_modules/.cache'
        ];
        
        for (const cachePath of cachePaths) {
            try {
                await fs.rm(cachePath, { recursive: true, force: true });
                console.log(`   ✅ Cleaned: ${cachePath}`);
            } catch (error) {
                // Cache doesn't exist
            }
        }
    }
    
    async cleanGeneratedFiles() {
        console.log('   🧹 Cleaning generated files...');
        
        const generatedPatterns = [
            'demo-mvp-*.html',
            'master-launch-status.json',
            'integration-test-report.json',
            '*.pid',
            '*.lock'
        ];
        
        for (const pattern of generatedPatterns) {
            const files = await this.findFilesByPattern(pattern);
            
            for (const file of files) {
                try {
                    await this.moveToTrash(file);
                    console.log(`   🗑️ Trashed generated file: ${file}`);
                } catch (error) {
                    // Could not trash
                }
            }
        }
    }
    
    async getDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const entries = await fs.readdir(dirPath);
            
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry);
                const stat = await fs.lstat(entryPath);
                
                if (stat.isFile()) {
                    totalSize += stat.size;
                } else if (stat.isDirectory()) {
                    totalSize += await this.getDirectorySize(entryPath);
                }
            }
        } catch (error) {
            // Directory not accessible
        }
        
        return totalSize;
    }
    
    /**
     * 📊 SYSTEM STATUS
     */
    async getSystemStatus() {
        const status = {
            processes: await this.getRunningProcesses(),
            ports: await this.getPortStatus(),
            disk: await this.getDiskUsage(),
            trash: await this.getTrashStatus()
        };
        
        return status;
    }
    
    async getRunningProcesses() {
        // Return list of Document Generator processes
        return [];
    }
    
    async getPortStatus() {
        const ports = [3030, 4000, 5000, 5555, 6666, 7777, 8080, 8090, 8888, 9999];
        const status = {};
        
        for (const port of ports) {
            status[port] = await this.isPortInUse(port);
        }
        
        return status;
    }
    
    async getDiskUsage() {
        try {
            const projectSize = await this.getDirectorySize('.');
            return Math.round(projectSize / (1024 * 1024)); // MB
        } catch (error) {
            return 0;
        }
    }
    
    async getTrashStatus() {
        try {
            const files = await fs.readdir(this.trashDir);
            const size = await this.getDirectorySize(this.trashDir);
            
            return {
                files: files.length,
                size: Math.round(size / (1024 * 1024)) // MB
            };
        } catch (error) {
            return { files: 0, size: 0 };
        }
    }
}

// 🚀 CLI INTERFACE
if (require.main === module) {
    const trashManager = new TrashManager();
    
    const command = process.argv[2] || 'clean';
    
    switch (command) {
        case 'clean':
            trashManager.deepClean();
            break;
            
        case 'empty':
            trashManager.emptyTrash();
            break;
            
        case 'status':
            trashManager.getSystemStatus().then(status => {
                console.log('📊 SYSTEM STATUS');
                console.log(JSON.stringify(status, null, 2));
            });
            break;
            
        default:
            console.log('Usage: node trash-manager.js [clean|empty|status]');
    }
}

module.exports = TrashManager;
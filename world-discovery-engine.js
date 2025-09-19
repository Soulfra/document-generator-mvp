#!/usr/bin/env node

/**
 * 🌍 WORLD DISCOVERY ENGINE 🌍
 * Find ALL the worlds, engines, and games in the system
 * Make them all broadcastable and interactive
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class WorldDiscoveryEngine {
    constructor() {
        this.worlds = new Map();
        this.engines = new Map();
        this.games = new Map();
        this.interfaces = new Map();
        
        console.log('🌍 WORLD DISCOVERY ENGINE INITIALIZING...');
        this.discoverAllWorlds();
    }
    
    async discoverAllWorlds() {
        console.log('🔍 Scanning for all worlds, engines, and games...');
        
        const patterns = [
            { type: 'world', patterns: ['*world*', '*realm*', '*dimension*'] },
            { type: 'engine', patterns: ['*engine*', '*processor*', '*generator*'] },
            { type: 'game', patterns: ['*game*', '*play*', '*simulation*'] },
            { type: 'interface', patterns: ['*interface*', '*dashboard*', '*viewer*'] }
        ];
        
        for (const category of patterns) {
            await this.scanForCategory(category);
        }
        
        this.analyzeDiscoveredWorlds();
        this.generateWorldMap();
    }
    
    async scanForCategory(category) {
        console.log(`🔎 Scanning for ${category.type}s...`);
        
        const found = [];
        
        // Scan current directory recursively
        const scanDir = (dir, depth = 0) => {
            if (depth > 3) return; // Limit depth
            
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    if (item.startsWith('.') || item === 'node_modules') continue;
                    
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        scanDir(fullPath, depth + 1);
                    } else if (stat.isFile()) {
                        // Check if file matches any pattern
                        for (const pattern of category.patterns) {
                            const regex = new RegExp(pattern.replace('*', '.*'), 'i');
                            if (regex.test(item)) {
                                found.push({
                                    name: item,
                                    path: fullPath,
                                    type: category.type,
                                    size: stat.size,
                                    modified: stat.mtime,
                                    extension: path.extname(item)
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
            }
        };
        
        scanDir('.');
        
        // Store in appropriate map
        found.forEach(item => {
            switch (category.type) {
                case 'world':
                    this.worlds.set(item.name, item);
                    break;
                case 'engine':
                    this.engines.set(item.name, item);
                    break;
                case 'game':
                    this.games.set(item.name, item);
                    break;
                case 'interface':
                    this.interfaces.set(item.name, item);
                    break;
            }
        });
        
        console.log(`  Found ${found.length} ${category.type}s`);
    }
    
    analyzeDiscoveredWorlds() {
        console.log('\n🧪 ANALYZING DISCOVERED WORLDS...');
        console.log('==================================');
        
        console.log(`\n🌍 WORLDS (${this.worlds.size}):`);
        for (const [name, world] of this.worlds) {
            console.log(`  📍 ${name} (${world.extension}) - ${this.formatFileSize(world.size)}`);
        }
        
        console.log(`\n⚙️ ENGINES (${this.engines.size}):`);
        for (const [name, engine] of this.engines) {
            const status = this.analyzeEngine(engine);
            console.log(`  🔧 ${name} (${engine.extension}) - ${status}`);
        }
        
        console.log(`\n🎮 GAMES (${this.games.size}):`);
        for (const [name, game] of this.games) {
            const status = this.analyzeGame(game);
            console.log(`  🎯 ${name} (${game.extension}) - ${status}`);
        }
        
        console.log(`\n🖥️ INTERFACES (${this.interfaces.size}):`);
        for (const [name, interfaceItem] of this.interfaces) {
            console.log(`  📺 ${name} (${interfaceItem.extension}) - ${this.formatFileSize(interfaceItem.size)}`);
        }
    }
    
    analyzeEngine(engine) {
        if (engine.extension === '.js') {
            return 'JavaScript Engine';
        } else if (engine.extension === '.py') {
            return 'Python Engine';
        } else if (engine.extension === '.html') {
            return 'Web Engine';
        }
        return 'Unknown Engine';
    }
    
    analyzeGame(game) {
        if (game.extension === '.html') {
            return 'Web Game';
        } else if (game.extension === '.js') {
            return 'JavaScript Game';
        } else if (game.extension === '.py') {
            return 'Python Game';
        }
        return 'Unknown Game';
    }
    
    generateWorldMap() {
        const worldMap = {
            totalWorlds: this.worlds.size + this.engines.size + this.games.size + this.interfaces.size,
            categories: {
                worlds: Array.from(this.worlds.values()),
                engines: Array.from(this.engines.values()),
                games: Array.from(this.games.values()),
                interfaces: Array.from(this.interfaces.values())
            },
            broadcastable: this.getBroadcastableWorlds(),
            interactive: this.getInteractiveWorlds(),
            timestamp: new Date().toISOString()
        };
        
        // Save world map
        fs.writeFileSync('world-map.json', JSON.stringify(worldMap, null, 2));
        console.log('\n📋 World map saved to world-map.json');
        
        return worldMap;
    }
    
    getBroadcastableWorlds() {
        const broadcastable = [];
        
        // HTML files are typically broadcastable via web
        [...this.worlds, ...this.engines, ...this.games, ...this.interfaces].forEach(([name, item]) => {
            if (item.extension === '.html') {
                broadcastable.push({
                    name,
                    path: item.path,
                    type: 'web-broadcastable',
                    url: `file://${path.resolve(item.path)}`
                });
            }
        });
        
        return broadcastable;
    }
    
    getInteractiveWorlds() {
        const interactive = [];
        
        // JavaScript and Python files can be interactive
        [...this.engines, ...this.games].forEach(([name, item]) => {
            if (item.extension === '.js' || item.extension === '.py') {
                interactive.push({
                    name,
                    path: item.path,
                    type: item.extension === '.js' ? 'node-interactive' : 'python-interactive',
                    startCommand: item.extension === '.js' ? `node ${item.path}` : `python3 ${item.path}`
                });
            }
        });
        
        return interactive;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }
    
    // Method to start any discovered world/engine/game
    async startWorld(name) {
        const allItems = new Map([
            ...this.worlds,
            ...this.engines, 
            ...this.games,
            ...this.interfaces
        ]);
        
        const item = allItems.get(name);
        if (!item) {
            return { success: false, error: 'World not found' };
        }
        
        try {
            if (item.extension === '.js') {
                console.log(`🚀 Starting JavaScript world: ${name}`);
                const process = spawn('node', [item.path], { stdio: 'inherit' });
                return { success: true, process, type: 'node' };
                
            } else if (item.extension === '.py') {
                console.log(`🐍 Starting Python world: ${name}`);
                const process = spawn('python3', [item.path], { stdio: 'inherit' });
                return { success: true, process, type: 'python' };
                
            } else if (item.extension === '.html') {
                console.log(`🌐 Opening web world: ${name}`);
                const { spawn } = require('child_process');
                spawn('open', [item.path]);
                return { success: true, type: 'web' };
                
            } else {
                return { success: false, error: 'Unsupported world type' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Method to get world info
    getWorldInfo(name) {
        const allItems = new Map([
            ...this.worlds,
            ...this.engines,
            ...this.games, 
            ...this.interfaces
        ]);
        
        return allItems.get(name) || null;
    }
    
    // Get all worlds as a simple list
    getAllWorlds() {
        const all = [];
        
        this.worlds.forEach((world, name) => all.push({ name, ...world, category: 'world' }));
        this.engines.forEach((engine, name) => all.push({ name, ...engine, category: 'engine' }));
        this.games.forEach((game, name) => all.push({ name, ...game, category: 'game' }));
        this.interfaces.forEach((interfaceItem, name) => all.push({ name, ...interfaceItem, category: 'interface' }));
        
        return all;
    }
}

// Run discovery if called directly
if (require.main === module) {
    console.log(`\n🌍 WORLD DISCOVERY ENGINE 🌍`);
    console.log(`=============================\n`);
    console.log(`Scanning for ALL worlds, engines, games, and interfaces...`);
    console.log(`Making everything broadcastable and interactive!\n`);
    
    const discovery = new WorldDiscoveryEngine();
    
    // Show summary
    setTimeout(() => {
        console.log('\n📊 DISCOVERY COMPLETE!');
        console.log(`Total items found: ${discovery.getAllWorlds().length}`);
        console.log(`Broadcastable: ${discovery.getBroadcastableWorlds().length}`);
        console.log(`Interactive: ${discovery.getInteractiveWorlds().length}`);
        console.log('\n💡 Use world-map.json to see all discovered worlds');
    }, 1000);
}

module.exports = WorldDiscoveryEngine;
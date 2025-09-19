#!/usr/bin/env node

/**
 * TREASURE MAP VIEWER
 * View escape locations based on key permissions
 */

const fs = require('fs').promises;
const path = require('path');

class TreasureMapViewer {
    constructor(keyPath) {
        this.keyPath = keyPath;
        this.key = null;
        this.treasureMap = null;
    }
    
    async loadKey() {
        const keyData = await fs.readFile(this.keyPath, 'utf-8');
        this.key = JSON.parse(keyData);
        console.log(`🔑 Loaded ${this.key.keyType} key`);
    }
    
    async loadTreasureMap() {
        const mapData = await fs.readFile('escape-treasure-map.md', 'utf-8');
        this.treasureMap = mapData;
    }
    
    displayMap() {
        console.log('\n🗺️ TREASURE MAP VIEW:\n');
        
        if (this.key.keyType === 'public') {
            // Public view - hide escape details
            let cleanMap = this.treasureMap
                .replace(/blue.*?\/>.*?$/gm, '[REDACTED]')
                .replace(/🔴.*?DANGER ZONE.*?$/gm, '🟢 SAFE ZONE')
                .replace(/escape|leak|danger/gi, '[HIDDEN]');
            
            console.log(cleanMap);
            console.log('\n⚠️ Some information hidden - Public View');
            
        } else if (this.key.keyType === 'private') {
            // Superuser view - show everything with highlights
            let enhancedMap = this.treasureMap
                .replace(/(blue.*?\/\>)/g, '\x1b[34m\x1b[43m$1\x1b[0m')
                .replace(/(DANGER|LEAK|ESCAPE)/g, '\x1b[31m\x1b[1m$1\x1b[0m');
            
            console.log(enhancedMap);
            console.log('\n🔓 Full access granted - Superuser View');
            console.log('\n💡 Blue highlighted areas are clickable in browser view');
        }
    }
    
    async view() {
        await this.loadKey();
        await this.loadTreasureMap();
        this.displayMap();
    }
}

// Parse command line args
const args = process.argv.slice(2);
const keyArg = args.find(arg => arg.startsWith('--key='));

if (!keyArg) {
    console.error('Usage: node view-treasure-map.js --key=<path-to-key>');
    process.exit(1);
}

const keyPath = keyArg.split('=')[1];
const viewer = new TreasureMapViewer(keyPath);
viewer.view().catch(console.error);

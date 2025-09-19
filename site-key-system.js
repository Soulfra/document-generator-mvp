#!/usr/bin/env node

/**
 * SITE KEY SYSTEM
 * PGP-style public/private view keys for escape visibility control
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SiteKeySystem {
    constructor() {
        this.keys = {
            public: null,
            superuser: null
        };
        
        this.viewConfigs = {
            public: {
                keyType: "public",
                permissions: ["read", "view_public"],
                exportFormats: ["json", "html", "markdown"],
                visibleLayers: ["public", "documentation"],
                escapeVisibility: "hidden",
                transformEscapes: true,
                hideDebugInfo: true,
                watermark: "PUBLIC VIEW"
            },
            superuser: {
                keyType: "private",
                permissions: ["read", "write", "debug", "fix", "admin"],
                exportFormats: ["*"],
                visibleLayers: ["*"],
                escapeVisibility: "highlighted",
                transformEscapes: false,
                hideDebugInfo: false,
                debugFeatures: {
                    showEscapePatterns: true,
                    highlightColor: "blue",
                    clickThroughAreas: true,
                    statusBarLeaks: true,
                    treasureMapAccess: true
                },
                watermark: "SUPERUSER VIEW - CONFIDENTIAL"
            }
        };
    }
    
    async generateKeys() {
        console.log('🔑 Generating Site Keys...\n');
        
        // Generate public view key
        this.keys.public = await this.generateKey('public');
        await this.saveKey('public-view.key', this.keys.public);
        
        // Generate superuser key
        this.keys.superuser = await this.generateKey('superuser');
        await this.saveKey('super-user.key', this.keys.superuser);
        
        console.log('✅ Keys generated successfully!\n');
        
        // Display key info
        this.displayKeyInfo();
    }
    
    async generateKey(type) {
        const config = this.viewConfigs[type];
        const timestamp = new Date().toISOString();
        
        // Generate unique signature
        const signatureData = JSON.stringify({
            type,
            timestamp,
            config,
            random: crypto.randomBytes(32).toString('hex')
        });
        
        const signature = crypto
            .createHash('sha256')
            .update(signatureData)
            .digest('base64');
        
        return {
            ...config,
            signature: `SHA256:${signature}`,
            created: timestamp,
            version: "1.0.0",
            algorithm: "sha256"
        };
    }
    
    async saveKey(filename, keyData) {
        const keyPath = path.join(__dirname, 'keys', filename);
        
        // Ensure keys directory exists
        await fs.mkdir(path.dirname(keyPath), { recursive: true });
        
        // Save key with proper formatting
        await fs.writeFile(
            keyPath,
            JSON.stringify(keyData, null, 2),
            'utf-8'
        );
        
        console.log(`📄 Saved: keys/${filename}`);
    }
    
    displayKeyInfo() {
        console.log('🔓 PUBLIC VIEW KEY:');
        console.log('  - Read-only access');
        console.log('  - Escapes automatically hidden');
        console.log('  - Clean export formats');
        console.log('  - No debug information\n');
        
        console.log('🔐 SUPERUSER KEY:');
        console.log('  - Full admin access');
        console.log('  - Blue /> escapes highlighted');
        console.log('  - Click-through debug areas');
        console.log('  - Complete treasure map access');
        console.log('  - All export formats available\n');
    }
    
    async createExportConfigs() {
        console.log('📤 Creating Export Configurations...\n');
        
        // Public export config
        const publicExport = {
            view: "public",
            hideEscapes: true,
            cleanOutput: true,
            format: {
                removeDebugInfo: true,
                sanitizeOutput: true,
                escapeHandler: "auto-fix",
                visibleSections: [
                    "summary",
                    "publicContent", 
                    "documentation"
                ],
                excludePatterns: [
                    "debug",
                    "private",
                    "internal",
                    "escape",
                    "leak"
                ]
            },
            transformations: {
                "/>": "FIXED",
                "&gt;": ">",
                "&lt;": "<",
                "&amp;": "&",
                "blue": "default",
                "cursor: pointer": "cursor: default"
            },
            watermark: {
                enabled: true,
                text: "PUBLIC EXPORT",
                position: "bottom-right"
            }
        };
        
        // Superuser export config
        const superuserExport = {
            view: "superuser",
            hideEscapes: false,
            preserveDebug: true,
            format: {
                includeDebugInfo: true,
                preserveRawOutput: true,
                escapeHandler: "highlight",
                visibleSections: ["*"],
                includeMetadata: {
                    escapeLocations: true,
                    treasureMap: true,
                    fixSuggestions: true,
                    clickHandlers: true
                }
            },
            transformations: {
                "/>": "<span class='escape-highlight' style='color:blue;background:yellow;cursor:pointer;' onclick='showEscapeDetails(this)'>/></span>",
                "LEAKED": "<span class='leak-indicator' style='color:red;font-weight:bold;'>LEAKED</span>"
            },
            clickHandlers: {
                onEscapeClick: "showFixOptions",
                onTreasureClick: "navigateToSource",
                onLeakClick: "inspectStatusBar"
            },
            watermark: {
                enabled: true,
                text: "SUPERUSER EXPORT - CONFIDENTIAL",
                position: "top-center",
                style: "color:red;font-weight:bold;"
            }
        };
        
        // Save configs
        await fs.writeFile(
            'export-config-public.json',
            JSON.stringify(publicExport, null, 2)
        );
        console.log('📄 Saved: export-config-public.json');
        
        await fs.writeFile(
            'export-config-superuser.json',
            JSON.stringify(superuserExport, null, 2)
        );
        console.log('📄 Saved: export-config-superuser.json\n');
    }
    
    async createViewerScript() {
        console.log('👁️ Creating Treasure Map Viewer...\n');
        
        const viewerScript = `#!/usr/bin/env node

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
        console.log(\`🔑 Loaded \${this.key.keyType} key\`);
    }
    
    async loadTreasureMap() {
        const mapData = await fs.readFile('escape-treasure-map.md', 'utf-8');
        this.treasureMap = mapData;
    }
    
    displayMap() {
        console.log('\\n🗺️ TREASURE MAP VIEW:\\n');
        
        if (this.key.keyType === 'public') {
            // Public view - hide escape details
            let cleanMap = this.treasureMap
                .replace(/blue.*?\\/>.*?$/gm, '[REDACTED]')
                .replace(/🔴.*?DANGER ZONE.*?$/gm, '🟢 SAFE ZONE')
                .replace(/escape|leak|danger/gi, '[HIDDEN]');
            
            console.log(cleanMap);
            console.log('\\n⚠️ Some information hidden - Public View');
            
        } else if (this.key.keyType === 'private') {
            // Superuser view - show everything with highlights
            let enhancedMap = this.treasureMap
                .replace(/(blue.*?\\/\\>)/g, '\\x1b[34m\\x1b[43m$1\\x1b[0m')
                .replace(/(DANGER|LEAK|ESCAPE)/g, '\\x1b[31m\\x1b[1m$1\\x1b[0m');
            
            console.log(enhancedMap);
            console.log('\\n🔓 Full access granted - Superuser View');
            console.log('\\n💡 Blue highlighted areas are clickable in browser view');
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
`;
        
        await fs.writeFile('view-treasure-map.js', viewerScript);
        await fs.chmod('view-treasure-map.js', '755');
        console.log('📄 Saved: view-treasure-map.js');
    }
    
    async setupComplete() {
        console.log('\n' + '='.repeat(50));
        console.log('✅ SITE KEY SYSTEM SETUP COMPLETE!');
        console.log('='.repeat(50) + '\n');
        
        console.log('📁 Files created:');
        console.log('  - keys/public-view.key');
        console.log('  - keys/super-user.key');
        console.log('  - export-config-public.json');
        console.log('  - export-config-superuser.json');
        console.log('  - view-treasure-map.js\n');
        
        console.log('🚀 Quick Start Commands:');
        console.log('  # View as public user');
        console.log('  node view-treasure-map.js --key=keys/public-view.key\n');
        console.log('  # View as superuser (see blue escapes)');
        console.log('  node view-treasure-map.js --key=keys/super-user.key\n');
        
        console.log('📤 Export Commands:');
        console.log('  # Export for public');
        console.log('  node export-treasure.js --config=export-config-public.json\n');
        console.log('  # Export for superuser');
        console.log('  node export-treasure.js --config=export-config-superuser.json\n');
    }
}

// Run setup
const keySystem = new SiteKeySystem();

async function setup() {
    await keySystem.generateKeys();
    await keySystem.createExportConfigs();
    await keySystem.createViewerScript();
    await keySystem.setupComplete();
}

setup().catch(console.error);
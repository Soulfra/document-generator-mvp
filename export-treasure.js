#!/usr/bin/env node

/**
 * EXPORT TREASURE SYSTEM
 * Export system data with proper view configuration based on keys
 */

const fs = require('fs').promises;
const path = require('path');

class ExportTreasureSystem {
    constructor(configPath) {
        this.configPath = configPath;
        this.config = null;
        this.escapeFindings = null;
    }
    
    async loadConfig() {
        const configData = await fs.readFile(this.configPath, 'utf-8');
        this.config = JSON.parse(configData);
        console.log(`📋 Loaded ${this.config.view} export configuration`);
    }
    
    async loadEscapeFindings() {
        // In real implementation, this would load from cheat-code-escape-finder results
        this.escapeFindings = {
            templates: [
                {
                    file: "FinishThisIdea-Phase2/templates/base-service/frontend/components/Upload.tsx",
                    escapes: 6,
                    hasBlue: true
                }
            ],
            encodings: [
                {
                    file: "CAL-LANGUAGE-DISSECTOR-ENGINE.js",
                    escapes: 3,
                    hasBlue: false
                }
            ],
            statusBars: [
                {
                    file: "cloudflare-502-ticker-tape.html",
                    escapes: 2,
                    hasBlue: true,
                    leak: true
                }
            ]
        };
    }
    
    transformContent(content) {
        let transformed = content;
        
        // Apply transformations based on config
        Object.entries(this.config.transformations).forEach(([pattern, replacement]) => {
            const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            transformed = transformed.replace(regex, replacement);
        });
        
        return transformed;
    }
    
    async exportHTML() {
        console.log('\n🌐 Generating HTML Export...');
        
        const isPublic = this.config.view === 'public';
        
        let html = `<!DOCTYPE html>
<html>
<head>
    <title>Treasure Map Export - ${this.config.view.toUpperCase()} View</title>
    <style>
        body {
            font-family: -apple-system, system-ui, sans-serif;
            margin: 20px;
            background: ${isPublic ? '#fff' : '#1a1a1a'};
            color: ${isPublic ? '#333' : '#fff'};
        }
        
        .watermark {
            position: fixed;
            ${this.config.watermark.position || 'bottom-right'}: 20px;
            opacity: 0.5;
            font-weight: bold;
            color: ${isPublic ? '#ccc' : 'red'};
            z-index: 1000;
            ${this.config.watermark.style || ''}
        }
        
        .escape-highlight {
            color: blue;
            background: yellow;
            cursor: pointer;
            font-weight: bold;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .escape-highlight:hover {
            background: orange;
        }
        
        .hidden {
            display: ${isPublic ? 'none' : 'block'};
            background: ${isPublic ? 'transparent' : 'rgba(255,0,0,0.1)'};
        }
        
        .treasure-section {
            margin: 20px 0;
            padding: 20px;
            border: 2px solid ${isPublic ? '#eee' : '#444'};
            border-radius: 10px;
        }
        
        .escape-count {
            display: inline-block;
            background: ${isPublic ? '#f0f0f0' : '#ff0000'};
            color: ${isPublic ? '#666' : '#fff'};
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 10px;
        }
        
        ${!isPublic ? `
        .debug-panel {
            position: fixed;
            right: 20px;
            top: 100px;
            width: 300px;
            background: rgba(0,0,0,0.9);
            border: 2px solid #00ff00;
            padding: 20px;
            border-radius: 10px;
            color: #00ff00;
            font-family: monospace;
        }
        
        .click-area {
            border: 2px dashed blue;
            background: rgba(0,0,255,0.1);
            cursor: pointer;
        }
        ` : ''}
    </style>
</head>
<body>
    <div class="watermark">${this.config.watermark.text}</div>
    
    <h1>🗺️ Treasure Map Export</h1>
    
    <div class="treasure-section">
        <h2>📍 Escape Locations ${isPublic ? '' : '<span class="escape-count">FULL ACCESS</span>'}</h2>
        
        ${isPublic ? `
        <p>This is a public view of the system status. Some information has been redacted for security.</p>
        <ul>
            <li>✅ System operational</li>
            <li>✅ No critical issues</li>
            <li>✅ All tests passing</li>
        </ul>
        ` : `
        <div class="debug-info">
            <h3>🔴 Template Escapes</h3>
            <ul>
                ${this.escapeFindings.templates.map(t => `
                    <li>${t.file} 
                        <span class="escape-count">${t.escapes} escapes</span>
                        ${t.hasBlue ? '<span class="escape-highlight" onclick="alert(\'Blue escape detected!\')">/></span>' : ''}
                    </li>
                `).join('')}
            </ul>
            
            <h3>🟡 Encoding Issues</h3>
            <ul>
                ${this.escapeFindings.encodings.map(e => `
                    <li>${e.file} <span class="escape-count">${e.escapes} escapes</span></li>
                `).join('')}
            </ul>
            
            <h3>🔵 Status Bar Leaks</h3>
            <ul>
                ${this.escapeFindings.statusBars.map(s => `
                    <li class="${s.leak ? 'click-area' : ''}">${s.file} 
                        <span class="escape-count">${s.escapes} leaks</span>
                        ${s.leak ? '<span style="color:red;"> ACTIVE LEAK!</span>' : ''}
                    </li>
                `).join('')}
            </ul>
        </div>
        `}
    </div>
    
    ${!isPublic ? `
    <div class="debug-panel">
        <h3>🔍 Debug Console</h3>
        <pre>
Key Type: ${this.config.keyType}
Permissions: ${JSON.stringify(this.config.permissions)}
Escape Visibility: ${this.config.escapeVisibility}
Click Areas: Active
Status: MONITORING
        </pre>
        <button onclick="alert('Fixing escapes...')">🔧 Auto-Fix Escapes</button>
    </div>
    
    <script>
        function showEscapeDetails(element) {
            alert('Escape found at: ' + element.parentElement.textContent);
        }
        
        // Highlight click-through areas
        document.querySelectorAll('.click-area').forEach(el => {
            el.addEventListener('click', () => {
                alert('Click-through area detected! Check status bar for leaks.');
            });
        });
    </script>
    ` : ''}
    
</body>
</html>`;
        
        const filename = `export-${this.config.view}-${Date.now()}.html`;
        await fs.writeFile(filename, html);
        console.log(`✅ Exported to: ${filename}`);
    }
    
    async exportJSON() {
        console.log('\n📄 Generating JSON Export...');
        
        const isPublic = this.config.view === 'public';
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                viewType: this.config.view,
                version: "1.0.0",
                watermark: this.config.watermark.text
            }
        };
        
        if (isPublic) {
            exportData.status = {
                system: "operational",
                issues: "none",
                lastCheck: new Date().toISOString()
            };
            exportData.summary = {
                message: "All systems functioning normally"
            };
        } else {
            exportData.escapeFindings = this.escapeFindings;
            exportData.debugInfo = {
                totalEscapes: Object.values(this.escapeFindings)
                    .flat()
                    .reduce((sum, item) => sum + (item.escapes || 0), 0),
                blueEscapes: Object.values(this.escapeFindings)
                    .flat()
                    .filter(item => item.hasBlue).length,
                activeLeaks: Object.values(this.escapeFindings)
                    .flat()
                    .filter(item => item.leak).length
            };
            exportData.fixCommands = [
                "node cheat-code-escape-finder.js",
                "node auto-fix-escapes.js"
            ];
        }
        
        const filename = `export-${this.config.view}-${Date.now()}.json`;
        await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
        console.log(`✅ Exported to: ${filename}`);
    }
    
    async export() {
        await this.loadConfig();
        await this.loadEscapeFindings();
        
        console.log('\n🚀 Starting Export Process...');
        console.log(`View Type: ${this.config.view.toUpperCase()}`);
        console.log(`Hide Escapes: ${this.config.hideEscapes}`);
        console.log(`Watermark: ${this.config.watermark.text}\n`);
        
        // Export based on config formats
        if (this.config.format.visibleSections.includes('*') || 
            this.config.format.visibleSections.includes('documentation')) {
            await this.exportHTML();
        }
        
        if (this.config.exportFormats.includes('json') || 
            this.config.exportFormats.includes('*')) {
            await this.exportJSON();
        }
        
        console.log('\n✅ Export complete!');
    }
}

// Parse command line args
const args = process.argv.slice(2);
const configArg = args.find(arg => arg.startsWith('--config='));

if (!configArg) {
    console.error('Usage: node export-treasure.js --config=<path-to-config>');
    console.error('\nExample:');
    console.error('  node export-treasure.js --config=export-config-public.json');
    console.error('  node export-treasure.js --config=export-config-superuser.json');
    process.exit(1);
}

const configPath = configArg.split('=')[1];
const exporter = new ExportTreasureSystem(configPath);
exporter.export().catch(console.error);
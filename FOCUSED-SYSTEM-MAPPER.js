#!/usr/bin/env node

/**
 * 🎯 FOCUSED SYSTEM MAPPER
 * 
 * Instead of scanning 47,000+ files, let's focus on the key systems
 * the user mentioned: phpBB forums, Cal gacha, character routing,
 * and multi-layer architecture.
 */

const fs = require('fs').promises;
const path = require('path');

class FocusedSystemMapper {
    constructor() {
        this.keyFiles = {};
        this.rootDir = process.cwd();
    }
    
    async mapKeySystems() {
        console.log('🎯 FOCUSED SYSTEM MAPPER');
        console.log('========================');
        
        // Key systems to find
        const keySystemPatterns = {
            'phpBB Forums': [
                'cal-forum-server.js',
                'phpbb-cal-forum.html', 
                'api-to-forum-bridge.js',
                'start-cal-forum.sh'
            ],
            'Cal Gacha Systems': [
                'cal-gacha-roaster.js',
                'cal-api-reasoning-engine.js',
                'cal-system-demo.js'
            ],
            'Character Systems': [
                'character-router-system.js',
                'character-command-interface.js',
                'unified-character-tool.js',
                'add-character-tables.sql'
            ],
            'Multi-Layer Architecture': [
                'MATTHEW-MICHAEL-MAUER-51-LAYER-SYSTEM.js',
                'EXECUTE-11-LAYERS.js'
            ],
            'Dashboard Systems': [
                'unified-live-dashboard.html',
                'master-dashboard-orchestrator.html',
                'ai-agent-empire-dashboard.html'
            ],
            'Integration Systems': [
                'workflow-orchestration-engine.js',
                'unified-orchestration-system.js',
                'smart-orchestrator.js'
            ]
        };
        
        for (const [category, files] of Object.entries(keySystemPatterns)) {
            console.log(`\n🔍 Looking for ${category}...`);
            this.keyFiles[category] = {};
            
            for (const filename of files) {
                const found = await this.findFile(filename);
                this.keyFiles[category][filename] = found;
                
                if (found.exists) {
                    console.log(`  ✅ ${filename}`);
                    if (found.isExecutable) console.log(`     🚀 Executable`);
                    if (found.hasServer) console.log(`     🌐 Has server (port ${found.port})`);
                } else {
                    console.log(`  ❌ ${filename} - NOT FOUND`);
                }
            }
        }
        
        await this.generateReport();
        return this.keyFiles;
    }
    
    async findFile(filename) {
        try {
            const fullPath = path.join(this.rootDir, filename);
            const stats = await fs.stat(fullPath);
            const content = await fs.readFile(fullPath, 'utf8').catch(() => '');
            
            return {
                exists: true,
                path: fullPath,
                size: stats.size,
                lastModified: stats.mtime,
                isExecutable: content.includes('#!/usr/bin/env node') || 
                             content.includes('if (require.main === module)'),
                hasServer: content.includes('app.listen') || 
                          content.includes('createServer') ||
                          content.includes('.listen('),
                port: this.extractPort(content),
                preview: content.substring(0, 500)
            };
        } catch (error) {
            return { exists: false, error: error.message };
        }
    }
    
    extractPort(content) {
        const portMatch = content.match(/(?:port|listen)\s*[=:]\s*(\d+)/i) ||
                         content.match(/.listen\s*\(\s*(\d+)/);
        return portMatch ? parseInt(portMatch[1]) : null;
    }
    
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {},
            systems: this.keyFiles,
            recommendations: []
        };
        
        // Calculate summary
        for (const [category, files] of Object.entries(this.keyFiles)) {
            const total = Object.keys(files).length;
            const found = Object.values(files).filter(f => f.exists).length;
            const executable = Object.values(files).filter(f => f.exists && f.isExecutable).length;
            const hasServer = Object.values(files).filter(f => f.exists && f.hasServer).length;
            
            report.summary[category] = {
                total,
                found,
                missing: total - found,
                executable,
                hasServer,
                completeness: Math.round((found / total) * 100)
            };
        }
        
        // Generate recommendations
        const phpbbComplete = report.summary['phpBB Forums']?.completeness || 0;
        const gachaComplete = report.summary['Cal Gacha Systems']?.completeness || 0;
        const characterComplete = report.summary['Character Systems']?.completeness || 0;
        
        if (phpbbComplete >= 75 && gachaComplete >= 75 && characterComplete >= 75) {
            report.recommendations.push({
                type: 'INTEGRATION_READY',
                description: 'Core systems (Forum + Gacha + Characters) are 75%+ complete',
                action: 'Build integration layer to connect these systems'
            });
        }
        
        if (report.summary['Multi-Layer Architecture']?.found >= 1) {
            report.recommendations.push({
                type: 'LAYER_SYSTEM_FOUND',
                description: 'Multi-layer architecture system exists',
                action: 'Map layer dependencies and initialization order'
            });
        }
        
        // Save report
        await fs.writeFile('FOCUSED-SYSTEM-REPORT.json', JSON.stringify(report, null, 2));
        
        // Generate human-readable summary
        await this.generateSummary(report);
        
        console.log('\n📊 REPORT SUMMARY');
        console.log('=================');
        for (const [category, stats] of Object.entries(report.summary)) {
            console.log(`${category}: ${stats.found}/${stats.total} found (${stats.completeness}% complete)`);
            if (stats.executable > 0) console.log(`  🚀 ${stats.executable} executable`);
            if (stats.hasServer > 0) console.log(`  🌐 ${stats.hasServer} have servers`);
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.forEach(r => {
                console.log(`  ${r.type}: ${r.description}`);
            });
        }
    }
    
    async generateSummary(report) {
        const markdown = `# 🎯 Focused System Analysis Report

**Generated**: ${report.timestamp}

## 📊 System Completeness

| System Category | Found | Total | Complete | Executable | Servers |
|----------------|--------|-------|----------|------------|---------|
${Object.entries(report.summary).map(([name, stats]) => 
  `| **${name}** | ${stats.found} | ${stats.total} | ${stats.completeness}% | ${stats.executable} | ${stats.hasServer} |`
).join('\n')}

## 🎯 Key Findings

${Object.entries(this.keyFiles).map(([category, files]) => {
  const foundFiles = Object.entries(files).filter(([_, file]) => file.exists);
  const missingFiles = Object.entries(files).filter(([_, file]) => !file.exists);
  
  return `### ${category}

**Found (${foundFiles.length}):**
${foundFiles.map(([name, file]) => 
  `- ✅ **${name}** ${file.isExecutable ? '🚀' : ''} ${file.hasServer ? `🌐 (port ${file.port})` : ''}`
).join('\n')}

${missingFiles.length > 0 ? `**Missing (${missingFiles.length}):**
${missingFiles.map(([name]) => `- ❌ ${name}`).join('\n')}` : ''}
`;
}).join('\n')}

## 💡 Integration Recommendations

${report.recommendations.map(r => 
  `### ${r.type}\n${r.description}\n\n**Action**: ${r.action}`
).join('\n\n')}

---
*Generated by Focused System Mapper*
`;
        
        await fs.writeFile('FOCUSED-SYSTEM-SUMMARY.md', markdown);
    }
}

if (require.main === module) {
    const mapper = new FocusedSystemMapper();
    mapper.mapKeySystems()
        .then(() => {
            console.log('\n✅ Focused analysis complete!');
            console.log('📄 Report: FOCUSED-SYSTEM-REPORT.json');
            console.log('📋 Summary: FOCUSED-SYSTEM-SUMMARY.md');
        })
        .catch(console.error);
}

module.exports = { FocusedSystemMapper };
/**
 * Find Key Documents
 * Direct approach to finding the most important documents in the project
 */

const fs = require('fs').promises;
const path = require('path');

async function findKeyDocuments() {
    const projectRoot = process.cwd();
    const keyDocs = [];
    
    console.log('🔍 Searching for key documents...');
    
    // Get all files in root directory
    try {
        const files = await fs.readdir(projectRoot);
        
        for (const file of files) {
            const filePath = path.join(projectRoot, file);
            
            try {
                const stats = await fs.stat(filePath);
                
                if (stats.isFile()) {
                    const isImportant = 
                        // Core config files
                        file === 'package.json' ||
                        file === 'docker-compose.yml' ||
                        file.startsWith('.env') ||
                        file === 'index.js' ||
                        file === 'app.js' ||
                        file === 'server.js' ||
                        
                        // Documentation
                        file === 'README.md' ||
                        file.toLowerCase().includes('readme') ||
                        file.startsWith('CLAUDE') ||
                        
                        // Important setup/deployment
                        file.includes('setup') ||
                        file.includes('launch') ||
                        file.includes('start') ||
                        file.includes('deploy') ||
                        
                        // System status files
                        file.includes('STATUS') ||
                        file.includes('COMPLETE') ||
                        file.includes('SUMMARY') ||
                        
                        // Architecture docs
                        file.includes('ARCHITECTURE') ||
                        file.includes('INTEGRATION') ||
                        file.includes('SYSTEM');
                    
                    if (isImportant) {
                        const content = stats.size < 50000 ? await fs.readFile(filePath, 'utf8').catch(() => null) : null;
                        
                        keyDocs.push({
                            name: file,
                            path: filePath,
                            size: stats.size,
                            modified: stats.mtime,
                            preview: content ? content.slice(0, 200) + '...' : null,
                            type: getDocType(file)
                        });
                    }
                }
            } catch (error) {
                // Skip files we can't access
            }
        }
        
        // Sort by importance and modification time
        keyDocs.sort((a, b) => {
            const aImportance = getImportanceScore(a.name);
            const bImportance = getImportanceScore(b.name);
            
            if (aImportance !== bImportance) {
                return bImportance - aImportance;
            }
            
            return b.modified - a.modified;
        });
        
        // Generate report
        const report = `
# 🗂️ Key Documents Found

**Total Important Documents**: ${keyDocs.length}
**Generated**: ${new Date().toLocaleString()}

## 📋 High Priority Files

${keyDocs.filter(doc => getImportanceScore(doc.name) >= 5).map(doc => 
    `### ${doc.name} (${(doc.size/1024).toFixed(1)}KB)
- **Type**: ${doc.type}
- **Modified**: ${doc.modified.toLocaleString()}
- **Preview**: ${doc.preview || 'Binary file'}`
).join('\n\n')}

## 📄 All Important Documents

${keyDocs.map(doc => 
    `- **${doc.name}** (${doc.type}) - ${(doc.size/1024).toFixed(1)}KB - ${doc.modified.toLocaleDateString()}`
).join('\n')}

## 🎯 Quick Start Recommendations

Based on the files found, here's where to start:

1. **Core Configuration**: ${keyDocs.filter(d => d.type === 'config').map(d => d.name).join(', ') || 'None found'}
2. **Documentation**: ${keyDocs.filter(d => d.type === 'documentation').map(d => d.name).slice(0, 3).join(', ') || 'None found'}
3. **System Status**: ${keyDocs.filter(d => d.type === 'status').map(d => d.name).slice(0, 3).join(', ') || 'None found'}

## 🚀 Next Steps for Widget System

To get your floating widget system working with your documents:

1. **Start Docker Services**: Look for docker-compose.yml and run \`docker-compose up -d\`
2. **Check Service Status**: Review any STATUS or COMPLETE files
3. **Configure Widget Integration**: Use the widget-integration-layer.js we created
4. **Connect to Document Processing**: Link documents to the widget morphing system

---
*Found ${keyDocs.length} important documents out of thousands in your project*
`;

        // Save results
        await fs.writeFile(path.join(projectRoot, 'KEY-DOCUMENTS-FOUND.md'), report);
        await fs.writeFile(path.join(projectRoot, 'key-documents-data.json'), JSON.stringify(keyDocs, null, 2));
        
        console.log(`✅ Found ${keyDocs.length} key documents`);
        console.log(`📄 Report saved: KEY-DOCUMENTS-FOUND.md`);
        
        // Show top 10 most important
        console.log('\n🎯 Top 10 Most Important Files:');
        keyDocs.slice(0, 10).forEach((doc, i) => {
            console.log(`  ${i+1}. ${doc.name} (${doc.type}) - ${(doc.size/1024).toFixed(1)}KB`);
        });
        
        return keyDocs;
        
    } catch (error) {
        console.error('❌ Failed to find documents:', error);
        throw error;
    }
}

function getDocType(filename) {
    const name = filename.toLowerCase();
    
    if (name === 'package.json' || name.includes('docker-compose') || name.startsWith('.env')) {
        return 'config';
    }
    
    if (name.includes('readme') || name.startsWith('claude')) {
        return 'documentation';  
    }
    
    if (name.includes('status') || name.includes('complete') || name.includes('summary')) {
        return 'status';
    }
    
    if (name.includes('setup') || name.includes('launch') || name.includes('deploy')) {
        return 'deployment';
    }
    
    if (name.includes('architecture') || name.includes('system') || name.includes('integration')) {
        return 'architecture';
    }
    
    return 'general';
}

function getImportanceScore(filename) {
    const name = filename.toLowerCase();
    
    // Highest priority
    if (name === 'package.json' || name === 'docker-compose.yml' || name === 'readme.md' || name === 'claude.md') {
        return 10;
    }
    
    // High priority  
    if (name.startsWith('claude.') || name.includes('setup') || name.includes('launch')) {
        return 8;
    }
    
    // Medium-high priority
    if (name.includes('status') || name.includes('complete') || name.includes('integration')) {
        return 6;
    }
    
    // Medium priority
    if (name.includes('readme') || name.includes('architecture') || name.includes('system')) {
        return 4;
    }
    
    // Lower priority
    return 2;
}

// Run if called directly
if (require.main === module) {
    findKeyDocuments()
        .then(docs => {
            console.log(`\n🎉 Document discovery complete! Found ${docs.length} important files.`);
        })
        .catch(error => {
            console.error('❌ Discovery failed:', error);
            process.exit(1);
        });
}

module.exports = { findKeyDocuments };
#!/usr/bin/env node

/**
 * 🚀 Simple Automation Demo
 * Demonstrates the end-to-end automated document-to-MVP process
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 DOCUMENT GENERATOR - FULL AUTOMATION DEMO');
console.log('============================================');

async function automateDocumentToMVP(documentPath) {
    const startTime = Date.now();
    
    try {
        console.log(`\n📄 Processing: ${documentPath}`);
        
        // Step 1: Read and analyze document
        console.log('\n🔍 Stage 1: Document Analysis');
        const document = await fs.readFile(documentPath, 'utf8');
        const analysis = analyzeDocument(document, documentPath);
        
        console.log(`   📊 Document size: ${document.length} characters`);
        console.log(`   🎯 Intent: ${analysis.intent}`);
        console.log(`   📊 Complexity: ${analysis.complexity}`);
        console.log(`   ✨ Features: ${analysis.features.length}`);
        
        // Step 2: Create processing chunks
        console.log('\n🧩 Stage 2: Chunked Processing');
        const chunks = createProcessingChunks(analysis);
        console.log(`   🧩 Created ${chunks.length} processing chunks`);
        
        // Step 3: Generate code components
        console.log('\n⚙️ Stage 3: Component Generation');
        const components = await generateComponents(chunks);
        console.log(`   🔧 Generated ${components.length} components`);
        
        // Step 4: Assemble MVP
        console.log('\n🔗 Stage 4: MVP Assembly');
        const mvp = assembleComponents(components, analysis);
        console.log(`   📦 Assembled MVP with ${Object.keys(mvp.files).length} files`);
        
        // Step 5: Package for deployment
        console.log('\n📦 Stage 5: Packaging');
        const packagedMVP = await packageMVP(mvp, documentPath);
        
        const totalTime = Date.now() - startTime;
        
        console.log('\n🎉 AUTOMATION COMPLETE!');
        console.log('=======================');
        console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`📁 Output: ${packagedMVP.path}`);
        console.log(`🌐 Demo URL: http://localhost:3000`);
        console.log(`📋 Files: ${packagedMVP.fileCount}`);
        
        return packagedMVP;
        
    } catch (error) {
        console.error('❌ Automation failed:', error.message);
        throw error;
    }
}

function analyzeDocument(content, filePath) {
    const ext = extname(filePath);
    const contentLower = content.toLowerCase();
    
    // Detect intent
    let intent = 'startup-pitch-deck';
    if (contentLower.includes('api') || contentLower.includes('backend')) {
        intent = 'api-backend';
    } else if (contentLower.includes('frontend') || contentLower.includes('ui')) {
        intent = 'frontend-app';
    } else if (contentLower.includes('technical') || contentLower.includes('architecture')) {
        intent = 'technical-spec';
    }
    
    // Assess complexity
    const technicalTerms = (content.match(/\b(api|database|authentication|real-time|integration|analytics)\b/gi) || []).length;
    const complexity = technicalTerms > 6 ? 'high' : technicalTerms > 3 ? 'medium' : 'simple';
    
    // Extract features
    const features = extractFeatures(content);
    
    return {
        intent,
        complexity,
        features,
        requirements: extractRequirements(content),
        technology: 'web'
    };
}

function extractFeatures(content) {
    const features = [];
    
    // Look for bullet points and numbered lists
    const listItems = content.match(/^\s*[-*+]\s+(.+)$/gm) || [];
    const numberedItems = content.match(/^\s*\d+\.\s+(.+)$/gm) || [];
    
    [...listItems, ...numberedItems].forEach(item => {
        const cleanItem = item.replace(/^\s*[-*+\d.]\s*/, '').trim();
        if (cleanItem.length > 10 && cleanItem.length < 100) {
            features.push(cleanItem);
        }
    });
    
    // Look for header sections as features
    const headers = content.match(/^#+\s+(.+)$/gm) || [];
    headers.forEach(header => {
        const cleanHeader = header.replace(/^#+\s*/, '').trim();
        if (cleanHeader.length > 5 && cleanHeader.length < 50 && 
            !cleanHeader.toLowerCase().includes('overview') &&
            !cleanHeader.toLowerCase().includes('introduction')) {
            features.push(cleanHeader);
        }
    });
    
    // If no features found, create default ones
    if (features.length === 0) {
        features.push('User management', 'Data processing', 'User interface');
    }
    
    return features.slice(0, 8); // Limit to 8 features
}

function extractRequirements(content) {
    const requirements = [];
    
    if (content.toLowerCase().includes('database') || content.toLowerCase().includes('data')) {
        requirements.push('Database integration');
    }
    if (content.toLowerCase().includes('auth') || content.toLowerCase().includes('user')) {
        requirements.push('User authentication');
    }
    if (content.toLowerCase().includes('api') || content.toLowerCase().includes('backend')) {
        requirements.push('API development');
    }
    if (content.toLowerCase().includes('real-time') || content.toLowerCase().includes('live')) {
        requirements.push('Real-time functionality');
    }
    if (content.toLowerCase().includes('analytics') || content.toLowerCase().includes('dashboard')) {
        requirements.push('Analytics and reporting');
    }
    
    return requirements.length > 0 ? requirements : ['Web interface', 'Data storage'];
}

function createProcessingChunks(analysis) {
    const chunks = [];
    
    if (analysis.complexity === 'high' && analysis.features.length > 4) {
        // Create feature-based chunks
        const featuresPerChunk = Math.ceil(analysis.features.length / 3);
        
        for (let i = 0; i < 3; i++) {
            const start = i * featuresPerChunk;
            const end = Math.min(start + featuresPerChunk, analysis.features.length);
            
            chunks.push({
                id: `chunk_${i + 1}`,
                name: i === 0 ? 'Core Backend' : i === 1 ? 'User Interface' : 'Integration Layer',
                type: i === 0 ? 'backend' : i === 1 ? 'frontend' : 'integration',
                features: analysis.features.slice(start, end),
                priority: i + 1
            });
        }
    } else {
        // Create simple dual chunks
        chunks.push(
            {
                id: 'backend_chunk',
                name: 'Backend Services',
                type: 'backend',
                features: analysis.features.filter((_, i) => i % 2 === 0),
                priority: 1
            },
            {
                id: 'frontend_chunk', 
                name: 'Frontend Application',
                type: 'frontend',
                features: analysis.features.filter((_, i) => i % 2 === 1),
                priority: 2
            }
        );
    }
    
    return chunks;
}

async function generateComponents(chunks) {
    const components = [];
    
    for (const chunk of chunks) {
        console.log(`   🔧 Generating: ${chunk.name}`);
        
        const component = {
            id: chunk.id,
            name: chunk.name,
            type: chunk.type,
            files: {}
        };
        
        if (chunk.type === 'backend') {
            component.files = generateBackendFiles(chunk);
        } else if (chunk.type === 'frontend') {
            component.files = generateFrontendFiles(chunk);
        } else {
            component.files = generateIntegrationFiles(chunk);
        }
        
        components.push(component);
        console.log(`   ✅ Generated: ${chunk.name} (${Object.keys(component.files).length} files)`);
    }
    
    return components;
}

function generateBackendFiles(chunk) {
    const files = {};
    
    files['app.js'] = `// ${chunk.name} - Auto-generated Backend
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: '${chunk.name}',
        features: ${JSON.stringify(chunk.features)},
        timestamp: new Date().toISOString()
    });
});

// Feature endpoints
${chunk.features.map((feature, i) => `
app.get('/api/${feature.toLowerCase().replace(/[^a-z0-9]/g, '-')}', (req, res) => {
    res.json({
        feature: '${feature}',
        message: 'Feature endpoint generated automatically',
        data: { id: ${i + 1}, name: '${feature}' }
    });
});`).join('')}

app.listen(PORT, () => {
    console.log(\`🚀 ${chunk.name} running on http://localhost:\${PORT}\`);
});`;

    files['package.json'] = JSON.stringify({
        name: chunk.id,
        version: '1.0.0',
        description: `Auto-generated ${chunk.name}`,
        main: 'app.js',
        scripts: {
            start: 'node app.js',
            dev: 'nodemon app.js'
        },
        dependencies: {
            express: '^4.18.2',
            cors: '^2.8.5'
        }
    }, null, 2);
    
    return files;
}

function generateFrontendFiles(chunk) {
    const files = {};
    
    files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chunk.name}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 20px; background: #f5f7fa;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #667eea; color: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .feature-card { 
            background: white; padding: 1.5rem; border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .feature-card h3 { margin-top: 0; color: #667eea; }
        .btn { 
            background: #667eea; color: white; border: none; 
            padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; 
        }
        .btn:hover { background: #5a6fd8; }
        .status { 
            margin: 1rem 0; padding: 1rem; background: #e8f5e8; 
            border-radius: 6px; border-left: 4px solid #4caf50; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 ${chunk.name}</h1>
            <p>Auto-generated frontend application with ${chunk.features.length} features</p>
        </div>
        
        <div class="status">
            <strong>Status:</strong> <span id="status">Loading...</span>
        </div>
        
        <div class="features">
            ${chunk.features.map(feature => `
            <div class="feature-card">
                <h3>✨ ${feature}</h3>
                <p>This feature was automatically generated from your document.</p>
                <button class="btn" onclick="demonstrateFeature('${feature}')">
                    Try ${feature}
                </button>
            </div>`).join('')}
        </div>
    </div>
    
    <script>
        // Update status
        document.getElementById('status').textContent = 'Ready';
        
        function demonstrateFeature(featureName) {
            alert(\`Demonstrating: \${featureName}\nThis feature would be fully implemented in a production system.\`);
        }
        
        // Simulate real-time updates
        setInterval(() => {
            const status = document.getElementById('status');
            status.textContent = \`Active - \${new Date().toLocaleTimeString()}\`;
        }, 1000);
    </script>
</body>
</html>`;

    files['app.js'] = `// ${chunk.name} - Frontend Server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));

app.get('/api/features', (req, res) => {
    res.json({
        features: ${JSON.stringify(chunk.features)},
        component: '${chunk.name}',
        generated: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(\`🎨 ${chunk.name} running on http://localhost:\${PORT}\`);
});`;

    files['package.json'] = JSON.stringify({
        name: chunk.id,
        version: '1.0.0',
        description: `Auto-generated ${chunk.name}`,
        main: 'app.js',
        scripts: {
            start: 'node app.js'
        },
        dependencies: {
            express: '^4.18.2'
        }
    }, null, 2);
    
    return files;
}

function generateIntegrationFiles(chunk) {
    const files = {};
    
    files['integration.js'] = `// ${chunk.name} - Auto-generated Integration Layer
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Integration endpoints
app.get('/api/integrations', (req, res) => {
    res.json({
        integrations: ${JSON.stringify(chunk.features)},
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(\`🔗 ${chunk.name} running on http://localhost:\${PORT}\`);
});`;

    files['package.json'] = JSON.stringify({
        name: chunk.id,
        version: '1.0.0',
        main: 'integration.js',
        dependencies: { express: '^4.18.2' }
    }, null, 2);
    
    return files;
}

function assembleComponents(components, analysis) {
    const mvp = {
        name: 'AutoGeneratedMVP',
        type: 'full-stack-app',
        files: {},
        metadata: {
            generatedBy: 'simple-automation-demo',
            timestamp: new Date().toISOString(),
            componentCount: components.length,
            originalAnalysis: analysis
        }
    };
    
    // Merge all component files
    components.forEach(component => {
        Object.entries(component.files).forEach(([filename, content]) => {
            const uniqueName = filename === 'package.json' 
                ? 'package.json' 
                : `${component.type}-${filename}`;
            mvp.files[uniqueName] = content;
        });
    });
    
    // Create master application file
    mvp.files['master.js'] = `// Master Application - Auto-generated MVP
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));
app.use(express.json());

// Master health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        mvp: 'auto-generated',
        components: ${components.length},
        features: ${JSON.stringify(analysis.features)},
        timestamp: new Date().toISOString()
    });
});

// Component info
app.get('/api/components', (req, res) => {
    res.json({
        components: ${JSON.stringify(components.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            fileCount: Object.keys(c.files).length
        })))},
        totalFiles: ${Object.keys(mvp.files).length}
    });
});

app.listen(PORT, () => {
    console.log(\`🚀 Auto-generated MVP running on http://localhost:\${PORT}\`);
    console.log(\`🧩 Components: ${components.length}\`);
    console.log(\`📋 Open http://localhost:\${PORT} to view your MVP\`);
});`;

    // Create unified package.json
    mvp.files['package.json'] = JSON.stringify({
        name: 'auto-generated-mvp',
        version: '1.0.0',
        description: `Auto-generated MVP from document analysis`,
        main: 'master.js',
        scripts: {
            start: 'node master.js',
            'start:frontend': 'node frontend-app.js',
            'start:backend': 'node backend-app.js'
        },
        dependencies: {
            express: '^4.18.2',
            cors: '^2.8.5'
        },
        metadata: mvp.metadata
    }, null, 2);
    
    return mvp;
}

async function packageMVP(mvp, originalDocumentPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = join(__dirname, `automated-mvp-${timestamp}`);
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write all files
    for (const [filename, content] of Object.entries(mvp.files)) {
        await fs.writeFile(join(outputDir, filename), content);
    }
    
    // Create README
    const readme = `# Auto-Generated MVP

Generated from: ${basename(originalDocumentPath)}
Timestamp: ${new Date().toISOString()}

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the MVP:
   \`\`\`bash
   npm start
   \`\`\`

3. Open browser to: http://localhost:3000

## Components Generated

${mvp.metadata.componentCount} components with ${Object.keys(mvp.files).length} total files.

## Features

${mvp.metadata.originalAnalysis.features.map(f => `- ${f}`).join('\n')}

---

Generated by Document Generator Automation System
`;
    
    await fs.writeFile(join(outputDir, 'README.md'), readme);
    
    // Create quick start script
    const startScript = `#!/bin/bash
echo "🚀 Starting Auto-Generated MVP..."
npm install
npm start
`;
    
    await fs.writeFile(join(outputDir, 'start.sh'), startScript);
    await fs.chmod(join(outputDir, 'start.sh'), 0o755);
    
    return {
        path: outputDir,
        fileCount: Object.keys(mvp.files).length + 2, // +2 for README and start script
        demoUrl: 'http://localhost:3000'
    };
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const documentPath = process.argv[2];
    
    if (!documentPath) {
        console.log('Usage: node simple-automation-demo.js <document-path>');
        console.log('Example: node simple-automation-demo.js test-document.md');
        process.exit(1);
    }
    
    automateDocumentToMVP(documentPath)
        .then(result => {
            console.log('\n🎊 SUCCESS! Your document has been transformed into a working MVP!');
            console.log('\n🚀 To run your MVP:');
            console.log(`   cd ${result.path}`);
            console.log('   ./start.sh');
            console.log('\n📋 Or manually:');
            console.log(`   cd ${result.path}`);
            console.log('   npm install && npm start');
            console.log('\n🌐 Then open: http://localhost:3000');
        })
        .catch(error => {
            console.error('\n💥 FAILED:', error.message);
            process.exit(1);
        });
}
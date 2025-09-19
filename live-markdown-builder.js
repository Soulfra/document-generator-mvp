#!/usr/bin/env node

/**
 * Live Markdown Builder
 * Creates real-time, first-person documentation as the system builds itself
 * Generates verification reports in markdown format
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { marked } = require('marked');

class LiveMarkdownBuilder {
    constructor() {
        this.markdownSections = new Map();
        this.verificationSteps = [];
        this.discoveryLog = [];
        this.buildSequence = [];
        
        this.outputDir = './live-docs';
        this.currentDocument = [];
        
        // Markdown templates
        this.templates = {
            header: () => `# 🔨 Live System Build Documentation
*Generated in real-time as the system discovers itself*
*Started: ${new Date().toISOString()}*

---

## 📋 Table of Contents
1. [System Discovery](#system-discovery)
2. [Component Handshakes](#component-handshakes)
3. [Data Flow Mapping](#data-flow-mapping)
4. [Verification Results](#verification-results)
5. [Build Sequence](#build-sequence)
6. [Live Status](#live-status)

---
`,
            discovery: (service) => `### 🔍 Discovered: ${service.name}
- **Port**: ${service.port}
- **Type**: ${service.type}
- **Status**: ${service.status}
- **Time**: ${new Date().toISOString()}

\`\`\`json
${JSON.stringify(service.capabilities, null, 2)}
\`\`\`
`,
            handshake: (agreement) => `### 🤝 Handshake Established: ${agreement.service}
**Agreement ID**: ${agreement.id}

#### Data Flow
- **Input**: ${agreement.protocol.dataFlow.input.join(', ')}
- **Output**: ${agreement.protocol.dataFlow.output.join(', ')}
- **Purpose**: ${agreement.protocol.dataFlow.purpose}

#### Terms
\`\`\`yaml
${Object.entries(agreement.terms).map(([k, v]) => `${k}: ${v}`).join('\n')}
\`\`\`
`,
            verification: (step) => `### ✅ Verification: ${step.name}
- **Result**: ${step.result ? '✅ PASSED' : '❌ FAILED'}
- **Details**: ${step.details}
- **Critical**: ${step.critical ? 'Yes' : 'No'}
- **Timestamp**: ${step.timestamp}
`,
            dataFlow: (connection) => `#### ${connection.from} → ${connection.to}
- **Data**: ${connection.data}
- **Purpose**: ${connection.purpose}
`,
            buildStep: (step) => `### 🏗️ Build Step ${step.number}: ${step.action}
**Component**: ${step.component}
**Status**: ${step.status}

\`\`\`
${step.details}
\`\`\`

*Completed: ${step.timestamp}*
`
        };
        
        console.log('📝 LIVE MARKDOWN BUILDER');
        console.log('========================');
        console.log('🔨 Real-time documentation generation');
        console.log('👁️ First-person build narrative');
        console.log('✅ Live verification reports');
        console.log('');
        
        this.ensureOutputDir();
        this.connectToHandshakeLayer();
        this.startDocumentGeneration();
    }
    
    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    
    connectToHandshakeLayer() {
        console.log('📡 Connecting to handshake layer...');
        
        this.ws = new WebSocket('ws://localhost:48010');
        
        this.ws.on('open', () => {
            console.log('✅ Connected to handshake layer');
            this.ws.send(JSON.stringify({ type: 'get_journal' }));
        });
        
        this.ws.on('message', (data) => {
            const message = JSON.parse(data);
            this.handleHandshakeMessage(message);
        });
        
        this.ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            this.addBuildStep('connection_error', 'Handshake Layer', 'failed', error.message);
        });
    }
    
    handleHandshakeMessage(message) {
        switch (message.type) {
            case 'new_discovery':
                this.documentDiscovery(message.discovery);
                break;
                
            case 'journal_update':
                this.processJournalUpdate(message.markdown);
                break;
                
            case 'narrative_update':
                this.addNarrative(message.narrative);
                break;
                
            case 'discovery_update':
                this.updateSystemState(message.state);
                break;
        }
    }
    
    startDocumentGeneration() {
        // Initialize main document
        this.currentDocument.push(this.templates.header());
        
        // Add initial narrative
        this.addSection('introduction', `## 🎯 Mission Statement

I am documenting the discovery and construction of a tier-based system that transforms game mechanics into enterprise document management structures. This document is being written in real-time as I discover each component.

### What I'm Building:
1. **Tier Extraction** - Finding game hierarchies in XML data
2. **Privacy Separation** - Monero-style vaults for sensitive data
3. **Document Management** - Mapping tiers to OSS SharePoint alternatives
4. **Blockchain Verification** - On-chain proof of tier progression

Let me begin my exploration...
`);
        
        // Save initial document
        this.saveDocument();
        
        // Set up auto-save
        setInterval(() => this.saveDocument(), 5000);
    }
    
    documentDiscovery(discovery) {
        console.log(`📝 Documenting discovery: ${discovery.name}`);
        
        this.discoveryLog.push(discovery);
        
        // Add to discoveries section
        if (!this.markdownSections.has('discoveries')) {
            this.addSection('discoveries', '## 🔍 System Discovery\n\n');
        }
        
        const discoveryMd = this.templates.discovery(discovery);
        this.appendToSection('discoveries', discoveryMd);
        
        // Add narrative
        this.addNarrative(`I've discovered ${discovery.name} on port ${discovery.port}. It appears to be ${discovery.status}.`);
        
        // Update build sequence
        this.addBuildStep('service_discovery', discovery.name, discovery.status, 
            `Found ${discovery.type} service with capabilities: ${discovery.capabilities.join(', ')}`);
        
        this.saveDocument();
    }
    
    processJournalUpdate(markdown) {
        // Extract key information from journal
        const sections = markdown.split(/^##\s+/m);
        
        sections.forEach(section => {
            if (section.includes('Handshake with')) {
                this.extractHandshakeInfo(section);
            } else if (section.includes('System Connections Map')) {
                this.extractConnectionInfo(section);
            } else if (section.includes('Verification Results')) {
                this.extractVerificationInfo(section);
            }
        });
    }
    
    extractHandshakeInfo(section) {
        try {
            // Parse handshake JSON from markdown
            const jsonMatch = section.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                const agreement = JSON.parse(jsonMatch[1]);
                
                if (!this.markdownSections.has('handshakes')) {
                    this.addSection('handshakes', '## 🤝 Component Handshakes\n\n');
                }
                
                const handshakeMd = this.templates.handshake(agreement);
                this.appendToSection('handshakes', handshakeMd);
                
                this.addBuildStep('handshake_established', agreement.service, 'completed',
                    `Formal agreement established with ${agreement.service}`);
            }
        } catch (error) {
            console.error('Failed to parse handshake:', error);
        }
    }
    
    extractConnectionInfo(section) {
        // Extract mermaid diagram connections
        const mermaidMatch = section.match(/```mermaid\n([\s\S]*?)\n```/);
        if (mermaidMatch) {
            const connections = mermaidMatch[1].split('\n')
                .filter(line => line.includes('-->'))
                .map(line => {
                    const match = line.match(/(\w+\s*\w*)\s*-->\|([^|]+)\|\s*(\w+\s*\w*)/);
                    if (match) {
                        return {
                            from: match[1].trim(),
                            to: match[3].trim(),
                            data: match[2].trim()
                        };
                    }
                    return null;
                })
                .filter(conn => conn !== null);
            
            if (!this.markdownSections.has('dataflow')) {
                this.addSection('dataflow', '## 🔄 Data Flow Mapping\n\n');
            }
            
            connections.forEach(conn => {
                // Infer purpose based on data type
                conn.purpose = this.inferPurpose(conn.from, conn.to, conn.data);
                const flowMd = this.templates.dataFlow(conn);
                this.appendToSection('dataflow', flowMd);
            });
        }
    }
    
    inferPurpose(from, to, data) {
        const purposes = {
            'Tier structures': 'Organize hierarchical game data',
            'Public JSONL': 'Provide structured data for agents',
            'Vault hashes': 'Link encrypted data to blockchain',
            'Player statistics': 'Track progression and achievements'
        };
        
        return purposes[data] || 'Data synchronization';
    }
    
    extractVerificationInfo(section) {
        const verificationPattern = /\*\*(.+?)\*\*:\s*(✅ PASSED|❌ FAILED)/g;
        let match;
        
        if (!this.markdownSections.has('verification')) {
            this.addSection('verification', '## ✅ Verification Results\n\n');
        }
        
        while ((match = verificationPattern.exec(section)) !== null) {
            const verification = {
                name: match[1],
                result: match[2].includes('PASSED'),
                details: 'Automated verification',
                critical: true,
                timestamp: new Date().toISOString()
            };
            
            this.verificationSteps.push(verification);
            const verifyMd = this.templates.verification(verification);
            this.appendToSection('verification', verifyMd);
        }
    }
    
    addNarrative(narrative) {
        const timestamp = new Date().toISOString();
        const text = typeof narrative === 'string' ? narrative : narrative.text;
        
        if (!this.markdownSections.has('narrative')) {
            this.addSection('narrative', '## 📖 First-Person Narrative\n\n');
        }
        
        this.appendToSection('narrative', `> *[${timestamp}]* ${text}\n\n`);
    }
    
    updateSystemState(state) {
        if (!this.markdownSections.has('status')) {
            this.addSection('status', '## 📊 Live Status\n\n');
        }
        
        const statusMd = `### Current System State
- **Phase**: ${state.phase}
- **Discoveries**: ${state.discoveries}
- **Agreements**: ${state.agreements}
- **Connections**: ${state.connections}
- **Verifications**: ${state.verifications}

*Last updated: ${new Date().toISOString()}*
`;
        
        this.replaceSection('status', '## 📊 Live Status\n\n' + statusMd);
    }
    
    addBuildStep(action, component, status, details) {
        const step = {
            number: this.buildSequence.length + 1,
            action,
            component,
            status,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.buildSequence.push(step);
        
        if (!this.markdownSections.has('build')) {
            this.addSection('build', '## 🏗️ Build Sequence\n\n');
        }
        
        const buildMd = this.templates.buildStep(step);
        this.appendToSection('build', buildMd);
    }
    
    addSection(id, content) {
        this.markdownSections.set(id, content);
    }
    
    appendToSection(id, content) {
        const current = this.markdownSections.get(id) || '';
        this.markdownSections.set(id, current + content);
    }
    
    replaceSection(id, content) {
        this.markdownSections.set(id, content);
    }
    
    generateCompleteDocument() {
        const sections = [
            'introduction',
            'discoveries',
            'handshakes',
            'dataflow',
            'verification',
            'build',
            'narrative',
            'status'
        ];
        
        let document = this.templates.header();
        
        sections.forEach(sectionId => {
            if (this.markdownSections.has(sectionId)) {
                document += '\n' + this.markdownSections.get(sectionId) + '\n';
            }
        });
        
        // Add summary
        document += this.generateSummary();
        
        return document;
    }
    
    generateSummary() {
        const summary = `
## 📈 Summary

### Discovery Statistics
- **Total Services Found**: ${this.discoveryLog.length}
- **Active Services**: ${this.discoveryLog.filter(d => d.status === 'active').length}
- **Failed Connections**: ${this.discoveryLog.filter(d => d.status === 'unreachable').length}

### Build Progress
- **Build Steps Completed**: ${this.buildSequence.length}
- **Successful Steps**: ${this.buildSequence.filter(s => s.status !== 'failed').length}
- **Current Phase**: ${this.buildSequence.length > 0 ? this.buildSequence[this.buildSequence.length - 1].action : 'Initializing'}

### Verification Summary
- **Total Checks**: ${this.verificationSteps.length}
- **Passed**: ${this.verificationSteps.filter(v => v.result).length}
- **Failed**: ${this.verificationSteps.filter(v => !v.result).length}
- **Critical Failures**: ${this.verificationSteps.filter(v => !v.result && v.critical).length}

### System Architecture Discovered
\`\`\`
Game Data (XML)
    ↓ [JSON Scout]
Tier Structures (JSONL)
    ↓ [Vault System]
Encrypted Vaults + Public Data
    ↓ [SharePoint/Solidity]
Document Management + Blockchain
\`\`\`

---

*Document generated: ${new Date().toISOString()}*
*System self-documentation complete.*
`;
        
        return summary;
    }
    
    saveDocument() {
        const document = this.generateCompleteDocument();
        const filename = `live-build-${new Date().toISOString().split('T')[0]}.md`;
        const filepath = path.join(this.outputDir, filename);
        
        fs.writeFileSync(filepath, document);
        
        // Also save as latest.md for easy access
        fs.writeFileSync(path.join(this.outputDir, 'latest.md'), document);
        
        // Generate HTML version
        const html = this.generateHTMLVersion(document);
        fs.writeFileSync(path.join(this.outputDir, 'latest.html'), html);
    }
    
    generateHTMLVersion(markdown) {
        const html = marked(markdown);
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Live System Build Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1, h2, h3 { color: #2c3e50; }
        h1 { border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; margin-top: 30px; }
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #282c34;
            color: #abb2bf;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 15px;
            color: #7f8c8d;
            font-style: italic;
        }
        .success { color: #27ae60; }
        .failure { color: #e74c3c; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #3498db;
            color: white;
        }
        tr:nth-child(even) { background: #f9f9f9; }
    </style>
</head>
<body>
    ${html}
    <script>
        // Auto-refresh every 5 seconds
        setTimeout(() => location.reload(), 5000);
    </script>
</body>
</html>`;
    }
}

// Auto-start if run directly
if (require.main === module) {
    const builder = new LiveMarkdownBuilder();
    
    console.log('');
    console.log('📋 Live Documentation Features:');
    console.log('   • Real-time markdown generation');
    console.log('   • First-person build narrative');
    console.log('   • Automatic HTML conversion');
    console.log('   • Live verification tracking');
    console.log('');
    console.log('📁 Output Directory: ./live-docs/');
    console.log('   • latest.md - Current build document');
    console.log('   • latest.html - HTML version (auto-refresh)');
}

module.exports = LiveMarkdownBuilder;
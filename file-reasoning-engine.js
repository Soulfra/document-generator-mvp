#!/usr/bin/env node

/**
 * 🧠 FILE REASONING ENGINE
 * Deep analysis for duplicate files with AI-powered insights
 * Connects to existing REASONING-AUDIT-TRAIL.json system
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const app = express();
app.use(express.json());

// State management
let reasoningState = {
    duplicates: [],
    analysis: {},
    decisions: {},
    aiCosts: 0,
    sessionId: generateSessionId()
};

// Load existing reasoning trail
let reasoningTrail = {};
try {
    const trailPath = './REASONING-AUDIT-TRAIL.json';
    if (fs.existsSync(trailPath)) {
        reasoningTrail = JSON.parse(fs.readFileSync(trailPath, 'utf8'));
        console.log('📖 Loaded existing reasoning trail');
    }
} catch (error) {
    console.warn('⚠️ Could not load reasoning trail:', error.message);
    reasoningTrail = { brainAnalysis: {}, reasoningChain: {}, verificationLogs: {} };
}

// File analysis utilities
class FileAnalyzer {
    static async analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const stats = fs.statSync(filePath);
            
            return {
                path: filePath,
                name: path.basename(filePath),
                size: stats.size,
                lines: content.split('\n').length,
                content: content,
                hash: crypto.createHash('sha256').update(content).digest('hex').slice(0, 16),
                created: stats.birthtime,
                modified: stats.mtime,
                functions: this.extractFunctions(content),
                imports: this.extractImports(content),
                complexity: this.calculateComplexity(content),
                purpose: await this.inferPurpose(content, filePath)
            };
        } catch (error) {
            return { error: error.message, path: filePath };
        }
    }
    
    static extractFunctions(content) {
        const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|(\w+)\s*:\s*(?:async\s+)?function)/g;
        const functions = [];
        let match;
        
        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1] || match[2] || match[3];
            if (functionName) {
                functions.push(functionName);
            }
        }
        
        return functions;
    }
    
    static extractImports(content) {
        const importRegex = /(?:require\(['"`]([^'"`]+)['"`]\)|import\s+.*from\s+['"`]([^'"`]+)['"`]|import\s+['"`]([^'"`]+)['"`])/g;
        const imports = [];
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1] || match[2] || match[3];
            if (importPath) {
                imports.push(importPath);
            }
        }
        
        return imports;
    }
    
    static calculateComplexity(content) {
        const complexityIndicators = [
            /if\s*\(/g,
            /else/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /switch\s*\(/g,
            /catch\s*\(/g,
            /try\s*\{/g
        ];
        
        let complexity = 1; // Base complexity
        complexityIndicators.forEach(regex => {
            const matches = content.match(regex);
            if (matches) complexity += matches.length;
        });
        
        return complexity;
    }
    
    static async inferPurpose(content, filePath) {
        // AI-powered purpose inference (mock for now, can integrate with your AI economy)
        const purposes = {
            'server': /express|app\.listen|http\.createServer/i,
            'test': /test|spec|describe|it\(/i,
            'utility': /util|helper|tool/i,
            'database': /database|db|sql|mongoose|prisma/i,
            'auth': /auth|login|password|jwt|token/i,
            'api': /api|endpoint|route|controller/i,
            'ui': /react|vue|angular|component|render/i,
            'config': /config|settings|env|dotenv/i,
            'build': /webpack|babel|build|deploy/i,
            'game': /game|player|economy|agent/i
        };
        
        for (const [purpose, regex] of Object.entries(purposes)) {
            if (regex.test(content) || regex.test(filePath)) {
                return purpose;
            }
        }
        
        return 'general';
    }
}

// Deep reasoning engine
class DeepReasoningEngine {
    static async analyzeFileGroup(files) {
        const analyses = await Promise.all(
            files.map(file => FileAnalyzer.analyzeFile(file))
        );
        
        const reasoning = {
            groupId: crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            files: analyses,
            similarity: this.calculateSimilarity(analyses),
            differences: this.findDifferences(analyses),
            recommendations: await this.generateRecommendations(analyses),
            businessValue: this.assessBusinessValue(analyses),
            maintenanceBurden: this.calculateMaintenanceBurden(analyses),
            riskAssessment: this.assessRisk(analyses)
        };
        
        // Update AI costs (mock integration with your API economy)
        reasoningState.aiCosts += 0.05; // Simulated API cost for analysis
        
        return reasoning;
    }
    
    static calculateSimilarity(analyses) {
        if (analyses.length < 2) return { score: 0, reasons: [] };
        
        const similarities = [];
        const reasons = [];
        
        // Content similarity
        const contents = analyses.map(a => a.content || '');
        if (contents.length > 1) {
            const similarity = this.textSimilarity(contents[0], contents[1]);
            similarities.push(similarity);
            if (similarity > 0.8) reasons.push('Nearly identical content');
            else if (similarity > 0.5) reasons.push('Similar content structure');
        }
        
        // Function similarity
        const allFunctions = analyses.map(a => a.functions || []);
        const commonFunctions = this.findCommonItems(allFunctions);
        if (commonFunctions.length > 0) {
            similarities.push(0.8);
            reasons.push(`Shared functions: ${commonFunctions.join(', ')}`);
        }
        
        // Import similarity
        const allImports = analyses.map(a => a.imports || []);
        const commonImports = this.findCommonItems(allImports);
        if (commonImports.length > 0) {
            similarities.push(0.6);
            reasons.push(`Shared dependencies: ${commonImports.join(', ')}`);
        }
        
        // Size similarity
        const sizes = analyses.map(a => a.size || 0);
        if (sizes.length > 1 && sizes[0] === sizes[1]) {
            similarities.push(1.0);
            reasons.push('Identical file sizes');
        }
        
        const avgSimilarity = similarities.length > 0 
            ? similarities.reduce((a, b) => a + b, 0) / similarities.length 
            : 0;
            
        return {
            score: Math.round(avgSimilarity * 100) / 100,
            reasons: reasons,
            details: {
                contentSimilarity: similarities[0] || 0,
                functionalSimilarity: similarities[1] || 0,
                dependencySimilarity: similarities[2] || 0
            }
        };
    }
    
    static textSimilarity(text1, text2) {
        // Simple text similarity using common lines
        const lines1 = text1.split('\n').filter(line => line.trim().length > 0);
        const lines2 = text2.split('\n').filter(line => line.trim().length > 0);
        
        const commonLines = lines1.filter(line => lines2.includes(line));
        const totalLines = Math.max(lines1.length, lines2.length);
        
        return totalLines > 0 ? commonLines.length / totalLines : 0;
    }
    
    static findCommonItems(arrays) {
        if (arrays.length === 0) return [];
        
        return arrays[0].filter(item => 
            arrays.every(arr => arr.includes(item))
        );
    }
    
    static findDifferences(analyses) {
        const differences = [];
        
        if (analyses.length >= 2) {
            const [file1, file2] = analyses;
            
            // Size differences
            if (file1.size !== file2.size) {
                differences.push(`Size: ${file1.name} (${file1.size}b) vs ${file2.name} (${file2.size}b)`);
            }
            
            // Line count differences
            if (file1.lines !== file2.lines) {
                differences.push(`Lines: ${file1.name} (${file1.lines}) vs ${file2.name} (${file2.lines})`);
            }
            
            // Function differences
            const uniqueFuncs1 = (file1.functions || []).filter(f => !(file2.functions || []).includes(f));
            const uniqueFuncs2 = (file2.functions || []).filter(f => !(file1.functions || []).includes(f));
            
            if (uniqueFuncs1.length > 0) {
                differences.push(`Unique to ${file1.name}: ${uniqueFuncs1.join(', ')}`);
            }
            if (uniqueFuncs2.length > 0) {
                differences.push(`Unique to ${file2.name}: ${uniqueFuncs2.join(', ')}`);
            }
        }
        
        return differences;
    }
    
    static async generateRecommendations(analyses) {
        const recommendations = [];
        
        if (analyses.length === 0) return recommendations;
        
        const sizes = analyses.map(a => a.size || 0);
        const complexities = analyses.map(a => a.complexity || 0);
        const purposes = analyses.map(a => a.purpose || 'unknown');
        
        // Size-based recommendations
        if (sizes.every(s => s === sizes[0])) {
            recommendations.push({
                type: 'EXACT_DUPLICATE',
                priority: 'HIGH',
                action: 'Keep only one file',
                reason: 'Files are identical in size and likely content'
            });
        }
        
        // Complexity-based recommendations
        const maxComplexity = Math.max(...complexities);
        const maxIndex = complexities.indexOf(maxComplexity);
        if (maxComplexity > 1) {
            recommendations.push({
                type: 'COMPLEXITY_WINNER',
                priority: 'MEDIUM',
                action: `Keep ${analyses[maxIndex].name}`,
                reason: `Most complex implementation (${maxComplexity} complexity points)`
            });
        }
        
        // Purpose-based recommendations
        const uniquePurposes = [...new Set(purposes)];
        if (uniquePurposes.length === 1 && uniquePurposes[0] !== 'unknown') {
            recommendations.push({
                type: 'PURPOSE_MERGE',
                priority: 'LOW',
                action: 'Consider merging functionality',
                reason: `All files serve same purpose: ${uniquePurposes[0]}`
            });
        }
        
        return recommendations;
    }
    
    static assessBusinessValue(analyses) {
        let value = 0;
        let reasons = [];
        
        analyses.forEach(analysis => {
            // Higher value for certain purposes
            const purposeValues = {
                'server': 10,
                'api': 8,
                'auth': 9,
                'database': 7,
                'ui': 6,
                'game': 8,
                'utility': 4,
                'test': 3,
                'config': 2
            };
            
            const purposeValue = purposeValues[analysis.purpose] || 1;
            value += purposeValue;
            
            if (purposeValue > 5) {
                reasons.push(`${analysis.name}: High-value ${analysis.purpose} component`);
            }
        });
        
        return {
            score: value,
            level: value > 15 ? 'HIGH' : value > 8 ? 'MEDIUM' : 'LOW',
            reasons: reasons
        };
    }
    
    static calculateMaintenanceBurden(analyses) {
        let burden = 0;
        let reasons = [];
        
        analyses.forEach(analysis => {
            // Burden from file size
            if (analysis.size > 10000) {
                burden += 3;
                reasons.push(`${analysis.name}: Large file (${analysis.size} bytes)`);
            }
            
            // Burden from complexity
            if (analysis.complexity > 10) {
                burden += 2;
                reasons.push(`${analysis.name}: High complexity (${analysis.complexity})`);
            }
            
            // Burden from duplicates
            burden += 1; // Base burden for each duplicate
        });
        
        return {
            score: burden,
            level: burden > 10 ? 'HIGH' : burden > 5 ? 'MEDIUM' : 'LOW',
            reasons: reasons
        };
    }
    
    static assessRisk(analyses) {
        let risk = 0;
        let reasons = [];
        
        analyses.forEach(analysis => {
            // Risk from critical purposes
            const criticalPurposes = ['server', 'auth', 'database'];
            if (criticalPurposes.includes(analysis.purpose)) {
                risk += 3;
                reasons.push(`${analysis.name}: Critical ${analysis.purpose} component`);
            }
            
            // Risk from old files
            const now = Date.now();
            const fileAge = now - new Date(analysis.modified).getTime();
            const daysOld = fileAge / (1000 * 60 * 60 * 24);
            
            if (daysOld > 365) {
                risk += 2;
                reasons.push(`${analysis.name}: Old file (${Math.round(daysOld)} days)`);
            }
        });
        
        return {
            score: risk,
            level: risk > 8 ? 'HIGH' : risk > 4 ? 'MEDIUM' : 'LOW',
            reasons: reasons
        };
    }
}

// Main application routes
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🧠 File Reasoning Engine</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .game-layer {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin: 20px 0;
            border-left: 5px solid #667eea;
        }
        .reasoning-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin: 15px 0;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border-left: 4px solid #28a745;
        }
        .file-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .file-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #dee2e6;
        }
        .similarity-meter {
            background: #e9ecef;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .similarity-fill {
            height: 100%;
            background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
            transition: width 0.3s ease;
        }
        .action-buttons {
            display: flex;
            gap: 15px;
            margin: 20px 0;
            justify-content: center;
        }
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .btn-analyze { background: #667eea; color: white; }
        .btn-analyze:hover { background: #5a6edb; transform: translateY(-2px); }
        .btn-keep { background: #28a745; color: white; }
        .btn-keep:hover { background: #218838; }
        .btn-delete { background: #dc3545; color: white; }
        .btn-delete:hover { background: #c82333; }
        .btn-merge { background: #ffc107; color: #212529; }
        .btn-merge:hover { background: #e0a800; }
        .status-bar {
            background: #343a40;
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
        }
        .cost-tracker {
            background: #17a2b8;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
        }
        .recommendation {
            background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
        }
        .risk-indicator {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin: 5px;
        }
        .risk-low { background: #d4edda; color: #155724; }
        .risk-medium { background: #fff3cd; color: #856404; }
        .risk-high { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 File Reasoning Engine</h1>
            <p>AI-Powered Deep Analysis for File Duplicates</p>
            <div class="cost-tracker">AI Costs: $<span id="ai-costs">0.00</span></div>
        </div>
        
        <div class="game-layer">
            <h2>🎮 Game Layer: Strategic File Management</h2>
            <p>Make informed decisions about your codebase with AI-powered insights, reasoning trails, and business value assessments.</p>
            
            <div class="action-buttons">
                <button class="btn btn-analyze" onclick="startAnalysis()">🔍 Analyze Duplicates</button>
                <button class="btn btn-keep" onclick="viewReasoningTrail()">📖 View Reasoning Trail</button>
            </div>
        </div>
        
        <div class="status-bar">
            <div id="status">Ready to analyze file duplicates</div>
        </div>
        
        <div id="results"></div>
    </div>
    
    <script>
        let currentSession = '${reasoningState.sessionId}';
        
        async function startAnalysis() {
            updateStatus('🔍 Scanning for duplicates and analyzing...');
            
            try {
                const response = await fetch('/analyze');
                const data = await response.json();
                
                if (data.success) {
                    displayAnalysis(data);
                    updateAICosts(data.aiCosts);
                } else {
                    updateStatus('❌ Analysis failed: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                updateStatus('❌ Failed to analyze: ' + error.message);
            }
        }
        
        function displayAnalysis(data) {
            const results = document.getElementById('results');
            
            if (data.duplicates.length === 0) {
                results.innerHTML = '<div class="reasoning-card"><h3>🎉 No Duplicates Found!</h3><p>Your codebase is clean and optimized.</p></div>';
                updateStatus('✅ Analysis complete - No duplicates found');
                return;
            }
            
            let html = '<h2>🧠 Deep Reasoning Analysis</h2>';
            
            data.duplicates.forEach((group, index) => {
                const reasoning = group.reasoning;
                html += \`
                    <div class="reasoning-card">
                        <h3>📁 Duplicate Group \${index + 1}</h3>
                        
                        <div class="file-comparison">
                            \${reasoning.files.map(file => \`
                                <div class="file-details">
                                    <h4>📄 \${file.name}</h4>
                                    <p><strong>Purpose:</strong> \${file.purpose}</p>
                                    <p><strong>Size:</strong> \${file.size} bytes (\${file.lines} lines)</p>
                                    <p><strong>Complexity:</strong> \${file.complexity}</p>
                                    <p><strong>Functions:</strong> \${(file.functions || []).join(', ') || 'None'}</p>
                                    <p><strong>Hash:</strong> \${file.hash}</p>
                                </div>
                            \`).join('')}
                        </div>
                        
                        <div style="margin: 20px 0;">
                            <h4>🎯 Similarity Analysis</h4>
                            <div class="similarity-meter">
                                <div class="similarity-fill" style="width: \${reasoning.similarity.score * 100}%"></div>
                            </div>
                            <p><strong>\${Math.round(reasoning.similarity.score * 100)}% Similar</strong></p>
                            <p><strong>Reasons:</strong> \${reasoning.similarity.reasons.join(', ')}</p>
                        </div>
                        
                        <div style="margin: 20px 0;">
                            <h4>🔍 Key Differences</h4>
                            <ul>
                                \${reasoning.differences.map(diff => \`<li>\${diff}</li>\`).join('')}
                            </ul>
                        </div>
                        
                        <div style="margin: 20px 0;">
                            <h4>📊 Business Impact</h4>
                            <p><strong>Business Value:</strong> <span class="risk-indicator risk-\${reasoning.businessValue.level.toLowerCase()}">\${reasoning.businessValue.level}</span></p>
                            <p><strong>Maintenance Burden:</strong> <span class="risk-indicator risk-\${reasoning.maintenanceBurden.level.toLowerCase()}">\${reasoning.maintenanceBurden.level}</span></p>
                            <p><strong>Risk Level:</strong> <span class="risk-indicator risk-\${reasoning.riskAssessment.level.toLowerCase()}">\${reasoning.riskAssessment.level}</span></p>
                        </div>
                        
                        <div style="margin: 20px 0;">
                            <h4>🎯 AI Recommendations</h4>
                            \${reasoning.recommendations.map(rec => \`
                                <div class="recommendation">
                                    <strong>\${rec.type}</strong> (\${rec.priority} Priority)<br>
                                    <strong>Action:</strong> \${rec.action}<br>
                                    <strong>Reason:</strong> \${rec.reason}
                                </div>
                            \`).join('')}
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn btn-keep" onclick="makeDecision(\${index}, 'keep')">📄 Keep All</button>
                            <button class="btn btn-delete" onclick="makeDecision(\${index}, 'delete')">🗑️ Delete Duplicates</button>
                            <button class="btn btn-merge" onclick="makeDecision(\${index}, 'merge')">🔀 Suggest Merge</button>
                        </div>
                        
                        <div id="decision-\${index}" style="margin-top: 15px;"></div>
                    </div>
                \`;
            });
            
            results.innerHTML = html;
            updateStatus(\`✅ Analysis complete - \${data.duplicates.length} duplicate groups analyzed\`);
        }
        
        async function makeDecision(groupIndex, decision) {
            const decisionEl = document.getElementById(\`decision-\${groupIndex}\`);
            decisionEl.innerHTML = '<div style="color: #28a745; font-weight: bold;">🤖 Processing decision and updating reasoning trail...</div>';
            
            try {
                const response = await fetch('/decision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: currentSession,
                        groupIndex: groupIndex,
                        decision: decision,
                        timestamp: Date.now()
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const emoji = decision === 'delete' ? '🗑️' : decision === 'merge' ? '🔀' : '📄';
                    decisionEl.innerHTML = \`
                        <div style="color: #28a745; font-weight: bold;">
                            \${emoji} Decision recorded! Added to reasoning trail with verification ID: \${result.verificationId}
                        </div>
                    \`;
                } else {
                    decisionEl.innerHTML = '<div style="color: #dc3545;">❌ Failed to record decision</div>';
                }
            } catch (error) {
                decisionEl.innerHTML = '<div style="color: #dc3545;">❌ Error: ' + error.message + '</div>';
            }
        }
        
        async function viewReasoningTrail() {
            try {
                const response = await fetch('/reasoning-trail');
                const trail = await response.json();
                
                // Display reasoning trail in a modal or new section
                alert('Reasoning trail loaded! Check console for full details.');
                console.log('🧠 Complete Reasoning Trail:', trail);
            } catch (error) {
                alert('Failed to load reasoning trail: ' + error.message);
            }
        }
        
        function updateStatus(message) {
            document.getElementById('status').textContent = message;
        }
        
        function updateAICosts(costs) {
            document.getElementById('ai-costs').textContent = costs.toFixed(4);
        }
        
        // Auto-refresh AI costs every 5 seconds
        setInterval(async () => {
            try {
                const response = await fetch('/status');
                const data = await response.json();
                updateAICosts(data.aiCosts);
            } catch (error) {
                console.warn('Failed to update AI costs:', error);
            }
        }, 5000);
    </script>
</body>
</html>
    `);
});

// Analyze endpoint - performs deep reasoning on duplicates
app.get('/analyze', async (req, res) => {
    try {
        console.log('🧠 Starting deep analysis...');
        
        // First, find duplicates (reuse simple swiper logic)
        const allFiles = fs.readdirSync('.');
        const jsFiles = allFiles.filter(file => 
            file.endsWith('.js') && 
            fs.statSync(file).isFile() &&
            !file.includes('node_modules')
        );
        
        // Group by size for duplicate detection
        const sizeGroups = {};
        jsFiles.forEach(file => {
            try {
                const size = fs.statSync(file).size;
                if (!sizeGroups[size]) {
                    sizeGroups[size] = [];
                }
                sizeGroups[size].push(file);
            } catch (error) {
                console.warn(`⚠️ Cannot process ${file}:`, error.message);
            }
        });
        
        // Find groups with multiple files and analyze them
        const duplicateGroups = [];
        for (const group of Object.values(sizeGroups)) {
            if (group.length > 1) {
                console.log(`🔍 Analyzing duplicate group: ${group.join(', ')}`);
                const reasoning = await DeepReasoningEngine.analyzeFileGroup(group);
                duplicateGroups.push({
                    files: group,
                    reasoning: reasoning
                });
            }
        }
        
        // Update reasoning trail
        const analysisEntry = {
            timestamp: Date.now(),
            sessionId: reasoningState.sessionId,
            duplicatesFound: duplicateGroups.length,
            totalFiles: jsFiles.length,
            aiCostsIncurred: reasoningState.aiCosts,
            analysisType: 'file_duplicate_reasoning'
        };
        
        if (!reasoningTrail.reasoningChain) {
            reasoningTrail.reasoningChain = {};
        }
        
        reasoningTrail.reasoningChain[`analysis_${Date.now()}`] = analysisEntry;
        
        // Save updated reasoning trail
        try {
            fs.writeFileSync('./REASONING-AUDIT-TRAIL.json', JSON.stringify(reasoningTrail, null, 2));
        } catch (error) {
            console.warn('⚠️ Could not save reasoning trail:', error.message);
        }
        
        reasoningState.duplicates = duplicateGroups;
        
        res.json({
            success: true,
            duplicates: duplicateGroups,
            totalFiles: jsFiles.length,
            aiCosts: reasoningState.aiCosts,
            sessionId: reasoningState.sessionId
        });
        
    } catch (error) {
        console.error('❌ Analysis failed:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Decision endpoint - records user decisions
app.post('/decision', (req, res) => {
    try {
        const { sessionId, groupIndex, decision, timestamp } = req.body;
        
        if (!reasoningState.decisions) {
            reasoningState.decisions = {};
        }
        
        const verificationId = `decision_${generateSessionId()}_${crypto.randomBytes(8).toString('hex')}`;
        
        const decisionRecord = {
            id: verificationId,
            sessionId: sessionId,
            groupIndex: groupIndex,
            decision: decision,
            timestamp: timestamp,
            deviceId: generateDeviceId(),
            files: reasoningState.duplicates[groupIndex]?.files || [],
            reasoning: reasoningState.duplicates[groupIndex]?.reasoning || null
        };
        
        reasoningState.decisions[verificationId] = decisionRecord;
        
        // Add to reasoning trail chain of custody
        if (!reasoningTrail.verificationLogs) {
            reasoningTrail.verificationLogs = { chainOfCustody: [] };
        }
        
        reasoningTrail.verificationLogs.chainOfCustody.push({
            id: verificationId,
            operation: 'file_decision',
            decision: decision,
            deviceId: generateDeviceId(),
            timestamp: timestamp,
            dataHash: crypto.createHash('sha256').update(JSON.stringify(decisionRecord)).digest('hex'),
            deviceSignature: crypto.randomBytes(64).toString('hex'), // Mock signature
            verificationLevel: 'BUSINESS_DECISION'
        });
        
        // Save updated reasoning trail
        try {
            fs.writeFileSync('./REASONING-AUDIT-TRAIL.json', JSON.stringify(reasoningTrail, null, 2));
            console.log(`✅ Decision recorded: ${decision} for group ${groupIndex}`);
        } catch (error) {
            console.warn('⚠️ Could not save decision to reasoning trail:', error.message);
        }
        
        res.json({
            success: true,
            verificationId: verificationId,
            decision: decision
        });
        
    } catch (error) {
        console.error('❌ Decision recording failed:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Reasoning trail endpoint
app.get('/reasoning-trail', (req, res) => {
    res.json(reasoningTrail);
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        sessionId: reasoningState.sessionId,
        duplicatesAnalyzed: reasoningState.duplicates.length,
        decisionsRecorded: Object.keys(reasoningState.decisions || {}).length,
        aiCosts: reasoningState.aiCosts,
        timestamp: Date.now()
    });
});

// Utility functions
function generateSessionId() {
    return crypto.randomBytes(8).toString('hex');
}

function generateDeviceId() {
    return crypto.randomBytes(8).toString('hex');
}

// Start server
const PORT = 3009;
app.listen(PORT, (err) => {
    if (err) {
        console.error('❌ Server failed to start:', err);
        process.exit(1);
    }
    
    console.log('🧠 FILE REASONING ENGINE');
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log('🎮 Game Layer: Strategic file management with AI insights');
    console.log('📖 Connects to your existing REASONING-AUDIT-TRAIL.json');
    console.log('💰 Tracks AI costs like your agent economy');
    console.log('🔗 Ready for business platform integration');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down reasoning engine...');
    
    // Save final state
    try {
        const finalState = {
            sessionId: reasoningState.sessionId,
            timestamp: Date.now(),
            duplicatesAnalyzed: reasoningState.duplicates.length,
            decisionsRecorded: Object.keys(reasoningState.decisions || {}).length,
            totalAICosts: reasoningState.aiCosts
        };
        
        reasoningTrail.sessionSummary = finalState;
        fs.writeFileSync('./REASONING-AUDIT-TRAIL.json', JSON.stringify(reasoningTrail, null, 2));
        console.log('✅ Final state saved to reasoning trail');
    } catch (error) {
        console.warn('⚠️ Could not save final state:', error.message);
    }
    
    process.exit(0);
});
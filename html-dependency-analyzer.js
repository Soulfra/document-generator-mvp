#!/usr/bin/env node

/**
 * 🔍 HTML DEPENDENCY ANALYZER
 * 
 * Reads HTML files and analyzes missing dependencies, understanding what each
 * missing file should contain based on usage context and function calls.
 * 
 * This is the brain that figures out what needs to be built automatically.
 */

const fs = require('fs').promises;
const path = require('path');

class HTMLDependencyAnalyzer {
    constructor() {
        this.missingDependencies = new Map();
        this.functionCalls = new Map();
        this.contextAnalysis = new Map();
        this.languageHints = new Map();
        
        console.log('🔍 HTML Dependency Analyzer initialized');
    }
    
    /**
     * Analyze HTML file and extract missing dependencies
     */
    async analyzeHTML(filePath) {
        console.log(`🔍 Analyzing HTML file: ${filePath}`);
        
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Extract script dependencies using regex
            const scriptSources = [];
            const scriptSrcRegex = /<script[^>]+src=['"]([^'"]+)['"][^>]*>/gi;
            let match;
            while ((match = scriptSrcRegex.exec(content)) !== null) {
                const src = match[1];
                if (src && !src.startsWith('http') && !src.startsWith('//')) {
                    scriptSources.push(src);
                }
            }
            
            // Extract inline JavaScript to understand context
            const inlineJS = [];
            const inlineScriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
            while ((match = inlineScriptRegex.exec(content)) !== null) {
                const code = match[1].trim();
                if (code) {
                    inlineJS.push(code);
                }
            }
            
            // Analyze each missing dependency
            const results = await this.analyzeDependencies(scriptSources, inlineJS);
            
            console.log(`✅ Found ${scriptSources.length} dependencies, ${results.missing.length} missing`);
            
            return {
                filePath,
                allDependencies: scriptSources,
                missing: results.missing,
                existing: results.existing,
                inlineJS,
                contextAnalysis: results.contextAnalysis,
                languageRequirements: results.languageRequirements
            };
            
        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Check which dependencies exist and analyze missing ones
     */
    async analyzeDependencies(scriptSources, inlineJS) {
        const missing = [];
        const existing = [];
        const contextAnalysis = new Map();
        const languageRequirements = new Map();
        
        for (const src of scriptSources) {
            try {
                await fs.access(src);
                existing.push(src);
                console.log(`  ✅ Found: ${src}`);
            } catch {
                missing.push(src);
                console.log(`  ❌ Missing: ${src}`);
                
                // Analyze what this file should contain
                const analysis = this.analyzeFileContext(src, inlineJS);
                contextAnalysis.set(src, analysis);
                
                // Determine language requirements
                const langReqs = this.determineLanguageRequirements(src, analysis);
                languageRequirements.set(src, langReqs);
            }
        }
        
        return {
            missing,
            existing,
            contextAnalysis,
            languageRequirements
        };
    }
    
    /**
     * Analyze what a missing file should contain based on context
     */
    analyzeFileContext(fileName, inlineJS) {
        const analysis = {
            fileName,
            inferredPurpose: '',
            functionCalls: [],
            classReferences: [],
            variableReferences: [],
            patterns: [],
            complexity: 'medium',
            dependencies: []
        };
        
        // Combine all inline JS for analysis
        const fullJS = inlineJS.join('\n');
        
        // Extract function calls that might be in this file
        const fileNameBase = path.basename(fileName, '.js');
        
        // Look for constructor calls or class instantiation
        const classRegex = new RegExp(`new\\s+${fileNameBase.replace(/-/g, '')}`, 'gi');
        const classMatches = fullJS.match(classRegex);
        if (classMatches) {
            analysis.classReferences = classMatches;
            analysis.patterns.push('class-instantiation');
        }
        
        // Look for function calls that start with the filename
        const funcRegex = new RegExp(`${fileNameBase.replace(/-/g, '')}\\.(\\w+)`, 'gi');
        let match;
        while ((match = funcRegex.exec(fullJS)) !== null) {
            analysis.functionCalls.push(match[1]);
        }
        
        // Look for variable references
        const varRegex = new RegExp(`\\b${fileNameBase.replace(/-/g, '')}\\b`, 'gi');
        const varMatches = fullJS.match(varRegex);
        if (varMatches) {
            analysis.variableReferences = varMatches;
        }
        
        // Infer purpose from filename and usage
        analysis.inferredPurpose = this.inferPurpose(fileName, fullJS);
        
        // Determine complexity
        analysis.complexity = this.determineComplexity(fileName, analysis);
        
        // Find dependencies based on usage patterns
        analysis.dependencies = this.findDependencies(fileName, fullJS);
        
        return analysis;
    }
    
    /**
     * Infer the purpose of a file from its name and usage context
     */
    inferPurpose(fileName, jsCode) {
        const baseName = path.basename(fileName, '.js').toLowerCase();
        
        // Pattern matching for common file purposes
        const purposes = {
            'engine': 'Core game or AI engine with main loop and state management',
            'physics': 'Physics simulation with collision detection and movement',
            'ai': 'AI behavior system with decision making and learning',
            'chat': 'Chat system with messaging and communication features',
            'server': 'Server management with connection handling and state sync',
            'mcp': 'MCP (Model Context Protocol) bridge for tool integration',
            'project': 'Project management with file system and collaboration',
            'workspace': 'Workspace management with file operations and UI',
            'visual': 'Visual effects and rendering system',
            'personality': 'Personality system for character behaviors',
            'command': 'Command processing and execution system',
            'bridge': 'Integration bridge between different systems',
            'orchestrator': 'System orchestration and coordination',
            'manager': 'Management layer for resources and state'
        };
        
        // Check filename patterns
        for (const [pattern, purpose] of Object.entries(purposes)) {
            if (baseName.includes(pattern)) {
                return purpose;
            }
        }
        
        // Check code context for additional clues
        if (jsCode.includes('canvas') || jsCode.includes('render')) {
            return 'Rendering and graphics system';
        }
        
        if (jsCode.includes('websocket') || jsCode.includes('socket')) {
            return 'Real-time communication system';
        }
        
        if (jsCode.includes('database') || jsCode.includes('storage')) {
            return 'Data storage and persistence system';
        }
        
        return 'General utility and functionality system';
    }
    
    /**
     * Determine complexity level based on usage patterns
     */
    determineComplexity(fileName, analysis) {
        let complexityScore = 0;
        
        // Base complexity from function calls
        complexityScore += analysis.functionCalls.length * 2;
        
        // Class instantiation adds complexity
        complexityScore += analysis.classReferences.length * 5;
        
        // Certain keywords indicate higher complexity
        const highComplexityKeywords = ['engine', 'orchestrator', 'ai', 'physics'];
        const mediumComplexityKeywords = ['manager', 'bridge', 'server'];
        
        const baseName = path.basename(fileName, '.js').toLowerCase();
        
        for (const keyword of highComplexityKeywords) {
            if (baseName.includes(keyword)) {
                complexityScore += 10;
            }
        }
        
        for (const keyword of mediumComplexityKeywords) {
            if (baseName.includes(keyword)) {
                complexityScore += 5;
            }
        }
        
        // Determine final complexity
        if (complexityScore >= 20) return 'high';
        if (complexityScore >= 10) return 'medium';
        return 'low';
    }
    
    /**
     * Find dependencies this file likely needs
     */
    findDependencies(fileName, jsCode) {
        const dependencies = [];
        const baseName = path.basename(fileName, '.js').toLowerCase();
        
        // Standard dependencies based on file type
        if (baseName.includes('physics')) {
            dependencies.push('math', 'vector-operations', 'collision-detection');
        }
        
        if (baseName.includes('ai')) {
            dependencies.push('decision-trees', 'state-machines', 'learning-algorithms');
        }
        
        if (baseName.includes('chat')) {
            dependencies.push('websocket', 'message-parsing', 'command-processing');
        }
        
        if (baseName.includes('server')) {
            dependencies.push('networking', 'session-management', 'authentication');
        }
        
        if (baseName.includes('visual')) {
            dependencies.push('canvas-api', 'animation', 'particle-systems');
        }
        
        // Look for imports/requires in the context
        const importMatches = jsCode.match(/require\(['"]([^'"]+)['"]\)/g);
        if (importMatches) {
            for (const match of importMatches) {
                const module = match.match(/require\(['"]([^'"]+)['"]\)/)[1];
                dependencies.push(module);
            }
        }
        
        return dependencies;
    }
    
    /**
     * Determine which AI character is best suited for this file
     */
    determineLanguageRequirements(fileName, analysis) {
        const requirements = {
            primaryLanguage: 'javascript',
            specializations: [],
            aiCharacterWeights: new Map(),
            suggestedCharacter: ''
        };
        
        const baseName = path.basename(fileName, '.js').toLowerCase();
        
        // Determine specializations needed
        if (baseName.includes('physics') || baseName.includes('engine')) {
            requirements.specializations.push('game-development', 'performance-optimization');
            requirements.aiCharacterWeights.set('RustMaster', 0.7); // Rust excels at performance
            requirements.aiCharacterWeights.set('JSNinja', 0.9);
        }
        
        if (baseName.includes('ai') || baseName.includes('learning')) {
            requirements.specializations.push('ai-algorithms', 'machine-learning');
            requirements.aiCharacterWeights.set('FlaskGuru', 0.8); // Python is ML-heavy
            requirements.aiCharacterWeights.set('JSNinja', 0.7);
        }
        
        if (baseName.includes('server') || baseName.includes('api')) {
            requirements.specializations.push('backend-development', 'api-design');
            requirements.aiCharacterWeights.set('FlaskGuru', 0.9);
            requirements.aiCharacterWeights.set('JSNinja', 0.8);
        }
        
        if (baseName.includes('bridge') || baseName.includes('integration')) {
            requirements.specializations.push('system-integration', 'architecture');
            requirements.aiCharacterWeights.set('SystemArchitect', 0.9);
            requirements.aiCharacterWeights.set('JSNinja', 0.6);
        }
        
        if (baseName.includes('blockchain') || baseName.includes('smart')) {
            requirements.specializations.push('blockchain', 'smart-contracts');
            requirements.aiCharacterWeights.set('SolidityWizard', 0.9);
            requirements.aiCharacterWeights.set('RustMaster', 0.7); // Rust is big in crypto
        }
        
        // Default to JavaScript specialist if no specialization detected
        if (requirements.aiCharacterWeights.size === 0) {
            requirements.aiCharacterWeights.set('JSNinja', 0.9);
            requirements.aiCharacterWeights.set('SystemArchitect', 0.6);
        }
        
        // Suggest the best character
        let bestCharacter = '';
        let bestWeight = 0;
        
        for (const [character, weight] of requirements.aiCharacterWeights) {
            if (weight > bestWeight) {
                bestWeight = weight;
                bestCharacter = character;
            }
        }
        
        requirements.suggestedCharacter = bestCharacter;
        
        return requirements;
    }
    
    /**
     * Generate a comprehensive build plan for all missing dependencies
     */
    generateBuildPlan(analysisResult) {
        const buildPlan = {
            totalFiles: analysisResult.missing.length,
            estimatedTime: 0,
            buildOrder: [],
            characterAssignments: new Map(),
            dependencies: new Map()
        };
        
        // Sort files by dependency order and complexity
        const sortedFiles = this.sortByDependencyOrder(analysisResult.missing, analysisResult.contextAnalysis);
        
        for (const fileName of sortedFiles) {
            const analysis = analysisResult.contextAnalysis.get(fileName);
            const langReqs = analysisResult.languageRequirements.get(fileName);
            
            buildPlan.buildOrder.push({
                fileName,
                purpose: analysis.inferredPurpose,
                complexity: analysis.complexity,
                estimatedTime: this.estimateFileTime(analysis.complexity),
                suggestedCharacter: langReqs.suggestedCharacter,
                dependencies: analysis.dependencies,
                functionCalls: analysis.functionCalls
            });
            
            buildPlan.characterAssignments.set(fileName, langReqs.suggestedCharacter);
            buildPlan.dependencies.set(fileName, analysis.dependencies);
            
            // Add to estimated time
            buildPlan.estimatedTime += this.estimateFileTime(analysis.complexity);
        }
        
        return buildPlan;
    }
    
    /**
     * Sort files by dependency order (dependencies first)
     */
    sortByDependencyOrder(files, contextAnalysis) {
        // Simple heuristic: core files first, then specialized files
        const coreFiles = [];
        const specializedFiles = [];
        
        for (const file of files) {
            const baseName = path.basename(file, '.js').toLowerCase();
            
            if (baseName.includes('engine') || baseName.includes('physics')) {
                coreFiles.push(file);
            } else {
                specializedFiles.push(file);
            }
        }
        
        return [...coreFiles, ...specializedFiles];
    }
    
    /**
     * Estimate time to generate a file based on complexity
     */
    estimateFileTime(complexity) {
        const timeEstimates = {
            'low': 2,      // 2 minutes
            'medium': 5,   // 5 minutes
            'high': 10     // 10 minutes
        };
        
        return timeEstimates[complexity] || timeEstimates['medium'];
    }
    
    /**
     * Generate detailed specification for a missing file
     */
    generateFileSpec(fileName, analysis, langReqs) {
        return {
            fileName,
            purpose: analysis.inferredPurpose,
            complexity: analysis.complexity,
            requiredFunctions: analysis.functionCalls,
            requiredClasses: analysis.classReferences.map(ref => 
                ref.replace('new ', '').trim()
            ),
            dependencies: analysis.dependencies,
            patterns: analysis.patterns,
            suggestedCharacter: langReqs.suggestedCharacter,
            characterWeights: Object.fromEntries(langReqs.aiCharacterWeights),
            
            // Code generation hints
            codeHints: {
                needsEventEmitter: analysis.patterns.includes('event-driven'),
                needsWebSocket: analysis.dependencies.includes('websocket'),
                needsCanvas: analysis.dependencies.includes('canvas-api'),
                needsAI: analysis.patterns.includes('ai-behavior'),
                needsPhysics: analysis.dependencies.includes('collision-detection')
            },
            
            // Template suggestions
            templateSuggestions: this.suggestTemplates(fileName, analysis)
        };
    }
    
    /**
     * Suggest code templates based on file analysis
     */
    suggestTemplates(fileName, analysis) {
        const templates = [];
        const baseName = path.basename(fileName, '.js').toLowerCase();
        
        if (baseName.includes('engine')) {
            templates.push('game-engine-class', 'main-loop', 'state-machine');
        }
        
        if (baseName.includes('physics')) {
            templates.push('physics-engine', 'collision-system', 'vector-math');
        }
        
        if (baseName.includes('ai')) {
            templates.push('ai-agent', 'decision-tree', 'behavior-tree');
        }
        
        if (baseName.includes('chat')) {
            templates.push('chat-system', 'message-handler', 'command-parser');
        }
        
        if (baseName.includes('server')) {
            templates.push('server-manager', 'session-handler', 'connection-pool');
        }
        
        return templates;
    }
}

// Export for use as module
module.exports = HTMLDependencyAnalyzer;

// CLI usage
if (require.main === module) {
    const analyzer = new HTMLDependencyAnalyzer();
    
    const htmlFile = process.argv[2];
    
    if (!htmlFile) {
        console.log(`
🔍 HTML DEPENDENCY ANALYZER
===========================

Usage: node html-dependency-analyzer.js <html-file>

Example: node html-dependency-analyzer.js guardian-world-enhanced.html

This tool will:
1. Parse HTML and find missing JavaScript dependencies
2. Analyze what each missing file should contain
3. Generate build specifications for AI characters
4. Create a complete build plan with time estimates
        `);
        process.exit(1);
    }
    
    analyzer.analyzeHTML(htmlFile)
        .then(result => {
            console.log('\n📊 ANALYSIS RESULTS:');
            console.log('===================');
            
            console.log(`\n📁 Dependencies found: ${result.allDependencies.length}`);
            console.log(`✅ Existing files: ${result.existing.length}`);
            console.log(`❌ Missing files: ${result.missing.length}`);
            
            if (result.missing.length > 0) {
                console.log('\n🔨 MISSING FILES ANALYSIS:');
                for (const file of result.missing) {
                    const analysis = result.contextAnalysis.get(file);
                    const langReqs = result.languageRequirements.get(file);
                    
                    console.log(`\n📄 ${file}`);
                    console.log(`   Purpose: ${analysis.inferredPurpose}`);
                    console.log(`   Complexity: ${analysis.complexity}`);
                    console.log(`   Suggested Character: ${langReqs.suggestedCharacter}`);
                    console.log(`   Functions needed: ${analysis.functionCalls.join(', ')}`);
                }
                
                // Generate build plan
                const buildPlan = analyzer.generateBuildPlan(result);
                
                console.log('\n🏗️ BUILD PLAN:');
                console.log(`Total files to generate: ${buildPlan.totalFiles}`);
                console.log(`Estimated time: ${buildPlan.estimatedTime} minutes`);
                
                console.log('\n📋 Build Order:');
                buildPlan.buildOrder.forEach((item, i) => {
                    console.log(`${i + 1}. ${item.fileName} (${item.estimatedTime}min) - ${item.suggestedCharacter}`);
                });
            }
        })
        .catch(console.error);
}
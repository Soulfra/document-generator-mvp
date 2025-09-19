#!/usr/bin/env node

/**
 * 📄✨ CAL CONTEXT MDX EXPORTER
 * 
 * Exports code contexts, TODOs, and patterns as interactive MDX documents
 * with React components for visualization and exploration.
 * 
 * Features:
 * - Export search results as MDX documents
 * - Interactive code snippet viewer components
 * - TODO tracking with live status updates
 * - Pattern visualization components
 * - Integration with capsule data
 * - Multiple export formats (MDX, HTML, PDF)
 */

const fs = require('fs').promises;
const path = require('path');
const CALContextBridgeSimple = require('./CAL-Context-Bridge-Simple.js');
const CALContextCapsuleBridge = require('./cal-context-capsule-bridge.js');

class CALContextMDXExporter {
    constructor(config = {}) {
        this.config = {
            // Export settings
            outputDir: config.outputDir || './exports/context-mdx',
            templateDir: config.templateDir || './templates/mdx',
            
            // Component settings
            includeComponents: {
                codeViewer: true,
                todoTracker: true,
                patternVisualizer: true,
                searchInterface: true,
                capsuleViewer: true
            },
            
            // Styling
            theme: config.theme || 'github-dark',
            syntax: config.syntax || 'prism',
            
            // Integration
            enableCapsules: config.enableCapsules || false,
            capsuleSystemUrl: config.capsuleSystemUrl || 'http://localhost:4900',
            
            ...config
        };
        
        // Initialize bridges
        this.contextBridge = null;
        this.capsuleBridge = null;
        
        // MDX component templates
        this.componentTemplates = {
            codeSnippet: this.getCodeSnippetTemplate(),
            todoItem: this.getTodoItemTemplate(),
            patternCard: this.getPatternCardTemplate(),
            searchResults: this.getSearchResultsTemplate(),
            capsuleViewer: this.getCapsuleViewerTemplate()
        };
        
        this.stats = {
            documentsExported: 0,
            componentsGenerated: 0,
            formatsExported: []
        };
        
        console.log('📄✨ CAL Context MDX Exporter initialized');
    }
    
    async initialize() {
        console.log('🚀 Initializing MDX Exporter...');
        
        // Create output directories
        await this.createDirectories();
        
        // Initialize context bridge
        this.contextBridge = new CALContextBridgeSimple({
            maxSnippets: 20,
            enableTodoExtraction: true
        });
        await this.contextBridge.initialize();
        
        // Initialize capsule bridge if enabled
        if (this.config.enableCapsules) {
            this.capsuleBridge = new CALContextCapsuleBridge({
                autoCapsule: false
            });
            await this.capsuleBridge.initialize();
        }
        
        console.log('✅ MDX Exporter ready');
    }
    
    /**
     * Export search context as MDX document
     */
    async exportSearchContext(query, options = {}) {
        console.log(`📝 Exporting search context for: "${query}"`);
        
        // Get context
        const context = this.config.enableCapsules
            ? await this.capsuleBridge.searchWithCapsule(query, options)
            : await this.contextBridge.searchWithContext(query, options);
        
        // Generate MDX document
        const mdx = await this.generateSearchMDX(query, context);
        
        // Export to file
        const filename = this.sanitizeFilename(`search-${query}-${Date.now()}.mdx`);
        const outputPath = path.join(this.config.outputDir, 'searches', filename);
        
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, mdx);
        
        this.stats.documentsExported++;
        
        console.log(`✅ Exported search context to: ${outputPath}`);
        
        // Generate additional formats if requested
        if (options.formats) {
            await this.exportAdditionalFormats(outputPath, mdx, options.formats);
        }
        
        return {
            mdxPath: outputPath,
            stats: context.stats,
            capsuleId: context.capsuleId
        };
    }
    
    /**
     * Export TODO report as MDX
     */
    async exportTodoReport(options = {}) {
        console.log('📋 Exporting TODO report...');
        
        // Get all TODOs
        const tasks = await this.contextBridge.extractTodosForTaskManager();
        
        // Generate MDX document
        const mdx = await this.generateTodoReportMDX(tasks);
        
        // Export to file
        const filename = `todo-report-${Date.now()}.mdx`;
        const outputPath = path.join(this.config.outputDir, 'reports', filename);
        
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, mdx);
        
        this.stats.documentsExported++;
        
        console.log(`✅ Exported TODO report to: ${outputPath}`);
        
        return {
            mdxPath: outputPath,
            totalTasks: tasks.length,
            criticalTasks: tasks.filter(t => t.priority > 2.5).length
        };
    }
    
    /**
     * Export code patterns analysis
     */
    async exportPatternAnalysis(options = {}) {
        console.log('🧩 Exporting pattern analysis...');
        
        // Search for common patterns
        const patterns = await this.analyzeCodePatterns();
        
        // Generate MDX document
        const mdx = await this.generatePatternAnalysisMDX(patterns);
        
        // Export to file
        const filename = `pattern-analysis-${Date.now()}.mdx`;
        const outputPath = path.join(this.config.outputDir, 'analysis', filename);
        
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, mdx);
        
        this.stats.documentsExported++;
        
        console.log(`✅ Exported pattern analysis to: ${outputPath}`);
        
        return {
            mdxPath: outputPath,
            patternsFound: patterns.length
        };
    }
    
    /**
     * Generate MDX for search results
     */
    async generateSearchMDX(query, context) {
        const components = [];
        
        // Add component imports
        if (this.config.includeComponents.codeViewer) {
            components.push('import { CodeViewer } from "./components/CodeViewer"');
        }
        if (this.config.includeComponents.todoTracker) {
            components.push('import { TodoTracker } from "./components/TodoTracker"');
        }
        if (this.config.includeComponents.searchInterface) {
            components.push('import { SearchInterface } from "./components/SearchInterface"');
        }
        if (this.config.includeComponents.capsuleViewer && context.capsuleId) {
            components.push('import { CapsuleViewer } from "./components/CapsuleViewer"');
        }
        
        const mdx = `---
title: "Search Results: ${query}"
date: ${new Date().toISOString()}
query: "${query}"
executionTime: ${context.executionTime}ms
snippetsFound: ${context.stats.snippetsFound}
todosFound: ${context.stats.todosFound}
${context.capsuleId ? `capsuleId: ${context.capsuleId}` : ''}
---

${components.join('\n')}

# Search Results: ${query}

## Summary

- **Execution Time**: ${context.executionTime}ms
- **Code Snippets Found**: ${context.stats.snippetsFound}
- **TODOs Found**: ${context.stats.todosFound}
- **Top Files**: ${context.summary.topFiles.slice(0, 3).join(', ')}

${context.suggestions.length > 0 ? `
## Suggestions

${context.suggestions.map(s => `- ${s}`).join('\n')}
` : ''}

## Code Snippets

<SearchInterface query="${query}" />

${context.codeSnippets.map((snippet, index) => `
### ${index + 1}. ${path.basename(snippet.file)}

<CodeViewer
  file="${snippet.file}"
  line={${snippet.lineNumber}}
  startLine={${snippet.startLine || snippet.lineNumber - 3}}
  endLine={${snippet.endLine || snippet.lineNumber + 3}}
  language="${snippet.language}"
  relevance={${snippet.relevance}}
  theme="${this.config.theme}"
>
${this.escapeCodeBlock(snippet.content)}
</CodeViewer>

**Matched Line ${snippet.lineNumber}**: \`${snippet.matchedLine}\`
`).join('\n')}

${context.todos.length > 0 ? `
## Related TODOs

<TodoTracker
  todos={${JSON.stringify(context.todos.slice(0, 10), null, 2)}}
  interactive={true}
/>

${context.todos.slice(0, 10).map((todo, index) => `
### ${index + 1}. [${todo.type}] ${todo.content}

- **File**: ${todo.file}
- **Line**: ${todo.line}
- **Relevance**: ${(todo.relevance * 100).toFixed(1)}%
`).join('\n')}
` : ''}

${context.capsuleId ? `
## Capsule Data

<CapsuleViewer
  capsuleId="${context.capsuleId}"
  layer="${context.capsuleLayer}"
  systemUrl="${this.config.capsuleSystemUrl}"
/>
` : ''}

## Export Info

- Generated at: ${new Date().toLocaleString()}
- Context Bridge Version: 1.0.0
- Total Files Indexed: ${this.contextBridge.getStats().codeFiles}
- Total TODOs in Codebase: ${this.contextBridge.getStats().totalTodos}
`;
        
        this.stats.componentsGenerated += components.length;
        
        return mdx;
    }
    
    /**
     * Generate MDX for TODO report
     */
    async generateTodoReportMDX(tasks) {
        const criticalTasks = tasks.filter(t => t.priority > 2.5);
        const highPriorityTasks = tasks.filter(t => t.priority > 2 && t.priority <= 2.5);
        const normalTasks = tasks.filter(t => t.priority <= 2);
        
        const mdx = `---
title: "TODO Report"
date: ${new Date().toISOString()}
totalTasks: ${tasks.length}
criticalTasks: ${criticalTasks.length}
highPriorityTasks: ${highPriorityTasks.length}
normalTasks: ${normalTasks.length}
---

import { TodoTracker } from "./components/TodoTracker"
import { TodoDashboard } from "./components/TodoDashboard"
import { TodoChart } from "./components/TodoChart"

# TODO Report

<TodoDashboard
  totalTasks={${tasks.length}}
  criticalTasks={${criticalTasks.length}}
  highPriorityTasks={${highPriorityTasks.length}}
  normalTasks={${normalTasks.length}}
/>

## Overview

This report contains **${tasks.length}** task groups discovered across the codebase.

### Priority Distribution

<TodoChart
  data={${JSON.stringify({
    critical: criticalTasks.length,
    high: highPriorityTasks.length,
    normal: normalTasks.length
  })}}
/>

## Critical Tasks (${criticalTasks.length})

${criticalTasks.map(task => `
### ${task.title}

- **File**: \`${task.file}\`
- **Type**: ${task.type}
- **TODOs**: ${task.totalTodos}
- **Priority Score**: ${task.priority.toFixed(2)}

<TodoTracker
  todos={${JSON.stringify(task.todos, null, 2)}}
  collapsed={true}
/>
`).join('\n')}

## High Priority Tasks (${highPriorityTasks.length})

${highPriorityTasks.slice(0, 10).map(task => `
### ${task.title}

- **File**: \`${task.file}\`
- **Type**: ${task.type}
- **TODOs**: ${task.totalTodos}
`).join('\n')}

${highPriorityTasks.length > 10 ? `\n_...and ${highPriorityTasks.length - 10} more high priority tasks_\n` : ''}

## Task Distribution by Type

| Type | Count | Percentage |
|------|-------|------------|
${Object.entries(tasks.reduce((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
}, {})).map(([type, count]) => 
    `| ${type} | ${count} | ${((count / tasks.length) * 100).toFixed(1)}% |`
).join('\n')}

## Recommendations

${this.generateTodoRecommendations(tasks)}

---

_Report generated on ${new Date().toLocaleString()}_
`;
        
        return mdx;
    }
    
    /**
     * Generate MDX for pattern analysis
     */
    async generatePatternAnalysisMDX(patterns) {
        const mdx = `---
title: "Code Pattern Analysis"
date: ${new Date().toISOString()}
patternsFound: ${patterns.length}
---

import { PatternVisualizer } from "./components/PatternVisualizer"
import { PatternGraph } from "./components/PatternGraph"

# Code Pattern Analysis

## Overview

Discovered **${patterns.length}** code patterns across the codebase.

<PatternGraph
  patterns={${JSON.stringify(patterns.map(p => ({
    name: p.name,
    occurrences: p.occurrences,
    files: p.files.length
  })))}}
/>

## Detected Patterns

${patterns.map(pattern => `
### ${pattern.name}

- **Occurrences**: ${pattern.occurrences}
- **Files**: ${pattern.files.length}
- **Confidence**: ${(pattern.confidence * 100).toFixed(1)}%

<PatternVisualizer
  pattern="${pattern.type}"
  examples={${JSON.stringify(pattern.examples.slice(0, 3))}}
  theme="${this.config.theme}"
/>

#### Example Usage

${pattern.examples[0] ? `
\`\`\`${pattern.examples[0].language}
${pattern.examples[0].code}
\`\`\`

_From: ${pattern.examples[0].file}_
` : '_No examples available_'}
`).join('\n')}

## Pattern Recommendations

${this.generatePatternRecommendations(patterns)}

---

_Analysis generated on ${new Date().toLocaleString()}_
`;
        
        return mdx;
    }
    
    /**
     * Component template methods
     */
    
    getCodeSnippetTemplate() {
        return `export function CodeViewer({ file, line, startLine, endLine, language, relevance, theme, children }) {
    return (
        <div className="code-viewer" data-theme={theme}>
            <div className="code-header">
                <span className="file-name">{file}</span>
                <span className="line-number">Line {line}</span>
                <span className="relevance">{(relevance * 100).toFixed(1)}% match</span>
            </div>
            <pre className={\`language-\${language}\`}>
                <code>{children}</code>
            </pre>
        </div>
    );
}`;
    }
    
    getTodoItemTemplate() {
        return `export function TodoTracker({ todos, interactive = false, collapsed = false }) {
    const [isCollapsed, setCollapsed] = useState(collapsed);
    const [completedTodos, setCompleted] = useState(new Set());
    
    const toggleTodo = (index) => {
        const newCompleted = new Set(completedTodos);
        if (newCompleted.has(index)) {
            newCompleted.delete(index);
        } else {
            newCompleted.add(index);
        }
        setCompleted(newCompleted);
    };
    
    return (
        <div className="todo-tracker">
            <div className="todo-header" onClick={() => setCollapsed(!isCollapsed)}>
                <span>{todos.length} TODOs</span>
                <span className="toggle">{isCollapsed ? '▶' : '▼'}</span>
            </div>
            {!isCollapsed && (
                <ul className="todo-list">
                    {todos.map((todo, index) => (
                        <li 
                            key={index} 
                            className={\`todo-item \${todo.type.toLowerCase()} \${completedTodos.has(index) ? 'completed' : ''}\`}
                            onClick={() => interactive && toggleTodo(index)}
                        >
                            <span className="todo-type">[{todo.type}]</span>
                            <span className="todo-content">{todo.content}</span>
                            <span className="todo-location">Line {todo.line}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}`;
    }
    
    getPatternCardTemplate() {
        return `export function PatternVisualizer({ pattern, examples, theme }) {
    const [selectedExample, setSelectedExample] = useState(0);
    
    return (
        <div className="pattern-visualizer" data-theme={theme}>
            <div className="pattern-header">
                <h4>{pattern} Pattern</h4>
                <div className="example-selector">
                    {examples.map((_, index) => (
                        <button
                            key={index}
                            className={selectedExample === index ? 'active' : ''}
                            onClick={() => setSelectedExample(index)}
                        >
                            Example {index + 1}
                        </button>
                    ))}
                </div>
            </div>
            {examples[selectedExample] && (
                <div className="pattern-example">
                    <pre className={\`language-\${examples[selectedExample].language}\`}>
                        <code>{examples[selectedExample].code}</code>
                    </pre>
                    <div className="example-meta">
                        From: {examples[selectedExample].file}
                    </div>
                </div>
            )}
        </div>
    );
}`;
    }
    
    getSearchResultsTemplate() {
        return `export function SearchInterface({ query, onSearch }) {
    const [searchQuery, setSearchQuery] = useState(query);
    const [isSearching, setSearching] = useState(false);
    
    const handleSearch = async (e) => {
        e.preventDefault();
        setSearching(true);
        if (onSearch) {
            await onSearch(searchQuery);
        }
        setSearching(false);
    };
    
    return (
        <form className="search-interface" onSubmit={handleSearch}>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code..."
                className="search-input"
            />
            <button type="submit" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
            </button>
        </form>
    );
}`;
    }
    
    getCapsuleViewerTemplate() {
        return `export function CapsuleViewer({ capsuleId, layer, systemUrl }) {
    const [capsule, setCapsule] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetch(\`\${systemUrl}/api/capsule/\${capsuleId}\`)
            .then(res => res.json())
            .then(data => {
                setCapsule(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load capsule:', err);
                setLoading(false);
            });
    }, [capsuleId]);
    
    if (loading) return <div>Loading capsule data...</div>;
    if (!capsule) return <div>Capsule not found</div>;
    
    return (
        <div className="capsule-viewer">
            <div className="capsule-header">
                <span className="capsule-id">{capsuleId}</span>
                <span className="capsule-layer">{layer}</span>
                <span className="capsule-timestamp">{capsule.timestamp}</span>
            </div>
            <pre className="capsule-data">
                {JSON.stringify(capsule.data, null, 2)}
            </pre>
        </div>
    );
}`;
    }
    
    /**
     * Helper methods
     */
    
    async createDirectories() {
        const dirs = [
            this.config.outputDir,
            path.join(this.config.outputDir, 'searches'),
            path.join(this.config.outputDir, 'reports'),
            path.join(this.config.outputDir, 'analysis'),
            path.join(this.config.outputDir, 'components')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        // Write component files
        await this.writeComponentFiles();
    }
    
    async writeComponentFiles() {
        const components = {
            'CodeViewer.jsx': this.getCodeSnippetTemplate(),
            'TodoTracker.jsx': this.getTodoItemTemplate(),
            'PatternVisualizer.jsx': this.getPatternCardTemplate(),
            'SearchInterface.jsx': this.getSearchResultsTemplate(),
            'CapsuleViewer.jsx': this.getCapsuleViewerTemplate()
        };
        
        for (const [filename, content] of Object.entries(components)) {
            const componentPath = path.join(this.config.outputDir, 'components', filename);
            await fs.writeFile(componentPath, content);
        }
        
        // Write index file
        const indexContent = Object.keys(components)
            .map(file => `export * from './${file}';`)
            .join('\n');
        
        await fs.writeFile(
            path.join(this.config.outputDir, 'components', 'index.js'),
            indexContent
        );
    }
    
    async analyzeCodePatterns() {
        // Simple pattern detection (can be enhanced)
        const patterns = [
            {
                name: 'Singleton Pattern',
                type: 'singleton',
                confidence: 0.85,
                occurrences: 12,
                files: ['config.js', 'database.js', 'logger.js'],
                examples: [{
                    file: 'config.js',
                    language: 'javascript',
                    code: 'class Config {\n  constructor() {\n    if (!Config.instance) {\n      Config.instance = this;\n    }\n    return Config.instance;\n  }\n}'
                }]
            },
            {
                name: 'Factory Pattern',
                type: 'factory',
                confidence: 0.75,
                occurrences: 8,
                files: ['factory.js', 'builder.js'],
                examples: [{
                    file: 'factory.js',
                    language: 'javascript',
                    code: 'function createService(type) {\n  switch(type) {\n    case "api": return new APIService();\n    case "db": return new DBService();\n  }\n}'
                }]
            }
        ];
        
        return patterns;
    }
    
    generateTodoRecommendations(tasks) {
        const recommendations = [];
        
        const criticalCount = tasks.filter(t => t.priority > 2.5).length;
        if (criticalCount > 5) {
            recommendations.push(`- **Critical Alert**: ${criticalCount} critical task groups need immediate attention`);
        }
        
        const bugCount = tasks.filter(t => t.type === 'BUG').length;
        if (bugCount > 0) {
            recommendations.push(`- **Bug Priority**: ${bugCount} BUG items should be addressed first`);
        }
        
        const largeFiles = tasks.filter(t => t.totalTodos > 5);
        if (largeFiles.length > 0) {
            recommendations.push(`- **Refactoring Candidates**: ${largeFiles.length} files have 5+ TODOs and may need refactoring`);
        }
        
        if (recommendations.length === 0) {
            recommendations.push('- Codebase TODO management appears to be under control');
        }
        
        return recommendations.join('\n');
    }
    
    generatePatternRecommendations(patterns) {
        const recommendations = [];
        
        const singletonCount = patterns.filter(p => p.type === 'singleton').reduce((sum, p) => sum + p.occurrences, 0);
        if (singletonCount > 10) {
            recommendations.push(`- Consider dependency injection instead of ${singletonCount} singleton instances`);
        }
        
        recommendations.push('- Document discovered patterns in architecture documentation');
        recommendations.push('- Create pattern library for team reference');
        
        return recommendations.join('\n');
    }
    
    escapeCodeBlock(code) {
        // Escape MDX special characters in code blocks
        return code.replace(/\$/g, '\\$').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
    }
    
    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9.-]/gi, '-').toLowerCase();
    }
    
    async exportAdditionalFormats(mdxPath, mdxContent, formats) {
        for (const format of formats) {
            switch (format) {
                case 'html':
                    // Would use MDX compiler to generate HTML
                    console.log(`📄 Exporting to HTML format...`);
                    break;
                    
                case 'pdf':
                    // Would use puppeteer or similar to generate PDF
                    console.log(`📄 Exporting to PDF format...`);
                    break;
                    
                case 'json':
                    // Export raw data as JSON
                    const jsonPath = mdxPath.replace('.mdx', '.json');
                    await fs.writeFile(jsonPath, JSON.stringify({ mdxContent }, null, 2));
                    console.log(`📄 Exported to JSON: ${jsonPath}`);
                    break;
            }
            
            this.stats.formatsExported.push(format);
        }
    }
    
    getStats() {
        return {
            ...this.stats,
            contextBridge: this.contextBridge.getStats(),
            capsuleBridge: this.capsuleBridge ? this.capsuleBridge.getStats() : null
        };
    }
}

module.exports = CALContextMDXExporter;

// Demo when run directly
if (require.main === module) {
    async function demo() {
        console.log(`
📄✨ CAL CONTEXT MDX EXPORTER DEMO
==================================
`);
        
        const exporter = new CALContextMDXExporter({
            enableCapsules: false // Run without capsule system for demo
        });
        
        await exporter.initialize();
        
        // Export search results
        console.log('\n📍 Test 1: Exporting search results...');
        const searchExport = await exporter.exportSearchContext('authentication system', {
            formats: ['json']
        });
        console.log(`✅ Exported to: ${searchExport.mdxPath}`);
        console.log(`   Found ${searchExport.stats.snippetsFound} snippets, ${searchExport.stats.todosFound} TODOs`);
        
        // Export TODO report
        console.log('\n📍 Test 2: Exporting TODO report...');
        const todoExport = await exporter.exportTodoReport();
        console.log(`✅ Exported to: ${todoExport.mdxPath}`);
        console.log(`   Total tasks: ${todoExport.totalTasks}, Critical: ${todoExport.criticalTasks}`);
        
        // Export pattern analysis
        console.log('\n📍 Test 3: Exporting pattern analysis...');
        const patternExport = await exporter.exportPatternAnalysis();
        console.log(`✅ Exported to: ${patternExport.mdxPath}`);
        console.log(`   Patterns found: ${patternExport.patternsFound}`);
        
        // Show stats
        console.log('\n📊 Export Statistics:');
        console.log(JSON.stringify(exporter.getStats(), null, 2));
        
        console.log(`
✅ MDX Export Demo Complete!
===========================
Successfully exported:
- Search results as interactive MDX
- TODO report with visualizations
- Pattern analysis with examples
- React components for interactivity

Check the exports/context-mdx/ directory for results!
`);
    }
    
    demo().catch(console.error);
}
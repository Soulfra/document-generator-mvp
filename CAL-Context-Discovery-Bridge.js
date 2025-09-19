#!/usr/bin/env node

/**
 * 🧠 CAL CONTEXT DISCOVERY BRIDGE
 * 
 * Connects CAL (Cognitive Automation Layer) and consultation systems
 * with the Master Discovery Orchestrator for context-aware code search,
 * TODO extraction, and intelligent code snippet retrieval.
 * 
 * Features:
 * - Context-aware code search for AI consultations
 * - TODO extraction from code comments
 * - Code snippet retrieval with semantic understanding
 * - Pattern matching for similar implementations
 * - Integration with existing CAL orchestrators
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

console.log(`
🧠 CAL CONTEXT DISCOVERY BRIDGE 🧠
==================================
AI-Powered Code Context | TODO Management | Intelligent Search
Bridging CAL Systems with Discovery Engine
`);

class CALContextDiscoveryBridge {
    constructor(config = {}) {
        this.config = {
            // Discovery settings
            maxSnippets: config.maxSnippets || 10,
            contextRadius: config.contextRadius || 50, // Lines around found code
            enableTodoExtraction: config.enableTodoExtraction !== false,
            enablePatternAnalysis: config.enablePatternAnalysis !== false,
            
            // CAL integration points
            calOrchestratorUrl: config.calOrchestratorUrl || 'http://localhost:3456',
            consultationEngineUrl: config.consultationEngineUrl || 'http://localhost:3457',
            
            // Cache settings
            enableCaching: config.enableCaching !== false,
            cacheDir: config.cacheDir || '.cal-context-cache',
            cacheTimeout: config.cacheTimeout || 1800000, // 30 minutes
            
            // Search patterns
            todoPatterns: [
                /\/\/\s*TODO\s*:?\s*(.+)/gi,
                /\/\/\s*FIXME\s*:?\s*(.+)/gi,
                /\/\/\s*HACK\s*:?\s*(.+)/gi,
                /\/\/\s*NOTE\s*:?\s*(.+)/gi,
                /\/\/\s*BUG\s*:?\s*(.+)/gi,
                /\/\*\s*TODO\s*:?\s*(.+?)\*\//gi,
                /#\s*TODO\s*:?\s*(.+)/gi,
                /<!--\s*TODO\s*:?\s*(.+?)-->/gi
            ],
            
            ...config
        };
        
        // State
        this.discoveryOrchestrator = null;
        this.codeIndex = new Map();
        this.todoDatabase = new Map();
        this.contextCache = new Map();
        this.patternLibrary = new Map();
        
        // Statistics
        this.stats = {
            totalSearches: 0,
            todosExtracted: 0,
            snippetsRetrieved: 0,
            patternsMatched: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        console.log('🔧 Initializing CAL Context Discovery Bridge...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create cache directory
            await fs.mkdir(this.config.cacheDir, { recursive: true });
            
            // Try to load existing discovery orchestrator
            try {
                const MasterDiscoveryOrchestrator = require('./MasterDiscoveryOrchestrator.js');
                this.discoveryOrchestrator = new MasterDiscoveryOrchestrator({
                    enableLearning: true,
                    enableCaching: true,
                    maxResults: this.config.maxSnippets
                });
                console.log('✅ Connected to Master Discovery Orchestrator');
            } catch (error) {
                console.warn('⚠️ Master Discovery Orchestrator not available, using fallback');
                console.warn('   Reason:', error.message);
                // Set to null to use fallback methods
                this.discoveryOrchestrator = null;
            }
            
            // Build initial code index
            await this.buildCodeIndex();
            
            // Extract TODOs if enabled
            if (this.config.enableTodoExtraction) {
                await this.extractAllTodos();
            }
            
            console.log('✅ CAL Context Discovery Bridge initialized');
            console.log(`📊 Indexed ${this.codeIndex.size} files`);
            console.log(`📝 Found ${this.todoDatabase.size} TODOs`);
            
        } catch (error) {
            console.error('❌ Failed to initialize CAL Context Discovery Bridge:', error);
            throw error;
        }
    }
    
    /**
     * Main search method for CAL systems to get context
     */
    async searchWithContext(query, options = {}) {
        const startTime = Date.now();
        const searchId = crypto.randomBytes(8).toString('hex');
        
        console.log(`🔍 CAL Context Search: "${query}" (ID: ${searchId})`);
        
        this.stats.totalSearches++;
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(query, options);
            if (this.config.enableCaching && this.contextCache.has(cacheKey)) {
                this.stats.cacheHits++;
                console.log('📋 Cache hit for query');
                return this.contextCache.get(cacheKey);
            }
            this.stats.cacheMisses++;
            
            // Perform multi-faceted search
            const results = await Promise.all([
                this.searchCodeSnippets(query, options),
                this.searchTodos(query, options),
                this.searchPatterns(query, options),
                this.searchWithDiscoveryEngine(query, options)
            ]);
            
            const [codeSnippets, todos, patterns, discoveries] = results;
            
            // Build context response
            const context = {
                query,
                searchId,
                timestamp: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                
                // Search results
                codeSnippets: this.rankAndFilterSnippets(codeSnippets, options),
                todos: this.filterRelevantTodos(todos, options),
                patterns: this.consolidatePatterns(patterns, options),
                discoveries: discoveries?.results || [],
                
                // Metadata
                summary: this.generateContextSummary(codeSnippets, todos, patterns),
                suggestions: this.generateSuggestions(query, codeSnippets, todos),
                relatedQueries: this.generateRelatedQueries(query, discoveries),
                
                // Statistics
                stats: {
                    snippetsFound: codeSnippets.length,
                    todosFound: todos.length,
                    patternsFound: patterns.length,
                    discoveriesFound: discoveries?.totalResults || 0
                }
            };
            
            // Cache the results
            if (this.config.enableCaching) {
                this.cacheContext(cacheKey, context);
            }
            
            console.log(`✅ Context search completed in ${context.executionTime}ms`);
            
            return context;
            
        } catch (error) {
            console.error(`❌ Context search failed for "${query}":`, error);
            throw error;
        }
    }
    
    /**
     * Search for code snippets
     */
    async searchCodeSnippets(query, options) {
        const snippets = [];
        const searchTerms = this.extractSearchTerms(query);
        
        for (const [filePath, fileContent] of this.codeIndex) {
            const matches = this.findMatchesInFile(fileContent, searchTerms);
            
            if (matches.length > 0) {
                for (const match of matches) {
                    const snippet = this.extractCodeSnippet(fileContent, match, options);
                    snippets.push({
                        file: filePath,
                        ...snippet,
                        relevance: this.calculateRelevance(snippet.content, query),
                        type: 'code'
                    });
                }
            }
        }
        
        this.stats.snippetsRetrieved += snippets.length;
        return snippets.sort((a, b) => b.relevance - a.relevance);
    }
    
    /**
     * Search TODOs
     */
    async searchTodos(query, options) {
        const relevantTodos = [];
        const searchTerms = this.extractSearchTerms(query);
        
        for (const [todoId, todo] of this.todoDatabase) {
            const relevance = this.calculateTodoRelevance(todo, searchTerms);
            if (relevance > 0.3) {
                relevantTodos.push({
                    ...todo,
                    relevance,
                    id: todoId
                });
            }
        }
        
        return relevantTodos.sort((a, b) => b.relevance - a.relevance);
    }
    
    /**
     * Search for patterns
     */
    async searchPatterns(query, options) {
        const patterns = [];
        
        // Look for common code patterns related to the query
        const patternTypes = this.identifyPatternTypes(query);
        
        for (const patternType of patternTypes) {
            const matchingPatterns = await this.findPatternsOfType(patternType);
            patterns.push(...matchingPatterns);
        }
        
        this.stats.patternsMatched += patterns.length;
        return patterns;
    }
    
    /**
     * Use the discovery engine if available
     */
    async searchWithDiscoveryEngine(query, options) {
        if (!this.discoveryOrchestrator) {
            return null;
        }
        
        try {
            return await this.discoveryOrchestrator.discover(query, {
                maxResults: options.maxResults || this.config.maxSnippets
            });
        } catch (error) {
            console.warn('Discovery engine search failed:', error.message);
            return null;
        }
    }
    
    /**
     * Build code index by scanning the codebase
     */
    async buildCodeIndex() {
        console.log('📚 Building code index...');
        
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.go', '.rs'];
        const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
        
        const indexFile = async (filePath) => {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                this.codeIndex.set(filePath, content);
            } catch (error) {
                // Skip files that can't be read
            }
        };
        
        const scanDirectory = async (dir) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory()) {
                        if (!ignoreDirs.includes(entry.name)) {
                            await scanDirectory(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (extensions.includes(ext)) {
                            await indexFile(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories that can't be read
            }
        };
        
        await scanDirectory(process.cwd());
        console.log(`✅ Indexed ${this.codeIndex.size} code files`);
    }
    
    /**
     * Extract all TODOs from the codebase
     */
    async extractAllTodos() {
        console.log('📝 Extracting TODOs...');
        
        for (const [filePath, content] of this.codeIndex) {
            const todos = this.extractTodosFromFile(content, filePath);
            
            for (const todo of todos) {
                const todoId = crypto.createHash('sha256')
                    .update(filePath + todo.line + todo.content)
                    .digest('hex')
                    .substring(0, 12);
                
                this.todoDatabase.set(todoId, todo);
            }
        }
        
        this.stats.todosExtracted = this.todoDatabase.size;
        console.log(`✅ Extracted ${this.todoDatabase.size} TODOs`);
    }
    
    /**
     * Extract TODOs from a file
     */
    extractTodosFromFile(content, filePath) {
        const todos = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            for (const pattern of this.config.todoPatterns) {
                const matches = line.matchAll(pattern);
                for (const match of matches) {
                    todos.push({
                        type: match[0].match(/TODO|FIXME|HACK|NOTE|BUG/i)?.[0]?.toUpperCase() || 'TODO',
                        content: match[1]?.trim() || match[0],
                        file: filePath,
                        line: index + 1,
                        fullLine: line,
                        context: this.extractLineContext(lines, index),
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        return todos;
    }
    
    /**
     * Extract code snippet with context
     */
    extractCodeSnippet(fileContent, match, options) {
        const lines = fileContent.split('\n');
        const lineNumber = match.line || 0;
        const radius = options.contextRadius || this.config.contextRadius;
        
        const startLine = Math.max(0, lineNumber - radius);
        const endLine = Math.min(lines.length - 1, lineNumber + radius);
        
        const snippet = lines.slice(startLine, endLine + 1).join('\n');
        
        return {
            content: snippet,
            lineNumber: lineNumber + 1,
            startLine: startLine + 1,
            endLine: endLine + 1,
            matchedLine: lines[lineNumber],
            language: this.detectLanguage(match.file)
        };
    }
    
    /**
     * Helper methods
     */
    
    extractSearchTerms(query) {
        return query.toLowerCase()
            .split(/\s+/)
            .filter(term => term.length > 2);
    }
    
    findMatchesInFile(content, searchTerms) {
        const matches = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            const lowerLine = line.toLowerCase();
            const matchCount = searchTerms.filter(term => lowerLine.includes(term)).length;
            
            if (matchCount > 0) {
                matches.push({
                    line: index,
                    content: line,
                    matchCount,
                    score: matchCount / searchTerms.length
                });
            }
        });
        
        return matches.sort((a, b) => b.score - a.score);
    }
    
    calculateRelevance(content, query) {
        const contentLower = content.toLowerCase();
        const queryLower = query.toLowerCase();
        const queryTerms = this.extractSearchTerms(query);
        
        let score = 0;
        
        // Exact match bonus
        if (contentLower.includes(queryLower)) {
            score += 0.5;
        }
        
        // Term frequency
        for (const term of queryTerms) {
            const termCount = (contentLower.match(new RegExp(term, 'g')) || []).length;
            score += Math.min(termCount * 0.1, 0.3);
        }
        
        return Math.min(score, 1);
    }
    
    calculateTodoRelevance(todo, searchTerms) {
        const todoText = `${todo.content} ${todo.fullLine}`.toLowerCase();
        const matchCount = searchTerms.filter(term => todoText.includes(term)).length;
        
        return matchCount / searchTerms.length;
    }
    
    extractLineContext(lines, index, radius = 2) {
        const start = Math.max(0, index - radius);
        const end = Math.min(lines.length - 1, index + radius);
        
        return lines.slice(start, end + 1)
            .map((line, i) => ({
                line: start + i + 1,
                content: line,
                isMatch: start + i === index
            }));
    }
    
    detectLanguage(filePath) {
        const ext = path.extname(filePath);
        const languageMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'jsx',
            '.tsx': 'tsx',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.go': 'go',
            '.rs': 'rust',
            '.md': 'markdown'
        };
        
        return languageMap[ext] || 'text';
    }
    
    identifyPatternTypes(query) {
        const patterns = [];
        
        const patternKeywords = {
            'singleton': ['singleton', 'instance', 'global'],
            'factory': ['factory', 'create', 'build'],
            'observer': ['observer', 'subscribe', 'listen'],
            'adapter': ['adapter', 'wrapper', 'bridge'],
            'strategy': ['strategy', 'algorithm', 'policy'],
            'async': ['async', 'await', 'promise'],
            'error': ['error', 'exception', 'catch', 'throw'],
            'validation': ['validate', 'check', 'verify'],
            'authentication': ['auth', 'login', 'token', 'session']
        };
        
        const queryLower = query.toLowerCase();
        
        for (const [pattern, keywords] of Object.entries(patternKeywords)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                patterns.push(pattern);
            }
        }
        
        return patterns;
    }
    
    async findPatternsOfType(patternType) {
        // This would search for specific code patterns
        // For now, return placeholder data
        return [{
            type: patternType,
            description: `Common ${patternType} pattern`,
            examples: [],
            files: []
        }];
    }
    
    rankAndFilterSnippets(snippets, options) {
        const maxSnippets = options.maxSnippets || this.config.maxSnippets;
        
        return snippets
            .filter(snippet => snippet.relevance > 0.2)
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, maxSnippets);
    }
    
    filterRelevantTodos(todos, options) {
        return todos
            .filter(todo => todo.relevance > 0.3)
            .slice(0, options.maxTodos || 20);
    }
    
    consolidatePatterns(patterns, options) {
        // Group patterns by type and deduplicate
        const consolidated = new Map();
        
        for (const pattern of patterns) {
            if (!consolidated.has(pattern.type)) {
                consolidated.set(pattern.type, pattern);
            }
        }
        
        return Array.from(consolidated.values());
    }
    
    generateContextSummary(snippets, todos, patterns) {
        return {
            totalSnippets: snippets.length,
            totalTodos: todos.length,
            totalPatterns: patterns.length,
            topFiles: this.getTopFiles(snippets),
            todoTypes: this.getTodoTypes(todos),
            patternTypes: patterns.map(p => p.type)
        };
    }
    
    generateSuggestions(query, snippets, todos) {
        const suggestions = [];
        
        if (snippets.length === 0) {
            suggestions.push('Try broader search terms or check spelling');
        }
        
        if (todos.length > 5) {
            suggestions.push(`Found ${todos.length} TODOs related to "${query}" - consider creating a focused task list`);
        }
        
        const topFiles = this.getTopFiles(snippets);
        if (topFiles.length > 0) {
            suggestions.push(`Focus on ${topFiles[0]} which has the most matches`);
        }
        
        return suggestions;
    }
    
    generateRelatedQueries(query, discoveries) {
        const related = new Set();
        
        // Add terms from discoveries
        if (discoveries?.results) {
            discoveries.results.forEach(result => {
                if (result.data?.tags) {
                    result.data.tags.forEach(tag => related.add(tag));
                }
            });
        }
        
        // Add common related terms
        const queryLower = query.toLowerCase();
        if (queryLower.includes('auth')) {
            related.add('login');
            related.add('session');
            related.add('token');
        }
        
        return Array.from(related).filter(term => !query.includes(term)).slice(0, 5);
    }
    
    getTopFiles(snippets) {
        const fileCounts = new Map();
        
        snippets.forEach(snippet => {
            const count = fileCounts.get(snippet.file) || 0;
            fileCounts.set(snippet.file, count + 1);
        });
        
        return Array.from(fileCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([file]) => file);
    }
    
    getTodoTypes(todos) {
        const types = new Map();
        
        todos.forEach(todo => {
            const count = types.get(todo.type) || 0;
            types.set(todo.type, count + 1);
        });
        
        return Object.fromEntries(types);
    }
    
    generateCacheKey(query, options) {
        return crypto.createHash('sha256')
            .update(JSON.stringify({ query, options }))
            .digest('hex');
    }
    
    cacheContext(key, context) {
        this.contextCache.set(key, context);
        
        // Set expiration
        setTimeout(() => {
            this.contextCache.delete(key);
        }, this.config.cacheTimeout);
    }
    
    /**
     * Integration methods for CAL systems
     */
    
    async provideContextToCAL(query, calSystemId) {
        console.log(`🤝 Providing context to CAL system: ${calSystemId}`);
        
        const context = await this.searchWithContext(query);
        
        // Format for CAL consumption
        const calContext = {
            systemId: calSystemId,
            timestamp: new Date().toISOString(),
            query,
            relevantCode: context.codeSnippets.map(snippet => ({
                content: snippet.content,
                file: snippet.file,
                line: snippet.lineNumber,
                relevance: snippet.relevance
            })),
            pendingTasks: context.todos.map(todo => ({
                task: todo.content,
                location: `${todo.file}:${todo.line}`,
                type: todo.type,
                priority: this.inferPriority(todo)
            })),
            suggestedPatterns: context.patterns,
            additionalContext: {
                summary: context.summary,
                suggestions: context.suggestions,
                relatedConcepts: context.relatedQueries
            }
        };
        
        return calContext;
    }
    
    async extractTodosForTaskManager() {
        console.log('📋 Extracting TODOs for task manager...');
        
        const todos = Array.from(this.todoDatabase.values());
        
        // Group by file and type
        const groupedTodos = new Map();
        
        todos.forEach(todo => {
            const key = `${todo.file}:${todo.type}`;
            if (!groupedTodos.has(key)) {
                groupedTodos.set(key, []);
            }
            groupedTodos.get(key).push(todo);
        });
        
        // Format for task manager
        const tasks = [];
        
        for (const [key, todoGroup] of groupedTodos) {
            const [file, type] = key.split(':');
            
            tasks.push({
                id: crypto.createHash('sha256').update(key).digest('hex').substring(0, 12),
                title: `${type} tasks in ${path.basename(file)}`,
                file,
                type,
                todos: todoGroup.map(todo => ({
                    content: todo.content,
                    line: todo.line,
                    context: todo.context
                })),
                totalTodos: todoGroup.length,
                priority: this.inferGroupPriority(todoGroup)
            });
        }
        
        return tasks.sort((a, b) => b.priority - a.priority);
    }
    
    inferPriority(todo) {
        if (todo.type === 'FIXME' || todo.type === 'BUG') return 'high';
        if (todo.type === 'TODO') return 'medium';
        return 'low';
    }
    
    inferGroupPriority(todoGroup) {
        const priorities = { high: 3, medium: 2, low: 1 };
        const totalPriority = todoGroup.reduce((sum, todo) => {
            const priority = this.inferPriority(todo);
            return sum + priorities[priority];
        }, 0);
        
        return totalPriority / todoGroup.length;
    }
    
    /**
     * API methods
     */
    
    getStats() {
        return {
            ...this.stats,
            codeFiles: this.codeIndex.size,
            totalTodos: this.todoDatabase.size,
            cacheSize: this.contextCache.size,
            patternTypes: this.patternLibrary.size
        };
    }
    
    clearCache() {
        this.contextCache.clear();
        console.log('🗑️ Context cache cleared');
    }
    
    async refreshIndex() {
        console.log('🔄 Refreshing code index...');
        this.codeIndex.clear();
        this.todoDatabase.clear();
        
        await this.buildCodeIndex();
        
        if (this.config.enableTodoExtraction) {
            await this.extractAllTodos();
        }
        
        console.log('✅ Index refreshed');
    }
}

module.exports = CALContextDiscoveryBridge;

// CLI interface
if (require.main === module) {
    const bridge = new CALContextDiscoveryBridge({
        enableTodoExtraction: true,
        enablePatternAnalysis: true,
        maxSnippets: 5
    });
    
    // Example usage
    setTimeout(async () => {
        try {
            console.log('\n🧪 Testing CAL Context Discovery Bridge...');
            
            // Test context search
            const context = await bridge.searchWithContext('authentication system');
            
            console.log('\n📊 SEARCH RESULTS:');
            console.log(`Found ${context.stats.snippetsFound} code snippets`);
            console.log(`Found ${context.stats.todosFound} related TODOs`);
            console.log(`Execution time: ${context.executionTime}ms`);
            
            // Show top code snippets
            if (context.codeSnippets.length > 0) {
                console.log('\n📄 Top Code Snippets:');
                context.codeSnippets.slice(0, 3).forEach((snippet, index) => {
                    console.log(`\n${index + 1}. ${snippet.file} (line ${snippet.lineNumber})`);
                    console.log(`   Relevance: ${(snippet.relevance * 100).toFixed(1)}%`);
                    console.log(`   Language: ${snippet.language}`);
                    console.log(`   Preview: ${snippet.matchedLine.trim()}`);
                });
            }
            
            // Show related TODOs
            if (context.todos.length > 0) {
                console.log('\n📝 Related TODOs:');
                context.todos.slice(0, 5).forEach((todo, index) => {
                    console.log(`${index + 1}. [${todo.type}] ${todo.content}`);
                    console.log(`   ${todo.file}:${todo.line}`);
                });
            }
            
            // Show suggestions
            if (context.suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                context.suggestions.forEach(suggestion => {
                    console.log(`  - ${suggestion}`);
                });
            }
            
            // Test TODO extraction for task manager
            console.log('\n📋 Extracting tasks for task manager...');
            const tasks = await bridge.extractTodosForTaskManager();
            console.log(`Found ${tasks.length} task groups`);
            
            if (tasks.length > 0) {
                console.log('\nTop task groups:');
                tasks.slice(0, 3).forEach((task, index) => {
                    console.log(`${index + 1}. ${task.title} (${task.totalTodos} items)`);
                    console.log(`   Priority: ${task.priority.toFixed(2)}`);
                });
            }
            
            console.log('\n📈 Bridge Stats:', bridge.getStats());
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    }, 2000);
}
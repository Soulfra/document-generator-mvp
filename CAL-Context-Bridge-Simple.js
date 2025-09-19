#!/usr/bin/env node

/**
 * 🧠 CAL CONTEXT BRIDGE (SIMPLIFIED)
 * 
 * A working version of the CAL Context Discovery Bridge
 * that provides context-aware code search for CAL systems
 * without complex dependencies
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CALContextBridgeSimple {
    constructor(config = {}) {
        this.config = {
            maxSnippets: config.maxSnippets || 10,
            contextRadius: config.contextRadius || 50,
            enableTodoExtraction: config.enableTodoExtraction !== false,
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
        
        this.codeIndex = new Map();
        this.todoDatabase = new Map();
        this.stats = {
            totalSearches: 0,
            todosExtracted: 0,
            snippetsRetrieved: 0,
            filesIndexed: 0
        };
        
        console.log('🧠 CAL Context Bridge (Simple) initialized');
    }
    
    async initialize() {
        console.log('📚 Building code index...');
        await this.buildCodeIndex();
        
        if (this.config.enableTodoExtraction) {
            await this.extractAllTodos();
        }
        
        console.log(`✅ Initialized with ${this.codeIndex.size} files, ${this.todoDatabase.size} TODOs`);
    }
    
    async buildCodeIndex() {
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.go', '.rs'];
        const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
        
        const indexFile = async (filePath) => {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                this.codeIndex.set(filePath, content);
                this.stats.filesIndexed++;
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
                        if (!ignoreDirs.includes(entry.name) && !entry.name.startsWith('.')) {
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
                        fullLine: line.trim()
                    });
                }
            }
        });
        
        return todos;
    }
    
    async searchWithContext(query, options = {}) {
        const startTime = Date.now();
        this.stats.totalSearches++;
        
        console.log(`🔍 Searching for: "${query}"`);
        
        // Search code snippets
        const codeSnippets = this.searchCodeSnippets(query, options);
        
        // Search TODOs
        const todos = this.searchTodos(query);
        
        // Generate context
        const context = {
            query,
            timestamp: new Date().toISOString(),
            executionTime: Date.now() - startTime,
            
            codeSnippets: codeSnippets.slice(0, this.config.maxSnippets),
            todos: todos.slice(0, 20),
            
            summary: {
                totalSnippets: codeSnippets.length,
                totalTodos: todos.length,
                topFiles: this.getTopFiles(codeSnippets)
            },
            
            suggestions: this.generateSuggestions(query, codeSnippets, todos),
            relatedQueries: this.generateRelatedQueries(query),
            
            stats: {
                snippetsFound: codeSnippets.length,
                todosFound: todos.length,
                executionTime: Date.now() - startTime
            }
        };
        
        console.log(`✅ Found ${codeSnippets.length} snippets, ${todos.length} TODOs in ${context.executionTime}ms`);
        
        return context;
    }
    
    searchCodeSnippets(query, options) {
        const snippets = [];
        const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        
        for (const [filePath, content] of this.codeIndex) {
            const lines = content.split('\n');
            const matches = [];
            
            lines.forEach((line, index) => {
                const lowerLine = line.toLowerCase();
                const matchCount = searchTerms.filter(term => lowerLine.includes(term)).length;
                
                if (matchCount > 0) {
                    matches.push({
                        line: index,
                        content: line,
                        matchCount,
                        relevance: matchCount / searchTerms.length
                    });
                }
            });
            
            // Add top matches from this file
            matches.sort((a, b) => b.relevance - a.relevance)
                .slice(0, 3)
                .forEach(match => {
                    snippets.push({
                        file: filePath,
                        lineNumber: match.line + 1,
                        content: this.extractContext(lines, match.line),
                        matchedLine: match.content.trim(),
                        relevance: match.relevance,
                        language: this.detectLanguage(filePath)
                    });
                });
        }
        
        this.stats.snippetsRetrieved += snippets.length;
        return snippets.sort((a, b) => b.relevance - a.relevance);
    }
    
    searchTodos(query) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const relevantTodos = [];
        
        for (const [todoId, todo] of this.todoDatabase) {
            const todoText = `${todo.content} ${todo.fullLine}`.toLowerCase();
            const matchCount = searchTerms.filter(term => todoText.includes(term)).length;
            
            if (matchCount > 0) {
                relevantTodos.push({
                    ...todo,
                    relevance: matchCount / searchTerms.length,
                    id: todoId
                });
            }
        }
        
        return relevantTodos.sort((a, b) => b.relevance - a.relevance);
    }
    
    extractContext(lines, index, radius = 3) {
        const start = Math.max(0, index - radius);
        const end = Math.min(lines.length - 1, index + radius);
        return lines.slice(start, end + 1).join('\n');
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
            '.rs': 'rust'
        };
        return languageMap[ext] || 'text';
    }
    
    getTopFiles(snippets) {
        const fileCounts = new Map();
        snippets.forEach(snippet => {
            fileCounts.set(snippet.file, (fileCounts.get(snippet.file) || 0) + 1);
        });
        
        return Array.from(fileCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([file]) => file);
    }
    
    generateSuggestions(query, snippets, todos) {
        const suggestions = [];
        
        if (snippets.length === 0) {
            suggestions.push('Try broader search terms or check spelling');
        }
        
        if (todos.length > 5) {
            suggestions.push(`Found ${todos.length} TODOs related to "${query}" - consider creating a focused task list`);
        }
        
        return suggestions;
    }
    
    generateRelatedQueries(query) {
        const related = [];
        const queryLower = query.toLowerCase();
        
        if (queryLower.includes('auth')) {
            related.push('login', 'session', 'token', 'security', 'user');
        } else if (queryLower.includes('database')) {
            related.push('schema', 'query', 'connection', 'migration');
        } else if (queryLower.includes('api')) {
            related.push('endpoint', 'request', 'response', 'REST');
        }
        
        return related.slice(0, 5);
    }
    
    async provideContextToCAL(query, systemId) {
        console.log(`🤝 Providing context to: ${systemId}`);
        
        const context = await this.searchWithContext(query);
        
        return {
            systemId,
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
                priority: todo.type === 'FIXME' || todo.type === 'BUG' ? 'high' : 'medium'
            })),
            additionalContext: {
                summary: context.summary,
                suggestions: context.suggestions,
                relatedConcepts: context.relatedQueries
            }
        };
    }
    
    async extractTodosForTaskManager() {
        const tasks = [];
        const groupedTodos = new Map();
        
        // Group TODOs by file and type
        for (const [id, todo] of this.todoDatabase) {
            const key = `${todo.file}:${todo.type}`;
            if (!groupedTodos.has(key)) {
                groupedTodos.set(key, []);
            }
            groupedTodos.get(key).push(todo);
        }
        
        // Format for task manager
        for (const [key, todoGroup] of groupedTodos) {
            const [file, type] = key.split(':');
            tasks.push({
                id: crypto.createHash('sha256').update(key).digest('hex').substring(0, 12),
                title: `${type} tasks in ${path.basename(file)}`,
                file,
                type,
                todos: todoGroup.map(todo => ({
                    content: todo.content,
                    line: todo.line
                })),
                totalTodos: todoGroup.length,
                priority: type === 'FIXME' || type === 'BUG' ? 3 : 2
            });
        }
        
        return tasks.sort((a, b) => b.priority - a.priority);
    }
    
    getStats() {
        return {
            ...this.stats,
            codeFiles: this.codeIndex.size,
            totalTodos: this.todoDatabase.size
        };
    }
}

module.exports = CALContextBridgeSimple;

// Demo if run directly
if (require.main === module) {
    async function demo() {
        console.log(`
🧠 CAL CONTEXT BRIDGE (SIMPLE) DEMO
===================================
`);
        
        const bridge = new CALContextBridgeSimple({
            maxSnippets: 5
        });
        
        await bridge.initialize();
        
        // Test search
        const context = await bridge.searchWithContext('authentication system');
        
        console.log('\n📊 Search Results:');
        console.log(`  Code snippets: ${context.stats.snippetsFound}`);
        console.log(`  TODOs: ${context.stats.todosFound}`);
        console.log(`  Execution time: ${context.stats.executionTime}ms`);
        
        if (context.codeSnippets.length > 0) {
            console.log('\n📄 Sample Code Snippet:');
            const snippet = context.codeSnippets[0];
            console.log(`  File: ${snippet.file}`);
            console.log(`  Line: ${snippet.lineNumber}`);
            console.log(`  Preview: ${snippet.matchedLine}`);
        }
        
        if (context.todos.length > 0) {
            console.log('\n📝 Sample TODO:');
            const todo = context.todos[0];
            console.log(`  [${todo.type}] ${todo.content}`);
            console.log(`  Location: ${todo.file}:${todo.line}`);
        }
        
        // Test CAL integration
        const calContext = await bridge.provideContextToCAL('authentication', 'cal-orchestrator');
        console.log('\n🤝 CAL Context prepared with:');
        console.log(`  - ${calContext.relevantCode.length} code snippets`);
        console.log(`  - ${calContext.pendingTasks.length} pending tasks`);
        
        console.log('\n✅ Demo complete!');
    }
    
    demo().catch(console.error);
}
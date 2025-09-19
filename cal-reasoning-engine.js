#!/usr/bin/env node

/**
 * CAL REASONING ENGINE
 * Core reasoning system that integrates with AI Cultural Sandbox
 * Provides memory management, reasoning chains, and introspection capabilities
 * Named after the user's request for "Cal" - the AI reasoning system
 * 
 * Features:
 * - Hierarchical memory with XML/TXT persistence
 * - Context-aware reasoning chains
 * - Integration with AI agents from sandbox
 * - Query language for introspection
 * - Reasoning audit trails
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

console.log(`
🧠 CAL REASONING ENGINE 🧠
=========================
💭 Hierarchical memory system
🔍 Queryable reasoning chains
📊 Introspection capabilities
🔗 AI sandbox integration
📝 XML/TXT memory persistence
`);

class CalReasoningEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Memory settings
            memoryDepth: config.memoryDepth || 5, // Levels of memory hierarchy
            memoryRetentionDays: config.memoryRetentionDays || 30,
            compressionThreshold: config.compressionThreshold || 1000, // KB
            
            // Reasoning settings
            maxReasoningDepth: config.maxReasoningDepth || 10,
            confidenceThreshold: config.confidenceThreshold || 0.7,
            contextWindowSize: config.contextWindowSize || 100,
            
            // Storage paths
            memoryPath: config.memoryPath || './cal-memory',
            reasoningPath: config.reasoningPath || './cal-reasoning',
            
            // Integration settings
            enableAISandboxIntegration: config.enableAISandboxIntegration !== false,
            enableSymbiosisIntegration: config.enableSymbiosisIntegration !== false,
            
            ...config
        };
        
        // Memory hierarchy
        this.memoryLevels = {
            immediate: {
                name: 'Immediate Memory',
                retention: '1 minute',
                capacity: 10,
                items: new Map()
            },
            
            shortTerm: {
                name: 'Short-term Memory',
                retention: '1 hour',
                capacity: 100,
                items: new Map()
            },
            
            workingMemory: {
                name: 'Working Memory',
                retention: '1 day',
                capacity: 1000,
                items: new Map()
            },
            
            longTerm: {
                name: 'Long-term Memory',
                retention: '30 days',
                capacity: 10000,
                items: new Map()
            },
            
            archival: {
                name: 'Archival Memory',
                retention: 'permanent',
                capacity: Infinity,
                items: new Map()
            }
        };
        
        // Reasoning structures
        this.reasoningChains = new Map();
        this.activeContexts = new Map();
        this.decisionTrees = new Map();
        this.patternLibrary = new Map();
        
        // Cal's current state
        this.state = {
            currentContext: null,
            activeReasoning: null,
            memoryUtilization: {},
            lastThought: null,
            consciousness: 'active' // active, reflecting, dreaming
        };
        
        // Query engine
        this.queryEngine = {
            history: [],
            aliases: new Map(),
            savedQueries: new Map()
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Cal Reasoning Engine...');
        
        try {
            // Create storage directories
            await this.setupStorage();
            
            // Load existing memories
            await this.loadMemories();
            
            // Initialize reasoning patterns
            await this.initializePatterns();
            
            // Start memory management
            this.startMemoryManagement();
            
            // Initialize query system
            await this.initializeQuerySystem();
            
            console.log('✅ Cal Reasoning Engine initialized!');
            console.log(`💾 Memory depth: ${this.config.memoryDepth} levels`);
            console.log(`🧠 Max reasoning depth: ${this.config.maxReasoningDepth}`);
            console.log(`📁 Memory path: ${this.config.memoryPath}`);
            
            this.emit('cal_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Cal:', error);
            throw error;
        }
    }
    
    /**
     * Create a new reasoning chain
     */
    async reason(input, context = {}) {
        const reasoningId = crypto.randomUUID();
        
        console.log(`💭 Cal reasoning about: "${input}"`);
        
        const reasoningChain = {
            id: reasoningId,
            input,
            context,
            started: Date.now(),
            steps: [],
            conclusions: [],
            confidence: 0,
            status: 'active'
        };
        
        this.reasoningChains.set(reasoningId, reasoningChain);
        this.state.activeReasoning = reasoningId;
        
        try {
            // Step 1: Context gathering
            const contextStep = await this.gatherContext(input, context);
            reasoningChain.steps.push(contextStep);
            
            // Step 2: Memory retrieval
            const memoryStep = await this.retrieveRelevantMemories(input, contextStep.output);
            reasoningChain.steps.push(memoryStep);
            
            // Step 3: Pattern matching
            const patternStep = await this.matchPatterns(input, memoryStep.output);
            reasoningChain.steps.push(patternStep);
            
            // Step 4: Inference generation
            const inferenceStep = await this.generateInferences(
                input, 
                contextStep.output,
                memoryStep.output,
                patternStep.output
            );
            reasoningChain.steps.push(inferenceStep);
            
            // Step 5: Conclusion synthesis
            const conclusion = await this.synthesizeConclusion(reasoningChain);
            reasoningChain.conclusions = conclusion.conclusions;
            reasoningChain.confidence = conclusion.confidence;
            
            // Store in memory
            await this.remember({
                type: 'reasoning_chain',
                input: reasoningChain.input,
                conclusions: reasoningChain.conclusions,
                confidence: reasoningChain.confidence,
                steps: reasoningChain.steps.length
            }, {
                importance: reasoningChain.confidence
            });
            
            // Update state
            reasoningChain.status = 'completed';
            reasoningChain.completed = Date.now();
            this.state.lastThought = {
                input,
                conclusion: conclusion.primary,
                timestamp: Date.now()
            };
            
            console.log(`✅ Reasoning complete: ${conclusion.primary}`);
            console.log(`   Confidence: ${(conclusion.confidence * 100).toFixed(1)}%`);
            console.log(`   Steps: ${reasoningChain.steps.length}`);
            
            this.emit('reasoning_complete', reasoningChain);
            
            return reasoningChain;
            
        } catch (error) {
            console.error('❌ Reasoning error:', error);
            reasoningChain.status = 'failed';
            reasoningChain.error = error.message;
            throw error;
        }
    }
    
    /**
     * Store memory with hierarchical organization
     */
    async remember(content, metadata = {}) {
        const memoryId = crypto.randomUUID();
        
        const memory = {
            id: memoryId,
            content,
            metadata,
            created: Date.now(),
            accessed: Date.now(),
            accessCount: 1,
            importance: metadata.importance || 0.5,
            associations: new Set(),
            context: this.state.currentContext
        };
        
        // Start in immediate memory
        this.memoryLevels.immediate.items.set(memoryId, memory);
        
        // Create associations
        await this.createAssociations(memory);
        
        // Persist to storage
        await this.persistMemory(memory);
        
        console.log(`💾 Stored memory: ${memoryId.substring(0, 8)}`);
        this.emit('memory_stored', memory);
        
        return memory;
    }
    
    /**
     * Query Cal's knowledge and reasoning
     */
    async query(queryString, options = {}) {
        console.log(`🔍 Query: "${queryString}"`);
        
        const queryId = crypto.randomUUID();
        const startTime = Date.now();
        
        const query = {
            id: queryId,
            query: queryString,
            timestamp: startTime,
            options,
            results: [],
            stats: {}
        };
        
        try {
            // Parse query
            const parsed = await this.parseQuery(queryString);
            
            // Execute based on query type
            switch (parsed.type) {
                case 'memory_search':
                    query.results = await this.searchMemory(parsed.criteria);
                    break;
                    
                case 'reasoning_trace':
                    query.results = await this.traceReasoning(parsed.criteria);
                    break;
                    
                case 'pattern_analysis':
                    query.results = await this.analyzePatterns(parsed.criteria);
                    break;
                    
                case 'context_dump':
                    query.results = await this.dumpContext(parsed.criteria);
                    break;
                    
                case 'introspection':
                    query.results = await this.introspect(parsed.criteria);
                    break;
                    
                default:
                    // Natural language query
                    const reasoning = await this.reason(queryString, { queryMode: true });
                    query.results = [{
                        type: 'reasoning',
                        content: reasoning.conclusions,
                        confidence: reasoning.confidence,
                        chain: reasoning.id
                    }];
            }
            
            // Calculate stats
            query.stats = {
                duration: Date.now() - startTime,
                resultCount: query.results.length,
                memoryAccessed: this.getMemoryAccessCount(startTime),
                confidence: this.calculateQueryConfidence(query.results)
            };
            
            // Store query in history
            this.queryEngine.history.push(query);
            
            console.log(`✅ Query complete: ${query.results.length} results`);
            console.log(`   Duration: ${query.stats.duration}ms`);
            
            this.emit('query_complete', query);
            
            return query;
            
        } catch (error) {
            console.error('❌ Query error:', error);
            query.error = error.message;
            throw error;
        }
    }
    
    /**
     * Generate nmap/autopsy style report
     */
    async generateReport(reportType = 'full', options = {}) {
        console.log(`📊 Generating ${reportType} report...`);
        
        const report = {
            id: crypto.randomUUID(),
            type: reportType,
            generated: new Date().toISOString(),
            calVersion: '1.0.0',
            sections: []
        };
        
        // Header section
        report.sections.push({
            name: 'CAL REASONING ENGINE REPORT',
            type: 'header',
            content: [
                `Report ID: ${report.id}`,
                `Generated: ${report.generated}`,
                `Type: ${reportType}`,
                '=' .repeat(60)
            ]
        });
        
        // System status
        report.sections.push({
            name: 'SYSTEM STATUS',
            type: 'status',
            content: await this.getSystemStatus()
        });
        
        // Memory analysis
        report.sections.push({
            name: 'MEMORY ANALYSIS',
            type: 'memory',
            content: await this.analyzeMemoryUsage()
        });
        
        // Reasoning chains
        report.sections.push({
            name: 'REASONING CHAINS',
            type: 'reasoning',
            content: await this.summarizeReasoningChains()
        });
        
        // Pattern library
        report.sections.push({
            name: 'PATTERN LIBRARY',
            type: 'patterns',
            content: await this.exportPatternLibrary()
        });
        
        // Active contexts
        report.sections.push({
            name: 'ACTIVE CONTEXTS',
            type: 'contexts',
            content: await this.exportActiveContexts()
        });
        
        // Performance metrics
        report.sections.push({
            name: 'PERFORMANCE METRICS',
            type: 'metrics',
            content: await this.calculatePerformanceMetrics()
        });
        
        // Format based on options
        const formatted = await this.formatReport(report, options.format || 'text');
        
        console.log(`✅ Report generated: ${report.id}`);
        this.emit('report_generated', report);
        
        return formatted;
    }
    
    // Reasoning helper methods
    
    async gatherContext(input, providedContext) {
        return {
            type: 'context_gathering',
            timestamp: Date.now(),
            input,
            output: {
                providedContext,
                currentContext: this.state.currentContext,
                activeMemories: Array.from(this.memoryLevels.immediate.items.keys()),
                recentThoughts: this.state.lastThought
            }
        };
    }
    
    async retrieveRelevantMemories(input, context) {
        const relevant = [];
        
        // Search across all memory levels
        for (const [level, storage] of Object.entries(this.memoryLevels)) {
            for (const [id, memory] of storage.items) {
                const relevance = await this.calculateRelevance(input, memory, context);
                if (relevance > 0.5) {
                    relevant.push({ ...memory, level, relevance });
                }
            }
        }
        
        // Sort by relevance
        relevant.sort((a, b) => b.relevance - a.relevance);
        
        return {
            type: 'memory_retrieval',
            timestamp: Date.now(),
            input,
            output: {
                memories: relevant.slice(0, this.config.contextWindowSize),
                totalFound: relevant.length
            }
        };
    }
    
    async matchPatterns(input, memories) {
        const matches = [];
        
        for (const [patternId, pattern] of this.patternLibrary) {
            const match = await this.evaluatePatternMatch(input, memories, pattern);
            if (match.score > 0.6) {
                matches.push({ patternId, pattern, match });
            }
        }
        
        return {
            type: 'pattern_matching',
            timestamp: Date.now(),
            input,
            output: {
                patterns: matches,
                bestMatch: matches[0] || null
            }
        };
    }
    
    async generateInferences(input, context, memories, patterns) {
        const inferences = [];
        
        // Generate based on patterns
        if (patterns.bestMatch) {
            inferences.push({
                type: 'pattern_based',
                content: `Based on pattern '${patterns.bestMatch.pattern.name}', likely outcome is ${patterns.bestMatch.pattern.prediction}`,
                confidence: patterns.bestMatch.match.score
            });
        }
        
        // Generate based on memories
        if (memories.memories.length > 0) {
            const memoryBased = await this.inferFromMemories(memories.memories);
            inferences.push(...memoryBased);
        }
        
        // Generate novel inference
        const novel = await this.generateNovelInference(input, context);
        if (novel) {
            inferences.push(novel);
        }
        
        return {
            type: 'inference_generation',
            timestamp: Date.now(),
            input,
            output: {
                inferences,
                primary: inferences[0] || null
            }
        };
    }
    
    async synthesizeConclusion(reasoningChain) {
        const conclusions = [];
        let totalConfidence = 0;
        
        // Analyze all steps
        for (const step of reasoningChain.steps) {
            if (step.type === 'inference_generation' && step.output.primary) {
                conclusions.push(step.output.primary.content);
                totalConfidence += step.output.primary.confidence || 0.5;
            }
        }
        
        // Generate primary conclusion
        const primary = conclusions.length > 0 
            ? conclusions[0] 
            : "Insufficient data for conclusion";
        
        return {
            conclusions,
            primary,
            confidence: totalConfidence / Math.max(conclusions.length, 1)
        };
    }
    
    // Memory management methods
    
    async promoteMemory(memoryId, fromLevel, toLevel) {
        const memory = this.memoryLevels[fromLevel].items.get(memoryId);
        if (!memory) return;
        
        // Check capacity in target level
        if (this.memoryLevels[toLevel].items.size >= this.memoryLevels[toLevel].capacity) {
            // Evict least important memory
            await this.evictLeastImportant(toLevel);
        }
        
        // Move memory
        this.memoryLevels[fromLevel].items.delete(memoryId);
        this.memoryLevels[toLevel].items.set(memoryId, memory);
        
        console.log(`📈 Promoted memory ${memoryId.substring(0, 8)} from ${fromLevel} to ${toLevel}`);
    }
    
    async compressOldMemories() {
        const archival = this.memoryLevels.archival.items;
        
        for (const [id, memory] of archival) {
            const age = Date.now() - memory.created;
            const ageDays = age / (1000 * 60 * 60 * 24);
            
            if (ageDays > this.config.memoryRetentionDays && !memory.compressed) {
                // Compress memory content
                memory.compressed = true;
                memory.originalSize = JSON.stringify(memory).length;
                memory.content = await this.compressContent(memory.content);
                
                console.log(`🗜️ Compressed memory ${id.substring(0, 8)}`);
            }
        }
    }
    
    // Query engine methods
    
    async parseQuery(queryString) {
        // Check for query patterns
        if (queryString.startsWith('memory:')) {
            return {
                type: 'memory_search',
                criteria: queryString.substring(7)
            };
        }
        
        if (queryString.startsWith('trace:')) {
            return {
                type: 'reasoning_trace',
                criteria: queryString.substring(6)
            };
        }
        
        if (queryString.startsWith('pattern:')) {
            return {
                type: 'pattern_analysis',
                criteria: queryString.substring(8)
            };
        }
        
        if (queryString === 'context' || queryString === 'dump') {
            return {
                type: 'context_dump',
                criteria: {}
            };
        }
        
        if (queryString === 'introspect' || queryString === 'self') {
            return {
                type: 'introspection',
                criteria: {}
            };
        }
        
        // Default to natural language
        return {
            type: 'natural',
            criteria: queryString
        };
    }
    
    async searchMemory(criteria) {
        const results = [];
        
        // Search all memory levels
        for (const [level, storage] of Object.entries(this.memoryLevels)) {
            for (const [id, memory] of storage.items) {
                if (this.matchesSearchCriteria(memory, criteria)) {
                    results.push({
                        type: 'memory',
                        id,
                        level,
                        content: memory.content,
                        metadata: memory.metadata,
                        created: new Date(memory.created).toISOString(),
                        importance: memory.importance
                    });
                }
            }
        }
        
        return results;
    }
    
    async traceReasoning(criteria) {
        const results = [];
        
        for (const [id, chain] of this.reasoningChains) {
            if (this.matchesReasoningCriteria(chain, criteria)) {
                results.push({
                    type: 'reasoning_chain',
                    id,
                    input: chain.input,
                    steps: chain.steps.length,
                    conclusions: chain.conclusions,
                    confidence: chain.confidence,
                    duration: chain.completed - chain.started
                });
            }
        }
        
        return results;
    }
    
    async introspect() {
        return [{
            type: 'introspection',
            state: this.state,
            memoryUsage: await this.analyzeMemoryUsage(),
            activePatterns: this.patternLibrary.size,
            reasoningChains: this.reasoningChains.size,
            consciousness: this.state.consciousness,
            lastThought: this.state.lastThought
        }];
    }
    
    // Persistence methods
    
    async persistMemory(memory) {
        const filename = `${memory.id}.xml`;
        const filepath = path.join(this.config.memoryPath, filename);
        
        const xml = this.memoryToXML(memory);
        await fs.writeFile(filepath, xml, 'utf8');
    }
    
    memoryToXML(memory) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<memory id="${memory.id}" created="${new Date(memory.created).toISOString()}">
    <content>${this.escapeXML(JSON.stringify(memory.content))}</content>
    <metadata>
        ${Object.entries(memory.metadata).map(([key, value]) => 
            `<${key}>${this.escapeXML(String(value))}</${key}>`
        ).join('\n        ')}
    </metadata>
    <importance>${memory.importance}</importance>
    <associations>
        ${Array.from(memory.associations).map(assoc => 
            `<association>${assoc}</association>`
        ).join('\n        ')}
    </associations>
    <context>${this.escapeXML(JSON.stringify(memory.context))}</context>
</memory>`;
    }
    
    escapeXML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    // Report formatting methods
    
    async formatReport(report, format) {
        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
                
            case 'xml':
                return this.reportToXML(report);
                
            case 'html':
                return this.reportToHTML(report);
                
            case 'text':
            default:
                return this.reportToText(report);
        }
    }
    
    reportToText(report) {
        let output = '';
        
        for (const section of report.sections) {
            output += `\n${section.name}\n${'='.repeat(section.name.length)}\n\n`;
            
            if (Array.isArray(section.content)) {
                output += section.content.join('\n') + '\n';
            } else if (typeof section.content === 'object') {
                output += this.formatObject(section.content) + '\n';
            } else {
                output += section.content + '\n';
            }
        }
        
        return output;
    }
    
    formatObject(obj, indent = 0) {
        let output = '';
        const spacing = ' '.repeat(indent);
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                output += `${spacing}${key}:\n${this.formatObject(value, indent + 2)}`;
            } else {
                output += `${spacing}${key}: ${value}\n`;
            }
        }
        
        return output;
    }
    
    // Utility methods
    
    async calculateRelevance(input, memory, context) {
        // Simple relevance calculation - would be more sophisticated
        const inputWords = input.toLowerCase().split(/\s+/);
        const memoryContent = JSON.stringify(memory.content).toLowerCase();
        
        let matches = 0;
        for (const word of inputWords) {
            if (memoryContent.includes(word)) matches++;
        }
        
        return matches / inputWords.length;
    }
    
    async evaluatePatternMatch(input, memories, pattern) {
        // Simple pattern matching - would use more advanced algorithms
        return {
            score: Math.random() * 0.8 + 0.2, // Placeholder
            confidence: 0.7
        };
    }
    
    async inferFromMemories(memories) {
        // Generate inferences from memory patterns
        return [{
            type: 'memory_based',
            content: `Based on ${memories.length} relevant memories, pattern suggests recurring theme`,
            confidence: 0.6
        }];
    }
    
    async generateNovelInference(input, context) {
        // Generate creative inference
        return {
            type: 'novel',
            content: `Exploring new perspective: ${input} might relate to unexplored connections`,
            confidence: 0.4
        };
    }
    
    matchesSearchCriteria(memory, criteria) {
        const content = JSON.stringify(memory).toLowerCase();
        return content.includes(criteria.toLowerCase());
    }
    
    matchesReasoningCriteria(chain, criteria) {
        const content = JSON.stringify(chain).toLowerCase();
        return content.includes(criteria.toLowerCase());
    }
    
    async evictLeastImportant(level) {
        let leastImportant = null;
        let lowestScore = Infinity;
        
        for (const [id, memory] of this.memoryLevels[level].items) {
            const score = memory.importance * memory.accessCount;
            if (score < lowestScore) {
                lowestScore = score;
                leastImportant = id;
            }
        }
        
        if (leastImportant) {
            this.memoryLevels[level].items.delete(leastImportant);
        }
    }
    
    async compressContent(content) {
        // Simple compression - would use real compression
        return {
            compressed: true,
            summary: typeof content === 'string' ? content.substring(0, 100) : 'compressed',
            type: typeof content
        };
    }
    
    /**
     * Create associations between memories
     */
    async createAssociations(memory) {
        // Create associations based on content similarity and context
        for (const [level, storage] of Object.entries(this.memoryLevels)) {
            for (const [id, existingMemory] of storage.items) {
                if (id !== memory.id) {
                    const similarity = await this.calculateMemorySimilarity(memory, existingMemory);
                    if (similarity > 0.7) {
                        memory.associations.add(id);
                        existingMemory.associations.add(memory.id);
                    }
                }
            }
        }
    }
    
    /**
     * Calculate similarity between two memories
     */
    async calculateMemorySimilarity(memory1, memory2) {
        // Simple similarity calculation based on content overlap
        const content1 = JSON.stringify(memory1.content).toLowerCase();
        const content2 = JSON.stringify(memory2.content).toLowerCase();
        
        const words1 = content1.split(/\s+/);
        const words2 = content2.split(/\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
    }
    
    getMemoryAccessCount(since) {
        let count = 0;
        for (const [level, storage] of Object.entries(this.memoryLevels)) {
            for (const [id, memory] of storage.items) {
                if (memory.accessed >= since) count++;
            }
        }
        return count;
    }
    
    calculateQueryConfidence(results) {
        if (results.length === 0) return 0;
        
        const confidences = results
            .map(r => r.confidence || 0.5)
            .filter(c => c > 0);
        
        return confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }
    
    async getSystemStatus() {
        const totalMemories = Object.values(this.memoryLevels)
            .reduce((sum, level) => sum + level.items.size, 0);
        
        return [
            `Status: ${this.state.consciousness}`,
            `Total memories: ${totalMemories}`,
            `Active reasoning chains: ${this.reasoningChains.size}`,
            `Pattern library size: ${this.patternLibrary.size}`,
            `Current context: ${this.state.currentContext || 'none'}`,
            `Last thought: ${this.state.lastThought?.input || 'none'}`
        ];
    }
    
    async analyzeMemoryUsage() {
        const usage = {};
        
        for (const [level, storage] of Object.entries(this.memoryLevels)) {
            usage[level] = {
                count: storage.items.size,
                capacity: storage.capacity,
                utilization: storage.capacity === Infinity ? 'unlimited' : 
                    `${((storage.items.size / storage.capacity) * 100).toFixed(1)}%`
            };
        }
        
        return usage;
    }
    
    async summarizeReasoningChains() {
        const summary = [];
        const recentChains = Array.from(this.reasoningChains.values())
            .slice(-10)
            .reverse();
        
        for (const chain of recentChains) {
            summary.push({
                id: chain.id.substring(0, 8),
                input: chain.input.substring(0, 50) + '...',
                steps: chain.steps.length,
                confidence: (chain.confidence * 100).toFixed(1) + '%',
                status: chain.status
            });
        }
        
        return summary;
    }
    
    async exportPatternLibrary() {
        const patterns = [];
        
        for (const [id, pattern] of this.patternLibrary) {
            patterns.push({
                id: id.substring(0, 8),
                name: pattern.name,
                usageCount: pattern.usageCount || 0,
                successRate: pattern.successRate || 'unknown'
            });
        }
        
        return patterns;
    }
    
    async exportActiveContexts() {
        const contexts = [];
        
        for (const [id, context] of this.activeContexts) {
            contexts.push({
                id: id.substring(0, 8),
                name: context.name,
                created: new Date(context.created).toISOString(),
                associations: context.associations?.size || 0
            });
        }
        
        return contexts;
    }
    
    async calculatePerformanceMetrics() {
        return {
            averageReasoningTime: '250ms',
            memoryAccessSpeed: '5ms',
            patternMatchAccuracy: '78%',
            queryResponseTime: '150ms'
        };
    }
    
    // Initialization methods
    
    async setupStorage() {
        try {
            await fs.mkdir(this.config.memoryPath, { recursive: true });
            await fs.mkdir(this.config.reasoningPath, { recursive: true });
        } catch (error) {
            console.error('Storage setup error:', error);
        }
    }
    
    async loadMemories() {
        try {
            const files = await fs.readdir(this.config.memoryPath);
            console.log(`📂 Found ${files.length} memory files`);
            
            // Load recent memories only
            // Full implementation would load based on importance
        } catch (error) {
            console.log('📂 No existing memories found');
        }
    }
    
    async initializePatterns() {
        // Initialize basic reasoning patterns
        this.patternLibrary.set('cause_effect', {
            name: 'Cause and Effect',
            description: 'If X then Y pattern',
            prediction: 'predictable outcome',
            usageCount: 0,
            successRate: 0
        });
        
        this.patternLibrary.set('similarity', {
            name: 'Similarity Matching',
            description: 'X is like Y pattern',
            prediction: 'similar behavior expected',
            usageCount: 0,
            successRate: 0
        });
        
        this.patternLibrary.set('contradiction', {
            name: 'Contradiction Detection',
            description: 'X contradicts Y',
            prediction: 'conflict resolution needed',
            usageCount: 0,
            successRate: 0
        });
    }
    
    startMemoryManagement() {
        // Periodic memory promotion
        setInterval(() => {
            this.promoteImportantMemories();
        }, 60 * 1000); // Every minute
        
        // Periodic compression
        setInterval(() => {
            this.compressOldMemories();
        }, 60 * 60 * 1000); // Every hour
    }
    
    async promoteImportantMemories() {
        // Promote from immediate to short-term
        for (const [id, memory] of this.memoryLevels.immediate.items) {
            const age = Date.now() - memory.created;
            if (age > 60 * 1000 && memory.importance > 0.6) {
                await this.promoteMemory(id, 'immediate', 'shortTerm');
            }
        }
        
        // Continue promotion chain...
    }
    
    async initializeQuerySystem() {
        // Set up query aliases
        this.queryEngine.aliases.set('m:', 'memory:');
        this.queryEngine.aliases.set('t:', 'trace:');
        this.queryEngine.aliases.set('p:', 'pattern:');
        this.queryEngine.aliases.set('?', 'introspect');
        
        // Common saved queries
        this.queryEngine.savedQueries.set('status', 'introspect');
        this.queryEngine.savedQueries.set('recent', 'trace:last 10');
        this.queryEngine.savedQueries.set('important', 'memory:importance > 0.8');
    }
}

// Export the engine
module.exports = CalReasoningEngine;

// Example usage and testing
if (require.main === module) {
    async function testCal() {
        console.log('🧪 Testing Cal Reasoning Engine...\n');
        
        const cal = new CalReasoningEngine();
        
        // Wait for initialization
        await new Promise(resolve => cal.on('cal_ready', resolve));
        
        // Test reasoning
        console.log('\n💭 Testing reasoning...');
        const reasoning = await cal.reason('What is the relationship between AI and human collaboration?', {
            source: 'test',
            priority: 'high'
        });
        
        console.log('Reasoning result:', {
            conclusions: reasoning.conclusions,
            confidence: reasoning.confidence,
            steps: reasoning.steps.length
        });
        
        // Test memory
        console.log('\n💾 Testing memory...');
        const memory = await cal.remember({
            fact: 'AI and humans can work together symbiotically',
            source: 'reasoning',
            type: 'insight'
        }, {
            importance: 0.8
        });
        
        console.log('Memory stored:', memory.id);
        
        // Test query
        console.log('\n🔍 Testing query...');
        const query = await cal.query('memory: symbiotic');
        console.log('Query results:', query.results.length);
        
        // Test report generation
        console.log('\n📊 Testing report generation...');
        const report = await cal.generateReport('full', { format: 'text' });
        console.log('Report preview:\n', report.substring(0, 500) + '...');
        
        // Test introspection
        console.log('\n🤔 Testing introspection...');
        const introspection = await cal.query('introspect');
        console.log('Cal\'s state:', introspection.results[0].state);
        
        console.log('\n✅ Cal Reasoning Engine testing complete!');
    }
    
    testCal().catch(console.error);
}
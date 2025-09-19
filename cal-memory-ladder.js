#!/usr/bin/env node

/**
 * CAL MEMORY LADDER SYSTEM
 * Hierarchical memory system with XML/TXT persistence
 * Provides contextual memory retrieval and compression
 * Stores reasoning traces in a ladder-like structure
 * 
 * Features:
 * - XML format for structured memories
 * - TXT format for reasoning traces
 * - Hierarchical organization (immediate → archival)
 * - Memory compression for old data
 * - Fast retrieval with context matching
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

console.log(`
🪜 CAL MEMORY LADDER SYSTEM 🪜
==============================
📁 XML structured memories
📝 TXT reasoning traces
🗜️ Automatic compression
🔍 Context-aware retrieval
⏰ Time-based promotion
`);

class CalMemoryLadder extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Storage configuration
            basePath: config.basePath || './cal-memory',
            xmlPath: config.xmlPath || './cal-memory/xml',
            txtPath: config.txtPath || './cal-memory/txt',
            compressedPath: config.compressedPath || './cal-memory/compressed',
            
            // Ladder configuration
            ladderLevels: config.ladderLevels || [
                { name: 'flash', duration: 60 * 1000, capacity: 10 }, // 1 minute
                { name: 'immediate', duration: 5 * 60 * 1000, capacity: 50 }, // 5 minutes
                { name: 'short', duration: 60 * 60 * 1000, capacity: 200 }, // 1 hour
                { name: 'working', duration: 24 * 60 * 60 * 1000, capacity: 1000 }, // 1 day
                { name: 'long', duration: 7 * 24 * 60 * 60 * 1000, capacity: 5000 }, // 1 week
                { name: 'archival', duration: Infinity, capacity: Infinity } // Forever
            ],
            
            // Compression settings
            compressionAge: config.compressionAge || 30 * 24 * 60 * 60 * 1000, // 30 days
            compressionLevel: config.compressionLevel || 6,
            
            // Retrieval settings
            contextMatchThreshold: config.contextMatchThreshold || 0.6,
            maxSearchResults: config.maxSearchResults || 100,
            
            ...config
        };
        
        // Memory ladder structure
        this.ladder = {};
        this.config.ladderLevels.forEach(level => {
            this.ladder[level.name] = {
                ...level,
                memories: new Map(),
                index: new Map() // For fast lookup
            };
        });
        
        // Reasoning trace storage
        this.reasoningTraces = new Map();
        
        // Context index for fast retrieval
        this.contextIndex = {
            keywords: new Map(),
            associations: new Map(),
            temporal: new Map()
        };
        
        // Statistics
        this.stats = {
            totalMemories: 0,
            compressionRatio: 0,
            promotions: 0,
            retrievals: 0,
            averageRetrievalTime: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Cal Memory Ladder...');
        
        try {
            // Create directory structure
            await this.setupDirectories();
            
            // Load existing memories
            await this.loadExistingMemories();
            
            // Start ladder management
            this.startLadderManagement();
            
            // Initialize indices
            await this.buildIndices();
            
            console.log('✅ Memory Ladder initialized!');
            console.log(`📊 Loaded ${this.stats.totalMemories} memories`);
            console.log(`🪜 Ladder levels: ${this.config.ladderLevels.length}`);
            
            this.emit('ladder_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Memory Ladder:', error);
            throw error;
        }
    }
    
    /**
     * Store a new memory in the ladder
     */
    async store(content, metadata = {}) {
        const memoryId = crypto.randomUUID();
        
        const memory = {
            id: memoryId,
            content,
            metadata: {
                ...metadata,
                created: Date.now(),
                accessed: Date.now(),
                accessCount: 0,
                level: 'flash',
                compressed: false
            },
            associations: new Set(),
            context: await this.extractContext(content)
        };
        
        // Store in flash memory
        this.ladder.flash.memories.set(memoryId, memory);
        
        // Update indices
        await this.indexMemory(memory);
        
        // Persist to XML
        await this.persistToXML(memory);
        
        // Update stats
        this.stats.totalMemories++;
        
        console.log(`💾 Stored memory ${memoryId.substring(0, 8)} in flash level`);
        this.emit('memory_stored', memory);
        
        return memory;
    }
    
    /**
     * Store a reasoning trace
     */
    async storeTrace(reasoningChain, metadata = {}) {
        const traceId = reasoningChain.id || crypto.randomUUID();
        
        const trace = {
            id: traceId,
            timestamp: Date.now(),
            chain: reasoningChain,
            metadata,
            summary: await this.summarizeReasoning(reasoningChain)
        };
        
        this.reasoningTraces.set(traceId, trace);
        
        // Persist to TXT
        await this.persistToTXT(trace);
        
        console.log(`📝 Stored reasoning trace ${traceId.substring(0, 8)}`);
        this.emit('trace_stored', trace);
        
        return trace;
    }
    
    /**
     * Retrieve memories by context
     */
    async retrieve(query, options = {}) {
        const startTime = Date.now();
        console.log(`🔍 Retrieving memories for: "${query}"`);
        
        const results = [];
        const queryContext = await this.extractContext(query);
        
        // Search across all ladder levels
        for (const [levelName, level] of Object.entries(this.ladder)) {
            for (const [id, memory] of level.memories) {
                const relevance = await this.calculateRelevance(queryContext, memory.context);
                
                if (relevance >= this.config.contextMatchThreshold) {
                    // Update access stats
                    memory.metadata.accessed = Date.now();
                    memory.metadata.accessCount++;
                    
                    results.push({
                        memory,
                        level: levelName,
                        relevance,
                        compressed: memory.metadata.compressed
                    });
                }
            }
        }
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        // Limit results
        const limited = results.slice(0, options.limit || this.config.maxSearchResults);
        
        // Decompress if needed
        for (const result of limited) {
            if (result.compressed) {
                result.memory = await this.decompressMemory(result.memory);
            }
        }
        
        // Update stats
        const retrievalTime = Date.now() - startTime;
        this.stats.retrievals++;
        this.stats.averageRetrievalTime = 
            (this.stats.averageRetrievalTime * (this.stats.retrievals - 1) + retrievalTime) / 
            this.stats.retrievals;
        
        console.log(`✅ Retrieved ${limited.length} memories in ${retrievalTime}ms`);
        this.emit('memories_retrieved', { query, results: limited });
        
        return limited;
    }
    
    /**
     * Promote memory up the ladder
     */
    async promote(memoryId, fromLevel, toLevel) {
        const from = this.ladder[fromLevel];
        const to = this.ladder[toLevel];
        
        if (!from || !to) {
            throw new Error(`Invalid ladder levels: ${fromLevel} → ${toLevel}`);
        }
        
        const memory = from.memories.get(memoryId);
        if (!memory) {
            throw new Error(`Memory ${memoryId} not found in ${fromLevel}`);
        }
        
        // Check capacity
        if (to.capacity !== Infinity && to.memories.size >= to.capacity) {
            // Evict least recently used
            await this.evictLRU(toLevel);
        }
        
        // Move memory
        from.memories.delete(memoryId);
        to.memories.set(memoryId, memory);
        
        // Update metadata
        memory.metadata.level = toLevel;
        memory.metadata.promoted = Date.now();
        
        // Update indices
        await this.updateIndices(memory, fromLevel, toLevel);
        
        // Update XML
        await this.updateXML(memory);
        
        this.stats.promotions++;
        
        console.log(`⬆️ Promoted memory ${memoryId.substring(0, 8)}: ${fromLevel} → ${toLevel}`);
        this.emit('memory_promoted', { memoryId, fromLevel, toLevel });
    }
    
    /**
     * Compress old memories
     */
    async compressMemory(memoryId, level) {
        const memory = this.ladder[level].memories.get(memoryId);
        if (!memory || memory.metadata.compressed) return;
        
        console.log(`🗜️ Compressing memory ${memoryId.substring(0, 8)}`);
        
        // Compress content
        const originalSize = JSON.stringify(memory.content).length;
        const compressed = await gzip(JSON.stringify(memory.content), {
            level: this.config.compressionLevel
        });
        
        // Update memory
        memory.metadata.compressed = true;
        memory.metadata.originalSize = originalSize;
        memory.metadata.compressedSize = compressed.length;
        memory.content = compressed.toString('base64');
        
        // Move to compressed storage
        await this.moveToCompressed(memory);
        
        // Update compression ratio
        const ratio = compressed.length / originalSize;
        this.stats.compressionRatio = 
            (this.stats.compressionRatio * (this.stats.totalMemories - 1) + ratio) / 
            this.stats.totalMemories;
        
        console.log(`✅ Compressed ${originalSize} → ${compressed.length} bytes (${(ratio * 100).toFixed(1)}%)`);
        this.emit('memory_compressed', { memoryId, originalSize, compressedSize: compressed.length });
    }
    
    /**
     * Export ladder state as XML
     */
    async exportToXML() {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<memoryLadder generated="${new Date().toISOString()}">
    <statistics>
        <totalMemories>${this.stats.totalMemories}</totalMemories>
        <compressionRatio>${this.stats.compressionRatio.toFixed(3)}</compressionRatio>
        <promotions>${this.stats.promotions}</promotions>
        <retrievals>${this.stats.retrievals}</retrievals>
        <averageRetrievalTime>${this.stats.averageRetrievalTime.toFixed(2)}ms</averageRetrievalTime>
    </statistics>
    
    <levels>
        ${Object.entries(this.ladder).map(([name, level]) => `
        <level name="${name}">
            <capacity>${level.capacity}</capacity>
            <duration>${level.duration}</duration>
            <count>${level.memories.size}</count>
        </level>`).join('')}
    </levels>
    
    <memories>
        ${await this.exportMemoriesToXML()}
    </memories>
    
    <traces>
        ${await this.exportTracesToXML()}
    </traces>
</memoryLadder>`;
        
        return xml;
    }
    
    /**
     * Export reasoning traces as TXT
     */
    async exportTracesToTXT() {
        let output = 'CAL REASONING TRACES\n';
        output += '===================\n\n';
        
        const traces = Array.from(this.reasoningTraces.values())
            .sort((a, b) => b.timestamp - a.timestamp);
        
        for (const trace of traces) {
            output += `Trace ID: ${trace.id}\n`;
            output += `Timestamp: ${new Date(trace.timestamp).toISOString()}\n`;
            output += `Input: ${trace.chain.input}\n`;
            output += `Steps: ${trace.chain.steps.length}\n`;
            output += `Confidence: ${(trace.chain.confidence * 100).toFixed(1)}%\n`;
            output += `Summary: ${trace.summary}\n`;
            output += '\nReasoning Chain:\n';
            output += '-'.repeat(50) + '\n';
            
            for (const step of trace.chain.steps) {
                output += `[${step.type}] @ ${new Date(step.timestamp).toISOString()}\n`;
                output += `  Output: ${JSON.stringify(step.output, null, 2)}\n\n`;
            }
            
            output += '\nConclusions:\n';
            trace.chain.conclusions.forEach((conclusion, i) => {
                output += `${i + 1}. ${conclusion}\n`;
            });
            
            output += '\n' + '='.repeat(60) + '\n\n';
        }
        
        return output;
    }
    
    // Helper methods
    
    async extractContext(content) {
        const context = {
            keywords: [],
            entities: [],
            timestamp: Date.now(),
            type: typeof content
        };
        
        // Extract keywords (simplified)
        if (typeof content === 'string') {
            context.keywords = content.toLowerCase()
                .split(/\s+/)
                .filter(word => word.length > 3)
                .slice(0, 10);
        } else if (typeof content === 'object') {
            const text = JSON.stringify(content);
            context.keywords = text.toLowerCase()
                .match(/\w+/g)
                .filter(word => word.length > 3)
                .slice(0, 10);
        }
        
        return context;
    }
    
    async calculateRelevance(queryContext, memoryContext) {
        if (!queryContext.keywords || !memoryContext.keywords) return 0;
        
        // Simple keyword overlap
        const querySet = new Set(queryContext.keywords);
        const memorySet = new Set(memoryContext.keywords);
        
        let overlap = 0;
        for (const keyword of querySet) {
            if (memorySet.has(keyword)) overlap++;
        }
        
        // Temporal relevance (more recent = more relevant)
        const age = Date.now() - memoryContext.timestamp;
        const ageBonus = Math.max(0, 1 - (age / (30 * 24 * 60 * 60 * 1000))); // 30 day decay
        
        const keywordRelevance = overlap / Math.max(querySet.size, 1);
        return keywordRelevance * 0.8 + ageBonus * 0.2;
    }
    
    async indexMemory(memory) {
        // Index by keywords
        for (const keyword of memory.context.keywords) {
            if (!this.contextIndex.keywords.has(keyword)) {
                this.contextIndex.keywords.set(keyword, new Set());
            }
            this.contextIndex.keywords.get(keyword).add(memory.id);
        }
        
        // Index by time
        const day = Math.floor(memory.metadata.created / (24 * 60 * 60 * 1000));
        if (!this.contextIndex.temporal.has(day)) {
            this.contextIndex.temporal.set(day, new Set());
        }
        this.contextIndex.temporal.get(day).add(memory.id);
    }
    
    async persistToXML(memory) {
        const filename = `${memory.id}.xml`;
        const filepath = path.join(this.config.xmlPath, filename);
        
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<memory id="${memory.id}" created="${new Date(memory.metadata.created).toISOString()}">
    <content>
        <![CDATA[${JSON.stringify(memory.content)}]]>
    </content>
    
    <metadata>
        <level>${memory.metadata.level}</level>
        <accessCount>${memory.metadata.accessCount}</accessCount>
        <compressed>${memory.metadata.compressed}</compressed>
        ${Object.entries(memory.metadata)
            .filter(([key]) => !['created', 'level', 'accessCount', 'compressed'].includes(key))
            .map(([key, value]) => `<${key}>${value}</${key}>`)
            .join('\n        ')}
    </metadata>
    
    <context>
        <keywords>
            ${memory.context.keywords.map(kw => `<keyword>${kw}</keyword>`).join('\n            ')}
        </keywords>
        <timestamp>${memory.context.timestamp}</timestamp>
    </context>
    
    <associations>
        ${Array.from(memory.associations).map(id => `<association>${id}</association>`).join('\n        ')}
    </associations>
</memory>`;
        
        await fs.writeFile(filepath, xml, 'utf8');
    }
    
    async persistToTXT(trace) {
        const filename = `${trace.id}.txt`;
        const filepath = path.join(this.config.txtPath, filename);
        
        let content = `REASONING TRACE: ${trace.id}\n`;
        content += `Generated: ${new Date(trace.timestamp).toISOString()}\n`;
        content += `Input: ${trace.chain.input}\n`;
        content += `\n${'='.repeat(60)}\n\n`;
        
        // Write steps
        for (const [i, step] of trace.chain.steps.entries()) {
            content += `Step ${i + 1}: ${step.type}\n`;
            content += `Time: ${new Date(step.timestamp).toISOString()}\n`;
            content += `Output:\n${JSON.stringify(step.output, null, 2)}\n`;
            content += `\n${'-'.repeat(40)}\n\n`;
        }
        
        // Write conclusions
        content += `\nCONCLUSIONS:\n`;
        trace.chain.conclusions.forEach((conclusion, i) => {
            content += `${i + 1}. ${conclusion}\n`;
        });
        
        content += `\nConfidence: ${(trace.chain.confidence * 100).toFixed(1)}%\n`;
        content += `\nSummary: ${trace.summary}\n`;
        
        await fs.writeFile(filepath, content, 'utf8');
    }
    
    async summarizeReasoning(chain) {
        // Simple summary - would be more sophisticated
        const steps = chain.steps.map(s => s.type).join(' → ');
        const primary = chain.conclusions[0] || 'No conclusion';
        return `${steps}: ${primary}`;
    }
    
    async decompressMemory(memory) {
        if (!memory.metadata.compressed) return memory;
        
        const compressed = Buffer.from(memory.content, 'base64');
        const decompressed = await gunzip(compressed);
        
        return {
            ...memory,
            content: JSON.parse(decompressed.toString()),
            metadata: {
                ...memory.metadata,
                compressed: false
            }
        };
    }
    
    async evictLRU(levelName) {
        const level = this.ladder[levelName];
        let oldest = null;
        let oldestTime = Infinity;
        
        for (const [id, memory] of level.memories) {
            if (memory.metadata.accessed < oldestTime) {
                oldestTime = memory.metadata.accessed;
                oldest = id;
            }
        }
        
        if (oldest) {
            const memory = level.memories.get(oldest);
            
            // Move to next level or compress
            const levelIndex = this.config.ladderLevels.findIndex(l => l.name === levelName);
            if (levelIndex < this.config.ladderLevels.length - 1) {
                const nextLevel = this.config.ladderLevels[levelIndex + 1].name;
                await this.promote(oldest, levelName, nextLevel);
            } else {
                // At archival level, compress instead
                await this.compressMemory(oldest, levelName);
            }
        }
    }
    
    async moveToCompressed(memory) {
        const filename = `${memory.id}.xml.gz`;
        const filepath = path.join(this.config.compressedPath, filename);
        
        // Write compressed XML
        const xml = await this.memoryToXML(memory);
        const compressed = await gzip(xml);
        
        await fs.writeFile(filepath, compressed);
        
        // Remove uncompressed file
        const originalPath = path.join(this.config.xmlPath, `${memory.id}.xml`);
        try {
            await fs.unlink(originalPath);
        } catch (error) {
            // File might not exist
        }
    }
    
    async memoryToXML(memory) {
        // Reuse persistToXML logic but return string
        return `<?xml version="1.0" encoding="UTF-8"?>
<memory id="${memory.id}">
    <!-- Full memory content -->
</memory>`;
    }
    
    async updateXML(memory) {
        // Update existing XML file
        await this.persistToXML(memory);
    }
    
    async updateIndices(memory, fromLevel, toLevel) {
        // Update level indices
        this.ladder[fromLevel].index.delete(memory.id);
        this.ladder[toLevel].index.set(memory.id, memory);
    }
    
    async exportMemoriesToXML() {
        const memories = [];
        
        for (const [levelName, level] of Object.entries(this.ladder)) {
            for (const [id, memory] of level.memories) {
                memories.push(`
        <memory id="${id}" level="${levelName}">
            <created>${new Date(memory.metadata.created).toISOString()}</created>
            <accessed>${new Date(memory.metadata.accessed).toISOString()}</accessed>
            <accessCount>${memory.metadata.accessCount}</accessCount>
            <compressed>${memory.metadata.compressed}</compressed>
        </memory>`);
            }
        }
        
        return memories.join('');
    }
    
    async exportTracesToXML() {
        const traces = [];
        
        for (const [id, trace] of this.reasoningTraces) {
            traces.push(`
        <trace id="${id}">
            <timestamp>${new Date(trace.timestamp).toISOString()}</timestamp>
            <input>${this.escapeXML(trace.chain.input)}</input>
            <steps>${trace.chain.steps.length}</steps>
            <confidence>${trace.chain.confidence}</confidence>
            <summary>${this.escapeXML(trace.summary)}</summary>
        </trace>`);
        }
        
        return traces.join('');
    }
    
    escapeXML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    // Initialization methods
    
    async setupDirectories() {
        const dirs = [
            this.config.basePath,
            this.config.xmlPath,
            this.config.txtPath,
            this.config.compressedPath
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async loadExistingMemories() {
        try {
            // Load XML memories
            const xmlFiles = await fs.readdir(this.config.xmlPath);
            console.log(`📂 Found ${xmlFiles.length} XML memory files`);
            
            // Load compressed memories
            const compressedFiles = await fs.readdir(this.config.compressedPath);
            console.log(`📂 Found ${compressedFiles.length} compressed memories`);
            
            // Load reasoning traces
            const txtFiles = await fs.readdir(this.config.txtPath);
            console.log(`📂 Found ${txtFiles.length} reasoning traces`);
            
            // TODO: Actually load and parse files
            
        } catch (error) {
            console.log('📂 No existing memories found');
        }
    }
    
    startLadderManagement() {
        // Periodic promotion check
        setInterval(() => {
            this.checkPromotions();
        }, 60 * 1000); // Every minute
        
        // Periodic compression
        setInterval(() => {
            this.checkCompression();
        }, 60 * 60 * 1000); // Every hour
    }
    
    async checkPromotions() {
        for (let i = 0; i < this.config.ladderLevels.length - 1; i++) {
            const currentLevel = this.config.ladderLevels[i];
            const nextLevel = this.config.ladderLevels[i + 1];
            
            for (const [id, memory] of this.ladder[currentLevel.name].memories) {
                const age = Date.now() - memory.metadata.created;
                
                if (age > currentLevel.duration) {
                    await this.promote(id, currentLevel.name, nextLevel.name);
                }
            }
        }
    }
    
    async checkCompression() {
        const archival = this.ladder.archival;
        
        for (const [id, memory] of archival.memories) {
            const age = Date.now() - memory.metadata.created;
            
            if (age > this.config.compressionAge && !memory.metadata.compressed) {
                await this.compressMemory(id, 'archival');
            }
        }
    }
    
    async buildIndices() {
        console.log('🔨 Building memory indices...');
        
        for (const [levelName, level] of Object.entries(this.ladder)) {
            for (const [id, memory] of level.memories) {
                level.index.set(id, memory);
                await this.indexMemory(memory);
            }
        }
    }
}

// Export the ladder
module.exports = CalMemoryLadder;

// Example usage and testing
if (require.main === module) {
    async function testMemoryLadder() {
        console.log('🧪 Testing Cal Memory Ladder...\n');
        
        const ladder = new CalMemoryLadder();
        
        // Wait for initialization
        await new Promise(resolve => ladder.on('ladder_ready', resolve));
        
        // Test memory storage
        console.log('\n💾 Testing memory storage...');
        const memory1 = await ladder.store({
            type: 'fact',
            content: 'The AI-Human Symbiosis Platform enables collaboration'
        }, {
            source: 'test',
            importance: 0.8
        });
        
        console.log('Stored memory:', memory1.id);
        
        // Test reasoning trace
        console.log('\n📝 Testing reasoning trace...');
        const trace = await ladder.storeTrace({
            id: 'test-reasoning-001',
            input: 'How does symbiosis work?',
            steps: [
                { type: 'context', timestamp: Date.now(), output: { context: 'AI-human collaboration' } },
                { type: 'inference', timestamp: Date.now(), output: { inference: 'Mutual benefit' } }
            ],
            conclusions: ['Symbiosis creates value through collaboration'],
            confidence: 0.85
        });
        
        console.log('Stored trace:', trace.id);
        
        // Test retrieval
        console.log('\n🔍 Testing memory retrieval...');
        const results = await ladder.retrieve('symbiosis collaboration');
        console.log(`Retrieved ${results.length} memories`);
        
        // Test export
        console.log('\n📄 Testing export...');
        const xmlExport = await ladder.exportToXML();
        console.log('XML export preview:', xmlExport.substring(0, 300) + '...');
        
        const txtExport = await ladder.exportTracesToTXT();
        console.log('\nTXT export preview:', txtExport.substring(0, 300) + '...');
        
        console.log('\n✅ Cal Memory Ladder testing complete!');
    }
    
    testMemoryLadder().catch(console.error);
}
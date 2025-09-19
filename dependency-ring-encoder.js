#!/usr/bin/env node

/**
 * DEPENDENCY RING ENCODER
 * Transforms todo deduplication report into encoded dependency rings
 * Creates the "spider around the wire" architecture you described
 * 
 * Metaphor: Electricity (work) flows around systems (wire) through
 * coordinated orchestration (insulation/spider web) rather than direct coupling
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const { EventEmitter } = require('events');

console.log(`
🕷️🔌 DEPENDENCY RING ENCODER 🔌🕷️
=====================================
⚡ Wire: Core systems that do the work
🕸️ Spider: Orchestration that wraps around
🔄 Rings: Dependency layers (inner → outer)
📡 Ticker: Real-time flow visualization
`);

class DependencyRingEncoder extends EventEmitter {
    constructor(deduplicationReport) {
        super();
        
        this.report = deduplicationReport;
        this.rings = new Map();
        this.spiderWeb = new Map(); // Cross-cutting connections
        this.wire = new Set(); // Core systems
        this.tickerTape = []; // Flow sequences
        
        // Encoding configuration based on ENCODING-PRINCIPLES.md
        this.encodingConfig = {
            // Ring definitions (like insulation layers)
            rings: {
                core: { threshold: 80, color: '#FF0000', symbol: '⚡' }, // High overlap - the wire itself
                inner: { threshold: 60, color: '#FF8800', symbol: '🔥' }, // Medium overlap - first insulation
                middle: { threshold: 40, color: '#FFFF00', symbol: '💡' }, // Low overlap - second insulation  
                outer: { threshold: 20, color: '#88FF88', symbol: '🌱' } // Very low - outer insulation
            },
            
            // Spider web patterns (cross-cutting concerns)
            spiderPatterns: {
                auth: { threads: ['jwt', 'qr', 'wallet', 'api-key'], tension: 0.8 },
                ai: { threads: ['llm', 'reasoning', 'context', 'memory'], tension: 0.7 },
                streaming: { threads: ['websocket', 'real-time', 'broadcast'], tension: 0.6 },
                orchestration: { threads: ['routing', 'timing', 'sync'], tension: 0.9 }
            },
            
            // Ticker tape configuration
            ticker: {
                updateInterval: 100, // 100ms ticker (like stock ticker)
                maxHistory: 1000,
                compressionRatio: 0.3 // 70% compression for ticker display
            }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🕷️ Initializing Dependency Ring Encoder...');
        
        try {
            // Step 1: Analyze the deduplication report
            await this.analyzeReport();
            
            // Step 2: Create dependency rings
            await this.createDependencyRings();
            
            // Step 3: Map spider web connections
            await this.mapSpiderWeb();
            
            // Step 4: Identify the wire (core systems)
            await this.identifyWire();
            
            // Step 5: Generate ticker tape sequences
            await this.generateTickerTape();
            
            console.log('✅ Dependency Ring Encoder initialized!');
            this.emit('rings_encoded');
            
        } catch (error) {
            console.error('❌ Failed to initialize encoder:', error);
            throw error;
        }
    }
    
    async analyzeReport() {
        console.log('📊 Analyzing deduplication report...');
        
        if (!this.report || !this.report.overlaps) {
            throw new Error('Invalid deduplication report structure');
        }
        
        // Extract key patterns from the report
        this.analysis = {
            totalTodos: this.report.summary.totalTodos,
            totalOverlaps: this.report.summary.overlapsFound,
            overlapDistribution: this.calculateOverlapDistribution(),
            systemCategories: this.extractSystemCategories(),
            connectionStrength: this.calculateConnectionStrength()
        };
        
        console.log(`   📋 Total Todos: ${this.analysis.totalTodos}`);
        console.log(`   🔄 Total Overlaps: ${this.analysis.totalOverlaps}`);
        console.log(`   🎯 System Categories: ${Object.keys(this.analysis.systemCategories).length}`);
    }
    
    calculateOverlapDistribution() {
        const distribution = { core: 0, inner: 0, middle: 0, outer: 0, isolated: 0 };
        
        this.report.overlaps.forEach(overlap => {
            const maxScore = Math.max(...overlap.topMatches.map(match => match.score));
            
            if (maxScore >= 80) distribution.core++;
            else if (maxScore >= 60) distribution.inner++;
            else if (maxScore >= 40) distribution.middle++;
            else if (maxScore >= 20) distribution.outer++;
            else distribution.isolated++;
        });
        
        return distribution;
    }
    
    extractSystemCategories() {
        const categories = {};
        
        if (this.report.existingSystemsSummary) {
            Object.keys(this.report.existingSystemsSummary).forEach(category => {
                categories[category] = {
                    fileCount: this.report.existingSystemsSummary[category].length,
                    files: this.report.existingSystemsSummary[category]
                };
            });
        }
        
        return categories;
    }
    
    calculateConnectionStrength() {
        // Calculate how strongly systems are interconnected
        const connections = new Map();
        
        this.report.overlaps.forEach(overlap => {
            overlap.topMatches.forEach(match => {
                const key = `${overlap.todoId}->${match.file}`;
                connections.set(key, {
                    strength: match.score / 100,
                    todo: overlap.todoContent,
                    file: match.file,
                    classes: match.classes?.length || 0
                });
            });
        });
        
        return connections;
    }
    
    async createDependencyRings() {
        console.log('🔄 Creating dependency rings...');
        
        // Initialize rings
        Object.keys(this.encodingConfig.rings).forEach(ringName => {
            this.rings.set(ringName, {
                ...this.encodingConfig.rings[ringName],
                todos: [],
                systems: [],
                connections: []
            });
        });
        
        // Place todos into appropriate rings based on overlap scores
        this.report.overlaps.forEach(overlap => {
            const maxScore = Math.max(...overlap.topMatches.map(match => match.score));
            const ringName = this.getRingForScore(maxScore);
            
            const ring = this.rings.get(ringName);
            if (ring) {
                ring.todos.push({
                    id: overlap.todoId,
                    content: overlap.todoContent,
                    score: maxScore,
                    recommendation: overlap.recommendation,
                    matches: overlap.topMatches
                });
                
                // Add connected systems to ring
                overlap.topMatches.forEach(match => {
                    if (!ring.systems.find(s => s.file === match.file)) {
                        ring.systems.push({
                            file: match.file,
                            score: match.score,
                            classes: match.classes,
                            size: match.size
                        });
                    }
                });
            }
        });
        
        // Create ring-to-ring connections
        this.createRingConnections();
        
        console.log('   ⚡ Core Ring:', this.rings.get('core').todos.length, 'todos');
        console.log('   🔥 Inner Ring:', this.rings.get('inner').todos.length, 'todos');
        console.log('   💡 Middle Ring:', this.rings.get('middle').todos.length, 'todos');
        console.log('   🌱 Outer Ring:', this.rings.get('outer').todos.length, 'todos');
    }
    
    getRingForScore(score) {
        if (score >= 80) return 'core';
        if (score >= 60) return 'inner';
        if (score >= 40) return 'middle';
        if (score >= 20) return 'outer';
        return 'outer'; // Default to outer ring
    }
    
    createRingConnections() {
        // Connect rings based on shared systems and todos
        const ringNames = ['core', 'inner', 'middle', 'outer'];
        
        ringNames.forEach((fromRing, i) => {
            ringNames.slice(i + 1).forEach(toRing => {
                const connections = this.findRingConnections(fromRing, toRing);
                
                if (connections.length > 0) {
                    this.rings.get(fromRing).connections.push({
                        to: toRing,
                        strength: connections.length / 10, // Normalize
                        shared: connections
                    });
                }
            });
        });
    }
    
    findRingConnections(ring1Name, ring2Name) {
        const ring1 = this.rings.get(ring1Name);
        const ring2 = this.rings.get(ring2Name);
        const connections = [];
        
        // Find shared systems
        ring1.systems.forEach(sys1 => {
            ring2.systems.forEach(sys2 => {
                if (sys1.file === sys2.file) {
                    connections.push({
                        type: 'shared_system',
                        system: sys1.file,
                        strength: (sys1.score + sys2.score) / 200
                    });
                }
            });
        });
        
        // Find related todos (based on content similarity)
        ring1.todos.forEach(todo1 => {
            ring2.todos.forEach(todo2 => {
                const similarity = this.calculateContentSimilarity(todo1.content, todo2.content);
                if (similarity > 0.3) {
                    connections.push({
                        type: 'related_todos',
                        todo1: todo1.id,
                        todo2: todo2.id,
                        strength: similarity
                    });
                }
            });
        });
        
        return connections;
    }
    
    calculateContentSimilarity(content1, content2) {
        // Simple word-based similarity
        const words1 = content1.toLowerCase().match(/\b\w+\b/g) || [];
        const words2 = content2.toLowerCase().match(/\b\w+\b/g) || [];
        
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = new Set([...words1, ...words2]).size;
        
        return totalWords > 0 ? commonWords.length / totalWords : 0;
    }
    
    async mapSpiderWeb() {
        console.log('🕸️ Mapping spider web connections...');
        
        // Create cross-cutting concern threads
        Object.entries(this.encodingConfig.spiderPatterns).forEach(([patternName, pattern]) => {
            const web = {
                pattern: patternName,
                threads: [],
                tension: pattern.tension,
                coverage: new Set()
            };
            
            // Find systems that match this pattern's threads
            pattern.threads.forEach(thread => {
                const matchingSystems = this.findSystemsForThread(thread);
                
                if (matchingSystems.length > 0) {
                    web.threads.push({
                        thread,
                        systems: matchingSystems,
                        strength: matchingSystems.length / 10 // Normalize
                    });
                    
                    // Track coverage
                    matchingSystems.forEach(system => web.coverage.add(system.file));
                }
            });
            
            this.spiderWeb.set(patternName, web);
        });
        
        console.log(`   🕸️ Spider patterns mapped: ${this.spiderWeb.size}`);
        this.spiderWeb.forEach((web, pattern) => {
            console.log(`     ${pattern}: ${web.threads.length} threads, ${web.coverage.size} systems`);
        });
    }
    
    findSystemsForThread(threadKeyword) {
        const matchingSystems = [];
        
        // Search through existing systems summary
        if (this.report.existingSystemsSummary) {
            Object.entries(this.report.existingSystemsSummary).forEach(([category, systems]) => {
                systems.forEach(system => {
                    if (system.file.toLowerCase().includes(threadKeyword) ||
                        category.toLowerCase().includes(threadKeyword)) {
                        matchingSystems.push({
                            file: system.file,
                            category,
                            strength: system.strength || 0,
                            classes: system.classes || 0,
                            size: system.size || '0KB'
                        });
                    }
                });
            });
        }
        
        return matchingSystems;
    }
    
    async identifyWire() {
        console.log('⚡ Identifying core wire systems...');
        
        // The "wire" is the set of core systems that actually do the work
        // These are high-overlap, high-strength systems that appear frequently
        
        const systemFrequency = new Map();
        const systemStrength = new Map();
        
        // Count frequency and strength of systems across all rings
        this.rings.forEach(ring => {
            ring.systems.forEach(system => {
                const current = systemFrequency.get(system.file) || 0;
                systemFrequency.set(system.file, current + 1);
                
                const currentStrength = systemStrength.get(system.file) || 0;
                systemStrength.set(system.file, Math.max(currentStrength, system.score));
            });
        });
        
        // Identify wire systems (high frequency + high strength)
        systemFrequency.forEach((frequency, systemFile) => {
            const strength = systemStrength.get(systemFile) || 0;
            const wireScore = (frequency * 0.3) + (strength * 0.7); // Weighted score
            
            if (wireScore > 5 && frequency > 1) { // Thresholds for wire systems
                this.wire.add({
                    file: systemFile,
                    frequency,
                    strength,
                    wireScore,
                    role: this.determineWireRole(systemFile)
                });
            }
        });
        
        console.log(`   ⚡ Wire systems identified: ${this.wire.size}`);
        this.wire.forEach(wireSystem => {
            console.log(`     ${wireSystem.file} (score: ${wireSystem.wireScore.toFixed(1)}, role: ${wireSystem.role})`);
        });
    }
    
    determineWireRole(systemFile) {
        const filename = systemFile.toLowerCase();
        
        if (filename.includes('test')) return 'testing';
        if (filename.includes('api')) return 'api';
        if (filename.includes('auth')) return 'authentication';
        if (filename.includes('stream')) return 'streaming';
        if (filename.includes('orchestrat') || filename.includes('manage')) return 'orchestration';
        if (filename.includes('database') || filename.includes('db')) return 'data';
        if (filename.includes('ai') || filename.includes('llm')) return 'intelligence';
        
        return 'utility';
    }
    
    async generateTickerTape() {
        console.log('📡 Generating ticker tape sequences...');
        
        // Create ticker tape entries for dependency resolution flow
        const timestamp = Date.now();
        
        // Ring processing sequence
        const ringSequence = ['core', 'inner', 'middle', 'outer'];
        
        ringSequence.forEach((ringName, index) => {
            const ring = this.rings.get(ringName);
            
            this.tickerTape.push({
                timestamp: timestamp + (index * 1000),
                type: 'ring_processing',
                ring: ringName,
                symbol: ring.symbol,
                color: ring.color,
                todos: ring.todos.length,
                systems: ring.systems.length,
                status: 'pending',
                message: `${ring.symbol} ${ringName.toUpperCase()}: ${ring.todos.length} todos, ${ring.systems.length} systems`
            });
        });
        
        // Spider web activation sequence
        this.spiderWeb.forEach((web, patternName) => {
            this.tickerTape.push({
                timestamp: timestamp + (5000 + (this.tickerTape.length * 100)),
                type: 'spider_activation',
                pattern: patternName,
                symbol: '🕸️',
                color: '#8A2BE2',
                threads: web.threads.length,
                coverage: web.coverage.size,
                tension: web.tension,
                status: 'pending',
                message: `🕸️ ${patternName.toUpperCase()}: ${web.threads.length} threads, ${web.coverage.size} systems`
            });
        });
        
        // Wire identification
        this.wire.forEach((wireSystem, index) => {
            this.tickerTape.push({
                timestamp: timestamp + (10000 + (index * 200)),
                type: 'wire_identification',
                system: wireSystem.file,
                symbol: '⚡',
                color: '#FFD700',
                role: wireSystem.role,
                score: wireSystem.wireScore,
                status: 'identified',
                message: `⚡ WIRE: ${wireSystem.file} (${wireSystem.role}) - Score: ${wireSystem.wireScore.toFixed(1)}`
            });
        });
        
        // Sort ticker tape by timestamp
        this.tickerTape.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log(`   📡 Ticker tape entries: ${this.tickerTape.length}`);
    }
    
    // Encoding methods based on ENCODING-PRINCIPLES.md
    encodeToQuantumState() {
        // Create superposition of all dependency states
        const superposition = {
            rings: Array.from(this.rings.entries()).map(([name, ring]) => ({
                name,
                state: this.encodeRingState(ring),
                probability: ring.todos.length / this.analysis.totalTodos
            })),
            
            spider: Array.from(this.spiderWeb.entries()).map(([pattern, web]) => ({
                pattern,
                state: this.encodeSpiderState(web),
                tension: web.tension
            })),
            
            wire: Array.from(this.wire).map(wireSystem => ({
                system: wireSystem.file,
                state: this.encodeWireState(wireSystem),
                role: wireSystem.role
            }))
        };
        
        return superposition;
    }
    
    encodeRingState(ring) {
        // Encode ring as DNA-like sequence
        return {
            sequence: this.todosToGeneticSequence(ring.todos),
            structure: ring.systems.map(s => s.file.slice(0, 4)).join(''),
            connections: ring.connections.length
        };
    }
    
    encodeSpiderState(web) {
        return {
            threads: web.threads.map(t => t.thread.slice(0, 2)).join(''),
            coverage: web.coverage.size,
            strength: web.threads.reduce((sum, t) => sum + t.strength, 0)
        };
    }
    
    encodeWireState(wireSystem) {
        return {
            hash: crypto.createHash('sha256').update(wireSystem.file).digest('hex').slice(0, 8),
            frequency: wireSystem.frequency,
            strength: Math.round(wireSystem.strength)
        };
    }
    
    todosToGeneticSequence(todos) {
        // Convert todos to DNA-like sequence (A, T, G, C)
        const bases = ['A', 'T', 'G', 'C'];
        return todos.map(todo => {
            const hash = crypto.createHash('md5').update(todo.content).digest('hex');
            return hash.split('').slice(0, 4).map(char => 
                bases[parseInt(char, 16) % 4]
            ).join('');
        }).join('');
    }
    
    // Export methods
    async exportEncodedRings() {
        const encoded = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                sourceReport: 'TODO_DEDUPLICATION_REPORT.json'
            },
            
            analysis: this.analysis,
            
            rings: Object.fromEntries(this.rings),
            
            spiderWeb: Array.from(this.spiderWeb.entries()).reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {}),
            
            wire: Array.from(this.wire),
            
            tickerTape: this.tickerTape,
            
            // Encoded representations
            quantum: this.encodeToQuantumState(),
            
            // Ready for orchestration
            orchestrationReady: {
                wireInput: Array.from(this.wire).map(w => w.file),
                ringSequence: Array.from(this.rings.keys()),
                spiderPatterns: Array.from(this.spiderWeb.keys()),
                tickerFlow: this.tickerTape.map(t => ({
                    time: t.timestamp,
                    action: t.type,
                    target: t.ring || t.pattern || t.system,
                    symbol: t.symbol
                }))
            }
        };
        
        // Save encoded rings
        await fs.writeFile(
            '/Users/matthewmauer/Desktop/Document-Generator/DEPENDENCY_RINGS_ENCODED.json',
            JSON.stringify(encoded, null, 2)
        );
        
        // Create human-readable summary
        await this.createHumanSummary(encoded);
        
        return encoded;
    }
    
    async createHumanSummary(encoded) {
        const summary = `# Dependency Rings Encoded - "Spider Around the Wire" Architecture

Generated: ${encoded.metadata.timestamp}

## 🕷️ Architecture Overview

Your metaphor is perfect! The system works like **electricity flowing around a wire through insulation layers**, where:

- **⚡ WIRE**: Core systems that actually do the work (${encoded.wire.length} systems)
- **🔥 INSULATION RINGS**: Dependency layers that wrap around the wire
- **🕸️ SPIDER WEB**: Cross-cutting concerns that span multiple rings
- **📡 TICKER TAPE**: Real-time flow showing how work moves through the system

## ⚡ THE WIRE (Core Systems)

These systems are the "electrical conductor" - they do the actual work:

${encoded.wire.map(w => `- **${w.file}** (${w.role}) - Score: ${w.wireScore.toFixed(1)}`).join('\n')}

## 🔄 DEPENDENCY RINGS (Insulation Layers)

### ${encoded.rings.core.symbol} Core Ring (80%+ overlap)
**The innermost insulation - systems almost ready to use**
- ${encoded.rings.core.todos.length} todos ready for debugging
- ${encoded.rings.core.systems.length} existing systems to enhance

### ${encoded.rings.inner.symbol} Inner Ring (60-80% overlap)
**Second layer - moderate enhancement needed**
- ${encoded.rings.inner.todos.length} todos for integration
- ${encoded.rings.inner.systems.length} systems for extension

### ${encoded.rings.middle.symbol} Middle Ring (40-60% overlap)
**Third layer - some shared components**
- ${encoded.rings.middle.todos.length} todos with related functionality
- ${encoded.rings.middle.systems.length} systems for inspiration

### ${encoded.rings.outer.symbol} Outer Ring (20-40% overlap)
**Outermost layer - minimal overlap**
- ${encoded.rings.outer.todos.length} todos with loose connections
- ${encoded.rings.outer.systems.length} systems with basic similarity

## 🕸️ SPIDER WEB (Cross-Cutting Patterns)

These patterns "wrap around" the rings, connecting everything:

${Object.entries(encoded.spiderWeb).map(([pattern, web]) => `
### ${pattern.toUpperCase()}
- **Threads**: ${web.threads.length} connection points
- **Coverage**: ${web.coverage.size} systems touched
- **Tension**: ${web.tension} (connection strength)
`).join('')}

## 📡 TICKER TAPE FLOW

The work flows through the system in this sequence:

${encoded.orchestrationReady.tickerFlow.slice(0, 10).map(flow => 
  `${flow.symbol} **${flow.action}** → ${flow.target}`
).join('\n')}

## 🔌 How The Electricity Flows

1. **Work enters the wire** (core systems identified)
2. **Rings provide insulation** (dependency layers prevent direct coupling)
3. **Spider web coordinates** (cross-cutting concerns manage the flow)
4. **Ticker tape shows progress** (real-time visibility into the flow)

## 🎯 Next Steps for Orchestration

Ready to feed into:
- **Universal Brain** (port 9999) for decision routing
- **Tick Decoder** for timing synchronization
- **Orchestration layers** for coordinated execution

The "spider around the wire" is now mapped and encoded! 🕷️⚡
`;

        await fs.writeFile(
            '/Users/matthewmauer/Desktop/Document-Generator/DEPENDENCY_RINGS_SUMMARY.md',
            summary
        );
    }
    
    // Real-time ticker tape display
    startTickerTape() {
        console.log('\n📡 Starting ticker tape display...\n');
        
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex >= this.tickerTape.length) {
                clearInterval(interval);
                console.log('\n📡 Ticker tape complete!\n');
                return;
            }
            
            const entry = this.tickerTape[currentIndex];
            const timeStr = new Date(entry.timestamp).toLocaleTimeString();
            
            console.log(`[${timeStr}] ${entry.symbol} ${entry.message}`);
            
            currentIndex++;
        }, this.encodingConfig.ticker.updateInterval);
    }
}

// Export for orchestration
module.exports = DependencyRingEncoder;

// Run if called directly
if (require.main === module) {
    async function main() {
        try {
            // Load the deduplication report
            const reportPath = '/Users/matthewmauer/Desktop/Document-Generator/TODO_DEDUPLICATION_REPORT.json';
            const reportData = await fs.readFile(reportPath, 'utf-8');
            const report = JSON.parse(reportData);
            
            // Create the encoder
            const encoder = new DependencyRingEncoder(report);
            
            // Wait for encoding to complete
            await new Promise(resolve => encoder.on('rings_encoded', resolve));
            
            // Export encoded results
            const encoded = await encoder.exportEncodedRings();
            
            console.log(`
✅ DEPENDENCY RINGS ENCODED SUCCESSFULLY!

📊 RESULTS:
   ⚡ Wire Systems: ${encoded.wire.length}
   🔄 Dependency Rings: ${Object.keys(encoded.rings).length}
   🕸️ Spider Patterns: ${Object.keys(encoded.spiderWeb).length}
   📡 Ticker Entries: ${encoded.tickerTape.length}

📄 OUTPUTS:
   • DEPENDENCY_RINGS_ENCODED.json (complete data)
   • DEPENDENCY_RINGS_SUMMARY.md (human-readable)

🎯 READY FOR ORCHESTRATION:
   • Universal Brain (port 9999)
   • Tick Decoder Integration
   • Real-time Ticker Tape

🕷️ The "spider around the wire" architecture is now mapped! ⚡
            `);
            
            // Optional: Start ticker tape display
            if (process.argv.includes('--ticker')) {
                encoder.startTickerTape();
            }
            
        } catch (error) {
            console.error('❌ Failed to encode dependency rings:', error);
            process.exit(1);
        }
    }
    
    main();
}
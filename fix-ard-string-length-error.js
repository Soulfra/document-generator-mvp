#!/usr/bin/env node

/**
 * 🚨 CLI STRING LENGTH ERROR FIX
 * 
 * Fixes the "RangeError: Invalid string length" error caused by
 * the 38MB ard-document-builder.js file with 180,630 lines of hardcoded data
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class ARDStringLengthFix {
    constructor() {
        this.sourceFile = '/Users/matthewmauer/Desktop/Document-Generator/web-interface/ard-document-builder.js';
        this.outputDir = '/Users/matthewmauer/Desktop/Document-Generator/web-interface/ard-data-chunks';
        this.chunkSize = 1000; // Process 1000 mappings per chunk
        this.extractedData = [];
        
        console.log('🚨 ARD STRING LENGTH ERROR FIX');
        console.log('===============================');
        console.log(`📁 Source: ${this.sourceFile}`);
        console.log(`📦 Output: ${this.outputDir}`);
        console.log('🎯 Converting 38MB hardcoded data to JSON chunks');
    }
    
    async fix() {
        try {
            // 1. Create output directory
            await this.createOutputDir();
            
            // 2. Extract data from massive file
            console.log('\n🔍 Analyzing massive file...');
            await this.extractDataMappings();
            
            // 3. Split into chunks
            console.log('\n📦 Creating data chunks...');
            await this.createDataChunks();
            
            // 4. Create new optimized ARD builder
            console.log('\n🏗️ Creating optimized ARD builder...');
            await this.createOptimizedBuilder();
            
            // 5. Create data loader with streaming
            console.log('\n🔄 Creating streaming data loader...');
            await this.createStreamingLoader();
            
            // 6. Backup original and replace
            console.log('\n💾 Backing up original and replacing...');
            await this.backupAndReplace();
            
            console.log('\n✅ FIX COMPLETE!');
            console.log('🎉 CLI string length error should be resolved');
            console.log('📊 Data extraction summary:');
            console.log(`   - Original: 38MB single file`);
            console.log(`   - New: ${Math.ceil(this.extractedData.length / this.chunkSize)} JSON chunks`);
            console.log(`   - Total mappings: ${this.extractedData.length}`);
            
        } catch (error) {
            console.error('❌ Error fixing string length issue:', error);
            throw error;
        }
    }
    
    async createOutputDir() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log(`✅ Created output directory: ${this.outputDir}`);
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
            console.log(`✅ Output directory exists: ${this.outputDir}`);
        }
    }
    
    async extractDataMappings() {
        const fileStream = require('fs').createReadStream(this.sourceFile);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        
        let inMappingsArray = false;
        let bracketCount = 0;
        let currentMapping = '';
        let mappingCount = 0;
        
        for await (const line of rl) {
            // Look for the start of the mappings array
            if (line.trim().includes('const mappings = [')) {
                inMappingsArray = true;
                console.log('🔍 Found mappings array, extracting data...');
                continue;
            }
            
            if (inMappingsArray) {
                // Count brackets to determine when mapping ends
                for (const char of line) {
                    if (char === '[') bracketCount++;
                    if (char === ']') bracketCount--;
                }
                
                currentMapping += line + '\n';
                
                // If we're back to bracket level 0 and have content, we have a complete mapping
                if (bracketCount === 0 && currentMapping.trim().length > 10) {
                    try {
                        // Clean up the mapping text and parse it
                        const cleanMapping = currentMapping
                            .replace(/^\s*\[/, '[')
                            .replace(/\],?\s*$/, ']')
                            .trim();
                        
                        if (cleanMapping.startsWith('[') && cleanMapping.endsWith(']')) {
                            const parsed = eval(`(${cleanMapping})`); // Safe here since we control the data
                            this.extractedData.push(parsed);
                            mappingCount++;
                            
                            if (mappingCount % 100 === 0) {
                                console.log(`   📄 Extracted ${mappingCount} mappings...`);
                            }
                        }
                    } catch (error) {
                        // Skip malformed mappings
                        console.warn(`⚠️ Skipped malformed mapping at line ${mappingCount}`);
                    }
                    
                    currentMapping = '';
                }
                
                // Check if we've reached the end of the mappings array
                if (line.trim() === '];' && bracketCount <= 0) {
                    inMappingsArray = false;
                    break;
                }
            }
        }
        
        console.log(`✅ Extracted ${this.extractedData.length} data mappings`);
    }
    
    async createDataChunks() {
        const chunks = [];
        
        for (let i = 0; i < this.extractedData.length; i += this.chunkSize) {
            const chunk = this.extractedData.slice(i, i + this.chunkSize);
            chunks.push(chunk);
        }
        
        // Save each chunk as a separate JSON file
        for (let i = 0; i < chunks.length; i++) {
            const chunkFile = path.join(this.outputDir, `chunk-${i.toString().padStart(4, '0')}.json`);
            await fs.writeFile(chunkFile, JSON.stringify(chunks[i], null, 2));
            console.log(`   📦 Saved chunk ${i + 1}/${chunks.length}: ${chunks[i].length} mappings`);
        }
        
        // Create index file
        const indexFile = path.join(this.outputDir, 'index.json');
        await fs.writeFile(indexFile, JSON.stringify({
            totalChunks: chunks.length,
            totalMappings: this.extractedData.length,
            chunkSize: this.chunkSize,
            created: new Date().toISOString(),
            version: '1.0.0'
        }, null, 2));
        
        console.log(`✅ Created ${chunks.length} data chunks`);
    }
    
    async createOptimizedBuilder() {
        const optimizedBuilder = `#!/usr/bin/env node

/**
 * 🏗️ OPTIMIZED ARD DOCUMENT BUILDER
 * 
 * Fixed version that loads data from JSON chunks instead of
 * hardcoding 38MB of data directly in JavaScript
 * 
 * This fixes the "RangeError: Invalid string length" CLI error
 */

const fs = require('fs').promises;
const path = require('path');

class OptimizedARDDocumentBuilder {
    constructor() {
        this.dataDir = path.join(__dirname, 'ard-data-chunks');
        this.osDocuments = new Map();
        this.ardComponents = new Map();
        this.chunksLoaded = 0;
        this.totalMappings = 0;
        
        console.log('🏗️ Optimized ARD Document Builder');
        console.log('📚 Building ARD system from chunked data (CLI-safe)');
    }
    
    async buildFromOSDocuments() {
        console.log('\\n🔨 BUILDING ARD COMPONENTS FROM CHUNKED DATA...');
        
        try {
            // Load index to understand data structure
            const indexPath = path.join(this.dataDir, 'index.json');
            const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
            
            console.log(\`📊 Data index loaded: \${index.totalMappings} mappings in \${index.totalChunks} chunks\`);
            
            // Process chunks one by one (streaming approach)
            for (let i = 0; i < index.totalChunks; i++) {
                await this.processChunk(i);
                
                // Show progress
                if ((i + 1) % 10 === 0 || i === index.totalChunks - 1) {
                    console.log(\`   📦 Processed \${i + 1}/\${index.totalChunks} chunks (\${this.totalMappings} mappings)\`);
                }
            }
            
            console.log(\`\\n✅ ARD build complete: \${this.ardComponents.size} components generated\`);
            
        } catch (error) {
            console.error('❌ Error building from chunked data:', error);
            throw error;
        }
    }
    
    async processChunk(chunkIndex) {
        const chunkFile = path.join(this.dataDir, \`chunk-\${chunkIndex.toString().padStart(4, '0')}.json\`);
        
        try {
            const chunkData = JSON.parse(await fs.readFile(chunkFile, 'utf8'));
            
            for (const mapping of chunkData) {
                if (Array.isArray(mapping) && mapping.length === 2) {
                    const [hash, document] = mapping;
                    
                    // Process the document mapping
                    this.osDocuments.set(hash, document);
                    this.totalMappings++;
                    
                    // Generate ARD component if candidate
                    if (document.isARDCandidate) {
                        await this.generateARDComponent(hash, document);
                    }
                }
            }
            
            this.chunksLoaded++;
            
        } catch (error) {
            console.warn(\`⚠️ Error processing chunk \${chunkIndex}: \${error.message}\`);
        }
    }
    
    async generateARDComponent(hash, document) {
        if (!document.isARDCandidate) return null;
        
        const componentName = this.toCamelCase(
            path.basename(document.name, path.extname(document.name))
        );
        
        const component = \`/**
 * ARD Component: \${componentName}
 * Generated from: \${document.path}
 * Hash: \${hash}
 * Type: \${document.type}
 */

class \${componentName}ARD {
    constructor() {
        this.source = \${JSON.stringify(document, null, 2)};
        this.hash = '\${hash}';
        this.name = '\${componentName}';
    }
    
    getMetadata() {
        return {
            name: this.name,
            hash: this.hash,
            type: this.source.type,
            size: this.source.size,
            modified: this.source.modified,
            ardPotential: this.source.ardIntegrationPotential
        };
    }
    
    getContent() {
        return this.source.content;
    }
    
    integrate() {
        console.log(\`🔗 Integrating ARD component: \${this.name}\`);
        return {
            status: 'integrated',
            component: this.name,
            hash: this.hash
        };
    }
}

module.exports = \${componentName}ARD;
\`;
        
        this.ardComponents.set(componentName, component);
        
        // Save component to file (ensure directory exists)
        const outputDir = './os-ard-components';
        try {
            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(\`\${outputDir}/\${componentName}.js\`, component);
        } catch (error) {
            console.warn(\`⚠️ Could not save component \${componentName}: \${error.message}\`);
        }
        
        return componentName;
    }
    
    toCamelCase(str) {
        return str.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
    }
    
    // Get statistics
    getStats() {
        return {
            chunksLoaded: this.chunksLoaded,
            totalMappings: this.totalMappings,
            documentsLoaded: this.osDocuments.size,
            componentsGenerated: this.ardComponents.size,
            memoryUsage: process.memoryUsage()
        };
    }
}

if (require.main === module) {
    const builder = new OptimizedARDDocumentBuilder();
    builder.buildFromOSDocuments()
        .then(() => {
            console.log('\\n📊 Final Statistics:');
            console.log(JSON.stringify(builder.getStats(), null, 2));
        })
        .catch(console.error);
}

module.exports = OptimizedARDDocumentBuilder;
`;
        
        const outputFile = path.join(path.dirname(this.sourceFile), 'ard-document-builder-optimized.js');
        await fs.writeFile(outputFile, optimizedBuilder);
        console.log(`✅ Created optimized builder: ${outputFile}`);
    }
    
    async createStreamingLoader() {
        const streamingLoader = `#!/usr/bin/env node

/**
 * 🔄 ARD STREAMING DATA LOADER
 * 
 * Provides streaming access to ARD data chunks to prevent
 * CLI string length errors and memory issues
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class ARDStreamingLoader extends EventEmitter {
    constructor(dataDir = null) {
        super();
        this.dataDir = dataDir || path.join(__dirname, 'ard-data-chunks');
        this.index = null;
        this.loadedChunks = new Map();
        this.maxCachedChunks = 5; // Cache max 5 chunks in memory
        
        console.log('🔄 ARD Streaming Data Loader');
        console.log(\`📁 Data directory: \${this.dataDir}\`);
    }
    
    async initialize() {
        try {
            const indexPath = path.join(this.dataDir, 'index.json');
            this.index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
            
            console.log(\`📊 Initialized: \${this.index.totalMappings} mappings in \${this.index.totalChunks} chunks\`);
            this.emit('initialized', this.index);
            
            return this.index;
        } catch (error) {
            console.error('❌ Failed to initialize streaming loader:', error);
            this.emit('error', error);
            throw error;
        }
    }
    
    async getChunk(chunkIndex) {
        // Return cached chunk if available
        if (this.loadedChunks.has(chunkIndex)) {
            return this.loadedChunks.get(chunkIndex);
        }
        
        // Load new chunk
        const chunkFile = path.join(this.dataDir, \`chunk-\${chunkIndex.toString().padStart(4, '0')}.json\`);
        
        try {
            const chunkData = JSON.parse(await fs.readFile(chunkFile, 'utf8'));
            
            // Cache management - remove oldest chunks if cache is full
            if (this.loadedChunks.size >= this.maxCachedChunks) {
                const oldestChunk = this.loadedChunks.keys().next().value;
                this.loadedChunks.delete(oldestChunk);
            }
            
            this.loadedChunks.set(chunkIndex, chunkData);
            this.emit('chunkLoaded', { chunkIndex, size: chunkData.length });
            
            return chunkData;
            
        } catch (error) {
            console.error(\`❌ Error loading chunk \${chunkIndex}:\`, error);
            this.emit('error', error);
            return [];
        }
    }
    
    async* streamMappings() {
        if (!this.index) {
            await this.initialize();
        }
        
        for (let chunkIndex = 0; chunkIndex < this.index.totalChunks; chunkIndex++) {
            const chunk = await this.getChunk(chunkIndex);
            
            for (const mapping of chunk) {
                yield mapping;
            }
        }
    }
    
    async findMappingByHash(hash) {
        if (!this.index) {
            await this.initialize();
        }
        
        // Stream through all mappings to find the one with matching hash
        for await (const mapping of this.streamMappings()) {
            if (Array.isArray(mapping) && mapping[0] === hash) {
                return mapping;
            }
        }
        
        return null;
    }
    
    async getMappingsByType(type) {
        const results = [];
        
        for await (const mapping of this.streamMappings()) {
            if (Array.isArray(mapping) && mapping[1] && mapping[1].type === type) {
                results.push(mapping);
            }
        }
        
        return results;
    }
    
    getStats() {
        return {
            index: this.index,
            cachedChunks: this.loadedChunks.size,
            maxCachedChunks: this.maxCachedChunks,
            memoryUsage: process.memoryUsage()
        };
    }
}

// CLI usage
if (require.main === module) {
    const loader = new ARDStreamingLoader();
    
    loader.on('initialized', (index) => {
        console.log('✅ Loader initialized');
        console.log(\`📊 \${index.totalMappings} mappings available\`);
    });
    
    loader.on('chunkLoaded', (info) => {
        console.log(\`📦 Loaded chunk \${info.chunkIndex} (\${info.size} mappings)\`);
    });
    
    loader.on('error', (error) => {
        console.error('❌ Streaming error:', error);
    });
    
    // Test streaming
    (async () => {
        try {
            await loader.initialize();
            
            console.log('\\n🔄 Testing streaming...');
            let count = 0;
            
            for await (const mapping of loader.streamMappings()) {
                count++;
                if (count <= 5) {
                    console.log(\`   📄 Mapping \${count}: \${mapping[0]} -> \${mapping[1]?.name || 'unnamed'}\`);
                }
                if (count % 1000 === 0) {
                    console.log(\`   📊 Streamed \${count} mappings...\`);
                }
            }
            
            console.log(\`\\n✅ Streaming test complete: \${count} mappings processed\`);
            console.log('📊 Final stats:', JSON.stringify(loader.getStats(), null, 2));
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    })();
}

module.exports = ARDStreamingLoader;
`;
        
        const outputFile = path.join(path.dirname(this.sourceFile), 'ard-streaming-loader.js');
        await fs.writeFile(outputFile, streamingLoader);
        console.log(`✅ Created streaming loader: ${outputFile}`);
    }
    
    async backupAndReplace() {
        // Backup original file
        const backupFile = this.sourceFile + '.backup-' + Date.now();
        await fs.copyFile(this.sourceFile, backupFile);
        console.log(`💾 Backed up original to: ${backupFile}`);
        
        // Replace original with optimized version
        const optimizedFile = path.join(path.dirname(this.sourceFile), 'ard-document-builder-optimized.js');
        await fs.copyFile(optimizedFile, this.sourceFile);
        console.log(`🔄 Replaced original with optimized version`);
        
        // Create a CLI-safe version indicator
        const indicatorFile = path.join(path.dirname(this.sourceFile), 'CLI-STRING-LENGTH-FIXED.txt');
        await fs.writeFile(indicatorFile, `CLI String Length Error Fixed
=====================================

Date: ${new Date().toISOString()}
Original file size: 38MB (180,630 lines)
New approach: Chunked JSON data loading

The massive hardcoded data has been extracted to JSON chunks
to prevent "RangeError: Invalid string length" in Claude CLI.

Files created:
- ard-data-chunks/: Directory with JSON data chunks
- ard-document-builder-optimized.js: New streaming builder
- ard-streaming-loader.js: Data streaming utility
- ${path.basename(backupFile)}: Backup of original file

The CLI should now work without string length errors.
`);
        
        console.log(`✅ Created fix indicator: ${indicatorFile}`);
    }
}

// Execute the fix
if (require.main === module) {
    const fix = new ARDStringLengthFix();
    fix.fix().catch(console.error);
}

module.exports = ARDStringLengthFix;
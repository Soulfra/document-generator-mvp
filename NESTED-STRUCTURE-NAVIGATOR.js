#!/usr/bin/env node

/**
 * 🔍 NESTED STRUCTURE NAVIGATOR
 * Ring 0 system - Fixes the "needle in haystack" problem with proper recursive traversal
 * Efficiently navigates through nested folders, rings, and complex hierarchies
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class NestedStructureNavigator extends EventEmitter {
    constructor() {
        super();
        
        // Search index for fast lookups
        this.searchIndex = new Map();
        
        // Ring structure mapping
        this.ringStructure = {
            0: { // Core/Backend
                paths: ['core/', 'database/', 'models/', 'services/core/'],
                patterns: ['*-CORE.js', '*-DATABASE.js', '*-MODEL.js'],
                characteristics: ['no dependencies', 'foundational']
            },
            1: { // Logic/Processing
                paths: ['services/', 'processors/', 'engines/', 'analyzers/'],
                patterns: ['*-ENGINE.js', '*-PROCESSOR.js', '*-ANALYZER.js'],
                characteristics: ['business logic', 'data processing']
            },
            2: { // Frontend/UI
                paths: ['ui/', 'views/', 'components/', 'interfaces/'],
                patterns: ['*.html', '*-INTERFACE.js', '*-UI.js'],
                characteristics: ['user interface', 'visual components']
            }
        };
        
        // Conversation patterns to extract requirements
        this.conversationPatterns = {
            damageTypes: /(?:damage|dmg).*(physical|magic|ranged|true|chaos)/gi,
            tierMentions: /tier\s*(\d+)|level\s*(\d+)/gi,
            bossMentions: /(dragon|boss|enemy|mob)/gi,
            systemRequests: /(need|want|should|must).*(system|feature|ability)/gi,
            frustrations: /(confus|annoy|frustrat|hate|stuck)/gi
        };
        
        // Path optimization cache
        this.pathCache = new Map();
        this.lastSearchTime = 0;
        this.searchStats = {
            totalSearches: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageSearchTime: 0
        };
        
        console.log('🔍 Nested Structure Navigator initialized');
        console.log('🗺️ Ring structure mapping configured');
        console.log('💾 Search index ready for population');
    }
    
    /**
     * Build search index for faster lookups
     */
    async buildSearchIndex(rootPath = process.cwd()) {
        console.log('🔨 Building search index...');
        const startTime = Date.now();
        
        this.searchIndex.clear();
        await this.indexDirectory(rootPath);
        
        const indexTime = Date.now() - startTime;
        console.log(`✅ Index built in ${indexTime}ms`);
        console.log(`📊 Indexed ${this.searchIndex.size} files`);
        
        return {
            filesIndexed: this.searchIndex.size,
            indexTime,
            rootPath
        };
    }
    
    /**
     * Recursively index directory structure
     */
    async indexDirectory(dirPath, depth = 0, maxDepth = 10) {
        if (depth > maxDepth) return;
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                // Skip node_modules and .git
                if (entry.name === 'node_modules' || entry.name === '.git') continue;
                
                if (entry.isDirectory()) {
                    // Index subdirectory
                    await this.indexDirectory(fullPath, depth + 1, maxDepth);
                } else if (entry.isFile()) {
                    // Index file with metadata
                    const fileInfo = {
                        name: entry.name,
                        path: fullPath,
                        directory: dirPath,
                        extension: path.extname(entry.name),
                        depth,
                        ring: this.detectRingLevel(fullPath),
                        type: this.detectFileType(entry.name),
                        keywords: this.extractKeywords(entry.name)
                    };
                    
                    // Add to index with multiple keys for fast lookup
                    this.searchIndex.set(fullPath, fileInfo);
                    
                    // Index by name
                    const byName = this.searchIndex.get(`name:${entry.name}`) || [];
                    byName.push(fileInfo);
                    this.searchIndex.set(`name:${entry.name}`, byName);
                    
                    // Index by type
                    const byType = this.searchIndex.get(`type:${fileInfo.type}`) || [];
                    byType.push(fileInfo);
                    this.searchIndex.set(`type:${fileInfo.type}`, byType);
                    
                    // Index by ring
                    if (fileInfo.ring !== null) {
                        const byRing = this.searchIndex.get(`ring:${fileInfo.ring}`) || [];
                        byRing.push(fileInfo);
                        this.searchIndex.set(`ring:${fileInfo.ring}`, byRing);
                    }
                    
                    // Index by keywords
                    fileInfo.keywords.forEach(keyword => {
                        const byKeyword = this.searchIndex.get(`keyword:${keyword}`) || [];
                        byKeyword.push(fileInfo);
                        this.searchIndex.set(`keyword:${keyword}`, byKeyword);
                    });
                }
            }
        } catch (error) {
            console.warn(`Failed to index ${dirPath}:`, error.message);
        }
    }
    
    /**
     * Detect ring level from file path
     */
    detectRingLevel(filePath) {
        for (const [ring, config] of Object.entries(this.ringStructure)) {
            // Check if path contains ring-specific directories
            if (config.paths.some(p => filePath.includes(p))) {
                return parseInt(ring);
            }
            
            // Check if filename matches ring patterns
            const filename = path.basename(filePath);
            if (config.patterns.some(pattern => {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(filename);
            })) {
                return parseInt(ring);
            }
        }
        
        return null; // Unknown ring
    }
    
    /**
     * Detect file type from name
     */
    detectFileType(filename) {
        const patterns = {
            damage: /damage|dmg|combat|attack/i,
            tier: /tier|level|rank|grade/i,
            boss: /boss|enemy|mob|dragon|monster/i,
            character: /character|char|player|hero|avatar/i,
            system: /system|engine|processor|manager/i,
            ui: /interface|ui|view|component|html/i,
            config: /config|settings|options|preferences/i
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(filename)) {
                return type;
            }
        }
        
        return 'other';
    }
    
    /**
     * Extract keywords from filename
     */
    extractKeywords(filename) {
        const keywords = [];
        
        // Remove extension
        const base = filename.replace(/\.[^.]+$/, '');
        
        // Split by common separators
        const parts = base.split(/[-_\s\.]+/);
        
        parts.forEach(part => {
            if (part.length > 2) {
                keywords.push(part.toLowerCase());
                
                // Also add camelCase splits
                const camelParts = part.split(/(?=[A-Z])/);
                camelParts.forEach(cp => {
                    if (cp.length > 2) {
                        keywords.push(cp.toLowerCase());
                    }
                });
            }
        });
        
        return [...new Set(keywords)]; // Remove duplicates
    }
    
    /**
     * Fast search with multiple strategies
     */
    async search(query, options = {}) {
        const startTime = Date.now();
        this.searchStats.totalSearches++;
        
        const {
            searchType = 'all', // 'all', 'name', 'content', 'type'
            ring = null,
            maxResults = 50,
            fuzzy = true
        } = options;
        
        // Check cache first
        const cacheKey = `${query}:${searchType}:${ring}`;
        if (this.pathCache.has(cacheKey)) {
            this.searchStats.cacheHits++;
            const cached = this.pathCache.get(cacheKey);
            
            // Cache expires after 5 minutes
            if (Date.now() - cached.timestamp < 300000) {
                return cached.results;
            }
        }
        
        this.searchStats.cacheMisses++;
        
        // Perform search
        let results = [];
        
        switch (searchType) {
            case 'name':
                results = this.searchByName(query, fuzzy);
                break;
            case 'type':
                results = this.searchByType(query);
                break;
            case 'keyword':
                results = this.searchByKeyword(query, fuzzy);
                break;
            case 'all':
            default:
                results = this.searchAll(query, fuzzy);
        }
        
        // Filter by ring if specified
        if (ring !== null) {
            results = results.filter(r => r.ring === ring);
        }
        
        // Limit results
        results = results.slice(0, maxResults);
        
        // Sort by relevance
        results = this.sortByRelevance(results, query);
        
        // Cache results
        this.pathCache.set(cacheKey, {
            results,
            timestamp: Date.now()
        });
        
        // Update stats
        const searchTime = Date.now() - startTime;
        this.searchStats.averageSearchTime = 
            (this.searchStats.averageSearchTime * (this.searchStats.totalSearches - 1) + searchTime) / 
            this.searchStats.totalSearches;
        
        this.emit('searchCompleted', {
            query,
            resultsCount: results.length,
            searchTime,
            cacheHit: false
        });
        
        return results;
    }
    
    /**
     * Search by filename
     */
    searchByName(query, fuzzy = true) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Direct name lookup
        const exact = this.searchIndex.get(`name:${query}`);
        if (exact) {
            results.push(...exact);
        }
        
        // Fuzzy search through all files
        if (fuzzy) {
            for (const [key, value] of this.searchIndex.entries()) {
                if (key.startsWith('name:')) continue;
                if (typeof value === 'object' && value.name) {
                    const nameLower = value.name.toLowerCase();
                    if (nameLower.includes(queryLower) || this.fuzzyMatch(queryLower, nameLower)) {
                        results.push(value);
                    }
                }
            }
        }
        
        return results;
    }
    
    /**
     * Search by file type
     */
    searchByType(type) {
        return this.searchIndex.get(`type:${type}`) || [];
    }
    
    /**
     * Search by keyword
     */
    searchByKeyword(keyword, fuzzy = true) {
        const results = [];
        const keywordLower = keyword.toLowerCase();
        
        // Direct keyword lookup
        const exact = this.searchIndex.get(`keyword:${keywordLower}`);
        if (exact) {
            results.push(...exact);
        }
        
        // Fuzzy keyword search
        if (fuzzy) {
            for (const [key, value] of this.searchIndex.entries()) {
                if (key.startsWith('keyword:')) {
                    const kw = key.substring(8);
                    if (kw.includes(keywordLower) || this.fuzzyMatch(keywordLower, kw)) {
                        results.push(...(value || []));
                    }
                }
            }
        }
        
        // Deduplicate
        const seen = new Set();
        return results.filter(r => {
            const key = r.path;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    
    /**
     * Search all indexes
     */
    searchAll(query, fuzzy = true) {
        const nameResults = this.searchByName(query, fuzzy);
        const keywordResults = this.searchByKeyword(query, fuzzy);
        const typeResults = this.searchByType(query);
        
        // Combine and deduplicate
        const allResults = [...nameResults, ...keywordResults, ...typeResults];
        const seen = new Set();
        
        return allResults.filter(r => {
            const key = r.path;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    
    /**
     * Simple fuzzy matching
     */
    fuzzyMatch(query, target) {
        // Simple character-by-character fuzzy match
        let queryIdx = 0;
        for (let i = 0; i < target.length && queryIdx < query.length; i++) {
            if (target[i] === query[queryIdx]) {
                queryIdx++;
            }
        }
        return queryIdx === query.length;
    }
    
    /**
     * Sort results by relevance
     */
    sortByRelevance(results, query) {
        const queryLower = query.toLowerCase();
        
        return results.sort((a, b) => {
            // Exact name match first
            if (a.name.toLowerCase() === queryLower) return -1;
            if (b.name.toLowerCase() === queryLower) return 1;
            
            // Name contains query
            const aContains = a.name.toLowerCase().includes(queryLower);
            const bContains = b.name.toLowerCase().includes(queryLower);
            if (aContains && !bContains) return -1;
            if (!aContains && bContains) return 1;
            
            // Shorter paths first (less nested)
            return a.depth - b.depth;
        });
    }
    
    /**
     * Find files by ring level
     */
    findByRing(ringLevel) {
        return this.searchIndex.get(`ring:${ringLevel}`) || [];
    }
    
    /**
     * Find related files (same directory, similar names)
     */
    findRelated(filePath, maxResults = 10) {
        const fileInfo = this.searchIndex.get(filePath);
        if (!fileInfo) return [];
        
        const related = [];
        
        // Find files in same directory
        for (const [key, value] of this.searchIndex.entries()) {
            if (typeof value === 'object' && value.directory === fileInfo.directory && value.path !== filePath) {
                related.push({
                    ...value,
                    reason: 'same directory'
                });
            }
        }
        
        // Find files with similar names
        const baseName = fileInfo.name.replace(/\.[^.]+$/, '');
        for (const [key, value] of this.searchIndex.entries()) {
            if (typeof value === 'object' && value.name.includes(baseName) && value.path !== filePath) {
                related.push({
                    ...value,
                    reason: 'similar name'
                });
            }
        }
        
        // Find files with shared keywords
        fileInfo.keywords.forEach(keyword => {
            const byKeyword = this.searchIndex.get(`keyword:${keyword}`) || [];
            byKeyword.forEach(file => {
                if (file.path !== filePath) {
                    related.push({
                        ...file,
                        reason: `shared keyword: ${keyword}`
                    });
                }
            });
        });
        
        // Deduplicate and limit
        const seen = new Set();
        return related.filter(r => {
            const key = r.path;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, maxResults);
    }
    
    /**
     * Analyze conversation to extract file search requirements
     */
    analyzeConversation(conversation) {
        const analysis = {
            mentionedDamageTypes: [],
            mentionedTiers: [],
            mentionedBosses: [],
            systemRequests: [],
            frustrationPoints: [],
            probableSearches: []
        };
        
        // Extract damage types
        let match;
        while ((match = this.conversationPatterns.damageTypes.exec(conversation)) !== null) {
            analysis.mentionedDamageTypes.push(match[1]);
        }
        
        // Extract tier mentions
        this.conversationPatterns.tierMentions.lastIndex = 0;
        while ((match = this.conversationPatterns.tierMentions.exec(conversation)) !== null) {
            analysis.mentionedTiers.push(parseInt(match[1] || match[2]));
        }
        
        // Extract boss mentions
        this.conversationPatterns.bossMentions.lastIndex = 0;
        while ((match = this.conversationPatterns.bossMentions.exec(conversation)) !== null) {
            analysis.mentionedBosses.push(match[1]);
        }
        
        // Extract system requests
        this.conversationPatterns.systemRequests.lastIndex = 0;
        while ((match = this.conversationPatterns.systemRequests.exec(conversation)) !== null) {
            analysis.systemRequests.push(match[0]);
        }
        
        // Extract frustration points
        this.conversationPatterns.frustrations.lastIndex = 0;
        while ((match = this.conversationPatterns.frustrations.exec(conversation)) !== null) {
            const start = Math.max(0, match.index - 50);
            const end = Math.min(conversation.length, match.index + 50);
            analysis.frustrationPoints.push(conversation.substring(start, end));
        }
        
        // Generate probable searches based on analysis
        if (analysis.mentionedDamageTypes.length > 0) {
            analysis.probableSearches.push(...analysis.mentionedDamageTypes.map(dt => `damage ${dt}`));
        }
        
        if (analysis.mentionedTiers.length > 0) {
            analysis.probableSearches.push(...analysis.mentionedTiers.map(t => `tier ${t}`));
        }
        
        if (analysis.mentionedBosses.length > 0) {
            analysis.probableSearches.push(...analysis.mentionedBosses);
        }
        
        return analysis;
    }
    
    /**
     * Get search statistics
     */
    getStats() {
        return {
            indexSize: this.searchIndex.size,
            cacheSize: this.pathCache.size,
            ...this.searchStats,
            cacheHitRate: this.searchStats.totalSearches > 0 
                ? (this.searchStats.cacheHits / this.searchStats.totalSearches * 100).toFixed(2) + '%'
                : '0%'
        };
    }
    
    /**
     * Clear caches
     */
    clearCache() {
        this.pathCache.clear();
        console.log('🧹 Search cache cleared');
    }
}

module.exports = NestedStructureNavigator;

// CLI testing
if (require.main === module) {
    async function test() {
        console.log('🔍 Testing Nested Structure Navigator\n');
        
        const navigator = new NestedStructureNavigator();
        
        // Build index
        console.log('📚 Building search index...');
        const indexStats = await navigator.buildSearchIndex();
        console.log('Index stats:', indexStats);
        
        console.log('\n🔎 SEARCH TESTS:');
        console.log('=================');
        
        // Search for damage-related files
        console.log('\nSearching for "damage":');
        const damageResults = await navigator.search('damage', { maxResults: 5 });
        damageResults.forEach(r => {
            console.log(`  - ${r.name} (Ring ${r.ring}, Type: ${r.type})`);
        });
        
        // Search for tier-specific files
        console.log('\nSearching for "tier":');
        const tierResults = await navigator.search('tier', { maxResults: 5 });
        tierResults.forEach(r => {
            console.log(`  - ${r.name} (${r.path})`);
        });
        
        // Search for dragon bosses
        console.log('\nSearching for "dragon":');
        const dragonResults = await navigator.search('dragon', { searchType: 'keyword' });
        dragonResults.forEach(r => {
            console.log(`  - ${r.name}`);
        });
        
        // Find Ring 0 files
        console.log('\n💍 Ring 0 files:');
        const ring0Files = navigator.findByRing(0);
        console.log(`Found ${ring0Files.length} Ring 0 files`);
        ring0Files.slice(0, 3).forEach(f => {
            console.log(`  - ${f.name}`);
        });
        
        console.log('\n💬 CONVERSATION ANALYSIS:');
        console.log('=========================');
        const sampleConversation = `
            alright so then now i'm thinking about this and we have the dragons and whatever else or tiers or bosses idk. 
            but thats like the 3rd tier can deal damage in magic/physical which are probably color coded, 
            but then the other tier is probably physical only or range or something idk. 
            this is where i get super fucking confused again because its not allowing us to go through folders or nests etc.
        `;
        
        const conversationAnalysis = navigator.analyzeConversation(sampleConversation);
        console.log('Conversation analysis:', JSON.stringify(conversationAnalysis, null, 2));
        
        console.log('\n📊 SEARCH STATISTICS:');
        console.log('====================');
        console.log(navigator.getStats());
        
        console.log('\n✅ Nested Structure Navigator test complete!');
    }
    
    test().catch(console.error);
}
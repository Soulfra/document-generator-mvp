#!/usr/bin/env node

/**
 * 📦 HTML/TOKEN COMPACTION ENGINE
 * Compacts HTML, CSS, JS, and content into minimal token representations
 * Optimized for community-driven development and entertainment content
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');
const zlib = require('zlib');

class HTMLTokenCompactionEngine {
    constructor() {
        this.tokenDictionary = new Map();
        this.reverseDictionary = new Map();
        this.compressionStats = new Map();
        this.entertainmentTokens = new Map();
        this.communityPatterns = new Map();
        
        // Initialize common token patterns
        this.initializeTokenDictionary();
        this.initializeEntertainmentTokens();
        this.initializeCommunityPatterns();
        
        console.log('📦 HTML/Token Compaction Engine initialized');
    }
    
    initializeTokenDictionary() {
        // Common HTML/CSS/JS patterns that appear frequently
        const commonPatterns = [
            // HTML tags
            ['<div>', 'D'],
            ['</div>', 'E'],
            ['<span>', 'S'],
            ['</span>', 'T'],
            ['<p>', 'P'],
            ['</p>', 'Q'],
            ['<a>', 'A'],
            ['</a>', 'B'],
            ['<img>', 'I'],
            ['<br>', 'R'],
            ['<hr>', 'H'],
            
            // HTML attributes
            ['class=', 'C'],
            ['id=', 'i'],
            ['style=', 's'],
            ['src=', 'r'],
            ['href=', 'h'],
            ['alt=', 'a'],
            ['title=', 't'],
            ['data-', 'd'],
            
            // CSS properties
            ['background:', 'BG'],
            ['color:', 'CO'],
            ['font-size:', 'FS'],
            ['margin:', 'MG'],
            ['padding:', 'PD'],
            ['width:', 'WD'],
            ['height:', 'HT'],
            ['display:', 'DP'],
            ['position:', 'PS'],
            ['flex:', 'FX'],
            
            // JavaScript keywords
            ['function', 'FN'],
            ['return', 'RT'],
            ['const', 'CT'],
            ['let', 'LT'],
            ['var', 'VR'],
            ['if', 'IF'],
            ['else', 'EL'],
            ['for', 'FR'],
            ['while', 'WH'],
            ['console.log', 'CL'],
            
            // Common words
            ['the', 'THE'],
            ['and', 'AND'],
            ['this', 'THS'],
            ['that', 'THT'],
            ['with', 'WTH'],
            ['from', 'FRM'],
            ['they', 'THY'],
            ['have', 'HVE'],
            ['more', 'MRE'],
            ['will', 'WLL'],
            
            // Entertainment-specific
            ['music', 'MUS'],
            ['video', 'VID'],
            ['game', 'GAM'],
            ['art', 'ART'],
            ['creative', 'CRE'],
            ['viral', 'VIR'],
            ['entertainment', 'ENT'],
            ['underground', 'UND'],
            ['community', 'COM'],
            ['content', 'CNT']
        ];
        
        // Build token dictionary
        commonPatterns.forEach(([pattern, token], index) => {
            this.tokenDictionary.set(pattern, token);
            this.reverseDictionary.set(token, pattern);
        });
        
        console.log(`📚 Token dictionary initialized with ${commonPatterns.length} patterns`);
    }
    
    initializeEntertainmentTokens() {
        // Entertainment-specific compression patterns
        const entertainmentPatterns = [
            // Music terms
            ['playlist', 'PL'],
            ['soundtrack', 'ST'],
            ['beat', 'BT'],
            ['rhythm', 'RH'],
            ['melody', 'ML'],
            ['bass', 'BS'],
            ['drum', 'DR'],
            ['guitar', 'GT'],
            ['vocal', 'VC'],
            ['mix', 'MX'],
            
            // Video terms
            ['stream', 'SM'],
            ['channel', 'CH'],
            ['subscribe', 'SB'],
            ['like', 'LK'],
            ['share', 'SH'],
            ['comment', 'CM'],
            ['trending', 'TR'],
            ['viral', 'VL'],
            ['views', 'VW'],
            ['upload', 'UP'],
            
            // Gaming terms
            ['player', 'PL'],
            ['level', 'LV'],
            ['score', 'SC'],
            ['achievement', 'AC'],
            ['multiplayer', 'MP'],
            ['leaderboard', 'LB'],
            ['character', 'CR'],
            ['weapon', 'WP'],
            ['health', 'HP'],
            ['power', 'PW'],
            
            // Underground/gutter terms
            ['hidden', 'HD'],
            ['secret', 'SE'],
            ['exclusive', 'EX'],
            ['underground', 'UG'],
            ['gutter', 'GT'],
            ['scene', 'SC'],
            ['culture', 'CU'],
            ['movement', 'MV'],
            ['revolution', 'RV'],
            ['breakthrough', 'BT']
        ];
        
        entertainmentPatterns.forEach(([pattern, token]) => {
            this.entertainmentTokens.set(pattern, `E${token}`);
            this.reverseDictionary.set(`E${token}`, pattern);
        });
        
        console.log(`🎭 Entertainment tokens initialized with ${entertainmentPatterns.length} patterns`);
    }
    
    initializeCommunityPatterns() {
        // Community-driven development patterns
        const communityPatterns = [
            // Collaboration terms
            ['collaborate', 'CLB'],
            ['contribute', 'CTB'],
            ['feedback', 'FDB'],
            ['review', 'RVW'],
            ['approve', 'APV'],
            ['merge', 'MRG'],
            ['fork', 'FRK'],
            ['branch', 'BRC'],
            ['commit', 'CMT'],
            ['pull', 'PLL'],
            
            // Community actions
            ['upvote', 'UPV'],
            ['downvote', 'DWV'],
            ['favorite', 'FAV'],
            ['bookmark', 'BMK'],
            ['follow', 'FLW'],
            ['mention', 'MNT'],
            ['tag', 'TAG'],
            ['category', 'CAT'],
            ['thread', 'THR'],
            ['discussion', 'DIS'],
            
            // Quality indicators
            ['awesome', 'AWE'],
            ['amazing', 'AMZ'],
            ['brilliant', 'BRL'],
            ['genius', 'GEN'],
            ['innovative', 'INV'],
            ['creative', 'CRT'],
            ['original', 'ORG'],
            ['unique', 'UNQ'],
            ['epic', 'EPC'],
            ['legendary', 'LEG']
        ];
        
        communityPatterns.forEach(([pattern, token]) => {
            this.communityPatterns.set(pattern, `C${token}`);
            this.reverseDictionary.set(`C${token}`, pattern);
        });
        
        console.log(`🤝 Community patterns initialized with ${communityPatterns.length} patterns`);
    }
    
    async compactHTMLContent(htmlContent, options = {}) {
        console.log('\n📦 Starting HTML content compaction...');
        
        const originalSize = htmlContent.length;
        console.log(`  📏 Original size: ${originalSize} bytes`);
        
        // Step 1: Pre-process HTML structure
        let processed = this.preprocessHTML(htmlContent);
        console.log(`  🔧 After preprocessing: ${processed.length} bytes`);
        
        // Step 2: Apply token compression
        processed = this.applyTokenCompression(processed);
        console.log(`  🏷️  After tokenization: ${processed.length} bytes`);
        
        // Step 3: Apply entertainment-specific compression
        if (options.entertainmentOptimized) {
            processed = this.applyEntertainmentCompression(processed);
            console.log(`  🎭 After entertainment compression: ${processed.length} bytes`);
        }
        
        // Step 4: Apply community pattern compression
        if (options.communityOptimized) {
            processed = this.applyCommunityCompression(processed);
            console.log(`  🤝 After community compression: ${processed.length} bytes`);
        }
        
        // Step 5: Apply final compaction
        const compacted = this.applyFinalCompaction(processed);
        console.log(`  🗜️  After final compaction: ${compacted.length} bytes`);
        
        // Step 6: Generate metadata
        const metadata = this.generateCompressionMetadata(htmlContent, compacted, options);
        
        // Step 7: Create final package
        const finalPackage = this.createCompactedPackage(compacted, metadata);
        
        const finalSize = finalPackage.length;
        const compressionRatio = finalSize / originalSize;
        
        console.log(`✅ Compaction complete:`);
        console.log(`  📏 Final size: ${finalSize} bytes`);
        console.log(`  🗜️  Compression ratio: ${(compressionRatio * 100).toFixed(1)}%`);
        console.log(`  💾 Space saved: ${originalSize - finalSize} bytes`);
        
        return {
            original: htmlContent,
            compacted: finalPackage,
            metadata: {
                ...metadata,
                originalSize,
                compactedSize: finalSize,
                compressionRatio,
                spaceSaved: originalSize - finalSize
            }
        };
    }
    
    preprocessHTML(html) {
        console.log('  🔧 Preprocessing HTML structure...');
        
        let processed = html;
        
        // Remove unnecessary whitespace
        processed = processed.replace(/>\s+</g, '><');
        processed = processed.replace(/\s+/g, ' ');
        processed = processed.trim();
        
        // Remove HTML comments (but preserve SOL headers)
        processed = processed.replace(/<!--(?!.*SOL).*?-->/gs, '');
        
        // Compress CSS
        processed = this.compressEmbeddedCSS(processed);
        
        // Compress JavaScript
        processed = this.compressEmbeddedJS(processed);
        
        // Standardize quotes
        processed = processed.replace(/"/g, "'");
        
        return processed;
    }
    
    compressEmbeddedCSS(html) {
        return html.replace(/<style[^>]*>(.*?)<\/style>/gs, (match, css) => {
            // Compress CSS
            let compressed = css
                .replace(/\/\*.*?\*\//gs, '')  // Remove comments
                .replace(/\s*{\s*/g, '{')      // Remove spaces around {
                .replace(/\s*}\s*/g, '}')      // Remove spaces around }
                .replace(/\s*;\s*/g, ';')      // Remove spaces around ;
                .replace(/\s*:\s*/g, ':')      // Remove spaces around :
                .replace(/\s+/g, ' ')          // Collapse whitespace
                .trim();
            
            return `<style>${compressed}</style>`;
        });
    }
    
    compressEmbeddedJS(html) {
        return html.replace(/<script[^>]*>(.*?)<\/script>/gs, (match, js) => {
            // Basic JavaScript compression
            let compressed = js
                .replace(/\/\*.*?\*\//gs, '')   // Remove block comments
                .replace(/\/\/.*$/gm, '')       // Remove line comments
                .replace(/\s*{\s*/g, '{')       // Remove spaces around {
                .replace(/\s*}\s*/g, '}')       // Remove spaces around }
                .replace(/\s*;\s*/g, ';')       // Remove spaces around ;
                .replace(/\s*=\s*/g, '=')       // Remove spaces around =
                .replace(/\s+/g, ' ')           // Collapse whitespace
                .trim();
            
            return `<script>${compressed}</script>`;
        });
    }
    
    applyTokenCompression(content) {
        console.log('  🏷️  Applying token compression...');
        
        let compressed = content;
        
        // Apply dictionary-based compression
        for (const [pattern, token] of this.tokenDictionary) {
            compressed = compressed.replace(new RegExp(this.escapeRegex(pattern), 'g'), `§${token}§`);
        }
        
        return compressed;
    }
    
    applyEntertainmentCompression(content) {
        console.log('  🎭 Applying entertainment-specific compression...');
        
        let compressed = content;
        
        // Apply entertainment token compression
        for (const [pattern, token] of this.entertainmentTokens) {
            compressed = compressed.replace(new RegExp(this.escapeRegex(pattern), 'gi'), `§${token}§`);
        }
        
        // Compress entertainment-specific structures
        compressed = this.compressEntertainmentStructures(compressed);
        
        return compressed;
    }
    
    compressEntertainmentStructures(content) {
        // Compress common entertainment patterns
        let compressed = content;
        
        // Music player controls
        compressed = compressed.replace(
            /<div class='music-player'>(.*?)<\/div>/gs,
            (match, inner) => `§MP[${this.compressInner(inner)}]§`
        );
        
        // Video containers
        compressed = compressed.replace(
            /<div class='video-container'>(.*?)<\/div>/gs,
            (match, inner) => `§VC[${this.compressInner(inner)}]§`
        );
        
        // Gaming elements
        compressed = compressed.replace(
            /<div class='game-element'>(.*?)<\/div>/gs,
            (match, inner) => `§GE[${this.compressInner(inner)}]§`
        );
        
        // Social media embeds
        compressed = compressed.replace(
            /<div class='social-embed'>(.*?)<\/div>/gs,
            (match, inner) => `§SE[${this.compressInner(inner)}]§`
        );
        
        return compressed;
    }
    
    applyCommunityCompression(content) {
        console.log('  🤝 Applying community pattern compression...');
        
        let compressed = content;
        
        // Apply community token compression
        for (const [pattern, token] of this.communityPatterns) {
            compressed = compressed.replace(new RegExp(this.escapeRegex(pattern), 'gi'), `§${token}§`);
        }
        
        // Compress community-specific structures
        compressed = this.compressCommunityStructures(compressed);
        
        return compressed;
    }
    
    compressCommunityStructures(content) {
        let compressed = content;
        
        // Comment threads
        compressed = compressed.replace(
            /<div class='comment-thread'>(.*?)<\/div>/gs,
            (match, inner) => `§CT[${this.compressInner(inner)}]§`
        );
        
        // User profiles
        compressed = compressed.replace(
            /<div class='user-profile'>(.*?)<\/div>/gs,
            (match, inner) => `§UP[${this.compressInner(inner)}]§`
        );
        
        // Voting systems
        compressed = compressed.replace(
            /<div class='voting-system'>(.*?)<\/div>/gs,
            (match, inner) => `§VS[${this.compressInner(inner)}]§`
        );
        
        // Collaboration tools
        compressed = compressed.replace(
            /<div class='collab-tools'>(.*?)<\/div>/gs,
            (match, inner) => `§CLT[${this.compressInner(inner)}]§`
        );
        
        return compressed;
    }
    
    applyFinalCompaction(content) {
        console.log('  🗜️  Applying final compaction...');
        
        let compacted = content;
        
        // Compress repeated patterns
        compacted = this.compressRepeatedPatterns(compacted);
        
        // Apply frequency-based compression
        compacted = this.applyFrequencyCompression(compacted);
        
        // Apply character-level optimizations
        compacted = this.applyCharacterOptimizations(compacted);
        
        return compacted;
    }
    
    compressRepeatedPatterns(content) {
        const patterns = new Map();
        const minPatternLength = 10;
        const minOccurrences = 3;
        
        // Find repeated patterns
        for (let i = 0; i <= content.length - minPatternLength; i++) {
            for (let j = minPatternLength; j <= Math.min(50, content.length - i); j++) {
                const pattern = content.substring(i, i + j);
                patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
            }
        }
        
        // Replace frequent patterns with tokens
        let compressed = content;
        let tokenIndex = 1000;
        
        for (const [pattern, count] of patterns) {
            if (count >= minOccurrences && pattern.length >= minPatternLength) {
                const token = `§R${tokenIndex}§`;
                compressed = compressed.replace(new RegExp(this.escapeRegex(pattern), 'g'), token);
                this.reverseDictionary.set(`R${tokenIndex}`, pattern);
                tokenIndex++;
            }
        }
        
        return compressed;
    }
    
    applyFrequencyCompression(content) {
        // Analyze character frequency and replace common sequences
        const sequences = new Map();
        
        // Find 2-3 character sequences
        for (let i = 0; i <= content.length - 2; i++) {
            const seq2 = content.substring(i, i + 2);
            const seq3 = content.substring(i, i + 3);
            
            sequences.set(seq2, (sequences.get(seq2) || 0) + 1);
            if (seq3.length === 3) {
                sequences.set(seq3, (sequences.get(seq3) || 0) + 1);
            }
        }
        
        // Replace most frequent sequences
        let compressed = content;
        let tokenIndex = 2000;
        
        const sortedSequences = Array.from(sequences.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50); // Top 50 sequences
        
        for (const [sequence, count] of sortedSequences) {
            if (count > 5 && !sequence.includes('§')) {
                const token = `§F${tokenIndex}§`;
                compressed = compressed.replace(new RegExp(this.escapeRegex(sequence), 'g'), token);
                this.reverseDictionary.set(`F${tokenIndex}`, sequence);
                tokenIndex++;
            }
        }
        
        return compressed;
    }
    
    applyCharacterOptimizations(content) {
        let optimized = content;
        
        // Replace common character combinations
        const charOptimizations = [
            [' class=', '§CLS§'],
            [' style=', '§STY§'],
            [' data-', '§DAT§'],
            ['</div>', '§EDV§'],
            ['<div>', '§BDV§'],
            ['px', '§PX§'],
            ['%', '§PCT§'],
            ['rgba(', '§RGA§'],
            ['rgb(', '§RGB§'],
            ['#fff', '§WHT§'],
            ['#000', '§BLK§']
        ];
        
        charOptimizations.forEach(([pattern, token]) => {
            optimized = optimized.replace(new RegExp(this.escapeRegex(pattern), 'g'), token);
            this.reverseDictionary.set(token.slice(1, -1), pattern);
        });
        
        return optimized;
    }
    
    generateCompressionMetadata(original, compacted, options) {
        const metadata = {
            version: '1.0.0',
            compactionEngine: 'HTML/Token Compaction Engine',
            timestamp: new Date().toISOString(),
            options,
            
            // Compression statistics
            originalLength: original.length,
            compactedLength: compacted.length,
            compressionRatio: compacted.length / original.length,
            
            // Token statistics
            totalTokens: (compacted.match(/§[^§]+§/g) || []).length,
            uniqueTokens: new Set((compacted.match(/§([^§]+)§/g) || []).map(m => m.slice(1, -1))).size,
            
            // Dictionary sizes
            basicTokens: this.tokenDictionary.size,
            entertainmentTokens: this.entertainmentTokens.size,
            communityTokens: this.communityPatterns.size,
            
            // Content analysis
            hasEntertainmentContent: this.hasEntertainmentContent(original),
            hasCommunityFeatures: this.hasCommunityFeatures(original),
            estimatedDecompressionTime: this.estimateDecompressionTime(compacted),
            
            // Quality metrics
            compressionEfficiency: this.calculateCompressionEfficiency(original, compacted),
            tokenEfficiency: this.calculateTokenEfficiency(compacted)
        };
        
        return metadata;
    }
    
    createCompactedPackage(compacted, metadata) {
        // Create final package with header and compacted content
        const header = {
            format: 'HTML_TOKEN_COMPACTED',
            version: '1.0.0',
            metadata,
            decompression: {
                engine: 'HTMLTokenCompactionEngine',
                reverseDictionary: Object.fromEntries(this.reverseDictionary),
                instructions: 'Use reverseDictionary to replace tokens back to original content'
            }
        };
        
        const packageContent = [
            '<!-- HTML TOKEN COMPACTED PACKAGE -->',
            '<!-- ================================= -->',
            '<script type="application/compaction-header">',
            JSON.stringify(header, null, 2),
            '</script>',
            '<!-- COMPACTED CONTENT BELOW -->',
            compacted,
            '<!-- END COMPACTED PACKAGE -->'
        ].join('\n');
        
        return packageContent;
    }
    
    async decompactContent(compactedPackage) {
        console.log('\n📦 Decompacting HTML content...');
        
        try {
            // Extract header
            const headerMatch = compactedPackage.match(/<script type="application\/compaction-header">(.*?)<\/script>/s);
            if (!headerMatch) {
                throw new Error('Compaction header not found');
            }
            
            const header = JSON.parse(headerMatch[1]);
            const reverseDictionary = new Map(Object.entries(header.decompression.reverseDictionary));
            
            // Extract compacted content
            const contentMatch = compactedPackage.match(/<!-- COMPACTED CONTENT BELOW -->\s*(.*?)\s*<!-- END COMPACTED PACKAGE -->/s);
            if (!contentMatch) {
                throw new Error('Compacted content not found');
            }
            
            let decompacted = contentMatch[1].trim();
            
            // Apply reverse tokenization
            for (const [token, original] of reverseDictionary) {
                decompacted = decompacted.replace(new RegExp(`§${this.escapeRegex(token)}§`, 'g'), original);
            }
            
            console.log(`✅ Decompaction complete:`);
            console.log(`  📏 Decompacted size: ${decompacted.length} bytes`);
            console.log(`  🔧 Tokens replaced: ${reverseDictionary.size}`);
            
            return {
                decompacted,
                header,
                metadata: header.metadata
            };
            
        } catch (error) {
            console.error('❌ Decompaction failed:', error);
            throw error;
        }
    }
    
    // Utility methods
    compressInner(inner) {
        // Quick compression for inner content
        return inner
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            .trim();
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    hasEntertainmentContent(content) {
        const entertainmentKeywords = ['music', 'video', 'game', 'art', 'creative', 'viral', 'entertainment'];
        const contentLower = content.toLowerCase();
        return entertainmentKeywords.some(keyword => contentLower.includes(keyword));
    }
    
    hasCommunityFeatures(content) {
        const communityKeywords = ['comment', 'vote', 'share', 'follow', 'like', 'community', 'collaborate'];
        const contentLower = content.toLowerCase();
        return communityKeywords.some(keyword => contentLower.includes(keyword));
    }
    
    estimateDecompressionTime(compacted) {
        // Estimate decompression time based on content size and token count
        const tokenCount = (compacted.match(/§[^§]+§/g) || []).length;
        const baseTime = compacted.length * 0.001; // 1ms per 1000 chars
        const tokenTime = tokenCount * 0.1; // 0.1ms per token
        return Math.round(baseTime + tokenTime);
    }
    
    calculateCompressionEfficiency(original, compacted) {
        const ratio = compacted.length / original.length;
        if (ratio < 0.3) return 'excellent';
        if (ratio < 0.5) return 'very_good';
        if (ratio < 0.7) return 'good';
        if (ratio < 0.9) return 'fair';
        return 'poor';
    }
    
    calculateTokenEfficiency(compacted) {
        const totalChars = compacted.length;
        const tokenChars = (compacted.match(/§[^§]+§/g) || []).join('').length;
        return 1 - (tokenChars / totalChars);
    }
    
    // Batch processing methods
    async compactDirectory(directoryPath, options = {}) {
        console.log(`\n📁 Compacting directory: ${directoryPath}`);
        
        const results = [];
        
        try {
            const entries = await fs.readdir(directoryPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(directoryPath, entry.name);
                
                if (entry.isFile() && this.isHTMLFile(entry.name)) {
                    try {
                        const content = await fs.readFile(fullPath, 'utf8');
                        const result = await this.compactHTMLContent(content, options);
                        
                        // Save compacted version
                        const compactedPath = fullPath.replace(/\.html?$/i, '.compacted.html');
                        await fs.writeFile(compactedPath, result.compacted);
                        
                        results.push({
                            originalFile: fullPath,
                            compactedFile: compactedPath,
                            ...result.metadata
                        });
                        
                        console.log(`✅ ${entry.name}: ${(result.metadata.compressionRatio * 100).toFixed(1)}% compression`);
                        
                    } catch (error) {
                        console.error(`⚠️  Skipped ${entry.name}:`, error.message);
                    }
                } else if (entry.isDirectory() && options.recursive) {
                    const subResults = await this.compactDirectory(fullPath, options);
                    results.push(...subResults);
                }
            }
            
            return results;
            
        } catch (error) {
            console.error(`❌ Failed to compact directory ${directoryPath}:`, error);
            throw error;
        }
    }
    
    isHTMLFile(filename) {
        return /\.(html?|htm)$/i.test(filename);
    }
    
    async generateCompressionReport(results) {
        const report = {
            totalFiles: results.length,
            totalOriginalSize: results.reduce((sum, r) => sum + r.originalSize, 0),
            totalCompactedSize: results.reduce((sum, r) => sum + r.compactedSize, 0),
            averageCompressionRatio: results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length,
            bestCompression: results.reduce((best, r) => r.compressionRatio < best.compressionRatio ? r : best),
            worstCompression: results.reduce((worst, r) => r.compressionRatio > worst.compressionRatio ? r : worst),
            totalSpaceSaved: results.reduce((sum, r) => sum + r.spaceSaved, 0),
            entertainmentFiles: results.filter(r => r.hasEntertainmentContent).length,
            communityFiles: results.filter(r => r.hasCommunityFeatures).length
        };
        
        report.overallCompressionRatio = report.totalCompactedSize / report.totalOriginalSize;
        
        return report;
    }
}

// CLI execution
if (require.main === module) {
    console.log('📦 HTML/TOKEN COMPACTION ENGINE');
    console.log('================================');
    
    const engine = new HTMLTokenCompactionEngine();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('\n🎭 Demo: Compacting sample HTML content...\n');
        
        // Create demo HTML content
        const demoHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Underground Entertainment Hub</title>
    <style>
        .music-player { background: #000; color: #fff; padding: 20px; }
        .video-container { width: 100%; height: 400px; background: #333; }
        .community-section { margin: 20px; padding: 15px; }
        .comment-thread { border: 1px solid #ccc; margin: 10px; }
        .user-profile { display: flex; align-items: center; }
        .voting-system { text-align: center; margin: 10px; }
    </style>
</head>
<body>
    <div class="entertainment-hub">
        <div class="music-player">
            <h2>Underground Music Mix</h2>
            <p>The latest viral tracks from the underground scene</p>
            <button>Play</button>
            <button>Share</button>
            <button>Favorite</button>
        </div>
        
        <div class="video-container">
            <h2>Creative Video Content</h2>
            <p>Amazing viral video content that will break the internet</p>
            <div class="video-controls">
                <button>Play</button>
                <button>Like</button>
                <button>Comment</button>
                <button>Subscribe</button>
            </div>
        </div>
        
        <div class="community-section">
            <h2>Community Collaboration</h2>
            <div class="comment-thread">
                <div class="user-profile">
                    <img src="avatar.jpg" alt="User Avatar">
                    <span>Underground Creator</span>
                </div>
                <p>This is awesome content! Can't wait to collaborate on this.</p>
                <div class="voting-system">
                    <button>Upvote</button>
                    <button>Downvote</button>
                </div>
            </div>
        </div>
        
        <div class="social-embed">
            <h3>Share this content</h3>
            <button>Share on Social Media</button>
            <button>Copy Link</button>
        </div>
    </div>
    
    <script>
        function initializeEntertainmentHub() {
            const musicPlayer = document.querySelector('.music-player');
            const videoContainer = document.querySelector('.video-container');
            
            // Initialize music player
            musicPlayer.addEventListener('click', function(event) {
                if (event.target.tagName === 'BUTTON') {
                    console.log('Music action:', event.target.textContent);
                }
            });
            
            // Initialize video container
            videoContainer.addEventListener('click', function(event) {
                if (event.target.tagName === 'BUTTON') {
                    console.log('Video action:', event.target.textContent);
                }
            });
        }
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initializeEntertainmentHub);
    </script>
</body>
</html>`;
        
        // Compact the demo HTML
        engine.compactHTMLContent(demoHTML, {
            entertainmentOptimized: true,
            communityOptimized: true
        }).then(result => {
            console.log('\n🎉 Demo compaction complete!');
            console.log(`📏 Original: ${result.metadata.originalSize} bytes`);
            console.log(`📦 Compacted: ${result.metadata.compactedSize} bytes`);
            console.log(`🗜️  Compression: ${(result.metadata.compressionRatio * 100).toFixed(1)}%`);
            console.log(`💾 Space saved: ${result.metadata.spaceSaved} bytes`);
            console.log(`🏷️  Total tokens: ${result.metadata.totalTokens}`);
            console.log(`🎭 Entertainment optimized: ${result.metadata.hasEntertainmentContent ? 'YES' : 'NO'}`);
            console.log(`🤝 Community optimized: ${result.metadata.hasCommunityFeatures ? 'YES' : 'NO'}`);
            
            // Save demo files
            fs.writeFile('demo-original.html', demoHTML);
            fs.writeFile('demo-compacted.html', result.compacted);
            
            console.log('\n📋 Integration ready for:');
            console.log('  • Portfolio encryption system');
            console.log('  • ASCII+SOL file storage');
            console.log('  • Community-driven development');
            console.log('  • Entertainment content optimization');
            console.log('  • Token-based content delivery');
            
        }).catch(console.error);
        
    } else if (args[0] === 'compact' && args[1]) {
        // Compact specific file
        fs.readFile(args[1], 'utf8')
            .then(content => engine.compactHTMLContent(content, {
                entertainmentOptimized: args.includes('--entertainment'),
                communityOptimized: args.includes('--community')
            }))
            .then(result => {
                const outputFile = args[1].replace(/\.html?$/i, '.compacted.html');
                return fs.writeFile(outputFile, result.compacted).then(() => {
                    console.log(`✅ File compacted: ${outputFile}`);
                    console.log(`🗜️  Compression: ${(result.metadata.compressionRatio * 100).toFixed(1)}%`);
                });
            })
            .catch(console.error);
            
    } else if (args[0] === 'decompact' && args[1]) {
        // Decompact specific file
        fs.readFile(args[1], 'utf8')
            .then(content => engine.decompactContent(content))
            .then(result => {
                const outputFile = args[1].replace('.compacted.html', '.decompacted.html');
                return fs.writeFile(outputFile, result.decompacted).then(() => {
                    console.log(`✅ File decompacted: ${outputFile}`);
                    console.log(`📏 Size: ${result.decompacted.length} bytes`);
                });
            })
            .catch(console.error);
            
    } else if (args[0] === 'directory' && args[1]) {
        // Compact entire directory
        engine.compactDirectory(args[1], {
            recursive: args.includes('--recursive'),
            entertainmentOptimized: args.includes('--entertainment'),
            communityOptimized: args.includes('--community')
        }).then(results => {
            return engine.generateCompressionReport(results);
        }).then(report => {
            console.log('\n📊 Compression Report:');
            console.log(`  📁 Files processed: ${report.totalFiles}`);
            console.log(`  📏 Total original size: ${report.totalOriginalSize} bytes`);
            console.log(`  📦 Total compacted size: ${report.totalCompactedSize} bytes`);
            console.log(`  🗜️  Overall compression: ${(report.overallCompressionRatio * 100).toFixed(1)}%`);
            console.log(`  💾 Total space saved: ${report.totalSpaceSaved} bytes`);
            console.log(`  🎭 Entertainment files: ${report.entertainmentFiles}`);
            console.log(`  🤝 Community files: ${report.communityFiles}`);
        }).catch(console.error);
        
    } else {
        console.log('\nUsage:');
        console.log('  node html-token-compaction-engine.js                          # Demo');
        console.log('  node html-token-compaction-engine.js compact <file>           # Compact file');
        console.log('  node html-token-compaction-engine.js decompact <file>         # Decompact file');
        console.log('  node html-token-compaction-engine.js directory <path>         # Compact directory');
        console.log('\nOptions:');
        console.log('  --entertainment     Enable entertainment-specific optimizations');
        console.log('  --community         Enable community-driven optimizations');
        console.log('  --recursive         Process directories recursively');
    }
}

module.exports = HTMLTokenCompactionEngine;
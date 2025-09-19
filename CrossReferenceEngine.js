#!/usr/bin/env node

/**
 * Cross Reference Engine
 * 
 * Connects related content across the 7,137 business ideas and files
 * Builds knowledge graphs and finds hidden relationships
 * 
 * "tons of fucking files to use and ideas and brand names and other shit but its not sorted properly"
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const natural = require('natural');

class CrossReferenceEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Similarity thresholds
            titleSimilarityThreshold: config.titleSimilarityThreshold || 0.7,
            contentSimilarityThreshold: config.contentSimilarityThreshold || 0.6,
            tagOverlapThreshold: config.tagOverlapThreshold || 0.5,
            
            // Relationship types
            enableBidirectional: config.enableBidirectional !== false,
            maxRelationshipsPerItem: config.maxRelationshipsPerItem || 10,
            
            // Performance
            batchSize: config.batchSize || 100,
            enableCaching: config.enableCaching !== false,
            
            // Analysis depth
            enableSemanticAnalysis: config.enableSemanticAnalysis !== false,
            enableTemporalAnalysis: config.enableTemporalAnalysis !== false,
            enableClusterAnalysis: config.enableClusterAnalysis !== false
        };
        
        // NLP tools
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
        this.metaphone = natural.Metaphone;
        this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        
        // Knowledge graph
        this.knowledgeGraph = {
            nodes: new Map(), // id -> node data
            edges: new Map(), // id -> Set of related ids
            clusters: new Map(), // clusterId -> Set of node ids
            metadata: {
                totalNodes: 0,
                totalEdges: 0,
                averageDegree: 0,
                clusters: 0
            }
        };
        
        // Relationship types
        this.relationshipTypes = {
            DUPLICATE: { weight: 1.0, description: 'Exact or near duplicate' },
            VARIANT: { weight: 0.9, description: 'Variation of same idea' },
            SIMILAR: { weight: 0.8, description: 'Similar concept or approach' },
            RELATED: { weight: 0.7, description: 'Related topic or domain' },
            COMPLEMENT: { weight: 0.6, description: 'Complementary ideas' },
            PREREQUISITE: { weight: 0.5, description: 'One requires the other' },
            INSPIRED_BY: { weight: 0.4, description: 'One inspired by the other' },
            MENTIONS: { weight: 0.3, description: 'One mentions the other' }
        };
        
        // Analysis cache
        this.analysisCache = new Map();
        
        console.log('🔗 Cross Reference Engine initialized');
        console.log('🧠 Ready to find hidden connections in your chaos');
    }
    
    /**
     * Build knowledge graph from files
     */
    async buildKnowledgeGraph(files) {
        console.log(`🏗️ Building knowledge graph from ${files.length} files...`);
        
        const startTime = Date.now();
        
        // Step 1: Create nodes
        for (const file of files) {
            await this.addNode(file);
        }
        
        // Step 2: Find relationships
        await this.findAllRelationships();
        
        // Step 3: Detect clusters
        if (this.config.enableClusterAnalysis) {
            await this.detectClusters();
        }
        
        // Step 4: Calculate graph metrics
        this.calculateGraphMetrics();
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ Knowledge graph built in ${(duration / 1000).toFixed(2)}s`);
        console.log(`📊 ${this.knowledgeGraph.metadata.totalNodes} nodes, ${this.knowledgeGraph.metadata.totalEdges} edges`);
        
        this.emit('graph:built', this.knowledgeGraph.metadata);
        
        return this.knowledgeGraph;
    }
    
    /**
     * Add node to knowledge graph
     */
    async addNode(file) {
        const nodeId = file.id || crypto.randomUUID();
        
        // Extract features for similarity analysis
        const features = await this.extractFeatures(file);
        
        const node = {
            id: nodeId,
            name: file.name,
            category: file.category,
            subcategory: file.subcategory,
            features,
            metadata: file.metadata || {},
            created: file.createdTime || new Date(),
            modified: file.modifiedTime || new Date(),
            qualityScore: file.qualityScore || 0,
            hogwartsHouse: file.hogwartsHouse
        };
        
        this.knowledgeGraph.nodes.set(nodeId, node);
        this.knowledgeGraph.edges.set(nodeId, new Set());
        
        return node;
    }
    
    /**
     * Find all relationships between nodes
     */
    async findAllRelationships() {
        console.log('🔍 Finding relationships between files...');
        
        const nodes = Array.from(this.knowledgeGraph.nodes.values());
        const totalComparisons = (nodes.length * (nodes.length - 1)) / 2;
        let comparisons = 0;
        
        // Compare each pair of nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const relationship = await this.analyzeRelationship(nodes[i], nodes[j]);
                
                if (relationship) {
                    this.addEdge(nodes[i].id, nodes[j].id, relationship);
                }
                
                comparisons++;
                
                // Emit progress
                if (comparisons % 1000 === 0) {
                    this.emit('analysis:progress', {
                        current: comparisons,
                        total: totalComparisons,
                        percentage: (comparisons / totalComparisons) * 100
                    });
                }
            }
        }
    }
    
    /**
     * Analyze relationship between two nodes
     */
    async analyzeRelationship(node1, node2) {
        // Check cache
        const cacheKey = `${node1.id}_${node2.id}`;
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }
        
        // Calculate various similarity scores
        const titleSimilarity = this.calculateTitleSimilarity(node1, node2);
        const tagSimilarity = this.calculateTagSimilarity(node1, node2);
        const categorySimilarity = this.calculateCategorySimilarity(node1, node2);
        const temporalProximity = this.calculateTemporalProximity(node1, node2);
        
        // Semantic similarity (if content available)
        const semanticSimilarity = await this.calculateSemanticSimilarity(node1, node2);
        
        // Determine relationship type based on scores
        let relationshipType = null;
        let confidence = 0;
        
        // Check for duplicates
        if (titleSimilarity > 0.95 || semanticSimilarity > 0.95) {
            relationshipType = 'DUPLICATE';
            confidence = Math.max(titleSimilarity, semanticSimilarity);
        }
        // Check for variants
        else if (titleSimilarity > 0.8 && tagSimilarity > 0.7) {
            relationshipType = 'VARIANT';
            confidence = (titleSimilarity + tagSimilarity) / 2;
        }
        // Check for similar ideas
        else if (semanticSimilarity > this.config.contentSimilarityThreshold) {
            relationshipType = 'SIMILAR';
            confidence = semanticSimilarity;
        }
        // Check for related topics
        else if (categorySimilarity > 0.5 && tagSimilarity > this.config.tagOverlapThreshold) {
            relationshipType = 'RELATED';
            confidence = (categorySimilarity + tagSimilarity) / 2;
        }
        // Check for temporal relationships
        else if (temporalProximity > 0.8 && categorySimilarity > 0.3) {
            relationshipType = 'INSPIRED_BY';
            confidence = temporalProximity * 0.7 + categorySimilarity * 0.3;
        }
        
        // Only create relationship if confidence meets threshold
        if (relationshipType && confidence > 0.5) {
            const relationship = {
                type: relationshipType,
                confidence,
                scores: {
                    title: titleSimilarity,
                    tags: tagSimilarity,
                    category: categorySimilarity,
                    semantic: semanticSimilarity,
                    temporal: temporalProximity
                },
                discovered: new Date()
            };
            
            // Cache result
            this.analysisCache.set(cacheKey, relationship);
            
            return relationship;
        }
        
        // Cache null result too
        this.analysisCache.set(cacheKey, null);
        return null;
    }
    
    /**
     * Extract features for similarity analysis
     */
    async extractFeatures(file) {
        const features = {
            // Title features
            titleTokens: this.tokenizer.tokenize((file.name || '').toLowerCase()),
            titleMetaphone: this.metaphone.process(file.name || ''),
            
            // Tag features
            tags: file.metadata?.tags || [],
            tagSet: new Set(file.metadata?.tags || []),
            
            // Category features
            category: file.category,
            subcategory: file.subcategory,
            
            // Content features (if available)
            contentTokens: [],
            keywords: file.metadata?.keywords || [],
            
            // Temporal features
            created: new Date(file.created || file.createdTime),
            modified: new Date(file.modified || file.modifiedTime)
        };
        
        // Extract content tokens if content available
        if (file.content) {
            features.contentTokens = this.tokenizer.tokenize(file.content.toLowerCase()).slice(0, 100);
        }
        
        return features;
    }
    
    /**
     * Calculate title similarity
     */
    calculateTitleSimilarity(node1, node2) {
        const tokens1 = node1.features.titleTokens;
        const tokens2 = node2.features.titleTokens;
        
        if (!tokens1.length || !tokens2.length) return 0;
        
        // Jaccard similarity
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        const jaccard = intersection.size / union.size;
        
        // Phonetic similarity
        const phonetic = node1.features.titleMetaphone === node2.features.titleMetaphone ? 1 : 0;
        
        return jaccard * 0.7 + phonetic * 0.3;
    }
    
    /**
     * Calculate tag similarity
     */
    calculateTagSimilarity(node1, node2) {
        const tags1 = node1.features.tagSet;
        const tags2 = node2.features.tagSet;
        
        if (!tags1.size || !tags2.size) return 0;
        
        const intersection = new Set([...tags1].filter(x => tags2.has(x)));
        const union = new Set([...tags1, ...tags2]);
        
        return intersection.size / union.size;
    }
    
    /**
     * Calculate category similarity
     */
    calculateCategorySimilarity(node1, node2) {
        let score = 0;
        
        // Same category
        if (node1.features.category === node2.features.category) {
            score += 0.5;
        }
        
        // Same subcategory
        if (node1.features.subcategory === node2.features.subcategory) {
            score += 0.5;
        }
        
        return score;
    }
    
    /**
     * Calculate temporal proximity
     */
    calculateTemporalProximity(node1, node2) {
        const date1 = node1.features.created;
        const date2 = node2.features.created;
        
        const diffHours = Math.abs(date1 - date2) / (1000 * 60 * 60);
        
        // Ideas created within same day: high proximity
        if (diffHours < 24) return 1.0;
        // Within same week
        if (diffHours < 168) return 0.8;
        // Within same month
        if (diffHours < 720) return 0.6;
        // Within same quarter
        if (diffHours < 2160) return 0.4;
        
        return 0.2;
    }
    
    /**
     * Calculate semantic similarity
     */
    async calculateSemanticSimilarity(node1, node2) {
        if (!this.config.enableSemanticAnalysis) return 0;
        
        const content1 = node1.features.contentTokens.join(' ');
        const content2 = node2.features.contentTokens.join(' ');
        
        if (!content1 || !content2) return 0;
        
        // Add documents to TF-IDF
        this.tfidf.addDocument(content1);
        this.tfidf.addDocument(content2);
        
        // Calculate cosine similarity
        const vector1 = [];
        const vector2 = [];
        const terms = new Set([...node1.features.contentTokens, ...node2.features.contentTokens]);
        
        terms.forEach(term => {
            vector1.push(this.tfidf.tfidf(term, 0));
            vector2.push(this.tfidf.tfidf(term, 1));
        });
        
        const similarity = this.cosineSimilarity(vector1, vector2);
        
        // Clean up TF-IDF
        this.tfidf = new natural.TfIdf();
        
        return similarity;
    }
    
    /**
     * Calculate cosine similarity between vectors
     */
    cosineSimilarity(vec1, vec2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    
    /**
     * Add edge to knowledge graph
     */
    addEdge(nodeId1, nodeId2, relationship) {
        // Add bidirectional edge
        this.knowledgeGraph.edges.get(nodeId1).add({
            targetId: nodeId2,
            ...relationship
        });
        
        if (this.config.enableBidirectional) {
            this.knowledgeGraph.edges.get(nodeId2).add({
                targetId: nodeId1,
                ...relationship
            });
        }
        
        this.knowledgeGraph.metadata.totalEdges++;
    }
    
    /**
     * Detect clusters in the graph
     */
    async detectClusters() {
        console.log('🎯 Detecting clusters...');
        
        // Simple connected components clustering
        const visited = new Set();
        let clusterId = 0;
        
        for (const nodeId of this.knowledgeGraph.nodes.keys()) {
            if (!visited.has(nodeId)) {
                const cluster = new Set();
                this.dfs(nodeId, visited, cluster);
                
                if (cluster.size > 1) {
                    this.knowledgeGraph.clusters.set(clusterId++, cluster);
                }
            }
        }
        
        console.log(`📊 Found ${this.knowledgeGraph.clusters.size} clusters`);
    }
    
    /**
     * Depth-first search for clustering
     */
    dfs(nodeId, visited, cluster) {
        visited.add(nodeId);
        cluster.add(nodeId);
        
        const edges = this.knowledgeGraph.edges.get(nodeId) || new Set();
        for (const edge of edges) {
            if (!visited.has(edge.targetId)) {
                this.dfs(edge.targetId, visited, cluster);
            }
        }
    }
    
    /**
     * Calculate graph metrics
     */
    calculateGraphMetrics() {
        const metrics = this.knowledgeGraph.metadata;
        
        metrics.totalNodes = this.knowledgeGraph.nodes.size;
        metrics.clusters = this.knowledgeGraph.clusters.size;
        
        // Calculate average degree
        let totalDegree = 0;
        for (const edges of this.knowledgeGraph.edges.values()) {
            totalDegree += edges.size;
        }
        
        metrics.averageDegree = metrics.totalNodes > 0 ? 
            totalDegree / metrics.totalNodes : 0;
    }
    
    /**
     * Find related files for a given file
     */
    findRelatedFiles(fileId, limit = 10) {
        const edges = this.knowledgeGraph.edges.get(fileId) || new Set();
        
        // Sort by confidence
        const related = Array.from(edges)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit)
            .map(edge => ({
                file: this.knowledgeGraph.nodes.get(edge.targetId),
                relationship: edge
            }));
        
        return related;
    }
    
    /**
     * Find duplicates in the graph
     */
    findDuplicates() {
        const duplicates = [];
        
        for (const [nodeId, edges] of this.knowledgeGraph.edges.entries()) {
            for (const edge of edges) {
                if (edge.type === 'DUPLICATE' && edge.confidence > 0.9) {
                    duplicates.push({
                        file1: this.knowledgeGraph.nodes.get(nodeId),
                        file2: this.knowledgeGraph.nodes.get(edge.targetId),
                        confidence: edge.confidence
                    });
                }
            }
        }
        
        return duplicates;
    }
    
    /**
     * Get cluster information
     */
    getClusterInfo(clusterId) {
        const cluster = this.knowledgeGraph.clusters.get(clusterId);
        if (!cluster) return null;
        
        const nodes = Array.from(cluster).map(id => this.knowledgeGraph.nodes.get(id));
        
        // Find most connected node (hub)
        let hub = null;
        let maxConnections = 0;
        
        for (const nodeId of cluster) {
            const connections = this.knowledgeGraph.edges.get(nodeId).size;
            if (connections > maxConnections) {
                maxConnections = connections;
                hub = this.knowledgeGraph.nodes.get(nodeId);
            }
        }
        
        // Find common themes
        const categories = {};
        const tags = {};
        
        nodes.forEach(node => {
            categories[node.category] = (categories[node.category] || 0) + 1;
            node.features.tags.forEach(tag => {
                tags[tag] = (tags[tag] || 0) + 1;
            });
        });
        
        return {
            id: clusterId,
            size: cluster.size,
            nodes,
            hub,
            categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
            commonTags: Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10)
        };
    }
    
    /**
     * Export graph for visualization
     */
    exportForVisualization() {
        const nodes = Array.from(this.knowledgeGraph.nodes.values()).map(node => ({
            id: node.id,
            label: node.name,
            category: node.category,
            house: node.hogwartsHouse?.house,
            size: this.knowledgeGraph.edges.get(node.id).size
        }));
        
        const edges = [];
        for (const [sourceId, edgeSet] of this.knowledgeGraph.edges.entries()) {
            for (const edge of edgeSet) {
                edges.push({
                    source: sourceId,
                    target: edge.targetId,
                    weight: edge.confidence,
                    type: edge.type
                });
            }
        }
        
        return { nodes, edges };
    }
}

module.exports = { CrossReferenceEngine };

// Example usage
if (require.main === module) {
    async function demonstrateCrossReference() {
        console.log('\n🔗 CROSS REFERENCE ENGINE DEMONSTRATION\n');
        
        const engine = new CrossReferenceEngine({
            titleSimilarityThreshold: 0.7,
            enableSemanticAnalysis: true,
            enableClusterAnalysis: true
        });
        
        // Sample files representing some of the 7,137 ideas
        const sampleFiles = [
            {
                id: '1',
                name: 'AI-Code-Review-Platform.md',
                category: 'business_ideas',
                subcategory: 'saas',
                metadata: { tags: ['ai', 'code', 'review', 'platform'] }
            },
            {
                id: '2',
                name: 'AI-Powered-Code-Analysis.txt',
                category: 'business_ideas',
                subcategory: 'saas',
                metadata: { tags: ['ai', 'code', 'analysis'] }
            },
            {
                id: '3',
                name: 'Blockchain-Gaming-Marketplace.pdf',
                category: 'business_ideas',
                subcategory: 'gaming',
                metadata: { tags: ['blockchain', 'gaming', 'nft'] }
            },
            {
                id: '4',
                name: 'NFT-Gaming-Platform-v2.docx',
                category: 'business_ideas',
                subcategory: 'gaming',
                metadata: { tags: ['nft', 'gaming', 'blockchain'] }
            },
            {
                id: '5',
                name: 'CryptoVault-Brand-Name.txt',
                category: 'brand_names',
                subcategory: 'tech_brands',
                metadata: { tags: ['crypto', 'vault', 'brand'] }
            }
        ];
        
        // Build knowledge graph
        const graph = await engine.buildKnowledgeGraph(sampleFiles);
        
        console.log('\n📊 Knowledge Graph Summary:');
        console.log(`   Nodes: ${graph.metadata.totalNodes}`);
        console.log(`   Edges: ${graph.metadata.totalEdges}`);
        console.log(`   Clusters: ${graph.metadata.clusters}`);
        console.log(`   Avg Degree: ${graph.metadata.averageDegree.toFixed(2)}`);
        
        // Find duplicates
        const duplicates = engine.findDuplicates();
        console.log(`\n🔍 Found ${duplicates.length} potential duplicates`);
        duplicates.forEach(dup => {
            console.log(`   • "${dup.file1.name}" ↔ "${dup.file2.name}" (${(dup.confidence * 100).toFixed(1)}%)`);
        });
        
        // Show related files
        console.log('\n🔗 Related Files:');
        for (const file of sampleFiles.slice(0, 2)) {
            const related = engine.findRelatedFiles(file.id, 3);
            if (related.length > 0) {
                console.log(`\n   ${file.name}:`);
                related.forEach(rel => {
                    console.log(`      → ${rel.file.name} (${rel.relationship.type}, ${(rel.relationship.confidence * 100).toFixed(1)}%)`);
                });
            }
        }
        
        // Show clusters
        console.log('\n🎯 Clusters:');
        for (const [clusterId, cluster] of graph.clusters.entries()) {
            const info = engine.getClusterInfo(clusterId);
            console.log(`\n   Cluster ${clusterId}: ${info.size} files`);
            console.log(`   Hub: ${info.hub?.name}`);
            console.log(`   Common tags: ${info.commonTags.slice(0, 3).map(t => t[0]).join(', ')}`);
        }
        
        console.log('\n🔗 Cross Reference Features:');
        console.log('   • Finds duplicates and variants');
        console.log('   • Discovers related ideas');
        console.log('   • Builds knowledge graphs');
        console.log('   • Detects idea clusters');
        console.log('   • Tracks temporal relationships');
        console.log('   • Semantic similarity analysis');
        console.log('   • Export for visualization');
    }
    
    demonstrateCrossReference().catch(console.error);
}

console.log('🔗 CROSS REFERENCE ENGINE LOADED');
console.log('🧠 Ready to connect your scattered ideas!');
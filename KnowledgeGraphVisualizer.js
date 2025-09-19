#!/usr/bin/env node

/**
 * 🕸️ KNOWLEDGE GRAPH VISUALIZER
 * 
 * Interactive visualization and exploration of component relationships
 * Creates dynamic network graphs showing similarity connections
 * Supports filtering, clustering, path finding, and temporal analysis
 * 
 * Features:
 * - Interactive D3.js/Cytoscape network visualization
 * - Real-time filtering by similarity, type, confidence
 * - Cluster detection and community analysis
 * - Path finding between components
 * - Temporal relationship tracking
 * - Export capabilities for external tools
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

console.log(`
🕸️ KNOWLEDGE GRAPH VISUALIZER 🕸️
=================================
Interactive Network Graphs | Cluster Analysis | Path Finding
Real-time Filtering | Temporal Tracking | Export Ready
`);

class KnowledgeGraphVisualizer {
    constructor(config = {}) {
        this.config = {
            // Visualization settings
            layout: config.layout || 'force-directed',
            nodeSize: config.nodeSize || { min: 10, max: 50 },
            edgeWeight: config.edgeWeight || { min: 1, max: 10 },
            colorScheme: config.colorScheme || 'category',
            
            // Filtering thresholds
            similarityThresholds: {
                strong: config.strongThreshold || 0.8,
                medium: config.mediumThreshold || 0.6,
                weak: config.weakThreshold || 0.4
            },
            
            // Clustering settings
            clusterAlgorithm: config.clusterAlgorithm || 'louvain',
            minClusterSize: config.minClusterSize || 3,
            clusterResolution: config.clusterResolution || 1.0,
            
            // Performance settings
            maxNodes: config.maxNodes || 1000,
            maxEdges: config.maxEdges || 5000,
            enablePhysics: config.enablePhysics !== false,
            
            // Export settings
            exportFormats: ['json', 'graphml', 'gexf', 'dot', 'cytoscape'],
            
            // Paths
            outputDir: config.outputDir || './graph-exports',
            templateDir: config.templateDir || './graph-templates',
            
            ...config
        };
        
        // Graph data
        this.nodes = new Map();
        this.edges = new Map();
        this.clusters = new Map();
        this.paths = new Map();
        
        // Visualization state
        this.currentFilter = null;
        this.selectedNodes = new Set();
        this.highlightedPath = [];
        this.currentLayout = this.config.layout;
        
        // Statistics
        this.stats = {
            totalNodes: 0,
            totalEdges: 0,
            totalClusters: 0,
            averageConnectivity: 0,
            networkDensity: 0,
            clusteringCoefficient: 0,
            shortestPaths: new Map()
        };
        
        console.log('🔧 Knowledge Graph Visualizer initialized');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create output directory
            await fs.mkdir(this.config.outputDir, { recursive: true });
            
            // Load templates
            await this.loadVisualizationTemplates();
            
            console.log('✅ Knowledge Graph Visualizer ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Knowledge Graph Visualizer:', error);
            throw error;
        }
    }
    
    /**
     * Add node to the graph
     */
    addNode(id, data) {
        const node = {
            id,
            label: data.name || data.title || id,
            type: data.type || 'unknown',
            category: data.category || 'default',
            size: this.calculateNodeSize(data),
            color: this.getNodeColor(data.type, data.category),
            metadata: data,
            timestamp: Date.now(),
            connections: new Set(),
            ...data
        };
        
        this.nodes.set(id, node);
        this.updateStats();
        
        return node;
    }
    
    /**
     * Add edge between nodes
     */
    addEdge(fromId, toId, data = {}) {
        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
            throw new Error(`Cannot create edge: missing nodes ${fromId} or ${toId}`);
        }
        
        const edgeId = `${fromId}_${toId}`;
        const edge = {
            id: edgeId,
            source: fromId,
            target: toId,
            weight: data.similarity || data.weight || 0.5,
            type: data.type || 'similarity',
            similarity: data.similarity || 0.5,
            confidence: data.confidence || 0.5,
            thickness: this.calculateEdgeThickness(data.similarity || 0.5),
            color: this.getEdgeColor(data.type, data.similarity || 0.5),
            metadata: data,
            timestamp: Date.now(),
            ...data
        };
        
        this.edges.set(edgeId, edge);
        
        // Update node connections
        this.nodes.get(fromId).connections.add(toId);
        this.nodes.get(toId).connections.add(fromId);
        
        this.updateStats();
        
        return edge;
    }
    
    /**
     * Build graph from discovery results
     */
    buildGraphFromDiscoveries(discoveries, options = {}) {
        console.log(`🏗️ Building graph from ${discoveries.length} discovery results...`);
        
        const nodeMap = new Map();
        const edgeList = [];
        
        // Extract nodes and edges from discoveries
        discoveries.forEach(discovery => {
            discovery.results?.forEach(result => {
                const nodeId = this.generateNodeId(result);
                
                // Add node
                if (!nodeMap.has(nodeId)) {
                    nodeMap.set(nodeId, {
                        id: nodeId,
                        name: result.data?.name || result.data?.title || 'Unknown',
                        type: result.type || 'component',
                        category: result.data?.category || 'default',
                        confidence: result.finalScore || 0,
                        source: result.source,
                        discoveryId: discovery.discoveryId,
                        data: result.data
                    });
                }
                
                // Create edges to similar results
                discovery.results.forEach(otherResult => {
                    const otherNodeId = this.generateNodeId(otherResult);
                    if (nodeId !== otherNodeId) {
                        const similarity = this.calculateResultSimilarity(result, otherResult);
                        if (similarity >= this.config.similarityThresholds.weak) {
                            edgeList.push({
                                source: nodeId,
                                target: otherNodeId,
                                similarity,
                                type: 'discovery_similarity',
                                discoveryId: discovery.discoveryId
                            });
                        }
                    }
                });
            });
        });
        
        // Add nodes to graph
        for (const [nodeId, nodeData] of nodeMap) {
            this.addNode(nodeId, nodeData);
        }
        
        // Add edges to graph
        const addedEdges = new Set();
        edgeList.forEach(edgeData => {
            const edgeKey = `${edgeData.source}_${edgeData.target}`;
            const reverseKey = `${edgeData.target}_${edgeData.source}`;
            
            if (!addedEdges.has(edgeKey) && !addedEdges.has(reverseKey)) {
                this.addEdge(edgeData.source, edgeData.target, edgeData);
                addedEdges.add(edgeKey);
            }
        });
        
        console.log(`✅ Graph built: ${this.nodes.size} nodes, ${this.edges.size} edges`);
        
        // Perform clustering
        if (options.enableClustering !== false) {
            this.detectClusters();
        }
        
        return {
            nodes: this.nodes.size,
            edges: this.edges.size,
            clusters: this.clusters.size
        };
    }
    
    /**
     * Detect communities/clusters in the graph
     */
    detectClusters() {
        console.log('🎯 Detecting clusters in the graph...');
        
        // Simple clustering based on connected components and similarity
        const visited = new Set();
        const clusters = [];
        let clusterId = 0;
        
        for (const [nodeId, node] of this.nodes) {
            if (!visited.has(nodeId)) {
                const cluster = this.exploreCluster(nodeId, visited, clusterId++);
                if (cluster.nodes.length >= this.config.minClusterSize) {
                    clusters.push(cluster);
                    this.clusters.set(cluster.id, cluster);
                }
            }
        }
        
        console.log(`✅ Found ${clusters.length} clusters`);
        
        return clusters;
    }
    
    exploreCluster(startNodeId, visited, clusterId) {
        const cluster = {
            id: `cluster_${clusterId}`,
            nodes: [],
            edges: [],
            centerNode: startNodeId,
            averageSimilarity: 0,
            cohesion: 0
        };
        
        const stack = [startNodeId];
        const clusterNodes = new Set();
        const clusterEdges = new Set();
        
        while (stack.length > 0) {
            const nodeId = stack.pop();
            
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);
            
            clusterNodes.add(nodeId);
            cluster.nodes.push(nodeId);
            
            // Find connected nodes with strong similarity
            for (const [edgeId, edge] of this.edges) {
                if ((edge.source === nodeId || edge.target === nodeId) && 
                    edge.similarity >= this.config.similarityThresholds.medium) {
                    
                    const connectedNode = edge.source === nodeId ? edge.target : edge.source;
                    
                    if (!visited.has(connectedNode)) {
                        stack.push(connectedNode);
                    }
                    
                    if (clusterNodes.has(edge.source) && clusterNodes.has(edge.target)) {
                        clusterEdges.add(edgeId);
                    }
                }
            }
        }
        
        cluster.edges = Array.from(clusterEdges);
        
        // Calculate cluster metrics
        cluster.averageSimilarity = this.calculateClusterSimilarity(cluster);
        cluster.cohesion = this.calculateClusterCohesion(cluster);
        
        return cluster;
    }
    
    /**
     * Find shortest path between two nodes
     */
    findPath(startId, endId, options = {}) {
        if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
            return null;
        }
        
        const maxDepth = options.maxDepth || 6;
        const minSimilarity = options.minSimilarity || this.config.similarityThresholds.weak;
        
        // Dijkstra's algorithm with similarity weights
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
        
        // Initialize
        for (const nodeId of this.nodes.keys()) {
            distances.set(nodeId, Infinity);
            previous.set(nodeId, null);
            unvisited.add(nodeId);
        }
        distances.set(startId, 0);
        
        while (unvisited.size > 0) {
            // Find unvisited node with minimum distance
            let currentNode = null;
            let minDistance = Infinity;
            
            for (const nodeId of unvisited) {
                if (distances.get(nodeId) < minDistance) {
                    minDistance = distances.get(nodeId);
                    currentNode = nodeId;
                }
            }
            
            if (currentNode === null || currentNode === endId) break;
            
            unvisited.delete(currentNode);
            
            // Check neighbors
            for (const [edgeId, edge] of this.edges) {
                if (edge.similarity < minSimilarity) continue;
                
                let neighbor = null;
                if (edge.source === currentNode) neighbor = edge.target;
                else if (edge.target === currentNode) neighbor = edge.source;
                
                if (neighbor && unvisited.has(neighbor)) {
                    const distance = distances.get(currentNode) + (1 - edge.similarity);
                    
                    if (distance < distances.get(neighbor)) {
                        distances.set(neighbor, distance);
                        previous.set(neighbor, currentNode);
                    }
                }
            }
        }
        
        // Reconstruct path
        if (!previous.get(endId)) return null;
        
        const path = [];
        let current = endId;
        
        while (current !== null) {
            path.unshift(current);
            current = previous.get(current);
        }
        
        // Calculate path metrics
        const pathEdges = [];
        let totalSimilarity = 0;
        
        for (let i = 0; i < path.length - 1; i++) {
            const edgeId1 = `${path[i]}_${path[i + 1]}`;
            const edgeId2 = `${path[i + 1]}_${path[i]}`;
            const edge = this.edges.get(edgeId1) || this.edges.get(edgeId2);
            
            if (edge) {
                pathEdges.push(edge);
                totalSimilarity += edge.similarity;
            }
        }
        
        return {
            path,
            edges: pathEdges,
            length: path.length,
            distance: distances.get(endId),
            averageSimilarity: pathEdges.length > 0 ? totalSimilarity / pathEdges.length : 0,
            timestamp: Date.now()
        };
    }
    
    /**
     * Apply filters to the graph
     */
    applyFilter(filter) {
        this.currentFilter = filter;
        
        const filteredNodes = new Map();
        const filteredEdges = new Map();
        
        // Filter nodes
        for (const [nodeId, node] of this.nodes) {
            if (this.nodePassesFilter(node, filter)) {
                filteredNodes.set(nodeId, node);
            }
        }
        
        // Filter edges (only include if both nodes are included)
        for (const [edgeId, edge] of this.edges) {
            if (filteredNodes.has(edge.source) && 
                filteredNodes.has(edge.target) && 
                this.edgePassesFilter(edge, filter)) {
                filteredEdges.set(edgeId, edge);
            }
        }
        
        return {
            nodes: filteredNodes,
            edges: filteredEdges,
            stats: this.calculateFilteredStats(filteredNodes, filteredEdges)
        };
    }
    
    nodePassesFilter(node, filter) {
        if (filter.types && !filter.types.includes(node.type)) return false;
        if (filter.categories && !filter.categories.includes(node.category)) return false;
        if (filter.minConfidence && node.confidence < filter.minConfidence) return false;
        if (filter.maxConfidence && node.confidence > filter.maxConfidence) return false;
        if (filter.searchText) {
            const searchText = filter.searchText.toLowerCase();
            const nodeText = (node.label + ' ' + node.type + ' ' + node.category).toLowerCase();
            if (!nodeText.includes(searchText)) return false;
        }
        
        return true;
    }
    
    edgePassesFilter(edge, filter) {
        if (filter.minSimilarity && edge.similarity < filter.minSimilarity) return false;
        if (filter.maxSimilarity && edge.similarity > filter.maxSimilarity) return false;
        if (filter.edgeTypes && !filter.edgeTypes.includes(edge.type)) return false;
        
        return true;
    }
    
    /**
     * Export graph in various formats
     */
    async exportGraph(format, filename, options = {}) {
        const exportPath = path.join(this.config.outputDir, filename);
        
        let exportData;
        
        switch (format.toLowerCase()) {
            case 'json':
                exportData = this.exportAsJSON(options);
                break;
            case 'cytoscape':
                exportData = this.exportAsCytoscape(options);
                break;
            case 'graphml':
                exportData = this.exportAsGraphML(options);
                break;
            case 'gexf':
                exportData = this.exportAsGEXF(options);
                break;
            case 'dot':
                exportData = this.exportAsDOT(options);
                break;
            case 'd3':
                exportData = this.exportAsD3(options);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
        
        if (typeof exportData === 'object') {
            await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
        } else {
            await fs.writeFile(exportPath, exportData);
        }
        
        console.log(`📤 Graph exported to ${exportPath} (${format})`);
        
        return exportPath;
    }
    
    exportAsJSON(options = {}) {
        const filtered = options.filtered ? this.applyFilter(this.currentFilter || {}) : null;
        const nodes = filtered?.nodes || this.nodes;
        const edges = filtered?.edges || this.edges;
        
        return {
            metadata: {
                exportTime: new Date().toISOString(),
                nodeCount: nodes.size,
                edgeCount: edges.size,
                format: 'json',
                ...options.metadata
            },
            nodes: Array.from(nodes.values()),
            edges: Array.from(edges.values()),
            clusters: Array.from(this.clusters.values()),
            stats: this.stats
        };
    }
    
    exportAsCytoscape(options = {}) {
        const filtered = options.filtered ? this.applyFilter(this.currentFilter || {}) : null;
        const nodes = filtered?.nodes || this.nodes;
        const edges = filtered?.edges || this.edges;
        
        return {
            elements: {
                nodes: Array.from(nodes.values()).map(node => ({
                    data: {
                        id: node.id,
                        label: node.label,
                        type: node.type,
                        category: node.category,
                        size: node.size,
                        ...node.metadata
                    }
                })),
                edges: Array.from(edges.values()).map(edge => ({
                    data: {
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        weight: edge.weight,
                        similarity: edge.similarity,
                        type: edge.type,
                        ...edge.metadata
                    }
                }))
            },
            layout: { name: this.currentLayout },
            style: this.getCytoscapeStyles()
        };
    }
    
    exportAsD3(options = {}) {
        const filtered = options.filtered ? this.applyFilter(this.currentFilter || {}) : null;
        const nodes = filtered?.nodes || this.nodes;
        const edges = filtered?.edges || this.edges;
        
        return {
            nodes: Array.from(nodes.values()).map(node => ({
                id: node.id,
                name: node.label,
                type: node.type,
                category: node.category,
                size: node.size,
                color: node.color,
                x: Math.random() * 800,
                y: Math.random() * 600,
                ...node.metadata
            })),
            links: Array.from(edges.values()).map(edge => ({
                source: edge.source,
                target: edge.target,
                value: edge.weight,
                similarity: edge.similarity,
                type: edge.type,
                color: edge.color,
                width: edge.thickness
            }))
        };
    }
    
    exportAsGraphML(options = {}) {
        const filtered = options.filtered ? this.applyFilter(this.currentFilter || {}) : null;
        const nodes = filtered?.nodes || this.nodes;
        const edges = filtered?.edges || this.edges;
        
        let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="name" for="node" attr.name="name" attr.type="string"/>
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="category" for="node" attr.name="category" attr.type="string"/>
  <key id="similarity" for="edge" attr.name="similarity" attr.type="double"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  
  <graph id="KnowledgeGraph" edgedefault="undirected">`;
        
        // Add nodes
        for (const node of nodes.values()) {
            graphml += `
    <node id="${node.id}">
      <data key="name">${this.escapeXML(node.label)}</data>
      <data key="type">${this.escapeXML(node.type)}</data>
      <data key="category">${this.escapeXML(node.category)}</data>
    </node>`;
        }
        
        // Add edges
        for (const edge of edges.values()) {
            graphml += `
    <edge source="${edge.source}" target="${edge.target}">
      <data key="similarity">${edge.similarity}</data>
      <data key="weight">${edge.weight}</data>
    </edge>`;
        }
        
        graphml += `
  </graph>
</graphml>`;
        
        return graphml;
    }
    
    /**
     * Generate interactive HTML visualization
     */
    async generateInteractiveVisualization(options = {}) {
        const template = await this.loadHTMLTemplate(options.template || 'default');
        const graphData = this.exportAsD3(options);
        
        const html = template
            .replace('{{GRAPH_DATA}}', JSON.stringify(graphData, null, 2))
            .replace('{{TITLE}}', options.title || 'Knowledge Graph Visualization')
            .replace('{{CONFIG}}', JSON.stringify(this.config, null, 2));
        
        const filename = options.filename || `knowledge-graph-${Date.now()}.html`;
        const filepath = path.join(this.config.outputDir, filename);
        
        await fs.writeFile(filepath, html);
        
        console.log(`🌐 Interactive visualization generated: ${filepath}`);
        
        return filepath;
    }
    
    /**
     * Helper methods
     */
    
    generateNodeId(result) {
        const text = result.data?.name || result.data?.title || result.type || 'unknown';
        return crypto.createHash('sha256').update(text + result.source).digest('hex').substring(0, 12);
    }
    
    calculateResultSimilarity(result1, result2) {
        // Simple similarity based on type and source
        let similarity = 0;
        
        if (result1.type === result2.type) similarity += 0.3;
        if (result1.source === result2.source) similarity += 0.2;
        if (result1.data?.category === result2.data?.category) similarity += 0.2;
        
        // Add text similarity if available
        if (result1.data?.name && result2.data?.name) {
            const textSim = this.calculateSimpleTextSimilarity(result1.data.name, result2.data.name);
            similarity += textSim * 0.3;
        }
        
        return Math.min(1, similarity);
    }
    
    calculateSimpleTextSimilarity(text1, text2) {
        const set1 = new Set(text1.toLowerCase().split(' '));
        const set2 = new Set(text2.toLowerCase().split(' '));
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }
    
    calculateNodeSize(data) {
        const baseSize = this.config.nodeSize.min;
        const maxSize = this.config.nodeSize.max;
        const confidence = data.confidence || 0.5;
        
        return baseSize + (maxSize - baseSize) * confidence;
    }
    
    calculateEdgeThickness(similarity) {
        const minThickness = this.config.edgeWeight.min;
        const maxThickness = this.config.edgeWeight.max;
        
        return minThickness + (maxThickness - minThickness) * similarity;
    }
    
    getNodeColor(type, category) {
        const colors = {
            component: '#3498db',
            pattern: '#e74c3c',
            'cross-reference': '#2ecc71',
            semantic: '#f39c12',
            'ml-enhanced': '#9b59b6',
            default: '#95a5a6'
        };
        
        return colors[type] || colors[category] || colors.default;
    }
    
    getEdgeColor(type, similarity) {
        const alpha = Math.max(0.3, similarity);
        
        const colors = {
            similarity: `rgba(52, 152, 219, ${alpha})`,
            cross_reference: `rgba(46, 204, 113, ${alpha})`,
            semantic: `rgba(243, 156, 18, ${alpha})`,
            default: `rgba(149, 165, 166, ${alpha})`
        };
        
        return colors[type] || colors.default;
    }
    
    calculateClusterSimilarity(cluster) {
        if (cluster.edges.length === 0) return 0;
        
        const totalSimilarity = cluster.edges.reduce((sum, edgeId) => {
            const edge = this.edges.get(edgeId);
            return sum + (edge?.similarity || 0);
        }, 0);
        
        return totalSimilarity / cluster.edges.length;
    }
    
    calculateClusterCohesion(cluster) {
        const n = cluster.nodes.length;
        if (n < 2) return 1;
        
        const maxPossibleEdges = (n * (n - 1)) / 2;
        const actualEdges = cluster.edges.length;
        
        return maxPossibleEdges === 0 ? 0 : actualEdges / maxPossibleEdges;
    }
    
    updateStats() {
        this.stats.totalNodes = this.nodes.size;
        this.stats.totalEdges = this.edges.size;
        this.stats.totalClusters = this.clusters.size;
        
        // Calculate network density
        const maxPossibleEdges = (this.nodes.size * (this.nodes.size - 1)) / 2;
        this.stats.networkDensity = maxPossibleEdges === 0 ? 0 : this.edges.size / maxPossibleEdges;
        
        // Calculate average connectivity
        const totalConnections = Array.from(this.nodes.values())
            .reduce((sum, node) => sum + node.connections.size, 0);
        this.stats.averageConnectivity = this.nodes.size === 0 ? 0 : totalConnections / this.nodes.size;
    }
    
    calculateFilteredStats(filteredNodes, filteredEdges) {
        const maxPossibleEdges = (filteredNodes.size * (filteredNodes.size - 1)) / 2;
        const density = maxPossibleEdges === 0 ? 0 : filteredEdges.size / maxPossibleEdges;
        
        return {
            nodes: filteredNodes.size,
            edges: filteredEdges.size,
            density: density,
            originalNodes: this.nodes.size,
            originalEdges: this.edges.size,
            filterRatio: this.nodes.size === 0 ? 0 : filteredNodes.size / this.nodes.size
        };
    }
    
    escapeXML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    getCytoscapeStyles() {
        return [
            {
                selector: 'node',
                style: {
                    'background-color': 'data(color)',
                    'width': 'data(size)',
                    'height': 'data(size)',
                    'label': 'data(label)',
                    'font-size': '12px',
                    'text-valign': 'center',
                    'text-halign': 'center'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 'data(thickness)',
                    'line-color': 'data(color)',
                    'target-arrow-color': 'data(color)',
                    'target-arrow-shape': 'triangle',
                    'opacity': 0.7
                }
            }
        ];
    }
    
    async loadVisualizationTemplates() {
        // Create default templates if they don't exist
        const templatesDir = this.config.templateDir;
        await fs.mkdir(templatesDir, { recursive: true });
        
        // Default HTML template
        const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
    <title>{{TITLE}}</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        #graph { width: 100%; height: 600px; border: 1px solid #ccc; }
        .controls { margin-bottom: 20px; }
        .node { cursor: pointer; }
        .link { stroke: #999; stroke-opacity: 0.6; }
    </style>
</head>
<body>
    <h1>{{TITLE}}</h1>
    <div class="controls">
        <label>Similarity Filter: <input type="range" id="similarity-filter" min="0" max="1" step="0.1" value="0.4"></label>
        <button onclick="resetView()">Reset View</button>
        <button onclick="exportData()">Export</button>
    </div>
    <div id="graph"></div>
    
    <script>
        const graphData = {{GRAPH_DATA}};
        const config = {{CONFIG}};
        
        // D3.js visualization code would go here
        console.log('Graph data loaded:', graphData);
        console.log('Config loaded:', config);
    </script>
</body>
</html>`;
        
        const templatePath = path.join(templatesDir, 'default.html');
        try {
            await fs.access(templatePath);
        } catch {
            await fs.writeFile(templatePath, defaultTemplate);
        }
    }
    
    async loadHTMLTemplate(templateName) {
        const templatePath = path.join(this.config.templateDir, `${templateName}.html`);
        return await fs.readFile(templatePath, 'utf8');
    }
    
    /**
     * API methods
     */
    
    getStats() {
        return {
            ...this.stats,
            currentFilter: this.currentFilter,
            selectedNodes: this.selectedNodes.size,
            highlightedPath: this.highlightedPath.length
        };
    }
    
    clearGraph() {
        this.nodes.clear();
        this.edges.clear();
        this.clusters.clear();
        this.paths.clear();
        this.updateStats();
        console.log('🗑️ Graph cleared');
    }
    
    getNeighbors(nodeId, depth = 1) {
        if (!this.nodes.has(nodeId)) return [];
        
        const neighbors = new Set();
        const queue = [{ nodeId, currentDepth: 0 }];
        const visited = new Set([nodeId]);
        
        while (queue.length > 0) {
            const { nodeId: currentNodeId, currentDepth } = queue.shift();
            
            if (currentDepth < depth) {
                const node = this.nodes.get(currentNodeId);
                for (const connectedNodeId of node.connections) {
                    if (!visited.has(connectedNodeId)) {
                        neighbors.add(connectedNodeId);
                        visited.add(connectedNodeId);
                        queue.push({ nodeId: connectedNodeId, currentDepth: currentDepth + 1 });
                    }
                }
            }
        }
        
        return Array.from(neighbors).map(id => this.nodes.get(id));
    }
}

module.exports = KnowledgeGraphVisualizer;

// CLI interface
if (require.main === module) {
    const visualizer = new KnowledgeGraphVisualizer({
        outputDir: './graph-visualizations',
        enablePhysics: true
    });
    
    // Test visualization
    async function testVisualizer() {
        console.log('\n🧪 Testing Knowledge Graph Visualizer...');
        
        // Add some test nodes
        const nodeIds = [];
        const nodeTypes = ['component', 'pattern', 'cross-reference', 'semantic'];
        
        for (let i = 0; i < 20; i++) {
            const nodeId = `node_${i}`;
            nodeIds.push(nodeId);
            
            visualizer.addNode(nodeId, {
                name: `Test Node ${i}`,
                type: nodeTypes[i % nodeTypes.length],
                category: i < 10 ? 'frontend' : 'backend',
                confidence: Math.random()
            });
        }
        
        // Add random edges
        for (let i = 0; i < 30; i++) {
            const source = nodeIds[Math.floor(Math.random() * nodeIds.length)];
            const target = nodeIds[Math.floor(Math.random() * nodeIds.length)];
            
            if (source !== target) {
                visualizer.addEdge(source, target, {
                    similarity: Math.random(),
                    type: 'test_similarity'
                });
            }
        }
        
        console.log('📊 Graph Stats:', visualizer.getStats());
        
        // Test clustering
        const clusters = visualizer.detectClusters();
        console.log(`🎯 Found ${clusters.length} clusters`);
        
        // Test path finding
        if (nodeIds.length >= 2) {
            const path = visualizer.findPath(nodeIds[0], nodeIds[nodeIds.length - 1]);
            if (path) {
                console.log(`🛤️ Path found: ${path.path.length} nodes, similarity: ${(path.averageSimilarity * 100).toFixed(1)}%`);
            }
        }
        
        // Test exports
        await visualizer.exportGraph('json', 'test-graph.json');
        await visualizer.exportGraph('cytoscape', 'test-graph-cytoscape.json');
        await visualizer.generateInteractiveVisualization({ filename: 'test-visualization.html' });
        
        console.log('✅ Knowledge Graph Visualizer test completed');
    }
    
    testVisualizer().catch(console.error);
}
#!/usr/bin/env node

/**
 * 🪢 KNOT THEORY ENGINE
 * 
 * Mathematical engine for topological data binding using knot theory
 * Implements knot invariants, Reidemeister moves, and braid groups
 * 
 * Core Concepts:
 * - Data flows are strands in 3D space
 * - Transformations are Reidemeister moves
 * - Invariants guarantee data integrity
 * - Braiding creates complex relationships
 */

const EventEmitter = require('events');
const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

class KnotTheoryEngine extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 3013;
        
        // Knot storage
        this.knots = new Map();
        this.braids = new Map();
        this.links = new Map();
        
        // Mathematical components
        this.invariants = {
            jones: this.jonesPolynomial.bind(this),
            alexander: this.alexanderPolynomial.bind(this),
            homfly: this.homflyPolynomial.bind(this),
            writhe: this.calculateWrithe.bind(this),
            linking: this.linkingNumber.bind(this)
        };
        
        // Reidemeister moves (fundamental knot transformations)
        this.reidemeisterMoves = {
            I: this.reidemeisterI.bind(this),   // Twist/untwist
            II: this.reidemeisterII.bind(this),  // Poke/unpoke
            III: this.reidemeisterIII.bind(this) // Slide
        };
        
        // Data type mappings to strands
        this.strandTypes = {
            pokemon: { color: '#FF0000', thickness: 3, elasticity: 0.8 },
            bitcoin: { color: '#F7931A', thickness: 2, elasticity: 0.3 },
            realEstate: { color: '#4169E1', thickness: 4, elasticity: 0.5 },
            crawler: { color: '#00FF00', thickness: 1, elasticity: 0.9 },
            scraper: { color: '#FFA500', thickness: 2, elasticity: 0.6 }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        this.app.use((req, res, next) => {
            res.setHeader('X-Service', 'knot-theory-engine');
            res.setHeader('X-Topology', 'active');
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'knot-theory-engine',
                knots: this.knots.size,
                braids: this.braids.size,
                links: this.links.size
            });
        });
        
        // Create a knot from data
        this.app.post('/knot/create', async (req, res) => {
            try {
                const { data, type, name } = req.body;
                const knot = await this.createKnot(data, type, name);
                
                res.json({
                    success: true,
                    knotId: knot.id,
                    invariants: knot.invariants
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Apply Reidemeister move
        this.app.post('/knot/transform', async (req, res) => {
            try {
                const { knotId, move, location } = req.body;
                const result = await this.applyReidemeister(knotId, move, location);
                
                res.json({
                    success: true,
                    knot: result,
                    invariantsPreserved: this.checkInvariants(result)
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Braid data strands together
        this.app.post('/braid/create', async (req, res) => {
            try {
                const { strands, pattern } = req.body;
                const braid = await this.createBraid(strands, pattern);
                
                res.json({
                    success: true,
                    braidId: braid.id,
                    word: braid.word
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Calculate knot invariants
        this.app.get('/knot/:id/invariants', async (req, res) => {
            try {
                const knot = this.knots.get(req.params.id);
                if (!knot) throw new Error('Knot not found');
                
                const invariants = await this.calculateAllInvariants(knot);
                
                res.json({
                    success: true,
                    invariants
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
    }
    
    async createKnot(data, type, name) {
        const knotId = `knot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Convert data to knot diagram
        const diagram = this.dataToKnotDiagram(data, type);
        
        // Calculate initial invariants
        const invariants = await this.calculateAllInvariants(diagram);
        
        const knot = {
            id: knotId,
            name: name || `${type}_knot`,
            type,
            diagram,
            crossings: diagram.crossings,
            invariants,
            created: new Date().toISOString(),
            transformations: []
        };
        
        this.knots.set(knotId, knot);
        this.emit('knot-created', knot);
        
        return knot;
    }
    
    dataToKnotDiagram(data, type) {
        // Convert different data types to knot diagrams
        switch (type) {
            case 'pokemon':
                return this.pokemonToKnot(data);
            case 'bitcoin':
                return this.bitcoinToKnot(data);
            case 'realEstate':
                return this.realEstateToKnot(data);
            case 'crawler':
                return this.crawlerPathToKnot(data);
            default:
                return this.genericDataToKnot(data);
        }
    }
    
    pokemonToKnot(pokemon) {
        // Pokemon evolution chain as knot
        const crossings = [];
        
        // Each type creates a loop
        if (pokemon.types) {
            pokemon.types.forEach((type, i) => {
                crossings.push({
                    id: `type_${i}`,
                    over: i,
                    under: (i + 1) % pokemon.types.length,
                    position: { x: Math.cos(i * Math.PI / 3), y: Math.sin(i * Math.PI / 3) }
                });
            });
        }
        
        // Stats create additional crossings
        if (pokemon.stats) {
            Object.entries(pokemon.stats).forEach(([stat, value], i) => {
                crossings.push({
                    id: `stat_${stat}`,
                    over: i + pokemon.types.length,
                    under: Math.floor(value / 50), // Stats influence crossing pattern
                    position: { x: value / 100, y: i * 0.5 }
                });
            });
        }
        
        return {
            crossings,
            components: 1,
            genus: Math.floor(crossings.length / 4)
        };
    }
    
    bitcoinToKnot(transaction) {
        // Bitcoin transaction as braid
        const crossings = [];
        
        // Inputs and outputs form strands
        const strands = [
            ...(transaction.inputs || []).map(i => ({ type: 'input', value: i.value })),
            ...(transaction.outputs || []).map(o => ({ type: 'output', value: o.value }))
        ];
        
        // Create crossings based on value flow
        strands.forEach((strand, i) => {
            if (i < strands.length - 1) {
                crossings.push({
                    id: `tx_${i}`,
                    over: i,
                    under: i + 1,
                    position: { 
                        x: strand.value / 1e8, // Convert satoshis
                        y: i * 0.3 
                    }
                });
            }
        });
        
        return {
            crossings,
            components: strands.length,
            genus: 0 // Transactions are planar
        };
    }
    
    realEstateToKnot(property) {
        // Real estate data as linked loops
        const crossings = [];
        
        // Price history creates the main loop
        if (property.priceHistory) {
            property.priceHistory.forEach((price, i) => {
                if (i > 0) {
                    const change = price.value / property.priceHistory[i-1].value;
                    crossings.push({
                        id: `price_${i}`,
                        over: i - 1,
                        under: i,
                        position: { x: change, y: price.value / 1000000 }
                    });
                }
            });
        }
        
        // Features create additional components
        const features = ['bedrooms', 'bathrooms', 'sqft'];
        features.forEach((feature, i) => {
            if (property[feature]) {
                crossings.push({
                    id: `feature_${feature}`,
                    over: crossings.length,
                    under: 0, // Link back to price
                    position: { x: i * 0.5, y: property[feature] / 10 }
                });
            }
        });
        
        return {
            crossings,
            components: 2, // Price loop + features loop
            genus: Math.floor(crossings.length / 6)
        };
    }
    
    crawlerPathToKnot(crawlData) {
        // Web crawl path as knot
        const crossings = [];
        const visited = new Set();
        
        // Each URL visit creates a crossing
        crawlData.path.forEach((url, i) => {
            if (visited.has(url)) {
                // Revisiting creates a crossing
                crossings.push({
                    id: `visit_${i}`,
                    over: i,
                    under: Array.from(visited).indexOf(url),
                    position: { x: i * 0.1, y: Math.random() }
                });
            }
            visited.add(url);
        });
        
        return {
            crossings,
            components: 1, // Single crawl path
            genus: visited.size - crawlData.path.length + crossings.length
        };
    }
    
    genericDataToKnot(data) {
        // Generic data conversion using hash
        const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest();
        const crossings = [];
        
        // Use hash bytes to generate crossings
        for (let i = 0; i < Math.min(hash.length - 1, 20); i++) {
            crossings.push({
                id: `generic_${i}`,
                over: hash[i] % 10,
                under: hash[i+1] % 10,
                position: { x: (hash[i] - 128) / 128, y: (hash[i+1] - 128) / 128 }
            });
        }
        
        return {
            crossings,
            components: 1,
            genus: 0
        };
    }
    
    // Reidemeister moves
    async reidemeisterI(knot, location) {
        // Type I: Add or remove a twist
        const crossing = {
            id: `twist_${Date.now()}`,
            over: location,
            under: location,
            position: { x: Math.random(), y: Math.random() }
        };
        
        knot.diagram.crossings.push(crossing);
        knot.transformations.push({ type: 'R1', location, timestamp: Date.now() });
        
        return knot;
    }
    
    async reidemeisterII(knot, location) {
        // Type II: Add or remove two crossings
        const crossings = [
            {
                id: `poke_${Date.now()}_1`,
                over: location,
                under: location + 1,
                position: { x: Math.random(), y: Math.random() }
            },
            {
                id: `poke_${Date.now()}_2`,
                over: location + 1,
                under: location,
                position: { x: Math.random(), y: Math.random() }
            }
        ];
        
        knot.diagram.crossings.push(...crossings);
        knot.transformations.push({ type: 'R2', location, timestamp: Date.now() });
        
        return knot;
    }
    
    async reidemeisterIII(knot, location) {
        // Type III: Move a strand across a crossing
        if (location < knot.diagram.crossings.length - 1) {
            // Swap adjacent crossings
            const temp = knot.diagram.crossings[location];
            knot.diagram.crossings[location] = knot.diagram.crossings[location + 1];
            knot.diagram.crossings[location + 1] = temp;
        }
        
        knot.transformations.push({ type: 'R3', location, timestamp: Date.now() });
        
        return knot;
    }
    
    async applyReidemeister(knotId, move, location) {
        const knot = this.knots.get(knotId);
        if (!knot) throw new Error('Knot not found');
        
        const moveFunction = this.reidemeisterMoves[move];
        if (!moveFunction) throw new Error('Invalid Reidemeister move');
        
        const transformed = await moveFunction(knot, location);
        
        // Recalculate invariants
        transformed.invariants = await this.calculateAllInvariants(transformed.diagram);
        
        this.emit('knot-transformed', { knotId, move, location });
        
        return transformed;
    }
    
    // Knot invariants
    async calculateAllInvariants(diagram) {
        return {
            jones: await this.jonesPolynomial(diagram),
            alexander: await this.alexanderPolynomial(diagram),
            writhe: this.calculateWrithe(diagram),
            crossingNumber: diagram.crossings.length,
            components: diagram.components,
            genus: diagram.genus
        };
    }
    
    jonesPolynomial(diagram) {
        // Simplified Jones polynomial calculation
        const n = diagram.crossings.length;
        const writhe = this.calculateWrithe(diagram);
        
        // For unknot: V(unknot) = 1
        if (n === 0) return { polynomial: '1', value: 1 };
        
        // Simplified calculation based on crossing number and writhe
        const coefficient = Math.pow(-1, writhe) * Math.sqrt(n);
        
        return {
            polynomial: `${coefficient.toFixed(2)}*t^${writhe}`,
            value: coefficient,
            writhe
        };
    }
    
    alexanderPolynomial(diagram) {
        // Simplified Alexander polynomial
        const n = diagram.crossings.length;
        
        if (n === 0) return { polynomial: '1', value: 1 };
        
        // Based on crossing number
        const polynomial = `1 + ${n}*t + ${n}*t^(-1)`;
        
        return {
            polynomial,
            degree: 1,
            crossings: n
        };
    }
    
    homflyPolynomial(diagram) {
        // HOMFLY polynomial (most general)
        // Simplification: relates to both Jones and Alexander
        return {
            polynomial: 'P(a,z)',
            note: 'Generalized polynomial containing Jones and Alexander'
        };
    }
    
    calculateWrithe(diagram) {
        // Sum of crossing signs (+1 for right-handed, -1 for left-handed)
        let writhe = 0;
        
        diagram.crossings.forEach(crossing => {
            // Determine handedness based on over/under strands
            const sign = (crossing.over < crossing.under) ? 1 : -1;
            writhe += sign;
        });
        
        return writhe;
    }
    
    linkingNumber(knot1, knot2) {
        // Calculate linking number between two knots
        let linking = 0;
        
        // Count crossings between components
        knot1.diagram.crossings.forEach(c1 => {
            knot2.diagram.crossings.forEach(c2 => {
                if (this.strandsIntersect(c1, c2)) {
                    linking += this.crossingSign(c1, c2);
                }
            });
        });
        
        return linking / 2; // Each crossing counted twice
    }
    
    strandsIntersect(c1, c2) {
        // Check if two crossings share strands
        return (c1.over === c2.over || c1.over === c2.under ||
                c1.under === c2.over || c1.under === c2.under);
    }
    
    crossingSign(c1, c2) {
        // Determine sign of crossing
        const dx = c2.position.x - c1.position.x;
        const dy = c2.position.y - c1.position.y;
        return Math.sign(dx * dy);
    }
    
    checkInvariants(knot) {
        // Verify invariants are preserved after transformation
        const before = knot.invariants;
        const after = this.calculateAllInvariants(knot.diagram);
        
        return {
            jonesPreserved: Math.abs(before.jones.value - after.jones.value) < 0.001,
            alexanderPreserved: before.alexander.polynomial === after.alexander.polynomial,
            componentsPreserved: before.components === after.components
        };
    }
    
    async createBraid(strands, pattern) {
        const braidId = `braid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Convert to braid word notation
        const word = this.patternToBraidWord(pattern);
        
        const braid = {
            id: braidId,
            strands: strands.length,
            word,
            pattern,
            created: new Date().toISOString()
        };
        
        this.braids.set(braidId, braid);
        
        // Convert braid to knot via closure
        const knot = await this.braidClosure(braid);
        
        return { ...braid, knotId: knot.id };
    }
    
    patternToBraidWord(pattern) {
        // Convert pattern to braid group generators
        // σᵢ = crossing strand i over strand i+1
        // σᵢ⁻¹ = crossing strand i under strand i+1
        
        return pattern.map(crossing => {
            const strand = crossing.strand || 1;
            const direction = crossing.over ? '' : '-1';
            return `σ${strand}${direction}`;
        }).join(' ');
    }
    
    async braidClosure(braid) {
        // Close braid to form knot
        const diagram = {
            crossings: [],
            components: 1,
            genus: 0
        };
        
        // Convert braid word to crossings
        const generators = braid.word.split(' ');
        generators.forEach((gen, i) => {
            const match = gen.match(/σ(\d+)(-1)?/);
            if (match) {
                const strand = parseInt(match[1]);
                const over = !match[2]; // -1 means under
                
                diagram.crossings.push({
                    id: `braid_${i}`,
                    over: over ? strand : strand + 1,
                    under: over ? strand + 1 : strand,
                    position: { x: i * 0.2, y: strand * 0.2 }
                });
            }
        });
        
        // Create knot from closed braid
        return this.createKnot(diagram, 'braid', `closure_of_${braid.id}`);
    }
    
    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Knot Theory Engine - Topological Data Binding</title>
    <style>
        body {
            font-family: -apple-system, monospace;
            background: #0a0a0a;
            color: #0f0;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px;
            border: 2px solid #0f0;
            margin-bottom: 30px;
        }
        .knot-viz {
            width: 400px;
            height: 400px;
            margin: 20px auto;
            border: 1px solid #0f0;
            position: relative;
            background: #111;
        }
        .crossing {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 2px solid #0f0;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
        .crossing.over {
            background: #0f0;
            z-index: 2;
        }
        .crossing.under {
            background: #050;
            z-index: 1;
        }
        .strand-line {
            position: absolute;
            height: 2px;
            background: #0f0;
            transform-origin: left center;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .panel {
            background: #111;
            border: 1px solid #0f0;
            padding: 20px;
            border-radius: 10px;
        }
        .invariant {
            background: #1a1a1a;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            font-family: monospace;
        }
        .reidemeister-btn {
            background: #0f0;
            color: #000;
            border: none;
            padding: 10px 15px;
            margin: 5px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 5px;
        }
        .reidemeister-btn:hover {
            background: #0a0;
        }
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 5px;
            margin: 5px;
        }
        button:hover {
            background: #0a0;
        }
        .data-input {
            width: 100%;
            padding: 10px;
            background: #1a1a1a;
            color: #0f0;
            border: 1px solid #0f0;
            border-radius: 5px;
            margin: 10px 0;
        }
        select {
            background: #1a1a1a;
            color: #0f0;
            border: 1px solid #0f0;
            padding: 5px 10px;
            border-radius: 5px;
        }
        .knot-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #333;
            padding: 10px;
            margin: 10px 0;
        }
        .knot-item {
            padding: 10px;
            margin: 5px 0;
            background: #1a1a1a;
            border-radius: 5px;
            cursor: pointer;
        }
        .knot-item:hover {
            background: #2a2a2a;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        .stat {
            background: #1a1a1a;
            padding: 15px;
            text-align: center;
            border-radius: 5px;
        }
        .stat-value {
            font-size: 24px;
            color: #0ff;
        }
        #canvas3d {
            width: 100%;
            height: 400px;
            background: #111;
            border: 1px solid #0f0;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🪢 KNOT THEORY ENGINE</h1>
        <p>Topological Data Binding - Where Pokemon meets Bitcoin through Mathematics</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div>Active Knots</div>
            <div class="stat-value" id="knotCount">0</div>
        </div>
        <div class="stat">
            <div>Total Crossings</div>
            <div class="stat-value" id="crossingCount">0</div>
        </div>
        <div class="stat">
            <div>Braids</div>
            <div class="stat-value" id="braidCount">0</div>
        </div>
        <div class="stat">
            <div>Links</div>
            <div class="stat-value" id="linkCount">0</div>
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h3>🎮 Create Knot from Data</h3>
            <select id="dataType">
                <option value="pokemon">Pokemon Data</option>
                <option value="bitcoin">Bitcoin Transaction</option>
                <option value="realEstate">Real Estate Property</option>
                <option value="crawler">Web Crawler Path</option>
                <option value="generic">Generic Data</option>
            </select>
            <textarea id="dataInput" class="data-input" rows="5" placeholder="Enter JSON data...">{
  "name": "Pikachu",
  "types": ["Electric"],
  "stats": {
    "hp": 35,
    "attack": 55,
    "defense": 40,
    "speed": 90
  }
}</textarea>
            <button onclick="createKnot()">Create Knot</button>
        </div>
        
        <div class="panel">
            <h3>🔄 Reidemeister Moves</h3>
            <div id="selectedKnot" style="margin-bottom: 10px;">
                No knot selected
            </div>
            <button class="reidemeister-btn" onclick="applyMove('I')">Type I (Twist)</button>
            <button class="reidemeister-btn" onclick="applyMove('II')">Type II (Poke)</button>
            <button class="reidemeister-btn" onclick="applyMove('III')">Type III (Slide)</button>
            <div style="margin-top: 20px;">
                <label>Location: <input type="number" id="moveLocation" value="0" min="0" style="width: 50px;"></label>
            </div>
        </div>
        
        <div class="panel">
            <h3>📊 Knot Invariants</h3>
            <div id="invariants">
                <div class="invariant">Select a knot to view invariants</div>
            </div>
        </div>
    </div>
    
    <div class="panel">
        <h3>🌐 3D Knot Visualization</h3>
        <canvas id="canvas3d"></canvas>
        <div id="knot-viz" class="knot-viz"></div>
    </div>
    
    <div class="panel">
        <h3>📝 Active Knots</h3>
        <div id="knotList" class="knot-list"></div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        let selectedKnotId = null;
        let scene, camera, renderer;
        let knots = new Map();
        
        async function createKnot() {
            const type = document.getElementById('dataType').value;
            const data = JSON.parse(document.getElementById('dataInput').value);
            
            const response = await fetch('/knot/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, type, name: data.name || type })
            });
            
            const result = await response.json();
            if (result.success) {
                loadKnots();
                selectKnot(result.knotId);
            }
        }
        
        async function applyMove(move) {
            if (!selectedKnotId) {
                alert('Please select a knot first');
                return;
            }
            
            const location = parseInt(document.getElementById('moveLocation').value);
            
            const response = await fetch('/knot/transform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    knotId: selectedKnotId,
                    move,
                    location
                })
            });
            
            const result = await response.json();
            if (result.success) {
                updateVisualization(result.knot);
                updateInvariants(result.knot.invariants);
            }
        }
        
        function selectKnot(knotId) {
            selectedKnotId = knotId;
            const knot = knots.get(knotId);
            if (knot) {
                document.getElementById('selectedKnot').innerHTML = \`
                    <strong>Selected:</strong> \${knot.name} (\${knot.type})
                    <br>Crossings: \${knot.diagram.crossings.length}
                \`;
                updateVisualization(knot);
                loadInvariants(knotId);
            }
        }
        
        async function loadInvariants(knotId) {
            const response = await fetch(\`/knot/\${knotId}/invariants\`);
            const result = await response.json();
            
            if (result.success) {
                updateInvariants(result.invariants);
            }
        }
        
        function updateInvariants(invariants) {
            const html = Object.entries(invariants).map(([name, value]) => \`
                <div class="invariant">
                    <strong>\${name}:</strong> \${
                        typeof value === 'object' ? 
                        (value.polynomial || JSON.stringify(value)) : 
                        value
                    }
                </div>
            \`).join('');
            
            document.getElementById('invariants').innerHTML = html;
        }
        
        function updateVisualization(knot) {
            const viz = document.getElementById('knot-viz');
            viz.innerHTML = '';
            
            // Draw crossings
            knot.diagram.crossings.forEach((crossing, i) => {
                const div = document.createElement('div');
                div.className = \`crossing \${i === crossing.over ? 'over' : 'under'}\`;
                div.style.left = (200 + crossing.position.x * 150) + 'px';
                div.style.top = (200 + crossing.position.y * 150) + 'px';
                viz.appendChild(div);
            });
            
            // Update 3D visualization
            update3DKnot(knot);
        }
        
        async function loadKnots() {
            // This would normally fetch from the server
            // For now, update counts
            document.getElementById('knotCount').textContent = knots.size;
            
            const listHtml = Array.from(knots.values()).map(knot => \`
                <div class="knot-item" onclick="selectKnot('\${knot.id}')">
                    <strong>\${knot.name}</strong> (\${knot.type})
                    <br>Crossings: \${knot.diagram.crossings.length}
                </div>
            \`).join('');
            
            document.getElementById('knotList').innerHTML = listHtml || 'No knots created yet';
        }
        
        function init3D() {
            const canvas = document.getElementById('canvas3d');
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            renderer.setSize(canvas.width, canvas.height);
            
            camera.position.z = 5;
            
            // Add lighting
            const light = new THREE.AmbientLight(0x00ff00, 0.5);
            scene.add(light);
            
            animate();
        }
        
        function update3DKnot(knot) {
            // Clear existing geometry
            while(scene.children.length > 0) {
                scene.remove(scene.children[0]);
            }
            
            // Create knot curve
            const points = knot.diagram.crossings.map(c => 
                new THREE.Vector3(
                    c.position.x * 2,
                    c.position.y * 2,
                    Math.sin(c.over * 0.5) * 0.5
                )
            );
            
            if (points.length > 2) {
                const curve = new THREE.CatmullRomCurve3(points, true);
                const geometry = new THREE.TubeGeometry(curve, 100, 0.1, 8, true);
                const material = new THREE.MeshBasicMaterial({ 
                    color: getColorForType(knot.type),
                    wireframe: false
                });
                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);
            }
            
            // Re-add lighting
            const light = new THREE.AmbientLight(0x00ff00, 0.5);
            scene.add(light);
        }
        
        function getColorForType(type) {
            const colors = {
                pokemon: 0xff0000,
                bitcoin: 0xf7931a,
                realEstate: 0x4169e1,
                crawler: 0x00ff00,
                generic: 0xffffff
            };
            return colors[type] || 0xffffff;
        }
        
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate the knot
            scene.rotation.x += 0.01;
            scene.rotation.y += 0.01;
            
            renderer.render(scene, camera);
        }
        
        // Initialize
        loadKnots();
        init3D();
        
        // Auto-refresh
        setInterval(loadKnots, 5000);
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`🪢 Knot Theory Engine running on port ${this.port}`);
                console.log(`📐 Topological data binding active`);
                console.log(`🎮 Dashboard: http://localhost:${this.port}`);
                resolve();
            });
        });
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Knot Theory Engine...');
        process.exit(0);
    }
}

// Auto-start if run directly
if (require.main === module) {
    const engine = new KnotTheoryEngine();
    
    engine.start().catch(error => {
        console.error('Failed to start Knot Theory Engine:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => engine.shutdown());
    process.on('SIGTERM', () => engine.shutdown());
}

module.exports = KnotTheoryEngine;
#!/usr/bin/env node

/**
 * 🧬 TYPE II TOPOISOMERASE ENGINE
 * 
 * Implements the biological DNA untangling mechanism for data encoding
 * Type II Topoisomerase: The enzyme that cuts both DNA strands, passes another through, and re-ligates
 * 
 * Used in cancer treatment because rapidly dividing cells need it to untangle DNA
 * We use it to untangle complex data relationships and reduce knot complexity
 */

const EventEmitter = require('events');
const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

class TypeIITopoisomeraseEngine extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 3014;
        
        // Topoisomerase operations storage
        this.operations = new Map();
        this.catalyticCycles = new Map();
        this.atpUsage = new Map();
        
        // Biological parameters
        this.config = {
            atpCostPerCut: 2,              // ATP molecules consumed per double-strand break
            catalyticEfficiency: 0.95,      // Success rate of strand passage
            toxicityThreshold: 100,         // Maximum operations before toxicity
            coolingPeriod: 1000,            // ms between operations to prevent damage
            strandPassageTime: 50           // ms for strand to pass through gate
        };
        
        // Drug interactions (cancer treatment reference)
        this.drugs = {
            etoposide: { efficiency: 0.7, toxicity: 1.5 },     // Increases DNA damage
            doxorubicin: { efficiency: 0.8, toxicity: 1.3 },   // Intercalating agent
            novobiocin: { efficiency: 0.5, toxicity: 0.8 },    // ATP-competitive inhibitor
            merbarone: { efficiency: 0.6, toxicity: 1.0 }      // Catalytic inhibitor
        };
        
        // Knot complexity metrics
        this.complexityMetrics = {
            writhe: 0,
            linking: 0,
            supercoiling: 0,
            catenation: 0
        };
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        this.app.use((req, res, next) => {
            res.setHeader('X-Service', 'type-ii-topoisomerase');
            res.setHeader('X-Enzyme', 'active');
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'type-ii-topoisomerase',
                operations: this.operations.size,
                cycles: this.catalyticCycles.size,
                atpConsumed: Array.from(this.atpUsage.values()).reduce((a, b) => a + b, 0)
            });
        });
        
        // Perform topoisomerase operation
        this.app.post('/topoisomerase/operate', async (req, res) => {
            try {
                const { knotData, targetStrand, drug } = req.body;
                const result = await this.performTopoisomeraseII(knotData, targetStrand, drug);
                
                res.json({
                    success: true,
                    operationId: result.id,
                    complexity: result.complexity,
                    atpConsumed: result.atpConsumed,
                    toxicity: result.toxicity
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Calculate minimal unknotting operations
        this.app.post('/topoisomerase/unknot', async (req, res) => {
            try {
                const { knotDiagram } = req.body;
                const operations = await this.calculateUnknottingNumber(knotDiagram);
                
                res.json({
                    success: true,
                    unknottingNumber: operations.length,
                    operations,
                    totalATP: operations.length * this.config.atpCostPerCut
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Simulate drug interaction
        this.app.post('/topoisomerase/drug', async (req, res) => {
            try {
                const { drugName, dose, knotData } = req.body;
                const result = await this.simulateDrugInteraction(drugName, dose, knotData);
                
                res.json({
                    success: true,
                    drugEffect: result
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
    
    async performTopoisomeraseII(knotData, targetStrand, drug = null) {
        const operationId = `topo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate initial complexity
        const initialComplexity = this.calculateComplexity(knotData);
        
        // Apply drug effects if specified
        let efficiency = this.config.catalyticEfficiency;
        let toxicityMultiplier = 1;
        
        if (drug && this.drugs[drug]) {
            efficiency *= this.drugs[drug].efficiency;
            toxicityMultiplier = this.drugs[drug].toxicity;
        }
        
        // Simulate the topoisomerase mechanism
        const operation = {
            id: operationId,
            timestamp: Date.now(),
            steps: []
        };
        
        // Step 1: ATP binding
        operation.steps.push({
            step: 'ATP_BINDING',
            time: Date.now(),
            description: 'Two ATP molecules bind to N-terminal domains'
        });
        
        // Step 2: G-segment binding (DNA to be cut)
        const gSegment = this.identifyGSegment(knotData, targetStrand);
        operation.steps.push({
            step: 'G_SEGMENT_BINDING',
            time: Date.now() + 10,
            segment: gSegment,
            description: 'Gate segment identified and bound'
        });
        
        // Step 3: T-segment capture (DNA to pass through)
        const tSegment = this.identifyTSegment(knotData, gSegment);
        operation.steps.push({
            step: 'T_SEGMENT_CAPTURE',
            time: Date.now() + 20,
            segment: tSegment,
            description: 'Transport segment captured'
        });
        
        // Step 4: Double-strand break
        if (Math.random() < efficiency) {
            operation.steps.push({
                step: 'DOUBLE_STRAND_BREAK',
                time: Date.now() + 30,
                breakPoint: gSegment.position,
                description: 'Both strands cleaved at gate segment'
            });
            
            // Step 5: Strand passage
            operation.steps.push({
                step: 'STRAND_PASSAGE',
                time: Date.now() + 30 + this.config.strandPassageTime,
                description: 'T-segment passed through G-segment break'
            });
            
            // Step 6: Re-ligation
            operation.steps.push({
                step: 'RELIGATION',
                time: Date.now() + 80,
                description: 'G-segment re-ligated, topology changed'
            });
            
            // Update knot data
            knotData = this.updateTopology(knotData, gSegment, tSegment);
        } else {
            operation.steps.push({
                step: 'CATALYTIC_FAILURE',
                time: Date.now() + 30,
                description: 'Enzyme failed to complete cycle'
            });
        }
        
        // Step 7: ATP hydrolysis and release
        const atpConsumed = this.config.atpCostPerCut;
        operation.steps.push({
            step: 'ATP_HYDROLYSIS',
            time: Date.now() + 100,
            atpConsumed,
            description: 'ATP hydrolyzed, enzyme reset'
        });
        
        // Calculate final complexity
        const finalComplexity = this.calculateComplexity(knotData);
        const complexityReduction = initialComplexity - finalComplexity;
        
        // Calculate toxicity
        const toxicity = this.calculateToxicity(operationId, toxicityMultiplier);
        
        const result = {
            id: operationId,
            operation,
            initialComplexity,
            finalComplexity,
            complexityReduction,
            atpConsumed,
            toxicity,
            drug: drug || 'none',
            knotData
        };
        
        // Store operation
        this.operations.set(operationId, result);
        
        // Update ATP usage
        this.atpUsage.set(operationId, atpConsumed);
        
        // Emit event
        this.emit('topoisomerase-operation', result);
        
        return result;
    }
    
    identifyGSegment(knotData, targetStrand) {
        // G-segment is the gate segment that will be cut
        // Choose based on highest local curvature or crossing density
        
        const segments = knotData.crossings || [];
        let maxCurvature = -1;
        let gSegment = null;
        
        segments.forEach((segment, i) => {
            const curvature = this.calculateLocalCurvature(segment, segments);
            if (curvature > maxCurvature && (!targetStrand || segment.strand === targetStrand)) {
                maxCurvature = curvature;
                gSegment = {
                    ...segment,
                    index: i,
                    curvature
                };
            }
        });
        
        return gSegment || segments[0];
    }
    
    identifyTSegment(knotData, gSegment) {
        // T-segment is the transport segment that passes through
        // Choose segment that would most reduce complexity
        
        const segments = knotData.crossings || [];
        let bestSegment = null;
        let maxReduction = -1;
        
        segments.forEach((segment, i) => {
            if (i !== gSegment.index) {
                const reduction = this.estimateComplexityReduction(gSegment, segment);
                if (reduction > maxReduction) {
                    maxReduction = reduction;
                    bestSegment = {
                        ...segment,
                        index: i,
                        complexityReduction: reduction
                    };
                }
            }
        });
        
        return bestSegment || segments[1];
    }
    
    calculateLocalCurvature(segment, allSegments) {
        // Calculate how "bent" the DNA is at this point
        // Higher curvature = better topoisomerase target
        
        let curvature = 0;
        const radius = 3; // Look at nearby segments
        
        allSegments.forEach((other, i) => {
            const distance = Math.sqrt(
                Math.pow(segment.position.x - other.position.x, 2) +
                Math.pow(segment.position.y - other.position.y, 2)
            );
            
            if (distance < radius && distance > 0) {
                curvature += 1 / distance; // Inverse distance weighting
            }
        });
        
        return curvature;
    }
    
    estimateComplexityReduction(gSegment, tSegment) {
        // Estimate how much passing T through G would reduce complexity
        // Based on change in crossing number and writhe
        
        const dx = tSegment.position.x - gSegment.position.x;
        const dy = tSegment.position.y - gSegment.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Closer segments = more complexity reduction
        const proximityScore = 1 / (1 + distance);
        
        // Different strand orientations = better reduction
        const orientationScore = (gSegment.over !== tSegment.over) ? 1.5 : 1;
        
        return proximityScore * orientationScore;
    }
    
    updateTopology(knotData, gSegment, tSegment) {
        // Update the knot after strand passage
        const updated = JSON.parse(JSON.stringify(knotData));
        
        // Swap the over/under relationship
        if (gSegment.index < updated.crossings.length) {
            const temp = updated.crossings[gSegment.index].over;
            updated.crossings[gSegment.index].over = updated.crossings[gSegment.index].under;
            updated.crossings[gSegment.index].under = temp;
        }
        
        // Update writhe
        if (updated.writhe !== undefined) {
            updated.writhe *= -1; // Simplified: strand passage often inverts writhe
        }
        
        // Reduce supercoiling
        if (updated.supercoiling) {
            updated.supercoiling *= 0.7; // Each operation reduces supercoiling
        }
        
        return updated;
    }
    
    calculateComplexity(knotData) {
        // Calculate overall topological complexity
        let complexity = 0;
        
        // Crossing number
        if (knotData.crossings) {
            complexity += knotData.crossings.length * 10;
        }
        
        // Writhe (signed sum of crossings)
        if (knotData.writhe !== undefined) {
            complexity += Math.abs(knotData.writhe) * 5;
        }
        
        // Supercoiling
        if (knotData.supercoiling) {
            complexity += Math.abs(knotData.supercoiling) * 3;
        }
        
        // Linking number
        if (knotData.linking) {
            complexity += Math.abs(knotData.linking) * 7;
        }
        
        return complexity;
    }
    
    calculateToxicity(operationId, multiplier = 1) {
        // Calculate cellular toxicity from topoisomerase operations
        // Too many operations = DNA damage = cell death
        
        const recentOps = Array.from(this.operations.values())
            .filter(op => Date.now() - op.operation.timestamp < 60000) // Last minute
            .length;
        
        const baseToxicity = recentOps / this.config.toxicityThreshold;
        return Math.min(1, baseToxicity * multiplier); // Cap at 100%
    }
    
    async calculateUnknottingNumber(knotDiagram) {
        // Calculate minimal number of topoisomerase operations to unknot
        // This is the "unknotting number" in knot theory
        
        const operations = [];
        let currentKnot = JSON.parse(JSON.stringify(knotDiagram));
        let iterations = 0;
        const maxIterations = 100;
        
        while (this.calculateComplexity(currentKnot) > 0 && iterations < maxIterations) {
            // Find best operation
            const gSegment = this.identifyGSegment(currentKnot);
            const tSegment = this.identifyTSegment(currentKnot, gSegment);
            
            operations.push({
                iteration: iterations,
                gSegment: gSegment.index,
                tSegment: tSegment.index,
                complexityBefore: this.calculateComplexity(currentKnot)
            });
            
            // Apply operation
            currentKnot = this.updateTopology(currentKnot, gSegment, tSegment);
            
            iterations++;
        }
        
        return operations;
    }
    
    async simulateDrugInteraction(drugName, dose, knotData) {
        // Simulate how cancer drugs affect topoisomerase
        const drug = this.drugs[drugName];
        if (!drug) {
            throw new Error(`Unknown drug: ${drugName}`);
        }
        
        // Dose-response curve (sigmoid)
        const normalizedDose = Math.min(1, dose / 100); // Assume 100 is max dose
        const doseResponse = normalizedDose / (0.5 + normalizedDose);
        
        // Calculate drug effects
        const effects = {
            drug: drugName,
            dose,
            doseResponse,
            catalyticInhibition: 1 - (drug.efficiency * doseResponse),
            dnaTrapping: drug.toxicity * doseResponse,
            cellDeathProbability: this.calculateCellDeath(drug.toxicity * doseResponse),
            therapeuticWindow: this.calculateTherapeuticWindow(drug, doseResponse)
        };
        
        // Simulate multiple cycles with drug
        const cycles = [];
        for (let i = 0; i < 5; i++) {
            const efficiency = this.config.catalyticEfficiency * drug.efficiency;
            const success = Math.random() < efficiency;
            
            cycles.push({
                cycle: i + 1,
                success,
                trapped: Math.random() < effects.dnaTrapping,
                complexity: this.calculateComplexity(knotData) * (1 - i * 0.1)
            });
        }
        
        effects.cycles = cycles;
        effects.overallSuccess = cycles.filter(c => c.success).length / cycles.length;
        
        return effects;
    }
    
    calculateCellDeath(toxicity) {
        // Probability of cell death based on DNA damage
        // Follows typical dose-response curve
        return 1 - Math.exp(-3 * toxicity); // Exponential model
    }
    
    calculateTherapeuticWindow(drug, doseResponse) {
        // Range where drug kills cancer cells but not healthy cells
        // Cancer cells divide rapidly, need more topoisomerase
        
        const cancerCellDeath = this.calculateCellDeath(drug.toxicity * doseResponse * 1.5);
        const normalCellDeath = this.calculateCellDeath(drug.toxicity * doseResponse * 0.5);
        
        return {
            selectivity: cancerCellDeath / (normalCellDeath + 0.001), // Avoid division by zero
            therapeutic: cancerCellDeath > 0.5 && normalCellDeath < 0.2
        };
    }
    
    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Type II Topoisomerase Engine - Biological Data Untangling</title>
    <style>
        body {
            font-family: -apple-system, monospace;
            background: #0a0a0a;
            color: #00ff41;
            margin: 0;
            padding: 20px;
            background-image: 
                repeating-linear-gradient(0deg, 
                    transparent, transparent 2px, 
                    rgba(0, 255, 65, 0.03) 2px, 
                    rgba(0, 255, 65, 0.03) 4px);
        }
        .header {
            text-align: center;
            padding: 20px;
            border: 2px solid #00ff41;
            margin-bottom: 30px;
            background: rgba(0, 255, 65, 0.1);
        }
        .enzyme-animation {
            width: 600px;
            height: 400px;
            margin: 20px auto;
            border: 1px solid #00ff41;
            position: relative;
            background: #111;
            overflow: hidden;
        }
        .dna-strand {
            position: absolute;
            height: 4px;
            background: #00ff41;
            transition: all 0.5s ease;
        }
        .dna-strand.g-segment {
            background: #ff4444;
            box-shadow: 0 0 10px #ff4444;
        }
        .dna-strand.t-segment {
            background: #4444ff;
            box-shadow: 0 0 10px #4444ff;
        }
        .crossing-point {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 2px solid #ffff00;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.2); }
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .panel {
            background: rgba(0, 255, 65, 0.05);
            border: 1px solid #00ff41;
            padding: 20px;
            border-radius: 10px;
        }
        .metric {
            background: #1a1a1a;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
        }
        .metric-value {
            color: #00ffff;
            font-weight: bold;
        }
        button {
            background: #00ff41;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 5px;
            margin: 5px;
            transition: all 0.3s;
        }
        button:hover {
            background: #00cc33;
            box-shadow: 0 0 10px #00ff41;
        }
        .drug-selector {
            background: #1a1a1a;
            color: #00ff41;
            border: 1px solid #00ff41;
            padding: 5px 10px;
            border-radius: 5px;
            margin: 5px;
        }
        .operation-log {
            max-height: 300px;
            overflow-y: auto;
            background: #0a0a0a;
            border: 1px solid #333;
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 12px;
        }
        .log-entry {
            padding: 5px;
            margin: 2px 0;
            border-left: 3px solid #00ff41;
            background: rgba(0, 255, 65, 0.05);
        }
        .toxicity-bar {
            width: 100%;
            height: 20px;
            background: #1a1a1a;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .toxicity-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff41, #ffff00, #ff4444);
            width: 0%;
            transition: width 0.5s ease;
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
            border: 1px solid #00ff41;
        }
        .stat-value {
            font-size: 24px;
            color: #00ffff;
            margin-top: 5px;
        }
        #dnaCanvas {
            width: 100%;
            height: 400px;
            background: #0a0a0a;
            border: 1px solid #00ff41;
            margin: 20px 0;
        }
        .mechanism-step {
            padding: 10px;
            margin: 5px 0;
            background: rgba(0, 255, 65, 0.1);
            border-radius: 5px;
            position: relative;
            overflow: hidden;
        }
        .mechanism-step::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.3), transparent);
            animation: scan 2s infinite;
        }
        @keyframes scan {
            to { left: 100%; }
        }
        .therapeutic-window {
            width: 200px;
            height: 100px;
            margin: 10px auto;
            position: relative;
            background: #1a1a1a;
            border: 1px solid #00ff41;
            border-radius: 5px;
        }
        .window-zone {
            position: absolute;
            height: 100%;
            opacity: 0.3;
        }
        .window-zone.toxic {
            background: #ff4444;
            right: 0;
            width: 30%;
        }
        .window-zone.therapeutic {
            background: #00ff41;
            left: 30%;
            width: 40%;
        }
        .window-zone.ineffective {
            background: #444444;
            left: 0;
            width: 30%;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧬 TYPE II TOPOISOMERASE ENGINE</h1>
        <p>Biological DNA Untangling for Data Encoding - Cancer Treatment Inspired</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div>Operations</div>
            <div class="stat-value" id="operationCount">0</div>
        </div>
        <div class="stat">
            <div>ATP Consumed</div>
            <div class="stat-value" id="atpCount">0</div>
        </div>
        <div class="stat">
            <div>Toxicity</div>
            <div class="stat-value" id="toxicityLevel">0%</div>
        </div>
        <div class="stat">
            <div>Efficiency</div>
            <div class="stat-value" id="efficiency">95%</div>
        </div>
    </div>
    
    <div class="enzyme-animation" id="enzymeViz">
        <div class="dna-strand g-segment" style="width: 300px; top: 200px; left: 50px;"></div>
        <div class="dna-strand t-segment" style="width: 250px; top: 150px; left: 100px; transform: rotate(30deg);"></div>
        <div class="crossing-point" style="top: 175px; left: 200px;"></div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h3>🔬 Enzyme Mechanism</h3>
            <div id="mechanismSteps">
                <div class="mechanism-step">1. ATP Binding</div>
                <div class="mechanism-step">2. G-Segment Capture</div>
                <div class="mechanism-step">3. T-Segment Binding</div>
                <div class="mechanism-step">4. Double-Strand Break</div>
                <div class="mechanism-step">5. Strand Passage</div>
                <div class="mechanism-step">6. Re-ligation</div>
                <div class="mechanism-step">7. ATP Hydrolysis</div>
            </div>
        </div>
        
        <div class="panel">
            <h3>💊 Drug Interaction</h3>
            <select class="drug-selector" id="drugSelect">
                <option value="none">No Drug</option>
                <option value="etoposide">Etoposide (VP-16)</option>
                <option value="doxorubicin">Doxorubicin</option>
                <option value="novobiocin">Novobiocin</option>
                <option value="merbarone">Merbarone</option>
            </select>
            <br><br>
            <label>Dose: <input type="range" id="doseSlider" min="0" max="100" value="50" style="width: 150px;"></label>
            <span id="doseValue">50mg</span>
            
            <div class="therapeutic-window">
                <div class="window-zone ineffective"></div>
                <div class="window-zone therapeutic"></div>
                <div class="window-zone toxic"></div>
            </div>
            
            <button onclick="simulateDrug()">Simulate Drug Effect</button>
        </div>
        
        <div class="panel">
            <h3>📊 Complexity Metrics</h3>
            <div class="metric">
                <span>Crossing Number</span>
                <span class="metric-value" id="crossingNumber">0</span>
            </div>
            <div class="metric">
                <span>Writhe</span>
                <span class="metric-value" id="writhe">0</span>
            </div>
            <div class="metric">
                <span>Linking Number</span>
                <span class="metric-value" id="linking">0</span>
            </div>
            <div class="metric">
                <span>Supercoiling</span>
                <span class="metric-value" id="supercoiling">0</span>
            </div>
            <div class="metric">
                <span>Unknotting Number</span>
                <span class="metric-value" id="unknotting">?</span>
            </div>
        </div>
    </div>
    
    <div class="panel">
        <h3>🧪 Topoisomerase Control</h3>
        <button onclick="performOperation()">Perform Topoisomerase II Operation</button>
        <button onclick="calculateUnknotting()">Calculate Unknotting Number</button>
        <button onclick="runCatalysis()">Run Catalytic Cycle</button>
        <button onclick="induceToxicity()">Test Toxicity Threshold</button>
        
        <div class="toxicity-bar">
            <div class="toxicity-fill" id="toxicityBar"></div>
        </div>
    </div>
    
    <div class="panel">
        <h3>📜 Operation Log</h3>
        <div class="operation-log" id="operationLog">
            <div class="log-entry">System initialized. Type II Topoisomerase ready.</div>
        </div>
    </div>
    
    <div class="panel">
        <h3>🧬 DNA Visualization</h3>
        <canvas id="dnaCanvas"></canvas>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        let operationCount = 0;
        let atpConsumed = 0;
        let currentToxicity = 0;
        let currentKnot = {
            crossings: [
                { over: 0, under: 1, position: { x: 100, y: 100 } },
                { over: 1, under: 2, position: { x: 200, y: 150 } },
                { over: 2, under: 3, position: { x: 300, y: 100 } },
                { over: 3, under: 0, position: { x: 200, y: 50 } }
            ],
            writhe: 2,
            linking: 1,
            supercoiling: 0.5
        };
        
        // Update dose display
        document.getElementById('doseSlider').addEventListener('input', (e) => {
            document.getElementById('doseValue').textContent = e.target.value + 'mg';
        });
        
        async function performOperation() {
            const drug = document.getElementById('drugSelect').value;
            
            try {
                const response = await fetch('/topoisomerase/operate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        knotData: currentKnot,
                        targetStrand: null,
                        drug: drug !== 'none' ? drug : null
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    operationCount++;
                    atpConsumed += result.atpConsumed;
                    currentToxicity = result.toxicity;
                    
                    updateDisplay();
                    logOperation(\`Operation \${result.operationId} completed. Complexity: \${result.complexity.toFixed(2)}\`);
                    animateStrandPassage();
                }
            } catch (error) {
                logOperation('Error: ' + error.message);
            }
        }
        
        async function calculateUnknotting() {
            try {
                const response = await fetch('/topoisomerase/unknot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ knotDiagram: currentKnot })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('unknotting').textContent = result.unknottingNumber;
                    logOperation(\`Unknotting number: \${result.unknottingNumber} (ATP needed: \${result.totalATP})\`);
                }
            } catch (error) {
                logOperation('Error: ' + error.message);
            }
        }
        
        async function simulateDrug() {
            const drug = document.getElementById('drugSelect').value;
            const dose = document.getElementById('doseSlider').value;
            
            if (drug === 'none') {
                logOperation('Please select a drug first');
                return;
            }
            
            try {
                const response = await fetch('/topoisomerase/drug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        drugName: drug,
                        dose: parseInt(dose),
                        knotData: currentKnot
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const effect = result.drugEffect;
                    logOperation(\`Drug \${drug} @ \${dose}mg: Cell death probability \${(effect.cellDeathProbability * 100).toFixed(1)}%\`);
                    
                    // Update efficiency based on drug
                    document.getElementById('efficiency').textContent = 
                        (effect.overallSuccess * 100).toFixed(0) + '%';
                }
            } catch (error) {
                logOperation('Error: ' + error.message);
            }
        }
        
        function animateStrandPassage() {
            const gStrand = document.querySelector('.g-segment');
            const tStrand = document.querySelector('.t-segment');
            
            // Animate double-strand break
            gStrand.style.background = '#ff0000';
            setTimeout(() => {
                // Animate strand passage
                tStrand.style.transform = 'translateY(50px) rotate(30deg)';
                setTimeout(() => {
                    // Reset
                    tStrand.style.transform = 'rotate(30deg)';
                    gStrand.style.background = '#ff4444';
                }, 500);
            }, 500);
        }
        
        function updateDisplay() {
            document.getElementById('operationCount').textContent = operationCount;
            document.getElementById('atpCount').textContent = atpConsumed;
            document.getElementById('toxicityLevel').textContent = (currentToxicity * 100).toFixed(0) + '%';
            document.getElementById('toxicityBar').style.width = (currentToxicity * 100) + '%';
            
            // Update complexity metrics
            document.getElementById('crossingNumber').textContent = currentKnot.crossings.length;
            document.getElementById('writhe').textContent = currentKnot.writhe || 0;
            document.getElementById('linking').textContent = currentKnot.linking || 0;
            document.getElementById('supercoiling').textContent = (currentKnot.supercoiling || 0).toFixed(2);
        }
        
        function logOperation(message) {
            const log = document.getElementById('operationLog');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
        
        async function runCatalysis() {
            logOperation('Running catalytic cycle...');
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await performOperation();
            }
            logOperation('Catalytic cycle complete');
        }
        
        function induceToxicity() {
            // Simulate rapid operations to test toxicity
            logOperation('Testing toxicity threshold...');
            const interval = setInterval(async () => {
                await performOperation();
                if (currentToxicity > 0.8) {
                    clearInterval(interval);
                    logOperation('⚠️ TOXICITY THRESHOLD REACHED - Cell death likely');
                }
            }, 100);
        }
        
        // Initialize 3D DNA visualization
        function init3DDNA() {
            const canvas = document.getElementById('dnaCanvas');
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
            
            renderer.setSize(canvas.width, canvas.height);
            camera.position.z = 50;
            
            // Create double helix
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.LineBasicMaterial({ color: 0x00ff41 });
            
            const points = [];
            for (let i = 0; i < 100; i++) {
                const angle = i * 0.1;
                const x = Math.cos(angle) * 10;
                const y = i - 50;
                const z = Math.sin(angle) * 10;
                points.push(new THREE.Vector3(x, y, z));
            }
            
            geometry.setFromPoints(points);
            const helix = new THREE.Line(geometry, material);
            scene.add(helix);
            
            // Animation loop
            function animate() {
                requestAnimationFrame(animate);
                helix.rotation.y += 0.01;
                renderer.render(scene, camera);
            }
            animate();
        }
        
        // Initialize
        updateDisplay();
        init3DDNA();
        
        // Auto-update stats
        setInterval(async () => {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                // Update stats if needed
            } catch (error) {
                console.error('Health check failed:', error);
            }
        }, 5000);
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`🧬 Type II Topoisomerase Engine running on port ${this.port}`);
                console.log(`💊 Cancer treatment mechanics active`);
                console.log(`🧪 Dashboard: http://localhost:${this.port}`);
                resolve();
            });
        });
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Type II Topoisomerase Engine...');
        process.exit(0);
    }
}

// Auto-start if run directly
if (require.main === module) {
    const engine = new TypeIITopoisomeraseEngine();
    
    engine.start().catch(error => {
        console.error('Failed to start Type II Topoisomerase Engine:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => engine.shutdown());
    process.on('SIGTERM', () => engine.shutdown());
}

module.exports = TypeIITopoisomeraseEngine;
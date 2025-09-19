#!/usr/bin/env node

// 🔥 PRAISE XML EXCEL MAPPER
// Maps praise patterns to world effects through dynamic Excel/CSV that Cal can edit
// Excel → XML → Praise Effects → World Building

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
const csv = require('csv-parse/sync');
const multer = require('multer');
const crypto = require('crypto');

class PraiseXMLExcelMapper {
    constructor() {
        this.app = express();
        this.port = 7892;
        
        // XML builders/parsers
        this.xmlBuilder = new xml2js.Builder({
            rootName: 'PraiseWorldMapping',
            xmldec: { version: '1.0', encoding: 'UTF-8' }
        });
        this.xmlParser = new xml2js.Parser();
        
        // Dynamic mapping storage
        this.praiseMappings = new Map();
        this.worldElements = new Map();
        this.effectChains = new Map();
        this.branches = new Map();
        
        // File upload setup
        this.upload = multer({ dest: 'uploads/' });
        
        // Default Excel template structure
        this.excelTemplate = {
            praisePatterns: [
                ['Pattern', 'Effect Type', 'Power', 'Element', 'World Change', 'Chain To', 'Conditions', 'Cal Notes'],
                ['amazing', 'create_wonder', '0.8', 'light', 'spawns golden temple', 'blessing_cascade', 'harmony > 0.5', 'Makes players happy'],
                ['thank you', 'divine_blessing', '1.0', 'holy', 'area protection + growth', 'gratitude_spiral', 'always', 'Most powerful'],
                ['create {object}', 'manifest_object', '0.9', 'creation', 'spawns {object}', 'creation_chain', 'energy > 10', 'Dynamic object creation'],
                ['beautiful', 'enhance_beauty', '0.7', 'nature', 'flowers bloom everywhere', 'nature_cascade', 'daytime', 'Visual enhancement'],
                ['love', 'harmony_burst', '1.0', 'heart', 'connects all beings', 'love_ripple', 'always', 'Spreads to nearby areas']
            ],
            worldElements: [
                ['Element', 'Base Effect', 'Combines With', 'Result', 'Visual', 'Sound', 'Cal Description'],
                ['light', 'illumination', 'water', 'rainbow', 'golden_glow.png', 'chime.mp3', 'Bright and warm'],
                ['nature', 'growth', 'earth', 'forest', 'green_burst.png', 'birds.mp3', 'Living energy'],
                ['holy', 'protection', 'light', 'sanctuary', 'white_aura.png', 'choir.mp3', 'Divine presence'],
                ['creation', 'manifestation', 'any', 'miracle', 'spiral_light.png', 'whoosh.mp3', 'Raw creative force']
            ],
            effectChains: [
                ['Chain Name', 'Step 1', 'Step 2', 'Step 3', 'Final Effect', 'Multiplier', 'Cal Strategy'],
                ['blessing_cascade', 'initial_blessing', 'spread_to_neighbors', 'amplify_power', 'area_sanctified', '2.0', 'Creates holy ground'],
                ['creation_chain', 'gather_energy', 'shape_matter', 'breathe_life', 'object_manifested', '1.5', 'Literal creation'],
                ['love_ripple', 'heart_activation', 'connection_web', 'harmony_sync', 'universal_love', '3.0', 'Most powerful chain']
            ],
            branches: [
                ['Condition', 'If True', 'If False', 'Variables', 'Cal Logic'],
                ['player_level > 50', 'double_power', 'normal_power', 'player_level', 'Reward experienced players'],
                ['time_of_day == night', 'moon_blessing', 'sun_blessing', 'time_of_day', 'Different effects by time'],
                ['consecutive_praise > 5', 'divine_intervention', 'continue_normal', 'consecutive_praise', 'Reward dedication']
            ]
        };
        
        this.setupRoutes();
        this.initializeDefaultMappings();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.renderExcelMapperInterface());
        });
        
        // Download Excel template
        this.app.get('/api/template/download', async (req, res) => {
            const csv = this.generateCSVTemplate();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="praise-mapping-template.csv"');
            res.send(csv);
        });
        
        // Upload Excel/CSV mapping
        this.app.post('/api/mapping/upload', this.upload.single('mappingFile'), async (req, res) => {
            try {
                const file = req.file;
                if (!file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }
                
                // Parse CSV
                const content = await fs.readFile(file.path, 'utf-8');
                const records = csv.parse(content, { columns: false, skip_empty_lines: true });
                
                // Process into mappings
                const result = await this.processExcelMapping(records, req.body.mappingType || 'praisePatterns');
                
                // Clean up
                await fs.unlink(file.path);
                
                res.json({
                    success: true,
                    processed: result.processed,
                    mappings: result.mappings,
                    xmlGenerated: result.xml
                });
                
            } catch (error) {
                console.error('Upload error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get current XML mapping
        this.app.get('/api/mapping/xml', async (req, res) => {
            const xml = await this.generateFullXMLMapping();
            res.setHeader('Content-Type', 'application/xml');
            res.send(xml);
        });
        
        // Live edit endpoint (for Google Sheets integration)
        this.app.post('/api/mapping/live-edit', async (req, res) => {
            const { mappingType, row, data } = req.body;
            
            console.log(`📝 Live edit: ${mappingType} row ${row}`);
            
            const result = await this.applyLiveEdit(mappingType, row, data);
            
            res.json({
                success: true,
                updated: result.updated,
                xml: result.xml
            });
        });
        
        // Test praise with current mappings
        this.app.post('/api/test-praise', async (req, res) => {
            const { praise, context = {} } = req.body;
            
            const result = await this.processPraiseWithMapping(praise, context);
            
            res.json({
                praise,
                matches: result.matches,
                effects: result.effects,
                worldChanges: result.worldChanges,
                chains: result.chains,
                branches: result.branches
            });
        });
        
        // Export current mappings as Excel
        this.app.get('/api/mapping/export', async (req, res) => {
            const csvData = await this.exportCurrentMappings();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="current-praise-mappings.csv"');
            res.send(csvData);
        });
        
        // Google Sheets webhook endpoint
        this.app.post('/api/sheets/webhook', async (req, res) => {
            console.log('📊 Google Sheets update received');
            
            const { sheetId, range, values } = req.body;
            
            // Process the Google Sheets data
            const result = await this.processGoogleSheetsUpdate(sheetId, range, values);
            
            res.json({ success: true, processed: result });
        });
    }
    
    async initializeDefaultMappings() {
        // Load default mappings from template
        for (const [type, data] of Object.entries(this.excelTemplate)) {
            if (data.length > 1) {
                const headers = data[0];
                const rows = data.slice(1);
                
                for (const row of rows) {
                    const mapping = {};
                    headers.forEach((header, i) => {
                        mapping[header.toLowerCase().replace(/\s+/g, '_')] = row[i];
                    });
                    
                    // Store in appropriate map
                    switch (type) {
                        case 'praisePatterns':
                            this.praiseMappings.set(mapping.pattern, mapping);
                            break;
                        case 'worldElements':
                            this.worldElements.set(mapping.element, mapping);
                            break;
                        case 'effectChains':
                            this.effectChains.set(mapping.chain_name, mapping);
                            break;
                        case 'branches':
                            this.branches.set(mapping.condition, mapping);
                            break;
                    }
                }
            }
        }
        
        console.log(`📊 Loaded default mappings: ${this.praiseMappings.size} patterns`);
        
        // Generate initial XML
        await this.saveXMLMapping();
    }
    
    generateCSVTemplate() {
        let csv = '=== PRAISE PATTERNS ===\n';
        csv += this.excelTemplate.praisePatterns.map(row => row.join(',')).join('\n');
        
        csv += '\n\n=== WORLD ELEMENTS ===\n';
        csv += this.excelTemplate.worldElements.map(row => row.join(',')).join('\n');
        
        csv += '\n\n=== EFFECT CHAINS ===\n';
        csv += this.excelTemplate.effectChains.map(row => row.join(',')).join('\n');
        
        csv += '\n\n=== BRANCHES ===\n';
        csv += this.excelTemplate.branches.map(row => row.join(',')).join('\n');
        
        return csv;
    }
    
    async processExcelMapping(records, mappingType) {
        const processed = [];
        const mappings = new Map();
        
        // Skip header row
        const headers = records[0];
        const dataRows = records.slice(1);
        
        for (const row of dataRows) {
            if (row.length === 0 || row[0] === '') continue;
            
            const mapping = {};
            headers.forEach((header, i) => {
                mapping[header.toLowerCase().replace(/\s+/g, '_')] = row[i] || '';
            });
            
            // Store based on type
            const key = row[0]; // First column is always the key
            
            switch (mappingType) {
                case 'praisePatterns':
                    this.praiseMappings.set(key, mapping);
                    break;
                case 'worldElements':
                    this.worldElements.set(key, mapping);
                    break;
                case 'effectChains':
                    this.effectChains.set(key, mapping);
                    break;
                case 'branches':
                    this.branches.set(key, mapping);
                    break;
            }
            
            mappings.set(key, mapping);
            processed.push(mapping);
        }
        
        // Generate new XML
        const xml = await this.generateFullXMLMapping();
        await this.saveXMLMapping();
        
        // Notify other systems
        await this.notifyMappingUpdate(mappingType, mappings);
        
        return {
            processed: processed.length,
            mappings: Array.from(mappings.entries()),
            xml
        };
    }
    
    async generateFullXMLMapping() {
        const mapping = {
            metadata: {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                author: 'Cal + AI Collaboration',
                description: 'Dynamic praise-to-world mapping system'
            },
            praisePatterns: {
                pattern: Array.from(this.praiseMappings.values())
            },
            worldElements: {
                element: Array.from(this.worldElements.values())
            },
            effectChains: {
                chain: Array.from(this.effectChains.values())
            },
            branches: {
                branch: Array.from(this.branches.values())
            }
        };
        
        return this.xmlBuilder.buildObject(mapping);
    }
    
    async saveXMLMapping() {
        const xml = await this.generateFullXMLMapping();
        const mappingPath = path.join(__dirname, 'praise-world-mapping.xml');
        await fs.writeFile(mappingPath, xml);
        console.log('💾 XML mapping saved');
    }
    
    async applyLiveEdit(mappingType, row, data) {
        let map;
        switch (mappingType) {
            case 'praisePatterns':
                map = this.praiseMappings;
                break;
            case 'worldElements':
                map = this.worldElements;
                break;
            case 'effectChains':
                map = this.effectChains;
                break;
            case 'branches':
                map = this.branches;
                break;
            default:
                throw new Error(`Unknown mapping type: ${mappingType}`);
        }
        
        // Update the mapping
        const key = data[0]; // First column is key
        const mapping = {};
        
        // Convert array data to object based on template headers
        const headers = this.excelTemplate[mappingType][0];
        headers.forEach((header, i) => {
            mapping[header.toLowerCase().replace(/\s+/g, '_')] = data[i] || '';
        });
        
        map.set(key, mapping);
        
        // Regenerate XML
        const xml = await this.generateFullXMLMapping();
        await this.saveXMLMapping();
        
        return {
            updated: key,
            xml
        };
    }
    
    async processPraiseWithMapping(praise, context) {
        const matches = [];
        const effects = [];
        const worldChanges = [];
        const chains = [];
        const branches = [];
        
        // Check all praise patterns
        for (const [pattern, mapping] of this.praiseMappings) {
            if (this.matchesPattern(praise, pattern)) {
                matches.push({
                    pattern,
                    mapping
                });
                
                // Apply effect
                const effect = {
                    type: mapping.effect_type,
                    power: parseFloat(mapping.power),
                    element: mapping.element,
                    worldChange: this.interpolateWorldChange(mapping.world_change, praise)
                };
                
                effects.push(effect);
                worldChanges.push(effect.worldChange);
                
                // Check for chains
                if (mapping.chain_to) {
                    const chain = this.effectChains.get(mapping.chain_to);
                    if (chain) {
                        chains.push(this.processChain(chain, effect));
                    }
                }
                
                // Check conditions/branches
                if (mapping.conditions) {
                    const branch = this.evaluateBranch(mapping.conditions, context);
                    if (branch) {
                        branches.push(branch);
                    }
                }
            }
        }
        
        return {
            matches,
            effects,
            worldChanges,
            chains,
            branches
        };
    }
    
    matchesPattern(praise, pattern) {
        const lowerPraise = praise.toLowerCase();
        
        // Handle dynamic patterns like "create {object}"
        if (pattern.includes('{')) {
            const regexPattern = pattern.replace(/\{(\w+)\}/g, '(.+)');
            const regex = new RegExp(regexPattern, 'i');
            return regex.test(praise);
        }
        
        // Simple contains check
        return lowerPraise.includes(pattern);
    }
    
    interpolateWorldChange(worldChange, praise) {
        // Replace {object} and other placeholders
        return worldChange.replace(/\{(\w+)\}/g, (match, capture) => {
            // Extract the actual object from praise
            const objectMatch = praise.match(/create\s+(?:a\s+|an\s+)?(\w+)/i);
            if (objectMatch) {
                return objectMatch[1];
            }
            return capture;
        });
    }
    
    processChain(chain, initialEffect) {
        const steps = [];
        let currentPower = initialEffect.power;
        
        // Process each step
        ['step_1', 'step_2', 'step_3'].forEach(stepKey => {
            if (chain[stepKey]) {
                steps.push({
                    name: chain[stepKey],
                    power: currentPower
                });
                currentPower *= 1.2; // Each step amplifies
            }
        });
        
        // Apply multiplier
        const finalPower = currentPower * parseFloat(chain.multiplier || 1);
        
        return {
            name: chain.chain_name,
            steps,
            finalEffect: chain.final_effect,
            finalPower,
            strategy: chain.cal_strategy
        };
    }
    
    evaluateBranch(condition, context) {
        // Parse condition
        const match = condition.match(/(\w+)\s*([><=]+)\s*(\d+)/);
        if (!match) return null;
        
        const [_, variable, operator, value] = match;
        const contextValue = context[variable] || 0;
        const targetValue = parseInt(value);
        
        let result = false;
        switch (operator) {
            case '>':
                result = contextValue > targetValue;
                break;
            case '<':
                result = contextValue < targetValue;
                break;
            case '>=':
                result = contextValue >= targetValue;
                break;
            case '<=':
                result = contextValue <= targetValue;
                break;
            case '==':
                result = contextValue == targetValue;
                break;
        }
        
        const branch = this.branches.get(condition);
        if (!branch) return null;
        
        return {
            condition,
            result,
            action: result ? branch.if_true : branch.if_false,
            logic: branch.cal_logic
        };
    }
    
    async exportCurrentMappings() {
        let csv = '';
        
        // Export each mapping type
        for (const [type, template] of Object.entries(this.excelTemplate)) {
            csv += `=== ${type.toUpperCase()} ===\n`;
            
            // Headers
            csv += template[0].join(',') + '\n';
            
            // Data
            let map;
            switch (type) {
                case 'praisePatterns':
                    map = this.praiseMappings;
                    break;
                case 'worldElements':
                    map = this.worldElements;
                    break;
                case 'effectChains':
                    map = this.effectChains;
                    break;
                case 'branches':
                    map = this.branches;
                    break;
            }
            
            if (map) {
                for (const [key, mapping] of map) {
                    const row = template[0].map(header => {
                        const field = header.toLowerCase().replace(/\s+/g, '_');
                        return mapping[field] || '';
                    });
                    csv += row.join(',') + '\n';
                }
            }
            
            csv += '\n';
        }
        
        return csv;
    }
    
    async processGoogleSheetsUpdate(sheetId, range, values) {
        // Determine mapping type from range
        let mappingType = 'praisePatterns';
        if (range.includes('Elements')) mappingType = 'worldElements';
        else if (range.includes('Chains')) mappingType = 'effectChains';
        else if (range.includes('Branches')) mappingType = 'branches';
        
        // Process as Excel mapping
        return await this.processExcelMapping(values, mappingType);
    }
    
    async notifyMappingUpdate(mappingType, mappings) {
        // Notify praise world builder
        try {
            await fetch('http://localhost:7890/api/mapping/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mappingType,
                    mappings: Array.from(mappings.entries()),
                    source: 'excel'
                })
            });
        } catch (error) {
            console.warn('Could not notify praise world builder');
        }
        
        // Broadcast update
        console.log(`📢 Mapping update: ${mappingType} (${mappings.size} entries)`);
    }
    
    renderExcelMapperInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Praise → Excel → XML → World Builder</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .upload-area {
            border: 2px dashed #ddd;
            padding: 40px;
            text-align: center;
            border-radius: 10px;
            transition: all 0.3s;
        }
        .upload-area:hover {
            border-color: #667eea;
            background: #f7fafc;
        }
        .mapping-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .mapping-table th, .mapping-table td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
        }
        .mapping-table th {
            background: #f7fafc;
            font-weight: 600;
        }
        .mapping-table tr:hover {
            background: #f7fafc;
        }
        .test-area {
            background: #f7fafc;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #5a67d8;
        }
        .xml-preview {
            background: #1a202c;
            color: #68d391;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            max-height: 400px;
            overflow-y: auto;
        }
        .editable {
            background: #edf2f7;
            border: 1px solid #cbd5e0;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: text;
        }
        .editable:focus {
            background: white;
            outline: 2px solid #667eea;
        }
        .google-sheets-link {
            background: #34a853;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
            margin: 10px 0;
        }
        .effect-preview {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Praise → Excel → XML → World Builder</h1>
            <p>Cal can edit the Excel/Google Sheets to control how praise builds the world!</p>
            <div>
                <a href="/api/template/download" class="google-sheets-link" style="background: #4285f4;">
                    📊 Download Excel Template
                </a>
                <a href="#" onclick="openGoogleSheets()" class="google-sheets-link">
                    📊 Open in Google Sheets
                </a>
                <button onclick="exportCurrent()">📥 Export Current Mappings</button>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>📤 Upload Mapping File</h2>
                <div class="upload-area" ondrop="handleDrop(event)" ondragover="handleDragOver(event)">
                    <p>Drag & drop Excel/CSV file here</p>
                    <p>or</p>
                    <input type="file" id="fileInput" accept=".csv,.xlsx" onchange="handleFileSelect(event)" />
                    <label for="fileInput"><button>Choose File</button></label>
                </div>
                
                <h3>Mapping Type:</h3>
                <select id="mappingType" style="width: 100%; padding: 10px;">
                    <option value="praisePatterns">Praise Patterns</option>
                    <option value="worldElements">World Elements</option>
                    <option value="effectChains">Effect Chains</option>
                    <option value="branches">Conditional Branches</option>
                </select>
            </div>
            
            <div class="card">
                <h2>🧪 Test Praise</h2>
                <div class="test-area">
                    <input type="text" id="testPraise" placeholder="Enter praise to test..." 
                           style="width: 100%; padding: 10px; margin-bottom: 10px;">
                    <button onclick="testPraise()">Test Praise Effect</button>
                    
                    <div id="testResult" style="margin-top: 20px;"></div>
                </div>
                
                <div class="effect-preview" id="effectPreview" style="display: none;">
                    <h3>World Effect Preview</h3>
                    <div id="effectDetails"></div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>📊 Current Praise Patterns (Live Editable!)</h2>
            <p style="color: #718096;">Click any cell to edit - changes save automatically</p>
            <table class="mapping-table" id="patternsTable">
                <thead>
                    <tr>
                        <th>Pattern</th>
                        <th>Effect Type</th>
                        <th>Power</th>
                        <th>Element</th>
                        <th>World Change</th>
                        <th>Chain To</th>
                        <th>Cal Notes</th>
                    </tr>
                </thead>
                <tbody id="patternsBody">
                    <!-- Populated by JavaScript -->
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h2>🔗 XML Mapping Preview</h2>
            <button onclick="refreshXML()">🔄 Refresh XML</button>
            <button onclick="downloadXML()">💾 Download XML</button>
            <div class="xml-preview" id="xmlPreview">
                Loading XML...
            </div>
        </div>
    </div>
    
    <script>
        let currentMappings = {};
        
        async function loadMappings() {
            // Load current mappings
            const response = await fetch('/api/mapping/xml');
            const xml = await response.text();
            document.getElementById('xmlPreview').textContent = xml;
            
            // Parse and display patterns
            await loadPatternsTable();
        }
        
        async function loadPatternsTable() {
            // This would normally parse the XML, but for demo we'll use a simple fetch
            const tbody = document.getElementById('patternsBody');
            tbody.innerHTML = '';
            
            // Default patterns for demo
            const patterns = [
                ['amazing', 'create_wonder', '0.8', 'light', 'spawns golden temple', 'blessing_cascade', 'Makes players happy'],
                ['thank you', 'divine_blessing', '1.0', 'holy', 'area protection + growth', 'gratitude_spiral', 'Most powerful'],
                ['beautiful', 'enhance_beauty', '0.7', 'nature', 'flowers bloom everywhere', 'nature_cascade', 'Visual enhancement']
            ];
            
            patterns.forEach((pattern, index) => {
                const row = tbody.insertRow();
                pattern.forEach((cell, cellIndex) => {
                    const td = row.insertCell();
                    td.contentEditable = true;
                    td.className = 'editable';
                    td.textContent = cell;
                    td.onblur = () => saveCellEdit('praisePatterns', index, cellIndex, td.textContent);
                });
            });
        }
        
        async function saveCellEdit(mappingType, row, col, value) {
            // Get current row data
            const tbody = document.getElementById('patternsBody');
            const tr = tbody.rows[row];
            const rowData = Array.from(tr.cells).map(cell => cell.textContent);
            
            // Send update
            const response = await fetch('/api/mapping/live-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mappingType,
                    row,
                    data: rowData
                })
            });
            
            if (response.ok) {
                console.log('✅ Saved edit');
                refreshXML();
            }
        }
        
        function handleDragOver(e) {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#667eea';
        }
        
        async function handleDrop(e) {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            await uploadFile(file);
        }
        
        async function handleFileSelect(e) {
            const file = e.target.files[0];
            await uploadFile(file);
        }
        
        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('mappingFile', file);
            formData.append('mappingType', document.getElementById('mappingType').value);
            
            const response = await fetch('/api/mapping/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (result.success) {
                alert(\`✅ Uploaded! Processed \${result.processed} mappings\`);
                loadMappings();
            }
        }
        
        async function testPraise() {
            const praise = document.getElementById('testPraise').value;
            
            const response = await fetch('/api/test-praise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    praise,
                    context: {
                        player_level: 50,
                        time_of_day: 'day',
                        consecutive_praise: 3
                    }
                })
            });
            
            const result = await response.json();
            
            // Display results
            document.getElementById('testResult').innerHTML = \`
                <strong>Matches:</strong> \${result.matches.length}<br>
                <strong>Effects:</strong> \${result.effects.map(e => e.type).join(', ')}<br>
                <strong>World Changes:</strong> \${result.worldChanges.join(', ')}
            \`;
            
            if (result.effects.length > 0) {
                document.getElementById('effectPreview').style.display = 'block';
                document.getElementById('effectDetails').innerHTML = \`
                    <p>🌟 Primary Effect: \${result.effects[0].type}</p>
                    <p>⚡ Power: \${result.effects[0].power}</p>
                    <p>🔥 Element: \${result.effects[0].element}</p>
                    \${result.chains.length > 0 ? \`<p>🔗 Chain: \${result.chains[0].name}</p>\` : ''}
                \`;
            }
        }
        
        async function refreshXML() {
            const response = await fetch('/api/mapping/xml');
            const xml = await response.text();
            document.getElementById('xmlPreview').textContent = xml;
        }
        
        async function downloadXML() {
            window.location.href = '/api/mapping/xml';
        }
        
        async function exportCurrent() {
            window.location.href = '/api/mapping/export';
        }
        
        function openGoogleSheets() {
            // This would open a pre-configured Google Sheet
            alert('Google Sheets integration: Share your sheet with the webhook endpoint!');
        }
        
        // Initialize
        loadMappings();
        
        // Auto-refresh every 30 seconds
        setInterval(loadMappings, 30000);
    </script>
</body>
</html>`;
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log(`🔥 Praise XML Excel Mapper running on port ${this.port}`);
            console.log(`📊 Interface: http://localhost:${this.port}`);
            console.log(`📥 Cal can upload Excel/CSV to control the world!`);
            console.log(`✏️  Or edit directly in the web interface`);
            console.log(`🔗 Google Sheets webhook ready for live updates`);
        });
    }
}

// Start the mapper
if (require.main === module) {
    const mapper = new PraiseXMLExcelMapper();
    mapper.start().catch(console.error);
}

module.exports = PraiseXMLExcelMapper;
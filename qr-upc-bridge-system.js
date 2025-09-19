#!/usr/bin/env node

/**
 * 🔗 QR-UPC BRIDGE SYSTEM
 * Collapse QRs into embedded UPCs and back to QRs or files
 * Multi-layer data encoding/decoding bridge
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class QRUPCBridgeSystem {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 8099;
        
        // Data layer management
        this.dataLayers = {
            qr: new Map(),          // QR code data
            upc: new Map(),         // UPC/barcode data
            files: new Map(),       // File embeddings
            collapsed: new Map(),   // Collapsed data structures
            bridges: new Map()      // Cross-format bridges
        };
        
        // Encoding/decoding strategies
        this.encoders = {
            qr_to_upc: this.encodeQRToUPC.bind(this),
            upc_to_qr: this.encodeUPCToQR.bind(this),
            file_to_qr: this.encodeFileToQR.bind(this),
            qr_to_file: this.encodeQRToFile.bind(this),
            collapse_all: this.collapseAllFormats.bind(this),
            expand_all: this.expandAllFormats.bind(this)
        };
        
        console.log('🔗 QR-UPC Bridge System initializing...');
        console.log('📊 Multi-layer data conversion ready');
        this.init();
    }
    
    init() {
        this.setupExpress();
        this.setupWebSocket();
        this.generateSampleData();
        
        this.server.listen(this.port, () => {
            console.log(`🔗 QR-UPC Bridge System: http://localhost:${this.port}`);
            console.log('🔄 Features:');
            console.log('   • QR ↔ UPC conversion');
            console.log('   • File embedding/extraction');
            console.log('   • Multi-layer data collapse');
            console.log('   • Format bridging');
            console.log('   • Real-time conversion');
        });
    }
    
    setupExpress() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
        
        this.app.get('/', (req, res) => {
            res.send(this.getBridgeSystemHTML());
        });
        
        // API endpoints for conversion
        this.app.post('/api/convert', (req, res) => {
            try {
                const { from, to, data, options = {} } = req.body;
                const result = this.convertData(from, to, data, options);
                res.json({ success: true, result, format: to });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        this.app.post('/api/collapse', (req, res) => {
            try {
                const { dataLayers, method = 'default' } = req.body;
                const collapsed = this.collapseDataLayers(dataLayers, method);
                res.json({ success: true, collapsed, id: this.generateCollapseId() });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        this.app.get('/api/expand/:id', (req, res) => {
            try {
                const expanded = this.expandCollapsedData(req.params.id);
                res.json({ success: true, expanded });
            } catch (error) {
                res.status(404).json({ success: false, error: 'Collapsed data not found' });
            }
        });
        
        this.app.get('/api/status', (req, res) => {
            res.json({
                qr_count: this.dataLayers.qr.size,
                upc_count: this.dataLayers.upc.size,
                file_count: this.dataLayers.files.size,
                collapsed_count: this.dataLayers.collapsed.size,
                bridge_count: this.dataLayers.bridges.size,
                available_conversions: Object.keys(this.encoders)
            });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔗 Client connected to bridge system');
            
            ws.send(JSON.stringify({
                type: 'bridge_init',
                status: 'connected',
                capabilities: Object.keys(this.encoders)
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleBridgeCommand(data, ws);
                } catch (e) {
                    console.log('Invalid bridge command:', e);
                }
            });
        });
    }
    
    handleBridgeCommand(data, ws) {
        const { type, payload } = data;
        
        switch (type) {
            case 'convert_realtime':
                const result = this.convertData(payload.from, payload.to, payload.data);
                ws.send(JSON.stringify({
                    type: 'conversion_result',
                    result,
                    id: payload.id
                }));
                break;
                
            case 'collapse_layers':
                const collapsed = this.collapseDataLayers(payload.layers);
                ws.send(JSON.stringify({
                    type: 'collapse_result',
                    collapsed,
                    id: this.generateCollapseId()
                }));
                break;
                
            case 'bridge_scan':
                this.scanForBridgeableData(ws);
                break;
        }
    }
    
    convertData(from, to, data, options = {}) {
        const converterKey = `${from}_to_${to}`;
        
        if (!this.encoders[converterKey]) {
            throw new Error(`No converter available for ${from} to ${to}`);
        }
        
        return this.encoders[converterKey](data, options);
    }
    
    // QR to UPC conversion
    encodeQRToUPC(qrData, options = {}) {
        console.log('🔄 Converting QR to UPC format...');
        
        // Convert QR data to UPC-compatible format
        const hash = crypto.createHash('md5').update(qrData).digest('hex');
        const upcNumber = this.hashToUPC(hash);
        
        const upcData = {
            number: upcNumber,
            originalData: qrData,
            encoding: 'qr_embedded',
            timestamp: Date.now(),
            checksum: this.calculateUPCChecksum(upcNumber)
        };
        
        // Store in UPC layer
        this.dataLayers.upc.set(upcNumber, upcData);
        
        return {
            upc: upcNumber,
            displayFormat: this.formatUPCDisplay(upcNumber),
            embedded: true,
            originalLength: qrData.length
        };
    }
    
    // UPC to QR conversion
    encodeUPCToQR(upcNumber, options = {}) {
        console.log('🔄 Converting UPC to QR format...');
        
        // Check if this UPC has embedded QR data
        const upcData = this.dataLayers.upc.get(upcNumber);
        
        if (upcData && upcData.encoding === 'qr_embedded') {
            // Restore original QR data
            return {
                qr: upcData.originalData,
                restored: true,
                timestamp: upcData.timestamp
            };
        }
        
        // Generate QR from UPC
        const qrData = JSON.stringify({
            type: 'upc_bridge',
            upc: upcNumber,
            generated: Date.now(),
            bridge_id: this.generateBridgeId()
        });
        
        this.dataLayers.qr.set(this.generateQRId(), qrData);
        
        return {
            qr: qrData,
            generated: true,
            source: 'upc'
        };
    }
    
    // File to QR conversion
    encodeFileToQR(filePath, options = {}) {
        console.log(`🔄 Embedding file ${filePath} into QR...`);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        const fileContent = fs.readFileSync(filePath);
        const base64Content = fileContent.toString('base64');
        const fileInfo = {
            name: path.basename(filePath),
            size: fileContent.length,
            type: path.extname(filePath),
            content: base64Content,
            embedded: Date.now()
        };
        
        const qrData = JSON.stringify({
            type: 'file_embed',
            file: fileInfo,
            bridge_id: this.generateBridgeId()
        });
        
        const qrId = this.generateQRId();
        this.dataLayers.qr.set(qrId, qrData);
        this.dataLayers.files.set(qrId, fileInfo);
        
        return {
            qr: qrData,
            fileSize: fileContent.length,
            compression: (base64Content.length / fileContent.length).toFixed(2)
        };
    }
    
    // QR to File conversion
    encodeQRToFile(qrData, options = {}) {
        console.log('🔄 Extracting file from QR...');
        
        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch (e) {
            throw new Error('Invalid QR data format');
        }
        
        if (parsedData.type !== 'file_embed') {
            throw new Error('QR does not contain file data');
        }
        
        const fileInfo = parsedData.file;
        const outputPath = options.outputPath || `./${fileInfo.name}`;
        
        const fileContent = Buffer.from(fileInfo.content, 'base64');
        fs.writeFileSync(outputPath, fileContent);
        
        return {
            extracted: true,
            path: outputPath,
            size: fileInfo.size,
            originalName: fileInfo.name
        };
    }
    
    // Collapse all formats into unified structure
    collapseAllFormats(dataSet, options = {}) {
        console.log('🗜️ Collapsing all data formats...');
        
        const collapsed = {
            id: this.generateCollapseId(),
            timestamp: Date.now(),
            layers: {
                qr: Array.from(this.dataLayers.qr.entries()),
                upc: Array.from(this.dataLayers.upc.entries()),
                files: Array.from(this.dataLayers.files.entries())
            },
            compression: options.compression || 'gzip',
            metadata: {
                totalItems: this.getTotalItemCount(),
                bridges: Array.from(this.dataLayers.bridges.keys())
            }
        };
        
        const compressedData = this.compressData(collapsed);
        this.dataLayers.collapsed.set(collapsed.id, compressedData);
        
        return {
            id: collapsed.id,
            size: JSON.stringify(compressedData).length,
            originalSize: JSON.stringify(collapsed).length,
            compressionRatio: (JSON.stringify(compressedData).length / JSON.stringify(collapsed).length).toFixed(2)
        };
    }
    
    // Expand collapsed data back to original formats
    expandAllFormats(collapsedId, options = {}) {
        console.log(`🔓 Expanding collapsed data ${collapsedId}...`);
        
        const compressedData = this.dataLayers.collapsed.get(collapsedId);
        if (!compressedData) {
            throw new Error('Collapsed data not found');
        }
        
        const expanded = this.decompressData(compressedData);
        
        // Restore to individual layers
        if (options.restore) {
            expanded.layers.qr.forEach(([key, value]) => {
                this.dataLayers.qr.set(key, value);
            });
            expanded.layers.upc.forEach(([key, value]) => {
                this.dataLayers.upc.set(key, value);
            });
            expanded.layers.files.forEach(([key, value]) => {
                this.dataLayers.files.set(key, value);
            });
        }
        
        return expanded;
    }
    
    // Helper methods
    collapseDataLayers(layers, method = 'default') {
        const collapseId = this.generateCollapseId();
        
        const collapsed = {
            id: collapseId,
            method,
            layers,
            timestamp: Date.now(),
            bridges: this.findDataBridges(layers)
        };
        
        this.dataLayers.collapsed.set(collapseId, collapsed);
        return collapsed;
    }
    
    expandCollapsedData(id) {
        const collapsed = this.dataLayers.collapsed.get(id);
        if (!collapsed) {
            throw new Error('Collapsed data not found');
        }
        
        return collapsed;
    }
    
    findDataBridges(layers) {
        const bridges = [];
        
        // Find connections between QR and UPC data
        for (const [qrId, qrData] of this.dataLayers.qr) {
            for (const [upcId, upcData] of this.dataLayers.upc) {
                if (this.isDataBridged(qrData, upcData)) {
                    bridges.push({
                        type: 'qr_upc_bridge',
                        qr: qrId,
                        upc: upcId,
                        strength: this.calculateBridgeStrength(qrData, upcData)
                    });
                }
            }
        }
        
        return bridges;
    }
    
    isDataBridged(data1, data2) {
        // Simple heuristic - check for common patterns
        const str1 = typeof data1 === 'string' ? data1 : JSON.stringify(data1);
        const str2 = typeof data2 === 'string' ? data2 : JSON.stringify(data2);
        
        return str1.includes('bridge') || str2.includes('bridge') || 
               str1.includes(str2.substring(0, 10)) || str2.includes(str1.substring(0, 10));
    }
    
    calculateBridgeStrength(data1, data2) {
        // Calculate similarity score
        const str1 = typeof data1 === 'string' ? data1 : JSON.stringify(data1);
        const str2 = typeof data2 === 'string' ? data2 : JSON.stringify(data2);
        
        let commonChars = 0;
        const minLength = Math.min(str1.length, str2.length);
        
        for (let i = 0; i < minLength; i++) {
            if (str1[i] === str2[i]) commonChars++;
        }
        
        return commonChars / minLength;
    }
    
    hashToUPC(hash) {
        // Convert hash to 12-digit UPC number
        const numbers = hash.replace(/[^0-9]/g, '');
        return numbers.substring(0, 12).padEnd(12, '0');
    }
    
    calculateUPCChecksum(upcNumber) {
        const digits = upcNumber.split('').map(Number);
        let sum = 0;
        
        for (let i = 0; i < 11; i++) {
            sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        
        return (10 - (sum % 10)) % 10;
    }
    
    formatUPCDisplay(upcNumber) {
        return `${upcNumber.substring(0, 1)} ${upcNumber.substring(1, 6)} ${upcNumber.substring(6, 11)} ${upcNumber.substring(11)}`;
    }
    
    compressData(data) {
        // Simple compression simulation
        const jsonString = JSON.stringify(data);
        return {
            compressed: Buffer.from(jsonString).toString('base64'),
            originalSize: jsonString.length,
            method: 'base64'
        };
    }
    
    decompressData(compressedData) {
        const jsonString = Buffer.from(compressedData.compressed, 'base64').toString();
        return JSON.parse(jsonString);
    }
    
    generateCollapseId() {
        return 'collapse_' + crypto.randomBytes(8).toString('hex');
    }
    
    generateBridgeId() {
        return 'bridge_' + crypto.randomBytes(6).toString('hex');
    }
    
    generateQRId() {
        return 'qr_' + crypto.randomBytes(6).toString('hex');
    }
    
    getTotalItemCount() {
        return this.dataLayers.qr.size + this.dataLayers.upc.size + this.dataLayers.files.size;
    }
    
    scanForBridgeableData(ws) {
        const bridges = this.findDataBridges();
        ws.send(JSON.stringify({
            type: 'bridge_scan_result',
            bridges,
            count: bridges.length
        }));
    }
    
    generateSampleData() {
        // Generate some sample QR and UPC data for testing
        const sampleData = [
            { type: 'qr', data: 'https://example.com/product/123' },
            { type: 'qr', data: JSON.stringify({ id: 'test123', value: 'sample data' }) },
            { type: 'upc', data: '123456789012' },
            { type: 'upc', data: '987654321098' }
        ];
        
        sampleData.forEach((item, index) => {
            if (item.type === 'qr') {
                this.dataLayers.qr.set(`sample_qr_${index}`, item.data);
            } else if (item.type === 'upc') {
                const upcData = {
                    number: item.data,
                    originalData: `Sample UPC ${index}`,
                    encoding: 'standard',
                    timestamp: Date.now()
                };
                this.dataLayers.upc.set(item.data, upcData);
            }
        });
        
        console.log(`🔄 Generated ${sampleData.length} sample data items`);
    }
    
    getBridgeSystemHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🔗 QR-UPC Bridge System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: #fff;
            overflow-x: hidden;
        }
        
        .bridge-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 15px;
            border: 2px solid #4a9eff;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 15px;
            background: linear-gradient(45deg, #4a9eff, #9a4aff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .conversion-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .converter-card {
            background: rgba(74, 158, 255, 0.1);
            border: 2px solid #4a9eff;
            border-radius: 12px;
            padding: 25px;
            transition: all 0.3s ease;
        }
        
        .converter-card:hover {
            background: rgba(74, 158, 255, 0.2);
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(74, 158, 255, 0.3);
        }
        
        .converter-title {
            font-size: 1.3em;
            margin-bottom: 15px;
            color: #4a9eff;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .input-group {
            margin-bottom: 15px;
        }
        
        .input-group label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
        }
        
        .input-group input,
        .input-group textarea,
        .input-group select {
            width: 100%;
            padding: 10px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #4a9eff;
            border-radius: 6px;
            color: #fff;
            font-family: inherit;
        }
        
        .convert-btn {
            background: linear-gradient(135deg, #4a9eff, #9a4aff);
            border: none;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            width: 100%;
            transition: all 0.3s;
        }
        
        .convert-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(74, 158, 255, 0.4);
        }
        
        .result-area {
            margin-top: 15px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 6px;
            border: 1px solid #4a9eff;
            min-height: 80px;
            word-break: break-all;
            font-size: 0.9em;
        }
        
        .collapse-section {
            background: rgba(154, 74, 255, 0.1);
            border: 2px solid #9a4aff;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .collapse-title {
            font-size: 1.5em;
            color: #9a4aff;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .status-card {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #4a9eff;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .status-value {
            font-size: 2em;
            color: #4aff9a;
            margin-bottom: 5px;
        }
        
        .status-label {
            color: #ccc;
            font-size: 0.9em;
        }
        
        .bridge-visualizer {
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ff4a9a;
            border-radius: 12px;
            padding: 25px;
            margin-top: 30px;
        }
        
        .bridge-node {
            display: inline-block;
            background: rgba(74, 158, 255, 0.3);
            border: 1px solid #4a9eff;
            border-radius: 8px;
            padding: 10px 15px;
            margin: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .bridge-node:hover {
            background: rgba(74, 158, 255, 0.6);
            transform: scale(1.05);
        }
        
        .connection-line {
            display: inline-block;
            width: 40px;
            height: 2px;
            background: #ff4a9a;
            margin: 0 10px;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    <div class="bridge-container">
        <div class="header">
            <h1>🔗 QR-UPC Bridge System</h1>
            <p>Multi-layer data conversion and collapse system</p>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <div class="status-value" id="qr-count">0</div>
                <div class="status-label">QR Codes</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="upc-count">0</div>
                <div class="status-label">UPC Codes</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="file-count">0</div>
                <div class="status-label">Files</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="collapsed-count">0</div>
                <div class="status-label">Collapsed</div>
            </div>
        </div>
        
        <div class="conversion-grid">
            <div class="converter-card">
                <div class="converter-title">
                    🔄 QR ↔ UPC Converter
                </div>
                <div class="input-group">
                    <label>Input Data:</label>
                    <textarea id="qr-upc-input" rows="3" placeholder="Enter QR data or UPC number..."></textarea>
                </div>
                <div class="input-group">
                    <label>Conversion Type:</label>
                    <select id="qr-upc-type">
                        <option value="qr_to_upc">QR to UPC</option>
                        <option value="upc_to_qr">UPC to QR</option>
                    </select>
                </div>
                <button class="convert-btn" onclick="convertQRUPC()">🔄 Convert</button>
                <div class="result-area" id="qr-upc-result">Results will appear here...</div>
            </div>
            
            <div class="converter-card">
                <div class="converter-title">
                    📁 File ↔ QR Converter
                </div>
                <div class="input-group">
                    <label>File Path or QR Data:</label>
                    <input type="text" id="file-qr-input" placeholder="Enter file path or QR data...">
                </div>
                <div class="input-group">
                    <label>Conversion Type:</label>
                    <select id="file-qr-type">
                        <option value="file_to_qr">File to QR</option>
                        <option value="qr_to_file">QR to File</option>
                    </select>
                </div>
                <button class="convert-btn" onclick="convertFileQR()">📁 Convert</button>
                <div class="result-area" id="file-qr-result">Results will appear here...</div>
            </div>
            
            <div class="converter-card">
                <div class="converter-title">
                    🎯 Smart Bridge Detector
                </div>
                <div class="input-group">
                    <label>Auto-detect bridgeable data:</label>
                    <button class="convert-btn" onclick="scanBridges()">🔍 Scan for Bridges</button>
                </div>
                <div class="result-area" id="bridge-scan-result">Click scan to find bridgeable data...</div>
            </div>
        </div>
        
        <div class="collapse-section">
            <div class="collapse-title">🗜️ Data Layer Collapse System</div>
            <div style="text-align: center; margin-bottom: 20px;">
                <button class="convert-btn" style="width: 200px; margin: 0 10px;" onclick="collapseAll()">
                    🗜️ Collapse All
                </button>
                <button class="convert-btn" style="width: 200px; margin: 0 10px;" onclick="expandAll()">
                    🔓 Expand All
                </button>
            </div>
            <div class="result-area" id="collapse-result">
                Use collapse to compress all data layers into unified structure...
            </div>
        </div>
        
        <div class="bridge-visualizer">
            <h3 style="color: #ff4a9a; margin-bottom: 20px; text-align: center;">
                🌉 Data Bridge Visualization
            </h3>
            <div id="bridge-visualization">
                <div class="bridge-node">QR_001</div>
                <div class="connection-line"></div>
                <div class="bridge-node">UPC_001</div>
                <div class="connection-line"></div>
                <div class="bridge-node">FILE_001</div>
                <br><br>
                <div class="bridge-node">QR_002</div>
                <div class="connection-line"></div>
                <div class="bridge-node">COLLAPSED_001</div>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        
        function connectWebSocket() {
            ws = new WebSocket(\`ws://\${window.location.host}\`);
            
            ws.onopen = () => {
                console.log('🔗 Connected to bridge system');
                updateStatus();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                console.log('🔗 Disconnected from bridge system');
                setTimeout(connectWebSocket, 2000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'bridge_init':
                    console.log('Bridge system initialized');
                    break;
                case 'conversion_result':
                    displayResult('conversion-result', data.result);
                    break;
                case 'bridge_scan_result':
                    displayBridgeScanResult(data.bridges);
                    break;
            }
        }
        
        async function convertQRUPC() {
            const input = document.getElementById('qr-upc-input').value;
            const type = document.getElementById('qr-upc-type').value;
            const [from, to] = type.split('_to_');
            
            try {
                const response = await fetch('/api/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ from, to, data: input })
                });
                
                const result = await response.json();
                document.getElementById('qr-upc-result').innerHTML = 
                    result.success ? formatResult(result.result) : \`Error: \${result.error}\`;
                updateStatus();
            } catch (error) {
                document.getElementById('qr-upc-result').innerHTML = \`Error: \${error.message}\`;
            }
        }
        
        async function convertFileQR() {
            const input = document.getElementById('file-qr-input').value;
            const type = document.getElementById('file-qr-type').value;
            const [from, to] = type.split('_to_');
            
            try {
                const response = await fetch('/api/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ from, to, data: input })
                });
                
                const result = await response.json();
                document.getElementById('file-qr-result').innerHTML = 
                    result.success ? formatResult(result.result) : \`Error: \${result.error}\`;
                updateStatus();
            } catch (error) {
                document.getElementById('file-qr-result').innerHTML = \`Error: \${error.message}\`;
            }
        }
        
        async function collapseAll() {
            try {
                const response = await fetch('/api/collapse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataLayers: 'all', method: 'comprehensive' })
                });
                
                const result = await response.json();
                document.getElementById('collapse-result').innerHTML = 
                    result.success ? \`Collapsed to ID: \${result.id}<br>Size: \${result.collapsed.size} bytes\` : \`Error: \${result.error}\`;
                updateStatus();
            } catch (error) {
                document.getElementById('collapse-result').innerHTML = \`Error: \${error.message}\`;
            }
        }
        
        async function expandAll() {
            // This would need a collapse ID in practice
            document.getElementById('collapse-result').innerHTML = 'Expand functionality - specify collapse ID to expand';
        }
        
        function scanBridges() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'bridge_scan' }));
            }
        }
        
        function displayBridgeScanResult(bridges) {
            const resultDiv = document.getElementById('bridge-scan-result');
            if (bridges.length === 0) {
                resultDiv.innerHTML = 'No bridgeable data found';
            } else {
                resultDiv.innerHTML = \`Found \${bridges.length} bridges:<br>\` + 
                    bridges.map(b => \`\${b.type}: \${b.qr || b.source} → \${b.upc || b.target}\`).join('<br>');
            }
        }
        
        function formatResult(result) {
            if (typeof result === 'object') {
                return Object.entries(result)
                    .map(([key, value]) => \`<strong>\${key}:</strong> \${value}\`)
                    .join('<br>');
            }
            return result.toString();
        }
        
        async function updateStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                
                document.getElementById('qr-count').textContent = status.qr_count;
                document.getElementById('upc-count').textContent = status.upc_count;
                document.getElementById('file-count').textContent = status.file_count;
                document.getElementById('collapsed-count').textContent = status.collapsed_count;
            } catch (error) {
                console.error('Status update failed:', error);
            }
        }
        
        // Initialize
        connectWebSocket();
        updateStatus();
        
        // Update status every 10 seconds
        setInterval(updateStatus, 10000);
    </script>
</body>
</html>`;
    }
}

// Start the QR-UPC Bridge System
const bridgeSystem = new QRUPCBridgeSystem();

module.exports = QRUPCBridgeSystem;
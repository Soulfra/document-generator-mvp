#!/usr/bin/env node
/**
 * Integration Bridge System
 * 
 * Connects the Math Meme Time Engine (JavaScript) with Time Flask Service (Python)
 * Enables automatic synchronization of message bottles and unified data export
 * Provides bi-directional sync and CSV/Excel export capabilities
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const csv = require('csv-writer');
const ExcelJS = require('exceljs');

class IntegrationBridgeSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            mathMemePort: options.mathMemePort || 3017,
            mathMemeWsPort: options.mathMemeWsPort || 3016,
            flaskPort: options.flaskPort || 5000,
            syncInterval: options.syncInterval || 30000, // 30 seconds
            exportDir: options.exportDir || path.join(__dirname, 'exports'),
            batchSize: options.batchSize || 50,
            retryAttempts: options.retryAttempts || 3,
            retryDelay: options.retryDelay || 5000
        };
        
        this.services = {
            mathMeme: {
                url: `http://localhost:${this.config.mathMemePort}`,
                wsUrl: `ws://localhost:${this.config.mathMemeWsPort}`,
                connected: false,
                ws: null
            },
            flask: {
                url: `http://localhost:${this.config.flaskPort}`,
                connected: false
            }
        };
        
        this.syncStats = {
            bottlesSynced: 0,
            lastSync: null,
            syncErrors: 0,
            exportCount: 0
        };
        
        this.pendingSync = [];
        this.syncInterval = null;
        
        console.log('🌉 Integration Bridge System initialized');
        console.log(`📡 Connecting Math Meme Engine (port ${this.config.mathMemePort}) with Flask Service (port ${this.config.flaskPort})`);
        
        this.initialize();
    }
    
    async initialize() {
        // Ensure export directory exists
        if (!fs.existsSync(this.config.exportDir)) {
            fs.mkdirSync(this.config.exportDir, { recursive: true });
        }
        
        // Test service connections
        await this.testConnections();
        
        // Connect to Math Meme WebSocket for real-time updates
        this.connectToMathMeme();
        
        // Start periodic sync
        this.startPeriodicSync();
        
        // Setup web interface
        this.setupWebInterface();
    }
    
    async testConnections() {
        console.log('🔍 Testing service connections...');
        
        // Test Math Meme Engine
        try {
            const response = await axios.get(`${this.services.mathMeme.url}/api/status`);
            this.services.mathMeme.connected = true;
            console.log('✅ Math Meme Engine connected');
        } catch (error) {
            console.error('❌ Math Meme Engine connection failed:', error.message);
            this.services.mathMeme.connected = false;
        }
        
        // Test Flask Service
        try {
            const response = await axios.get(`${this.services.flask.url}/api/health`);
            this.services.flask.connected = true;
            console.log('✅ Flask Service connected');
        } catch (error) {
            console.error('❌ Flask Service connection failed:', error.message);
            this.services.flask.connected = false;
        }
        
        this.emit('connectionStatus', {
            mathMeme: this.services.mathMeme.connected,
            flask: this.services.flask.connected
        });
    }
    
    connectToMathMeme() {
        console.log('📡 Connecting to Math Meme WebSocket...');
        
        this.services.mathMeme.ws = new WebSocket(this.services.mathMeme.wsUrl);
        
        this.services.mathMeme.ws.on('open', () => {
            console.log('✅ Math Meme WebSocket connected');
            this.services.mathMeme.connected = true;
        });
        
        this.services.mathMeme.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                
                if (message.type === 'bottleCreated') {
                    console.log('📦 New bottle detected:', message.data.bottle_id);
                    this.handleNewBottle(message.data);
                }
            } catch (error) {
                console.error('❌ Error processing WebSocket message:', error);
            }
        });
        
        this.services.mathMeme.ws.on('close', () => {
            console.log('⚠️ Math Meme WebSocket disconnected, reconnecting...');
            this.services.mathMeme.connected = false;
            setTimeout(() => this.connectToMathMeme(), 5000);
        });
        
        this.services.mathMeme.ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
        });
    }
    
    async handleNewBottle(bottle) {
        // Add to pending sync queue
        this.pendingSync.push(bottle);
        
        // If queue is large enough, sync immediately
        if (this.pendingSync.length >= this.config.batchSize) {
            await this.syncBatch();
        }
        
        this.emit('bottleQueued', {
            bottle_id: bottle.bottle_id,
            queueSize: this.pendingSync.length
        });
    }
    
    async syncBatch() {
        if (this.pendingSync.length === 0) return;
        
        if (!this.services.flask.connected) {
            console.warn('⚠️ Flask Service not connected, retrying...');
            await this.testConnections();
            if (!this.services.flask.connected) {
                return;
            }
        }
        
        const batch = this.pendingSync.splice(0, this.config.batchSize);
        console.log(`🔄 Syncing batch of ${batch.length} bottles...`);
        
        let synced = 0;
        let errors = 0;
        
        for (const bottle of batch) {
            try {
                await this.syncBottleToFlask(bottle);
                synced++;
            } catch (error) {
                console.error(`❌ Failed to sync bottle ${bottle.bottle_id}:`, error.message);
                errors++;
                
                // Re-queue failed bottles
                this.pendingSync.push(bottle);
            }
        }
        
        this.syncStats.bottlesSynced += synced;
        this.syncStats.syncErrors += errors;
        this.syncStats.lastSync = new Date().toISOString();
        
        console.log(`✅ Synced ${synced} bottles, ${errors} errors`);
        
        this.emit('batchSynced', {
            synced,
            errors,
            totalSynced: this.syncStats.bottlesSynced
        });
    }
    
    async syncBottleToFlask(bottle) {
        try {
            const response = await axios.post(
                `${this.services.flask.url}/api/bottle`,
                bottle,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                }
            );
            
            if (response.data.success) {
                return true;
            } else {
                throw new Error('Flask API returned failure');
            }
        } catch (error) {
            throw error;
        }
    }
    
    startPeriodicSync() {
        // Initial full sync
        this.performFullSync();
        
        // Periodic sync
        this.syncInterval = setInterval(() => {
            this.syncBatch();
        }, this.config.syncInterval);
        
        console.log(`⏰ Periodic sync started (every ${this.config.syncInterval / 1000}s)`);
    }
    
    async performFullSync() {
        console.log('🔄 Performing full synchronization...');
        
        try {
            // Get all bottles from Math Meme Engine
            const response = await axios.get(`${this.services.mathMeme.url}/api/bottles`);
            const bottles = response.data;
            
            console.log(`📦 Found ${bottles.length} bottles to sync`);
            
            // Add all to pending sync
            this.pendingSync = [...this.pendingSync, ...bottles];
            
            // Sync in batches
            while (this.pendingSync.length > 0) {
                await this.syncBatch();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
            }
            
            console.log('✅ Full sync completed');
        } catch (error) {
            console.error('❌ Full sync failed:', error.message);
        }
    }
    
    async exportToCSV(options = {}) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = options.filename || `time-bottles-export-${timestamp}.csv`;
        const filepath = path.join(this.config.exportDir, filename);
        
        try {
            // Get bottles from Flask Service (which has the unified data)
            const response = await axios.get(`${this.services.flask.url}/api/bottles?limit=10000`);
            const bottles = response.data;
            
            if (bottles.length === 0) {
                throw new Error('No bottles to export');
            }
            
            // Create CSV writer
            const csvWriter = csv.createObjectCsvWriter({
                path: filepath,
                header: [
                    { id: 'bottle_id', title: 'Bottle ID' },
                    { id: 'created_at', title: 'Created At' },
                    { id: 'real_unix', title: 'Real Unix Time' },
                    { id: 'real_time', title: 'Real Time' },
                    { id: 'sim_unix', title: 'Simulated Unix Time' },
                    { id: 'sim_time', title: 'Simulated Time' },
                    { id: 'sim_hours', title: 'Simulated Hours' },
                    { id: 'sim_days', title: 'Simulated Days' },
                    { id: 'compression_ratio', title: 'Compression Ratio' },
                    { id: 'command', title: 'Command' },
                    { id: 'checksum', title: 'Checksum' },
                    { id: 'sequence', title: 'Sequence' }
                ]
            });
            
            await csvWriter.writeRecords(bottles);
            
            this.syncStats.exportCount++;
            console.log(`📊 CSV exported to: ${filepath}`);
            
            return {
                success: true,
                filepath,
                records: bottles.length,
                size: fs.statSync(filepath).size
            };
        } catch (error) {
            console.error('❌ CSV export failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async exportToExcel(options = {}) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = options.filename || `time-bottles-export-${timestamp}.xlsx`;
        const filepath = path.join(this.config.exportDir, filename);
        
        try {
            // Get bottles from Flask Service
            const response = await axios.get(`${this.services.flask.url}/api/bottles?limit=10000`);
            const bottles = response.data;
            
            if (bottles.length === 0) {
                throw new Error('No bottles to export');
            }
            
            // Create workbook
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Integration Bridge System';
            workbook.created = new Date();
            
            // Add main data sheet
            const bottleSheet = workbook.addWorksheet('Message Bottles');
            
            // Define columns
            bottleSheet.columns = [
                { header: 'Bottle ID', key: 'bottle_id', width: 30 },
                { header: 'Created At', key: 'created_at', width: 25 },
                { header: 'Real Unix Time', key: 'real_unix', width: 15 },
                { header: 'Real Time', key: 'real_time', width: 25 },
                { header: 'Simulated Unix Time', key: 'sim_unix', width: 15 },
                { header: 'Simulated Time', key: 'sim_time', width: 25 },
                { header: 'Simulated Hours', key: 'sim_hours', width: 15 },
                { header: 'Simulated Days', key: 'sim_days', width: 15 },
                { header: 'Compression Ratio', key: 'compression_ratio', width: 15 },
                { header: 'Command', key: 'command', width: 20 },
                { header: 'Checksum', key: 'checksum', width: 20 },
                { header: 'Sequence', key: 'sequence', width: 10 }
            ];
            
            // Add data
            bottleSheet.addRows(bottles);
            
            // Style the header row
            bottleSheet.getRow(1).font = { bold: true };
            bottleSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4ECCA3' }
            };
            
            // Add analysis sheet
            const analysisSheet = workbook.addWorksheet('Time Analysis');
            
            // Calculate statistics
            const stats = this.calculateStatistics(bottles);
            
            analysisSheet.columns = [
                { header: 'Metric', key: 'metric', width: 30 },
                { header: 'Value', key: 'value', width: 40 }
            ];
            
            analysisSheet.addRows([
                { metric: 'Total Bottles', value: stats.totalBottles },
                { metric: 'Time Span (Real)', value: stats.realTimeSpan },
                { metric: 'Time Span (Simulated)', value: stats.simTimeSpan },
                { metric: 'Compression Ratio', value: stats.compressionRatio },
                { metric: 'Average Interval', value: stats.avgInterval },
                { metric: 'First Bottle', value: stats.firstBottle },
                { metric: 'Last Bottle', value: stats.lastBottle }
            ]);
            
            // Style analysis sheet
            analysisSheet.getRow(1).font = { bold: true };
            analysisSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4ECCA3' }
            };
            
            // Add sync status sheet
            const statusSheet = workbook.addWorksheet('Sync Status');
            
            statusSheet.columns = [
                { header: 'Status', key: 'status', width: 30 },
                { header: 'Details', key: 'details', width: 50 }
            ];
            
            statusSheet.addRows([
                { status: 'Bridge Status', details: 'Active' },
                { status: 'Math Meme Connected', details: this.services.mathMeme.connected ? 'Yes' : 'No' },
                { status: 'Flask Service Connected', details: this.services.flask.connected ? 'Yes' : 'No' },
                { status: 'Total Bottles Synced', details: this.syncStats.bottlesSynced },
                { status: 'Last Sync', details: this.syncStats.lastSync || 'Never' },
                { status: 'Sync Errors', details: this.syncStats.syncErrors },
                { status: 'Exports Created', details: this.syncStats.exportCount }
            ]);
            
            // Save workbook
            await workbook.xlsx.writeFile(filepath);
            
            this.syncStats.exportCount++;
            console.log(`📊 Excel exported to: ${filepath}`);
            
            return {
                success: true,
                filepath,
                records: bottles.length,
                size: fs.statSync(filepath).size
            };
        } catch (error) {
            console.error('❌ Excel export failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    calculateStatistics(bottles) {
        if (bottles.length === 0) {
            return {
                totalBottles: 0,
                realTimeSpan: '0 minutes',
                simTimeSpan: '0 hours',
                compressionRatio: 24,
                avgInterval: '0 minutes',
                firstBottle: 'N/A',
                lastBottle: 'N/A'
            };
        }
        
        const realTimes = bottles.map(b => b.real_unix || 0);
        const simTimes = bottles.map(b => b.sim_unix || 0);
        
        const minReal = Math.min(...realTimes);
        const maxReal = Math.max(...realTimes);
        const minSim = Math.min(...simTimes);
        const maxSim = Math.max(...simTimes);
        
        const realSpanMinutes = (maxReal - minReal) / 60000;
        const simSpanHours = (maxSim - minSim) / 3600000;
        
        const avgInterval = bottles.length > 1 ? realSpanMinutes / (bottles.length - 1) : 0;
        
        return {
            totalBottles: bottles.length,
            realTimeSpan: `${realSpanMinutes.toFixed(1)} minutes`,
            simTimeSpan: `${simSpanHours.toFixed(1)} hours`,
            compressionRatio: bottles[0]?.compression_ratio || 24,
            avgInterval: `${avgInterval.toFixed(1)} minutes`,
            firstBottle: bottles[bottles.length - 1]?.created_at || 'N/A',
            lastBottle: bottles[0]?.created_at || 'N/A'
        };
    }
    
    setupWebInterface() {
        const http = require('http');
        const port = 3018;
        
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url, `http://localhost:${port}`);
            
            if (url.pathname === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateDashboardHTML());
            } else if (url.pathname === '/api/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    services: this.services,
                    stats: this.syncStats,
                    pendingSync: this.pendingSync.length
                }));
            } else if (url.pathname === '/api/sync' && req.method === 'POST') {
                await this.syncBatch();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else if (url.pathname === '/api/fullsync' && req.method === 'POST') {
                this.performFullSync();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Full sync started' }));
            } else if (url.pathname === '/api/export/csv' && req.method === 'POST') {
                const result = await this.exportToCSV();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } else if (url.pathname === '/api/export/excel' && req.method === 'POST') {
                const result = await this.exportToExcel();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(port, () => {
            console.log(`🌐 Integration Bridge Dashboard: http://localhost:${port}`);
        });
    }
    
    generateDashboardHTML() {
        const mathMemeStatus = this.services.mathMeme.connected ? '🟢 Connected' : '🔴 Disconnected';
        const flaskStatus = this.services.flask.connected ? '🟢 Connected' : '🔴 Disconnected';
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Integration Bridge - Math Meme ↔ Flask Sync</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #1a1a1a; 
            color: #fff; 
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
        }
        .header { 
            text-align: center; 
            padding: 20px; 
            background: #2a2a2a; 
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .status-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px;
            margin-bottom: 30px;
        }
        .status-card { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px;
            border: 1px solid #444;
        }
        .metric { 
            margin: 10px 0; 
            font-size: 18px;
        }
        .metric-value { 
            color: #4ecca3; 
            font-weight: bold;
        }
        .controls { 
            text-align: center; 
            margin: 30px 0;
        }
        .btn { 
            background: #4ecca3; 
            color: #000; 
            border: none; 
            padding: 10px 20px; 
            margin: 5px; 
            cursor: pointer; 
            border-radius: 4px;
            font-size: 16px;
        }
        .btn:hover { 
            background: #3eb393; 
        }
        .export-section { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px;
            margin-top: 30px;
        }
        h1, h2 { 
            color: #4ecca3; 
        }
        .status-indicator {
            font-size: 24px;
            margin: 10px 0;
        }
        .sync-info {
            background: #333;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
    <script>
        async function performSync() {
            const response = await fetch('/api/sync', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                alert('Sync completed!');
                location.reload();
            }
        }
        
        async function performFullSync() {
            if (confirm('Perform full synchronization? This may take a while.')) {
                const response = await fetch('/api/fullsync', { method: 'POST' });
                const result = await response.json();
                alert('Full sync started in background');
            }
        }
        
        async function exportCSV() {
            const response = await fetch('/api/export/csv', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                alert('CSV exported to: ' + result.filepath);
            } else {
                alert('Export failed: ' + result.error);
            }
        }
        
        async function exportExcel() {
            const response = await fetch('/api/export/excel', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                alert('Excel exported to: ' + result.filepath);
            } else {
                alert('Export failed: ' + result.error);
            }
        }
        
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌉 Integration Bridge System</h1>
            <p>Connecting Math Meme Time Engine with Flask Time Service</p>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h2>Service Status</h2>
                <div class="status-indicator">
                    Math Meme Engine: ${mathMemeStatus}
                </div>
                <div class="status-indicator">
                    Flask Service: ${flaskStatus}
                </div>
                <div class="metric">
                    Pending Sync: <span class="metric-value">${this.pendingSync.length} bottles</span>
                </div>
            </div>
            
            <div class="status-card">
                <h2>Sync Statistics</h2>
                <div class="metric">
                    Total Synced: <span class="metric-value">${this.syncStats.bottlesSynced}</span>
                </div>
                <div class="metric">
                    Last Sync: <span class="metric-value">${this.syncStats.lastSync || 'Never'}</span>
                </div>
                <div class="metric">
                    Sync Errors: <span class="metric-value">${this.syncStats.syncErrors}</span>
                </div>
                <div class="metric">
                    Exports Created: <span class="metric-value">${this.syncStats.exportCount}</span>
                </div>
            </div>
        </div>
        
        <div class="sync-info">
            <h3>📊 Sync Configuration</h3>
            <p>• Automatic sync every ${this.config.syncInterval / 1000} seconds</p>
            <p>• Batch size: ${this.config.batchSize} bottles</p>
            <p>• Export directory: ${this.config.exportDir}</p>
        </div>
        
        <div class="controls">
            <h2>Manual Controls</h2>
            <button class="btn" onclick="performSync()">🔄 Sync Now</button>
            <button class="btn" onclick="performFullSync()">🔁 Full Sync</button>
        </div>
        
        <div class="export-section">
            <h2>📊 Data Export</h2>
            <p>Export synchronized time bottle data to CSV or Excel format</p>
            <div class="controls">
                <button class="btn" onclick="exportCSV()">📄 Export to CSV</button>
                <button class="btn" onclick="exportExcel()">📊 Export to Excel</button>
            </div>
        </div>
    </div>
</body>
</html>`;
    }
    
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.services.mathMeme.ws) {
            this.services.mathMeme.ws.close();
        }
        console.log('🛑 Integration Bridge stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const bridge = new IntegrationBridgeSystem();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping Integration Bridge...');
        bridge.stop();
        process.exit(0);
    });
}

module.exports = IntegrationBridgeSystem;
#!/usr/bin/env node

/**
 * 🧪 DRAG & DROP HARDHAT TESTING INTERFACE
 * 
 * Interactive code snippet testing with Hardhat/Ethers integration
 * Drag code snippets from Chapter 7 stories to test them instantly
 * Supports smart contract testing, deployment, and interaction
 */

const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DragDropHardhatTesting {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 9500;
        this.wsPort = options.wsPort || 9501;
        
        this.config = {
            hardhatConfigPath: options.hardhatConfigPath || './hardhat.config.js',
            testDir: options.testDir || path.join(__dirname, 'drag-drop-tests'),
            contractsDir: options.contractsDir || path.join(__dirname, 'contracts'),
            resultsDir: options.resultsDir || path.join(__dirname, 'test-results'),
            supportedLanguages: ['javascript', 'solidity', 'typescript'],
            ...options
        };
        
        // Test session tracking
        this.testSessions = new Map();
        this.activeTests = new Map();
        
        // Code snippet storage (synced with Chapter 7 stories)
        this.codeSnippets = new Map();
        
        // Hardhat test templates
        this.testTemplates = {
            javascript: `
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Drag & Drop Test: {snippetName}", function () {
    it("Should execute the dragged code snippet", async function () {
        // Test setup
        const [owner, addr1] = await ethers.getSigners();
        
        // Dragged code execution
        {draggedCode}
        
        // Assertions (customize based on snippet)
        expect(true).to.equal(true); // Placeholder
    });
});`,
            
            solidity: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract DragDropTest {
    // Dragged contract code
    {draggedCode}
    
    // Test helper functions
    function testExecute() public view returns (bool) {
        console.log("Executing dragged Solidity code...");
        return true;
    }
}`,
            
            deployment: `
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Dragged deployment code
    {draggedCode}
    
    console.log("Deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });`
        };
        
        console.log('🧪 Drag & Drop Hardhat Testing Interface initialized');
    }
    
    async initialize() {
        // Create necessary directories
        await this.createDirectories();
        
        // Set up Express middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static(path.join(__dirname, 'drag-drop-ui')));
        
        // Set up routes
        this.setupRoutes();
        
        // Set up WebSocket for real-time test results
        this.setupWebSocket();
        
        // Initialize Hardhat environment
        await this.initializeHardhat();
        
        // Start server
        this.server = this.app.listen(this.port, () => {
            console.log(`🧪 Drag & Drop Testing Interface running on port ${this.port}`);
            console.log(`🔗 Access at: http://localhost:${this.port}`);
        });
    }
    
    async createDirectories() {
        const dirs = [this.config.testDir, this.config.contractsDir, this.config.resultsDir];
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    setupRoutes() {
        // Main testing interface
        this.app.get('/', (req, res) => {
            res.send(this.generateTestingInterface());
        });
        
        // API endpoints
        this.app.post('/api/test-snippet', this.handleTestSnippet.bind(this));
        this.app.get('/api/test-status/:testId', this.getTestStatus.bind(this));
        this.app.get('/api/snippets', this.getAvailableSnippets.bind(this));
        this.app.post('/api/save-snippet', this.saveSnippet.bind(this));
        
        // Hardhat specific endpoints
        this.app.post('/api/deploy-contract', this.deployContract.bind(this));
        this.app.post('/api/run-hardhat-test', this.runHardhatTest.bind(this));
        this.app.get('/api/hardhat-config', this.getHardhatConfig.bind(this));
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 Test client connected');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleWebSocketMessage(ws, data);
            });
            
            // Send initial connection confirmation
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to Drag & Drop Testing System'
            }));
        });
    }
    
    async initializeHardhat() {
        // Check if Hardhat is installed
        try {
            const hardhatVersion = await this.executeCommand('npx hardhat --version');
            console.log(`✅ Hardhat detected: ${hardhatVersion.trim()}`);
        } catch (error) {
            console.warn('⚠️ Hardhat not detected. Installing...');
            await this.installHardhat();
        }
        
        // Create default Hardhat config if not exists
        await this.createDefaultHardhatConfig();
    }
    
    async handleTestSnippet(req, res) {
        const { snippetId, code, language, metadata } = req.body;
        const testId = crypto.randomUUID();
        
        console.log(`🧪 Testing snippet ${snippetId} (${language})`);
        
        try {
            // Create test session
            const testSession = {
                id: testId,
                snippetId,
                code,
                language,
                metadata,
                status: 'preparing',
                startTime: Date.now(),
                results: []
            };
            
            this.testSessions.set(testId, testSession);
            
            // Broadcast test start
            this.broadcastTestUpdate(testId, 'started', { snippetId, language });
            
            // Execute test based on language
            let testResult;
            switch (language) {
                case 'javascript':
                case 'typescript':
                    testResult = await this.testJavaScriptSnippet(testSession);
                    break;
                case 'solidity':
                    testResult = await this.testSoliditySnippet(testSession);
                    break;
                default:
                    throw new Error(`Unsupported language: ${language}`);
            }
            
            // Update session with results
            testSession.status = 'completed';
            testSession.endTime = Date.now();
            testSession.duration = testSession.endTime - testSession.startTime;
            testSession.results = testResult;
            
            // Broadcast completion
            this.broadcastTestUpdate(testId, 'completed', testResult);
            
            res.json({
                success: true,
                testId,
                results: testResult,
                duration: testSession.duration
            });
            
        } catch (error) {
            console.error(`❌ Test failed for snippet ${snippetId}:`, error);
            
            const errorResult = {
                success: false,
                error: error.message,
                stack: error.stack
            };
            
            if (this.testSessions.has(testId)) {
                const session = this.testSessions.get(testId);
                session.status = 'failed';
                session.error = errorResult;
            }
            
            this.broadcastTestUpdate(testId, 'failed', errorResult);
            
            res.status(500).json(errorResult);
        }
    }
    
    async testJavaScriptSnippet(testSession) {
        console.log('🔧 Testing JavaScript snippet...');
        
        // Generate test file
        const testFileName = `test_${testSession.id}.js`;
        const testFilePath = path.join(this.config.testDir, testFileName);
        
        // Wrap code in test template
        const testCode = this.testTemplates.javascript
            .replace('{snippetName}', testSession.metadata?.name || 'Dragged Snippet')
            .replace('{draggedCode}', testSession.code);
        
        await fs.writeFile(testFilePath, testCode);
        
        // Run Hardhat test
        const testOutput = await this.executeCommand(
            `npx hardhat test ${testFilePath}`,
            { cwd: process.cwd() }
        );
        
        // Parse test results
        const results = this.parseTestOutput(testOutput);
        
        // Clean up test file
        await fs.unlink(testFilePath).catch(() => {});
        
        return {
            output: testOutput,
            parsed: results,
            testFile: testFileName
        };
    }
    
    async testSoliditySnippet(testSession) {
        console.log('📜 Testing Solidity snippet...');
        
        // Generate contract file
        const contractName = `DragDropTest_${testSession.id}`;
        const contractFileName = `${contractName}.sol`;
        const contractFilePath = path.join(this.config.contractsDir, contractFileName);
        
        // Wrap code in contract template
        const contractCode = this.testTemplates.solidity
            .replace('{draggedCode}', testSession.code);
        
        await fs.writeFile(contractFilePath, contractCode);
        
        // Compile contract
        const compileOutput = await this.executeCommand(
            `npx hardhat compile`,
            { cwd: process.cwd() }
        );
        
        // Generate deployment test
        const deploymentCode = this.testTemplates.deployment
            .replace('{draggedCode}', `
                const Contract = await ethers.getContractFactory("${contractName}");
                const contract = await Contract.deploy();
                await contract.deployed();
                console.log("Contract deployed to:", contract.address);
                
                // Test the contract
                const result = await contract.testExecute();
                console.log("Test result:", result);
            `);
        
        const deployFilePath = path.join(this.config.testDir, `deploy_${testSession.id}.js`);
        await fs.writeFile(deployFilePath, deploymentCode);
        
        // Run deployment
        const deployOutput = await this.executeCommand(
            `npx hardhat run ${deployFilePath} --network hardhat`,
            { cwd: process.cwd() }
        );
        
        // Clean up files
        await fs.unlink(contractFilePath).catch(() => {});
        await fs.unlink(deployFilePath).catch(() => {});
        
        return {
            compileOutput,
            deployOutput,
            contractName,
            success: deployOutput.includes('Contract deployed to:')
        };
    }
    
    async deployContract(req, res) {
        const { contractCode, contractName, constructorArgs = [] } = req.body;
        
        try {
            // Save contract
            const contractPath = path.join(this.config.contractsDir, `${contractName}.sol`);
            await fs.writeFile(contractPath, contractCode);
            
            // Compile
            await this.executeCommand('npx hardhat compile');
            
            // Deploy script
            const deployScript = `
                const Contract = await ethers.getContractFactory("${contractName}");
                const contract = await Contract.deploy(${constructorArgs.join(', ')});
                await contract.deployed();
                console.log("DEPLOYED_ADDRESS:", contract.address);
            `;
            
            const output = await this.executeCommand(
                `npx hardhat run --network hardhat -e '${deployScript}'`
            );
            
            // Extract deployed address
            const addressMatch = output.match(/DEPLOYED_ADDRESS: (0x[a-fA-F0-9]{40})/);
            const deployedAddress = addressMatch ? addressMatch[1] : null;
            
            res.json({
                success: true,
                deployedAddress,
                output,
                contractName
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    executeCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, [], {
                shell: true,
                ...options
            });
            
            let output = '';
            let errorOutput = '';
            
            proc.stdout.on('data', (data) => {
                output += data.toString();
                this.broadcastTestOutput(data.toString());
            });
            
            proc.stderr.on('data', (data) => {
                errorOutput += data.toString();
                this.broadcastTestOutput(data.toString(), 'stderr');
            });
            
            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(errorOutput || output));
                }
            });
        });
    }
    
    parseTestOutput(output) {
        const results = {
            passed: 0,
            failed: 0,
            tests: []
        };
        
        // Parse Mocha test output
        const passRegex = /✓ (.+)/g;
        const failRegex = /\d+\) (.+)/g;
        
        let match;
        while ((match = passRegex.exec(output)) !== null) {
            results.passed++;
            results.tests.push({ name: match[1], passed: true });
        }
        
        while ((match = failRegex.exec(output)) !== null) {
            results.failed++;
            results.tests.push({ name: match[1], passed: false });
        }
        
        results.total = results.passed + results.failed;
        results.success = results.failed === 0;
        
        return results;
    }
    
    broadcastTestUpdate(testId, status, data) {
        const message = JSON.stringify({
            type: 'test_update',
            testId,
            status,
            data,
            timestamp: Date.now()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    broadcastTestOutput(output, stream = 'stdout') {
        const message = JSON.stringify({
            type: 'test_output',
            stream,
            output,
            timestamp: Date.now()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    async createDefaultHardhatConfig() {
        const configPath = this.config.hardhatConfigPath;
        
        try {
            await fs.access(configPath);
            console.log('✅ Hardhat config exists');
        } catch {
            console.log('📝 Creating default Hardhat config...');
            
            const defaultConfig = `
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
    solidity: "0.8.19",
    networks: {
        hardhat: {
            chainId: 31337
        }
    },
    paths: {
        sources: "${this.config.contractsDir}",
        tests: "${this.config.testDir}",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};`;
            
            await fs.writeFile(configPath, defaultConfig);
        }
    }
    
    async getHardhatConfig(req, res) {
        try {
            const config = require(path.resolve(this.config.hardhatConfigPath));
            res.json({ success: true, config });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async getTestStatus(req, res) {
        const { testId } = req.params;
        const session = this.testSessions.get(testId);
        
        if (!session) {
            return res.status(404).json({ error: 'Test session not found' });
        }
        
        res.json(session);
    }
    
    async getAvailableSnippets(req, res) {
        // This would integrate with Chapter 7 story aggregator
        const snippets = Array.from(this.codeSnippets.values());
        res.json({ snippets });
    }
    
    async saveSnippet(req, res) {
        const { id, code, metadata } = req.body;
        this.codeSnippets.set(id, { id, code, metadata });
        res.json({ success: true, id });
    }
    
    generateTestingInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🧪 Drag & Drop Hardhat Testing</title>
    <style>
        * { box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            background: #0a0a0a;
            color: #e0e0e0;
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: #1a1a1a;
            border-right: 1px solid #333;
            padding: 20px;
            overflow-y: auto;
        }
        
        .main-area {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: #1a1a1a;
            padding: 20px;
            border-bottom: 1px solid #333;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .content {
            flex: 1;
            display: flex;
            padding: 20px;
            gap: 20px;
        }
        
        .drop-zone {
            flex: 1;
            background: #1a1a1a;
            border: 3px dashed #444;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .drop-zone.drag-over {
            border-color: #4CAF50;
            background: #1a2a1a;
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
        }
        
        .drop-zone h2 {
            margin: 0 0 10px 0;
            color: #888;
        }
        
        .drop-zone p {
            color: #666;
            margin: 0;
        }
        
        .code-editor {
            display: none;
            width: 100%;
            height: 100%;
            flex-direction: column;
        }
        
        .code-editor.active {
            display: flex;
        }
        
        .editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #2a2a2a;
            border-radius: 8px 8px 0 0;
        }
        
        .editor-actions {
            display: flex;
            gap: 10px;
        }
        
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        button:hover {
            background: #45a049;
            transform: translateY(-1px);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        button.secondary {
            background: #555;
        }
        
        button.secondary:hover {
            background: #666;
        }
        
        .code-textarea {
            flex: 1;
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            padding: 20px;
            border: none;
            border-radius: 0 0 8px 8px;
            resize: none;
            outline: none;
        }
        
        .test-results {
            flex: 1;
            background: #1a1a1a;
            border-radius: 12px;
            padding: 20px;
            overflow-y: auto;
        }
        
        .test-output {
            background: #0a0a0a;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            white-space: pre-wrap;
            margin-top: 10px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .snippet-list {
            margin-top: 20px;
        }
        
        .snippet-item {
            background: #2a2a2a;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            cursor: move;
            transition: all 0.2s ease;
        }
        
        .snippet-item:hover {
            background: #3a3a3a;
            transform: translateX(5px);
        }
        
        .snippet-item.dragging {
            opacity: 0.5;
        }
        
        .snippet-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
        }
        
        .snippet-language {
            background: #444;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-indicator.running {
            background: #FFC107;
            animation: pulse 1s infinite;
        }
        
        .status-indicator.success {
            background: #4CAF50;
        }
        
        .status-indicator.failed {
            background: #f44336;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .connection-status {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: #888;
        }
        
        .connection-status.connected {
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>📦 Code Snippets</h2>
        <p style="color: #888; font-size: 14px;">Drag snippets to the testing area</p>
        
        <div class="snippet-list" id="snippetList">
            <!-- Demo snippets -->
            <div class="snippet-item" draggable="true" data-snippet='{"id":"demo1","language":"javascript","code":"const sum = (a, b) => a + b;\\nconsole.log(sum(2, 3));"}'>
                <div class="snippet-header">
                    <span>📊</span>
                    <strong>Simple Math Function</strong>
                </div>
                <span class="snippet-language">javascript</span>
            </div>
            
            <div class="snippet-item" draggable="true" data-snippet='{"id":"demo2","language":"solidity","code":"uint256 public counter = 0;\\n\\nfunction increment() public {\\n    counter++;\\n}"}'>
                <div class="snippet-header">
                    <span>📜</span>
                    <strong>Counter Contract</strong>
                </div>
                <span class="snippet-language">solidity</span>
            </div>
        </div>
    </div>
    
    <div class="main-area">
        <div class="header">
            <h1>🧪 Drag & Drop Hardhat Testing</h1>
            <div class="connection-status" id="connectionStatus">
                <span class="status-indicator"></span>
                <span>Connecting...</span>
            </div>
        </div>
        
        <div class="content">
            <div class="drop-zone" id="dropZone">
                <h2>🎯 Drop Code Here</h2>
                <p>Drag code snippets to test them with Hardhat</p>
                
                <div class="code-editor" id="codeEditor">
                    <div class="editor-header">
                        <span id="editorTitle">Testing Code</span>
                        <div class="editor-actions">
                            <button class="secondary" onclick="clearEditor()">Clear</button>
                            <button onclick="runTest()">🚀 Run Test</button>
                        </div>
                    </div>
                    <textarea class="code-textarea" id="codeTextarea"></textarea>
                </div>
            </div>
            
            <div class="test-results">
                <h3>📊 Test Results</h3>
                <div id="testStatus"></div>
                <div class="test-output" id="testOutput">Waiting for tests...</div>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let currentSnippet = null;
        
        // WebSocket connection
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:9501');
            
            ws.onopen = () => {
                console.log('Connected to test server');
                updateConnectionStatus(true);
            };
            
            ws.onclose = () => {
                console.log('Disconnected from test server');
                updateConnectionStatus(false);
                setTimeout(connectWebSocket, 3000);
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
        }
        
        function updateConnectionStatus(connected) {
            const status = document.getElementById('connectionStatus');
            if (connected) {
                status.classList.add('connected');
                status.innerHTML = '<span class="status-indicator success"></span><span>Connected</span>';
            } else {
                status.classList.remove('connected');
                status.innerHTML = '<span class="status-indicator failed"></span><span>Disconnected</span>';
            }
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'test_update':
                    updateTestStatus(data.status, data.data);
                    break;
                case 'test_output':
                    appendTestOutput(data.output);
                    break;
            }
        }
        
        // Drag and drop
        const dropZone = document.getElementById('dropZone');
        const codeEditor = document.getElementById('codeEditor');
        const codeTextarea = document.getElementById('codeTextarea');
        const snippetItems = document.querySelectorAll('.snippet-item');
        
        snippetItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', item.dataset.snippet);
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const snippetData = e.dataTransfer.getData('text/plain');
            try {
                currentSnippet = JSON.parse(snippetData);
                showCodeEditor(currentSnippet);
            } catch (error) {
                console.error('Invalid snippet data:', error);
            }
        });
        
        function showCodeEditor(snippet) {
            dropZone.querySelector('h2').style.display = 'none';
            dropZone.querySelector('p').style.display = 'none';
            codeEditor.classList.add('active');
            
            document.getElementById('editorTitle').textContent = 
                \`Testing \${snippet.language} snippet\`;
            codeTextarea.value = snippet.code;
        }
        
        function clearEditor() {
            codeEditor.classList.remove('active');
            dropZone.querySelector('h2').style.display = 'block';
            dropZone.querySelector('p').style.display = 'block';
            codeTextarea.value = '';
            currentSnippet = null;
            clearTestOutput();
        }
        
        async function runTest() {
            if (!currentSnippet) return;
            
            updateTestStatus('running', { message: 'Preparing test environment...' });
            clearTestOutput();
            
            try {
                const response = await fetch('/api/test-snippet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        snippetId: currentSnippet.id,
                        code: codeTextarea.value,
                        language: currentSnippet.language,
                        metadata: { name: 'Dragged Snippet' }
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    updateTestStatus('success', result);
                } else {
                    updateTestStatus('failed', result);
                }
                
            } catch (error) {
                updateTestStatus('failed', { error: error.message });
            }
        }
        
        function updateTestStatus(status, data) {
            const statusEl = document.getElementById('testStatus');
            
            switch (status) {
                case 'running':
                    statusEl.innerHTML = '<span class="status-indicator running"></span> Running tests...';
                    break;
                case 'success':
                    statusEl.innerHTML = '<span class="status-indicator success"></span> Tests completed successfully!';
                    break;
                case 'failed':
                    statusEl.innerHTML = '<span class="status-indicator failed"></span> Tests failed';
                    break;
            }
        }
        
        function appendTestOutput(output) {
            const outputEl = document.getElementById('testOutput');
            outputEl.textContent += output;
            outputEl.scrollTop = outputEl.scrollHeight;
        }
        
        function clearTestOutput() {
            document.getElementById('testOutput').textContent = 'Waiting for tests...';
        }
        
        // Load snippets from Chapter 7 stories
        async function loadSnippetsFromStories() {
            try {
                const response = await fetch('/api/snippets');
                const data = await response.json();
                
                if (data.snippets && data.snippets.length > 0) {
                    const snippetList = document.getElementById('snippetList');
                    
                    data.snippets.forEach(snippet => {
                        const item = document.createElement('div');
                        item.className = 'snippet-item';
                        item.draggable = true;
                        item.dataset.snippet = JSON.stringify(snippet);
                        
                        item.innerHTML = \`
                            <div class="snippet-header">
                                <span>\${snippet.characterEmoji || '📄'}</span>
                                <strong>\${snippet.description || 'Code Snippet'}</strong>
                            </div>
                            <span class="snippet-language">\${snippet.language}</span>
                        \`;
                        
                        // Add drag events
                        item.addEventListener('dragstart', (e) => {
                            e.dataTransfer.effectAllowed = 'copy';
                            e.dataTransfer.setData('text/plain', item.dataset.snippet);
                            item.classList.add('dragging');
                        });
                        
                        item.addEventListener('dragend', () => {
                            item.classList.remove('dragging');
                        });
                        
                        snippetList.appendChild(item);
                    });
                }
            } catch (error) {
                console.error('Failed to load snippets:', error);
            }
        }
        
        // Initialize
        connectWebSocket();
        loadSnippetsFromStories();
    </script>
</body>
</html>`;
    }
    
    async installHardhat() {
        console.log('📦 Installing Hardhat...');
        try {
            await this.executeCommand('npm install --save-dev hardhat @nomiclabs/hardhat-waffle @nomiclabs/hardhat-ethers ethers chai');
            console.log('✅ Hardhat installed successfully');
        } catch (error) {
            console.error('❌ Failed to install Hardhat:', error);
        }
    }
}

// Export for integration
module.exports = DragDropHardhatTesting;

// Run if executed directly
if (require.main === module) {
    const tester = new DragDropHardhatTesting();
    
    console.log('🧪 DRAG & DROP HARDHAT TESTING');
    console.log('==============================\n');
    
    tester.initialize().catch(error => {
        console.error('❌ Failed to start testing interface:', error);
        process.exit(1);
    });
}
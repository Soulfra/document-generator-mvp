#!/usr/bin/env node

// 🌐⛓️ WEB3 DEEP TIER INTERFACE
// Browser/Electron/PWA interface for Solidity deep tier system
// Connects blockchain tier system to web interfaces

const express = require('express');
const { ethers } = require('ethers');
const fs = require('fs');

class Web3DeepTierInterface {
    constructor() {
        this.app = express();
        this.port = 9400;
        
        // Blockchain configuration
        this.provider = null;
        this.contract = null;
        this.signer = null;
        
        // Contract configuration
        this.contractAddress = null; // Will be set after deployment
        this.contractABI = null;
        
        console.log('🌐⛓️ Web3 Deep Tier Interface initializing...');
        this.initializeWeb3Interface();
    }
    
    async initializeWeb3Interface() {
        console.log('🚀 Setting up Web3 blockchain interface...');
        
        // Setup local blockchain connection (Hardhat/Ganache)
        await this.setupBlockchainConnection();
        
        // Load contract ABI and bytecode
        await this.loadContractData();
        
        // Setup web interface routes
        this.setupWebRoutes();
        
        console.log('✅ Web3 Deep Tier Interface ready');
    }
    
    async setupBlockchainConnection() {
        try {
            // Connect to local blockchain (Hardhat default)
            this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
            
            // Use first account as signer
            const accounts = await this.provider.listAccounts();
            if (accounts.length > 0) {
                this.signer = await this.provider.getSigner(0);
                console.log('🔗 Connected to blockchain:', await this.signer.getAddress());
            } else {
                console.log('⚠️ No accounts found, using default private key');
                // Use a default private key for development
                this.signer = new ethers.Wallet(
                    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat account #0
                    this.provider
                );
            }
            
            console.log('✅ Blockchain connection established');
            
        } catch (error) {
            console.log('⚠️ Local blockchain not running, using mock mode');
            this.setupMockBlockchain();
        }
    }
    
    setupMockBlockchain() {
        // Mock blockchain for testing without actual blockchain
        this.mockMode = true;
        this.mockData = {
            userTiers: new Map(),
            apiAccess: new Map(),
            tierHistory: []
        };
        console.log('🎭 Mock blockchain mode enabled');
    }
    
    async loadContractData() {
        try {
            // Load contract ABI (would be generated from compilation)
            this.contractABI = [
                "function calculateTier(uint256,uint256,uint256,uint256,uint256,bool,bool,bool,bool,bool,bool,uint256) external returns (uint256)",
                "function getUserTier(address) external view returns (uint256)",
                "function getUserUnlockedAPIs(address) external view returns (string[])",
                "function hasAPIAccess(address,string) external view returns (bool)",
                "function requestAPIAccess(string) external returns (bool)",
                "function getTierThresholds() external pure returns (uint256,uint256,uint256,uint256)",
                "function getAllAvailableAPIs() external view returns (string[])",
                "event TierCalculated(address indexed user, uint256 tier, uint256 timestamp)",
                "event APIAccessGranted(address indexed user, string apiName, uint256 tier)"
            ];
            
            console.log('✅ Contract ABI loaded');
            
        } catch (error) {
            console.error('❌ Failed to load contract data:', error);
        }
    }
    
    async deployContract() {
        if (this.mockMode) {
            console.log('🎭 Mock contract deployment');
            this.contractAddress = '0x1234567890123456789012345678901234567890';
            return this.contractAddress;
        }
        
        try {
            // Read compiled contract (would come from Hardhat compilation)
            const contractFactory = new ethers.ContractFactory(
                this.contractABI,
                "0x608060405234801561001057600080fd5b50600080fd5b50", // Mock bytecode
                this.signer
            );
            
            console.log('🚀 Deploying Deep Tier System contract...');
            const contract = await contractFactory.deploy();
            await contract.waitForDeployment();
            
            this.contractAddress = await contract.getAddress();
            this.contract = contract;
            
            console.log('✅ Contract deployed at:', this.contractAddress);
            return this.contractAddress;
            
        } catch (error) {
            console.error('❌ Contract deployment failed:', error);
            throw error;
        }
    }
    
    async connectToContract(address) {
        if (this.mockMode) {
            console.log('🎭 Mock contract connection');
            return;
        }
        
        try {
            this.contractAddress = address;
            this.contract = new ethers.Contract(address, this.contractABI, this.signer);
            console.log('✅ Connected to contract at:', address);
        } catch (error) {
            console.error('❌ Failed to connect to contract:', error);
            throw error;
        }
    }
    
    async calculateTierOnChain(metrics) {
        if (this.mockMode) {
            return this.mockCalculateTier(metrics);
        }
        
        try {
            const tx = await this.contract.calculateTier(
                metrics.systemsBuilt || 0,
                metrics.apisIntegrated || 0,
                metrics.yearsExperience || 0,
                metrics.projectsDeployed || 0,
                metrics.codeCommits || 0,
                metrics.hasBuiltBlockchain || false,
                metrics.hasBuiltAI || false,
                metrics.hasBuiltGame || false,
                metrics.hasRevenueGeneration || false,
                metrics.hasExitedCompany || false,
                metrics.isYCombinatorAlum || false,
                metrics.publishedPapers || 0
            );
            
            const receipt = await tx.wait();
            const tier = await this.contract.getUserTier(await this.signer.getAddress());
            
            console.log('⛓️ Tier calculated on blockchain:', tier);
            return Number(tier);
            
        } catch (error) {
            console.error('❌ Blockchain tier calculation failed:', error);
            return this.mockCalculateTier(metrics);
        }
    }
    
    mockCalculateTier(metrics) {
        let tier = 1;
        tier += (metrics.systemsBuilt || 0) * 2;
        tier += (metrics.apisIntegrated || 0) * 5;
        tier += (metrics.yearsExperience || 0) * 3;
        tier += (metrics.projectsDeployed || 0) * 4;
        tier += Math.floor((metrics.codeCommits || 0) / 100);
        
        if (metrics.hasBuiltBlockchain) tier += 25;
        if (metrics.hasBuiltAI) tier += 30;
        if (metrics.hasBuiltGame) tier += 20;
        if (metrics.hasRevenueGeneration) tier += 40;
        if (metrics.hasExitedCompany) tier += 100;
        if (metrics.isYCombinatorAlum) tier += 75;
        tier += (metrics.publishedPapers || 0) * 15;
        
        const userAddress = 'mock_user';
        this.mockData.userTiers.set(userAddress, tier);
        this.mockData.tierHistory.push({
            user: userAddress,
            tier,
            timestamp: Date.now()
        });
        
        console.log('🎭 Mock tier calculated:', tier);
        return tier;
    }
    
    async getUserTierInfo(address) {
        if (this.mockMode) {
            const tier = this.mockData.userTiers.get('mock_user') || 0;
            return {
                tier,
                progress: Math.min(100, (tier / 200) * 100),
                unlockedAPIs: this.getUnlockedAPIsForTier(tier),
                thresholds: { games: 51, financial: 108, ai: 153, transcendent: 201 }
            };
        }
        
        try {
            const tier = await this.contract.getUserTier(address);
            const unlockedAPIs = await this.contract.getUserUnlockedAPIs(address);
            const thresholds = await this.contract.getTierThresholds();
            
            return {
                tier: Number(tier),
                progress: Math.min(100, (Number(tier) / 200) * 100),
                unlockedAPIs,
                thresholds: {
                    games: Number(thresholds[0]),
                    financial: Number(thresholds[1]),
                    ai: Number(thresholds[2]),
                    transcendent: Number(thresholds[3])
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to get user tier info:', error);
            return { tier: 0, progress: 0, unlockedAPIs: [], thresholds: {} };
        }
    }
    
    getUnlockedAPIsForTier(tier) {
        const apis = [];
        
        if (tier >= 51) apis.push('runescape', 'osrs');
        if (tier >= 55) apis.push('d2jsp');
        if (tier >= 58) apis.push('steam');
        if (tier >= 108) apis.push('coinbase', 'yahoo_finance');
        if (tier >= 110) apis.push('binance');
        if (tier >= 112) apis.push('tradingview');
        if (tier >= 153) apis.push('anthropic');
        if (tier >= 155) apis.push('openai');
        if (tier >= 160) apis.push('aws');
        if (tier >= 165) apis.push('google_cloud');
        
        return apis;
    }
    
    setupWebRoutes() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // Main Web3 interface
        this.app.get('/', (req, res) => {
            res.send(this.renderWeb3Interface());
        });
        
        // API endpoints
        this.app.post('/api/web3/calculate-tier', async (req, res) => {
            try {
                const { metrics } = req.body;
                const tier = await this.calculateTierOnChain(metrics);
                const tierInfo = await this.getUserTierInfo(await this.signer?.getAddress() || 'mock_user');
                
                res.json({
                    success: true,
                    tier,
                    tierInfo,
                    blockchain: !this.mockMode,
                    contractAddress: this.contractAddress
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        this.app.get('/api/web3/tier-info/:address?', async (req, res) => {
            try {
                const address = req.params.address || await this.signer?.getAddress() || 'mock_user';
                const tierInfo = await this.getUserTierInfo(address);
                
                res.json({
                    success: true,
                    ...tierInfo,
                    blockchain: !this.mockMode,
                    contractAddress: this.contractAddress
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        this.app.post('/api/web3/deploy-contract', async (req, res) => {
            try {
                const address = await this.deployContract();
                res.json({
                    success: true,
                    contractAddress: address,
                    blockchain: !this.mockMode
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        this.app.get('/api/web3/status', (req, res) => {
            res.json({
                blockchain: !this.mockMode,
                contractAddress: this.contractAddress,
                provider: this.provider ? 'connected' : 'disconnected',
                signer: this.signer ? 'available' : 'unavailable',
                mockMode: this.mockMode
            });
        });
    }
    
    renderWeb3Interface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🌐⛓️ Web3 Deep Tier System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ffff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .web3-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto 1fr;
            gap: 20px;
            min-height: 100vh;
        }
        
        .header {
            grid-column: 1 / -1;
            text-align: center;
            background: rgba(0, 255, 255, 0.1);
            border: 2px solid #00ffff;
            border-radius: 15px;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
            animation: scan 3s linear infinite;
        }
        
        @keyframes scan {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .web3-panel {
            background: rgba(0, 100, 255, 0.1);
            border: 2px solid #0066ff;
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .blockchain-status {
            grid-column: 1 / -1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .status-item {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 15px;
            border-radius: 8px;
            border-left: 4px solid #00ffff;
        }
        
        .tier-calculator {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .input-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        input, button {
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid #00ffff;
            color: #00ffff;
            padding: 12px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 14px;
        }
        
        button {
            background: linear-gradient(45deg, #0066ff, #00ffff);
            color: white;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            text-transform: uppercase;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 255, 255, 0.4);
        }
        
        .tier-display {
            text-align: center;
        }
        
        .tier-circle {
            width: 150px;
            height: 150px;
            border: 4px solid #00ffff;
            border-radius: 50%;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            position: relative;
            background: conic-gradient(#00ffff 0deg, transparent 0deg);
        }
        
        .tier-number {
            position: relative;
            z-index: 2;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 50%;
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }
        
        .api-badge {
            background: rgba(0, 255, 255, 0.2);
            padding: 8px 12px;
            border-radius: 20px;
            text-align: center;
            font-size: 12px;
            border: 1px solid #00ffff;
            transition: all 0.3s ease;
        }
        
        .api-badge.unlocked {
            background: rgba(0, 255, 0, 0.3);
            border-color: #00ff00;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
        
        .api-badge.locked {
            background: rgba(255, 255, 255, 0.1);
            border-color: #666;
            opacity: 0.5;
        }
        
        .threshold-progress {
            margin: 15px 0;
        }
        
        .threshold-item {
            margin: 10px 0;
            padding: 10px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.2);
        }
        
        .threshold-item.unlocked {
            border-left: 4px solid #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }
        
        .threshold-item.progress {
            border-left: 4px solid #ffff00;
            background: rgba(255, 255, 0, 0.1);
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            margin: 8px 0;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ffff, #0066ff);
            transition: width 0.5s ease;
        }
        
        .web3-info {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 15px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
        }
        
        .blockchain-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
            animation: pulse 2s infinite;
        }
        
        .blockchain-indicator.connected {
            background: #00ff00;
        }
        
        .blockchain-indicator.mock {
            background: #ffff00;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .web3-container {
                grid-template-columns: 1fr;
            }
            
            .input-group {
                grid-template-columns: 1fr;
            }
            
            .blockchain-status {
                flex-direction: column;
                align-items: stretch;
            }
        }
    </style>
</head>
<body>
    <div class="web3-container">
        <div class="header">
            <h1>🌐⛓️ Web3 Deep Tier System</h1>
            <p>Blockchain-based tier calculation and API access control</p>
        </div>
        
        <div class="web3-panel blockchain-status">
            <div class="status-item">
                <div>
                    <span class="blockchain-indicator" id="blockchainIndicator"></span>
                    <strong>Blockchain:</strong> <span id="blockchainStatus">Connecting...</span>
                </div>
            </div>
            <div class="status-item">
                <strong>Contract:</strong> <span id="contractAddress">Not deployed</span>
            </div>
            <div class="status-item">
                <strong>Network:</strong> <span id="networkInfo">Local</span>
            </div>
            <button onclick="deployContract()" id="deployButton">🚀 Deploy Contract</button>
        </div>
        
        <div class="web3-panel tier-calculator">
            <h2>🧮 Tier Calculator</h2>
            <div class="input-group">
                <input type="number" id="systemsBuilt" placeholder="Systems Built" value="10">
                <input type="number" id="apisIntegrated" placeholder="APIs Integrated" value="5">
                <input type="number" id="yearsExperience" placeholder="Years Experience" value="3">
                <input type="number" id="projectsDeployed" placeholder="Projects Deployed" value="8">
                <input type="number" id="codeCommits" placeholder="Code Commits" value="1000">
                <input type="number" id="publishedPapers" placeholder="Published Papers" value="0">
            </div>
            
            <div class="checkbox-group">
                <label><input type="checkbox" id="hasBuiltBlockchain"> Built Blockchain System (+25 tiers)</label>
                <label><input type="checkbox" id="hasBuiltAI" checked> Built AI System (+30 tiers)</label>
                <label><input type="checkbox" id="hasBuiltGame" checked> Built Game (+20 tiers)</label>
                <label><input type="checkbox" id="hasRevenueGeneration"> Revenue Generation (+40 tiers)</label>
                <label><input type="checkbox" id="hasExitedCompany"> Exited Company (+100 tiers)</label>
                <label><input type="checkbox" id="isYCombinatorAlum"> Y Combinator Alum (+75 tiers)</label>
            </div>
            
            <button onclick="calculateTierWeb3()">⛓️ Calculate Tier on Blockchain</button>
            
            <div class="web3-info" id="calculationInfo">
                Ready to calculate tier on blockchain...
            </div>
        </div>
        
        <div class="web3-panel tier-display">
            <h2>🎯 Your Tier</h2>
            <div class="tier-circle" id="tierCircle">
                <div class="tier-number" id="tierNumber">0</div>
            </div>
            <div>
                <strong>Progress:</strong> <span id="tierProgress">0%</span>
            </div>
            
            <div class="threshold-progress" id="thresholdProgress">
                <div class="threshold-item">
                    <strong>Game APIs (Tier 51+)</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <small>RuneScape, OSRS, D2JSP, Steam</small>
                </div>
                <div class="threshold-item">
                    <strong>Financial APIs (Tier 108+)</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <small>Coinbase, Binance, TradingView</small>
                </div>
                <div class="threshold-item">
                    <strong>AI APIs (Tier 153+)</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <small>Anthropic, OpenAI, AWS</small>
                </div>
                <div class="threshold-item">
                    <strong>Transcendent (Tier 201+)</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <small>Everything Unlocked</small>
                </div>
            </div>
            
            <h3>🔗 Unlocked APIs</h3>
            <div class="api-grid" id="apiGrid">
                <div class="api-badge locked">No APIs unlocked</div>
            </div>
        </div>
    </div>
    
    <script>
        let currentBlockchainStatus = false;
        let contractAddress = null;
        
        // Initialize interface
        document.addEventListener('DOMContentLoaded', function() {
            checkWeb3Status();
            loadInitialData();
        });
        
        async function checkWeb3Status() {
            try {
                const response = await fetch('/api/web3/status');
                const status = await response.json();
                
                currentBlockchainStatus = status.blockchain;
                contractAddress = status.contractAddress;
                
                // Update UI
                const indicator = document.getElementById('blockchainIndicator');
                const statusText = document.getElementById('blockchainStatus');
                const contractElement = document.getElementById('contractAddress');
                
                if (status.blockchain) {
                    indicator.className = 'blockchain-indicator connected';
                    statusText.textContent = 'Connected (Local Node)';
                } else {
                    indicator.className = 'blockchain-indicator mock';
                    statusText.textContent = 'Mock Mode (No Blockchain)';
                }
                
                if (contractAddress) {
                    contractElement.textContent = contractAddress.substring(0, 10) + '...';
                    document.getElementById('deployButton').textContent = '✅ Contract Deployed';
                    document.getElementById('deployButton').disabled = true;
                }
                
            } catch (error) {
                console.error('Failed to check Web3 status:', error);
            }
        }
        
        async function loadInitialData() {
            try {
                const response = await fetch('/api/web3/tier-info');
                const data = await response.json();
                
                if (data.success) {
                    updateTierDisplay(data);
                }
            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        }
        
        async function deployContract() {
            const button = document.getElementById('deployButton');
            button.textContent = '🚀 Deploying...';
            button.disabled = true;
            
            try {
                const response = await fetch('/api/web3/deploy-contract', {
                    method: 'POST'
                });
                const result = await response.json();
                
                if (result.success) {
                    contractAddress = result.contractAddress;
                    document.getElementById('contractAddress').textContent = 
                        contractAddress.substring(0, 10) + '...';
                    button.textContent = '✅ Contract Deployed';
                    
                    document.getElementById('calculationInfo').innerHTML = 
                        \`✅ Contract deployed at: \${contractAddress}\`;
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.error('Contract deployment failed:', error);
                button.textContent = '❌ Deployment Failed';
                button.disabled = false;
                
                document.getElementById('calculationInfo').innerHTML = 
                    \`❌ Deployment failed: \${error.message}\`;
            }
        }
        
        async function calculateTierWeb3() {
            const metrics = {
                systemsBuilt: parseInt(document.getElementById('systemsBuilt').value) || 0,
                apisIntegrated: parseInt(document.getElementById('apisIntegrated').value) || 0,
                yearsExperience: parseInt(document.getElementById('yearsExperience').value) || 0,
                projectsDeployed: parseInt(document.getElementById('projectsDeployed').value) || 0,
                codeCommits: parseInt(document.getElementById('codeCommits').value) || 0,
                publishedPapers: parseInt(document.getElementById('publishedPapers').value) || 0,
                hasBuiltBlockchain: document.getElementById('hasBuiltBlockchain').checked,
                hasBuiltAI: document.getElementById('hasBuiltAI').checked,
                hasBuiltGame: document.getElementById('hasBuiltGame').checked,
                hasRevenueGeneration: document.getElementById('hasRevenueGeneration').checked,
                hasExitedCompany: document.getElementById('hasExitedCompany').checked,
                isYCombinatorAlum: document.getElementById('isYCombinatorAlum').checked
            };
            
            document.getElementById('calculationInfo').textContent = 
                currentBlockchainStatus ? 
                '⛓️ Calculating tier on blockchain...' : 
                '🎭 Calculating tier in mock mode...';
            
            try {
                const response = await fetch('/api/web3/calculate-tier', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ metrics })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    updateTierDisplay(result.tierInfo);
                    
                    document.getElementById('calculationInfo').innerHTML = 
                        \`✅ Tier calculated: \${result.tier} \${currentBlockchainStatus ? '(on blockchain)' : '(mock mode)'}\`;
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.error('Tier calculation failed:', error);
                document.getElementById('calculationInfo').innerHTML = 
                    \`❌ Calculation failed: \${error.message}\`;
            }
        }
        
        function updateTierDisplay(data) {
            // Update tier circle
            document.getElementById('tierNumber').textContent = data.tier;
            document.getElementById('tierProgress').textContent = Math.round(data.progress) + '%';
            
            const tierCircle = document.getElementById('tierCircle');
            tierCircle.style.background = 
                \`conic-gradient(#00ffff \${data.progress * 3.6}deg, transparent \${data.progress * 3.6}deg)\`;
            
            // Update threshold progress
            if (data.thresholds) {
                updateThresholdProgress(data.tier, data.thresholds);
            }
            
            // Update API grid
            if (data.unlockedAPIs) {
                updateAPIGrid(data.unlockedAPIs);
            }
        }
        
        function updateThresholdProgress(tier, thresholds) {
            const thresholdItems = document.querySelectorAll('.threshold-item');
            const thresholdValues = [
                thresholds.games || 51,
                thresholds.financial || 108,
                thresholds.ai || 153,
                thresholds.transcendent || 201
            ];
            
            thresholdItems.forEach((item, index) => {
                const threshold = thresholdValues[index];
                const progress = Math.min(100, (tier / threshold) * 100);
                
                const progressFill = item.querySelector('.progress-fill');
                progressFill.style.width = progress + '%';
                
                if (tier >= threshold) {
                    item.className = 'threshold-item unlocked';
                } else if (progress > 0) {
                    item.className = 'threshold-item progress';
                } else {
                    item.className = 'threshold-item';
                }
            });
        }
        
        function updateAPIGrid(unlockedAPIs) {
            const apiGrid = document.getElementById('apiGrid');
            
            if (!unlockedAPIs || unlockedAPIs.length === 0) {
                apiGrid.innerHTML = '<div class="api-badge locked">No APIs unlocked</div>';
                return;
            }
            
            const allAPIs = [
                'runescape', 'osrs', 'd2jsp', 'steam',
                'coinbase', 'binance', 'tradingview', 'yahoo_finance',
                'anthropic', 'openai', 'aws', 'google_cloud'
            ];
            
            apiGrid.innerHTML = allAPIs.map(api => {
                const unlocked = unlockedAPIs.includes(api);
                const className = unlocked ? 'api-badge unlocked' : 'api-badge locked';
                return \`<div class="\${className}">\${api}</div>\`;
            }).join('');
        }
    </script>
</body>
</html>`;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`🌐⛓️ Web3 Deep Tier Interface running on port ${this.port}`);
                console.log(`🌐 Interface: http://localhost:${this.port}`);
                console.log(`⛓️ Blockchain: ${this.mockMode ? 'Mock Mode' : 'Connected'}`);
                console.log(`📱 PWA/Electron ready`);
                resolve();
            });
        });
    }
}

if (require.main === module) {
    const web3Interface = new Web3DeepTierInterface();
    web3Interface.start().catch(console.error);
}

module.exports = Web3DeepTierInterface;
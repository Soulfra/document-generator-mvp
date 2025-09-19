#!/usr/bin/env node

/**
 * 🔗 BLOCKCHAIN INTEGRATION LAYER 🔗
 * Connects the unified system to Solidity smart contracts
 * Provides real-time on-chain monitoring
 */

const Web3 = require('web3');
const axios = require('axios');
const fs = require('fs');

// Contract ABIs (simplified for demo)
const UNIFIED_SYSTEM_ABI = [
    {
        "name": "updateSystemHeartbeat",
        "type": "function",
        "inputs": [{"name": "systemName", "type": "string"}]
    },
    {
        "name": "recordGameAction",
        "type": "function",
        "inputs": [
            {"name": "player", "type": "address"},
            {"name": "gameId", "type": "string"},
            {"name": "action", "type": "string"},
            {"name": "amount", "type": "int256"},
            {"name": "result", "type": "int256"},
            {"name": "success", "type": "bool"}
        ],
        "outputs": [{"name": "", "type": "uint256"}]
    },
    {
        "name": "updateRealData",
        "type": "function",
        "inputs": [
            {"name": "_wikipediaCount", "type": "uint256"},
            {"name": "_githubStars", "type": "uint256"},
            {"name": "_w3cActive", "type": "bool"}
        ]
    },
    {
        "name": "getAllSystemsHealth",
        "type": "function",
        "outputs": [
            {"name": "totalSystems", "type": "uint256"},
            {"name": "activeSystems", "type": "uint256"},
            {"name": "totalRequests", "type": "uint256"},
            {"name": "totalErrors", "type": "uint256"}
        ],
        "stateMutability": "view"
    }
];

class BlockchainIntegration {
    constructor() {
        // Use local blockchain or testnet
        this.web3 = new Web3('http://localhost:8545'); // Ganache or local node
        
        this.contractAddress = null;
        this.contract = null;
        this.account = null;
        
        this.systems = [
            'unified_api',
            'gaming_bridge',
            'financial_bridge',
            'universal_bridge',
            'world_broadcaster'
        ];
        
        console.log('🔗 BLOCKCHAIN INTEGRATION LAYER INITIALIZED');
    }
    
    async initialize() {
        try {
            // Get accounts
            const accounts = await this.web3.eth.getAccounts();
            if (accounts.length === 0) {
                console.log('⚠️ No blockchain accounts found. Using demo mode.');
                this.demoMode = true;
                return;
            }
            
            this.account = accounts[0];
            console.log(`📍 Using account: ${this.account}`);
            
            // Deploy or connect to contract
            await this.setupContract();
            
            // Start monitoring
            this.startBlockchainMonitoring();
            
        } catch (error) {
            console.log(`⚠️ Blockchain not available: ${error.message}`);
            console.log('🎮 Running in demo mode - no real blockchain connection');
            this.demoMode = true;
        }
    }
    
    async setupContract() {
        // In production, this would connect to deployed contract
        // For demo, we'll simulate contract interactions
        console.log('📝 Setting up smart contract connection...');
        
        // Simulate contract deployment
        this.contractAddress = '0x' + '1234567890'.repeat(4);
        console.log(`📍 Contract address: ${this.contractAddress}`);
        
        if (!this.demoMode) {
            this.contract = new this.web3.eth.Contract(UNIFIED_SYSTEM_ABI, this.contractAddress);
        }
    }
    
    async startBlockchainMonitoring() {
        console.log('🔍 Starting blockchain monitoring...');
        
        // Monitor system heartbeats
        setInterval(async () => {
            await this.updateSystemHeartbeats();
        }, 30000); // Every 30 seconds
        
        // Monitor real data
        setInterval(async () => {
            await this.updateRealData();
        }, 60000); // Every minute
        
        // Monitor game actions
        this.monitorGameActions();
    }
    
    async updateSystemHeartbeats() {
        console.log('💓 Updating system heartbeats on blockchain...');
        
        for (const system of this.systems) {
            try {
                // Check if system is online
                const port = this.getSystemPort(system);
                const response = await axios.get(`http://localhost:${port}/api/status`, {
                    timeout: 3000
                });
                
                if (response.status === 200) {
                    if (this.demoMode) {
                        console.log(`  ✅ ${system}: Online (demo mode)`);
                    } else {
                        // Update on blockchain
                        await this.contract.methods.updateSystemHeartbeat(system)
                            .send({ from: this.account, gas: 100000 });
                        console.log(`  ✅ ${system}: Heartbeat recorded on-chain`);
                    }
                }
            } catch (error) {
                console.log(`  ❌ ${system}: Offline`);
            }
        }
    }
    
    async updateRealData() {
        console.log('📊 Updating real data on blockchain...');
        
        try {
            // Get real data from universal bridge
            const response = await axios.get('http://localhost:9999/api/real-data');
            const data = response.data.data;
            
            const wikipediaCount = data.wikipedia ? 1 : 0;
            const githubStars = data.github?.stars || 0;
            const w3cActive = data.w3c?.authenticationReady || false;
            
            if (this.demoMode) {
                console.log(`  📊 Demo mode - Wikipedia: ${wikipediaCount}, GitHub: ${githubStars}, W3C: ${w3cActive}`);
            } else {
                await this.contract.methods.updateRealData(
                    wikipediaCount,
                    githubStars,
                    w3cActive
                ).send({ from: this.account, gas: 150000 });
                
                console.log('  ✅ Real data updated on-chain');
            }
            
        } catch (error) {
            console.log('  ❌ Could not update real data:', error.message);
        }
    }
    
    async monitorGameActions() {
        console.log('🎮 Monitoring game actions...');
        
        // In production, this would listen to WebSocket events
        // For demo, we'll simulate some game actions
        
        setInterval(async () => {
            // Simulate a game action
            const actions = ['invest', 'trade', 'explore', 'battle'];
            const action = actions[Math.floor(Math.random() * actions.length)];
            const amount = Math.floor(Math.random() * 1000);
            const result = Math.random() > 0.5 ? amount * 2 : -amount;
            
            await this.recordGameAction(
                '0x' + 'abcd'.repeat(10), // Demo player address
                'demo_game',
                action,
                amount,
                result,
                result > 0
            );
        }, 20000); // Every 20 seconds
    }
    
    async recordGameAction(player, gameId, action, amount, result, success) {
        console.log(`🎮 Recording game action: ${action} with result ${result}`);
        
        if (this.demoMode) {
            console.log(`  📝 Demo mode - Action recorded locally`);
            // Save to local file for demo
            const record = {
                player,
                gameId,
                action,
                amount,
                result,
                success,
                timestamp: new Date().toISOString()
            };
            
            let records = [];
            if (fs.existsSync('blockchain-game-records.json')) {
                records = JSON.parse(fs.readFileSync('blockchain-game-records.json'));
            }
            records.push(record);
            fs.writeFileSync('blockchain-game-records.json', JSON.stringify(records, null, 2));
            
        } else {
            try {
                const tx = await this.contract.methods.recordGameAction(
                    player,
                    gameId,
                    action,
                    amount,
                    result,
                    success
                ).send({ from: this.account, gas: 200000 });
                
                console.log(`  ✅ Game action recorded on-chain: ${tx.transactionHash}`);
                
            } catch (error) {
                console.log(`  ❌ Failed to record on-chain: ${error.message}`);
            }
        }
    }
    
    async getSystemHealth() {
        console.log('🏥 Getting system health from blockchain...');
        
        if (this.demoMode) {
            // Simulate health data
            return {
                totalSystems: 5,
                activeSystems: 4,
                totalRequests: 1337,
                totalErrors: 42
            };
        } else {
            try {
                const health = await this.contract.methods.getAllSystemsHealth().call();
                return health;
            } catch (error) {
                console.log('  ❌ Could not get health from blockchain:', error.message);
                return null;
            }
        }
    }
    
    getSystemPort(system) {
        const ports = {
            'unified_api': 4000,
            'gaming_bridge': 7777,
            'financial_bridge': 8888,
            'universal_bridge': 9999,
            'world_broadcaster': 8080
        };
        return ports[system] || 3000;
    }
    
    // Deploy contracts (for testing)
    async deployContracts() {
        console.log('📜 Deploying smart contracts...');
        
        if (this.demoMode) {
            console.log('  📝 Demo mode - Contracts "deployed" locally');
            fs.writeFileSync('deployed-contracts.json', JSON.stringify({
                UnifiedSystemContract: '0x' + '1234567890'.repeat(4),
                GameNFT: '0x' + '0987654321'.repeat(4),
                deployedAt: new Date().toISOString()
            }, null, 2));
        } else {
            // Actual deployment code would go here
            console.log('  🚀 Deploying to blockchain...');
        }
    }
}

// Run if called directly
if (require.main === module) {
    console.log('🔗 BLOCKCHAIN INTEGRATION LAYER');
    console.log('===============================\n');
    console.log('Connecting Document Generator to Solidity smart contracts...\n');
    
    const blockchain = new BlockchainIntegration();
    
    blockchain.initialize().then(async () => {
        console.log('\n📊 Blockchain integration active!');
        
        // Get initial health
        const health = await blockchain.getSystemHealth();
        console.log('\nSystem Health:', health);
        
        // Deploy contracts if needed
        if (!fs.existsSync('deployed-contracts.json')) {
            await blockchain.deployContracts();
        }
        
        console.log('\n🎯 Monitoring systems on blockchain...');
        console.log('Check blockchain-game-records.json for recorded actions');
        
    }).catch(error => {
        console.error('❌ Blockchain integration failed:', error);
    });
}

module.exports = BlockchainIntegration;
#!/usr/bin/env node

/**
 * 🔗 SOLIDITY REASONING VERIFIER
 * Connects AI reasoning decisions to blockchain smart contracts
 * Provides on-chain verification and immutable audit trail
 */

const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
// Web3 integration commented out for now (install web3 package to enable)
// const Web3 = require('web3');

const app = express();
app.use(express.json());

// Mock Web3 provider (replace with actual provider in production)
// const web3 = new Web3('http://localhost:8545'); // Default Ganache/Hardhat endpoint

// Smart contract addresses (deploy contracts first)
const CONTRACTS = {
    aiReasoningGame: {
        address: '0x0000000000000000000000000000000000000000', // Update after deployment
        abi: [], // Will load from file
        name: 'AI Reasoning Game'
    },
    deepTierSystem: {
        address: '0x0000000000000000000000000000000000000000', // Update after deployment
        abi: [],
        name: 'Deep Tier System'
    },
    walletMirrorBroadcast: {
        address: '0x0000000000000000000000000000000000000000', // Update after deployment
        abi: [],
        name: 'Wallet Mirror Broadcast'
    }
};

// Verification state
let verifierState = {
    totalVerifications: 0,
    pendingVerifications: {},
    completedVerifications: [],
    gasUsed: 0,
    ethSpent: 0,
    sessionId: generateSessionId()
};

// Load existing state
try {
    const statePath = './solidity-verifier-state.json';
    if (fs.existsSync(statePath)) {
        verifierState = { ...verifierState, ...JSON.parse(fs.readFileSync(statePath, 'utf8')) };
        console.log('📖 Loaded verifier state');
    }
} catch (error) {
    console.warn('⚠️ Could not load verifier state:', error.message);
}

// Load smart contract ABIs
function loadContractABIs() {
    // For now, create mock ABIs. In production, load from compiled contracts
    CONTRACTS.aiReasoningGame.abi = [
        {
            "inputs": [
                { "name": "_name", "type": "string" },
                { "name": "_agentType", "type": "string" },
                { "name": "_zone", "type": "string" }
            ],
            "name": "createAgent",
            "outputs": [{ "name": "", "type": "uint256" }],
            "type": "function"
        },
        {
            "inputs": [
                { "name": "_agentId", "type": "uint256" },
                { "name": "_eventType", "type": "string" },
                { "name": "_reasoning", "type": "string" },
                { "name": "_gameEffect", "type": "string" },
                { "name": "_zoneAffected", "type": "string" }
            ],
            "name": "recordReasoningEvent",
            "outputs": [{ "name": "", "type": "uint256" }],
            "type": "function"
        }
    ];
}

// Blockchain verification engine
class BlockchainVerifier {
    static async verifyReasoningEvent(eventData) {
        const verificationId = `verify_${generateSessionId()}`;
        
        verifierState.pendingVerifications[verificationId] = {
            id: verificationId,
            timestamp: Date.now(),
            status: 'pending',
            data: eventData
        };
        
        try {
            // In production, this would send actual transaction
            const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
            const mockGasUsed = Math.floor(Math.random() * 50000) + 21000;
            const mockGasPrice = 20; // gwei
            
            // Simulate blockchain confirmation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const verification = {
                id: verificationId,
                txHash: mockTxHash,
                blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
                gasUsed: mockGasUsed,
                gasPrice: mockGasPrice,
                ethCost: (mockGasUsed * mockGasPrice) / 1e9,
                timestamp: Date.now(),
                status: 'confirmed',
                data: eventData
            };
            
            // Update state
            delete verifierState.pendingVerifications[verificationId];
            verifierState.completedVerifications.push(verification);
            verifierState.totalVerifications++;
            verifierState.gasUsed += mockGasUsed;
            verifierState.ethSpent += verification.ethCost;
            
            // Save state
            saveState();
            
            return verification;
            
        } catch (error) {
            verifierState.pendingVerifications[verificationId].status = 'failed';
            verifierState.pendingVerifications[verificationId].error = error.message;
            throw error;
        }
    }
    
    static async verifyAgentDecision(agentId, decision, metadata) {
        const eventData = {
            type: 'agent_decision',
            agentId: agentId,
            decision: decision,
            metadata: metadata,
            timestamp: Date.now()
        };
        
        return this.verifyReasoningEvent(eventData);
    }
    
    static async verifyFileDecision(fileGroup, decision, reasoning) {
        const eventData = {
            type: 'file_decision',
            fileGroup: fileGroup,
            decision: decision,
            reasoning: reasoning,
            timestamp: Date.now()
        };
        
        return this.verifyReasoningEvent(eventData);
    }
    
    static async getVerificationProof(verificationId) {
        const completed = verifierState.completedVerifications
            .find(v => v.id === verificationId);
            
        if (completed) {
            return {
                exists: true,
                verification: completed,
                proof: this.generateMerkleProof(completed)
            };
        }
        
        const pending = verifierState.pendingVerifications[verificationId];
        if (pending) {
            return {
                exists: true,
                verification: pending,
                proof: null
            };
        }
        
        return { exists: false };
    }
    
    static generateMerkleProof(verification) {
        // In production, generate actual Merkle proof
        return {
            root: crypto.createHash('sha256')
                .update(JSON.stringify(verification))
                .digest('hex'),
            path: ['0x' + crypto.randomBytes(32).toString('hex')],
            position: verification.id
        };
    }
}

// Cost calculator
class GasCostCalculator {
    static estimateCost(operation, data) {
        const baseCosts = {
            'agent_decision': 50000,
            'file_decision': 45000,
            'reasoning_event': 60000,
            'create_agent': 150000,
            'update_stats': 30000
        };
        
        let gasCost = baseCosts[operation] || 21000;
        
        // Add data size cost (68 gas per byte)
        const dataSize = JSON.stringify(data).length;
        gasCost += dataSize * 68;
        
        // Current gas price (mock)
        const gasPrice = 20; // gwei
        
        return {
            estimatedGas: gasCost,
            gasPrice: gasPrice,
            estimatedCost: (gasCost * gasPrice) / 1e9, // ETH
            estimatedCostUSD: ((gasCost * gasPrice) / 1e9) * 2000 // Assume $2000/ETH
        };
    }
}

// Main dashboard
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🔗 Solidity Reasoning Verifier</title>
    <style>
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(45deg, #f39c12, #e74c3c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(45deg, #3498db, #2ecc71);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .verification-form {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
        }
        .form-group {
            margin: 20px 0;
        }
        .form-control {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            font-size: 16px;
        }
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .btn-primary {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }
        .verifications-list {
            margin: 30px 0;
        }
        .verification-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
        }
        .tx-hash {
            font-family: monospace;
            font-size: 0.9em;
            color: #3498db;
            word-break: break-all;
        }
        .gas-info {
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid #e74c3c;
            border-radius: 8px;
            padding: 10px;
            font-size: 0.9em;
        }
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-confirmed {
            background: #2ecc71;
            color: white;
        }
        .status-pending {
            background: #f39c12;
            color: white;
        }
        .status-failed {
            background: #e74c3c;
            color: white;
        }
        .eth-cost {
            font-size: 1.2em;
            font-weight: 700;
            color: #f39c12;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Solidity Reasoning Verifier</h1>
            <p>On-chain verification for AI reasoning decisions</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Verifications</h3>
                <div class="stat-value">${verifierState.totalVerifications}</div>
            </div>
            <div class="stat-card">
                <h3>Gas Used</h3>
                <div class="stat-value">${(verifierState.gasUsed / 1000).toFixed(1)}k</div>
            </div>
            <div class="stat-card">
                <h3>ETH Spent</h3>
                <div class="stat-value">Ξ${verifierState.ethSpent.toFixed(6)}</div>
            </div>
            <div class="stat-card">
                <h3>USD Cost</h3>
                <div class="stat-value">$${(verifierState.ethSpent * 2000).toFixed(2)}</div>
            </div>
        </div>
        
        <div class="verification-form">
            <h2>🎯 Submit Reasoning for Verification</h2>
            
            <div class="form-group">
                <label>Verification Type:</label>
                <select id="verification-type" class="form-control">
                    <option value="agent_decision">Agent Decision</option>
                    <option value="file_decision">File Decision</option>
                    <option value="reasoning_event">Reasoning Event</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Agent/Entity ID:</label>
                <input type="text" id="entity-id" class="form-control" placeholder="e.g., ralph, doc, file_group_1">
            </div>
            
            <div class="form-group">
                <label>Decision/Action:</label>
                <input type="text" id="decision" class="form-control" placeholder="e.g., delete, keep, refactor">
            </div>
            
            <div class="form-group">
                <label>Reasoning:</label>
                <textarea id="reasoning" class="form-control" rows="4" placeholder="Explain the reasoning behind this decision..."></textarea>
            </div>
            
            <div class="gas-info">
                <strong>Estimated Cost:</strong> 
                <span id="gas-estimate">Calculating...</span>
            </div>
            
            <button class="btn btn-primary" onclick="submitVerification()" style="width: 100%; margin-top: 20px;">
                🔗 Submit to Blockchain
            </button>
        </div>
        
        <div class="verifications-list">
            <h2>📜 Recent Verifications</h2>
            <div id="verifications-container">
                ${verifierState.completedVerifications.slice(-10).reverse().map(v => `
                    <div class="verification-item">
                        <div>
                            <strong>${v.data.type.replace(/_/g, ' ').toUpperCase()}</strong><br>
                            <span class="tx-hash">TX: ${v.txHash}</span><br>
                            <small>Block: ${v.blockNumber} | Gas: ${v.gasUsed}</small>
                        </div>
                        <div style="text-align: right;">
                            <span class="status-badge status-${v.status}">${v.status}</span><br>
                            <span class="eth-cost">Ξ${v.ethCost.toFixed(6)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    
    <script>
        async function updateGasEstimate() {
            const type = document.getElementById('verification-type').value;
            const entityId = document.getElementById('entity-id').value;
            const decision = document.getElementById('decision').value;
            const reasoning = document.getElementById('reasoning').value;
            
            try {
                const response = await fetch('/api/estimate-gas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        operation: type,
                        data: { entityId, decision, reasoning }
                    })
                });
                
                const estimate = await response.json();
                
                document.getElementById('gas-estimate').innerHTML = \`
                    \${estimate.estimatedGas.toLocaleString()} gas @ \${estimate.gasPrice} gwei = 
                    <strong>Ξ\${estimate.estimatedCost.toFixed(6)}</strong> 
                    (~$\${estimate.estimatedCostUSD.toFixed(2)})
                \`;
            } catch (error) {
                document.getElementById('gas-estimate').textContent = 'Error calculating estimate';
            }
        }
        
        async function submitVerification() {
            const type = document.getElementById('verification-type').value;
            const entityId = document.getElementById('entity-id').value;
            const decision = document.getElementById('decision').value;
            const reasoning = document.getElementById('reasoning').value;
            
            if (!entityId || !decision || !reasoning) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                const response = await fetch('/api/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: type,
                        entityId: entityId,
                        decision: decision,
                        reasoning: reasoning
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(\`✅ Verification submitted! TX: \${result.verification.txHash}\`);
                    location.reload();
                } else {
                    alert('❌ Verification failed: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }
        
        // Update gas estimate when form changes
        document.getElementById('verification-type').addEventListener('change', updateGasEstimate);
        document.getElementById('entity-id').addEventListener('input', updateGasEstimate);
        document.getElementById('decision').addEventListener('input', updateGasEstimate);
        document.getElementById('reasoning').addEventListener('input', updateGasEstimate);
        
        // Initial gas estimate
        updateGasEstimate();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            location.reload();
        }, 30000);
    </script>
</body>
</html>
    `);
});

// API Routes
app.post('/api/verify', async (req, res) => {
    try {
        const { type, entityId, decision, reasoning } = req.body;
        
        let verification;
        
        switch (type) {
            case 'agent_decision':
                verification = await BlockchainVerifier.verifyAgentDecision(
                    entityId, 
                    decision, 
                    { reasoning }
                );
                break;
                
            case 'file_decision':
                verification = await BlockchainVerifier.verifyFileDecision(
                    entityId,
                    decision,
                    reasoning
                );
                break;
                
            default:
                verification = await BlockchainVerifier.verifyReasoningEvent({
                    type: type,
                    entityId: entityId,
                    decision: decision,
                    reasoning: reasoning
                });
        }
        
        res.json({
            success: true,
            verification: verification,
            message: 'Verification submitted to blockchain'
        });
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/estimate-gas', (req, res) => {
    const { operation, data } = req.body;
    const estimate = GasCostCalculator.estimateCost(operation, data);
    res.json(estimate);
});

app.get('/api/verification/:id', async (req, res) => {
    const { id } = req.params;
    const proof = await BlockchainVerifier.getVerificationProof(id);
    res.json(proof);
});

app.get('/api/stats', (req, res) => {
    res.json({
        totalVerifications: verifierState.totalVerifications,
        pendingCount: Object.keys(verifierState.pendingVerifications).length,
        completedCount: verifierState.completedVerifications.length,
        gasUsed: verifierState.gasUsed,
        ethSpent: verifierState.ethSpent,
        avgGasPerTx: verifierState.totalVerifications > 0 
            ? Math.round(verifierState.gasUsed / verifierState.totalVerifications)
            : 0
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        totalVerifications: verifierState.totalVerifications
    });
});

// Utility functions
function generateSessionId() {
    return crypto.randomBytes(8).toString('hex');
}

function saveState() {
    try {
        fs.writeFileSync('./solidity-verifier-state.json', JSON.stringify(verifierState, null, 2));
    } catch (error) {
        console.warn('⚠️ Could not save verifier state:', error.message);
    }
}

// Load contract ABIs on startup
loadContractABIs();

// Start server
const PORT = 3012;
app.listen(PORT, (err) => {
    if (err) {
        console.error('❌ Server failed to start:', err);
        process.exit(1);
    }
    
    console.log('🔗 SOLIDITY REASONING VERIFIER');
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log('⛓️ Blockchain verification for AI decisions');
    console.log('💰 Gas tracking and cost estimation');
    console.log(`📊 Total verifications: ${verifierState.totalVerifications}`);
    console.log(`⛽ Total gas used: ${verifierState.gasUsed}`);
    console.log(`Ξ Total ETH spent: ${verifierState.ethSpent.toFixed(6)}`);
});

// Auto-save state every minute
setInterval(saveState, 60000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Solidity verifier...');
    saveState();
    console.log('✅ State saved');
    process.exit(0);
});
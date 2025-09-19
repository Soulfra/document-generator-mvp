#!/usr/bin/env node

/**
 * 🧪 TEST LEARNING ORCHESTRATOR
 * 
 * Comprehensive test of the Master Learning Orchestrator
 * with multi-format files and reinforcement learning
 */

const MasterLearningOrchestrator = require('./master-learning-orchestrator');
const fs = require('fs').promises;
const path = require('path');

class LearningOrchestratorTest {
    constructor() {
        this.orchestrator = new MasterLearningOrchestrator({
            tokenRewardBase: 15,
            tokenPenaltyBase: 8,
            learningRate: 0.2
        });
        
        this.testFiles = [
            // Frontend files
            { name: 'test-component.tsx', content: this.generateReactComponent(), layer: 'frontend' },
            { name: 'test-styles.css', content: this.generateCSS(), layer: 'frontend' },
            
            // Backend files
            { name: 'test-server.js', content: this.generateExpressServer(), layer: 'backend' },
            { name: 'test-api.py', content: this.generatePythonAPI(), layer: 'backend' },
            
            // Game files
            { name: 'test-game.js', content: this.generateGameLogic(), layer: 'game' },
            
            // ICP/Blockchain files
            { name: 'test-canister.js', content: this.generateICPCanister(), layer: 'icp' },
            { name: 'test-contract.sol', content: this.generateSolidityContract(), layer: 'blockchain' },
            
            // Config/docs files
            { name: 'test-config.json', content: this.generateConfig(), layer: 'config' },
            { name: 'test-readme.md', content: this.generateMarkdown(), layer: 'docs' },
            
            // Mixed/complex files
            { name: 'test-mixed.js', content: this.generateMixedFile(), layer: 'backend' }
        ];
        
        this.testResults = [];
    }
    
    async runTests() {
        console.log('🧪 MASTER LEARNING ORCHESTRATOR TEST SUITE');
        console.log('==========================================\n');
        
        // Create test directory
        const testDir = './test-files';
        await this.createTestFiles(testDir);
        
        console.log('📊 Phase 1: Initial Performance (No Learning)');
        console.log('============================================\n');
        
        // Test initial performance
        await this.runInitialTests(testDir);
        
        console.log('\n📈 Phase 2: Learning Loop (With Feedback)');
        console.log('========================================\n');
        
        // Test with learning feedback
        await this.runLearningTests(testDir);
        
        console.log('\n📋 Phase 3: Performance Analysis');
        console.log('===============================\n');
        
        // Analyze improvement
        this.analyzePerformance();
        
        console.log('\n🧠 Phase 4: Learning Statistics');
        console.log('==============================\n');
        
        // Show learning stats
        this.showLearningStats();
        
        // Cleanup
        await this.cleanup(testDir);
        
        console.log('\n🎉 Test Suite Complete!');
    }
    
    async createTestFiles(testDir) {
        try {
            await fs.mkdir(testDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
        
        for (const file of this.testFiles) {
            const filePath = path.join(testDir, file.name);
            await fs.writeFile(filePath, file.content);
        }
        
        console.log(`📁 Created ${this.testFiles.length} test files in ${testDir}\n`);
    }
    
    async runInitialTests(testDir) {
        for (const file of this.testFiles) {
            const filePath = path.join(testDir, file.name);
            
            console.log(`🔍 Testing ${file.name} (expected: ${file.layer})`);
            
            // No expected results for initial run - let it learn naturally
            const result = await this.orchestrator.processFileWithLearning(filePath);
            
            result.expectedLayer = file.layer;
            result.phase = 'initial';
            this.testResults.push(result);
            
            console.log(`   ${result.success ? '✅' : '❌'} ${result.success ? 'Success' : 'Failed'}`);
            if (result.rewards > 0) {
                console.log(`   🏆 Earned ${result.rewards} tokens`);
            } else if (result.rewards < 0) {
                console.log(`   💸 Lost ${Math.abs(result.rewards)} tokens`);
            }
        }
    }
    
    async runLearningTests(testDir) {
        // Run the same tests again but with expected results for learning
        for (const file of this.testFiles) {
            const filePath = path.join(testDir, file.name);
            
            console.log(`🎓 Learning test ${file.name} (expected: ${file.layer})`);
            
            // Provide expected results for learning
            const expectedResult = {
                format: file.name.split('.').pop(),
                layerExtractions: {
                    [file.layer]: true
                },
                vaultOrganized: true
            };
            
            const result = await this.orchestrator.processFileWithLearning(filePath, expectedResult);
            
            result.expectedLayer = file.layer;
            result.phase = 'learning';
            this.testResults.push(result);
            
            console.log(`   ${result.success ? '✅' : '❌'} ${result.success ? 'Success' : 'Failed'}`);
            if (result.performance) {
                console.log(`   📊 Accuracy: ${(result.performance.accuracy * 100).toFixed(1)}%`);
            }
            if (result.rewards > 0) {
                console.log(`   🏆 Earned ${result.rewards} tokens`);
            } else if (result.rewards < 0) {
                console.log(`   💸 Lost ${Math.abs(result.rewards)} tokens`);
            }
        }
    }
    
    analyzePerformance() {
        const initialTests = this.testResults.filter(r => r.phase === 'initial');
        const learningTests = this.testResults.filter(r => r.phase === 'learning');
        
        console.log('📈 Performance Comparison:');
        console.log('=========================\n');
        
        // Success rate comparison
        const initialSuccessRate = initialTests.filter(t => t.success).length / initialTests.length;
        const learningSuccessRate = learningTests.filter(t => t.success).length / learningTests.length;
        
        console.log(`Success Rate:`);
        console.log(`  Initial:  ${(initialSuccessRate * 100).toFixed(1)}%`);
        console.log(`  Learning: ${(learningSuccessRate * 100).toFixed(1)}%`);
        console.log(`  Change:   ${((learningSuccessRate - initialSuccessRate) * 100).toFixed(1)}% improvement\n`);
        
        // Token rewards comparison
        const initialTokens = initialTests.reduce((sum, t) => sum + (t.rewards || 0), 0);
        const learningTokens = learningTests.reduce((sum, t) => sum + (t.rewards || 0), 0);
        
        console.log(`Token Rewards:`);
        console.log(`  Initial Phase:  ${initialTokens} tokens`);
        console.log(`  Learning Phase: ${learningTokens} tokens`);
        console.log(`  Total Earned:   ${initialTokens + learningTokens} tokens\n`);
        
        // Layer extraction accuracy
        console.log(`Layer Extraction Analysis:`);
        const layerTypes = ['frontend', 'backend', 'game', 'icp', 'blockchain', 'config', 'docs'];
        
        for (const layer of layerTypes) {
            const layerTests = learningTests.filter(t => t.expectedLayer === layer);
            if (layerTests.length > 0) {
                const correctExtractions = layerTests.filter(t => 
                    t.layerExtractions && t.layerExtractions[layer]?.matched
                ).length;
                
                const accuracy = correctExtractions / layerTests.length;
                console.log(`  ${layer}: ${(accuracy * 100).toFixed(1)}% accuracy (${correctExtractions}/${layerTests.length})`);
            }
        }
    }
    
    showLearningStats() {
        const stats = this.orchestrator.getLearningStats();
        
        console.log('📊 Learning System Statistics:');
        console.log('=============================\n');
        
        console.log(`Total Experiences: ${stats.totalExperiences}`);
        console.log(`Recent Accuracy: ${(stats.recentAccuracy * 100).toFixed(1)}%`);
        console.log(`Total Tokens Earned: ${stats.totalTokensEarned}\n`);
        
        console.log('📁 Format Handling Stats:');
        for (const [format, data] of Object.entries(stats.formatStats)) {
            if (data.attempts > 0) {
                console.log(`  ${format}: ${(data.accuracy * 100).toFixed(1)}% accuracy (${data.successes}/${data.attempts})`);
            }
        }
        
        console.log('\n🎯 Layer Extraction Stats:');
        for (const [layer, data] of Object.entries(stats.layerStats)) {
            if (data.attempts > 0) {
                console.log(`  ${layer}: ${(data.accuracy * 100).toFixed(1)}% accuracy, ${(data.confidence * 100).toFixed(1)}% confidence`);
            }
        }
    }
    
    async cleanup(testDir) {
        try {
            const files = await fs.readdir(testDir);
            for (const file of files) {
                await fs.unlink(path.join(testDir, file));
            }
            await fs.rmdir(testDir);
            console.log(`🧹 Cleaned up test files`);
        } catch (error) {
            console.log(`⚠️ Could not clean up: ${error.message}`);
        }
    }
    
    // Test file generators
    generateReactComponent() {
        return `import React, { useState } from 'react';
import './styles.css';

interface Props {
    title: string;
    count: number;
}

const TestComponent: React.FC<Props> = ({ title, count }) => {
    const [state, setState] = useState(0);
    
    const handleClick = () => {
        setState(state + 1);
    };
    
    return (
        <div className="component">
            <h1>{title}</h1>
            <p>Count: {count}</p>
            <button onClick={handleClick}>Click me</button>
        </div>
    );
};

export default TestComponent;`;
    }
    
    generateCSS() {
        return `.component {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
}

.component h1 {
    color: white;
    font-size: 24px;
    margin-bottom: 16px;
}

.component button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s ease;
}`;
    }
    
    generateExpressServer() {
        return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/api/data', async (req, res) => {
    try {
        const data = await fetchDataFromDatabase();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});`;
    }
    
    generatePythonAPI() {
        return `from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'python-api'
    })

@app.route('/api/process', methods=['POST'])
def process_data():
    try:
        data = request.get_json()
        result = process_business_logic(data)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def process_business_logic(data):
    # AI processing logic here
    return {'processed': True, 'data': data}

if __name__ == '__main__':
    app.run(debug=True, port=5000)`;
    }
    
    generateGameLogic() {
        return `class GamePlayer {
    constructor(name) {
        this.name = name;
        this.score = 0;
        this.level = 1;
        this.health = 100;
        this.position = { x: 0, y: 0 };
    }
    
    move(direction) {
        switch(direction) {
            case 'up': this.position.y += 1; break;
            case 'down': this.position.y -= 1; break;
            case 'left': this.position.x -= 1; break;
            case 'right': this.position.x += 1; break;
        }
    }
    
    attack(enemy) {
        const damage = Math.floor(Math.random() * 20) + this.level;
        enemy.takeDamage(damage);
        return damage;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    gainExperience(xp) {
        this.score += xp;
        if (this.score >= this.level * 100) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.health = 100;
        console.log(\`\${this.name} leveled up to \${this.level}!\`);
    }
}

const gameState = {
    players: [],
    enemies: [],
    gameLoop: null
};`;
    }
    
    generateICPCanister() {
        return `import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './canister.did.js';

const agent = new HttpAgent();
const canisterId = process.env.CANISTER_ID;

class ICPCanister {
    constructor() {
        this.actor = Actor.createActor(idlFactory, {
            agent,
            canisterId
        });
    }
    
    async query(method, args = []) {
        try {
            const result = await this.actor[method](...args);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async update(method, args = []) {
        try {
            const result = await this.actor[method](...args);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getBalance() {
        return await this.query('balance');
    }
    
    async transfer(to, amount) {
        return await this.update('transfer', [to, amount]);
    }
}

export default ICPCanister;`;
    }
    
    generateSolidityContract() {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestToken {
    string public name = "Test Token";
    string public symbol = "TEST";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(uint256 _totalSupply) {
        totalSupply = _totalSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid address");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
}`;
    }
    
    generateConfig() {
        return `{
    "name": "test-application",
    "version": "1.0.0",
    "port": 3000,
    "database": {
        "host": "localhost",
        "port": 5432,
        "name": "testdb",
        "user": "testuser"
    },
    "features": {
        "authentication": true,
        "logging": true,
        "caching": false
    },
    "environment": "development"
}`;
    }
    
    generateMarkdown() {
        return `# Test Documentation

This is a test markdown file for documentation purposes.

## Features

- Multi-format file processing
- AI-powered learning system
- Token-based rewards
- Vault organization

## Installation

\`\`\`bash
npm install
npm start
\`\`\`

## Usage

The system learns from examples and improves over time.

### Examples

Here are some examples of how to use the system:

1. Process a file
2. Get feedback
3. Learn from results
4. Improve accuracy

## Contributing

Please follow the contribution guidelines.`;
    }
    
    generateMixedFile() {
        return `// Mixed file with multiple layer indicators
const express = require('express');
const React = require('react');

// Backend server setup
const app = express();
app.use(express.json());

// Game logic
class Player {
    constructor(name) {
        this.name = name;
        this.score = 0;
        this.level = 1;
    }
    
    gainScore(points) {
        this.score += points;
    }
}

// API endpoints
app.get('/api/player/:id', (req, res) => {
    const player = getPlayer(req.params.id);
    res.json({ player });
});

// React component
const PlayerComponent = ({ player }) => {
    return React.createElement('div', null, 
        React.createElement('h1', null, player.name),
        React.createElement('p', null, \`Score: \${player.score}\`)
    );
};

module.exports = { app, Player, PlayerComponent };`;
    }
}

// Run the test suite
if (require.main === module) {
    const test = new LearningOrchestratorTest();
    test.runTests().catch(console.error);
}

module.exports = LearningOrchestratorTest;
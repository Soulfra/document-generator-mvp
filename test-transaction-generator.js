#!/usr/bin/env node

/**
 * TEST TRANSACTION GENERATOR
 * Generates properly signed test transactions for the verification mempool
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class TestTransactionGenerator {
    constructor() {
        this.interval = null;
        this.transactionCount = 0;
        
        // Generate test keypair
        this.keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        console.log('🧪 TEST TRANSACTION GENERATOR INITIALIZED');
        console.log('=====================================');
        console.log('');
    }

    /**
     * Generate a test transaction with proper signature
     */
    generateTransaction(type = 'test') {
        const transaction = {
            id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            timestamp: Date.now(),
            data: this.generateTestData(type),
            userId: 'test-user-' + Math.floor(Math.random() * 100),
            priority: ['critical', 'high', 'normal', 'low'][Math.floor(Math.random() * 4)],
            metadata: {
                source: 'test-generator',
                version: '1.0.0',
                testRun: true
            }
        };
        
        // Generate signature
        const dataToSign = JSON.stringify({
            id: transaction.id,
            type: transaction.type,
            data: transaction.data,
            userId: transaction.userId,
            timestamp: transaction.timestamp
        });
        
        const signature = crypto.sign('RSA-SHA256', Buffer.from(dataToSign), {
            key: this.privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        });
        
        transaction.signature = signature.toString('base64');
        transaction.publicKey = this.publicKey;
        
        return transaction;
    }

    /**
     * Generate test data based on transaction type
     */
    generateTestData(type) {
        const testData = {
            test: {
                action: 'test-verification',
                payload: { message: 'Hello from test generator!' },
                random: Math.random()
            },
            document: {
                action: 'process-document',
                documentId: `doc-${Date.now()}`,
                content: 'This is a test document for verification',
                format: 'text/plain'
            },
            voice: {
                action: 'process-voice-command',
                command: 'deploy to github',
                confidence: 0.95,
                audioLength: 2.5
            },
            dragdrop: {
                action: 'handle-drag-drop',
                sourceElement: 'github-service',
                targetElement: 'deployment-zone',
                files: ['test.js', 'package.json']
            },
            auth: {
                action: 'verify-oauth-token',
                provider: 'github',
                tokenHash: crypto.randomBytes(32).toString('hex'),
                scope: 'repo,user'
            }
        };
        
        return testData[type] || testData.test;
    }

    /**
     * Send transaction to mempool
     */
    async sendToMempool(transaction) {
        try {
            const response = await fetch('http://localhost:7500/api/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log(`✅ Transaction ${transaction.id} submitted`);
                console.log(`   Type: ${transaction.type}, Priority: ${transaction.priority}`);
                console.log(`   Mempool ID: ${result.transactionId}`);
            } else {
                console.log(`❌ Transaction ${transaction.id} rejected: ${result.error}`);
            }
            
            return result;
        } catch (error) {
            console.error(`❌ Failed to send transaction: ${error.message}`);
            return null;
        }
    }

    /**
     * Generate and send a batch of test transactions
     */
    async generateBatch(count = 5) {
        console.log(`\n🚀 Generating ${count} test transactions...`);
        
        const types = ['test', 'document', 'voice', 'dragdrop', 'auth'];
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const transaction = this.generateTransaction(type);
            const result = await this.sendToMempool(transaction);
            results.push(result);
            
            // Small delay between transactions
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`\n📊 Batch complete: ${results.filter(r => r && r.success).length}/${count} accepted`);
    }

    /**
     * Start automatic transaction generation
     */
    startAutoGeneration(intervalMs = 10000) {
        console.log(`\n🤖 Starting automatic generation every ${intervalMs/1000} seconds...`);
        
        // Generate initial batch
        this.generateBatch(3);
        
        // Set up interval
        this.interval = setInterval(() => {
            const count = Math.floor(Math.random() * 3) + 1;
            this.generateBatch(count);
        }, intervalMs);
    }

    /**
     * Stop automatic generation
     */
    stopAutoGeneration() {
        if (this.interval) {
            clearInterval(this.interval);
            console.log('\n🛑 Stopped automatic generation');
        }
    }

    /**
     * Interactive CLI
     */
    async cli() {
        console.log('\n🧪 TEST TRANSACTION GENERATOR');
        console.log('Commands:');
        console.log('  single <type>  - Generate single transaction');
        console.log('  batch <count>  - Generate batch of transactions');
        console.log('  auto <ms>      - Start auto generation');
        console.log('  stop           - Stop auto generation');
        console.log('  status         - Check mempool status');
        console.log('  exit           - Exit generator');
        console.log('');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'generator> '
        });
        
        rl.prompt();
        
        rl.on('line', async (line) => {
            const [command, ...args] = line.trim().split(' ');
            
            switch (command) {
                case 'single':
                    const type = args[0] || 'test';
                    const tx = this.generateTransaction(type);
                    await this.sendToMempool(tx);
                    break;
                    
                case 'batch':
                    const count = parseInt(args[0]) || 5;
                    await this.generateBatch(count);
                    break;
                    
                case 'auto':
                    const interval = parseInt(args[0]) || 10000;
                    this.startAutoGeneration(interval);
                    break;
                    
                case 'stop':
                    this.stopAutoGeneration();
                    break;
                    
                case 'status':
                    await this.checkMempoolStatus();
                    break;
                    
                case 'exit':
                    this.stopAutoGeneration();
                    process.exit(0);
                    break;
                    
                default:
                    if (command) {
                        console.log('Unknown command:', command);
                    }
            }
            
            rl.prompt();
        });
        
        rl.on('close', () => {
            this.stopAutoGeneration();
            process.exit(0);
        });
    }

    /**
     * Check mempool status
     */
    async checkMempoolStatus() {
        try {
            const response = await fetch('http://localhost:7500/api/mempool/status');
            const status = await response.json();
            
            console.log('\n📊 MEMPOOL STATUS:');
            console.log(`   Total: ${status.stats.total}`);
            console.log(`   By Priority:`);
            Object.entries(status.stats.byPriority).forEach(([priority, count]) => {
                console.log(`     ${priority}: ${count}`);
            });
            console.log(`   By Status:`);
            Object.entries(status.stats.byStatus).forEach(([status, count]) => {
                console.log(`     ${status}: ${count}`);
            });
        } catch (error) {
            console.error('❌ Failed to get mempool status:', error.message);
        }
    }

    // Getters for crypto keys
    get publicKey() {
        return this.keyPair.publicKey;
    }

    get privateKey() {
        return this.keyPair.privateKey;
    }
}

// Main execution
if (require.main === module) {
    const generator = new TestTransactionGenerator();
    
    // Check if mempool is running
    fetch('http://localhost:7500/api/mempool/status')
        .then(() => {
            console.log('✅ Connected to mempool');
            
            // Start in auto mode if no arguments
            if (process.argv.length === 2) {
                generator.startAutoGeneration(15000); // Every 15 seconds
                console.log('\n💡 Running in auto mode. Use Ctrl+C to stop.');
            } else {
                // Run CLI mode
                generator.cli();
            }
        })
        .catch(() => {
            console.error('❌ Cannot connect to mempool at http://localhost:7500');
            console.error('   Please ensure soulfra-verification-mempool.js is running');
            process.exit(1);
        });
}

module.exports = TestTransactionGenerator;
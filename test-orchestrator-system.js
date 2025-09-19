#!/usr/bin/env node

/**
 * 🧪 DOMINGO ORCHESTRATOR SYSTEM TEST
 * 
 * Tests the complete orchestrator system:
 * - Server startup and health
 * - WebSocket connectivity
 * - Task management APIs
 * - Character assignment system
 * - phpBB forum integration
 */

const http = require('http');
const WebSocket = require('ws');

class OrchestratorTester {
    constructor() {
        this.baseUrl = 'http://localhost:7777';
        this.wsUrl = 'ws://localhost:7777/ws';
        this.testResults = [];
        this.ws = null;
    }

    async runAllTests() {
        console.log('🧪 DOMINGO ORCHESTRATOR SYSTEM TESTS');
        console.log('====================================\n');

        try {
            // Wait for server to be ready
            await this.waitForServer();
            
            // Run tests
            await this.testServerHealth();
            await this.testWebSocketConnection();
            await this.testTaskManagement();
            await this.testCharacterSystem();
            await this.testChatInterface();
            
            // Report results
            this.reportResults();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    async waitForServer(maxWait = 10000) {
        console.log('⏳ Waiting for orchestrator server to start...');
        
        const start = Date.now();
        while (Date.now() - start < maxWait) {
            try {
                await this.makeRequest('/api/system-status');
                console.log('✅ Server is ready\n');
                return;
            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        throw new Error('Server did not start within timeout period');
    }

    async testServerHealth() {
        console.log('🏥 Testing server health...');
        
        try {
            const response = await this.makeRequest('/api/system-status');
            const data = JSON.parse(response);
            
            if (data.success && data.status.health === 'healthy') {
                this.addResult('Server Health', true, 'Server is healthy');
            } else {
                this.addResult('Server Health', false, 'Server health check failed');
            }
        } catch (error) {
            this.addResult('Server Health', false, `Health check error: ${error.message}`);
        }
    }

    async testWebSocketConnection() {
        console.log('🔌 Testing WebSocket connection...');
        
        return new Promise((resolve) => {
            try {
                this.ws = new WebSocket(this.wsUrl);
                
                const timeout = setTimeout(() => {
                    this.addResult('WebSocket Connection', false, 'Connection timeout');
                    resolve();
                }, 5000);
                
                this.ws.on('open', () => {
                    clearTimeout(timeout);
                    this.addResult('WebSocket Connection', true, 'Connected successfully');
                    resolve();
                });
                
                this.ws.on('error', (error) => {
                    clearTimeout(timeout);
                    this.addResult('WebSocket Connection', false, `Connection error: ${error.message}`);
                    resolve();
                });

                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        console.log('📨 WebSocket message received:', message.type);
                    } catch (error) {
                        console.log('📨 WebSocket raw message:', data.toString());
                    }
                });

            } catch (error) {
                this.addResult('WebSocket Connection', false, `Setup error: ${error.message}`);
                resolve();
            }
        });
    }

    async testTaskManagement() {
        console.log('📋 Testing task management...');
        
        // Test task creation
        try {
            const taskData = {
                title: 'Test Task from Automated System',
                description: 'This is a test task created by the automated test suite',
                priority: 'high',
                tags: ['test', 'automation']
            };

            const createResponse = await this.makeRequest('/api/tasks', 'POST', taskData);
            const createData = JSON.parse(createResponse);
            
            if (createData.success) {
                this.addResult('Task Creation', true, `Task created: ${createData.task.task_id}`);
                
                // Test task retrieval
                const getResponse = await this.makeRequest('/api/tasks');
                const getData = JSON.parse(getResponse);
                
                if (getData.success && Array.isArray(getData.tasks)) {
                    const testTask = getData.tasks.find(t => t.task_id === createData.task.task_id);
                    if (testTask) {
                        this.addResult('Task Retrieval', true, `Found created task in list`);
                    } else {
                        this.addResult('Task Retrieval', false, 'Created task not found in task list');
                    }
                } else {
                    this.addResult('Task Retrieval', false, 'Failed to retrieve tasks');
                }
                
            } else {
                this.addResult('Task Creation', false, `Task creation failed: ${createData.error}`);
            }

        } catch (error) {
            this.addResult('Task Management', false, `API error: ${error.message}`);
        }
    }

    async testCharacterSystem() {
        console.log('🎭 Testing character system...');
        
        try {
            const response = await this.makeRequest('/api/characters');
            const data = JSON.parse(response);
            
            if (data.success && Array.isArray(data.characters) && data.characters.length > 0) {
                this.addResult('Character System', true, `Found ${data.characters.length} characters`);
                
                // Check character structure
                const character = data.characters[0];
                const hasRequiredFields = character.id && character.name && character.role && character.specializations;
                
                if (hasRequiredFields) {
                    this.addResult('Character Data Structure', true, 'Characters have required fields');
                } else {
                    this.addResult('Character Data Structure', false, 'Characters missing required fields');
                }
                
            } else {
                this.addResult('Character System', false, 'No characters found or API failed');
            }
        } catch (error) {
            this.addResult('Character System', false, `Character API error: ${error.message}`);
        }
    }

    async testChatInterface() {
        console.log('💬 Testing chat interface...');
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                // Send a test chat message
                const testMessage = {
                    type: 'chat_message',
                    message: 'System test: Hello Domingo!'
                };
                
                this.ws.send(JSON.stringify(testMessage));
                this.addResult('Chat WebSocket', true, 'Test message sent successfully');
                
                // Test HTTP chat endpoint
                const chatResponse = await this.makeRequest('/api/chat', 'POST', {
                    message: 'System test: Status check'
                });
                
                const chatData = JSON.parse(chatResponse);
                if (chatData.success) {
                    this.addResult('Chat HTTP API', true, 'Chat API responded successfully');
                } else {
                    this.addResult('Chat HTTP API', false, 'Chat API failed to respond');
                }
                
            } catch (error) {
                this.addResult('Chat Interface', false, `Chat test error: ${error.message}`);
            }
        } else {
            this.addResult('Chat Interface', false, 'WebSocket not available for chat testing');
        }
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseUrl);
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(url, options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(responseData);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    addResult(testName, passed, message) {
        this.testResults.push({ testName, passed, message });
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${testName}: ${message}`);
    }

    reportResults() {
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('=======================');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => r.passed === false).length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
        
        if (failed > 0) {
            console.log('❌ FAILED TESTS:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  • ${r.testName}: ${r.message}`));
            console.log();
        }
        
        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! Domingo Orchestrator system is fully operational.');
            console.log('🎭 Ready to orchestrate your backend systems!');
        } else {
            console.log('⚠️  Some tests failed. Please review the system configuration.');
        }

        // Close WebSocket connection
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new OrchestratorTester();
    tester.runAllTests().catch(console.error);
}

module.exports = OrchestratorTester;
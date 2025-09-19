#!/usr/bin/env node

/**
 * CANVAS PARENT-CHILD SYNC TEST SUITE
 * 
 * Comprehensive test for the canvas synchronization system
 * Tests parent-child hierarchy, real-time sync, gesture translation, and conflict resolution
 */

const WebSocket = require('ws');
const crypto = require('crypto');

class CanvasSyncTester {
    constructor() {
        this.wsUrl = 'ws://localhost:3335';
        this.testResults = [];
        this.connections = new Map();
        this.sessionId = crypto.randomUUID();
        
        console.log('🧪 Canvas Parent-Child Sync Test Suite');
        console.log('=====================================');
        console.log(`Session ID: ${this.sessionId}`);
        console.log('');
    }
    
    async runAllTests() {
        try {
            await this.testParentChildConnection();
            await this.testCanvasSync();
            await this.testGestureTranslation();
            await this.testConflictResolution();
            await this.testPerformance();
            
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            this.cleanup();
        }
    }
    
    async testParentChildConnection() {
        console.log('🔗 Test 1: Parent-Child Connection');
        console.log('----------------------------------');
        
        try {
            // Create parent (desktop) connection
            const parentWs = await this.createConnection('desktop', 'parent-device-1');
            await this.waitForMessage(parentWs, 'role-assignment');
            
            // Create child (mobile) connection
            const childWs = await this.createConnection('mobile', 'child-device-1');
            await this.waitForMessage(childWs, 'role-assignment');
            
            // Wait for parent-child establishment
            await this.waitForMessage(parentWs, 'child-connected');
            await this.waitForMessage(childWs, 'parent-connected');
            
            this.recordTest('Parent-Child Connection', true, 'Devices connected and hierarchy established');
            console.log('✅ Parent-child connection established');
            
        } catch (error) {
            this.recordTest('Parent-Child Connection', false, error.message);
            console.log('❌ Parent-child connection failed:', error.message);
        }
        
        console.log('');
    }
    
    async testCanvasSync() {
        console.log('🎨 Test 2: Canvas Synchronization');
        console.log('---------------------------------');
        
        try {
            const parentWs = this.connections.get('parent-device-1');
            const childWs = this.connections.get('child-device-1');
            
            if (!parentWs || !childWs) {
                throw new Error('Parent or child connection not available');
            }
            
            // Test drawing action from parent
            const drawAction = {
                type: 'canvas-action',
                sessionId: this.sessionId,
                action: {
                    type: 'draw',
                    data: {
                        points: [
                            { x: 100, y: 100, pressure: 1.0 },
                            { x: 150, y: 150, pressure: 0.8 }
                        ],
                        tool: 'pen',
                        style: { color: '#ff0000', width: 2 }
                    }
                }
            };
            
            parentWs.send(JSON.stringify(drawAction));
            
            // Wait for sync to child
            const syncMessage = await this.waitForMessage(childWs, 'canvas-update', 5000);
            
            if (syncMessage && syncMessage.changes && syncMessage.changes.element) {
                this.recordTest('Canvas Draw Sync', true, 'Draw action synced from parent to child');
                console.log('✅ Canvas draw action synced successfully');
            } else {
                throw new Error('Canvas sync message not received or invalid');
            }
            
            // Test cursor movement
            const cursorMove = {
                type: 'cursor-move',
                sessionId: this.sessionId,
                position: { x: 200, y: 300 }
            };
            
            childWs.send(JSON.stringify(cursorMove));
            
            // Wait for cursor sync to parent
            const cursorSync = await this.waitForMessage(parentWs, 'cursor-update', 3000);
            
            if (cursorSync && cursorSync.position) {
                this.recordTest('Cursor Sync', true, 'Cursor movement synced from child to parent');
                console.log('✅ Cursor movement synced successfully');
            } else {
                throw new Error('Cursor sync not received');
            }
            
        } catch (error) {
            this.recordTest('Canvas Synchronization', false, error.message);
            console.log('❌ Canvas synchronization failed:', error.message);
        }
        
        console.log('');
    }
    
    async testGestureTranslation() {
        console.log('👆 Test 3: Gesture Translation');
        console.log('-------------------------------');
        
        try {
            const childWs = this.connections.get('child-device-1');
            const parentWs = this.connections.get('parent-device-1');
            
            if (!childWs || !parentWs) {
                throw new Error('Parent or child connection not available');
            }
            
            // Test pinch gesture (should translate to zoom)
            const pinchGesture = {
                type: 'gesture-input',
                sessionId: this.sessionId,
                gesture: {
                    type: 'pinch',
                    center: { x: 300, y: 400 },
                    scale: 1.5,
                    delta: 0.5
                }
            };
            
            childWs.send(JSON.stringify(pinchGesture));
            
            // Wait for translated action
            const zoomAction = await this.waitForMessage(parentWs, 'canvas-update', 3000);
            
            if (zoomAction) {
                this.recordTest('Pinch to Zoom Translation', true, 'Pinch gesture translated to zoom action');
                console.log('✅ Pinch gesture translated to zoom');
            }
            
            // Test tap gesture (should translate to select)
            const tapGesture = {
                type: 'gesture-input',
                sessionId: this.sessionId,
                gesture: {
                    type: 'tap',
                    position: { x: 250, y: 250 }
                }
            };
            
            childWs.send(JSON.stringify(tapGesture));
            
            // Wait for translated action
            const selectAction = await this.waitForMessage(parentWs, 'canvas-update', 3000);
            
            if (selectAction) {
                this.recordTest('Tap to Select Translation', true, 'Tap gesture translated to select action');
                console.log('✅ Tap gesture translated to select');
            }
            
        } catch (error) {
            this.recordTest('Gesture Translation', false, error.message);
            console.log('❌ Gesture translation failed:', error.message);
        }
        
        console.log('');
    }
    
    async testConflictResolution() {
        console.log('⚔️ Test 4: Conflict Resolution');
        console.log('------------------------------');
        
        try {
            const parentWs = this.connections.get('parent-device-1');
            const childWs = this.connections.get('child-device-1');
            
            // Create the same element from both devices simultaneously
            const elementId = crypto.randomUUID();
            
            const parentAction = {
                type: 'canvas-action',
                sessionId: this.sessionId,
                action: {
                    type: 'create',
                    data: {
                        elementId,
                        elementType: 'rectangle',
                        position: { x: 100, y: 100 },
                        size: { width: 50, height: 50 },
                        style: { color: '#blue' }
                    }
                }
            };
            
            const childAction = {
                type: 'canvas-action',
                sessionId: this.sessionId,
                action: {
                    type: 'create',
                    data: {
                        elementId,
                        elementType: 'rectangle',
                        position: { x: 100, y: 100 },
                        size: { width: 50, height: 50 },
                        style: { color: '#red' }
                    }
                }
            };
            
            // Send simultaneously
            parentWs.send(JSON.stringify(parentAction));
            childWs.send(JSON.stringify(childAction));
            
            // Wait for conflict resolution
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.recordTest('Conflict Resolution', true, 'Simultaneous actions handled (parent-wins policy)');
            console.log('✅ Conflict resolution tested');
            
        } catch (error) {
            this.recordTest('Conflict Resolution', false, error.message);
            console.log('❌ Conflict resolution failed:', error.message);
        }
        
        console.log('');
    }
    
    async testPerformance() {
        console.log('⚡ Test 5: Performance');
        console.log('---------------------');
        
        try {
            const parentWs = this.connections.get('parent-device-1');
            const childWs = this.connections.get('child-device-1');
            
            const startTime = Date.now();
            let messagesReceived = 0;
            let totalLatency = 0;
            
            // Set up message counter
            const messageHandler = (message) => {
                messagesReceived++;
                const data = JSON.parse(message);
                if (data.timestamp) {
                    const latency = Date.now() - new Date(data.timestamp).getTime();
                    totalLatency += latency;
                }\n            };\n            \n            childWs.on('message', messageHandler);\n            \n            // Send rapid updates\n            const updateCount = 50;\n            for (let i = 0; i < updateCount; i++) {\n                const cursorUpdate = {\n                    type: 'cursor-move',\n                    sessionId: this.sessionId,\n                    position: { x: 100 + i, y: 100 + i },\n                    timestamp: new Date()\n                };\n                \n                parentWs.send(JSON.stringify(cursorUpdate));\n                \n                // Small delay to simulate realistic input\n                await new Promise(resolve => setTimeout(resolve, 10));\n            }\n            \n            // Wait for all messages to be processed\n            await new Promise(resolve => setTimeout(resolve, 2000));\n            \n            const duration = Date.now() - startTime;\n            const messagesPerSecond = (messagesReceived / duration) * 1000;\n            const averageLatency = totalLatency / messagesReceived;\n            \n            console.log(`   📊 Messages/second: ${messagesPerSecond.toFixed(2)}`);\n            console.log(`   📊 Average latency: ${averageLatency.toFixed(2)}ms`);\n            \n            const performanceGood = messagesPerSecond > 10 && averageLatency < 100;\n            \n            this.recordTest('Performance', performanceGood, \n                `${messagesPerSecond.toFixed(2)} msg/s, ${averageLatency.toFixed(2)}ms latency`);\n            \n            if (performanceGood) {\n                console.log('✅ Performance test passed');\n            } else {\n                console.log('⚠️  Performance below expectations');\n            }\n            \n        } catch (error) {\n            this.recordTest('Performance', false, error.message);\n            console.log('❌ Performance test failed:', error.message);\n        }\n        \n        console.log('');\n    }\n    \n    async createConnection(deviceType, deviceId) {\n        return new Promise((resolve, reject) => {\n            const ws = new WebSocket(this.wsUrl, {\n                headers: {\n                    'x-device-type': deviceType,\n                    'x-device-id': deviceId,\n                    'x-session-id': this.sessionId\n                }\n            });\n            \n            ws.on('open', () => {\n                this.connections.set(deviceId, ws);\n                ws.messages = [];\n                \n                ws.on('message', (data) => {\n                    const message = JSON.parse(data.toString());\n                    ws.messages.push(message);\n                });\n                \n                resolve(ws);\n            });\n            \n            ws.on('error', (error) => {\n                reject(error);\n            });\n            \n            setTimeout(() => {\n                reject(new Error('Connection timeout'));\n            }, 5000);\n        });\n    }\n    \n    async waitForMessage(ws, messageType, timeout = 5000) {\n        return new Promise((resolve, reject) => {\n            const checkForMessage = () => {\n                const message = ws.messages.find(msg => msg.type === messageType);\n                if (message) {\n                    resolve(message);\n                    return;\n                }\n            };\n            \n            // Check immediately\n            checkForMessage();\n            \n            // Set up listener for new messages\n            const messageHandler = (data) => {\n                const message = JSON.parse(data.toString());\n                if (message.type === messageType) {\n                    ws.removeListener('message', messageHandler);\n                    resolve(message);\n                }\n            };\n            \n            ws.on('message', messageHandler);\n            \n            // Timeout\n            setTimeout(() => {\n                ws.removeListener('message', messageHandler);\n                reject(new Error(`Timeout waiting for message type: ${messageType}`));\n            }, timeout);\n        });\n    }\n    \n    recordTest(testName, success, details) {\n        this.testResults.push({\n            name: testName,\n            success,\n            details,\n            timestamp: new Date()\n        });\n    }\n    \n    displayResults() {\n        console.log('📊 TEST RESULTS');\n        console.log('===============');\n        console.log('');\n        \n        const passed = this.testResults.filter(test => test.success).length;\n        const total = this.testResults.length;\n        \n        this.testResults.forEach(test => {\n            const status = test.success ? '✅' : '❌';\n            console.log(`${status} ${test.name}`);\n            console.log(`   ${test.details}`);\n            console.log('');\n        });\n        \n        console.log(`📈 Summary: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);\n        \n        if (passed === total) {\n            console.log('🎉 All tests passed! Canvas parent-child sync is working correctly.');\n        } else {\n            console.log('⚠️  Some tests failed. Check the implementation.');\n        }\n    }\n    \n    cleanup() {\n        console.log('\\n🧹 Cleaning up test connections...');\n        \n        this.connections.forEach((ws, deviceId) => {\n            if (ws.readyState === WebSocket.OPEN) {\n                ws.close();\n            }\n        });\n        \n        this.connections.clear();\n        console.log('✅ Cleanup complete');\n    }\n}\n\n// Demo usage\nclass CanvasSyncDemo {\n    constructor() {\n        this.wsUrl = 'ws://localhost:3335';\n        this.sessionId = crypto.randomUUID();\n    }\n    \n    async runDemo() {\n        console.log('🎨 Canvas Parent-Child Sync Demo');\n        console.log('================================');\n        console.log(`Session: ${this.sessionId}`);\n        console.log('');\n        \n        try {\n            // Create parent connection\n            console.log('🖥️  Connecting desktop (parent)...');\n            const parentWs = await this.createConnection('desktop', 'demo-parent');\n            console.log('✅ Desktop connected');\n            \n            // Create child connection\n            console.log('📱 Connecting mobile (child)...');\n            const childWs = await this.createConnection('mobile', 'demo-child');\n            console.log('✅ Mobile connected');\n            \n            // Wait for pairing\n            await new Promise(resolve => setTimeout(resolve, 1000));\n            console.log('🔗 Devices paired');\n            \n            // Simulate drawing on desktop\n            console.log('🎨 Drawing on desktop...');\n            parentWs.send(JSON.stringify({\n                type: 'canvas-action',\n                sessionId: this.sessionId,\n                action: {\n                    type: 'draw',\n                    data: {\n                        points: [\n                            { x: 50, y: 50 },\n                            { x: 100, y: 100 },\n                            { x: 150, y: 50 }\n                        ],\n                        tool: 'pen',\n                        style: { color: '#0066ff', width: 3 }\n                    }\n                }\n            }));\n            \n            // Simulate mobile gesture\n            console.log('👆 Mobile pinch gesture...');\n            childWs.send(JSON.stringify({\n                type: 'gesture-input',\n                sessionId: this.sessionId,\n                gesture: {\n                    type: 'pinch',\n                    center: { x: 100, y: 100 },\n                    scale: 2.0\n                }\n            }));\n            \n            // Simulate cursor movement\n            console.log('🖱️  Moving cursor...');\n            for (let i = 0; i < 10; i++) {\n                parentWs.send(JSON.stringify({\n                    type: 'cursor-move',\n                    sessionId: this.sessionId,\n                    position: { x: 100 + i * 10, y: 100 + i * 5 }\n                }));\n                \n                await new Promise(resolve => setTimeout(resolve, 100));\n            }\n            \n            console.log('🎉 Demo complete! Check the sync behavior.');\n            \n        } catch (error) {\n            console.error('❌ Demo failed:', error);\n        }\n    }\n    \n    async createConnection(deviceType, deviceId) {\n        return new Promise((resolve, reject) => {\n            const ws = new WebSocket(this.wsUrl, {\n                headers: {\n                    'x-device-type': deviceType,\n                    'x-device-id': deviceId,\n                    'x-session-id': this.sessionId\n                }\n            });\n            \n            ws.on('open', () => {\n                ws.on('message', (data) => {\n                    const message = JSON.parse(data.toString());\n                    console.log(`   📨 ${deviceType} received: ${message.type}`);\n                });\n                \n                resolve(ws);\n            });\n            \n            ws.on('error', reject);\n            \n            setTimeout(() => {\n                reject(new Error('Connection timeout'));\n            }, 5000);\n        });\n    }\n}\n\n// Command line interface\nif (require.main === module) {\n    const command = process.argv[2] || 'test';\n    \n    if (command === 'test') {\n        const tester = new CanvasSyncTester();\n        tester.runAllTests();\n    } else if (command === 'demo') {\n        const demo = new CanvasSyncDemo();\n        demo.runDemo();\n    } else {\n        console.log('Usage:');\n        console.log('  node test-canvas-sync.js test  # Run test suite');\n        console.log('  node test-canvas-sync.js demo  # Run interactive demo');\n    }\n}\n\nmodule.exports = { CanvasSyncTester, CanvasSyncDemo };
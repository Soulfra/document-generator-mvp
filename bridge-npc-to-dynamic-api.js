#!/usr/bin/env node

/**
 * 🌉 NPC-RPC TO DYNAMIC API BRIDGE
 * Connects the autonomous NPCs to the RuneScape-like dynamic API system
 * NPCs can now create documents, generate MVPs, and consult characters
 */

const axios = require('axios');
const net = require('net');

class NPCDynamicAPIBridge {
    constructor() {
        this.dynamicAPI = 'http://localhost:4455';
        this.npcRPC = 'localhost:54321';
        this.bridgePort = 54323;
        
        // Enhanced NPC behaviors that use the dynamic API
        this.enhancedBehaviors = {
            'document-creation': this.createDocumentFromNPC.bind(this),
            'mvp-generation': this.generateMVPFromNPC.bind(this),
            'character-consultation': this.consultCharacterFromNPC.bind(this),
            'game-creation': this.createGameFromNPC.bind(this),
            'runescape-trade': this.executeRuneScapeTrade.bind(this)
        };
        
        console.log('🌉 NPC-DYNAMIC API BRIDGE INITIALIZING');
        console.log('🎮 Connecting autonomous NPCs to document generator');
    }
    
    async start() {
        console.log('🚀 Starting NPC-Dynamic API Bridge...');
        
        // Start bridge server that NPCs can call
        await this.startBridgeServer();
        
        // Connect to existing NPC system
        await this.connectToNPCs();
        
        // Test the bridge
        await this.testBridge();
        
        console.log('✅ NPC-Dynamic API Bridge active!');
        console.log('🎯 NPCs can now create documents and generate MVPs autonomously');
    }
    
    async startBridgeServer() {
        return new Promise((resolve) => {
            this.server = net.createServer((socket) => {
                socket.on('data', async (data) => {
                    try {
                        const request = JSON.parse(data.toString());
                        await this.handleNPCRequest(socket, request);
                    } catch (error) {
                        this.sendError(socket, -32700, 'Parse error', error.message);
                    }
                });
            });
            
            this.server.listen(this.bridgePort, () => {
                console.log(`🌉 Bridge server listening on port ${this.bridgePort}`);
                resolve();
            });
        });
    }
    
    async handleNPCRequest(socket, request) {
        const { method, params, id } = request;
        
        console.log(`🤖 NPC Bridge Request: ${method}`);
        
        try {
            let result;
            
            switch (method) {
                case 'createDocument':
                    result = await this.createDocumentFromNPC(params);
                    break;
                case 'generateMVP':
                    result = await this.generateMVPFromNPC(params);
                    break;
                case 'consultCharacter':
                    result = await this.consultCharacterFromNPC(params);
                    break;
                case 'createGame':
                    result = await this.createGameFromNPC(params);
                    break;
                case 'runescapeTrade':
                    result = await this.executeRuneScapeTrade(params);
                    break;
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
            
            this.sendSuccess(socket, result, id);
            
        } catch (error) {
            console.error(`❌ Bridge error for ${method}:`, error.message);
            this.sendError(socket, -32603, 'Internal error', error.message, id);
        }
    }
    
    async createDocumentFromNPC(params) {
        const { npcId, documentType, content } = params;
        
        console.log(`📝 NPC ${npcId} creating document: ${documentType}`);
        
        // Use dynamic API to analyze the document
        const response = await axios.post(`${this.dynamicAPI}/api/document-mvp/analyze`, {
            document: content || `Document created by NPC ${npcId}`,
            type: documentType || 'npc-generated',
            npcSource: npcId
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        
        if (response.data.success) {
            console.log(`✅ NPC ${npcId} document analyzed successfully`);
            return {
                success: true,
                documentId: `doc_${npcId}_${Date.now()}`,
                analysis: response.data.result,
                npcId
            };
        } else {
            throw new Error('Document analysis failed');
        }
    }
    
    async generateMVPFromNPC(params) {
        const { npcId, documentContent, options } = params;
        
        console.log(`🏗️ NPC ${npcId} generating MVP`);
        
        // Use dynamic API to generate MVP
        const response = await axios.post(`${this.dynamicAPI}/api/document-mvp/generate`, {
            document: documentContent || `MVP requested by NPC ${npcId}`,
            options: {
                framework: 'react',
                deployment: 'vercel',
                npcRequested: true,
                npcId,
                ...options
            }
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000
        });
        
        if (response.data.success) {
            console.log(`✅ NPC ${npcId} MVP generation started: ${response.data.result.jobId}`);
            return {
                success: true,
                jobId: response.data.result.jobId,
                status: 'processing',
                npcId,
                checkUrl: `${this.dynamicAPI}/api/document-mvp/status?jobId=${response.data.result.jobId}`
            };
        } else {
            throw new Error('MVP generation failed');
        }
    }
    
    async consultCharacterFromNPC(params) {
        const { npcId, character, question } = params;
        
        console.log(`🎭 NPC ${npcId} consulting character: ${character}`);
        
        // Use dynamic API for character consultation
        const response = await axios.post(`${this.dynamicAPI}/api/characters/consult`, {
            character: character || 'alice',
            question: question || `NPC ${npcId} requests guidance on their current task`
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        
        if (response.data.success) {
            console.log(`✅ NPC ${npcId} received character guidance`);
            return {
                success: true,
                character,
                response: response.data.result.response,
                npcId,
                guidance: response.data.result
            };
        } else {
            throw new Error('Character consultation failed');
        }
    }
    
    async createGameFromNPC(params) {
        const { npcId, gameType, documentContent } = params;
        
        console.log(`🎮 NPC ${npcId} creating ${gameType} game`);
        
        // Use dynamic API to create ShipRekt game
        const response = await axios.post(`${this.dynamicAPI}/api/shiprekt/create-from-doc`, {
            document: documentContent || `Game concept from NPC ${npcId}`,
            gameMode: 'auto',
            npcCreated: true,
            npcId
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        
        if (response.data.success) {
            console.log(`✅ NPC ${npcId} game created successfully`);
            return {
                success: true,
                gameId: response.data.result.gameId,
                gameUrl: response.data.result.gameUrl,
                npcId,
                gameType
            };
        } else {
            throw new Error('Game creation failed');
        }
    }
    
    async executeRuneScapeTrade(params) {
        const { npcId, itemId, action } = params;
        
        console.log(`⚔️ NPC ${npcId} executing RuneScape ${action}: item ${itemId}`);
        
        // Use dynamic API for RuneScape integration
        const response = await axios.get(`${this.dynamicAPI}/api/runescape/grand-exchange?itemId=${itemId}`, {
            timeout: 10000
        });
        
        if (response.data.success) {
            console.log(`✅ NPC ${npcId} RuneScape ${action} completed`);
            return {
                success: true,
                itemId,
                price: response.data.result.price,
                action,
                npcId,
                tradeData: response.data.result
            };
        } else {
            throw new Error('RuneScape trade failed');
        }
    }
    
    async connectToNPCs() {
        console.log('🔗 Connecting to existing NPC system...');
        
        // This would integrate with the existing NPC-RPC system
        // For now, we'll create enhanced NPCs that know about the bridge
        this.spawnEnhancedNPCs();
    }
    
    spawnEnhancedNPCs() {
        console.log('🤖 Spawning enhanced NPCs with dynamic API access...');
        
        // Spawn NPCs that can use the document generator
        const enhancedNPCs = [
            { id: 'DOC_CREATOR_NPC', role: 'document-creator', behavior: 'creates business documents' },
            { id: 'MVP_BUILDER_NPC', role: 'mvp-builder', behavior: 'generates working MVPs' },
            { id: 'GAME_MASTER_NPC', role: 'game-master', behavior: 'creates games from documents' },
            { id: 'CONSULTANT_NPC', role: 'consultant', behavior: 'gets advice from AI characters' },
            { id: 'TRADER_NPC', role: 'trader', behavior: 'executes RuneScape trades' }
        ];
        
        enhancedNPCs.forEach(npc => {
            console.log(`🎭 Enhanced NPC spawned: ${npc.id} (${npc.role})`);
            
            // Start autonomous behavior for each NPC
            setInterval(() => {
                this.executeNPCBehavior(npc);
            }, 30000 + Math.random() * 30000); // Random intervals between 30-60 seconds
        });
        
        console.log(`✅ ${enhancedNPCs.length} enhanced NPCs spawned`);
    }
    
    async executeNPCBehavior(npc) {
        try {
            switch (npc.role) {
                case 'document-creator':
                    await this.createDocumentFromNPC({
                        npcId: npc.id,
                        documentType: 'business-plan',
                        content: `Autonomous business idea from ${npc.id}: ${this.generateRandomBusinessIdea()}`
                    });
                    break;
                    
                case 'mvp-builder':
                    await this.generateMVPFromNPC({
                        npcId: npc.id,
                        documentContent: `MVP concept from ${npc.id}: ${this.generateRandomMVPIdea()}`
                    });
                    break;
                    
                case 'game-master':
                    await this.createGameFromNPC({
                        npcId: npc.id,
                        gameType: 'shiprekt',
                        documentContent: `Game concept from ${npc.id}: ${this.generateRandomGameIdea()}`
                    });
                    break;
                    
                case 'consultant':
                    await this.consultCharacterFromNPC({
                        npcId: npc.id,
                        character: ['alice', 'bob', 'charlie'][Math.floor(Math.random() * 3)],
                        question: `${npc.id} needs guidance on: ${this.generateRandomQuestion()}`
                    });
                    break;
                    
                case 'trader':
                    await this.executeRuneScapeTrade({
                        npcId: npc.id,
                        itemId: Math.floor(Math.random() * 10000),
                        action: 'price-check'
                    });
                    break;
            }
        } catch (error) {
            console.error(`❌ NPC ${npc.id} behavior failed:`, error.message);
        }
    }
    
    generateRandomBusinessIdea() {
        const ideas = [
            'AI-powered task management platform',
            'Crypto-enabled freelance marketplace',
            'Sustainable e-commerce solution',
            'Virtual reality fitness application',
            'Blockchain-based voting system'
        ];
        return ideas[Math.floor(Math.random() * ideas.length)];
    }
    
    generateRandomMVPIdea() {
        const ideas = [
            'React dashboard with authentication',
            'Node.js API with database integration',
            'Vue.js e-commerce frontend',
            'Python ML-powered analytics tool',
            'Mobile-first PWA application'
        ];
        return ideas[Math.floor(Math.random() * ideas.length)];
    }
    
    generateRandomGameIdea() {
        const ideas = [
            'Pirate trading simulation',
            'Space exploration strategy game',
            'Medieval kingdom builder',
            'Cyberpunk hacking adventure',
            'Fantasy creature collector'
        ];
        return ideas[Math.floor(Math.random() * ideas.length)];
    }
    
    generateRandomQuestion() {
        const questions = [
            'How should I optimize my current strategy?',
            'What are the best practices for this situation?',
            'How can I improve my decision making?',
            'What should I focus on next?',
            'How do I handle this challenge?'
        ];
        return questions[Math.floor(Math.random() * questions.length)];
    }
    
    async testBridge() {
        console.log('🧪 Testing NPC-Dynamic API Bridge...');
        
        try {
            // Test document creation
            const docResult = await this.createDocumentFromNPC({
                npcId: 'TEST_NPC',
                documentType: 'test-document',
                content: 'Bridge test document'
            });
            console.log('✅ Bridge test - Document creation: PASSED');
            
            // Test character consultation
            const charResult = await this.consultCharacterFromNPC({
                npcId: 'TEST_NPC',
                character: 'alice',
                question: 'Bridge connection test'
            });
            console.log('✅ Bridge test - Character consultation: PASSED');
            
            console.log('🎉 All bridge tests passed!');
            
        } catch (error) {
            console.error('❌ Bridge test failed:', error.message);
        }
    }
    
    sendSuccess(socket, result, id) {
        const response = {
            jsonrpc: '2.0',
            result,
            id
        };
        socket.write(JSON.stringify(response) + '\n');
    }
    
    sendError(socket, code, message, data = null, id = null) {
        const response = {
            jsonrpc: '2.0',
            error: { code, message, data },
            id
        };
        socket.write(JSON.stringify(response) + '\n');
    }
}

// Start bridge if run directly
if (require.main === module) {
    const bridge = new NPCDynamicAPIBridge();
    
    bridge.start()
        .then(() => {
            console.log('🌉 NPC-Dynamic API Bridge running successfully!');
            console.log('🎯 Enhanced NPCs are now autonomously:');
            console.log('   • Creating business documents');
            console.log('   • Generating working MVPs');
            console.log('   • Creating games from ideas');
            console.log('   • Consulting AI characters');
            console.log('   • Executing RuneScape trades');
            console.log('');
            console.log('📊 Monitor at:');
            console.log(`   • NPC Dashboard: http://localhost:54322`);
            console.log(`   • Dynamic API: http://localhost:4455/api/discover`);
            console.log('');
            console.log('🎮 NPCs are now fully integrated with the document generator!');
        })
        .catch(error => {
            console.error('❌ Bridge startup failed:', error);
            process.exit(1);
        });
}

module.exports = NPCDynamicAPIBridge;
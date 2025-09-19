#!/usr/bin/env node

/**
 * 🇺🇸 PATRIOT SYSTEM DEMO SCRIPT 🦅
 * Demonstrates the complete USA-themed multi-user Document Generator experience
 * 
 * This script simulates multiple users and AI activity to showcase:
 * - Real-time multi-user collaboration
 * - AI character interactions
 * - File processing with visual feedback
 * - Kafka event streaming
 * - WebSocket real-time updates
 * - Patriotic notifications and themes
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

console.log('🇺🇸 PATRIOT SYSTEM DEMO STARTING 🦅');
console.log('====================================');
console.log('');

class PatriotSystemDemo {
    constructor() {
        this.serverUrl = 'ws://localhost:3333/patriot-ws';
        this.connections = new Map();
        this.demoUsers = [
            { id: 'demo-user-1', username: 'PatriotProgrammer', avatar: '👨‍💻' },
            { id: 'demo-user-2', username: 'FreedomCoder', avatar: '👩‍💻' },
            { id: 'demo-user-3', username: 'LibertyHacker', avatar: '🦅' }
        ];
        this.demoFiles = [
            { name: 'freedom-component.tsx', type: 'typescript', content: 'React component for freedom!' },
            { name: 'democracy-service.js', type: 'javascript', content: 'Service for democratic processes' },
            { name: 'liberty-styles.css', type: 'css', content: 'Patriotic styling system' },
            { name: 'constitution-api.ts', type: 'typescript', content: 'API for constitutional rights' }
        ];
        
        this.isRunning = false;
    }
    
    async startDemo() {
        console.log('🚀 Connecting demo patriots to the system...');
        
        try {
            // Connect demo users
            for (const user of this.demoUsers) {
                await this.connectUser(user);
                await this.sleep(1000); // Stagger connections
            }
            
            console.log('✅ All demo patriots connected!');
            console.log('');
            
            // Start demo activities
            this.isRunning = true;
            this.startDemoActivities();
            
            // Show demo information
            this.showDemoInfo();
            
        } catch (error) {
            console.error('❌ Demo failed to start:', error.message);
            console.log('');
            console.log('🔍 Make sure the Patriot Multi-User Server is running:');
            console.log('   ./start-patriot-system.sh');
            console.log('');
        }
    }
    
    async connectUser(user) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.serverUrl);
            
            ws.on('open', async () => {
                console.log(`🤝 ${user.username} connected to patriot network`);
                
                // Authenticate user
                try {
                    const authResponse = await fetch('http://localhost:3333/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            username: user.username, 
                            password: 'patriot' 
                        })
                    });
                    
                    const authData = await authResponse.json();
                    
                    if (authData.success) {
                        // Send auth token via WebSocket
                        ws.send(JSON.stringify({
                            type: 'user_auth',
                            token: authData.token
                        }));
                        
                        user.token = authData.token;
                    }
                    
                } catch (error) {
                    console.log(`⚠️ ${user.username} using guest access`);
                }
                
                this.connections.set(user.id, { ws, user });
                resolve();
            });
            
            ws.on('error', (error) => {
                console.error(`❌ ${user.username} connection failed:`, error.message);
                reject(error);
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleDemoMessage(user, message);
                } catch (error) {
                    // Ignore parsing errors in demo
                }
            });
        });
    }
    
    handleDemoMessage(user, message) {
        switch (message.type) {
            case 'welcome':
                console.log(`🎉 ${user.username} received patriotic welcome`);
                break;
                
            case 'auth_success':
                console.log(`✅ ${user.username} authenticated successfully`);
                break;
                
            case 'ai_response':
                console.log(`🤖 AI responded to ${user.username}: ${message.response}`);
                break;
                
            // Add more message handlers as needed
        }
    }
    
    startDemoActivities() {
        console.log('🎭 Starting patriotic demo activities...');
        console.log('');
        
        // Simulate file uploads
        setTimeout(() => this.simulateFileUploads(), 2000);
        
        // Simulate AI interactions
        setTimeout(() => this.simulateAIInteractions(), 5000);
        
        // Simulate collaborative editing
        setTimeout(() => this.simulateCollaboration(), 8000);
        
        // Continuous activity
        setInterval(() => {
            if (this.isRunning) {
                this.simulateRandomActivity();
            }
        }, 10000);
    }
    
    async simulateFileUploads() {
        console.log('📁 Demo: Simulating patriotic file uploads...');
        
        for (let i = 0; i < this.demoFiles.length; i++) {
            const user = this.demoUsers[i % this.demoUsers.length];
            const file = this.demoFiles[i];
            const connection = this.connections.get(user.id);
            
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
                console.log(`   📄 ${user.username} uploading ${file.name}`);
                
                connection.ws.send(JSON.stringify({
                    type: 'file_drop',
                    fileName: file.name,
                    fileType: file.type,
                    fileContent: file.content
                }));
                
                await this.sleep(2000);
            }
        }
    }
    
    async simulateAIInteractions() {
        console.log('🤖 Demo: Simulating AI character interactions...');
        
        const interactions = [
            'Please analyze this code for freedom violations',
            'Help me optimize this for maximum liberty',
            'Generate patriotic documentation',
            'Scan for democracy patterns',
            'Create freedom-first architecture'
        ];
        
        const aiAgents = ['ralph', 'cal', 'arty', 'charlie'];
        
        for (let i = 0; i < interactions.length; i++) {
            const user = this.demoUsers[i % this.demoUsers.length];
            const interaction = interactions[i];
            const aiAgent = aiAgents[i % aiAgents.length];
            const connection = this.connections.get(user.id);
            
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
                console.log(`   💬 ${user.username} talking to ${aiAgent}: "${interaction}"`);
                
                connection.ws.send(JSON.stringify({
                    type: 'ai_interact',
                    aiAgent: aiAgent,
                    interaction: interaction,
                    data: { message: interaction }
                }));
                
                await this.sleep(3000);
            }
        }
    }
    
    async simulateCollaboration() {
        console.log('👥 Demo: Simulating patriotic collaboration...');
        
        const collaborativeActions = [
            { action: 'cursor_move', description: 'moving cursor around dashboard' },
            { action: 'user_activity', description: 'reviewing AI suggestions' },
            { action: 'user_interaction', description: 'clicking on components' }
        ];
        
        for (let i = 0; i < collaborativeActions.length; i++) {
            const user = this.demoUsers[i];
            const action = collaborativeActions[i];
            const connection = this.connections.get(user.id);
            
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
                console.log(`   🤝 ${user.username} ${action.description}`);
                
                connection.ws.send(JSON.stringify({
                    type: action.action,
                    userId: user.id,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    timestamp: Date.now()
                }));
                
                await this.sleep(2000);
            }
        }
    }
    
    simulateRandomActivity() {
        if (this.connections.size === 0) return;
        
        const activities = [
            () => this.simulateFileUpload(),
            () => this.simulateAIChat(),
            () => this.simulateCursorMovement(),
            () => this.simulateUserAction()
        ];
        
        const activity = activities[Math.floor(Math.random() * activities.length)];
        activity();
    }
    
    simulateFileUpload() {
        const users = Array.from(this.connections.values());
        const user = users[Math.floor(Math.random() * users.length)];
        const files = ['patriot-util.js', 'freedom-config.json', 'liberty-test.ts', 'democracy-style.css'];
        const fileName = files[Math.floor(Math.random() * files.length)];
        
        if (user.ws.readyState === WebSocket.OPEN) {
            console.log(`📁 ${user.user.username} uploaded ${fileName} (random activity)`);
            
            user.ws.send(JSON.stringify({
                type: 'file_drop',
                fileName: fileName,
                fileType: 'text',
                fileContent: '// Patriotic code for freedom!'
            }));
        }
    }
    
    simulateAIChat() {
        const users = Array.from(this.connections.values());
        const user = users[Math.floor(Math.random() * users.length)];
        const aiAgents = ['ralph', 'cal', 'arty', 'charlie'];
        const aiAgent = aiAgents[Math.floor(Math.random() * aiAgents.length)];
        const questions = [
            'What\'s your status?',
            'How can you help me?',
            'Show me your capabilities',
            'Process this quickly'
        ];
        const question = questions[Math.floor(Math.random() * questions.length)];
        
        if (user.ws.readyState === WebSocket.OPEN) {
            console.log(`💬 ${user.user.username} asked ${aiAgent}: "${question}" (random chat)`);
            
            user.ws.send(JSON.stringify({
                type: 'ai_interact',
                aiAgent: aiAgent,
                interaction: question,
                data: { message: question }
            }));
        }
    }
    
    simulateCursorMovement() {
        const users = Array.from(this.connections.values());
        const user = users[Math.floor(Math.random() * users.length)];
        
        if (user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(JSON.stringify({
                type: 'cursor_move',
                userId: user.user.id,
                x: Math.random() * 100,
                y: Math.random() * 100,
                timestamp: Date.now()
            }));
        }
    }
    
    simulateUserAction() {
        const users = Array.from(this.connections.values());
        const user = users[Math.floor(Math.random() * users.length)];
        const actions = ['viewing stats', 'checking AI performance', 'organizing files'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        if (user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(JSON.stringify({
                type: 'user_activity',
                userId: user.user.id,
                activity: action
            }));
        }
    }
    
    showDemoInfo() {
        console.log('🎯 DEMO INFORMATION');
        console.log('==================');
        console.log('');
        console.log('🌐 Dashboard: http://localhost:3333');
        console.log('📡 WebSocket: ws://localhost:3333/patriot-ws');
        console.log('');
        console.log('👥 Demo Users Connected:');
        this.demoUsers.forEach(user => {
            console.log(`   ${user.avatar} ${user.username}`);
        });
        console.log('');
        console.log('🤖 AI Characters Active:');
        console.log('   🤖 Ralph   - Code Analysis');
        console.log('   🧠 Cal     - Learning AI');
        console.log('   🎨 Arty    - Creative AI');
        console.log('   ⚡ Charlie - Scanning AI');
        console.log('');
        console.log('🎭 Demo Activities:');
        console.log('   ✅ File uploads every 10 seconds');
        console.log('   ✅ AI interactions and responses');
        console.log('   ✅ Real-time cursor tracking');
        console.log('   ✅ Collaborative notifications');
        console.log('   ✅ Patriotic visual effects');
        console.log('');
        console.log('🔥 DEMO RUNNING - Open the dashboard to see the magic!');
        console.log('Press Ctrl+C to stop the demo');
    }
    
    async stopDemo() {
        console.log('');
        console.log('🛑 Stopping patriotic demo...');
        
        this.isRunning = false;
        
        // Close all connections
        for (const [userId, connection] of this.connections) {
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.close();
            }
        }
        
        console.log('✅ Demo stopped. Thank you for witnessing freedom!');
        console.log('🇺🇸 LIBERTY PRESERVED 🦅');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Handle graceful shutdown
let demo = null;

process.on('SIGINT', async () => {
    if (demo) {
        await demo.stopDemo();
    }
    process.exit(0);
});

// Start the demo
async function main() {
    demo = new PatriotSystemDemo();
    await demo.startDemo();
}

main().catch(console.error);
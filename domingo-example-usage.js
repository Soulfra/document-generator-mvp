#!/usr/bin/env node

/**
 * 🎭 DOMINGO ORCHESTRATOR - EXAMPLE USAGE
 * 
 * Shows how to use the abstract package wrapper
 */

const DomingoOrchestrator = require('./domingo-package');

async function basicExample() {
    console.log('🎭 Basic Domingo Example\n');
    
    // Create orchestrator with default settings
    const domingo = new DomingoOrchestrator();
    
    // Listen to events
    domingo.on('started', (info) => {
        console.log('✅ Orchestrator started!');
        console.log(`   Interface: ${info.urls.orchestrator}`);
    });
    
    domingo.on('taskCreated', (task) => {
        console.log(`📋 Task created: ${task.title}`);
    });
    
    domingo.on('chatResponse', (response) => {
        console.log(`💬 Domingo says: ${response.response}`);
    });
    
    // Start the orchestrator
    await domingo.start();
    
    // Create a task
    const task = await domingo.createTask({
        title: 'Implement user authentication',
        description: 'Add OAuth2 login with Google',
        priority: 'high',
        tags: ['auth', 'security', 'oauth']
    });
    
    // Chat with Domingo
    const chatResponse = await domingo.chat('What is the system status?');
    
    // Get all tasks
    const tasks = await domingo.getTasks();
    console.log(`\n📊 Total tasks: ${tasks.length}`);
    
    // Stop after 10 seconds
    setTimeout(async () => {
        await domingo.stop();
        console.log('\n👋 Example completed!');
        process.exit(0);
    }, 10000);
}

async function customizedExample() {
    console.log('🎨 Customized Domingo Example\n');
    
    // Create orchestrator with custom configuration
    const domingo = DomingoOrchestrator.create({
        port: 8888,
        
        // Custom colors
        colors: {
            primary: '#ff6600',  // Orange instead of purple
            success: '#00ff00',
            warning: '#ffff00',
            error: '#ff0000'
        },
        
        // Add custom character
        characters: [
            ...DomingoOrchestrator.prototype.getDefaultCharacters(),
            {
                id: 'zara',
                name: 'Zara',
                role: 'AI Specialist',
                specializations: ['llm', 'prompt-engineering', 'fine-tuning'],
                emoji: '🧠'
            }
        ],
        
        // Feature toggles
        features: {
            forum: false,  // Disable forum integration
            testing: true,
            database: true,
            websocket: true
        },
        
        // Custom hooks
        hooks: {
            onTaskCreate: async (task) => {
                console.log(`🎯 Hook: Intercepting task creation for "${task.title}"`);
                // Add custom validation or modification
                task.customField = 'added-by-hook';
                return task;
            },
            
            onChatMessage: async (message) => {
                console.log(`🎯 Hook: Processing chat message: "${message}"`);
                // Could add sentiment analysis, filtering, etc.
                return message;
            }
        }
    });
    
    await domingo.start();
    
    // Add another custom character at runtime
    domingo.addCharacter({
        id: 'max',
        name: 'Max',
        role: 'Performance Engineer',
        specializations: ['optimization', 'profiling', 'caching'],
        emoji: '⚡'
    });
    
    // Use the orchestrator
    await domingo.createTask({
        title: 'Optimize database queries',
        description: 'Improve query performance by 50%',
        tags: ['performance', 'database']
    });
    
    const characters = await domingo.getCharacters();
    console.log(`\n👥 Available characters: ${characters.map(c => c.name).join(', ')}`);
}

async function pluginExample() {
    console.log('🔌 Plugin Example\n');
    
    // Create a simple plugin
    const loggingPlugin = {
        install(orchestrator) {
            console.log('📝 Logging plugin installed');
            
            // Intercept all events
            const originalEmit = orchestrator.emit.bind(orchestrator);
            orchestrator.emit = function(event, ...args) {
                console.log(`[LOG] Event: ${event}`, args);
                return originalEmit(event, ...args);
            };
        }
    };
    
    // Create orchestrator with plugin
    const domingo = new DomingoOrchestrator()
        .use(loggingPlugin)
        .use((orchestrator) => {
            // Inline plugin
            orchestrator.on('taskCreated', (task) => {
                console.log(`[INLINE PLUGIN] Task created with ID: ${task.task_id}`);
            });
        });
    
    await domingo.start();
    
    await domingo.createTask({
        title: 'Test plugin system',
        description: 'Verify plugins are working'
    });
}

async function remoteApiExample() {
    console.log('🌐 Remote API Example\n');
    
    // Deploy orchestrator
    const domingo = await DomingoOrchestrator.deploy({
        port: 9999
    });
    
    // Now you can access it via HTTP from anywhere
    console.log('📡 Orchestrator API available at http://localhost:9999');
    console.log('\nExample curl commands:');
    console.log('  curl http://localhost:9999/api/system-status');
    console.log('  curl -X POST http://localhost:9999/api/chat -H "Content-Type: application/json" -d \'{"message":"Hello Domingo"}\'');
    console.log('  curl http://localhost:9999/api/tasks');
}

// Menu to run different examples
async function main() {
    console.log('🎭 DOMINGO ORCHESTRATOR EXAMPLES');
    console.log('================================\n');
    console.log('1. Basic Example');
    console.log('2. Customized Example');
    console.log('3. Plugin Example');
    console.log('4. Remote API Example');
    console.log('5. Run All Examples\n');
    
    const example = process.argv[2] || '1';
    
    try {
        switch (example) {
            case '1':
                await basicExample();
                break;
            case '2':
                await customizedExample();
                break;
            case '3':
                await pluginExample();
                break;
            case '4':
                await remoteApiExample();
                break;
            case '5':
                await basicExample();
                console.log('\n---\n');
                await customizedExample();
                console.log('\n---\n');
                await pluginExample();
                console.log('\n---\n');
                await remoteApiExample();
                break;
            default:
                console.log('Invalid example number. Use 1-5.');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
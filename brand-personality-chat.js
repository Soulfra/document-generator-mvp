#!/usr/bin/env node

/**
 * 🎭 BRAND PERSONALITY CHAT SYSTEM
 * 
 * Creates individual chat interfaces for each character brand with:
 * - Unique personalities and speaking styles
 * - Domain expertise and component ownership
 * - Brand-consistent responses and guidance
 * - Integration with existing document-to-MVP system
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

// Import character integration system
const CharacterDocumentationIntegration = require('./character-doc-integration.js');

class BrandPersonalityChat extends EventEmitter {
    constructor(port = 3006) {
        super();
        
        this.port = port;
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // Initialize character system
        this.characterSystem = new CharacterDocumentationIntegration();
        
        // Chat history storage
        this.chatHistory = new Map();
        
        // Response contexts for each character
        this.responseContexts = new Map();
        
        this.setupRoutes();
        this.initializeCharacters();
    }
    
    async initializeCharacters() {
        console.log('🎭 Initializing brand personality chat system...');
        
        // Initialize character system
        try {
            await this.characterSystem.initializeSystem();
            console.log('✅ Character integration system ready');
        } catch (error) {
            console.warn('⚠️ Character system initialization in progress, using defaults');
        }
        
        // Load all character personalities
        const characters = this.characterSystem.getAllCharacters();
        
        for (const character of characters) {
            if (character.personality) {
                this.initializeCharacterContext(character);
                console.log(`🤖 ${character.personality.name}: Chat personality loaded`);
            }
        }
        
        console.log(`🎯 ${characters.length} brand personalities ready for chat`);
    }
    
    initializeCharacterContext(character) {
        const name = character.personality.name;
        const domain = character.domain;
        
        this.responseContexts.set(name, {
            character: character,
            conversationCount: 0,
            specialties: domain.expertise || [],
            ownedComponents: character.personality.ownedComponents || [],
            recentTopics: [],
            responseStyle: character.personality.style,
            brandColor: domain.color,
            catchphrases: character.personality.catchphrases || [],
            templates: character.personality.responseTemplates || {}
        });
        
        // Initialize empty chat history
        this.chatHistory.set(name, []);
    }
    
    setupRoutes() {
        // Main chat interface
        this.app.get('/', (req, res) => {
            res.send(this.generateMainInterface());
        });
        
        // Individual character chat pages
        this.app.get('/chat/:character', (req, res) => {
            const character = req.params.character;
            res.send(this.generateCharacterChatInterface(character));
        });
        
        // Chat API endpoint
        this.app.post('/api/chat/:character', async (req, res) => {
            const character = req.params.character;
            const { message, context } = req.body;
            
            try {
                const response = await this.processChat(character, message, context);
                res.json(response);
            } catch (error) {
                console.error(`❌ Chat error for ${character}:`, error);
                res.status(500).json({ 
                    error: 'Chat processing failed',
                    character: character,
                    fallback: `🤖 ${character}: Sorry, I'm experiencing technical difficulties. Please try again.`
                });
            }
        });
        
        // Get character info
        this.app.get('/api/character/:character', (req, res) => {
            const character = req.params.character;
            const info = this.characterSystem.getCharacterInfo(character);
            
            if (info.personality) {
                res.json({
                    name: info.personality.name,
                    domain: info.domain.domain,
                    expertise: info.domain.expertise,
                    color: info.domain.color,
                    greeting: info.personality.greeting,
                    components: info.personality.ownedComponents?.length || 0,
                    chatEndpoint: info.chatInterface?.chatEndpoint
                });
            } else {
                res.status(404).json({ error: 'Character not found' });
            }
        });
        
        // List all characters
        this.app.get('/api/characters', (req, res) => {
            const characters = this.characterSystem.getAllCharacters()
                .filter(char => char.personality)
                .map(char => ({
                    name: char.personality.name,
                    domain: char.domain.domain,
                    color: char.domain.color,
                    expertise: char.domain.expertise,
                    chatUrl: `/chat/${char.personality.name.toLowerCase()}`
                }));
            
            res.json({ characters });
        });
        
        // Get chat history
        this.app.get('/api/chat/:character/history', (req, res) => {
            const character = req.params.character;
            const history = this.chatHistory.get(character) || [];
            res.json({ character, history });
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'brand-personality-chat',
                characters: this.responseContexts.size,
                totalChats: Array.from(this.chatHistory.values())
                    .reduce((total, history) => total + history.length, 0)
            });
        });
    }
    
    async processChat(characterName, message, context = {}) {
        const character = this.responseContexts.get(characterName);
        
        if (!character) {
            throw new Error(`Character ${characterName} not found`);
        }
        
        // Add message to history
        const history = this.chatHistory.get(characterName) || [];
        const timestamp = Date.now();
        
        history.push({
            type: 'user',
            message: message,
            timestamp: timestamp,
            context: context
        });
        
        // Generate character response
        const response = await this.generateCharacterResponse(character, message, context, history);
        
        // Add response to history
        history.push({
            type: 'character',
            message: response.message,
            timestamp: Date.now(),
            personality: response.personality,
            components: response.relatedComponents
        });
        
        // Update history
        this.chatHistory.set(characterName, history);
        
        // Update character context
        character.conversationCount++;
        character.recentTopics.push(this.extractTopics(message));
        
        // Keep recent topics to last 10
        if (character.recentTopics.length > 10) {
            character.recentTopics = character.recentTopics.slice(-10);
        }
        
        return {
            character: characterName,
            response: response,
            context: {
                conversationCount: character.conversationCount,
                recentTopics: character.recentTopics,
                expertise: character.specialties
            }
        };
    }
    
    async generateCharacterResponse(character, message, context, history) {
        const personality = character.character.personality;
        const domain = character.character.domain;
        
        // Determine response type
        const responseType = this.classifyMessage(message);
        
        // Get appropriate template
        const template = personality.responseTemplates[responseType] || personality.responseTemplates.explanation;
        
        // Extract key topics from message
        const topics = this.extractTopics(message);
        
        // Find related components
        const relatedComponents = this.findRelatedComponents(character, topics);
        
        // Generate contextual response
        let response = template.replace('{topic}', topics.join(' and '));
        
        // Add personality elements
        if (Math.random() > 0.7 && personality.catchphrases.length > 0) {
            const catchphrase = personality.catchphrases[
                Math.floor(Math.random() * personality.catchphrases.length)
            ];
            response += `\n\n*${catchphrase}*`;
        }
        
        // Add component-specific guidance if relevant
        if (relatedComponents.length > 0) {
            response += `\n\n📋 **Related Components I Manage:**`;
            relatedComponents.slice(0, 3).forEach(comp => {
                response += `\n- **${comp.component}**: ${comp.matches.join(', ')}`;
            });
            
            if (relatedComponents.length > 3) {
                response += `\n- ...and ${relatedComponents.length - 3} more components`;
            }
        }
        
        // Add domain-specific resources
        if (domain.documentation.length > 0) {
            response += `\n\n📚 **Documentation I Maintain:**`;
            domain.documentation.slice(0, 3).forEach(doc => {
                response += `\n- [${doc}](./docs/${domain.domain}/${doc}.md)`;
            });
        }
        
        // Add personality color
        const styledResponse = `<div style="border-left: 4px solid ${domain.color}; padding-left: 12px; margin: 8px 0;">${response}</div>`;
        
        return {
            message: styledResponse,
            personality: {
                name: personality.name,
                style: personality.style,
                color: domain.color
            },
            relatedComponents: relatedComponents,
            suggestedActions: this.generateSuggestedActions(character, topics),
            navigation: {
                relatedDocs: domain.documentation.slice(0, 3),
                expertise: domain.expertise,
                components: relatedComponents.length
            }
        };
    }
    
    classifyMessage(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('how') || msg.includes('what') || msg.includes('why')) {
            return 'explanation';
        } else if (msg.includes('should') || msg.includes('recommend') || msg.includes('best')) {
            return 'recommendation';
        } else if (msg.includes('problem') || msg.includes('issue') || msg.includes('error')) {
            return 'warning';
        } else {
            return 'explanation';
        }
    }
    
    extractTopics(message) {
        const topics = [];
        const msg = message.toLowerCase();
        
        // Domain-specific keywords
        const domainKeywords = {
            'privacy': ['privacy', 'security', 'encryption', 'vault', 'data'],
            'frontend': ['ui', 'ux', 'interface', 'design', 'component', 'react'],
            'backend': ['api', 'server', 'database', 'architecture', 'scale'],
            'integration': ['connect', 'integrate', 'api', 'webhook', 'service'],
            'debugging': ['bug', 'error', 'test', 'debug', 'issue', 'fix']
        };
        
        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            if (keywords.some(keyword => msg.includes(keyword))) {
                topics.push(domain);
            }
        }
        
        return topics.length > 0 ? topics : ['general'];
    }
    
    findRelatedComponents(character, topics) {
        const components = character.ownedComponents || [];
        
        if (components.length === 0) {
            return [];
        }
        
        return components.filter(comp => {
            const compText = (comp.component + ' ' + comp.matches.join(' ')).toLowerCase();
            return topics.some(topic => compText.includes(topic));
        });
    }
    
    generateSuggestedActions(character, topics) {
        const actions = [];
        const domain = character.character.domain;
        
        if (topics.includes('privacy') && character.character.personality.name === 'DeathToData') {
            actions.push('🔒 Review data encryption setup');
            actions.push('🗑️ Configure data deletion policies');
        }
        
        if (topics.includes('frontend') && character.character.personality.name === 'FrontendWarrior') {
            actions.push('🎨 Generate component library');
            actions.push('📱 Test mobile responsiveness');
        }
        
        if (topics.includes('backend') && character.character.personality.name === 'BackendBeast') {
            actions.push('⚡ Analyze performance bottlenecks');
            actions.push('🗄️ Optimize database queries');
        }
        
        // Generic actions
        actions.push(`🔗 Explore ${domain.domain} documentation`);
        actions.push(`💬 Chat about ${domain.expertise.join(' or ')}`);
        
        return actions.slice(0, 4); // Limit to 4 actions
    }
    
    generateMainInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎭 Brand Personality Chat Hub</title>
    <style>
        body {
            font-family: 'SF Mono', Monaco, monospace;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 2.5rem;
        }
        
        .characters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .character-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border-left: 6px solid #3498db;
            cursor: pointer;
        }
        
        .character-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .character-card.death-to-data { border-left-color: #e74c3c; }
        .character-card.frontend-warrior { border-left-color: #27ae60; }
        .character-card.backend-beast { border-left-color: #3498db; }
        .character-card.integration-ninja { border-left-color: #f39c12; }
        .character-card.debug-detective { border-left-color: #9b59b6; }
        .character-card.blame-chain { border-left-color: #e91e63; }
        
        .character-name {
            font-size: 1.4rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .character-domain {
            color: #7f8c8d;
            margin-bottom: 12px;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 1px;
        }
        
        .character-greeting {
            font-style: italic;
            color: #34495e;
            margin-bottom: 16px;
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
        }
        
        .expertise-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 16px;
        }
        
        .expertise-tag {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
        }
        
        .chat-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            width: 100%;
            transition: all 0.3s ease;
        }
        
        .chat-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .stats {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .stat {
            display: inline-block;
            margin: 0 20px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #3498db;
        }
        
        .stat-label {
            color: #7f8c8d;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 Brand Personality Chat Hub</h1>
        <p style="text-align: center; color: #7f8c8d; font-size: 1.1rem;">
            Chat with specialized AI personalities about their domains of expertise
        </p>
        
        <div class="stats" id="statsContainer">
            <div class="stat">
                <div class="stat-number" id="characterCount">0</div>
                <div class="stat-label">Characters</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="totalChats">0</div>
                <div class="stat-label">Total Chats</div>
            </div>
            <div class="stat">
                <div class="stat-number">100%</div>
                <div class="stat-label">Personality Match</div>
            </div>
        </div>
        
        <div class="characters-grid" id="charactersGrid">
            <!-- Characters loaded dynamically -->
        </div>
    </div>
    
    <script>
        async function loadCharacters() {
            try {
                const response = await fetch('/api/characters');
                const data = await response.json();
                
                document.getElementById('characterCount').textContent = data.characters.length;
                
                const grid = document.getElementById('charactersGrid');
                grid.innerHTML = '';
                
                data.characters.forEach(character => {
                    const card = document.createElement('div');
                    card.className = \`character-card \${character.name.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\\s+/g, '-').toLowerCase()}\`;
                    
                    card.innerHTML = \`
                        <div class="character-name">\${character.name}</div>
                        <div class="character-domain">\${character.domain}</div>
                        <div class="expertise-tags">
                            \${character.expertise.map(exp => \`<span class="expertise-tag">\${exp}</span>\`).join('')}
                        </div>
                        <button class="chat-button" onclick="openChat('\${character.name.toLowerCase()}')">
                            💬 Chat with \${character.name}
                        </button>
                    \`;
                    
                    grid.appendChild(card);
                });
                
            } catch (error) {
                console.error('Failed to load characters:', error);
                document.getElementById('charactersGrid').innerHTML = '<p style="text-align: center; color: #e74c3c;">Failed to load characters. Please refresh the page.</p>';
            }
        }
        
        function openChat(character) {
            window.open(\`/chat/\${character}\`, '_blank');
        }
        
        // Load characters on page load
        loadCharacters();
        
        // Refresh stats every 30 seconds
        setInterval(async () => {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                document.getElementById('totalChats').textContent = data.totalChats || 0;
            } catch (error) {
                console.error('Failed to refresh stats:', error);
            }
        }, 30000);
    </script>
</body>
</html>`;
    }
    
    generateCharacterChatInterface(characterName) {
        const characterKey = characterName.charAt(0).toUpperCase() + characterName.slice(1);
        const context = this.responseContexts.get(characterKey);
        
        if (!context) {
            return `<h1>Character "${characterName}" not found</h1><a href="/">← Back to Hub</a>`;
        }
        
        const character = context.character;
        const personality = character.personality;
        const domain = character.domain;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💬 Chat with ${personality.name}</title>
    <style>
        body {
            font-family: 'SF Mono', Monaco, monospace;
            background: linear-gradient(135deg, ${domain.color}20 0%, ${domain.color}40 100%);
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: white;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-bottom: 4px solid ${domain.color};
        }
        
        .character-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .character-details h1 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.8rem;
        }
        
        .character-details p {
            margin: 4px 0 0 0;
            color: #7f8c8d;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 1px;
        }
        
        .back-button {
            background: ${domain.color};
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            font-weight: bold;
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
            padding: 20px;
            box-sizing: border-box;
        }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            min-height: 400px;
        }
        
        .message {
            margin: 16px 0;
            padding: 12px;
            border-radius: 8px;
            max-width: 80%;
        }
        
        .user-message {
            background: #ecf0f1;
            margin-left: auto;
            text-align: right;
        }
        
        .character-message {
            background: ${domain.color}15;
            border-left: 4px solid ${domain.color};
        }
        
        .input-area {
            display: flex;
            gap: 12px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .message-input {
            flex: 1;
            border: 2px solid #ecf0f1;
            border-radius: 8px;
            padding: 12px;
            font-size: 1rem;
            font-family: inherit;
        }
        
        .message-input:focus {
            outline: none;
            border-color: ${domain.color};
        }
        
        .send-button {
            background: ${domain.color};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .send-button:hover {
            opacity: 0.9;
        }
        
        .greeting {
            background: ${domain.color}10;
            border: 2px solid ${domain.color}30;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            font-style: italic;
        }
        
        .typing {
            color: #7f8c8d;
            font-style: italic;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="character-info">
            <div class="character-details">
                <h1>💬 ${personality.name}</h1>
                <p>${domain.domain} • ${domain.expertise.join(', ')}</p>
            </div>
            <a href="/" class="back-button">← Back to Hub</a>
        </div>
    </div>
    
    <div class="chat-container">
        <div class="messages" id="messages">
            <div class="greeting">
                <strong>${personality.name}:</strong> ${personality.greeting}
            </div>
        </div>
        
        <div class="input-area">
            <input 
                type="text" 
                id="messageInput" 
                class="message-input" 
                placeholder="Ask ${personality.name} about ${domain.domain}..."
                onkeypress="if(event.key==='Enter') sendMessage()"
            >
            <button class="send-button" onclick="sendMessage()">Send</button>
        </div>
    </div>
    
    <script>
        const characterName = '${characterKey}';
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            addMessage('user', message);
            input.value = '';
            
            // Show typing indicator
            const typingId = addMessage('character', '<span class="typing">${personality.name} is thinking...</span>');
            
            try {
                const response = await fetch(\`/api/chat/\${characterName}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
                
                const data = await response.json();
                
                // Remove typing indicator
                document.getElementById(typingId).remove();
                
                // Add character response
                addMessage('character', data.response.message);
                
                // Add suggested actions if available
                if (data.response.suggestedActions && data.response.suggestedActions.length > 0) {
                    const actionsHtml = \`
                        <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                            <strong>💡 Suggested Actions:</strong>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                \${data.response.suggestedActions.map(action => \`<li>\${action}</li>\`).join('')}
                            </ul>
                        </div>
                    \`;
                    addMessage('character', actionsHtml);
                }
                
            } catch (error) {
                // Remove typing indicator
                document.getElementById(typingId).remove();
                
                addMessage('character', \`❌ Sorry, I encountered an error: \${error.message}\`);
            }
        }
        
        function addMessage(type, content) {
            const messages = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            const messageId = 'msg_' + Date.now();
            
            messageDiv.id = messageId;
            messageDiv.className = \`message \${type}-message\`;
            messageDiv.innerHTML = content;
            
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
            
            return messageId;
        }
        
        // Load chat history on page load
        async function loadChatHistory() {
            try {
                const response = await fetch(\`/api/chat/\${characterName}/history\`);
                const data = await response.json();
                
                data.history.forEach(msg => {
                    if (msg.type === 'user') {
                        addMessage('user', msg.message);
                    } else {
                        addMessage('character', msg.message);
                    }
                });
                
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        }
        
        // loadChatHistory();
        
        // Focus input on page load
        document.getElementById('messageInput').focus();
    </script>
</body>
</html>`;
    }
    
    async start() {
        await this.initializeCharacters();
        
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, '0.0.0.0', () => {
                const networkIP = this.getLocalNetworkIP();
                
                console.log('🎭 BRAND PERSONALITY CHAT SYSTEM');
                console.log('================================');
                console.log('');
                console.log(`🌐 Local: http://localhost:${this.port}`);
                console.log(`📱 Network: http://${networkIP}:${this.port}`);
                console.log('');
                console.log('🤖 Available Characters:');
                
                const characters = this.characterSystem.getAllCharacters().filter(c => c.personality);
                characters.forEach(char => {
                    console.log(`   • ${char.personality.name} (${char.domain.domain}) - /chat/${char.personality.name.toLowerCase()}`);
                });
                
                console.log('');
                console.log('🔗 Integration:');
                console.log(`   • Document-to-MVP: http://localhost:3000`);
                console.log(`   • Real Deployment: http://localhost:3005`);
                console.log(`   • Character Chat: http://localhost:${this.port}`);
                console.log('');
                
                resolve();
            });
            
            this.server.on('error', reject);
        });
    }
    
    getLocalNetworkIP() {
        const os = require('os');
        const interfaces = os.networkInterfaces();
        
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        
        return 'localhost';
    }
    
    async stop() {
        console.log('🛑 Stopping brand personality chat system...');
        
        if (this.server) {
            this.server.close();
        }
    }
}

module.exports = BrandPersonalityChat;

// CLI interface
if (require.main === module) {
    const chatSystem = new BrandPersonalityChat(3006);
    
    chatSystem.start().then(() => {
        console.log('✅ Brand personality chat system is ready!');
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Visit http://localhost:3006 for the chat hub');
        console.log('2. Click on any character to start chatting');
        console.log('3. Each character has unique personality and expertise');
        console.log('4. Components and documentation are linked automatically');
        console.log('');
        
    }).catch(error => {
        console.error('❌ Failed to start chat system:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\\n🛑 Shutting down chat system...');
        await chatSystem.stop();
        process.exit(0);
    });
}
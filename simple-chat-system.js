#!/usr/bin/env node

/**
 * 💬 SIMPLE CHAT SYSTEM
 * 
 * Just what we need:
 * - Chat input → save to database 
 * - Display with emojis, colors, sounds
 * - Search through our own data
 * - Show snippets from files
 * - Chapter 7 style display
 */

const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Database connection
const db = new Pool({
    connectionString: 'postgres://postgres:postgres@localhost:5432/document_generator'
});

// Create chat tables if they don't exist
async function initDatabase() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            user_message TEXT NOT NULL,
            ai_response TEXT,
            emojis JSONB DEFAULT '[]',
            colors JSONB DEFAULT '{}',
            sounds JSONB DEFAULT '[]',
            tags JSONB DEFAULT '[]',
            file_snippets JSONB DEFAULT '[]',
            embedded_data JSONB DEFAULT '{}',
            timestamp TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS file_index (
            id SERIAL PRIMARY KEY,
            file_path TEXT UNIQUE NOT NULL,
            content_hash TEXT,
            tags JSONB DEFAULT '[]',
            snippets JSONB DEFAULT '[]',
            last_indexed TIMESTAMP DEFAULT NOW()
        );
    `);
    console.log('🗄️ Database initialized');
}

// Simple file indexer for our own content
async function indexFiles() {
    const files = [
        '/Users/matthewmauer/Desktop/Document-Generator/CLAUDE.md',
        '/Users/matthewmauer/Desktop/Document-Generator/README.md',
        '/Users/matthewmauer/Desktop/Document-Generator/web-interface/index.html'
    ];
    
    for (const filePath of files) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const snippets = content.split('\n').slice(0, 10); // First 10 lines as snippets
            const tags = extractTags(content);
            
            await db.query(
                'INSERT INTO file_index (file_path, tags, snippets) VALUES ($1, $2, $3) ON CONFLICT (file_path) DO UPDATE SET tags = $2, snippets = $3, last_indexed = NOW()',
                [filePath, JSON.stringify(tags), JSON.stringify(snippets)]
            );
        } catch (error) {
            console.log(`📁 Couldn't index ${filePath}: ${error.message}`);
        }
    }
}

function extractTags(content) {
    // Extract markdown headers, code blocks, and keywords
    const tags = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
        if (line.startsWith('#')) {
            tags.push(line.replace(/#+ /, '').trim());
        }
        if (line.includes('TODO') || line.includes('FIXME')) {
            tags.push('needs-attention');
        }
        if (line.includes('docker') || line.includes('npm')) {
            tags.push('deployment');
        }
    });
    
    return tags;
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    // Generate AI response (simple for now)
    const aiResponse = generateResponse(message);
    
    // Add fun stuff
    const emojis = getEmojisForMessage(message);
    const colors = getColorsForMessage(message);
    const sounds = getSoundsForMessage(message);
    const tags = extractTags(message);
    const fileSnippets = await getRelevantSnippets(message);
    
    // Save to database
    const result = await db.query(
        'INSERT INTO chat_messages (user_message, ai_response, emojis, colors, sounds, tags, file_snippets) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [message, aiResponse, JSON.stringify(emojis), JSON.stringify(colors), JSON.stringify(sounds), JSON.stringify(tags), JSON.stringify(fileSnippets)]
    );
    
    res.json({
        success: true,
        message: result.rows[0],
        display: {
            emojis,
            colors,
            sounds,
            snippets: fileSnippets
        }
    });
});

// Get chat history
app.get('/api/chat/history', async (req, res) => {
    const result = await db.query('SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT 50');
    res.json({ messages: result.rows });
});

// Search through our data
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    
    // Search chat messages
    const chatResults = await db.query(
        'SELECT * FROM chat_messages WHERE user_message ILIKE $1 OR ai_response ILIKE $1 ORDER BY timestamp DESC',
        [`%${q}%`]
    );
    
    // Search file index
    const fileResults = await db.query(
        'SELECT * FROM file_index WHERE tags::text ILIKE $1 OR snippets::text ILIKE $1',
        [`%${q}%`]
    );
    
    res.json({
        chat: chatResults.rows,
        files: fileResults.rows
    });
});

function generateResponse(message) {
    // Simple response generation - could hook into your AI services later
    if (message.toLowerCase().includes('docker')) {
        return "🐳 Docker is running! Check the services with `docker-compose ps`";
    }
    if (message.toLowerCase().includes('database')) {
        return "🗄️ Database is connected and ready. We have chat_messages and file_index tables.";
    }
    if (message.toLowerCase().includes('chapter 7')) {
        return "📚 Chapter 7 style display coming up! Rich media, colors, and interactive elements.";
    }
    return `📝 Got your message: "${message}" - saved to database with tags and snippets!`;
}

function getEmojisForMessage(message) {
    const emojis = [];
    if (message.includes('database')) emojis.push('🗄️');
    if (message.includes('docker')) emojis.push('🐳');
    if (message.includes('chat')) emojis.push('💬');
    if (message.includes('bug') || message.includes('error')) emojis.push('🐛');
    if (message.includes('success') || message.includes('working')) emojis.push('✅');
    return emojis;
}

function getColorsForMessage(message) {
    if (message.includes('error') || message.includes('bug')) {
        return { background: '#ff6b6b', text: '#ffffff' };
    }
    if (message.includes('success') || message.includes('working')) {
        return { background: '#51cf66', text: '#ffffff' };
    }
    if (message.includes('database')) {
        return { background: '#339af0', text: '#ffffff' };
    }
    return { background: '#667eea', text: '#ffffff' };
}

function getSoundsForMessage(message) {
    const sounds = [];
    if (message.includes('error')) sounds.push('error-beep');
    if (message.includes('success')) sounds.push('success-chime');
    if (message.includes('chat')) sounds.push('message-pop');
    return sounds;
}

async function getRelevantSnippets(message) {
    try {
        const result = await db.query(
            'SELECT file_path, snippets FROM file_index WHERE tags::text ILIKE $1 OR snippets::text ILIKE $1 LIMIT 3',
            [`%${message.split(' ')[0]}%`]
        );
        return result.rows;
    } catch (error) {
        return [];
    }
}

// Serve the chat interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'chat-interface.html'));
});

async function start() {
    await initDatabase();
    await indexFiles();
    
    app.listen(3006, () => {
        console.log('💬 Chat system running at http://localhost:3006');
        console.log('📱 Features: Database storage, emojis, colors, sounds, file snippets');
        console.log('🎨 Layer: Purple (UI/Chat) - Connected to orchestrator layer');
    });
}

start().catch(console.error);
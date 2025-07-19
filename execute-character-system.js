#!/usr/bin/env node

// BASH THROUGH EXECUTION - MAKE CHARACTERS LIVE NOW
console.log('🔥 EXECUTING CHARACTER SYSTEM MAX NOW');

const CharacterSystemMAX = require('./character-system-max.js');

// Create and start immediately
const characters = new CharacterSystemMAX();

// Connect to all existing layers
console.log('\n🔗 Connecting characters to 13+ tiers...');

try {
  // Try to connect to other layers
  const Runtime = require('./runtime-layer.js');
  const Economy = require('./economy-layer.js');
  const GitLayer = require('./git-layer.js');
  
  console.log('✅ Connected to existing layers');
} catch (error) {
  console.log('⚠️  Some layers not available, characters will work standalone');
}

// Create editable web interface
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Character interaction API
app.post('/api/character/speak', (req, res) => {
  const { character, message, emotion } = req.body;
  const char = characters.getCharacter(character);
  
  if (char) {
    const response = char.speak(message, emotion);
    res.json({ success: true, response });
  } else {
    res.json({ success: false, error: 'Character not found' });
  }
});

// Schema editing API
app.get('/api/schemas', (req, res) => {
  const schemas = Array.from(characters.schemas.entries()).map(([key, value]) => ({
    key,
    ...value
  }));
  res.json(schemas);
});

app.put('/api/schemas/:key', (req, res) => {
  const { key } = req.params;
  const updates = req.body;
  
  characters.schemas.set(key, updates);
  res.json({ success: true, message: 'Schema updated' });
});

// Character personality editing
app.put('/api/character/:name/personality', (req, res) => {
  const { name } = req.params;
  const updates = req.body;
  
  const success = characters.updateCharacterPersonality(name, updates);
  res.json({ success });
});

// Main page HTML
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🎭 Document Generator - Character System MAX</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px; 
            text-align: center; 
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .character-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .character-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
            cursor: pointer;
        }
        .character-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .character-avatar {
            font-size: 48px;
            text-align: center;
            margin-bottom: 10px;
        }
        .character-name {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 5px;
        }
        .character-role {
            text-align: center;
            color: #666;
            margin-bottom: 10px;
        }
        .character-catchphrase {
            font-style: italic;
            text-align: center;
            color: #888;
            font-size: 14px;
        }
        .chat-section {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .chat-messages {
            height: 300px;
            overflow-y: auto;
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .message {
            margin-bottom: 10px;
            padding: 8px 12px;
            border-radius: 8px;
            background: #f0f0f0;
        }
        .chat-input {
            display: flex;
            gap: 10px;
        }
        .chat-input input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
        }
        .chat-input button {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        .editable {
            background: #fffbeb;
            padding: 2px 6px;
            border-radius: 4px;
            cursor: pointer;
        }
        .editable:hover {
            background: #fef3c7;
        }
        .schema-editor {
            background: white;
            border-radius: 12px;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎭 Document Generator - Character System MAX</h1>
        <p>Living characters that make complexity disappear</p>
    </div>

    <div class="character-grid" id="characters">
        <!-- Characters will be added here -->
    </div>

    <div class="chat-section">
        <h2>💬 Chat with Characters</h2>
        <div class="chat-messages" id="chat"></div>
        <div class="chat-input">
            <select id="characterSelect">
                <option value="Nova">🌟 Nova</option>
                <option value="Aria">🎵 Aria</option>
                <option value="Flux">✏️ Flux</option>
                <option value="Zen">☯️ Zen</option>
                <option value="Rex">🧭 Rex</option>
            </select>
            <input type="text" id="messageInput" placeholder="Type your message..." />
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>

    <div class="schema-editor">
        <h2>📋 Editable Schemas</h2>
        <p>Click any <span class="editable">highlighted</span> element to edit</p>
        <div id="schemas"></div>
    </div>

    <script>
        // Load characters
        const characters = ${JSON.stringify(Array.from(characters.characters.entries()).map(([name, char]) => ({
            name,
            avatar: char.avatar,
            role: char.role,
            catchphrase: char.catchphrase,
            personality: char.personality
        })))};

        // Display characters
        const grid = document.getElementById('characters');
        characters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.innerHTML = \`
                <div class="character-avatar">\${char.avatar}</div>
                <div class="character-name">\${char.name}</div>
                <div class="character-role">\${char.role}</div>
                <div class="character-catchphrase editable" onclick="editCatchphrase('\${char.name}')">\${char.catchphrase}</div>
            \`;
            grid.appendChild(card);
        });

        // Chat functionality
        async function sendMessage() {
            const character = document.getElementById('characterSelect').value;
            const message = document.getElementById('messageInput').value;
            
            if (!message) return;
            
            const response = await fetch('/api/character/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character, message })
            });
            
            const data = await response.json();
            
            const chat = document.getElementById('chat');
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message';
            msgDiv.textContent = data.response;
            chat.appendChild(msgDiv);
            
            document.getElementById('messageInput').value = '';
            chat.scrollTop = chat.scrollHeight;
        }

        // Edit catchphrase
        function editCatchphrase(name) {
            const newPhrase = prompt('Enter new catchphrase:');
            if (newPhrase) {
                fetch(\`/api/character/\${name}/personality\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ catchphrase: newPhrase })
                }).then(() => location.reload());
            }
        }

        // Load schemas
        fetch('/api/schemas')
            .then(res => res.json())
            .then(schemas => {
                const container = document.getElementById('schemas');
                schemas.forEach(schema => {
                    const div = document.createElement('div');
                    div.innerHTML = \`<h3>\${schema.name}</h3><pre>\${JSON.stringify(schema.fields, null, 2)}</pre>\`;
                    container.appendChild(div);
                });
            });

        // Enter key sends message
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>
  `);
});

const PORT = 8888;
app.listen(PORT, () => {
  console.log(`\n🌐 Character System Web Interface: http://localhost:${PORT}`);
  console.log('🎭 Characters are ALIVE and ready to interact!');
  console.log('✏️ Everything is editable - click to modify');
  console.log('💬 Chat with characters to control the system');
});

// Character demo interactions
setTimeout(() => {
  console.log('\n🎬 CHARACTERS ARE NOW LIVING:');
  console.log('=============================');
  
  const nova = characters.getCharacter('Nova');
  const flux = characters.getCharacter('Flux');
  const zen = characters.getCharacter('Zen');
  
  nova.speak('The system is ready! I\'m here to explain everything simply', 'happy');
  flux.speak('And I\'m here to make everything editable for you', 'excited');
  zen.speak('Remember: 13+ tiers, but only 3 steps that matter', 'neutral');
  
}, 1000);

console.log('\n✅ CHARACTER SYSTEM MAX EXECUTED!');
console.log('No more planning - characters are living now');
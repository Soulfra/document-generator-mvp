# UTF-8 Encoding Fix
import sys
import io
import os
import locale

# Force UTF-8 encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'

# Ensure stdout/stderr use UTF-8
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Set locale to UTF-8
try:
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'C.UTF-8')
    except:
        pass


#!/usr/bin/env python3
"""
CRINGEPROOF FILTER + CLARITY ENGINE
Makes any group chat actually enjoyable
Filters cringe, enhances clarity, gamifies conversation
"""

import http.server
import socketserver
import json
import os
import time
import hashlib
import threading
import re
from datetime import datetime
from collections import defaultdict

PORT = 9999

os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class CringeproofEngine:
    def __init__(self):
        # Cringe detection patterns
        self.cringe_patterns = {
            'excessive_emoji': r'(.)\1{3,}|[]{3,}',
            'all_caps_rage': r'^[A-Z\s!?]{20,}$',
            'fake_deep': ['nobody understands me', 'society', 'we live in a'],
            'tryhard': ['notice me', 'pls respond', 'hello?????'],
            'overshare': ['my therapist', 'crying rn', 'mental breakdown'],
            'spam': r'(.+)\1{3,}',
            'attention_seeking': ['ratio', 'L + ', 'who asked'],
            'toxic_gaming': ['ez', 'git gud', 'trash', 'noob']
        }
        
        # Clarity enhancement rules
        self.clarity_rules = {
            'remove_filler': ['um', 'uh', 'like', 'you know'],
            'fix_grammar': {
                'ur': 'your',
                'u': 'you',
                'thru': 'through',
                'tho': 'though'
            },
            'structure_thoughts': True,
            'summarize_rants': True
        }
        
        # Gamification elements
        self.chat_games = {
            'vibe_check': {
                'name': 'Vibe Check',
                'description': 'Rate the chat vibe in real-time',
                'scoring': 'positivity'
            },
            'clarity_contest': {
                'name': 'Clarity Contest',
                'description': 'Most clear communicator wins',
                'scoring': 'clarity_score'
            },
            'cringe_bingo': {
                'name': 'Cringe Bingo',
                'description': 'Spot cringe patterns for points',
                'scoring': 'cringe_spotted'
            },
            'wisdom_drops': {
                'name': 'Wisdom Drops',
                'description': 'Share actual insights',
                'scoring': 'insight_value'
            }
        }
        
        # Active chat rooms
        self.chat_rooms = {}
        self.user_scores = defaultdict(lambda: defaultdict(int))
        
        # Cal & Arty for chat moderation
        self.moderators = {
            'cal': {
                'style': 'gentle_correction',
                'phrases': [
                    "Perhaps we could express that more clearly?",
                    "I sense deep emotion here. Let's unpack it together.",
                    "Your message has potential. Here's a clearer version:"
                ]
            },
            'arty': {
                'style': 'chaos_redirect',
                'phrases': [
                    "OK that was kinda cringe but we can fix it!",
                    "YOOO let me translate that into ACTUAL WORDS!",
                    "Bro that energy is WILD! Let's channel it better!"
                ]
            }
        }
        
        # Metrics
        self.platform_metrics = {
            'messages_filtered': 0,
            'clarity_improved': 0,
            'cringe_prevented': 0,
            'games_played': 0
        }
        
    def create_chat_room(self, room_data):
        """Create a cringeproof chat room"""
        room_id = hashlib.md5(f"{room_data['name']}{time.time()}".encode()).hexdigest()[:8]
        
        self.chat_rooms[room_id] = {
            'id': room_id,
            'name': room_data['name'],
            'game_mode': room_data.get('game_mode', 'vibe_check'),
            'participants': [],
            'messages': [],
            'vibe_score': 50,
            'filter_level': room_data.get('filter_level', 'medium'),
            'created': datetime.now().isoformat()
        }
        
        return room_id
        
    def process_message(self, room_id, message_data):
        """Process message through filters"""
        original = message_data['text']
        user_id = message_data['user_id']
        
        # Step 1: Cringe detection
        cringe_score, cringe_reasons = self._detect_cringe(original)
        
        # Step 2: Apply filters if needed
        if cringe_score > 30:  # Threshold for filtering
            filtered = self._filter_cringe(original, cringe_reasons)
            self.platform_metrics['cringe_prevented'] += 1
        else:
            filtered = original
            
        # Step 3: Enhance clarity
        clarified = self._enhance_clarity(filtered)
        if clarified != filtered:
            self.platform_metrics['clarity_improved'] += 1
            
        # Step 4: Game scoring
        game_points = self._calculate_game_points(
            clarified,
            self.chat_rooms[room_id]['game_mode']
        )
        
        self.user_scores[user_id][self.chat_rooms[room_id]['game_mode']] += game_points
        
        # Step 5: AI moderation if needed
        ai_response = None
        if cringe_score > 50:
            ai_response = self._get_ai_moderation(original, cringe_reasons)
            
        # Create processed message
        processed_message = {
            'id': hashlib.md5(f"{original}{time.time()}".encode()).hexdigest()[:8],
            'user_id': user_id,
            'original': original,
            'filtered': clarified,
            'cringe_score': cringe_score,
            'game_points': game_points,
            'ai_response': ai_response,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add to room
        self.chat_rooms[room_id]['messages'].append(processed_message)
        self.platform_metrics['messages_filtered'] += 1
        
        # Update room vibe
        self._update_room_vibe(room_id, processed_message)
        
        return processed_message
        
    def _detect_cringe(self, text):
        """Detect cringe levels"""
        score = 0
        reasons = []
        
        # Check patterns
        for pattern_name, pattern in self.cringe_patterns.items():
            if isinstance(pattern, str):  # Regex
                if re.search(pattern, text):
                    score += 20
                    reasons.append(pattern_name)
            elif isinstance(pattern, list):  # Keywords
                for keyword in pattern:
                    if keyword.lower() in text.lower():
                        score += 15
                        reasons.append(pattern_name)
                        break
                        
        return min(100, score), reasons
        
    def _filter_cringe(self, text, reasons):
        """Remove cringe elements"""
        filtered = text
        
        if 'excessive_emoji' in reasons:
            # Reduce repeated emojis
            filtered = re.sub(r'([]){2,}', r'\1', filtered)
            
        if 'all_caps_rage' in reasons:
            # Convert to normal case
            filtered = filtered.capitalize()
            
        if 'spam' in reasons:
            # Remove repetition
            filtered = re.sub(r'(.+)\1{3,}', r'\1', filtered)
            
        return filtered
        
    def _enhance_clarity(self, text):
        """Make text clearer"""
        clarified = text
        
        # Remove filler words
        for filler in self.clarity_rules['remove_filler']:
            clarified = re.sub(rf'\b{filler}\b', '', clarified, flags=re.IGNORECASE)
            
        # Fix common shortcuts
        for short, full in self.clarity_rules['fix_grammar'].items():
            clarified = re.sub(rf'\b{short}\b', full, clarified, flags=re.IGNORECASE)
            
        # Clean up extra spaces
        clarified = ' '.join(clarified.split())
        
        return clarified
        
    def _calculate_game_points(self, message, game_mode):
        """Calculate points based on game mode"""
        if game_mode == 'vibe_check':
            # Points for positive vibes
            positive_words = ['great', 'awesome', 'thanks', 'help', 'love']
            points = sum(5 for word in positive_words if word in message.lower())
            
        elif game_mode == 'clarity_contest':
            # Points for clear communication
            words = message.split()
            if 10 < len(words) < 50:  # Good length
                points = 10
            else:
                points = 5
                
        elif game_mode == 'cringe_bingo':
            # Reverse scoring - points for avoiding cringe
            cringe_score, _ = self._detect_cringe(message)
            points = max(0, 20 - cringe_score // 5)
            
        elif game_mode == 'wisdom_drops':
            # Points for insightful content
            insight_words = ['because', 'understand', 'realize', 'learn', 'think']
            points = sum(10 for word in insight_words if word in message.lower())
            
        else:
            points = 5  # Default points
            
        return points
        
    def _get_ai_moderation(self, original, cringe_reasons):
        """Get AI moderation response"""
        # Choose moderator based on severity
        if len(cringe_reasons) > 2:
            moderator = 'arty'  # More severe needs Arty's energy
        else:
            moderator = 'cal'  # Gentle correction
            
        responses = self.moderators[moderator]['phrases']
        base_response = responses[hash(original) % len(responses)]
        
        # Add specific feedback
        if 'excessive_emoji' in cringe_reasons:
            feedback = " (Maybe fewer emojis next time?)"
        elif 'all_caps_rage' in cringe_reasons:
            feedback = " (Let's use our inside voice!)"
        elif 'overshare' in cringe_reasons:
            feedback = " (Some things are better shared privately)"
        else:
            feedback = ""
            
        return {
            'moderator': moderator,
            'message': base_response + feedback
        }
        
    def _update_room_vibe(self, room_id, message):
        """Update room vibe score"""
        room = self.chat_rooms[room_id]
        
        # Adjust vibe based on message quality
        if message['cringe_score'] < 20:
            room['vibe_score'] = min(100, room['vibe_score'] + 2)
        elif message['cringe_score'] > 50:
            room['vibe_score'] = max(0, room['vibe_score'] - 5)
            
        # Bonus for game participation
        if message['game_points'] > 10:
            room['vibe_score'] = min(100, room['vibe_score'] + 3)

# Global engine
cringeproof = CringeproofEngine()

class CringeproofHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>Cringeproof Chat - Actually Enjoyable Group Chat</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
    font-family: -apple-system, sans-serif;
    background: linear-gradient(135deg, #232526, #414345);
    color: #fff;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    text-align: center;
    padding: 40px 0;
}

.logo {
    font-size: 3em;
    font-weight: bold;
    background: linear-gradient(45deg, #00c9ff, #92fe9d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.chat-container {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 20px;
    margin: 40px 0;
}

.chat-window {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 20px;
    height: 600px;
    display: flex;
    flex-direction: column;
}

.messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: rgba(0,0,0,0.3);
    border-radius: 10px;
    margin-bottom: 20px;
}

.message {
    margin: 15px 0;
    padding: 15px;
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    position: relative;
}

.message.filtered {
    border-left: 3px solid #00c9ff;
}

.original-text {
    text-decoration: line-through;
    opacity: 0.5;
    font-size: 0.9em;
}

.ai-moderation {
    background: linear-gradient(135deg, rgba(0,201,255,0.1), rgba(146,254,157,0.1));
    padding: 10px;
    border-radius: 10px;
    margin-top: 10px;
    font-style: italic;
}

.game-points {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #00c9ff;
    color: #000;
    padding: 3px 10px;
    border-radius: 15px;
    font-weight: bold;
    font-size: 0.9em;
}

.sidebar {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 20px;
}

.vibe-meter {
    height: 200px;
    background: rgba(0,0,0,0.3);
    border-radius: 10px;
    position: relative;
    overflow: hidden;
    margin: 20px 0;
}

.vibe-fill {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: linear-gradient(to top, #ff0000, #ffff00, #00ff00);
    transition: height 0.5s;
}

.game-selector {
    margin: 20px 0;
}

.game-option {
    background: rgba(255,255,255,0.1);
    padding: 15px;
    margin: 10px 0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.game-option:hover {
    background: rgba(255,255,255,0.2);
}

.game-option.active {
    background: linear-gradient(135deg, #00c9ff, #92fe9d);
    color: #000;
}

.input-area {
    display: flex;
    gap: 10px;
}

input[type="text"] {
    flex: 1;
    padding: 15px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    border-radius: 10px;
    font-size: 16px;
}

button {
    padding: 15px 30px;
    background: linear-gradient(135deg, #00c9ff, #92fe9d);
    color: #000;
    border: none;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0,201,255,0.4);
}

.leaderboard {
    background: rgba(0,0,0,0.3);
    padding: 15px;
    border-radius: 10px;
    margin-top: 20px;
}

.leaderboard-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.filter-level {
    margin: 20px 0;
}

.filter-option {
    display: inline-block;
    padding: 10px 20px;
    margin: 5px;
    background: rgba(255,255,255,0.1);
    border-radius: 20px;
    cursor: pointer;
}

.filter-option.active {
    background: #00c9ff;
    color: #000;
}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1 class="logo">CRINGEPROOF</h1>
        <p style="font-size: 1.2em; opacity: 0.8;">Group Chat That Doesn't Suck</p>
    </div>
    
    <div class="chat-container">
        <div class="chat-window">
            <div class="messages" id="messages">
                <p style="opacity: 0.5; text-align: center;">Start chatting to see the magic!</p>
            </div>
            
            <div class="input-area">
                <input type="text" id="messageInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
        
        <div class="sidebar">
            <h3>Room Vibe</h3>
            <div class="vibe-meter">
                <div class="vibe-fill" id="vibeFill" style="height: 50%"></div>
            </div>
            <p id="vibeScore">Vibe: 50/100</p>
            
            <div class="game-selector">
                <h3>Chat Game Mode</h3>
                <div class="game-option active" onclick="selectGame('vibe_check')">
                     Vibe Check
                    <p style="font-size: 0.9em; opacity: 0.7;">Points for positivity</p>
                </div>
                <div class="game-option" onclick="selectGame('clarity_contest')">
                     Clarity Contest
                    <p style="font-size: 0.9em; opacity: 0.7;">Clear communication wins</p>
                </div>
                <div class="game-option" onclick="selectGame('cringe_bingo')">
                     Cringe Bingo
                    <p style="font-size: 0.9em; opacity: 0.7;">Avoid cringe for points</p>
                </div>
                <div class="game-option" onclick="selectGame('wisdom_drops')">
                     Wisdom Drops
                    <p style="font-size: 0.9em; opacity: 0.7;">Share real insights</p>
                </div>
            </div>
            
            <div class="filter-level">
                <h3>Filter Level</h3>
                <div class="filter-option" onclick="setFilter('low')">Low</div>
                <div class="filter-option active" onclick="setFilter('medium')">Medium</div>
                <div class="filter-option" onclick="setFilter('high')">High</div>
            </div>
            
            <div class="leaderboard">
                <h3>Top Players</h3>
                <div id="leaderboard">
                    <p style="opacity: 0.5;">Play to see scores!</p>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
let currentRoom = null;
let currentGame = 'vibe_check';
let userId = 'user_' + Date.now();

// Create room on load
window.addEventListener('load', async () => {
    const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: 'Main Chat',
            game_mode: currentGame
        })
    });
    
    currentRoom = await response.text();
    console.log('Room created:', currentRoom);
});

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || !currentRoom) return;
    
    const response = await fetch('/api/message/send', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            room_id: currentRoom,
            user_id: userId,
            text: message
        })
    });
    
    const processed = await response.json();
    displayMessage(processed);
    
    input.value = '';
    
    // Update room state
    updateRoomState();
}

function displayMessage(msg) {
    const messagesDiv = document.getElementById('messages');
    
    let messageHtml = '<div class="message' + (msg.filtered !== msg.original ? ' filtered' : '') + '">';
    
    // Show username
    messageHtml += '<strong>' + msg.user_id.substring(0, 8) + ':</strong> ';
    
    // Show filtered message
    messageHtml += msg.filtered;
    
    // Show original if different
    if (msg.filtered !== msg.original) {
        messageHtml += '<div class="original-text">Original: ' + msg.original + '</div>';
    }
    
    // Show game points
    if (msg.game_points > 0) {
        messageHtml += '<div class="game-points">+' + msg.game_points + '</div>';
    }
    
    // Show AI moderation if any
    if (msg.ai_response) {
        messageHtml += '<div class="ai-moderation">';
        messageHtml += '<strong>' + msg.ai_response.moderator + ':</strong> ';
        messageHtml += msg.ai_response.message;
        messageHtml += '</div>';
    }
    
    messageHtml += '</div>';
    
    messagesDiv.innerHTML += messageHtml;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function updateRoomState() {
    const response = await fetch('/api/room/' + currentRoom);
    const room = await response.json();
    
    // Update vibe meter
    document.getElementById('vibeFill').style.height = room.vibe_score + '%';
    document.getElementById('vibeScore').textContent = 'Vibe: ' + room.vibe_score + '/100';
    
    // Update leaderboard
    updateLeaderboard();
}

async function updateLeaderboard() {
    const response = await fetch('/api/leaderboard/' + currentGame);
    const scores = await response.json();
    
    let html = '';
    scores.forEach((score, index) => {
        html += '<div class="leaderboard-item">';
        html += '<span>' + (index + 1) + '. ' + score.user_id.substring(0, 8) + '</span>';
        html += '<span>' + score.score + ' pts</span>';
        html += '</div>';
    });
    
    document.getElementById('leaderboard').innerHTML = html || '<p style="opacity: 0.5;">No scores yet!</p>';
}

function selectGame(game) {
    currentGame = game;
    
    // Update UI
    document.querySelectorAll('.game-option').forEach(el => el.classList.remove('active'));
    event.target.closest('.game-option').classList.add('active');
    
    // Update room
    if (currentRoom) {
        fetch('/api/room/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                room_id: currentRoom,
                game_mode: game
            })
        });
    }
    
    // Update leaderboard
    updateLeaderboard();
}

function setFilter(level) {
    // Update UI
    document.querySelectorAll('.filter-option').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update room
    if (currentRoom) {
        fetch('/api/room/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                room_id: currentRoom,
                filter_level: level
            })
        });
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Auto-refresh room state
setInterval(updateRoomState, 5000);
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path.startswith('/api/room/'):
            room_id = self.path.split('/')[-1]
            if room_id in cringeproof.chat_rooms:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(cringeproof.chat_rooms[room_id]).encode())
            else:
                self.send_error(404)
                
        elif self.path.startswith('/api/leaderboard/'):
            game_mode = self.path.split('/')[-1]
            
            # Get top scores for game mode
            scores = []
            for user_id, user_scores in cringeproof.user_scores.items():
                if game_mode in user_scores:
                    scores.append({
                        'user_id': user_id,
                        'score': user_scores[game_mode]
                    })
                    
            # Sort and return top 10
            scores.sort(key=lambda x: x['score'], reverse=True)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(scores[:10]).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/room/create':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                room_id = cringeproof.create_chat_room(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(room_id.encode())
                
        elif self.path == '/api/message/send':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                processed = cringeproof.process_message(data['room_id'], data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(processed).encode())
                
        elif self.path == '/api/room/update':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                room_id = data['room_id']
                
                if room_id in cringeproof.chat_rooms:
                    room = cringeproof.chat_rooms[room_id]
                    
                    if 'game_mode' in data:
                        room['game_mode'] = data['game_mode']
                    if 'filter_level' in data:
                        room['filter_level'] = data['filter_level']
                        
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode())
                else:
                    self.send_error(404)
                    
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[CRINGEPROOF] {format % args}")

httpd = socketserver.TCPServer(("", PORT), CringeproofHandler)
httpd.allow_reuse_address = True

print(f"\nCRINGEPROOF FILTER: http://localhost:{PORT}")
print("\nMakes group chat actually enjoyable with:")
print("- Cringe detection and filtering")
print("- Clarity enhancement")
print("- Gamified conversations")
print("- AI moderation (Cal & Arty)")
print("- Real-time vibe tracking")
print("\nFilter modes:")
print("- Low: Minimal filtering")
print("- Medium: Balance of freedom and quality")
print("- High: Maximum clarity")
print("\nGames to play while chatting!")

httpd.serve_forever()
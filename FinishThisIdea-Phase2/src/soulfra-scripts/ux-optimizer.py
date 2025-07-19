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
EMPATHY GAME ENGINE - Turning Gamers into Support Heroes
Free crowd-sourced support that teaches empathy and builds AI
"""

import http.server
import socketserver
import json
import os
import time
import hashlib
import random
from datetime import datetime
from collections import defaultdict

PORT = 5000

os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class EmpathyGameEngine:
    def __init__(self):
        # Player profiles
        self.players = {}
        
        # Support tickets (from real users)
        self.tickets = {}
        self.ticket_queue = []
        
        # AI learning database
        self.ai_knowledge = {
            'solutions': defaultdict(list),
            'empathy_patterns': defaultdict(list),
            'success_rates': defaultdict(float)
        }
        
        # Leaderboards
        self.leaderboards = {
            'empathy_score': {},
            'solutions_provided': {},
            'happiness_generated': {},
            'ai_contributions': {}
        }
        
        # Business integration
        self.business_insights = {
            'common_pain_points': defaultdict(int),
            'customer_sentiment': [],
            'product_improvements': [],
            'support_cost_saved': 0
        }
        
    def create_player(self, username):
        """New player joins the empathy game"""
        player_id = hashlib.md5(f"{username}{time.time()}".encode()).hexdigest()[:8]
        
        self.players[player_id] = {
            'username': username,
            'level': 1,
            'xp': 0,
            'empathy_score': 100,
            'tickets_solved': 0,
            'happiness_generated': 0,
            'specializations': [],
            'achievements': [],
            'rank': 'Support Rookie',
            'skills': {
                'technical': 10,
                'empathy': 10,
                'problem_solving': 10,
                'communication': 10
            }
        }
        
        return player_id
        
    def create_ticket(self, data):
        """Real user creates support ticket"""
        ticket_id = hashlib.md5(f"{data['issue']}{time.time()}".encode()).hexdigest()[:8]
        
        # Analyze ticket for routing
        analysis = self._analyze_ticket(data['issue'])
        
        ticket = {
            'id': ticket_id,
            'user': data.get('user', 'Anonymous'),
            'issue': data['issue'],
            'category': analysis['category'],
            'difficulty': analysis['difficulty'],
            'emotional_state': analysis['emotional_state'],
            'priority': analysis['priority'],
            'status': 'open',
            'assigned_to': None,
            'created': datetime.now().isoformat(),
            'responses': [],
            'satisfaction': None,
            'xp_reward': analysis['difficulty'] * 10,
            'empathy_bonus': analysis['emotional_state'] == 'distressed' and 50 or 0
        }
        
        self.tickets[ticket_id] = ticket
        self.ticket_queue.append(ticket_id)
        
        # Update business insights
        self.business_insights['common_pain_points'][analysis['category']] += 1
        
        return ticket
        
    def _analyze_ticket(self, issue_text):
        """AI analyzes ticket for routing and rewards"""
        text_lower = issue_text.lower()
        
        # Detect category
        categories = {
            'technical': ['error', 'bug', 'crash', 'broken', 'fix'],
            'billing': ['charge', 'payment', 'refund', 'subscription', 'money'],
            'feature': ['add', 'want', 'need', 'request', 'would be nice'],
            'complaint': ['terrible', 'awful', 'hate', 'worst', 'angry'],
            'praise': ['love', 'great', 'awesome', 'thank', 'best']
        }
        
        category = 'general'
        for cat, keywords in categories.items():
            if any(keyword in text_lower for keyword in keywords):
                category = cat
                break
                
        # Detect emotional state
        if any(word in text_lower for word in ['urgent', 'asap', 'emergency', 'critical']):
            emotional_state = 'distressed'
            priority = 'high'
        elif any(word in text_lower for word in ['frustrated', 'annoyed', 'disappointed']):
            emotional_state = 'frustrated'
            priority = 'medium'
        else:
            emotional_state = 'neutral'
            priority = 'low'
            
        # Calculate difficulty
        difficulty = 1
        if len(issue_text) > 200:
            difficulty += 1
        if category in ['technical', 'complaint']:
            difficulty += 1
        if emotional_state == 'distressed':
            difficulty += 1
            
        return {
            'category': category,
            'difficulty': min(5, difficulty),
            'emotional_state': emotional_state,
            'priority': priority
        }
        
    def match_ticket_to_player(self, player_id):
        """Match player with appropriate ticket"""
        if not self.ticket_queue:
            return None
            
        player = self.players[player_id]
        player_skills = player['skills']
        
        # Find best match based on skills
        best_match = None
        best_score = 0
        
        for ticket_id in self.ticket_queue[:10]:  # Check first 10 tickets
            ticket = self.tickets[ticket_id]
            
            # Skip if already assigned
            if ticket['assigned_to']:
                continue
                
            # Calculate match score
            score = 0
            
            # Technical tickets need technical skill
            if ticket['category'] == 'technical':
                score += player_skills['technical']
                
            # Emotional tickets need empathy
            if ticket['emotional_state'] in ['distressed', 'frustrated']:
                score += player_skills['empathy'] * 2
                
            # Difficulty vs level
            if player['level'] >= ticket['difficulty']:
                score += 20
                
            if score > best_score:
                best_score = score
                best_match = ticket_id
                
        if best_match:
            self.tickets[best_match]['assigned_to'] = player_id
            self.tickets[best_match]['status'] = 'in_progress'
            self.ticket_queue.remove(best_match)
            
        return best_match
        
    def submit_response(self, player_id, ticket_id, response_data):
        """Player submits response to ticket"""
        if ticket_id not in self.tickets:
            return None
            
        ticket = self.tickets[ticket_id]
        player = self.players[player_id]
        
        # Analyze response quality
        quality = self._analyze_response_quality(response_data['message'], ticket)
        
        # Create response
        response = {
            'player_id': player_id,
            'message': response_data['message'],
            'timestamp': datetime.now().isoformat(),
            'quality_score': quality['score'],
            'empathy_detected': quality['empathy_level'],
            'solution_provided': quality['has_solution'],
            'tone': quality['tone']
        }
        
        ticket['responses'].append(response)
        
        # Calculate rewards
        xp_gained = ticket['xp_reward'] * (quality['score'] / 100)
        empathy_bonus = 0
        
        if quality['empathy_level'] > 70:
            empathy_bonus = ticket['empathy_bonus']
            player['empathy_score'] += 5
            
        # Update player stats
        player['xp'] += int(xp_gained + empathy_bonus)
        player['skills']['empathy'] += quality['empathy_level'] / 100
        player['skills']['communication'] += quality['score'] / 100
        
        # Level up check
        if player['xp'] >= player['level'] * 100:
            self._level_up(player_id)
            
        # Update AI knowledge
        self._update_ai_knowledge(ticket, response, quality)
        
        return {
            'quality': quality,
            'xp_gained': int(xp_gained),
            'empathy_bonus': empathy_bonus,
            'new_stats': player
        }
        
    def _analyze_response_quality(self, message, ticket):
        """Analyze how good the support response is"""
        message_lower = message.lower()
        quality_score = 50  # Base score
        
        # Check for empathy indicators
        empathy_words = [
            'understand', 'sorry', 'frustrating', 'help',
            'feel', 'appreciate', 'thank you', 'i see'
        ]
        empathy_count = sum(1 for word in empathy_words if word in message_lower)
        empathy_level = min(100, empathy_count * 20)
        
        # Check for solution indicators
        solution_words = [
            'try', 'should', 'could', 'fix', 'solve',
            'here\'s', 'step', 'click', 'go to'
        ]
        has_solution = any(word in message_lower for word in solution_words)
        
        # Tone analysis
        if any(word in message_lower for word in ['!', 'definitely', 'absolutely', 'happy']):
            tone = 'positive'
            quality_score += 10
        elif any(word in message_lower for word in ['unfortunately', 'sorry', 'apologize']):
            tone = 'apologetic'
            quality_score += 5
        else:
            tone = 'neutral'
            
        # Length check (not too short, not too long)
        word_count = len(message.split())
        if 20 < word_count < 150:
            quality_score += 20
            
        # Personalization check
        if ticket['user'] in message:
            quality_score += 10
            
        # Solution bonus
        if has_solution:
            quality_score += 20
            
        return {
            'score': min(100, quality_score),
            'empathy_level': empathy_level,
            'has_solution': has_solution,
            'tone': tone
        }
        
    def _level_up(self, player_id):
        """Player levels up!"""
        player = self.players[player_id]
        player['level'] += 1
        
        # Update rank
        ranks = [
            (1, 'Support Rookie'),
            (5, 'Empathy Apprentice'),
            (10, 'Solution Seeker'),
            (20, 'Happiness Hero'),
            (30, 'Empathy Master'),
            (50, 'Support Legend'),
            (100, 'Cal Riven')
        ]
        
        for level, rank in ranks:
            if player['level'] >= level:
                player['rank'] = rank
                
        # Skill boost
        for skill in player['skills']:
            player['skills'][skill] += random.randint(1, 3)
            
    def _update_ai_knowledge(self, ticket, response, quality):
        """AI learns from every interaction"""
        category = ticket['category']
        
        # Store successful patterns
        if quality['score'] > 80:
            self.ai_knowledge['solutions'][category].append({
                'issue': ticket['issue'],
                'response': response['message'],
                'quality': quality['score'],
                'timestamp': datetime.now().isoformat()
            })
            
        # Learn empathy patterns
        if quality['empathy_level'] > 70:
            self.ai_knowledge['empathy_patterns'][ticket['emotional_state']].append({
                'response_excerpt': response['message'][:100],
                'empathy_score': quality['empathy_level']
            })
            
        # Update success rates
        self.ai_knowledge['success_rates'][category] = (
            self.ai_knowledge['success_rates'][category] * 0.9 + 
            quality['score'] * 0.1
        )
        
    def rate_ticket_resolution(self, ticket_id, satisfaction):
        """User rates the support they received"""
        if ticket_id not in self.tickets:
            return None
            
        ticket = self.tickets[ticket_id]
        ticket['satisfaction'] = satisfaction
        ticket['status'] = 'closed'
        
        # Reward player based on satisfaction
        if ticket['assigned_to']:
            player = self.players[ticket['assigned_to']]
            
            if satisfaction >= 4:
                player['happiness_generated'] += satisfaction * 10
                player['xp'] += 50
                self.business_insights['support_cost_saved'] += 50  # $50 saved
            elif satisfaction >= 3:
                player['xp'] += 20
                self.business_insights['support_cost_saved'] += 30
                
        # Update customer sentiment
        self.business_insights['customer_sentiment'].append({
            'rating': satisfaction,
            'category': ticket['category'],
            'timestamp': datetime.now().isoformat()
        })
        
        return {'success': True, 'total_saved': self.business_insights['support_cost_saved']}
        
    def get_leaderboard(self, category='empathy_score'):
        """Get top players"""
        if category == 'empathy_score':
            scores = {pid: p['empathy_score'] for pid, p in self.players.items()}
        elif category == 'tickets_solved':
            scores = {pid: p['tickets_solved'] for pid, p in self.players.items()}
        elif category == 'happiness_generated':
            scores = {pid: p['happiness_generated'] for pid, p in self.players.items()}
        else:
            scores = {}
            
        # Sort and return top 10
        sorted_players = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:10]
        
        leaderboard = []
        for player_id, score in sorted_players:
            player = self.players[player_id]
            leaderboard.append({
                'username': player['username'],
                'level': player['level'],
                'rank': player['rank'],
                'score': score
            })
            
        return leaderboard
        
    def get_business_insights(self):
        """Get insights for business decisions"""
        # Calculate average sentiment
        if self.business_insights['customer_sentiment']:
            avg_sentiment = sum(s['rating'] for s in self.business_insights['customer_sentiment']) / len(self.business_insights['customer_sentiment'])
        else:
            avg_sentiment = 0
            
        # Find top issues
        top_issues = sorted(
            self.business_insights['common_pain_points'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Calculate ROI
        num_tickets = len(self.tickets)
        traditional_cost = num_tickets * 50  # $50 per ticket traditionally
        crowd_cost = 0  # Free!
        savings = traditional_cost - crowd_cost
        
        return {
            'total_tickets_resolved': num_tickets,
            'money_saved': f"${self.business_insights['support_cost_saved']:,}",
            'average_satisfaction': round(avg_sentiment, 2),
            'top_pain_points': top_issues,
            'ai_knowledge_base_size': sum(len(v) for v in self.ai_knowledge['solutions'].values()),
            'active_support_heroes': len(self.players),
            'projected_annual_savings': f"${savings * 365:,}"
        }

# Global engine
game_engine = EmpathyGameEngine()

class GameHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # Main game interface
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>Support Heroes - Empathy Game</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
    font-family: -apple-system, sans-serif;
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    color: white;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    text-align: center;
    font-size: 3em;
    margin: 20px 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
    text-align: center;
    font-size: 1.2em;
    opacity: 0.9;
    margin-bottom: 40px;
}

.game-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 40px;
}

.section {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 20px;
    border: 1px solid rgba(255,255,255,0.2);
}

.player-card {
    background: rgba(0,255,0,0.1);
    border: 2px solid #00ff00;
    border-radius: 10px;
    padding: 15px;
    margin: 10px 0;
}

.ticket {
    background: rgba(255,255,255,0.05);
    border-left: 4px solid #ffd700;
    padding: 15px;
    margin: 10px 0;
    cursor: pointer;
    transition: all 0.3s;
}

.ticket:hover {
    background: rgba(255,255,255,0.1);
    transform: translateX(5px);
}

.ticket.urgent {
    border-left-color: #ff4444;
}

.stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 20px 0;
}

.stat {
    background: rgba(255,255,255,0.1);
    padding: 15px;
    border-radius: 10px;
    text-align: center;
}

.stat-value {
    font-size: 2em;
    font-weight: bold;
    color: #ffd700;
}

.stat-label {
    font-size: 0.9em;
    opacity: 0.8;
}

button {
    background: linear-gradient(45deg, #00ff00, #00ffff);
    color: #000;
    border: none;
    padding: 12px 30px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s;
}

button:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0,255,255,0.4);
}

.response-area {
    width: 100%;
    min-height: 150px;
    background: rgba(0,0,0,0.3);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 15px;
    border-radius: 10px;
    font-size: 16px;
    margin: 10px 0;
}

.leaderboard {
    background: rgba(255,215,0,0.1);
    border: 2px solid #ffd700;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
}

.leaderboard-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.rank-1 { color: #ffd700; font-weight: bold; }
.rank-2 { color: #c0c0c0; }
.rank-3 { color: #cd7f32; }

.xp-bar {
    background: rgba(0,0,0,0.3);
    height: 20px;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px 0;
}

.xp-fill {
    background: linear-gradient(90deg, #00ff00, #ffd700);
    height: 100%;
    transition: width 0.5s;
}

.achievement {
    display: inline-block;
    background: #ffd700;
    color: #000;
    padding: 5px 15px;
    border-radius: 20px;
    margin: 5px;
    font-weight: bold;
}

.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
}

.modal-content {
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    border: 2px solid #00ff00;
    border-radius: 20px;
    padding: 30px;
    margin: 50px auto;
    max-width: 600px;
    position: relative;
}
</style>
</head>
<body>
<div class="container">
    <h1>SUPPORT HEROES</h1>
    <div class="subtitle">Turn Empathy into XP - Help Real People, Level Up, Save Businesses Money</div>
    
    <div id="loginSection" class="section">
        <h2>Join the Hero Squad</h2>
        <input type="text" id="username" placeholder="Choose your hero name" style="padding:10px; font-size:16px; border-radius:5px; border:none; margin-right:10px;">
        <button onclick="joinGame()">START HELPING</button>
    </div>
    
    <div id="gameSection" style="display:none;">
        <div class="player-card">
            <h2 id="playerName">Hero Name</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value" id="playerLevel">1</div>
                    <div class="stat-label">Level</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="playerRank">Support Rookie</div>
                    <div class="stat-label">Rank</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="empathyScore">100</div>
                    <div class="stat-label">Empathy</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="ticketsSolved">0</div>
                    <div class="stat-label">Helped</div>
                </div>
            </div>
            <div class="xp-bar">
                <div class="xp-fill" id="xpBar" style="width: 0%"></div>
            </div>
            <p id="xpText">XP: 0 / 100</p>
        </div>
        
        <div class="game-sections">
            <div class="section">
                <h3>People Need Your Help</h3>
                <button onclick="getTicket()">FIND SOMEONE TO HELP</button>
                <div id="currentTicket"></div>
            </div>
            
            <div class="section">
                <h3>Your Response</h3>
                <div id="responseSection" style="display:none;">
                    <p>Remember: Show empathy, provide solutions, make them smile!</p>
                    <textarea class="response-area" id="responseText" placeholder="Type your helpful response here..."></textarea>
                    <button onclick="submitResponse()">SEND HELP</button>
                </div>
                <div id="responseResult"></div>
            </div>
        </div>
        
        <div class="leaderboard">
            <h3>Top Support Heroes</h3>
            <div id="leaderboardList"></div>
        </div>
        
        <div class="section">
            <h3>Business Impact</h3>
            <div id="businessInsights"></div>
        </div>
    </div>
</div>

<script>
let currentPlayer = null;
let currentTicket = null;

async function joinGame() {
    const username = document.getElementById('username').value.trim();
    if (!username) return;
    
    const response = await fetch('/api/join', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username})
    });
    
    const data = await response.json();
    currentPlayer = data.player_id;
    
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('gameSection').style.display = 'block';
    
    updatePlayerStats(data.player);
    loadLeaderboard();
    loadBusinessInsights();
}

async function getTicket() {
    const response = await fetch(`/api/ticket/get/${currentPlayer}`);
    const ticket = await response.json();
    
    if (!ticket || !ticket.id) {
        document.getElementById('currentTicket').innerHTML = '<p>No tickets available right now. Check back soon!</p>';
        return;
    }
    
    currentTicket = ticket;
    displayTicket(ticket);
}

function displayTicket(ticket) {
    const urgencyClass = ticket.priority === 'high' ? 'urgent' : '';
    
    document.getElementById('currentTicket').innerHTML = `
        <div class="ticket ${urgencyClass}">
            <strong>${ticket.user}</strong> needs help with <strong>${ticket.category}</strong>
            <p>"${ticket.issue}"</p>
            <div style="margin-top: 10px;">
                <span class="achievement">Difficulty: ${ticket.difficulty}/5</span>
                <span class="achievement">XP Reward: ${ticket.xp_reward}</span>
                ${ticket.empathy_bonus ? `<span class="achievement">Empathy Bonus: +${ticket.empathy_bonus}</span>` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('responseSection').style.display = 'block';
}

async function submitResponse() {
    const message = document.getElementById('responseText').value.trim();
    if (!message || !currentTicket) return;
    
    const response = await fetch('/api/respond', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            player_id: currentPlayer,
            ticket_id: currentTicket.id,
            message
        })
    });
    
    const result = await response.json();
    displayResponseResult(result);
    
    // Clear for next ticket
    document.getElementById('responseText').value = '';
    document.getElementById('responseSection').style.display = 'none';
    currentTicket = null;
    
    // Update stats
    updatePlayerStats(result.new_stats);
}

function displayResponseResult(result) {
    const quality = result.quality;
    
    document.getElementById('responseResult').innerHTML = `
        <div class="player-card">
            <h3>Response Analysis</h3>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${quality.score}%</div>
                    <div class="stat-label">Quality Score</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${quality.empathy_level}%</div>
                    <div class="stat-label">Empathy Level</div>
                </div>
                <div class="stat">
                    <div class="stat-value">+${result.xp_gained}</div>
                    <div class="stat-label">XP Gained</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${quality.tone}</div>
                    <div class="stat-label">Tone</div>
                </div>
            </div>
            ${result.empathy_bonus ? `<p class="achievement">Empathy Bonus: +${result.empathy_bonus} XP!</p>` : ''}
            ${quality.has_solution ? '<p class="achievement">Solution Provided!</p>' : '<p>Tip: Try providing a specific solution next time</p>'}
        </div>
    `;
}

function updatePlayerStats(player) {
    document.getElementById('playerName').textContent = player.username;
    document.getElementById('playerLevel').textContent = player.level;
    document.getElementById('playerRank').textContent = player.rank;
    document.getElementById('empathyScore').textContent = Math.round(player.empathy_score);
    document.getElementById('ticketsSolved').textContent = player.tickets_solved;
    
    const xpThisLevel = player.xp % 100;
    const xpNeeded = player.level * 100;
    document.getElementById('xpBar').style.width = `${(xpThisLevel / 100) * 100}%`;
    document.getElementById('xpText').textContent = `XP: ${player.xp} / ${xpNeeded}`;
}

async function loadLeaderboard() {
    const response = await fetch('/api/leaderboard/empathy_score');
    const leaderboard = await response.json();
    
    const html = leaderboard.map((player, index) => `
        <div class="leaderboard-item rank-${index + 1}">
            <span>${index + 1}. ${player.username} (${player.rank})</span>
            <span>Level ${player.level} - ${player.score} Empathy</span>
        </div>
    `).join('');
    
    document.getElementById('leaderboardList').innerHTML = html;
}

async function loadBusinessInsights() {
    const response = await fetch('/api/business-insights');
    const insights = await response.json();
    
    document.getElementById('businessInsights').innerHTML = `
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${insights.money_saved}</div>
                <div class="stat-label">Saved So Far</div>
            </div>
            <div class="stat">
                <div class="stat-value">${insights.total_tickets_resolved}</div>
                <div class="stat-label">Issues Resolved</div>
            </div>
            <div class="stat">
                <div class="stat-value">${insights.average_satisfaction}/5</div>
                <div class="stat-label">Avg Satisfaction</div>
            </div>
            <div class="stat">
                <div class="stat-value">${insights.active_support_heroes}</div>
                <div class="stat-label">Active Heroes</div>
            </div>
        </div>
        <p><strong>Projected Annual Savings: ${insights.projected_annual_savings}</strong></p>
    `;
}

// Auto-refresh
setInterval(() => {
    if (currentPlayer) {
        loadLeaderboard();
        loadBusinessInsights();
    }
}, 30000);

// Demo data - in production this would come from real users
async function createDemoTickets() {
    const demoIssues = [
        "I can't log into my account, it keeps saying invalid password but I know it's right!",
        "The app crashes every time I try to upload a photo. This is so frustrating!",
        "How do I cancel my subscription? I've been trying for an hour.",
        "Your service is amazing! Just wanted to say thank you for the great support!",
        "URGENT: Payment went through twice, need immediate refund please!",
        "Feature request: Would love to see dark mode added to the app",
        "Getting error code 403 when trying to access my dashboard"
    ];
    
    // Create a demo ticket every 30 seconds
    setInterval(async () => {
        const issue = demoIssues[Math.floor(Math.random() * demoIssues.length)];
        await fetch('/api/ticket/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user: `User${Math.floor(Math.random() * 1000)}`,
                issue
            })
        });
    }, 30000);
}

// Start demo ticket creation
createDemoTickets();
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path.startswith('/api/leaderboard/'):
            category = self.path.split('/')[-1]
            leaderboard = game_engine.get_leaderboard(category)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(leaderboard).encode())
            
        elif self.path == '/api/business-insights':
            insights = game_engine.get_business_insights()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(insights).encode())
            
        elif self.path.startswith('/api/ticket/get/'):
            player_id = self.path.split('/')[-1]
            ticket_id = game_engine.match_ticket_to_player(player_id)
            
            if ticket_id:
                ticket = game_engine.tickets[ticket_id]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(ticket).encode())
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({}).encode())
                
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/join':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                player_id = game_engine.create_player(data['username'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'player_id': player_id,
                    'player': game_engine.players[player_id]
                }).encode())
                
        elif self.path == '/api/ticket/create':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                ticket = game_engine.create_ticket(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(ticket).encode())
                
        elif self.path == '/api/respond':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                result = game_engine.submit_response(
                    data['player_id'],
                    data['ticket_id'],
                    {'message': data['message']}
                )
                
                if result:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps(result).encode())
                else:
                    self.send_error(400, "Invalid response")
                    
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[EMPATHY] {format % args}")

httpd = socketserver.TCPServer(("", PORT), GameHandler)
httpd.allow_reuse_address = True

print(f"\nEMPATHY GAME ENGINE: http://localhost:{PORT}")
print("\nThis gamifies technical support and teaches empathy!")
print("\nFeatures:")
print("- Real support tickets from users")
print("- XP and leveling system")
print("- Empathy scoring and training")
print("- Leaderboards and achievements")
print("- AI learns from every interaction")
print("- Businesses save money on support")
print("\nWhy it works:")
print("- Gamers love helping when it's a game")
print("- They learn empathy and communication")
print("- Free crowd-sourced support")
print("- AI gets smarter from patterns")
print("- Applies to ANY business")
print("\nBusiness value:")
print("- Save $50+ per ticket")
print("- 24/7 support coverage")
print("- Happier customers")
print("- Data on pain points")
print("- Train future support staff for free")

httpd.serve_forever()
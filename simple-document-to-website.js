#!/usr/bin/env node

/**
 * SIMPLE DOCUMENT TO WEBSITE GENERATOR
 * 
 * Upload document → Get working website in 60 seconds
 * NO complexity, NO auth, NO external services
 * Just upload and download. That's it.
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();
const PORT = 3000;

// Configure file upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

app.use(express.static('public'));
app.use(express.json());

// Built-in templates - no external services needed
const TEMPLATES = {
  agent_economy: {
    name: 'AI Agent Marketplace',
    description: 'Agent-to-agent trading and reputation systems',
    generate: (content) => generateAgentEconomyTemplate(content)
  },
  gaming_platform: {
    name: 'Gaming Economy Arena',
    description: 'Token-based gaming with real economic rewards',
    generate: (content) => generateGamingPlatformTemplate(content)
  },
  verification_system: {
    name: 'BlameChain Trust Network',
    description: 'Handshake verification and accountability layers',
    generate: (content) => generateVerificationTemplate(content)
  },
  conversation_processor: {
    name: 'Chat-to-MVP System',
    description: 'Extract business ideas from conversation logs',
    generate: (content) => generateConversationTemplate(content)
  },
  architecture_compactor: {
    name: 'System Architecture Simplifier',
    description: 'Reduce complex systems to working MVPs',
    generate: (content) => generateArchitectureTemplate(content)
  }
};

// Simple AI analysis - works offline
function analyzeDocument(text) {
  const analysis = {
    type: 'business',
    title: 'Your Business',
    description: 'Professional business website',
    features: [],
    colors: { primary: '#2563eb', secondary: '#1e40af' }
  };

  const lowerText = text.toLowerCase();

  // Detect type based on actual user domains
  if (lowerText.includes('agent') || lowerText.includes('ai') || lowerText.includes('trading') || lowerText.includes('economy') || lowerText.includes('marketplace')) {
    analysis.type = 'agent_economy';
    analysis.title = 'Agent Economy Platform';
    analysis.description = 'AI agents trading services and building reputation';
  } else if (lowerText.includes('game') || lowerText.includes('gaming') || lowerText.includes('battle') || lowerText.includes('arena') || lowerText.includes('token') || lowerText.includes('reward')) {
    analysis.type = 'gaming_platform';
    analysis.title = 'Gaming Economy Arena';
    analysis.description = 'Competitive gaming with real economic rewards';
  } else if (lowerText.includes('verification') || lowerText.includes('trust') || lowerText.includes('handshake') || lowerText.includes('security') || lowerText.includes('blame') || lowerText.includes('accountability')) {
    analysis.type = 'verification_system';
    analysis.title = 'BlameChain Trust Network';
    analysis.description = 'Distributed verification and accountability system';
  } else if (lowerText.includes('conversation') || lowerText.includes('chat') || lowerText.includes('log') || lowerText.includes('message') || lowerText.includes('dialogue')) {
    analysis.type = 'conversation_processor';
    analysis.title = 'Chat-to-MVP System';
    analysis.description = 'Extract actionable business ideas from conversations';
  } else if (lowerText.includes('architecture') || lowerText.includes('system') || lowerText.includes('complex') || lowerText.includes('simplify') || lowerText.includes('layers') || lowerText.includes('service')) {
    analysis.type = 'architecture_compactor';
    analysis.title = 'Architecture Compactor';
    analysis.description = 'Simplify complex systems into working MVPs';
  }

  // Extract title (first line or after "title:" or company name)
  const lines = text.split('\\n');
  const titleMatch = text.match(/(?:title|company|business|name):\\s*([^\\n]+)/i);
  if (titleMatch) {
    analysis.title = titleMatch[1].trim();
  } else if (lines[0] && lines[0].length < 100) {
    analysis.title = lines[0].trim();
  }

  // Extract description
  const descMatch = text.match(/(?:description|about|summary):\\s*([^\\n]+)/i);
  if (descMatch) {
    analysis.description = descMatch[1].trim();
  }

  // Extract features
  const featureWords = ['feature', 'service', 'benefit', 'offering', 'capability'];
  featureWords.forEach(word => {
    const regex = new RegExp(`${word}s?:\\s*([^\\n]+)`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        const feature = match.replace(/^[^:]+:\\s*/, '').trim();
        if (feature.length > 5) analysis.features.push(feature);
      });
    }
  });

  // Default features if none found
  if (analysis.features.length === 0) {
    const defaultFeatures = {
      saas: ['User-friendly interface', 'Powerful analytics', 'Secure platform', '24/7 support'],
      portfolio: ['Professional experience', 'Diverse skills', 'Quality projects', 'Client satisfaction'],
      business: ['Expert service', 'Proven results', 'Professional team', 'Customer focus'],
      blog: ['Quality content', 'Regular updates', 'Expert insights', 'Engaging stories'],
      ecommerce: ['Quality products', 'Fast shipping', 'Secure checkout', 'Great prices']
    };
    analysis.features = defaultFeatures[analysis.type] || defaultFeatures.business;
  }

  return analysis;
}

// Template generators - Based on actual user domains and reasoning patterns
function generateAgentEconomyTemplate(analysis) {
  const { title, description, features } = analysis;
  
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Agent Economy Platform</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">${title}</div>
            <div class="nav-links">
                <a href="#agents">Agents</a>
                <a href="#economy">Economy</a>
                <a href="#reputation">Reputation</a>
                <a href="#api">API</a>
                <button class="connect-wallet">Connect Agent</button>
            </div>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h1>The Agent Economy Revolution</h1>
                <p class="hero-description">${description}</p>
                <div class="stats-grid">
                    <div class="stat">
                        <div class="stat-number" data-target="1247">0</div>
                        <div class="stat-label">Active Agents</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" data-target="89456">0</div>
                        <div class="stat-label">Tasks Completed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" data-target="99.7">0</div>
                        <div class="stat-label">% Success Rate</div>
                    </div>
                </div>
                <div class="hero-buttons">
                    <button class="btn-primary">Deploy Agent</button>
                    <button class="btn-secondary">Browse Marketplace</button>
                </div>
            </div>
        </section>

        <section id="agents" class="agent-marketplace">
            <div class="container">
                <h2>Active Agent Marketplace</h2>
                <div class="marketplace-grid">
                    ${features.map((feature, index) => {
                        const agentTypes = ['🤖 Code Generator', '📊 Data Analyst', '🎨 Design Agent', '🔍 Research Bot', '💰 Trading Agent'];
                        const prices = ['0.05 ETH/hour', '0.03 ETH/task', '0.08 ETH/hour', '0.02 ETH/query', '0.1 ETH/trade'];
                        return `
                        <div class="agent-card">
                            <div class="agent-avatar">${agentTypes[index] || '🤖'}</div>
                            <h3>${feature}</h3>
                            <p class="agent-price">${prices[index] || '0.05 ETH/hour'}</p>
                            <div class="agent-stats">
                                <span class="reputation">⭐ ${(Math.random() * 2 + 3).toFixed(1)}</span>
                                <span class="completed">${Math.floor(Math.random() * 500 + 100)} tasks</span>
                            </div>
                            <button class="hire-agent">Hire Agent</button>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </section>

        <section id="economy" class="economy-dashboard">
            <div class="container">
                <h2>Real-Time Economy Dashboard</h2>
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <h3>💰 Total Value Transacted</h3>
                        <div class="big-number">247.8 ETH</div>
                        <div class="change positive">+12.3% today</div>
                    </div>
                    <div class="dashboard-card">
                        <h3>🔄 Active Transactions</h3>
                        <div class="big-number">156</div>
                        <div class="transaction-feed">
                            <div class="tx">Agent-A47 → CodeGen: 0.05 ETH</div>
                            <div class="tx">DataBot-X2 → Analysis: 0.03 ETH</div>
                            <div class="tx">Designer-Z9 → Logo: 0.08 ETH</div>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <h3>📈 Performance Metrics</h3>
                        <canvas id="performanceChart" width="200" height="100"></canvas>
                    </div>
                </div>
            </div>
        </section>

        <section id="reputation" class="reputation-system">
            <div class="container">
                <h2>BlameChain Reputation Network</h2>
                <p>Immutable accountability through cryptographic verification</p>
                <div class="reputation-features">
                    <div class="feature">
                        <h3>🔗 Blockchain Verified</h3>
                        <p>Every transaction cryptographically signed and verified</p>
                    </div>
                    <div class="feature">
                        <h3>👥 Peer Review</h3>
                        <p>Community-driven quality assessment and ranking</p>
                    </div>
                    <div class="feature">
                        <h3>📊 Performance Tracking</h3>
                        <p>Real-time metrics and historical performance data</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="api" class="api-section">
            <div class="container">
                <h2>Agent API Integration</h2>
                <div class="api-demo">
                    <div class="code-block">
                        <pre><code>// Deploy an agent to the marketplace
const agent = await ${title}.deployAgent({
  type: 'code_generator',
  skills: ['javascript', 'python', 'rust'],
  hourlyRate: 0.05,
  availability: '24/7'
});

// Hire an agent for a task
const task = await ${title}.hireAgent({
  agentId: 'agent-a47',
  task: 'Build REST API',
  budget: 0.5,
  deadline: '24h'
});

// Monitor task progress
const progress = await ${title}.getTaskProgress(task.id);</code></pre>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2024 ${title}. Powered by Agent Economy Protocol.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`,

    'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: #ffffff;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
    border-bottom: 1px solid #00ff00;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00ff00;
    text-shadow: 0 0 10px #00ff00;
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.nav-links a {
    text-decoration: none;
    color: #ffffff;
    font-weight: 500;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: #00ff00;
}

.connect-wallet {
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.connect-wallet:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 0, 0.3);
}

.hero {
    padding: 8rem 0 4rem;
    text-align: center;
}

.hero h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    font-weight: 700;
    background: linear-gradient(45deg, #00ff00, #ffffff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero-description {
    font-size: 1.25rem;
    margin-bottom: 3rem;
    opacity: 0.9;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin: 3rem 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.stat {
    text-align: center;
}

.stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #00ff00;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
}

.btn-primary, .btn-secondary {
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 1rem;
}

.btn-primary {
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
}

.btn-secondary {
    background: transparent;
    color: #ffffff;
    border: 2px solid #00ff00;
}

.btn-primary:hover, .btn-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 255, 0, 0.2);
}

.agent-marketplace, .economy-dashboard, .reputation-system, .api-section {
    padding: 5rem 0;
}

.agent-marketplace h2, .economy-dashboard h2, .reputation-system h2, .api-section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #ffffff;
}

.marketplace-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
}

.agent-card {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #00ff00;
    border-radius: 15px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s;
}

.agent-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 255, 0, 0.2);
}

.agent-avatar {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.agent-price {
    font-size: 1.5rem;
    color: #00ff00;
    font-weight: bold;
    margin: 1rem 0;
}

.agent-stats {
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
    font-size: 0.9rem;
    opacity: 0.8;
}

.hire-agent {
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: all 0.3s;
}

.hire-agent:hover {
    transform: translateY(-1px);
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.dashboard-card {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #00ff00;
    border-radius: 15px;
    padding: 2rem;
}

.big-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #00ff00;
    margin: 1rem 0;
}

.change {
    font-size: 0.9rem;
}

.change.positive {
    color: #00ff00;
}

.transaction-feed {
    margin-top: 1rem;
}

.tx {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.5rem;
    border-radius: 5px;
    margin: 0.5rem 0;
    font-size: 0.9rem;
    border-left: 3px solid #00ff00;
}

.reputation-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.feature {
    text-align: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 15px;
    border: 1px solid rgba(0, 255, 0, 0.3);
}

.api-demo {
    background: #0a0a0a;
    border: 1px solid #00ff00;
    border-radius: 15px;
    padding: 2rem;
    margin-top: 2rem;
}

.code-block {
    overflow-x: auto;
}

.code-block pre {
    color: #00ff00;
    font-family: 'Monaco', 'Menlo', monospace;
    line-height: 1.6;
}

footer {
    background: rgba(0, 0, 0, 0.9);
    text-align: center;
    padding: 2rem 0;
    border-top: 1px solid #00ff00;
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2.5rem;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .nav-links {
        display: none;
    }
}`,

    'script.js': `document.addEventListener('DOMContentLoaded', function() {
    // Animate statistics
    const animateStats = () => {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000;
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                const current = Math.floor(progress * target);
                
                stat.textContent = target > 100 ? current.toLocaleString() : current.toFixed(1);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        });
    };

    // Start animation when stats come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.stats-grid');
    if (statsSection) observer.observe(statsSection);

    // Real-time transaction feed
    const transactionFeed = document.querySelector('.transaction-feed');
    if (transactionFeed) {
        const agentNames = ['Agent-A47', 'DataBot-X2', 'Designer-Z9', 'CodeGen-B3', 'Analyzer-C8'];
        const taskTypes = ['CodeGen', 'Analysis', 'Design', 'Research', 'Trading'];
        
        setInterval(() => {
            const agent = agentNames[Math.floor(Math.random() * agentNames.length)];
            const task = taskTypes[Math.floor(Math.random() * taskTypes.length)];
            const amount = (Math.random() * 0.1).toFixed(3);
            
            const newTx = document.createElement('div');
            newTx.className = 'tx';
            newTx.textContent = \`\${agent} → \${task}: \${amount} ETH\`;
            newTx.style.opacity = '0';
            
            transactionFeed.insertBefore(newTx, transactionFeed.firstChild);
            
            // Animate in
            setTimeout(() => {
                newTx.style.opacity = '1';
                newTx.style.transition = 'opacity 0.5s';
            }, 100);
            
            // Remove old transactions
            if (transactionFeed.children.length > 5) {
                transactionFeed.removeChild(transactionFeed.lastChild);
            }
        }, 3000);
    }

    // Performance chart simulation
    const canvas = document.getElementById('performanceChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Generate performance data
        const dataPoints = 20;
        const data = [];
        for (let i = 0; i < dataPoints; i++) {
            data.push(Math.random() * 0.8 + 0.2);
        }
        
        // Draw chart
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = (index / (dataPoints - 1)) * width;
            const y = height - (point * height);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.stroke();
    }

    // Hire agent functionality
    document.querySelectorAll('.hire-agent').forEach(button => {
        button.addEventListener('click', function() {
            const agentCard = this.closest('.agent-card');
            const agentName = agentCard.querySelector('h3').textContent;
            
            alert(\`Initiating secure handshake with \${agentName}...\\n\\n🔐 Cryptographic verification in progress\\n⏳ Escrow contract deploying\\n✅ Agent connection established!\\n\\nThis would integrate with your actual agent economy platform.\`);
            
            // Visual feedback
            this.textContent = 'Connected!';
            this.style.background = '#00ff00';
            setTimeout(() => {
                this.textContent = 'Hire Agent';
                this.style.background = 'linear-gradient(45deg, #00ff00, #00cc00)';
            }, 2000);
        });
    });

    // Connect wallet functionality
    document.querySelector('.connect-wallet').addEventListener('click', function() {
        alert('🔗 Connecting to Agent Economy Network...\\n\\n• Ethereum wallet detected\\n• Agent credentials verified\\n• BlameChain reputation loaded\\n\\nReady to participate in the agent economy!');
        
        this.textContent = 'Agent Connected';
        this.style.background = 'linear-gradient(45deg, #00ff00, #ffffff)';
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});`
  };
}

// Template generators
function generateGamingPlatformTemplate(analysis) {
  const { title, description, features } = analysis;
  
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Gaming Economy Arena</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="matrix-bg"></div>
    
    <header class="gaming-header">
        <nav class="container">
            <div class="logo">
                <span class="logo-icon">⚡</span>
                <span class="logo-text">${title}</span>
                <span class="beta-tag">ARENA</span>
            </div>
            <div class="nav-menu">
                <a href="#arena">Battle Arena</a>
                <a href="#economy">Token Economy</a>
                <a href="#tournaments">Tournaments</a>
                <div class="wallet-connect">
                    <span class="token-balance">1,247 GAME</span>
                    <button class="connect-btn">Connect Wallet</button>
                </div>
            </div>
        </nav>
    </header>

    <main>
        <section class="hero-gaming">
            <div class="container">
                <div class="hero-content">
                    <h1 class="gaming-title">
                        <span class="title-main">${title}</span>
                        <span class="title-sub">WHERE SKILL MEETS REWARD</span>
                    </h1>
                    <p class="hero-tagline">${description}</p>
                    
                    <div class="live-stats">
                        <div class="stat-item">
                            <div class="stat-number" id="activePlayers">2,847</div>
                            <div class="stat-label">Players Online</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number" id="totalPrizePool">$47,392</div>
                            <div class="stat-label">Prize Pool Today</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number" id="gamesPlayed">18,293</div>
                            <div class="stat-label">Games This Hour</div>
                        </div>
                    </div>

                    <div class="hero-actions">
                        <button class="btn-enter-arena">ENTER ARENA</button>
                        <button class="btn-watch-live">WATCH LIVE BATTLES</button>
                    </div>
                </div>
                
                <div class="hero-visual">
                    <div class="battle-preview">
                        <div class="player-card left">
                            <div class="player-avatar">🦾</div>
                            <div class="player-name">CyberWarrior</div>
                            <div class="player-rank">DIAMOND</div>
                            <div class="player-winrate">89% WR</div>
                        </div>
                        <div class="vs-indicator">VS</div>
                        <div class="player-card right">
                            <div class="player-avatar">🔥</div>
                            <div class="player-name">PhoenixRising</div>
                            <div class="player-rank">MASTERS</div>
                            <div class="player-winrate">94% WR</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="arena" class="game-modes">
            <div class="container">
                <h2>Choose Your Battle</h2>
                <div class="modes-grid">
                    <div class="mode-card featured">
                        <div class="mode-header">
                            <span class="mode-icon">⚡</span>
                            <span class="mode-name">Lightning Rounds</span>
                            <span class="mode-status live">LIVE</span>
                        </div>
                        <div class="mode-stats">
                            <div>Entry: 50 GAME</div>
                            <div>Winner: 450 GAME</div>
                            <div>Duration: 3 minutes</div>
                        </div>
                        <button class="join-mode-btn">JOIN NOW</button>
                    </div>
                    
                    <div class="mode-card">
                        <div class="mode-header">
                            <span class="mode-icon">🏆</span>
                            <span class="mode-name">Championship</span>
                            <span class="mode-status">STARTING SOON</span>
                        </div>
                        <div class="mode-stats">
                            <div>Entry: 500 GAME</div>
                            <div>Winner: $2,500 USD</div>
                            <div>Duration: 45 minutes</div>
                        </div>
                        <button class="join-mode-btn">REGISTER</button>
                    </div>
                    
                    <div class="mode-card">
                        <div class="mode-header">
                            <span class="mode-icon">🎯</span>
                            <span class="mode-name">Practice Arena</span>
                            <span class="mode-status">FREE</span>
                        </div>
                        <div class="mode-stats">
                            <div>Entry: FREE</div>
                            <div>Rewards: XP Only</div>
                            <div>Duration: Unlimited</div>
                        </div>
                        <button class="join-mode-btn">PLAY FREE</button>
                    </div>
                </div>
            </div>
        </section>

        <section id="economy" class="token-economy">
            <div class="container">
                <h2>Token Economy</h2>
                <div class="economy-grid">
                    <div class="economy-card">
                        <h3>GAME Token</h3>
                        <div class="token-price">$0.47 USD</div>
                        <div class="token-change positive">+12.3% (24h)</div>
                        <div class="token-stats">
                            <div class="stat-row">
                                <span>Market Cap:</span>
                                <span>$2.1M</span>
                            </div>
                            <div class="stat-row">
                                <span>Total Supply:</span>
                                <span>10M GAME</span>
                            </div>
                            <div class="stat-row">
                                <span>Circulating:</span>
                                <span>4.5M GAME</span>
                            </div>
                        </div>
                        <button class="buy-token-btn">BUY GAME</button>
                    </div>
                    
                    <div class="economy-card">
                        <h3>Earning Mechanics</h3>
                        <div class="earning-list">
                            <div class="earning-item">
                                <span class="earning-icon">🏆</span>
                                <div class="earning-details">
                                    <div class="earning-name">Tournament Wins</div>
                                    <div class="earning-reward">500-5000 GAME</div>
                                </div>
                            </div>
                            <div class="earning-item">
                                <span class="earning-icon">⚡</span>
                                <div class="earning-details">
                                    <div class="earning-name">Lightning Rounds</div>
                                    <div class="earning-reward">50-450 GAME</div>
                                </div>
                            </div>
                            <div class="earning-item">
                                <span class="earning-icon">🎯</span>
                                <div class="earning-details">
                                    <div class="earning-name">Daily Challenges</div>
                                    <div class="earning-reward">25-100 GAME</div>
                                </div>
                            </div>
                            <div class="earning-item">
                                <span class="earning-icon">🤝</span>
                                <div class="earning-details">
                                    <div class="earning-name">Referral Bonus</div>
                                    <div class="earning-reward">10% of winnings</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="tournaments" class="tournaments">
            <div class="container">
                <h2>Live Tournaments</h2>
                <div class="tournament-list">
                    <div class="tournament-card live">
                        <div class="tournament-header">
                            <h3>Weekly Championship</h3>
                            <span class="tournament-status">LIVE</span>
                        </div>
                        <div class="tournament-info">
                            <div class="tournament-stat">
                                <span class="label">Prize Pool:</span>
                                <span class="value">$10,000 USD</span>
                            </div>
                            <div class="tournament-stat">
                                <span class="label">Players:</span>
                                <span class="value">247/256</span>
                            </div>
                            <div class="tournament-stat">
                                <span class="label">Entry:</span>
                                <span class="value">500 GAME</span>
                            </div>
                            <div class="tournament-stat">
                                <span class="label">Time Left:</span>
                                <span class="value countdown" id="tournament1">2:34:17</span>
                            </div>
                        </div>
                        <button class="tournament-btn">SPECTATE</button>
                    </div>
                    
                    <div class="tournament-card upcoming">
                        <div class="tournament-header">
                            <h3>Masters Series</h3>
                            <span class="tournament-status">UPCOMING</span>
                        </div>
                        <div class="tournament-info">
                            <div class="tournament-stat">
                                <span class="label">Prize Pool:</span>
                                <span class="value">$25,000 USD</span>
                            </div>
                            <div class="tournament-stat">
                                <span class="label">Players:</span>
                                <span class="value">0/64</span>
                            </div>
                            <div class="tournament-stat">
                                <span class="label">Entry:</span>
                                <span class="value">2000 GAME</span>
                            </div>
                            <div class="tournament-stat">
                                <span class="label">Starts In:</span>
                                <span class="value countdown" id="tournament2">23:45:32</span>
                            </div>
                        </div>
                        <button class="tournament-btn">REGISTER</button>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="gaming-footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Gaming Platform</h4>
                    <p>Where skill meets real economic rewards</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <a href="#arena">Battle Arena</a>
                    <a href="#economy">Token Economy</a>
                    <a href="#tournaments">Tournaments</a>
                </div>
                <div class="footer-section">
                    <h4>Community</h4>
                    <a href="#">Discord</a>
                    <a href="#">Twitter</a>
                    <a href="#">Telegram</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ${title}. Built for gamers, by gamers.</p>
            </div>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`,

    'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Rajdhani', 'Orbitron', 'Roboto Mono', monospace;
    line-height: 1.6;
    color: #ffffff;
    background: #0a0a0a;
    overflow-x: hidden;
}

.matrix-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        radial-gradient(ellipse at center, transparent 0%, rgba(0, 255, 0, 0.1) 50%, transparent 100%),
        linear-gradient(90deg, transparent 79px, rgba(0, 255, 0, 0.03) 81px, transparent 82px),
        linear-gradient(180deg, transparent 79px, rgba(0, 255, 0, 0.03) 81px, transparent 82px);
    background-size: 100% 100%, 80px 80px, 80px 80px;
    z-index: -1;
    animation: matrix-pulse 8s ease-in-out infinite;
}

@keyframes matrix-pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.7; }
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
}

.gaming-header {
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 2px solid #00ff00;
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

.gaming-header nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.8rem;
    font-weight: bold;
    color: #00ff00;
    text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.logo-icon {
    font-size: 2rem;
    animation: glow-pulse 2s ease-in-out infinite alternate;
}

.beta-tag {
    background: linear-gradient(45deg, #ff0080, #00ff00);
    color: #000;
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-weight: 900;
    margin-left: 0.5rem;
}

@keyframes glow-pulse {
    from { text-shadow: 0 0 5px rgba(0, 255, 0, 0.5); }
    to { text-shadow: 0 0 20px rgba(0, 255, 0, 0.8), 0 0 30px rgba(0, 255, 0, 0.4); }
}

.nav-menu {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #ffffff;
    font-weight: 600;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition: all 0.3s;
    border: 1px solid transparent;
}

.nav-menu a:hover {
    color: #00ff00;
    border-color: #00ff00;
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
}

.wallet-connect {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.token-balance {
    background: rgba(0, 255, 0, 0.1);
    color: #00ff00;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid rgba(0, 255, 0, 0.3);
    font-weight: bold;
    font-family: 'Roboto Mono', monospace;
}

.connect-btn {
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
    border: none;
    padding: 0.7rem 1.5rem;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.connect-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 0, 0.4);
}

.hero-gaming {
    padding: 8rem 0 4rem;
    margin-top: 80px;
    background: linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
    position: relative;
}

.hero-content {
    text-align: center;
    margin-bottom: 4rem;
}

.gaming-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

.title-main {
    font-size: 4rem;
    font-weight: 900;
    background: linear-gradient(45deg, #00ff00, #ffffff, #00ff00);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
}

.title-sub {
    font-size: 1.2rem;
    color: #00ff00;
    font-weight: 600;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
}

.hero-tagline {
    font-size: 1.3rem;
    margin-bottom: 3rem;
    opacity: 0.9;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.live-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin: 3rem 0;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.stat-item {
    text-align: center;
    padding: 1.5rem;
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    border-radius: 10px;
}

.stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #00ff00;
    margin-bottom: 0.5rem;
    font-family: 'Roboto Mono', monospace;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 0.1rem;
}

.hero-actions {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    margin-top: 2rem;
}

.btn-enter-arena, .btn-watch-live {
    padding: 1.2rem 2.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.1rem;
}

.btn-enter-arena {
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
}

.btn-watch-live {
    background: transparent;
    color: #ffffff;
    border: 2px solid #00ff00;
}

.btn-enter-arena:hover, .btn-watch-live:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 255, 0, 0.4);
}

.hero-visual {
    display: flex;
    justify-content: center;
    margin-top: 3rem;
}

.battle-preview {
    display: flex;
    align-items: center;
    gap: 3rem;
    background: rgba(0, 0, 0, 0.7);
    padding: 2rem;
    border-radius: 15px;
    border: 2px solid rgba(0, 255, 0, 0.3);
}

.player-card {
    text-align: center;
    padding: 1.5rem;
    background: rgba(0, 255, 0, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(0, 255, 0, 0.3);
    min-width: 150px;
}

.player-avatar {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.player-name {
    font-weight: bold;
    color: #00ff00;
    margin-bottom: 0.5rem;
}

.player-rank {
    font-size: 0.8rem;
    color: #ffd700;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.player-winrate {
    font-size: 0.9rem;
    color: #ffffff;
    opacity: 0.8;
}

.vs-indicator {
    font-size: 2rem;
    font-weight: bold;
    color: #ff0080;
    text-shadow: 0 0 10px rgba(255, 0, 128, 0.5);
}

.game-modes {
    padding: 5rem 0;
    background: rgba(0, 0, 0, 0.5);
}

.game-modes h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #ffffff;
    text-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
}

.modes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.mode-card {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid rgba(0, 255, 0, 0.3);
    border-radius: 15px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
}

.mode-card.featured {
    border-color: #00ff00;
    box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
}

.mode-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 255, 0, 0.2);
    border-color: #00ff00;
}

.mode-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.mode-icon {
    font-size: 2rem;
}

.mode-name {
    font-size: 1.3rem;
    font-weight: bold;
    color: #ffffff;
}

.mode-status {
    background: #00ff00;
    color: #000;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
}

.mode-status.live {
    background: #ff0080;
    color: #ffffff;
    animation: pulse-live 2s ease-in-out infinite;
}

@keyframes pulse-live {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.mode-stats {
    margin-bottom: 2rem;
}

.mode-stats div {
    margin-bottom: 0.5rem;
    font-family: 'Roboto Mono', monospace;
}

.join-mode-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    text-transform: uppercase;
}

.join-mode-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0, 255, 0, 0.4);
}

.token-economy {
    padding: 5rem 0;
    background: rgba(0, 0, 0, 0.3);
}

.token-economy h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #ffffff;
    text-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
}

.economy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 3rem;
    max-width: 1200px;
    margin: 0 auto;
}

.economy-card {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid rgba(0, 255, 0, 0.3);
    border-radius: 15px;
    padding: 2.5rem;
    transition: all 0.3s;
}

.economy-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 255, 0, 0.2);
    border-color: #00ff00;
}

.economy-card h3 {
    color: #00ff00;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
}

.token-price {
    font-size: 3rem;
    font-weight: bold;
    color: #ffffff;
    text-align: center;
    margin-bottom: 1rem;
    font-family: 'Roboto Mono', monospace;
}

.token-change {
    text-align: center;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 2rem;
}

.token-change.positive {
    color: #00ff00;
}

.token-stats {
    margin-bottom: 2rem;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(0, 255, 0, 0.1);
    font-family: 'Roboto Mono', monospace;
}

.buy-token-btn {
    width: 100%;
    padding: 1.2rem;
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    text-transform: uppercase;
    font-size: 1.1rem;
}

.buy-token-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0, 255, 0, 0.4);
}

.earning-list {
    space-y: 1rem;
}

.earning-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 255, 0, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(0, 255, 0, 0.1);
    margin-bottom: 1rem;
}

.earning-icon {
    font-size: 1.5rem;
    width: 40px;
    text-align: center;
}

.earning-details {
    flex: 1;
}

.earning-name {
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 0.25rem;
}

.earning-reward {
    color: #00ff00;
    font-weight: bold;
    font-family: 'Roboto Mono', monospace;
}

.tournaments {
    padding: 5rem 0;
    background: rgba(0, 0, 0, 0.7);
}

.tournaments h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #ffffff;
    text-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
}

.tournament-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.tournament-card {
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid rgba(0, 255, 0, 0.3);
    border-radius: 15px;
    padding: 2rem;
    transition: all 0.3s;
}

.tournament-card.live {
    border-color: #ff0080;
    box-shadow: 0 0 30px rgba(255, 0, 128, 0.3);
}

.tournament-card.upcoming {
    border-color: #ffd700;
}

.tournament-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 255, 0, 0.2);
}

.tournament-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.tournament-header h3 {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: bold;
}

.tournament-status {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
}

.tournament-card.live .tournament-status {
    background: #ff0080;
    color: #ffffff;
    animation: pulse-live 2s ease-in-out infinite;
}

.tournament-card.upcoming .tournament-status {
    background: #ffd700;
    color: #000;
}

.tournament-info {
    margin-bottom: 2rem;
}

.tournament-stat {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(0, 255, 0, 0.1);
    font-family: 'Roboto Mono', monospace;
}

.tournament-stat .label {
    color: #ffffff;
    opacity: 0.8;
}

.tournament-stat .value {
    color: #00ff00;
    font-weight: bold;
}

.countdown {
    color: #ff0080 !important;
    font-weight: bold;
}

.tournament-btn {
    width: 100%;
    padding: 1.2rem;
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    text-transform: uppercase;
    font-size: 1.1rem;
}

.tournament-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0, 255, 0, 0.4);
}

.gaming-footer {
    background: rgba(0, 0, 0, 0.95);
    border-top: 2px solid #00ff00;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h4 {
    color: #00ff00;
    margin-bottom: 1rem;
    font-size: 1.2rem;
}

.footer-section p {
    color: #ffffff;
    opacity: 0.8;
    line-height: 1.6;
}

.footer-section a {
    color: #ffffff;
    text-decoration: none;
    display: block;
    margin-bottom: 0.5rem;
    transition: color 0.3s;
}

.footer-section a:hover {
    color: #00ff00;
}

.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid rgba(0, 255, 0, 0.2);
}

.footer-bottom p {
    color: #ffffff;
    opacity: 0.6;
}

@media (max-width: 768px) {
    .gaming-header nav {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-menu {
        flex-direction: column;
        gap: 1rem;
    }
    
    .wallet-connect {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .title-main {
        font-size: 2.5rem;
    }
    
    .live-stats {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .hero-actions {
        flex-direction: column;
        gap: 1rem;
    }
    
    .battle-preview {
        flex-direction: column;
        gap: 1rem;
    }
    
    .modes-grid, .economy-grid, .tournament-list {
        grid-template-columns: 1fr;
    }
}`,

    'script.js': `// Gaming Platform Interactive Features
document.addEventListener('DOMContentLoaded', function() {
    // Real-time statistics animation
    function updateLiveStats() {
        const activePlayers = document.getElementById('activePlayers');
        const totalPrizePool = document.getElementById('totalPrizePool');
        const gamesPlayed = document.getElementById('gamesPlayed');
        
        if (activePlayers) {
            const baseValue = 2800;
            const variance = Math.floor(Math.random() * 100) - 50;
            activePlayers.textContent = (baseValue + variance).toLocaleString();
        }
        
        if (totalPrizePool) {
            const baseValue = 47000;
            const variance = Math.floor(Math.random() * 1000);
            totalPrizePool.textContent = '$' + (baseValue + variance).toLocaleString();
        }
        
        if (gamesPlayed) {
            const baseValue = 18000;
            const variance = Math.floor(Math.random() * 500);
            gamesPlayed.textContent = (baseValue + variance).toLocaleString();
        }
    }
    
    // Update stats every 3 seconds
    updateLiveStats();
    setInterval(updateLiveStats, 3000);
    
    // Tournament countdown timers
    function updateCountdowns() {
        const countdowns = document.querySelectorAll('.countdown');
        countdowns.forEach(countdown => {
            const currentTime = countdown.textContent.split(':');
            let hours = parseInt(currentTime[0]);
            let minutes = parseInt(currentTime[1]);
            let seconds = parseInt(currentTime[2]);
            
            seconds--;
            if (seconds < 0) {
                seconds = 59;
                minutes--;
                if (minutes < 0) {
                    minutes = 59;
                    hours--;
                    if (hours < 0) {
                        hours = 0;
                        minutes = 0;
                        seconds = 0;
                    }
                }
            }
            
            countdown.textContent = 
                String(hours).padStart(2, '0') + ':' +
                String(minutes).padStart(2, '0') + ':' +
                String(seconds).padStart(2, '0');
        });
    }
    
    // Update countdowns every second
    setInterval(updateCountdowns, 1000);
    
    // Token price animation
    function animateTokenPrice() {
        const tokenPrice = document.querySelector('.token-price');
        const tokenChange = document.querySelector('.token-change');
        
        if (tokenPrice && tokenChange) {
            const basePrice = 0.47;
            const change = (Math.random() - 0.5) * 0.02; // ±1 cent
            const newPrice = Math.max(0.01, basePrice + change);
            const percentChange = ((newPrice - basePrice) / basePrice * 100);
            
            tokenPrice.textContent = '$' + newPrice.toFixed(3) + ' USD';
            tokenChange.textContent = (percentChange >= 0 ? '+' : '') + percentChange.toFixed(1) + '% (24h)';
            tokenChange.className = 'token-change ' + (percentChange >= 0 ? 'positive' : 'negative');
        }
    }
    
    // Update token price every 5 seconds
    setInterval(animateTokenPrice, 5000);
    
    // Button interactions
    document.querySelectorAll('.btn-enter-arena, .join-mode-btn, .tournament-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Create ripple effect
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(0, 255, 0, 0.6)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = '50%';
            ripple.style.top = '50%';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.marginLeft = '-10px';
            ripple.style.marginTop = '-10px';
            
            this.style.position = 'relative';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // Show action feedback
            const originalText = this.textContent;
            this.textContent = 'CONNECTING...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
            }, 2000);
        });
    });
    
    // Wallet connection simulation
    document.querySelector('.connect-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        const originalText = this.textContent;
        this.textContent = 'CONNECTING...';
        this.disabled = true;
        
        setTimeout(() => {
            this.textContent = 'CONNECTED';
            this.style.background = 'linear-gradient(45deg, #00cc00, #009900)';
            
            // Update token balance
            const balance = document.querySelector('.token-balance');
            if (balance) {
                balance.textContent = '1,247 GAME';
                balance.style.animation = 'glow-pulse 1s ease-in-out';
            }
        }, 1500);
    });
    
    // Player card hover effects
    document.querySelectorAll('.player-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 10px 30px rgba(0, 255, 0, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });
    
    // Matrix background pulse effect
    const matrixBg = document.querySelector('.matrix-bg');
    if (matrixBg) {
        let pulseDirection = 1;
        let pulseIntensity = 0.3;
        
        setInterval(() => {
            pulseIntensity += pulseDirection * 0.05;
            if (pulseIntensity >= 0.7 || pulseIntensity <= 0.2) {
                pulseDirection *= -1;
            }
            matrixBg.style.opacity = pulseIntensity;
        }, 200);
    }
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = \`
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
\`;
document.head.appendChild(style);
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Button click handlers
    document.querySelectorAll('.btn-primary, .cta-btn').forEach(button => {
        button.addEventListener('click', function() {
            alert('Ready to get started! Contact us to begin your journey.');
        });
    });

    document.querySelectorAll('.btn-secondary').forEach(button => {
        button.addEventListener('click', function() {
            alert('Demo coming soon! Contact us for a personalized demo.');
        });
    });

    // Add scroll effect to header
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'white';
            header.style.backdropFilter = 'none';
        }
    });
});`
  };
}

function generateBusinessTemplate(analysis) {
  const { title, description, features } = analysis;
  
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">${title}</div>
            <ul class="nav-menu">
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero">
        <div class="container">
            <h1>${title}</h1>
            <p>${description}</p>
            <a href="#contact" class="cta-button">Get In Touch</a>
        </div>
    </section>

    <section id="about" class="about">
        <div class="container">
            <h2>About Us</h2>
            <p>We are dedicated professionals committed to delivering exceptional results for our clients. With years of experience and a passion for excellence, we provide solutions that drive success.</p>
        </div>
    </section>

    <section id="services" class="services">
        <div class="container">
            <h2>Our Services</h2>
            <div class="services-grid">
                ${features.map(feature => `
                <div class="service-card">
                    <h3>${feature}</h3>
                    <p>Professional service delivered with expertise and attention to detail.</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Contact Us</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Get In Touch</h3>
                    <p>Ready to work together? We'd love to hear from you.</p>
                    <div class="contact-details">
                        <p>📧 hello@${title.toLowerCase().replace(/\\s+/g, '')}.com</p>
                        <p>📞 (555) 123-4567</p>
                        <p>📍 123 Business St, City, State 12345</p>
                    </div>
                </div>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <textarea placeholder="Your Message" rows="5" required></textarea>
                    <button type="submit">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; 2024 ${title}. All rights reserved.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`,

    'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Georgia', serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.logo {
    font-size: 1.8rem;
    font-weight: bold;
    color: #2c3e50;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #3498db;
}

.hero {
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    color: white;
    text-align: center;
    padding: 8rem 0 4rem;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.cta-button {
    display: inline-block;
    background: #e74c3c;
    color: white;
    padding: 1rem 2rem;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: all 0.3s;
}

.cta-button:hover {
    background: #c0392b;
    transform: translateY(-2px);
}

.about, .services, .contact {
    padding: 4rem 0;
}

.about {
    background: #f8f9fa;
}

.about h2, .services h2, .contact h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2.5rem;
    color: #2c3e50;
}

.about p {
    text-align: center;
    font-size: 1.1rem;
    max-width: 800px;
    margin: 0 auto;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    text-align: center;
    transition: transform 0.3s;
}

.service-card:hover {
    transform: translateY(-5px);
}

.service-card h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

.contact {
    background: #f8f9fa;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin-top: 2rem;
}

.contact-info h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

.contact-details {
    margin-top: 2rem;
}

.contact-details p {
    margin-bottom: 0.5rem;
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form textarea {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
}

.contact-form button {
    background: #3498db;
    color: white;
    padding: 1rem;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.contact-form button:hover {
    background: #2980b9;
}

footer {
    background: #2c3e50;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2rem;
    }
    
    .contact-content {
        grid-template-columns: 1fr;
    }
    
    .nav-menu {
        display: none;
    }
}`,

    'script.js': `document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Contact form
    document.querySelector('.contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
});`
  };
}

function generatePortfolioTemplate(analysis) {
  const { title, description, features } = analysis;
  
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Portfolio</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">${title}</div>
            <ul class="nav-links">
                <li><a href="#about">About</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-content">
            <h1>Hello, I'm ${title}</h1>
            <p class="hero-subtitle">${description}</p>
            <div class="hero-buttons">
                <a href="#projects" class="btn-primary">View My Work</a>
                <a href="#contact" class="btn-secondary">Get In Touch</a>
            </div>
        </div>
    </section>

    <section id="about" class="about">
        <div class="container">
            <h2>About Me</h2>
            <p>I am a passionate professional with expertise in creating exceptional solutions. With a focus on quality and innovation, I bring ideas to life through careful planning and execution.</p>
        </div>
    </section>

    <section id="skills" class="skills">
        <div class="container">
            <h2>Skills & Expertise</h2>
            <div class="skills-grid">
                ${features.map(skill => `
                <div class="skill-card">
                    <h3>${skill}</h3>
                    <div class="skill-bar">
                        <div class="skill-progress" style="width: ${Math.floor(Math.random() * 30) + 70}%"></div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="projects" class="projects">
        <div class="container">
            <h2>Featured Projects</h2>
            <div class="projects-grid">
                <div class="project-card">
                    <div class="project-image"></div>
                    <h3>Project One</h3>
                    <p>A comprehensive solution that delivered exceptional results for the client.</p>
                    <a href="#" class="project-link">View Project</a>
                </div>
                <div class="project-card">
                    <div class="project-image"></div>
                    <h3>Project Two</h3>
                    <p>An innovative approach to solving complex challenges with elegant design.</p>
                    <a href="#" class="project-link">View Project</a>
                </div>
                <div class="project-card">
                    <div class="project-image"></div>
                    <h3>Project Three</h3>
                    <p>A creative solution that combined functionality with beautiful aesthetics.</p>
                    <a href="#" class="project-link">View Project</a>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Let's Work Together</h2>
            <p>I'm always interested in new opportunities and collaborations.</p>
            <div class="contact-info">
                <p>📧 hello@${title.toLowerCase().replace(/\\s+/g, '')}.com</p>
                <p>💼 linkedin.com/in/${title.toLowerCase().replace(/\\s+/g, '')}</p>
                <p>🌐 github.com/${title.toLowerCase().replace(/\\s+/g, '')}</p>
            </div>
            <a href="mailto:hello@${title.toLowerCase().replace(/\\s+/g, '')}.com" class="contact-button">Send Message</a>
        </div>
    </section>

    <script src="script.js"></script>
</body>
</html>`,

    'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #6366f1;
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: #6366f1;
}

.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
}

.hero-content h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    font-weight: 700;
}

.hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.btn-primary, .btn-secondary {
    padding: 1rem 2rem;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s;
}

.btn-primary {
    background: white;
    color: #6366f1;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.about, .skills, .projects, .contact {
    padding: 5rem 0;
}

.about {
    background: #f8fafc;
    text-align: center;
}

.about h2, .skills h2, .projects h2, .contact h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: #1f2937;
}

.about p {
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
}

.skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.skill-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.skill-bar {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
    margin-top: 1rem;
}

.skill-progress {
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    height: 100%;
    border-radius: 4px;
    transition: width 2s ease;
}

.projects {
    background: #f8fafc;
}

.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.project-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.project-card:hover {
    transform: translateY(-5px);
}

.project-image {
    height: 200px;
    background: linear-gradient(45deg, #6366f1, #8b5cf6);
    position: relative;
}

.project-card h3 {
    padding: 1rem;
    font-size: 1.25rem;
    color: #1f2937;
}

.project-card p {
    padding: 0 1rem;
    color: #6b7280;
}

.project-link {
    display: inline-block;
    margin: 1rem;
    color: #6366f1;
    text-decoration: none;
    font-weight: 600;
}

.contact {
    text-align: center;
}

.contact p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    color: #6b7280;
}

.contact-info {
    margin: 2rem 0;
}

.contact-info p {
    margin: 0.5rem 0;
    font-size: 1rem;
}

.contact-button {
    display: inline-block;
    background: #6366f1;
    color: white;
    padding: 1rem 2rem;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s;
}

.contact-button:hover {
    background: #5338f5;
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .hero-content h1 {
        font-size: 2.5rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .nav-links {
        display: none;
    }
}`,

    'script.js': `document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Animate skill bars when they come into view
    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBars = entry.target.querySelectorAll('.skill-progress');
                skillBars.forEach(bar => {
                    const width = bar.style.width;
                    bar.style.width = '0';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 500);
                });
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback);
    const skillsSection = document.querySelector('.skills');
    if (skillsSection) observer.observe(skillsSection);
});`
  };
}

function generateBlogTemplate(analysis) {
  const { title, description, features } = analysis;
  
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">${title}</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#articles">Articles</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="container">
                <h1>${title}</h1>
                <p class="hero-subtitle">${description}</p>
            </div>
        </section>

        <section class="featured-post">
            <div class="container">
                <article class="post-card featured">
                    <div class="post-image"></div>
                    <div class="post-content">
                        <span class="post-category">Featured</span>
                        <h2>Welcome to ${title}</h2>
                        <p>This is where we share insights, stories, and valuable content. Our mission is to provide quality information that helps and inspires our readers.</p>
                        <div class="post-meta">
                            <span class="post-date">January 15, 2024</span>
                            <span class="read-time">5 min read</span>
                        </div>
                    </div>
                </article>
            </div>
        </section>

        <section class="recent-posts">
            <div class="container">
                <h2>Recent Articles</h2>
                <div class="posts-grid">
                    ${features.map((topic, index) => `
                    <article class="post-card">
                        <div class="post-image small"></div>
                        <div class="post-content">
                            <span class="post-category">Blog</span>
                            <h3>${topic}</h3>
                            <p>Exploring insights and perspectives on ${topic.toLowerCase()}. A deep dive into what matters most.</p>
                            <div class="post-meta">
                                <span class="post-date">January ${10 + index}, 2024</span>
                                <span class="read-time">${3 + index} min read</span>
                            </div>
                        </div>
                    </article>
                    `).join('')}
                </div>
            </div>
        </section>

        <section id="about" class="about">
            <div class="container">
                <h2>About ${title}</h2>
                <p>We believe in the power of great content to inform, inspire, and connect people. Our blog is a space for sharing knowledge, experiences, and insights that matter.</p>
            </div>
        </section>

        <section class="newsletter">
            <div class="container">
                <h2>Stay Updated</h2>
                <p>Subscribe to get our latest articles delivered straight to your inbox.</p>
                <form class="newsletter-form">
                    <input type="email" placeholder="Enter your email" required>
                    <button type="submit">Subscribe</button>
                </form>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${title}</h3>
                    <p>Quality content that matters.</p>
                </div>
                <div class="footer-section">
                    <h4>Categories</h4>
                    <ul>
                        ${features.slice(0, 4).map(category => `<li><a href="#">${category}</a></li>`).join('')}
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Connect</h4>
                    <ul>
                        <li><a href="#">Twitter</a></li>
                        <li><a href="#">LinkedIn</a></li>
                        <li><a href="#">RSS</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ${title}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`,

    'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Georgia', serif;
    line-height: 1.6;
    color: #2d3748;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background: #fff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.logo {
    font-size: 1.8rem;
    font-weight: bold;
    color: #e53e3e;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #4a5568;
    font-weight: 500;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #e53e3e;
}

.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    padding: 8rem 0 4rem;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    font-weight: 400;
}

.hero-subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    font-style: italic;
}

.featured-post {
    padding: 4rem 0;
    background: #f7fafc;
}

.post-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.post-card:hover {
    transform: translateY(-5px);
}

.post-card.featured {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
}

.post-image {
    height: 250px;
    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
    position: relative;
}

.post-image.small {
    height: 180px;
}

.post-content {
    padding: 2rem;
}

.post-category {
    display: inline-block;
    background: #e53e3e;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.post-card h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #2d3748;
}

.post-card h3 {
    font-size: 1.3rem;
    margin-bottom: 0.75rem;
    color: #2d3748;
}

.post-card p {
    color: #718096;
    margin-bottom: 1rem;
}

.post-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: #a0aec0;
}

.recent-posts {
    padding: 4rem 0;
}

.recent-posts h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #2d3748;
}

.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.about {
    background: #f7fafc;
    padding: 4rem 0;
    text-align: center;
}

.about h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: #2d3748;
}

.about p {
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
    color: #4a5568;
}

.newsletter {
    background: #2d3748;
    color: white;
    padding: 4rem 0;
    text-align: center;
}

.newsletter h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.newsletter p {
    margin-bottom: 2rem;
    opacity: 0.9;
}

.newsletter-form {
    display: flex;
    justify-content: center;
    gap: 1rem;
    max-width: 400px;
    margin: 0 auto;
}

.newsletter-form input {
    flex: 1;
    padding: 1rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
}

.newsletter-form button {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
}

.newsletter-form button:hover {
    background: #c53030;
}

footer {
    background: #1a202c;
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
    margin-bottom: 1rem;
    color: #e53e3e;
}

.footer-section ul {
    list-style: none;
}

.footer-section a {
    color: #a0aec0;
    text-decoration: none;
    transition: color 0.3s;
}

.footer-section a:hover {
    color: white;
}

.footer-bottom {
    border-top: 1px solid #4a5568;
    padding-top: 1rem;
    text-align: center;
    color: #a0aec0;
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2rem;
    }
    
    .post-card.featured {
        grid-template-columns: 1fr;
    }
    
    .newsletter-form {
        flex-direction: column;
    }
    
    .nav-menu {
        display: none;
    }
}`,

    'script.js': `document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Newsletter subscription
    document.querySelector('.newsletter-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        alert('Thanks for subscribing! We\\'ll send you our latest articles.');
        this.reset();
    });

    // Add reading progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: #e53e3e;
        z-index: 9999;
        transition: width 0.3s;
    \`;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function() {
        const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrolled + '%';
    });
});`
  };
}

function generateEcommerceTemplate(analysis) {
  const { title, description, features } = analysis;
  
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Online Store</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">${title}</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#products">Products</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <div class="cart-icon">
                <span>🛒</span>
                <span class="cart-count">0</span>
            </div>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="container">
                <div class="hero-content">
                    <h1>${title}</h1>
                    <p>${description}</p>
                    <a href="#products" class="shop-now-btn">Shop Now</a>
                </div>
            </div>
        </section>

        <section class="features">
            <div class="container">
                <div class="features-grid">
                    ${features.map((feature, index) => {
                        const icons = ['🚚', '🔒', '💰', '⭐'];
                        return `
                        <div class="feature-item">
                            <span class="feature-icon">${icons[index] || '✨'}</span>
                            <h3>${feature}</h3>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </section>

        <section id="products" class="products">
            <div class="container">
                <h2>Featured Products</h2>
                <div class="products-grid">
                    <div class="product-card">
                        <div class="product-image"></div>
                        <div class="product-info">
                            <h3>Premium Product</h3>
                            <p class="product-price">$99.99</p>
                            <button class="add-to-cart" data-product="Premium Product" data-price="99.99">Add to Cart</button>
                        </div>
                    </div>
                    <div class="product-card">
                        <div class="product-image"></div>
                        <div class="product-info">
                            <h3>Best Seller</h3>
                            <p class="product-price">$79.99</p>
                            <button class="add-to-cart" data-product="Best Seller" data-price="79.99">Add to Cart</button>
                        </div>
                    </div>
                    <div class="product-card">
                        <div class="product-image"></div>
                        <div class="product-info">
                            <h3>Customer Favorite</h3>
                            <p class="product-price">$129.99</p>
                            <button class="add-to-cart" data-product="Customer Favorite" data-price="129.99">Add to Cart</button>
                        </div>
                    </div>
                    <div class="product-card">
                        <div class="product-image"></div>
                        <div class="product-info">
                            <h3>New Arrival</h3>
                            <p class="product-price">$89.99</p>
                            <button class="add-to-cart" data-product="New Arrival" data-price="89.99">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="about" class="about">
            <div class="container">
                <h2>Why Choose ${title}?</h2>
                <p>We are committed to providing high-quality products and exceptional customer service. Every item in our store is carefully selected to ensure it meets our standards of excellence.</p>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${title}</h3>
                    <p>Quality products for modern life.</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#products">Products</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                        <li><a href="#">Shipping</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Customer Service</h4>
                    <ul>
                        <li><a href="#">Returns</a></li>
                        <li><a href="#">FAQ</a></li>
                        <li><a href="#">Support</a></li>
                        <li><a href="#">Track Order</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ${title}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Cart Modal -->
    <div id="cart-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Shopping Cart</h2>
            <div id="cart-items"></div>
            <div class="cart-total">
                <strong>Total: $<span id="cart-total">0.00</span></strong>
            </div>
            <button class="checkout-btn">Proceed to Checkout</button>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>`,

    'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.logo {
    font-size: 1.8rem;
    font-weight: bold;
    color: #059669;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #059669;
}

.cart-icon {
    position: relative;
    cursor: pointer;
    padding: 0.5rem;
}

.cart-icon span:first-child {
    font-size: 1.5rem;
}

.cart-count {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #dc2626;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
}

.hero {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    padding: 8rem 0 4rem;
    text-align: center;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    font-weight: 700;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.shop-now-btn {
    display: inline-block;
    background: white;
    color: #059669;
    padding: 1rem 2rem;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s;
}

.shop-now-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.features {
    padding: 3rem 0;
    background: #f9fafb;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
}

.feature-item {
    text-align: center;
    padding: 1rem;
}

.feature-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 1rem;
}

.products {
    padding: 5rem 0;
}

.products h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #1f2937;
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.product-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.product-card:hover {
    transform: translateY(-5px);
}

.product-image {
    height: 200px;
    background: linear-gradient(45deg, #10b981, #059669);
    position: relative;
}

.product-info {
    padding: 1.5rem;
    text-align: center;
}

.product-info h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #1f2937;
}

.product-price {
    font-size: 1.5rem;
    font-weight: bold;
    color: #059669;
    margin-bottom: 1rem;
}

.add-to-cart {
    background: #059669;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    width: 100%;
}

.add-to-cart:hover {
    background: #047857;
    transform: translateY(-1px);
}

.about {
    background: #f9fafb;
    padding: 4rem 0;
    text-align: center;
}

.about h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: #1f2937;
}

.about p {
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
    color: #4b5563;
}

footer {
    background: #1f2937;
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
    margin-bottom: 1rem;
    color: #059669;
}

.footer-section ul {
    list-style: none;
}

.footer-section a {
    color: #9ca3af;
    text-decoration: none;
    transition: color 0.3s;
}

.footer-section a:hover {
    color: white;
}

.footer-bottom {
    border-top: 1px solid #374151;
    padding-top: 1rem;
    text-align: center;
    color: #9ca3af;
}

/* Modal Styles */
.modal {
    display: none;
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: white;
    margin: 5% auto;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    position: relative;
}

.close {
    position: absolute;
    right: 1rem;
    top: 1rem;
    font-size: 2rem;
    cursor: pointer;
    color: #9ca3af;
}

.close:hover {
    color: #1f2937;
}

.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #e5e7eb;
}

.cart-total {
    text-align: right;
    margin: 1rem 0;
    font-size: 1.2rem;
}

.checkout-btn {
    background: #059669;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    font-size: 1.1rem;
}

.checkout-btn:hover {
    background: #047857;
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2rem;
    }
    
    .nav-menu {
        display: none;
    }
    
    .products-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
}`,

    'script.js': `document.addEventListener('DOMContentLoaded', function() {
    let cart = [];
    let cartCount = 0;
    let cartTotal = 0;

    // DOM elements
    const cartIcon = document.querySelector('.cart-icon');
    const cartCountElement = document.querySelector('.cart-count');
    const modal = document.getElementById('cart-modal');
    const closeModal = document.querySelector('.close');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');

    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const product = this.getAttribute('data-product');
            const price = parseFloat(this.getAttribute('data-price'));
            
            addToCart(product, price);
            
            // Visual feedback
            this.textContent = 'Added!';
            this.style.background = '#10b981';
            setTimeout(() => {
                this.textContent = 'Add to Cart';
                this.style.background = '#059669';
            }, 1000);
        });
    });

    // Add to cart function
    function addToCart(product, price) {
        const existingItem = cart.find(item => item.product === product);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ product, price, quantity: 1 });
        }
        
        updateCart();
    }

    // Update cart display
    function updateCart() {
        cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cartCountElement.textContent = cartCount;
        cartTotalElement.textContent = cartTotal.toFixed(2);
        
        // Update cart items display
        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = \`
                <div>
                    <strong>\${item.product}</strong><br>
                    $\${item.price.toFixed(2)} x \${item.quantity}
                </div>
                <div>
                    <button onclick="removeFromCart('\${item.product}')">&times;</button>
                </div>
            \`;
            cartItemsContainer.appendChild(cartItem);
        });
    }

    // Remove from cart
    window.removeFromCart = function(product) {
        cart = cart.filter(item => item.product !== product);
        updateCart();
    };

    // Cart modal functionality
    cartIcon.addEventListener('click', function() {
        modal.style.display = 'block';
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Checkout functionality
    document.querySelector('.checkout-btn').addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        alert(\`Thank you for your order! Total: $\${cartTotal.toFixed(2)}\\n\\nThis is a demo store. In a real store, this would redirect to payment processing.\`);
        
        // Clear cart
        cart = [];
        updateCart();
        modal.style.display = 'none';
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});`
  };
}

// Main upload and processing endpoint
app.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read uploaded file
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    // Analyze document
    console.log('📄 Analyzing document...');
    const analysis = analyzeDocument(fileContent);
    
    // Generate website
    console.log('🎨 Generating website...');
    const template = TEMPLATES[analysis.type];
    const websiteFiles = template.generate(analysis);
    
    // Create ZIP file
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const zipFileName = `website-${Date.now()}.zip`;
    const zipFilePath = path.join(outputDir, zipFileName);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    
    // Add files to ZIP
    Object.entries(websiteFiles).forEach(([filename, content]) => {
      archive.append(content, { name: filename });
    });
    
    archive.finalize();
    
    output.on('close', () => {
      console.log('✅ Website generated successfully!');
      res.json({
        success: true,
        analysis,
        downloadUrl: `/download/${zipFileName}`,
        message: 'Website generated successfully!'
      });
    });
    
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Download endpoint
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'output', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (!err) {
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 60000); // Delete after 1 minute
      }
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', templates: Object.keys(TEMPLATES).length });
});

// Main page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document to Website Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 20px;
            text-align: center;
            max-width: 600px;
            margin: 20px;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9; }
        .upload-area {
            border: 3px dashed rgba(255, 255, 255, 0.5);
            border-radius: 15px;
            padding: 3rem;
            margin: 2rem 0;
            cursor: pointer;
            transition: all 0.3s;
        }
        .upload-area:hover { background: rgba(255, 255, 255, 0.1); }
        .upload-area.dragover { 
            border-color: #fff;
            background: rgba(255, 255, 255, 0.2);
        }
        input[type="file"] { display: none; }
        .upload-icon { font-size: 3rem; margin-bottom: 1rem; }
        .upload-text { font-size: 1.2rem; margin-bottom: 0.5rem; }
        .upload-hint { font-size: 0.9rem; opacity: 0.7; }
        .templates { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); 
            gap: 1rem; 
            margin: 2rem 0; 
        }
        .template { 
            background: rgba(255, 255, 255, 0.2); 
            padding: 1rem; 
            border-radius: 10px; 
            font-size: 0.9rem; 
        }
        .result { 
            margin-top: 2rem; 
            padding: 2rem; 
            background: rgba(0, 0, 0, 0.2); 
            border-radius: 15px; 
            display: none; 
        }
        .loading { 
            display: none; 
            margin: 2rem 0; 
        }
        .spinner { 
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .download-btn {
            display: inline-block;
            background: #fff;
            color: #667eea;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            margin-top: 1rem;
            transition: all 0.3s;
        }
        .download-btn:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <h1>📄➡️🌐</h1>
        <h1>Document to Website</h1>
        <p>Upload any document and get a working website in 60 seconds. No sign-up, no complexity, just results.</p>
        
        <div class="templates">
            <div class="template">🤖 Agent Economy</div>
            <div class="template">🎮 Gaming Arena</div>
            <div class="template">🔗 BlameChain Trust</div>
            <div class="template">💬 Chat-to-MVP</div>
            <div class="template">🏗️ Architecture Compactor</div>
        </div>
        
        <form id="uploadForm" enctype="multipart/form-data">
            <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                <div class="upload-icon">📁</div>
                <div class="upload-text">Drop your document here</div>
                <div class="upload-hint">or click to browse (PDF, TXT, MD, DOC)</div>
                <input type="file" id="fileInput" name="document" accept=".pdf,.txt,.md,.doc,.docx">
            </div>
        </form>
        
        <div class="loading">
            <div class="spinner"></div>
            <div>Generating your website...</div>
        </div>
        
        <div class="result">
            <h3>🎉 Your website is ready!</h3>
            <p id="resultText"></p>
            <a id="downloadLink" class="download-btn" href="#" download>Download Website</a>
        </div>
    </div>

    <script>
        const uploadArea = document.querySelector('.upload-area');
        const fileInput = document.getElementById('fileInput');
        const form = document.getElementById('uploadForm');
        const loading = document.querySelector('.loading');
        const result = document.querySelector('.result');
        const resultText = document.getElementById('resultText');
        const downloadLink = document.getElementById('downloadLink');

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleUpload();
            }
        });

        fileInput.addEventListener('change', handleUpload);

        function handleUpload() {
            const file = fileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('document', file);

            loading.style.display = 'block';
            result.style.display = 'none';

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                loading.style.display = 'none';
                
                if (data.success) {
                    result.style.display = 'block';
                    resultText.textContent = \`Generated a \${data.analysis.type} website: "\${data.analysis.title}"\`;
                    downloadLink.href = data.downloadUrl;
                    downloadLink.download = 'website.zip';
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                loading.style.display = 'none';
                alert('Error: ' + error.message);
            });
        }
    </script>
</body>
</html>
  `);
});

// Create required directories
const dirs = ['uploads', 'output', 'public'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 SIMPLE DOCUMENT TO WEBSITE GENERATOR');
  console.log('=======================================');
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📄 Upload any document and get a website instantly`);
  console.log(`🎨 Built-in templates: ${Object.keys(TEMPLATES).join(', ')}`);
  console.log(`💾 No external dependencies, works offline`);
  console.log('');
  console.log('Just go to http://localhost:3000 and upload a document!');
});

module.exports = app;
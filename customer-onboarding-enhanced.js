#!/usr/bin/env node

/**
 * 🎯 SOULFRA CUSTOMER ONBOARDING & GREETING SYSTEM
 * Enhanced onboarding with personalized greetings and brand integration
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/brand-assets', express.static('brand-assets'));

// Import greeting system
const SoulfraGreetingSystem = require('./brand-assets/soulfra-greeting-system.js');
const greeter = new SoulfraGreetingSystem();

// Customer info
let customerInfo = {
    name: null,
    githubUser: null,
    customerId: null,
    setupComplete: false
};

// Get user information from various sources
async function detectUserInfo() {
    try {
        // Try whoami first
        customerInfo.name = execSync('whoami', { encoding: 'utf8' }).trim();
        
        // Try git config
        try {
            const gitName = execSync('git config user.name', { encoding: 'utf8' }).trim();
            if (gitName) customerInfo.name = gitName;
        } catch (e) {}
        
        // Try GitHub auth
        try {
            const ghAuth = execSync('gh auth status', { encoding: 'utf8' });
            const match = ghAuth.match(/Logged in to .+ as ([^\s]+)/);
            if (match) customerInfo.githubUser = match[1];
        } catch (e) {}
        
        // Generate customer ID
        customerInfo.customerId = 'soulfra-' + Date.now().toString(36);
        
        console.log('🔍 Detected user info:', customerInfo);
    } catch (error) {
        console.error('Error detecting user info:', error);
    }
}

// Main onboarding interface
app.get('/', async (req, res) => {
    // Get personalized greeting
    const greeting = await greeter.getGreeting();
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🎯 Soulfra - Welcome!</title>
    <link rel="stylesheet" href="/brand-assets/soulfra-brand.css">
    <link rel="icon" type="image/svg+xml" href="/brand-assets/favicons/favicon.svg">
    <meta name="theme-color" content="#667EEA">
    <style>
        body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: var(--gradient-dark);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .onboarding-container {
            max-width: 800px;
            width: 90%;
            margin: 20px;
        }
        .hero-greeting {
            background: var(--gradient-primary);
            color: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 0 30px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
        }
        .hero-greeting::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.3), transparent);
            animation: sweep 3s linear infinite;
        }
        @keyframes sweep {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .greeting-text {
            font-size: 2rem;
            font-weight: bold;
            margin: 0;
            position: relative;
            z-index: 1;
        }
        .user-name {
            color: var(--soulfra-teal);
            text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .action-card {
            background: rgba(26, 26, 46, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            border-color: var(--soulfra-teal);
        }
        .action-icon {
            font-size: 3rem;
            margin-bottom: 15px;
        }
        .action-title {
            font-size: 1.25rem;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
        }
        .action-desc {
            color: var(--soulfra-gray);
            font-size: 0.9rem;
        }
        .user-info {
            background: rgba(26, 26, 46, 0.6);
            border: 1px solid rgba(102, 126, 234, 0.2);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(102, 126, 234, 0.1);
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .info-label {
            color: var(--soulfra-gray);
        }
        .info-value {
            color: var(--soulfra-purple);
            font-weight: bold;
        }
        .water-effect {
            position: fixed;
            width: 100%;
            height: 3px;
            background: var(--gradient-flow);
            animation: flow 3s linear infinite;
            pointer-events: none;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-left: 10px;
            animation: pulse 2s infinite;
        }
        .status-active {
            background: var(--soulfra-teal);
        }
        .status-inactive {
            background: var(--soulfra-red);
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
        }
    </style>
</head>
<body>
    <div class="water-effect" style="top: 20%;"></div>
    <div class="water-effect" style="top: 50%; animation-delay: 1s;"></div>
    <div class="water-effect" style="top: 80%; animation-delay: 2s;"></div>
    
    <div class="onboarding-container">
        <div class="hero-greeting">
            <p class="greeting-text">${greeting}</p>
        </div>
        
        <div class="user-info">
            <h3 style="color: white; margin-top: 0;">👤 Your Profile</h3>
            <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">${customerInfo.name || 'Unknown'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">GitHub</span>
                <span class="info-value">
                    ${customerInfo.githubUser || 'Not connected'}
                    <span class="status-indicator ${customerInfo.githubUser ? 'status-active' : 'status-inactive'}"></span>
                </span>
            </div>
            <div class="info-item">
                <span class="info-label">Customer ID</span>
                <span class="info-value">${customerInfo.customerId}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Services</span>
                <span class="info-value">
                    Ready to Launch
                    <span class="status-indicator status-active"></span>
                </span>
            </div>
        </div>
        
        <div class="quick-actions">
            <div class="action-card" onclick="window.location.href='/launch'">
                <div class="action-icon">🚀</div>
                <div class="action-title">Launch Platform</div>
                <div class="action-desc">Start all services with one click</div>
            </div>
            
            <div class="action-card" onclick="window.location.href='/brand-assets/'">
                <div class="action-icon">🎨</div>
                <div class="action-title">Brand Assets</div>
                <div class="action-desc">Logos, colors, and templates</div>
            </div>
            
            <div class="action-card" onclick="window.location.href='/docs'">
                <div class="action-icon">📚</div>
                <div class="action-title">Documentation</div>
                <div class="action-desc">Guides and API reference</div>
            </div>
            
            <div class="action-card" onclick="window.location.href='/streaming'">
                <div class="action-icon">🎬</div>
                <div class="action-title">Go Live</div>
                <div class="action-desc">Start streaming now</div>
            </div>
            
            <div class="action-card" onclick="window.location.href='/analytics'">
                <div class="action-icon">📊</div>
                <div class="action-title">Analytics</div>
                <div class="action-desc">Track your performance</div>
            </div>
            
            <div class="action-card" onclick="window.location.href='/settings'">
                <div class="action-icon">⚙️</div>
                <div class="action-title">Settings</div>
                <div class="action-desc">Configure your platform</div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: var(--soulfra-gray);">
            <p>Need help? Join our community or check the docs</p>
            <p style="font-size: 0.9rem;">💜 Stream Your Soul, Share Your Journey</p>
        </div>
    </div>
</body>
</html>
    `);
});

// Launch endpoint
app.get('/launch', async (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🚀 Launching Soulfra...</title>
    <link rel="stylesheet" href="/brand-assets/soulfra-brand.css">
    <link rel="icon" type="image/svg+xml" href="/brand-assets/favicons/favicon.svg">
    <style>
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            background: var(--gradient-dark);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: var(--font-ui);
        }
        .launch-container {
            text-align: center;
        }
        .rocket {
            font-size: 5rem;
            animation: launch 2s ease-in-out infinite;
        }
        @keyframes launch {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        .progress-bar {
            width: 400px;
            height: 30px;
            background: rgba(26, 26, 46, 0.6);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 15px;
            overflow: hidden;
            margin: 30px auto;
        }
        .progress-fill {
            height: 100%;
            background: var(--gradient-primary);
            width: 0%;
            animation: load 3s ease-out forwards;
        }
        @keyframes load {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        .status-text {
            color: var(--soulfra-teal);
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="launch-container">
        <div class="rocket">🚀</div>
        <h1>Launching Your Soulfra Platform</h1>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <div class="status-text">Initializing services...</div>
    </div>
    
    <script>
        const statuses = [
            'Starting Docker containers...',
            'Initializing database...',
            'Loading AI models...',
            'Configuring streaming services...',
            'Setting up analytics...',
            'Preparing dashboard...',
            'Almost ready...',
            'Launch complete! 🎉'
        ];
        
        let currentStatus = 0;
        const statusElement = document.querySelector('.status-text');
        
        const interval = setInterval(() => {
            if (currentStatus < statuses.length) {
                statusElement.textContent = statuses[currentStatus];
                currentStatus++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    window.location.href = 'http://localhost:8080';
                }, 1000);
            }
        }, 400);
    </script>
</body>
</html>
    `);
});

// API endpoints
app.get('/api/greeting', async (req, res) => {
    const greeting = await greeter.getGreeting();
    res.json({ greeting, customerInfo });
});

app.get('/api/customer-info', (req, res) => {
    res.json(customerInfo);
});

// Start server
const PORT = process.env.PORT || 3020;

async function start() {
    // Detect user info on startup
    await detectUserInfo();
    
    // Greet in terminal
    await greeter.greetInTerminal();
    
    app.listen(PORT, () => {
        console.log(`
🎯 SOULFRA CUSTOMER ONBOARDING
✅ Service running at http://localhost:${PORT}
🎨 Brand assets available at http://localhost:${PORT}/brand-assets/
👤 Detected user: ${customerInfo.name}
🆔 Customer ID: ${customerInfo.customerId}

💜 Welcome to Soulfra - Stream Your Soul, Share Your Journey!
        `);
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Thank you for using Soulfra!');
    process.exit(0);
});

// Start the service
start().catch(console.error);
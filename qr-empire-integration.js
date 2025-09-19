#!/usr/bin/env node

/**
 * QR EMPIRE INTEGRATION
 * Generate QR codes for empire components that work in mobile browsers
 * Your brother and friends can scan these to join/interact with your empire
 */

const express = require('express');
const QRCode = require('qrcode');
const app = express();

console.log('📱 QR EMPIRE INTEGRATION SYSTEM\n');

class QREmpireSystem {
  constructor() {
    this.app = express();
    this.empireComponents = new Map();
    this.activeScans = new Map();
    
    // Your actual empire systems
    this.empireTypes = {
      'agent-system': {
        reward: 5000,
        description: 'AI Agent Network Node',
        emoji: '🤖',
        file: 'AGENT-BLOCKCHAIN.js'
      },
      'crypto-wallet': {
        reward: 10000,
        description: 'Crypto Mining Operation',
        emoji: '💎',
        file: 'bitcoin-blamechain-analyzer.js'
      },
      'gaming-platform': {
        reward: 7500,
        description: 'Gaming Tycoon Platform',
        emoji: '🎮',
        file: 'MAXIMUM-TYCOON-EXPANSION-ARCHITECTURE.js'
      },
      'revenue-engine': {
        reward: 15000,
        description: 'Automated Revenue System',
        emoji: '💰',
        file: 'AUTOMATED-REVENUE-MONETIZATION-ENGINE.js'
      },
      'friend-empire': {
        reward: 2500,
        description: 'Connect to Friend\'s Empire',
        emoji: '👥',
        action: 'connect_friend'
      }
    };
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('.'));
    
    // Generate QR codes for empire components
    this.app.get('/qr/generate/:type', async (req, res) => {
      const { type } = req.params;
      const component = this.empireTypes[type];
      
      if (!component) {
        return res.status(404).json({ error: 'Unknown empire component' });
      }
      
      // Create unique code
      const empireCode = `shiprekt-${type}-${Date.now()}`;
      
      // Store the component
      this.empireComponents.set(empireCode, {
        type,
        ...component,
        created: new Date(),
        scanned: false
      });
      
      // Generate QR code URL
      const qrUrl = `${req.protocol}://${req.get('host')}/qr/scan/${empireCode}`;
      
      try {
        // Generate QR code image
        const qrDataURL = await QRCode.toDataURL(qrUrl, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 256
        });
        
        res.json({
          success: true,
          type,
          code: empireCode,
          qrImage: qrDataURL,
          scanUrl: qrUrl,
          component
        });
        
        console.log(`📱 Generated QR for ${type}: ${empireCode}`);
        
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate QR code' });
      }
    });
    
    // Scan QR code endpoint (mobile browsers hit this)
    this.app.get('/qr/scan/:code', (req, res) => {
      const { code } = req.params;
      const component = this.empireComponents.get(code);
      
      if (!component) {
        return res.send(this.getErrorPage('Invalid empire code'));
      }
      
      if (component.scanned) {
        return res.send(this.getErrorPage('Code already claimed'));
      }
      
      // Mark as scanned
      component.scanned = true;
      component.scannedAt = new Date();
      
      // Return mobile-friendly claim page
      res.send(this.getClaimPage(component, code));
      
      console.log(`✅ Code scanned: ${code} (${component.type})`);
    });
    
    // API for claiming rewards
    this.app.post('/qr/claim/:code', (req, res) => {
      const { code } = req.params;
      const { playerId } = req.body;
      const component = this.empireComponents.get(code);
      
      if (!component || !component.scanned) {
        return res.status(404).json({ error: 'Invalid or unscanned code' });
      }
      
      // Process the claim
      const reward = {
        playerId: playerId || 'anonymous',
        type: component.type,
        reward: component.reward,
        description: component.description,
        emoji: component.emoji,
        timestamp: new Date()
      };
      
      res.json({
        success: true,
        claimed: true,
        ...reward,
        message: `${component.emoji} ${component.description} added to your empire!`
      });
      
      console.log(`🎉 Reward claimed: ${component.emoji} +$${component.reward}`);
    });
    
    // Dashboard for generating codes
    this.app.get('/', (req, res) => {
      res.send(this.getDashboard());
    });
    
    // API to get all active codes
    this.app.get('/api/codes', (req, res) => {
      const codes = Array.from(this.empireComponents.entries()).map(([code, data]) => ({
        code,
        ...data
      }));
      
      res.json({ codes });
    });
  }
  
  getDashboard() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>📱 QR Empire Generator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: -apple-system, monospace;
            background: #000;
            color: #00ff00;
            padding: 20px;
            text-align: center;
        }
        .empire-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        .empire-card {
            background: rgba(0,255,0,0.1);
            border: 2px solid #00ff00;
            padding: 20px;
            border-radius: 10px;
        }
        button {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 15px 25px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }
        .qr-result {
            margin: 20px 0;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        .qr-image {
            background: white;
            padding: 10px;
            border-radius: 10px;
            display: inline-block;
            margin: 10px;
        }
    </style>
</head>
<body>
    <h1>📱 QR EMPIRE GENERATOR</h1>
    <p>Generate QR codes for your empire components</p>
    <p style="color: #FFD700;">Share these with your brother and friends!</p>
    
    <div class="empire-grid">
        ${Object.entries(this.empireTypes).map(([type, data]) => `
            <div class="empire-card">
                <h3>${data.emoji} ${data.description}</h3>
                <p>Reward: $${data.reward.toLocaleString()}</p>
                <button onclick="generateQR('${type}')">Generate QR Code</button>
                <div id="qr-${type}"></div>
            </div>
        `).join('')}
    </div>
    
    <div class="empire-card">
        <h3>📊 Generated Codes</h3>
        <button onclick="showActiveCodes()">Show All Active Codes</button>
        <div id="active-codes"></div>
    </div>
    
    <script>
        async function generateQR(type) {
            const response = await fetch('/qr/generate/' + type);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('qr-' + type).innerHTML = \`
                    <div class="qr-result">
                        <h4>✅ QR Code Generated!</h4>
                        <div class="qr-image">
                            <img src="\${data.qrImage}" alt="QR Code" style="width: 200px; height: 200px;">
                        </div>
                        <p><strong>Code:</strong> \${data.code}</p>
                        <p><strong>URL:</strong> \${data.scanUrl}</p>
                        <button onclick="shareQR('\${data.scanUrl}', '\${data.component.description}')">📤 Share</button>
                    </div>
                \`;
            }
        }
        
        async function shareQR(url, description) {
            if (navigator.share) {
                await navigator.share({
                    title: '📱 Join My Empire!',
                    text: 'Scan this QR code to claim: ' + description,
                    url: url
                });
            } else {
                navigator.clipboard.writeText(url);
                alert('📋 Link copied! Share it with your friends!');
            }
        }
        
        async function showActiveCodes() {
            const response = await fetch('/api/codes');
            const data = await response.json();
            
            document.getElementById('active-codes').innerHTML = \`
                <div style="text-align: left; margin-top: 20px;">
                    <h4>Active Codes:</h4>
                    \${data.codes.map(code => \`
                        <div style="margin: 10px 0; padding: 10px; background: rgba(0,255,0,0.05); border-radius: 5px;">
                            <strong>\${code.emoji} \${code.description}</strong><br>
                            Code: \${code.code}<br>
                            Status: \${code.scanned ? '✅ Claimed' : '⏳ Waiting'}<br>
                            Created: \${new Date(code.created).toLocaleString()}
                        </div>
                    \`).join('')}
                </div>
            \`;
        }
    </script>
</body>
</html>
    `;
  }
  
  getClaimPage(component, code) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🎉 Empire Component Found!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #000 0%, #001100 100%);
            color: #00ff00;
            text-align: center;
            padding: 20px;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .claim-card {
            background: rgba(0,255,0,0.1);
            border: 3px solid #00ff00;
            border-radius: 20px;
            padding: 40px;
            margin: 20px auto;
            max-width: 400px;
            box-shadow: 0 0 30px rgba(0,255,0,0.3);
        }
        .emoji { font-size: 80px; margin: 20px 0; }
        .reward { color: #FFD700; font-size: 36px; font-weight: bold; margin: 20px 0; }
        button {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 20px 40px;
            font-size: 20px;
            font-weight: bold;
            border-radius: 25px;
            cursor: pointer;
            margin: 20px 10px;
            transition: all 0.3s;
        }
        button:hover {
            background: #00cc00;
            transform: scale(1.05);
        }
        .description { font-size: 24px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="claim-card">
        <div class="emoji">${component.emoji}</div>
        <h1>Empire Component Found!</h1>
        <div class="description">${component.description}</div>
        <div class="reward">+$${component.reward.toLocaleString()}</div>
        
        <button onclick="claimReward()">🎉 Claim Reward</button>
        <button onclick="openInShipRekt()">🚢 Open in ShipRekt</button>
        
        <div id="result"></div>
    </div>
    
    <script>
        async function claimReward() {
            const response = await fetch('/qr/claim/${code}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: 'mobile-user-' + Date.now() })
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('result').innerHTML = \`
                    <div style="margin-top: 30px; padding: 20px; background: rgba(0,255,0,0.2); border-radius: 10px;">
                        <h3>✅ Claimed Successfully!</h3>
                        <p>\${data.message}</p>
                        <p>Added to your empire value!</p>
                    </div>
                \`;
                
                // Vibrate if supported
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                }
            }
        }
        
        function openInShipRekt() {
            // Try to open in the PWA, fallback to web
            const shipRektUrl = './shiprekt-mobile-pwa.html?claimed=${code}';
            window.location.href = shipRektUrl;
        }
        
        // Auto-claim after 3 seconds if user doesn't click
        setTimeout(() => {
            if (!document.getElementById('result').innerHTML) {
                claimReward();
            }
        }, 3000);
    </script>
</body>
</html>
    `;
  }
  
  getErrorPage(message) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>❌ Empire Code Error</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #000;
            color: #ff0000;
            text-align: center;
            padding: 40px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .error-card {
            background: rgba(255,0,0,0.1);
            border: 2px solid #ff0000;
            border-radius: 20px;
            padding: 40px;
            margin: 20px auto;
            max-width: 400px;
        }
    </style>
</head>
<body>
    <div class="error-card">
        <h1>❌ ${message}</h1>
        <p>This empire code is not valid or has already been claimed.</p>
        <button onclick="history.back()" style="background: #ff0000; color: white; border: none; padding: 15px 25px; border-radius: 10px; margin-top: 20px;">
            ⬅️ Go Back
        </button>
    </div>
</body>
</html>
    `;
  }
  
  start(port = 6969) {
    this.app.listen(port, () => {
      console.log(`📱 QR Empire System: http://localhost:${port}`);
      console.log('\n🎯 Generate QR codes for your empire components!');
      console.log('💡 Share with your brother and friends to let them claim rewards!');
      console.log('\n📱 Mobile-optimized for Snapchat sharing!\n');
    });
  }
}

// Launch the QR Empire system
const qrEmpire = new QREmpireSystem();
qrEmpire.start(6969);

module.exports = QREmpireSystem;
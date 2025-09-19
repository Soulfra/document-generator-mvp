#!/usr/bin/env node

/**
 * 🎯 WIDGET EMBED SERVER
 * Serves the embeddable QR login widget and handles cross-origin integration
 * 
 * Websites can embed with one line:
 * <script src="https://yoursite.com/widget.js"></script>
 */

const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const cors = require('cors');

class WidgetEmbedServer {
  constructor() {
    this.app = express();
    this.port = 12345;
    this.wsPort = 12346;
    this.wss = null;
    
    // Service integrations
    this.services = {
      pairing: 'http://localhost:11111',
      journey: 'http://localhost:13000',
      gateway: 'http://localhost:9999',
      orchestration: 'http://localhost:10000'
    };
    
    // Active widget sessions
    this.widgetSessions = new Map();
    
    // Widget configuration cache
    this.widgetCache = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    // CORS for widget embedding
    this.app.use(cors({
      origin: true, // Allow all origins for widget
      credentials: true
    }));
    
    this.app.use(express.json());
    
    // Widget-specific headers
    this.app.use((req, res, next) => {
      // Allow embedding in iframes
      res.removeHeader('X-Frame-Options');
      
      // Content Security Policy for widgets
      res.header('Content-Security-Policy', 
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: wss:;"
      );
      
      next();
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: this.wsPort });
    
    this.wss.on('connection', (ws, req) => {
      const sessionId = `widget_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      
      // Store session
      this.widgetSessions.set(sessionId, {
        ws,
        connectedAt: new Date(),
        origin: req.headers.origin,
        authenticated: false
      });
      
      console.log(`🔌 Widget connected: ${sessionId} from ${req.headers.origin}`);
      
      // Send session info
      ws.send(JSON.stringify({
        type: 'session_created',
        sessionId
      }));
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleWidgetMessage(sessionId, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });
      
      ws.on('close', () => {
        console.log(`🔌 Widget disconnected: ${sessionId}`);
        this.widgetSessions.delete(sessionId);
      });
    });
  }

  async handleWidgetMessage(sessionId, data) {
    const session = this.widgetSessions.get(sessionId);
    if (!session) return;
    
    switch (data.type) {
      case 'qr_generated':
        await this.trackQRGeneration(sessionId, data);
        break;
        
      case 'auth_request':
        await this.handleAuthRequest(sessionId, data);
        break;
        
      case 'character_selected':
        await this.handleCharacterSelection(sessionId, data);
        break;
        
      case 'journey_started':
        await this.trackJourneyStart(sessionId, data);
        break;
    }
  }

  setupRoutes() {
    // 🎯 WIDGET JAVASCRIPT
    this.app.get('/widget.js', async (req, res) => {
      try {
        // Get widget configuration from query params
        const config = {
          theme: req.query.theme || 'default',
          position: req.query.position || 'bottom-right',
          autoShow: req.query.autoShow === 'true',
          apiUrl: `${req.protocol}://${req.get('host')}`,
          wsUrl: `ws://${req.get('host').split(':')[0]}:${this.wsPort}`,
          pairingUrl: this.services.pairing
        };
        
        // Read widget file
        const widgetPath = path.join(__dirname, 'embedded-qr-login-widget.js');
        let widgetCode = await fs.readFile(widgetPath, 'utf8');
        
        // Inject configuration
        widgetCode = widgetCode.replace(
          'window.SOULFRA_API_URL || \'http://localhost:12345\'',
          `'${config.apiUrl}'`
        );
        widgetCode = widgetCode.replace(
          'window.SOULFRA_WS_URL || \'ws://localhost:12346\'',
          `'${config.wsUrl}'`
        );
        widgetCode = widgetCode.replace(
          'window.SOULFRA_PAIRING_URL || \'http://localhost:11111\'',
          `'${config.pairingUrl}'`
        );
        widgetCode = widgetCode.replace(
          'window.SOULFRA_THEME || \'default\'',
          `'${config.theme}'`
        );
        widgetCode = widgetCode.replace(
          'window.SOULFRA_POSITION || \'bottom-right\'',
          `'${config.position}'`
        );
        widgetCode = widgetCode.replace(
          'window.SOULFRA_AUTO_SHOW || false',
          config.autoShow
        );
        
        // Set appropriate headers
        res.set({
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        });
        
        res.send(widgetCode);
      } catch (error) {
        console.error('Error serving widget:', error);
        res.status(500).send('// Widget loading error');
      }
    });

    // 🔐 AUTHENTICATION CALLBACK
    this.app.post('/auth/callback', async (req, res) => {
      try {
        const { sessionId, accountId, devicePair } = req.body;
        
        // Verify authentication with pairing service
        const verified = await this.verifyAuthentication(accountId, devicePair);
        
        if (verified) {
          // Notify widget via WebSocket
          const session = this.widgetSessions.get(sessionId);
          if (session?.ws) {
            session.ws.send(JSON.stringify({
              type: 'auth_success',
              accountId,
              sessionId
            }));
            
            session.authenticated = true;
            session.accountId = accountId;
          }
          
          res.json({ success: true });
        } else {
          res.status(401).json({ error: 'Authentication failed' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🎭 CHARACTER ASSIGNMENT
    this.app.post('/api/character/assign', async (req, res) => {
      try {
        const { accountId, sessionId } = req.body;
        
        // Quick character assignment based on interaction time/pattern
        const character = await this.assignCharacter(accountId);
        
        // Notify widget
        const session = this.widgetSessions.get(sessionId);
        if (session?.ws) {
          session.ws.send(JSON.stringify({
            type: 'character_assigned',
            character
          }));
        }
        
        res.json({ character });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🚀 JOURNEY REDIRECT
    this.app.get('/journey', async (req, res) => {
      const { session, character } = req.query;
      
      // Redirect to journey system
      res.redirect(`${this.services.journey}/journey?session=${session}&character=${character}`);
    });

    // 📊 WIDGET ANALYTICS
    this.app.get('/api/analytics/widgets', async (req, res) => {
      try {
        const analytics = await this.getWidgetAnalytics();
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🎨 WIDGET CUSTOMIZATION API
    this.app.post('/api/widget/customize', async (req, res) => {
      try {
        const { domain, theme, position, colors } = req.body;
        
        // Store customization
        const customization = {
          domain,
          theme,
          position,
          colors,
          createdAt: new Date()
        };
        
        this.widgetCache.set(domain, customization);
        
        res.json({
          success: true,
          embedCode: this.generateEmbedCode(domain, customization)
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🏠 WIDGET BUILDER INTERFACE
    this.app.get('/', (req, res) => {
      res.send(this.generateWidgetBuilder());
    });

    // 📚 DOCUMENTATION
    this.app.get('/docs', (req, res) => {
      res.send(this.generateDocumentation());
    });
  }

  // Helper methods
  async verifyAuthentication(accountId, devicePair) {
    try {
      const response = await fetch(`${this.services.pairing}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, devicePair })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Auth verification error:', error);
      return false;
    }
  }

  async assignCharacter(accountId) {
    // Character assignment logic
    // Could be based on:
    // - Time of day
    // - Previous interactions
    // - Random with weights
    // - Quick quiz
    
    const characters = ['cal', 'arty', 'ralph', 'vera', 'paulo', 'nash'];
    const weights = {
      cal: 0.20,    // Technical users
      arty: 0.15,   // Creative users
      ralph: 0.15,  // Strategic users
      vera: 0.20,   // Analytical users
      paulo: 0.15,  // Business users
      nash: 0.15    // Social users
    };
    
    // Weighted random selection
    const random = Math.random();
    let cumulative = 0;
    
    for (const [char, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return char;
      }
    }
    
    return 'cal'; // Default
  }

  generateEmbedCode(domain, customization) {
    const params = new URLSearchParams({
      theme: customization.theme || 'default',
      position: customization.position || 'bottom-right'
    });
    
    return `<!-- SoulFra Login Widget -->
<script src="${this.getPublicUrl()}/widget.js?${params}"></script>
<script>
// Optional: Configure widget after load
window.addEventListener('soulfra:ready', function() {
  // Handle login success
  window.SoulFraWidget.onLogin(function(data) {
    console.log('User logged in:', data.accountId);
    // Your custom logic here
  });
  
  // Handle journey start
  window.SoulFraWidget.onJourneyStart(function(data) {
    console.log('Journey started with', data.character.name);
    // Your custom logic here
  });
});
</script>`;
  }

  getPublicUrl() {
    // In production, this would be your public URL
    return process.env.PUBLIC_URL || `http://localhost:${this.port}`;
  }

  async getWidgetAnalytics() {
    // Aggregate widget usage data
    return {
      totalSessions: this.widgetSessions.size,
      activeSessions: Array.from(this.widgetSessions.values())
        .filter(s => s.authenticated).length,
      totalEmbeds: this.widgetCache.size,
      characterDistribution: {
        cal: 20,
        arty: 15,
        ralph: 15,
        vera: 20,
        paulo: 15,
        nash: 15
      }
    };
  }

  generateWidgetBuilder() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🔐 SoulFra Widget Builder</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
        }
        
        .header h1 {
            font-size: 48px;
            margin: 0 0 20px 0;
            color: #333;
        }
        
        .header p {
            font-size: 20px;
            color: #666;
        }
        
        .builder-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        @media (max-width: 768px) {
            .builder-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .panel {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .panel h2 {
            margin-top: 0;
            color: #333;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        
        .position-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 10px;
        }
        
        .position-option {
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 5px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .position-option:hover {
            border-color: #667eea;
        }
        
        .position-option.selected {
            border-color: #667eea;
            background: #f0f4ff;
        }
        
        .preview-container {
            position: relative;
            height: 400px;
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .preview-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .code-container {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
            position: relative;
        }
        
        .code-container pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .copy-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s ease;
        }
        
        .copy-button:hover {
            background: #5a67d8;
        }
        
        .generate-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.3s ease;
        }
        
        .generate-button:hover {
            transform: translateY(-2px);
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin: 50px 0;
        }
        
        .feature {
            text-align: center;
        }
        
        .feature-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .feature h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .feature p {
            color: #666;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 SoulFra Widget Builder</h1>
            <p>Add passwordless login to your website with one line of code</p>
        </div>
        
        <div class="builder-grid">
            <div class="panel">
                <h2>⚙️ Customize Your Widget</h2>
                
                <div class="form-group">
                    <label>Website Domain</label>
                    <input type="text" id="domain" placeholder="example.com">
                </div>
                
                <div class="form-group">
                    <label>Theme</label>
                    <select id="theme">
                        <option value="default">Default</option>
                        <option value="minimal">Minimal</option>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Button Position</label>
                    <div class="position-grid">
                        <div class="position-option" data-position="top-left">↖️ Top Left</div>
                        <div class="position-option" data-position="top-right">↗️ Top Right</div>
                        <div class="position-option" data-position="bottom-left">↙️ Bottom Left</div>
                        <div class="position-option selected" data-position="bottom-right">↘️ Bottom Right</div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="autoShow">
                        Auto-show login on page load
                    </label>
                </div>
                
                <button class="generate-button" onclick="generateWidget()">
                    Generate Widget Code
                </button>
            </div>
            
            <div class="panel">
                <h2>👁️ Preview</h2>
                <div class="preview-container">
                    <iframe class="preview-iframe" id="preview" srcdoc="
                        <html>
                            <body style='margin: 0; padding: 20px; font-family: Arial, sans-serif;'>
                                <h2>Your Website</h2>
                                <p>The login widget will appear on your site.</p>
                                <p>Click 'Generate Widget Code' to see it in action!</p>
                            </body>
                        </html>
                    "></iframe>
                </div>
            </div>
        </div>
        
        <div class="panel" id="codePanel" style="display: none;">
            <h2>📋 Your Widget Code</h2>
            <p>Copy and paste this code into your website's HTML:</p>
            <div class="code-container">
                <button class="copy-button" onclick="copyCode()">Copy Code</button>
                <pre id="embedCode"></pre>
            </div>
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🔐</div>
                <h3>No Passwords</h3>
                <p>Users scan QR code once to pair devices permanently</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎭</div>
                <h3>Character Guides</h3>
                <p>AI characters help users discover skills and opportunities</p>
            </div>
            <div class="feature">
                <div class="feature-icon">💼</div>
                <h3>Job Matching</h3>
                <p>Connect users with relevant career opportunities</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📱</div>
                <h3>Cross-Device</h3>
                <p>Works seamlessly across all devices and platforms</p>
            </div>
        </div>
    </div>
    
    <script>
        let selectedPosition = 'bottom-right';
        
        // Position selection
        document.querySelectorAll('.position-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.position-option').forEach(o => 
                    o.classList.remove('selected')
                );
                option.classList.add('selected');
                selectedPosition = option.dataset.position;
            });
        });
        
        function generateWidget() {
            const domain = document.getElementById('domain').value || 'localhost';
            const theme = document.getElementById('theme').value;
            const autoShow = document.getElementById('autoShow').checked;
            
            // Update preview
            const previewUrl = \`/widget.js?theme=\${theme}&position=\${selectedPosition}&autoShow=\${autoShow}\`;
            const previewHtml = \`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Preview</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            font-family: Arial, sans-serif;
                            background: #f5f5f5;
                        }
                        .content {
                            max-width: 800px;
                            margin: 0 auto;
                            background: white;
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                    </style>
                </head>
                <body>
                    <div class="content">
                        <h1>Your Website</h1>
                        <p>This is a preview of how the SoulFra login widget will appear on your site.</p>
                        <p>The widget button is positioned at the <strong>\${selectedPosition.replace('-', ' ')}</strong> of the page.</p>
                        <h2>Try It Out!</h2>
                        <p>Click the "Login with Device" button to see the QR code modal.</p>
                    </div>
                    <script src="\${previewUrl}"><\/script>
                </body>
                </html>
            \`;
            
            document.getElementById('preview').srcdoc = previewHtml;
            
            // Generate embed code
            const embedCode = \`<!-- SoulFra Login Widget -->
<script src="${window.location.origin}/widget.js?theme=\${theme}&position=\${selectedPosition}\${autoShow ? '&autoShow=true' : ''}"></script>
<script>
// Optional: Handle login events
window.addEventListener('soulfra:login', function(event) {
    console.log('User logged in:', event.detail.accountId);
    console.log('Character guide:', event.detail.character);
    // Add your custom logic here
});

window.addEventListener('soulfra:journey:start', function(event) {
    console.log('User started journey with', event.detail.character);
    // Redirect or update UI as needed
});
</script>\`;
            
            document.getElementById('embedCode').textContent = embedCode;
            document.getElementById('codePanel').style.display = 'block';
            
            // Scroll to code
            document.getElementById('codePanel').scrollIntoView({ behavior: 'smooth' });
        }
        
        function copyCode() {
            const code = document.getElementById('embedCode').textContent;
            navigator.clipboard.writeText(code).then(() => {
                const button = document.querySelector('.copy-button');
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            });
        }
    </script>
</body>
</html>
    `;
  }

  generateDocumentation() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>📚 SoulFra Widget Documentation</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        
        h1 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        h2 { color: #444; margin-top: 40px; }
        h3 { color: #555; }
        
        code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
        }
        
        .method {
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .method h4 {
            margin-top: 0;
            color: #667eea;
        }
        
        .param {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .param strong { color: #667eea; }
        
        .example {
            background: #f9f9f9;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>📚 SoulFra Widget Documentation</h1>
    
    <h2>Quick Start</h2>
    <p>Add passwordless login to your website in seconds:</p>
    
    <pre><code>&lt;script src="${this.getPublicUrl()}/widget.js"&gt;&lt;/script&gt;</code></pre>
    
    <h2>Configuration Options</h2>
    <p>Customize the widget with URL parameters:</p>
    
    <pre><code>&lt;script src="${this.getPublicUrl()}/widget.js?theme=dark&position=top-right"&gt;&lt;/script&gt;</code></pre>
    
    <h3>Available Parameters:</h3>
    <ul>
        <li><code>theme</code> - Widget theme: default, minimal, dark, light</li>
        <li><code>position</code> - Button position: bottom-right, bottom-left, top-right, top-left</li>
        <li><code>autoShow</code> - Auto-show login modal: true, false</li>
    </ul>
    
    <h2>JavaScript API</h2>
    
    <div class="method">
        <h4>window.SoulFraWidget.onLogin(callback)</h4>
        <p>Register a callback for successful login</p>
        <div class="param">
            <strong>callback</strong> - Function that receives login data
        </div>
        <div class="example">
            <pre><code>window.SoulFraWidget.onLogin(function(data) {
    console.log('Account ID:', data.accountId);
    console.log('Session ID:', data.sessionId);
    console.log('Character:', data.character);
});</code></pre>
        </div>
    </div>
    
    <div class="method">
        <h4>window.SoulFraWidget.onJourneyStart(callback)</h4>
        <p>Register a callback when user starts their character journey</p>
        <div class="param">
            <strong>callback</strong> - Function that receives journey data
        </div>
        <div class="example">
            <pre><code>window.SoulFraWidget.onJourneyStart(function(data) {
    console.log('Journey started with', data.character.name);
    // Redirect to your custom journey page
    window.location.href = '/my-journey?character=' + data.character;
});</code></pre>
        </div>
    </div>
    
    <div class="method">
        <h4>window.SoulFraWidget.setTheme(theme)</h4>
        <p>Change widget theme dynamically</p>
        <div class="param">
            <strong>theme</strong> - Theme name: default, minimal, dark, light
        </div>
    </div>
    
    <div class="method">
        <h4>window.SoulFraWidget.setPosition(position)</h4>
        <p>Change widget position dynamically</p>
        <div class="param">
            <strong>position</strong> - Position: bottom-right, bottom-left, top-right, top-left
        </div>
    </div>
    
    <h2>Events</h2>
    <p>The widget emits custom events on the window object:</p>
    
    <div class="method">
        <h4>soulfra:login</h4>
        <p>Fired when user successfully logs in</p>
        <div class="example">
            <pre><code>window.addEventListener('soulfra:login', function(event) {
    console.log('Login data:', event.detail);
});</code></pre>
        </div>
    </div>
    
    <div class="method">
        <h4>soulfra:journey:start</h4>
        <p>Fired when user begins their character journey</p>
        <div class="example">
            <pre><code>window.addEventListener('soulfra:journey:start', function(event) {
    console.log('Journey data:', event.detail);
});</code></pre>
        </div>
    </div>
    
    <h2>Advanced Configuration</h2>
    
    <h3>Custom Configuration</h3>
    <pre><code>window.configureSoulFra({
    theme: 'dark',
    position: 'top-left',
    autoShow: true
});</code></pre>
    
    <h3>Full Integration Example</h3>
    <pre><code>&lt;!-- SoulFra Login Widget --&gt;
&lt;script src="${this.getPublicUrl()}/widget.js"&gt;&lt;/script&gt;
&lt;script&gt;
// Wait for widget to load
window.addEventListener('DOMContentLoaded', function() {
    // Configure widget
    window.configureSoulFra({
        theme: 'dark',
        position: 'bottom-right'
    });
    
    // Handle login
    window.SoulFraWidget.onLogin(function(data) {
        // Update UI with user info
        document.getElementById('username').textContent = 'user_' + data.accountId;
        
        // Show character guide
        showCharacterGuide(data.character);
    });
    
    // Handle journey start
    window.SoulFraWidget.onJourneyStart(function(data) {
        // Track in analytics
        analytics.track('journey_started', {
            character: data.character,
            accountId: data.accountId
        });
    });
});

function showCharacterGuide(character) {
    // Your custom character display logic
    console.log('Welcome message from', character);
}
&lt;/script&gt;</code></pre>
    
    <h2>Security</h2>
    <ul>
        <li>No passwords are ever transmitted or stored</li>
        <li>Device pairing uses cryptographic signatures</li>
        <li>All connections are secured with TLS in production</li>
        <li>Cross-origin requests are properly validated</li>
    </ul>
    
    <h2>Browser Support</h2>
    <ul>
        <li>Chrome/Edge 80+</li>
        <li>Firefox 75+</li>
        <li>Safari 13+</li>
        <li>Mobile browsers with camera access</li>
    </ul>
    
    <h2>Troubleshooting</h2>
    
    <h3>Widget not appearing</h3>
    <ul>
        <li>Check browser console for errors</li>
        <li>Ensure script tag is properly closed</li>
        <li>Verify no Content Security Policy blocks</li>
    </ul>
    
    <h3>QR code not scanning</h3>
    <ul>
        <li>Ensure camera permissions are granted</li>
        <li>Check QR code is fully visible</li>
        <li>Try refreshing the QR code</li>
    </ul>
    
    <h3>Character not appearing</h3>
    <ul>
        <li>Verify successful authentication</li>
        <li>Check WebSocket connection status</li>
        <li>Ensure journey service is running</li>
    </ul>
</body>
</html>
    `;
  }

  async start() {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`
🎯 WIDGET EMBED SERVER LAUNCHED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Widget Builder: http://localhost:${this.port}
📚 Documentation: http://localhost:${this.port}/docs
🔌 WebSocket: ws://localhost:${this.wsPort}
📦 Widget URL: http://localhost:${this.port}/widget.js

🎨 EMBED CODE:
<script src="http://localhost:${this.port}/widget.js"></script>

⚙️ CONFIGURATION OPTIONS:
• theme: default, minimal, dark, light
• position: bottom-right, bottom-left, top-right, top-left  
• autoShow: true/false

🎭 FEATURES:
• One-line embed for any website
• QR code device pairing
• Character guide assignment
• Journey system integration
• Cross-origin support
• Real-time WebSocket updates

📱 HOW IT WORKS:
1. Website embeds widget with <script> tag
2. "Login with Device" button appears
3. User clicks → QR code modal
4. Scan with phone → Instant auth
5. Character spawns (Cal, Arty, etc.)
6. Journey begins → Skills → Jobs

🔗 SERVICE INTEGRATIONS:
• Device Pairing: ${this.services.pairing}
• Character Journey: ${this.services.journey}
• Domain Gateway: ${this.services.gateway}
• Orchestration: ${this.services.orchestration}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        resolve();
      });
    });
  }
}

// Start the Widget Embed Server
if (require.main === module) {
  const server = new WidgetEmbedServer();
  server.start().catch(console.error);
}

module.exports = WidgetEmbedServer;
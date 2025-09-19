#!/usr/bin/env node

/**
 * 📱 SIMPLE MOBILE TEST
 * Basic mobile interface to verify functionality before adding Tor
 */

const http = require('http');

class SimpleMobileTest {
    constructor(port) {
        this.port = port;
    }
    
    start() {
        const server = http.createServer((req, res) => {
            console.log(`📱 Request: ${req.method} ${req.url}`);
            
            if (req.url === '/') {
                this.serveMobileTest(res);
            } else if (req.url === '/api/test') {
                this.serveTestAPI(res);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`📱 Simple Mobile Test running on port ${this.port}`);
            console.log(`🔗 Open: http://localhost:${this.port}`);
        });
    }
    
    serveMobileTest(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 Mobile Test</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            background: #1a1a2e; 
            color: white; 
            font-family: Arial, sans-serif; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        .service-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
        }
        .service-card { 
            background: rgba(0,255,0,0.2); 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center; 
            cursor: pointer;
            transition: transform 0.2s;
        }
        .service-card:hover { 
            transform: scale(1.05); 
        }
        .service-icon { 
            font-size: 32px; 
            margin-bottom: 10px; 
        }
        .status { 
            margin: 20px 0; 
            padding: 15px; 
            background: rgba(0,255,255,0.2); 
            border-radius: 10px; 
        }
        .live { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>📱 Mobile Gaming Interface</h1>
        <p>Testing basic functionality</p>
        <div class="live">● LIVE</div>
    </div>
    
    <div class="status">
        <h3>🔍 System Status</h3>
        <div id="statusInfo">Loading...</div>
    </div>
    
    <div class="service-grid">
        <div class="service-card" onclick="testService('game')">
            <div class="service-icon">🎮</div>
            <div>Game World</div>
            <small>AI NPCs Active</small>
        </div>
        
        <div class="service-card" onclick="testService('forum')">
            <div class="service-icon">🗣️</div>
            <div>Forums</div>
            <small>Community Chat</small>
        </div>
        
        <div class="service-card" onclick="testService('monitor')">
            <div class="service-icon">📊</div>
            <div>NPC Monitor</div>
            <small>Real-time Data</small>
        </div>
        
        <div class="service-card" onclick="testService('packets')">
            <div class="service-icon">📡</div>
            <div>Network</div>
            <small>Packet Capture</small>
        </div>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
        <button onclick="testAPI()" style="padding: 15px 30px; font-size: 16px; border: none; border-radius: 5px; background: #0f0; color: black; cursor: pointer;">
            Test API Connection
        </button>
    </div>
    
    <div id="testResults" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px; display: none;">
        <h3>🧪 Test Results</h3>
        <div id="results"></div>
    </div>
    
    <script>
        function testService(service) {
            const serviceUrls = {
                game: 'http://localhost:8889',
                forum: 'http://localhost:5555', 
                monitor: 'http://localhost:54322',
                packets: 'http://localhost:54324'
            };
            
            const url = serviceUrls[service];
            document.getElementById('statusInfo').innerHTML = \`
                <strong>Testing \${service}...</strong><br>
                URL: <a href="\${url}" target="_blank" style="color: #0ff;">\${url}</a><br>
                <small>Click link to open in new tab</small>
            \`;
            
            console.log('Testing service:', service, 'at', url);
            
            // Try to fetch to test connectivity
            fetch(url)
                .then(response => {
                    document.getElementById('statusInfo').innerHTML += \`<br>✅ Service accessible (Status: \${response.status})\`;
                })
                .catch(error => {
                    document.getElementById('statusInfo').innerHTML += \`<br>❌ Service unavailable: \${error.message}\`;
                });
        }
        
        async function testAPI() {
            try {
                const response = await fetch('/api/test');
                const data = await response.json();
                
                document.getElementById('testResults').style.display = 'block';
                document.getElementById('results').innerHTML = \`
                    <div style="color: #0f0;">✅ API Test Successful</div>
                    <pre style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; margin-top: 10px;">\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                document.getElementById('testResults').style.display = 'block';
                document.getElementById('results').innerHTML = \`
                    <div style="color: #f00;">❌ API Test Failed</div>
                    <div>Error: \${error.message}</div>
                \`;
            }
        }
        
        // Auto-update status
        function updateStatus() {
            const timestamp = new Date().toLocaleTimeString();
            document.querySelector('.live').textContent = \`● LIVE (\${timestamp})\`;
        }
        
        setInterval(updateStatus, 1000);
        updateStatus();
        
        console.log('📱 Mobile test interface loaded');
        console.log('Available services:', {
            game: 'http://localhost:8889',
            forum: 'http://localhost:5555',
            monitor: 'http://localhost:54322',
            packets: 'http://localhost:54324'
        });
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveTestAPI(res) {
        const testData = {
            status: 'success',
            timestamp: Date.now(),
            services: {
                game: { port: 8889, status: 'unknown' },
                forum: { port: 5555, status: 'unknown' },
                monitor: { port: 54322, status: 'unknown' },
                packets: { port: 54324, status: 'unknown' }
            },
            message: 'Mobile interface test API working'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(testData));
    }
}

// Start the simple test
const test = new SimpleMobileTest(3333);
test.start();

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down mobile test...');
    process.exit(0);
});
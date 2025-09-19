#!/usr/bin/env node
// PACKET-UNPACKER.js - Simple packet unpacker for desktop/electron/phone communication

const crypto = require('crypto');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');

class DigitalPostOffice {
    constructor() {
        this.packets = new Map();
        this.connections = new Map();
        this.port = 5555;
        
        console.log('📮 DIGITAL POST OFFICE INITIALIZED');
        console.log('📦 Ready to unpack packets between:');
        console.log('   💻 Desktop Terminal');
        console.log('   ⚡ Electron App');
        console.log('   📱 Phone PWA');
    }

    // Create a packet (like putting mail in envelope)
    packPacket(data, from, to) {
        const packet = {
            id: crypto.randomBytes(8).toString('hex'),
            from: from,
            to: to,
            timestamp: Date.now(),
            data: data,
            checksum: this.calculateChecksum(data)
        };
        
        // Encrypt if needed
        if (data.encrypted) {
            packet.envelope = this.encrypt(JSON.stringify(data));
        } else {
            packet.envelope = Buffer.from(JSON.stringify(data)).toString('base64');
        }
        
        return packet;
    }

    // Unpack a packet (like opening mail)
    unpackPacket(packet) {
        console.log('\n📬 UNPACKING PACKET:');
        console.log(`   📮 ID: ${packet.id}`);
        console.log(`   👤 From: ${packet.from}`);
        console.log(`   📍 To: ${packet.to}`);
        console.log(`   ⏰ Time: ${new Date(packet.timestamp).toISOString()}`);
        
        try {
            // Verify checksum
            const data = packet.envelope.includes('encrypted') 
                ? this.decrypt(packet.envelope)
                : JSON.parse(Buffer.from(packet.envelope, 'base64').toString());
            
            const validChecksum = this.calculateChecksum(data) === packet.checksum;
            console.log(`   ✅ Checksum: ${validChecksum ? 'VALID' : 'INVALID'}`);
            
            if (!validChecksum) {
                throw new Error('Packet corrupted in transit!');
            }
            
            console.log(`   📄 Type: ${data.type || 'unknown'}`);
            console.log(`   📏 Size: ${JSON.stringify(data).length} bytes`);
            
            return {
                success: true,
                data: data,
                metadata: {
                    id: packet.id,
                    from: packet.from,
                    to: packet.to,
                    timestamp: packet.timestamp
                }
            };
        } catch (error) {
            console.error(`   ❌ Error unpacking: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Calculate checksum for integrity
    calculateChecksum(data) {
        return crypto.createHash('md5')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 8);
    }

    // Simple encryption
    encrypt(text) {
        const key = crypto.scryptSync('packet-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return JSON.stringify({
            encrypted: true,
            iv: iv.toString('hex'),
            data: encrypted
        });
    }

    // Simple decryption
    decrypt(encryptedPacket) {
        const packet = JSON.parse(encryptedPacket);
        const key = crypto.scryptSync('packet-key', 'salt', 32);
        const iv = Buffer.from(packet.iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        let decrypted = decipher.update(packet.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    // Start WebSocket server for real-time communication
    startPostOffice() {
        // HTTP server for PWA
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getPWAInterface());
            } else if (req.url === '/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    packets: this.packets.size,
                    connections: this.connections.size,
                    uptime: process.uptime()
                }));
            }
        });
        
        // WebSocket server
        const wss = new WebSocket.Server({ server });
        
        wss.on('connection', (ws, req) => {
            const clientId = crypto.randomBytes(4).toString('hex');
            this.connections.set(clientId, ws);
            
            console.log(`\n🔌 New connection: ${clientId}`);
            
            ws.on('message', (message) => {
                try {
                    const packet = JSON.parse(message);
                    console.log(`\n📨 Received packet from ${clientId}`);
                    
                    // Unpack and process
                    const result = this.unpackPacket(packet);
                    
                    if (result.success) {
                        // Route to destination
                        this.routePacket(packet, result.data);
                    }
                    
                    // Send acknowledgment
                    ws.send(JSON.stringify({
                        type: 'ack',
                        packetId: packet.id,
                        status: result.success ? 'delivered' : 'failed'
                    }));
                } catch (error) {
                    console.error('📭 Invalid packet:', error.message);
                }
            });
            
            ws.on('close', () => {
                this.connections.delete(clientId);
                console.log(`\n🔌 Disconnected: ${clientId}`);
            });
        });
        
        server.listen(this.port, () => {
            console.log(`\n📮 Digital Post Office running on port ${this.port}`);
            console.log(`🌐 PWA Interface: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.port}`);
        });
    }

    // Route packet to destination
    routePacket(packet, data) {
        if (packet.to === 'broadcast') {
            // Send to all connections
            this.connections.forEach((ws, id) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'incoming',
                        packet: packet,
                        data: data
                    }));
                }
            });
            console.log(`   📡 Broadcasted to ${this.connections.size} clients`);
        } else {
            // Store for pickup
            this.packets.set(packet.id, { packet, data });
            console.log(`   📪 Stored for pickup by: ${packet.to}`);
        }
    }

    // Get PWA interface
    getPWAInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Digital Post Office</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f0f0f0;
        }
        .packet {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        button {
            background: #007AFF;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 16px;
        }
        #status {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background: #4CAF50;
            color: white;
            border-radius: 4px;
        }
        textarea {
            width: 100%;
            min-height: 100px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div id="status">Connecting...</div>
    <h1>📮 Digital Post Office</h1>
    
    <div class="packet">
        <h3>Send Packet</h3>
        <select id="from">
            <option value="phone-pwa">Phone PWA</option>
            <option value="electron-app">Electron App</option>
            <option value="terminal">Terminal</option>
        </select>
        →
        <select id="to">
            <option value="broadcast">Broadcast</option>
            <option value="electron-app">Electron App</option>
            <option value="terminal">Terminal</option>
            <option value="phone-pwa">Phone PWA</option>
        </select>
        <textarea id="message" placeholder="Your message..."></textarea>
        <button onclick="sendPacket()">📤 Send</button>
    </div>
    
    <div id="packets"></div>
    
    <script>
        const ws = new WebSocket('ws://' + window.location.host);
        const packetsDiv = document.getElementById('packets');
        
        ws.onopen = () => {
            document.getElementById('status').textContent = 'Connected';
            document.getElementById('status').style.background = '#4CAF50';
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'incoming') {
                const packetDiv = document.createElement('div');
                packetDiv.className = 'packet';
                packetDiv.innerHTML = \`
                    <strong>📬 From: \${data.packet.from}</strong><br>
                    <small>ID: \${data.packet.id}</small><br>
                    <pre>\${JSON.stringify(data.data, null, 2)}</pre>
                \`;
                packetsDiv.prepend(packetDiv);
            }
        };
        
        ws.onclose = () => {
            document.getElementById('status').textContent = 'Disconnected';
            document.getElementById('status').style.background = '#f44336';
        };
        
        function sendPacket() {
            const from = document.getElementById('from').value;
            const to = document.getElementById('to').value;
            const message = document.getElementById('message').value;
            
            const packet = {
                id: Math.random().toString(36).substr(2, 9),
                from: from,
                to: to,
                timestamp: Date.now(),
                envelope: btoa(JSON.stringify({ message: message })),
                checksum: 'auto'
            };
            
            ws.send(JSON.stringify(packet));
            document.getElementById('message').value = '';
        }
    </script>
</body>
</html>`;
    }
}

// Example usage functions
function sendFromTerminal(message, to = 'broadcast') {
    const postOffice = new DigitalPostOffice();
    const packet = postOffice.packPacket(
        { type: 'terminal-message', message },
        'terminal',
        to
    );
    
    console.log('\n📤 SENDING FROM TERMINAL:');
    console.log(JSON.stringify(packet, null, 2));
    
    return packet;
}

function sendFromElectron(data, to = 'phone-pwa') {
    const postOffice = new DigitalPostOffice();
    const packet = postOffice.packPacket(
        { type: 'electron-data', ...data },
        'electron-app',
        to
    );
    
    console.log('\n⚡ SENDING FROM ELECTRON:');
    console.log(JSON.stringify(packet, null, 2));
    
    return packet;
}

// Start the post office
if (require.main === module) {
    const postOffice = new DigitalPostOffice();
    
    console.log('\n📮 DIGITAL POST OFFICE STARTING...');
    console.log('==================================\n');
    
    // Example: Create and unpack a test packet
    console.log('📦 EXAMPLE PACKET:');
    const testPacket = postOffice.packPacket(
        { message: 'Hello from terminal!', encrypted: false },
        'terminal',
        'phone-pwa'
    );
    
    console.log('\nPacked:', JSON.stringify(testPacket, null, 2));
    
    const unpacked = postOffice.unpackPacket(testPacket);
    console.log('\nUnpacked:', unpacked);
    
    // Start the server
    postOffice.startPostOffice();
    
    console.log('\n📱 CONNECT FROM:');
    console.log('   Terminal: Use WebSocket client');
    console.log('   Electron: ws://localhost:5555');
    console.log('   Phone: http://[your-ip]:5555');
    console.log('\n💡 Press Ctrl+C to stop');
}

module.exports = DigitalPostOffice;
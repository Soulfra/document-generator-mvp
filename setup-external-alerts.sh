#!/bin/bash

# SETUP EXTERNAL ALERTS
# Configure Discord/Telegram webhooks and OBS integration

echo "🚨 Setting up external chaos alerts..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# External Alert Configuration
WEBHOOK_URL=""  # Discord webhook URL
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
OBS_WEBSOCKET_URL="ws://localhost:4455"
OBS_WEBSOCKET_PASSWORD=""

# Cloudflare Configuration (optional)
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ZONE_ID=""

# Alert Settings
ALERT_COOLDOWN=5000
CHAOS_THRESHOLD=50
MEMORY_THRESHOLD=100
EOF
    echo "✅ .env file created - please configure your webhook URLs"
fi

# Create Discord webhook setup instructions
cat > discord-setup.md << 'EOF'
# Discord Webhook Setup

1. Go to your Discord server settings
2. Click "Integrations" → "Webhooks" → "New Webhook"
3. Copy the webhook URL
4. Add it to .env as WEBHOOK_URL="your_webhook_url_here"

Example .env entry:
```
WEBHOOK_URL="https://discord.com/api/webhooks/123456789/abcdefghijk"
```

The chaos monitor will send alerts like:
🚨 Chaos Alert: Chaos level: 75, Memory: 150.2MB
EOF

# Create Telegram setup instructions
cat > telegram-setup.md << 'EOF'
# Telegram Bot Setup

1. Message @BotFather on Telegram
2. Send /newbot and follow instructions
3. Copy the bot token
4. Add your bot to a channel/group
5. Send a message to get the chat ID

Get chat ID by messaging your bot and visiting:
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getUpdates

Example .env entries:
```
TELEGRAM_BOT_TOKEN="123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
TELEGRAM_CHAT_ID="-123456789"
```
EOF

# Create OBS setup instructions
cat > obs-setup.md << 'EOF'
# OBS Integration Setup

## Text Source (Simple)
1. Add "Text (GDI+)" source in OBS
2. Check "Read from file"
3. Browse to: chaos-status.txt
4. Set refresh interval to 2 seconds

## Browser Source (Advanced)
1. Add "Browser" source in OBS
2. URL: http://localhost:3338
3. Width: 800, Height: 600
4. Check "Refresh browser when scene becomes active"

## Files Available:
- chaos-status.txt  (Simple text: "CHAOS: 50 | MEM: 120MB | CAL: awake")
- chaos-data.json   (Full JSON data for custom tools)
- chaos-alert.json  (Latest alert information)

The text updates every 3 seconds automatically.
EOF

# Create simple test script
cat > test-alerts.js << 'EOF'
#!/usr/bin/env node

// Test external alerts
const fs = require('fs');

async function testDiscordWebhook() {
    require('dotenv').config();
    
    if (!process.env.WEBHOOK_URL) {
        console.log('❌ No WEBHOOK_URL in .env file');
        return;
    }
    
    try {
        const fetch = require('node-fetch');
        const response = await fetch(process.env.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: '🧪 Test alert from chaos monitor!',
                embeds: [{
                    color: 0x00ff88,
                    title: 'Chaos Monitor Test',
                    fields: [
                        { name: 'Status', value: 'Testing', inline: true },
                        { name: 'Time', value: new Date().toISOString(), inline: true }
                    ]
                }]
            })
        });
        
        if (response.ok) {
            console.log('✅ Discord webhook test successful!');
        } else {
            console.log('❌ Discord webhook test failed:', response.status);
        }
    } catch (error) {
        console.log('❌ Discord webhook error:', error.message);
    }
}

async function testOBSFiles() {
    // Create test status files
    await fs.promises.writeFile('chaos-status.txt', 'CHAOS: 42 | MEM: 85.6MB | CAL: awake');
    await fs.promises.writeFile('chaos-data.json', JSON.stringify({
        chaos: 42,
        memory: '85.6',
        cal: 'awake',
        timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log('✅ OBS test files created');
    console.log('📄 chaos-status.txt: Simple text for OBS text source');
    console.log('📊 chaos-data.json: JSON data for custom integrations');
}

// Run tests
(async () => {
    console.log('🧪 Testing external integrations...\n');
    
    await testDiscordWebhook();
    await testOBSFiles();
    
    console.log('\n✅ Test complete!');
})();
EOF

chmod +x test-alerts.js

# Create Cloudflare deployment script
cat > deploy-cloudflare.js << 'EOF'
#!/usr/bin/env node

// Deploy simple chaos monitor to Cloudflare Workers
const fs = require('fs');

const workerScript = `
// Cloudflare Worker for Chaos Monitor
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Simple chaos state (stored in KV or memory)
    let chaos = await env.CHAOS_KV?.get('chaos') || '0';
    
    if (url.pathname === '/bash') {
      chaos = (parseInt(chaos) + 10).toString();
      await env.CHAOS_KV?.put('chaos', chaos);
      return new Response(JSON.stringify({ chaos: parseInt(chaos) }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/status') {
      return new Response(JSON.stringify({ 
        chaos: parseInt(chaos),
        timestamp: new Date().toISOString(),
        worker: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Simple HTML interface
    return new Response(\`
<!DOCTYPE html>
<html>
<head><title>Chaos Monitor - Cloudflare</title></head>
<body style="font-family: monospace; background: #0c0c0c; color: #00ff88; text-align: center; padding: 50px;">
    <h1>🚨 CHAOS MONITOR</h1>
    <div style="font-size: 3em; margin: 30px 0;">\${chaos}</div>
    <button onclick="bash()" style="background: #ff6b6b; color: white; border: none; padding: 15px 30px; margin: 10px; border-radius: 5px; cursor: pointer;">💥 BASH</button>
    <script>
    async function bash() {
        await fetch('/bash', { method: 'POST' });
        location.reload();
    }
    </script>
</body>
</html>
    \`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
`;

fs.writeFileSync('cloudflare-worker.js', workerScript);
console.log('✅ Cloudflare Worker script created: cloudflare-worker.js');
console.log('📦 Deploy with: wrangler deploy cloudflare-worker.js');
EOF

chmod +x deploy-cloudflare.js

echo ""
echo "✅ External alerts setup complete!"
echo ""
echo "📁 Files created:"
echo "  - discord-setup.md    # Discord webhook instructions"
echo "  - telegram-setup.md   # Telegram bot setup"
echo "  - obs-setup.md        # OBS integration guide"
echo "  - test-alerts.js      # Test webhook/OBS integration"
echo "  - deploy-cloudflare.js # Cloudflare Workers deployment"
echo "  - .env                # Configuration file"
echo ""
echo "🚀 Quick start:"
echo "  1. Edit .env with your webhook URLs"
echo "  2. Run: node test-alerts.js"
echo "  3. Run: npm run simple-chaos"
echo "  4. Add OBS text source pointing to chaos-status.txt"
echo ""
echo "🌐 Lightweight chaos monitor ready for Cloudflare! 🚀"
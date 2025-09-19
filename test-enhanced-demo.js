#!/usr/bin/env node

/**
 * Test the enhanced business demo
 * Shows how to use the API with real data
 */

console.log(`
🚀 ENHANCED BUSINESS DEMO TEST
==============================

This demo combines:
✅ Real Sunbiz business data
✅ Live crypto prices (BTC, ETH, SCYTHE)
✅ Interactive maps
✅ Sprite generation
✅ GIF animations
✅ Pixelated street views

📍 Access the demo at:
http://localhost:8000/enhanced-business-demo.html

🔍 To test with YOUR business:
1. Open the demo page
2. Enter YOUR document number (e.g., P20000012345)
3. Or enter YOUR business name
4. Watch as it:
   - Fetches your real address from Sunbiz
   - Shows it on the map
   - Generates pixel art sprite
   - Creates animated GIFs
   - Shows real-time crypto prices

💡 Example document numbers to try:
- P20000090915 (ANTHROPIC PBC)
- L21000245843 (OPENAI OPCO, LLC)
- P98000055991 (GOOGLE LLC)
- Your own document number!

🎮 Features in the demo:
- Matrix rain background effect
- Real-time price charts
- Achievement notifications
- Pixelated street view
- Animated GIF generator
- Live timestamps with block height

🔧 API Endpoints you can use:
- GET /api/sunbiz/lookup?q=YOUR_DOC_NUMBER
- GET /api/property-tax/lookup?address=YOUR_ADDRESS
- POST /api/sunbiz/extract

🌐 Make sure the backend is running:
cd proptech-vc-demo/backend && npm start

Then open:
http://localhost:8000/enhanced-business-demo.html
`);

// Quick API test
const http = require('http');

console.log('\n🧪 Testing API connectivity...\n');

const testAPI = (path, description) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`${res.statusCode === 200 ? '✅' : '❌'} ${description}: ${res.statusCode}`);
            resolve(res.statusCode);
        });

        req.on('error', (err) => {
            console.log(`❌ ${description}: ${err.message}`);
            resolve(null);
        });

        req.end();
    });
};

async function runTests() {
    await testAPI('/enhanced-business-demo.html', 'Enhanced Demo Page');
    await testAPI('/sunbiz-lookup-demo.html', 'Sunbiz Lookup Page');
    await testAPI('/api/sunbiz/lookup?q=P20000090915', 'Sunbiz API');
    
    console.log('\n✨ Ready to rock! Open the demo page and try it with your real data.\n');
}

runTests();
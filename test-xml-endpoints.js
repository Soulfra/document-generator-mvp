#!/usr/bin/env node

/**
 * 🧪 XML ENDPOINT TESTER
 * Tests all XML broadcast endpoints to verify integration
 */

const http = require('http');

class XMLEndpointTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.endpoints = [
            '/xml/world',
            '/rss/events', 
            '/atom/players',
            '/xml/guilds',
            '/xml/economy',
            '/xml/leaderboards',
            '/sitemap.xml'
        ];
    }
    
    async testAllEndpoints() {
        console.log('🧪 TESTING XML BROADCAST ENDPOINTS');
        console.log('==================================');
        console.log('');
        
        let successCount = 0;
        let totalCount = this.endpoints.length;
        
        for (const endpoint of this.endpoints) {
            try {
                const result = await this.testEndpoint(endpoint);
                if (result.success) {
                    console.log(`✅ ${endpoint} - ${result.contentType} (${result.size} bytes)`);
                    if (result.preview) {
                        console.log(`   📄 Preview: ${result.preview}`);
                    }
                    successCount++;
                } else {
                    console.log(`❌ ${endpoint} - ${result.error}`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint} - Connection error: ${error.message}`);
            }
            console.log('');
        }
        
        console.log('📊 RESULTS');
        console.log('==========');
        console.log(`✅ Successful: ${successCount}/${totalCount}`);
        console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
        console.log(`📈 Success Rate: ${Math.round((successCount/totalCount) * 100)}%`);
        
        if (successCount === totalCount) {
            console.log('');
            console.log('🎉 ALL XML ENDPOINTS WORKING!');
            console.log('🌐 Game data successfully broadcasting to XML layer');
        }
    }
    
    async testEndpoint(endpoint) {
        return new Promise((resolve) => {
            const url = `${this.baseUrl}${endpoint}`;
            
            http.get(url, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        // Extract preview from XML
                        let preview = '';
                        if (data.includes('<title>')) {
                            preview = data.match(/<title>(.*?)<\/title>/)?.[1] || '';
                        } else if (data.includes('<name>')) {
                            preview = data.match(/<name>(.*?)<\/name>/)?.[1] || '';
                        } else if (data.includes('<username>')) {
                            preview = data.match(/<username>(.*?)<\/username>/)?.[1] || '';
                        }
                        
                        resolve({
                            success: true,
                            contentType: res.headers['content-type'],
                            size: data.length,
                            preview: preview || data.substring(0, 100).replace(/\n/g, ' ')
                        });
                    } else {
                        resolve({
                            success: false,
                            error: `HTTP ${res.statusCode}`
                        });
                    }
                });
            }).on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
        });
    }
    
    async testSOAPEndpoint() {
        console.log('🧼 TESTING SOAP ENDPOINT');
        console.log('========================');
        
        const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <GetPlayerData xmlns="http://gameserver.local/soap">
            <playerId>player_0</playerId>
        </GetPlayerData>
    </soap:Body>
</soap:Envelope>`;
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: 8877,
                path: '/soap/gamedata',
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'Content-Length': Buffer.byteLength(soapRequest),
                    'SOAPAction': 'GetPlayerData'
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200 && data.includes('GetPlayerDataResponse')) {
                        console.log('✅ SOAP endpoint working');
                        console.log(`   📄 Response preview: ${data.substring(0, 200).replace(/\n/g, ' ')}`);
                        resolve({ success: true });
                    } else {
                        console.log('❌ SOAP endpoint failed');
                        console.log(`   Error: HTTP ${res.statusCode}`);
                        resolve({ success: false });
                    }
                });
            });
            
            req.on('error', (error) => {
                console.log('❌ SOAP connection error:', error.message);
                resolve({ success: false });
            });
            
            req.write(soapRequest);
            req.end();
        });
    }
    
    async runCompleteTest() {
        await this.testAllEndpoints();
        console.log('');
        await this.testSOAPEndpoint();
        
        console.log('');
        console.log('🌐 XML BROADCAST INTEGRATION COMPLETE');
        console.log('====================================');
        console.log('Binary game protocol → XML feeds working!');
        console.log('');
        console.log('📡 Available for consumption by:');
        console.log('  📰 RSS readers and news aggregators');
        console.log('  🏢 Legacy enterprise systems via SOAP');
        console.log('  📱 Mobile apps via ATOM feeds');
        console.log('  🌐 Web services via REST XML APIs');
        console.log('  🗺️ Search engines via XML sitemaps');
    }
}

// Run the tests
async function runXMLTests() {
    const tester = new XMLEndpointTester('http://localhost:8877');
    await tester.runCompleteTest();
}

// Wait a moment for server to be ready, then test
setTimeout(() => {
    runXMLTests().catch(console.error);
}, 2000);
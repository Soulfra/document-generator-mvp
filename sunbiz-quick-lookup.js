#!/usr/bin/env node

/**
 * Quick Sunbiz lookup tool
 * Usage: ./sunbiz-quick-lookup.js [document-number or email]
 */

const http = require('http');

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage: ./sunbiz-quick-lookup.js [document-number or email]');
    console.log('\nExamples:');
    console.log('  ./sunbiz-quick-lookup.js P20000012345');
    console.log('  ./sunbiz-quick-lookup.js john@example.com');
    process.exit(1);
}

const query = args[0];
const port = process.env.PORT || 8000;

console.log(`\n🔍 Looking up: ${query}\n`);

const options = {
    hostname: 'localhost',
    port: port,
    path: `/api/sunbiz/lookup?q=${encodeURIComponent(query)}`,
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            
            if (!result.success) {
                console.error('❌ Error:', result.error);
                return;
            }

            const businesses = Array.isArray(result.data) ? result.data : [result.data];

            businesses.forEach((business, index) => {
                if (businesses.length > 1) {
                    console.log(`\n--- Result ${index + 1} ---`);
                }
                
                console.log('\n📋 Business Information');
                console.log('  Name:', business.businessName);
                console.log('  Document #:', business.documentNumber);
                console.log('  Status:', business.status);

                if (business.principalAddress) {
                    console.log('\n📍 Principal Address:');
                    console.log('  ', business.principalAddress.formatted);
                }

                if (business.registeredAgentAddress) {
                    console.log('\n🏛️ Registered Agent:');
                    console.log('  ', business.registeredAgentAddress.formatted);
                }

                if (business.mailingAddress) {
                    console.log('\n✉️ Mailing Address:');
                    console.log('  ', business.mailingAddress.formatted);
                }
            });

            if (businesses.length > 1) {
                console.log(`\n\nFound ${businesses.length} businesses total.`);
            }

        } catch (err) {
            console.error('❌ Failed to parse response:', err.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
    console.log('\nMake sure the backend server is running:');
    console.log('  cd proptech-vc-demo/backend');
    console.log('  npm start');
});

req.end();
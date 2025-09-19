#!/usr/bin/env node

/**
 * 🧪 REAL VERIFICATION TEST
 * Tests the actual working system end-to-end
 * Generates real QR codes, tests payments, verifies everything works
 */

const fs = require('fs');
const path = require('path');

class RealVerificationTest {
    constructor() {
        this.results = {
            systemsOnline: {},
            qrGeneration: {},
            paymentFlow: {},
            verification: {},
            affiliate: {},
            overall: 'PENDING'
        };
        
        console.log('🧪 REAL VERIFICATION TEST STARTING...');
        console.log('📋 Testing all systems end-to-end');
        this.runTests();
    }
    
    async runTests() {
        console.log('\n🔍 PHASE 1: System Status Check');
        await this.testSystemsOnline();
        
        console.log('\n📱 PHASE 2: QR Code Generation');
        await this.testQRGeneration();
        
        console.log('\n💳 PHASE 3: Payment Flow');
        await this.testPaymentFlow();
        
        console.log('\n✅ PHASE 4: Verification Chain');
        await this.testVerificationChain();
        
        console.log('\n💰 PHASE 5: Affiliate Network');
        await this.testAffiliateNetwork();
        
        console.log('\n📊 GENERATING FINAL REPORT...');
        this.generateReport();
    }
    
    async testSystemsOnline() {
        const systems = [
            { name: 'Unified Hub', port: 8090, path: '/api/status' },
            { name: 'Hex Platform', port: 8095, path: '/' },
            { name: 'Backend Work', port: 8097, path: '/' },
            { name: 'AccentWars', port: 8098, path: '/' },
            { name: 'QR Bridge', port: 8099, path: '/api/status' },
            { name: 'Device Verify', port: 8100, path: '/api/status' },
            { name: 'Stripe Pixels', port: 8101, path: '/api/status' }
        ];
        
        for (const system of systems) {
            try {
                const response = await this.fetch(`http://localhost:${system.port}${system.path}`);
                if (response.ok) {
                    this.results.systemsOnline[system.name] = '✅ ONLINE';
                    console.log(`✅ ${system.name}: ONLINE (port ${system.port})`);
                } else {
                    this.results.systemsOnline[system.name] = '❌ HTTP ERROR';
                    console.log(`❌ ${system.name}: HTTP ERROR (${response.status})`);
                }
            } catch (error) {
                this.results.systemsOnline[system.name] = '❌ OFFLINE';
                console.log(`❌ ${system.name}: OFFLINE (port ${system.port})`);
            }
        }
    }
    
    async testQRGeneration() {
        try {
            // Test QR Bridge system
            console.log('🔗 Testing QR-UPC Bridge...');
            const qrResponse = await this.fetch('http://localhost:8099/api/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'qr',
                    to: 'upc',
                    data: 'TEST_QR_DATA_12345'
                })
            });
            
            if (qrResponse.ok) {
                const qrResult = await qrResponse.json();
                this.results.qrGeneration.bridge = '✅ QR-UPC conversion working';
                console.log('✅ QR-UPC Bridge: Working');
                console.log(`   Generated UPC: ${qrResult.result.upc}`);
            } else {
                this.results.qrGeneration.bridge = '❌ QR-UPC conversion failed';
                console.log('❌ QR-UPC Bridge: Failed');
            }
            
            // Test Stripe QR generation
            console.log('💳 Testing Stripe QR generation...');
            const stripeQRResponse = await this.fetch('http://localhost:8101/api/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: 'STRIPE_TEST_DEVICE_001',
                    type: 'device_sharing',
                    deviceId: 'test_device_001'
                })
            });
            
            if (stripeQRResponse.ok) {
                const stripeResult = await stripeQRResponse.json();
                this.results.qrGeneration.stripe = '✅ Stripe QR generation working';
                console.log('✅ Stripe QR Generation: Working');
                console.log(`   QR ID: ${stripeResult.qrCode.id}`);
                
                // Save QR code image for actual scanning
                this.saveQRCodeForTesting(stripeResult.qrCode);
            } else {
                this.results.qrGeneration.stripe = '❌ Stripe QR generation failed';
                console.log('❌ Stripe QR Generation: Failed');
            }
            
        } catch (error) {
            this.results.qrGeneration.error = error.message;
            console.log('❌ QR Generation Test: Error -', error.message);
        }
    }
    
    async testPaymentFlow() {
        try {
            console.log('💳 Testing Stripe payment intent creation...');
            
            const paymentResponse = await this.fetch('http://localhost:8101/api/payment/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 499,  // $4.99
                    tier: 'premium_qr',
                    deviceId: 'test_device_payment_001',
                    affiliateCode: 'test_affiliate_001'
                })
            });
            
            if (paymentResponse.ok) {
                const paymentResult = await paymentResponse.json();
                this.results.paymentFlow.creation = '✅ Payment intent created';
                console.log('✅ Payment Intent: Created');
                console.log(`   Payment ID: ${paymentResult.paymentIntent.id}`);
                console.log(`   Amount: $${paymentResult.paymentIntent.amount / 100}`);
                console.log(`   Client Secret: ${paymentResult.paymentIntent.client_secret}`);
                
                // Test payment verification
                await this.testPaymentVerification(paymentResult.paymentIntent);
                
            } else {
                this.results.paymentFlow.creation = '❌ Payment intent failed';
                console.log('❌ Payment Intent: Failed');
            }
            
        } catch (error) {
            this.results.paymentFlow.error = error.message;
            console.log('❌ Payment Flow Test: Error -', error.message);
        }
    }
    
    async testPaymentVerification(paymentIntent) {
        try {
            console.log('🔍 Testing QR scan with payment verification...');
            
            // Simulate payment success (in real system, this would come from Stripe webhook)
            paymentIntent.status = 'succeeded';
            
            const verifyResponse = await this.fetch('http://localhost:8101/api/qr/verify-paid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrData: JSON.stringify({
                        type: 'device_sharing',
                        deviceId: 'scanned_device_001',
                        timestamp: Date.now()
                    }),
                    paymentIntentId: paymentIntent.id,
                    scannerDeviceId: 'test_device_payment_001'
                })
            });
            
            if (verifyResponse.ok) {
                const verifyResult = await verifyResponse.json();
                this.results.paymentFlow.verification = '✅ Payment verification working';
                console.log('✅ Payment Verification: Working');
                console.log(`   Verification ID: ${verifyResult.verification.id}`);
                console.log(`   Tier: ${verifyResult.verification.tier}`);
                console.log(`   Pixel Art Generated: ${verifyResult.verification.pixelArtGenerated}`);
                
                if (verifyResult.verification.pixelArt) {
                    console.log(`   Pixel Art ID: ${verifyResult.verification.pixelArt.id}`);
                    console.log(`   Dimensions: ${verifyResult.verification.pixelArt.width}x${verifyResult.verification.pixelArt.height}`);
                }
                
            } else {
                this.results.paymentFlow.verification = '❌ Payment verification failed';
                console.log('❌ Payment Verification: Failed');
            }
            
        } catch (error) {
            this.results.paymentFlow.verificationError = error.message;
            console.log('❌ Payment Verification: Error -', error.message);
        }
    }
    
    async testVerificationChain() {
        try {
            console.log('🔗 Testing full verification chain...');
            
            // Test device registration
            const deviceResponse = await this.fetch('http://localhost:8100/api/device/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceName: 'Test Device Chain',
                    location: 'Test Location'
                })
            });
            
            if (deviceResponse.ok) {
                const deviceResult = await deviceResponse.json();
                this.results.verification.device = '✅ Device registration working';
                console.log('✅ Device Registration: Working');
                console.log(`   Device ID: ${deviceResult.device.id}`);
                
                // Test scan verification
                const scanResponse = await this.fetch('http://localhost:8100/api/scan/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        qrData: JSON.stringify({
                            type: 'device_sharing',
                            deviceId: deviceResult.device.id,
                            timestamp: Date.now(),
                            signature: 'test_signature'
                        }),
                        scannerDeviceId: 'test_scanner_001',
                        location: 'test_location'
                    })
                });
                
                if (scanResponse.ok) {
                    const scanResult = await scanResponse.json();
                    this.results.verification.scan = '✅ Scan verification working';
                    console.log('✅ Scan Verification: Working');
                    console.log(`   Verification ID: ${scanResult.verification.id}`);
                } else {
                    this.results.verification.scan = '❌ Scan verification failed';
                    console.log('❌ Scan Verification: Failed');
                }
                
            } else {
                this.results.verification.device = '❌ Device registration failed';
                console.log('❌ Device Registration: Failed');
            }
            
        } catch (error) {
            this.results.verification.error = error.message;
            console.log('❌ Verification Chain: Error -', error.message);
        }
    }
    
    async testAffiliateNetwork() {
        try {
            console.log('💰 Testing affiliate network...');
            
            // Test affiliate registration
            const affiliateResponse = await this.fetch('http://localhost:8101/api/affiliate/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: 'test_affiliate_001',
                    email: 'test@affiliate.com',
                    name: 'Test Affiliate'
                })
            });
            
            if (affiliateResponse.ok) {
                const affiliateResult = await affiliateResponse.json();
                this.results.affiliate.registration = '✅ Affiliate registration working';
                console.log('✅ Affiliate Registration: Working');
                
                // Test earnings check
                const earningsResponse = await this.fetch('http://localhost:8101/api/affiliate/earnings/test_affiliate_001');
                
                if (earningsResponse.ok) {
                    const earningsResult = await earningsResponse.json();
                    this.results.affiliate.earnings = '✅ Affiliate earnings tracking working';
                    console.log('✅ Affiliate Earnings: Working');
                    console.log(`   Total Earned: $${earningsResult.earnings.totalEarned / 100}`);
                    console.log(`   Total Pending: $${earningsResult.earnings.totalPending / 100}`);
                } else {
                    this.results.affiliate.earnings = '❌ Affiliate earnings failed';
                    console.log('❌ Affiliate Earnings: Failed');
                }
                
            } else {
                this.results.affiliate.registration = '❌ Affiliate registration failed';
                console.log('❌ Affiliate Registration: Failed');
            }
            
        } catch (error) {
            this.results.affiliate.error = error.message;
            console.log('❌ Affiliate Network: Error -', error.message);
        }
    }
    
    saveQRCodeForTesting(qrCode) {
        try {
            const testDir = path.join(__dirname, 'test-qr-codes');
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir);
            }
            
            const qrFilePath = path.join(testDir, `test-qr-${qrCode.id}.html`);
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test QR Code: ${qrCode.id}</title>
    <style>
        body { text-align: center; font-family: Arial, sans-serif; padding: 20px; }
        .qr-container { background: white; padding: 20px; border-radius: 10px; display: inline-block; }
        img { max-width: 300px; }
    </style>
</head>
<body>
    <h2>Real Test QR Code</h2>
    <div class="qr-container">
        <img src="${qrCode.image}" alt="QR Code ${qrCode.id}" />
    </div>
    <p><strong>QR ID:</strong> ${qrCode.id}</p>
    <p><strong>Type:</strong> ${qrCode.type}</p>
    <p><strong>Data:</strong> ${qrCode.data.substring(0, 100)}...</p>
    <p style="color: green;"><strong>✅ SCAN THIS WITH YOUR PHONE CAMERA</strong></p>
</body>
</html>`;
            
            fs.writeFileSync(qrFilePath, htmlContent);
            console.log(`📱 QR Code saved for testing: file://${qrFilePath}`);
            
        } catch (error) {
            console.log('⚠️  Could not save QR code for testing:', error.message);
        }
    }
    
    generateReport() {
        const allPassed = this.checkAllTestsPassed();
        this.results.overall = allPassed ? '✅ ALL SYSTEMS WORKING' : '❌ SOME ISSUES FOUND';
        
        console.log('\n' + '='.repeat(80));
        console.log('🧪 REAL VERIFICATION TEST REPORT');
        console.log('='.repeat(80));
        
        console.log('\n📊 OVERALL STATUS:', this.results.overall);
        
        console.log('\n🔍 SYSTEMS ONLINE:');
        Object.entries(this.results.systemsOnline).forEach(([system, status]) => {
            console.log(`   ${system}: ${status}`);
        });
        
        console.log('\n📱 QR GENERATION:');
        Object.entries(this.results.qrGeneration).forEach(([test, status]) => {
            console.log(`   ${test}: ${status}`);
        });
        
        console.log('\n💳 PAYMENT FLOW:');
        Object.entries(this.results.paymentFlow).forEach(([test, status]) => {
            console.log(`   ${test}: ${status}`);
        });
        
        console.log('\n✅ VERIFICATION:');
        Object.entries(this.results.verification).forEach(([test, status]) => {
            console.log(`   ${test}: ${status}`);
        });
        
        console.log('\n💰 AFFILIATE NETWORK:');
        Object.entries(this.results.affiliate).forEach(([test, status]) => {
            console.log(`   ${test}: ${status}`);
        });
        
        console.log('\n🎯 ACCESS POINTS:');
        console.log('   🎮 Main Hub: http://localhost:8090');
        console.log('   🔷 Hex Platform: http://localhost:8095');
        console.log('   ⚙️  Backend Work: http://localhost:8097');
        console.log('   🎯 AccentWars: http://localhost:8098');
        console.log('   🔗 QR Bridge: http://localhost:8099');
        console.log('   📱 Device Verify: http://localhost:8100');
        console.log('   💳 Stripe Pixels: http://localhost:8101');
        
        console.log('\n' + '='.repeat(80));
        
        if (allPassed) {
            console.log('🎉 ALL SYSTEMS VERIFIED AND WORKING!');
            console.log('✅ QR codes can be generated and scanned');
            console.log('✅ Payments can be processed');
            console.log('✅ Affiliate network is functional');
            console.log('✅ Pixel art generation works');
            console.log('✅ Full verification chain operational');
        } else {
            console.log('⚠️  SOME ISSUES FOUND - CHECK LOGS ABOVE');
            console.log('🔧 Systems may need debugging or restart');
        }
        
        console.log('='.repeat(80));
        
        // Save report to file
        this.saveReportToFile();
    }
    
    checkAllTestsPassed() {
        const allResults = [
            ...Object.values(this.results.systemsOnline),
            ...Object.values(this.results.qrGeneration),
            ...Object.values(this.results.paymentFlow),
            ...Object.values(this.results.verification),
            ...Object.values(this.results.affiliate)
        ];
        
        return allResults.every(result => result.includes('✅'));
    }
    
    saveReportToFile() {
        try {
            const reportPath = path.join(__dirname, 'verification-test-report.json');
            const report = {
                timestamp: new Date().toISOString(),
                results: this.results,
                summary: {
                    allPassed: this.checkAllTestsPassed(),
                    systemsOnline: Object.keys(this.results.systemsOnline).length,
                    testsRun: Object.keys(this.results).length - 1 // exclude 'overall'
                }
            };
            
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`📊 Full report saved: ${reportPath}`);
            
        } catch (error) {
            console.log('⚠️  Could not save report:', error.message);
        }
    }
    
    // Simple fetch implementation for Node.js
    async fetch(url, options = {}) {
        const http = require('http');
        const https = require('https');
        const { URL } = require('url');
        
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            
            const reqOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = client.request(reqOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: () => Promise.resolve(JSON.parse(data)),
                        text: () => Promise.resolve(data)
                    });
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }
}

// Run the test
new RealVerificationTest();
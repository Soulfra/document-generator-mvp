#!/usr/bin/env node

// Verification script for Electron Unified App
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

console.log('🔍 ELECTRON UNIFIED APP VERIFICATION');
console.log('===================================\n');

const checks = [];
let passCount = 0;
let failCount = 0;

// Check function
function check(name, fn) {
    return new Promise(async (resolve) => {
        try {
            const result = await fn();
            if (result) {
                console.log(`✅ ${name}`);
                passCount++;
            } else {
                console.log(`❌ ${name}`);
                failCount++;
            }
            checks.push({ name, passed: result });
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            failCount++;
            checks.push({ name, passed: false, error: error.message });
        }
        resolve();
    });
}

// Service check helper
function checkService(port, path = '/') {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'GET',
            timeout: 3000
        };

        const req = http.request(options, (res) => {
            resolve(res.statusCode < 500);
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// WebSocket check helper
function checkWebSocket(port) {
    return new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        const timeout = setTimeout(() => {
            ws.close();
            resolve(false);
        }, 3000);

        ws.on('open', () => {
            clearTimeout(timeout);
            ws.close();
            resolve(true);
        });

        ws.on('error', () => {
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

async function runVerification() {
    console.log('1️⃣  CHECKING DEPENDENCIES\n');
    
    await check('Node.js installed', () => {
        const version = process.version;
        console.log(`   Version: ${version}`);
        return true;
    });

    await check('NPM packages installed', () => {
        const packageJson = require('./package.json');
        const deps = Object.keys(packageJson.dependencies || {});
        console.log(`   Dependencies: ${deps.length}`);
        return deps.length > 0;
    });

    await check('Electron installed', () => {
        try {
            const electronPath = require.resolve('electron');
            return fs.existsSync(electronPath);
        } catch {
            return false;
        }
    });

    await check('Puppeteer installed', () => {
        try {
            require.resolve('puppeteer');
            return true;
        } catch {
            return false;
        }
    });

    await check('WebSocket (ws) installed', () => {
        try {
            require.resolve('ws');
            return true;
        } catch {
            return false;
        }
    });

    await check('QRCode installed', () => {
        try {
            require.resolve('qrcode');
            return true;
        } catch {
            return false;
        }
    });

    console.log('\n2️⃣  CHECKING REQUIRED FILES\n');

    const requiredFiles = [
        'electron-unified-app.js',
        'desktop-streaming-environment.html',
        'differential-game-interface.html',
        'integrated-streaming-system.js',
        'differential-game-extractor.js',
        'wormhole-interface.html'
    ];

    for (const file of requiredFiles) {
        await check(`File: ${file}`, () => fs.existsSync(path.join(__dirname, file)));
    }

    console.log('\n3️⃣  CHECKING SERVICES\n');

    // Start services for testing
    console.log('   Starting services for testing...\n');

    // Start integrated streaming system
    const streamingProcess = spawn('node', ['integrated-streaming-system.js'], {
        cwd: __dirname,
        detached: true,
        stdio: 'ignore'
    });

    // Start differential game extractor
    const differentialProcess = spawn('node', ['differential-game-extractor.js'], {
        cwd: __dirname,
        detached: true,
        stdio: 'ignore'
    });

    // Give services time to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    await check('Integrated Streaming System (HTTP)', () => checkService(8917));
    await check('Integrated Streaming System (WebSocket)', () => checkWebSocket(8918));
    await check('Differential Game Extractor (WebSocket)', () => checkWebSocket(48000));

    console.log('\n4️⃣  CHECKING ELECTRON APP\n');

    await check('Electron main file exists', () => 
        fs.existsSync(path.join(__dirname, 'electron-unified-app.js'))
    );

    await check('Desktop environment HTML exists', () => 
        fs.existsSync(path.join(__dirname, 'desktop-streaming-environment.html'))
    );

    await check('Differential interface HTML exists', () => 
        fs.existsSync(path.join(__dirname, 'differential-game-interface.html'))
    );

    console.log('\n5️⃣  VERIFICATION SUMMARY\n');
    console.log(`   Total checks: ${passCount + failCount}`);
    console.log(`   ✅ Passed: ${passCount}`);
    console.log(`   ❌ Failed: ${failCount}`);

    if (failCount === 0) {
        console.log('\n🎉 All checks passed! The system is ready to run.\n');
        console.log('To start the Electron app, run:');
        console.log('   npm run electron-unified');
        console.log('\nOr use the convenience script:');
        console.log('   ./run-unified.sh');
    } else {
        console.log('\n⚠️  Some checks failed. Please fix the issues above.\n');
        console.log('Failed checks:');
        checks.filter(c => !c.passed).forEach(c => {
            console.log(`   - ${c.name}${c.error ? `: ${c.error}` : ''}`);
        });
    }

    // Cleanup spawned processes
    try {
        process.kill(-streamingProcess.pid);
        process.kill(-differentialProcess.pid);
    } catch {}

    process.exit(failCount > 0 ? 1 : 0);
}

// Run verification
runVerification().catch(console.error);
// Test Electron Startup Without Hanging
// This script tests if the electron app can start without errors

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Electron App Startup...\n');

// Test 1: Check if main electron file is correct
const electronMainPath = path.join(__dirname, 'electron/main.js');
const electronMainAltPath = path.join(__dirname, 'electron-main.js');

let mainFile = null;
if (fs.existsSync(electronMainPath)) {
    console.log('✅ Found electron/main.js (package.json main entry)');
    mainFile = electronMainPath;
} else if (fs.existsSync(electronMainAltPath)) {
    console.log('⚠️  Found electron-main.js but package.json points to electron/main.js');
    mainFile = electronMainAltPath;
} else {
    console.log('❌ No electron main file found!');
    process.exit(1);
}

// Test 2: Check required files exist
console.log('\n📁 Checking required files...');
const requiredFiles = [
    'context-memory-stream-manager.js',
    'ssh-terminal-runtime-ring-system.js', 
    'shiprekt-visual-interface-electron.js',
    'clarity-workflow-engine.js',
    'cringeproof-verification.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - NOT FOUND`);
        allFilesExist = false;
    }
}

if (!allFilesExist) {
    console.log('\n❌ Missing required files. Cannot start electron app.');
    process.exit(1);
}

// Test 3: Try to start electron with a timeout
console.log('\n🚀 Attempting to start Electron app...');
console.log('⏱️  Will timeout after 10 seconds if it hangs...\n');

const electronProcess = spawn('npx', ['electron', mainFile], {
    env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';
let hasStarted = false;

electronProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log('📝 STDOUT:', data.toString().trim());
    
    // Check for successful startup indicators
    if (data.toString().includes('Document Generator Electron App starting') ||
        data.toString().includes('Context Memory Stream Manager initialized') ||
        data.toString().includes('SSH Terminal Runtime Ring System initialized')) {
        hasStarted = true;
    }
});

electronProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.log('⚠️  STDERR:', data.toString().trim());
});

electronProcess.on('error', (error) => {
    console.log('❌ Failed to start electron:', error.message);
});

// Set a timeout to kill the process if it hangs
const timeout = setTimeout(() => {
    console.log('\n⏰ Timeout reached. Killing electron process...');
    electronProcess.kill('SIGTERM');
    
    // Give it a moment to die gracefully
    setTimeout(() => {
        electronProcess.kill('SIGKILL');
    }, 2000);
}, 10000);

electronProcess.on('close', (code) => {
    clearTimeout(timeout);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ELECTRON TEST RESULTS');
    console.log('='.repeat(60));
    
    if (code === 0) {
        console.log('✅ Electron exited cleanly (code 0)');
    } else if (code === null) {
        console.log('⚠️  Electron was killed (timeout or manual)');
    } else {
        console.log(`❌ Electron exited with code ${code}`);
    }
    
    if (hasStarted) {
        console.log('✅ Electron app started successfully!');
    } else {
        console.log('❌ Electron app failed to start properly');
    }
    
    if (errorOutput.length > 0) {
        console.log('\n⚠️  ERRORS DETECTED:');
        console.log(errorOutput);
    }
    
    // Analyze common issues
    console.log('\n💡 ANALYSIS:');
    
    if (errorOutput.includes('Cannot find module')) {
        console.log('- Missing module dependencies detected');
        console.log('- Run: npm install');
    }
    
    if (errorOutput.includes('electron-main.js')) {
        console.log('- Using wrong main file (should use electron/main.js)');
        console.log('- Update package.json or rename file');
    }
    
    if (errorOutput.includes('port') || errorOutput.includes('EADDRINUSE')) {
        console.log('- Port conflict detected');
        console.log('- Kill existing processes or change ports');
    }
    
    if (!hasStarted && code !== 0) {
        console.log('- Electron failed to initialize properly');
        console.log('- Check the error messages above for details');
    }
    
    console.log('\n✅ Test completed. Check results above.');
});

console.log('💡 Press Ctrl+C to stop the test early if needed.\n');
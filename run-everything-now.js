#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 RUN EVERYTHING NOW - FINAL ATTEMPT');
console.log('====================================\n');

// Step 1: Check what we have
console.log('📋 CHECKING SYSTEM STATUS:');
console.log('✅ character-system-max.js:', fs.existsSync('./character-system-max.js'));
console.log('✅ execute-character-system.js:', fs.existsSync('./execute-character-system.js'));
console.log('✅ services directory:', fs.existsSync('./services'));
console.log('✅ node_modules:', fs.existsSync('./node_modules'));
console.log('✅ package.json:', fs.existsSync('./package.json'));

// Step 2: Install dependencies if needed
if (!fs.existsSync('./node_modules')) {
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (e) {
    console.log('❌ npm install failed');
    console.log('Trying manual install...');
    
    const essentialPackages = ['express', 'ws', 'multer', 'node-fetch'];
    essentialPackages.forEach(pkg => {
      try {
        console.log(`Installing ${pkg}...`);
        execSync(`npm install ${pkg}`, { stdio: 'pipe' });
        console.log(`✅ ${pkg} installed`);
      } catch (e2) {
        console.log(`❌ ${pkg} failed`);
      }
    });
  }
}

// Step 3: Create .env if needed
if (!fs.existsSync('./.env')) {
  console.log('\n🔧 Creating .env file...');
  const envContent = `# Document Generator Environment
API_PORT=3001
WEB_PORT=8888
WEBSOCKET_PORT=8889
OLLAMA_HOST=http://localhost:11434
NODE_ENV=development
DEBUG=document-generator:*
ENABLE_SOVEREIGN_AGENTS=true
ENABLE_HUMAN_APPROVAL=true
`;
  fs.writeFileSync('./.env', envContent);
  console.log('✅ .env file created');
}

// Step 4: Create required directories
const dirs = ['./db', './uploads', './logs', './cache'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created ${dir}`);
  }
});

// Step 5: Try to run the system
console.log('\n🎭 STARTING SYSTEM:');
console.log('Attempting to start character system...\n');

// Try multiple approaches
const attempts = [
  {
    name: 'Character System',
    command: 'node',
    args: ['character-system-max.js'],
    port: null
  },
  {
    name: 'Web Interface',
    command: 'node',
    args: ['execute-character-system.js'],
    port: 8888
  },
  {
    name: 'CLI Interface',
    command: 'node',
    args: ['cli.js'],
    port: null
  }
];

function tryNextAttempt(index = 0) {
  if (index >= attempts.length) {
    console.log('\n❌ All attempts failed');
    console.log('\nManual commands to try:');
    console.log('1. node character-system-max.js');
    console.log('2. node execute-character-system.js');
    console.log('3. node minimal-test.js');
    return;
  }
  
  const attempt = attempts[index];
  console.log(`\n🔄 Attempting: ${attempt.name}`);
  
  const proc = spawn(attempt.command, attempt.args, {
    stdio: 'inherit'
  });
  
  // Success handler
  proc.on('spawn', () => {
    console.log(`✅ ${attempt.name} started successfully!`);
    if (attempt.port) {
      console.log(`🌐 Access at: http://localhost:${attempt.port}`);
    }
  });
  
  // Error handler
  proc.on('error', (err) => {
    console.log(`❌ ${attempt.name} failed: ${err.message}`);
    console.log('Trying next option...');
    tryNextAttempt(index + 1);
  });
  
  // Exit handler
  proc.on('exit', (code) => {
    if (code !== 0) {
      console.log(`⚠️  ${attempt.name} exited with code ${code}`);
      console.log('Trying next option...');
      tryNextAttempt(index + 1);
    }
  });
}

// Start the first attempt
tryNextAttempt();
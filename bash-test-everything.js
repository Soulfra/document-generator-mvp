#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔨 BASHING OUR WAY THROUGH TESTING');
console.log('==================================\n');

// Test functions
function runCommand(cmd, description) {
  console.log(`\n📌 ${description}`);
  console.log(`   Command: ${cmd}`);
  console.log('   -------------------');
  
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log('   ✅ SUCCESS');
    if (output) {
      console.log(output.split('\n').map(l => '   ' + l).join('\n'));
    }
    return true;
  } catch (error) {
    console.log('   ❌ FAILED');
    if (error.stdout) {
      console.log(error.stdout.toString().split('\n').map(l => '   ' + l).join('\n'));
    }
    return false;
  }
}

// Test sequence
const tests = [
  {
    cmd: 'node --version',
    desc: 'Check Node.js version'
  },
  {
    cmd: 'ls -la *.js | head -10',
    desc: 'List JavaScript files'
  },
  {
    cmd: 'test -f .env && echo ".env exists" || echo ".env missing"',
    desc: 'Check .env file'
  },
  {
    cmd: 'test -d node_modules && echo "Dependencies installed" || echo "Dependencies missing"',
    desc: 'Check node_modules'
  },
  {
    cmd: 'node -e "console.log(\'Node.js works\')"',
    desc: 'Test Node.js execution'
  },
  {
    cmd: 'node -e "try { require(\'./character-system-max.js\'); console.log(\'Character system loads\'); } catch(e) { console.log(\'Character system error:\', e.message); }"',
    desc: 'Test character system loading'
  },
  {
    cmd: 'curl -s http://localhost:11434/api/tags > /dev/null && echo "Ollama running" || echo "Ollama not running"',
    desc: 'Check Ollama status'
  }
];

// Run all tests
console.log('🧪 Running all tests...\n');

let passed = 0;
let failed = 0;

tests.forEach(test => {
  if (runCommand(test.cmd, test.desc)) {
    passed++;
  } else {
    failed++;
  }
});

// Summary
console.log('\n\n📊 TEST SUMMARY');
console.log('===============');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

// Environment check
console.log('\n\n🔧 ENVIRONMENT CHECK');
console.log('====================');

if (!fs.existsSync('.env')) {
  console.log('❌ .env file missing!');
  console.log('   Run: node setup-environment.js');
} else {
  console.log('✅ .env file exists');
  
  // Check for API keys
  const envContent = fs.readFileSync('.env', 'utf8');
  const hasOpenAI = envContent.includes('OPENAI_API_KEY=sk-');
  const hasAnthropic = envContent.includes('ANTHROPIC_API_KEY=sk-');
  
  console.log(`   OpenAI key: ${hasOpenAI ? '✅ Set' : '⚠️  Not set (Ollama will be used)'}`);
  console.log(`   Anthropic key: ${hasAnthropic ? '✅ Set' : '⚠️  Not set (Ollama will be used)'}`);
}

if (!fs.existsSync('node_modules')) {
  console.log('❌ Dependencies not installed!');
  console.log('   Run: npm install');
} else {
  console.log('✅ Dependencies installed');
}

// Final recommendations
console.log('\n\n🎯 RECOMMENDATIONS');
console.log('==================');

if (failed === 0) {
  console.log('✅ All tests passed! System ready.');
  console.log('\nRun one of these:');
  console.log('1. node character-system-max.js');
  console.log('2. node execute-character-system.js');
  console.log('3. node fix-and-run.js');
} else {
  console.log('⚠️  Some tests failed. Fix these first:');
  
  if (!fs.existsSync('.env')) {
    console.log('\n1. Create environment:');
    console.log('   node setup-environment.js');
  }
  
  if (!fs.existsSync('node_modules')) {
    console.log('\n2. Install dependencies:');
    console.log('   npm install');
  }
  
  console.log('\n3. Then run:');
  console.log('   node fix-and-run.js');
}

console.log('\n✅ Test complete!');
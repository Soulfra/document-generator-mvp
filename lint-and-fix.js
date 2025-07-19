#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 CHECKING FOR LINT/DEPENDENCY ISSUES\n');

// Check package.json dependencies
console.log('📋 Checking package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log('Dependencies:', Object.keys(pkg.dependencies || {}).join(', '));
  
  // Check if each dependency is installed
  const missing = [];
  Object.keys(pkg.dependencies || {}).forEach(dep => {
    if (!fs.existsSync(`./node_modules/${dep}`)) {
      missing.push(dep);
    }
  });
  
  if (missing.length > 0) {
    console.log(`\n❌ Missing dependencies: ${missing.join(', ')}`);
    console.log('Installing missing dependencies...');
    
    missing.forEach(dep => {
      try {
        console.log(`Installing ${dep}...`);
        execSync(`npm install ${dep}`, { stdio: 'inherit' });
      } catch (e) {
        console.log(`Failed to install ${dep}`);
      }
    });
  } else {
    console.log('✅ All dependencies installed');
  }
} catch (e) {
  console.log('❌ Error reading package.json');
}

// Check for syntax errors in main files
console.log('\n📋 Checking syntax...');
const filesToCheck = [
  'character-system-max.js',
  'execute-character-system.js',
  'tier-connector.js',
  'cli.js'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      // Try to parse the file
      const content = fs.readFileSync(file, 'utf8');
      new Function(content);
      console.log(`✅ ${file} - syntax OK`);
    } catch (e) {
      console.log(`❌ ${file} - syntax error: ${e.message.split('\n')[0]}`);
      
      // Common fixes
      if (e.message.includes('Unexpected token')) {
        console.log('   Possible issue: ES6 syntax or missing semicolon');
      }
      if (e.message.includes('require is not defined')) {
        console.log('   File uses CommonJS require statements');
      }
    }
  }
});

// Quick eslint check if available
try {
  console.log('\n📋 Running quick lint check...');
  execSync('npx eslint --version', { stdio: 'pipe' });
  
  // Run eslint on character system
  try {
    execSync('npx eslint character-system-max.js --fix', { stdio: 'pipe' });
    console.log('✅ Linted and fixed character-system-max.js');
  } catch (e) {
    console.log('⚠️  Lint issues found but continuing...');
  }
} catch (e) {
  console.log('⏭️  ESLint not available, skipping lint');
}

console.log('\n✅ Lint check complete');
console.log('\n🚀 Try running:');
console.log('   node character-system-max.js');
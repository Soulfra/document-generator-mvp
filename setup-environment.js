#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

console.log('🔧 DOCUMENT GENERATOR - ENVIRONMENT SETUP');
console.log('=========================================\n');

// Check if .env exists
if (fs.existsSync('.env')) {
  console.log('✅ .env file already exists');
  console.log('   To reset, delete .env and run this again\n');
  process.exit(0);
}

// Default environment template
const envTemplate = `# Document Generator Environment Variables
# Generated: ${new Date().toISOString()}

# API Keys (Optional - uses Ollama by default)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# Ollama (Local AI - default)
OLLAMA_HOST=http://localhost:11434

# Server Configuration
API_PORT=3001
WEB_PORT=8888
WEBSOCKET_PORT=8889

# Database
DATABASE_URL=sqlite:./db/document-generator.db
REDIS_URL=redis://localhost:6379

# Storage (Optional)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=document-generator

# Feature Flags
ENABLE_SOVEREIGN_AGENTS=true
ENABLE_HUMAN_APPROVAL=true
ENABLE_ECONOMY_TRACKING=true
ENABLE_GIT_INTEGRATION=true

# AI Service Preferences
DEFAULT_AI_SERVICE=ollama
FALLBACK_AI_SERVICE=openai
MAX_AI_RETRIES=3

# Security
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}

# Monitoring
PROMETHEUS_ENABLED=false
GRAFANA_ENABLED=false

# Development
NODE_ENV=development
DEBUG=document-generator:*
`;

// Create .env file
fs.writeFileSync('.env', envTemplate);
console.log('✅ Created .env file with defaults\n');

// Create .env.example
fs.writeFileSync('.env.example', envTemplate.replace(/=.*/g, '='));
console.log('✅ Created .env.example template\n');

// Check for required services
console.log('📋 CHECKING SERVICES:');
console.log('====================');

// Check Ollama
const checkOllama = async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    console.log('✅ Ollama is running');
    console.log(`   Models: ${data.models?.map(m => m.name).join(', ') || 'None installed'}`);
    
    if (!data.models || data.models.length === 0) {
      console.log('\n⚠️  No Ollama models installed!');
      console.log('   Install with: ollama pull mistral');
    }
  } catch (e) {
    console.log('❌ Ollama not running');
    console.log('   Install from: https://ollama.ai');
    console.log('   Start with: ollama serve');
  }
};

// Create directories
console.log('\n📁 CREATING DIRECTORIES:');
const dirs = ['./db', './uploads', './logs', './cache'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created ${dir}`);
  } else {
    console.log(`✅ ${dir} exists`);
  }
});

// Show next steps
console.log('\n🚀 SETUP COMPLETE!');
console.log('==================');
console.log('\n1. (Optional) Add API keys to .env:');
console.log('   - OPENAI_API_KEY for GPT-4');
console.log('   - ANTHROPIC_API_KEY for Claude');
console.log('\n2. Install Ollama (recommended):');
console.log('   - Download: https://ollama.ai');
console.log('   - Run: ollama pull mistral');
console.log('   - Run: ollama pull codellama');
console.log('\n3. Start the system:');
console.log('   - npm install');
console.log('   - node character-system-max.js');
console.log('   - OR: node fix-and-run.js');

// Check Ollama
checkOllama().catch(() => {});

// Interactive setup option
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n💡 Would you like to add API keys now? (y/N): ');

rl.question('', (answer) => {
  if (answer.toLowerCase() === 'y') {
    rl.question('OpenAI API Key (press Enter to skip): ', (openai) => {
      rl.question('Anthropic API Key (press Enter to skip): ', (anthropic) => {
        
        // Update .env if keys provided
        if (openai || anthropic) {
          let envContent = fs.readFileSync('.env', 'utf8');
          
          if (openai) {
            envContent = envContent.replace('OPENAI_API_KEY=', `OPENAI_API_KEY=${openai}`);
            console.log('✅ Added OpenAI key');
          }
          
          if (anthropic) {
            envContent = envContent.replace('ANTHROPIC_API_KEY=', `ANTHROPIC_API_KEY=${anthropic}`);
            console.log('✅ Added Anthropic key');
          }
          
          fs.writeFileSync('.env', envContent);
          console.log('\n✅ Environment updated!');
        }
        
        rl.close();
        console.log('\n🎯 Ready to run:');
        console.log('   node character-system-max.js');
      });
    });
  } else {
    rl.close();
    console.log('\n✅ Using Ollama (local AI) by default');
    console.log('🎯 Ready to run:');
    console.log('   node character-system-max.js');
  }
});
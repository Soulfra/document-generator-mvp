#!/usr/bin/env node

/**
 * Document Generator Setup Wizard
 * Simple setup for non-technical users
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class DocumentGeneratorSetup {
    constructor() {
        this.config = {
            port: 3000,
            github_client_id: '',
            github_client_secret: ''
        };
    }

    async run() {
        console.log('🚀 Document Generator Setup Wizard');
        console.log('=====================================\n');
        
        try {
            // Check Node.js version
            await this.checkNodeVersion();
            
            // Install dependencies if needed
            await this.installDependencies();
            
            // Setup GitHub OAuth (optional)
            await this.setupGitHubOAuth();
            
            // Create environment file
            await this.createEnvironmentFile();
            
            // Test the setup
            await this.testSetup();
            
            console.log('\n🎉 Setup Complete!');
            console.log('\nTo start the Document Generator:');
            console.log('1. Run: npm start');
            console.log('2. Open your browser to: http://localhost:3000');
            console.log('\n📚 Documentation: http://localhost:3000/docs/');
            
        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            console.log('\nFor help, check the README.md file or documentation.');
        } finally {
            rl.close();
        }
    }

    async checkNodeVersion() {
        return new Promise((resolve, reject) => {
            exec('node --version', (error, stdout) => {
                if (error) {
                    reject(new Error('Node.js is not installed. Please install Node.js from https://nodejs.org/'));
                    return;
                }
                
                const version = stdout.trim();
                const major = parseInt(version.substring(1));
                
                if (major < 16) {
                    reject(new Error(`Node.js ${version} is too old. Please install Node.js 16 or later.`));
                    return;
                }
                
                console.log('✅ Node.js version:', version);
                resolve();
            });
        });
    }

    async installDependencies() {
        console.log('\n📦 Checking dependencies...');
        
        // Check if package.json exists
        if (!fs.existsSync('package.json')) {
            console.log('Creating package.json...');
            await this.createPackageJson();
        }

        // Check if node_modules exists
        if (!fs.existsSync('node_modules')) {
            console.log('Installing dependencies (this may take a moment)...');
            
            return new Promise((resolve, reject) => {
                exec('npm install', (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`Failed to install dependencies: ${error.message}`));
                        return;
                    }
                    console.log('✅ Dependencies installed');
                    resolve();
                });
            });
        } else {
            console.log('✅ Dependencies already installed');
        }
    }

    async createPackageJson() {
        const packageJson = {
            "name": "document-generator",
            "version": "1.0.0",
            "description": "Transform documents into working MVPs",
            "main": "oauth-server.js",
            "scripts": {
                "start": "node oauth-server.js",
                "dev": "node oauth-server.js",
                "setup": "node setup.js",
                "test": "node test-connections.js"
            },
            "dependencies": {
                "express": "^4.18.2",
                "cors": "^2.8.5",
                "cookie-parser": "^1.4.6",
                "dotenv": "^16.3.1"
            },
            "engines": {
                "node": ">=16.0.0"
            },
            "keywords": ["mvp", "github", "oauth", "document", "generator"],
            "author": "Document Generator",
            "license": "MIT"
        };

        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Created package.json');
    }

    async setupGitHubOAuth() {
        console.log('\n🔐 GitHub OAuth Setup (Optional)');
        console.log('This allows you to import documents from your GitHub repositories.');
        
        const useGitHub = await this.prompt('Do you want to setup GitHub integration? (y/N): ');
        
        if (useGitHub.toLowerCase() !== 'y') {
            console.log('⏭️  Skipping GitHub OAuth setup');
            return;
        }

        console.log('\nTo setup GitHub OAuth:');
        console.log('1. Go to: https://github.com/settings/developers');
        console.log('2. Click "New OAuth App"');
        console.log('3. Use these settings:');
        console.log('   - Application name: Document Generator');
        console.log('   - Homepage URL: http://localhost:3000');
        console.log('   - Authorization callback URL: http://localhost:3000/auth/github/callback');
        console.log('4. Click "Register application"');
        console.log('5. Copy the Client ID and Client Secret\n');

        this.config.github_client_id = await this.prompt('GitHub Client ID (press Enter to skip): ');
        
        if (this.config.github_client_id) {
            this.config.github_client_secret = await this.prompt('GitHub Client Secret: ');
            console.log('✅ GitHub OAuth configured');
        } else {
            console.log('⏭️  Skipping GitHub OAuth (you can set this up later)');
        }
    }

    async createEnvironmentFile() {
        console.log('\n📝 Creating configuration file...');
        
        const envContent = [
            '# Document Generator Configuration',
            '# Generated by setup wizard',
            '',
            `PORT=${this.config.port}`,
            '',
            '# GitHub OAuth (optional)',
            `GITHUB_CLIENT_ID=${this.config.github_client_id}`,
            `GITHUB_CLIENT_SECRET=${this.config.github_client_secret}`,
            '',
            '# Uncomment and configure these for cloud AI services:',
            '# OPENAI_API_KEY=your_openai_key_here',
            '# ANTHROPIC_API_KEY=your_anthropic_key_here',
            '',
            '# Local AI (Ollama) - automatically detected if running',
            '# OLLAMA_URL=http://localhost:11434',
            ''
        ].join('\n');

        fs.writeFileSync('.env', envContent);
        console.log('✅ Created .env configuration file');
    }

    async testSetup() {
        console.log('\n🧪 Testing setup...');

        // Check if required files exist
        const requiredFiles = [
            'oauth-server.js',
            'github-api-client.js', 
            'portal/index.html',
            'docs/index.html'
        ];

        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
        }

        console.log('✅ All required files found');
        console.log('✅ Setup test passed');
    }

    async prompt(question) {
        return new Promise(resolve => {
            rl.question(question, resolve);
        });
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new DocumentGeneratorSetup();
    setup.run();
}

module.exports = DocumentGeneratorSetup;
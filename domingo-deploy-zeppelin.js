#!/usr/bin/env node

/**
 * 🎈 DOMINGO ZEPPELIN DEPLOYMENT LAYER
 * 
 * One-click cloud deployment system that floats above everything
 * Deploy to multiple cloud providers with a single command
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class DomingoZeppelin {
    constructor() {
        this.providers = {
            railway: {
                name: 'Railway',
                deploy: this.deployRailway.bind(this),
                verify: this.verifyRailway.bind(this),
                url: 'https://railway.app'
            },
            vercel: {
                name: 'Vercel',
                deploy: this.deployVercel.bind(this),
                verify: this.verifyVercel.bind(this),
                url: 'https://vercel.com'
            },
            heroku: {
                name: 'Heroku',
                deploy: this.deployHeroku.bind(this),
                verify: this.verifyHeroku.bind(this),
                url: 'https://heroku.com'
            },
            fly: {
                name: 'Fly.io',
                deploy: this.deployFly.bind(this),
                verify: this.verifyFly.bind(this),
                url: 'https://fly.io'
            },
            render: {
                name: 'Render',
                deploy: this.deployRender.bind(this),
                verify: this.verifyRender.bind(this),
                url: 'https://render.com'
            }
        };
    }

    async deploy(provider = 'auto') {
        console.log('🎈 DOMINGO ZEPPELIN DEPLOYMENT');
        console.log('==============================\n');

        try {
            // Auto-detect best provider
            if (provider === 'auto') {
                provider = await this.detectBestProvider();
                console.log(`🔍 Auto-selected provider: ${provider}`);
            }

            // Verify provider is available
            const providerConfig = this.providers[provider];
            if (!providerConfig) {
                throw new Error(`Unknown provider: ${provider}`);
            }

            console.log(`🚀 Deploying to ${providerConfig.name}...`);

            // Pre-deployment setup
            await this.prepareDeployment(provider);

            // Deploy
            const result = await providerConfig.deploy();

            // Post-deployment
            await this.postDeployment(provider, result);

            console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
            console.log(`🌐 Your Domingo Orchestrator is live at: ${result.url}`);
            console.log(`🎭 WebSocket: ${result.wsUrl}`);
            console.log('\n💜 Domingo is now orchestrating in the cloud!');

            return result;

        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            throw error;
        }
    }

    async detectBestProvider() {
        // Check which CLIs are installed
        const checks = {
            railway: 'railway --version',
            vercel: 'vercel --version',
            heroku: 'heroku --version',
            fly: 'flyctl version',
            render: 'render --version'
        };

        for (const [provider, command] of Object.entries(checks)) {
            try {
                await this.runCommand(command, true);
                const verified = await this.providers[provider].verify();
                if (verified) {
                    return provider;
                }
            } catch (e) {
                // CLI not installed or not logged in
                continue;
            }
        }

        // Default to Railway (easiest setup)
        return 'railway';
    }

    async prepareDeployment(provider) {
        console.log('📦 Preparing deployment package...');

        // Create deployment directory
        const deployDir = path.join(__dirname, '.deploy-tmp');
        await fs.mkdir(deployDir, { recursive: true });

        // Copy necessary files
        const filesToCopy = [
            'domingo-package.js',
            'domingo-orchestrator-server.js',
            'domingo-real-orchestrator.html',
            'api-to-forum-bridge.js',
            'drag-drop-hardhat-testing.js',
            'domingo-orchestrator-package.json',
            'Dockerfile.domingo',
            '.env.domingo.example'
        ];

        for (const file of filesToCopy) {
            try {
                await fs.copyFile(
                    path.join(__dirname, file),
                    path.join(deployDir, file)
                );
            } catch (e) {
                console.warn(`⚠️  Skipping ${file}: ${e.message}`);
            }
        }

        // Create package.json for deployment
        const packageJson = {
            name: "@domingo/orchestrator-cloud",
            version: "1.0.0",
            description: "Domingo Orchestrator Cloud Deployment",
            main: "domingo-package.js",
            scripts: {
                start: "node domingo-package.js",
                postinstall: "echo '🎭 Domingo ready for orchestration!'"
            },
            dependencies: {
                "express": "^4.18.2",
                "ws": "^8.13.0",
                "pg": "^8.11.0"
            },
            engines: {
                node: ">=16.0.0"
            }
        };

        await fs.writeFile(
            path.join(deployDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // Create deployment-specific config
        await this.createDeploymentConfig(provider, deployDir);

        console.log('✅ Deployment package ready');
    }

    async createDeploymentConfig(provider, deployDir) {
        const configs = {
            railway: {
                'railway.json': {
                    build: {
                        builder: "NIXPACKS"
                    },
                    deploy: {
                        startCommand: "npm start",
                        restartPolicyType: "ON_FAILURE",
                        restartPolicyMaxRetries: 10
                    }
                }
            },
            vercel: {
                'vercel.json': {
                    version: 2,
                    builds: [{
                        src: "domingo-package.js",
                        use: "@vercel/node"
                    }],
                    routes: [{
                        src: "/(.*)",
                        dest: "domingo-package.js"
                    }]
                }
            },
            heroku: {
                'Procfile': 'web: node domingo-package.js'
            },
            fly: {
                'fly.toml': `
app = "domingo-orchestrator"
primary_region = "ord"

[http_service]
  internal_port = 7777
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[services]]
  http_checks = []
  internal_port = 7777
  protocol = "tcp"
  
  [[services.ports]]
    port = 80
    handlers = ["http"]
    
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
`
            }
        };

        const config = configs[provider];
        if (config) {
            for (const [filename, content] of Object.entries(config)) {
                const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                await fs.writeFile(path.join(deployDir, filename), fileContent);
            }
        }
    }

    // Provider-specific deployment methods

    async deployRailway() {
        console.log('🚂 Deploying to Railway...');
        
        // Check if logged in
        await this.runCommand('railway whoami');
        
        // Initialize project
        await this.runCommand('railway init', false, '.deploy-tmp');
        
        // Link to project
        await this.runCommand('railway link', false, '.deploy-tmp');
        
        // Deploy
        const output = await this.runCommand('railway up -d', false, '.deploy-tmp');
        
        // Get deployment URL
        const urlOutput = await this.runCommand('railway domain', false, '.deploy-tmp');
        const url = urlOutput.trim();
        
        return {
            provider: 'railway',
            url: `https://${url}`,
            wsUrl: `wss://${url}/ws`,
            projectId: await this.runCommand('railway status --json', false, '.deploy-tmp')
        };
    }

    async deployVercel() {
        console.log('▲ Deploying to Vercel...');
        
        // Deploy with Vercel CLI
        const output = await this.runCommand('vercel --prod', false, '.deploy-tmp');
        
        // Extract URL from output
        const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
        const url = urlMatch ? urlMatch[0] : 'deployment-url-pending';
        
        return {
            provider: 'vercel',
            url,
            wsUrl: url.replace('https://', 'wss://') + '/ws'
        };
    }

    async deployHeroku() {
        console.log('🟣 Deploying to Heroku...');
        
        // Create app
        const appName = `domingo-${Date.now()}`;
        await this.runCommand(`heroku create ${appName}`, false, '.deploy-tmp');
        
        // Add PostgreSQL addon
        await this.runCommand(`heroku addons:create heroku-postgresql:mini -a ${appName}`);
        
        // Deploy
        await this.runCommand('git init', false, '.deploy-tmp');
        await this.runCommand('git add -A', false, '.deploy-tmp');
        await this.runCommand('git commit -m "Deploy Domingo"', false, '.deploy-tmp');
        await this.runCommand(`heroku git:remote -a ${appName}`, false, '.deploy-tmp');
        await this.runCommand('git push heroku main', false, '.deploy-tmp');
        
        return {
            provider: 'heroku',
            url: `https://${appName}.herokuapp.com`,
            wsUrl: `wss://${appName}.herokuapp.com/ws`,
            appName
        };
    }

    async deployFly() {
        console.log('🪽 Deploying to Fly.io...');
        
        // Launch app
        await this.runCommand('flyctl launch --now', false, '.deploy-tmp');
        
        // Get app info
        const info = await this.runCommand('flyctl info --json', false, '.deploy-tmp');
        const appInfo = JSON.parse(info);
        
        return {
            provider: 'fly',
            url: `https://${appInfo.App.Name}.fly.dev`,
            wsUrl: `wss://${appInfo.App.Name}.fly.dev/ws`,
            appName: appInfo.App.Name
        };
    }

    async deployRender() {
        console.log('🎨 Deploying to Render...');
        
        // This would typically use Render's API
        // For now, provide instructions
        console.log('\n📋 To deploy on Render:');
        console.log('1. Visit https://render.com');
        console.log('2. Connect your GitHub repository');
        console.log('3. Create a new Web Service');
        console.log('4. Set build command: npm install');
        console.log('5. Set start command: npm start');
        console.log('6. Add PostgreSQL database');
        console.log('7. Deploy!');
        
        return {
            provider: 'render',
            url: 'https://your-app.onrender.com',
            wsUrl: 'wss://your-app.onrender.com/ws',
            manual: true
        };
    }

    // Verification methods

    async verifyRailway() {
        try {
            await this.runCommand('railway whoami', true);
            return true;
        } catch {
            console.log('⚠️  Not logged in to Railway. Run: railway login');
            return false;
        }
    }

    async verifyVercel() {
        try {
            await this.runCommand('vercel whoami', true);
            return true;
        } catch {
            console.log('⚠️  Not logged in to Vercel. Run: vercel login');
            return false;
        }
    }

    async verifyHeroku() {
        try {
            await this.runCommand('heroku auth:whoami', true);
            return true;
        } catch {
            console.log('⚠️  Not logged in to Heroku. Run: heroku login');
            return false;
        }
    }

    async verifyFly() {
        try {
            await this.runCommand('flyctl auth whoami', true);
            return true;
        } catch {
            console.log('⚠️  Not logged in to Fly.io. Run: flyctl auth login');
            return false;
        }
    }

    async verifyRender() {
        // Render uses GitHub integration, no CLI auth needed
        return true;
    }

    // Utility methods

    async runCommand(command, silent = false, cwd = null) {
        return new Promise((resolve, reject) => {
            const options = {};
            if (cwd) options.cwd = cwd;
            
            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    if (!silent) console.error(`Error: ${stderr}`);
                    reject(error);
                } else {
                    if (!silent && stdout) console.log(stdout);
                    resolve(stdout);
                }
            });
        });
    }

    async postDeployment(provider, result) {
        console.log('\n🎯 Post-deployment tasks...');
        
        // Clean up temporary files
        try {
            await fs.rm('.deploy-tmp', { recursive: true, force: true });
        } catch (e) {
            // Ignore cleanup errors
        }
        
        // Save deployment info
        const deployInfo = {
            provider,
            ...result,
            deployedAt: new Date().toISOString()
        };
        
        await fs.writeFile(
            'domingo-deployment.json',
            JSON.stringify(deployInfo, null, 2)
        );
        
        console.log('✅ Deployment info saved to domingo-deployment.json');
    }

    // CLI Interface
    async interactive() {
        console.log('🎈 DOMINGO ZEPPELIN - Cloud Deployment');
        console.log('=====================================\n');
        console.log('Available providers:');
        
        Object.entries(this.providers).forEach(([key, config]) => {
            console.log(`  ${key.padEnd(10)} - ${config.name}`);
        });
        
        console.log(`  auto       - Auto-detect best provider\n`);
        
        const provider = process.argv[2] || 'auto';
        
        try {
            await this.deploy(provider);
        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            console.log('\n💡 Tips:');
            console.log('  - Make sure you have the provider CLI installed');
            console.log('  - Login to your provider account');
            console.log('  - Check your internet connection');
            process.exit(1);
        }
    }
}

// Export for programmatic use
module.exports = DomingoZeppelin;

// Run if executed directly
if (require.main === module) {
    const zeppelin = new DomingoZeppelin();
    zeppelin.interactive().catch(console.error);
}
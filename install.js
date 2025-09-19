#!/usr/bin/env node

/**
 * Document Generator - Interactive Installation Wizard
 * Guides users through setup with a friendly Node.js interface
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Utility functions
const print = {
    header: (text) => console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`),
    title: (text) => console.log(`${colors.blue}${text}${colors.reset}`),
    success: (text) => console.log(`${colors.green}✓ ${text}${colors.reset}`),
    error: (text) => console.log(`${colors.red}✗ ${text}${colors.reset}`),
    warning: (text) => console.log(`${colors.yellow}⚠ ${text}${colors.reset}`),
    info: (text) => console.log(`${colors.cyan}ℹ ${text}${colors.reset}`),
    dim: (text) => console.log(`${colors.dim}${text}${colors.reset}`)
};

class InstallWizard {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.config = {
            vault: {},
            ai: {},
            database: {},
            services: {},
            deployment: {}
        };
        
        this.envContent = '';
    }
    
    async prompt(question, defaultValue = '') {
        return new Promise((resolve) => {
            const q = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
            this.rl.question(q, (answer) => {
                resolve(answer || defaultValue);
            });
        });
    }
    
    async confirm(question, defaultValue = true) {
        const answer = await this.prompt(`${question} (y/n)`, defaultValue ? 'y' : 'n');
        return answer.toLowerCase() === 'y';
    }
    
    async select(question, options) {
        console.log(`\n${question}`);
        options.forEach((opt, i) => {
            console.log(`  ${i + 1}. ${opt.label}`);
        });
        
        const choice = await this.prompt('Select option', '1');
        const index = parseInt(choice) - 1;
        
        if (index >= 0 && index < options.length) {
            return options[index].value;
        }
        
        print.warning('Invalid selection, using default');
        return options[0].value;
    }
    
    async checkPrerequisites() {
        print.header();
        print.title('Checking Prerequisites');
        print.header();
        
        const checks = [
            { cmd: 'node', name: 'Node.js', version: '--version', minVersion: '18' },
            { cmd: 'npm', name: 'npm', version: '--version' },
            { cmd: 'docker', name: 'Docker', version: '--version', optional: true },
            { cmd: 'git', name: 'Git', version: '--version' }
        ];
        
        let hasErrors = false;
        
        for (const check of checks) {
            try {
                const version = execSync(`${check.cmd} ${check.version}`, { encoding: 'utf8' }).trim();
                print.success(`${check.name} installed: ${version}`);
                
                if (check.minVersion) {
                    const currentVersion = version.match(/(\d+)/)?.[1];
                    if (currentVersion && parseInt(currentVersion) < parseInt(check.minVersion)) {
                        print.warning(`${check.name} version ${check.minVersion}+ required`);
                        if (!check.optional) hasErrors = true;
                    }
                }
            } catch (error) {
                if (check.optional) {
                    print.warning(`${check.name} not found (optional)`);
                } else {
                    print.error(`${check.name} not found (required)`);
                    hasErrors = true;
                }
            }
        }
        
        if (hasErrors) {
            print.error('\nPlease install missing prerequisites and try again');
            process.exit(1);
        }
        
        print.success('\nAll prerequisites met!');
    }
    
    async setupVault() {
        print.header();
        print.title('Security Vault Setup');
        print.header();
        
        print.info('The vault securely stores sensitive data like API keys');
        
        // Check if vault already exists
        try {
            const vaultConfig = await fs.readFile('.vault/.config', 'utf8');
            const useExisting = await this.confirm('Vault already exists. Use existing vault?');
            
            if (useExisting) {
                print.success('Using existing vault');
                return;
            }
        } catch (error) {
            // Vault doesn't exist, create new one
        }
        
        print.info('Creating new security vault...');
        
        // Generate vault keys
        const masterKey = crypto.randomBytes(32).toString('hex');
        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 100000;
        
        // Create vault directory
        await fs.mkdir('.vault', { recursive: true });
        await fs.mkdir('.vault/keys', { recursive: true });
        
        // Save vault config
        const vaultConfig = {
            version: '1.0.0',
            created: new Date().toISOString(),
            algorithm: 'aes-256-gcm',
            iterations
        };
        
        await fs.writeFile('.vault/.config', JSON.stringify(vaultConfig, null, 2));
        
        // Save to config
        this.config.vault = {
            masterKey,
            salt,
            iterations
        };
        
        print.success('Vault created successfully');
        print.warning('Keep your vault keys secure!');
    }
    
    async setupAIServices() {
        print.header();
        print.title('AI Services Configuration');
        print.header();
        
        const setupAI = await this.confirm('Configure AI services?');
        if (!setupAI) {
            print.info('Skipping AI configuration');
            return;
        }
        
        // Local AI (Ollama)
        const useOllama = await this.confirm('Use Ollama for free local AI?', true);
        this.config.ai.ollama = {
            enabled: useOllama,
            host: 'http://localhost:11434'
        };
        
        if (useOllama) {
            print.info('Ollama will be installed automatically');
            print.dim('Models: codellama, mistral, llama2, phi');
        }
        
        // OpenAI
        const useOpenAI = await this.confirm('Use OpenAI GPT models?', false);
        if (useOpenAI) {
            const apiKey = await this.prompt('Enter OpenAI API key (or "skip")');
            if (apiKey && apiKey !== 'skip') {
                this.config.ai.openai = {
                    enabled: true,
                    apiKey
                };
                print.success('OpenAI configured');
            }
        }
        
        // Anthropic Claude
        const useClaude = await this.confirm('Use Anthropic Claude?', false);
        if (useClaude) {
            const apiKey = await this.prompt('Enter Anthropic API key (or "skip")');
            if (apiKey && apiKey !== 'skip') {
                this.config.ai.anthropic = {
                    enabled: true,
                    apiKey
                };
                print.success('Anthropic configured');
            }
        }
        
        // Other AI services
        const otherAI = await this.select('Additional AI services?', [
            { label: 'None', value: 'none' },
            { label: 'Google AI (Gemini)', value: 'google' },
            { label: 'Replicate', value: 'replicate' },
            { label: 'Hugging Face', value: 'huggingface' }
        ]);
        
        if (otherAI !== 'none') {
            const apiKey = await this.prompt(`Enter ${otherAI} API key (or "skip")`);
            if (apiKey && apiKey !== 'skip') {
                this.config.ai[otherAI] = {
                    enabled: true,
                    apiKey
                };
            }
        }
    }
    
    async setupDatabase() {
        print.header();
        print.title('Database Configuration');
        print.header();
        
        const dbType = await this.select('Select database type:', [
            { label: 'SQLite (Simple, no setup required)', value: 'sqlite' },
            { label: 'PostgreSQL (Scalable, recommended for production)', value: 'postgresql' },
            { label: 'MySQL', value: 'mysql' }
        ]);
        
        this.config.database.type = dbType;
        
        if (dbType === 'sqlite') {
            this.config.database.url = 'sqlite:./data/document-generator.db';
            print.success('SQLite configured');
        } else {
            const host = await this.prompt('Database host', 'localhost');
            const port = await this.prompt('Database port', dbType === 'postgresql' ? '5432' : '3306');
            const name = await this.prompt('Database name', 'document_generator');
            const user = await this.prompt('Database user', dbType === 'postgresql' ? 'postgres' : 'root');
            const password = await this.prompt('Database password');
            
            this.config.database.url = `${dbType}://${user}:${password}@${host}:${port}/${name}`;
            print.success(`${dbType} configured`);
        }
    }
    
    async setupOptionalServices() {
        print.header();
        print.title('Optional Services');
        print.header();
        
        // Payment processing
        const usePayments = await this.confirm('Configure payment processing (Stripe)?', false);
        if (usePayments) {
            const secretKey = await this.prompt('Stripe secret key (or "skip")');
            if (secretKey && secretKey !== 'skip') {
                this.config.services.stripe = {
                    enabled: true,
                    secretKey
                };
                print.success('Stripe configured');
            }
        }
        
        // Email notifications
        const useEmail = await this.confirm('Configure email notifications?', false);
        if (useEmail) {
            const emailProvider = await this.select('Email provider:', [
                { label: 'SMTP (Gmail, etc.)', value: 'smtp' },
                { label: 'Resend', value: 'resend' },
                { label: 'SendGrid', value: 'sendgrid' }
            ]);
            
            this.config.services.email = {
                provider: emailProvider,
                enabled: true
            };
            
            // Provider-specific config would go here
            print.info('Email configuration saved (edit .env for details)');
        }
        
        // Monitoring
        const useMonitoring = await this.confirm('Enable monitoring (Prometheus/Grafana)?', true);
        this.config.services.monitoring = {
            enabled: useMonitoring
        };
    }
    
    async generateEnvFile() {
        print.header();
        print.title('Generating Configuration Files');
        print.header();
        
        // Read template
        const template = await fs.readFile('.env.example', 'utf8');
        let envContent = template;
        
        // Replace vault configuration
        envContent = envContent.replace(
            'VAULT_MASTER_KEY=generate-using-setup-script-do-not-set-manually',
            `VAULT_MASTER_KEY=${this.config.vault.masterKey}`
        );
        envContent = envContent.replace(
            'VAULT_SALT=generate-using-setup-script-do-not-set-manually',
            `VAULT_SALT=${this.config.vault.salt}`
        );
        
        // Replace database URL
        envContent = envContent.replace(
            'DATABASE_URL=sqlite:./data/document-generator.db',
            `DATABASE_URL=${this.config.database.url}`
        );
        
        // Replace AI keys
        if (this.config.ai.openai?.apiKey) {
            envContent = envContent.replace(
                /OPENAI_API_KEY=.*/,
                `OPENAI_API_KEY=${this.config.ai.openai.apiKey}`
            );
        }
        
        if (this.config.ai.anthropic?.apiKey) {
            envContent = envContent.replace(
                /ANTHROPIC_API_KEY=.*/,
                `ANTHROPIC_API_KEY=${this.config.ai.anthropic.apiKey}`
            );
        }
        
        // Enable/disable services
        envContent = envContent.replace(
            'ENABLE_LOCAL_AI=true',
            `ENABLE_LOCAL_AI=${this.config.ai.ollama?.enabled || false}`
        );
        
        // Save .env file
        await fs.writeFile('.env', envContent);
        print.success('Generated .env file');
        
        // Create necessary directories
        const dirs = ['data', 'logs', 'scripts', 'config', '.vault/keys'];
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        print.success('Created directory structure');
    }
    
    async installDependencies() {
        print.header();
        print.title('Installing Dependencies');
        print.header();
        
        const installNpm = await this.confirm('Install npm dependencies?', true);
        if (installNpm) {
            print.info('Installing npm packages...');
            execSync('npm install', { stdio: 'inherit' });
            print.success('npm dependencies installed');
        }
        
        if (this.config.services.monitoring?.enabled) {
            const startDocker = await this.confirm('Start Docker services?', true);
            if (startDocker) {
                print.info('Starting Docker containers...');
                try {
                    execSync('docker-compose up -d', { stdio: 'inherit' });
                    print.success('Docker services started');
                } catch (error) {
                    print.warning('Failed to start Docker services');
                    print.dim('You can start them later with: docker-compose up -d');
                }
            }
        }
    }
    
    async showSummary() {
        print.header();
        print.title('🎉 Installation Complete!');
        print.header();
        
        console.log('\n📋 Configuration Summary:');
        console.log(`  • Database: ${this.config.database.type}`);
        console.log(`  • AI Services: ${Object.keys(this.config.ai).filter(k => this.config.ai[k]?.enabled).join(', ') || 'None'}`);
        console.log(`  • Vault: Initialized`);
        
        console.log('\n🚀 Next Steps:');
        console.log('  1. Review and update .env file if needed');
        console.log('  2. Run validation: node scripts/validate-env.js');
        console.log('  3. Start services: npm start');
        console.log('  4. Access dashboard: http://localhost:8080');
        
        console.log('\n📚 Documentation:');
        console.log('  • README.md - Getting started');
        console.log('  • API_KEYS.md - API key setup guide');
        console.log('  • SECURITY.md - Security best practices');
        
        console.log('\n🔑 Security Reminder:');
        console.log('  • Keep your .env file secure');
        console.log('  • Never commit sensitive data');
        console.log('  • Use vault for API key storage');
        
        print.success('\nSetup wizard complete! Happy coding! 🚀');
    }
    
    async run() {
        console.clear();
        console.log(`
${colors.blue}╔══════════════════════════════════════════════════════╗
║                                                      ║
║          Document Generator Setup Wizard             ║
║                                                      ║
║     Transform documents into MVPs with AI 🚀         ║
║                                                      ║
╚══════════════════════════════════════════════════════╝${colors.reset}
`);
        
        try {
            await this.checkPrerequisites();
            await this.setupVault();
            await this.setupAIServices();
            await this.setupDatabase();
            await this.setupOptionalServices();
            await this.generateEnvFile();
            await this.installDependencies();
            await this.showSummary();
        } catch (error) {
            print.error(`\nSetup failed: ${error.message}`);
            console.error(error);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }
}

// Run the wizard
if (require.main === module) {
    const wizard = new InstallWizard();
    wizard.run().catch(console.error);
}
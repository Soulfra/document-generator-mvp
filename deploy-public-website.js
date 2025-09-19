#!/usr/bin/env node

/**
 * 🌐 PUBLIC WEBSITE DEPLOYMENT AUTOMATION
 * 
 * Automates deployment of the Hello World truth-based interface
 * Supports multiple platforms: GitHub Pages, Vercel, Netlify
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PublicWebsiteDeployer {
    constructor() {
        this.websiteFile = 'hello-world-website.html';
        this.deploymentOptions = [
            'github-pages',
            'vercel',
            'netlify',
            'static-hosting'
        ];
        
        console.log('🌐 Public Website Deployment Automation initialized');
    }
    
    /**
     * Deploy to GitHub Pages
     */
    async deployToGitHubPages() {
        console.log('\n🐙 Deploying to GitHub Pages...');
        
        try {
            // Create deployment directory
            const deployDir = './public';
            await fs.mkdir(deployDir, { recursive: true });
            
            // Copy website file as index.html
            const websiteContent = await fs.readFile(this.websiteFile, 'utf8');
            await fs.writeFile(path.join(deployDir, 'index.html'), websiteContent);
            
            // Create CNAME file if domain specified
            const customDomain = process.env.CUSTOM_DOMAIN;
            if (customDomain) {
                await fs.writeFile(path.join(deployDir, 'CNAME'), customDomain);
                console.log(`  📍 Custom domain: ${customDomain}`);
            }
            
            // Create README for GitHub Pages
            const readme = this.generateReadme();
            await fs.writeFile(path.join(deployDir, 'README.md'), readme);
            
            console.log('  ✅ Files prepared for GitHub Pages');
            console.log('  📝 Next steps:');
            console.log('    1. Create a new GitHub repository');
            console.log('    2. Push the /public folder to the gh-pages branch');
            console.log('    3. Enable GitHub Pages in repository settings');
            console.log('    4. Your site will be available at: https://yourusername.github.io/repository-name');
            
            return {
                success: true,
                type: 'github-pages',
                files: ['public/index.html', 'public/README.md'],
                instructions: 'Push /public folder to gh-pages branch'
            };
            
        } catch (error) {
            console.error('❌ GitHub Pages deployment failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Deploy to Vercel
     */
    async deployToVercel() {
        console.log('\n⚡ Deploying to Vercel...');
        
        try {
            // Create vercel.json configuration
            const vercelConfig = {
                "version": 2,
                "name": "truth-based-ai",
                "builds": [
                    {
                        "src": "index.html",
                        "use": "@vercel/static"
                    }
                ],
                "routes": [
                    {
                        "src": "/(.*)",
                        "dest": "/index.html"
                    }
                ]
            };
            
            await fs.writeFile('vercel.json', JSON.stringify(vercelConfig, null, 2));
            
            // Copy website as index.html
            const websiteContent = await fs.readFile(this.websiteFile, 'utf8');
            await fs.writeFile('index.html', websiteContent);
            
            // Create package.json for Vercel
            const packageJson = {
                "name": "truth-based-ai-website",
                "version": "1.0.0",
                "description": "Truth-based AI interface with wave-topography analysis",
                "main": "index.html",
                "scripts": {
                    "build": "echo 'Static site - no build needed'",
                    "start": "echo 'Static site - no start needed'"
                }
            };
            
            await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
            
            console.log('  ✅ Vercel configuration created');
            console.log('  📝 Next steps:');
            console.log('    1. Install Vercel CLI: npm i -g vercel');
            console.log('    2. Run: vercel --prod');
            console.log('    3. Your site will be deployed automatically');
            
            return {
                success: true,
                type: 'vercel',
                files: ['vercel.json', 'index.html', 'package.json'],
                command: 'vercel --prod'
            };
            
        } catch (error) {
            console.error('❌ Vercel deployment failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Deploy to Netlify
     */
    async deployToNetlify() {
        console.log('\n🚀 Preparing for Netlify deployment...');
        
        try {
            // Create _redirects file for SPA routing
            const redirects = '/*    /index.html   200';
            await fs.writeFile('_redirects', redirects);
            
            // Copy website as index.html
            const websiteContent = await fs.readFile(this.websiteFile, 'utf8');
            await fs.writeFile('index.html', websiteContent);
            
            // Create netlify.toml configuration
            const netlifyConfig = `
[build]
  publish = "."
  
[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
            `.trim();
            
            await fs.writeFile('netlify.toml', netlifyConfig);
            
            console.log('  ✅ Netlify configuration created');
            console.log('  📝 Deployment options:');
            console.log('    Option 1 - Drag & Drop:');
            console.log('      1. Visit https://app.netlify.com/drop');
            console.log('      2. Drag the current directory to deploy');
            console.log('    Option 2 - CLI:');
            console.log('      1. Install: npm i -g netlify-cli');
            console.log('      2. Run: netlify deploy --prod --dir .');
            
            return {
                success: true,
                type: 'netlify',
                files: ['_redirects', 'index.html', 'netlify.toml'],
                methods: ['drag-drop', 'cli']
            };
            
        } catch (error) {
            console.error('❌ Netlify preparation failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Create deployment package for static hosting
     */
    async createStaticPackage() {
        console.log('\n📦 Creating static hosting package...');
        
        try {
            const packageDir = './static-deployment-package';
            await fs.mkdir(packageDir, { recursive: true });
            
            // Copy website as index.html
            const websiteContent = await fs.readFile(this.websiteFile, 'utf8');
            await fs.writeFile(path.join(packageDir, 'index.html'), websiteContent);
            
            // Create .htaccess for Apache servers
            const htaccess = `
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 1 hour"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
            `.trim();
            
            await fs.writeFile(path.join(packageDir, '.htaccess'), htaccess);
            
            // Create README with deployment instructions
            const deploymentReadme = `
# Truth-Based AI Website - Static Deployment Package

## Files Included
- \`index.html\` - Main website file
- \`.htaccess\` - Apache server configuration
- \`README.md\` - This file

## Deployment Instructions

### Option 1: Traditional Web Hosting
1. Upload all files to your web hosting provider
2. Point your domain to the hosting directory
3. Your site will be live immediately

### Option 2: AWS S3 Static Website
1. Create an S3 bucket
2. Enable static website hosting
3. Upload \`index.html\`
4. Set bucket permissions for public read

### Option 3: Firebase Hosting
1. Install Firebase CLI: \`npm i -g firebase-tools\`
2. Run: \`firebase init hosting\`
3. Deploy: \`firebase deploy\`

### Option 4: Cloudflare Pages
1. Connect your Git repository to Cloudflare Pages
2. Set build command: \`echo "No build needed"\`
3. Set publish directory: \`.\`

## Custom Domain Setup
Once deployed, you can point any domain to your hosting location.

## Site Features
- Complete wave-topography analysis engine
- Piano frequency emotional mapping  
- COBOL-inspired financial categorization
- Truth-based response generation
- Mobile-responsive design
- Zero external dependencies
            `.trim();
            
            await fs.writeFile(path.join(packageDir, 'README.md'), deploymentReadme);
            
            console.log('  ✅ Static package created in ./static-deployment-package/');
            console.log('  📁 Package contents:');
            console.log('    • index.html (main website)');
            console.log('    • .htaccess (Apache configuration)');
            console.log('    • README.md (deployment instructions)');
            
            return {
                success: true,
                type: 'static-package',
                directory: packageDir,
                files: ['index.html', '.htaccess', 'README.md']
            };
            
        } catch (error) {
            console.error('❌ Static package creation failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Generate README for repository
     */
    generateReadme() {
        return `
# Truth-Based AI Website

A transparent, honest AI interface that analyzes your input through wave-topography mathematics and provides responses based only on what you share.

## Features

🎹 **Piano Frequency Analysis** - Maps emotional tone to musical frequencies
🌊 **Wave Topography** - Converts text to mathematical wave patterns  
💰 **Financial Categorization** - COBOL-inspired analysis of financial context
🔍 **Transparent Processing** - Shows exactly how analysis is performed
💯 **Truth-Based Responses** - Only knows what you tell it

## How It Works

1. **Input Analysis** - Your text is analyzed for emotional and financial patterns
2. **Frequency Mapping** - Words are mapped to piano frequencies (220Hz - 523Hz)
3. **Wave Generation** - Creates topographic heights from frequency data
4. **COBOL Processing** - Categorizes financial context (DBT, BAL, REV, PRF, MAX)
5. **Honest Response** - Generates response based only on current input patterns

## Technology

- Pure HTML/CSS/JavaScript (no external dependencies)
- Wave-topography mathematics
- Piano frequency emotional mapping
- Multi-fold compression algorithms
- Financial pattern recognition

## Privacy

- No data storage or tracking
- No external API calls
- Complete client-side processing
- Session-only analysis

## License

MIT License - Feel free to use and modify

---

*Ask me anything. I only know what you tell me.*
        `.trim();
    }
    
    /**
     * Run interactive deployment wizard
     */
    async runDeploymentWizard() {
        console.log('\n🧙‍♂️ Deployment Wizard Starting...\n');
        
        console.log('Available deployment options:');
        this.deploymentOptions.forEach((option, index) => {
            console.log(`  ${index + 1}. ${option}`);
        });
        
        console.log('\n🚀 Running all deployment preparations...\n');
        
        const results = [];
        
        // GitHub Pages
        const githubResult = await this.deployToGitHubPages();
        results.push(githubResult);
        
        // Vercel
        const vercelResult = await this.deployToVercel();
        results.push(vercelResult);
        
        // Netlify
        const netlifyResult = await this.deployToNetlify();
        results.push(netlifyResult);
        
        // Static Package
        const staticResult = await this.createStaticPackage();
        results.push(staticResult);
        
        console.log('\n📊 Deployment Summary:');
        console.log('='.repeat(50));
        
        results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${result.type}: ${result.success ? 'Ready' : 'Failed'}`);
        });
        
        console.log('\n🎉 All deployment options prepared!');
        console.log('📝 Choose your preferred deployment method from the options above.');
        
        return results;
    }
    
    /**
     * Test website locally
     */
    async testLocally() {
        console.log('\n🧪 Testing website locally...');
        
        try {
            const content = await fs.readFile(this.websiteFile, 'utf8');
            
            // Basic validation
            const hasTitle = content.includes('<title>');
            const hasScript = content.includes('<script>');
            const hasInput = content.includes('textarea');
            const hasProcessor = content.includes('TruthBasedProcessor');
            
            console.log('  📋 Website validation:');
            console.log(`    Title tag: ${hasTitle ? '✅' : '❌'}`);
            console.log(`    JavaScript: ${hasScript ? '✅' : '❌'}`);
            console.log(`    Input field: ${hasInput ? '✅' : '❌'}`);
            console.log(`    Processor: ${hasProcessor ? '✅' : '❌'}`);
            
            if (hasTitle && hasScript && hasInput && hasProcessor) {
                console.log('  ✅ Website validation passed!');
                console.log(`  📄 File size: ${(content.length / 1024).toFixed(1)} KB`);
                console.log('  🌐 Open hello-world-website.html in your browser to test');
                return { success: true, size: content.length };
            } else {
                console.log('  ❌ Website validation failed');
                return { success: false, error: 'Missing required components' };
            }
            
        } catch (error) {
            console.error('❌ Local test failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Command line interface
if (require.main === module) {
    const deployer = new PublicWebsiteDeployer();
    
    const command = process.argv[2];
    
    async function main() {
        switch (command) {
            case 'github':
                await deployer.deployToGitHubPages();
                break;
                
            case 'vercel':
                await deployer.deployToVercel();
                break;
                
            case 'netlify':
                await deployer.deployToNetlify();
                break;
                
            case 'static':
                await deployer.createStaticPackage();
                break;
                
            case 'test':
                await deployer.testLocally();
                break;
                
            case 'all':
            default:
                await deployer.runDeploymentWizard();
                await deployer.testLocally();
                break;
        }
    }
    
    main().catch(console.error);
}

module.exports = PublicWebsiteDeployer;
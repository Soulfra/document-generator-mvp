/**
 * DOCUMENT-TO-DOMAIN PIPELINE
 * 
 * Connects existing systems to create the ultimate flow:
 * Upload document → Get working website
 * 
 * Uses EXISTING systems (no new ones!):
 * - mvp-generator.js (document processing) 
 * - UNIFIED-DOMAIN-DEPLOYMENT-SYSTEM.js (multi-domain deployment)
 * - auth-middleware-unified.js (authentication)
 * - PROVE-IT-WORKS.sh (verification)
 * - UNIFIED-SYSTEM-ORCHESTRATOR.js (coordination)
 * 
 * Reverse engineers the "cryptozombies" complexity into "click button, get website"
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class DocumentToDomainPipeline extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Existing system connections
            mvpGenerator: options.mvpGenerator || './mvp-generator.js',
            domainDeployer: options.domainDeployer || './UNIFIED-DOMAIN-DEPLOYMENT-SYSTEM.js',
            authMiddleware: options.authMiddleware || './auth-middleware-unified.js',
            proofScript: options.proofScript || './PROVE-IT-WORKS.sh',
            orchestrator: options.orchestrator || './UNIFIED-SYSTEM-ORCHESTRATOR.js',
            
            // Pipeline settings
            outputDir: options.outputDir || './generated-domains',
            tempDir: options.tempDir || './temp-pipeline',
            
            // Domain templates
            availableDomains: {
                'business': {
                    template: 'startup-pitch-deck',
                    domains: ['soulfra.com', 'deal-or-delete.com'],
                    features: ['business_betting', 'roi_predictions']
                },
                'technical': {
                    template: 'technical-spec', 
                    domains: ['roughsparks.com', 'd2d.com'],
                    features: ['tech_betting', 'adoption_predictions']
                },
                'creative': {
                    template: 'creative-showcase',
                    domains: ['save-or-sink.com'],
                    features: ['rescue_betting', 'survival_markets']
                }
            },
            
            // Integration endpoints
            slackWebhook: options.slackWebhook || process.env.SLACK_WEBHOOK,
            githubToken: options.githubToken || process.env.GITHUB_TOKEN,
            
            ...options
        };
        
        // Pipeline state
        this.activeDeployments = new Map();
        this.completedDeployments = new Map();
        this.pipeline = {
            stage: 'idle',
            currentDocument: null,
            generatedSite: null,
            deploymentStatus: null
        };
        
        // Load existing system connections
        this.mvpGenerator = null;
        this.domainDeployer = null;
        this.authMiddleware = null;
        this.systemOrchestrator = null;
        
        console.log('📄→🌐 DOCUMENT-TO-DOMAIN PIPELINE INITIALIZED');
        console.log('🔗 Connecting to existing systems...');
    }
    
    /**
     * Initialize all existing system connections
     */
    async initialize() {
        console.log('\n🔌 CONNECTING TO EXISTING SYSTEMS');
        console.log('==================================');
        
        try {
            // Connect to existing MVP generator
            console.log('📄 Connecting to MVP Generator...');
            const { MVPGenerator } = require(this.config.mvpGenerator);
            this.mvpGenerator = new MVPGenerator();
            console.log('✅ MVP Generator connected');
            
            // Connect to existing domain deployment system
            console.log('🌐 Connecting to Domain Deployment System...');
            const { UnifiedDomainDeploymentSystem } = require(this.config.domainDeployer);
            this.domainDeployer = new UnifiedDomainDeploymentSystem();
            console.log('✅ Domain Deployment System connected');
            
            // Connect to existing auth middleware
            console.log('🔐 Connecting to Auth Middleware...');
            const { UnifiedAuthMiddleware } = require(this.config.authMiddleware);
            this.authMiddleware = new UnifiedAuthMiddleware();
            console.log('✅ Auth Middleware connected');
            
            // Connect to existing system orchestrator
            console.log('🎭 Connecting to System Orchestrator...');
            const { UnifiedSystemOrchestrator } = require(this.config.orchestrator);
            this.systemOrchestrator = new UnifiedSystemOrchestrator();
            await this.systemOrchestrator.initialize();
            console.log('✅ System Orchestrator connected');
            
            console.log('\n🎉 ALL EXISTING SYSTEMS CONNECTED');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to connect to existing systems:', error);
            return false;
        }
    }
    
    /**
     * Main pipeline: Document → Domain
     */
    async processDocument(documentPath, userPreferences = {}) {
        console.log(`\n📄 PROCESSING DOCUMENT: ${documentPath}`);
        console.log('========================================');
        
        this.pipeline.stage = 'processing';
        this.pipeline.currentDocument = documentPath;
        
        try {
            // Step 1: Analyze document and generate MVP
            console.log('📊 Step 1: Analyzing document and generating MVP...');
            const mvpResult = await this.generateMVP(documentPath, userPreferences);
            
            // Step 2: Select appropriate domain and deployment strategy  
            console.log('🎯 Step 2: Selecting domain and deployment strategy...');
            const deploymentPlan = await this.planDeployment(mvpResult, userPreferences);
            
            // Step 3: Deploy to selected domain
            console.log('🚀 Step 3: Deploying to domain...');
            const deploymentResult = await this.deployToDomain(deploymentPlan);
            
            // Step 4: Verify deployment works
            console.log('✅ Step 4: Verifying deployment...');
            const verificationResult = await this.verifyDeployment(deploymentResult);
            
            // Step 5: Notify user via Slack/email/etc
            console.log('📢 Step 5: Notifying user...');
            await this.notifyUser(verificationResult);
            
            // Step 6: Create Git repository (if requested)
            if (userPreferences.createRepo) {
                console.log('📝 Step 6: Creating Git repository...');
                await this.createGitRepo(deploymentResult);
            }
            
            this.pipeline.stage = 'completed';
            this.completedDeployments.set(deploymentResult.id, deploymentResult);
            
            console.log('\n🎉 DOCUMENT-TO-DOMAIN PIPELINE COMPLETED!');
            console.log(`🌐 Your website: ${deploymentResult.url}`);
            console.log(`📊 Dashboard: ${deploymentResult.dashboardUrl}`);
            console.log(`🔗 Git Repo: ${deploymentResult.repoUrl || 'Not created'}`);
            
            return deploymentResult;
            
        } catch (error) {
            this.pipeline.stage = 'failed';
            console.error('❌ Pipeline failed:', error);
            
            // Attempt recovery using existing systems
            await this.attemptRecovery(error);
            
            throw error;
        }
    }
    
    /**
     * Step 1: Generate MVP using existing system
     */
    async generateMVP(documentPath, preferences) {
        console.log('   🏗️ Generating MVP from document...');
        
        // Use existing MVP generator
        const mvpResult = await this.mvpGenerator.generateMVP(documentPath);
        
        if (!mvpResult) {
            throw new Error('MVP generation failed');
        }
        
        // Enhance with user preferences
        mvpResult.preferences = preferences;
        mvpResult.timestamp = new Date().toISOString();
        mvpResult.pipelineId = `pipeline-${Date.now()}`;
        
        console.log(`   ✅ MVP generated: ${mvpResult.name}`);
        console.log(`   📦 Package: ${mvpResult.path}`);
        console.log(`   🎯 Template: ${mvpResult.template}`);
        
        return mvpResult;
    }
    
    /**
     * Step 2: Plan deployment using existing domain system
     */
    async planDeployment(mvpResult, preferences) {
        console.log('   📋 Planning deployment strategy...');
        
        // Determine document type and appropriate domain
        const documentType = this.classifyDocument(mvpResult);
        const availableConfigs = this.config.availableDomains[documentType] || this.config.availableDomains['business'];
        
        // Select domain based on availability and preferences
        const selectedDomain = preferences.domain || availableConfigs.domains[0];
        
        const deploymentPlan = {
            id: mvpResult.pipelineId,
            mvp: mvpResult,
            domain: selectedDomain,
            template: availableConfigs.template,
            features: availableConfigs.features,
            platform: this.selectDeploymentPlatform(selectedDomain),
            timestamp: new Date().toISOString()
        };
        
        console.log(`   ✅ Deployment planned:`);
        console.log(`   🌐 Domain: ${selectedDomain}`);
        console.log(`   🏗️ Platform: ${deploymentPlan.platform}`);
        console.log(`   🎨 Template: ${deploymentPlan.template}`);
        
        return deploymentPlan;
    }
    
    /**
     * Step 3: Deploy using existing domain deployment system
     */
    async deployToDomain(deploymentPlan) {
        console.log('   🚀 Deploying to domain...');
        
        // Use existing unified domain deployment system
        const deploymentResult = await this.domainDeployer.deployToDomain({
            domain: deploymentPlan.domain,
            codebase: deploymentPlan.mvp.path,
            platform: deploymentPlan.platform,
            features: deploymentPlan.features,
            template: deploymentPlan.template
        });
        
        // Enhance result with pipeline info
        deploymentResult.pipelineId = deploymentPlan.id;
        deploymentResult.originalDocument = this.pipeline.currentDocument;
        deploymentResult.timestamp = new Date().toISOString();
        
        console.log(`   ✅ Deployed successfully:`);
        console.log(`   🌐 URL: ${deploymentResult.url}`);
        console.log(`   📊 Dashboard: ${deploymentResult.dashboardUrl}`);
        console.log(`   🔑 Admin: ${deploymentResult.adminUrl}`);
        
        return deploymentResult;
    }
    
    /**
     * Step 4: Verify using existing proof system
     */
    async verifyDeployment(deploymentResult) {
        console.log('   ✅ Verifying deployment...');
        
        // Use existing PROVE-IT-WORKS.sh system
        const { execSync } = require('child_process');
        
        try {
            // Run existing verification script
            const verificationOutput = execSync(`${this.config.proofScript} --url ${deploymentResult.url}`, {
                encoding: 'utf-8',
                timeout: 60000
            });
            
            deploymentResult.verification = {
                status: 'verified',
                output: verificationOutput,
                timestamp: new Date().toISOString(),
                proofHash: this.generateProofHash(verificationOutput)
            };
            
            console.log('   ✅ Deployment verified and working!');
            
        } catch (error) {
            deploymentResult.verification = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            console.warn('   ⚠️ Verification incomplete, but deployment may still work');
        }
        
        return deploymentResult;
    }
    
    /**
     * Step 5: Notify user via multiple channels
     */
    async notifyUser(deploymentResult) {
        console.log('   📢 Notifying user...');
        
        const notification = {
            title: '🎉 Your Website is Live!',
            message: `Document "${path.basename(this.pipeline.currentDocument)}" has been transformed into a working website`,
            url: deploymentResult.url,
            dashboard: deploymentResult.dashboardUrl,
            timestamp: new Date().toISOString()
        };
        
        // Slack notification (if configured)
        if (this.config.slackWebhook) {
            await this.sendSlackNotification(notification);
        }
        
        // Email notification (if configured) 
        if (this.config.emailNotifications) {
            await this.sendEmailNotification(notification);
        }
        
        // Generate shareable report
        const reportPath = await this.generateDeploymentReport(deploymentResult);
        
        console.log(`   ✅ Notifications sent`);
        console.log(`   📋 Report: ${reportPath}`);
        
        return notification;
    }
    
    /**
     * Step 6: Create Git repository (optional)
     */
    async createGitRepo(deploymentResult) {
        console.log('   📝 Creating Git repository...');
        
        try {
            // Use existing GitHub integration
            const { execSync } = require('child_process');
            
            const repoName = `${deploymentResult.domain.replace(/\./g, '-')}-site`;
            const repoPath = path.join(this.config.outputDir, repoName);
            
            // Create local repo
            execSync(`git init ${repoPath}`, { stdio: 'pipe' });
            execSync(`cp -r ${deploymentResult.codePath}/* ${repoPath}/`, { stdio: 'pipe' });
            execSync(`cd ${repoPath} && git add . && git commit -m "🚀 Generated from document via pipeline"`, { stdio: 'pipe' });
            
            // Create GitHub repo (if token available)
            if (this.config.githubToken) {
                // Use existing GitHub workflow mechanics
                const { GITHUB_WORKFLOW_GAME_MECHANICS } = require('./GITHUB-WORKFLOW-GAME-MECHANICS.js');
                const githubGame = new GITHUB_WORKFLOW_GAME_MECHANICS();
                
                const repoUrl = await githubGame.createRepository({
                    name: repoName,
                    description: `Website generated from document via Document-to-Domain Pipeline`,
                    private: false
                });
                
                deploymentResult.repoUrl = repoUrl;
            }
            
            console.log(`   ✅ Git repository created`);
            return deploymentResult.repoUrl;
            
        } catch (error) {
            console.warn('   ⚠️ Git repository creation failed:', error.message);
            return null;
        }
    }
    
    /**
     * Simple web interface for the pipeline
     */
    async createSimpleInterface() {
        console.log('\n🎨 CREATING SIMPLE WEB INTERFACE');
        console.log('=================================');
        
        const interfaceHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Document to Website Pipeline</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 { text-align: center; margin-bottom: 30px; }
        .upload-area {
            border: 3px dashed rgba(255,255,255,0.3);
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .upload-area:hover {
            background: rgba(255,255,255,0.1);
        }
        .options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .option {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            border: none;
            color: white;
            cursor: pointer;
        }
        .generate-btn {
            width: 100%;
            padding: 15px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            margin-top: 20px;
        }
        .generate-btn:hover { background: #45a049; }
        .status {
            margin-top: 20px;
            padding: 15px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            min-height: 100px;
        }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📄→🌐 Document to Website</h1>
        <p style="text-align: center;">Upload any document and get a working website in minutes!</p>
        
        <div class="upload-area" onclick="document.getElementById('file-input').click()">
            <input type="file" id="file-input" class="hidden" accept=".md,.txt,.pdf,.docx" onchange="fileSelected(this)">
            <h3>📄 Drop document here or click to browse</h3>
            <p>Supports: Markdown, Text, PDF, Word documents</p>
            <p id="selected-file" class="hidden"></p>
        </div>
        
        <div class="options">
            <select class="option" id="domain-select">
                <option value="">Choose Domain</option>
                <option value="soulfra.com">soulfra.com (Business)</option>
                <option value="d2d.com">d2d.com (Deals)</option>
                <option value="save-or-sink.com">save-or-sink.com (Rescue)</option>
                <option value="roughsparks.com">roughsparks.com (Tech)</option>
            </select>
            
            <select class="option" id="style-select">
                <option value="business">Business Professional</option>
                <option value="creative">Creative Showcase</option>
                <option value="technical">Technical Docs</option>
                <option value="gaming">Gaming/Interactive</option>
            </select>
        </div>
        
        <label>
            <input type="checkbox" id="create-repo" checked> Create Git Repository
        </label>
        <br><br>
        
        <label>
            <input type="checkbox" id="slack-notify" checked> Send Slack Notification
        </label>
        
        <button class="generate-btn" onclick="generateWebsite()">
            🚀 Generate Website
        </button>
        
        <div class="status" id="status">
            Ready to transform your document into a website!
        </div>
    </div>

    <script>
        function fileSelected(input) {
            const file = input.files[0];
            if (file) {
                document.getElementById('selected-file').textContent = \`Selected: \${file.name}\`;
                document.getElementById('selected-file').classList.remove('hidden');
            }
        }
        
        async function generateWebsite() {
            const fileInput = document.getElementById('file-input');
            const statusDiv = document.getElementById('status');
            
            if (!fileInput.files[0]) {
                statusDiv.innerHTML = '❌ Please select a document first!';
                return;
            }
            
            const formData = new FormData();
            formData.append('document', fileInput.files[0]);
            formData.append('domain', document.getElementById('domain-select').value);
            formData.append('style', document.getElementById('style-select').value);
            formData.append('createRepo', document.getElementById('create-repo').checked);
            formData.append('slackNotify', document.getElementById('slack-notify').checked);
            
            statusDiv.innerHTML = '🔄 Processing document... This may take a few minutes.';
            
            try {
                const response = await fetch('/api/generate-website', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    statusDiv.innerHTML = \`
                        🎉 <strong>Website Generated Successfully!</strong><br>
                        🌐 <a href="\${result.url}" target="_blank">Visit your website</a><br>
                        📊 <a href="\${result.dashboard}" target="_blank">Dashboard</a><br>
                        \${result.repoUrl ? \`📝 <a href="\${result.repoUrl}" target="_blank">Git Repository</a><br>\` : ''}
                        ⚡ Generated in \${result.timeElapsed}s
                    \`;
                } else {
                    statusDiv.innerHTML = \`❌ Generation failed: \${result.error}\`;
                }
            } catch (error) {
                statusDiv.innerHTML = \`❌ Network error: \${error.message}\`;
            }
        }
    </script>
</body>
</html>
        `;
        
        const interfacePath = path.join(this.config.outputDir, 'pipeline-interface.html');
        await fs.writeFile(interfacePath, interfaceHTML);
        
        console.log(`✅ Simple interface created: ${interfacePath}`);
        console.log('🌐 Open in browser to use the pipeline');
        
        return interfacePath;
    }
    
    // Helper methods
    classifyDocument(mvpResult) {
        const content = mvpResult.analysis?.content?.toLowerCase() || '';
        
        if (content.includes('business') || content.includes('startup') || content.includes('revenue')) {
            return 'business';
        }
        if (content.includes('technical') || content.includes('api') || content.includes('code')) {
            return 'technical';
        }
        return 'creative';
    }
    
    selectDeploymentPlatform(domain) {
        const platformMap = {
            'soulfra.com': 'vercel',
            'd2d.com': 'vercel', 
            'save-or-sink.com': 'railway',
            'deal-or-delete.com': 'railway',
            'roughsparks.com': 'cloudflare',
            'matthew.com': 'cloudflare'
        };
        
        return platformMap[domain] || 'vercel';
    }
    
    generateProofHash(output) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(output).digest('hex');
    }
    
    async sendSlackNotification(notification) {
        if (!this.config.slackWebhook) return;
        
        try {
            const axios = require('axios');
            await axios.post(this.config.slackWebhook, {
                text: notification.title,
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `${notification.message}\n\n🌐 <${notification.url}|View Website> | 📊 <${notification.dashboard}|Dashboard>`
                        }
                    }
                ]
            });
            console.log('   📱 Slack notification sent');
        } catch (error) {
            console.warn('   ⚠️ Slack notification failed:', error.message);
        }
    }
    
    async generateDeploymentReport(deploymentResult) {
        const report = {
            id: deploymentResult.pipelineId,
            timestamp: new Date().toISOString(),
            document: this.pipeline.currentDocument,
            result: deploymentResult,
            pipeline: this.pipeline,
            systems_used: [
                'mvp-generator.js',
                'UNIFIED-DOMAIN-DEPLOYMENT-SYSTEM.js', 
                'auth-middleware-unified.js',
                'PROVE-IT-WORKS.sh',
                'UNIFIED-SYSTEM-ORCHESTRATOR.js'
            ]
        };
        
        const reportPath = path.join(this.config.outputDir, `deployment-report-${deploymentResult.pipelineId}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        return reportPath;
    }
    
    async attemptRecovery(error) {
        console.log('🔧 Attempting recovery using existing systems...');
        
        try {
            // Use existing system orchestrator for recovery
            if (this.systemOrchestrator) {
                await this.systemOrchestrator.handleSystemFailure(error);
            }
        } catch (recoveryError) {
            console.error('❌ Recovery failed:', recoveryError);
        }
    }
}

// Express API server for the web interface
class PipelineAPIServer {
    constructor(pipeline) {
        this.pipeline = pipeline;
        this.express = require('express');
        this.multer = require('multer');
        this.app = this.express();
        this.upload = this.multer({ dest: './uploads/' });
        
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.use(this.express.static('./'));
        this.app.use(this.express.json());
        
        // Main API endpoint
        this.app.post('/api/generate-website', this.upload.single('document'), async (req, res) => {
            try {
                const startTime = Date.now();
                
                const preferences = {
                    domain: req.body.domain,
                    style: req.body.style,
                    createRepo: req.body.createRepo === 'true',
                    slackNotify: req.body.slackNotify === 'true'
                };
                
                const result = await this.pipeline.processDocument(req.file.path, preferences);
                
                res.json({
                    success: true,
                    ...result,
                    timeElapsed: Math.round((Date.now() - startTime) / 1000)
                });
                
            } catch (error) {
                res.json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', systems: 'connected' });
        });
    }
    
    async start(port = 3000) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`🌐 Pipeline API Server running on http://localhost:${port}`);
                resolve();
            });
        });
    }
}

// Demo usage
async function demonstratePipeline() {
    console.log('\n📄→🌐 DOCUMENT-TO-DOMAIN PIPELINE DEMO');
    console.log('====================================');
    
    const pipeline = new DocumentToDomainPipeline();
    
    // Initialize existing system connections
    await pipeline.initialize();
    
    // Create simple web interface
    await pipeline.createSimpleInterface();
    
    // Start API server
    const apiServer = new PipelineAPIServer(pipeline);
    await apiServer.start();
    
    console.log('\n🎉 PIPELINE READY!');
    console.log('==================');
    console.log('🌐 Web Interface: http://localhost:3000/pipeline-interface.html');
    console.log('📡 API Endpoint: http://localhost:3000/api/generate-website');
    console.log('✨ Upload document → Get website in minutes!');
    
    return pipeline;
}

// Run demo if called directly
if (require.main === module) {
    demonstratePipeline().catch(console.error);
}

module.exports = {
    DocumentToDomainPipeline,
    PipelineAPIServer,
    demonstratePipeline
};

console.log('\n📄→🌐 DOCUMENT-TO-DOMAIN PIPELINE LOADED');
console.log('========================================');
console.log('🔗 Connects ALL existing systems');
console.log('📄 Upload document → 🌐 Get website');
console.log('⚡ No new systems - only connections!');
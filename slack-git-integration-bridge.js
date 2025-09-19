/**
 * SLACK/GIT INTEGRATION BRIDGE
 * 
 * Connects existing systems to standard tools:
 * - Slack bot for document uploads and notifications
 * - GitHub integration using existing GITHUB-WORKFLOW-GAME-MECHANICS.js
 * - Webhook bridge to existing orchestrators
 * - Real-world tool integration
 * 
 * NO NEW SYSTEMS - Only bridges to existing ones!
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class SlackGitIntegrationBridge extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Existing system connections
            documentPipeline: options.documentPipeline || './document-to-domain-pipeline.js',
            githubWorkflow: options.githubWorkflow || './GITHUB-WORKFLOW-GAME-MECHANICS.js', 
            orchestrator: options.orchestrator || './UNIFIED-SYSTEM-ORCHESTRATOR.js',
            proofSystem: options.proofSystem || './PROVE-IT-WORKS.sh',
            
            // Slack configuration
            slack: {
                botToken: options.slack?.botToken || process.env.SLACK_BOT_TOKEN,
                signingSecret: options.slack?.signingSecret || process.env.SLACK_SIGNING_SECRET,
                appToken: options.slack?.appToken || process.env.SLACK_APP_TOKEN,
                channels: {
                    general: options.slack?.channels?.general || '#document-generator',
                    deployments: options.slack?.channels?.deployments || '#deployments',
                    alerts: options.slack?.channels?.alerts || '#alerts'
                }
            },
            
            // GitHub configuration
            github: {
                token: options.github?.token || process.env.GITHUB_TOKEN,
                username: options.github?.username || process.env.GITHUB_USERNAME,
                orgName: options.github?.orgName || 'document-generator-sites',
                webhookSecret: options.github?.webhookSecret || process.env.GITHUB_WEBHOOK_SECRET
            },
            
            // Integration settings
            autoCommit: options.autoCommit !== false,
            autoNotify: options.autoNotify !== false,
            gamifyInteractions: options.gamifyInteractions !== false,
            
            ...options
        };
        
        // System connections
        this.documentPipeline = null;
        this.githubWorkflow = null;
        this.systemOrchestrator = null;
        
        // Integration state
        this.activeCommands = new Map();
        this.deploymentHistory = new Map();
        this.userSessions = new Map();
        
        console.log('🤖🔗 SLACK/GIT INTEGRATION BRIDGE INITIALIZED');
        console.log('🔗 Connecting to existing systems...');
    }
    
    /**
     * Initialize connections to existing systems
     */
    async initialize() {
        console.log('\n🔌 CONNECTING TO EXISTING SYSTEMS');
        console.log('==================================');
        
        try {
            // Connect to existing document pipeline
            console.log('📄 Connecting to Document Pipeline...');
            const { DocumentToDomainPipeline } = require(this.config.documentPipeline);
            this.documentPipeline = new DocumentToDomainPipeline();
            await this.documentPipeline.initialize();
            console.log('✅ Document Pipeline connected');
            
            // Connect to existing GitHub workflow mechanics
            console.log('📝 Connecting to GitHub Workflow...');
            const { GitHubWorkflowGame } = require(this.config.githubWorkflow);
            this.githubWorkflow = new GitHubWorkflowGame();
            await this.githubWorkflow.initialize();
            console.log('✅ GitHub Workflow connected');
            
            // Connect to existing system orchestrator
            console.log('🎭 Connecting to System Orchestrator...');
            const { UnifiedSystemOrchestrator } = require(this.config.orchestrator);
            this.systemOrchestrator = new UnifiedSystemOrchestrator();
            await this.systemOrchestrator.initialize();
            console.log('✅ System Orchestrator connected');
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('\n🎉 ALL EXISTING SYSTEMS CONNECTED');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to connect to existing systems:', error);
            return false;
        }
    }
    
    /**
     * Set up event listeners between systems
     */
    setupEventListeners() {
        // Document pipeline events → Slack notifications
        this.documentPipeline.on('pipeline:started', async (data) => {
            await this.sendSlackMessage(this.config.slack.channels.deployments, {
                text: `🚀 Document processing started: ${data.document}`,
                color: 'good'
            });
        });
        
        this.documentPipeline.on('pipeline:completed', async (data) => {
            await this.sendSlackMessage(this.config.slack.channels.deployments, {
                text: `🎉 Website deployed successfully!`,
                attachments: [{
                    color: 'good',
                    fields: [
                        { title: 'Website', value: data.url, short: true },
                        { title: 'Dashboard', value: data.dashboardUrl, short: true },
                        { title: 'Domain', value: data.domain, short: true },
                        { title: 'Platform', value: data.platform, short: true }
                    ]
                }]
            });
            
            // Auto-commit to GitHub if enabled
            if (this.config.autoCommit) {
                await this.createGitHubRepo(data);
            }
        });
        
        // GitHub workflow events → Slack notifications
        this.githubWorkflow.on('repository:created', async (data) => {
            await this.sendSlackMessage(this.config.slack.channels.general, {
                text: `📝 GitHub repository created: ${data.url}`,
                color: 'good'
            });
        });
        
        // System orchestrator events → Monitoring
        this.systemOrchestrator.on('service:health', async (data) => {
            if (!data.healthy) {
                await this.sendSlackMessage(this.config.slack.channels.alerts, {
                    text: `⚠️ Service health issue: ${data.service}`,
                    color: 'warning'
                });
            }
        });
    }
    
    /**
     * Create Slack bot application
     */
    async createSlackBot() {
        console.log('\n🤖 CREATING SLACK BOT');
        console.log('====================');
        
        const { App } = require('@slack/bolt');
        
        const app = new App({
            token: this.config.slack.botToken,
            signingSecret: this.config.slack.signingSecret,
            appToken: this.config.slack.appToken,
            socketMode: true,
            port: process.env.PORT || 3001
        });
        
        // Slash command: /generate-website
        app.command('/generate-website', async ({ command, ack, respond, client }) => {
            await ack();
            
            const userId = command.user_id;
            const channelId = command.channel_id;
            const text = command.text;
            
            try {
                // Show modal for document upload
                await client.views.open({
                    trigger_id: command.trigger_id,
                    view: {
                        type: 'modal',
                        callback_id: 'document_upload_modal',
                        title: { type: 'plain_text', text: '📄→🌐 Generate Website' },
                        submit: { type: 'plain_text', text: 'Generate' },
                        close: { type: 'plain_text', text: 'Cancel' },
                        blocks: [
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: 'Upload a document to generate a working website!'
                                }
                            },
                            {
                                type: 'input',
                                block_id: 'file_input',
                                label: { type: 'plain_text', text: 'Document' },
                                element: {
                                    type: 'file_input',
                                    action_id: 'document_file',
                                    filetypes: ['pdf', 'txt', 'md', 'docx']
                                }
                            },
                            {
                                type: 'input',
                                block_id: 'domain_input',
                                label: { type: 'plain_text', text: 'Domain' },
                                element: {
                                    type: 'static_select',
                                    action_id: 'domain_select',
                                    placeholder: { type: 'plain_text', text: 'Choose domain' },
                                    options: [
                                        { text: { type: 'plain_text', text: 'soulfra.com' }, value: 'soulfra.com' },
                                        { text: { type: 'plain_text', text: 'd2d.com' }, value: 'd2d.com' },
                                        { text: { type: 'plain_text', text: 'save-or-sink.com' }, value: 'save-or-sink.com' },
                                        { text: { type: 'plain_text', text: 'roughsparks.com' }, value: 'roughsparks.com' }
                                    ]
                                }
                            },
                            {
                                type: 'input',
                                block_id: 'options_input',
                                label: { type: 'plain_text', text: 'Options' },
                                element: {
                                    type: 'checkboxes',
                                    action_id: 'generation_options',
                                    options: [
                                        { text: { type: 'plain_text', text: 'Create GitHub repo' }, value: 'create_repo' },
                                        { text: { type: 'plain_text', text: 'Send notifications' }, value: 'notify' },
                                        { text: { type: 'plain_text', text: 'Enable gaming features' }, value: 'gaming' }
                                    ],
                                    initial_options: [
                                        { text: { type: 'plain_text', text: 'Create GitHub repo' }, value: 'create_repo' },
                                        { text: { type: 'plain_text', text: 'Send notifications' }, value: 'notify' }
                                    ]
                                }
                            }
                        ]
                    }
                });
                
            } catch (error) {
                console.error('Slash command error:', error);
                await respond(`❌ Error: ${error.message}`);
            }
        });
        
        // Handle modal submission
        app.view('document_upload_modal', async ({ ack, body, view, client }) => {
            await ack();
            
            try {
                const userId = body.user.id;
                const values = view.state.values;
                
                const fileId = values.file_input.document_file.selected_file;
                const domain = values.domain_input.domain_select.selected_option?.value;
                const options = values.options_input.generation_options.selected_options || [];
                
                // Get file info from Slack
                const fileInfo = await client.files.info({ file: fileId });
                
                // Download file and process through existing pipeline
                const preferences = {
                    domain: domain,
                    createRepo: options.some(opt => opt.value === 'create_repo'),
                    slackNotify: options.some(opt => opt.value === 'notify'),
                    gaming: options.some(opt => opt.value === 'gaming')
                };
                
                // Use existing document pipeline
                const result = await this.processDocumentFromSlack(fileInfo, preferences, userId);
                
                // Send success message
                await client.chat.postMessage({
                    channel: userId,
                    text: '🎉 Website generated successfully!',
                    attachments: [{
                        color: 'good',
                        fields: [
                            { title: 'Website', value: result.url, short: true },
                            { title: 'Dashboard', value: result.dashboardUrl, short: true }
                        ]
                    }]
                });
                
            } catch (error) {
                console.error('Modal submission error:', error);
                await client.chat.postMessage({
                    channel: body.user.id,
                    text: `❌ Generation failed: ${error.message}`
                });
            }
        });
        
        // Simple text commands
        app.message(/^generate website/i, async ({ message, say }) => {
            await say({
                text: 'Use `/generate-website` command to upload a document and create a website!',
                thread_ts: message.ts
            });
        });
        
        app.message(/^help/i, async ({ message, say }) => {
            await say({
                text: `🤖 Document Generator Bot Help:
                
• \`/generate-website\` - Upload document → Get website
• \`status\` - Check system status  
• \`list deployments\` - View recent deployments
• \`help\` - Show this help

Upload any document and I'll transform it into a working website using our existing systems!`,
                thread_ts: message.ts
            });
        });
        
        app.message(/^status/i, async ({ message, say }) => {
            const status = await this.getSystemStatus();
            await say({
                text: `🔧 System Status:
                
• Document Pipeline: ${status.pipeline ? '✅' : '❌'}
• GitHub Workflow: ${status.github ? '✅' : '❌'}  
• System Orchestrator: ${status.orchestrator ? '✅' : '❌'}
• Active Deployments: ${this.activeCommands.size}
• Total Deployments: ${this.deploymentHistory.size}`,
                thread_ts: message.ts
            });
        });
        
        // Start the Slack bot
        await app.start();
        console.log('✅ Slack bot started successfully');
        
        return app;
    }
    
    /**
     * Create GitHub webhook handler
     */
    async createGitHubWebhookHandler() {
        console.log('\n📝 CREATING GITHUB WEBHOOK HANDLER');
        console.log('==================================');
        
        const express = require('express');
        const app = express();
        
        app.use(express.json());
        
        // GitHub webhook endpoint
        app.post('/github/webhook', async (req, res) => {
            const signature = req.headers['x-hub-signature-256'];
            const payload = JSON.stringify(req.body);
            
            // Verify webhook signature
            if (!this.verifyGitHubSignature(payload, signature)) {
                return res.status(401).send('Unauthorized');
            }
            
            const event = req.headers['x-github-event'];
            const data = req.body;
            
            try {
                await this.handleGitHubEvent(event, data);
                res.status(200).send('OK');
            } catch (error) {
                console.error('GitHub webhook error:', error);
                res.status(500).send('Internal Server Error');
            }
        });
        
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                systems: {
                    documentPipeline: !!this.documentPipeline,
                    githubWorkflow: !!this.githubWorkflow,
                    systemOrchestrator: !!this.systemOrchestrator
                }
            });
        });
        
        const port = process.env.GITHUB_WEBHOOK_PORT || 3002;
        app.listen(port, () => {
            console.log(`✅ GitHub webhook handler running on port ${port}`);
        });
        
        return app;
    }
    
    /**
     * Process document uploaded via Slack
     */
    async processDocumentFromSlack(fileInfo, preferences, userId) {
        console.log(`📄 Processing document from Slack: ${fileInfo.name}`);
        
        // Download file from Slack
        const axios = require('axios');
        const response = await axios.get(fileInfo.url_private, {
            headers: { 'Authorization': `Bearer ${this.config.slack.botToken}` },
            responseType: 'stream'
        });
        
        // Save temporarily
        const fs = require('fs');
        const tempPath = `/tmp/slack-upload-${Date.now()}-${fileInfo.name}`;
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        
        // Process through existing document pipeline
        const result = await this.documentPipeline.processDocument(tempPath, preferences);
        
        // Track deployment
        this.deploymentHistory.set(result.id, {
            ...result,
            userId: userId,
            source: 'slack',
            timestamp: new Date().toISOString()
        });
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
        
        return result;
    }
    
    /**
     * Create GitHub repository using existing workflow
     */
    async createGitHubRepo(deploymentData) {
        console.log('📝 Creating GitHub repository...');
        
        try {
            // Use existing GitHub workflow game mechanics
            const repoResult = await this.githubWorkflow.createParallelUniverse(
                `${deploymentData.domain.replace(/\./g, '-')}-site`,
                `Website generated from document via pipeline`
            );
            
            // Copy deployment files to repo
            const { execSync } = require('child_process');
            const repoPath = `/tmp/github-repo-${Date.now()}`;
            
            execSync(`git clone ${repoResult.cloneUrl} ${repoPath}`);
            execSync(`cp -r ${deploymentData.codePath}/* ${repoPath}/`);
            execSync(`cd ${repoPath} && git add . && git commit -m "🚀 Initial website deployment"`);
            execSync(`cd ${repoPath} && git push origin main`);
            
            console.log(`✅ GitHub repository created: ${repoResult.url}`);
            return repoResult.url;
            
        } catch (error) {
            console.error('❌ GitHub repository creation failed:', error);
            return null;
        }
    }
    
    /**
     * Handle GitHub webhook events
     */
    async handleGitHubEvent(event, data) {
        switch (event) {
            case 'push':
                if (data.repository.name.includes('-site')) {
                    await this.sendSlackMessage(this.config.slack.channels.deployments, {
                        text: `📝 Code updated in ${data.repository.name}`,
                        color: 'good'
                    });
                }
                break;
                
            case 'issues':
                if (data.action === 'opened') {
                    await this.sendSlackMessage(this.config.slack.channels.general, {
                        text: `🐛 New issue opened: ${data.issue.title}`,
                        color: 'warning'
                    });
                }
                break;
                
            case 'release':
                if (data.action === 'published') {
                    await this.sendSlackMessage(this.config.slack.channels.deployments, {
                        text: `🎉 New release published: ${data.release.name}`,
                        color: 'good'
                    });
                }
                break;
        }
    }
    
    /**
     * Send Slack message
     */
    async sendSlackMessage(channel, message) {
        if (!this.config.slack.botToken) return;
        
        try {
            const { WebClient } = require('@slack/web-api');
            const slack = new WebClient(this.config.slack.botToken);
            
            await slack.chat.postMessage({
                channel: channel,
                ...message
            });
            
        } catch (error) {
            console.error('Slack message failed:', error);
        }
    }
    
    /**
     * Verify GitHub webhook signature
     */
    verifyGitHubSignature(payload, signature) {
        if (!this.config.github.webhookSecret) return true; // Skip verification if no secret
        
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', this.config.github.webhookSecret)
            .update(payload)
            .digest('hex');
            
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
    
    /**
     * Get system status
     */
    async getSystemStatus() {
        return {
            pipeline: !!this.documentPipeline,
            github: !!this.githubWorkflow,
            orchestrator: !!this.systemOrchestrator,
            slack: !!this.config.slack.botToken,
            timestamp: new Date().toISOString()
        };
    }
}

// Demo usage
async function demonstrateSlackGitIntegration() {
    console.log('\n🤖🔗 SLACK/GIT INTEGRATION BRIDGE DEMO');
    console.log('=====================================');
    
    const bridge = new SlackGitIntegrationBridge();
    
    // Initialize connections to existing systems
    await bridge.initialize();
    
    // Create Slack bot
    const slackBot = await bridge.createSlackBot();
    
    // Create GitHub webhook handler
    const githubWebhook = await bridge.createGitHubWebhookHandler();
    
    console.log('\n🎉 SLACK/GIT INTEGRATION READY!');
    console.log('===============================');
    console.log('🤖 Slack Bot: Running (use /generate-website command)');
    console.log('📝 GitHub Webhook: http://localhost:3002/github/webhook');
    console.log('🔗 All systems connected to existing infrastructure');
    console.log('');
    console.log('📱 Usage:');
    console.log('  1. Use /generate-website in Slack');
    console.log('  2. Upload document via modal');
    console.log('  3. Get website + GitHub repo automatically');
    console.log('  4. Receive notifications about deployments');
    
    return bridge;
}

// Run demo if called directly  
if (require.main === module) {
    demonstrateSlackGitIntegration().catch(console.error);
}

module.exports = {
    SlackGitIntegrationBridge,
    demonstrateSlackGitIntegration
};

console.log('\n🤖🔗 SLACK/GIT INTEGRATION BRIDGE LOADED');
console.log('========================================');
console.log('🔗 Connects to ALL existing systems');
console.log('🤖 Slack bot → Document pipeline → GitHub repo');
console.log('📝 Real-world tools → Your existing infrastructure');
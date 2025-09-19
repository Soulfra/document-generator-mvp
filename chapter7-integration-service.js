#!/usr/bin/env node
/**
 * CHAPTER7 INTEGRATION SERVICE
 * Bridge between Story Engine, PDF Generator, and Billing System
 * 
 * Features:
 * - Interactive story progression tracking
 * - Automated PDF generation for completed chapters
 * - Billing receipt generation for resources used
 * - 5W+H reasoning integration
 * - Return loop to story engine for next chapter
 * - Integration with Production Master Dashboard
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

class Chapter7IntegrationService {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3033,
            storyEngine: {
                url: 'http://localhost:7100',
                enabled: true
            },
            pdfGenerator: {
                url: 'http://localhost:3050',
                enabled: true,
                outputDir: './generated-pdfs'
            },
            billingSystem: {
                url: 'http://localhost:3051',
                enabled: true
            },
            authMiddleware: [
                './auth-middleware-unified.js',
                './gaming-auth-middleware.js'
            ],
            ...config
        };

        this.app = express();
        this.activeStories = new Map(); // storyId -> storyState
        this.chapterQueue = new Map(); // storyId -> [chapters]
        this.billingQueue = new Map(); // storyId -> billingData
        this.processingQueue = [];
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initialize();
    }

    async initialize() {
        console.log('📖 Initializing Chapter7 Integration Service...');
        
        try {
            // Ensure output directories exist
            await this.ensureDirectories();
            
            // Load existing stories
            await this.loadActiveStories();
            
            // Start processing queue
            this.startProcessingQueue();
            
            console.log(`✅ Chapter7 Integration Service initialized on port ${this.config.port}`);
            
            // Start the server
            this.server = this.app.listen(this.config.port, () => {
                console.log(`🚀 Chapter7 Service running on http://localhost:${this.config.port}`);
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize Chapter7 Integration Service:', error);
        }
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📖 ${req.method} ${req.path} - ${new Date().toISOString()}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                service: 'chapter7-integration',
                activeStories: this.activeStories.size,
                queueLength: this.processingQueue.length,
                components: {
                    storyEngine: this.config.storyEngine.enabled,
                    pdfGenerator: this.config.pdfGenerator.enabled,
                    billing: this.config.billingSystem.enabled
                }
            });
        });

        // Story progression endpoints
        this.app.post('/api/story/start', async (req, res) => {
            try {
                const { title, content, userId, metadata } = req.body;
                
                const storyId = this.generateStoryId();
                const story = {
                    id: storyId,
                    title,
                    content,
                    userId,
                    metadata: metadata || {},
                    chapters: [],
                    currentChapter: 0,
                    status: 'in_progress',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                this.activeStories.set(storyId, story);
                
                console.log(`📚 Started new story: ${title} (${storyId})`);
                
                res.status(201).json({
                    storyId,
                    story,
                    nextStep: 'Add chapters to continue the story'
                });
                
            } catch (error) {
                console.error('Failed to start story:', error);
                res.status(500).json({ error: 'Failed to start story: ' + error.message });
            }
        });

        this.app.post('/api/story/:storyId/chapter', async (req, res) => {
            try {
                const { storyId } = req.params;
                const { chapterTitle, chapterContent, reasoning, decisions } = req.body;
                
                const story = this.activeStories.get(storyId);
                if (!story) {
                    return res.status(404).json({ error: 'Story not found' });
                }
                
                const chapter = {
                    id: this.generateChapterId(),
                    number: story.chapters.length + 1,
                    title: chapterTitle,
                    content: chapterContent,
                    reasoning: reasoning || {},
                    decisions: decisions || [],
                    createdAt: new Date().toISOString(),
                    wordCount: chapterContent.split(/\s+/).length
                };
                
                story.chapters.push(chapter);
                story.currentChapter = chapter.number;
                story.updatedAt = new Date().toISOString();
                
                console.log(`📖 Added Chapter ${chapter.number} to story ${storyId}`);
                
                // Queue for PDF generation if chapter is complete
                if (chapter.wordCount > 100) {
                    await this.queueChapterForProcessing(storyId, chapter);
                }
                
                res.json({
                    chapter,
                    story: {
                        id: story.id,
                        title: story.title,
                        currentChapter: story.currentChapter,
                        totalChapters: story.chapters.length
                    },
                    nextStep: chapter.wordCount > 100 ? 'PDF generation queued' : 'Continue writing chapter'
                });
                
            } catch (error) {
                console.error('Failed to add chapter:', error);
                res.status(500).json({ error: 'Failed to add chapter: ' + error.message });
            }
        });

        this.app.get('/api/story/:storyId', async (req, res) => {
            try {
                const { storyId } = req.params;
                const story = this.activeStories.get(storyId);
                
                if (!story) {
                    return res.status(404).json({ error: 'Story not found' });
                }
                
                res.json({ story });
                
            } catch (error) {
                console.error('Failed to get story:', error);
                res.status(500).json({ error: 'Failed to get story: ' + error.message });
            }
        });

        this.app.get('/api/stories', async (req, res) => {
            try {
                const stories = Array.from(this.activeStories.values()).map(story => ({
                    id: story.id,
                    title: story.title,
                    userId: story.userId,
                    chapters: story.chapters.length,
                    currentChapter: story.currentChapter,
                    status: story.status,
                    createdAt: story.createdAt,
                    updatedAt: story.updatedAt
                }));
                
                res.json({ stories, total: stories.length });
                
            } catch (error) {
                console.error('Failed to get stories:', error);
                res.status(500).json({ error: 'Failed to get stories: ' + error.message });
            }
        });

        // PDF generation endpoints
        this.app.post('/api/story/:storyId/generate-pdf', async (req, res) => {
            try {
                const { storyId } = req.params;
                const { chapterId, format = 'magazine' } = req.body;
                
                const story = this.activeStories.get(storyId);
                if (!story) {
                    return res.status(404).json({ error: 'Story not found' });
                }
                
                const chapter = chapterId 
                    ? story.chapters.find(c => c.id === chapterId)
                    : story.chapters[story.chapters.length - 1];
                
                if (!chapter) {
                    return res.status(404).json({ error: 'Chapter not found' });
                }
                
                const pdfResult = await this.generatePDF(story, chapter, format);
                
                // Queue billing after PDF generation
                await this.queueBilling(storyId, {
                    type: 'pdf_generation',
                    chapter: chapter.number,
                    format,
                    resourcesUsed: pdfResult.resourcesUsed
                });
                
                res.json({
                    pdf: pdfResult,
                    billing: 'queued',
                    nextStep: 'Return to story engine for next chapter'
                });
                
            } catch (error) {
                console.error('Failed to generate PDF:', error);
                res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
            }
        });

        // Billing endpoints  
        this.app.post('/api/story/:storyId/bill', async (req, res) => {
            try {
                const { storyId } = req.params;
                const billingData = req.body;
                
                const receipt = await this.generateBillingReceipt(storyId, billingData);
                
                res.json({
                    receipt,
                    nextStep: 'Return to story engine for next chapter'
                });
                
            } catch (error) {
                console.error('Failed to generate billing:', error);
                res.status(500).json({ error: 'Failed to generate billing: ' + error.message });
            }
        });

        // Workflow integration endpoints
        this.app.post('/api/workflow/execute', async (req, res) => {
            try {
                const { storyId, action, payload } = req.body;
                
                const result = await this.executeWorkflowStep(storyId, action, payload);
                
                res.json({ result, timestamp: new Date().toISOString() });
                
            } catch (error) {
                console.error('Failed to execute workflow:', error);
                res.status(500).json({ error: 'Failed to execute workflow: ' + error.message });
            }
        });

        // Dashboard integration endpoints
        this.app.get('/api/dashboard/stats', async (req, res) => {
            try {
                const stats = {
                    activeStories: this.activeStories.size,
                    totalChapters: Array.from(this.activeStories.values())
                        .reduce((sum, story) => sum + story.chapters.length, 0),
                    queueLength: this.processingQueue.length,
                    recentActivity: await this.getRecentActivity()
                };
                
                res.json({ stats });
                
            } catch (error) {
                console.error('Failed to get dashboard stats:', error);
                res.status(500).json({ error: 'Failed to get stats' });
            }
        });
    }

    async queueChapterForProcessing(storyId, chapter) {
        const processItem = {
            id: this.generateProcessId(),
            type: 'chapter_complete',
            storyId,
            chapterId: chapter.id,
            timestamp: new Date().toISOString(),
            status: 'queued'
        };
        
        this.processingQueue.push(processItem);
        console.log(`📋 Queued chapter ${chapter.number} for processing`);
        
        return processItem;
    }

    async queueBilling(storyId, billingData) {
        const processItem = {
            id: this.generateProcessId(),
            type: 'billing',
            storyId,
            billingData,
            timestamp: new Date().toISOString(),
            status: 'queued'
        };
        
        this.processingQueue.push(processItem);
        console.log(`💰 Queued billing for story ${storyId}`);
        
        return processItem;
    }

    startProcessingQueue() {
        console.log('🔄 Starting Chapter7 processing queue...');
        
        setInterval(async () => {
            if (this.processingQueue.length > 0) {
                const item = this.processingQueue.shift();
                await this.processQueueItem(item);
            }
        }, 5000); // Process every 5 seconds
    }

    async processQueueItem(item) {
        try {
            console.log(`🔄 Processing ${item.type} for story ${item.storyId}`);
            item.status = 'processing';
            
            switch (item.type) {
                case 'chapter_complete':
                    await this.processChapterComplete(item);
                    break;
                case 'billing':
                    await this.processBilling(item);
                    break;
                default:
                    console.warn(`Unknown process type: ${item.type}`);
            }
            
            item.status = 'completed';
            item.completedAt = new Date().toISOString();
            
        } catch (error) {
            console.error(`Failed to process ${item.type}:`, error);
            item.status = 'failed';
            item.error = error.message;
            
            // Retry logic could be added here
        }
    }

    async processChapterComplete(item) {
        const story = this.activeStories.get(item.storyId);
        const chapter = story.chapters.find(c => c.id === item.chapterId);
        
        // Step 1: Generate PDF
        console.log(`📄 Generating PDF for Chapter ${chapter.number}`);
        const pdfResult = await this.generatePDF(story, chapter, 'magazine');
        
        // Step 2: Queue billing
        await this.queueBilling(item.storyId, {
            type: 'pdf_generation',
            chapter: chapter.number,
            format: 'magazine',
            resourcesUsed: pdfResult.resourcesUsed
        });
        
        // Step 3: Update story status
        story.lastProcessedChapter = chapter.number;
        story.updatedAt = new Date().toISOString();
        
        console.log(`✅ Completed processing Chapter ${chapter.number}`);
    }

    async processBilling(item) {
        console.log(`💰 Generating billing receipt for ${item.billingData.type}`);
        
        const receipt = await this.generateBillingReceipt(item.storyId, item.billingData);
        
        // Store billing record
        const story = this.activeStories.get(item.storyId);
        if (story) {
            story.billingHistory = story.billingHistory || [];
            story.billingHistory.push(receipt);
        }
        
        console.log(`💰 Billing receipt generated: ${receipt.receiptId}`);
    }

    async generatePDF(story, chapter, format = 'magazine') {
        // Simulate PDF generation
        console.log(`📄 Generating ${format} PDF for "${chapter.title}"`);
        
        const pdfFilename = `${story.id}_chapter_${chapter.number}_${Date.now()}.pdf`;
        const pdfPath = path.join(this.config.pdfGenerator.outputDir, pdfFilename);
        
        // Create magazine-style PDF content
        const pdfContent = this.createMagazinePDF(story, chapter);
        
        // Save PDF (in real implementation, use a PDF library)
        await this.ensureDirectories();
        await fs.writeFile(pdfPath, pdfContent);
        
        const resourcesUsed = {
            aiTokens: chapter.wordCount * 2, // Estimate
            processingTime: Math.ceil(chapter.wordCount / 100), // Seconds
            storageBytes: pdfContent.length
        };
        
        return {
            filename: pdfFilename,
            path: pdfPath,
            format,
            pages: Math.ceil(chapter.wordCount / 300),
            resourcesUsed,
            generatedAt: new Date().toISOString()
        };
    }

    createMagazinePDF(story, chapter) {
        // Create magazine-style PDF content (simplified)
        const content = `
# ${story.title}
## Chapter ${chapter.number}: ${chapter.title}

${chapter.content}

---

### 5W+H Reasoning Analysis

**Who:** ${chapter.reasoning?.who || 'Characters and stakeholders identified'}
**What:** ${chapter.reasoning?.what || 'Key events and actions described'}  
**When:** ${chapter.reasoning?.when || 'Timeline and sequence established'}
**Where:** ${chapter.reasoning?.where || 'Setting and location detailed'}
**Why:** ${chapter.reasoning?.why || 'Motivations and causes explored'}
**How:** ${chapter.reasoning?.how || 'Methods and processes explained'}

### Decisions Made
${chapter.decisions?.map((decision, i) => `${i + 1}. ${decision}`).join('\n') || 'No explicit decisions recorded'}

---
Generated by Chapter7 Integration Service
${new Date().toISOString()}
        `;
        
        return content;
    }

    async generateBillingReceipt(storyId, billingData) {
        const story = this.activeStories.get(storyId);
        
        const receiptId = this.generateReceiptId();
        const costs = this.calculateCosts(billingData.resourcesUsed);
        
        const receipt = {
            receiptId,
            storyId,
            storyTitle: story?.title || 'Unknown',
            type: billingData.type,
            chapter: billingData.chapter,
            resourcesUsed: billingData.resourcesUsed,
            costs,
            totalCost: costs.total,
            currency: 'USD',
            timestamp: new Date().toISOString(),
            reasoning: {
                who: story?.userId || 'System user',
                what: `Generated ${billingData.type} for Chapter ${billingData.chapter}`,
                when: new Date().toISOString(),
                where: 'Chapter7 Integration Service',
                why: 'User requested content generation and processing',
                how: `Processed ${billingData.resourcesUsed?.aiTokens || 0} AI tokens, ${billingData.resourcesUsed?.processingTime || 0}s processing`
            }
        };
        
        console.log(`🧾 Generated receipt ${receiptId} for $${costs.total.toFixed(2)}`);
        
        return receipt;
    }

    calculateCosts(resourcesUsed) {
        const rates = {
            aiTokenPer1000: 0.002, // $0.002 per 1000 tokens
            processingPerSecond: 0.001, // $0.001 per second
            storagePerMB: 0.0001 // $0.0001 per MB
        };
        
        const aiCost = (resourcesUsed?.aiTokens || 0) / 1000 * rates.aiTokenPer1000;
        const processingCost = (resourcesUsed?.processingTime || 0) * rates.processingPerSecond;
        const storageCost = (resourcesUsed?.storageBytes || 0) / 1024 / 1024 * rates.storagePerMB;
        
        return {
            ai: aiCost,
            processing: processingCost,
            storage: storageCost,
            total: aiCost + processingCost + storageCost
        };
    }

    async executeWorkflowStep(storyId, action, payload) {
        console.log(`🔄 Executing workflow step: ${action} for story ${storyId}`);
        
        switch (action) {
            case 'continue_story':
                return await this.returnToStoryEngine(storyId);
            
            case 'generate_pdf':
                return await this.triggerPDFGeneration(storyId, payload);
            
            case 'process_billing':
                return await this.triggerBilling(storyId, payload);
            
            default:
                throw new Error(`Unknown workflow action: ${action}`);
        }
    }

    async returnToStoryEngine(storyId) {
        const story = this.activeStories.get(storyId);
        if (!story) {
            throw new Error('Story not found');
        }
        
        // Update story status to ready for next chapter
        story.status = 'ready_for_next_chapter';
        story.updatedAt = new Date().toISOString();
        
        console.log(`📖 Story ${storyId} ready for next chapter`);
        
        return {
            action: 'story_ready',
            storyId,
            currentChapter: story.currentChapter,
            totalChapters: story.chapters.length,
            nextChapterNumber: story.chapters.length + 1
        };
    }

    async getRecentActivity() {
        const activities = [];
        
        // Get recent story updates
        for (const story of this.activeStories.values()) {
            if (story.chapters.length > 0) {
                const lastChapter = story.chapters[story.chapters.length - 1];
                activities.push({
                    type: 'chapter_added',
                    storyTitle: story.title,
                    chapterTitle: lastChapter.title,
                    timestamp: lastChapter.createdAt
                });
            }
        }
        
        // Sort by timestamp, most recent first
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return activities.slice(0, 10); // Return last 10 activities
    }

    async ensureDirectories() {
        const dirs = [
            this.config.pdfGenerator.outputDir,
            './story-data',
            './billing-records'
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') throw error;
            }
        }
    }

    async loadActiveStories() {
        try {
            const storyDataPath = './story-data';
            const files = await fs.readdir(storyDataPath).catch(() => []);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const storyData = await fs.readFile(path.join(storyDataPath, file), 'utf8');
                        const story = JSON.parse(storyData);
                        this.activeStories.set(story.id, story);
                    } catch (error) {
                        console.warn(`Failed to load story file ${file}:`, error.message);
                    }
                }
            }
            
            console.log(`📚 Loaded ${this.activeStories.size} active stories`);
            
        } catch (error) {
            console.log('📚 No existing stories found, starting fresh');
        }
    }

    generateStoryId() {
        return 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateChapterId() {
        return 'chapter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateProcessId() {
        return 'process_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateReceiptId() {
        return 'receipt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async shutdown() {
        if (this.server) {
            console.log('🛑 Shutting down Chapter7 Integration Service...');
            
            // Save active stories
            await this.saveActiveStories();
            
            this.server.close();
        }
    }

    async saveActiveStories() {
        try {
            await this.ensureDirectories();
            
            for (const [storyId, story] of this.activeStories.entries()) {
                const filename = `${storyId}.json`;
                const filepath = path.join('./story-data', filename);
                await fs.writeFile(filepath, JSON.stringify(story, null, 2));
            }
            
            console.log(`💾 Saved ${this.activeStories.size} active stories`);
            
        } catch (error) {
            console.error('Failed to save stories:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Chapter7IntegrationService;
}

// CLI usage
if (require.main === module) {
    const chapter7Service = new Chapter7IntegrationService();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await chapter7Service.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await chapter7Service.shutdown();
        process.exit(0);
    });
}
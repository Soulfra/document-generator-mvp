#!/usr/bin/env node

/**
 * 🌉 API TO FORUM BRIDGE
 * 
 * Connects MVP API responses to forum posts with encryption
 * Part of the complete data flow: API → Forum → Decrypt → Gaming → Database
 */

const { Pool } = require('pg');
const crypto = require('crypto');

class APIToForumBridge {
    constructor() {
        this.forumSystem = require('./AGENT-ECONOMY-FORUM');
        this.encryptHandler = require('./encrypted-prompt-handler');
        this.rlSystem = require('./real-game-api-rl-system');
        
        // PostgreSQL for encrypted mapping storage
        this.pgClient = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_generator'
        });
        
        // Board mapping based on content type
        this.boardMappings = {
            'mvp_generation': 'mvp-showcase',
            'code_generation': 'code-snippets',
            'api_integration': 'api-discussions',
            'data_analysis': 'data-insights',
            'template_selection': 'template-gallery',
            'error_report': 'bug-reports',
            'success_story': 'success-stories',
            
            // Todo-specific board mappings for external LLM workflow
            'todo_created': 'todo-discussions',
            'todo_analysis': 'llm-insights',
            'todo_feedback': 'implementation-feedback',
            'todo_progress': 'implementation-updates',
            'todo_completed': 'completion-showcase',
            'todo_blocked': 'help-requests',
            
            // Priority-based routing
            'urgent-todos': 'urgent-todos',
            'epic-quests': 'epic-quests',
            'development': 'development-discussions',
            'integrations': 'api-integrations',
            'user-experience': 'ux-design',
            'feature-requests': 'feature-proposals',
            
            // Workflow-specific boards
            'external-llm-workflow': 'llm-workflow',
            'gaming-integration': 'gaming-events',
            'feedback-loop': 'community-feedback'
        };
        
        console.log('🌉 API to Forum Bridge initialized');
    }
    
    async initialize() {
        // Create encrypted mapping table
        await this.pgClient.query(`
            CREATE TABLE IF NOT EXISTS api_forum_mappings (
                id SERIAL PRIMARY KEY,
                api_request_id VARCHAR(255),
                forum_post_id INTEGER,
                encryption_key VARCHAR(512),
                encrypted_data TEXT,
                decryption_metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        console.log('✅ API-Forum mapping table ready');
    }
    
    async processAPIResponse(apiResponse, context) {
        console.log(`🔄 Processing API response for ${context.type}`);
        
        try {
            // 1. Validate and prepare response data
            const preparedData = this.prepareResponseData(apiResponse, context);
            
            // 2. Encrypt sensitive data in API response
            const encrypted = await this.encryptHandler.encryptPrompt(
                JSON.stringify(preparedData),
                { 
                    category: context.type,
                    narrativeStyle: 'business' // Professional for forums
                }
            );
            
            // 3. Create forum-friendly content
            const forumContent = this.createForumContent(encrypted, context);
            
            // 4. Post to appropriate forum board
            const forumPost = await this.forumSystem.createPost(
                context.authorType || 'ai_agent',
                context.agentId || 'api-bridge',
                this.selectBoard(context.type),
                forumContent.title,
                forumContent.body
            );
            
            // 5. Store encrypted mapping for later decryption
            await this.storeEncryptedMapping(
                apiResponse.id || crypto.randomUUID(),
                forumPost.id,
                encrypted
            );
            
            // 6. Learn from this API→Forum transformation
            await this.learnFromTransformation(apiResponse, forumPost, context);
            
            console.log(`✅ Posted to forum: ${forumPost.title} (ID: ${forumPost.id})`);
            
            return {
                success: true,
                forumPost,
                encrypted,
                board: this.selectBoard(context.type),
                mappingId: forumPost.id
            };
            
        } catch (error) {
            console.error('❌ API to Forum processing failed:', error);
            
            // Post error to bug reports board
            const errorPost = await this.postError(error, context);
            
            return {
                success: false,
                error: error.message,
                errorPost
            };
        }
    }
    
    prepareResponseData(apiResponse, context) {
        // Extract key information based on response type
        const data = {
            type: context.type,
            endpoint: context.endpoint,
            timestamp: new Date().toISOString(),
            requestId: apiResponse.id || crypto.randomUUID()
        };
        
        // Handle different response structures
        if (context.type === 'mvp_generation') {
            data.mvp = {
                name: apiResponse.name,
                architecture: apiResponse.architecture,
                template: apiResponse.template,
                urls: apiResponse.urls,
                features: apiResponse.features
            };
        } else if (context.type === 'code_generation') {
            data.code = {
                language: apiResponse.language,
                framework: apiResponse.framework,
                files: apiResponse.files?.length || 0,
                dependencies: apiResponse.dependencies
            };
        } else {
            // Generic response handling
            data.result = apiResponse;
        }
        
        return data;
    }
    
    createForumContent(encrypted, context) {
        const timestamp = new Date().toLocaleString();
        
        // Create professional forum post
        const title = this.generateTitle(context);
        
        let body = `## ${title}\n\n`;
        body += `**Posted by:** API Bridge Bot\n`;
        body += `**Time:** ${timestamp}\n`;
        body += `**Type:** ${context.type}\n\n`;
        
        // Add story mode content (safe for public viewing)
        body += `### Summary\n`;
        body += `${encrypted.story}\n\n`;
        
        // Add metadata without sensitive info
        body += `### Details\n`;
        body += `- **Endpoint:** ${context.endpoint}\n`;
        body += `- **Privacy Level:** ${encrypted.privacyLevel}\n`;
        body += `- **Data Protected:** ${encrypted.sensitiveDataDetected ? 'Yes' : 'No'}\n`;
        
        if (encrypted.sensitiveDataDetected) {
            body += `- **Protected Items:** ${encrypted.encryptedData.length} items secured\n`;
        }
        
        // Add reference ID for tracking
        body += `\n### Reference\n`;
        body += `\`\`\`\n`;
        body += `Mapping ID: ${encrypted.timestamp}\n`;
        body += `\`\`\`\n`;
        
        return { title, body };
    }
    
    generateTitle(context) {
        const titles = {
            'mvp_generation': `🚀 New MVP Generated: ${context.name || 'Project'}`,
            'code_generation': `💻 Code Generated for ${context.language || 'Project'}`,
            'api_integration': `🔌 API Integration: ${context.service || 'Service'}`,
            'data_analysis': `📊 Data Analysis Complete`,
            'template_selection': `📋 Template Selected: ${context.template || 'Template'}`,
            'error_report': `🐛 Error Report: ${context.error || 'Issue'}`,
            'success_story': `🎉 Success: ${context.achievement || 'Achievement'}`
        };
        
        return titles[context.type] || `📢 API Update: ${context.type}`;
    }
    
    selectBoard(type) {
        return this.boardMappings[type] || 'general-discussion';
    }
    
    async storeEncryptedMapping(apiRequestId, forumPostId, encrypted) {
        try {
            const result = await this.pgClient.query(`
                INSERT INTO api_forum_mappings 
                (api_request_id, forum_post_id, encryption_key, encrypted_data, decryption_metadata)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [
                apiRequestId,
                forumPostId,
                encrypted.encryptionKey,
                JSON.stringify(encrypted.encryptedData),
                {
                    timestamp: encrypted.timestamp,
                    privacyLevel: encrypted.privacyLevel,
                    originalLength: encrypted.original.length
                }
            ]);
            
            console.log(`💾 Stored mapping: ${result.rows[0].id}`);
            return result.rows[0].id;
            
        } catch (error) {
            console.error('❌ Failed to store mapping:', error);
            throw error;
        }
    }
    
    async learnFromTransformation(apiResponse, forumPost, context) {
        // Send learning data to RL system
        try {
            await this.rlSystem.analyzeRLPattern('api_to_forum', {
                apiType: context.type,
                responseSize: JSON.stringify(apiResponse).length,
                forumBoard: this.selectBoard(context.type),
                encryptionUsed: true,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.log('⚠️ Learning system unavailable:', error.message);
        }
    }
    
    async postError(error, context) {
        try {
            return await this.forumSystem.createPost(
                'system',
                'api-bridge',
                'bug-reports',
                `❌ API Bridge Error: ${context.type}`,
                `An error occurred during API to Forum transformation:\n\n\`\`\`\n${error.stack}\n\`\`\`\n\nContext: ${JSON.stringify(context, null, 2)}`
            );
        } catch (forumError) {
            console.error('❌ Failed to post error to forum:', forumError);
            return null;
        }
    }
    
    // Retrieve and decrypt a forum post back to original API data
    async decryptForumPost(forumPostId) {
        try {
            // Get the mapping
            const mapping = await this.pgClient.query(
                'SELECT * FROM api_forum_mappings WHERE forum_post_id = $1',
                [forumPostId]
            );
            
            if (mapping.rows.length === 0) {
                throw new Error('No mapping found for forum post');
            }
            
            const map = mapping.rows[0];
            
            // Reconstruct encrypted prompt object
            const encryptedPrompt = {
                encryptedData: JSON.parse(map.encrypted_data),
                encryptionKey: map.encryption_key,
                ...map.decryption_metadata
            };
            
            // Decrypt using the handler
            const decrypted = await this.encryptHandler.decryptPrompt(encryptedPrompt);
            
            return {
                success: true,
                apiRequestId: map.api_request_id,
                decryptedData: JSON.parse(decrypted),
                forumPostId: forumPostId
            };
            
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = APIToForumBridge;

// Demo if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('🌉 API TO FORUM BRIDGE DEMO');
        console.log('===========================\n');
        
        const bridge = new APIToForumBridge();
        await bridge.initialize();
        
        // Test API response
        const testAPIResponse = {
            id: 'mvp-123',
            name: 'TaskFlow',
            architecture: {
                frontend: 'React',
                backend: 'Node.js',
                database: 'PostgreSQL'
            },
            template: 'saas-starter',
            urls: {
                frontend: 'http://localhost:3000',
                backend: 'http://localhost:3001',
                docs: 'http://localhost:3000/docs'
            },
            features: [
                'User Authentication',
                'Task Management',
                'Real-time Updates'
            ]
        };
        
        // Process the response
        const result = await bridge.processAPIResponse(testAPIResponse, {
            type: 'mvp_generation',
            name: 'TaskFlow',
            endpoint: '/api/mvp/generate',
            agentId: 'demo-agent'
        });
        
        console.log('\n📊 Bridge Result:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📝 Forum Post ID: ${result.forumPost?.id}`);
        console.log(`🏷️ Board: ${result.board}`);
        console.log(`🔐 Encryption Used: ${result.encrypted?.sensitiveDataDetected ? 'Yes' : 'No'}`);
        
        // Test decryption
        if (result.success && result.forumPost) {
            console.log('\n🔓 Testing decryption...');
            const decrypted = await bridge.decryptForumPost(result.forumPost.id);
            console.log(`✅ Decryption success: ${decrypted.success}`);
            console.log(`📄 Original API ID: ${decrypted.apiRequestId}`);
        }
    };
    
    demo().catch(console.error);
}
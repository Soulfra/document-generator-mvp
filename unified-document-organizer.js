#!/usr/bin/env node

/**
 * 🗂️ UNIFIED DOCUMENT ORGANIZER
 * 
 * Consolidates all document organization systems into a single coordinated approach:
 * - File Organizer Service (10 categories)
 * - Brand Tagging System (multi-dimensional tags)
 * - TAG-MATCHING-VALIDATOR (semantic consistency)
 * - Vault-based encryption and secure storage
 * - Auto-categorization with AI analysis
 * - Duplicate detection and content hashing
 * 
 * Addresses the core document bucket sorting issues:
 * - Multiple competing categorization systems
 * - No unified tagging interface
 * - Missing encryption integration
 * - Inconsistent document metadata
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

class UnifiedDocumentOrganizer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            basePath: config.basePath || process.cwd(),
            vaultPath: config.vaultPath || path.join(process.cwd(), 'vault'),
            ollamaUrl: config.ollamaUrl || 'http://localhost:11434',
            ollamaModel: config.ollamaModel || 'mistral',
            batchSize: config.batchSize || 10,
            maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
            encryptionKey: config.encryptionKey || process.env.DOCUMENT_ENCRYPTION_KEY,
            aiEnabled: config.aiEnabled !== false,
            ...config
        };
        
        // Initialize the unified bucket hierarchy
        this.bucketHierarchy = {
            'active': {
                name: 'Active Documents',
                description: 'Currently being worked on',
                icon: '🚀',
                color: '#00ff88',
                encryption: 'optional',
                subBuckets: ['development', 'review', 'testing']
            },
            'archived': {
                name: 'Archived Documents', 
                description: 'Completed or old documents',
                icon: '📦',
                color: '#888888',
                encryption: 'required',
                subBuckets: ['completed', 'deprecated', 'historical']
            },
            'experimental': {
                name: 'Experimental Documents',
                description: 'Testing and prototype documents',
                icon: '🧪',
                color: '#ffaa00',
                encryption: 'optional',
                subBuckets: ['prototypes', 'research', 'ideas']
            },
            'templates': {
                name: 'Template Documents',
                description: 'Reusable document templates',
                icon: '📋',
                color: '#aa00ff',
                encryption: 'none',
                subBuckets: ['contracts', 'forms', 'boilerplates']
            },
            'encrypted': {
                name: 'Secure Documents',
                description: 'High-security encrypted storage',
                icon: '🔒',
                color: '#ff0066',
                encryption: 'mandatory',
                subBuckets: ['confidential', 'personal', 'financial']
            },
            'quarantine': {
                name: 'Quarantine',
                description: 'Problem documents awaiting review',
                icon: '⚠️',
                color: '#ff4444',
                encryption: 'optional',
                subBuckets: ['corrupted', 'suspicious', 'unprocessable']
            }
        };
        
        // Unified tag taxonomy combining all systems
        this.tagTaxonomy = {
            // System tags (from file-organizer)
            system: {
                'critical': { weight: 10, color: '#ff0000' },
                'security': { weight: 9, color: '#ff4400' },
                'audit': { weight: 8, color: '#ff8800' },
                'compliance': { weight: 7, color: '#ffaa00' }
            },
            
            // Environment tags
            environment: {
                'dev': { weight: 5, color: '#00ff00' },
                'staging': { weight: 6, color: '#88ff00' },
                'prod': { weight: 8, color: '#ff0000' },
                'remote': { weight: 4, color: '#0088ff' }
            },
            
            // Status tags
            status: {
                'active': { weight: 7, color: '#00ff88' },
                'archived': { weight: 3, color: '#888888' },
                'deprecated': { weight: 2, color: '#666666' },
                'experimental': { weight: 5, color: '#ffaa00' }
            },
            
            // Content type tags (from TAG-MATCHING-VALIDATOR)
            content: {
                'function': { weight: 6, aliases: ['method', 'procedure'], ancient: ['𓃀', 'Λ'] },
                'data': { weight: 5, aliases: ['variable', 'storage'], ancient: ['𓎛', '𒆳'] },
                'control': { weight: 6, aliases: ['loop', 'conditional'], ancient: ['𓆎', 'Ο'] },
                'security': { weight: 8, aliases: ['protect', 'guard'], ancient: ['ᚦ', '𓊪'] }
            },
            
            // Brand tags (from brand system)
            brand: {
                'revolutionary': { weight: 7, archetype: 'teacher', color: '#ff0066' },
                'dream_architect': { weight: 6, archetype: 'builder', color: '#aa00ff' },
                'wise_commander': { weight: 8, archetype: 'leader', color: '#0066ff' },
                'prosperity_creator': { weight: 7, archetype: 'creator', color: '#ffaa00' },
                'creative_catalyst': { weight: 6, archetype: 'catalyst', color: '#00ffaa' }
            }
        };
        
        // Document registry
        this.documentRegistry = new Map();
        this.contentHashes = new Map(); // For duplicate detection
        this.tagIndex = new Map(); // Tag-based search index
        this.encryptionKeys = new Map(); // Per-document encryption keys
        
        // Processing state
        this.processingQueue = [];
        this.isProcessing = false;
        this.stats = {
            totalDocuments: 0,
            processedDocuments: 0,
            duplicatesFound: 0,
            encryptedDocuments: 0,
            categorizedDocuments: 0,
            taggedDocuments: 0
        };
        
        console.log('🗂️ Unified Document Organizer initialized');
    }
    
    async initialize() {
        console.log('🚀 Initializing Unified Document Organizer...');
        
        // Create vault directory structure
        await this.createVaultStructure();
        
        // Test AI service connection
        await this.testAIConnection();
        
        // Load existing document registry
        await this.loadDocumentRegistry();
        
        // Initialize tag validation
        await this.initializeTagValidation();
        
        console.log('✅ Unified Document Organizer ready');
        this.emit('initialized');
    }
    
    async createVaultStructure() {
        console.log('📁 Creating unified vault structure...');
        
        // Create main vault directory
        await this.ensureDirectory(this.config.vaultPath);
        
        // Create bucket directories
        for (const [bucketId, bucket] of Object.entries(this.bucketHierarchy)) {
            const bucketPath = path.join(this.config.vaultPath, bucketId);
            await this.ensureDirectory(bucketPath);
            
            // Create sub-buckets
            for (const subBucket of bucket.subBuckets) {
                const subBucketPath = path.join(bucketPath, subBucket);
                await this.ensureDirectory(subBucketPath);
            }
        }
        
        // Create metadata and index directories
        await this.ensureDirectory(path.join(this.config.vaultPath, '.metadata'));
        await this.ensureDirectory(path.join(this.config.vaultPath, '.index'));
        
        console.log('✅ Vault structure created');
    }
    
    async ensureDirectory(dirPath) {
        try {
            await fs.access(dirPath);
        } catch (error) {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }
    
    async testAIConnection() {
        if (!this.config.aiEnabled) {
            console.log('⚠️ AI analysis disabled');
            this.aiAvailable = false;
            return;
        }
        
        try {
            const response = await axios.get(`${this.config.ollamaUrl}/api/tags`, {
                timeout: 3000
            });
            
            console.log('✅ AI service connection successful');
            this.aiAvailable = true;
        } catch (error) {
            console.warn('⚠️ AI service unavailable, using rule-based categorization');
            this.aiAvailable = false;
        }
    }
    
    async loadDocumentRegistry() {
        const registryPath = path.join(this.config.vaultPath, '.metadata', 'document-registry.json');
        
        try {
            const registryData = await fs.readFile(registryPath, 'utf8');
            const registry = JSON.parse(registryData);
            
            // Rebuild registry maps
            for (const [docId, doc] of Object.entries(registry.documents || {})) {
                this.documentRegistry.set(docId, doc);
                this.contentHashes.set(doc.contentHash, docId);
            }
            
            this.stats = { ...this.stats, ...(registry.stats || {}) };
            console.log(`📊 Loaded ${this.documentRegistry.size} documents from registry`);
            
        } catch (error) {
            console.log('📝 Creating new document registry');
        }
    }
    
    async saveDocumentRegistry() {
        const registryPath = path.join(this.config.vaultPath, '.metadata', 'document-registry.json');
        
        const registry = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            stats: this.stats,
            documents: Object.fromEntries(this.documentRegistry)
        };
        
        await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
    }
    
    async initializeTagValidation() {
        // Initialize tag validation system
        const self = this;
        this.tagValidator = {
            validateTag: (tag, context) => {
                // Check if tag exists in taxonomy
                for (const [category, tags] of Object.entries(self.tagTaxonomy)) {
                    if (tags[tag]) {
                        return { valid: true, category, metadata: tags[tag] };
                    }
                }
                
                // Check aliases
                for (const [category, tags] of Object.entries(self.tagTaxonomy)) {
                    for (const [tagName, tagMeta] of Object.entries(tags)) {
                        if (tagMeta.aliases && tagMeta.aliases.includes(tag)) {
                            return { valid: true, category, canonical: tagName, metadata: tagMeta };
                        }
                    }
                }
                
                return { valid: false, suggestion: self.tagValidator.suggestTag(tag) };
            },
            
            suggestTag: (tag) => {
                // Simple fuzzy matching for tag suggestions
                const allTags = [];
                for (const [category, tags] of Object.entries(self.tagTaxonomy)) {
                    allTags.push(...Object.keys(tags));
                }
                
                // Find closest match
                let bestMatch = null;
                let bestScore = 0;
                
                for (const existingTag of allTags) {
                    const score = self.calculateSimilarity(tag.toLowerCase(), existingTag.toLowerCase());
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = existingTag;
                    }
                }
                
                return bestScore > 0.6 ? bestMatch : null;
            }
        };
    }
    
    calculateSimilarity(str1, str2) {
        // Simple Levenshtein distance-based similarity
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;
        
        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
        
        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // deletion
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        
        const maxLen = Math.max(len1, len2);
        return (maxLen - matrix[len1][len2]) / maxLen;
    }
    
    async processDocument(filePath, options = {}) {
        console.log(`🔍 Processing document: ${path.basename(filePath)}`);
        
        try {
            // Read and hash file content
            const content = await fs.readFile(filePath, 'utf8');
            const contentHash = crypto.createHash('sha256').update(content).digest('hex');
            
            // Check for duplicates
            if (this.contentHashes.has(contentHash)) {
                const existingDocId = this.contentHashes.get(contentHash);
                console.log(`📋 Duplicate detected: ${filePath} matches ${existingDocId}`);
                this.stats.duplicatesFound++;
                
                return {
                    duplicate: true,
                    existingDocument: this.documentRegistry.get(existingDocId)
                };
            }
            
            // Create document ID
            const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Extract metadata
            const metadata = await this.extractMetadata(filePath, content);
            
            // Analyze content with AI (if available)
            const analysis = await this.analyzeContent(content, metadata);
            
            // Determine categorization
            const categorization = await this.categorizeDocument(content, metadata, analysis);
            
            // Generate tags
            const tags = await this.generateTags(content, metadata, analysis);
            
            // Determine encryption requirements
            const encryptionRequired = this.determineEncryptionRequirement(categorization, tags, options);
            
            // Create document record
            const document = {
                id: docId,
                originalPath: filePath,
                filename: path.basename(filePath),
                contentHash,
                size: content.length,
                createdAt: new Date().toISOString(),
                lastModified: metadata.lastModified,
                bucket: categorization.primaryBucket,
                subBucket: categorization.subBucket,
                tags: tags.validated,
                metadata,
                analysis,
                encrypted: encryptionRequired,
                quality: analysis.quality || 0.5
            };
            
            // Store document
            const storagePath = await this.storeDocument(document, content, encryptionRequired);
            document.storagePath = storagePath;
            
            // Update registries
            this.documentRegistry.set(docId, document);
            this.contentHashes.set(contentHash, docId);
            this.updateTagIndex(docId, tags.validated);
            
            // Update statistics
            this.stats.totalDocuments++;
            this.stats.processedDocuments++;
            if (encryptionRequired) this.stats.encryptedDocuments++;
            if (categorization.primaryBucket !== 'quarantine') this.stats.categorizedDocuments++;
            if (tags.validated.length > 0) this.stats.taggedDocuments++;
            
            // Save registry
            await this.saveDocumentRegistry();
            
            console.log(`✅ Document processed: ${docId} → ${categorization.primaryBucket}/${categorization.subBucket}`);
            
            this.emit('documentProcessed', document);
            
            return { success: true, document };
            
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            
            // Move to quarantine
            const quarantineDoc = await this.quarantineDocument(filePath, error);
            
            return { success: false, error: error.message, document: quarantineDoc };
        }
    }
    
    async extractMetadata(filePath, content) {
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        const metadata = {
            filename: path.basename(filePath),
            extension: ext,
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString(),
            lineCount: content.split('\n').length,
            wordCount: content.split(/\s+/).length,
            charCount: content.length
        };
        
        // Extract specific metadata based on file type
        if (ext === '.md') {
            metadata.markdown = this.extractMarkdownMetadata(content);
        } else if (ext === '.js') {
            metadata.javascript = this.extractJavaScriptMetadata(content);
        } else if (ext === '.json') {
            try {
                metadata.json = JSON.parse(content);
                metadata.jsonValid = true;
            } catch (error) {
                metadata.jsonValid = false;
                metadata.jsonError = error.message;
            }
        }
        
        return metadata;
    }
    
    extractMarkdownMetadata(content) {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const headings = [...content.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => match[1]);
        const links = [...content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(match => ({
            text: match[1],
            url: match[2]
        }));
        
        return {
            frontMatter: frontMatterMatch ? frontMatterMatch[1] : null,
            headings,
            links,
            hasCodeBlocks: content.includes('```'),
            hasTables: content.includes('|')
        };
    }
    
    extractJavaScriptMetadata(content) {
        const functions = [...content.matchAll(/(?:function\s+(\w+)|const\s+(\w+)\s*=.*?=>|class\s+(\w+))/g)]
            .map(match => match[1] || match[2] || match[3]);
        
        const imports = [...content.matchAll(/(?:import|require)\s*\(?[^)]*\)?\s*from\s*['"]([^'"]+)['"]/g)]
            .map(match => match[1]);
        
        const exports = [...content.matchAll(/(?:export|module\.exports)\s*=?\s*(\w+)?/g)]
            .map(match => match[1]).filter(Boolean);
        
        return {
            functions,
            imports,
            exports,
            hasComments: content.includes('//') || content.includes('/*'),
            hasTests: content.includes('test(') || content.includes('describe('),
            linesOfCode: content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length
        };
    }
    
    async analyzeContent(content, metadata) {
        if (!this.aiAvailable) {
            return this.fallbackAnalysis(content, metadata);
        }
        
        try {
            const prompt = `Analyze this document and provide insights in JSON format:
            
Content: ${content.substring(0, 2000)}...

Please analyze:
1. Primary purpose/intent
2. Quality score (0-1)
3. Complexity level (simple/moderate/complex)
4. Suggested category
5. Key topics/themes
6. Recommended tags

Return only valid JSON.`;
            
            const response = await axios.post(`${this.config.ollamaUrl}/api/generate`, {
                model: this.config.ollamaModel,
                prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    top_p: 0.9
                }
            });
            
            const aiResponse = response.data.response;
            
            try {
                return JSON.parse(aiResponse);
            } catch (parseError) {
                console.warn('⚠️ AI returned invalid JSON, using fallback analysis');
                return this.fallbackAnalysis(content, metadata);
            }
            
        } catch (error) {
            console.warn('⚠️ AI analysis failed, using fallback');
            return this.fallbackAnalysis(content, metadata);
        }
    }
    
    fallbackAnalysis(content, metadata) {
        // Rule-based analysis when AI is unavailable
        const analysis = {
            purpose: 'unknown',
            quality: 0.5,
            complexity: 'moderate',
            category: 'uncategorized',
            topics: [],
            tags: []
        };
        
        // Determine purpose based on file extension and content
        if (metadata.extension === '.md') {
            analysis.purpose = 'documentation';
            analysis.category = 'documentation';
        } else if (metadata.extension === '.js') {
            analysis.purpose = 'code';
            analysis.category = 'active-development';
        } else if (metadata.filename.toLowerCase().includes('test')) {
            analysis.purpose = 'testing';
            analysis.category = 'tests';
        }
        
        // Determine quality based on content characteristics
        let qualityScore = 0.5;
        
        if (content.includes('TODO') || content.includes('FIXME')) {
            qualityScore -= 0.2;
        }
        
        if (metadata.javascript && metadata.javascript.hasComments) {
            qualityScore += 0.2;
        }
        
        if (metadata.lineCount > 100) {
            qualityScore += 0.1;
        }
        
        analysis.quality = Math.max(0, Math.min(1, qualityScore));
        
        // Determine complexity
        if (metadata.lineCount > 500 || (metadata.javascript && metadata.javascript.functions.length > 10)) {
            analysis.complexity = 'complex';
        } else if (metadata.lineCount < 50) {
            analysis.complexity = 'simple';
        }
        
        return analysis;
    }
    
    async categorizeDocument(content, metadata, analysis) {
        // Primary categorization logic
        let primaryBucket = 'quarantine'; // Default to quarantine
        let subBucket = 'unprocessable';
        
        // Rule-based categorization
        if (analysis.category && this.bucketHierarchy[analysis.category]) {
            primaryBucket = analysis.category;
            subBucket = this.bucketHierarchy[primaryBucket].subBuckets[0];
        } else {
            // Map analysis categories to buckets
            const categoryMap = {
                'documentation': 'templates',
                'code': 'active',
                'test': 'active',
                'experiment': 'experimental',
                'archive': 'archived',
                'template': 'templates'
            };
            
            primaryBucket = categoryMap[analysis.category] || 'experimental';
            
            // Determine sub-bucket based on content analysis
            if (primaryBucket === 'active') {
                if (content.includes('TODO') || analysis.quality < 0.6) {
                    subBucket = 'development';
                } else if (content.includes('test')) {
                    subBucket = 'testing';
                } else {
                    subBucket = 'review';
                }
            } else {
                subBucket = this.bucketHierarchy[primaryBucket].subBuckets[0];
            }
        }
        
        return { primaryBucket, subBucket };
    }
    
    async generateTags(content, metadata, analysis) {
        const rawTags = [];
        
        // Extract tags from analysis
        if (analysis.tags) {
            rawTags.push(...analysis.tags);
        }
        
        // Generate rule-based tags
        if (metadata.extension) {
            rawTags.push(`ext-${metadata.extension.replace('.', '')}`);
        }
        
        if (analysis.complexity) {
            rawTags.push(`complexity-${analysis.complexity}`);
        }
        
        if (analysis.purpose) {
            rawTags.push(`purpose-${analysis.purpose}`);
        }
        
        // Content-based tags
        if (content.includes('function')) rawTags.push('function');
        if (content.includes('class')) rawTags.push('class');
        if (content.includes('TODO')) rawTags.push('needs-work');
        if (content.includes('FIXME')) rawTags.push('bug');
        if (content.includes('security')) rawTags.push('security');
        if (content.includes('crypto') || content.includes('encrypt')) rawTags.push('encryption');
        
        // Validate and normalize tags
        const validatedTags = [];
        const rejectedTags = [];
        
        for (const tag of rawTags) {
            const validation = this.tagValidator.validateTag(tag.toLowerCase());
            
            if (validation.valid) {
                const finalTag = validation.canonical || tag.toLowerCase();
                if (!validatedTags.includes(finalTag)) {
                    validatedTags.push(finalTag);
                }
            } else {
                rejectedTags.push({
                    original: tag,
                    reason: 'invalid',
                    suggestion: validation.suggestion
                });
            }
        }
        
        return {
            raw: rawTags,
            validated: validatedTags,
            rejected: rejectedTags
        };
    }
    
    determineEncryptionRequirement(categorization, tags, options) {
        // Force encryption if requested
        if (options.forceEncrypt) return true;
        
        // Never encrypt if disabled
        if (options.noEncrypt) return false;
        
        // Check bucket encryption policy
        const bucket = this.bucketHierarchy[categorization.primaryBucket];
        
        if (bucket.encryption === 'mandatory') return true;
        if (bucket.encryption === 'none') return false;
        
        // Check for sensitive tags
        const sensitiveKeys = ['security', 'encryption', 'confidential', 'personal', 'financial'];
        const hasSensitiveTags = tags.validated.some(tag => 
            sensitiveKeys.some(key => tag.includes(key))
        );
        
        if (hasSensitiveTags) return true;
        
        // Default based on bucket policy
        return bucket.encryption === 'required';
    }
    
    async storeDocument(document, content, encrypt) {
        const bucketPath = path.join(this.config.vaultPath, document.bucket, document.subBucket);
        const filename = `${document.id}_${document.filename}`;
        const filePath = path.join(bucketPath, filename);
        
        if (encrypt) {
            const encryptedContent = await this.encryptContent(content, document.id);
            await fs.writeFile(filePath + '.encrypted', encryptedContent);
            return filePath + '.encrypted';
        } else {
            await fs.writeFile(filePath, content);
            return filePath;
        }
    }
    
    async encryptContent(content, docId) {
        if (!this.config.encryptionKey) {
            throw new Error('Encryption key not configured');
        }
        
        // Generate document-specific key
        const docKey = crypto.pbkdf2Sync(this.config.encryptionKey, docId, 10000, 32, 'sha256');
        this.encryptionKeys.set(docId, docKey.toString('hex'));
        
        // Encrypt content
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', docKey);
        
        let encrypted = cipher.update(content, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return JSON.stringify({
            iv: iv.toString('hex'),
            content: encrypted,
            algorithm: 'aes-256-cbc'
        });
    }
    
    async decryptContent(encryptedData, docId) {
        if (!this.encryptionKeys.has(docId)) {
            throw new Error(`Encryption key not found for document ${docId}`);
        }
        
        const docKey = Buffer.from(this.encryptionKeys.get(docId), 'hex');
        const data = JSON.parse(encryptedData);
        
        const decipher = crypto.createDecipher(data.algorithm, docKey);
        let decrypted = decipher.update(data.content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    async quarantineDocument(filePath, error) {
        const quarantineDir = path.join(this.config.vaultPath, 'quarantine', 'corrupted');
        await this.ensureDirectory(quarantineDir);
        
        const docId = `quarantine_${Date.now()}`;
        const filename = path.basename(filePath);
        const quarantinePath = path.join(quarantineDir, `${docId}_${filename}`);
        
        // Copy original file to quarantine
        try {
            await fs.copyFile(filePath, quarantinePath);
        } catch (copyError) {
            console.error(`Failed to quarantine file: ${copyError.message}`);
        }
        
        const quarantineDoc = {
            id: docId,
            originalPath: filePath,
            filename,
            bucket: 'quarantine',
            subBucket: 'corrupted',
            quarantineReason: error.message,
            quarantineDate: new Date().toISOString(),
            storagePath: quarantinePath
        };
        
        this.documentRegistry.set(docId, quarantineDoc);
        
        return quarantineDoc;
    }
    
    updateTagIndex(docId, tags) {
        for (const tag of tags) {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(docId);
        }
    }
    
    // Search and retrieval methods
    async searchDocuments(query) {
        const results = [];
        
        for (const [docId, doc] of this.documentRegistry) {
            let score = 0;
            
            // Text search in filename
            if (doc.filename.toLowerCase().includes(query.toLowerCase())) {
                score += 3;
            }
            
            // Tag matching
            for (const tag of doc.tags || []) {
                if (tag.includes(query.toLowerCase())) {
                    score += 2;
                }
            }
            
            // Metadata search
            if (doc.analysis && doc.analysis.topics) {
                for (const topic of doc.analysis.topics) {
                    if (topic.toLowerCase().includes(query.toLowerCase())) {
                        score += 1;
                    }
                }
            }
            
            if (score > 0) {
                results.push({ document: doc, score });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }
    
    async getDocumentsByTag(tag) {
        const docIds = this.tagIndex.get(tag.toLowerCase()) || new Set();
        return Array.from(docIds).map(docId => this.documentRegistry.get(docId));
    }
    
    async getDocumentsByBucket(bucket, subBucket = null) {
        return Array.from(this.documentRegistry.values()).filter(doc => {
            if (doc.bucket !== bucket) return false;
            if (subBucket && doc.subBucket !== subBucket) return false;
            return true;
        });
    }
    
    getStats() {
        return {
            ...this.stats,
            bucketStats: Object.keys(this.bucketHierarchy).reduce((stats, bucket) => {
                stats[bucket] = Array.from(this.documentRegistry.values())
                    .filter(doc => doc.bucket === bucket).length;
                return stats;
            }, {}),
            tagStats: Object.fromEntries(
                Array.from(this.tagIndex.entries()).map(([tag, docs]) => [tag, docs.size])
            )
        };
    }
}

// CLI Usage
if (require.main === module) {
    const organizer = new UnifiedDocumentOrganizer({
        vaultPath: process.argv[2] || './vault',
        aiEnabled: !process.argv.includes('--no-ai')
    });
    
    organizer.initialize().then(async () => {
        console.log('\n🗂️ Unified Document Organizer ready!');
        console.log('📊 Current statistics:', organizer.getStats());
        
        if (process.argv[3]) {
            console.log(`\n📄 Processing document: ${process.argv[3]}`);
            const result = await organizer.processDocument(process.argv[3]);
            console.log('📋 Result:', result);
        }
        
    }).catch(error => {
        console.error('❌ Failed to initialize:', error);
        process.exit(1);
    });
}

module.exports = UnifiedDocumentOrganizer;
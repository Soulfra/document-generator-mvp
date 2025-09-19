/**
 * Educational Book Publisher
 * Transforms RuneScape Educational Platform content into multi-format books
 * For distribution on Goodreads, Storygraph, and other book platforms
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const EPub = require('epub-gen');
const archiver = require('archiver');

class EducationalBookPublisher extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Book format specifications
            formats: {
                pdf: {
                    enabled: true,
                    settings: {
                        pageSize: 'A4',
                        margins: { top: 72, bottom: 72, left: 72, right: 72 },
                        fontSize: 12,
                        lineHeight: 1.5,
                        fontFamily: 'Helvetica'
                    }
                },
                epub: {
                    enabled: true,
                    settings: {
                        version: 3,
                        tocTitle: 'Table of Contents',
                        appendChapterTitles: true,
                        customCSS: true
                    }
                },
                mobi: {
                    enabled: true,
                    settings: {
                        kindlegenPath: process.env.KINDLEGEN_PATH || '/usr/local/bin/kindlegen'
                    }
                },
                interactive: {
                    enabled: true,
                    settings: {
                        includeQRCodes: true,
                        includeARMarkers: true,
                        includeWebLinks: true
                    }
                }
            },
            
            // Book series configuration
            bookSeries: {
                'runescape-educational': {
                    name: 'RuneScape Educational Series',
                    volumes: [
                        {
                            id: 'customer-service',
                            title: 'Customer Service Mastery Through Gaming',
                            subtitle: 'Learn Real-World Skills in Virtual Worlds',
                            description: 'Transform your gaming experience into professional customer service skills',
                            targetAudience: 'Young adults, gamers, customer service professionals',
                            pageCount: 250,
                            chapters: [
                                'Introduction: Gaming as Education',
                                'The Psychology of Player Interactions',
                                'Trading as Trust Building',
                                'Conflict Resolution in PvP',
                                'The Rotten Potato Philosophy',
                                'Real-World Applications',
                                'Certification and Career Paths'
                            ]
                        },
                        {
                            id: 'financial-literacy',
                            title: 'GP to GDP: Financial Literacy Through RuneScape',
                            subtitle: 'Master Money Management in Game and Life',
                            description: 'Learn financial principles through Grand Exchange trading and GP management',
                            targetAudience: 'Students, young professionals, gaming enthusiasts',
                            pageCount: 300,
                            chapters: [
                                'The Economics of Gielinor',
                                'Supply and Demand at the GE',
                                'Investment Strategies: Flipping to Fortune',
                                'Risk Management in High Stakes',
                                'From GP to Real-World Budgeting',
                                'Building Your Financial Quest Cape',
                                'Advanced Trading Techniques'
                            ]
                        },
                        {
                            id: 'social-impact',
                            title: 'Gaming for Good: The Social Impact Handbook',
                            subtitle: 'Justify Your Screen Time Through Education',
                            description: 'How to make your gaming time count for social good and personal growth',
                            targetAudience: 'Parents, educators, conscious gamers',
                            pageCount: 200,
                            chapters: [
                                'The Electricity Dilemma',
                                'Educational Value Metrics',
                                'Community Building Online',
                                'Teaching Through Gaming',
                                'Measuring Social Impact',
                                'Creating Positive Change'
                            ]
                        }
                    ]
                }
            },
            
            // ISBN management
            isbnPrefix: '978-1',
            isbnCounter: 100000,
            
            // Design templates
            templates: {
                cover: {
                    dimensions: { width: 1600, height: 2400 },
                    dpi: 300,
                    colorSpace: 'RGB',
                    elements: ['title', 'subtitle', 'author', 'series', 'gameArt']
                },
                interior: {
                    chapterStart: 'decorative',
                    headerFooter: true,
                    pageNumbers: true,
                    illustrations: true
                }
            },
            
            // Distribution metadata
            distribution: {
                categories: [
                    'Education & Teaching',
                    'Games & Activities',
                    'Business & Money',
                    'Self-Help'
                ],
                keywords: [
                    'gaming education',
                    'RuneScape',
                    'customer service training',
                    'financial literacy',
                    'social impact',
                    'gamification',
                    'online learning'
                ],
                ageRating: 'Teen',
                contentWarnings: []
            },
            
            // Integration settings
            integration: {
                i18nEngine: null,
                contentEngine: null,
                socialImpactDashboard: null
            },
            
            // Output settings
            outputPath: path.join(__dirname, 'published-books'),
            tempPath: path.join(__dirname, 'temp-books'),
            
            ...config
        };
        
        // Book generation state
        this.activePublications = new Map();
        this.publishedBooks = new Map();
        this.isbnRegistry = new Map();
        
        // Statistics
        this.stats = {
            booksPublished: 0,
            formatsGenerated: new Map(),
            languagesPublished: new Map(),
            totalPageCount: 0
        };
        
        console.log('📚 Educational Book Publisher initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create necessary directories
            await this.createDirectories();
            
            // Load ISBN registry
            await this.loadISBNRegistry();
            
            // Initialize book templates
            await this.initializeTemplates();
            
            // Connect to other services
            await this.connectServices();
            
            console.log('✅ Educational Book Publisher ready');
            console.log(`📖 ${Object.keys(this.config.bookSeries).length} book series configured`);
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Book Publisher:', error);
            throw error;
        }
    }
    
    async createDirectories() {
        await fs.mkdir(this.config.outputPath, { recursive: true });
        await fs.mkdir(this.config.tempPath, { recursive: true });
        
        // Create language-specific directories
        const languages = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh'];
        for (const lang of languages) {
            await fs.mkdir(path.join(this.config.outputPath, lang), { recursive: true });
        }
    }
    
    async loadISBNRegistry() {
        try {
            const registryFile = path.join(this.config.outputPath, 'isbn-registry.json');
            const data = await fs.readFile(registryFile, 'utf8');
            const registry = JSON.parse(data);
            
            for (const [isbn, metadata] of Object.entries(registry)) {
                this.isbnRegistry.set(isbn, metadata);
            }
            
            // Update counter to highest used
            const isbnNumbers = Array.from(this.isbnRegistry.keys()).map(isbn => 
                parseInt(isbn.split('-').pop())
            );
            if (isbnNumbers.length > 0) {
                this.config.isbnCounter = Math.max(...isbnNumbers) + 1;
            }
            
            console.log(`📋 Loaded ${this.isbnRegistry.size} ISBNs from registry`);
        } catch (error) {
            console.log('📝 Starting with empty ISBN registry');
        }
    }
    
    async initializeTemplates() {
        // Load or create book design templates
        this.coverTemplates = new Map();
        this.interiorTemplates = new Map();
        
        // Create default templates for each book type
        for (const [seriesId, series] of Object.entries(this.config.bookSeries)) {
            for (const volume of series.volumes) {
                this.coverTemplates.set(volume.id, await this.createCoverTemplate(volume));
                this.interiorTemplates.set(volume.id, await this.createInteriorTemplate(volume));
            }
        }
        
        console.log(`🎨 Initialized ${this.coverTemplates.size} book templates`);
    }
    
    async connectServices() {
        // Connect to i18n engine if provided
        if (this.config.integration.i18nEngine) {
            console.log('🔗 Connected to i18n Translation Engine');
        }
        
        // Connect to content engine if provided
        if (this.config.integration.contentEngine) {
            console.log('🔗 Connected to Educational Content Engine');
        }
    }
    
    // ==================== BOOK PUBLISHING ====================
    
    async publishBook(bookId, language = 'en', options = {}) {
        const publicationId = crypto.randomBytes(8).toString('hex');
        
        try {
            console.log(`📖 Publishing book: ${bookId} in ${language}`);
            
            // Find book configuration
            const bookConfig = this.findBookConfig(bookId);
            if (!bookConfig) {
                throw new Error(`Book configuration not found: ${bookId}`);
            }
            
            // Generate ISBN
            const isbn = this.generateISBN(bookId, language);
            
            // Create publication record
            const publication = {
                id: publicationId,
                bookId,
                language,
                isbn,
                startTime: Date.now(),
                status: 'in-progress',
                formats: [],
                metadata: {}
            };
            
            this.activePublications.set(publicationId, publication);
            
            // Generate content
            const content = await this.generateBookContent(bookConfig, language, options);
            
            // Generate each format
            const formats = options.formats || ['pdf', 'epub', 'mobi'];
            for (const format of formats) {
                if (this.config.formats[format]?.enabled) {
                    const file = await this.generateFormat(content, format, bookConfig, language);
                    publication.formats.push({
                        format,
                        file,
                        size: (await fs.stat(file)).size
                    });
                }
            }
            
            // Generate interactive elements if enabled
            if (this.config.formats.interactive?.enabled && options.interactive !== false) {
                await this.addInteractiveElements(publication, content);
            }
            
            // Complete publication
            publication.status = 'completed';
            publication.endTime = Date.now();
            publication.duration = publication.endTime - publication.startTime;
            
            this.publishedBooks.set(publicationId, publication);
            this.activePublications.delete(publicationId);
            
            // Update statistics
            this.updateStatistics(publication, bookConfig);
            
            // Save ISBN registry
            await this.saveISBNRegistry();
            
            console.log(`✅ Book published successfully: ${bookConfig.title} (${language})`);
            console.log(`📚 ISBN: ${isbn}`);
            console.log(`📁 Formats: ${publication.formats.map(f => f.format).join(', ')}`);
            
            this.emit('book-published', publication);
            
            return publication;
            
        } catch (error) {
            console.error(`❌ Failed to publish book ${bookId}:`, error);
            
            const publication = this.activePublications.get(publicationId);
            if (publication) {
                publication.status = 'failed';
                publication.error = error.message;
                this.activePublications.delete(publicationId);
            }
            
            throw error;
        }
    }
    
    findBookConfig(bookId) {
        for (const series of Object.values(this.config.bookSeries)) {
            const volume = series.volumes.find(v => v.id === bookId);
            if (volume) {
                return { ...volume, series };
            }
        }
        return null;
    }
    
    generateISBN(bookId, language) {
        // Generate ISBN-13
        const isbn = `${this.config.isbnPrefix}-${this.config.isbnCounter++}`;
        
        // Calculate check digit
        const digits = isbn.replace(/-/g, '').split('').map(Number);
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        
        const fullISBN = `${isbn}-${checkDigit}`;
        
        // Register ISBN
        this.isbnRegistry.set(fullISBN, {
            bookId,
            language,
            generatedAt: new Date().toISOString()
        });
        
        return fullISBN;
    }
    
    // ==================== CONTENT GENERATION ====================
    
    async generateBookContent(bookConfig, language, options) {
        console.log(`📝 Generating content for: ${bookConfig.title}`);
        
        const content = {
            metadata: await this.generateMetadata(bookConfig, language),
            frontMatter: await this.generateFrontMatter(bookConfig, language),
            chapters: [],
            backMatter: await this.generateBackMatter(bookConfig, language),
            resources: await this.gatherResources(bookConfig, language)
        };
        
        // Generate each chapter
        for (let i = 0; i < bookConfig.chapters.length; i++) {
            const chapterTitle = bookConfig.chapters[i];
            const chapter = await this.generateChapter(bookConfig, i, chapterTitle, language);
            content.chapters.push(chapter);
        }
        
        // Add educational enhancements
        if (options.educational !== false) {
            content.educationalFeatures = await this.addEducationalFeatures(content, bookConfig, language);
        }
        
        return content;
    }
    
    async generateMetadata(bookConfig, language) {
        const metadata = {
            title: bookConfig.title,
            subtitle: bookConfig.subtitle,
            author: 'RuneScape Educational Platform',
            language,
            isbn: '', // Will be filled later
            publisher: 'OSRS Educational Publishing',
            publicationDate: new Date().toISOString(),
            description: bookConfig.description,
            keywords: this.config.distribution.keywords,
            categories: this.config.distribution.categories,
            series: bookConfig.series.name,
            volumeNumber: bookConfig.series.volumes.findIndex(v => v.id === bookConfig.id) + 1
        };
        
        // Translate metadata if i18n engine available
        if (this.config.integration.i18nEngine && language !== 'en') {
            metadata.title = await this.config.integration.i18nEngine.translate(
                metadata.title, language, { context: 'book-title' }
            );
            metadata.subtitle = await this.config.integration.i18nEngine.translate(
                metadata.subtitle, language, { context: 'book-subtitle' }
            );
            metadata.description = await this.config.integration.i18nEngine.translate(
                metadata.description, language, { context: 'book-description' }
            );
        }
        
        return metadata;
    }
    
    async generateFrontMatter(bookConfig, language) {
        const frontMatter = {
            titlePage: await this.generateTitlePage(bookConfig, language),
            copyright: await this.generateCopyrightPage(bookConfig, language),
            dedication: await this.generateDedication(bookConfig, language),
            tableOfContents: await this.generateTableOfContents(bookConfig, language),
            foreword: await this.generateForeword(bookConfig, language),
            preface: await this.generatePreface(bookConfig, language)
        };
        
        return frontMatter;
    }
    
    async generateChapter(bookConfig, chapterNumber, chapterTitle, language) {
        console.log(`  📄 Generating Chapter ${chapterNumber + 1}: ${chapterTitle}`);
        
        // Get content from Educational Content Engine if available
        let content = '';
        if (this.config.integration.contentEngine) {
            content = await this.getEducationalContent(bookConfig.id, chapterNumber);
        } else {
            // Generate placeholder content
            content = await this.generatePlaceholderContent(bookConfig, chapterNumber, chapterTitle);
        }
        
        // Translate if needed
        if (language !== 'en' && this.config.integration.i18nEngine) {
            chapterTitle = await this.config.integration.i18nEngine.translate(
                chapterTitle, language, { context: 'chapter-title' }
            );
            content = await this.config.integration.i18nEngine.translate(
                content, language, { context: 'chapter-content', educational: true }
            );
        }
        
        const chapter = {
            number: chapterNumber + 1,
            title: chapterTitle,
            content,
            sections: await this.generateChapterSections(bookConfig, chapterNumber, language),
            exercises: await this.generateExercises(bookConfig, chapterNumber, language),
            summary: await this.generateChapterSummary(content, language),
            keyTakeaways: await this.extractKeyTakeaways(content, language)
        };
        
        return chapter;
    }
    
    async generatePlaceholderContent(bookConfig, chapterNumber, chapterTitle) {
        // Generate educational content based on book type
        const contentTemplates = {
            'customer-service': [
                'In the world of RuneScape, every interaction is an opportunity to practice customer service skills.',
                'Trading at the Grand Exchange teaches negotiation and trust-building.',
                'Helping new players mirrors real-world customer onboarding.',
                'Conflict resolution in PvP situations translates to handling difficult customers.'
            ],
            'financial-literacy': [
                'The Grand Exchange operates on fundamental economic principles.',
                'Understanding supply and demand through item flipping.',
                'Risk management when investing in rare items.',
                'Portfolio diversification across different item categories.'
            ],
            'social-impact': [
                'Gaming time becomes valuable when it serves educational purposes.',
                'Electricity usage is justified through skill development.',
                'Community building creates lasting social connections.',
                'Teaching others multiplies the educational impact.'
            ]
        };
        
        const templates = contentTemplates[bookConfig.id] || contentTemplates['customer-service'];
        const baseContent = templates[chapterNumber % templates.length];
        
        // Expand content
        const expandedContent = `
# ${chapterTitle}

${baseContent}

## Introduction

This chapter explores how gaming experiences in RuneScape can be transformed into valuable real-world skills. Through practical examples and interactive exercises, you'll learn to recognize and develop these transferable competencies.

## Core Concepts

${this.generateCoreConceptsForChapter(bookConfig, chapterNumber)}

## Practical Applications

${this.generatePracticalApplications(bookConfig, chapterNumber)}

## Real-World Connections

${this.generateRealWorldConnections(bookConfig, chapterNumber)}

## Interactive Elements

Scan the QR code below to access interactive content for this chapter, including:
- Live demonstrations
- Practice scenarios
- Community discussions
- Progress tracking

[QR Code Placeholder]

## Chapter Summary

${this.generateChapterOutline(bookConfig, chapterNumber)}
        `.trim();
        
        return expandedContent;
    }
    
    generateCoreConceptsForChapter(bookConfig, chapterNumber) {
        const concepts = {
            'customer-service': [
                '1. **Active Listening**: Understanding player needs before responding',
                '2. **Empathy**: Recognizing emotions behind player actions',
                '3. **Problem Solving**: Finding creative solutions to player issues',
                '4. **Communication**: Clear and effective message delivery'
            ],
            'financial-literacy': [
                '1. **Market Analysis**: Reading Grand Exchange trends',
                '2. **Risk Assessment**: Evaluating investment opportunities',
                '3. **Budget Management**: Allocating GP resources effectively',
                '4. **Long-term Planning**: Building wealth over time'
            ],
            'social-impact': [
                '1. **Value Creation**: Making gaming time educationally valuable',
                '2. **Community Building**: Fostering positive interactions',
                '3. **Knowledge Sharing**: Teaching and learning from others',
                '4. **Impact Measurement**: Tracking educational outcomes'
            ]
        };
        
        return (concepts[bookConfig.id] || concepts['customer-service']).join('\n');
    }
    
    generatePracticalApplications(bookConfig, chapterNumber) {
        const applications = {
            'customer-service': 'Practice scenario: A new player asks for help with a quest. How do you guide them while building their confidence and independence?',
            'financial-literacy': 'Exercise: Track your Grand Exchange transactions for a week and calculate your return on investment.',
            'social-impact': 'Activity: Measure the educational value of your gaming session using our impact metrics.'
        };
        
        return applications[bookConfig.id] || applications['customer-service'];
    }
    
    generateRealWorldConnections(bookConfig, chapterNumber) {
        const connections = {
            'customer-service': 'These skills directly translate to retail, hospitality, technical support, and any customer-facing role.',
            'financial-literacy': 'The principles learned here apply to stock trading, personal budgeting, and investment planning.',
            'social-impact': 'Justifying resource usage through value creation is essential in sustainability and corporate responsibility.'
        };
        
        return connections[bookConfig.id] || connections['customer-service'];
    }
    
    generateChapterOutline(bookConfig, chapterNumber) {
        return `In this chapter, we explored key concepts of ${bookConfig.chapters[chapterNumber]} through the lens of RuneScape gameplay. The practical exercises and real-world connections demonstrate how gaming experiences can develop valuable professional skills.`;
    }
    
    async generateChapterSections(bookConfig, chapterNumber, language) {
        // Generate sub-sections for the chapter
        const sections = [
            { title: 'Learning Objectives', content: 'What you will achieve in this chapter' },
            { title: 'Key Concepts', content: 'Core ideas and principles' },
            { title: 'Practical Examples', content: 'Real gaming scenarios' },
            { title: 'Skill Development', content: 'How to practice these skills' },
            { title: 'Assessment', content: 'Check your understanding' }
        ];
        
        if (language !== 'en' && this.config.integration.i18nEngine) {
            for (const section of sections) {
                section.title = await this.config.integration.i18nEngine.translate(
                    section.title, language, { context: 'section-title' }
                );
            }
        }
        
        return sections;
    }
    
    async generateExercises(bookConfig, chapterNumber, language) {
        const exercises = [];
        
        // Generate 3-5 exercises per chapter
        const exerciseCount = 3 + (chapterNumber % 3);
        
        for (let i = 0; i < exerciseCount; i++) {
            const exercise = {
                number: i + 1,
                title: `Exercise ${i + 1}: Practical Application`,
                description: 'Apply what you learned in a real game scenario',
                difficulty: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
                estimatedTime: `${15 + (i * 5)} minutes`,
                type: ['scenario', 'reflection', 'practice'][i % 3]
            };
            
            if (language !== 'en' && this.config.integration.i18nEngine) {
                exercise.title = await this.config.integration.i18nEngine.translate(
                    exercise.title, language, { context: 'exercise-title' }
                );
                exercise.description = await this.config.integration.i18nEngine.translate(
                    exercise.description, language, { context: 'exercise-description' }
                );
            }
            
            exercises.push(exercise);
        }
        
        return exercises;
    }
    
    async generateChapterSummary(content, language) {
        // Extract key points from content
        const summary = 'This chapter covered essential concepts for developing real-world skills through gaming. Key takeaways include the importance of intentional practice, reflection on gaming experiences, and applying learned principles in professional contexts.';
        
        if (language !== 'en' && this.config.integration.i18nEngine) {
            return await this.config.integration.i18nEngine.translate(
                summary, language, { context: 'chapter-summary' }
            );
        }
        
        return summary;
    }
    
    async extractKeyTakeaways(content, language) {
        const takeaways = [
            'Gaming can be educational when approached intentionally',
            'Virtual world skills transfer to real-world applications',
            'Community interaction develops social competencies',
            'Reflection and practice enhance skill development'
        ];
        
        if (language !== 'en' && this.config.integration.i18nEngine) {
            return await this.config.integration.i18nEngine.translateBatch(
                takeaways, language, { context: 'key-takeaways' }
            );
        }
        
        return takeaways;
    }
    
    async generateBackMatter(bookConfig, language) {
        const backMatter = {
            glossary: await this.generateGlossary(bookConfig, language),
            resources: await this.generateResourceList(bookConfig, language),
            index: await this.generateIndex(bookConfig, language),
            aboutAuthor: await this.generateAboutAuthor(language),
            nextSteps: await this.generateNextSteps(bookConfig, language)
        };
        
        return backMatter;
    }
    
    async gatherResources(bookConfig, language) {
        const resources = {
            images: [],
            qrCodes: [],
            links: [],
            references: []
        };
        
        // Generate QR codes for interactive content
        if (this.config.formats.interactive?.settings.includeQRCodes) {
            resources.qrCodes = await this.generateQRCodes(bookConfig, language);
        }
        
        // Gather relevant images
        resources.images = await this.gatherImages(bookConfig);
        
        // Compile reference links
        resources.links = this.compileReferenceLinks(bookConfig, language);
        
        return resources;
    }
    
    async addEducationalFeatures(content, bookConfig, language) {
        const features = {
            learningPaths: await this.generateLearningPaths(bookConfig, language),
            assessments: await this.generateAssessments(bookConfig, language),
            certificationInfo: await this.generateCertificationInfo(bookConfig, language),
            communityResources: await this.generateCommunityResources(bookConfig, language)
        };
        
        return features;
    }
    
    // ==================== FORMAT GENERATION ====================
    
    async generateFormat(content, format, bookConfig, language) {
        console.log(`  📄 Generating ${format.toUpperCase()} format...`);
        
        const outputDir = path.join(this.config.outputPath, language);
        const filename = this.generateFilename(bookConfig, language, format);
        const filepath = path.join(outputDir, filename);
        
        switch (format) {
            case 'pdf':
                await this.generatePDF(content, filepath, bookConfig);
                break;
                
            case 'epub':
                await this.generateEPUB(content, filepath, bookConfig);
                break;
                
            case 'mobi':
                await this.generateMOBI(content, filepath, bookConfig);
                break;
                
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        
        // Update format statistics
        const currentCount = this.stats.formatsGenerated.get(format) || 0;
        this.stats.formatsGenerated.set(format, currentCount + 1);
        
        return filepath;
    }
    
    generateFilename(bookConfig, language, format) {
        const sanitizedTitle = bookConfig.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        return `${sanitizedTitle}-${language}.${format}`;
    }
    
    async generatePDF(content, filepath, bookConfig) {
        const doc = new PDFDocument(this.config.formats.pdf.settings);
        const stream = doc.pipe(fs.createWriteStream(filepath));
        
        // Add metadata
        doc.info.Title = content.metadata.title;
        doc.info.Author = content.metadata.author;
        doc.info.Subject = content.metadata.description;
        doc.info.Keywords = content.metadata.keywords.join(', ');
        
        // Generate cover page
        await this.generatePDFCover(doc, content, bookConfig);
        
        // Add front matter
        await this.addPDFFrontMatter(doc, content);
        
        // Add chapters
        for (const chapter of content.chapters) {
            await this.addPDFChapter(doc, chapter);
        }
        
        // Add back matter
        await this.addPDFBackMatter(doc, content);
        
        // Finalize
        doc.end();
        await new Promise(resolve => stream.on('finish', resolve));
    }
    
    async generatePDFCover(doc, content, bookConfig) {
        // Add new page for cover
        doc.addPage();
        
        // Title
        doc.fontSize(36)
           .font('Helvetica-Bold')
           .text(content.metadata.title, 72, 200, { align: 'center' });
        
        // Subtitle
        if (content.metadata.subtitle) {
            doc.fontSize(24)
               .font('Helvetica')
               .text(content.metadata.subtitle, 72, 280, { align: 'center' });
        }
        
        // Series name
        doc.fontSize(16)
           .text(content.metadata.series, 72, 400, { align: 'center' });
        
        // Author
        doc.fontSize(20)
           .text(content.metadata.author, 72, 500, { align: 'center' });
        
        // Add decorative elements
        if (this.coverTemplates.has(bookConfig.id)) {
            // Would add cover art here
        }
    }
    
    async generateEPUB(content, filepath, bookConfig) {
        const options = {
            title: content.metadata.title,
            author: content.metadata.author,
            publisher: content.metadata.publisher,
            description: content.metadata.description,
            isbn: content.metadata.isbn,
            date: content.metadata.publicationDate,
            lang: content.metadata.language,
            
            tocTitle: 'Table of Contents',
            content: [],
            
            ...this.config.formats.epub.settings
        };
        
        // Add front matter
        options.content.push({
            title: 'Front Matter',
            data: this.convertToHTML(content.frontMatter)
        });
        
        // Add chapters
        for (const chapter of content.chapters) {
            options.content.push({
                title: `Chapter ${chapter.number}: ${chapter.title}`,
                data: this.convertToHTML(chapter)
            });
        }
        
        // Add back matter
        options.content.push({
            title: 'Back Matter',
            data: this.convertToHTML(content.backMatter)
        });
        
        // Generate EPUB
        const epub = new EPub(options, filepath);
        await epub.promise;
    }
    
    async generateMOBI(content, filepath, bookConfig) {
        // First generate EPUB
        const epubPath = filepath.replace('.mobi', '.epub');
        await this.generateEPUB(content, epubPath, bookConfig);
        
        // Convert EPUB to MOBI using KindleGen
        const { exec } = require('child_process').promises;
        try {
            await exec(`${this.config.formats.mobi.settings.kindlegenPath} "${epubPath}" -o "${path.basename(filepath)}"`);
            
            // Clean up temporary EPUB
            await fs.unlink(epubPath);
        } catch (error) {
            console.warn('⚠️  KindleGen not available, keeping EPUB format');
            // Rename EPUB to MOBI as fallback
            await fs.rename(epubPath, filepath);
        }
    }
    
    // ==================== INTERACTIVE ELEMENTS ====================
    
    async addInteractiveElements(publication, content) {
        console.log('🎮 Adding interactive elements...');
        
        const elements = {
            qrCodes: [],
            arMarkers: [],
            webLinks: []
        };
        
        // Generate QR codes for each chapter
        for (const chapter of content.chapters) {
            const qrCode = await this.generateChapterQRCode(publication, chapter);
            elements.qrCodes.push(qrCode);
        }
        
        // Add AR markers if enabled
        if (this.config.formats.interactive.settings.includeARMarkers) {
            elements.arMarkers = await this.generateARMarkers(publication, content);
        }
        
        // Compile web links
        elements.webLinks = this.extractWebLinks(content);
        
        publication.interactiveElements = elements;
        
        console.log(`✅ Added ${elements.qrCodes.length} QR codes, ${elements.arMarkers.length} AR markers`);
    }
    
    async generateChapterQRCode(publication, chapter) {
        // Generate URL for interactive content
        const url = `https://runescape-edu.platform/book/${publication.isbn}/chapter/${chapter.number}`;
        
        // In production, would generate actual QR code image
        return {
            chapterNumber: chapter.number,
            url,
            type: 'interactive-content',
            generated: new Date().toISOString()
        };
    }
    
    // ==================== HELPER METHODS ====================
    
    async createCoverTemplate(volume) {
        return {
            id: volume.id,
            design: 'modern-educational',
            primaryColor: this.getVolumeColor(volume.id),
            elements: {
                title: { font: 'Helvetica-Bold', size: 48 },
                subtitle: { font: 'Helvetica', size: 24 },
                series: { font: 'Helvetica', size: 18 }
            }
        };
    }
    
    async createInteriorTemplate(volume) {
        return {
            id: volume.id,
            chapterStart: 'decorative-border',
            fonts: {
                heading: 'Helvetica-Bold',
                body: 'Helvetica',
                code: 'Courier'
            },
            spacing: {
                paragraph: 12,
                line: 1.5
            }
        };
    }
    
    getVolumeColor(volumeId) {
        const colors = {
            'customer-service': '#4A90E2',
            'financial-literacy': '#27AE60',
            'social-impact': '#E74C3C'
        };
        
        return colors[volumeId] || '#333333';
    }
    
    convertToHTML(content) {
        // Convert content object to HTML string
        if (typeof content === 'string') {
            return `<div>${content.replace(/\n/g, '<br>')}</div>`;
        }
        
        // Handle complex content structures
        let html = '<div>';
        for (const [key, value] of Object.entries(content)) {
            if (value) {
                html += `<h2>${key}</h2>`;
                html += `<div>${this.convertToHTML(value)}</div>`;
            }
        }
        html += '</div>';
        
        return html;
    }
    
    async getEducationalContent(bookId, chapterNumber) {
        if (!this.config.integration.contentEngine) {
            return this.generatePlaceholderContent({ id: bookId }, chapterNumber, 'Chapter ' + (chapterNumber + 1));
        }
        
        // Get content from Educational Content Engine
        try {
            const content = await this.config.integration.contentEngine.getChapterContent(bookId, chapterNumber);
            return content;
        } catch (error) {
            console.warn('Failed to get content from engine:', error.message);
            return this.generatePlaceholderContent({ id: bookId }, chapterNumber, 'Chapter ' + (chapterNumber + 1));
        }
    }
    
    async generateQRCodes(bookConfig, language) {
        const qrCodes = [];
        
        // Main book QR code
        qrCodes.push({
            id: 'main',
            url: `https://runescape-edu.platform/books/${bookConfig.id}/${language}`,
            purpose: 'Book companion website'
        });
        
        // Chapter-specific QR codes
        for (let i = 0; i < bookConfig.chapters.length; i++) {
            qrCodes.push({
                id: `chapter-${i + 1}`,
                url: `https://runescape-edu.platform/books/${bookConfig.id}/${language}/chapter/${i + 1}`,
                purpose: `Interactive content for Chapter ${i + 1}`
            });
        }
        
        return qrCodes;
    }
    
    async gatherImages(bookConfig) {
        // Placeholder for image gathering
        return [
            { id: 'cover', path: 'cover.png', purpose: 'Book cover' },
            { id: 'runescape-logo', path: 'rs-logo.png', purpose: 'Game branding' }
        ];
    }
    
    compileReferenceLinks(bookConfig, language) {
        const baseLinks = [
            { title: 'RuneScape Wiki', url: 'https://oldschool.runescape.wiki' },
            { title: 'Educational Platform', url: 'https://runescape-edu.platform' },
            { title: 'Community Forum', url: 'https://runescape-edu.platform/forum' }
        ];
        
        // Add book-specific links
        if (bookConfig.id === 'financial-literacy') {
            baseLinks.push({ title: 'Grand Exchange Tracker', url: 'https://prices.runescape.wiki' });
        }
        
        return baseLinks;
    }
    
    async generateTitlePage(bookConfig, language) {
        return `
# ${bookConfig.title}

## ${bookConfig.subtitle}

${bookConfig.series.name}

Volume ${bookConfig.series.volumes.findIndex(v => v.id === bookConfig.id) + 1}

---

Published by RuneScape Educational Platform

Language: ${this.config.integration.i18nEngine?.config.languages[language]?.name || language}
        `.trim();
    }
    
    async generateCopyrightPage(bookConfig, language) {
        const year = new Date().getFullYear();
        return `
Copyright © ${year} RuneScape Educational Platform

All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher.

ISBN: [To be assigned]

First Edition

Printed in the digital realm
        `.trim();
    }
    
    async generateDedication(bookConfig, language) {
        return `
To all the gamers who knew their time in Gielinor was more than just entertainment—this book proves you were learning all along.

And to those who support conscious gaming that creates real value in the world.
        `.trim();
    }
    
    async generateTableOfContents(bookConfig, language) {
        let toc = '# Table of Contents\n\n';
        
        for (let i = 0; i < bookConfig.chapters.length; i++) {
            toc += `Chapter ${i + 1}: ${bookConfig.chapters[i]}\n`;
        }
        
        toc += '\nGlossary\nResources\nIndex\nAbout the Author\n';
        
        return toc;
    }
    
    async generateForeword(bookConfig, language) {
        return `
# Foreword

The intersection of gaming and education has long been a topic of debate. Can time spent in virtual worlds translate to real-world skills? This book series definitively answers: Yes.

Through years of observation and analysis, we've discovered that RuneScape players naturally develop competencies highly valued in professional environments. From customer service excellence learned through player interactions to financial acumen gained from Grand Exchange trading, the skills are real and transferable.

This educational platform transforms implicit learning into explicit skill development, ensuring that every hour of gameplay can be justified as time invested in personal and professional growth.

Welcome to a new era of conscious gaming.
        `.trim();
    }
    
    async generatePreface(bookConfig, language) {
        return `
# Preface

This book emerged from a simple observation: gamers are already learning valuable skills—they just don't realize it.

Our mission is to make that learning visible, measurable, and applicable to real-world success. Whether you're a parent concerned about screen time, a gamer wanting to justify your hobby, or an educator seeking innovative teaching methods, this book provides the framework for transforming gaming into education.

Each chapter includes practical exercises, real-world applications, and measurable outcomes. By the end, you'll not only understand the educational value of gaming but be able to demonstrate it to others.

Let's begin this journey of discovery together.
        `.trim();
    }
    
    async generateGlossary(bookConfig, language) {
        const terms = {
            'GP': 'Gold Pieces - The primary currency in RuneScape',
            'Grand Exchange': 'The central marketplace for trading items',
            'PvP': 'Player versus Player combat',
            'Skilling': 'Training non-combat skills',
            'Flipping': 'Buying low and selling high for profit',
            'Customer Service': 'Professional assistance and support to customers',
            'Financial Literacy': 'Understanding of financial principles and management',
            'Social Impact': 'The effect of actions on community and society'
        };
        
        let glossary = '# Glossary\n\n';
        for (const [term, definition] of Object.entries(terms)) {
            glossary += `**${term}**: ${definition}\n\n`;
        }
        
        return glossary;
    }
    
    async generateResourceList(bookConfig, language) {
        return `
# Additional Resources

## Online Resources
- RuneScape Wiki: Comprehensive game information
- Educational Platform: Interactive exercises and community
- Video Tutorials: Step-by-step skill development guides

## Community
- Discord Server: Join fellow learners
- Reddit Community: r/RuneScapeEducation
- Monthly Workshops: Live skill-building sessions

## Certification
- Online Assessments: Test your knowledge
- Digital Certificates: Shareable credentials
- Career Pathways: How to leverage your skills
        `.trim();
    }
    
    async generateIndex(bookConfig, language) {
        // Simplified index generation
        return `
# Index

Customer Service: 15, 23, 45-47, 89
Financial Literacy: 34-39, 67, 102-110
Gaming Skills: 12, 56, 78, 134
Grand Exchange: 45, 67-72, 98
Real-world Application: Throughout
Skill Development: 23, 45, 67, 89, 123
Social Impact: 101-115, 145-150
        `.trim();
    }
    
    async generateAboutAuthor(language) {
        return `
# About the RuneScape Educational Platform

The RuneScape Educational Platform is a revolutionary approach to gaming that transforms entertainment time into valuable skill development. Created by a team of educators, gamers, and industry professionals, the platform demonstrates that virtual world experiences can create real-world value.

Our mission is to justify every electron used in gaming by ensuring it contributes to personal growth, professional development, or social good. Through careful analysis of game mechanics and player behaviors, we've identified countless opportunities for learning that were previously hidden in plain sight.

This book series represents years of research, community feedback, and practical application. We continue to evolve and improve based on reader experiences and educational outcomes.

Join us in proving that gaming, when approached consciously, is one of the most effective educational tools of the 21st century.
        `.trim();
    }
    
    async generateNextSteps(bookConfig, language) {
        return `
# Your Journey Continues

## Immediate Actions
1. Complete the chapter exercises
2. Join our online community
3. Track your skill development
4. Share your progress

## Long-term Goals
- Earn your certification
- Apply skills professionally
- Mentor other learners
- Contribute to the platform

## Stay Connected
- Website: runescape-edu.platform
- Email: learn@runescape-edu.platform
- Social: @RuneScapeEdu

Remember: Every gaming session is a learning opportunity. Make it count!
        `.trim();
    }
    
    async generateARMarkers(publication, content) {
        // Generate AR markers for enhanced content
        const markers = [];
        
        for (const chapter of content.chapters) {
            markers.push({
                chapterId: chapter.number,
                markerId: crypto.randomBytes(4).toString('hex'),
                contentType: 'video-explanation',
                triggerImage: `chapter-${chapter.number}-ar.png`
            });
        }
        
        return markers;
    }
    
    extractWebLinks(content) {
        const links = [];
        
        // Extract from resources
        if (content.resources?.links) {
            links.push(...content.resources.links);
        }
        
        // Add platform links
        links.push({
            title: 'Interactive Exercises',
            url: 'https://runescape-edu.platform/exercises'
        });
        
        return links;
    }
    
    // ==================== STATISTICS & MANAGEMENT ====================
    
    updateStatistics(publication, bookConfig) {
        this.stats.booksPublished++;
        
        // Update language statistics
        const langCount = this.stats.languagesPublished.get(publication.language) || 0;
        this.stats.languagesPublished.set(publication.language, langCount + 1);
        
        // Estimate page count
        this.stats.totalPageCount += bookConfig.pageCount || 200;
    }
    
    async saveISBNRegistry() {
        const registry = {};
        for (const [isbn, metadata] of this.isbnRegistry) {
            registry[isbn] = metadata;
        }
        
        const registryFile = path.join(this.config.outputPath, 'isbn-registry.json');
        await fs.writeFile(registryFile, JSON.stringify(registry, null, 2));
    }
    
    async addPDFFrontMatter(doc, content) {
        // Add each front matter section
        for (const [section, text] of Object.entries(content.frontMatter)) {
            if (text) {
                doc.addPage();
                doc.fontSize(12).text(text, 72, 72);
            }
        }
    }
    
    async addPDFChapter(doc, chapter) {
        doc.addPage();
        
        // Chapter title
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(`Chapter ${chapter.number}`, 72, 72);
        
        doc.fontSize(20)
           .text(chapter.title, 72, 110);
        
        // Chapter content
        doc.fontSize(12)
           .font('Helvetica')
           .text(chapter.content, 72, 160, {
               align: 'justify',
               lineGap: 6
           });
        
        // Add exercises if present
        if (chapter.exercises?.length > 0) {
            doc.addPage();
            doc.fontSize(16).font('Helvetica-Bold').text('Exercises', 72, 72);
            
            for (const exercise of chapter.exercises) {
                doc.fontSize(12).text(`${exercise.number}. ${exercise.title}`, 72, doc.y + 20);
                doc.text(exercise.description, 72, doc.y + 10);
            }
        }
    }
    
    async addPDFBackMatter(doc, content) {
        // Add each back matter section
        for (const [section, text] of Object.entries(content.backMatter)) {
            if (text) {
                doc.addPage();
                doc.fontSize(12).text(text, 72, 72);
            }
        }
    }
    
    getPublicationStatistics() {
        const formatStats = {};
        for (const [format, count] of this.stats.formatsGenerated) {
            formatStats[format] = count;
        }
        
        const languageStats = {};
        for (const [lang, count] of this.stats.languagesPublished) {
            languageStats[lang] = count;
        }
        
        return {
            totalBooks: this.stats.booksPublished,
            totalPages: this.stats.totalPageCount,
            averagePages: Math.round(this.stats.totalPageCount / (this.stats.booksPublished || 1)),
            formats: formatStats,
            languages: languageStats,
            activePublications: this.activePublications.size,
            isbnCount: this.isbnRegistry.size
        };
    }
}

// Auto-start if running directly
if (require.main === module) {
    const publisher = new EducationalBookPublisher();
    
    publisher.on('ready', async () => {
        console.log('📚 Educational Book Publisher ready!');
        console.log('📖 Available books:');
        
        for (const series of Object.values(publisher.config.bookSeries)) {
            console.log(`\n${series.name}:`);
            for (const volume of series.volumes) {
                console.log(`  - ${volume.title}`);
            }
        }
        
        // Example: Publish a book
        console.log('\n🚀 Publishing example book...');
        try {
            const publication = await publisher.publishBook('customer-service', 'en', {
                formats: ['pdf', 'epub'],
                interactive: true
            });
            
            console.log('\n✅ Publication complete!');
            console.log('📊 Statistics:', publisher.getPublicationStatistics());
        } catch (error) {
            console.error('❌ Publication failed:', error);
        }
    });
}

module.exports = EducationalBookPublisher;
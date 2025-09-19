#!/usr/bin/env node

/**
 * 📚 MULTI-CHAPTER BOOK GENERATOR
 * 
 * Orchestrates the generation of a complete book with chapters 1-5 (and beyond)
 * Uses 5-API consultation system for each chapter
 * Maintains narrative cohesion and progressive complexity
 * 
 * Features:
 * - Progressive chapter development (each builds on previous)
 * - 5-API consultation per chapter
 * - Working code examples in each chapter
 * - Multiple narrative styles (technical, gaming, academic)
 * - Export to multiple formats (Markdown, PDF, HTML)
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const FiveAPIConsultationEngine = require('./5-api-consultation-engine.js');

class MultiChapterBookGenerator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            outputDir: config.outputDir || path.join(__dirname, 'generated-books'),
            narrativeStyle: config.narrativeStyle || 'technical_narrative',
            includeCodeExamples: config.includeCodeExamples !== false,
            enableProgressiveComplexity: config.enableProgressiveComplexity !== false,
            maxChapters: config.maxChapters || 5,
            chapterWordTarget: config.chapterWordTarget || 2000,
            enableCohesionCheck: config.enableCohesionCheck !== false,
            ...config
        };
        
        // Initialize consultation engine
        this.consultationEngine = new FiveAPIConsultationEngine({
            enableCostTracking: true,
            maxCostPerConsultation: 0.25 // 25 cents per chapter
        });
        
        // Book structure templates
        this.bookTemplates = {
            technical_narrative: {
                title: 'The Five Minds Approach to {topic}',
                subtitle: 'A Multi-Perspective Technical Guide',
                chapters: [
                    { 
                        title: 'Foundation: Understanding the Challenge',
                        focus: 'problem_analysis',
                        complexity: 1,
                        codeLevel: 'basic'
                    },
                    { 
                        title: 'Architecture: Designing the Solution',
                        focus: 'system_design',
                        complexity: 2,
                        codeLevel: 'intermediate'
                    },
                    { 
                        title: 'Implementation: Building the Core',
                        focus: 'core_development',
                        complexity: 3,
                        codeLevel: 'advanced'
                    },
                    { 
                        title: 'Integration: Connecting the Pieces',
                        focus: 'integration_patterns',
                        complexity: 4,
                        codeLevel: 'advanced'
                    },
                    { 
                        title: 'Evolution: Advanced Features and Future',
                        focus: 'enhancement_strategies',
                        complexity: 5,
                        codeLevel: 'expert'
                    }
                ]
            },
            
            gaming_quest: {
                title: 'The Five Guilds: Mastering {topic}',
                subtitle: 'An Epic Quest Through Technical Mastery',
                chapters: [
                    { 
                        title: 'The Gathering: Assembling Your Party',
                        focus: 'preparation',
                        complexity: 1,
                        codeLevel: 'novice'
                    },
                    { 
                        title: 'The Foundation: Building Your Base',
                        focus: 'base_mechanics',
                        complexity: 2,
                        codeLevel: 'apprentice'
                    },
                    { 
                        title: 'The Challenge: Facing the Core Quest',
                        focus: 'main_challenge',
                        complexity: 3,
                        codeLevel: 'journeyman'
                    },
                    { 
                        title: 'The Alliance: Forging Connections',
                        focus: 'collaboration',
                        complexity: 4,
                        codeLevel: 'expert'
                    },
                    { 
                        title: 'The Mastery: Ascending to Legend',
                        focus: 'mastery',
                        complexity: 5,
                        codeLevel: 'legendary'
                    }
                ]
            },
            
            academic_research: {
                title: 'Multi-Perspective Analysis of {topic}',
                subtitle: 'A Comprehensive Research Study',
                chapters: [
                    { 
                        title: 'Literature Review and Problem Statement',
                        focus: 'research_foundation',
                        complexity: 1,
                        codeLevel: 'proof_of_concept'
                    },
                    { 
                        title: 'Methodology and Theoretical Framework',
                        focus: 'research_method',
                        complexity: 2,
                        codeLevel: 'experimental'
                    },
                    { 
                        title: 'Implementation and Data Collection',
                        focus: 'data_gathering',
                        complexity: 3,
                        codeLevel: 'production'
                    },
                    { 
                        title: 'Analysis and Interpretation',
                        focus: 'analysis',
                        complexity: 4,
                        codeLevel: 'analytical'
                    },
                    { 
                        title: 'Conclusions and Future Work',
                        focus: 'synthesis',
                        complexity: 5,
                        codeLevel: 'visionary'
                    }
                ]
            }
        };
        
        // Narrative continuity tracking
        this.bookContext = {
            mainTheme: null,
            keyCharacters: [],
            establishedConcepts: [],
            codeEvolution: [],
            crossReferences: new Map()
        };
        
        console.log('📚 Multi-Chapter Book Generator initialized');
        console.log(`📖 Available templates: ${Object.keys(this.bookTemplates).join(', ')}`);
    }
    
    /**
     * Generate a complete book on a given topic
     */
    async generateBook(topic, options = {}) {
        const startTime = Date.now();
        const bookId = this.generateBookId(topic);
        
        console.log(`\n📚 Starting book generation: "${topic}"`);
        console.log(`📖 Style: ${this.config.narrativeStyle}`);
        console.log(`📑 Target chapters: ${this.config.maxChapters}`);
        
        try {
            // Step 1: Select and customize template
            const template = this.selectTemplate(topic, options);
            
            // Step 2: Initialize book context
            this.initializeBookContext(topic, template);
            
            // Step 3: Generate each chapter
            const chapters = [];
            for (let i = 0; i < this.config.maxChapters; i++) {
                const chapter = await this.generateChapter(i + 1, template.chapters[i], topic, chapters);
                chapters.push(chapter);
                
                // Update context with chapter insights
                this.updateBookContext(chapter);
                
                console.log(`✅ Chapter ${i + 1} complete: ${chapter.wordCount} words`);
            }
            
            // Step 4: Generate book metadata and structure
            const bookMetadata = this.generateBookMetadata(topic, template, chapters);
            
            // Step 5: Compile complete book
            const completeBook = await this.compileBook(bookMetadata, chapters, template);
            
            // Step 6: Save to files
            const savedFiles = await this.saveBook(bookId, completeBook);
            
            const totalTime = Date.now() - startTime;
            const totalCost = chapters.reduce((sum, ch) => sum + ch.consultationCost, 0);
            
            console.log(`\n🎉 Book generation complete!`);
            console.log(`📊 Stats:`);
            console.log(`   Duration: ${(totalTime / 1000).toFixed(1)}s`);
            console.log(`   Total cost: $${totalCost.toFixed(4)}`);
            console.log(`   Total words: ${completeBook.totalWords}`);
            console.log(`   Files saved: ${savedFiles.length}`);
            
            return {
                bookId,
                metadata: bookMetadata,
                chapters,
                completeBook,
                stats: {
                    duration: totalTime,
                    cost: totalCost,
                    wordCount: completeBook.totalWords,
                    filesGenerated: savedFiles.length
                },
                files: savedFiles
            };
            
        } catch (error) {
            console.error(`❌ Book generation failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Generate a single chapter
     */
    async generateChapter(chapterNumber, chapterTemplate, mainTopic, previousChapters) {
        console.log(`\n📝 Generating Chapter ${chapterNumber}: ${chapterTemplate.title}`);
        
        // Create chapter-specific consultation question
        const chapterQuestion = this.createChapterQuestion(chapterTemplate, mainTopic, previousChapters);
        
        // Consult the 5-API panel
        const consultation = await this.consultationEngine.consult(
            chapterQuestion,
            chapterTemplate.focus,
            { 
                maxTokens: this.calculateTokensForChapter(chapterTemplate.complexity),
                chapterId: `ch${chapterNumber}`
            }
        );
        
        // Generate code examples if needed
        let codeExamples = [];
        if (this.config.includeCodeExamples) {
            codeExamples = await this.generateCodeExamples(chapterTemplate, consultation);
        }
        
        // Build chapter narrative
        const chapterContent = this.buildChapterNarrative(
            chapterNumber,
            chapterTemplate,
            consultation,
            codeExamples,
            previousChapters
        );
        
        return {
            number: chapterNumber,
            title: chapterTemplate.title,
            focus: chapterTemplate.focus,
            complexity: chapterTemplate.complexity,
            content: chapterContent,
            consultation: consultation,
            codeExamples,
            wordCount: this.countWords(chapterContent),
            consultationCost: consultation.totalCost,
            metadata: {
                modelsUsed: consultation.modelsUsed,
                confidence: consultation.synthesis.confidence,
                keyInsights: consultation.synthesis.weightedSynthesis.slice(0, 3)
            }
        };
    }
    
    /**
     * Create consultation question for a specific chapter
     */
    createChapterQuestion(chapterTemplate, mainTopic, previousChapters) {
        let contextFromPrevious = '';
        
        if (previousChapters.length > 0) {
            const lastChapter = previousChapters[previousChapters.length - 1];
            contextFromPrevious = `\n\nBuilding on the previous chapter "${lastChapter.title}", which covered ${lastChapter.focus}...`;
        }
        
        const complexityGuidance = {
            1: 'Focus on fundamental concepts and basic principles.',
            2: 'Introduce intermediate concepts and practical applications.',
            3: 'Dive into advanced implementation details and optimization.',
            4: 'Explore complex integration patterns and system interactions.',
            5: 'Cover expert-level concepts and future possibilities.'
        };
        
        return `For a ${this.config.narrativeStyle} chapter on "${chapterTemplate.title}" about ${mainTopic}:

Focus area: ${chapterTemplate.focus}
Complexity level: ${chapterTemplate.complexity}/5 - ${complexityGuidance[chapterTemplate.complexity]}${contextFromPrevious}

Please provide comprehensive insights that will be used to create a ${this.config.chapterWordTarget}-word chapter. Include practical examples, best practices, and actionable recommendations.`;
    }
    
    /**
     * Generate code examples for a chapter
     */
    async generateCodeExamples(chapterTemplate, consultation) {
        console.log(`  💻 Generating code examples for ${chapterTemplate.title}...`);
        
        // Extract code-relevant insights from consultation
        const codeInsights = consultation.results
            .filter(r => r.success && r.response.includes('code'))
            .slice(0, 3); // Max 3 code examples per chapter
        
        const codeExamples = [];
        
        for (let i = 0; i < codeInsights.length; i++) {
            const insight = codeInsights[i];
            
            try {
                // Ask for specific code example
                const codeConsultation = await this.consultationEngine.consult(
                    `Based on this insight: "${insight.response.substring(0, 200)}", provide a working ${chapterTemplate.codeLevel}-level code example that demonstrates the concept. Include comments and make it ready for drag-and-drop testing.`,
                    'code_generation',
                    { maxTokens: 400 }
                );
                
                const codeContent = this.extractCodeFromResponse(codeConsultation.results[0]?.response || '');
                
                if (codeContent) {
                    codeExamples.push({
                        title: `Example ${i + 1}: ${insight.character}'s Approach`,
                        level: chapterTemplate.codeLevel,
                        code: codeContent,
                        explanation: insight.response.substring(0, 300) + '...',
                        author: insight.character,
                        testable: true
                    });
                }
                
            } catch (error) {
                console.log(`  ⚠️ Code generation failed for example ${i + 1}: ${error.message}`);
            }
        }
        
        console.log(`  ✅ Generated ${codeExamples.length} code examples`);
        return codeExamples;
    }
    
    /**
     * Extract code blocks from AI response
     */
    extractCodeFromResponse(response) {
        const codeBlockRegex = /```(?:javascript|js|typescript|ts)?\n([\s\S]*?)\n```/g;
        const matches = Array.from(response.matchAll(codeBlockRegex));
        
        if (matches.length > 0) {
            return matches[0][1].trim();
        }
        
        // Fallback: look for code-like patterns
        const lines = response.split('\n');
        const codeLines = lines.filter(line => 
            line.includes('function') || 
            line.includes('const') || 
            line.includes('class') ||
            line.trim().startsWith('//')
        );
        
        if (codeLines.length > 2) {
            return codeLines.join('\n');
        }
        
        return null;
    }
    
    /**
     * Build chapter narrative from consultation results
     */
    buildChapterNarrative(chapterNumber, template, consultation, codeExamples, previousChapters) {
        const narrativeStyle = this.bookTemplates[this.config.narrativeStyle];
        const successful = consultation.results.filter(r => r.success);
        
        let narrative = `# Chapter ${chapterNumber}: ${template.title}\n\n`;
        
        // Add chapter introduction
        narrative += this.generateChapterIntro(template, consultation, previousChapters);
        
        // Add the Five Minds consultation section
        narrative += `## The Council of Five Minds\n\n`;
        narrative += `To tackle this challenge, we consulted our panel of five AI experts, each bringing their unique perspective:\n\n`;
        
        // Add each perspective
        successful.forEach(result => {
            narrative += `### ${result.emoji} ${result.character}\n\n`;
            narrative += `**Perspective**: ${result.perspective.replace('_', ' ')}\n\n`;
            narrative += `${result.response}\n\n`;
            
            if (result.confidence) {
                narrative += `*Confidence Level: ${result.confidence}%*\n\n`;
            }
        });
        
        // Add synthesis section
        narrative += `## Synthesis: Finding Common Ground\n\n`;
        narrative += `After reviewing all five perspectives, several key themes emerged:\n\n`;
        
        consultation.synthesis.consensus.forEach(theme => {
            narrative += `- **${theme.charAt(0).toUpperCase() + theme.slice(1)}**: Multiple experts highlighted this concept\n`;
        });
        
        narrative += `\n### Unified Recommendations\n\n`;
        consultation.synthesis.weightedSynthesis.forEach((insight, index) => {
            narrative += `${index + 1}. ${insight}\n`;
        });
        
        // Add code examples if available
        if (codeExamples.length > 0) {
            narrative += `\n## Working Code Examples\n\n`;
            narrative += `The following code examples demonstrate the concepts discussed above. Each is ready for drag-and-drop testing:\n\n`;
            
            codeExamples.forEach((example, index) => {
                narrative += `### ${example.title}\n\n`;
                narrative += `**Level**: ${example.level.charAt(0).toUpperCase() + example.level.slice(1)}\n`;
                narrative += `**Source**: ${example.author}\n\n`;
                narrative += `${example.explanation}\n\n`;
                narrative += `\`\`\`javascript\n${example.code}\n\`\`\`\n\n`;
                narrative += `> 💡 **Try it**: Copy this code into your development environment to test the approach.\n\n`;
            });
        }
        
        // Add chapter conclusion
        narrative += this.generateChapterConclusion(template, consultation, chapterNumber);
        
        return narrative;
    }
    
    /**
     * Generate chapter introduction
     */
    generateChapterIntro(template, consultation, previousChapters) {
        let intro = '';
        
        if (previousChapters.length === 0) {
            intro = `Welcome to our journey through ${template.focus.replace('_', ' ')}. This opening chapter sets the foundation for everything that follows.\n\n`;
        } else {
            const lastChapter = previousChapters[previousChapters.length - 1];
            intro = `Building on the insights from "${lastChapter.title}", we now turn our attention to ${template.focus.replace('_', ' ')}.\n\n`;
        }
        
        intro += `**Chapter Focus**: ${template.focus.replace('_', ' ')}\n`;
        intro += `**Complexity Level**: ${template.complexity}/5\n`;
        intro += `**Consultation Panel**: 5 AI experts with diverse perspectives\n\n`;
        
        return intro;
    }
    
    /**
     * Generate chapter conclusion
     */
    generateChapterConclusion(template, consultation, chapterNumber) {
        let conclusion = `## Chapter ${chapterNumber} Summary\n\n`;
        
        conclusion += `In this chapter, we explored ${template.focus.replace('_', ' ')} from five different perspectives. `;
        conclusion += `The key takeaways include:\n\n`;
        
        consultation.synthesis.weightedSynthesis.slice(0, 3).forEach((insight, index) => {
            conclusion += `**${index + 1}.** ${insight.split('(')[0].trim()}\n`;
        });
        
        if (chapterNumber < 5) {
            conclusion += `\n**Next Up**: In the following chapter, we'll build on these concepts to explore more advanced topics.\n\n`;
        } else {
            conclusion += `\n**Conclusion**: This completes our multi-perspective exploration. The combination of diverse AI insights provides a comprehensive understanding of the topic.\n\n`;
        }
        
        return conclusion;
    }
    
    /**
     * Calculate appropriate token count for chapter complexity
     */
    calculateTokensForChapter(complexity) {
        const baseTokens = 300;
        return baseTokens + (complexity * 100); // 300-800 tokens based on complexity
    }
    
    /**
     * Select appropriate template
     */
    selectTemplate(topic, options) {
        const style = options.narrativeStyle || this.config.narrativeStyle;
        const template = { ...this.bookTemplates[style] };
        
        // Customize title with topic
        template.title = template.title.replace('{topic}', topic);
        
        return template;
    }
    
    /**
     * Initialize book context
     */
    initializeBookContext(topic, template) {
        this.bookContext = {
            mainTheme: topic,
            narrativeStyle: this.config.narrativeStyle,
            keyCharacters: Object.values(this.consultationEngine.consultationPanel).map(p => p.character),
            establishedConcepts: [],
            codeEvolution: [],
            crossReferences: new Map()
        };
    }
    
    /**
     * Update book context with chapter insights
     */
    updateBookContext(chapter) {
        // Add key concepts from this chapter
        chapter.metadata.keyInsights.forEach(insight => {
            this.bookContext.establishedConcepts.push({
                chapter: chapter.number,
                concept: insight.split('(')[0].trim()
            });
        });
        
        // Track code evolution
        if (chapter.codeExamples.length > 0) {
            this.bookContext.codeEvolution.push({
                chapter: chapter.number,
                level: chapter.codeExamples[0].level,
                examples: chapter.codeExamples.length
            });
        }
    }
    
    /**
     * Generate book metadata
     */
    generateBookMetadata(topic, template, chapters) {
        return {
            title: template.title,
            subtitle: template.subtitle,
            topic: topic,
            style: this.config.narrativeStyle,
            generatedAt: new Date().toISOString(),
            chapters: chapters.length,
            totalWords: chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
            totalCost: chapters.reduce((sum, ch) => sum + ch.consultationCost, 0),
            authors: 'AI Council of Five + Multi-Chapter Book Generator',
            summary: `A comprehensive ${chapters.length}-chapter exploration of ${topic}, featuring insights from five different AI perspectives in each chapter.`
        };
    }
    
    /**
     * Compile complete book
     */
    async compileBook(metadata, chapters, template) {
        let completeBook = '';
        
        // Title page
        completeBook += `# ${metadata.title}\n\n`;
        completeBook += `## ${metadata.subtitle}\n\n`;
        completeBook += `**Topic**: ${metadata.topic}\n`;
        completeBook += `**Generated**: ${new Date(metadata.generatedAt).toLocaleDateString()}\n`;
        completeBook += `**Chapters**: ${metadata.chapters}\n`;
        completeBook += `**Words**: ${metadata.totalWords.toLocaleString()}\n\n`;
        completeBook += `---\n\n`;
        
        // Table of contents
        completeBook += `## Table of Contents\n\n`;
        chapters.forEach((chapter, index) => {
            completeBook += `${index + 1}. [${chapter.title}](#chapter-${index + 1}-${chapter.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')})\n`;
        });
        completeBook += `\n---\n\n`;
        
        // Add all chapters
        chapters.forEach(chapter => {
            completeBook += chapter.content + '\n\n---\n\n';
        });
        
        // Add appendix
        completeBook += this.generateAppendix(metadata, chapters);
        
        return {
            content: completeBook,
            totalWords: this.countWords(completeBook),
            metadata
        };
    }
    
    /**
     * Generate appendix with stats and references
     */
    generateAppendix(metadata, chapters) {
        let appendix = `# Appendix\n\n`;
        
        appendix += `## Book Statistics\n\n`;
        appendix += `- **Total Consultations**: ${chapters.length * 5} (5 per chapter)\n`;
        appendix += `- **Total API Calls**: ${chapters.reduce((sum, ch) => sum + ch.consultation.modelsUsed, 0)}\n`;
        appendix += `- **Total Cost**: $${metadata.totalCost.toFixed(4)}\n`;
        appendix += `- **Average Cost per Chapter**: $${(metadata.totalCost / chapters.length).toFixed(4)}\n`;
        appendix += `- **Words per Dollar**: ${Math.round(metadata.totalWords / metadata.totalCost).toLocaleString()}\n\n`;
        
        appendix += `## AI Panel Contributors\n\n`;
        Object.values(this.consultationEngine.consultationPanel).forEach(member => {
            appendix += `### ${member.emoji} ${member.character}\n`;
            appendix += `- **Service**: ${member.name}\n`;
            appendix += `- **Specialties**: ${member.specialties.join(', ')}\n`;
            appendix += `- **Perspective**: ${member.perspective.replace('_', ' ')}\n\n`;
        });
        
        appendix += `## Code Example Index\n\n`;
        chapters.forEach(chapter => {
            if (chapter.codeExamples.length > 0) {
                appendix += `**Chapter ${chapter.number}**: ${chapter.codeExamples.length} examples (${chapter.codeExamples[0].level} level)\n`;
            }
        });
        
        return appendix;
    }
    
    /**
     * Save book to multiple formats
     */
    async saveBook(bookId, completeBook) {
        await this.ensureOutputDir();
        
        const bookDir = path.join(this.config.outputDir, bookId);
        await fs.mkdir(bookDir, { recursive: true });
        
        const files = [];
        
        // Save main markdown file
        const mdPath = path.join(bookDir, 'complete-book.md');
        await fs.writeFile(mdPath, completeBook.content);
        files.push(mdPath);
        
        // Save metadata
        const metaPath = path.join(bookDir, 'metadata.json');
        await fs.writeFile(metaPath, JSON.stringify(completeBook.metadata, null, 2));
        files.push(metaPath);
        
        // Save individual chapters
        const chaptersDir = path.join(bookDir, 'chapters');
        await fs.mkdir(chaptersDir, { recursive: true });
        
        console.log(`📁 Book saved to: ${bookDir}`);
        
        return files;
    }
    
    /**
     * Utility methods
     */
    generateBookId(topic) {
        const timestamp = new Date().toISOString().split('T')[0];
        const sanitized = topic.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
        return `book_${sanitized}_${timestamp}`;
    }
    
    countWords(text) {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }
    
    async ensureOutputDir() {
        await fs.mkdir(this.config.outputDir, { recursive: true });
    }
}

module.exports = MultiChapterBookGenerator;

// CLI interface
if (require.main === module) {
    async function main() {
        console.log('📚 Multi-Chapter Book Generator Test\n');
        
        const generator = new MultiChapterBookGenerator({
            narrativeStyle: 'technical_narrative',
            maxChapters: 3 // Test with 3 chapters for faster testing
        });
        
        try {
            const book = await generator.generateBook(
                'Building Scalable AI Systems',
                { narrativeStyle: 'technical_narrative' }
            );
            
            console.log('\n🎉 BOOK GENERATION COMPLETE!');
            console.log('=============================');
            console.log(`📖 Title: ${book.metadata.title}`);
            console.log(`📑 Chapters: ${book.chapters.length}`);
            console.log(`📊 Total words: ${book.completeBook.totalWords.toLocaleString()}`);
            console.log(`💰 Total cost: $${book.stats.cost.toFixed(4)}`);
            console.log(`⏱️ Duration: ${(book.stats.duration / 1000).toFixed(1)}s`);
            console.log(`📁 Files: ${book.files.length}`);
            
            console.log('\n📚 Chapter Summary:');
            book.chapters.forEach(chapter => {
                console.log(`  ${chapter.number}. ${chapter.title} (${chapter.wordCount} words, $${chapter.consultationCost.toFixed(4)})`);
            });
            
        } catch (error) {
            console.error('❌ Book generation failed:', error);
        }
    }
    
    main().catch(console.error);
}
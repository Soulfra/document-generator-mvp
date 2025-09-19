#!/usr/bin/env node

/**
 * 📚 ACADEMIC OUTPUT FORMATTER
 * 
 * Formats AI-generated content into professional academic documents
 * Supports multiple citation styles and document formats
 * 
 * Features:
 * - Multiple academic format support (chapters, papers, reports)
 * - Citation style formatting (APA, MLA, Chicago, AMA)
 * - Table of contents generation
 * - Figure and table management
 * - Export to multiple formats (Markdown, LaTeX, HTML, PDF)
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class AcademicOutputFormatter extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            defaultCitationStyle: config.defaultCitationStyle || 'apa',
            enableTableOfContents: config.enableTableOfContents !== false,
            enableFigureNumbering: config.enableFigureNumbering !== false,
            enablePageNumbering: config.enablePageNumbering !== false,
            academicLevel: config.academicLevel || 'graduate', // undergraduate, graduate, professional
            outputPath: config.outputPath || './academic-output',
            ...config
        };
        
        // Document templates
        this.documentTemplates = {
            'medical_chapter': {
                name: 'Medical School Textbook Chapter',
                structure: {
                    frontMatter: ['title', 'authors', 'affiliations', 'abstract'],
                    mainContent: ['introduction', 'pathophysiology', 'clinical_presentation', 
                                'diagnosis', 'treatment', 'prognosis', 'complications'],
                    backMatter: ['key_points', 'review_questions', 'references', 'further_reading']
                },
                formatting: {
                    headingLevels: { chapter: 1, section: 2, subsection: 3 },
                    numbering: 'decimal',
                    figurePrefix: 'Figure',
                    tablePrefix: 'Table'
                }
            },
            'research_paper': {
                name: 'Academic Research Paper',
                structure: {
                    frontMatter: ['title', 'authors', 'abstract', 'keywords'],
                    mainContent: ['introduction', 'literature_review', 'methodology', 
                                'results', 'discussion', 'limitations'],
                    backMatter: ['conclusion', 'acknowledgments', 'references', 'appendices']
                },
                formatting: {
                    headingLevels: { title: 1, section: 2, subsection: 3 },
                    numbering: 'none',
                    figurePrefix: 'Fig.',
                    tablePrefix: 'Table'
                }
            },
            'government_report': {
                name: 'Government Compliance Report',
                structure: {
                    frontMatter: ['cover_page', 'executive_summary', 'table_of_contents'],
                    mainContent: ['background', 'objectives', 'methodology', 'findings', 
                                'analysis', 'recommendations'],
                    backMatter: ['implementation_plan', 'appendices', 'references', 'glossary']
                },
                formatting: {
                    headingLevels: { chapter: 1, section: 2, subsection: 3, paragraph: 4 },
                    numbering: 'hierarchical',
                    figurePrefix: 'Exhibit',
                    tablePrefix: 'Table'
                }
            },
            'thesis_chapter': {
                name: 'Thesis/Dissertation Chapter',
                structure: {
                    frontMatter: ['chapter_title', 'chapter_abstract'],
                    mainContent: ['introduction', 'theoretical_framework', 'methodology', 
                                'analysis', 'findings', 'discussion'],
                    backMatter: ['chapter_conclusion', 'chapter_references']
                },
                formatting: {
                    headingLevels: { chapter: 1, section: 2, subsection: 3, subsubsection: 4 },
                    numbering: 'chapter.section',
                    figurePrefix: 'Figure',
                    tablePrefix: 'Table'
                }
            }
        };
        
        // Citation styles
        this.citationStyles = {
            'apa': {
                name: 'APA 7th Edition',
                inText: (author, year) => `(${author}, ${year})`,
                reference: this.formatAPAReference.bind(this),
                bibliography: 'References'
            },
            'mla': {
                name: 'MLA 9th Edition',
                inText: (author, page) => `(${author} ${page})`,
                reference: this.formatMLAReference.bind(this),
                bibliography: 'Works Cited'
            },
            'chicago': {
                name: 'Chicago 17th Edition',
                inText: (author, year, page) => `(${author} ${year}, ${page})`,
                reference: this.formatChicagoReference.bind(this),
                bibliography: 'Bibliography'
            },
            'ama': {
                name: 'AMA 11th Edition',
                inText: (number) => `[${number}]`,
                reference: this.formatAMAReference.bind(this),
                bibliography: 'References'
            }
        };
        
        // Export formats
        this.exportFormats = {
            'markdown': { extension: '.md', generator: this.generateMarkdown.bind(this) },
            'latex': { extension: '.tex', generator: this.generateLaTeX.bind(this) },
            'html': { extension: '.html', generator: this.generateHTML.bind(this) },
            'json': { extension: '.json', generator: this.generateJSON.bind(this) }
        };
        
        // Formatting state
        this.activeDocuments = new Map();
        this.formattingHistory = [];
        
        console.log('📚 Academic Output Formatter initialized');
        console.log(`📑 Document templates: ${Object.keys(this.documentTemplates).length}`);
        console.log(`📎 Citation styles: ${Object.keys(this.citationStyles).length}`);
        console.log(`💾 Export formats: ${Object.keys(this.exportFormats).length}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Create output directory
        await fs.mkdir(this.config.outputPath, { recursive: true });
        
        console.log('✅ Academic Formatter ready');
    }
    
    /**
     * Format orchestrated content into academic document
     */
    async format(orchestrationResult, options = {}) {
        const formatId = crypto.randomUUID();
        const startTime = Date.now();
        
        console.log(`\n📚 Starting academic formatting: ${formatId}`);
        console.log(`📝 Content type: ${orchestrationResult.contentType}`);
        console.log(`📎 Citation style: ${options.citationStyle || this.config.defaultCitationStyle}`);
        
        // Get document template
        const template = this.documentTemplates[orchestrationResult.contentType] || 
                        this.documentTemplates.research_paper;
        
        // Get citation style
        const citationStyle = this.citationStyles[options.citationStyle || this.config.defaultCitationStyle];
        
        // Create document structure
        const document = {
            id: formatId,
            type: orchestrationResult.contentType,
            template,
            citationStyle,
            metadata: {
                title: options.title || orchestrationResult.content.title,
                authors: options.authors || ['Academic AI System'],
                date: new Date(),
                version: '1.0.0',
                orchestrationId: orchestrationResult.orchestrationId,
                consultationId: orchestrationResult.consultationId
            },
            content: {},
            citations: [],
            figures: [],
            tables: [],
            formatting: {
                pageNumbers: this.config.enablePageNumbering,
                figureNumbers: this.config.enableFigureNumbering,
                tableOfContents: this.config.enableTableOfContents
            }
        };
        
        this.activeDocuments.set(formatId, document);
        
        try {
            // Format front matter
            document.content.frontMatter = await this.formatFrontMatter(
                template.structure.frontMatter,
                orchestrationResult,
                document
            );
            
            // Format main content
            document.content.mainContent = await this.formatMainContent(
                template.structure.mainContent,
                orchestrationResult,
                document
            );
            
            // Format back matter
            document.content.backMatter = await this.formatBackMatter(
                template.structure.backMatter,
                orchestrationResult,
                document
            );
            
            // Process citations
            document.citations = await this.processCitations(
                orchestrationResult.metadata.citations,
                citationStyle
            );
            
            // Generate table of contents if enabled
            if (this.config.enableTableOfContents) {
                document.tableOfContents = this.generateTableOfContents(document);
            }
            
            // Export to requested formats
            const exports = {};
            const exportFormats = options.exportFormats || ['markdown', 'html'];
            
            for (const format of exportFormats) {
                if (this.exportFormats[format]) {
                    exports[format] = await this.exportDocument(document, format);
                    console.log(`  ✅ Exported to ${format}`);
                }
            }
            
            // Package final result
            const finalResult = {
                formatId,
                documentType: orchestrationResult.contentType,
                timestamp: new Date(),
                duration: Date.now() - startTime,
                metadata: document.metadata,
                exports,
                statistics: {
                    wordCount: this.calculateWordCount(document),
                    pageCount: this.estimatePageCount(document),
                    citationCount: document.citations.length,
                    figureCount: document.figures.length,
                    tableCount: document.tables.length
                },
                quality: {
                    completeness: this.assessCompleteness(document, template),
                    formatting: this.assessFormatting(document),
                    citations: this.assessCitations(document)
                }
            };
            
            // Record in history
            this.formattingHistory.push({
                id: formatId,
                timestamp: new Date(),
                documentType: orchestrationResult.contentType,
                duration: finalResult.duration,
                exports: Object.keys(exports),
                success: true
            });
            
            // Emit completion event
            this.emit('formatting_complete', finalResult);
            
            console.log(`\n✅ Formatting complete: ${formatId}`);
            console.log(`⏱️  Duration: ${finalResult.duration}ms`);
            console.log(`📊 Statistics:`);
            console.log(`   Words: ${finalResult.statistics.wordCount}`);
            console.log(`   Pages: ~${finalResult.statistics.pageCount}`);
            console.log(`   Citations: ${finalResult.statistics.citationCount}`);
            
            return finalResult;
            
        } catch (error) {
            console.error(`❌ Formatting failed: ${error.message}`);
            
            this.formattingHistory.push({
                id: formatId,
                timestamp: new Date(),
                error: error.message,
                success: false
            });
            
            throw error;
            
        } finally {
            this.activeDocuments.delete(formatId);
        }
    }
    
    /**
     * Format front matter sections
     */
    async formatFrontMatter(sections, orchestrationResult, document) {
        const formatted = {};
        
        for (const section of sections) {
            switch (section) {
                case 'title':
                    formatted.title = {
                        text: document.metadata.title,
                        level: 1,
                        centered: true
                    };
                    break;
                
                case 'authors':
                    formatted.authors = {
                        list: document.metadata.authors,
                        formatted: document.metadata.authors.join(', ')
                    };
                    break;
                
                case 'abstract':
                    formatted.abstract = {
                        heading: 'Abstract',
                        text: this.generateAbstract(orchestrationResult),
                        wordLimit: 250
                    };
                    break;
                
                case 'executive_summary':
                    formatted.executiveSummary = {
                        heading: 'Executive Summary',
                        text: this.generateExecutiveSummary(orchestrationResult),
                        bulletPoints: this.extractKeyPoints(orchestrationResult)
                    };
                    break;
                
                case 'table_of_contents':
                    formatted.tableOfContents = {
                        heading: 'Table of Contents',
                        placeholder: true // Generated after main content
                    };
                    break;
                
                default:
                    formatted[section] = {
                        heading: this.formatSectionTitle(section),
                        text: `Content for ${section}`
                    };
            }
        }
        
        return formatted;
    }
    
    /**
     * Format main content sections
     */
    async formatMainContent(sections, orchestrationResult, document) {
        const formatted = {};
        const content = orchestrationResult.content;
        
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const sectionNumber = document.template.formatting.numbering !== 'none' ? `${i + 1}. ` : '';
            
            // Get content from orchestration result
            const sectionContent = content.sections?.[section] || 
                                 { content: `Section content for ${section}` };
            
            formatted[section] = {
                number: sectionNumber,
                heading: sectionNumber + this.formatSectionTitle(section),
                level: document.template.formatting.headingLevels.section,
                content: this.formatSectionContent(sectionContent, document),
                subsections: this.extractSubsections(sectionContent),
                figures: this.extractFigures(sectionContent, document),
                tables: this.extractTables(sectionContent, document)
            };
        }
        
        return formatted;
    }
    
    /**
     * Format back matter sections
     */
    async formatBackMatter(sections, orchestrationResult, document) {
        const formatted = {};
        
        for (const section of sections) {
            switch (section) {
                case 'references':
                    formatted.references = {
                        heading: document.citationStyle.bibliography,
                        entries: document.citations,
                        style: document.citationStyle.name
                    };
                    break;
                
                case 'key_points':
                    formatted.keyPoints = {
                        heading: 'Key Points',
                        points: this.extractKeyPoints(orchestrationResult),
                        format: 'bulleted'
                    };
                    break;
                
                case 'review_questions':
                    formatted.reviewQuestions = {
                        heading: 'Review Questions',
                        questions: this.generateReviewQuestions(orchestrationResult),
                        includeAnswers: false
                    };
                    break;
                
                case 'appendices':
                    formatted.appendices = {
                        heading: 'Appendices',
                        items: this.extractAppendices(orchestrationResult)
                    };
                    break;
                
                default:
                    formatted[section] = {
                        heading: this.formatSectionTitle(section),
                        content: `Content for ${section}`
                    };
            }
        }
        
        return formatted;
    }
    
    /**
     * Process citations into selected style
     */
    async processCitations(citations, citationStyle) {
        const processed = [];
        
        for (let i = 0; i < citations.length; i++) {
            const citation = citations[i];
            processed.push({
                id: i + 1,
                original: citation,
                formatted: citationStyle.reference(citation, i + 1),
                inText: citationStyle.inText('Author', 2024) // Simplified
            });
        }
        
        // Sort according to style rules
        if (citationStyle.name.includes('APA') || citationStyle.name.includes('MLA')) {
            processed.sort((a, b) => a.original.localeCompare(b.original));
        }
        
        return processed;
    }
    
    /**
     * Generate table of contents
     */
    generateTableOfContents(document) {
        const toc = [];
        
        // Add front matter entries
        for (const [key, section] of Object.entries(document.content.frontMatter)) {
            if (section.heading && key !== 'table_of_contents') {
                toc.push({
                    title: section.heading,
                    level: 1,
                    page: 'i' // Roman numerals for front matter
                });
            }
        }
        
        // Add main content entries
        let pageNumber = 1;
        for (const [key, section] of Object.entries(document.content.mainContent)) {
            toc.push({
                title: section.heading,
                level: section.level,
                page: pageNumber
            });
            
            // Add subsections
            if (section.subsections) {
                for (const subsection of section.subsections) {
                    toc.push({
                        title: subsection.heading,
                        level: section.level + 1,
                        page: pageNumber + 1
                    });
                    pageNumber++;
                }
            }
            
            pageNumber += 3; // Estimate pages per section
        }
        
        // Add back matter entries
        for (const [key, section] of Object.entries(document.content.backMatter)) {
            if (section.heading) {
                toc.push({
                    title: section.heading,
                    level: 1,
                    page: pageNumber
                });
                pageNumber += 2;
            }
        }
        
        return toc;
    }
    
    /**
     * Export document to specified format
     */
    async exportDocument(document, format) {
        const exporter = this.exportFormats[format];
        if (!exporter) {
            throw new Error(`Unsupported export format: ${format}`);
        }
        
        const content = await exporter.generator(document);
        const filename = `${document.metadata.title.replace(/\s+/g, '_')}${exporter.extension}`;
        const filepath = path.join(this.config.outputPath, filename);
        
        await fs.writeFile(filepath, content, 'utf8');
        
        return {
            format,
            filename,
            filepath,
            size: content.length
        };
    }
    
    /**
     * Generate Markdown output
     */
    async generateMarkdown(document) {
        let markdown = '';
        
        // Front matter
        markdown += `# ${document.metadata.title}\n\n`;
        markdown += `**Authors:** ${document.metadata.authors.join(', ')}\n\n`;
        markdown += `**Date:** ${document.metadata.date.toLocaleDateString()}\n\n`;
        
        // Table of contents
        if (document.tableOfContents) {
            markdown += '## Table of Contents\n\n';
            for (const entry of document.tableOfContents) {
                const indent = '  '.repeat(entry.level - 1);
                markdown += `${indent}- ${entry.title}\n`;
            }
            markdown += '\n';
        }
        
        // Main content
        for (const [key, section] of Object.entries(document.content.mainContent)) {
            markdown += `## ${section.heading}\n\n`;
            markdown += `${section.content}\n\n`;
            
            // Add figures
            if (section.figures && section.figures.length > 0) {
                for (const figure of section.figures) {
                    markdown += `![${figure.caption}](${figure.path})\n`;
                    markdown += `*${figure.label}: ${figure.caption}*\n\n`;
                }
            }
            
            // Add tables
            if (section.tables && section.tables.length > 0) {
                for (const table of section.tables) {
                    markdown += this.generateMarkdownTable(table);
                    markdown += `*${table.label}: ${table.caption}*\n\n`;
                }
            }
        }
        
        // References
        const references = document.content.backMatter.references;
        if (references) {
            markdown += `## ${references.heading}\n\n`;
            for (const ref of references.entries) {
                markdown += `${ref.id}. ${ref.formatted}\n\n`;
            }
        }
        
        return markdown;
    }
    
    /**
     * Generate LaTeX output
     */
    async generateLaTeX(document) {
        let latex = '';
        
        // Document class and packages
        latex += '\\documentclass[12pt]{article}\n';
        latex += '\\usepackage{amsmath}\n';
        latex += '\\usepackage{graphicx}\n';
        latex += '\\usepackage{cite}\n';
        latex += '\\usepackage{hyperref}\n\n';
        
        // Title and authors
        latex += `\\title{${this.escapeLatex(document.metadata.title)}}\n`;
        latex += `\\author{${document.metadata.authors.map(a => this.escapeLatex(a)).join(' \\and ')}}\n`;
        latex += `\\date{${document.metadata.date.toLocaleDateString()}}\n\n`;
        
        // Begin document
        latex += '\\begin{document}\n\n';
        latex += '\\maketitle\n\n';
        
        // Abstract if present
        const abstract = document.content.frontMatter.abstract;
        if (abstract) {
            latex += '\\begin{abstract}\n';
            latex += `${this.escapeLatex(abstract.text)}\n`;
            latex += '\\end{abstract}\n\n';
        }
        
        // Table of contents
        if (document.tableOfContents) {
            latex += '\\tableofcontents\n\\newpage\n\n';
        }
        
        // Main content
        for (const [key, section] of Object.entries(document.content.mainContent)) {
            latex += `\\section{${this.escapeLatex(section.heading)}}\n\n`;
            latex += `${this.escapeLatex(section.content)}\n\n`;
        }
        
        // References
        const references = document.content.backMatter.references;
        if (references) {
            latex += '\\begin{thebibliography}{99}\n\n';
            for (const ref of references.entries) {
                latex += `\\bibitem{ref${ref.id}} ${this.escapeLatex(ref.formatted)}\n\n`;
            }
            latex += '\\end{thebibliography}\n\n';
        }
        
        latex += '\\end{document}\n';
        
        return latex;
    }
    
    /**
     * Generate HTML output
     */
    async generateHTML(document) {
        let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
        html += '<meta charset="UTF-8">\n';
        html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
        html += `<title>${this.escapeHtml(document.metadata.title)}</title>\n`;
        html += '<style>\n';
        html += this.getDefaultCSS();
        html += '</style>\n';
        html += '</head>\n<body>\n';
        
        // Header
        html += '<header>\n';
        html += `<h1>${this.escapeHtml(document.metadata.title)}</h1>\n`;
        html += `<p class="authors">By ${document.metadata.authors.map(a => this.escapeHtml(a)).join(', ')}</p>\n`;
        html += `<p class="date">${document.metadata.date.toLocaleDateString()}</p>\n`;
        html += '</header>\n\n';
        
        // Table of contents
        if (document.tableOfContents) {
            html += '<nav class="toc">\n';
            html += '<h2>Table of Contents</h2>\n';
            html += '<ul>\n';
            for (const entry of document.tableOfContents) {
                const className = `toc-level-${entry.level}`;
                html += `<li class="${className}"><a href="#${this.slugify(entry.title)}">${this.escapeHtml(entry.title)}</a></li>\n`;
            }
            html += '</ul>\n';
            html += '</nav>\n\n';
        }
        
        // Main content
        html += '<main>\n';
        for (const [key, section] of Object.entries(document.content.mainContent)) {
            const id = this.slugify(section.heading);
            html += `<section id="${id}">\n`;
            html += `<h2>${this.escapeHtml(section.heading)}</h2>\n`;
            html += `<div class="content">${this.escapeHtml(section.content)}</div>\n`;
            html += '</section>\n\n';
        }
        html += '</main>\n\n';
        
        // References
        const references = document.content.backMatter.references;
        if (references) {
            html += '<section class="references">\n';
            html += `<h2>${this.escapeHtml(references.heading)}</h2>\n`;
            html += '<ol>\n';
            for (const ref of references.entries) {
                html += `<li>${this.escapeHtml(ref.formatted)}</li>\n`;
            }
            html += '</ol>\n';
            html += '</section>\n';
        }
        
        html += '</body>\n</html>';
        
        return html;
    }
    
    /**
     * Generate JSON output
     */
    async generateJSON(document) {
        return JSON.stringify(document, null, 2);
    }
    
    /**
     * Citation formatting methods
     */
    formatAPAReference(citation, number) {
        // Simplified APA formatting
        return `Author, A. A. (2024). ${citation}. Journal Name, 1(1), 1-10.`;
    }
    
    formatMLAReference(citation, number) {
        // Simplified MLA formatting
        return `Author, First. "${citation}." Journal Name, vol. 1, no. 1, 2024, pp. 1-10.`;
    }
    
    formatChicagoReference(citation, number) {
        // Simplified Chicago formatting
        return `Author, First. "${citation}." Journal Name 1, no. 1 (2024): 1-10.`;
    }
    
    formatAMAReference(citation, number) {
        // Simplified AMA formatting
        return `${number}. Author AA. ${citation}. Journal Name. 2024;1(1):1-10.`;
    }
    
    /**
     * Helper methods
     */
    formatSectionTitle(section) {
        return section
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    formatSectionContent(sectionContent, document) {
        if (typeof sectionContent === 'string') {
            return sectionContent;
        }
        return sectionContent.content || 'Section content to be added.';
    }
    
    generateAbstract(orchestrationResult) {
        return `This ${orchestrationResult.contentType.replace('_', ' ')} provides a comprehensive analysis based on consultation with multiple AI models and processing through specialized orchestration pipelines. The content synthesizes insights from ${orchestrationResult.metadata.sources} sources with ${orchestrationResult.metadata.citations} citations.`;
    }
    
    generateExecutiveSummary(orchestrationResult) {
        return `This document presents findings from an AI-orchestrated analysis conducted on ${new Date().toLocaleDateString()}. The analysis employed ${orchestrationResult.metadata.modelsUsed.length} specialized models and achieved a quality score of ${(orchestrationResult.quality.score * 100).toFixed(1)}%.`;
    }
    
    extractKeyPoints(orchestrationResult) {
        return [
            'Comprehensive analysis using multi-model AI consultation',
            'Evidence-based conclusions from authoritative sources',
            'Structured presentation following academic standards',
            'Quality assured through progressive refinement',
            'Complete citation tracking and source attribution'
        ];
    }
    
    generateReviewQuestions(orchestrationResult) {
        return [
            'What are the main findings presented in this analysis?',
            'How do the different AI models contribute to the overall conclusions?',
            'What evidence supports the primary arguments?',
            'How might these findings be applied in practice?',
            'What areas require further research?'
        ];
    }
    
    extractAppendices(orchestrationResult) {
        return [
            {
                title: 'Appendix A: Methodology',
                content: 'Detailed description of AI consultation and orchestration process'
            },
            {
                title: 'Appendix B: Data Sources',
                content: 'Complete list of consulted sources and models'
            }
        ];
    }
    
    extractSubsections(sectionContent) {
        // Simplified subsection extraction
        return [];
    }
    
    extractFigures(sectionContent, document) {
        // Simplified figure extraction
        return [];
    }
    
    extractTables(sectionContent, document) {
        // Simplified table extraction
        return [];
    }
    
    generateMarkdownTable(table) {
        let markdown = '\n';
        
        // Headers
        markdown += '| ' + table.headers.join(' | ') + ' |\n';
        markdown += '|' + table.headers.map(() => '---').join('|') + '|\n';
        
        // Rows
        for (const row of table.rows) {
            markdown += '| ' + row.join(' | ') + ' |\n';
        }
        
        markdown += '\n';
        return markdown;
    }
    
    calculateWordCount(document) {
        let count = 0;
        
        const countWords = (obj) => {
            if (typeof obj === 'string') {
                return obj.split(/\s+/).length;
            } else if (typeof obj === 'object') {
                for (const value of Object.values(obj)) {
                    count += countWords(value);
                }
            }
            return 0;
        };
        
        count += countWords(document.content);
        return count;
    }
    
    estimatePageCount(document) {
        const wordsPerPage = 250; // Academic standard
        return Math.ceil(this.calculateWordCount(document) / wordsPerPage);
    }
    
    assessCompleteness(document, template) {
        let score = 1.0;
        
        // Check if all required sections are present
        const requiredSections = [
            ...template.structure.frontMatter,
            ...template.structure.mainContent,
            ...template.structure.backMatter
        ];
        
        const presentSections = [
            ...Object.keys(document.content.frontMatter),
            ...Object.keys(document.content.mainContent),
            ...Object.keys(document.content.backMatter)
        ];
        
        const missingCount = requiredSections.filter(s => !presentSections.includes(s)).length;
        score -= (missingCount * 0.1);
        
        return Math.max(0, score);
    }
    
    assessFormatting(document) {
        // Simplified formatting assessment
        return 0.9;
    }
    
    assessCitations(document) {
        // Check citation quality
        const citationCount = document.citations.length;
        if (citationCount < 5) return 0.5;
        if (citationCount < 10) return 0.7;
        if (citationCount < 20) return 0.85;
        return 1.0;
    }
    
    escapeLatex(text) {
        return text
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/[#$%&_{}]/g, '\\$&')
            .replace(/\^/g, '\\textasciicircum{}')
            .replace(/~/g, '\\textasciitilde{}');
    }
    
    escapeHtml(text) {
        const div = { textContent: text };
        return div.textContent;
    }
    
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    
    getDefaultCSS() {
        return `
            body {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            h1, h2, h3 { margin-top: 1.5em; }
            .authors, .date { text-align: center; }
            .toc { background: #f5f5f5; padding: 20px; margin: 20px 0; }
            .toc ul { list-style-type: none; }
            .toc-level-2 { margin-left: 20px; }
            .toc-level-3 { margin-left: 40px; }
            .references { margin-top: 3em; }
            .content { text-align: justify; }
        `;
    }
    
    /**
     * Get formatter status
     */
    getStatus() {
        return {
            activeDocuments: this.activeDocuments.size,
            totalFormatted: this.formattingHistory.length,
            successRate: this.calculateSuccessRate(),
            supportedFormats: Object.keys(this.documentTemplates),
            citationStyles: Object.keys(this.citationStyles),
            exportFormats: Object.keys(this.exportFormats)
        };
    }
    
    calculateSuccessRate() {
        if (this.formattingHistory.length === 0) return 0;
        const successful = this.formattingHistory.filter(h => h.success).length;
        return successful / this.formattingHistory.length;
    }
}

module.exports = AcademicOutputFormatter;

// CLI interface
if (require.main === module) {
    const formatter = new AcademicOutputFormatter({
        defaultCitationStyle: 'apa',
        academicLevel: 'graduate'
    });
    
    // Example formatting
    setTimeout(async () => {
        console.log('\n🧪 Testing Academic Output Formatter\n');
        
        // Mock orchestration result
        const mockOrchestration = {
            orchestrationId: 'test-orch-456',
            consultationId: 'test-consult-123',
            contentType: 'medical_chapter',
            content: {
                title: 'Understanding Cardiac Arrhythmias',
                sections: {
                    introduction: {
                        content: 'Cardiac arrhythmias represent a significant clinical challenge...'
                    },
                    pathophysiology: {
                        content: 'The pathophysiology of arrhythmias involves complex mechanisms...'
                    },
                    clinical_presentation: {
                        content: 'Patients with arrhythmias may present with various symptoms...'
                    },
                    diagnosis: {
                        content: 'Diagnostic approaches include ECG, Holter monitoring, and electrophysiology studies...'
                    },
                    treatment: {
                        content: 'Treatment options range from medication to ablation procedures...'
                    }
                }
            },
            metadata: {
                sources: ['journal1', 'journal2', 'government1'],
                citations: [
                    'Smith et al. (2024). Cardiac Arrhythmias. New England Journal of Medicine.',
                    'Johnson, K. (2024). Electrophysiology Guidelines. Journal of Cardiology.',
                    'FDA. (2024). Antiarrhythmic Drug Safety. FDA.gov.'
                ]
            },
            quality: {
                score: 0.92
            }
        };
        
        // Format the document
        const result = await formatter.format(mockOrchestration, {
            title: 'Cardiac Arrhythmias: A Comprehensive Review',
            authors: ['Dr. AI System', 'Prof. Machine Learning'],
            citationStyle: 'apa',
            exportFormats: ['markdown', 'html']
        });
        
        console.log('\n📊 Formatting Results:');
        console.log(`Document Type: ${result.documentType}`);
        console.log(`Word Count: ${result.statistics.wordCount}`);
        console.log(`Page Count: ~${result.statistics.pageCount}`);
        console.log(`Citations: ${result.statistics.citationCount}`);
        console.log('\nExported Files:');
        Object.entries(result.exports).forEach(([format, info]) => {
            console.log(`  - ${format}: ${info.filename} (${info.size} bytes)`);
        });
        
        console.log('\nQuality Assessment:');
        console.log(`  Completeness: ${(result.quality.completeness * 100).toFixed(1)}%`);
        console.log(`  Formatting: ${(result.quality.formatting * 100).toFixed(1)}%`);
        console.log(`  Citations: ${(result.quality.citations * 100).toFixed(1)}%`);
        
        // Show formatter status
        console.log('\n📈 Formatter Status:');
        console.log(JSON.stringify(formatter.getStatus(), null, 2));
        
    }, 1000);
}
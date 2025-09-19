#!/usr/bin/env node

/**
 * Document Loader - Reads markdown files and converts them for the preview tool
 * Usage: node document-loader.js test-document.md
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentLoader {
    constructor() {
        this.patterns = {
            title: /^#\s+(.+)$/m,
            section: /^##\s+(.+)$/gm,
            subsection: /^###\s+(.+)$/gm,
            bulletList: /^[-*]\s+(.+)$/gm,
            numberedList: /^\d+\.\s+(.+)$/gm,
            boldText: /\*\*(.+?)\*\*/g,
            codeBlock: /```[\s\S]*?```/g
        };
    }

    async loadDocument(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return this.parseMarkdown(content);
        } catch (error) {
            console.error(`Error loading document: ${error.message}`);
            return null;
        }
    }

    parseMarkdown(content) {
        const document = {
            title: '',
            problem: '',
            solution: '',
            features: [],
            technicalRequirements: {},
            userStories: [],
            successCriteria: []
        };

        // Extract title
        const titleMatch = content.match(this.patterns.title);
        if (titleMatch) {
            document.title = titleMatch[1].trim();
        }

        // Split content into sections
        const sections = content.split(/^##\s+/m).slice(1);
        
        sections.forEach(section => {
            const lines = section.split('\n');
            const sectionTitle = lines[0].trim().toLowerCase();
            const sectionContent = lines.slice(1).join('\n').trim();

            if (sectionTitle.includes('problem')) {
                document.problem = this.extractParagraph(sectionContent);
            } else if (sectionTitle.includes('solution')) {
                document.solution = this.extractParagraph(sectionContent);
            } else if (sectionTitle.includes('feature')) {
                document.features = this.extractFeatures(sectionContent);
            } else if (sectionTitle.includes('technical')) {
                document.technicalRequirements = this.extractTechnicalRequirements(sectionContent);
            } else if (sectionTitle.includes('user stor')) {
                document.userStories = this.extractBulletList(sectionContent);
            } else if (sectionTitle.includes('success')) {
                document.successCriteria = this.extractBulletList(sectionContent);
            }
        });

        return document;
    }

    extractParagraph(content) {
        // Remove bullet points and extra whitespace
        return content
            .replace(/^[-*]\s+/gm, '')
            .replace(/\n+/g, ' ')
            .trim();
    }

    extractFeatures(content) {
        const features = [];
        const featureBlocks = content.split(/^\d+\.\s+/m).filter(Boolean);

        featureBlocks.forEach(block => {
            const lines = block.trim().split('\n');
            if (lines.length === 0) return;

            const firstLine = lines[0];
            const nameMatch = firstLine.match(/\*\*(.+?)\*\*/);
            const name = nameMatch ? nameMatch[1] : firstLine.split(/[-:]/)[0].trim();
            
            const description = firstLine.replace(/\*\*(.+?)\*\*/, '').replace(/^[-:]\s*/, '').trim();
            
            const details = lines.slice(1)
                .filter(line => line.match(/^\s*[-*]\s+/))
                .map(line => line.replace(/^\s*[-*]\s+/, '').trim());

            if (name) {
                features.push({
                    name,
                    description: description || 'Feature description',
                    details: details.length > 0 ? details : ['No additional details provided']
                });
            }
        });

        return features;
    }

    extractTechnicalRequirements(content) {
        const requirements = {};
        const lines = content.split('\n');

        lines.forEach(line => {
            const bulletMatch = line.match(/^[-*]\s+\*\*(.+?)\*\*:\s*(.+)$/);
            if (bulletMatch) {
                const key = bulletMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '_');
                requirements[key] = bulletMatch[2].trim();
            }
        });

        return requirements;
    }

    extractBulletList(content) {
        const items = [];
        const lines = content.split('\n');

        lines.forEach(line => {
            const match = line.match(/^[-*]\s+(.+)$/);
            if (match) {
                items.push(match[1].trim());
            }
        });

        return items;
    }

    async generateHTMLPreview(documentPath, outputPath = 'document-preview-live.html') {
        const document = await this.loadDocument(documentPath);
        if (!document) return;

        const template = await fs.readFile('document-preview.html', 'utf-8');
        
        // Replace the sample data with actual document data
        const updatedHTML = template.replace(
            /const documentData = \{[\s\S]*?\};/,
            `const documentData = ${JSON.stringify(document, null, 8)};`
        );

        await fs.writeFile(outputPath, updatedHTML);
        console.log(`✅ Generated preview at: ${outputPath}`);
        console.log(`📄 Open in browser: file://${path.resolve(outputPath)}`);
    }

    async exportToJSON(documentPath, outputPath = 'document-structure.json') {
        const document = await this.loadDocument(documentPath);
        if (!document) return;

        const structure = {
            document: {
                metadata: {
                    title: document.title,
                    type: 'product_specification',
                    version: '1.0',
                    created: new Date().toISOString(),
                    source: documentPath
                },
                content: {
                    problem_statement: document.problem,
                    solution_overview: document.solution,
                    features: document.features.map(f => ({
                        id: f.name.toLowerCase().replace(/\s+/g, '_'),
                        name: f.name,
                        description: f.description,
                        capabilities: f.details
                    })),
                    technical_architecture: document.technicalRequirements,
                    user_requirements: document.userStories,
                    success_metrics: document.successCriteria
                },
                mvp_generation: {
                    estimated_time: '30 minutes',
                    complexity: this.assessComplexity(document),
                    ai_models_required: ['gpt-4', 'claude-3'],
                    templates_available: this.suggestTemplates(document)
                }
            }
        };

        await fs.writeFile(outputPath, JSON.stringify(structure, null, 2));
        console.log(`📊 Exported JSON structure to: ${outputPath}`);
    }

    assessComplexity(document) {
        const featureCount = document.features.length;
        const hasAI = document.title.toLowerCase().includes('ai') || 
                      document.solution.toLowerCase().includes('ai');
        
        if (featureCount > 5 || hasAI) return 'complex';
        if (featureCount > 3) return 'moderate';
        return 'simple';
    }

    suggestTemplates(document) {
        const templates = [];
        const content = JSON.stringify(document).toLowerCase();

        if (content.includes('task') || content.includes('management')) {
            templates.push('task-management');
        }
        if (content.includes('ai') || content.includes('machine learning')) {
            templates.push('ai-platform');
        }
        if (content.includes('dashboard') || content.includes('analytics')) {
            templates.push('analytics-dashboard');
        }
        if (content.includes('api') || content.includes('integration')) {
            templates.push('api-service');
        }
        if (templates.length === 0) {
            templates.push('saas-starter');
        }

        return templates;
    }
}

// CLI usage
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
📄 Document Loader - Transform Markdown to Visual Previews

Usage:
  node document-loader.js <markdown-file> [options]

Options:
  --preview     Generate HTML preview (default)
  --json        Export to JSON structure
  --all         Generate both HTML and JSON

Examples:
  node document-loader.js test-document.md
  node document-loader.js test-document.md --json
  node document-loader.js test-document.md --all
        `);
        return;
    }

    const loader = new DocumentLoader();
    const documentPath = args[0];
    const options = args.slice(1);

    if (!documentPath) {
        console.error('❌ Please provide a markdown file path');
        return;
    }

    try {
        if (options.includes('--json')) {
            await loader.exportToJSON(documentPath);
        } else if (options.includes('--all')) {
            await loader.generateHTMLPreview(documentPath);
            await loader.exportToJSON(documentPath);
        } else {
            // Default to preview
            await loader.generateHTMLPreview(documentPath);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = DocumentLoader;
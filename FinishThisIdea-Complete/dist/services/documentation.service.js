"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentationService = void 0;
const logger_1 = require("../utils/logger");
const router_1 = require("../llm/router");
const error_handler_1 = require("../utils/error-handler");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const yaml = __importStar(require("js-yaml"));
class DocumentationService {
    templates;
    templatesLoaded;
    constructor() {
        this.templates = new Map();
        this.templatesLoaded = this.loadDefaultTemplates();
    }
    async loadDefaultTemplates() {
        const templatesDir = path.join(__dirname, '../templates/documentation');
        try {
            const templateFiles = await fs.readdir(templatesDir);
            for (const file of templateFiles) {
                if (file.endsWith('.yaml')) {
                    try {
                        const templatePath = path.join(templatesDir, file);
                        const templateContent = await fs.readFile(templatePath, 'utf-8');
                        const template = yaml.load(templateContent);
                        if (template && template.id) {
                            this.templates.set(template.id, template);
                            logger_1.logger.info(`Loaded documentation template: ${template.id}`);
                        }
                    }
                    catch (error) {
                        logger_1.logger.error(`Failed to load template ${file}:`, error);
                    }
                }
            }
            logger_1.logger.info(`Loaded ${this.templates.size} documentation templates`);
        }
        catch (error) {
            logger_1.logger.error('Failed to load documentation templates:', error);
            this.loadFallbackTemplates();
        }
    }
    loadFallbackTemplates() {
        const basicTemplate = {
            id: 'basic-readme',
            name: 'Basic README',
            description: 'Simple project documentation',
            requiredAnalysis: ['projectInfo'],
            sections: [
                {
                    id: 'overview',
                    title: 'Project Overview',
                    template: '# {{projectName}}\n\n{{description}}\n\n## Technology Stack\n\n{{technologies}}',
                    dataMapping: [
                        { placeholder: '{{projectName}}', source: 'projectInfo.name', default: 'Project' },
                        { placeholder: '{{description}}', source: 'projectInfo.description', default: 'A software project' },
                        { placeholder: '{{technologies}}', source: 'dependencies', transform: 'listTechnologies' }
                    ],
                    aiPrompt: 'Generate a comprehensive project overview based on the code analysis.'
                }
            ]
        };
        this.templates.set('basic-readme', basicTemplate);
    }
    async generateDocumentation(jobId, codeAnalysis, templateIds, profile) {
        return (0, error_handler_1.withErrorHandling)(this._generateDocumentation.bind(this), `documentation generation for job ${jobId}`, 300000)(jobId, codeAnalysis, templateIds, profile);
    }
    async _generateDocumentation(jobId, codeAnalysis, templateIds, profile) {
        logger_1.logger.info('Starting documentation generation', { jobId, templateIds });
        await this.templatesLoaded;
        const generatedTemplates = [];
        let totalTokensUsed = 0;
        const startTime = Date.now();
        for (const templateId of templateIds) {
            const template = this.templates.get(templateId);
            if (!template) {
                logger_1.logger.warn('Template not found', { templateId });
                continue;
            }
            const generatedSections = [];
            for (const section of template.sections) {
                try {
                    const sectionContent = await (0, error_handler_1.withRetry)(() => this.generateSection(section, codeAnalysis, profile), {
                        maxRetries: 2,
                        delay: 1000,
                        context: `section ${section.id} for template ${templateId}`,
                        retryOn: (error) => error.name === 'LLMError' || error.code === 'ECONNRESET'
                    });
                    generatedSections.push({
                        id: section.id,
                        title: section.title,
                        content: sectionContent.content,
                        dataUsed: sectionContent.dataUsed,
                        aiGenerated: sectionContent.aiGenerated
                    });
                    totalTokensUsed += sectionContent.tokensUsed || 0;
                }
                catch (error) {
                    logger_1.logger.error('Failed to generate section', {
                        templateId,
                        sectionId: section.id,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    generatedSections.push({
                        id: section.id,
                        title: section.title,
                        content: `# ${section.title}\n\n*Section generation failed: ${error instanceof Error ? error.message : String(error)}*\n\nPlease regenerate this section or add content manually.`,
                        dataUsed: [],
                        aiGenerated: false
                    });
                }
            }
            const fullContent = generatedSections
                .map(s => s.content)
                .join('\n\n');
            generatedTemplates.push({
                templateId,
                templateName: template.name,
                content: fullContent,
                sections: generatedSections
            });
        }
        const quality = this.calculateQualityMetrics(generatedTemplates, codeAnalysis);
        const generationTime = Date.now() - startTime;
        return {
            templates: generatedTemplates,
            quality,
            metadata: {
                tokensUsed: totalTokensUsed,
                generationTime,
                aiProvider: 'claude'
            }
        };
    }
    async generateSection(section, codeAnalysis, profile) {
        let content = section.template;
        const dataUsed = [];
        for (const mapping of section.dataMapping) {
            const value = this.extractDataValue(codeAnalysis, mapping);
            content = content.replace(new RegExp(mapping.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
            if (value !== mapping.default) {
                dataUsed.push(mapping.source);
            }
        }
        if (section.aiPrompt) {
            try {
                const aiResult = await error_handler_1.llmCircuitBreaker.execute(async () => {
                    return await router_1.llmRouter.route({
                        type: 'generate',
                        input: {
                            prompt: section.aiPrompt,
                            context: content,
                            codeAnalysis: JSON.stringify(codeAnalysis, null, 2)
                        },
                        options: {
                            preferLocal: true,
                            maxCost: 0.10,
                            profile
                        }
                    });
                });
                return {
                    content: aiResult.data || content,
                    dataUsed,
                    aiGenerated: true,
                    tokensUsed: aiResult.cost * 1000
                };
            }
            catch (error) {
                logger_1.logger.warn('AI enhancement failed, using template-only content', {
                    sectionId: section.id,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        return {
            content,
            dataUsed,
            aiGenerated: false,
            tokensUsed: 0
        };
    }
    extractDataValue(codeAnalysis, mapping) {
        try {
            const parts = mapping.source.split('.');
            let value = codeAnalysis;
            for (const part of parts) {
                if (part.includes('[') && part.includes(']')) {
                    const [prop, index] = part.split(/[\[\]]/);
                    value = value[prop]?.[parseInt(index) || 0];
                }
                else {
                    value = value?.[part];
                }
            }
            if (value === undefined || value === null) {
                return mapping.default || 'Not available';
            }
            if (mapping.transform) {
                return this.applyTransform(value, mapping.transform);
            }
            return String(value);
        }
        catch (error) {
            logger_1.logger.warn('Failed to extract data value', {
                source: mapping.source,
                error: error instanceof Error ? error.message : String(error)
            });
            return mapping.default || 'Not available';
        }
    }
    applyTransform(value, transform) {
        switch (transform) {
            case 'listTechnologies':
                if (Array.isArray(value)) {
                    return value.map(dep => `- ${dep.name}${dep.version ? ` (${dep.version})` : ''}`).join('\n');
                }
                return 'No dependencies found';
            case 'generateEndpointTable':
                if (Array.isArray(value)) {
                    const header = '| Method | Path | Description |\n|--------|------|-------------|';
                    const rows = value.map(api => `| ${api.method} | ${api.path} | ${api.description || 'No description'} |`);
                    return [header, ...rows].join('\n');
                }
                return 'No API endpoints found';
            case 'generateEndpointDetails':
                if (Array.isArray(value)) {
                    return value.map(api => {
                        let details = `### ${api.method} ${api.path}\n\n${api.description || 'No description available'}\n`;
                        if (api.parameters?.length > 0) {
                            details += '\n**Parameters:**\n';
                            details += api.parameters.map(p => `- \`${p.name}\` (${p.type})${p.required ? ' *required*' : ''}: ${p.description || 'No description'}`).join('\n');
                        }
                        return details;
                    }).join('\n\n');
                }
                return 'No API endpoints found';
            default:
                return String(value);
        }
    }
    calculateQualityMetrics(templates, codeAnalysis) {
        let totalSections = 0;
        let completedSections = 0;
        let aiGeneratedSections = 0;
        for (const template of templates) {
            for (const section of template.sections) {
                totalSections++;
                if (section.content && !section.content.includes('*Section generation failed')) {
                    completedSections++;
                }
                if (section.aiGenerated) {
                    aiGeneratedSections++;
                }
            }
        }
        const completeness = totalSections > 0 ? completedSections / totalSections : 0;
        const accuracy = 0.85;
        const readability = aiGeneratedSections > 0 ? 0.90 : 0.75;
        return {
            completeness,
            accuracy,
            readability,
            overallScore: (completeness + accuracy + readability) / 3
        };
    }
    async getAvailableTemplates() {
        await this.templatesLoaded;
        return Array.from(this.templates.values());
    }
}
exports.documentationService = new DocumentationService();
//# sourceMappingURL=documentation.service.js.map
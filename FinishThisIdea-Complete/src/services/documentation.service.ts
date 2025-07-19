import { logger } from '../utils/logger';
import { llmRouter } from '../llm/router';
import { 
  withErrorHandling, 
  withRetry, 
  CodeAnalysisError,
  LLMError,
  ValidationError,
  llmCircuitBreaker 
} from '../utils/error-handler';
import { ContextProfile } from '../types/context-profile';
import { CodeAnalysis } from '../types/code-analysis';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as yaml from 'js-yaml';

// Documentation template types
export interface DocumentationTemplate {
  id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  requiredAnalysis: string[];
}

export interface TemplateSection {
  id: string;
  title: string;
  template: string;
  dataMapping: DataMapping[];
  aiPrompt?: string;
}

export interface DataMapping {
  placeholder: string;
  source: string;
  transform?: string;
  default?: string;
}

export interface GeneratedSection {
  id: string;
  title: string;
  content: string;
  dataUsed: string[];
  aiGenerated: boolean;
}

export interface GeneratedTemplate {
  templateId: string;
  templateName: string;
  content: string;
  sections: GeneratedSection[];
}

export interface DocumentationResult {
  templates: GeneratedTemplate[];
  quality: QualityMetrics;
  metadata: {
    tokensUsed: number;
    generationTime: number;
    aiProvider: string;
  };
}

export interface QualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1  
  readability: number; // 0-1
  overallScore: number; // 0-1
}

export interface SectionGenerationResult {
  content: string;
  dataUsed: string[];
  aiGenerated: boolean;
  tokensUsed?: number;
}

class DocumentationService {
  private templates: Map<string, DocumentationTemplate>;
  private templatesLoaded: Promise<void>;

  constructor() {
    this.templates = new Map();
    this.templatesLoaded = this.loadDefaultTemplates();
  }

  private async loadDefaultTemplates(): Promise<void> {
    const templatesDir = path.join(__dirname, '../templates/documentation');
    
    try {
      const templateFiles = await fs.readdir(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.yaml')) {
          try {
            const templatePath = path.join(templatesDir, file);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            const template = yaml.load(templateContent) as DocumentationTemplate;
            
            if (template && template.id) {
              this.templates.set(template.id, template);
              logger.info(`Loaded documentation template: ${template.id}`);
            }
          } catch (error) {
            logger.error(`Failed to load template ${file}:`, error);
          }
        }
      }
      
      logger.info(`Loaded ${this.templates.size} documentation templates`);
    } catch (error) {
      logger.error('Failed to load documentation templates:', error);
      // Load basic fallback templates
      this.loadFallbackTemplates();
    }
  }

  private loadFallbackTemplates(): void {
    const basicTemplate: DocumentationTemplate = {
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

  async generateDocumentation(
    jobId: string,
    codeAnalysis: CodeAnalysis,
    templateIds: string[],
    profile?: ContextProfile
  ): Promise<DocumentationResult> {
    return withErrorHandling(
      this._generateDocumentation.bind(this),
      `documentation generation for job ${jobId}`,
      300000 // 5 minute timeout
    )(jobId, codeAnalysis, templateIds, profile);
  }

  private async _generateDocumentation(
    jobId: string,
    codeAnalysis: CodeAnalysis,
    templateIds: string[],
    profile?: ContextProfile
  ): Promise<DocumentationResult> {
    logger.info('Starting documentation generation', { jobId, templateIds });

    await this.templatesLoaded;

    const generatedTemplates: GeneratedTemplate[] = [];
    let totalTokensUsed = 0;
    const startTime = Date.now();

    for (const templateId of templateIds) {
      const template = this.templates.get(templateId);
      if (!template) {
        logger.warn('Template not found', { templateId });
        continue;
      }

      const generatedSections: GeneratedSection[] = [];

      for (const section of template.sections) {
        try {
          const sectionContent = await withRetry(
            () => this.generateSection(section, codeAnalysis, profile),
            {
              maxRetries: 2,
              delay: 1000,
              context: `section ${section.id} for template ${templateId}`,
              retryOn: (error) => error.name === 'LLMError' || error.code === 'ECONNRESET'
            }
          );

          generatedSections.push({
            id: section.id,
            title: section.title,
            content: sectionContent.content,
            dataUsed: sectionContent.dataUsed,
            aiGenerated: sectionContent.aiGenerated
          });

          totalTokensUsed += sectionContent.tokensUsed || 0;
        } catch (error) {
          logger.error('Failed to generate section', { 
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
        aiProvider: 'claude' // Default for now
      }
    };
  }

  private async generateSection(
    section: TemplateSection,
    codeAnalysis: CodeAnalysis,
    profile?: ContextProfile
  ): Promise<SectionGenerationResult> {
    let content = section.template;
    const dataUsed: string[] = [];

    // Apply data mappings
    for (const mapping of section.dataMapping) {
      const value = this.extractDataValue(codeAnalysis, mapping);
      content = content.replace(new RegExp(mapping.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      if (value !== mapping.default) {
        dataUsed.push(mapping.source);
      }
    }

    // If AI prompt is provided, enhance with AI
    if (section.aiPrompt) {
      try {
        const aiResult = await llmCircuitBreaker.execute(async () => {
          return await llmRouter.route({
            type: 'generate', // Changed from 'documentation' to valid type
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
          tokensUsed: aiResult.cost * 1000 // Rough estimate
        };
      } catch (error) {
        logger.warn('AI enhancement failed, using template-only content', {
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

  private extractDataValue(codeAnalysis: CodeAnalysis, mapping: DataMapping): string {
    try {
      const parts = mapping.source.split('.');
      let value: any = codeAnalysis;

      for (const part of parts) {
        if (part.includes('[') && part.includes(']')) {
          // Handle array access like "apis[0].method"
          const [prop, index] = part.split(/[\[\]]/);
          value = value[prop]?.[parseInt(index) || 0];
        } else {
          value = value?.[part];
        }
      }

      if (value === undefined || value === null) {
        return mapping.default || 'Not available';
      }

      // Apply transformations
      if (mapping.transform) {
        return this.applyTransform(value, mapping.transform);
      }

      return String(value);
    } catch (error) {
      logger.warn('Failed to extract data value', { 
        source: mapping.source, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return mapping.default || 'Not available';
    }
  }

  private applyTransform(value: any, transform: string): string {
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

  private calculateQualityMetrics(templates: GeneratedTemplate[], codeAnalysis: CodeAnalysis): QualityMetrics {
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
    const accuracy = 0.85; // Base accuracy score
    const readability = aiGeneratedSections > 0 ? 0.90 : 0.75; // AI content is typically more readable

    return {
      completeness,
      accuracy,
      readability,
      overallScore: (completeness + accuracy + readability) / 3
    };
  }

  async getAvailableTemplates(): Promise<DocumentationTemplate[]> {
    await this.templatesLoaded;
    return Array.from(this.templates.values());
  }
}

export const documentationService = new DocumentationService();
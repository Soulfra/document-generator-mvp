import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { logger } from '../../utils/logger';

export interface DocumentMetadata {
  title?: string;
  description?: string;
  author?: string;
  lastUpdated?: string;
  version?: string;
  template?: boolean;
  status?: string;
}

export interface ParsedDocument {
  filePath: string;
  fileName: string;
  metadata: DocumentMetadata;
  content: string;
  sections: DocumentSection[];
  requirements: ExtractedRequirement[];
}

export interface DocumentSection {
  level: number;
  title: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface ExtractedRequirement {
  type: 'api' | 'feature' | 'ui' | 'data' | 'business' | 'technical';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  source: {
    file: string;
    section: string;
    line: number;
  };
  details: any;
}

export class DocumentParserService {
  private supportedExtensions = ['.md', '.yaml', '.yml', '.json', '.txt'];

  /**
   * Parse a directory of documentation files
   */
  async parseDirectory(directoryPath: string): Promise<ParsedDocument[]> {
    try {
      logger.info('Starting directory parsing', { directoryPath });

      const files = await this.getAllFiles(directoryPath);
      const supportedFiles = files.filter(file => 
        this.supportedExtensions.includes(path.extname(file).toLowerCase())
      );

      logger.info('Found supported files', { 
        total: files.length, 
        supported: supportedFiles.length 
      });

      const parsedDocuments: ParsedDocument[] = [];

      for (const filePath of supportedFiles) {
        try {
          const document = await this.parseFile(filePath);
          parsedDocuments.push(document);
        } catch (error) {
          logger.warn('Failed to parse file', { 
            filePath, 
            error: error.message 
          });
        }
      }

      logger.info('Directory parsing completed', { 
        documentsProcessed: parsedDocuments.length 
      });

      return parsedDocuments;
    } catch (error) {
      logger.error('Directory parsing failed', { 
        directoryPath, 
        error: error.message 
      });
      throw new Error(`Failed to parse directory: ${error.message}`);
    }
  }

  /**
   * Parse a single documentation file
   */
  async parseFile(filePath: string): Promise<ParsedDocument> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      const extension = path.extname(filePath).toLowerCase();

      logger.debug('Parsing file', { filePath, extension });

      let parsedDocument: ParsedDocument;

      switch (extension) {
        case '.md':
          parsedDocument = this.parseMarkdown(filePath, fileName, content);
          break;
        case '.yaml':
        case '.yml':
          parsedDocument = this.parseYaml(filePath, fileName, content);
          break;
        case '.json':
          parsedDocument = this.parseJson(filePath, fileName, content);
          break;
        default:
          parsedDocument = this.parseText(filePath, fileName, content);
      }

      // Extract requirements from the parsed document
      parsedDocument.requirements = this.extractRequirements(parsedDocument);

      logger.debug('File parsing completed', { 
        filePath, 
        sectionsFound: parsedDocument.sections.length,
        requirementsExtracted: parsedDocument.requirements.length
      });

      return parsedDocument;
    } catch (error) {
      logger.error('File parsing failed', { 
        filePath, 
        error: error.message 
      });
      throw new Error(`Failed to parse file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Parse markdown file with frontmatter
   */
  private parseMarkdown(filePath: string, fileName: string, content: string): ParsedDocument {
    const { metadata, body } = this.extractFrontmatter(content);
    const sections = this.parseMarkdownSections(body);

    return {
      filePath,
      fileName,
      metadata,
      content: body,
      sections,
      requirements: [] // Will be populated later
    };
  }

  /**
   * Parse YAML configuration file
   */
  private parseYaml(filePath: string, fileName: string, content: string): ParsedDocument {
    try {
      const yamlData = yaml.load(content) as any;
      
      return {
        filePath,
        fileName,
        metadata: yamlData.metadata || {},
        content,
        sections: [{
          level: 1,
          title: yamlData.title || fileName,
          content: JSON.stringify(yamlData, null, 2),
          startLine: 1,
          endLine: content.split('\n').length
        }],
        requirements: []
      };
    } catch (error) {
      throw new Error(`Invalid YAML file: ${error.message}`);
    }
  }

  /**
   * Parse JSON configuration file
   */
  private parseJson(filePath: string, fileName: string, content: string): ParsedDocument {
    try {
      const jsonData = JSON.parse(content);
      
      return {
        filePath,
        fileName,
        metadata: jsonData.metadata || {},
        content,
        sections: [{
          level: 1,
          title: jsonData.title || fileName,
          content: JSON.stringify(jsonData, null, 2),
          startLine: 1,
          endLine: content.split('\n').length
        }],
        requirements: []
      };
    } catch (error) {
      throw new Error(`Invalid JSON file: ${error.message}`);
    }
  }

  /**
   * Parse plain text file
   */
  private parseText(filePath: string, fileName: string, content: string): ParsedDocument {
    return {
      filePath,
      fileName,
      metadata: {},
      content,
      sections: [{
        level: 1,
        title: fileName,
        content,
        startLine: 1,
        endLine: content.split('\n').length
      }],
      requirements: []
    };
  }

  /**
   * Extract frontmatter from markdown content
   */
  private extractFrontmatter(content: string): { metadata: DocumentMetadata; body: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      try {
        const metadata = yaml.load(match[1]) as DocumentMetadata;
        return { metadata, body: match[2] };
      } catch (error) {
        logger.warn('Invalid frontmatter YAML', { error: error.message });
      }
    }

    return { metadata: {}, body: content };
  }

  /**
   * Parse markdown into sections
   */
  private parseMarkdownSections(content: string): DocumentSection[] {
    const lines = content.split('\n');
    const sections: DocumentSection[] = [];
    let currentSection: Partial<DocumentSection> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.endLine = i - 1;
          sections.push(currentSection as DocumentSection);
        }

        // Start new section
        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2].trim(),
          content: '',
          startLine: i + 1,
          endLine: lines.length - 1
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    // Save last section
    if (currentSection) {
      sections.push(currentSection as DocumentSection);
    }

    return sections;
  }

  /**
   * Extract requirements from parsed document
   */
  private extractRequirements(document: ParsedDocument): ExtractedRequirement[] {
    const requirements: ExtractedRequirement[] = [];

    // Extract from different sections based on content patterns
    for (const section of document.sections) {
      const sectionRequirements = this.extractFromSection(document, section);
      requirements.push(...sectionRequirements);
    }

    return requirements;
  }

  /**
   * Extract requirements from a specific section
   */
  private extractFromSection(document: ParsedDocument, section: DocumentSection): ExtractedRequirement[] {
    const requirements: ExtractedRequirement[] = [];
    const content = section.content.toLowerCase();

    // API Requirements
    if (content.includes('api') || content.includes('endpoint') || content.includes('route')) {
      const apiRequirements = this.extractApiRequirements(document, section);
      requirements.push(...apiRequirements);
    }

    // Feature Requirements
    if (content.includes('feature') || content.includes('functionality') || content.includes('capability')) {
      const featureRequirements = this.extractFeatureRequirements(document, section);
      requirements.push(...featureRequirements);
    }

    // UI Requirements
    if (content.includes('ui') || content.includes('interface') || content.includes('component') || content.includes('frontend')) {
      const uiRequirements = this.extractUIRequirements(document, section);
      requirements.push(...uiRequirements);
    }

    // Data Requirements
    if (content.includes('data') || content.includes('database') || content.includes('model') || content.includes('schema')) {
      const dataRequirements = this.extractDataRequirements(document, section);
      requirements.push(...dataRequirements);
    }

    return requirements;
  }

  /**
   * Extract API requirements from section
   */
  private extractApiRequirements(document: ParsedDocument, section: DocumentSection): ExtractedRequirement[] {
    const requirements: ExtractedRequirement[] = [];
    
    // Look for API endpoint patterns
    const endpointRegex = /(GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\:]+)/gi;
    const matches = section.content.matchAll(endpointRegex);

    for (const match of matches) {
      requirements.push({
        type: 'api',
        title: `${match[1]} ${match[2]}`,
        description: `API endpoint: ${match[1]} ${match[2]}`,
        priority: 'high',
        source: {
          file: document.fileName,
          section: section.title,
          line: section.startLine
        },
        details: {
          method: match[1],
          path: match[2]
        }
      });
    }

    return requirements;
  }

  /**
   * Extract feature requirements from section
   */
  private extractFeatureRequirements(document: ParsedDocument, section: DocumentSection): ExtractedRequirement[] {
    const requirements: ExtractedRequirement[] = [];
    
    // Look for feature list items
    const featureRegex = /^[-*]\s+(.+)$/gm;
    const matches = section.content.matchAll(featureRegex);

    for (const match of matches) {
      const description = match[1].trim();
      if (description.length > 10) { // Filter out very short items
        requirements.push({
          type: 'feature',
          title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
          description,
          priority: this.determinePriority(description),
          source: {
            file: document.fileName,
            section: section.title,
            line: section.startLine
          },
          details: {
            fullDescription: description
          }
        });
      }
    }

    return requirements;
  }

  /**
   * Extract UI requirements from section
   */
  private extractUIRequirements(document: ParsedDocument, section: DocumentSection): ExtractedRequirement[] {
    const requirements: ExtractedRequirement[] = [];
    
    // Look for component mentions
    const componentRegex = /(\w+Component|\w+\.tsx|\w+\.jsx|<\w+)/gi;
    const matches = section.content.matchAll(componentRegex);

    for (const match of matches) {
      requirements.push({
        type: 'ui',
        title: `UI Component: ${match[1]}`,
        description: `User interface component: ${match[1]}`,
        priority: 'medium',
        source: {
          file: document.fileName,
          section: section.title,
          line: section.startLine
        },
        details: {
          componentName: match[1]
        }
      });
    }

    return requirements;
  }

  /**
   * Extract data requirements from section
   */
  private extractDataRequirements(document: ParsedDocument, section: DocumentSection): ExtractedRequirement[] {
    const requirements: ExtractedRequirement[] = [];
    
    // Look for data model patterns
    const modelRegex = /model\s+(\w+)|interface\s+(\w+)|class\s+(\w+)/gi;
    const matches = section.content.matchAll(modelRegex);

    for (const match of matches) {
      const modelName = match[1] || match[2] || match[3];
      requirements.push({
        type: 'data',
        title: `Data Model: ${modelName}`,
        description: `Data model or interface: ${modelName}`,
        priority: 'high',
        source: {
          file: document.fileName,
          section: section.title,
          line: section.startLine
        },
        details: {
          modelName
        }
      });
    }

    return requirements;
  }

  /**
   * Determine priority based on content keywords
   */
  private determinePriority(content: string): 'high' | 'medium' | 'low' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('critical') || 
        lowerContent.includes('essential') || 
        lowerContent.includes('required') ||
        lowerContent.includes('must have')) {
      return 'high';
    }
    
    if (lowerContent.includes('important') || 
        lowerContent.includes('should have') ||
        lowerContent.includes('recommended')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Recursively get all files in directory
   */
  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      logger.error('Failed to read directory', { dirPath, error: error.message });
    }
    
    return files;
  }
}
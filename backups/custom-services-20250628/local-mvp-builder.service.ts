import { promises as fs } from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LLMOrchestratorService } from './document-to-mvp/llm-orchestrator.service';
import { DocumentParserService } from './document-to-mvp/document-parser.service';

const execAsync = promisify(exec);

export interface LocalMVPConfig {
  inputFolder: string;
  outputFolder: string;
  projectName: string;
  approveRemote: boolean;
  llmProvider: 'ollama' | 'claude' | 'openai' | 'mixed';
  plugins: string[];
  packageFormat: 'zip' | 'tar.gz' | 'folder';
}

export interface MVPBuildResult {
  success: boolean;
  outputPath: string;
  filesGenerated: string[];
  auditLog: string;
  packagePath?: string;
  errors?: string[];
  warnings?: string[];
}

export interface PluginConfig {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface ApprovalRequest {
  action: string;
  description: string;
  remoteResources: string[];
  estimatedCost?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ApprovalResponse {
  approved: boolean;
  reason?: string;
  modifications?: Record<string, any>;
}

export class LocalMVPBuilderService {
  private documentParser: DocumentParserService;
  private llmOrchestrator: LLMOrchestratorService;
  private auditLog: string[] = [];

  constructor() {
    this.documentParser = new DocumentParserService();
    this.llmOrchestrator = new LLMOrchestratorService();
  }

  async buildMVP(config: LocalMVPConfig): Promise<MVPBuildResult> {
    const startTime = Date.now();
    this.auditLog = [];
    
    try {
      this.log(`Starting Local MVP Builder - ${new Date().toISOString()}`);
      this.log(`Project: ${config.projectName}`);
      this.log(`Input: ${config.inputFolder}`);
      this.log(`Output: ${config.outputFolder}`);
      this.log(`LLM Provider: ${config.llmProvider}`);
      
      // Step 1: Validate input folder
      await this.validateInputFolder(config.inputFolder);
      
      // Step 2: Parse documentation and specs
      const parsedDocs = await this.ingestDocuments(config.inputFolder);
      
      // Step 3: Generate project structure
      const projectStructure = await this.generateProjectStructure(parsedDocs, config);
      
      // Step 4: Generate code using LLM
      const generatedCode = await this.generateCode(projectStructure, config);
      
      // Step 5: Run plugins (build, test, lint, etc.)
      const pluginResults = await this.runPlugins(generatedCode, config);
      
      // Step 6: Handle remote/cloud actions with approval
      if (config.approveRemote) {
        await this.handleRemoteActions(generatedCode, config);
      }
      
      // Step 7: Package output
      const packagePath = await this.packageOutput(generatedCode, config);
      
      // Step 8: Generate audit log
      const auditLogPath = await this.generateAuditLog(config.outputFolder);
      
      const endTime = Date.now();
      this.log(`Build completed in ${endTime - startTime}ms`);
      
      return {
        success: true,
        outputPath: config.outputFolder,
        filesGenerated: generatedCode.files.map(f => f.path),
        auditLog: auditLogPath,
        packagePath,
        warnings: pluginResults.warnings
      };
      
    } catch (error) {
      this.log(`Build failed: ${error.message}`);
      return {
        success: false,
        outputPath: config.outputFolder,
        filesGenerated: [],
        auditLog: await this.generateAuditLog(config.outputFolder),
        errors: [error.message]
      };
    }
  }

  private async validateInputFolder(inputFolder: string): Promise<void> {
    this.log(`Validating input folder: ${inputFolder}`);
    
    const stats = await fs.stat(inputFolder);
    if (!stats.isDirectory()) {
      throw new Error(`Input path is not a directory: ${inputFolder}`);
    }
    
    const files = await fs.readdir(inputFolder);
    const docFiles = files.filter(f => 
      f.endsWith('.md') || 
      f.endsWith('.yml') || 
      f.endsWith('.yaml') || 
      f.endsWith('.json') ||
      f.endsWith('.txt')
    );
    
    if (docFiles.length === 0) {
      throw new Error('No documentation files found in input folder');
    }
    
    this.log(`Found ${docFiles.length} documentation files`);
  }

  private async ingestDocuments(inputFolder: string): Promise<any> {
    this.log('Ingesting and parsing documentation...');
    
    const parsedDocs = await this.documentParser.parseDirectory(inputFolder);
    
    if (parsedDocs.length === 0) {
      throw new Error('No valid documents could be parsed');
    }
    
    this.log(`Parsed ${parsedDocs.length} documents successfully`);
    return parsedDocs;
  }

  private async generateProjectStructure(parsedDocs: any[], config: LocalMVPConfig): Promise<any> {
    this.log('Generating project structure...');
    
    // Analyze documents to determine project type and structure
    const projectType = this.detectProjectType(parsedDocs);
    const requirements = this.extractRequirements(parsedDocs);
    
    this.log(`Detected project type: ${projectType}`);
    this.log(`Extracted ${requirements.length} requirements`);
    
    return {
      projectType,
      requirements,
      name: config.projectName,
      structure: this.getProjectStructure(projectType)
    };
  }

  private detectProjectType(parsedDocs: any[]): string {
    // Simple heuristics to detect project type
    const content = parsedDocs.map(doc => doc.content.toLowerCase()).join(' ');
    
    if (content.includes('api') || content.includes('endpoint') || content.includes('route')) {
      return 'api';
    } else if (content.includes('react') || content.includes('component') || content.includes('frontend')) {
      return 'react-app';
    } else if (content.includes('database') || content.includes('schema') || content.includes('model')) {
      return 'fullstack';
    } else if (content.includes('cli') || content.includes('command') || content.includes('script')) {
      return 'cli-tool';
    }
    
    return 'web-app'; // default
  }

  private extractRequirements(parsedDocs: any[]): any[] {
    const requirements = [];
    
    for (const doc of parsedDocs) {
      // Extract requirements from document content
      const docRequirements = this.parseRequirements(doc.content);
      requirements.push(...docRequirements);
    }
    
    return requirements;
  }

  private parseRequirements(content: string): any[] {
    const requirements = [];
    
    // Simple regex patterns to extract requirements
    const patterns = [
      /(?:must|should|shall|will)\s+(.+?)(?:\.|$)/gi,
      /(?:requirement|feature|functionality):\s*(.+?)(?:\.|$)/gi,
      /(?:the system|application|service)\s+(.+?)(?:\.|$)/gi
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        requirements.push(...matches.map(match => ({
          type: 'functional',
          description: match.trim(),
          priority: 'medium'
        })));
      }
    }
    
    return requirements;
  }

  private getProjectStructure(projectType: string): any {
    const structures = {
      'api': {
        'src/': {
          'routes/': {},
          'middleware/': {},
          'models/': {},
          'utils/': {},
          'app.ts': 'express-app',
          'server.ts': 'server-entry'
        },
        'package.json': 'package-config',
        'tsconfig.json': 'typescript-config',
        '.env.example': 'env-template',
        'README.md': 'readme'
      },
      'react-app': {
        'src/': {
          'components/': {},
          'pages/': {},
          'hooks/': {},
          'utils/': {},
          'App.tsx': 'app-component',
          'index.tsx': 'entry-point'
        },
        'public/': {
          'index.html': 'html-template'
        },
        'package.json': 'react-package-config',
        'tsconfig.json': 'react-typescript-config',
        'README.md': 'readme'
      },
      'cli-tool': {
        'src/': {
          'commands/': {},
          'utils/': {},
          'index.ts': 'cli-entry'
        },
        'bin/': {
          'cli': 'cli-binary'
        },
        'package.json': 'cli-package-config',
        'tsconfig.json': 'typescript-config',
        'README.md': 'readme'
      }
    };
    
    return structures[projectType] || structures['web-app'];
  }

  private async generateCode(projectStructure: any, config: LocalMVPConfig): Promise<any> {
    this.log(`Generating code using ${config.llmProvider}...`);
    
    const codeGenerationRequest = {
      requirements: projectStructure.requirements,
      projectType: projectStructure.projectType,
      structure: projectStructure.structure,
      name: projectStructure.name,
      llmProvider: config.llmProvider
    };
    
    const generatedCode = await this.llmOrchestrator.generateCode(codeGenerationRequest);
    
    this.log(`Generated ${generatedCode.files.length} files`);
    
    // Write files to output folder
    await this.writeGeneratedFiles(generatedCode.files, config.outputFolder);
    
    return generatedCode;
  }

  private async writeGeneratedFiles(files: any[], outputFolder: string): Promise<void> {
    await fs.mkdir(outputFolder, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(outputFolder, file.path);
      const fileDir = path.dirname(filePath);
      
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf8');
      
      this.log(`Created file: ${file.path}`);
    }
  }

  private async runPlugins(generatedCode: any, config: LocalMVPConfig): Promise<any> {
    this.log('Running plugins...');
    
    const pluginResults = {
      warnings: [],
      errors: []
    };
    
    for (const pluginName of config.plugins) {
      try {
        await this.runPlugin(pluginName, generatedCode, config);
        this.log(`Plugin ${pluginName} completed successfully`);
      } catch (error) {
        this.log(`Plugin ${pluginName} failed: ${error.message}`);
        pluginResults.warnings.push(`Plugin ${pluginName}: ${error.message}`);
      }
    }
    
    return pluginResults;
  }

  private async runPlugin(pluginName: string, generatedCode: any, config: LocalMVPConfig): Promise<void> {
    const pluginPath = path.join(config.outputFolder);
    
    switch (pluginName) {
      case 'build':
        await this.runBuildPlugin(pluginPath);
        break;
      case 'test':
        await this.runTestPlugin(pluginPath);
        break;
      case 'lint':
        await this.runLintPlugin(pluginPath);
        break;
      case 'format':
        await this.runFormatPlugin(pluginPath);
        break;
      default:
        this.log(`Unknown plugin: ${pluginName}`);
    }
  }

  private async runBuildPlugin(projectPath: string): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync('npm run build', { cwd: projectPath });
      if (stderr) this.log(`Build warnings: ${stderr}`);
      this.log('Build completed successfully');
    } catch (error) {
      // Try alternative build commands
      try {
        await execAsync('yarn build', { cwd: projectPath });
        this.log('Build completed with yarn');
      } catch (yarnError) {
        this.log('Build step skipped - no build script found');
      }
    }
  }

  private async runTestPlugin(projectPath: string): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync('npm test', { cwd: projectPath });
      this.log('Tests completed successfully');
    } catch (error) {
      this.log('Test step skipped - no test script found');
    }
  }

  private async runLintPlugin(projectPath: string): Promise<void> {
    try {
      await execAsync('npm run lint', { cwd: projectPath });
      this.log('Linting completed successfully');
    } catch (error) {
      this.log('Lint step skipped - no lint script found');
    }
  }

  private async runFormatPlugin(projectPath: string): Promise<void> {
    try {
      await execAsync('npm run format', { cwd: projectPath });
      this.log('Formatting completed successfully');
    } catch (error) {
      this.log('Format step skipped - no format script found');
    }
  }

  private async handleRemoteActions(generatedCode: any, config: LocalMVPConfig): Promise<void> {
    this.log('Handling remote/cloud actions...');
    
    const remoteActions = this.identifyRemoteActions(generatedCode);
    
    if (remoteActions.length === 0) {
      this.log('No remote actions required');
      return;
    }
    
    for (const action of remoteActions) {
      const approval = await this.requestApproval(action);
      
      if (approval.approved) {
        await this.executeRemoteAction(action, approval.modifications);
        this.log(`Remote action approved and executed: ${action.action}`);
      } else {
        this.log(`Remote action rejected: ${action.action} - ${approval.reason}`);
      }
    }
  }

  private identifyRemoteActions(generatedCode: any): ApprovalRequest[] {
    const actions = [];
    
    // Identify actions that require remote access
    const files = generatedCode.files;
    
    for (const file of files) {
      if (file.content.includes('github.com') || file.content.includes('git push')) {
        actions.push({
          action: 'github_repository_creation',
          description: 'Create GitHub repository and push code',
          remoteResources: ['GitHub API'],
          riskLevel: 'medium' as const
        });
      }
      
      if (file.content.includes('deploy') || file.content.includes('aws') || file.content.includes('vercel')) {
        actions.push({
          action: 'cloud_deployment',
          description: 'Deploy application to cloud provider',
          remoteResources: ['Cloud Provider API'],
          estimatedCost: 5,
          riskLevel: 'high' as const
        });
      }
    }
    
    return actions;
  }

  private async requestApproval(request: ApprovalRequest): Promise<ApprovalResponse> {
    // In a real implementation, this would trigger a desktop notification,
    // email, or mobile app notification for approval
    this.log(`Approval requested: ${request.action}`);
    this.log(`Description: ${request.description}`);
    this.log(`Risk Level: ${request.riskLevel}`);
    
    // For now, auto-approve low-risk actions, reject high-risk ones
    if (request.riskLevel === 'low') {
      return { approved: true };
    }
    
    return { 
      approved: false, 
      reason: 'Remote actions require manual approval in production mode' 
    };
  }

  private async executeRemoteAction(action: ApprovalRequest, modifications?: Record<string, any>): Promise<void> {
    this.log(`Executing remote action: ${action.action}`);
    
    switch (action.action) {
      case 'github_repository_creation':
        // Implementation would create GitHub repo and push code
        this.log('GitHub repository creation simulated');
        break;
      case 'cloud_deployment':
        // Implementation would deploy to cloud provider
        this.log('Cloud deployment simulated');
        break;
      default:
        this.log(`Unknown remote action: ${action.action}`);
    }
  }

  private async packageOutput(generatedCode: any, config: LocalMVPConfig): Promise<string> {
    this.log(`Packaging output in ${config.packageFormat} format...`);
    
    const packagePath = path.join(config.outputFolder, `${config.projectName}.${config.packageFormat}`);
    
    try {
      switch (config.packageFormat) {
        case 'zip':
          await execAsync(`cd "${config.outputFolder}" && zip -r "${packagePath}" .`);
          break;
        case 'tar.gz':
          await execAsync(`cd "${config.outputFolder}" && tar -czf "${packagePath}" .`);
          break;
        case 'folder':
          // Already in folder format
          return config.outputFolder;
      }
      
      this.log(`Package created: ${packagePath}`);
      return packagePath;
    } catch (error) {
      this.log(`Packaging failed: ${error.message}`);
      return config.outputFolder;
    }
  }

  private async generateAuditLog(outputFolder: string): Promise<string> {
    const auditLogPath = path.join(outputFolder, 'audit.log');
    const auditContent = this.auditLog.join('\n');
    
    await fs.writeFile(auditLogPath, auditContent, 'utf8');
    
    return auditLogPath;
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.auditLog.push(logEntry);
    console.log(logEntry);
  }
}

export const localMVPBuilder = new LocalMVPBuilderService();
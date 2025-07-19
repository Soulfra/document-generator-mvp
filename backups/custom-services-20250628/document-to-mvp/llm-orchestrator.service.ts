import { AIReviewService, AIProvider } from '../ai-review.service';
import { UserProfile } from './interactive-profiler.service';
import { ExtractedRequirement } from './document-parser.service';
import { logger } from '../../utils/logger';

export interface CodeGenerationRequest {
  profile: UserProfile;
  requirements: ExtractedRequirement[];
  targetFiles: GenerationTarget[];
  context?: any;
}

export interface GenerationTarget {
  type: 'backend' | 'frontend' | 'database' | 'infrastructure' | 'tests' | 'documentation';
  path: string;
  description: string;
  dependencies: string[];
  priority: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
  dependencies: string[];
  confidence: number;
  generatedBy: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  overallConfidence: number;
  consensusMetrics: {
    agreementScore: number;
    conflictingFiles: string[];
    recommendedFiles: GeneratedFile[];
  };
  metadata: {
    modelsUsed: string[];
    totalTokens: number;
    processingTimeMs: number;
    timestamp: Date;
  };
}

export interface CodeGenerationPrompt {
  system: string;
  user: string;
  context: any;
  expectedOutput: string;
}

export class LLMOrchestratorService {
  private aiService: AIReviewService;

  constructor() {
    this.aiService = new AIReviewService();
  }

  /**
   * Generate code using multiple LLM providers with consensus
   */
  async generateCode(request: CodeGenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    logger.info('Starting code generation', {
      profileId: request.profile.id,
      requirementsCount: request.requirements.length,
      targetsCount: request.targetFiles.length
    });

    try {
      // Get available providers
      const availableProviders = this.aiService.getAvailableProviders();
      if (availableProviders.length === 0) {
        throw new Error('No AI providers available for code generation');
      }

      // Generate code with each available provider
      const generationPromises = availableProviders.map(provider =>
        this.generateWithProvider(provider, request)
      );

      const results = await Promise.allSettled(generationPromises);
      
      // Extract successful results
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<GeneratedFile[]> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      if (successfulResults.length === 0) {
        throw new Error('All code generation attempts failed');
      }

      // Calculate consensus and create final result
      const consensusResult = this.calculateConsensus(successfulResults, availableProviders);
      
      const processingTime = Date.now() - startTime;
      
      const result: GenerationResult = {
        files: consensusResult.recommendedFiles,
        overallConfidence: consensusResult.agreementScore,
        consensusMetrics: consensusResult,
        metadata: {
          modelsUsed: availableProviders,
          totalTokens: 0, // Would be calculated from actual API responses
          processingTimeMs: processingTime,
          timestamp: new Date()
        }
      };

      logger.info('Code generation completed', {
        filesGenerated: result.files.length,
        overallConfidence: result.overallConfidence,
        processingTimeMs: processingTime
      });

      return result;
    } catch (error) {
      logger.error('Code generation failed', {
        error: error.message,
        profileId: request.profile.id
      });
      throw error;
    }
  }

  /**
   * Generate code with a specific provider
   */
  private async generateWithProvider(
    providerName: string,
    request: CodeGenerationRequest
  ): Promise<GeneratedFile[]> {
    logger.debug('Generating with provider', { providerName });

    const files: GeneratedFile[] = [];

    // Generate each target file
    for (const target of request.targetFiles) {
      try {
        const prompt = this.createGenerationPrompt(request, target);
        const aiResult = await this.aiService.analyzeCode(providerName, prompt.user);

        // Parse the AI response to extract file content
        const fileContent = this.extractFileContent(aiResult.fullAnalysis, target);
        
        const generatedFile: GeneratedFile = {
          path: target.path,
          content: fileContent,
          description: target.description,
          dependencies: target.dependencies,
          confidence: aiResult.overallScore / 100, // Convert to 0-1 scale
          generatedBy: providerName
        };

        files.push(generatedFile);
      } catch (error) {
        logger.warn('Failed to generate file with provider', {
          providerName,
          targetPath: target.path,
          error: error.message
        });
      }
    }

    return files;
  }

  /**
   * Create generation prompt for specific target
   */
  private createGenerationPrompt(
    request: CodeGenerationRequest,
    target: GenerationTarget
  ): CodeGenerationPrompt {
    const { profile, requirements } = request;
    const choices = profile.selectedChoices;

    const systemPrompt = `You are an expert full-stack developer creating production-ready code based on user requirements and preferences.

User Profile:
- Project: ${profile.projectName}
- Tech Stack: ${JSON.stringify(choices, null, 2)}
- Requirements: ${requirements.length} extracted requirements

Generate high-quality, production-ready code that follows best practices and matches the user's technology choices.`;

    const userPrompt = this.buildUserPrompt(target, requirements, choices);

    return {
      system: systemPrompt,
      user: userPrompt,
      context: {
        profile,
        target,
        requirements
      },
      expectedOutput: this.getExpectedOutput(target)
    };
  }

  /**
   * Build detailed user prompt for code generation
   */
  private buildUserPrompt(
    target: GenerationTarget,
    requirements: ExtractedRequirement[],
    choices: Record<string, string | string[]>
  ): string {
    let prompt = `Generate ${target.type} code for: ${target.description}\n\n`;

    // Add relevant requirements
    const relevantReqs = requirements.filter(req => this.isRelevantRequirement(req, target));
    if (relevantReqs.length > 0) {
      prompt += `Requirements to implement:\n`;
      relevantReqs.forEach((req, index) => {
        prompt += `${index + 1}. ${req.title}: ${req.description}\n`;
      });
      prompt += '\n';
    }

    // Add technology constraints
    prompt += `Technology Constraints:\n`;
    Object.entries(choices).forEach(([key, value]) => {
      prompt += `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
    });
    prompt += '\n';

    // Add specific instructions based on target type
    prompt += this.getTargetSpecificInstructions(target, choices);

    // Add output format requirements
    prompt += `\nOutput Requirements:
- Provide complete, production-ready code
- Include all necessary imports and dependencies
- Add appropriate error handling
- Include TypeScript types where applicable
- Follow best practices for the chosen technology stack
- Add brief comments for complex logic

Generate the complete file content for: ${target.path}`;

    return prompt;
  }

  /**
   * Get target-specific generation instructions
   */
  private getTargetSpecificInstructions(
    target: GenerationTarget,
    choices: Record<string, string | string[]>
  ): string {
    switch (target.type) {
      case 'backend':
        return this.getBackendInstructions(choices);
      case 'frontend':
        return this.getFrontendInstructions(choices);
      case 'database':
        return this.getDatabaseInstructions(choices);
      case 'infrastructure':
        return this.getInfrastructureInstructions(choices);
      case 'tests':
        return this.getTestInstructions(choices);
      case 'documentation':
        return this.getDocumentationInstructions(choices);
      default:
        return 'Follow general best practices for the file type.';
    }
  }

  /**
   * Get backend-specific instructions
   */
  private getBackendInstructions(choices: Record<string, string | string[]>): string {
    const framework = choices['backend-framework'] || 'node-express';
    const apiStyle = choices['api-style'] || 'rest';
    const database = choices['database'] || 'postgresql';

    return `Backend Instructions:
- Use ${framework} as the primary framework
- Implement ${apiStyle} API design patterns
- Configure for ${database} database
- Include proper middleware (CORS, body parsing, error handling)
- Implement authentication and authorization where needed
- Add input validation and sanitization
- Include proper logging and monitoring
- Follow RESTful conventions or chosen API style`;
  }

  /**
   * Get frontend-specific instructions
   */
  private getFrontendInstructions(choices: Record<string, string | string[]>): string {
    const framework = choices['frontend-framework'] || 'react';
    const styling = choices['styling-approach'] || 'tailwind';
    const uiStyle = choices['ui-style'] || 'modern-minimal';

    return `Frontend Instructions:
- Use ${framework} as the primary framework
- Style with ${styling}
- Follow ${uiStyle} design principles
- Create responsive, mobile-friendly components
- Implement proper state management
- Add error boundaries and loading states
- Include accessibility features (ARIA labels, keyboard navigation)
- Optimize for performance (lazy loading, code splitting)`;
  }

  /**
   * Get database-specific instructions
   */
  private getDatabaseInstructions(choices: Record<string, string | string[]>): string {
    const database = choices['database'] || 'postgresql';
    const orm = choices['orm'] || 'prisma';

    return `Database Instructions:
- Design for ${database}
- Use ${orm} for data access
- Create proper indexes for performance
- Include migration scripts
- Add proper constraints and validations
- Follow normalization best practices
- Include seed data examples`;
  }

  /**
   * Get infrastructure-specific instructions
   */
  private getInfrastructureInstructions(choices: Record<string, string | string[]>): string {
    const deployment = choices['deployment-platform'] || 'vercel';
    const cicd = choices['ci-cd'] || 'github-actions';

    return `Infrastructure Instructions:
- Configure for ${deployment} deployment
- Set up ${cicd} automation
- Include Docker configuration if needed
- Add environment variable management
- Configure proper security settings
- Include monitoring and logging setup`;
  }

  /**
   * Get test-specific instructions
   */
  private getTestInstructions(choices: Record<string, string | string[]>): string {
    const framework = choices['frontend-framework'] || choices['backend-framework'] || 'react';

    return `Testing Instructions:
- Write comprehensive unit tests
- Include integration tests for API endpoints
- Add end-to-end tests for critical flows
- Use appropriate testing framework for ${framework}
- Include test setup and teardown
- Mock external dependencies
- Achieve good test coverage`;
  }

  /**
   * Get documentation-specific instructions
   */
  private getDocumentationInstructions(choices: Record<string, string | string[]>): string {
    return `Documentation Instructions:
- Create comprehensive README with setup instructions
- Document API endpoints with examples
- Include deployment guides
- Add troubleshooting section
- Document environment variables
- Include contribution guidelines
- Use clear, beginner-friendly language`;
  }

  /**
   * Check if requirement is relevant to target
   */
  private isRelevantRequirement(req: ExtractedRequirement, target: GenerationTarget): boolean {
    const typeMapping: Record<string, string[]> = {
      'backend': ['api', 'business', 'technical'],
      'frontend': ['ui', 'feature'],
      'database': ['data', 'technical'],
      'infrastructure': ['technical'],
      'tests': ['api', 'feature', 'ui'],
      'documentation': ['api', 'feature', 'ui', 'business', 'technical', 'data']
    };

    return typeMapping[target.type]?.includes(req.type) || false;
  }

  /**
   * Get expected output format for target
   */
  private getExpectedOutput(target: GenerationTarget): string {
    const extension = target.path.split('.').pop() || '';
    
    const formatMap: Record<string, string> = {
      'ts': 'TypeScript file with proper types and exports',
      'js': 'JavaScript file with proper module exports',
      'tsx': 'React component file with TypeScript',
      'jsx': 'React component file with JavaScript',
      'json': 'Valid JSON configuration file',
      'md': 'Markdown documentation file',
      'yml': 'YAML configuration file',
      'yaml': 'YAML configuration file',
      'sql': 'SQL schema or migration file'
    };

    return formatMap[extension] || 'Complete file content';
  }

  /**
   * Extract file content from AI response
   */
  private extractFileContent(aiResponse: string, target: GenerationTarget): string {
    // Look for code blocks in the response
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
    const matches = Array.from(aiResponse.matchAll(codeBlockRegex));

    if (matches.length > 0) {
      // Return the largest code block (most likely the main content)
      const codeBlocks = matches.map(match => match[1]);
      return codeBlocks.reduce((a, b) => a.length > b.length ? a : b);
    }

    // If no code blocks found, return the entire response
    return aiResponse;
  }

  /**
   * Calculate consensus from multiple generation results
   */
  private calculateConsensus(
    results: GeneratedFile[][],
    providers: string[]
  ): {
    agreementScore: number;
    conflictingFiles: string[];
    recommendedFiles: GeneratedFile[];
  } {
    // Group files by path
    const filesByPath: Record<string, GeneratedFile[]> = {};
    
    results.forEach(providerResults => {
      providerResults.forEach(file => {
        if (!filesByPath[file.path]) {
          filesByPath[file.path] = [];
        }
        filesByPath[file.path].push(file);
      });
    });

    const recommendedFiles: GeneratedFile[] = [];
    const conflictingFiles: string[] = [];
    let totalAgreement = 0;
    let totalFiles = 0;

    // For each file path, select the best version
    Object.entries(filesByPath).forEach(([path, versions]) => {
      totalFiles++;

      if (versions.length === 1) {
        // Only one version, use it
        recommendedFiles.push(versions[0]);
        totalAgreement += 1;
      } else {
        // Multiple versions, check for consensus
        const agreement = this.calculateFileAgreement(versions);
        totalAgreement += agreement;

        if (agreement < 0.7) {
          conflictingFiles.push(path);
        }

        // Select the version with highest confidence
        const bestVersion = versions.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        recommendedFiles.push(bestVersion);
      }
    });

    const agreementScore = totalFiles > 0 ? totalAgreement / totalFiles : 0;

    return {
      agreementScore,
      conflictingFiles,
      recommendedFiles
    };
  }

  /**
   * Calculate agreement score between file versions
   */
  private calculateFileAgreement(versions: GeneratedFile[]): number {
    if (versions.length <= 1) return 1;

    // Simple agreement calculation based on content similarity
    // In a real implementation, you might use more sophisticated text similarity algorithms
    const avgConfidence = versions.reduce((sum, v) => sum + v.confidence, 0) / versions.length;
    
    // For now, use average confidence as agreement proxy
    return avgConfidence;
  }

  /**
   * Get generation targets based on user profile
   */
  generateTargets(profile: UserProfile): GenerationTarget[] {
    const targets: GenerationTarget[] = [];
    const choices = profile.selectedChoices;
    const projectType = choices['project-type'];

    // Backend targets
    if (projectType === 'web-app' || projectType === 'api-service') {
      targets.push(...this.getBackendTargets(choices));
    }

    // Frontend targets
    if (projectType === 'web-app' || projectType === 'mobile-app') {
      targets.push(...this.getFrontendTargets(choices));
    }

    // Database targets
    if (choices['database']) {
      targets.push(...this.getDatabaseTargets(choices));
    }

    // Infrastructure targets
    targets.push(...this.getInfrastructureTargets(choices));

    // Documentation targets
    targets.push(...this.getDocumentationTargets(choices));

    // Test targets
    targets.push(...this.getTestTargets(choices));

    return targets.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get backend generation targets
   */
  private getBackendTargets(choices: Record<string, string | string[]>): GenerationTarget[] {
    const framework = choices['backend-framework'] || 'node-express';
    
    return [
      {
        type: 'backend',
        path: 'src/server.ts',
        description: 'Main server configuration and startup',
        dependencies: [],
        priority: 10
      },
      {
        type: 'backend',
        path: 'src/routes/api.ts',
        description: 'API route definitions',
        dependencies: ['src/server.ts'],
        priority: 9
      },
      {
        type: 'backend',
        path: 'src/middleware/auth.ts',
        description: 'Authentication middleware',
        dependencies: ['src/server.ts'],
        priority: 8
      },
      {
        type: 'backend',
        path: 'src/services/database.ts',
        description: 'Database connection and configuration',
        dependencies: [],
        priority: 7
      }
    ];
  }

  /**
   * Get frontend generation targets
   */
  private getFrontendTargets(choices: Record<string, string | string[]>): GenerationTarget[] {
    return [
      {
        type: 'frontend',
        path: 'src/App.tsx',
        description: 'Main application component',
        dependencies: [],
        priority: 10
      },
      {
        type: 'frontend',
        path: 'src/components/Layout.tsx',
        description: 'Application layout component',
        dependencies: ['src/App.tsx'],
        priority: 8
      },
      {
        type: 'frontend',
        path: 'src/pages/HomePage.tsx',
        description: 'Home page component',
        dependencies: ['src/components/Layout.tsx'],
        priority: 7
      }
    ];
  }

  /**
   * Get database generation targets
   */
  private getDatabaseTargets(choices: Record<string, string | string[]>): GenerationTarget[] {
    const orm = choices['orm'] || 'prisma';
    
    if (orm === 'prisma') {
      return [
        {
          type: 'database',
          path: 'prisma/schema.prisma',
          description: 'Prisma database schema',
          dependencies: [],
          priority: 9
        }
      ];
    }

    return [
      {
        type: 'database',
        path: 'src/models/index.ts',
        description: 'Database models and schema',
        dependencies: [],
        priority: 9
      }
    ];
  }

  /**
   * Get infrastructure generation targets
   */
  private getInfrastructureTargets(choices: Record<string, string | string[]>): GenerationTarget[] {
    return [
      {
        type: 'infrastructure',
        path: 'package.json',
        description: 'Package configuration and dependencies',
        dependencies: [],
        priority: 10
      },
      {
        type: 'infrastructure',
        path: 'Dockerfile',
        description: 'Docker container configuration',
        dependencies: ['package.json'],
        priority: 6
      },
      {
        type: 'infrastructure',
        path: '.env.example',
        description: 'Environment variables template',
        dependencies: [],
        priority: 5
      }
    ];
  }

  /**
   * Get documentation generation targets
   */
  private getDocumentationTargets(choices: Record<string, string | string[]>): GenerationTarget[] {
    return [
      {
        type: 'documentation',
        path: 'README.md',
        description: 'Project documentation and setup guide',
        dependencies: [],
        priority: 8
      },
      {
        type: 'documentation',
        path: 'docs/API.md',
        description: 'API documentation',
        dependencies: ['src/routes/api.ts'],
        priority: 6
      }
    ];
  }

  /**
   * Get test generation targets
   */
  private getTestTargets(choices: Record<string, string | string[]>): GenerationTarget[] {
    return [
      {
        type: 'tests',
        path: 'src/__tests__/api.test.ts',
        description: 'API endpoint tests',
        dependencies: ['src/routes/api.ts'],
        priority: 7
      },
      {
        type: 'tests',
        path: 'jest.config.js',
        description: 'Jest testing configuration',
        dependencies: [],
        priority: 5
      }
    ];
  }
}
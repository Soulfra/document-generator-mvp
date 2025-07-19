/**
 * Pipeline Orchestrator - Coordinates document processing through all stages
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Import sovereign agent services
const StreamingDocumentParser = require('../sovereign-agents/src/parsers/StreamingDocumentParser');
const ChainOfThoughtEngine = require('../sovereign-agents/src/reasoning/ChainOfThoughtEngine');
const AnalystAgent = require('../sovereign-agents/src/agents/AnalystAgent');
const ArchitectAgent = require('../sovereign-agents/src/agents/ArchitectAgent');
const CoderAgent = require('../sovereign-agents/src/agents/CoderAgent');

class PipelineOrchestrator {
  constructor(jobQueue, wsManager, approvalManager = null) {
    this.jobQueue = jobQueue;
    this.wsManager = wsManager;
    this.approvalManager = approvalManager;
    
    // Initialize services
    this.documentParser = new StreamingDocumentParser();
    this.reasoningEngine = new ChainOfThoughtEngine();
    this.analystAgent = new AnalystAgent('analyst-001', this.reasoningEngine);
    this.architectAgent = new ArchitectAgent('architect-001', this.reasoningEngine);
    this.coderAgent = new CoderAgent('coder-001', this.reasoningEngine);
    
    console.log('🎯 Pipeline Orchestrator initialized');
  }

  /**
   * Process a document through the complete pipeline
   */
  async processDocument(jobId) {
    console.log(`🚀 Starting document processing for job ${jobId}`);
    
    try {
      const job = await this.jobQueue.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update job status
      await this.updateJobProgress(jobId, 'processing', 0, 'Starting document processing');

      // Stage 1: Parse the document
      const parseResult = await this.parseDocument(job);
      await this.updateJobProgress(jobId, 'processing', 20, 'Document parsed successfully');

      // Stage 2: Analyze with AI
      const analysisResult = await this.analyzeDocument(parseResult, job);
      await this.updateJobProgress(jobId, 'processing', 50, 'AI analysis complete');

      // Stage 3: Extract requirements
      const requirements = await this.extractRequirements(analysisResult, job);
      await this.updateJobProgress(jobId, 'processing', 40, 'Requirements extracted');

      // Stage 4: Human approval for requirements (if enabled)
      if (this.approvalManager && job.metadata.humanApproval !== false) {
        const requirementApprovalId = await this.approvalManager.createRequirementApproval(jobId, requirements);
        await this.waitForApproval(requirementApprovalId, requirements);
        await this.updateJobProgress(jobId, 'processing', 50, 'Requirements approved');
      }

      // Stage 5: Design architecture
      const architecture = await this.designArchitecture(requirements, job);
      await this.updateJobProgress(jobId, 'processing', 60, 'Architecture designed');

      // Stage 6: Human approval for architecture (if enabled)
      if (this.approvalManager && job.metadata.humanApproval !== false) {
        const architectureApprovalId = await this.approvalManager.createArchitectureApproval(jobId, architecture);
        await this.waitForApproval(architectureApprovalId, architecture);
        await this.updateJobProgress(jobId, 'processing', 70, 'Architecture approved');
      }

      // Stage 7: Generate code if requested
      let generatedContent = null;
      if (job.metadata.generateCode) {
        generatedContent = await this.generateCode(architecture, requirements, job);
        await this.updateJobProgress(jobId, 'processing', 85, 'Code generated');

        // Stage 8: Human approval for code (if enabled)
        if (this.approvalManager && job.metadata.humanApproval !== false) {
          const codeApprovalId = await this.approvalManager.createCodeReviewApproval(jobId, generatedContent);
          await this.waitForApproval(codeApprovalId, generatedContent);
          await this.updateJobProgress(jobId, 'processing', 90, 'Code approved');
        }
      }

      // Stage 9: Package final results
      const finalResult = await this.packageResults({
        parseResult,
        analysisResult,
        requirements,
        architecture,
        generatedContent,
        job
      });

      // Complete the job
      await this.jobQueue.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Completed successfully',
        results: finalResult,
        completedAt: new Date().toISOString(),
        processingTime: Date.now() - new Date(job.uploadedAt).getTime()
      });

      // Notify via WebSocket
      this.wsManager.emit(jobId, 'processing:completed', {
        jobId,
        results: finalResult,
        processingTime: Date.now() - new Date(job.uploadedAt).getTime()
      });

      console.log(`✅ Document processing completed for job ${jobId}`);
      return finalResult;

    } catch (error) {
      console.error(`❌ Document processing failed for job ${jobId}:`, error);
      
      await this.jobQueue.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      });

      this.wsManager.emit(jobId, 'processing:failed', {
        jobId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Parse the uploaded document
   */
  async parseDocument(job) {
    console.log(`📄 Parsing document: ${job.fileName}`);
    
    this.wsManager.emit(job.id, 'parsing:started', {
      fileName: job.fileName,
      fileSize: job.fileSize
    });

    try {
      // Read the file
      const fileContent = await fs.readFile(job.filePath);
      
      // Detect file type and parse
      const parseResult = await this.documentParser.parse({
        content: fileContent,
        filename: job.fileName,
        mimeType: this.getMimeType(job.fileName),
        options: {
          enableStreaming: job.fileSize > 10 * 1024 * 1024, // 10MB
          chunkSize: 1024 * 1024, // 1MB chunks
          onProgress: (progress) => {
            this.wsManager.emit(job.id, 'parsing:progress', {
              progress: Math.round(progress * 100),
              stage: 'parsing'
            });
          }
        }
      });

      this.wsManager.emit(job.id, 'parsing:completed', {
        documentType: parseResult.type,
        contentLength: parseResult.content.length,
        sectionsFound: parseResult.sections?.length || 0
      });

      return parseResult;

    } catch (error) {
      this.wsManager.emit(job.id, 'parsing:failed', {
        error: error.message
      });
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  /**
   * Analyze document with AI
   */
  async analyzeDocument(parseResult, job) {
    console.log(`🤖 Analyzing document with AI`);

    this.wsManager.emit(job.id, 'analysis:started', {
      documentType: parseResult.type,
      contentLength: parseResult.content.length
    });

    try {
      // Use the reasoning engine for analysis
      const analysisSession = await this.reasoningEngine.startReasoningSession({
        type: 'document_analysis',
        context: {
          documentType: parseResult.type,
          filename: job.fileName,
          metadata: parseResult.metadata
        }
      });

      // Progress through analysis steps
      const steps = [
        'identify_document_type',
        'extract_key_information', 
        'determine_intent',
        'identify_requirements',
        'assess_complexity',
        'recommend_approach'
      ];

      let stepProgress = 0;
      const analysisResult = {
        documentType: parseResult.type,
        intent: null,
        keyInformation: {},
        complexity: 'moderate',
        recommendations: [],
        confidence: 0.8
      };

      for (const step of steps) {
        this.wsManager.emit(job.id, 'analysis:progress', {
          progress: Math.round((stepProgress / steps.length) * 100),
          currentStep: step.replace('_', ' '),
          stage: 'analysis'
        });

        const stepResult = await this.reasoningEngine.processThought(
          analysisSession.id,
          step,
          parseResult.content.substring(0, 5000) // First 5k chars for analysis
        );

        // Extract information based on step
        switch (step) {
          case 'identify_document_type':
            analysisResult.documentType = stepResult.content;
            break;
          case 'determine_intent':
            analysisResult.intent = stepResult.content;
            break;
          case 'extract_key_information':
            analysisResult.keyInformation = this.parseKeyInformation(stepResult.content);
            break;
          case 'assess_complexity':
            analysisResult.complexity = this.parseComplexity(stepResult.content);
            break;
          case 'recommend_approach':
            analysisResult.recommendations = this.parseRecommendations(stepResult.content);
            break;
        }

        stepProgress++;
      }

      await this.reasoningEngine.completeSession(analysisSession.id);

      this.wsManager.emit(job.id, 'analysis:completed', {
        intent: analysisResult.intent,
        complexity: analysisResult.complexity,
        confidence: analysisResult.confidence
      });

      return analysisResult;

    } catch (error) {
      this.wsManager.emit(job.id, 'analysis:failed', {
        error: error.message
      });
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }

  /**
   * Extract requirements using the Analyst Agent
   */
  async extractRequirements(analysisResult, job) {
    console.log(`📋 Extracting requirements with Analyst Agent`);

    this.wsManager.emit(job.id, 'extraction:started', {
      intent: analysisResult.intent,
      complexity: analysisResult.complexity
    });

    try {
      // Use the Analyst Agent to extract structured requirements
      const requirements = await this.analystAgent.analyzeDocument({
        content: analysisResult.keyInformation,
        type: analysisResult.documentType,
        intent: analysisResult.intent
      }, {
        onProgress: (progress) => {
          this.wsManager.emit(job.id, 'extraction:progress', {
            progress: Math.round(progress * 100),
            stage: 'extraction'
          });
        }
      });

      this.wsManager.emit(job.id, 'extraction:completed', {
        featuresFound: requirements.requirements.features?.length || 0,
        userStoriesFound: requirements.requirements.userStories?.length || 0,
        technicalReqs: requirements.requirements.technicalRequirements?.length || 0
      });

      return requirements.requirements;

    } catch (error) {
      this.wsManager.emit(job.id, 'extraction:failed', {
        error: error.message
      });
      throw new Error(`Failed to extract requirements: ${error.message}`);
    }
  }

  /**
   * Design system architecture using the Architect Agent
   */
  async designArchitecture(requirements, job) {
    console.log(`🏗️ Designing architecture with Architect Agent`);

    this.wsManager.emit(job.id, 'architecture:started', {
      requirements: requirements.features?.length || 0
    });

    try {
      const architecture = await this.architectAgent.designArchitecture(requirements, {
        targetPlatform: job.metadata.deploymentTarget || 'web',
        onProgress: (progress) => {
          this.wsManager.emit(job.id, 'architecture:progress', {
            progress: Math.round(progress * 100),
            stage: 'architecture'
          });
        }
      });

      this.wsManager.emit(job.id, 'architecture:completed', {
        architectureType: architecture.architecture.type,
        componentsDesigned: architecture.architecture.components?.length || 0,
        confidence: architecture.confidence
      });

      return architecture.architecture;

    } catch (error) {
      this.wsManager.emit(job.id, 'architecture:failed', {
        error: error.message
      });
      throw new Error(`Failed to design architecture: ${error.message}`);
    }
  }

  /**
   * Generate code using the Coder Agent
   */
  async generateCode(architecture, requirements, job) {
    console.log(`💻 Generating code with Coder Agent`);

    this.wsManager.emit(job.id, 'generation:started', {
      architecture: architecture.type,
      features: requirements.features?.length || 0
    });

    try {
      const codeResult = await this.coderAgent.generateCode(architecture, requirements, {
        language: job.metadata.language || 'typescript',
        framework: job.metadata.framework || 'react',
        onProgress: (progress) => {
          this.wsManager.emit(job.id, 'generation:progress', {
            progress: Math.round(progress * 100),
            stage: 'generation'
          });
        }
      });

      // Create output directory and files
      const outputDir = path.join(__dirname, 'generated', job.id);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write generated files
      for (const [filename, content] of Object.entries(codeResult.files)) {
        const filePath = path.join(outputDir, filename);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
      }

      // Create deployment package
      const zipPath = path.join(outputDir, `${job.id}-generated.zip`);
      // TODO: Actually create zip file (implement archiving)
      
      this.wsManager.emit(job.id, 'generation:completed', {
        filesGenerated: Object.keys(codeResult.files).length,
        framework: architecture.technology?.frontend || 'unknown',
        outputPath: zipPath
      });

      return {
        ...codeResult,
        outputPath: zipPath,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.wsManager.emit(job.id, 'generation:failed', {
        error: error.message
      });
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  /**
   * Generate content/code from requirements (legacy method)
   */
  async generateContent(requirements, job) {
    console.log(`⚡ Generating content from requirements`);

    this.wsManager.emit(job.id, 'generation:started', {
      features: requirements.features?.length || 0,
      targetType: job.metadata.deploymentTarget
    });

    try {
      // For now, generate a basic project structure
      // In the future, this will use specialized Coder agents
      
      const projectStructure = {
        type: 'web_application',
        framework: this.selectFramework(requirements),
        files: await this.generateProjectFiles(requirements, job.metadata),
        deployment: {
          target: job.metadata.deploymentTarget,
          config: this.generateDeploymentConfig(job.metadata.deploymentTarget)
        }
      };

      // Create output directory and files
      const outputDir = path.join(__dirname, 'generated', job.id);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write generated files
      for (const [filename, content] of Object.entries(projectStructure.files)) {
        const filePath = path.join(outputDir, filename);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
      }

      // Create deployment package
      const zipPath = path.join(outputDir, `${job.id}-generated.zip`);
      // TODO: Actually create zip file (implement archiving)
      
      this.wsManager.emit(job.id, 'generation:completed', {
        filesGenerated: Object.keys(projectStructure.files).length,
        framework: projectStructure.framework,
        outputPath: zipPath
      });

      return {
        ...projectStructure,
        outputPath: zipPath,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.wsManager.emit(job.id, 'generation:failed', {
        error: error.message
      });
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Package final results
   */
  async packageResults({ parseResult, analysisResult, requirements, architecture, generatedContent, job }) {
    return {
      document: {
        fileName: job.fileName,
        type: parseResult.type,
        contentLength: parseResult.content.length,
        sectionsFound: parseResult.sections?.length || 0
      },
      analysis: {
        intent: analysisResult.intent,
        complexity: analysisResult.complexity,
        confidence: analysisResult.confidence,
        recommendations: analysisResult.recommendations
      },
      requirements: {
        features: requirements.features?.length || 0,
        userStories: requirements.userStories?.length || 0,
        technicalRequirements: requirements.technicalRequirements?.length || 0,
        businessRules: requirements.businessRules?.length || 0,
        constraints: requirements.constraints?.length || 0,
        details: requirements
      },
      architecture: architecture ? {
        type: architecture.type,
        components: architecture.components?.length || 0,
        technology: architecture.technology,
        database: architecture.database,
        api: architecture.api,
        deployment: architecture.deployment,
        details: architecture
      } : null,
      generated: generatedContent ? {
        framework: generatedContent.framework,
        filesGenerated: Object.keys(generatedContent.files || {}).length,
        deploymentTarget: generatedContent.deployment?.target,
        outputPath: generatedContent.outputPath
      } : null,
      metadata: {
        processedAt: new Date().toISOString(),
        processingTime: Date.now() - new Date(job.uploadedAt).getTime(),
        qualityScore: this.calculateQualityScore(analysisResult, requirements)
      }
    };
  }

  /**
   * Generate code from requirements (for direct code generation API)
   */
  async generateCode(jobId, requirements, options = {}) {
    console.log(`💻 Generating code for job ${jobId}`);

    try {
      await this.updateJobProgress(jobId, 'processing', 0, 'Starting code generation');

      // Use the same generation logic but focused on code
      const generatedContent = await this.generateContent(requirements, {
        id: jobId,
        metadata: {
          generateCode: true,
          deploymentTarget: options.deploymentTarget || 'docker',
          ...options
        }
      });

      await this.updateJobProgress(jobId, 'processing', 100, 'Code generation complete');

      // Update job with results
      await this.jobQueue.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        results: generatedContent,
        outputPath: generatedContent.outputPath,
        filesGenerated: Object.keys(generatedContent.files || {}).length,
        completedAt: new Date().toISOString()
      });

      return generatedContent;

    } catch (error) {
      console.error(`❌ Code generation failed for job ${jobId}:`, error);
      
      await this.jobQueue.updateJob(jobId, {
        status: 'failed',
        error: error.message
      });

      throw error;
    }
  }

  // Helper methods

  async updateJobProgress(jobId, status, progress, step) {
    await this.jobQueue.updateJob(jobId, {
      status,
      progress,
      currentStep: step,
      updatedAt: new Date().toISOString()
    });

    this.wsManager.emit(jobId, 'processing:progress', {
      jobId,
      progress,
      step,
      timestamp: new Date().toISOString()
    });
  }

  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.log': 'text/plain',
      '.zip': 'application/zip'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  parseKeyInformation(content) {
    // Simple parsing - in production, this would be more sophisticated
    try {
      return JSON.parse(content);
    } catch {
      return { summary: content };
    }
  }

  parseComplexity(content) {
    const complexityKeywords = {
      simple: ['basic', 'simple', 'straightforward', 'minimal'],
      moderate: ['moderate', 'standard', 'typical', 'common'],
      complex: ['complex', 'advanced', 'sophisticated', 'enterprise']
    };

    const contentLower = content.toLowerCase();
    
    for (const [level, keywords] of Object.entries(complexityKeywords)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return level;
      }
    }
    
    return 'moderate';
  }

  parseRecommendations(content) {
    // Extract recommendations from content
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => line.trim()).slice(0, 5); // Top 5 recommendations
  }

  selectFramework(requirements) {
    // Smart framework selection based on requirements
    const techReqs = requirements.technicalRequirements || [];
    
    // Check for specific framework mentions
    for (const req of techReqs) {
      const desc = req.description.toLowerCase();
      if (desc.includes('react')) return 'react';
      if (desc.includes('vue')) return 'vue';
      if (desc.includes('angular')) return 'angular';
      if (desc.includes('express')) return 'express';
      if (desc.includes('fastapi')) return 'fastapi';
    }

    // Default to React + Express for web applications
    return 'react-express';
  }

  async generateProjectFiles(requirements, metadata) {
    // Generate basic project structure
    const files = {};

    // Package.json
    files['package.json'] = JSON.stringify({
      name: 'generated-mvp',
      version: '1.0.0',
      description: 'Generated MVP from requirements',
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js'
      },
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.5'
      }
    }, null, 2);

    // Basic server
    files['server.js'] = `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Generated MVP Server', version: '1.0.0' });
});

// TODO: Implement features based on requirements
${this.generateFeatureComments(requirements)}

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;

    // README
    files['README.md'] = this.generateReadme(requirements, metadata);

    // Docker configuration if requested
    if (metadata.deploymentTarget === 'docker') {
      files['Dockerfile'] = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;

      files['docker-compose.yml'] = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production`;
    }

    return files;
  }

  generateFeatureComments(requirements) {
    const features = requirements.features || [];
    return features.map(feature => 
      `// TODO: Implement ${feature.name} - ${feature.description}`
    ).join('\n');
  }

  generateReadme(requirements, metadata) {
    return `# Generated MVP

This project was automatically generated from your requirements.

## Features

${(requirements.features || []).map(f => `- ${f.name}: ${f.description}`).join('\n')}

## User Stories

${(requirements.userStories || []).map(s => `- As a ${s.asA}, I want ${s.iWant} so that ${s.soThat}`).join('\n')}

## Technical Requirements

${(requirements.technicalRequirements || []).map(r => `- ${r.description}`).join('\n')}

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development server: \`npm run dev\`
3. Visit http://localhost:3000

## Deployment

Target: ${metadata.deploymentTarget}

${metadata.deploymentTarget === 'docker' ? '```bash\ndocker-compose up -d\n```' : ''}

## Next Steps

This is a basic MVP structure. Continue development by:
1. Implementing the TODO items in server.js
2. Adding database integration
3. Creating frontend components
4. Adding authentication
5. Writing tests

Generated on: ${new Date().toISOString()}
`;
  }

  generateDeploymentConfig(target) {
    const configs = {
      docker: {
        dockerfile: true,
        compose: true
      },
      vercel: {
        'vercel.json': {
          version: 2,
          builds: [{ src: 'server.js', use: '@vercel/node' }]
        }
      },
      railway: {
        'railway.toml': {
          build: { command: 'npm install' },
          deploy: { command: 'npm start' }
        }
      }
    };

    return configs[target] || configs.docker;
  }

  calculateQualityScore(analysisResult, requirements) {
    let score = 60; // Base score

    // Add points for completeness
    if (requirements.features?.length > 0) score += 10;
    if (requirements.userStories?.length > 0) score += 10;
    if (requirements.technicalRequirements?.length > 0) score += 10;
    if (requirements.businessRules?.length > 0) score += 5;
    if (requirements.constraints?.length > 0) score += 5;

    // Adjust for confidence
    score = Math.round(score * (analysisResult.confidence || 0.8));

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Wait for human approval
   */
  async waitForApproval(approvalId, data) {
    if (!this.approvalManager) {
      return data; // No approval manager, continue
    }

    return new Promise((resolve, reject) => {
      const checkApproval = async () => {
        try {
          const approval = await this.approvalManager.getApproval(approvalId);
          
          if (!approval) {
            reject(new Error(`Approval ${approvalId} not found`));
            return;
          }

          if (approval.status === 'approve') {
            resolve(data);
          } else if (approval.status === 'modify') {
            // Apply modifications if provided
            const modifiedData = this.applyModifications(data, approval.response.modifications);
            resolve(modifiedData);
          } else if (approval.status === 'reject') {
            reject(new Error(`Human rejected: ${approval.response.comment || 'No reason provided'}`));
          } else if (approval.status === 'timeout') {
            reject(new Error('Human approval timeout'));
          } else if (approval.status === 'cancelled') {
            reject(new Error(`Approval cancelled: ${approval.cancelReason}`));
          } else {
            // Still pending, check again in 1 second
            setTimeout(checkApproval, 1000);
          }
        } catch (error) {
          reject(error);
        }
      };

      checkApproval();
    });
  }

  /**
   * Apply human modifications to data
   */
  applyModifications(data, modifications) {
    if (!modifications || Object.keys(modifications).length === 0) {
      return data;
    }

    const modifiedData = JSON.parse(JSON.stringify(data)); // Deep clone

    // Apply modifications based on type
    if (modifications.features) {
      modifiedData.features = modifications.features;
    }
    if (modifications.userStories) {
      modifiedData.userStories = modifications.userStories;
    }
    if (modifications.technology) {
      modifiedData.technology = { ...modifiedData.technology, ...modifications.technology };
    }
    if (modifications.architecture) {
      modifiedData.type = modifications.architecture.type || modifiedData.type;
    }

    console.log(`🔄 Applied human modifications to data`);
    return modifiedData;
  }
}

module.exports = PipelineOrchestrator;
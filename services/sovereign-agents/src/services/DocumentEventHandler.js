/**
 * Document Event Handler - Handles document-related events from Document Generator
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class DocumentEventHandler extends EventEmitter {
  constructor(eventRouter, actionRegistry, options = {}) {
    super();
    this.eventRouter = eventRouter;
    this.actionRegistry = actionRegistry;
    this.options = {
      enableAutoProcessing: options.enableAutoProcessing !== false,
      requireApprovalForLargeFiles: options.requireApprovalForLargeFiles !== false,
      largeFileThreshold: options.largeFileThreshold || 10 * 1024 * 1024, // 10MB
      ...options
    };

    this.activeProcesses = new Map();
    this.setupEventRoutes();
  }

  /**
   * Setup event routes for document processing
   */
  setupEventRoutes() {
    // Document upload events
    this.eventRouter.addRoute('document.uploaded', async (event) => {
      await this.handleDocumentUploaded(event);
    }, { priority: 'high' });

    // Document parsing events
    this.eventRouter.addRoute('document.parsing.started', async (event) => {
      await this.handleDocumentParsingStarted(event);
    });

    this.eventRouter.addRoute('document.parsing.completed', async (event) => {
      await this.handleDocumentParsingCompleted(event);
    }, { priority: 'high' });

    // Template matching events
    this.eventRouter.addRoute('template.matching.started', async (event) => {
      await this.handleTemplateMatchingStarted(event);
    });

    this.eventRouter.addRoute('template.selected', async (event) => {
      await this.handleTemplateSelected(event);
    }, { priority: 'high' });

    // Code generation events
    this.eventRouter.addRoute('code.generation.started', async (event) => {
      await this.handleCodeGenerationStarted(event);
    });

    this.eventRouter.addRoute('code.generation.completed', async (event) => {
      await this.handleCodeGenerationCompleted(event);
    }, { priority: 'high' });

    console.log('✅ Document event routes registered');
  }

  /**
   * Handle document uploaded event
   */
  async handleDocumentUploaded(event) {
    const { documentId, filename, size, format, uploadedBy } = event.data;
    
    console.log(`📄 Document uploaded: ${filename} (${this.formatFileSize(size)})`);

    // Create processing context
    const processId = uuidv4();
    const process = {
      id: processId,
      documentId,
      filename,
      size,
      format,
      uploadedBy,
      startTime: new Date(),
      status: 'analyzing',
      steps: [],
      currentStep: null
    };

    this.activeProcesses.set(documentId, process);

    try {
      // Check if approval is required for large files
      const requiresApproval = this.options.requireApprovalForLargeFiles && 
                               size > this.options.largeFileThreshold;

      if (requiresApproval) {
        await this.requestHumanApproval(processId, {
          action: 'process_large_document',
          reason: `Large file uploaded (${this.formatFileSize(size)}). Processing may take significant resources.`,
          documentInfo: { filename, size, format },
          agentId: 'document-handler',
          urgency: 'normal'
        });
      } else {
        // Auto-process if enabled
        if (this.options.enableAutoProcessing) {
          await this.startDocumentAnalysis(processId);
        }
      }

      // Emit processing started event
      this.emit('document:processing:started', {
        processId,
        documentId,
        filename,
        requiresApproval
      });

    } catch (error) {
      console.error(`❌ Failed to handle document upload for ${filename}:`, error);
      process.status = 'failed';
      process.error = error.message;
      
      await this.publishEvent('system.error', {
        errorType: 'document_processing_failed',
        errorMessage: error.message,
        context: { documentId, filename, processId },
        severity: 'medium'
      });
    }
  }

  /**
   * Start document analysis
   */
  async startDocumentAnalysis(processId) {
    const process = this.activeProcesses.get(processId);
    if (!process) return;

    console.log(`🔍 Starting analysis for: ${process.filename}`);
    
    // Update process status
    process.currentStep = 'analyzing';
    process.steps.push({
      step: 'analysis_started',
      timestamp: new Date(),
      status: 'in_progress'
    });

    try {
      // Execute document analysis action
      const analysisResult = await this.actionRegistry.executeAction('parseDocument', {
        documentId: process.documentId,
        filename: process.filename,
        format: process.format
      }, {
        executedBy: 'document-handler',
        correlationId: process.id
      });

      // Update process with analysis results
      process.analysisResult = analysisResult.result;
      process.steps[process.steps.length - 1].status = 'completed';
      process.steps[process.steps.length - 1].result = analysisResult.result;

      console.log(`✅ Analysis completed for: ${process.filename}`);

      // Determine next steps based on analysis
      await this.determineNextSteps(processId);

    } catch (error) {
      console.error(`❌ Document analysis failed for ${process.filename}:`, error);
      
      process.status = 'failed';
      process.error = error.message;
      process.steps[process.steps.length - 1].status = 'failed';
      process.steps[process.steps.length - 1].error = error.message;

      await this.publishEvent('system.error', {
        errorType: 'document_analysis_failed',
        errorMessage: error.message,
        context: { processId, documentId: process.documentId },
        severity: 'medium'
      });
    }
  }

  /**
   * Determine next processing steps based on analysis
   */
  async determineNextSteps(processId) {
    const process = this.activeProcesses.get(processId);
    if (!process || !process.analysisResult) return;

    const analysis = process.analysisResult;
    
    console.log(`🤔 Determining next steps for: ${process.filename}`);

    // Publish document parsing completed event
    await this.publishEvent('document.parsing.completed', {
      documentId: process.documentId,
      filename: process.filename,
      wordCount: analysis.wordCount || 0,
      extractedContent: analysis.content,
      insights: analysis.insights || [],
      processingTime: Date.now() - process.startTime.getTime()
    });

    // Check if template matching should start
    if (analysis.format && analysis.content) {
      await this.startTemplateMatching(processId);
    }
  }

  /**
   * Start template matching process
   */
  async startTemplateMatching(processId) {
    const process = this.activeProcesses.get(processId);
    if (!process) return;

    console.log(`🎯 Starting template matching for: ${process.filename}`);

    process.currentStep = 'template_matching';
    process.steps.push({
      step: 'template_matching_started',
      timestamp: new Date(),
      status: 'in_progress'
    });

    try {
      // Publish template matching started event
      await this.publishEvent('template.matching.started', {
        documentId: process.documentId,
        availableTemplates: ['business-plan', 'technical-spec', 'mvp-scaffold'],
        criteria: {
          wordCount: process.analysisResult.wordCount,
          format: process.format,
          contentType: process.analysisResult.contentType
        }
      });

      // Execute template matching action (would be implemented)
      // For now, simulate template selection
      const selectedTemplate = this.selectTemplate(process.analysisResult);
      
      process.selectedTemplate = selectedTemplate;
      process.steps[process.steps.length - 1].status = 'completed';
      process.steps[process.steps.length - 1].result = selectedTemplate;

      console.log(`✅ Template selected for ${process.filename}: ${selectedTemplate.name}`);

      // Publish template selected event
      await this.publishEvent('template.selected', {
        documentId: process.documentId,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        matchScore: selectedTemplate.matchScore,
        reasons: selectedTemplate.reasons
      });

      // Start code generation if template is ready
      if (selectedTemplate.readyForGeneration) {
        await this.startCodeGeneration(processId);
      }

    } catch (error) {
      console.error(`❌ Template matching failed for ${process.filename}:`, error);
      
      process.steps[process.steps.length - 1].status = 'failed';
      process.steps[process.steps.length - 1].error = error.message;
    }
  }

  /**
   * Start code generation process
   */
  async startCodeGeneration(processId) {
    const process = this.activeProcesses.get(processId);
    if (!process || !process.selectedTemplate) return;

    console.log(`💻 Starting code generation for: ${process.filename}`);

    process.currentStep = 'code_generation';
    process.steps.push({
      step: 'code_generation_started',
      timestamp: new Date(),
      status: 'in_progress'
    });

    try {
      // Publish code generation started event
      await this.publishEvent('code.generation.started', {
        documentId: process.documentId,
        templateId: process.selectedTemplate.id,
        targetLanguage: process.selectedTemplate.language || 'javascript',
        features: process.selectedTemplate.features || []
      });

      // Execute code generation action (would integrate with actual generation)
      const generationResult = await this.simulateCodeGeneration(process);

      process.generationResult = generationResult;
      process.steps[process.steps.length - 1].status = 'completed';
      process.steps[process.steps.length - 1].result = generationResult;

      console.log(`✅ Code generation completed for: ${process.filename}`);

      // Publish code generation completed event
      await this.publishEvent('code.generation.completed', {
        documentId: process.documentId,
        generatedFiles: generationResult.filesGenerated,
        linesOfCode: generationResult.linesOfCode,
        technologies: generationResult.technologies,
        generationTime: Date.now() - process.startTime.getTime(),
        deploymentReady: generationResult.deploymentReady
      });

      // Mark process as completed
      process.status = 'completed';
      process.endTime = new Date();

      this.emit('document:processing:completed', {
        processId,
        documentId: process.documentId,
        result: generationResult
      });

    } catch (error) {
      console.error(`❌ Code generation failed for ${process.filename}:`, error);
      
      process.steps[process.steps.length - 1].status = 'failed';
      process.steps[process.steps.length - 1].error = error.message;
    }
  }

  /**
   * Handle document parsing events (from external parsers)
   */
  async handleDocumentParsingStarted(event) {
    const { documentId, parser } = event.data;
    console.log(`🔄 External parsing started for document ${documentId} using ${parser}`);
  }

  async handleDocumentParsingCompleted(event) {
    const { documentId, extractedContent } = event.data;
    console.log(`✅ External parsing completed for document ${documentId}`);
    
    // Update process if we're tracking it
    const process = Array.from(this.activeProcesses.values())
      .find(p => p.documentId === documentId);
    
    if (process && !process.analysisResult) {
      process.analysisResult = extractedContent;
      await this.determineNextSteps(process.id);
    }
  }

  /**
   * Handle template events
   */
  async handleTemplateMatchingStarted(event) {
    console.log(`🎯 Template matching started for document ${event.data.documentId}`);
  }

  async handleTemplateSelected(event) {
    const { documentId, templateId } = event.data;
    console.log(`✅ Template selected for document ${documentId}: ${templateId}`);
  }

  /**
   * Handle code generation events
   */
  async handleCodeGenerationStarted(event) {
    console.log(`💻 Code generation started for document ${event.data.documentId}`);
  }

  async handleCodeGenerationCompleted(event) {
    const { documentId, deploymentReady } = event.data;
    console.log(`✅ Code generation completed for document ${documentId}, deployment ready: ${deploymentReady}`);
  }

  /**
   * Request human approval for processing
   */
  async requestHumanApproval(processId, approvalData) {
    const requestId = uuidv4();
    
    await this.publishEvent('human.approval.requested', {
      requestId,
      processId,
      ...approvalData
    });

    console.log(`👤 Human approval requested for process ${processId}`);
  }

  /**
   * Select appropriate template based on analysis
   */
  selectTemplate(analysis) {
    // Simple template selection logic (would be more sophisticated in reality)
    const templates = [
      {
        id: 'business-plan-mvp',
        name: 'Business Plan MVP',
        language: 'javascript',
        matchScore: 0.85,
        readyForGeneration: true,
        features: ['user-auth', 'dashboard', 'api'],
        reasons: ['Contains business requirements', 'Market analysis present']
      },
      {
        id: 'technical-spec-app',
        name: 'Technical Specification App',
        language: 'typescript',
        matchScore: 0.75,
        readyForGeneration: true,
        features: ['api', 'database', 'testing'],
        reasons: ['Technical requirements identified', 'API specifications found']
      }
    ];

    // Return template with highest match score
    return templates.sort((a, b) => b.matchScore - a.matchScore)[0];
  }

  /**
   * Simulate code generation (placeholder)
   */
  async simulateCodeGeneration(process) {
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      filesGenerated: 25,
      linesOfCode: 1250,
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
      deploymentReady: true,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Publish event through router
   */
  async publishEvent(eventType, data) {
    try {
      await this.eventRouter.publish(eventType, data, {
        source: 'document-handler'
      });
    } catch (error) {
      console.error(`Failed to publish event ${eventType}:`, error);
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get active processes
   */
  getActiveProcesses() {
    return Array.from(this.activeProcesses.values());
  }

  /**
   * Get process by ID
   */
  getProcess(processId) {
    return Array.from(this.activeProcesses.values()).find(p => p.id === processId);
  }

  /**
   * Get process by document ID
   */
  getProcessByDocumentId(documentId) {
    return this.activeProcesses.get(documentId);
  }

  /**
   * Cleanup completed processes
   */
  cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    let cleaned = 0;

    for (const [documentId, process] of this.activeProcesses) {
      if (process.endTime && process.endTime < cutoff) {
        this.activeProcesses.delete(documentId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old document processes`);
    }
  }
}

module.exports = DocumentEventHandler;
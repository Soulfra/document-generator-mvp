import { ollama } from './ollama';
import { claude } from './claude';
import { logger } from '../utils/logger';
import { ContextProfile } from '../types/context-profile';
import fetch from 'node-fetch';

export interface PrivacyScanResult {
  issuesFound: number;
  maxSeverity: 'low' | 'medium' | 'high' | 'critical';
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  canProceed: {
    approved: boolean;
    reason: string;
    requiresReview: boolean;
    blockingIssues: number;
  };
  riskScore: number;
  complianceStatus: {
    gdpr: { compliant: boolean; violations: any[] };
    ccpa: { compliant: boolean; violations: any[] };
    hipaa: { compliant: boolean; violations: any[] };
  };
  sanitizationSuggestions?: Array<{
    issue: string;
    suggestion: string;
    confidence: number;
  }>;
  contentHash: string;
  processingTime: number;
}

export interface LLMTask {
  type: 'analyze' | 'cleanup' | 'structure' | 'generate' | 'document_parse' | 'template_process';
  input: any;
  options?: {
    preferLocal?: boolean;
    maxCost?: number;
    minConfidence?: number;
    profile?: ContextProfile;
    // Privacy options
    skipPrivacyCheck?: boolean;
    privacyApproved?: boolean;
    userId?: string;
    sessionId?: string;
    sensitivityLevel?: 'low' | 'medium' | 'high' | 'strict';
  };
}

export interface LLMResult {
  success: boolean;
  data: any;
  provider: 'ollama' | 'claude' | 'openai';
  confidence: number;
  cost: number;
  duration: number;
  // Privacy information
  privacyScan?: PrivacyScanResult;
  privacyProtected: boolean;
  sanitized: boolean;
}

export class PrivacyAwareLLMRouter {
  private ollamaAvailable: boolean = false;
  private privacyScannerUrl: string;

  constructor() {
    this.privacyScannerUrl = process.env.PRIVACY_SCANNER_URL || 'http://privacy-scanner:3004';
  }

  async initialize() {
    // Check Ollama availability
    this.ollamaAvailable = await ollama.isAvailable();
    
    // Check privacy scanner availability
    const privacyScannerAvailable = await this.checkPrivacyScanner();
    
    logger.info('Privacy-Aware LLM Router initialized', { 
      ollamaAvailable: this.ollamaAvailable,
      claudeAvailable: !!process.env.ANTHROPIC_API_KEY,
      privacyScannerAvailable,
      privacyScannerUrl: this.privacyScannerUrl
    });
  }

  async checkPrivacyScanner(): Promise<boolean> {
    try {
      const response = await fetch(`${this.privacyScannerUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      logger.warn('Privacy scanner not available', { error: error.message });
      return false;
    }
  }

  async route(task: LLMTask): Promise<LLMResult> {
    const startTime = Date.now();
    const { 
      preferLocal = true, 
      maxCost = 0.5, 
      minConfidence = 0.7,
      skipPrivacyCheck = false,
      privacyApproved = false,
      userId,
      sessionId,
      sensitivityLevel = 'high'
    } = task.options || {};

    let privacyScan: PrivacyScanResult | undefined;
    let processingSafeContent = task.input;
    let sanitized = false;

    // Step 1: Privacy Scanning (unless explicitly skipped)
    if (!skipPrivacyCheck) {
      try {
        privacyScan = await this.scanForPrivacyIssues(task.input, {
          userId,
          sessionId,
          taskType: task.type,
          sensitivityLevel
        });

        logger.info('Privacy scan completed', {
          userId,
          sessionId,
          taskType: task.type,
          issuesFound: privacyScan.issuesFound,
          riskScore: privacyScan.riskScore,
          canProceed: privacyScan.canProceed.approved
        });

        // Step 2: Privacy Decision Making
        if (!privacyScan.canProceed.approved) {
          // Critical issues found - determine action based on severity
          if (privacyScan.maxSeverity === 'critical') {
            throw new Error(`Critical privacy issues detected. Processing blocked. ${privacyScan.canProceed.reason}`);
          }

          // High issues - check if user has approved processing
          if (privacyScan.maxSeverity === 'high' && !privacyApproved) {
            return {
              success: false,
              data: {
                error: 'Privacy review required',
                privacyScan,
                requiresApproval: true
              },
              provider: 'privacy-scanner',
              confidence: 0,
              cost: 0,
              duration: Date.now() - startTime,
              privacyScan,
              privacyProtected: true,
              sanitized: false
            };
          }
        }

        // Step 3: Automatic Sanitization for Medium/Low Issues
        if (privacyScan.issuesFound > 0 && privacyScan.maxSeverity !== 'critical') {
          const sanitizationResult = await this.sanitizeContent(task.input, {
            userId,
            sessionId,
            confidenceThreshold: 0.8
          });

          if (sanitizationResult.applied) {
            processingSafeContent = this.mergeInputWithSanitized(task.input, sanitizationResult.sanitizedContent);
            sanitized = true;
            
            logger.info('Content automatically sanitized', {
              userId,
              sessionId,
              changesApplied: sanitizationResult.changes?.length || 0
            });
          }
        }

        // Step 4: Privacy-Aware Model Selection
        if (privacyScan.riskScore > 50 || privacyScan.maxSeverity === 'high') {
          // High-risk content - prefer local processing
          if (!this.ollamaAvailable) {
            logger.warn('High-risk content detected but local processing unavailable', {
              riskScore: privacyScan.riskScore,
              severity: privacyScan.maxSeverity
            });
          } else {
            logger.info('Routing high-risk content to local processing', {
              riskScore: privacyScan.riskScore
            });
            // Force local processing for sensitive content
            task.options = { ...task.options, preferLocal: true };
          }
        }

      } catch (error) {
        logger.error('Privacy scanning failed', { error: error.message });
        
        // If privacy scanning fails, default to local processing for safety
        if (this.ollamaAvailable) {
          logger.info('Privacy scan failed, defaulting to local processing for safety');
          task.options = { ...task.options, preferLocal: true };
        } else {
          throw new Error('Privacy scanning failed and no secure local processing available');
        }
      }
    }

    // Step 5: Regular LLM Processing with Privacy-Safe Content
    const modifiedTask: LLMTask = {
      ...task,
      input: processingSafeContent
    };

    // Try Ollama first if available and preferred (or forced by privacy)
    if (this.ollamaAvailable && preferLocal) {
      try {
        const result = await this.processWithOllama(modifiedTask);
        
        // Check if result meets confidence threshold
        if (result.confidence >= minConfidence) {
          return {
            ...result,
            duration: Date.now() - startTime,
            privacyScan,
            privacyProtected: !skipPrivacyCheck,
            sanitized
          };
        }
        
        // For sensitive content, don't escalate to cloud if confidence is low
        if (privacyScan && privacyScan.riskScore > 70) {
          logger.warn('Local processing confidence low but content too sensitive for cloud processing');
          return {
            ...result,
            duration: Date.now() - startTime,
            privacyScan,
            privacyProtected: !skipPrivacyCheck,
            sanitized,
            data: {
              ...result.data,
              warning: 'Local processing used due to privacy constraints, confidence may be lower'
            }
          };
        }
        
        logger.info('Local processing result below confidence threshold, escalating', {
          confidence: result.confidence,
          threshold: minConfidence,
        });
      } catch (error) {
        logger.error('Local processing failed, falling back', { error });
      }
    }

    // Fallback to Claude if available and content is safe enough
    if (process.env.ANTHROPIC_API_KEY) {
      // Additional privacy check for cloud processing
      if (privacyScan && (privacyScan.riskScore > 70 || privacyScan.maxSeverity === 'high')) {
        throw new Error('Content too sensitive for cloud processing and local processing unavailable/failed');
      }

      try {
        const result = await this.processWithClaude(modifiedTask);
        
        // Check cost constraint
        if (result.cost > maxCost) {
          throw new Error(`Cost exceeds limit: $${result.cost} > $${maxCost}`);
        }
        
        return {
          ...result,
          duration: Date.now() - startTime,
          privacyScan,
          privacyProtected: !skipPrivacyCheck,
          sanitized
        };
      } catch (error) {
        logger.error('Cloud processing failed', { error });
        throw error;
      }
    }

    throw new Error('No LLM providers available or all attempts failed');
  }

  private async scanForPrivacyIssues(input: any, options: {
    userId?: string;
    sessionId?: string;
    taskType: string;
    sensitivityLevel: string;
  }): Promise<PrivacyScanResult> {
    const content = typeof input === 'string' ? input : JSON.stringify(input);
    
    const response = await fetch(`${this.privacyScannerUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': options.userId || 'anonymous',
        'X-Session-Id': options.sessionId || 'unknown'
      },
      body: JSON.stringify({
        content,
        options: {
          taskType: options.taskType,
          sensitivityLevel: options.sensitivityLevel,
          userId: options.userId,
          sessionId: options.sessionId
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Privacy scanning failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.result;
  }

  private async sanitizeContent(input: any, options: {
    userId?: string;
    sessionId?: string;
    confidenceThreshold?: number;
  }): Promise<{
    sanitizedContent: string;
    applied: boolean;
    changes?: Array<{
      from: string;
      to: string;
      confidence: number;
    }>;
  }> {
    const content = typeof input === 'string' ? input : JSON.stringify(input);
    
    const response = await fetch(`${this.privacyScannerUrl}/api/sanitize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': options.userId || 'anonymous',
        'X-Session-Id': options.sessionId || 'unknown'
      },
      body: JSON.stringify({
        content,
        options: {
          confidenceThreshold: options.confidenceThreshold || 0.8,
          userId: options.userId,
          sessionId: options.sessionId
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Content sanitization failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.result;
  }

  private mergeInputWithSanitized(originalInput: any, sanitizedContent: string): any {
    if (typeof originalInput === 'string') {
      return sanitizedContent;
    }
    
    // For objects, try to replace string fields with sanitized versions
    if (typeof originalInput === 'object' && originalInput !== null) {
      try {
        // Simple strategy: if the input was JSON-serializable, parse the sanitized version
        const sanitizedObject = JSON.parse(sanitizedContent);
        return sanitizedObject;
      } catch {
        // If parsing fails, return original with a sanitized version in a known field
        return {
          ...originalInput,
          sanitizedVersion: sanitizedContent
        };
      }
    }
    
    return originalInput;
  }

  private async processWithOllama(task: LLMTask): Promise<Omit<LLMResult, 'duration' | 'privacyScan' | 'privacyProtected' | 'sanitized'>> {
    let data: any;
    let confidence = 0.8; // Default confidence for Ollama

    switch (task.type) {
      case 'analyze':
        data = await ollama.analyzeCode(task.input.code, task.options?.profile);
        confidence = this.calculateAnalysisConfidence(data);
        break;

      case 'cleanup':
        data = await ollama.cleanupCode(task.input.code, task.input.language, task.options?.profile);
        confidence = this.calculateCleanupConfidence(task.input.code, data);
        break;

      case 'structure':
        data = await ollama.suggestFileStructure(task.input.files);
        confidence = this.calculateStructureConfidence(data);
        break;

      case 'generate':
        data = await ollama.generate(task.input.prompt);
        confidence = 0.7; // Lower confidence for generation tasks
        break;

      case 'document_parse':
        // New task type for document parsing
        data = await ollama.generate(`Analyze and extract key information from this document: ${task.input.content}`);
        confidence = 0.75;
        break;

      case 'template_process':
        // New task type for template processing
        data = await ollama.generate(`Process this content using template matching: ${task.input.content}`);
        confidence = 0.7;
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    return {
      success: true,
      data,
      provider: 'ollama',
      confidence,
      cost: 0, // Ollama is free
    };
  }

  private async processWithClaude(task: LLMTask): Promise<Omit<LLMResult, 'duration' | 'privacyScan' | 'privacyProtected' | 'sanitized'>> {
    let data: any;
    let cost = 0;
    const confidence = 0.95; // High confidence for Claude

    switch (task.type) {
      case 'analyze':
        const analysisResult = await claude.analyzeCode(task.input.code, task.options?.profile);
        data = analysisResult.data;
        cost = analysisResult.cost;
        break;

      case 'cleanup':
        const cleanupResult = await claude.cleanupCode(
          task.input.code, 
          task.input.language,
          task.options?.profile
        );
        data = cleanupResult.data;
        cost = cleanupResult.cost;
        break;

      case 'structure':
        const structureResult = await claude.suggestFileStructure(
          task.input.files
        );
        data = structureResult.data;
        cost = structureResult.cost;
        break;

      case 'generate':
        const generateResult = await claude.generate(task.input.prompt);
        data = generateResult.data;
        cost = generateResult.cost;
        break;

      case 'document_parse':
        const parseResult = await claude.generate(`Analyze and extract key information from this document, focusing on structure, key points, and actionable items: ${task.input.content}`);
        data = parseResult.data;
        cost = parseResult.cost;
        break;

      case 'template_process':
        const templateResult = await claude.generate(`Process this content for template matching and MVP generation. Extract requirements, features, and technical specifications: ${task.input.content}`);
        data = templateResult.data;
        cost = templateResult.cost;
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    return {
      success: true,
      data,
      provider: 'claude',
      confidence,
      cost,
    };
  }

  // Keep existing confidence calculation methods
  private calculateAnalysisConfidence(analysis: any): number {
    const issueCount = analysis.issues?.length || 0;
    const suggestionCount = analysis.suggestions?.length || 0;
    
    if (issueCount === 0 && suggestionCount === 0) {
      return 0.5;
    }
    
    return Math.min(0.9, 0.6 + (issueCount + suggestionCount) * 0.05);
  }

  private calculateCleanupConfidence(original: string, cleaned: string): number {
    if (original === cleaned) {
      return 0.3;
    }
    
    const changeRatio = Math.abs(original.length - cleaned.length) / original.length;
    
    if (changeRatio > 0.5) {
      return 0.5;
    }
    
    return 0.8;
  }

  private calculateStructureConfidence(structure: any): number {
    const folders = Object.keys(structure.structure || {});
    
    if (folders.length === 0) {
      return 0.4;
    }
    
    const goodFolders = ['src/', 'tests/', 'docs/', 'lib/', 'config/'];
    const matchCount = folders.filter(f => 
      goodFolders.some(gf => f.includes(gf))
    ).length;
    
    return Math.min(0.9, 0.6 + matchCount * 0.1);
  }

  async estimateCost(task: LLMTask): Promise<{ 
    ollama: number; 
    claude: number; 
    recommended: 'ollama' | 'claude';
    privacyRecommended: 'ollama' | 'claude';
  }> {
    const estimates = {
      ollama: 0, // Always free
      claude: 0,
      recommended: 'ollama' as 'ollama' | 'claude',
      privacyRecommended: 'ollama' as 'ollama' | 'claude'
    };

    // Estimate based on task type and input size
    const inputSize = JSON.stringify(task.input).length;
    
    // Claude pricing (rough estimates)
    switch (task.type) {
      case 'analyze':
        estimates.claude = inputSize * 0.00001;
        break;
      case 'cleanup':
        estimates.claude = inputSize * 0.000015;
        break;
      case 'structure':
        estimates.claude = 0.01;
        break;
      case 'generate':
      case 'document_parse':
      case 'template_process':
        estimates.claude = inputSize * 0.00002;
        break;
    }

    // Recommend based on complexity and privacy
    if (!this.ollamaAvailable) {
      estimates.recommended = 'claude';
    } else if (inputSize > 10000 || ['generate', 'document_parse', 'template_process'].includes(task.type)) {
      estimates.recommended = 'claude';
    }

    // Privacy recommendation always prefers local processing
    estimates.privacyRecommended = this.ollamaAvailable ? 'ollama' : 'claude';

    return estimates;
  }

  // Privacy-specific utility methods
  async getPrivacyHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.privacyScannerUrl}/api/history/${userId}?limit=${limit}`);
      if (response.ok) {
        const result = await response.json();
        return result.history;
      }
    } catch (error) {
      logger.error('Failed to fetch privacy history', { error: error.message });
    }
    return [];
  }

  async getComplianceStatus(userId: string, timeframe: string = '7 days'): Promise<any> {
    try {
      const response = await fetch(`${this.privacyScannerUrl}/api/compliance/${userId}?timeframe=${timeframe}`);
      if (response.ok) {
        const result = await response.json();
        return result.status;
      }
    } catch (error) {
      logger.error('Failed to fetch compliance status', { error: error.message });
    }
    return null;
  }
}

// Singleton instance
export const privacyAwareLLMRouter = new PrivacyAwareLLMRouter();
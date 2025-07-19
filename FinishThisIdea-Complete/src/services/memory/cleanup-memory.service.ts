import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import Redis from 'ioredis';
import path from 'path';
import fs from 'fs/promises';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface CleanupPreference {
  userId?: string;
  sessionId: string;
  preferences: {
    keepPatterns: string[];
    removePatterns: string[];
    organizationStyle: 'minimal' | 'standard' | 'detailed';
    indentationPreference: 'spaces' | 'tabs';
    indentSize: number;
    lineEnding: 'lf' | 'crlf' | 'auto';
    preserveComments: boolean;
    generateDocs: boolean;
  };
  confidence: number;
}

interface CleanupThought {
  id: string;
  timestamp: string;
  jobId: string;
  sessionId: string;
  userId?: string;
  eventType: 'upload' | 'analysis' | 'decision' | 'cleanup' | 'error' | 'completion';
  
  reasoning: {
    intent: string;
    confidence: number;
    decisionPath: string[];
    alternativesConsidered: string[];
  };
  
  analysis: {
    detectedPatterns: string[];
    codeStyle: Record<string, any>;
    problemsFound: string[];
    suggestedFixes: string[];
  };
  
  userContext: {
    previousJobs: number;
    preferredStyle?: Record<string, any>;
    successRate: number;
    trustLevel: number;
  };
  
  systemState: {
    processingTimeMs: number;
    filesAnalyzed: number;
    aiProvider: 'ollama' | 'claude';
    memoryUsageMb: number;
  };
  
  learning: {
    newPatterns: string[];
    userFeedback?: 'positive' | 'negative' | 'neutral';
    improvementNotes: string[];
  };
}

export class CleanupMemoryService {
  private thoughtLogPath: string;
  private maxThoughtsInMemory = 100;
  private preferencesCacheTime = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor() {
    this.thoughtLogPath = path.join(process.cwd(), 'logs', 'cleanup-thoughts');
    this.initializeThoughtLog();
  }

  /**
   * Initialize thought log directory
   */
  private async initializeThoughtLog() {
    try {
      await fs.mkdir(this.thoughtLogPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create thought log directory', error);
    }
  }

  /**
   * Log a cleanup thought with full context
   */
  async logThought(thought: Partial<CleanupThought>): Promise<CleanupThought> {
    const fullThought: CleanupThought = {
      id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      jobId: thought.jobId || 'unknown',
      sessionId: thought.sessionId || 'unknown',
      userId: thought.userId,
      eventType: thought.eventType || 'analysis',
      
      reasoning: {
        intent: 'analyzing code patterns',
        confidence: 0.8,
        decisionPath: [],
        alternativesConsidered: [],
        ...thought.reasoning
      },
      
      analysis: {
        detectedPatterns: [],
        codeStyle: {},
        problemsFound: [],
        suggestedFixes: [],
        ...thought.analysis
      },
      
      userContext: {
        previousJobs: 0,
        successRate: 1.0,
        trustLevel: 0.5,
        ...thought.userContext
      },
      
      systemState: {
        processingTimeMs: 0,
        filesAnalyzed: 0,
        aiProvider: 'ollama',
        memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024,
        ...thought.systemState
      },
      
      learning: {
        newPatterns: [],
        improvementNotes: [],
        ...thought.learning
      }
    };

    // Persist to file
    await this.persistThought(fullThought);
    
    // Cache in Redis
    await this.cacheThought(fullThought);
    
    // Log significant thoughts
    if (thought.eventType === 'error' || thought.reasoning?.confidence && thought.reasoning.confidence < 0.5) {
      logger.info('Cleanup significant thought', {
        eventType: fullThought.eventType,
        intent: fullThought.reasoning.intent,
        jobId: fullThought.jobId
      });
    }

    return fullThought;
  }

  /**
   * Log file analysis thought
   */
  async logAnalysisThought(jobId: string, sessionId: string, analysis: any) {
    const detectedPatterns = this.detectCodePatterns(analysis);
    
    return this.logThought({
      jobId,
      sessionId,
      eventType: 'analysis',
      reasoning: {
        intent: 'Analyzing code structure and patterns',
        confidence: 0.85,
        decisionPath: [
          'Scanned file structure',
          'Detected programming languages',
          'Analyzed code patterns',
          'Identified improvement opportunities'
        ],
        alternativesConsidered: []
      },
      analysis: {
        detectedPatterns,
        codeStyle: analysis.style || {},
        problemsFound: analysis.issues || [],
        suggestedFixes: analysis.suggestions || []
      },
      systemState: {
        filesAnalyzed: analysis.totalFiles,
        processingTimeMs: Date.now() - analysis.startTime,
        aiProvider: 'ollama',
        memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024
      }
    });
  }

  /**
   * Log cleanup decision thought
   */
  async logCleanupDecision(jobId: string, sessionId: string, decision: any) {
    return this.logThought({
      jobId,
      sessionId,
      eventType: 'decision',
      reasoning: {
        intent: 'Deciding cleanup strategy based on analysis',
        confidence: decision.confidence || 0.8,
        decisionPath: decision.steps || [],
        alternativesConsidered: decision.alternatives || []
      },
      analysis: {
        detectedPatterns: decision.patterns || [],
        codeStyle: decision.targetStyle || {},
        problemsFound: decision.issues || [],
        suggestedFixes: decision.fixes || []
      },
      learning: {
        newPatterns: decision.newPatterns || [],
        improvementNotes: [
          'Applied user preferences',
          'Optimized for code maintainability'
        ]
      }
    });
  }

  /**
   * Save user preferences from cleanup job
   */
  async saveUserPreferences(jobId: string, sessionId: string, userId?: string): Promise<void> {
    try {
      // Get job details and analysis
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { analysisResult: true }
      });

      if (!job || !job.analysisResult) return;

      // Extract preferences from the cleanup decisions
      const preferences: CleanupPreference = {
        userId,
        sessionId,
        preferences: {
          keepPatterns: [],
          removePatterns: ['node_modules', 'dist', 'build', '.git'],
          organizationStyle: 'standard',
          indentationPreference: 'spaces',
          indentSize: 2,
          lineEnding: 'lf',
          preserveComments: true,
          generateDocs: false
        },
        confidence: 0.8
      };

      // Cache preferences
      const key = userId ? `prefs:user:${userId}` : `prefs:session:${sessionId}`;
      await redis.setex(
        key,
        this.preferencesCacheTime,
        JSON.stringify(preferences)
      );

      // Also store in database for long-term analysis
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            metadata: {
              cleanupPreferences: preferences.preferences
            }
          }
        });
      }

    } catch (error) {
      logger.error('Failed to save user preferences', { error, jobId });
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(sessionId: string, userId?: string): Promise<CleanupPreference | null> {
    try {
      // Try user preferences first
      if (userId) {
        const userKey = `prefs:user:${userId}`;
        const userPrefs = await redis.get(userKey);
        if (userPrefs) {
          return JSON.parse(userPrefs);
        }
      }

      // Fall back to session preferences
      const sessionKey = `prefs:session:${sessionId}`;
      const sessionPrefs = await redis.get(sessionKey);
      if (sessionPrefs) {
        return JSON.parse(sessionPrefs);
      }

      return null;
    } catch (error) {
      logger.error('Failed to get user preferences', { error, sessionId, userId });
      return null;
    }
  }

  /**
   * Get cleanup insights for a user
   */
  async getCleanupInsights(userId: string): Promise<any> {
    try {
      // Get recent thoughts
      const thoughts = await this.getRecentThoughts(userId, 50);
      
      // Analyze patterns
      const insights = {
        totalCleanups: thoughts.length,
        preferredPatterns: this.extractPreferredPatterns(thoughts),
        commonIssues: this.extractCommonIssues(thoughts),
        averageConfidence: this.calculateAverageConfidence(thoughts),
        successRate: this.calculateSuccessRate(thoughts),
        recommendations: this.generateRecommendations(thoughts)
      };

      return insights;
    } catch (error) {
      logger.error('Failed to get cleanup insights', { error, userId });
      return null;
    }
  }

  /**
   * Persist thought to file system
   */
  private async persistThought(thought: CleanupThought): Promise<void> {
    try {
      const date = new Date();
      const filename = `cleanup-thoughts-${date.toISOString().split('T')[0]}.jsonl`;
      const filepath = path.join(this.thoughtLogPath, filename);
      
      await fs.appendFile(filepath, JSON.stringify(thought) + '\n');
    } catch (error) {
      logger.error('Failed to persist cleanup thought', error);
    }
  }

  /**
   * Cache thought in Redis
   */
  private async cacheThought(thought: CleanupThought): Promise<void> {
    try {
      // Store in job-specific list
      const jobKey = `cleanup:thoughts:job:${thought.jobId}`;
      await redis.lpush(jobKey, JSON.stringify(thought));
      await redis.ltrim(jobKey, 0, this.maxThoughtsInMemory - 1);
      await redis.expire(jobKey, 604800); // 7 days

      // Store in user-specific list if userId exists
      if (thought.userId) {
        const userKey = `cleanup:thoughts:user:${thought.userId}`;
        await redis.lpush(userKey, JSON.stringify(thought));
        await redis.ltrim(userKey, 0, this.maxThoughtsInMemory - 1);
        await redis.expire(userKey, 2592000); // 30 days
      }

      // Store in global stream for monitoring
      await redis.xadd(
        'cleanup:thought-stream',
        '*',
        'job_id', thought.jobId,
        'event_type', thought.eventType,
        'timestamp', thought.timestamp,
        'thought', JSON.stringify(thought)
      );
    } catch (error) {
      logger.error('Failed to cache cleanup thought', error);
    }
  }

  /**
   * Get recent thoughts
   */
  private async getRecentThoughts(identifier: string, limit = 10): Promise<CleanupThought[]> {
    try {
      const userKey = `cleanup:thoughts:user:${identifier}`;
      const jobKey = `cleanup:thoughts:job:${identifier}`;
      
      // Try user thoughts first
      let thoughts = await redis.lrange(userKey, 0, limit - 1);
      
      // Fall back to job thoughts
      if (thoughts.length === 0) {
        thoughts = await redis.lrange(jobKey, 0, limit - 1);
      }
      
      return thoughts.map(t => JSON.parse(t));
    } catch (error) {
      logger.error('Failed to retrieve cleanup thoughts', error);
      return [];
    }
  }

  /**
   * Detect code patterns from analysis
   */
  private detectCodePatterns(analysis: any): string[] {
    const patterns: string[] = [];
    
    // Language patterns
    if (analysis.languages) {
      Object.entries(analysis.languages).forEach(([lang, count]) => {
        if ((count as number) > 5) {
          patterns.push(`heavy_${lang}_usage`);
        }
      });
    }

    // Structure patterns
    if (analysis.structure) {
      if (analysis.structure.includes('src/')) patterns.push('uses_src_folder');
      if (analysis.structure.includes('test/') || analysis.structure.includes('tests/')) {
        patterns.push('has_tests');
      }
      if (analysis.structure.includes('docs/')) patterns.push('has_documentation');
    }

    // File patterns
    if (analysis.fileTypes) {
      if (analysis.fileTypes['.ts'] > 0) patterns.push('typescript_project');
      if (analysis.fileTypes['.jsx'] > 0 || analysis.fileTypes['.tsx'] > 0) {
        patterns.push('react_project');
      }
    }

    return patterns;
  }

  /**
   * Extract preferred patterns from thoughts
   */
  private extractPreferredPatterns(thoughts: CleanupThought[]): Record<string, number> {
    const patterns: Record<string, number> = {};
    
    thoughts.forEach(thought => {
      thought.analysis.detectedPatterns.forEach(pattern => {
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      });
    });

    return patterns;
  }

  /**
   * Extract common issues from thoughts
   */
  private extractCommonIssues(thoughts: CleanupThought[]): Record<string, number> {
    const issues: Record<string, number> = {};
    
    thoughts.forEach(thought => {
      thought.analysis.problemsFound.forEach(problem => {
        issues[problem] = (issues[problem] || 0) + 1;
      });
    });

    return issues;
  }

  /**
   * Calculate average confidence
   */
  private calculateAverageConfidence(thoughts: CleanupThought[]): number {
    if (thoughts.length === 0) return 0;
    
    const totalConfidence = thoughts.reduce((sum, thought) => {
      return sum + thought.reasoning.confidence;
    }, 0);

    return totalConfidence / thoughts.length;
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(thoughts: CleanupThought[]): number {
    if (thoughts.length === 0) return 1;
    
    const errors = thoughts.filter(t => t.eventType === 'error').length;
    return 1 - (errors / thoughts.length);
  }

  /**
   * Generate recommendations based on history
   */
  private generateRecommendations(thoughts: CleanupThought[]): string[] {
    const recommendations: string[] = [];
    const avgConfidence = this.calculateAverageConfidence(thoughts);
    
    if (avgConfidence < 0.7) {
      recommendations.push('Consider providing more specific cleanup instructions');
    }
    
    const commonIssues = this.extractCommonIssues(thoughts);
    if (commonIssues['unused_imports'] > 3) {
      recommendations.push('Your code often has unused imports - consider using an import cleaner');
    }
    
    if (commonIssues['inconsistent_indentation'] > 3) {
      recommendations.push('Your code has inconsistent indentation - consider using a formatter');
    }

    return recommendations;
  }
}

// Export singleton instance
export const cleanupMemory = new CleanupMemoryService();
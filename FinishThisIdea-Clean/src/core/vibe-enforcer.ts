/**
 * Vibe Enforcer
 * Central module that ensures all code follows our vibe coder's paradise rules
 * Import this in every service to maintain consistency
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface VibeRules {
  noStubs: boolean;
  noComplexity: boolean;
  ollamaFirst: boolean;
  swipeableByDefault: boolean;
  documentationRequired: boolean;
}

export class VibeEnforcer {
  private static instance: VibeEnforcer;
  private rules: VibeRules;
  private claudeRules: string;
  private qualityStandards: string;

  private constructor() {
    // Load rules from CLAUDE.md and QUALITY_STANDARDS.md
    try {
      this.claudeRules = readFileSync(
        join(__dirname, '../../CLAUDE.md'),
        'utf8'
      );
      this.qualityStandards = readFileSync(
        join(__dirname, '../../QUALITY_STANDARDS.md'),
        'utf8'
      );
    } catch (error) {
      console.error('⚠️  Could not load vibe rules. Using defaults.');
      this.claudeRules = '';
      this.qualityStandards = '';
    }

    this.rules = {
      noStubs: true,
      noComplexity: true,
      ollamaFirst: true,
      swipeableByDefault: true,
      documentationRequired: true,
    };
  }

  static getInstance(): VibeEnforcer {
    if (!VibeEnforcer.instance) {
      VibeEnforcer.instance = new VibeEnforcer();
    }
    return VibeEnforcer.instance;
  }

  /**
   * Validate code follows vibe rules
   */
  validateCode(code: string, filename: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for stubs
    if (this.rules.noStubs) {
      const stubPatterns = [
        /TODO(?!:)/gi,
        /FIXME/gi,
        /STUB/gi,
        /PLACEHOLDER/gi,
        /throw\s+new\s+Error\(['"`]Not implemented/gi,
      ];

      for (const pattern of stubPatterns) {
        if (pattern.test(code)) {
          errors.push({
            rule: 'NO_STUBS',
            message: 'Code contains stubs or placeholders',
            severity: 'error',
          });
          break;
        }
      }
    }

    // Check complexity
    if (this.rules.noComplexity) {
      const lines = code.split('\n');
      const functionLines = lines.filter(line => 
        line.includes('function') || line.includes('=>')
      );

      for (let i = 0; i < lines.length; i++) {
        if (functionLines.some(fl => lines[i].includes(fl))) {
          // Count lines until closing brace
          let braceCount = 0;
          let lineCount = 0;
          for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('{')) braceCount++;
            if (lines[j].includes('}')) braceCount--;
            lineCount++;
            if (braceCount === 0 && lineCount > 50) {
              warnings.push({
                rule: 'COMPLEXITY',
                message: `Function too long (${lineCount} lines). Keep it simple!`,
                severity: 'warning',
              });
              break;
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get configuration following vibe rules
   */
  getVibeConfig<T extends VibeConfig>(type: 'llm' | 'ui' | 'api'): T {
    switch (type) {
      case 'llm':
        return {
          providers: {
            ollama: { enabled: true, priority: 1 },
            openai: { enabled: !!process.env.OPENAI_API_KEY, priority: 2 },
            anthropic: { enabled: !!process.env.ANTHROPIC_API_KEY, priority: 3 },
          },
          defaultProvider: 'ollama',
          costTracking: true,
        } as T;

      case 'ui':
        return {
          swipeable: true,
          noConfig: true,
          mobileFirst: true,
          animations: 'smooth',
        } as T;

      case 'api':
        return {
          asyncByDefault: true,
          returnImmediately: true,
          statusUrls: true,
          simpleErrors: true,
        } as T;

      default:
        throw new Error(`Unknown config type: ${type}`);
    }
  }

  /**
   * Generate vibe-compliant code patterns
   */
  generatePattern(type: 'service' | 'route' | 'component'): string {
    switch (type) {
      case 'service':
        return `
import { VibeEnforcer } from '@/core/vibe-enforcer';
import { LLMRouter } from '@/core/llm-router';

export class ExampleService {
  private vibe = VibeEnforcer.getInstance();
  private llm = new LLMRouter(this.vibe.getVibeConfig('llm'));

  async process(input: any) {
    // Simple, swipeable, Ollama-first
    const result = await this.llm.complete({
      prompt: this.buildPrompt(input),
      requireConfidence: 0.8,
    });
    
    return this.formatAsSwipeable(result);
  }
}`;

      case 'route':
        return `
import { Router } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { VibeEnforcer } from '@/core/vibe-enforcer';

const router = Router();
const vibe = VibeEnforcer.getInstance();

router.post('/example', asyncHandler(async (req, res) => {
  // Validate with vibe rules
  const validation = vibe.validateCode(req.body.code, 'user-input');
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }

  // Return immediately with status URL
  const job = await createJob(req.body);
  res.json({
    id: job.id,
    status: 'pending',
    statusUrl: \`/api/jobs/\${job.id}\`,
  });
}));`;

      case 'component':
        return `
import { SwipeableCard } from '@/components/SwipeableCard';
import { useVibe } from '@/hooks/useVibe';

export function ExampleComponent({ data, onDecision }) {
  const { isSwipeable } = useVibe();

  return (
    <SwipeableCard 
      onSwipe={onDecision}
      disabled={!isSwipeable}
    >
      {/* Simple, visual, no config needed */}
      <div className="p-4">
        <h3>{data.title}</h3>
        <p>{data.description}</p>
      </div>
    </SwipeableCard>
  );
}`;
    }
  }

  /**
   * Log vibe metrics
   */
  logVibeMetrics(action: string, data: any) {
    // Track how well we're following the vibe
    console.log(`✨ [VIBE] ${action}`, {
      timestamp: new Date().toISOString(),
      ...data,
      vibeScore: this.calculateVibeScore(data),
    });
  }

  private calculateVibeScore(data: any): number {
    let score = 100;
    
    // Deduct points for complexity
    if (data.complexity > 5) score -= 10;
    if (data.linesOfCode > 100) score -= 20;
    
    // Deduct points for not using Ollama
    if (data.llmProvider !== 'ollama') score -= 15;
    
    // Deduct points for configuration
    if (data.configOptions > 3) score -= 10;
    
    // Bonus points for swipeable
    if (data.swipeable) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }
}

// Types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  rule: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  rule: string;
  message: string;
  severity: 'warning';
}

export interface VibeConfig {
  [key: string]: any;
}

// Export singleton instance
export const vibe = VibeEnforcer.getInstance();

// Export patterns as constants
export const VIBE_PATTERNS = {
  SERVICE: vibe.generatePattern('service'),
  ROUTE: vibe.generatePattern('route'),
  COMPONENT: vibe.generatePattern('component'),
};

// Export quick validators
export const validateVibeCode = (code: string, filename = 'unknown') => 
  vibe.validateCode(code, filename);

export const getVibeConfig = <T extends VibeConfig>(type: 'llm' | 'ui' | 'api') => 
  vibe.getVibeConfig<T>(type);
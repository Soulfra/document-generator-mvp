# Week 2: Tinder Interface & LLM Router

## Overview

Week 2 adds the signature Tinder-style decision interface and implements the progressive LLM enhancement system. Users can now review individual code changes by swiping, and the system intelligently routes between local and cloud LLMs.

## Day 8: Tinder UI Foundation

### Morning (4 hours)
Build the swipeable card component:

**src/tinder-ui/components/SwipeCard.tsx**
```tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeChange {
  id: string;
  file: string;
  type: 'format' | 'refactor' | 'cleanup' | 'documentation';
  before: string;
  after: string;
  language: string;
  impact: 'low' | 'medium' | 'high';
  aiConfidence: number;
}

interface SwipeCardProps {
  change: CodeChange;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  isActive: boolean;
}

export function SwipeCard({ change, onSwipe, isActive }: SwipeCardProps) {
  const [showDiff, setShowDiff] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Color overlay based on swipe direction
  const leftOverlay = useTransform(x, [-200, 0], [1, 0]);
  const rightOverlay = useTransform(x, [0, 200], [0, 1]);
  const upOverlay = useTransform(y, [-200, 0], [1, 0]);
  const downOverlay = useTransform(y, [0, 200], [0, 1]);

  useEffect(() => {
    // Syntax highlighting
    Prism.highlightAll();
  }, [change, showDiff]);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      controls.start({
        x: info.offset.x > 0 ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 },
      }).then(() => onSwipe(direction));
    } else if (Math.abs(info.offset.y) > swipeThreshold) {
      const direction = info.offset.y > 0 ? 'down' : 'up';
      controls.start({
        y: info.offset.y > 0 ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 },
      }).then(() => onSwipe(direction));
    } else {
      controls.start({
        x: 0,
        y: 0,
        transition: { type: 'spring', stiffness: 200 },
      });
    }
  };

  // Keyboard controls
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          onSwipe('left');
          break;
        case 'ArrowRight':
        case 'd':
          onSwipe('right');
          break;
        case 'ArrowUp':
        case 'w':
          onSwipe('up');
          break;
        case 'ArrowDown':
        case 's':
          onSwipe('down');
          break;
        case ' ':
          setShowDiff(!showDiff);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, onSwipe, showDiff]);

  return (
    <motion.div
      ref={cardRef}
      className="absolute w-full max-w-2xl"
      style={{ x, y, rotate, opacity }}
      drag={isActive}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: 0.95, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
    >
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden relative">
        {/* Swipe indicators */}
        <motion.div
          className="absolute inset-0 bg-red-500 mix-blend-multiply pointer-events-none"
          style={{ opacity: leftOverlay }}
        />
        <motion.div
          className="absolute inset-0 bg-green-500 mix-blend-multiply pointer-events-none"
          style={{ opacity: rightOverlay }}
        />
        <motion.div
          className="absolute inset-0 bg-blue-500 mix-blend-multiply pointer-events-none"
          style={{ opacity: upOverlay }}
        />
        <motion.div
          className="absolute inset-0 bg-yellow-500 mix-blend-multiply pointer-events-none"
          style={{ opacity: downOverlay }}
        />

        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-mono text-sm text-gray-600">{change.file}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${change.type === 'format' ? 'bg-blue-100 text-blue-700' : ''}
                  ${change.type === 'refactor' ? 'bg-purple-100 text-purple-700' : ''}
                  ${change.type === 'cleanup' ? 'bg-green-100 text-green-700' : ''}
                  ${change.type === 'documentation' ? 'bg-yellow-100 text-yellow-700' : ''}
                `}>
                  {change.type}
                </span>
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${change.impact === 'low' ? 'bg-gray-100 text-gray-700' : ''}
                  ${change.impact === 'medium' ? 'bg-orange-100 text-orange-700' : ''}
                  ${change.impact === 'high' ? 'bg-red-100 text-red-700' : ''}
                `}>
                  {change.impact} impact
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round(change.aiConfidence * 100)}% confident
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Code display */}
        <div className="p-4 max-h-96 overflow-auto">
          {showDiff ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-2">BEFORE</h4>
                <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
                  <code className={`language-${change.language}`}>
                    {change.before}
                  </code>
                </pre>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-2">AFTER</h4>
                <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                  <code className={`language-${change.language}`}>
                    {change.after}
                  </code>
                </pre>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-2">PROPOSED CHANGE</h4>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                <code className={`language-${change.language}`}>
                  {change.after}
                </code>
              </pre>
            </div>
          )}
        </div>

        {/* Action hints */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-4 gap-2 text-xs text-center">
            <div className="flex flex-col items-center">
              <X className="w-4 h-4 text-red-500 mb-1" />
              <span>Reject</span>
            </div>
            <div className="flex flex-col items-center">
              <Check className="w-4 h-4 text-green-500 mb-1" />
              <span>Accept</span>
            </div>
            <div className="flex flex-col items-center">
              <ChevronUp className="w-4 h-4 text-blue-500 mb-1" />
              <span>Always</span>
            </div>
            <div className="flex flex-col items-center">
              <ChevronDown className="w-4 h-4 text-yellow-500 mb-1" />
              <span>Never</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Press SPACE to toggle diff view
          </p>
        </div>
      </div>
    </motion.div>
  );
}
```

### Afternoon (4 hours)
Create the swipe deck manager:

**src/tinder-ui/components/SwipeDeck.tsx**
```tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SwipeCard } from './SwipeCard';
import { SwipeStats } from './SwipeStats';
import { SwipeControls } from './SwipeControls';
import { useSwipePreferences } from '../hooks/useSwipePreferences';

interface SwipeDeckProps {
  jobId: string;
  changes: CodeChange[];
  onComplete: (decisions: SwipeDecision[]) => void;
}

export function SwipeDeck({ jobId, changes, onComplete }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<SwipeDecision[]>([]);
  const { preferences, updatePreferences } = useSwipePreferences();
  const [stats, setStats] = useState({
    accepted: 0,
    rejected: 0,
    always: 0,
    never: 0,
  });

  const currentChange = changes[currentIndex];
  const progress = (currentIndex / changes.length) * 100;

  const handleSwipe = (direction: SwipeDirection) => {
    const decision: SwipeDecision = {
      changeId: currentChange.id,
      action: direction,
      timestamp: Date.now(),
    };

    setDecisions([...decisions, decision]);

    // Update stats
    setStats(prev => ({
      ...prev,
      [direction === 'right' ? 'accepted' : 
       direction === 'left' ? 'rejected' :
       direction === 'up' ? 'always' : 'never']: prev[direction] + 1,
    }));

    // Update preferences for "always" and "never"
    if (direction === 'up' || direction === 'down') {
      updatePreferences({
        type: currentChange.type,
        pattern: extractPattern(currentChange),
        action: direction === 'up' ? 'accept' : 'reject',
      });
    }

    // Move to next change
    if (currentIndex < changes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All changes reviewed
      onComplete(decisions);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDecisions(decisions.slice(0, -1));
      // Update stats
      const lastDecision = decisions[decisions.length - 1];
      const statKey = 
        lastDecision.action === 'right' ? 'accepted' :
        lastDecision.action === 'left' ? 'rejected' :
        lastDecision.action === 'up' ? 'always' : 'never';
      setStats(prev => ({
        ...prev,
        [statKey]: prev[statKey] - 1,
      }));
    }
  };

  // Auto-apply preferences
  useEffect(() => {
    if (currentChange && preferences.shouldAutoApply(currentChange)) {
      const action = preferences.getAction(currentChange);
      setTimeout(() => handleSwipe(action), 500);
    }
  }, [currentIndex]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Reviewing changes</span>
            <span>{currentIndex + 1} of {changes.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <SwipeStats stats={stats} total={changes.length} />

        {/* Swipe area */}
        <div className="relative h-[600px] flex items-center justify-center">
          <AnimatePresence>
            {currentChange && (
              <SwipeCard
                key={currentChange.id}
                change={currentChange}
                onSwipe={handleSwipe}
                isActive={true}
              />
            )}
          </AnimatePresence>

          {/* Preview of next cards */}
          {changes.slice(currentIndex + 1, currentIndex + 3).map((change, index) => (
            <div
              key={change.id}
              className="absolute w-full max-w-2xl"
              style={{
                transform: `scale(${0.95 - index * 0.05}) translateY(${(index + 1) * 20}px)`,
                zIndex: -index - 1,
                opacity: 0.5 - index * 0.2,
              }}
            >
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="h-32 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <SwipeControls
          onSwipe={handleSwipe}
          onUndo={handleUndo}
          canUndo={currentIndex > 0}
          onToggleAutoMode={() => preferences.toggleAutoMode()}
          autoMode={preferences.autoMode}
        />

        {/* Keyboard shortcuts */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Keyboard shortcuts:</p>
          <div className="flex justify-center gap-4 mt-2">
            <span>← / A = Reject</span>
            <span>→ / D = Accept</span>
            <span>↑ / W = Always</span>
            <span>↓ / S = Never</span>
            <span>SPACE = Toggle diff</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractPattern(change: CodeChange): string {
  // Extract a pattern that can be used to identify similar changes
  if (change.type === 'format') {
    return 'formatting';
  } else if (change.type === 'cleanup') {
    // Look for specific patterns
    if (change.before.includes('console.log')) {
      return 'remove-console-logs';
    } else if (change.before.includes('debugger')) {
      return 'remove-debugger';
    }
  }
  return 'general';
}
```

## Day 9: Progressive LLM Router

### Morning (4 hours)
Build the core LLM router:

**src/llm-router/router.ts**
```typescript
import { Ollama } from 'ollama';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

interface LLMProvider {
  name: string;
  priority: number;
  maxCost: number;
  isAvailable: () => Promise<boolean>;
  complete: (prompt: string, options: any) => Promise<LLMResponse>;
  estimateCost: (prompt: string, maxTokens: number) => number;
}

interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  latency: number;
  confidence: number;
}

export class LLMRouter {
  private providers: LLMProvider[] = [];
  private costTracker = new Map<string, number>();

  constructor(config: LLMRouterConfig) {
    // Initialize Ollama (always first)
    if (config.ollama?.enabled) {
      this.providers.push(new OllamaProvider(config.ollama));
    }

    // Initialize OpenAI
    if (config.openai?.enabled && config.openai.apiKey) {
      this.providers.push(new OpenAIProvider(config.openai));
    }

    // Initialize Anthropic
    if (config.anthropic?.enabled && config.anthropic.apiKey) {
      this.providers.push(new AnthropicProvider(config.anthropic));
    }

    // Sort by priority
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  async complete(options: CompletionOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const errors: Error[] = [];

    for (const provider of this.providers) {
      try {
        // Check availability
        if (!await provider.isAvailable()) {
          logger.debug(`Provider ${provider.name} not available`);
          continue;
        }

        // Check cost limit
        const estimatedCost = provider.estimateCost(options.prompt, options.maxTokens);
        const currentCost = this.costTracker.get(provider.name) || 0;
        
        if (currentCost + estimatedCost > provider.maxCost) {
          logger.warn(`Provider ${provider.name} would exceed cost limit`);
          continue;
        }

        // Try completion
        const response = await provider.complete(options.prompt, {
          maxTokens: options.maxTokens,
          temperature: options.temperature || 0.7,
          systemPrompt: options.systemPrompt,
        });

        // Update cost tracking
        this.costTracker.set(provider.name, currentCost + response.cost);

        // Check confidence threshold
        if (options.requireConfidence && response.confidence < options.requireConfidence) {
          logger.info(`Response confidence ${response.confidence} below threshold ${options.requireConfidence}`);
          
          // Try hybrid approach if configured
          if (options.hybridThreshold && response.confidence >= options.hybridThreshold) {
            return await this.hybridComplete(response, options);
          }
          
          errors.push(new Error(`Low confidence: ${response.confidence}`));
          continue;
        }

        response.latency = Date.now() - startTime;
        return response;

      } catch (error) {
        logger.error(`Provider ${provider.name} failed:`, error);
        errors.push(error);
        continue;
      }
    }

    // All providers failed
    throw new Error(`All LLM providers failed: ${errors.map(e => e.message).join(', ')}`);
  }

  private async hybridComplete(
    initialResponse: LLMResponse,
    options: CompletionOptions
  ): Promise<LLMResponse> {
    // Use initial response as context for a more powerful model
    const enhancedPrompt = `
Given this initial analysis:
${initialResponse.content}

Please provide a more detailed and accurate response to the original request:
${options.prompt}
`;

    // Find next available provider
    const nextProvider = this.providers.find(p => 
      p.priority > this.providers.find(x => x.name === initialResponse.provider)!.priority
    );

    if (!nextProvider) {
      return initialResponse;
    }

    try {
      const enhancedResponse = await nextProvider.complete(enhancedPrompt, options);
      return {
        ...enhancedResponse,
        content: this.mergeResponses(initialResponse.content, enhancedResponse.content),
        cost: initialResponse.cost + enhancedResponse.cost,
        provider: `${initialResponse.provider}+${enhancedResponse.provider}`,
        model: `${initialResponse.model}+${enhancedResponse.model}`,
        confidence: Math.max(initialResponse.confidence, enhancedResponse.confidence),
      };
    } catch (error) {
      logger.error('Hybrid completion failed:', error);
      return initialResponse;
    }
  }

  private mergeResponses(initial: string, enhanced: string): string {
    // Simple merge strategy - can be made more sophisticated
    return enhanced;
  }

  async analyzeComplexity(content: string): Promise<ComplexityScore> {
    // Analyze code/content complexity to determine routing
    const metrics = {
      lines: content.split('\n').length,
      characters: content.length,
      hasComplexPatterns: /class|interface|async|Promise|Observable/.test(content),
      hasNestedStructures: this.countNesting(content),
      estimatedTokens: Math.ceil(content.length / 4),
    };

    return {
      score: this.calculateComplexityScore(metrics),
      reasoning: this.explainComplexity(metrics),
      recommendedProvider: this.recommendProvider(metrics),
    };
  }

  private calculateComplexityScore(metrics: any): number {
    let score = 0;
    
    // Base score from size
    score += Math.min(metrics.lines / 100, 1) * 0.3;
    score += Math.min(metrics.characters / 1000, 1) * 0.2;
    
    // Pattern complexity
    score += metrics.hasComplexPatterns ? 0.2 : 0;
    score += Math.min(metrics.hasNestedStructures / 5, 1) * 0.3;
    
    return score;
  }

  private countNesting(content: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of content) {
      if ('{[('.includes(char)) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if ('}])'.includes(char)) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }
    
    return maxNesting;
  }

  private recommendProvider(metrics: any): string {
    if (metrics.estimatedTokens > 2000 || this.calculateComplexityScore(metrics) > 0.7) {
      return 'anthropic'; // Best for complex analysis
    } else if (metrics.hasComplexPatterns) {
      return 'openai'; // Good balance
    } else {
      return 'ollama'; // Local is sufficient
    }
  }

  getUsageStats(): UsageStats {
    const stats: UsageStats = {
      providers: {},
      totalCost: 0,
      totalRequests: 0,
    };

    for (const [provider, cost] of this.costTracker.entries()) {
      stats.providers[provider] = { cost, requests: 0 }; // Track requests separately
      stats.totalCost += cost;
    }

    return stats;
  }
}

class OllamaProvider implements LLMProvider {
  name = 'ollama';
  priority = 1;
  maxCost = 0; // Free!
  private ollama: Ollama;
  private models: string[];

  constructor(config: OllamaConfig) {
    this.ollama = new Ollama({ host: config.url });
    this.models = config.models;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch {
      return false;
    }
  }

  async complete(prompt: string, options: any): Promise<LLMResponse> {
    const model = this.selectModel(prompt);
    const startTime = Date.now();

    const response = await this.ollama.chat({
      model,
      messages: [
        ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens,
      },
    });

    return {
      content: response.message.content,
      provider: 'ollama',
      model,
      tokens: response.eval_count || 0,
      cost: 0,
      latency: Date.now() - startTime,
      confidence: this.estimateConfidence(response),
    };
  }

  estimateCost(): number {
    return 0;
  }

  private selectModel(prompt: string): string {
    // Select best model based on task
    if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('programming')) {
      return this.models.find(m => m.includes('code')) || this.models[0];
    }
    return this.models[0];
  }

  private estimateConfidence(response: any): number {
    // Simple confidence estimation
    const hasContent = response.message.content.length > 10;
    const isCoherent = !response.message.content.includes('I cannot') && 
                      !response.message.content.includes('I don\'t');
    
    return hasContent && isCoherent ? 0.8 : 0.5;
  }
}

// Similar implementations for OpenAIProvider and AnthropicProvider...
```

### Afternoon (4 hours)
Integrate LLM router with cleanup service:

**src/mvp-cleanup-service/backend/src/services/cleanup.service.ts**
```typescript
import { LLMRouter } from '@finishthisidea/llm-router';
import { CodeAnalyzer } from './code-analyzer';
import { logger } from '../utils/logger';

export class EnhancedCleanupService {
  private llmRouter: LLMRouter;
  private codeAnalyzer: CodeAnalyzer;

  constructor() {
    this.llmRouter = new LLMRouter({
      ollama: {
        enabled: true,
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        models: ['codellama', 'mistral', 'deepseek-coder'],
      },
      openai: {
        enabled: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY,
        models: ['gpt-3.5-turbo', 'gpt-4'],
        maxCost: 0.10, // $0.10 per job max
      },
      anthropic: {
        enabled: !!process.env.ANTHROPIC_API_KEY,
        apiKey: process.env.ANTHROPIC_API_KEY,
        models: ['claude-3-haiku', 'claude-3-sonnet'],
        maxCost: 0.25, // $0.25 per job max
      },
    });

    this.codeAnalyzer = new CodeAnalyzer();
  }

  async processFile(filePath: string, options: ProcessOptions) {
    const files = await this.extractAndAnalyze(filePath);
    const changes: CodeChange[] = [];

    for (const file of files) {
      // Analyze complexity
      const complexity = await this.llmRouter.analyzeComplexity(file.content);
      logger.info(`File ${file.path} complexity: ${complexity.score}`);

      // Generate cleanup suggestions
      const suggestions = await this.generateSuggestions(file, complexity);
      
      // Convert to swipeable changes
      for (const suggestion of suggestions) {
        changes.push({
          id: crypto.randomUUID(),
          file: file.path,
          type: suggestion.type,
          before: suggestion.before,
          after: suggestion.after,
          language: file.language,
          impact: suggestion.impact,
          aiConfidence: suggestion.confidence,
        });
      }
    }

    return {
      changes,
      stats: this.llmRouter.getUsageStats(),
    };
  }

  private async generateSuggestions(file: FileInfo, complexity: ComplexityScore) {
    const prompt = this.buildCleanupPrompt(file);
    
    // Use progressive enhancement based on complexity
    const requireConfidence = complexity.score > 0.5 ? 0.8 : 0.6;
    const hybridThreshold = complexity.score > 0.7 ? 0.7 : 0.5;

    const response = await this.llmRouter.complete({
      prompt,
      systemPrompt: `You are an expert code reviewer. Analyze the code and suggest improvements.
Focus on: formatting, removing dead code, simplifying logic, improving naming.
Return suggestions as JSON array with: type, before, after, impact, confidence.`,
      maxTokens: 2000,
      temperature: 0.3,
      requireConfidence,
      hybridThreshold,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      return this.fallbackSuggestions(file);
    }
  }

  private buildCleanupPrompt(file: FileInfo): string {
    return `Analyze this ${file.language} code and suggest improvements:

File: ${file.path}
Lines: ${file.lines}

\`\`\`${file.language}
${file.content}
\`\`\`

Provide specific, actionable suggestions. Each suggestion should include:
- The exact code to change (before)
- The improved version (after)
- The type of change (format, refactor, cleanup, documentation)
- The impact level (low, medium, high)
- Your confidence in the suggestion (0-1)`;
  }

  private fallbackSuggestions(file: FileInfo): CodeChange[] {
    // Basic pattern-based suggestions when AI fails
    const suggestions: CodeChange[] = [];
    const lines = file.content.split('\n');

    // Remove console.logs
    lines.forEach((line, index) => {
      if (line.includes('console.log')) {
        suggestions.push({
          type: 'cleanup',
          before: line,
          after: '',
          impact: 'low',
          confidence: 0.9,
        });
      }
    });

    // Remove trailing whitespace
    lines.forEach((line, index) => {
      const trimmed = line.trimEnd();
      if (trimmed !== line) {
        suggestions.push({
          type: 'format',
          before: line,
          after: trimmed,
          impact: 'low',
          confidence: 1.0,
        });
      }
    });

    return suggestions;
  }
}
```

## Day 10: User Preferences & Learning

### Morning (4 hours)
Implement preference learning system:

**src/tinder-ui/services/preference-learner.ts**
```typescript
import { PrismaClient } from '@prisma/client';
import * as tf from '@tensorflow/tfjs';

interface SwipePattern {
  userId: string;
  changeType: string;
  filePattern: string;
  codePattern: string;
  action: 'accept' | 'reject';
  confidence: number;
}

export class PreferenceLearner {
  private model: tf.LayersModel | null = null;
  private patterns: Map<string, SwipePattern[]> = new Map();
  private prisma = new PrismaClient();

  async loadUserModel(userId: string) {
    // Try to load existing model
    try {
      const modelPath = `s3://models/${userId}/preferences`;
      this.model = await tf.loadLayersModel(modelPath);
    } catch {
      // Create new model if none exists
      this.model = this.createModel();
    }

    // Load historical patterns
    const patterns = await this.prisma.swipePattern.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    this.patterns.set(userId, patterns);
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [10], // Feature vector size
          units: 16,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 8,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 2, // Accept or reject
          activation: 'softmax',
        }),
      ],
    });

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  async learn(userId: string, decision: SwipeDecision, change: CodeChange) {
    // Extract features
    const features = this.extractFeatures(change);
    
    // Record pattern
    const pattern: SwipePattern = {
      userId,
      changeType: change.type,
      filePattern: this.extractFilePattern(change.file),
      codePattern: this.extractCodePattern(change),
      action: decision.action === 'right' || decision.action === 'up' ? 'accept' : 'reject',
      confidence: change.aiConfidence,
    };

    await this.prisma.swipePattern.create({ data: pattern });
    
    // Update patterns cache
    const userPatterns = this.patterns.get(userId) || [];
    userPatterns.push(pattern);
    this.patterns.set(userId, userPatterns);

    // Retrain model periodically
    if (userPatterns.length % 50 === 0) {
      await this.retrainModel(userId, userPatterns);
    }
  }

  async predict(userId: string, change: CodeChange): Promise<PredictedAction> {
    if (!this.model) {
      return { action: null, confidence: 0 };
    }

    const features = this.extractFeatures(change);
    const prediction = this.model.predict(features) as tf.Tensor;
    const values = await prediction.data();
    
    const acceptProbability = values[0];
    const rejectProbability = values[1];
    
    if (Math.max(acceptProbability, rejectProbability) < 0.7) {
      return { action: null, confidence: 0 };
    }

    return {
      action: acceptProbability > rejectProbability ? 'accept' : 'reject',
      confidence: Math.max(acceptProbability, rejectProbability),
    };
  }

  private extractFeatures(change: CodeChange): tf.Tensor {
    // Convert change to numerical features
    const features = [
      // Change type (one-hot encoded)
      change.type === 'format' ? 1 : 0,
      change.type === 'refactor' ? 1 : 0,
      change.type === 'cleanup' ? 1 : 0,
      change.type === 'documentation' ? 1 : 0,
      
      // Impact level
      change.impact === 'low' ? 0.33 : change.impact === 'medium' ? 0.66 : 1,
      
      // AI confidence
      change.aiConfidence,
      
      // Code metrics
      change.before.length / 1000, // Normalized length
      change.after.length / 1000,
      (change.before.length - change.after.length) / change.before.length, // Change ratio
      
      // Pattern indicators
      change.before.includes('console.log') ? 1 : 0,
    ];

    return tf.tensor2d([features]);
  }

  private extractFilePattern(filePath: string): string {
    // Extract pattern from file path
    const parts = filePath.split('/');
    const ext = path.extname(filePath);
    
    if (parts.includes('test') || parts.includes('__tests__')) {
      return 'test';
    } else if (parts.includes('components')) {
      return 'component';
    } else if (parts.includes('utils') || parts.includes('helpers')) {
      return 'utility';
    }
    
    return ext;
  }

  private extractCodePattern(change: CodeChange): string {
    // Identify code patterns
    const patterns: string[] = [];
    
    if (/console\.(log|debug|info)/.test(change.before)) {
      patterns.push('console-log');
    }
    if (/\/\/\s*TODO|FIXME|HACK/.test(change.before)) {
      patterns.push('todo-comment');
    }
    if (/\s+$/.test(change.before)) {
      patterns.push('trailing-whitespace');
    }
    if (/function\s*\(/.test(change.before) && /=>\s*{/.test(change.after)) {
      patterns.push('arrow-function');
    }
    
    return patterns.join(',') || 'general';
  }

  private async retrainModel(userId: string, patterns: SwipePattern[]) {
    if (!this.model || patterns.length < 100) return;

    // Prepare training data
    const features: number[][] = [];
    const labels: number[][] = [];

    for (const pattern of patterns) {
      // Reconstruct features from pattern
      // This is simplified - in reality, you'd store the original features
      features.push([
        pattern.changeType === 'format' ? 1 : 0,
        pattern.changeType === 'refactor' ? 1 : 0,
        pattern.changeType === 'cleanup' ? 1 : 0,
        pattern.changeType === 'documentation' ? 1 : 0,
        0.5, // Default impact
        pattern.confidence,
        0.1, // Default metrics
        0.1,
        0,
        pattern.codePattern.includes('console-log') ? 1 : 0,
      ]);
      
      labels.push(pattern.action === 'accept' ? [1, 0] : [0, 1]);
    }

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    // Train model
    await this.model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.info(`Training epoch ${epoch}: loss=${logs?.loss}`);
        },
      },
    });

    // Save model
    await this.model.save(`s3://models/${userId}/preferences`);

    // Cleanup tensors
    xs.dispose();
    ys.dispose();
  }

  async getInsights(userId: string): Promise<UserInsights> {
    const patterns = this.patterns.get(userId) || [];
    
    // Analyze patterns
    const typePreferences = new Map<string, { accept: number; reject: number }>();
    const patternPreferences = new Map<string, { accept: number; reject: number }>();
    
    for (const pattern of patterns) {
      // Type preferences
      const typeStat = typePreferences.get(pattern.changeType) || { accept: 0, reject: 0 };
      typeStat[pattern.action === 'accept' ? 'accept' : 'reject']++;
      typePreferences.set(pattern.changeType, typeStat);
      
      // Pattern preferences
      const patternStat = patternPreferences.get(pattern.codePattern) || { accept: 0, reject: 0 };
      patternStat[pattern.action === 'accept' ? 'accept' : 'reject']++;
      patternPreferences.set(pattern.codePattern, patternStat);
    }

    return {
      totalDecisions: patterns.length,
      acceptanceRate: patterns.filter(p => p.action === 'accept').length / patterns.length,
      typePreferences: Object.fromEntries(typePreferences),
      patternPreferences: Object.fromEntries(patternPreferences),
      mostAccepted: this.getMostAccepted(typePreferences),
      mostRejected: this.getMostRejected(typePreferences),
    };
  }

  private getMostAccepted(preferences: Map<string, any>): string[] {
    return Array.from(preferences.entries())
      .filter(([_, stats]) => stats.accept > stats.reject)
      .sort((a, b) => b[1].accept - a[1].accept)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private getMostRejected(preferences: Map<string, any>): string[] {
    return Array.from(preferences.entries())
      .filter(([_, stats]) => stats.reject > stats.accept)
      .sort((a, b) => b[1].reject - a[1].reject)
      .slice(0, 3)
      .map(([type]) => type);
  }
}
```

### Afternoon (4 hours)
Create preference dashboard:

**src/tinder-ui/components/PreferenceDashboard.tsx**
```tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface PreferenceDashboardProps {
  insights: UserInsights;
  onResetPreferences: () => void;
}

export function PreferenceDashboard({ insights, onResetPreferences }: PreferenceDashboardProps) {
  const acceptanceData = [
    { name: 'Accepted', value: insights.acceptanceRate * 100 },
    { name: 'Rejected', value: (1 - insights.acceptanceRate) * 100 },
  ];

  const typeData = Object.entries(insights.typePreferences).map(([type, stats]) => ({
    type,
    accepted: stats.accept,
    rejected: stats.reject,
    total: stats.accept + stats.reject,
  }));

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decisions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalDecisions}</div>
            <p className="text-xs text-muted-foreground">
              Changes reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(insights.acceptanceRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of suggested changes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Accepted</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {insights.mostAccepted[0] || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Change type
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart width={300} height={200}>
              <Pie
                data={acceptanceData}
                cx={150}
                cy={100}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {acceptanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={300} height={200} data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="accepted" fill="#10b981" />
              <Bar dataKey="rejected" fill="#ef4444" />
            </BarChart>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">You tend to accept:</h4>
              <div className="flex flex-wrap gap-2">
                {insights.mostAccepted.map(type => (
                  <span key={type} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">You tend to reject:</h4>
              <div className="flex flex-wrap gap-2">
                {insights.mostRejected.map(type => (
                  <span key={type} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-4">
                The system is learning your preferences to make better suggestions and automate repetitive decisions.
              </p>
              <button
                onClick={onResetPreferences}
                className="text-sm text-red-600 hover:underline"
              >
                Reset all preferences
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Day 11: Integration & Testing

### Morning (4 hours)
Integrate Tinder UI with cleanup service:

```typescript
// Integration code that connects the swipe interface with the backend processing
```

### Afternoon (4 hours)
Comprehensive testing of the new features:

```typescript
// Test suites for Tinder UI and LLM router
```

## Day 12-14: Refinement

### Day 12
- Performance optimization
- Edge case handling
- UI polish

### Day 13
- User testing
- Bug fixes
- Documentation

### Day 14
- Deploy updates
- Monitor performance
- Gather feedback

## Key Features Delivered

✅ **Tinder Interface**
- Swipeable cards for code changes
- Keyboard shortcuts
- Progress tracking
- Undo functionality
- Auto-mode based on preferences

✅ **Progressive LLM Router**
- Ollama → OpenAI → Anthropic fallback
- Cost tracking and limits
- Complexity-based routing
- Hybrid mode for better accuracy
- Confidence thresholds

✅ **Learning System**
- Pattern recognition
- Preference learning
- Auto-apply rules
- Insights dashboard
- ML-based predictions

## Next Steps

1. **Expand Services** (Week 3)
   - Documentation generator
   - API generator
   - Test generator

2. **Enterprise Features** (Week 4)
   - Team accounts
   - SSO authentication
   - Admin dashboard

3. **Advanced Features**
   - Real-time collaboration
   - CI/CD integration
   - Custom rule creation
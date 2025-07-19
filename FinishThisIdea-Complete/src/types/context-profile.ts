export interface ContextProfile {
  id: string;
  name: string;
  description: string;
  language?: string;
  framework?: string;
  version?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDefault?: boolean;
  userId?: string; // null for system defaults
  
  // Coding style preferences
  style: {
    indentation: 'spaces' | 'tabs';
    indentSize: number;
    lineEnding: 'lf' | 'crlf' | 'auto';
    quoteStyle: 'single' | 'double' | 'auto';
    semicolons: boolean;
    trailingComma: 'none' | 'es5' | 'all';
    bracketSpacing: boolean;
    arrowParens: 'always' | 'avoid';
    maxLineLength?: number;
  };
  
  // Code organization rules
  rules: {
    naming: {
      functions: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
      variables: 'camelCase' | 'snake_case' | 'PascalCase' | 'CONSTANT_CASE';
      constants: 'UPPER_SNAKE' | 'camelCase' | 'PascalCase';
      classes: 'PascalCase' | 'snake_case';
      interfaces?: 'PascalCase' | 'IPascalCase';
      files: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';
    };
    imports: {
      orderBy: 'alphabetical' | 'grouped' | 'custom';
      groups?: string[]; // e.g., ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']
      removeUnused: boolean;
      addMissing: boolean;
      preferRelative: boolean;
    };
    comments: {
      style: 'line' | 'block' | 'jsdoc';
      requireForPublicApi: boolean;
      removeRedundant: boolean;
      preserveTodos: boolean;
    };
  };
  
  // AI behavior customization
  aiContext: {
    systemPrompt?: string;
    additionalContext?: string;
    tone: 'professional' | 'casual' | 'educational' | 'concise';
    priorities: string[]; // e.g., ['readability', 'performance', 'maintainability']
    avoidPatterns?: string[];
    preferredPatterns?: string[];
    exampleCode?: string; // Example of preferred style
    focusAreas?: string[]; // e.g., ['error-handling', 'type-safety', 'documentation']
  };
  
  // Framework-specific settings
  frameworkConfig?: {
    react?: {
      componentStyle: 'functional' | 'class' | 'mixed';
      hooksRules: boolean;
      propTypesOrTypeScript: 'prop-types' | 'typescript' | 'both';
    };
    vue?: {
      apiStyle: 'options' | 'composition';
      scriptSetup: boolean;
    };
    angular?: {
      standalone: boolean;
      strictTemplates: boolean;
    };
    node?: {
      moduleSystem: 'commonjs' | 'esm';
      asyncStyle: 'callbacks' | 'promises' | 'async-await';
    };
    python?: {
      version: '2.7' | '3.x';
      typeHints: boolean;
      docstringStyle: 'google' | 'numpy' | 'sphinx';
    };
  };
  
  // Quality thresholds
  quality?: {
    maxComplexity?: number;
    maxFileLength?: number;
    maxFunctionLength?: number;
    requireTests?: boolean;
    coverageThreshold?: number;
  };
}

// Validation schema using Zod
import { z } from 'zod';

export const contextProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  language: z.string().optional(),
  framework: z.string().optional(),
  version: z.string().optional(),
  isDefault: z.boolean().optional(),
  userId: z.string().uuid().optional(),
  
  style: z.object({
    indentation: z.enum(['spaces', 'tabs']),
    indentSize: z.number().min(1).max(8),
    lineEnding: z.enum(['lf', 'crlf', 'auto']),
    quoteStyle: z.enum(['single', 'double', 'auto']),
    semicolons: z.boolean(),
    trailingComma: z.enum(['none', 'es5', 'all']),
    bracketSpacing: z.boolean(),
    arrowParens: z.enum(['always', 'avoid']),
    maxLineLength: z.number().min(40).max(200).optional(),
  }),
  
  rules: z.object({
    naming: z.object({
      functions: z.enum(['camelCase', 'snake_case', 'PascalCase', 'kebab-case']),
      variables: z.enum(['camelCase', 'snake_case', 'PascalCase', 'CONSTANT_CASE']),
      constants: z.enum(['UPPER_SNAKE', 'camelCase', 'PascalCase']),
      classes: z.enum(['PascalCase', 'snake_case']),
      interfaces: z.enum(['PascalCase', 'IPascalCase']).optional(),
      files: z.enum(['camelCase', 'snake_case', 'kebab-case', 'PascalCase']),
    }),
    imports: z.object({
      orderBy: z.enum(['alphabetical', 'grouped', 'custom']),
      groups: z.array(z.string()).optional(),
      removeUnused: z.boolean(),
      addMissing: z.boolean(),
      preferRelative: z.boolean(),
    }),
    comments: z.object({
      style: z.enum(['line', 'block', 'jsdoc']),
      requireForPublicApi: z.boolean(),
      removeRedundant: z.boolean(),
      preserveTodos: z.boolean(),
    }),
  }),
  
  aiContext: z.object({
    systemPrompt: z.string().optional(),
    additionalContext: z.string().optional(),
    tone: z.enum(['professional', 'casual', 'educational', 'concise']),
    priorities: z.array(z.string()),
    avoidPatterns: z.array(z.string()).optional(),
    preferredPatterns: z.array(z.string()).optional(),
    exampleCode: z.string().optional(),
    focusAreas: z.array(z.string()).optional(),
  }),
  
  frameworkConfig: z.object({
    react: z.object({
      componentStyle: z.enum(['functional', 'class', 'mixed']),
      hooksRules: z.boolean(),
      propTypesOrTypeScript: z.enum(['prop-types', 'typescript', 'both']),
    }).optional(),
    vue: z.object({
      apiStyle: z.enum(['options', 'composition']),
      scriptSetup: z.boolean(),
    }).optional(),
    angular: z.object({
      standalone: z.boolean(),
      strictTemplates: z.boolean(),
    }).optional(),
    node: z.object({
      moduleSystem: z.enum(['commonjs', 'esm']),
      asyncStyle: z.enum(['callbacks', 'promises', 'async-await']),
    }).optional(),
    python: z.object({
      version: z.enum(['2.7', '3.x']),
      typeHints: z.boolean(),
      docstringStyle: z.enum(['google', 'numpy', 'sphinx']),
    }).optional(),
  }).optional(),
  
  quality: z.object({
    maxComplexity: z.number().optional(),
    maxFileLength: z.number().optional(),
    maxFunctionLength: z.number().optional(),
    requireTests: z.boolean().optional(),
    coverageThreshold: z.number().min(0).max(100).optional(),
  }).optional(),
});

export type ContextProfileInput = z.infer<typeof contextProfileSchema>;
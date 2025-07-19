/**
 * Type definitions for {{name}} service
 */

// Job data structure
export interface JobData {
  id: string;
  userId: string;
  data: {
    {{#each dataFields}}
    {{this.name}}{{#if this.optional}}?{{/if}}: {{this.type}};
    {{/each}}
    [key: string]: any;
  };
  webhookUrl?: string;
  priority?: 'low' | 'normal' | 'high';
}

// Job result structure
export interface JobResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    processingTime: number;
    aiProvider?: string;
    model?: string;
    tokensUsed?: number;
    cost?: number;
  };
  warnings?: string[];
}

// Service configuration
export interface {{pascalCase name}}Config {
  {{#each configFields}}
  {{this.name}}: {{this.type}};
  {{/each}}
  maxFileSize: number; // MB
  maxProcessingTime: number; // minutes
  enableCaching: boolean;
  cacheExpiry: number; // seconds
}

// Processing options
export interface ProcessOptions {
  onProgress?: (percent: number, message?: string) => Promise<void>;
  signal?: AbortSignal;
  priority?: 'low' | 'normal' | 'high';
  skipValidation?: boolean;
  skipCache?: boolean;
}

// Processing result
export interface ProcessResult {
  success: boolean;
  data: any;
  metadata: {
    processingTime: number;
    aiProvider: string;
    model: string;
    tokensUsed: number;
    cost: number;
    [key: string]: any;
  };
  warnings?: string[];
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Database job record
export interface JobRecord {
  id: string;
  userId: string;
  type: string;
  status: JobStatus;
  input: any;
  output?: any;
  outputUrl?: string;
  progress?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
    attempts?: number;
  };
  metadata?: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// Job status enum
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// API request bodies
export interface Create{{pascalCase name}}Request {
  {{#each requiredFields}}
  {{this}}: {{lookup ../fieldTypes this}};
  {{/each}}
  {{#each optionalFields}}
  {{this}}?: {{lookup ../fieldTypes this}};
  {{/each}}
  webhookUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

// API response bodies
export interface {{pascalCase name}}Response {
  success: boolean;
  data?: {
    id: string;
    status: JobStatus;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface {{pascalCase name}}ListResponse {
  success: boolean;
  data: {
    jobs: Array<{
      id: string;
      status: JobStatus;
      progress: number;
      createdAt: Date;
      completedAt?: Date;
      error?: any;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

// Webhook payloads
export interface WebhookPayload {
  event: WebhookEvent;
  jobId: string;
  timestamp: string;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

export enum WebhookEvent {
  JOB_STARTED = 'job.started',
  JOB_PROGRESS = 'job.progress',
  JOB_COMPLETED = 'job.completed',
  JOB_FAILED = 'job.failed',
  JOB_CANCELLED = 'job.cancelled',
}

// AI routing types
export interface AIRoutingOptions {
  requireConfidence: number;
  hybridThreshold: number;
  maxRetries: number;
  timeout: number;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  confidence: number;
  latency: number;
}

{{#if hasCustomTypes}}
// Custom types for {{name}}
{{customTypes}}
{{/if}}

// Error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  AI_ERROR: 'AI_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  WEBHOOK_ERROR: 'WEBHOOK_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
  {{#each customErrorCodes}}
  {{this.code}}: '{{this.code}}',
  {{/each}}
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
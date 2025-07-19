/**
 * OpenAPI 3.0 Generator Service
 * Converts existing API documentation to OpenAPI specs
 */

import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger';

export interface APIEndpoint {
  method: string;
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
  security?: OpenAPISecurity[];
}

export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: OpenAPISchema;
  example?: any;
}

export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, {
    schema: OpenAPISchema;
    example?: any;
  }>;
}

export interface OpenAPIResponse {
  description: string;
  content?: Record<string, {
    schema: OpenAPISchema;
    example?: any;
  }>;
  headers?: Record<string, OpenAPIHeader>;
}

export interface OpenAPIHeader {
  description?: string;
  schema: OpenAPISchema;
}

export interface OpenAPISchema {
  type?: string;
  format?: string;
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  example?: any;
  enum?: any[];
  $ref?: string;
}

export interface OpenAPISecurity {
  [key: string]: string[];
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name: string;
      url: string;
      email: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, any>>;
  components: {
    schemas: Record<string, OpenAPISchema>;
    securitySchemes: Record<string, any>;
    responses?: Record<string, OpenAPIResponse>;
    parameters?: Record<string, OpenAPIParameter>;
  };
  security: OpenAPISecurity[];
  tags: Array<{
    name: string;
    description: string;
  }>;
}

export class OpenAPIGeneratorService {
  private spec: OpenAPISpec;
  private routes: Map<string, APIEndpoint[]> = new Map();

  constructor() {
    this.spec = this.createBaseSpec();
  }

  /**
   * Create base OpenAPI specification
   */
  private createBaseSpec(): OpenAPISpec {
    return {
      openapi: '3.0.3',
      info: {
        title: 'FinishThisIdea Platform API',
        description: 'Complete AI Innovation Platform API with code cleanup, agent orchestration, and marketplace features',
        version: '1.0.0',
        contact: {
          name: 'FinishThisIdea Team',
          url: 'https://finishthisidea.com',
          email: 'support@finishthisidea.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: process.env.API_BASE_URL || 'http://localhost:8080',
          description: 'Development server'
        },
        {
          url: 'https://api.finishthisidea.com',
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: this.createBaseSchemas(),
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key'
          }
        },
        responses: this.createCommonResponses(),
        parameters: this.createCommonParameters()
      },
      security: [
        { BearerAuth: [] },
        { ApiKeyAuth: [] }
      ],
      tags: [
        { name: 'Authentication', description: 'User authentication and authorization' },
        { name: 'API Keys', description: 'API key management' },
        { name: 'Jobs', description: 'Code cleanup job management' },
        { name: 'Uploads', description: 'File upload operations' },
        { name: 'Payments', description: 'Payment processing' },
        { name: 'Profiles', description: 'User profile management' },
        { name: 'Monitoring', description: 'System monitoring and health checks' },
        { name: 'Webhooks', description: 'Webhook management' },
        { name: 'QR Codes', description: 'QR code generation and management' },
        { name: 'Trust Tiers', description: 'Trust tier management' },
        { name: 'Viral', description: 'Viral growth and social features' },
        { name: 'AI', description: 'AI services and orchestration' }
      ]
    };
  }

  /**
   * Create base schemas for common data types
   */
  private createBaseSchemas(): Record<string, OpenAPISchema> {
    return {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          tier: { type: 'string', enum: ['FREE', 'PREMIUM', 'ENTERPRISE'] },
          credits: { type: 'integer', minimum: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'email', 'tier', 'createdAt']
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEW', 'APPLYING', 'CANCELLED'] },
          originalFilename: { type: 'string' },
          cleanupFilename: { type: 'string' },
          downloadUrl: { type: 'string', format: 'uri' },
          cost: { type: 'number', format: 'float', minimum: 0 },
          metadata: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'email', 'status', 'createdAt']
      },
      ApiKey: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          key: { type: 'string' },
          tier: { type: 'string', enum: ['FREE', 'PREMIUM', 'ENTERPRISE'] },
          isActive: { type: 'boolean' },
          lastUsed: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'name', 'tier', 'isActive', 'createdAt']
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          stripePaymentIntentId: { type: 'string' },
          amount: { type: 'integer', minimum: 0 },
          currency: { type: 'string', example: 'USD' },
          status: { type: 'string', enum: ['pending', 'succeeded', 'failed'] },
          metadata: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'amount', 'currency', 'status', 'createdAt']
      },
      Upload: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          originalName: { type: 'string' },
          filename: { type: 'string' },
          mimeType: { type: 'string' },
          size: { type: 'integer', minimum: 0 },
          path: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
          metadata: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'originalName', 'filename', 'size', 'status', 'createdAt']
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            },
            required: ['code', 'message']
          }
        },
        required: ['success', 'error']
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' }
        },
        required: ['success']
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number' },
          services: {
            type: 'object',
            properties: {
              database: { type: 'string', enum: ['healthy', 'unhealthy'] },
              redis: { type: 'string', enum: ['healthy', 'unhealthy'] },
              storage: { type: 'string', enum: ['healthy', 'unhealthy'] }
            }
          },
          version: { type: 'string' }
        },
        required: ['status', 'timestamp']
      }
    };
  }

  /**
   * Create common response templates
   */
  private createCommonResponses(): Record<string, OpenAPIResponse> {
    return {
      Success: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Success' }
          }
        }
      },
      BadRequest: {
        description: 'Bad request - invalid input',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'BAD_REQUEST',
                message: 'Invalid request parameters'
              }
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized - authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              }
            }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found'
              }
            }
          }
        }
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests'
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred'
              }
            }
          }
        }
      }
    };
  }

  /**
   * Create common parameters
   */
  private createCommonParameters(): Record<string, OpenAPIParameter> {
    return {
      PageNumber: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      PageSize: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      },
      SortBy: {
        name: 'sortBy',
        in: 'query',
        description: 'Field to sort by',
        required: false,
        schema: { type: 'string', example: 'createdAt' }
      },
      SortOrder: {
        name: 'sortOrder',
        in: 'query',
        description: 'Sort order',
        required: false,
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
      }
    };
  }

  /**
   * Register API endpoint
   */
  registerEndpoint(endpoint: APIEndpoint): void {
    const normalizedPath = this.normalizePath(endpoint.path);
    
    if (!this.routes.has(normalizedPath)) {
      this.routes.set(normalizedPath, []);
    }
    
    this.routes.get(normalizedPath)!.push(endpoint);
    this.addPathToSpec(endpoint);
  }

  /**
   * Normalize path for OpenAPI (convert Express params to OpenAPI format)
   */
  private normalizePath(path: string): string {
    return path.replace(/:([^/]+)/g, '{$1}');
  }

  /**
   * Add path to OpenAPI spec
   */
  private addPathToSpec(endpoint: APIEndpoint): void {
    const normalizedPath = this.normalizePath(endpoint.path);
    const method = endpoint.method.toLowerCase();

    if (!this.spec.paths[normalizedPath]) {
      this.spec.paths[normalizedPath] = {};
    }

    this.spec.paths[normalizedPath][method] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags || ['General'],
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: {
        ...endpoint.responses,
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
        '429': { $ref: '#/components/responses/TooManyRequests' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      },
      security: endpoint.security || this.spec.security
    };
  }

  /**
   * Auto-discover endpoints from Express router
   */
  discoverEndpoints(router: Router, basePath: string = ''): void {
    // This is a simplified version - in production you'd want more sophisticated route discovery
    const routes = (router as any).stack;
    
    routes.forEach((layer: any) => {
      if (layer.route) {
        const path = basePath + layer.route.path;
        const methods = Object.keys(layer.route.methods);
        
        methods.forEach(method => {
          if (method !== '_all') {
            // Auto-generate basic documentation
            this.registerEndpoint({
              method: method.toUpperCase(),
              path,
              summary: `${method.toUpperCase()} ${path}`,
              description: `Auto-generated documentation for ${method.toUpperCase()} ${path}`,
              tags: this.inferTags(path),
              responses: {
                '200': {
                  description: 'Successful operation',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Success' }
                    }
                  }
                }
              }
            });
          }
        });
      }
    });
  }

  /**
   * Infer tags from path
   */
  private inferTags(path: string): string[] {
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 1 && segments[0] === 'api') {
      const resourceName = segments[1];
      return [this.capitalizeFirst(resourceName)];
    }
    return ['General'];
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate OpenAPI specification
   */
  generateSpec(): OpenAPISpec {
    return { ...this.spec };
  }

  /**
   * Generate OpenAPI specification as JSON string
   */
  generateJSON(): string {
    return JSON.stringify(this.spec, null, 2);
  }

  /**
   * Generate OpenAPI specification as YAML string
   */
  generateYAML(): string {
    const yaml = require('js-yaml');
    return yaml.dump(this.spec, { 
      indent: 2,
      lineWidth: 120,
      noRefs: true 
    });
  }

  /**
   * Save specification to file
   */
  async saveToFile(filePath: string, format: 'json' | 'yaml' = 'json'): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const content = format === 'yaml' ? this.generateYAML() : this.generateJSON();
    await fs.writeFile(filePath, content, 'utf8');
    
    logger.info('OpenAPI specification saved', { filePath, format });
  }

  /**
   * Import existing API documentation
   */
  importExistingDocs(docsData: any): void {
    // Convert existing documentation format to OpenAPI endpoints
    if (docsData.endpoints) {
      docsData.endpoints.forEach((endpoint: any) => {
        this.registerEndpoint({
          method: endpoint.method,
          path: endpoint.path,
          summary: endpoint.summary || endpoint.description,
          description: endpoint.description,
          tags: endpoint.tags || this.inferTags(endpoint.path),
          parameters: this.convertParameters(endpoint.parameters),
          requestBody: this.convertRequestBody(endpoint.requestBody),
          responses: this.convertResponses(endpoint.responses)
        });
      });
    }
  }

  /**
   * Convert parameters to OpenAPI format
   */
  private convertParameters(params: any[]): OpenAPIParameter[] | undefined {
    if (!params) return undefined;
    
    return params.map(param => ({
      name: param.name,
      in: param.in || 'query',
      description: param.description,
      required: param.required || false,
      schema: param.schema || { type: 'string' }
    }));
  }

  /**
   * Convert request body to OpenAPI format
   */
  private convertRequestBody(body: any): OpenAPIRequestBody | undefined {
    if (!body) return undefined;
    
    return {
      description: body.description,
      required: body.required || false,
      content: {
        'application/json': {
          schema: body.schema || { type: 'object' },
          example: body.example
        }
      }
    };
  }

  /**
   * Convert responses to OpenAPI format
   */
  private convertResponses(responses: any): Record<string, OpenAPIResponse> {
    if (!responses) {
      return {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' }
            }
          }
        }
      };
    }
    
    const converted: Record<string, OpenAPIResponse> = {};
    Object.entries(responses).forEach(([status, response]: [string, any]) => {
      converted[status] = {
        description: response.description || 'Response',
        content: response.content || {
          'application/json': {
            schema: response.schema || { type: 'object' },
            example: response.example
          }
        }
      };
    });
    
    return converted;
  }

  /**
   * Add custom schema
   */
  addSchema(name: string, schema: OpenAPISchema): void {
    this.spec.components.schemas[name] = schema;
  }

  /**
   * Get registered endpoints count
   */
  getEndpointsCount(): number {
    let count = 0;
    this.routes.forEach(endpoints => {
      count += endpoints.length;
    });
    return count;
  }

  /**
   * Get spec statistics
   */
  getStats(): {
    paths: number;
    endpoints: number;
    schemas: number;
    tags: number;
  } {
    return {
      paths: Object.keys(this.spec.paths).length,
      endpoints: this.getEndpointsCount(),
      schemas: Object.keys(this.spec.components.schemas).length,
      tags: this.spec.tags.length
    };
  }
}

// Export singleton instance
export const openApiGenerator = new OpenAPIGeneratorService();
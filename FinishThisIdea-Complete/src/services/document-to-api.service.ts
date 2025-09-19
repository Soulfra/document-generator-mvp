/**
 * Document to API Spec Converter Service
 * Converts various document formats into OpenAPI specifications
 */

import { logger } from '../utils/logger';
import { aiService } from './ai.service';
import { openApiGenerator } from './docs/openapi-generator.service';
import { analyticsService } from './analytics.service';
import * as yaml from 'js-yaml';
import * as marked from 'marked';
import { OpenAPISpec, APIEndpoint, OpenAPISchema } from './docs/openapi-generator.service';

export interface DocumentSource {
  type: 'markdown' | 'text' | 'json' | 'yaml' | 'html' | 'pdf' | 'chat';
  content: string;
  metadata?: {
    title?: string;
    author?: string;
    version?: string;
    source?: string;
  };
}

export interface ExtractedAPIInfo {
  title: string;
  description: string;
  version: string;
  baseUrl?: string;
  endpoints: Array<{
    method: string;
    path: string;
    summary: string;
    description?: string;
    parameters?: Array<{
      name: string;
      type: string;
      location: 'path' | 'query' | 'header' | 'body';
      required: boolean;
      description?: string;
    }>;
    requestBody?: {
      type: string;
      schema: any;
      example?: any;
    };
    responses?: Record<string, {
      description: string;
      schema?: any;
      example?: any;
    }>;
    authentication?: string[];
  }>;
  models?: Record<string, {
    properties: Record<string, any>;
    required?: string[];
    description?: string;
  }>;
  authentication?: {
    type: 'apiKey' | 'bearer' | 'oauth2' | 'basic';
    description?: string;
    location?: string;
  }[];
}

export interface ConversionOptions {
  includeExamples?: boolean;
  generateSDK?: boolean;
  validateSpec?: boolean;
  enrichWithAI?: boolean;
  targetVersion?: '3.0' | '3.1';
}

export class DocumentToAPIService {
  private patterns = {
    endpoint: /(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+([\/\w\{\}:-]+)/gi,
    path: /^[\/\w\{\}:-]+$/,
    parameter: /\{([^}]+)\}/g,
    jsonBlock: /```json\s*([\s\S]*?)```/g,
    codeBlock: /```(\w+)?\s*([\s\S]*?)```/g,
    httpStatus: /\b([1-5]\d{2})\b/g,
    authentication: /(?:auth|authentication|authorization|api[- ]?key|bearer|token|oauth)/i
  };

  /**
   * Convert document to API specification
   */
  async convertToAPISpec(
    document: DocumentSource,
    options: ConversionOptions = {}
  ): Promise<OpenAPISpec> {
    logger.info('Converting document to API spec', { 
      type: document.type,
      contentLength: document.content.length 
    });

    try {
      // Extract API information from document
      const apiInfo = await this.extractAPIInfo(document, options);

      // Convert to OpenAPI format
      const spec = this.buildOpenAPISpec(apiInfo, options);

      // Validate spec if requested
      if (options.validateSpec) {
        await this.validateSpec(spec);
      }

      // Track conversion
      await analyticsService.trackEvent({
        name: 'document_to_api_conversion',
        properties: {
          documentType: document.type,
          endpointCount: apiInfo.endpoints.length,
          modelCount: Object.keys(apiInfo.models || {}).length,
          options
        }
      });

      return spec;
    } catch (error) {
      logger.error('Failed to convert document to API spec', { error });
      throw error;
    }
  }

  /**
   * Extract API information from document
   */
  private async extractAPIInfo(
    document: DocumentSource,
    options: ConversionOptions
  ): Promise<ExtractedAPIInfo> {
    let apiInfo: ExtractedAPIInfo;

    // Use different extraction strategies based on document type
    switch (document.type) {
      case 'json':
        apiInfo = this.extractFromJSON(document.content);
        break;
      
      case 'yaml':
        apiInfo = this.extractFromYAML(document.content);
        break;
      
      case 'markdown':
        apiInfo = await this.extractFromMarkdown(document.content);
        break;
      
      case 'chat':
        apiInfo = await this.extractFromChat(document.content);
        break;
      
      default:
        apiInfo = await this.extractFromText(document.content);
    }

    // Enrich with AI if requested
    if (options.enrichWithAI) {
      apiInfo = await this.enrichWithAI(apiInfo, document);
    }

    // Apply metadata
    if (document.metadata) {
      apiInfo.title = document.metadata.title || apiInfo.title;
      apiInfo.version = document.metadata.version || apiInfo.version;
    }

    return apiInfo;
  }

  /**
   * Extract from JSON document
   */
  private extractFromJSON(content: string): ExtractedAPIInfo {
    try {
      const data = JSON.parse(content);
      
      // Check if it's already in a structured format
      if (data.openapi || data.swagger) {
        return this.convertFromOpenAPI(data);
      }

      // Extract from custom JSON format
      return {
        title: data.title || 'API Documentation',
        description: data.description || '',
        version: data.version || '1.0.0',
        baseUrl: data.baseUrl || data.host,
        endpoints: this.extractEndpointsFromJSON(data),
        models: data.models || data.definitions || {},
        authentication: this.extractAuthFromJSON(data)
      };
    } catch (error) {
      logger.error('Failed to parse JSON', { error });
      throw new Error('Invalid JSON document');
    }
  }

  /**
   * Extract from YAML document
   */
  private extractFromYAML(content: string): ExtractedAPIInfo {
    try {
      const data = yaml.load(content) as any;
      
      // Similar to JSON extraction
      if (data.openapi || data.swagger) {
        return this.convertFromOpenAPI(data);
      }

      return {
        title: data.title || 'API Documentation',
        description: data.description || '',
        version: data.version || '1.0.0',
        baseUrl: data.baseUrl || data.host,
        endpoints: this.extractEndpointsFromJSON(data),
        models: data.models || data.definitions || {},
        authentication: this.extractAuthFromJSON(data)
      };
    } catch (error) {
      logger.error('Failed to parse YAML', { error });
      throw new Error('Invalid YAML document');
    }
  }

  /**
   * Extract from Markdown document
   */
  private async extractFromMarkdown(content: string): Promise<ExtractedAPIInfo> {
    const tokens = marked.lexer(content);
    const apiInfo: ExtractedAPIInfo = {
      title: 'API Documentation',
      description: '',
      version: '1.0.0',
      endpoints: [],
      models: {}
    };

    let currentEndpoint: any = null;
    let inEndpointSection = false;

    for (const token of tokens) {
      if (token.type === 'heading') {
        // Check for API title
        if (token.depth === 1 && !apiInfo.title) {
          apiInfo.title = token.text;
        }

        // Check for endpoint headers (e.g., "GET /users")
        const endpointMatch = token.text.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+([\/\w\{\}:-]+)/i);
        if (endpointMatch) {
          if (currentEndpoint) {
            apiInfo.endpoints.push(currentEndpoint);
          }
          currentEndpoint = {
            method: endpointMatch[1].toUpperCase(),
            path: endpointMatch[2],
            summary: '',
            description: '',
            parameters: [],
            responses: {}
          };
          inEndpointSection = true;
        } else if (token.text.toLowerCase().includes('model') || token.text.toLowerCase().includes('schema')) {
          inEndpointSection = false;
        }
      } else if (token.type === 'paragraph' && inEndpointSection && currentEndpoint) {
        if (!currentEndpoint.summary) {
          currentEndpoint.summary = token.text;
        } else {
          currentEndpoint.description += token.text + '\n';
        }
      } else if (token.type === 'code' && currentEndpoint) {
        // Extract request/response examples
        try {
          const data = JSON.parse(token.text);
          if (token.lang === 'json' || !token.lang) {
            // Guess if it's request or response based on content
            if (this.looksLikeRequest(data)) {
              currentEndpoint.requestBody = {
                type: 'object',
                schema: this.inferSchema(data),
                example: data
              };
            } else {
              currentEndpoint.responses['200'] = {
                description: 'Successful response',
                schema: this.inferSchema(data),
                example: data
              };
            }
          }
        } catch (e) {
          // Not JSON, might be schema or other code
        }
      } else if (token.type === 'table' && currentEndpoint) {
        // Extract parameters from tables
        const params = this.extractParametersFromTable(token);
        currentEndpoint.parameters.push(...params);
      }
    }

    // Don't forget the last endpoint
    if (currentEndpoint) {
      apiInfo.endpoints.push(currentEndpoint);
    }

    // Extract models from code blocks
    apiInfo.models = await this.extractModelsFromMarkdown(content);

    return apiInfo;
  }

  /**
   * Extract from chat conversation
   */
  private async extractFromChat(content: string): Promise<ExtractedAPIInfo> {
    // Use AI to analyze chat and extract API information
    const prompt = `
      Analyze this chat conversation and extract API documentation.
      Look for:
      1. API endpoints (method + path)
      2. Request/response examples
      3. Parameters and their types
      4. Authentication methods
      5. Data models/schemas
      
      Return a structured JSON with the extracted information.
      
      Chat content:
      ${content}
    `;

    const result = await aiService.complete(prompt);
    
    try {
      return JSON.parse(result);
    } catch (error) {
      // Fallback to text extraction
      return this.extractFromText(content);
    }
  }

  /**
   * Extract from plain text
   */
  private async extractFromText(content: string): Promise<ExtractedAPIInfo> {
    const apiInfo: ExtractedAPIInfo = {
      title: 'API Documentation',
      description: '',
      version: '1.0.0',
      endpoints: [],
      models: {}
    };

    // Find all endpoint mentions
    const endpointMatches = Array.from(content.matchAll(this.patterns.endpoint));
    
    for (const match of endpointMatches) {
      const method = match[0].split(/\s+/)[0].toUpperCase();
      const path = match[1];
      
      // Extract context around the endpoint
      const startIndex = Math.max(0, match.index! - 200);
      const endIndex = Math.min(content.length, match.index! + match[0].length + 500);
      const context = content.substring(startIndex, endIndex);
      
      // Extract parameters from path
      const parameters = this.extractPathParameters(path);
      
      // Look for JSON examples in context
      const jsonExamples = this.extractJSONExamples(context);
      
      apiInfo.endpoints.push({
        method,
        path,
        summary: this.extractSummary(context),
        description: this.extractDescription(context),
        parameters,
        requestBody: jsonExamples.request ? {
          type: 'object',
          schema: this.inferSchema(jsonExamples.request),
          example: jsonExamples.request
        } : undefined,
        responses: jsonExamples.response ? {
          '200': {
            description: 'Successful response',
            schema: this.inferSchema(jsonExamples.response),
            example: jsonExamples.response
          }
        } : {}
      });
    }

    // Extract authentication info
    if (this.patterns.authentication.test(content)) {
      apiInfo.authentication = this.extractAuthenticationInfo(content);
    }

    return apiInfo;
  }

  /**
   * Enrich API info with AI
   */
  private async enrichWithAI(
    apiInfo: ExtractedAPIInfo,
    document: DocumentSource
  ): Promise<ExtractedAPIInfo> {
    const prompt = `
      Enhance this API documentation with:
      1. Better descriptions for endpoints
      2. Missing parameters or response codes
      3. Proper data types and schemas
      4. Security considerations
      5. Rate limiting information
      
      Current API info:
      ${JSON.stringify(apiInfo, null, 2)}
      
      Original document excerpt:
      ${document.content.substring(0, 2000)}
      
      Return enhanced API info as JSON.
    `;

    try {
      const enhanced = await aiService.complete(prompt);
      const enrichedInfo = JSON.parse(enhanced);
      
      // Merge AI enhancements with original
      return {
        ...apiInfo,
        ...enrichedInfo,
        endpoints: this.mergeEndpoints(apiInfo.endpoints, enrichedInfo.endpoints || [])
      };
    } catch (error) {
      logger.error('Failed to enrich with AI', { error });
      return apiInfo;
    }
  }

  /**
   * Build OpenAPI specification
   */
  private buildOpenAPISpec(
    apiInfo: ExtractedAPIInfo,
    options: ConversionOptions
  ): OpenAPISpec {
    const spec = openApiGenerator.generateSpec();
    
    // Update basic info
    spec.info.title = apiInfo.title;
    spec.info.description = apiInfo.description;
    spec.info.version = apiInfo.version;
    
    // Update servers if baseUrl provided
    if (apiInfo.baseUrl) {
      spec.servers = [{
        url: apiInfo.baseUrl,
        description: 'API server'
      }];
    }
    
    // Clear existing paths
    spec.paths = {};
    
    // Add endpoints
    for (const endpoint of apiInfo.endpoints) {
      const path = this.normalizePath(endpoint.path);
      
      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }
      
      spec.paths[path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: this.convertParameters(endpoint.parameters),
        requestBody: endpoint.requestBody ? {
          required: true,
          content: {
            'application/json': {
              schema: endpoint.requestBody.schema,
              example: options.includeExamples ? endpoint.requestBody.example : undefined
            }
          }
        } : undefined,
        responses: this.convertResponses(endpoint.responses, options),
        security: endpoint.authentication ? [{
          BearerAuth: [],
          ApiKeyAuth: []
        }] : undefined
      };
    }
    
    // Add models/schemas
    if (apiInfo.models) {
      for (const [name, model] of Object.entries(apiInfo.models)) {
        spec.components.schemas[name] = {
          type: 'object',
          properties: model.properties,
          required: model.required,
          description: model.description
        };
      }
    }
    
    // Add authentication
    if (apiInfo.authentication) {
      spec.components.securitySchemes = this.convertAuthentication(apiInfo.authentication);
    }
    
    return spec;
  }

  /**
   * Helper methods
   */

  private convertFromOpenAPI(data: any): ExtractedAPIInfo {
    // Convert existing OpenAPI/Swagger to our format
    const endpoints: any[] = [];
    
    for (const [path, methods] of Object.entries(data.paths || {})) {
      for (const [method, operation] of Object.entries(methods as any)) {
        if (typeof operation === 'object') {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: operation.summary || '',
            description: operation.description || '',
            parameters: operation.parameters || [],
            requestBody: operation.requestBody,
            responses: operation.responses || {}
          });
        }
      }
    }
    
    return {
      title: data.info?.title || 'API Documentation',
      description: data.info?.description || '',
      version: data.info?.version || '1.0.0',
      baseUrl: data.servers?.[0]?.url,
      endpoints,
      models: data.components?.schemas || data.definitions || {}
    };
  }

  private extractEndpointsFromJSON(data: any): any[] {
    const endpoints: any[] = [];
    
    // Try different common formats
    if (data.endpoints) {
      return data.endpoints;
    }
    
    if (data.paths) {
      // OpenAPI format
      for (const [path, methods] of Object.entries(data.paths)) {
        for (const [method, details] of Object.entries(methods as any)) {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            ...details
          });
        }
      }
    }
    
    if (data.routes) {
      // Custom route format
      return data.routes;
    }
    
    return endpoints;
  }

  private extractAuthFromJSON(data: any): any[] {
    if (data.authentication) return data.authentication;
    if (data.securitySchemes) return Object.values(data.securitySchemes);
    if (data.security) return data.security;
    return [];
  }

  private looksLikeRequest(data: any): boolean {
    // Heuristic to determine if JSON is likely a request body
    const requestIndicators = ['password', 'username', 'email', 'name', 'create', 'update'];
    const responseIndicators = ['id', 'created', 'updated', 'status', 'success', 'data'];
    
    const json = JSON.stringify(data).toLowerCase();
    const requestScore = requestIndicators.filter(ind => json.includes(ind)).length;
    const responseScore = responseIndicators.filter(ind => json.includes(ind)).length;
    
    return requestScore > responseScore;
  }

  private inferSchema(data: any): any {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? this.inferSchema(data[0]) : { type: 'object' }
      };
    }
    
    if (data === null) {
      return { type: 'null' };
    }
    
    if (typeof data === 'object') {
      const properties: any = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(data)) {
        properties[key] = this.inferSchema(value);
        if (value !== null && value !== undefined) {
          required.push(key);
        }
      }
      
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };
    }
    
    // Primitive types
    if (typeof data === 'string') {
      // Check for specific formats
      if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
        return { type: 'string', format: 'date-time' };
      }
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data)) {
        return { type: 'string', format: 'email' };
      }
      if (/^https?:\/\//.test(data)) {
        return { type: 'string', format: 'uri' };
      }
      return { type: 'string' };
    }
    
    if (typeof data === 'number') {
      return Number.isInteger(data) ? { type: 'integer' } : { type: 'number' };
    }
    
    if (typeof data === 'boolean') {
      return { type: 'boolean' };
    }
    
    return { type: 'string' };
  }

  private extractParametersFromTable(token: any): any[] {
    const params: any[] = [];
    
    // Assume first row is headers
    const headers = token.header.map((h: any) => h.text.toLowerCase());
    const nameIndex = headers.findIndex((h: string) => h.includes('name') || h.includes('parameter'));
    const typeIndex = headers.findIndex((h: string) => h.includes('type'));
    const requiredIndex = headers.findIndex((h: string) => h.includes('required'));
    const descIndex = headers.findIndex((h: string) => h.includes('description'));
    
    for (const row of token.rows) {
      const param: any = {
        name: row[nameIndex]?.text || '',
        type: row[typeIndex]?.text || 'string',
        required: row[requiredIndex]?.text?.toLowerCase() === 'yes' || 
                  row[requiredIndex]?.text?.toLowerCase() === 'true',
        description: row[descIndex]?.text || ''
      };
      
      // Determine parameter location
      if (param.name.startsWith(':') || param.name.match(/\{.*\}/)) {
        param.location = 'path';
      } else {
        param.location = 'query';
      }
      
      params.push(param);
    }
    
    return params;
  }

  private extractModelsFromMarkdown(content: string): Record<string, any> {
    const models: Record<string, any> = {};
    const codeBlocks = content.match(this.patterns.codeBlock) || [];
    
    for (const block of codeBlocks) {
      // Look for TypeScript interfaces or JSON schemas
      if (block.includes('interface') || block.includes('type')) {
        // Parse TypeScript definitions
        const interfaceMatches = block.match(/interface\s+(\w+)\s*\{([^}]+)\}/g) || [];
        for (const match of interfaceMatches) {
          const name = match.match(/interface\s+(\w+)/)?.[1];
          if (name) {
            // Simplified parsing - in reality would use TypeScript AST
            models[name] = {
              type: 'object',
              properties: {},
              description: `Model ${name}`
            };
          }
        }
      }
    }
    
    return models;
  }

  private extractPathParameters(path: string): any[] {
    const params: any[] = [];
    const matches = Array.from(path.matchAll(this.patterns.parameter));
    
    for (const match of matches) {
      const paramName = match[1];
      params.push({
        name: paramName,
        type: 'string',
        location: 'path',
        required: true,
        description: `Path parameter ${paramName}`
      });
    }
    
    return params;
  }

  private extractJSONExamples(context: string): { request?: any; response?: any } {
    const examples: { request?: any; response?: any } = {};
    const jsonBlocks = Array.from(context.matchAll(this.patterns.jsonBlock));
    
    for (const block of jsonBlocks) {
      try {
        const json = JSON.parse(block[1]);
        
        // Check if it's before or after the endpoint mention
        const blockIndex = block.index || 0;
        const endpointIndex = context.search(this.patterns.endpoint);
        
        if (blockIndex < endpointIndex) {
          examples.request = json;
        } else {
          examples.response = json;
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }
    
    return examples;
  }

  private extractSummary(context: string): string {
    // Extract first sentence or line
    const lines = context.split('\n').filter(l => l.trim());
    for (const line of lines) {
      if (line.length > 10 && !line.match(this.patterns.endpoint)) {
        return line.split('.')[0].trim();
      }
    }
    return 'API endpoint';
  }

  private extractDescription(context: string): string {
    // Extract meaningful description
    const lines = context.split('\n').filter(l => l.trim());
    const description: string[] = [];
    
    for (const line of lines) {
      if (line.length > 20 && 
          !line.match(this.patterns.endpoint) && 
          !line.startsWith('#') &&
          !line.startsWith('```')) {
        description.push(line);
        if (description.length >= 3) break;
      }
    }
    
    return description.join(' ').trim();
  }

  private extractAuthenticationInfo(content: string): any[] {
    const auth: any[] = [];
    
    if (content.match(/api[- ]?key/i)) {
      auth.push({
        type: 'apiKey',
        description: 'API Key authentication',
        location: 'header'
      });
    }
    
    if (content.match(/bearer|jwt|token/i)) {
      auth.push({
        type: 'bearer',
        description: 'Bearer token authentication'
      });
    }
    
    if (content.match(/oauth|oauth2/i)) {
      auth.push({
        type: 'oauth2',
        description: 'OAuth 2.0 authentication'
      });
    }
    
    return auth;
  }

  private normalizePath(path: string): string {
    // Convert Express-style params to OpenAPI format
    return path.replace(/:([^/]+)/g, '{$1}');
  }

  private convertParameters(params: any[]): any[] {
    if (!params) return [];
    
    return params.map(param => ({
      name: param.name,
      in: param.location || 'query',
      description: param.description,
      required: param.required || false,
      schema: {
        type: this.mapType(param.type)
      }
    }));
  }

  private mapType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'integer': 'integer',
      'boolean': 'boolean',
      'array': 'array',
      'object': 'object',
      'date': 'string',
      'datetime': 'string',
      'email': 'string',
      'url': 'string'
    };
    
    return typeMap[type.toLowerCase()] || 'string';
  }

  private convertResponses(responses: any, options: ConversionOptions): any {
    if (!responses || Object.keys(responses).length === 0) {
      return {
        '200': {
          description: 'Successful operation'
        }
      };
    }
    
    const converted: any = {};
    
    for (const [status, response] of Object.entries(responses)) {
      converted[status] = {
        description: response.description || `Response ${status}`,
        content: response.schema ? {
          'application/json': {
            schema: response.schema,
            example: options.includeExamples ? response.example : undefined
          }
        } : undefined
      };
    }
    
    return converted;
  }

  private convertAuthentication(auth: any[]): any {
    const schemes: any = {};
    
    for (const method of auth) {
      switch (method.type) {
        case 'apiKey':
          schemes.ApiKeyAuth = {
            type: 'apiKey',
            in: method.location || 'header',
            name: 'x-api-key',
            description: method.description
          };
          break;
          
        case 'bearer':
          schemes.BearerAuth = {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: method.description
          };
          break;
          
        case 'oauth2':
          schemes.OAuth2 = {
            type: 'oauth2',
            description: method.description,
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://api.example.com/oauth/authorize',
                tokenUrl: 'https://api.example.com/oauth/token',
                scopes: {
                  read: 'Read access',
                  write: 'Write access'
                }
              }
            }
          };
          break;
          
        case 'basic':
          schemes.BasicAuth = {
            type: 'http',
            scheme: 'basic',
            description: method.description
          };
          break;
      }
    }
    
    return schemes;
  }

  private mergeEndpoints(original: any[], enhanced: any[]): any[] {
    const merged = [...original];
    const pathMap = new Map(original.map(e => [`${e.method}:${e.path}`, e]));
    
    for (const enhancedEndpoint of enhanced) {
      const key = `${enhancedEndpoint.method}:${enhancedEndpoint.path}`;
      const existing = pathMap.get(key);
      
      if (existing) {
        // Merge enhancements
        Object.assign(existing, {
          description: enhancedEndpoint.description || existing.description,
          parameters: [...(existing.parameters || []), ...(enhancedEndpoint.parameters || [])],
          responses: { ...existing.responses, ...enhancedEndpoint.responses }
        });
      } else {
        // New endpoint from AI
        merged.push(enhancedEndpoint);
      }
    }
    
    return merged;
  }

  private async validateSpec(spec: OpenAPISpec): Promise<void> {
    // Basic validation
    if (!spec.info.title) {
      throw new Error('API specification missing title');
    }
    
    if (!spec.info.version) {
      throw new Error('API specification missing version');
    }
    
    if (Object.keys(spec.paths).length === 0) {
      throw new Error('API specification has no endpoints');
    }
    
    // Validate paths
    for (const [path, methods] of Object.entries(spec.paths)) {
      if (!path.startsWith('/')) {
        throw new Error(`Invalid path: ${path} (must start with /)`);
      }
      
      // Validate methods
      for (const method of Object.keys(methods)) {
        if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
          throw new Error(`Invalid method: ${method} for path ${path}`);
        }
      }
    }
    
    logger.info('API specification validated successfully');
  }

  /**
   * Generate SDK from converted spec
   */
  async generateSDKFromSpec(spec: OpenAPISpec, languages: string[]): Promise<Record<string, string>> {
    const sdks: Record<string, string> = {};
    
    for (const language of languages) {
      try {
        const sdk = await this.generateSDK(spec, language);
        sdks[language] = sdk;
      } catch (error) {
        logger.error(`Failed to generate ${language} SDK`, { error });
      }
    }
    
    return sdks;
  }

  private async generateSDK(spec: OpenAPISpec, language: string): Promise<string> {
    // This would integrate with the SDK generation from enhanced OpenAPI service
    // For now, return a placeholder
    return `// ${language} SDK for ${spec.info.title}\n// Generated from OpenAPI spec v${spec.info.version}`;
  }
}

// Export singleton instance
export const documentToAPIService = new DocumentToAPIService();
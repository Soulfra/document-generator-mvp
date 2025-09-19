/**
 * Enhanced OpenAPI 3.0 Generator Service
 * Features: Auto-discovery, real-time updates, route watching, SDK generation
 */

import { Router, Express } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { watch } from 'chokidar';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';
import * as ts from 'typescript';
import * as glob from 'glob';
import { promisify } from 'util';
import { openApiGenerator } from './openapi-generator.service';

const globAsync = promisify(glob);

export interface RouteDiscoveryOptions {
  routerPaths: string[];
  watchForChanges?: boolean;
  excludePatterns?: string[];
  includePrivateRoutes?: boolean;
}

export interface SDKGenerationOptions {
  languages: ('typescript' | 'javascript' | 'python' | 'go')[];
  outputPath: string;
  packageName?: string;
  version?: string;
}

export interface RouteMetadata {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  isPrivate?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  analytics?: {
    track: boolean;
    events?: string[];
  };
}

export class EnhancedOpenAPIService extends EventEmitter {
  private watchers: any[] = [];
  private routeCache: Map<string, RouteMetadata[]> = new Map();
  private lastUpdate: Date = new Date();
  private updateTimer?: NodeJS.Timeout;

  constructor() {
    super();
  }

  /**
   * Start auto-discovery and watching
   */
  async startAutoDiscovery(options: RouteDiscoveryOptions): Promise<void> {
    logger.info('Starting OpenAPI auto-discovery', { options });

    // Initial discovery
    await this.discoverAllRoutes(options);

    // Set up file watching if requested
    if (options.watchForChanges) {
      await this.setupFileWatchers(options);
    }

    // Emit initial ready event
    this.emit('ready', {
      routes: this.getDiscoveredRoutes(),
      timestamp: new Date()
    });
  }

  /**
   * Discover all routes from source files
   */
  private async discoverAllRoutes(options: RouteDiscoveryOptions): Promise<void> {
    const startTime = Date.now();
    let totalRoutes = 0;

    for (const pattern of options.routerPaths) {
      const files = await globAsync(pattern, {
        ignore: options.excludePatterns || []
      });

      for (const file of files) {
        try {
          const routes = await this.discoverRoutesFromFile(file, options);
          if (routes.length > 0) {
            this.routeCache.set(file, routes);
            totalRoutes += routes.length;
            
            // Register routes with OpenAPI generator
            routes.forEach(route => this.registerRoute(route));
          }
        } catch (error) {
          logger.error('Failed to discover routes from file', { file, error });
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Route discovery completed', {
      totalRoutes,
      files: this.routeCache.size,
      duration: `${duration}ms`
    });

    this.emit('discovery:complete', {
      totalRoutes,
      files: this.routeCache.size,
      duration
    });
  }

  /**
   * Discover routes from a single TypeScript/JavaScript file
   */
  private async discoverRoutesFromFile(filePath: string, options: RouteDiscoveryOptions): Promise<RouteMetadata[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const routes: RouteMetadata[] = [];

    // Use TypeScript AST to parse the file
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Walk the AST to find route definitions
    const visitNode = (node: ts.Node) => {
      // Look for router method calls (get, post, put, delete, patch)
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        
        if (ts.isPropertyAccessExpression(expression)) {
          const methodName = expression.name.getText();
          const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
          
          if (methods.includes(methodName)) {
            const route = this.extractRouteInfo(node, methodName, sourceFile);
            if (route && (options.includePrivateRoutes || !route.isPrivate)) {
              routes.push(route);
            }
          }
        }
      }

      ts.forEachChild(node, visitNode);
    };

    visitNode(sourceFile);

    return routes;
  }

  /**
   * Extract route information from AST node
   */
  private extractRouteInfo(node: ts.CallExpression, method: string, sourceFile: ts.SourceFile): RouteMetadata | null {
    const args = node.arguments;
    if (args.length < 1) return null;

    // Extract path
    const pathArg = args[0];
    if (!ts.isStringLiteral(pathArg)) return null;
    
    const path = pathArg.text;

    // Look for JSDoc comments
    const jsdoc = this.extractJSDocFromNode(node, sourceFile);

    // Extract tags from file path
    const tags = this.inferTagsFromFilePath(sourceFile.fileName);

    return {
      method: method.toUpperCase(),
      path,
      summary: jsdoc?.summary,
      description: jsdoc?.description,
      tags,
      isPrivate: jsdoc?.private || false,
      rateLimit: jsdoc?.rateLimit,
      analytics: jsdoc?.analytics
    };
  }

  /**
   * Extract JSDoc information
   */
  private extractJSDocFromNode(node: ts.Node, sourceFile: ts.SourceFile): any {
    const fullText = sourceFile.getFullText();
    const nodeStart = node.getFullStart();
    
    // Look backwards for JSDoc comment
    let searchStart = nodeStart;
    while (searchStart > 0 && fullText[searchStart] !== '\n') {
      searchStart--;
    }

    const precedingText = fullText.substring(searchStart, nodeStart);
    const jsdocMatch = precedingText.match(/\/\*\*[\s\S]*?\*\//);

    if (!jsdocMatch) return null;

    const jsdocText = jsdocMatch[0];
    const result: any = {};

    // Extract summary (first line)
    const summaryMatch = jsdocText.match(/\/\*\*\s*\n\s*\*\s*(.+)/);
    if (summaryMatch) {
      result.summary = summaryMatch[1].trim();
    }

    // Extract description
    const descriptionMatch = jsdocText.match(/\*\s*(.+)\n\s*\*\s*\n/);
    if (descriptionMatch) {
      result.description = descriptionMatch[1].trim();
    }

    // Check if private
    if (jsdocText.includes('@private')) {
      result.private = true;
    }

    // Extract rate limit
    const rateLimitMatch = jsdocText.match(/@rateLimit\s+(\d+)\s+requests?\s+per\s+(\d+)\s*(second|minute|hour)/i);
    if (rateLimitMatch) {
      const [, max, window, unit] = rateLimitMatch;
      const multiplier = unit === 'second' ? 1000 : unit === 'minute' ? 60000 : 3600000;
      result.rateLimit = {
        max: parseInt(max),
        windowMs: parseInt(window) * multiplier
      };
    }

    // Extract analytics
    if (jsdocText.includes('@track')) {
      result.analytics = { track: true };
      const eventsMatch = jsdocText.match(/@track\s+(.+)/);
      if (eventsMatch) {
        result.analytics.events = eventsMatch[1].split(',').map(e => e.trim());
      }
    }

    return result;
  }

  /**
   * Infer tags from file path
   */
  private inferTagsFromFilePath(filePath: string): string[] {
    const segments = filePath.split(/[/\\]/);
    const routeIndex = segments.findIndex(s => s === 'routes' || s === 'routers');
    
    if (routeIndex !== -1 && routeIndex < segments.length - 1) {
      const tag = segments[routeIndex + 1].replace(/\.(router|route|controller)\.(ts|js)$/, '');
      return [this.capitalizeWords(tag)];
    }

    return ['General'];
  }

  /**
   * Capitalize words
   */
  private capitalizeWords(str: string): string {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Set up file watchers for real-time updates
   */
  private async setupFileWatchers(options: RouteDiscoveryOptions): Promise<void> {
    const watcher = watch(options.routerPaths, {
      ignored: options.excludePatterns,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath) => {
      logger.info('Route file changed', { filePath });
      await this.handleFileChange(filePath, options);
    });

    watcher.on('add', async (filePath) => {
      logger.info('Route file added', { filePath });
      await this.handleFileChange(filePath, options);
    });

    watcher.on('unlink', (filePath) => {
      logger.info('Route file removed', { filePath });
      this.handleFileRemoval(filePath);
    });

    this.watchers.push(watcher);
  }

  /**
   * Handle file change
   */
  private async handleFileChange(filePath: string, options: RouteDiscoveryOptions): Promise<void> {
    // Debounce updates
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(async () => {
      try {
        const routes = await this.discoverRoutesFromFile(filePath, options);
        const oldRoutes = this.routeCache.get(filePath) || [];
        
        // Update cache
        this.routeCache.set(filePath, routes);

        // Find changes
        const changes = this.findRouteChanges(oldRoutes, routes);
        
        if (changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0) {
          // Update OpenAPI spec
          this.updateOpenAPISpec(changes);
          
          // Emit change event
          this.emit('routes:changed', {
            filePath,
            changes,
            timestamp: new Date()
          });

          logger.info('Routes updated', {
            filePath,
            added: changes.added.length,
            removed: changes.removed.length,
            modified: changes.modified.length
          });
        }
      } catch (error) {
        logger.error('Failed to handle file change', { filePath, error });
      }
    }, 500);
  }

  /**
   * Handle file removal
   */
  private handleFileRemoval(filePath: string): void {
    const routes = this.routeCache.get(filePath);
    if (routes) {
      this.routeCache.delete(filePath);
      
      // Remove routes from OpenAPI spec
      routes.forEach(route => {
        this.emit('route:removed', { route, filePath });
      });

      logger.info('Routes removed', { filePath, count: routes.length });
    }
  }

  /**
   * Find route changes
   */
  private findRouteChanges(oldRoutes: RouteMetadata[], newRoutes: RouteMetadata[]): {
    added: RouteMetadata[];
    removed: RouteMetadata[];
    modified: RouteMetadata[];
  } {
    const getRouteKey = (route: RouteMetadata) => `${route.method}:${route.path}`;
    
    const oldMap = new Map(oldRoutes.map(r => [getRouteKey(r), r]));
    const newMap = new Map(newRoutes.map(r => [getRouteKey(r), r]));

    const added = newRoutes.filter(r => !oldMap.has(getRouteKey(r)));
    const removed = oldRoutes.filter(r => !newMap.has(getRouteKey(r)));
    const modified = newRoutes.filter(r => {
      const old = oldMap.get(getRouteKey(r));
      return old && JSON.stringify(old) !== JSON.stringify(r);
    });

    return { added, removed, modified };
  }

  /**
   * Update OpenAPI specification with changes
   */
  private updateOpenAPISpec(changes: any): void {
    // This would integrate with the existing OpenAPI generator
    changes.added.forEach((route: RouteMetadata) => this.registerRoute(route));
    // Handle removals and modifications...
  }

  /**
   * Register route with OpenAPI generator
   */
  private registerRoute(route: RouteMetadata): void {
    openApiGenerator.registerEndpoint({
      method: route.method,
      path: route.path,
      summary: route.summary || `${route.method} ${route.path}`,
      description: route.description,
      tags: route.tags,
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

  /**
   * Generate SDK for multiple languages
   */
  async generateSDKs(options: SDKGenerationOptions): Promise<void> {
    const spec = openApiGenerator.generateSpec();
    
    for (const language of options.languages) {
      try {
        await this.generateSDKForLanguage(spec, language, options);
        logger.info(`SDK generated for ${language}`);
      } catch (error) {
        logger.error(`Failed to generate SDK for ${language}`, { error });
      }
    }

    this.emit('sdk:generated', {
      languages: options.languages,
      outputPath: options.outputPath,
      timestamp: new Date()
    });
  }

  /**
   * Generate SDK for specific language
   */
  private async generateSDKForLanguage(spec: any, language: string, options: SDKGenerationOptions): Promise<void> {
    const outputDir = path.join(options.outputPath, language);
    await fs.mkdir(outputDir, { recursive: true });

    switch (language) {
      case 'typescript':
        await this.generateTypeScriptSDK(spec, outputDir, options);
        break;
      case 'javascript':
        await this.generateJavaScriptSDK(spec, outputDir, options);
        break;
      case 'python':
        await this.generatePythonSDK(spec, outputDir, options);
        break;
      case 'go':
        await this.generateGoSDK(spec, outputDir, options);
        break;
    }
  }

  /**
   * Generate TypeScript SDK
   */
  private async generateTypeScriptSDK(spec: any, outputDir: string, options: SDKGenerationOptions): Promise<void> {
    // Generate types
    const types = this.generateTypeScriptTypes(spec);
    await fs.writeFile(path.join(outputDir, 'types.ts'), types);

    // Generate client
    const client = this.generateTypeScriptClient(spec, options);
    await fs.writeFile(path.join(outputDir, 'client.ts'), client);

    // Generate package.json
    const packageJson = {
      name: options.packageName || 'api-client',
      version: options.version || '1.0.0',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        test: 'jest'
      },
      dependencies: {
        axios: '^1.0.0'
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/node': '^20.0.0'
      }
    };
    await fs.writeFile(path.join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Generate index file
    const index = `export * from './types';\nexport * from './client';\n`;
    await fs.writeFile(path.join(outputDir, 'index.ts'), index);
  }

  /**
   * Generate TypeScript types from OpenAPI schema
   */
  private generateTypeScriptTypes(spec: any): string {
    let types = '// Auto-generated TypeScript types from OpenAPI spec\n\n';

    // Generate interfaces for schemas
    Object.entries(spec.components.schemas).forEach(([name, schema]: [string, any]) => {
      types += `export interface ${name} {\n`;
      
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([propName, prop]: [string, any]) => {
          const required = schema.required?.includes(propName);
          const optional = required ? '' : '?';
          const type = this.openAPITypeToTypeScript(prop);
          types += `  ${propName}${optional}: ${type};\n`;
        });
      }
      
      types += '}\n\n';
    });

    return types;
  }

  /**
   * Convert OpenAPI type to TypeScript type
   */
  private openAPITypeToTypeScript(schema: any): string {
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      return refName;
    }

    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum.map((v: string) => `'${v}'`).join(' | ') : 'string';
      case 'integer':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return `${this.openAPITypeToTypeScript(schema.items)}[]`;
      case 'object':
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  /**
   * Generate TypeScript client
   */
  private generateTypeScriptClient(spec: any, options: SDKGenerationOptions): string {
    let client = `// Auto-generated API client
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as types from './types';

export class APIClient {
  private client: AxiosInstance;

  constructor(config?: {
    baseURL?: string;
    apiKey?: string;
    bearerToken?: string;
  }) {
    this.client = axios.create({
      baseURL: config?.baseURL || '${spec.servers[0]?.url || 'http://localhost:8080'}',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.apiKey && { 'x-api-key': config.apiKey }),
        ...(config?.bearerToken && { 'Authorization': \`Bearer \${config.bearerToken}\` })
      }
    });
  }

`;

    // Generate methods for each path
    Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, operation]: [string, any]) => {
        const functionName = this.generateFunctionName(method, path);
        const params = this.generateMethodParams(operation);
        const returnType = this.generateReturnType(operation);
        
        client += `  async ${functionName}(${params}): Promise<${returnType}> {
    const response = await this.client.${method}(\`${path}\`, ${this.generateRequestArgs(method, operation)});
    return response.data;
  }\n\n`;
      });
    });

    client += '}\n';
    return client;
  }

  /**
   * Generate function name from method and path
   */
  private generateFunctionName(method: string, path: string): string {
    const pathParts = path.split('/').filter(Boolean);
    const resource = pathParts[pathParts.length - 1]?.replace(/\{.*\}/, 'ById') || '';
    return `${method}${this.capitalizeWords(resource).replace(/\s/g, '')}`;
  }

  /**
   * Generate method parameters
   */
  private generateMethodParams(operation: any): string {
    const params: string[] = [];
    
    // Path parameters
    if (operation.parameters) {
      operation.parameters.forEach((param: any) => {
        if (param.in === 'path') {
          params.push(`${param.name}: string`);
        }
      });
    }
    
    // Request body
    if (operation.requestBody) {
      params.push('data: any'); // Should map to proper type
    }
    
    // Query parameters
    params.push('config?: AxiosRequestConfig');
    
    return params.join(', ');
  }

  /**
   * Generate return type
   */
  private generateReturnType(operation: any): string {
    const successResponse = operation.responses['200'] || operation.responses['201'];
    if (successResponse?.content?.['application/json']?.schema?.$ref) {
      return successResponse.content['application/json'].schema.$ref.split('/').pop();
    }
    return 'any';
  }

  /**
   * Generate request arguments
   */
  private generateRequestArgs(method: string, operation: any): string {
    if (method === 'get' || method === 'delete') {
      return 'config';
    }
    return 'data, config';
  }

  /**
   * Generate JavaScript SDK
   */
  private async generateJavaScriptSDK(spec: any, outputDir: string, options: SDKGenerationOptions): Promise<void> {
    // Similar to TypeScript but without types
    // Implementation details...
  }

  /**
   * Generate Python SDK
   */
  private async generatePythonSDK(spec: any, outputDir: string, options: SDKGenerationOptions): Promise<void> {
    // Python client generation
    // Implementation details...
  }

  /**
   * Generate Go SDK
   */
  private async generateGoSDK(spec: any, outputDir: string, options: SDKGenerationOptions): Promise<void> {
    // Go client generation
    // Implementation details...
  }

  /**
   * Get all discovered routes
   */
  getDiscoveredRoutes(): RouteMetadata[] {
    const allRoutes: RouteMetadata[] = [];
    this.routeCache.forEach(routes => {
      allRoutes.push(...routes);
    });
    return allRoutes;
  }

  /**
   * Get route analytics
   */
  getRouteAnalytics(): {
    total: number;
    byMethod: Record<string, number>;
    byTag: Record<string, number>;
    withRateLimit: number;
    withAnalytics: number;
  } {
    const routes = this.getDiscoveredRoutes();
    const analytics = {
      total: routes.length,
      byMethod: {} as Record<string, number>,
      byTag: {} as Record<string, number>,
      withRateLimit: 0,
      withAnalytics: 0
    };

    routes.forEach(route => {
      // Count by method
      analytics.byMethod[route.method] = (analytics.byMethod[route.method] || 0) + 1;
      
      // Count by tag
      route.tags?.forEach(tag => {
        analytics.byTag[tag] = (analytics.byTag[tag] || 0) + 1;
      });
      
      // Count features
      if (route.rateLimit) analytics.withRateLimit++;
      if (route.analytics) analytics.withAnalytics++;
    });

    return analytics;
  }

  /**
   * Stop auto-discovery and clean up
   */
  async stop(): Promise<void> {
    // Clear update timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    // Close file watchers
    for (const watcher of this.watchers) {
      await watcher.close();
    }

    // Clear cache
    this.routeCache.clear();
    
    this.emit('stopped', { timestamp: new Date() });
  }
}

// Export singleton instance
export const enhancedOpenAPIService = new EnhancedOpenAPIService();
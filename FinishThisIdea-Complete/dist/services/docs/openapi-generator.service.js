"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiGenerator = exports.OpenAPIGeneratorService = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger_1 = require("../../utils/logger");
class OpenAPIGeneratorService {
    spec;
    routes = new Map();
    constructor() {
        this.spec = this.createBaseSpec();
    }
    createBaseSpec() {
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
    createBaseSchemas() {
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
    createCommonResponses() {
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
    createCommonParameters() {
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
    registerEndpoint(endpoint) {
        const normalizedPath = this.normalizePath(endpoint.path);
        if (!this.routes.has(normalizedPath)) {
            this.routes.set(normalizedPath, []);
        }
        this.routes.get(normalizedPath).push(endpoint);
        this.addPathToSpec(endpoint);
    }
    normalizePath(path) {
        return path.replace(/:([^/]+)/g, '{$1}');
    }
    addPathToSpec(endpoint) {
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
    discoverEndpoints(router, basePath = '') {
        const routes = router.stack;
        routes.forEach((layer) => {
            if (layer.route) {
                const path = basePath + layer.route.path;
                const methods = Object.keys(layer.route.methods);
                methods.forEach(method => {
                    if (method !== '_all') {
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
    inferTags(path) {
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 1 && segments[0] === 'api') {
            const resourceName = segments[1];
            return [this.capitalizeFirst(resourceName)];
        }
        return ['General'];
    }
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    generateSpec() {
        return { ...this.spec };
    }
    generateJSON() {
        return JSON.stringify(this.spec, null, 2);
    }
    generateYAML() {
        const yaml = require('js-yaml');
        return yaml.dump(this.spec, {
            indent: 2,
            lineWidth: 120,
            noRefs: true
        });
    }
    async saveToFile(filePath, format = 'json') {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        const content = format === 'yaml' ? this.generateYAML() : this.generateJSON();
        await fs.writeFile(filePath, content, 'utf8');
        logger_1.logger.info('OpenAPI specification saved', { filePath, format });
    }
    importExistingDocs(docsData) {
        if (docsData.endpoints) {
            docsData.endpoints.forEach((endpoint) => {
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
    convertParameters(params) {
        if (!params)
            return undefined;
        return params.map(param => ({
            name: param.name,
            in: param.in || 'query',
            description: param.description,
            required: param.required || false,
            schema: param.schema || { type: 'string' }
        }));
    }
    convertRequestBody(body) {
        if (!body)
            return undefined;
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
    convertResponses(responses) {
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
        const converted = {};
        Object.entries(responses).forEach(([status, response]) => {
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
    addSchema(name, schema) {
        this.spec.components.schemas[name] = schema;
    }
    getEndpointsCount() {
        let count = 0;
        this.routes.forEach(endpoints => {
            count += endpoints.length;
        });
        return count;
    }
    getStats() {
        return {
            paths: Object.keys(this.spec.paths).length,
            endpoints: this.getEndpointsCount(),
            schemas: Object.keys(this.spec.components.schemas).length,
            tags: this.spec.tags.length
        };
    }
}
exports.OpenAPIGeneratorService = OpenAPIGeneratorService;
exports.openApiGenerator = new OpenAPIGeneratorService();
//# sourceMappingURL=openapi-generator.service.js.map
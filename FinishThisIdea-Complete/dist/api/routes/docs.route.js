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
exports.docsRouter = void 0;
const express_1 = require("express");
const openapi_generator_service_1 = require("../../services/docs/openapi-generator.service");
const logger_1 = require("../../utils/logger");
const path = __importStar(require("path"));
const router = (0, express_1.Router)();
exports.docsRouter = router;
async function initializeDocumentation() {
    try {
        const apiKeysDocs = {
            endpoints: [
                {
                    method: 'GET',
                    path: '/api/api-keys',
                    summary: 'List API keys',
                    description: 'Get all API keys for the authenticated user',
                    tags: ['API Keys'],
                    parameters: [
                        { name: 'page', in: 'query', description: 'Page number', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', description: 'Items per page', schema: { type: 'integer', default: 20 } }
                    ],
                    responses: {
                        '200': {
                            description: 'List of API keys',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/ApiKey' }
                                            },
                                            pagination: {
                                                type: 'object',
                                                properties: {
                                                    page: { type: 'integer' },
                                                    limit: { type: 'integer' },
                                                    total: { type: 'integer' },
                                                    totalPages: { type: 'integer' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    method: 'POST',
                    path: '/api/api-keys',
                    summary: 'Create API key',
                    description: 'Create a new API key for the authenticated user',
                    tags: ['API Keys'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string', description: 'API key name' },
                                        tier: { type: 'string', enum: ['FREE', 'PREMIUM', 'ENTERPRISE'], description: 'API key tier' }
                                    },
                                    required: ['name', 'tier']
                                },
                                example: {
                                    name: 'My API Key',
                                    tier: 'PREMIUM'
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'API key created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { $ref: '#/components/schemas/ApiKey' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    method: 'GET',
                    path: '/api/api-keys/{id}',
                    summary: 'Get API key',
                    description: 'Get a specific API key by ID',
                    tags: ['API Keys'],
                    parameters: [
                        { name: 'id', in: 'path', required: true, description: 'API key ID', schema: { type: 'string' } }
                    ],
                    responses: {
                        '200': {
                            description: 'API key details',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { $ref: '#/components/schemas/ApiKey' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    method: 'DELETE',
                    path: '/api/api-keys/{id}',
                    summary: 'Delete API key',
                    description: 'Delete a specific API key by ID',
                    tags: ['API Keys'],
                    parameters: [
                        { name: 'id', in: 'path', required: true, description: 'API key ID', schema: { type: 'string' } }
                    ],
                    responses: {
                        '200': {
                            description: 'API key deleted successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        };
        const coreEndpoints = [
            {
                method: 'GET',
                path: '/api/health',
                summary: 'Health check',
                description: 'Get system health status and service availability',
                tags: ['Monitoring'],
                responses: {
                    '200': {
                        description: 'System health status',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/HealthCheck' }
                            }
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/jobs',
                summary: 'List jobs',
                description: 'Get all cleanup jobs for the authenticated user',
                tags: ['Jobs'],
                parameters: [
                    { $ref: '#/components/parameters/PageNumber' },
                    { $ref: '#/components/parameters/PageSize' },
                    { name: 'status', in: 'query', description: 'Filter by job status', schema: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] } }
                ],
                responses: {
                    '200': {
                        description: 'List of jobs',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Job' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                method: 'POST',
                path: '/api/jobs',
                summary: 'Create job',
                description: 'Create a new code cleanup job',
                tags: ['Jobs'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    uploadId: { type: 'string' },
                                    profileId: { type: 'string' }
                                },
                                required: ['email', 'uploadId']
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Job created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Job' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                method: 'POST',
                path: '/api/upload',
                summary: 'Upload file',
                description: 'Upload a file for code cleanup',
                tags: ['Uploads'],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    profileId: { type: 'string' }
                                },
                                required: ['file']
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'File uploaded successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Upload' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                method: 'POST',
                path: '/api/qr/referral',
                summary: 'Generate referral QR code',
                description: 'Generate a QR code for referral links',
                tags: ['QR Codes'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    referralCode: { type: 'string' },
                                    baseUrl: { type: 'string', format: 'uri' },
                                    options: {
                                        type: 'object',
                                        properties: {
                                            width: { type: 'integer', minimum: 50, maximum: 1000 },
                                            errorCorrectionLevel: { type: 'string', enum: ['L', 'M', 'Q', 'H'] }
                                        }
                                    }
                                },
                                required: ['referralCode']
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'QR code generated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string' },
                                                dataUrl: { type: 'string' },
                                                url: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/api/monitoring/metrics',
                summary: 'Get system metrics',
                description: 'Get system performance metrics',
                tags: ['Monitoring'],
                responses: {
                    '200': {
                        description: 'System metrics',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                timestamp: { type: 'string', format: 'date-time' },
                                                cpu: { type: 'object' },
                                                memory: { type: 'object' },
                                                requests: { type: 'object' },
                                                errors: { type: 'object' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ];
        openapi_generator_service_1.openApiGenerator.importExistingDocs(apiKeysDocs);
        openapi_generator_service_1.openApiGenerator.importExistingDocs({ endpoints: coreEndpoints });
        logger_1.logger.info('API documentation initialized', {
            stats: openapi_generator_service_1.openApiGenerator.getStats()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize API documentation', error);
    }
}
function generateSwaggerUI(specUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FinishThisIdea API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-16x16.png" sizes="16x16" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #1d4ed8;
    }
    .swagger-ui .topbar .download-url-wrapper .select-label {
      color: #fff;
    }
    .swagger-ui .topbar .download-url-wrapper input[type=text] {
      border-color: #1d4ed8;
    }
    .swagger-ui .info .title {
      color: #1d4ed8;
    }
    .custom-header {
      background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%);
      color: white;
      padding: 20px;
      text-align: center;
      margin-bottom: 0;
    }
    .custom-header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: bold;
    }
    .custom-header p {
      margin: 10px 0 0 0;
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .api-info {
      background: #f8fafc;
      border-left: 4px solid #1d4ed8;
      padding: 15px;
      margin: 20px 0;
    }
    .api-info h3 {
      color: #1d4ed8;
      margin-top: 0;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🚀 FinishThisIdea Platform API</h1>
    <p>Complete AI Innovation Platform with code cleanup, agent orchestration, and marketplace features</p>
  </div>
  
  <div class="api-info">
    <h3>🔑 Authentication</h3>
    <p>This API supports two authentication methods:</p>
    <ul>
      <li><strong>Bearer Token:</strong> Add <code>Authorization: Bearer YOUR_JWT_TOKEN</code> header</li>
      <li><strong>API Key:</strong> Add <code>x-api-key: YOUR_API_KEY</code> header</li>
    </ul>
    <p>You can manage your API keys through the <code>/api/api-keys</code> endpoints.</p>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        requestInterceptor: function(request) {
          // Add custom headers or modify requests here
          return request;
        },
        responseInterceptor: function(response) {
          // Handle responses here
          return response;
        },
        onComplete: function() {
          console.log('Swagger UI loaded successfully');
        },
        onFailure: function(error) {
          console.error('Failed to load Swagger UI:', error);
        },
        validatorUrl: null,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        docExpansion: 'list',
        defaultModelExpandDepth: 2,
        defaultModelsExpandDepth: 1,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        persistAuthorization: true
      });
      
      window.ui = ui;
    };
  </script>
</body>
</html>`;
}
router.get('/', (req, res) => {
    const specUrl = `${req.protocol}://${req.get('host')}/api/docs/openapi.json`;
    const html = generateSwaggerUI(specUrl);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});
router.get('/openapi.json', (req, res) => {
    try {
        const spec = openapi_generator_service_1.openApiGenerator.generateSpec();
        res.json(spec);
    }
    catch (error) {
        logger_1.logger.error('Failed to generate OpenAPI spec', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SPEC_GENERATION_FAILED',
                message: 'Failed to generate OpenAPI specification'
            }
        });
    }
});
router.get('/openapi.yaml', (req, res) => {
    try {
        const yaml = openapi_generator_service_1.openApiGenerator.generateYAML();
        res.setHeader('Content-Type', 'text/yaml');
        res.send(yaml);
    }
    catch (error) {
        logger_1.logger.error('Failed to generate OpenAPI YAML', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'YAML_GENERATION_FAILED',
                message: 'Failed to generate OpenAPI YAML'
            }
        });
    }
});
router.get('/redoc', (req, res) => {
    const specUrl = `${req.protocol}://${req.get('host')}/api/docs/openapi.json`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>FinishThisIdea API - ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
    .custom-header {
      background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%);
      color: white;
      padding: 20px;
      text-align: center;
    }
    .custom-header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: bold;
    }
    .custom-header p {
      margin: 10px 0 0 0;
      font-size: 1.1rem;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🚀 FinishThisIdea Platform API</h1>
    <p>Complete API reference with interactive examples</p>
  </div>
  <redoc spec-url='${specUrl}' theme='{ "colors": { "primary": { "main": "#1d4ed8" } } }'></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});
router.get('/postman', (req, res) => {
    try {
        const spec = openapi_generator_service_1.openApiGenerator.generateSpec();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const collection = {
            info: {
                name: spec.info.title,
                description: spec.info.description,
                version: spec.info.version,
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            auth: {
                type: "bearer",
                bearer: [
                    {
                        key: "token",
                        value: "{{jwt_token}}",
                        type: "string"
                    }
                ]
            },
            variable: [
                {
                    key: "base_url",
                    value: baseUrl,
                    type: "string"
                },
                {
                    key: "jwt_token",
                    value: "your-jwt-token-here",
                    type: "string"
                },
                {
                    key: "api_key",
                    value: "your-api-key-here",
                    type: "string"
                }
            ],
            item: []
        };
        Object.entries(spec.paths).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, operation]) => {
                if (typeof operation === 'object' && operation.summary) {
                    const item = {
                        name: operation.summary,
                        request: {
                            method: method.toUpperCase(),
                            header: [
                                {
                                    key: "Content-Type",
                                    value: "application/json",
                                    type: "text"
                                }
                            ],
                            url: {
                                raw: `{{base_url}}${path}`,
                                host: ["{{base_url}}"],
                                path: path.split('/').filter(Boolean)
                            },
                            description: operation.description
                        }
                    };
                    if (operation.requestBody?.content?.['application/json']?.example) {
                        item.request.body = {
                            mode: "raw",
                            raw: JSON.stringify(operation.requestBody.content['application/json'].example, null, 2)
                        };
                    }
                    collection.item.push(item);
                }
            });
        });
        res.json(collection);
    }
    catch (error) {
        logger_1.logger.error('Failed to generate Postman collection', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'POSTMAN_GENERATION_FAILED',
                message: 'Failed to generate Postman collection'
            }
        });
    }
});
router.get('/stats', (req, res) => {
    try {
        const stats = openapi_generator_service_1.openApiGenerator.getStats();
        res.json({
            success: true,
            data: {
                ...stats,
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get documentation stats', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'STATS_FAILED',
                message: 'Failed to get documentation statistics'
            }
        });
    }
});
router.post('/generate', async (req, res) => {
    try {
        await initializeDocumentation();
        const docsDir = path.join(process.cwd(), 'docs');
        await openapi_generator_service_1.openApiGenerator.saveToFile(path.join(docsDir, 'openapi.json'), 'json');
        await openapi_generator_service_1.openApiGenerator.saveToFile(path.join(docsDir, 'openapi.yaml'), 'yaml');
        const stats = openapi_generator_service_1.openApiGenerator.getStats();
        res.json({
            success: true,
            message: 'API documentation regenerated successfully',
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to regenerate documentation', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'REGENERATION_FAILED',
                message: 'Failed to regenerate API documentation'
            }
        });
    }
});
initializeDocumentation();
//# sourceMappingURL=docs.route.js.map